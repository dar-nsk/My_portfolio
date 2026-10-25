/* ============================================================
   main.js  –  Natural Light Canvas engine + UI interactions
   Portfolio of Darshana Mahajan
   ============================================================ */

/* ----------------------------------------------------------
   SECTION 1 — CANVAS ANIMATION: NaturalLightCanvas class
   (ported from the natural-light reference, targeting #ambient-canvas)
   ---------------------------------------------------------- */

/**
 * Natural Light Canvas Physics Engine
 * Modes:
 * 1. Silky Ether Waves: Multi-layered sine wave silk ribbon mesh with soft light gradients.
 * 2. Organic Sun Bokeh: Drifting soft-edge warm translucent light spheres with collision bounce.
 * 3. Floating Sun Micro-Pollen: Floating micro-particles reacting to cursor displacement with light glow.
 * 4. Interactive Ripples: Smooth water-like displacement shockwaves on click.
 */
class NaturalLightCanvas {
  constructor() {
    this.canvas = document.getElementById('ambient-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mouse = {
      x: this.width / 2,
      y: this.height / 2,
      targetX: this.width / 2,
      targetY: this.height / 2,
      active: false
    };

    this.config = {
      mode: 'waves',      // 'waves', 'bokeh', 'pollen'
      palette: 'sunset',  // 'sunset', 'sage', 'dawn', 'warmth'
      speed: 1.0,
      blur: 40,
      rippleSensitivity: 1.5,
      density: 60
    };

    // Natural Pastel Color Palettes
    this.palettes = {
      sunset: {
        bg: '#F8F6F0',
        grad1: 'rgba(255, 234, 167, 0.45)', // Warm Sunlight
        grad2: 'rgba(255, 204, 204, 0.35)', // Peach
        grad3: 'rgba(216, 235, 211, 0.35)', // Sage
        particles: ['#E8A598', '#7A8B7B', '#F3D2A2', '#C88A75']
      },
      sage: {
        bg: '#F5F7F4',
        grad1: 'rgba(200, 225, 205, 0.45)',
        grad2: 'rgba(220, 235, 225, 0.35)',
        grad3: 'rgba(245, 230, 210, 0.35)',
        particles: ['#7A8B7B', '#A2B9A5', '#D8CEBE', '#8E9F8F']
      },
      dawn: {
        bg: '#F6F7FA',
        grad1: 'rgba(224, 235, 255, 0.45)',
        grad2: 'rgba(240, 225, 245, 0.35)',
        grad3: 'rgba(255, 235, 230, 0.35)',
        particles: ['#9BB1D6', '#CDB4DB', '#FFC8DD', '#BDE0FE']
      },
      warmth: {
        bg: '#FAF7F2',
        grad1: 'rgba(255, 220, 190, 0.45)',
        grad2: 'rgba(245, 200, 180, 0.35)',
        grad3: 'rgba(250, 235, 200, 0.35)',
        particles: ['#D4A373', '#FAEDCD', '#E9EDC9', '#CCD5AE']
      }
    };

    // Canvas Stores
    this.particles = [];
    this.bokehs = [];
    this.ripples = [];
    this.time = 0;

    this.lastTime = performance.now();
    this.fps = 60;

    this.init();
  }

  init() {
    this.resize();
    this.initEntities();
    this.bindEvents();
    this.loop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.initEntities();
  }

  initEntities() {
    const colors = this.palettes[this.config.palette].particles;

    // 1. Pollen Micro-Particles
    this.particles = [];
    for (let i = 0; i < this.config.density; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 3.5 + 1.5,
        color: colors[i % colors.length],
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    // 2. Glowing Organic Bokeh Spheres
    this.bokehs = [];
    for (let i = 0; i < 16; i++) {
      this.bokehs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 120 + 80,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
      this.mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    // Click ripples fire on any click anywhere (canvas has pointer-events:none),
    // so content stays clickable while window-level listeners still create ripples.
    window.addEventListener('click', (e) => {
      this.ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 180 * this.config.rippleSensitivity,
        alpha: 0.8,
        color: this.palettes[this.config.palette].particles[0]
      });
    });
  }

  updateMouse() {
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.1;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.1;
  }

