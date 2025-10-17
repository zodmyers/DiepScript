DiepScript.define("core/math", () => {
  // Math helpers kept pure so they can be unit-tested or reused in other surfaces.
  function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function predictPlayer(player, timeMs) {
    const velocity = player.velocity || [0, 0];
    const vx = velocity[0] || 0;
    const vy = velocity[1] || 0;
    return [player.wx + timeMs * vx, player.wy + timeMs * vy];
  }

  function getAverage(points) {
    if (!points || points.length === 0) return [0, 0];
    let sumX = 0;
    let sumY = 0;
    points.forEach(([x, y]) => {
      sumX += x;
      sumY += y;
    });
    return [sumX / points.length, sumY / points.length];
  }

  function quad(a, b, c) {
    let solution = null;
    if (Math.abs(a) < 1e-6) {
      if (Math.abs(b) < 1e-6) {
        solution = Math.abs(c) < 1e-6 ? [0, 0] : null;
      } else {
        const root = -c / b;
        solution = [root, root];
      }
    } else {
      let disc = b * b - 4 * a * c;
      if (disc >= 0) {
        disc = Math.sqrt(disc);
        const twoA = 2 * a;
        solution = [(-b - disc) / twoA, (-b + disc) / twoA];
      }
    }
    return solution;
  }

  function intercept(shooter, target, bulletSpeed) {
    const tx = target.x - shooter.x;
    const ty = target.y - shooter.y;
    const tvx = target.vx || 0;
    const tvy = target.vy || 0;

    const a = tvx * tvx + tvy * tvy - bulletSpeed * bulletSpeed;
    const b = 2 * (tvx * tx + tvy * ty);
    const c = tx * tx + ty * ty;

    const ts = quad(a, b, c);
    if (!ts) return null;

    let [t0, t1] = ts;
    let t = Math.min(t0, t1);
    if (t < 0) t = Math.max(t0, t1);

    if (!(t > 0)) return null;

    return {
      x: target.x + tvx * t,
      y: target.y + tvy * t,
      t,
    };
  }

  function smoothstep(a, b, x) {
    if (a === b) return x <= a ? 0 : 1;
    let t = (x - a) / (b - a);
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  // Smoothly merges “fire straight” with interception math so aim feels stable.
  function blendPredictiveAim(
    shooter,
    target,
    shooterVel,
    bulletSpeed,
    prevAimWorld,
    opts = {}
  ) {
    const minDist = opts.minDist ?? 400;
    const maxDist = opts.maxDist ?? 2000;
    const minSamples = opts.minSamples ?? 3;
    const goodSamples = opts.goodSamples ?? 6;
    const maxGoodT = opts.maxGoodT ?? 1200;
    const minGoodT = opts.minGoodT ?? 30;
    const maxAngleDeg = opts.maxAngleDeg ?? 120;
    const relRatioCap = opts.relRatioCap ?? 0.9;
    const alphaSmooth = opts.alphaSmooth ?? 0.65;

    const dist = getDistance(shooter.x, shooter.y, target.wx, target.wy);

    const sampleCount = (target.positionTable || []).filter(Boolean).length;
    const rawTvx =
      target.velocity && sampleCount >= minSamples
        ? target.velocity[0] || 0
        : 0;
    const rawTvy =
      target.velocity && sampleCount >= minSamples
        ? target.velocity[1] || 0
        : 0;

    const fbTime = Math.max(
      12,
      Math.min(400, dist / Math.max(1e-6, bulletSpeed))
    );
    const linearPred = {
      x: target.wx + rawTvx * fbTime,
      y: target.wy + rawTvy * fbTime,
    };

    const relVx = (rawTvx || 0) - (shooterVel[0] || 0);
    const relVy = (rawTvy || 0) - (shooterVel[1] || 0);
    const interceptSolution = intercept(
      shooter,
      { x: target.wx, y: target.wy, vx: relVx, vy: relVy },
      bulletSpeed
    );

    const sDist = smoothstep(minDist, maxDist, dist);
    const velSampleRange = goodSamples - minSamples;
    const sVelSamples =
      velSampleRange <= 0
        ? 1
        : Math.max(0, Math.min(1, (sampleCount - minSamples) / velSampleRange));

    let sSolT = 0;
    let sAngle = 0;
    let solExists = false;
    if (
      interceptSolution &&
      Number.isFinite(interceptSolution.t) &&
      interceptSolution.t > 0
    ) {
      solExists = true;
      sSolT =
        1 -
        Math.max(
          0,
          (interceptSolution.t - minGoodT) / (maxGoodT - minGoodT)
        );
      const aimVecX = interceptSolution.x - shooter.x;
      const aimVecY = interceptSolution.y - shooter.y;
      const targVecX = target.wx - shooter.x;
      const targVecY = target.wy - shooter.y;
      const denom = Math.max(
        1e-9,
        Math.hypot(aimVecX, aimVecY) * Math.hypot(targVecX, targVecY)
      );
      let cosTheta =
        (aimVecX * targVecX + aimVecY * targVecY) / denom || 0;
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
      const thetaDeg = Math.acos(cosTheta) * (180 / Math.PI);
      sAngle = 1 - Math.min(1, thetaDeg / maxAngleDeg);
    }

    const relSpeed = Math.hypot(relVx, relVy);
    const sRelSpeed =
      1 -
      Math.min(
        1,
        relSpeed / (Math.max(1e-6, bulletSpeed) * relRatioCap)
      );

    const wBase = sDist * sVelSamples;
    const wSol = solExists
      ? (0.6 * sSolT + 0.4 * sAngle) * sRelSpeed
      : 0;
    let weight = Math.max(0, Math.min(1, 0.6 * wBase + 0.4 * wSol));
    if (!solExists) weight = 0;

    const aimWorld = {
      x:
        linearPred.x * (1 - weight) +
        (solExists ? interceptSolution.x : linearPred.x) * weight,
      y:
        linearPred.y * (1 - weight) +
        (solExists ? interceptSolution.y : linearPred.y) * weight,
    };

    const finalAim =
      prevAimWorld && typeof prevAimWorld.x === "number"
        ? {
            x: prevAimWorld.x * (1 - alphaSmooth) + aimWorld.x * alphaSmooth,
            y: prevAimWorld.y * (1 - alphaSmooth) + aimWorld.y * alphaSmooth,
          }
        : aimWorld;

    return {
      x: finalAim.x,
      y: finalAim.y,
      weight,
      debug: {
        dist,
        sampleCount,
        intercept: interceptSolution,
        sDist,
        sVelSamples,
        sSolT,
        sAngle,
        sRelSpeed,
      },
    };
  }

  return {
    getDistance,
    predictPlayer,
    getAverage,
    quad,
    intercept,
    blendPredictiveAim,
  };
});
