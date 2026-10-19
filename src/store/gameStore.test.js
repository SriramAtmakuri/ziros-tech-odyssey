import {
  describe, test, expect, beforeAll, beforeEach, afterEach, vi,
} from 'vitest'
import { useGameStore } from './gameStore.js'
import { ZONES, ZONE_ORDER } from '../data/zones/index.js'
import { QUESTS } from '../data/quests.js'

// Bonus pools are lazily fetched (dynamic import) in production so a fresh
// page load doesn't eagerly bundle all 13 zones' bonus content — see
// gameStore.js's BONUS_POOL_LOADERS/ensureBonusPoolLoaded. Every test in this
// file that exercises swapChallenge/getLiveChallenges assumes real pool data
// is already available synchronously, so prefetch every zone's pool once,
// up front, rather than editing each test to await a fetch individually.
beforeAll(async () => {
  await Promise.all(ZONE_ORDER.map((id) => useGameStore.getState().ensureBonusPoolLoaded(id)))
})

// gameStore.saveGame() debounces a real localStorage write via setTimeout,
// and this suite runs in a plain Node environment (no localStorage global).
// Fake timers mean that setTimeout is scheduled but never actually fires,
// so the write never happens and never throws — we're only testing the
// pure state-transition logic here, not persistence.
beforeEach(() => {
  vi.useFakeTimers()
  useGameStore.setState({
    zone: 'sql-island',
    unlockedZones: ['sql-island'],
    completedZones: [],
    level: 1,
    xp: 0,
    streak: 0,
    longestStreak: 0,
    inventory: [],
    completedChallenges: [],
    zoneJustCompleted: null,
    totalAttempts: 0,
    successfulAttempts: 0,
    zoneStats: {},
    challengeSwaps: {},
  })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('awardXp', () => {
  test('awards the base amount with no modifiers', () => {
    const { amount } = useGameStore.getState().awardXp(40)
    expect(amount).toBe(40)
    expect(useGameStore.getState().xp).toBe(40)
  })

  test('reduces reward per hint used but never below the 40% floor', () => {
    const { amount } = useGameStore.getState().awardXp(100, { usedHints: 3 })
    // 100 * (1 - 3*0.2) = 40, exactly at the floor
    expect(amount).toBe(40)
  })

  test('applies a 25% streak bonus once streak reaches 3', () => {
    useGameStore.getState().awardXp(100) // streak -> 1
    useGameStore.getState().awardXp(100) // streak -> 2
    const { amount } = useGameStore.getState().awardXp(100) // streak -> 3, bonus applies
    expect(amount).toBe(125)
  })

  test('breakStreak resets streak to 0', () => {
    useGameStore.getState().awardXp(100)
    useGameStore.getState().breakStreak()
    expect(useGameStore.getState().streak).toBe(0)
  })

  test('levels up and carries over remainder xp', () => {
    // level 1 needs 100 xp to level up (xpForLevel(1) = 100)
    const { leveledUp, newLevel } = useGameStore.getState().awardXp(150)
    expect(leveledUp).toBe(true)
    expect(newLevel).toBe(2)
    expect(useGameStore.getState().xp).toBe(50)
  })
})

describe('completeChallenge', () => {
  test('adds the challenge id and tool card once', () => {
    useGameStore.getState().completeChallenge('sql-01', { id: 'sql-01', name: 'SELECT' })
    expect(useGameStore.getState().completedChallenges).toEqual(['sql-01'])
    expect(useGameStore.getState().inventory).toEqual([{ id: 'sql-01', name: 'SELECT' }])
  })

  test('is idempotent — completing the same challenge twice does not duplicate it', () => {
    useGameStore.getState().completeChallenge('sql-01', { id: 'sql-01', name: 'SELECT' })
    useGameStore.getState().completeChallenge('sql-01', { id: 'sql-01', name: 'SELECT' })
    expect(useGameStore.getState().completedChallenges).toEqual(['sql-01'])
    expect(useGameStore.getState().inventory.length).toBe(1)
  })

  test('tracks per-zone completed-challenge counts', () => {
    useGameStore.setState({ zone: 'sql-island' })
    useGameStore.getState().completeChallenge('sql-01', { id: 'sql-01', name: 'SELECT' })
    useGameStore.getState().completeChallenge('sql-02', { id: 'sql-02', name: 'WHERE' })
    expect(useGameStore.getState().zoneStats['sql-island']).toBe(2)
  })
})

describe('cross-cutting quests (src/data/quests.js)', () => {
  // "The Data Lifecycle" — sql-01-select-star (SQL Island), dr-01-elt-pipeline
  // (Data Realm), ai-01-ml-pipeline (AI Frontier): three real, permanent
  // main-pool challenge ids spanning three different zones.
  const QUEST_ID = 'quest-data-lifecycle'
  const [idA, idB, idC] = ['sql-01-select-star', 'dr-01-elt-pipeline', 'ai-01-ml-pipeline']

  test('isQuestComplete/getQuestProgress reflect partial progress before all three are done', () => {
    useGameStore.getState().completeChallenge(idA, { id: 'a', name: 'A' })
    expect(useGameStore.getState().isQuestComplete(QUEST_ID)).toBe(false)
    expect(useGameStore.getState().getQuestProgress(QUEST_ID)).toEqual({ done: 1, total: 3 })
  })

  test('completing the last required challenge (in any order) auto-awards the quest exactly once', () => {
    // beforeEach resets level: 1, xp: 0 — a flat +150 award rolls over the
    // level-1 threshold (xpForLevel(1) === 100), so the raw `xp` field alone
    // isn't the total; reconstruct total accumulated XP the same way
    // ZoneComplete.jsx does, to verify the full 150 was actually granted.
    useGameStore.getState().completeChallenge(idC, { id: 'c', name: 'C' })
    useGameStore.getState().completeChallenge(idA, { id: 'a', name: 'A' })
    useGameStore.getState().completeChallenge(idB, { id: 'b', name: 'B' })

    const s = useGameStore.getState()
    expect(s.isQuestComplete(QUEST_ID)).toBe(true)
    expect(s.claimedQuests).toContain(QUEST_ID)
    let totalXp = s.xp
    for (let i = 1; i < s.level; i += 1) totalXp += s.xpForLevel(i)
    expect(totalXp).toBe(150)
    expect(s.inventory.map((t) => t.name)).toContain('End-to-End Data Sense')

    // Re-completing an already-solved challenge id is a no-op (existing
    // idempotent guard in completeChallenge) — confirms the quest reward
    // can't be re-granted by re-triggering completion of one of its
    // requirements a second time.
    const { xp: xpAfterClaim, level: levelAfterClaim } = useGameStore.getState()
    useGameStore.getState().completeChallenge(idA, { id: 'a', name: 'A' })
    expect(useGameStore.getState().xp).toBe(xpAfterClaim)
    expect(useGameStore.getState().level).toBe(levelAfterClaim)
    expect(useGameStore.getState().claimedQuests.filter((id) => id === QUEST_ID)).toHaveLength(1)
  })

  test('every quest\'s requiredChallengeIds reference real challenges that actually exist', () => {
    const allIds = new Set(Object.values(ZONES).flatMap((z) => z.challenges.map((c) => c.id)))
    QUESTS.forEach((quest) => {
      quest.requiredChallengeIds.forEach((id) => {
        expect(allIds.has(id), `${quest.id} references missing challenge id "${id}"`).toBe(true)
      })
    })
  })
})

describe('completeZone / setZone', () => {
  test('marks a zone completed and unlocks the next one', () => {
    useGameStore.getState().completeZone('sql-island', 'code-kingdom')
    expect(useGameStore.getState().completedZones).toEqual(['sql-island'])
    expect(useGameStore.getState().unlockedZones).toContain('code-kingdom')
  })

  test('completing an already-completed zone does not duplicate it', () => {
    useGameStore.getState().completeZone('sql-island', 'code-kingdom')
    useGameStore.getState().completeZone('sql-island', 'code-kingdom')
    expect(useGameStore.getState().completedZones).toEqual(['sql-island'])
  })
})

describe('triggerZoneComplete', () => {
  test('sets zoneJustCompleted for a fresh completion', () => {
    useGameStore.getState().triggerZoneComplete('sql-island')
    expect(useGameStore.getState().zoneJustCompleted).toBe('sql-island')
  })

  test('does not retrigger for a zone already in completedZones (Overworld revisit)', () => {
    useGameStore.setState({ completedZones: ['sql-island'] })
    useGameStore.getState().triggerZoneComplete('sql-island')
    expect(useGameStore.getState().zoneJustCompleted).toBe(null)
  })

  test('does not retrigger while already showing for the same zone', () => {
    useGameStore.getState().triggerZoneComplete('sql-island')
    useGameStore.getState().dismissZoneComplete()
    useGameStore.setState({ zoneJustCompleted: 'sql-island' })
    useGameStore.getState().triggerZoneComplete('sql-island')
    expect(useGameStore.getState().zoneJustCompleted).toBe('sql-island')
  })
})

describe('clearSave', () => {
  test('cancels any pending debounced save before resetting state', () => {
    useGameStore.getState().awardXp(50) // schedules a debounced save via setTimeout
    useGameStore.getState().clearSave()
    // if the pending timer weren't cancelled, advancing it here would try to
    // write the pre-clear snapshot to localStorage (undefined in this
    // environment) and throw
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow()
    expect(useGameStore.getState().xp).toBe(0)
    expect(useGameStore.getState().level).toBe(1)
  })
})

describe('requestWalkToChallenge / clearWalkRequest', () => {
  test('sets and clears the pending walk request', () => {
    useGameStore.getState().requestWalkToChallenge('sql-05-blacksmiths')
    expect(useGameStore.getState().nextChallengeRequest).toBe('sql-05-blacksmiths')
    useGameStore.getState().clearWalkRequest()
    expect(useGameStore.getState().nextChallengeRequest).toBe(null)
  })
})

describe('swapChallenge / getLiveChallenges (bonus-pool registry, 3-step rotation)', () => {
  test('swaps a solved SQL Island chest position for a fresh bonus challenge (cursor 0 -> 1)', () => {
    useGameStore.getState().swapChallenge('sql-01-select-star')
    const entry = useGameStore.getState().challengeSwaps['sql-01-select-star']
    expect(entry).toEqual({ drawn: ['sql-bonus-01-union'], cursor: 1 })
  })

  test('solving the drawn bonus challenge advances to the second bonus draw (reverse lookup by current occupant id)', () => {
    useGameStore.getState().swapChallenge('sql-01-select-star')
    const firstBonusId = useGameStore.getState().challengeSwaps['sql-01-select-star'].drawn[0]
    useGameStore.getState().swapChallenge(firstBonusId)
    const entry = useGameStore.getState().challengeSwaps['sql-01-select-star']
    expect(entry.cursor).toBe(2)
    expect(entry.drawn).toHaveLength(2)
    expect(entry.drawn[1]).not.toBe(firstBonusId)
  })

  test('rotates back to the original after the 2nd bonus is solved, then back through the same 2 drawn challenges forever', () => {
    const id = 'sql-01-select-star'
    useGameStore.getState().swapChallenge(id) // cursor 0 -> 1
    const [firstBonusId] = useGameStore.getState().challengeSwaps[id].drawn
    useGameStore.getState().swapChallenge(firstBonusId) // cursor 1 -> 2
    const drawnAfterBoth = useGameStore.getState().challengeSwaps[id].drawn
    useGameStore.getState().swapChallenge(drawnAfterBoth[1]) // cursor 2 -> 0 (rotate back to original)
    let entry = useGameStore.getState().challengeSwaps[id]
    expect(entry.cursor).toBe(0)
    expect(entry.drawn).toEqual(drawnAfterBoth) // no new draw needed to rotate back

    useGameStore.getState().swapChallenge(id) // cursor 0 -> 1 again, same drawn pair reused
    entry = useGameStore.getState().challengeSwaps[id]
    expect(entry.cursor).toBe(1)
    expect(entry.drawn).toEqual(drawnAfterBoth) // still the same 2 — no fresh pool draw on the second lap
  })

  test('draws a different bonus challenge for a second position', () => {
    useGameStore.getState().swapChallenge('sql-01-select-star')
    useGameStore.getState().swapChallenge('sql-02-select-columns')
    const swaps = useGameStore.getState().challengeSwaps
    expect(swaps['sql-01-select-star'].drawn[0]).not.toBe(swaps['sql-02-select-columns'].drawn[0])
  })

  test('no-ops for an id that is not a real SQL Island chest position', () => {
    useGameStore.getState().swapChallenge('not-a-real-challenge-id')
    expect(useGameStore.getState().challengeSwaps).toEqual({})
  })

  test('no-ops for an id belonging to no registered zone (all 13 zones now have pools)', () => {
    // Every zone in ZONE_ORDER now has a registered bonus pool, so there's
    // no longer a real "poolless zone" example to reach for — this just
    // confirms swapChallenge still safely no-ops for an id that matches
    // nothing in any zone's static challenges or any registered pool's
    // current occupants.
    useGameStore.getState().swapChallenge('zz-not-a-real-id-anywhere')
    expect(useGameStore.getState().challengeSwaps).toEqual({})
  })

  test('DOES swap a real Code Kingdom chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('ck-00-first-command')
    expect(useGameStore.getState().challengeSwaps['ck-00-first-command']).toEqual({ drawn: ['ck-pool-01-git-stash'], cursor: 1 })
  })

  test('DOES swap a real Python Jungle chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('py-00-first-print')
    expect(useGameStore.getState().challengeSwaps['py-00-first-print']).toEqual({ drawn: ['py-pool-01-type-isinstance'], cursor: 1 })
  })

  test('DOES swap a real Data Realm chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('dr-01-elt-pipeline')
    expect(useGameStore.getState().challengeSwaps['dr-01-elt-pipeline']).toEqual({ drawn: ['dr-pool-01-cdc-flow'], cursor: 1 })
  })

  test('DOES swap a real Cloud Citadel chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('cc-01-ha-rollout')
    expect(useGameStore.getState().challengeSwaps['cc-01-ha-rollout']).toEqual({ drawn: ['cc-pool-01-s3-lifecycle'], cursor: 1 })
  })

  test('DOES swap a real Algorithm Dungeon chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('algo-01-two-sum')
    expect(useGameStore.getState().challengeSwaps['algo-01-two-sum']).toEqual({ drawn: ['algo-pool-01-quicksort'], cursor: 1 })
  })

  test('DOES swap a real AI Frontier chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('ai-01-ml-pipeline')
    expect(useGameStore.getState().challengeSwaps['ai-01-ml-pipeline']).toEqual({ drawn: ['ai-pool-01-sigmoid'], cursor: 1 })
  })

  test('DOES swap a real Healthcare Highlands chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('hh-01-hipaa-process')
    expect(useGameStore.getState().challengeSwaps['hh-01-hipaa-process']).toEqual({ drawn: ['hh-pool-01-fhir-condition'], cursor: 1 })
  })

  test('DOES swap a real Supply Chain Docks chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('sc-01-supply-chain-flow')
    expect(useGameStore.getState().challengeSwaps['sc-01-supply-chain-flow']).toEqual({ drawn: ['sc-pool-01-safety-stock'], cursor: 1 })
  })

  test('DOES swap a real IoT Outpost chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('iot-01-stack-layers')
    expect(useGameStore.getState().challengeSwaps['iot-01-stack-layers']).toEqual({ drawn: ['iot-pool-01-mqtt-dedup'], cursor: 1 })
  })

  test('DOES swap a real Web Dev Workshop chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('wd-01-semantic-html')
    expect(useGameStore.getState().challengeSwaps['wd-01-semantic-html']).toEqual({ drawn: ['wd-pool-01-css-variables'], cursor: 1 })
  })

  test('DOES swap a real Security Stronghold chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('ss-01-sql-injection')
    expect(useGameStore.getState().challengeSwaps['ss-01-sql-injection']).toEqual({ drawn: ['ss-pool-01-secure-token'], cursor: 1 })
  })

  test('DOES swap a real Collaboration Commons chest position now that it has its own registered pool', () => {
    useGameStore.getState().swapChallenge('cc-01-jira-setup')
    expect(useGameStore.getState().challengeSwaps['cc-01-jira-setup']).toEqual({ drawn: ['comm-pool-01-burndown'], cursor: 1 })
  })

  test('getLiveChallenges returns the untouched zone array when nothing has been swapped', () => {
    const live = useGameStore.getState().getLiveChallenges('sql-island')
    expect(live.map((c) => c.id)).not.toContain('sql-bonus-01-union')
    expect(live).toHaveLength(30)
  })

  test('getLiveChallenges returns the untouched zone array for Collaboration Commons when nothing has been swapped there', () => {
    // Every zone in ZONE_ORDER now has a registered bonus pool (Collaboration
    // Commons, the 13th and final zone, just shipped its own) — so there's
    // no longer a real "zone with no pool" example to test against. This
    // instead confirms the untouched-array behavior on the last zone to
    // get one.
    const live = useGameStore.getState().getLiveChallenges('collaboration-commons')
    expect(live.map((c) => c.id)).not.toContain('comm-pool-01-burndown')
    expect(live).toHaveLength(10)
  })

  test('getLiveChallenges substitutes the bonus challenge at the swapped position, same length/order', () => {
    useGameStore.getState().swapChallenge('sql-01-select-star')
    const live = useGameStore.getState().getLiveChallenges('sql-island')
    expect(live).toHaveLength(30)
    expect(live[2].id).toBe('sql-bonus-01-union') // sql-01-select-star is index 2 (after the two sql-00 intros)
  })

  test('getLiveChallenges shows the ORIGINAL challenge again once rotated all the way back around', () => {
    const id = 'sql-01-select-star'
    useGameStore.getState().swapChallenge(id)
    const [firstBonusId] = useGameStore.getState().challengeSwaps[id].drawn
    useGameStore.getState().swapChallenge(firstBonusId)
    const [, secondBonusId] = useGameStore.getState().challengeSwaps[id].drawn
    useGameStore.getState().swapChallenge(secondBonusId)
    const live = useGameStore.getState().getLiveChallenges('sql-island')
    expect(live[2].id).toBe(id)
  })

  // Regression test for a real bug: NextChallengeButton.jsx passes whatever
  // was just solved to findNextUnsolvedChallenge, which looks it up in the
  // zone's STATIC challenges array by id. Once a position rotates to a
  // bonus-pool challenge (an id that was never in that array), the lookup
  // silently returned -1 and navigation defaulted back to index 0 instead of
  // the player's real position. originalIdFor() is the fix — it must resolve
  // a live bonus occupant id back to the original position id it belongs to.
  test('originalIdFor resolves a live bonus occupant back to its original position id', () => {
    const originalId = 'sql-01-select-star'
    useGameStore.getState().swapChallenge(originalId)
    const [bonusId] = useGameStore.getState().challengeSwaps[originalId].drawn
    expect(useGameStore.getState().originalIdFor('sql-island', bonusId)).toBe(originalId)
  })

  test('originalIdFor returns the id unchanged when it is already an original position', () => {
    expect(useGameStore.getState().originalIdFor('sql-island', 'sql-01-select-star')).toBe('sql-01-select-star')
  })
})

