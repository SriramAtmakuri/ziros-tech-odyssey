import { useMemo } from 'react'
import { buildHumanoidGrid, archetypeForName } from '../../game/utils/spriteDefs.js'

const hex = (n) => `#${(n & 0xffffff).toString(16).padStart(6, '0')}`

// Renders the same procedural pixel-art grid used for in-world NPC sprites
// as a small SVG portrait, so the dialogue box shows the actual character
// instead of a generic colored circle with an initial.
export default function PixelPortrait({ name, color = 0x94a3b8, className = 'w-14 h-14' }) {
  const grid = useMemo(() => buildHumanoidGrid({
    skin: 0xf2c9a1,
    hair: 0x2f2519,
    outfit: color,
    accent: 0x000000 | (color ^ 0x333333),
    archetype: archetypeForName(name),
  }), [name, color])

  const rows = grid.length
  const cols = grid[0].length

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={`${className} rounded-full bg-slate-800 border border-white/10`}
      shapeRendering="crispEdges"
    >
      {grid.map((row, y) => row.map((color2, x) => (
        color2 === null || color2 === undefined ? null : (
          // eslint-disable-next-line react/no-array-index-key
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={hex(color2)} />
        )
      )))}
    </svg>
  )
}
