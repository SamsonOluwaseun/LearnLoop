# Architecture (version 1.1.0)

LearnLoop is a single Chrome Manifest V3 extension. Every part runs inside Chrome on the laptop. Nothing talks to the internet.

| Part | File | Job |
|---|---|---|
| Question bank | `extension/curriculum.js`, `extension/curriculum-ks2.js`, `extension/reasoning.js` | 123 skills. `curriculum.js` holds Reception to Year 3 and the shared helpers. `curriculum-ks2.js` adds Years 4 to 6 Maths and English. `reasoning.js` adds the Reasoning (11+ practice) track for Years 4 to 6. Each pack adds its skills through `install()`, which refuses duplicate ids. Maths, number, letter and shape puzzles are generated and calculated, word items are written by hand. Drawings are SVG built by the pack's own code, never from outside input. See docs/CURRICULUM.md. |
| Tutoring engine | `extension/engine.js` | Grading, hints, worked examples, session and mastery rules. Deterministic. No AI model. |
| Core rules | `extension/core.js` | Stored data shape, crediting watch time, switching states, daily limit, overrides, PIN hashing, reports, per-skill levels, the year each child works at, and session planning. Pure functions so they can be unit tested. |
| Background worker | `extension/background.js` | Holds the stored state, receives heartbeats, decides when to switch, redirects YouTube during learning, speaks with Windows voices (`chrome.tts`). |
| YouTube script | `extension/content.js` | Measures playback on the page with a monotonic clock, shows "Who's watching?", the countdown and the "Learning time first" screen. |
| Learning screen | `extension/learn.html`, `learn.js` | The child's questions. |
| Parent pages | `extension/options.html`, `options.js`, `popup.*` | PIN, children and rules, overrides, report, export, deletion. |

## States

`entertainment → transition → learning ⇄ break → entertainment`, plus `rest` (daily limit reached) and parent overrides. `recover()` moves an abandoned countdown into learning. It never awards credit.

## How watch time is measured

1. Every second the YouTube script measures the time since the last tick with `performance.now()` (a monotonic clock, so changing the Windows clock has no effect).
2. It counts a second only if the video is playing, the page is visible and the window has focus. Background playback and picture in picture are counted separately and never added to the balance.
3. Every 5 seconds it sends the totals to the background worker. The worker credits them only if they came from the selected tab of the focused Chrome window, and only if `chrome.idle` does not report the laptop as locked. Only one tab can meet that test, so several YouTube tabs or windows are never double counted.
4. A gap longer than 5 seconds between ticks (sleep, a frozen page, a clock jump) is never counted. Heartbeats over 30 seconds are rejected and logged as gaps.
5. Wall-clock time is used only to label days and report rows.
6. Time that is not counted is still recorded by reason (window not in front, background tab, locked, picture in picture, during learning, another tab selected, nobody chosen). Alongside counted time, the script records how far the video's own position moved on, ignoring jumps. This explains differences between measured time and video length without storing what was watched.
7. If an update cannot reach the background worker, the YouTube tab keeps the time and sends it with the next update.

## Persistence and recovery

All state lives in `chrome.storage.local` and is written through a queue so messages never overwrite each other. The background worker can be suspended at any time without losing anything. Learning progress (elapsed time, answers by themselves) is saved every 5 seconds and after each answer. A crash or closed tab resumes the session, it does not restart it. Stored history is bounded (500 sessions, 120 days of activity).

## Parent unlock

The PIN is hashed with PBKDF2-SHA256 (600,000 rounds, random salt). That is deliberately slow, so it is checked once when the parent unlocks. The background worker then issues a random token kept in `chrome.storage.session` (memory only, cleared when Chrome closes). The token expires after 15 minutes without use.

## Weekly report

`queueWeekly()` runs every minute and at start-up. On or after the chosen day it adds that week to an outbox once, keyed by the week's start date, so a laptop that was off on the day catches up and a week is never prepared twice. A Chrome notification tells the parent. Sending opens the parent's email app with a `mailto:` link holding a plain-text summary. No email password is stored.

## Picking up tabs that were already open

Chrome only adds a content script to pages loaded after the extension is installed. On install, update and browser start, the background worker adds `content.js` to any YouTube tab already open (`chrome.scripting`). A copy left behind by an older version notices that it has been disconnected and stops, and the new copy takes over.

## Decision: no native companion yet

The project brief planned a Chrome extension plus a small native Windows companion. For the first pilot, the extension alone covers everything in the Milestone 1 slice, including lock detection through `chrome.idle`. A native companion would add a second program to install, a registry entry and a code-signing problem, all before we know the core loop works for the children.

The companion is still the plan for Milestone 2, where it is needed for:
- detecting that the extension was removed or disabled (lost coverage)
- Microsoft Edge alongside Chrome without double counting
- a SQLite store, and sending the weekly email automatically with the password protected by Windows
- later, Windows app monitoring

The engine and core rules are already free of browser calls, so they can move behind the companion without rewriting.

## Resource use

There are no dependencies and no bundled runtime. The unpacked extension is about 170 KB. Memory on the target 4 GB laptop has not been measured yet. See [MANUAL-CHECKS.md](MANUAL-CHECKS.md).

## Extra practice (version 1.1)

The toolbar button opens `learn.html?practice=1`. The page asks the worker for `practiceStart`, which returns the active child, the subjects switched on, a plan for each subject and the child's own bests. When the child finishes it sends `practiceFinish`, and `recordPractice()` in `core.js` stores the session with `practice: true`, updates skill levels from the answers, and checks the own best. It never touches the runtime state, the video balance or the daily total. A best is set only by a finished 10-question round, the score is answers given without help, and time only breaks a tie (`betterThan()`).

## Topics, spelling list and gaps (version 1.2)

- `planSession()` in `core.js` applies the parent's choices: practise-again first, then focus topics (from any year), then the rest, without skipped topics. Skipping everything is ignored. The child's own spelling list joins every English session as the `my-spellings` skill once it has 3 words.
- `my-spellings` is the one skill that needs per-child content. `makeQuestion(skill, r, level, ctx)` passes `ctx` (the words and whether the child can type), and `LearningSession` takes it as `config.custom`. Wrong options come from `slips()` in `curriculum.js`, filtered against words LearnLoop knows.
- The parent page checks `chrome.extension.isAllowedIncognitoAccess()` every 5 seconds for the Close the gaps panel.

## Android app (mobile/)

The phone app reuses the extension's `curriculum*.js`, `reasoning.js`, `engine.js`, `core.js`, `learn.html` and `learn.js` unchanged. `mobile/web/build.js` copies them next to the phone screens. `mobile/web/shim.js` answers the learning screen's messages in place of the background worker. A Kotlin service counts time with the chosen video apps in front, using Android's usage events. See mobile/README.md.
