// Background rules. Synthetic profiles only.
const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.LearnLoop = require('../extension/engine.js');
const C = require('../extension/core.js');

const T0 = new Date('2026-10-06T16:00:00').getTime();
function setup(rules) {
  const db = C.emptyDb();
  db.parent = { placeholder: true };
  const joy = C.newChild({ id: 'joy', name: 'Joy', birthday: '2019-03-14', today: '2026-10-06' });
  const sam = C.newChild({ id: 'sam', name: 'Sam', ageBand: 'early', today: '2026-10-06' });
  Object.assign(joy.rules, rules || {});
  db.children = [joy, sam]; db.activeChildId = 'joy';
  return db;
}
const beat = (db, sec, extra, ctx) => C.applyHeartbeat(db, Object.assign({ candidateSec: sec, fromActiveTab: true, playing: true }, extra), Object.assign({ idleState: 'active', nowMs: T0 }, ctx));

test('profiles: age sets the starting band and read-aloud for the younger child', () => {
  const db = setup();
  assert.equal(db.children[0].band, 'primary'); assert.equal(db.children[0].readAloud, false);
  assert.equal(db.children[1].band, 'early'); assert.equal(db.children[1].readAloud, true); assert.equal(db.children[1].typing, false);
});

test('5 minutes of measured playback triggers the switch', () => {
  const db = setup({ ent: 5 });
  let fx;
  for (let i = 0; i < 59; i++) fx = beat(db, 5).effects;
  assert.deepEqual(fx, []); assert.equal(db.runtime.joy.state, 'entertainment');
  fx = beat(db, 5).effects;
  assert.deepEqual(fx, ['transition']); assert.equal(db.runtime.joy.state, 'transition');
  assert.equal(db.runtime.joy.subject, 'maths');
});

test('10 minute rule is independent of the learning length', () => {
  const db = setup({ ent: 10, max: 10 });
  for (let i = 0; i < 119; i++) beat(db, 5);
  assert.equal(db.runtime.joy.state, 'entertainment');
  beat(db, 5); assert.equal(db.runtime.joy.state, 'transition');
});

test('other tabs, lock screen and long gaps never count', () => {
  const db = setup();
  beat(db, 5, { fromActiveTab: false });
  beat(db, 5, {}, { idleState: 'locked' });
  beat(db, 400);
  beat(db, -3);
  assert.equal(db.runtime.joy.balanceUsed, 0);
  const row = db.activity.joy['2026-10-06'];
  assert.equal(row.lockedSec, 5); assert.equal(row.gaps, 1);
  beat(db, 5, { candidateSec: 0, backgroundSec: 20 });
  assert.equal(row.backgroundSec, 20); assert.equal(db.runtime.joy.balanceUsed, 0);
});

test('balance survives across heartbeats from different tabs (no reset on tab change)', () => {
  const db = setup();
  for (let i = 0; i < 10; i++) beat(db, 5);
  beat(db, 5, { fromActiveTab: false });
  for (let i = 0; i < 10; i++) beat(db, 5);
  assert.equal(db.runtime.joy.balanceUsed, 100);
});

test('learning: progress resumes after a crash and finishing gives a fresh allowance', () => {
  const db = setup();
  for (let i = 0; i < 60; i++) beat(db, 5);
  assert.ok(C.beginLearning(db, 'joy', { url: 'https://www.youtube.com/watch?v=abc', pos: 312.7 }, T0));
  C.saveProgress(db, 'joy', { elapsed: 95, independent: 2 });
  assert.equal(db.runtime.joy.session.elapsed, 95);
  C.beginLearning(db, 'joy', null, T0 + 1000); // page reopened
  assert.equal(db.runtime.joy.session.elapsed, 95);
  assert.deepEqual(db.runtime.joy.saved, { url: 'https://www.youtube.com/watch?v=abc', pos: 312 });
  const st = C.finishLearning(db, 'joy', { reason: 'mastery', learningSec: 140, independentCorrect: 4, supportedCorrect: 1, incorrect: 2,
    revisit: ['sub-within-10'], skillsPractised: ['add-within-10', 'sub-within-10'],
    attempts: [{ skill: 'add-within-10', correct: true, support: 'none' }, { skill: 'sub-within-10', correct: false, support: 'none' }] }, T0 + 2000);
  assert.equal(st, 'entertainment');
  assert.equal(db.runtime.joy.balanceUsed, 0); assert.equal(db.runtime.joy.returnPending, true);
  assert.deepEqual(db.revision.joy.maths, ['sub-within-10']);
  assert.equal(db.skills.joy['add-within-10'].independent, 1); assert.equal(db.skills.joy['sub-within-10'].incorrect, 1);
  // English is next
  for (let i = 0; i < 60; i++) beat(db, 5, {}, { nowMs: T0 + 3000 });
  assert.equal(db.runtime.joy.subject, 'english');
});

