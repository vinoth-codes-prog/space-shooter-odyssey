import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Game.css';
import { GAME_NAME, SHIP_CLASSES, POWERUPS_CONFIG, ECONOMY_CONFIG } from './config/gameConfig';
import { GameRenderer } from './game/renderer';
import { soundManager } from './services/soundManager';

export default function Game({ mission, playerData, onUpdatePlayerData, onBack }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Game state
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [maxShield, setMaxShield] = useState(50);
  const [shieldActive, setShieldActive] = useState(false);
  const [wave, setWave] = useState(1);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [bossHp, setBossHp] = useState(null);
  const [bossMaxHp, setBossMaxHp] = useState(null);
  const [bossName, setBossName] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePowerups, setActivePowerups] = useState([]);
  const [specialCooldown, setSpecialCooldown] = useState(0);
  const [reviveAvailable, setReviveAvailable] = useState(true);
  const [adModal, setAdModal] = useState(null); // { type: 'revive'|'double_credits'|'double_score', countdown: 3 }
  const [missionStats, setMissionStats] = useState({ shotsFired: 0, shotsHit: 0, damageTaken: 0, startTime: Date.now() });

  // References for requestAnimationFrame loop
  const loopRef = useRef(null);
  const keysRef = useRef({});
  const touchStateRef = useRef({ active: false, x: 0, y: 0, isFiring: true });
  const gameEngineRef = useRef(null);

  // Selected ship details with upgrades applied
  const selectedShipId = playerData?.selectedShip || 'interceptor';
  const shipConfig = SHIP_CLASSES[selectedShipId] || SHIP_CLASSES.interceptor;
  const shipUpgrades = playerData?.shipUpgrades?.[selectedShipId] || { damage: 0, fireRate: 0, health: 0, speed: 0, shield: 0 };

  const effectiveHealth = shipConfig.baseStats.health + shipUpgrades.health * 20;
  const effectiveShield = shipConfig.baseStats.shield + shipUpgrades.shield * 15;
  const effectiveDamage = shipConfig.baseStats.damage + shipUpgrades.damage * 5;
  const effectiveSpeed = shipConfig.baseStats.speed + shipUpgrades.speed * 0.8;
  const effectiveFireRate = shipConfig.baseStats.fireRate + shipUpgrades.fireRate * 1.2;

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard and Visibility handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused(prev => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
      if (e.key === 'e' || e.key === 'E') {
        triggerSpecialAbility();
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Initialize and run Canvas Combat Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const renderer = new GameRenderer(ctx);

    // Setup Canvas dynamic sizing
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Engine entities
    const engine = {
      width: canvas.parentElement.clientWidth,
      height: canvas.parentElement.clientHeight,
      time: 0,
      lastShotTime: 0,
      shotsFired: 0,
      shotsHit: 0,
      damageTaken: 0,
      player: {
        x: canvas.parentElement.clientWidth / 2,
        y: canvas.parentElement.clientHeight - 80,
        vx: 0,
        vy: 0,
        invulnerableUntil: 0,
        shieldActive: false,
        shieldDurationEnd: 0,
        specialCooldownEnd: 0,
      },
      bullets: [],
      muzzleFlashes: [],
      screenShake: 0,
      enemies: [],
      boss: null,
      particles: [],
      floatingTexts: [],
      powerups: [],
      stars: Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.parentElement.clientWidth,
        y: Math.random() * canvas.parentElement.clientHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.8 ? '#00e5ff' : '#ffffff'
      })),
      nebulas: [
        { x: 150, y: 180, radius: 240, color: 'rgba(0, 229, 255, 0.12)', midColor: 'rgba(191, 85, 236, 0.06)', alpha: 0.8 },
        { x: canvas.parentElement.clientWidth - 180, y: 450, radius: 300, color: 'rgba(255, 0, 85, 0.10)', midColor: 'rgba(255, 165, 2, 0.05)', alpha: 0.7 }
      ],
      currentWave: 1,
      waveSpawnTimer: 0,
      spawnedInWave: 0,
      waveTarget: mission?.enemyCount ? Math.ceil(mission.enemyCount / (mission.waveCount || 3)) : 8,
      defeatedCount: 0,
      scoreValue: 0,
      playerHp: effectiveHealth,
      playerShield: effectiveShield,
      activeBuffs: {},
    };

    gameEngineRef.current = engine;
    setMaxHealth(effectiveHealth);
    setHealth(effectiveHealth);
    setMaxShield(effectiveShield);
    setShield(effectiveShield);

    // Audio theme start
    soundManager.playMusic();

    let animationFrameId;

    // Main Game Loop
    const renderLoop = (timestamp) => {
      engine.time = timestamp;
      const width = canvas.parentElement.clientWidth;
      const height = canvas.parentElement.clientHeight;
      engine.width = width;
      engine.height = height;

      if (!isPaused && !gameOver && !victory) {
        // --- 1. UPDATE PARALLAX BACKGROUND ---
        engine.stars.forEach(star => {
          star.y += star.speed;
          if (star.y > height) {
            star.y = 0;
            star.x = Math.random() * width;
          }
        });

        // --- 2. UPDATE PLAYER POSITION & CONTROLS ---
        const keys = keysRef.current;
        const touch = touchStateRef.current;
        let dx = 0;
        let dy = 0;

        if (keys['arrowleft'] || keys['a']) dx -= 1;
        if (keys['arrowright'] || keys['d']) dx += 1;
        if (keys['arrowup'] || keys['w']) dy -= 1;
        if (keys['arrowdown'] || keys['s']) dy += 1;

        if (touch.active) {
          const targetX = touch.x;
          const targetY = touch.y;
          const diffX = targetX - engine.player.x;
          const diffY = targetY - engine.player.y;
          if (Math.abs(diffX) > 4) dx = Math.sign(diffX);
          if (Math.abs(diffY) > 4) dy = Math.sign(diffY);
        }

        // Apply speed
        const speed = effectiveSpeed * (engine.activeBuffs.overdrive ? 1.4 : 1.0);
        engine.player.x += dx * speed;
        engine.player.y += dy * speed;

        // Keep inside bounds
        engine.player.x = Math.max(30, Math.min(width - 30, engine.player.x));
        engine.player.y = Math.max(50, Math.min(height - 40, engine.player.y));

        // Auto-firing / Spacebar / Touch fire
        const fireInterval = 1000 / (effectiveFireRate * (engine.activeBuffs.rapidFire ? 2.2 : 1.0));
        const shouldFire = keys[' '] || touch.isFiring || keys['enter'];

        if (shouldFire && timestamp - engine.lastShotTime > fireInterval) {
          engine.lastShotTime = timestamp;
          engine.shotsFired++;
          soundManager.playSfx('shoot');
          engine.screenShake = Math.max(engine.screenShake, 2.0);

          // Cannon tip muzzle flashes
          engine.muzzleFlashes.push({ x: engine.player.x - 14, y: engine.player.y - 24, color: shipConfig.color || '#00e5ff', life: 5, maxLife: 5 });
          engine.muzzleFlashes.push({ x: engine.player.x + 14, y: engine.player.y - 24, color: shipConfig.color || '#00e5ff', life: 5, maxLife: 5 });

          const bulletDamage = effectiveDamage * (engine.activeBuffs.overdrive ? 2.0 : 1.0);

          if (engine.activeBuffs.spreadShot) {
            // 5-way spread shot
            [-0.3, -0.15, 0, 0.15, 0.3].forEach(angle => {
              engine.bullets.push({
                x: engine.player.x,
                y: engine.player.y - 20,
                vx: Math.sin(angle) * 12,
                vy: -Math.cos(angle) * 12,
                damage: bulletDamage * 0.75,
                color: '#ff9f43',
                isEnemy: false
              });
            });
          } else if (engine.activeBuffs.homingMissiles) {
            // Homing missiles
            engine.bullets.push({
              x: engine.player.x - 14,
              y: engine.player.y - 10,
              vx: -2,
              vy: -10,
              damage: bulletDamage * 1.5,
              type: 'missile',
              isEnemy: false
            });
            engine.bullets.push({
              x: engine.player.x + 14,
              y: engine.player.y - 10,
              vx: 2,
              vy: -10,
              damage: bulletDamage * 1.5,
              type: 'missile',
              isEnemy: false
            });
          } else {
            // Dual laser cannons
            engine.bullets.push({
              x: engine.player.x - 12,
              y: engine.player.y - 16,
              vx: 0,
              vy: -14,
              damage: bulletDamage,
              color: shipConfig.color,
              isEnemy: false
            });
            engine.bullets.push({
              x: engine.player.x + 12,
              y: engine.player.y - 16,
              vx: 0,
              vy: -14,
              damage: bulletDamage,
              color: shipConfig.color,
              isEnemy: false
            });
          }
        }

        // --- 3. WAVE SPAWNING & BOSS LOGIC ---
        if (mission?.boss && !engine.boss && engine.currentWave >= (mission.waveCount || 3)) {
          // Spawn sector boss with multi-phase health
          const bHp = 1400 + mission.id * 200;
          engine.boss = {
            x: width / 2,
            y: 110,
            targetX: width / 2,
            radius: 70,
            bossType: mission.bossType || 'iron_warden',
            health: bHp,
            maxHealth: bHp,
            speed: 2.2,
            dir: 1,
            lastAttackTime: timestamp,
            attackCharging: false,
            phase: 1
          };
          setBossHp(bHp);
          setBossMaxHp(bHp);
          setBossName(mission.bossName || 'Armada Boss');
          soundManager.playSfx('powerup');
        } else if (!engine.boss) {
          // Tactical Squadron Wave Spawning
          engine.waveSpawnTimer += 16;
          if (engine.waveSpawnTimer > 1100 && engine.spawnedInWave < engine.waveTarget) {
            engine.waveSpawnTimer = 0;
            const squadSize = Math.min(3, engine.waveTarget - engine.spawnedInWave);
            engine.spawnedInWave += squadSize;

            const allowed = mission?.allowedEnemies || ['scout'];
            const type = allowed[Math.floor(Math.random() * allowed.length)];
            const hp = type === 'elite' ? 10 : type === 'tank' ? 6 : type === 'fighter' ? 3 : 2;

            const squadCenterX = Math.random() * (width - 180) + 90;
            for (let si = 0; si < squadSize; si++) {
              const offsetX = (si - (squadSize - 1) / 2) * 48;
              engine.enemies.push({
                x: squadCenterX + offsetX,
                y: -35 - Math.abs(offsetX) * 0.4,
                baseX: squadCenterX + offsetX,
                phase: Math.random() * Math.PI * 2,
                swoopSpeed: 0.003 + Math.random() * 0.002,
                swoopAmp: 25 + Math.random() * 20,
                vy: 1.6 + Math.random() * 0.6,
                type,
                radius: type === 'elite' ? 26 : type === 'tank' ? 24 : 18,
                health: hp,
                maxHealth: hp,
                lastFire: timestamp + 600 + Math.random() * 1000
              });
            }
          }

          // Check if wave cleared
          if (engine.spawnedInWave >= engine.waveTarget && engine.enemies.length === 0) {
            if (engine.currentWave < (mission?.waveCount || 3)) {
              engine.currentWave++;
              engine.spawnedInWave = 0;
              setWave(engine.currentWave);
              engine.floatingTexts.push({
                x: width / 2,
                y: height / 2 - 40,
                text: `WAVE ${engine.currentWave}`,
                color: '#00e5ff',
                size: 28,
                life: 65,
                maxLife: 65
              });
            } else if (!mission?.boss) {
              // Mission Victory!
              setVictory(true);
              soundManager.playSfx('victory');
            }
          }
        }

        // --- 4. UPDATE BOSS ---
        if (engine.boss) {
          const b = engine.boss;
          b.x += b.speed * b.dir;
          if (b.x < b.radius + 30) b.dir = 1;
          if (b.x > width - b.radius - 30) b.dir = -1;

          // Boss attack patterns
          if (timestamp - b.lastAttackTime > 2200) {
            b.lastAttackTime = timestamp;
            b.attackCharging = true;

            setTimeout(() => {
              if (!engine.boss) return;
              b.attackCharging = false;
              soundManager.playSfx('laserHeavy');

              // Boss bullet spreads
              for (let i = -3; i <= 3; i++) {
                engine.bullets.push({
                  x: b.x,
                  y: b.y + b.radius,
                  vx: i * 2.2,
                  vy: 6.5,
                  radius: 7,
                  color: '#ff0055',
                  damage: 25,
                  isEnemy: true
                });
              }
            }, 600);
          }
        }

        // --- 5. UPDATE ENEMIES ---
        for (let i = engine.enemies.length - 1; i >= 0; i--) {
          const e = engine.enemies[i];
          if (e.baseX !== undefined) {
            e.x = e.baseX + Math.sin(timestamp * e.swoopSpeed + e.phase) * e.swoopAmp;
          } else {
            e.x += e.vx;
          }
          e.y += e.vy;

          if (e.x < 30) e.x = 30;
          if (e.x > width - 30) e.x = width - 30;

          // Enemy firing
          if (timestamp - e.lastFire > 2000) {
            e.lastFire = timestamp + Math.random() * 1000;
            engine.bullets.push({
              x: e.x,
              y: e.y + e.radius,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 5.5,
              radius: 5,
              color: '#ff4757',
              damage: 15,
              isEnemy: true
            });
          }

          // Off screen removal
          if (e.y > height + 40) {
            engine.enemies.splice(i, 1);
          }
        }

        // --- 6. UPDATE BULLETS & HOMING ---
        for (let i = engine.bullets.length - 1; i >= 0; i--) {
          const b = engine.bullets[i];

          // Homing logic towards nearest enemy
          if (b.type === 'missile' && engine.enemies.length > 0) {
            const target = engine.boss || engine.enemies[0];
            const angle = Math.atan2(target.y - b.y, target.x - b.x);
            b.vx += Math.cos(angle) * 0.8;
            b.vy += Math.sin(angle) * 0.8;
          }

          b.x += b.vx;
          b.y += b.vy;

          // Out of screen bounds
          if (b.y < -30 || b.y > height + 30 || b.x < -30 || b.x > width + 30) {
            engine.bullets.splice(i, 1);
          }
        }

        // --- 7. COLLISION DETECTION ---
        // Player Bullets hitting Enemies
        for (let bi = engine.bullets.length - 1; bi >= 0; bi--) {
          const b = engine.bullets[bi];
          if (b.isEnemy) continue;

          // Hitting regular enemies
          for (let ei = engine.enemies.length - 1; ei >= 0; ei--) {
            const e = engine.enemies[ei];
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if (dist < e.radius + 6) {
              e.health -= b.damage;
              e.hitFlashUntil = timestamp + 110;
              engine.shotsHit++;
              engine.bullets.splice(bi, 1);
              engine.screenShake = Math.max(engine.screenShake, 3.5);

              // High-impact electrical sparks
              for (let s = 0; s < 6; s++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 5 + 2;
                engine.particles.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  color: '#ffd32a',
                  type: 'spark',
                  life: 14,
                  maxLife: 14
                });
              }

              if (e.health <= 0) {
                // Enemy destroyed
                engine.enemies.splice(ei, 1);
                engine.defeatedCount++;

                // Dynamic Combo calculation
                if (timestamp - (engine.lastKillTime || 0) < 2500) {
                  engine.combo = Math.min(8, (engine.combo || 1) + 1);
                } else {
                  engine.combo = 1;
                }
                engine.lastKillTime = timestamp;

                const basePts = e.type === 'elite' ? 350 : e.type === 'tank' ? 200 : 100;
                const pts = basePts * engine.combo;
                engine.scoreValue += pts;
                setScore(engine.scoreValue);
                setEnemiesDefeated(engine.defeatedCount);
                soundManager.playSfx('enemyDestroy');

                // Explosion & floating score
                createExplosion(engine, e.x, e.y, '#ff4757', 24, true);
                engine.floatingTexts.push({
                  x: e.x,
                  y: e.y,
                  text: engine.combo > 1 ? `+${pts} (${engine.combo}x COMBO!)` : `+${pts}`,
                  color: engine.combo > 1 ? '#ffd700' : '#ffffff',
                  size: engine.combo > 1 ? 22 : 18,
                  life: 50,
                  maxLife: 50
                });

                // Powerup drop chance (18%)
                if (Math.random() < 0.22) {
                  const pKeys = Object.keys(POWERUPS_CONFIG);
                  const pId = pKeys[Math.floor(Math.random() * pKeys.length)];
                  const pCfg = POWERUPS_CONFIG[pId];
                  engine.powerups.push({
                    x: e.x,
                    y: e.y,
                    id: pId,
                    icon: pCfg.icon,
                    color: pCfg.color,
                    duration: pCfg.duration
                  });
                }
              }
              break;
            }
          }

          // Hitting Boss
          if (engine.boss && bi < engine.bullets.length) {
            const boss = engine.boss;
            const dist = Math.hypot(b.x - boss.x, b.y - boss.y);
            if (dist < boss.radius + 10) {
              boss.health -= b.damage;
              boss.hitFlashUntil = timestamp + 110;
              engine.shotsHit++;
              engine.bullets.splice(bi, 1);
              engine.screenShake = Math.max(engine.screenShake, 4.0);
              setBossHp(Math.max(0, boss.health));
              createExplosion(engine, b.x, b.y, '#ff0055', 8, false);

              if (boss.health <= 0) {
                // Boss Defeated!
                createExplosion(engine, boss.x, boss.y, '#ffd700', 60, true);
                engine.scoreValue += 2500;
                setScore(engine.scoreValue);
                engine.boss = null;
                setBossHp(0);
                soundManager.playSfx('victory');
                setTimeout(() => setVictory(true), 1200);
              }
            }
          }
        }

        // Enemy Bullets hitting Player
        const isInvulnerable = timestamp < engine.player.invulnerableUntil;
        if (!isInvulnerable) {
          for (let bi = engine.bullets.length - 1; bi >= 0; bi--) {
            const b = engine.bullets[bi];
            if (!b.isEnemy) continue;

            const dist = Math.hypot(b.x - engine.player.x, b.y - engine.player.y);
            if (dist < 26) {
              engine.bullets.splice(bi, 1);
              takeDamage(engine, b.damage || 20, timestamp);
              break;
            }
          }

          // Player colliding with enemies
          for (let ei = engine.enemies.length - 1; ei >= 0; ei--) {
            const e = engine.enemies[ei];
            const dist = Math.hypot(e.x - engine.player.x, e.y - engine.player.y);
            if (dist < e.radius + 20) {
              takeDamage(engine, 30, timestamp);
              engine.enemies.splice(ei, 1);
              createExplosion(engine, e.x, e.y, '#ff4757', 18, true);
              break;
            }
          }
        }

        // --- 8. COLLECTING POWER-UPS ---
        for (let pi = engine.powerups.length - 1; pi >= 0; pi--) {
          const p = engine.powerups[pi];
          p.y += 1.8;

          // Magnet towards player if close
          const distToPlayer = Math.hypot(p.x - engine.player.x, p.y - engine.player.y);
          if (distToPlayer < 140) {
            p.x += (engine.player.x - p.x) * 0.08;
            p.y += (engine.player.y - p.y) * 0.08;
          }

          if (distToPlayer < 36) {
            // Collected!
            soundManager.playSfx('powerup');
            applyPowerup(engine, p.id, timestamp);
            engine.floatingTexts.push({
              x: engine.player.x,
              y: engine.player.y - 30,
              text: POWERUPS_CONFIG[p.id]?.name || 'POWER-UP!',
              color: p.color,
              size: 20,
              life: 50,
              maxLife: 50
            });
            engine.powerups.splice(pi, 1);
          } else if (p.y > height + 30) {
            engine.powerups.splice(pi, 1);
          }
        }

        // --- 9. UPDATE PARTICLES & TEXTS ---
        for (let i = engine.muzzleFlashes.length - 1; i >= 0; i--) {
          engine.muzzleFlashes[i].life--;
          if (engine.muzzleFlashes[i].life <= 0) engine.muzzleFlashes.splice(i, 1);
        }

        for (let i = engine.particles.length - 1; i >= 0; i--) {
          const pt = engine.particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.life--;
          if (pt.type === 'shockwave') pt.radius += 3.5;
          if (pt.life <= 0) engine.particles.splice(i, 1);
        }

        for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
          const ft = engine.floatingTexts[i];
          ft.y -= 1.0;
          ft.life--;
          if (ft.life <= 0) engine.floatingTexts.splice(i, 1);
        }

        // Check powerup expiration
        Object.keys(engine.activeBuffs).forEach(key => {
          if (engine.activeBuffs[key] && timestamp > engine.activeBuffs[key]) {
            delete engine.activeBuffs[key];
            updateActivePowerupUI(engine);
          }
        });

        if (engine.player.shieldActive && timestamp > engine.player.shieldDurationEnd) {
          engine.player.shieldActive = false;
          setShieldActive(false);
        }
      }

      // --- 10. RENDER FRAME ---
      ctx.clearRect(0, 0, width, height);

      // Screen Shake translation
      ctx.save();
      if (engine.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * engine.screenShake;
        const shakeY = (Math.random() - 0.5) * engine.screenShake;
        ctx.translate(shakeX, shakeY);
        engine.screenShake *= 0.88;
        if (engine.screenShake < 0.2) engine.screenShake = 0;
      }

      renderer.drawBackground(width, height, engine.stars, engine.nebulas, engine.time, mission?.sectorId);
      renderer.drawPowerups(engine.powerups, engine.time);
      renderer.drawProjectiles(engine.bullets);
      renderer.drawMuzzleFlashes(engine.muzzleFlashes);
      renderer.drawParticles(engine.particles);

      engine.enemies.forEach(e => renderer.drawEnemy(e, engine.time));
      if (engine.boss) renderer.drawBoss(engine.boss, engine.time);

      const isInvuln = timestamp < engine.player.invulnerableUntil;
      renderer.drawPlayerShip(
        { ...engine.player, color: shipConfig.color, accentColor: shipConfig.accentColor, shieldActive: engine.player.shieldActive },
        engine.time,
        shipConfig.id,
        isInvuln
      );

      renderer.drawFloatingTexts(engine.floatingTexts);
      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      soundManager.pauseMusic();
    };
  }, [mission, isPaused, gameOver, victory, effectiveDamage, effectiveFireRate, effectiveHealth, effectiveShield, effectiveSpeed, shipConfig]);

  // Helper: Damage Application with Shield Absorption
  const takeDamage = (engine, dmg, timestamp) => {
    if (engine.player.shieldActive) {
      soundManager.playSfx('shieldHit');
      engine.floatingTexts.push({ x: engine.player.x, y: engine.player.y - 20, text: 'SHIELD BLOCK', color: '#00e5ff', size: 16, life: 30, maxLife: 30 });
      return;
    }

    soundManager.playSfx('playerHit');
    engine.player.invulnerableUntil = timestamp + 1400; // 1.4s immunity window
    engine.damageTaken += dmg;

    // Absorb into shield first if available
    if (engine.playerShield > 0) {
      const absorbed = Math.min(engine.playerShield, dmg);
      engine.playerShield -= absorbed;
      dmg -= absorbed;
      setShield(Math.max(0, engine.playerShield));
    }

    if (dmg > 0) {
      engine.playerHp -= dmg;
      setHealth(Math.max(0, engine.playerHp));
    }

    createExplosion(engine, engine.player.x, engine.player.y, '#ff4757', 15, false);

    if (engine.playerHp <= 0) {
      soundManager.playSfx('gameOver');
      setGameOver(true);
    }
  };

  // Helper: Particle Explosion Generation
  const createExplosion = (engine, x, y, color, count, shockwave = false) => {
    if (shockwave) {
      engine.particles.push({ x, y, radius: 10, color, type: 'shockwave', life: 25, maxLife: 25, vx: 0, vy: 0 });
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 1.5;
      engine.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 3 + 1,
        color,
        life: 30 + Math.random() * 20,
        maxLife: 50
      });
    }
  };

  // Helper: Apply Power-Up effect
  const applyPowerup = (engine, id, timestamp) => {
    const cfg = POWERUPS_CONFIG[id];
    if (!cfg) return;

    if (id === 'shieldPulse') {
      engine.player.shieldActive = true;
      engine.player.shieldDurationEnd = timestamp + cfg.duration;
      setShieldActive(true);
    } else if (id === 'repairDrone') {
      engine.playerHp = Math.min(effectiveHealth, engine.playerHp + 45);
      setHealth(engine.playerHp);
    } else if (id === 'empBlast') {
      // Clear all hostile bullets
      engine.bullets = engine.bullets.filter(b => !b.isEnemy);
      createExplosion(engine, engine.width / 2, engine.height / 2, '#a55eea', 40, true);
    } else if (id === 'emergencyWarp') {
      engine.player.x = engine.width / 2;
      engine.player.y = engine.height - 80;
      engine.player.invulnerableUntil = timestamp + 2500;
      createExplosion(engine, engine.player.x, engine.player.y, '#1e90ff', 25, true);
    } else {
      // Timed buffs: rapidFire, spreadShot, homingMissiles, overdrive
      engine.activeBuffs[id] = timestamp + cfg.duration;
    }
    updateActivePowerupUI(engine);
  };

  const updateActivePowerupUI = (engine) => {
    const list = Object.keys(engine.activeBuffs).map(k => ({
      id: k,
      name: POWERUPS_CONFIG[k]?.name,
      icon: POWERUPS_CONFIG[k]?.icon,
      color: POWERUPS_CONFIG[k]?.color
    }));
    setActivePowerups(list);
  };

  // Special Ship Ability Trigger
  const triggerSpecialAbility = () => {
    const engine = gameEngineRef.current;
    if (!engine || Date.now() < engine.player.specialCooldownEnd) return;

    engine.player.specialCooldownEnd = Date.now() + shipConfig.baseStats.specialCd * 1000;
    setSpecialCooldown(shipConfig.baseStats.specialCd);

    // Cooldown ticker
    const timer = setInterval(() => {
      setSpecialCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    soundManager.playSfx('powerup');
    engine.floatingTexts.push({
      x: engine.player.x,
      y: engine.player.y - 40,
      text: shipConfig.specialName.toUpperCase(),
      color: shipConfig.color,
      size: 22,
      life: 50,
      maxLife: 50
    });

    if (selectedShipId === 'guardian') {
      applyPowerup(engine, 'shieldPulse', engine.time);
    } else if (selectedShipId === 'striker') {
      applyPowerup(engine, 'homingMissiles', engine.time);
    } else if (selectedShipId === 'support') {
      applyPowerup(engine, 'repairDrone', engine.time);
      applyPowerup(engine, 'empBlast', engine.time);
    } else if (selectedShipId === 'experimental') {
      applyPowerup(engine, 'overdrive', engine.time);
      applyPowerup(engine, 'spreadShot', engine.time);
    } else {
      // Interceptor hyper dash
      engine.player.invulnerableUntil = engine.time + 3000;
      applyPowerup(engine, 'rapidFire', engine.time);
    }
  };

  // Rewarded Ad Simulation (Per VELoop Specification)
  const handleWatchAd = (type) => {
    setAdModal({ type, countdown: 4 });
    const interval = setInterval(() => {
      setAdModal(prev => {
        if (!prev) return null;
        if (prev.countdown <= 1) {
          clearInterval(interval);
          grantAdReward(type);
          return null;
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  const grantAdReward = (type) => {
    soundManager.playSfx('victory');
    if (type === 'revive') {
      const engine = gameEngineRef.current;
      if (engine) {
        engine.playerHp = effectiveHealth;
        engine.player.invulnerableUntil = engine.time + 3000;
        setHealth(effectiveHealth);
        setGameOver(false);
        setReviveAvailable(false);
      }
    } else if (type === 'double_credits') {
      const bonus = (mission?.rewards?.credits || 150) * 2;
      onUpdatePlayerData({ credits: (playerData?.credits || 0) + bonus });
      alert(`🎉 2X REWARD GRANTED! Received ${bonus} Credits.`);
    } else if (type === 'double_score') {
      setScore(prev => prev * 2);
      alert(`🎉 2X SCORE APPLIED! New High Score recorded.`);
    }
  };

  // Complete Mission and persist rewards
  const handleClaimVictory = () => {
    const accuracy = missionStats.shotsFired > 0 
      ? Math.round((missionStats.shotsHit / missionStats.shotsFired) * 100) 
      : 100;
    
    // Calculate Stars
    let starsEarned = 1;
    if (accuracy >= 65 || health >= maxHealth * 0.6) starsEarned = 2;
    if (accuracy >= 80 && health >= maxHealth * 0.8) starsEarned = 3;

    const baseCredits = mission?.rewards?.credits || 120;
    const baseCores = mission?.rewards?.energyCores || 0;
    const baseXp = mission?.rewards?.xp || 75;

    const newCredits = (playerData?.credits || 0) + baseCredits;
    const newCores = (playerData?.energyCores || 0) + baseCores;
    const newXp = (playerData?.xp || 0) + baseXp;
    const nextMissionUnlock = Math.max(playerData?.highestMissionUnlocked || 1, (mission?.id || 1) + 1);

    const completed = {
      ...(playerData?.completedMissions || {}),
      [mission.id]: {
        stars: Math.max(starsEarned, playerData?.completedMissions?.[mission.id]?.stars || 0),
        highScore: Math.max(score, playerData?.completedMissions?.[mission.id]?.highScore || 0)
      }
    };

    onUpdatePlayerData({
      credits: newCredits,
      energyCores: newCores,
      xp: newXp,
      highestMissionUnlocked: nextMissionUnlock,
      completedMissions: completed
    });

    onBack();
  };

  return (
    <div className={`game-viewport ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={containerRef}>
      {/* Immersive Sci-Fi Canvas */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onPointerDown={(e) => {
          const rect = canvasRef.current.getBoundingClientRect();
          touchStateRef.current = {
            active: true,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            isFiring: true
          };
        }}
        onPointerMove={(e) => {
          if (!touchStateRef.current.active) return;
          const rect = canvasRef.current.getBoundingClientRect();
          touchStateRef.current.x = e.clientX - rect.left;
          touchStateRef.current.y = e.clientY - rect.top;
        }}
        onPointerUp={() => {
          touchStateRef.current.active = false;
        }}
      />

      {/* Futuristic Holographic HUD Overlay */}
      <header className="game-hud-overlay">
        <div className="hud-left">
          <button className="hud-icon-btn" onClick={onBack} title="Abandon Mission">
            ◀ EXIT
          </button>
          <div className="hud-mission-info">
            <span className="hud-mission-tag">M-{mission?.id || 1}</span>
            <span className="hud-mission-title">{mission?.name || 'SECTOR PATROL'}</span>
          </div>
        </div>

        <div className="hud-center">
          {/* Boss Health Bar if Active */}
          {bossHp !== null && bossHp > 0 && (
            <div className="hud-boss-bar-container">
              <div className="boss-title">⚠️ {bossName} ⚠️</div>
              <div className="boss-bar-track">
                <div 
                  className="boss-bar-fill" 
                  style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Vitals: Health & Kinetic Shield */}
          <div className="hud-vitals">
            <div className="vital-group">
              <span className="vital-label">HULL</span>
              <div className="vital-bar-track health-track">
                <div 
                  className="vital-bar-fill health-fill" 
                  style={{ width: `${Math.max(0, (health / maxHealth) * 100)}%` }}
                />
              </div>
              <span className="vital-num">{Math.round(health)}/{maxHealth}</span>
            </div>

            <div className="vital-group">
              <span className="vital-label">SHIELD</span>
              <div className="vital-bar-track shield-track">
                <div 
                  className="vital-bar-fill shield-fill" 
                  style={{ width: `${Math.max(0, (shield / maxShield) * 100)}%` }}
                />
              </div>
              <span className="vital-num">{Math.round(shield)}/{maxShield}</span>
            </div>
          </div>
        </div>

        <div className="hud-right">
          <div className="hud-score-display">
            <small>SCORE</small>
            <span>{score.toLocaleString()}</span>
          </div>

          <div className="hud-actions">
            <button className="hud-icon-btn" onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? '▶' : '⏸'}
            </button>
            <button className="hud-icon-btn" onClick={toggleFullscreen}>
              {isFullscreen ? '🗗' : '⛶'}
            </button>
          </div>
        </div>
      </header>

      {/* Active Power-up Status Badges */}
      <div className="active-powerups-ribbon">
        {activePowerups.map((p, idx) => (
          <div key={idx} className="powerup-badge" style={{ borderColor: p.color }}>
            <span className="powerup-badge-icon">{p.icon}</span>
            <span className="powerup-badge-name">{p.name}</span>
          </div>
        ))}
        {shieldActive && (
          <div className="powerup-badge" style={{ borderColor: '#00e5ff' }}>
            <span className="powerup-badge-icon">🛡️</span>
            <span className="powerup-badge-name">INVULNERABLE</span>
          </div>
        )}
      </div>

      {/* Mobile On-Screen Action Touch Controls */}
      <div className="mobile-touch-hud">
        <button 
          className={`touch-ability-btn ${specialCooldown > 0 ? 'cooling' : ''}`}
          onClick={triggerSpecialAbility}
          disabled={specialCooldown > 0}
        >
          <span className="ability-icon">⚡</span>
          <span className="ability-text">
            {specialCooldown > 0 ? `${specialCooldown}s` : shipConfig.specialName}
          </span>
        </button>

        <button 
          className="touch-fire-toggle-btn"
          onClick={() => {
            touchStateRef.current.isFiring = !touchStateRef.current.isFiring;
          }}
        >
          {touchStateRef.current.isFiring ? 'AUTO-FIRE ON' : 'FIRE OFF'}
        </button>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && (
        <div className="game-overlay-backdrop">
          <div className="sci-fi-dialog">
            <h2>SYSTEM PAUSED</h2>
            <p>TACTICAL RECONNAISSANCE SUSPENDED</p>
            <div className="dialog-buttons">
              <button className="dialog-btn primary" onClick={() => setIsPaused(false)}>RESUME MISSION</button>
              <button className="dialog-btn" onClick={toggleFullscreen}>TOGGLE FULLSCREEN</button>
              <button className="dialog-btn danger" onClick={onBack}>ABANDON TO HANGAR</button>
            </div>
          </div>
        </div>
      )}

      {/* MISSION FAILED / GAME OVER MODAL WITH REWARDED AD REVIVE */}
      {gameOver && (
        <div className="game-overlay-backdrop">
          <div className="sci-fi-dialog failed">
            <div className="dialog-header-glow red">CRITICAL FAILURE</div>
            <h2>VESSEL DESTROYED</h2>
            <p>Hull integrity compromised in {mission?.name || 'Sector'}.</p>
            <div className="dialog-stats-summary">
              <div>SCORE: <b>{score.toLocaleString()}</b></div>
              <div>ENEMIES DESTROYED: <b>{enemiesDefeated}</b></div>
            </div>

            <div className="dialog-buttons">
              {reviveAvailable && (
                <button className="dialog-btn special-ad-btn" onClick={() => handleWatchAd('revive')}>
                  📺 WATCH AD & REVIVE AT CHECKPOINT (100% HP)
                </button>
              )}
              <button className="dialog-btn primary" onClick={() => window.location.reload()}>
                RESTART MISSION
              </button>
              <button className="dialog-btn" onClick={onBack}>
                RETURN TO HANGAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MISSION VICTORY MODAL WITH REWARDED AD MULTIPLIERS */}
      {victory && (
        <div className="game-overlay-backdrop">
          <div className="sci-fi-dialog victory">
            <div className="dialog-header-glow green">MISSION ACCOMPLISHED</div>
            <h2>SECTOR SECURED</h2>
            
            <div className="stars-row">
              <span className="star-glow">★</span>
              <span className="star-glow">★</span>
              <span className="star-glow">★</span>
            </div>

            <div className="dialog-stats-summary">
              <div>FINAL COMBAT SCORE: <b>{score.toLocaleString()}</b></div>
              <div>BASE CREDITS EARNED: <b>+{mission?.rewards?.credits || 120}</b></div>
              <div>EXPERIENCE (XP): <b>+{mission?.rewards?.xp || 75} XP</b></div>
              {mission?.rewards?.energyCores > 0 && (
                <div>ENERGY CORES: <b>+{mission.rewards.energyCores} ⚡</b></div>
              )}
            </div>

            <div className="dialog-buttons">
              <button className="dialog-btn special-ad-btn" onClick={() => handleWatchAd('double_credits')}>
                📺 WATCH AD → DOUBLE CREDITS (2X)
              </button>
              <button className="dialog-btn special-ad-btn" onClick={() => handleWatchAd('double_score')}>
                📺 WATCH AD → DOUBLE SCORE (2X)
              </button>
              <button className="dialog-btn primary" onClick={handleClaimVictory}>
                CLAIM REWARDS & CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATED VELOOP REWARDED AD MODAL */}
      {adModal && (
        <div className="ad-sim-backdrop">
          <div className="ad-sim-box">
            <div className="ad-sim-top">
              <span className="ad-sponsored-tag">SPONSORED REWARD AD</span>
              <span className="ad-countdown">Reward in: {adModal.countdown}s</span>
            </div>
            <div className="ad-sim-content">
              <h3>VELoop Rewards Network</h3>
              <p>Simulating premium high-engagement video advertisement playback...</p>
              <div className="ad-spinner"></div>
            </div>
            <div className="ad-sim-footer">
              <small>VELoop authoritative ad verification in progress...</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
