# Test report, version 1.1.0

Date: 8 October 2026. Run on the build machine (Linux, Chromium with the unpacked extension). Earlier versions were used by the project owner's family on a Windows laptop with Chrome. A structured run of MANUAL-CHECKS.md on that laptop is still to be recorded, and version 1.1.0 has not yet been tried on it.

## Unit tests: 72 of 72 pass

`node --test tests/*.test.js`

New in 1.1.0:
- every one of the 123 skills at all 3 levels produces valid questions: exactly one right answer, no repeated options, a clue and a worked example, no missing values, and typed answers that mark correctly (450 questions per skill in the unit test, and 110,700 in a larger sweep during development)
- turning shapes: only the answer can be made by turning the shape, and every other option is a mirror image
- mirror images: the answer is the reflection in the mirror line and appears once
- odd shape out: three options are turns of each other and only the answer is flipped, or only the answer breaks the sides-and-dots rule
- shape grids: rows and columns follow their rules, and level 3 grids use each colour once per row and column
- hidden words run across two words and are never a whole word, and no wrong option is also hidden
- balancing sums, letter sums and letter codes are recalculated independently and match the answer
- Reasoning stays within Years 4 to 6, older profiles gain it switched off, and learning takes turns between all subjects switched on
- extra practice never changes the watching state, video balance or daily total
- beat your own best counts only finished rounds, never counts helped answers, and uses time only to break a tie
- typed numbers with commas and minus signs are understood

## End-to-end: 73 of 73 checks pass

`python3 tests/e2e/run_e2e.py` loads the real extension in Chromium against a local stand-in video page. The test copy of the extension exposes the current answer so the test can answer right or wrong on purpose. That hook is not in the release.

| Check | Result |
|---|---|
| Parent setup opens on install | Pass |
| PIN stored only as salted hash | Pass |
| After the PIN, the children form appears and stays (was replaced by an empty page in 0.3) | Pass |
| Birthday years run from 1988 to this year | Pass |
| Impossible birthday is caught | Pass |
| Date of birth sets the school year and starting level (Year 3 for March 2019) | Pass |
| Birthdays saved with starting levels: Joy Year 3, Sam Reception | Pass |
| Right now shows the setup steps with what to do next | Pass |
| Parent page shows the Samlytics logo with Powered by Samlytics Data Services | Pass |
| Brand font and cream background are used | Pass |
| Two profiles saved with independent rules | Pass |
| Younger child reads aloud and needs no typing | Pass |
| Asks who's watching | Pass |
| Playing video in the front tab is counted | Pass |
| Parent can see that it is counting | Pass |
| Open report updates by itself after more watching | Pass |
| Once set up and working, parents are invited to share on LinkedIn | Pass |
| Right now explains why it is or is not counting | Pass |
| Paused video is not counted | Pass |
| Video in a background tab is not counted | Pass |
| Countdown shows Powered by Samlytics Data Services with the logo | Pass |
| Gentle countdown names the child, measured minutes and subject | Pass |
| Learning screen opens after the countdown | Pass |
| Video address and position saved without extra tracking parameters | Pass |
| Opening the video site during learning goes to learning instead | Pass |
| Learning screen carries the logo and Powered by line | Pass |
| Joy's questions come from her school year (Year 3) with a curriculum skill | Pass |
| Wrong answer gets encouragement and a clue | Pass |
| Answer after a clue does not count as by themselves | Pass |
| Four independent answers finish early | Pass |
| Session stored with independent and helped answers separated | Pass |
| Fresh allowance after learning | Pass |
| Returns to the same video at the saved position | Pass |
| Video does not resume until the child presses play | Pass |
| Child can press play to carry on | Pass |
| Wrong PIN is refused | Pass |
| Parent can choose who is using the laptop | Pass |
| Younger child gets big picture or number choices and no typing box | Pass |
| Younger child has a read-aloud button | Pass |
| Hard time limit ends the session even when every answer is wrong | Pass |
| Repeated difficulty gets a worked example | Pass |
| Session ended at the 1 minute limit, with no time debt | Pass |
| Skills needing practice are saved for next time | Pass |
| After the time limit the child can return to video | Pass |
| Report shows the year each child is working at | Pass |
| Report shows both children with measured video and learning | Pass |
| A wrong email address is refused | Pass |
| Parent email and report day are saved | Pass |
| Weekly report is prepared on the report day | Pass |
| Parent gets a notification that the report is ready | Pass |
| The same week is never prepared twice | Pass |
| Weekly text shows both children with measured totals | Pass |
| Send opens an email to the parent with the report filled in | Pass |
| Sent report is marked as sent | Pass |
| Version 0.1 problem reproduced: a tab opened before install was not counted | Pass |
| Fix: LearnLoop adds its script to tabs already open, so they are counted | Pass |
| At double speed, real time is counted and the video moves on about twice as far | Pass |
| Report explains where the video time went | Pass |
| A child born in February 2016 starts at Year 6 in every subject, Reasoning included | Pass |
| Reasoning can be switched on for a child | Pass |
| Toolbar button offers practice once a child is chosen | Pass |
| Practice offers every subject switched on for the child | Pass |
| Beat your own best round starts in Reasoning | Pass |
| Reasoning questions come from Year 6 | Pass |
| Shape puzzles are drawn and visible | Pass |
| A full round of 10 sets the first personal best | Pass |
| Personal best stored for that child and subject only | Pass |
| Practice did not change video time or the watching state | Pass |
| Practice is recorded as practice the child chose | Pass |
| Stopping a round early does not set a best | Pass |
| Year 6 Maths questions are used for a Year 6 child | Pass |
| Report shows Reasoning, extra practice and the own best | Pass |
| No script errors in any page | Pass |

## Bugs found and fixed in this round
- Typed answers with four or more digits (for example 13,748) were treated as unclear input. Numbers up to a million, commas and minus signs are now understood.
- A Year 4 coordinates question could ask a point to move off the grid, which left only one option. Moves now stay on the grid.
- An odd-shape-out question could show two identical shapes. The three matching shapes now always differ in colour.
- A shape sequence could need a nine-sided shape that had no name in its description. Names now go up to ten sides.
- A shape analogy could combine two turns, which made the rule unclear. It now uses at most one turn.

## Not tested yet
- Real YouTube on the 4 GB laptop with version 1.1.0, Windows voices reading the new question types, and memory use.
- Whether Year 4 to 6 children find the new questions and the shape puzzles clear. That needs families with older children.
- How the drawings look with Windows display scaling at 125% and 150%.
- Whether the level rules feel right for real children. That needs the family pilot.
