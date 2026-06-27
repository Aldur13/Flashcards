import type { MapConfig } from '../types';

// Game world dimensions: 1024 x 720
// Cell size: 64px
// Grid: 16 cols × 11 rows

function cell(col: number, row: number, size = 64): { x: number; y: number } {
  return { x: col * size + size / 2, y: row * size + size / 2 };
}

// Map: Outpost Bravo — single S-curve lane through a desert military base
const OUTPOST_BRAVO: MapConfig = {
  key: 'outpost-bravo',
  displayName: 'Outpost Bravo',
  description: 'A desert forward operating base. Single lane. No tricks — just hold the line.',
  specialFeature: 'None — tutorial map.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x2d1f0a,
  pathColor: 0x8b6914,
  waypoints: [
    { x: 0, y: 352 },    // entry from left edge
    { x: 192, y: 352 },
    { x: 192, y: 192 },
    { x: 832, y: 192 },
    { x: 832, y: 544 },
    { x: 1024, y: 544 }, // exit to right edge
  ],
  buildSlots: [
    // Above upper path segment (row 1 & 2, cols 3-12)
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 1)),
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 2)),
    // Below upper path segment (row 4 & 5, cols 3-12)
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 4)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 3, 5)),
    // Left of upper path vertical (cols 0-1, rows 3-5)
    ...Array.from({ length: 3 }, (_, i) => cell(0, i + 3)),
    ...Array.from({ length: 3 }, (_, i) => cell(1, i + 3)),
    // Right of lower path vertical (cols 14-15, rows 4-8)
    ...Array.from({ length: 5 }, (_, i) => cell(14, i + 4)),
    ...Array.from({ length: 5 }, (_, i) => cell(15, i + 4)),
    // Above/below lower path segment (row 7 & 9, cols 3-12)
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 7)),
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 9)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 3, 10)),
  ],
};

// Map: Arctic Station — frozen tundra with ice patches
const ARCTIC_STATION: MapConfig = {
  key: 'arctic-station',
  displayName: 'Arctic Station',
  description: 'Frozen research outpost. Ice patches impede tower rotation and enemy movement alike.',
  specialFeature: 'Ice patches slow enemies — and tower traverse speed.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x0a1a2e,
  pathColor: 0x87ceeb,
  waypoints: [
    { x: 0, y: 160 },
    { x: 320, y: 160 },
    { x: 320, y: 544 },
    { x: 704, y: 544 },
    { x: 704, y: 288 },
    { x: 1024, y: 288 },
  ],
  buildSlots: [
    ...Array.from({ length: 4 }, (_, i) => cell(i, 1)),
    ...Array.from({ length: 4 }, (_, i) => cell(i, 3)),
    ...Array.from({ length: 3 }, (_, i) => cell(6, i + 2)),
    ...Array.from({ length: 3 }, (_, i) => cell(7, i + 2)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 6, 7)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 6, 9)),
    ...Array.from({ length: 4 }, (_, i) => cell(i + 12, 3)),
    ...Array.from({ length: 4 }, (_, i) => cell(i + 12, 5)),
  ],
};

// Map: City Block — multi-lane urban combat
const CITY_BLOCK: MapConfig = {
  key: 'city-block',
  displayName: 'City Block',
  description: 'Bombed-out urban streets. Enemies split down two lanes — cover both.',
  specialFeature: 'Dual-lane split: enemies divide at a fork and must be stopped on both paths.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x1a1a1a,
  pathColor: 0x555555,
  waypoints: [
    // Primary upper lane
    { x: 0, y: 192 },
    { x: 1024, y: 192 },
  ],
  buildSlots: [
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 0)),
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 4)),
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 6)),
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 10)),
  ],
};

export const MAP_CONFIGS: Record<string, MapConfig> = {
  'outpost-bravo': OUTPOST_BRAVO,
  'arctic-station': ARCTIC_STATION,
  'city-block': CITY_BLOCK,
};

export function getMapConfig(key: string): MapConfig {
  const config = MAP_CONFIGS[key];
  if (!config) throw new Error(`Unknown map: ${key}`);
  return config;
}

export const MAP_KEYS = Object.keys(MAP_CONFIGS);
