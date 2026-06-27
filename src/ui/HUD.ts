import Phaser from 'phaser';
import type { TowerType } from '../types';
import { TOWER_CONFIGS } from '../data/towers';
import type { TechTreeManager } from '../systems/TechTreeManager';

const PANEL_X = 1024;
const PANEL_W = 256;
const GAME_H = 720;
const BTN_W = 108;
const BTN_H = 64;

export class HUD {
  private scene: Phaser.Scene;
  private tech: TechTreeManager;
  private paletteContainer!: Phaser.GameObjects.Container;

  private rpText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Graphics;
  private startWaveBtnText!: Phaser.GameObjects.Text;

  private towerBtnBgs: Map<TowerType, Phaser.GameObjects.Graphics> = new Map();
  private selectedTower: TowerType | null = null;

  onTowerSelected: (type: TowerType | null) => void = () => {};
  onStartWave: () => void = () => {};
  onOpenTechTree: () => void = () => {};

  constructor(scene: Phaser.Scene, tech: TechTreeManager) {
    this.scene = scene;
    this.tech = tech;
    this.build();
  }

  private build(): void {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0d1117);
    panel.fillRect(PANEL_X, 0, PANEL_W, GAME_H);
    panel.lineStyle(1, 0x334466);
    panel.lineBetween(PANEL_X, 0, PANEL_X, GAME_H);
    panel.setDepth(10);

