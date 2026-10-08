// Checks every skill in the question bank, Reception to Year 6 and Reasoning, at every level, across many random seeds.
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../extension/engine.js');
const CUR = require('../extension/curriculum.js');

const SEEDS = 150;
const ids = Object.keys(CUR.SKILLS);
const each = (id, fn) => { for (let lv = 1; lv <= 3; lv++) for (let seed = 1; seed <= SEEDS; seed++) fn(E.makeQuestion(id, E.rng(seed * 7919 + lv), lv), lv, seed); };

test('the bank covers Reception to Year 6 in Maths and English, and Years 4 to 6 in Reasoning', () => {
  for (const y of CUR.YEARS) { assert.ok(CUR.skillsIn('maths', y).length >= 4, `maths ${y}`); assert.ok(CUR.skillsIn('english', y).length >= 4, `english ${y}`); }
  for (const y of ['Y4', 'Y5', 'Y6']) assert.ok(CUR.skillsIn('reasoning', y).length >= 4, `reasoning ${y}`);
  for (const y of ['R', 'Y1', 'Y2', 'Y3']) assert.equal(CUR.skillsIn('reasoning', y).length, 0);
  for (const id of ids) { const s = CUR.SKILLS[id]; assert.ok(['maths', 'english', 'reasoning'].includes(s.subject), id); assert.ok(CUR.YEARS.includes(s.year), id); assert.ok(s.label && s.nc, id); }
});

test('every question has exactly one right answer, distinct options, a clue and a worked example', () => {
  for (const id of ids) each(id, (q, lv) => {
    const where = `${id} level ${lv} ${q.variant}`;
    const vals = q.choices.map(c => String(c.value));
    assert.ok(q.choices.length >= 2, `${where}: too few options`);
    assert.equal(new Set(vals).size, vals.length, `${where}: two options are the same`);
    if (!q.choices.some(c => c.svg)) assert.equal(new Set(q.choices.map(c => String(c.label))).size, vals.length, `${where}: two labels are the same`);
    assert.equal(q.choices.filter(c => c.value === q.answer).length, 1, `${where}: the answer must be exactly one option`);
    assert.ok(q.prompt && q.hint && q.worked, `${where}: prompt, clue and worked example`);
    assert.equal(E.grade(q, q.answer).status, 'correct', `${where}: the answer grades as correct`);
    assert.doesNotMatch(JSON.stringify(q), /undefined|NaN/, `${where}: no undefined or NaN`);
    if (q.response === 'choice-or-type' && typeof q.answer === 'number') assert.equal(E.grade(q, String(q.answer)).status, 'correct', `${where}: typed answer`);
    for (const c of q.choices) if (c.svg) assert.ok(c.svg.startsWith('<svg') && c.svg.endsWith('</svg>') && c.alt, `${where}: picture option`);
    if (q.visual && q.visual.kind === 'svg') assert.ok(q.visual.svg.startsWith('<svg') && q.visual.svg.endsWith('</svg>'), `${where}: drawing`);
  });
});

test('typed numbers accept commas and minus signs, and unclear input is not marked wrong', () => {
  const q = { grading: 'number-exact', answer: 13748 };
  assert.equal(E.grade(q, '13,748').status, 'correct'); assert.equal(E.grade(q, '13748').status, 'correct'); assert.equal(E.grade(q, '13,749').status, 'incorrect');
  assert.equal(E.grade({ grading: 'number-exact', answer: -4 }, '−4').status, 'correct');
  assert.equal(E.grade(q, 'thirteen thousand').status, 'unrecognised');
});

// ---- shape puzzles: prove the rule picks out exactly one option ----
const parse = (key) => key.split(' ').map(p => p.split(',').map(Number));
const keyOf = (pts) => pts.map(([x, y]) => `${Math.round(x * 100) / 100 + 0},${Math.round(y * 100) / 100 + 0}`).sort().join(' ');
const turns = (key) => { const p = parse(key); return [p.map(([x, y]) => [x, y]), p.map(([x, y]) => [-y, x]), p.map(([x, y]) => [-x, -y]), p.map(([x, y]) => [y, -x])].map(keyOf); };
const flip = (key) => keyOf(parse(key).map(([x, y]) => [-x, y]));

test('turning shapes: only the answer can be made by turning the shape', () => {
  each('nvr-rotation', (q) => {
    const reach = new Set(turns(q.rotation.base));
    const fits = q.choices.filter(c => reach.has(c.key));
    assert.equal(fits.length, 1, q.variant); assert.equal(fits[0].value, q.answer);
    assert.notEqual(q.answer, q.rotation.base, 'the answer is actually turned');
  });
});

