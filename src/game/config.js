import Phaser from 'phaser'
import ZoneScene from './scenes/ZoneScene.js'

export function createGame(parent, zoneId) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#0a0a0f',
    pixelArt: false,
    resolution: window.devicePixelRatio || 1,
    render: { antialias: true, roundPixels: false },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new ZoneScene(zoneId)],
  })
}
