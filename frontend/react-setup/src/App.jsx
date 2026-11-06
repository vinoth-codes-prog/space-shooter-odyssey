import React, { useState, useEffect } from 'react';
import Game from './Game';
import ShipPreview from './components/ShipPreview';
import { GAME_NAME, SECTORS, SHIP_CLASSES, INITIAL_PLAYER_DATA } from './config/gameConfig';
import { missions } from './data/missions';
import { soundManager } from './services/soundManager';
import './App.css';
import SpaceLoadingScene from './components/SpaceLoadingScene';

const STORAGE_KEY = 'space_shooter_odyssey_player_data_v2';

export default function App() {
  // Load persisted player data or initial defaults
  const [playerData, setPlayerData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_PLAYER_DATA;
    } catch (e) {
      return INITIAL_PLAYER_DATA;
    }
  });

  // Navigation & Modals with URL hash & query support
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (['home', 'hangar', 'missions'].includes(hash)) return hash;
    return 'home';
  };
  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
  if (!isLoading) return;

  const timer = setInterval(() => {
    setLoadingProgress((previous) => {
      if (previous >= 100) {
        clearInterval(timer);

        setIsLaunching(true);
        setTimeout(() => {
        setIsLoading(false);
        }, 1400);

        return 100;
      }

      return Math.min(previous + 1, 100);
    });
  }, 45);

  return () => clearInterval(timer);
}, [isLoading]);

  const [selectedMission, setSelectedMission] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('boss') === '1') return missions.find(m => m.boss) || missions[9];
    if (params.get('play')) {
      const id = parseInt(params.get('play'), 10) || 1;
      return missions.find(m => m.id === id) || missions[0];
    }
    return null;
  });

  const [isPlaying, setIsPlaying] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('play') || params.has('boss');
  });
  const [selectedHangarShip, setSelectedHangarShip] = useState(playerData.selectedShip || 'interceptor');
  const [selectedSectorId, setSelectedSectorId] = useState('orion-frontier');
  const [showOpsModal, setShowOpsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playerData));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [playerData]);

  // Set document title from dynamic config
  useEffect(() => {
    document.title = GAME_NAME;
  }, []);

  // Update Player Data helper
  const handleUpdatePlayerData = (updates) => {
    setPlayerData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Launch Mission
  const startMission = (mission) => {
    soundManager.playSfx('uiClick');
    setSelectedMission(mission);
    setIsPlaying(true);
  };

  // Claim Daily Login Reward
  const handleClaimDailyReward = () => {
    soundManager.playSfx('powerup');
    const rewardCredits = 300 + playerData.dailyStreak * 50;
    const rewardCores = playerData.dailyStreak >= 7 ? 3 : 1;
    handleUpdatePlayerData({
      credits: playerData.credits + rewardCredits,
      energyCores: playerData.energyCores + rewardCores,
      lastDailyClaim: new Date().toDateString(),
      dailyStreak: (playerData.dailyStreak % 7) + 1
    });
    alert(`🎉 DAILY REWARD CLAIMED!\n+${rewardCredits} Credits\n+${rewardCores} Energy Cores`);
  };

  // Ship Upgrade Handler
  const handleUpgradeShip = (attribute) => {
    const shipId = selectedHangarShip;
    const currentLvl = playerData.shipUpgrades?.[shipId]?.[attribute] || 0;
    if (currentLvl >= 5) {
      alert("Maximum upgrade level reached!");
      return;
    }

    const cost = (currentLvl + 1) * 350;
    if (playerData.credits < cost) {
      alert(`Insufficient Credits! Need ${cost} Credits.`);
      return;
    }

    soundManager.playSfx('uiClick');
    const updatedShipUpgrades = {
      ...playerData.shipUpgrades,
      [shipId]: {
        ...(playerData.shipUpgrades?.[shipId] || {}),
        [attribute]: currentLvl + 1
      }
    };

    handleUpdatePlayerData({
      credits: playerData.credits - cost,
      shipUpgrades: updatedShipUpgrades
    });
  };

  // Ship Unlock Handler
  const handleUnlockShip = (shipId) => {
    const config = SHIP_CLASSES[shipId];
    if (playerData.credits < config.costCredits || playerData.energyCores < config.costCores) {
      alert(`Requires ${config.costCredits} Credits and ${config.costCores} Energy Cores!`);
      return;
    }

    soundManager.playSfx('powerup');
    handleUpdatePlayerData({
      credits: playerData.credits - config.costCredits,
      energyCores: playerData.energyCores - config.costCores,
      unlockedShips: [...playerData.unlockedShips, shipId],
      selectedShip: shipId
    });
    alert(`🎉 ${config.name.toUpperCase()} UNLOCKED AND READY FOR DEPLOYMENT!`);
  };

  // Toggle Audio
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundManager.setMusicEnabled(nextState);
    soundManager.setSfxEnabled(nextState);
  };

  // SPACE SHOOTER ODYSSEY - LOADING SCREEN
