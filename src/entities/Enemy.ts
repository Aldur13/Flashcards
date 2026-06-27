import Phaser from 'phaser';
import type { EnemyConfig, EnemyType, Vec2 } from '../types';

export abstract class Enemy extends Phaser.GameObjects.Container {
  readonly enemyType: EnemyType;
  readonly config: EnemyConfig;

  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  waypointIndex: number = 0;
  waypoints: Vec2[];
  isDead: boolean = false;
  hasReachedEnd: boolean = false;
  slowFactor: number = 1;

  private healthBar!: Phaser.GameObjects.Graphics;
  protected bodyGfx!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, waypoints: Vec2[], config: EnemyConfig) {
    super(scene, waypoints[0].x, waypoints[0].y);
    this.config = config;
    this.enemyType = config.type;
    this.hp = config.maxHp;
    this.maxHp = config.maxHp;
    this.speed = config.speed;
    this.baseSpeed = config.speed;
    this.waypoints = waypoints;

    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.buildVisual();
  }

  private buildVisual(): void {
    this.bodyGfx = this.scene.add.graphics();
    this.healthBar = this.scene.add.graphics();
    this.add([this.bodyGfx, this.healthBar]);
    this.setScale(this.config.scale);
    this.drawBody();
  }

  protected abstract drawBody(): void;

  protected drawHealthBar(): void {
    this.healthBar.clear();
    const pct = this.hp / this.maxHp;
    const w = 36;
    const h = 4;
    const y = -28;

    this.healthBar.fillStyle(0x222222);
    this.healthBar.fillRect(-w / 2, y, w, h);

    const color = pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff2222;
    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(-w / 2, y, w * pct, h);
  }

  takeDamage(amount: number, damageType: 'ballistic' | 'energy' | 'explosive' | 'electric'): void {
    if (this.isDead) return;

    let effective = amount;
    if (damageType === 'ballistic') effective *= 1 - this.config.armor;
    const resistance = this.config.resistances[damageType] ?? 0;
    effective *= 1 - resistance;

    this.hp -= effective;
    this.drawHealthBar();

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.emit('died', this);
    }
  }

  applySlowField(strength: number): void {
    this.slowFactor = Math.min(this.slowFactor, 1 - strength);
  }

  update(_time: number, delta: number): void {
    if (this.isDead || this.hasReachedEnd) return;

    this.speed = this.baseSpeed * this.slowFactor;
    this.slowFactor = 1; // slow fields must reapply continuously each frame

    const target = this.waypoints[this.waypointIndex];
    if (!target) {
      this.hasReachedEnd = true;
      this.emit('reachedEnd', this);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveAmount = this.speed * (delta / 1000);

    if (dist <= moveAmount) {
      this.setPosition(target.x, target.y);
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        this.hasReachedEnd = true;
        this.emit('reachedEnd', this);
      }
    } else {
      this.x += (dx / dist) * moveAmount;
      this.y += (dy / dist) * moveAmount;
      this.setRotation(Math.atan2(dy, dx));
    }
  }
}
