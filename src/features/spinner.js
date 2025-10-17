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
