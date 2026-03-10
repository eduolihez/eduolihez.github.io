/* ============================================================
   GRUP TITUS — main.js  (deferred, ~5 KB)
   ============================================================ */
'use strict';

/* ── FEATURE FLAGS ── */
const isFine    = window.matchMedia('(pointer:fine)').matches;
const isReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ── LOADER ── */
const loader = document.getElementById('loader');
if (loader) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('done');
      document.body.classList.remove('loading');
      document.querySelector('.nav')?.classList.add('nav-ready');
    }, 900);
  }, { once: true });
}

/* ── CURSOR (fine-pointer only) ── */
const dot  = document.querySelector('.c-dot');
const ring = document.querySelector('.c-ring');
if (dot && ring && isFine) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.cssText = `left:${mx}px;top:${my}px`;
  }, { passive: true });
  (function tick() {
    rx += (mx - rx) * .11;
    ry += (my - ry) * .11;
    ring.style.cssText = `left:${rx}px;top:${ry}px`;
    requestAnimationFrame(tick);
  })();
  document.addEventListener('mouseover', e => {
    ring.classList.toggle('h', !!e.target.closest('a,button,[data-hover]'));
  }, { passive: true });
}

/* ── NAV SCROLL ── */
const nav = document.querySelector('.nav');
let lastY = 0, navHidden = false;
if (nav) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 60);
    const hide = y > lastY && y > 250;
    if (hide !== navHidden) {
      nav.style.transform = hide ? 'translateY(-105%)' : '';
      navHidden = hide;
    }
    lastY = y;
    document.getElementById('btt')?.classList.toggle('show', y > 700);
  }, { passive: true });
}

/* ── MOBILE MENU ── */
const burger = document.querySelector('.nav-burger');
const mMenu  = document.querySelector('.nav-mobile');
if (burger && mMenu) {
  const open = () => {
    burger.setAttribute('aria-expanded', 'true');
    mMenu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    mMenu.querySelector('a')?.focus();
  };
  const close = () => {
    burger.setAttribute('aria-expanded', 'false');
    mMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    burger.focus();
  };
  burger.addEventListener('click', () =>
    burger.getAttribute('aria-expanded') === 'true' ? close() : open()
  );
  mMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') close();
  });
}

/* ── ACTIVE NAV LINK ── */
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(l => {
  if ((l.getAttribute('href') || '').split('/').pop() === page)
    l.setAttribute('aria-current', 'page');
});

/* ── SCROLL REVEAL ── */
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }});
}, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-r]').forEach(el => ro.observe(el));

/* ── COUNTER ANIMATION ── */
const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting || e.target.dataset.done) return;
    e.target.dataset.done = '1';
    const end = +e.target.dataset.count;
    const sfx = e.target.dataset.suffix || '';
    const dur = 1600, t0 = performance.now();
    const frame = now => {
      const p = Math.min((now - t0) / dur, 1);
      e.target.textContent = Math.round((1 - Math.pow(1-p,3)) * end) + sfx;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}, { threshold: .7 });
document.querySelectorAll('[data-count]').forEach(el => co.observe(el));

/* ── TICKER CLONE ── */
const track = document.querySelector('.ticker-track');
if (track) track.innerHTML += track.innerHTML;

/* ═══════════════════════════════════════════════════════
   PARALLAX — RAF-based, GPU-composited (transform only)
   Runs on: hero-bg, vh-bg (venue subpage heroes),
            venue-scroll .vs-bg (home scroll sections)
   Disabled: touch devices, reduced-motion
   ═══════════════════════════════════════════════════════ */
if (!isReduced && isFine) {

  /* ── Hero parallax (index + subpages) ──────────────── */
  const heroBg = document.querySelector('.hero-bg, .vh-bg');
  if (heroBg) {
    // Remove the CSS scale so we control it fully from JS
    heroBg.style.transform = 'scale(1.12) translateY(0px)';
    heroBg.style.willChange = 'transform';

    let ticking = false;
    const onHeroScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const vh = window.innerHeight;
          // Only run while hero is in viewport
          if (y < vh * 1.2) {
            // 0.35 = parallax depth (35% of scroll distance)
            const shift = y * 0.35;
            heroBg.style.transform = `scale(1.12) translateY(${shift}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Subtle zoom-in on load (CSS scale starts at 1.12, we already set it)
    window.addEventListener('scroll', onHeroScroll, { passive: true });
  }

  /* ── Venue-scroll .vs-bg parallax (home page) ──────── */
  const venueSections = [...document.querySelectorAll('.venue-scroll')];
  if (venueSections.length) {
    const venueBgs = venueSections.map(s => s.querySelector('.vs-bg'));
    let vticking = false;

    const onVenueScroll = () => {
      if (!vticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          venueSections.forEach((sec, i) => {
            const bg = venueBgs[i];
            if (!bg) return;
            const rect = sec.getBoundingClientRect();
            // Only update visible ± 1 viewport
            if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) return;
            // rect.top is negative when we've scrolled past the top of section
            // shift = how far INTO the section we've scrolled × depth factor
            const shift = -rect.top * 0.28;
            bg.style.transform = `scale(1) translateY(${shift}px)`;
          });
          vticking = false;
        });
        vticking = true;
      }
    };

    window.addEventListener('scroll', onVenueScroll, { passive: true });
    onVenueScroll(); // initial state
  }

} else {
  /* ── No parallax: static scale for non-fine / reduced-motion ── */
  document.querySelectorAll('.hero-bg').forEach(el => {
    el.style.transform = 'scale(1.04)';
  });
}

/* ── HERO SCROLL CUE ── */
document.querySelector('.hero-scroll-cue')?.addEventListener('click', () => {
  document.querySelector('.hero')?.nextElementSibling
    ?.scrollIntoView({ behavior: 'smooth' });
});

/* ── SMOOTH ANCHORS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth' });
    t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });
});

/* ── PAGE TRANSITIONS ── */
const veil = document.getElementById('veil');
document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto"]):not([href^="tel"]):not([target])')
  .forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('//')) return;
    a.addEventListener('click', e => {
      e.preventDefault();
      veil?.classList.add('show');
      setTimeout(() => { location.href = href; }, 440);
    });
  });
window.addEventListener('pageshow', () => veil?.classList.remove('show'));

/* ── BACK TO TOP ── */
document.getElementById('btt')?.addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);

/* ── MAGNETIC EFFECT (desktop) ── */
if (isFine) {
  document.querySelectorAll('.vs-link,.f-link').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * .2;
      const y = (e.clientY - r.top  - r.height / 2) * .2;
      el.style.transform = `translate(${x}px,${y}px)`;
    });
    el.addEventListener('mouseleave', () => el.style.transform = '');
  });
}
