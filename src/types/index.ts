export type TowerType =
  | 'machine-gun'
  | 'railgun'
  | 'sniper-nest'
  | 'tesla-coil'
  | 'arc-field'
  | 'ion-cannon'
  | 'missile-pod'
  | 'cluster-volley'
  | 'anti-air-battery'
  | 'watchtower'
  | 'shield-generator'
  | 'dome-barrier'
  | 'repair-drone-bay'
  | 'field-hospital';

export type EnemyType = 'crawler' | 'brute' | 'drone' | 'psychic' | 'mothership';

export type DamageType = 'ballistic' | 'energy' | 'explosive' | 'electric';

export type TechBranch = 'firepower' | 'area-control' | 'support';

export type TargetPriority = 'first' | 'strongest' | 'weakest' | 'nearest';

export interface Vec2 {
  x: number;
  y: number;
}

export interface TowerConfig {
  type: TowerType;
  displayName: string;
  description: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number; // shots per second
  damageType: DamageType;
  projectileSpeed: number;
  projectileColor: number;
  splashRadius?: number;
  chainCount?: number;
  isPassive: boolean;
  passiveEffect?: 'range-boost' | 'slow-field';
  passiveRadius?: number;
  passiveStrength?: number;
  isAntiAir: boolean;
  targetPriority: TargetPriority;
  techBranch: TechBranch;
  prerequisite?: TowerType;
  upgradesTo?: TowerType;
  tint: number;
  shape: 'rect' | 'diamond' | 'triangle';
  isStarter: boolean;
}

export interface EnemyConfig {
  type: EnemyType;
  displayName: string;
  maxHp: number;
  speed: number; // pixels per second
  armor: number; // 0-1 ballistic damage reduction
  isFlying: boolean;
  reward: number; // RP on kill
  resistances: Partial<Record<DamageType, number>>;
  debuffRadius?: number;
  debuffStrength?: number; // 0-1 fire rate reduction
  tint: number;
  scale: number;
}

export interface WaveEntry {
  enemyType: EnemyType;
  count: number;
  spawnInterval: number; // ms between each spawn
  delay: number; // ms after wave start before first spawn of this group
}

export interface WaveConfig {
  waveNumber: number;
  entries: WaveEntry[];
  bonusRp: number; // awarded if HP never drops during wave
}

export interface MapConfig {
  key: string;
  displayName: string;
  description: string;
  specialFeature: string;
  waypoints: Vec2[];
  buildSlots: Vec2[];
  cellSize: number;
  bgColor: number;
  pathColor: number;
  totalWaves: number;
}

export interface TechTreeNodeDef {
  type: TowerType;
  branch: TechBranch;
  col: number; // column in tech tree grid
  row: number; // row within branch
  prerequisites: TowerType[];
}

export interface GameState {
  hp: number;
  maxHp: number;
  rp: number;
  wave: number;
  score: number;
  mapKey: string;
  phase: 'build' | 'wave' | 'between' | 'gameover' | 'victory';
}
