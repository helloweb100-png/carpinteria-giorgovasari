/* =====================================================================
   Taller artesanal de carpintería «Giorgio Vasari» · Chipilo, Puebla
   Interacciones: cargador, revelados al scroll, hero con partículas y 3D,
   carrusel fijado, imagen que se abre, plano animado, galería 3D, WhatsApp.
   Todo es JavaScript sin dependencias; anime.js (CDN) es opcional y la
   página se ve completa aunque no cargue.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     CONFIGURACIÓN · Número de WhatsApp del taller.
     Formato: 52 + 10 dígitos (sin +, sin espacios). Es la ÚNICA fuente
     del número: todos los enlaces y el formulario salen de aquí.
     Si queda vacío, el botón y el envío se ocultan solos.
     --------------------------------------------------------------- */
  const WHATSAPP_NUMERO = '522227664645';
  const MENSAJE_BASE = 'Hola, vi la página del taller Giorgio Vasari y me gustaría platicar sobre un mueble.';

  /* ---------- Utilidades ---------- */
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.warn('[taller]', e); } };

  root.classList.add('app');

  /** Estado de scroll compartido y lista de módulos que se actualizan en cada cuadro. */
  const S = { y: window.scrollY || 0, lastY: window.scrollY || 0, dy: 0, vy: 0 };
  const loops = [];

  /** Interpolación numérica: usa anime.js si cargó; si no, un tween propio. */
  const EASE = {
    easeOutExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    easeInOutQuad: (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3)
  };
  function tween({ from = 0, to = 1, duration = 1200, ease = 'easeOutExpo', update, done }) {
    if (reduceMotion || duration <= 0) { update(to); if (done) done(); return; }
    if (typeof window.anime === 'function') {
      const o = { v: from };
      window.anime({
        targets: o, v: to, duration, easing: ease,
        update: () => update(o.v),
        complete: () => { update(to); if (done) done(); }
      });
      return;
    }
    const fn = EASE[ease] || EASE.easeOutExpo;
    const t0 = performance.now();
    (function step(now) {
      const t = clamp((now - t0) / duration);
      update(lerp(from, to, fn(t)));
      if (t < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }

  /* ---------- WhatsApp ---------- */
  function waUrl(mensaje) {
    return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje || MENSAJE_BASE);
  }

  function initWhatsApp() {
    const links = $$('[data-wa]');
    const form = $('#form-contacto');
    if (!WHATSAPP_NUMERO) {
      links.forEach((a) => { a.hidden = true; });
      const flotante = $('#wa-float');
      if (flotante) flotante.classList.add('is-hidden-by-config');
      if (form) form.classList.add('is-nowa');
      const hint = $('#form-hint');
      if (hint) hint.textContent = 'Por ahora escríbenos al correo que aparece en esta página.';
      return;
    }
    links.forEach((a) => {
      a.href = waUrl(a.dataset.msg);
      a.target = '_blank';
      a.rel = 'noopener';
    });
    if (!form) return;
    const nombre = form.elements.nombre;
    const err = $('#err-nombre');
    nombre.addEventListener('input', () => {
      if (nombre.value.trim()) { err.hidden = true; nombre.closest('.field').classList.remove('has-error'); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const quien = nombre.value.trim();
      if (!quien) {
        err.hidden = false;
        nombre.closest('.field').classList.add('has-error');
        nombre.focus();
        return;
      }
      const pieza = form.elements.pieza.value;
      const detalle = form.elements.detalle.value.trim();
      let msg = 'Hola, soy ' + quien + '. Me interesa ' + pieza + '.';
      if (detalle) msg += ' Detalles: ' + detalle + (/[.!?]$/.test(detalle) ? '' : '.');
      msg += ' Te escribo desde la página del taller Giorgio Vasari.';
      const url = waUrl(msg);
      const win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
    });
  }

  /* ---------- Cargador ---------- */
  function initLoader() {
    const loader = $('#cargador');
    const num = $('#cargador-num');
    const t0 = performance.now();
    if (num) {
      tween({
        from: 0, to: 100, duration: reduceMotion ? 300 : Math.max(500, 1350 - t0), ease: 'easeInOutQuad',
        update: (v) => { num.textContent = Math.round(v); }
      });
    }
    // El respaldo en CSS lo oculta a los 2.35 s aunque este script falle.
    setTimeout(() => { if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, reduceMotion ? 800 : 2400);
  }

  /* ---------- Separar textos en palabras ---------- */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            const i = document.createElement('span');
            w.className = 'w';
            i.className = 'wi';
            i.textContent = p;
            w.appendChild(i);
            frag.appendChild(w);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) {
          walk(ch);
        }
      });
    };
    walk(el);
    $$('.wi', el).forEach((s, i) => s.style.setProperty('--i', i));
  }

  /* ---------- Revelado al hacer scroll ---------- */
  function initReveal() {
    const targets = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- Contadores ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    if (isNaN(to)) return;
    const fmt = (v) => Math.round(v).toLocaleString('es-MX');
    tween({ from: 0, to, duration: 1700, ease: 'easeOutExpo', update: (v) => { el.textContent = fmt(v); } });
  }
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) return; // el HTML ya trae el valor final
    els.forEach((el) => { el.textContent = '0'; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        countUp(en.target);
      });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Cabecera y menú ---------- */
  function initHeader() {
    const header = $('.site-header');
    const burger = $('.burger');
    const nav = $('#menu');
    if (!header) return;
    let open = false;

    const setMenu = (v) => {
      open = v;
      if (nav) nav.classList.toggle('is-open', v);
      if (burger) {
        burger.setAttribute('aria-expanded', String(v));
        burger.setAttribute('aria-label', v ? 'Cerrar menú' : 'Abrir menú');
      }
      root.style.overflow = v ? 'hidden' : '';
      if (v) header.classList.remove('is-hidden');
    };
    if (burger) burger.addEventListener('click', () => setMenu(!open));
    if (nav) nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setMenu(false); if (burger) burger.focus(); } });
    window.addEventListener('resize', () => { if (open && window.innerWidth >= 1000) setMenu(false); });

    loops.push(() => {
      header.classList.toggle('is-scrolled', S.y > 24);
      if (open) return;
      if (S.y > 720 && S.dy > 3) header.classList.add('is-hidden');
      else if (S.dy < -3 || S.y < 420) header.classList.remove('is-hidden');
    });
  }

  /* ---------- Barra de progreso de lectura ---------- */
  function initProgress() {
    const bar = $('.scroll-progress');
    if (!bar) return;
    let last = -1;
    loops.push(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const v = max > 0 ? clamp(S.y / max) : 0;
      if (Math.abs(v - last) < 0.0005) return;
      last = v;
      bar.style.setProperty('--sp', v.toFixed(4));
    });
  }

  /* ---------- HERO: líneas de veta, partículas, 3D ---------- */
  function initGrain() {
    const svg = $('#hero-grain');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    let seed = 11;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const N = 15;
    for (let i = 0; i < N; i++) {
      const y0 = 40 + i * (820 / N);
      const amp = 26 + rnd() * 80;
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', 'M-40 ' + y0 + ' C 240 ' + (y0 - amp) + ' 460 ' + (y0 + amp) + ' 720 ' + y0 + ' S 1200 ' + (y0 - amp * 0.8) + ' 1500 ' + (y0 + amp * 0.4));
      p.setAttribute('pathLength', '1');
      p.style.setProperty('--t', (11 + rnd() * 11).toFixed(1) + 's');
      p.style.setProperty('--dl', (-rnd() * 14).toFixed(1) + 's');
      p.style.strokeWidth = (0.8 + rnd() * 1.4).toFixed(2);
      svg.appendChild(p);
    }
  }

  function initParticles() {
    const canvas = $('#hero-canvas');
    const hero = $('#inicio');
    if (!canvas || !hero || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, dpr = 1, parts = [], visible = true;
    const mouse = { x: -999, y: -999 };

    const makeSprite = (inner, outer) => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, inner);
      grad.addColorStop(0.28, outer);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return c;
    };
    const spriteGold = makeSprite('rgba(255,240,200,1)', 'rgba(236,190,110,.5)');
    const spriteCopper = makeSprite('rgba(255,200,150,1)', 'rgba(210,120,60,.45)');

    const build = () => {
      const n = w < 700 ? 34 : 78;
      parts = [];
      for (let i = 0; i < n; i++) {
        const shaving = i % 4 === 0;
        parts.push({
          shaving,
          x: Math.random() * w,
          y: Math.random() * h,
          r: shaving ? 7 + Math.random() * 10 : 0.7 + Math.random() * 2.1,
          vy: shaving ? 0.14 + Math.random() * 0.35 : -(0.1 + Math.random() * 0.45),
          sw: 0.2 + Math.random() * 0.8,
          ph: Math.random() * 6.28,
          a: shaving ? 0.16 + Math.random() * 0.28 : 0.3 + Math.random() * 0.6,
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.02,
          cu: Math.random() < 0.28
        });
      }
    };

    const resize = () => {
      const r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduceMotion) draw(0, 0);
    };

    const draw = (now, dt) => {
      const k = Math.min(2.5, dt / 16.67 || 1);
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (!reduceMotion) {
          p.ph += 0.012 * k;
          p.x += Math.sin(p.ph) * p.sw * 0.5 * k;
          p.y += p.vy * k;
          if (p.shaving) p.rot += p.vr * k;
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 19600 && d2 > 1) {
            const d = Math.sqrt(d2), f = (1 - d / 140) * 2.4 * k;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
          if (p.y < -20) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.y > h + 20) { p.y = -10; p.x = Math.random() * w; }
          if (p.x < -20) p.x = w + 10;
          if (p.x > w + 20) p.x = -10;
        }
        if (p.shaving) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.a;
          ctx.fillStyle = 'rgb(222,174,108)';
          ctx.beginPath();
          ctx.moveTo(-p.r, 0);
          ctx.quadraticCurveTo(0, -p.r * 0.7, p.r, 0);
          ctx.quadraticCurveTo(0, p.r * 0.28, -p.r, 0);
          ctx.fill();
          ctx.restore();
        } else {
          const tw = reduceMotion ? 1 : 0.65 + 0.35 * Math.sin(now / 700 + p.ph * 3);
          ctx.globalAlpha = p.a * tw;
          const s = p.r * 7;
          ctx.drawImage(p.cu ? spriteCopper : spriteGold, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
    };

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(hero);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener('resize', resize);
    resize();

    if (!reduceMotion) {
      loops.push((now, dt) => { if (visible) draw(now, dt); });
    }
  }

  function initHero() {
    const hero = $('#inicio');
    const copy = $('.hero__copy');
    const visual = $('.hero__visual');
    const stage = $('#fan-stage');
    const light = $('.hero__light');
    if (!hero || !stage) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, lastMove = -99999;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tx = nx * 16; ty = ny * 11;
      if (light) {
        light.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        light.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }
      lastMove = performance.now();
    }, { passive: true });

    loops.push((now) => {
      const r = hero.getBoundingClientRect();
      if (r.bottom < -40 || r.top > window.innerHeight + 40) return;
      let gx = tx, gy = ty;
      if (now - lastMove > 2200 && !reduceMotion) { gx = Math.sin(now / 2700) * 7.5; gy = Math.cos(now / 3500) * 4.5; }
      cx = lerp(cx, gx, 0.06); cy = lerp(cy, gy, 0.06);
      stage.style.transform = 'rotateX(' + cy.toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
      const p = clamp(-r.top / r.height);
      if (copy) { copy.style.transform = 'translate3d(0,' + (p * 70).toFixed(1) + 'px,0)'; copy.style.opacity = (1 - p * 1.3).toFixed(3); }
      if (visual) visual.style.transform = 'translate3d(0,' + (-p * 46).toFixed(1) + 'px,0) scale(' + (1 - p * 0.1).toFixed(3) + ')';
    });
  }

  /* ---------- Manifiesto: las palabras se encienden con el scroll ---------- */
  function initScrubWords() {
    const el = $('[data-scrub-words]');
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((t) => {
      const s = document.createElement('span');
      s.className = 'sw';
      s.textContent = t;
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
      return s;
    });
    if (reduceMotion) return;
    spans.forEach((s) => { s.style.opacity = '0.16'; });
    let last = -1;
    loops.push(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.42));
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      const n = spans.length;
      spans.forEach((s, i) => {
        const k = clamp(p * (n + 8) - i, 0, 1);
        s.style.opacity = (0.16 + 0.84 * k).toFixed(3);
      });
    });
  }

  /* ---------- Piezas: carrusel fijado con scroll (escritorio) / deslizable (móvil) ---------- */
  function initPieces() {
    const sec = $('#piezas');
    const viewport = $('#pieces-viewport');
    const track = $('#pieces-track');
    const bar = $('#pieces-bar');
    const now = $('#pieces-now');
    if (!sec || !viewport || !track) return;
    const cards = $$('.piece', track);
    let pinned = false, maxX = 0, cur = 0, offsets = [], idxShown = -1;

    const setIndex = (i) => {
      if (i === idxShown) return;
      idxShown = i;
      if (now) now.textContent = String(i + 1).padStart(2, '0');
    };

    const setup = () => {
      const want = window.innerWidth >= 1000 && window.innerHeight >= 620;
      if (want) {
        sec.classList.add('is-pinned');
        track.style.transform = '';
        viewport.scrollLeft = 0;
        const pad = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
        maxX = Math.max(0, track.scrollWidth + pad * 2 - viewport.clientWidth);
        sec.style.height = Math.round(window.innerHeight + maxX * 1.25) + 'px';
        offsets = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
      } else {
        sec.classList.remove('is-pinned');
        sec.style.height = '';
        track.style.transform = '';
        cards.forEach((c) => { c.style.transform = ''; });
        maxX = 0;
      }
      pinned = want;
    };

    viewport.addEventListener('scroll', () => {
      if (pinned) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      if (bar) bar.style.setProperty('--pp', (max > 0 ? 0.1 + 0.9 * viewport.scrollLeft / max : 1).toFixed(3));
      const mid = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = 0, bd = 1e9;
      cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      setIndex(best);
    }, { passive: true });

    setup();
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(setup, 160); });
    window.addEventListener('load', setup);

    loops.push(() => {
      if (!pinned) return;
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -50 || r.top > vh + 50) return;
      const target = clamp(-r.top / Math.max(1, r.height - vh));
      cur = reduceMotion ? target : lerp(cur, target, 0.1);
      const tx = -cur * maxX;
      track.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,0,0)';
      if (bar) bar.style.setProperty('--pp', (0.08 + 0.92 * cur).toFixed(3));
      const vw = window.innerWidth;
      let best = 0, bd = 1e9;
      cards.forEach((c, i) => {
        const d = (offsets[i] + tx - vw / 2) / vw;
        const ad = Math.abs(d);
        if (ad < bd) { bd = ad; best = i; }
        if (!reduceMotion) c.style.transform = 'perspective(1500px) rotateY(' + (-d * 12).toFixed(2) + 'deg) scale(' + (1 - Math.min(ad, 1) * 0.06).toFixed(3) + ')';
      });
      setIndex(best);
    });
  }

  /* ---------- La imagen se abre con el scroll ---------- */
  function initExpand() {
    const sec = $('#puertas');
    if (!sec) return;
    sec.classList.add('is-scrub');
    sec.style.setProperty('--eh', (reduceMotion ? 170 : 280) + 'vh');
    let cur = -1, last = -1;
    const apply = (p) => {
      const narrow = window.innerWidth < 700;
      const e = smooth(0, 0.6, p), inv = 1 - e;
      sec.style.setProperty('--ix', ((narrow ? 14 : 22) * inv).toFixed(2) + '%');
      sec.style.setProperty('--it', ((narrow ? 30 : 31) * inv).toFixed(2) + '%');
      sec.style.setProperty('--ib', ((narrow ? 10 : 10) * inv).toFixed(2) + '%');
      sec.style.setProperty('--r', (30 * inv).toFixed(1) + 'px');
      sec.style.setProperty('--sc', (1.3 - 0.3 * e).toFixed(4));
      sec.style.setProperty('--ot', (1 - smooth(0.28, 0.58, p)).toFixed(3));
      sec.style.setProperty('--oy', (-p * 46).toFixed(1) + 'px');
      sec.style.setProperty('--cc', smooth(0.64, 0.88, p).toFixed(3));
    };
    apply(0);
    loops.push(() => {
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -80 || r.top > vh + 80) return;
      const target = clamp(-r.top / Math.max(1, r.height - vh));
      cur = cur < 0 || reduceMotion ? target : lerp(cur, target, 0.12);
      if (Math.abs(cur - last) < 0.0004) return;
      last = cur;
      apply(cur);
    });
  }

  /* ---------- Plano técnico (pestañas + dibujo de líneas) ---------- */
  function initBlueprint() {
    const tabs = $$('.bp__tab');
    const panels = $$('.bp__panel');
    const stage = $('.bp__stage');
    if (!tabs.length || !panels.length) return;
    let started = false;

    const show = (i, byUser) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, k) => {
        if (k === i) {
          p.hidden = false;
          p.classList.remove('is-drawn');
          void p.offsetWidth;
          p.classList.add('is-drawn');
          if (started || byUser) $$('[data-count]', p).forEach(countUp);
        } else {
          p.hidden = true;
          p.classList.remove('is-drawn');
        }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { started = true; show(i, true); });
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        started = true; show(n, true); tabs[n].focus();
      });
    });

    // Los números del primer panel los cuenta initCounters; aquí solo se dibuja al entrar en pantalla.
    if (!('IntersectionObserver' in window) || reduceMotion) { panels[0].classList.add('is-drawn'); return; }
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      started = true;
      panels[0].classList.add('is-drawn');
    }, { threshold: 0.3 });
    io.observe(stage);
  }

  /* ---------- Galería 3D giratoria ---------- */
  function initRing() {
    const scene = $('#ring-scene');
    const stage = $('#ring-stage');
    if (!scene || !stage) return;
    const items = $$('.ring__item', stage);
    const cap = $('#ring-caption');
    const n = items.length;
    const step = 360 / n;
    let angle = 0, vel = 0, dragging = false, lastX = 0, snap = null, visible = false, intro = false, shown = -1;

    scene.tabIndex = 0;

    const go = (dir) => {
      const k = Math.round(-angle / step) + dir;
      snap = -k * step; vel = 0;
    };
    const prev = $('#ring-prev'), next = $('#ring-next');
    if (prev) prev.addEventListener('click', () => go(-1));
    if (next) next.addEventListener('click', () => go(1));
    scene.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });

    scene.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; vel = 0; snap = null;
      scene.classList.add('is-drag');
      try { scene.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
    });
    scene.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      angle += dx * 0.32;
      vel = dx * 0.32;
    });
    const end = () => { dragging = false; scene.classList.remove('is-drag'); };
    scene.addEventListener('pointerup', end);
    scene.addEventListener('pointercancel', end);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        const v = es[0].isIntersecting;
        if (v && !visible && !reduceMotion) {
          intro = true;
          tween({ from: 150, to: 0, duration: 2200, ease: 'easeOutExpo', update: (x) => { angle = x; }, done: () => { intro = false; } });
        }
        visible = v;
      }, { threshold: 0.15 }).observe(scene);
    } else {
      visible = true;
    }

    loops.push((now, dt) => {
      if (!visible) return;
      if (!intro) {
        if (dragging) { /* lo mueve el puntero */ }
        else if (snap !== null) {
          angle = lerp(angle, snap, 0.12);
          if (Math.abs(angle - snap) < 0.05) { angle = snap; snap = null; }
        } else {
          angle += vel;
          vel *= 0.93;
          if (!reduceMotion && Math.abs(vel) < 0.02) angle -= 0.07 * (dt / 16.67) + S.vy * -0.012;
        }
      }
      stage.style.transform = 'translateZ(calc(var(--r) * -1)) rotateY(' + angle.toFixed(2) + 'deg)';
      for (let i = 0; i < n; i++) {
        const c = Math.cos(((i * step + angle) * Math.PI) / 180);
        items[i].style.opacity = (0.3 + 0.7 * clamp((c + 0.15) / 1.15)).toFixed(3);
      }
      const front = ((Math.round(-angle / step) % n) + n) % n;
      if (front !== shown) {
        shown = front;
        const fc = items[front].querySelector('figcaption');
        if (cap && fc) cap.textContent = fc.textContent;
      }
    });
  }

  /* ---------- Acabados ---------- */
  function initFinishes() {
    const tabs = $$('.fin-tab');
    const views = $$('.fin-view');
    const grid = $('.finishes__grid');
    if (!tabs.length || !views.length) return;
    const n = tabs.length;
    let idx = 0, timer = null, userControl = reduceMotion, visible = false;

    const set = (i) => {
      idx = i;
      tabs.forEach((t, k) => {
        const on = k === i;
        t.classList.toggle('is-active', on);
        t.classList.remove('is-cycling');
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      views.forEach((v, k) => v.classList.toggle('is-active', k === i));
      clearTimeout(timer);
      if (!userControl && visible) {
        void tabs[i].offsetWidth;
        tabs[i].classList.add('is-cycling');
        timer = setTimeout(() => set((idx + 1) % n), 4800);
      }
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { userControl = true; set(i); });
      t.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const k = (i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
        userControl = true; set(k); tabs[k].focus();
      });
    });
    if ('IntersectionObserver' in window && grid) {
      new IntersectionObserver((es) => {
        visible = es[0].isIntersecting;
        if (visible) set(idx); else clearTimeout(timer);
      }, { threshold: 0.35 }).observe(grid);
    }
  }

  /* ---------- Proceso: riel que se llena + parallax de fotos ---------- */
  function initProcess() {
    const list = $('#steps');
    if (!list) return;
    const steps = $$('.step', list);
    loops.push(() => {
      const r = list.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -100 || r.top > vh + 100) return;
      const mid = vh * 0.55;
      list.style.setProperty('--rail', clamp((mid - r.top) / r.height).toFixed(4));
      steps.forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle('is-active', sr.top + 24 < mid);
        const media = $('.step__media', s);
        if (media) {
          const hh = sr.height;
          const mr = media.getBoundingClientRect();
          const d = mr.top + mr.height / 2 - vh / 2;
          const lim = mr.height * 0.06;
          media.style.setProperty('--py', clamp(d * -0.07, -lim, lim).toFixed(1) + 'px');
          void hh;
        }
      });
    });
  }

  /* ---------- Inclinación 3D de tarjetas y botones magnéticos ---------- */
  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const rx = -py * 8, ry = px * 10;
        el.style.rotate = rx.toFixed(2) + ' ' + ry.toFixed(2) + ' 0 ' + Math.hypot(rx, ry).toFixed(2) + 'deg';
      });
      el.addEventListener('pointerleave', () => { el.style.rotate = 'none'; });
    });
    $$('.btn--lg, .nav__cta').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', () => { el.style.translate = 'none'; });
    });
  }

  /* ---------- Preguntas frecuentes: una abierta a la vez ---------- */
  function initFaq() {
    const all = $$('.qa');
    all.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (d.open) all.forEach((o) => { if (o !== d) o.open = false; });
      });
    });
  }

  /* ---------- Arranque ---------- */
  function onReady() {
    root.classList.add('is-ready');
    safe(initReveal);
    safe(initCounters);
  }

  function start() {
    safe(initWhatsApp);
    safe(initLoader);
    $$('[data-split]').forEach((el) => safe(() => splitWords(el)));
    safe(initHeader);
    safe(initProgress);
    safe(initGrain);
    safe(initParticles);
    safe(initHero);
    safe(initScrubWords);
    safe(initPieces);
    safe(initExpand);
    safe(initBlueprint);
    safe(initRing);
    safe(initFinishes);
    safe(initProcess);
    safe(initTilt);
    safe(initFaq);

    const wait = reduceMotion ? 350 : Math.max(0, 1450 - performance.now());
    setTimeout(onReady, wait);

    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!document.hidden) {
        S.y = window.scrollY || window.pageYOffset || 0;
        S.dy = S.y - S.lastY;
        S.vy = lerp(S.vy, S.dy, 0.25);
        S.lastY = S.y;
        for (let i = 0; i < loops.length; i++) { try { loops[i](now, dt); } catch (e) { /* un módulo no debe romper a los demás */ } }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
