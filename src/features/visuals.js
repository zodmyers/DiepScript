DiepScript.define("features/visuals", (require) => {
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
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
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
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      const metrics = ctx.measureText(text);
      ctx.fillRect(bp.x + 4, bp.y - 20, metrics.width + 6, 18);
      ctx.fillStyle = "#FFD700";
      ctx.fillText(text, bp.x + 7, bp.y - 6);
    });
    ctx.restore();
  }

  return {
    renderAimOverlay,
    renderBulletSpeedOverlay,
  };
});
