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
- 123 skills: Maths and English from Reception to Year 6, aligned to the national curriculum in England, and Reasoning (11+ practice) for Years 4 to 6.
- Writing, handwriting and drawing or measuring with a ruler or protractor are not covered. Children in Year 7 and above will find the questions easy.
- The Reasoning track is general 11+ practice. It does not follow the format of any particular test (for example GL Assessment or CEM) or any area's schools, and it is not a prediction of a test result.
- Each 11+ style skill has a small hand-written word bank (about 4 to 6 items per level for word puzzles), so children will meet the same word puzzles again. Number, letter and shape puzzles are generated, so they vary much more.
- Shape puzzles are drawn in fixed colours (white, light blue and dark navy) and described in words for screen readers, but a child who cannot see the shapes cannot answer them yet.
- **Beat your own best** shows the time taken. The score is the number answered without help, and time only breaks a tie. It is only ever compared with the same child's own best.
- Extra practice from the toolbar button never earns video time. That is deliberate. Earned bonus time for approved learning sites (for example Numbots) is planned for a later version.
- First sounds and word reading use pictures. They are practice, not a phonics assessment. Windows voices cannot say pure letter sounds, so LearnLoop speaks example words instead.
- There are only a few reading passages per year so far, so children will see them again.
- The level rules (5 of the last 6 without help across 2 sessions, and so on) are starting points for a family pilot, not proven teaching rules.
- Picture questions use the Windows emoji font, so pictures look different on other systems.
- A revised national curriculum is planned from September 2028. The content will need checking against it.

## Reporting
- Reports are shown on the laptop and can be exported as CSV or as a web page.
- The weekly report is prepared automatically, but the parent sends it through their own email app with one click. LearnLoop does not store email passwords, so it cannot send by itself yet. Fully automatic sending is planned with the Windows helper (Milestone 2).
- If the laptop has no default email app, the **Send** button does nothing. Use **Copy text** instead.
- There are no active hours or exceptions for schoolwork videos yet.

## Not yet measured
- Memory and CPU use on the 4 GB test laptop with YouTube playing. See MANUAL-CHECKS.md.
- Reading voices on the actual laptop.
