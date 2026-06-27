import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { Vec2 } from '../../types';

export class Psychic extends Enemy {
  private pulseGraphic!: Phaser.GameObjects.Graphics;
  private pulseTimer: number = 0;

  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('psychic'));
  }

  protected drawBody(): void {
    this.pulseGraphic = this.scene.add.graphics();
    this.add(this.pulseGraphic);

    this.bodyGfx.clear();
    this.bodyGfx.fillStyle(this.config.tint);
    // Floating orb
    this.bodyGfx.fillCircle(0, 0, 12);
    // Inner core
    this.bodyGfx.fillStyle(0xffffff, 0.4);
    this.bodyGfx.fillCircle(0, 0, 5);
    // Tendrils
    this.bodyGfx.lineStyle(1, this.config.tint, 0.6);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      this.bodyGfx.beginPath();
      this.bodyGfx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
      this.bodyGfx.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
      this.bodyGfx.strokePath();
    }
    this.drawHealthBar();
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.pulseTimer += delta;
    if (this.pulseTimer > 600) {
      this.pulseTimer = 0;
      this.drawDebuffPulse();
    }
  }

  private drawDebuffPulse(): void {
    if (!this.pulseGraphic || !this.scene) return;
    this.pulseGraphic.clear();
    const r = this.config.debuffRadius ?? 140;
    this.pulseGraphic.lineStyle(1, 0xda70d6, 0.4);
    this.pulseGraphic.strokeCircle(0, 0, r);
  }
}
