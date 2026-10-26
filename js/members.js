/* S8 Bold data — Members page (round v6): current members by group (card grid), alumni behind the Alumni button.
   The professor has his own page (professor.html). Names, groups and details are shown in English exactly as in the
   data; the alumni current_position is shown as given, "N/A" included. The view follows the URL hash: #alumni or an
   alumni group id (a-...) shows the alumni, anything else the current members. */
(function () {
  'use strict';
  const U = window.S8, C = U.C, esc = U.esc, $ = U.$;
  U.initChrome();

  const alumni = U.people(C.alumni);
  const count = (list, t) => list.filter(p => p.type === t).length;
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  $('#lead').innerHTML = `Current members of the ${esc(C.lab.name)}, led by <a href="professor.html">${esc(C.professor.name)}</a>. Former members are under Alumni.`;
  const pills = (groups, pre) => (groups || []).map(g => `<a href="#${pre}-${slug(g.group)}">${esc(g.group)}</a>`).join('');
  $('#jump-members').innerHTML = pills(C.members, 'g');
  $('#jump-alumni').innerHTML = pills(C.alumni, 'a');
  const legend = '<span class="type computational"><i aria-hidden="true"></i>Computational</span><span class="type experimental"><i aria-hidden="true"></i>Experimental</span>';
  $('#legend-m').innerHTML = legend;
  $('#legend-a').innerHTML = legend;

  /* ---------- current members (cards) ---------- */
  const initials = n => n.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const typeBadge = t => (t ? `<span class="type ${esc(t)}"><i aria-hidden="true"></i>${t === 'computational' ? 'Computational' : 'Experimental'}</span>` : '');
  $('#member-groups').innerHTML = (C.members || []).map(g => {
    const c = count(g.people, 'computational'), e = count(g.people, 'experimental');
    return `<section class="grp anchor" id="g-${slug(g.group)}" aria-labelledby="g-${slug(g.group)}-h">
      <div class="grp-head"><h3 id="g-${slug(g.group)}-h">${esc(g.group)}</h3><span class="c num">${g.people.length}</span>
        <span class="split">${c} computational · ${e} experimental</span></div>
      <ul class="cards">${g.people.map(p => {
        const nm = U.splitName(p.name);
        return `<li class="card">
          <div class="ph">${p.photo ? `<img src="${esc(U.asset(p.photo))}" alt="${esc(nm.name)}" loading="lazy" decoding="async" width="400" height="500">` : `<span class="ini" aria-hidden="true">${esc(initials(nm.name))}</span>`}</div>
          <h4>${esc(nm.name)}</h4>
          ${nm.note ? `<p class="note">${esc(nm.note)}</p>` : ''}
          ${typeBadge(p.type)}
          ${p.research_area ? `<p class="ra">${esc(p.research_area)}</p>` : ''}
          ${(p.degrees || []).length ? `<ul class="deg">${p.degrees.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          ${p.email || p.office ? `<p class="ct">${p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : ''}${p.email && p.office ? '<br>' : ''}${p.office ? esc(p.office) : ''}</p>` : ''}
          ${U.icons(p.links, nm.name)}
        </li>`;
      }).join('')}</ul></section>`;
  }).join('');

  /* ---------- alumni (text cards: name, current position as given, degrees) ---------- */
  $('#alumni-n').textContent = alumni.length;
  $('#alumni-split').textContent = `${count(alumni, 'computational')} computational · ${count(alumni, 'experimental')} experimental`;
  $('#alumni-groups').innerHTML = (C.alumni || []).map(g => `<section class="grp alum-grp anchor" id="a-${slug(g.group)}" aria-labelledby="a-${slug(g.group)}-h">
      <div class="grp-head"><h3 id="a-${slug(g.group)}-h">${esc(g.group)}</h3><span class="c num">${g.people.length}</span></div>
      <ul class="alumni-grid">${g.people.map(p => {
        const nm = U.splitName(p.name);
        return `<li class="alum"><h4><span class="tdot ${p.type || 'na'}" title="${esc(p.type || 'not specified')}"></span>${esc(nm.name)}${U.icons(p.links, nm.name)}</h4>
          ${nm.note ? `<p class="note">${esc(nm.note)}</p>` : ''}
          ${p.current_position ? `<p class="now">${esc(p.current_position)}</p>` : ''}
          ${(p.degrees || []).length ? `<p class="deg">${p.degrees.map(esc).join('<br>')}</p>` : ''}</li>`;
      }).join('')}</ul></section>`).join('');

  /* ---------- current members / alumni view, kept in sync with the hash ---------- */
  const views = { members: $('#members'), alumni: $('#alumni') };
  const viewOf = id => (id === 'alumni' || /^a-/.test(id)) ? 'alumni' : 'members';
  const hashId = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ''; } };
  let view = null;
  const show = v => {
    if (v === view) return false;
    view = v;
    views.members.hidden = v !== 'members';
    views.alumni.hidden = v !== 'alumni';
    $('#jump-members').hidden = v !== 'members';
    $('#jump-alumni').hidden = v !== 'alumni';
    U.$$('.viewswitch a').forEach(a => { if (a.dataset.view === v) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    document.title = `${v === 'alumni' ? 'Alumni' : 'Members'} · CCEL`;
    return true;
  };
  // bring a view's heading on screen only when it is not already visible below the header
  const reveal = el => {
    if (!el) return;
    const h = el.querySelector('h2, h3') || el, r = h.getBoundingClientRect();
    const top = U.$('.site-head').getBoundingClientRect().bottom;
    if (r.top < top + 4 || r.top > window.innerHeight * (window.innerWidth < 768 ? 0.5 : 0.75)) el.scrollIntoView({ block: 'start' });
  };
  // view buttons switch in place and add a history entry, so Back returns to the previous view
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-view]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    e.preventDefault();
    const v = a.dataset.view;
    if (location.hash !== '#' + v) history.pushState(null, '', '#' + v);
    show(v);
    reveal(views[v]);
  });
  window.addEventListener('popstate', () => show(viewOf(hashId())));
  window.addEventListener('hashchange', () => {
    const id = hashId();
    if (show(viewOf(id)) && id) reveal(document.getElementById(id));
  });
  show(viewOf(hashId()));

  U.renderFooter();
  U.settleHash();
})();
