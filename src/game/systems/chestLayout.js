// Deterministic snake-path layout so any zone's challenge chests spread out
// across the map without overlapping, regardless of how many there are.
export function chestLayout(challenges, opts = {}) {
  const {
    cols = 7, spacingX = 300, spacingY = 300, startX = 260, startY = 260,
  } = opts
  return challenges.map((challenge, i) => {
    const row = Math.floor(i / cols)
    const colIndex = i % cols
    const col = row % 2 === 0 ? colIndex : cols - 1 - colIndex // snake path
    const jitterX = ((i * 37) % 40) - 20
    const jitterY = ((i * 53) % 40) - 20
    return {
      challenge,
      x: startX + col * spacingX + jitterX,
      y: startY + row * spacingY + jitterY,
    }
  })
}
