/* S8 Bold data — People page: professor, current members by group, alumni with current positions.
   Names, groups and details are shown in English exactly as in the data. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$;
  U.initChrome();

  const members = U.people(C.members), alumni = U.people(C.alumni);
  const count = (list, t) => list.filter(p => p.type === t).length;
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const known = v => v && !/^n\/?a$/i.test(String(v).trim());   // the data writes "N/A" for an unknown position

  $('#lead').textContent = `Professor, current members and alumni of the ${C.lab.name}, ${C.lab.affiliation}.`;
  $('#subnav').innerHTML = [['professor', 'Professor']]
    .concat((C.members || []).map(g => ['g-' + slug(g.group), g.group]))
    .concat([['alumni', 'Alumni']]).concat(C.contact.group_photo ? [['group-photo', 'Group photo']] : [])
    .map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('');

  /* ---------- professor ---------- */
  const pr = C.professor;
  const edu = ((pr.sections && pr.sections.Education) || [])
    .filter(l => l && l.trim() && l.trim() !== 'Education')
    .map(l => l.replace(/^\s*✔\s*/, '').replace(/\s+,/g, ',').trim());
  const links = U.profLinks(pr);
  $('#prof-full').innerHTML = `${pr.photo ? `<img src="${esc(U.asset(pr.photo))}" alt="${esc(pr.name)}" width="240" height="309">` : ''}
    <div>
      <p class="pin-area">Principal investigator</p>
      <h2 id="prof-h">${esc(pr.name)}</h2>
      <p class="role">${esc(pr.title)}${(pr.roles || []).map(r => `<br><b>${esc(r)}</b>`).join('')}</p>
      <dl class="prof-meta">
        ${pr.email ? `<dt>Email</dt><dd><a href="mailto:${esc(pr.email)}">${esc(pr.email)}</a></dd>` : ''}
        ${C.contact.professor_office ? `<dt>Office</dt><dd>${esc(C.contact.professor_office)}</dd>` : ''}
        ${links.scholar ? `<dt>Google Scholar</dt><dd><a href="${esc(U.asset(links.scholar))}" target="_blank" rel="noopener">Profile</a></dd>` : ''}
        ${links.cv ? `<dt>Curriculum vitae</dt><dd><a href="${esc(U.asset(links.cv))}" target="_blank" rel="noopener">PDF</a></dd>` : ''}
        <dt>Links</dt><dd>${U.icons(links, pr.name)}</dd>
      </dl>
      ${edu.length ? `<div class="edu"><h3>Education</h3><ul>${edu.map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}
    </div>`;

  /* ---------- current members ---------- */
  const initials = n => n.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const typeBadge = t => (t ? `<span class="type ${esc(t)}"><i aria-hidden="true"></i>${t === 'computational' ? 'Computational' : 'Experimental'}</span>` : '');
  $('#member-groups').innerHTML = (C.members || []).map(g => {
    const c = count(g.people, 'computational'), e = count(g.people, 'experimental');
    return `<section class="grp anchor" id="g-${slug(g.group)}" aria-labelledby="g-${slug(g.group)}-h">
      <div class="grp-head"><h2 id="g-${slug(g.group)}-h">${esc(g.group)}</h2><span class="c num">${g.people.length}</span>
        <span class="split">${c} computational · ${e} experimental</span></div>
      <ul class="cards">${g.people.map(p => {
        const nm = U.splitName(p.name);
        return `<li class="card">
          <div class="ph">${p.photo ? `<img src="${esc(U.asset(p.photo))}" alt="${esc(nm.name)}" loading="lazy" decoding="async" width="400" height="500">` : `<span class="ini" aria-hidden="true">${esc(initials(nm.name))}</span>`}</div>
          <h3>${esc(nm.name)}</h3>
          ${nm.note ? `<p class="note">${esc(nm.note)}</p>` : ''}
          ${typeBadge(p.type)}
          ${p.research_area ? `<p class="ra">${esc(p.research_area)}</p>` : ''}
          ${(p.degrees || []).length ? `<ul class="deg">${p.degrees.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          ${p.email || p.office ? `<p class="ct">${p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}${p.email && p.office ? '<br>' : ''}${p.office ? esc(p.office) : ''}</p>` : ''}
          ${U.icons(p.links, nm.name)}
        </li>`;
      }).join('')}</ul></section>`;
  }).join('');

  /* ---------- alumni (text cards: name, current position, degrees) ---------- */
  $('#alumni-n').textContent = alumni.length;
  $('#alumni-split').textContent = `${count(alumni, 'computational')} computational · ${count(alumni, 'experimental')} experimental`;
  $('#alumni-groups').innerHTML = (C.alumni || []).map(g => `<div class="grp" style="margin-top:56px">
      <div class="grp-head" style="border-bottom-width:2px"><h3 style="font-size:22px">${esc(g.group)}</h3><span class="c num" style="font-size:22px">${g.people.length}</span></div>
      <ul class="alumni-grid">${g.people.map(p => {
        const nm = U.splitName(p.name);
        return `<li class="alum"><h3><span class="tdot ${p.type || 'na'}" title="${esc(p.type || 'not specified')}"></span>${esc(nm.name)}${U.icons(p.links, nm.name)}</h3>
          ${nm.note ? `<p class="note">${esc(nm.note)}</p>` : ''}
          ${known(p.current_position) ? `<p class="now">${esc(p.current_position)}</p>` : ''}
          ${(p.degrees || []).length ? `<p class="deg">${p.degrees.map(esc).join('<br>')}</p>` : ''}</li>`;
      }).join('')}</ul></div>`).join('');

  if (C.contact.group_photo) {
    $('#group-photo').innerHTML = `<img src="${esc(U.asset(C.contact.group_photo))}" alt="${esc(C.lab.name)} group photo" loading="lazy" decoding="async">
      <figcaption>${esc(C.lab.name)}</figcaption>`;
  }

  U.renderFooter();
  U.settleHash();
})();
