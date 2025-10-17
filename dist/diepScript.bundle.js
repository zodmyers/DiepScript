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
    isAimbotActive: false,

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

    // Debug / overlays
    isDebug: false,
    useConvarBulletSpeed: false,
    showBulletSpeeds: false,
    bulletPositions: [],
    currentComputedBulletSpeed: null,
    useDroneAimOnlyForMinions: true,
    autofarmOnRightHold: false,

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
    isBlackBg: false,
    blackBgDiv: null,

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

    const sampleCount = (target.positionTable || []).filter(Boolean).length;
    const rawTvx =
      target.velocity && sampleCount >= minSamples
        ? target.velocity[0] || 0
        : 0;
    const rawTvy =
      target.velocity && sampleCount >= minSamples
        ? target.velocity[1] || 0
        : 0;

    const fbTime = Math.max(
      12,
      Math.min(400, dist / Math.max(1e-6, bulletSpeed))
    );
    const linearPred = {
      x: target.wx + rawTvx * fbTime,
      y: target.wy + rawTvy * fbTime,
    };

    const relVx = (rawTvx || 0) - (shooterVel[0] || 0);
    const relVy = (rawTvy || 0) - (shooterVel[1] || 0);
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
        : Math.max(0, Math.min(1, (sampleCount - minSamples) / velSampleRange));

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
        sampleCount,
        intercept: interceptSolution,
        sDist,
        sVelSamples,
        sSolT,
        sAngle,
        sRelSpeed,
      },
    };
  }

  return {
    getDistance,
    predictPlayer,
    getAverage,
    quad,
    intercept,
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
        velocity: undefined,
        teammate,
      });
    }
  }

  function getVelocity(positionTable) {
    let sumX = 0;
    let sumY = 0;
    let samples = 0;

    for (let i = 1; i < positionTable.length; i += 1) {
      const current = positionTable[i];
      const prev = positionTable[i - 1];
      if (!current || !prev) continue;

      const dx = current.x - prev.x;
      const dy = current.y - prev.y;
      const dt = current.timestamp - prev.timestamp;
      if (dt < 6) continue;
      sumX += dx / dt;
      sumY += dy / dt;
      samples += 1;
    }

    return samples > 0 ? [sumX / samples, sumY / samples] : [0, 0];
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
        current.velocity = getVelocity(history);
      } else {
        current.positionTable = Array.from({ length: maxHistory }, () => null);
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
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
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
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      const metrics = ctx.measureText(text);
      ctx.fillRect(bp.x + 4, bp.y - 20, metrics.width + 6, 18);
      ctx.fillStyle = "#FFD700";
      ctx.fillText(text, bp.x + 7, bp.y - 6);
    });
    ctx.restore();
  }

  return {
    renderAimOverlay,
    renderBulletSpeedOverlay,
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
      debugInfo = blend.debug;
    }

    if (
      state.isDebug &&
      debugInfo &&
      (debugInfo.dist < 1500 || Math.random() < 0.002)
    ) {
      console.log("[DiepScript][AIM BLEND]", debugInfo);
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
  const playersRuntime = require("runtime/players");

  function resetAutoAim() {
    state.autoAimX = null;
    state.autoAimY = null;
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
    let target = null;

    if (state.farmPriority === "pentagon" && state.neutralPentagons.length > 0) {
      target = playersRuntime.nearestShapeWorld(state.neutralPentagons);
    } else if (
      state.farmPriority === "square" &&
      state.neutralSquares.length > 0
    ) {
      target = playersRuntime.nearestShapeWorld(state.neutralSquares);
    } else if (
      state.farmPriority === "triangle" &&
      state.neutralTriangles.length > 0
    ) {
      target = playersRuntime.nearestShapeWorld(state.neutralTriangles);
    }

    if (!target) {
      if (state.farmPriority !== "pentagon" && state.neutralPentagons.length > 0) {
        target = playersRuntime.nearestShapeWorld(state.neutralPentagons);
      } else if (
        state.farmPriority !== "square" &&
        state.neutralSquares.length > 0
      ) {
        target = playersRuntime.nearestShapeWorld(state.neutralSquares);
      } else if (
        state.farmPriority !== "triangle" &&
        state.neutralTriangles.length > 0
      ) {
        target = playersRuntime.nearestShapeWorld(state.neutralTriangles);
      }
    }

    return target;
  }

  // Single tick of autofarm; returns true if we acted on a shape this frame.
  function autofarmTick() {
    if (!window.extern || !window.extern.doesHaveTank()) {
      return false;
    }

    drawDebugTargets();

    const targetWorld = chooseFarmTarget();
    if (!targetWorld) return false;

    const [desiredX, desiredY] = coordinates.worldToMousePosition(
      targetWorld[0],
      targetWorld[1]
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
  // Recreates the Diep-style control panel using the new layout shared in README.
  // Sections: Combat, Auto, Defense, Extras.
  const state = require("core/state");
  const autofarm = require("features/autofarm");

  const PANEL_IDS = ["combat", "auto", "defense", "extras"];

  function ensureMenu() {
    if (state.menuContainer && state.menuContainer.parentNode) {
      if (typeof state.menuContainer.__hide === "function") {
        state.menuContainer.__hide();
      } else {
        state.menuContainer.style.display = "none";
      }
      return;
    }

    injectStyles();

    const container = document.createElement("div");
    container.className = "ds-menu";
    container.dataset.open = "false";

    // expose helpers so the input hook can trigger the animation-aware show/hide
    const showMenu = () => {
      container.style.display = "flex";
      // delay to next frame so the animation runs each time
      requestAnimationFrame(() => {
        container.classList.add("active");
        container.dataset.open = "true";
      });
    };
    const hideMenu = () => {
      container.classList.remove("active");
      container.dataset.open = "false";
      setTimeout(() => {
        if (container.dataset.open !== "true") {
          container.style.display = "none";
        }
      }, 500); // allow close animation to finish
    };
    container.__show = showMenu;
    container.__hide = hideMenu;
    container.__toggle = () => (container.dataset.open === "true" ? hideMenu() : showMenu());

    const title = document.createElement("div");
    title.className = "ds-title";
    title.innerHTML = `
      <span class="ds-title-prefix">System</span>
      <div class="ds-title-main">Settings</div>
    `;
    container.appendChild(title);

    const shell = document.createElement("div");
    shell.className = "ds-shell";
    container.appendChild(shell);

    const nav = document.createElement("nav");
    nav.className = "ds-nav";
    shell.appendChild(nav);

    const panelsWrap = document.createElement("div");
    panelsWrap.className = "ds-panels";
    shell.appendChild(panelsWrap);

    const navButtons = {};
    PANEL_IDS.forEach((id, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.panel = id;
      btn.className = "ds-nav-btn" + (idx === 0 ? " active" : "");
      btn.innerText = id.charAt(0).toUpperCase() + id.slice(1);
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        switchPanel(id, navButtons, panelsWrap);
      });
      nav.appendChild(btn);
      navButtons[id] = btn;
    });

    const combatPanel = createPanel("combat", panelsWrap, true);
    const autoPanel = createPanel("auto", panelsWrap);
    const defensePanel = createPanel("defense", panelsWrap);
    const extrasPanel = createPanel("extras", panelsWrap);

    populateCombatPanel(combatPanel);
    populateAutoPanel(autoPanel);
    populateDefensePanel(defensePanel);
    populateExtrasPanel(extrasPanel);

    document.body.appendChild(container);
    container.style.display = "none";
    state.menuContainer = container;
  }

  function injectStyles() {
    if (document.getElementById("diepscript-menu-styles")) return;
    const style = document.createElement("style");
    style.id = "diepscript-menu-styles";
    style.textContent = `
      .ds-menu {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 0;
        height: 0;
        display: none;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
        background: rgba(12, 18, 28, 0.94);
        color: #dbeeff;
        font-family: "Ubuntu", "Segoe UI", Arial, sans-serif;
        border: 1px solid rgba(0, 178, 225, 0.35);
        border-radius: 18px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65);
        z-index: 100000;
        overflow: hidden;
        pointer-events: auto;
        animation: ds-close 0.65s ease forwards;
      }

      .ds-menu.active {
        width: 560px;
        height: 430px;
        animation: ds-open 0.65s ease forwards;
      }

      .ds-title {
        padding: 24px 28px 12px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      .ds-title-prefix {
        display: block;
        color: rgba(219, 238, 255, 0.68);
        font-size: 16px;
        margin-bottom: 4px;
      }
      .ds-title-main {
        font-size: 34px;
        font-weight: 700;
        color: #ffffff;
        text-shadow: 0 0 16px rgba(0, 178, 225, 0.35);
      }

      .ds-shell {
        flex: 1;
        display: flex;
        gap: 18px;
        padding: 0 24px 24px;
      }

      .ds-nav {
        width: 148px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ds-nav-btn {
        position: relative;
        padding: 12px 16px;
        border: 1px solid rgba(0, 178, 225, 0.18);
        border-radius: 10px;
        background: rgba(0, 178, 225, 0.08);
        color: rgba(219, 238, 255, 0.75);
        font-size: 15px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: transform 0.12s ease, border-color 0.12s ease, color 0.12s ease, background 0.12s ease;
      }

      .ds-nav-btn::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: 1px solid rgba(255, 255, 255, 0.08);
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      .ds-nav-btn:hover {
        transform: translateX(4px);
        color: #ffffff;
        border-color: rgba(0, 178, 225, 0.35);
        background: rgba(0, 178, 225, 0.12);
      }

      .ds-nav-btn.active {
        color: #ffffff;
        background: linear-gradient(135deg, rgba(0, 178, 225, 0.22), rgba(67, 127, 255, 0.28));
        border-color: rgba(67, 127, 255, 0.4);
      }
      .ds-nav-btn.active::after {
        opacity: 1;
      }

      .ds-panels {
        flex: 1;
        min-width: 0;
        background: rgba(5, 10, 18, 0.65);
        border: 1px solid rgba(0, 178, 225, 0.12);
        border-radius: 14px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-y: auto;
      }

      .ds-panel {
        display: none;
        flex-direction: column;
        gap: 14px;
      }

      .ds-panel.active {
        display: flex;
      }

      .ds-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }

      .ds-row label {
        font-weight: 600;
        color: #f4fbff;
      }

      .ds-row-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ds-row.ds-row--stacked {
        flex-direction: column;
        align-items: flex-start;
      }
      .ds-row.ds-row--stacked label {
        margin-bottom: 6px;
      }

      .ds-row input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: #00b2e1;
      }

      .ds-row input[type="range"] {
        flex: 1;
        margin-left: 12px;
        accent-color: #00b2e1;
      }

      .ds-row .ds-value {
        min-width: 80px;
        text-align: right;
        font-size: 13px;
        color: rgba(219, 238, 255, 0.7);
      }

      .ds-row .ds-hint {
        font-size: 12px;
        color: rgba(219, 238, 255, 0.6);
        margin-top: 6px;
      }

      .ds-build-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ds-select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.06);
        color: #dbeeff;
        font-size: 14px;
      }

      .ds-button {
        align-self: flex-start;
        padding: 10px 18px;
        border-radius: 10px;
        border: 1px solid rgba(0, 178, 225, 0.35);
        background: linear-gradient(135deg, rgba(0, 178, 225, 0.35), rgba(67, 127, 255, 0.4));
        color: #ffffff;
        font-weight: 600;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }

      .ds-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(0, 178, 225, 0.25);
      }

      .ds-info {
        font-size: 13px;
        line-height: 1.5;
        color: rgba(219, 238, 255, 0.72);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 12px;
      }

      @keyframes ds-open {
        0% {
          width: 0;
          height: 0;
          border-radius: 30%;
        }
        40% {
          width: 560px;
          height: 0;
        }
        100% {
          width: 560px;
          height: 430px;
          border-radius: 18px;
        }
      }

      @keyframes ds-close {
        0% {
          width: 560px;
          height: 430px;
        }
        60% {
          width: 560px;
          height: 0;
        }
        100% {
          width: 0;
          height: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel(id, wrap, active = false) {
    const panel = document.createElement("section");
    panel.className = "ds-panel" + (active ? " active" : "");
    panel.id = `ds-panel-${id}`;
    wrap.appendChild(panel);
    panel.addEventListener("mousedown", (e) => e.stopPropagation());
    panel.addEventListener("click", (e) => e.stopPropagation());
    return panel;
  }

  function switchPanel(id, navButtons, panelsWrap) {
    Object.values(navButtons).forEach((btn) => btn.classList.remove("active"));
    if (navButtons[id]) navButtons[id].classList.add("active");

    panelsWrap.querySelectorAll(".ds-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `ds-panel-${id}`);
    });
  }

  function createToggleRow({ id, label, checked, onChange, hint }) {
    const row = document.createElement("div");
    row.className = "ds-row";

    const textWrap = document.createElement("div");
    textWrap.className = "ds-row-text";
    const labelEl = document.createElement("label");
    labelEl.htmlFor = id;
    labelEl.innerText = label;
    textWrap.appendChild(labelEl);

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = id;
    toggle.checked = checked;
    toggle.addEventListener("change", (ev) => {
      ev.stopPropagation();
      onChange(ev.target.checked);
    });
    if (hint) {
      const hintEl = document.createElement("div");
      hintEl.className = "ds-hint";
      hintEl.innerText = hint;
      textWrap.appendChild(hintEl);
    }

    row.appendChild(textWrap);
    row.appendChild(toggle);

    row.addEventListener("mousedown", (e) => e.stopPropagation());
    row.addEventListener("click", (e) => e.stopPropagation());
    return row;
  }

  function createRangeRow({ id, label, min, max, step, value, onInput }) {
    const row = document.createElement("div");
    row.className = "ds-row";

    const labelEl = document.createElement("label");
    labelEl.innerText = label;
    labelEl.htmlFor = id;
    row.appendChild(labelEl);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = id;
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    row.appendChild(slider);

    const valueEl = document.createElement("div");
    valueEl.className = "ds-value";
    valueEl.innerText = value.toFixed(2);
    row.appendChild(valueEl);

    slider.addEventListener("input", (ev) => {
      ev.stopPropagation();
      const val = parseFloat(ev.target.value);
      valueEl.innerText = val.toFixed(2);
      onInput(val);
    });

    row.addEventListener("mousedown", (e) => e.stopPropagation());
    row.addEventListener("click", (e) => e.stopPropagation());
    return row;
  }

  function populateCombatPanel(panel) {
    panel.appendChild(
      createToggleRow({
        id: "ds-spinner-toggle",
        label: "Spinner",
        checked: Boolean(state.isSpinning),
        onChange: (checked) => {
          state.isSpinning = checked;
          try {
            window.extern?.inGameNotification?.(checked ? "Spinner: ON" : "Spinner: OFF", 0x2b7bb8);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createRangeRow({
        id: "ds-spin-speed",
        label: "Spin Speed",
        min: 0,
        max: 2,
        step: 0.01,
        value: state.spinSpeed,
        onInput: (val) => {
          state.spinSpeed = val;
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-aimbot-toggle",
        label: "Aimbot",
        checked: Boolean(state.isAimbotActive),
        onChange: (checked) => {
          state.isAimbotActive = checked;
          try {
            window.extern?.inGameNotification?.(checked ? "Aimbot: ON" : "Aimbot: OFF", 0xf533ff);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-convar-toggle",
        label: "Use Convar Bullet Speed",
        checked: Boolean(state.useConvarBulletSpeed),
        hint: "Reads bullet speed from game stats for prediction.",
        onChange: (checked) => {
          state.useConvarBulletSpeed = checked;
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-drone-toggle",
        label: "Drone Aim-Only",
        checked: Boolean(state.useDroneAimOnlyForMinions),
        hint: "Keeps minions from firing, only aims for drone classes.",
        onChange: (checked) => {
          state.useDroneAimOnlyForMinions = checked;
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-bullet-overlay-toggle",
        label: "Bullet Speed Overlay",
        checked: Boolean(state.showBulletSpeeds),
        onChange: (checked) => {
          state.showBulletSpeeds = checked;
          try {
            window.extern?.inGameNotification?.(
              checked ? "Bullet Speed Overlay: ON" : "Bullet Speed Overlay: OFF",
              0x2b7bb8
            );
          } catch (_) {}
        },
      })
    );
  }

  function populateAutoPanel(panel) {
    panel.appendChild(
      createToggleRow({
        id: "ds-autofarm-toggle",
        label: "AutoFarm",
        checked: Boolean(state.isAutoFarm),
        onChange: (checked) => {
          state.isAutoFarm = checked;
          if (!checked) autofarm.resetAutoAim();
          try {
            window.extern?.inGameNotification?.(checked ? "AutoFarm: ON" : "AutoFarm: OFF", 0x2b7bb8);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-autorighthold-toggle",
        label: "AutoFarm on Right-Hold",
        checked: Boolean(state.autofarmOnRightHold),
        onChange: (checked) => {
          state.autofarmOnRightHold = checked;
          try {
            window.extern?.inGameNotification?.(
              checked ? "Autofarm on Right-Hold: ON" : "Autofarm on Right-Hold: OFF",
              0x2b7bb8
            );
          } catch (_) {}
        },
      })
    );
  }

  function populateDefensePanel(panel) {
    panel.appendChild(
      createToggleRow({
        id: "ds-debug-toggle",
        label: "Debug Lines",
        checked: Boolean(state.isDebug),
        onChange: (checked) => {
          state.isDebug = checked;
          try {
            window.extern?.inGameNotification?.(checked ? "Debug Lines: ON" : "Debug Lines: OFF", 0x2b7bb8);
          } catch (_) {}
        },
      })
    );

    panel.appendChild(
      createToggleRow({
        id: "ds-blackbg-toggle",
        label: "Black Background",
        checked: Boolean(state.isBlackBg),
        onChange: (checked) => {
          state.isBlackBg = checked;
          try {
            window.input?.set_convar?.("ren_background_color", checked ? "#000000" : "#CDCDCD");
            window.extern?.inGameNotification?.(
              checked ? "Black background: ON" : "Black background: OFF",
              0x2b7bb8
            );
          } catch (_) {}
        },
      })
    );
  }

  function populateExtrasPanel(panel) {
    const buildBlock = document.createElement("div");
    buildBlock.className = "ds-build-block";

    const buildSelect = document.createElement("select");
    buildSelect.id = "ds-build-select";
    buildSelect.className = "ds-select";
    buildSelect.addEventListener("mousedown", (e) => e.stopPropagation());
    buildSelect.addEventListener("click", (e) => e.stopPropagation());
    [
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
      { name: "overlord", build: "565656565656565656565656567878787" },
    ].forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.build;
      option.innerText = preset.name;
      buildSelect.appendChild(option);
    });
    buildBlock.appendChild(buildSelect);

    const applyButton = document.createElement("button");
    applyButton.className = "ds-button";
    applyButton.type = "button";
    applyButton.innerText = "Apply Build";
    buildBlock.appendChild(applyButton);

    const autoApplyRow = createToggleRow({
      id: "ds-autobuild-toggle",
      label: "Auto-Apply Build",
      checked: false,
      hint: "Attempts to reapply your selected build every few seconds.",
      onChange: () => {},
    });

    panel.appendChild(buildBlock);
    panel.appendChild(autoApplyRow);

    const info = document.createElement("div");
    info.className = "ds-info";
    info.innerHTML =
      "<strong>Swan RC</strong><br>Diep-styled control panel. Keys: U = aimbot, I = stack, M = toggle menu.";
    panel.appendChild(info);

    // Implementation helpers
    let autobuildInterval = null;
    const startAutoBuild = () => {
      if (autobuildInterval) return;
      autobuildInterval = setInterval(() => {
        const build = buildSelect.value;
        if (!build) return;
        applyBuild(build);
      }, 2500);
    };
    const stopAutoBuild = () => {
      if (!autobuildInterval) return;
      clearInterval(autobuildInterval);
      autobuildInterval = null;
    };

    const applyBuild = (buildString) => {
      const tryExecute = () => {
        try {
          if (window.input && typeof window.input.execute === "function") {
            window.input.execute(`game_stats_build ${buildString}`);
            return true;
          }
        } catch (_) {}
        try {
          if (window.extern && typeof window.extern.execute === "function") {
            window.extern.execute(`game_stats_build ${buildString}`);
            return true;
          }
        } catch (_) {}
        try {
          if (window.input && typeof window.input.set_convar === "function") {
            window.input.set_convar("game_stats_build", buildString);
            return true;
          }
        } catch (_) {}
        return false;
      };

      const ok = tryExecute();
      if (!ok) {
        try {
          window.extern?.inGameNotification?.("Failed to apply build (no executor found)", 0xff5e5e);
        } catch (_) {}
      } else {
        try {
          window.extern?.inGameNotification?.("Applied build", 0x2b7bb8);
        } catch (_) {}
      }
    };

    applyButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const build = buildSelect.value;
      if (build) applyBuild(build);
    });

    const autoToggle = autoApplyRow.querySelector("input[type=checkbox]");
    autoToggle.addEventListener("change", (ev) => {
      ev.stopPropagation();
      if (ev.target.checked) startAutoBuild();
      else stopAutoBuild();
    });

    // keep API parity with previous version
    const menuContainer = panel.parentElement?.parentElement?.parentElement;
    if (menuContainer) {
      menuContainer.applySelectedBuild = () => {
        const build = buildSelect.value;
        if (build) applyBuild(build);
      };
    }
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

