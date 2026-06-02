// ============================================================
//  InputSystem – Keyboard + Mouse Input Handler
// ============================================================

export class InputSystem {
  constructor(scene) {
    this.scene = scene
    this.keys = scene.input.keyboard.addKeys({
      up:     Phaser.Input.Keyboard.KeyCodes.W,
      down:   Phaser.Input.Keyboard.KeyCodes.S,
      left:   Phaser.Input.Keyboard.KeyCodes.A,
      right:  Phaser.Input.Keyboard.KeyCodes.D,
      skill1: Phaser.Input.Keyboard.KeyCodes.Z,
      skill2: Phaser.Input.Keyboard.KeyCodes.X,
      skill3: Phaser.Input.Keyboard.KeyCodes.C,
      skill4: Phaser.Input.Keyboard.KeyCodes.V,
    })
    this.pointer = scene.input.activePointer
    this.shootPressed = false

    scene.input.on('pointerdown', () => { this.shootPressed = true })
    scene.input.on('pointerup',   () => { this.shootPressed = false })
  }

  /**
   * Returns normalised movement vector {x, y} in range [-1, 1].
   */
  getMovement() {
    const vel = { x: 0, y: 0 }
    if (this.keys.left.isDown)  vel.x -= 1
    if (this.keys.right.isDown) vel.x += 1
    if (this.keys.up.isDown)    vel.y -= 1
    if (this.keys.down.isDown)  vel.y += 1

    // Normalise diagonal movement so speed stays constant
    if (vel.x !== 0 && vel.y !== 0) {
      vel.x *= 0.707
      vel.y *= 0.707
    }
    return vel
  }

  /**
   * Returns the angle (radians) from the player world position to the mouse cursor.
   */
  getAimAngle(playerWorldX, playerWorldY) {
    const worldPoint = this.scene.cameras.main.getWorldPoint(
      this.pointer.x,
      this.pointer.y
    )
    return Math.atan2(worldPoint.y - playerWorldY, worldPoint.x - playerWorldX)
  }

  /**
   * Returns true while the primary mouse button is held down.
   */
  isShooting() {
    return this.scene.input.activePointer.isDown
  }

  /**
   * Returns true if the given skill key was just pressed this frame.
   * @param {number} index 1-4
   */
  isSkillPressed(index) {
    const keyMap = {
      1: this.keys.skill1,
      2: this.keys.skill2,
      3: this.keys.skill3,
      4: this.keys.skill4,
    }
    const key = keyMap[index]
    return key ? Phaser.Input.Keyboard.JustDown(key) : false
  }
}
