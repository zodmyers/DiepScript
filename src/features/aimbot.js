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
      state.lastAimDebug = {
        ...debugInfo,
        timestamp: performance.now(),
        targetName: target.name || "",
        targetScore: target.score || 0,
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
