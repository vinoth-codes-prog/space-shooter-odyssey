
// High-End Textured Sprite & High-Impact VFX Canvas Rendering Engine

export class GameRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.spriteCache = {};
    this.initSprites();
  }

  initSprites() {
    const assets = {
      ship_interceptor: '/assets/player-ships/interceptor.svg',
      ship_striker: '/assets/player-ships/striker.svg',
      ship_guardian: '/assets/player-ships/guardian.svg',
      ship_support: '/assets/player-ships/support.svg',
      ship_experimental: '/assets/player-ships/experimental.svg',
      enemy_scout: '/assets/enemy-ships/scout.svg',
      enemy_fighter: '/assets/enemy-ships/fighter.svg',
      enemy_interceptor: '/assets/enemy-ships/interceptor.svg',
      enemy_tank: '/assets/enemy-ships/tank.svg',
      enemy_elite: '/assets/enemy-ships/elite.svg',
      boss_iron_warden: '/assets/bosses/iron-warden.svg',
      boss_nebula_serpent: '/assets/bosses/nebula-serpent.svg',
      boss_solar_devourer: '/assets/bosses/solar-devourer.svg',
      boss_rift_carrier: '/assets/bosses/rift-carrier.svg',
      boss_void_emperor: '/assets/bosses/void-emperor.svg',
    };

    Object.entries(assets).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      this.spriteCache[key] = img;
    });
  }

  drawBackground(width, height, stars, nebulas, time) {
    const ctx = this.ctx;
    ctx.fillStyle = '#04060f';
    ctx.fillRect(0, 0, width, height);

    nebulas.forEach(neb => {
      const grad = ctx.createRadialGradient(
        neb.x, neb.y, 10, neb.x, neb.y, neb.radius
      );
      grad.addColorStop(0, neb.color);
      grad.addColorStop(0.5, neb.midColor);
      grad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.globalAlpha = neb.alpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(neb.x, neb.y, neb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    stars.forEach(star => {
      const twinkle = Math.sin(time * 0.003 + star.phase) * 0.35 + 0.65;
      ctx.fillStyle = star.color || '#ffffff';
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  drawPlayerShip(ship, time, shipClass = 'interceptor', isInvulnerable = false) {
    const ctx = this.ctx;
    const { x, y, shieldActive, isBoosting } = ship;
    const size = 68;

    ctx.save();
    ctx.translate(x, y);

    if (isInvulnerable && Math.floor(time / 80) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    const flameH = isBoosting ? 38 + Math.random() * 12 : 24 + Math.random() * 8;
    const flameGrad = ctx.createLinearGradient(0, size * 0.28, 0, size * 0.28 + flameH);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.2, '#00e5ff');
    flameGrad.addColorStop(0.7, '#ff0077');
    flameGrad.addColorStop(1, 'transparent');

    [-14, 14].forEach(ox => {
      ctx.save();
      ctx.fillStyle = flameGrad;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(ox - 5, size * 0.28);
      ctx.lineTo(ox, size * 0.28 + flameH);
      ctx.lineTo(ox + 5, size * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    const img = this.spriteCache[`ship_${shipClass}`];

    if (img?.complete && img.naturalWidth > 0) {
      ctx.shadowColor = ship.color || '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = ship.color || '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (shieldActive) {
      const pulse = Math.sin(time * 0.008) * 4 + 48;
      const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, pulse);
      grad.addColorStop(0, 'rgba(0,229,255,0.05)');
      grad.addColorStop(0.8, 'rgba(0,229,255,0.45)');
      grad.addColorStop(1, 'rgba(255,255,255,0.9)');

      ctx.save();
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = 'rgba(0,229,255,0.85)';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawEnemy(enemy, time) {
    const ctx = this.ctx;
    const { x, y, type = 'scout', health, maxHealth, hitFlashUntil = 0 } = enemy;
    const size = type === 'elite' ? 56 : type === 'tank' ? 52 : 42;

    ctx.save();
    ctx.translate(x, y);

    const flashing = time < hitFlashUntil;
    const img = this.spriteCache[`enemy_${type}`];

    if (img?.complete && img.naturalWidth > 0) {
      ctx.shadowColor = flashing ? '#ffffff' : type === 'elite' ? '#ffd700' : '#ff0055';
      ctx.shadowBlur = flashing ? 24 : 14;
      ctx.filter = flashing ? 'brightness(300%)' : 'none';
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = flashing ? '#ffffff' : '#ff0055';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    if (maxHealth > 1) {
      const barW = size * 0.9;
      const ratio = Math.max(0, health / maxHealth);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-barW / 2, -size / 2 - 8, barW, 4);
      ctx.fillStyle = ratio > 0.5 ? '#2ed573' : ratio > 0.25 ? '#ffa502' : '#ff4757';
      ctx.fillRect(-barW / 2, -size / 2 - 8, barW * ratio, 4);
    }

    ctx.restore();
  }

  drawBoss(boss, time) {
    const ctx = this.ctx;
    const { x, y, bossType = 'iron_warden', attackCharging } = boss;
    const size = 140;

    ctx.save();
    ctx.translate(x, y);

    if (attackCharging) {
      const pulse = Math.sin(time * 0.02) * 15 + size * 0.5 + 15;
      ctx.strokeStyle = 'rgba(255,0,85,0.85)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,0,85,0.18)';
      ctx.fillRect(-35, 0, 70, 1400);
    }

    const img = this.spriteCache[`boss_${bossType}`];

    if (img?.complete && img.naturalWidth > 0) {
      ctx.shadowColor = bossType === 'void_emperor' ? '#ffd700' : '#ff0055';
      ctx.shadowBlur = 30;
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawProjectiles(bullets) {
    const ctx = this.ctx;

    bullets.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);

      if (b.isEnemy) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = b.color || '#ff3838';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius || 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'missile') {
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = '#ff6b81';
        ctx.shadowBlur = 12;
        ctx.fillRect(-3.5, -12, 7, 24);
      } else {
        const grad = ctx.createLinearGradient(0, -20, 0, 20);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, b.color || '#00e5ff');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.shadowColor = b.color || '#00e5ff';
        ctx.shadowBlur = 18;
        ctx.fillRect(-3.5, -20, 7, 40);
      }

      ctx.restore();
    });
  }

  drawMuzzleFlashes(flashes) {
    const ctx = this.ctx;

    flashes.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      const ratio = f.life / f.maxLife;
      const radius = (1 - ratio) * 14 + 6;
      ctx.globalAlpha = ratio;
      ctx.shadowColor = f.color || '#00e5ff';
      ctx.shadowBlur = 20;

      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, f.color || '#00e5ff');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawPowerups(powerups, time) {
    const ctx = this.ctx;

    powerups.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const offset = Math.sin(time * 0.005 + p.x) * 4;
      const pulse = Math.sin(time * 0.008) * 3 + 18;

      ctx.shadowColor = p.color || '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = p.color || '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, offset, pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(10,15,30,0.9)';
      ctx.beginPath();
      ctx.arc(0, offset, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.icon || '⚡', 0, offset);
      ctx.restore();
    });
  }

  drawParticles(particles) {
    const ctx = this.ctx;

    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;

      if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  drawFloatingTexts(texts) {
    const ctx = this.ctx;

    texts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = `900 ${t.size || 18}px 'Orbitron', sans-serif`;
      ctx.fillStyle = t.color || '#ffd32a';
      ctx.shadowColor = t.color || '#ffd32a';
      ctx.shadowBlur = 12;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }
}
