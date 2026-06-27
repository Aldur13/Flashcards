export type TowerType =
  // Firepower branch
  | 'machine-gun'
  | 'chaingun'
  | 'railgun'
  | 'sniper-nest'
  | 'anti-materiel-rifle'
  | 'flamethrower'
  | 'incinerator'
  | 'mortar'
  | 'howitzer'
  // Area-control branch
  | 'tesla-coil'
  | 'arc-field'
  | 'ion-cannon'
  | 'missile-pod'
  | 'cluster-volley'
  | 'anti-air-battery'
  | 'freeze-ray'
  | 'cryo-cannon'
  | 'gravity-well'
  | 'singularity'
  // Support branch
  | 'watchtower'
  | 'radar-station'
  | 'command-bunker'
  | 'shield-generator'
  | 'dome-barrier'
  | 'ammo-depot'
  | 'repair-drone-bay'
  | 'field-hospital';

export type EnemyType =
  | 'crawler'
  | 'berserker'
  | 'brute'
  | 'shielder'
  | 'titan'
  | 'drone'
  | 'healer'
  | 'psychic'
  | 'infiltrator'
  | 'mothership';

export type DamageType = 'ballistic' | 'energy' | 'explosive' | 'electric' | 'fire';

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
  fireRate: number;
  damageType: DamageType;
  projectileSpeed: number;
  projectileColor: number;
  splashRadius?: number;
  chainCount?: number;
  slowOnHit?: number;       // 0-1: speed multiplier applied on hit (e.g. 0.4 = 60% slow)
  slowHitDuration?: number; // ms the hit-slow lasts
  isFlameCone?: boolean;    // fires in a cone rather than a projectile
  flameAngle?: number;      // half-cone angle in radians
  isPassive: boolean;
  passiveEffect?: 'range-boost' | 'slow-field' | 'fire-rate-boost';
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
  speed: number;
  armor: number;
  isFlying: boolean;
  reward: number;
  resistances: Partial<Record<DamageType, number>>;
  baseReachDamage: number;     // HP subtracted from player base when this enemy gets through
  // Optional special mechanics
  debuffRadius?: number;
  debuffStrength?: number;
  healRadius?: number;
  healPerSecond?: number;
  regenPerSecond?: number;
  phaseInterval?: number;
  phaseDuration?: number;
  shieldCycleDuration?: number;
  shieldDownDuration?: number;
  shieldDamageReduction?: number;
  tint: number;
  scale: number;
}

export interface WaveEntry {
  enemyType: EnemyType;
  count: number;
  spawnInterval: number;
  delay: number;
}

export interface WaveConfig {
  waveNumber: number;
  entries: WaveEntry[];
  bonusRp: number;
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
  col: number;
  row: number;
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
