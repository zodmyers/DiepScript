/*
 * DiepScript bundle (auto-generated)
 * Do not edit manually; regenerate via scripts/build-bundle.ps1.
 */

// ---- Begin src/core/moduleLoader.js
/* eslint-disable no-multi-assign */
// Lightweight AMD-style loader so every module can be `@require`'d individually or bundled later.
(function bootstrapModuleLoader(globalScope) {
  if (globalScope.DiepScript && globalScope.DiepScript.require) {
    return;
  }

  const registry = new Map();
  const cache = new Map();

  function define(name, factory) {
    if (typeof name !== "string" || !name) {
      throw new Error("[DiepScript] Module name must be a non-empty string.");
    }
    if (typeof factory !== "function") {
      throw new Error(`[DiepScript] Factory for "${name}" must be a function.`);
    }
    if (registry.has(name)) {
      console.warn(`[DiepScript] Module "${name}" is already defined. Overwriting.`);
    }
    registry.set(name, factory);
  }

  function require(name) {
    if (cache.has(name)) {
      return cache.get(name);
    }
    if (!registry.has(name)) {
      throw new Error(`[DiepScript] Module "${name}" is not registered.`);
    }

    const module = { exports: {} };
    const factory = registry.get(name);
    const result = factory(require, module.exports, module);
    const resolved = result !== undefined ? result : module.exports;

    cache.set(name, resolved);
    return resolved;
  }

  globalScope.DiepScript = {
    define,
    require,
  };
})(typeof window !== "undefined" ? window : globalThis);
// ---- End src/core/moduleLoader.js

// ---- Begin src/core/constants.js
DiepScript.define("core/constants", () => {
  // Collection of magic numbers and lookup tables that power prediction, UI, and keybindings.
  const gameStyleDefaults = {
    ren_grid_base_alpha: 0.05,
    square: "#ffe869",
    triangle: "#fc7677",
    pentagon: "#768dfc",
    teamBlue: "#00b2e1",
    teamRed: "#f14e54",
    teamPurple: "#bf7ff5",
    teamGreen: "#00e16e",
  };

  // Tank-specific bullet offsets used when computing intercept trajectories.
  const bulletSpeedOffsets = {
    Skimmer: 0.5,
    Factory: 0.56,
    Annihilator: 0.7,
    Streamliner: 1.1,
    "Auto Gunner": 1.1,
    Gunner: 1.1,
    Predator: 1.4,
    Mothership: 0.48,
    Manager: 0.8,
    Hybrid: 0.7,
    Ranger: 1.5,
    Stalker: 1.5,
    Assassin: 1.5,
    Sniper: 1.5,
    Hunter: 1.4,
    Necromancer: 0.72,
    "Arena Closer": 2,
    Overlord: 0.8,
    Overseer: 0.8,
    Destroyer: 0.7,
  };

  // Timings (in ms) for charge/stack combos; indexed by reload stat level.
  const predatorStackTime = [
    [50, 500, 1400, 2800],
    [50, 500, 1300, 2700],
    [50, 400, 1200, 2450],
    [50, 300, 1100, 2200],
    [50, 300, 1000, 2100],
    [50, 300, 900, 1800],
    [50, 300, 800, 1700],
    [50, 300, 750, 1500],
  ];

  const hunterStackTime = [
    [50, 1200],
    [50, 1100],
    [50, 1000],
    [50, 950],
    [50, 800],
    [50, 725],
    [50, 700],
    [50, 625],
  ];

  const buildStatLevels = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 26, 27, 28, 30, 33, 36, 39, 42, 45,
  ];

  const statNumbers = {
    1: "healthRegen",
    2: "maxHealth",
    3: "bodyDamage",
    4: "bulletSpeed",
    5: "bulletPenetration",
    6: "bulletDamage",
    7: "reload",
    8: "movementSpeed",
  };

  const KeyBindings = Object.freeze({
    toggleAimbot: "KeyU",
    stack: "KeyI",
    toggleMenu: "KeyM",
  });

  return {
    FOV_UPDATE_INTERVAL: 16.6,
    FOV_LERP: 0.1,
    averageEnemyDodgeTime: 1750,
    destroyerAccuracy: true,
    playerVelocityPredictionSampleSize: 50,
    arenaSize: 26000,
    MAX_INTERCEPT_TIME_MS: 2000,
    AUTO_AIM_LERP: 0.45,
    AUTO_AIM_FIRE_THRESHOLD: 12,
    DRONE_AIM_LEAD_MS: 100,
    DRONE_CLASSES: ["Overseer", "Overlord"],
    bulletSpeedOffsets,
    predatorStackTime,
    hunterStackTime,
    buildStatLevels,
    statNumbers,
    gameStyleDefaults,
    KeyBindings,
  };
});
// ---- End src/core/constants.js

// ---- Begin src/core/state.js
DiepScript.define("core/state", (require) => {
  // Shared mutable state for every module. Treat this as the single source of truth.
  const constants = require("core/constants");

  const state = {
    // FOV
    setFov: 0.5,
    foxv: 0.5,
    keyStates: new Map(),
    prevAimWorld: null,

    // Spinner / input status
    spinSpeed: 0.8,
    isSpinning: false,
    spinAngle: 0,
    isShooting: false,
    isFiring: false,
    isAimbotActive: true,

    // Player data
    playerTank: "Tank",
    playerLevel: 1,
    playerX: 0,
    playerY: 0,
    arrowPos: [0, 0],
    minimapPos: [0, 0],
    minimapSize: [0, 0],
    fov: 0.5,
    teamColor: "",
    hasJoined: false,

    // Render parsing caches
    text: [],
    tankShapes: [],
    lastPlayers: [],
    players: [],
    lastArc: [Infinity, Infinity],

    // Mouse & key tracking
    mousePressed: false,
    rightMouseDown: false,
    mouseLocked: false,
    mouseX: 0,
    mouseY: 0,
    spaceDown: false,

    // Autofarm state
    isAutoFarm: false,
    neutralSquares: [],
    neutralPentagons: [],
    neutralTriangles: [],
    farmPriority: "pentagon",
    autoAimX: null,
    autoAimY: null,
    lastFarmTarget: null,

    // Debug / overlays
    isDebug: false,
    useConvarBulletSpeed: false,
    showBulletSpeeds: false,
    bulletPositions: [],
    currentComputedBulletSpeed: null,
    useDroneAimOnlyForMinions: false,
    autofarmOnRightHold: true,
    lastAimDebug: null,

    // Misc runtime
    forcingU: false,
    playerPositionTable: Array.from(
      { length: constants.playerVelocityPredictionSampleSize },
      () => null
    ),
    shooterVelocity: [0, 0],
    gameStyle: { ...constants.gameStyleDefaults },

    // Menu + UI
    menuContainer: null,

    // Canvas hook helpers
    ctxTransform: null,
    pathPosition: 0,
    pathVertices: [],

    // Handles/IDs
    checkGameStartId: null,
  };

  return state;
});
// ---- End src/core/state.js

