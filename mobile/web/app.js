/* LearnLoop phone app: home screen, parent setup, children, phone permissions and report.
 * The learning screen itself is the extension's learn.html, run through shim.js. */
(async () => {
  'use strict';
  const C = window.LLCore, CUR = window.LLCurriculum, S = window.LLStore;
  const $ = (id) => document.getElementById(id);
  const main = $('main');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const today = () => C.dayKey(Date.now());
  const SUBJ = { maths: 'Maths', english: 'English', reasoning: 'Reasoning (11+)' };
  // Apps whose time counts. More can be added later, once each is tested.
  const APPS = [{ pkg: 'com.google.android.youtube', name: 'YouTube' }, { pkg: 'com.google.android.apps.youtube.kids', name: 'YouTube Kids' }];
  const PARENT_MINUTES = 15;
  let db = S.load();
  let parentUntil = 0;
  const isParent = () => Date.now() < parentUntil;
  const mins = (s) => Math.floor((s || 0) / 60);
  const save = () => { S.save(db); configureNative(); };

  // Tell Android what to watch and for how long. Android keeps counting even when this screen is closed.
  function configureNative() {
    const child = db.children.find(c => c.id === db.activeChildId);
    db.phone = db.phone || { packages: APPS.map(a => a.pkg) };
    S.native('configure', JSON.stringify({ childId: child ? child.id : null, name: child ? child.name : null,
      entSec: child ? child.rules.ent * 60 : 0, capSec: child ? child.rules.cap * 60 : 0, packages: db.phone.packages }));
  }
  // Copy Android's measured app time into the shared report data
  function syncActivity() {
    const act = S.nativeJson('getActivity') || {};
    for (const [day, perChild] of Object.entries(act)) for (const [cid, sec] of Object.entries(perChild)) {
      const a = db.activity[cid] = db.activity[cid] || {};
      a[day] = Object.assign({ watchedSec: 0, backgroundSec: 0, pipSec: 0, lockedSec: 0, gaps: 0 }, a[day] || {}, { watchedSec: sec });
    }
    S.save(db);
  }

  route(); window.addEventListener('hashchange', route);
  window.LLRoute = route; // Android calls this when it opens the app for learning
  function route() {
    db = S.load();
    const mode = location.hash.slice(1);
    $('tabs').hidden = !isParent();
    if (!db.parent) return firstRun();
    if (mode === 'countdown') return countdown();
    if (mode === 'rest') return rest();
    if (mode === 'learn') { location.href = 'learn.html'; return; }
    if (isParent()) return show(mode || 'setup');
    home();
  }

  // ---------- child home ----------
  function home() {
    const child = db.children.find(c => c.id === db.activeChildId);
    const st = S.nativeJson('getState');
    main.innerHTML = `<div class="stack"><div class="panel hello">
      ${child ? `<h2>Hi ${esc(child.name)}!</h2>` : '<h2>Hello!</h2>'}
      ${child && st ? `<p class="big" style="margin:0">Video today: ${mins(st.daySec)} of ${mins(st.capSec)} minutes.${st.state === 'learning' ? ' It is learning time now.' : st.state === 'rest' ? ' That is all the video for today.' : ` Learning comes after ${Math.max(0, Math.ceil((st.entSec - st.balanceSec) / 60))} more minute${Math.ceil((st.entSec - st.balanceSec) / 60) === 1 ? '' : 's'}.`}</p>` : ''}
      ${child && st && st.state === 'learning' ? '<a class="btn block" href="learn.html">Start learning</a>' : ''}
      ${child ? '<a class="btn block ghost" href="learn.html?practice=1" id="practise">Practise (no video needed)</a>' : '<p>A grown-up needs to choose who uses this phone.</p>'}
    </div>
    <button class="btn ghost" id="grown">Grown-ups</button></div>`;
    $('grown').onclick = () => pinScreen();
  }

  // ---------- the gentle countdown before learning ----------
  function countdown() {
    const child = db.children.find(c => c.id === db.activeChildId); if (!child) return home();
    const st = S.nativeJson('getState') || { balanceSec: child.rules.ent * 60 };
    const subs = C.SUBJECTS.filter(s => child.subjects[s]); const next = ((db.mobile || {}).next || {})[child.id] || 0;
    const subject = subs.length ? SUBJ[subs[next % subs.length]].replace(' (11+)', '') : 'Maths';
    const m = Math.max(1, Math.round((st.balanceSec || 0) / 60));
    const text = `Well done, ${child.name}! You've watched for ${m} minute${m === 1 ? '' : 's'}. Let's try some ${subject} together.`;
    main.innerHTML = `<div class="countdown"><div class="panel hello"><h2>${esc(text)}</h2><div class="ring" id="ring">10</div><button class="btn block" id="go">Start now</button></div></div>`;
    if (child.readAloud) S.native('speak', text);
    let n = 10; const t = setInterval(() => { n--; const r = $('ring'); if (r) r.textContent = n; if (n <= 0) { clearInterval(t); location.href = 'learn.html'; } }, 1000);
    $('go').onclick = () => { clearInterval(t); location.href = 'learn.html'; };
  }
  function rest() {
    const child = db.children.find(c => c.id === db.activeChildId);
    main.innerHTML = `<div class="countdown"><div class="panel hello"><h2>That's all the video for today${child ? `, ${esc(child.name)}` : ''}</h2>
      <p class="big">How about drawing, building or playing outside?</p><a class="btn block ghost" href="learn.html?practice=1">Practise instead</a></div></div>`;
  }

  // ---------- first run: PIN, recovery code, first child ----------
  function firstRun() {
    main.innerHTML = `<div class="stack"><div class="panel"><h2>Welcome to LearnLoop</h2>
      <p>LearnLoop counts time in YouTube on this phone. After the time you choose, it opens a short Maths, English or reasoning session. Then your child can go back to their video.</p>
      <label class="field"><span>Choose a parent PIN (4 to 8 digits)</span><input id="pin" inputmode="numeric" type="password" autocomplete="new-password"></label>
      <button class="btn block" id="save">Save PIN</button><span id="err" class="err"></span></div></div>`;
    $('save').onclick = async () => {
      const pin = $('pin').value.trim(); if (!C.validPin(pin)) { $('err').textContent = 'Use 4 to 8 digits.'; return; }
      $('save').disabled = true; $('save').textContent = 'Saving…';
      const code = await C.setParentPin(db, pin); db.createdAt = Date.now(); db.phone = { packages: APPS.map(a => a.pkg) }; S.save(db);
      parentUntil = Date.now() + PARENT_MINUTES * 60000;
      main.innerHTML = `<div class="stack"><div class="panel"><h2>Write down your recovery code</h2>
        <p>If you forget your PIN, this code lets you set a new one. It is shown only once.</p><div class="code" id="code">${code}</div>
        <label class="checks"><input type="checkbox" id="saved"> I have written it down</label><button class="btn block" id="go" disabled>Continue</button></div></div>`;
      $('saved').onchange = () => { $('go').disabled = !$('saved').checked; };
      $('go').onclick = () => { $('tabs').hidden = false; location.hash = 'kids'; route(); };
    };
  }

  // ---------- parent PIN ----------
  function pinScreen(msg) {
    main.innerHTML = `<div class="stack"><div class="panel"><h2>Grown-ups only</h2>${msg ? `<p class="note">${esc(msg)}</p>` : ''}
      <label class="field"><span>Parent PIN</span><input id="pin" inputmode="numeric" type="password"></label>
      <button class="btn block" id="go">Open</button><span id="err" class="err"></span>
      <details><summary>I forgot my PIN</summary><label class="field"><span>Recovery code</span><input id="rc" autocapitalize="characters"></label>
      <label class="field"><span>New PIN</span><input id="np" inputmode="numeric" type="password"></label><button class="btn small" id="rec">Set new PIN</button></details>
      <button class="btn ghost" id="back">Back</button></div></div>`;
    $('back').onclick = () => { location.hash = ''; route(); };
    $('go').onclick = async () => {
      const r = await C.checkPin(db, $('pin').value.trim(), Date.now()); S.save(db);
      if (r.ok) { parentUntil = Date.now() + PARENT_MINUTES * 60000; $('tabs').hidden = false; location.hash = 'setup'; route(); }
      else $('err').textContent = r.reason === 'wait' ? `Too many tries. Wait ${r.waitSec} seconds.` : 'That PIN is not right.';
    };
    $('rec').onclick = async () => {
      if (!(await C.checkRecovery(db, $('rc').value))) { $('err').textContent = 'That recovery code is not right.'; return; }
      if (!C.validPin($('np').value.trim())) { $('err').textContent = 'Use 4 to 8 digits for the new PIN.'; return; }
      const code = await C.setParentPin(db, $('np').value.trim()); S.save(db);
      main.innerHTML = `<div class="stack"><div class="panel"><h2>New PIN saved</h2><p>Your new recovery code:</p><div class="code">${code}</div><button class="btn block" id="ok">Done</button></div></div>`;
      $('ok').onclick = () => pinScreen();
    };
  }

  // ---------- parent area ----------
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => {
    if (b.dataset.v === 'lock') { parentUntil = 0; location.hash = ''; route(); return; }
    location.hash = b.dataset.v;
  });
  function show(view) {
    if (!isParent()) return pinScreen('Locked after 15 minutes. Enter your PIN again.');
    parentUntil = Date.now() + PARENT_MINUTES * 60000;
    document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.v === view)));
    if (view === 'kids') return kids(); if (view === 'report') return report(); return setup();
  }

  function setup() {
    const st = S.nativeJson('getState') || {};
    const perm = { usage: S.native('hasUsageAccess'), overlay: S.native('canDrawOverlays'), notif: S.native('notificationsAllowed') };
    const onPhone = perm.usage !== null;
    const item = (ok, title, text, btn) => `<div class="check ${ok ? 'done' : ''}"><span class="dot">${ok ? '✓' : '!'}</span><div><b>${title}</b><p class="note">${text}</p>${!ok && btn ? btn : ''}</div></div>`;
    const pk = (db.phone && db.phone.packages) || [];
    main.innerHTML = `<div class="stack">
      ${onPhone ? '' : '<p class="note">This is a preview in a browser. Phone permissions appear when LearnLoop runs on an Android phone.</p>'}
      <div class="panel"><h3>1. Allow LearnLoop to work</h3>
        ${item(perm.usage, 'Usage access', 'Lets LearnLoop see how long YouTube is on screen. It does not see what is being watched.', '<button class="btn small" data-n="openUsageAccess">Open settings</button>')}
        ${item(perm.overlay, 'Display over other apps', 'Lets LearnLoop open the learning screen when the time is up, even while YouTube is open.', '<button class="btn small" data-n="openOverlaySettings">Open settings</button>')}
        ${item(perm.notif, 'Notifications', 'Android shows a small "LearnLoop is on" notice while it is counting. Android requires it.', '<button class="btn small" data-n="requestNotifications">Allow</button>')}
      </div>
      <div class="panel"><h3>2. Who uses this phone?</h3>
        ${db.children.length ? `<select id="who">${db.children.map(c => `<option value="${esc(c.id)}" ${c.id === db.activeChildId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` : '<p>Add a child first in <b>Children</b>.</p>'}
        <div class="checks">${APPS.map(a => `<label><input type="checkbox" data-pkg="${a.pkg}" ${pk.includes(a.pkg) ? 'checked' : ''}> Count time in ${a.name}</label>`).join('')}</div></div>
      <div class="panel"><h3>3. Start counting</h3>
        <p class="note">${st.monitoring ? `LearnLoop is counting. ${esc(st.name || '')}: ${mins(st.balanceSec)} of ${mins(st.entSec)} minutes since the last learning, ${mins(st.daySec)} of ${mins(st.capSec)} today.` : 'LearnLoop is not counting yet.'}</p>
        <button class="btn block" id="mon">${st.monitoring ? 'Stop counting' : 'Start counting'}</button>
        ${st.state === 'learning' ? '<button class="btn ghost" id="skip">Skip this learning</button>' : ''}
        <button class="btn ghost" id="reset">Reset today's video total</button><span id="msg" class="ok"></span></div>
      <div class="panel"><h3>Good to know</h3><p class="note" style="margin:0">LearnLoop measures time with YouTube on screen, not whether a video is playing. It cannot see video titles and cannot return to the exact point in a video. It is a family tool, not a lock: a child can still use other apps or another phone.</p></div></div>`;
    main.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { S.native(b.dataset.n); setTimeout(setup, 1500); });
    if ($('who')) $('who').onchange = () => { db.activeChildId = $('who').value; save(); setup(); };
    if (!db.activeChildId && db.children.length) { db.activeChildId = db.children[0].id; save(); }
    main.querySelectorAll('[data-pkg]').forEach(el => el.onchange = () => {
      const set = new Set(pk); if (el.checked) set.add(el.dataset.pkg); else set.delete(el.dataset.pkg); db.phone = { packages: [...set] }; save();
    });
    $('mon').onclick = () => {
      if (!st.monitoring && !(perm.usage && perm.overlay) && onPhone) { $('msg').className = 'err'; $('msg').textContent = 'Allow usage access and display over other apps first.'; return; }
      configureNative(); S.native(st.monitoring ? 'stopMonitor' : 'startMonitor'); setTimeout(setup, 600);
    };
    if ($('skip')) $('skip').onclick = () => { S.native('skipLearning'); db.overrides.push({ childId: db.activeChildId, at: Date.now(), kind: 'skipLearning' }); S.save(db); setup(); };
    $('reset').onclick = () => { S.native('resetToday'); db.overrides.push({ childId: db.activeChildId, at: Date.now(), kind: 'resetToday' }); S.save(db); setup(); };
  }

  let draft = null;
  function kids() {
    if (!draft) draft = JSON.parse(JSON.stringify(db.children.length ? db.children : [C.newChild({ id: 'c' + Date.now(), name: '', today: today() })]));
    const rerender = () => setTimeout(kids, 0);
    const num = (c, i, k, label, min, max) => `<label class="field"><span>${label}</span><input type="number" min="${min}" max="${max}" data-i="${i}" data-r="${k}" value="${c.rules[k]}"></label>`;
    main.innerHTML = `<div class="stack">${draft.map((c, i) => `<div class="panel">
      <label class="field"><span>Name shown to the child</span><input data-i="${i}" data-k="name" value="${esc(c.name)}" maxlength="30"></label>
      <label class="field"><span>Birthday (optional, stays on this phone)</span><input type="date" data-i="${i}" data-k="birthday" value="${esc(c.birthday || '')}" max="${today()}"></label>
      ${c.birthday ? `<p class="note" style="margin:0">${esc(CUR.schoolYearFor(c.birthday, today()).label)}. Questions start at ${esc(CUR.YEAR_LABEL[C.startYearFrom(c.birthday, today())])} level.</p>` : ''}
      <div class="checks">${C.SUBJECTS.map(sj => `<label><input type="checkbox" data-i="${i}" data-s="${sj}" ${c.subjects[sj] ? 'checked' : ''}> ${SUBJ[sj]}</label>`).join('')}</div>
      <div class="row2">${num(c, i, 'ent', 'Video minutes before learning', 1, 60)}${num(c, i, 'max', 'Learning: most minutes', 1, 30)}${num(c, i, 'min', 'Learning: fewest minutes', 0, 30)}${num(c, i, 'cap', 'Daily video limit (minutes)', 5, 240)}</div>
      <div class="checks"><label><input type="checkbox" data-i="${i}" data-k="readAloud" ${c.readAloud ? 'checked' : ''}> Read questions aloud</label><label><input type="checkbox" data-i="${i}" data-k="typing" ${c.typing ? 'checked' : ''}> Allow typed answers</label></div>
      ${c.subjects.english ? `<label class="field"><span>Our spelling list (optional)</span><textarea data-i="${i}" data-sp rows="2" placeholder="because, friend, Monday">${esc((c.spellings || []).join(', '))}</textarea></label>` : ''}
      ${draft.length > 1 ? `<button class="btn small ghost" data-del="${i}">Remove ${esc(c.name || 'this child')}</button>` : ''}
    </div>`).join('')}
    <button class="btn ghost" id="add">Add another child</button><button class="btn block" id="save">Save</button><span id="msg" class="ok"></span></div>`;
    main.querySelectorAll('[data-k]').forEach(el => el.onchange = () => {
      const c = draft[el.dataset.i], k = el.dataset.k; c[k] = el.type === 'checkbox' ? el.checked : (el.value || null);
      if (k === 'birthday' && c.birthday) { const fresh = C.newChild({ id: c.id, name: c.name || 'x', birthday: c.birthday, today: today() }); c.startYear = fresh.startYear; c.stage = fresh.stage; c.band = fresh.band; c.readAloud = fresh.readAloud; c.typing = fresh.typing; rerender(); }
    });
    main.querySelectorAll('[data-s]').forEach(el => el.onchange = () => { draft[el.dataset.i].subjects[el.dataset.s] = el.checked; rerender(); });
    main.querySelectorAll('[data-r]').forEach(el => el.onchange = () => { const c = draft[el.dataset.i]; c.rules[el.dataset.r] = Math.max(+el.min, Math.min(+el.max, Math.round(+el.value || 0))); if (c.rules.min > c.rules.max) c.rules.min = c.rules.max; });
    main.querySelectorAll('[data-sp]').forEach(el => el.onchange = () => { draft[el.dataset.i].spellings = C.cleanSpellings(el.value).words; });
    main.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { draft.splice(+b.dataset.del, 1); kids(); });
    $('add').onclick = () => { draft.push(C.newChild({ id: 'c' + Date.now(), name: '', today: today() })); kids(); };
    $('save').onclick = () => {
      if (draft.some(c => !c.name || !c.name.trim())) { $('msg').className = 'err'; $('msg').textContent = 'Give each child a name.'; return; }
      if (draft.some(c => !C.SUBJECTS.some(sj => c.subjects[sj]))) { $('msg').className = 'err'; $('msg').textContent = 'Choose at least one subject for each child.'; return; }
      for (const c of draft) { C.ensureChildModel(c, today()); c.name = c.name.trim().slice(0, 30); }
      db.children = draft; draft = null;
      if (!db.children.some(c => c.id === db.activeChildId)) db.activeChildId = db.children[0].id;
      save(); kids(); $('msg').className = 'ok'; $('msg').textContent = 'Saved.';
    };
  }

  function report() {
    syncActivity();
    const now = Date.now(); const d0 = new Date(); d0.setHours(0, 0, 0, 0); const week = now - 7 * 86400000;
    main.innerHTML = `<div class="stack">${db.children.map(c => { const t = C.report(db, c.id, d0.getTime(), now), w = C.report(db, c.id, week, now); C.ensureChildModel(c, today());
      return `<div class="panel"><h3>${esc(c.name)}</h3><div class="kpis">
        <div class="kpi"><b>${t.watchedMin} min</b>YouTube on screen today (${w.watchedMin} min this week)</div>
        <div class="kpi"><b>${t.learningMin} min</b>Learning today (${w.learningMin} min this week)</div>
        <div class="kpi"><b>${w.independent}</b>Answered by themselves this week</div>
        <div class="kpi"><b>${w.supported}</b>Answered with help this week</div></div>
        <p class="note" style="margin:0">Working at: ${C.SUBJECTS.filter(sj => c.subjects[sj]).map(sj => `${SUBJ[sj]} ${esc(CUR.YEAR_LABEL[c.stage[sj]])}`).join(', ')}</p>
        ${w.revisit.length ? `<p class="note" style="margin:0">Practise again: ${esc(w.revisit.map(k => CUR.SKILLS[k] ? CUR.SKILLS[k].label : k).join(', '))}</p>` : ''}</div>`; }).join('') || '<p>No children yet.</p>'}
      <p class="note">On a phone, LearnLoop measures the time YouTube is on screen with the phone unlocked. It cannot tell whether a video is playing.</p></div>`;
  }
})();
