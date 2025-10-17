DiepScript.define("features/autofarm", (require) => {
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
