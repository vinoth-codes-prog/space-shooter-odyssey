
import { useEffect, useRef, useState } from 'react'
import './Game.css'

const WIDTH = 900
const HEIGHT = 560


const ENEMY_TYPES = {
  scout: {
    name: 'Scout',
    color: '#ff4d6d',
    health: 1,
    speed: 2.8,
    radius: 15,
    points: 100,
  },
  fighter: {
    name: 'Fighter',
    color: '#ff9f43',
    health: 2,
    speed: 2,
    radius: 20,
    points: 200,
  },
  tank: {
    name: 'Tank',
    color: '#a855f7',
    health: 4,
    speed: 1.2,
    radius: 27,
    points: 350,
  },
  interceptor: {
    name: 'Interceptor',
    color: '#45d9ff',
    health: 2,
    speed: 3.5,
    radius: 18,
    points: 250,
  },
  elite: {
    name: 'Elite',
    color: '#ffe45e',
    health: 5,
    speed: 1.8,
    radius: 30,
    points: 500,
  },
}


const POWERUP_TYPES = {
  rapidFire: {
    name: 'Rapid Fire',
    color: '#ffe45e',
    duration: 8000,
  },
  tripleShot: {
    name: 'Triple Shot',
    color: '#45d9ff',
    duration: 8000,
  },
  shield: {
    name: 'Shield',
    color: '#bc83ff',
    duration: 8000,
  },
  healthRestore: {
    name: 'Health Restore',
    color: '#4ade80',
    duration: 0,
  },
  extraLife: {
    name: 'Extra Life',
    color: '#ff4d6d',
    duration: 0,
  },
  damageBoost: {
    name: 'Damage Boost',
    color: '#ff8c42',
    duration: 8000,
  },
  bomb: {
    name: 'Bomb',
    color: '#ff245c',
    duration: 0,
  },
  slowMotion: {
    name: 'Slow Motion',
    color: '#60a5fa',
    duration: 8000,
  },
}



const BOSS_CONFIG = {
  name: 'VOID DESTROYER',
  color: '#ff245c',
  radius: 48,
  maxHealth: 100,
  speed: 1.5,
  points: 500,
}

const BOSS2_CONFIG = {
  name: 'SHADOW REAPER',
  color: '#bc83ff',
  radius: 55,
  maxHealth: 160,
  speed: 2.2,
  points: 800,
}


const BOSS3_CONFIG = {
  name: 'INFERNO TITAN',
  color: '#ff8c42',
  radius: 62,
  maxHealth: 220,
  speed: 1.8,
  points: 1200,
}


const BOSS4_CONFIG = {
  name: 'FROST COLOSSUS',
  color: '#45d9ff',
  radius: 68,
  maxHealth: 280,
  speed: 1.4,
  points: 1600,
}


const BOSS5_CONFIG = {
  name: 'GALACTIC OVERLORD',
  color: '#ffe45e',
  radius: 72,
  maxHealth: 350,
  speed: 2,
  points: 2500,
}


