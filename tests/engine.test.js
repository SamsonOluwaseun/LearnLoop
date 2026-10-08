// Run with: node --test   (synthetic profiles only)
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../extension/engine.js');

const cfg = (o) => Object.assign({ minSec: 0, maxSec: 600, tasks: 5, masteryTarget: 4 }, o);
const right = (s) => s.answer(s.current.answer);
const wrongVal = (q) => q.choices.find(c => c.value !== q.answer).value;

test('every generated question is gradeable and well formed', () => {
  const r = L.rng(7);
  for (const skill of Object.keys(L.SKILLS)) for (let lv = 1; lv <= 3; lv++) for (let i = 0; i < 200; i++) {
    const q = L.makeQuestion(skill, r, lv);
    for (const k of ['id', 'subject', 'skill', 'year', 'difficulty', 'response', 'grading', 'contentVersion', 'hint', 'worked'])
      assert.ok(q[k] !== undefined && q[k] !== '', `${skill} missing ${k}`);
    const vals = q.choices.map(c => c.value);
    assert.equal(vals.filter(v => v === q.answer).length, 1, `${q.id} must have exactly one correct choice`);
    assert.equal(new Set(vals).size, vals.length, `${q.id} has duplicate choices`);
    assert.equal(L.grade(q, q.answer).status, 'correct');
  }
});

test('maths answer keys are arithmetically right', () => {
  const r = L.rng(3);
  for (let i = 0; i < 500; i++) {
    const a = L.makeQuestion('add-within-10', r); const [x, y] = a.variant.slice(4).split('+').map(Number);
    assert.equal(a.answer, x + y); assert.ok(a.answer <= 10);
    const s = L.makeQuestion('sub-within-10', r); const [p, m] = s.variant.slice(4).split('-').map(Number);
    assert.equal(s.answer, p - m); assert.ok(s.answer >= 0);
  }
});

test('spelling items: one right spelling, wrong spellings are never the word itself', () => {
  for (const list of [L.CUR.CEW1, L.CUR.CEW2, L.CUR.W34]) for (const s of list) {
    assert.ok(!s.wrong.includes(s.word), s.word);
    assert.equal(new Set(s.wrong).size, s.wrong.length, s.word);
    assert.ok(s.sentence.includes('___'), s.word);
  }
});

test('typed and spoken numbers are normalised; unclear input is not marked wrong', () => {
  assert.equal(L.normaliseNumber(' 7 '), 7);
  assert.equal(L.normaliseNumber('Seven.'), 7);
  assert.equal(L.normaliseNumber('for'), 4);
  assert.equal(L.normaliseNumber('banana'), null);
  const q = L.makeQuestion('add-within-10', L.rng(1));
  assert.equal(L.grade(q, 'mumble').status, 'unrecognised');
});

test('birthday boundary: age changes on the day, not before', () => {
  assert.equal(L.ageOn('2019-10-07', '2026-10-06'), 6);
  assert.equal(L.ageOn('2019-10-07', '2026-10-07'), 7);
  assert.equal(L.startingBand(4), 'early'); assert.equal(L.startingBand(7), 'primary');
});

test('independent mastery on distinct variants ends early after the minimum time', () => {
  const s = new L.LearningSession({ subject: 'maths', band: 'primary', config: cfg({ minSec: 60 }), seed: 11 });
  s.tick(70);
  for (let i = 0; i < 4; i++) right(s);
  assert.equal(s.done, 'mastery');
  assert.equal(s.summary().distinctIndependent, 4);
});

test('finishing too quickly gives a transfer task instead of ending', () => {
  const s = new L.LearningSession({ subject: 'maths', band: 'primary', config: cfg({ minSec: 120 }), seed: 5 });
  for (let i = 0; i < 4; i++) right(s);
  assert.equal(s.done, null);
  assert.equal(s.current.transfer, true);
});

test('an answer revealed in a hint or worked example never counts as independent', () => {
  const s = new L.LearningSession({ subject: 'maths', band: 'primary', config: cfg(), seed: 9 });
  for (let i = 0; i < 6; i++) { s.help(); s.help(); right(s); }
  assert.equal(s.summary().independentCorrect, 0);
  assert.equal(s.summary().supportedCorrect, 6);
  assert.equal(s.done, null);
  const t = new L.LearningSession({ subject: 'english', band: 'primary', config: cfg(), seed: 9 });
  t.anotherWay(); right(t);
  assert.equal(t.summary().independentCorrect, 0);
});

test('wrong answers get a hint, then a worked example, then move on without debt', () => {
  const s = new L.LearningSession({ subject: 'english', band: 'early', config: cfg(), seed: 4 });
  const q = s.current;
  const a = s.answer(wrongVal(q)); assert.equal(a.help.kind, 'hint'); assert.equal(a.next, 'retry');
  const b = s.answer(wrongVal(q)); assert.equal(b.help.kind, 'worked');
  const c = s.answer(wrongVal(q)); assert.equal(c.next, 'moved_on');
  assert.notEqual(s.current.id, q.id);
  assert.ok(s.summary().revisit.includes(q.skill));
  // a later question on the same skill uses a different example
  const again = s.queue.slice(s.index).filter(x => x.skill === q.skill);
  assert.ok(again.length > 0 && again.every(x => x.variant !== q.variant));
});

test('the hard time limit ends the session however many answers are wrong', () => {
  const s = new L.LearningSession({ subject: 'maths', band: 'early', config: cfg({ maxSec: 300 }), seed: 2 });
  for (let i = 0; i < 30 && !s.done; i++) { s.answer(wrongVal(s.current)); s.tick(15); }
  assert.equal(s.done, 'time_limit');
  assert.equal(s.elapsed, 300);
  assert.ok(s.summary().revisit.length > 0);
});

