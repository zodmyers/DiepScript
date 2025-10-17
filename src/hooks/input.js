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
      const hidden = state.menuContainer.style.display === "none";
      state.menuContainer.style.display = hidden ? "block" : "none";
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
