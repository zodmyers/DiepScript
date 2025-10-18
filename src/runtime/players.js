DiepScript.define("runtime/players", (require) => {
  // Converts raw render information into persistent player objects with velocity/mode context.
  const state = require("core/state");
  const constants = require("core/constants");
  const math = require("core/math");
  const coordinates = require("core/coordinates");

  function parseDiepScore(raw) {
    if (!raw) return "";
    const tail = raw[raw.length - 1];
    if (tail === "k" || tail === "m") {
      const multiplier = tail === "k" ? 1000 : 1_000_000;
      const numeric = parseFloat(raw.slice(0, -1));
      return Number.isNaN(numeric) ? "" : numeric * multiplier;
    }
    if (!raw.includes(".")) {
      const asInt = parseInt(raw, 10);
      return Number.isNaN(asInt) ? "" : asInt;
    }
    return "";
  }

  function getClosestText(entries, x, y) {
    return entries.reduce((acc, curr) => {
      if (!acc) return curr;
      const distAcc = math.getDistance(x, y, acc.mx, acc.my);
      const distCur = math.getDistance(x, y, curr.mx, curr.my);
      return distCur < distAcc ? curr : acc;
    }, null);
  }

  // Rebuild player list each frame by pairing canvas text blobs with tank shapes.
  function updatePlayersFromRender() {
    state.lastPlayers = state.players;
    state.players = [];

    for (let i = 0; i < state.tankShapes.length; i += 1) {
      const shape = state.tankShapes[i];
      if (shape.radius / state.fov < 19) continue;

      const scoreTextPos = [shape.x, shape.y - shape.radius * 1.3];
      const nameTextPos = [shape.x, shape.y - shape.radius * 2];

      const closestScore = getClosestText(state.text, ...scoreTextPos);
      const closestName = getClosestText(state.text, ...nameTextPos);

      const distToScore = closestScore
        ? math.getDistance(
            scoreTextPos[0],
            scoreTextPos[1],
            closestScore.mx,
            closestScore.my
          )
        : Infinity;
      const distToName = closestName
        ? math.getDistance(
            nameTextPos[0],
            nameTextPos[1],
            closestName.mx,
            closestName.my
          )
        : Infinity;

      const score =
        distToScore < 25 ? parseDiepScore(closestScore?.text || "-1") : "";
      const name = distToName < 25 ? closestName?.text || "" : "";

      if (score === "" && (!name || !name.trim())) continue;

      const [wx, wy] = coordinates.getRenderedWorldPosition(shape.x, shape.y);
      const teammate =
        isTeamMode() &&
        state.teamColor &&
        shape.fillStyle === state.gameStyle[state.teamColor];

      state.players.push({
        wx,
        wy,
        x: shape.x,
        y: shape.y,
        radius: shape.radius,
        name,
        score,
        velocity: [0, 0],
        acceleration: [0, 0],
        motionSamples: 0,
        accelSamples: 0,
        teammate,
      });
    }
  }

  // Attempt to match the freshly parsed players to the previous frame to preserve velocity history.
  function matchPlayers() {
    const now = performance.now();
    const maxHistory = constants.playerVelocityPredictionSampleSize;

    for (let i = 0; i < state.players.length; i += 1) {
      const current = state.players[i];
      const last = state.lastPlayers.reduce((acc, candidate) => {
        if (!acc) return candidate;
        const distAcc = math.getDistance(
          current.wx,
          current.wy,
          acc.wx,
          acc.wy
        );
        const distCur = math.getDistance(
          current.wx,
          current.wy,
          candidate.wx,
          candidate.wy
        );
        return distCur < distAcc ? candidate : acc;
      }, null);

      if (
        last &&
        math.getDistance(current.wx, current.wy, last.wx, last.wy) < 25
      ) {
        const history = last.positionTable.concat({
          x: current.wx,
          y: current.wy,
          timestamp: now,
        });
        while (history.length > maxHistory) history.shift();

        current.teammate = last.teammate || current.teammate;
        current.positionTable = history;
        const motion = math.getMotionEstimate(history);
        current.velocity = [motion.vx || 0, motion.vy || 0];
        current.acceleration = [motion.ax || 0, motion.ay || 0];
        current.motionSamples = motion.velocitySamples || 0;
        current.accelSamples = motion.accelSamples || 0;
      } else {
        current.positionTable = Array.from({ length: maxHistory }, () => null);
        current.velocity = [0, 0];
        current.acceleration = [0, 0];
        current.motionSamples = 0;
        current.accelSamples = 0;
      }

      if (!isTeamMode()) {
        current.teammate = false;
      }
    }
  }

  // Heuristic for deciding which enemy to prioritise (distance + score).
  function getPlayerWeight(player) {
    const distanceWeight =
      (1 /
        math.getDistance(
          state.playerX,
          state.playerY,
          player.wx,
          player.wy
        )) *
      1000;
    const scoreWeight =
      Math.min(23536, Math.max(0, player.score || 0)) / 100000;
    return distanceWeight + scoreWeight;
  }

  function nearestShapeWorld(canvasPoints) {
    let nearest = null;
    let nearestDist = Infinity;
    for (let i = 0; i < canvasPoints.length; i += 1) {
      const [cx, cy] = canvasPoints[i];
      const [wx, wy] = coordinates.getRenderedWorldPosition(cx, cy);
      const dist = math.getDistance(state.playerX, state.playerY, wx, wy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = [wx, wy];
      }
    }
    return nearest;
  }

  function getActiveGamemode() {
    try {
      if (
        window.__common__ &&
        typeof window.__common__.active_gamemode === "string"
      ) {
        return window.__common__.active_gamemode.toLowerCase();
      }
    } catch (error) {
      if (state.isDebug) console.warn("active_gamemode lookup failed:", error);
    }
    try {
      const gmEl = document.querySelector(
        ".gamemode-title, .gamemode-name, .mode-name"
      );
      if (gmEl && gmEl.innerText) return gmEl.innerText.toLowerCase();
    } catch (error) {
      if (state.isDebug) console.warn("active gamemode text lookup failed:", error);
    }
    return "";
  }

  function isFfaMode() {
    const gm = getActiveGamemode();
    if (!gm) return false;
    return (
      gm.includes("ffa") ||
      gm.includes("free") ||
      gm.includes("freeforall")
    );
  }

  function isTeamMode() {
    const gm = getActiveGamemode();
    const teamNames = ["team", "teams", "tdm", "domination", "ctf"];
    if (gm) {
      if (gm.includes("ffa") || gm.includes("free")) return false;
      for (let i = 0; i < teamNames.length; i += 1) {
        if (gm.includes(teamNames[i])) return true;
      }
    }
    const partyBtn = document.getElementById("copy-party-link");
    return !!(partyBtn && partyBtn.className && partyBtn.className.trim() !== "");
  }

  function updateTeamColor() {
    if (isFfaMode()) {
      state.teamColor = "";
      return;
    }

    const partyLinkButton = document.getElementById("copy-party-link");
    if (!partyLinkButton || !partyLinkButton.className) {
      state.teamColor = "";
      return;
    }

    switch (partyLinkButton.className) {
      case "active blue":
        state.teamColor = "teamBlue";
        break;
      case "active purple":
        state.teamColor = "teamPurple";
        break;
      case "active green":
        state.teamColor = "teamGreen";
        break;
      case "active red":
        state.teamColor = "teamRed";
        break;
      default:
        state.teamColor = "";
        break;
    }
  }

  return {
    updatePlayersFromRender,
    matchPlayers,
    getPlayerWeight,
    nearestShapeWorld,
    getActiveGamemode,
    isFfaMode,
    isTeamMode,
    updateTeamColor,
  };
});
