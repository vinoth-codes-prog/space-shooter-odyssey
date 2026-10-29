import { useState } from 'react'
import Game from './Game'
import './App.css'


function App() {

  const [playing, setPlaying] = useState(false)

if (playing) {
  return <Game onBack={() => setPlaying(false)} />
}

  return (
    <main className="game-container">
      <header className="topbar">
        <div className="logo">
          <span className="logo-icon">✦</span>
          <span>SPACE<span className="highlight"> ODYSSEY</span></span>
        </div>

        <nav>
          <a className="active" href="#home">HOME</a>
          <a href="#hangar">HANGAR</a>
          <a href="#missions">MISSIONS</a>
          <a href="#profile">PROFILE</a>
        </nav>

        <div className="player-info">
          <span>🪙 2,500</span>
          <span>⚡ 100</span>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">✦ THE GALAXY NEEDS YOU ✦</p>

          <h1>
            SPACE
            <br />
            <span>SHOOTER</span>
            <br />
            ODYSSEY
          </h1>

          <p className="description">
            Pilot your ship. Defend the galaxy. Become a legend.
            Your journey across the stars starts here.
          </p>

          <div className="hero-buttons">
            <button
               className="primary-button"
               onClick={() => setPlaying(true)}
            >
               ▶ START MISSION
            </button>

            <button
              className="secondary-button"
              onClick={() => document.getElementById('hangar')?.scrollIntoView({
                behavior: 'smooth'
              })}
            >
              EXPLORE HANGAR
            </button>
          </div>

          <div className="stats">
            <div>
              <strong>50</strong>
              <span>MISSIONS</span>
            </div>
            <div>
              <strong>05</strong>
              <span>EPIC BOSSES</span>
            </div>
            <div>
              <strong>08</strong>
              <span>POWERUPS</span>
            </div>
          </div>
        </div>

        <div className="ship-display">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="planet"></div>
          <div className="ship">🚀</div>
          <div className="ship-label">
            <span className="status-dot"></span>
            MK-I STARFIGHTER
            <small>READY FOR DEPLOYMENT</small>
          </div>
        </div>
      </section>

      <section className="hangar-section" id="hangar">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHOOSE YOUR DESTINY</p>
            <h2>THE HANGAR</h2>
          </div>
          <span className="section-note">YOUR FLEET AWAITS</span>
        </div>

        <div className="ship-cards">
          <article className="ship-card selected">
            <span className="ship-number">01 / STARTER</span>
            <div className="card-ship">🚀</div>
            <h3>STARFIGHTER</h3>
            <p>Balanced speed and firepower.</p>
            <div className="ship-stats">
              <span>ARMOR <b>60</b></span>
              <span>SPEED <b>70</b></span>
            </div>
            <button className="card-button">SELECTED ✓</button>
          </article>

          <article className="ship-card">
            <span className="ship-number">02 / ASSAULT</span>
            <div className="card-ship">🛸</div>
            <h3>INTERCEPTOR</h3>
            <p>Fast and agile in combat.</p>
            <div className="ship-stats">
              <span>ARMOR <b>45</b></span>
              <span>SPEED <b>95</b></span>
            </div>
            <button className="card-button locked">🔒 LOCKED</button>
          </article>

          <article className="ship-card">
            <span className="ship-number">03 / HEAVY</span>
            <div className="card-ship">🚀</div>
            <h3>DESTROYER</h3>
            <p>Heavy armor and devastating power.</p>
            <div className="ship-stats">
              <span>ARMOR <b>95</b></span>
              <span>SPEED <b>40</b></span>
            </div>
            <button className="card-button locked">🔒 LOCKED</button>
          </article>
        </div>
      </section>

      <footer>
        <span>SPACE SHOOTER ODYSSEY</span>
        <span>EXPLORE THE UNKNOWN · DEFEND THE GALAXY</span>
      </footer>
    </main>
  )
}

export default App
