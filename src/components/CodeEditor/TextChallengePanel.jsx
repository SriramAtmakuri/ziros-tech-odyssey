import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import '../../utils/monacoSetup.js'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { sfx } from '../../utils/audioEngine.js'
import { flash } from '../../utils/screenFlash.js'
import { IconPlay, IconHint } from '../icons/Icons.jsx'
import useHintPulse from '../../hooks/useHintPulse.js'
import NextChallengeButton from './NextChallengeButton.jsx'

// A code-writing challenge with no in-browser interpreter behind it
// (Dockerfile, Terraform/HCL, YAML...). challenge.check({code}) validates
// the text with patterns/structure; challenge.simulate(code), if present,
// returns a string of "simulated" build/plan output for the Output panel.
export default function TextChallengePanel({ challenge }) {
  const closeChallenge = useGameStore((s) => s.closeChallenge)
  const awardXp = useGameStore((s) => s.awardXp)
  const completeChallenge = useGameStore((s) => s.completeChallenge)
  const breakStreak = useGameStore((s) => s.breakStreak)
  const isChallengeComplete = useGameStore((s) => s.isChallengeComplete)
  const recordAttempt = useGameStore((s) => s.recordAttempt)

  const [code, setCode] = useState('')
  const [output, setOutput] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [hintsShown, setHintsShown] = useState(0)
  const [shake, setShake] = useState(false)
  const startTimeRef = useRef(Date.now())
  const [hintPulse, clearHintPulse] = useHintPulse(challenge.id)

  const alreadyDone = isChallengeComplete(challenge.id)

  useEffect(() => {
    setCode(challenge.starter ?? '')
    setOutput(null)
    setFeedback(null)
    setHintsShown(0)
    startTimeRef.current = Date.now()
  }, [challenge])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeChallenge() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeChallenge])

  const run = () => {
    clearHintPulse()
    sfx.codeRun()
    const outcome = challenge.check({ code })
    setOutput(challenge.simulate ? challenge.simulate(code) : null)
    recordAttempt(outcome.success)

    if (outcome.success) {
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
      setFeedback({ ok: true, message: outcome.message, xp: xpInfo?.amount })
      sfx.codeSuccess(); flash('#22c55e')
    } else {
      setFeedback({ ok: false, message: outcome.message })
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
        {alreadyDone && <div className="mt-1 text-emerald-400 text-xs font-semibold">✓ Already solved — feel free to experiment.</div>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-5 py-3 gap-3 overflow-y-auto">
        <div className="rounded-lg overflow-hidden border border-white/10">
          <Editor
            height="260px"
            language={challenge.language ?? 'shell'}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            onMount={(editor) => {
              if (import.meta.env.DEV) {
                editor.__challengeId = challenge.id
                window.__monacoEditor = editor
              }
            }}
            options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  editContext: false,
                }}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={run}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            <IconPlay className="w-4 h-4" /> {challenge.runLabel ?? 'Validate'}
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

        {output && (
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Simulated output</div>
            <pre className="bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap">{output}</pre>
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
