// A fully procedural audio engine — every sound (music loops and SFX) is
// synthesized live via the Web Audio API (oscillators + envelopes). No
// audio files, so the game stays fully offline with zero asset weight.

const SETTINGS_KEY = 'ziro-audio-settings'

const DEFAULT_SETTINGS = {
  masterVolume: 0.8, musicVolume: 0.6, sfxVolume: 0.9, muted: false, musicEnabled: true,
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore corrupt settings */ }
  return { ...DEFAULT_SETTINGS }
}

const state = loadSettings()
let ctx = null
let masterGain = null
let musicGain = null
let sfxGain = null
let currentLoop = null // { stop() }
let currentZoneId = null // last zone whose music was requested, for resume on toggle
const listeners = new Set()

function ensureContext() {
  if (ctx) return ctx
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = ctx.createGain()
  masterGain.gain.value = state.muted ? 0 : state.masterVolume
  masterGain.connect(ctx.destination)

  musicGain = ctx.createGain()
  musicGain.gain.value = state.musicVolume
  musicGain.connect(masterGain)

  sfxGain = ctx.createGain()
  sfxGain.gain.value = state.sfxVolume
  sfxGain.connect(masterGain)
  return ctx
}

// Browsers block audio until a user gesture — call this from the first
// keydown/click in the app (App.jsx does this once).
export function unlockAudio() {
  const c = ensureContext()
  if (c.state === 'suspended') c.resume()
}

function persist() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state))
  listeners.forEach((fn) => fn({ ...state }))
}

export function getAudioSettings() { return { ...state } }
export function onAudioSettingsChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }

export function setMasterVolume(v) {
  state.masterVolume = v
  if (masterGain && !state.muted) masterGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
  persist()
}
export function setMusicVolume(v) {
  state.musicVolume = v
  if (musicGain) musicGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
  persist()
}
export function setSfxVolume(v) {
  state.sfxVolume = v
  if (sfxGain) sfxGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05)
  persist()
}
export function toggleMute() {
  state.muted = !state.muted
  if (masterGain) masterGain.gain.setTargetAtTime(state.muted ? 0 : state.masterVolume, ctx.currentTime, 0.05)
  persist()
}

// Music on/off, independent of SFX and of the master mute. Turning it off
// stops the current zone loop; turning it back on resumes the loop for
// whatever zone the player is currently in.
export function toggleMusic() {
  state.musicEnabled = !state.musicEnabled
  if (!state.musicEnabled) {
    stopMusic()
  } else if (currentZoneId) {
    playZoneMusic(currentZoneId)
  }
  persist()
}

// ---------------------------------------------------------------------------
// Music — a tiny step-sequencer. Each zone gets a scale, tempo, waveform,
// and a short repeating melodic + bass pattern that loops indefinitely,
// scheduled a whole loop at a time against AudioContext's own clock.
// ---------------------------------------------------------------------------

const SCALES = {
  majorPent: [0, 2, 4, 7, 9],
  minorPent: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
}

const ZONE_MUSIC = {
  'sql-island': { scale: 'majorPent', root: 220, tempo: 104, wave: 'triangle', pattern: [0, 2, 4, 2, 0, 2, 3, 2] },
  'code-kingdom': { scale: 'dorian', root: 196, tempo: 92, wave: 'square', pattern: [0, null, 3, 4, 2, null, 0, null] },
  'python-jungle': { scale: 'minorPent', root: 174, tempo: 82, wave: 'sine', pattern: [0, 3, null, 2, 0, null, 3, 2] },
  'data-realm': { scale: 'minor', root: 233, tempo: 128, wave: 'sawtooth', pattern: [0, 2, 4, 2, 5, 4, 2, 0] },
  'cloud-citadel': { scale: 'major', root: 261, tempo: 100, wave: 'triangle', pattern: [4, 5, 7, 5, 4, 2, 0, 2] },
  'algorithm-dungeon': { scale: 'phrygian', root: 164, tempo: 72, wave: 'square', pattern: [0, null, 1, 0, null, 3, 1, 0] },
  'ai-frontier': { scale: 'minor', root: 220, tempo: 118, wave: 'sawtooth', pattern: [0, 3, 2, 5, 0, 3, 4, 2] },
  'healthcare-highlands': { scale: 'major', root: 261, tempo: 66, wave: 'sine', pattern: [0, null, 2, null, 4, null, 2, null] },
  'supply-chain-docks': { scale: 'minor', root: 207, tempo: 112, wave: 'square', pattern: [0, 2, 0, 3, 2, 0, 5, 3] },
  'iot-outpost': { scale: 'minorPent', root: 196, tempo: 96, wave: 'sawtooth', pattern: [0, null, 2, 3, null, 2, 0, null] },
  'web-dev-workshop': { scale: 'major', root: 293, tempo: 130, wave: 'triangle', pattern: [0, 2, 4, 5, 7, 5, 4, 2] },
  'security-stronghold': { scale: 'phrygian', root: 174, tempo: 80, wave: 'square', pattern: [0, null, 1, null, 3, 1, null, 0] },
  overworld: { scale: 'major', root: 246, tempo: 108, wave: 'triangle', pattern: [0, 2, 4, 2, 5, 4, 2, 0] },
}

