// ============================================================
//  HUD.js – In-game Heads-Up Display (Anime Premium Style)
//  Phaser 3
// ============================================================

import { COLORS } from '../config.js';

// ── helpers ──────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Draw a rounded rectangle on a Graphics object.
 * Phaser 3.60+ has fillRoundedRect; this wrapper also works on older builds.
 */
function roundRect(gfx, x, y, w, h, r) {
  if (gfx.fillRoundedRect) {
    gfx.fillRoundedRect(x, y, w, h, r);
  } else {
    gfx.fillRect(x, y, w, h); // fallback
  }
}

// ── HUD class ────────────────────────────────────────────────
export class HUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {object}       player    – must expose player.hp / player.maxHP
   * @param {object}       xpSystem  – must expose xpSystem.xp / xpSystem.level / xpSystem.nextLevelXP
   */
  constructor(scene, player, xpSystem) {
    this.scene     = scene;
    this.player    = player;
    this.xpSystem  = xpSystem;
    this.score     = 0;
    this.killCount = 0;

    // Internal state for smooth tween targets
    this._hpPct  = 1;   // 0–1
    this._xpPct  = 0;   // 0–1

    // Container depth so HUD always renders on top
    this._depth = 100;

    this.createHPBar();
    this.createXPBar();
    this.createScoreDisplay();
    this.createSkillSlots();
    this.createKillCounter();
  }

  // ── HP Bar ──────────────────────────────────────────────────
  createHPBar() {
    const scene = this.scene;
    const CAM   = scene.cameras.main;
    const W     = CAM.width;
    const H     = CAM.height;

    const BAR_W = 300;
    const BAR_H = 22;
    const PAD   = 16;
    const BX    = PAD;
    const BY    = H - PAD - 60;

    // ── dark panel behind the whole HP area ──
    this._hpPanel = scene.add.graphics();
    this._hpPanel.fillStyle(COLORS.panelBg, 0.75);
    roundRect(this._hpPanel, BX - 8, BY - 26, BAR_W + 16, BAR_H + 36, 10);
    this._hpPanel.setScrollFactor(0).setDepth(this._depth);

    // ── label ──
    this._hpLabel = scene.add.text(BX, BY - 22, '❤️  HP', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '11px',
      color:      '#ff6688',
      stroke:     '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // ── HP value text ──
    this._hpText = scene.add.text(BX + BAR_W - 2, BY - 22, '100 / 100', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '10px',
      color:      '#ffffff',
      stroke:     '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(this._depth + 1);

    // ── background track ──
    this._hpBg = scene.add.graphics();
    this._hpBg.fillStyle(0x111122, 1);
    roundRect(this._hpBg, BX, BY, BAR_W, BAR_H, 6);
    this._hpBg.lineStyle(1, 0x334466, 1);
    if (this._hpBg.strokeRoundedRect) {
      this._hpBg.strokeRoundedRect(BX, BY, BAR_W, BAR_H, 6);
    }
    this._hpBg.setScrollFactor(0).setDepth(this._depth + 1);

    // ── fill bar (re-drawn every frame) ──
    this._hpFill = scene.add.graphics();
    this._hpFill.setScrollFactor(0).setDepth(this._depth + 2);

    // ── glow layer (drawn under fill) ──
    this._hpGlow = scene.add.graphics();
    this._hpGlow.setScrollFactor(0).setDepth(this._depth + 1);

    // Store geometry for reuse
    this._hpBarX = BX;
    this._hpBarY = BY;
    this._hpBarW = BAR_W;
    this._hpBarH = BAR_H;

    this._drawHPFill(1);
  }

  _drawHPFill(pct) {
    const { _hpFill: fill, _hpGlow: glow } = this;
    const { _hpBarX: BX, _hpBarY: BY, _hpBarW: BAR_W, _hpBarH: BAR_H } = this;

    const clamp = Math.max(0, Math.min(1, pct));
    const fillW = Math.max(0, (BAR_W - 4) * clamp);
    const radius = 5;

    // Pick color based on HP percentage
    let col;
    if (clamp > 0.5)       col = COLORS.hpFull;
    else if (clamp > 0.25) col = COLORS.hpMid;
    else                   col = COLORS.hpLow;

    // Glow
    glow.clear();
    if (clamp > 0) {
      glow.fillStyle(col, 0.18);
      roundRect(glow, BX - 2, BY - 2, fillW + 8, BAR_H + 4, radius + 2);
    }

    // Fill
    fill.clear();
    if (clamp > 0) {
      fill.fillStyle(col, 1);
      roundRect(fill, BX + 2, BY + 2, fillW, BAR_H - 4, radius);
      // Shine strip
      fill.fillStyle(0xffffff, 0.15);
      fill.fillRect(BX + 2, BY + 2, fillW, Math.floor((BAR_H - 4) * 0.4));
    }
  }

  // ── XP Bar ──────────────────────────────────────────────────
  createXPBar() {
    const scene = this.scene;
    const CAM   = scene.cameras.main;
    const W     = CAM.width;
    const H     = CAM.height;

    const BAR_W = 300;
    const BAR_H = 16;
    const PAD   = 16;
    const BX    = PAD;
    const BY    = H - PAD - 92;   // above HP bar

    // Panel
    this._xpPanel = scene.add.graphics();
    this._xpPanel.fillStyle(COLORS.panelBg, 0.75);
    roundRect(this._xpPanel, BX - 8, BY - 22, BAR_W + 16, BAR_H + 32, 10);
    this._xpPanel.setScrollFactor(0).setDepth(this._depth);

    // Label
    this._xpLabel = scene.add.text(BX, BY - 18, '⭐  Level 1', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '11px',
      color:      '#ffd700',
      stroke:     '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(this._depth + 1);

    // XP numbers
    this._xpText = scene.add.text(BX + BAR_W - 2, BY - 18, 'XP: 0 / 100', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '10px',
      color:      '#ffee99',
      stroke:     '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(this._depth + 1);

    // Background track
    this._xpBg = scene.add.graphics();
    this._xpBg.fillStyle(0x111122, 1);
    roundRect(this._xpBg, BX, BY, BAR_W, BAR_H, 5);
    this._xpBg.setScrollFactor(0).setDepth(this._depth + 1);

    // Glow + fill
    this._xpGlow = scene.add.graphics();
    this._xpGlow.setScrollFactor(0).setDepth(this._depth + 1);

    this._xpFill = scene.add.graphics();
    this._xpFill.setScrollFactor(0).setDepth(this._depth + 2);

    this._xpBarX = BX;
    this._xpBarY = BY;
    this._xpBarW = BAR_W;
    this._xpBarH = BAR_H;

    this._drawXPFill(0);
  }

  _drawXPFill(pct) {
    const { _xpFill: fill, _xpGlow: glow } = this;
    const { _xpBarX: BX, _xpBarY: BY, _xpBarW: BAR_W, _xpBarH: BAR_H } = this;

    const clamp = Math.max(0, Math.min(1, pct));
    const fillW = Math.max(0, (BAR_W - 4) * clamp);
    const radius = 4;

    glow.clear();
    if (clamp > 0) {
      glow.fillStyle(COLORS.xpFill, 0.22);
      roundRect(glow, BX - 2, BY - 2, fillW + 8, BAR_H + 4, radius + 2);
    }

    fill.clear();
    if (clamp > 0) {
      fill.fillStyle(COLORS.xpFill, 1);
      roundRect(fill, BX + 2, BY + 2, fillW, BAR_H - 4, radius);
      // Shine
      fill.fillStyle(0xffffff, 0.2);
      fill.fillRect(BX + 2, BY + 2, fillW, Math.floor((BAR_H - 4) * 0.45));
    }
  }

  // ── Score / Kills (top-left) ──────────────────────────────
  createScoreDisplay() {
    const scene = this.scene;
    const PAD   = 16;

    // Background panel
    this._scorePanel = scene.add.graphics();
    this._scorePanel.fillStyle(COLORS.panelBg, 0.72);
    roundRect(this._scorePanel, PAD - 8, PAD - 6, 200, 60, 10);
    this._scorePanel.setScrollFactor(0).setDepth(this._depth);

    this._scoreTxt = scene.add.text(PAD, PAD, 'SCORE\n0', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '13px',
      color:      '#ffffff',
      stroke:     '#6c63ff',
      strokeThickness: 3,
      lineSpacing: 2,
    }).setScrollFactor(0).setDepth(this._depth + 1);

    this._killsTxt = scene.add.text(PAD + 100, PAD, 'KILLS\n0', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '13px',
      color:      '#ff63b8',
      stroke:     '#000000',
      strokeThickness: 3,
      lineSpacing: 2,
    }).setScrollFactor(0).setDepth(this._depth + 1);
  }

  // ── Skill Slots (bottom-center) ───────────────────────────
  createSkillSlots() {
    const scene = this.scene;
    const CAM   = scene.cameras.main;
    const W     = CAM.width;
    const H     = CAM.height;

    const KEYS   = ['Z', 'X', 'C', 'V'];
    const ICONS  = ['⚡', '🔥', '❄️', '✨'];
    const SLOT_S = 58;   // slot size
    const GAP    = 8;
    const TOTAL  = KEYS.length * SLOT_S + (KEYS.length - 1) * GAP;
    const SX     = Math.floor((W - TOTAL) / 2);
    const SY     = H - SLOT_S - 18;

    this._skillSlots = [];

    KEYS.forEach((key, i) => {
      const x = SX + i * (SLOT_S + GAP);
      const y = SY;

      // Outer glow panel
      const glow = scene.add.graphics();
      glow.fillStyle(COLORS.primary, 0.18);
      roundRect(glow, x - 3, y - 3, SLOT_S + 6, SLOT_S + 6, 12);
      glow.setScrollFactor(0).setDepth(this._depth);

      // Background
      const bg = scene.add.graphics();
      bg.fillStyle(0x0d0d22, 0.92);
      roundRect(bg, x, y, SLOT_S, SLOT_S, 10);
      bg.lineStyle(2, COLORS.primary, 0.7);
      if (bg.strokeRoundedRect) bg.strokeRoundedRect(x, y, SLOT_S, SLOT_S, 10);
      bg.setScrollFactor(0).setDepth(this._depth + 1);

      // Icon (emoji)
      const icon = scene.add.text(x + SLOT_S / 2, y + SLOT_S / 2 - 8, ICONS[i], {
        fontSize: '22px',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this._depth + 2);

      // Key label
      const label = scene.add.text(x + SLOT_S / 2, y + SLOT_S - 12, key, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize:   '10px',
        color:      '#aaaacc',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(this._depth + 2);

      // Cooldown overlay (hidden by default)
      const cdOverlay = scene.add.graphics();
      cdOverlay.setScrollFactor(0).setDepth(this._depth + 3).setVisible(false);

      this._skillSlots.push({ bg, glow, icon, label, cdOverlay, x, y, size: SLOT_S });
    });
  }

  // ── Kill Counter (top-right) ──────────────────────────────
  createKillCounter() {
    const scene = this.scene;
    const CAM   = scene.cameras.main;
    const W     = CAM.width;
    const PAD   = 16;

    this._killPanel = scene.add.graphics();
    this._killPanel.fillStyle(COLORS.panelBg, 0.72);
    roundRect(this._killPanel, W - 140 - PAD, PAD - 6, 140, 42, 10);
    this._killPanel.setScrollFactor(0).setDepth(this._depth);

    this._killCounterTxt = scene.add.text(W - PAD - 8, PAD + 2, '💀  0 Kills', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '13px',
      color:      '#ff63b8',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(this._depth + 1);
  }

  // ── Public update (call from scene's update()) ─────────────
  update(hp, maxHP, xp, level, nextLevelXP, score, kills) {
    this.updateHPBar(hp, maxHP);
    this.updateXPBar(xp, level, nextLevelXP);
    this.updateScore(score, kills);
  }

  updateHPBar(hp, maxHP) {
    const pct = maxHP > 0 ? hp / maxHP : 0;

    // Tween the percentage smoothly
    this.scene.tweens.add({
      targets:    this,
      _hpPct:     pct,
      duration:   220,
      ease:       'Sine.easeOut',
      onUpdate:   () => this._drawHPFill(this._hpPct),
    });

    this._hpText.setText(`${Math.ceil(hp)} / ${maxHP}`);
  }

  updateXPBar(xp, level, nextLevelXP) {
    const pct = nextLevelXP > 0 ? xp / nextLevelXP : 0;

    this.scene.tweens.add({
      targets:    this,
      _xpPct:     pct,
      duration:   300,
      ease:       'Sine.easeOut',
      onUpdate:   () => this._drawXPFill(this._xpPct),
    });

    this._xpLabel.setText(`⭐  Level ${level}`);
    this._xpText.setText(`XP: ${xp} / ${nextLevelXP}`);
  }

  updateScore(score, kills) {
    this.score     = score;
    this.killCount = kills;
    this._scoreTxt.setText(`SCORE\n${score}`);
    this._killsTxt.setText(`KILLS\n${kills}`);
    this._killCounterTxt.setText(`💀  ${kills} Kill${kills !== 1 ? 's' : ''}`);
  }

  // ── Add Kill (with popup) ──────────────────────────────────
  addKill() {
    this.killCount++;
    this.score += 10;
    this.updateScore(this.score, this.killCount);
    this._showKillPopup();
  }

  _showKillPopup() {
    const scene = this.scene;
    const CAM   = scene.cameras.main;

    const txt = scene.add.text(
      CAM.width / 2, CAM.height / 2 - 80,
      '💥  +KILL!',
      {
        fontFamily: "'Orbitron', sans-serif",
        fontSize:   '28px',
        color:      '#ff63b8',
        stroke:     '#000000',
        strokeThickness: 5,
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this._depth + 10)
      .setAlpha(0);

    scene.tweens.add({
      targets:  txt,
      alpha:    { from: 0, to: 1 },
      y:        txt.y - 30,
      duration: 200,
      ease:     'Back.easeOut',
      yoyo:     false,
      onComplete: () => {
        scene.tweens.add({
          targets:  txt,
          alpha:    0,
          y:        txt.y - 20,
          delay:    500,
          duration: 350,
          ease:     'Quad.easeIn',
          onComplete: () => txt.destroy(),
        });
      },
    });
  }

  // ── Skill slot cooldown overlay helper ─────────────────────
  /**
   * Show a cooldown overlay on the given slot index (0-3).
   * @param {number} slotIndex
   * @param {number} durationMs
   */
  startCooldown(slotIndex, durationMs) {
    const slot = this._skillSlots[slotIndex];
    if (!slot) return;

    const { cdOverlay, x, y, size } = slot;
    let elapsed = 0;
    const interval = 30; // ms

    cdOverlay.setVisible(true);

    const timer = this.scene.time.addEvent({
      delay:    interval,
      repeat:   Math.floor(durationMs / interval),
      callback: () => {
        elapsed += interval;
        const pct = Math.min(1, elapsed / durationMs);

        cdOverlay.clear();
        cdOverlay.fillStyle(0x000000, 0.55);
        roundRect(cdOverlay, x, y, size, Math.floor(size * (1 - pct)), 10);

        if (pct >= 1) {
          cdOverlay.setVisible(false);
          timer.remove();
        }
      },
    });
  }

  // ── Cleanup ───────────────────────────────────────────────
  destroy() {
    const items = [
      this._hpPanel, this._hpLabel, this._hpText, this._hpBg, this._hpFill, this._hpGlow,
      this._xpPanel, this._xpLabel, this._xpText, this._xpBg, this._xpFill, this._xpGlow,
      this._scorePanel, this._scoreTxt, this._killsTxt,
      this._killPanel, this._killCounterTxt,
    ];
    items.forEach(o => o && o.destroy());
    this._skillSlots.forEach(s => {
      [s.bg, s.glow, s.icon, s.label, s.cdOverlay].forEach(o => o && o.destroy());
    });
  }
}