// ---- Begin src/core/math.js
DiepScript.define("core/math", () => {
  // Math helpers kept pure so they can be unit-tested or reused in other surfaces.
  function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function predictPlayer(player, timeMs) {
    const velocity = player.velocity || [0, 0];
    const vx = velocity[0] || 0;
    const vy = velocity[1] || 0;
    return [player.wx + timeMs * vx, player.wy + timeMs * vy];
  }

  function getMotionEstimate(positionTable, dtThreshold = 6) {
    const history = Array.isArray(positionTable)
      ? positionTable.filter(
          (entry) =>
            entry &&
            Number.isFinite(entry.x) &&
            Number.isFinite(entry.y) &&
            Number.isFinite(entry.timestamp)
        )
      : [];

    let sumVx = 0;
    let sumVy = 0;
    let sumAx = 0;
    let sumAy = 0;
    let velocitySamples = 0;
    let accelSamples = 0;
    let prevSample = null;
    let prevVelocity = null;

    for (let i = 0; i < history.length; i += 1) {
      const sample = history[i];
      if (!prevSample) {
        prevSample = sample;
        continue;
      }

      const dt = sample.timestamp - prevSample.timestamp;
      if (dt >= dtThreshold) {
        const vx = (sample.x - prevSample.x) / dt;
        const vy = (sample.y - prevSample.y) / dt;
        sumVx += vx;
        sumVy += vy;
        velocitySamples += 1;

        if (prevVelocity) {
          const dvx = vx - prevVelocity.vx;
          const dvy = vy - prevVelocity.vy;
          const dtVel = sample.timestamp - prevVelocity.timestamp;
          if (dtVel >= dtThreshold) {
            sumAx += dvx / dtVel;
            sumAy += dvy / dtVel;
            accelSamples += 1;
          }
        }

        prevVelocity = { vx, vy, timestamp: sample.timestamp };
      }

      prevSample = sample;
    }

    const clamp = (value, max) => {
      if (value > max) return max;
      if (value < -max) return -max;
      return value;
    };

    const avgVx = velocitySamples > 0 ? sumVx / velocitySamples : 0;
    const avgVy = velocitySamples > 0 ? sumVy / velocitySamples : 0;
    const avgAx = accelSamples > 0 ? clamp(sumAx / accelSamples, 0.005) : 0;
    const avgAy = accelSamples > 0 ? clamp(sumAy / accelSamples, 0.005) : 0;

    return {
      vx: avgVx,
      vy: avgVy,
      ax: avgAx,
      ay: avgAy,
      velocitySamples,
      accelSamples,
    };
  }

  function getAverage(points) {
    if (!points || points.length === 0) return [0, 0];
    let sumX = 0;
    let sumY = 0;
    points.forEach(([x, y]) => {
      sumX += x;
      sumY += y;
    });
    return [sumX / points.length, sumY / points.length];
  }

  function quad(a, b, c) {
    let solution = null;
    if (Math.abs(a) < 1e-6) {
      if (Math.abs(b) < 1e-6) {
        solution = Math.abs(c) < 1e-6 ? [0, 0] : null;
      } else {
        const root = -c / b;
        solution = [root, root];
      }
    } else {
      let disc = b * b - 4 * a * c;
      if (disc >= 0) {
        disc = Math.sqrt(disc);
        const twoA = 2 * a;
        solution = [(-b - disc) / twoA, (-b + disc) / twoA];
      }
    }
    return solution;
  }

  function intercept(shooter, target, bulletSpeed) {
    const tx = target.x - shooter.x;
    const ty = target.y - shooter.y;
    const tvx = target.vx || 0;
    const tvy = target.vy || 0;

    const a = tvx * tvx + tvy * tvy - bulletSpeed * bulletSpeed;
    const b = 2 * (tvx * tx + tvy * ty);
    const c = tx * tx + ty * ty;

    const ts = quad(a, b, c);
    if (!ts) return null;

    let [t0, t1] = ts;
    let t = Math.min(t0, t1);
    if (t < 0) t = Math.max(t0, t1);

    if (!(t > 0)) return null;

    return {
      x: target.x + tvx * t,
      y: target.y + tvy * t,
      t,
    };
  }

  function smoothstep(a, b, x) {
    if (a === b) return x <= a ? 0 : 1;
    let t = (x - a) / (b - a);
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  // Smoothly merges “fire straight” with interception math so aim feels stable.
  function blendPredictiveAim(
    shooter,
    target,
    shooterVel,
    bulletSpeed,
    prevAimWorld,
    opts = {}
  ) {
    const minDist = opts.minDist ?? 400;
    const maxDist = opts.maxDist ?? 2000;
    const minSamples = opts.minSamples ?? 3;
    const goodSamples = opts.goodSamples ?? 6;
    const maxGoodT = opts.maxGoodT ?? 1200;
    const minGoodT = opts.minGoodT ?? 30;
    const maxAngleDeg = opts.maxAngleDeg ?? 120;
    const relRatioCap = opts.relRatioCap ?? 0.9;
    const alphaSmooth = opts.alphaSmooth ?? 0.65;

    const dist = getDistance(shooter.x, shooter.y, target.wx, target.wy);

    const motion = getMotionEstimate(target.positionTable || []);
    const velocitySampleCount = motion.velocitySamples;
    const rawTvx =
      velocitySampleCount >= minSamples
        ? motion.vx || 0
        : 0;
    const rawTvy =
      velocitySampleCount >= minSamples
        ? motion.vy || 0
        : 0;

    const fbTime = Math.max(
      12,
      Math.min(400, dist / Math.max(1e-6, bulletSpeed))
    );
    const linearPred = {
      x:
        target.wx +
        rawTvx * fbTime +
        (motion.accelSamples > 0 ? 0.5 * motion.ax * fbTime * fbTime : 0),
      y:
        target.wy +
        rawTvy * fbTime +
        (motion.accelSamples > 0 ? 0.5 * motion.ay * fbTime * fbTime : 0),
    };

    const accelAdjustedVx =
      rawTvx +
      (motion.accelSamples > 0 ? motion.ax * fbTime * 0.5 : 0);
    const accelAdjustedVy =
      rawTvy +
      (motion.accelSamples > 0 ? motion.ay * fbTime * 0.5 : 0);

    const relVx = accelAdjustedVx - (shooterVel[0] || 0);
    const relVy = accelAdjustedVy - (shooterVel[1] || 0);
    const interceptSolution = intercept(
      shooter,
      { x: target.wx, y: target.wy, vx: relVx, vy: relVy },
      bulletSpeed
    );

    const sDist = smoothstep(minDist, maxDist, dist);
    const velSampleRange = goodSamples - minSamples;
    const sVelSamples =
      velSampleRange <= 0
        ? 1
        : Math.max(
            0,
            Math.min(
              1,
              (velocitySampleCount - minSamples) / velSampleRange
            )
          );

    let sSolT = 0;
    let sAngle = 0;
    let solExists = false;
    if (
      interceptSolution &&
      Number.isFinite(interceptSolution.t) &&
      interceptSolution.t > 0
    ) {
      solExists = true;
      sSolT =
        1 -
        Math.max(
          0,
          (interceptSolution.t - minGoodT) / (maxGoodT - minGoodT)
        );
      const aimVecX = interceptSolution.x - shooter.x;
      const aimVecY = interceptSolution.y - shooter.y;
      const targVecX = target.wx - shooter.x;
      const targVecY = target.wy - shooter.y;
      const denom = Math.max(
        1e-9,
        Math.hypot(aimVecX, aimVecY) * Math.hypot(targVecX, targVecY)
      );
      let cosTheta =
        (aimVecX * targVecX + aimVecY * targVecY) / denom || 0;
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
      const thetaDeg = Math.acos(cosTheta) * (180 / Math.PI);
      sAngle = 1 - Math.min(1, thetaDeg / maxAngleDeg);
    }

    const relSpeed = Math.hypot(relVx, relVy);
    const sRelSpeed =
      1 -
      Math.min(
        1,
        relSpeed / (Math.max(1e-6, bulletSpeed) * relRatioCap)
      );

    const wBase = sDist * sVelSamples;
    const wSol = solExists
      ? (0.6 * sSolT + 0.4 * sAngle) * sRelSpeed
      : 0;
    let weight = Math.max(0, Math.min(1, 0.6 * wBase + 0.4 * wSol));
    if (!solExists) weight = 0;

    const aimWorld = {
      x:
        linearPred.x * (1 - weight) +
        (solExists ? interceptSolution.x : linearPred.x) * weight,
      y:
        linearPred.y * (1 - weight) +
        (solExists ? interceptSolution.y : linearPred.y) * weight,
    };

    const finalAim =
      prevAimWorld && typeof prevAimWorld.x === "number"
        ? {
            x: prevAimWorld.x * (1 - alphaSmooth) + aimWorld.x * alphaSmooth,
            y: prevAimWorld.y * (1 - alphaSmooth) + aimWorld.y * alphaSmooth,
          }
        : aimWorld;

    return {
      x: finalAim.x,
      y: finalAim.y,
      weight,
      debug: {
        dist,
        sampleCount: velocitySampleCount,
        intercept: interceptSolution,
        sDist,
        sVelSamples,
        sSolT,
        sAngle,
        sRelSpeed,
        motion: {
          velocity: {
            x: rawTvx,
            y: rawTvy,
            samples: velocitySampleCount,
          },
          acceleration: {
            x: motion.ax,
            y: motion.ay,
            samples: motion.accelSamples,
          },
        },
      },
    };
  }

  return {
    getDistance,
    predictPlayer,
    getAverage,
    quad,
    intercept,
    getMotionEstimate,
    blendPredictiveAim,
  };
});
// ---- End src/core/math.js

// ---- Begin src/core/stats.js
DiepScript.define("core/stats", (require) => {
  // Helper routines for reading/deriving player stat info through extern APIs.
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
// ---- End src/core/stats.js

// ---- Begin src/core/coordinates.js
DiepScript.define("core/coordinates", (require) => {
  // Responsible for translating between minimap/canvas coordinates and world space.
  const state = require("core/state");
  const constants = require("core/constants");

  function updatePlayerWorldPosition() {
    const dx = state.arrowPos[0] - state.minimapPos[0];
    const dy = state.arrowPos[1] - state.minimapPos[1];
    if (!state.minimapSize[0] || !state.minimapSize[1]) return;
    state.playerX = (dx / state.minimapSize[0]) * constants.arenaSize;
    state.playerY = (dy / state.minimapSize[1]) * constants.arenaSize;
  }

  function getRenderedWorldPosition(canvasX, canvasY) {
    const mainCanvas = document.getElementById("canvas");
    if (!mainCanvas) return [state.playerX, state.playerY];

    const midX = canvasX - mainCanvas.width / 2;
    const midY = canvasY - mainCanvas.height / 2;
    const scale = state.fov / 2.8;

    return [state.playerX + midX / scale, state.playerY + midY / scale];
  }

  function worldToCanvasPosition(wx, wy) {
    const mainCanvas = document.getElementById("canvas");
    if (!mainCanvas) return [null, null];

    const scale = state.fov / 2.8;
    const dx = wx - state.playerX;
    const dy = wy - state.playerY;

    return [
      mainCanvas.width / 2 + dx * scale,
      mainCanvas.height / 2 + dy * scale,
    ];
  }

  function worldToMousePosition(wx, wy) {
    const scale = state.fov / 2.8;
    const dx = wx - state.playerX;
    const dy = wy - state.playerY;

    return [
      window.innerWidth / 2 + dx * scale,
      window.innerHeight / 2 + dy * scale,
    ];
  }

  return {
    updatePlayerWorldPosition,
    getRenderedWorldPosition,
    worldToCanvasPosition,
    worldToMousePosition,
  };
});
// ---- End src/core/coordinates.js

// ---- Begin src/runtime/players.js
DiepScript.define("runtime/players", (require) => {
  // Converts raw render information into persistent player objects with velocity/mode context.
  const state = require("core/state");
  const constants = require("core/constants");
  const math = require("core/math");
  const coordinates = require("core/coordinates");

  function parseDiepScore(raw) {
    if (!raw) return "";
    const tail = raw[raw.length - 1];
    if (tail === "k" || tail === "m") {
      const multiplier = tail === "k" ? 1000 : 1_000_000;
      const numeric = parseFloat(raw.slice(0, -1));
      return Number.isNaN(numeric) ? "" : numeric * multiplier;
    }
    if (!raw.includes(".")) {
      const asInt = parseInt(raw, 10);
      return Number.isNaN(asInt) ? "" : asInt;
    }
    return "";
  }

  function getClosestText(entries, x, y) {
    return entries.reduce((acc, curr) => {
      if (!acc) return curr;
      const distAcc = math.getDistance(x, y, acc.mx, acc.my);
      const distCur = math.getDistance(x, y, curr.mx, curr.my);
      return distCur < distAcc ? curr : acc;
    }, null);
  }

  // Rebuild player list each frame by pairing canvas text blobs with tank shapes.
  function updatePlayersFromRender() {
    state.lastPlayers = state.players;
    state.players = [];

    for (let i = 0; i < state.tankShapes.length; i += 1) {
      const shape = state.tankShapes[i];
      if (shape.radius / state.fov < 19) continue;

      const scoreTextPos = [shape.x, shape.y - shape.radius * 1.3];
      const nameTextPos = [shape.x, shape.y - shape.radius * 2];

      const closestScore = getClosestText(state.text, ...scoreTextPos);
      const closestName = getClosestText(state.text, ...nameTextPos);

      const distToScore = closestScore
        ? math.getDistance(
            scoreTextPos[0],
            scoreTextPos[1],
            closestScore.mx,
            closestScore.my
          )
        : Infinity;
      const distToName = closestName
        ? math.getDistance(
            nameTextPos[0],
            nameTextPos[1],
            closestName.mx,
            closestName.my
          )
        : Infinity;

      const score =
        distToScore < 25 ? parseDiepScore(closestScore?.text || "-1") : "";
      const name = distToName < 25 ? closestName?.text || "" : "";

      if (score === "" && (!name || !name.trim())) continue;

      const [wx, wy] = coordinates.getRenderedWorldPosition(shape.x, shape.y);
      const teammate =
        isTeamMode() &&
        state.teamColor &&
        shape.fillStyle === state.gameStyle[state.teamColor];

      state.players.push({
        wx,
        wy,
        x: shape.x,
        y: shape.y,
        radius: shape.radius,
        name,
        score,
        velocity: [0, 0],
        acceleration: [0, 0],
        motionSamples: 0,
        accelSamples: 0,
        teammate,
      });
    }
  }

  // Attempt to match the freshly parsed players to the previous frame to preserve velocity history.
  function matchPlayers() {
    const now = performance.now();
    const maxHistory = constants.playerVelocityPredictionSampleSize;

    for (let i = 0; i < state.players.length; i += 1) {
      const current = state.players[i];
      const last = state.lastPlayers.reduce((acc, candidate) => {
        if (!acc) return candidate;
        const distAcc = math.getDistance(
          current.wx,
          current.wy,
          acc.wx,
          acc.wy
        );
        const distCur = math.getDistance(
          current.wx,
          current.wy,
          candidate.wx,
          candidate.wy
        );
        return distCur < distAcc ? candidate : acc;
      }, null);

      if (
        last &&
        math.getDistance(current.wx, current.wy, last.wx, last.wy) < 25
      ) {
        const history = last.positionTable.concat({
          x: current.wx,
          y: current.wy,
          timestamp: now,
        });
        while (history.length > maxHistory) history.shift();

        current.teammate = last.teammate || current.teammate;
        current.positionTable = history;
        const motion = math.getMotionEstimate(history);
        current.velocity = [motion.vx || 0, motion.vy || 0];
        current.acceleration = [motion.ax || 0, motion.ay || 0];
        current.motionSamples = motion.velocitySamples || 0;
        current.accelSamples = motion.accelSamples || 0;
      } else {
        current.positionTable = Array.from({ length: maxHistory }, () => null);
        current.velocity = [0, 0];
        current.acceleration = [0, 0];
        current.motionSamples = 0;
        current.accelSamples = 0;
      }

      if (!isTeamMode()) {
        current.teammate = false;
      }
    }
  }

  // Heuristic for deciding which enemy to prioritise (distance + score).
  function getPlayerWeight(player) {
    const distanceWeight =
      (1 /
        math.getDistance(
          state.playerX,
          state.playerY,
          player.wx,
          player.wy
        )) *
      1000;
    const scoreWeight =
      Math.min(23536, Math.max(0, player.score || 0)) / 100000;
    return distanceWeight + scoreWeight;
  }

  function nearestShapeWorld(canvasPoints) {
    let nearest = null;
    let nearestDist = Infinity;
    for (let i = 0; i < canvasPoints.length; i += 1) {
      const [cx, cy] = canvasPoints[i];
      const [wx, wy] = coordinates.getRenderedWorldPosition(cx, cy);
      const dist = math.getDistance(state.playerX, state.playerY, wx, wy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = [wx, wy];
      }
    }
    return nearest;
  }

  function getActiveGamemode() {
    try {
      if (
        window.__common__ &&
        typeof window.__common__.active_gamemode === "string"
      ) {
        return window.__common__.active_gamemode.toLowerCase();
      }
    } catch (error) {
      if (state.isDebug) console.warn("active_gamemode lookup failed:", error);
    }
    try {
      const gmEl = document.querySelector(
        ".gamemode-title, .gamemode-name, .mode-name"
      );
      if (gmEl && gmEl.innerText) return gmEl.innerText.toLowerCase();
    } catch (error) {
      if (state.isDebug) console.warn("active gamemode text lookup failed:", error);
    }
    return "";
  }

  function isFfaMode() {
    const gm = getActiveGamemode();
    if (!gm) return false;
    return (
      gm.includes("ffa") ||
      gm.includes("free") ||
      gm.includes("freeforall")
    );
  }

  function isTeamMode() {
    const gm = getActiveGamemode();
    const teamNames = ["team", "teams", "tdm", "domination", "ctf"];
    if (gm) {
      if (gm.includes("ffa") || gm.includes("free")) return false;
      for (let i = 0; i < teamNames.length; i += 1) {
        if (gm.includes(teamNames[i])) return true;
      }
    }
    const partyBtn = document.getElementById("copy-party-link");
    return !!(partyBtn && partyBtn.className && partyBtn.className.trim() !== "");
  }

  function updateTeamColor() {
    if (isFfaMode()) {
      state.teamColor = "";
      return;
    }

    const partyLinkButton = document.getElementById("copy-party-link");
    if (!partyLinkButton || !partyLinkButton.className) {
      state.teamColor = "";
      return;
    }

    switch (partyLinkButton.className) {
      case "active blue":
        state.teamColor = "teamBlue";
        break;
      case "active purple":
        state.teamColor = "teamPurple";
        break;
      case "active green":
        state.teamColor = "teamGreen";
        break;
      case "active red":
        state.teamColor = "teamRed";
        break;
      default:
        state.teamColor = "";
        break;
    }
  }

  return {
    updatePlayersFromRender,
    matchPlayers,
    getPlayerWeight,
    nearestShapeWorld,
    getActiveGamemode,
    isFfaMode,
    isTeamMode,
    updateTeamColor,
  };
});
// ---- End src/runtime/players.js

// ---- Begin src/features/visuals.js
DiepScript.define("features/visuals", (require) => {
  // Debug drawing helpers rendered directly on the main canvas.
  const state = require("core/state");
  const coordinates = require("core/coordinates");

  function renderAimOverlay(predictedX, predictedY, targetX, targetY) {
    if (!state.isDebug) return;

    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const [predictCanvasX, predictCanvasY] = coordinates.worldToCanvasPosition(
      predictedX,
      predictedY
    );
    const [targetCanvasX, targetCanvasY] = coordinates.worldToCanvasPosition(
      targetX,
      targetY
    );

    ctx.beginPath();
    ctx.arc(predictCanvasX, predictCanvasY, 25, Math.PI * 2, 0, true);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ff5294";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, 25, Math.PI * 2, 0, true);
    ctx.fillStyle = "#52e8ff";
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(predictCanvasX, predictCanvasY);
    ctx.lineTo(targetCanvasX, targetCanvasY);
    ctx.strokeStyle = "rgba(67, 127, 255, 0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function renderBulletSpeedOverlay() {
    if (!state.showBulletSpeeds || state.bulletPositions.length === 0) return;

    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.font = "12px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "bottom";

    state.bulletPositions.forEach((bp) => {
      const text =
        bp.speed === null || typeof bp.speed !== "number"
          ? "n/a"
          : bp.speed.toFixed(3);
      ctx.fillStyle = "rgba(46, 112, 255, 0.35)";
      const metrics = ctx.measureText(text);
      ctx.fillRect(bp.x + 4, bp.y - 20, metrics.width + 6, 18);
      ctx.fillStyle = "#eaf5ff";
      ctx.fillText(text, bp.x + 7, bp.y - 6);
    });
    ctx.restore();
  }

  function renderCoordinateOverlay() {
    if (!state.isDebug) return;

    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.font = "12px 'Kanit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const lineHeight = 13;
    const drawLines = (x, startY, lines, fill, stroke) => {
      const rows = Array.isArray(lines) ? lines : [lines];
      for (let i = 0; i < rows.length; i += 1) {
        const line = rows[i];
        const y = startY + i * lineHeight;
        if (typeof ctx.strokeText === "function") {
          ctx.lineWidth = 4;
          ctx.strokeStyle = stroke;
          ctx.strokeText(line, x, y);
        }
        ctx.fillStyle = fill;
        ctx.fillText(line, x, y);
      }
    };

    // Local player (tank is always centered on the main canvas)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    drawLines(
      centerX,
      centerY + 36,
      [`you x:${Math.round(state.playerX)}`, `y:${Math.round(state.playerY)}`],
      "#e6f3ff",
      "rgba(67, 127, 255, 0.55)"
    );

    // Enemy player markers
    for (let i = 0; i < state.players.length; i += 1) {
      const player = state.players[i];
      if (!player || player.teammate) continue;
      const labelY = player.y + (player.radius || 24) + 6;
      drawLines(
        player.x,
        labelY,
        [`x:${Math.round(player.wx)}`, `y:${Math.round(player.wy)}`],
        "#ffe5f5",
        "rgba(245, 82, 148, 0.6)"
      );
    }

    // Neutral shape coordinates (limited to avoid clutter)
    const shapeConfigs = [
      { list: state.neutralPentagons, tag: "P", fill: "#ffe66d" },
      { list: state.neutralTriangles, tag: "T", fill: "#ffb27f" },
      { list: state.neutralSquares, tag: "S", fill: "#b5ff9c" },
    ];
    for (let s = 0; s < shapeConfigs.length; s += 1) {
      const cfg = shapeConfigs[s];
      const list = Array.isArray(cfg.list) ? cfg.list : [];
      const limit = Math.min(list.length, 6);
      for (let i = 0; i < limit; i += 1) {
        const point = list[i];
        if (!point) continue;
        const [cx, cy] = point;
        const [wx, wy] = coordinates.getRenderedWorldPosition(cx, cy);
        drawLines(
          cx,
          cy + 16,
          [`${cfg.tag} x:${Math.round(wx)}`, `y:${Math.round(wy)}`],
          cfg.fill,
          "rgba(67, 127, 255, 0.45)"
        );
      }
    }

    if (state.lastFarmTarget && Number.isFinite(state.lastFarmTarget.wx)) {
      const canvasPoint = coordinates.worldToCanvasPosition(
        state.lastFarmTarget.wx,
        state.lastFarmTarget.wy
      );
      const [fx, fy] = canvasPoint;
      if (fx != null && fy != null) {
        drawLines(
          fx,
          fy + 18,
          [
            `farm: ${state.lastFarmTarget.type || "unknown"}`,
            `@${Math.round(state.lastFarmTarget.wx)},${Math.round(
              state.lastFarmTarget.wy
            )}`,
          ],
          "#d6ffe3",
          "rgba(46, 112, 255, 0.35)"
        );
      }
    }

    // Aim blend telemetry snapshot
    const aimDebug = state.lastAimDebug;
    if (
      aimDebug &&
      Number.isFinite(aimDebug.timestamp) &&
      now - aimDebug.timestamp < 1600
    ) {
      const interceptTime =
        aimDebug.intercept && Number.isFinite(aimDebug.intercept.t)
          ? `${Math.round(aimDebug.intercept.t)}ms`
          : "n/a";
      const motion = aimDebug.motion || {};
      const motionVel = motion.velocity || {};
      const targetWorld = aimDebug.targetWorld || {};
      const aimWorld = aimDebug.aimWorld || {};
      const shooterVel = aimDebug.shooterVelocity || {};
      const lines = [
        `target: ${aimDebug.targetName || "unknown"}`,
        `dist: ${Math.round(aimDebug.dist || 0)}`,
        `weight: ${(aimDebug.weight ?? 0).toFixed(2)}`,
        `intercept: ${interceptTime}`,
        `t @${Math.round(targetWorld.x || 0)},${Math.round(
          targetWorld.y || 0
        )}`,
        `aim @${Math.round(aimWorld.x || 0)},${Math.round(
          aimWorld.y || 0
        )}`,
      ];
      if (
        Number.isFinite(motionVel.x) &&
        Number.isFinite(motionVel.y)
      ) {
        lines.push(
          `vx:${motionVel.x.toFixed(3)} vy:${motionVel.y.toFixed(3)}`
        );
      }
      if (
        Number.isFinite(shooterVel.x) &&
        Number.isFinite(shooterVel.y)
      ) {
        lines.push(
          `self vx:${shooterVel.x.toFixed(3)} vy:${shooterVel.y.toFixed(3)}`
        );
      }
      drawLines(
        canvas.width - 140,
        canvas.height - lines.length * lineHeight - 24,
        lines,
        "#e6f3ff",
        "rgba(67, 127, 255, 0.55)"
      );
    }

    ctx.restore();
  }

  return {
    renderAimOverlay,
    renderBulletSpeedOverlay,
    renderCoordinateOverlay,
  };
});
// ---- End src/features/visuals.js

// ---- Begin src/features/aimbot.js
DiepScript.define("features/aimbot", (require) => {
  // Central aiming brain: picks targets, computes intercepts, and issues input events.
  const state = require("core/state");
  const constants = require("core/constants");
  const math = require("core/math");
  const stats = require("core/stats");
  const coordinates = require("core/coordinates");
  const visuals = require("features/visuals");
  const playersRuntime = require("runtime/players");

  // When drone aim-only is active we constantly release fire to keep drones responsive.
  function ensureDroneAimOnlyState() {
    try {
      if (window.extern && typeof window.extern.onKeyUp === "function") {
        window.extern.onKeyUp(36);
      }
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] ensureDroneAimOnlyState:", error);
    }
    state.isFiring = false;
  }

  // Estimate how quickly the enemy moves toward/away from us to decide dodge potential.
  function getRadialVelocity(player) {
    const history = player.positionTable || [];
    let deltaDistance = 0;
    let samples = 0;
    for (let i = 1; i < history.length; i += 1) {
      const curr = history[i];
      const prev = history[i - 1];
      if (!curr || !prev) continue;
      const currDist = math.getDistance(
        state.playerX,
        state.playerY,
        curr.x,
        curr.y
      );
      const prevDist = math.getDistance(
        state.playerX,
        state.playerY,
        prev.x,
        prev.y
      );
      const dt = curr.timestamp - prev.timestamp;
      if (dt < 6) continue;
      deltaDistance += (currDist - prevDist) / dt;
      samples += 1;
    }
    return samples > 0 ? deltaDistance / samples : 0;
  }

  function estimateDodgeTime(player) {
    const distance = math.getDistance(
      state.playerX,
      state.playerY,
      player.wx,
      player.wy
    );
    const bulletSpeed = stats.calculateMainBulletSpeed();
    const radialVelocity = getRadialVelocity(player);
    const relative = bulletSpeed - radialVelocity;
    if (relative <= 0.001) return Infinity;
    return distance / relative;
  }

  function resolveBulletSpeed() {
    if (state.useConvarBulletSpeed) {
      try {
        const info = stats.getCurrentBulletSpeed();
        if (info && info.ok && typeof info.computedBulletSpeed === "number") {
          state.currentComputedBulletSpeed = info.computedBulletSpeed;
          return;
        }
      } catch (error) {
        if (state.isDebug) console.warn("[DiepScript] bullet speed via convar failed:", error);
      }
    }
    state.currentComputedBulletSpeed = stats.calculateMainBulletSpeed();
  }

  function isAimbotTriggerActive() {
    return state.useDroneAimOnlyForMinions
      ? Boolean(state.spaceDown)
      : Boolean(state.rightMouseDown);
  }

  function sendAim(x, y) {
    if (!window.extern) return;
    try {
      if (typeof window.extern.onTouchMove === "function") {
        window.extern.onTouchMove(-1, x, y, true);
      } else if (typeof window.extern.onMouseMove === "function") {
        window.extern.onMouseMove(x, y);
      } else if (typeof window.extern.onTouchMove === "function") {
        window.extern.onTouchMove(-1, x, y, true);
      }
    } catch (error) {
      if (state.isDebug) console.error("[DiepScript] sendAim failed:", error);
    }
  }

  function tapFire(duration = 50) {
    if (!window.extern) return;
    try {
      if (typeof window.extern.onKeyDown === "function") {
        window.extern.onKeyDown(36);
      }
      setTimeout(() => {
        try {
          if (typeof window.extern.onKeyUp === "function") {
            window.extern.onKeyUp(36);
          }
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] fire key up failed:", error);
        }
      }, duration);
    } catch (error) {
      if (state.isDebug) console.error("[DiepScript] tapFire failed:", error);
    }
  }

  // Claim control of the in-game cursor so subsequent aim updates stick.
  function lockMouse() {
    if (state.mouseLocked) return;
    state.mouseLocked = true;
    setTimeout(() => {
      state.isFiring = true;
      const stackClass = ["Hunter", "Predator"].includes(state.playerTank);
      if (state.useDroneAimOnlyForMinions) {
        ensureDroneAimOnlyState();
      } else if (stackClass) {
        tapFire();
      } else {
        try {
          if (window.extern && typeof window.extern.onKeyDown === "function") {
            window.extern.onKeyDown(36);
          }
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] hold fire failed:", error);
        }
      }
    }, 80);
  }

  // Release mouse control and key presses once the trigger condition clears.
  function unlockMouse() {
    if (!state.mouseLocked) return;
    state.mouseLocked = false;
    try {
      ensureDroneAimOnlyState();
      sendAim(state.mouseX, state.mouseY);
      setTimeout(() => {
        try {
          if (window.extern && typeof window.extern.onKeyUp === "function") {
            window.extern.onKeyUp(36);
          }
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] release fire failed:", error);
        }
      }, 80);
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] unlockMouse failed:", error);
    }
  }

  function aim(force = false) {
    const target = state.players
      .filter((player) => !player.teammate)
      .reduce((best, candidate) => {
        if (!best) return candidate;
        return playersRuntime.getPlayerWeight(candidate) >
          playersRuntime.getPlayerWeight(best)
          ? candidate
          : best;
      }, null);

    const enemyMightDodge =
      constants.destroyerAccuracy &&
      target &&
      ["Destroyer", "Hybrid", "Annihilator"].includes(state.playerTank) &&
      estimateDodgeTime(target) >= constants.averageEnemyDodgeTime;

    if (
      !target ||
      enemyMightDodge ||
      (!state.isAimbotActive && !force) ||
      !isAimbotTriggerActive()
    ) {
      state.lastAimDebug = null;
      unlockMouse();
      return;
    }

    lockMouse();
    resolveBulletSpeed();

    let aimWorldX;
    let aimWorldY;
    let debugInfo = null;

    if (state.useDroneAimOnlyForMinions) {
      const velocity = target.velocity || [0, 0];
      const vx = velocity[0] || 0;
      const vy = velocity[1] || 0;
      aimWorldX = target.wx - vx * constants.DRONE_AIM_LEAD_MS;
      aimWorldY = target.wy - vy * constants.DRONE_AIM_LEAD_MS;
      state.prevAimWorld = { x: aimWorldX, y: aimWorldY };
      debugInfo = {
        mode: "drone-direct-comp",
        dist: math.getDistance(state.playerX, state.playerY, aimWorldX, aimWorldY),
        vx,
        vy,
        weight: 0,
      };
    } else {
      const shooter = { x: state.playerX, y: state.playerY };
      const blend = math.blendPredictiveAim(
        shooter,
        target,
        state.shooterVelocity || [0, 0],
        state.currentComputedBulletSpeed,
        state.prevAimWorld,
        {
          minDist: 350,
          maxDist: 2000,
          minSamples: 3,
          goodSamples: 6,
          maxGoodT: 1200,
          minGoodT: 30,
          maxAngleDeg: 120,
          relRatioCap: 0.9,
          alphaSmooth: 0.7,
        }
      );
      aimWorldX = blend.x;
      aimWorldY = blend.y;
      state.prevAimWorld = { x: aimWorldX, y: aimWorldY };
      debugInfo = { ...blend.debug, weight: blend.weight };
    }

    if (
      state.isDebug &&
      debugInfo &&
      (debugInfo.dist < 1500 || Math.random() < 0.002)
    ) {
      console.log("[DiepScript][AIM BLEND]", debugInfo);
    }

    if (debugInfo) {
      const velocity = Array.isArray(target.velocity) ? target.velocity : [0, 0];
      const shooterVel = Array.isArray(state.shooterVelocity)
        ? state.shooterVelocity
        : [0, 0];
      state.lastAimDebug = {
        ...debugInfo,
        timestamp: performance.now(),
        targetName: target.name || "",
        targetScore: target.score || 0,
        targetWorld: { x: target.wx, y: target.wy },
        targetVelocity: { x: velocity[0] || 0, y: velocity[1] || 0 },
        shooterWorld: { x: state.playerX, y: state.playerY },
        shooterVelocity: { x: shooterVel[0] || 0, y: shooterVel[1] || 0 },
        aimWorld: { x: aimWorldX, y: aimWorldY },
      };
    } else {
      state.lastAimDebug = null;
    }

    const [screenX, screenY] = coordinates.worldToMousePosition(
      aimWorldX,
      aimWorldY
    );

    if (screenX != null && screenY != null) {
      sendAim(screenX, screenY);
      setTimeout(() => {
        state.isFiring = true;
        if (state.useDroneAimOnlyForMinions) {
          ensureDroneAimOnlyState();
        } else {
          tapFire();
        }
      }, 10);
    }

    visuals.renderAimOverlay(aimWorldX, aimWorldY, target.wx, target.wy);
  }

  return {
    aim,
    ensureDroneAimOnlyState,
    isAimbotTriggerActive,
    estimateDodgeTime,
    resolveBulletSpeed,
  };
});
// ---- End src/features/aimbot.js

