import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.text(w / 2, h / 2, 'LOADING...', {
      fontSize: '20px',
      color: '#4fc3f7',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const bar = this.add.graphics();
    bar.fillStyle(0x334466);
    bar.fillRect(w / 2 - 200, h / 2 + 30, 400, 8);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x334466);
      bar.fillRect(w / 2 - 200, h / 2 + 30, 400, 8);
      bar.fillStyle(0x4fc3f7);
      bar.fillRect(w / 2 - 200, h / 2 + 30, 400 * value, 8);
    });
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
