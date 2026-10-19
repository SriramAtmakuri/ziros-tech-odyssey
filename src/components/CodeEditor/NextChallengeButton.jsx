import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { findNextUnsolvedChallenge } from '../../utils/challengeNav.js'
import { IconArrowRight } from '../icons/Icons.jsx'

// Shown in a challenge panel's success state — walks the player straight to
// the next unsolved chest in this zone and opens it, instead of leaving them
// to close the panel and go find it themselves. Renders nothing once every
// challenge in the zone is solved (nothing left to walk to).
export default function NextChallengeButton({ challenge }) {
  const zoneId = useGameStore((s) => s.zone)
  const zone = useGameStore((s) => ZONES[s.zone])
  const completedChallenges = useGameStore((s) => s.completedChallenges)
  const closeChallenge = useGameStore((s) => s.closeChallenge)
  const requestWalkToChallenge = useGameStore((s) => s.requestWalkToChallenge)
  const swapChallenge = useGameStore((s) => s.swapChallenge)
  const originalIdFor = useGameStore((s) => s.originalIdFor)

  // challenge.id may be a live bonus-pool occupant (after a rotation), which
  // never appears in zone.challenges — resolve back to its original position
  // id first, or findNextUnsolvedChallenge silently restarts from index 0.
  const originalId = originalIdFor(zoneId, challenge.id)
  const next = findNextUnsolvedChallenge(zone, completedChallenges, originalId)
  if (!next) return null

  return (
    <button
      type="button"
      onClick={() => {
        // The chest-swap/rotation feature (every zone now has a bonus pool):
        // the chest the player is leaving gets rotated to its next occupant
        // — invisible on this forward path (Next always routes to a still-
        // unsolved original), only found later on a backtrack.
        swapChallenge(challenge.id)
        closeChallenge()
        requestWalkToChallenge(next.id)
      }}
      className="flex items-center justify-center gap-2 w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg py-2.5 text-sm transition-colors"
    >
      Next: {next.title} <IconArrowRight className="w-4 h-4" />
    </button>
  )
}
