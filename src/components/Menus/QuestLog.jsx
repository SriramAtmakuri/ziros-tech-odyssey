import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { QUESTS } from '../../data/quests.js'
import { IconQuest, IconClose, IconCheck } from '../icons/Icons.jsx'

// Looks up a required challenge id's title/zone name fresh from ZONES every
// render, rather than duplicating that text inside quests.js — a zone's
// challenge titles are the single source of truth, so this can never drift
// out of sync with them.
function findChallengeInfo(challengeId) {
  for (const zone of Object.values(ZONES)) {
    const challenge = zone.challenges.find((c) => c.id === challengeId)
    if (challenge) return { title: challenge.title, zoneName: zone.name }
  }
  return { title: challengeId, zoneName: 'Unknown zone' }
}

function QuestCard({ quest }) {
  const completedChallenges = useGameStore((s) => s.completedChallenges)
  const claimed = useGameStore((s) => s.claimedQuests.includes(quest.id))

  return (
    <div className={`px-4 py-3 rounded-xl border ${claimed ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="text-sm font-bold text-white">{quest.title}</h3>
        {claimed && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 flex-shrink-0">
            <IconCheck className="w-3.5 h-3.5" /> Complete
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-snug mb-2.5">{quest.description}</p>

      <div className="space-y-1 mb-2.5">
        {quest.requiredChallengeIds.map((id) => {
          const done = completedChallenges.includes(id)
          const { title, zoneName } = findChallengeInfo(id)
          return (
            <div key={id} className="flex items-center gap-2 text-xs">
              <span className={`flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0 ${done ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-transparent'}`}>
                <IconCheck className="w-2.5 h-2.5" />
              </span>
              <span className={done ? 'text-slate-300' : 'text-slate-500'}>{title}</span>
              <span className="text-slate-600">— {zoneName}</span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-amber-300/90 pt-2 border-t border-white/5">
        <span>{quest.reward.tool.icon}</span>
        <span className="font-medium">{quest.reward.tool.name}</span>
        <span className="text-slate-600">·</span>
        <span>+{quest.reward.xp} XP</span>
      </div>
    </div>
  )
}

// A browsable log of cross-cutting side quests — each one rewards the
// player for completing specific real challenges spanning multiple
// different zones (see src/data/quests.js). Purely a read-only progress
// view; quests auto-complete and auto-award the moment their last required
// challenge is solved (see gameStore.js's completeChallenge), regardless of
// whether this log has ever been opened.
export default function QuestLog() {
  const show = useGameStore((s) => s.showQuests)
  const toggleQuests = useGameStore((s) => s.toggleQuests)
  const claimedQuests = useGameStore((s) => s.claimedQuests)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={toggleQuests}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <IconQuest className="w-5 h-5 text-amber-400" /> Quests
              </h2>
              <button type="button" onClick={toggleQuests} aria-label="Close" className="text-slate-400 hover:text-white"><IconClose className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4 flex-shrink-0">
              {claimedQuests.length}/{QUESTS.length} complete — side quests that connect what you learn across different zones.
            </p>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
              {QUESTS.map((quest) => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-slate-500 flex-shrink-0">Press Q or click outside to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
