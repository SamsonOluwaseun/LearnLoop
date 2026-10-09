# Chrome Web Store submission pack (LearnLoop 1.2.0)

Everything needed to fill in the Chrome Web Store developer dashboard. Copy each field as it is.

## Before you start

1. Sign in at https://chrome.google.com/webstore/devconsole with the Google account that will own LearnLoop. Pay the one-off developer registration fee (US$5 at the time of writing) and verify the contact email.
2. Upload `dist/learnloop-extension-1.2.0.zip` (the same file as `download/LearnLoop-v1.2.0.zip`). Upload the zip itself. Don't extract it.
3. Fill in the tabs below, then press **Submit for review**. Reviews usually take a few days. Choose **Publish automatically after approval** if you want it live straight away.

## Store listing tab

**Name** (from the manifest): LearnLoop

**Summary** (from the manifest, 121 characters):
Turns some YouTube time into short, kind Maths, English and 11+ practice for primary children. Free, offline and private.

**Category:** Education (Family is a good second choice if Education is not offered)

**Language:** English (United Kingdom)

**Description:**

LearnLoop turns some of your children's YouTube time into short, kind learning sessions.

You choose the rule, for example 5 minutes of video and then up to 10 minutes of learning. When the time is up, LearnLoop shows a gentle countdown, pauses the video and keeps its place, and opens a short session in Maths, English or 11+ reasoning. When the learning is done, your child goes back to the same video at the same point.

WHAT CHILDREN SEE
• Big, friendly questions with Help me, Say it again, Try another way and I need a break
• A clue when an answer is wrong, then a worked example, never a punishment
• Sessions that always end on time, and finish early once they show they understand
• Questions read aloud for younger children, using the voices already on the computer
• Extra practice whenever they like, with an optional "beat your own best" round that is only ever them against their own score

WHAT THEY LEARN
• Maths and English that follow the national curriculum in England, from Reception to Year 6
• Optional 11+ verbal and non-verbal reasoning for Years 4 to 6 (general practice, not tied to any area or exam board)
• Your child's own spelling list, for example this week's school spellings
• Each skill gets harder as your child answers well without help, and easier if it is a struggle. Parents see why every level changed.

WHAT PARENTS CONTROL
• Video and learning times for each child, a daily video limit and the length of practice
• Topics to focus on or skip
• A parent PIN with a recovery code
• A report of measured video time, learning time and answers, with CSV export and an optional weekly summary

HONEST ABOUT TIME
LearnLoop counts only real watching: a video playing in the front tab with the computer unlocked. Paused videos and background tabs are not counted. It is a family tool, not a lock, and the parent page lists the usual ways round it and what to do about them.

PRIVATE BY DESIGN
Everything stays on your computer. No account, no adverts, no analytics, and nothing is sent over the internet.

FREE AND OPEN SOURCE
MIT licence. Code, curriculum map and test reports: https://github.com/SamsonOluwaseun/LearnLoop

Powered by Samlytics Data Services.

**Graphic assets**
- Store icon 128 x 128: `extension/icons/128.png`
- Screenshots 1280 x 800 (upload in this order): `store/chrome-web-store/screenshots/1-learning.png`, `2-countdown.png`, `3-reasoning.png`, `4-report.png`, `5-topics.png`
- Small promo tile 440 x 280: `store/chrome-web-store/promo-440x280.png`

**Official URL:** leave blank unless you verify a domain.
**Homepage URL:** https://samsonoluwaseun.github.io/LearnLoop/
**Support URL:** https://github.com/SamsonOluwaseun/LearnLoop/issues

## Privacy practices tab

**Single purpose description:**
LearnLoop helps parents turn some of their children's YouTube viewing time into short learning sessions. It measures when a YouTube video is playing, pauses it after the time the parent chose, runs a short Maths, English or reasoning session, and then returns the child to the same video.

**Permission justifications**

| Permission | Justification |
|---|---|
| storage | Keeps the parent's settings, the children's profiles and learning results on this computer. Nothing is sent anywhere. |
| alarms | Keeps the measured time and the weekly report schedule accurate when the background worker sleeps. |
| idle | Stops counting video time when the computer is locked or asleep, so only real watching is counted. |
| tts | Reads questions aloud for young children using the voices installed on the computer. |
| declarativeNetRequestWithHostAccess | During a learning session, sends youtube.com pages to LearnLoop's learning screen, and stops doing so when the session ends. |
| scripting | Starts measuring in YouTube tabs that were already open when LearnLoop was installed or updated, so they are not missed. |
| notifications | Tells the parent when the weekly report is ready. |
| Host permission *://*.youtube.com/* | Needed to see whether a video is playing, show the countdown, pause the video, and save its position so the child can return to it. LearnLoop does not read video titles, comments or browsing history. |

**Remote code:** No, I am not using remote code. All code is in the package.

**Data usage:** tick none of the data types. LearnLoop does not collect or transmit user data. Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://samsonoluwaseun.github.io/LearnLoop/privacy.html

## Distribution tab

- **Visibility:** Public (or Unlisted for a quiet family pilot first, so only people with the link can install it)
- **Regions:** All regions, or United Kingdom first. The content follows the curriculum in England.

## After approval

1. Copy the store link and replace the download links on `docs/index.html` and in the README with it.
2. Existing users of the downloaded version should remove it in `chrome://extensions` and add the store version. Settings do not carry over between the two, because Chrome treats them as different extensions. Export the CSV first if you want to keep the history.
