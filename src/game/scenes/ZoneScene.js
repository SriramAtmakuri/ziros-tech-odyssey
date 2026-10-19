import Phaser from 'phaser'
import Player from '../entities/Player.js'
import NPC from '../entities/NPC.js'
import Chest from '../entities/Chest.js'
import { chestLayout } from '../systems/chestLayout.js'
import { useGameStore } from '../../store/gameStore.js'
import { ZONES } from '../../data/zones/index.js'
import { playZoneMusic, sfx } from '../../utils/audioEngine.js'
import { spawnConfetti, spawnDust, spawnAmbient } from '../systems/particles.js'
import { getKeybinds, onKeybindsChange } from '../../utils/keybinds.js'

const WORLD_W = 2400
const WORLD_H = 1700

const FOOTSTEP_SURFACE = {
  palm: 'sand', torch: 'stone', jungle: 'grass', server: 'metal',
  cloud: 'sand', neon: 'metal', medical: 'stone', dock: 'metal', studio: 'grass',
}

// One generic scene class reused for every zone — all zone-specific content
// (challenges, NPC roster, palette, decoration style) comes from the zone's
// data file (src/data/zones/*.js), never hardcoded here.
export default class ZoneScene extends Phaser.Scene {
  constructor(zoneId) {
    super(zoneId)
    this.zoneId = zoneId
  }

  create() {
    const zone = ZONES[this.zoneId]
    const palette = zone.palette ?? { bg: '#1b6fa8', ground: 0xe8d59a, groundAccent: 0xdcc27e }

    // Explicit liveness flag for the async buildChests() deferral below —
    // `this.add` being non-null isn't a reliable enough check for the narrow
    // window where a scene is mid-teardown (e.g. React StrictMode's dev-only
    // double-mount, or a real rapid zone change): Phaser's GameObjectCreator
    // can still throw internally (reading a null `.sys`) even when `this.add`
    // itself is still truthy at the moment of the check, if teardown started
    // between the check and the object actually being constructed.
    this.destroyed = false
    this.events.once('shutdown', () => { this.destroyed = true })
    this.events.once('destroy', () => { this.destroyed = true })

    this.cameras.main.setBackgroundColor(palette.bg)

    const g = this.add.graphics()
    g.fillStyle(palette.ground, 1)
    g.fillRoundedRect(0, 0, WORLD_W, WORLD_H, 120)
    g.setDepth(0)

    this.drawDecor(zone.decor?.kind ?? 'palm')
    spawnAmbient(this, zone.decor?.kind ?? 'palm', WORLD_W, WORLD_H)

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)

