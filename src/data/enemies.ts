import type { EnemyConfig, EnemyType } from '../types';

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  crawler: {
    type: 'crawler',
    displayName: 'Crawler',
    maxHp: 60,
    speed: 120,
    armor: 0,
    isFlying: false,
    reward: 8,
    resistances: {},
    tint: 0x7fff00,
    scale: 0.8,
  },
  brute: {
    type: 'brute',
    displayName: 'Brute',
    maxHp: 400,
    speed: 55,
    armor: 0.5, // 50% ballistic reduction
    isFlying: false,
    reward: 25,
    resistances: {
      electric: 0.7, // insulated exoskeleton
    },
    tint: 0xa0522d,
    scale: 1.4,
  },
  drone: {
    type: 'drone',
    displayName: 'Drone',
    maxHp: 80,
    speed: 160,
    armor: 0,
    isFlying: true,
    reward: 15,
    resistances: {
      explosive: 0.3,
    },
    tint: 0x00bfff,
    scale: 0.7,
  },
  psychic: {
    type: 'psychic',
    displayName: 'Psychic',
    maxHp: 150,
    speed: 65,
    armor: 0.1,
    isFlying: false,
    reward: 30,
    resistances: {},
    debuffRadius: 140,
    debuffStrength: 0.4, // reduces fire rate by 40% in radius
    tint: 0xda70d6,
    scale: 1.0,
  },
  mothership: {
    type: 'mothership',
    displayName: 'Mothership',
    maxHp: 2500,
    speed: 30,
    armor: 0.3,
    isFlying: true,
    reward: 200,
    resistances: {
      ballistic: 0.4,
      electric: 0.5,
    },
    tint: 0xff1493,
    scale: 2.2,
  },
};

export function getEnemyConfig(type: EnemyType): EnemyConfig {
  return ENEMY_CONFIGS[type];
}
