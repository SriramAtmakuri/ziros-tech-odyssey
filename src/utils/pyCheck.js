// Deep-equality helper for comparing values pulled out of Pyodide (via
// pyGet) against expected JS values. Numbers compare with tolerance for
// floats; object key order never matters; array order always does.
export function deepEqual(a, b, tolerance = 0.001) {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= tolerance
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i], tolerance))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a).sort()
    const bk = Object.keys(b).sort()
    if (ak.length !== bk.length || !ak.every((k, i) => k === bk[i])) return false
    return ak.every((k) => deepEqual(a[k], b[k], tolerance))
  }
  return a === b
}