test('mirror images: only the answer is the reflection in the mirror line', () => {
  each('nvr-reflection', (q) => {
    const want = flip(q.reflection.shown);
    assert.equal(q.answer, want);
    assert.equal(q.choices.filter(c => c.key === want).length, 1);
  });
});

test('odd shape out (flipped): three options are turns of each other and the answer is the only flip', () => {
  each('nvr-odd-one-out', (q, lv) => {
    if (lv !== 3) return;
    const sameAs = (a) => q.choices.filter(b => b !== a && turns(a.key).includes(b.key)).length;
    for (const c of q.choices) assert.equal(sameAs(c), c.value === q.answer ? 0 : 2, q.variant);
  });
});

test('odd shape out (sides and dots): only the answer breaks the rule', () => {
  each('nvr-odd-one-out', (q, lv) => {
    if (lv === 3) return;
    const parts = q.choices.map(c => { const [shape, , dots] = c.key.split(':'); return { v: c.value, sides: +shape.replace('poly', ''), dots: +dots }; });
    const breaks = lv === 1
      ? parts.filter(p => parts.filter(o => o.sides === p.sides).length === 1)
      : parts.filter(p => p.dots !== p.sides - 2);
    assert.equal(breaks.length, 1, q.variant); assert.equal(breaks[0].v, q.answer);
  });
});

test('shape grids: the answer completes the rows and columns, and level 3 is a Latin square', () => {
  each('nvr-matrix', (q, lv) => {
    const n = lv === 1 ? 2 : 3; const g = q.grid.map(k => k.split(':'));
    assert.equal(q.grid[n * n - 1], q.answer);
    for (let i = 0; i < n; i++) assert.equal(new Set(g.slice(i * n, i * n + n).map(x => x[0])).size, 1, 'each row is one shape');
    if (lv === 3) for (let i = 0; i < n; i++) {
      assert.equal(new Set(g.slice(i * n, i * n + n).map(x => x[1])).size, n, 'each colour once per row');
      assert.equal(new Set([0, 1, 2].map(r => g[r * n + i][1])).size, n, 'each colour once per column');
    } else for (let j = 0; j < n; j++) assert.equal(new Set(Array.from({ length: n }, (_, r) => g[r * n + j][1])).size, 1, 'each column is one colour');
  });
});

test('shape analogies never combine two turns', () => {
  each('nvr-analogy', (q) => { assert.ok(q.transforms.filter(t => t.startsWith('turn')).length <= 1, q.variant); });
});

// ---- word puzzles checked by code ----
test('hidden words run across two words and are not one of the words', () => {
  each('hidden-words', (q) => {
    const words = q.visual.text.toLowerCase().replace(/[^a-z ]/g, '').split(' ');
    assert.ok(!words.includes(q.answer), `${q.answer} must not be a whole word`);
    assert.ok(!words.some(w => w.includes(q.answer)), `${q.answer} must not sit inside one word`);
    assert.ok(words.join('').includes(q.answer), `${q.answer} is hidden`);
    for (const c of q.choices) if (c.value !== q.answer) assert.ok(!words.join('').includes(c.value), `${c.value} must not also be hidden`);
  });
});

test('balance-the-sum answers make both sides equal', () => {
  const val = (s) => Function(`return (${s.replace(/×/g, '*').replace(/−/g, '-').replace(/÷/g, '/')})`)();
  each('complete-the-sum', (q) => { const [l, r] = q.prompt.split(' = '); assert.equal(val(l), val(r.replace('?', q.answer))); });
});

test('letter sums have one letter that fits', () => {
  each('letter-sums', (q, lv) => {
    if (lv === 1) return;
    const map = Object.fromEntries(q.visual.text.split(', ').map(p => p.split(' = ')).map(([k, v]) => [k, +v]));
    const expr = q.prompt.match(/What is (.+)\? Give/)[1];
    const v = Function(`return (${expr.replace(/[A-E]/g, k => map[k]).replace(/×/g, '*').replace(/−/g, '-').replace(/÷/g, '/')})`)();
    assert.deepEqual(Object.keys(map).filter(k => map[k] === v), [q.answer]);
  });
});

test('letter codes move every letter the same way', () => {
  each('letter-codes', (q) => {
    const [, w1, c1, w2] = q.prompt.match(/If (\w+) is written as (\w+), how is (\w+) written/);
    const mirror = c1 === w1.split('').map(ch => String.fromCharCode(155 - ch.charCodeAt(0))).join('');
    const k = c1.charCodeAt(0) - w1.charCodeAt(0);
    const enc = (w) => w.split('').map(ch => String.fromCharCode(mirror ? 155 - ch.charCodeAt(0) : ch.charCodeAt(0) + k)).join('');
    assert.equal(enc(w1), c1); assert.equal(enc(w2), q.answer);
  });
});
