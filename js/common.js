/* S8 Bold data — helpers shared by all pages. Every fact is read from window.CCEL (_shared/content.js). */
(function () {
  'use strict';
  const C = window.CCEL;
  const SH = '_shared/';
  const U = { C, SH };

  U.asset = p => (!p ? '' : /^https:\/\//i.test(p) ? p : SH + p);
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  // titles/authors/summaries carry only <sub>/<sup>; everything else is escaped
  U.rich = h => U.esc(h).replace(/&lt;(\/?)(sub|sup)&gt;/gi, '<$1$2>');
  U.plain = h => String(h == null ? '' : h).replace(/<[^>]+>/g, '');
  U.fmt = n => Number(n).toLocaleString('en-US');
  U.$ = (s, r) => (r || document).querySelector(s);
  U.$$ = (s, r) => [...(r || document).querySelectorAll(s)];

  /* ---------- derived, never stored ---------- */
  U.published = () => C.publications.filter(p => p.status === 'published');
  U.areaByNum = num => (C.research.areas || []).find(a => a.numeral === num) || null;
  U.byNo = (() => { let m; return no => { if (!m) { m = new Map(); C.publications.forEach(p => m.set(p.no, p)); } return m.get(no); }; })();
  // summary in the data begins with "I. <title> "; drop that echo so the title is not printed twice
  U.areaSummary = a => {
    let s = a.summary || '';
    const pre = `${a.numeral}. ${U.plain(a.title)}`;
    if (U.plain(s).startsWith(pre)) s = s.slice(pre.length).trim();
    return s;
  };
  U.people = list => (list || []).flatMap(g => g.people.map(p => ({ ...p, group: g.group })));
  U.splitName = n => { const m = /^(.*?)\s*\((.*)\)\s*$/.exec(n || ''); return m ? { name: m[1], note: m[2] } : { name: n || '', note: '' }; };
  U.statusLabel = s => ({ published: 'Published', submitted: 'Submitted', 'in revision': 'In revision', accepted: 'Accepted', 'in press': 'In press' }[s] || s);

  /* ---------- covers: attach only when DOI or URL matches ---------- */
  const normUrl = u => (u ? String(u).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^(www\.|dx\.)/, '')
    .replace(/#.*$/, '').replace(/\/+$/, '') : null);
  const doiIn = u => { const m = /(10\.\d{4,9}\/[^\s?#]+)/i.exec(u || ''); return m ? m[1].toLowerCase().replace(/\/+$/, '') : null; };
  let coverIdx = null;
  U.coverFor = (p, frontOnly) => {
    if (!coverIdx) {
      coverIdx = { doi: new Map(), url: new Map() };
      (C.cover_publications || []).forEach(c => {
        const d = (c.doi || '').toLowerCase() || doiIn(c.url);
        if (d && !coverIdx.doi.has(d)) coverIdx.doi.set(d, c);
        const u = normUrl(c.url);
        if (u && !coverIdx.url.has(u)) coverIdx.url.set(u, c);
      });
    }
    const d = (p.doi || '').toLowerCase() || doiIn(p.url);
    const c = (d && coverIdx.doi.get(d)) || (p.url && coverIdx.url.get(normUrl(p.url))) || null;
    if (c && frontOnly && c.kind !== 'front') return null;
    return c;
  };
  U.paperForCover = c => {
    const d = (c.doi || '').toLowerCase() || doiIn(c.url), u = normUrl(c.url);
    return C.publications.find(p => {
      const pd = (p.doi || '').toLowerCase() || doiIn(p.url);
      return (d && pd && d === pd) || (u && p.url && normUrl(p.url) === u);
    }) || null;
  };

  /* ---------- citations ---------- */
  U.link = p => (p.doi ? 'https://doi.org/' + p.doi : (p.url && /^https:\/\//i.test(p.url) ? p.url : null));
  let authorRe = new Map();
  U.authors = p => {
    let h = U.rich(p.authors || '');
    const names = (p.ccel_authors || []).filter(Boolean).map(U.esc).sort((a, b) => b.length - a.length);
    if (!names.length) return h;
    const key = names.join('|');
    if (!authorRe.has(key)) authorRe.set(key, new RegExp('(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![a-z])', 'g'));
    return h.replace(authorRe.get(key), '<strong>$1</strong>');
  };
  // "Journal Vol (Year) pages" = citation_tail minus the author list, the IF note and any highlight text
  U.source = p => {
    let t = p.citation_tail || '';
    const a = U.plain(p.authors || '');
    if (a && t.startsWith(a)) t = t.slice(a.length);
    else if (p.journal && t.lastIndexOf(p.journal) > 0) t = t.slice(t.lastIndexOf(p.journal));
    t = t.replace(/^[\s,]+/, '').replace(/\(\s*IF\s*=\s*[^)]*\)/i, ' ');
    if (p.highlight) t = t.split(p.highlight).join(' ');
    return t.replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '');
  };
  U.ifChip = p => (p.impact_factor == null ? '' :
    `<span class="chip if">IF ${U.esc(p.impact_factor)}${p.if_provisional === true ? ' <span class="prov" title="Provisional: the publication-year JIF is not released yet">provisional</span>' : ''}</span>`);
  U.areaChip = num => { const a = U.areaByNum(num); return a ? `<span class="chip area" title="${U.esc(U.plain(a.title))}">Area ${U.esc(num)}</span>` : ''; };
  U.citeHTML = (p, o = {}) => {
    const href = U.link(p);
    const title = href ? `<a href="${U.esc(href)}" target="_blank" rel="noopener">${U.rich(p.title)}</a>` : U.rich(p.title);
    const H = o.h || 'h3';
    const src = U.source(p);
    const cov = o.coverChip ? U.coverFor(p) : null;
    const meta = [
      p.status !== 'published' ? `<span class="chip st">${U.esc(U.statusLabel(p.status))}</span>` : '',
      o.areaChip !== false && p.area ? U.areaChip(p.area) : '',
      U.ifChip(p),
      p.highlight ? `<span class="chip hlt">${U.esc(p.highlight)}</span>` : '',
      cov ? `<span class="chip">${cov.kind === 'front' ? 'Journal cover' : 'Cover page'}</span>` : '',
      p.lab_led && o.labLed ? '<span class="chip">Lab-led</span>' : '',
      p.doi ? `<a class="doi" href="https://doi.org/${U.esc(p.doi)}" target="_blank" rel="noopener">doi:${U.esc(p.doi)}</a>` : ''
    ].filter(Boolean).join('');
    return `<${H} class="cite-title">${title}</${H}>
      <p class="cite-authors">${U.authors(p)}</p>
      ${src ? `<p class="cite-src">${U.esc(src)}</p>` : ''}
      ${meta ? `<p class="cite-meta">${meta}</p>` : ''}`;
  };
  U.coverThumb = (p, cls) => {
    const c = U.coverFor(p, true);
    if (!c) return '';
    return `<a class="cover-thumb ${cls || ''}" href="${U.esc(c.url || U.link(p) || U.asset(c.image))}" target="_blank" rel="noopener">
      <img src="${U.esc(U.asset(c.image))}" alt="Journal cover for: ${U.esc(U.plain(p.title))}" loading="lazy" decoding="async"></a>`;
  };

  /* ---------- person link icons: only links that are set ---------- */
  const ICON = {
    github: ['GitHub', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>'],
    linkedin: ['LinkedIn', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3zM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1zM7.1 20.5H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>'],
    cv: ['CV', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8"/></svg>'],
    scholar: ['Google Scholar', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 13.8 0 9.5 12 0l12 9.5-5.2 4.3A7.5 7.5 0 0 0 12 9.5c-3 0-5.5 1.7-6.8 4.3zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/></svg>'],
    homepage: ['Homepage', '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/></svg>']
  };
  U.icons = (links, name) => {
    if (!links) return '';
    const out = Object.keys(ICON).filter(k => links[k]).map(k => {
      const [label, svg] = ICON[k];
      const t = `${name} — ${label}`;
      return `<a href="${U.esc(U.asset(links[k]))}" target="_blank" rel="noopener" aria-label="${U.esc(t)}" title="${U.esc(t)}">${svg}</a>`;
    });
    return out.length ? `<span class="icons">${out.join('')}</span>` : '';
  };
  // professor.links uses google_scholar / cv
  U.profLinks = pr => ({ scholar: pr.links && pr.links.google_scholar, cv: pr.links && pr.links.cv });

  /* ---------- chart draw-in, once, when a chart enters the viewport ---------- */
  U.armChart = el => {
    if (!el || el.dataset.armed) return;
    el.dataset.armed = '1';
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('in'); return; }
    el.classList.add('armed');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { requestAnimationFrame(() => el.classList.add('in')); io.disconnect(); }
    }), { rootMargin: '0px 0px -12% 0px' });
    io.observe(el);
  };

  /* ---------- header: logo from data, compact state, mobile menu ---------- */
  U.initChrome = () => {
    const head = U.$('.site-head');
    U.$$('img.ccel-logo').forEach(i => { i.src = U.asset(C.lab.logo); i.alt = `${C.lab.name} (${C.lab.short})`; });
    U.$$('[data-lab-name]').forEach(e => { e.textContent = C.lab.name; });
    if (!head) return;
    const root = document.documentElement;
    // --hh = header height at the top of the page, --hh-c = compact height (sticky offsets, anchor margins)
    const setH = () => root.style.setProperty(head.classList.contains('is-compact') ? '--hh-c' : '--hh', head.offsetHeight + 'px');
    setH();
    window.addEventListener('resize', setH, { passive: true });
    head.addEventListener('transitionend', setH);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const c = window.scrollY > 24;
        if (c !== head.classList.contains('is-compact')) { head.classList.toggle('is-compact', c); setTimeout(setH, 320); }  // measure after the .25s logo transition
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const btn = U.$('.menu-btn', head);
    if (btn) {
      btn.addEventListener('click', () => {
        const open = !head.classList.contains('nav-open');
        head.classList.toggle('nav-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
      U.$$('.site-nav a', head).forEach(a => a.addEventListener('click', () => {
        head.classList.remove('nav-open'); btn.setAttribute('aria-expanded', 'false');
      }));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && head.classList.contains('nav-open')) { head.classList.remove('nav-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      });
    }
  };

  /* ---------- contact rows (landing footer and contact.html) ---------- */
  U.contactRows = () => {
    const k = C.contact;
    return [
      ['Address', U.esc(k.address)],
      ['Email', k.email ? `<a href="mailto:${U.esc(k.email)}">${U.esc(k.email)}</a>` : ''],
      ['Professor office', U.esc(k.professor_office)],
      ['Laboratory', U.esc(k.laboratory)],
      ['Student office', U.esc(k.student_office)]
    ].filter(r => r[1]).map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('');
  };
  // round v6: only the landing page keeps the contact block in its footer; other pages have the slim footer
  U.renderFooter = () => {
    const el = U.$('#contact-body');
    if (el) el.innerHTML = U.contactRows();
    const aff = U.$('#foot-aff');
    if (aff) aff.textContent = `${C.lab.name} · ${C.lab.affiliation}`;
  };

  // after data-driven sections render, land on the requested anchor (sections above changed height)
  U.settleHash = () => {
    if (!location.hash || location.hash.length < 2) return;
    let el = null;
    try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { el = null; }
    if (!el) return;
    const go = () => { if (window.scrollY < 40 || !U._userScrolled) el.scrollIntoView({ behavior: 'instant', block: 'start' }); };
    requestAnimationFrame(go);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(go));
    window.addEventListener('load', () => requestAnimationFrame(go), { once: true });
  };
  ['wheel', 'touchmove', 'keydown'].forEach(t => window.addEventListener(t, () => { U._userScrolled = true; }, { passive: true, once: true }));

  window.S8 = U;
})();
