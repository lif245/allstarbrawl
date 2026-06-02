// ============================================================
//  CombatSystem – Damage, Healing, and Visual Feedback
// ============================================================

export class CombatSystem {
  constructor(scene) {
    this.scene = scene
    this.damageNumbers = []
  }

  /**
   * Apply damage to target, trigger flash effect.
   * @returns {boolean} true if target died
   */
  dealDamage(target, amount, isCrit = false) {
    target.hp = Math.max(0, target.hp - amount)
    this.showDamageNumber(target.x ?? target.sprite?.x ?? 0, target.y ?? target.sprite?.y ?? 0, amount, isCrit)

    // Hit-flash effect on the sprite
    if (target.sprite) {
      this.scene.tweens.add({
        targets: target.sprite,
        alpha: 0.3,
        duration: 60,
        yoyo: true,
        onComplete: () => { if (target.sprite) target.sprite.alpha = 1 },
      })
    }

    return target.hp <= 0
  }

  /**
   * Show a floating damage number above the impact point.
   */
  showDamageNumber(x, y, amount, isCrit = false) {
    const color  = isCrit ? '#fbbf24' : '#ffffff'
    const size   = isCrit ? '22px'    : '16px'
    const prefix = isCrit ? '💥 ' : ''

    const text = this.scene.add.text(x, y - 20, `${prefix}-${Math.round(amount)}`, {
      fontSize: size,
      fill: color,
      fontFamily: 'Orbitron, monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(100).setOrigin(0.5)

    this.scene.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })

    this.damageNumbers.push(text)
  }

  /**
   * Show a floating heal number above the heal point.
   */
  showHealNumber(x, y, amount) {
    const text = this.scene.add.text(x, y - 20, `+${Math.round(amount)}`, {
      fontSize: '16px',
      fill: '#22c55e',
      fontFamily: 'Orbitron, monospace',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(100).setOrigin(0.5)

    this.scene.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }

  /**
   * Calculate whether a hit is a critical strike.
   * @param {number} critChance 0–1
   * @returns {{ isCrit: boolean, multiplier: number }}
   */
  rollCrit(critChance = 0.1) {
    const isCrit = Math.random() < critChance
    return { isCrit, multiplier: isCrit ? 2 : 1 }
  }
}
