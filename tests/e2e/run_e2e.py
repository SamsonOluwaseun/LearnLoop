"""End-to-end check of the real extension in Chromium against a local stand-in video page.
Run from the repo root:  python3 tests/e2e/run_e2e.py
It cannot reach real YouTube from the build machine, so the test build adds http://localhost to the watched sites."""
import asyncio, json, re, shutil, subprocess, sys, tempfile, time, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
RESULTS = []
def check(name, ok, detail=''):
    RESULTS.append((name, bool(ok), detail)); print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''), flush=True)

def test_build():
    d = pathlib.Path(tempfile.mkdtemp()) / 'ext'
    shutil.copytree(ROOT / 'extension', d)
    m = json.loads((d / 'manifest.json').read_text())
    m['host_permissions'] += ['http://localhost/*', 'http://127.0.0.1/*']  # 127.0.0.1 stands in for a tab opened before install: no automatic script
    m['content_scripts'][0]['matches'].append('http://localhost/*')
    m['web_accessible_resources'][0]['matches'].append('http://localhost/*')
    (d / 'manifest.json').write_text(json.dumps(m, indent=2))
    bg = (d / 'background.js').read_text()
    bg = bg.replace("const SITE_DOMAINS = ['youtube.com'];", "const SITE_DOMAINS = ['youtube.com', 'localhost'];")
    bg = bg.replace("const SITE_PATTERNS = ['*://*.youtube.com/*'];", "const SITE_PATTERNS = ['*://*.youtube.com/*', 'http://localhost/*', 'http://127.0.0.1/*'];")
    (d / 'background.js').write_text(bg)
    lj = (d / 'learn.js').read_text()
    anchor = "  if (PRACTICE) { await startPractice(); return; }"
    assert anchor in lj
    (d / 'learn.js').write_text(lj.replace(anchor, "  window.__llAnswer = () => (session && session.current) ? String(session.current.answer) : null; // TEST BUILD ONLY\n" + anchor))
    return d

WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty']
async def current_answer(page): return await page.evaluate("window.__llAnswer()")
async def click_choice(page, value):
    await page.evaluate("(v) => [...document.querySelectorAll('.choice')].find(b => b.dataset.v === v).click()", value)
async def wrong_choice(page, right):
    return await page.evaluate("(r) => [...document.querySelectorAll('.choice')].map(b => b.dataset.v).find(v => v !== r)", right)
def answer_for(prompt):
    m = re.match(r'(\d+) ([+−]) (\d+)', prompt)
    if m: a, op, b = int(m[1]), m[2], int(m[3]); return str(a + b if op == '+' else a - b)
    return None