// ---- Begin src/features/autofarm.js
DiepScript.define("features/autofarm", (require) => {
  // Handles passive farming behaviour by nudging the cursor toward shapes and clicking.
  const state = require("core/state");
  const constants = require("core/constants");
  const coordinates = require("core/coordinates");
  const math = require("core/math");
  const playersRuntime = require("runtime/players");

  function resetAutoAim() {
    state.autoAimX = null;
    state.autoAimY = null;
    state.lastFarmTarget = null;
  }

  function sendAutofarmAim(x, y) {
    if (!window.extern) return;
    try {
      if (typeof window.extern.onTouchMove === "function") {
        window.extern.onTouchMove(-1, x, y, true);
      } else if (typeof window.extern.onMouseMove === "function") {
        window.extern.onMouseMove(x, y);
      } else if (typeof window.extern.onTouchMove === "function") {
        window.extern.onTouchMove(-1, x, y, true);
      }
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] autofarm aim failed:", error);
    }
  }

  // Visual aid for debug sessions so we can see which shapes were detected.
  function drawDebugTargets() {
    if (!state.isDebug) return;
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.strokeStyle = "#9600D6";
    ctx.lineWidth = 1;
    state.neutralPentagons.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });

    ctx.strokeStyle = "#00FF00";
    state.neutralSquares.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });

    ctx.strokeStyle = "#FF9900";
    state.neutralTriangles.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    });

    ctx.restore();
  }

  // Priority selector – falls back to other shape types if the preferred one is missing.
  function chooseFarmTarget() {
    const shapeMap = {
      pentagon: state.neutralPentagons,
      square: state.neutralSquares,
      triangle: state.neutralTriangles,
    };

    const rank = {
      pentagon: 3,
      triangle: 2,
      square: 1,
    };
    const orderedTypes = ["pentagon", "triangle", "square"];
    const userPriority = orderedTypes.includes(state.farmPriority)
      ? state.farmPriority
      : null;

    let best = null;
    orderedTypes.forEach((type) => {
      const list = shapeMap[type];
      if (!list || list.length === 0) return;
      const nearestWorld = playersRuntime.nearestShapeWorld(list);
      if (!nearestWorld) return;
      const distance = math.getDistance(
        state.playerX,
        state.playerY,
        nearestWorld[0],
        nearestWorld[1]
      );
      const baseScore = (rank[type] || 0) * 10_000;
      const userBonus = userPriority === type ? 100_000 : 0;
      const score = userBonus + baseScore - distance;
      if (!best || score > best.score) {
        best = {
          type,
          world: nearestWorld,
          distance,
          score,
        };
      }
    });

    return best;
  }

  // Single tick of autofarm; returns true if we acted on a shape this frame.
  function autofarmTick() {
    if (!window.extern || !window.extern.doesHaveTank()) {
      return false;
    }

    drawDebugTargets();

    const choice = chooseFarmTarget();
    if (!choice || !choice.world) {
      state.lastFarmTarget = null;
      return false;
    }

    state.lastFarmTarget = {
      type: choice.type,
      wx: choice.world[0],
      wy: choice.world[1],
      distance: choice.distance,
    };

    const [desiredX, desiredY] = coordinates.worldToMousePosition(
      choice.world[0],
      choice.world[1]
    );

    if (desiredX == null || desiredY == null) return false;

    if (state.autoAimX === null || state.autoAimY === null) {
      state.autoAimX = state.mouseX || window.innerWidth / 2;
      state.autoAimY = state.mouseY || window.innerHeight / 2;
    }

    state.autoAimX += (desiredX - state.autoAimX) * constants.AUTO_AIM_LERP;
    state.autoAimY += (desiredY - state.autoAimY) * constants.AUTO_AIM_LERP;

    sendAutofarmAim(state.autoAimX, state.autoAimY);

    const dx = state.autoAimX - desiredX;
    const dy = state.autoAimY - desiredY;
    const dist = Math.hypot(dx, dy);

    if (dist <= constants.AUTO_AIM_FIRE_THRESHOLD && !state.mouseLocked) {
      state.isFiring = true;
      try {
        if (window.extern && typeof window.extern.onKeyDown === "function") {
          window.extern.onKeyDown(36);
        }
        setTimeout(() => {
          try {
            if (window.extern && typeof window.extern.onKeyUp === "function") {
              window.extern.onKeyUp(36);
            }
          } catch (error) {
            if (state.isDebug) console.warn("[DiepScript] autofarm key up failed:", error);
          }
        }, 50);
      } catch (error) {
        if (state.isDebug) console.warn("[DiepScript] autofarm fire failed:", error);
      }
    }

    return true;
  }

  return {
    autofarmTick,
    resetAutoAim,
  };
});
// ---- End src/features/autofarm.js

