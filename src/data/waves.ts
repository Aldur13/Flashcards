import type { WaveConfig } from '../types';

// Wave definitions for Outpost Bravo (map 1). 20 waves escalating in difficulty.
export const OUTPOST_BRAVO_WAVES: WaveConfig[] = [
  {
    waveNumber: 1,
    entries: [{ enemyType: 'crawler', count: 6, spawnInterval: 800, delay: 0 }],
    bonusRp: 20,
  },
  {
    waveNumber: 2,
    entries: [{ enemyType: 'crawler', count: 10, spawnInterval: 700, delay: 0 }],
    bonusRp: 20,
  },
  {
    waveNumber: 3,
    entries: [
      { enemyType: 'crawler', count: 8, spawnInterval: 600, delay: 0 },
      { enemyType: 'brute', count: 1, spawnInterval: 1000, delay: 2000 },
    ],
    bonusRp: 25,
  },
  {
    waveNumber: 4,
    entries: [
      { enemyType: 'crawler', count: 12, spawnInterval: 600, delay: 0 },
      { enemyType: 'brute', count: 2, spawnInterval: 1500, delay: 1500 },
    ],
    bonusRp: 30,
  },
  {
    waveNumber: 5,
    entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }],
    bonusRp: 80,
  },
  {
    waveNumber: 6,
    entries: [
      { enemyType: 'crawler', count: 15, spawnInterval: 500, delay: 0 },
      { enemyType: 'drone', count: 4, spawnInterval: 1000, delay: 1000 },
    ],
    bonusRp: 35,
  },
  {
    waveNumber: 7,
    entries: [
      { enemyType: 'drone', count: 8, spawnInterval: 600, delay: 0 },
      { enemyType: 'brute', count: 3, spawnInterval: 1200, delay: 2000 },
    ],
    bonusRp: 35,
  },
  {
    waveNumber: 8,
    entries: [
      { enemyType: 'crawler', count: 18, spawnInterval: 450, delay: 0 },
      { enemyType: 'psychic', count: 2, spawnInterval: 2000, delay: 3000 },
    ],
    bonusRp: 40,
  },
  {
    waveNumber: 9,
    entries: [
      { enemyType: 'psychic', count: 3, spawnInterval: 1500, delay: 0 },
      { enemyType: 'brute', count: 4, spawnInterval: 1000, delay: 2000 },
      { enemyType: 'drone', count: 6, spawnInterval: 800, delay: 1000 },
    ],
    bonusRp: 50,
  },
  {
    waveNumber: 10,
    entries: [
      { enemyType: 'crawler', count: 10, spawnInterval: 400, delay: 0 },
      { enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 5000 },
    ],
    bonusRp: 100,
  },
  {
    waveNumber: 11,
    entries: [
      { enemyType: 'brute', count: 5, spawnInterval: 900, delay: 0 },
      { enemyType: 'drone', count: 10, spawnInterval: 500, delay: 2000 },
    ],
    bonusRp: 45,
  },
  {
    waveNumber: 12,
    entries: [
      { enemyType: 'crawler', count: 25, spawnInterval: 350, delay: 0 },
      { enemyType: 'psychic', count: 4, spawnInterval: 1200, delay: 4000 },
    ],
    bonusRp: 50,
  },
  {
    waveNumber: 13,
    entries: [
      { enemyType: 'drone', count: 15, spawnInterval: 400, delay: 0 },
      { enemyType: 'brute', count: 5, spawnInterval: 800, delay: 3000 },
      { enemyType: 'psychic', count: 3, spawnInterval: 1500, delay: 1500 },
    ],
    bonusRp: 55,
  },
  {
    waveNumber: 14,
    entries: [
      { enemyType: 'crawler', count: 30, spawnInterval: 300, delay: 0 },
      { enemyType: 'brute', count: 6, spawnInterval: 700, delay: 5000 },
    ],
    bonusRp: 60,
  },
  {
    waveNumber: 15,
    entries: [
      { enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 },
      { enemyType: 'crawler', count: 15, spawnInterval: 400, delay: 3000 },
    ],
    bonusRp: 120,
  },
  {
    waveNumber: 16,
    entries: [
      { enemyType: 'psychic', count: 6, spawnInterval: 800, delay: 0 },
      { enemyType: 'drone', count: 20, spawnInterval: 350, delay: 2000 },
    ],
    bonusRp: 65,
  },
  {
    waveNumber: 17,
    entries: [
      { enemyType: 'brute', count: 8, spawnInterval: 600, delay: 0 },
      { enemyType: 'crawler', count: 20, spawnInterval: 300, delay: 2000 },
      { enemyType: 'psychic', count: 4, spawnInterval: 1000, delay: 4000 },
    ],
    bonusRp: 70,
  },
  {
    waveNumber: 18,
    entries: [
      { enemyType: 'drone', count: 25, spawnInterval: 300, delay: 0 },
      { enemyType: 'brute', count: 8, spawnInterval: 600, delay: 3000 },
      { enemyType: 'psychic', count: 5, spawnInterval: 900, delay: 1000 },
    ],
    bonusRp: 75,
  },
  {
    waveNumber: 19,
    entries: [
      { enemyType: 'crawler', count: 40, spawnInterval: 250, delay: 0 },
      { enemyType: 'brute', count: 10, spawnInterval: 500, delay: 5000 },
      { enemyType: 'drone', count: 15, spawnInterval: 350, delay: 2000 },
    ],
    bonusRp: 80,
  },
  {
    waveNumber: 20,
    entries: [
      { enemyType: 'mothership', count: 2, spawnInterval: 5000, delay: 0 },
      { enemyType: 'crawler', count: 20, spawnInterval: 300, delay: 3000 },
      { enemyType: 'psychic', count: 6, spawnInterval: 800, delay: 6000 },
      { enemyType: 'drone', count: 20, spawnInterval: 300, delay: 4000 },
    ],
    bonusRp: 200,
  },
];

export const WAVE_CONFIGS: Record<string, WaveConfig[]> = {
  'outpost-bravo': OUTPOST_BRAVO_WAVES,
};
