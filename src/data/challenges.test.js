// Verifies every challenge's own check() function actually accepts a correct
// solution, using real sql.js / Pyodide engines — not mocks. hints[2] is the
// project's convention for "a solution that should pass check()"; this suite
// reconstructs a working solution from it (see helpers below) and runs it
// through check() for real. A red test here means either a broken challenge
// or a broken hint, not a broken UI.
import {
  describe, test, expect, beforeAll,
} from 'vitest'
import initSqlJs from 'sql.js'
import { loadPyodide } from 'pyodide'
import { SQL_ISLAND_SCHEMA } from './sql/schema.js'
import { SQL_ISLAND_CHALLENGES } from './sql/sqlIslandChallenges.js'
import { SQL_ISLAND_BONUS_POOL } from './sql/sqlIslandBonusPool.js'
import { CODE_KINGDOM_CHALLENGES } from './zones/codeKingdomChallenges.js'
import { CODE_KINGDOM_BONUS_POOL } from './zones/codeKingdomBonusPool.js'
import { PYTHON_JUNGLE_CHALLENGES } from './zones/pythonJungleChallenges.js'
import { PYTHON_JUNGLE_BONUS_POOL } from './zones/pythonJungleBonusPool.js'
import { DATA_REALM_CHALLENGES } from './zones/dataRealmChallenges.js'
import { DATA_REALM_BONUS_POOL } from './zones/dataRealmBonusPool.js'
import { CLOUD_CITADEL_CHALLENGES } from './zones/cloudCitadelChallenges.js'
import { CLOUD_CITADEL_BONUS_POOL } from './zones/cloudCitadelBonusPool.js'
import { ALGORITHM_DUNGEON_CHALLENGES } from './zones/algorithmDungeonChallenges.js'
import { ALGORITHM_DUNGEON_BONUS_POOL } from './zones/algorithmDungeonBonusPool.js'
import { AI_FRONTIER_CHALLENGES } from './zones/aiFrontierChallenges.js'
import { AI_FRONTIER_BONUS_POOL } from './zones/aiFrontierBonusPool.js'
import { HEALTHCARE_HIGHLANDS_CHALLENGES } from './zones/healthcareHighlandsChallenges.js'
import { HEALTHCARE_HIGHLANDS_BONUS_POOL } from './zones/healthcareHighlandsBonusPool.js'
import { SUPPLY_CHAIN_DOCKS_CHALLENGES } from './zones/supplyChainDocksChallenges.js'
import { SUPPLY_CHAIN_DOCKS_BONUS_POOL } from './zones/supplyChainDocksBonusPool.js'
import { IOT_OUTPOST_CHALLENGES } from './zones/iotOutpostChallenges.js'
import { IOT_OUTPOST_BONUS_POOL } from './zones/iotOutpostBonusPool.js'
import { WEB_DEV_WORKSHOP_CHALLENGES } from './zones/webDevWorkshopChallenges.js'
import { WEB_DEV_WORKSHOP_BONUS_POOL } from './zones/webDevWorkshopBonusPool.js'
import { SECURITY_STRONGHOLD_CHALLENGES } from './zones/securityStrongholdChallenges.js'
import { SECURITY_STRONGHOLD_BONUS_POOL } from './zones/securityStrongholdBonusPool.js'
import { COLLABORATION_COMMONS_CHALLENGES } from './zones/collaborationCommonsChallenges.js'
import { COLLABORATION_COMMONS_BONUS_POOL } from './zones/collaborationCommonsBonusPool.js'

