import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GAME_CONFIG } from './config.js'

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: GAME_CONFIG.backgroundColor,
  parent: 'game-canvas',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  dom: {
    createContainer: true
  },
  scene: [BootScene, MenuScene, GameScene]
}

const game = new Phaser.Game(config)

// Handle resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight)
})

export default game