// ---- Begin src/features/spinner.js
DiepScript.define("features/spinner", (require) => {
  // Emits circular cursor motion when the spinner toggle is active.
  const state = require("core/state");

  function tickSpinner() {
    if (
      !state.isSpinning ||
      state.isShooting ||
      state.isFiring ||
      !window.extern ||
      !window.extern.doesHaveTank()
    ) {
      return;
    }

    state.spinAngle += state.spinSpeed;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = 120;
    const targetX = centerX + radius * Math.cos(state.spinAngle);
    const targetY = centerY + radius * Math.sin(state.spinAngle);

    try {
      if (typeof window.extern.onTouchMove === "function") {
        window.extern.onTouchMove(-1, targetX, targetY, true);
      } else if (typeof window.extern.onMouseMove === "function") {
        window.extern.onMouseMove(targetX, targetY);
      }
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] spinner failed:", error);
    }
  }

  return {
    tickSpinner,
  };
});
// ---- End src/features/spinner.js

// ---- Begin src/features/fov.js
DiepScript.define("features/fov", (require) => {
  // Zoom controller that mimics the original script’s mouse wheel and +/- behaviour.
  const state = require("core/state");
  const constants = require("core/constants");

  let intervalId = null;
  let initialized = false;

  function onWheel(event) {
    const direction = -Math.sign(event.deltaY) || 0;
    if (direction === 0) return;
    state.setFov +=
      direction * 0.02 * Math.log10(state.setFov / 0.55 + 1);
  }

  function onKeyDown(event) {
    state.keyStates.set(event.keyCode, 1);
  }

  function onKeyUp(event) {
    state.keyStates.set(event.keyCode, 0);
  }

  function updateFov() {
    if (!window.extern || !window.extern.doesHaveTank()) {
      return;
    }
    if (state.keyStates.get(187)) {
      state.setFov += 0.01 * Math.log10(state.setFov / 0.55 + 1);
    }
    if (state.keyStates.get(189)) {
      state.setFov -= 0.01 * Math.log10(state.setFov / 0.55 + 1);
    }

    state.foxv += (state.setFov - state.foxv) * constants.FOV_LERP;
    try {
      window.extern.setScreensizeZoom(1, state.foxv);
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] setScreensizeZoom failed:", error);
    }
  }

  function initFovController() {
    if (initialized) return;
    initialized = true;

    document.addEventListener("wheel", onWheel);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    intervalId = window.setInterval(updateFov, constants.FOV_UPDATE_INTERVAL);
  }

  function disposeFovController() {
    if (!initialized) return;
    document.removeEventListener("wheel", onWheel);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    if (intervalId) window.clearInterval(intervalId);
    initialized = false;
  }

  return {
    initFovController,
    disposeFovController,
    updateFov,
  };
});
// ---- End src/features/fov.js

