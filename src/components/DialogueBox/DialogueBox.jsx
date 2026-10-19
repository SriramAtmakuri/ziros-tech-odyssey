import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore.js'
import PixelPortrait from './PixelPortrait.jsx'

const TYPE_SPEED_MS = 18

function luminanceOf(r, g, b) {
  const chan = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2]
}

function rgbToHsl(r, g, b) {
  const rn = r / 255; const gn = g / 255; const bn = b / 255
  const max = Math.max(rn, gn, bn); const min = Math.min(rn, gn, bn)
  let h = 0; let s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r, g, b] = [0, 0, 0]
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

// Per-NPC accent colors are picked per zone for visual variety, and some
// hues (deep violets, reds) fail WCAG contrast at their raw value against
// the dialogue box's near-black background. Lighten (preserving hue/
// saturation) only as much as needed to clear 4.5:1 — colors that already
// pass are returned untouched.
function legibleTextColor(n) {
  const r = (n >> 16) & 0xff; const g = (n >> 8) & 0xff; const b = n & 0xff
  const [h, s, initialL] = rgbToHsl(r, g, b)
  let [cr, cg, cb] = [r, g, b]
  let l = initialL
  let ratio = (luminanceOf(cr, cg, cb) + 0.05) / 0.05
  while (ratio < 4.5 && l < 0.95) {
    l += 0.02
    ;[cr, cg, cb] = hslToRgb(h, s, l)
    ratio = (luminanceOf(cr, cg, cb) + 0.05) / 0.05
  }
  return `rgb(${cr}, ${cg}, ${cb})`
}

export default function DialogueBox() {
  const dialogue = useGameStore((s) => s.dialogue)
  const closeDialogue = useGameStore((s) => s.closeDialogue)
  const [lineIndex, setLineIndex] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    setLineIndex(0)
    setRevealed(0)
  }, [dialogue])

  const line = dialogue?.lines?.[lineIndex] ?? ''

  useEffect(() => {
    if (!dialogue) return undefined
    clearInterval(intervalRef.current)
    setRevealed(0)
    intervalRef.current = setInterval(() => {
      setRevealed((r) => {
        if (r >= line.length) {
          clearInterval(intervalRef.current)
          return r
        }
        return r + 1
      })
    }, TYPE_SPEED_MS)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue, lineIndex])

  const advance = () => {
    if (!dialogue) return
    if (revealed < line.length) {
      clearInterval(intervalRef.current)
      setRevealed(line.length)
      return
    }
    if (lineIndex < dialogue.lines.length - 1) {
      setLineIndex((i) => i + 1)
    } else {
      closeDialogue()
    }
  }

  // Keep a ref to the latest advance() so the window listener below can stay
  // attached for the whole conversation instead of re-subscribing on every
  // typing tick (revealed changes every ~18ms while a line types out).
  const advanceRef = useRef(advance)
  advanceRef.current = advance

  useEffect(() => {
    if (!dialogue) return undefined
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advanceRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogue])

  return (
    <AnimatePresence>
      {dialogue && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="absolute bottom-6 left-6 right-6 z-30 flex justify-center pointer-events-none"
        >
          <div
            className="pointer-events-auto w-full max-w-3xl rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur px-5 py-4 flex gap-4"
            onClick={advance}
          >
            <PixelPortrait
              name={dialogue.npcName ?? ''}
              color={dialogue.npcColor ?? 0x94a3b8}
              className="w-14 h-14 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-semibold mb-1 tracking-wide"
                style={{ color: legibleTextColor(dialogue.npcColor ?? 0x94a3b8) }}
              >
                {dialogue.npcName}
              </div>
              <p className="text-slate-100 text-[15px] leading-snug min-h-[3rem]">
                {line.slice(0, revealed)}
                {revealed < line.length && <span className="animate-pulse">▊</span>}
              </p>
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {revealed < line.length ? 'click / space to skip' : (lineIndex < (dialogue.lines.length - 1) ? 'space to continue' : 'space to close')}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
