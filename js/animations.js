/* ============================================================
   ANIMATIONS.JS — звёзды, появление при скролле, параллакс, прогресс-бар
   ============================================================ */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Звёздное небо (canvas) ---------- */
  function initStars() {
    const canvas = document.getElementById('starsBg');
    if (!canvas || prefersReduced) return;

    const ctx = canvas.getContext('2d');
    let width, height, stars, shootingStars;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const STAR_COUNT = window.innerWidth < 768 ? 90 : 160;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      createStars();
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.3,
          alpha: Math.random() * 0.6 + 0.3,
          speed: Math.random() * 0.02 + 0.005,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() > 0.8 ? '#9fe9ff' : '#ffffff'
        });
      }
    }

    shootingStars = [];
    function maybeSpawnShootingStar() {
      if (prefersReduced) return;
      if (Math.random() < 0.004 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          len: Math.random() * 120 + 80,
          speed: Math.random() * 6 + 6,
          life: 1
        });
      }
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(now - last, 50) / 16.67;
      last = now;

      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        s.phase += s.speed * dt;
        const twinkle = 0.55 + Math.sin(s.phase) * 0.45;
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      maybeSpawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.speed * dt;
        ss.y += ss.speed * 0.45 * dt;
        ss.life -= 0.012 * dt;

        if (ss.life <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.len, ss.y - ss.len * 0.45);
        grad.addColorStop(0, `rgba(255,255,255,${ss.life})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.len, ss.y - ss.len * 0.45);
        ctx.stroke();
      }

      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
  }

  /* ---------- 2. Появление при скролле ---------- */
  function initReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if (prefersReduced || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    elements.forEach(el => observer.observe(el));
  }

  /* ---------- 3. Лёгкий параллакс ---------- */
  function initParallax() {
    if (prefersReduced) return;
    const visual = document.querySelector('.hero-visual');
    if (!visual) return;

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        visual.style.transform = `translateY(${Math.min(y * 0.06, 40)}px)`;
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 4. Прогресс-бар чтения ---------- */
  function initProgressBar() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;

    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = Math.min(percent, 100) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Запуск ---------- */
  function initAll() {
    initStars();
    initReveal();
    initParallax();
    initProgressBar();
  }

  document.addEventListener('content:ready', initReveal);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();