import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { IconInventory, IconClose } from '../icons/Icons.jsx'

export default function Inventory() {
  const show = useGameStore((s) => s.showInventory)
  const toggleInventory = useGameStore((s) => s.toggleInventory)
  const inventory = useGameStore((s) => s.inventory)
  const [filterZone, setFilterZone] = useState('all')

  const zones = ['all', ...new Set(inventory.map((t) => t.zone))]
  const visible = filterZone === 'all' ? inventory : inventory.filter((t) => t.zone === filterZone)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -520, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -520, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 250 }}
          className="absolute top-0 left-0 bottom-0 z-40 w-full sm:w-[480px] bg-slate-950/98 border-r border-white/10 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <IconInventory className="w-5 h-5 text-amber-400" /> Tools &amp; Skills Learned
            </h2>
            <button type="button" onClick={toggleInventory} aria-label="Close" className="text-slate-400 hover:text-white leading-none"><IconClose className="w-5 h-5" /></button>
          </div>

          <div className="px-5 py-3 flex gap-2 flex-wrap border-b border-white/10">
            {zones.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setFilterZone(z)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${filterZone === z ? 'bg-amber-400 text-slate-950 border-amber-400 font-semibold' : 'border-white/15 text-slate-300 hover:border-white/40'}`}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {visible.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Nothing here yet — go solve some challenges out on the island.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visible.map((tool) => (
                  <div key={tool.id} className="group relative bg-white/[0.03] border border-white/10 hover:border-amber-400/50 rounded-xl p-3 transition-colors">
                    <div className="text-2xl">{tool.icon}</div>
                    <div className="text-sm font-semibold text-white mt-1">{tool.name}</div>
                    <div className="text-[11px] text-slate-500">{tool.zone}</div>
                    <div className="hidden group-hover:block absolute z-10 left-0 right-0 top-full mt-1 bg-slate-900 border border-white/10 rounded-lg p-2 text-[11px] text-slate-300 shadow-xl">
                      {tool.description}
                      <div className="mt-1 text-amber-400">{'★'.repeat(tool.fun ?? 3)}{'☆'.repeat(5 - (tool.fun ?? 3))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
