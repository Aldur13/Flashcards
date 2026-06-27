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

// Arctic Station — introduces berserker (wave 4), shielder (wave 7)
export const ARCTIC_STATION_WAVES: WaveConfig[] = [
  { waveNumber: 1, entries: [{ enemyType: 'crawler', count: 8, spawnInterval: 750, delay: 0 }], bonusRp: 20 },
  { waveNumber: 2, entries: [{ enemyType: 'crawler', count: 12, spawnInterval: 650, delay: 0 }, { enemyType: 'brute', count: 1, spawnInterval: 0, delay: 3000 }], bonusRp: 25 },
  { waveNumber: 3, entries: [{ enemyType: 'crawler', count: 10, spawnInterval: 550, delay: 0 }, { enemyType: 'brute', count: 2, spawnInterval: 1500, delay: 2000 }], bonusRp: 25 },
  { waveNumber: 4, entries: [{ enemyType: 'berserker', count: 6, spawnInterval: 600, delay: 0 }, { enemyType: 'crawler', count: 8, spawnInterval: 500, delay: 2000 }], bonusRp: 30 },
  { waveNumber: 5, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }], bonusRp: 80 },
  { waveNumber: 6, entries: [{ enemyType: 'berserker', count: 10, spawnInterval: 500, delay: 0 }, { enemyType: 'drone', count: 5, spawnInterval: 800, delay: 2000 }], bonusRp: 35 },
  { waveNumber: 7, entries: [{ enemyType: 'shielder', count: 3, spawnInterval: 1200, delay: 0 }, { enemyType: 'berserker', count: 8, spawnInterval: 450, delay: 2000 }], bonusRp: 40 },
  { waveNumber: 8, entries: [{ enemyType: 'crawler', count: 20, spawnInterval: 400, delay: 0 }, { enemyType: 'shielder', count: 4, spawnInterval: 1000, delay: 4000 }, { enemyType: 'drone', count: 6, spawnInterval: 700, delay: 1000 }], bonusRp: 45 },
  { waveNumber: 9, entries: [{ enemyType: 'brute', count: 5, spawnInterval: 900, delay: 0 }, { enemyType: 'shielder', count: 5, spawnInterval: 1000, delay: 2000 }, { enemyType: 'berserker', count: 12, spawnInterval: 400, delay: 1000 }], bonusRp: 55 },
  { waveNumber: 10, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'crawler', count: 15, spawnInterval: 350, delay: 4000 }], bonusRp: 100 },
  { waveNumber: 11, entries: [{ enemyType: 'shielder', count: 6, spawnInterval: 900, delay: 0 }, { enemyType: 'drone', count: 12, spawnInterval: 450, delay: 2000 }], bonusRp: 50 },
  { waveNumber: 12, entries: [{ enemyType: 'berserker', count: 18, spawnInterval: 350, delay: 0 }, { enemyType: 'brute', count: 5, spawnInterval: 800, delay: 4000 }], bonusRp: 55 },
  { waveNumber: 13, entries: [{ enemyType: 'psychic', count: 3, spawnInterval: 1200, delay: 0 }, { enemyType: 'shielder', count: 7, spawnInterval: 800, delay: 2000 }, { enemyType: 'drone', count: 10, spawnInterval: 450, delay: 1000 }], bonusRp: 60 },
  { waveNumber: 14, entries: [{ enemyType: 'crawler', count: 30, spawnInterval: 280, delay: 0 }, { enemyType: 'shielder', count: 8, spawnInterval: 700, delay: 5000 }], bonusRp: 65 },
  { waveNumber: 15, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'berserker', count: 15, spawnInterval: 300, delay: 4000 }], bonusRp: 120 },
  { waveNumber: 16, entries: [{ enemyType: 'psychic', count: 5, spawnInterval: 900, delay: 0 }, { enemyType: 'brute', count: 8, spawnInterval: 700, delay: 2000 }, { enemyType: 'drone', count: 15, spawnInterval: 350, delay: 1000 }], bonusRp: 70 },
  { waveNumber: 17, entries: [{ enemyType: 'shielder', count: 10, spawnInterval: 600, delay: 0 }, { enemyType: 'berserker', count: 20, spawnInterval: 280, delay: 3000 }], bonusRp: 75 },
  { waveNumber: 18, entries: [{ enemyType: 'brute', count: 10, spawnInterval: 600, delay: 0 }, { enemyType: 'shielder', count: 10, spawnInterval: 650, delay: 2000 }, { enemyType: 'psychic', count: 5, spawnInterval: 800, delay: 1000 }], bonusRp: 80 },
  { waveNumber: 19, entries: [{ enemyType: 'crawler', count: 40, spawnInterval: 240, delay: 0 }, { enemyType: 'berserker', count: 20, spawnInterval: 250, delay: 5000 }, { enemyType: 'drone', count: 20, spawnInterval: 300, delay: 2000 }], bonusRp: 85 },
  { waveNumber: 20, entries: [{ enemyType: 'mothership', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'shielder', count: 12, spawnInterval: 600, delay: 3000 }, { enemyType: 'berserker', count: 25, spawnInterval: 240, delay: 6000 }], bonusRp: 200 },
];

