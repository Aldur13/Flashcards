import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

// Massive regenerating tank — mirrors orc troll. Heals 8 HP/s.
export class Titan extends Enemy {
  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('titan'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Hulking rectangular frame
    this.bodyGfx.fillRect(-18, -16, 36, 32);
    // Heavy shoulder pads
    this.bodyGfx.fillStyle(0x3a4f1a);
    this.bodyGfx.fillRect(-24, -16, 8, 12);
    this.bodyGfx.fillRect(16, -16, 8, 12);
    // Bony ridge on top
    for (let i = 0; i < 5; i++) {
      this.bodyGfx.fillTriangle(-10 + i * 5, -16, -8 + i * 5, -24, -6 + i * 5, -16);
    }
    // Armor lines
    this.bodyGfx.lineStyle(2, 0x2a3f0a, 0.9);
    this.bodyGfx.strokeRect(-18, -16, 36, 32);
    this.bodyGfx.beginPath();
    this.bodyGfx.moveTo(-18, 0);
    this.bodyGfx.lineTo(18, 0);
    this.bodyGfx.strokePath();
    this.drawHealthBar();
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.isDead) return;
    const regen = this.config.regenPerSecond ?? 0;
    if (regen > 0) {
      this.heal(regen * delta / 1000);
    }
  }
}
