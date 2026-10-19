import { useEffect, useRef, useState } from 'react'

const IDLE_MS = 30000

// Starts a gentle pulse on the Hint button after a player has sat on a
// challenge for 30s without running anything — first-time players often
// don't notice the hint button is there at all. Resets whenever `resetKey`
// changes (e.g. a new challenge opens), and clears as soon as the caller
// invokes the returned `clearPulse` (on run/check or on revealing a hint).
export default function useHintPulse(resetKey) {
  const [pulse, setPulse] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setPulse(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setPulse(true), IDLE_MS)
    return () => clearTimeout(timerRef.current)
  }, [resetKey])

  const clearPulse = () => {
    clearTimeout(timerRef.current)
    setPulse(false)
  }

  return [pulse, clearPulse]
}
