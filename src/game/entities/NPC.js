import { rasterize } from '../utils/pixelSprite.js'
import { buildHumanoidGrid, archetypeForName } from '../utils/spriteDefs.js'

// A pixel-art NPC — silhouette/hat inferred from the NPC's name (see
// archetypeForName), colored by the `color` the zone data already provides.
// Idle bobbing animation, a name label, and a floating "Press E" prompt
// that appears when Ziro is close enough to talk.
const INTERACT_RADIUS = 90

function ensureNpcTexture(scene, key, color, name) {
  if (scene.textures.exists(key)) return
  const archetype = archetypeForName(name)
  const grid = buildHumanoidGrid({
    skin: 0xf2c9a1, hair: 0x2f2519, outfit: color, accent: 0x000000 | (color ^ 0x333333), archetype,
  })
  rasterize(scene, key, grid, 3)
}

export default class NPC {
  constructor(scene, { x, y, name, color = 0xf59e0b, onInteract }) {
    this.scene = scene
    this.name = name
    this.onInteract = onInteract
    const key = `npc-${archetypeForName(name)}-${color.toString(16)}`
    ensureNpcTexture(scene, key, color, name)

    this.sprite = scene.add.image(x, y, key).setDepth(9)
    this.label = scene.add.text(x, y - this.sprite.height - 8, name, {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(10,10,15,0.4)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(9)

    this.prompt = scene.add.text(x, y - this.sprite.height - 28, '[E] Talk', {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(10,10,15,0.4)',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(12).setVisible(false)

    scene.tweens.add({
      targets: this.sprite, y: y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })
  }

  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  updateProximity(px, py) {
    const near = Math.hypot(px - this.x, py - this.y) <= INTERACT_RADIUS
    this.prompt.setVisible(near)
    return near
  }

  interact() {
    if (this.onInteract) this.onInteract()
  }
}

export { INTERACT_RADIUS }
