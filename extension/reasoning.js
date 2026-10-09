/* LearnLoop question bank: Reasoning (a general 11+ style track for Years 4, 5 and 6).
 *
 * This is a general practice track, not tied to any area, school or exam board. It covers the two reasoning
 * pillars that most selective tests use alongside English and Maths: verbal reasoning and non-verbal reasoning.
 * Every question here is original. No published paper, provider question or answer key is copied.
 * Number and letter puzzles are generated and calculated by code. Word puzzles are written and reviewed by hand,
 * and the hidden-word puzzles are checked by code. Shape puzzles are drawn by code, and the tests check that
 * exactly one option fits the rule. No AI model writes or marks anything here.
 */
(function (root) {
  'use strict';
  function pack(C) {
    const { pick, int, shuffle, numChoices, strChoices } = C.helpers;
    const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const L = (i) => AZ[i];
    const idx = (ch) => AZ.indexOf(ch);
    const R = {};

    // =====================================================================================
    // VERBAL REASONING
    // =====================================================================================

    // ---- letter series ----
    R['letter-series'] = { year: 'Y4', subject: 'reasoning', label: 'Letter sequences', nc: 'Verbal reasoning: continue a sequence of letters',
      gen(r, Lv) {
        if (Lv === 1) {
          const step = int(r, 1, 3), start = int(r, 0, 25 - step * 4); const seq = [0, 1, 2, 3].map(i => L(start + step * i)); const ans = L(start + step * 4);
          const wrong = [L(start + step * 4 - 1), L(Math.min(25, start + step * 4 + 1)), L(start + step * 3)].filter(x => x !== ans);
          return { variant: `ls1:${seq.join('')}`, prompt: `What comes next? ${seq.join(', ')}, ?`, speak: `What letter comes next? ${seq.join(', ')}`, response: 'choice', visual: { kind: 'big', text: `${seq.join('  ')}  ?` },
            answer: ans, choices: strChoices(r, ans, [...new Set(wrong)].slice(0, 2)), hint: `Count how many letters you jump each time. Use the alphabet: ${AZ.split('').join(' ')}`,
            alt: { kind: 'clue', text: `Each step jumps ${step} letter${step > 1 ? 's' : ''}.` }, worked: `Each letter moves on ${step}. ${seq[3]} moves on ${step} to ${ans}.` };
        }
        // pairs of letters, each letter with its own step. Level 3 allows one letter to go backwards.
        const s1 = Lv === 2 ? int(r, 1, 2) : pick(r, [1, 2, 3]); const s2 = Lv === 2 ? int(r, 1, 3) : pick(r, [-2, -1, 2, 3]);
        const a = s1 > 0 ? int(r, 0, 25 - s1 * 4) : int(r, -s1 * 4, 25); const b = s2 > 0 ? int(r, 0, 25 - s2 * 4) : int(r, -s2 * 4, 25);
        const term = (i) => L(a + s1 * i) + L(b + s2 * i); const seq = [0, 1, 2, 3].map(term); const ans = term(4);
        const near = (x, d) => L(Math.max(0, Math.min(25, x + d)));
        const wrong = [L(a + s1 * 4) + near(b + s2 * 4, 1), near(a + s1 * 4, 1) + L(b + s2 * 4), L(b + s2 * 4) + L(a + s1 * 4), term(3)].filter(x => x !== ans);
        return { variant: `ls${Lv}:${seq.join(',')}`, prompt: `What comes next? ${seq.join(', ')}, ?`, speak: `What comes next? ${seq.join(', ')}`, response: 'choice', visual: { kind: 'big', text: `${seq.join('  ')}  ?` },
          answer: ans, choices: strChoices(r, ans, [...new Set(wrong)].slice(0, 3)), hint: 'Look at the first letters on their own, then the second letters on their own.',
          alt: { kind: 'clue', text: `First letters: ${seq.map(x => x[0]).join(' ')}. Second letters: ${seq.map(x => x[1]).join(' ')}.` },
          worked: `The first letter moves ${s1 > 0 ? 'on' : 'back'} ${Math.abs(s1)} each time and the second letter moves ${s2 > 0 ? 'on' : 'back'} ${Math.abs(s2)}. So the next pair is ${ans}.` };
      } };

    // ---- letter codes ----
    const CODE_WORDS = ['CAT', 'DOG', 'SUN', 'HAT', 'PEN', 'BOX', 'MAP', 'RUN', 'FISH', 'BIRD', 'LAMP', 'DESK', 'MILK', 'ROPE', 'KITE', 'FROG', 'CAKE', 'NEST', 'HOME', 'GOLD'];
    const shift = (w, k) => w.split('').map(ch => L(idx(ch) + k)).join('');
    const canShift = (w, k) => w.split('').every(ch => idx(ch) + k >= 0 && idx(ch) + k <= 25);
    const mirror = (w) => w.split('').map(ch => L(25 - idx(ch))).join('');
    R['letter-codes'] = { year: 'Y5', subject: 'reasoning', label: 'Letter codes', nc: 'Verbal reasoning: crack a code that moves letters along the alphabet',
      gen(r, Lv) {
        if (Lv === 3 && r() < 0.5) { // mirror code: A becomes Z, B becomes Y
          const [w1, w2] = shuffle(r, CODE_WORDS).slice(0, 2); const ans = mirror(w2);
          const wrong = [shift(w2, canShift(w2, 1) ? 1 : -1), ans.split('').reverse().join(''), mirror(w2).slice(0, -1) + L((idx(ans.slice(-1)) + 1) % 26)].filter(x => x !== ans);
          return { variant: `lcm:${w1}:${w2}`, prompt: `If ${w1} is written as ${mirror(w1)}, how is ${w2} written?`, speak: `If ${w1.split('').join(' ')} is written as ${mirror(w1).split('').join(' ')}, how is ${w2.split('').join(' ')} written?`, response: 'choice', visual: { kind: 'sentence', text: `${w1} → ${mirror(w1)}     ${w2} → ?` },
            answer: ans, choices: strChoices(r, ans, [...new Set(wrong)].slice(0, 3)), hint: 'Compare where each letter sits from the start and from the end of the alphabet.',
            alt: { kind: 'clue', text: 'A ↔ Z, B ↔ Y, C ↔ X, D ↔ W ...' }, worked: `This is a mirror code: each letter swaps with the letter the same distance from the other end. ${w2} becomes ${ans}.` };
        }
        const k = Lv === 1 ? 1 : Lv === 2 ? pick(r, [2, -1, 3]) : pick(r, [-2, 4, -3]);
        const ok = CODE_WORDS.filter(w => canShift(w, k) && canShift(w, k + 1) && canShift(w, k - 1) && canShift(w, -k));
        const [w1, w2] = shuffle(r, ok).slice(0, 2); const ans = shift(w2, k);
        const wrong = [shift(w2, k + 1), shift(w2, k - 1), shift(w2, -k)].filter(x => x !== ans);
        const dir = k > 0 ? `forward ${k}` : `back ${-k}`;
        return { variant: `lc:${k}:${w1}:${w2}`, prompt: `If ${w1} is written as ${shift(w1, k)}, how is ${w2} written?`, speak: `If ${w1.split('').join(' ')} is written as ${shift(w1, k).split('').join(' ')}, how is ${w2.split('').join(' ')} written?`, response: 'choice', visual: { kind: 'sentence', text: `${w1} → ${shift(w1, k)}     ${w2} → ?` },
          answer: ans, choices: strChoices(r, ans, [...new Set(wrong)].slice(0, Lv === 1 ? 2 : 3)), hint: `Compare the first letter of ${w1} with the first letter of its code. How far did it move?`,
          alt: { kind: 'clue', text: `${w1[0]} → ${shift(w1, k)[0]}` }, worked: `Each letter moves ${dir} in the alphabet. ${w2.split('').map(ch => `${ch} → ${shift(ch, k)}`).join(', ')}. So ${w2} is ${ans}.` };
      } };

    // ---- number sequences ----
    R['number-series'] = { year: 'Y4', subject: 'reasoning', label: 'Number sequences', nc: 'Verbal reasoning: find the rule in a number sequence',
      gen(r, Lv) {
        let seq, ans, rule, alt;
        const type = Lv === 1 ? pick(r, ['add', 'sub']) : Lv === 2 ? pick(r, ['double', 'alt', 'sub']) : pick(r, ['grow', 'interleave', 'square']);
        if (type === 'add') { const d = int(r, 2, 9), a = int(r, 1, 30); seq = [0, 1, 2, 3, 4].map(i => a + d * i); rule = `add ${d} each time`; }
        else if (type === 'sub') { const d = int(r, 2, 9), a = int(r, 40, 90); seq = [0, 1, 2, 3, 4].map(i => a - d * i); rule = `take away ${d} each time`; }
        else if (type === 'double') { const a = int(r, 1, 6); seq = [0, 1, 2, 3, 4].map(i => a * Math.pow(2, i)); rule = 'double each time'; }
        else if (type === 'alt') { const p = int(r, 2, 6), q = int(r, 1, 4), a = int(r, 1, 20); seq = [a]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + (i % 2 ? p : -q)); rule = `add ${p}, then take away ${q}, and repeat`; }
        else if (type === 'grow') { const a = int(r, 1, 10), d = int(r, 1, 3); seq = [a]; for (let i = 1; i < 5; i++) seq.push(seq[i - 1] + d + (i - 1)); rule = `the jumps grow by 1 each time: +${d}, +${d + 1}, +${d + 2}, +${d + 3}`; }
        else if (type === 'interleave') { const a = int(r, 1, 9), b = int(r, 20, 40), d = int(r, 2, 5), e = int(r, 1, 4); seq = [a, b, a + d, b - e, a + 2 * d]; rule = `two sequences take turns: ${a}, ${a + d}, ${a + 2 * d} goes up ${d}, and ${b}, ${b - e}, ${b - 2 * e} goes down ${e}`; }
        else { const s = int(r, 1, 4); seq = [0, 1, 2, 3, 4].map(i => (s + i) * (s + i)); rule = `square numbers: ${s}×${s}, ${s + 1}×${s + 1}, and so on`; }
        ans = seq[4]; const shown = seq.slice(0, 4);
        if (type === 'interleave') alt = `Look at every other number: ${seq[0]}, ${seq[2]}, ...`;
        else alt = `Jumps: ${shown.slice(1).map((v, i) => (v - shown[i] >= 0 ? '+' : '') + (v - shown[i])).join(', ')}`;
        return { variant: `ns:${type}:${shown.join(',')}`, prompt: `What comes next? ${shown.join(', ')}, ?`, speak: `What number comes next? ${shown.join(', ')}`, response: 'choice-or-type', visual: { kind: 'big', text: `${shown.join(', ')}, ?` },
          answer: ans, choices: numChoices(r, ans, -50, 999, 3, [1, 2, 3, 4]), hint: 'Work out the jump from each number to the next.', alt: { kind: 'clue', text: alt },
          worked: `The rule is: ${rule}. So the next number is ${ans}.` };
      } };

    // ---- word analogies (reviewed by hand) ----
    const ANALOGY = {
      1: [['hot', 'cold', 'up', 'down', ['high', 'top']], ['cat', 'kitten', 'dog', 'puppy', ['bone', 'kennel']], ['bird', 'nest', 'bee', 'hive', ['honey', 'flower']],
        ['foot', 'shoe', 'hand', 'glove', ['finger', 'arm']], ['cow', 'calf', 'sheep', 'lamb', ['wool', 'field']], ['day', 'night', 'early', 'late', ['soon', 'morning']]],
      2: [['author', 'book', 'composer', 'music', ['piano', 'concert']], ['fish', 'shoal', 'wolf', 'pack', ['howl', 'forest']], ['finger', 'hand', 'toe', 'foot', ['nail', 'leg']],
        ['pen', 'write', 'knife', 'cut', ['fork', 'sharp']], ['teacher', 'school', 'doctor', 'hospital', ['nurse', 'medicine']], ['caterpillar', 'butterfly', 'tadpole', 'frog', ['pond', 'fish']]],
      3: [['chapter', 'book', 'verse', 'poem', ['rhyme', 'author']], ['thermometer', 'temperature', 'ruler', 'length', ['pencil', 'straight']], ['architect', 'building', 'sculptor', 'statue', ['chisel', 'museum']],
        ['drought', 'water', 'famine', 'food', ['hunger', 'rain']], ['petal', 'flower', 'feather', 'bird', ['fly', 'wing']], ['generous', 'mean', 'brave', 'cowardly', ['bold', 'kind']]]
    };
    R['word-analogies'] = { year: 'Y5', subject: 'reasoning', label: 'Word analogies', nc: 'Verbal reasoning: complete a pair of words that are linked in the same way',
      gen(r, Lv) {
        const [a, b, c, ans, wrong] = pick(r, ANALOGY[Lv]);
        return { variant: `an:${a}:${c}`, prompt: `${a} is to ${b} as ${c} is to ?`, speak: `${a} is to ${b} as ${c} is to what?`, response: 'choice', visual: { kind: 'sentence', text: `${a} → ${b}     ${c} → ?` },
          answer: ans, choices: strChoices(r, ans, wrong), hint: `Say how ${a} and ${b} are linked in a sentence. Then use the same sentence for ${c}.`,
          alt: { kind: 'clue', text: `How is ${a} linked to ${b}?` }, worked: `${a} goes with ${b} in the same way that ${c} goes with ${ans}.` };
      } };

    // ---- odd one out (reviewed by hand) ----
    const ODD = {
      1: [[['apple', 'banana', 'pear', 'plum'], 'carrot', 'The others are fruits.'], [['red', 'blue', 'green', 'yellow'], 'chair', 'The others are colours.'],
        [['dog', 'cat', 'rabbit', 'horse'], 'table', 'The others are animals.'], [['Monday', 'Friday', 'Sunday', 'Tuesday'], 'June', 'The others are days of the week.']],
      2: [[['violin', 'cello', 'guitar', 'harp'], 'trumpet', 'The others have strings.'], [['oak', 'ash', 'birch', 'elm'], 'rose', 'The others are trees.'],
        [['triangle', 'square', 'pentagon', 'hexagon'], 'circle', 'The others have straight sides.'], [['Mars', 'Venus', 'Jupiter', 'Saturn'], 'Moon', 'The others are planets.']],
      3: [[['whisper', 'murmur', 'mutter', 'mumble'], 'shout', 'The others are ways of speaking quietly.'], [['brave', 'bold', 'fearless', 'daring'], 'timid', 'The others mean not afraid.'],
        [['ancient', 'old', 'aged', 'antique'], 'modern', 'The others mean old.'], [['river', 'stream', 'brook', 'creek'], 'hill', 'The others are flowing water.']]
    };
    R['odd-one-out'] = { year: 'Y4', subject: 'reasoning', label: 'Odd one out', nc: 'Verbal reasoning: find the word that does not belong with the others',
      gen(r, Lv) {
        const [group, ans, why] = pick(r, ODD[Lv]); const words = shuffle(r, Lv === 1 ? group.slice(0, 3) : group).concat(ans);
        const ch = shuffle(r, words);
        return { variant: `odd:${ans}`, prompt: 'Which word is the odd one out?', speak: `Which word is the odd one out? ${ch.join(', ')}`, response: 'choice', visual: null,
          answer: ans, choices: ch.map(w => ({ value: w, label: w })), hint: 'Find what most of the words have in common.', alt: { kind: 'clue', text: `What do ${group.slice(0, 2).join(' and ')} have in common?` },
          worked: `${ans} is the odd one out. ${why}` };
      } };

    // ---- closest and opposite meaning (reviewed by hand) ----
    const MEANING = {
      1: [['big', 'large', ['small', 'thin'], 'same'], ['quick', 'fast', ['slow', 'late'], 'same'], ['shut', 'close', ['open', 'lock'], 'same'], ['empty', 'full', ['bare', 'clear'], 'opposite'], ['noisy', 'quiet', ['loud', 'busy'], 'opposite']],
      2: [['vacant', 'empty', ['busy', 'full'], 'same'], ['precise', 'exact', ['rough', 'quick'], 'same'], ['feeble', 'weak', ['strong', 'tired'], 'same'], ['expand', 'shrink', ['grow', 'stretch'], 'opposite'], ['permanent', 'temporary', ['lasting', 'fixed'], 'opposite']],
      3: [['jubilant', 'joyful', ['gloomy', 'jumpy'], 'same'], ['abandon', 'desert', ['keep', 'rescue'], 'same'], ['hostile', 'unfriendly', ['welcoming', 'nervous'], 'same'], ['scarce', 'plentiful', ['rare', 'few'], 'opposite'], ['humble', 'proud', ['modest', 'meek'], 'opposite']]
    };
    R['word-meanings'] = { year: 'Y5', subject: 'reasoning', label: 'Closest and opposite meanings', nc: 'Verbal reasoning: choose the word closest in meaning, or most opposite in meaning',
      gen(r, Lv) {
        const [w, ans, wrong, kind] = pick(r, MEANING[Lv]); const q = kind === 'same' ? `Which word is closest in meaning to "${w}"?` : `Which word is most opposite in meaning to "${w}"?`;
        return { variant: `wm:${w}`, prompt: q, speak: q.replace(/"/g, ''), response: 'choice', visual: { kind: 'word', text: w }, answer: ans, choices: strChoices(r, ans, wrong),
          hint: kind === 'same' ? `Try each word in a sentence in place of "${w}". Which keeps the meaning?` : `Which word would turn the meaning of "${w}" round?`,
          alt: { kind: 'clue', text: kind === 'same' ? 'Same meaning' : 'Opposite meaning' }, worked: kind === 'same' ? `"${ans}" means nearly the same as "${w}".` : `"${ans}" is the opposite of "${w}".` };
      } };

    // ---- compound words (reviewed by hand: the wrong options make a word with only one of the starts) ----
    const COMPOUND = {
      1: [[['sun'], 'flower', ['table', 'run']], [['foot'], 'ball', ['cup', 'tree']], [['rain'], 'bow', ['door', 'sock']], [['tooth'], 'brush', ['shelf', 'kite']], [['bed'], 'room', ['milk', 'bird']], [['cup'], 'board', ['hand', 'sea']]],
      2: [[['foot', 'snow'], 'ball', ['step', 'flake']], [['rain', 'cross'], 'bow', ['coat', 'word']], [['butter', 'dragon'], 'fly', ['cup', 'milk']], [['sun', 'moon'], 'light', ['glasses', 'burn']], [['head', 'flash'], 'light', ['ache', 'back']], [['bed', 'class'], 'room', ['side', 'work']]],
      3: [[['tooth', 'paint', 'hair'], 'brush', ['paste', 'cut']], [['birth', 'holi', 'to'], 'day', ['place', 'night']], [['camp', 'bon', 'wild'], 'fire', ['site', 'life']], [['note', 'cook', 'text'], 'book', ['pad', 'ware']]]
    };
    R['compound-words'] = { year: 'Y5', subject: 'reasoning', label: 'Make a new word', nc: 'Verbal reasoning: find the word that joins on to make compound words',
      gen(r, Lv) {
        const [starts, ans, wrong] = pick(r, COMPOUND[Lv]);
        const q = starts.length === 1 ? `Which word goes after "${starts[0]}" to make a new word?` : `Which word goes after each of these to make new words: ${starts.join(', ')}?`;
        return { variant: `cw:${starts.join('+')}`, prompt: q, speak: q.replace(/"/g, ''), response: 'choice', visual: { kind: 'sentence', text: starts.map(s => `${s} ___`).join('     ') },
          answer: ans, choices: strChoices(r, ans, wrong), hint: 'Try each word after every start. It must make a real word every time.',
          alt: { kind: 'clue', text: `${starts[0]} + ? = one word` }, worked: starts.map(s => s + ans).join(', ') + '.' };
      } };

    // ---- hidden words (checked by code: the word runs across the end of one word and the start of the next) ----
    const HIDDEN = [['We must open the door.', 'stop'], ['Mum sent extra cake.', 'text'], ['The dog ate my lunch.', 'gate'], ['Please pass Pat his book.', 'this'],
      ['Did Tom eat the pie?', 'meat'], ['Our team ended the game.', 'mend'], ['The film opened today.', 'mope'], ['Ella stopped at the gate.', 'last'], ['The pupils eat lunch early.', 'seat']];
    const FILLER = ['bark', 'frog', 'lamp', 'kite', 'wolf', 'ring', 'drum', 'nest', 'coin', 'milk', 'sand', 'pond', 'rope', 'bell'];
    const joined = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
    R['hidden-words'] = { year: 'Y6', subject: 'reasoning', label: 'Hidden words', nc: 'Verbal reasoning: find a four-letter word hidden across two words in a sentence',
      gen(r, Lv) {
        const [s, ans] = pick(r, HIDDEN); const wrong = shuffle(r, FILLER.filter(w => !joined(s).includes(w))).slice(0, Lv === 1 ? 2 : 3);
        return { variant: `hw:${ans}`, prompt: 'Which four-letter word is hidden across two words in this sentence?', speak: `Which four-letter word is hidden across two words? ${s}`, response: 'choice', visual: { kind: 'sentence', text: s },
          answer: ans, choices: strChoices(r, ans, wrong), hint: 'Read the end of one word and the start of the next word together.',
          alt: { kind: 'clue', text: `Look for "${ans[0]}" at the end of a word.` }, worked: `${s.replace(/[.?]$/, '')}: the end of one word and the start of the next spell "${ans}".` };
      } };

    // ---- complete the sum ----
    R['complete-the-sum'] = { year: 'Y5', subject: 'reasoning', label: 'Balance the sum', nc: 'Verbal reasoning: find the number that makes both sides equal',
      gen(r, Lv) {
        let left, right, ans, total;
        if (Lv === 1) { const a = int(r, 3, 20), b = int(r, 3, 20); total = a + b; const c = int(r, 1, total - 1); ans = total - c; left = `${a} + ${b}`; right = `${c} + ?`; }
        else if (Lv === 2) { const a = int(r, 2, 9), b = int(r, 2, 9); total = a * b; const c = int(r, 1, total - 1); ans = total - c; left = `${a} × ${b}`; right = `${c} + ?`; }
        else { const d = pick(r, [2, 3, 4, 5, 6]); ans = int(r, 2, 9); total = d * ans; const a = int(r, total + 1, total + 30); const b = a - total; left = `${a} − ${b}`; right = `${d} × ?`; }
        return { variant: `cs:${left}=${right}`, prompt: `${left} = ${right}`, speak: `${left.replace('×', 'times').replace('−', 'take away').replace('+', 'add')} equals ${right.replace('×', 'times').replace('+', 'add').replace('?', 'what')}`, response: 'choice-or-type', visual: { kind: 'big', text: `${left} = ${right}` },
          answer: ans, choices: numChoices(r, ans, 0, 200, 3, [1, 2, 3]), hint: 'Work out the left side first. Then find what makes the right side the same.',
          alt: { kind: 'clue', text: `${left} = ${total}` }, worked: `${left} = ${total}. ${right.replace('?', ans)} = ${total} too, so the missing number is ${ans}.` };
      } };

    // ---- letters stand for numbers ----
    R['letter-sums'] = { year: 'Y6', subject: 'reasoning', label: 'Letters for numbers', nc: 'Verbal reasoning: work out sums where letters stand for numbers',
      gen(r, Lv) {
        if (Lv === 1) { // A = 1, B = 2, ... add up a short word
          const w = pick(r, ['CAB', 'BAD', 'FED', 'BED', 'DIG', 'HID', 'ACE', 'FIG', 'BIG', 'EGG']); const ans = w.split('').reduce((t, ch) => t + idx(ch) + 1, 0);
          return { variant: `lsum:${w}`, prompt: `If A = 1, B = 2, C = 3 and so on, what do the letters of ${w} add up to?`, speak: `If A is 1, B is 2, C is 3 and so on, what do the letters of ${w.split('').join(' ')} add up to?`, response: 'choice-or-type', visual: { kind: 'word', text: w },
            answer: ans, choices: numChoices(r, ans, 3, 60, 3, [1, 2]), hint: 'Count along the alphabet to find each letter\'s number.', alt: { kind: 'clue', text: w.split('').map(ch => `${ch} = ?`).join(', ') },
            worked: `${w.split('').map(ch => `${ch} = ${idx(ch) + 1}`).join(', ')}. ${w.split('').map(ch => idx(ch) + 1).join(' + ')} = ${ans}.` };
        }
        // Five letters with different values. Work out a sum and give the answer as a letter.
        for (let guard = 0; guard < 500; guard++) {
          const vals = shuffle(r, Lv === 2 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20]).slice(0, 5);
          const map = { A: vals[0], B: vals[1], C: vals[2], D: vals[3], E: vals[4] }; const ks = Object.keys(map);
          const [x, y] = shuffle(r, ks).slice(0, 2); let expr, v; const used = [x, y];
          if (Lv === 2) { if (r() < 0.5) { expr = `${x} + ${y}`; v = map[x] + map[y]; } else { expr = `${x} − ${y}`; v = map[x] - map[y]; } }
          else { const z = shuffle(r, ks.filter(k => k !== x && k !== y))[0]; used.push(z); if (r() < 0.5) { expr = `${x} × ${y} − ${z}`; v = map[x] * map[y] - map[z]; } else { expr = `(${x} + ${y}) ÷ ${z}`; v = (map[x] + map[y]) / map[z]; } }
          let hits = ks.filter(k => map[k] === v);
          // no letter has the answer yet: give it to a letter the sum does not use, as long as the values stay different
          if (!hits.length && Number.isInteger(v) && v > 0 && v <= 40) { const free = shuffle(r, ks.filter(k => !used.includes(k)))[0]; map[free] = v; hits = ks.filter(k => map[k] === v); }
          if (hits.length !== 1 || new Set(Object.values(map)).size !== 5) continue;
          const ans = hits[0]; const list = ks.map(k => `${k} = ${map[k]}`).join(', ');
          return { variant: `lsym:${list}:${expr}`, prompt: `${list}. What is ${expr}? Give your answer as a letter.`, speak: `${ks.map(k => `${k} is ${map[k]}`).join(', ')}. What is ${expr.replace('×', 'times').replace('−', 'take away').replace('÷', 'divided by').replace('+', 'add')}? Answer with a letter.`, response: 'choice', visual: { kind: 'sentence', text: list },
            answer: ans, choices: strChoices(r, ans, shuffle(r, ks.filter(k => k !== ans)).slice(0, 3)), hint: 'Swap each letter for its number, work out the answer, then find which letter has that number.',
            alt: { kind: 'clue', text: expr.replace(/[A-E]/g, k => map[k]) }, worked: `${expr.replace(/[A-E]/g, k => map[k])} = ${v}, and ${ans} = ${v}. The answer is ${ans}.` };
        }
        throw new Error('letter-sums: no unique answer found');
      } };

    // =====================================================================================
    // NON-VERBAL REASONING. Shapes are drawn by code. Each option carries a key describing exactly what is drawn,
    // so the tests can prove that the options all look different and that only one fits the rule.
    // =====================================================================================
    const f1 = (n) => +n.toFixed(1);
    const wrap = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" class="qsvg nvr">${body}</svg>`;
    const FILL = { empty: 's-empty s-line', soft: 's-soft s-line', solid: 's-fill s-line' };
    const FILL_WORD = { empty: 'white', soft: 'light', solid: 'dark' };
    function polyPts(sides, cx, cy, rad, rotDeg) {
      const pts = []; for (let i = 0; i < sides; i++) { const a = (rotDeg - 90 + i * 360 / sides) * Math.PI / 180; pts.push([f1(cx + rad * Math.cos(a)), f1(cy + rad * Math.sin(a))]); }
      return pts;
    }
    const ptsAttr = (pts) => pts.map(p => p.join(',')).join(' ');
    // An arrow pointing up before rotation. Arrows are not symmetrical under rotation, so every angle looks different.
    const ARROW = [[0, -1], [0.6, -0.2], [0.22, -0.2], [0.22, 1], [-0.22, 1], [-0.22, -0.2], [-0.6, -0.2]];
    // Shapes with no line of symmetry, so a reflection can never be matched by turning the shape.
    const CHIRAL = {
      F: [[-0.6, 1], [-0.6, -1], [0.6, -1], [0.6, -0.55], [-0.1, -0.55], [-0.1, -0.15], [0.35, -0.15], [0.35, 0.3], [-0.1, 0.3], [-0.1, 1]],
      flag: [[-0.5, 1], [-0.5, -1], [0.7, -0.6], [-0.15, -0.2], [-0.15, 1]],
      step: [[-0.8, 0.8], [-0.8, -0.2], [-0.3, -0.2], [-0.3, -0.8], [0.8, -0.8], [0.8, -0.4], [0.1, -0.4], [0.1, 0.8]]
    };
    const rot = (pts, deg) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]); };
    const flipX = (pts) => pts.map(([x, y]) => [-x, y]);
    const flipY = (pts) => pts.map(([x, y]) => [x, -y]);
    const place = (pts, cx, cy, s) => pts.map(([x, y]) => [f1(cx + x * s), f1(cy + y * s)]);
    // The key of a drawn outline: its corner points as a set, rounded, so the same picture always gives the same key.
    const outlineKey = (pts) => pts.map(([x, y]) => `${Math.round(x * 100) / 100 + 0},${Math.round(y * 100) / 100 + 0}`).sort().join(' ');

    // One item in a cell: a regular polygon, an arrow or a chiral shape, with a fill and an optional row of dots.
    function item(st, cx, cy, size) {
      let b = '';
      if (st.shape === 'arrow') b += `<polygon points="${ptsAttr(place(rot(ARROW, st.rot || 0), cx, cy, size * 0.9))}" class="${FILL[st.fill || 'soft']}"/>`;
      else if (st.shape === 'circle') b += `<circle cx="${cx}" cy="${cy}" r="${f1(size * 0.8)}" class="${FILL[st.fill || 'soft']}"/>`;
      else b += `<polygon points="${ptsAttr(polyPts(st.sides, cx, cy, size * 0.9, 0))}" class="${FILL[st.fill || 'soft']}"/>`;
      if (st.dots) for (let i = 0; i < st.dots; i++) b += `<circle cx="${f1(cx - (st.dots - 1) * 6 + i * 12)}" cy="${f1(cy + size + 12)}" r="4" class="s-dot"/>`;
      return b;
    }
    const itemKey = (st) => st.shape === 'arrow' ? `arrow:${((st.rot || 0) % 360 + 360) % 360}:${st.fill || 'soft'}:${st.dots || 0}` : `${st.shape === 'circle' ? 'circle' : 'poly' + st.sides}:${st.fill || 'soft'}:${st.dots || 0}`;
    const cellSvg = (st, label) => wrap(84, 96, item(st, 42, 40, 30), label);
    const SIDE_NAME = { 2: 'line', 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon' };
    const describe = (st) => `${st.fill ? FILL_WORD[st.fill] + ' ' : ''}${st.shape === 'arrow' ? `arrow turned ${((st.rot || 0) % 360 + 360) % 360} degrees` : st.shape === 'circle' ? 'circle' : SIDE_NAME[st.sides]}${st.dots ? ` with ${st.dots} dot${st.dots > 1 ? 's' : ''}` : ''}`;
    const LETTERS = 'ABCDE';
    // Turn a list of states into lettered picture options. The answer is the option whose key matches.
    function picOptions(r, correct, wrongs, n) {
      const seen = new Set([itemKey(correct)]); const list = [correct];
      for (const w of wrongs) { const k = itemKey(w); if (!seen.has(k) && list.length < n) { seen.add(k); list.push(w); } }
      const order = shuffle(r, list);
      return { answer: itemKey(correct), choices: order.map((st, i) => ({ value: itemKey(st), label: LETTERS[i], alt: `Option ${LETTERS[i]}: ${describe(st)}`, svg: cellSvg(st, `Option ${LETTERS[i]}`), key: itemKey(st) })) };
    }
    function strip(states, label) { // a row of cells with a question mark at the end
      const w = 86 * (states.length + 1) + 6; let b = '';
      states.forEach((st, i) => { b += `<rect x="${4 + i * 86}" y="4" width="80" height="92" rx="8" class="s-cell"/>` + item(st, 44 + i * 86, 44, 28); });
      b += `<rect x="${4 + states.length * 86}" y="4" width="80" height="92" rx="8" class="s-cell s-ask"/><text x="${44 + states.length * 86}" y="58" text-anchor="middle" class="s-big">?</text>`;
      return wrap(w, 100, b, label);
    }

    // ---- shape sequences ----
    R['nvr-series'] = { year: 'Y4', subject: 'reasoning', label: 'Shape sequences', nc: 'Non-verbal reasoning: continue a sequence of shapes',
      gen(r, Lv) {
        let seq, rule;
        if (Lv === 1) {
          if (r() < 0.5) { const s0 = int(r, 3, 4); const fill = pick(r, ['soft', 'solid']); seq = [0, 1, 2, 3, 4].map(i => ({ shape: 'poly', sides: s0 + i, fill })); rule = 'Each shape has one more side than the one before.'; }
          else { const step = pick(r, [90, -90]); const r0 = pick(r, [0, 90, 180, 270]); seq = [0, 1, 2, 3, 4].map(i => ({ shape: 'arrow', rot: r0 + step * i, fill: 'soft' })); rule = `The arrow turns a quarter turn ${step > 0 ? 'clockwise' : 'anticlockwise'} each time.`; }
        } else if (Lv === 2) {
          const step = pick(r, [45, -45, 90]); const r0 = pick(r, [0, 45, 90, 135, 180]); const fills = ['empty', 'solid'];
          seq = [0, 1, 2, 3, 4].map(i => ({ shape: 'arrow', rot: r0 + step * i, fill: fills[i % 2] }));
          rule = `The arrow turns ${Math.abs(step) === 45 ? 'an eighth of a turn' : 'a quarter turn'} ${step > 0 ? 'clockwise' : 'anticlockwise'} each time, and the colour swaps between white and dark.`;
        } else {
          const s0 = 3; const fills = ['empty', 'soft', 'solid']; const d0 = int(r, 1, 2);
          seq = [0, 1, 2, 3, 4].map(i => ({ shape: 'poly', sides: s0 + i, fill: fills[i % 3], dots: (d0 + i) % 4 || 4 }));
          rule = 'Each shape gains one side, the colours go white, light, dark and repeat, and the dots count up to 4 and start again.';
        }
        const ans = seq[4];
        const wrongs = ans.shape === 'arrow'
          ? [{ ...ans, rot: ans.rot + 90 }, { ...ans, rot: ans.rot + 180 }, { ...ans, fill: ans.fill === 'solid' ? 'empty' : ans.fill === 'empty' ? 'solid' : 'solid' }, { ...ans, rot: ans.rot - 45 }]
          : [{ ...ans, sides: ans.sides - 1 }, { ...ans, sides: ans.sides + 1 }, { ...ans, fill: ans.fill === 'solid' ? 'empty' : 'solid' }, { ...ans, dots: ans.dots ? (ans.dots % 4) + 1 : 0 }];
        const o = picOptions(r, ans, wrongs, Lv === 1 ? 3 : 4);
        return { variant: `nvs:${seq.slice(0, 4).map(itemKey).join('|')}`, prompt: 'Which shape comes next?', speak: 'Look at the shapes. Which one comes next?', response: 'choice',
          visual: { kind: 'svg', svg: strip(seq.slice(0, 4), 'A sequence of four shapes and a question mark') }, answer: o.answer, choices: o.choices,
          hint: 'Look for one thing that changes each time: sides, turning, colour or dots. Then check for a second thing.', alt: { kind: 'clue', text: Lv === 1 ? 'What changes from each shape to the next?' : 'Two or more things change. Check each one.' },
          worked: `${rule} So the next one is the ${describe(ans)}.` };
      } };

    // ---- odd one out (shapes) ----
    R['nvr-odd-one-out'] = { year: 'Y5', subject: 'reasoning', label: 'Odd shape out', nc: 'Non-verbal reasoning: find the shape that does not follow the same rule as the others',
      gen(r, Lv) {
        if (Lv === 3) { // three are the same shape turned, one is flipped over
          const name = pick(r, Object.keys(CHIRAL)); const base = CHIRAL[name]; const angles = shuffle(r, [0, 90, 180, 270]);
          const shapes = [rot(base, angles[0]), rot(base, angles[1]), rot(base, angles[2]), rot(flipX(base), angles[3])];
          const keys = shapes.map(outlineKey); const order = shuffle(r, [0, 1, 2, 3]);
          const choices = order.map((si, i) => ({ value: keys[si], label: LETTERS[i], key: keys[si], alt: `Option ${LETTERS[i]}`, svg: wrap(84, 84, `<polygon points="${ptsAttr(place(shapes[si], 42, 42, 32))}" class="s-soft s-line"/>`, `Option ${LETTERS[i]}`) }));
          return { variant: `noo3:${name}:${angles.join(',')}`, prompt: 'Which shape is the odd one out?', speak: 'Three of these shapes are the same shape turned round. Which one is different?', response: 'choice', visual: null,
            answer: keys[3], choices, rotation: { base: outlineKey(base), keys, odd: keys[3] }, hint: 'Imagine turning each shape. Can you turn it to match the others, or has it been flipped over?',
            alt: { kind: 'clue', text: 'Three are turned. One is flipped like a mirror image.' }, worked: `Option ${LETTERS[order.indexOf(3)]} is flipped over like a mirror image. The other three are the same shape turned round.` };
        }
        let states, odd, why;
        if (Lv === 1) { const n = int(r, 3, 6); const fills = shuffle(r, ['empty', 'soft', 'solid']); states = [0, 1, 2].map(i => ({ shape: 'poly', sides: n, fill: fills[i] })); odd = { shape: 'poly', sides: n === 3 ? 4 : n + pick(r, [-1, 1]), fill: pick(r, fills) }; why = `The others all have ${n} sides.`; }
        else { const ns = shuffle(r, [3, 4, 5, 6]); // dots = sides minus 2, so a triangle has 1
          states = ns.slice(0, 3).map(n => ({ shape: 'poly', sides: n, fill: 'soft', dots: n - 2 })); const m = ns[3]; odd = { shape: 'poly', sides: m, fill: 'soft', dots: m - 2 === 1 ? 2 : m - 3 }; why = 'In the others, the number of dots is 2 fewer than the number of sides.'; }
        const all = [...states, odd]; const order = shuffle(r, [0, 1, 2, 3]);
        const choices = order.map((si, i) => ({ value: itemKey(all[si]), label: LETTERS[i], key: itemKey(all[si]), alt: `Option ${LETTERS[i]}: ${describe(all[si])}`, svg: cellSvg(all[si], `Option ${LETTERS[i]}`) }));
        return { variant: `noo:${all.map(itemKey).join('|')}`, prompt: 'Which shape is the odd one out?', speak: 'Which shape is the odd one out?', response: 'choice', visual: null,
          answer: itemKey(odd), choices, hint: Lv === 1 ? 'Count the sides of each shape.' : 'Count the sides and the dots of each shape. Compare the two numbers.',
          alt: { kind: 'clue', text: Lv === 1 ? 'Sides?' : 'Sides and dots?' }, worked: `Option ${LETTERS[order.indexOf(3)]} is the odd one out. ${why}` };
      } };

    // ---- rotation and reflection ----
    function turnOptions(r, base, wantReflection, Lv) {
      const a0 = pick(r, [0, 90, 180, 270]); const shown = rot(base, a0);
      let correct, wrongs;
      if (wantReflection) { // mirror line down the right-hand side
        correct = flipX(shown); wrongs = [shown, rot(shown, 180), rot(shown, 90), flipY(shown)];
        if (Lv < 3) wrongs = wrongs.filter((_, i) => i !== 3);
      } else { // a turn, not a flip
        const turn = pick(r, [90, 180, 270]); correct = rot(shown, turn); const others = shuffle(r, [0, 90, 180, 270]);
        wrongs = others.map(a => rot(flipX(shown), a));
      }
      const seen = new Set([outlineKey(correct)]); const list = [correct];
      for (const w of wrongs) { const k = outlineKey(w); if (!seen.has(k) && list.length < 4) { seen.add(k); list.push(w); } }
      const order = shuffle(r, list);
      return { shown, answer: outlineKey(correct), choices: order.map((pts, i) => ({ value: outlineKey(pts), label: LETTERS[i], key: outlineKey(pts), alt: `Option ${LETTERS[i]}`,
        svg: wrap(84, 84, `<polygon points="${ptsAttr(place(pts, 42, 42, 32))}" class="s-soft s-line"/>`, `Option ${LETTERS[i]}`) })) };
    }
    R['nvr-rotation'] = { year: 'Y6', subject: 'reasoning', label: 'Turning shapes', nc: 'Non-verbal reasoning: recognise a shape after it has been turned (rotated), not flipped',
      gen(r, Lv) {
        const name = pick(r, Lv === 1 ? ['flag', 'step'] : Object.keys(CHIRAL)); const o = turnOptions(r, CHIRAL[name], false, Lv);
        const svg = wrap(110, 100, `<polygon points="${ptsAttr(place(o.shown, 55, 50, 36))}" class="s-fill s-line"/>`, 'The shape to turn');
        return { variant: `rot:${name}:${o.answer}`, prompt: 'Which option is this shape turned round, not flipped over?', speak: 'Which option is the same shape, just turned round? It must not be flipped over.', response: 'choice',
          visual: { kind: 'svg', svg }, answer: o.answer, choices: o.choices, rotation: { base: outlineKey(o.shown), answer: o.answer, keys: o.choices.map(c => c.key) },
          hint: 'Pick one corner or the sticking-out part. Follow it as the shape turns.', alt: { kind: 'clue', text: 'Three options are mirror images. Only one is just turned.' },
          worked: 'Only one option can be made by turning the shape. The others are flipped over like a mirror image, so they can never match by turning.' };
      } };
    R['nvr-reflection'] = { year: 'Y5', subject: 'reasoning', label: 'Mirror images', nc: 'Non-verbal reasoning: recognise the reflection of a shape in a mirror line',
      gen(r, Lv) {
        const name = pick(r, Object.keys(CHIRAL)); const o = turnOptions(r, CHIRAL[name], true, Lv);
        const svg = wrap(180, 100, `<polygon points="${ptsAttr(place(o.shown, 55, 50, 36))}" class="s-fill s-line"/><line x1="112" y1="4" x2="112" y2="96" class="s-mirror"/><text x="146" y="58" text-anchor="middle" class="s-big">?</text>`, 'A shape next to a mirror line');
        return { variant: `ref:${name}:${o.answer}`, prompt: 'Which option shows the shape reflected in the mirror line?', speak: 'Imagine a mirror on the dashed line. Which option shows what you would see?', response: 'choice',
          visual: { kind: 'svg', svg }, answer: o.answer, choices: o.choices, reflection: { shown: outlineKey(o.shown), answer: o.answer },
          hint: 'Parts near the mirror stay near the mirror. Parts on the left end up on the right.', alt: { kind: 'clue', text: 'Left and right swap. Top and bottom stay the same.' },
          worked: 'In a mirror image left and right swap over, but the top stays at the top. Only one option does exactly that.' };
      } };

    // ---- grids (matrices) ----
    function gridCell(st, x, y, size) { // several small copies of a shape in one cell
      const n = st.count || 1; let b = ''; const offs = n === 1 ? [[0, 0]] : n === 2 ? [[-14, 0], [14, 0]] : [[-16, 10], [16, 10], [0, -14]];
      for (const [dx, dy] of offs) b += item({ shape: st.shape, sides: st.sides, fill: st.fill }, x + dx, y + dy, n === 1 ? 20 : 11);
      return b;
    }
    const gKey = (st) => `${st.shape === 'circle' ? 'circle' : 'poly' + st.sides}:${st.fill}:${st.count || 1}`;
    R['nvr-matrix'] = { year: 'Y6', subject: 'reasoning', label: 'Shape grids', nc: 'Non-verbal reasoning: complete a grid of shapes by finding the rules for the rows and columns',
      gen(r, Lv) {
        const n = Lv === 1 ? 2 : 3; const shapes = shuffle(r, [{ shape: 'poly', sides: 3 }, { shape: 'poly', sides: 4 }, { shape: 'circle' }, { shape: 'poly', sides: 6 }]).slice(0, n);
        const fills = shuffle(r, ['empty', 'soft', 'solid']).slice(0, n); const grid = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          // level 1 and 2: rows set the shape, columns set the colour (level 2 adds counts by column). Level 3 shifts the colours along each row (a Latin square).
          const fill = Lv === 3 ? fills[(i + j) % n] : fills[j];
          grid.push({ ...shapes[i], fill, count: Lv === 1 ? 1 : j + 1 });
        }
        const ans = grid[grid.length - 1]; const cell = 76; const W = n * cell + 8; let b = '';
        grid.forEach((st, k) => { const i = Math.floor(k / n), j = k % n; b += `<rect x="${4 + j * cell}" y="${4 + i * cell}" width="${cell - 4}" height="${cell - 4}" rx="6" class="s-cell${k === grid.length - 1 ? ' s-ask' : ''}"/>`;
          b += k === grid.length - 1 ? `<text x="${4 + j * cell + (cell - 4) / 2}" y="${4 + i * cell + cell / 2 + 8}" text-anchor="middle" class="s-big">?</text>` : gridCell(st, 4 + j * cell + (cell - 4) / 2, 4 + i * cell + (cell - 4) / 2, cell); });
        const other = (arr, x) => arr.find(v => v !== x);
        const wrongs = [{ ...ans, fill: other(fills, ans.fill) }, { ...shapes[0], fill: ans.fill, count: ans.count }, { ...ans, count: ans.count === 1 ? 2 : ans.count - 1 }, { ...shapes[n === 2 ? 0 : 1], fill: fills[0], count: 1 }];
        const seen = new Set([gKey(ans)]); const list = [ans];
        for (const w of wrongs) if (!seen.has(gKey(w)) && list.length < 4) { seen.add(gKey(w)); list.push(w); }
        const order = shuffle(r, list);
        const choices = order.map((st, i) => ({ value: gKey(st), label: LETTERS[i], key: gKey(st), alt: `Option ${LETTERS[i]}: ${st.count || 1} ${FILL_WORD[st.fill]} ${st.shape === 'circle' ? 'circle' : SIDE_NAME[st.sides]}${(st.count || 1) > 1 ? 's' : ''}`,
          svg: wrap(84, 84, `<rect x="4" y="4" width="76" height="76" rx="6" class="s-cell"/>` + gridCell(st, 42, 42, cell), `Option ${LETTERS[i]}`) }));
        const shapeWord = ans.shape === 'circle' ? 'circle' : SIDE_NAME[ans.sides];
        return { variant: `mx${Lv}:${grid.map(gKey).join('|')}`, prompt: 'Which picture completes the grid?', speak: 'Look along the rows and down the columns. Which picture goes in the empty square?', response: 'choice',
          visual: { kind: 'svg', svg: wrap(W, W, b, `A ${n} by ${n} grid of shapes with one missing`) }, answer: gKey(ans), choices, grid: grid.map(gKey),
          hint: 'Look along the bottom row. Then look down the last column. What must the missing picture have?', alt: { kind: 'clue', text: Lv === 3 ? 'Each colour appears once in every row and once in every column.' : 'Rows share a shape. Columns share a colour.' },
          worked: `The bottom row is all ${shapeWord}s. ${Lv === 3 ? 'Each row uses every colour once, so the missing one is' : 'The last column is'} ${FILL_WORD[ans.fill]}${Lv > 1 ? `, and the last column has ${ans.count} shapes` : ''}. So the answer is ${ans.count} ${FILL_WORD[ans.fill]} ${shapeWord}${ans.count > 1 ? 's' : ''}.` };
      } };

    // ---- shape analogies ----
    const TRANSFORMS = {
      turn90: { say: 'turns a quarter turn clockwise', arrow: true, f: (s) => ({ ...s, rot: (s.rot || 0) + 90 }) },
      turn180: { say: 'turns half a turn', arrow: true, f: (s) => ({ ...s, rot: (s.rot || 0) + 180 }) },
      darken: { say: 'goes from white to dark', f: (s) => ({ ...s, fill: 'solid' }), need: (s) => s.fill === 'empty' },
      lighten: { say: 'goes from dark to white', f: (s) => ({ ...s, fill: 'empty' }), need: (s) => s.fill === 'solid' },
      addDot: { say: 'gains one dot', f: (s) => ({ ...s, dots: (s.dots || 0) + 1 }) },
      addSide: { say: 'gains one side', poly: true, f: (s) => ({ ...s, sides: s.sides + 1 }) }
    };
    R['nvr-analogy'] = { year: 'Y6', subject: 'reasoning', label: 'Shape analogies', nc: 'Non-verbal reasoning: apply the change from one shape to another shape',
      gen(r, Lv) {
        const useArrow = r() < 0.5; const startFill = pick(r, ['empty', 'solid']);
        const mk = () => useArrow ? { shape: 'arrow', rot: pick(r, [0, 90, 180, 270]), fill: startFill, dots: int(r, 0, 1) } : { shape: 'poly', sides: int(r, 3, 5), fill: startFill, dots: int(r, 0, 1) };
        const a = mk(); let c = mk(); let guard = 0; while (itemKey(c) === itemKey(a) && guard++ < 20) c = mk();
        const usable = Object.keys(TRANSFORMS).filter(k => { const t = TRANSFORMS[k]; return (!t.arrow || useArrow) && (!t.poly || !useArrow) && (!t.need || t.need(a)); });
        const ts = []; for (const k of shuffle(r, usable)) { if (ts.length >= (Lv === 1 ? 1 : 2)) break; if (TRANSFORMS[k].arrow && ts.some(x => TRANSFORMS[x].arrow)) continue; ts.push(k); } // never two turns at once
        const apply = (s, list) => list.reduce((acc, k) => TRANSFORMS[k].f(acc), s);
        const b = apply(a, ts), ans = apply(c, ts);
        const wrongs = [c, ...usable.filter(k => !ts.includes(k)).map(k => apply(c, [k])), ...ts.map(k => apply(c, ts.filter(x => x !== k))), apply(a, ts)];
        const o = picOptions(r, ans, wrongs, 4);
        return { variant: `nva:${itemKey(a)}:${ts.join('+')}:${itemKey(c)}`, prompt: 'The first shape changes into the second. Which option shows the third shape changed in the same way?', speak: 'Look at how the first shape changes. Change the third shape in the same way. Which option is it?', response: 'choice',
          visual: { kind: 'svg', svg: analogySvg(a, b, c) }, answer: o.answer, choices: o.choices, transforms: ts,
          hint: 'Say what changes from the first shape to the second: turning, colour, sides or dots.', alt: { kind: 'clue', text: `It ${ts.map(k => TRANSFORMS[k].say).join(' and ')}.` },
          worked: `The first shape ${ts.map(k => TRANSFORMS[k].say).join(' and ')}. Do the same to the third shape and you get the ${describe(ans)}.` };
      } };
    function analogySvg(a, b, c) { // two rows: a → b, then c → ?
      const row = (x, y, yy) => `<rect x="4" y="${yy}" width="80" height="92" rx="8" class="s-cell"/>` + item(x, 44, yy + 40, 26) + `<text x="110" y="${yy + 54}" text-anchor="middle" class="s-big">→</text><rect x="136" y="${yy}" width="80" height="92" rx="8" class="s-cell${y ? '' : ' s-ask'}"/>` + (y ? item(y, 176, yy + 40, 26) : `<text x="176" y="${yy + 58}" text-anchor="middle" class="s-big">?</text>`);
      return wrap(220, 200, row(a, b, 4) + row(c, null, 104), 'A shape changes into another shape. A third shape must change in the same way.');
    }

    C.install(R);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = pack; else pack(root.LLCurriculum);
})(typeof window !== 'undefined' ? window : globalThis);
