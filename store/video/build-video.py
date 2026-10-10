"""Builds the LearnLoop guide video (1920 x 1080, about 80 seconds, no sound) from the frames captured by capture.py,
plus the YouTube thumbnail. Run from the repo root: python3 store/video/build-video.py"""
import asyncio, pathlib, subprocess, tempfile, shutil
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]; V = ROOT / 'store' / 'video'; F = V / 'frames'
FONT = (ROOT / 'extension' / 'fonts').as_uri(); ICON = (ROOT / 'brand' / 'learnloop-icon' / 'learnloop-512.png').as_uri()
# (frame, step label, caption, seconds). None as frame = a text card.
SCENES = [
  ('title', None, None, 5),
  ('card:Add LearnLoop to Chrome|Free from the Chrome Web Store. No account, no adverts, nothing to pay.', '1', None, 4.5),
  ('01-pin', '2', 'Choose a parent PIN. It keeps the settings for grown-ups.', 4.5),
  ('02-recovery', '2', 'Write down your recovery code, in case you forget the PIN.', 4.5),
  ('03-child', '3', 'Add your child. Their date of birth sets the starting school year. Pick the video and learning times.', 6.5),
  ('04-who', '4', 'On YouTube, your child taps their name.', 4.5),
  ('05-watching', '4', 'LearnLoop counts real watching only: a video playing in the front tab.', 5),
  ('06-countdown', '5', 'When the time is up, a gentle countdown. Then the video pauses and keeps its place.', 6),
  ('07-question', '6', 'A short learning session that follows the national curriculum in England.', 5.5),
  ('08-help', '6', 'Stuck? "Help me" gives a clue. Wrong answers are never punished.', 5.5),
  ('09-right', '6', 'Answers given by themselves fill the stars.', 4.5),
  ('10-done', '6', 'Enough answers by themselves, and they can go back early. Sessions always end on time.', 6),
  ('11-back', '7', 'Back to the same video, at the same point. It waits until your child presses play.', 6),
  ('12-report', '8', 'See real progress: measured video time, learning time and answers.', 5.5),
  ('13-topics', '8', 'Focus on topics, skip others, and add this week\'s school spellings.', 5.5),
  ('end', None, None, 6.5),
]
CSS = f"""@font-face{{font-family:M;font-weight:600;src:url('{FONT}/montserrat-latin-500-normal.woff2')}}
@font-face{{font-family:M;font-weight:700;src:url('{FONT}/montserrat-latin-700-normal.woff2')}}
@font-face{{font-family:M;font-weight:800;src:url('{FONT}/montserrat-latin-800-normal.woff2')}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:M,sans-serif;background:#FEFFF8;color:#00212B}}"""
def page(frame, step, cap):
    if frame == 'title':
        return f"""<style>{CSS} body{{background:#00212B;color:#FEFFF8;display:grid;place-items:center;text-align:center}}
        img{{width:260px}} h1{{font-weight:800;font-size:120px;margin:30px 0 10px}} p{{font-weight:700;font-size:48px;margin:0;color:#DCFF38}} .s{{font-size:30px;color:#A9BDC4;margin-top:40px}}</style>
        <div><img src="{ICON}"><h1>LearnLoop</h1><p>Watch, then learn, then watch again</p><p class="s">How to set it up in five minutes · Powered by Samlytics Data Services</p></div>"""
    if frame == 'end':
        return f"""<style>{CSS} body{{background:#00212B;color:#FEFFF8;display:grid;place-items:center;text-align:center}}
        img{{width:200px}} h1{{font-weight:800;font-size:84px;margin:24px 0}} p{{font-weight:700;font-size:40px;margin:10px 0}} .l{{color:#DCFF38}} .s{{font-size:28px;color:#A9BDC4;margin-top:36px}}</style>
        <div><img src="{ICON}"><h1>Free · Private · Open source</h1><p>Everything stays on your laptop.</p>
        <p class="l">samsonoluwaseun.github.io/LearnLoop</p><p class="s">Made by a parent, for parents · Powered by Samlytics Data Services</p></div>"""
    if frame.startswith('card:'):
        head, sub = frame[5:].split('|')
        return f"""<style>{CSS} body{{display:grid;place-items:center;text-align:center}} .n{{display:inline-grid;place-items:center;width:110px;height:110px;border-radius:50%;background:#4392F1;color:#fff;font-weight:800;font-size:60px}}
        h1{{font-weight:800;font-size:90px;margin:36px 0 18px}} p{{font-weight:600;font-size:42px;margin:0;color:#3E5862}}</style><div><span class="n">{step}</span><h1>{head}</h1><p>{sub}</p></div>"""
    shot = (F / f'{frame}.png').as_uri()
    return f"""<style>{CSS} .shot{{position:absolute;left:220px;top:48px;width:1480px;height:832.5px;border-radius:22px;box-shadow:0 24px 60px rgb(0 33 43/.22);border:2px solid #D6E3F5}}
    .bar{{position:absolute;left:0;right:0;bottom:0;height:170px;display:flex;align-items:center;gap:30px;padding:0 120px;background:#00212B;color:#FEFFF8}}
    .n{{flex:0 0 84px;height:84px;border-radius:50%;background:#DCFF38;color:#00212B;display:grid;place-items:center;font-weight:800;font-size:46px}}
    .c{{font-weight:700;font-size:42px;line-height:1.25}} .logo{{position:absolute;right:40px;top:40px;width:0}}</style>
    <img class="shot" src="{shot}"><div class="bar"><span class="n">{step}</span><span class="c">{cap}</span></div>"""