const ZONES = [
  ['sql-island', SQL_ISLAND_CHALLENGES],
  ['sql-island-bonus', SQL_ISLAND_BONUS_POOL],
  ['code-kingdom', CODE_KINGDOM_CHALLENGES],
  ['code-kingdom-bonus', CODE_KINGDOM_BONUS_POOL],
  ['python-jungle', PYTHON_JUNGLE_CHALLENGES],
  ['python-jungle-bonus', PYTHON_JUNGLE_BONUS_POOL],
  ['data-realm', DATA_REALM_CHALLENGES],
  ['data-realm-bonus', DATA_REALM_BONUS_POOL],
  ['cloud-citadel', CLOUD_CITADEL_CHALLENGES],
  ['cloud-citadel-bonus', CLOUD_CITADEL_BONUS_POOL],
  ['algorithm-dungeon', ALGORITHM_DUNGEON_CHALLENGES],
  ['algorithm-dungeon-bonus', ALGORITHM_DUNGEON_BONUS_POOL],
  ['ai-frontier', AI_FRONTIER_CHALLENGES],
  ['ai-frontier-bonus', AI_FRONTIER_BONUS_POOL],
  ['healthcare-highlands', HEALTHCARE_HIGHLANDS_CHALLENGES],
  ['healthcare-highlands-bonus', HEALTHCARE_HIGHLANDS_BONUS_POOL],
  ['supply-chain-docks', SUPPLY_CHAIN_DOCKS_CHALLENGES],
  ['supply-chain-docks-bonus', SUPPLY_CHAIN_DOCKS_BONUS_POOL],
  ['iot-outpost', IOT_OUTPOST_CHALLENGES],
  ['iot-outpost-bonus', IOT_OUTPOST_BONUS_POOL],
  ['web-dev-workshop', WEB_DEV_WORKSHOP_CHALLENGES],
  ['web-dev-workshop-bonus', WEB_DEV_WORKSHOP_BONUS_POOL],
  ['security-stronghold', SECURITY_STRONGHOLD_CHALLENGES],
  ['security-stronghold-bonus', SECURITY_STRONGHOLD_BONUS_POOL],
  ['collaboration-commons', COLLABORATION_COMMONS_CHALLENGES],
  ['collaboration-commons-bonus', COLLABORATION_COMMONS_BONUS_POOL],
]

let SQL
let pyodide

beforeAll(async () => {
  SQL = await initSqlJs({ locateFile: (f) => `node_modules/sql.js/dist/${f}` })
  pyodide = await loadPyodide({ indexURL: 'node_modules/pyodide/' })
}, 60000)

async function runPython(code) {
  await pyodide.runPythonAsync(
    'for _k in list(globals().keys()):\n'
    + "    if not _k.startswith('__') and _k not in ('_k',):\n"
    + '        try:\n'
    + '            del globals()[_k]\n'
    + '        except Exception:\n'
    + '            pass\n',
  )
  let stdout = ''
  pyodide.setStdout({ batched: (s) => { stdout += `${s}\n` } })
  try {
    await pyodide.runPythonAsync(code)
    return { stdout, stderr: '', error: null }
  } catch (err) {
    return { stdout, stderr: String(err), error: err.message ?? String(err) }
  }
}

// Many python challenges use a `pass` placeholder inside a function body;
// hints[2] is written to replace that line (sometimes repeating the
// enclosing def/for header as part of the same hint block).
function spliceAtPass(starter, hint) {
  const lines = starter.split('\n')
  const passIdxs = []
  lines.forEach((l, i) => { if (/^\s*pass\b/.test(l)) passIdxs.push(i) })
  if (passIdxs.length === 0) return null

  const chunks = hint.split(/\n{2,}/).map((c) => c.trim())
  if (chunks.length !== passIdxs.length && chunks.length !== 1) return null

  const result = [...lines]
  for (let n = passIdxs.length - 1; n >= 0; n -= 1) {
    const idx = passIdxs[n]
    const chunk = chunks.length === passIdxs.length ? chunks[n] : chunks[0]
    const chunkLines = chunk.split('\n')

    let replaceFrom = idx
    const maxK = Math.min(chunkLines.length, idx)
    for (let k = maxK; k >= 1; k -= 1) {
      const starterSlice = result.slice(idx - k, idx).map((l) => l.trim())
      const hintSlice = chunkLines.slice(0, k).map((l) => l.trim())
      if (starterSlice.every((l, i) => l === hintSlice[i])) {
        replaceFrom = idx - k
        break
      }
    }

    const baseIndent = result[replaceFrom].match(/^\s*/)[0]
    const indented = chunkLines.map((l) => (l.trim() ? baseIndent + l : l))
    result.splice(replaceFrom, idx - replaceFrom + 1, ...indented)
  }
  return result.join('\n')
}

function matchesStep(step, text) {
  if (step.match instanceof RegExp) return step.match.test(text)
  const m = /^\/(.*)\/([a-z]*)$/.exec(step.match)
  if (m) return new RegExp(m[1], m[2]).test(text)
  return text.toLowerCase() === String(step.match).toLowerCase()
}

