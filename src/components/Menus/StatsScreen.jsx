import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES, ZONE_ORDER } from '../../data/zones/index.js'
import {
  IconStats, IconClose, IconClock, IconMap, IconSparkles, IconTarget, IconToolbox, IconFlame, IconStar,
} from '../icons/Icons.jsx'

function formatPlayTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0 && minutes === 0) return 'under a minute'
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function StatRow({ icon: Icon, iconClass, label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl">
      <div className="flex items-center gap-3 text-slate-300 text-sm">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        {label}
      </div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  )
}

export default function StatsScreen() {
  const show = useGameStore((s) => s.showStats)
  const toggleStats = useGameStore((s) => s.toggleStats)
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const longestStreak = useGameStore((s) => s.longestStreak)
  const completedZones = useGameStore((s) => s.completedZones)
  const inventory = useGameStore((s) => s.inventory)
  const totalPlaySeconds = useGameStore((s) => s.totalPlaySeconds)
  const totalAttempts = useGameStore((s) => s.totalAttempts)
  const successfulAttempts = useGameStore((s) => s.successfulAttempts)
  const zoneStats = useGameStore((s) => s.zoneStats)
  const xpForLevel = useGameStore((s) => s.xpForLevel)

  let totalXp = xp
  for (let i = 1; i < level; i += 1) totalXp += xpForLevel(i)

  const accuracy = totalAttempts === 0 ? null : Math.round((successfulAttempts / totalAttempts) * 100)

  const favoriteZoneId = Object.entries(zoneStats).sort((a, b) => b[1] - a[1])[0]?.[0]
  const favoriteZoneName = favoriteZoneId ? ZONES[favoriteZoneId]?.name ?? '—' : '—'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={toggleStats}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <IconStats className="w-5 h-5 text-sky-400" /> Ziro's Journey
              </h2>
              <button type="button" onClick={toggleStats} aria-label="Close" className="text-slate-400 hover:text-white leading-none"><IconClose className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <StatRow icon={IconClock} iconClass="text-sky-400" label="Total play time" value={formatPlayTime(totalPlaySeconds)} />
              <StatRow icon={IconMap} iconClass="text-emerald-400" label="Zones completed" value={`${completedZones.length} / ${ZONE_ORDER.length}`} />
              <StatRow icon={IconSparkles} iconClass="text-amber-400" label="Total XP earned" value={totalXp.toLocaleString()} />
              <StatRow icon={IconTarget} iconClass="text-red-400" label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
              <StatRow icon={IconToolbox} iconClass="text-purple-400" label="Tools learned" value={inventory.length} />
              <StatRow icon={IconFlame} iconClass="text-orange-400" label="Longest streak" value={longestStreak} />
              <StatRow icon={IconStar} iconClass="text-yellow-400" label="Favorite zone" value={favoriteZoneName} />
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">Press Tab to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