test('no video while learning: playing during learning asks to enforce, and adds nothing', () => {
  const db = setup();
  for (let i = 0; i < 60; i++) beat(db, 5);
  C.beginLearning(db, 'joy', null, T0);
  const fx = beat(db, 5).effects;
  assert.deepEqual(fx, ['enforce']); assert.equal(db.runtime.joy.dayWatched, 300);
});

test('daily cap stops video and learning cannot buy more', () => {
  const db = setup({ ent: 5, cap: 8 });
  for (let i = 0; i < 60; i++) beat(db, 5);
  C.beginLearning(db, 'joy', null, T0);
  C.finishLearning(db, 'joy', { reason: 'mastery', learningSec: 100, independentCorrect: 4, supportedCorrect: 0, incorrect: 0, revisit: [], skillsPractised: [] }, T0);
  let fx; for (let i = 0; i < 36 && db.runtime.joy.state === 'entertainment'; i++) fx = beat(db, 5).effects;
  assert.deepEqual(fx, ['rest']); assert.equal(db.runtime.joy.state, 'rest');
  // next day the limit resets
  beat(db, 5, {}, { nowMs: T0 + 86400000 });
  assert.equal(db.runtime.joy.state, 'entertainment'); assert.equal(db.runtime.joy.dayWatched, 5);
});

test('parent override skips learning without recording learning', () => {
  const db = setup();
  for (let i = 0; i < 60; i++) beat(db, 5);
  C.beginLearning(db, 'joy', null, T0);
  C.parentOverride(db, 'joy', 'skipLearning', T0);
  assert.equal(db.runtime.joy.state, 'entertainment'); assert.equal(db.sessions.length, 0); assert.equal(db.overrides.length, 1);
  C.parentOverride(db, 'joy', 'pauseMonitoring', T0, 30);
  assert.deepEqual(beat(db, 5).effects, ['paused']);
});

test('an unfinished countdown recovers into learning, never into credit', () => {
  const db = setup();
  for (let i = 0; i < 60; i++) beat(db, 5);
  C.recover(db, T0 + 30000); assert.equal(db.runtime.joy.state, 'transition');
  C.recover(db, T0 + 120000); assert.equal(db.runtime.joy.state, 'learning');
});

test('no child chosen means nothing is counted', () => {
  const db = setup(); db.activeChildId = null;
  assert.deepEqual(beat(db, 5).effects, ['needChild']);
});

test('PIN is hashed with a salt, wrong tries lead to a wait, recovery code works', async () => {
  const db = setup();
  const code = await C.setParentPin(db, '2468', 1000);
  assert.ok(!JSON.stringify(db.parent).includes('2468'));
  assert.equal(db.parent.hash.length, 64);
  assert.equal((await C.checkPin(db, '2468', T0)).ok, true);
  for (let i = 0; i < 4; i++) assert.equal((await C.checkPin(db, '0000', T0)).reason, 'wrong');
  const w = await C.checkPin(db, '0000', T0); assert.equal(w.reason, 'wait'); assert.equal(w.waitSec, 60);
  assert.equal((await C.checkPin(db, '2468', T0 + 1000)).reason, 'wait'); // even the right PIN waits
  assert.equal((await C.checkPin(db, '2468', T0 + 61000)).ok, true);
  assert.equal(await C.checkRecovery(db, code.toLowerCase()), true);
  assert.equal(await C.checkRecovery(db, 'WRONGCODE1'), false);
  await assert.rejects(C.setParentPin(db, '12'));
});

