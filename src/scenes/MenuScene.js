import Phaser from 'phaser'
import { CHARACTERS, COLORS } from '../config.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
    this.selectedIndex = 0
    this.cardObjects = []
  }

  create() {
    const W = this.cameras.main.width
    const H = this.cameras.main.height

    // Fade in
    this.cameras.main.fadeIn(600, 0, 0, 0)

    // ─── Background ────────────────────────────────────────────────────────────
    this._createBackground(W, H)

    // ─── Particle Stars ────────────────────────────────────────────────────────
    this._createStarfield(W, H)

    // ─── Floating Orbs (ambient glow blobs) ───────────────────────────────────
    this._createAmbientOrbs(W, H)

    // ─── Title ────────────────────────────────────────────────────────────────
    this._createTitle(W)

    // ─── Character Cards ──────────────────────────────────────────────────────
    this._createCharacterCards(W, H)

    // ─── Play Button ──────────────────────────────────────────────────────────
    this._createPlayButton(W, H)

    // ─── Keyboard navigation (arrow keys) ─────────────────────────────────────
    this._setupKeyboard()

    // ─── Version label ────────────────────────────────────────────────────────
    this.add.text(W - 12, H - 12, 'v1.0.0', {
      fontSize: '11px',
      color: '#3a3a5c',
      fontFamily: 'Orbitron, monospace'
    }).setOrigin(1, 1)
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  _createBackground(W, H) {
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0a0a0f, 0x0a0a0f, 0x140a28, 0x0a1428, 1)
    bg.fillRect(0, 0, W, H)

    // Grid lines
    const grid = this.add.graphics()
    grid.lineStyle(1, 0x8b5cf6, 0.04)
    const step = 60
    for (let x = 0; x < W; x += step) grid.lineBetween(x, 0, x, H)
    for (let y = 0; y < H; y += step) grid.lineBetween(0, y, W, y)
  }

  // ─── Star field ─────────────────────────────────────────────────────────────
  _createStarfield(W, H) {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, W)
      const y = Phaser.Math.Between(0, H)
      const r = Phaser.Math.FloatBetween(0.5, 2)
      const alpha = Phaser.Math.FloatBetween(0.15, 0.8)
      const star = this.add.circle(x, y, r, 0xffffff, alpha)

      this.tweens.add({
        targets: star,
        alpha: { from: alpha * 0.3, to: alpha },
        scaleX: { from: 0.8, to: 1.2 },
        scaleY: { from: 0.8, to: 1.2 },
        duration: Phaser.Math.Between(1500, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 3000)
      })
    }
  }

  // ─── Ambient glowing orbs ───────────────────────────────────────────────────
  _createAmbientOrbs(W, H) {
    const orbs = [
      { x: W * 0.15, y: H * 0.2, r: 120, color: 0x6366f1, alpha: 0.07 },
      { x: W * 0.85, y: H * 0.25, r: 100, color: 0x3b82f6, alpha: 0.07 },
      { x: W * 0.5, y: H * 0.9, r: 150, color: 0x8b5cf6, alpha: 0.06 },
      { x: W * 0.25, y: H * 0.8, r: 80, color: 0xef4444, alpha: 0.05 },
      { x: W * 0.75, y: H * 0.75, r: 80, color: 0xfbbf24, alpha: 0.05 }
    ]

    orbs.forEach(o => {
      const orb = this.add.circle(o.x, o.y, o.r, o.color, o.alpha)
      this.tweens.add({
        targets: orb,
        y: o.y + Phaser.Math.Between(-30, 30),
        x: o.x + Phaser.Math.Between(-20, 20),
        scaleX: { from: 1, to: 1.2 },
        scaleY: { from: 1, to: 1.2 },
        alpha: { from: o.alpha, to: o.alpha * 1.5 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
  }

  // ─── Title ──────────────────────────────────────────────────────────────────
  _createTitle(W) {
    // Glow shadow layer
    this.add.text(W / 2, 68, '⚔️ ALL STAR BATTLE', {
      fontSize: '46px',
      color: '#8b5cf6',
      fontFamily: 'Orbitron, monospace',
      fontStyle: 'bold',
      alpha: 0.4
    }).setOrigin(0.5).setBlendMode(Phaser.BlendModes.ADD)

    // Main title
    const title = this.add.text(W / 2, 68, '⚔️ ALL STAR BATTLE', {
      fontSize: '46px',
      color: '#ffffff',
      fontFamily: 'Orbitron, monospace',
      fontStyle: 'bold',
      stroke: '#8b5cf6',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: '#a78bfa', blur: 30, fill: true }
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      scaleX: { from: 0.97, to: 1.03 },
      scaleY: { from: 0.97, to: 1.03 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Subtitle
    const sub = this.add.text(W / 2, 118, 'ANIME WEB BATTLE GAME', {
      fontSize: '13px',
      color: '#a78bfa',
      fontFamily: 'Orbitron, monospace',
      letterSpacing: 8
    }).setOrigin(0.5)

    this.tweens.add({
      targets: sub,
      alpha: { from: 0.5, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Horizontal decorative line
    const line = this.add.graphics()
    line.lineStyle(1, 0x8b5cf6, 0.5)
    line.lineBetween(W / 2 - 220, 140, W / 2 + 220, 140)
    const lineDot = this.add.circle(W / 2, 140, 3, 0xa78bfa, 1)
  }

  // ─── Character Cards ─────────────────────────────────────────────────────────
  _createCharacterCards(W, H) {
    this.cardObjects = []
    const cardW = 220
    const cardH = 240
    const gap = 28
    const totalW = CHARACTERS.length * cardW + (CHARACTERS.length - 1) * gap
    const startX = (W - totalW) / 2
    const cardY = H / 2 - 30

    // Section label
    this.add.text(W / 2, cardY - cardH / 2 - 30, '— เลือกตัวละคร —', {
      fontSize: '14px',
      color: '#6d6d8a',
      fontFamily: 'Noto Sans Thai, sans-serif',
      letterSpacing: 4
    }).setOrigin(0.5)

    CHARACTERS.forEach((char, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2
      const cy = cardY

      const cardGroup = this.add.container(cx, cy)
      const hexColor = char.color

      // Card background
      const cardBg = this.add.graphics()
      const isSelected = i === this.selectedIndex

      this._drawCard(cardBg, cardW, cardH, hexColor, isSelected)

      // Character icon (large emoji)
      const iconText = this.add.text(0, -70, char.icon, {
        fontSize: '52px'
      }).setOrigin(0.5)

      // Name
      const nameText = this.add.text(0, -18, char.name, {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Orbitron, monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5)

      // Style label
      const styleText = this.add.text(0, 12, char.style, {
        fontSize: '12px',
        color: '#a78bfa',
        fontFamily: 'Noto Sans Thai, sans-serif',
        letterSpacing: 2
      }).setOrigin(0.5)

      // Divider
      const divider = this.add.graphics()
      divider.lineStyle(1, hexColor, 0.5)
      divider.lineBetween(-70, 32, 70, 32)

      // Skill label
      const skillLabel = this.add.text(0, 48, '✦ ' + char.skill, {
        fontSize: '11px',
        color: '#fbbf24',
        fontFamily: 'Noto Sans Thai, sans-serif'
      }).setOrigin(0.5)

      // Stat bars
      const speedPct = (char.speed / 300)
      const hpPct = (char.hp / 150)

      const statsContainer = this._createStatBars(cardW, speedPct, hpPct)

      cardGroup.add([cardBg, iconText, nameText, styleText, divider, skillLabel, ...statsContainer])
      cardGroup.setSize(cardW, cardH)
      cardGroup.setInteractive()

      // Hover
      cardGroup.on('pointerover', () => {
        if (i !== this.selectedIndex) {
          this.tweens.add({ targets: cardGroup, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Power2' })
          cardGroup.getAt(0).clear()
          this._drawCard(cardGroup.getAt(0), cardW, cardH, hexColor, false, true)
        }
      })

      cardGroup.on('pointerout', () => {
        if (i !== this.selectedIndex) {
          this.tweens.add({ targets: cardGroup, scaleX: 1, scaleY: 1, duration: 150, ease: 'Power2' })
          cardGroup.getAt(0).clear()
          this._drawCard(cardGroup.getAt(0), cardW, cardH, hexColor, false, false)
        }
      })

      cardGroup.on('pointerdown', () => {
        this._selectCard(i)
      })

      this.cardObjects.push({ container: cardGroup, bg: cardBg, hexColor, char })

      // Entrance animation
      cardGroup.setAlpha(0)
      cardGroup.y += 40
      this.tweens.add({
        targets: cardGroup,
        alpha: 1,
        y: cy,
        duration: 500,
        ease: 'Back.easeOut',
        delay: 200 + i * 100
      })
    })

    // Initial selection highlight
    this.time.delayedCall(900, () => this._selectCard(0, true))
  }

  _createStatBars(cardW, speedPct, hpPct) {
    const items = []
    const barW = cardW * 0.7
    const startX = -barW / 2

    // Speed bar
    const speedLabel = this.add.text(startX, 72, '⚡ SPD', {
      fontSize: '10px', color: '#fbbf24', fontFamily: 'Orbitron, monospace'
    })

    const speedBg = this.add.graphics()
    speedBg.fillStyle(0x1a1a3a, 1)
    speedBg.fillRoundedRect(startX, 85, barW, 6, 3)

    const speedFill = this.add.graphics()
    speedFill.fillStyle(0xfbbf24, 1)
    speedFill.fillRoundedRect(startX, 85, barW * speedPct, 6, 3)

    // HP bar
    const hpLabel = this.add.text(startX, 96, '❤️ HP', {
      fontSize: '10px', color: '#22c55e', fontFamily: 'Orbitron, monospace'
    })

    const hpBg = this.add.graphics()
    hpBg.fillStyle(0x1a1a3a, 1)
    hpBg.fillRoundedRect(startX, 109, barW, 6, 3)

    const hpFill = this.add.graphics()
    hpFill.fillStyle(0x22c55e, 1)
    hpFill.fillRoundedRect(startX, 109, barW * hpPct, 6, 3)

    return [speedLabel, speedBg, speedFill, hpLabel, hpBg, hpFill]
  }

  _drawCard(gfx, w, h, color, selected, hover = false) {
    gfx.clear()

    if (selected) {
      // Glow outer ring
      gfx.fillStyle(color, 0.15)
      gfx.fillRoundedRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 14)

      // Border glow
      gfx.lineStyle(3, color, 1)
      gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 12)

      // Inner fill
      gfx.fillStyle(0x1a1030, 0.95)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 12)

      // Top accent bar
      gfx.fillStyle(color, 1)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, 4, { tl: 12, tr: 12, bl: 0, br: 0 })
    } else if (hover) {
      gfx.lineStyle(2, color, 0.6)
      gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 12)
      gfx.fillStyle(0x16102a, 0.9)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 12)
      gfx.fillStyle(color, 0.7)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, 3, { tl: 12, tr: 12, bl: 0, br: 0 })
    } else {
      gfx.lineStyle(1, 0x4a4a7a, 0.6)
      gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 12)
      gfx.fillStyle(0x0f0d1e, 0.88)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 12)
      gfx.fillStyle(color, 0.3)
      gfx.fillRoundedRect(-w / 2, -h / 2, w, 3, { tl: 12, tr: 12, bl: 0, br: 0 })
    }
  }

  _selectCard(index, silent = false) {
    const prev = this.selectedIndex
    this.selectedIndex = index

    // Redraw all cards
    this.cardObjects.forEach((card, i) => {
      const isSelected = i === this.selectedIndex
      this._drawCard(card.bg, 220, 240, card.hexColor, isSelected)

      if (isSelected) {
        this.tweens.add({
          targets: card.container,
          scaleX: 1.08,
          scaleY: 1.08,
          y: card.container.y - (silent ? 0 : 8),
          duration: 200,
          ease: 'Back.easeOut'
        })
      } else {
        this.tweens.add({
          targets: card.container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        })
      }
    })

    if (!silent) {
      // Pulse effect on selected
      const container = this.cardObjects[index].container
      this.tweens.add({
        targets: container,
        scaleX: { from: 1.15, to: 1.08 },
        scaleY: { from: 1.15, to: 1.08 },
        duration: 300,
        ease: 'Back.easeOut'
      })
    }
  }

  // ─── Play Button ─────────────────────────────────────────────────────────────
  _createPlayButton(W, H) {
    const btnY = H - 80
    const btnW = 220
    const btnH = 56

    // Button background graphic
    const btnGfx = this.add.graphics()
    this._drawPlayBtn(btnGfx, btnW, btnH, false)
    btnGfx.setPosition(W / 2, btnY)

    // Button text
    const btnText = this.add.text(W / 2, btnY, '▶  PLAY  ▶', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'Orbitron, monospace',
      fontStyle: 'bold',
      stroke: '#4c1d95',
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: '#a78bfa', blur: 15, fill: true }
    }).setOrigin(0.5)

    // Invisible hitbox
    const hitbox = this.add.rectangle(W / 2, btnY, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })

    hitbox.on('pointerover', () => {
      btnGfx.clear()
      this._drawPlayBtn(btnGfx, btnW, btnH, true)
      this.tweens.add({ targets: [btnGfx, btnText], scaleX: 1.06, scaleY: 1.06, duration: 120, ease: 'Power2' })
    })

    hitbox.on('pointerout', () => {
      btnGfx.clear()
      this._drawPlayBtn(btnGfx, btnW, btnH, false)
      this.tweens.add({ targets: [btnGfx, btnText], scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' })
    })

    hitbox.on('pointerdown', () => {
      this._startGame()
    })

    // Pulse animation on button
    this.tweens.add({
      targets: btnText,
      alpha: { from: 0.8, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // Entrance
    btnGfx.setAlpha(0)
    btnText.setAlpha(0)
    this.tweens.add({
      targets: [btnGfx, btnText],
      alpha: 1,
      duration: 600,
      delay: 800,
      ease: 'Power2'
    })

    // Hint text
    const hint = this.add.text(W / 2, btnY + 38, '← → เพื่อเลือกตัวละคร  •  ENTER เพื่อเริ่ม', {
      fontSize: '11px',
      color: '#4a4a6a',
      fontFamily: 'Noto Sans Thai, sans-serif'
    }).setOrigin(0.5)
  }

  _drawPlayBtn(gfx, w, h, hover) {
    const hw = w / 2
    const hh = h / 2

    if (hover) {
      // Outer glow
      gfx.fillStyle(0x8b5cf6, 0.25)
      gfx.fillRoundedRect(-hw - 8, -hh - 8, w + 16, h + 16, 14)
      // Border
      gfx.lineStyle(2, 0xa78bfa, 1)
      gfx.strokeRoundedRect(-hw, -hh, w, h, 10)
      // Fill gradient sim
      gfx.fillStyle(0x5b21b6, 1)
      gfx.fillRoundedRect(-hw, -hh, w, h, 10)
      gfx.fillStyle(0x7c3aed, 0.7)
      gfx.fillRoundedRect(-hw, -hh, w, h / 2, { tl: 10, tr: 10, bl: 0, br: 0 })
    } else {
      gfx.lineStyle(2, 0x7c3aed, 0.8)
      gfx.strokeRoundedRect(-hw, -hh, w, h, 10)
      gfx.fillStyle(0x3b0764, 1)
      gfx.fillRoundedRect(-hw, -hh, w, h, 10)
      gfx.fillStyle(0x5b21b6, 0.5)
      gfx.fillRoundedRect(-hw, -hh, w, h / 2, { tl: 10, tr: 10, bl: 0, br: 0 })
    }
  }

  // ─── Keyboard ────────────────────────────────────────────────────────────────
  _setupKeyboard() {
    const left = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)
    const right = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    const enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    left.on('down', () => {
      const next = (this.selectedIndex - 1 + CHARACTERS.length) % CHARACTERS.length
      this._selectCard(next)
    })

    right.on('down', () => {
      const next = (this.selectedIndex + 1) % CHARACTERS.length
      this._selectCard(next)
    })

    enter.on('down', () => this._startGame())
    space.on('down', () => this._startGame())
  }

  // ─── Start Game ──────────────────────────────────────────────────────────────
  _startGame() {
    const selectedChar = CHARACTERS[this.selectedIndex]

    // Flash effect
    this.cameras.main.flash(300, 139, 92, 246)
    this.cameras.main.fade(500, 0, 0, 0)

    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { character: selectedChar })
    })
  }
}