    const store = useGameStore.getState()
    const startPos = store.playerPos && store.playerPos.x ? store.playerPos : { x: 400, y: 300 }
    this.player = new Player(this, startPos.x, startPos.y, this.zoneId)
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12)

    const mainNpcData = zone.npcs.find((n) => n.role === 'main')
    this.mainNpcColor = mainNpcData.color
    this.mainNpc = new NPC(this, {
      x: mainNpcData.x,
      y: mainNpcData.y,
      name: mainNpcData.name,
      color: mainNpcData.color,
      onInteract: () => this.talkToMain(),
    })

    this.helperNpcs = zone.npcs
      .filter((n) => n.role !== 'main')
      .map((n) => new NPC(this, {
        x: n.x,
        y: n.y,
        name: n.name,
        color: n.color,
        onInteract: () => this.flavor(n.name, n.flavor, n.color),
      }))

    // Chest content depends on the zone's bonus pool (for challengeSwaps
    // substitutions via getLiveChallenges), which is now lazily fetched —
    // see gameStore.js's BONUS_POOL_LOADERS. Deferred until it resolves so a
    // returning player's existing swaps render correctly from the very first
    // frame instead of one frame late; this.chests is undefined until then,
    // so update() and the walk-request/swap subscriptions below all guard
    // for that. `if (!this.add) return` covers the scene having already been
    // torn down before this promise resolved (e.g. a fast zone change).
    useGameStore.getState().ensureBonusPoolLoaded(this.zoneId).then(() => {
      if (this.destroyed || !this.add) return
      this.buildChests(zone)
    })

    // enableCapture=false (2nd arg) — the default (true) calls preventDefault()
    // on these keys globally, including while typing into a Monaco editor or
    // terminal input over top of the game, silently eating letters a/d/e/s/w
    // and spaces from whatever's actually focused. Movement/interact logic
    // already ignores these while isFrozen(), so browser-default suppression
    // isn't needed — the game area doesn't scroll either way.
    const { KeyCodes } = Phaser.Input.Keyboard
    this.cursors = this.input.keyboard.addKeys({
      up: KeyCodes.UP, down: KeyCodes.DOWN, left: KeyCodes.LEFT, right: KeyCodes.RIGHT, space: KeyCodes.SPACE, shift: KeyCodes.SHIFT,
    }, false)
    // Remappable action keys (Settings > Controls) — this.keybinds tracks
    // which physical key currently means what; this.keys holds the actual
    // Phaser Key objects, rebuilt whenever the mapping changes so a rebind
    // takes effect immediately without needing a scene restart.
    this.keybinds = getKeybinds()
    this.rebuildActionKeys()
    this.unsubKeybinds = onKeybindsChange((kb) => { this.keybinds = kb; this.rebuildActionKeys() })
    this.events.once('shutdown', () => this.unsubKeybinds?.())
    this.events.once('destroy', () => this.unsubKeybinds?.())

    // revisiting an already-completed zone (via the Overworld map) shouldn't
    // re-fire its completion celebration
    this.zoneCompleteTriggered = store.completedZones.includes(this.zoneId)
    this.lastFootstep = 0
    this.moveTarget = null
    this.moveTargetObj = null
    this.moveMarker = null

    // "Next Challenge" button in a solved panel sets this in the store;
    // walk the player there and open it on arrival, same as clicking a
    // distant chest. The store is a module-level singleton that outlives any
    // one scene, so this MUST be unsubscribed on teardown or a destroyed
    // scene's stale callback keeps firing against systems that no longer
    // exist (this.add etc turn null) — GameCanvas destroys/recreates the
    // whole Phaser game on every zone change (and React StrictMode does an
    // extra mount/unmount pass in dev), and that whole-game teardown path
    // emits Phaser's 'destroy' scene event, not 'shutdown', so both are
    // listened for here.
    this.unsubWalkRequest = useGameStore.subscribe((state, prevState) => {
      const challengeId = state.nextChallengeRequest
      if (!challengeId || challengeId === prevState.nextChallengeRequest) return
      if (this.destroyed || !this.add) return // this scene instance has already been torn down
      if (!this.chests) return // chests haven't finished building yet (bonus-pool fetch still pending)
      const chest = this.chests.find((c) => c.challenge.id === challengeId)
      if (chest) this.setMoveTarget(chest.x, chest.y, chest)
      useGameStore.getState().clearWalkRequest()
    })
    this.events.once('shutdown', () => this.unsubWalkRequest?.())
    this.events.once('destroy', () => this.unsubWalkRequest?.())

    // Chest-swap/rotation feature (only active for zones with a bonus pool
    // registered — a zone with none just never has any entries land in
    // challengeSwaps for its own ids, so this is a no-op there): the chest
    // position a player just solved-and-Next'd through advances one step
    // around a 3-step cycle — original → bonus draw 1 → bonus draw 2 →
    // original → ... forever (see gameStore.swapChallenge). Invisible on the
    // forward path since Next only ever routes to still-unsolved original
    // positions — but if the player backtracks to this exact chest within
    // the same live scene, it needs to already show whatever currently
    // occupies it rather than the stale one baked in at create(). Same
    // destroy-safety concern as the walk-request subscription above. Note:
    // `state`/`prevState` share the same bound action functions (zustand
    // doesn't snapshot those), so "what it used to show" has to be
    // recomputed from prevState's raw data here rather than calling e.g.
    // prevState.currentOccupantId(...), which would just read the CURRENT
    // state again. getBonusPool() is looked up FRESH on every fired event
    // (not captured once here) since the pool is now lazily fetched — it
    // may still be null the instant this subscription is first registered.
    this.unsubSwap = useGameStore.subscribe((state, prevState) => {
      const bonusPool = useGameStore.getState().getBonusPool(this.zoneId)
      if (!bonusPool) return // this zone's pool isn't loaded (or doesn't exist) — nothing to react to
      if (state.challengeSwaps === prevState.challengeSwaps) return
      if (this.destroyed || !this.add) return
      if (!this.chests) return // chests haven't finished building yet (bonus-pool fetch still pending)
      Object.entries(state.challengeSwaps).forEach(([originalId, entry]) => {
        if (!zone.challenges.some((c) => c.id === originalId)) return // a different zone's position
        const prevEntry = prevState.challengeSwaps[originalId] ?? { drawn: [], cursor: 0 }
        if (entry.cursor === prevEntry.cursor) return // no change for this position
        const prevOccupantId = prevEntry.cursor === 0 ? originalId : prevEntry.drawn[prevEntry.cursor - 1]
        const nextOccupantId = entry.cursor === 0 ? originalId : entry.drawn[entry.cursor - 1]
        const chest = this.chests.find((c) => c.challenge.id === prevOccupantId)
        const nextChallenge = nextOccupantId === originalId
          ? zone.challenges.find((c) => c.id === originalId)
          : bonusPool.find((c) => c.id === nextOccupantId)
        if (chest && nextChallenge) {
          chest.setChallenge(nextChallenge, useGameStore.getState().isChallengeComplete(nextOccupantId))
        }
      })
    })
    this.events.once('shutdown', () => this.unsubSwap?.())
    this.events.once('destroy', () => this.unsubSwap?.())

    // mouse wheel or trackpad scroll/pinch zooms the camera in/out. Trackpads
    // fire many small, rapid wheel events (vs. a mouse's few big ticks), so
    // each event's contribution is capped — keeps zoom smooth on both.
    this.input.on('wheel', (pointer, over, dx, dy) => {
      const cam = this.cameras.main
      const step = Phaser.Math.Clamp(dy * 0.0012, -0.05, 0.05)
      cam.zoom = Phaser.Math.Clamp(cam.zoom - step, 0.55, 1.8)
    })

    // mouse: click empty ground to walk there. This generic listener fires
    // for every click, including ones that land on a chest/NPC — skip it
    // when the click hit an interactive object, or it clobbers the more
    // specific click-to-interact handler below (which fires first but gets
    // overwritten if this one always runs unconditionally after).
    this.input.on('pointerdown', (pointer) => {
      if (this.isFrozen()) return
      if (this.input.hitTestPointer(pointer).length > 0) return
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      this.setMoveTarget(world.x, world.y)
    })

    // mouse: click a character or chest to talk/open it (walks over first if out of range)
    // (chests are wired up the same way inside buildChests(), once they exist)
    this.clickable = (obj) => obj.sprite.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleEntityClick(obj))
    this.clickable(this.mainNpc)
    this.helperNpcs.forEach(this.clickable)

    playZoneMusic(this.zoneId)
    this.talkToMain()
  }

  isFrozen() {
    const store = useGameStore.getState()
    return !!store.dialogue || !!store.activeChallenge || store.showInventory
      || store.showSettings || store.showStats || store.showOverworld || store.showShortcuts
      || !!store.zoneJustCompleted
  }

  setMoveTarget(x, y, targetObj = null) {
    this.moveTarget = { x, y }
    this.moveTargetObj = targetObj
    if (this.moveMarker) this.moveMarker.destroy()
    this.moveMarker = this.add.circle(x, y, 10, 0xfacc15, 0.5).setDepth(3)
    this.tweens.add({
      targets: this.moveMarker, scale: 0, alpha: 0, duration: 500,
      onComplete: () => { this.moveMarker?.destroy(); this.moveMarker = null },
    })
  }

  handleEntityClick(obj) {
    if (this.isFrozen()) return
    if (obj.updateProximity(this.player.x, this.player.y)) obj.interact()
    else this.setMoveTarget(obj.x, obj.y, obj)
  }

  drawDecor(kind) {
    if (kind === 'torch') {
      for (let i = 0; i < 22; i += 1) {
        const x = 80 + ((i * 271) % (WORLD_W - 160))
        const y = 60 + ((i * 419) % (WORLD_H - 120))
        this.add.rectangle(x, y, 6, 28, 0x44403c).setOrigin(0.5, 1).setDepth(1)
        const flame = this.add.circle(x, y - 30, 8, 0xf59e0b, 0.9).setDepth(1)
        this.tweens.add({
          targets: flame, scale: 1.25, alpha: 0.7, duration: 350 + (i % 5) * 40, yoyo: true, repeat: -1,
        })
      }
      return
    }
    if (kind === 'dock') {
      for (let i = 0; i < 20; i += 1) {
        const x = 80 + ((i * 271) % (WORLD_W - 160))
        const y = 60 + ((i * 419) % (WORLD_H - 140))
        const color = [0xea580c, 0x0891b2, 0xca8a04][i % 3]
        // shipping container: corrugated body, door outline, stacked one on top of another
        for (let stack = 0; stack < 2; stack += 1) {
          const cy = y - stack * 30
          this.add.rectangle(x, cy, 44, 26, color).setOrigin(0.5, 1).setStrokeStyle(2, 0x1c1917).setDepth(1)
          for (let rib = -18; rib <= 18; rib += 6) {
            this.add.rectangle(x + rib, cy - 1, 1.5, 24, 0x000000, 0.18).setOrigin(0.5, 1).setDepth(1.1)
          }
          this.add.rectangle(x + 16, cy - 2, 8, 20, 0x1c1917, 0.35).setOrigin(0.5, 1).setDepth(1.2)
        }
      }
      return
    }
    if (kind === 'neon') {
      for (let i = 0; i < 18; i += 1) {
        const x = 80 + ((i * 271) % (WORLD_W - 160))
        const y = 60 + ((i * 419) % (WORLD_H - 120))
        const color = [0xf472b6, 0x22d3ee, 0xa78bfa][i % 3]
        const bar = this.add.rectangle(x, y, 5, 46, color, 0.85).setOrigin(0.5, 1).setDepth(1)
        this.tweens.add({
          targets: bar, alpha: 0.35, duration: 500 + (i % 6) * 130, yoyo: true, repeat: -1,
        })
      }
      return
    }
    if (kind === 'medical') {
      for (let i = 0; i < 16; i += 1) {
        const x = 80 + ((i * 271) % (WORLD_W - 160))
        const y = 60 + ((i * 419) % (WORLD_H - 120))
        // a clean white medical cross badge — rounded card + a bold red plus, not just a tiny accent
        this.add.circle(x, y - 18, 20, 0x000000, 0.1).setDepth(0.9)
        this.add.circle(x, y - 18, 19, 0xffffff, 0.95).setStrokeStyle(2, 0xcbd5e1).setDepth(1)
        this.add.rectangle(x, y - 18, 20, 7, 0xef4444).setOrigin(0.5, 0.5).setDepth(2)
        this.add.rectangle(x, y - 18, 7, 20, 0xef4444).setOrigin(0.5, 0.5).setDepth(2)
      }
      return
    }
    if (kind === 'studio') {
      const dabColors = [0xf97316, 0xec4899, 0x22c55e, 0x3b82f6, 0xeab308]
      for (let i = 0; i < 14; i += 1) {
        const x = 80 + ((i * 271) % (WORLD_W - 160))
        const y = 60 + ((i * 419) % (WORLD_H - 120))
        // a painter's palette: tan oval base + a thumb-hole + small paint dabs around the rim
        this.add.ellipse(x, y, 46, 30, 0x000000, 0.08).setDepth(0.9)
        this.add.ellipse(x, y, 44, 28, 0xd6a679, 0.95).setStrokeStyle(2, 0x92603a).setDepth(1)
        this.add.ellipse(x + 10, y + 2, 9, 7, 0xfaf3e8, 1).setDepth(1.1)
        for (let d = 0; d < 4; d += 1) {
          const ang = (d / 4) * Math.PI * 1.3 - 0.65
          const dx = Math.cos(ang) * 15
          const dy = Math.sin(ang) * 9
          this.add.circle(x + dx, y + dy, 3.2, dabColors[(i + d) % dabColors.length]).setDepth(1.2)
        }
      }
      return
    }
    if (kind === 'jungle') {
      for (let i = 0; i < 30; i += 1) {
        const x = 60 + ((i * 271) % (WORLD_W - 120))
        const y = 50 + ((i * 419) % (WORLD_H - 100))
        this.add.rectangle(x, y, 8, 34, 0x2f2115).setOrigin(0.5, 1).setDepth(1)
        this.add.circle(x, y - 36, 22, 0x14532d, 0.95).setDepth(1)
        this.add.circle(x - 10, y - 24, 3, 0x166534, 0.8).setDepth(1) // hanging vine tip
      }
      for (let i = 0; i < 16; i += 1) {
        const x = 40 + ((i * 613) % (WORLD_W - 80))
        const y = 40 + ((i * 337) % (WORLD_H - 80))
        const firefly = this.add.circle(x, y, 2.5, 0xfde047, 0.9).setDepth(3)
        this.tweens.add({
          targets: firefly, alpha: 0.1, duration: 700 + (i % 7) * 120, yoyo: true, repeat: -1,
        })
      }
      return
    }
    if (kind === 'server') {
      for (let i = 0; i < 20; i += 1) {
        const x = 80 + ((i * 271) % (WORLD_W - 160))
        const y = 60 + ((i * 419) % (WORLD_H - 140))
        this.add.rectangle(x, y, 34, 60, 0x111827).setOrigin(0.5, 1).setDepth(1)
        this.add.rectangle(x, y, 34, 60, 0x1e293b, 0.4).setOrigin(0.5, 1).setStrokeStyle(1, 0x334155).setDepth(1)
        for (let led = 0; led < 3; led += 1) {
          const ledDot = this.add.circle(x - 10 + led * 10, y - 50 + led * 4, 2, 0x22d3ee, 0.9).setDepth(2)
          this.tweens.add({
            targets: ledDot, alpha: 0.15, duration: 500 + ((i + led) % 5) * 150, yoyo: true, repeat: -1,
          })
        }
      }
      return
    }
    if (kind === 'cloud') {
      // give the near-white "cloud platform" ground a real sky identity —
      // broad soft blue washes so it doesn't read as unfinished/blank white
      for (let i = 0; i < 8; i += 1) {
        const x = 150 + ((i * 613) % (WORLD_W - 300))
        const y = 150 + ((i * 887) % (WORLD_H - 300))
        this.add.ellipse(x, y, 420, 260, 0x7dd3fc, 0.12).setDepth(0.15)
      }
      for (let i = 0; i < 18; i += 1) {
        const x = 80 + ((i * 331) % (WORLD_W - 160))
        const y = 60 + ((i * 271) % (WORLD_H - 120))
        const puff = this.add.container(x, y).setDepth(1)
        puff.add(this.add.circle(0, 0, 24, 0xffffff, 0.95))
        puff.add(this.add.circle(20, 4, 18, 0xffffff, 0.95))
        puff.add(this.add.circle(-20, 4, 18, 0xffffff, 0.95))
        puff.add(this.add.circle(0, 9, 21, 0xffffff, 0.95))
        this.tweens.add({
          targets: puff, x: x + 30, duration: 8000 + (i % 5) * 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        })
      }
      // small floating castle-turret accents with gold trim
      for (let i = 0; i < 10; i += 1) {
        const x = 200 + ((i * 449) % (WORLD_W - 400))
        const y = 200 + ((i * 727) % (WORLD_H - 400))
        this.add.rectangle(x, y, 26, 34, 0xe2e8f0).setOrigin(0.5, 1).setStrokeStyle(2, 0xcbd5e1).setDepth(1)
        this.add.rectangle(x, y - 34, 30, 6, 0xfacc15).setOrigin(0.5, 1).setDepth(1.1)
        this.add.triangle(x, y - 40, -15, 6, 15, 6, 0, -10, 0x94a3b8).setDepth(1.1)
      }
      return
    }
    // default: sandy island — water border, beach gradient, clustered palms
    const water = this.add.graphics().setDepth(0.2)
    const BORDER = 90
    water.fillStyle(0x2563eb, 0.55)
    water.fillRect(0, 0, WORLD_W, BORDER)
    water.fillRect(0, WORLD_H - BORDER, WORLD_W, BORDER)
    water.fillRect(0, 0, BORDER, WORLD_H)
    water.fillRect(WORLD_W - BORDER, 0, BORDER, WORLD_H)
    for (let i = 0; i < 40; i += 1) {
      const alongTop = i < 20
      const t = (i % 20) / 19
      const wx = alongTop ? t * WORLD_W : (i % 2 === 0 ? BORDER * 0.4 : WORLD_W - BORDER * 0.4)
      const wy = alongTop ? (i % 2 === 0 ? BORDER * 0.4 : BORDER * 0.7) : t * WORLD_H
      const wave = this.add.circle(wx, wy, 5, 0xbfdbfe, 0.5).setDepth(0.3)
      this.tweens.add({
        targets: wave, alpha: 0.1, scale: 1.8, duration: 1400 + (i % 5) * 220, yoyo: true, repeat: -1, delay: (i % 7) * 200,
      })
    }
    const beach = this.add.graphics().setDepth(0.25)
    beach.fillStyle(0xf3e2b3, 0.55)
    const BEACH = 46
    beach.fillRect(BORDER, BORDER, WORLD_W - BORDER * 2, BEACH)
    beach.fillRect(BORDER, WORLD_H - BORDER - BEACH, WORLD_W - BORDER * 2, BEACH)
    beach.fillRect(BORDER, BORDER, BEACH, WORLD_H - BORDER * 2)
    beach.fillRect(WORLD_W - BORDER - BEACH, BORDER, BEACH, WORLD_H - BORDER * 2)

    const sun = this.add.circle(WORLD_W - 220, 180, 46, 0xfef08a, 0.9).setDepth(0.4)
    this.add.circle(WORLD_W - 220, 180, 60, 0xfef08a, 0.25).setDepth(0.35)
    this.tweens.add({ targets: sun, alpha: 0.7, duration: 2200, yoyo: true, repeat: -1 })

    for (let i = 0; i < 4; i += 1) {
      const cy = 300 + i * 380
      const shadow = this.add.ellipse(-200, cy, 150, 60, 0x0f172a, 0.05).setDepth(0.28)
      this.tweens.add({
        targets: shadow, x: WORLD_W + 200, duration: 26000 + i * 4000, repeat: -1, delay: i * 3000,
      })
    }

    const CLUSTERS = 7
    let seed = 0
    for (let c = 0; c < CLUSTERS; c += 1) {
      seed += 1
      const cx = 220 + ((c * 613) % (WORLD_W - 440))
      const cy = 220 + ((c * 887) % (WORLD_H - 440))
      const treesInCluster = 3 + (c % 3)
      for (let t = 0; t < treesInCluster; t += 1) {
        seed += 1
        const x = cx + (((seed * 137) % 160) - 80)
        const y = cy + (((seed * 211) % 120) - 60)
        this.add.ellipse(x, y + 4, 26, 10, 0x000000, 0.12).setDepth(0.9)
        this.add.rectangle(x, y, 6, 26, 0x78350f).setOrigin(0.5, 1).setDepth(1)
        this.add.circle(x, y - 26, 16, 0x15803d, 0.9).setDepth(1)
      }
    }
  }

  // Builds the actual chest GameObjects once the zone's bonus pool has
  // resolved (see the ensureBonusPoolLoaded().then() call in create()) —
  // getLiveChallenges() needs real pool data to correctly substitute any
  // already-rotated positions for a returning player.
  buildChests(zone) {
    const store = useGameStore.getState()
    const liveChallenges = store.getLiveChallenges(this.zoneId)
    this.chests = chestLayout(liveChallenges).map(({ challenge, x, y }) => new Chest(this, {
      x,
      y,
      challenge,
      zoneId: this.zoneId,
      completed: store.isChallengeComplete(challenge.id),
      onInteract: (ch) => { sfx.doorOpen(); useGameStore.getState().openChallenge(ch) },
    }))
    if ((zone.decor?.kind ?? 'palm') === 'palm') this.drawPath(this.chests)
    this.chests.forEach(this.clickable)
  }

  drawPath(chests) {
    if (chests.length < 2) return
    const g = this.add.graphics().setDepth(0.5)
    g.lineStyle(16, 0xead9a3, 0.7)
    g.beginPath()
    g.moveTo(chests[0].x, chests[0].y)
    for (let i = 1; i < chests.length; i += 1) g.lineTo(chests[i].x, chests[i].y)
    g.strokePath()
  }

  // Builds the actual Phaser Key objects for whatever the current keybinds
  // are. Re-run on every rebind (not just once in create()) so a player who
  // changes a key mid-session sees it take effect on their very next
  // keypress, with no scene reload needed.
  rebuildActionKeys() {
    const kb = this.keybinds
    const names = [...new Set([kb.up, kb.down, kb.left, kb.right, kb.run, kb.interact, 'SPACE'])]
    this.keys = this.input.keyboard.addKeys(names.join(','), false)
  }

  talkToMain() {
    sfx.talk()
    const store = useGameStore.getState()
    const zone = ZONES[this.zoneId]
    const required = zone.challenges.filter((c) => !c.bonus)
    const total = required.length
    const done = required.filter((c) => store.isChallengeComplete(c.id)).length
    const mainName = zone.npcIntro.name
    if (done === 0) {
      const onComplete = (this.zoneId === 'sql-island' && !store.hasOnboarded)
        ? () => this.showOnboarding()
        : undefined
      store.openDialogue({
        npcName: mainName, npcColor: this.mainNpcColor, lines: zone.npcIntro.lines, onComplete,
      })
    } else if (done >= total) {
      store.openDialogue({
        npcName: mainName,
        npcColor: this.mainNpcColor,
        lines: [`You did it, Ziro. Every challenge in ${zone.name} is solved.`, 'This place will remember you for it.'],
      })
    } else {
      store.openDialogue({
        npcName: mainName,
        npcColor: this.mainNpcColor,
        lines: [`${done} of ${total} challenges solved. Keep opening the glowing chests around here.`],
      })
    }
  }

  showOnboarding() {
    useGameStore.getState().openDialogue({
      npcName: 'Readme',
      npcColor: 0x94a3b8,
      lines: [
        "Hi, I'm Readme — a little robot who explains things so the humans don't have to write a manual.",
        'Move with WASD or the arrow keys. Hold Shift to run.',
        "See a glowing chest or a character with a name above their head? Walk up close and press E (or Space) to interact.",
        "Chests hold real challenges — SQL queries, Python code, terminal commands. Solve one and you'll earn XP and a tool card.",
        "Stuck? Every challenge has 3 hints. The first two nudge you — the third one is usually a full working solution, no shame in using it.",
        'Press I anytime to see the tools you\'ve collected, Tab to see your stats, and Esc for settings.',
        "That's everything. Go open your first chest — I'll be quiet now.",
      ],
      onComplete: () => useGameStore.getState().completeOnboarding(),
    })
  }

  flavor(npcName, line, color) {
    sfx.talk()
    useGameStore.getState().openDialogue({ npcName, npcColor: color, lines: [line] })
  }

  update() {
    const store = useGameStore.getState()
    const zone = ZONES[this.zoneId]
    const frozen = this.isFrozen()

    const kb = this.keybinds
    const keyLeft = this.cursors.left.isDown || this.keys[kb.left].isDown
    const keyRight = this.cursors.right.isDown || this.keys[kb.right].isDown
    const keyUp = this.cursors.up.isDown || this.keys[kb.up].isDown
    const keyDown = this.cursors.down.isDown || this.keys[kb.down].isDown
    const keyboardMoving = !frozen && (keyLeft || keyRight || keyUp || keyDown)

    let left = keyLeft
    let right = keyRight
    let up = keyUp
    let down = keyDown

    if (keyboardMoving) {
      // keyboard always wins — pressing any movement key cancels a pending click-to-move
      this.moveTarget = null
      this.moveTargetObj = null
    } else if (this.moveTarget && !frozen) {
      const dx = this.moveTarget.x - this.player.x
      const dy = this.moveTarget.y - this.player.y
      if (Math.hypot(dx, dy) < 8) {
        this.moveTarget = null
        // arrived at a chest/NPC clicked from a distance — open it automatically
        // instead of leaving the player standing there needing a second click
        if (this.moveTargetObj && this.moveTargetObj.updateProximity(this.player.x, this.player.y)) {
          this.moveTargetObj.interact()
        }
        this.moveTargetObj = null
      } else {
        left = dx < -4
        right = dx > 4
        up = dy < -4
        down = dy > 4
      }
    }

    const moving = !frozen && (left || right || up || down)
    const running = this.keys[kb.run].isDown

    this.player.update({
      left, right, up, down, running, frozen,
    })

    if (moving) {
      const interval = running ? 220 : 320
      if (this.time.now - this.lastFootstep > interval) {
        this.lastFootstep = this.time.now
        sfx.footstep(FOOTSTEP_SURFACE[ZONES[this.zoneId].decor?.kind] ?? 'ground')
        spawnDust(this, this.player.x, this.player.y + this.player.sprite.height * 0.4)
      }
    }

    if (!frozen) {
      store.setPlayerPos(this.player.x, this.player.y)
    }

    const interactPressed = Phaser.Input.Keyboard.JustDown(this.keys[kb.interact])
      || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)

    let nearest = null
    let nearestDist = Infinity
    const consider = (obj) => {
      const near = obj.updateProximity(this.player.x, this.player.y)
      if (near && !frozen) {
        const d = Math.hypot(this.player.x - obj.x, this.player.y - obj.y)
        if (d < nearestDist) { nearestDist = d; nearest = obj }
      }
    }
    consider(this.mainNpc)
    this.helperNpcs.forEach(consider)

    // this.chests doesn't exist for the first frame or two of a zone visit —
    // building it waits on the zone's bonus pool to finish loading (see
    // buildChests()/the ensureBonusPoolLoaded().then() call in create()).
    if (this.chests) {
      let allDone = true
      this.chests.forEach((chest, i) => {
        if (!chest.completed && store.isChallengeComplete(chest.challenge.id)) {
          chest.setCompleted()
          this.player.celebrate()
          spawnConfetti(this, chest.x, chest.y)
        }
        // Zone completion is gated on each POSITION's original challenge ever
        // having been solved — not on the chest's current live occupant.
        // Rotating a position to a fresh bonus-pool draw resets chest.completed
        // to false (see Chest.setChallenge), which is correct for the visual
        // "unsolved" cue but must NOT re-block zone completion: rotation is
        // optional replay content, and solving a position once is permanent
        // (matches how HUD.jsx/ZoneComplete.jsx/talkToMain() already count
        // "done" — via the original id, never the live occupant's id).
        // this.chests is built once, in the same order as zone.challenges, and
        // never reordered afterward, so index i always maps to the original.
        const original = zone.challenges[i]
        if (!store.isChallengeComplete(original.id) && !original.bonus) allDone = false
        consider(chest)
      })

      if (allDone && !this.zoneCompleteTriggered) {
        this.zoneCompleteTriggered = true
        spawnConfetti(this, this.player.x, this.player.y, 48)
        store.triggerZoneComplete(this.zoneId)
      }
    }

    if (interactPressed && nearest && !frozen) {
      nearest.interact()
    }
  }
}

export { WORLD_W, WORLD_H }