describe('fresh game defaults', () => {
  test('every zone is unlocked from the start, so any zone can be played immediately', () => {
    useGameStore.getState().clearSave() // resets to defaultState
    expect(useGameStore.getState().unlockedZones).toEqual(ZONE_ORDER)
    // unlocking for travel is independent from earned progress
    expect(useGameStore.getState().completedZones).toEqual([])
  })

  // Regression test for a real bug: clearSave() used to only spread
  // defaultState, which Zustand shallow-merges — so transient UI fields
  // (never part of defaultState) survived a "Clear Save"/"New Game" click
  // untouched. A stale dialogue/activeChallenge/modal-visibility flag from
  // the moment "Clear Save Data" was clicked would bleed into the new game.
  test('clearSave resets transient UI state, not just persisted fields', () => {
    useGameStore.setState({
      dialogue: { npcName: 'Test', lines: ['hi'] },
      activeChallenge: { id: 'whatever' },
      showInventory: true,
      showSettings: true,
      showStats: true,
      showOverworld: true,
      showShortcuts: true,
      showGlossary: true,
      showQuests: true,
      lastXpGain: { amount: 10 },
      zoneJustCompleted: 'sql-island',
      nextChallengeRequest: 'sql-01-select-star',
    })
    useGameStore.getState().clearSave()
    const s = useGameStore.getState()
    expect(s.dialogue).toBe(null)
    expect(s.activeChallenge).toBe(null)
    expect(s.showInventory).toBe(false)
    expect(s.showSettings).toBe(false)
    expect(s.showStats).toBe(false)
    expect(s.showOverworld).toBe(false)
    expect(s.showShortcuts).toBe(false)
    expect(s.showGlossary).toBe(false)
    expect(s.showQuests).toBe(false)
    expect(s.lastXpGain).toBe(null)
    expect(s.zoneJustCompleted).toBe(null)
    expect(s.nextChallengeRequest).toBe(null)
  })
})
