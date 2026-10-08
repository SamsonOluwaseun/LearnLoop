(async () => {
  const st = await chrome.runtime.sendMessage({ type: 'status' });
  const s = document.getElementById('s');
  const STATE = { entertainment: 'Watching', transition: 'Switching to learning', learning: 'Learning', break: 'On a break', rest: 'Done for today' };
  if (!st.configured) s.textContent = 'Not set up yet. Open parent settings to start.';
  else if (st.paused) s.textContent = 'Monitoring is paused by a parent.';
  else if (!st.child) s.textContent = 'Nobody chosen yet. YouTube will ask who is watching.';
  else {
    const r = st.runtime, c = st.child;
    s.textContent = `${c.name}: ${STATE[r.state] || r.state}. Video this round ${Math.floor(r.balanceUsed / 60)} of ${c.rules.ent} min. Today ${Math.floor(r.dayWatched / 60)} of ${c.rules.cap} min.`;
  }
  const REASONS = {
    counted: 'Counting now: a video is playing in the front tab.', not_playing: 'Not counting: the video is paused.',
    background: 'Not counting: YouTube is not the selected tab.', window: 'Not counting: another window is in front.',
    locked: 'Not counting: the laptop is locked.', gap: 'Not counting: the laptop was asleep.', pip: 'Not counting: picture in picture.',
    no_child: "Waiting for someone to choose who's watching.", paused: 'Monitoring paused by a parent.', learning: 'Video time paused for learning.', rest: 'Daily limit reached.' };
  const b = st.lastBeat, d = document.getElementById('d');
  if (st.configured) {
    if (b && Date.now() - b.at < 20000) d.textContent = REASONS[b.reason] || b.reason;
    else d.textContent = 'No signal from YouTube right now. If a YouTube tab is playing, reload it once (F5).';
  }
  document.getElementById('open').onclick = () => chrome.runtime.openOptionsPage();
  // Practice is for the child who is using LearnLoop now. It never adds or uses video time.
  const p = document.getElementById('practise');
  if (st.configured && st.child) { p.hidden = false; p.onclick = () => { chrome.tabs.create({ url: chrome.runtime.getURL('learn.html?practice=1') }); window.close(); }; }
})();