// ---- Begin src/features/stacking.js
DiepScript.define("features/stacking", (require) => {
  // Implements the timed key presses required for Hunter / Predator bullet stacking.
  const state = require("core/state");
  const constants = require("core/constants");
  const stats = require("core/stats");

  function shoot(duration) {
    if (!window.extern) return;
    state.isFiring = true;
    try {
      if (typeof window.extern.onKeyDown === "function") {
        window.extern.onKeyDown(36);
      }
      setTimeout(() => {
        try {
          if (typeof window.extern.onKeyUp === "function") {
            window.extern.onKeyUp(36);
          }
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] shoot key up failed:", error);
        }
      }, duration);
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] shoot failed:", error);
    }
  }

  function stack() {
    if (!window.extern) return;

    const reloadLevel = stats.getStats().reload;
    try {
      if (typeof window.extern.onKeyUp === "function") {
        window.extern.onKeyUp(36);
      }
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] release fire before stack failed:", error);
    }

    if (state.playerTank === "Hunter") {
      shoot(constants.hunterStackTime[reloadLevel][0]);
      setTimeout(() => {
        try {
          window.extern.onKeyDown(5);
          window.extern.onKeyUp(5);
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] hunter stack ability failed:", error);
        }
      }, constants.hunterStackTime[reloadLevel][1]);
    } else if (state.playerTank === "Predator") {
      shoot(constants.predatorStackTime[reloadLevel][0]);
      setTimeout(() => {
        shoot(constants.predatorStackTime[reloadLevel][1]);
      }, constants.predatorStackTime[reloadLevel][2]);
      setTimeout(() => {
        try {
          window.extern.onKeyDown(5);
          window.extern.onKeyUp(5);
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] predator stack ability failed:", error);
        }
      }, constants.predatorStackTime[reloadLevel][3]);
    }
  }

  return {
    stack,
  };
});
// ---- End src/features/stacking.js

// ---- Begin src/hooks/canvas.js
DiepScript.define("hooks/canvas", (require) => {
  // Hooks the game's canvas so we can observe draw calls without touching game code.
  const state = require("core/state");
  const math = require("core/math");
  const coordinates = require("core/coordinates");
  const menu = require("ui/menu");

  class CanvasInterceptor {
    // Wraps every 2D context method we care about and lets modules register listeners.
    constructor() {
      this.hooks = {};
      this.initialised = false;
      document.addEventListener("DOMContentLoaded", () => this.setup());
    }

    setup() {
      if (this.initialised) return;
      this.initialised = true;

      const originalGetElementById = HTMLDocument.prototype.getElementById;
      HTMLDocument.prototype.getElementById = function patchedGetElementById(id) {
        const elem = originalGetElementById.call(this, id);
        if (id === "canvas") return wrapCanvas(elem);
        return elem;
      };

      const originalCreateElement = HTMLDocument.prototype.createElement;
      HTMLDocument.prototype.createElement = function patchedCreateElement(tag) {
        const elem = originalCreateElement.call(this, tag);
        if (tag === "canvas") return wrapCanvas(elem);
        return elem;
      };

      const wrapCanvas = (originalCanvas) => {
        class HTMLCanvasElementProxy {}
        const proxy = new HTMLCanvasElementProxy();
        proxy.width = originalCanvas.width;
        proxy.height = originalCanvas.height;
        proxy.transferControlToOffscreen =
          originalCanvas.transferControlToOffscreen.bind(originalCanvas);
        proxy.toDataURL = originalCanvas.toDataURL.bind(originalCanvas);
        proxy.toBlob = originalCanvas.toBlob.bind(originalCanvas);
        proxy.captureStream = originalCanvas.captureStream.bind(originalCanvas);

        proxy.getContext = (...args) => {
          const ctx = originalCanvas.getContext(...args);
          if (args[0] !== "2d") return ctx;
          return new Proxy(ctx, {
            get: (target, prop) => {
              const original = target[prop];
              if (typeof original !== "function") return original;
              if (!Object.prototype.hasOwnProperty.call(this.hooks, prop)) {
                return original.bind(target);
              }
              return (...pArgs) => {
                let currentCtx = ctx;
                let currentArgs = pArgs;
                let skip = false;
                this.hooks[prop].forEach((hookFn) => {
                  const result = hookFn(currentCtx, ...currentArgs);
                  if (!result) {
                    skip = true;
                  } else {
                    [currentCtx, currentArgs] = result;
                  }
                });
                if (skip) return undefined;
                return original.apply(target, currentArgs);
              };
            },
            set: (target, prop, value) => {
              target[prop] = value; // eslint-disable-line no-param-reassign
              return true;
            },
          });
        };
        return proxy;
      };

      menu.ensureMenu();
    }

    register(methodName, hookFn) {
      if (!this.hooks[methodName]) {
        this.hooks[methodName] = [];
      }
      this.hooks[methodName].push(hookFn);
    }
  }

  const interceptor = new CanvasInterceptor();

  // Public helper so other modules can attach to canvas methods.
  function registerContextHook(methodName, hookFn) {
    interceptor.register(methodName, hookFn);
  }

  registerContextHook("setTransform", (context, ...args) => {
    state.ctxTransform = args;
    return [context, args];
  });

  registerContextHook("drawImage", (context, ...args) => {
    const transform = state.ctxTransform || [0, 0, 0, 0, 0, 0];
    if (args[0] && args[0].renderMethod) {
      const x = transform[4] + args[1];
      const y = transform[5] + args[2];
      if (args[0].renderMethod.method === "text") {
        state.text.push({
          x,
          y,
          cw: args[0].width,
          ch: args[0].height,
          mx: x + args[0].width / 4,
          my: y + args[0].height / 4,
          text: args[0].renderMethod.text,
        });
      }
    }
    return [context, args];
  });

  registerContextHook("strokeText", (context, ...args) => {
    if (context.canvas.id !== "canvas") {
      context.canvas.renderMethod = {
        method: "text",
        text: args[0],
        args,
        fillStyle: context.fillStyle,
      };
      if (args[0].startsWith("Lvl ")) {
        if (args[0][5] === " ") {
          state.playerLevel = Number(args[0].slice(4, 5));
          state.playerTank = args[0].slice(6);
        } else {
          state.playerLevel = Number(args[0].slice(4, 6));
          state.playerTank = args[0].slice(7);
        }
      }
    }
    return [context, args];
  });

  registerContextHook("arc", (context, ...args) => {
    // `arc` runs for both tanks and bullets; radius + transform decide what we capture.
    const transform = state.ctxTransform || [0, 0, 0, 0, 0, 0];
    if (
      context.canvas.id === "canvas" &&
      transform[4] === state.lastArc[0] &&
      transform[5] === state.lastArc[1]
    ) {
      state.tankShapes.push({
        x: transform[4],
        y: transform[5],
        radius: Math.hypot(transform[1], transform[0]),
        fillStyle: context.fillStyle,
      });
      state.lastArc = [Infinity, Infinity];
    } else {
      state.lastArc = [transform[4], transform[5]];
    }

    try {
      if (context.canvas && context.canvas.id === "canvas") {
        const smallRadius = Math.hypot(transform[1], transform[0]);
        const BULLET_RADIUS_THRESHOLD = 8;
        if (smallRadius > 0 && smallRadius <= BULLET_RADIUS_THRESHOLD) {
          const speed =
            typeof state.currentComputedBulletSpeed === "number"
              ? state.currentComputedBulletSpeed
              : null;
          state.bulletPositions.push({
            x: transform[4],
            y: transform[5],
            radius: smallRadius,
            speed,
            fillStyle: context.fillStyle,
          });
        }
      }
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] arc hook failed:", error);
    }

    return [context, args];
  });

  registerContextHook("stroke", (context, ...args) => {
    if (
      ["#cccccc", "#cdcdcd"].includes(context.fillStyle) &&
      context.strokeStyle === "#000000"
    ) {
      state.fov = context.globalAlpha / state.gameStyle.ren_grid_base_alpha;
    }
    return [context, args];
  });

  registerContextHook("strokeRect", (context, ...args) => {
    const t = context.getTransform();
    state.minimapPos = [t.e, t.f];
    state.minimapSize = [t.a, t.d];
    return [context, args];
  });

  registerContextHook("beginPath", (context, ...args) => {
    state.pathPosition = 0;
    state.pathVertices = [];
    return [context, args];
  });

  registerContextHook("moveTo", (context, ...args) => {
    state.pathPosition = 1;
    state.pathVertices.push(args);
    return [context, args];
  });

  registerContextHook("lineTo", (context, ...args) => {
    state.pathPosition += 1;
    state.pathVertices.push(args);
    return [context, args];
  });

  registerContextHook("fill", (context, ...args) => {
    // capture minimap arrow + neutral shapes to feed autofarm targeting.
    const transform = state.ctxTransform || [0, 0, 0, 0, 0, 0];
    const average = math.getAverage(state.pathVertices);

    if (
      context.fillStyle === "#000000" &&
      context.globalAlpha > 0.949 &&
      state.pathPosition === 3
    ) {
      state.arrowPos = average;
      coordinates.updatePlayerWorldPosition();
    } else if (
      state.pathPosition === 4 &&
      context.fillStyle &&
      context.fillStyle.toLowerCase().includes("ffe869")
    ) {
      state.neutralSquares.push([
        transform[4] + average[0],
        transform[5] + average[1],
      ]);
    } else if (
      state.pathPosition === 5 &&
      context.fillStyle &&
      context.fillStyle.toLowerCase().includes("768dfc")
    ) {
      state.neutralPentagons.push([
        transform[4] + average[0],
        transform[5] + average[1],
      ]);
    } else if (
      state.pathPosition === 3 &&
      context.fillStyle &&
      context.fillStyle.toLowerCase().includes("fc7677")
    ) {
      state.neutralTriangles.push([
        transform[4] + average[0],
        transform[5] + average[1],
      ]);
    }

    return [context, args];
  });

  return {
    registerContextHook,
  };
});
// ---- End src/hooks/canvas.js

