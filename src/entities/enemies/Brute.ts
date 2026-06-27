import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

export class Brute extends Enemy {
  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('brute'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Heavy armored body — wide rectangle
    this.bodyGfx.fillRect(-14, -12, 28, 24);
    // Armor plating lines
    this.bodyGfx.lineStyle(2, 0x5c3317, 0.9);
    this.bodyGfx.strokeRect(-14, -12, 28, 24);
    this.bodyGfx.beginPath();
    this.bodyGfx.moveTo(-14, 0);
    this.bodyGfx.lineTo(14, 0);
    this.bodyGfx.strokePath();
    // Shoulder spikes
    this.bodyGfx.fillStyle(0x5c3317);
    this.bodyGfx.fillTriangle(-14, -12, -20, -20, -8, -12);
    this.bodyGfx.fillTriangle(14, -12, 20, -20, 8, -12);
    this.drawHealthBar();
  }
}