function noteFreq(root, scaleName, degreeIdx, octaveShift = 0) {
  const scale = SCALES[scaleName]
  const len = scale.length
  const octave = Math.floor(degreeIdx / len) + octaveShift
  const semitone = scale[((degreeIdx % len) + len) % len]
  return root * 2 ** (octave + semitone / 12)
}

function playTone(gainNode, freq, startTime, duration, wave, peak = 0.18) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = wave
  osc.frequency.value = freq
  env.gain.setValueAtTime(0, startTime)
  env.gain.linearRampToValueAtTime(peak, startTime + 0.02)
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(env)
  env.connect(gainNode)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

function scheduleZoneLoop(zoneId) {
  const def = ZONE_MUSIC[zoneId] ?? ZONE_MUSIC.overworld
  const beatDur = 60 / def.tempo
  const loopDur = beatDur * def.pattern.length
  let stopped = false

  const bassGain = ctx.createGain()
  bassGain.gain.value = 1
  bassGain.connect(musicGain)

  let timerHandle = null

  function scheduleOnce(loopStart) {
    if (stopped) return
    def.pattern.forEach((degree, i) => {
      if (degree === null) return
      const t = loopStart + i * beatDur
      playTone(musicGain, noteFreq(def.root, def.scale, degree, 1), t, beatDur * 0.9, def.wave, 0.11)
      if (i % 4 === 0) {
        playTone(bassGain, noteFreq(def.root, def.scale, degree, -1), t, beatDur * 1.8, 'triangle', 0.09)
      }
    })
    const nextStart = loopStart + loopDur
    const delayMs = Math.max(0, (nextStart - ctx.currentTime - 0.15) * 1000)
    timerHandle = setTimeout(() => scheduleOnce(nextStart), delayMs)
  }

  scheduleOnce(ctx.currentTime + 0.05)
  return {
    stop(fadeSeconds = 1) {
      stopped = true
      clearTimeout(timerHandle)
      const now = ctx.currentTime
      musicGain.gain.setTargetAtTime(0, now, fadeSeconds / 3)
      setTimeout(() => {
        musicGain.gain.setTargetAtTime(state.musicVolume, ctx.currentTime, 0.05)
        bassGain.disconnect()
      }, fadeSeconds * 1000 + 50)
    },
  }
}

export function playZoneMusic(zoneId) {
  // remember the zone even when music is off, so toggling it back on resumes
  // the correct track without needing the scene to re-request it
  currentZoneId = zoneId
  if (!state.musicEnabled) return
  ensureContext()
  unlockAudio()
  if (currentLoop) currentLoop.stop(1)
  musicGain.gain.cancelScheduledValues(ctx.currentTime)
  musicGain.gain.setValueAtTime(0, ctx.currentTime)
  musicGain.gain.linearRampToValueAtTime(state.musicVolume, ctx.currentTime + 1)
  currentLoop = scheduleZoneLoop(zoneId)
}

export function stopMusic() {
  if (currentLoop) { currentLoop.stop(1); currentLoop = null }
}

// ---------------------------------------------------------------------------
// SFX — short one-shot synthesized sounds.
// ---------------------------------------------------------------------------

function beep(freq, duration, wave = 'square', peak = 0.25, glideTo = null) {
  ensureContext()
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, t)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + duration)
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(peak, t + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(env)
  env.connect(sfxGain)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

function chord(freqs, duration, wave, peak) {
  freqs.forEach((f) => beep(f, duration, wave, peak))
}

export const sfx = {
  talk() { beep(520, 0.05, 'square', 0.12) },
  typeChar() { beep(700 + Math.random() * 200, 0.02, 'square', 0.05) },
  correct() { chord([523, 659, 784], 0.3, 'triangle', 0.16) },
  wrong() { beep(140, 0.35, 'sawtooth', 0.2, 90) },
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.25, 'triangle', 0.18), i * 90))
  },
  xpGain() { beep(880, 0.12, 'sine', 0.14, 1200) },
  zoneComplete() {
    [392, 494, 587, 784, 987].forEach((f, i) => setTimeout(() => beep(f, 0.35, 'triangle', 0.18), i * 110))
  },
  itemPickup() { beep(660, 0.1, 'square', 0.14, 990) },
  doorOpen() { beep(220, 0.3, 'sawtooth', 0.15, 440) },
  menuOpen() { beep(440, 0.08, 'sine', 0.1, 660) },
  menuClose() { beep(440, 0.08, 'sine', 0.1, 260) },
  codeRun() { beep(300, 0.05, 'square', 0.1); setTimeout(() => beep(500, 0.08, 'sine', 0.12), 60) },
  codeSuccess() { chord([659, 830, 987], 0.3, 'triangle', 0.16) },
  codeError() { beep(160, 0.3, 'sawtooth', 0.2, 100) },
  hintUsed() { beep(880, 0.15, 'sine', 0.1, 1100) },
  achievement() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.3, 'triangle', 0.2), i * 100))
  },
  footstep(surface = 'ground') {
    const freq = { sand: 260, stone: 140, grass: 320, metal: 420 }[surface] ?? 220
    beep(freq, 0.05, 'square', 0.05)
  },
}
