// Procedural pixel-art character generator — builds a 12x16 pixel grid for
// a humanoid (Ziro or an NPC) from a small set of parameters, instead of
// needing external sprite sheets. See pixelSprite.js for the rasterizer.

const T = null // transparent
const EYE = 0x1f2937

function blank() {
  return Array.from({ length: 16 }, () => Array.from({ length: 12 }, () => T))
}

function rect(grid, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (grid[y] && x >= 0 && x < grid[y].length) grid[y][x] = color
    }
  }
}

// archetype(grid, {hair, outfit, accent}) mutates the head/torso region to
// give a distinct silhouette. Applied after the base humanoid is drawn.
const ARCHETYPES = {
  none(grid, c) {
    rect(grid, 3, 0, 8, 1, c.hair)
  },
  knight(grid, c) {
    rect(grid, 2, 0, 9, 2, 0x9ca3af)
    rect(grid, 2, 2, 9, 2, 0x6b7280)
    rect(grid, 5, 0, 6, 1, c.accent)
  },
  wizard(grid, c) {
    rect(grid, 4, -2, 7, 0, c.hair)
    rect(grid, 2, 0, 9, 1, c.hair)
    rect(grid, 5, -3, 6, -2, c.accent)
  },
  labcoat(grid, c) {
    rect(grid, 3, 0, 8, 1, c.hair)
    rect(grid, 2, 5, 9, 14, 0xf8fafc)
    rect(grid, 5, 6, 6, 13, c.accent)
  },
  hood(grid, c) {
    rect(grid, 2, -1, 9, 3, c.outfit)
    rect(grid, 4, 2, 7, 3, 0x0a0a0a)
  },
  captain(grid, c) {
    rect(grid, 2, 0, 9, 1, 0x1e3a5f)
    rect(grid, 4, -1, 7, 0, 0xfbbf24)
    rect(grid, 2, 1, 3, 1, c.accent)
    rect(grid, 8, 1, 9, 1, c.accent)
  },
  hardhat(grid, c) {
    rect(grid, 2, -1, 9, 1, c.accent)
    rect(grid, 1, 1, 10, 1, c.accent)
  },
  guard(grid, c) {
    rect(grid, 2, 0, 9, 2, 0x3f3f46)
    rect(grid, 5, 0, 6, 1, c.accent)
  },
  robe(grid, c) {
    rect(grid, 3, 0, 8, 1, c.hair)
    rect(grid, 1, 5, 10, 15, c.outfit)
    rect(grid, 4, 7, 7, 13, c.accent)
  },
  designer(grid, c) {
    rect(grid, 3, 0, 8, 1, c.hair)
    rect(grid, 2, 5, 3, 6, 0xf97316)
    rect(grid, 8, 5, 9, 6, 0x22c55e)
  },
}

export function buildHumanoidGrid({
  skin = 0xf2c9a1, hair = 0x4b3621, outfit = 0x4ade80, accent = 0x166534,
  archetype = 'none', strideFrame = 0, celebrate = false,
}) {
  const grid = blank()

  // head
  rect(grid, 3, 2, 8, 4, skin)
  rect(grid, 4, 3, 5, 3, EYE)
  rect(grid, 6, 3, 7, 3, EYE)

  // torso + arms
  const armY0 = celebrate ? 4 : 6
  const armY1 = celebrate ? 6 : 9
  rect(grid, 2, 6, 9, 9, outfit)
  rect(grid, celebrate ? 0 : 1, armY0, celebrate ? 1 : 2, armY1, skin)
  rect(grid, celebrate ? 10 : 9, armY0, celebrate ? 11 : 10, armY1, skin)
  rect(grid, 4, 9, 7, 9, accent)

  // legs — stride alternates which leg is "forward" (drawn one row shorter)
  const leftShort = strideFrame === 1
  const rightShort = strideFrame === -1
  rect(grid, 3, 10, 5, leftShort ? 13 : 15, 0x374151)
  rect(grid, 6, 10, 8, rightShort ? 13 : 15, 0x1f2937)

  ARCHETYPES[archetype]?.(grid, { hair, outfit, accent })

  return grid
}

// Heuristic archetype inference from an NPC's name/role, so zone data files
// never need to specify sprite details — a name like "Dr. Mara" or
// "Sir Commit" is enough to pick a fitting silhouette.
export function archetypeForName(name) {
  const n = name.toLowerCase()
  if (/^dr\.|neural|priestess|clinical/.test(n)) return 'labcoat'
  if (/sir |lord |commit/.test(n)) return 'knight'
  if (/mage|wizard|arch mage|terraform|dynamic dex|priestess/.test(n)) return 'wizard'
  if (/zero-day|hacker|hood/.test(n)) return 'hood'
  if (/captain|port director|rex|fisherman|koa/.test(n)) return 'captain'
  if (/engineer|vega|eddie|sally|deva|edge|pipeline|pete|iam iris|serverless|network nora|warehouse|slack stan|transformer|retriever/.test(n)) return 'hardhat'
  if (/chief|officer|guard|vera|norm|privacy patricia|procurement|risk rita|team lead|maya/.test(n)) return 'guard'
  if (/elder|oracle|sage|boa|mana|hina|councillor|floe/.test(n)) return 'robe'
  if (/pixel|cassandra|jack|andy|creative|merchant|lani/.test(n)) return 'designer'
  if (/nimbus|recursive rita/.test(n)) return 'wizard'
  if (/dungeon master|algo|ghost of big o|debug monkey|anaconda|cryptographer/.test(n)) return 'hood'
  if (/transform tara|integration irene|wiki wren/.test(n)) return 'labcoat'
  if (/agile coach/.test(n)) return 'guard'
  return 'none'
}
