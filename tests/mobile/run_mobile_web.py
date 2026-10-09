"""Checks the phone app's screens (the web part) in Chromium at phone size, with a stand-in for the Android side.
It cannot test the Android code itself (usage access, the counting service, opening over YouTube). That needs a real phone.
Run from the repo root:  python3 tests/mobile/run_mobile_web.py"""
import asyncio, json, pathlib, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
RESULTS = []
def check(name, ok, detail=''):
    RESULTS.append((name, bool(ok), detail)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''), flush=True)

# A stand-in for the Android bridge. It keeps its state in localStorage so it survives page changes, like the real app's storage.
MOCK = """
(() => {
  const g = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const s = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const log = (m) => { const l = g('mock-log', []); l.push(m); s('mock-log', l); };
  window.LLAndroid = {
    loadDb: () => localStorage.getItem('mock-db'), saveDb: (t) => localStorage.setItem('mock-db', t),
    hasUsageAccess: () => true, canDrawOverlays: () => true, notificationsAllowed: () => true,
    openUsageAccess: () => log('openUsageAccess'), openOverlaySettings: () => log('openOverlaySettings'), requestNotifications: () => log('requestNotifications'),
    configure: (j) => { log('configure'); s('mock-cfg', JSON.parse(j)); },
    startMonitor: () => { log('startMonitor'); const st = g('mock-state', {}); st.monitoring = true; s('mock-state', st); },
    stopMonitor: () => { log('stopMonitor'); const st = g('mock-state', {}); st.monitoring = false; s('mock-state', st); },
    getState: () => { const c = g('mock-cfg', {}); return JSON.stringify(Object.assign({ state: 'watching', balanceSec: 0, daySec: 0, monitoring: false }, g('mock-state', {}), { entSec: c.entSec || 0, capSec: c.capSec || 0, name: c.name })); },
    getActivity: () => JSON.stringify(g('mock-activity', {})),
    finishLearning: () => { log('finishLearning'); const st = g('mock-state', {}); st.state = 'watching'; st.balanceSec = 0; s('mock-state', st); return JSON.stringify({ state: 'watching' }); },
    skipLearning: () => log('skipLearning'), resetToday: () => log('resetToday'),
    speak: (t) => log('speak:' + t), goHome: () => { log('goHome'); location.href = 'app.html'; }
  };
})();
"""

