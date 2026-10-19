import { lazy, Suspense } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore.js'

// Challenge panels are lazy-loaded: they pull in the heavy editors/engines
// (Monaco, sql.js, Pyodide) that a player only needs once they actually open
// a chest — keeping all of it out of the initial bundle so the menu and
// overworld load fast. The chunk fetches on first open, then stays cached.
const CodeChallengePanel = lazy(() => import('./CodeEditor/CodeChallengePanel.jsx'))
const TextChallengePanel = lazy(() => import('./CodeEditor/TextChallengePanel.jsx'))
const PythonChallengePanel = lazy(() => import('./CodeEditor/PythonChallengePanel.jsx'))
const TerminalPanel = lazy(() => import('./Terminal/TerminalPanel.jsx'))
const SequencePanel = lazy(() => import('./PipelineBuilder/SequencePanel.jsx'))
const McqPanel = lazy(() => import('./Quiz/McqPanel.jsx'))
const MatchingPanel = lazy(() => import('./Quiz/MatchingPanel.jsx'))

function PanelLoading() {
  return (
    <div className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[560px] bg-slate-950/98 border-l border-white/10 flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Loading challenge…</div>
    </div>
  )
}

// Routes the active challenge to the right panel by `kind`. SQL Island's
// challenges predate the `kind` field, so missing kind defaults to 'sql'.
export default function ChallengePanelRouter() {
  const challenge = useGameStore((s) => s.activeChallenge)

  return (
    <AnimatePresence>
      {challenge && (
        <Suspense fallback={<PanelLoading />}>
          {(() => {
            switch (challenge.kind) {
              case 'terminal': return <TerminalPanel key={challenge.id} challenge={challenge} />
              case 'sequence': return <SequencePanel key={challenge.id} challenge={challenge} />
              case 'code': return <TextChallengePanel key={challenge.id} challenge={challenge} />
              case 'python': return <PythonChallengePanel key={challenge.id} challenge={challenge} />
              case 'mcq': return <McqPanel key={challenge.id} challenge={challenge} />
              case 'matching': return <MatchingPanel key={challenge.id} challenge={challenge} />
              case 'sql':
              default: return <CodeChallengePanel key={challenge.id} />
            }
          })()}
        </Suspense>
      )}
    </AnimatePresence>
  )
}