  // 1. Render Silky Ether Waves
  renderWaves() {
    const currentPalette = this.palettes[this.config.palette];
    const waveCount = 5;

    for (let w = 0; w < waveCount; w++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height);

      const waveHeight = this.height * 0.45 + w * 45;
      const frequency = 0.002 + w * 0.0008;
      const speedOffset = this.time * 0.015 * this.config.speed * (w % 2 === 0 ? 1 : -1);

      for (let x = 0; x <= this.width; x += 15) {
        // Math Sine Organic Wave Combination
        let y = Math.sin(x * frequency + speedOffset) * 40;
        y += Math.cos(x * 0.001 + speedOffset * 0.8) * 25;

        // Mouse Proximity Distortion
        if (this.mouse.active) {
          const dx = x - this.mouse.x;
          const dy = (waveHeight + y) - this.mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 220) {
            const push = (220 - dist) / 220;
            y += Math.sin(dist * 0.05) * push * 35 * this.config.rippleSensitivity;
          }
        }

        this.ctx.lineTo(x, waveHeight + y);
      }

      this.ctx.lineTo(this.width, this.height);
      this.ctx.closePath();

      // Wave Gradient Fill
      const grad = this.ctx.createLinearGradient(0, waveHeight - 100, this.width, this.height);
      if (w === 0) grad.addColorStop(0, currentPalette.grad1);
      else if (w === 1) grad.addColorStop(0, currentPalette.grad2);
      else grad.addColorStop(0, currentPalette.grad3);

      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.fill();
    }
  }

  // 2. Render Organic Sun Bokeh
  renderBokeh() {
    this.bokehs.forEach(b => {
      b.x += b.vx * this.config.speed;
      b.y += b.vy * this.config.speed;

      // Bounce
      if (b.x < -100 || b.x > this.width + 100) b.vx *= -1;
      if (b.y < -100 || b.y > this.height + 100) b.vy *= -1;

      b.phase += 0.02 * this.config.speed;
      const dynamicRadius = b.radius + Math.sin(b.phase) * 15;

      const grad = this.ctx.createRadialGradient(
        b.x, b.y, 0,
        b.x, b.y, dynamicRadius
      );
      grad.addColorStop(0, b.color + '66');
      grad.addColorStop(0.6, b.color + '22');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, dynamicRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = grad;
      this.ctx.fill();
    });
  }

  // 3. Render Floating Sun Micro-Pollen
  renderPollen() {
    this.particles.forEach(p => {
      p.x += p.vx * this.config.speed;
      p.y += p.vy * this.config.speed;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse Attraction Displacement
      if (this.mouse.active) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.x -= (dx / dist) * force * 3 * this.config.rippleSensitivity;
          p.y -= (dy / dist) * force * 3 * this.config.rippleSensitivity;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });
  }

  // Render Interactive Water Ripples
  renderRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 3 * this.config.speed;
      r.alpha -= 0.015;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = r.color;
      this.ctx.globalAlpha = r.alpha;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
    }
  }

  // Main Frame Loop
  loop() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.fps = Math.round(1000 / delta);
    this.lastTime = now;

    const fpsMeter = document.getElementById('fpsMeter');
    if (fpsMeter) fpsMeter.textContent = `${this.fps} FPS`;

    this.time += 1;
    this.updateMouse();

    // Clear Frame
    const currentPalette = this.palettes[this.config.palette];
    this.ctx.fillStyle = currentPalette.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render Selected Mode
    switch (this.config.mode) {
      case 'waves':
        this.renderWaves();
        this.renderPollen();
        break;
      case 'bokeh':
        this.renderBokeh();
        break;
      case 'pollen':
        this.renderPollen();
        break;
    }

    // Always Render Ripples
    this.renderRipples();

    requestAnimationFrame(() => this.loop());
  }

  setMode(mode) {
    this.config.mode = mode;
  }

  setPalette(palette) {
    if (this.palettes[palette]) {
      this.config.palette = palette;
      this.initEntities();
    }
  }
}

