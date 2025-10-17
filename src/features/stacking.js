DiepScript.define("features/stacking", (require) => {
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
