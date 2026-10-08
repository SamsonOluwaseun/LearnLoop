/* LearnLoop learning screen. All grading and progress rules come from engine.js (deterministic, no AI). */
(async () => {
  'use strict';
  const L = window.LearnLoop;
  const app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mmss = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const SUBJ = { maths: 'Maths', english: 'English', reasoning: 'Reasoning' };
  const send = (m) => chrome.runtime.sendMessage(m);
  const PRAISE = ['Brilliant!', 'You got it!', 'Spot on!', 'Well done!', 'Super thinking!'];

  let child, runtime, session, subject, R, offset = { elapsed: 0, independent: 0 }, ui = { choiceState: {} }, onBreak = false, finished = false;
  // Practice mode: opened from the toolbar button. The child picks a subject. It needs no video time and earns none.
  const PRACTICE = new URLSearchParams(location.search).has('practice');
  let practice = null; // { challenge, max, roundSize, best }
  let last = performance.now(), sinceSave = 0;

  function speak(text) {
    if (!child || !child.readAloud || !text) return;
    try { chrome.tts.speak(text, { lang: 'en-GB', rate: 0.9, enqueue: false }); } catch (e) {}
  }
  function speakAlways(text) { try { chrome.tts.speak(text, { lang: 'en-GB', rate: 0.9, enqueue: false }); return true; } catch (e) { return false; } }

  const POWERED = `<div class="foot-powered"><img src="brand/samlytics-mark.png" alt="">Powered by Samlytics Data Services</div>`;
  function card(html) { app.innerHTML = `<div class="over"><div style="display:grid;justify-items:center;width:100%"><div class="card">${html}</div>${POWERED}</div></div>`; return app; }

  if (PRACTICE) { await startPractice(); return; }
  const start = await send({ type: 'learnStart' });
  if (!start || start.error) {
    card(`<h2>Nobody is chosen yet</h2><p>Open YouTube and pick who is watching, or ask a grown-up.</p>`);
    return;
  }
  child = start.child; runtime = start.runtime;
  if (runtime.state === 'rest') { showRest(); return; }
  if (runtime.state === 'entertainment') {
    card(`<h2>No learning needed right now</h2><p>Enjoy your video, ${esc(child.name)}.</p><button class="btn" id="back">Back to YouTube</button>`);
    document.getElementById('back').onclick = goBack; return;
  }

  subject = start.subject || (runtime.session ? runtime.session.subject : (runtime.subject || 'maths'));
  offset = { elapsed: runtime.session ? runtime.session.elapsed : 0, independent: runtime.session ? runtime.session.independent : 0 };
  R = child.rules;
  session = new L.LearningSession({
    subject, band: child.band, plan: start.plan, seed: Math.floor(Math.random() * 1e9), revision: start.revision || [],
    config: { minSec: Math.max(0, R.min * 60 - offset.elapsed), maxSec: Math.max(30, R.max * 60 - offset.elapsed),
      tasks: R.tasks, masteryTarget: Math.max(1, R.mastery - offset.independent) }
  });
  onBreak = runtime.state === 'break';
  if (onBreak) showBreak(); else renderShell();
  startClock();

  // ---- clock: monotonic, only while the page is on screen and not on a break ----
  function startClock() {
    last = performance.now();
    setInterval(() => {
      const now = performance.now(); const dt = (now - last) / 1000; last = now;
      if (finished || onBreak || document.visibilityState !== 'visible' || dt > 5) return;
      session.tick(dt); sinceSave += dt;
      if (sinceSave >= 5) { sinceSave = 0; saveProgress(); }
      if (session.done && !ui.locked) finish();
      renderClock();
    }, 250);
  }
  function saveProgress() { if (PRACTICE) return; send({ type: 'learnProgress', elapsed: offset.elapsed + session.elapsed, independent: offset.independent + session.independentCount }); }

  // ---------- practice and "beat your own best" ----------
  async function startPractice() {
    const st = await send({ type: 'practiceStart' });
    if (!st || st.error) { card(`<h2>Nobody is chosen yet</h2><p>Open YouTube and pick who is using LearnLoop, or ask a grown-up.</p>`); return; }
    child = st.child; R = child.rules;
    if (!st.subjects.length) { card(`<h2>No subjects chosen</h2><p>Ask a grown-up to choose subjects in LearnLoop.</p>`); return; }
    const bestLine = (s) => { const b = st.best[s]; return b ? `Your best: ${b.score} of ${b.of}` : 'No best yet'; };
    card(`<h2>Practise with ${esc(child.name)}</h2>
      <p style="margin:0">Pick something to practise. This is extra practice, so it does not use or earn video time.</p>
      <label class="switch"><input type="checkbox" id="challenge"> <span><b>Beat your own best</b>: ${st.roundSize} questions. Try to answer more by yourself than last time. It's only you against you.</span></label>
      <div class="choices">${st.subjects.map(s => `<button class="choice text" data-sub="${s}">${SUBJ[s]}<small class="note" style="display:block;font-weight:600">${bestLine(s)}</small></button>`).join('')}</div>`);
    speak(`Hello ${child.name}. What would you like to practise?`);
    app.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => {
      subject = b.dataset.sub; const challenge = document.getElementById('challenge').checked;
      practice = { challenge, max: st.practiceMax, roundSize: st.roundSize, best: st.best[subject] || null };
      session = new L.LearningSession({ subject, band: child.band, plan: st.plans[subject], seed: Math.floor(Math.random() * 1e9), revision: st.revision[subject] || [],
        config: { minSec: 0, maxSec: st.practiceMax * 60, tasks: challenge ? st.roundSize : Math.max(5, R.tasks), masteryTarget: Infinity } });
      renderShell(); startClock();
    });
  }
  function roundDone() { return PRACTICE && practice && practice.challenge && session.index >= practice.roundSize; }

  function renderShell() {
    app.innerHTML = `<div class="learn">
      <div class="lhead"><div class="lbrand"><img src="brand/samlytics-mark.png" alt="Samlytics Data Services logo"><div class="brandtext"><h2>${SUBJ[subject]}${PRACTICE ? (practice.challenge ? ': beat your best' : ' practice') : ''} with ${esc(child.name)}</h2><span class="powered">Powered by Samlytics Data Services</span></div></div><div class="stars"></div><span class="clock num"></span></div>
      <div class="lbody"></div>
      <div class="lfoot"><button data-a="help">Help me</button><button data-a="say">Say it again</button><button data-a="alt">Try another way</button>${PRACTICE ? '<button data-a="done">I\'m finished</button>' : '<button data-a="break">I need a break</button>'}</div></div>`;
    const f = app.querySelector('.lfoot');
    f.querySelector('[data-a=help]').onclick = () => { if (ui.locked) return; const h = session.help(); if (!h) return; ui.feedback = { cls: 'hint', t: h.text }; render(); speak(h.text); };
    f.querySelector('[data-a=say]').onclick = () => { if (session.current) speakAlways(session.current.speak); };
    f.querySelector('[data-a=alt]').onclick = () => { if (ui.locked) return; const a = session.anotherWay(); if (!a) return; ui.alt = a; ui.feedback = { cls: 'hint', t: 'Here is another way to look at it.' }; render(); speak(ui.feedback.t); };
    if (PRACTICE) f.querySelector('[data-a=done]').onclick = () => { if (!ui.locked) { session._finish('stopped'); finish(); } };
    else f.querySelector('[data-a=break]').onclick = () => { onBreak = true; saveProgress(); send({ type: 'learnBreak', on: true }); showBreak(); };
    render(); speak(session.current && session.current.speak);
  }

  const COIN = (p) => p >= 100 ? `£${p / 100}` : `${p}p`;
  function clockSvg(h, m) {
    const ang = (deg) => (deg - 90) * Math.PI / 180, cx = 60, cy = 60;
    const hand = (deg, len, w, cls) => `<line x1="${cx}" y1="${cy}" x2="${(cx + len * Math.cos(ang(deg))).toFixed(1)}" y2="${(cy + len * Math.sin(ang(deg))).toFixed(1)}" stroke-width="${w}" stroke-linecap="round" class="${cls}"/>`;
    const nums = Array.from({ length: 12 }, (_, i) => { const a = ang((i + 1) * 30); return `<text x="${(cx + 43 * Math.cos(a)).toFixed(1)}" y="${(cy + 43 * Math.sin(a) + 4).toFixed(1)}" text-anchor="middle" class="cnum">${i + 1}</text>`; }).join('');
    return `<svg class="clock" viewBox="0 0 120 120" role="img" aria-label="Clock face"><circle cx="60" cy="60" r="55" class="cface"/>${nums}${hand((h % 12) * 30 + m * 0.5, 28, 5, 'chour')}${hand(m * 6, 42, 3, 'cmin')}<circle cx="60" cy="60" r="3.5" class="cdot"/></svg>`;
  }
  function renderVisual(v) {
    if (!v) return '';
    if (v.kind === 'objects') return `<div class="visual" aria-hidden="true">${Array(v.n).fill(v.pic).join('')}</div>`;
    if (v.kind === 'numbered') return `<div class="visual">${Array.from({ length: v.n }, (_, i) => `<span class="n"><b>${v.pic}</b>${i + 1}</span>`).join('')}</div>`;
    if (v.kind === 'dots') return `<div class="visual" style="font-size:30px;letter-spacing:4px">${'●'.repeat(v.n)}</div>`;
    if (v.kind === 'line' || v.kind === 'line10') {
      if (v.kind === 'line10') { const lo = Math.max(0, v.centre - 3); return `<div class="line">${Array.from({ length: 7 }, (_, i) => `<span class="${lo + i === v.centre ? 'from' : ''}">${lo + i}</span>`).join('')}</div>`; }
      const hop = i => v.step > 0 ? (i > v.from && i <= v.from + v.step) : (i < v.from && i >= v.from + v.step);
      const lo = Math.max(0, Math.min(v.from, v.from + v.step) - 1), hi = Math.min(Math.max(v.max, v.from), Math.max(v.from, v.from + v.step) + 1);
      return `<div class="line">${Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).map(i => `<span class="${i === v.from ? 'from' : (hop(i) ? 'hop' : '')}">${i}</span>`).join('')}</div><div class="note">Blue is where you start. Hop along the yellow numbers.</div>`;
    }
    if (v.kind === 'groups') return `<div class="groups"><div><b>A</b><span>${Array(v.a).fill(v.pic).join('')}</span></div><div><b>B</b><span>${Array(v.b).fill(v.pic).join('')}</span></div></div>`;
    if (v.kind === 'tenframe') return `<div class="tenframe" aria-label="${v.filled} counters filled out of ${v.total}">${Array.from({ length: v.total }, (_, i) => `<i class="${i < v.filled ? 'on' : ''}"></i>`).join('')}</div>`;
    if (v.kind === 'tens') return `<div class="tensones" aria-label="${v.t} tens and ${v.o} ones">${Array(v.t).fill('<i class="ten"></i>').join('')}<span class="gap"></span>${Array(v.o).fill('<i class="one"></i>').join('')}</div>`;
    if (v.kind === 'array') return `<div class="array" style="grid-template-columns:repeat(${v.cols},26px)">${Array(v.rows * v.cols).fill('<i></i>').join('')}</div>`;
    if (v.kind === 'pairs') return `<div class="array" style="grid-template-columns:repeat(2,26px)">${Array.from({ length: v.n }, () => '<i></i>').join('')}</div>`;
    if (v.kind === 'bar') return `<div class="fbar" style="grid-template-columns:repeat(${v.parts},1fr)">${Array.from({ length: v.parts }, (_, i) => `<i class="${i < v.shaded ? 'on' : ''}"></i>`).join('')}</div>`;
    if (v.kind === 'coins') return `<div class="coins">${v.list.map(c => `<span class="coin ${c >= 100 ? 'gold' : c >= 5 ? 'silver' : 'copper'}">${COIN(c)}</span>`).join('')}</div>`;
    if (v.kind === 'clock') return clockSvg(v.h, v.m);
    if (v.kind === 'big') return `<div class="bigtext">${esc(v.text)}</div>`;
    if (v.kind === 'word') return `<div class="bigtext word">${esc(v.text)}</div>`;
    if (v.kind === 'sentence') return `<div class="sentence">${esc(v.text)}</div>`;
    if (v.kind === 'passage') return `<div class="passage">${esc(v.text)}</div>`;
    if (v.kind === 'column') return `<pre class="column">${String(v.a).padStart(4)}\n${v.op} ${String(v.b).padStart(3)}\n────</pre>`;
    if (v.kind === 'svg') return `<div class="visual svgbox">${v.svg}</div>`; // drawn by the question bank's own code, never from outside input
    if (v.kind === 'clue' || v.kind === 'chunks') return `<div class="feedback hint">${esc(v.text)}</div>`;
    return '';
  }

  function render(heldQ) {
    const box = app.querySelector('.learn'); if (!box) return;
    const q = heldQ || session.current; if (!q) return;
    const need = PRACTICE ? (practice.challenge ? practice.roundSize : 0) : R.mastery, have = offset.independent + session.independentCount;
    box.querySelector('.stars').innerHTML = PRACTICE && !practice.challenge ? `<span class="note">${have} by yourself so far</span>`
      : Array.from({ length: need }, (_, i) => `<i class="${i < have ? 'on' : ''}"></i>`).join('') + `<span class="note" style="margin-left:6px">${have} of ${need} by yourself</span>`;
    const isPic = q.response === 'picture';
    const typed = q.response === 'choice-or-type' && child.typing;
    box.querySelector('.lbody').innerHTML = `
      ${q.transfer ? '<span class="tag">A new kind of question</span>' : ''}
      <span class="note">${esc((L.CUR.YEAR_LABEL[q.year] || '') + ' · ' + (L.SKILLS[q.skill] ? L.SKILLS[q.skill].label : ''))} · level ${q.difficulty}</span>
      <div class="prompt">${esc(q.prompt)}</div>
      ${child.readAloud ? '<button class="speakbtn" id="spk" aria-label="Read the question again">🔊</button>' : ''}
      ${renderVisual(ui.alt || q.visual)}
      <div class="choices">${q.choices.map(c => c.svg
        ? `<button class="choice svgc ${ui.choiceState[c.value] || ''}" data-v="${esc(c.value)}" aria-label="${esc(c.alt || c.label)}"><span class="opt">${esc(c.label)}</span>${c.svg}</button>`
        : `<button class="choice ${isPic ? 'pic' : String(c.label).length > 6 ? 'text' : ''} ${ui.choiceState[c.value] || ''}" data-v="${esc(c.value)}" aria-label="${esc(c.alt || c.label)}">${esc(c.label)}</button>`).join('')}</div>
      ${typed ? `<div class="typed"><label for="typedIn">Or type it</label><input id="typedIn" inputmode="numeric" autocomplete="off"><button class="btn small ghost" id="typedGo">Check</button></div>` : ''}
      <div class="feedback ${ui.feedback ? ui.feedback.cls : ''}" role="status">${ui.feedback ? esc(ui.feedback.t) : ''}</div>`;
    box.querySelectorAll('.choice').forEach(b => b.onclick = () => { const v = b.dataset.v; choose(q.grading === 'number-exact' ? Number(v) : v); });
    const spk = document.getElementById('spk'); if (spk) spk.onclick = () => speakAlways(q.speak);
    if (typed) { const go = () => choose(document.getElementById('typedIn').value); document.getElementById('typedGo').onclick = go; document.getElementById('typedIn').onkeydown = e => { if (e.key === 'Enter') go(); }; }
    renderClock();
  }
  function renderClock() {
    const c = app.querySelector('.clock'); if (!c) return;
    if (PRACTICE && practice.challenge) { c.textContent = `Question ${Math.min(session.index + 1, practice.roundSize)} of ${practice.roundSize} · ${mmss(session.elapsed)}`; return; }
    c.textContent = `${mmss(offset.elapsed + session.elapsed)} of up to ${mmss((PRACTICE ? practice.max : R.max) * 60)}`;
  }

  function nextAfter(ms, q) {
    ui.locked = true; render(q);
    setTimeout(() => {
      ui.locked = false; ui.feedback = null; ui.choiceState = {}; ui.alt = null;
      if (roundDone()) session._finish('round_done');
      if (session.done) finish(); else { render(); speak(session.current.speak); }
    }, ms);
  }
  function choose(value) {
    if (ui.locked || session.done || finished) return;
    const q = session.current;
    const res = session.answer(value);
    if (!res) return;
    if (res.status === 'unrecognised') { ui.feedback = { cls: 'gentle', t: res.message }; render(); speak(res.message); return; }
    if (res.status === 'correct') {
      ui.choiceState = { [value]: 'good' };
      ui.feedback = res.support === 'none' ? { cls: 'good', t: PRAISE[Math.floor(Math.random() * PRAISE.length)] }
        : { cls: 'good', t: 'Yes! You worked it out with a bit of help. We will try one like this again later.' };
      speak(ui.feedback.t); saveProgress(); nextAfter(1400, q); return;
    }
    ui.choiceState[value] = 'miss';
    if (res.next === 'retry') {
      ui.feedback = res.help.kind === 'hint' ? { cls: 'hint', t: 'Not quite. Here is a clue: ' + res.help.text } : { cls: 'hint', t: "Let's look at it together. " + res.help.text + ' Now you try.' };
      render(); speak(ui.feedback.t);
    } else {
      ui.feedback = { cls: 'gentle', t: 'That one was tricky. ' + res.help.text + ' We will come back to it another time.' };
      speak(ui.feedback.t); nextAfter(3500, q);
    }
  }

  function showBreak() {
    card(`<h2>Break time</h2><p style="font-size:18px;margin:0">Stretch, have a drink of water, wiggle your fingers. The learning clock is paused.</p>
      <p class="note" style="margin:0">Videos stay paused during a break. A break never adds extra learning.</p>
      <button class="btn" id="resume">I'm ready to carry on</button>`);
    speak('Break time. The learning clock is paused.');
    document.getElementById('resume').onclick = () => { onBreak = false; last = performance.now(); send({ type: 'learnBreak', on: false }); renderShell(); };
  }

  async function finish() {
    if (finished) return; finished = true;
    if (PRACTICE) return finishPractice();
    const s = session.summary();
    const summary = Object.assign({}, s, {
      learningSec: offset.elapsed + s.learningSec, independentCorrect: offset.independent + s.independentCorrect,
      attempts: session.attempts.map(a => ({ skill: a.skill, correct: a.correct, support: a.support }))
    });
    const out = await send({ type: 'learnFinish', summary });
    const early = s.reason === 'mastery';
    const rev = s.revisit.map(x => L.SKILLS[x].label.toLowerCase());
    const total = offset.independent + s.independentCorrect;
    if (out && out.state === 'rest') { showRest(true, total); return; }
    card(`<h2>${early ? 'You did it!' : 'Great effort today!'}</h2>
      <p style="font-size:18px;margin:0">${early ? `You answered ${total} by yourself, so you can go back early.` : `Learning time is up. You answered ${total} by yourself${s.supportedCorrect ? ` and ${s.supportedCorrect} with help` : ''}.`}</p>
      ${rev.length ? `<p class="note" style="margin:0">Next time we'll practise ${esc(rev.join(' and '))} again.</p>` : ''}
      <button class="btn" id="back">Back to my video</button>`);
    speak(early ? `You did it, ${child.name}!` : `Great effort today, ${child.name}!`);
    runtime.saved = out && out.saved;
    document.getElementById('back').onclick = goBack;
  }

  async function finishPractice() {
    const s = session.summary();
    const out = await send({ type: 'practiceFinish', result: { subject, challenge: practice.challenge, complete: s.reason === 'round_done', learningSec: s.learningSec, revisit: s.revisit,
      attempts: session.attempts.map(a => ({ skill: a.skill, correct: a.correct, support: a.support })) } }) || {};
    let head = 'Great practice!', body = `You answered ${s.independentCorrect} by yourself${s.supportedCorrect ? ` and ${s.supportedCorrect} with help` : ''}.`;
    if (practice.challenge && out.round) {
      const r = out.round, p = out.prev;
      if (s.reason !== 'round_done') body += ' Finish all ' + practice.roundSize + ' questions next time to set a best.';
      else if (out.best && p) { head = 'New personal best!'; body = `${r.score} of ${r.of} by yourself in ${mmss(r.sec)}. Your old best was ${p.score} of ${p.of} in ${mmss(p.sec)}.`; }
      else if (out.best) { head = 'Your first best!'; body = `${r.score} of ${r.of} by yourself in ${mmss(r.sec)}. Can you beat it next time?`; }
      else body = `${r.score} of ${r.of} by yourself in ${mmss(r.sec)}. Your best is still ${p.score} of ${p.of}. Every go makes your brain stronger.`;
    }
    card(`<h2>${head}</h2><p style="font-size:18px;margin:0">${esc(body)}</p>
      ${s.revisit.length ? `<p class="note" style="margin:0">We'll practise ${esc(s.revisit.map(x => L.SKILLS[x].label.toLowerCase()).join(' and '))} again.</p>` : ''}
      <div class="actions"><button class="btn" id="again">Practise again</button><button class="btn ghost" id="close">I'm done</button></div>`);
    speak(head);
    document.getElementById('again').onclick = () => location.reload();
    document.getElementById('close').onclick = () => window.close();
  }

  function showRest(afterLearning, total) {
    card(`<h2>That's all the video for today</h2>
      ${afterLearning ? `<p style="margin:0">Well done for your learning. You answered ${total} by yourself.</p>` : ''}
      <p style="font-size:18px;margin:0">How about drawing, building or playing outside?</p>
      <p class="note" style="margin:0">A grown-up can change today's limit in LearnLoop.</p>`);
    speak(`That's all the video for today, ${child.name}. How about drawing, building or playing outside?`);
  }

  function goBack() {
    const saved = runtime && runtime.saved;
    if (saved && saved.url) { const u = new URL(saved.url); if (saved.pos) u.searchParams.set('t', saved.pos + 's'); location.href = u.toString(); }
    else location.href = 'https://www.youtube.com/';
  }
})();
