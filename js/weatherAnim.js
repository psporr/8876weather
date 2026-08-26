/**
 * Interactive Weather Canvas & Background Ambient Animations
 */

class WeatherBackgroundAnimator {
  constructor() {
    this.canvas = document.getElementById('weather-bg-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationFrameId = null;
    this.currentTheme = 'sunny';
    this.isDay = true;
    this.weatherCode = 0;

    this.resize = this.resize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.initParticles();
  }

  setWeather(weatherCode, isDay = 1) {
    this.weatherCode = weatherCode;
    this.isDay = isDay === 1;

    // Select theme name
    let themeClass = 'theme-sunny';

    if (!this.isDay) {
      if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
        themeClass = 'theme-night-rain';
      } else {
        themeClass = 'theme-night';
      }
    } else {
      if ([95, 96, 99].includes(weatherCode)) {
        themeClass = 'theme-thunderstorm';
      } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
        themeClass = 'theme-rain';
      } else if ([3, 45, 48].includes(weatherCode)) {
        themeClass = 'theme-overcast';
      } else if (weatherCode === 2) {
        themeClass = 'theme-partly-cloudy';
      } else if (weatherCode === 1) {
        themeClass = 'theme-mainly-clear';
      } else {
        themeClass = 'theme-sunny';
      }
    }

    // Apply class to body
    document.body.className = themeClass;
    this.currentTheme = themeClass;

    this.initParticles();
    if (!this.animationFrameId) {
      this.loop();
    }
  }

  initParticles() {
    this.particles = [];
    const count = this.getParticleCount();

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  getParticleCount() {
    if (this.currentTheme.includes('rain') || this.currentTheme.includes('thunderstorm')) {
      return Math.min(120, Math.floor(this.width / 12));
    }
    if (this.currentTheme.includes('night')) {
      return Math.min(80, Math.floor(this.width / 16));
    }
    if (this.currentTheme === 'theme-sunny' || this.currentTheme === 'theme-mainly-clear') {
      return 25; // Light sun dust particles
    }
    return 15;
  }

  createParticle() {
    const isRain = this.currentTheme.includes('rain') || this.currentTheme.includes('thunderstorm');
    const isNight = this.currentTheme.includes('night');

    if (isRain) {
      return {
        type: 'rain',
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: Math.random() * 20 + 15,
        speedY: Math.random() * 12 + 10,
        speedX: -2 - Math.random() * 2,
        opacity: Math.random() * 0.4 + 0.2,
        width: Math.random() * 1.5 + 0.8
      };
    }

    if (isNight) {
      return {
        type: 'star',
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.75),
        size: Math.random() * 2 + 0.8,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        opacity: Math.random() * 0.8 + 0.2,
        maxOpacity: Math.random() * 0.6 + 0.4,
        twinkleDirection: Math.random() > 0.5 ? 1 : -1
      };
    }

    // Sunny / warm dust specks / gentle light orbs
    return {
      type: 'sunbeam',
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: -Math.random() * 0.6 - 0.2,
      opacity: Math.random() * 0.35 + 0.1
    };
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (p.type === 'rain') {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
        this.ctx.strokeStyle = `rgba(180, 220, 255, ${p.opacity})`;
        this.ctx.lineWidth = p.width;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > this.height) {
          p.y = -p.length;
          p.x = Math.random() * (this.width + 100);
        }
        if (p.x < 0) {
          p.x = this.width;
        }
      } else if (p.type === 'star') {
        p.opacity += p.twinkleSpeed * p.twinkleDirection;
        if (p.opacity >= p.maxOpacity) {
          p.opacity = p.maxOpacity;
          p.twinkleDirection = -1;
        } else if (p.opacity <= 0.1) {
          p.opacity = 0.1;
          p.twinkleDirection = 1;
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      } else if (p.type === 'sunbeam') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 220, 130, ${p.opacity})`;
        this.ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) {
          p.y = this.height;
          p.x = Math.random() * this.width;
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}

export const weatherAnimator = new WeatherBackgroundAnimator();