test('report separates measured, uncounted and learning time; CSV has no video titles', () => {
  const db = setup();
  for (let i = 0; i < 30; i++) beat(db, 5);
  beat(db, 0, { backgroundSec: 60, pipSec: 10 });
  Object.assign(db.runtime.joy, { state: 'transition', subject: 'maths', transitionAt: T0 });
  assert.ok(C.beginLearning(db, 'joy', { url: 'https://www.youtube.com/watch?v=abc', pos: 10 }, T0));
  C.finishLearning(db, 'joy', { reason: 'time_limit', learningSec: 600, independentCorrect: 2, supportedCorrect: 3, incorrect: 4, revisit: ['add-within-10'], skillsPractised: [] }, T0 + 1000);
  const r = C.report(db, 'joy', T0 - 3600000, T0 + 3600000);
  assert.equal(r.watchedMin, 3); assert.equal(r.backgroundMin, 1); assert.equal(r.learningMin, 10);
  assert.equal(r.independent, 2); assert.equal(r.supported, 3); assert.equal(r.independentAccuracy, 22);
  assert.deepEqual(r.revisit, ['add-within-10']);
  const csv = C.csv(db);
  assert.ok(csv.includes('Joy,maths')); assert.ok(!csv.includes('watch?v='));
});

test('stored history is bounded', () => {
  const db = setup();
  for (let i = 0; i < 520; i++) { db.runtime.joy = undefined; C.runtimeFor(db, 'joy', T0).state = 'learning';
    C.finishLearning(db, 'joy', { reason: 'mastery', learningSec: 1, independentCorrect: 1, supportedCorrect: 0, incorrect: 0, revisit: [], skillsPractised: [] }, T0); }
  assert.equal(db.sessions.length, 500);
});

// ---------- version 0.2.0 ----------
test('counting reasons explain every case to the parent', () => {
  const base = { paused: false, child: { id: 'joy' }, state: 'entertainment', gap: false, locked: false, pip: false, visible: true, selectedTab: true, focused: true, mode: 'playback', playing: true };
  assert.equal(C.beatReason(base), 'counted');
  assert.equal(C.beatReason({ ...base, playing: false }), 'not_playing');
  assert.equal(C.beatReason({ ...base, playing: false, mode: 'foreground' }), 'counted');
  assert.equal(C.beatReason({ ...base, selectedTab: false }), 'background');
  assert.equal(C.beatReason({ ...base, visible: false }), 'background');
  assert.equal(C.beatReason({ ...base, focused: false }), 'window');
  assert.equal(C.beatReason({ ...base, locked: true }), 'locked');
  assert.equal(C.beatReason({ ...base, gap: true }), 'gap');
  assert.equal(C.beatReason({ ...base, pip: true }), 'pip');
  assert.equal(C.beatReason({ ...base, child: null }), 'no_child');
  assert.equal(C.beatReason({ ...base, paused: true }), 'paused');
  assert.equal(C.beatReason({ ...base, state: 'learning' }), 'learning');
  assert.equal(C.beatReason({ ...base, state: 'rest' }), 'rest');
  for (const k of ['counted', 'not_playing', 'background', 'window', 'locked', 'gap', 'pip', 'no_child', 'paused', 'learning', 'rest']) assert.ok(C.REASONS[k], k);
});

test('email addresses are checked', () => {
  for (const ok of ['parent@example.com', 'a.b+kids@mail.co.uk']) assert.equal(C.validEmail(ok), true, ok);
  for (const bad of ['', 'parent', 'parent@', 'parent@example', 'a b@c.com', 'x@y.com,z@w.com', '<x@y.com>']) assert.equal(C.validEmail(bad), false, bad);
});

test('weekly period: the report day starts the week and covers the 7 days before', () => {
  const wed = new Date('2026-10-07T21:00:00').getTime(); // a Wednesday
  const p = C.weekPeriod(wed, 0);                          // Sunday reports
  assert.equal(C.dayKey(p.fromMs), '2026-09-27'); assert.equal(C.dayKey(p.toMs), '2026-10-04');
  const onDay = C.weekPeriod(new Date('2026-10-04T08:00:00').getTime(), 0);
  assert.equal(C.dayKey(onDay.toMs), '2026-10-04');
  assert.equal(C.dayKey(C.weekPeriod(wed, 3).toMs), '2026-10-07'); // Wednesday report on a Wednesday
});