test('a break pauses the learning clock', () => {
  const s = new L.LearningSession({ subject: 'maths', band: 'primary', config: cfg(), seed: 2 });
  s.tick(10); s.pause(); s.tick(100); s.resume(); s.tick(5);
  assert.equal(s.elapsed, 15);
});

test('unfinished skills come back first next session', () => {
  const s = new L.LearningSession({ subject: 'english', band: 'primary', config: cfg(), seed: 8, revision: ['opposites'] });
  assert.equal(s.current.skill, 'opposites');
});

test('watching only counts when playing, focused, selected and unlocked', () => {
  const base = { eligible: true, playing: true, tabActive: true, windowFocused: true, locked: false };
  assert.equal(L.countsAsWatching(base, 'playback'), true);
  for (const k of ['playing', 'tabActive', 'windowFocused', 'eligible']) assert.equal(L.countsAsWatching({ ...base, [k]: false }, 'playback'), false, k);
  assert.equal(L.countsAsWatching({ ...base, locked: true }, 'playback'), false);
  assert.equal(L.countsAsWatching({ ...base, playing: false }, 'foreground'), true);
});

test('controller triggers learning at the allowance and preserves balance across tab changes', () => {
  const c = new L.Controller({ allowanceSec: 300, dailyCapSec: 3600 });
  const on = { eligible: true, playing: true, tabActive: true, windowFocused: true, locked: false };
  for (let i = 0; i < 20; i++) c.activity(on, 10);          // 200 s
  c.activity({ ...on, tabActive: false }, 10);               // background tab: not counted
  assert.equal(c.balanceUsed, 200);
  for (let i = 0; i < 9; i++) c.activity(on, 10);
  assert.equal(c.state, 'entertainment');
  const r = c.activity(on, 10);
  assert.equal(r.trigger, true); assert.equal(c.state, 'transition');
  assert.equal(c.activity(on, 10).counted, 0);               // no counting outside entertainment
});

test('clock jumps and long gaps are not counted as watching', () => {
  const c = new L.Controller({ allowanceSec: 300, dailyCapSec: 3600 });
  const on = { eligible: true, playing: true, tabActive: true, windowFocused: true, locked: false };
  assert.equal(c.activity(on, -50).counted, 0);
  assert.equal(c.activity(on, 4000).counted, 0);
  assert.equal(c.balanceUsed, 0);
});

test('learning gives a fresh allowance but never beyond the daily cap', () => {
  const c = new L.Controller({ allowanceSec: 300, dailyCapSec: 600 });
  const on = { eligible: true, playing: true, tabActive: true, windowFocused: true, locked: false };
  for (let i = 0; i < 30; i++) c.activity(on, 10);
  c.go('learning', 'test'); assert.equal(c.finishLearning(), 'entertainment');
  for (let i = 0; i < 30 && c.state === 'entertainment'; i++) c.activity(on, 10);
  assert.equal(c.state, 'rest');
});

test('illegal state transitions are refused', () => {
  const c = new L.Controller({ allowanceSec: 300, dailyCapSec: 600 });
  assert.throws(() => c.go('break'));
  c.go('override', 'parent'); c.go('entertainment', 'parent');
});

test('worked examples use the right grammar for one object', () => {
  const r = L.rng(21);
  for (let i = 0; i < 300; i++) { const q = L.makeQuestion('count-objects', r); assert.ok(!/There are 1 /.test(q.worked), q.worked); if (q.answer === 1) assert.ok(/There is 1 /.test(q.worked)); }
});

test('sessions follow the plan levels, and repeated difficulty brings an easier example', () => {
  const s = new L.LearningSession({ subject: 'maths', plan: [{ skill: 'add-sub-3digit', level: 3 }], config: { minSec: 0, maxSec: 600, tasks: 5, masteryTarget: 4 }, seed: 3 });
  const q = s.current; assert.equal(q.difficulty, 3); assert.equal(q.year, 'Y3');
  const wrong = q.choices.find(c => c.value !== q.answer).value;
  s.answer(wrong); s.answer(wrong); s.answer(wrong);
  const easier = s.queue[s.queue.length - 1];
  assert.equal(easier.skill, 'add-sub-3digit'); assert.equal(easier.difficulty, 2);
});

test('the question bank covers Reception to Year 3 in both subjects, with curriculum references', () => {
  for (const y of L.CUR.YEARS) for (const sub of ['maths', 'english']) assert.ok(L.CUR.skillsIn(sub, y).length >= 4, `${sub} ${y}`);
  for (const [k, s] of Object.entries(L.SKILLS)) assert.ok(s.nc && s.label && L.CUR.YEARS.includes(s.year), k);
});

test('first-sound pictures never have another common name that starts with the target sound', () => {
  const r = L.rng(5);
  for (let i = 0; i < 2000; i++) {
    const q = L.makeQuestion('initial-sound', r, 1 + (i % 3)); const letter = q.visual.text;
    const wrong = q.choices.filter(c => c.value !== q.answer);
    for (const w of wrong) assert.ok(!L.CUR.startsWithSound(w.value, letter), `${w.value} starts like ${letter}`);
    assert.ok(L.CUR.startsWithSound(q.answer, letter));
  }
});

test('capital-letter answers are marked exactly, so a missing capital is wrong', () => {
  const r = L.rng(9);
  for (let i = 0; i < 100; i++) {
    const q = L.makeQuestion('capital-letters', r, 2);
    assert.equal(L.grade(q, q.answer).status, 'correct');
    for (const c of q.choices) if (c.value !== q.answer) assert.equal(L.grade(q, c.value).status, 'incorrect');
  }
});