if (isLoading) {
  return (
    <div className={`loading-screen ${isLaunching ? 'launching' : ''}`}>
      <div className="loading-content">
        <h1>SPACE SHOOTER</h1>
        <h2>ODYSSEY</h2>

  <div className={`loading-ship ${isLaunching ? 'ship-launch' : ''}`}>
  <div className="energy-ring ring-one"></div>
  <div className="energy-ring ring-two"></div>
  <div className="energy-core"></div>

  <div className="loading-craft">
    <div className="craft-wing left-wing"></div>
    <div className="craft-body"></div>
    <div className="craft-wing right-wing"></div>
    <div className="craft-engine"></div>
  </div>

  <div className="energy-particles"></div>
</div>

        <p className="loading-label">PREPARING FOR BATTLE...</p>

        <div className="loading-bar">
          <div
            className="loading-bar-fill"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>

        <p className="loading-percentage">
          {loadingProgress}%
        </p>

        <p className="loading-footer">
          PREPARE FOR THE ULTIMATE BATTLE
        </p>
      </div>
    </div>
  );
}

  // If in combat mode, mount fullscreen Game component
  if (isPlaying && selectedMission) {
    return (
      <Game
        mission={selectedMission}
        playerData={playerData}
        onUpdatePlayerData={handleUpdatePlayerData}
        onBack={() => setIsPlaying(false)}
      />
    );
  }

  const activeShipConfig = SHIP_CLASSES[playerData.selectedShip] || SHIP_CLASSES.interceptor;
  const currentSectorMissions = missions.filter(m => m.sectorId === selectedSectorId);
  const activeHangarConfig = SHIP_CLASSES[selectedHangarShip] || SHIP_CLASSES.interceptor;
  const isHangarShipUnlocked = playerData.unlockedShips.includes(selectedHangarShip);
  const hangarUpgrades = playerData.shipUpgrades?.[selectedHangarShip] || { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 };

  return (
    <div className="sci-fi-app-shell">
      {/* Dynamic Starfield Background */}
      <div className="space-star-glow-bg"></div>

      {/* Futuristic Command Header */}
      <header className="main-command-header">
        <div className="command-brand">
          <div className="brand-symbol">✦</div>
          <div className="brand-text">
            <span className="brand-title">{GAME_NAME}</span>
            <small className="brand-sub">TACTICAL STAR COMMAND</small>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="command-nav">
          <button
            className={`nav-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => { soundManager.playSfx('uiClick'); setCurrentTab('home'); window.location.hash = 'home'; }}
          >
            COMMAND
          </button>
          <button
            className={`nav-btn ${currentTab === 'missions' ? 'active' : ''}`}
            onClick={() => { soundManager.playSfx('uiClick'); setCurrentTab('missions'); window.location.hash = 'missions'; }}
          >
            MISSIONS (50)
          </button>
          <button
            className={`nav-btn ${currentTab === 'hangar' ? 'active' : ''}`}
            onClick={() => { soundManager.playSfx('uiClick'); setCurrentTab('hangar'); window.location.hash = 'hangar'; }}
          >
            HANGAR
          </button>
          <button
            className="nav-btn"
            onClick={() => { soundManager.playSfx('uiClick'); setShowOpsModal(true); }}
          >
            OPERATIONS
          </button>
          <button
            className="nav-btn"
            onClick={() => { soundManager.playSfx('uiClick'); setShowLeaderboardModal(true); }}
          >
            LEADERBOARD
          </button>
        </nav>

        {/* Player Wallet & Controls */}
        <div className="command-wallet-bar">
          <div className="wallet-chip credits" title="Combat Credits">
            <span className="chip-icon">🪙</span>
            <span className="chip-val">{playerData.credits.toLocaleString()}</span>
          </div>

          <div className="wallet-chip cores" title="Energy Cores">
            <span className="chip-icon">⚡</span>
            <span className="chip-val">{playerData.energyCores}</span>
          </div>

          <button className="sound-toggle-btn" onClick={toggleSound} title="Toggle Audio">
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="command-main-content">
        {/* ==================== 1. HOME COMMAND VIEW ==================== */}
        
{/* ==================== 1. HOME COMMAND VIEW ==================== */}
{currentTab === 'home' && (
  <section className="odyssey-home">

    {/* Background atmosphere */}
    <div className="odyssey-home-atmosphere">
      <div className="odyssey-orbit orbit-one"></div>
      <div className="odyssey-orbit orbit-two"></div>
      <div className="odyssey-light-beam"></div>
    </div>

    {/* Top briefing */}
    <div className="odyssey-topline">
      <div>
        <span className="odyssey-live-dot"></span>
        FLEET COMMAND CENTER
      </div>
      <span className="odyssey-alert">
        ⚠ HOSTILE ACTIVITY DETECTED
      </span>
    </div>

    {/* Main hero area */}
    <div className="odyssey-hero-grid">

      {/* Left: Mission briefing */}
      <div className="odyssey-briefing">

        <span className="odyssey-eyebrow">
          DEEP SPACE DEFENSE INITIATIVE
        </span>

        <h1>
          THE GALAXY
          <br />
          IS <span>YOUR</span>
          <br />
          BATTLEFIELD.
        </h1>

        <p className="odyssey-description">
          The Armada has entered our territory. Take command of your
          starfighter, defend the sectors, and become the ultimate
          guardian of the galaxy.
        </p>

        <div className="odyssey-mission-status">
          <div>
            <small>CURRENT OPERATION</small>
            <strong>MISSION {playerData.highestMissionUnlocked}</strong>
          </div>
          <div className="odyssey-status-ready">
            <span></span>
            READY FOR DEPLOYMENT
          </div>
        </div>

        {/* Main actions */}
        <div className="odyssey-actions">
          <button
            className="odyssey-launch-button"
            onClick={() => {
              const nextM =
                missions.find(
                  m => m.id === playerData.highestMissionUnlocked
                ) || missions[0];

              startMission(nextM);
            }}
          >
            <span>▶</span>
            <div>
              <strong>LAUNCH MISSION</strong>
              <small>BEGIN YOUR NEXT OPERATION</small>
            </div>
          </button>

          <button
            className="odyssey-hangar-button"
            onClick={() => {
              soundManager.playSfx('uiClick');
              setCurrentTab('hangar');
              window.location.hash = 'hangar';
            }}
          >
            FLEET HANGAR ↗
          </button>
        </div>

        {/* Daily reward */}
        <div className="odyssey-reward-panel">
          <div className="odyssey-reward-icon">✦</div>

          <div className="odyssey-reward-info">
            <small>COMMANDER DAILY REWARD</small>
            <strong>DAY {playerData.dailyStreak} / 7</strong>
            <span>Continue your daily streak to earn rewards.</span>
          </div>

          <button
            className="odyssey-reward-button"
            onClick={handleClaimDailyReward}
            disabled={
              playerData.lastDailyClaim === new Date().toDateString()
            }
          >
            {playerData.lastDailyClaim === new Date().toDateString()
              ? 'CLAIMED ✓'
              : 'CLAIM REWARD'}
          </button>
        </div>
      </div>

      {/* Right: Active starfighter showcase */}
      <div className="odyssey-ship-stage">

        <div className="odyssey-stage-label">
          <span>01 / ACTIVE STARFIGHTER</span>
          <span>HOLOGRAPHIC DISPLAY</span>
        </div>

        <div className="odyssey-ship-visual">
          <div className="odyssey-ship-glow"></div>
          <div className="odyssey-ship-ring ring-a"></div>
          <div className="odyssey-ship-ring ring-b"></div>

          <div className="odyssey-ship-model">
            <ShipPreview
              shipId={playerData.selectedShip}
              size={340}
            />
          </div>

          <div className="odyssey-coordinate coordinate-top">
            X: 024.82
            <br />
            Y: 091.36
          </div>

          <div className="odyssey-coordinate coordinate-bottom">
            SYSTEM STATUS: ONLINE
          </div>
        </div>

        <div className="odyssey-ship-details">
          <div>
            <small>YOUR CURRENT VESSEL</small>
            <h2>{activeShipConfig.name}</h2>
            <p>{activeShipConfig.description}</p>
          </div>

          <span className="odyssey-ship-ready">
            ● OPERATIONAL
          </span>
        </div>

      </div>
    </div>

    {/* Bottom statistics */}
    <div className="odyssey-intel-section">
      <div className="odyssey-intel-heading">
        <span>MISSION INTELLIGENCE</span>
        <small>GALACTIC CAMPAIGN OVERVIEW</small>
      </div>

      <div className="odyssey-intel-grid">

        <div className="odyssey-intel-card">
          <span className="odyssey-intel-icon">⌖</span>
          <div>
            <small>TOTAL OPERATIONS</small>
            <strong>50</strong>
            <span>Across 5 sectors</span>
          </div>
        </div>

        <div className="odyssey-intel-card">
          <span className="odyssey-intel-icon">✧</span>
          <div>
            <small>EPIC BOSSES</small>
            <strong>05</strong>
            <span>Major enemy encounters</span>
          </div>
        </div>

        <div className="odyssey-intel-card">
          <span className="odyssey-intel-icon">◈</span>
          <div>
            <small>STARFIGHTER CLASSES</small>
            <strong>05</strong>
            <span>Build your fleet</span>
          </div>
        </div>

        <div className="odyssey-intel-card">
          <span className="odyssey-intel-icon">⬡</span>
          <div>
            <small>UNLOCKED MISSIONS</small>
            <strong>{playerData.highestMissionUnlocked}</strong>
            <span>Current campaign progress</span>
          </div>
        </div>

      </div>
    </div>

  </section>
)}


        {/* ==================== 2. HANGAR VIEW (FLEET & UPGRADES) ==================== */}
        {currentTab === 'hangar' && (
          <section className="hangar-view-container">
            <div className="view-header">
              <h2>FLEET HANGAR & UPGRADE FACILITY</h2>
              <p>Acquire specialized starships and engineer permanent weapon & hull enhancements.</p>
            </div>

            {/* Ship Selector Carousel */}
            <div className="hangar-ships-row">
              {Object.keys(SHIP_CLASSES).map(shipKey => {
                const s = SHIP_CLASSES[shipKey];
                const isUnlocked = playerData.unlockedShips.includes(shipKey);
                const isSelected = playerData.selectedShip === shipKey;
                return (
                  <div
                    key={shipKey}
                    className={`hangar-ship-selector ${selectedHangarShip === shipKey ? 'active' : ''}`}
                    onClick={() => { soundManager.playSfx('uiClick'); setSelectedHangarShip(shipKey); }}
                  >
                    <div className="selector-preview">
                      <ShipPreview shipId={shipKey} size={100} />
                    </div>
                    <h4>{s.name}</h4>
                    <span className="ship-type-tag">{s.class}</span>
                    {isSelected && <span className="active-badge">SELECTED</span>}
                    {!isUnlocked && <span className="locked-badge">🔒 LOCKED</span>}
                  </div>
                );
              })}
            </div>

            {/* Selected Ship Detail & Upgrades Grid */}
            <div className="hangar-detail-grid">
              {/* Ship Inspection */}
              <div className="hangar-card ship-inspect">
                <h3>{activeHangarConfig.name}</h3>
                <span className="class-badge">{activeHangarConfig.class}</span>
                <div className="inspect-canvas-wrap">
                  <ShipPreview shipId={selectedHangarShip} size={220} />
                </div>
                <p className="ship-lore">{activeHangarConfig.description}</p>

                <div className="special-ability-card">
                  <small>SPECIAL ABILITY</small>
                  <strong>⚡ {activeHangarConfig.specialName}</strong>
                  <p>{activeHangarConfig.specialDesc}</p>
                </div>

                <div className="hangar-action-btn-wrap">
                  {isHangarShipUnlocked ? (
                    <button
                      className="hangar-primary-btn"
                      disabled={playerData.selectedShip === selectedHangarShip}
                      onClick={() => {
                        soundManager.playSfx('uiClick');
                        handleUpdatePlayerData({ selectedShip: selectedHangarShip });
                      }}
                    >
                      {playerData.selectedShip === selectedHangarShip ? 'CURRENTLY ACTIVE SHIP' : 'DEPLOY AS ACTIVE SHIP'}
                    </button>
                  ) : (
                    <button
                      className="hangar-unlock-btn"
                      onClick={() => handleUnlockShip(selectedHangarShip)}
                    >
                      UNLOCK VESSEL ({activeHangarConfig.costCredits} 🪙 + {activeHangarConfig.costCores} ⚡)
                    </button>
                  )}
                </div>
              </div>

              {/* Ship Attributes & Upgrade Station */}
              <div className="hangar-card ship-upgrades">
                <h3>ENGINEERING & UPGRADES</h3>
                <p>Enhance combat systems using earned Credits. Upgrades apply directly in all missions.</p>

                <div className="upgrades-list">
                  {[
                    { key: 'damage', label: 'Plasma Cannon Damage', icon: '⚔️', base: activeHangarConfig.baseStats.damage, step: '+5 DMG' },
                    { key: 'fireRate', label: 'Weapon Fire Rate', icon: '⚡', base: `${activeHangarConfig.baseStats.fireRate} rps`, step: '+1.2 RPS' },
                    { key: 'health', label: 'Titanium Hull Armor', icon: '🛡️', base: `${activeHangarConfig.baseStats.health} HP`, step: '+20 HP' },
                    { key: 'speed', label: 'Sub-Light Thrusters', icon: '🚀', base: activeHangarConfig.baseStats.speed, step: '+0.8 SPD' },
                    { key: 'shield', label: 'Kinetic Shield Capacity', icon: '🔮', base: `${activeHangarConfig.baseStats.shield} SHD`, step: '+15 SHD' },
                  ].map(attr => {
                    const level = hangarUpgrades[attr.key] || 0;
                    const upgradeCost = (level + 1) * 350;
                    return (
                      <div key={attr.key} className="upgrade-row">
                        <div className="upgrade-info">
                          <span className="upgrade-icon">{attr.icon}</span>
                          <div>
                            <strong>{attr.label}</strong>
                            <small>Base: {attr.base} · Tier {level}/5</small>
                          </div>
                        </div>

                        {/* Level Pips */}
                        <div className="level-pips">
                          {[1, 2, 3, 4, 5].map(lvl => (
                            <span key={lvl} className={`pip ${lvl <= level ? 'filled' : ''}`}></span>
                          ))}
                        </div>

                        <button
                          className="upgrade-action-btn"
                          disabled={level >= 5 || playerData.credits < upgradeCost || !isHangarShipUnlocked}
                          onClick={() => handleUpgradeShip(attr.key)}
                        >
                          {level >= 5 ? 'MAX' : `UPGRADE (${upgradeCost} 🪙)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== 3. MISSIONS VIEW (50 DATA-DRIVEN MISSIONS GALAXY MAP) ==================== */}
        {currentTab === 'missions' && (
          <section className="missions-view-container">
            <div className="view-header">
              <h2>TACTICAL GALAXY CAMPAIGN (50 MISSIONS)</h2>
              <p>Navigate through 5 hostile cosmic sectors. Defeat planetary dreadnoughts and conquer the galaxy.</p>
            </div>

            {/* Sector Tabs */}
            <div className="sector-tabs-row">
              {SECTORS.map(sec => (
                <button
                  key={sec.id}
                  className={`sector-tab-btn ${selectedSectorId === sec.id ? 'active' : ''}`}
                  onClick={() => { soundManager.playSfx('uiClick'); setSelectedSectorId(sec.id); }}
                >
                  <span className="sector-tab-title">{sec.name}</span>
                  <small className="sector-tab-sub">Boss: {sec.bossName}</small>
                </button>
              ))}
            </div>

            {/* Missions 10-Grid for Selected Sector */}
            <div className="missions-grid">
              {currentSectorMissions.map(m => {
                const isUnlocked = m.id <= playerData.highestMissionUnlocked;
                const completed = playerData.completedMissions?.[m.id];
                const stars = completed?.stars || 0;

                return (
                  <div
                    key={m.id}
                    className={`mission-card ${!isUnlocked ? 'locked' : ''} ${m.boss ? 'boss-mission' : ''}`}
                  >
                    <div className="mission-card-top">
                      <span className="mission-id-tag">OPERATION #{m.id}</span>
                      <span className={`diff-pill ${m.difficulty.toLowerCase()}`}>{m.difficulty}</span>
                    </div>

                    <h4 className="mission-name">
                      {m.boss && '⚠️ '}
                      {m.name}
                    </h4>
                    <p className="mission-desc">{m.description}</p>

                    <div className="mission-objective-box">
                      <small>OBJECTIVE</small>
                      <span>{m.objective.label}</span>
                    </div>

                    <div className="mission-rewards-row">
                      <span>🪙 {m.rewards.credits}</span>
                      <span>⚡ {m.rewards.energyCores} Cores</span>
                      <span>+{m.rewards.xp} XP</span>
                    </div>

                    <div className="mission-footer">
                      <div className="stars-earned">
                        <span className={stars >= 1 ? 'star-gold' : 'star-dim'}>★</span>
                        <span className={stars >= 2 ? 'star-gold' : 'star-dim'}>★</span>
                        <span className={stars >= 3 ? 'star-gold' : 'star-dim'}>★</span>
                      </div>

                      {isUnlocked ? (
                        <button
                          className="mission-deploy-btn"
                          onClick={() => startMission(m)}
                        >
                          DEPLOY ▶
                        </button>
                      ) : (
                        <span className="mission-locked-label">🔒 LOCKED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* OPERATIONS CENTER MODAL (DAILY MISSIONS & 10 ACHIEVEMENTS) */}
      {showOpsModal && (
        <div className="app-modal-backdrop" onClick={() => setShowOpsModal(false)}>
          <div className="app-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>TACTICAL OPERATIONS CENTER</h2>
              <button className="modal-close-btn" onClick={() => setShowOpsModal(false)}>✕</button>
            </div>

            {/* Daily Missions */}
            <div className="modal-section">
              <h3>DAILY ASSIGNMENTS</h3>
              <div className="daily-missions-list">
                {playerData.dailyMissions.map(dm => (
                  <div key={dm.id} className="daily-mission-item">
                    <div>
                      <strong>{dm.text}</strong>
                      <small>Reward: +{dm.rewardCredits} Credits · +{dm.rewardCores} Cores</small>
                    </div>
                    <button
                      className="claim-mini-btn"
                      disabled={dm.completed}
                      onClick={() => {
                        soundManager.playSfx('powerup');
                        handleUpdatePlayerData({
                          credits: playerData.credits + dm.rewardCredits,
                          energyCores: playerData.energyCores + dm.rewardCores,
                          dailyMissions: playerData.dailyMissions.map(m => m.id === dm.id ? { ...m, completed: true } : m)
                        });
                      }}
                    >
                      {dm.completed ? 'COMPLETED ✓' : 'CLAIM'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 10 Achievements */}
            <div className="modal-section">
              <h3>PILOT ACHIEVEMENTS & BADGES</h3>
              <div className="achievements-scroll-list">
                {playerData.achievements.map(ach => (
                  <div key={ach.id} className="achievement-item">
                    <div className="ach-badge-icon">🎖️</div>
                    <div className="ach-details">
                      <strong>{ach.title}</strong>
                      <p>{ach.desc}</p>
                      <small>Reward: +{ach.reward} Credits</small>
                    </div>
                    <span className={`ach-status ${ach.unlocked ? 'unlocked' : 'pending'}`}>
                      {ach.unlocked ? 'CLAIMED ✓' : 'IN PROGRESS'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboardModal && (
        <div className="app-modal-backdrop" onClick={() => setShowLeaderboardModal(false)}>
          <div className="app-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>GALACTIC ACE LEADERBOARD</h2>
              <button className="modal-close-btn" onClick={() => setShowLeaderboardModal(false)}>✕</button>
            </div>

            <div className="leaderboard-table">
              <div className="leaderboard-row header">
                <span>RANK</span>
                <span>COMMANDER</span>
                <span>SECTOR</span>
                <span>SCORE</span>
              </div>
              {[
                { rank: 1, name: 'Commander Nova', sector: 'Sector 5: Void Citadel', score: 148500 },
                { rank: 2, name: 'Aegis Sentinel', sector: 'Sector 5: Void Citadel', score: 122800 },
                { rank: 3, name: 'Viper Pilot X', sector: 'Sector 4: Rift Territory', score: 98400 },
                { rank: 4, name: 'You (Ace Pilot)', sector: `Sector ${Math.ceil(playerData.highestMissionUnlocked / 10)}`, score: Object.values(playerData.completedMissions || {}).reduce((a, b) => a + (b.highScore || 0), 0) || 4500 },
                { rank: 5, name: 'Starlight Ghost', sector: 'Sector 3: Frozen Expanse', score: 76200 },
                { rank: 6, name: 'Cyber Dread', sector: 'Sector 2: Crimson Nebula', score: 54100 },
              ].map(entry => (
                <div key={entry.rank} className={`leaderboard-row ${entry.name.includes('You') ? 'current-player' : ''}`}>
                  <span className="rank-num">#{entry.rank}</span>
                  <span className="player-callsign">{entry.name}</span>
                  <span className="player-sector">{entry.sector}</span>
                  <span className="player-high-score">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
