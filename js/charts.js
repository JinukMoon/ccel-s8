/* S8 Bold data — the one chart left after round v5: published papers per year on publications.html, drawn as inline
   SVG from window.CCEL at runtime (no library). Each bar is a button that jumps to that year in the list.
   The landing-page area, journal and people charts were dropped. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc;
  const STATUS_ORDER = ['accepted', 'in press', 'in revision', 'submitted'];

  /* ---------- numbers ---------- */
  const D = {};
  D.perYear = () => {
    const pub = U.published(), m = new Map();
    pub.forEach(p => m.set(p.year, (m.get(p.year) || 0) + 1));
    const ys = [...m.keys()].filter(y => Number.isFinite(y));
    const min = Math.min(...ys), max = Math.max(...ys), rows = [];
    for (let y = min; y <= max; y++) rows.push({ year: y, n: m.get(y) || 0 });
    return { rows, min, max, total: pub.length };
  };
  D.pipeline = () => {
    const m = new Map();
    C.publications.filter(p => p.status !== 'published').forEach(p => m.set(p.status, (m.get(p.status) || 0) + 1));
    const keys = [...m.keys()].sort((a, b) => (STATUS_ORDER.indexOf(a) + 99 * (STATUS_ORDER.indexOf(a) < 0)) - (STATUS_ORDER.indexOf(b) + 99 * (STATUS_ORDER.indexOf(b) < 0)));
    return keys.map(k => ({ status: k, label: U.statusLabel(k), n: m.get(k) }));
  };
  const table = (caption, head, rows) => `<details class="data-table"><summary>Data table</summary><table><caption class="sr-only">${esc(caption)}</caption>
    <thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></details>`;

  /* ---------- papers per year (+ not-yet-published apart) ---------- */
  function years(el, opt = {}) {
    const Y = D.perYear(), P = opt.pipeline === false ? [] : D.pipeline();
    const uid = el.id || 'yc';
    const draw = () => {
      const w = Math.max(280, Math.floor(el.clientWidth));
      if (el._w === w) return; el._w = w;
      const maxN = Math.max(...Y.rows.map(r => r.n), ...P.map(r => r.n), 1);
      const sel = opt.selected ? opt.selected() : null;
      let svg;
      if (w >= 640) {
        const h = opt.height || 360, top = 30, bot = 34, ph = h - top - bot, y0 = top + ph;
        const pw = P.length ? P.length * 84 + 44 : 0, mw = w - pw;
        const slot = mw / Y.rows.length, bw = Math.max(6, Math.min(44, slot * .64));
        const every = slot < 34 ? (slot < 20 ? 5 : 2) : 1;
        const sy = n => ph * n / maxN;
        let s = '';
        Y.rows.forEach((r, i) => {
          const x = i * slot + (slot - bw) / 2, bh = sy(r.n);
          const lbl = (r.year - Y.min) % every === 0 || r.year === Y.max;
          const body = `<rect class="bar" style="--i:${i}" x="${x.toFixed(1)}" y="${(y0 - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="#fa901e"/>
            ${r.n ? `<text class="val t-val" style="--i:${i}" x="${(x + bw / 2).toFixed(1)}" y="${(y0 - bh - 9).toFixed(1)}" text-anchor="middle" font-size="${slot < 40 ? 11 : 14}">${r.n}</text>` : ''}
            ${lbl ? `<text class="t-muted" x="${(x + bw / 2).toFixed(1)}" y="${y0 + 22}" text-anchor="middle" font-size="12">${r.year}</text>` : ''}`;
          s += opt.clickable
            ? `<g class="ybtn${sel === r.year ? ' sel' : ''}" data-year="${r.year}" tabindex="0" role="button" aria-label="${r.year}: ${r.n} published papers. Jump to ${r.year}"><rect x="${(i * slot).toFixed(1)}" y="${top}" width="${slot.toFixed(1)}" height="${ph + bot}" fill="transparent"/>${body}</g>`
            : body;
        });
        s += `<line x1="0" x2="${mw.toFixed(1)}" y1="${y0}" y2="${y0}" stroke="rgba(255,255,255,.4)" stroke-width="1"/>`;
        if (P.length) {
          const px = mw + 44;
          s += `<line x1="${mw + 22}" x2="${mw + 22}" y1="${top - 22}" y2="${y0 + 26}" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 5"/>
            <text class="t-muted" x="${px}" y="${top - 14}" font-size="12">Not yet published</text>
            <line x1="${px}" x2="${w}" y1="${y0}" y2="${y0}" stroke="rgba(255,255,255,.4)"/>`;
          P.forEach((r, j) => {
            const bw2 = 40, x = px + j * 84 + (84 - bw2) / 2 - 10, bh = sy(r.n), i = Y.rows.length + j;
            s += `<rect class="bar" style="--i:${i}" x="${x}" y="${(y0 - bh).toFixed(1)}" width="${bw2}" height="${bh.toFixed(1)}" fill="url(#${uid}-hatch)" stroke="#fa901e" stroke-width="2"/>
              <text class="val t-val" style="--i:${i}" x="${x + bw2 / 2}" y="${(y0 - bh - 9).toFixed(1)}" text-anchor="middle" font-size="14">${r.n}</text>
              <text class="t-muted" x="${x + bw2 / 2}" y="${y0 + 22}" text-anchor="middle" font-size="12">${esc(r.label)}</text>`;
          });
        }
        svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${uid}-t ${uid}-d">
          <title id="${uid}-t">Published papers per year, ${Y.min} to ${Y.max}</title>
          <desc id="${uid}-d">${Y.total} published papers. ${P.map(r => `${r.n} ${r.label.toLowerCase()}`).join(', ')}${P.length ? ' (shown apart).' : ''}</desc>
          <defs><pattern id="${uid}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="6" fill="#fa901e" fill-opacity=".6"/></pattern></defs>${s}</svg>`;
      } else {
        // narrow screens: one row per year, newest first, then the not-yet-published rows
        const rh = 22, lw = 46, vw = 34, top = 4;
        const rows = [...Y.rows].reverse();
        const gap = P.length ? 44 : 0, h = top + rows.length * rh + gap + P.length * rh + 6;
        const bwMax = w - lw - vw;
        let s = '';
        rows.forEach((r, i) => {
          const y = top + i * rh, bl = bwMax * r.n / maxN;
          const body = `<text class="t-muted" x="0" y="${y + 15}" font-size="12">${r.year}</text>
            <rect class="hbar bar" style="--i:${i}" x="${lw}" y="${y + 4}" width="${bl.toFixed(1)}" height="${rh - 8}" fill="#fa901e"/>
            <text class="val t-val" style="--i:${i}" x="${(lw + bl + 6).toFixed(1)}" y="${y + 15}" font-size="12">${r.n}</text>`;
          s += opt.clickable
            ? `<g class="ybtn" data-year="${r.year}" tabindex="0" role="button" aria-label="${r.year}: ${r.n} published papers. Jump to ${r.year}"><rect x="0" y="${y}" width="${w}" height="${rh}" fill="transparent"/>${body}</g>`
            : body;
        });
        if (P.length) {
          const y1 = top + rows.length * rh + 14;
          s += `<line x1="0" x2="${w}" y1="${y1}" y2="${y1}" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 5"/>
            <text class="t-muted" x="0" y="${y1 + 22}" font-size="12">Not yet published</text>`;
          P.forEach((r, j) => {
            const y = top + rows.length * rh + gap + j * rh, bl = bwMax * r.n / maxN, i = rows.length + j;
            s += `<text class="t-muted" x="0" y="${y + 15}" font-size="11">${esc(r.label)}</text>
              <rect class="hbar" style="--i:${i}" x="${lw + 30}" y="${y + 4}" width="${Math.max(2, bl - 30).toFixed(1)}" height="${rh - 8}" fill="url(#${uid}-hatch)" stroke="#fa901e" stroke-width="1.5"/>
              <text class="val t-val" style="--i:${i}" x="${(lw + Math.max(32, bl) + 6).toFixed(1)}" y="${y + 15}" font-size="12">${r.n}</text>`;
          });
        }
        svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${uid}-t">
          <title id="${uid}-t">Published papers per year, ${Y.min} to ${Y.max}</title>
          <defs><pattern id="${uid}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="6" fill="#fa901e" fill-opacity=".6"/></pattern></defs>${s}</svg>`;
      }
      el.innerHTML = svg + table('Published papers per year', ['Year', 'Published papers'],
        Y.rows.map(r => [r.year, r.n]).concat(P.map(r => [r.label + ' (not yet published)', r.n])));
      if (opt.onDraw) opt.onDraw(el);
    };
    draw();
    U.armChart(el);
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 120); }, { passive: true });
    el._redraw = () => { el._w = 0; draw(); };
    return { Y, P };
  }

  window.S8Charts = { D, years, table };
})();
