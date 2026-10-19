import { useEffect, useRef } from 'react'
import { createGame } from '../game/config.js'
import { useGameStore } from '../store/gameStore.js'

export default function GameCanvas() {
  const containerRef = useRef(null)
  const gameRef = useRef(null)
  const zone = useGameStore((s) => s.zone)

  useEffect(() => {
    if (gameRef.current) gameRef.current.destroy(true)
    gameRef.current = createGame(containerRef.current, zone)
    if (import.meta.env.DEV) window.__phaserGame = gameRef.current
    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [zone])

  return (
    <div
      ref={containerRef}
      id="phaser-root"
      className="absolute inset-0 flex items-center justify-center"
    />
  )
}
