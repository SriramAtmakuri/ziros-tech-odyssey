// Persisted gameplay keybinds — separate from uiPrefs.js (accessibility) and
// audioEngine.js (sound). Only the six movement/action keys are remappable;
// arrow keys stay a fixed, always-available fallback for movement (see
// ZoneScene.js) so a bad rebind can never fully lock a player out of moving.
const KEY = 'ziro-keybinds'
const defaults = {
  up: 'W', down: 'S', left: 'A', right: 'D', run: 'SHIFT', interact: 'E',
}

// Global menu shortcuts (App.jsx) — never assignable to a gameplay action,
// since both listeners fire on the same physical keydown and would collide.
const RESERVED = new Set(['M', 'I', 'O', 'K', 'G'])

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
}

export function getKeybinds() { return { ...state } }
export function onKeybindsChange(fn) { listeners.add(fn); return () => listeners.delete(fn) }
export function isKeyReserved(key) { return RESERVED.has(key) }
export function actionUsingKey(key, exceptAction) {
  return Object.entries(state).find(([action, k]) => action !== exceptAction && k === key)?.[0] ?? null
}
export function setKeybind(action, key) {
  if (!(action in defaults)) return
  state[action] = key
  persist()
}
export function resetKeybinds() {
  Object.assign(state, defaults)
  persist()
}

// Not persisted — just an in-memory flag so App.jsx's global menu shortcuts
// (M/I/O/K/G/Tab) can skip themselves while a SettingsModal row is capturing
// the next keypress for a rebind. Otherwise pressing, say, "i" to rebind a
// key would also pop open the Inventory in the same keystroke, since both
// are separate `window` keydown listeners reacting to the same event.
let capturing = false
export function isCapturingKeybind() { return capturing }
export function setCapturingKeybind(v) { capturing = v }