// City Block — introduces healer (wave 4), infiltrator (wave 6), titan (wave 9)
export const CITY_BLOCK_WAVES: WaveConfig[] = [
  { waveNumber: 1, entries: [{ enemyType: 'crawler', count: 10, spawnInterval: 700, delay: 0 }, { enemyType: 'berserker', count: 3, spawnInterval: 600, delay: 2000 }], bonusRp: 22 },
  { waveNumber: 2, entries: [{ enemyType: 'crawler', count: 14, spawnInterval: 600, delay: 0 }, { enemyType: 'brute', count: 2, spawnInterval: 1200, delay: 2500 }], bonusRp: 28 },
  { waveNumber: 3, entries: [{ enemyType: 'berserker', count: 10, spawnInterval: 500, delay: 0 }, { enemyType: 'drone', count: 5, spawnInterval: 700, delay: 2000 }, { enemyType: 'brute', count: 2, spawnInterval: 1200, delay: 1000 }], bonusRp: 30 },
  { waveNumber: 4, entries: [{ enemyType: 'healer', count: 2, spawnInterval: 2000, delay: 0 }, { enemyType: 'crawler', count: 15, spawnInterval: 500, delay: 500 }, { enemyType: 'berserker', count: 6, spawnInterval: 600, delay: 3000 }], bonusRp: 40 },
  { waveNumber: 5, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }], bonusRp: 80 },
  { waveNumber: 6, entries: [{ enemyType: 'infiltrator', count: 5, spawnInterval: 700, delay: 0 }, { enemyType: 'shielder', count: 4, spawnInterval: 1000, delay: 2000 }, { enemyType: 'drone', count: 8, spawnInterval: 600, delay: 1000 }], bonusRp: 45 },
  { waveNumber: 7, entries: [{ enemyType: 'healer', count: 3, spawnInterval: 1500, delay: 0 }, { enemyType: 'crawler', count: 20, spawnInterval: 380, delay: 500 }, { enemyType: 'infiltrator', count: 6, spawnInterval: 600, delay: 2000 }], bonusRp: 50 },
  { waveNumber: 8, entries: [{ enemyType: 'psychic', count: 4, spawnInterval: 1000, delay: 0 }, { enemyType: 'brute', count: 5, spawnInterval: 800, delay: 2000 }, { enemyType: 'shielder', count: 5, spawnInterval: 900, delay: 1000 }], bonusRp: 55 },
  { waveNumber: 9, entries: [{ enemyType: 'titan', count: 1, spawnInterval: 0, delay: 0 }, { enemyType: 'healer', count: 3, spawnInterval: 1200, delay: 1500 }, { enemyType: 'berserker', count: 15, spawnInterval: 350, delay: 2000 }], bonusRp: 70 },
  { waveNumber: 10, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 8000 }], bonusRp: 120 },
  { waveNumber: 11, entries: [{ enemyType: 'infiltrator', count: 10, spawnInterval: 500, delay: 0 }, { enemyType: 'drone', count: 15, spawnInterval: 400, delay: 2000 }, { enemyType: 'healer', count: 3, spawnInterval: 1000, delay: 1000 }], bonusRp: 60 },
  { waveNumber: 12, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 4000, delay: 0 }, { enemyType: 'shielder', count: 8, spawnInterval: 700, delay: 3000 }], bonusRp: 70 },
  { waveNumber: 13, entries: [{ enemyType: 'crawler', count: 30, spawnInterval: 280, delay: 0 }, { enemyType: 'healer', count: 4, spawnInterval: 1200, delay: 1500 }, { enemyType: 'psychic', count: 4, spawnInterval: 900, delay: 4000 }], bonusRp: 70 },
  { waveNumber: 14, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'infiltrator', count: 12, spawnInterval: 450, delay: 2000 }, { enemyType: 'berserker', count: 20, spawnInterval: 280, delay: 1000 }], bonusRp: 80 },
  { waveNumber: 15, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'healer', count: 5, spawnInterval: 1000, delay: 2000 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 10000 }], bonusRp: 130 },
  { waveNumber: 16, entries: [{ enemyType: 'psychic', count: 6, spawnInterval: 800, delay: 0 }, { enemyType: 'shielder', count: 10, spawnInterval: 600, delay: 2000 }, { enemyType: 'infiltrator', count: 12, spawnInterval: 400, delay: 1000 }], bonusRp: 80 },
  { waveNumber: 17, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 0 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 3000 }, { enemyType: 'crawler', count: 30, spawnInterval: 250, delay: 2000 }], bonusRp: 85 },
  { waveNumber: 18, entries: [{ enemyType: 'berserker', count: 25, spawnInterval: 260, delay: 0 }, { enemyType: 'infiltrator', count: 15, spawnInterval: 380, delay: 3000 }, { enemyType: 'psychic', count: 6, spawnInterval: 800, delay: 1000 }], bonusRp: 90 },
  { waveNumber: 19, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 0 }, { enemyType: 'shielder', count: 12, spawnInterval: 550, delay: 3000 }, { enemyType: 'healer', count: 6, spawnInterval: 900, delay: 1500 }, { enemyType: 'drone', count: 20, spawnInterval: 300, delay: 2000 }], bonusRp: 95 },
  { waveNumber: 20, entries: [{ enemyType: 'mothership', count: 2, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 8000 }, { enemyType: 'healer', count: 8, spawnInterval: 800, delay: 4000 }], bonusRp: 250 },
];

