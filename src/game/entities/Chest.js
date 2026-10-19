// A challenge marker on the map. Closed + glowing while unsolved, open once
// its challenge has been completed. Each zone gets its own icon treatment
// (scroll, rune tablet, medical folder, shipping crate, ...) so nodes don't
// all read as the same brown box across very different-themed zones.
const INTERACT_RADIUS = 85

const DEFAULT_SKIN = { closed: 0x92400e, closedLid: 0xb45309, open: 0x166534, openLid: 0x16a34a, icon: 'chest' }

const CHEST_SKINS = {
  'sql-island': DEFAULT_SKIN,
  'code-kingdom': {
    closed: 0xe7d9b8, closedLid: 0xd8c193, open: 0xbbf7d0, openLid: 0x86efac, icon: 'scroll',
  },
  'python-jungle': {
    closed: 0x5b3a1e, closedLid: 0x78502b, open: 0x365314, openLid: 0x4d7c0f, icon: 'chest',
  },
  'data-realm': {
    closed: 0x1e293b, closedLid: 0x334155, open: 0x14532d, openLid: 0x166534, icon: 'server',
  },
  'cloud-citadel': {
    closed: 0xe2e8f0, closedLid: 0xf8fafc, open: 0xbbf7d0, openLid: 0xdcfce7, icon: 'trim',
  },
  'algorithm-dungeon': {
    closed: 0x44403c, closedLid: 0x57534e, open: 0x365314, openLid: 0x4d7c0f, icon: 'rune',
  },
  'ai-frontier': {
    closed: 0x2e1065, closedLid: 0x4c1d95, open: 0x14532d, openLid: 0x166534, icon: 'chip',
  },
  'healthcare-highlands': {
    closed: 0xf8fafc, closedLid: 0xe2e8f0, open: 0xbbf7d0, openLid: 0xdcfce7, icon: 'cross',
  },
  'supply-chain-docks': {
    closed: 0xea580c, closedLid: 0xc2410c, open: 0x166534, openLid: 0x15803d, icon: 'container',
  },
  'iot-outpost': {
    closed: 0x374151, closedLid: 0x4b5563, open: 0x14532d, openLid: 0x166534, icon: 'antenna',
  },
  'web-dev-workshop': {
    closed: 0xfaf3e8, closedLid: 0xf5e6d3, open: 0xd9f7e6, openLid: 0xbaf3d3, icon: 'palette',
  },
  'security-stronghold': {
    closed: 0x18181b, closedLid: 0x27272a, open: 0x14532d, openLid: 0x166534, icon: 'lock',
  },
  'collaboration-commons': {
    closed: 0xe0f2f1, closedLid: 0xccfbf1, open: 0xbbf7d0, openLid: 0xa7f3d0, icon: 'chat',
  },
}

function drawIcon(g, icon, baseColor) {
  switch (icon) {
    case 'scroll':
      g.lineStyle(1.5, 0x78502b, 0.8)
      g.lineBetween(5, 4, 23, 4)
      g.lineBetween(5, 7, 23, 7)
      g.fillStyle(0xb91c1c, 0.9)
      g.fillCircle(14, 4, 2.5)
      break
    case 'server':
      for (let i = 0; i < 3; i += 1) {
        g.fillStyle(0x22d3ee, 0.9)
        g.fillCircle(9 + i * 5, 4, 1.6)
      }
      break
    case 'trim':
      g.fillStyle(0xfacc15, 1)
      g.fillRect(0, 0, 28, 3)
      break
    case 'rune':
      g.lineStyle(2, 0xa78bfa, 0.9)
      g.beginPath()
      g.moveTo(14, 1)
      g.lineTo(19, 6)
      g.lineTo(14, 11)
      g.lineTo(9, 6)
      g.closePath()
      g.strokePath()
      break
    case 'chip':
      g.lineStyle(1.5, 0xf472b6, 0.9)
      g.lineBetween(7, 3, 21, 3)
      g.lineBetween(14, 0, 14, 8)
      break
    case 'cross':
      g.fillStyle(0xef4444, 1)
      g.fillRect(11, 0, 6, 12)
      g.fillRect(5, 3, 18, 6)
      break
    case 'container':
      g.lineStyle(1.2, 0x000000, 0.25)
      for (let rx = 4; rx <= 24; rx += 5) g.lineBetween(rx, 0, rx, 10)
      break
    case 'antenna':
      g.lineStyle(2, 0x9ca3af, 0.9)
      g.lineBetween(14, -4, 14, 3)
      g.fillStyle(0xef4444, 0.9)
      g.fillCircle(14, -4, 2)
      break
    case 'palette':
      g.fillStyle(0xf97316, 0.9); g.fillCircle(8, 4, 2.2)
      g.fillStyle(0x22c55e, 0.9); g.fillCircle(14, 2, 2.2)
      g.fillStyle(0x3b82f6, 0.9); g.fillCircle(20, 4, 2.2)
      break
    case 'lock':
      g.lineStyle(2, 0xfacc15, 0.9)
      g.strokeCircle(14, 2, 4)
      g.fillStyle(0xfacc15, 0.9)
      g.fillRect(11, 4, 6, 6)
      break
    case 'chat':
      g.fillStyle(0x14b8a6, 0.9)
      g.fillRoundedRect(8, 0, 12, 8, 2)
      g.fillTriangle(12, 8, 16, 8, 12, 12)
      break
    case 'chest':
    default:
      g.fillStyle(baseColor, 1)
      break
  }
}

