/* S8 Bold data — Professor page (round v6): the professor only, and only what source/prof.html shows (user rule
   2026-10-26): photo, name, rank, role, department, address line, email, Google Citation and Curriculum Vitae links,
   then Education, Experience and Editorial & Professional Service with their dates. No office, phone, bio, counts or
   extra links. Everything from window.CCEL.professor (education / experience / service) and contact.address. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$;
  U.initChrome();
  const pr = C.professor;

  /* ---------- profile ---------- */
  // "Jeong Woo Han, Ph.D." is the heading of the legacy page (the professor.sections key); otherwise the name
  const fullName = Object.keys(pr.sections || {}).find(k => k.startsWith(pr.name + ',')) || pr.name;
  // title = "Professor, Department of ..., Seoul National University" -> rank line + department line
  const cut = (pr.title || '').indexOf(', ');
  const rank = cut > 0 ? pr.title.slice(0, cut) : (pr.title || ''), dept = cut > 0 ? pr.title.slice(cut + 2) : '';
  // contact.address repeats the department; the legacy page shows the department once, then the street address
  let addr = C.contact.address || '';
  if (dept && addr.startsWith(dept)) addr = addr.slice(dept.length).replace(/^[\s,]+/, '');
  const links = U.profLinks(pr);
  $('#prof-full').innerHTML = `${pr.photo ? `<img src="${esc(U.asset(pr.photo))}" alt="${esc(pr.name)}" width="413" height="531">` : ''}
    <div>
      <h2 id="prof-h">${esc(fullName)}</h2>
      <p class="role">${rank ? `<b>${esc(rank)}</b>` : ''}${(pr.roles || []).map(r => `<br><b>${esc(r)}</b>`).join('')}${dept ? `<br>${esc(dept)}` : ''}</p>
      <dl class="prof-meta">
        ${addr ? `<dt>Address</dt><dd>${esc(addr)}</dd>` : ''}
        ${pr.email ? `<dt>Email</dt><dd><a href="mailto:${esc(pr.email)}">${esc(pr.email)}</a></dd>` : ''}
        ${links.scholar || links.cv ? `<dt>Links</dt><dd class="prof-links">${links.scholar ? `<a href="${esc(U.asset(links.scholar))}" target="_blank" rel="noopener">Google Citation</a>` : ''}${links.cv ? `<a href="${esc(U.asset(links.cv))}" target="_blank" rel="noopener">Curriculum Vitae</a>` : ''}</dd>` : ''}
      </dl>
    </div>`;

  /* ---------- Education, Experience, Service: professor.education / experience / service ---------- */
  const period = s => String(s || '').replace(/\s+-\s+/g, ' – ');
  const cvHtml = list => list.map(b => `<li class="cv-row">
      <div class="cv-org">${b.org ? `<h3>${esc(b.org)}</h3>` : ''}${b.place ? `<p class="cv-place">${esc(b.place)}</p>` : ''}</div>
      <ul class="cv-items">${b.items.map(it => `<li>
        ${it.date ? `<p class="cv-date">${esc(period(it.date))}</p>` : ''}
        <div><p class="cv-text">${esc(it.text)}</p>${(it.notes || []).map(n => `<p class="cv-note">${esc(n)}</p>`).join('')}</div></li>`).join('')}</ul></li>`).join('');
  const edu = (pr.education || []).map(e => ({
    org: e.institution, place: e.location,
    items: [{ text: `${e.degree}${e.honors ? ` (${e.honors})` : ''}, ${e.field}`, date: e.date,
      notes: [e.thesis ? `“${e.thesis}”` : '', e.advisor ? `Advisor: ${e.advisor}` : ''].filter(Boolean) }]
  }));
  const exp = (pr.experience || []).map(x => ({
    org: x.institution, place: x.location,
    items: (x.roles || []).map(r => ({ text: r.unit ? `${r.title}, ${r.unit}` : r.title, date: r.period }))
  }));
  const svc = (pr.service || []).map(s => ({ org: s.organization, items: [{ text: s.title, date: s.period }] }));
  [['#education', '#edu-list', edu], ['#experience', '#exp-list', exp], ['#service', '#svc-list', svc]].forEach(([sec, list, data]) => {
    if (data.length) $(list).innerHTML = cvHtml(data); else $(sec).hidden = true;
  });

  U.renderFooter();
  U.settleHash();
})();
