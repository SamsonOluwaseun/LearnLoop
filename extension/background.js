/* LearnLoop background worker (Manifest V3).
 * Owns the stored state. Pages and the YouTube script talk to it with messages.
 * The worker can be suspended at any time, so nothing important lives only in memory.
 */
importScripts('curriculum.js', 'engine.js', 'core.js');
const C = self.LLCore;
const LEARN_URL = chrome.runtime.getURL('learn.html');
const BLOCK_RULE_ID = 1;
const SITE_DOMAINS = ['youtube.com'];          // watched sites (Milestone 1: YouTube only)
const SITE_PATTERNS = ['*://*.youtube.com/*'];

// ---- storage with a simple write queue so messages never overwrite each other ----
let queue = Promise.resolve();
function withDb(fn) {
  const run = queue.then(async () => {
    const got = await chrome.storage.local.get('db');
    const db = got.db || C.emptyDb();
    const out = await fn(db);
    await chrome.storage.local.set({ db });
    return out;
  });
  queue = run.catch(() => {});
  return run;
}
const readDb = async () => (await chrome.storage.local.get('db')).db || C.emptyDb();

// ---- blocking during learning: redirect YouTube page loads to the learning screen ----
async function setBlocking(on) {
  const rules = on ? [{ id: BLOCK_RULE_ID, priority: 1, action: { type: 'redirect', redirect: { extensionPath: '/learn.html' } },
    condition: { requestDomains: SITE_DOMAINS, resourceTypes: ['main_frame'] } }] : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [BLOCK_RULE_ID], addRules: rules });
}
async function syncBlocking(db) {
  const child = db.children.find(c => c.id === db.activeChildId);
  const r = child && db.runtime[child.id];
  const paused = Date.now() < (db.monitoringPausedUntil || 0);
  const on = !!(r && !paused && ['learning', 'break', 'rest'].includes(r.state));
  await setBlocking(on);
  return on;
}
async function youtubeTabs() { return chrome.tabs.query({ url: SITE_PATTERNS }); }
async function tellYouTubeTabs(msg) { for (const t of await youtubeTabs()) chrome.tabs.sendMessage(t.id, msg).catch(() => {}); }

function speak(text) { try { chrome.tts.speak(text, { lang: 'en-GB', rate: 0.9, enqueue: false }); } catch (e) {} }

async function isFromSelectedTab(tabId) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab || tab.id !== tabId) return false;
    const win = await chrome.windows.get(tab.windowId);
    return !!win.focused;
  } catch (e) { return false; }
}

// YouTube tabs that were already open when LearnLoop was installed or updated do not get the
// measuring script automatically. Add it, otherwise their watching would never be counted.
async function injectIntoOpenTabs() {
  for (const t of await youtubeTabs()) {
    try { await chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['content.js'] }); } catch (e) {}
  }
}

// Weekly report: queue it once per week (even if the laptop was off on the day) and tell the parent.
async function checkWeekly() {
  const item = await withDb(db => C.queueWeekly(db, Date.now()));
  if (item) {
    try {
      chrome.notifications.create('weekly-' + item.key, { type: 'basic', iconUrl: 'icons/128.png', title: 'LearnLoop weekly report is ready',
        message: 'Click to open it and send it to your email.', priority: 1 });
    } catch (e) {}
  }
}
chrome.notifications.onClicked.addListener((id) => {
  if (id.startsWith('weekly-')) chrome.tabs.create({ url: chrome.runtime.getURL('options.html#weekly') });
});

// ---- lifecycle ----
chrome.runtime.onInstalled.addListener(async (d) => {
  chrome.alarms.create('tick', { periodInMinutes: 1 });
  if (d.reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  await withDb(db => syncBlocking(db));
  await injectIntoOpenTabs();
});
chrome.runtime.onStartup.addListener(async () => {
  chrome.alarms.create('tick', { periodInMinutes: 1 });
  // A new browser session asks who is watching again
  await withDb(db => { db.activeChildId = null; C.recover(db, Date.now()); return syncBlocking(db); });
  await injectIntoOpenTabs();
  await checkWeekly();
});
chrome.alarms.onAlarm.addListener(async () => {
  await withDb(db => { C.recover(db, Date.now()); return syncBlocking(db); });
  await checkWeekly();
});

// ---- parent session: the PIN is checked once, then a short-lived token is used ----
// (PIN hashing is deliberately slow, so repeating it for every click would make the parent pages sluggish.)
async function newParentToken() {
  const a = new Uint8Array(24); crypto.getRandomValues(a);
  const token = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
  await chrome.storage.session.set({ parentToken: token, parentTokenExp: Date.now() + 15 * 60000 });
  return token;
}
async function tokenOk(token) {
  if (!token) return false;
  const s = await chrome.storage.session.get(['parentToken', 'parentTokenExp']);
  if (!s.parentToken || s.parentToken !== token || Date.now() > s.parentTokenExp) return false;
  await chrome.storage.session.set({ parentTokenExp: Date.now() + 15 * 60000 }); // stays unlocked while in use
  return true;
}

// ---- messages ----
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  handle(msg, sender).then(reply, (e) => reply({ error: String(e && e.message || e) }));
  return true;
});

