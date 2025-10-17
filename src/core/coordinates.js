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
