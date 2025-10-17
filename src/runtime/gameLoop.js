DiepScript.define("runtime/gameLoop", (require) => {
  const state = require("core/state");
  const constants = require("core/constants");
  const stats = require("core/stats");
  const playersRuntime = require("runtime/players");
  const aimbot = require("features/aimbot");
  const autofarm = require("features/autofarm");
  const spinner = require("features/spinner");
  const visuals = require("features/visuals");

  let rafId = null;

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