async function handle(msg, sender) {
  const now = Date.now();
  switch (msg.type) {
    case 'status': {
      const db = await readDb();
      const child = db.children.find(c => c.id === db.activeChildId) || null;
      const r = child ? C.runtimeFor(db, child.id, now) : null;
      return { configured: !!db.parent && db.children.length > 0, child, runtime: r,
        children: db.children.map(c => ({ id: c.id, name: c.name })), paused: now < (db.monitoringPausedUntil || 0),
        revision: child ? (db.revision[child.id] || { maths: [], english: [] }) : null, lastBeat: db.lastBeat || null };
    }
    case 'chooseChild': {
      return withDb(async db => {
        if (db.activeChildId && db.activeChildId !== msg.childId) {
          const ok = msg.pin && (await C.checkPin(db, msg.pin, now)).ok;
          if (!ok) return { error: 'A parent PIN is needed to switch child.' };
        }
        if (!db.children.some(c => c.id === msg.childId)) return { error: 'Unknown child' };
        db.activeChildId = msg.childId; C.runtimeFor(db, msg.childId, now);
        await syncBlocking(db);
        return { ok: true };
      });
    }
    case 'heartbeat': {
      const selectedTab = sender.tab ? await isFromSelectedTab(sender.tab.id) : false;
      const fromActiveTab = selectedTab && msg.visible && msg.focused;
      const idleState = await chrome.idle.queryState(60);
      const res = await withDb(db => {
        if (!db.parent) return { effects: [] };
        const child = db.children.find(c => c.id === db.activeChildId);
        const paused = now < (db.monitoringPausedUntil || 0);
        const mode = child ? child.rules.mode : 'playback';
        const candidateSec = mode === 'playback' ? msg.playingSec : msg.foregroundSec;
        const rBefore = child ? C.runtimeFor(db, child.id, now) : null;
        const reason = C.beatReason({ paused, child, state: rBefore && rBefore.state, gap: candidateSec > C.MAX_HEARTBEAT_SEC || msg.gap,
          locked: idleState === 'locked', pip: !!msg.pip, visible: msg.visible, selectedTab, focused: msg.focused, mode, playing: msg.playing });
        db.lastBeat = { at: now, childId: child ? child.id : null, reason };
        const out = C.applyHeartbeat(db, { candidateSec, backgroundSec: msg.backgroundSec, pipSec: msg.pipSec, unfocusedSec: msg.unfocusedSec,
          contentSec: msg.contentSec, fromActiveTab, playing: msg.playing }, { idleState, nowMs: now });
        if (!child) return out;
        out.child = child; out.runtime = C.runtimeFor(db, child.id, now);
        return out;
      });
      if (res.effects.includes('transition')) {
        const mins = Math.max(1, Math.round(res.runtime.balanceUsed / 60));
        const subject = res.runtime.subject === 'english' ? 'English' : 'Maths';
        const text = `Well done, ${res.child.name}! You've watched for ${mins} minute${mins === 1 ? '' : 's'}. Let's try some ${subject} together.`;
        if (sender.tab) chrome.tabs.sendMessage(sender.tab.id, { type: 'countdown', text, seconds: 10 }).catch(() => {});
        if (res.child.readAloud) speak(text);
      }
      if (res.effects.includes('rest')) {
        await tellYouTubeTabs({ type: 'rest', name: res.child.name });
        if (res.child.readAloud) speak(`That's all the video for today, ${res.child.name}.`);
        await withDb(db => syncBlocking(db));
      }
      if (res.effects.includes('enforce') && sender.tab) chrome.tabs.sendMessage(sender.tab.id, { type: 'enforce', state: res.runtime && res.runtime.state }).catch(() => {});
      return { effects: res.effects, state: res.runtime ? res.runtime.state : null,
        used: res.runtime ? res.runtime.balanceUsed : 0, allow: res.child ? res.child.rules.ent * 60 : 0 };
    }
    case 'countdownDone': {
      const tabId = sender.tab && sender.tab.id;
      const ok = await withDb(async db => {
        if (!db.activeChildId) return false;
        const done = C.beginLearning(db, db.activeChildId, { url: msg.url, pos: msg.pos }, now);
        await syncBlocking(db);
        return done;
      });
      if (ok) { await tellYouTubeTabs({ type: 'enforce', state: 'learning' }); if (tabId) await chrome.tabs.update(tabId, { url: LEARN_URL }); }
      return { ok };
    }
    case 'learnStart': {
      return withDb(async db => {
        const child = db.children.find(c => c.id === db.activeChildId);
        if (!child) return { error: 'no_child' };
        const r = C.runtimeFor(db, child.id, now);
        if (r.state === 'transition') C.beginLearning(db, child.id, null, now);
        await syncBlocking(db);
        const subject = r.session ? r.session.subject : (r.subject || 'maths');
        C.ensureChildModel(child, C.dayKey(now));
        return { child, runtime: r, subject, plan: C.planSession(db, child, subject, now), revision: (db.revision[child.id] || {})[subject] || [] };
      });
    }
    case 'learnProgress': return withDb(db => { if (db.activeChildId) C.saveProgress(db, db.activeChildId, msg); return { ok: true }; });
    case 'learnBreak': return withDb(db => { const r = db.runtime[db.activeChildId]; if (r && (r.state === 'learning' || r.state === 'break')) r.state = msg.on ? 'break' : 'learning'; return { ok: true }; });
    case 'learnFinish': {
      const out = await withDb(async db => {
        const state = C.finishLearning(db, db.activeChildId, msg.summary, now);
        await syncBlocking(db);
        return { state, saved: db.runtime[db.activeChildId] && db.runtime[db.activeChildId].saved };
      });
      if (out.state === 'entertainment') await tellYouTubeTabs({ type: 'released' });
      return out;
    }
    case 'returnHandled': return withDb(db => { const r = db.runtime[db.activeChildId]; if (r) r.returnPending = false; return { ok: true }; });
    case 'goLearn': { if (sender.tab) await chrome.tabs.update(sender.tab.id, { url: LEARN_URL }); return { ok: true }; }
    case 'speak': { speak(String(msg.text || '').slice(0, 400)); return { ok: true }; }

    // ---- parent actions (all need the PIN) ----
    case 'parentSetup': {
      return withDb(async db => {
        if (db.parent) return { error: 'A parent PIN is already set.' };
        const code = await C.setParentPin(db, msg.pin);
        db.createdAt = now;
        return { ok: true, recoveryCode: code, token: await newParentToken() };
      });
    }
    case 'parentCheck': return withDb(async db => { const r = await C.checkPin(db, msg.pin, now); if (r.ok) r.token = await newParentToken(); return r; });
    case 'parentLock': { await chrome.storage.session.remove(['parentToken', 'parentTokenExp']); return { ok: true }; }
    case 'parentRecover': {
      return withDb(async db => {
        if (!(await C.checkRecovery(db, msg.code))) return { error: 'That recovery code is not right.' };
        const code = await C.setParentPin(db, msg.newPin);
        return { ok: true, recoveryCode: code, token: await newParentToken() };
      });
    }
    case 'parent': {
      if (!(await tokenOk(msg.token))) return { ok: false, reason: 'locked' };
      return withDb(async db => {
        const a = msg.action;
        if (a === 'getDb') return { ok: true, db };
        if (a === 'saveChildren') {
          for (const nw of msg.children) { // record parent changes to the levels so the report can explain them
            const old = db.children.find(c => c.id === nw.id);
            if (old && nw.stage) { C.ensureChildModel(old, C.dayKey(now)); for (const sub of ['maths', 'english']) if (old.stage[sub] !== nw.stage[sub]) C.setStage(db, old, sub, nw.stage[sub], now); }
          }
          db.children = msg.children.map(c => Object.assign({}, c, { name: String(c.name).slice(0, 30) }));
          if (!db.children.some(c => c.id === db.activeChildId)) db.activeChildId = null;
        }
        if (a === 'setActive') { if (db.children.some(c => c.id === msg.childId)) { db.activeChildId = msg.childId; C.runtimeFor(db, msg.childId, now); } }
        if (a === 'saveWeekly') {
          const email = String(msg.email || '').trim();
          if (email && !C.validEmail(email)) return { ok: false, error: 'That email address does not look right.' };
          db.weekly = { email, day: Math.max(0, Math.min(6, +msg.day || 0)), enabled: !!msg.enabled && !!email };
        }
        if (a === 'markSent') C.markSent(db, msg.key, now);
        if (a === 'override') C.parentOverride(db, msg.childId || db.activeChildId, msg.what, now, msg.minutes);
        if (a === 'changePin') { const code = await C.setParentPin(db, msg.newPin); await syncBlocking(db); return { ok: true, recoveryCode: code }; }
        if (a === 'deleteChildData') {
          const id = msg.childId;
          db.sessions = db.sessions.filter(s => s.childId !== id); delete db.activity[id]; delete db.revision[id];
          delete db.skills[id]; delete db.runtime[id]; db.overrides = db.overrides.filter(o => o.childId !== id);
        }
        if (a === 'deleteEverything') { const p = db.parent; Object.assign(db, C.emptyDb()); db.parent = p; }
        await syncBlocking(db);
        return { ok: true, db };
      }).then(async res => {
        if (res && res.ok && msg.action === 'override') await tellYouTubeTabs({ type: 'released' });
        if (res && res.ok && msg.action === 'saveWeekly') await checkWeekly();
        return res;
      });
    }
  }
  return { error: 'unknown message' };
}