// A couple of "fix the 3 separate bugs" debug challenges use hints[2] as a
// set of line-level diffs rather than a splice-able block. Hand-verified
// fully-corrected solutions, kept here rather than generalizing the splicer
// further for two one-off cases.
const MANUAL_SOLUTIONS = {
  'algo-16-final-boss': `
dungeon_map = {
    'chamber_a': ['chamber_b'],
    'chamber_b': ['chamber_c'],
    'chamber_c': [],
    'chamber_d': ['chamber_e'],
    'chamber_e': [],
}

def path_exists(graph, start, end):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node == end:
            return True
        if node not in visited:
            visited.add(node)
            stack.extend(graph[node])
    return False

fib_cache = {}

def fib(n):
    if n <= 1:
        return n
    if n in fib_cache:
        return fib_cache[n]
    value = fib(n - 1) + fib(n - 2)
    fib_cache[n] = value
    return value

power_levels = [10, 25, 40, 55, 70, 85, 100, 120]
threshold = 130

def binary_search_threshold(levels, target):
    low, high = 0, len(levels) - 1
    while low <= high:
        mid = (low + high) // 2
        if levels[mid] == target:
            return True
        elif levels[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return False

result = {
    'path_exists': path_exists(dungeon_map, 'chamber_a', 'chamber_c'),
    'fib_10': fib(10),
    'threshold_met': binary_search_threshold(power_levels, threshold),
}
`,
  'py-20-final-boss': `
def water_plants(plants):
    total = 0
    for p in plants:
        total = total + 1
    return total

animals = ['tiger', 'monkey', 'tiger', 'parrot']
counts = {}
for a in animals:
    counts[a] = counts.get(a, 0) + 1

def safe_divide(a, b):
    return a / b

report = safe_divide(10, 2)

plants = ['fern', 'vine', 'moss']
result = {
    'plants_watered': water_plants(plants),
    'animal_counts': counts,
    'safe_report': report,
}
`,
}

describe('challenge data integrity', () => {
  test('every challenge id is unique across the whole game', () => {
    const seen = new Map()
    const dupes = []
    for (const [zoneId, challenges] of ZONES) {
      for (const c of challenges) {
        if (seen.has(c.id)) dupes.push(`${c.id} (${zoneId} and ${seen.get(c.id)})`)
        seen.set(c.id, zoneId)
      }
    }
    expect(dupes).toEqual([])
  })

  test.each(ZONES)('%s: every challenge has hints, tool, xp, title, prompt', (zoneId, challenges) => {
    const problems = []
    for (const c of challenges) {
      if (!c.hints || c.hints.length < 1) problems.push(`${c.id}: missing hints`)
      if (!c.tool || !c.tool.name) problems.push(`${c.id}: missing tool card`)
      if (typeof c.xp !== 'number' || c.xp <= 0) problems.push(`${c.id}: invalid xp ${c.xp}`)
      if (!c.title) problems.push(`${c.id}: missing title`)
      if (!c.prompt) problems.push(`${c.id}: missing prompt`)
    }
    expect(problems).toEqual([])
  })
})