// Jungle Ruins — dense psychic and infiltrator presence
export const JUNGLE_RUINS_WAVES: WaveConfig[] = [
  { waveNumber: 1, entries: [{ enemyType: 'crawler', count: 10, spawnInterval: 700, delay: 0 }, { enemyType: 'infiltrator', count: 2, spawnInterval: 900, delay: 2000 }], bonusRp: 25 },
  { waveNumber: 2, entries: [{ enemyType: 'berserker', count: 8, spawnInterval: 550, delay: 0 }, { enemyType: 'infiltrator', count: 4, spawnInterval: 800, delay: 1500 }], bonusRp: 28 },
  { waveNumber: 3, entries: [{ enemyType: 'psychic', count: 3, spawnInterval: 1200, delay: 0 }, { enemyType: 'crawler', count: 15, spawnInterval: 450, delay: 1000 }, { enemyType: 'infiltrator', count: 5, spawnInterval: 700, delay: 2000 }], bonusRp: 35 },
  { waveNumber: 4, entries: [{ enemyType: 'shielder', count: 4, spawnInterval: 1100, delay: 0 }, { enemyType: 'infiltrator', count: 8, spawnInterval: 600, delay: 2000 }, { enemyType: 'psychic', count: 3, spawnInterval: 1000, delay: 1000 }], bonusRp: 40 },
  { waveNumber: 5, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'infiltrator', count: 6, spawnInterval: 600, delay: 6000 }], bonusRp: 90 },
  { waveNumber: 6, entries: [{ enemyType: 'healer', count: 3, spawnInterval: 1400, delay: 0 }, { enemyType: 'crawler', count: 20, spawnInterval: 380, delay: 500 }, { enemyType: 'psychic', count: 4, spawnInterval: 900, delay: 3000 }], bonusRp: 45 },
  { waveNumber: 7, entries: [{ enemyType: 'infiltrator', count: 12, spawnInterval: 500, delay: 0 }, { enemyType: 'brute', count: 4, spawnInterval: 1000, delay: 3000 }, { enemyType: 'drone', count: 8, spawnInterval: 600, delay: 1000 }], bonusRp: 55 },
  { waveNumber: 8, entries: [{ enemyType: 'titan', count: 1, spawnInterval: 0, delay: 0 }, { enemyType: 'healer', count: 4, spawnInterval: 1200, delay: 2000 }, { enemyType: 'infiltrator', count: 10, spawnInterval: 450, delay: 1000 }], bonusRp: 65 },
  { waveNumber: 9, entries: [{ enemyType: 'psychic', count: 6, spawnInterval: 800, delay: 0 }, { enemyType: 'shielder', count: 6, spawnInterval: 800, delay: 2000 }, { enemyType: 'berserker', count: 15, spawnInterval: 350, delay: 1000 }], bonusRp: 70 },
  { waveNumber: 10, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 8000 }, { enemyType: 'infiltrator', count: 10, spawnInterval: 450, delay: 3000 }], bonusRp: 130 },
  { waveNumber: 11, entries: [{ enemyType: 'healer', count: 5, spawnInterval: 1000, delay: 0 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 2000 }, { enemyType: 'crawler', count: 25, spawnInterval: 300, delay: 1000 }], bonusRp: 75 },
  { waveNumber: 12, entries: [{ enemyType: 'infiltrator', count: 15, spawnInterval: 400, delay: 0 }, { enemyType: 'psychic', count: 6, spawnInterval: 750, delay: 2000 }, { enemyType: 'shielder', count: 6, spawnInterval: 750, delay: 3000 }], bonusRp: 80 },
  { waveNumber: 13, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 3000 }, { enemyType: 'berserker', count: 20, spawnInterval: 280, delay: 2000 }], bonusRp: 85 },
  { waveNumber: 14, entries: [{ enemyType: 'drone', count: 20, spawnInterval: 350, delay: 0 }, { enemyType: 'infiltrator', count: 15, spawnInterval: 400, delay: 2000 }, { enemyType: 'psychic', count: 7, spawnInterval: 700, delay: 4000 }], bonusRp: 90 },
  { waveNumber: 15, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 6000 }, { enemyType: 'healer', count: 6, spawnInterval: 900, delay: 3000 }], bonusRp: 150 },
  { waveNumber: 16, entries: [{ enemyType: 'infiltrator', count: 20, spawnInterval: 360, delay: 0 }, { enemyType: 'shielder', count: 10, spawnInterval: 600, delay: 3000 }, { enemyType: 'psychic', count: 7, spawnInterval: 700, delay: 1500 }], bonusRp: 90 },
  { waveNumber: 17, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 0 }, { enemyType: 'healer', count: 7, spawnInterval: 800, delay: 3000 }, { enemyType: 'crawler', count: 35, spawnInterval: 230, delay: 2000 }], bonusRp: 95 },
  { waveNumber: 18, entries: [{ enemyType: 'brute', count: 12, spawnInterval: 550, delay: 0 }, { enemyType: 'shielder', count: 10, spawnInterval: 550, delay: 3000 }, { enemyType: 'infiltrator', count: 18, spawnInterval: 330, delay: 1500 }], bonusRp: 100 },
  { waveNumber: 19, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 0 }, { enemyType: 'healer', count: 8, spawnInterval: 750, delay: 3000 }, { enemyType: 'psychic', count: 8, spawnInterval: 700, delay: 1000 }, { enemyType: 'infiltrator', count: 20, spawnInterval: 300, delay: 2000 }], bonusRp: 110 },
  { waveNumber: 20, entries: [{ enemyType: 'mothership', count: 2, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 8000 }, { enemyType: 'healer', count: 10, spawnInterval: 700, delay: 4000 }, { enemyType: 'infiltrator', count: 25, spawnInterval: 280, delay: 5000 }], bonusRp: 280 },
];

