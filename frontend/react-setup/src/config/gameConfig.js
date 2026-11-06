// Centralized Game & Economy Configuration
// Supports dynamic game name via environment variable VITE_GAME_NAME
export const GAME_NAME = import.meta.env.VITE_GAME_NAME || "SPACE SHOOTER ODYSSEY";

export const SECTORS = [
  {
    id: "orion-frontier",
    name: "Sector 1: Orion Frontier",
    theme: "Deep Space / Asteroid Belts",
    primaryColor: "#00e5ff",
    missions: [1, 10],
    bossMission: 10,
    bossName: "The Iron Warden",
    bgTheme: "cyan"
  },
  {
    id: "crimson-nebula",
    name: "Sector 2: Crimson Nebula",
    theme: "Superheated Gas & Solar Storms",
    primaryColor: "#ff0055",
    missions: [11, 20],
    bossMission: 20,
    bossName: "Nebula Serpent",
    bgTheme: "crimson"
  },
  {
    id: "frozen-expanse",
    name: "Sector 3: Frozen Expanse",
    theme: "Cryo-Comets & Sub-Zero Debris",
    primaryColor: "#00d2ff",
    missions: [21, 30],
    bossMission: 30,
    bossName: "Solar Devourer",
    bgTheme: "frost"
  },
  {
    id: "rift-territory",
    name: "Sector 4: Rift Territory",
    theme: "Dimensional Fractures & Dark Matter",
    primaryColor: "#bf55ec",
    missions: [31, 40],
    bossMission: 40,
    bossName: "The Rift Carrier",
    bgTheme: "purple"
  },
  {
    id: "void-citadel",
    name: "Sector 5: Void Citadel",
    theme: "Alien Armada Homeworld Core",
    primaryColor: "#ffd700",
    missions: [41, 50],
    bossMission: 50,
    bossName: "Void Emperor",
    bgTheme: "gold"
  }
];

export const SHIP_CLASSES = {
  interceptor: {
    id: "interceptor",
    name: "Viper Interceptor",
    class: "Interceptor",
    description: "Lightning-fast strike craft with twin balanced plasma pulse cannons. Superior maneuverability.",
    unlocked: true,
    costCredits: 0,
    costCores: 0,
    color: "#00e5ff",
    accentColor: "#ffffff",
    baseStats: {
      health: 100,
      speed: 7.5,
      damage: 18,
      fireRate: 8, // shots per sec
      shield: 50,
      specialCd: 12
    },
    specialName: "Hyper Thruster",
    specialDesc: "Temporary 200% speed boost and invulnerability dash"
  },
  striker: {
    id: "striker",
    name: "Crimson Striker",
    class: "Striker",
    description: "Aggressive attack gunship equipped with heavy vulcan blasters. High damage output with moderate defenses.",
    unlocked: false,
    costCredits: 2000,
    costCores: 5,
    color: "#ff3366",
    accentColor: "#ffa502",
    baseStats: {
      health: 85,
      speed: 6.8,
      damage: 28,
      fireRate: 9,
      shield: 35,
      specialCd: 14
    },
    specialName: "Overcharge Salvo",
    specialDesc: "Fires a 360-degree barrage of high-explosive micro-missiles"
  },
  guardian: {
    id: "guardian",
    name: "Aegis Guardian",
    class: "Guardian",
    description: "Reinforced titanium heavy dreadnought with hardened shield generators and dual front-line cannons.",
    unlocked: false,
    costCredits: 3500,
    costCores: 10,
    color: "#00f076",
    accentColor: "#55efc4",
    baseStats: {
      health: 180,
      speed: 5.2,
      damage: 22,
      fireRate: 6.5,
      shield: 100,
      specialCd: 16
    },
    specialName: "Fortress Barrier",
    specialDesc: "Creates a spherical particle shield absorbing 100% damage for 5 seconds"
  },
  support: {
    id: "support",
    name: "Orion Support Craft",
    class: "Support Craft",
    description: "Advanced reconnaissance and utility craft with built-in tractor beam and automated nanite repair.",
    unlocked: false,
    costCredits: 5000,
    costCores: 15,
    color: "#e056fd",
    accentColor: "#f368e0",
    baseStats: {
      health: 110,
      speed: 6.5,
      damage: 16,
      fireRate: 7.5,
      shield: 70,
      specialCd: 10
    },
    specialName: "Nanite Surge",
    specialDesc: "Instantly restores 40 HP and EMP-shocks nearby enemy projectiles"
  },
  experimental: {
    id: "experimental",
    name: "Void Phantom",
    class: "Experimental Ship",
    description: "Prototype dark matter vessel harnessing singularity energy. Unmatched alien devastation.",
    unlocked: false,
    costCredits: 10000,
    costCores: 25,
    color: "#ffd700",
    accentColor: "#ff4757",
    baseStats: {
      health: 150,
      speed: 8.0,
      damage: 35,
      fireRate: 10,
      shield: 90,
      specialCd: 15
    },
    specialName: "Singularity Beam",
    specialDesc: "Unleashes an all-obliterating laser column tearing through all enemy ranks"
  }
};

