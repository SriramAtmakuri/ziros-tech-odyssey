import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'

export default function MainMenu({ onNewGame, onContinue }) {
  const hasSave = useGameStore((s) => s.hasSave)
  const loadGame = useGameStore((s) => s.loadGame)
  const clearSave = useGameStore((s) => s.clearSave)
  const [saveExists] = useState(() => hasSave())

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 text-center px-6">
      <div className="mb-10">
        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow">
          Ziro&apos;s Tech <span className="text-amber-400">Odyssey</span>
        </h1>
        <p className="text-slate-400 mt-3 text-sm">A portal dropped you on Tech Planet. Everything is broken. Learn the tools, fix the world.</p>
      </div>

      <div className="flex flex-col gap-3 w-64">
        <button
          type="button"
          onClick={() => { clearSave(); onNewGame() }}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg py-3 transition-colors"
        >
          New Game
        </button>
        <button
          type="button"
          disabled={!saveExists}
          onClick={() => { loadGame(); onContinue() }}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors"
        >
          Continue
        </button>
      </div>

      <div className="mt-12 text-xs text-slate-600 space-y-1">
        <p>WASD / Arrow keys / click ground — move · Shift — run</p>
        <p>E / Space / click — talk or open · I — inventory · Tab — stats · O — map</p>
        <p>Scroll or pinch — zoom · Press K anytime for the full controls list</p>
      </div>
    </div>
  )
}
