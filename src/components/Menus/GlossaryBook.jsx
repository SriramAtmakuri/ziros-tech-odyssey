import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { GLOSSARY } from '../../data/glossary.js'
import { IconGuide, IconSearch, IconClose } from '../icons/Icons.jsx'

// A short, plain-English "what does that mean?" reference you can flip open
// anytime — deliberately NOT a full manual. One line per term. If an entry
// needs more than a sentence or two, it doesn't belong here.
export default function GlossaryBook() {
  const show = useGameStore((s) => s.showGlossary)
  const toggleGlossary = useGameStore((s) => s.toggleGlossary)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const groups = GLOSSARY
    .map((group) => ({
      ...group,
      terms: q
        ? group.terms.filter((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
        : group.terms,
    }))
    .filter((group) => group.terms.length > 0)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={toggleGlossary}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <IconGuide className="w-5 h-5 text-amber-400" /> Guide
              </h2>
              <button type="button" onClick={toggleGlossary} aria-label="Close" className="text-slate-400 hover:text-white"><IconClose className="w-5 h-5" /></button>
            </div>

            <label className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 flex-shrink-0">
              <IconSearch className="w-4 h-4 text-slate-500" />
              <input
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a word, like &quot;loop&quot; or &quot;commit&quot;…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 outline-none"
              />
            </label>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5">
              {groups.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No matches — try a different word.</p>
              )}
              {groups.map((group) => (
                <div key={group.zoneId}>
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">{group.zoneName}</div>
                  <div className="space-y-1.5">
                    {group.terms.map((t) => (
                      <div key={t.term} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10">
                        <div className="text-amber-300 text-sm font-semibold">{t.term}</div>
                        <div className="text-slate-300 text-[13px] leading-snug mt-0.5">{t.def}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-slate-500 flex-shrink-0">Press G or click outside to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
