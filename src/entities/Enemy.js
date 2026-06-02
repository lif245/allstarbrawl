// ============================================================
//  Enemy – Hostile Entity
// ============================================================

import { GAME_CONFIG, COLORS } from '../config.js'

export class Enemy {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {'normal'|'fast'|'tank'|'elite'} type
   */
  constructor(scene, x, y, type = 'normal') {
    this.scene = scene
    this.type  = type
    this.alive = true

    // ── Stats ─────────────────────────────────────────────────
    const stats      = this.getStats(type)
    this.hp          = stats.hp
    this.maxHP       = stats.hp
    this.speed       = stats.speed
    this.damage      = stats.damage
    this.xpReward    = stats.xpReward
    this.color       = stats.color
    this.size        = stats.size
    this.attackRange = stats.attackRange ?? 18

    // ── Graphics ──────────────────────────────────────────────
    this.sprite = scene.add.graphics()
    this.drawSprite()
    this.sprite.x = x
    this.sprite.y = y
    this.sprite.setDepth(3)

    // HP bar (background + fill)
    this.hpBarBg   = scene.add.graphics()
    this.hpBarFill = scene.add.graphics()
    this.hpBarBg.setDepth(4)
    this.hpBarFill.setDepth(4)
    this.drawHPBar()
  }

  // ── Static type definitions ───────────────────────────────
  getStats(type) {
    const types = {
      normal: { hp: 30,  speed: 80,  damage: 10, xpReward: 20,  color: 0xef4444, size: 16, attackRange: 18 },
      fast:   { hp: 15,  speed: 155, damage: 7,  xpReward: 15,  color: 0xf97316, size: 12, attackRange: 14 },
      tank:   { hp: 100, speed: 50,  damage: 20, xpReward: 50,  color: 0xdc2626, size: 26, attackRange: 28 },
      elite:  { hp: 200, speed: 70,  damage: 30, xpReward: 100, color: 0x7c3aed, size: 30, attackRange: 32 },
    }
    return types[type] ?? types.normal
  }

  // ── Rendering ─────────────────────────────────────────────
  drawSprite() {
    this.sprite.clear()

    // Outer glow
    this.sprite.fillStyle(this.color, 0.18)
    this.sprite.fillCircle(0, 0, this.size + 8)

    // Mid glow
    this.sprite.fillStyle(this.color, 0.35)
    this.sprite.fillCircle(0, 0, this.size + 3)

    // Main body
    this.sprite.fillStyle(this.color, 1)
    this.sprite.fillCircle(0, 0, this.size)

    // Eye white
    this.sprite.fillStyle(0xffffff, 1)
    this.sprite.fillCircle(this.size * 0.3, -this.size * 0.2, this.size * 0.28)

    // Pupil
    this.sprite.fillStyle(0x0a0a1a, 1)
    this.sprite.fillCircle(this.size * 0.36, -this.size * 0.2, this.size * 0.14)

    // Elite crown marker
    if (this.type === 'elite') {
      this.sprite.fillStyle(0xffd700, 1)
      this.sprite.fillTriangle(
        -8, -this.size - 4,
         0, -this.size - 14,
         8, -this.size - 4
      )
    }
  }

  drawHPBar() {
    const barWidth  = this.size * 2.8
    const barHeight = 5
    const offsetY   = this.size + 10

    this.hpBarBg.clear()
    this.hpBarBg.fillStyle(0x1a1a2e, 0.9)
    this.hpBarBg.fillRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight)

    this.hpBarFill.clear()
    const pct = this.hp / this.maxHP
    const barColor = pct > 0.5 ? 0x22c55e : pct > 0.25 ? 0xf59e0b : 0xef4444
    this.hpBarFill.fillStyle(barColor, 1)
    this.hpBarFill.fillRect(-barWidth / 2, -barHeight / 2, barWidth * pct, barHeight)

    this.hpBarBg.x   = this.sprite.x
    this.hpBarBg.y   = this.sprite.y + offsetY
    this.hpBarFill.x = this.sprite.x
    this.hpBarFill.y = this.sprite.y + offsetY
  }

  // ── Per-frame ─────────────────────────────────────────────
  update(delta, playerX, playerY) {
    if (!this.alive) return

    const dt = delta / 1000
    const dx = playerX - this.sprite.x
    const dy = playerY - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > this.attackRange + 5) {
      this.sprite.x += (dx / dist) * this.speed * dt
      this.sprite.y += (dy / dist) * this.speed * dt
      this.sprite.rotation = Math.atan2(dy, dx) + Math.PI / 2
    }

    this.drawHPBar()
  }

  // ── Collision ─────────────────────────────────────────────
  getBounds() {
    return {
      x:       this.sprite.x - this.size,
      y:       this.sprite.y - this.size,
      width:   this.size * 2,
      height:  this.size * 2,
      centerX: this.sprite.x,
      centerY: this.sprite.y,
      radius:  this.size,
    }
  }

  takeDamage(amount) {
    this.hp -= amount
    this.drawHPBar()

    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0.25,
      duration: 80,
      yoyo:     true,
    })

    return this.hp <= 0
  }

  // ── Death ─────────────────────────────────────────────────
  destroy() {
    if (!this.alive) return
    this.alive = false

    // Particle burst
    const count = this.type === 'elite' ? 14 : this.type === 'tank' ? 10 : 8
    for (let i = 0; i < count; i++) {
      const angle    = (i / count) * Math.PI * 2
      const dist     = this.size * 2.5
      const particle = this.scene.add.graphics()
      particle.fillStyle(this.color, 1)
      particle.fillCircle(0, 0, this.type === 'tank' ? 5 : 4)
      particle.x = this.sprite.x
      particle.y = this.sprite.y
      particle.setDepth(10)

      this.scene.tweens.add({
        targets:  particle,
        x:        this.sprite.x + Math.cos(angle) * dist,
        y:        this.sprite.y + Math.sin(angle) * dist,
        alpha:    0,
        duration: 400,
        ease:     'Power2',
        onComplete: () => particle.destroy(),
      })
    }

    // Screen flash for elites
    if (this.type === 'elite') {
      this.scene.cameras.main.flash(150, 124, 58, 237, false)
    }

    this.sprite.destroy()
    this.hpBarBg.destroy()
    this.hpBarFill.destroy()
  }
}
