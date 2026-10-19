// Lightweight particle helpers shared by every zone — confetti bursts (chest
// solved / zone complete), footstep dust, and a handful of slow ambient
// drifters per zone (thematically tinted, not per-zone bespoke shapes).

function ensureTextures(scene) {
  if (scene.textures.exists('p-square')) return
  const g = scene.make.graphics({ x: 0, y: 0, add: false })
  g.fillStyle(0xffffff, 1)
  g.fillRect(0, 0, 6, 6)
  g.generateTexture('p-square', 6, 6)
  g.clear()
  g.fillStyle(0xffffff, 1)
  g.fillCircle(3, 3, 3)
  g.generateTexture('p-dot', 6, 6)
  g.destroy()
}

const CONFETTI_COLORS = [0xf59e0b, 0x22c55e, 0xec4899, 0x38bdf8, 0xa78bfa, 0xf472b6]

export function spawnConfetti(scene, x, y, count = 24) {
  ensureTextures(scene)
  const emitter = scene.add.particles(x, y, 'p-square', {
    speed: { min: 120, max: 320 },
    angle: { min: 240, max: 300 },
    gravityY: 420,
    lifespan: 900,
    scale: { start: 1, end: 0.6 },
    rotate: { start: 0, end: 360 },
    tint: CONFETTI_COLORS,
    quantity: count,
    emitting: false,
  }).setDepth(50)
  emitter.explode(count)
  scene.time.delayedCall(1000, () => emitter.destroy())
}

// Footsteps call this every ~200-300ms while the player is walking — far too
// often to spin up and tear down a whole particle emitter GameObject each
// time. Keep one reusable emitter per scene (per dust color) and just
// reposition + re-explode it.
function getDustEmitter(scene, color) {
  ensureTextures(scene)
  scene._dustEmitters = scene._dustEmitters ?? {}
  if (!scene._dustEmitters[color]) {
    scene._dustEmitters[color] = scene.add.particles(0, 0, 'p-dot', {
      speed: { min: 8, max: 28 },
      angle: { min: 0, max: 360 },
      lifespan: 300,
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: color,
      quantity: 3,
      emitting: false,
    }).setDepth(6)
  }
  return scene._dustEmitters[color]
}

export function spawnDust(scene, x, y, color = 0xd6d3d1) {
  const emitter = getDustEmitter(scene, color)
  emitter.setPosition(x, y)
  emitter.explode(3)
}

// One subtle ambient look per decor kind — a handful of fixed emitters
// scattered across the map, independent of decor item count so this stays
// cheap regardless of how busy a zone's decor loop is.
const AMBIENT = {
  torch: { texture: 'p-dot', color: 0xf59e0b, speedY: [-30, -60], alpha: 0.5, life: 1400 },
  jungle: { texture: 'p-dot', color: 0x86efac, speedY: [-10, -25], alpha: 0.4, life: 2200 },
  neon: { texture: 'p-square', color: 0xf472b6, speedY: [40, 80], alpha: 0.4, life: 1600, angle: 'down' },
  medical: { texture: 'p-dot', color: 0xf87171, speedY: [-8, -18], alpha: 0.3, life: 2600 },
  dock: { texture: 'p-dot', color: 0xd6d3d1, speedY: [-6, -14], alpha: 0.25, life: 2000 },
  server: { texture: 'p-dot', color: 0x22d3ee, speedY: [-14, -30], alpha: 0.4, life: 1800 },
  studio: { texture: 'p-dot', color: 0xfbbf24, speedY: [-10, -22], alpha: 0.4, life: 2000 },
  palm: { texture: 'p-dot', color: 0x38bdf8, speedY: [-8, -16], alpha: 0.3, life: 2400 },
  cloud: null, // clouds already drift via tweens in drawDecor
}

export function spawnAmbient(scene, kind, worldW, worldH) {
  const def = AMBIENT[kind]
  if (!def) return
  ensureTextures(scene)
  const spots = 6
  for (let i = 0; i < spots; i += 1) {
    const x = 150 + ((i * 397) % (worldW - 300))
    const y = 150 + ((i * 271) % (worldH - 300))
    scene.add.particles(x, y, def.texture, {
      speedY: { min: def.speedY[0], max: def.speedY[1] },
      speedX: { min: -6, max: 6 },
      lifespan: def.life,
      scale: { start: 0.9, end: 0.3 },
      alpha: { start: def.alpha, end: 0 },
      tint: def.color,
      frequency: 700 + (i % 4) * 150,
      quantity: 1,
    }).setDepth(2)
  }
}
