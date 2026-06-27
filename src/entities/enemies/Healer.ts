import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

// Support alien that heals nearby allies — mirrors orc shaman.
// Actual healing logic is applied by WaveManager (needs access to all enemies).
export class Healer extends Enemy {
  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('healer'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    // Green pulsing orb body
    this.bodyGfx.fillStyle(this.config.tint, 0.9);
    this.bodyGfx.fillCircle(0, 0, 11);
    // Healing cross symbol
    this.bodyGfx.fillStyle(0x00ff44);
    this.bodyGfx.fillRect(-2, -7, 4, 14);
    this.bodyGfx.fillRect(-7, -2, 14, 4);
    // Outer glow ring
    this.bodyGfx.lineStyle(2, 0x00ff88, 0.6);
    this.bodyGfx.strokeCircle(0, 0, 16);
    this.drawHealthBar();
  }
}
