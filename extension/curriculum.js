/* LearnLoop question bank, aligned to the national curriculum in England.
 *
 * Sources (Crown copyright, Open Government Licence v3.0). The curriculum statements are referenced, the questions are original:
 *  - Early years foundation stage statutory framework for group and school-based providers (in force from 1 September 2026),
 *    early learning goals for Number, Numerical Patterns and Word Reading.
 *  - The national curriculum in England: mathematics programmes of study, key stages 1 and 2 (2014).
 *  - The national curriculum in England: English programmes of study, key stages 1 and 2 (2014), including spelling appendix 1
 *    and vocabulary, grammar and punctuation appendix 2.
 *
 * Every skill has three levels. Level 1 is the gentlest version of the curriculum statement, level 3 the fullest.
 * Maths answers are calculated. English items are written and reviewed by hand. No AI model writes or marks anything here.
 */
(function (root) {
  'use strict';
  const CONTENT_VERSION = '0.4.0';
  const YEARS = ['R', 'Y1', 'Y2', 'Y3'];
  const YEAR_LABEL = { R: 'Reception', Y1: 'Year 1', Y2: 'Year 2', Y3: 'Year 3' };

  // ---------- helpers ----------
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function numChoices(r, ans, lo, hi, n = 3, near = [1, 2, 10]) {
    const set = new Set([ans]);
    const cands = shuffle(r, near.flatMap(d => [ans - d, ans + d]).filter(x => x >= lo && x <= hi && x !== ans));
    for (const c of cands) { if (set.size >= n) break; set.add(c); }
    let guard = 0;
    while (set.size < n && guard++ < 200) set.add(int(r, lo, hi));
    return shuffle(r, [...set]).map(v => ({ value: v, label: String(v) }));
  }
  const strChoices = (r, correct, wrongs) => shuffle(r, [correct, ...wrongs]).map(v => ({ value: v, label: v }));
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const pence = (p) => p < 100 ? `${p}p` : `£${(p / 100).toFixed(2)}`;
  const say = (s) => s.replace(/−/g, ' take away ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/\+/g, ' add ').replace(/=/g, ' equals ').replace(/\?/g, ' what ');

  // ---------- pictures (emoji drawn by the Windows font). alt lists other names a child might use ----------
  const PIC = {
    sun: ['☀️'], sock: ['🧦', 'socks'], snake: ['🐍'], moon: ['🌙'], mouse: ['🐭'], monkey: ['🐒'], bus: ['🚌'], bee: ['🐝'], banana: ['🍌'],
    dog: ['🐕', 'puppy'], duck: ['🦆'], drum: ['🥁'], fish: ['🐟'], fox: ['🦊'], frog: ['🐸'], pig: ['🐷'], penguin: ['🐧'], pear: ['🍐'],
    cat: ['🐱', 'kitten', 'kitty'], cake: ['🎂', 'birthday cake'], cow: ['🐮'], horse: ['🐴', 'pony'], house: ['🏠', 'home'], hat: ['🎩'],
    tiger: ['🐯'], tree: ['🌳'], tent: ['⛺'], rabbit: ['🐰', 'bunny'], rocket: ['🚀'], rainbow: ['🌈'], lion: ['🦁'], leaf: ['🍃', 'leaves'],
    lemon: ['🍋'], goat: ['🐐'], grapes: ['🍇'], guitar: ['🎸'], watermelon: ['🍉', 'melon'], worm: ['🪱'], window: ['🪟'],
    bed: ['🛏️'], hen: ['🐔', 'chicken'], cup: ['☕', 'mug'], box: ['📦', 'parcel'], bat: ['🦇'], web: ['🕸️'], van: ['🚐'], map: ['🗺️'],
    pen: ['🖊️'], bug: ['🐛', 'caterpillar'], ship: ['🚢', 'boat'], chick: ['🐥'], ring: ['💍'], shell: ['🐚'],
    log: ['🪵', 'wood'], key: ['🔑'], car: ['🚗'], spoon: ['🥄'], boat: ['⛵', 'sailboat'], coat: ['🧥', 'jacket'],
    bear: ['🐻', 'teddy'], chair: ['🪑'], king: ['🤴', 'prince'], star: ['⭐'], ball: ['⚽', 'football'], apple: ['🍎']
  };
  const pic = (w) => PIC[w][0];
  const namesOf = (w) => [w, ...PIC[w].slice(1)];

  // =====================================================================================
  // MATHS
  // =====================================================================================
  const OBJECTS = [['🍎', 'apples', 'apple'], ['⭐', 'stars', 'star'], ['🐟', 'fish', 'fish'], ['🌸', 'flowers', 'flower'], ['🚗', 'cars', 'car'], ['🎈', 'balloons', 'balloon']];
  const M = {};

  // ---- Reception (EYFS early learning goals: Number, Numerical Patterns) ----
  M['count-objects'] = { year: 'R', label: 'Counting objects', nc: 'EYFS Number: deep understanding of numbers to 10; subitise up to 5',
    gen(r, L) {
      const n = L === 1 ? int(r, 1, 5) : L === 2 ? int(r, 3, 10) : int(r, 8, 15); const [p, many, one] = pick(r, OBJECTS);
      return { variant: `count:${n}:${many}`, prompt: `How many ${many}?`, speak: `How many ${many} can you count?`, response: 'choice',
        visual: { kind: 'objects', pic: p, n }, answer: n, choices: numChoices(r, n, 1, 20, 3, [1, 2]),
        hint: 'Touch each one as you count it out loud.', alt: { kind: 'numbered', pic: p, n },
        worked: `Let's count together: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. ${n === 1 ? `There is 1 ${one}` : `There are ${n} ${many}`}.` };
    } };
  M['number-find'] = { year: 'R', label: 'Finding numbers', nc: 'EYFS Numerical Patterns: count beyond 20, recognising the pattern of the counting system',
    gen(r, L) {
      const n = L === 1 ? int(r, 1, 5) : L === 2 ? int(r, 1, 10) : int(r, 11, 20);
      return { variant: `find:${n}`, prompt: `Find the number ${WORDS[n]}`, speak: `Can you find the number ${WORDS[n]}?`, response: 'choice',
        visual: null, answer: n, choices: numChoices(r, n, 1, 20, 3, [1, 2, 10]),
        hint: n <= 10 ? `${WORDS[n][0].toUpperCase() + WORDS[n].slice(1)} looks like this many dots: ${'●'.repeat(n)}` : `${WORDS[n][0].toUpperCase() + WORDS[n].slice(1)} is ten and ${WORDS[n - 10]} more.`,
        alt: n <= 10 ? { kind: 'dots', n } : { kind: 'clue', text: `10 and ${n - 10} more` },
        worked: `This is ${WORDS[n]}: ${n}.` };
    } };
  M['compare-groups'] = { year: 'R', label: 'More and fewer', nc: 'EYFS Numerical Patterns: compare quantities up to 10, greater than, less than or the same',
    gen(r, L) {
      let a = int(r, 1, L === 1 ? 5 : 10), b = int(r, 1, L === 1 ? 5 : 10);
      if (L < 3) while (b === a) b = int(r, 1, L === 1 ? 5 : 10);
      if (L === 3 && r() < 0.3) b = a;
      const [p, many] = pick(r, OBJECTS);
      const askFewer = L >= 2 && r() < 0.5;
      const answer = a === b ? 'Same' : (askFewer ? (a < b ? 'A' : 'B') : (a > b ? 'A' : 'B'));
      const choices = L === 3 ? [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'Same', label: 'Same' }] : [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }];
      return { variant: `cmp:${a}:${b}:${askFewer}`, prompt: `Which group has ${askFewer ? 'fewer' : 'more'} ${many}?${L === 3 ? ' Or are they the same?' : ''}`,
        speak: `Which group has ${askFewer ? 'fewer' : 'more'} ${many}?${L === 3 ? ' Or are they the same?' : ''}`, response: 'choice',
        visual: { kind: 'groups', pic: p, a, b }, answer, choices,
        hint: 'Count each group. The bigger number has more.', alt: { kind: 'clue', text: `Group A has ${a}. Group B has ${b}.` },
        worked: `Group A has ${a} and group B has ${b}. ${a === b ? 'They are the same.' : `${askFewer ? 'Fewer' : 'More'} is group ${answer}.`}` };
    } };
  M['number-bonds'] = { year: 'R', label: 'Number bonds', nc: 'EYFS Number: recall number bonds up to 5 (including subtraction facts) and some number bonds to 10',
    gen(r, L) {
      const total = L === 1 ? 5 : 10; const a = int(r, 0, total); const b = total - a;
      if (L === 3) { const t = int(r, 3, 10), x = int(r, 1, t); return { variant: `bsub:${t}-${x}`, prompt: `${t} − ${x} = ?`, speak: `${t} take away ${x}`, response: 'choice',
        visual: { kind: 'objects', pic: '🔵', n: t }, answer: t - x, choices: numChoices(r, t - x, 0, 10, 3, [1, 2]),
        hint: `Start with ${t}. Hide ${x} of them. How many are left?`, alt: { kind: 'line', from: t, step: -x, max: 10 },
        worked: `${t} take away ${x} leaves ${t - x}.` }; }
      return { variant: `bond:${a}+${b}=${total}`, prompt: `${a} and ? make ${total}`, speak: `${a} and what make ${total}?`, response: 'choice',
        visual: { kind: 'tenframe', filled: a, total }, answer: b, choices: numChoices(r, b, 0, 10, 3, [1, 2]),
        hint: `Count the empty spaces.`, alt: { kind: 'line', from: a, step: b, max: 10 },
        worked: `${a} and ${b} make ${total}.` };
    } };
  M['doubles'] = { year: 'R', label: 'Doubles', nc: 'EYFS Numerical Patterns: explore patterns within numbers up to 10, including double facts',
    gen(r, L) {
      const n = L === 1 ? int(r, 1, 3) : L === 2 ? int(r, 1, 5) : int(r, 4, 10); const [p] = pick(r, OBJECTS);
      return { variant: `dbl:${n}`, prompt: `Double ${n} is ?`, speak: `What is double ${n}?`, response: 'choice', visual: { kind: 'objects', pic: p, n: n * 2 },
        answer: n * 2, choices: numChoices(r, n * 2, 0, 20, 3, [1, 2]), hint: `Double means two lots of ${n}.`, alt: { kind: 'clue', text: `${n} + ${n}` },
        worked: `${n} and ${n} more make ${n * 2}.` };
    } };

  // ---- Year 1 ----
  M['count-sequence'] = { year: 'Y1', label: 'Counting in steps', nc: 'Y1 Number: count to and across 100, forwards and backwards; count in multiples of twos, fives and tens',
    gen(r, L) {
      const step = L === 3 ? pick(r, [2, 5, 10]) : 1; const back = L === 2 && r() < 0.5;
      let start = L === 1 ? int(r, 1, 25) : L === 2 ? int(r, 10, 95) : step * int(r, 0, 8);
      const seq = [0, 1, 2, 3].map(i => back ? start - i * step : start + i * step);
      if (seq.some(x => x < 0 || x > 100)) { start = 10; seq.splice(0, 4, ...[0, 1, 2, 3].map(i => back ? 40 - i : start + i * step)); }
      const ans = seq[3];
      return { variant: `seq:${seq.join(',')}`, prompt: `What comes next? ${seq.slice(0, 3).join(', ')}, ?`, speak: `What comes next? ${seq.slice(0, 3).join(', ')}`,
        response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 0, 100, 3, [1, step, step * 2].filter((v, i, a) => v && a.indexOf(v) === i)),
        hint: back ? 'The numbers are going down by one each time.' : `The numbers go up by ${step} each time.`, alt: { kind: 'clue', text: `${seq[2]} ${back ? '−' : '+'} ${step}` },
        worked: `${seq.slice(0, 3).join(', ')} goes ${back ? 'down' : 'up'} by ${step}, so next is ${ans}.` };
    } };
  M['one-more-less'] = { year: 'Y1', label: 'One more, one less', nc: 'Y1 Number: given a number, identify one more and one less',
    gen(r, L) {
      const n = L === 1 ? int(r, 1, 19) : L === 2 ? int(r, 20, 99) : pick(r, [20, 30, 40, 50, 60, 70, 80, 90, 19, 29, 39, 49, 59, 69, 79, 89]);
      const more = r() < 0.5; const ans = more ? n + 1 : n - 1;
      return { variant: `oml:${n}:${more}`, prompt: `What is one ${more ? 'more' : 'less'} than ${n}?`, speak: `What is one ${more ? 'more' : 'less'} than ${n}?`,
        response: 'choice-or-type', visual: null, answer: ans, choices: numChoices(r, ans, 0, 100, 3, [2, 10]),
        hint: `Count ${more ? 'on' : 'back'} one from ${n}.`, alt: { kind: 'line10', centre: n }, worked: `One ${more ? 'more' : 'less'} than ${n} is ${ans}.` };
    } };
  M['add-within-10'] = { year: 'Y1', label: 'Adding within 20', nc: 'Y1 Addition and subtraction: number bonds within 20; add one-digit and two-digit numbers to 20, including zero',
    gen(r, L) {
      if (L === 3) { const b = int(r, 2, 9), a = int(r, 5, 11); const s = a + b; return { variant: `addm:${a}+?=${s}`, prompt: `${a} + ? = ${s}`, speak: `${a} add what equals ${s}?`,
        response: 'choice-or-type', visual: null, answer: b, choices: numChoices(r, b, 0, 20, 3, [1, 2]), hint: `Count on from ${a} until you reach ${s}.`,
        alt: { kind: 'line', from: a, step: b, max: 20 }, worked: `From ${a} to ${s} is ${b} steps, so ${a} + ${b} = ${s}.` }; }
      const max = L === 1 ? 10 : 20; const a = int(r, 1, max - 1), b = int(r, 0, max - a); const s = a + b;
      return { variant: `add:${a}+${b}`, prompt: `${a} + ${b} = ?`, speak: `What is ${a} add ${b}?`, response: 'choice-or-type', visual: null,
        answer: s, choices: numChoices(r, s, 0, 20, 3, [1, 2]), hint: `Start at ${a} and count on ${b} more.`, alt: { kind: 'line', from: a, step: b, max: Math.max(10, max) },
        worked: b === 0 ? `Adding zero changes nothing, so ${a} + 0 = ${a}.` : `Start at ${a}. Count on ${b}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}. So ${a} + ${b} = ${s}.` };
    } };
  M['sub-within-10'] = { year: 'Y1', label: 'Taking away within 20', nc: 'Y1 Addition and subtraction: related subtraction facts within 20; subtract one-digit and two-digit numbers to 20',
    gen(r, L) {
      const max = L === 1 ? 10 : 20; const a = int(r, 3, max), b = int(r, 1, Math.min(a, 9)); const d = a - b;
      if (L === 3) return { variant: `subm:${a}-?=${d}`, prompt: `${a} − ? = ${d}`, speak: `${a} take away what equals ${d}?`, response: 'choice-or-type', visual: null,
        answer: b, choices: numChoices(r, b, 0, 20, 3, [1, 2]), hint: `Count back from ${a} until you reach ${d}.`, alt: { kind: 'line', from: a, step: -b, max: 20 },
        worked: `From ${a} back to ${d} is ${b} steps, so ${a} − ${b} = ${d}.` };
      return { variant: `sub:${a}-${b}`, prompt: `${a} − ${b} = ?`, speak: `What is ${a} take away ${b}?`, response: 'choice-or-type', visual: null,
        answer: d, choices: numChoices(r, d, 0, 20, 3, [1, 2]), hint: `Start at ${a} and count back ${b}.`, alt: { kind: 'line', from: a, step: -b, max: Math.max(10, max) },
        worked: `Start at ${a}. Count back ${b}: ${Array.from({ length: b }, (_, i) => a - i - 1).join(', ')}. So ${a} − ${b} = ${d}.` };
    } };
  M['halves-quarters'] = { year: 'Y1', label: 'Halves and quarters', nc: 'Y1 Fractions: recognise, find and name a half and a quarter of an object, shape or quantity',
    gen(r, L) {
      const quarter = L === 3; const n = quarter ? 4 * int(r, 1, 5) : 2 * int(r, 1, L === 1 ? 5 : 10); const ans = quarter ? n / 4 : n / 2;
      const [p, many] = pick(r, OBJECTS);
      return { variant: `frac1:${quarter ? 'q' : 'h'}:${n}`, prompt: `What is ${quarter ? 'a quarter' : 'half'} of ${n}?`, speak: `What is ${quarter ? 'a quarter' : 'half'} of ${n}?`,
        response: 'choice-or-type', visual: n <= 12 ? { kind: 'objects', pic: p, n } : null, answer: ans, choices: numChoices(r, ans, 0, 20, 3, [1, 2]),
        hint: quarter ? `Share ${n} ${many} into 4 equal groups.` : `Share ${n} ${many} into 2 equal groups.`, alt: { kind: 'clue', text: quarter ? `? + ? + ? + ? = ${n}` : `? + ? = ${n}` },
        worked: quarter ? `${n} shared into 4 equal groups is ${ans} in each group.` : `${n} shared into 2 equal groups is ${ans} in each group. ${ans} + ${ans} = ${n}.` };
    } };
  const hourName = (h) => ((h - 1 + 12) % 12) + 1;
  function timeLabel(h, m) {
    h = hourName(h);
    if (m === 0) return `${h} o'clock`; if (m === 30) return `half past ${h}`; if (m === 15) return `quarter past ${h}`; if (m === 45) return `quarter to ${hourName(h + 1)}`;
    return m < 30 ? `${m} past ${h}` : `${60 - m} to ${hourName(h + 1)}`;
  }
  M['time-hour-half'] = { year: 'Y1', label: "O'clock and half past", nc: 'Y1 Measurement: tell the time to the hour and half past the hour',
    gen(r, L) {
      const h = int(r, 1, 12); const m = L === 1 ? 0 : L === 2 ? 30 : pick(r, [0, 30]);
      const ans = timeLabel(h, m); const others = new Set();
      others.add(timeLabel(h, m === 0 ? 30 : 0)); others.add(timeLabel(h + (m === 0 ? 1 : -1), m)); if (L === 3) others.add(timeLabel(h + 1, m === 0 ? 30 : 0));
      const wrong = [...others].filter(x => x !== ans).slice(0, 2);
      return { variant: `t1:${h}:${m}`, prompt: 'What time does the clock show?', speak: 'What time does the clock show?', response: 'choice',
        visual: { kind: 'clock', h, m }, answer: ans, choices: strChoices(r, ans, wrong),
        hint: m === 0 ? 'The long hand points straight up to 12. Look where the short hand points.' : 'The long hand points down to 6. That means half past.',
        alt: { kind: 'clue', text: m === 0 ? "Long hand on 12 means o'clock." : 'Long hand on 6 means half past.' }, worked: `The short hand shows ${hourName(h)} and the long hand is on ${m === 0 ? 12 : 6}. It is ${ans}.` };
    } };
  M['coins'] = { year: 'Y1', label: 'Coins', nc: 'Y1 Measurement: recognise and know the value of different denominations of coins and notes',
    gen(r, L) {
      const coins = L === 1 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50, 100, 200];
      if (L === 3) { const a = pick(r, [1, 2, 5, 10, 20]), b = pick(r, [1, 2, 5, 10, 20]); const s = a + b;
        return { variant: `coin+:${a}+${b}`, prompt: `How much is ${pence(a)} and ${pence(b)}?`, speak: `How much is ${a} pence and ${b} pence?`, response: 'choice',
          visual: { kind: 'coins', list: [a, b] }, answer: pence(s), choices: strChoices(r, pence(s), [...new Set([pence(s + 1), pence(Math.max(1, s - 1)), pence(s + 10), pence(a * b)])].filter(x => x !== pence(s)).slice(0, 2)),
          hint: `Start at ${a} and count on ${b}.`, alt: { kind: 'clue', text: `${a} + ${b}` }, worked: `${pence(a)} and ${pence(b)} make ${pence(s)}.` }; }
      const three = shuffle(r, coins).slice(0, 3); const most = r() < 0.6; const ans = most ? Math.max(...three) : Math.min(...three);
      return { variant: `coin:${three.sort((x, y) => x - y).join(',')}:${most}`, prompt: `Which coin is worth the ${most ? 'most' : 'least'}?`, speak: `Which coin is worth the ${most ? 'most' : 'least'}?`,
        response: 'choice', visual: null, answer: pence(ans), choices: shuffle(r, three).map(c => ({ value: pence(c), label: pence(c) })),
        hint: 'Look at the numbers on the coins. £1 is 100p and £2 is 200p.', alt: { kind: 'clue', text: three.map(pence).join(', ') },
        worked: `${three.map(pence).join(', ')}. The ${most ? 'biggest' : 'smallest'} value is ${pence(ans)}.` };
    } };

  // ---- Year 2 ----
  M['place-value-2'] = { year: 'Y2', label: 'Tens and ones', nc: 'Y2 Number: recognise the place value of each digit in a two-digit number (tens, ones)',
    gen(r, L) {
      const t = int(r, 1, 9), o = int(r, 0, 9), n = t * 10 + o;
      if (L === 1) return { variant: `pv2t:${n}`, prompt: `How many tens are in ${n}?`, speak: `How many tens are in ${n}?`, response: 'choice', visual: { kind: 'tens', t, o },
        answer: t, choices: numChoices(r, t, 0, 9, 3, [1, 2]), hint: 'The first digit tells you how many tens.', alt: { kind: 'clue', text: `${n} = ${t * 10} + ${o}` }, worked: `${n} is ${t} tens and ${o} ones.` };
      if (L === 2) { const ask = (r() < 0.5 || o === 0) ? 't' : 'o'; const ans = ask === 't' ? t * 10 : o;
        return { variant: `pv2v:${n}:${ask}`, prompt: `What is the value of the ${ask === 't' ? t : o} in ${n}?`, speak: `What is the value of the ${ask === 't' ? t : o} in ${n}?`, response: 'choice',
          visual: null, answer: ans, choices: [...new Set([ans, ask === 't' ? t : o * 10, ask === 't' ? t * 100 : o + 10])].filter(x => x <= 999).slice(0, 3).map(v => ({ value: v, label: String(v) })).sort(() => r() - 0.5),
          hint: 'Is the digit in the tens place or the ones place?', alt: { kind: 'tens', t, o }, worked: `${n} = ${t * 10} + ${o}. The ${ask === 't' ? t : o} is worth ${ans}.` }; }
      return { variant: `pv2c:${n}`, prompt: `${t * 10} + ${o} = ?`, speak: `${t * 10} add ${o}`, response: 'choice-or-type', visual: null, answer: n,
        choices: numChoices(r, n, 0, 99, 3, [10, 1, 9]), hint: `${t} tens and ${o} ones.`, alt: { kind: 'tens', t, o }, worked: `${t} tens and ${o} ones make ${n}.` };
    } };
  M['compare-100'] = { year: 'Y2', label: 'Comparing numbers to 100', nc: 'Y2 Number: compare and order numbers from 0 up to 100; use <, > and = signs',
    gen(r, L) {
      let a, b, A, B;
      if (L === 1) { a = int(r, 10, 99); do { b = int(r, 10, 99); } while (Math.floor(b / 10) === Math.floor(a / 10)); A = String(a); B = String(b); }
      else if (L === 2) { const t = int(r, 1, 9); a = t * 10 + int(r, 0, 9); b = t * 10 + int(r, 0, 9); if (r() < 0.2) b = a; A = String(a); B = String(b); }
      else { const x = int(r, 1, 8) * 10, y = int(r, 1, 9); a = x + y; b = a + pick(r, [-1, 0, 1, 2]); A = `${x} + ${y}`; B = String(b); }
      const ans = a < b ? '<' : a > b ? '>' : '=';
      return { variant: `cmp100:${A}:${B}`, prompt: `${A}  ?  ${B}`, speak: `Which sign goes between ${say(A)} and ${B}? Less than, greater than, or equals?`, response: 'choice', visual: null,
        answer: ans, choices: [{ value: '<', label: '<' }, { value: '>', label: '>' }, { value: '=', label: '=' }],
        hint: 'The open mouth of < or > eats the bigger number. Compare the tens first.', alt: { kind: 'clue', text: `${a} and ${b}` },
        worked: `${A} is ${a}. ${a} ${ans === '<' ? 'is less than' : ans === '>' ? 'is greater than' : 'equals'} ${b}, so the sign is ${ans}.` };
    } };
  M['add-sub-2digit'] = { year: 'Y2', label: 'Adding and subtracting two-digit numbers', nc: 'Y2 Addition and subtraction: a two-digit number and ones; a two-digit number and tens; two two-digit numbers',
    gen(r, L) {
      let a, b; const sub = r() < 0.5;
      if (L === 1) { a = int(r, 2, 9) * 10 + int(r, 0, 4); b = int(r, 1, 5); if (sub) b = Math.min(b, a % 10 || 1); }
      else if (L === 2) { a = int(r, 1, 6) * 10 + int(r, 0, 9); b = int(r, 1, 3) * 10; if (sub) a = Math.max(a, b + int(r, 1, 30)); }
      else { a = int(r, 20, 79); b = int(r, 11, 20); if (sub && b > a) [a, b] = [b, a]; }
      if (!sub && a + b > 100) b = 100 - a;
      const ans = sub ? a - b : a + b; const op = sub ? '−' : '+';
      return { variant: `as2:${a}${op}${b}`, prompt: `${a} ${op} ${b} = ?`, speak: `What is ${a} ${sub ? 'take away' : 'add'} ${b}?`, response: 'choice-or-type', visual: null,
        answer: ans, choices: numChoices(r, ans, 0, 100, 3, [10, 1, 2]),
        hint: L === 2 ? `Only the tens change. ${sub ? 'Count back' : 'Count on'} in tens.` : `${sub ? 'Take away' : 'Add'} the tens first, then the ones.`,
        alt: { kind: 'tens', t: Math.floor(a / 10), o: a % 10 },
        worked: `${a} ${op} ${Math.floor(b / 10) * 10} = ${sub ? a - Math.floor(b / 10) * 10 : a + Math.floor(b / 10) * 10}, then ${op} ${b % 10} = ${ans}.` };
    } };
  M['times-2-5-10'] = { year: 'Y2', label: '2, 5 and 10 times tables', nc: 'Y2 Multiplication and division: recall and use facts for the 2, 5 and 10 multiplication tables',
    gen(r, L) {
      const t = L === 1 ? pick(r, [2, 10]) : pick(r, [2, 5, 10]); const n = int(r, 1, 12);
      if (L === 3 && r() < 0.6) { const p = t * n; return { variant: `div:${p}/${t}`, prompt: `${p} ÷ ${t} = ?`, speak: `What is ${p} divided by ${t}?`, response: 'choice-or-type', visual: null,
        answer: n, choices: numChoices(r, n, 0, 12, 3, [1, 2]), hint: `How many ${t}s make ${p}?`, alt: { kind: 'clue', text: `? × ${t} = ${p}` }, worked: `${n} × ${t} = ${p}, so ${p} ÷ ${t} = ${n}.` }; }
      const p = t * n;
      return { variant: `mul:${n}x${t}`, prompt: `${n} × ${t} = ?`, speak: `What is ${n} times ${t}?`, response: 'choice-or-type', visual: n <= 6 && t <= 5 ? { kind: 'array', rows: n, cols: t } : null,
        answer: p, choices: numChoices(r, p, 0, 120, 3, [t, 1, 10]), hint: `Count in ${t}s, ${n} times.`, alt: { kind: 'clue', text: Array.from({ length: n }, (_, i) => (i + 1) * t).join(', ') },
        worked: `Counting in ${t}s: ${Array.from({ length: n }, (_, i) => (i + 1) * t).join(', ')}. So ${n} × ${t} = ${p}.` };
    } };
  M['odd-even'] = { year: 'Y2', label: 'Odd and even', nc: 'Y2 Multiplication and division: recognising odd and even numbers',
    gen(r, L) {
      if (L === 3) { const want = pick(r, ['odd', 'even']); const target = want === 'even' ? 2 * int(r, 5, 49) : 2 * int(r, 5, 49) + 1;
        const others = []; while (others.length < 2) { const x = want === 'even' ? 2 * int(r, 5, 49) + 1 : 2 * int(r, 5, 49); if (!others.includes(x)) others.push(x); }
        return { variant: `oe3:${want}:${target}`, prompt: `Which number is ${want}?`, speak: `Which number is ${want}?`, response: 'choice', visual: null,
          answer: target, choices: shuffle(r, [target, ...others]).map(v => ({ value: v, label: String(v) })), hint: 'Even numbers end in 0, 2, 4, 6 or 8.',
          alt: { kind: 'clue', text: 'Look at the last digit.' }, worked: `${target} ends in ${target % 10}, so it is ${want}.` }; }
      const n = L === 1 ? int(r, 1, 20) : int(r, 21, 99); const ans = n % 2 ? 'Odd' : 'Even';
      return { variant: `oe:${n}`, prompt: `Is ${n} odd or even?`, speak: `Is ${n} odd or even?`, response: 'choice', visual: n <= 12 ? { kind: 'pairs', n } : null,
        answer: ans, choices: [{ value: 'Odd', label: 'Odd' }, { value: 'Even', label: 'Even' }], hint: 'Even numbers end in 0, 2, 4, 6 or 8.',
        alt: { kind: 'clue', text: `The last digit is ${n % 10}.` }, worked: `${n} ends in ${n % 10}, so it is ${ans.toLowerCase()}.` };
    } };
  M['fractions-y2'] = { year: 'Y2', label: 'Fractions of amounts', nc: 'Y2 Fractions: find 1/3, 1/4, 2/4 and 3/4 of a set of objects or quantity; recognise 2/4 and 1/2 are equivalent',
    gen(r, L) {
      if (L === 3 && r() < 0.35) return { variant: 'eq24', prompt: 'Which fraction is the same as 2/4?', speak: 'Which fraction is the same as two quarters?', response: 'choice', visual: { kind: 'bar', parts: 4, shaded: 2 },
        answer: '1/2', choices: strChoices(r, '1/2', ['1/4', '3/4']), hint: 'Look at how much of the bar is shaded.', alt: { kind: 'bar', parts: 2, shaded: 1 }, worked: 'Two quarters fill half of the bar, so 2/4 = 1/2.' };
      const [num, den] = L === 1 ? [1, 2] : L === 2 ? pick(r, [[1, 4], [1, 3]]) : pick(r, [[3, 4], [2, 4], [1, 3], [1, 4]]);
      const n = den * int(r, 1, L === 1 ? 6 : 5); const ans = n / den * num;
      return { variant: `fr2:${num}/${den}:${n}`, prompt: `What is ${num}/${den} of ${n}?`, speak: `What is ${num === 1 ? 'one' : WORDS[num]} ${den === 2 ? 'half' : den === 3 ? (num === 1 ? 'third' : 'thirds') : (num === 1 ? 'quarter' : 'quarters')} of ${n}?`,
        response: 'choice-or-type', visual: { kind: 'bar', parts: den, shaded: num }, answer: ans, choices: numChoices(r, ans, 0, 40, 3, [1, 2, n / den]),
        hint: `Share ${n} into ${den} equal groups${num > 1 ? `, then take ${num} of the groups` : ''}.`, alt: { kind: 'clue', text: `${n} ÷ ${den} = ${n / den}` },
        worked: `${n} ÷ ${den} = ${n / den}.${num > 1 ? ` ${num} lots of ${n / den} is ${ans}.` : ''} So ${num}/${den} of ${n} is ${ans}.` };
    } };
  M['money-y2'] = { year: 'Y2', label: 'Money and change', nc: 'Y2 Measurement: use £ and p; combine amounts; solve problems including giving change',
    gen(r, L) {
      if (L === 3) { const pay = pick(r, [20, 50, 100]); const cost = int(r, 1, pay / 5 - 1) * 5; const ch = pay - cost;
        return { variant: `chg:${pay}-${cost}`, prompt: `You pay ${pence(pay)} for something that costs ${pence(cost)}. How much change?`, speak: `You pay ${pay === 100 ? 'one pound' : pay + ' pence'} for something that costs ${cost} pence. How much change do you get?`,
          response: 'choice', visual: null, answer: pence(ch), choices: strChoices(r, pence(ch), [...new Set([pence(ch + 5), pence(Math.max(5, ch - 5)), pence(ch + 10)])].filter(x => x !== pence(ch)).slice(0, 2)),
          hint: `Count up from ${cost} to ${pay}.`, alt: { kind: 'line', from: cost, step: ch, max: pay }, worked: `${pay} − ${cost} = ${ch}. The change is ${pence(ch)}.` }; }
      const list = L === 1 ? [pick(r, [10, 20, 5]), pick(r, [1, 2, 5])] : [pick(r, [50, 20]), pick(r, [20, 10]), pick(r, [5, 2, 1])];
      const s = list.reduce((a, b) => a + b, 0);
      return { variant: `sum:${list.join('+')}`, prompt: 'How much money is this?', speak: 'How much money is this altogether?', response: 'choice', visual: { kind: 'coins', list },
        answer: pence(s), choices: strChoices(r, pence(s), [...new Set([pence(s + 10), pence(Math.max(1, s - 1)), pence(s + 1)])].filter(x => x !== pence(s)).slice(0, 2)),
        hint: 'Start with the biggest coin and count on.', alt: { kind: 'clue', text: list.join(' + ') }, worked: `${list.join(' + ')} = ${s}. That is ${pence(s)}.` };
    } };
  M['time-5min'] = { year: 'Y2', label: 'Time to five minutes', nc: 'Y2 Measurement: tell and write the time to five minutes, including quarter past/to; minutes in an hour, hours in a day',
    gen(r, L) {
      if (L === 3 && r() < 0.3) { const q = pick(r, [['How many minutes are in an hour?', 60], ['How many hours are in a day?', 24], ['How many minutes are in half an hour?', 30]]);
        return { variant: `tf:${q[1]}`, prompt: q[0], speak: q[0], response: 'choice', visual: null, answer: q[1], choices: strChoices(r, q[1], [...new Set([12, 100, 30, 60, 24, 15])].filter(x => x !== q[1]).slice(0, 2)).map(c => ({ value: c.value, label: String(c.label) })),
          hint: 'Think about the clock face and the long hand.', alt: { kind: 'clue', text: 'The long hand goes all the way round in one hour.' }, worked: `The answer is ${q[1]}.` }; }
      const h = int(r, 1, 12); const m = L === 1 ? pick(r, [15, 45]) : 5 * int(r, 1, 11);
      const ans = timeLabel(h, m); const wrong = [...new Set([timeLabel(h, (m + 30) % 60 || 5), timeLabel(h + 1, m), timeLabel(h, 60 - m)])].filter(x => x !== ans).slice(0, 2);
      return { variant: `t5:${h}:${m}`, prompt: 'What time does the clock show?', speak: 'What time does the clock show?', response: 'choice', visual: { kind: 'clock', h, m },
        answer: ans, choices: strChoices(r, ans, wrong), hint: 'Count in fives round the clock from 12 to the long hand.', alt: { kind: 'clue', text: `The long hand shows ${m} minutes past.` },
        worked: `The long hand points to ${m / 5}, which is ${m} minutes past. ${m > 30 ? `That is ${60 - m} minutes to the next hour. ` : ''}It is ${ans}.` };
    } };

  // ---- Year 3 ----
  M['more-less-10-100'] = { year: 'Y3', label: '10 or 100 more or less', nc: 'Y3 Number: find 10 or 100 more or less than a given number',
    gen(r, L) {
      const step = L === 1 ? 10 : pick(r, [10, 100]); const more = r() < 0.5;
      let n = L === 3 ? (step === 10 ? int(r, 1, 9) * 100 + pick(r, [90, 95, 0, 5]) : int(r, 1, 8) * 100 + int(r, 0, 99)) : int(r, 120, 880);
      if (L === 3 && step === 10) { if (more && n % 100 < 90) n += 90 - n % 100; if (!more && n % 100 >= 10) n -= n % 100; }
      const ans = more ? n + step : n - step;
      return { variant: `ml:${n}:${step}:${more}`, prompt: `What is ${step} ${more ? 'more' : 'less'} than ${n}?`, speak: `What is ${step} ${more ? 'more' : 'less'} than ${n}?`, response: 'choice-or-type', visual: null,
        answer: ans, choices: numChoices(r, ans, 0, 1100, 3, [1, step === 10 ? 100 : 10, step * 2]), hint: `Only the ${step === 10 ? 'tens' : 'hundreds'} digit should change${L === 3 ? ', unless it crosses into the next hundred' : ''}.`,
        alt: { kind: 'clue', text: `${n} ${more ? '+' : '−'} ${step}` }, worked: `${n} ${more ? '+' : '−'} ${step} = ${ans}.` };
    } };
  M['place-value-3'] = { year: 'Y3', label: 'Hundreds, tens and ones', nc: 'Y3 Number: recognise the place value of each digit in a three-digit number (hundreds, tens, ones)',
    gen(r, L) {
      const h = int(r, 1, 9), t = int(r, 1, 9), o = int(r, 1, 9); const n = h * 100 + t * 10 + o;
      if (L === 3) return { variant: `pv3c:${n}`, prompt: `${h * 100} + ${t * 10} + ${o} = ?`, speak: `${h * 100} add ${t * 10} add ${o}`, response: 'choice-or-type', visual: null, answer: n,
        choices: numChoices(r, n, 100, 999, 3, [100, 10, 1]), hint: 'Hundreds, then tens, then ones.', alt: { kind: 'clue', text: `${h} hundreds, ${t} tens, ${o} ones` }, worked: `${h} hundreds, ${t} tens and ${o} ones make ${n}.` };
      const pos = L === 1 ? 'h' : pick(r, ['h', 't', 'o']); const d = { h, t, o }[pos]; const ans = { h: h * 100, t: t * 10, o }[pos];
      const opts = [...new Set([ans, d, d * 10, d * 100])].slice(0, 3); if (!opts.includes(ans)) opts[0] = ans;
      return { variant: `pv3:${n}:${pos}`, prompt: `What is the value of the ${d} in ${n}?`, speak: `What is the value of the digit ${d} in ${n}?`, response: 'choice', visual: null,
        answer: ans, choices: shuffle(r, opts).map(v => ({ value: v, label: String(v) })), hint: 'Is it in the hundreds, tens or ones place?',
        alt: { kind: 'clue', text: `${n} = ${h * 100} + ${t * 10} + ${o}` }, worked: `${n} = ${h * 100} + ${t * 10} + ${o}. The ${d} is worth ${ans}.` };
    } };
  M['compare-1000'] = { year: 'Y3', label: 'Comparing numbers to 1000', nc: 'Y3 Number: compare and order numbers up to 1000',
    gen(r, L) {
      if (L === 3) { const base = int(r, 2, 8) * 100; const nums = shuffle(r, [...new Set([base + int(r, 10, 99), base + int(r, 10, 99), base - 100 + int(r, 10, 99), base + 100 + int(r, 0, 9)])]).slice(0, 3);
        const ans = Math.max(...nums);
        return { variant: `max:${nums.slice().sort().join(',')}`, prompt: 'Which number is the largest?', speak: 'Which number is the largest?', response: 'choice', visual: null, answer: ans,
          choices: nums.map(v => ({ value: v, label: String(v) })), hint: 'Compare the hundreds first, then the tens.', alt: { kind: 'clue', text: nums.slice().sort((a, b) => a - b).join(' < ') }, worked: `In order: ${nums.slice().sort((a, b) => a - b).join(', ')}. The largest is ${ans}.` }; }
      let a = int(r, 100, 999), b;
      if (L === 1) do { b = int(r, 100, 999); } while (Math.floor(b / 100) === Math.floor(a / 100)); else { b = Math.floor(a / 100) * 100 + int(r, 0, 99); if (r() < 0.15) b = a; }
      const ans = a < b ? '<' : a > b ? '>' : '=';
      return { variant: `c1k:${a}:${b}`, prompt: `${a}  ?  ${b}`, speak: `Which sign goes between ${a} and ${b}?`, response: 'choice', visual: null, answer: ans,
        choices: [{ value: '<', label: '<' }, { value: '>', label: '>' }, { value: '=', label: '=' }], hint: 'Compare the hundreds, then the tens, then the ones.',
        alt: { kind: 'clue', text: `${Math.floor(a / 100)} hundreds and ${Math.floor(b / 100)} hundreds` }, worked: `${a} ${ans === '<' ? 'is less than' : ans === '>' ? 'is greater than' : 'equals'} ${b}, so the sign is ${ans}.` };
    } };
  M['add-sub-3digit'] = { year: 'Y3', label: 'Adding and subtracting three-digit numbers', nc: 'Y3 Addition and subtraction: mentally add/subtract ones, tens, hundreds to a three-digit number; columnar methods up to three digits',
    gen(r, L) {
      const sub = r() < 0.5; let a, b;
      if (L === 1) { a = int(r, 1, 8) * 100 + int(r, 1, 5) * 10 + int(r, 0, 4); b = pick(r, [int(r, 1, 4), int(r, 1, 3) * 10]); }
      else if (L === 2) { a = int(r, 2, 7) * 100 + int(r, 0, 99); b = pick(r, [int(r, 1, 2) * 100, int(r, 6, 9) + 0]); }
      else { a = int(r, 150, 650); b = int(r, 105, 340); }
      if (sub && b > a) [a, b] = [b, a];
      const ans = sub ? a - b : a + b; const op = sub ? '−' : '+';
      return { variant: `as3:${a}${op}${b}`, prompt: `${a} ${op} ${b} = ?`, speak: `What is ${a} ${sub ? 'take away' : 'add'} ${b}?`, response: 'choice-or-type', visual: L === 3 ? { kind: 'column', a, b, op } : null,
        answer: ans, choices: numChoices(r, ans, 0, 1999, 3, [10, 100, 1]), hint: L === 3 ? 'Line up the ones, tens and hundreds. Start with the ones.' : `Which digit changes when you ${sub ? 'take away' : 'add'} ${b}?`,
        alt: { kind: 'column', a, b, op }, worked: `${a} ${op} ${b} = ${ans}.` };
    } };
  M['times-3-4-8'] = { year: 'Y3', label: '3, 4 and 8 times tables', nc: 'Y3 Multiplication and division: recall and use facts for the 3, 4 and 8 multiplication tables',
    gen(r, L) {
      const t = L === 1 ? pick(r, [3, 4]) : pick(r, [3, 4, 8]); const n = int(r, 2, 12); const p = t * n;
      if (L === 3) { const kind = pick(r, ['div', 'miss']);
        if (kind === 'div') return { variant: `d348:${p}/${t}`, prompt: `${p} ÷ ${t} = ?`, speak: `What is ${p} divided by ${t}?`, response: 'choice-or-type', visual: null, answer: n,
          choices: numChoices(r, n, 1, 12, 3, [1, 2]), hint: `How many ${t}s make ${p}?`, alt: { kind: 'clue', text: `? × ${t} = ${p}` }, worked: `${n} × ${t} = ${p}, so ${p} ÷ ${t} = ${n}.` };
        return { variant: `m348:?x${t}=${p}`, prompt: `? × ${t} = ${p}`, speak: `What times ${t} equals ${p}?`, response: 'choice-or-type', visual: null, answer: n,
          choices: numChoices(r, n, 1, 12, 3, [1, 2]), hint: `Count in ${t}s until you reach ${p}.`, alt: { kind: 'clue', text: Array.from({ length: n }, (_, i) => (i + 1) * t).join(', ') }, worked: `${n} × ${t} = ${p}.` }; }
      return { variant: `x348:${n}x${t}`, prompt: `${n} × ${t} = ?`, speak: `What is ${n} times ${t}?`, response: 'choice-or-type', visual: null, answer: p,
        choices: numChoices(r, p, 0, 100, 3, [t, 1, 2]), hint: t === 8 ? `Double the 4 times table: ${n} × 4 = ${n * 4}, doubled is …` : t === 4 ? `Double, then double again: ${n} doubled is ${n * 2}.` : `Count in 3s, ${n} times.`,
        alt: { kind: 'clue', text: Array.from({ length: n }, (_, i) => (i + 1) * t).join(', ') }, worked: `${n} × ${t} = ${p}.` };
    } };
  M['multiply-2by1'] = { year: 'Y3', label: 'Two-digit times one-digit', nc: 'Y3 Multiplication and division: two-digit numbers times one-digit numbers, using mental and progressing to formal written methods',
    gen(r, L) {
      const a = L === 1 ? int(r, 11, 15) : int(r, 12, 30); const b = L === 1 ? pick(r, [2, 3]) : pick(r, [3, 4, 5, 8]); const p = a * b;
      const tens = Math.floor(a / 10) * 10, ones = a % 10;
      const word = L === 3 ? pick(r, [`There are ${b} boxes with ${a} pencils in each. How many pencils?`, `${b} children each have ${a} stickers. How many stickers altogether?`]) : null;
      return { variant: `m21:${a}x${b}`, prompt: word || `${a} × ${b} = ?`, speak: word || `What is ${a} times ${b}?`, response: 'choice-or-type', visual: null, answer: p,
        choices: numChoices(r, p, 0, 300, 3, [b, 10, 1]), hint: `Split ${a} into ${tens} and ${ones}. Multiply each by ${b}.`, alt: { kind: 'clue', text: `${tens} × ${b} = ${tens * b}, ${ones} × ${b} = ${ones * b}` },
        worked: `${tens} × ${b} = ${tens * b} and ${ones} × ${b} = ${ones * b}. ${tens * b} + ${ones * b} = ${p}.` };
    } };
  M['fractions-y3'] = { year: 'Y3', label: 'Fractions', nc: 'Y3 Fractions: fractions of a set (unit and non-unit); equivalent fractions; add fractions with the same denominator within one whole',
    gen(r, L) {
      if (L === 3) { if (r() < 0.5) { const d = pick(r, [5, 6, 7, 8, 9, 10]); const a = int(r, 1, d - 2), b = int(r, 1, d - 1 - a);
          return { variant: `fadd:${a}/${d}+${b}/${d}`, prompt: `${a}/${d} + ${b}/${d} = ?`, speak: `${a} ${d}ths add ${b} ${d}ths`, response: 'choice', visual: { kind: 'bar', parts: d, shaded: a + b },
            answer: `${a + b}/${d}`, choices: strChoices(r, `${a + b}/${d}`, [`${a + b}/${d * 2}`, `${a + b + 1}/${d}`]), hint: 'When the bottom numbers are the same, add the top numbers. The bottom stays the same.',
            alt: { kind: 'bar', parts: d, shaded: a }, worked: `${a} + ${b} = ${a + b} parts out of ${d}. So ${a + b}/${d}.` }; }
        const [n1, d1, d2] = pick(r, [[1, 2, 4], [1, 2, 6], [1, 2, 8], [1, 3, 6], [1, 4, 8], [2, 3, 6], [3, 4, 8]]); const ans = n1 * d2 / d1;
        return { variant: `feq:${n1}/${d1}=?/${d2}`, prompt: `${n1}/${d1} = ?/${d2}`, speak: `${n1} over ${d1} equals what over ${d2}?`, response: 'choice-or-type', visual: { kind: 'bar', parts: d2, shaded: ans },
          answer: ans, choices: numChoices(r, ans, 1, d2, 3, [1, 2]), hint: `${d1} × ${d2 / d1} = ${d2}. Do the same to the top number.`, alt: { kind: 'bar', parts: d1, shaded: n1 },
          worked: `Multiply top and bottom by ${d2 / d1}: ${n1} × ${d2 / d1} = ${ans}. So ${n1}/${d1} = ${ans}/${d2}.` }; }
      const d = pick(r, [2, 3, 4, 5, 10]); const num = L === 1 ? 1 : int(r, 1, d - 1); const n = d * int(r, 2, 10); const ans = n / d * num;
      return { variant: `fof:${num}/${d}:${n}`, prompt: `What is ${num}/${d} of ${n}?`, speak: `What is ${num} over ${d} of ${n}?`, response: 'choice-or-type', visual: { kind: 'bar', parts: d, shaded: num },
        answer: ans, choices: numChoices(r, ans, 0, 100, 3, [n / d, 1, 2]), hint: `Divide ${n} by ${d}${num > 1 ? `, then multiply by ${num}` : ''}.`, alt: { kind: 'clue', text: `${n} ÷ ${d} = ${n / d}` },
        worked: `${n} ÷ ${d} = ${n / d}.${num > 1 ? ` ${n / d} × ${num} = ${ans}.` : ''} So ${num}/${d} of ${n} is ${ans}.` };
    } };
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  M['time-y3'] = { year: 'Y3', label: 'Time, Roman numerals and durations', nc: 'Y3 Measurement: Roman numerals I to XII; seconds in a minute, days in each month and year; compare durations',
    gen(r, L) {
      if (L === 1) { const n = int(r, 1, 12); return { variant: `rom:${n}`, prompt: `What number is ${ROMAN[n]}?`, speak: `What number is the Roman numeral shown?`, response: 'choice', visual: { kind: 'big', text: ROMAN[n] },
        answer: n, choices: numChoices(r, n, 1, 12, 3, [1, 2]), hint: 'I is 1, V is 5, X is 10. A smaller one in front means take away.', alt: { kind: 'clue', text: 'I = 1, V = 5, X = 10' },
        worked: `${ROMAN[n]} = ${n}.` }; }
      if (L === 2) { const q = pick(r, [['How many seconds are in a minute?', 60, [100, 30]], ['How many days are in a week?', 7, [5, 10]], ['How many months are in a year?', 12, [10, 52]],
        ['How many days are in a year that is not a leap year?', 365, [366, 360]], ['How many days are in a leap year?', 366, [365, 364]], ['How many days are in April?', 30, [31, 28]], ['How many days are in December?', 31, [30, 28]]]);
        return { variant: `tfact:${q[1]}:${q[0].length}`, prompt: q[0], speak: q[0], response: 'choice', visual: null, answer: q[1], choices: shuffle(r, [q[1], ...q[2]]).map(v => ({ value: v, label: String(v) })),
          hint: q[0].includes('April') || q[0].includes('December') ? '30 days has September, April, June and November.' : 'Think about a clock or a calendar.', alt: { kind: 'clue', text: 'Use a calendar if you have one.' }, worked: `The answer is ${q[1]}.` }; }
      const sh = int(r, 1, 10), sm = pick(r, [0, 5, 10, 15, 20, 30]); const dur = pick(r, [10, 15, 20, 25, 30, 35, 40, 45]); let eh = sh, em = sm + dur; if (em >= 60) { em -= 60; eh += 1; }
      const fmt = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
      return { variant: `dur:${fmt(sh, sm)}:${dur}`, prompt: `A film starts at ${fmt(sh, sm)} and ends at ${fmt(eh, em)}. How many minutes long is it?`, speak: `A film starts at ${fmt(sh, sm)} and ends at ${fmt(eh, em)}. How many minutes long is it?`,
        response: 'choice-or-type', visual: null, answer: dur, choices: numChoices(r, dur, 5, 60, 3, [5, 10]), hint: `Count on in fives from ${fmt(sh, sm)} to ${fmt(eh, em)}.`, alt: { kind: 'clue', text: sm + dur >= 60 ? `To the hour is ${60 - sm} minutes, then ${em} more.` : `${em} − ${sm}` },
        worked: sm + dur >= 60 ? `${fmt(sh, sm)} to ${eh}:00 is ${60 - sm} minutes, then ${em} more. ${60 - sm} + ${em} = ${dur} minutes.` : `${em} − ${sm} = ${dur} minutes.` };
    } };
  M['money-y3'] = { year: 'Y3', label: 'Pounds and pence', nc: 'Y3 Measurement: add and subtract amounts of money to give change, using both £ and p',
    gen(r, L) {
      if (L === 1) { const a = int(r, 3, 9) * 10 + pick(r, [0, 5]), b = int(r, 2, 9) * 10 + pick(r, [0, 5]); const s = a + b;
        return { variant: `my3a:${a}+${b}`, prompt: `${pence(a)} + ${pence(b)} = ?`, speak: `${a} pence add ${b} pence`, response: 'choice', visual: null, answer: pence(s),
          choices: strChoices(r, pence(s), [...new Set([pence(s + 10), pence(s - 10), pence(s + 100)])].filter(x => x !== pence(s)).slice(0, 2)),
          hint: '100p is the same as £1.00.', alt: { kind: 'clue', text: `${a} + ${b} = ${s}p` }, worked: `${a} + ${b} = ${s}p, which is ${pence(s)}.` }; }
      const pay = L === 2 ? 100 : 500; const cost = L === 2 ? int(r, 2, 19) * 5 : int(r, 30, 95) * 5; const ch = pay - cost;
      return { variant: `my3c:${pay}-${cost}`, prompt: `Something costs ${pence(cost)}. You pay with a ${pence(pay)} ${pay === 100 ? 'coin' : 'note'}. How much change?`, speak: `Something costs ${pence(cost)}. You pay with ${pay === 100 ? 'one pound' : 'five pounds'}. How much change do you get?`,
        response: 'choice', visual: null, answer: pence(ch), choices: strChoices(r, pence(ch), [...new Set([pence(ch + 10), pence(Math.max(5, ch - 5)), pence(ch + 100)])].filter(x => x !== pence(ch)).slice(0, 2)),
        hint: `Count up from ${pence(cost)} to ${pence(pay)}.`, alt: { kind: 'clue', text: `${pay} − ${cost} = ?` }, worked: `${pay}p − ${cost}p = ${ch}p. The change is ${pence(ch)}.` };
    } };

  // =====================================================================================
  // ENGLISH (items written and reviewed by hand)
  // =====================================================================================
  const E = {};

  // ---- Reception (EYFS Word Reading and vocabulary) ----
  const INITIAL = { s: ['sun', 'sock', 'snake'], m: ['moon', 'mouse', 'monkey'], b: ['bus', 'bee', 'banana'], d: ['dog', 'duck', 'drum'], f: ['fish', 'fox', 'frog'],
    p: ['pig', 'penguin', 'pear'], c: ['cat', 'cake', 'cow'], h: ['horse', 'house', 'hat'], t: ['tiger', 'tree', 'tent'], r: ['rabbit', 'rocket', 'rainbow'],
    l: ['lion', 'leaf', 'lemon'], g: ['goat', 'grapes', 'guitar'], w: ['watermelon', 'worm', 'window'] };
  const startsWithSound = (word, letter) => namesOf(word).some(n => n[0] === letter || (letter === 'c' && n[0] === 'k') || (letter === 'k' && n[0] === 'c'));
  E['initial-sound'] = { year: 'R', label: 'First sounds', nc: 'EYFS Word Reading: say a sound for each letter in the alphabet',
    gen(r, L) {
      const letters = L === 1 ? ['s', 'm', 'b', 'd', 'f', 'p', 'c', 'h'] : Object.keys(INITIAL); const letter = pick(r, letters);
      const [anchor, target] = shuffle(r, INITIAL[letter]).slice(0, 2);
      const pool = Object.entries(INITIAL).filter(([k]) => k !== letter).flatMap(([, ws]) => ws).filter(w => !startsWithSound(w, letter));
      const wrong = shuffle(r, pool).slice(0, L === 3 ? 3 : 2);
      return { variant: `init:${letter}:${target}`, prompt: `Which one starts with the same sound as ${anchor}?`, speak: `Which picture starts with the same sound as ${anchor}?`, response: 'picture',
        visual: { kind: 'big', text: letter }, answer: target, choices: shuffle(r, [target, ...wrong]).map(w => ({ value: w, label: pic(w), alt: w })),
        hint: `Say ${anchor} slowly. Listen to the very first sound. Now say each picture.`, alt: { kind: 'clue', text: `${anchor} starts with ${letter}` }, worked: `${anchor} and ${target} both start with the sound ${letter}.` };
    } };
  const CVC1 = ['cat', 'dog', 'sun', 'pig', 'bus', 'bed', 'hen', 'fox', 'cup', 'box', 'bat', 'web', 'van', 'map', 'pen', 'bug', 'hat'];
  const CVC3 = ['ship', 'fish', 'chick', 'ring', 'duck', 'sock', 'frog', 'drum', 'tent', 'shell'];
  const CVC_SIMILAR = { cat: ['hat', 'bat'], hat: ['cat', 'bat'], bat: ['cat', 'hat'], bus: ['bug', 'cup'], bug: ['bus', 'bed'], pen: ['hen', 'pig'], hen: ['pen', 'bed'], box: ['fox', 'dog'], fox: ['box', 'dog'], map: ['cat', 'van'], van: ['map', 'bat'], dog: ['log', 'box'] };
  E['cvc-read'] = { year: 'R', label: 'Reading simple words', nc: 'EYFS Word Reading: read words consistent with their phonic knowledge by sound-blending',
    gen(r, L) {
      const word = L === 3 ? pick(r, CVC3) : pick(r, CVC1.filter(w => L === 1 || CVC_SIMILAR[w]));
      let wrong = L === 2 && CVC_SIMILAR[word] ? CVC_SIMILAR[word].filter(w => PIC[w]) : [];
      const pool = (L === 3 ? CVC3 : CVC1).filter(w => w !== word && !wrong.includes(w));
      wrong = [...wrong, ...shuffle(r, pool)].slice(0, 2);
      return { variant: `cvc:${word}`, prompt: 'Read the word. Which picture is it?', speak: 'Read the word, then tap the picture.', response: 'picture', visual: { kind: 'word', text: word },
        answer: word, choices: shuffle(r, [word, ...wrong]).map(w => ({ value: w, label: pic(w), alt: w })),
        hint: `Say each sound: ${word.match(/sh|ch|ck|ng|th|ll|./g).join(' - ')}. Now blend them.`, alt: { kind: 'clue', text: word.match(/sh|ch|ck|ng|th|ll|./g).join(' ') },
        worked: `${word.match(/sh|ch|ck|ng|th|ll|./g).join('-')} makes ${word}. That is the ${word}.` };
    } };
  const PICTURES = [
    { word: 'cat', clue: 'It says miaow.' }, { word: 'dog', clue: 'It says woof.' }, { word: 'sun', clue: 'It shines in the sky.' }, { word: 'apple', clue: 'A fruit you can crunch.' },
    { word: 'fish', clue: 'It swims in water.' }, { word: 'bus', clue: 'Lots of people ride in it.' }, { word: 'ball', clue: 'You kick it.' }, { word: 'tree', clue: 'It has leaves and branches.' },
    { word: 'moon', clue: 'You see it at night.' }, { word: 'cake', clue: 'You have it on your birthday.' }, { word: 'chair', clue: 'You sit on it.' }, { word: 'key', clue: 'It opens a door.' },
    { word: 'spoon', clue: 'You eat soup with it.' }, { word: 'rocket', clue: 'It flies into space.' }, { word: 'penguin', clue: 'A bird that swims but cannot fly.' }, { word: 'guitar', clue: 'You play music on it.' }
  ];
  E['picture-words'] = { year: 'R', label: 'Picture words', nc: 'EYFS Comprehension: use and understand recently introduced vocabulary',
    gen(r, L) {
      const pool = L === 1 ? PICTURES.slice(0, 8) : PICTURES; const t = pick(r, pool); const others = shuffle(r, pool.filter(p => p !== t)).slice(0, L === 3 ? 3 : 2);
      return { variant: `pic:${t.word}`, prompt: `Which one is the ${t.word}?`, speak: `Which one is the ${t.word}?`, response: 'picture', visual: null, answer: t.word,
        choices: shuffle(r, [t, ...others]).map(p => ({ value: p.word, label: pic(p.word), alt: p.word })), hint: t.clue, alt: { kind: 'clue', text: t.clue }, worked: `This is the ${t.word}: ${pic(t.word)}. ${t.clue}` };
    } };
  const RHYMES = [['cat', ['hat', 'bat']], ['dog', ['frog', 'log']], ['bee', ['tree', 'key']], ['star', ['car']], ['moon', ['spoon']], ['fox', ['box', 'sock']],
    ['mouse', ['house']], ['snake', ['cake']], ['bear', ['pear', 'chair']], ['goat', ['boat', 'coat']], ['ring', ['king']], ['bed', []], ['pen', ['hen']]];
  const RHYME_FAMILY = { cat: 'at', hat: 'at', bat: 'at', dog: 'og', frog: 'og', log: 'og', bee: 'ee', tree: 'ee', key: 'ee', star: 'ar', car: 'ar', moon: 'oon', spoon: 'oon',
    fox: 'ox', box: 'ox', sock: 'ock', mouse: 'ouse', house: 'ouse', snake: 'ake', cake: 'ake', bear: 'air', pear: 'air', chair: 'air', goat: 'oat', boat: 'oat', coat: 'oat', ring: 'ing', king: 'ing', pen: 'en', hen: 'en' };
  E['rhyme'] = { year: 'R', label: 'Rhyming words', nc: 'EYFS Comprehension and Word Reading: rhymes and poems; hearing sounds in words',
    gen(r, L) {
      const sets = RHYMES.filter(([w, rs]) => rs.length && !(w === 'fox')); const [word, rs] = pick(r, sets); const target = pick(r, rs);
      const fam = RHYME_FAMILY[word]; const pool = Object.keys(RHYME_FAMILY).filter(w => RHYME_FAMILY[w] !== fam && w !== word && PIC[w]);
      const wrong = shuffle(r, pool).slice(0, L === 3 ? 3 : 2);
      return { variant: `rh:${word}:${target}`, prompt: `Which one rhymes with ${word}?`, speak: `Which picture rhymes with ${word}?`, response: 'picture', visual: L === 1 ? { kind: 'big', text: pic(word) } : null,
        answer: target, choices: shuffle(r, [target, ...wrong]).map(w => ({ value: w, label: pic(w), alt: w })), hint: `Say each word out loud. Which one sounds the same at the end as ${word}?`,
        alt: { kind: 'clue', text: `${word} ends with -${fam}` }, worked: `${word} and ${target} rhyme. They both end with the -${fam} sound.` };
    } };

  // ---- Year 1 (spelling appendix 1, appendix 2) ----
  const CEW1 = [
    { word: 'said', wrong: ['sed', 'sayd'], sentence: '"Hello," ___ Mum.' }, { word: 'was', wrong: ['woz', 'wus'], sentence: 'The cat ___ asleep.' },
    { word: 'they', wrong: ['thay', 'thei'], sentence: '___ went to the park.' }, { word: 'come', wrong: ['cum', 'kome'], sentence: 'Please ___ to my party.' },
    { word: 'some', wrong: ['sum', 'som'], sentence: 'Can I have ___ milk?' }, { word: 'one', wrong: ['wun', 'wan'], sentence: 'I have ___ sister.' },
    { word: 'friend', wrong: ['frend', 'freind'], sentence: 'My ___ came to play.' }, { word: 'school', wrong: ['skool', 'scool'], sentence: 'We walk to ___ .' },
    { word: 'push', wrong: ['poosh', 'pussh'], sentence: '___ the door open.' }, { word: 'house', wrong: ['hous', 'howse'], sentence: 'Our ___ has a red door.' },
    { word: 'were', wrong: ['wer', 'wur'], sentence: 'We ___ very happy.' }, { word: 'there', wrong: ['thair', 'ther'], sentence: 'Put it over ___ .' },
    { word: 'love', wrong: ['luv', 'lov'], sentence: 'I ___ my family.' }, { word: 'your', wrong: ['yor', 'yoor'], sentence: 'Is this ___ coat?' },
    { word: 'today', wrong: ['tuday', 'todai'], sentence: 'It is sunny ___ .' }, { word: 'once', wrong: ['wunce', 'wons'], sentence: '___ upon a time…' },
    { word: 'where', wrong: ['wair', 'whair'], sentence: '___ is my hat?' }, { word: 'our', wrong: ['owr', 'awer'], sentence: 'This is ___ cat.' }
  ];
  // Wrong spellings are never real words, so only one choice can be right.
  function spellingSkill(list, year, label, nc) {
    return { year, label, nc, gen(r, L) {
      const pool = L === 1 ? list.slice(0, Math.ceil(list.length / 2)) : list; const t = pick(r, pool);
      return { variant: `sp:${t.word}`, prompt: t.sentence.replace('___', '_____'), speak: `Which spelling is right? ${t.sentence.replace('___', t.word)}`, response: 'choice', visual: null,
        answer: t.word, choices: strChoices(r, t.word, t.wrong), hint: t.chunks ? `Say it in chunks: ${t.chunks}` : `Look carefully at each spelling. This is a tricky word to learn by sight.`,
        alt: { kind: 'clue', text: `It starts with "${t.word.slice(0, 2)}"` }, worked: `The word is spelt ${t.word.split('').join('-')}.` };
    } };
  }
  E['common-words-y1'] = spellingSkill(CEW1, 'Y1', 'Tricky words (Year 1)', 'Y1 Spelling: common exception words');
  const PLURALS = [['cat', 'cats'], ['dog', 'dogs'], ['book', 'books'], ['tree', 'trees'], ['cup', 'cups'], ['box', 'boxes'], ['bus', 'buses'], ['dish', 'dishes'], ['brush', 'brushes'],
    ['fox', 'foxes'], ['match', 'matches'], ['church', 'churches'], ['glass', 'glasses'], ['kiss', 'kisses'], ['wish', 'wishes']];
  E['plurals'] = { year: 'Y1', label: 'Adding -s and -es', nc: 'Y1 Spelling: adding s and es to words (plural of nouns)',
    gen(r, L) {
      const isEs = (p) => p[1] === p[0] + 'es';
      const es = L === 1 ? PLURALS.filter(p => !isEs(p)) : L === 2 ? PLURALS.filter(isEs) : PLURALS; const [one, many] = pick(r, es);
      const wrong = isEs([one, many]) ? [one + 's', one + 'is'] : [one + 'es', one + 'z'];
      return { variant: `pl:${one}`, prompt: `One ${one}, two …`, speak: `One ${one}, two what?`, response: 'choice', visual: null, answer: many, choices: strChoices(r, many, wrong),
        hint: isEs([one, many]) ? `Say it out loud. If you hear an extra "iz" sound at the end, add -es.` : 'Most words just add -s.', alt: { kind: 'clue', text: `${one} + ${isEs([one, many]) ? 'es' : 's'}` },
        worked: `One ${one}, two ${many}.${isEs([one, many]) ? ' Words ending in s, x, sh or ch add -es.' : ''}` };
    } };
  const ROOTS_ING = ['jump', 'help', 'play', 'walk', 'kick', 'look', 'cook', 'paint', 'climb', 'pull', 'sing', 'read'];
  const ROOTS_ED = ['jump', 'help', 'play', 'walk', 'kick', 'look', 'cook', 'paint', 'climb', 'pull', 'open', 'fill'];
  const ROOTS_ER = [['quick', 'quicker', 'quickest'], ['fast', 'faster', 'fastest'], ['tall', 'taller', 'tallest'], ['small', 'smaller', 'smallest'], ['long', 'longer', 'longest'], ['old', 'older', 'oldest'], ['cold', 'colder', 'coldest']];
  E['suffixes-y1'] = { year: 'Y1', label: 'Adding -ing, -ed, -er and -est', nc: 'Y1 Spelling: adding -ing, -ed, -er and -est where no change is needed to the root word',
    gen(r, L) {
      if (L === 3) { const [root0, er, est] = pick(r, ROOTS_ER); const most = r() < 0.5;
        return { variant: `er:${root0}:${most}`, prompt: most ? `Which word means "the most ${root0}"?` : `Which word means "more ${root0}"?`,
          speak: most ? `Which word means the most ${root0}?` : `Which word means more ${root0}?`, response: 'choice', visual: null, answer: most ? est : er, choices: strChoices(r, most ? est : er, most ? [er, root0 + 'ist'] : [est, root0 + 'ir']),
          hint: '-er compares two things. -est is the most of all.', alt: { kind: 'clue', text: `${root0}, ${er}, ${est}` }, worked: `${root0}, ${er}, ${est}. The answer is ${most ? est : er}.` }; }
      if (L === 1) { const w = pick(r, ROOTS_ING); return { variant: `ing:${w}`, prompt: `Right now I am … (${w})`, speak: `Right now I am what? The word is ${w}.`, response: 'choice', visual: null,
        answer: w + 'ing', choices: strChoices(r, w + 'ing', [w + 'ed', w + 'in']), hint: 'Things happening right now often end in -ing.', alt: { kind: 'clue', text: `${w} + ing` }, worked: `${w} + ing = ${w}ing.` }; }
      const w = pick(r, ROOTS_ED); return { variant: `ed:${w}`, prompt: `Yesterday I … (${w})`, speak: `Yesterday I what? The word is ${w}.`, response: 'choice', visual: null,
        answer: w + 'ed', choices: strChoices(r, w + 'ed', [w + 'ing', w + 't']), hint: 'Things that already happened often end in -ed.', alt: { kind: 'clue', text: `${w} + ed` }, worked: `${w} + ed = ${w}ed.` };
    } };
  const UN = [['happy', 'unhappy'], ['kind', 'unkind'], ['lock', 'unlock'], ['do', 'undo'], ['tidy', 'untidy'], ['fair', 'unfair'], ['well', 'unwell'], ['safe', 'unsafe'], ['zip', 'unzip'], ['pack', 'unpack']];
  E['prefix-un'] = { year: 'Y1', label: 'Adding un-', nc: 'Y1 Spelling: the prefix un- changes the meaning of verbs and adjectives',
    gen(r, L) {
      const [w, un] = pick(r, UN);
      if (L === 3) { const others = shuffle(r, UN.filter(x => x[0] !== w)).slice(0, 2).map(x => `not ${x[0]}`);
        return { variant: `un3:${w}`, prompt: `What does "${un}" mean?`, speak: `What does ${un} mean?`, response: 'choice', visual: null, answer: `not ${w}`, choices: strChoices(r, `not ${w}`, [`very ${w}`, ...others.slice(0, 1)]),
          hint: 'un- at the start means "not" or "the opposite".', alt: { kind: 'clue', text: `un + ${w}` }, worked: `${un} means not ${w}.` }; }
      return { variant: `un:${w}`, prompt: `Which word means the opposite of "${w}"?`, speak: `Which word means the opposite of ${w}?`, response: 'choice', visual: null, answer: un,
        choices: strChoices(r, un, L === 1 ? ['re' + w, w + 'ful'] : ['dis' + w, 'in' + w]), hint: 'Add a little word to the front: un-.', alt: { kind: 'clue', text: `un + ${w}` }, worked: `un + ${w} = ${un}.` };
    } };
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  E['days-months'] = { year: 'Y1', label: 'Days and months', nc: 'Y1 Spelling: the days of the week; Y1 Measurement: language of dates, days of the week, months',
    gen(r, L) {
      const list = L === 3 ? MONTHS : DAYS; const i = int(r, 0, list.length - 1); const after = L === 1 || r() < 0.5;
      const ans = list[(i + (after ? 1 : -1) + list.length) % list.length]; const wrong = shuffle(r, list.filter(x => x !== ans && x !== list[i])).slice(0, 2);
      return { variant: `dm:${list[i]}:${after}`, prompt: `Which ${L === 3 ? 'month' : 'day'} comes ${after ? 'after' : 'before'} ${list[i]}?`, speak: `Which ${L === 3 ? 'month' : 'day'} comes ${after ? 'after' : 'before'} ${list[i]}?`,
        response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong), hint: `Say them in order: ${list.slice(0, 7).join(', ')}…`, alt: { kind: 'clue', text: list.join(', ') },
        worked: `${after ? `${list[i]}, then ${ans}` : `${ans}, then ${list[i]}`}.` };
    } };
  const CAPS = [
    ['The dog ran home.', 'the dog ran home.', 'The dog ran home'], ['We like to swim.', 'we like to swim.', 'We like to swim'], ['My cat is black.', 'my cat is black.', 'My cat is black'],
    ['It is a sunny day.', 'it is a sunny day.', 'It is a sunny day'], ['I can see a bird.', 'i can see a bird.', 'I can see a bird'], ['Sam has a red bike.', 'sam has a red bike.', 'Sam has a red bike']
  ];
  E['capital-letters'] = { year: 'Y1', label: 'Capital letters and full stops', nc: 'Y1 Punctuation: capital letters and full stops; capital letters for names and the word I',
    gen(r, L) {
      const [ok, noCap, noStop] = pick(r, L === 3 ? CAPS.slice(4) : CAPS); const wrong = L === 1 ? [noCap] : [noCap, noStop];
      return { variant: `cap:${ok}`, prompt: 'Which sentence is written correctly?', speak: 'Which sentence is written correctly?', response: 'choice', visual: null, answer: ok,
        choices: strChoices(r, ok, wrong), hint: 'A sentence starts with a capital letter and ends with a full stop. Names and "I" always have capitals.', alt: { kind: 'clue', text: 'Capital at the start. Full stop at the end.' },
        worked: `"${ok}" starts with a capital letter and ends with a full stop.` };
    } };

  // ---- Year 2 ----
  const CEW2 = [
    { word: 'because', wrong: ['becos', 'becuase'], chunks: 'be · cause', sentence: 'I smiled ___ I was happy.' }, { word: 'people', wrong: ['peeple', 'poeple'], chunks: 'peo · ple', sentence: 'Lots of ___ were at the park.' },
    { word: 'water', wrong: ['worter', 'watter'], chunks: 'wa · ter', sentence: 'Plants need ___ to grow.' }, { word: 'children', wrong: ['childern', 'chilren'], chunks: 'chil · dren', sentence: 'The ___ played outside.' },
    { word: 'would', wrong: ['whould', 'wud'], chunks: 'w · ould', sentence: 'I ___ like a drink, please.' }, { word: 'could', wrong: ['cud', 'coud'], chunks: 'c · ould', sentence: 'She ___ swim fast.' },
    { word: 'should', wrong: ['shud', 'shoud'], chunks: 'sh · ould', sentence: 'You ___ brush your teeth.' }, { word: 'beautiful', wrong: ['butiful', 'beatiful'], chunks: 'beau · ti · ful', sentence: 'What a ___ flower!' },
    { word: 'again', wrong: ['agen', 'agian'], chunks: 'a · gain', sentence: 'Can we play ___ ?' }, { word: 'money', wrong: ['muny', 'monie'], chunks: 'mon · ey', sentence: 'I saved my ___ .' },
    { word: 'parents', wrong: ['parence', 'perents'], chunks: 'par · ents', sentence: 'My ___ came to the show.' }, { word: 'every', wrong: ['evry', 'evrey'], chunks: 'ev · er · y', sentence: 'I read ___ day.' },
    { word: 'pretty', wrong: ['pritty', 'prety'], chunks: 'pret · ty', sentence: 'She drew a ___ picture.' }, { word: 'sugar', wrong: ['shugar', 'suger'], chunks: 'su · gar', sentence: 'Cakes have ___ in them.' },
    { word: 'busy', wrong: ['bizzy', 'bisy'], chunks: 'bu · sy', sentence: 'The shop was very ___ .' }, { word: 'clothes', wrong: ['klothes', 'clothz'], chunks: 'clo · thes', sentence: 'I put on my ___ .' },
    { word: 'half', wrong: ['harf', 'haf'], chunks: 'ha · lf', sentence: 'I ate ___ of the apple.' }, { word: 'many', wrong: ['meny', 'manny'], chunks: 'ma · ny', sentence: 'How ___ sweets are left?' },
    { word: 'door', wrong: ['dor', 'dore'], chunks: 'd · oor', sentence: 'Please close the ___ .' }, { word: 'climb', wrong: ['clime', 'clim'], chunks: 'cl · i · mb', sentence: 'We like to ___ trees.' },
    { word: 'behind', wrong: ['behynd', 'beehind'], chunks: 'be · hind', sentence: 'The cat hid ___ the sofa.' }, { word: 'father', wrong: ['fawther', 'fathur'], chunks: 'fa · ther', sentence: 'My ___ makes pancakes.' },
    { word: 'hour', wrong: ['houre', 'howr'], chunks: 'h · our', sentence: 'The film lasts one ___ .' }, { word: 'improve', wrong: ['improov', 'impruve'], chunks: 'im · prove', sentence: 'Practice helps you ___ .' }
  ];
  E['spelling-choice'] = spellingSkill(CEW2, 'Y2', 'Tricky words (Year 2)', 'Y2 Spelling: common exception words');
  const SUFFIX2 = {
    1: [['help', 'ful', 'helpful'], ['care', 'ful', 'careful'], ['play', 'ful', 'playful'], ['hope', 'less', 'hopeless'], ['help', 'less', 'helpless'], ['care', 'less', 'careless'], ['colour', 'ful', 'colourful']],
    2: [['kind', 'ness', 'kindness'], ['dark', 'ness', 'darkness'], ['sad', 'ness', 'sadness'], ['enjoy', 'ment', 'enjoyment'], ['move', 'ment', 'movement'], ['pay', 'ment', 'payment'], ['ill', 'ness', 'illness']],
    3: [['slow', 'ly', 'slowly'], ['quick', 'ly', 'quickly'], ['sad', 'ly', 'sadly'], ['happy', 'ly', 'happily'], ['careful', 'ly', 'carefully'], ['loud', 'ly', 'loudly']]
  };
  E['suffixes-y2'] = { year: 'Y2', label: 'Adding -ful, -less, -ness, -ment and -ly', nc: 'Y2 Spelling: the suffixes -ment, -ness, -ful, -less and -ly',
    gen(r, L) {
      const [root0, suf, ans] = pick(r, SUFFIX2[L]); const naive = root0 + suf;
      const BAD = { ful: ['full', 'fel'], less: ['les', 'lass'], ness: ['nes', 'niss'], ment: ['mant', 'mint'], ly: ['ley', 'lee'] };
      const wrong = [...new Set([naive !== ans ? naive : null, ...BAD[suf].map(b => root0 + b)])].filter(x => x && x !== ans).slice(0, 2);
      return { variant: `suf2:${ans}`, prompt: `${root0} + ${suf} = ?`, speak: `${root0} add ${suf}. Which spelling is right?`, response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong),
        hint: ans === 'happily' ? 'When a word ends in y after a consonant, change the y to i first.' : suf === 'ful' ? '-ful only has one l.' : 'Usually you just add the ending.',
        alt: { kind: 'clue', text: `${root0} + ${suf}` }, worked: `${root0} + ${suf} = ${ans}.` };
    } };
  const HOMO2 = {
    1: [['I have ___ cats.', 'two', ['to', 'too']], ['I am going ___ the park.', 'to', ['two', 'too']], ['Can I come ___?', 'too', ['two', 'to']], ['We swam in the ___.', 'sea', ['see']], ['I can ___ a bird.', 'see', ['sea']], ['A ___ makes honey.', 'bee', ['be']]],
    2: [['Come over ___.', 'here', ['hear']], ['I can ___ music.', 'hear', ['here']], ['The sky is ___.', 'blue', ['blew']], ['The wind ___ my hat off.', 'blew', ['blue']], ['Our team ___ the match.', 'won', ['one']], ['The ___ is hot today.', 'sun', ['son']]],
    3: [['The children put on ___ coats.', 'their', ['there', "they're"]], ['___ going to the zoo.', "They're", ['There', 'Their']], ['Put the box over ___.', 'there', ['their', "they're"]], ['Please be ___ in the library.', 'quiet', ['quite']], ['The ___ rode a horse.', 'knight', ['night']], ['A brown ___ lives in the woods.', 'bear', ['bare']]]
  };
  function homophoneSkill(bank, year, label, nc) {
    return { year, label, nc, gen(r, L) {
      const [sentence, ans, wrong] = pick(r, bank[L]);
      return { variant: `hom:${sentence}`, prompt: sentence.replace('___', '_____'), speak: `Which word fits? ${sentence.replace('___', ans)}`, response: 'choice', visual: null, answer: ans,
        choices: strChoices(r, ans, wrong), hint: 'These words sound the same but mean different things. Read the whole sentence.', alt: { kind: 'clue', text: `Think about what the sentence means.` },
        worked: `${sentence.replace('___', ans)} "${ans}" is the right word here.` };
    } };
  }
  E['homophones-y2'] = homophoneSkill(HOMO2, 'Y2', 'Words that sound the same (Year 2)', 'Y2 Spelling: homophones and near-homophones');
  const CONTR = { 1: [['can not', "can't"], ['did not', "didn't"], ['is not', "isn't"], ['do not', "don't"]], 2: [['has not', "hasn't"], ['could not', "couldn't"], ['I will', "I'll"], ['it is', "it's"], ['we are', "we're"]] };
  E['contractions'] = { year: 'Y2', label: 'Shortened words', nc: "Y2 Punctuation: apostrophes to mark where letters are missing in spelling",
    gen(r, L) {
      if (L === 3) { const item = pick(r, [["___ raining today.", "It's", ['Its', 'Its\'']], ["I ___ find my shoe.", "can't", ['cant', "ca'nt"]], ["We ___ go out in the rain.", "didn't", ['didnt', "did'nt"]]]);
        return { variant: `con3:${item[0]}`, prompt: item[0].replace('___', '_____'), speak: `Which one is written correctly? ${item[0].replace('___', item[1])}`, response: 'choice', visual: null, answer: item[1],
          choices: strChoices(r, item[1], item[2]), hint: 'The apostrophe goes where the missing letter was.', alt: { kind: 'clue', text: 'Find the missing letter.' }, worked: `${item[1]} is the short way to write it.` }; }
      const [full, short] = pick(r, CONTR[L]); const bad1 = short.replace("'", ''); const i = short.indexOf("'"); const bad2 = short.slice(0, Math.max(1, i - 1)) + "'" + short.slice(Math.max(1, i - 1)).replace("'", '');
      return { variant: `con:${full}`, prompt: `How do we write "${full}" in a shorter way?`, speak: `How do we write ${full} in a shorter way?`, response: 'choice', visual: null, answer: short,
        choices: strChoices(r, short, [...new Set([bad1, bad2, full.replace(' ', "'")])].filter(x => x !== short).slice(0, 2)), hint: 'The apostrophe goes where the letters are missing.', alt: { kind: 'clue', text: `${full}: which letter is left out?` },
        worked: `${full} becomes ${short}. The apostrophe shows where the missing letter was.` };
    } };
  const WC = [
    { s: 'The dog jumped over the gate.', noun: 'dog', verb: 'jumped', adj: null, others: ['over', 'the'] }, { s: 'A tall girl ran fast.', noun: 'girl', verb: 'ran', adj: 'tall', others: ['fast'] },
    { s: 'The red bus stopped.', noun: 'bus', verb: 'stopped', adj: 'red', others: ['The'] }, { s: 'My little brother sings.', noun: 'brother', verb: 'sings', adj: 'little', others: ['My'] },
    { s: 'The happy baby laughed.', noun: 'baby', verb: 'laughed', adj: 'happy', others: ['The'] }, { s: 'A big fish swam away.', noun: 'fish', verb: 'swam', adj: 'big', others: ['away'] },
    { s: 'The cold wind blew.', noun: 'wind', verb: 'blew', adj: 'cold', others: ['The'] }, { s: 'Two hungry cats ate.', noun: 'cats', verb: 'ate', adj: 'hungry', others: ['Two'] }
  ];
  E['word-classes'] = { year: 'Y2', label: 'Nouns, verbs and adjectives', nc: 'Y2 Grammar: noun, verb and adjective; expanded noun phrases',
    gen(r, L) {
      const cls = L === 1 ? 'noun' : L === 2 ? 'verb' : 'adj'; const pool = WC.filter(x => x[cls]); const t = pick(r, pool);
      const wrong = [t.noun, t.verb, t.adj, ...t.others].filter(w => w && w !== t[cls]).slice(0, 2);
      const name = { noun: 'noun (a naming word)', verb: 'verb (a doing word)', adj: 'adjective (a describing word)' }[cls];
      return { variant: `wc:${cls}:${t.s}`, prompt: `Which word is a ${name}?`, speak: `Which word is a ${name}? ${t.s}`, response: 'choice', visual: { kind: 'sentence', text: t.s }, answer: t[cls],
        choices: strChoices(r, t[cls], wrong), hint: { noun: 'A noun names a person, animal, place or thing.', verb: 'A verb is what someone or something does.', adj: 'An adjective tells you more about a noun.' }[cls],
        alt: { kind: 'clue', text: { noun: 'Who or what is the sentence about?', verb: 'What happened?', adj: 'Which word describes something?' }[cls] }, worked: `"${t[cls]}" is the ${name.split(' (')[0]}.` };
    } };
  const STYPES = [
    ['The cat is asleep.', 'statement'], ['We went to the beach.', 'statement'], ['Where is my bag?', 'question'], ['Can you help me?', 'question'],
    ['Shut the door.', 'command'], ['Wash your hands.', 'command'], ['What a lovely day it is!', 'exclamation'], ['How tall you have grown!', 'exclamation']
  ];
  E['sentence-types'] = { year: 'Y2', label: 'Kinds of sentence', nc: 'Y2 Grammar: statement, question, exclamation and command',
    gen(r, L) {
      const kinds = L === 1 ? ['statement', 'question'] : L === 2 ? ['statement', 'question', 'command'] : ['statement', 'question', 'command', 'exclamation'];
      const [s, k] = pick(r, STYPES.filter(x => kinds.includes(x[1])));
      return { variant: `st:${s}`, prompt: 'What kind of sentence is this?', speak: `What kind of sentence is this? ${s}`, response: 'choice', visual: { kind: 'sentence', text: s }, answer: k,
        choices: kinds.map(x => ({ value: x, label: x[0].toUpperCase() + x.slice(1) })), hint: 'A question asks something. A command tells someone to do something. An exclamation starts with What or How and ends with !',
        alt: { kind: 'clue', text: `Look at the first word and the last mark.` }, worked: `"${s}" is a ${k}.` };
    } };
  const CONJ2 = [['I wore a coat ___ it was cold.', 'because', ['but', 'or']], ['I have a cat ___ a dog.', 'and', ['because', 'if']], ['Do you want milk ___ juice?', 'or', ['because', 'when']],
    ['I like peas ___ I do not like carrots.', 'but', ['because', 'or']], ['We can go to the park ___ it stops raining.', 'when', ['but', 'or']], ['You can have a sweet ___ you eat your dinner.', 'if', ['but', 'or']]];
  E['conjunctions-y2'] = { year: 'Y2', label: 'Joining words', nc: 'Y2 Grammar: subordination (when, if, that, because) and co-ordination (or, and, but)',
    gen(r, L) {
      const bank = L === 1 ? CONJ2.slice(0, 3) : CONJ2; const [s, ans, wrong] = pick(r, bank);
      return { variant: `cj2:${s}`, prompt: s.replace('___', '_____'), speak: `Which joining word fits? ${s.replace('___', ans)}`, response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong),
        hint: 'Read the sentence with each word. Which one makes sense?', alt: { kind: 'clue', text: 'because gives a reason. but shows something different. or gives a choice.' }, worked: `${s.replace('___', ans)}` };
    } };
  const PAST = { 1: [['jump', 'jumped'], ['play', 'played'], ['walk', 'walked'], ['help', 'helped'], ['look', 'looked']], 2: [['run', 'ran'], ['swim', 'swam'], ['eat', 'ate'], ['see', 'saw'], ['go', 'went'], ['sing', 'sang'], ['write', 'wrote'], ['take', 'took']],
    3: [['run', 'running'], ['swim', 'swimming'], ['hop', 'hopping'], ['sit', 'sitting'], ['skip', 'skipping'], ['shop', 'shopping']] };
  E['past-tense'] = { year: 'Y2', label: 'Past and present tense', nc: 'Y2 Grammar: present and past tenses correctly and consistently, including the progressive form',
    gen(r, L) {
      const [w, ans] = pick(r, PAST[L]);
      const prompt = L === 3 ? `I was … (${w})` : `Yesterday I … (${w})`;
      const wrong = L === 3 ? [w + 'ing', w + 'eing'] : L === 2 ? [w + 'ed', w + 's'] : [w + 's', w + 'ing'];
      return { variant: `pt:${w}:${L}`, prompt, speak: `${prompt.replace(' … ', ' what? ').replace(/\(.*\)/, `The word is ${w}.`)}`, response: 'choice', visual: null, answer: ans,
        choices: strChoices(r, ans, [...new Set(wrong)].filter(x => x !== ans).slice(0, 2)), hint: L === 3 ? 'Short words with one vowel double the last letter before -ing.' : L === 2 ? 'Some verbs change completely in the past.' : 'Most verbs add -ed for the past.',
        alt: { kind: 'clue', text: L === 3 ? `${w} → double the last letter + ing` : `Today I ${w}. Yesterday I …` }, worked: `${prompt.replace('…', ans).replace(/\s*\(.*\)/, '')}.` };
    } };
  const OPPOSITES = [['hot', 'cold'], ['big', 'small'], ['up', 'down'], ['happy', 'sad'], ['fast', 'slow'], ['open', 'closed'], ['full', 'empty'], ['day', 'night'], ['wet', 'dry'], ['heavy', 'light'], ['early', 'late'], ['loud', 'quiet']];
  E['opposites'] = { year: 'Y2', label: 'Opposites', nc: 'Y2 Reading: discussing and clarifying the meanings of words',
    gen(r, L) {
      const pool = L === 1 ? OPPOSITES.slice(0, 8) : OPPOSITES; const [w, o] = pick(r, pool); const others = shuffle(r, pool.filter(p => p[0] !== w).map(p => p[1])).slice(0, L === 3 ? 3 : 2);
      return { variant: `opp:${w}`, prompt: `What is the opposite of “${w}”?`, speak: `What is the opposite of ${w}?`, response: 'choice', visual: null, answer: o, choices: strChoices(r, o, others),
        hint: `Think of something that is not ${w} at all.`, alt: { kind: 'clue', text: `If it is not ${w}, it is…` }, worked: `The opposite of ${w} is ${o}.` };
    } };
  // Short original passages. Each question has one answer stated in the text.
  const PASSAGES = {
    Y2: [
      { text: 'Maya has a pet rabbit called Pip. Pip is white with brown ears. Every morning Maya gives Pip carrots and fresh water.', qs: [['What colour are Pip\'s ears?', 'brown', ['white', 'black']], ['What does Maya give Pip every morning?', 'carrots and water', ['apples and milk', 'bread and water']], ['What kind of animal is Pip?', 'a rabbit', ['a cat', 'a dog']]] },
      { text: 'On Saturday it rained, so Leo stayed inside. He built a tall tower with blocks. When his sister knocked it down, he built it again.', qs: [['Why did Leo stay inside?', 'it rained', ['he was ill', 'it was dark']], ['What did Leo build?', 'a tower', ['a car', 'a house']], ['Who knocked the tower down?', 'his sister', ['his dog', 'his dad']]] },
      { text: 'The class planted sunflower seeds in May. They watered them every day. By July the sunflowers were taller than the teacher.', qs: [['When did the class plant the seeds?', 'May', ['July', 'June']], ['How often did they water them?', 'every day', ['once a week', 'never']]] }
    ],
    Y3: [
      { text: 'Owls hunt mostly at night. Their large eyes help them see in the dark, and their soft feathers let them fly almost silently. In the day, many owls rest in trees.', qs: [['When do owls mostly hunt?', 'at night', ['in the morning', 'at lunchtime']], ['What helps owls fly almost silently?', 'soft feathers', ['large eyes', 'long legs']], ['Where do many owls rest in the day?', 'in trees', ['in water', 'underground']]] },
      { text: 'Ravi was nervous before the swimming gala. His coach reminded him to breathe slowly. Ravi finished second, and he felt proud because he had beaten his best time.', qs: [['How did Ravi feel before the gala?', 'nervous', ['bored', 'angry']], ['Why did Ravi feel proud?', 'he beat his best time', ['he came first', 'he won a medal']], ['What did the coach remind him to do?', 'breathe slowly', ['swim faster', 'eat breakfast']]] },
      { text: 'The library opens at nine o\'clock. Children can borrow up to four books for three weeks. Books returned late cost nothing, but you are asked to bring them back quickly.', qs: [['How many books can children borrow?', 'four', ['three', 'nine']], ['For how long can they keep the books?', 'three weeks', ['four weeks', 'nine days']]] }
    ]
  };
  function readingSkill(year) {
    return { year, label: `Reading and understanding (${year === 'Y2' ? 'Year 2' : 'Year 3'})`, nc: `${year} Reading comprehension: answering questions about what they have read; retrieving information`,
      gen(r, L) {
        const p = pick(r, PASSAGES[year]); const q = pick(r, L === 1 ? p.qs.slice(0, 1) : p.qs);
        return { variant: `rd:${q[0]}`, prompt: q[0], speak: q[0], response: 'choice', visual: { kind: 'passage', text: p.text }, answer: q[1], choices: strChoices(r, q[1], q[2]),
          hint: 'Read the passage again and find the sentence that answers the question.', alt: { kind: 'clue', text: 'The answer is written in the passage.' }, worked: `Look back at the passage. The answer is "${q[1]}".` };
      } };
  }
  E['reading-y2'] = readingSkill('Y2');

  // ---- Year 3 ----
  const W34 = [
    { word: 'answer', wrong: ['anser', 'arnswer'], sentence: 'Do you know the ___?' }, { word: 'believe', wrong: ['beleive', 'beleve'], sentence: 'I ___ you.' },
    { word: 'bicycle', wrong: ['bicicle', 'bycycle'], sentence: 'I rode my ___ to school.' }, { word: 'build', wrong: ['bild', 'biuld'], sentence: 'We will ___ a den.' },
    { word: 'caught', wrong: ['cort', 'cought'], sentence: 'She ___ the ball.' }, { word: 'different', wrong: ['diffrent', 'diferent'], sentence: 'Every snowflake is ___ .' },
    { word: 'difficult', wrong: ['dificult', 'difficalt'], sentence: 'The puzzle was ___ .' }, { word: 'early', wrong: ['erly', 'urly'], sentence: 'We got up ___ .' },
    { word: 'enough', wrong: ['enuff', 'enouf'], sentence: 'Is there ___ cake for everyone?' }, { word: 'favourite', wrong: ['favrite', 'faverite'], sentence: 'Blue is my ___ colour.' },
    { word: 'February', wrong: ['Febuary', 'Febrary'], sentence: 'My birthday is in ___ .' }, { word: 'fruit', wrong: ['froot', 'frute'], sentence: 'Eat some ___ every day.' },
    { word: 'group', wrong: ['groop', 'grupe'], sentence: 'We worked in a ___ .' }, { word: 'heard', wrong: ['heared', 'hurd'], sentence: 'I ___ a strange noise.' },
    { word: 'height', wrong: ['hight', 'heighth'], sentence: 'We measured our ___ .' }, { word: 'important', wrong: ['importent', 'inportant'], sentence: 'Sleep is ___ for growing.' },
    { word: 'island', wrong: ['iland', 'ieland'], sentence: 'The boat sailed to the ___ .' }, { word: 'knowledge', wrong: ['nolege', 'knowlege'], sentence: 'Books add to your ___ .' },
    { word: 'library', wrong: ['libary', 'liberry'], sentence: 'We borrowed books from the ___ .' }, { word: 'minute', wrong: ['minit', 'minnut'], sentence: 'Wait a ___, please.' },
    { word: 'often', wrong: ['offen', 'ofen'], sentence: 'We ___ go swimming.' }, { word: 'probably', wrong: ['probly', 'probaly'], sentence: 'It will ___ rain later.' },
    { word: 'question', wrong: ['qestion', 'questoin'], sentence: 'Can I ask a ___?' }, { word: 'remember', wrong: ['rember', 'remeber'], sentence: 'I ___ my first day at school.' },
    { word: 'separate', wrong: ['seperate', 'seprate'], sentence: 'Keep the paints ___ .' }, { word: 'straight', wrong: ['strate', 'strayt'], sentence: 'Draw a ___ line.' },
    { word: 'surprise', wrong: ['suprise', 'surprize'], sentence: 'The party was a ___ .' }, { word: 'thought', wrong: ['thort', 'thougt'], sentence: 'I ___ about it all day.' },
    { word: 'through', wrong: ['throo', 'thruogh'], sentence: 'We walked ___ the forest.' }, { word: 'weight', wrong: ['weit', 'wieght'], sentence: 'What is the ___ of the parcel?' }
  ];
  E['spelling-y3'] = spellingSkill(W34, 'Y3', 'Spelling words (Years 3 and 4 list)', 'Y3 Spelling: words from the statutory years 3 and 4 word list');
  const PREFIX3 = {
    1: [['agree', 'disagree', ['unagree', 'misagree']], ['appear', 'disappear', ['unappear', 'inappear']], ['happy', 'unhappy', ['dishappy', 'inhappy']], ['obey', 'disobey', ['unobey', 'misobey']]],
    2: [['do again', 'redo', ['undo', 'subdo']], ['behave badly', 'misbehave', ['rebehave', 'disbehave']], ['a boat that goes under the sea', 'submarine', ['supermarine', 'remarine']], ['a big shop', 'supermarket', ['submarket', 'automarket']]],
    3: [['possible', 'impossible', ['inpossible', 'unpossible']], ['legal', 'illegal', ['inlegal', 'unlegal']], ['regular', 'irregular', ['inregular', 'unregular']], ['correct', 'incorrect', ['imcorrect', 'uncorrect']], ['polite', 'impolite', ['inpolite', 'dispolite']]]
  };
  E['prefixes-y3'] = { year: 'Y3', label: 'Prefixes', nc: 'Y3 Spelling: prefixes un-, dis-, mis-, in-, il-, im-, ir-, re-, sub-, super-, auto-',
    gen(r, L) {
      const [base, ans, wrong] = pick(r, PREFIX3[L]);
      const prompt = L === 2 ? `Which word means "${base}"?` : `Which word means "not ${base}"${L === 1 ? ' or the opposite' : ''}?`;
      return { variant: `pf:${ans}`, prompt, speak: prompt.replace(/"/g, ''), response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong.filter(Boolean)),
        hint: L === 3 ? 'Before p or m use im-. Before l use il-. Before r use ir-. Otherwise in-.' : L === 2 ? 're- means again. mis- means wrongly. sub- means under. super- means above or big.' : 'dis- and un- make the opposite.',
        alt: { kind: 'clue', text: 'un-, dis-, in- = not. re- = again. mis- = wrongly. sub- = under. super- = above.' }, worked: `The word is ${ans}.` };
    } };
  const HOMO3 = {
    1: [['May I have a ___ of cake?', 'piece', ['peace']], ['Let\'s ___ at the park.', 'meet', ['meat']], ['The ___ landed at the airport.', 'plane', ['plain']], ['Did you ___ that noise?', 'hear', ['here']]],
    2: [['Press the ___ to stop the bike.', 'brake', ['break']], ['It was a ___ game. Everyone had a turn.', 'fair', ['fare']], ['The horse has a long ___.', 'mane', ['main']], ['The football ___ was shining.', 'medal', ['meddle']]],
    3: [['___ coat is this?', 'Whose', ["Who's"]], ['___ coming to the party?', "Who's", ['Whose']], ['Everyone came ___ Sam.', 'except', ['accept']], ['The ___ is sunny today.', 'weather', ['whether']], ['I have ___ that film.', 'seen', ['scene']]]
  };
  E['homophones-y3'] = homophoneSkill(HOMO3, 'Y3', 'Words that sound the same (Years 3 and 4)', 'Y3 Spelling: homophones and near-homophones');
  const AAN = { 1: [['apple', 'an'], ['egg', 'an'], ['orange', 'an'], ['dog', 'a'], ['cat', 'a'], ['igloo', 'an']], 2: [['elephant', 'an'], ['banana', 'a'], ['umbrella', 'an'], ['tree', 'a'], ['octopus', 'an'], ['zebra', 'a']],
    3: [['hour', 'an'], ['unicorn', 'a'], ['honest answer', 'an'], ['uniform', 'a'], ['one-way street', 'a'], ['European city', 'a']] };
  E['a-or-an'] = { year: 'Y3', label: 'A or an', nc: 'Y3 Grammar: use of the forms a or an according to whether the next word begins with a consonant or a vowel',
    gen(r, L) {
      const [w, ans] = pick(r, AAN[L]);
      return { variant: `aan:${w}`, prompt: `Which word goes before "${w}"?`, speak: `Is it a ${w} or an ${w}?`, response: 'choice', visual: null, answer: ans, choices: [{ value: 'a', label: 'a' }, { value: 'an', label: 'an' }],
        hint: L === 3 ? 'Listen to the first sound, not the first letter. "Hour" starts with a vowel sound. "Unicorn" starts with a "y" sound.' : 'Use "an" before a vowel sound: a, e, i, o, u.',
        alt: { kind: 'clue', text: `Say "${w}" out loud. What is the first sound?` }, worked: `We say ${ans} ${w}.` };
    } };
  const CONJ3 = [['We went inside ___ it started to rain.', 'when', ['although', 'so']], ['Wash your hands ___ you eat.', 'before', ['because', 'although']], ['I was tired ___ I went to bed early.', 'so', ['although', 'before']],
    ['___ it was cold, we played outside.', 'Although', ['Because', 'So']], ['I read a book ___ I waited.', 'while', ['so', 'although']], ['We cheered ___ our team scored.', 'because', ['although', 'before']]];
  E['conjunctions-y3'] = { year: 'Y3', label: 'Conjunctions for time and cause', nc: 'Y3 Grammar: conjunctions to express time and cause (when, before, after, while, so, because, although)',
    gen(r, L) {
      const bank = L === 1 ? CONJ3.slice(0, 3) : CONJ3; const [s, ans, wrong] = pick(r, bank);
      return { variant: `cj3:${s}`, prompt: s.replace('___', '_____'), speak: `Which word fits best? ${s.replace('___', ans)}`, response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, wrong),
        hint: 'Does the word tell you when, why, or something surprising?', alt: { kind: 'clue', text: 'when and before tell you time. because and so tell you why. although shows a surprise.' }, worked: s.replace('___', ans) };
    } };
  const ADV = { 1: [['She ran quickly.', 'quickly', ['ran', 'She']], ['The cat purred softly.', 'softly', ['cat', 'purred']], ['He shouted loudly.', 'loudly', ['He', 'shouted']]],
    2: [['We will go to the park soon.', 'soon', ['park', 'go']], ['Yesterday we visited Gran.', 'Yesterday', ['visited', 'Gran']], ['I will tidy up later.', 'later', ['tidy', 'I']]],
    3: [['The ball rolled under the table.', 'under', ['ball', 'rolled']], ['The dog slept beside the fire.', 'beside', ['slept', 'fire']], ['We walked across the bridge.', 'across', ['walked', 'bridge']]] };
  E['adverbs-prepositions'] = { year: 'Y3', label: 'Adverbs and prepositions', nc: 'Y3 Grammar: adverbs and prepositions to express time, place and cause',
    gen(r, L) {
      const [s, ans, wrong] = pick(r, ADV[L]); const what = L === 3 ? 'preposition (it tells you where)' : L === 2 ? 'adverb that tells you when' : 'adverb that tells you how';
      return { variant: `adv:${s}`, prompt: `Which word is the ${what}?`, speak: `Which word is the ${what}? ${s}`, response: 'choice', visual: { kind: 'sentence', text: s }, answer: ans, choices: strChoices(r, ans, wrong),
        hint: L === 3 ? 'Prepositions tell you where things are: under, over, beside, across.' : L === 2 ? 'Some adverbs tell you when: soon, later, yesterday.' : 'Many adverbs that tell you how end in -ly.', alt: { kind: 'clue', text: L === 3 ? 'Where?' : L === 2 ? 'When?' : 'How?' },
        worked: `"${ans}" is the ${what.split(' (')[0]}.` };
    } };
  const PERFECT = [['She ___ her lunch already.', 'has eaten', ['have eaten', 'has ate']], ['They ___ to London before.', 'have been', ['has been', 'have went']], ['I ___ my homework.', 'have finished', ['has finished', 'have finish']],
    ['He ___ his bike.', 'has fixed', ['have fixed', 'has fix']], ['We ___ this film before.', 'have seen', ['has seen', 'have saw']], ['The bird ___ away.', 'has flown', ['have flown', 'has flew']]];
  E['present-perfect'] = { year: 'Y3', label: 'Has and have (present perfect)', nc: 'Y3 Grammar: use of the present perfect form of verbs instead of the simple past',
    gen(r, L) {
      const bank = L === 1 ? PERFECT.slice(0, 3) : PERFECT; const [s, ans, wrong] = pick(r, bank);
      return { variant: `pp:${s}`, prompt: s.replace('___', '_____'), speak: `Which is right? ${s.replace('___', ans)}`, response: 'choice', visual: null, answer: ans, choices: strChoices(r, ans, L === 1 ? wrong.slice(0, 1) : wrong),
        hint: 'Use "has" with he, she, it or one thing. Use "have" with I, you, we, they.', alt: { kind: 'clue', text: `Who is the sentence about?` }, worked: s.replace('___', ans) };
    } };
  E['reading-y3'] = readingSkill('Y3');

  // ---------- registry ----------
  const SKILLS = {};
  for (const [id, s] of Object.entries(M)) SKILLS[id] = Object.assign({ subject: 'maths' }, s);
  for (const [id, s] of Object.entries(E)) SKILLS[id] = Object.assign({ subject: 'english' }, s);
  const MAX_LEVEL = 3;
  const skillsIn = (subject, year) => Object.keys(SKILLS).filter(k => SKILLS[k].subject === subject && SKILLS[k].year === year);

  // England: the school year starts on 1 September. A child starts Reception in the September after they turn 4.
  function schoolYearFor(birthday, today) {
    const ay = (iso) => { const d = new Date(iso + 'T00:00:00'); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; };
    const n = ay(today) - (ay(birthday) + 5); // 0 = Reception
    return { index: n, label: n < 0 ? 'Not yet in Reception' : n === 0 ? 'Reception' : `Year ${n}`, start: YEARS[Math.max(0, Math.min(YEARS.length - 1, n))] };
  }

  const api = { CONTENT_VERSION, YEARS, YEAR_LABEL, SKILLS, MAX_LEVEL, skillsIn, schoolYearFor, PIC, namesOf, INITIAL, startsWithSound, CEW1, CEW2, W34, HOMO2, HOMO3, PASSAGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LLCurriculum = api;
})(typeof window !== 'undefined' ? window : globalThis);
