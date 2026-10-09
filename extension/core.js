/* LearnLoop core: stored data shape and the pure rules the background worker applies.
 * No chrome.* calls here, so every rule can be unit tested in Node.
 */
(function (root) {
  'use strict';
  const SCHEMA = 1;
  const MAX_SESSIONS = 500;     // bound stored history
  const MAX_DAYS = 120;         // bound daily activity rows
  const MAX_HEARTBEAT_SEC = 70; // one update normally carries 5 s, or a few more if earlier ones could not be delivered. More means sleep or a clock jump: never credited

  function dayKey(ms) { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

  const DEFAULT_RULES = { ent: 5, max: 10, min: 2, cap: 60, tasks: 5, mastery: 4, mode: 'playback', practiceMax: 15 };
  const CHALLENGE_QUESTIONS = 10;

  function emptyDb() {
    return { schema: SCHEMA, parent: null, children: [], activeChildId: null, runtime: {}, revision: {}, skills: {},
      sessions: [], activity: {}, overrides: [], monitoringPausedUntil: 0,
      weekly: { email: '', day: 0, enabled: false }, outbox: [], lastBeat: null, createdAt: 0 };
  }

  const CUR = () => root.LLCurriculum || require('./curriculum.js');
  const YEARS = ['R', 'Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'];
  // The starting year comes from the date of birth (school year in England). After that only results move it.
  function startYearFrom(birthday, today, ageBand) {
    if (birthday) return CUR().schoolYearFor(birthday, today).start;
    if (ageBand === 'early') return 'R';
    if (ageBand === 'primary') return 'Y2';
    return YEARS.includes(ageBand) ? ageBand : 'Y1';
  }
  // Reasoning (the 11+ style track) runs from Year 4 to Year 6. Maths and English run from Reception to Year 6.
  const SUBJECTS = ['maths', 'english', 'reasoning'];
  const REASONING_YEARS = ['Y4', 'Y5', 'Y6'];
  const yearsFor = (subject) => subject === 'reasoning' ? REASONING_YEARS : YEARS;
  const clampYear = (subject, year) => { const ys = yearsFor(subject); if (ys.includes(year)) return year; return YEARS.indexOf(year) < YEARS.indexOf(ys[0]) ? ys[0] : ys[ys.length - 1]; };
  const subjectLabel = (subject) => CUR().SUBJECT_LABEL[subject] || subject;
  function newChild({ id, name, birthday = null, ageBand = null, subjects = { maths: true, english: true, reasoning: false }, today }) {
    const start = startYearFrom(birthday, today, ageBand);
    subjects = Object.assign({ maths: false, english: false, reasoning: false }, subjects);
    const years = { maths: start, english: start, reasoning: clampYear('reasoning', start) };
    return { id, name: String(name).slice(0, 30), birthday, band: start === 'R' ? 'early' : 'primary', subjects,
      startYear: Object.assign({}, years), stage: Object.assign({}, years),
      readAloud: start === 'R' || start === 'Y1', typing: start !== 'R', rules: Object.assign({}, DEFAULT_RULES) };
  }
  // Profiles made before version 0.4 had only a band. Give them a starting year once.
  function ensureChildModel(child, today) {
    if (!child.stage) {
      const start = startYearFrom(child.birthday, today, child.band);
      child.startYear = { maths: start, english: start }; child.stage = { maths: start, english: start };
    }
    // Profiles made before version 1.1 had no Reasoning. Add it switched off, starting no lower than Year 4.
    if (!child.stage.reasoning) {
      const base = child.startYear && child.startYear.maths ? child.startYear.maths : child.stage.maths;
      child.startYear = Object.assign({}, child.startYear, { reasoning: clampYear('reasoning', base) });
      child.stage.reasoning = clampYear('reasoning', base);
    }
    child.subjects = Object.assign({ maths: false, english: false, reasoning: false }, child.subjects);
    return child;
  }

  // ---------- progression: per-skill levels and the year being worked on ----------
  // Deterministic rules. Only answers given without any help count as evidence.
  const RECENT = 8, WINDOW = 6, UP_NEED = 5, DOWN_MAX = 2, STAGE_UP_SHARE = 0.75, STAGE_DOWN_SHARE = 0.5;
  function skillRec(db, childId, skill) {
    const sk = db.skills[childId] = db.skills[childId] || {};
    const s = sk[skill] = sk[skill] || { attempts: 0, independent: 0, supported: 0, incorrect: 0, last: 0 };
    if (!s.level) s.level = 1; if (!s.recent) s.recent = [];
    return s;
  }
  function logChange(db, childId, entry) {
    const log = db.levelLog = db.levelLog || {}; const l = log[childId] = log[childId] || [];
    l.push(entry); if (l.length > 200) l.splice(0, l.length - 200);
  }
  function updateProgress(db, child, subject, attempts, sessionKey, nowMs) {
    const C = CUR(); const changes = [];
    const touched = new Set();
    for (const a of attempts || []) {
      if (!C.SKILLS[a.skill]) continue;
      const s = skillRec(db, child.id, a.skill);
      s.recent.push({ ok: a.correct && a.support === 'none' ? 1 : 0, s: sessionKey });
      if (s.recent.length > RECENT) s.recent.splice(0, s.recent.length - RECENT);
      touched.add(a.skill);
    }
    for (const skill of touched) {
      const s = skillRec(db, child.id, skill); const last = s.recent.slice(-WINDOW);
      if (last.length < WINDOW) continue;
      const ok = last.reduce((t, x) => t + x.ok, 0), sessions = new Set(last.map(x => x.s)).size;
      if (sessions < 2) continue; // one good or bad day is not enough evidence
      const label = C.SKILLS[skill].label;
      if (ok >= UP_NEED && s.level < C.MAX_LEVEL) {
        const from = s.level; s.level++; s.recent = [];
        changes.push({ at: nowMs, kind: 'level', skill, subject, from, to: s.level, reason: `${label} moved up to level ${s.level}: ${ok} of the last ${WINDOW} answers were given without help, over ${sessions} sessions.` });
      } else if (ok <= DOWN_MAX && s.level > 1) {
        const from = s.level; s.level--; s.recent = [];
        changes.push({ at: nowMs, kind: 'level', skill, subject, from, to: s.level, reason: `${label} moved back to level ${s.level}: only ${ok} of the last ${WINDOW} answers were given without help, over ${sessions} sessions. Easier questions build confidence first.` });
      }
    }
    // Year being worked on: move up when most of this year's skills are at the top level, back when most are a struggle
    ensureChildModel(child, dayKey(nowMs));
    const year = child.stage[subject]; const skills = C.skillsIn(subject, year); const YS = yearsFor(subject); const yi = YS.indexOf(year);
    const top = skills.filter(k => (db.skills[child.id] || {})[k] && db.skills[child.id][k].level === C.MAX_LEVEL).length;
    const struggling = skills.filter(k => { const r = (db.skills[child.id] || {})[k]; if (!r || r.level !== 1 || !r.recent || r.recent.length < WINDOW) return false;
      const last = r.recent.slice(-WINDOW); return last.reduce((t, x) => t + x.ok, 0) <= DOWN_MAX && new Set(last.map(x => x.s)).size >= 2; }).length;
    if (skills.length && top / skills.length >= STAGE_UP_SHARE && yi >= 0 && yi < YS.length - 1) {
      child.stage[subject] = YS[yi + 1];
      changes.push({ at: nowMs, kind: 'year', subject, from: year, to: child.stage[subject], reason: `Started ${C.YEAR_LABEL[child.stage[subject]]} ${subjectLabel(subject)}: ${top} of ${skills.length} ${C.YEAR_LABEL[year]} skills reached the top level.` });
    } else if (skills.length && struggling / skills.length >= STAGE_DOWN_SHARE && yi > 0) {
      child.stage[subject] = YS[yi - 1];
      changes.push({ at: nowMs, kind: 'year', subject, from: year, to: child.stage[subject], reason: `Went back to ${C.YEAR_LABEL[child.stage[subject]]} ${subjectLabel(subject)} for now: ${struggling} of ${skills.length} ${C.YEAR_LABEL[year]} skills were hard across several sessions.` });
    }
    for (const c of changes) logChange(db, child.id, c);
    return changes;
  }
  // Choose the skills and levels for the next session: practise-again first, then skills not seen for a week, then the least recent.
  function planSession(db, child, subject, nowMs) {
    const C = CUR(); ensureChildModel(child, dayKey(nowMs));
    const year = child.stage[subject]; const skills = C.skillsIn(subject, year);
    const sk = db.skills[child.id] || {}; const revision = ((db.revision[child.id] || {})[subject] || []).filter(k => C.SKILLS[k]);
    const WEEK = 7 * 86400000;
    const order = skills.slice().sort((a, b) => {
      const la = (sk[a] && sk[a].last) || 0, lb = (sk[b] && sk[b].last) || 0;
      const sa = nowMs - la > WEEK ? 0 : 1, sb = nowMs - lb > WEEK ? 0 : 1;
      return sa - sb || la - lb;
    });
    // Parent choices: skipped topics are left out (unless that would leave nothing), focus topics come straight after practise-again,
    // and the child's own spelling list joins every English session once it has at least 3 words.
    const skip = new Set(((child.skip || {})[subject] || []).filter(k => C.SKILLS[k]));
    const focus = ((child.focus || {})[subject] || []).filter(k => C.SKILLS[k] && C.SKILLS[k].subject === subject && !skip.has(k));
    if (subject === 'english' && (child.spellings || []).length >= 3 && !skip.has('my-spellings')) focus.unshift('my-spellings');
    let list = [...new Set([...revision, ...focus, ...order])];
    const kept = list.filter(k => !skip.has(k));
    if (kept.length) list = kept;
    return list.filter(k => k !== 'my-spellings' || (child.spellings || []).length >= 3).map(skill => ({ skill, level: (sk[skill] && sk[skill].level) || 1 }));
  }
  // A parent types or pastes the words, separated by commas, spaces or new lines. Letters, apostrophes and hyphens only.
  const MAX_SPELLINGS = 30;
  function cleanSpellings(text) {
    const seen = new Set(), out = [], rejected = [];
    for (const raw of String(text || '').split(/[\s,;]+/)) {
      const w = raw.trim().replace(/[.!?]+$/, ''); if (!w) continue;
      if (!/^[A-Za-z][A-Za-z'’-]{1,19}$/.test(w)) { rejected.push(w); continue; }
      const k = w.toLowerCase(); if (seen.has(k)) continue; seen.add(k);
      if (out.length < MAX_SPELLINGS) out.push(w); else rejected.push(w);
    }
    return { words: out, rejected };
  }
  function setStage(db, child, subject, year, nowMs) {
    ensureChildModel(child, dayKey(nowMs)); if (!yearsFor(subject).includes(year) || child.stage[subject] === year) return;
    const from = child.stage[subject]; child.stage[subject] = year;
    logChange(db, child.id, { at: nowMs, kind: 'year', subject, from, to: year, reason: `A parent set ${subjectLabel(subject)} to ${CUR().YEAR_LABEL[year]}.` });
  }

  function runtimeFor(db, childId, nowMs) {
    const k = dayKey(nowMs);
    let r = db.runtime[childId];
    if (!r) r = db.runtime[childId] = { state: 'entertainment', balanceUsed: 0, dayKey: k, dayWatched: 0, saved: null, subject: null,
      session: null, nextSubject: 'maths', returnPending: false, transitionAt: 0 };
    if (r.dayKey !== k) { // new day: daily total resets, a finished day's rest ends
      r.dayKey = k; r.dayWatched = 0;
      if (r.state === 'rest') r.state = 'entertainment';
    }
    return r;
  }

  function activityRow(db, childId, nowMs) {
    const k = dayKey(nowMs);
    const a = db.activity[childId] = db.activity[childId] || {};
    if (!a[k]) {
      a[k] = { watchedSec: 0, backgroundSec: 0, pipSec: 0, gaps: 0, lockedSec: 0, unfocusedSec: 0, notSelectedSec: 0, duringSwitchSec: 0, contentSec: 0 };
      const keys = Object.keys(a).sort(); while (keys.length > MAX_DAYS) delete a[keys.shift()];
    }
    return a[k];
  }

  /* hb: { candidateSec, backgroundSec, pipSec, fromActiveTab }  (measured in the page with a monotonic clock)
   * ctx: { idleState: 'active'|'idle'|'locked', nowMs }
   * Returns a list of effects for the background worker to carry out. */
  function applyHeartbeat(db, hb, ctx) {
    const effects = [];
    const child = db.children.find(c => c.id === db.activeChildId);
    if (!child) {
      const k = dayKey(ctx.nowMs), u = db.unassigned = db.unassigned || {};
      const add = (typeof hb.candidateSec === 'number' && hb.candidateSec > 0 && hb.candidateSec <= MAX_HEARTBEAT_SEC) ? hb.candidateSec : 0;
      u[k] = (u[k] || 0) + add;
      const keys = Object.keys(u).sort(); while (keys.length > MAX_DAYS) delete u[keys.shift()];
      return { effects: ['needChild'] };
    }
    if (ctx.nowMs < (db.monitoringPausedUntil || 0)) return { effects: ['paused'] };
    const r = runtimeFor(db, child.id, ctx.nowMs);
    const row = activityRow(db, child.id, ctx.nowMs);
    const clamp = (x) => (typeof x === 'number' && x > 0 ? x : 0);
    let cand = clamp(hb.candidateSec);
    row.backgroundSec += Math.min(clamp(hb.backgroundSec), 70);
    row.pipSec += Math.min(clamp(hb.pipSec), MAX_HEARTBEAT_SEC);
    row.unfocusedSec = (row.unfocusedSec || 0) + Math.min(clamp(hb.unfocusedSec), 70);
    if (cand > MAX_HEARTBEAT_SEC) { row.gaps++; cand = 0; }
    if (ctx.idleState === 'locked') { row.lockedSec += cand; cand = 0; }
    if (!hb.fromActiveTab) { row.notSelectedSec = (row.notSelectedSec || 0) + cand; cand = 0; } // only the selected tab of the focused window counts: no double counting
    if (r.state !== 'entertainment') {
      row.duringSwitchSec = (row.duringSwitchSec || 0) + cand;
      if (cand > 0 || hb.playing) effects.push('enforce');
      return { effects };
    }
    if (cand === 0) return { effects };
    r.balanceUsed += cand; r.dayWatched += cand; row.watchedSec += cand;
    row.contentSec = (row.contentSec || 0) + Math.min(clamp(hb.contentSec), cand * 4 + 1);
    if (r.dayWatched >= child.rules.cap * 60) { r.state = 'rest'; effects.push('rest'); }
    else if (r.balanceUsed >= child.rules.ent * 60) {
      r.state = 'transition'; r.transitionAt = ctx.nowMs; r.subject = pickSubject(child, r);
      effects.push('transition');
    }
    return { effects };
  }

  function pickSubject(child, r) {
    const on = SUBJECTS.filter(s => child.subjects && child.subjects[s]);
    if (!on.length) return 'maths';
    const s = on.includes(r.nextSubject) ? r.nextSubject : on[0];
    r.nextSubject = on[(on.indexOf(s) + 1) % on.length];
    return s;
  }

  // Countdown finished (or the tab was closed during it): learning starts.
  function beginLearning(db, childId, saved, nowMs) {
    const r = runtimeFor(db, childId, nowMs);
    if (r.state !== 'transition' && r.state !== 'learning') return false;
    if (saved && saved.url) r.saved = { url: saved.url, pos: Math.max(0, Math.floor(saved.pos || 0)) };
    r.state = 'learning';
    if (!r.session || r.session.subject !== r.subject) r.session = { subject: r.subject, elapsed: 0, independent: 0, startedAt: nowMs };
    return true;
  }

  // Progress is saved during a session so a crash or closed tab resumes rather than restarts.
  function saveProgress(db, childId, p) {
    const r = db.runtime[childId]; if (!r || !r.session) return;
    r.session.elapsed = Math.max(r.session.elapsed, Math.floor(p.elapsed));
    r.session.independent = Math.max(r.session.independent, p.independent);
  }

  function finishLearning(db, childId, summary, nowMs) {
    const r = runtimeFor(db, childId, nowMs);
    const child = db.children.find(c => c.id === childId);
    if (!child || (r.state !== 'learning' && r.state !== 'break')) return null;
    const subject = r.session ? r.session.subject : r.subject;
    db.sessions.push({ childId, subject, startedAt: r.session ? r.session.startedAt : nowMs, endedAt: nowMs, reason: summary.reason,
      learningSec: summary.learningSec, ind: summary.independentCorrect, sup: summary.supportedCorrect, incorrect: summary.incorrect,
      revisit: summary.revisit.slice(), skills: summary.skillsPractised.slice() });
    if (db.sessions.length > MAX_SESSIONS) db.sessions.splice(0, db.sessions.length - MAX_SESSIONS);
    db.revision[childId] = db.revision[childId] || { maths: [], english: [], reasoning: [] };
    db.revision[childId][subject] = summary.revisit.slice();
    for (const a of summary.attempts || []) {
      const s = skillRec(db, childId, a.skill);
      s.attempts++; s.last = nowMs;
      if (!a.correct) s.incorrect++; else if (a.support === 'none') s.independent++; else s.supported++;
    }
    const changes = updateProgress(db, child, subject, summary.attempts, r.session ? r.session.startedAt : nowMs, nowMs);
    db.sessions[db.sessions.length - 1].changes = changes.map(c => c.reason);
    r.session = null; r.balanceUsed = 0; // fresh allowance. Wrong answers never create time debt.
    r.state = r.dayWatched >= child.rules.cap * 60 ? 'rest' : 'entertainment';
    r.returnPending = !!r.saved && r.state === 'entertainment';
    return r.state;
  }

  function parentOverride(db, childId, action, nowMs, minutes) {
    const r = runtimeFor(db, childId, nowMs);
    db.overrides.push({ childId, action, at: nowMs, fromState: r.state });
    if (db.overrides.length > 200) db.overrides.shift();
    if (action === 'skipLearning') { r.state = 'entertainment'; r.session = null; r.balanceUsed = 0; r.returnPending = !!r.saved; }
    if (action === 'resetToday') { r.dayWatched = 0; if (r.state === 'rest') r.state = 'entertainment'; }
    if (action === 'pauseMonitoring') { db.monitoringPausedUntil = nowMs + (minutes || 30) * 60000; }
    if (action === 'resumeMonitoring') { db.monitoringPausedUntil = 0; }
    return r.state;
  }

  // A countdown that never finished (tab closed, browser crashed) recovers into learning, never into credit.
  function recover(db, nowMs) {
    for (const id of Object.keys(db.runtime)) {
      const r = runtimeFor(db, id, nowMs);
      if (r.state === 'transition' && nowMs - r.transitionAt > 60000) beginLearning(db, id, null, nowMs);
    }
  }

  // ---------- parent PIN: PBKDF2-SHA256 with salt, plus a growing wait after failures ----------
  const ITERATIONS = 600000;
  const subtle = () => (root.crypto && root.crypto.subtle) || require('crypto').webcrypto.subtle;
  const randomBytes = (n) => { const a = new Uint8Array(n); ((root.crypto && root.crypto.getRandomValues) ? root.crypto : require('crypto').webcrypto).getRandomValues(a); return a; };
  const toHex = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const fromHex = (h) => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
  async function hashSecret(secret, saltHex, iterations = ITERATIONS) {
    const key = await subtle().importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations }, key, 256);
    return toHex(bits);
  }
  function validPin(pin) { return /^\d{4,8}$/.test(pin); }
  async function setParentPin(db, pin, iterations = ITERATIONS) {
    if (!validPin(pin)) throw new Error('PIN must be 4 to 8 digits');
    const salt = toHex(randomBytes(16)), rsalt = toHex(randomBytes(16));
    const recoveryCode = toHex(randomBytes(5)).toUpperCase(); // 10 characters, shown once
    db.parent = { salt, hash: await hashSecret(pin, salt, iterations), iterations,
      rsalt, rhash: await hashSecret(recoveryCode, rsalt, iterations), fails: 0, lockUntil: 0 };
    return recoveryCode;
  }
  function eqConst(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
  async function checkPin(db, pin, nowMs) {
    const p = db.parent; if (!p) return { ok: false, reason: 'not_set' };
    if (nowMs < p.lockUntil) return { ok: false, reason: 'wait', waitSec: Math.ceil((p.lockUntil - nowMs) / 1000) };
    const ok = eqConst(await hashSecret(String(pin), p.salt, p.iterations), p.hash);
    if (ok) { p.fails = 0; return { ok: true }; }
    p.fails++;
    if (p.fails >= 5) { p.lockUntil = nowMs + Math.min(30 * 60, 60 * Math.pow(2, p.fails - 5)) * 1000; return { ok: false, reason: 'wait', waitSec: Math.ceil((p.lockUntil - nowMs) / 1000) }; }
    return { ok: false, reason: 'wrong', triesLeft: 5 - p.fails };
  }
  async function checkRecovery(db, code) {
    const p = db.parent; if (!p) return false;
    return eqConst(await hashSecret(String(code).trim().toUpperCase(), p.rsalt, p.iterations), p.rhash);
  }

  // ---------- reporting ----------
  function report(db, childId, fromMs, toMs) {
    const days = db.activity[childId] || {};
    const inRange = Object.keys(days).filter(k => k >= dayKey(fromMs) && k <= dayKey(toMs));
    const sum = (f) => inRange.reduce((t, k) => t + (days[k][f] || 0), 0);
    const sessions = db.sessions.filter(s => s.childId === childId && s.endedAt >= fromMs && s.endedAt <= toMs);
    const t = (f) => sessions.reduce((a, s) => a + (s[f] || 0), 0);
    const ind = t('ind'), sup = t('sup'), inc = t('incorrect');
    return {
      watchedSec: Math.round(sum('watchedSec')), watchedMin: Math.round(sum('watchedSec') / 60), backgroundMin: Math.round(sum('backgroundSec') / 60),
      pipMin: Math.round(sum('pipSec') / 60), lockedMin: Math.round(sum('lockedSec') / 60), gaps: sum('gaps'),
      unfocusedMin: Math.round(sum('unfocusedSec') / 60), notSelectedSec: Math.round(sum('notSelectedSec')),
      duringSwitchSec: Math.round(sum('duringSwitchSec')), contentSec: Math.round(sum('contentSec')),
      backgroundSec: Math.round(sum('backgroundSec')), pipSec: Math.round(sum('pipSec')), lockedSec: Math.round(sum('lockedSec')), unfocusedSec: Math.round(sum('unfocusedSec')),
      learningSec: t('learningSec'), learningMin: Math.round(t('learningSec') / 60), sessions: sessions.length,
      practiceSec: sessions.filter(s => s.practice).reduce((a, s) => a + (s.learningSec || 0), 0), practiceMin: Math.round(sessions.filter(s => s.practice).reduce((a, s) => a + (s.learningSec || 0), 0) / 60),
      independent: ind, supported: sup, incorrect: inc,
      independentAccuracy: ind + sup + inc ? Math.round(100 * ind / (ind + sup + inc)) : null,
      revisit: [...new Set(sessions.slice(-4).flatMap(s => s.revisit))],
      skillsPractised: [...new Set(sessions.flatMap(s => s.skills || []))],
      overrides: db.overrides.filter(o => o.childId === childId && o.at >= fromMs && o.at <= toMs).length
    };
  }
  function csv(db) {
    const rows = [['child', 'subject', 'started', 'ended', 'how_it_ended', 'learning_seconds', 'independent', 'with_help', 'incorrect', 'practise_again']];
    const name = (id) => (db.children.find(c => c.id === id) || {}).name || id;
    for (const s of db.sessions) rows.push([name(s.childId), s.subject, new Date(s.startedAt).toISOString(), new Date(s.endedAt).toISOString(), s.reason, s.learningSec, s.ind, s.sup, s.incorrect, s.revisit.join(' ')]);
    rows.push([]); rows.push(['child', 'date', 'measured_watching_seconds', 'background_playback_seconds_not_counted', 'picture_in_picture_seconds_not_counted', 'locked_seconds_not_counted', 'gaps']);
    for (const [id, days] of Object.entries(db.activity)) for (const [k, d] of Object.entries(days)) rows.push([name(id), k, Math.round(d.watchedSec), Math.round(d.backgroundSec), Math.round(d.pipSec), Math.round(d.lockedSec), d.gaps]);
    return rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n');
  }


  // ---------- why a heartbeat did or did not count (shown to parents) ----------
  const REASONS = {
    counted: 'Counting: a video is playing in the front tab',
    not_playing: 'Not counting: the video is paused or has not started',
    background: 'Not counting: YouTube is not the selected tab',
    window: 'Not counting: another window or app is in front of Chrome',
    locked: 'Not counting: the laptop is locked',
    gap: 'Not counting: the laptop was asleep or the page froze',
    pip: 'Not counting: picture in picture is not counted',
    no_child: "Waiting for someone to choose who's watching on YouTube",
    paused: 'Monitoring is paused by a parent',
    learning: 'Video time is paused while learning is due',
    rest: 'Daily video limit reached'
  };
  function beatReason(i) {
    if (i.paused) return 'paused';
    if (!i.child) return 'no_child';
    if (i.state && i.state !== 'entertainment') return i.state === 'rest' ? 'rest' : 'learning';
    if (i.gap) return 'gap';
    if (i.locked) return 'locked';
    if (i.pip) return 'pip';
    if (!i.visible || !i.selectedTab) return 'background';
    if (!i.focused) return 'window';
    if (i.mode === 'playback' && !i.playing) return 'not_playing';
    return 'counted';
  }

  // ---------- practice chosen by the child (no video needed, earns no video time) ----------
  // Practice never changes the watching state, the video balance or the daily limit. Answers still count as evidence for levels,
  // because they are real answers. A "beat your own best" round is 10 questions, compared only with the child's own best.
  function betterThan(a, b) { return !b || a.score > b.score || (a.score === b.score && a.sec < b.sec); }
  function recordPractice(db, childId, p, nowMs) {
    const child = db.children.find(c => c.id === childId);
    if (!child || !SUBJECTS.includes(p.subject) || !child.subjects[p.subject]) return null;
    const attempts = (p.attempts || []).filter(a => CUR().SKILLS[a.skill] && CUR().SKILLS[a.skill].subject === p.subject).slice(0, 200);
    // The phone app records its learning sessions through here too (practice: false). They are capped at the learning maximum.
    const isPractice = p.practice !== false;
    const capMin = isPractice ? (child.rules.practiceMax || DEFAULT_RULES.practiceMax) : (child.rules.max || DEFAULT_RULES.max);
    const sec = Math.max(0, Math.min(Math.round(+p.learningSec || 0), capMin * 60 + 30));
    const ind = attempts.filter(a => a.correct && a.support === 'none').length, sup = attempts.filter(a => a.correct && a.support !== 'none').length;
    const revisit = [...new Set((p.revisit || []).filter(k => CUR().SKILLS[k]))];
    db.sessions.push({ childId, subject: p.subject, startedAt: nowMs - sec * 1000, endedAt: nowMs, reason: isPractice ? (p.challenge ? 'challenge' : 'practice') : (['mastery', 'time_limit', 'stopped'].includes(p.reason) ? p.reason : 'time_limit'), practice: isPractice,
      learningSec: sec, ind, sup, incorrect: attempts.filter(a => !a.correct).length, revisit, skills: [...new Set(attempts.map(a => a.skill))] });
    if (db.sessions.length > MAX_SESSIONS) db.sessions.splice(0, db.sessions.length - MAX_SESSIONS);
    for (const a of attempts) { const s = skillRec(db, childId, a.skill); s.attempts++; s.last = nowMs; if (!a.correct) s.incorrect++; else if (a.support === 'none') s.independent++; else s.supported++; }
    db.revision[childId] = db.revision[childId] || { maths: [], english: [], reasoning: [] };
    db.revision[childId][p.subject] = [...new Set([...(db.revision[childId][p.subject] || []), ...revisit])].slice(-8);
    const changes = updateProgress(db, child, p.subject, attempts, 'practice:' + nowMs, nowMs);
    db.sessions[db.sessions.length - 1].changes = changes.map(c => c.reason);
    let out = { changes: changes.map(c => c.reason) };
    if (isPractice && p.challenge && attempts.length) {
      // the score is the questions answered by themselves in the round, so a guessed or helped answer never inflates it
      const round = { score: Math.min(ind, CHALLENGE_QUESTIONS), of: CHALLENGE_QUESTIONS, sec, at: nowMs, year: child.stage[p.subject] };
      db.best = db.best || {}; const b = db.best[childId] = db.best[childId] || {};
      const prev = b[p.subject] || null; const isBest = !!p.complete && betterThan(round, prev); // only a finished round of 10 can set a best
      if (isBest) b[p.subject] = round;
      out = Object.assign(out, { round, prev, best: isBest });
    }
    return out;
  }

  // ---------- weekly report ----------
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function validEmail(e) { return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/.test(String(e || '').trim()) && String(e).length <= 254; }
  // The report day starts a new week. A report prepared on that day covers the 7 days before it.
  function weekPeriod(nowMs, reportDay) {
    const d = new Date(nowMs); d.setHours(0, 0, 0, 0);
    while (d.getDay() !== reportDay) d.setDate(d.getDate() - 1);
    const to = d.getTime(); const f = new Date(d); f.setDate(f.getDate() - 7);
    return { fromMs: f.getTime(), toMs: to, key: dayKey(f.getTime()) };
  }
  function weeklyData(db, period) {
    const prevFrom = new Date(period.fromMs); prevFrom.setDate(prevFrom.getDate() - 7);
    return db.children.map(c => ({ child: c, now: report(db, c.id, period.fromMs, period.toMs - 1), prev: report(db, c.id, prevFrom.getTime(), period.fromMs - 1) }));
  }
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(ms) { const d = new Date(ms); return `${DAY_NAMES[d.getDay()].slice(0, 3)} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; }
  function weeklyText(db, period, skillLabel) {
    const label = (k) => (skillLabel && skillLabel(k)) || k;
    const lines = ['LearnLoop weekly report', `Week: ${fmtDate(period.fromMs)} to ${fmtDate(period.toMs - 86400000)}`, ''];
    for (const { child, now, prev } of weeklyData(db, period)) {
      const trend = now.learningMin > prev.learningMin ? `up from ${prev.learningMin} min the week before` : now.learningMin < prev.learningMin ? `down from ${prev.learningMin} min the week before` : 'same as the week before';
      lines.push(child.name);
      lines.push(`- Measured video: ${now.watchedMin} min (not counted: ${now.backgroundMin + now.pipMin + now.lockedMin} min in background, picture in picture or locked)`);
      lines.push(`- Active learning: ${now.learningMin} min in ${now.sessions} session${now.sessions === 1 ? '' : 's'}, ${trend}${now.practiceMin ? ` (including ${now.practiceMin} min of practice they chose themselves)` : ''}`);
      lines.push(`- Answers by themselves: ${now.independent}. With help: ${now.supported}. Not yet: ${now.incorrect}`);
      if (now.skillsPractised.length) lines.push(`- Skills practised: ${now.skillsPractised.map(label).join(', ')}`);
      lines.push(`- Practise again: ${now.revisit.length ? now.revisit.map(label).join(', ') : 'nothing flagged'}`);
      if (child.stage) lines.push(`- Working at: ${SUBJECTS.filter(sj => child.subjects && child.subjects[sj] && child.stage[sj]).map(sj => `${subjectLabel(sj)} ${CUR().YEAR_LABEL[child.stage[sj]]}`).join(', ')}`);
      const moved = ((db.levelLog || {})[child.id] || []).filter(x => x.at >= period.fromMs && x.at < period.toMs);
      for (const x of moved.slice(-5)) lines.push(`- ${x.reason}`);
      lines.push(`- Parent overrides: ${now.overrides}. Monitoring gaps: ${now.gaps}`);
      lines.push('');
    }
    lines.push('Video time is measured only while a video plays in the front Chrome tab with the laptop unlocked. Learning time counts only while the learning screen was on screen.');
    return lines.join('\n');
  }
  // Called every minute and at start-up. Queues each week once, even if the laptop was off on the report day.
  function queueWeekly(db, nowMs) {
    const w = db.weekly; if (!w || !w.enabled || !validEmail(w.email)) return null;
    if (!db.createdAt) db.createdAt = nowMs;
    const p = weekPeriod(nowMs, w.day);
    if (p.toMs <= db.createdAt) return null;           // nothing to report from before LearnLoop was set up
    db.outbox = db.outbox || [];
    if (db.outbox.some(o => o.key === p.key)) return null; // duplicate prevention
    const item = { key: p.key, fromMs: p.fromMs, toMs: p.toMs, createdAt: nowMs, status: 'ready' };
    db.outbox.push(item);
    if (db.outbox.length > 52) db.outbox.splice(0, db.outbox.length - 52);
    return item;
  }
  function markSent(db, key, nowMs) { const o = (db.outbox || []).find(x => x.key === key); if (o) { o.status = 'sent'; o.sentAt = nowMs; } return !!o; }

  const api = { SCHEMA, DEFAULT_RULES, dayKey, emptyDb, newChild, runtimeFor, applyHeartbeat, beginLearning, saveProgress, finishLearning,
    parentOverride, recover, hashSecret, newChildModel: ensureChildModel, ensureChildModel, startYearFrom, updateProgress, planSession, cleanSpellings, MAX_SPELLINGS, setStage, recordPractice, betterThan, CHALLENGE_QUESTIONS, YEARS, SUBJECTS, REASONING_YEARS, yearsFor, setParentPin, checkPin, checkRecovery, validPin, report, csv, MAX_HEARTBEAT_SEC,
    REASONS, beatReason, DAY_NAMES, validEmail, weekPeriod, weeklyData, weeklyText, queueWeekly, markSent };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LLCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
