// ==UserScript==
// @name         DiepScript Modular Menu
// @namespace    https://github.com/YOUR_USERNAME/DiepScript
// @version      2.0.0
// @description  Modular rewrite of Menu v2 with organized features, aimbot, autofarm, and visuals for diep.io.
// @author       Dreamy (original), refactored by project contributors
// @match        https://diep.io/*
// @match        https://staging.diep.io/*
// @match        https://diep-io.rivet.game/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/core/moduleLoader.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/core/constants.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/core/state.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/core/math.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/core/stats.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/core/coordinates.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/runtime/players.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/features/visuals.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/features/aimbot.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/features/autofarm.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/features/spinner.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/features/fov.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/features/stacking.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/hooks/canvas.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/hooks/input.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/runtime/gameLoop.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/runtime/lifecycle.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/main.js
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/src/index.js
// ==/UserScript==

(function bootstrapDiepScript() {
  try {
    if (typeof DiepScript === "undefined" || !DiepScript.require) {
      console.error("[DiepScript] Module loader is unavailable.");
      return;
    }
    DiepScript.require("index");
  } catch (error) {
    console.error("[DiepScript] Failed to initialize.", error);
  }
})();
