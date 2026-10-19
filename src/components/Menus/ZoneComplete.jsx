import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES, ZONE_ORDER } from '../../data/zones/index.js'
import { sfx } from '../../utils/audioEngine.js'
import EpilogueCutscene from './EpilogueCutscene.jsx'

export default function ZoneComplete() {
  const zoneId = useGameStore((s) => s.zoneJustCompleted)
  // Plays once, right before the final zone's trophy card — a real scripted
  // cutscene (mirroring OpeningCutscene.jsx) instead of jumping straight
  // from the last chest to a stats screen. Local state, not store state:
  // isFinalZone below already only computes true for a genuinely
  // just-finished, not-yet-recorded final zone, so this naturally can't
  // replay on a revisit (the whole ZoneComplete overlay wouldn't even
  // mount again for an already-completed zone).
  const [epilogueSeen, setEpilogueSeen] = useState(false)
  const dismissZoneComplete = useGameStore((s) => s.dismissZoneComplete)
  const completeZone = useGameStore((s) => s.completeZone)
  const setZone = useGameStore((s) => s.setZone)
  const setOverworld = useGameStore((s) => s.setOverworld)
  const completedChallenges = useGameStore((s) => s.completedChallenges)
  const completedZones = useGameStore((s) => s.completedZones)
  const inventory = useGameStore((s) => s.inventory)
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const xpForLevel = useGameStore((s) => s.xpForLevel)

  useEffect(() => {
    if (zoneId) sfx.zoneComplete()
  }, [zoneId])

  // Note: this component (and its AnimatePresence) must stay mounted even
  // while there's nothing to show — an early `return null` here would
  // unmount AnimatePresence itself, so the exit-fade never gets a chance to
  // play. Only the JSX below is conditional on `zone`.
  const zone = zoneId ? ZONES[zoneId] : null

  const required = zone ? zone.challenges.filter((c) => !c.bonus) : []
  const total = required.length
  const done = required.filter((c) => completedChallenges.includes(c.id)).length
  // Match by the tool card's own `zone` name field (set at completion time),
  // not by looking the card's id up in the zone's static challenge array —
  // a tool earned from a bonus-pool challenge (chest-swap feature) has an
  // id that was never in that static array and would silently disappear
  // from this tally otherwise, even though it's a real, correctly-earned tool.
  const toolsLearned = zone ? inventory.filter((t) => t.zone === zone.name) : []
  const nextZone = zone?.nextZone ? ZONES[zone.nextZone] : null
  const isFinalZone = !!zone && !zone.nextZone && !completedZones.includes(zoneId)
    && ZONE_ORDER.indexOf(zoneId) === ZONE_ORDER.length - 1

  let totalXp = xp
  for (let i = 1; i < level; i += 1) totalXp += xpForLevel(i)

  const handleContinue = () => {
    completeZone(zoneId, zone.nextZone)
    dismissZoneComplete()
    if (zone.nextZone) setZone(zone.nextZone)
  }

  const handleFinish = () => {
    completeZone(zoneId, null)
    dismissZoneComplete()
    setOverworld(true)
  }

  if (isFinalZone && !epilogueSeen) {
    return <EpilogueCutscene onDone={() => setEpilogueSeen(true)} />
  }

  return (
    <AnimatePresence>
      {zone && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 220 }}
          className={`bg-slate-950 border rounded-2xl p-8 w-[420px] shadow-2xl text-center ${isFinalZone ? 'border-amber-400/60' : 'border-amber-400/30'}`}
        >
          {isFinalZone ? (
            <>
              <div className="text-6xl mb-3">🏆</div>
              <h2 className="text-2xl font-black text-white mb-1">Ziro's Tech Odyssey — Complete!</h2>
              <p className="text-amber-400 font-semibold mb-6">Every zone on Tech Planet, fixed.</p>

              <div className="grid grid-cols-3 gap-2 mb-6 text-left">
                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-xl font-bold text-white">{completedZones.length + 1}/{ZONE_ORDER.length}</div>
                  <div className="text-[10px] text-slate-500">Zones complete</div>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-xl font-bold text-white">{totalXp.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">Total XP</div>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-xl font-bold text-white">{inventory.length}</div>
                  <div className="text-[10px] text-slate-500">Tools learned</div>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-6">
                Ziro fixed the databases, pipelines, clusters, and codebases of an entire planet.
                Tech Planet is whole again — and it's thanks to you.
              </p>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg py-3 transition-colors"
              >
                View Tech Planet →
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-white mb-1">Zone Complete!</h2>
              <p className="text-amber-400 font-semibold mb-6">{zone.name}</p>

              <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{done}/{total}</div>
                  <div className="text-[11px] text-slate-500">Challenges solved</div>
                </div>
                <div className="bg-white/[0.04] rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{toolsLearned.length}</div>
                  <div className="text-[11px] text-slate-500">Tools learned</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center mb-6 max-h-24 overflow-y-auto">
                {toolsLearned.map((t) => (
                  <span key={t.id} className="text-xs bg-white/5 border border-white/10 rounded-full px-2 py-1 text-slate-300">
                    {t.icon} {t.name}
                  </span>
                ))}
              </div>

              {nextZone ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg py-3 transition-colors"
                >
                  Continue to {nextZone.name} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg py-3 transition-colors"
                >
                  Back to Tech Planet
                </button>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
