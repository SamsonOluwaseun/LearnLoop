# Test report, version 1.0.0

Date: 8 October 2026. Run on the build machine (Linux, Chromium with the unpacked extension). Version 1.0.0 has the same code as 0.4.0 apart from the version number. Earlier versions were used by the project owner's family on a Windows laptop with Chrome. A structured run of MANUAL-CHECKS.md on that laptop is still to be recorded.

## Unit tests: 54 of 54 pass

`node --test tests/*.test.js`

New in 0.4.0:
- every one of the 57 skills at all 3 levels produces valid questions (600 per skill in the unit test, and 68,400 in a larger sweep during development)
- school year from date of birth with the 1 September cut-off, and a birthday passing never changes the level
- levels move up only after 5 of 6 independent answers over 2 sessions, never from helped answers, and move back when a skill is a struggle
- the year moves up and back with a reason, parents can set it, and finishing a session records why levels changed
- session plans put practise-again and week-old skills first at each skill's level, and repeated difficulty brings an easier example
- first-sound pictures never have another name starting with the target sound, and capital-letter answers are marked exactly

## End-to-end: 59 of 59 checks pass

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
| No script errors in any page | Pass |

## Bugs found and fixed in this round
- The parent page was replaced by an empty "Who is using this laptop?" page after setting the PIN (reported by the project owner, reproduced by the test, fixed).
- Capitalised answers could never be marked right.
- "trees" was treated as an -es plural and offered twice.

## Not tested yet
- Real YouTube on the 4 GB laptop with version 0.4.0, Windows voices reading the new question types, and memory use.
- Whether the level rules feel right for real children. That needs the family pilot.
