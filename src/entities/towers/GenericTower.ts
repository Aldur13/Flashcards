import Phaser from 'phaser';
import { Tower } from '../Tower';
import { getTowerConfig } from '../../data/towers';
import type { TowerType } from '../../types';

// Universal tower class for tower types that use the standard visual and combat logic.
export class GenericTower extends Tower {
  constructor(scene: Phaser.Scene, x: number, y: number, type: TowerType) {
    super(scene, x, y, getTowerConfig(type));
  }
}
