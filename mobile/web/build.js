// Assembles the web part of the phone app from the shared extension files plus the phone-only files here.
// Usage: node mobile/web/build.js <output folder>   (writes <output>/www)
// The Android build runs this, so the phone app always uses the same question bank, tutoring engine and rules as the extension.
const fs = require('fs'), path = require('path');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'build')), www = path.join(out, 'www');
const ext = path.join(__dirname, '..', '..', 'extension');
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(www, { recursive: true });
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
const SHARED = ['curriculum.js', 'curriculum-ks2.js', 'reasoning.js', 'engine.js', 'core.js', 'learn.js', 'ui.css'];
for (const f of SHARED) copy(path.join(ext, f), path.join(www, f));
for (const dir of ['fonts', 'brand']) for (const f of fs.readdirSync(path.join(ext, dir))) copy(path.join(ext, dir, f), path.join(www, dir, f));
for (const f of ['app.html', 'app.js', 'app.css', 'store.js', 'shim.js']) copy(path.join(__dirname, f), path.join(www, f));
// learn.html: the same page, with the shared rules, the phone storage and the shim loaded before learn.js
const learn = fs.readFileSync(path.join(ext, 'learn.html'), 'utf8');
const anchor = '<script src="learn.js"></script>';
if (!learn.includes(anchor)) throw new Error('learn.html changed: cannot find the learn.js script tag');
fs.writeFileSync(path.join(www, 'learn.html'), learn.replace(anchor, '<script src="core.js"></script>\n<script src="store.js"></script>\n<script src="shim.js"></script>\n' + anchor)
  .replace('<meta name="viewport" content="width=device-width,initial-scale=1">', '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'));
const n = fs.readdirSync(www).length;
console.log(`phone web files written to ${www} (${n} entries)`);
