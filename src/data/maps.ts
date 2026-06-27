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
  description: 'Bombed-out urban streets with two turns through the ruins.',
  specialFeature: 'Dense build grid around both turns — position carefully.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x1a1a1a,
  pathColor: 0x555555,
  waypoints: [
    { x: 0, y: 192 },
    { x: 512, y: 192 },
    { x: 512, y: 528 },
    { x: 1024, y: 528 },
  ],
  buildSlots: [
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 0)),
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 4)),
    ...Array.from({ length: 6 }, (_, i) => cell(i + 2, 6)),
    ...Array.from({ length: 6 }, (_, i) => cell(i + 9, 6)),
    ...Array.from({ length: 12 }, (_, i) => cell(i + 2, 9)),
    ...Array.from({ length: 3 }, (_, i) => cell(0, i + 4)),
    ...Array.from({ length: 3 }, (_, i) => cell(1, i + 4)),
    ...Array.from({ length: 3 }, (_, i) => cell(14, i + 0)),
    ...Array.from({ length: 3 }, (_, i) => cell(15, i + 0)),
  ],
};

// Map: Jungle Ruins — winding alien crash site with dense overgrowth
const JUNGLE_RUINS: MapConfig = {
  key: 'jungle-ruins',
  displayName: 'Jungle Ruins',
  description: 'Overgrown alien crash site. Infiltrators blend into the undergrowth.',
  specialFeature: 'Winding ruins corridors — Infiltrators extra common here.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x0d1a0a,
  pathColor: 0x2d6010,
  waypoints: [
    { x: 0, y: 352 },
    { x: 160, y: 352 },
    { x: 160, y: 96 },
    { x: 416, y: 96 },
    { x: 416, y: 480 },
    { x: 608, y: 480 },
    { x: 608, y: 160 },
    { x: 800, y: 160 },
    { x: 800, y: 544 },
    { x: 1024, y: 544 },
  ],
  buildSlots: [
    // Above top horizontal (row 0, cols 3–5)
    ...Array.from({ length: 3 }, (_, i) => cell(i + 3, 0)),
    // Between left vertical and center (rows 2–4, cols 3–5)
    ...Array.from({ length: 3 }, (_, i) => cell(i + 3, 2)),
    ...Array.from({ length: 3 }, (_, i) => cell(i + 3, 3)),
    ...Array.from({ length: 3 }, (_, i) => cell(i + 3, 4)),
    // Between center verticals (rows 3–6, cols 7–8)
    ...Array.from({ length: 4 }, (_, i) => cell(7, i + 3)),
    ...Array.from({ length: 4 }, (_, i) => cell(8, i + 3)),
    // Between right verticals (rows 3–7, cols 10–11)
    ...Array.from({ length: 5 }, (_, i) => cell(10, i + 3)),
    ...Array.from({ length: 5 }, (_, i) => cell(11, i + 3)),
    // Bottom open area (rows 9–10)
    ...Array.from({ length: 10 }, (_, i) => cell(i + 2, 9)),
    ...Array.from({ length: 10 }, (_, i) => cell(i + 2, 10)),
    // Far right column above exit (rows 0–7, col 15)
    ...Array.from({ length: 8 }, (_, i) => cell(15, i)),
  ],
};

// Map: Beach Landing — alien amphibious assault from the ocean
const BEACH_LANDING: MapConfig = {
  key: 'beach-landing',
  displayName: 'Beach Landing',
  description: 'Alien landing craft pour in from the ocean. Drones dominate the sky.',
  specialFeature: 'Enemies enter from the bottom — anti-air towers are critical.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x0a1520,
  pathColor: 0x8b7355,
  waypoints: [
    { x: 256, y: 720 },
    { x: 256, y: 480 },
    { x: 512, y: 480 },
    { x: 512, y: 160 },
    { x: 768, y: 160 },
    { x: 1024, y: 160 },
  ],
  buildSlots: [
    // Left of entry column (rows 1–6, cols 0–1)
    ...Array.from({ length: 6 }, (_, i) => cell(0, i + 1)),
    ...Array.from({ length: 6 }, (_, i) => cell(1, i + 1)),
    // Right of entry column (rows 1–6, cols 5–6)
    ...Array.from({ length: 6 }, (_, i) => cell(5, i + 1)),
    ...Array.from({ length: 6 }, (_, i) => cell(6, i + 1)),
    // Above upper horizontal (row 0, cols 8–13)
    ...Array.from({ length: 6 }, (_, i) => cell(i + 8, 0)),
    // Below upper horizontal (row 3, cols 8–13)
    ...Array.from({ length: 6 }, (_, i) => cell(i + 8, 3)),
    // Above lower horizontal (rows 1–2, cols 9–13)
    ...Array.from({ length: 5 }, (_, i) => cell(i + 9, 1)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 9, 2)),
    // Right of central vertical (rows 0–6, cols 13–14)
    ...Array.from({ length: 7 }, (_, i) => cell(13, i)),
    ...Array.from({ length: 7 }, (_, i) => cell(14, i)),
    // Bottom beach area (rows 8–10, cols 0–14)
    ...Array.from({ length: 10 }, (_, i) => cell(i, 8)),
    ...Array.from({ length: 10 }, (_, i) => cell(i, 10)),
  ],
};

