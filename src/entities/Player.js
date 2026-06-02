// ============================================================
//  Player – Player-Controlled Entity
// ============================================================

import { COLORS } from '../config.js'
import { Bullet }  from './Bullet.js'

export class Player {
  /**
   * @param {Phaser.Scene}  scene
   * @param {number}        x              World X spawn
   * @param {number}        y              World Y spawn
   * @param {object}        characterData  Entry from CHARACTERS array
   */
  constructor(scene, x, y, characterData) {
    this.scene     = scene
    this.character = characterData
    this.alive     = true

    // ── Base stats ────────────────────────────────────────────
    this.speed        = characterData.speed        ?? 220
    this.maxHP        = characterData.hp           ?? 100
    this.hp           = this.maxHP
    this.bulletDamage = characterData.bulletDamage ?? 15
    this.fireRate     = characterData.fireRate      ?? 200   // ms between shots
    this.lastShot     = 0

    // Invincibility frames after taking damage
    this.invincible         = false
    this.invincibleDuration = 500   // ms

    // Bullet list (managed externally by GameScene)
    this.bullets = []

    // Aim angle in radians
    this.aimAngle = 0

    // ── Sprite ────────────────────────────────────────────────
    this.sprite = scene.add.graphics()
    this.drawSprite()
    this.sprite.x = x
    this.sprite.y = y
    this.sprite.setDepth(10)

    // Gun barrel
    this.barrel = scene.add.graphics()
    this.barrel.setDepth(9)
    this.drawBarrel()

    // Name label above the sprite
    this.nameLabel = scene.add.text(x, y - 35, characterData.name ?? 'Player', {
      fontSize:        '12px',
      fill:            '#e2e8f0',
      fontFamily:      'Orbitron, monospace',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11)

    // Idle pulse animation
    this._startIdlePulse()
  }

  // ── Draw helpers ──────────────────────────────────────────
  drawSprite() {
    this.sprite.clear()
    const color = this.character.color ?? COLORS.primary

    // Outer glow ring
    this.sprite.fillStyle(color, 0.12)
    this.sprite.fillCircle(0, 0, 30)
    // Inner glow
    this.sprite.fillStyle(color, 0.28)
    this.sprite.fillCircle(0, 0, 22)
    // Body
    this.sprite.fillStyle(color, 1)
    this.sprite.fillCircle(0, 0, 16)
    // Highlight
    this.sprite.fillStyle(0xffffff, 0.45)
    this.sprite.fillCircle(-5, -6, 6)
  }

  drawBarrel() {
    this.barrel.clear()
    // Barrel shaft
    this.barrel.fillStyle(0x94a3b8, 1)
    this.barrel.fillRect(0, -4, 28, 8)
    // Muzzle
    this.barrel.fillStyle(0x64748b, 1)
    this.barrel.fillRect(22, -5, 8, 10)
  }

  _startIdlePulse() {
    this.scene.tweens.add({
      targets:  this.sprite,
      scaleX:   1.06,
      scaleY:   1.06,
      duration: 800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    })
  }

  // ── Per-frame update ──────────────────────────────────────
  /**
   * @param {number}      delta
   * @param {InputSystem} inputSystem
   * @param {Bullet[]}    bulletsArray  Shared bullet array from GameScene
   */
  update(delta, inputSystem, bulletsArray) {
    if (!this.alive) return

    const dt = delta / 1000

    // Movement
    const move = inputSystem.getMovement()
    this.sprite.x += move.x * this.speed * dt
    this.sprite.y += move.y * this.speed * dt

    // Clamp to world bounds
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, 20, 2980)
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, 20, 2980)

    // Aiming
    this.aimAngle        = inputSystem.getAimAngle(this.sprite.x, this.sprite.y)
    this.sprite.rotation = this.aimAngle + Math.PI / 2

    // Barrel follows player & aims
    this.barrel.x        = this.sprite.x
    this.barrel.y        = this.sprite.y
    this.barrel.rotation = this.aimAngle

    // Name label
    this.nameLabel.x = this.sprite.x
    this.nameLabel.y = this.sprite.y - 38

    // Shooting
    const now = this.scene.time.now
    if (inputSystem.isShooting() && now - this.lastShot >= this.fireRate) {
      this._shoot(bulletsArray)
      this.lastShot = now
    }
  }

  _shoot(bulletsArray) {
    // Spawn at muzzle end of barrel
    const spawnX = this.sprite.x + Math.cos(this.aimAngle) * 32
    const spawnY = this.sprite.y + Math.sin(this.aimAngle) * 32

    bulletsArray.push(new Bullet(
      this.scene,
      spawnX, spawnY,
      this.aimAngle,
      620,
      this.bulletDamage,
      this.character.color ?? COLORS.bullet,
    ))

    // Muzzle flash
    const flash = this.scene.add.graphics()
    flash.fillStyle(0xfbbf24, 0.95)
    flash.fillCircle(0, 0, 9)
    flash.x = spawnX
    flash.y = spawnY
    flash.setDepth(12)

    this.scene.tweens.add({
      targets:  flash,
      alpha:    0,
      scaleX:   2.5,
      scaleY:   2.5,
      duration: 90,
      onComplete: () => flash.destroy(),
    })
  }

  // ── Combat ────────────────────────────────────────────────
  takeDamage(amount) {
    if (this.invincible) return false
    this.hp = Math.max(0, this.hp - amount)

    // Trigger invincibility window
    this.invincible = true
    this.scene.time.delayedCall(this.invincibleDuration, () => {
      this.invincible = false
    })

    // Flash effect
    this.scene.tweens.add({
      targets:  [this.sprite, this.barrel],
      alpha:    0.15,
      duration: 90,
      yoyo:     true,
      repeat:   2,
      onComplete: () => {
        if (this.sprite) this.sprite.alpha = 1
        if (this.barrel) this.barrel.alpha = 1
      },
    })

    // Camera shake
    this.scene.cameras.main.shake(150, 0.012)

    return this.hp <= 0
  }

  // ── Bounds ────────────────────────────────────────────────
  getBounds() {
    return {
      x:       this.sprite.x - 16,
      y:       this.sprite.y - 16,
      width:   32,
      height:  32,
      centerX: this.sprite.x,
      centerY: this.sprite.y,
      radius:  16,
    }
  }

  // ── Destruction ───────────────────────────────────────────
  destroy() {
    this.alive = false

    // Large death particle burst
    for (let i = 0; i < 14; i++) {
      const angle    = (i / 14) * Math.PI * 2
      const particle = this.scene.add.graphics()
      particle.fillStyle(this.character.color ?? COLORS.primary, 1)
      particle.fillCircle(0, 0, 6)
      particle.x = this.sprite.x
      particle.y = this.sprite.y
      particle.setDepth(20)

      this.scene.tweens.add({
        targets:  particle,
        x:        this.sprite.x + Math.cos(angle) * 70,
        y:        this.sprite.y + Math.sin(angle) * 70,
        alpha:    0,
        duration: 700,
        ease:     'Power2',
        onComplete: () => particle.destroy(),
      })
    }

    this.sprite.destroy()
    this.barrel.destroy()
    this.nameLabel.destroy()
  }
}
