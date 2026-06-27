import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

export class Crawler extends Enemy {
  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('crawler'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    this.bodyGfx.fillCircle(0, 0, 10);
    // Leg-like spikes
    this.bodyGfx.lineStyle(1, this.config.tint, 0.8);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      this.bodyGfx.beginPath();
      this.bodyGfx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
      this.bodyGfx.lineTo(Math.cos(angle) * 17, Math.sin(angle) * 17);
      this.bodyGfx.strokePath();
    }
    this.drawHealthBar();
  }
}
