import Phaser from 'phaser';
import { Tower } from '../Tower';
import { getTowerConfig } from '../../data/towers';
import type { Enemy } from '../Enemy';
import { Projectile } from '../Projectile';

export class TeslaTower extends Tower {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getTowerConfig('tesla-coil'));
  }

  protected fireAt(target: Enemy, allEnemies: Enemy[]): void {
    // Tesla fires instantly (no travel projectile) — spawn chain arc directly
    new Projectile(this.scene, this.x, this.y, target, {
      damage: this.config.damage,
      damageType: this.config.damageType,
      speed: 1400, // very fast visual
      color: this.config.projectileColor,
      chainCount: this.config.chainCount,
      allEnemies,
    });
    this.drawDischargeEffect();
  }

  private drawDischargeEffect(): void {
    const g = this.scene.add.graphics({ x: this.x, y: this.y });
    g.lineStyle(2, 0xba55d3, 0.9);
    g.strokeCircle(0, 0, 10);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 150,
      onComplete: () => g.destroy(),
    });
  }
}
