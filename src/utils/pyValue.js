// Reads a Python global back into a plain JS value — lists/dicts convert
// via Pyodide's FFI instead of parsing printed output, so challenges can
// check real values rather than exact print formatting.
//
// This lives apart from pyodideEngine.js on purpose: challenge check()
// functions (imported eagerly with all the zone data) call pyGet, but they
// must NOT pull in `loadPyodide` and the rest of the heavy Pyodide loader.
// pyGet only ever operates on a pyodide instance handed to it at runtime, so
// it needs no import of its own — keeping it here keeps the Pyodide loader
// out of the initial bundle.
export function pyGet(pyodide, name) {
  const v = pyodide.globals.get(name)
  if (v && typeof v.toJs === 'function') {
    const js = v.toJs({ dict_converter: Object.fromEntries })
    if (typeof v.destroy === 'function') v.destroy()
    return js
  }
  return v
}
