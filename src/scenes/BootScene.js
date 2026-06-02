import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a0f, 0x0a0a0f, 0x1a0a2e, 0x1a0a2e, 1)
    bg.fillRect(0, 0, width, height)

    // Progress box
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x1a1a2e, 0.9)
    progressBox.fillRoundedRect(width / 2 - 210, height / 2 - 20, 420, 40, 8)
    progressBox.lineStyle(1, 0x8b5cf6, 0.5)
    progressBox.strokeRoundedRect(width / 2 - 210, height / 2 - 20, 420, 40, 8)

    // Progress bar fill
    const progressBar = this.add.graphics()

    // Title text
    const loadingText = this.add.text(width / 2, height / 2 - 80, '⚔️ ALL STAR BATTLE', {
      fontSize: '32px',
      color: '#8b5cf6',
      fontFamily: 'Orbitron, monospace',
      fontStyle: 'bold',
      stroke: '#4c1d95',
      strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: '#8b5cf6', blur: 20, fill: true }
    }).setOrigin(0.5)

    const subtitleText = this.add.text(width / 2, height / 2 - 48, 'Anime Web Battle Game', {
      fontSize: '14px',
      color: '#a78bfa',
      fontFamily: 'Orbitron, monospace',
      letterSpacing: 4
    }).setOrigin(0.5)

    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      fontSize: '16px',
      color: '#a78bfa',
      fontFamily: 'Orbitron, monospace'
    }).setOrigin(0.5)

    const statusText = this.add.text(width / 2, height / 2 + 75, 'กำลังโหลดทรัพยากร...', {
      fontSize: '13px',
      color: '#6d6d8a',
      fontFamily: 'Noto Sans Thai, sans-serif'
    }).setOrigin(0.5)

    // Animated glow on title
    this.tweens.add({
      targets: loadingText,
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Particle stars
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width)
      const y = Phaser.Math.Between(0, height)
      const size = Phaser.Math.FloatBetween(0.5, 2)
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.7))
      this.tweens.add({
        targets: star,
        alpha: { from: Phaser.Math.FloatBetween(0.1, 0.5), to: Phaser.Math.FloatBetween(0.6, 1) },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000)
      })
    }

    // Loading progress
    this.load.on('progress', (value) => {
      const pct = Math.floor(value * 100)
      percentText.setText(pct + '%')
      progressBar.clear()
      progressBar.fillStyle(0x8b5cf6, 1)
      progressBar.fillRoundedRect(width / 2 - 206, height / 2 - 16, 412 * value, 32, 6)
      // Glow effect on bar
      progressBar.fillStyle(0xa78bfa, 0.3)
      progressBar.fillRoundedRect(width / 2 - 206, height / 2 - 16, 412 * value, 32, 6)
    })

    this.load.on('fileprogress', (file) => {
      statusText.setText('โหลด: ' + file.key)
    })

    this.load.on('complete', () => {
      percentText.setText('100%')
      statusText.setText('โหลดเสร็จสมบูรณ์!')
      progressBar.clear()
      progressBar.fillStyle(0x8b5cf6, 1)
      progressBar.fillRoundedRect(width / 2 - 206, height / 2 - 16, 412, 32, 6)
    })
  }

  create() {
    // Dispatch event so HTML overlay can hide
    window.dispatchEvent(new CustomEvent('game-ready'))

    // Short delay then go to menu
    this.time.delayedCall(600, () => {
      this.cameras.main.fade(400, 0, 0, 0)
      this.time.delayedCall(400, () => {
        this.scene.start('MenuScene')
      })
    })
  }
}
