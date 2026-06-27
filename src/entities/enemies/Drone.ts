import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

export class Drone extends Enemy {
  private hoverOffset: number = 0;
  private hoverDir: number = 1;

  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('drone'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Diamond flying body
    this.bodyGfx.fillTriangle(-10, 0, 0, -14, 10, 0);
    this.bodyGfx.fillTriangle(-10, 0, 0, 14, 10, 0);
    // Wing struts
    this.bodyGfx.lineStyle(2, 0x87ceeb, 0.7);
    this.bodyGfx.beginPath();
    this.bodyGfx.moveTo(-10, 0);
    this.bodyGfx.lineTo(-22, -8);
    this.bodyGfx.moveTo(10, 0);
    this.bodyGfx.lineTo(22, -8);
    this.bodyGfx.strokePath();
    this.drawHealthBar();
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    // Subtle hover bob
    this.hoverOffset += this.hoverDir * delta * 0.04;
    if (Math.abs(this.hoverOffset) > 5) this.hoverDir *= -1;
    this.y += this.hoverDir * 0.2;
  }
}