// ---- Begin src/hooks/input.js
DiepScript.define("hooks/input", (require) => {
  // Normalises DOM input events into state flags so features can stay declarative.
  const state = require("core/state");
  const constants = require("core/constants");
  const aimbot = require("features/aimbot");
  const stacking = require("features/stacking");

  let initialized = false;

  function handleMouseDown(ev) {
    if (ev.button === 0) {
      state.mousePressed = true;
      if (state.mouseLocked && window.extern) {
        state.isFiring = true;
        try {
          if (typeof window.extern.onKeyDown === "function") {
            window.extern.onKeyDown(36);
          }
          setTimeout(() => {
            try {
              if (typeof window.extern.onKeyDown === "function") {
                window.extern.onKeyDown(36);
              }
            } catch (error) {
              if (state.isDebug) console.warn("[DiepScript] repeat fire down failed:", error);
            }
          }, 10);
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] mouse fire down failed:", error);
        }
      }
    } else if (ev.button === 2) {
      state.rightMouseDown = true;
    }
  }

  function handleMouseUp(ev) {
    if (ev.button === 0) {
      state.mousePressed = false;
      try {
        if (window.extern && typeof window.extern.onKeyUp === "function") {
          window.extern.onKeyUp(36);
        }
      } catch (error) {
        if (state.isDebug) console.warn("[DiepScript] mouse fire up failed:", error);
      }
  } else if (ev.button === 2) {
    state.rightMouseDown = false;
    if (state.mouseLocked) {
      state.mouseLocked = false;
      try {
        aimbot.ensureDroneAimOnlyState();
        if (window.extern && typeof window.extern.onTouchMove === "function") {
          window.extern.onTouchMove(-1, state.mouseX, state.mouseY, true);
        }
      } catch (error) {
        if (state.isDebug) console.warn("[DiepScript] right mouse release move failed:", error);
      }
      setTimeout(() => {
        try {
          if (window.extern && typeof window.extern.onKeyUp === "function") {
            window.extern.onKeyUp(36);
          }
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] right mouse release fire up failed:", error);
        }
      }, 80);
    }
  }
}

  function handleContextMenu(ev) {
    // ev.preventDefault(); // Uncomment to block the context menu during right-click aiming
  }

  function handleTouchStart() {
    state.isShooting = true;
  }

  function handleTouchEnd() {
    state.isShooting = false;
  }

  function handleMouseMove(ev) {
    if (state.isSpinning) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
    }
  }

  function handleTouchMove(ev) {
    if (state.isSpinning) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
    }
  }

  // Keyboard shortcuts mirror the original script (toggle aimbot/stack/menu).
  function handleGlobalKeydown(ev) {
  if (ev.code === constants.KeyBindings.toggleAimbot) {
      state.isAimbotActive = !state.isAimbotActive;
      if (
        window.__common__ &&
        window.__common__.active_gamemode === "sandbox"
      ) {
        try {
          window.extern.inGameNotification(
            "Aimbot Doesn't Work in Sandbox",
            0xf533ff
          );
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] notify sandbox failed:", error);
        }
        state.isAimbotActive = false;
      } else {
        try {
          window.extern.inGameNotification(
            state.isAimbotActive ? "Aimbot: ON" : "Aimbot: OFF",
            0xf533ff
          );
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] notify toggle failed:", error);
        }
      }
      const checkbox = document.getElementById("aimbot-checkbox");
      if (checkbox) checkbox.checked = Boolean(state.isAimbotActive);
    } else if (ev.code === constants.KeyBindings.stack) {
      if (["Hunter", "Predator"].includes(state.playerTank)) {
        stacking.stack();
        try {
          window.extern.inGameNotification("Stacking Bullets...", 0xf533ff);
        } catch (error) {
          if (state.isDebug) console.warn("[DiepScript] notify stack failed:", error);
        }
      }
  } else if (ev.code === constants.KeyBindings.toggleMenu && state.menuContainer) {
      const menu = state.menuContainer;
      const isOpen = menu.classList.contains("active");
      if (isOpen) {
        if (typeof menu.__hide === "function") menu.__hide();
        else menu.style.display = "none";
      } else {
        if (typeof menu.__show === "function") menu.__show();
        else menu.style.display = "block";
      }
    }
}

  function handleSpaceKeydown(ev) {
    if (ev.code === "Space" || ev.keyCode === 32) {
      state.spaceDown = true;
    }
  }

  function handleSpaceKeyup(ev) {
    if (ev.code === "Space" || ev.keyCode === 32) {
      state.spaceDown = false;
    }
  }

  function initInputHooks() {
    if (initialized) return;
    initialized = true;

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("touchmove", handleTouchMove, true);
    document.addEventListener("keydown", handleGlobalKeydown);
    document.addEventListener("keydown", handleSpaceKeydown, true);
    document.addEventListener("keyup", handleSpaceKeyup, true);
  }

  return {
    initInputHooks,
  };
});
// ---- End src/hooks/input.js

