import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { QUESTS } from '../../data/quests.js'
import { sfx } from '../../utils/audioEngine.js'
import {
  IconInventory, IconStats, IconSave, IconSettings, IconCheck, IconFlame, IconMap, IconKeyboard, IconGuide, IconQuest,
} from '../icons/Icons.jsx'

export default function HUD() {
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const zone = useGameStore((s) => s.zone)
  const streak = useGameStore((s) => s.streak)
  const lastXpGain = useGameStore((s) => s.lastXpGain)
  const completedChallenges = useGameStore((s) => s.completedChallenges)
  const toggleInventory = useGameStore((s) => s.toggleInventory)
  const toggleSettings = useGameStore((s) => s.toggleSettings)
  const toggleStats = useGameStore((s) => s.toggleStats)
  const toggleOverworld = useGameStore((s) => s.toggleOverworld)
  const toggleShortcuts = useGameStore((s) => s.toggleShortcuts)
  const toggleGlossary = useGameStore((s) => s.toggleGlossary)
  const toggleQuests = useGameStore((s) => s.toggleQuests)
  const claimedQuestCount = useGameStore((s) => s.claimedQuests.length)
  const flushSave = useGameStore((s) => s.flushSave)
  const xpForLevel = useGameStore((s) => s.xpForLevel)
  const clearXpGain = useGameStore((s) => s.clearXpGain)

  const [savedFlash, setSavedFlash] = useState(false)
  const [levelUp, setLevelUp] = useState(false)
  const prevLevel = useRef(level)

  useEffect(() => {
    if (level > prevLevel.current) {
      setLevelUp(true)
      sfx.levelUp()
      const t = setTimeout(() => setLevelUp(false), 1800)
      prevLevel.current = level
      return () => clearTimeout(t)
    }
    prevLevel.current = level
    return undefined
  }, [level])

  useEffect(() => {
    if (!lastXpGain) return undefined
    sfx.xpGain()
    const t = setTimeout(() => clearXpGain(lastXpGain.id), 1300)
    return () => clearTimeout(t)
  }, [lastXpGain, clearXpGain])

  const need = xpForLevel(level)
  const pct = Math.min(100, Math.round((xp / need) * 100))

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* top-left: level + xp bar */}
      <div className="absolute top-4 left-4 pointer-events-auto bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-sm text-white font-semibold">
          <span className="text-amber-400">Lv.{level}</span>
          <span className="text-slate-400 text-xs">Ziro</span>
          {streak >= 3 && (
            <span className="flex items-center gap-1 text-orange-400 text-xs">
              <IconFlame className="w-3.5 h-3.5" /> {streak} streak
            </span>
          )}
        </div>
        <div className="w-40 h-2 bg-white/10 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-amber-400" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">{xp} / {need} XP</div>
      </div>

      {/* top-right: zone + progress */}
      <div className="absolute top-4 right-4 pointer-events-auto bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 backdrop-blur text-right">
        <div className="text-sm font-bold text-white">{ZONES[zone]?.name ?? zone}</div>
        <div className="text-[10px] text-slate-500">
          {(() => {
            const required = ZONES[zone]?.challenges.filter((c) => !c.bonus) ?? []
            const done = required.filter((c) => completedChallenges.includes(c.id)).length
            return `${done} / ${required.length} challenges solved`
          })()}
        </div>
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-2">
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleOverworld() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconMap className="w-4 h-4 text-emerald-400" /> Map <span className="text-slate-500">[O]</span>
        </button>
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleInventory() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconInventory className="w-4 h-4 text-amber-400" /> Inventory <span className="text-slate-500">[I]</span>
        </button>
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleStats() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconStats className="w-4 h-4 text-sky-400" /> Stats <span className="text-slate-500">[Tab]</span>
        </button>
        <button
          type="button"
          onClick={() => { sfx.itemPickup(); flushSave(); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200) }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          {savedFlash ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <IconSave className="w-4 h-4 text-emerald-400" />}
          {savedFlash ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleSettings() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconSettings className="w-4 h-4 text-slate-300" /> Settings <span className="text-slate-500">[Esc]</span>
        </button>
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleShortcuts() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconKeyboard className="w-4 h-4 text-violet-400" /> Help <span className="text-slate-500">[K]</span>
        </button>
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleGlossary() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconGuide className="w-4 h-4 text-amber-300" /> Guide <span className="text-slate-500">[G]</span>
        </button>
        <button
          type="button"
          onClick={() => { sfx.menuOpen(); toggleQuests() }}
          className="flex items-center gap-2 bg-slate-950/80 border border-white/10 hover:border-white/30 text-white text-sm rounded-lg px-4 py-2 backdrop-blur transition-colors"
        >
          <IconQuest className="w-4 h-4 text-emerald-400" /> Quests <span className="text-slate-500">{claimedQuestCount}/{QUESTS.length} [Q]</span>
        </button>
      </div>

      <AnimatePresence>
        {lastXpGain && (
          <motion.div
            key={lastXpGain.id}
            initial={{ opacity: 0, y: 0, scale: 0.4 }}
            animate={{ opacity: 1, y: -60, scale: [0.4, 1.35, 1] }}
            exit={{ opacity: 0, y: -95, scale: 1.1 }}
            transition={{ duration: 1.1, scale: { duration: 0.5, ease: 'easeOut' } }}
            className="absolute top-20 left-1/2 -translate-x-1/2 text-amber-300 font-black text-4xl tracking-wide"
            style={{ textShadow: '0 0 18px rgba(251,191,36,0.9), 0 2px 4px rgba(0,0,0,0.8)' }}
          >
            +{lastXpGain.amount} XP
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-4xl font-black text-amber-400 drop-shadow-lg tracking-wide">
              ⭐ LEVEL UP — Lv.{level} ⭐
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
