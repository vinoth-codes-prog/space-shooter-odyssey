import React, { useEffect, useRef } from 'react';
import { SHIP_CLASSES } from '../config/gameConfig';

export default function ShipPreview({ shipId, size = 180 }) {
  const canvasRef = useRef(null);
  const shipConfig = SHIP_CLASSES[shipId] || SHIP_CLASSES.interceptor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    const img = new Image();
    img.src = `/assets/player-ships/${shipId}.svg`;

    const render = () => {
      time += 16;
      ctx.clearRect(0, 0, size, size);

      // Deep radial glow matching ship theme
      const glow = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size * 0.45);
      glow.addColorStop(0, `${shipConfig.color}35`);
      glow.addColorStop(0.7, `${shipConfig.color}10`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Animated Thruster Plume underneath
      const flameH = 24 + Math.sin(time * 0.02) * 8;
      const flameGrad = ctx.createLinearGradient(0, size * 0.72, 0, size * 0.72 + flameH);
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, shipConfig.color || '#00e5ff');
      flameGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.fillStyle = flameGrad;
      ctx.shadowColor = shipConfig.color || '#00e5ff';
      ctx.shadowBlur = 16;
      [-14, 14].forEach(ox => {
        ctx.beginPath();
        ctx.moveTo(size / 2 + ox - 5, size * 0.72);
        ctx.lineTo(size / 2 + ox, size * 0.72 + flameH);
        ctx.lineTo(size / 2 + ox + 5, size * 0.72);
        ctx.closePath();
        ctx.fill();
      });
      ctx.restore();

      // Draw Textured High-Res Spacecraft Sprite
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.shadowColor = shipConfig.color || '#00e5ff';
        ctx.shadowBlur = 20;
        const shipSize = size * 0.75;
        ctx.drawImage(img, (size - shipSize) / 2, (size - shipSize) / 2 - 6, shipSize, shipSize);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationId);
  }, [shipId, size, shipConfig]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        display: 'block',
        margin: '0 auto',
        filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.4))'
      }}
    />
  );
}
