import { describe, test, expect } from 'vitest'
import { findNextUnsolvedChallenge } from './challengeNav.js'

const zone = {
  challenges: [
    { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' },
  ],
}

describe('findNextUnsolvedChallenge', () => {
  test('returns the next challenge after the current one', () => {
    const next = findNextUnsolvedChallenge(zone, [], 'a')
    expect(next.id).toBe('b')
  })

  test('skips already-completed challenges', () => {
    const next = findNextUnsolvedChallenge(zone, ['b', 'c'], 'a')
    expect(next.id).toBe('d')
  })

  test('wraps around to the start of the zone', () => {
    const next = findNextUnsolvedChallenge(zone, ['a', 'b'], 'd')
    expect(next.id).toBe('c')
  })

  test('returns null when every other challenge is already solved', () => {
    const next = findNextUnsolvedChallenge(zone, ['a', 'b', 'c', 'd'], 'a')
    expect(next).toBe(null)
  })

  test('never returns the current challenge itself', () => {
    const oneChallengeZone = { challenges: [{ id: 'only' }] }
    const next = findNextUnsolvedChallenge(oneChallengeZone, [], 'only')
    expect(next).toBe(null)
  })
})