async def main():
    tmp = pathlib.Path(tempfile.mkdtemp()); clips = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        for i, (frame, step, cap, sec) in enumerate(SCENES):
            html = tmp / f's{i:02d}.html'; html.write_text('<!doctype html><meta charset="utf-8">' + page(frame, step, cap))
            await pg.goto(html.as_uri()); await pg.wait_for_timeout(250)
            png = tmp / f's{i:02d}.png'; await pg.screenshot(path=str(png))
            if i == 0: shutil.copy(png, V / 'title-frame.png')
            clip = tmp / f'c{i:02d}.mp4'
            # each scene fades in and out over 0.35 s, so the joins look smooth
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-t', str(sec), '-i', str(png),
                '-vf', f'fade=t=in:st=0:d=0.35:color=0xFEFFF8,fade=t=out:st={sec - 0.35}:d=0.35:color=0xFEFFF8,format=yuv420p',
                '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', str(clip)], check=True)
            clips.append(clip)
        # thumbnail for YouTube (1280 x 720)
        thumb = tmp / 'thumb.html'
        thumb.write_text(f"""<!doctype html><meta charset="utf-8"><style>{CSS} html,body{{width:1280px;height:720px;background:#00212B;color:#FEFFF8}}
        .t{{position:absolute;left:70px;top:150px;width:640px}} h1{{font-weight:800;font-size:96px;margin:0 0 20px;line-height:1}} p{{font-weight:800;font-size:44px;margin:0;color:#DCFF38;line-height:1.2}}
        .shot{{position:absolute;right:-60px;top:110px;width:640px;border-radius:18px;border:4px solid #4392F1;transform:rotate(3deg)}} .i{{position:absolute;left:70px;top:50px;width:84px}}
        .s{{position:absolute;left:70px;bottom:50px;font-weight:700;font-size:26px;color:#A9BDC4}}</style>
        <img class="i" src="{ICON}"><div class="t"><h1>LearnLoop</h1><p>Turn YouTube time into learning time</p></div>
        <img class="shot" src="{(F / '06-countdown.png').as_uri()}"><div class="s">Free Chrome extension · Set up in 5 minutes</div>""")
        await pg.set_viewport_size({'width': 1280, 'height': 720}); await pg.goto(thumb.as_uri()); await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(V / 'youtube-thumbnail.png')); await b.close()
    lst = tmp / 'list.txt'; lst.write_text(''.join(f"file '{c}'\n" for c in clips))
    out = V / 'LearnLoop-setup-guide.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', '-movflags', '+faststart', str(out)], check=True)
    print(out, round(sum(s[3] for s in SCENES), 1), 'seconds')

asyncio.run(main())