function ensureChestTextures(scene, zoneId) {
  const suffix = `-${zoneId}`
  if (scene.textures.exists(`chest-closed${suffix}`)) return suffix
  const skin = CHEST_SKINS[zoneId] ?? DEFAULT_SKIN
  const g = scene.make.graphics({ x: 0, y: 0, add: false })

  g.fillStyle(skin.closed, 1)
  g.fillRoundedRect(0, 6, 28, 18, 4)
  g.fillStyle(skin.closedLid, 1)
  g.fillRoundedRect(0, 0, 28, 10, 4)
  g.lineStyle(2, 0x000000, 0.35)
  g.strokeRoundedRect(0, 0, 28, 24, 4)
  drawIcon(g, skin.icon, skin.closedLid)
  g.generateTexture(`chest-closed${suffix}`, 28, 24)
  g.clear()

  g.fillStyle(skin.open, 1)
  g.fillRoundedRect(0, 6, 28, 18, 4)
  g.fillStyle(skin.openLid, 1)
  g.fillRoundedRect(0, 0, 28, 10, 4)
  g.lineStyle(2, 0x000000, 0.35)
  g.strokeRoundedRect(0, 0, 28, 24, 4)
  drawIcon(g, skin.icon, skin.openLid)
  g.generateTexture(`chest-open${suffix}`, 28, 24)
  g.clear()

  if (!scene.textures.exists('chest-check')) {
    g.fillStyle(0x22c55e, 1)
    g.fillCircle(9, 9, 9)
    g.lineStyle(2, 0xf0fdf4, 1)
    g.beginPath()
    g.moveTo(4.5, 9)
    g.lineTo(7.5, 12.5)
    g.lineTo(13.5, 5)
    g.strokePath()
    g.generateTexture('chest-check', 18, 18)
  }
  g.destroy()
  return suffix
}

export default class Chest {
  constructor(scene, {
    x, y, challenge, completed, onInteract, zoneId,
  }) {
    const suffix = ensureChestTextures(scene, zoneId)
    this.scene = scene
    this.challenge = challenge
    this.completed = completed
    this.onInteract = onInteract

    this.sprite = scene.add.image(x, y, completed ? `chest-open${suffix}` : `chest-closed${suffix}`).setDepth(5)
    this.closedKey = `chest-closed${suffix}`
    this.openKey = `chest-open${suffix}`
    this.sprite.setAlpha(completed ? 0.7 : 1)
    this.glow = scene.add.circle(x, y + 8, 15, 0xfacc15, completed ? 0 : 0.14).setDepth(4)
    this.glowTween = null
    if (!completed) {
      this.glowTween = scene.tweens.add({
        targets: this.glow, alpha: 0.24, duration: 900, yoyo: true, repeat: -1,
      })
    }

    this.checkBadge = scene.add.image(x + 14, y - 12, 'chest-check').setDepth(10).setScale(0.75)
    this.checkBadge.setVisible(completed)

    this.label = scene.add.text(x, y - 16, challenge.title, {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: completed ? '#9ca3af' : '#facc15',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(10,10,15,0.4)',
      padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(9)

    this.prompt = scene.add.text(x, y - 34, completed ? '[E] Review' : '[E] Open', {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(10,10,15,0.4)',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(12).setVisible(false)
  }

  get x() { return this.sprite.x }
  get y() { return this.sprite.y }

  setCompleted() {
    this.completed = true
    this.sprite.setTexture(this.openKey)
    this.sprite.setAlpha(0.7)
    if (this.glowTween) {
      this.glowTween.stop()
      this.glowTween = null
    }
    this.glow.setAlpha(0)
    this.checkBadge.setVisible(true)
    this.label.setColor('#9ca3af')
    this.prompt.setText('[E] Review')
  }

  // Swaps in a new challenge — used by the chest-swap/rotation pilot
  // feature (SQL Island) when a position's occupant changes mid-session.
  // `completed` reflects whether the INCOMING challenge has itself already
  // been solved before: false for a bonus challenge seen for the first
  // time, but true when rotating back around to something (including the
  // original) the player already finished on an earlier lap.
  setChallenge(newChallenge, completed = false) {
    this.challenge = newChallenge
    this.completed = completed
    this.label.setText(newChallenge.title)
    if (completed) {
      this.sprite.setTexture(this.openKey)
      this.sprite.setAlpha(0.7)
      if (this.glowTween) {
        this.glowTween.stop()
        this.glowTween = null
      }
      this.glow.setAlpha(0)
      this.checkBadge.setVisible(true)
      this.label.setColor('#9ca3af')
      this.prompt.setText('[E] Review')
    } else {
      this.sprite.setTexture(this.closedKey)
      this.sprite.setAlpha(1)
      this.glow.setAlpha(0.14)
      if (!this.glowTween) {
        this.glowTween = this.scene.tweens.add({
          targets: this.glow, alpha: 0.24, duration: 900, yoyo: true, repeat: -1,
        })
      }
      this.checkBadge.setVisible(false)
      this.label.setColor('#facc15')
      this.prompt.setText('[E] Open')
    }
  }

  updateProximity(px, py) {
    const near = Math.hypot(px - this.x, py - this.y) <= INTERACT_RADIUS
    this.prompt.setVisible(near)
    return near
  }

  interact() {
    if (this.onInteract) this.onInteract(this.challenge)
  }
}

export { INTERACT_RADIUS }