// ---- Begin src/ui/menu.js
DiepScript.define("ui/menu", (require) => {
  // Modularized unified menu for DiepScript
  const state = require("core/state");
  const autofarm = require("features/autofarm");

  let welcomeActive = true;
  let keyHandlerAdded = false;

  function ensureMenu() {
    // If menu already exists, toggle visibility by removing/adding .active
    try {
      if (state.menuContainer && state.menuContainer.parentNode) {
        const el = state.menuContainer;
        if (el.classList.contains("active")) {
          el.classList.remove("active");
          setTimeout(() => (el.style.display = "none"), 950);
        } else {
          el.style.display = "flex";
          requestAnimationFrame(() => el.classList.add("active"));
        }
        return;
      }
    } catch (e) {
      // fallthrough to create
    }

    // Inject CSS
    const style = document.createElement("style");
    style.textContent = `
/* Main container */
.main-div {
  position: absolute;
  top: 50%;
  margin-top: -225px;
  left: 50%;
  margin-left: -200px;
  width: 0px;
  height: 0px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(52,78,180,0.48), rgba(82,232,255,0.18));
  backdrop-filter: blur(16px);
  border: 1px solid rgba(82,232,255,0.32);
  font-family: "Kanit", sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgb(212,209,209);
  z-index: 1000000;
  border-radius: 5%;
  animation: close 0.95s ease-in-out forwards;
  box-shadow: 0 22px 46px rgba(67,127,255,0.16);
  user-select: none;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
  padding-bottom: 18px;
}
.main-div, .main-div * { box-sizing: border-box; }

.main-div.active {
  width: 400px;
  height: 450px;
  transform-origin: 200px 225px;
  animation: open 0.95s ease-in-out forwards;
}

/* Title / drag handle */
.main-title { display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:4px; cursor: grab; }
.main-title.grabbing { cursor: grabbing; }
.main-title .bottom { font-size: 1.25rem; position: relative; }
.main-title span { font-size: 1rem; display: block; letter-spacing: 0.2rem; transform: translate(-8px, 8px); }

/* Tabs/buttons */
.menu-row { display:flex; width:100%; gap:8px; justify-content:space-between; }
.menu { flex:1; display:flex; flex-direction:column; align-items:stretch; }
.menu button {
  color:#eaf5ff;
  background: rgba(67,127,255,0.08);
  border: 1px solid rgba(82,232,255,0.18);
  padding:8px 10px;
  margin-bottom:6px;
  font-weight:600;
  text-transform: uppercase;
  cursor: pointer;
  width:100%;
  min-width:0;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:ellipsis;
}
.menu button:hover { transform: scale(1.02); color:#fff; }
.menu button.active { background: linear-gradient(180deg, rgba(82,232,255,0.28), rgba(67,127,255,0.24)); color:#fff; border-color: rgba(82,232,255,0.45); }

/* Sections */
.section-wrap { width:100%; display:block; padding-top:8px; overflow-y:auto; overflow-x:hidden; flex:1; -webkit-overflow-scrolling: touch; }
.section { display:none; }
.section.active { display:block; }

/* Rows */
.row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.02); }
.row:last-child { border-bottom:none; }
.row > * { min-width:0; }
.label { color:#dbeeff; font-weight:600; font-size:0.95rem; flex:0 1 45%; white-space:normal; word-break:break-word; }
.small { font-size:0.8rem; color:#9fbfe6; margin-top:6px; line-height:1.2; }

/* Inputs */
.diepcb { width:16px; height:16px; transform:scale(1.05); margin-left:6px; flex:0 0 auto; }
.slider { width:160px; max-width:60%; }
.diepb-select { width:100%; padding:6px; background:rgba(67,127,255,0.12); color:#eaf5ff; border:1px solid rgba(82,232,255,0.24); }

/* Welcome section */
.welcome-section { display:flex; flex-direction:column; align-items:center; justify-content:flex-start; padding:12px 8px; gap:8px; text-align:center; }
.welcome-pfp { width:96px; height:96px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.12); box-shadow: 0 4px 12px rgba(67,127,255,0.28); }
.welcome-title { font-size:1.15rem; color:#fff; font-weight:700; margin-top:6px; }
.welcome-info { font-size:0.92rem; color:#9fbfe6; max-width:92%; line-height:1.3; }

/* Footer */
.footer { margin-top:8px; font-size:0.82rem; color:#9fbfe6; text-align:right; width:100%; padding-right:8px; }

/* Animations */
@keyframes open {
  0% { width: 0; height: 0; border-radius: 2%; }
  25% { width: 400px; height: 0; }
  65% { border-radius: 5%; }
  100% { height: 450px; border-radius: 50% 20% / 10% 40%; }
}
@keyframes close {
  0% { width: 400px; height: 450px; border-radius: 50% 20% / 10% 40%; }
  45% { width: 400px; height: 0; border-radius: 10%; }
  70% { width: 0; }
  100% { width: 0; height: 0; }
}

/* Scrollbar styling */
.section-wrap::-webkit-scrollbar { width:10px; height:10px; }
.section-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius:8px; }
.section-wrap::-webkit-scrollbar-track { background: rgba(67,127,255,0.12); border-radius:8px; }

/* Notification cleanup */
body div[id*="notification"],
body div[class*="notification"],
body span[id*="notification"],
body span[class*="notification"] {
  background: none !important;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

/* keep menu controls interactive if page blocks pointer-events */
.main-div * { pointer-events: auto; }
@media (max-width:480px) {
  .main-div { left:12px; top:12px; width:calc(100% - 24px); margin-left:0; margin-top:0; transform:none; }
}
`;
    document.head.appendChild(style);

    // Build container
    const container = document.createElement("div");
    container.className = "main-div";
    container.style.display = "none";

    // Title / header (drag handle)
    const titleWrap = document.createElement("div");
    titleWrap.className = "main-title";
    titleWrap.innerHTML = `<span>System</span><div class="bottom">Settings</div>`;
    titleWrap.style.cursor = "grab";
    container.appendChild(titleWrap);

    // Tabs (no tab for welcome)
    const tabs = [
      { id: "aim", label: "Aim" },
      { id: "visuals", label: "Visuals" },
      { id: "spin", label: "Spin" },
      { id: "farm", label: "Farm" },
      { id: "builds", label: "Builds" },
      { id: "info", label: "Info" },
    ];

    const menuRow = document.createElement("div");
    menuRow.className = "menu-row";
    const leftMenu = document.createElement("div");
    leftMenu.className = "menu";
    const rightMenu = document.createElement("div");
    rightMenu.className = "menu";

    tabs.slice(0, 3).forEach((t) => {
      const btn = document.createElement("button");
      btn.id = `tab-btn-${t.id}`;
      btn.innerText = t.label;
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); switchSection(t.id); });
      leftMenu.appendChild(btn);
    });
    tabs.slice(3).forEach((t) => {
      const btn = document.createElement("button");
      btn.id = `tab-btn-${t.id}`;
      btn.innerText = t.label;
      btn.addEventListener("click", (ev) => { ev.stopPropagation(); switchSection(t.id); });
      rightMenu.appendChild(btn);
    });

    menuRow.appendChild(leftMenu);
    menuRow.appendChild(rightMenu);
    container.appendChild(menuRow);

    // Section wrapper
    const sectionWrap = document.createElement("div");
    sectionWrap.className = "section-wrap";
    container.appendChild(sectionWrap);

    // helpers
    const sections = {};
    function makeSection(id, active = false) {
      const s = document.createElement("div");
      s.className = "section" + (active ? " active" : "");
      s.id = `section-${id}`;
      sections[id] = s;
      sectionWrap.appendChild(s);
      return s;
    }
    function appendRow(sec, labelText, inputEl) {
      const row = document.createElement("div");
      row.className = "row";
      const lbl = document.createElement("div");
      lbl.className = "label";
      lbl.innerText = labelText;
      row.appendChild(lbl);
      row.appendChild(inputEl);
      row.addEventListener("mousedown", (e) => e.stopPropagation());
      row.addEventListener("click", (e) => e.stopPropagation());
      sec.appendChild(row);
      return row;
    }

    // Welcome (one-time)
    welcomeActive = true;
    const secWelcome = makeSection("welcome", true);
    secWelcome.classList.add("welcome-section");
    {
      const pfp = document.createElement("img");
      pfp.className = "welcome-pfp";
      pfp.src = "https://i.imgur.com/a8eGMXu.png";
      pfp.alt = "Profile";
      pfp.addEventListener("mousedown", (e) => e.stopPropagation());
      secWelcome.appendChild(pfp);

      const wtitle = document.createElement("div");
      wtitle.className = "welcome-title";
      wtitle.innerText = "Welcome User";
      secWelcome.appendChild(wtitle);

      const winfo = document.createElement("div");
      winfo.className = "welcome-info";
      winfo.innerHTML = `
        <div><strong>Swan RC</strong> — quick controls and info.</div>
        <div style="margin-top:8px;">Use the tabs to enable features. RMB = toggle autofarm, U = aimbot, M = menu.</div>
        <div style="margin-top:6px;">This welcome screen is one-time: switch to any tab to continue.</div>
      `;
      winfo.addEventListener("mousedown", (e) => e.stopPropagation());
      secWelcome.appendChild(winfo);
    }

    // --- Spin section ---
    const secSpin = makeSection("spin", false);
    {
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "spinner-checkbox";
      cb1.className = "diepcb";
      cb1.checked = Boolean(state.isSpinning);
      cb1.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isSpinning = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Spinner: ON" : "Spinner: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secSpin, "Enable Spinner", cb1);

      const labelAndSlider = document.createElement("div");
      labelAndSlider.style.display = "flex";
      labelAndSlider.style.flexDirection = "column";
      labelAndSlider.style.alignItems = "flex-end";
      const speedLabel = document.createElement("div");
      speedLabel.className = "small";
      speedLabel.id = "spin-speed-label";
      speedLabel.innerText = `Speed: ${(typeof state.spinSpeed === "number" ? state.spinSpeed.toFixed(2) : "0.00")}`;
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = "2";
      slider.step = "0.01";
      slider.value = (typeof state.spinSpeed === "number" ? state.spinSpeed.toString() : "0");
      slider.id = "spin-slider";
      slider.className = "slider";
      slider.addEventListener("input", (ev) => {
        ev.stopPropagation();
        state.spinSpeed = parseFloat(ev.target.value);
        speedLabel.innerText = `Speed: ${state.spinSpeed.toFixed(2)}`;
      });
      labelAndSlider.appendChild(speedLabel);
      labelAndSlider.appendChild(slider);
      const row = document.createElement("div");
      row.className = "row";
      const lbl = document.createElement("div");
      lbl.className = "label";
      lbl.innerText = "Speed";
      row.appendChild(lbl);
      row.appendChild(labelAndSlider);
      row.addEventListener("mousedown", (e) => e.stopPropagation());
      row.addEventListener("click", (e) => e.stopPropagation());
      secSpin.appendChild(row);
    }

    // --- Aim section ---
    const secAim = makeSection("aim", false);
    {
      const cbA = document.createElement("input");
      cbA.type = "checkbox";
      cbA.id = "aimbot-checkbox";
      cbA.className = "diepcb";
      cbA.checked = Boolean(state.isAimbotActive);
      cbA.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isAimbotActive = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Aimbot: ON" : "Aimbot: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secAim, "Enable Aimbot", cbA);

      const cbC = document.createElement("input");
      cbC.type = "checkbox";
      cbC.id = "convar-bullet-checkbox";
      cbC.className = "diepcb";
      cbC.checked = Boolean(state.useConvarBulletSpeed);
      cbC.addEventListener("change", function (e) {
        e.stopPropagation();
        state.useConvarBulletSpeed = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Using convar bullet speed" : "Using calculated bullet speed", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secAim, "Convar Bullet Speed", cbC);

      const cbD = document.createElement("input");
      cbD.type = "checkbox";
      cbD.id = "drone-aimonly-checkbox";
      cbD.className = "diepcb";
      cbD.checked = Boolean(state.useDroneAimOnlyForMinions);
      cbD.addEventListener("change", function (e) {
        e.stopPropagation();
        state.useDroneAimOnlyForMinions = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Drone mode: ON (space)" : "Drone mode: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secAim, "Drone Aim", cbD);

      const info = document.createElement("div");
      info.className = "small";
      info.innerText = "Hold RMB to engage the aimbot when this option is enabled.";
      info.addEventListener("mousedown", (e) => e.stopPropagation());
      secAim.appendChild(info);
    }

    // --- Farm section ---
    const secFarm = makeSection("farm", false);
    {
      const cbF = document.createElement("input");
      cbF.type = "checkbox";
      cbF.id = "autofarm-checkbox";
      cbF.className = "diepcb";
      cbF.checked = Boolean(state.isAutoFarm);
      cbF.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isAutoFarm = this.checked;
        if (!state.isAutoFarm) autofarm.resetAutoAim && autofarm.resetAutoAim();
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "AutoFarm: ON" : "AutoFarm: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secFarm, "Enable AutoFarm", cbF);

      const cbFH = document.createElement("input");
      cbFH.type = "checkbox";
      cbFH.id = "autofarm-hold-checkbox";
      cbFH.className = "diepcb";
      cbFH.checked = Boolean(state.autofarmOnRightHold);
      cbFH.addEventListener("change", function (e) {
        e.stopPropagation();
        state.autofarmOnRightHold = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "RMB: ON" : "RMB: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secFarm, "RMB Toggle", cbFH);

      const rmbInfo = document.createElement("div");
      rmbInfo.className = "small";
      rmbInfo.style.marginTop = "6px";
      rmbInfo.innerText = "Hold RMB to engage the aimbot when this option is enabled.";
      rmbInfo.addEventListener("mousedown", (e) => e.stopPropagation());
      secFarm.appendChild(rmbInfo);

      const prioWrap = document.createElement("div");
      prioWrap.style.display = "flex";
      prioWrap.style.gap = "6px";
      prioWrap.style.marginTop = "6px";

      const createPriorityOption = (id, label, value) => {
        const wrapper = document.createElement("label");
        wrapper.style.flex = "1";
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "farm-priority";
        input.id = `farm-priority-${id}`;
        input.value = value;
        input.checked = state.farmPriority === value;
        input.addEventListener("change", (e) => {
          e.stopPropagation();
          if (input.checked) state.farmPriority = value;
        });
        wrapper.appendChild(input);
        wrapper.appendChild(document.createTextNode(label));
        return wrapper;
      };

      prioWrap.appendChild(createPriorityOption("pentagon", "Pentagon", "pentagon"));
      prioWrap.appendChild(createPriorityOption("square", "Square", "square"));
      prioWrap.appendChild(createPriorityOption("triangle", "Triangle", "triangle"));
      secFarm.appendChild(prioWrap);
    }

    // --- Visuals section ---
    const secVis = makeSection("visuals", false);
    {
      const cb1 = document.createElement("input");
      cb1.type = "checkbox";
      cb1.id = "debug-checkbox";
      cb1.className = "diepcb";
      cb1.checked = Boolean(state.isDebug);
      cb1.addEventListener("change", function (e) {
        e.stopPropagation();
        state.isDebug = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Debug: ON" : "Debug: OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secVis, "Debug Lines", cb1);

      const cb2 = document.createElement("input");
      cb2.type = "checkbox";
      cb2.id = "show-bullet-speed-checkbox";
      cb2.className = "diepcb";
      cb2.checked = Boolean(state.showBulletSpeeds);
      cb2.addEventListener("change", function (e) {
        e.stopPropagation();
        state.showBulletSpeeds = this.checked;
        if (window.extern) { try { window.extern.inGameNotification(this.checked ? "Speed overlay ON" : "Speed overlay OFF", 0x2b7bb8); } catch (_) {} }
      });
      appendRow(secVis, "Bullet Speed Overlay", cb2);

    }

    // --- Builds section ---
    const secBuilds = makeSection("builds", false);
    {
      const presets = [
        { name: "rocketeer", build: "565656565656567878787878787822333" },
        { name: "skimmer", build: "565656565656484848484848487777777" },
        { name: "factory", build: "565656565656564848484848484777777" },
        { name: "spike", build: "5656565656565677744487777888222222222233333333338888888888111" },
        { name: "autosmasher", build: "5656565656565677744487777888222222222233333333338888888888111" },
        { name: "annihilator", build: "565656565656484848484848487777777" },
        { name: "battleship", build: "565656565656564848484848447777777" },
        { name: "autotrapper", build: "565656565656564444848877787878787" },
        { name: "streamliner", build: "565656565656564444488888878777777" },
        { name: "spreadshot", build: "565656565656567878787878787843242" },
        { name: "auto5", build: "565656565656567847847847847847878" },
        { name: "autogunner", build: "565656565656567847847847847847878" },
        { name: "landmine", build: "5656565656565677744487777888222222222233333333338888888888111" },
        { name: "tritrap", build: "565656565656564444888777787878787" },
        { name: "combattrap", build: "565656565656564444888777787878787" },
        { name: "booster", build: "565656565656567878788888888422222" },
        { name: "fighter", build: "565656565656567878788888888422222" },
        { name: "overseer", build: "565656565656565656565656567878787" },
        { name: "overlord", build: "565656565656565656565656567878787" }
      ];

      const buildSelect = document.createElement("select");
      buildSelect.id = "builds-select";
      buildSelect.className = "diepb-select";
      presets.forEach((p) => {
        const o = document.createElement("option");
        o.value = p.build;
        o.innerText = p.name;
        buildSelect.appendChild(o);
      });
      buildSelect.addEventListener("mousedown", (e) => { e.stopPropagation(); buildSelect.focus(); });
      const selRow = document.createElement("div");
      selRow.className = "row";
      const selLabel = document.createElement("div");
      selLabel.className = "label";
      selLabel.innerText = "Preset";
      selRow.appendChild(selLabel);
      selRow.appendChild(buildSelect);
      selRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(selRow);

      // Apply button
      const applyRow = document.createElement("div");
      applyRow.className = "row";
      const applyBtn = document.createElement("button");
      applyBtn.className = "diepcb";
      applyBtn.id = "apply-build-btn";
      applyBtn.innerText = "Apply Build";
      applyBtn.style.padding = "6px 10px";
      applyBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applySelectedBuild();
      });
      applyRow.appendChild(document.createElement("div")); // spacer
      applyRow.appendChild(applyBtn);
      applyRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(applyRow);

      // Auto-build checkbox
      const autoRow = document.createElement("div");
      autoRow.className = "row";
      const labelAuto = document.createElement("div");
      labelAuto.className = "label";
      labelAuto.innerText = "Auto-Apply Build";
      const cbAuto = document.createElement("input");
      cbAuto.type = "checkbox";
      cbAuto.id = "autobuild-checkbox";
      cbAuto.className = "diepcb";
      cbAuto.checked = false;
      autoRow.appendChild(labelAuto);
      autoRow.appendChild(cbAuto);
      autoRow.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(autoRow);

      const info = document.createElement("div");
      info.className = "small";
      info.innerText = "Automatically apply stat upgrades for applied build";
      info.addEventListener("mousedown", (e) => e.stopPropagation());
      secBuilds.appendChild(info);

      // Implementation helpers for builds
      let autobuildInterval = null;
      function tryExecuteBuildCommand(buildString) {
        try { if (window.input && typeof window.input.execute === "function") { window.input.execute(`game_stats_build ${buildString}`); return true; } } catch (_) {}
        try { if (window.extern && typeof window.extern.execute === "function") { window.extern.execute(`game_stats_build ${buildString}`); return true; } } catch (_) {}
        try { if (window.input && typeof window.input.set_convar === "function") { window.input.set_convar("game_stats_build", buildString); return true; } } catch (_) {}
        return false;
      }
      function applySelectedBuild() {
        const build = document.getElementById("builds-select").value;
        if (!build) return;
        const ok = tryExecuteBuildCommand(build);
        if (!ok && window.extern) { try { window.extern.inGameNotification("Failed to apply build (no executor found)", 0xff5e5e); } catch (_) {} }
        else if (window.extern) { try { window.extern.inGameNotification("Applied build", 0x2b7bb8); } catch (_) {} }
      }
      function startAutoBuild() {
        if (autobuildInterval) return;
        autobuildInterval = setInterval(() => {
          const build = document.getElementById("builds-select").value;
          if (!build) return;
          tryExecuteBuildCommand(build);
        }, 2500);
      }
      function stopAutoBuild() {
        if (!autobuildInterval) return;
        clearInterval(autobuildInterval);
        autobuildInterval = null;
      }
      cbAuto.addEventListener("change", function (e) { e.stopPropagation(); if (this.checked) startAutoBuild(); else stopAutoBuild(); });
    }

    // --- Info section ---
    const secInfo = makeSection("info", false);
    {
      const infoText = document.createElement("div");
      infoText.className = "small";
      infoText.style.whiteSpace = "normal";
      infoText.style.lineHeight = "1.3";
      infoText.innerHTML = "<strong>Swan RC</strong><br>Thank you for your support";
      infoText.addEventListener("mousedown", (e) => e.stopPropagation());
      secInfo.appendChild(infoText);
    }

    // Footer
    const footer = document.createElement("div");
    footer.className = "footer";
    footer.textContent = "Swan RC";
    container.appendChild(footer);

    // Insert menu
    document.body.appendChild(container);
    // save for other modules
    state.menuContainer = container;

    // Draggable (title handle) - mouse & touch
    (function makeDraggable(target, handle) {
      let dragging = false;
      let offsetX = 0;
      let offsetY = 0;

      function onMouseDown(e) {
        e.stopPropagation();
        dragging = true;
        handle.classList.add("grabbing");
        const rect = target.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        target.style.left = rect.left + "px";
        target.style.top = rect.top + "px";
        target.style.marginLeft = "0";
        target.style.marginTop = "0";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
      }

      function onMouseMove(e) {
        if (!dragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        target.style.left = x + "px";
        target.style.top = y + "px";
      }

      function onMouseUp(e) {
        dragging = false;
        handle.classList.remove("grabbing");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      function onTouchStart(e) {
        if (!e.touches || e.touches.length === 0) return;
        dragging = true;
        handle.classList.add("grabbing");
        const rect = target.getBoundingClientRect();
        const t = e.touches[0];
        offsetX = t.clientX - rect.left;
        offsetY = t.clientY - rect.top;
        target.style.left = rect.left + "px";
        target.style.top = rect.top + "px";
        target.style.marginLeft = "0";
        target.style.marginTop = "0";
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
        e.preventDefault();
      }

      function onTouchMove(e) {
        if (!dragging || !e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        const x = t.clientX - offsetX;
        const y = t.clientY - offsetY;
        target.style.left = x + "px";
        target.style.top = y + "px";
        e.preventDefault();
      }

      function onTouchEnd(e) {
        dragging = false;
        handle.classList.remove("grabbing");
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      }

      handle.addEventListener("mousedown", onMouseDown);
      handle.addEventListener("touchstart", onTouchStart, { passive: false });
      handle.style.touchAction = "none";
    })(container, titleWrap);

    // Show menu initially
    container.style.display = "flex";
    requestAnimationFrame(() => container.classList.add("active"));

    // Section switching
    function switchSection(id) {
      if (welcomeActive) {
        if (sections['welcome'] && sections['welcome'].parentNode) {
          sections['welcome'].parentNode.removeChild(sections['welcome']);
        }
        delete sections['welcome'];
        welcomeActive = false;
      }

      Object.keys(sections).forEach((k) => {
        sections[k].classList.toggle("active", k === id);
      });
      tabs.forEach((t) => {
        const btn = document.getElementById(`tab-btn-${t.id}`);
        if (btn) btn.classList.toggle("active", t.id === id);
      });
    }

    // Escape toggle (add once)
    if (!keyHandlerAdded) {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          const m = state.menuContainer;
          if (!m) return;
          if (m.classList.contains("active")) {
            m.classList.remove("active");
            setTimeout(() => (m.style.display = "none"), 950);
          } else {
            m.style.display = "flex";
            requestAnimationFrame(() => m.classList.add("active"));
          }
        }
      });
      keyHandlerAdded = true;
    }

    // Sync initial values back into DOM
    try {
      const sync = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === "checkbox" || el.type === "radio") el.checked = Boolean(val);
        else el.value = val;
      };
      sync("spinner-checkbox", state.isSpinning);
      sync("spin-slider", state.spinSpeed);
      sync("aimbot-checkbox", state.isAimbotActive);
      sync("convar-bullet-checkbox", state.useConvarBulletSpeed);
      sync("drone-aimonly-checkbox", state.useDroneAimOnlyForMinions);
      sync("autofarm-checkbox", state.isAutoFarm);
      sync("autofarm-hold-checkbox", state.autofarmOnRightHold);
      sync("show-bullet-speed-checkbox", state.showBulletSpeeds);
      sync("debug-checkbox", state.isDebug);
    } catch (e) {}

    // expose container for others
    state.menuContainer = container;

    return container;
  }

  return {
    ensureMenu,
  };
});
// ---- End src/ui/menu.js

