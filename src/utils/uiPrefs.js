// Small persisted UI preferences (accessibility toggles), separate from
// audioEngine.js's settings and from the save-game state in gameStore.js.
const KEY = 'ziro-ui-prefs'
const defaults = { fontSize: 'normal', reduceMotion: false }

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch { /* ignore corrupt prefs */ }
  return { ...defaults }
}

const state = load()
const listeners = new Set()

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state))
  listeners.forEach((fn) => fn({ ...state }))
  applyToDocument()
}

function applyToDocument() {
  document.documentElement.dataset.fontSize = state.fontSize
  document.documentElement.dataset.reduceMotion = String(state.reduceMotion)
}

export function getUiPrefs() { return { ...state } }
export function onUiPrefsChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function setFontSize(size) { state.fontSize = size; persist() }
export function setReduceMotion(v) { state.reduceMotion = v; persist() }

applyToDocument()
