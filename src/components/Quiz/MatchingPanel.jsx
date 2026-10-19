import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { sfx } from '../../utils/audioEngine.js'
import { flash } from '../../utils/screenFlash.js'
import { IconHint, IconCheck } from '../icons/Icons.jsx'
import useHintPulse from '../../hooks/useHintPulse.js'
import NextChallengeButton from '../CodeEditor/NextChallengeButton.jsx'

// Pair up two columns — click a term on the left, then its match on the
// right. challenge.pairs is the source of truth ({id, left, right});
// challenge.rightOrder is the author-scrambled display order for the right
// column (same "author decides the scramble" convention SequencePanel uses,
// rather than shuffling at runtime). Completes automatically once every
// pair is found — no separate "check" button needed.
export default function MatchingPanel({ challenge }) {
  const closeChallenge = useGameStore((s) => s.closeChallenge)
  const awardXp = useGameStore((s) => s.awardXp)
  const completeChallenge = useGameStore((s) => s.completeChallenge)
  const breakStreak = useGameStore((s) => s.breakStreak)
  const isChallengeComplete = useGameStore((s) => s.isChallengeComplete)
  const recordAttempt = useGameStore((s) => s.recordAttempt)

  const [matchedIds, setMatchedIds] = useState(new Set())
  const [selectedLeft, setSelectedLeft] = useState(null)
  const [wrongRightId, setWrongRightId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [shake, setShake] = useState(false)
  const startTimeRef = useRef(Date.now())
  const [hintPulse, clearHintPulse] = useHintPulse(challenge.id)

  const alreadyDone = isChallengeComplete(challenge.id)

  useEffect(() => {
    setMatchedIds(new Set())
    setSelectedLeft(null)
    setWrongRightId(null)
    setFeedback(null)
    setHintsShown(0)
    startTimeRef.current = Date.now()
  }, [challenge])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeChallenge() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeChallenge])

  const pairById = (id) => challenge.pairs.find((p) => p.id === id)
  const rightPairs = challenge.rightOrder.map((id) => pairById(id))

  const attemptMatch = (rightId) => {
    if (!selectedLeft || matchedIds.has(rightId)) return
    clearHintPulse()
    if (selectedLeft === rightId) {
      const next = new Set(matchedIds)
      next.add(rightId)
      setMatchedIds(next)
      setSelectedLeft(null)
      recordAttempt(true)
      sfx.itemPickup()

      if (next.size === challenge.pairs.length) {
        let xpInfo = null
        if (!alreadyDone) {
          xpInfo = awardXp(challenge.xp, {
            usedHints: hintsShown,
            speedBonus: Date.now() - startTimeRef.current < 45000,
          })
          completeChallenge(challenge.id, {
            id: challenge.id,
            name: challenge.tool.name,
            icon: challenge.tool.icon,
            description: challenge.tool.description,
            fun: challenge.tool.fun,
            zone: ZONES[useGameStore.getState().zone]?.name ?? 'Unknown Zone',
          })
        }
        setFeedback({ ok: true, message: challenge.successMessage ?? 'All matched!', xp: xpInfo?.amount })
        sfx.codeSuccess(); flash('#22c55e')
      }
    } else {
      recordAttempt(false)
      breakStreak()
      sfx.codeError(); flash('#ef4444')
      setWrongRightId(rightId)
      setShake(true)
      setTimeout(() => { setWrongRightId(null); setSelectedLeft(null); setShake(false) }, 400)
    }
  }

  const revealHint = () => { clearHintPulse(); sfx.hintUsed(); setHintsShown((h) => Math.min(h + 1, 3)) }

  return (
    <motion.div
      initial={{ x: 560, opacity: 0 }}
      animate={{ x: shake ? [0, -10, 10, -6, 6, 0] : 0, opacity: 1 }}
      exit={{ x: 560, opacity: 0 }}
      transition={{ type: shake ? 'tween' : 'spring', duration: shake ? 0.4 : undefined, damping: 24, stiffness: 240 }}
      className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[560px] bg-slate-950/98 border-l border-white/10 shadow-2xl flex flex-col"
    >
      <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-white/10">
        <div>
          <div className="text-xs uppercase tracking-wider text-purple-400 font-semibold">{challenge.npc}</div>
          <h2 className="text-lg font-bold text-white">{challenge.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-400 font-semibold">+{challenge.xp} XP</span>
          <button type="button" onClick={closeChallenge} className="text-slate-400 hover:text-white text-xl leading-none" aria-label="Close">×</button>
        </div>
      </div>

      <div className="px-5 py-3 text-slate-200 text-sm leading-relaxed border-b border-white/10 bg-white/[0.02]">
        {challenge.prompt}
        {alreadyDone && <div className="mt-1 text-emerald-400 text-xs font-semibold">✓ Already solved — feel free to try again.</div>}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 py-4 gap-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">Click a term on the left, then its match on the right</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            {challenge.pairs.map((p) => {
              const matched = matchedIds.has(p.id)
              return (
                <button
                  type="button"
                  key={p.id}
                  disabled={matched}
                  onClick={() => setSelectedLeft(p.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    matched
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                      : selectedLeft === p.id
                        ? 'bg-purple-500/20 border-purple-400/60 text-purple-100'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  {matched && <IconCheck className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                  {p.left}
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-2">
            {rightPairs.map((p) => {
              const matched = matchedIds.has(p.id)
              const wrong = wrongRightId === p.id
              return (
                <button
                  type="button"
                  key={p.id}
                  disabled={matched}
                  onClick={() => attemptMatch(p.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    matched
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                      : wrong
                        ? 'bg-red-500/15 border-red-400/50 text-red-200'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  {p.right}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={revealHint}
          disabled={hintsShown >= 3}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-sm font-medium transition-colors self-start ${hintPulse && hintsShown < 3 ? 'animate-pulse ring-2 ring-amber-400' : ''}`}
        >
          <IconHint className="w-4 h-4 text-amber-300" /> Hint ({hintsShown}/3)
        </button>

        {hintsShown > 0 && (
          <div className="space-y-1.5">
            {challenge.hints.slice(0, hintsShown).map((h, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-md px-3 py-2">
                <span className="font-semibold">Hint {i + 1}:</span> {h}
              </div>
            ))}
          </div>
        )}

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg px-3 py-2 text-sm font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
          >
            ✓ {feedback.message}
            {feedback.xp ? <span className="ml-2 text-amber-300">+{feedback.xp} XP</span> : null}
          </motion.div>
        )}
        {feedback?.ok && <NextChallengeButton challenge={challenge} />}
      </div>
    </motion.div>
  )
}