test('weekly report is queued once per week, waits if the laptop was off, and skips weeks before set-up', () => {
  const db = setup();
  db.createdAt = new Date('2026-09-20T10:00:00').getTime();
  assert.equal(C.queueWeekly(db, new Date('2026-10-04T09:00:00').getTime()), null); // off: nothing
  db.weekly = { email: 'parent@example.com', day: 0, enabled: true };
  const first = C.queueWeekly(db, new Date('2026-10-04T09:00:00').getTime());
  assert.equal(first.key, '2026-09-27');
  assert.equal(C.queueWeekly(db, new Date('2026-10-04T18:00:00').getTime()), null); // same week again: no duplicate
  assert.equal(C.queueWeekly(db, new Date('2026-10-07T09:00:00').getTime()), null); // laptop used later in the week: still once
  assert.equal(C.queueWeekly(db, new Date('2026-10-12T09:00:00').getTime()).key, '2026-10-04'); // laptop off on Sunday 11th, used Monday
  assert.equal(db.outbox.length, 2);
  assert.ok(C.markSent(db, '2026-09-27', Date.now())); assert.equal(db.outbox[0].status, 'sent');
  const fresh = setup(); fresh.weekly = { email: 'parent@example.com', day: 0, enabled: true };
  fresh.createdAt = new Date('2026-10-06T10:00:00').getTime();
  assert.equal(C.queueWeekly(fresh, new Date('2026-10-07T09:00:00').getTime()), null); // installed after that week ended
});

test('weekly text has the measured totals, trend and no video addresses', () => {
  const db = setup();
  const weekStart = new Date('2026-09-27T00:00:00').getTime();
  const mon = weekStart + 86400000 + 16 * 3600000;
  for (let i = 0; i < 60; i++) beat(db, 5, {}, { nowMs: mon });
  C.beginLearning(db, 'joy', { url: 'https://www.youtube.com/watch?v=secret', pos: 5 }, mon);
  C.finishLearning(db, 'joy', { reason: 'mastery', learningSec: 420, independentCorrect: 4, supportedCorrect: 1, incorrect: 2, revisit: ['sub-within-10'], skillsPractised: ['add-within-10', 'sub-within-10'] }, mon + 1000);
  const text = C.weeklyText(db, { fromMs: weekStart, toMs: weekStart + 7 * 86400000, key: '2026-09-27' }, k => ({ 'add-within-10': 'Adding within 10', 'sub-within-10': 'Taking away within 10' }[k]));
  assert.equal(text.split('\n')[1], 'Week: Sun 27 Sep 2026 to Sat 3 Oct 2026');
  assert.ok(text.includes('Joy\n- Measured video: 5 min'));
  assert.ok(text.includes('Active learning: 7 min in 1 session, up from 0 min the week before'));
  assert.ok(text.includes('Answers by themselves: 4. With help: 1. Not yet: 2'));
  assert.ok(text.includes('Skills practised: Adding within 10, Taking away within 10'));
  assert.ok(text.includes('Practise again: Taking away within 10'));
  assert.ok(text.includes('Sam\n- Measured video: 0 min'));
  assert.ok(!text.includes('secret') && !text.includes('youtube'));
});

// ---------- version 0.3.0: where the time went ----------
test('uncounted time is recorded by reason, and video progress is kept beside real time', () => {
  const db = setup();
  beat(db, 0, { unfocusedSec: 20 });                 // on screen but another app in front
  beat(db, 5, { fromActiveTab: false });             // another tab or window selected
  beat(db, 10, { contentSec: 20 });                  // watched 10 s at double speed
  beat(db, 15, { contentSec: 15 });                  // a delayed update carrying 15 s is still credited
  const row = db.activity.joy['2026-10-06'];
  assert.equal(row.unfocusedSec, 20); assert.equal(row.notSelectedSec, 5);
  assert.equal(row.watchedSec, 25); assert.equal(row.contentSec, 35);
  const r = C.report(db, 'joy', T0 - 3600000, T0 + 3600000);
  assert.equal(r.contentSec, 35); assert.equal(r.unfocusedSec, 20);
  while (db.runtime.joy.state === 'entertainment') beat(db, 5);
  C.beginLearning(db, 'joy', null, T0);
  const before = row.duringSwitchSec || 0;
  beat(db, 5);                                       // video kept playing during learning
  assert.equal(row.duringSwitchSec - before, 5);
  assert.equal(row.watchedSec, 300);                 // and none of it was credited
  beat(db, 200);                                     // far too large: a gap, never credited
  assert.equal(row.gaps, 1);
});

test('video played before anyone is chosen is kept separately and counted for nobody', () => {
  const db = setup(); db.activeChildId = null;
  beat(db, 5); beat(db, 5);
  assert.equal(db.unassigned['2026-10-06'], 10);
  assert.equal(db.activity.joy, undefined);
});

