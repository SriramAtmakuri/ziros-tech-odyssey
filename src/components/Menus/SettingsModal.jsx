import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import {
  getAudioSettings, onAudioSettingsChange, setMasterVolume, setMusicVolume, setSfxVolume, toggleMute, toggleMusic,
} from '../../utils/audioEngine.js'
import { getUiPrefs, onUiPrefsChange, setFontSize, setReduceMotion } from '../../utils/uiPrefs.js'
import {
  getKeybinds, onKeybindsChange, setKeybind, resetKeybinds, isKeyReserved, actionUsingKey, setCapturingKeybind,
} from '../../utils/keybinds.js'
import { IconSettings, IconVolumeOn, IconVolumeOff } from '../icons/Icons.jsx'

const ACTION_LABELS = {
  up: 'Move up', down: 'Move down', left: 'Move left', right: 'Move right', run: 'Run', interact: 'Interact',
}

// Reads the next physical key pressed and turns it into the same key-name
// string keybinds.js/Phaser expect ('W', 'SHIFT', 'CTRL', 'ALT', ...) —
// letters only, plus the three modifiers, so it always matches a real
// Phaser.Input.Keyboard.KeyCodes name that addKeys() can resolve.
function keyNameFromEvent(e) {
  if (e.key === 'Shift') return 'SHIFT'
  if (e.key === 'Control') return 'CTRL'
  if (e.key === 'Alt') return 'ALT'
  if (/^[a-zA-Z]$/.test(e.key)) return e.key.toUpperCase()
  return null
}

function RebindRow({ action, keyValue, onRebind }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setCapturingKeybind(listening)
    if (!listening) return undefined
    const onKey = (e) => {
      // Escape is deliberately NOT handled here — let it fall through to
      // App.jsx's global handler, which closes the whole Settings modal.
      // That naturally unmounts (and resets) this row too, so there's no
      // need to fight over who "owns" the same window keydown event.
      if (e.key === 'Escape') return
      e.preventDefault()
      const name = keyNameFromEvent(e)
      if (!name) { setError('Letter keys (or Shift/Ctrl/Alt) only'); return }
      if (isKeyReserved(name)) { setError(`${name} is a menu shortcut — pick another key`); return }
      const conflictingAction = actionUsingKey(name, action)
      if (conflictingAction) { setError(`${name} is already used by "${ACTION_LABELS[conflictingAction]}"`); return }
      onRebind(action, name)
      setListening(false)
      setError('')
    }
    window.addEventListener('keydown', onKey)
    // Also covers the "modal closes while a row is still listening" case
    // (e.g. Escape) — unmounting must not leave the capturing flag stuck.
    return () => {
      window.removeEventListener('keydown', onKey)
      setCapturingKeybind(false)
    }
  }, [listening, action, onRebind])

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{ACTION_LABELS[action]}</span>
        <button
          type="button"
          onClick={() => { setListening((v) => !v); setError('') }}
          className={`text-xs px-3 py-1 rounded-md font-medium font-mono transition-colors ${
            listening ? 'bg-amber-400/90 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/20'
          }`}
        >
          {listening ? 'Press a key… (click to cancel)' : keyValue}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400 mt-1 text-right">{error}</p>}
    </div>
  )
}

function Slider({ label, value, onChange }) {
  return (
    <label className="block mb-3">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
    </label>
  )
}

export default function SettingsModal({ onExitToMenu }) {
  const show = useGameStore((s) => s.showSettings)
  const toggleSettings = useGameStore((s) => s.toggleSettings)
  const clearSave = useGameStore((s) => s.clearSave)

  const [audio, setAudio] = useState(getAudioSettings)
  const [prefs, setPrefs] = useState(getUiPrefs)
  const [keybinds, setKeybinds] = useState(getKeybinds)

  useEffect(() => onAudioSettingsChange(setAudio), [])
  useEffect(() => onUiPrefsChange(setPrefs), [])
  useEffect(() => onKeybindsChange(setKeybinds), [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={toggleSettings}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-950 border border-white/10 rounded-2xl p-6 w-80 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
              <IconSettings className="w-5 h-5 text-slate-300" /> Settings
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Audio</span>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {audio.muted ? <IconVolumeOff className="w-3.5 h-3.5" /> : <IconVolumeOn className="w-3.5 h-3.5" />}
                  {audio.muted ? 'Muted [M]' : 'On [M]'}
                </button>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-300">Music</span>
                <button
                  type="button"
                  onClick={toggleMusic}
                  aria-pressed={audio.musicEnabled}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    audio.musicEnabled
                      ? 'bg-amber-400/90 text-slate-950 hover:bg-amber-300'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {audio.musicEnabled ? 'On' : 'Off'}
                </button>
              </div>
              <Slider label="Master Volume" value={audio.masterVolume} onChange={setMasterVolume} />
              <Slider label="Music Volume" value={audio.musicVolume} onChange={setMusicVolume} />
              <Slider label="SFX Volume" value={audio.sfxVolume} onChange={setSfxVolume} />
            </div>

            <div className="mb-4 pt-3 border-t border-white/10">
              <span className="text-xs uppercase tracking-wide text-slate-500 block mb-2">Accessibility</span>
              <label className="flex items-center justify-between text-sm text-slate-300 mb-2">
                <span>Large text</span>
                <input
                  type="checkbox"
                  checked={prefs.fontSize === 'large'}
                  onChange={(e) => setFontSize(e.target.checked ? 'large' : 'normal')}
                  className="accent-amber-400 w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between text-sm text-slate-300">
                <span>Reduce motion</span>
                <input
                  type="checkbox"
                  checked={prefs.reduceMotion}
                  onChange={(e) => setReduceMotion(e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
              </label>
            </div>

            <div className="mb-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Controls</span>
                <button
                  type="button"
                  onClick={resetKeybinds}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                >
                  Reset
                </button>
              </div>
              {Object.keys(ACTION_LABELS).map((action) => (
                <RebindRow key={action} action={action} keyValue={keybinds[action]} onRebind={setKeybind} />
              ))}
              <p className="text-[11px] text-slate-500 mt-1">Arrow keys always move, no matter how these are set.</p>
            </div>

            <div className="pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={toggleSettings}
                className="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 text-sm font-medium mb-2 transition-colors"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => { toggleSettings(); onExitToMenu() }}
                className="w-full bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 text-sm font-medium mb-2 transition-colors"
              >
                Exit to Main Menu
              </button>
              <button
                type="button"
                onClick={() => {
                  // eslint-disable-next-line no-alert
                  if (window.confirm('Erase all progress? This cannot be undone.')) {
                    clearSave()
                    toggleSettings()
                    onExitToMenu()
                  }
                }}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Clear Save Data
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
