import { AnimatePresence, motion } from 'framer-motion'
import {
  Waves, ScrollText, TreePine, Server, Cloud, Puzzle, BrainCircuit,
  Stethoscope, Ship, Satellite, Palette, ShieldCheck, MessagesSquare,
} from 'lucide-react'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES, ZONE_ORDER } from '../../data/zones/index.js'
import { IconCheck, IconLock, IconClose, IconMap } from '../icons/Icons.jsx'

// One themed icon per zone, echoing the same domain each zone's chests
// already use (scroll, server, chip, cross, container...) so the map reads
// as the same world rather than a generic list.
const ZONE_ICON = {
  'sql-island': Waves,
  'code-kingdom': ScrollText,
  'python-jungle': TreePine,
  'data-realm': Server,
  'cloud-citadel': Cloud,
  'algorithm-dungeon': Puzzle,
  'ai-frontier': BrainCircuit,
  'healthcare-highlands': Stethoscope,
  'supply-chain-docks': Ship,
  'iot-outpost': Satellite,
  'web-dev-workshop': Palette,
  'security-stronghold': ShieldCheck,
  'collaboration-commons': MessagesSquare,
}

// A dedicated bright accent per zone for map chrome (node ring/tint/route) —
// deliberately NOT zone.palette.bg, since several zones' in-game canvas
// backgrounds are intentionally near-black (Python Jungle at night, AI
// Frontier, Security Stronghold's dark room) and disappear against this
// modal's own dark background.
const ZONE_ACCENT = {
  'sql-island': '#38bdf8',
  'code-kingdom': '#f59e0b',
  'python-jungle': '#4ade80',
  'data-realm': '#60a5fa',
  'cloud-citadel': '#7dd3fc',
  'algorithm-dungeon': '#a78bfa',
  'ai-frontier': '#e879f9',
  'healthcare-highlands': '#f87171',
  'supply-chain-docks': '#22d3ee',
  'iot-outpost': '#fbbf24',
  'web-dev-workshop': '#fb923c',
  'security-stronghold': '#ef4444',
  'collaboration-commons': '#2dd4bf',
}

const ROW_HEIGHT = 148
const NODE_SIZE = 72
const TOP_PAD = 60
const BOTTOM_PAD = 50

// A gentle left-right sway per node, like a level-select path — smoother and
// more game-like than a rigid 3-column grid.
function nodeX(i) {
  return 50 + 34 * Math.sin(i * 0.85)
}

function pathSegment(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
}

export default function Overworld() {
  const show = useGameStore((s) => s.showOverworld)
  const toggleOverworld = useGameStore((s) => s.toggleOverworld)
  const currentZone = useGameStore((s) => s.zone)
  const unlockedZones = useGameStore((s) => s.unlockedZones)
  const completedZones = useGameStore((s) => s.completedZones)
  const setZone = useGameStore((s) => s.setZone)

  const travelTo = (id) => {
    if (!unlockedZones.includes(id)) return
    setZone(id)
    toggleOverworld()
  }

  const totalHeight = TOP_PAD + (ZONE_ORDER.length - 1) * ROW_HEIGHT + BOTTOM_PAD

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-slate-950/97 backdrop-blur-sm overflow-y-auto"
        >
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                <IconMap className="w-6 h-6 text-amber-400" /> Tech Planet
              </h2>
              <button type="button" onClick={toggleOverworld} aria-label="Close" className="text-slate-400 hover:text-white"><IconClose className="w-6 h-6" /></button>
            </div>
            <p className="text-slate-500 text-sm mb-4">
              {completedZones.length} / {ZONE_ORDER.length} zones complete — pick any unlocked zone to travel there.
            </p>

            <div className="relative" style={{ height: totalHeight }}>
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 100 ${totalHeight}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {ZONE_ORDER.slice(0, -1).map((id, i) => {
                  const x1 = nodeX(i)
                  const x2 = nodeX(i + 1)
                  const y1 = TOP_PAD + i * ROW_HEIGHT
                  const y2 = TOP_PAD + (i + 1) * ROW_HEIGHT
                  const done = completedZones.includes(id)
                  return (
                    <path
                      key={id}
                      d={pathSegment(x1, y1, x2, y2)}
                      fill="none"
                      stroke={done ? '#fbbf24' : 'rgba(255,255,255,0.12)'}
                      strokeWidth={done ? 1.6 : 1.3}
                      strokeDasharray={done ? undefined : '3 3'}
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                })}
              </svg>

              {ZONE_ORDER.map((id, i) => {
                const zone = ZONES[id]
                const Icon = ZONE_ICON[id] ?? Waves
                const unlocked = unlockedZones.includes(id)
                const completed = completedZones.includes(id)
                const isCurrent = id === currentZone
                const prevZone = i > 0 ? ZONES[ZONE_ORDER[i - 1]] : null
                const accent = ZONE_ACCENT[id] ?? '#38bdf8'
                const x = nodeX(i)
                const y = TOP_PAD + i * ROW_HEIGHT

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => travelTo(id)}
                    disabled={!unlocked}
                    title={!unlocked && prevZone ? `Complete ${prevZone.name} first` : zone.name}
                    className="absolute flex flex-col items-center gap-1.5 -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: y }}
                  >
                    <span
                      className={`relative flex items-center justify-center rounded-full border-2 transition-all ${
                        unlocked
                          ? 'group-hover:-translate-y-0.5 group-hover:shadow-lg cursor-pointer'
                          : 'grayscale opacity-40 cursor-not-allowed'
                      } ${isCurrent ? 'ring-4 ring-amber-400/50' : ''}`}
                      style={{
                        width: NODE_SIZE,
                        height: NODE_SIZE,
                        background: unlocked ? `${accent}33` : 'rgba(255,255,255,0.04)',
                        borderColor: isCurrent ? '#fbbf24' : unlocked ? `${accent}88` : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: unlocked ? accent : '#64748b' }} strokeWidth={1.8} />
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-950 border border-white/15 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                        {i + 1}
                      </span>
                      {completed && (
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                          <IconCheck className="w-3.5 h-3.5 text-slate-950" strokeWidth={3} />
                        </span>
                      )}
                      {!unlocked && (
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center">
                          <IconLock className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                      )}
                    </span>
                    <span className={`text-xs font-semibold text-center leading-tight max-w-[110px] ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                      {zone.name}
                    </span>
                    {isCurrent && <span className="text-amber-400 text-[10px] font-semibold -mt-1">You are here</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
