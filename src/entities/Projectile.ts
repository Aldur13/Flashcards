import Phaser from 'phaser';
import type { DamageType } from '../types';
import type { Enemy } from './Enemy';

export interface ProjectileConfig {
  damage: number;
  damageType: DamageType;
  speed: number;
  color: number;
  splashRadius?: number;
  chainCount?: number;
  slowOnHit?: number;       // speed multiplier applied on impact (e.g. 0.4 = enemy slowed to 40% speed)
  slowHitDuration?: number; // ms the hit-slow lasts
  allEnemies: Enemy[];
}

export class Projectile extends Phaser.GameObjects.Graphics {
  private target: Enemy;
  private cfg: ProjectileConfig;
  isDone: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, target: Enemy, cfg: ProjectileConfig) {
    super(scene, { x, y });
    this.target = target;
    this.cfg = cfg;

    scene.add.existing(this);
    this.drawSelf();
  }

  private drawSelf(): void {
    this.clear();
    this.fillStyle(this.cfg.color);
    this.fillCircle(0, 0, 4);
  }

  update(_time: number, delta: number): void {
    if (this.isDone || this.target.isDead || this.target.hasReachedEnd) {
      this.isDone = true;
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = this.cfg.speed * (delta / 1000);

    if (dist <= move + 2) {
      this.onImpact();
    } else {
      const nx = dx / dist;
      const ny = dy / dist;
      this.x += nx * move;
      this.y += ny * move;
    }
  }

  private onImpact(): void {
    if (this.isDone) return;
    this.isDone = true;

    if (this.cfg.splashRadius && this.cfg.splashRadius > 0) {
      this.applySplash();
    } else if (this.cfg.chainCount && this.cfg.chainCount > 0) {
      this.applyChain();
    } else {
      this.target.takeDamage(this.cfg.damage, this.cfg.damageType);
      if (this.cfg.slowOnHit !== undefined && this.cfg.slowHitDuration) {
        this.target.applyHitSlow(this.cfg.slowOnHit, this.cfg.slowHitDuration);
      }
    }

    this.spawnImpactEffect();
    this.destroy();
  }

  private applySplash(): void {
    const r = this.cfg.splashRadius!;
    for (const enemy of this.cfg.allEnemies) {
      if (enemy.isDead || enemy.hasReachedEnd) continue;
      const dx = enemy.x - this.target.x;
      const dy = enemy.y - this.target.y;
      if (dx * dx + dy * dy <= r * r) {
        enemy.takeDamage(this.cfg.damage, this.cfg.damageType);
        if (this.cfg.slowOnHit !== undefined && this.cfg.slowHitDuration) {
          enemy.applyHitSlow(this.cfg.slowOnHit, this.cfg.slowHitDuration);
        }
      }
    }
  }

  private applyChain(): void {
    const targets: Enemy[] = [this.target];
    this.target.takeDamage(this.cfg.damage, this.cfg.damageType);

    const chainRange = 120;
    let lastHit = this.target;

    for (let i = 1; i < (this.cfg.chainCount ?? 0); i++) {
      let nearest: Enemy | null = null;
      let nearestDist = Infinity;

      for (const enemy of this.cfg.allEnemies) {
        if (enemy.isDead || enemy.hasReachedEnd || targets.includes(enemy)) continue;
        const dx = enemy.x - lastHit.x;
        const dy = enemy.y - lastHit.y;
        const d = dx * dx + dy * dy;
        if (d < nearestDist && d <= chainRange * chainRange) {
          nearestDist = d;
          nearest = enemy;
        }
      }

      if (!nearest) break;
      this.drawChainArc(lastHit.x, lastHit.y, nearest.x, nearest.y);
      nearest.takeDamage(this.cfg.damage * 0.7, this.cfg.damageType);
      targets.push(nearest);
      lastHit = nearest;
    }
  }

  private drawChainArc(x1: number, y1: number, x2: number, y2: number): void {
    const line = this.scene.add.graphics();
    line.lineStyle(2, this.cfg.color, 0.9);
    line.beginPath();
    line.moveTo(x1, y1);
    line.lineTo(x2, y2);
    line.strokePath();
    this.scene.time.delayedCall(120, () => line.destroy());
  }

  private spawnImpactEffect(): void {
    const g = this.scene.add.graphics({ x: this.target.x, y: this.target.y });
    g.fillStyle(this.cfg.color, 0.8);
    const r = this.cfg.splashRadius ? Math.min(this.cfg.splashRadius, 30) : 8;
    g.fillCircle(0, 0, r);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      onComplete: () => g.destroy(),
    });
  }
}