export default function Game({ onBack }) {
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(3)
  const [wave, setWave] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [victory, setVictory] = useState(false)
  const [restartKey, setRestartKey] = useState(0)
  const [activePowerupNames, setActivePowerupNames] = useState([])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const keys = {}

    const player = {
      x: WIDTH / 2,
      y: HEIGHT - 65,
    }

    let bullets = []
    let enemies = []
    let boss=null
    let powerups = []
    let activePowerups = {}
    let stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() * 2 + 1,
    }))

    let points = 0
    let lives = 3
    let currentWave = 1
    let spawned = 0
    let defeated = 0
    let bossWavesSpawned = []
    let frame = 0
    let lastShot = 0
    let running = true
    let animationId

    const maxWaves = 15

    function handleKeyDown(event) {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']
          .includes(event.key)
      ) {
        event.preventDefault()
      }

      keys[event.key.toLowerCase()] = true
    }

    function handleKeyUp(event) {
      keys[event.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    function drawShip(x, y) {
      ctx.save()
      ctx.translate(x, y)

      ctx.fillStyle = '#50e8ff'
      ctx.shadowColor = '#50e8ff'
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.moveTo(0, -22)
      ctx.lineTo(17, 17)
      ctx.lineTo(0, 9)
      ctx.lineTo(-17, 17)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(0, -12)
      ctx.lineTo(5, 5)
      ctx.lineTo(-5, 5)
      ctx.closePath()
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.fillStyle = '#ff9c43'
      ctx.beginPath()
      ctx.moveTo(-6, 16)
      ctx.lineTo(0, 25 + Math.random() * 5)
      ctx.lineTo(6, 16)
      ctx.fill()

      ctx.restore()
    }

    
function drawEnemy(enemy) {
  const config = ENEMY_TYPES[enemy.type]
  const radius = enemy.radius

  ctx.save()
  ctx.translate(enemy.x, enemy.y)
  ctx.fillStyle = config.color

  if (enemy.type === 'scout') {
    ctx.beginPath()
    ctx.moveTo(0, radius)
    ctx.lineTo(-radius, -radius)
    ctx.lineTo(radius, -radius)
    ctx.closePath()
    ctx.fill()
  } else if (enemy.type === 'fighter') {
    ctx.beginPath()
    ctx.moveTo(0, radius)
    ctx.lineTo(-radius, 0)
    ctx.lineTo(-radius * 0.6, -radius)
    ctx.lineTo(radius * 0.6, -radius)
    ctx.lineTo(radius, 0)
    ctx.closePath()
    ctx.fill()
  } else if (enemy.type === 'tank') {
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-radius / 2, -radius / 2, radius, radius)
  } else if (enemy.type === 'interceptor') {
    ctx.beginPath()
    ctx.moveTo(0, radius)
    ctx.lineTo(-radius * 0.5, 0)
    ctx.lineTo(-radius, -radius)
    ctx.lineTo(0, -radius * 0.5)
    ctx.lineTo(radius, -radius)
    ctx.lineTo(radius * 0.5, 0)
    ctx.closePath()
    ctx.fill()
  } else if (enemy.type === 'elite') {
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-radius * 0.5, -4, radius, 8)
  }

  ctx.restore()
}

function getBossConfig(boss) {
  if (boss.type === 'overlord') return BOSS5_CONFIG
  if (boss.type === 'frost') return BOSS4_CONFIG
  if (boss.type === 'titan') return BOSS3_CONFIG
  if (boss.type === 'shadow') return BOSS2_CONFIG

  return BOSS_CONFIG
}



function drawBoss(boss) {
  const config = getBossConfig(boss)
  const radius = config.radius

  ctx.save()
  ctx.translate(boss.x, boss.y)

  ctx.fillStyle = config.color
  ctx.beginPath()
  ctx.moveTo(0, radius)
  ctx.lineTo(-radius, -radius * 0.45)
  ctx.lineTo(-radius * 0.65, -radius * 0.8)
  ctx.lineTo(0, -radius * 0.4)
  ctx.lineTo(radius * 0.65, -radius * 0.8)
  ctx.lineTo(radius, -radius * 0.45)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#ffd166'
  ctx.fillRect(-8, -12, 16, 24)

  ctx.fillStyle = '#ff9db5'
  ctx.fillRect(-radius - 5, -10, 12, 25)
  ctx.fillRect(radius - 7, -10, 12, 25)

  ctx.restore()

  const barWidth = 220
  const barHeight = 12
  const barX = (WIDTH - barWidth) / 2
  const barY = 18
  const healthPercent = Math.max(0, boss.health / boss.maxHealth)

  ctx.fillStyle = '#35101c'
  ctx.fillRect(barX, barY, barWidth, barHeight)

  ctx.fillStyle = config.color
  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)

  ctx.strokeStyle = '#ffffff'
  ctx.strokeRect(barX, barY, barWidth, barHeight)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 13px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(
    `${config.name} — ${Math.ceil(boss.health)} HP`,
    WIDTH / 2,
    barY + 28
  )
}


