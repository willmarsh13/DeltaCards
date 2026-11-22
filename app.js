(() => {
  const FLEET = window.FLEET || [];
  const META = window.FLEET_META || {};
  const byId = Object.fromEntries(FLEET.map(t => [t.id, t]));

  // Family mode: one card per major version (A330, 757, CRJ). Each family card looks like a
  // type to the rest of the app, with every member's photos pooled and tagged with its exact type.
  const FAMS = (window.FAMILIES || []).map(f => {
    const ms = f.members.map(id => byId[id]).filter(Boolean);
    const one = ms.length === 1 ? ms[0] : null;
    return {
      id: 'f:' + f.id, isFamily: true, maker: f.maker, model: f.name, members: ms,
      body: ms[0] && ms[0].body, fleet: ms[0] && ms[0].fleet,
      operator: [...new Set(ms.map(m => m.operator))].join(' / '),
      aka: f.aka || (one ? one.aka : ''),
      cheats: f.cheats || (one ? one.cheats : []),
      confusedWith: (f.confusedWith || []).map(x => 'f:' + x),
      photos: ms.flatMap(m => m.photos.map(p => ({ ...p, typeId: m.id })))
    };
  }).filter(f => f.members.length);
  FAMS.forEach(f => { byId[f.id] = f; });
  const $ = id => document.getElementById(id);

  // ---------- persistence (best effort) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tr:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('tr:' + k, JSON.stringify(v)); } catch {} }
  };

  const state = {
    mode: store.get('mode', 'cards'),
    level: store.get('level', 'variant'), // 'variant' = exact type (A330-300), 'family' = major version (A330)
    filter: store.get('filter', 'all'),
    cheats: store.get('cheats', false),
    // deck holds one entry per showing: { id, result: true|false|null, photo, choice, requeue }
    deck: [], idx: 0, flipped: false, answered: false,
    past: { right: 0, missed: 0 }, // totals from finished rounds
    stats: store.get('stats', {}),
    bags: {}, photo: null
  };

  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const full = t => `${t.maker} ${t.model}`;
  const pool = () => state.level === 'family' && FAMS.length ? FAMS : FLEET;

  function matches(t, f) {
    if (f === 'all') return true;
    if (f === 'narrow' || f === 'wide') return t.body === f;
    if (f === 'mainline' || f === 'regional') return t.fleet === f;
    return t.maker === f;
  }

  const entry = id => ({ id, result: null, photo: null, choice: null, requeue: null });

  function buildDeck(keepScore) {
    if (keepScore) { const s = roundScore(); state.past.right += s.right; state.past.missed += s.missed; }
    else state.past = { right: 0, missed: 0 };
    state.deck = shuffle(pool().filter(t => matches(t, state.filter)).map(t => t.id)).map(entry);
    state.idx = 0;
  }

  // Each type keeps a shuffled "bag" of photos so you cycle through all of them before repeats.
  function nextPhoto(id, avoid) {
    const t = byId[id];
    let bag = state.bags[id];
    if (!bag || !bag.length) {
      bag = shuffle(t.photos.map((_, i) => i));
      if (avoid != null && bag.length > 1 && bag[0] === avoid) bag.push(bag.shift());
      state.bags[id] = bag;
    }
    return bag.shift();
  }

  const cur = () => state.deck[state.idx];
  const current = () => cur() && byId[cur().id];

  // ---------- rendering ----------
  function render(instant) {
    const t = current(), e = cur();
    if (!t) return;
    // A quiz card you already answered stays answered; a self-graded card can be re-graded.
    const locked = state.mode === 'quiz' && e.choice != null;
    state.flipped = locked; state.answered = locked;
    $('card').classList.toggle('is-flipped', locked);
    // Revisiting a card shows the same photo you graded.
    if (e.photo == null) e.photo = nextPhoto(t.id);
    showPhoto(t, e.photo);
    renderCheats(t);
    // Render the back after the flip-back animation finishes so the answer never flashes.
    clearTimeout(render._t);
    if (instant || locked || state.mode === 'quiz') renderBack(t);
    else render._t = setTimeout(() => renderBack(t), 280);
    if (state.mode === 'quiz') renderQuiz(t, e); else $('quiz').hidden = true;
    renderMark();
    syncControls();
    $('pos').textContent = `${state.idx + 1} / ${state.deck.length}`;
    preload();
  }

  function showPhoto(t, i) {
    state.photo = i;
    if (cur()) cur().photo = i;
    const p = t.photos[i];
    const img = $('photo');
    img.classList.remove('is-loaded');
    img.onload = () => img.classList.add('is-loaded');
    img.onerror = () => { // dead link: quietly try another photo of the same type
      if (t.photos.length > 1) showPhoto(t, nextPhoto(t.id, i));
    };
    img.src = p.src;
    $('creditFront').innerHTML = `Photo: ${esc(p.author)} · <a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.license)}</a>`;
  }

  function preload() {
    const ne = state.deck[state.idx + 1];
    if (!ne || ne.photo != null) return;
    const nid = ne.id;
    const bag = state.bags[nid] || (state.bags[nid] = shuffle(byId[nid].photos.map((_, i) => i)));
    const img = new Image();
    img.src = byId[nid].photos[bag[0]].src;
  }

  function renderCheats(t) {
    $('cheatList').innerHTML = t.cheats.map(c => `<li>${esc(c)}</li>`).join('');
    const cw = (t.confusedWith || []).map(id => byId[id]).filter(Boolean);
    $('confused').innerHTML = cw.length ? `Often confused with <b>${cw.map(x => esc(x.model)).join('</b>, <b>')}</b>.` : '';
    applyCheats();
  }

  function applyCheats() {
    $('cheats').classList.toggle('is-open', state.cheats);
    document.querySelector('.card .front').classList.toggle('cheats-on', state.cheats);
    $('cheats').setAttribute('aria-hidden', String(!state.cheats));
    $('cheatToggle').setAttribute('aria-pressed', String(state.cheats));
  }

  function dateBlock(label, d) {
    return `<li>${esc(d.note)}${d.ok ? '' : ' <span class="unv" title="Not confirmed from a primary source">unconfirmed</span>'}</li>`;
  }

  const yr = d => /^[\d~]/.test(d.year) ? esc(d.year) : '—';

  function renderBack(t) {
    if (t.isFamily) return renderFamilyBack(t);
    const p = t.photos[state.photo] || t.photos[0];
    const seats = t.seats.map(s => `<dd><b>${s.total}</b> · ${esc(s.split)}</dd>`).join('');
    const stat = (v, k) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`;
    $('back').innerHTML = `
      <div class="back-inner">
        <div class="ident">
          <div>
            <div class="maker">${esc(t.maker)}</div>
            <h2 class="model">${esc(t.model)}</h2>
            <div class="aka">${esc(t.aka || '')}</div>
            <div class="operator">Flown by <b>${esc(t.operator)}</b></div>
          </div>
          <div class="codes">ICAO type<strong>${esc(t.icao)}</strong>${t.fleet === 'regional' ? '<span class="dc">Delta Connection</span>' : 'Delta mainline'} · ${t.body === 'wide' ? 'Widebody' : 'Narrowbody'}</div>
        </div>

        <div>
          <div class="label">Where it flies</div>
          <p class="mission-tag">${esc(t.mission.tag)}</p>
          <p class="mission-text">${esc(t.mission.text)}</p>

          <div class="label">${t.fleet === 'regional' ? 'In Delta Connection colors' : 'At Delta'}</div>
          <div class="timeline">
            <div><div class="cap">First</div><div class="yr">${yr(t.first)}</div></div>
            <div class="line" aria-hidden="true"></div>
            <div style="text-align:right"><div class="cap">Most recent</div><div class="yr">${yr(t.latest)}${t.latest.ok ? '' : '<span class="unv" title="Not confirmed from a primary source">?</span>'}</div></div>
          </div>
          <ul class="tl-notes">${dateBlock('First', t.first)}${dateBlock('Most recent', t.latest)}</ul>

          <div class="stats">
            ${stat(t.inService, 'In fleet')}
            ${stat(t.onOrder || '—', 'On order')}
            ${stat(t.seats[0].total, t.seats.length > 1 ? 'Seats (main config)' : 'Seats')}
          </div>
          ${t.countNote ? `<p class="count-note">${esc(t.countNote)}</p>` : ''}
        </div>

        <div>
          <div class="label">Specs</div>
          <dl class="specs">
            <dt>Engines</dt><dd>${esc(t.engines)}</dd>
            <dt>Seating</dt>${seats}
            ${t.range ? `<dt>Range (Delta Flight Museum)</dt><dd>${esc(t.range)}</dd>` : ''}
          </dl>
          <div class="label">Good to know</div>
          <ul class="facts">${t.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        </div>

        <div class="back-foot">
          This photo: ${esc(p.reg)}, ${p.year} · ${esc(p.author)} · <a href="${esc(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a> · <a href="${esc(p.licenseUrl || p.page)}" target="_blank" rel="noopener">${esc(p.license)}</a>
        </div>
      </div>`;
    $('back').scrollTop = 0;
  }

  function renderFamilyBack(f) {
    const p = f.photos[state.photo] || f.photos[0];
    const exact = byId[p.typeId];
    const total = f.members.reduce((n, m) => n + (m.inService || 0), 0);
    const order = f.members.reduce((n, m) => n + (m.onOrder || 0), 0);
    const y = d => /^[\d~]/.test(d.year) ? esc(d.year) : '?';
    const yrs = m => {
      const shaky = [m.first, m.latest].some(d => !d.ok && /^[\d~]/.test(d.year));
      return `${y(m.first)}–${y(m.latest)}${shaky ? '<span class="unv" title="Not confirmed from a primary source">?</span>' : ''}`;
    };
    const rows = f.members.map(m => `
      <tr${m === exact ? ' class="is-this"' : ''}>
        <td><b>${esc(m.model)}</b>${m === exact ? ' <span class="this-tag">this photo</span>' : ''}</td>
        <td class="num">${m.inService}</td>
        <td class="num">${m.seats[0].total}</td>
        <td>${esc(m.mission.tag)}</td>
        <td class="num">${yrs(m)}</td>
      </tr>`).join('');
    // Variant facts are written about that variant, so label them when a family has several.
    const facts = f.members.flatMap(m => m.facts.map(x => f.members.length > 1 ? `${m.model}: ${x}` : x)).slice(0, 6);
    const stat = (v, k) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`;
    $('back').innerHTML = `
      <div class="back-inner">
        <div class="ident">
          <div>
            <div class="maker">${esc(f.maker)}</div>
            <h2 class="model">${esc(f.model)}</h2>
            <div class="aka">${esc(f.aka || '')}</div>
            <div class="operator">This photo: <b>${esc(exact.maker)} ${esc(exact.model)}</b> · flown by ${esc(exact.operator)}</div>
          </div>
          <div class="codes">${f.members.length > 1 ? 'ICAO types' : 'ICAO type'}<strong>${f.members.map(m => esc(m.icao)).join(' / ')}</strong>${f.fleet === 'regional' ? '<span class="dc">Delta Connection</span>' : 'Delta mainline'} · ${f.body === 'wide' ? 'Widebody' : 'Narrowbody'}</div>
        </div>

        <div class="fam-wide">
          <div class="label">${f.fleet === 'regional' ? 'In Delta Connection colors' : 'At Delta'}</div>
          <table class="variants">
            <thead><tr><th>Variant</th><th class="num">In fleet</th><th class="num">Seats</th><th>Where it flies</th><th class="num">First–latest</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="stats">
            ${stat(total, 'In fleet, all variants')}
            ${stat(order || '—', 'On order')}
            ${stat(f.members.length, f.members.length === 1 ? 'Variant' : 'Variants')}
          </div>
        </div>

        <div class="fam-wide">
          <div class="label">Good to know</div>
          <ul class="facts">${facts.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          <p class="count-note">"?" means not confirmed from a primary source. Switch to <b>Exact variant</b> for full specs on each one.</p>
        </div>

        <div class="back-foot">
          This photo: ${esc(p.reg)}, ${p.year} · ${esc(p.author)} · <a href="${esc(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a> · <a href="${esc(p.licenseUrl || p.page)}" target="_blank" rel="noopener">${esc(p.license)}</a>
        </div>
      </div>`;
    $('back').scrollTop = 0;
  }

  // ---------- quiz ----------
  function distractors(t) {
    const cw = (t.confusedWith || []).filter(id => byId[id]);
    const same = shuffle(pool().filter(x => x.id !== t.id && x.body === t.body && !cw.includes(x.id)).map(x => x.id));
    const rest = shuffle(pool().filter(x => x.id !== t.id && !cw.includes(x.id) && !same.includes(x.id)).map(x => x.id));
    return shuffle(cw).concat(same, rest).slice(0, 3);
  }

  function renderQuiz(t, e) {
    const opts = e.opts || (e.opts = shuffle([t.id, ...distractors(t)]));
    const q = $('quiz');
    q.hidden = false;
    q.innerHTML = opts.map((id, i) => `
      <button class="choice" data-id="${id}">
        <span class="n">${i + 1}</span>
        <span><span class="t">${esc(byId[id].model)}</span><br><span class="m">${esc(byId[id].maker)}</span></span>
      </button>`).join('');
    q.querySelectorAll('.choice').forEach(b => b.addEventListener('click', () => answer(b.dataset.id)));
    if (e.choice != null) markChoices(t.id, e.choice);
  }

  function markChoices(rightId, chosen) {
    $('quiz').querySelectorAll('.choice').forEach(b => {
      b.disabled = true;
      if (b.dataset.id === rightId) b.classList.add('right');
      else if (b.dataset.id === chosen) b.classList.add('wrong');
    });
  }

  function answer(id) {
    if (state.answered) return;
    const t = current();
    state.answered = true;
    const ok = id === t.id;
    cur().choice = id;
    markChoices(t.id, id);
    record(ok);
    flip(true);
    syncControls();
  }

  // ---------- scoring ----------
  // Each showing of a card has one result. Grading it again replaces the old result
  // (in the session score and in the all-time weak-spots stats) instead of adding to it.
  function record(ok) {
    const e = cur();
    const s = state.stats[e.id] || (state.stats[e.id] = { seen: 0, right: 0 });
    if (e.result !== null) { s.seen--; if (e.result) s.right--; }
    s.seen++; if (ok) s.right++;
    e.result = ok;
    store.set('stats', state.stats);
    renderScore();
    renderWeak();
    renderMark();
  }

  function roundScore() {
    let right = 0, missed = 0;
    for (const e of state.deck) { if (e.result === true) right++; else if (e.result === false) missed++; }
    return { right, missed };
  }

  function renderScore() {
    const r = roundScore();
    $('score').textContent = `${state.past.right + r.right} right, ${state.past.missed + r.missed} missed`;
  }

  function renderMark() {
    const e = cur(), m = $('mark');
    if (!e || e.result === null) { m.hidden = true; return; }
    m.hidden = false;
    m.className = 'mark ' + (e.result ? 'is-got' : 'is-miss');
    m.textContent = e.result ? '✓ Got it' : '✗ Missed';
  }

  function grade(ok) {
    if (!state.flipped || state.mode === 'quiz') return;
    const e = cur();
    if (e.result === ok) { go(1); return; } // same answer again: just move on
    record(ok);
    // Missed cards come back a few cards later. Flip a miss to a got and the repeat goes away.
    if (!ok && !e.requeue) {
      e.requeue = entry(e.id);
      state.deck.splice(Math.min(state.idx + 4, state.deck.length), 0, e.requeue);
    } else if (ok && e.requeue) {
      const i = state.deck.indexOf(e.requeue);
      if (i > state.idx && e.requeue.result === null) state.deck.splice(i, 1);
      e.requeue = null;
    }
    go(1);
  }

  function renderWeak() {
    const rows = pool().map(t => ({ t, s: state.stats[t.id] })).filter(r => r.s && r.s.seen)
      .map(r => ({ ...r, pct: r.s.right / r.s.seen })).sort((a, b) => a.pct - b.pct || b.s.seen - a.s.seen);
    if (!rows.length) { $('weak').innerHTML = ''; return; }
    $('weak').innerHTML = `
      <h2><span>Your weak spots</span><button id="resetStats">Reset</button></h2>
      <table>${rows.slice(0, 8).map(r => {
        const pct = Math.round(r.pct * 100);
        const cls = pct < 50 ? 'lo' : pct < 80 ? 'mid' : '';
        return `<tr><td>${esc(full(r.t))}</td><td><div class="meter"><span class="${cls}" style="width:${pct}%"></span></div></td><td class="num">${r.s.right}/${r.s.seen}</td></tr>`;
      }).join('')}</table>`;
    $('resetStats').onclick = () => { state.stats = {}; store.set('stats', {}); renderWeak(); };
  }

  // ---------- controls ----------
  function flip(force) {
    if (state.mode === 'quiz' && !state.answered && force !== true) return;
    state.flipped = force === true ? true : !state.flipped;
    if (state.flipped) renderBack(current());
    $('card').classList.toggle('is-flipped', state.flipped);
    syncControls();
  }

  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Slide the old card out and the new one in, in the direction you're moving.
  function go(d) {
    if (!state.deck.length) return;
    const next = state.idx + d;
    if (next < 0) { nudge(); return; }
    const card = $('card');
    clearTimeout(go._t);
    card.classList.remove('out-next', 'out-prev', 'in-next', 'in-prev');
    const swap = () => {
      state.idx = next;
      if (state.idx >= state.deck.length) buildDeck(true);
      card.classList.add('no-flip-anim'); // snap back to the photo side while hidden
      render(true);
      void card.offsetWidth;
      card.classList.remove('no-flip-anim', 'out-next', 'out-prev');
    };
    if (reduceMotion()) { swap(); return; }
    const dir = d > 0 ? 'next' : 'prev';
    card.classList.add('out-' + dir);
    go._t = setTimeout(() => {
      swap();
      card.classList.add('in-' + dir);
      go._t = setTimeout(() => card.classList.remove('in-' + dir), 260);
    }, 160);
  }

  function nudge() {
    const card = $('card');
    card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
  }

  function syncControls() {
    const quiz = state.mode === 'quiz';
    $('flip').hidden = quiz || state.flipped;
    $('miss').hidden = quiz || !state.flipped;
    $('got').hidden = quiz || !state.flipped;
    const r = cur() ? cur().result : null;
    $('miss').classList.toggle('is-chosen', r === false);
    $('got').classList.toggle('is-chosen', r === true);
    if (quiz && state.answered) $('flip').hidden = true;
  }

  function setMode(m) {
    state.mode = m; store.set('mode', m);
    buildDeck(true); renderScore(); // new round; your session totals carry over
    document.querySelectorAll('.mode').forEach(b => b.classList.toggle('is-on', b.dataset.mode === m));
    render();
  }

  function setLevel(l) {
    state.level = l; store.set('level', l);
    syncLevel();
    buildDeck(true); render(); renderScore(); renderWeak();
  }

  function syncLevel() {
    document.querySelectorAll('.lvl').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === state.level)));
    $('allBtn').textContent = `All ${pool().length}`;
  }

  function setFilter(f) {
    state.filter = f; store.set('filter', f);
    document.querySelectorAll('.filter').forEach(b => b.classList.toggle('is-on', b.dataset.filter === f));
    buildDeck(true); render(); renderScore();
  }

  $('card').addEventListener('click', e => {
    if (e.target.closest('button, a, .cheats')) return;
    flip();
  });
  $('flip').onclick = () => flip();
  $('next').onclick = () => go(1);
  $('prev').onclick = () => go(-1);
  $('got').onclick = () => grade(true);
  $('miss').onclick = () => grade(false);
  $('cheatToggle').onclick = e => { e.stopPropagation(); state.cheats = !state.cheats; store.set('cheats', state.cheats); applyCheats(); };
  $('newPhoto').onclick = e => { e.stopPropagation(); const t = current(); showPhoto(t, nextPhoto(t.id, state.photo)); };
  document.querySelectorAll('.mode').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  document.querySelectorAll('.filter').forEach(b => b.onclick = () => setFilter(b.dataset.filter));
  document.querySelectorAll('.lvl').forEach(b => b.onclick = () => setLevel(b.dataset.level));

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'enter') { if (e.target.closest && e.target.closest('button') && k === 'enter') return; e.preventDefault(); flip(); }
    else if (k === 'arrowright') go(1);
    else if (k === 'arrowleft') go(-1);
    else if (k === 'c') $('cheatToggle').click();
    else if (k === 'p') $('newPhoto').click();
    else if (k === 'k') grade(true);
    else if (k === 'j') grade(false);
    else if (state.mode === 'quiz' && /^[1-4]$/.test(k)) {
      const b = $('quiz').querySelectorAll('.choice')[+k - 1]; if (b) b.click();
    }
  });

  // ---------- boot ----------
  syncLevel();
  $('asOf').textContent = META.asOf || '';
  if (META.onOrder) $('asOf').textContent += ` On order but not yet flying (not in the deck): ${META.onOrder.map(o => `${o.model} ×${o.count}`).join(', ')}.`;
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('is-on', b.dataset.filter === state.filter));
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('is-on', b.dataset.mode === state.mode));
  buildDeck();
  render();
  renderWeak();
})();