// Beach Landing — drone-heavy amphibious assault
export const BEACH_LANDING_WAVES: WaveConfig[] = [
  { waveNumber: 1, entries: [{ enemyType: 'drone', count: 8, spawnInterval: 700, delay: 0 }, { enemyType: 'crawler', count: 8, spawnInterval: 600, delay: 1500 }], bonusRp: 25 },
  { waveNumber: 2, entries: [{ enemyType: 'drone', count: 12, spawnInterval: 600, delay: 0 }, { enemyType: 'berserker', count: 6, spawnInterval: 550, delay: 2000 }], bonusRp: 30 },
  { waveNumber: 3, entries: [{ enemyType: 'drone', count: 15, spawnInterval: 500, delay: 0 }, { enemyType: 'brute', count: 3, spawnInterval: 1200, delay: 2000 }, { enemyType: 'crawler', count: 12, spawnInterval: 450, delay: 1000 }], bonusRp: 35 },
  { waveNumber: 4, entries: [{ enemyType: 'healer', count: 3, spawnInterval: 1500, delay: 0 }, { enemyType: 'drone', count: 18, spawnInterval: 450, delay: 1000 }, { enemyType: 'berserker', count: 8, spawnInterval: 500, delay: 2500 }], bonusRp: 45 },
  { waveNumber: 5, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'drone', count: 10, spawnInterval: 500, delay: 5000 }], bonusRp: 90 },
  { waveNumber: 6, entries: [{ enemyType: 'titan', count: 1, spawnInterval: 0, delay: 0 }, { enemyType: 'healer', count: 3, spawnInterval: 1200, delay: 1500 }, { enemyType: 'drone', count: 20, spawnInterval: 400, delay: 2000 }], bonusRp: 65 },
  { waveNumber: 7, entries: [{ enemyType: 'drone', count: 25, spawnInterval: 380, delay: 0 }, { enemyType: 'shielder', count: 5, spawnInterval: 1000, delay: 3000 }, { enemyType: 'healer', count: 4, spawnInterval: 1100, delay: 1500 }], bonusRp: 60 },
  { waveNumber: 8, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'brute', count: 6, spawnInterval: 800, delay: 4000 }, { enemyType: 'drone', count: 20, spawnInterval: 380, delay: 2000 }], bonusRp: 75 },
  { waveNumber: 9, entries: [{ enemyType: 'healer', count: 5, spawnInterval: 1000, delay: 0 }, { enemyType: 'shielder', count: 6, spawnInterval: 900, delay: 2000 }, { enemyType: 'infiltrator', count: 8, spawnInterval: 600, delay: 1000 }], bonusRp: 80 },
  { waveNumber: 10, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 2, spawnInterval: 6000, delay: 6000 }], bonusRp: 140 },
  { waveNumber: 11, entries: [{ enemyType: 'drone', count: 30, spawnInterval: 320, delay: 0 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 2000 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 4000 }], bonusRp: 80 },
  { waveNumber: 12, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 0 }, { enemyType: 'shielder', count: 8, spawnInterval: 700, delay: 4000 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 2000 }], bonusRp: 90 },
  { waveNumber: 13, entries: [{ enemyType: 'drone', count: 35, spawnInterval: 300, delay: 0 }, { enemyType: 'berserker', count: 20, spawnInterval: 300, delay: 4000 }, { enemyType: 'healer', count: 6, spawnInterval: 850, delay: 2000 }], bonusRp: 90 },
  { waveNumber: 14, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 0 }, { enemyType: 'psychic', count: 5, spawnInterval: 800, delay: 3000 }, { enemyType: 'infiltrator', count: 12, spawnInterval: 450, delay: 2000 }], bonusRp: 100 },
  { waveNumber: 15, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 7000 }, { enemyType: 'drone', count: 25, spawnInterval: 320, delay: 3000 }], bonusRp: 160 },
  { waveNumber: 16, entries: [{ enemyType: 'healer', count: 8, spawnInterval: 800, delay: 0 }, { enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 4000 }, { enemyType: 'shielder', count: 10, spawnInterval: 600, delay: 2000 }], bonusRp: 100 },
  { waveNumber: 17, entries: [{ enemyType: 'drone', count: 40, spawnInterval: 280, delay: 0 }, { enemyType: 'infiltrator', count: 15, spawnInterval: 380, delay: 4000 }, { enemyType: 'healer', count: 7, spawnInterval: 750, delay: 2000 }], bonusRp: 105 },
  { waveNumber: 18, entries: [{ enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 0 }, { enemyType: 'brute', count: 12, spawnInterval: 550, delay: 5000 }, { enemyType: 'healer', count: 8, spawnInterval: 750, delay: 2500 }], bonusRp: 110 },
  { waveNumber: 19, entries: [{ enemyType: 'drone', count: 45, spawnInterval: 260, delay: 0 }, { enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 6000 }, { enemyType: 'healer', count: 10, spawnInterval: 700, delay: 3000 }, { enemyType: 'psychic', count: 6, spawnInterval: 750, delay: 1000 }], bonusRp: 120 },
  { waveNumber: 20, entries: [{ enemyType: 'mothership', count: 3, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 4, spawnInterval: 4500, delay: 10000 }, { enemyType: 'healer', count: 12, spawnInterval: 650, delay: 5000 }, { enemyType: 'drone', count: 30, spawnInterval: 280, delay: 4000 }], bonusRp: 300 },
];