function drawPowerup(powerup) {
  const config = POWERUP_TYPES[powerup.type]

  ctx.save()
  ctx.translate(powerup.x, powerup.y)

  ctx.fillStyle = config.color
  ctx.beginPath()
  ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#111827'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const symbols = {
    rapidFire: 'R',
    tripleShot: '3',
    shield: 'S',
    healthRestore: '+',
    extraLife: 'L',
    damageBoost: 'D',
    bomb: 'B',
    slowMotion: 'T',
  }

  ctx.fillText(symbols[powerup.type], 0, 0)
  ctx.restore()
}

function spawnEnemy() {
  const types = Object.keys(ENEMY_TYPES)

  const availableTypes =
    currentWave < 3
      ? ['scout', 'fighter']
      : currentWave < 6
        ? ['scout', 'fighter', 'tank']: types

  const type =
    availableTypes[Math.floor(Math.random() * availableTypes.length)]

  const config = ENEMY_TYPES[type]

  enemies.push({
    type,
    x: Math.random() * (WIDTH - config.radius * 2) + config.radius,
    y: -config.radius,
    health: config.health,
    maxHealth: config.health,
    speed: config.speed + currentWave * 0.1,
    radius: config.radius,
    points: config.points,
  })

  spawned++
}


function spawnPowerup(x, y) {
  const types = Object.keys(POWERUP_TYPES)
  const type = types[Math.floor(Math.random() * types.length)]

  powerups.push({
    type,
    x,
    y,
    radius: 12,
    speed: 1.5,
  })
}



function spawnBoss() {
  let config = BOSS_CONFIG
  let type = 'void'

  if (currentWave === 8) {
    config = BOSS3_CONFIG
    type = 'titan'
  } else if (currentWave === 9) {
    config = BOSS4_CONFIG
    type = 'frost'
  } else if (currentWave === 10) {
    config = BOSS2_CONFIG
    type = 'shadow'
  } else if (currentWave === 15) {
    config = BOSS5_CONFIG
    type = 'overlord'
  }

  boss = {
    type,
    x: WIDTH / 2,
    y: 100,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    direction: 1,
  }

  spawned = currentWave * 5
}




    function finishGame(won) {
      running = false
      setVictory(won)
      setGameOver(true)
    }

    function loop() {
      if (!running) return

      frame++

      const background = ctx.createLinearGradient(0, 0, 0, HEIGHT)
      background.addColorStop(0, '#090d22')
      background.addColorStop(1, '#030510')
      ctx.fillStyle = background
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      // Starfield
      ctx.fillStyle = '#d7eaff'

      stars.forEach((star) => {
        star.y += star.speed

        if (star.y > HEIGHT) {
          star.y = 0
          star.x = Math.random() * WIDTH
        }

        ctx.globalAlpha = 0.4 + star.speed / 4
        ctx.fillRect(star.x, star.y, star.size, star.size)
      })

      ctx.globalAlpha = 1

      // Player movement
      if (keys.arrowleft || keys.a) player.x -= 5
      if (keys.arrowright || keys.d) player.x += 5
      if (keys.arrowup || keys.w) player.y -= 5
      if (keys.arrowdown || keys.s) player.y += 5

      player.x = Math.max(22, Math.min(WIDTH - 22, player.x))
      player.y = Math.max(30, Math.min(HEIGHT - 30, player.y))

      // Shooting with power-up support
      const rapidFireActive =
        activePowerups.rapidFire > Date.now()

      const tripleShotActive =
        activePowerups.tripleShot > Date.now()

      const damageBoostActive =
        activePowerups.damageBoost > Date.now()

      const shotInterval = rapidFireActive ? 4 : 12

      if (keys[' '] && frame - lastShot > shotInterval) {
        const bulletDamage = damageBoostActive ? 20 : 10

        if (tripleShotActive) {
          bullets.push(
            {
              x: player.x - 12,
              y: player.y - 22,
              speed: 8,
              damage: bulletDamage,
            },
            {
              x: player.x,
              y: player.y - 22,
              speed: 8,
              damage: bulletDamage,
            },
            {
              x: player.x + 12,
              y: player.y - 22,
              speed: 8,
              damage: bulletDamage,
            }
          )
        } else {
          bullets.push({
            x: player.x,
            y: player.y - 22,
            speed: 8,
            damage: bulletDamage,
          })
        }

        lastShot = frame
      }


      bullets.forEach((bullet) => {
        bullet.y -= bullet.speed
        ctx.fillStyle = '#50e8ff'
        ctx.shadowColor = '#50e8ff'
        ctx.shadowBlur = 12
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 15)
      })

      ctx.shadowBlur = 0
      bullets = bullets.filter((bullet) => bullet.y > -20)

      // Spawn progressively more enemies
      const waveTarget = currentWave * 5
      