    this.buildStats();
    this.buildButtons();
    this.buildTowerPalette();
  }

  private text(x: number, y: number, content: string, size = '13px', color = '#c8d6e8'): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, content, {
      fontSize: size, color, fontFamily: 'monospace',
    }).setDepth(11);
  }

  private buildStats(): void {
    this.text(PANEL_X + 12, 12, '■ ALIEN SIEGE', '12px', '#4fc3f7');
    this.waveText = this.text(PANEL_X + 12, 36, 'WAVE  1 / 20');
    this.rpText = this.text(PANEL_X + 12, 56, 'RP    150', '13px', '#ffd700');
    this.text(PANEL_X + 12, 76, 'HP');
    this.hpBar = this.scene.add.graphics().setDepth(11);
    this.hpText = this.text(PANEL_X + 100, 76, '20 / 20');
    this.updateHpBar(20, 20);
  }

  private buildButtons(): void {
    const btnY = GAME_H - 140;
    this.createButton(PANEL_X + 12, btnY, 232, 44, '[ TECH TREE ]', 0x1a3a2a, 0x4fc3f7, () => this.onOpenTechTree());

    const startBg = this.createButtonBg(PANEL_X + 12, btnY + 56, 232, 44, 0x3a1a1a, 0xff4444);
    startBg.on('pointerdown', () => this.onStartWave());
    this.startWaveBtnText = this.text(PANEL_X + 128, btnY + 78, '[ START WAVE ]', '13px', '#ff4444').setOrigin(0.5);
  }

  private createButton(
    x: number, y: number, w: number, h: number,
    label: string, bgColor: number, borderColor: number, cb: () => void,
  ): void {
    const bg = this.createButtonBg(x, y, w, h, bgColor, borderColor);
    bg.on('pointerdown', cb);
    const hexStr = '#' + borderColor.toString(16).padStart(6, '0');
    this.text(x + w / 2, y + h / 2, label, '13px', hexStr).setOrigin(0.5);
  }

  private createButtonBg(
    x: number, y: number, w: number, h: number, bgColor: number, borderColor: number,
  ): Phaser.GameObjects.Graphics {
    const bg = this.scene.add.graphics();
    const draw = (fill: number, border: number, lw: number): void => {
      bg.clear();
      bg.fillStyle(fill);
      bg.fillRoundedRect(x, y, w, h, 6);
      bg.lineStyle(lw, border, 0.9);
      bg.strokeRoundedRect(x, y, w, h, 6);
    };
    draw(bgColor, borderColor, 1);
    bg.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', () => draw(bgColor + 0x0a0a0a, borderColor, 2));
    bg.on('pointerout', () => draw(bgColor, borderColor, 1));
    bg.setDepth(12);
    return bg;
  }

  buildTowerPalette(): void {
    if (this.paletteContainer) this.paletteContainer.destroy(true);
    this.towerBtnBgs.clear();
    this.selectedTower = null;

    const children: Phaser.GameObjects.GameObject[] = [];
    const unlocked = this.tech.getUnlockedTypes();

    this.scene.add.text(PANEL_X + 12, 110, '── TOWERS ──', {
      fontSize: '11px', color: '#556677', fontFamily: 'monospace',
    }).setDepth(11);

    let row = 0;
    let col = 0;

    for (const type of unlocked) {
      const cfg = TOWER_CONFIGS[type];
      const bx = PANEL_X + 16 + col * 120;
      const by = 132 + row * 76;

      const bg = this.scene.add.graphics();
      this.drawTileBg(bg, 0, 0, BTN_W, BTN_H, 0x1a2a3a, 0x334466, 1);
      bg.setPosition(bx, by);
      bg.setInteractive(new Phaser.Geom.Rectangle(0, 0, BTN_W, BTN_H), Phaser.Geom.Rectangle.Contains);
      bg.on('pointerdown', () => this.selectTowerBtn(type));
      bg.on('pointerover', () => {
        if (this.selectedTower !== type) this.drawTileBg(bg, 0, 0, BTN_W, BTN_H, 0x223344, 0x4488aa, 1);
      });
      bg.on('pointerout', () => {
        if (this.selectedTower !== type) this.drawTileBg(bg, 0, 0, BTN_W, BTN_H, 0x1a2a3a, 0x334466, 1);
      });
      this.towerBtnBgs.set(type, bg);
      children.push(bg);

      const icon = this.scene.add.graphics().setPosition(bx + 6, by + 8);
      icon.fillStyle(cfg.tint);
      icon.fillRect(0, 0, 18, 18);
      children.push(icon);

      children.push(
        this.scene.add.text(bx + 28, by + 6, cfg.displayName, {
          fontSize: '9px', color: '#c8d6e8', fontFamily: 'monospace', wordWrap: { width: 76 },
        }).setDepth(12),
        this.scene.add.text(bx + 28, by + 36, `${cfg.cost} RP`, {
          fontSize: '10px', color: '#ffd700', fontFamily: 'monospace',
        }).setDepth(12),
        this.scene.add.text(bx + 28, by + 50, cfg.isPassive ? 'PASSIVE' : `DMG ${cfg.damage}`, {
          fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace',
        }).setDepth(12),
      );

      col++;
      if (col > 1) { col = 0; row++; }
    }

    this.paletteContainer = this.scene.add.container(0, 0, children).setDepth(11);
  }

  private drawTileBg(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    fill: number, border: number, lw: number,
  ): void {
    g.clear();
    g.fillStyle(fill);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(lw, border);
    g.strokeRoundedRect(x, y, w, h, 4);
  }

  private selectTowerBtn(type: TowerType): void {
    if (this.selectedTower === type) {
      this.selectedTower = null;
      this.towerBtnBgs.get(type) &&
        this.drawTileBg(this.towerBtnBgs.get(type)!, 0, 0, BTN_W, BTN_H, 0x1a2a3a, 0x334466, 1);
      this.onTowerSelected(null);
      return;
    }

    // Deselect previous
    if (this.selectedTower) {
      const prev = this.towerBtnBgs.get(this.selectedTower);
      if (prev) this.drawTileBg(prev, 0, 0, BTN_W, BTN_H, 0x1a2a3a, 0x334466, 1);
    }

    this.selectedTower = type;
    const bg = this.towerBtnBgs.get(type);
    if (bg) this.drawTileBg(bg, 0, 0, BTN_W, BTN_H, 0x1a3a5a, 0x4fc3f7, 2);
    this.onTowerSelected(type);
  }

  updateWave(current: number, total: number): void {
    this.waveText.setText(`WAVE  ${current} / ${total}`);
  }

  updateRp(rp: number): void {
    this.rpText.setText(`RP    ${rp}`);
  }

  updateHp(hp: number, maxHp: number): void {
    this.hpText.setText(`${hp} / ${maxHp}`);
    this.updateHpBar(hp, maxHp);
  }

  private updateHpBar(hp: number, maxHp: number): void {
    this.hpBar.clear();
    const pct = hp / maxHp;
    const barX = PANEL_X + 12;
    const barY = 94;
    const w = 232;
    this.hpBar.fillStyle(0x222233);
    this.hpBar.fillRect(barX, barY, w, 10);
    const color = pct > 0.5 ? 0x22cc44 : pct > 0.25 ? 0xffaa00 : 0xff2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(barX, barY, w * pct, 10);
  }

  setWaveActive(active: boolean): void {
    this.startWaveBtnText.setText(active ? '[ WAVE IN PROGRESS ]' : '[ START WAVE ]');
    this.startWaveBtnText.setColor(active ? '#555555' : '#ff4444');
  }

  clearSelectedTower(): void {
    if (this.selectedTower) {
      const bg = this.towerBtnBgs.get(this.selectedTower);
      if (bg) this.drawTileBg(bg, 0, 0, BTN_W, BTN_H, 0x1a2a3a, 0x334466, 1);
    }
    this.selectedTower = null;
  }

  refreshTowerPalette(): void {
    this.buildTowerPalette();
  }
}
