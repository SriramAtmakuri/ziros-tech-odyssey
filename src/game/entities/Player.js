import { rasterize } from '../utils/pixelSprite.js'
import { buildHumanoidGrid } from '../utils/spriteDefs.js'

export const WALK_SPEED = 170
export const RUN_SPEED = 300
const PIXEL = 4

// Ziro reskins by zone — same base body, different outfit color + a
// thematic archetype accessory, so the character reads differently per
// zone at a glance without needing bespoke art per zone.
const ZIRO_SKINS = {
  'sql-island': { outfit: 0x22c55e, accent: 0x166534, archetype: 'none' },
  'code-kingdom': { outfit: 0x94a3b8, accent: 0x475569, archetype: 'knight' },
  'python-jungle': { outfit: 0x84cc16, accent: 0x4d7c0f, archetype: 'hardhat' },
  'data-realm': { outfit: 0x38bdf8, accent: 0x0369a1, archetype: 'labcoat' },
  'cloud-citadel': { outfit: 0xe0f2fe, accent: 0x7dd3fc, archetype: 'wizard' },
  'algorithm-dungeon': { outfit: 0x8b5cf6, accent: 0x5b21b6, archetype: 'hood' },
  'ai-frontier': { outfit: 0xd946ef, accent: 0x86198f, archetype: 'wizard' },
  'healthcare-highlands': { outfit: 0xf8fafc, accent: 0xef4444, archetype: 'labcoat' },
  'supply-chain-docks': { outfit: 0xf97316, accent: 0x1e3a5f, archetype: 'captain' },
  'iot-outpost': { outfit: 0xeab308, accent: 0x57534e, archetype: 'hardhat' },
  'web-dev-workshop': { outfit: 0xf472b6, accent: 0x22d3ee, archetype: 'designer' },
  'security-stronghold': { outfit: 0x27272a, accent: 0xef4444, archetype: 'hood' },
  'collaboration-commons': { outfit: 0x2dd4bf, accent: 0x134e4a, archetype: 'none' },
}
const DEFAULT_SKIN = ZIRO_SKINS['sql-island']

export function ensurePlayerTextures(scene, zoneId) {
  const skin = ZIRO_SKINS[zoneId] ?? DEFAULT_SKIN
  const suffix = ZIRO_SKINS[zoneId] ? `-${zoneId}` : ''
  const key = (name) => `ziro-${name}${suffix}`
  if (scene.textures.exists(key('idle'))) return suffix
  const base = { skin: 0xf2c9a1, hair: 0x2f2519, outfit: skin.outfit, accent: skin.accent, archetype: skin.archetype }
  rasterize(scene, key('idle'), buildHumanoidGrid({ ...base, strideFrame: 0 }), PIXEL)
  rasterize(scene, key('walk-a'), buildHumanoidGrid({ ...base, strideFrame: 1 }), PIXEL)
  rasterize(scene, key('walk-b'), buildHumanoidGrid({ ...base, strideFrame: -1 }), PIXEL)
  rasterize(scene, key('celebrate'), buildHumanoidGrid({ ...base, strideFrame: 0, celebrate: true }), PIXEL)
  return suffix
}

export default class Player {
  constructor(scene, x, y, zoneId) {
    this.texSuffix = ensurePlayerTextures(scene, zoneId)
    this.scene = scene
    this.dir = { x: 0, y: 1 }
    this.celebrateUntil = 0

    this.shadow = scene.add.ellipse(x, y, 22, 9, 0x000000, 0.3).setDepth(9.5)

    this.sprite = scene.physics.add.sprite(x, y, `ziro-idle${this.texSuffix}`)
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDepth(10)
    const w = this.sprite.width
    const h = this.sprite.height
    this.sprite.body.setCircle(w * 0.32, w * 0.5 - w * 0.32, h - w * 0.64 - 2)
    this.shadow.setPosition(x, y + h * 0.42)

    this.nameLabel = scene.add.text(x, y - h * 0.5 - 14, 'Ziro', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#22d3ee',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(10,10,15,0.4)',
      padding: { x: 5, y: 1 },
    }).setOrigin(0.5).setDepth(11)
  }

  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  celebrate() {
    this.celebrateUntil = this.scene.time.now + 700
  }

  update(input) {
    const { left, right, up, down, running, frozen } = input
    const body = this.sprite.body

    if (frozen) {
      body.setVelocity(0, 0)
      this._syncDecor(false, running)
      return
    }

    let vx = 0
    let vy = 0
    if (left) vx -= 1
    if (right) vx += 1
    if (up) vy -= 1
    if (down) vy += 1

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy)
      this.dir = { x: vx / len, y: vy / len }
    }

    const speed = running ? RUN_SPEED : WALK_SPEED
    const len = Math.max(Math.hypot(vx, vy), 1)
    body.setVelocity(vx * speed / len, vy * speed / len)

    this._syncDecor(vx !== 0 || vy !== 0, running)
  }

  _syncDecor(moving, running) {
    if (this.dir.x < -0.1) this.sprite.setFlipX(true)
    else if (this.dir.x > 0.1) this.sprite.setFlipX(false)

    if (this.scene.time.now < this.celebrateUntil) {
      this.sprite.setTexture(`ziro-celebrate${this.texSuffix}`)
    } else if (!moving) {
      this.sprite.setTexture(`ziro-idle${this.texSuffix}`)
    } else {
      const period = running ? 140 : 220
      const frame = Math.floor(this.scene.time.now / period) % 2 === 0 ? 'walk-a' : 'walk-b'
      this.sprite.setTexture(`ziro-${frame}${this.texSuffix}`)
    }

    this.nameLabel.setPosition(this.x, this.y - this.sprite.height * 0.5 - 14)
    this.shadow.setPosition(this.x, this.y + this.sprite.height * 0.42)
  }

  destroy() {
    this.sprite.destroy()
    this.nameLabel.destroy()
    this.shadow.destroy()
  }
}
