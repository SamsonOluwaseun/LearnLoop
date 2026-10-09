# Microsoft Edge Add-ons submission pack (LearnLoop 1.2.0)

Edge uses the same Chromium extension package as Chrome, and registering is free.

1. Sign in at https://partner.microsoft.com/dashboard/microsoftedge/overview with a Microsoft account and register as an Edge extension developer.
2. Choose **Create new extension** and upload `dist/learnloop-extension-1.2.0.zip`.
3. Reuse the text from `store/chrome-web-store/LISTING.md`: the description, the permission justifications, the privacy policy URL (https://samsonoluwaseun.github.io/LearnLoop/privacy.html) and the screenshots.
4. Category: Education. Markets: all, or United Kingdom first.

## Test before you submit

LearnLoop is built to work in Edge, but it has only been tested in Chrome and Chromium so far. Before submitting, load it in Edge on the family laptop:

1. Go to `edge://extensions`, turn on **Developer mode**, click **Load unpacked** and choose the extracted folder.
2. Run checks 1 to 10 in `docs/MANUAL-CHECKS.md`, especially the countdown, the switch to learning, the return to the video and the reading voice.
3. Record what you saw in `docs/TEST-REPORT.md`.
