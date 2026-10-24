/* S8 Bold data — Research page (round v5: moved here from the landing page). research.headline / intro / image and
   the five research.areas with figure, summary, keywords and key papers. Key papers = the professor's pins for the
   area, then recent highlights whose publications[].area matches (curation lists as given), at most 3. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$;
  U.initChrome();
  const R = C.research;

  $('#lead').innerHTML = U.rich(R.headline);
  $('#subnav').innerHTML = (R.areas || []).map(a => `<a href="#area-${esc(a.numeral)}"><span class="n">${esc(a.numeral)}</span>${U.rich(a.title)}</a>`).join('');
  $('#research-intro').innerHTML = (R.intro || []).map(t => `<p>${U.rich(t)}</p>`).join('');
  if (R.image) {
    $('#research-fig').innerHTML = `<img src="${esc(U.asset(R.image))}" alt="CCEL research approach: ${esc(U.plain(R.headline))}" decoding="async" width="3646" height="2240">`;
  }

  const pins = (C.curation && C.curation.selected_pins) || [];
  const hls = (C.curation && C.curation.recent_highlights) || [];
  const keyPapers = num => {
    const out = [];
    pins.filter(x => x.area === num).forEach(x => { const p = U.byNo(x.no); if (p) out.push([p, 'Selected']); });
    hls.forEach(no => { const p = U.byNo(no); if (p && p.area === num && !out.some(o => o[0] === p)) out.push([p, 'Recent highlight']); });
    return out.slice(0, 3);
  };
  $('#areas').innerHTML = (R.areas || []).map(a => {
    const kp = keyPapers(a.numeral);
    return `<article class="area anchor" id="area-${esc(a.numeral)}" aria-labelledby="area-${esc(a.numeral)}-h">
      <div class="area-fig">${a.image ? `<img src="${esc(U.asset(a.image))}" alt="${esc(U.plain(a.title))}" loading="lazy" decoding="async" width="480" height="480">` : ''}</div>
      <div>
        <div class="area-top"><span class="area-no" aria-hidden="true">${esc(a.numeral)}</span></div>
        <h2 class="area-title" id="area-${esc(a.numeral)}-h"><span class="sr-only">Area ${esc(a.numeral)}: </span>${U.rich(a.title)}</h2>
        <p class="area-sum">${U.rich(U.areaSummary(a))}</p>
        ${(a.keywords || []).length ? `<ul class="kw" aria-label="Keywords">${a.keywords.map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : ''}
        ${kp.length ? `<div class="keypapers"><h3 class="kp-h">Key papers</h3>${kp.map(([p, tag]) => {
          const href = U.link(p);
          return `<div class="kp">${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${U.rich(p.title)}</a>` : `<b>${U.rich(p.title)}</b>`}
            <p><span class="tag">${tag}</span> · ${esc(U.source(p))}</p></div>`;
        }).join('')}</div>` : ''}
        <p class="area-links"><a class="more" href="publications.html?area=${encodeURIComponent(a.numeral)}">Papers in area ${esc(a.numeral)}</a></p>
      </div></article>`;
  }).join('');

  U.renderFooter();
  U.settleHash();
})();
