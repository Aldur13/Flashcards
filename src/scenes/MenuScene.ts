import Phaser from 'phaser';
import { MAP_CONFIGS } from '../data/maps';
import type { MapConfig } from '../types';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width: W, height: H } = this.cameras.main;

    // Dark background with scanline effect
    this.add.rectangle(0, 0, W, H, 0x040810).setOrigin(0);

    // Grid overlay
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x112233, 0.3);
    for (let x = 0; x < W; x += 40) grid.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) grid.lineBetween(0, y, W, y);

    // Title
    this.add.text(W / 2, 80, 'ALIEN SIEGE', {
      fontSize: '52px',
      color: '#4fc3f7',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 146, 'TOWER DEFENSE // CLASSIFIED ENGAGEMENT', {
      fontSize: '14px',
      color: '#446688',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(W / 2, 200, 'SELECT DEPLOYMENT ZONE', {
      fontSize: '16px',
      color: '#c8d6e8',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const maps = Object.values(MAP_CONFIGS);
    const startX = W / 2 - ((maps.length - 1) * 320) / 2;

    maps.forEach((map, i) => {
      this.buildMapCard(startX + i * 320, 300, map);
    });

    // Bottom info
    this.add.text(W / 2, H - 30, 'Build towers · Earn RP · Research upgrades · Survive 20 waves', {
      fontSize: '11px',
      color: '#334466',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private buildMapCard(x: number, y: number, map: MapConfig): void {
    const W = 280;
    const H = 320;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1117);
    bg.fillRoundedRect(x - W / 2, y, W, H, 8);
    bg.lineStyle(1, 0x334466);
    bg.strokeRoundedRect(x - W / 2, y, W, H, 8);

    // Mini map preview (just colored rectangle with path hint)
    const preview = this.add.graphics();
    preview.fillStyle(map.bgColor);
    preview.fillRect(x - W / 2 + 12, y + 12, W - 24, 140);
    preview.lineStyle(3, map.pathColor, 0.8);
    // Draw simplified path
    const pts = map.waypoints;
    for (let i = 0; i < pts.length - 1; i++) {
      const scaleX = (W - 24) / 1024;
      const scaleY = 140 / 720;
      const x1 = x - W / 2 + 12 + pts[i].x * scaleX;
      const y1 = y + 12 + pts[i].y * scaleY;
      const x2 = x - W / 2 + 12 + pts[i + 1].x * scaleX;
      const y2 = y + 12 + pts[i + 1].y * scaleY;
      preview.lineBetween(x1, y1, x2, y2);
    }

    this.add.text(x, y + 168, map.displayName, {
      fontSize: '16px', color: '#4fc3f7', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(x, y + 192, map.description, {
      fontSize: '9px', color: '#667788', fontFamily: 'monospace',
      wordWrap: { width: W - 24 },
    }).setOrigin(0.5, 0);

    this.add.text(x, y + 260, `[ ${map.totalWaves} WAVES ]`, {
      fontSize: '11px', color: '#446688', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Deploy button
    const btn = this.add.graphics();
    btn.fillStyle(0x1a3a2a);
    btn.fillRoundedRect(x - 80, y + 278, 160, 34, 6);
    btn.lineStyle(1, 0x22cc44, 0.9);
    btn.strokeRoundedRect(x - 80, y + 278, 160, 34, 6);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(x - 80, y + 278, 160, 34),
      Phaser.Geom.Rectangle.Contains,
    );
    btn.on('pointerdown', () => this.startGame(map.key));
    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0x224422);
      btn.fillRoundedRect(x - 80, y + 278, 160, 34, 6);
      btn.lineStyle(2, 0x22ff44);
      btn.strokeRoundedRect(x - 80, y + 278, 160, 34, 6);
    });
    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0x1a3a2a);
      btn.fillRoundedRect(x - 80, y + 278, 160, 34, 6);
      btn.lineStyle(1, 0x22cc44, 0.9);
      btn.strokeRoundedRect(x - 80, y + 278, 160, 34, 6);
    });

    this.add.text(x, y + 295, 'DEPLOY', {
      fontSize: '14px', color: '#22cc44', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private startGame(mapKey: string): void {
    this.scene.start('GameScene', { mapKey });
  }
}