// Mountain Pass — brute/shielder/titan heavy, narrow choke
export const MOUNTAIN_PASS_WAVES: WaveConfig[] = [
  { waveNumber: 1, entries: [{ enemyType: 'brute', count: 3, spawnInterval: 1200, delay: 0 }, { enemyType: 'crawler', count: 10, spawnInterval: 600, delay: 1000 }], bonusRp: 25 },
  { waveNumber: 2, entries: [{ enemyType: 'brute', count: 5, spawnInterval: 1000, delay: 0 }, { enemyType: 'shielder', count: 3, spawnInterval: 1200, delay: 2000 }], bonusRp: 30 },
  { waveNumber: 3, entries: [{ enemyType: 'shielder', count: 6, spawnInterval: 900, delay: 0 }, { enemyType: 'berserker', count: 10, spawnInterval: 500, delay: 2000 }, { enemyType: 'brute', count: 4, spawnInterval: 900, delay: 1000 }], bonusRp: 38 },
  { waveNumber: 4, entries: [{ enemyType: 'brute', count: 6, spawnInterval: 900, delay: 0 }, { enemyType: 'shielder', count: 7, spawnInterval: 800, delay: 2000 }, { enemyType: 'crawler', count: 18, spawnInterval: 380, delay: 1000 }], bonusRp: 45 },
  { waveNumber: 5, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'brute', count: 4, spawnInterval: 900, delay: 5000 }], bonusRp: 90 },
  { waveNumber: 6, entries: [{ enemyType: 'titan', count: 1, spawnInterval: 0, delay: 0 }, { enemyType: 'shielder', count: 8, spawnInterval: 750, delay: 2000 }, { enemyType: 'brute', count: 6, spawnInterval: 850, delay: 1500 }], bonusRp: 70 },
  { waveNumber: 7, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'shielder', count: 10, spawnInterval: 700, delay: 4000 }, { enemyType: 'berserker', count: 15, spawnInterval: 350, delay: 2000 }], bonusRp: 80 },
  { waveNumber: 8, entries: [{ enemyType: 'healer', count: 3, spawnInterval: 1200, delay: 0 }, { enemyType: 'brute', count: 8, spawnInterval: 800, delay: 1500 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 5000 }], bonusRp: 85 },
  { waveNumber: 9, entries: [{ enemyType: 'shielder', count: 12, spawnInterval: 650, delay: 0 }, { enemyType: 'psychic', count: 5, spawnInterval: 800, delay: 2000 }, { enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 4000 }], bonusRp: 90 },
  { waveNumber: 10, entries: [{ enemyType: 'mothership', count: 2, spawnInterval: 7000, delay: 0 }, { enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 8000 }], bonusRp: 160 },
  { waveNumber: 11, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 3000 }, { enemyType: 'brute', count: 10, spawnInterval: 700, delay: 2000 }], bonusRp: 90 },
  { waveNumber: 12, entries: [{ enemyType: 'shielder', count: 15, spawnInterval: 600, delay: 0 }, { enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 5000 }, { enemyType: 'psychic', count: 5, spawnInterval: 800, delay: 2000 }], bonusRp: 100 },
  { waveNumber: 13, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 0 }, { enemyType: 'healer', count: 6, spawnInterval: 850, delay: 4000 }, { enemyType: 'shielder', count: 12, spawnInterval: 600, delay: 2000 }], bonusRp: 105 },
  { waveNumber: 14, entries: [{ enemyType: 'crawler', count: 40, spawnInterval: 240, delay: 0 }, { enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 6000 }, { enemyType: 'healer', count: 6, spawnInterval: 800, delay: 3000 }], bonusRp: 110 },
  { waveNumber: 15, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 6000 }, { enemyType: 'healer', count: 8, spawnInterval: 750, delay: 4000 }], bonusRp: 170 },
  { waveNumber: 16, entries: [{ enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 0 }, { enemyType: 'shielder', count: 15, spawnInterval: 550, delay: 5000 }, { enemyType: 'psychic', count: 7, spawnInterval: 700, delay: 2000 }], bonusRp: 110 },
  { waveNumber: 17, entries: [{ enemyType: 'brute', count: 15, spawnInterval: 550, delay: 0 }, { enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 5000 }, { enemyType: 'healer', count: 8, spawnInterval: 750, delay: 3000 }], bonusRp: 115 },
  { waveNumber: 18, entries: [{ enemyType: 'titan', count: 5, spawnInterval: 4000, delay: 0 }, { enemyType: 'shielder', count: 15, spawnInterval: 520, delay: 5000 }, { enemyType: 'healer', count: 10, spawnInterval: 700, delay: 3000 }, { enemyType: 'psychic', count: 7, spawnInterval: 700, delay: 2000 }], bonusRp: 120 },
  { waveNumber: 19, entries: [{ enemyType: 'titan', count: 5, spawnInterval: 3800, delay: 0 }, { enemyType: 'brute', count: 15, spawnInterval: 520, delay: 5000 }, { enemyType: 'healer', count: 10, spawnInterval: 680, delay: 3000 }, { enemyType: 'infiltrator', count: 15, spawnInterval: 380, delay: 2000 }], bonusRp: 130 },
  { waveNumber: 20, entries: [{ enemyType: 'mothership', count: 3, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 6, spawnInterval: 4000, delay: 10000 }, { enemyType: 'healer', count: 12, spawnInterval: 650, delay: 5000 }, { enemyType: 'shielder', count: 15, spawnInterval: 500, delay: 3000 }], bonusRp: 350 },
];

