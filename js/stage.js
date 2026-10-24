/* S8 Bold data — scroll stage. A sticky 100vh pin inside a 240vh (mobile 190vh) section; the `hero` frame
   sequence is drawn on a <canvas> by native scroll progress. Counts, sizes and file names come from
   _shared/scroll/manifest.json. Reduced motion: no frames are requested, the poster stays still. */
(function () {
  'use strict';
  const stage = document.getElementById('stage');
  if (!stage) return;
  const pin = stage.querySelector('.stage-pin');
  const canvas = stage.querySelector('.stage-canvas');
  const poster = stage.querySelector('.stage-poster');
  const phaseA = stage.querySelector('.phase-a');
  const phaseB = stage.querySelector('.phase-b');
  const BASE = '_shared/scroll/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ctx = canvas && canvas.getContext('2d');

  let seq = null, frames = [], target = 0, shown = -1, cw = 0, ch = 0, queued = false;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const fileName = (pattern, i) => pattern.replace(/\{index(?::0?(\d+)d)?\}/, (m, wd) => (wd ? String(i).padStart(+wd, '0') : String(i)));

  function progress() {
    const r = stage.getBoundingClientRect();
    const run = stage.offsetHeight - window.innerHeight;
    return run > 0 ? clamp(-r.top / run, 0, 1) : 0;
  }

  /* copy phases: A = identity line, B = oversized counts. A is fully gone (p .20-.32) before B starts
     (p .38-.50), so the two layers of large type never overlap; between them only the video shows. */
  function setPhases(p) {
    const a = 1 - smooth(.20, .32, p), b = smooth(.38, .50, p);
    stage.style.setProperty('--a', a.toFixed(3));
    stage.style.setProperty('--b', b.toFixed(3));
    stage.style.setProperty('--dim', (.5 * b).toFixed(3));
    stage.style.setProperty('--cue', (1 - smooth(0, .08, p)).toFixed(3));
    if (a < .02) phaseA.setAttribute('data-hidden', ''); else phaseA.removeAttribute('data-hidden');
    if (b < .02) phaseB.setAttribute('data-hidden', ''); else phaseB.removeAttribute('data-hidden');
  }

  function sizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(pin.clientWidth * dpr), h = Math.round(pin.clientHeight * dpr);
    if (w !== cw || h !== ch) { cw = canvas.width = w; ch = canvas.height = h; shown = -1; }
  }

  function nearestLoaded(i) {
    for (let d = 0; d < frames.length; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  }

  function draw() {
    if (!seq) return;
    const k = nearestLoaded(target);
    if (k < 0 || k === shown) return;
    const img = frames[k];
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    shown = k;
    if (!canvas.dataset.live) { canvas.dataset.live = '1'; canvas.style.opacity = '1'; }
  }

  function update() {
    queued = false;
    const p = progress();
    setPhases(p);
    if (seq) {
      target = Math.round(clamp(p / .9, 0, 1) * (seq.count - 1));
      draw();
    }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  /* progressive loading: after page load only the keyframes (every 8th + the last); the gaps (every 4th, 2nd,
     then all) wait for the visitor's first scroll / wheel / touch / key. A few requests at a time. */
  function loadFrames() {
    const n = seq.count, seen = new Uint8Array(n), order = [], gaps = [];
    for (let i = 0; i < n; i += 8) { seen[i] = 1; order.push(i); }
    if (!seen[n - 1]) { seen[n - 1] = 1; order.splice(1, 0, n - 1); }
    [4, 2, 1].forEach(step => { for (let i = 0; i < n; i += step) if (!seen[i]) { seen[i] = 1; gaps.push(i); } });
    const evts = ['scroll', 'wheel', 'touchstart', 'keydown'];
    const more = () => { evts.forEach(t => window.removeEventListener(t, more)); order.push(...gaps.splice(0)); pump(); };
    let active = 0;
    const pump = () => {
      while (active < 4 && order.length) {
        const i = order.shift(), img = new Image();
        active++;
        img.decoding = 'async';
        img.onload = () => {
          const done = () => { frames[i] = img; active--; if (Math.abs(i - target) <= 8 || shown < 0) schedule(); pump(); };
          img.decode ? img.decode().then(done, done) : done();
        };
        img.onerror = () => { active--; pump(); };
        img.src = BASE + seq.dir + '/' + fileName(seq.pattern, i + seq.base);
      }
    };
    pump();
    if (window.scrollY > 0) more();
    else evts.forEach(t => window.addEventListener(t, more, { passive: true }));
  }

  function start(man) {
    const s = man.sequences && man.sequences.hero;
    if (!s) return;
    if (s.poster && poster.getAttribute('src') !== BASE + s.poster) poster.src = BASE + s.poster;
    if (reduce.matches || !ctx) return;
    const m = window.innerWidth < 768 && s.mobile ? s.mobile : s;
    seq = { dir: m.dir, count: m.count, pattern: man.pattern || 'f_{index:03d}.webp', base: man.index_base || 0 };
    frames = new Array(seq.count);
    canvas.style.opacity = '0';
    sizeCanvas();
    loadFrames();
    schedule();
  }

  // copy phases work even before (or without) frames
  if (!reduce.matches) {
    setPhases(progress());
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { if (seq) sizeCanvas(); schedule(); }, { passive: true });
  } else {
    phaseA.removeAttribute('data-hidden'); phaseB.removeAttribute('data-hidden');
  }

  // frames are requested only after the page (poster, fonts, data) has painted
  const go = () => fetch(BASE + 'manifest.json').then(r => (r.ok ? r.json() : null)).then(m => m && start(m)).catch(() => {});
  if (document.readyState === 'complete') setTimeout(go, 0);
  else window.addEventListener('load', () => setTimeout(go, 0), { once: true });
})();
