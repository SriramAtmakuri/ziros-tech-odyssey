import { create } from 'zustand'
import { resetSqlIslandDb } from '../utils/sqlEngine.js'
import { ZONES, ZONE_ORDER } from '../data/zones/index.js'
import { QUESTS } from '../data/quests.js'

// Registry of each zone's bonus reserve pool, for the chest-swap/rotation
// feature. Dynamically imported per zone instead of statically — a zone's
// full bonus-pool text (MCQ/matching/hands-on challenge content, roughly
// half of that zone's total data weight) was previously bundled eagerly for
// all 13 zones on every page load, even for zones a player never visits.
// Loaded on demand via ensureBonusPoolLoaded(zoneId) (called by ZoneScene.js
// before building chests) and cached forever in resolvedBonusPools once
// resolved — a zone's content never changes at runtime, and re-entering an
// already-visited zone is instant (module + browser cache). A zone with no
// loader here just means swapChallenge/getLiveChallenges no-op for it
// (nothing to draw from yet) — add a line here as each zone's pool file
// gets built, no other engine code needs to change.
const BONUS_POOL_LOADERS = {
  'sql-island': () => import('../data/sql/sqlIslandBonusPool.js').then((m) => m.SQL_ISLAND_BONUS_POOL),
  'code-kingdom': () => import('../data/zones/codeKingdomBonusPool.js').then((m) => m.CODE_KINGDOM_BONUS_POOL),
  'python-jungle': () => import('../data/zones/pythonJungleBonusPool.js').then((m) => m.PYTHON_JUNGLE_BONUS_POOL),
  'data-realm': () => import('../data/zones/dataRealmBonusPool.js').then((m) => m.DATA_REALM_BONUS_POOL),
  'cloud-citadel': () => import('../data/zones/cloudCitadelBonusPool.js').then((m) => m.CLOUD_CITADEL_BONUS_POOL),
  'algorithm-dungeon': () => import('../data/zones/algorithmDungeonBonusPool.js').then((m) => m.ALGORITHM_DUNGEON_BONUS_POOL),
  'ai-frontier': () => import('../data/zones/aiFrontierBonusPool.js').then((m) => m.AI_FRONTIER_BONUS_POOL),
  'healthcare-highlands': () => import('../data/zones/healthcareHighlandsBonusPool.js').then((m) => m.HEALTHCARE_HIGHLANDS_BONUS_POOL),
  'supply-chain-docks': () => import('../data/zones/supplyChainDocksBonusPool.js').then((m) => m.SUPPLY_CHAIN_DOCKS_BONUS_POOL),
  'iot-outpost': () => import('../data/zones/iotOutpostBonusPool.js').then((m) => m.IOT_OUTPOST_BONUS_POOL),
  'web-dev-workshop': () => import('../data/zones/webDevWorkshopBonusPool.js').then((m) => m.WEB_DEV_WORKSHOP_BONUS_POOL),
  'security-stronghold': () => import('../data/zones/securityStrongholdBonusPool.js').then((m) => m.SECURITY_STRONGHOLD_BONUS_POOL),
  'collaboration-commons': () => import('../data/zones/collaborationCommonsBonusPool.js').then((m) => m.COLLABORATION_COMMONS_BONUS_POOL),
}
const resolvedBonusPools = {}
const pendingBonusPoolLoads = {}

const SAVE_KEY = 'ziro-tech-odyssey-save'

const xpForLevel = (level) => 100 + (level - 1) * 50

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const SAVE_FIELDS = [
  'zone', 'unlockedZones', 'completedZones', 'level', 'xp', 'streak', 'longestStreak',
  'inventory', 'completedChallenges', 'playerPos', 'playerName', 'hasOnboarded',
  'totalPlaySeconds', 'totalAttempts', 'successfulAttempts', 'zoneStats', 'challengeSwaps',
  'claimedQuests',
]
function snapshotOf(state) {
  return Object.fromEntries(SAVE_FIELDS.map((k) => [k, state[k]]))
}

