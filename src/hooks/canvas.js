DiepScript.define("hooks/canvas", (require) => {
  const state = require("core/state");
  const math = require("core/math");
  const coordinates = require("core/coordinates");
  const menu = require("ui/menu");

  class CanvasInterceptor {
    constructor() {
      this.hooks = {};
      this.initialised = false;
      document.addEventListener("DOMContentLoaded", () => this.setup());
    }

    setup() {
      if (this.initialised) return;
      this.initialised = true;

      const originalGetElementById = HTMLDocument.prototype.getElementById;
      HTMLDocument.prototype.getElementById = function patchedGetElementById(id) {
        const elem = originalGetElementById.call(this, id);
        if (id === "canvas") return wrapCanvas(elem);
        return elem;
      };

      const originalCreateElement = HTMLDocument.prototype.createElement;
      HTMLDocument.prototype.createElement = function patchedCreateElement(tag) {
        const elem = originalCreateElement.call(this, tag);
        if (tag === "canvas") return wrapCanvas(elem);
        return elem;
      };

      const wrapCanvas = (originalCanvas) => {
        class HTMLCanvasElementProxy {}
        const proxy = new HTMLCanvasElementProxy();
        proxy.width = originalCanvas.width;
        proxy.height = originalCanvas.height;
        proxy.transferControlToOffscreen =
          originalCanvas.transferControlToOffscreen.bind(originalCanvas);
        proxy.toDataURL = originalCanvas.toDataURL.bind(originalCanvas);
        proxy.toBlob = originalCanvas.toBlob.bind(originalCanvas);
        proxy.captureStream = originalCanvas.captureStream.bind(originalCanvas);

        proxy.getContext = (...args) => {
          const ctx = originalCanvas.getContext(...args);
          if (args[0] !== "2d") return ctx;
          return new Proxy(ctx, {
            get: (target, prop) => {
              const original = target[prop];
              if (typeof original !== "function") return original;
              if (!Object.prototype.hasOwnProperty.call(this.hooks, prop)) {
                return original.bind(target);
              }
              return (...pArgs) => {
                let currentCtx = ctx;
                let currentArgs = pArgs;
                let skip = false;
                this.hooks[prop].forEach((hookFn) => {
                  const result = hookFn(currentCtx, ...currentArgs);
                  if (!result) {
                    skip = true;
                  } else {
                    [currentCtx, currentArgs] = result;
                  }
                });
                if (skip) return undefined;
                return original.apply(target, currentArgs);
              };
            },
            set: (target, prop, value) => {
              target[prop] = value; // eslint-disable-line no-param-reassign
              return true;
            },
          });
        };
        return proxy;
      };

      menu.ensureMenu();
    }

    register(methodName, hookFn) {
      if (!this.hooks[methodName]) {
        this.hooks[methodName] = [];
      }
      this.hooks[methodName].push(hookFn);
    }
  }

  const interceptor = new CanvasInterceptor();

  function registerContextHook(methodName, hookFn) {
    interceptor.register(methodName, hookFn);
  }

  registerContextHook("setTransform", (context, ...args) => {
    state.ctxTransform = args;
    return [context, args];
  });

  registerContextHook("drawImage", (context, ...args) => {
    const transform = state.ctxTransform || [0, 0, 0, 0, 0, 0];
    if (args[0] && args[0].renderMethod) {
      const x = transform[4] + args[1];
      const y = transform[5] + args[2];
      if (args[0].renderMethod.method === "text") {
        state.text.push({
          x,
          y,
          cw: args[0].width,
          ch: args[0].height,
          mx: x + args[0].width / 4,
          my: y + args[0].height / 4,
          text: args[0].renderMethod.text,
        });
      }
    }
    return [context, args];
  });

  registerContextHook("strokeText", (context, ...args) => {
    if (context.canvas.id !== "canvas") {
      context.canvas.renderMethod = {
        method: "text",
        text: args[0],
        args,
        fillStyle: context.fillStyle,
      };
      if (args[0].startsWith("Lvl ")) {
        if (args[0][5] === " ") {
          state.playerLevel = Number(args[0].slice(4, 5));
          state.playerTank = args[0].slice(6);
        } else {
          state.playerLevel = Number(args[0].slice(4, 6));
          state.playerTank = args[0].slice(7);
        }
      }
    }
    return [context, args];
  });

  registerContextHook("arc", (context, ...args) => {
    const transform = state.ctxTransform || [0, 0, 0, 0, 0, 0];
    if (
      context.canvas.id === "canvas" &&
      transform[4] === state.lastArc[0] &&
      transform[5] === state.lastArc[1]
    ) {
      state.tankShapes.push({
        x: transform[4],
        y: transform[5],
        radius: Math.hypot(transform[1], transform[0]),
        fillStyle: context.fillStyle,
      });
      state.lastArc = [Infinity, Infinity];
    } else {
      state.lastArc = [transform[4], transform[5]];
    }

    try {
      if (context.canvas && context.canvas.id === "canvas") {
        const smallRadius = Math.hypot(transform[1], transform[0]);
        const BULLET_RADIUS_THRESHOLD = 8;
        if (smallRadius > 0 && smallRadius <= BULLET_RADIUS_THRESHOLD) {
          const speed =
            typeof state.currentComputedBulletSpeed === "number"
              ? state.currentComputedBulletSpeed
              : null;
          state.bulletPositions.push({
            x: transform[4],
            y: transform[5],
            radius: smallRadius,
            speed,
            fillStyle: context.fillStyle,
          });
        }
      }
    } catch (error) {
      if (state.isDebug) console.warn("[DiepScript] arc hook failed:", error);
    }

    return [context, args];
  });

  registerContextHook("stroke", (context, ...args) => {
    if (
      ["#cccccc", "#cdcdcd"].includes(context.fillStyle) &&
      context.strokeStyle === "#000000"
    ) {
      state.fov = context.globalAlpha / state.gameStyle.ren_grid_base_alpha;
    }
    return [context, args];
  });

  registerContextHook("strokeRect", (context, ...args) => {
    const t = context.getTransform();
    state.minimapPos = [t.e, t.f];
    state.minimapSize = [t.a, t.d];
    return [context, args];
  });

  registerContextHook("beginPath", (context, ...args) => {
    state.pathPosition = 0;
    state.pathVertices = [];
    return [context, args];
  });

  registerContextHook("moveTo", (context, ...args) => {
    state.pathPosition = 1;
    state.pathVertices.push(args);
    return [context, args];
  });

  registerContextHook("lineTo", (context, ...args) => {
    state.pathPosition += 1;
    state.pathVertices.push(args);
    return [context, args];
  });

  registerContextHook("fill", (context, ...args) => {
    const transform = state.ctxTransform || [0, 0, 0, 0, 0, 0];
    const average = math.getAverage(state.pathVertices);

    if (
      context.fillStyle === "#000000" &&
      context.globalAlpha > 0.949 &&
      state.pathPosition === 3
    ) {
      state.arrowPos = average;
      coordinates.updatePlayerWorldPosition();
    } else if (
      state.pathPosition === 4 &&
      context.fillStyle &&
      context.fillStyle.toLowerCase().includes("ffe869")
    ) {
      state.neutralSquares.push([
        transform[4] + average[0],
        transform[5] + average[1],
      ]);
    } else if (
      state.pathPosition === 5 &&
      context.fillStyle &&
      context.fillStyle.toLowerCase().includes("768dfc")
    ) {
      state.neutralPentagons.push([
        transform[4] + average[0],
        transform[5] + average[1],
      ]);
    } else if (
      state.pathPosition === 3 &&
      context.fillStyle &&
      context.fillStyle.toLowerCase().includes("fc7677")
    ) {
      state.neutralTriangles.push([
        transform[4] + average[0],
        transform[5] + average[1],
      ]);
    }

    return [context, args];
  });

  return {
    registerContextHook,
  };
});
