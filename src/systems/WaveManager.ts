import Phaser from 'phaser';
import type { WaveConfig, Vec2, EnemyType } from '../types';
import type { Enemy } from '../entities/Enemy';
import { Crawler } from '../entities/enemies/Crawler';
import { Brute } from '../entities/enemies/Brute';
import { Drone } from '../entities/enemies/Drone';
import { Psychic } from '../entities/enemies/Psychic';
import { Mothership } from '../entities/enemies/Mothership';

type EnemyFactory = (scene: Phaser.Scene, waypoints: Vec2[]) => Enemy;

const FACTORIES: Record<EnemyType, EnemyFactory> = {
  crawler: (s, w) => new Crawler(s, w),
  brute: (s, w) => new Brute(s, w),
  drone: (s, w) => new Drone(s, w),
  psychic: (s, w) => new Psychic(s, w),
  mothership: (s, w) => new Mothership(s, w),
};

export class WaveManager {
  private scene: Phaser.Scene;
  private waves: WaveConfig[];
  private waypoints: Vec2[];
  private currentWaveIndex: number = 0;
  private activeEnemies: Enemy[] = [];
  private isRunning: boolean = false;
  private timers: Phaser.Time.TimerEvent[] = [];

  onEnemyDied: (enemy: Enemy, reward: number) => void = () => {};
  onEnemyReachedEnd: (enemy: Enemy, damage: number) => void = () => {};
  onWaveComplete: (waveNumber: number, bonusRp: number) => void = () => {};

  constructor(scene: Phaser.Scene, waves: WaveConfig[], waypoints: Vec2[]) {
    this.scene = scene;
    this.waves = waves;
    this.waypoints = waypoints;
  }

  get currentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  get totalWaves(): number {
    return this.waves.length;
  }

  get enemies(): Enemy[] {
    return this.activeEnemies.filter((e) => !e.isDead && !e.hasReachedEnd);
  }

  get isWaveActive(): boolean {
    return this.isRunning;
  }

  startNextWave(): boolean {
    if (this.isRunning) return false;
    if (this.currentWaveIndex >= this.waves.length) return false;

    const wave = this.waves[this.currentWaveIndex];
    this.isRunning = true;

    for (const entry of wave.entries) {
      for (let i = 0; i < entry.count; i++) {
        const delay = entry.delay + i * entry.spawnInterval;
        const t = this.scene.time.delayedCall(delay, () => {
          this.spawnEnemy(entry.enemyType);
        });
        this.timers.push(t);
      }
    }

    return true;
  }

  private spawnEnemy(type: EnemyType): void {
    const factory = FACTORIES[type];
    const enemy = factory(this.scene, [...this.waypoints]);

    enemy.on('died', (e: Enemy) => {
      this.removeEnemy(e);
      this.onEnemyDied(e, e.config.reward);
      this.checkWaveComplete();
    });

    enemy.on('reachedEnd', (e: Enemy) => {
      this.removeEnemy(e);
      this.onEnemyReachedEnd(e, 1);
      this.checkWaveComplete();
    });

    this.activeEnemies.push(enemy);
  }

  private removeEnemy(enemy: Enemy): void {
    const idx = this.activeEnemies.indexOf(enemy);
    if (idx !== -1) this.activeEnemies.splice(idx, 1);
    if (!enemy.scene) return;
    enemy.destroy();
  }

  private checkWaveComplete(): void {
    const allTimersDone = this.timers.every((t) => t.hasDispatched || t.elapsed >= t.delay);
    const allEnemiesDone = this.activeEnemies.filter((e) => !e.isDead && !e.hasReachedEnd).length === 0;

    if (allTimersDone && allEnemiesDone) {
      const wave = this.waves[this.currentWaveIndex];
      this.isRunning = false;
      this.timers = [];
      this.currentWaveIndex++;
      this.onWaveComplete(wave.waveNumber, wave.bonusRp);
    }
  }

  update(time: number, delta: number): void {
    for (const enemy of [...this.activeEnemies]) {
      enemy.update(time, delta);
    }
  }

  cleanup(): void {
    for (const t of this.timers) t.remove();
    this.timers = [];
    for (const e of this.activeEnemies) {
      if (e.scene) e.destroy();
    }
    this.activeEnemies = [];
    this.isRunning = false;
  }
}