// ---------- version 0.4.0: curriculum years and progression ----------
const CUR = require('../extension/curriculum.js');
test('school year from date of birth uses the 1 September cut-off', () => {
  assert.equal(CUR.schoolYearFor('2019-08-31', '2026-10-08').label, 'Year 3');
  assert.equal(CUR.schoolYearFor('2019-09-01', '2026-10-08').label, 'Year 2');
  assert.equal(CUR.schoolYearFor('2022-06-02', '2026-10-08').label, 'Reception');
  assert.equal(CUR.schoolYearFor('2023-01-10', '2026-10-08').start, 'R'); // not at school yet: starts at Reception content
  assert.equal(CUR.schoolYearFor('1988-05-01', '2026-10-08').start, 'Y6'); // older than the content: top year available
  assert.equal(CUR.schoolYearFor('2015-10-01', '2026-10-08').label, 'Year 6');
});

test('new profiles start at their school year; the younger child reads aloud with no typing', () => {
  const db = setup();
  assert.deepEqual(db.children[0].stage, { maths: 'Y3', english: 'Y3', reasoning: 'Y4' });
  assert.deepEqual(db.children[1].stage, { maths: 'R', english: 'R', reasoning: 'Y4' }); // Reasoning starts at Year 4 and is off until a parent turns it on
  assert.equal(db.children[0].subjects.reasoning, false);
  assert.equal(db.children[1].readAloud, true); assert.equal(db.children[1].typing, false);
});

test('a birthday passing never makes the work harder on its own', () => {
  const db = setup(); const joy = db.children[0];
  C.ensureChildModel(joy, '2027-09-30'); // a year later, after the birthday and a new school year
  assert.deepEqual(joy.stage, { maths: 'Y3', english: 'Y3', reasoning: 'Y4' });
});

const ok = (skill, n, correct = true, support = 'none') => Array.from({ length: n }, () => ({ skill, correct, support }));
test('a skill moves up only after repeated independent success over at least two sessions', () => {
  const db = setup(); const joy = db.children[0];
  let ch = C.updateProgress(db, joy, 'maths', ok('times-3-4-8', 6), 's1', T0);
  assert.equal(ch.length, 0); assert.equal(db.skills.joy['times-3-4-8'].level, 1); // one session is not enough
  ch = C.updateProgress(db, joy, 'maths', ok('times-3-4-8', 3), 's2', T0 + 1000);
  assert.equal(db.skills.joy['times-3-4-8'].level, 2);
  assert.match(ch[0].reason, /moved up to level 2: 6 of the last 6 answers were given without help, over 2 sessions/);
  assert.equal(db.levelLog.joy.length, 1);
});

test('answers after a hint or worked example never push a level up', () => {
  const db = setup(); const joy = db.children[0];
  C.updateProgress(db, joy, 'maths', ok('times-3-4-8', 4, true, 'hint'), 's1', T0);
  C.updateProgress(db, joy, 'maths', ok('times-3-4-8', 4, true, 'demo'), 's2', T0);
  assert.equal(db.skills.joy['times-3-4-8'].level, 1);
});

test('a skill moves back down when it is a struggle across sessions, never below level 1', () => {
  const db = setup(); const joy = db.children[0];
  db.skills.joy = { 'fractions-y3': { attempts: 0, independent: 0, supported: 0, incorrect: 0, last: 0, level: 2, recent: [] } };
  C.updateProgress(db, joy, 'maths', ok('fractions-y3', 3, false), 's1', T0);
  const ch = C.updateProgress(db, joy, 'maths', ok('fractions-y3', 3, false), 's2', T0);
  assert.equal(db.skills.joy['fractions-y3'].level, 1);
  assert.match(ch[0].reason, /moved back to level 1/);
  C.updateProgress(db, joy, 'maths', ok('fractions-y3', 6, false), 's3', T0);
  C.updateProgress(db, joy, 'maths', ok('fractions-y3', 1, false), 's4', T0);
  assert.equal(db.skills.joy['fractions-y3'].level, 1);
});

