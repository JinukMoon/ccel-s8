/* S8 Bold data — landing page. Renders every section from window.CCEL. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$, CH = window.S8Charts;
  U.initChrome();
  document.title = `${C.lab.short} · ${C.lab.name}`;

  const pub = U.published();
  const Y = CH.D.perYear(), PL = CH.D.pipeline();
  const members = U.people(C.members), alumni = U.people(C.alumni);
  const pipeTotal = PL.reduce((s, r) => s + r.n, 0);
  const pipeWords = PL.map(r => r.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' or $1');

  /* ---------- stage copy ---------- */
  $('#hero-title').innerHTML = U.rich(C.research.headline);
  $('#hero-meta').innerHTML = `<span>${esc(C.lab.name)}</span><span>${esc(C.lab.affiliation)}</span>`;
  const big = [
    [pub.length, `papers published, <span class="nw">${Y.min}–${Y.max}</span>`],
    [members.length, 'current members'],
    [alumni.length, 'alumni'],
    [(C.cover_publications || []).length, 'journal covers']
  ];
  // captions are fixed copy plus numbers, so they are inserted as markup (the year range must not break)
  $('#bignums').innerHTML = big.map(([n, t]) => `<div><dt>${t}</dt><dd>${U.fmt(n)}</dd></div>`).join('');

  /* ---------- 01 at a glance ---------- */
  $('#glance-aside').textContent = `Counted in the browser from the lab's data file: ${U.fmt(C.publications.length)} publication entries, ${members.length} members, ${alumni.length} alumni.`;
  $('#f-years-sub').textContent = `${Y.min}–${Y.max}. Papers that are ${pipeWords} are shown apart.`;
  $('#f-years-stats').innerHTML = `<div class="stat"><b class="num">${U.fmt(Y.total)}</b><span>published</span></div>` +
    (pipeTotal ? `<div class="stat sm"><b class="num">${pipeTotal}</b><span>${esc(pipeWords)}</span></div>` : '');
  CH.years($('#chart-years'));
  const A = CH.areas($('#chart-areas'));
  $('#f-areas-sub').textContent = `Share of the ${U.fmt(A.total)} published papers.`;
  const J = CH.journals($('#chart-journals'), 10);
  $('#f-jour-sub').textContent = `Top ${J.rows.length} of ${J.distinct} journals, by number of published papers.`;
  if (J.missing) $('#f-jour-note').textContent = `${J.missing} published papers have no journal recorded in the data and are not counted here.`;
  const PM = CH.dots($('#chart-members'), C.members), PA = CH.dots($('#chart-alumni'), C.alumni);
  $('#n-members').textContent = PM.total;
  $('#n-alumni').textContent = PA.total;
  if (PM.na + PA.na) $('#k-na').hidden = false;

  /* ---------- 02 research ---------- */
  $('#research-statement').textContent = C.welcome.tagline;
  $('#research-intro').innerHTML = (C.research.intro || []).map(t => `<p>${U.rich(t)}</p>`).join('');
  if (C.research.image) {
    $('#research-fig').innerHTML = `<img src="${esc(U.asset(C.research.image))}" alt="${esc(C.research.headline)}" loading="lazy" decoding="async">`;
  }
  const pins = (C.curation && C.curation.selected_pins) || [];
  const hls = (C.curation && C.curation.recent_highlights) || [];
  const keyPapers = num => {
    const out = [];
    pins.filter(x => x.area === num).forEach(x => { const p = U.byNo(x.no); if (p) out.push([p, 'Selected']); });
    hls.forEach(no => { const p = U.byNo(no); if (p && p.area === num) out.push([p, 'Recent highlight']); });
    return out.slice(0, 3);
  };
  $('#areas').innerHTML = (C.research.areas || []).map(a => {
    const n = A.rows.find(r => r.key === a.numeral);
    const cnt = n ? n.n : 0, pct = A.total ? 100 * cnt / A.total : 0;
    const kp = keyPapers(a.numeral);
    return `<article class="area" id="area-${esc(a.numeral)}" aria-labelledby="area-${esc(a.numeral)}-h">
      <div class="area-fig">${a.image ? `<img src="${esc(U.asset(a.image))}" alt="${esc(U.plain(a.title))}" loading="lazy" decoding="async" width="480" height="480">` : ''}</div>
      <div>
        <div class="area-top"><span class="area-no" aria-hidden="true">${esc(a.numeral)}</span>
          <div class="area-stat"><p><b class="num">${cnt}</b> published papers · ${pct.toFixed(1)}% of all</p>
          <svg viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="100" height="4" fill="rgba(255,255,255,.12)"/><rect width="${pct.toFixed(2)}" height="4" fill="#fa901e"/></svg></div></div>
        <h3 class="area-title" id="area-${esc(a.numeral)}-h"><span class="sr-only">Area ${esc(a.numeral)}: </span>${U.rich(a.title)}</h3>
        <p class="area-sum">${U.rich(U.areaSummary(a))}</p>
        ${(a.keywords || []).length ? `<ul class="kw" aria-label="Keywords">${a.keywords.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
        ${kp.length ? `<div class="keypapers"><h4>Key papers</h4>${kp.map(([p, tag]) => {
          const href = U.link(p);
          return `<div class="kp">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${U.rich(p.title)}</a>` : `<b>${U.rich(p.title)}</b>`}
            <p><span class="tag">${tag}</span> · ${esc(p.journal || U.source(p))}, ${p.year}</p></div>`;
        }).join('')}</div>` : ''}
        <p class="area-links"><a class="more" href="publications.html?area=${encodeURIComponent(a.numeral)}">All ${cnt} papers in area ${esc(a.numeral)}</a></p>
      </div></article>`;
  }).join('');

  /* ---------- 03 selected publications + recent highlights ---------- */
  $('#pins-aside').textContent = `Pinned by Prof. ${C.professor.name} and labelled by research area.`;
  $('#pins').innerHTML = pins.map((x, i) => {
    const p = U.byNo(x.no);
    if (!p) return '';
    const a = U.areaByNum(x.area);
    return `<li class="pin">
      <span class="pin-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div>${a ? `<p class="pin-area">Area ${esc(a.numeral)} · ${esc(U.plain(a.title))}</p>` : ''}${U.citeHTML(p, { areaChip: false })}</div>
      <div>${U.coverThumb(p)}</div></li>`;
  }).join('');
  $('#hl').innerHTML = hls.map(no => {
    const p = U.byNo(no);
    if (!p) return '';
    const href = U.link(p);
    return `<li class="hl"><div>${U.coverThumb(p)}</div><div>
      ${p.highlight ? `<p class="hl-note">${esc(p.highlight)}</p>` : ''}
      <h3 class="cite-title">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${U.rich(p.title)}</a>` : U.rich(p.title)}</h3>
      <p class="cite-authors">${U.authors(p)}</p>
      <p class="cite-src">${esc(U.source(p))}</p>
      <p class="cite-meta">${p.area ? U.areaChip(p.area) : ''}${U.ifChip(p)}${p.doi ? `<a class="doi" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">doi:${esc(p.doi)}</a>` : ''}</p>
      </div></li>`;
  }).join('');
  $('#hl-sub').textContent = `${hls.length} papers, chosen automatically by the rule below${C.curation.updated_at ? ` · list updated ${C.curation.updated_at}` : ''}`;
  $('#rules').textContent = C.curation.rules || '';
  $('#all-pubs').textContent = `All ${U.fmt(C.publications.length)} publications`;

  /* ---------- 04 people preview ---------- */
  const pr = C.professor;
  $('#prof').innerHTML = `${pr.photo ? `<img src="${esc(U.asset(pr.photo))}" alt="${esc(pr.name)}" loading="lazy" width="200" height="257">` : ''}
    <div><h3>${esc(pr.name)}</h3>
      <p class="role">${esc(pr.title)}${(pr.roles || []).map(r => `<br><b>${esc(r)}</b>`).join('')}</p>
      <p class="contact-line">${pr.email ? `<a class="more" href="mailto:${esc(pr.email)}">${esc(pr.email)}</a>` : ''}${U.icons(U.profLinks(pr), pr.name)}</p></div>`;
  $('#groups').innerHTML = (C.members || []).map(g => `<div><h3><b>${g.people.length}</b>${esc(g.group)}</h3><ul>${g.people.map(p => {
    const nm = U.splitName(p.name);
    return `<li><span class="tdot ${p.type || 'na'}" title="${esc(p.type || 'not specified')}"></span><span>${esc(nm.name)}</span>${U.icons(p.links, nm.name)}${nm.note ? `<span class="note">${esc(nm.note)}</span>` : ''}</li>`;
  }).join('')}</ul></div>`).join('');

  /* ---------- 05 news ---------- */
  $('#news-list').innerHTML = (C.welcome.news || []).map((n, i) => `<li><span class="nn" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    <div>${n.date ? `<p class="count">${esc(n.date)}</p>` : ''}<p>${esc(n.text)}</p></div></li>`).join('');

  /* ---------- 06 join ---------- */
  $('#opening-ko').textContent = C.welcome.opening_ko || '';
  $('#about-ko').textContent = C.welcome.about_ko || '';
  const mail = pr.email || C.contact.email;
  if (mail) $('#join-mail').innerHTML = `Contact Prof. ${esc(pr.name)}: <a href="mailto:${esc(mail)}">${esc(mail)}</a>`;

  U.renderFooter();
  U.settleHash();
})();
