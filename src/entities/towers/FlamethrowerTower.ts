import Phaser from 'phaser';
import { Tower } from '../Tower';
import { getTowerConfig } from '../../data/towers';
import type { TowerType } from '../../types';
import type { Enemy } from '../Enemy';

// Fires a cone of fire hitting all enemies in range simultaneously.
export class FlamethrowerTower extends Tower {
  constructor(scene: Phaser.Scene, x: number, y: number, type: TowerType = 'flamethrower') {
    super(scene, x, y, getTowerConfig(type));
  }

  protected fireAt(target: Enemy, allEnemies: Enemy[]): void {
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const halfAngle = this.config.flameAngle ?? Math.PI / 4;
    const range = this.effectiveRange;
    const r2 = range * range;

    for (const enemy of allEnemies) {
      if (enemy.isDead || enemy.hasReachedEnd) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      if (dx * dx + dy * dy > r2) continue;
      const ea = Math.atan2(dy, dx);
      let diff = ea - angle;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      if (Math.abs(diff) <= halfAngle) {
        enemy.takeDamage(this.config.damage, this.config.damageType);
      }
    }

    // Brief triangular flame cone visual
    const g = this.scene.add.graphics({ x: this.x, y: this.y });
    g.fillStyle(this.config.projectileColor, 0.5);
    const x1 = Math.cos(angle - halfAngle) * range;
    const y1 = Math.sin(angle - halfAngle) * range;
    const x2 = Math.cos(angle + halfAngle) * range;
    const y2 = Math.sin(angle + halfAngle) * range;
    g.fillTriangle(0, 0, x1, y1, x2, y2);
    this.scene.time.delayedCall(120, () => g.destroy());
  }
}
