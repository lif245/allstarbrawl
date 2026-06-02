// ============================================================
//  MenuUI.js – Premium Anime Game Menu Helpers
//  Phaser 3
// ============================================================

import { COLORS, CHARACTERS } from '../config.js';

// ── small utility ─────────────────────────────────────────────
function roundRect(gfx, x, y, w, h, r) {
  if (gfx.fillRoundedRect) gfx.fillRoundedRect(x, y, w, h, r);
  else gfx.fillRect(x, y, w, h);
}

// ─────────────────────────────────────────────────────────────
export class MenuUI {

  // ── 1. Particle / Star Background ──────────────────────────
  /**
   * Creates hundreds of animated floating particles that drift
   * upward (like stars / dust motes) using Phaser tweens.
   *
   * @param  {Phaser.Scene} scene
   * @returns {Phaser.GameObjects.Container} container holding all particles
   */
  static createParticleBackground(scene) {
    const W          = scene.scale.width;
    const H          = scene.scale.height;
    const PARTICLE_N = 180;
    const container  = scene.add.container(0, 0).setDepth(0);

    // Colour palette: cool anime blues / purples / whites
    const COLS = [0xffffff, 0xaabbff, 0xcc99ff, 0x63e2ff, 0xffd700];

    for (let i = 0; i < PARTICLE_N; i++) {
      const gfx   = scene.add.graphics();
      const col   = Phaser.Utils.Array.GetRandom(COLS);
      const r     = Phaser.Math.FloatBetween(0.8, 3.5);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.85);
      const px    = Phaser.Math.Between(0, W);
      const py    = Phaser.Math.Between(0, H);

      gfx.fillStyle(col, alpha);
      gfx.fillCircle(0, 0, r);
      gfx.setPosition(px, py);

      container.add(gfx);

      // Drift upward (wrap around top → respawn at bottom)
      const driftDuration = Phaser.Math.Between(6000, 18000);
      const driftX        = Phaser.Math.FloatBetween(-30, 30);

      scene.tweens.add({
        targets:  gfx,
        y:        py - H - 20,
        x:        px + driftX,
        alpha:    { from: alpha, to: 0 },
        duration: driftDuration,
        delay:    Phaser.Math.Between(0, driftDuration),
        ease:     'Linear',
        repeat:   -1,
        onRepeat: () => {
          gfx.setPosition(Phaser.Math.Between(0, W), H + 10);
          gfx.setAlpha(alpha);
        },
      });

      // Gentle twinkle pulse
      scene.tweens.add({
        targets:    gfx,
        scaleX:     { from: 1, to: Phaser.Math.FloatBetween(1.5, 2.5) },
        scaleY:     { from: 1, to: Phaser.Math.FloatBetween(1.5, 2.5) },
        duration:   Phaser.Math.Between(800, 2400),
        ease:       'Sine.easeInOut',
        yoyo:       true,
        repeat:     -1,
        delay:      Phaser.Math.Between(0, 2000),
      });
    }

