import Phaser from 'phaser';
import type { MapConfig, TowerType } from '../types';
import { getMapConfig } from '../data/maps';
import { WAVE_CONFIGS } from '../data/waves';
import { getTowerConfig } from '../data/towers';
import type { Tower } from '../entities/Tower';
import { MachineGunTower } from '../entities/towers/MachineGunTower';
import { TeslaTower } from '../entities/towers/TeslaTower';
import { MissilePodTower } from '../entities/towers/MissilePodTower';
import { SniperNestTower } from '../entities/towers/SniperNestTower';
import { WaveManager } from '../systems/WaveManager';
import { TechTreeManager } from '../systems/TechTreeManager';
import { CombatSystem } from '../systems/CombatSystem';
import { HUD } from '../ui/HUD';
import { TechTreeOverlay } from '../ui/TechTree';

const TOWER_FACTORIES: Partial<Record<TowerType, (scene: Phaser.Scene, x: number, y: number) => Tower>> = {
  'machine-gun': (s, x, y) => new MachineGunTower(s, x, y),
  'tesla-coil': (s, x, y) => new TeslaTower(s, x, y),
  'missile-pod': (s, x, y) => new MissilePodTower(s, x, y),
  'sniper-nest': (s, x, y) => new SniperNestTower(s, x, y),
};

export class GameScene extends Phaser.Scene {
  private mapConfig!: MapConfig;
  private towers: Tower[] = [];
  private activeBuildSlots: Set<string> = new Set();
  private placingTowerType: TowerType | null = null;
  private ghostTower!: Phaser.GameObjects.Graphics;
  private selectedTower: Tower | null = null;

  private waveManager!: WaveManager;
  private techTree!: TechTreeManager;
  private combatSystem!: CombatSystem;
  private hud!: HUD;
  private techOverlay!: TechTreeOverlay;

  private hp: number = 20;
  private maxHp: number = 20;
  private score: number = 0;

