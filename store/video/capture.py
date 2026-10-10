"""Captures real LearnLoop screens for the guide video, using synthetic profiles only.
Run from the repo root: python3 store/video/capture.py   (writes store/video/frames/*.png at 1280 x 720)"""
import asyncio, json, pathlib, shutil, subprocess, sys, tempfile
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]; OUT = ROOT / 'store' / 'video' / 'frames'

def build():
    d = pathlib.Path(tempfile.mkdtemp()) / 'ext'; shutil.copytree(ROOT / 'extension', d)
    m = json.loads((d / 'manifest.json').read_text())
    m['host_permissions'] += ['http://localhost/*']; m['content_scripts'][0]['matches'].append('http://localhost/*'); m['web_accessible_resources'][0]['matches'].append('http://localhost/*')
    (d / 'manifest.json').write_text(json.dumps(m))
    bg = (d / 'background.js').read_text().replace("const SITE_DOMAINS = ['youtube.com'];", "const SITE_DOMAINS = ['youtube.com', 'localhost'];").replace("const SITE_PATTERNS = ['*://*.youtube.com/*'];", "const SITE_PATTERNS = ['*://*.youtube.com/*', 'http://localhost/*'];")
    (d / 'background.js').write_text(bg)
    lj = (d / 'learn.js').read_text(); a = "  if (PRACTICE) { await startPractice(); return; }"
    (d / 'learn.js').write_text(lj.replace(a, "  window.__llAnswer = () => (session && session.current) ? String(session.current.answer) : null;\n" + a))
    return d

async def main():
    OUT.mkdir(parents=True, exist_ok=True); ext = build()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8767', '--bind', '127.0.0.1'], cwd=ROOT / 'store' / 'video', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        async with async_playwright() as p:
            ctx = await p.chromium.launch_persistent_context(tempfile.mkdtemp(), headless=True, channel='chromium', viewport={'width': 1280, 'height': 720}, device_scale_factor=1,
                args=[f'--disable-extensions-except={ext}', f'--load-extension={ext}'])
            sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
            await asyncio.sleep(1.5)
            opt = next(pg for pg in ctx.pages if 'options.html' in pg.url)
            shot = lambda pg, n: pg.screenshot(path=str(OUT / f'{n}.png'))
            await opt.wait_for_selector('#p1'); await opt.fill('#p1', '2468'); await opt.fill('#p2', '2468'); await shot(opt, '01-pin')
            await opt.click('#go'); await opt.wait_for_selector('#code', timeout=60000); await asyncio.sleep(0.3); await shot(opt, '02-recovery')
            await opt.check('#saved'); await opt.click('#go'); await opt.wait_for_selector('.kidform')
            await opt.fill('[data-i="0"][data-k="name"]', 'Joy'); await opt.locator('[data-i="0"][data-k="name"]').dispatch_event('change')
            for k, v in (('d', '14'), ('m', '3'), ('y', '2019')): await opt.select_option(f'[data-i="0"][data-b="{k}"]', v); await asyncio.sleep(0.2)
            await opt.click('[data-i="0"][data-p="5,10"]'); await asyncio.sleep(0.3)
            await opt.evaluate("window.scrollTo(0, 0)"); await shot(opt, '03-child')
            for k, v in (('ent', '1'), ('min', '0')): await opt.fill(f'[data-i="0"][data-r="{k}"]', v); await opt.locator(f'[data-i="0"][data-r="{k}"]').dispatch_event('change')
            await opt.click('#save'); await opt.wait_for_selector('#who'); await asyncio.sleep(0.5)
            vid = await ctx.new_page(); await vid.goto('http://localhost:8767/demo-video.html?v=cartoon1')
            await vid.wait_for_selector('#learnloop-overlay', state='attached', timeout=15000); await asyncio.sleep(1); await shot(vid, '04-who')
            await vid.evaluate("document.querySelector('#learnloop-overlay').shadowRoot.querySelector('button[data-id]').click()"); await asyncio.sleep(0.8)
            await vid.evaluate("document.getElementById('v').play()"); await asyncio.sleep(3); await shot(vid, '05-watching')
            await vid.wait_for_function("() => { const o = document.querySelector('#learnloop-overlay'); return o && o.shadowRoot.querySelector('.ring'); }", timeout=120000)
            await asyncio.sleep(2); await shot(vid, '06-countdown')
            await vid.evaluate("document.querySelector('#learnloop-overlay').shadowRoot.querySelector('#go').click()")
            await vid.wait_for_url('**/learn.html', timeout=15000); await vid.wait_for_selector('.prompt'); await asyncio.sleep(1); await shot(vid, '07-question')
            await vid.click('[data-a="help"]'); await asyncio.sleep(0.6); await shot(vid, '08-help')
            for i in range(10):
                if await vid.query_selector('.over .card'): break
                r = await vid.evaluate("window.__llAnswer()")
                if r is None: break
                await vid.evaluate("(v) => { const b = [...document.querySelectorAll('.choice')].find(b => b.dataset.v === v); if (b) b.click(); else { const t = document.getElementById('typedIn'); t.value = v; document.getElementById('typedGo').click(); } }", r)
                if i == 1: await asyncio.sleep(0.4); await shot(vid, '09-right')
                await asyncio.sleep(1.7)
            await vid.wait_for_selector('.over .card', timeout=20000); await asyncio.sleep(0.5); await shot(vid, '10-done')
            await vid.click('#back'); await vid.wait_for_selector('#v'); await asyncio.sleep(2)
            await vid.evaluate("document.getElementById('v').play()"); await asyncio.sleep(2.5); await shot(vid, '11-back')
            await opt.bring_to_front(); await opt.click('#tabs button[data-v="report"]'); await asyncio.sleep(1.2); await shot(opt, '12-report')
            await opt.click('#tabs button[data-v="kids"]'); await opt.wait_for_selector('.kidform')
            await opt.evaluate("document.querySelector('details.topics').open = true")
            await opt.fill('[data-i="0"][data-sp]', 'because, friend, Monday, enough'); await opt.locator('[data-i="0"][data-sp]').dispatch_event('change'); await asyncio.sleep(0.5)
            await opt.evaluate("document.querySelector('details.topics').scrollIntoView()"); await asyncio.sleep(0.3); await shot(opt, '13-topics')
            await ctx.close()
    finally:
        srv.terminate()
    print('frames:', sorted(f.name for f in OUT.glob('*.png')))

asyncio.run(main())
