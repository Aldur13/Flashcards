import type { TowerType, TechBranch, TechTreeNodeDef } from '../types';
import { TOWER_CONFIGS, getStarterTowers } from '../data/towers';

const TECH_TREE_NODES: TechTreeNodeDef[] = [
  // Firepower branch (col 0-2)
  { type: 'machine-gun', branch: 'firepower', col: 0, row: 0, prerequisites: [] },
  { type: 'railgun', branch: 'firepower', col: 1, row: 0, prerequisites: ['machine-gun'] },
  { type: 'sniper-nest', branch: 'firepower', col: 0, row: 1, prerequisites: [] },

  // Area Control branch (col 0-3)
  { type: 'tesla-coil', branch: 'area-control', col: 0, row: 0, prerequisites: [] },
  { type: 'arc-field', branch: 'area-control', col: 1, row: 0, prerequisites: ['tesla-coil'] },
  { type: 'ion-cannon', branch: 'area-control', col: 2, row: 0, prerequisites: ['arc-field'] },
  { type: 'missile-pod', branch: 'area-control', col: 0, row: 1, prerequisites: [] },
  { type: 'cluster-volley', branch: 'area-control', col: 1, row: 1, prerequisites: ['missile-pod'] },
  { type: 'anti-air-battery', branch: 'area-control', col: 2, row: 1, prerequisites: ['cluster-volley'] },

  // Support branch
  { type: 'watchtower', branch: 'support', col: 0, row: 0, prerequisites: [] },
  { type: 'shield-generator', branch: 'support', col: 0, row: 1, prerequisites: [] },
  { type: 'dome-barrier', branch: 'support', col: 1, row: 1, prerequisites: ['shield-generator'] },
  { type: 'repair-drone-bay', branch: 'support', col: 1, row: 0, prerequisites: ['watchtower'] },
  { type: 'field-hospital', branch: 'support', col: 2, row: 0, prerequisites: ['repair-drone-bay'] },
];

export class TechTreeManager {
  private unlocked: Set<TowerType> = new Set();
  private _rp: number = 150; // starting RP
  private onRpChange: (rp: number) => void;

  constructor(onRpChange: (rp: number) => void) {
    this.onRpChange = onRpChange;
    // All starter towers are available immediately
    for (const type of getStarterTowers()) {
      this.unlocked.add(type);
    }
  }

  get rp(): number {
    return this._rp;
  }

  addRp(amount: number): void {
    this._rp += amount;
    this.onRpChange(this._rp);
  }

  spendRp(amount: number): boolean {
    if (this._rp < amount) return false;
    this._rp -= amount;
    this.onRpChange(this._rp);
    return true;
  }

  isUnlocked(type: TowerType): boolean {
    return this.unlocked.has(type);
  }

  canUnlock(type: TowerType): boolean {
    const node = TECH_TREE_NODES.find((n) => n.type === type);
    if (!node) return false;
    if (this.unlocked.has(type)) return false;
    return node.prerequisites.every((p) => this.unlocked.has(p));
  }

  unlock(type: TowerType): boolean {
    if (!this.canUnlock(type)) return false;
    const cost = TOWER_CONFIGS[type].cost;
    if (!this.spendRp(cost)) return false;
    this.unlocked.add(type);
    return true;
  }

  canPlace(type: TowerType): boolean {
    return this.unlocked.has(type);
  }

  getNodes(): TechTreeNodeDef[] {
    return TECH_TREE_NODES;
  }

  getNodesForBranch(branch: TechBranch): TechTreeNodeDef[] {
    return TECH_TREE_NODES.filter((n) => n.branch === branch);
  }

  getUnlockedTypes(): TowerType[] {
    return Array.from(this.unlocked);
  }
}
