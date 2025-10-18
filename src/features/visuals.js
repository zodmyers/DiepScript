DiepScript.define("features/visuals", (require) => {
  // Debug drawing helpers rendered directly on the main canvas.
  const state = require("core/state");
  const coordinates = require("core/coordinates");

  function renderAimOverlay(predictedX, predictedY, targetX, targetY) {
    if (!state.isDebug) return;

    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const [predictCanvasX, predictCanvasY] = coordinates.worldToCanvasPosition(
      predictedX,
      predictedY
    );
    const [targetCanvasX, targetCanvasY] = coordinates.worldToCanvasPosition(
      targetX,
      targetY
    );

    ctx.beginPath();
    ctx.arc(predictCanvasX, predictCanvasY, 25, Math.PI * 2, 0, true);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#ff5294";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(targetCanvasX, targetCanvasY, 25, Math.PI * 2, 0, true);
    ctx.fillStyle = "#52e8ff";
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(predictCanvasX, predictCanvasY);
    ctx.lineTo(targetCanvasX, targetCanvasY);
    ctx.strokeStyle = "rgba(67, 127, 255, 0.65)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function renderBulletSpeedOverlay() {
    if (!state.showBulletSpeeds || state.bulletPositions.length === 0) return;

    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.font = "12px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "bottom";

    state.bulletPositions.forEach((bp) => {
      const text =
        bp.speed === null || typeof bp.speed !== "number"
          ? "n/a"
          : bp.speed.toFixed(3);
      ctx.fillStyle = "rgba(46, 112, 255, 0.35)";
      const metrics = ctx.measureText(text);
      ctx.fillRect(bp.x + 4, bp.y - 20, metrics.width + 6, 18);
      ctx.fillStyle = "#eaf5ff";
      ctx.fillText(text, bp.x + 7, bp.y - 6);
    });
    ctx.restore();
  }

  function renderCoordinateOverlay() {
    if (!state.isDebug) return;

    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();

    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.font = "12px 'Kanit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const lineHeight = 13;
    const drawLines = (x, startY, lines, fill, stroke) => {
      const rows = Array.isArray(lines) ? lines : [lines];
      for (let i = 0; i < rows.length; i += 1) {
        const line = rows[i];
        const y = startY + i * lineHeight;
        if (typeof ctx.strokeText === "function") {
          ctx.lineWidth = 4;
          ctx.strokeStyle = stroke;
          ctx.strokeText(line, x, y);
        }
        ctx.fillStyle = fill;
        ctx.fillText(line, x, y);
      }
    };

    // Local player (tank is always centered on the main canvas)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    drawLines(
      centerX,
      centerY + 36,
      [`you x:${Math.round(state.playerX)}`, `y:${Math.round(state.playerY)}`],
      "#e6f3ff",
      "rgba(67, 127, 255, 0.55)"
    );

    // Enemy player markers
    for (let i = 0; i < state.players.length; i += 1) {
      const player = state.players[i];
      if (!player || player.teammate) continue;
      const labelY = player.y + (player.radius || 24) + 6;
      drawLines(
        player.x,
        labelY,
        [`x:${Math.round(player.wx)}`, `y:${Math.round(player.wy)}`],
        "#ffe5f5",
        "rgba(245, 82, 148, 0.6)"
      );
    }

    // Neutral shape coordinates (limited to avoid clutter)
    const shapeConfigs = [
      { list: state.neutralPentagons, tag: "P", fill: "#ffe66d" },
      { list: state.neutralTriangles, tag: "T", fill: "#ffb27f" },
      { list: state.neutralSquares, tag: "S", fill: "#b5ff9c" },
    ];
    for (let s = 0; s < shapeConfigs.length; s += 1) {
      const cfg = shapeConfigs[s];
      const list = Array.isArray(cfg.list) ? cfg.list : [];
      const limit = Math.min(list.length, 6);
      for (let i = 0; i < limit; i += 1) {
        const point = list[i];
        if (!point) continue;
        const [cx, cy] = point;
        const [wx, wy] = coordinates.getRenderedWorldPosition(cx, cy);
        drawLines(
          cx,
          cy + 16,
          [`${cfg.tag} x:${Math.round(wx)}`, `y:${Math.round(wy)}`],
          cfg.fill,
          "rgba(67, 127, 255, 0.45)"
        );
      }
    }

    if (state.lastFarmTarget && Number.isFinite(state.lastFarmTarget.wx)) {
      const canvasPoint = coordinates.worldToCanvasPosition(
        state.lastFarmTarget.wx,
        state.lastFarmTarget.wy
      );
      const [fx, fy] = canvasPoint;
      if (fx != null && fy != null) {
        drawLines(
          fx,
          fy + 18,
          [
            `farm: ${state.lastFarmTarget.type || "unknown"}`,
            `@${Math.round(state.lastFarmTarget.wx)},${Math.round(
              state.lastFarmTarget.wy
            )}`,
          ],
          "#d6ffe3",
          "rgba(46, 112, 255, 0.35)"
        );
      }
    }

    // Aim blend telemetry snapshot
    const aimDebug = state.lastAimDebug;
    if (
      aimDebug &&
      Number.isFinite(aimDebug.timestamp) &&
      now - aimDebug.timestamp < 1600
    ) {
      const interceptTime =
        aimDebug.intercept && Number.isFinite(aimDebug.intercept.t)
          ? `${Math.round(aimDebug.intercept.t)}ms`
          : "n/a";
      const motion = aimDebug.motion || {};
      const motionVel = motion.velocity || {};
      const targetWorld = aimDebug.targetWorld || {};
      const aimWorld = aimDebug.aimWorld || {};
      const shooterVel = aimDebug.shooterVelocity || {};
      const lines = [
        `target: ${aimDebug.targetName || "unknown"}`,
        `dist: ${Math.round(aimDebug.dist || 0)}`,
        `weight: ${(aimDebug.weight ?? 0).toFixed(2)}`,
        `intercept: ${interceptTime}`,
        `t @${Math.round(targetWorld.x || 0)},${Math.round(
          targetWorld.y || 0
        )}`,
        `aim @${Math.round(aimWorld.x || 0)},${Math.round(
          aimWorld.y || 0
        )}`,
      ];
      if (
        Number.isFinite(motionVel.x) &&
        Number.isFinite(motionVel.y)
      ) {
        lines.push(
          `vx:${motionVel.x.toFixed(3)} vy:${motionVel.y.toFixed(3)}`
        );
      }
      if (
        Number.isFinite(shooterVel.x) &&
        Number.isFinite(shooterVel.y)
      ) {
        lines.push(
          `self vx:${shooterVel.x.toFixed(3)} vy:${shooterVel.y.toFixed(3)}`
        );
      }
      drawLines(
        canvas.width - 140,
        canvas.height - lines.length * lineHeight - 24,
        lines,
        "#e6f3ff",
        "rgba(67, 127, 255, 0.55)"
      );
    }

    ctx.restore();
  }

  return {
    renderAimOverlay,
    renderBulletSpeedOverlay,
    renderCoordinateOverlay,
  };
});
