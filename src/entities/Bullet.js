// ============================================================
//  Bullet – Projectile Entity
// ============================================================

import { COLORS } from '../config.js'

export class Bullet {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x        World X spawn position
   * @param {number} y        World Y spawn position
   * @param {number} angle    Direction in radians
   * @param {number} speed    Pixels per second
   * @param {number} damage   Damage on hit
   * @param {number} [color]  Bullet tint (hex number)
   */
  constructor(scene, x, y, angle, speed, damage, color = COLORS.bullet) {
    this.scene  = scene
    this.damage = damage
    this.alive  = true
    this.color  = color

    // ── Graphics ──────────────────────────────────────────────
    this.sprite = scene.add.graphics()
    this._drawBullet()
    this.sprite.x = x
    this.sprite.y = y
    this.sprite.setDepth(5)

    // ── Physics ───────────────────────────────────────────────
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed

    // Auto-destroy after 2 s (in case it leaves the world silently)
    scene.time.delayedCall(2000, () => this.destroy())
  }

  _drawBullet() {
    this.sprite.clear()
    // Soft outer glow
    this.sprite.fillStyle(this.color, 0.25)
    this.sprite.fillCircle(0, 0, 10)
    // Core
    this.sprite.fillStyle(this.color, 1)
    this.sprite.fillCircle(0, 0, 5)
    // Bright centre highlight
    this.sprite.fillStyle(0xffffff, 0.7)
    this.sprite.fillCircle(-1, -1, 2)
  }

  update(delta) {
    if (!this.alive) return

    const dt = delta / 1000
    this.sprite.x += this.vx * dt
    this.sprite.y += this.vy * dt

    // Destroy when outside world bounds
    const W = 3000, H = 3000
    if (this.sprite.x < 0 || this.sprite.x > W ||
        this.sprite.y < 0 || this.sprite.y > H) {
      this.destroy()
    }
  }

  /** Axis-aligned bounding box centred on the bullet. */
  getBounds() {
    return {
      x:       this.sprite.x - 9,
      y:       this.sprite.y - 9,
      width:   18,
      height:  18,
      centerX: this.sprite.x,
      centerY: this.sprite.y,
      radius:  9,
    }
  }

  destroy() {
    if (!this.alive) return
    this.alive = false

    // Small explosion flash
    const explosion = this.scene.add.graphics()
    explosion.fillStyle(this.color, 0.85)
    explosion.fillCircle(0, 0, 12)
    explosion.x = this.sprite.x
    explosion.y = this.sprite.y
    explosion.setDepth(6)

    this.scene.tweens.add({
      targets:  explosion,
      alpha:    0,
      scaleX:   2.5,
      scaleY:   2.5,
      duration: 180,
      onComplete: () => explosion.destroy(),
    })

    this.sprite.destroy()
  }
}
