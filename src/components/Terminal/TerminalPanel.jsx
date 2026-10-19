import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { sfx } from '../../utils/audioEngine.js'
import { flash } from '../../utils/screenFlash.js'
import { IconHint } from '../icons/Icons.jsx'
import useHintPulse from '../../hooks/useHintPulse.js'
import NextChallengeButton from '../CodeEditor/NextChallengeButton.jsx'

// A challenge made of real CLI commands (git, docker, kubectl...) typed into
// a simulated terminal. Each step in challenge.steps is { match, output },
// where `match` is a RegExp (or string, compared loosely) tested against the
// player's trimmed input. Steps must be cleared in order.
export default function TerminalPanel({ challenge }) {
  const closeChallenge = useGameStore((s) => s.closeChallenge)
  const awardXp = useGameStore((s) => s.awardXp)
  const completeChallenge = useGameStore((s) => s.completeChallenge)
  const breakStreak = useGameStore((s) => s.breakStreak)
  const isChallengeComplete = useGameStore((s) => s.isChallengeComplete)
  const recordAttempt = useGameStore((s) => s.recordAttempt)

  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [hintsShown, setHintsShown] = useState(0)
  const [done, setDone] = useState(false)
  const [shake, setShake] = useState(false)
  const startTimeRef = useRef(Date.now())
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const [hintPulse, clearHintPulse] = useHintPulse(challenge.id)

  const alreadyDone = isChallengeComplete(challenge.id)

  useEffect(() => {
    setHistory([{ type: 'system', text: `${challenge.npc} is watching over your shoulder.` }])
    setStepIndex(0)
    setHintsShown(0)
    setDone(false)
    startTimeRef.current = Date.now()
    inputRef.current?.focus()
  }, [challenge])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeChallenge() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeChallenge])

  const matches = (step, text) => {
    if (step.match instanceof RegExp) return step.match.test(text)
    return text.toLowerCase() === String(step.match).toLowerCase()
  }

  const submit = (e) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd || done) return
    clearHintPulse()
    setInput('')
    const step = challenge.steps[stepIndex]
    const entry = [{ type: 'input', text: cmd }]
    const matched = matches(step, cmd)
    recordAttempt(matched)

    if (matched) {
      sfx.codeRun()
      entry.push({ type: 'output', text: step.output })
      const nextIndex = stepIndex + 1
      setHistory((h) => [...h, ...entry])
      setStepIndex(nextIndex)

      if (nextIndex >= challenge.steps.length) {
        setDone(true)
        sfx.codeSuccess(); flash('#22c55e')
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
        setHistory((h) => [...h, {
          type: 'success',
          text: `${challenge.successMessage ?? 'Sequence complete.'}${xpInfo ? ` +${xpInfo.amount} XP` : ''}`,
        }])
      }
    } else {
      entry.push({ type: 'error', text: `command not recognized for this step: ${cmd}` })
      setHistory((h) => [...h, ...entry])
      breakStreak()
      sfx.codeError(); flash('#ef4444')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  const revealHint = () => { clearHintPulse(); sfx.hintUsed(); setHintsShown((h) => Math.min(h + 1, 3)) }

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
        {alreadyDone && <div className="mt-1 text-emerald-400 text-xs font-semibold">✓ Already solved — feel free to retype it.</div>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-5 py-3 gap-3">
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-[13px] leading-relaxed"
        >
          {history.map((line, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i} className={
              line.type === 'input' ? 'text-emerald-300'
                : line.type === 'error' ? 'text-red-400'
                  : line.type === 'success' ? 'text-amber-300 font-semibold mt-1'
                    : 'text-slate-400'
            }
            >
              {line.type === 'input' ? '$ ' : ''}{line.text}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <span className="text-emerald-400 font-mono self-center">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={done}
            autoFocus
            spellCheck={false}
            className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-400/50 disabled:opacity-50"
            placeholder={done ? 'sequence complete' : 'type a command…'}
          />
          <button
            type="button"
            onClick={revealHint}
            disabled={hintsShown >= 3}
            className={`flex items-center gap-1.5 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-sm font-medium transition-colors ${hintPulse && hintsShown < 3 ? 'animate-pulse ring-2 ring-amber-400' : ''}`}
          >
            <IconHint className="w-4 h-4 text-amber-300" /> {hintsShown}/3
          </button>
        </form>

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

        <div className="text-[11px] text-slate-500">step {Math.min(stepIndex + 1, challenge.steps.length)} / {challenge.steps.length}</div>
        {done && <NextChallengeButton challenge={challenge} />}
      </div>
    </motion.div>
  )
}
