// A tiny procedural pixel-art rasterizer. A "grid" is an array of rows,
// each row an array of colors (hex number) or null for transparent. This
// lets every character be defined as data (see spriteDefs.js) instead of
// needing external art files — each pixel drawn as a small filled square.
export function rasterize(scene, key, grid, pixelSize = 3) {
  if (scene.textures.exists(key)) return key
  const h = grid.length
  const w = grid[0].length
  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const color = grid[y][x]
      if (color === null || color === undefined) continue
      g.fillStyle(color, 1)
      g.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }
  g.generateTexture(key, w * pixelSize, h * pixelSize)
  g.destroy()
  return key
}

// Mirrors a grid horizontally (for left/right facing variants).
export function mirrorGrid(grid) {
  return grid.map((row) => [...row].reverse())
}
