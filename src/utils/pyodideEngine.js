import { loadPyodide } from 'pyodide'

let pyodidePromise = null

// A single, long-lived Pyodide (Python-in-WASM) instance reused across every
// Python challenge in the game — re-initializing Pyodide per challenge would
// be slow. runPython() wipes globals before each run so challenges never
// see each other's leftover state. Self-hosted from public/pyodide/ (copied
// from node_modules/pyodide at build time) so the game stays fully offline.
export function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: '/pyodide/' })
  }
  return pyodidePromise
}

const RESET_GLOBALS = `
for _k in list(globals().keys()):
    if not _k.startswith('__') and _k not in ('_k',):
        try:
            del globals()[_k]
        except Exception:
            pass
`

// Runs code and captures stdout/stderr as text, the way a real Python
// REPL would show it, instead of surfacing raw JS exceptions. Globals are
// wiped before every run — Pyodide's interpreter is shared across every
// Python challenge in the game (fast reuse instead of a slow re-init per
// challenge), so without this a variable from a previously-solved, unrelated
// challenge could silently leak into a later one's `check()` result.
export async function runPython(pyodide, code) {
  let stdout = ''
  let stderr = ''
  pyodide.setStdout({ batched: (s) => { stdout += `${s}\n` } })
  pyodide.setStderr({ batched: (s) => { stderr += `${s}\n` } })
  try {
    await pyodide.runPythonAsync(RESET_GLOBALS)
    const result = await pyodide.runPythonAsync(code)
    return { stdout, stderr, result, error: null }
  } catch (err) {
    return { stdout, stderr, result: undefined, error: err.message ?? String(err) }
  }
}

export function resetPyodide() {
  pyodidePromise = null
}

// pyGet moved to ./pyValue.js so challenge check() functions can read Python
// globals without importing the heavy Pyodide loader. Re-exported here for
// any caller that still expects it alongside the engine.
export { pyGet } from './pyValue.js'
