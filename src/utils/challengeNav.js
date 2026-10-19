// Finds the next not-yet-solved challenge in a zone, starting right after the
// given challenge and wrapping around — so "Next" always lands on something
// left to do, regardless of the order a player actually solved things in.
export function findNextUnsolvedChallenge(zone, completedChallenges, currentChallengeId) {
  const { challenges } = zone
  const currentIdx = challenges.findIndex((c) => c.id === currentChallengeId)
  const startIdx = currentIdx === -1 ? 0 : currentIdx
  for (let offset = 1; offset <= challenges.length; offset += 1) {
    const idx = (startIdx + offset) % challenges.length
    const candidate = challenges[idx]
    if (candidate.id !== currentChallengeId && !completedChallenges.includes(candidate.id)) {
      return candidate
    }
  }
  return null
}
