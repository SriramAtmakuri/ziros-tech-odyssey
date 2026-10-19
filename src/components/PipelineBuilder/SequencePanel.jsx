import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { sfx } from '../../utils/audioEngine.js'
import { flash } from '../../utils/screenFlash.js'
import { IconPlay, IconHint } from '../icons/Icons.jsx'
import useHintPulse from '../../hooks/useHintPulse.js'
import NextChallengeButton from '../CodeEditor/NextChallengeButton.jsx'

// A "build/pipeline" challenge: click shuffled tiles into ordered slots
// (drag would be nicer, but click-to-place is far more reliable across
// input devices and just as clear pedagogically). challenge.items is the
// shuffled bank; challenge.correctOrder is the array of ids in right order.
export default function SequencePanel({ challenge }) {
  const closeChallenge = useGameStore((s) => s.closeChallenge)
  const awardXp = useGameStore((s) => s.awardXp)
  const completeChallenge = useGameStore((s) => s.completeChallenge)
  const breakStreak = useGameStore((s) => s.breakStreak)
  const isChallengeComplete = useGameStore((s) => s.isChallengeComplete)
  const recordAttempt = useGameStore((s) => s.recordAttempt)

  const [slots, setSlots] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [shake, setShake] = useState(false)
  const startTimeRef = useRef(Date.now())
  const [hintPulse, clearHintPulse] = useHintPulse(challenge.id)

  const alreadyDone = isChallengeComplete(challenge.id)

  useEffect(() => {
    setSlots(new Array(challenge.correctOrder.length).fill(null))
    setFeedback(null)
    setHintsShown(0)
    startTimeRef.current = Date.now()
  }, [challenge])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeChallenge() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeChallenge])

  const placed = new Set(slots.filter(Boolean))
  const bank = challenge.items.filter((item) => !placed.has(item.id))

  const placeItem = (id) => {
    const firstEmpty = slots.findIndex((s) => s === null)
    if (firstEmpty === -1) return
    sfx.itemPickup()
    const next = [...slots]
    next[firstEmpty] = id
    setSlots(next)
    setFeedback(null)
  }

  const removeSlot = (index) => {
    if (!slots[index]) return
    const next = [...slots]
    next[index] = null
    setSlots(next)
    setFeedback(null)
  }

  const check = () => {
    clearHintPulse()
    if (slots.some((s) => s === null)) {
      setFeedback({ ok: false, message: 'Fill every slot before checking.' })
      return
    }
    const correct = slots.every((id, i) => id === challenge.correctOrder[i])
    recordAttempt(correct)
    if (correct) {
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
      setFeedback({ ok: true, message: challenge.successMessage ?? 'Correct order!', xp: xpInfo?.amount })
      sfx.codeSuccess(); flash('#22c55e')
    } else {
      setFeedback({ ok: false, message: 'That order isn\'t quite right yet.' })
      breakStreak()
      sfx.codeError(); flash('#ef4444')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  const revealHint = () => { clearHintPulse(); sfx.hintUsed(); setHintsShown((h) => Math.min(h + 1, 3)) }
  const itemById = (id) => challenge.items.find((it) => it.id === id)

  return (
    <motion.div
      initial={{ x: 560, opacity: 0 }}
      animate={{ x: shake ? [0, -12, 12, -8, 8, 0] : 0, opacity: 1 }}
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
        {alreadyDone && <div className="mt-1 text-emerald-400 text-xs font-semibold">✓ Already solved — feel free to experiment.</div>}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col px-5 py-4 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Order it correctly (click a slot to place, click again to remove)</div>
          <div className="flex flex-col gap-2">
            {slots.map((id, i) => (
              <button
                type="button"
                key={`slot-${i}`}
                onClick={() => removeSlot(i)}
                className={`text-left px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${id ? 'bg-purple-500/15 border-purple-400/40 text-purple-100' : 'bg-white/[0.03] border-dashed border-white/15 text-slate-500'}`}
              >
                <span className="text-slate-500 mr-2">{i + 1}.</span>
                {id ? itemById(id)?.label : 'empty slot'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Available pieces</div>
          <div className="flex flex-wrap gap-2">
            {bank.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => placeItem(item.id)}
                className="px-3 py-2 rounded-lg border border-white/15 bg-white/[0.04] hover:border-amber-400/50 hover:bg-white/[0.08] text-sm font-medium text-white transition-colors"
              >
                {item.label}
              </button>
            ))}
            {bank.length === 0 && <span className="text-xs text-slate-600 italic">all pieces placed</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={check}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            <IconPlay className="w-4 h-4" /> Check Order
          </button>
          <button
            type="button"
            onClick={revealHint}
            disabled={hintsShown >= 3}
            className={`flex items-center gap-1.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-sm font-medium transition-colors ${hintPulse && hintsShown < 3 ? 'animate-pulse ring-2 ring-amber-400' : ''}`}
          >
            <IconHint className="w-4 h-4 text-amber-300" /> Hint ({hintsShown}/3)
          </button>
        </div>

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
            className={`rounded-lg px-3 py-2 text-sm font-medium ${feedback.ok ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}
          >
            {feedback.ok ? '✓ ' : '✗ '}{feedback.message}
            {feedback.ok && feedback.xp ? <span className="ml-2 text-amber-300">+{feedback.xp} XP</span> : null}
          </motion.div>
        )}
        {feedback?.ok && <NextChallengeButton challenge={challenge} />}
      </div>
    </motion.div>
  )
}