test('the year moves up when most of its skills reach the top level, with a reason', () => {
  const db = setup(); const sam = db.children[1];
  const rSkills = CUR.skillsIn('maths', 'R');
  db.skills.sam = {}; for (const k of rSkills.slice(0, 3)) db.skills.sam[k] = { attempts: 9, independent: 9, supported: 0, incorrect: 0, last: T0, level: 3, recent: [] };
  db.skills.sam[rSkills[3]] = { attempts: 0, independent: 0, supported: 0, incorrect: 0, last: 0, level: 2, recent: [] };
  C.updateProgress(db, sam, 'maths', ok(rSkills[3], 3), 'a', T0);
  const ch = C.updateProgress(db, sam, 'maths', ok(rSkills[3], 3), 'b', T0);
  assert.equal(sam.stage.maths, 'Y1');
  assert.match(ch.find(c => c.kind === 'year').reason, /Started Year 1 Maths: 4 of 5 Reception skills reached the top level/);
  assert.equal(sam.stage.english, 'R'); // each subject moves on its own
});

test('the year moves back when most of its skills are a struggle', () => {
  const db = setup(); const joy = db.children[0];
  const y3 = CUR.skillsIn('english', 'Y3'); db.skills.joy = {};
  for (const k of y3.slice(0, 4)) db.skills.joy[k] = { attempts: 6, independent: 0, supported: 0, incorrect: 6, last: T0, level: 1, recent: [0, 0, 0, 1, 0, 0].map((o, i) => ({ ok: o, s: i < 3 ? 'x' : 'y' })) };
  const ch = C.updateProgress(db, joy, 'english', ok(y3[0], 1, false), 'z', T0);
  assert.equal(joy.stage.english, 'Y2');
  assert.match(ch.find(c => c.kind === 'year').reason, /Went back to Year 2 English for now/);
});

test('session plan: practise-again first, then skills not seen for a week, with each skill at its level', () => {
  const db = setup(); const joy = db.children[0]; const y3 = CUR.skillsIn('maths', 'Y3');
  db.revision.joy = { maths: ['fractions-y3'], english: [] };
  db.skills.joy = {}; for (const k of y3) db.skills.joy[k] = { attempts: 1, independent: 1, supported: 0, incorrect: 0, last: T0, level: 1, recent: [] };
  db.skills.joy['times-3-4-8'].level = 3; db.skills.joy['money-y3'].last = T0 - 10 * 86400000;
  const plan = C.planSession(db, joy, 'maths', T0 + 1000);
  assert.equal(plan[0].skill, 'fractions-y3'); assert.equal(plan[1].skill, 'money-y3');
  assert.equal(plan.find(p => p.skill === 'times-3-4-8').level, 3);
  assert.ok(plan.every(p => CUR.SKILLS[p.skill].year === 'Y3'));
});

test('a parent can change the level, and the change is explained in the log', () => {
  const db = setup(); const joy = db.children[0];
  C.setStage(db, joy, 'maths', 'Y2', T0);
  assert.equal(joy.stage.maths, 'Y2'); assert.match(db.levelLog.joy[0].reason, /A parent set Maths to Year 2/);
});

test('finishing a session updates levels and records why', () => {
  const db = setup(); const joy = db.children[0];
  for (let s = 0; s < 2; s++) {
    Object.assign(db.runtime.joy || C.runtimeFor(db, 'joy', T0), { state: 'learning', session: { subject: 'maths', elapsed: 0, independent: 0, startedAt: T0 + s } });
    C.finishLearning(db, 'joy', { reason: 'mastery', learningSec: 60, independentCorrect: 3, supportedCorrect: 0, incorrect: 0, revisit: [], skillsPractised: ['times-3-4-8'], attempts: ok('times-3-4-8', 3) }, T0 + s);
  }
  assert.equal(db.skills.joy['times-3-4-8'].level, 2);
  assert.ok(db.sessions[1].changes[0].includes('moved up to level 2'));
});

// ---- version 1.1: Years 4 to 6 and Reasoning ----
test('profiles from before 1.1 gain Reasoning switched off, starting at Year 4 or their own year', () => {
  const old = { id: 'o', name: 'Old', birthday: '2019-03-14', subjects: { maths: true, english: true }, startYear: { maths: 'Y3', english: 'Y3' }, stage: { maths: 'Y3', english: 'Y3' } };
  C.ensureChildModel(old, '2026-10-08');
  assert.equal(old.stage.reasoning, 'Y4'); assert.equal(old.subjects.reasoning, false);
  const y5 = C.newChild({ id: 'b', name: 'B', birthday: '2017-01-10', subjects: { maths: true, english: true, reasoning: true }, today: '2026-10-08' });
  assert.deepEqual(y5.stage, { maths: 'Y5', english: 'Y5', reasoning: 'Y5' });
});

