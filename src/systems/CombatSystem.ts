import type { Tower } from '../entities/Tower';
import type { Enemy } from '../entities/Enemy';

// Applies passive tower buffs (range boost, slow field) and psychic debuffs each frame.
// Must be called after resetBoosts() and before tower.update().
export class CombatSystem {
  applyPassives(towers: Tower[], enemies: Enemy[]): void {
    for (const passive of towers) {
      const cfg = passive.config;
      if (!cfg.isPassive || !cfg.passiveRadius || !cfg.passiveStrength) continue;

      if (cfg.passiveEffect === 'slow-field') {
        const r2 = cfg.passiveRadius * cfg.passiveRadius;
        for (const enemy of enemies) {
          const dx = enemy.x - passive.x;
          const dy = enemy.y - passive.y;
          if (dx * dx + dy * dy <= r2) {
            enemy.applySlowField(cfg.passiveStrength);
          }
        }
      }

      if (cfg.passiveEffect === 'range-boost') {
        const r2 = cfg.passiveRadius * cfg.passiveRadius;
        for (const active of towers) {
          if (active === passive || active.config.isPassive) continue;
          const dx = active.x - passive.x;
          const dy = active.y - passive.y;
          if (dx * dx + dy * dy <= r2) {
            active.applyRangeBoost(cfg.passiveStrength);
          }
        }
      }
    }

    // Psychic enemies debuff nearby towers (reduce fire rate)
    for (const enemy of enemies) {
      if (enemy.config.type !== 'psychic') continue;
      const debuffRadius = enemy.config.debuffRadius;
      const debuffStrength = enemy.config.debuffStrength;
      if (!debuffRadius || !debuffStrength) continue;

      const r2 = debuffRadius * debuffRadius;
      for (const tower of towers) {
        if (tower.config.isPassive) continue;
        const dx = tower.x - enemy.x;
        const dy = tower.y - enemy.y;
        if (dx * dx + dy * dy <= r2) {
          tower.applyFireRatePenalty(1 - debuffStrength);
        }
      }
    }
  }
}
