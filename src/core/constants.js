DiepScript.define("core/constants", () => {
  const gameStyleDefaults = {
    ren_grid_base_alpha: 0.05,
    square: "#ffe869",
    triangle: "#fc7677",
    pentagon: "#768dfc",
    teamBlue: "#00b2e1",
    teamRed: "#f14e54",
    teamPurple: "#bf7ff5",
    teamGreen: "#00e16e",
  };

  const bulletSpeedOffsets = {
    Skimmer: 0.5,
    Factory: 0.56,
    Annihilator: 0.7,
    Streamliner: 1.1,
    "Auto Gunner": 1.1,
    Gunner: 1.1,
    Predator: 1.4,
    Mothership: 0.48,
    Manager: 0.8,
    Hybrid: 0.7,
    Ranger: 1.5,
    Stalker: 1.5,
    Assassin: 1.5,
    Sniper: 1.5,
    Hunter: 1.4,
    Necromancer: 0.72,
    "Arena Closer": 2,
    Overlord: 0.8,
    Overseer: 0.8,
    Destroyer: 0.7,
  };

  const predatorStackTime = [
    [50, 500, 1400, 2800],
    [50, 500, 1300, 2700],
    [50, 400, 1200, 2450],
    [50, 300, 1100, 2200],
    [50, 300, 1000, 2100],
    [50, 300, 900, 1800],
    [50, 300, 800, 1700],
    [50, 300, 750, 1500],
  ];

  const hunterStackTime = [
    [50, 1200],
    [50, 1100],
    [50, 1000],
    [50, 950],
    [50, 800],
    [50, 725],
    [50, 700],
    [50, 625],
  ];

  const buildStatLevels = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 26, 27, 28, 30, 33, 36, 39, 42, 45,
  ];

  const statNumbers = {
    1: "healthRegen",
    2: "maxHealth",
    3: "bodyDamage",
    4: "bulletSpeed",
    5: "bulletPenetration",
    6: "bulletDamage",
    7: "reload",
    8: "movementSpeed",
  };

  const KeyBindings = Object.freeze({
    toggleAimbot: "KeyU",
    stack: "KeyI",
    toggleMenu: "KeyM",
  });

  return {
    FOV_UPDATE_INTERVAL: 16.6,
    FOV_LERP: 0.1,
    averageEnemyDodgeTime: 1750,
    destroyerAccuracy: true,
    playerVelocityPredictionSampleSize: 50,
    arenaSize: 26000,
    MAX_INTERCEPT_TIME_MS: 2000,
    AUTO_AIM_LERP: 0.45,
    AUTO_AIM_FIRE_THRESHOLD: 12,
    DRONE_AIM_LEAD_MS: 100,
    DRONE_CLASSES: ["Overseer", "Overlord"],
    bulletSpeedOffsets,
    predatorStackTime,
    hunterStackTime,
    buildStatLevels,
    statNumbers,
    gameStyleDefaults,
    KeyBindings,
  };
});
