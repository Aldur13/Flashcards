import Phaser from 'phaser';
import { Tower } from '../Tower';
import { getTowerConfig } from '../../data/towers';

export class SniperNestTower extends Tower {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getTowerConfig('sniper-nest'));
  }

  protected drawBarrel(): void {
    this.barrel.clear();
    this.barrel.fillStyle(0xbbbbbb);
    // Long thin barrel
    this.barrel.fillRect(-1.5, -28, 3, 28);
    // Scope
    this.barrel.fillStyle(0x444444);
    this.barrel.fillRect(-4, -20, 8, 4);
  }
}