if (
  [5, 8, 9, 10, 15].includes(currentWave) &&
  !boss &&
  !bossWavesSpawned.includes(currentWave)
) {
  bossWavesSpawned.push(currentWave)
  spawnBoss()
}
const isBossWave = [5, 8, 9, 10, 15].includes(currentWave)
     const spawnInterval = Math.max(20, 55 - currentWave * 3)

      if (!isBossWave &&
          spawned < waveTarget &&
          frame % spawnInterval === 0
      ) {
        spawnEnemy()
      }

// Move and draw the boss

if (boss) {
  const config = getBossConfig(boss)

  boss.x += config.speed * boss.direction

  if (boss.x >= WIDTH - config.radius) {
    boss.direction = -1
  }

  if (boss.x <= config.radius) {
    boss.direction = 1
  }

  drawBoss(boss)
}


      // Move enemies, with Slow Motion support
      const slowMotionActive =
        activePowerups.slowMotion > Date.now()

      enemies.forEach((enemy) => {
        enemy.y += slowMotionActive
          ? enemy.speed * 0.4
          : enemy.speed

        drawEnemy(enemy)
      })



 // Move and draw power-ups
powerups.forEach((powerup) => {
  powerup.y += powerup.speed
  drawPowerup(powerup)
})

 // Remove power-ups that leave the screen
powerups = powerups.filter(
  (powerup) => powerup.y < HEIGHT + powerup.radius
)

      // Collect power-ups when the player touches them
      
powerups = powerups.filter((powerup) => {
  const collected =
    Math.abs(powerup.x - player.x) < powerup.radius + 15 &&
    Math.abs(powerup.y - player.y) < powerup.radius + 15

  if (!collected) return true

  const type = powerup.type

  if (type === 'healthRestore') {
    health = Math.min(health + 1, 3)
    setHealth(health)
  } else if (type === 'extraLife') {
    lives = Math.min(lives + 1, 5)
    setHealth(lives)
  } else if (type === 'bomb') {
    points += enemies.reduce(
      (total, enemy) =>
        total + (ENEMY_TYPES[enemy.type]?.points ?? 0),
      0
    )
    setScore(points)
    enemies = []
  } else if (POWERUP_TYPES[type]) {
    
activePowerups[type] =
  Date.now() + POWERUP_TYPES[type].duration

setActivePowerupNames(
  Object.keys(activePowerups)
    .filter((key) => activePowerups[key] > Date.now())
    .map((key) => POWERUP_TYPES[key].name)
)
  }

  return false
})

