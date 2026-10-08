# Checks to do on the real Windows laptop

The automated tests run in Chromium on Linux with a stand-in video page, because the build machine cannot reach YouTube. These checks need the real laptop and real YouTube. Write the results in TEST-REPORT.md.

Before you start, set the rule to 1 minute of video and 1 to 2 minutes of learning so each check is quick. Set it back afterwards.

| # | Check | What should happen | Result |
|---|---|---|---|
| 1 | Install from the zip with Load unpacked | Parent page opens | |
| 2 | Create PIN, write down the code, add two children | Both saved | |
| 3 | Open YouTube, choose a child, play a video for 1 minute | Countdown with the right name, minutes and subject | |
| 4 | Pause for a while, then play | Paused time is not counted (see the toolbar popup) | |
| 5 | Switch to another tab while the video plays | Not counted | |
| 6 | Press Windows+L while the video plays, wait, unlock | Locked time is not counted | |
| 7 | Close the lid (sleep) during a video, wake it | Sleep is not counted | |
| 8 | Let the countdown finish | Video pauses, learning opens | |
| 9 | During learning, open YouTube in a new tab | It goes to learning instead | |
| 10 | Younger child: does each question get read aloud? Is the voice British English? | Yes | |
| 11 | Get answers wrong | Clue, then worked example, then moves on | |
| 12 | Answer 4 by yourself | Finishes early | |
| 13 | Back to my video | Same video, same place, waits for play | |
| 14 | Close Chrome during learning and open it again | Learning carries on, not restarted | |
| 15 | Restart the laptop during learning | Same as above | |
| 16 | Parent override: skip learning | Back to video, logged in the report | |
| 17 | Reach the daily limit | "That's all the video for today" | |
| 18 | Report and CSV export | Totals match what happened | |
| 19 | Forgot PIN with the recovery code | New PIN works | |
| 20 | Right now shows "Counting" while a video plays, and a reason when paused | Matches what is happening | |
| 21 | Weekly email: save your address, press "Send this to my email now" | Email app opens with the report, you can send it | |
| 22 | Set the report day to today, wait a minute | Windows notification appears, clicking it opens the report | |
| 23 | Birthday drop-downs: years 1988 to this year, 31 February refused | As described | |

## Measuring memory on the 4 GB laptop

1. Close other apps. Open Chrome with YouTube playing a video.
2. Press **Shift+Esc** in Chrome to open Chrome's Task Manager. Note the memory for **Extension: LearnLoop** and for the YouTube tab.
3. Open Windows Task Manager (**Ctrl+Shift+Esc**) > **Performance** > **Memory** and note "In use".
4. Repeat during a learning session (the learning tab replaces the YouTube tab).

Provisional targets: under 150 MB for LearnLoop while monitoring and under 250 MB during learning. Record what you actually see.
