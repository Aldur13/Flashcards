import Phaser from 'phaser';
import { MAP_CONFIGS } from '../data/maps';
import type { MapConfig } from '../types';

const CARD_W = 236;
const CARD_H = 248;
const COL_GAP = 8;
const ROW_GAP = 16;
const COLS = 4;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    this.add.rectangle(0, 0, W, H, 0x040810).setOrigin(0);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x112233, 0.3);
    for (let x = 0; x < W; x += 40) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) grid.lineBetween(0, y, W, y);

    this.add.text(W / 2, 55, 'ALIEN SIEGE', {
      fontSize: '46px', color: '#4fc3f7', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 112, 'TOWER DEFENSE // CLASSIFIED ENGAGEMENT', {
      fontSize: '13px', color: '#446688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(W / 2, 150, 'SELECT DEPLOYMENT ZONE', {
      fontSize: '15px', color: '#c8d6e8', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const maps = Object.values(MAP_CONFIGS);
    const startY = 175;

    maps.forEach((map, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const rowLen = Math.min(COLS, maps.length - row * COLS);
      const rowTotalW = rowLen * CARD_W + (rowLen - 1) * COL_GAP;
      const rowStartX = (W - rowTotalW) / 2;
      const x = rowStartX + col * (CARD_W + COL_GAP) + CARD_W / 2;
      const y = startY + row * (CARD_H + ROW_GAP);
      this.buildMapCard(x, y, map);
    });

    this.add.text(W / 2, H - 22, 'Build towers · Earn RP · Research upgrades · Survive 20 waves', {
      fontSize: '11px', color: '#334466', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private buildMapCard(cx: number, y: number, map: MapConfig): void {
    const hw = CARD_W / 2;
    const x = cx;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1117);
    bg.fillRoundedRect(x - hw, y, CARD_W, CARD_H, 6);
    bg.lineStyle(1, 0x334466);
    bg.strokeRoundedRect(x - hw, y, CARD_W, CARD_H, 6);

    // Mini map preview
    const previewH = 100;
    const previewW = CARD_W - 20;
    const preview = this.add.graphics();
    preview.fillStyle(map.bgColor);
    preview.fillRect(x - hw + 10, y + 10, previewW, previewH);
    preview.lineStyle(3, map.pathColor, 0.8);
    const pts = map.waypoints;
    for (let i = 0; i < pts.length - 1; i++) {
      const sx = (CARD_W - 20) / 1024;
      const sy = previewH / 720;
      const x1 = x - hw + 10 + pts[i].x * sx;
      const y1 = y + 10 + pts[i].y * sy;
      const x2 = x - hw + 10 + pts[i + 1].x * sx;
      const y2 = y + 10 + pts[i + 1].y * sy;
      preview.lineBetween(x1, y1, x2, y2);
    }

    this.add.text(x, y + 118, map.displayName, {
      fontSize: '14px', color: '#4fc3f7', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(x, y + 138, map.description, {
      fontSize: '8px', color: '#667788', fontFamily: 'monospace',
      wordWrap: { width: CARD_W - 16 },
    }).setOrigin(0.5, 0);

    this.add.text(x, y + 198, `[ ${map.totalWaves} WAVES ]`, {
      fontSize: '10px', color: '#446688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Deploy button
    const btn = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btn.clear();
      btn.fillStyle(hover ? 0x224422 : 0x1a3a2a);
      btn.fillRoundedRect(x - 70, y + 212, 140, 28, 5);
      btn.lineStyle(hover ? 2 : 1, hover ? 0x22ff44 : 0x22cc44, 0.9);
      btn.strokeRoundedRect(x - 70, y + 212, 140, 28, 5);
    };
    drawBtn(false);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(x - 70, y + 212, 140, 28),
      Phaser.Geom.Rectangle.Contains,
    );
    btn.on('pointerdown', () => this.startGame(map.key));
    btn.on('pointerover', () => drawBtn(true));
    btn.on('pointerout', () => drawBtn(false));

    this.add.text(x, y + 226, 'DEPLOY', {
      fontSize: '13px', color: '#22cc44', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private startGame(mapKey: string): void {
    this.scene.start('GameScene', { mapKey });
  }
}
