/* LearnLoop parent pages: first-run setup, PIN, children and rules, overrides, report, data. */
(async () => {
  'use strict';
  const L = window.LearnLoop, C = window.LLCore;
  const $ = (id) => document.getElementById(id);
  const main = $('main');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const send = (m) => chrome.runtime.sendMessage(m);
  const today = () => C.dayKey(Date.now());
  const SUBJ = { maths: 'Maths', english: 'English' };
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const STATE = { entertainment: 'Watching allowed', transition: 'Switching to learning', learning: 'Learning', break: 'On a break', rest: 'Done for today', override: 'Parent override' };
  let token = null, db = null, view = (location.hash === '#weekly') ? 'weekly' : 'now';
  let rendered = null; // which page is actually on screen; the auto-refresh only redraws that page
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const FIRST_BIRTH_YEAR = 1988;

  // ---------- entry ----------
  const fresh = await chrome.storage.local.get('db');
  if (!fresh.db || !fresh.db.parent) firstRun(); else lockScreen();

  async function parent(action, extra) {
    const res = await send(Object.assign({ type: 'parent', token, action }, extra || {}));
    if (res && res.ok && res.db) db = res.db;
    if (res && res.reason === 'locked') { token = null; db = null; $('tabs').hidden = true; lockScreen('Locked after 15 minutes without use.'); throw new Error('locked'); }
    return res;
  }

  // Keep "Right now" and "Report" up to date while the page is open (this was why totals looked stuck at 0)
  setInterval(async () => {
    if (!token || document.visibilityState !== 'visible' || !['now', 'report'].includes(rendered)) return;
    const a = document.activeElement; if (a && ['INPUT', 'SELECT', 'TEXTAREA'].includes(a.tagName)) return;
    try { await parent('getDb'); if (['now', 'report'].includes(rendered)) (rendered === 'now' ? showNow : showReport)(); } catch (e) {}
  }, 5000);
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && token && ['now', 'report'].includes(rendered)) { try { await parent('getDb'); if (['now', 'report'].includes(rendered)) (rendered === 'now' ? showNow : showReport)(); } catch (e) {} }
  });

  // ---------- first run ----------
  function firstRun() {
    rendered = 'first';
    main.innerHTML = `<div class="card" style="max-width:560px">
      <h2>Welcome to LearnLoop</h2>
      <p>Start by choosing a parent PIN. You will need it to change settings, skip learning or see reports.</p>
      <label class="field"><span>Parent PIN (4 to 8 digits)</span><input id="p1" type="password" inputmode="numeric" autocomplete="new-password"></label>
      <label class="field"><span>Type it again</span><input id="p2" type="password" inputmode="numeric" autocomplete="new-password"></label>
      <div class="err" id="err"></div>
      <button class="btn" id="go">Save PIN</button>
      <p class="callout">A PIN slows changes down. It cannot stop someone who removes the extension, uses another browser or has the Windows administrator password. LearnLoop is a family tool, not a lock.</p></div>`;
    $('go').onclick = async () => {
      const a = $('p1').value, b = $('p2').value;
      if (!C.validPin(a)) { $('err').textContent = 'Use 4 to 8 digits.'; return; }
      if (a !== b) { $('err').textContent = 'The two PINs do not match.'; return; }
      $('go').disabled = true; $('go').textContent = 'Saving…';
      const res = await send({ type: 'parentSetup', pin: a });
      if (!res || !res.ok) { $('err').textContent = (res && res.error) || 'Could not save the PIN.'; $('go').disabled = false; return; }
      token = res.token; showRecovery(res.recoveryCode, async () => { await parent('getDb'); $('tabs').hidden = false; view = 'kids'; markTab('kids'); editChildren(true); });
    };
  }
  function markTab(v) { document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v)); }
  function showRecovery(code, next) {
    rendered = 'recovery';
    main.innerHTML = `<div class="card" style="max-width:560px">
      <h2>Write down your recovery code</h2>
      <p>If you forget your PIN, this code lets you set a new one. It is shown only once. Keep it somewhere safe and away from the children.</p>
      <div class="code" id="code">${esc(code)}</div>
      <label class="checks"><label><input type="checkbox" id="saved"> I have written it down</label></label>
      <button class="btn" id="go" disabled>Continue</button></div>`;
    $('saved').onchange = () => { $('go').disabled = !$('saved').checked; };
    $('go').onclick = next;
  }

  // ---------- lock ----------
  function lockScreen(msg) {
    rendered = 'lock';
    main.innerHTML = `<div class="card" style="max-width:460px">
      <h2>Parent PIN</h2>${msg ? `<p class="note">${esc(msg)}</p>` : ''}
      <div class="pinrow"><input id="pin" type="password" inputmode="numeric" autocomplete="current-password" aria-label="Parent PIN"><button class="btn small" id="go">Unlock</button></div>
      <div class="err" id="err"></div>
      <button class="btn small ghost" id="forgot">I forgot my PIN</button></div>`;
    const go = async () => {
      const v = $('pin').value; $('err').textContent = 'Checking…';
      const res = await send({ type: 'parentCheck', pin: v });
      if (res && res.ok) { token = res.token; await parent('getDb'); $('tabs').hidden = false; show(view); return; }
      $('pin').value = '';
      $('err').textContent = res.reason === 'wait' ? `Too many tries. Wait ${res.waitSec} seconds.` : `That PIN is not right. ${res.triesLeft} ${res.triesLeft === 1 ? 'try' : 'tries'} left before a wait.`;
    };
    $('go').onclick = go; $('pin').onkeydown = e => { if (e.key === 'Enter') go(); }; $('pin').focus();
    $('forgot').onclick = recoverScreen;
  }
  function recoverScreen() {
    rendered = 'recover';
    main.innerHTML = `<div class="card" style="max-width:460px"><h2>Reset your PIN</h2>
      <label class="field"><span>Recovery code</span><input id="rc" autocomplete="off"></label>
      <label class="field"><span>New PIN (4 to 8 digits)</span><input id="np" type="password" inputmode="numeric"></label>
      <div class="err" id="err"></div><button class="btn" id="go">Reset PIN</button>
      <p class="note">Lost the code too? Remove LearnLoop from Chrome and add it again. That deletes all LearnLoop data on this laptop, so export a report first if you can.</p></div>`;
    $('go').onclick = async () => {
      if (!C.validPin($('np').value)) { $('err').textContent = 'Use 4 to 8 digits.'; return; }
      const res = await send({ type: 'parentRecover', code: $('rc').value, newPin: $('np').value });
      if (!res.ok) { $('err').textContent = res.error; return; }
      token = res.token; showRecovery(res.recoveryCode, async () => { await parent('getDb'); $('tabs').hidden = false; show('now'); });
    };
  }

  // ---------- tabs ----------
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => show(b.dataset.v));
  async function show(v) {
    view = v; markTab(v);
    await parent('getDb'); draft = null;
    if (!db.children.length && v !== 'privacy') { view = 'kids'; markTab('kids'); return editChildren(true); }
    ({ now: showNow, report: showReport, weekly: showWeekly, kids: () => editChildren(false), privacy: showPrivacy })[v]();
  }

  // ---------- right now ----------
  const LINKEDIN = 'https://www.linkedin.com/in/samlytics-data-service-487a7728a/';
  // Setup checklist: shown on Right now until the essential steps are done
  function setupSteps() {
    const steps = [
      { done: !!db.parent, title: 'Parent PIN saved', text: 'Great, your PIN is set. Keep the recovery code somewhere safe.' },
      { done: db.children.length > 0, title: 'Add your children', text: 'Go to Children and rules at the top right. Add each child with their name and date of birth, choose the video and learning times, then press Save.', btn: ['kids', 'Add children'] },
      { done: !!db.activeChildId || !!db.lastBeat && !!db.lastBeat.childId, title: "Open YouTube and choose who's watching", text: "Open YouTube in Chrome. LearnLoop asks who is watching. Tap the child's name and play a video. If YouTube was already open, reload it once (F5).", link: ['https://www.youtube.com/', 'Open YouTube'] },
      { done: !!(db.weekly && db.weekly.enabled), optional: true, title: 'Weekly email (optional)', text: 'Add your email address to get a weekly summary.', btn: ['weekly', 'Set up weekly email'] }
    ];
    if (steps.filter(s => !s.optional).every(s => s.done)) return `<div class="panel share"><b>LearnLoop is set up and working.</b>
      <p class="note" style="margin:0">We would love to hear how it goes for your family. Share your experience and ideas with us on LinkedIn. Let's help support our children's growth.</p>
      <div class="actions"><a class="btn small" style="text-decoration:none;display:inline-block" href="${LINKEDIN}" target="_blank" rel="noopener">Share on LinkedIn</a></div></div>`;
    return `<div class="panel setup-steps"><h3>Finish setting up LearnLoop</h3><ol class="steps">${steps.map(s => `<li class="${s.done ? 'done' : ''}">
      <span class="tick" aria-hidden="true">${s.done ? '✓' : ''}</span><div><b>${esc(s.title)}${s.done ? ' <span class="note">(done)</span>' : ''}</b><p class="note" style="margin:2px 0 6px">${esc(s.text)}</p>
      ${!s.done && s.btn ? `<button class="btn small" data-goto="${s.btn[0]}">${esc(s.btn[1])}</button>` : ''}${!s.done && s.link ? `<a class="btn small" style="text-decoration:none;display:inline-block" href="${s.link[0]}" target="_blank" rel="noopener">${esc(s.link[1])}</a>` : ''}</div></li>`).join('')}</ol></div>`;
  }

  function showNow() {
    rendered = 'now';
    const paused = Date.now() < (db.monitoringPausedUntil || 0);
    main.innerHTML = `<div class="stack">
      ${setupSteps()}
      <div class="panel"><h3>Who is using this laptop?</h3>
        <div class="who" id="who">${db.children.map(c => `<button aria-pressed="${c.id === db.activeChildId}" data-k="${esc(c.id)}"><b>${esc(c.name)}</b><small>${c.id === db.activeChildId ? 'Chosen now' : 'Tap to choose'}</small></button>`).join('')}</div>
        <p class="note">When Chrome starts, YouTube asks who is watching. Switching to another child afterwards needs your PIN.</p></div>
      ${monitorLine()}
      ${paused ? `<div class="panel"><b>Monitoring is paused until ${new Date(db.monitoringPausedUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.</b><div class="actions"><button class="btn small" id="resume">Resume now</button></div></div>` : ''}
      ${db.children.map(c => { const r = C.runtimeFor(db, c.id, Date.now()); return `<div class="panel">
        <h3>${esc(c.name)}: <span class="state">${STATE[r.state] || r.state}</span></h3>
        <p class="num" style="margin:0">Video since the last learning: ${mmss(r.balanceUsed)} of ${c.rules.ent}:00. Total today: ${mmss(r.dayWatched)} of ${c.rules.cap} min.</p>
        <div class="actions">
          ${['transition', 'learning', 'break'].includes(r.state) ? `<button class="btn small" data-o="skipLearning" data-k="${esc(c.id)}">Skip this learning</button>` : ''}
          <button class="btn small ghost" data-o="resetToday" data-k="${esc(c.id)}">Reset today's video total</button>
          ${!paused ? `<button class="btn small ghost" data-o="pauseMonitoring" data-k="${esc(c.id)}">Pause monitoring for 30 minutes</button>` : ''}
        </div></div>`; }).join('')}
      <p class="note">Every override is written to the report. Skipping learning never counts as learning.</p></div>`;
    main.querySelectorAll('#who button').forEach(b => b.onclick = async () => { await parent('setActive', { childId: b.dataset.k }); showNow(); });
    main.querySelectorAll('[data-goto]').forEach(b => b.onclick = () => show(b.dataset.goto));
    main.querySelectorAll('[data-o]').forEach(b => b.onclick = async () => { await parent('override', { what: b.dataset.o, childId: b.dataset.k, minutes: 30 }); showNow(); });
    if ($('resume')) $('resume').onclick = async () => { await parent('override', { what: 'resumeMonitoring' }); showNow(); };
  }

  function monitorLine() {
    const b = db.lastBeat, age = b ? Math.round((Date.now() - b.at) / 1000) : null;
    let text, cls;
    if (!b || age > 20) {
      text = b ? `No signal from YouTube for ${age > 120 ? Math.round(age / 60) + ' minutes' : age + ' seconds'}. That is normal if YouTube is closed.` : 'No signal from YouTube yet.';
      text += ' If YouTube is open and playing, reload that YouTube tab once (press F5).';
      cls = '';
    } else {
      const who = (db.children.find(c => c.id === b.childId) || {}).name;
      text = `${C.REASONS[b.reason] || b.reason}${who ? ' for ' + who : ''}. Last checked ${age} seconds ago.`;
      cls = b.reason === 'counted' ? 'yes' : '';
    }
    return `<div class="why ${cls}" id="monitor"><b>Is it counting?</b> ${esc(text)}</div>`;
  }

  // Where today's video time went: what was counted and what was not, and why.
  function timeBreakdown(t) {
    const rows = [
      ['Window not in front (another app or window had focus)', t.unfocusedSec],
      ['YouTube in a background tab', t.backgroundSec],
      ['Laptop locked', t.lockedSec],
      ['Picture in picture', t.pipSec],
      ['During the countdown or learning', t.duringSwitchSec],
      ['Another tab or window was selected', t.notSelectedSec]
    ].filter(r => r[1] >= 5);
    const speedNote = t.contentSec > t.watchedSec * 1.15 + 20
      ? `<p class="note" style="margin:0">The videos moved on by ${mmss(t.contentSec)} while ${mmss(t.watchedSec)} was watched. That usually means a faster playback speed or skipping ahead. LearnLoop counts real time on screen, not the length of the video.</p>` : '';
    if (!t.watchedSec && !rows.length) return '';
    return `<details class="breakdown"><summary><b>Where today's video time went</b></summary>
      <div class="tablewrap"><table><tbody>
        <tr><td>Counted as watching</td><td class="num">${mmss(t.watchedSec)}</td></tr>
        <tr><td>How far the videos moved on in that time</td><td class="num">${mmss(t.contentSec)}</td></tr>
        ${rows.map(r => `<tr><td>Not counted: ${r[0]}</td><td class="num">${mmss(r[1])}</td></tr>`).join('')}
      </tbody></table></div>${speedNote}</details>`;
  }
  function unassignedToday() { return Math.round(((db.unassigned || {})[today()]) || 0); }

  // ---------- report ----------
  function showReport() {
    rendered = 'report';
    const now = Date.now(), dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
    const weekStart = dayStart.getTime() - 6 * 86400000;
    const label = { mastery: 'Finished early', time_limit: 'Time limit reached' };
    main.innerHTML = `<div class="stack">${db.children.map(c => {
      const t = C.report(db, c.id, dayStart.getTime(), now), w = C.report(db, c.id, weekStart, now);
      const sess = db.sessions.filter(s => s.childId === c.id).slice(-10).reverse();
      const sk = db.skills[c.id] || {};
      return `<div class="panel"><h3>${esc(c.name)}</h3>
        <div class="kpis">
          <div class="kpi"><b class="num">${mmss(t.watchedSec)}</b><span>Measured video today, minutes:seconds (${w.watchedMin} min this week)</span></div>
          <div class="kpi"><b class="num">${mmss(t.learningSec)}</b><span>Active learning today, minutes:seconds (${w.learningMin} min this week)</span></div>
          <div class="kpi"><b class="num">${w.independent}</b><span>Answered by themselves this week</span></div>
          <div class="kpi"><b class="num">${w.supported}</b><span>Answered with help this week</span></div>
          <div class="kpi"><b class="num">${w.backgroundMin + w.pipMin + w.lockedMin} min</b><span>Playback not counted this week (background, picture in picture, locked)</span></div>
        </div>
        <p style="margin:0"><b>Working at:</b> Maths ${esc(L.CUR.YEAR_LABEL[C.ensureChildModel(c, today()).stage.maths])}, English ${esc(L.CUR.YEAR_LABEL[c.stage.english])}</p>
        ${timeBreakdown(t)}
        ${w.revisit.length ? `<p style="margin:0"><b>Practise again:</b> ${esc(w.revisit.map(s => L.SKILLS[s] ? L.SKILLS[s].label : s).join(', '))}</p>` : ''}
        <div class="tablewrap"><table><thead><tr><th>When</th><th>Subject</th><th>How it ended</th><th class="num">Learning time</th><th class="num">By themselves</th><th class="num">With help</th><th class="num">Not yet</th></tr></thead><tbody>
        ${sess.length ? sess.map(s => `<tr><td>${new Date(s.endedAt).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>${SUBJ[s.subject] || s.subject}</td><td><span class="pill ${s.reason}">${label[s.reason] || s.reason}</span></td><td class="num">${Math.floor(s.learningSec / 60)}:${String(s.learningSec % 60).padStart(2, '0')}</td><td class="num">${s.ind}</td><td class="num">${s.sup}</td><td class="num">${s.incorrect}</td></tr>`).join('') : '<tr><td colspan="7">No learning sessions yet.</td></tr>'}
        </tbody></table></div>
        ${Object.keys(sk).length ? `<div class="tablewrap"><table><thead><tr><th>Skill</th><th>Year</th><th class="num">Level</th><th class="num">By themselves</th><th class="num">With help</th><th class="num">Not yet</th></tr></thead><tbody>${Object.entries(sk).filter(([k]) => L.SKILLS[k]).map(([k, s]) => `<tr><td>${esc(L.SKILLS[k].label)}</td><td>${esc(L.CUR.YEAR_LABEL[L.SKILLS[k].year])}</td><td class="num">${s.level || 1} of 3</td><td class="num">${s.independent}</td><td class="num">${s.supported}</td><td class="num">${s.incorrect}</td></tr>`).join('')}</tbody></table></div>` : ''}
        ${((db.levelLog || {})[c.id] || []).length ? `<details class="breakdown"><summary><b>Why levels changed</b></summary><ul class="changes">${(db.levelLog[c.id]).slice(-10).reverse().map(x => `<li><span class="note">${new Date(x.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span> ${esc(x.reason)}</li>`).join('')}</ul></details>` : ''}
        ${t.gaps || w.gaps ? `<p class="note">Monitoring gaps this week: ${w.gaps}. A gap is a stretch where the laptop slept, the page froze or the clock jumped. Nothing was counted during gaps.</p>` : ''}
      </div>`; }).join('')}
      ${unassignedToday() ? `<p class="note">Today ${mmss(unassignedToday())} of video played before anyone chose who was watching. It is not counted for any child.</p>` : ''}
      <div class="panel"><h3>Export</h3><p class="note" style="margin:0">Save every session and daily total as a spreadsheet file. It stays on this laptop unless you share it.</p><div class="actions"><button class="btn small" id="csv">Download CSV</button></div></div>
      <p class="note">Video time is measured, not estimated: only time when a YouTube video was playing in the selected tab of the front Chrome window with the laptop unlocked. Learning time counts only while the learning screen was on screen, not breaks.</p></div>`;
    $('csv').onclick = () => {
      const blob = new Blob([C.csv(db)], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `learnloop-report-${today()}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
  }

  // ---------- weekly report ----------
  function mailtoLink(email, subject, body) {
    // Keep within the length email apps accept from a link
    const b = body.length > 1700 ? body.slice(0, 1700) + '\n\n(Shortened. Open LearnLoop for the full report.)' : body;
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(b)}`;
  }
  const skillLabel = (k) => L.SKILLS[k] ? L.SKILLS[k].label : k;
  function htmlReport(period, text) {
    return `<!doctype html><html lang="en-GB"><meta charset="utf-8"><title>LearnLoop weekly report ${period.key}</title>
<body style="font-family:Segoe UI,system-ui,sans-serif;max-width:640px;margin:32px auto;padding:0 16px;color:#1B2440;line-height:1.5"><pre style="white-space:pre-wrap;font:inherit">${esc(text)}</pre></body></html>`;
  }
  function showWeekly() {
    rendered = 'weekly';
    const w = db.weekly || { email: '', day: 0, enabled: false };
    const period = C.weekPeriod(Date.now() + 7 * 86400000, w.day); // the week in progress, so far
    const text = C.weeklyText(db, period, skillLabel);
    const ready = (db.outbox || []).filter(o => o.status === 'ready').reverse();
    const sent = (db.outbox || []).filter(o => o.status === 'sent').slice(-4).reverse();
    const subj = (o) => `LearnLoop weekly report, week starting ${new Date(o.fromMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
    main.innerHTML = `<div class="stack">
      <div class="panel"><h3>Weekly report by email</h3>
        <label class="field"><span>Your email address</span><input id="wEmail" type="email" autocomplete="email" placeholder="you@example.com" value="${esc(w.email)}"></label>
        <div class="row2">
          <label class="field"><span>Report day</span><select id="wDay">${C.DAY_NAMES.map((d, i) => `<option value="${i}" ${+w.day === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Weekly report</span><select id="wOn"><option value="1" ${w.enabled ? 'selected' : ''}>On</option><option value="0" ${!w.enabled ? 'selected' : ''}>Off</option></select></label>
        </div>
        <div class="actions"><button class="btn small" id="wSave">Save</button><span id="wMsg" class="ok"></span></div>
        <p class="note" style="margin:0">On the report day LearnLoop prepares the past week's report and shows a notification. Click it, then <b>Send to my email</b>. Your email app opens with the report filled in and you press Send. If the laptop is off on the report day, the report waits until it is next used. Each week is prepared only once.</p>
        <p class="note" style="margin:0">LearnLoop does not send email by itself in this version. That would mean storing your email password, and it will only do that once the Windows helper can keep it locked away by Windows. Your address stays on this laptop.</p></div>
      ${ready.length ? `<div class="panel"><h3>Ready to send</h3>${ready.map(o => `<div class="actions" style="align-items:center"><span>Week starting ${new Date(o.fromMs).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <button class="btn small" data-send="${o.key}">Send to my email</button><button class="btn small ghost" data-done="${o.key}">Mark as sent</button></div>`).join('')}</div>` : ''}
      <div class="panel"><h3>This week so far</h3>
        <pre id="wText" style="white-space:pre-wrap;font:inherit;margin:0;background:var(--sunk);padding:12px;border-radius:12px">${esc(text)}</pre>
        <div class="actions"><button class="btn small" id="wSendNow">Send this to my email now</button><button class="btn small ghost" id="wCopy">Copy text</button><button class="btn small ghost" id="wHtml">Download as a web page</button><span id="wMsg2" class="ok"></span></div>
        <p class="note" style="margin:0">Nothing happens when you press Send? Your laptop may have no default email app. Use <b>Copy text</b> and paste it into an email, or set Gmail or Outlook as the default in Windows Settings.</p></div>
      ${sent.length ? `<p class="note">Recently sent: ${sent.map(o => new Date(o.fromMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })).join(', ')}</p>` : ''}
    </div>`;
    const openMail = (subject, body) => {
      const email = (db.weekly && db.weekly.email) || $('wEmail').value.trim();
      if (!C.validEmail(email)) { $('wMsg').textContent = 'Add your email address and press Save first.'; return false; }
      const a = document.createElement('a'); a.href = mailtoLink(email, subject, body); a.click(); return true;
    };
    $('wSave').onclick = async () => {
      const email = $('wEmail').value.trim();
      if (email && !C.validEmail(email)) { $('wMsg').textContent = 'That email address does not look right.'; return; }
      const res = await parent('saveWeekly', { email, day: +$('wDay').value, enabled: $('wOn').value === '1' });
      $('wMsg').textContent = res.ok ? (email ? 'Saved.' : 'Saved. Weekly report is off until you add an email address.') : (res.error || 'Could not save.');
      if (res.ok) setTimeout(async () => { await parent('getDb'); showWeekly(); }, 900); // fetch again: saving may have just prepared a report
    };
    $('wSendNow').onclick = () => openMail(subj(period), text);
    $('wCopy').onclick = async () => {
      try { await navigator.clipboard.writeText(text); $('wMsg2').textContent = 'Copied.'; }
      catch (e) { const r = document.createRange(); r.selectNodeContents($('wText')); getSelection().removeAllRanges(); getSelection().addRange(r); $('wMsg2').textContent = 'Selected. Press Ctrl+C to copy.'; }
    };
    $('wHtml').onclick = () => {
      const blob = new Blob([htmlReport(period, text)], { type: 'text/html' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `learnloop-week-${period.key}.html`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    };
    main.querySelectorAll('[data-send]').forEach(b => b.onclick = async () => {
      const o = db.outbox.find(x => x.key === b.dataset.send);
      if (openMail(subj(o), C.weeklyText(db, o, skillLabel))) { await parent('markSent', { key: o.key }); setTimeout(showWeekly, 600); }
    });
    main.querySelectorAll('[data-done]').forEach(b => b.onclick = async () => { await parent('markSent', { key: b.dataset.done }); showWeekly(); });
  }

  // ---------- children and rules ----------
  function ruleFields(c, i) {
    const R = c.rules;
    const f = (k, label, min, max) => `<label class="field"><span>${label}</span><input type="number" data-i="${i}" data-r="${k}" min="${min}" max="${max}" value="${R[k]}"></label>`;
    return `<div class="presets">
        <button data-i="${i}" data-p="5,10" aria-pressed="${R.ent === 5 && R.max === 10}">5 min video, then up to 10 min learning</button>
        <button data-i="${i}" data-p="10,10" aria-pressed="${R.ent === 10 && R.max === 10}">10 min video, then up to 10 min learning</button></div>
      <div class="row2">${f('ent', 'Video minutes before learning', 1, 60)}${f('max', 'Learning: most minutes', 1, 30)}${f('min', 'Learning: fewest minutes', 0, 30)}${f('cap', 'Daily video limit (minutes)', 5, 240)}${f('tasks', 'Tasks in a session', 3, 10)}${f('mastery', 'Answers by themselves to finish early', 1, 10)}</div>
      <label class="field"><span>How video time is measured</span><select data-i="${i}" data-r="mode"><option value="playback" ${R.mode === 'playback' ? 'selected' : ''}>Only while a video is actually playing</option><option value="foreground" ${R.mode === 'foreground' ? 'selected' : ''}>Whenever YouTube is on screen</option></select></label>`;
  }
  let draft = null;
  function editChildren(firstTime) {
    rendered = 'kids';
    const rerender = () => setTimeout(() => editChildren(firstTime), 0); // never replace the form inside its own change/blur event
    if (!draft) draft = JSON.parse(JSON.stringify(db && db.children.length ? db.children : []));
    if (!draft.length) draft.push(C.newChild({ id: 'c' + Date.now(), name: '', today: today() }));
    main.innerHTML = `<div class="stack">
      ${firstTime ? '<div class="panel"><h3>Add your children</h3><p class="note" style="margin:0">Age only decides where the questions start. After that, what each child shows they can do decides what comes next. A birthday never makes the work harder on its own.</p></div>' : ''}
      ${draft.map((c, i) => `<div class="kidform">
        <div class="row2"><label class="field"><span>Name shown to the child</span><input data-i="${i}" data-k="name" value="${esc(c.name)}" maxlength="30"></label>
        <div class="field"><span>School year</span><span class="note" style="font-weight:500;padding-top:8px">${c.birthday ? esc(L.CUR.schoolYearFor(c.birthday, today()).label) + ' (worked out from the date of birth, England)' : 'Add a date of birth below, or choose the levels yourself.'}</span></div></div>
        ${birthdayField(c, i)}
        <div class="row2">${['maths', 'english'].map(sub => `<label class="field"><span>${sub === 'maths' ? 'Maths' : 'English'} level</span><select data-i="${i}" data-stage="${sub}">${L.CUR.YEARS.map(y => `<option value="${y}" ${C.ensureChildModel(c, today()).stage[sub] === y ? 'selected' : ''}>${L.CUR.YEAR_LABEL[y]}</option>`).join('')}</select></label>`).join('')}</div>
        <p class="note" style="margin:0">The levels start from the date of birth. After that, LearnLoop moves each skill up when your child answers well without help across several sessions, and back down if it gets too hard. You can change the levels here at any time.</p>
        <div class="checks"><label><input type="checkbox" data-i="${i}" data-s="maths" ${c.subjects.maths ? 'checked' : ''}> Maths</label><label><input type="checkbox" data-i="${i}" data-s="english" ${c.subjects.english ? 'checked' : ''}> English</label>
          <label><input type="checkbox" data-i="${i}" data-k="readAloud" ${c.readAloud ? 'checked' : ''}> Read questions aloud</label><label><input type="checkbox" data-i="${i}" data-k="typing" ${c.typing ? 'checked' : ''}> Allow typed answers</label></div>
        ${ruleFields(c, i)}
        <p class="note" style="margin:0">${summaryLine(c)}</p>
        ${draft.length > 1 ? `<div class="actions"><button class="btn small ghost" data-del="${i}">Remove ${esc(c.name || 'this child')}</button></div>` : ''}
      </div>`).join('')}
      <div class="actions"><button class="btn small ghost" id="add">Add another child</button><button class="btn" id="save">Save</button><span id="msg" class="ok"></span></div></div>`;
    main.querySelectorAll('[data-k]').forEach(el => el.onchange = () => {
      const c = draft[el.dataset.i], k = el.dataset.k;
      c[k] = el.type === 'checkbox' ? el.checked : el.value || null;
    });
    main.querySelectorAll('[data-b]').forEach(el => el.onchange = () => {
      const c = draft[el.dataset.i];
      c._bd = Object.assign({}, c._bd || splitDate(c.birthday), { [el.dataset.b]: el.value });
      const { y, m, d } = c._bd;
      if (y && m && d) {
        const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dt = new Date(iso + 'T00:00:00');
        if (dt.getMonth() + 1 !== +m) { c._bdErr = `${MONTHS[m - 1]} ${y} does not have ${d} days.`; }
        else if (iso > today()) { c._bdErr = 'That date is in the future.'; }
        else { c._bdErr = null; c.birthday = iso; applyStart(c, C.startYearFrom(iso, today())); }
      }
      rerender();
    });
    main.querySelectorAll('[data-stage]').forEach(el => el.onchange = () => { const c = draft[el.dataset.i]; C.ensureChildModel(c, today()).stage[el.dataset.stage] = el.value; rerender(); });
    main.querySelectorAll('[data-bclear]').forEach(b => b.onclick = () => { const c = draft[b.dataset.bclear]; c.birthday = null; c._bd = null; c._bdErr = null; rerender(); });
    main.querySelectorAll('[data-s]').forEach(el => el.onchange = () => { draft[el.dataset.i].subjects[el.dataset.s] = el.checked; });
    main.querySelectorAll('[data-r]').forEach(el => el.onchange = () => {
      const c = draft[el.dataset.i]; const k = el.dataset.r;
      if (k === 'mode') c.rules.mode = el.value;
      else { const v = Math.max(+el.min, Math.min(+el.max, Math.round(+el.value || 0))); c.rules[k] = v; }
      if (c.rules.min > c.rules.max) c.rules.min = c.rules.max;
      if (c.rules.mastery > c.rules.tasks) c.rules.mastery = c.rules.tasks;
      rerender();
    });
    main.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const [e, m] = b.dataset.p.split(',').map(Number); Object.assign(draft[b.dataset.i].rules, { ent: e, max: m }); editChildren(firstTime); });
    main.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { draft.splice(+b.dataset.del, 1); editChildren(firstTime); });
    $('add').onclick = () => { draft.push(C.newChild({ id: 'c' + Date.now(), name: '', today: today() })); editChildren(firstTime); };
    $('save').onclick = async () => {
      if (draft.some(c => !c.name || !c.name.trim())) { $('msg').textContent = 'Give each child a name.'; return; }
      if (draft.some(c => !c.subjects.maths && !c.subjects.english)) { $('msg').textContent = 'Choose at least one subject for each child.'; return; }
      if (draft.some(c => c._bdErr)) { $('msg').textContent = 'Fix the birthday first.'; return; }
      const res = await parent('saveChildren', { children: draft.map(({ _bd, _bdErr, ...c }) => c) });
      if (!res.ok) { $('msg').textContent = 'Could not save.'; return; }
      draft = null; $('tabs').hidden = false;
      if (firstTime) show('now'); else { editChildren(false); $('msg').textContent = 'Saved.'; }
    };
  }
  // Date of birth sets the school year for both subjects, and the reading and typing defaults
  function applyStart(c, start) {
    C.ensureChildModel(c, today());
    c.startYear = { maths: start, english: start }; c.stage = { maths: start, english: start };
    c.band = start === 'R' ? 'early' : 'primary'; c.readAloud = start === 'R' || start === 'Y1'; c.typing = start !== 'R';
  }
  function splitDate(iso) { if (!iso) return { y: '', m: '', d: '' }; const [y, m, d] = iso.split('-'); return { y, m: String(+m), d: String(+d) }; }
  function birthdayField(c, i) {
    const v = c._bd || splitDate(c.birthday), thisYear = new Date().getFullYear();
    const opt = (val, label, cur) => `<option value="${val}" ${String(cur) === String(val) ? 'selected' : ''}>${label}</option>`;
    const years = []; for (let y = FIRST_BIRTH_YEAR; y <= thisYear; y++) years.push(opt(y, y, v.y));
    const age = c.birthday ? L.ageOn(c.birthday, today()) : null;
    return `<div class="field"><span>Birthday (optional, stays on this laptop)</span>
      <div class="actions" style="flex-wrap:wrap">
        <select data-i="${i}" data-b="d" aria-label="Day">${opt('', 'Day', v.d)}${Array.from({ length: 31 }, (_, k) => opt(k + 1, k + 1, v.d)).join('')}</select>
        <select data-i="${i}" data-b="m" aria-label="Month">${opt('', 'Month', v.m)}${MONTHS.map((m, k) => opt(k + 1, m, v.m)).join('')}</select>
        <select data-i="${i}" data-b="y" aria-label="Year">${opt('', 'Year', v.y)}${years.join('')}</select>
        ${c.birthday || c._bd ? `<button class="btn small ghost" data-bclear="${i}">Clear</button>` : ''}
      </div>
      ${c._bdErr ? `<span class="err">${esc(c._bdErr)}</span>` : age !== null ? `<span class="note" style="font-weight:500">Age ${age}, ${esc(L.CUR.schoolYearFor(c.birthday, today()).label)}. Questions start at ${esc(L.CUR.YEAR_LABEL[C.startYearFrom(c.birthday, today())])} level.${L.CUR.schoolYearFor(c.birthday, today()).index > 3 ? ' LearnLoop currently goes up to Year 3, so questions may feel easy.' : ''}${L.CUR.schoolYearFor(c.birthday, today()).index < 0 ? ' Not at school yet, so questions start at Reception level.' : ''}</span>` : ''}
    </div>`;
  }
  function summaryLine(c) {
    const R = c.rules; const subs = ['maths', 'english'].filter(s => c.subjects[s]).map(s => SUBJ[s]).join(' and ') || 'no subjects yet';
    return `After ${R.ent} minutes of measured video, ${esc(c.name || 'this child')} does ${subs} for up to ${R.max} minutes. They can go back early after ${R.mastery} different answers by themselves, but not before ${R.min} minute${R.min === 1 ? '' : 's'}. Daily video limit ${R.cap} minutes.`;
  }

  // ---------- data and PIN ----------
  function showPrivacy() {
    rendered = 'privacy';
    main.innerHTML = `<div class="stack">
      <div class="panel"><h3>What LearnLoop keeps</h3>
        <p style="margin:0">Names, starting levels and optional birthdays you enter. Minutes of measured video per day. Learning results per skill. Overrides. All of it stays in Chrome on this laptop.</p>
        <p style="margin:0">It does not keep video titles, browsing history, screenshots, keystrokes or voice recordings. Nothing is sent anywhere.</p></div>
      <div class="panel"><h3>Delete data</h3>
        <div class="actions">${db.children.map(c => `<button class="btn small ghost" data-del="${esc(c.id)}">Delete ${esc(c.name)}'s history</button>`).join('')}<button class="btn small ghost" id="all">Delete everything except the PIN</button></div>
        <div id="confirm"></div></div>
      <div class="panel"><h3>Change PIN</h3>
        <div class="pinrow"><input id="np" type="password" inputmode="numeric" aria-label="New PIN"><button class="btn small" id="cp">Change PIN</button></div><div class="err" id="err"></div></div></div>`;
    const ask = (text, fn) => { $('confirm').innerHTML = `<div class="confirm"><b>${esc(text)}</b><span class="note">This cannot be undone.</span><div class="actions"><button class="btn small" id="yes">Delete</button><button class="btn small ghost" id="no">Keep it</button></div></div>`;
      $('yes').onclick = async () => { await fn(); showPrivacy(); }; $('no').onclick = () => { $('confirm').innerHTML = ''; }; };
    main.querySelectorAll('[data-del]').forEach(b => b.onclick = () => ask(`Delete all of ${db.children.find(c => c.id === b.dataset.del).name}'s learning and video history?`, () => parent('deleteChildData', { childId: b.dataset.del })));
    $('all').onclick = () => ask('Delete every child profile and all history?', () => parent('deleteEverything'));
    $('cp').onclick = async () => {
      const v = $('np').value; if (!C.validPin(v)) { $('err').textContent = 'Use 4 to 8 digits.'; return; }
      const res = await parent('changePin', { newPin: v }); if (!res.ok) { $('err').textContent = 'Could not change the PIN.'; return; }
      showRecovery(res.recoveryCode, () => show('privacy'));
    };
  }
})();