  private mapGraphic!: Phaser.GameObjects.Graphics;
  private pathGraphic!: Phaser.GameObjects.Graphics;
  private slotLayer!: Phaser.GameObjects.Graphics;

  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { mapKey: string }): void {
    this.towers = [];
    this.activeBuildSlots = new Set();
    this.hp = 20;
    this.maxHp = 20;
    this.score = 0;
    this.placingTowerType = null;
    this.selectedTower = null;
    this.mapConfig = getMapConfig(data.mapKey ?? 'outpost-bravo');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(this.mapConfig.bgColor);

    this.mapGraphic = this.add.graphics();
    this.pathGraphic = this.add.graphics();
    this.slotLayer = this.add.graphics();
    this.ghostTower = this.add.graphics();
    this.ghostTower.setDepth(5);

    this.drawMap();
    this.drawPath();
    this.drawBuildSlots();

    this.techTree = new TechTreeManager((rp) => this.hud?.updateRp(rp));

    const waves = WAVE_CONFIGS[this.mapConfig.key] ?? WAVE_CONFIGS['outpost-bravo'];
    this.waveManager = new WaveManager(this, waves, this.mapConfig.waypoints);
    this.waveManager.onEnemyDied = (_, reward) => this.onEnemyKilled(reward);
    this.waveManager.onEnemyReachedEnd = () => this.onEnemyReachedEnd();
    this.waveManager.onWaveComplete = (waveNum, bonus) => this.onWaveComplete(waveNum, bonus);

    this.combatSystem = new CombatSystem();

    this.hud = new HUD(this, this.techTree);
    this.hud.onTowerSelected = (type) => this.onTowerTypeSelected(type);
    this.hud.onStartWave = () => this.startWave();
    this.hud.onOpenTechTree = () => this.techOverlay.toggle();

    this.techOverlay = new TechTreeOverlay(this, this.techTree);
    this.techOverlay.onClose = () => this.hud.refreshTowerPalette();
    this.techOverlay.onUnlock = () => this.hud.refreshTowerPalette();

    this.messageText = this.add.text(512, 360, '', {
      fontSize: '24px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.hud.updateWave(1, this.mapConfig.totalWaves);
    this.hud.updateRp(this.techTree.rp);
    this.hud.updateHp(this.hp, this.maxHp);

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));

    this.showMessage('PLACE TOWERS — THEN START WAVE', 3000);
  }

  private drawMap(): void {
    this.mapGraphic.clear();
    const { bgColor, cellSize } = this.mapConfig;

    // Alternate tile shade for grid feel
    for (let col = 0; col < 16; col++) {
      for (let row = 0; row < 11; row++) {
        const shade = (col + row) % 2 === 0 ? bgColor : Phaser.Display.Color.ValueToColor(bgColor).darken(8).color;
        this.mapGraphic.fillStyle(shade);
        this.mapGraphic.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }

    // Subtle grid lines
    this.mapGraphic.lineStyle(1, 0x000000, 0.2);
    for (let col = 0; col <= 16; col++) {
      this.mapGraphic.lineBetween(col * cellSize, 0, col * cellSize, 704);
    }
    for (let row = 0; row <= 11; row++) {
      this.mapGraphic.lineBetween(0, row * cellSize, 1024, row * cellSize);
    }
  }

  private drawPath(): void {
    this.pathGraphic.clear();
    const wp = this.mapConfig.waypoints;
    const pathW = this.mapConfig.cellSize + 4;

    this.pathGraphic.lineStyle(pathW, this.mapConfig.pathColor, 0.7);
    this.pathGraphic.beginPath();
    this.pathGraphic.moveTo(wp[0].x, wp[0].y);
    for (let i = 1; i < wp.length; i++) {
      this.pathGraphic.lineTo(wp[i].x, wp[i].y);
    }
    this.pathGraphic.strokePath();

    // Entry and exit markers
    this.pathGraphic.fillStyle(0xff4444);
    this.pathGraphic.fillCircle(wp[0].x, wp[0].y, 10);
    this.pathGraphic.fillStyle(0x22cc44);
    this.pathGraphic.fillCircle(wp[wp.length - 1].x, wp[wp.length - 1].y, 10);

    // Entry/exit labels
    this.add.text(wp[0].x + 14, wp[0].y - 8, 'ENTRY', {
      fontSize: '9px', color: '#ff4444', fontFamily: 'monospace',
    }).setDepth(2);
    this.add.text(wp[wp.length - 1].x - 40, wp[wp.length - 1].y - 8, 'EXIT', {
      fontSize: '9px', color: '#22cc44', fontFamily: 'monospace',
    }).setDepth(2);
  }

  private drawBuildSlots(): void {
    this.slotLayer.clear();
    for (const slot of this.mapConfig.buildSlots) {
      const key = `${slot.x},${slot.y}`;
      if (this.activeBuildSlots.has(key)) continue;

      this.slotLayer.fillStyle(0xffffff, 0.06);
      this.slotLayer.fillRect(slot.x - 30, slot.y - 30, 60, 60);
      this.slotLayer.lineStyle(1, 0x334466, 0.4);
      this.slotLayer.strokeRect(slot.x - 30, slot.y - 30, 60, 60);
    }
  }

  private onTowerTypeSelected(type: TowerType | null): void {
    this.placingTowerType = type;
    this.selectedTower?.setSelected(false);
    this.selectedTower = null;
    if (!type) this.ghostTower.clear();
  }

  private snapToSlot(px: number, py: number): { x: number; y: number } | null {
    for (const slot of this.mapConfig.buildSlots) {
      const key = `${slot.x},${slot.y}`;
      if (this.activeBuildSlots.has(key)) continue;
      if (Math.abs(px - slot.x) <= 30 && Math.abs(py - slot.y) <= 30) {
        return slot;
      }
    }
    return null;
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (!this.placingTowerType || p.x > 1024) {
      this.ghostTower.clear();
      return;
    }

    this.ghostTower.clear();
    const slot = this.snapToSlot(p.x, p.y);
    const cfg = getTowerConfig(this.placingTowerType);

    if (slot) {
      this.ghostTower.fillStyle(cfg.tint, 0.6);
      this.ghostTower.fillRect(slot.x - 16, slot.y - 16, 32, 32);
      this.ghostTower.lineStyle(2, 0xffffff, 0.8);
      this.ghostTower.strokeRect(slot.x - 16, slot.y - 16, 32, 32);
      this.ghostTower.lineStyle(1, 0xffffff, 0.2);
      this.ghostTower.strokeCircle(slot.x, slot.y, cfg.range);
    } else {
      this.ghostTower.fillStyle(0xff4444, 0.3);
      this.ghostTower.fillRect(p.x - 16, p.y - 16, 32, 32);
    }
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (p.x > 1024 || this.techOverlay.isOpen()) return;

    if (this.placingTowerType) {
      this.tryPlaceTower(p.x, p.y);
      return;
    }

    // Select existing tower
    let clicked: Tower | null = null;
    for (const tower of this.towers) {
      const dx = tower.x - p.x;
      const dy = tower.y - p.y;
      if (dx * dx + dy * dy <= 28 * 28) {
        clicked = tower;
        break;
      }
    }

    if (this.selectedTower) {
      this.selectedTower.setSelected(false);
      this.selectedTower = null;
    }

    if (clicked) {
      this.selectedTower = clicked;
      clicked.setSelected(true);
    }
  }

  private tryPlaceTower(px: number, py: number): void {
    if (!this.placingTowerType) return;

    const slot = this.snapToSlot(px, py);
    if (!slot) return;

    const cfg = getTowerConfig(this.placingTowerType);
    if (!this.techTree.spendRp(cfg.cost)) {
      this.showMessage('NOT ENOUGH RP', 1500);
      return;
    }

    const factory = TOWER_FACTORIES[this.placingTowerType];
    if (!factory) {
      // Fallback: use MachineGun visual for unimplemented types
      const t = new MachineGunTower(this, slot.x, slot.y);
      this.towers.push(t);
    } else {
      const t = factory(this, slot.x, slot.y);
      this.towers.push(t);
    }

    this.activeBuildSlots.add(`${slot.x},${slot.y}`);
    this.drawBuildSlots();
    this.ghostTower.clear();
    this.hud.clearSelectedTower();
    this.placingTowerType = null;
  }

  private startWave(): void {
    if (this.waveManager.isWaveActive) return;
    if (this.techOverlay.isOpen()) return;
    const started = this.waveManager.startNextWave();
    if (started) {
      this.hud.updateWave(this.waveManager.currentWaveNumber, this.mapConfig.totalWaves);
      this.hud.setWaveActive(true);
    }
  }

  private onEnemyKilled(reward: number): void {
    this.techTree.addRp(reward);
    this.score += reward * 10;
  }

  private onEnemyReachedEnd(): void {
    this.hp = Math.max(0, this.hp - 1);
    this.hud.updateHp(this.hp, this.maxHp);
    this.cameras.main.shake(150, 0.008);

    if (this.hp <= 0) {
      this.gameOver();
    }
  }

  private onWaveComplete(waveNum: number, bonusRp: number): void {
    this.techTree.addRp(bonusRp);
    this.hud.setWaveActive(false);

    if (waveNum >= this.mapConfig.totalWaves) {
      this.victory();
      return;
    }

    this.showMessage(`WAVE ${waveNum} COMPLETE  +${bonusRp} RP`, 2500);
    this.hud.updateWave(this.waveManager.currentWaveNumber, this.mapConfig.totalWaves);
  }

  private gameOver(): void {
    this.waveManager.cleanup();
    this.messageText.setText('');

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 1024, 720);
    overlay.setDepth(25);

    this.add.text(512, 280, 'SECTOR LOST', {
      fontSize: '48px', color: '#ff2222', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(26);

    this.add.text(512, 360, `SCORE: ${this.score}`, {
      fontSize: '24px', color: '#c8d6e8', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(26);

    this.createEndButton(512, 440, 'RETURN TO BASE', () => this.scene.start('MenuScene'));
  }

  private victory(): void {
    this.waveManager.cleanup();
    this.messageText.setText('');

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 1024, 720);
    overlay.setDepth(25);

    this.add.text(512, 260, 'SECTOR SECURED', {
      fontSize: '44px', color: '#22cc44', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(26);

    this.add.text(512, 330, `SCORE: ${this.score}`, {
      fontSize: '24px', color: '#c8d6e8', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(26);

    this.add.text(512, 370, `HP REMAINING: ${this.hp} / ${this.maxHp}`, {
      fontSize: '16px', color: '#00fa9a', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(26);

    this.createEndButton(512, 440, 'RETURN TO BASE', () => this.scene.start('MenuScene'));
  }

  private createEndButton(x: number, y: number, label: string, cb: () => void): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a3a2a);
    bg.fillRoundedRect(x - 140, y - 20, 280, 44, 8);
    bg.lineStyle(2, 0x22cc44);
    bg.strokeRoundedRect(x - 140, y - 20, 280, 44, 8);
    bg.setInteractive(new Phaser.Geom.Rectangle(x - 140, y - 20, 280, 44), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', cb);
    bg.setDepth(27);

    this.add.text(x, y + 2, label, {
      fontSize: '16px', color: '#22cc44', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(28);
  }

  private showMessage(text: string, duration: number): void {
    this.messageText.setText(text);
    this.time.delayedCall(duration, () => {
      if (this.messageText?.active) this.messageText.setText('');
    });
  }

  update(time: number, delta: number): void {
    if (!this.waveManager) return;

    const liveEnemies = this.waveManager.enemies;

    // Reset boosts first so passives re-accumulate cleanly each frame
    for (const tower of this.towers) tower.resetBoosts();

    // Apply support passives (range boost, slow field) and psychic debuffs
    this.combatSystem.applyPassives(this.towers, liveEnemies);

    // Update towers (fire logic uses boosted/penalised effective values)
    for (const tower of this.towers) {
      tower.update(time, delta, liveEnemies);
    }

    // Move enemies along waypoints
    this.waveManager.update(time, delta);
  }

  shutdown(): void {
    this.waveManager?.cleanup();
    this.towers = [];
  }
}
