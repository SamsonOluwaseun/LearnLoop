/* LearnLoop YouTube script. Measures playback with a monotonic clock and shows the gentle switch.
 * It never reads video titles, comments, or what is being watched. Only playing or paused, and the
 * page address and position when it has to pause the video so the child can return to it. */
(() => {
  'use strict';
  // Skip only if another copy is alive. A copy left behind by an older install stops ticking, so a fresh copy takes over.
  if (window.__learnloopBeat && performance.now() - window.__learnloopBeat < 2500) return;
  const HEARTBEAT_MS = 5000;
  const ZERO = () => ({ playingSec: 0, foregroundSec: 0, backgroundSec: 0, pipSec: 0, unfocusedSec: 0, contentSec: 0 });
  let acc = ZERO(), lastPos = null, lastVid = null;
  let last = performance.now();
  let host = null, root = null, overlayKind = null;
  let returnPending = false, alive = true;

  const video = () => document.querySelector('video.html5-main-video') || document.querySelector('video');
  const isPlaying = (v) => !!v && !v.paused && !v.ended && v.readyState > 2;
  const send = (m) => { if (!alive || !chrome.runtime || !chrome.runtime.id) { alive = false; return Promise.resolve(null); }
    return chrome.runtime.sendMessage(m).catch(() => null); };

  // ---- measurement: one-second ticks, deltas from performance.now ----
  let gap = false;
  const ticker = setInterval(() => {
    if (!chrome.runtime || !chrome.runtime.id) { alive = false; clearInterval(ticker); clearInterval(beater); return; } // LearnLoop was removed or updated
    window.__learnloopBeat = performance.now();
    const now = performance.now(); const dt = (now - last) / 1000; last = now;
    const v = video(); const playing = isPlaying(v);
    const visible = document.visibilityState === 'visible';
    const focused = document.hasFocus();
    const pip = !!document.pictureInPictureElement;
    // How far the video itself moved on. Faster playback or skipping ahead makes this bigger than real time.
    const pos = v ? v.currentTime : null; let adv = 0;
    if (v && v === lastVid && lastPos !== null && pos > lastPos) adv = pos - lastPos;
    if (adv > dt * 4 + 1) adv = 0; // a jump: the child skipped ahead, not watched
    lastPos = pos; lastVid = v;
    if (playing && !visible) { if (dt <= 70) acc.backgroundSec += dt; return; } // throttled background tab: approximate, never counted
    if (dt > 5) { gap = true; return; } // page was frozen, asleep or the clock jumped: count nothing
    if (pip && playing) acc.pipSec += dt;
    else if (visible && focused) { acc.foregroundSec += dt; if (playing) { acc.playingSec += dt; acc.contentSec += adv; } }
    else if (visible && playing) acc.unfocusedSec += dt; // on screen but another window or app has focus
    if (returnPending && playing) { v.pause(); returnPending = false; toast('Welcome back! Your video is ready. Press play when you are.'); send({ type: 'returnHandled' }); }
  }, 1000);

  const beater = setInterval(async () => {
    const v = video();
    const msg = Object.assign({ type: 'heartbeat', playing: isPlaying(v), visible: document.visibilityState === 'visible', focused: document.hasFocus(),
      pip: !!document.pictureInPictureElement, gap }, acc);
    acc = ZERO(); gap = false;
    const res = await send(msg);
    // If the background worker could not be reached, keep the time and send it with the next update
    if (!res && alive) for (const k of Object.keys(acc)) acc[k] += msg[k] || 0;
    if (res && res.effects && res.effects.includes('needChild')) askWho();
  }, HEARTBEAT_MS);

  // A video that starts while learning is due gets paused straight away
  document.addEventListener('play', async (e) => {
    if (overlayKind === 'countdown') return;
    const st = await send({ type: 'status' });
    if (!st || !st.configured || st.paused) return;
    if (!st.child) { e.target.pause(); askWho(); return; }
    if (st.runtime && st.runtime.state !== 'entertainment' && st.runtime.state !== 'transition') { e.target.pause(); enforce(st.runtime.state, st.child.name); }
  }, true);

  (async () => {
    const st = await send({ type: 'status' });
    if (!st || !st.configured || st.paused) return;
    if (!st.child) { askWho(); return; }
    if (st.runtime && st.runtime.returnPending) {
      // Only the video the child left waits for them. Any other video plays normally.
      const vid = (href) => { try { return new URL(href).searchParams.get('v'); } catch (e) { return null; } };
      const saved = st.runtime.saved && vid(st.runtime.saved.url);
      if (saved && saved === vid(location.href)) returnPending = true; else send({ type: 'returnHandled' });
    }
    if (st.runtime && ['learning', 'break', 'rest'].includes(st.runtime.state)) enforce(st.runtime.state, st.child.name);
  })();

  chrome.runtime.onMessage.addListener((m) => {
    if (m.type === 'countdown') countdown(m.text, m.seconds);
    if (m.type === 'enforce') enforce(m.state);
    if (m.type === 'rest') enforce('rest', m.name);
    if (m.type === 'released') { if (overlayKind !== 'countdown') clearOverlay(); }
  });

  // ---- overlays in a shadow root so YouTube's styles cannot interfere ----
  const CSS = `
    :host{all:initial}
    .back{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(0,33,43,.66);font-family:"Segoe UI",system-ui,sans-serif}
    .back.light{background:transparent;pointer-events:none;align-items:start;padding-top:80px}
    .card{pointer-events:auto;background:#FEFFF8;color:#00212B;border-top:6px solid #4392F1;border-radius:22px;padding:28px 30px;max-width:460px;width:calc(100% - 40px);display:grid;gap:14px;justify-items:center;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35)}
    h2{margin:0;font-size:26px;line-height:1.2}
    p{margin:0;font-size:18px;line-height:1.45}
    .small{font-size:14px;color:#3E5862}
    .powered{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#3E5862;margin-top:4px}
    .powered img{height:18px;width:auto}
    .ring{width:84px;height:84px;border-radius:50%;display:grid;place-items:center;font-size:30px;font-weight:700}
    .ring span{width:66px;height:66px;border-radius:50%;background:#FEFFF8;display:grid;place-items:center}
    button{font:inherit;font-size:18px;font-weight:700;border:0;border-radius:14px;padding:12px 22px;background:#DCFF38;color:#00212B;cursor:pointer}
    button.ghost{background:#EEF4FD;color:#00212B}
    button:focus-visible{outline:3px solid #4392F1;outline-offset:2px}
    .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
    .kid{min-width:120px;padding:18px 20px;font-size:22px}`;
  function mount(kind, html, light) {
    clearOverlay();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    host = document.createElement('div'); host.id = 'learnloop-overlay';
    root = host.attachShadow({ mode: 'open' });
    const mark = chrome.runtime.getURL('brand/samlytics-mark.png');
    root.innerHTML = `<style>${CSS}</style><div class="back ${light ? 'light' : ''}"><div class="card" role="dialog" aria-live="polite">${html}<div class="powered"><img src="${mark}" alt="">Powered by Samlytics Data Services</div></div></div>`;
    document.documentElement.appendChild(host); overlayKind = kind;
    return root;
  }
  function clearOverlay() { if (host) host.remove(); host = null; root = null; overlayKind = null; }
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function countdown(text, seconds) {
    let left = seconds;
    const r = mount('countdown', `<h2>${esc(text.split('!')[0])}!</h2><p>${esc(text.slice(text.indexOf('!') + 1).trim())}</p>
      <div class="ring"><span>${left}</span></div><button id="go">I'm ready</button>`);
    const ring = r.querySelector('.ring'), num = r.querySelector('.ring span');
    const paint = () => { ring.style.background = `conic-gradient(#4392F1 ${left / seconds * 100}%, #EEF4FD 0)`; num.textContent = Math.max(0, Math.ceil(left)); };
    paint();
    const t = setInterval(() => { left -= 0.25; paint(); if (left <= 0) finish(); }, 250);
    let done = false;
    function finish() {
      if (done) return; done = true; clearInterval(t);
      const v = video(); let pos = 0;
      if (v) { v.pause(); pos = v.currentTime || 0; }
      clearOverlay();
      send({ type: 'countdownDone', url: cleanUrl(location.href), pos });
    }
    r.getElementById('go').onclick = finish;
  }
  // Keep only what is needed to return: the page address without tracking extras
  function cleanUrl(href) {
    try { const u = new URL(href); const keep = new URL(u.origin + u.pathname); for (const k of ['v', 'list', 'index']) if (u.searchParams.get(k)) keep.searchParams.set(k, u.searchParams.get(k)); return keep.toString(); }
    catch (e) { return 'https://www.youtube.com/'; }
  }

  function enforce(state, name) {
    const v = video(); if (v && !v.paused) v.pause();
    if (state === 'rest') {
      mount('rest', `<h2>That's all the video for today${name ? ', ' + esc(name) : ''}</h2><p>How about drawing, building or playing outside?</p><p class="small">A grown-up can change today's limit in LearnLoop.</p>`);
      return;
    }
    if (state === 'learning' || state === 'break') {
      const r = mount('learn', `<h2>Learning time first</h2><p>Your learning is waiting for you. Videos will be back when you finish.</p><button id="go">Go to learning</button>`);
      r.getElementById('go').onclick = () => send({ type: 'goLearn' });
    }
  }

  async function askWho() {
    if (overlayKind === 'who') return;
    const st = await send({ type: 'status' });
    if (!st || !st.configured || st.child) return;
    const v = video(); if (v && !v.paused) v.pause();
    const r = mount('who', `<h2>Who's watching?</h2><div class="row">${st.children.map(c => `<button class="kid" data-id="${esc(c.id)}">${esc(c.name)}</button>`).join('')}</div>`);
    r.querySelectorAll('button[data-id]').forEach(b => b.onclick = async () => { const res = await send({ type: 'chooseChild', childId: b.dataset.id }); if (res && res.ok) clearOverlay(); });
  }

  function toast(text) {
    const r = mount('toast', `<p>${esc(text)}</p><button class="ghost" id="ok">OK</button>`, true);
    r.getElementById('ok').onclick = clearOverlay;
    setTimeout(() => { if (overlayKind === 'toast') clearOverlay(); }, 8000);
  }
})();