// saveGame() gets called on every XP award, every challenge attempt, and
// every 30s play-time tick — writing to localStorage synchronously on each
// one is wasted work when several fire back to back (e.g. rapid terminal
// command attempts). Debounce the actual write; flushSaveNow() forces an
// immediate write (used on tab close) so nothing is lost.
let saveTimer = null
function scheduleSave(snapshot) {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
    } catch {
      // storage full or disabled (e.g. Safari private mode) — save silently
      // no-ops rather than throwing inside a timer callback/beforeunload handler
    }
  }, 400)
}
function flushSaveNow(snapshot) {
  clearTimeout(saveTimer)
  saveTimer = null
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
  } catch {
    // storage full or disabled — nothing more we can do here
  }
}
function cancelPendingSave() {
  clearTimeout(saveTimer)
  saveTimer = null
}

const defaultState = {
  zone: 'sql-island',
  // Every zone is travelable from the start — the player can jump straight
  // to any zone's first chest instead of unlocking them one at a time.
  // completedZones/zoneStats below still track real progress independently.
  unlockedZones: [...ZONE_ORDER],
  completedZones: [],
  level: 1,
  xp: 0,
  streak: 0,
  longestStreak: 0,
  inventory: [],
  completedChallenges: [],
  playerPos: { x: 400, y: 300 },
  playerName: 'Ziro',
  hasOnboarded: false,
  totalPlaySeconds: 0,
  totalAttempts: 0,
  successfulAttempts: 0,
  zoneStats: {}, // zoneId -> completed challenge count
  challengeSwaps: {}, // original chest-position challenge id -> bonus-pool challenge id it was replaced with
  claimedQuests: [], // ids of cross-cutting quests (src/data/quests.js) whose reward has already been granted
}

