// ============================================================
//  GameScene – Main Gameplay Scene
//  Phaser 3 + manual physics (no Arcade)
// ============================================================

import Phaser       from 'phaser'
import { GAME_CONFIG, COLORS, CHARACTERS } from '../config.js'
import { Player }       from '../entities/Player.js'
import { Bullet }       from '../entities/Bullet.js'
import { Enemy }        from '../entities/Enemy.js'
import { InputSystem }  from '../systems/InputSystem.js'
import { CombatSystem } from '../systems/CombatSystem.js'
import { XPSystem }     from '../systems/XPSystem.js'
import { HUD }          from '../ui/HUD.js'

const WORLD_W = 3000
const WORLD_H = 3000

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  // ── Phaser lifecycle ─────────────────────────────────────
  init(data) {
    // character data passed from MenuScene
    this.characterData = data.character ?? CHARACTERS[0]
  }

  create() {
    // ── World & camera setup ────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ── Background: dark hex-grid pattern ──────────────────
    this._createBackground()

    // ── Entities ───────────────────────────────────────────
    this.bullets = []
    this.enemies = []

    this.player = new Player(
      this,
      WORLD_W / 2,
      WORLD_H / 2,
      this.characterData
    )

    // ── Systems ────────────────────────────────────────────
    this.inputSystem  = new InputSystem(this)
    this.combatSystem = new CombatSystem(this)
    this.xpSystem     = new XPSystem(this, this.player)

    // ── Camera follows player ──────────────────────────────
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08)

    // ── HUD ────────────────────────────────────────────────
    this.hud = new HUD(this, this.player, this.xpSystem)

    // ── Score / kills ──────────────────────────────────────
    this.score     = 0
    this.kills     = 0
    this.wave      = 1
    this.gameOver  = false

    // ── Enemy spawning ─────────────────────────────────────
    this.spawnInterval   = GAME_CONFIG.enemy?.spawnInterval ?? 2000
    this.lastSpawnTime   = 0
    this.enemiesPerWave  = 3
    this.waveTimer       = 0         // accumulator toward next wave escalation
    this.waveEscalateEvery = 30000   // every 30 s, increase wave

    // ── ESC → pause / back to menu ─────────────────────────
    this.input.keyboard.on('keydown-ESC', () => {
      if (!this.gameOver) this._returnToMenu()
    })

    // ── R key to restart (shown on game over) ──────────────
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
  }

  update(time, delta) {
    if (this.gameOver) {
      // Poll for restart
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this._restartGame()
      }
      return
    }

    // ── Player ─────────────────────────────────────────────
    this.player.update(delta, this.inputSystem, this.bullets)

    // ── Bullets ────────────────────────────────────────────
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.update(delta)
      if (!b.alive) {
        this.bullets.splice(i, 1)
      }
    }

    // ── Enemies ────────────────────────────────────────────
    const px = this.player.sprite.x
    const py = this.player.sprite.y

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      e.update(delta, px, py)

      if (!e.alive) {
        this.enemies.splice(i, 1)
        continue
      }

      // ── Enemy vs player contact ─────────────────────────
      if (this.checkCircleCollision(px, py, 16, e.sprite.x, e.sprite.y, e.size)) {
        const died = this.player.takeDamage(e.damage)
        if (died) {
          this._handlePlayerDeath()
          return
        }
      }
    }

    // ── Bullet vs enemy collision ───────────────────────────
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi]
      if (!b.alive) continue

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei]
        if (!e.alive) continue

        if (this.checkCircleCollision(
          b.sprite.x, b.sprite.y, 9,
          e.sprite.x, e.sprite.y, e.size
        )) {
          // Roll crit
          const { isCrit, multiplier } = this.combatSystem.rollCrit(0.1)
          const dmg = Math.round(b.damage * multiplier)

          this.combatSystem.showDamageNumber(e.sprite.x, e.sprite.y, dmg, isCrit)

          const dead = e.takeDamage(dmg)
          b.destroy()

          if (dead) {
            this.xpSystem.addXP(e.xpReward)
            this.score += 10
            this.kills++
            this.hud.addKill()
            e.destroy()
          }
          break  // bullet consumed
        }
      }
    }

    // ── Spawn logic ─────────────────────────────────────────
    this.waveTimer += delta
    if (this.waveTimer >= this.waveEscalateEvery) {
      this.waveTimer -= this.waveEscalateEvery
      this.wave++
      this.enemiesPerWave = Math.min(15, this.enemiesPerWave + 2)
      this.spawnInterval  = Math.max(800, this.spawnInterval - 150)
    }

    if (
      time - this.lastSpawnTime >= this.spawnInterval &&
      this.enemies.length < (GAME_CONFIG.enemy?.maxEnemies ?? 60)
    ) {
      for (let i = 0; i < this.enemiesPerWave; i++) {
        this._spawnEnemy()
      }
      this.lastSpawnTime = time
    }

    // ── HUD refresh ─────────────────────────────────────────
    const xps = this.xpSystem
    const nextXP = xps.getXPToNextLevel() ?? xps.xp
    this.hud.update(
      this.player.hp,
      this.player.maxHP,
      xps.xp,
      xps.level,
      nextXP,
      this.score,
      this.kills
    )
  }

  // ── Background ───────────────────────────────────────────
  _createBackground() {
    // Dark fill
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a14, 1)
    bg.fillRect(0, 0, WORLD_W, WORLD_H)
    bg.setDepth(-10)

    // Fine grid
    const grid = this.add.graphics()
    grid.lineStyle(1, 0x1a1a38, 1)
    const step = 80
    for (let x = 0; x <= WORLD_W; x += step) grid.lineBetween(x, 0, x, WORLD_H)
    for (let y = 0; y <= WORLD_H; y += step) grid.lineBetween(0, y, WORLD_W, y)
    grid.setDepth(-9)

    // Glowing accent nodes at grid intersections (sparse)
    const accent = this.add.graphics()
    accent.setDepth(-8)
    for (let x = 0; x <= WORLD_W; x += step * 4) {
      for (let y = 0; y <= WORLD_H; y += step * 4) {
        accent.fillStyle(0x6366f1, 0.12)
        accent.fillCircle(x, y, 6)
        accent.fillStyle(0x6366f1, 0.5)
        accent.fillCircle(x, y, 2)
      }
    }

    // World border
    const border = this.add.graphics()
    border.lineStyle(4, 0x6366f1, 0.6)
    border.strokeRect(2, 2, WORLD_W - 4, WORLD_H - 4)
    border.setDepth(-7)
  }

  // ── Enemy spawning ────────────────────────────────────────
  _spawnEnemy() {
    const px = this.player.sprite.x
    const py = this.player.sprite.y
    const minDist = 300

    let x, y, attempts = 0
    do {
      x = Phaser.Math.Between(50, WORLD_W - 50)
      y = Phaser.Math.Between(50, WORLD_H - 50)
      attempts++
    } while (
      Math.hypot(x - px, y - py) < minDist && attempts < 30
    )

    // Type weighting: 80% normal, 15% fast, 4% tank, 1% elite
    const r = Math.random()
    let type = 'normal'
    if      (r < 0.01)  type = 'elite'
    else if (r < 0.05)  type = 'tank'
    else if (r < 0.20)  type = 'fast'

    // Scale up elite/tank chance slightly in higher waves
    if (this.wave >= 3 && Math.random() < 0.03) type = 'elite'

    this.enemies.push(new Enemy(this, x, y, type))
  }

  // ── Collision helpers ─────────────────────────────────────
  /**
   * Circle-circle overlap test.
   */
  checkCircleCollision(ax, ay, ra, bx, by, rb) {
    const dx   = ax - bx
    const dy   = ay - by
    const dist = dx * dx + dy * dy
    const minD = (ra + rb) * (ra + rb)
    return dist <= minD
  }

  // ── Player death ──────────────────────────────────────────
  _handlePlayerDeath() {
    this.gameOver = true
    this.player.destroy()

    // Stop spawning
    this.enemies.forEach(e => e.destroy())
    this.enemies = []
    this.bullets.forEach(b => b.destroy())
    this.bullets = []

    // Dramatic shake + dim
    this.cameras.main.shake(500, 0.025)
    this.cameras.main.flash(300, 255, 50, 50)

    this.time.delayedCall(600, () => this._showGameOverScreen())
  }

  _showGameOverScreen() {
    const cam = this.cameras.main
    const W   = cam.width
    const H   = cam.height

    // Dim overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.75)
    overlay.fillRect(0, 0, W, H)
    overlay.setScrollFactor(0).setDepth(300)

    // Panel
    const panel = this.add.graphics()
    panel.fillStyle(0x0d0d22, 0.95)
    panel.fillRoundedRect(W / 2 - 220, H / 2 - 160, 440, 320, 16)
    panel.lineStyle(2, 0x6366f1, 1)
    panel.strokeRoundedRect(W / 2 - 220, H / 2 - 160, 440, 320, 16)
    panel.setScrollFactor(0).setDepth(301)

    const style = (size, color = '#ffffff') => ({
      fontFamily: 'Orbitron, monospace',
      fontSize:   size,
      fill:       color,
      stroke:     '#000000',
      strokeThickness: 3,
    })

    this.add.text(W / 2, H / 2 - 120, '💀 GAME OVER', style('32px', '#ef4444'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(302)

    this.add.text(W / 2, H / 2 - 60, `SCORE   ${this.score}`, style('20px', '#fbbf24'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(302)

    this.add.text(W / 2, H / 2 - 20, `KILLS   ${this.kills}`, style('18px', '#e2e8f0'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(302)

    this.add.text(W / 2, H / 2 + 20, `LEVEL   ${this.xpSystem.level}`, style('18px', '#e2e8f0'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(302)

    this.add.text(W / 2, H / 2 + 20, `WAVE    ${this.wave}`, style('18px', '#94a3b8'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(302)

    // Blinking restart prompt
    const prompt = this.add.text(W / 2, H / 2 + 100, 'Press  R  or  CLICK  to restart', style('15px', '#6366f1'))
      .setOrigin(0.5).setScrollFactor(0).setDepth(302)

    this.tweens.add({
      targets:  prompt,
      alpha:    0,
      duration: 700,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })

    // Click to restart
    this.input.once('pointerdown', () => this._restartGame())
  }

  _restartGame() {
    this.cameras.main.fade(400, 0, 0, 0)
    this.time.delayedCall(420, () => {
      this.scene.restart({ character: this.characterData })
    })
  }

  _returnToMenu() {
    this.cameras.main.fade(400, 0, 0, 0)
    this.time.delayedCall(420, () => {
      this.scene.start('MenuScene')
    })
  }
}
