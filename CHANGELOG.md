# Changelog

## 1.0.0 (8 October 2026)

First public, open-source release. Same features as 0.4.0, plus a one-click download link in the README and an invitation to share your experience on LinkedIn once setup is complete. Earlier versions were used by our family on Windows with Chrome.

## 0.4.0 (8 October 2026)

Fixed
- After setting the PIN, the parent page could jump to an empty "Who is using this laptop?" page with no tabs. The 5-second auto-refresh redrew the Right now page over the "add your children" form. The refresh now only redraws the page that is actually open, and the first-time flow goes straight to **Children and rules**.
- Text answers with capital letters (for example "Even", "February" or "Whose") could never be marked right. Answers are now matched exactly.

Added
- **Finish setting up LearnLoop** checklist on the Right now page, with a button for each remaining step.
- Question bank aligned to the national curriculum in England: 57 skills from Reception to Year 3 in Maths and English, each with three levels, hints, another way to look at it, and a worked example. New picture types: clock faces, ten-frames, tens and ones, arrays, fraction bars, coins, big letters and words, sentences and short reading passages. See docs/CURRICULUM.md.
- Starting level from date of birth: the school year in England (1 September cut-off) sets the Maths and English level. Parents can still change each one.
- Questions get harder as the child succeeds: per-skill levels move up after repeated independent success across sessions and back down when a skill is a struggle. The year moves on when most skills are secure. Every change is shown in the report and the weekly email with its reason.
- Repeated difficulty now brings back the skill with an easier example.

## 0.3.0 (7 October 2026)

Added
- Samlytics Data Services branding: logo, "Powered by Samlytics Data Services" on the parent pages, toolbar button, learning screen and YouTube countdown, the brand colours (cream, blue, navy, lime) and the Montserrat font, bundled so it works offline. The extension icon is now the Samlytics mark.
- **Where today's video time went** in the report: time counted, how far the videos moved on in that time, and each kind of time not counted (window not in front, background tab, locked, picture in picture, during the switch to learning, another tab selected). Video played before anyone chose who was watching is shown separately.
- "Video since the last learning" and "Total today" are now labelled clearly on the Right now page.

Fixed
- A 5-second update that arrived while the background worker was waking up was dropped. The YouTube tab now keeps the time and sends it with the next update.

## 0.2.0 (7 October 2026)

Fixed
- Reports could stay at 0. The report page read the totals only when opened. It now refreshes every few seconds and whenever you come back to it.
- YouTube tabs that were open before LearnLoop was installed or updated were never measured. LearnLoop now adds its script to them automatically.
- The birthday picker started at year 0002. It is now three drop-downs (day, month, year) with years from 1988 to this year, and impossible dates such as 31 February are caught.
- A child returning to a different video was paused once with "Welcome back". Only the video they left now waits for them.
- "There are 1 apples" in a worked example now reads "There is 1 apple".

Added
- Weekly report by email: parent email address, report day, a notification when it is ready, one-click send through your email app, copy text and download as a web page. Each week is prepared once, even if the laptop was off on the day.
- "Is it counting?" on the parent page and in the toolbar button, with the reason when time is not being counted.
- The parent page unlocks once per visit instead of re-checking the PIN on every click, which makes it quicker on a 4 GB laptop.

New permissions: `scripting` (to measure YouTube tabs that were already open) and `notifications` (weekly report reminder).

## 0.1.0 (6 October 2026)

First family pilot.
