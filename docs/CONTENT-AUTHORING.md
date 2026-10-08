# Writing questions

All questions live in `extension/curriculum.js`. Each skill has:

- an `id`, a `subject` (maths or english) and a `year` (R, Y1, Y2 or Y3)
- `nc`: the national curriculum or early years statement it follows
- `gen(r, level)`: returns one question for level 1, 2 or 3

Each question gives a prompt, the words to read aloud, an optional picture (`visual`), the answer, the choices, a hint, another way to look at it (`alt`) and a worked example. Maths answers are calculated. English items are written by hand.

## Rules for English items
- Use words children meet in that school year. The curriculum's spelling appendix lists them.
- Spelling: one correct spelling and two wrong ones that are **not real words**.
- Homophones and joining words: the sentence must make only one choice correct.
- First sounds: a wrong picture must not have any common name starting with the target sound. Add other names to `PIC` so the tests can check this.
- Reading passages: original text, and each answer must be stated in the passage.
- Bump `CONTENT_VERSION` when you change any item.

## Rules for everyone
- Never ask an AI model to write or mark questions that children see without a person reviewing them.
- No brand names, characters or questions copied from other apps, schemes or textbooks.
- Run `node --test tests/*.test.js`. The tests generate thousands of questions per skill and level and check each has exactly one right answer, distinct choices, a hint and a worked example.

## Where skills live (version 1.1)

- `extension/curriculum.js`: Reception to Year 3, and the helpers every pack can use (`C.helpers`).
- `extension/curriculum-ks2.js`: Years 4 to 6 Maths and English. Drawings use `C.svg`.
- `extension/reasoning.js`: Reasoning (11+ practice), Years 4 to 6.

A pack is a function that receives the bank and calls `C.install({ ... })`. Every skill names its own `subject` and `year`. A new pack file must also be added to `importScripts` in `background.js`, the script tags in `learn.html` and `options.html`, `web_accessible_resources` in `manifest.json`, and the `require` list at the end of `curriculum.js`.

For picture options (shape puzzles), give each option a `key` that describes exactly what is drawn, and use it as the option's value. The tests use the keys to prove the options all differ and that only one fits the rule. Never copy questions from published 11+ papers, CGP, Twinkl or similar. Write original ones.

After adding skills, run `node --test tests/*.test.js` and `node scripts/gen-curriculum.js` to update docs/CURRICULUM.md.
