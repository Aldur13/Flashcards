import Phaser from 'phaser';
import type { TechBranch, TowerType } from '../types';
import { TOWER_CONFIGS } from '../data/towers';
import type { TechTreeManager } from '../systems/TechTreeManager';

const BRANCHES: TechBranch[] = ['firepower', 'area-control', 'support'];
const BRANCH_LABELS: Record<TechBranch, string> = {
  firepower: '── FIREPOWER ──',
  'area-control': '── AREA CONTROL ──',
  support: '── SUPPORT ──',
};
const BRANCH_COLORS: Record<TechBranch, number> = {
  firepower: 0xff4444,
  'area-control': 0x9400d3,
  support: 0x00fa9a,
};

export class TechTreeOverlay {
  private scene: Phaser.Scene;
  private tech: TechTreeManager;
  private container!: Phaser.GameObjects.Container;
  private visible: boolean = false;

  onClose: () => void = () => {};
  onUnlock: (type: TowerType) => void = () => {};

  constructor(scene: Phaser.Scene, tech: TechTreeManager) {
    this.scene = scene;
    this.tech = tech;
    this.build();
    this.hide();
  }

  private build(): void {
    const children: Phaser.GameObjects.GameObject[] = [];

    // Background overlay
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.82);
    bg.fillRect(0, 0, 1280, 720);
    children.push(bg);

    // Panel
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0d1117);
    panel.fillRoundedRect(60, 40, 1160, 640, 10);
    panel.lineStyle(1, 0x334466);
    panel.strokeRoundedRect(60, 40, 1160, 640, 10);
    children.push(panel);

    // Title
    const title = this.scene.add.text(640, 70, 'RESEARCH & TECH TREE', {
      fontSize: '18px', color: '#4fc3f7', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
    children.push(title);

    const rpLabel = this.scene.add.text(640, 96, `RP: ${this.tech.rp}`, {
      fontSize: '14px', color: '#ffd700', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setName('rp-label');
    children.push(rpLabel);

    // Close button
    const closeBtn = this.createButton('[ CLOSE ]', 1140, 58, 0xff4444, () => {
      this.hide();
      this.onClose();
    });
    children.push(...closeBtn);

    // Render branches
    const branchX = [100, 480, 860];
    for (let bi = 0; bi < BRANCHES.length; bi++) {
      const branch = BRANCHES[bi];
      const bx = branchX[bi];
      const color = BRANCH_COLORS[branch];
      const hexColor = '#' + color.toString(16).padStart(6, '0');

      const branchLabel = this.scene.add.text(bx, 128, BRANCH_LABELS[branch], {
        fontSize: '12px', color: hexColor, fontFamily: 'monospace',
      });
      children.push(branchLabel);

      const nodes = this.tech.getNodesForBranch(branch);
      for (const node of nodes) {
        const nx = bx + node.col * 180;
        const ny = 160 + node.row * 200;

        const result = this.buildNode(node.type, nx, ny, color);
        children.push(...result);
      }
    }

    this.container = this.scene.add.container(0, 0, children);
    this.container.setDepth(50);
  }

  private buildNode(type: TowerType, x: number, y: number, branchColor: number): Phaser.GameObjects.GameObject[] {
    const cfg = TOWER_CONFIGS[type];
    const objs: Phaser.GameObjects.GameObject[] = [];

    const unlocked = this.tech.isUnlocked(type);
    const canUnlock = this.tech.canUnlock(type);
    const bgColor = unlocked ? 0x1a3a2a : canUnlock ? 0x1a2a3a : 0x111111;
    const borderColor = unlocked ? 0x00fa9a : canUnlock ? branchColor : 0x334466;
    const borderAlpha = unlocked ? 1 : canUnlock ? 0.8 : 0.4;

    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor);
    bg.fillRoundedRect(x, y, 165, 120, 6);
    bg.lineStyle(unlocked ? 2 : 1, borderColor, borderAlpha);
    bg.strokeRoundedRect(x, y, 165, 120, 6);
    objs.push(bg);

    // Tower icon
    const icon = this.scene.add.graphics();
    icon.fillStyle(cfg.tint, unlocked ? 1 : 0.4);
    icon.fillRect(x + 8, y + 8, 18, 18);
    objs.push(icon);

    const nameColor = unlocked ? '#ffffff' : canUnlock ? '#c8d6e8' : '#555566';
    const nameText = this.scene.add.text(x + 30, y + 8, cfg.displayName, {
      fontSize: '10px', color: nameColor, fontFamily: 'monospace', wordWrap: { width: 130 },
    });
    objs.push(nameText);

    const descText = this.scene.add.text(x + 8, y + 42, cfg.description, {
      fontSize: '8px', color: '#667788', fontFamily: 'monospace', wordWrap: { width: 150 },
    });
    objs.push(descText);

    if (unlocked) {
      const badge = this.scene.add.text(x + 8, y + 100, '✓ UNLOCKED', {
        fontSize: '9px', color: '#00fa9a', fontFamily: 'monospace',
      });
      objs.push(badge);
    } else if (canUnlock) {
      const costBtn = this.scene.add.graphics();
      const affordable = this.tech.rp >= cfg.cost;
      costBtn.fillStyle(affordable ? 0x1a3a1a : 0x2a1a1a);
      costBtn.fillRoundedRect(x + 8, y + 96, 150, 18, 3);
      costBtn.lineStyle(1, affordable ? 0x44aa44 : 0x553333);
      costBtn.strokeRoundedRect(x + 8, y + 96, 150, 18, 3);
      costBtn.setInteractive(
        new Phaser.Geom.Rectangle(x + 8, y + 96, 150, 18),
        Phaser.Geom.Rectangle.Contains,
      );
      costBtn.on('pointerdown', () => {
        if (this.tech.unlock(type)) {
          this.onUnlock(type);
          // Defer rebuild to next frame so the pointerdown handler completes first
          this.scene.time.delayedCall(0, () => this.rebuild());
        }
      });
      objs.push(costBtn);

      const costLabel = this.scene.add.text(x + 83, y + 96, `UNLOCK  ${cfg.cost} RP`, {
        fontSize: '9px', color: affordable ? '#ffd700' : '#664444', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
      objs.push(costLabel);
    } else {
      const lockedText = this.scene.add.text(x + 8, y + 100, `LOCKED — need: ${cfg.prerequisite ?? '?'}`, {
        fontSize: '8px', color: '#334455', fontFamily: 'monospace',
      });
      objs.push(lockedText);
    }

    return objs;
  }

  private createButton(
    label: string, x: number, y: number, color: number, cb: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const bg = this.scene.add.graphics();
    bg.lineStyle(1, color, 0.8);
    bg.strokeRoundedRect(x - 60, y - 2, 120, 28, 4);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(x - 60, y - 2, 120, 28),
      Phaser.Geom.Rectangle.Contains,
    );
    bg.on('pointerdown', cb);

    const text = this.scene.add.text(x, y + 12, label, {
      fontSize: '12px', color: hexColor, fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);

    return [bg, text];
  }

  private rebuild(): void {
    this.container.destroy();
    this.build();
    this.container.setVisible(this.visible);
  }

  show(): void {
    this.visible = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.container.setVisible(false);
  }

  toggle(): void {
    this.visible ? this.hide() : this.show();
  }

  isOpen(): boolean {
    return this.visible;
  }
}