async def main():
    ext = test_build()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=ROOT / 'tests' / 'e2e', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    VIDEO = 'http://localhost:8765/video.html?v=abc123&feature=share'
    try:
        async with async_playwright() as p:
            ctx = await p.chromium.launch_persistent_context(tempfile.mkdtemp(), headless=True, channel='chromium',
                args=[f'--disable-extensions-except={ext}', f'--load-extension={ext}'], viewport={'width': 1100, 'height': 800})
            sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
            ext_id = sw.url.split('/')[2]
            errors = []
            ctx.on('weberror', lambda e: errors.append(str(e.error)))
            async def db(): return await sw.evaluate("chrome.storage.local.get('db').then(r => r.db)")

            # ---- first run in the parent page ----
            await asyncio.sleep(1.5)
            opt = next((pg for pg in ctx.pages if 'options.html' in pg.url), None)
            check('Parent setup opens on install', opt is not None)
            opt.on('pageerror', lambda e: errors.append('options: ' + str(e)))
            await opt.fill('#p1', '2468'); await opt.fill('#p2', '2468'); await opt.click('#go')
            await opt.wait_for_selector('#code', timeout=20000)
            code = (await opt.inner_text('#code')).strip()
            d = await db()
            check('PIN stored only as salted hash', '2468' not in json.dumps(d['parent']) and len(d['parent']['hash']) == 64)
            await opt.check('#saved'); await opt.click('#go')
            await opt.wait_for_selector('.kidform', timeout=10000); await asyncio.sleep(6.5)  # longer than the 5 s auto-refresh
            still = await opt.evaluate("({ form: !!document.querySelector('.kidform'), tabs: !document.getElementById('tabs').hidden, tab: document.querySelector('#tabs [aria-selected=true]').dataset.v })")
            check('After the PIN, the children form appears and stays (was replaced by an empty page in 0.3)', still['form'] and still['tabs'] and still['tab'] == 'kids', json.dumps(still))
            # child 1: Joy, Year 1 to 2, 1 minute video, up to 2 minutes learning, no minimum
            await opt.fill('[data-i="0"][data-k="name"]', 'Joy'); await opt.locator('[data-i="0"][data-k="name"]').dispatch_event('change')
            years = await opt.evaluate("[...document.querySelectorAll('[data-i=\"0\"][data-b=\"y\"] option')].map(o => o.value).filter(Boolean)")
            check('Birthday years run from 1988 to this year', years[0] == '1988' and years[-1] == str(time.localtime().tm_year), f'{years[0]} ... {years[-1]}, {len(years)} years')
            async def pick_birthday(i, d, m, y):
                for k, v in (('d', d), ('m', m), ('y', y)):
                    await opt.select_option(f'[data-i="{i}"][data-b="{k}"]', v); await asyncio.sleep(0.15)
            await pick_birthday(0, '31', '2', '2019'); await asyncio.sleep(0.2)
            check('Impossible birthday is caught', 'does not have 31 days' in await opt.inner_text('.kidform'))
            await pick_birthday(0, '14', '3', '2019'); await asyncio.sleep(0.2)
            note = await opt.inner_text('.kidform')
            stages = await opt.evaluate("[...document.querySelectorAll('[data-i=\"0\"][data-stage]')].map(s => s.value)")
            check('Date of birth sets the school year and starting level (Year 3 for March 2019)', 'Age 7, Year 3' in note and stages == ['Y3', 'Y3', 'Y4'], note[note.find('Age'):note.find('Age') + 60] + ' ' + json.dumps(stages))
            for k, v in (('ent', '1'), ('max', '2'), ('min', '0')):
                await opt.fill(f'[data-i="0"][data-r="{k}"]', v); await opt.locator(f'[data-i="0"][data-r="{k}"]').dispatch_event('change')
            await opt.click('#add')
            await opt.fill('[data-i="1"][data-k="name"]', 'Sam'); await opt.locator('[data-i="1"][data-k="name"]').dispatch_event('change')
            await pick_birthday(1, '2', '6', '2022'); await asyncio.sleep(0.2)
            for k, v in (('ent', '1'), ('max', '1'), ('min', '0')):
                await opt.fill(f'[data-i="1"][data-r="{k}"]', v); await opt.locator(f'[data-i="1"][data-r="{k}"]').dispatch_event('change')
            await opt.click('#save'); await opt.wait_for_selector('#who', timeout=10000)
            d = await db()
            check('Birthdays saved with starting levels: Joy Year 3, Sam Reception', d['children'][0]['birthday'] == '2019-03-14' and d['children'][0]['stage'] == {'maths': 'Y3', 'english': 'Y3', 'reasoning': 'Y4'} and d['children'][1]['stage'] == {'maths': 'R', 'english': 'R', 'reasoning': 'Y4'} and d['children'][0]['subjects']['reasoning'] is False and '_bd' not in d['children'][0], json.dumps([c.get('stage') for c in d['children']]))
            steps = await opt.inner_text('#main')
            check('Right now shows the setup steps with what to do next', 'Finish setting up LearnLoop' in steps and 'Parent PIN saved' in steps and "Open YouTube and choose who's watching" in steps, steps[:200])
            brand = await opt.evaluate("(() => { const i = document.querySelector('.brand img.mark'); return { img: !!i && i.complete && i.naturalWidth > 0, text: document.querySelector('.brand').innerText, font: document.fonts.check('800 24px Montserrat'), bg: getComputedStyle(document.body).backgroundColor }; })()")
            check('Parent page shows the Samlytics logo with Powered by Samlytics Data Services', brand['img'] and 'Powered by Samlytics Data Services' in brand['text'], json.dumps(brand))
            check('Brand font and cream background are used', brand['font'] and brand['bg'] in ('rgb(254, 255, 248)', 'rgb(0, 33, 43)'), json.dumps(brand))
            check('Two profiles saved with independent rules', [c['name'] for c in d['children']] == ['Joy', 'Sam'] and d['children'][0]['rules']['ent'] == 1 and d['children'][1]['rules']['max'] == 1)
            check('Younger child reads aloud and needs no typing', d['children'][1]['readAloud'] is True and d['children'][1]['typing'] is False)

            # ---- watching ----
            vid = await ctx.new_page(); vid.on('pageerror', lambda e: errors.append('video: ' + str(e)))
            await vid.goto(VIDEO); await vid.bring_to_front()
            await vid.wait_for_selector('#learnloop-overlay', state='attached', timeout=10000)
            who = await vid.evaluate("document.querySelector('#learnloop-overlay').shadowRoot.textContent")
            check("Asks who's watching", "Who's watching?" in who)
            await vid.evaluate("document.querySelector('#learnloop-overlay').shadowRoot.querySelector('button[data-id]').click()")
            await asyncio.sleep(1)
            await vid.evaluate("document.getElementById('v').play()")
            await asyncio.sleep(16)
            d = await db(); used1 = d['runtime'][d['activeChildId']]['balanceUsed']
            check('Playing video in the front tab is counted', 8 <= used1 <= 17, f'{used1:.1f}s after ~15s')
            check('Parent can see that it is counting', d.get('lastBeat', {}).get('reason') == 'counted', json.dumps(d.get('lastBeat')))
            # the report must update by itself while the parent page stays open
            await opt.bring_to_front(); await opt.click('#tabs button[data-v="report"]'); await asyncio.sleep(1)
            first = await opt.inner_text('.kpi b')
            await vid.bring_to_front(); await asyncio.sleep(12)
            await opt.bring_to_front(); await asyncio.sleep(6.5)
            second = await opt.inner_text('.kpi b')
            check('Open report updates by itself after more watching', first != '0:00' and second != first, f'{first} then {second}')
            await opt.click('#tabs button[data-v="now"]'); await asyncio.sleep(0.8)
            mon = await opt.inner_text('#monitor')
            share = await opt.evaluate("(() => { const a = [...document.querySelectorAll('.share a')].find(x => x.textContent.includes('LinkedIn')); return a ? a.href : ''; })()")
            check('Once set up and working, parents are invited to share on LinkedIn', share == 'https://www.linkedin.com/in/samlytics-data-service-487a7728a/' and 'Finish setting up' not in await opt.inner_text('#main'), share)
            check('Right now explains why it is or is not counting', 'Is it counting?' in mon and ('Not counting' in mon or 'Counting' in mon), mon)
            await vid.bring_to_front()
            d = await db(); used1 = d['runtime'][d['activeChildId']]['balanceUsed']
            # paused video does not count
            await vid.evaluate("document.getElementById('v').pause()"); await asyncio.sleep(11)
            d = await db(); used2 = d['runtime'][d['activeChildId']]['balanceUsed']
            check('Paused video is not counted', used2 - used1 < 5.5, f'+{used2 - used1:.1f}s while paused')
            # background tab does not count
            await vid.evaluate("document.getElementById('v').play()")
            other = await ctx.new_page(); await other.goto('about:blank'); await other.bring_to_front(); await asyncio.sleep(11)
            d = await db(); used3 = d['runtime'][d['activeChildId']]['balanceUsed']
            check('Video in a background tab is not counted', used3 - used2 < 5.5, f'+{used3 - used2:.1f}s while in background')
            await other.close(); await vid.bring_to_front()

            # ---- countdown and switch ----
            await vid.wait_for_function("() => { const o = document.querySelector('#learnloop-overlay'); return o && o.shadowRoot.querySelector('.ring'); }", timeout=90000)
            txt = await vid.evaluate("document.querySelector('#learnloop-overlay').shadowRoot.querySelector('.card').textContent")
            ov = await vid.evaluate("(() => { const r = document.querySelector('#learnloop-overlay').shadowRoot; const i = r.querySelector('.powered img'); return { text: r.querySelector('.powered').textContent, img: !!i && i.complete && i.naturalWidth > 0 }; })()")
            await vid.screenshot(path=str(ROOT / 'docs' / 'img' / 'countdown.png'))
            check('Countdown shows Powered by Samlytics Data Services with the logo', 'Powered by Samlytics Data Services' in ov['text'] and ov['img'], json.dumps(ov))
            check('Gentle countdown names the child, measured minutes and subject', "Well done, Joy" in txt and "1 minute" in txt and "Maths" in txt, txt[:90])
            await asyncio.sleep(11)
            await vid.wait_for_url(re.compile(r'learn\.html'), timeout=10000)
            check('Learning screen opens after the countdown', 'learn.html' in vid.url)
            d = await db(); rt = d['runtime']['c' if False else d['activeChildId']]
            check('Video address and position saved without extra tracking parameters', rt['saved'] and 'v=abc123' in rt['saved']['url'] and 'feature' not in rt['saved']['url'], json.dumps(rt['saved']))

            # ---- blocking during learning ----
            t2 = await ctx.new_page(); await t2.goto(VIDEO); await asyncio.sleep(1)
            check('Opening the video site during learning goes to learning instead', 'learn.html' in t2.url, t2.url)
            await t2.close(); await vid.bring_to_front()

            # ---- learning: one wrong answer, then four by themselves ----
            await vid.wait_for_selector('.prompt')
            lb = await vid.evaluate("(() => { const i = document.querySelector('.lbrand img'); return { img: !!i && i.complete && i.naturalWidth > 0, text: document.querySelector('.lhead').innerText }; })()")
            await vid.screenshot(path=str(ROOT / 'docs' / 'img' / 'learning.png'))
            check('Learning screen carries the logo and Powered by line', lb['img'] and 'Powered by Samlytics Data Services' in lb['text'], json.dumps(lb))
            note = await vid.inner_text('.lbody .note')
            check("Joy's questions come from her school year (Year 3) with a curriculum skill", note.startswith('Year 3 ·'), note)
            right = await current_answer(vid); wrong = await wrong_choice(vid, right)
            await click_choice(vid, wrong); await asyncio.sleep(0.4)
            fb = await vid.inner_text('.feedback')
            check('Wrong answer gets encouragement and a clue', fb.startswith('Not quite. Here is a clue'), fb)
            await click_choice(vid, right); await asyncio.sleep(1.8)
            stars = await vid.inner_text('.stars')
            check('Answer after a clue does not count as by themselves', stars.startswith('0 of 4'), stars)
            typed_done = False
            for i in range(12):
                if await vid.query_selector('#back'): break
                r = await current_answer(vid)
                if not typed_done and r.isdigit() and await vid.query_selector('#typedIn'):
                    await vid.fill('#typedIn', WORDS[int(r)] if int(r) <= 20 else r); await vid.click('#typedGo'); typed_done = True
                else: await click_choice(vid, r)
                await asyncio.sleep(1.8)
            await vid.wait_for_selector('#back', timeout=10000)
            endtxt = await vid.inner_text('.card')
            check('Four independent answers finish early', 'You did it!' in endtxt, endtxt.replace('\n', ' ')[:120])
            d = await db(); s = d['sessions'][-1]
            check('Session stored with independent and helped answers separated', s['reason'] == 'mastery' and s['ind'] == 4 and s['sup'] == 1 and s['incorrect'] == 1, json.dumps({k: s[k] for k in ('reason','ind','sup','incorrect','learningSec')}))
            check('Fresh allowance after learning', d['runtime'][d['activeChildId']]['balanceUsed'] == 0 and d['runtime'][d['activeChildId']]['state'] == 'entertainment')

            # ---- return to the video without auto-resume ----
            await vid.click('#back'); await vid.wait_for_url(re.compile(r'video\.html'), timeout=10000)
            check('Returns to the same video at the saved position', 'v=abc123' in vid.url and re.search(r't=\d+s', vid.url), vid.url)
            await asyncio.sleep(1.5)
            await vid.evaluate("document.getElementById('v').play()")  # YouTube would autoplay here
            await asyncio.sleep(2.5)
            paused = await vid.evaluate("document.getElementById('v').paused")
            check('Video does not resume until the child presses play', paused)
            await vid.evaluate("document.getElementById('v').play()"); await asyncio.sleep(1.5)
            check('Child can press play to carry on', not await vid.evaluate("document.getElementById('v').paused"))
            await vid.evaluate("document.getElementById('v').pause()")

            # ---- Sam: time limit with repeated wrong answers ----
            await opt.bring_to_front(); await opt.reload()
            await opt.fill('#pin', '1111'); await opt.click('#go'); await asyncio.sleep(1.5)
            check('Wrong PIN is refused', 'not right' in await opt.inner_text('#err'))
            await opt.fill('#pin', '2468'); await opt.click('#go'); await opt.wait_for_selector('#who', timeout=15000)
            await opt.click('#who button[data-k]:nth-child(2)'); await asyncio.sleep(1)
            d = await db(); check('Parent can choose who is using the laptop', d['children'][1]['id'] == d['activeChildId'])
            await vid.bring_to_front(); await vid.evaluate("document.getElementById('v').play()")
            await vid.wait_for_function("() => { const o = document.querySelector('#learnloop-overlay'); return o && o.shadowRoot.querySelector('#go') && o.shadowRoot.querySelector('.ring'); }", timeout=90000)
            await vid.evaluate("document.querySelector('#learnloop-overlay').shadowRoot.querySelector('#go').click()")
            await vid.wait_for_url(re.compile(r'learn\.html'), timeout=10000); await vid.wait_for_selector('.prompt')
            pics = await vid.evaluate("[...document.querySelectorAll('.choice')].every(b => b.classList.contains('pic') || /^\\d+$/.test(b.textContent))")
            check('Younger child gets big picture or number choices and no typing box', pics and not await vid.query_selector('#typedIn'))
            check('Younger child has a read-aloud button', await vid.query_selector('#spk') is not None)
            helped_msgs = []
            WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten']
            t_start = time.time()
            while time.time() - t_start < 90:
                if await vid.query_selector('.over .card'): break
                try:
                    right = await current_answer(vid)
                    vals = await vid.evaluate("[...document.querySelectorAll('.choice')].map(b => b.dataset.v)")
                    wrong = [v for v in vals if v != right]
                    if wrong: await click_choice(vid, wrong[0])
                    fb = await vid.inner_text('.feedback', timeout=1000)
                    if fb: helped_msgs.append(fb)
                except Exception: pass
                await asyncio.sleep(1.2)
            await vid.wait_for_selector('.over .card', timeout=30000)
            endtxt = await vid.inner_text('.card')
            check('Hard time limit ends the session even when every answer is wrong', 'Learning time is up' in endtxt, endtxt.replace('\n', ' ')[:140])
            check('Repeated difficulty gets a worked example', any("Let's look at it together" in m for m in helped_msgs) and any('That one was tricky' in m for m in helped_msgs), ' | '.join(dict.fromkeys(helped_msgs))[:400])
            d = await db(); s = d['sessions'][-1]
            check('Session ended at the 1 minute limit, with no time debt', s['reason'] == 'time_limit' and 58 <= s['learningSec'] <= 61 and s['ind'] == 0, f"{s['learningSec']}s, reason {s['reason']}")
            check('Skills needing practice are saved for next time', len(d['revision'][d['activeChildId']]['maths']) > 0, json.dumps(d['revision']))

            d = await db(); check('After the time limit the child can return to video', d['runtime'][d['activeChildId']]['state'] == 'entertainment')
            # ---- report ----
            await opt.bring_to_front(); await opt.click('#tabs button[data-v="report"]'); await asyncio.sleep(1)
            rep = await opt.inner_text('#main')
            check('Report shows the year each child is working at', 'Working at: Maths Year 3, English Year 3' in rep and 'Working at: Maths Reception' in rep)
            check('Report shows both children with measured video and learning', 'Joy' in rep and 'Sam' in rep and 'Measured video today' in rep and 'Active learning today' in rep and 'Finished early' in rep)
            await opt.screenshot(path=str(ROOT / 'docs' / 'img' / 'report.png'), full_page=True)

            # ---- weekly email ----
            await sw.evaluate("withDb(db => { db.createdAt = Date.now() - 20 * 86400000; })")
            await opt.click('#tabs button[data-v="weekly"]'); await asyncio.sleep(0.8)
            await opt.fill('#wEmail', 'parent@'); await opt.click('#wSave'); await asyncio.sleep(0.5)
            check('A wrong email address is refused', 'does not look right' in await opt.inner_text('#wMsg'))
            await opt.fill('#wEmail', 'parent@example.com')
            await opt.select_option('#wDay', str((time.localtime().tm_wday + 1) % 7)); await opt.select_option('#wOn', '1')
            await opt.click('#wSave'); await asyncio.sleep(2.5)
            d = await db()
            check('Parent email and report day are saved', d['weekly']['email'] == 'parent@example.com' and d['weekly']['enabled'] is True)
            check('Weekly report is prepared on the report day', len(d.get('outbox', [])) == 1 and d['outbox'][0]['status'] == 'ready', json.dumps(d.get('outbox')))
            notes = await sw.evaluate("new Promise(r => chrome.notifications.getAll(r))")
            check('Parent gets a notification that the report is ready', any(k.startswith('weekly-') for k in (notes or {})), json.dumps(notes))
            await sw.evaluate("checkWeekly()"); await asyncio.sleep(0.5)
            d = await db(); check('The same week is never prepared twice', len(d['outbox']) == 1)
            prev = await opt.inner_text('#wText')
            check('Weekly text shows both children with measured totals', 'Joy' in prev and 'Sam' in prev and 'Measured video' in prev and 'Answers by themselves' in prev, prev[:160])
            await opt.evaluate("HTMLAnchorElement.prototype.click = function () { window.__lastHref = this.href; }")
            await opt.click('[data-send]'); await asyncio.sleep(1.2)
            href = await opt.evaluate("window.__lastHref || ''")
            check('Send opens an email to the parent with the report filled in', href.startswith('mailto:parent%40example.com?subject=LearnLoop%20weekly%20report') and 'Joy' in href and 'youtube' not in href.lower() and 'video.html' not in href, href[:110])
            d = await db(); check('Sent report is marked as sent', d['outbox'][0]['status'] == 'sent')

            # ---- a YouTube tab opened before LearnLoop was installed (no script yet) ----
            await vid.goto('http://127.0.0.1:8765/video.html?v=old'); await vid.bring_to_front()
            await vid.evaluate("document.getElementById('v').play()")
            d = await db(); before = d['runtime'][d['activeChildId']]['balanceUsed']; await asyncio.sleep(11)
            d = await db(); mid = d['runtime'][d['activeChildId']]['balanceUsed']
            check('Version 0.1 problem reproduced: a tab opened before install was not counted', mid - before < 1, f'+{mid - before:.1f}s')
            await sw.evaluate("injectIntoOpenTabs()"); await asyncio.sleep(13)
            d = await db(); after = d['runtime'][d['activeChildId']]['balanceUsed']
            check('Fix: LearnLoop adds its script to tabs already open, so they are counted', after - mid >= 5, f'+{after - mid:.1f}s after the fix; last check: {json.dumps(d.get("lastBeat"))}; state {d["runtime"][d["activeChildId"]]["state"]}')
            await vid.evaluate("document.getElementById('v').pause()")

            # ---- faster playback: real time is counted, and the report shows how far the video moved on ----
            await vid.goto('http://localhost:8765/video.html?v=speed&file=1'); await vid.bring_to_front(); await asyncio.sleep(1.5)
            d = await db(); cid = d['activeChildId']; dk = time.strftime('%Y-%m-%d')
            r0 = d['activity'][cid][dk]; w0, c0 = r0['watchedSec'], r0.get('contentSec', 0)
            await vid.evaluate("(() => { const v = document.getElementById('v'); v.muted = true; v.playbackRate = 2; return v.play(); })()")
            await asyncio.sleep(16)
            await vid.evaluate("document.getElementById('v').pause()"); await asyncio.sleep(6)
            d = await db(); r1 = d['activity'][cid][dk]; dw, dc = r1['watchedSec'] - w0, r1.get('contentSec', 0) - c0
            check('At double speed, real time is counted and the video moves on about twice as far', dw >= 8 and 1.6 <= dc / max(dw, 1) <= 2.4, f'counted {dw:.1f}s, video moved {dc:.1f}s')
            await opt.bring_to_front(); await opt.click('#tabs button[data-v="report"]'); await asyncio.sleep(1)
            await opt.evaluate("document.querySelectorAll('details.breakdown').forEach(d => d.open = true)")
            bd = await opt.inner_text('#main')
            check('Report explains where the video time went', 'How far the videos moved on' in bd and 'Counted as watching' in bd, bd[bd.find('Where today'):bd.find('Where today') + 200])
            await opt.screenshot(path=str(ROOT / 'docs' / 'img' / 'report.png'), full_page=True)

            # ---- version 1.1: a Year 6 child with Reasoning, extra practice and beat your own best ----
            await opt.click('#tabs button[data-v="kids"]'); await opt.wait_for_selector('.kidform'); await opt.click('#add'); await asyncio.sleep(0.3)
            await opt.fill('[data-i="2"][data-k="name"]', 'Ada'); await opt.locator('[data-i="2"][data-k="name"]').dispatch_event('change')
            await pick_birthday(2, '1', '2', '2016'); await asyncio.sleep(0.3)
            note = await opt.inner_text('.kidform:nth-of-type(3)') if await opt.query_selector('.kidform:nth-of-type(3)') else await opt.inner_text('#main')
            stages = await opt.evaluate("[...document.querySelectorAll('[data-i=\"2\"][data-stage]')].map(s => s.value)")
            check('A child born in February 2016 starts at Year 6 in every subject, Reasoning included', stages == ['Y6', 'Y6', 'Y6'] and 'Year 3' not in note.split('Age 10')[-1][:80], json.dumps(stages))
            await opt.check('[data-i="2"][data-s="reasoning"]'); await asyncio.sleep(0.2)
            await opt.click('#save'); await asyncio.sleep(1)
            d = await db(); ada = d['children'][2]
            check('Reasoning can be switched on for a child', ada['subjects']['reasoning'] is True and ada['rules'].get('practiceMax') == 15, json.dumps(ada['subjects']))
            await opt.click('#tabs button[data-v="now"]'); await opt.wait_for_selector('#who', timeout=10000)
            await opt.click('#who button[data-k]:nth-child(3)'); await asyncio.sleep(1)
            d = await db(); before_rt = json.dumps(d['runtime'].get('c' if False else d['activeChildId'], {}), sort_keys=True)
            pop = await ctx.new_page(); await pop.goto(f'chrome-extension://{ext_id}/popup.html'); await asyncio.sleep(1)
            check('Toolbar button offers practice once a child is chosen', await pop.is_visible('#practise'), await pop.inner_text('body'))
            await pop.close()
            pr = await ctx.new_page(); pr.on('pageerror', lambda e: errors.append('practice: ' + str(e)))
            await pr.goto(f'chrome-extension://{ext_id}/learn.html?practice=1'); await pr.wait_for_selector('[data-sub]')
            subs = await pr.evaluate("[...document.querySelectorAll('[data-sub]')].map(b => b.dataset.sub)")
            check('Practice offers every subject switched on for the child', subs == ['maths', 'english', 'reasoning'], json.dumps(subs))
            await pr.check('#challenge'); await pr.click('[data-sub="reasoning"]'); await pr.wait_for_selector('.prompt')
            head = await pr.inner_text('.lhead h2')
            check('Beat your own best round starts in Reasoning', 'Reasoning: beat your best with Ada' in head, head)
            seen_svg, shot, notes = 0, False, set()
            for i in range(10):
                await pr.wait_for_selector('.prompt'); await asyncio.sleep(0.3)
                notes.add((await pr.inner_text('.lbody .note')).split(' · ')[0])
                info = await pr.evaluate("(() => { const s = [...document.querySelectorAll('.choice svg, .svgbox svg')]; return { n: s.length, ok: s.every(x => { const b = x.getBoundingClientRect(); return b.width > 20 && b.height > 20; }) }; })()")
                if info['n']:
                    seen_svg += 1
                    if not info['ok']: errors.append('an SVG drawing has no size')
                    if not shot and await pr.query_selector('.choice.svgc'):
                        await pr.screenshot(path=str(ROOT / 'docs' / 'img' / 'reasoning.png')); shot = True
                right = await current_answer(pr); await click_choice(pr, right); await asyncio.sleep(1.6)
            await pr.wait_for_selector('.over .card', timeout=10000); endtxt = await pr.inner_text('.card')
            check('Reasoning questions come from Year 6', notes == {'Year 6'}, json.dumps(sorted(notes)))
            check('Shape puzzles are drawn and visible', seen_svg >= 1, f'{seen_svg} of 10 questions had drawings')
            check('A full round of 10 sets the first personal best', 'Your first best!' in endtxt and '10 of 10' in endtxt, endtxt.replace('\n', ' ')[:140])
            d = await db()
            check('Personal best stored for that child and subject only', d['best'][d['activeChildId']]['reasoning']['score'] == 10 and list(d['best'][d['activeChildId']].keys()) == ['reasoning'], json.dumps(d.get('best')))
            check('Practice did not change video time or the watching state', json.dumps(d['runtime'].get(d['activeChildId'], {}), sort_keys=True) == before_rt)
            check('Practice is recorded as practice the child chose', d['sessions'][-1]['reason'] == 'challenge' and d['sessions'][-1]['practice'] is True and d['sessions'][-1]['ind'] == 10)
            # a second round stopped early never counts as a best
            await pr.click('#again'); await pr.wait_for_selector('[data-sub]'); await pr.check('#challenge'); await pr.click('[data-sub="reasoning"]'); await pr.wait_for_selector('.prompt')
            right = await current_answer(pr); await click_choice(pr, right); await asyncio.sleep(1.6)
            await pr.click('[data-a="done"]'); await pr.wait_for_selector('.over .card'); endtxt = await pr.inner_text('.card')
            check('Stopping a round early does not set a best', 'Finish all 10 questions next time' in endtxt and 'best' not in endtxt.split('\n')[0].lower(), endtxt.replace('\n', ' ')[:140])
            # free practice in Year 6 Maths with a typed answer that uses a comma
            await pr.click('#again'); await pr.wait_for_selector('[data-sub]'); await pr.click('[data-sub="maths"]'); await pr.wait_for_selector('.prompt')
            note = await pr.inner_text('.lbody .note')
            check('Year 6 Maths questions are used for a Year 6 child', note.startswith('Year 6 ·'), note)
            for i in range(12):
                right = await current_answer(pr)
                if await pr.query_selector('#typedIn') and re.fullmatch(r'\d{4,}', right or ''):
                    typed = f'{int(right):,}'; await pr.fill('#typedIn', typed); await pr.click('#typedGo'); await asyncio.sleep(0.4)
                    fb = await pr.inner_text('.feedback')
                    check('A large typed answer with a comma is accepted', any(w in fb for w in ('Brilliant', 'You got it', 'Spot on', 'Well done', 'Super thinking')), f'typed {typed}: {fb}')
                    break
                await click_choice(pr, right); await asyncio.sleep(1.6)
            await pr.close()
            await opt.bring_to_front(); await opt.click('#tabs button[data-v="report"]'); await asyncio.sleep(1)
            rep = await opt.inner_text('#main')
            check('Report shows Reasoning, extra practice and the own best', 'Reasoning (11+) Year 6' in rep and 'Beat your own best' in rep and 'Own best (10-question rounds): Reasoning (11+) 10 of 10' in rep, rep[rep.find('Ada'):rep.find('Ada') + 300].replace('\n', ' '))
            check('No script errors in any page', not errors, '; '.join(errors)[:300])
            await ctx.close()
    finally:
        srv.terminate()
    passed = sum(1 for r in RESULTS if r[1])
    print(f'\n{passed} of {len(RESULTS)} checks passed')
    (ROOT / 'tests' / 'e2e' / 'last-run.json').write_text(json.dumps([{'check': n, 'passed': ok, 'detail': dt} for n, ok, dt in RESULTS], indent=1))
    sys.exit(0 if passed == len(RESULTS) else 1)

asyncio.run(main())
