DiepScript.define("core/stats", (require) => {
  const constants = require("core/constants");
  const state = require("core/state");

  function getUpgrades(level = state.playerLevel) {
    let upgrades = 0;
    for (let i = 0; i < constants.buildStatLevels.length; i += 1) {
      upgrades += 1;
      if (level < constants.buildStatLevels[i]) break;
    }
    return upgrades;
  }

  function getRawStats() {
    if (!window.extern || typeof window.extern.get_convar !== "function") {
      return null;
    }
    try {
      return window.extern.get_convar("game_stats_build") || [];
    } catch (error) {
      console.warn("[DiepScript] Failed to read game stats:", error);
      return [];
    }
  }

  function canUpgrade() {
    const rawStats = getRawStats();
    if (!Array.isArray(rawStats)) return false;
    return getUpgrades() - 1 > rawStats.length;
  }

  function truncateStats() {
    const rawStats = getRawStats();
    if (!Array.isArray(rawStats)) return [];
    return rawStats.slice(0, getUpgrades());
  }

  function getStats() {
    const rawStats = getRawStats();
    const stats = {
      healthRegen: 0,
      maxHealth: 0,
      bodyDamage: 0,
      bulletSpeed: 0,
      bulletPenetration: 0,
      bulletDamage: 0,
      reload: 0,
      movementSpeed: 0,
    };
    if (!Array.isArray(rawStats)) return stats;

    for (let i = 0; i < rawStats.length; i += 1) {
      const statName = constants.statNumbers[rawStats[i]];
      if (statName) stats[statName] += 1;
    }
    return stats;
  }

  function getTankBulletSpeedOffset(tank) {
    return constants.bulletSpeedOffsets[tank] || 1;
  }

  function calculateMainBulletSpeed() {
    const stats = getStats();
    const speedStat = stats.bulletSpeed;
    return (
      (20 + speedStat * 3 * getTankBulletSpeedOffset(state.playerTank)) * 0.03
    );
  }

  function getCurrentBulletSpeed() {
    if (!window || !window.extern) {
      return { ok: false, reason: "window.extern unavailable" };
    }

    let rawStats;
    try {
      rawStats = window.extern.get_convar("game_stats_build");
    } catch (_e) {
      rawStats = null;
    }

    if (!Array.isArray(rawStats)) {
      return {
        ok: false,
        reason: "game_stats_build not available or not an array",
        rawStats,
      };
    }

    let bulletStatCount = 0;
    for (let i = 0; i < rawStats.length; i += 1) {
      const statId = rawStats[i];
      if (constants.statNumbers[statId] === "bulletSpeed") {
        bulletStatCount += 1;
      }
    }

    const tankOffset = getTankBulletSpeedOffset(state.playerTank);
    const rawValue = 20 + bulletStatCount * 3 * tankOffset;
    const computedBulletSpeed = rawValue * 0.03;

    return {
      ok: true,
      rawStats,
      bulletStatCount,
      playerTank: state.playerTank,
      tankOffset,
      rawValue,
      computedBulletSpeed,
      units: "same as calculateMainBulletSpeed() result (script units)",
    };
  }

  function forceU() {
    if (!window.extern) return;

    if (canUpgrade()) {
      if (!state.forcingU) {
        state.forcingU = true;
        try {
          window.extern.onKeyDown(21, 1);
        } catch (error) {
          console.warn("[DiepScript] Failed to force upgrade keydown:", error);
        }
      }
    } else if (state.forcingU) {
      state.forcingU = false;
      try {
        window.extern.onKeyUp(21, 1);
      } catch (error) {
        console.warn("[DiepScript] Failed to release upgrade key:", error);
      }
    }
  }

  return {
    getUpgrades,
    getRawStats,
    getStats,
    canUpgrade,
    truncateStats,
    getTankBulletSpeedOffset,
    calculateMainBulletSpeed,
    getCurrentBulletSpeed,
    forceU,
  };
});