async def main():
    out = pathlib.Path(tempfile.mkdtemp())
    subprocess.run(['node', str(ROOT / 'mobile' / 'web' / 'build.js'), str(out)], check=True)
    www = out / 'www'
    lj = (www / 'learn.js').read_text(); anchor = "  if (PRACTICE) { await startPractice(); return; }"
    (www / 'learn.js').write_text(lj.replace(anchor, "  window.__llAnswer = () => (session && session.current) ? String(session.current.answer) : null; // TEST ONLY\n" + anchor))
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8766', '--bind', '127.0.0.1'], cwd=www, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shots = ROOT / 'mobile' / 'docs' / 'img'; shots.mkdir(parents=True, exist_ok=True)
    BASE = 'http://127.0.0.1:8766/'
    try:
        await asyncio.sleep(0.8)
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            await ctx.add_init_script(MOCK)
            errors = []; left = []
            async def yt(route): left.append(route.request.url); await route.fulfill(body='left the app')
            await ctx.route('https://www.youtube.com/**', yt)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errors.append(str(e)))
            async def mock(key): return await pg.evaluate(f"JSON.parse(localStorage.getItem('{key}') || 'null')")
            async def db(): return await pg.evaluate("JSON.parse(localStorage.getItem('mock-db') || 'null')")

            await pg.goto(BASE + 'app.html'); await pg.wait_for_selector('#pin')
            check('First run asks for a parent PIN', 'Welcome to LearnLoop' in await pg.inner_text('main'))
            await pg.fill('#pin', '2468'); await pg.click('#save'); await pg.wait_for_selector('#code', timeout=30000)
            d = await db(); check('PIN is stored only as a salted hash', d['parent'] and '2468' not in json.dumps(d['parent']) and len(d['parent']['hash']) == 64)
            await pg.check('#saved'); await pg.click('#go'); await pg.wait_for_selector('[data-k="name"]')
            await pg.fill('[data-k="name"]', 'Joy'); await pg.locator('[data-k="name"]').dispatch_event('change')
            await pg.fill('[data-k="birthday"]', '2019-03-14'); await pg.locator('[data-k="birthday"]').dispatch_event('change'); await asyncio.sleep(0.3)
            for k, v in (('ent', '5'), ('max', '10'), ('min', '0')):
                await pg.fill(f'[data-r="{k}"]', v); await pg.locator(f'[data-r="{k}"]').dispatch_event('change')
            await pg.screenshot(path=str(shots / 'children.png'))
            await pg.click('#save'); await asyncio.sleep(0.4)
            d = await db(); joy = d['children'][0]
            check('A child is saved with the school year from the birthday', joy['name'] == 'Joy' and joy['stage']['maths'] == 'Y3' and d['activeChildId'] == joy['id'], json.dumps(joy['stage']))
            cfg = await mock('mock-cfg')
            check('Android is told who to count and for how long', cfg and cfg['entSec'] == 300 and cfg['capSec'] == 3600 and 'com.google.android.youtube' in cfg['packages'], json.dumps(cfg))

            await pg.click('#tabs button[data-v="setup"]'); await pg.wait_for_selector('#mon')
            txt = await pg.inner_text('main')
            check('Phone setup explains each permission in plain words', 'Usage access' in txt and 'Display over other apps' in txt and 'does not see what is being watched' in txt)
            await pg.click('#mon'); await asyncio.sleep(0.9)
            st = await mock('mock-state'); check('Start counting turns on the Android counter', st and st.get('monitoring') is True)
            await pg.screenshot(path=str(shots / 'setup.png'))

            # Android decides learning is due and opens the app at the countdown
            await pg.evaluate("localStorage.setItem('mock-state', JSON.stringify({ monitoring: true, state: 'learning', balanceSec: 300, daySec: 300 }))")
            await pg.goto(BASE + 'app.html#countdown'); await pg.wait_for_selector('#ring')
            ct = await pg.inner_text('main'); await pg.screenshot(path=str(shots / 'countdown.png'))
            check('A gentle countdown names the child, the minutes and the subject', "Well done, Joy! You've watched for 5 minutes. Let's try some Maths together." in ct, ct[:120])
            await pg.click('#go'); await pg.wait_for_selector('.prompt', timeout=10000)
            head = await pg.inner_text('.lhead h2')
            check('The learning screen from the extension runs inside the app', 'Maths with Joy' in head, head)
            await pg.screenshot(path=str(shots / 'learning.png'))
            for i in range(12):
                if await pg.query_selector('.over .card'): break
                right = await pg.evaluate("window.__llAnswer()")
                if right is None: break
                if await pg.query_selector('#typedIn') and not await pg.query_selector('.choice'):
                    await pg.fill('#typedIn', right); await pg.click('#typedGo')
                else:
                    await pg.evaluate("(v) => [...document.querySelectorAll('.choice')].find(b => b.dataset.v === v).click()", right)
                await asyncio.sleep(1.7)
            await pg.wait_for_selector('.over .card', timeout=15000); endtxt = await pg.inner_text('.card')
            check('Answering by themselves finishes the session early', 'You did it!' in endtxt, endtxt.replace('\n', ' ')[:100])
            d = await db(); s = d['sessions'][-1]
            check('The session is saved with answers by themselves, not as practice', s['practice'] is False and s['reason'] == 'mastery' and s['ind'] >= 4 and s['subject'] == 'maths', json.dumps({k: s[k] for k in ('practice', 'reason', 'ind', 'subject')}))
            log = await mock('mock-log'); check('Android is told learning has finished', 'finishLearning' in log)
            await pg.click('#back'); await asyncio.sleep(1)
            check('Back to my video leaves the app for YouTube', any('youtube.com' in u for u in left), json.dumps(left))

            # extra practice from the child's home screen
            await pg.goto(BASE + 'app.html'); await pg.wait_for_selector('#practise')
            home = await pg.inner_text('main'); await pg.screenshot(path=str(shots / 'home.png'))
            check("The child's home screen greets them and offers practice", 'Hi Joy!' in home and 'Practise' in home, home[:120].replace('\n', ' '))
            await pg.click('#practise'); await pg.wait_for_selector('[data-sub]')
            await pg.click('[data-sub="english"]'); await pg.wait_for_selector('.prompt')
            right = await pg.evaluate("window.__llAnswer()"); await pg.evaluate("(v) => [...document.querySelectorAll('.choice')].find(b => b.dataset.v === v).click()", right); await asyncio.sleep(1.7)
            await pg.click('[data-a="done"]'); await pg.wait_for_selector('#close'); await pg.click('#close'); await pg.wait_for_selector('#practise', timeout=5000)
            d = await db(); check('Practice is saved as practice and "I\'m done" returns home', d['sessions'][-1]['reason'] == 'practice' and d['sessions'][-1]['practice'] is True)

            # report, after the parent PIN, with Android's measured app time
            day = time.strftime('%Y-%m-%d')
            await pg.evaluate(f"localStorage.setItem('mock-activity', JSON.stringify({{ '{day}': {{ '{joy['id']}': 600 }} }}))")
            await pg.click('#grown'); await pg.fill('#pin', '1111'); await pg.click('#go'); await asyncio.sleep(2.5)
            check('A wrong PIN is refused', 'not right' in await pg.inner_text('#err'))
            await pg.fill('#pin', '2468'); await pg.click('#go'); await pg.wait_for_selector('#mon', timeout=15000)
            await pg.click('#tabs button[data-v="report"]'); await asyncio.sleep(0.6)
            rep = await pg.inner_text('main'); await pg.screenshot(path=str(shots / 'report.png'))
            check('The report shows YouTube time from Android and learning from the app', '10 min' in rep and 'YouTube on screen today' in rep and 'Working at: Maths Year 3' in rep, rep[:200].replace('\n', ' '))
            check('No script errors', not errors, '; '.join(errors)[:300])
            await b.close()
    finally:
        srv.terminate()
    passed = sum(1 for r in RESULTS if r[1])
    print(f'\n{passed} of {len(RESULTS)} checks passed')
    (ROOT / 'tests' / 'mobile' / 'last-run.json').write_text(json.dumps([{'check': n, 'passed': ok, 'detail': dt} for n, ok, dt in RESULTS], indent=1))
    sys.exit(0 if passed == len(RESULTS) else 1)

asyncio.run(main())
