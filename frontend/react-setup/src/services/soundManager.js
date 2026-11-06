// Premium Sci-Fi Audio Manager
// Features audio file playback with Web Audio API synthetic fallback for 100% reliability

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.musicAudio = null;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.35;
    this.initialized = false;
    
    // File-based audio cache
    this.files = {
      shoot: "/audio/shoot.mpeg",
      enemyDestroy: "/audio/enemy-destroy.mpeg",
      playerHit: "/audio/player-hit.mpeg",
      bossHit: "/audio/boss-hit.mpeg",
      powerup: "/audio/powerup.mpeg",
      gameOver: "/audio/game-over.mpeg",
      victory: "/audio/victory.mpeg",
    };
    this.audioPool = {};
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
      // Pre-warm music
      this.musicAudio = new Audio("/audio/background-music.mpeg");
      this.musicAudio.loop = true;
      this.musicAudio.volume = this.musicVolume;
      this.initialized = true;
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  playMusic() {
    this.init();
    if (!this.musicEnabled || !this.musicAudio) return;
    this.musicAudio.volume = this.musicVolume;
    this.musicAudio.play().catch(() => {
      // Autoplay blocked until first gesture, normal in modern browsers
    });
  }

  pauseMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
    }
  }

  stopMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = enabled;
  }

  // Play named SFX with fallback to synthesized Web Audio
  playSfx(name) {
    if (!this.sfxEnabled) return;
    this.init();

    // Attempt file playback
    const src = this.files[name];
    if (src) {
      try {
        const audio = new Audio(src);
        audio.volume = Math.min(1, Math.max(0, this.sfxVolume));
        audio.play().catch(() => {
          // File failed or blocked; use synth
          this.playSynth(name);
        });
        return;
      } catch (err) {
        // Fallback to synth
      }
    }

    this.playSynth(name);
  }

  // High-performance procedural synthesizer
  playSynth(type) {
    if (!this.audioCtx || !this.sfxEnabled) return;
    try {
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      if (type === "shoot") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === "laserHeavy") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
        gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === "enemyDestroy") {
        // Noise buffer for explosion
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.sfxVolume * 0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === "powerup") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(780, now + 0.18);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.35);
        gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "shieldHit") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);
        gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "uiClick") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.05);
        gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {
      // Ignored
    }
  }
}

export const soundManager = new SoundManager();
