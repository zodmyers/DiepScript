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