export const useGameStore = create((set, get) => ({
  // ----- persistent game state -----
  ...defaultState,

  // ----- transient UI state (not saved) -----
  dialogue: null, // { npcName, portrait, lines: [], onComplete }
  activeChallenge: null, // challenge object or null
  showInventory: false,
  showSettings: false,
  showStats: false,
  showOverworld: false,
  showShortcuts: false,
  showGlossary: false,
  showQuests: false,
  lastXpGain: null, // { amount, x, y, id } for floating number UI
  zoneJustCompleted: null, // zoneId, while the ZoneComplete celebration is showing
  nextChallengeRequest: null, // challengeId — ZoneScene walks the player there and opens it, then clears this

  // ----- actions -----
  loadGame() {
    const save = loadSave()
    if (save) set({ ...defaultState, ...save })
    return !!save
  },

  saveGame() {
    scheduleSave(snapshotOf(get()))
  },

  // Forces any pending debounced save to write immediately — call before the
  // tab/page might close, or when the player explicitly clicks Save.
  flushSave() {
    flushSaveNow(snapshotOf(get()))
  },

  hasSave() {
    return !!loadSave()
  },

  clearSave() {
    cancelPendingSave()
    localStorage.removeItem(SAVE_KEY)
    resetSqlIslandDb()
    // set() shallow-merges — defaultState only covers persisted fields, so
    // every transient UI field below has to be listed explicitly or it
    // survives a "Clear Save"/"New Game" untouched (e.g. a stale dialogue/
    // activeChallenge/modal-visibility flag bleeding into the fresh game).
    set({
      ...defaultState,
      dialogue: null,
      activeChallenge: null,
      showInventory: false,
      showSettings: false,
      showStats: false,
      showOverworld: false,
      showShortcuts: false,
      showGlossary: false,
      showQuests: false,
      lastXpGain: null,
      zoneJustCompleted: null,
      nextChallengeRequest: null,
    })
  },

  setPlayerPos(x, y) {
    set({ playerPos: { x, y } })
  },

  openDialogue(dialogue) {
    set({ dialogue })
  },

  closeDialogue() {
    const d = get().dialogue
    set({ dialogue: null })
    if (d && d.onComplete) d.onComplete()
  },

  openChallenge(challenge) {
    set({ activeChallenge: challenge })
  },

  closeChallenge() {
    set({ activeChallenge: null })
  },

  // "Next Challenge" button in a solved panel — ZoneScene picks this up,
  // walks the player to that chest, and opens it automatically on arrival
  // (reusing the same walk-then-interact flow as clicking a distant chest).
  requestWalkToChallenge(challengeId) {
    set({ nextChallengeRequest: challengeId })
  },

  clearWalkRequest() {
    set({ nextChallengeRequest: null })
  },

  // challengeSwaps maps each chest position across EVERY zone that has a
  // bonus pool registered (keyed by its ORIGINAL challenge id, forever —
  // ids are globally unique across the whole game, so one flat object
  // works fine without nesting by zone) to { drawn, cursor }: `drawn` is
  // the up to 2 bonus challenges that position has pulled from its zone's
  // pool so far; `cursor` is where in the 3-step cycle it currently sits —
  // 0 = showing the original again, 1 = showing drawn[0], 2 = showing
  // drawn[1]. Once both slots are drawn, further swaps just rotate the
  // cursor through 0→1→2→0→... forever, reusing the same 2 bonus
  // challenges rather than drawing anything new (each position only ever
  // needs 2, ever). No entry at all is equivalent to { drawn: [], cursor: 0 }.
  getBonusPool(zoneId) {
    return resolvedBonusPools[zoneId] ?? null
  },

  // Kicks off (and dedupes/caches) the dynamic import for a zone's bonus
  // pool. Must resolve before getBonusPool/getLiveChallenges/swapChallenge
  // can see real pool data for that zone — ZoneScene.js awaits this before
  // building chests, so a returning player's existing challengeSwaps still
  // render correctly on the very first frame instead of one frame late.
  // Resolves to null immediately for a zone with no bonus pool at all.
  ensureBonusPoolLoaded(zoneId) {
    if (resolvedBonusPools[zoneId]) return Promise.resolve(resolvedBonusPools[zoneId])
    if (pendingBonusPoolLoads[zoneId]) return pendingBonusPoolLoads[zoneId]
    const loader = BONUS_POOL_LOADERS[zoneId]
    if (!loader) return Promise.resolve(null)
    pendingBonusPoolLoads[zoneId] = loader().then((pool) => {
      resolvedBonusPools[zoneId] = pool
      delete pendingBonusPoolLoads[zoneId]
      return pool
    })
    return pendingBonusPoolLoads[zoneId]
  },

  swapEntry(originalId) {
    return get().challengeSwaps[originalId] ?? { drawn: [], cursor: 0 }
  },

  currentOccupantId(originalId) {
    const { drawn, cursor } = get().swapEntry(originalId)
    return cursor === 0 ? originalId : drawn[cursor - 1]
  },

  // Reverse of currentOccupantId — given a zone and a live challenge id
  // (which may be the position's original id, or whatever bonus-pool
  // challenge currently occupies it after a rotation), finds the original
  // position id it belongs to. Needed anywhere that needs to locate a
  // chest's canonical position — e.g. challengeNav.js's findNextUnsolvedChallenge,
  // which walks zone.challenges by index and previously broke (silently
  // restarting from index 0) whenever "Next" was clicked right after
  // solving a rotated-in bonus challenge, since that id was never in
  // zone.challenges to begin with.
  originalIdFor(zoneId, liveId) {
    const zone = ZONES[zoneId]
    if (zone.challenges.some((c) => c.id === liveId)) return liveId
    const match = zone.challenges.find((c) => get().currentOccupantId(c.id) === liveId)
    return match ? match.id : liveId
  },

  // Once whatever's currently occupying a chest position (in ANY zone with
  // a bonus pool registered) is solved and the player moves on (via
  // "Next"), that position advances one step around its 3-step cycle — so
  // backtracking to it later finds something new (or, once both bonus
  // slots are filled, cycles back through what's already been drawn
  // instead of repeating the same thing forever). `justSolvedId` may be
  // the position's original id OR whatever bonus id currently occupies it
  // (Next fires after solving either) — the reverse lookup below finds
  // which zone/position that belongs to either way, searching only zones
  // that actually have a bonus pool (everything else is a deliberate no-op).
  swapChallenge(justSolvedId) {
    const state = get()
    let originalId = null
    let pool = null
    for (const [zoneId, zone] of Object.entries(ZONES)) {
      const zonePool = resolvedBonusPools[zoneId]
      if (!zonePool) continue // this zone's pool isn't loaded (or doesn't exist) — not swappable yet
      const ids = zone.challenges.map((c) => c.id)
      if (ids.includes(justSolvedId)) {
        originalId = justSolvedId; pool = zonePool; break
      }
      const match = ids.find((id) => get().currentOccupantId(id) === justSolvedId)
      if (match) { originalId = match; pool = zonePool; break }
    }
    if (!originalId) return // not a chest position in any swappable zone

    const entry = get().swapEntry(originalId)
    const nextCursor = (entry.cursor + 1) % 3
    let { drawn } = entry
    if (nextCursor > 0 && drawn.length < nextCursor) {
      const usedIds = new Set(Object.values(state.challengeSwaps).flatMap((e) => e.drawn ?? []))
      const nextBonus = pool.find((c) => !usedIds.has(c.id))
      if (!nextBonus) return // this zone's pool is fully exhausted — nothing left to draw
      drawn = [...drawn, nextBonus.id]
    }

    set({ challengeSwaps: { ...state.challengeSwaps, [originalId]: { drawn, cursor: nextCursor } } })
    get().saveGame()
  },

  // The chest-position array a zone's scene should actually render — same
  // length/order as the zone's static challenge list (so chest layout/x/y
  // stay stable), but with any rotated positions substituted for whichever
  // challenge currently occupies them.
  getLiveChallenges(zoneId) {
    const zone = ZONES[zoneId]
    const pool = resolvedBonusPools[zoneId]
    if (!pool || Object.keys(get().challengeSwaps).length === 0) return zone.challenges
    return zone.challenges.map((c) => {
      const currentId = get().currentOccupantId(c.id)
      if (currentId === c.id) return c
      return pool.find((b) => b.id === currentId) ?? c
    })
  },

  toggleInventory() {
    set((s) => ({ showInventory: !s.showInventory }))
  },

  toggleSettings() {
    set((s) => ({ showSettings: !s.showSettings }))
  },

  clearXpGain(id) {
    set((s) => (s.lastXpGain?.id === id ? { lastXpGain: null } : {}))
  },

  toggleStats() {
    set((s) => ({ showStats: !s.showStats }))
  },

  toggleOverworld() {
    set((s) => ({ showOverworld: !s.showOverworld }))
  },

  setOverworld(value) {
    set({ showOverworld: value })
  },

  toggleShortcuts() {
    set((s) => ({ showShortcuts: !s.showShortcuts }))
  },

  toggleGlossary() {
    set((s) => ({ showGlossary: !s.showGlossary }))
  },

  toggleQuests() {
    set((s) => ({ showQuests: !s.showQuests }))
  },

  completeOnboarding() {
    set({ hasOnboarded: true })
    get().saveGame()
  },

  awardXp(baseAmount, { usedHints = 0, speedBonus = false } = {}) {
    const state = get()
    let amount = baseAmount
    // hints reduce reward but never below a floor
    amount = Math.max(Math.round(amount * (1 - usedHints * 0.2)), Math.round(baseAmount * 0.4))
    // streak bonus
    const newStreak = state.streak + 1
    if (newStreak >= 3) amount = Math.round(amount * 1.25)
    if (speedBonus) amount = Math.round(amount * 1.15)

    let { level, xp } = state
    xp += amount
    let leveledUp = false
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level)
      level += 1
      leveledUp = true
    }

    set({
      xp, level, streak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastXpGain: { amount, id: Date.now() },
    })
    get().saveGame()
    return { amount, leveledUp, newLevel: level }
  },

  // A flat, unconditional XP reward (used for quest completions) — no
  // hint-penalty/streak-bonus math, and deliberately doesn't touch `streak`
  // itself, since completing a cross-cutting quest isn't "another challenge
  // solved in a row." Shares the same level-rollover logic as awardXp.
  awardQuestXp(amount) {
    const state = get()
    let { level, xp } = state
    xp += amount
    let leveledUp = false
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level)
      level += 1
      leveledUp = true
    }
    set({ xp, level, lastXpGain: { amount, id: Date.now() } })
    get().saveGame()
    return { amount, leveledUp, newLevel: level }
  },

  breakStreak() {
    set({ streak: 0 })
  },

  recordAttempt(success) {
    const state = get()
    set({
      totalAttempts: state.totalAttempts + 1,
      successfulAttempts: state.successfulAttempts + (success ? 1 : 0),
    })
    get().saveGame()
  },

  tickPlayTime(seconds) {
    set((s) => ({ totalPlaySeconds: s.totalPlaySeconds + seconds }))
    get().saveGame()
  },

  completeChallenge(challengeId, toolCard) {
    const state = get()
    if (state.completedChallenges.includes(challengeId)) return
    const inventory = toolCard
      ? [...state.inventory, toolCard]
      : state.inventory
    const zoneStats = {
      ...state.zoneStats,
      [state.zone]: (state.zoneStats[state.zone] ?? 0) + 1,
    }
    const completedChallenges = [...state.completedChallenges, challengeId]
    set({ completedChallenges, inventory, zoneStats })
    get().saveGame()

    // Cross-cutting quests (src/data/quests.js) — each one just watches for
    // a specific set of real challenge ids, spanning multiple zones, all
    // showing up in completedChallenges. Checked here (the one place a new
    // id ever gets added) rather than reactively in the UI, so the reward
    // is granted exactly once, the instant the LAST required challenge
    // (in whatever order the player actually solves them) completes.
    QUESTS.forEach((quest) => {
      if (get().claimedQuests.includes(quest.id)) return
      if (!quest.requiredChallengeIds.every((id) => completedChallenges.includes(id))) return
      const current = get()
      set({
        claimedQuests: [...current.claimedQuests, quest.id],
        inventory: quest.reward.tool ? [...current.inventory, quest.reward.tool] : current.inventory,
      })
      get().awardQuestXp(quest.reward.xp)
    })
  },

  isChallengeComplete(challengeId) {
    return get().completedChallenges.includes(challengeId)
  },

  isQuestComplete(questId) {
    const quest = QUESTS.find((q) => q.id === questId)
    if (!quest) return false
    const { completedChallenges } = get()
    return quest.requiredChallengeIds.every((id) => completedChallenges.includes(id))
  },

  getQuestProgress(questId) {
    const quest = QUESTS.find((q) => q.id === questId)
    if (!quest) return { done: 0, total: 0 }
    const { completedChallenges } = get()
    const done = quest.requiredChallengeIds.filter((id) => completedChallenges.includes(id)).length
    return { done, total: quest.requiredChallengeIds.length }
  },

  completeZone(zoneId, nextZoneId) {
    const state = get()
    const completedZones = state.completedZones.includes(zoneId)
      ? state.completedZones
      : [...state.completedZones, zoneId]
    const unlockedZones = nextZoneId && !state.unlockedZones.includes(nextZoneId)
      ? [...state.unlockedZones, nextZoneId]
      : state.unlockedZones
    set({ completedZones, unlockedZones })
    get().saveGame()
  },

  setZone(zoneId) {
    set({ zone: zoneId, playerPos: { x: 400, y: 300 } })
    get().saveGame()
  },

  triggerZoneComplete(zoneId) {
    const state = get()
    // revisiting an already-finished zone (via the Overworld map) shouldn't
    // replay its completion celebration / the game-ending screen every time
    if (state.zoneJustCompleted === zoneId || state.completedZones.includes(zoneId)) return
    set({ zoneJustCompleted: zoneId })
  },

  dismissZoneComplete() {
    set({ zoneJustCompleted: null })
  },

  xpForLevel,
}))
