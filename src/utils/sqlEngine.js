import { SQL_ISLAND_SCHEMA } from '../data/sql/schema.js'

const DB_SAVE_KEY = 'ziro-sql-island-db'
let dbPromise = null

function u8ToBase64(bytes) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToU8(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// A single, long-lived in-browser SQLite database for the whole SQL Island
// playthrough — mutations (INSERT/UPDATE/DELETE) from earlier challenges
// persist into later ones, exactly like a real island recovering piece by
// piece. Persisted to localStorage after every query so a page reload
// resumes with the same island state as the saved challenge progress.
export function getSqlIslandDb() {
  if (!dbPromise) {
    // Dynamic import — sql.js's SQLite WASM glue (~800KB+ unminified) is
    // only needed once a player actually opens a SQL Island 'sql'-kind
    // challenge panel. gameStore.js imports this file too (for the tiny
    // resetSqlIslandDb below), and it's loaded eagerly from App.jsx — a
    // static top-level `import initSqlJs from 'sql.js'` here used to drag
    // the whole engine into that same eager bundle for every player, even
    // ones who never touch SQL Island. This keeps it scoped to its own
    // lazily-fetched chunk, matching the Monaco/Pyodide pattern.
    dbPromise = import('sql.js').then(({ default: initSqlJs }) => initSqlJs({ locateFile: (file) => `/sql-wasm/${file}` })).then((SQL) => {
      const saved = localStorage.getItem(DB_SAVE_KEY)
      if (saved) {
        try {
          return new SQL.Database(base64ToU8(saved))
        } catch {
          // fall through to a fresh island if the saved bytes are corrupt
        }
      }
      const db = new SQL.Database()
      db.run(SQL_ISLAND_SCHEMA)
      return db
    })
  }
  return dbPromise
}

export function persistSqlIslandDb(db) {
  localStorage.setItem(DB_SAVE_KEY, u8ToBase64(db.export()))
}

export function resetSqlIslandDb() {
  localStorage.removeItem(DB_SAVE_KEY)
  dbPromise = null
}
