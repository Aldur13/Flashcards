import Phaser from 'phaser';
import { Tower } from '../Tower';
import { getTowerConfig } from '../../data/towers';

export class MachineGunTower extends Tower {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, getTowerConfig('machine-gun'));
  }
}
