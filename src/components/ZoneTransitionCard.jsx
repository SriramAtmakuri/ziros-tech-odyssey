import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'
import { ZONES } from '../data/zones/index.js'

// A brief title card whenever the player's zone changes — doesn't block
// movement, just announces where Ziro just arrived.
export default function ZoneTransitionCard() {
  const zone = useGameStore((s) => s.zone)
  const level = useGameStore((s) => s.level)
  const [visible, setVisible] = useState(false)
  const [shownFor, setShownFor] = useState(null)

  useEffect(() => {
    if (zone === shownFor) return undefined
    setShownFor(zone)
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone])

  const zoneData = ZONES[zone]

  return (
    <AnimatePresence>
      {visible && zoneData && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center"
        >
          <div className="bg-black/70 border border-white/15 rounded-xl px-6 py-3 backdrop-blur">
            <div className="text-2xl font-black text-white tracking-wide">{zoneData.name}</div>
            <div className="text-xs text-amber-400 mt-1">Ziro — Level {level}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
