# LearnLoop mobile: plan

## Goal

Families install LearnLoop on the phone or tablet their children actually use, set it up in a few minutes, and get the same short, kind learning breaks as the Chrome extension, with the same questions and rules.

## Decisions

- **Android first.** No Mac is needed, a test app can be installed directly, Google Play's fee is one-off, and most family tablets in the UK are Android or Amazon Fire (which runs Android apps, though Fire tablets need their own check).
- **One question bank and one set of rules.** The phone app reuses `extension/curriculum*.js`, `reasoning.js`, `engine.js`, `core.js` and the learning screen. Only the measuring and the parent screens are phone-specific.
- **Native Kotlin plus a WebView**, not a cross-platform framework, for now. It is the smallest app that can use Android's usage events and a foreground service, with no extra runtime to download. React Native or Flutter can be reconsidered when iOS starts.
- **No accounts, no internet permission, no analytics**, as in the extension.
- **Honest measuring.** On Android the app measures time with a video app on screen, not playback. The screens and report say so.

## Milestones

### M1: test version (this round)
- [x] Shared web build from the extension files
- [x] Parent PIN, recovery code, children, rules, spelling list
- [x] Phone setup screen with the two permissions explained
- [x] Counting service using usage events, with daily totals and restart after reboot
- [x] Countdown, learning, practice and a simple report
- [x] Browser test of the screens at phone size (17 checks)
- [x] GitHub builds the test app on every change
- [ ] **Install on a real Android phone** and run the checks below

### M2: family pilot on Android
- Fix what the first phone test finds
- Topics to focus on or skip, own best rounds in the report
- Battery-saver guidance for each major phone brand
- A fixed signing key kept outside the repository, so updates install over the old version
- Optional: other video apps chosen by the parent (each one tested first)

### M3: Google Play
- Google Play developer account (one-off fee) and identity checks
- Closed test with real testers before production (Google requires this for new personal accounts)
- Data safety form: no data collected or shared
- Families policy and declarations for usage access and the foreground service, with a short video showing why each is needed
- Store listing, screenshots, privacy policy (already published)

### M4: iPhone and iPad
- Apple's Screen Time framework (Family Controls, Device Activity, Managed Settings) can count minutes in chosen apps and block them until learning is done. It cannot see playback either.
- Needs: an Apple Developer Program membership (yearly fee), a Mac with Xcode, and Apple's approval for the Family Controls permission
- The learning screen and rules carry over. The measuring and blocking are written in Swift.

## Checks on a real phone (M1)

| # | Check | Expected |
|---|---|---|
| 1 | Install the test app, set a PIN, add a child | Works, recovery code shown once |
| 2 | Phone setup: grant Usage access and Display over other apps | Both show a tick |
| 3 | Start counting, watch YouTube for the set minutes | Notification counts up, countdown appears on time |
| 4 | Pause YouTube with the screen on | Still counts (the app counts time on screen, not playback). Note how this feels for families. |
| 5 | Lock the phone during YouTube | Stops counting |
| 6 | During learning, press Home and open YouTube | LearnLoop comes back within about 5 seconds |
| 7 | Finish learning, press Back to my video | YouTube returns |
| 8 | Restart the phone | Counting carries on, totals kept |
| 9 | Daily limit reached | Rest screen when YouTube is opened |
| 10 | Leave it running for a day | Note battery use in Settings > Battery |
| 11 | Memory and speed on an older phone | Note RAM and how quickly screens open |
