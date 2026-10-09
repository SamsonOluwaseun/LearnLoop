/* LearnLoop question bank: Years 4, 5 and 6 (key stage 2), aligned to the national curriculum in England.
 * Source: The national curriculum in England, mathematics and English programmes of study (Crown copyright, Open Government Licence v3.0).
 * Year 6 maths and grammar items follow the style of the key stage 2 national curriculum tests, which are also published under the
 * Open Government Licence. All questions here are original. Maths answers are calculated, English items are written and reviewed by hand.
 */
(function (root) {
  'use strict';
  function pack(C) {
    const { pick, int, shuffle, numChoices, strChoices } = C.helpers;
    const fmt = (n) => n.toLocaleString('en-GB');
    const dec = (x, dp = 2) => String(+x.toFixed(dp));
    const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
    const frac = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };
    const textChoices = (r, ans, wrongs) => strChoices(r, ans, [...new Set(wrongs.map(String))].filter(w => w !== ans).slice(0, 3));

    // ---------- small SVG drawings. Classes are styled by the learning page so they work in light and dark mode ----------
    const SVG = {
      wrap: (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" class="qsvg">${body}</svg>`,
      rect(wu, hu, unit) { // a rectangle with labelled sides
        const s = Math.min(26, 220 / Math.max(wu, hu)); const W = wu * s, H = hu * s;
        return SVG.wrap(W + 70, H + 50, `<rect x="35" y="15" width="${W}" height="${H}" class="s-soft s-line"/><text x="${35 + W / 2}" y="${H + 38}" text-anchor="middle" class="s-text">${wu} ${unit}</text><text x="${W + 42}" y="${15 + H / 2 + 4}" class="s-text">${hu} ${unit}</text>`, `Rectangle ${wu} by ${hu} ${unit}`);
      },
      angle(deg) {
        const r = 70, a = deg * Math.PI / 180; const x2 = 90 + r * Math.cos(-a), y2 = 100 + r * Math.sin(-a);
        const big = deg > 180 ? 1 : 0; const ax = 90 + 22 * Math.cos(-a), ay = 100 + 22 * Math.sin(-a);
        return SVG.wrap(190, 120, `<line x1="90" y1="100" x2="170" y2="100" class="s-line" stroke-width="3"/><line x1="90" y1="100" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="s-line" stroke-width="3"/><path d="M112 100 A22 22 0 ${big} 0 ${ax.toFixed(1)} ${ay.toFixed(1)}" class="s-brandline" stroke-width="3" fill="none"/>`, `An angle`);
      },
      grid(n, points, quad4) { // coordinate grid with labelled points
        const s = 22, o = quad4 ? n * s + 20 : 20, size = quad4 ? 2 * n * s + 40 : n * s + 40; let b = '';
        const lo = quad4 ? -n : 0;
        for (let i = lo; i <= n; i++) { b += `<line x1="${o + i * s}" y1="${20}" x2="${o + i * s}" y2="${size - 20}" class="s-gridline"/><line x1="20" y1="${(quad4 ? o : size - 20) - i * s}" x2="${size - 20}" y2="${(quad4 ? o : size - 20) - i * s}" class="s-gridline"/>`;
          if (i !== 0 || !quad4) b += `<text x="${o + i * s}" y="${(quad4 ? o : size - 20) + 14}" text-anchor="middle" class="s-small">${i}</text><text x="${o - 8}" y="${(quad4 ? o : size - 20) - i * s + 4}" text-anchor="end" class="s-small">${i === 0 && !quad4 ? '' : i}</text>`; }
        const yo = quad4 ? o : size - 20;
        b += `<line x1="${o}" y1="15" x2="${o}" y2="${size - 15}" class="s-line" stroke-width="2"/><line x1="15" y1="${yo}" x2="${size - 15}" y2="${yo}" class="s-line" stroke-width="2"/>`;
        for (const p of points) b += `<circle cx="${o + p.x * s}" cy="${yo - p.y * s}" r="5" class="s-fill"/><text x="${o + p.x * s + 7}" y="${yo - p.y * s - 7}" class="s-text">${p.label}</text>`;
        return SVG.wrap(size, size, b, 'Coordinate grid');
      },
      bars(labels, values, step) {
        const max = Math.max(...values), top = Math.ceil(max / step) * step, H = 150, W = labels.length * 54 + 50; let b = '';
        for (let v = 0; v <= top; v += step) { const y = 170 - v / top * H; b += `<line x1="40" y1="${y}" x2="${W}" y2="${y}" class="s-gridline"/><text x="34" y="${y + 4}" text-anchor="end" class="s-small">${v}</text>`; }
        labels.forEach((l, i) => { const h = values[i] / top * H; b += `<rect x="${52 + i * 54}" y="${170 - h}" width="34" height="${h}" class="s-fill"/><text x="${69 + i * 54}" y="188" text-anchor="middle" class="s-small">${l}</text>`; });
        return SVG.wrap(W + 10, 196, b, 'Bar chart');
      },
      cuboid(l, w, h) {
        const s = Math.min(18, 140 / Math.max(l + w / 2, h + w / 2)); const L = l * s, H = h * s, D = w * s * 0.5, x = 20, y = 20 + D;
        const b = `<polygon points="${x},${y} ${x + L},${y} ${x + L},${y + H} ${x},${y + H}" class="s-soft s-line"/><polygon points="${x},${y} ${x + D},${y - D} ${x + L + D},${y - D} ${x + L},${y}" class="s-soft s-line"/><polygon points="${x + L},${y} ${x + L + D},${y - D} ${x + L + D},${y + H - D} ${x + L},${y + H}" class="s-soft s-line"/>
          <text x="${x + L / 2}" y="${y + H + 16}" text-anchor="middle" class="s-text">${l} cm</text><text x="${x + L + D + 6}" y="${y + H / 2}" class="s-text">${h} cm</text><text x="${x + L + D / 2 + 4}" y="${y + H - D / 2 + 14}" class="s-text">${w} cm</text>`;
        return SVG.wrap(L + D + 80, H + D + 50, b, `Cuboid ${l} by ${w} by ${h} cm`);
      },
      triangle(a, b) { // triangle with two angles marked and the third unknown
        return SVG.wrap(240, 150, `<polygon points="20,130 220,130 90,20" class="s-soft s-line"/><text x="40" y="122" class="s-text">${a}°</text><text x="178" y="122" class="s-text">${b}°</text><text x="84" y="48" class="s-text">?</text>`, 'Triangle');
      }
    };
    C.svg = SVG;
    const svgVisual = (svg) => ({ kind: 'svg', svg });

    const M = {};
    // ================= Year 4 =================
    M['round-numbers'] = { year: 'Y4', subject: 'maths', label: 'Rounding to 10, 100 and 1000', nc: 'Y4 Number: round any number to the nearest 10, 100 or 1000',
      gen(r, L) {
        const to = L === 1 ? 10 : L === 2 ? 100 : 1000; const n = L === 3 ? int(r, 1001, 9998) : int(r, 101, 9998);
        const ans = Math.round(n / to) * to; const wrong = [Math.floor(n / to) * to, Math.ceil(n / to) * to, Math.round(n / (to * 10)) * to * 10, ans + to].filter(x => x !== ans);
        return { variant: `rnd:${n}:${to}`, prompt: `Round ${fmt(n)} to the nearest ${fmt(to)}.`, speak: `Round ${n} to the nearest ${to}.`, response: 'choice', visual: null,
          answer: ans, choices: shuffle(r, [ans, ...[...new Set(wrong)].slice(0, 2)]).map(v => ({ value: v, label: fmt(v) })),
          hint: `Look at the digit to the right of the ${to === 10 ? 'tens' : to === 100 ? 'hundreds' : 'thousands'}. 5 or more rounds up.`, alt: { kind: 'clue', text: `${fmt(Math.floor(n / to) * to)} or ${fmt(Math.ceil(n / to) * to)}?` },
          worked: `${fmt(n)} is between ${fmt(Math.floor(n / to) * to)} and ${fmt(Math.ceil(n / to) * to)}. It is nearer ${fmt(ans)}.` };
      } };
    M['add-sub-4digit'] = { year: 'Y4', subject: 'maths', label: 'Adding and subtracting four-digit numbers', nc: 'Y4 Addition and subtraction: add and subtract numbers with up to 4 digits using columnar methods',
      gen(r, L) {
        const sub = r() < 0.5; let a = L === 1 ? int(r, 1000, 4999) : int(r, 1200, 8999), b = L === 1 ? int(r, 100, 999) : L === 2 ? int(r, 1000, 3999) : int(r, 1500, 4999);
        if (sub && b > a) [a, b] = [b, a]; if (!sub && a + b > 9999) b = 9999 - a;
        const ans = sub ? a - b : a + b; const op = sub ? '−' : '+';
        return { variant: `as4:${a}${op}${b}`, prompt: `${a} ${op} ${b} = ?`, speak: `What is ${a} ${sub ? 'take away' : 'add'} ${b}?`, response: 'choice-or-type', visual: { kind: 'column', a, b, op },
          answer: ans, choices: numChoices(r, ans, 0, 19999, 3, [10, 100, 1000]), hint: 'Line up the digits. Start with the ones and work left.', alt: { kind: 'clue', text: `Estimate first: about ${fmt(Math.round(a / 100) * 100)} ${op} ${fmt(Math.round(b / 100) * 100)}` },
          worked: `${a} ${op} ${b} = ${ans}. Check: ${sub ? `${ans} + ${b} = ${a}` : `${ans} − ${b} = ${a}`}.` };
      } };
    M['times-tables-12'] = { year: 'Y4', subject: 'maths', label: 'Times tables to 12 × 12', nc: 'Y4 Multiplication and division: recall multiplication and division facts for multiplication tables up to 12 × 12',
      gen(r, L) {
        const t = L === 1 ? pick(r, [6, 9, 11]) : pick(r, [6, 7, 8, 9, 11, 12]); const n = int(r, 2, 12); const p = t * n;
        if (L === 3) return { variant: `t12d:${p}/${t}`, prompt: `${p} ÷ ${t} = ?`, speak: `What is ${p} divided by ${t}?`, response: 'choice-or-type', visual: null, answer: n,
          choices: numChoices(r, n, 1, 12, 3, [1, 2]), hint: `Which number times ${t} makes ${p}?`, alt: { kind: 'clue', text: `? × ${t} = ${p}` }, worked: `${n} × ${t} = ${p}, so ${p} ÷ ${t} = ${n}.` };
        return { variant: `t12:${n}x${t}`, prompt: `${n} × ${t} = ?`, speak: `What is ${n} times ${t}?`, response: 'choice-or-type', visual: null, answer: p,
          choices: numChoices(r, p, 0, 150, 3, [t, n, 1]), hint: t === 9 ? `Times by 10, then take away one lot: ${n * 10} − ${n}.` : t === 11 ? `${n} × 10 = ${n * 10}, then add ${n}.` : `Use a fact you know: ${n} × ${t - 1} = ${n * (t - 1)}, then add ${n}.`,
          alt: { kind: 'clue', text: `${n} × ${t - 1} + ${n}` }, worked: `${n} × ${t} = ${p}.` };
      } };
    M['multiply-3by1'] = { year: 'Y4', subject: 'maths', label: 'Multiplying by a one-digit number', nc: 'Y4 Multiplication and division: multiply two-digit and three-digit numbers by a one-digit number using formal written layout',
      gen(r, L) {
        const a = L === 1 ? int(r, 12, 49) : int(r, 104, 489); const b = L === 3 ? int(r, 6, 9) : int(r, 2, 6); const p = a * b;
        return { variant: `m31:${a}x${b}`, prompt: `${a} × ${b} = ?`, speak: `What is ${a} times ${b}?`, response: 'choice-or-type', visual: null, answer: p,
          choices: numChoices(r, p, 0, 5000, 3, [b, 10, 100]), hint: `Split ${a} into hundreds, tens and ones and multiply each by ${b}.`, alt: { kind: 'clue', text: String(a).split('').map((d, i, arr) => `${d * Math.pow(10, arr.length - 1 - i)} × ${b}`).join(' + ') },
          worked: `${String(a).split('').map((d, i, arr) => `${d * Math.pow(10, arr.length - 1 - i)} × ${b} = ${d * Math.pow(10, arr.length - 1 - i) * b}`).join(', ')}. Total ${p}.` };
      } };
    M['fractions-decimals-y4'] = { year: 'Y4', subject: 'maths', label: 'Fractions and decimals', nc: 'Y4 Fractions: equivalent fractions; add and subtract fractions with the same denominator; decimal equivalents of tenths, hundredths, 1/4, 1/2, 3/4',
      gen(r, L) {
        if (L === 1) { const [f, d] = pick(r, [['1/2', '0.5'], ['1/4', '0.25'], ['3/4', '0.75'], ['1/10', '0.1'], ['3/10', '0.3'], ['7/10', '0.7'], ['1/100', '0.01'], ['9/100', '0.09']]);
          const wrong = { '0.5': ['0.2', '1.2'], '0.25': ['0.4', '2.5'], '0.75': ['0.34', '7.5'], '0.1': ['0.01', '1.1'], '0.3': ['0.03', '3.1'], '0.7': ['0.07', '7.1'], '0.01': ['0.1', '1.0'], '0.09': ['0.9', '9.1'] }[d];
          return { variant: `fd4:${f}`, prompt: `Which decimal is the same as ${f}?`, speak: `Which decimal is the same as ${f}?`, response: 'choice', visual: null, answer: d, choices: textChoices(r, d, wrong),
            hint: 'Tenths go in the first place after the decimal point. Hundredths go in the second.', alt: { kind: 'clue', text: `${f} = ? ÷ ${f.split('/')[1]}` }, worked: `${f} = ${d}.` }; }
        if (L === 2) { const d = pick(r, [5, 7, 8, 9, 10, 12]); const a = int(r, 1, d - 1), b = int(r, 1, d - 1); const sum = a + b; const ans = `${sum}/${d}`;
          return { variant: `fd4a:${a}+${b}/${d}`, prompt: `${a}/${d} + ${b}/${d} = ?`, speak: `${a} ${d}ths add ${b} ${d}ths`, response: 'choice', visual: { kind: 'bar', parts: d, shaded: Math.min(d, sum) },
            answer: ans, choices: textChoices(r, ans, [`${sum}/${d * 2}`, `${sum + 1}/${d}`, `${Math.abs(a - b)}/${d}`]), hint: 'Same bottom number: add the top numbers only.', alt: { kind: 'clue', text: `${a} + ${b} = ?` },
            worked: `${a} + ${b} = ${sum}, so the answer is ${sum}/${d}${sum > d ? `, which is more than one whole` : ''}.` }; }
        const [n, d] = pick(r, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]); const k = int(r, 2, 5); const ans = n * k;
        return { variant: `fd4e:${n}/${d}x${k}`, prompt: `${n}/${d} = ?/${d * k}`, speak: `${n} over ${d} equals what over ${d * k}?`, response: 'choice-or-type', visual: { kind: 'bar', parts: d, shaded: n },
          answer: ans, choices: numChoices(r, ans, 1, d * k, 3, [1, k]), hint: `${d} × ${k} = ${d * k}. Do the same to the top.`, alt: { kind: 'bar', parts: d * k, shaded: ans }, worked: `${n} × ${k} = ${ans}, so ${n}/${d} = ${ans}/${d * k}.` };
      } };
    M['measure-convert'] = { year: 'Y4', subject: 'maths', label: 'Converting units', nc: 'Y4 Measurement: convert between different units of measure, for example kilometre to metre, hour to minute',
      gen(r, L) {
        const sets = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['l', 'ml', 1000], ['hours', 'minutes', 60], ['minutes', 'seconds', 60]];
        const [big, small, f] = pick(r, L === 1 ? sets.slice(0, 5) : sets); let q = L === 3 ? int(r, 2, 9) + pick(r, [0.5, 0.25]) : int(r, 2, 9);
        if (f === 60 && q % 1 === 0.25) q = q - 0.25 + 0.5;
        const ans = Math.round(q * f); const reverse = L >= 2 && r() < 0.5;
        if (reverse) return { variant: `cv:${ans}${small}`, prompt: `${fmt(ans)} ${small} = ? ${big}`, speak: `${ans} ${small} is how many ${big}?`, response: 'choice', visual: null, answer: dec(q),
          choices: textChoices(r, dec(q), [dec(q * 10), dec(q / 10), dec(ans / 100)]), hint: `There are ${f} ${small} in 1 ${big.replace(/s$/, '')}. Divide by ${f}.`, alt: { kind: 'clue', text: `${ans} ÷ ${f}` }, worked: `${ans} ÷ ${f} = ${dec(q)}, so ${fmt(ans)} ${small} = ${dec(q)} ${big}.` };
        return { variant: `cv:${q}${big}`, prompt: `${dec(q)} ${big} = ? ${small}`, speak: `${dec(q)} ${big} is how many ${small}?`, response: 'choice-or-type', visual: null, answer: ans,
          choices: numChoices(r, ans, 0, 100000, 3, [f, Math.round(f / 10) || 1, f * 10]), hint: `There are ${f} ${small} in 1 ${big.replace(/s$/, '')}. Multiply by ${f}.`, alt: { kind: 'clue', text: `${dec(q)} × ${f}` }, worked: `${dec(q)} × ${f} = ${ans}.` };
      } };
    M['area-perimeter'] = { year: 'Y4', subject: 'maths', label: 'Area and perimeter', nc: 'Y4 Measurement: perimeter of rectilinear figures; area of rectilinear shapes by counting squares',
      gen(r, L) {
        const w = int(r, 2, L === 1 ? 6 : 12), h = int(r, 2, L === 1 ? 6 : 9); const unit = L === 1 ? 'cm' : pick(r, ['cm', 'm']);
        const area = L === 1 ? r() < 0.5 : L === 3 ? r() < 0.6 : r() < 0.5; const ans = area ? w * h : 2 * (w + h);
        if (L === 3 && !area) { const P = 2 * (w + h); return { variant: `pmiss:${w}:${P}`, prompt: `A rectangle is ${w} ${unit} long and its perimeter is ${P} ${unit}. How wide is it?`, speak: `A rectangle is ${w} ${unit} long and its perimeter is ${P} ${unit}. How wide is it?`,
          response: 'choice-or-type', visual: null, answer: h, choices: numChoices(r, h, 1, 30, 3, [1, 2, w]), hint: `Two lengths make ${2 * w}. What is left is two widths.`, alt: { kind: 'clue', text: `(${P} − ${2 * w}) ÷ 2` },
          worked: `${P} − ${2 * w} = ${P - 2 * w}. Half of ${P - 2 * w} is ${h}, so the width is ${h} ${unit}.` }; }
        return { variant: `ap:${w}x${h}:${area}`, prompt: `What is the ${area ? 'area' : 'perimeter'} of this rectangle?`, speak: `What is the ${area ? 'area' : 'perimeter'} of the rectangle?`, response: 'choice-or-type',
          visual: svgVisual(SVG.rect(w, h, unit)), answer: ans, choices: numChoices(r, ans, 1, 300, 3, area ? [2 * (w + h) - ans, w + h - ans, 1].filter(Boolean) : [w * h - ans, 2, w + h - ans].filter(Boolean)),
          hint: area ? 'Area is length times width. It is the space inside.' : 'Perimeter is the distance all the way round. Add all four sides.', alt: { kind: 'clue', text: area ? `${w} × ${h}` : `${w} + ${h} + ${w} + ${h}` },
          worked: area ? `${w} × ${h} = ${ans} square ${unit}.` : `${w} + ${h} + ${w} + ${h} = ${ans} ${unit}.` };
      } };
    M['time-24h'] = { year: 'Y4', subject: 'maths', label: '12-hour and 24-hour clocks', nc: 'Y4 Measurement: read, write and convert time between analogue and digital 12- and 24-hour clocks',
      gen(r, L) {
        const h = L === 1 ? int(r, 13, 23) : int(r, 0, 23), m = pick(r, [0, 5, 15, 20, 30, 45, 50]); const pad = (x) => String(x).padStart(2, '0');
        const t24 = `${pad(h)}:${pad(m)}`; const h12 = h % 12 === 0 ? 12 : h % 12; const t12 = `${h12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
        const to24 = L >= 2 && r() < 0.5;
        if (to24) return { variant: `t24:${t12}`, prompt: `Write ${t12} as a 24-hour time.`, speak: `Write ${t12.replace(':00', ' o clock')} as a 24-hour time.`, response: 'choice', visual: null, answer: t24,
          choices: textChoices(r, t24, [`${pad(h12)}:${pad(m)}`, `${pad((h + 12) % 24)}:${pad(m)}`, `${pad((h + 1) % 24)}:${pad(m)}`]), hint: 'For pm times after 12:59, add 12 to the hour. 12 am is 00.', alt: { kind: 'clue', text: h >= 12 ? `${h12} + 12` : `${h12} stays ${pad(h)}` }, worked: `${t12} is ${t24}.` };
        return { variant: `t12:${t24}`, prompt: `What is ${t24} on a 12-hour clock?`, speak: `What is ${pad(h)} ${pad(m)} on a 12-hour clock?`, response: 'choice', visual: null, answer: t12,
          choices: textChoices(r, t12, [`${h12}:${pad(m)} ${h < 12 ? 'pm' : 'am'}`, `${h12 === 12 ? 1 : h12 + 1}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`, `${(h12 + 2) % 12 || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`]),
          hint: 'If the hour is 13 or more, take away 12 and it is pm.', alt: { kind: 'clue', text: h > 12 ? `${h} − 12 = ${h - 12}` : 'Before 12:00 is am' }, worked: `${t24} is ${t12}.` };
      } };
    M['angles-shapes'] = { year: 'Y4', subject: 'maths', label: 'Angles and shapes', nc: 'Y4 Geometry: identify acute and obtuse angles; compare and classify triangles and quadrilaterals',
      gen(r, L) {
        if (L <= 2) { const kind = pick(r, ['acute', 'right', 'obtuse', ...(L === 2 ? ['reflex'] : [])]); const deg = kind === 'acute' ? int(r, 25, 75) : kind === 'right' ? 90 : kind === 'obtuse' ? int(r, 105, 160) : int(r, 200, 320);
          const opts = L === 2 ? ['acute', 'right angle', 'obtuse', 'reflex'] : ['acute', 'right angle', 'obtuse']; const ans = kind === 'right' ? 'right angle' : kind;
          return { variant: `ang:${deg}`, prompt: 'What kind of angle is this?', speak: 'What kind of angle is this?', response: 'choice', visual: svgVisual(SVG.angle(deg)), answer: ans, choices: opts.map(o => ({ value: o, label: o[0].toUpperCase() + o.slice(1) })),
            hint: 'A right angle is a square corner, 90°. Acute is smaller. Obtuse is bigger but less than 180°. Reflex is more than 180°.', alt: { kind: 'clue', text: 'Compare it with the corner of a book.' }, worked: `This angle is about ${deg}°, so it is ${ans === 'acute' ? 'an acute angle' : ans === 'obtuse' ? 'an obtuse angle' : ans === 'reflex' ? 'a reflex angle' : 'a right angle'}.` }; }
        const q = pick(r, [['A triangle with all sides the same length', 'equilateral', ['isosceles', 'scalene']], ['A triangle with exactly two equal sides', 'isosceles', ['equilateral', 'scalene']], ['A triangle with no equal sides', 'scalene', ['isosceles', 'equilateral']],
          ['A quadrilateral with four equal sides and no right angles', 'rhombus', ['square', 'rectangle']], ['A quadrilateral with exactly one pair of parallel sides', 'trapezium', ['parallelogram', 'rectangle']], ['A quadrilateral with two pairs of parallel sides and no right angles', 'parallelogram', ['trapezium', 'kite']]]);
        return { variant: `shape:${q[1]}`, prompt: `What is the name of this shape? ${q[0]}.`, speak: `What is the name of this shape? ${q[0]}.`, response: 'choice', visual: null, answer: q[1], choices: textChoices(r, q[1], q[2]),
          hint: 'Equilateral means equal sides. Isosceles has two equal sides. Parallel lines never meet.', alt: { kind: 'clue', text: 'Count the equal sides and the parallel pairs.' }, worked: `${q[0]} is called a ${q[1]}.` };
      } };
    M['coordinates-y4'] = { year: 'Y4', subject: 'maths', label: 'Coordinates', nc: 'Y4 Geometry: describe positions on a 2-D grid as coordinates in the first quadrant; describe translations',
      gen(r, L) {
        const x = int(r, 0, 8), y = int(r, 0, 8);
        if (L === 3) { const moves = (v) => [-3, -2, -1, 1, 2, 3].filter(d => v + d >= 0 && v + d <= 8); const ddx = pick(r, moves(x)), ddy = pick(r, moves(y)); const nx = x + ddx, ny = y + ddy;
          const ans = `(${nx}, ${ny})`; return { variant: `tr:${x},${y}:${ddx},${ddy}`, prompt: `Point A is at (${x}, ${y}). It moves ${Math.abs(ddx)} ${ddx >= 0 ? 'right' : 'left'} and ${Math.abs(ddy)} ${ddy >= 0 ? 'up' : 'down'}. Where is it now?`, speak: `Point A is at ${x}, ${y}. It moves ${Math.abs(ddx)} ${ddx >= 0 ? 'right' : 'left'} and ${Math.abs(ddy)} ${ddy >= 0 ? 'up' : 'down'}. Where is it now?`,
            response: 'choice', visual: svgVisual(SVG.grid(8, [{ x, y, label: 'A' }])), answer: ans, choices: textChoices(r, ans, [`(${ny}, ${nx})`, `(${x - ddx}, ${y - ddy})`, `(${nx}, ${y})`, `(${x}, ${ny})`].filter(c => !c.includes('-'))),
            hint: 'Right and left change the first number. Up and down change the second.', alt: { kind: 'clue', text: `${x} ${ddx >= 0 ? '+' : '−'} ${Math.abs(ddx)}, ${y} ${ddy >= 0 ? '+' : '−'} ${Math.abs(ddy)}` }, worked: `${x} ${ddx >= 0 ? '+' : '−'} ${Math.abs(ddx)} = ${nx} and ${y} ${ddy >= 0 ? '+' : '−'} ${Math.abs(ddy)} = ${ny}, so ${ans}.` }; }
        let y2 = y; if (x === y) y2 = (y + 3) % 9; const ans = `(${x}, ${y2})`;
        return { variant: `co:${x},${y2}`, prompt: 'What are the coordinates of point P?', speak: 'What are the coordinates of point P?', response: 'choice', visual: svgVisual(SVG.grid(8, [{ x, y: y2, label: 'P' }])),
          answer: ans, choices: textChoices(r, ans, [`(${y2}, ${x})`, `(${x + 1}, ${y2})`, `(${x}, ${y2 + 1})`]), hint: 'Go along the corridor first, then up the stairs: (across, up).', alt: { kind: 'clue', text: 'Across first, then up.' }, worked: `P is ${x} across and ${y2} up, so it is at ${ans}.` };
      } };
    M['bar-charts'] = { year: 'Y4', subject: 'maths', label: 'Reading bar charts', nc: 'Y4 Statistics: interpret data using bar charts; solve comparison, sum and difference problems',
      gen(r, L) {
        const sets = [['Pets', ['Cats', 'Dogs', 'Fish', 'Birds']], ['Fruit', ['Apples', 'Pears', 'Plums', 'Grapes']], ['Sports', ['Football', 'Tennis', 'Swim', 'Netball']]];
        const [, labels] = pick(r, sets); const step = L === 1 ? 2 : 5; const values = labels.map(() => step * int(r, 1, L === 1 ? 6 : 8));
        while (new Set(values).size < values.length) values[int(r, 0, 3)] = step * int(r, 1, 8);
        const i = int(r, 0, 3), j = (i + int(r, 1, 3)) % 4; let prompt, ans, worked;
        if (L === 1) { prompt = `How many chose ${labels[i]}?`; ans = values[i]; worked = `The ${labels[i]} bar reaches ${ans}.`; }
        else if (L === 2) { prompt = `How many more chose ${values[i] >= values[j] ? labels[i] : labels[j]} than ${values[i] >= values[j] ? labels[j] : labels[i]}?`; ans = Math.abs(values[i] - values[j]); worked = `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])} = ${ans}.`; }
        else { prompt = 'How many altogether?'; ans = values.reduce((a, b) => a + b, 0); worked = `${values.join(' + ')} = ${ans}.`; }
        return { variant: `bar:${labels.join()}:${values.join()}:${L}`, prompt, speak: prompt, response: 'choice-or-type', visual: svgVisual(SVG.bars(labels, values, step)), answer: ans,
          choices: numChoices(r, ans, 0, 200, 3, [step, step * 2, 1]), hint: 'Follow the top of each bar across to the scale.', alt: { kind: 'clue', text: `Each line on the scale is ${step}.` }, worked };
      } };

    // ================= Year 5 =================
    M['place-value-million'] = { year: 'Y5', subject: 'maths', label: 'Numbers to a million', nc: 'Y5 Number: read, write, order and compare numbers to at least 1,000,000; round to the nearest 10,000 and 100,000',
      gen(r, L) {
        const n = int(r, 100000, 999999); const digits = String(n).split('');
        if (L === 1) { const i = int(r, 0, 3); const d = +digits[i]; const val = d * Math.pow(10, 5 - i); if (d === 0) return this.gen(r, L);
          return { variant: `pvm:${n}:${i}`, prompt: `What is the value of the ${d} in ${fmt(n)}?`, speak: `What is the value of the digit ${d} in ${n}?`, response: 'choice', visual: null, answer: val,
            choices: shuffle(r, [...new Set([val, val * 10, val / 10, d])].slice(0, 3)).map(v => ({ value: v, label: fmt(v) })), hint: 'Hundred thousands, ten thousands, thousands, hundreds, tens, ones.', alt: { kind: 'clue', text: digits.map((x, k) => k === i ? `[${x}]` : x).join('') }, worked: `The ${d} is in the ${['hundred thousands', 'ten thousands', 'thousands', 'hundreds'][i]} place, so it is worth ${fmt(val)}.` }; }
        const to = L === 2 ? 10000 : 100000; const ans = Math.round(n / to) * to;
        return { variant: `rm:${n}:${to}`, prompt: `Round ${fmt(n)} to the nearest ${fmt(to)}.`, speak: `Round ${n} to the nearest ${to}.`, response: 'choice', visual: null, answer: ans,
          choices: shuffle(r, [...new Set([ans, Math.floor(n / to) * to, Math.ceil(n / to) * to, ans + to])].filter((v, k, a) => a.indexOf(v) === k).slice(0, 3)).map(v => ({ value: v, label: fmt(v) })),
          hint: 'Look at the digit to the right of the place you are rounding to.', alt: { kind: 'clue', text: `${fmt(Math.floor(n / to) * to)} or ${fmt(Math.ceil(n / to) * to)}?` }, worked: `${fmt(n)} is nearer ${fmt(ans)}.` };
      } };
    M['negative-numbers'] = { year: 'Y5', subject: 'maths', label: 'Negative numbers', nc: 'Y5 Number: interpret negative numbers in context, count forwards and backwards through zero',
      gen(r, L) {
        const a = int(r, -10, 5), b = int(r, 1, 12); const warmer = r() < 0.5; const end = warmer ? a + b : a - b;
        if (L === 3) { const x = int(r, -12, -1), y = int(r, 1, 15); return { variant: `nd:${x}:${y}`, prompt: `At night it was ${x}°C. In the day it was ${y}°C. How many degrees warmer was the day?`, speak: `At night it was minus ${-x} degrees. In the day it was ${y} degrees. How many degrees warmer was the day?`,
          response: 'choice-or-type', visual: null, answer: y - x, choices: numChoices(r, y - x, 0, 40, 3, [2 * -x, 1, 2]).map(c => c), hint: 'Count up from the night temperature to 0, then on to the day temperature.', alt: { kind: 'clue', text: `${-x} up to 0, then ${y} more` }, worked: `From ${x} to 0 is ${-x}, then 0 to ${y} is ${y}. ${-x} + ${y} = ${y - x}.` }; }
        return { variant: `neg:${a}:${warmer}:${b}`, prompt: `The temperature is ${a}°C. It gets ${b} degrees ${warmer ? 'warmer' : 'colder'}. What is the temperature now?`, speak: `The temperature is ${a < 0 ? 'minus ' + -a : a} degrees. It gets ${b} degrees ${warmer ? 'warmer' : 'colder'}. What is it now?`,
          response: 'choice', visual: null, answer: end, choices: numChoices(r, end, -30, 30, 3, [2 * Math.abs(end) || 1, 1, 2]).map(c => ({ value: c.value, label: `${c.value}°C` })), hint: warmer ? 'Warmer means count up the number line.' : 'Colder means count down, past zero into negative numbers.',
          alt: { kind: 'clue', text: `${a} ${warmer ? '+' : '−'} ${b}` }, worked: `${a} ${warmer ? '+' : '−'} ${b} = ${end}, so it is ${end}°C.` };
      } };
    const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
    M['factors-primes'] = { year: 'Y5', subject: 'maths', label: 'Factors, multiples and primes', nc: 'Y5 Multiplication and division: multiples, factors, prime numbers, square and cube numbers',
      gen(r, L) {
        if (L === 1) { const n = pick(r, [12, 18, 20, 24, 30, 36, 40, 42, 48]); const f = (() => { const fs = []; for (let i = 2; i < n; i++) if (n % i === 0) fs.push(i); return pick(r, fs); })();
          const nonf = []; for (let i = 2; i < 13; i++) if (n % i) nonf.push(i);
          return { variant: `fac:${n}:${f}`, prompt: `Which number is a factor of ${n}?`, speak: `Which number is a factor of ${n}?`, response: 'choice', visual: null, answer: f, choices: shuffle(r, [f, ...shuffle(r, nonf).slice(0, 2)]).map(v => ({ value: v, label: String(v) })),
            hint: `A factor divides ${n} exactly, with nothing left over.`, alt: { kind: 'clue', text: `${n} ÷ ? = a whole number` }, worked: `${n} ÷ ${f} = ${n / f}, so ${f} is a factor of ${n}.` }; }
        if (L === 2) { const p = pick(r, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]); const comps = shuffle(r, [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 57]).slice(0, 2);
          return { variant: `pr:${p}`, prompt: 'Which of these is a prime number?', speak: 'Which of these is a prime number?', response: 'choice', visual: null, answer: p, choices: shuffle(r, [p, ...comps]).map(v => ({ value: v, label: String(v) })),
            hint: 'A prime number has exactly two factors: 1 and itself.', alt: { kind: 'clue', text: 'Try dividing by 3, 5 and 7.' }, worked: `${p} can only be divided by 1 and ${p}. ${comps.map(c => `${c} = ${(() => { for (let i = 3; i < c; i++) if (c % i === 0) return `${i} × ${c / i}`; })()}`).join(', ')}.` }; }
        const sq = r() < 0.5; const n = int(r, 2, sq ? 12 : 5); const ans = sq ? n * n : n * n * n;
        return { variant: `pow:${n}:${sq}`, prompt: `${n}${sq ? '²' : '³'} = ?`, speak: `What is ${n} ${sq ? 'squared' : 'cubed'}?`, response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 0, 1728, 3, [n, n * 2, 1].filter(x => x !== ans)),
          hint: sq ? `Squared means ${n} × ${n}.` : `Cubed means ${n} × ${n} × ${n}.`, alt: { kind: 'clue', text: sq ? `${n} × ${n}` : `${n} × ${n} × ${n}` }, worked: sq ? `${n} × ${n} = ${ans}.` : `${n} × ${n} = ${n * n}, × ${n} = ${ans}.` };
      } };
    M['multiply-divide-y5'] = { year: 'Y5', subject: 'maths', label: 'Long multiplication and short division', nc: 'Y5 Multiplication and division: multiply up to 4 digits by 1 or 2 digits; divide up to 4 digits by 1 digit using short division, interpreting remainders',
      gen(r, L) {
        if (L === 2 || (L === 3 && r() < 0.5)) { const d = int(r, 3, 9); const q = int(r, 21, L === 3 ? 999 : 199); const rem = L === 3 ? int(r, 1, d - 1) : 0; const n = q * d + rem;
          if (rem) return { variant: `sdr:${n}/${d}`, prompt: `${n} ÷ ${d} = ? remainder ${rem}`, speak: `What is ${n} divided by ${d}? There is a remainder of ${rem}.`, response: 'choice-or-type', visual: null, answer: q,
            choices: numChoices(r, q, 1, 2000, 3, [1, 10]), hint: `Find the biggest multiple of ${d} below ${n}.`, alt: { kind: 'clue', text: `${d} × ? + ${rem} = ${n}` }, worked: `${d} × ${q} = ${q * d}, and ${q * d} + ${rem} = ${n}. So ${n} ÷ ${d} = ${q} r ${rem}.` };
          return { variant: `sd:${n}/${d}`, prompt: `${n} ÷ ${d} = ?`, speak: `What is ${n} divided by ${d}?`, response: 'choice-or-type', visual: null, answer: q, choices: numChoices(r, q, 1, 2000, 3, [1, 10]),
            hint: 'Divide each digit from the left, carrying any remainder to the next digit.', alt: { kind: 'clue', text: `${d} × ? = ${n}` }, worked: `${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q}.` }; }
        const a = L === 1 ? int(r, 21, 99) : int(r, 123, 999), b = L === 1 ? int(r, 3, 9) : int(r, 12, 35); const p = a * b;
        return { variant: `lm:${a}x${b}`, prompt: `${a} × ${b} = ?`, speak: `What is ${a} times ${b}?`, response: 'choice-or-type', visual: null, answer: p, choices: numChoices(r, p, 0, 40000, 3, [a, 10, 100]),
          hint: b > 9 ? `Multiply by the ones, then by the tens, then add: ${a} × ${b % 10} and ${a} × ${b - b % 10}.` : `Split ${a} into tens and ones.`, alt: { kind: 'clue', text: b > 9 ? `${a} × ${b % 10} = ${a * (b % 10)}` : `${a - a % 10} × ${b} + ${a % 10} × ${b}` },
          worked: b > 9 ? `${a} × ${b % 10} = ${a * (b % 10)} and ${a} × ${b - b % 10} = ${a * (b - b % 10)}. Total ${p}.` : `${a} × ${b} = ${p}.` };
      } };
    M['fractions-y5'] = { year: 'Y5', subject: 'maths', label: 'Mixed numbers and fractions', nc: 'Y5 Fractions: convert between mixed numbers and improper fractions; add fractions with related denominators; fractions of amounts',
      gen(r, L) {
        if (L === 1) { const d = pick(r, [3, 4, 5, 6, 8]), w = int(r, 1, 4), n = int(r, 1, d - 1); const imp = `${w * d + n}/${d}`;
          return { variant: `mix:${w} ${n}/${d}`, prompt: `Write ${w} ${n}/${d} as an improper fraction.`, speak: `Write ${w} and ${n} over ${d} as an improper fraction.`, response: 'choice', visual: null, answer: imp,
            choices: textChoices(r, imp, [`${w + n}/${d}`, `${w * n + d}/${d}`, `${w * d}/${n}`]), hint: `Each whole is ${d}/${d}. ${w} wholes make ${w * d}/${d}.`, alt: { kind: 'clue', text: `${w} × ${d} + ${n}` }, worked: `${w} × ${d} = ${w * d}, add ${n} = ${w * d + n}. So ${imp}.` }; }
        if (L === 2) { const [d1, d2] = pick(r, [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [5, 10], [3, 9]]); const a = 1, b = int(r, 1, d2 - d2 / d1 - 1 > 0 ? d2 - d2 / d1 - 1 : 1); const top = a * d2 / d1 + b; const ans = frac(top, d2);
          return { variant: `rel:1/${d1}+${b}/${d2}`, prompt: `1/${d1} + ${b}/${d2} = ?`, speak: `One ${d1 === 2 ? 'half' : 'over ' + d1} add ${b} over ${d2}. Give the simplest answer.`, response: 'choice', visual: null, answer: ans,
            choices: textChoices(r, ans, [`${1 + b}/${d1 + d2}`, `${1 + b}/${d2}`, frac(top + 1, d2)]), hint: `Change 1/${d1} into ${d2}ths first: 1/${d1} = ${d2 / d1}/${d2}.`, alt: { kind: 'clue', text: `${d2 / d1}/${d2} + ${b}/${d2}` },
            worked: `1/${d1} = ${d2 / d1}/${d2}. ${d2 / d1} + ${b} = ${top}, so ${top}/${d2}${ans !== `${top}/${d2}` ? ` = ${ans}` : ''}.` }; }
        const d = pick(r, [3, 4, 5, 8, 10]), n = int(r, 2, d - 1), k = int(r, 3, 12); const tot = d * k, ans = n * k;
        return { variant: `fofy5:${n}/${d}:${tot}`, prompt: `What is ${n}/${d} of ${tot}?`, speak: `What is ${n} over ${d} of ${tot}?`, response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 0, 200, 3, [k, 1, 2]),
          hint: `Divide by ${d}, then multiply by ${n}.`, alt: { kind: 'clue', text: `${tot} ÷ ${d} = ${k}` }, worked: `${tot} ÷ ${d} = ${k}, and ${k} × ${n} = ${ans}.` };
      } };
    M['decimals-percentages'] = { year: 'Y5', subject: 'maths', label: 'Decimals and percentages', nc: 'Y5 Fractions: decimals with up to three places; recognise per cent; know percentage and decimal equivalents of 1/2, 1/4, 1/5, 2/5, 4/5',
      gen(r, L) {
        if (L === 1) { const [f, p] = pick(r, [['1/2', '50%'], ['1/4', '25%'], ['3/4', '75%'], ['1/5', '20%'], ['2/5', '40%'], ['4/5', '80%'], ['1/10', '10%'], ['3/10', '30%']]);
          return { variant: `pc:${f}`, prompt: `${f} = ?%`, speak: `${f} is what percent?`, response: 'choice', visual: null, answer: p, choices: textChoices(r, p, [`${parseInt(p) / 2}%`, `${f.split('/')[0]}${f.split('/')[1]}%`, `${parseInt(p) + 10}%`]),
            hint: 'Per cent means out of 100. Make the bottom number 100.', alt: { kind: 'clue', text: `${f} = ?/100` }, worked: `${f} = ${parseInt(p)}/100 = ${p}.` }; }
        if (L === 2) { const a = int(r, 100, 9999) / 1000; const b = +(a + pick(r, [0.01, 0.1, -0.01, 0.001, -0.001])).toFixed(3); const big = Math.max(a, b);
          return { variant: `dc:${a}:${b}`, prompt: `Which is bigger: ${a} or ${b}?`, speak: `Which is bigger: ${a} or ${b}?`, response: 'choice', visual: null, answer: String(big), choices: [String(a), String(b)].map(v => ({ value: v, label: v })),
            hint: 'Compare the ones, then tenths, then hundredths, then thousandths.', alt: { kind: 'clue', text: `${a.toFixed(3)} and ${b.toFixed(3)}` }, worked: `${a.toFixed(3)} and ${b.toFixed(3)}: ${big} is bigger.` }; }
        const n = int(r, 1, 999); const div = pick(r, [10, 100, 1000]); const ans = dec(n / div, 3);
        return { variant: `div10:${n}/${div}`, prompt: `${n} ÷ ${fmt(div)} = ?`, speak: `What is ${n} divided by ${div}?`, response: 'choice', visual: null, answer: ans,
          choices: textChoices(r, ans, [dec(n / (div / 10), 3), dec(n / (div * 10), 4), dec(n * div, 0)]), hint: `Dividing by ${fmt(div)} moves each digit ${String(div).length - 1} place${div > 10 ? 's' : ''} to the right.`, alt: { kind: 'clue', text: `${div === 10 ? 'One place' : div === 100 ? 'Two places' : 'Three places'}` }, worked: `${n} ÷ ${fmt(div)} = ${ans}.` };
      } };
    M['angles-y5'] = { year: 'Y5', subject: 'maths', label: 'Missing angles', nc: 'Y5 Geometry: angles at a point and one whole turn (360°); angles at a point on a straight line (180°)',
      gen(r, L) {
        if (L === 3) { const a = int(r, 60, 150), b = int(r, 40, 140); const c = 360 - a - b; if (c < 30) return this.gen(r, L);
          return { variant: `apt:${a}:${b}`, prompt: `Three angles meet at a point. Two are ${a}° and ${b}°. What is the third?`, speak: `Three angles meet at a point. Two are ${a} degrees and ${b} degrees. What is the third?`, response: 'choice-or-type', visual: null, answer: c,
            choices: numChoices(r, c, 1, 359, 3, [180 - a - b + c - c || 10, 10, 20].map(Math.abs)), hint: 'Angles around a point add up to 360°.', alt: { kind: 'clue', text: `360 − ${a} − ${b}` }, worked: `360 − ${a} − ${b} = ${c}°.` }; }
        const a = L === 1 ? pick(r, [30, 45, 60, 120, 135, 150]) : int(r, 15, 165); const ans = 180 - a;
        return { variant: `aln:${a}`, prompt: `Two angles sit on a straight line. One is ${a}°. What is the other?`, speak: `Two angles sit on a straight line. One is ${a} degrees. What is the other?`, response: 'choice-or-type', visual: svgVisual(SVG.angle(ans)),
          answer: ans, choices: numChoices(r, ans, 1, 359, 3, [10, Math.abs(360 - a - ans) || 90, 90 - a > 0 ? 90 - a : 20]), hint: 'Angles on a straight line add up to 180°.', alt: { kind: 'clue', text: `180 − ${a}` }, worked: `180 − ${a} = ${ans}°.` };
      } };
    M['roman-numerals-1000'] = { year: 'Y5', subject: 'maths', label: 'Roman numerals to 1000', nc: 'Y5 Number: read Roman numerals to 1000 (M) and recognise years written in Roman numerals',
      gen(r, L) {
        const toRoman = (n) => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((acc, [v, s]) => { while (n >= v) { acc += s; n -= v; } return acc; }, '');
        const n = L === 1 ? int(r, 13, 99) : L === 2 ? int(r, 100, 999) : int(r, 1000, 2026); const rn = toRoman(n);
        return { variant: `rom1k:${n}`, prompt: `What number is ${rn}?`, speak: 'What number is this Roman numeral?', response: 'choice-or-type', visual: { kind: 'big', text: rn }, answer: n,
          choices: numChoices(r, n, 1, 3000, 3, [10, 100, 1, 9]), hint: 'I 1, V 5, X 10, L 50, C 100, D 500, M 1000. A smaller one before a bigger one is taken away.', alt: { kind: 'clue', text: 'I 1 · V 5 · X 10 · L 50 · C 100 · D 500 · M 1000' }, worked: `${rn} = ${n}.` };
      } };

    // ================= Year 6 =================
    M['order-of-operations'] = { year: 'Y6', subject: 'maths', label: 'Order of operations', nc: 'Y6 Calculation: use knowledge of the order of operations to carry out calculations involving the four operations',
      gen(r, L) {
        const a = int(r, 2, 12), b = int(r, 2, 9), c = int(r, 2, 9); let expr, ans, wrong, why;
        if (L === 1) { expr = `${a} + ${b} × ${c}`; ans = a + b * c; wrong = (a + b) * c; why = `Multiply first: ${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${ans}.`; }
        else if (L === 2) { expr = `(${a} + ${b}) × ${c}`; ans = (a + b) * c; wrong = a + b * c; why = `Brackets first: ${a} + ${b} = ${a + b}, then × ${c} = ${ans}.`; }
        else { const d = b * c; expr = `${a * 10} − ${d} ÷ ${b} + ${c}`; ans = a * 10 - d / b + c; wrong = (a * 10 - d) / b + c; why = `Divide first: ${d} ÷ ${b} = ${c}. Then ${a * 10} − ${c} + ${c} = ${ans}.`; }
        return { variant: `ops:${expr}`, prompt: `${expr} = ?`, speak: `What is ${expr.replace(/×/g, 'times').replace(/÷/g, 'divided by').replace(/−/g, 'minus').replace(/\(/g, 'open bracket ').replace(/\)/g, ' close bracket')}?`, response: 'choice-or-type', visual: null, answer: ans,
          choices: shuffle(r, [...new Set([ans, wrong, ans + c, ans - 1])].filter((v, i, x) => Number.isInteger(v) && x.indexOf(v) === i).slice(0, 3)).map(v => ({ value: v, label: String(v) })),
          hint: 'Brackets first, then × and ÷, then + and −.', alt: { kind: 'clue', text: 'Brackets → × ÷ → + −' }, worked: why };
      } };
    M['long-division'] = { year: 'Y6', subject: 'maths', label: 'Long division', nc: 'Y6 Calculation: divide numbers up to 4 digits by a two-digit whole number using long division',
      gen(r, L) {
        const d = L === 1 ? pick(r, [11, 12, 15, 20, 25]) : int(r, 12, 36); const q = int(r, L === 3 ? 101 : 12, L === 3 ? 299 : 99); const n = d * q;
        if (n > 9999) return this.gen(r, L);
        return { variant: `ld:${n}/${d}`, prompt: `${fmt(n)} ÷ ${d} = ?`, speak: `What is ${n} divided by ${d}?`, response: 'choice-or-type', visual: null, answer: q, choices: numChoices(r, q, 1, 999, 3, [1, 10, 2]),
          hint: `Write out some multiples of ${d}: ${[1, 2, 5, 10].map(x => `${x} × ${d} = ${x * d}`).join(', ')}.`, alt: { kind: 'clue', text: `${d} × ? = ${n}` }, worked: `${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q}.` };
      } };
    M['fractions-y6'] = { year: 'Y6', subject: 'maths', label: 'Calculating with fractions', nc: 'Y6 Fractions: simplify fractions; add and subtract fractions with different denominators; multiply simple proper fractions; divide proper fractions by whole numbers',
      gen(r, L) {
        if (L === 1) { const d0 = pick(r, [3, 4, 5, 6, 7, 8]), n0 = int(r, 1, d0 - 1), k = int(r, 2, 6); if (gcd(n0, d0) !== 1) return this.gen(r, L); const ans = `${n0}/${d0}`;
          return { variant: `simp:${n0 * k}/${d0 * k}`, prompt: `Simplify ${n0 * k}/${d0 * k}.`, speak: `Simplify ${n0 * k} over ${d0 * k}.`, response: 'choice', visual: null, answer: ans,
            choices: textChoices(r, ans, [`${n0 * k / (k > 2 && (n0 * k) % 2 === 0 && (d0 * k) % 2 === 0 ? 2 : 1)}/${d0 * k / (k > 2 && (n0 * k) % 2 === 0 && (d0 * k) % 2 === 0 ? 2 : 1)}`, `${n0 + 1}/${d0}`, `${n0}/${d0 + 1}`]), hint: `Divide the top and bottom by the same number. Try ${k}.`, alt: { kind: 'clue', text: `÷ ${k}` }, worked: `${n0 * k} ÷ ${k} = ${n0} and ${d0 * k} ÷ ${k} = ${d0}, so ${ans}.` }; }
        if (L === 2) { const [d1, d2] = pick(r, [[2, 3], [3, 4], [2, 5], [4, 5], [3, 5], [4, 6], [6, 8]]); const n1 = int(r, 1, d1 - 1), n2 = int(r, 1, d2 - 1); const D = d1 * d2 / gcd(d1, d2); const top = n1 * D / d1 + n2 * D / d2; const ans = frac(top, D);
          return { variant: `addf:${n1}/${d1}+${n2}/${d2}`, prompt: `${n1}/${d1} + ${n2}/${d2} = ?`, speak: `${n1} over ${d1} add ${n2} over ${d2}. Give the simplest answer.`, response: 'choice', visual: null, answer: ans,
            choices: textChoices(r, ans, [`${n1 + n2}/${d1 + d2}`, `${n1 + n2}/${D}`, frac(top + 1, D)]), hint: `Find a common denominator. Both ${d1} and ${d2} go into ${D}.`, alt: { kind: 'clue', text: `${n1 * D / d1}/${D} + ${n2 * D / d2}/${D}` },
            worked: `${n1}/${d1} = ${n1 * D / d1}/${D} and ${n2}/${d2} = ${n2 * D / d2}/${D}. Together ${top}/${D}${ans !== `${top}/${D}` ? ` = ${ans}` : ''}.` }; }
        if (r() < 0.5) { const a = pick(r, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]]), b = pick(r, [[1, 2], [1, 3], [1, 4], [3, 5], [1, 5]]); const ans = frac(a[0] * b[0], a[1] * b[1]);
          return { variant: `mulf:${a.join('/')}x${b.join('/')}`, prompt: `${a[0]}/${a[1]} × ${b[0]}/${b[1]} = ?`, speak: `${a[0]} over ${a[1]} times ${b[0]} over ${b[1]}`, response: 'choice', visual: null, answer: ans,
            choices: textChoices(r, ans, [`${a[0] + b[0]}/${a[1] + b[1]}`, frac(a[0] * b[1], a[1] * b[0]), `${a[0] * b[0]}/${a[1] + b[1]}`]), hint: 'Multiply the tops together and the bottoms together.', alt: { kind: 'clue', text: `${a[0]} × ${b[0]} over ${a[1]} × ${b[1]}` }, worked: `${a[0]} × ${b[0]} = ${a[0] * b[0]}, ${a[1]} × ${b[1]} = ${a[1] * b[1]}. ${a[0] * b[0]}/${a[1] * b[1]}${ans !== `${a[0] * b[0]}/${a[1] * b[1]}` ? ` = ${ans}` : ''}.` }; }
        const [n, d] = pick(r, [[1, 2], [1, 3], [2, 3], [3, 4], [2, 5]]), w = int(r, 2, 4); const ans = frac(n, d * w);
        return { variant: `divf:${n}/${d}/${w}`, prompt: `${n}/${d} ÷ ${w} = ?`, speak: `${n} over ${d} divided by ${w}`, response: 'choice', visual: null, answer: ans,
          choices: textChoices(r, ans, [frac(n * w, d), `${n}/${d + w}`, frac(n, d * (w + 1))]), hint: `Dividing by ${w} makes each part ${w} times smaller. Multiply the bottom number by ${w}.`, alt: { kind: 'clue', text: `${n}/${d} × 1/${w}` }, worked: `${n}/${d} ÷ ${w} = ${n}/${d * w}${ans !== `${n}/${d * w}` ? ` = ${ans}` : ''}.` };
      } };
    M['percentages-y6'] = { year: 'Y6', subject: 'maths', label: 'Percentages of amounts', nc: 'Y6 Ratio and proportion: solve problems involving the calculation of percentages of whole numbers or measures',
      gen(r, L) {
        const p = L === 1 ? pick(r, [10, 50, 25]) : L === 2 ? pick(r, [20, 30, 40, 75, 5]) : pick(r, [15, 35, 45, 60, 12]); const base = pick(r, L === 3 ? [20, 40, 60, 80, 120, 200, 300] : [20, 40, 60, 80, 120, 160, 200, 240, 360]);
        const ans = base * p / 100; if (!Number.isInteger(ans)) return this.gen(r, L);
        const ctx = pick(r, [[`£${base}`, 'a coat costing', 'How much is the discount?', '£'], [`${base} children`, 'a school of', 'How many is that?', ''], [`${base} g`, 'a bag of flour weighing', 'How many grams is that?', '']]);
        return { variant: `pcy6:${p}:${base}`, prompt: `What is ${p}% of ${base}?`, speak: `What is ${p} percent of ${base}?`, response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 0, 1000, 3, [base / 10, 5, base / 20].map(Math.round).filter(Boolean)),
          hint: `Find 10% first by dividing by 10: ${base / 10}. ${p % 10 === 5 ? 'Then halve it to get 5%.' : ''}`, alt: { kind: 'clue', text: `10% of ${base} = ${base / 10}` }, worked: `${p}% of ${base} = ${base} × ${p} ÷ 100 = ${ans}.` };
      } };
    M['ratio-proportion'] = { year: 'Y6', subject: 'maths', label: 'Ratio and proportion', nc: 'Y6 Ratio and proportion: relative sizes; scaling; unequal sharing and grouping using knowledge of fractions and multiples',
      gen(r, L) {
        if (L === 1) { const per = int(r, 2, 9), n = int(r, 2, 6), m = int(r, 7, 12); return { variant: `scale:${per}:${n}:${m}`, prompt: `${n} bags hold ${per * n} sweets. How many sweets are in ${m} bags?`, speak: `${n} bags hold ${per * n} sweets. How many sweets are in ${m} bags?`,
          response: 'choice-or-type', visual: null, answer: per * m, choices: numChoices(r, per * m, 1, 200, 3, [per, n, m]), hint: 'Find how many are in one bag first.', alt: { kind: 'clue', text: `${per * n} ÷ ${n} = ${per}` }, worked: `${per * n} ÷ ${n} = ${per} in each bag. ${per} × ${m} = ${per * m}.` }; }
        const a = int(r, 1, 4), b = int(r, a + 1, 7); const unit = int(r, 2, 12); const total = (a + b) * unit;
        if (L === 2) return { variant: `share:${a}:${b}:${total}`, prompt: `Share ${total} sweets in the ratio ${a} : ${b}. How many are in the bigger share?`, speak: `Share ${total} sweets in the ratio ${a} to ${b}. How many are in the bigger share?`,
          response: 'choice-or-type', visual: null, answer: b * unit, choices: numChoices(r, b * unit, 1, 300, 3, [unit, a * unit - b * unit, 2].map(Math.abs).filter(Boolean)), hint: `There are ${a + b} parts altogether. Find one part first.`, alt: { kind: 'clue', text: `${total} ÷ ${a + b} = ${unit}` }, worked: `${total} ÷ ${a + b} = ${unit}. The bigger share is ${b} × ${unit} = ${b * unit}.` };
        return { variant: `ratio3:${a}:${b}:${unit}`, prompt: `For every ${a} red beads there are ${b} blue beads. There are ${a * unit} red beads. How many blue beads are there?`, speak: `For every ${a} red beads there are ${b} blue beads. There are ${a * unit} red beads. How many blue beads?`,
          response: 'choice-or-type', visual: null, answer: b * unit, choices: numChoices(r, b * unit, 1, 300, 3, [unit, b, a].filter(x => x !== b * unit)), hint: `How many groups of ${a} red beads are there?`, alt: { kind: 'clue', text: `${a * unit} ÷ ${a} = ${unit} groups` }, worked: `${a * unit} ÷ ${a} = ${unit} groups. ${unit} × ${b} = ${b * unit} blue beads.` };
      } };
    M['algebra'] = { year: 'Y6', subject: 'maths', label: 'Algebra', nc: 'Y6 Algebra: use simple formulae; generate and describe linear number sequences; express missing number problems algebraically',
      gen(r, L) {
        if (L === 1) { const a = int(r, 2, 9), b = int(r, 1, 15), n = int(r, 2, 9); return { variant: `form:${a}n+${b}:${n}`, prompt: `If n = ${n}, what is ${a}n + ${b}?`, speak: `If n equals ${n}, what is ${a} n add ${b}?`, response: 'choice-or-type', visual: null, answer: a * n + b,
          choices: numChoices(r, a * n + b, 0, 200, 3, [a, b, n]), hint: `${a}n means ${a} × n.`, alt: { kind: 'clue', text: `${a} × ${n} + ${b}` }, worked: `${a} × ${n} = ${a * n}, + ${b} = ${a * n + b}.` }; }
        if (L === 2) { const a = int(r, 2, 9), x = int(r, 2, 12), b = int(r, 1, 20); const c = a * x + b; return { variant: `solve:${a}x+${b}=${c}`, prompt: `${a}x + ${b} = ${c}. What is x?`, speak: `${a} x add ${b} equals ${c}. What is x?`, response: 'choice-or-type', visual: null, answer: x,
          choices: numChoices(r, x, 0, 50, 3, [1, 2, b]), hint: `Take away ${b} from both sides, then divide by ${a}.`, alt: { kind: 'clue', text: `${a}x = ${c - b}` }, worked: `${c} − ${b} = ${c - b}. ${c - b} ÷ ${a} = ${x}.` }; }
        const step = int(r, 2, 9), start = int(r, -5, 10); const seq = [0, 1, 2, 3].map(i => start + i * step); const k = start - step;
        const ans = `${step}n ${k >= 0 ? '+' : '−'} ${Math.abs(k)}`.replace(/ [+−] 0$/, '');
        return { variant: `nth:${seq.join(',')}`, prompt: `What is the rule for the nth term? ${seq.join(', ')}, …`, speak: `What is the rule for the nth term of ${seq.join(', ')}?`, response: 'choice', visual: null, answer: ans,
          choices: textChoices(r, ans, [`${step}n ${start >= 0 ? '+' : '−'} ${Math.abs(start)}`.replace(/ [+−] 0$/, ''), `n + ${step}`, `${step + 1}n ${k >= 0 ? '+' : '−'} ${Math.abs(k)}`.replace(/ [+−] 0$/, '')]),
          hint: `The numbers go up by ${step}, so the rule starts ${step}n. Then check n = 1.`, alt: { kind: 'clue', text: `${step} × 1 = ${step}. The first term is ${start}.` }, worked: `Up by ${step} each time gives ${step}n. When n = 1, ${step}n = ${step}, and ${start} − ${step} = ${k}. So ${ans}.` };
      } };
    M['area-volume'] = { year: 'Y6', subject: 'maths', label: 'Area of triangles and volume of cuboids', nc: 'Y6 Measurement: area of parallelograms and triangles; volume of cubes and cuboids',
      gen(r, L) {
        if (L === 3) { const l = int(r, 2, 9), w = int(r, 2, 6), h = int(r, 2, 8); const v = l * w * h; return { variant: `vol:${l}x${w}x${h}`, prompt: 'What is the volume of this cuboid in cm³?', speak: 'What is the volume of this cuboid in cubic centimetres?',
          response: 'choice-or-type', visual: svgVisual(SVG.cuboid(l, w, h)), answer: v, choices: numChoices(r, v, 1, 1000, 3, [l * w, 2 * (l * w + w * h + l * h) - v, l + w + h].map(Math.abs).filter(x => x && x !== v)), hint: 'Volume = length × width × height.', alt: { kind: 'clue', text: `${l} × ${w} × ${h}` }, worked: `${l} × ${w} = ${l * w}, × ${h} = ${v} cm³.` }; }
        const b = int(r, 2, 12) * (L === 1 ? 1 : 2), h = int(r, 2, 10); const tri = L === 2 || r() < 0.5; const ans = tri ? b * h / 2 : b * h; if (!Number.isInteger(ans)) return this.gen(r, L);
        return { variant: `atp:${b}:${h}:${tri}`, prompt: `A ${tri ? 'triangle' : 'parallelogram'} has a base of ${b} cm and a perpendicular height of ${h} cm. What is its area?`, speak: `A ${tri ? 'triangle' : 'parallelogram'} has a base of ${b} centimetres and a height of ${h} centimetres. What is its area?`,
          response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 1, 200, 3, [tri ? b * h - ans : ans / 2, b + h, 2].map(Math.abs).filter(x => x && x !== ans)), hint: tri ? 'Area of a triangle = base × height ÷ 2.' : 'Area of a parallelogram = base × height.', alt: { kind: 'clue', text: tri ? `${b} × ${h} ÷ 2` : `${b} × ${h}` }, worked: tri ? `${b} × ${h} = ${b * h}, ÷ 2 = ${ans} cm².` : `${b} × ${h} = ${ans} cm².` };
      } };
    M['angles-polygons'] = { year: 'Y6', subject: 'maths', label: 'Angles in shapes', nc: 'Y6 Geometry: find unknown angles in triangles, quadrilaterals and regular polygons',
      gen(r, L) {
        if (L === 1) { const a = int(r, 30, 90), b = int(r, 20, 150 - a); const c = 180 - a - b; return { variant: `tri:${a}:${b}`, prompt: 'What is the missing angle in this triangle?', speak: `A triangle has angles of ${a} and ${b} degrees. What is the missing angle?`, response: 'choice-or-type',
          visual: svgVisual(SVG.triangle(a, b)), answer: c, choices: numChoices(r, c, 1, 179, 3, [10, 360 - a - b - c, 90 - c > 0 ? 90 - c : 15].map(Math.abs).filter(x => x && x !== c)), hint: 'Angles in a triangle add up to 180°.', alt: { kind: 'clue', text: `180 − ${a} − ${b}` }, worked: `180 − ${a} − ${b} = ${c}°.` }; }
        if (L === 2) { const a = int(r, 60, 120), b = int(r, 60, 120), c = int(r, 50, 110); const d = 360 - a - b - c; if (d < 30 || d > 170) return this.gen(r, L);
          return { variant: `quad:${a}:${b}:${c}`, prompt: `A quadrilateral has angles of ${a}°, ${b}° and ${c}°. What is the fourth angle?`, speak: `A quadrilateral has angles of ${a}, ${b} and ${c} degrees. What is the fourth angle?`, response: 'choice-or-type', visual: null, answer: d,
            choices: numChoices(r, d, 1, 359, 3, [180, 10, 20].map(x => Math.abs(x - d) || 5)), hint: 'Angles in a quadrilateral add up to 360°.', alt: { kind: 'clue', text: `360 − ${a} − ${b} − ${c}` }, worked: `360 − ${a} − ${b} − ${c} = ${d}°.` }; }
        const [sides, name] = pick(r, [[5, 'pentagon'], [6, 'hexagon'], [8, 'octagon'], [10, 'decagon'], [4, 'square'], [3, 'equilateral triangle']]); const ans = (sides - 2) * 180 / sides;
        return { variant: `poly:${sides}`, prompt: `What is each interior angle of a regular ${name}?`, speak: `What is each angle inside a regular ${name}?`, response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 1, 179, 3, [360 / sides, 180 - ans, 10].map(x => Math.abs(x)).filter(x => x && x !== ans)),
          hint: `The angles inside a shape with ${sides} sides add up to (${sides} − 2) × 180°. Share that equally.`, alt: { kind: 'clue', text: `${(sides - 2) * 180} ÷ ${sides}` }, worked: `(${sides} − 2) × 180 = ${(sides - 2) * 180}. ÷ ${sides} = ${ans}°.` };
      } };
    M['mean-average'] = { year: 'Y6', subject: 'maths', label: 'The mean', nc: 'Y6 Statistics: calculate and interpret the mean as an average',
      gen(r, L) {
        const n = L === 1 ? 3 : L === 2 ? 4 : 5; const mean = int(r, 4, 20); const vals = []; let total = mean * n;
        for (let i = 0; i < n - 1; i++) { const v = int(r, Math.max(1, mean - 6), mean + 6); vals.push(v); total -= v; }
        if (total < 1) return this.gen(r, L); vals.push(total);
        if (L === 3) { const missing = vals[n - 1]; return { variant: `meanm:${vals.join(',')}`, prompt: `The mean of ${n} numbers is ${mean}. Four of them are ${vals.slice(0, 4).join(', ')}. What is the fifth?`, speak: `The mean of ${n} numbers is ${mean}. Four of them are ${vals.slice(0, 4).join(', ')}. What is the fifth number?`,
          response: 'choice-or-type', visual: null, answer: missing, choices: numChoices(r, missing, 0, 200, 3, [mean, 5, 1].map(x => Math.abs(x - missing) || 3)), hint: `The total must be ${n} × ${mean} = ${mean * n}.`, alt: { kind: 'clue', text: `${mean * n} − (${vals.slice(0, 4).join(' + ')})` }, worked: `${mean * n} − ${vals.slice(0, 4).reduce((a, b) => a + b, 0)} = ${missing}.` }; }
        return { variant: `mean:${vals.join(',')}`, prompt: `What is the mean of ${vals.join(', ')}?`, speak: `What is the mean of ${vals.join(', ')}?`, response: 'choice-or-type', visual: null, answer: mean,
          choices: numChoices(r, mean, 0, 100, 3, [1, 2, n]), hint: 'Add them all up, then divide by how many numbers there are.', alt: { kind: 'clue', text: `(${vals.join(' + ')}) ÷ ${n}` }, worked: `${vals.join(' + ')} = ${mean * n}. ${mean * n} ÷ ${n} = ${mean}.` };
      } };
    M['coordinates-y6'] = { year: 'Y6', subject: 'maths', label: 'Coordinates in four quadrants', nc: 'Y6 Geometry: describe positions on the full coordinate grid (all four quadrants); reflect shapes in the axes',
      gen(r, L) {
        let x = int(r, -5, 5) || 3, y = int(r, -5, 5) || -2; if (x === y) y = -y || 4;
        if (L >= 2) { const axis = L === 2 ? 'y' : pick(r, ['x', 'y']); const nx = axis === 'y' ? -x : x, ny = axis === 'x' ? -y : y; const ans = `(${nx}, ${ny})`;
          return { variant: `refl:${x},${y}:${axis}`, prompt: `Point A (${x}, ${y}) is reflected in the ${axis}-axis. Where is the new point?`, speak: `Point A at ${x}, ${y} is reflected in the ${axis} axis. Where is the new point?`, response: 'choice', visual: svgVisual(SVG.grid(5, [{ x, y, label: 'A' }], true)),
            answer: ans, choices: textChoices(r, ans, [`(${-x}, ${-y})`, `(${axis === 'y' ? x : -x}, ${axis === 'x' ? y : -y})`, `(${y}, ${x})`]), hint: axis === 'y' ? 'Reflecting in the y-axis changes the sign of the first number.' : 'Reflecting in the x-axis changes the sign of the second number.', alt: { kind: 'clue', text: `The ${axis === 'y' ? 'x' : 'y'} coordinate changes sign.` }, worked: `(${x}, ${y}) becomes ${ans}.` }; }
        const ans = `(${x}, ${y})`;
        return { variant: `co4:${x},${y}`, prompt: 'What are the coordinates of point P?', speak: 'What are the coordinates of point P?', response: 'choice', visual: svgVisual(SVG.grid(5, [{ x, y, label: 'P' }], true)), answer: ans,
          choices: textChoices(r, ans, [`(${y}, ${x})`, `(${-x}, ${y})`, `(${x}, ${-y})`]), hint: 'Across first (left is negative), then up or down (down is negative).', alt: { kind: 'clue', text: 'Across, then up or down.' }, worked: `P is ${Math.abs(x)} ${x < 0 ? 'left' : 'right'} and ${Math.abs(y)} ${y < 0 ? 'down' : 'up'}, so ${ans}.` };
      } };
    M['mental-arithmetic'] = { year: 'Y6', subject: 'maths', label: 'Arithmetic (SATs and 11+ style)', nc: 'Y6 Calculation: perform mental calculations, including with mixed operations and large numbers (key stage 2 arithmetic paper style)',
      gen(r, L) {
        const kind = pick(r, L === 1 ? ['add', 'sub', 'mul'] : L === 2 ? ['mul', 'div', 'dec', 'pow10'] : ['dec', 'pow10', 'sq', 'pct']);
        let p, ans, w;
        if (kind === 'add') { const a = int(r, 1000, 9999), b = int(r, 100, 999); p = `${fmt(a)} + ${b}`; ans = a + b; w = `${fmt(a)} + ${b} = ${fmt(ans)}.`; }
        else if (kind === 'sub') { const a = int(r, 2000, 9999), b = int(r, 100, 1999); p = `${fmt(a)} − ${fmt(b)}`; ans = a - b; w = `${fmt(a)} − ${fmt(b)} = ${fmt(ans)}.`; }
        else if (kind === 'mul') { const a = int(r, 11, 99), b = int(r, 3, 9); p = `${a} × ${b}`; ans = a * b; w = `${a} × ${b} = ${ans}.`; }
        else if (kind === 'div') { const b = int(r, 3, 12), q = int(r, 12, 250); p = `${fmt(b * q)} ÷ ${b}`; ans = q; w = `${b} × ${q} = ${b * q}.`; }
        else if (kind === 'dec') { const a = int(r, 11, 99) / 10, b = int(r, 11, 99) / 10; const add = r() < 0.5; p = `${a} ${add ? '+' : '−'} ${b}`; ans = +(add ? a + b : a - b).toFixed(1); w = `${p} = ${ans}.`; }
        else if (kind === 'pow10') { const a = int(r, 2, 99) / 10, m = pick(r, [10, 100, 1000]); p = `${a} × ${fmt(m)}`; ans = +(a * m).toFixed(1); w = `Each digit moves ${String(m).length - 1} place${m > 10 ? 's' : ''} to the left: ${fmt(ans)}.`; }
        else if (kind === 'sq') { const a = int(r, 2, 12); p = `${a}² + ${a}`; ans = a * a + a; w = `${a}² = ${a * a}, + ${a} = ${ans}.`; }
        else { const pc = pick(r, [10, 20, 25, 50, 75]), b = pick(r, [40, 80, 120, 200, 240, 360, 400]); p = `${pc}% of ${b}`; ans = b * pc / 100; w = `${pc}% of ${b} = ${ans}.`; }
        const s = String(ans); const near = Number.isInteger(ans) ? numChoices(r, ans, -99999, 99999, 3, [1, 10, 100]) : shuffle(r, [ans, +(ans + 1).toFixed(1), +(ans - 0.1).toFixed(1)]).map(v => ({ value: v, label: String(v) }));
        return { variant: `arith:${p}`, prompt: `${p} = ?`, speak: `What is ${p.replace(/×/g, 'times').replace(/÷/g, 'divided by').replace(/−/g, 'minus').replace(/²/g, ' squared').replace(/%/g, ' percent')}?`, response: Number.isInteger(ans) ? 'choice-or-type' : 'choice', visual: null,
          answer: ans, choices: near, hint: 'Work it out on paper if you need to. Check your answer by estimating.', alt: { kind: 'clue', text: `Is your answer about the right size? ${s.length > 3 ? 'Round the numbers to check.' : ''}` }, worked: w };
      } };
    M['place-value-y6'] = { year: 'Y6', subject: 'maths', label: 'Large numbers and rounding', nc: 'Y6 Number: read, write, order and compare numbers up to 10,000,000; round any whole number to a required degree of accuracy; negative numbers in context',
      gen(r, L) {
        const n = int(r, 1000000, 9999999);
        if (L === 1) { const ans = Math.round(n / 1000000) * 1000000; return { variant: `r6m:${n}`, prompt: `Round ${fmt(n)} to the nearest million.`, speak: `Round ${n} to the nearest million.`, response: 'choice', visual: null, answer: ans,
          choices: shuffle(r, [...new Set([ans, Math.floor(n / 1e6) * 1e6, Math.ceil(n / 1e6) * 1e6, ans + 1e6])].slice(0, 3)).map(v => ({ value: v, label: fmt(v) })), hint: 'Look at the hundred thousands digit.', alt: { kind: 'clue', text: `${fmt(Math.floor(n / 1e6) * 1e6)} or ${fmt(Math.ceil(n / 1e6) * 1e6)}?` }, worked: `${fmt(n)} rounds to ${fmt(ans)}.` }; }
        if (L === 2) { const m = n + pick(r, [10000, -10000, 100000, -1000]); const ans = Math.max(n, m); return { variant: `cmp6:${n}:${m}`, prompt: `Which is larger: ${fmt(n)} or ${fmt(m)}?`, speak: `Which is larger: ${n} or ${m}?`, response: 'choice', visual: null, answer: ans,
          choices: [n, m].map(v => ({ value: v, label: fmt(v) })), hint: 'Compare digits from the left until they differ.', alt: { kind: 'clue', text: `${fmt(n)}\n${fmt(m)}` }, worked: `${fmt(ans)} is larger.` }; }
        const a = int(r, -15, -1), b = int(r, 1, 20); return { variant: `int6:${a}:${b}`, prompt: `How many steps is it from ${a} to ${b}?`, speak: `How many steps is it from minus ${-a} to ${b}?`, response: 'choice-or-type', visual: null, answer: b - a,
          choices: numChoices(r, b - a, 0, 50, 3, [2 * -a, 1, 2].map(x => Math.abs(x)).filter(Boolean)), hint: 'Count up to zero, then on from zero.', alt: { kind: 'clue', text: `${-a} + ${b}` }, worked: `${a} to 0 is ${-a}, 0 to ${b} is ${b}. ${-a} + ${b} = ${b - a}.` };
      } };

    // ================= English, Years 4 to 6 =================
    const spelling = (list, year, label, nc) => ({ year, subject: 'english', label, nc, gen(r, L) {
      const pool = L === 1 ? list.slice(0, Math.ceil(list.length / 2)) : list; const t = pick(r, pool);
      return { variant: `sp:${t.word}`, prompt: t.sentence.replace('___', '_____'), speak: `Which spelling is right? ${t.sentence.replace('___', t.word)}`, response: 'choice', visual: null, answer: t.word, choices: strChoices(r, t.word, t.wrong),
        hint: t.tip || 'Look carefully at each spelling. Say it slowly in syllables.', alt: { kind: 'clue', text: `It has ${t.word.length} letters and starts "${t.word.slice(0, 2)}"` }, worked: `The correct spelling is ${t.word}${t.tip ? `. ${t.tip}` : '.'}` };
    } });
    const W4 = [
      { word: 'accident', wrong: ['accedent', 'acident'], sentence: 'It was an ___ that the cup broke.' }, { word: 'actually', wrong: ['actualy', 'acshually'], sentence: 'I ___ enjoyed the film.' },
      { word: 'address', wrong: ['adress', 'addres'], sentence: 'Write your ___ on the envelope.' }, { word: 'appear', wrong: ['apear', 'appeer'], sentence: 'Stars ___ at night.' },
      { word: 'arrive', wrong: ['arive', 'arrieve'], sentence: 'When will the train ___?' }, { word: 'business', wrong: ['buisness', 'busness'], sentence: 'Her ___ sells bread.' },
      { word: 'calendar', wrong: ['calender', 'calandar'], sentence: 'Check the date on the ___.' }, { word: 'century', wrong: ['centery', 'sentury'], sentence: 'A ___ is one hundred years.' },
      { word: 'certain', wrong: ['certin', 'sertain'], sentence: 'Are you ___ it is right?' }, { word: 'complete', wrong: ['compleat', 'complet'], sentence: 'Please ___ the puzzle.' },
      { word: 'consider', wrong: ['concider', 'considder'], sentence: 'We will ___ your idea.' }, { word: 'continue', wrong: ['continew', 'contineu'], sentence: 'Please ___ reading.' },
      { word: 'decide', wrong: ['desside', 'decied'], sentence: 'You can ___ what to draw.' }, { word: 'describe', wrong: ['discribe', 'describ'], sentence: '___ the picture in your own words.' },
      { word: 'disappear', wrong: ['dissappear', 'disapear'], sentence: 'Watch the coin ___!' }, { word: 'exercise', wrong: ['excercise', 'exersize'], sentence: 'Daily ___ keeps you healthy.' },
      { word: 'experience', wrong: ['experiance', 'expirience'], sentence: 'The trip was a great ___.' }, { word: 'extreme', wrong: ['extreem', 'exstreme'], sentence: 'The ___ heat melted the ice.' },
      { word: 'guard', wrong: ['gard', 'gaurd'], sentence: 'A dog can ___ the house.' }, { word: 'imagine', wrong: ['imagin', 'immagine'], sentence: '___ you could fly.' },
      { word: 'interest', wrong: ['intrest', 'interist'], sentence: 'Space is my main ___.' }, { word: 'material', wrong: ['materiel', 'matirial'], sentence: 'What ___ is the coat made of?' },
      { word: 'medicine', wrong: ['medecine', 'medisin'], sentence: 'Take your ___ after lunch.' }, { word: 'naughty', wrong: ['norty', 'naughtey'], sentence: 'The puppy was very ___.' },
      { word: 'occasion', wrong: ['ocasion', 'occassion'], sentence: 'A wedding is a special ___.' }, { word: 'particular', wrong: ['perticular', 'particuler'], sentence: 'Is there a ___ book you want?' },
      { word: 'peculiar', wrong: ['peculier', 'pecular'], sentence: 'What a ___ noise!' }, { word: 'popular', wrong: ['populer', 'poppular'], sentence: 'Football is a ___ sport.' },
      { word: 'possession', wrong: ['posession', 'possesion'], sentence: 'This watch is my favourite ___.' }, { word: 'pressure', wrong: ['presure', 'preshure'], sentence: 'Check the tyre ___.' },
      { word: 'purpose', wrong: ['perpose', 'purpos'], sentence: 'What is the ___ of this button?' }, { word: 'regular', wrong: ['reguler', 'regullar'], sentence: 'Brush your teeth at ___ times.' },
      { word: 'sentence', wrong: ['sentance', 'sentense'], sentence: 'Start each ___ with a capital letter.' }, { word: 'strength', wrong: ['strenth', 'strenghth'], sentence: 'Lifting weights builds ___.' },
      { word: 'suppose', wrong: ['supose', 'suppoze'], sentence: 'I ___ you are right.' }, { word: 'therefore', wrong: ['therfore', 'therefor'], sentence: 'It rained, ___ we stayed in.' }
    ];
    const W56 = [
      { word: 'accommodate', wrong: ['accomodate', 'acommodate'], sentence: 'The hotel can ___ forty guests.', tip: 'Double c and double m.' }, { word: 'achieve', wrong: ['acheive', 'achive'], sentence: 'You can ___ your goals.', tip: 'i before e: achieve.' },
      { word: 'aggressive', wrong: ['agressive', 'aggresive'], sentence: 'The dog was not ___.' }, { word: 'amateur', wrong: ['amature', 'amatuer'], sentence: 'He is an ___ photographer.' },
      { word: 'ancient', wrong: ['anceint', 'anshent'], sentence: 'We visited an ___ castle.' }, { word: 'apparent', wrong: ['apparant', 'aparent'], sentence: 'It soon became ___ that we were lost.' },
      { word: 'available', wrong: ['availible', 'avaliable'], sentence: 'Tickets are ___ online.' }, { word: 'awkward', wrong: ['akward', 'awkard'], sentence: 'There was an ___ silence.' },
      { word: 'bargain', wrong: ['bargin', 'bargian'], sentence: 'The jumper was a ___ at £5.' }, { word: 'category', wrong: ['catagory', 'catergory'], sentence: 'Which ___ does a whale belong to?' },
      { word: 'cemetery', wrong: ['cemetary', 'semetery'], sentence: 'Flowers grew in the old ___.' }, { word: 'committee', wrong: ['commitee', 'comittee'], sentence: 'The ___ voted on the plan.', tip: 'Double m, double t, double e.' },
      { word: 'conscience', wrong: ['concience', 'conscence'], sentence: 'Her ___ told her to own up.' }, { word: 'controversy', wrong: ['contraversy', 'controversey'], sentence: 'The new rule caused ___.' },
      { word: 'curiosity', wrong: ['curiousity', 'curiocity'], sentence: '___ made the cat look inside.' }, { word: 'definite', wrong: ['definate', 'defenite'], sentence: 'Is that a ___ yes?', tip: 'Think "finite": defi-nite.' },
      { word: 'desperate', wrong: ['desparate', 'desprate'], sentence: 'The thirsty dog was ___ for water.' }, { word: 'embarrass', wrong: ['embarass', 'embarras'], sentence: 'Please do not ___ me!', tip: 'Double r and double s.' },
      { word: 'environment', wrong: ['enviroment', 'envirnment'], sentence: 'We must protect the ___.', tip: 'There is an n before the m: enviro-n-ment.' }, { word: 'exaggerate', wrong: ['exagerate', 'exaggarate'], sentence: 'Do not ___ the story.' },
      { word: 'excellent', wrong: ['excelent', 'exellent'], sentence: 'That was an ___ answer.' }, { word: 'familiar', wrong: ['familar', 'famillar'], sentence: 'Her face looked ___.' },
      { word: 'foreign', wrong: ['foriegn', 'forein'], sentence: 'He speaks a ___ language.' }, { word: 'government', wrong: ['goverment', 'govenment'], sentence: 'The ___ makes new laws.', tip: 'Govern + ment.' },
      { word: 'guarantee', wrong: ['garantee', 'guarentee'], sentence: 'The toy has a one-year ___.' }, { word: 'immediately', wrong: ['immediatly', 'imediately'], sentence: 'Come here ___!' },
      { word: 'interrupt', wrong: ['interupt', 'interrrupt'], sentence: 'Please do not ___ the speaker.' }, { word: 'leisure', wrong: ['liesure', 'leasure'], sentence: 'We went to the ___ centre.' },
      { word: 'lightning', wrong: ['lightening', 'litning'], sentence: 'Thunder and ___ filled the sky.' }, { word: 'marvellous', wrong: ['marvelous', 'marvellus'], sentence: 'What a ___ performance!' },
      { word: 'mischievous', wrong: ['mischievious', 'mischevous'], sentence: 'The ___ monkey stole a hat.' }, { word: 'necessary', wrong: ['neccessary', 'necesary'], sentence: 'Is it ___ to bring a coat?', tip: 'One collar (c), two sleeves (ss).' },
      { word: 'neighbour', wrong: ['nieghbour', 'neighbor'], sentence: 'Our ___ has a cat.' }, { word: 'nuisance', wrong: ['nuisence', 'nusance'], sentence: 'The buzzing fly was a ___.' },
      { word: 'opportunity', wrong: ['oportunity', 'opportunaty'], sentence: 'This is a great ___.' }, { word: 'parliament', wrong: ['parlament', 'parliment'], sentence: 'Laws are debated in ___.' },
      { word: 'persuade', wrong: ['pursuade', 'persuaid'], sentence: 'Can you ___ him to come?' }, { word: 'privilege', wrong: ['priviledge', 'privelege'], sentence: 'It is a ___ to meet you.' },
      { word: 'pronunciation', wrong: ['pronounciation', 'pronunsiation'], sentence: 'Check the ___ of the word.' }, { word: 'queue', wrong: ['que', 'queu'], sentence: 'We waited in a long ___.' },
      { word: 'recognise', wrong: ['recognice', 'reconise'], sentence: 'Did you ___ the song?' }, { word: 'recommend', wrong: ['reccomend', 'recomend'], sentence: 'I ___ this book.' },
      { word: 'restaurant', wrong: ['restaraunt', 'resturant'], sentence: 'We ate at a ___.' }, { word: 'rhythm', wrong: ['rythm', 'rhythem'], sentence: 'Clap to the ___.' },
      { word: 'secretary', wrong: ['secetary', 'secratary'], sentence: 'The ___ answered the phone.' }, { word: 'sincerely', wrong: ['sincerly', 'sinserely'], sentence: 'Yours ___, Mr Patel.' },
      { word: 'sufficient', wrong: ['sufficent', 'suficient'], sentence: 'Is there ___ food for everyone?' }, { word: 'temperature', wrong: ['temprature', 'temperture'], sentence: 'The ___ dropped below zero.' },
      { word: 'thorough', wrong: ['thurough', 'thorogh'], sentence: 'Give the room a ___ clean.' }, { word: 'twelfth', wrong: ['twelth', 'twelvth'], sentence: 'It is her ___ birthday.' },
      { word: 'vehicle', wrong: ['vehical', 'veicle'], sentence: 'A bus is a large ___.' }, { word: 'yacht', wrong: ['yatch', 'yaught'], sentence: 'The ___ sailed across the bay.' }
    ];
    if (C.KNOWN) for (const x of [...W4, ...W56]) C.KNOWN.add(x.word.toLowerCase());
    const E = {};
    E['spelling-y4'] = spelling(W4, 'Y4', 'Spelling words (Years 3 and 4 list)', 'Y4 Spelling: words from the statutory years 3 and 4 word list');
    E['spelling-y5'] = spelling(W56.slice(0, 26), 'Y5', 'Spelling words (Years 5 and 6 list, part 1)', 'Y5 Spelling: words from the statutory years 5 and 6 word list');
    E['spelling-y6'] = spelling(W56.slice(26), 'Y6', 'Spelling words (Years 5 and 6 list, part 2)', 'Y6 Spelling: words from the statutory years 5 and 6 word list');
    const choiceItem = (id, year, label, nc, bank, hint) => ({ year, subject: 'english', label, nc, gen(r, L) {
      const pool = bank[L] || bank[1]; const it = pick(r, pool); const [prompt, ans, wrong, explain] = it;
      return { variant: `${id}:${prompt}`, prompt: prompt.replace('___', '_____'), speak: prompt.replace('___', 'blank'), response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong),
        hint: typeof hint === 'function' ? hint(L) : hint, alt: { kind: 'clue', text: explain || hint }, worked: explain || `The answer is "${ans}".` };
    } });
    E['apostrophes'] = choiceItem('apo', 'Y4', 'Possessive apostrophes', 'Y4 Punctuation: apostrophes to mark plural possession', {
      1: [['The ___ bone was buried in the garden. (one dog)', "dog's", ['dogs', "dogs'"], 'One dog owns the bone: dog + \'s.'], ['My ___ bike is red. (one sister)', "sister's", ['sisters', "sisters'"], 'One sister: sister + \'s.'], ['The ___ tail was fluffy. (one cat)', "cat's", ['cats', "cats'"], 'One cat: cat + \'s.']],
      2: [['The ___ coats were on the pegs. (many girls)', "girls'", ["girl's", 'girls'], 'Many girls: girls + \' after the s.'], ['The ___ nests were high up. (many birds)', "birds'", ["bird's", 'birds'], 'Many birds: birds + \'.'], ['All the ___ cars were parked outside. (many teachers)', "teachers'", ["teacher's", 'teachers'], 'Plural ending in s: add \' after the s.']],
      3: [['The ___ toys were everywhere. (many children)', "children's", ["childrens'", 'childrens'], 'Children does not end in s, so add \'s.'], ['The ___ changing room is on the left. (many men)', "men's", ["mens'", 'mens'], 'Men does not end in s, so add \'s.'], ['___ book is this? It is ___. (one James)', "James's", ["James'es", 'Jameses'], 'A name ending in s still takes \'s for one owner.']]
    }, 'One owner: add \'s. Many owners ending in s: add \' after the s.');
    // Fix the item that has two blanks: keep only single-blank items
    E['apostrophes'].gen = ((orig) => function (r, L) { let q; do { q = orig.call(this, r, L); } while (q.prompt.split('_____').length > 2); return q; })(E['apostrophes'].gen);
    E['fronted-adverbials'] = choiceItem('fa', 'Y4', 'Fronted adverbials and commas', 'Y4 Grammar: fronted adverbials, using commas after them', {
      1: [['Which sentence is punctuated correctly?', 'After lunch, we played football.', ['After lunch we, played football.', 'After, lunch we played football.'], 'A fronted adverbial is followed by a comma.'], ['Which sentence is punctuated correctly?', 'Later that day, it snowed.', ['Later, that day it snowed.', 'Later that, day it snowed.'], 'Put the comma after the whole opening phrase.']],
      2: [['Which words are the fronted adverbial? "As quick as a flash, the cat pounced."', 'As quick as a flash', ['the cat pounced', 'the cat'], 'It comes at the front and tells us how the cat pounced.'], ['Which words are the fronted adverbial? "In the morning, we packed our bags."', 'In the morning', ['we packed', 'our bags'], 'It tells us when, and comes first.']],
      3: [['Which is the best fronted adverbial? "___, the fox crept towards the henhouse."', 'Silently', ['Silent', 'Silence'], 'An adverb describes how the fox crept.'], ['Which is the best fronted adverbial? "___, she finished her homework."', 'Eventually', ['Eventual', 'Event'], 'Eventually is an adverb telling us when.']]
    }, 'A fronted adverbial starts the sentence and tells us how, when or where. It is followed by a comma.');
    E['standard-english'] = choiceItem('se', 'Y4', 'Standard English', 'Y4 Grammar: use of the standard English forms for verb inflections instead of local spoken forms', {
      1: [['We ___ going to the park.', 'were', ['was'], 'With "we", use "were".'], ['They ___ really happy.', 'were', ['was'], 'With "they", use "were".'], ['I ___ my homework yesterday.', 'did', ['done'], '"I did" is standard English. "Done" needs "have": I have done.']],
      2: [['She ___ the race last week.', 'won', ['winned'], 'The past of win is won.'], ['He ___ his lunch already.', 'has eaten', ['has ate'], 'Use "eaten" after has.'], ['We ___ the film on Friday.', 'saw', ['seen'], '"Seen" needs has or have.']],
      3: [['Which sentence uses standard English?', 'Those books are mine.', ['Them books are mine.', 'Them books is mine.'], 'Use "those", not "them", before a noun.'], ['Which sentence uses standard English?', "I haven't got any sweets.", ["I haven't got no sweets.", "I ain't got no sweets."], 'Avoid two negatives.']]
    }, 'Standard English is the form used in formal writing.');
    const HOMO4 = { 1: [["I'm going to ___ the ball to you.", 'throw', ['through']], ['The cat ran ___ the door.', 'through', ['threw', 'throw']], ['Can you ___ the knot?', 'untie', ['untidy']]],
      2: [['The rain did not ___ the game.', 'affect', ['effect']], ['The medicine had a good ___.', 'effect', ['affect']], ['I ate a ___ of cake.', 'piece', ['peace']]],
      3: [['The queen began her ___ in 1952.', 'reign', ['rain', 'rein']], ['Hold the horse by the ___.', 'rein', ['rain', 'reign']], ['A ___ of cows walked across the field.', 'herd', ['heard']]] };
    E['homophones-y4'] = { year: 'Y4', subject: 'english', label: 'Words that sound the same (Year 4)', nc: 'Y4 Spelling: homophones and near-homophones', gen(r, L) {
      const [s, ans, wrong] = pick(r, HOMO4[L]); return { variant: `h4:${s}`, prompt: s.replace('___', '_____'), speak: `Which word fits? ${s.replace('___', ans)}`, response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong),
        hint: 'These sound alike. Think about the meaning.', alt: { kind: 'clue', text: 'Read the whole sentence.' }, worked: s.replace('___', ans) }; } };
    const PASS = {
      Y4: [{ text: 'Penguins cannot fly, but they are excellent swimmers. Their wings work like flippers, pushing them through icy water at great speed. Emperor penguins can stay underwater for over twenty minutes while they hunt for fish.', qs: [['What do penguin wings work like?', 'flippers', ['sails', 'paddles']], ['What do emperor penguins hunt for?', 'fish', ['seals', 'krill and plants']], ['How long can emperor penguins stay underwater?', 'over twenty minutes', ['about two minutes', 'one hour']]] },
        { text: 'Amara had practised her lines every evening for a week. On the night of the play, her hands shook as the curtain rose. Then she saw her grandad in the front row, smiling, and suddenly the words came easily.', qs: [['How did Amara feel when the curtain rose?', 'nervous', ['bored', 'angry']], ['What helped Amara feel better?', 'seeing her grandad smiling', ['forgetting her lines', 'the curtain falling']], ['How long had Amara practised?', 'a week', ['a month', 'one evening']]] }],
      Y5: [{ text: 'The River Thames flows for about 215 miles, from the Cotswolds to the North Sea. For centuries it was London\'s busiest road, carrying goods and people. Today it is cleaner than it was fifty years ago, and seals are sometimes spotted near the city.', qs: [['Where does the Thames flow to?', 'the North Sea', ['the Cotswolds', 'the Irish Sea']], ['Why was the Thames called London\'s busiest road?', 'it carried goods and people', ['it had many bridges', 'cars drove beside it']], ['What does the passage suggest about the river today?', 'it is cleaner than before', ['it is more polluted', 'nobody uses it']]] },
        { text: 'Leo glared at the broken vase. He knew he should tell his mum, yet the words stuck in his throat. When she walked in, he took a deep breath and said, "It was me. I\'m sorry." To his surprise, she hugged him.', qs: [['Why did Leo find it hard to speak?', 'he was worried about owning up', ['he had a sore throat', 'he was laughing']], ['How did Leo\'s mum react?', 'she hugged him', ['she shouted', 'she left the room']], ['Which word shows Leo was cross?', 'glared', ['breath', 'surprise']]] }],
      Y6: [{ text: 'Honeybees communicate through a remarkable "waggle dance". When a forager discovers flowers rich in nectar, she returns to the hive and performs a figure-of-eight pattern. The angle of her dance shows the direction of the flowers, while its length indicates how far away they are.', qs: [['What does the angle of the dance show?', 'the direction of the flowers', ['how far away the flowers are', 'how much nectar there is']], ['What does "remarkable" mean in this passage?', 'surprising and impressive', ['ordinary', 'difficult to see']], ['What shape is the waggle dance?', 'a figure of eight', ['a circle', 'a straight line']]] },
        { text: 'Although the storm had passed, the village was silent. Fallen branches blocked the lane, and the old oak by the church lay on its side. Mrs Okafor, who had lived there for sixty years, stood at her gate and shook her head slowly. "I never thought I would see that tree fall," she whispered.', qs: [['How does Mrs Okafor feel about the oak?', 'shocked and sad', ['pleased', 'angry with the storm']], ['What blocked the lane?', 'fallen branches', ['the old oak', 'a flood']], ['How long had Mrs Okafor lived in the village?', 'sixty years', ['six years', 'sixteen years']]] }]
    };
    for (const y of ['Y4', 'Y5', 'Y6']) E[`reading-${y.toLowerCase()}`] = { year: y, subject: 'english', label: `Reading and understanding (${C.YEAR_LABEL[y]})`, nc: `${y} Reading comprehension: retrieve and record information; draw inferences; explain the meaning of words in context`, gen(r, L) {
      const p = pick(r, PASS[y]); const q = pick(r, L === 1 ? p.qs.slice(0, 1) : p.qs);
      return { variant: `rd:${q[0]}`, prompt: q[0], speak: q[0], response: 'choice', visual: { kind: 'passage', text: p.text }, answer: q[1], choices: strChoices(r, q[1], q[2]),
        hint: 'Find the sentence that answers the question. Some answers need you to think about how a character feels.', alt: { kind: 'clue', text: 'Read the passage again slowly.' }, worked: `The best answer is "${q[1]}".` }; } };
    E['word-endings-y5'] = choiceItem('we5', 'Y5', 'Tricky word endings', 'Y5 Spelling: endings -cious/-tious, -cial/-tial, -ant/-ance/-ancy, -ent/-ence/-ency, -able/-ible', {
      1: [['A diamond is very ___.', 'precious', ['pretious', 'precius'], 'Words from a root ending in -ce often use -cious.'], ['She is very ___ and wants to be a pilot.', 'ambitious', ['ambicious', 'ambitius'], 'Ambition → ambitious.'], ['The film was ___ and made me jump.', 'suspicious', ['suspitious', 'suspisious'], 'Suspicion → suspicious.']],
      2: [['The ___ letter came from the head teacher.', 'official', ['offitial', 'offishal'], '-cial is common after a vowel.'], ['Water is ___ for life.', 'essential', ['essencial', 'esential'], '-tial is common after a consonant.'], ['Lessons are ___ to everyone.', 'available', ['availible', 'availabel'], 'Most words end in -able.']],
      3: [['The castle is very ___. You can visit it.', 'accessible', ['accessable', 'acessible'], '-ible often follows ss.'], ['Please be ___ while you wait.', 'patient', ['pashent', 'patiant'], 'Patience → patient.'], ['His ___ in the race was a surprise.', 'appearance', ['appearence', 'apearance'], 'Appear → appearance.']]
    }, 'Say the word slowly and think about a related word.');
    E['relative-clauses'] = choiceItem('rc', 'Y5', 'Relative clauses', 'Y5 Grammar: relative clauses beginning with who, which, where, when, whose, that', {
      1: [['The girl ___ won the race is my cousin.', 'who', ['which', 'where'], 'Use who for people.'], ['The bike, ___ was red, was stolen.', 'which', ['who', 'whose'], 'Use which for things.'], ['That is the park ___ we play football.', 'where', ['who', 'which'], 'Use where for places.']],
      2: [['The boy ___ dog barked was embarrassed.', 'whose', ['who', 'which'], 'Whose shows belonging.'], ['I remember the day ___ we moved house.', 'when', ['where', 'whose'], 'Use when for times.'], ['The cake ___ Mum made was delicious.', 'that', ['who', 'where'], 'That can introduce a relative clause about a thing.']],
      3: [['Which part is the relative clause? "My uncle, who lives in Leeds, is a chef."', 'who lives in Leeds', ['My uncle', 'is a chef'], 'It adds extra information about the uncle.'], ['Which part is the relative clause? "The book that I borrowed was brilliant."', 'that I borrowed', ['The book', 'was brilliant'], 'It tells us which book.']]
    }, 'Who for people, which for things, where for places, when for times, whose for belonging.');
    E['modal-verbs'] = choiceItem('mv', 'Y5', 'Modal verbs and possibility', 'Y5 Grammar: indicating degrees of possibility using adverbs or modal verbs', {
      1: [['Which word is a modal verb? "You should wear a coat."', 'should', ['wear', 'coat'], 'Modal verbs include can, could, will, would, should, must, might, may.'], ['Which word is a modal verb? "We might go swimming."', 'might', ['go', 'swimming'], 'Might shows possibility.']],
      2: [['Which word shows that something is certain?', 'will', ['might', 'could'], 'Will is the most certain.'], ['Which word shows the least certainty?', 'might', ['will', 'must'], 'Might shows only a possibility.']],
      3: [['Which adverb shows the most certainty?', 'definitely', ['perhaps', 'possibly'], 'Definitely means for sure.'], ['Which adverb shows possibility?', 'perhaps', ['certainly', 'definitely'], 'Perhaps means it may or may not happen.']]
    }, 'Some words show how sure we are: will, must and definitely are sure. Might, could and perhaps are less sure.');
    E['parenthesis'] = choiceItem('par', 'Y5', 'Brackets, dashes and commas', 'Y5 Punctuation: brackets, dashes or commas to indicate parenthesis', {
      1: [['Which sentence uses brackets correctly?', 'My dog (a spaniel) loves the beach.', ['My dog (a spaniel loves) the beach.', '(My dog) a spaniel loves the beach.'], 'Brackets go around the extra information only.']],
      2: [['Which sentence uses commas for parenthesis correctly?', 'The Thames, a famous river, flows through London.', ['The Thames a famous, river flows through London.', 'The, Thames a famous river flows through London.'], 'Commas go on both sides of the extra information.']],
      3: [['Which sentence uses dashes correctly?', 'Our teacher – who loves poetry – read to us.', ['Our teacher who – loves poetry read to us.', '– Our teacher who loves poetry read to us.'], 'A pair of dashes surrounds the extra information.']]
    }, 'Parenthesis is extra information. The sentence still makes sense without it.');
    const HOMO56 = { 1: [['Can you give me some ___?', 'advice', ['advise']], ['I ___ you to wear a helmet.', 'advise', ['advice']], ['We go to football ___ on Mondays.', 'practice', ['practise']]],
      2: [['I need to ___ my spellings.', 'practise', ['practice']], ['The car was ___ at the lights.', 'stationary', ['stationery']], ['We bought pens from the ___ shop.', 'stationery', ['stationary']]],
      3: [['The head teacher is called the ___.', 'principal', ['principle']], ['Honesty is an important ___.', 'principle', ['principal']], ['We are ___ to talk now.', 'allowed', ['aloud']], ['Read the poem ___.', 'aloud', ['allowed']], ['We had ice cream for ___.', 'dessert', ['desert']]] };
    E['homophones-y5'] = { year: 'Y5', subject: 'english', label: 'Words that sound the same (Years 5 and 6)', nc: 'Y5 Spelling: homophones and other words that are often confused', gen(r, L) {
      const [s, ans, wrong] = pick(r, HOMO56[L]); return { variant: `h5:${s}`, prompt: s.replace('___', '_____'), speak: `Which word fits? ${s.replace('___', ans)}`, response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong),
        hint: '-ice words are nouns (things). -ise words are verbs (actions). Stationery with an e is envelopes.', alt: { kind: 'clue', text: 'Is it a thing or an action?' }, worked: s.replace('___', ans) }; } };
    E['passive-voice'] = choiceItem('pv', 'Y6', 'Active and passive voice', 'Y6 Grammar: use of the passive to affect the presentation of information in a sentence', {
      1: [['Which sentence is in the passive voice?', 'The window was broken by the ball.', ['The ball broke the window.', 'The ball is breaking the window.'], 'In the passive, the thing that the action happens to comes first.'], ['Which sentence is in the passive voice?', 'The cake was eaten by the children.', ['The children ate the cake.', 'The children are eating cake.'], 'Was + eaten shows the passive.']],
      2: [['Which is the passive version of "The dog chased the cat"?', 'The cat was chased by the dog.', ['The dog was chased by the cat.', 'The cat chased the dog.'], 'The cat becomes the subject. Add was + chased by.'], ['Which is the passive version of "Sam wrote the letter"?', 'The letter was written by Sam.', ['Sam was written by the letter.', 'The letter wrote Sam.'], 'The letter becomes the subject.']],
      3: [['Which is the active version of "The match was won by our team"?', 'Our team won the match.', ['The match won our team.', 'Our team was won by the match.'], 'Put the one doing the action first.'], ['Which is the active version of "The song was sung by the choir"?', 'The choir sang the song.', ['The song sang the choir.', 'The choir was sung by the song.'], 'The choir did the singing.']]
    }, 'Active: the doer comes first. Passive: the thing being acted on comes first, often with "was ... by".');
    E['formal-language'] = choiceItem('fl', 'Y6', 'Formal language and the subjunctive', 'Y6 Grammar: vocabulary and structures for formal writing, including the subjunctive', {
      1: [['Which is the most formal?', 'Please could you send the information?', ['Send me the info.', 'Gimme the info, yeah?'], 'Formal language is polite and avoids slang.'], ['Which is the most formal way to end a letter?', 'Yours sincerely', ['See ya', 'Cheers']]],
      2: [['Which word is more formal than "get"?', 'receive', ['grab', 'nab'], 'Receive is formal.'], ['Which word is more formal than "find out"?', 'discover', ['twig', 'suss'], 'Discover is formal.']],
      3: [['If I ___ you, I would apologise.', 'were', ['was', 'am'], 'The subjunctive uses "were" after "if I".'], ['The teacher asked that every pupil ___ on time.', 'be', ['is', 'are'], 'The subjunctive uses "be" for demands.']]
    }, 'Formal writing avoids slang and contractions. The subjunctive uses "were" and "be" in special sentences.');
    E['punctuation-y6'] = choiceItem('p6', 'Y6', 'Semicolons, colons and hyphens', 'Y6 Punctuation: semicolons, colons or dashes between independent clauses; colons to introduce a list; hyphens to avoid ambiguity', {
      1: [['Which sentence uses a colon correctly?', 'Bring three things: a pen, a ruler and a rubber.', ['Bring: three things a pen, a ruler and a rubber.', 'Bring three: things a pen, a ruler and a rubber.'], 'A colon introduces a list after a complete sentence.']],
      2: [['Which sentence uses a semicolon correctly?', 'It was raining; we stayed inside.', ['It was; raining we stayed inside.', 'It was raining we; stayed inside.'], 'A semicolon joins two linked sentences.']],
      3: [['Which phrase needs a hyphen to make the meaning clear?', 'a man-eating shark', ['a big shark', 'a grey shark'], 'Without the hyphen it reads as a man eating a shark.'], ['Which shows the correct hyphen?', 'a well-known author', ['a well known-author', 'a-well known author'], 'Well-known describes the author as one idea.']]
    }, 'A colon introduces a list or an explanation. A semicolon joins two closely linked sentences. A hyphen joins words to make one meaning.');
    E['synonyms-antonyms'] = choiceItem('syn', 'Y6', 'Synonyms and antonyms', 'Y6 Vocabulary: how words are related by meaning as synonyms and antonyms', {
      1: [['Which word means the same as "huge"?', 'enormous', ['tiny', 'thin']], ['Which word means the same as "begin"?', 'start', ['finish', 'stop']], ['Which word means the opposite of "ancient"?', 'modern', ['old', 'aged']]],
      2: [['Which word means the same as "furious"?', 'enraged', ['calm', 'tired']], ['Which word means the opposite of "generous"?', 'mean', ['kind', 'giving']], ['Which word means the same as "fragile"?', 'delicate', ['sturdy', 'heavy']]],
      3: [['Which word means the opposite of "reluctant"?', 'eager', ['unwilling', 'slow']], ['Which word means the same as "conceal"?', 'hide', ['show', 'reveal']], ['Which word means the opposite of "transparent"?', 'opaque', ['clear', 'shiny']]]
    }, 'A synonym means the same. An antonym means the opposite.');

    C.install(Object.assign({}, M, E));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = pack; else pack(root.LLCurriculum);
})(typeof window !== 'undefined' ? window : globalThis);