// Map: The Crater — circular alien hive, final challenge
const THE_CRATER: MapConfig = {
  key: 'the-crater',
  displayName: 'The Crater',
  description: 'The alien hive crater. Enemies circle the impact zone before striking.',
  specialFeature: 'Serpentine path around the crater — every wave is a boss wave.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x100508,
  pathColor: 0x7a1a2a,
  waypoints: [
    { x: 0, y: 192 },
    { x: 192, y: 192 },
    { x: 192, y: 528 },
    { x: 512, y: 528 },
    { x: 512, y: 352 },
    { x: 832, y: 352 },
    { x: 832, y: 128 },
    { x: 1024, y: 128 },
  ],
  buildSlots: [
    // Top-left open area (rows 0, 3–4; cols 3–7)
    ...Array.from({ length: 5 }, (_, i) => cell(i + 3, 0)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 3, 3)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 3, 4)),
    // Center top (rows 0–4, cols 6–7) — between verticals
    ...Array.from({ length: 5 }, (_, i) => cell(6, i)),
    ...Array.from({ length: 5 }, (_, i) => cell(7, i)),
    // Right side (rows 5–9, cols 9–14)
    ...Array.from({ length: 6 }, (_, i) => cell(i + 9, 5)),
    ...Array.from({ length: 6 }, (_, i) => cell(i + 9, 6)),
    ...Array.from({ length: 6 }, (_, i) => cell(i + 9, 7)),
    // Bottom center (rows 8–10, cols 3–12)
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 8)),
    ...Array.from({ length: 10 }, (_, i) => cell(i + 3, 9)),
    // Far right (rows 3–9, col 15)
    ...Array.from({ length: 7 }, (_, i) => cell(15, i + 3)),
  ],
};

// Map: Mountain Pass — narrow zigzag through mountain terrain
const MOUNTAIN_PASS: MapConfig = {
  key: 'mountain-pass',
  displayName: 'Mountain Pass',
  description: 'A treacherous mountain corridor. Heavy enemies exploit the narrow choke.',
  specialFeature: 'Brutes, Titans, and Shielders in force — bring heavy firepower.',
  totalWaves: 20,
  cellSize: 64,
  bgColor: 0x14100d,
  pathColor: 0x666666,
  waypoints: [
    { x: 0, y: 160 },
    { x: 384, y: 160 },
    { x: 384, y: 560 },
    { x: 640, y: 560 },
    { x: 640, y: 288 },
    { x: 1024, y: 288 },
  ],
  buildSlots: [
    // Above top pass (rows 0, cols 1–5)
    ...Array.from({ length: 5 }, (_, i) => cell(i + 1, 0)),
    // Below top pass (rows 3–4, cols 1–5)
    ...Array.from({ length: 5 }, (_, i) => cell(i + 1, 3)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 1, 4)),
    // Left of descent vertical (rows 3–7, cols 4–5)
    ...Array.from({ length: 5 }, (_, i) => cell(4, i + 3)),
    ...Array.from({ length: 5 }, (_, i) => cell(5, i + 3)),
    // Above valley pass (rows 9–10, cols 7–9)
    ...Array.from({ length: 3 }, (_, i) => cell(i + 7, 9)),
    ...Array.from({ length: 3 }, (_, i) => cell(i + 7, 10)),
    // Between valley and upper pass (rows 0–3, cols 7–9)
    ...Array.from({ length: 4 }, (_, i) => cell(7, i)),
    ...Array.from({ length: 4 }, (_, i) => cell(8, i)),
    ...Array.from({ length: 4 }, (_, i) => cell(9, i)),
    // Right of ascent vertical (rows 0–3, cols 11–12)
    ...Array.from({ length: 4 }, (_, i) => cell(11, i)),
    ...Array.from({ length: 4 }, (_, i) => cell(12, i)),
    // Right of exit pass (rows 5–9, cols 11–15)
    ...Array.from({ length: 5 }, (_, i) => cell(i + 11, 5)),
    ...Array.from({ length: 5 }, (_, i) => cell(i + 11, 6)),
  ],
};

export const MAP_CONFIGS: Record<string, MapConfig> = {
  'outpost-bravo': OUTPOST_BRAVO,
  'arctic-station': ARCTIC_STATION,
  'city-block': CITY_BLOCK,
  'jungle-ruins': JUNGLE_RUINS,
  'beach-landing': BEACH_LANDING,
  'mountain-pass': MOUNTAIN_PASS,
  'the-crater': THE_CRATER,
};

export function getMapConfig(key: string): MapConfig {
  const config = MAP_CONFIGS[key];
  if (!config) throw new Error(`Unknown map: ${key}`);
  return config;
}

export const MAP_KEYS = Object.keys(MAP_CONFIGS);
