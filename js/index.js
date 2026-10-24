/* S8 Bold data — landing page (round v5, lean): stage copy, News, Open Position, Selected publications, About CCEL,
   Contact. Every fact from window.CCEL; no counts or totals on this page. Research lives on research.html. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$;
  U.initChrome();
  document.title = `${C.lab.short} · ${C.lab.name}`;

  /* ---------- stage copy: lab name + the lab's tagline; phase B = research-area titles only ---------- */
  $('#hero-title').textContent = C.lab.name;
  $('#hero-tag').textContent = C.welcome.tagline;
  $('#hero-aff').textContent = C.lab.affiliation;
  $('#area-index').innerHTML = (C.research.areas || []).map(a => `<li><a href="research.html#area-${encodeURIComponent(a.numeral)}">
    <span class="ai-no" aria-hidden="true">${esc(a.numeral)}</span><span class="ai-t"><span class="sr-only">Research area ${esc(a.numeral)}: </span>${U.rich(a.title)}</span></a></li>`).join('');

  /* ---------- 01 news, 02 open position ---------- */
  $('#news-list').innerHTML = (C.welcome.news || []).map((n, i) => `<li><span class="nn" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
    <div>${n.date ? `<p class="nd">${esc(n.date)}</p>` : ''}<p>${esc(n.text)}</p></div></li>`).join('');
  $('#opening-ko').textContent = C.welcome.opening_ko || '';
  const pr = C.professor, mail = pr.email || C.contact.email;
  if (mail) $('#join-mail').innerHTML = `Applications and questions: ${esc(pr.name)}, <a href="mailto:${esc(mail)}">${esc(mail)}</a>`;

  /* ---------- 03 selected publications: curation.selected_pins, compact (title, one journal line, DOI) ---------- */
  const pins = (C.curation && C.curation.selected_pins) || [];
  $('#pins-aside').textContent = `Pinned by Prof. ${C.professor.name} and labelled by research area.`;
  $('#pins').innerHTML = pins.map((x, i) => {
    const p = U.byNo(x.no);
    if (!p) return '';
    const a = U.areaByNum(x.area), href = U.link(p);
    return `<li class="pc">
      <span class="pc-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <div>${a ? `<p class="pin-area">Area ${esc(a.numeral)} · ${esc(U.plain(a.title))}</p>` : ''}
        <h3 class="pc-title">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${U.rich(p.title)}</a>` : U.rich(p.title)}</h3>
        <p class="pc-src">${esc(U.source(p))}${p.doi ? ` · <a class="doi" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">doi:${esc(p.doi)}</a>` : ''}</p></div></li>`;
  }).join('');

  /* ---------- 04 about (Korean) ---------- */
  $('#about-ko').textContent = C.welcome.about_ko || '';

  U.renderFooter();
  U.settleHash();
})();
