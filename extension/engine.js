/* LearnLoop tutoring engine (preview build).
 * Deterministic rules only. No AI model is used anywhere in this file.
 * Works in the browser (window.LearnLoop) and in Node (module.exports).
 */
(function (root) {
  'use strict';

  // ---------- small utilities ----------
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function shuffle(r, a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // ---------- age band (starting content only) ----------
  // Age sets the starting band when a profile is created. It never raises difficulty later.
  function ageOn(birthday, today) {
    const b = new Date(birthday + 'T00:00:00'), t = new Date(today + 'T00:00:00');
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
  }
  function startingBand(age) { return age <= 5 ? 'early' : 'primary'; }
  // School year in England from the date of birth (1 September cut-off). Used only for the starting point.
  function startingYear(birthday, today) { return root.LLCurriculum ? root.LLCurriculum.schoolYearFor(birthday, today) : require('./curriculum.js').schoolYearFor(birthday, today); }

  // ---------- number normalisation for typed or spoken answers ----------
  const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve',
    'thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
  function normaliseNumber(input) {
    if (input === null || input === undefined) return null;
    const s = String(input).trim().toLowerCase().replace(/[.!?]$/, '');
    if (/^\d{1,3}$/.test(s)) return parseInt(s, 10);
    const i = WORDS.indexOf(s);
    if (i >= 0) return i;
    if (s === 'for') return 4; if (s === 'to' || s === 'too') return 2; if (s === 'ate') return 8;
    return null; // unrecognised input is an input failure, not a wrong answer
  }

  // ---------- question bank: curriculum.js (aligned to the national curriculum in England) ----------
  const CUR = root.LLCurriculum || (typeof require === 'function' ? require('./curriculum.js') : null);
  const CONTENT_VERSION_BANK = CUR.CONTENT_VERSION;
  const SKILLS = CUR.SKILLS;

  let qCounter = 0;
  function makeQuestion(skill, r, level = 1) {
    const meta = SKILLS[skill]; const lv = Math.max(1, Math.min(CUR.MAX_LEVEL, level | 0 || 1));
    const q = meta.gen(r, lv);
    return Object.assign(q, {
      id: `${skill}/L${lv}/${q.variant}/v${CONTENT_VERSION_BANK}#${++qCounter}`, skill, subject: meta.subject, year: meta.year,
      difficulty: lv, contentVersion: CONTENT_VERSION_BANK, grading: typeof q.answer === 'number' ? 'number-exact' : 'text-exact'
    });
  }
  // Older profiles used two bands. Early maps to Reception, primary to Year 2.
  function skillsFor(subject, bandOrYear) {
    const year = bandOrYear === 'early' ? 'R' : bandOrYear === 'primary' ? 'Y2' : bandOrYear;
    return CUR.skillsIn(subject, year);
  }

  function grade(q, input) {
    if (q.grading === 'number-exact') {
      const n = typeof input === 'number' ? input : normaliseNumber(input);
      if (n === null) return { status: 'unrecognised' };
      return { status: n === q.answer ? 'correct' : 'incorrect' };
    }
    if (input === null || input === undefined || String(input).trim() === '') return { status: 'unrecognised' };
    // Text answers come from the buttons, so they must match exactly. Case matters: some questions are about capital letters.
    return { status: String(input).trim() === String(q.answer) ? 'correct' : 'incorrect' };
  }

  // ---------- learning session ----------
  // support levels: none < hint < demo. Only 'none' counts towards independent mastery.
  const SUPPORT = { none: 0, hint: 1, demo: 2 };
  const MAX_WRONG_PER_QUESTION = 3;

  class LearningSession {
    // plan: [{ skill, level }] chosen by the progression rules. Without a plan, every skill of the year at level 1.
    constructor({ subject, band, year, plan, config, seed = 1, revision = [] }) {
      this.subject = subject; this.band = band;
      this.cfg = Object.assign({ minSec: 120, maxSec: 600, tasks: 5, masteryTarget: 4 }, config);
      this.r = rng(seed); this.elapsed = 0; this.paused = false;
      this.attempts = []; this.independentVariants = new Set(); this.seenVariants = new Set();
      this.revisit = new Set(); this.done = null; this.transferGiven = false;
      const p = (plan && plan.length) ? plan : skillsFor(subject, year || band).map(skill => ({ skill, level: 1 }));
      this.levels = {}; for (const x of p) this.levels[x.skill] = x.level || 1;
      this.skills = p.map(x => x.skill);
      this.queue = [];
      const revSkills = revision.filter(s => this.skills.includes(s));
      for (let i = 0; i < this.cfg.tasks; i++) {
        const skill = i < revSkills.length ? revSkills[i] : this.skills[i % this.skills.length];
        this.queue.push(this._fresh(skill));
      }
      this.planned = this.cfg.tasks;
      this.index = 0; this._resetQ();
    }
    _fresh(skill, level) {
      const lv = level || this.levels[skill] || 1;
      for (let tries = 0; tries < 40; tries++) {
        const q = makeQuestion(skill, this.r, lv);
        if (!this.seenVariants.has(q.variant) && !this.queue.some(x => x.variant === q.variant)) return q;
      }
      return makeQuestion(skill, this.r, lv);
    }
    _resetQ() { this.wrong = 0; this.support = 'none'; this.altShown = false; }
    get current() { return this.done ? null : this.queue[this.index]; }
    get independentCount() { return this.independentVariants.size; }
    tick(sec) {
      if (this.done || this.paused) return;
      this.elapsed = Math.min(this.elapsed + sec, this.cfg.maxSec);
      if (this.elapsed >= this.cfg.maxSec) this._finish('time_limit');
    }
    pause() { this.paused = true; }
    resume() { this.paused = false; }
    _raise(level) { if (SUPPORT[level] > SUPPORT[this.support]) this.support = level; }
    help() { // first press: hint, second: worked example
      if (this.done) return null;
      if (this.support === 'none') { this._raise('hint'); return { kind: 'hint', text: this.current.hint }; }
      this._raise('demo'); return { kind: 'worked', text: this.current.worked };
    }
    anotherWay() { if (this.done) return null; this._raise('hint'); this.altShown = true; return this.current.alt; }
    answer(input) {
      const q = this.current; if (!q) return null;
      const g = grade(q, input);
      if (g.status === 'unrecognised') return { status: 'unrecognised', message: "I didn't quite catch that. Try again or tap an answer." };
      const rec = { qid: q.id, skill: q.skill, level: q.difficulty, variant: q.variant, correct: g.status === 'correct', support: this.support, at: this.elapsed };
      this.attempts.push(rec);
      if (rec.correct) {
        if (this.support === 'none') this.independentVariants.add(q.variant);
        else this.revisit.add(q.skill); // supported success: practise again later
        this.seenVariants.add(q.variant);
        const out = { status: 'correct', support: this.support };
        this._advance();
        return out;
      }
      this.wrong++;
      if (this.wrong === 1) { this._raise('hint'); return { status: 'incorrect', next: 'retry', help: { kind: 'hint', text: q.hint } }; }
      if (this.wrong === 2) { this._raise('demo'); return { status: 'incorrect', next: 'retry', help: { kind: 'worked', text: q.worked } }; }
      // repeated difficulty: move on, and come back to the skill later with a different, easier example
      this.revisit.add(q.skill); this.seenVariants.add(q.variant);
      if (!this.done && this.elapsed < this.cfg.maxSec) this.queue.push(this._fresh(q.skill, Math.max(1, (q.difficulty || 1) - 1)));
      this._advance();
      return { status: 'incorrect', next: 'moved_on', help: { kind: 'worked', text: q.worked } };
    }
    _advance() {
      this.index++; this._resetQ();
      const mastered = this.independentCount >= this.cfg.masteryTarget;
      if (mastered && this.elapsed >= this.cfg.minSec) return this._finish('mastery');
      if (mastered && !this.transferGiven) { // finished too quickly: one transfer task on a different skill
        this.transferGiven = true;
        const last = this.queue[this.index - 1].skill;
        const other = this.skills.find(s => s !== last) || last;
        this.queue.splice(this.index, 0, Object.assign(this._fresh(other), { transfer: true }));
        return;
      }
      if (this.index >= this.queue.length) {
        const pool = this.revisit.size ? [...this.revisit] : this.skills;
        this.queue.push(this._fresh(pick(this.r, pool)));
      }
    }
    _finish(reason) {
      if (this.done) return;
      this.done = reason;
      // skills never answered independently in this session go to revision
      for (const s of this.skills) {
        const ind = this.attempts.some(a => a.skill === s && a.correct && a.support === 'none');
        const tried = this.attempts.some(a => a.skill === s);
        if (tried && !ind) this.revisit.add(s);
      }
      if (reason === 'time_limit') { const q = this.queue[this.index]; if (q && !this.attempts.some(a => a.qid === q.id && a.correct)) this.revisit.add(q.skill); }
    }
    summary() {
      const correct = this.attempts.filter(a => a.correct);
      return {
        reason: this.done, learningSec: Math.round(this.elapsed),
        independentCorrect: correct.filter(a => a.support === 'none').length,
        supportedCorrect: correct.filter(a => a.support !== 'none').length,
        incorrect: this.attempts.filter(a => !a.correct).length,
        distinctIndependent: this.independentCount,
        skillsPractised: [...new Set(this.attempts.map(a => a.skill))],
        revisit: [...this.revisit]
      };
    }
  }

  // ---------- activity measurement ----------
  // Playback mode counts only when the video is playing, its tab is selected,
  // the browser window has focus and the device is not locked or asleep.
  function countsAsWatching(sig, mode) {
    if (!sig.eligible || sig.locked || sig.asleep) return false;
    if (!sig.tabActive || !sig.windowFocused) return false;
    return mode === 'playback' ? !!sig.playing : true;
  }

  // ---------- state machine ----------
  const TRANSITIONS = {
    entertainment: ['transition', 'override', 'recovery', 'rest'],
    transition: ['learning', 'override', 'recovery'],
    learning: ['entertainment', 'break', 'rest', 'override', 'recovery'],
    break: ['learning', 'override', 'recovery'],
    rest: ['override', 'recovery', 'entertainment'], // 'entertainment' only after a new day resets the cap
    override: ['entertainment', 'learning'],
    recovery: ['entertainment', 'learning', 'override']
  };

  class Controller {
    constructor({ allowanceSec, dailyCapSec, mode = 'playback' }) {
      this.allowanceSec = allowanceSec; this.dailyCapSec = dailyCapSec; this.mode = mode;
      this.state = 'entertainment'; this.balanceUsed = 0; this.dayWatched = 0;
      this.saved = null; this.log = [];
    }
    can(to) { return (TRANSITIONS[this.state] || []).includes(to); }
    go(to, why) {
      if (!this.can(to)) throw new Error(`Transition ${this.state} → ${to} not permitted`);
      this.log.push({ from: this.state, to, why }); this.state = to;
    }
    // dtSec comes from a monotonic clock, never wall-clock differences
    activity(sig, dtSec) {
      if (this.state !== 'entertainment') return { counted: 0 };
      if (dtSec < 0 || dtSec > 30) return { counted: 0, gap: true }; // suspicious gap (sleep, crash): record, don't count
      if (!countsAsWatching(sig, this.mode)) return { counted: 0 };
      this.balanceUsed += dtSec; this.dayWatched += dtSec;
      if (this.dayWatched >= this.dailyCapSec) { this.go('rest', 'daily cap reached'); return { counted: dtSec, cap: true }; }
      if (this.balanceUsed >= this.allowanceSec) { this.go('transition', 'allowance used'); return { counted: dtSec, trigger: true }; }
      return { counted: dtSec };
    }
    saveVideo(url, positionSec) { this.saved = { url, positionSec }; }
    finishLearning() {
      this.balanceUsed = 0; // fresh allowance; failed answers never add debt
      if (this.dayWatched >= this.dailyCapSec) { this.go('rest', 'daily cap reached'); return 'rest'; }
      this.go('entertainment', 'learning finished'); return 'entertainment';
    }
  }

  const api = { CONTENT_VERSION: CONTENT_VERSION_BANK, rng, ageOn, startingBand, startingYear, normaliseNumber, SKILLS, makeQuestion, skillsFor, grade,
    LearningSession, countsAsWatching, Controller, TRANSITIONS, CUR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LearnLoop = api;
})(typeof window !== 'undefined' ? window : globalThis);
