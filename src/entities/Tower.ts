import Phaser from 'phaser';
import type { TowerConfig, TowerType } from '../types';
import type { Enemy } from './Enemy';
import { Projectile } from './Projectile';

export abstract class Tower extends Phaser.GameObjects.Container {
  readonly towerType: TowerType;
  readonly config: TowerConfig;

  protected fireTimer: number = 0;
  private rangeBoostFactor: number = 1;
  private fireRateBoostFactor: number = 1;
  private fireRatePenaltyFactor: number = 1; // < 1 when psychic-debuffed

  protected rangeCircle!: Phaser.GameObjects.Graphics;
  protected bodyGraphic!: Phaser.GameObjects.Graphics;
  protected barrel!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TowerConfig) {
    super(scene, x, y);
    this.config = config;
    this.towerType = config.type;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.buildVisual();
  }

  protected buildVisual(): void {
    this.rangeCircle = this.scene.add.graphics();
    this.drawRangeCircle(false);

    this.bodyGraphic = this.scene.add.graphics();
    this.barrel = this.scene.add.graphics();
    this.add([this.rangeCircle, this.bodyGraphic, this.barrel]);
    this.drawBody();
    this.drawBarrel();
  }

  protected drawBody(): void {
    this.bodyGraphic.clear();
    const c = this.config;
    this.bodyGraphic.fillStyle(c.tint);
    this.bodyGraphic.lineStyle(2, 0xffffff, 0.6);

    if (c.shape === 'rect') {
      this.bodyGraphic.fillRect(-16, -16, 32, 32);
      this.bodyGraphic.strokeRect(-16, -16, 32, 32);
    } else if (c.shape === 'diamond') {
      this.bodyGraphic.fillTriangle(-18, 0, 0, -18, 18, 0);
      this.bodyGraphic.fillTriangle(-18, 0, 0, 18, 18, 0);
      this.bodyGraphic.strokeTriangle(-18, 0, 0, -18, 18, 0);
      this.bodyGraphic.strokeTriangle(-18, 0, 0, 18, 18, 0);
    } else {
      this.bodyGraphic.fillTriangle(-16, 14, 0, -18, 16, 14);
      this.bodyGraphic.strokeTriangle(-16, 14, 0, -18, 16, 14);
    }

    if (this.config.isPassive) {
      this.bodyGraphic.lineStyle(1, 0x00ff88, 0.5);
      this.bodyGraphic.strokeCircle(0, 0, 20);
    }
  }

  protected drawBarrel(): void {
    this.barrel.clear();
    if (this.config.isPassive) return;
    this.barrel.fillStyle(0xcccccc);
    this.barrel.fillRect(-2, -20, 4, 20);
  }

  drawRangeCircle(visible: boolean): void {
    this.rangeCircle.clear();
    if (!visible || this.config.isPassive) return;
    const r = this.effectiveRange;
    this.rangeCircle.lineStyle(1, 0xffffff, 0.25);
    this.rangeCircle.strokeCircle(0, 0, r);
    this.rangeCircle.fillStyle(0xffffff, 0.04);
    this.rangeCircle.fillCircle(0, 0, r);
  }

  get effectiveRange(): number {
    return this.config.range * this.rangeBoostFactor;
  }

  get effectiveFireRate(): number {
    return this.config.fireRate * this.fireRateBoostFactor * this.fireRatePenaltyFactor;
  }

  applyRangeBoost(factor: number): void {
    this.rangeBoostFactor = Math.max(this.rangeBoostFactor, 1 + factor);
  }

  applyFireRateBoost(factor: number): void {
    this.fireRateBoostFactor = Math.max(this.fireRateBoostFactor, 1 + factor);
  }

  // factor < 1 — multiplies effective fire rate down (psychic debuff)
  applyFireRatePenalty(factor: number): void {
    this.fireRatePenaltyFactor = Math.min(this.fireRatePenaltyFactor, factor);
  }

  // Called once at the start of each game-loop frame before passives are re-applied
  resetBoosts(): void {
    this.rangeBoostFactor = 1;
    this.fireRateBoostFactor = 1;
    this.fireRatePenaltyFactor = 1;
  }

  protected selectTarget(enemies: Enemy[]): Enemy | null {
    if (this.config.isPassive) return null;
    const range = this.effectiveRange;
    const r2 = range * range;

    const inRange = enemies.filter((e) => {
      if (e.isDead || e.hasReachedEnd) return false;
      if (e.config.isFlying && !this.config.isAntiAir) return false;
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      return dx * dx + dy * dy <= r2;
    });

    if (inRange.length === 0) return null;

    switch (this.config.targetPriority) {
      case 'first':
        return inRange.reduce((best, e) => (e.waypointIndex > best.waypointIndex ? e : best));
      case 'strongest':
        return inRange.reduce((best, e) => (e.hp > best.hp ? e : best));
      case 'weakest':
        return inRange.reduce((best, e) => (e.hp < best.hp ? e : best));
      case 'nearest':
        return inRange.reduce((best, e) => {
          const dxB = best.x - this.x;
          const dyB = best.y - this.y;
          const dxE = e.x - this.x;
          const dyE = e.y - this.y;
          return dxE * dxE + dyE * dyE < dxB * dxB + dyB * dyB ? e : best;
        });
    }
  }

  protected aimAt(target: Enemy): void {
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    this.barrel.setRotation(angle + Math.PI / 2);
  }

  protected fireAt(target: Enemy, allEnemies: Enemy[]): void {
    new Projectile(this.scene, this.x, this.y, target, {
      damage: this.config.damage,
      damageType: this.config.damageType,
      speed: this.config.projectileSpeed,
      color: this.config.projectileColor,
      splashRadius: this.config.splashRadius,
      chainCount: this.config.chainCount,
      allEnemies,
    });
  }

  update(_time: number, delta: number, enemies: Enemy[]): void {
    if (this.config.isPassive) return; // CombatSystem handles passive effects each frame

    this.fireTimer += delta;
    const interval = 1000 / this.effectiveFireRate;

    if (this.fireTimer >= interval) {
      const target = this.selectTarget(enemies);
      if (target) {
        this.fireTimer = 0;
        this.aimAt(target);
        this.fireAt(target, enemies);
      }
    }
  }

  setSelected(selected: boolean): void {
    this.drawRangeCircle(selected);
  }
}
