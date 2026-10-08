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
