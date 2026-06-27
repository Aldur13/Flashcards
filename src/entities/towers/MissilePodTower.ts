import Phaser from 'phaser';
import { Tower } from '../Tower';
import { getTowerConfig } from '../../data/towers';

export class MissilePodTower extends Tower {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getTowerConfig('missile-pod'));
  }

  protected drawBarrel(): void {
    this.barrel.clear();
    this.barrel.fillStyle(0xaaaaaa);
    // Dual tube launcher
    this.barrel.fillRect(-5, -22, 4, 22);
    this.barrel.fillRect(1, -22, 4, 22);
  }
}
