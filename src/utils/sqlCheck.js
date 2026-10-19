// Helpers shared by every SQL Island challenge's check() function.

export function firstRows(execResult) {
  if (!execResult || execResult.length === 0) return []
  return execResult[0].values
}

export function firstCols(execResult) {
  if (!execResult || execResult.length === 0) return []
  return execResult[0].columns
}

export function scalar(db, sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let value = null
  if (stmt.step()) value = stmt.get()[0]
  stmt.free()
  return value
}

export function queryRows(db, sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.get())
  stmt.free()
  return rows
}

function cell(v, tolerance) {
  if (v === null || v === undefined) return 'NULL'
  const n = Number(v)
  if (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(n))) {
    return { num: n, tol: tolerance }
  }
  return String(v).trim().toLowerCase()
}

function cellsMatch(a, b) {
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    return Math.abs(a.num - b.num) <= Math.max(a.tol, b.tol)
  }
  return a === b
}

function rowsEqual(rowA, rowB, tolerance) {
  if (rowA.length !== rowB.length) return false
  return rowA.every((v, i) => cellsMatch(cell(v, tolerance), cell(rowB[i], tolerance)))
}

/**
 * Compares two row-sets. Numeric cells compare with tolerance; everything
 * else compares as trimmed, case-insensitive strings. Row order matters
 * only when `ordered` is true. Unordered comparison does a greedy
 * one-to-one match so `tolerance` is honored instead of relying on a
 * sorted string key (which would only ever compare at fixed precision).
 */
export function sameRows(a, b, { ordered = false, tolerance = 0.01 } = {}) {
  if (a.length !== b.length) return false
  if (ordered) {
    return a.every((row, i) => rowsEqual(row, b[i], tolerance))
  }
  const used = new Array(b.length).fill(false)
  return a.every((row) => {
    const idx = b.findIndex((brow, j) => !used[j] && rowsEqual(row, brow, tolerance))
    if (idx === -1) return false
    used[idx] = true
    return true
  })
}

export function containsKeyword(sql, keyword) {
  return new RegExp(`\\b${keyword}\\b`, 'i').test(sql)
}

export function ziroId(db) {
  return scalar(db, "SELECT personid FROM inhabitant WHERE name = 'Ziro'")
}

export function tableExists(db, name, type = 'table') {
  return !!scalar(
    db,
    `SELECT name FROM sqlite_master WHERE type = ? AND lower(name) = lower(?)`,
    [type, name],
  )
}