// boss collision block
if (boss) {
  const config = getBossConfig(boss)

  bullets = bullets.filter((bullet) => {
    const hitBoss =
      Math.abs(bullet.x - boss.x) < config.radius &&
      Math.abs(bullet.y - boss.y) < config.radius

    if (hitBoss) {
      boss.health -= bullet.damage ?? 10
      return false
    }

    return true
  })

  if (boss.health <= 0) {
    points += config.points
    setScore(points)
    boss = null
  }
}

      // Bullet collisions

      bullets = bullets.filter((bullet) => {
        const hitIndex = enemies.findIndex((enemy) => {
          const radius = enemy.radius

          return (
            Math.abs(bullet.x - enemy.x) < radius &&
            Math.abs(bullet.y - enemy.y) < radius
          )
        })

        if (hitIndex !== -1) {
          const enemy = enemies[hitIndex]
          enemy.health-=bullet.damage ?? 10

          
if (enemy.health <= 0) {
  points += ENEMY_TYPES[enemy.type].points

  if (Math.random() < 0.2) {
    spawnPowerup(enemy.x, enemy.y)
  }

  enemies.splice(hitIndex, 1)
  defeated++
  setScore(points)
}

          return false
        }

        return true
      })

      // Player collisions and missed enemies
      const remainingEnemies = []

      for (const enemy of enemies) {
        const radius = ENEMY_TYPES[enemy.type].radius

        const hitPlayer =
          Math.abs(enemy.x - player.x) < radius + 15 &&
          Math.abs(enemy.y - player.y) < radius + 15

        if (hitPlayer &&
          (activePowerups.shield ?? 0) <= Date.now()
        ) {
          lives--
          setHealth(lives)

          if (lives <= 0) {
            finishGame(false)
            return
          }
        } else if (enemy.y <= HEIGHT + radius) {
          remainingEnemies.push(enemy)
        }
      }

      enemies = remainingEnemies

      // Wave completed when all enemies have been spawned and defeated
      if (spawned >= waveTarget && enemies.length === 0 && !boss) {
        if (currentWave >= maxWaves) {
          finishGame(true)
          return
        }

        currentWave++
        spawned = 0
        defeated = 0
        setWave(currentWave)
      }

      drawShip(player.x, player.y)

      // In-game information
      ctx.fillStyle = '#50e8ff'
      ctx.font = '14px Arial'
      ctx.fillText('MOVE: WASD / ARROWS', 18, 28)
      ctx.fillText('SHOOT: SPACE', 18, 49)

      ctx.fillStyle = '#ffffff'
      ctx.fillText(`ENEMIES: ${defeated}/${waveTarget}`, WIDTH - 170, 28)

      animationId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      running = false
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [restartKey])

  return (
    <main className="game-screen">
      <header className="game-header">
        <button className="game-back" onClick={onBack}>
          ← HOME
        </button>

        <h2>MISSION 01: FIRST CONTACT</h2>

        <div className="game-hud">
          <span>SCORE: {score}</span>
          <span>WAVE: {wave}/15</span>
          <span>
            HULL: {'♥'.repeat(Math.min(3, Math.max(0, health)))}
            {'♡'.repeat(Math.max(0, 3 - health))}
          </span>
        </div>
      </header>
      

<div className="active-powerups">
  {activePowerupNames.map((name) => (
    <span className="powerup-badge" key={name}>
      {name}
    </span>
  ))}
</div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label="Space shooter game"
        />

        {gameOver && (
          <div className="game-over">
            <h2>{victory ? 'GALAXY SECURED!' : 'SHIP DESTROYED'}</h2>
            <p>{victory ? 'All 15 waves completed!' : 'Mission failed!'}</p>
            <p>Final score: {score}</p>

            <button
              onClick={() => {
                setScore(0)
                setHealth(3)
                setWave(1)
                setGameOver(false)
                setVictory(false)
                setRestartKey((value) => value + 1)
              }}
            >
              PLAY AGAIN
            </button>

            <button className="game-back" onClick={onBack}>
              BACK HOME
            </button>
          </div>
        )}
      </div>

      <p className="game-tip">
        Destroy enemies to advance. Scouts give 10 points, fighters 20,
        and tanks 40. Survive all 15 waves!
      </p>
    </main>
  )
}