/* Wires the floating + inline controls to the engine (mirrors the reference). */
function initLightControls(engine) {
  if (!engine || !engine.canvas) return;

  // --- Light Deck Drawer toggle ---
  const lightDeck = document.getElementById('lightDeck');
  const toggleDeckBtn = document.getElementById('toggleLightDeck');
  const closeDeckBtn = document.getElementById('closeLightDeck');

  const toggleDeck = () => {
    if (!lightDeck) return;
    const isHidden = lightDeck.classList.contains('translate-x-[120%]');
    if (isHidden) {
      lightDeck.classList.remove('translate-x-[120%]', 'opacity-0');
      lightDeck.classList.add('translate-x-0', 'opacity-100');
    } else {
      lightDeck.classList.add('translate-x-[120%]', 'opacity-0');
      lightDeck.classList.remove('translate-x-0', 'opacity-100');
    }
  };

  if (toggleDeckBtn) toggleDeckBtn.addEventListener('click', toggleDeck);
  if (closeDeckBtn) closeDeckBtn.addEventListener('click', toggleDeck);

  // --- Mode selector buttons (floating dock + inline lab) ---
  const modeBtns = document.querySelectorAll('.mode-btn, .lab-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.dataset.mode;
      engine.setMode(mode);

      modeBtns.forEach(b => {
        if (b.dataset.mode === mode) {
          b.classList.add('text-stone-800');
          b.classList.remove('text-stone-400', 'text-stone-500');
        } else {
          b.classList.remove('text-stone-800');
          b.classList.add('text-stone-400');
        }
      });
    });
  });

  // --- Palette buttons ---
  const paletteBtns = document.querySelectorAll('.palette-btn');
  paletteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const palette = e.currentTarget.dataset.palette;
      engine.setPalette(palette);

      // Remove both the JS-toggled ring classes AND the initial -active class
      // so the active indicator moves cleanly instead of accumulating on the
      // first (sunset) button, since CSS styles .palette-btn-active and
      // .palette-btn.ring-2 with the same ring.
      paletteBtns.forEach(b => b.classList.remove('ring-2', 'ring-stone-800', 'palette-btn-active'));
      e.currentTarget.classList.add('ring-2', 'ring-stone-800', 'palette-btn-active');
    });
  });

  // --- Sliders synchronizer ---
  const speedSlider = document.getElementById('speedSlider');
  const blurSlider = document.getElementById('blurSlider');
  const rippleSlider = document.getElementById('rippleSlider');
  const densitySlider = document.getElementById('densitySlider');

  const labSpeed = document.getElementById('labSpeed');
  const labDensity = document.getElementById('labDensity');
  const labRipple = document.getElementById('labRipple');

  const syncSliders = () => {
    const speed = parseFloat(speedSlider.value);
    const blur = parseInt(blurSlider.value);
    const ripple = parseFloat(rippleSlider.value);
    const den = parseInt(densitySlider.value);

    const speedVal = document.getElementById('speedVal');
    const blurVal = document.getElementById('blurVal');
    const rippleVal = document.getElementById('rippleVal');
    const densityVal = document.getElementById('densityVal');
    if (speedVal) speedVal.textContent = speed.toFixed(1) + 'x';
    if (blurVal) blurVal.textContent = blur + 'px';
    if (rippleVal) rippleVal.textContent = ripple.toFixed(1);
    if (densityVal) densityVal.textContent = den;

    engine.config.speed = speed;
    engine.config.rippleSensitivity = ripple;

    if (engine.config.density !== den) {
      engine.config.density = den;
      engine.initEntities();
    }
  };

  if (speedSlider) speedSlider.addEventListener('input', syncSliders);
  if (blurSlider) blurSlider.addEventListener('input', syncSliders);
  if (rippleSlider) rippleSlider.addEventListener('input', syncSliders);
  if (densitySlider) densitySlider.addEventListener('input', syncSliders);

  if (labSpeed) labSpeed.addEventListener('input', (e) => { speedSlider.value = e.target.value; syncSliders(); });
  if (labDensity) labDensity.addEventListener('input', (e) => { densitySlider.value = e.target.value; syncSliders(); });
  if (labRipple) labRipple.addEventListener('input', (e) => { rippleSlider.value = e.target.value; syncSliders(); });
}

/* ----------------------------------------------------------
   SECTION 2 — TYPING ANIMATION
   ---------------------------------------------------------- */

