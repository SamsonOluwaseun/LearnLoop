# Known limitations (version 1.0.0)

Please read these before relying on LearnLoop.

## It is a family tool, not a lock
- Anyone who can open `chrome://extensions` can turn LearnLoop off or remove it. The parent PIN protects LearnLoop's own settings, not Chrome's.
- It is installed in Developer mode because it is not on the Chrome Web Store yet.
- It only works in the Chrome profile where it is installed. Microsoft Edge, other browsers, other Chrome profiles, Guest mode and Incognito are not covered. Incognito would only be covered if you allow it in the extension's details, and that is not tested.
- It does not control Windows apps, the YouTube app, smart TVs, tablets or phones.
- A local Windows administrator can always get round it. For more protection, give the children a standard (non-administrator) Windows account.
- If LearnLoop is removed or turned off, it cannot report that it was removed. This is planned for Milestone 2.

## Measurement
- Only `youtube.com` pages are watched. YouTube videos embedded in other websites are not counted.
- Background playback (audio in another tab) and picture in picture are **not** counted. They are recorded as "playback not counted" in the report. Background time is approximate because Chrome slows down hidden tabs.
- Adverts that play inside the YouTube player count as watching.
- Watching time is real time on screen. At 2x speed a 6:30 video counts as about 3:15. The report shows how far the videos moved on so parents can see this.
- The YouTube countdown card uses Windows' own font, because a web page's fonts cannot be loaded inside it. All LearnLoop pages use Montserrat.
- If YouTube changes how its page is built, detection could stop working until LearnLoop is updated.
- Video time uses the focused Chrome window. If a child watches on one screen while another app has focus, that time is not counted.

## Learning content
- 57 skills from Reception to Year 3 in Maths and English, aligned to the national curriculum in England. Year 4 and above are not covered yet, so older children will find the questions easy.
- Writing, handwriting, geometry, measures of length, mass and capacity, and statistics are not covered.
- First sounds and word reading use pictures. They are practice, not a phonics assessment. Windows voices cannot say pure letter sounds, so LearnLoop speaks example words instead.
- There are only a few reading passages per year so far, so children will see them again.
- The level rules (5 of the last 6 without help across 2 sessions, and so on) are starting points for a family pilot, not proven teaching rules.
- Picture questions use the Windows emoji font, so pictures look different on other systems.
- A revised national curriculum is planned from September 2028. The content will need checking against it.

## Reporting
- Reports are shown on the laptop and can be exported as CSV or as a web page.
- The weekly report is prepared automatically, but the parent sends it through their own email app with one click. LearnLoop does not store email passwords, so it cannot send by itself yet. Fully automatic sending is planned with the Windows helper (Milestone 2).
- If the laptop has no default email app, the **Send** button does nothing. Use **Copy text** instead.
- Birthdays can be from 1988 onwards, but questions currently only go up to Year 2.
- There are no active hours or exceptions for schoolwork videos yet.

## Not yet measured
- Memory and CPU use on the 4 GB test laptop with YouTube playing. See MANUAL-CHECKS.md.
- Reading voices on the actual laptop.
