import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

// Fast frenzied alien — mirrors orc berserker. Angular, aggressive silhouette.
export class Berserker extends Enemy {
  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('berserker'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Lean, angular body — forward-leaning wedge
    this.bodyGfx.fillTriangle(-10, 12, 0, -14, 10, 12);
    // Side blades
    this.bodyGfx.fillStyle(0xff1100);
    this.bodyGfx.fillTriangle(-14, 8, -8, 0, -6, 12);
    this.bodyGfx.fillTriangle(14, 8, 8, 0, 6, 12);
    // Claw tips
    this.bodyGfx.fillStyle(0xffffff);
    this.bodyGfx.fillCircle(-14, 6, 2);
    this.bodyGfx.fillCircle(14, 6, 2);
    this.drawHealthBar();
  }
}
