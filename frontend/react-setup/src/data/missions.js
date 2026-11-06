// 50 Data-Driven Playable Missions across 5 Sectors
// Fully compliant with VELoop Specifications (Parts II & III)

const SECTOR_NAMES = [
  { id: "orion-frontier", name: "Orion Frontier", min: 1, max: 10, boss: "iron_warden", bossName: "The Iron Warden" },
  { id: "crimson-nebula", name: "Crimson Nebula", min: 11, max: 20, boss: "nebula_serpent", bossName: "Nebula Serpent" },
  { id: "frozen-expanse", name: "Frozen Expanse", min: 21, max: 30, boss: "solar_devourer", bossName: "Solar Devourer" },
  { id: "rift-territory", name: "Rift Territory", min: 31, max: 40, boss: "rift_carrier", bossName: "The Rift Carrier" },
  { id: "void-citadel", name: "Void Citadel", min: 41, max: 50, boss: "void_emperor", bossName: "Void Emperor" },
];

const MISSION_NAMES = [
  // Sector 1: 1-10
  "First Contact", "Scout Intercept", "Frontier Skirmish", "Asteroid Ambush", 
  "Cargo Escort", "Orbital Patrol", "Perimeter Breach", "Recon Raid", 
  "Outer Outpost", "The Iron Warden",
  // Sector 2: 11-20
  "Solar Flare", "Crimson Incursion", "Plasma Storm", "Vanguard Strike", 
  "Burning Passage", "Nebula Ambush", "Thermal Rift", "Red Giant Siege", 
  "Inferno Front", "Nebula Serpent",
  // Sector 3: 21-30
  "Absolute Zero", "Frostbite Patrol", "Glacial Drift", "Cryo Shockwave", 
  "Sub-Zero Clashes", "Blizzard Sector", "Polar Gate", "Icebound Armada", 
  "Cold Void", "Solar Devourer",
  // Sector 4: 31-40
  "Dimensional Crack", "Rift Influx", "Warp Distortion", "Singularity Gate", 
  "Shadow Skirmish", "Dark Matter Surge", "Quantum Breach", "Anomalous Horde", 
  "Event Horizon", "The Rift Carrier",
  // Sector 5: 41-50
  "Citadel Outskirts", "Apex Vanguard", "Armada Vanguard", "Imperial Dreadnoughts", 
  "Omega Garrison", "Core Infiltration", "Oblivion March", "Throne Room Gates", 
  "Penultimate Stand", "Void Emperor"
];

export const missions = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1;
  const sector = SECTOR_NAMES.find(s => id >= s.min && id <= s.max);
  const isBoss = id % 10 === 0;
  
  let difficulty = "Beginner";
  if (id > 10 && id <= 20) difficulty = "Easy";
  else if (id > 20 && id <= 30) difficulty = "Medium";
  else if (id > 30 && id <= 40) difficulty = "Hard";
  else if (id > 40) difficulty = "Expert";

  const waves = isBoss ? 3 : Math.min(6, 3 + Math.floor((id - 1) / 12));
  const enemyCount = isBoss ? 0 : 18 + Math.floor(id * 2.2);

  let objectiveType = "destroy_enemies";
  let objectiveLabel = `Eliminate ${enemyCount} hostile craft`;
  
  if (isBoss) {
    objectiveType = "boss";
    objectiveLabel = `Defeat Boss: ${sector.bossName}`;
  } else if (id % 5 === 0) {
    objectiveType = "survive";
    objectiveLabel = `Survive all hostile waves without fatal hull breach`;
  }

  // Enemy tier availability based on mission progress
  const allowedEnemies = ["scout"];
  if (id >= 4) allowedEnemies.push("fighter");
  if (id >= 9) allowedEnemies.push("interceptor");
  if (id >= 16) allowedEnemies.push("tank");
  if (id >= 24) allowedEnemies.push("elite");

  const rewardCredits = isBoss ? 400 + id * 30 : 100 + id * 15;
  const rewardXp = isBoss ? 300 + id * 20 : 60 + id * 8;

  return {
    id,
    sectorId: sector.id,
    sectorName: sector.name,
    name: MISSION_NAMES[i] || `Mission ${id}`,
    description: isBoss
      ? `High-priority flagship encounter! Neutralize ${sector.bossName} commanding sector ${sector.name}.`
      : `Sector command requires immediate tactical pacification of ${sector.name} zone #${id}.`,
    difficulty,
    waveCount: waves,
    enemyCount,
    objective: {
      type: objectiveType,
      target: isBoss ? 1 : enemyCount,
      label: objectiveLabel
    },
    allowedEnemies,
    boss: isBoss,
    bossType: isBoss ? sector.boss : null,
    bossName: isBoss ? sector.bossName : null,
    rewards: {
      credits: rewardCredits,
      xp: rewardXp,
      energyCores: isBoss ? 3 : (id % 5 === 0 ? 1 : 0)
    },
    starCriteria: {
      oneStar: "Complete the mission",
      twoStar: isBoss ? "Defeat boss with >50% hull remaining" : "Achieve > 65% weapon accuracy",
      threeStar: isBoss ? "Defeat boss in under 75 seconds" : "Clear mission without losing shields"
    }
  };
});