    return container;
  }

  // ── 2. Glow Text ──────────────────────────────────────────
  /**
   * Creates a Phaser Text object with a multi-layer glow illusion
   * using stroke + shadow.
   *
   * @param  {Phaser.Scene}  scene
   * @param  {number}        x
   * @param  {number}        y
   * @param  {string}        text
   * @param  {object}        style  – merged with defaults
   * @returns {Phaser.GameObjects.Text}
   */
  static createGlowText(scene, x, y, text, style = {}) {
    const defaultStyle = {
      fontFamily:      "'Orbitron', sans-serif",
      fontSize:        '24px',
      color:           '#ffffff',
      stroke:          '#6c63ff',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color:   '#6c63ff',
        blur:    20,
        fill:    true,
      },
    };

    const merged = Object.assign({}, defaultStyle, style);

    const txt = scene.add.text(x, y, text, merged).setOrigin(0.5);

    // Pulsing glow animation
    scene.tweens.add({
      targets:  txt,
      alpha:    { from: 0.85, to: 1 },
      duration: 1800,
      ease:     'Sine.easeInOut',
      yoyo:     true,
      repeat:   -1,
    });

    return txt;
  }

  // ── 3. Animated Button ────────────────────────────────────
  /**
   * Creates a stylised gradient button with hover glow and click CB.
   *
   * @param  {Phaser.Scene}    scene
   * @param  {number}          x
   * @param  {number}          y
   * @param  {string}          label
   * @param  {function}        callback
   * @param  {object}          opts    – { width, height, depth, color }
   * @returns {{ container, bg, txt }}
   */
  static createButton(scene, x, y, label, callback, opts = {}) {
    const W    = opts.width  || 240;
    const H    = opts.height || 52;
    const col  = opts.color  || COLORS.primary;
    const dep  = opts.depth  || 10;

    // Container so hover/click move everything together
    const container = scene.add.container(x, y).setDepth(dep);
    container.setSize(W, H);

    // ── Outer glow (shown on hover) ──
    const outerGlow = scene.add.graphics();
    outerGlow.fillStyle(col, 0.25);
    roundRect(outerGlow, -W / 2 - 6, -H / 2 - 6, W + 12, H + 12, 14);
    outerGlow.setVisible(false);
    container.add(outerGlow);

    // ── Background panel ──
    const bg = scene.add.graphics();
    bg.fillStyle(0x0d0d22, 0.88);
    roundRect(bg, -W / 2, -H / 2, W, H, 10);
    bg.lineStyle(2, col, 0.9);
    if (bg.strokeRoundedRect) bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 10);
    container.add(bg);

    // ── Shine stripe ──
    const shine = scene.add.graphics();
    shine.fillStyle(0xffffff, 0.07);
    shine.fillRect(-W / 2 + 2, -H / 2 + 2, W - 4, Math.floor(H * 0.4));
    container.add(shine);

    // ── Label text ──
    const txt = scene.add.text(0, 0, label, {
      fontFamily:      "'Orbitron', sans-serif",
      fontSize:        '15px',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(txt);

    // ── Interaction zone (invisible rectangle) ──
    const zone = scene.add.zone(0, 0, W, H)
      .setInteractive({ useHandCursor: true });
    container.add(zone);

    // Hover in
    zone.on('pointerover', () => {
      outerGlow.setVisible(true);
      scene.tweens.add({
        targets:  container,
        scaleX:   1.04,
        scaleY:   1.04,
        duration: 120,
        ease:     'Back.easeOut',
      });
      txt.setColor('#ffdd88');
    });

    // Hover out
    zone.on('pointerout', () => {
      outerGlow.setVisible(false);
      scene.tweens.add({
        targets:  container,
        scaleX:   1,
        scaleY:   1,
        duration: 120,
        ease:     'Quad.easeOut',
      });
      txt.setColor('#ffffff');
    });

    // Click – brief squish then callback
    zone.on('pointerdown', () => {
      scene.tweens.add({
        targets:  container,
        scaleX:   0.94,
        scaleY:   0.94,
        duration: 80,
        ease:     'Quad.easeIn',
        yoyo:     true,
        onComplete: () => callback && callback(),
      });
    });

    return { container, bg, txt, zone };
  }

  // ── 4. Character Card ─────────────────────────────────────
  /**
   * Creates a glassmorphism-style character selection card.
   *
   * @param  {Phaser.Scene}  scene
   * @param  {number}        x           – centre x
   * @param  {number}        y           – centre y
   * @param  {object}        character   – from CHARACTERS array
   * @param  {boolean}       isSelected
   * @param  {function}      onSelect    – called with character on click
   * @returns {{ container, select: fn(bool) }}
   */
  static createCharacterCard(scene, x, y, character, isSelected, onSelect) {
    const CW   = 160;
    const CH   = 210;
    const dep  = 20;
    const col  = character.color || COLORS.primary;

    const container = scene.add.container(x, y).setDepth(dep);
    container.setSize(CW, CH);

    // ── Glass background ──
    const glass = scene.add.graphics();
    glass.fillStyle(0x0d0d22, 0.78);
    roundRect(glass, -CW / 2, -CH / 2, CW, CH, 16);
    container.add(glass);

    // ── Inner lighter rim (glass feel) ──
    const rim = scene.add.graphics();
    rim.fillStyle(0xffffff, 0.04);
    rim.fillRect(-CW / 2 + 2, -CH / 2 + 2, CW - 4, 60);
    container.add(rim);

    // ── Border ──
    const border = scene.add.graphics();
    border.lineStyle(isSelected ? 3 : 1.5, col, isSelected ? 1 : 0.4);
    if (border.strokeRoundedRect) {
      border.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 16);
    }
    container.add(border);

    // ── Glow background (shown when selected/hover) ──
    const glow = scene.add.graphics();
    glow.fillStyle(col, isSelected ? 0.18 : 0);
    roundRect(glow, -CW / 2 - 4, -CH / 2 - 4, CW + 8, CH + 8, 18);
    container.add(glow);

    // ── Character icon (big emoji) ──
    const icon = scene.add.text(0, -CH / 2 + 50, character.icon, {
      fontSize: '52px',
    }).setOrigin(0.5);
    container.add(icon);

    // ── Name ──
    const nameTxt = scene.add.text(0, -CH / 2 + 108, character.name, {
      fontFamily:      "'Orbitron', sans-serif",
      fontSize:        '14px',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(nameTxt);

    // ── Style sub-label ──
    const styleTxt = scene.add.text(0, -CH / 2 + 128, character.style, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '9px',
      color:      '#aaaacc',
    }).setOrigin(0.5);
    container.add(styleTxt);

    // ── Skill ──
    const skillTxt = scene.add.text(0, -CH / 2 + 150, `✨ ${character.skill}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '9px',
      color:      Phaser.Display.Color.IntegerToColor(col).rgba,
    }).setOrigin(0.5);
    container.add(skillTxt);

    // ── HP bar (mini) ──
    const hpBg = scene.add.graphics();
    hpBg.fillStyle(0x111122, 1);
    roundRect(hpBg, -CW / 2 + 16, -CH / 2 + 170, CW - 32, 8, 4);
    container.add(hpBg);

    const hpNorm = (character.hp || 100) / 200; // normalise to 200 = max
    const hpFill = scene.add.graphics();
    hpFill.fillStyle(COLORS.hpFull, 1);
    roundRect(hpFill, -CW / 2 + 18, -CH / 2 + 172, Math.floor((CW - 36) * hpNorm), 4, 3);
    container.add(hpFill);

    // HP label
    const hpLbl = scene.add.text(-CW / 2 + 16, -CH / 2 + 162, `❤️ ${character.hp}`, {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '8px',
      color:      '#88ffaa',
    });
    container.add(hpLbl);

    // ── SELECTED badge ──
    const badge = scene.add.text(0, CH / 2 - 14, '● SELECTED', {
      fontFamily: "'Orbitron', sans-serif",
      fontSize:   '9px',
      color:      `#${col.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setAlpha(isSelected ? 1 : 0);
    container.add(badge);

    // ── Hover / idle float animation ──
    const floatTween = scene.tweens.add({
      targets:   icon,
      y:         icon.y - 6,
      duration:  1600 + Math.random() * 400,
      ease:      'Sine.easeInOut',
      yoyo:      true,
      repeat:    -1,
      delay:     Math.random() * 800,
    });

    // ── Interaction ──
    const zone = scene.add.zone(0, 0, CW, CH).setInteractive({ useHandCursor: true });
    container.add(zone);

    zone.on('pointerover', () => {
      glow.clear();
      glow.fillStyle(col, 0.22);
      roundRect(glow, -CW / 2 - 4, -CH / 2 - 4, CW + 8, CH + 8, 18);
      border.clear();
      border.lineStyle(2.5, col, 0.9);
      if (border.strokeRoundedRect) border.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 16);

      scene.tweens.add({
        targets:   container,
        scaleX:    1.05,
        scaleY:    1.05,
        duration:  150,
        ease:      'Back.easeOut',
      });
    });

    zone.on('pointerout', () => {
      glow.clear();
      if (container._isSelected) {
        glow.fillStyle(col, 0.18);
        roundRect(glow, -CW / 2 - 4, -CH / 2 - 4, CW + 8, CH + 8, 18);
      }
      border.clear();
      border.lineStyle(container._isSelected ? 3 : 1.5, col, container._isSelected ? 1 : 0.4);
      if (border.strokeRoundedRect) border.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 16);

      scene.tweens.add({
        targets:   container,
        scaleX:    1,
        scaleY:    1,
        duration:  150,
        ease:      'Quad.easeOut',
      });
    });

    zone.on('pointerdown', () => {
      scene.tweens.add({
        targets:  container,
        scaleX:   0.95,
        scaleY:   0.95,
        duration: 80,
        ease:     'Quad.easeIn',
        yoyo:     true,
        onComplete: () => onSelect && onSelect(character),
      });
    });

    // ── Public helper: update selected state ──
    container._isSelected = isSelected;
    const selectFn = (selected) => {
      container._isSelected = selected;
      badge.setAlpha(selected ? 1 : 0);
      glow.clear();
      if (selected) {
        glow.fillStyle(col, 0.18);
        roundRect(glow, -CW / 2 - 4, -CH / 2 - 4, CW + 8, CH + 8, 18);
      }
      border.clear();
      border.lineStyle(selected ? 3 : 1.5, col, selected ? 1 : 0.4);
      if (border.strokeRoundedRect) border.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 16);
    };

    return { container, select: selectFn };
  }

  // ── 5. Title Logo Text ──────────────────────────────────────
  /**
   * Renders the game title with animated gradient shimmer.
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @returns {Phaser.GameObjects.Text}
   */
  static createTitleLogo(scene, x, y) {
    const title = scene.add.text(x, y, 'ALL STAR\nBATTLE', {
      fontFamily:      "'Orbitron', sans-serif",
      fontSize:        '64px',
      color:           '#ffffff',
      stroke:          '#6c63ff',
      strokeThickness: 8,
      align:           'center',
      lineSpacing:     -4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color:   '#ff63b8',
        blur:    30,
        fill:    true,
      },
    }).setOrigin(0.5).setDepth(5);

    // Pulsing scale breathe
    scene.tweens.add({
      targets:  title,
      scaleX:   1.03,
      scaleY:   1.03,
      duration: 2200,
      ease:     'Sine.easeInOut',
      yoyo:     true,
      repeat:   -1,
    });

    return title;
  }

  // ── 6. Divider Line ──────────────────────────────────────
  /**
   * Draws a glowing horizontal divider.
   * @param {Phaser.Scene} scene
   * @param {number} x   left edge
   * @param {number} y
   * @param {number} w   width
   * @param {number} col hex color
   * @returns {Phaser.GameObjects.Graphics}
   */
  static createDivider(scene, x, y, w, col = COLORS.primary) {
    const gfx = scene.add.graphics().setDepth(5);
    // Glow
    gfx.fillStyle(col, 0.15);
    gfx.fillRect(x, y - 3, w, 8);
    // Core line
    gfx.fillStyle(col, 0.9);
    gfx.fillRect(x, y, w, 2);
    return gfx;
  }

  // ── 7. Screen Flash / Transition ─────────────────────────
  /**
   * Flashes the screen white then fades to alpha 0.
   * @param {Phaser.Scene} scene
   * @param {function}     onComplete
   */
  static flashTransition(scene, onComplete) {
    const W    = scene.scale.width;
    const H    = scene.scale.height;
    const rect = scene.add.graphics().setDepth(999);
    rect.fillStyle(0xffffff, 1);
    rect.fillRect(0, 0, W, H);
    rect.setAlpha(0);
    rect.setScrollFactor(0);

    scene.tweens.add({
      targets:  rect,
      alpha:    { from: 0, to: 1 },
      duration: 160,
      ease:     'Quad.easeIn',
      yoyo:     true,
      onComplete: () => {
        rect.destroy();
        onComplete && onComplete();
      },
    });
  }
}
