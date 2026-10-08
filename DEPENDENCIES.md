# Dependencies and assets

LearnLoop has no runtime code dependencies. Everything it needs ships inside the extension folder.

| Asset | Where | Licence | Notes |
|---|---|---|---|
| Montserrat (500, 700, 800, Latin) | `extension/fonts/` | SIL Open Font Licence 1.1 | From the `@fontsource/montserrat` 5.3.0 package. Brand typeface named in the Samlytics guidelines. |
| Samlytics Data Services logo | `extension/brand/`, `extension/icons/` | Owned by Samlytics Data Services, not open source | Used with the owner's permission. |
| Emoji pictures | Not bundled | Drawn by the Windows emoji font | Look different on other systems. |
| Reading voices | Not bundled | Installed Windows voices | Used through `chrome.tts`. |

Development only (not shipped): Node.js test runner, Python Playwright for the end-to-end test, ffmpeg-generated test clip `tests/e2e/clip.webm` (synthetic test pattern).
