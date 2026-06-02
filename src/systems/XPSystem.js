// ============================================================
//  XPSystem – Experience and Levelling
// ============================================================

import { GAME_CONFIG } from '../config.js'

export class XPSystem {
  constructor(scene, player) {
    this.scene  = scene
    this.player = player
    this.xp     = 0
    this.level  = 1

    // XP required to reach each level (index = level to reach)
    this.xpThresholds = [
      0,     // level 1  (base)
      100,   // level 2
      250,   // level 3
      450,   // level 4
      700,   // level 5
      1000,  // level 6
      1400,  // level 7
      1900,  // level 8
      2500,  // level 9
      3200,  // level 10 (max)
    ]
  }

  /**
   * Award XP to the player.  Automatically triggers level-ups.
   * @returns {number} new total XP
   */
  addXP(amount) {
    this.xp += amount

    // Allow multiple level-ups in a single call (e.g. large XP burst)
    let nextThreshold = this.xpThresholds[this.level]
    while (nextThreshold !== undefined && this.xp >= nextThreshold) {
      this.levelUp()
      nextThreshold = this.xpThresholds[this.level]
    }

    return this.xp
  }

  /** Apply stat boosts and display level-up effects. */
  levelUp() {
    this.level++

    // Stat boosts
    this.player.maxHP   = Math.floor(this.player.maxHP * 1.1)
    this.player.hp      = this.player.maxHP          // full heal on level up
    this.player.speed  += 10
    this.player.bulletDamage = Math.floor((this.player.bulletDamage || 15) * 1.05)

    this.showLevelUpEffect()
    return this.level
  }

  /** Splash text + camera shake on level-up. */
  showLevelUpEffect() {
    const px = this.player.sprite?.x ?? 400
    const py = this.player.sprite?.y ?? 300

    const text = this.scene.add.text(px, py - 50, `⬆ LEVEL ${this.level}!`, {
      fontSize:        '28px',
      fill:            '#fbbf24',
      fontFamily:      'Orbitron, monospace',
      stroke:          '#000000',
      strokeThickness: 4,
    }).setDepth(200).setOrigin(0.5)

    this.scene.tweens.add({
      targets:  text,
      y:        py - 130,
      alpha:    0,
      scaleX:   1.6,
      scaleY:   1.6,
      duration: 1500,
      ease:     'Power2',
      onComplete: () => text.destroy(),
    })

    // Ripple ring
    const ring = this.scene.add.graphics()
    ring.lineStyle(3, 0xfbbf24, 1)
    ring.strokeCircle(px, py, 30)
    ring.setDepth(190)

    this.scene.tweens.add({
      targets:  ring,
      scaleX:   4,
      scaleY:   4,
      alpha:    0,
      duration: 600,
      ease:     'Power2',
      onComplete: () => ring.destroy(),
    })

    // Camera shake
    this.scene.cameras.main.shake(200, 0.005)
  }

  /**
   * Returns progress (0–1) toward the next level.
   */
  getXPProgress() {
    const currentThreshold = this.xpThresholds[this.level - 1] ?? 0
    const nextThreshold    = this.xpThresholds[this.level]

    if (nextThreshold === undefined) return 1 // max level

    const range    = nextThreshold - currentThreshold
    const progress = (this.xp - currentThreshold) / range
    return Math.min(1, Math.max(0, progress))
  }

  /** Returns the XP needed for the next level. */
  getXPToNextLevel() {
    return this.xpThresholds[this.level] ?? null
  }
}