// The Crater — endgame, all types, bosses every 5 waves
export const THE_CRATER_WAVES: WaveConfig[] = [
  { waveNumber: 1, entries: [{ enemyType: 'berserker', count: 8, spawnInterval: 600, delay: 0 }, { enemyType: 'shielder', count: 4, spawnInterval: 1000, delay: 1500 }], bonusRp: 30 },
  { waveNumber: 2, entries: [{ enemyType: 'infiltrator', count: 6, spawnInterval: 700, delay: 0 }, { enemyType: 'brute', count: 4, spawnInterval: 1000, delay: 2000 }, { enemyType: 'drone', count: 10, spawnInterval: 500, delay: 1000 }], bonusRp: 38 },
  { waveNumber: 3, entries: [{ enemyType: 'healer', count: 3, spawnInterval: 1300, delay: 0 }, { enemyType: 'crawler', count: 20, spawnInterval: 380, delay: 500 }, { enemyType: 'shielder', count: 6, spawnInterval: 800, delay: 2500 }], bonusRp: 45 },
  { waveNumber: 4, entries: [{ enemyType: 'titan', count: 1, spawnInterval: 0, delay: 0 }, { enemyType: 'psychic', count: 5, spawnInterval: 850, delay: 2000 }, { enemyType: 'infiltrator', count: 10, spawnInterval: 500, delay: 1000 }], bonusRp: 65 },
  { waveNumber: 5, entries: [{ enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 500 }, { enemyType: 'titan', count: 1, spawnInterval: 0, delay: 8000 }, { enemyType: 'healer', count: 4, spawnInterval: 1000, delay: 3000 }], bonusRp: 120 },
  { waveNumber: 6, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'shielder', count: 8, spawnInterval: 750, delay: 3000 }, { enemyType: 'healer', count: 4, spawnInterval: 1000, delay: 2000 }, { enemyType: 'drone', count: 15, spawnInterval: 380, delay: 1000 }], bonusRp: 80 },
  { waveNumber: 7, entries: [{ enemyType: 'psychic', count: 6, spawnInterval: 800, delay: 0 }, { enemyType: 'infiltrator', count: 12, spawnInterval: 450, delay: 2000 }, { enemyType: 'berserker', count: 20, spawnInterval: 300, delay: 1000 }], bonusRp: 85 },
  { waveNumber: 8, entries: [{ enemyType: 'titan', count: 2, spawnInterval: 5000, delay: 0 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 3000 }, { enemyType: 'brute', count: 10, spawnInterval: 650, delay: 2000 }, { enemyType: 'shielder', count: 8, spawnInterval: 700, delay: 1000 }], bonusRp: 95 },
  { waveNumber: 9, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 0 }, { enemyType: 'psychic', count: 7, spawnInterval: 750, delay: 3000 }, { enemyType: 'infiltrator', count: 15, spawnInterval: 400, delay: 2000 }, { enemyType: 'healer', count: 5, spawnInterval: 900, delay: 1500 }], bonusRp: 110 },
  { waveNumber: 10, entries: [{ enemyType: 'mothership', count: 2, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 9000 }, { enemyType: 'healer', count: 6, spawnInterval: 850, delay: 5000 }], bonusRp: 200 },
  { waveNumber: 11, entries: [{ enemyType: 'titan', count: 3, spawnInterval: 4000, delay: 0 }, { enemyType: 'shielder', count: 12, spawnInterval: 600, delay: 4000 }, { enemyType: 'drone', count: 25, spawnInterval: 320, delay: 2000 }, { enemyType: 'healer', count: 6, spawnInterval: 850, delay: 2500 }], bonusRp: 110 },
  { waveNumber: 12, entries: [{ enemyType: 'crawler', count: 40, spawnInterval: 240, delay: 0 }, { enemyType: 'titan', count: 3, spawnInterval: 4500, delay: 6000 }, { enemyType: 'psychic', count: 8, spawnInterval: 700, delay: 3000 }, { enemyType: 'infiltrator', count: 18, spawnInterval: 360, delay: 2000 }], bonusRp: 120 },
  { waveNumber: 13, entries: [{ enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 0 }, { enemyType: 'healer', count: 8, spawnInterval: 800, delay: 4000 }, { enemyType: 'shielder', count: 14, spawnInterval: 560, delay: 3000 }, { enemyType: 'berserker', count: 25, spawnInterval: 280, delay: 2000 }], bonusRp: 130 },
  { waveNumber: 14, entries: [{ enemyType: 'drone', count: 40, spawnInterval: 280, delay: 0 }, { enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 6000 }, { enemyType: 'healer', count: 8, spawnInterval: 780, delay: 3000 }, { enemyType: 'psychic', count: 8, spawnInterval: 700, delay: 2000 }], bonusRp: 140 },
  { waveNumber: 15, entries: [{ enemyType: 'mothership', count: 2, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 4, spawnInterval: 4000, delay: 10000 }, { enemyType: 'healer', count: 10, spawnInterval: 750, delay: 6000 }, { enemyType: 'infiltrator', count: 20, spawnInterval: 330, delay: 4000 }], bonusRp: 250 },
  { waveNumber: 16, entries: [{ enemyType: 'titan', count: 5, spawnInterval: 3800, delay: 0 }, { enemyType: 'healer', count: 10, spawnInterval: 730, delay: 5000 }, { enemyType: 'shielder', count: 15, spawnInterval: 530, delay: 3000 }, { enemyType: 'psychic', count: 9, spawnInterval: 670, delay: 2000 }], bonusRp: 150 },
  { waveNumber: 17, entries: [{ enemyType: 'crawler', count: 50, spawnInterval: 210, delay: 0 }, { enemyType: 'titan', count: 5, spawnInterval: 3800, delay: 6000 }, { enemyType: 'healer', count: 10, spawnInterval: 720, delay: 3000 }, { enemyType: 'infiltrator', count: 22, spawnInterval: 310, delay: 2000 }], bonusRp: 160 },
  { waveNumber: 18, entries: [{ enemyType: 'titan', count: 6, spawnInterval: 3600, delay: 0 }, { enemyType: 'mothership', count: 1, spawnInterval: 0, delay: 12000 }, { enemyType: 'healer', count: 12, spawnInterval: 700, delay: 5000 }, { enemyType: 'shielder', count: 15, spawnInterval: 510, delay: 3000 }], bonusRp: 180 },
  { waveNumber: 19, entries: [{ enemyType: 'titan', count: 6, spawnInterval: 3500, delay: 0 }, { enemyType: 'healer', count: 12, spawnInterval: 680, delay: 5000 }, { enemyType: 'psychic', count: 10, spawnInterval: 650, delay: 3000 }, { enemyType: 'infiltrator', count: 25, spawnInterval: 290, delay: 2000 }, { enemyType: 'drone', count: 40, spawnInterval: 260, delay: 1000 }], bonusRp: 200 },
  { waveNumber: 20, entries: [{ enemyType: 'mothership', count: 4, spawnInterval: 6000, delay: 0 }, { enemyType: 'titan', count: 8, spawnInterval: 3500, delay: 12000 }, { enemyType: 'healer', count: 15, spawnInterval: 650, delay: 7000 }, { enemyType: 'infiltrator', count: 30, spawnInterval: 270, delay: 5000 }, { enemyType: 'shielder', count: 20, spawnInterval: 480, delay: 3000 }], bonusRp: 500 },
];

export const WAVE_CONFIGS: Record<string, WaveConfig[]> = {
  'outpost-bravo': OUTPOST_BRAVO_WAVES,
  'arctic-station': ARCTIC_STATION_WAVES,
  'city-block': CITY_BLOCK_WAVES,
  'jungle-ruins': JUNGLE_RUINS_WAVES,
  'beach-landing': BEACH_LANDING_WAVES,
  'mountain-pass': MOUNTAIN_PASS_WAVES,
  'the-crater': THE_CRATER_WAVES,
};
