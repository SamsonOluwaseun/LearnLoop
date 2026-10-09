# Test report, version 1.2.0

Date: 9 October 2026. Run on the build machine (Linux, Chromium with the unpacked extension). Earlier versions were used by the project owner's family on a Windows laptop with Chrome. A structured run of MANUAL-CHECKS.md on that laptop is still to be recorded, and versions 1.1.0 and 1.2.0 have not yet been tried on it.

## Unit tests: 76 of 76 pass

`node --test tests/*.test.js`

New in 1.2.0:
- your own spelling list: the right spelling appears once, wrong options are never another word on the list or a word LearnLoop knows, level 3 asks the child to type the word (or gives choices when typing is off), and typed spellings ignore capital letters
- spelling words are cleaned: single words only, no repeats, at most 30, with rejected entries reported
- focus topics come first (including one from another year), skipped topics are left out, skipping everything is ignored rather than leaving an empty session, and the spelling list joins English once it has 3 words
- a session built from the plan asks the child's own words
- "letters for numbers" always finds exactly one answer (checked over 40,000 questions)

## End-to-end, Chrome extension: 78 of 78 checks pass

`python3 tests/e2e/run_e2e.py` loads the real extension in Chromium against a local stand-in video page. The test copy of the extension exposes the current answer so the test can answer right or wrong on purpose. That hook is not in the release. One check (a large typed answer with a comma) only runs when such a question comes up, so the total can vary by one between runs. The same thing is covered by a unit test.

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
| Right now warns that Incognito windows are not covered yet | Pass |
| Spelling words are cleaned and a bad entry is explained | Pass |
| Topic choices and the spelling list are saved for that child | Pass |
| English starts with the child's own spelling words | Pass |
| A listen button is shown for spelling even without read-aloud | Pass |
| No script errors in any page | Pass |

## Android app screens: 17 of 17 checks pass

`python3 tests/mobile/run_mobile_web.py` builds the phone app's web part and runs it in Chromium at phone size (390 x 844), with a stand-in for the Android side. It shows the screens, storage, learning and practice work, and that the app tells Android the right things. It cannot test the Android code itself.

| Check | Result |
|---|---|
| First run asks for a parent PIN | Pass |
| PIN is stored only as a salted hash | Pass |
| A child is saved with the school year from the birthday | Pass |
| Android is told who to count and for how long | Pass |
| Phone setup explains each permission in plain words | Pass |
| Start counting turns on the Android counter | Pass |
| A gentle countdown names the child, the minutes and the subject | Pass |
| The learning screen from the extension runs inside the app | Pass |
| Answering by themselves finishes the session early | Pass |
| The session is saved with answers by themselves, not as practice | Pass |
| Android is told learning has finished | Pass |
| Back to my video leaves the app for YouTube | Pass |
| The child's home screen greets them and offers practice | Pass |
| Practice is saved as practice and "I'm done" returns home | Pass |
| A wrong PIN is refused | Pass |
| The report shows YouTube time from Android and learning from the app | Pass |
| No script errors | Pass |

## Android app build

GitHub builds the Android test app on every change to `mobile/` or `extension/` (`.github/workflows/android.yml`). The first build of the Kotlin code passed. **The app has not yet been installed on a real phone.** Usage access, the counting service, opening over YouTube, restart after reboot and battery use are all untested. See the phone checks in mobile/PLAN.md.

## Bugs found and fixed in this round
- A reasoning "letters for numbers" question could very rarely fail to find a single right answer, which would have stopped the session. Found by a test that generates many questions. It now always finds one.
- The first Android workflow file had a YAML error, and the Android SDK setup step failed on GitHub's runner. Both fixed, and the build now uses the runner's own Android SDK.

## Not tested yet
- Real YouTube on the 4 GB laptop with version 1.2.0, Windows voices reading the new question types, and memory use.
- Whether Year 4 to 6 children find the new questions and the shape puzzles clear. That needs families with older children.
- How the drawings look with Windows display scaling at 125% and 150%.
- Whether the level rules feel right for real children. That needs the family pilot.
- The Windows settings files in tools/windows on a real Windows laptop.
- LearnLoop in Microsoft Edge.
- The Android app on a real phone.
