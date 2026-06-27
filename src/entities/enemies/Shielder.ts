import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { DamageType, Vec2 } from '../../types';

// Cyclic phase shield — mirrors orc shieldbearer. Energy bypasses shield.
export class Shielder extends Enemy {
  private shieldUp: boolean = true;
  private shieldTimer: number = 0;
  private shieldGfx!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('shielder'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Armored torso
    this.bodyGfx.fillRect(-12, -13, 24, 26);
    // Shield panel lines
    this.bodyGfx.lineStyle(1, 0x005577, 0.9);
    this.bodyGfx.strokeRect(-12, -13, 24, 26);
    this.bodyGfx.beginPath();
    this.bodyGfx.moveTo(-12, 0);
    this.bodyGfx.lineTo(12, 0);
    this.bodyGfx.strokePath();

    // Shield orb graphic (cyclic)
    this.shieldGfx = this.scene.add.graphics();
    this.add(this.shieldGfx);
    this.updateShieldVisual();
    this.drawHealthBar();
  }

  private updateShieldVisual(): void {
    if (!this.shieldGfx) return;
    this.shieldGfx.clear();
    if (!this.shieldUp) return;
    this.shieldGfx.lineStyle(3, 0x00aaff, 0.85);
    this.shieldGfx.strokeCircle(0, 0, 22);
    this.shieldGfx.fillStyle(0x00aaff, 0.1);
    this.shieldGfx.fillCircle(0, 0, 22);
  }

  takeDamage(amount: number, damageType: DamageType): void {
    if (this.shieldUp && damageType !== 'energy') {
      // Shield absorbs most damage; energy bypasses entirely
      const reduction = this.config.shieldDamageReduction ?? 0.15;
      amount *= reduction;
    }
    super.takeDamage(amount, damageType);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.isDead) return;

    const { shieldCycleDuration, shieldDownDuration } = this.config;
    if (!shieldCycleDuration || !shieldDownDuration) return;

    this.shieldTimer += delta;
    if (this.shieldUp && this.shieldTimer >= shieldCycleDuration) {
      this.shieldUp = false;
      this.shieldTimer = 0;
      this.updateShieldVisual();
    } else if (!this.shieldUp && this.shieldTimer >= shieldDownDuration) {
      this.shieldUp = true;
      this.shieldTimer = 0;
      this.updateShieldVisual();
    }
  }
}
