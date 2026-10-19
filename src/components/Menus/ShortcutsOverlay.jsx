import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import { IconKeyboard, IconMouse, IconClose } from '../icons/Icons.jsx'

function Key({ children }) {
  return (
    <kbd className="inline-block min-w-[1.6rem] text-center bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-xs font-mono text-white">
      {children}
    </kbd>
  )
}

function Row({ keys, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg">
      <span className="text-slate-300 text-sm">{children}</span>
      <span className="flex items-center gap-1 flex-shrink-0">{keys}</span>
    </div>
  )
}

// A plain-language "press K to see this" cheat sheet — every control in the
// game in one place, worded simply so a first-time player can learn the
// whole control scheme just by reading this once.
export default function ShortcutsOverlay() {
  const show = useGameStore((s) => s.showShortcuts)
  const toggleShortcuts = useGameStore((s) => s.toggleShortcuts)

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={toggleShortcuts}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-950 border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <IconKeyboard className="w-5 h-5 text-amber-400" /> Controls
              </h2>
              <button type="button" onClick={toggleShortcuts} aria-label="Close" className="text-slate-400 hover:text-white"><IconClose className="w-5 h-5" /></button>
            </div>

            <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <IconKeyboard className="w-3.5 h-3.5" /> Keyboard
            </div>
            <div className="grid grid-cols-1 gap-1.5 mb-5">
              <Row keys={<><Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key></>}>Move around (arrow keys also work)</Row>
              <Row keys={<Key>Shift</Key>}>Hold this while moving to run</Row>
              <Row keys={<><Key>E</Key><Key>Space</Key></>}>Talk to someone, or open a chest</Row>
              <Row keys={<Key>I</Key>}>See the tools you've collected</Row>
              <Row keys={<Key>Tab</Key>}>See your stats (play time, XP, streak...)</Row>
              <Row keys={<Key>O</Key>}>See the map of Tech Planet</Row>
              <Row keys={<Key>G</Key>}>Open the Guide — plain-English word definitions</Row>
              <Row keys={<Key>Q</Key>}>Open Quests — side quests connecting multiple zones</Row>
              <Row keys={<Key>Esc</Key>}>Open settings, or close whatever's open</Row>
              <Row keys={<Key>M</Key>}>Mute or unmute sound</Row>
              <Row keys={<Key>K</Key>}>Show this list</Row>
            </div>

            <div className="mb-2 text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <IconMouse className="w-3.5 h-3.5" /> Mouse / Trackpad
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <Row keys={<span className="text-xs text-slate-400">Scroll or pinch</span>}>Zoom the camera in and out</Row>
              <Row keys={<span className="text-xs text-slate-400">Click ground</span>}>Walk to that spot</Row>
              <Row keys={<span className="text-xs text-slate-400">Click someone/a chest</span>}>Talk to them or open it (walks over first if you're far away)</Row>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">Press K or click outside to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
