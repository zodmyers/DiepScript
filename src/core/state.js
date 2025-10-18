DiepScript.define("core/state", (require) => {
  // Shared mutable state for every module. Treat this as the single source of truth.
  const constants = require("core/constants");

  const state = {
    // FOV
    setFov: 0.5,
    foxv: 0.5,
    keyStates: new Map(),
    prevAimWorld: null,

    // Spinner / input status
    spinSpeed: 0.8,
    isSpinning: false,
    spinAngle: 0,
    isShooting: false,
    isFiring: false,
    isAimbotActive: true,

    // Player data
    playerTank: "Tank",
    playerLevel: 1,
    playerX: 0,
    playerY: 0,
    arrowPos: [0, 0],
    minimapPos: [0, 0],
    minimapSize: [0, 0],
    fov: 0.5,
    teamColor: "",
    hasJoined: false,

    // Render parsing caches
    text: [],
    tankShapes: [],
    lastPlayers: [],
    players: [],
    lastArc: [Infinity, Infinity],

    // Mouse & key tracking
    mousePressed: false,
    rightMouseDown: false,
    mouseLocked: false,
    mouseX: 0,
    mouseY: 0,
    spaceDown: false,

    // Autofarm state
    isAutoFarm: false,
    neutralSquares: [],
    neutralPentagons: [],
    neutralTriangles: [],
    farmPriority: "pentagon",
    autoAimX: null,
    autoAimY: null,
    lastFarmTarget: null,

    // Debug / overlays
    isDebug: false,
    useConvarBulletSpeed: false,
    showBulletSpeeds: false,
    bulletPositions: [],
    currentComputedBulletSpeed: null,
    useDroneAimOnlyForMinions: false,
    autofarmOnRightHold: true,
    lastAimDebug: null,

    // Misc runtime
    forcingU: false,
    playerPositionTable: Array.from(
      { length: constants.playerVelocityPredictionSampleSize },
      () => null
    ),
    shooterVelocity: [0, 0],
    gameStyle: { ...constants.gameStyleDefaults },

    // Menu + UI
    menuContainer: null,

    // Canvas hook helpers
    ctxTransform: null,
    pathPosition: 0,
    pathVertices: [],

    // Handles/IDs
    checkGameStartId: null,
  };

  return state;
});