function initTypingAnimation() {
  const el = document.getElementById('typed-tagline');
  if (!el) return;

  // Create text node container + blinking cursor span
  const textSpan   = document.createElement('span');
  const cursorSpan = document.createElement('span');
  cursorSpan.classList.add('typing-cursor');
  cursorSpan.textContent = '|';

  el.textContent = '';
  el.appendChild(textSpan);
  el.appendChild(cursorSpan);

  // Inject cursor blink CSS once
  if (!document.getElementById('typing-cursor-style')) {
    const style = document.createElement('style');
    style.id = 'typing-cursor-style';
    style.textContent = `
      .typing-cursor {
        display: inline-block;
        margin-left: 2px;
        animation: cursorBlink 0.7s step-end infinite;
        color: inherit;
      }
      @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const strings      = [
    'Computer Engineering Student',
    'Full-Stack Developer',
    'AI/ML Enthusiast',
    'Problem Solver | Builder',
  ];

  let  stringIndex   = 0;
  let  charIndex     = 0;
  let  isDeleting    = false;
  const TYPE_SPEED   = 60;
  const DELETE_SPEED = 30;
  const PAUSE_MS     = 2000;

  function tick() {
    const current = strings[stringIndex];

    if (!isDeleting) {
      // Typing
      charIndex++;
      textSpan.textContent = current.slice(0, charIndex);

      if (charIndex === current.length) {
        // Finished typing — pause then delete
        isDeleting = true;
        setTimeout(tick, PAUSE_MS);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      // Deleting
      charIndex--;
      textSpan.textContent = current.slice(0, charIndex);

      if (charIndex === 0) {
        // Finished deleting — move to next string
        isDeleting   = false;
        stringIndex  = (stringIndex + 1) % strings.length;
        setTimeout(tick, TYPE_SPEED);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  setTimeout(tick, TYPE_SPEED);
}

/* ----------------------------------------------------------
   SECTION 3 — NAVBAR BEHAVIOR
   ---------------------------------------------------------- */

function initNavbar() {
  const nav          = document.querySelector('nav');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks     = document.querySelector('.nav-links');

  if (!nav) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;

    // Scrolled class (background / shadow)
    if (currentY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    // Hide on scroll down, reveal on scroll up
    if (currentY > lastScrollY && currentY > 100) {
      nav.classList.add('nav-hidden');
    } else {
      nav.classList.remove('nav-hidden');
    }

    lastScrollY = currentY;
  });

  // Hamburger toggle (supports both #hamburger and #hamburger-btn ids)
  const hamburger = document.getElementById('hamburger') || hamburgerBtn;
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
  }

  // Close mobile menu when any nav link is clicked
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (hamburger) hamburger.classList.remove('open');
      });
    });
  }
}

/* ----------------------------------------------------------
   SECTION 4 — INTERSECTION OBSERVER (fade-in)
   ---------------------------------------------------------- */

function initFadeIn() {
  // Inject base CSS
  if (!document.getElementById('fade-in-style')) {
    const style = document.createElement('style');
    style.id    = 'fade-in-style';
    style.textContent = `
      .fade-in {
        opacity: 0;
        transform: translateY(32px);
        transition: opacity 0.7s ease, transform 0.7s ease;
      }
      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/* ----------------------------------------------------------
   SECTION 5 — SMOOTH SCROLL
   ---------------------------------------------------------- */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ----------------------------------------------------------
   SECTION 6 — SKILLS PROGRESS BARS
   ---------------------------------------------------------- */

function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill[data-width]');
  if (!bars.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.width = el.dataset.width;
        observer.unobserve(el); // animate once
      }
    });
  }, { threshold: 0.1 });

  bars.forEach(bar => {
    bar.style.width = '0%'; // reset before animating
    observer.observe(bar);
  });
}

/* ----------------------------------------------------------
   SECTION 7 — SCROLL-TO-TOP BUTTON
   (repositioned to bottom-center so it never collides with
    the bottom-right mode dock of the light controls)
   ---------------------------------------------------------- */

function initScrollTopButton() {
  // Inject CSS — bottom-center to avoid the mode-dock collision
  if (!document.getElementById('scroll-top-style')) {
    const style = document.createElement('style');
    style.id    = 'scroll-top-style';
    style.textContent = `
      #scroll-top {
        position: fixed;
        bottom: 1.5rem;
        left: 50%;
        transform: translate(-50%, 0) scale(0.8);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #2D312E;
        color: #fff;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0 6px 22px rgba(45, 49, 46, 0.3);
      }
      #scroll-top.visible {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
      #scroll-top:hover {
        background: #3a403b;
        box-shadow: 0 10px 28px rgba(45, 49, 46, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  // Create button
  const btn  = document.createElement('button');
  btn.id     = 'scroll-top';
  btn.textContent = '↑';
  btn.setAttribute('aria-label', 'Scroll to top');
  document.body.appendChild(btn);

  // Show / hide on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  // Click handler
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ----------------------------------------------------------
   SECTION 8 — ACTIVE NAV LINK
   ---------------------------------------------------------- */

function initActiveNav() {
  const sections  = document.querySelectorAll('section[id], div[id]');
  const navAnchors = document.querySelectorAll('nav a[href^="#"]');

  if (!sections.length || !navAnchors.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          if (a.getAttribute('href') === '#' + id) {
            a.classList.add('active');
          } else {
            a.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(sec => observer.observe(sec));
}

/* ----------------------------------------------------------
   SECTION 9 — DOMContentLoaded bootstrap
   ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  initTypingAnimation();
  initNavbar();
  initSkillBars();

  // Additional UI initializations
  initFadeIn();
  initScrollTopButton();
  initSmoothScroll();
  initActiveNav();
});

/* ----------------------------------------------------------
   SECTION 10 — Natural Light canvas engine (on window load)
   ---------------------------------------------------------- */
window.addEventListener('load', () => {
  const engine = new NaturalLightCanvas();
  initLightControls(engine);
});
