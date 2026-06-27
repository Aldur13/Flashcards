import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { DamageType, Vec2 } from '../../types';

// Brief invulnerability phases — mirrors orc assassin / shadow.
export class Infiltrator extends Enemy {
  private isPhased: boolean = false;
  private phaseTimer: number = 0;

  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('infiltrator'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Lithe, crouched humanoid shape
    this.bodyGfx.fillRect(-8, -12, 16, 22);
    // Cloak edges
    this.bodyGfx.fillStyle(0x999999);
    this.bodyGfx.fillTriangle(-8, 10, -16, 14, -8, -2);
    this.bodyGfx.fillTriangle(8, 10, 16, 14, 8, -2);
    // Visor glow
    this.bodyGfx.fillStyle(0x00ffee);
    this.bodyGfx.fillRect(-5, -8, 10, 3);
    this.drawHealthBar();
  }

  takeDamage(amount: number, damageType: DamageType): void {
    if (this.isPhased) return; // brief invulnerability window
    super.takeDamage(amount, damageType);
  }

  update(time: number, delta: number): void {
    const { phaseInterval, phaseDuration } = this.config;

    if (phaseInterval && phaseDuration) {
      this.phaseTimer += delta;
      if (!this.isPhased && this.phaseTimer >= phaseInterval) {
        this.isPhased = true;
        this.phaseTimer = 0;
        this.setAlpha(0.25); // ghost-like during phase
      } else if (this.isPhased && this.phaseTimer >= phaseDuration) {
        this.isPhased = false;
        this.phaseTimer = 0;
        this.setAlpha(1);
      }
    }

    super.update(time, delta);
  }
}
