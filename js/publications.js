/* S8 Bold data — Publications: every entry newest first, grouped by year (publication_counts),
   client-side search and filters, plus Selected and Covers views. Data order is never re-sorted. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$, CH = window.S8Charts;
  U.initChrome();

  const P = C.publications;
  const pub = U.published(), PL = CH.D.pipeline();
  const pipeTotal = PL.reduce((s, r) => s + r.n, 0);
  const params = new URLSearchParams(location.search);
  const state = { q: params.get('q') || '', year: params.get('year') || '', status: params.get('status') || '', area: params.get('area') || '', lab: params.get('lab') === '1' };

  /* ---------- header numbers + year chart (click a bar to filter) ---------- */
  $('#lead').textContent = `${U.fmt(P.length)} entries in the lab's publication record, newest first. CCEL members are shown in bold.`;
  $('#page-nums').innerHTML = [
    [pub.length, 'published papers'],
    [pipeTotal, PL.map(r => r.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' or $1')],
    [(C.cover_publications || []).length, 'journal covers']
  ].map(([n, t]) => `<div><dt>${esc(t)}</dt><dd>${U.fmt(n)}</dd></div>`).join('');
  const ych = $('#ychart');
  const Y = CH.years(ych, {
    height: 260, clickable: true, selected: () => (state.year ? +state.year : null),
    onDraw: el => U.$$('.ybtn', el).forEach(g => {
      const pick = () => { state.year = state.year === g.dataset.year ? '' : g.dataset.year; $('#f-year').value = state.year; setTab('all'); apply(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    })
  }).Y;
  $('#ychart-cap').textContent = `Published papers per year, ${Y.min}–${Y.max}. Select a year to filter the list; papers not yet published are shown apart.`;

  /* ---------- filter controls ---------- */
  const years = [...new Set(P.map(p => p.year))].filter(Boolean).sort((a, b) => b - a);
  $('#f-year').innerHTML = '<option value="">All years</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  const statuses = [...new Set(P.map(p => p.status))];
  $('#f-status').innerHTML = '<option value="">All statuses</option>' + statuses.map(s => `<option value="${esc(s)}">${esc(U.statusLabel(s))}</option>`).join('');
  $('#f-area').innerHTML = '<option value="">All research areas</option>' +
    (C.research.areas || []).map(a => `<option value="${esc(a.numeral)}">Area ${esc(a.numeral)}: ${esc(U.plain(a.title))}</option>`).join('') +
    (P.some(p => !p.area) ? '<option value="none">Not assigned to an area</option>' : '');
  $('#q').value = state.q; $('#f-year').value = state.year; $('#f-status').value = state.status; $('#f-area').value = state.area; $('#f-lab').checked = state.lab;

  /* ---------- list: year groups; submitted / in-revision runs get a sub-heading, order unchanged ---------- */
  const counts = C.publication_counts || {};
  const cat = s => (s === 'submitted' || s === 'in revision' ? s : 'main');
  const groups = [];
  P.forEach(p => {
    let g = groups[groups.length - 1];
    if (!g || g.year !== p.year) { g = { year: p.year, runs: [] }; groups.push(g); }
    let r = g.runs[g.runs.length - 1];
    if (!r || r.cat !== cat(p.status)) { r = { cat: cat(p.status), items: [] }; g.runs.push(r); }
    r.items.push(p);
  });
  const runTitle = (g, r) => (r.cat === 'submitted' ? 'Submitted' : r.cat === 'in revision' ? 'In revision'
    : g.runs.some(x => x.cat !== 'main') ? 'Published and in press' : '');
  $('#list').innerHTML = groups.map(g => {
    const total = counts[String(g.year)] != null ? counts[String(g.year)] : g.runs.reduce((s, r) => s + r.items.length, 0);
    return `<section class="year-group" data-year="${g.year}" aria-labelledby="y-${g.year}">
      <div class="year-head"><h2 id="y-${g.year}">${g.year}</h2><span class="yc" data-total="${total}">${total} ${total === 1 ? 'entry' : 'entries'}</span></div>
      ${g.runs.map(r => `<div class="run">${runTitle(g, r) ? `<h3 class="sub-head">${runTitle(g, r)}</h3>` : ''}
        <ol>${r.items.map(p => `<li class="entry${p.status !== 'published' ? ' pending' : ''}" data-no="${p.no}">
          <span class="eno" aria-label="Number ${p.no}">${p.no}</span>
          <div>${U.citeHTML(p, { coverChip: true, labLed: false })}</div>
          <div>${U.coverThumb(p)}</div></li>`).join('')}</ol></div>`).join('')}
    </section>`;
  }).join('');

  const hay = new Map(P.map(p => [p.no, [U.plain(p.title), U.plain(p.authors), p.journal || '', p.citation_tail || '', p.doi || ''].join(' ').toLowerCase()]));
  const entries = U.$$('#list .entry').map(el => ({ el, p: U.byNo(+el.dataset.no) }));
  function apply() {
    const terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    entries.forEach(({ el, p }) => {
      const ok = (!state.year || String(p.year) === state.year) && (!state.status || p.status === state.status) &&
        (!state.area || (state.area === 'none' ? !p.area : p.area === state.area)) && (!state.lab || p.lab_led) &&
        terms.every(t => hay.get(p.no).includes(t));
      el.hidden = !ok; if (ok) shown++;
    });
    U.$$('#list .run').forEach(r => { r.hidden = !r.querySelector('.entry:not([hidden])'); });
    U.$$('#list .year-group').forEach(g => {
      const n = g.querySelectorAll('.entry:not([hidden])').length, yc = g.querySelector('.yc'), t = +yc.dataset.total;
      g.hidden = n === 0;
      yc.textContent = n === t ? `${t} ${t === 1 ? 'entry' : 'entries'}` : `${n} of ${t} entries shown`;
    });
    $('#empty').hidden = shown > 0;
    $('#count').innerHTML = `Showing <b>${shown}</b> of ${P.length}`;
    if (ych._redraw) ych._redraw();
    const q = new URLSearchParams();
    if (state.q) q.set('q', state.q); if (state.year) q.set('year', state.year); if (state.status) q.set('status', state.status);
    if (state.area) q.set('area', state.area); if (state.lab) q.set('lab', '1');
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  }
  let t;
  $('#q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value; apply(); }, 120); });
  $('#f-year').addEventListener('change', e => { state.year = e.target.value; apply(); });
  $('#f-status').addEventListener('change', e => { state.status = e.target.value; apply(); });
  $('#f-area').addEventListener('change', e => { state.area = e.target.value; apply(); });
  $('#f-lab').addEventListener('change', e => { state.lab = e.target.checked; apply(); });

  /* ---------- Selected view: curation lists as given ---------- */
  const pins = (C.curation && C.curation.selected_pins) || [], hls = (C.curation && C.curation.recent_highlights) || [];
  $('#sel-sub').textContent = `Pinned by Prof. ${C.professor.name} and labelled by research area.`;
  $('#pins').innerHTML = pins.map((x, i) => {
    const p = U.byNo(x.no); if (!p) return '';
    const a = U.areaByNum(x.area);
    return `<li class="pin"><span class="pin-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div>${a ? `<p class="pin-area">Area ${esc(a.numeral)} · ${esc(U.plain(a.title))}</p>` : ''}${U.citeHTML(p, { areaChip: false })}</div>
      <div>${U.coverThumb(p)}</div></li>`;
  }).join('');
  $('#hl').innerHTML = hls.map(no => {
    const p = U.byNo(no); if (!p) return '';
    return `<li class="hl"><div>${U.coverThumb(p)}</div><div>${U.citeHTML(p, {})}</div></li>`;
  }).join('');
  $('#hl-sub').textContent = `${hls.length} papers, chosen automatically by the rule below${C.curation.updated_at ? ` · list updated ${C.curation.updated_at}` : ''}`;
  $('#rules').textContent = C.curation.rules || '';

  /* ---------- Covers view: complete covers; back/inside cover pages only here ---------- */
  const covers = C.cover_publications || [];
  const fronts = covers.filter(c => c.kind === 'front').length;
  $('#cov-sub').textContent = `${covers.length} covers: ${fronts} front covers and ${covers.length - fronts} back or inside cover pages.`;
  $('#cover-grid').innerHTML = covers.map(c => {
    const p = U.paperForCover(c);
    const label = p ? U.plain(p.title) : 'Journal cover';
    return `<li><figure><a href="${esc(c.url || U.asset(c.image))}" target="_blank" rel="noopener">
      <img src="${esc(U.asset(c.image))}" alt="Journal cover: ${esc(label)}" loading="lazy" decoding="async"></a>
      <figcaption>${c.kind === 'back_page' ? '<b>Back or inside cover page</b><br>' : ''}${p ? `${U.rich(p.title)}<br><b>${esc(p.journal || '')}${p.journal ? ', ' : ''}${p.year}</b>` : ''}</figcaption></figure></li>`;
  }).join('');

  /* ---------- tabs (+ #selected / #covers deep links) ---------- */
  const tabs = ['all', 'selected', 'covers'];
  function toPanels(force) {
    const band = $('#tools').nextElementSibling, hc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hh-c')) || 0;
    const sticky = getComputedStyle($('#tools')).position === 'sticky';
    const y = band.getBoundingClientRect().top + window.scrollY - hc - (sticky ? $('#tools').offsetHeight : $('#tools').offsetHeight + 8);
    if (force === true || window.scrollY > y) window.scrollTo({ top: y, behavior: 'instant' });
  }
  function setTab(name, focus) {
    tabs.forEach(n => {
      const on = n === name, b = $('#tab-' + n);
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $('#panel-' + n).hidden = !on;
      if (on && focus) b.focus();
    });
    $('#filters').hidden = name !== 'all';
    $('#count').hidden = name !== 'all';
  }
  tabs.forEach((n, i) => {
    const b = $('#tab-' + n);
    b.addEventListener('click', () => { setTab(n); toPanels(); history.replaceState(null, '', location.pathname + location.search + (n === 'all' ? '' : '#' + n)); });
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); setTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  const h = location.hash.replace('#', '');
  if (h === 'selected' || h === 'highlights') setTab('selected');
  else if (h === 'covers') setTab('covers');
  apply();
  U.renderFooter();
  if (h === 'selected' || h === 'covers' || h === 'highlights') {
    const go = () => toPanels(true);
    requestAnimationFrame(go); window.addEventListener('load', () => requestAnimationFrame(go), { once: true });
  } else U.settleHash();
})();