test('Reasoning stays within Years 4 to 6 and plans Reasoning skills only', () => {
  const db = setup(); const joy = db.children[0]; joy.subjects.reasoning = true;
  C.setStage(db, joy, 'reasoning', 'Y3', T0); assert.equal(joy.stage.reasoning, 'Y4'); // not a Reasoning year
  C.setStage(db, joy, 'reasoning', 'Y6', T0); assert.equal(joy.stage.reasoning, 'Y6');
  const plan = C.planSession(db, joy, 'reasoning', T0);
  assert.ok(plan.length >= 4 && plan.every(p => CUR.SKILLS[p.skill].subject === 'reasoning' && CUR.SKILLS[p.skill].year === 'Y6'));
  // Top of the range: every Year 6 Reasoning skill at the top level does not move past Year 6
  for (const k of CUR.skillsIn('reasoning', 'Y6')) { db.skills.joy = db.skills.joy || {}; db.skills.joy[k] = { attempts: 9, independent: 9, supported: 0, incorrect: 0, last: T0, level: 3, recent: [] }; }
  C.updateProgress(db, joy, 'reasoning', [], 's1', T0); assert.equal(joy.stage.reasoning, 'Y6');
  assert.match(db.levelLog.joy.at(-1).reason, /A parent set Reasoning \(11\+\) to Year 6/);
});

test('learning takes turns between every subject that is switched on', () => {
  const db = setup({ ent: 1 }); const joy = db.children[0]; joy.subjects.reasoning = true;
  const seen = [];
  for (let i = 0; i < 3; i++) {
    const r = C.runtimeFor(db, 'joy', T0 + i * 1e6); r.state = 'entertainment'; r.balanceUsed = 0;
    C.applyHeartbeat(db, { candidateSec: 61, fromActiveTab: true, playing: true }, { idleState: 'active', nowMs: T0 + i * 1e6 + 61000 });
    seen.push(C.runtimeFor(db, 'joy', T0 + i * 1e6 + 61000).subject);
  }
  assert.deepEqual(seen.slice().sort(), ['english', 'maths', 'reasoning']);
});

test('extra practice never changes the watching state, video balance or daily total', () => {
  const db = setup(); const r = C.runtimeFor(db, 'joy', T0); r.balanceUsed = 120; r.dayWatched = 600;
  const before = JSON.stringify(db.runtime.joy);
  const out = C.recordPractice(db, 'joy', { subject: 'maths', learningSec: 300, attempts: ok('times-3-4-8', 3), revisit: [] }, T0 + 1000);
  assert.ok(out); assert.equal(JSON.stringify(db.runtime.joy), before);
  const s = db.sessions.at(-1); assert.equal(s.reason, 'practice'); assert.equal(s.practice, true); assert.equal(s.ind, 3);
  assert.equal(C.report(db, 'joy', T0, T0 + 5000).practiceMin, 5);
  assert.equal(C.recordPractice(db, 'joy', { subject: 'reasoning', attempts: [] }, T0), null, 'a subject that is switched off is refused');
});

test('beat your own best: only finished rounds count, more answers by themselves wins, then the quicker time', () => {
  const db = setup(); const round = (n, sec, complete = true) => C.recordPractice(db, 'joy', { subject: 'maths', challenge: true, complete, learningSec: sec,
    attempts: [...ok('times-3-4-8', n), ...ok('times-3-4-8', 10 - n, false)], revisit: [] }, T0 + sec);
  assert.equal(round(6, 300).best, true);                  // first best
  assert.equal(round(9, 400, false).best, false);         // stopped early: not a round
  assert.equal(round(5, 100).best, false);                 // fewer by themselves, even if quicker
  const r = round(6, 250); assert.equal(r.best, true); assert.equal(r.prev.score, 6);   // same score, quicker
  assert.equal(round(7, 900).best, true);                  // more by themselves beats any time
  assert.deepEqual([db.best.joy.maths.score, db.best.joy.maths.sec], [7, 900]);
  // answers with help never raise the score
  const helped = C.recordPractice(db, 'joy', { subject: 'maths', challenge: true, complete: true, learningSec: 60, attempts: ok('times-3-4-8', 10, true, 'hint'), revisit: [] }, T0);
  assert.equal(helped.round.score, 0); assert.equal(helped.best, false);
});
