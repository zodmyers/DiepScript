DiepScript.define("runtime/lifecycle", (require) => {
  const state = require("core/state");
  const gameLoop = require("runtime/gameLoop");

  function proxyExternMethods() {
    if (!window.extern) return;

    const originalOnKeyDown = window.extern.onKeyDown?.bind(window.extern);
    const originalOnKeyUp = window.extern.onKeyUp?.bind(window.extern);
    const originalOnTouchStart = window.extern.onTouchStart?.bind(window.extern);
    const originalOnTouchMove = window.extern.onTouchMove?.bind(window.extern);
    const originalOnTouchEnd = window.extern.onTouchEnd?.bind(window.extern);
    const originalSetConvar = window.extern.set_convar?.bind(window.extern);
    const originalExecute = window.extern.execute?.bind(window.extern);

    if (originalOnKeyDown) {
      window.extern.onKeyDown = new Proxy(originalOnKeyDown, {
        apply(target, thisArg, args) {
          if (args[0] === 36) {
            state.isFiring = true;
          }
          if (args[0] === 21 && !args[1]) return undefined;
          return Reflect.apply(target, thisArg, args);
        },
      });
    }

    if (originalOnKeyUp) {
      window.extern.onKeyUp = new Proxy(originalOnKeyUp, {
        apply(target, thisArg, args) {
          if (args[0] === 36) {
            state.isFiring = false;
          }
          if (args[0] === 21 && !args[1]) return undefined;
          return Reflect.apply(target, thisArg, args);
        },
      });
    }

    const touchHandler = {
      apply(target, thisArg, args) {
        if (!args[3]) {
          state.mouseX = args[1];
          state.mouseY = args[2];
          if (state.mouseLocked) return undefined;
        }
        return target ? Reflect.apply(target, thisArg, args) : undefined;
      },
    };

    if (originalOnTouchStart) {
      window.extern.onTouchStart = new Proxy(originalOnTouchStart, touchHandler);
    }
    if (originalOnTouchMove) {
      window.extern.onTouchMove = new Proxy(originalOnTouchMove, touchHandler);
    }
    if (originalOnTouchEnd) {
      window.extern.onTouchEnd = new Proxy(originalOnTouchEnd, touchHandler);
    }

    if (originalSetConvar) {
      window.extern.set_convar = new Proxy(originalSetConvar, {
        apply(target, thisArg, args) {
          state.gameStyle[args[0]] = args[1];
          return Reflect.apply(target, thisArg, args);
        },
      });
    }

    if (originalExecute) {
      window.extern.execute = new Proxy(originalExecute, {
        apply(target, thisArg, args) {
          const command = args[0] || "";
          const assignColor = (key, index) => {
            const prefix = `net_replace_color ${index} `;
            if (command.startsWith(prefix)) {
              state.gameStyle[key] =
                command[prefix.length] === "0"
                  ? `#${command.slice(prefix.length + 2)}`
                  : command.slice(prefix.length);
            }
          };
          assignColor("teamBlue", 3);
          assignColor("teamRed", 4);
          assignColor("teamPurple", 5);
          assignColor("teamGreen", 6);
          assignColor("square", 8);
          assignColor("triangle", 9);
          assignColor("pentagon", 10);
          return Reflect.apply(target, thisArg, args);
        },
      });
    }
  }

  function onGameStart() {
    if (typeof window.extern === "undefined") return;
    if (state.checkGameStartId) {
      clearInterval(state.checkGameStartId);
      state.checkGameStartId = null;
    }
    proxyExternMethods();
    gameLoop.startGameLoop();
  }

  function initLifecycle() {
    if (state.checkGameStartId) return;
    state.checkGameStartId = setInterval(onGameStart, 400);
  }

  return {
    initLifecycle,
  };
});
