/* LearnLoop phone app: lets the learning screen from the Chrome extension (learn.html and learn.js) run unchanged inside the app.
 * It answers the same messages the extension's background worker answers, using the shared rules in core.js. */
(function (root) {
  'use strict';
  const C = root.LLCore, S = root.LLStore;
  async function handle(m) {
    const db = S.load(); const now = Date.now();
    const child = db.children.find(c => c.id === db.activeChildId) || null;
    if (child) C.ensureChildModel(child, C.dayKey(now));
    switch (m.type) {
      case 'learnStart': {
        if (!child) return { error: 'no_child' };
        const st = S.nativeJson('getState') || { state: 'learning' };   // a browser preview behaves as if learning is due
        const subs = C.SUBJECTS.filter(s => child.subjects[s]);
        db.mobile = db.mobile || { next: {}, session: null };
        if (!db.mobile.session || db.mobile.session.childId !== child.id) {
          const i = db.mobile.next[child.id] || 0;
          db.mobile.session = { childId: child.id, subject: subs.length ? subs[i % subs.length] : 'maths', startedAt: now, elapsed: 0, independent: 0 };
          db.mobile.next[child.id] = i + 1; S.save(db);
        }
        const subject = db.mobile.session.subject;
        const state = st.state === 'rest' ? 'rest' : st.state === 'learning' ? 'learning' : 'entertainment';
        // If Android reopens the learning screen (for example the child went back to YouTube), the session carries on where it was.
        const ms = db.mobile.session;
        return { child, runtime: { state, session: { subject, elapsed: ms.elapsed || 0, independent: ms.independent || 0, startedAt: ms.startedAt }, subject }, subject, plan: C.planSession(db, child, subject, now), revision: (db.revision[child.id] || {})[subject] || [] };
      }
      case 'learnProgress': {
        if (db.mobile && db.mobile.session) { db.mobile.session.elapsed = Math.max(db.mobile.session.elapsed || 0, Math.floor(m.elapsed || 0)); db.mobile.session.independent = Math.max(db.mobile.session.independent || 0, m.independent || 0); S.save(db); }
        return { ok: true };
      }
      case 'learnBreak': case 'returnHandled': return { ok: true };
      case 'learnFinish': {
        if (!child) return { state: 'entertainment' };
        const s = m.summary || {}; const subject = db.mobile && db.mobile.session ? db.mobile.session.subject : 'maths';
        C.recordPractice(db, child.id, { subject, practice: false, reason: s.reason, learningSec: s.learningSec, attempts: s.attempts, revisit: s.revisit }, now);
        if (db.mobile) db.mobile.session = null;
        S.save(db);
        const out = S.nativeJson('finishLearning') || { state: 'watching' };
        return { state: out.state === 'rest' ? 'rest' : 'entertainment', saved: null };
      }
      case 'practiceStart': {
        if (!child) return { error: 'no_child' };
        const subjects = C.SUBJECTS.filter(s => child.subjects[s]); const plans = {}, revision = {};
        for (const s of subjects) { plans[s] = C.planSession(db, child, s, now); revision[s] = (db.revision[child.id] || {})[s] || []; }
        return { child, subjects, plans, revision, best: (db.best || {})[child.id] || {}, practiceMax: child.rules.practiceMax || C.DEFAULT_RULES.practiceMax, roundSize: C.CHALLENGE_QUESTIONS };
      }
      case 'practiceFinish': { const out = C.recordPractice(db, db.activeChildId, m.result || {}, now) || { error: 'not_recorded' }; S.save(db); return out; }
      case 'speak': S.native('speak', String(m.text || '').slice(0, 400)); return { ok: true };
      default: return { error: 'unknown' };
    }
  }
  root.chrome = {
    runtime: { sendMessage: (m) => Promise.resolve().then(() => handle(m)), getURL: (p) => p },
    tts: { speak: (text) => { if (S.native('speak', String(text)) === null && root.speechSynthesis) { const u = new SpeechSynthesisUtterance(String(text)); u.lang = 'en-GB'; root.speechSynthesis.cancel(); root.speechSynthesis.speak(u); } } }
  };
  // "I'm done" in practice closes the window in Chrome. On the phone it goes back to the LearnLoop home screen.
  root.close = () => { if (S.native('goHome') === null) root.location.href = 'app.html'; };
})(window);