export const POWERUPS_CONFIG = {
  shieldPulse: {
    id: "shieldPulse",
    name: "Shield Pulse",
    description: "Deploys a kinetic deflection shield absorbing all incoming bullets",
    duration: 8000,
    color: "#00e5ff",
    icon: "🛡️"
  },
  rapidFire: {
    id: "rapidFire",
    name: "Rapid Fire",
    description: "Boosts weapon cyclic fire rate by 2.5x with hyper-plasma rounds",
    duration: 8000,
    color: "#ffd700",
    icon: "⚡"
  },
  spreadShot: {
    id: "spreadShot",
    name: "Spread Shot",
    description: "Upgrades primary cannons to a wide 5-way angled destruction cone",
    duration: 9000,
    color: "#ff9f43",
    icon: "🔱"
  },
  homingMissiles: {
    id: "homingMissiles",
    name: "Homing Missiles",
    description: "Launches continuous smart swarm missiles locking onto hostile targets",
    duration: 7000,
    color: "#ff4757",
    icon: "🚀"
  },
  empBlast: {
    id: "empBlast",
    name: "EMP Blast",
    description: "Detonates an electromagnetic shockwave neutralizing all enemy screen bullets",
    duration: 0,
    color: "#a55eea",
    icon: "💥"
  },
  repairDrone: {
    id: "repairDrone",
    name: "Repair Drone",
    description: "Deploys field nanites immediately restoring 40 hull integrity",
    duration: 0,
    color: "#2ed573",
    icon: "🔧"
  },
  overdrive: {
    id: "overdrive",
    name: "Overdrive",
    description: "Overclocks engine and reactors: 1.5x speed, 2x damage, invulnerability window",
    duration: 6000,
    color: "#ff6b81",
    icon: "🔥"
  },
  emergencyWarp: {
    id: "emergencyWarp",
    name: "Emergency Warp",
    description: "Instantly warps the ship to optimal safe coordinates with a micro-phase shield",
    duration: 0,
    color: "#1e90ff",
    icon: "🌀"
  }
};

export const ECONOMY_CONFIG = {
  missionBaseCredits: 120,
  bossBaseCredits: 500,
  enemyCreditDrop: 5,
  eliteCreditDrop: 25,
  coreDropRate: 0.15, // 15% chance from elite / boss
  threeStarBonusCredits: 100,
  threeStarBonusCores: 2,
  rewardedAds: {
    enabled: true,
    reviveMultiplier: 1,
    doubleScoreMultiplier: 2,
    doubleCreditsMultiplier: 2,
    extraShieldDuration: 12000,
    maxRevivesPerMission: 1,
    maxDoubleCreditsPerMission: 1,
    maxDoubleScorePerMission: 1,
    dailyAdCap: 15
  }
};

export const INITIAL_PLAYER_DATA = {
  level: 1,
  xp: 0,
  credits: 500,
  energyCores: 5,
  selectedShip: "interceptor",
  unlockedShips: ["interceptor"],
  shipUpgrades: {
    interceptor: { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 },
    striker: { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 },
    guardian: { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 },
    support: { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 },
    experimental: { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 }
  },
  completedMissions: {}, // { [id]: { stars: 3, highScore: 4500 } }
  highestMissionUnlocked: 1,
  dailyStreak: 1,
  lastDailyClaim: null,
  dailyMissions: [
    { id: "dm-1", text: "Defeat 35 enemy fighters", target: 35, current: 0, rewardCredits: 200, rewardCores: 1, completed: false },
    { id: "dm-2", text: "Collect 5 combat power-ups", target: 5, current: 0, rewardCredits: 150, rewardCores: 1, completed: false },
    { id: "dm-3", text: "Achieve a 3-star mission victory", target: 1, current: 0, rewardCredits: 300, rewardCores: 2, completed: false }
  ],
  achievements: [
    { id: "first_contact", title: "First Contact", desc: "Destroy your first hostile alien fighter", reward: 100, unlocked: false },
    { id: "fleet_recruit", title: "Fleet Recruit", desc: "Unlock a second combat spaceship in the Hangar", reward: 250, unlocked: false },
    { id: "boss_breaker", title: "Boss Breaker", desc: "Defeat the Sector 1 Boss: The Iron Warden", reward: 500, unlocked: false },
    { id: "sharpshooter", title: "Sharpshooter", desc: "Complete any mission with > 80% weapon accuracy", reward: 300, unlocked: false },
    { id: "power_surge", title: "Power Surge", desc: "Activate 10 combat power-ups across missions", reward: 200, unlocked: false },
    { id: "shield_master", title: "Shield Specialist", desc: "Absorb 20 hits using active Shield Pulse", reward: 250, unlocked: false },
    { id: "nebula_veteran", title: "Nebula Veteran", desc: "Conquer Sector 2: Crimson Nebula", reward: 600, unlocked: false },
    { id: "fleet_commander", title: "Fleet Commander", desc: "Unlock 4 different spaceship classes", reward: 1000, unlocked: false },
    { id: "armored_titan", title: "Maximum Overdrive", desc: "Upgrade any ship attribute to Level 5", reward: 400, unlocked: false },
    { id: "void_conqueror", title: "Void Conqueror", desc: "Defeat the Void Emperor in Mission 50", reward: 2500, unlocked: false }
  ],
  soundSettings: {
    sfxEnabled: true,
    musicEnabled: true,
    sfxVolume: 0.8,
    musicVolume: 0.4
  }
};