describe.each(ZONES)('%s challenges', (zoneId, challenges) => {
  // SQL Island uses one continuous, persistent database across the whole
  // zone in real play (e.g. "insert yourself as Ziro" is relied on by a
  // later challenge's check()) — mirror that with one shared db per zone,
  // built up in challenge order via sequential (non-concurrent) tests.
  let sharedDb = null
  beforeAll(() => {
    // sql-island-bonus's live-SQL challenges are all read-only SELECTs
    // against the untouched base schema/data, so a fresh schema-only db
    // (no main-pool INSERT/UPDATE/DELETE history) is correct here too.
    if (zoneId === 'sql-island' || zoneId === 'sql-island-bonus') {
      sharedDb = new SQL.Database()
      sharedDb.run(SQL_ISLAND_SCHEMA)
    }
  })

  test.each(challenges)('$id check() accepts a correct solution', async (c) => {
    const kind = c.kind ?? 'sql'

    if (kind === 'sql') {
      const solution = c.hints?.[2]
      expect(solution, 'hints[2] should contain a usable SQL solution').toBeTruthy()
      expect(/^(select|insert|update|delete|create|with|begin|drop|alter)/i.test(solution.trim())).toBe(true)
      const execResult = sharedDb.exec(solution)
      const outcome = c.check({ db: sharedDb, result: execResult, sql: solution })
      expect(outcome.success, outcome.message).toBe(true)
    } else if (kind === 'python') {
      const hint3 = c.hints?.[2]
      expect(hint3, 'hints[2] should contain a python solution').toBeTruthy()
      const hintTrimmedLines = new Set(hint3.split('\n').map((l) => l.trim()).filter(Boolean))
      const dedupedStarter = (c.starter ?? '').split('\n').filter((l) => !hintTrimmedLines.has(l.trim())).join('\n')
      const candidates = [
        MANUAL_SOLUTIONS[c.id],
        hint3,
        `${c.starter ?? ''}\n${hint3}`,
        spliceAtPass(c.starter ?? '', hint3),
        `${dedupedStarter}\n${hint3}`,
      ].filter(Boolean)

      let ok = false
      let lastMsg = ''
      for (const candidate of candidates) {
        // eslint-disable-next-line no-await-in-loop
        const { stdout, stderr, error } = await runPython(candidate)
        const outcome = c.check({
          pyodide, stdout, stderr, error, code: candidate,
        })
        if (outcome.success) { ok = true; break }
        lastMsg = outcome.message
      }
      expect(ok, `no candidate reconstruction of hints[2] passed check(): ${lastMsg}`).toBe(true)
    } else if (kind === 'terminal') {
      const solution = c.hints?.[2]
      expect(solution, 'hints[2] should contain a terminal solution').toBeTruthy()
      const lines = solution.split('\n').map((l) => l.trim()).filter(Boolean)
      expect(lines.length, 'hints[2] line count should match steps count').toBe(c.steps.length)
      for (let i = 0; i < c.steps.length; i += 1) {
        expect(matchesStep(c.steps[i], lines[i]), `step ${i} "${lines[i]}" should match ${c.steps[i].match}`).toBe(true)
      }
    } else if (kind === 'sequence') {
      const itemIds = c.items.map((i) => i.id).sort()
      const orderIds = [...c.correctOrder].sort()
      expect(c.correctOrder.length).toBe(c.items.length)
      expect(new Set(itemIds).size).toBe(itemIds.length)
      expect(orderIds).toEqual(itemIds)
    } else if (kind === 'code') {
      const hint3 = c.hints?.[2]
      expect(hint3, 'hints[2] should contain a code solution').toBeTruthy()
      const starter = c.starter ?? ''
      const candidates = [
        hint3,
        `${starter}\n${hint3}`,
        starter.includes('{') ? starter.replace('{', `{\n  ${hint3},`) : null,
      ].filter(Boolean)
      let ok = false
      let lastMsg = ''
      for (const candidate of candidates) {
        const outcome = c.check({ code: candidate })
        if (outcome.success) { ok = true; break }
        lastMsg = outcome.message
      }
      expect(ok, `no candidate reconstruction of hints[2] passed check(): ${lastMsg}`).toBe(true)
    } else if (kind === 'mcq') {
      // No execution engine for MCQ — assert data integrity instead of
      // running a solution through check().
      expect(Array.isArray(c.options), 'options should be an array').toBe(true)
      expect(c.options.length >= 2, 'options should have at least 2 choices').toBe(true)
      expect(Number.isInteger(c.correctIndex), 'correctIndex should be an integer').toBe(true)
      expect(c.correctIndex >= 0 && c.correctIndex < c.options.length, 'correctIndex should index into options').toBe(true)
    } else if (kind === 'matching') {
      // No execution engine for matching either — assert the pairs/rightOrder
      // data is internally consistent.
      expect(Array.isArray(c.pairs), 'pairs should be an array').toBe(true)
      expect(c.pairs.length >= 2, 'pairs should have at least 2 entries').toBe(true)
      const ids = c.pairs.map((p) => p.id)
      c.pairs.forEach((p) => {
        expect(typeof p.left === 'string' && p.left.trim().length > 0, `pair ${p.id} should have a non-empty left`).toBe(true)
        expect(typeof p.right === 'string' && p.right.trim().length > 0, `pair ${p.id} should have a non-empty right`).toBe(true)
        expect(p.id !== undefined && p.id !== null && p.id !== '', 'pair should have a non-empty id').toBe(true)
      })
      expect(new Set(ids).size, 'pair ids should be unique').toBe(ids.length)
      expect(Array.isArray(c.rightOrder), 'rightOrder should be an array').toBe(true)
      expect(c.rightOrder.length, 'rightOrder should be the same length as pairs').toBe(ids.length)
      expect(new Set(c.rightOrder).size, 'rightOrder should have no duplicates').toBe(c.rightOrder.length)
      expect([...c.rightOrder].sort()).toEqual([...ids].sort())
    } else {
      throw new Error(`unknown challenge kind: ${kind}`)
    }
  })
})
