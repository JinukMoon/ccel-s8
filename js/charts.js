/* S8 Bold data — inline-SVG charts computed at runtime from window.CCEL. No chart library, no invented metrics.
   Data fields used are listed in NOTES.md ("Charts"). */
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
  D.areas = () => {
    const pub = U.published(), m = new Map();
    pub.forEach(p => m.set(p.area || null, (m.get(p.area || null) || 0) + 1));
    const rows = (C.research.areas || []).map(a => ({ key: a.numeral, label: U.plain(a.title), n: m.get(a.numeral) || 0 }));
    if (m.get(null)) rows.push({ key: null, label: 'Not assigned to an area', n: m.get(null) });
    return { rows, total: pub.length };
  };
  D.journals = (top) => {
    const pub = U.published(), m = new Map();
    let missing = 0;
    pub.forEach(p => { if (p.journal) m.set(p.journal, (m.get(p.journal) || 0) + 1); else missing++; });
    const rows = [...m.entries()].map(([j, n]) => ({ label: j, n }))
      .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
    return { rows: rows.slice(0, top), distinct: rows.length, missing, total: pub.length };
  };
  D.people = (list) => {
    const groups = (list || []).map(g => ({ group: g.group, people: g.people.map(p => ({ name: U.splitName(p.name).name, type: p.type })) }));
    const all = groups.flatMap(g => g.people);
    const t = k => all.filter(p => p.type === k).length;
    return { groups, total: all.length, comp: t('computational'), exp: t('experimental'), na: all.filter(p => !p.type).length };
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
            ? `<g class="ybtn${sel === r.year ? ' sel' : ''}" data-year="${r.year}" tabindex="0" role="button" aria-label="Show ${r.n} published papers from ${r.year}"><rect x="${(i * slot).toFixed(1)}" y="${top}" width="${slot.toFixed(1)}" height="${ph + bot}" fill="transparent"/>${body}</g>`
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
          s += `<text class="t-muted" x="0" y="${y + 15}" font-size="12">${r.year}</text>
            <rect class="hbar" style="--i:${i}" x="${lw}" y="${y + 4}" width="${bl.toFixed(1)}" height="${rh - 8}" fill="#fa901e"/>
            <text class="val t-val" style="--i:${i}" x="${(lw + bl + 6).toFixed(1)}" y="${y + 15}" font-size="12">${r.n}</text>`;
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

  /* ---------- horizontal bar rows (HTML labels so long names wrap; bars are inline SVG) ---------- */
  function hrows(el, rows, o) {
    const max = Math.max(...rows.map(r => r.n), 1);
    el.classList.add('hrows');
    if (o.cls) el.classList.add(o.cls);
    el.setAttribute('role', 'list');
    el.innerHTML = rows.map((r, i) => {
      const pct = (100 * r.n / max).toFixed(2);
      return `<div class="hrow" role="listitem">
        <div class="hrow-label">${o.num ? `<span class="rn">${r.key ? esc(r.key) : '–'}</span>` : ''}<span>${esc(r.label)}</span></div>
        <div class="hrow-bar"><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <rect x="0" y="0" width="100" height="10" fill="rgba(255,255,255,.07)"/>
          <rect class="hbar" style="--i:${i}" x="0" y="0" width="${pct}" height="10" fill="${r.key === null ? 'rgba(255,255,255,.45)' : '#fa901e'}"/></svg>
          <span class="v val" style="--i:${i}">${r.n}${o.share ? `<small>${(100 * r.n / o.share).toFixed(1)}%</small>` : ''}</span></div></div>`;
    }).join('');
    U.armChart(el);
  }

  function areas(el) {
    const A = D.areas();
    hrows(el, A.rows, { num: true, share: A.total });
    return A;
  }
  function journals(el, top) {
    const J = D.journals(top || 10);
    hrows(el, J.rows, { cls: 'journals' });
    return J;
  }

  /* ---------- people: one dot per person, coloured by computational / experimental ---------- */
  function dots(el, list) {
    const P = D.people(list);
    el.innerHTML = P.groups.map((g, gi) => {
      const r = 7, step = 20;
      const svgRows = Math.ceil(g.people.length / 12);
      const cols = Math.min(12, g.people.length);
      const w = cols * step, h = svgRows * step;
      const ds = g.people.map((p, i) => {
        const cx = (i % 12) * step + r + 1, cy = Math.floor(i / 12) * step + r + 1;
        const fill = p.type === 'computational' ? '#fa901e' : p.type === 'experimental' ? '#f3f4f8' : 'none';
        return `<circle class="dot" style="--i:${gi * 6 + i}" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${p.type ? '' : ' stroke="#a9aec6" stroke-width="2"'}><title>${esc(p.name)}${p.type ? ' (' + p.type + ')' : ''}</title></circle>`;
      }).join('');
      const comp = g.people.filter(p => p.type === 'computational').length, exp = g.people.filter(p => p.type === 'experimental').length;
      return `<div class="pc-row"><div class="g"><b>${g.people.length}</b>${esc(g.group)}</div>
        <svg width="${w + 2}" height="${h + 2}" viewBox="0 0 ${w + 2} ${h + 2}" role="img" aria-label="${esc(g.group)}: ${g.people.length} people, ${comp} computational, ${exp} experimental">${ds}</svg></div>`;
    }).join('');
    U.armChart(el);
    return P;
  }

  window.S8Charts = { D, years, areas, journals, dots, table };
})();