// ---- Begin src/runtime/gameLoop.js
DiepScript.define("runtime/gameLoop", (require) => {
  // Main heartbeat that keeps prediction, targeting, and UI in sync with the game render.
  const state = require("core/state");
  const constants = require("core/constants");
  const stats = require("core/stats");
  const playersRuntime = require("runtime/players");
  const aimbot = require("features/aimbot");
  const autofarm = require("features/autofarm");
  const spinner = require("features/spinner");
  const visuals = require("features/visuals");

  let rafId = null;

  // Track our own movement to compensate for drift when leading targets.
  function updateShooterVelocity() {
    const history = state.playerPositionTable;
    const limit = constants.playerVelocityPredictionSampleSize;
    history.push({
      x: state.playerX,
      y: state.playerY,
      timestamp: performance.now(),
    });
    while (history.length > limit) {
      history.shift();
    }

    let sumX = 0;
    let sumY = 0;
    let samples = 0;
    for (let i = 1; i < history.length; i += 1) {
      const curr = history[i];
      const prev = history[i - 1];
      if (!curr || !prev) continue;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dt = curr.timestamp - prev.timestamp;
      if (dt < 6) continue;
      sumX += dx / dt;
      sumY += dy / dt;
      samples += 1;
    }
    if (samples > 0) {
      state.shooterVelocity = [sumX / samples, sumY / samples];
    } else {
      state.shooterVelocity = [0, 0];
    }
  }

  function drawPlayerDebugLines() {
    if (!state.isDebug) return;
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 1;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    state.players.forEach((player) => {
      if (player.teammate) return;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(player.x, player.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function pickHighestWeightEnemy() {
    return state.players
      .filter((player) => !player.teammate)
      .reduce((best, candidate) => {
        if (!best) return candidate;
        return playersRuntime.getPlayerWeight(candidate) >
          playersRuntime.getPlayerWeight(best)
          ? candidate
          : best;
      }, null);
  }

  function clearFrameCollections() {
    state.bulletPositions = [];
    state.neutralSquares = [];
    state.neutralPentagons = [];
    state.neutralTriangles = [];
    state.text = [];
    state.tankShapes = [];
  }

  function frame() {
    rafId = window.requestAnimationFrame(frame);

    updateShooterVelocity();
    aimbot.resolveBulletSpeed();

    playersRuntime.updatePlayersFromRender();
    playersRuntime.matchPlayers();
    drawPlayerDebugLines();
    visuals.renderCoordinateOverlay();
    stats.forceU();

    if (aimbot.isAimbotTriggerActive() && state.autofarmOnRightHold) {
      const enemy = pickHighestWeightEnemy();
      if (enemy) {
        aimbot.aim(true);
      } else {
        autofarm.autofarmTick();
      }
    } else {
      aimbot.aim();
      if (state.isAutoFarm) {
        autofarm.autofarmTick();
      }
    }

    playersRuntime.updateTeamColor();
    visuals.renderBulletSpeedOverlay();
    clearFrameCollections();

    spinner.tickSpinner();

    if (window.extern && window.extern.doesHaveTank() && !state.hasJoined) {
      state.hasJoined = true;
      try {
        window.extern.inGameNotification(
          "Welcome to Menu v2. Press M for menu.",
          0x6670ff
        );
      } catch (_error) {}
    }
  }

  function startGameLoop() {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(frame);
  }

  function stopGameLoop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return {
    startGameLoop,
    stopGameLoop,
  };
});
// ---- End src/runtime/gameLoop.js

// ---- Begin src/runtime/lifecycle.js
DiepScript.define("runtime/lifecycle", (require) => {
  // Waits for extern to appear, proxies methods we rely on, then boots the main loop.
  const state = require("core/state");
  const gameLoop = require("runtime/gameLoop");

  // Wrap extern methods so we can observe inputs without blocking the game.
  function proxyExternMethods() {
    if (!window.extern) return;

    const originalOnKeyDown = window.extern.onKeyDown?.bind(window.extern);
    const originalOnKeyUp = window.extern.onKeyUp?.bind(window.extern);
    const originalOnTouchStart = window.extern.onTouchStart?.bind(window.extern);
    const originalOnTouchMove = window.extern.onTouchMove?.bind(window.extern);
    const originalOnTouchEnd = window.extern.onTouchEnd?.bind(window.extern);
    const originalSetConvar = window.extern.set_convar?.bind(window.extern);
    const originalExecute = window.extern.execute?.bind(window.extern);

    if (originalOnKeyDown) {
      window.extern.onKeyDown = new Proxy(originalOnKeyDown, {
        apply(target, thisArg, args) {
          if (args[0] === 36) {
            state.isFiring = true;
          }
          if (args[0] === 21 && !args[1]) return undefined;
          return Reflect.apply(target, thisArg, args);
        },
      });
    }

    if (originalOnKeyUp) {
      window.extern.onKeyUp = new Proxy(originalOnKeyUp, {
        apply(target, thisArg, args) {
          if (args[0] === 36) {
            state.isFiring = false;
          }
          if (args[0] === 21 && !args[1]) return undefined;
          return Reflect.apply(target, thisArg, args);
        },
      });
    }

    const touchHandler = {
      apply(target, thisArg, args) {
        if (!args[3]) {
          state.mouseX = args[1];
          state.mouseY = args[2];
          if (state.mouseLocked) return undefined;
        }
        return target ? Reflect.apply(target, thisArg, args) : undefined;
      },
    };

    if (originalOnTouchStart) {
      window.extern.onTouchStart = new Proxy(originalOnTouchStart, touchHandler);
    }
    if (originalOnTouchMove) {
      window.extern.onTouchMove = new Proxy(originalOnTouchMove, touchHandler);
    }
    if (originalOnTouchEnd) {
      window.extern.onTouchEnd = new Proxy(originalOnTouchEnd, touchHandler);
    }

    if (originalSetConvar) {
      window.extern.set_convar = new Proxy(originalSetConvar, {
        apply(target, thisArg, args) {
          state.gameStyle[args[0]] = args[1];
          return Reflect.apply(target, thisArg, args);
        },
      });
    }

    if (originalExecute) {
      window.extern.execute = new Proxy(originalExecute, {
        apply(target, thisArg, args) {
          const command = args[0] || "";
          const assignColor = (key, index) => {
            const prefix = `net_replace_color ${index} `;
            if (command.startsWith(prefix)) {
              state.gameStyle[key] =
                command[prefix.length] === "0"
                  ? `#${command.slice(prefix.length + 2)}`
                  : command.slice(prefix.length);
            }
          };
          assignColor("teamBlue", 3);
          assignColor("teamRed", 4);
          assignColor("teamPurple", 5);
          assignColor("teamGreen", 6);
          assignColor("square", 8);
          assignColor("triangle", 9);
          assignColor("pentagon", 10);
          return Reflect.apply(target, thisArg, args);
        },
      });
    }
  }

  function onGameStart() {
    if (typeof window.extern === "undefined") return;
    if (state.checkGameStartId) {
      clearInterval(state.checkGameStartId);
      state.checkGameStartId = null;
    }
    proxyExternMethods();
    gameLoop.startGameLoop();
  }

  function initLifecycle() {
    if (state.checkGameStartId) return;
    state.checkGameStartId = setInterval(onGameStart, 400);
  }

  return {
    initLifecycle,
  };
});
// ---- End src/runtime/lifecycle.js

// ---- Begin src/main.js
DiepScript.define("main", (require) => {
  // Entry point – wires the feature modules together.
  const fov = require("features/fov");
  const input = require("hooks/input");
  require("hooks/canvas");
  const lifecycle = require("runtime/lifecycle");

  function init() {
    fov.initFovController();
    input.initInputHooks();
    lifecycle.initLifecycle();
  }

  return {
    init,
  };
});
// ---- End src/main.js

// ---- Begin src/index.js
DiepScript.define("index", (require) => {
  // Minimal bootstrap invoked once the bundle/loader is in place.
  const main = require("main");
  main.init();
});
// ---- End src/index.js

