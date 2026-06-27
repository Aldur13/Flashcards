import Phaser from 'phaser';
import { Enemy } from '../Enemy';
import { getEnemyConfig } from '../../data/enemies';
import type { DamageType, Vec2 } from '../../types';

export class Mothership extends Enemy {
  private shieldPct: number = 1;
  private shieldGraphic!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, waypoints: Vec2[]) {
    super(scene, waypoints, getEnemyConfig('mothership'));
  }

  protected drawBody(): void {
    this.bodyGfx.clear();
    const r = 28;
    this.bodyGfx.fillStyle(this.config.tint);

    // Hexagonal hull
    const hexPoints: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      hexPoints.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    this.bodyGfx.fillPoints(hexPoints, true);

    this.bodyGfx.lineStyle(2, 0xff69b4, 0.8);
    this.bodyGfx.strokeCircle(0, 0, r);
    this.bodyGfx.strokeCircle(0, 0, 14);

    this.shieldGraphic = this.scene.add.graphics();
    this.add(this.shieldGraphic);
    this.drawShield();
    this.drawHealthBar();
  }

  private drawShield(): void {
    if (!this.shieldGraphic) return;
    this.shieldGraphic.clear();
    if (this.shieldPct <= 0) return;
    this.shieldGraphic.lineStyle(3, 0x00cfff, this.shieldPct * 0.7);
    this.shieldGraphic.strokeCircle(0, 0, 38);
    this.shieldGraphic.fillStyle(0x00cfff, this.shieldPct * 0.08);
    this.shieldGraphic.fillCircle(0, 0, 38);
  }

  takeDamage(amount: number, damageType: DamageType): void {
    if (this.shieldPct > 0) {
      const absorbed = amount * this.shieldPct * 0.6;
      amount -= absorbed;
      this.shieldPct = Math.max(0, this.shieldPct - absorbed / (this.maxHp * 0.4));
      this.drawShield();
    }
    super.takeDamage(amount, damageType);
  }
}
