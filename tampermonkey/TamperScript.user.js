// ==UserScript==
// @name         DiepScript Modular Menu
// @namespace    https://github.com/zodmyers/DiepScript
// @version      2.1.0
// @description  Modular rewrite of Menu v2 with organized features, aimbot, autofarm, and visuals for diep.io.
// @author       Dreamy (original), refactored by project contributors
// @match        https://diep.io/*
// @match        https://staging.diep.io/*
// @match        https://diep-io.rivet.game/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @require      https://raw.githubusercontent.com/zodmyers/DiepScript/main/dist/diepScript.bundle.js
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
