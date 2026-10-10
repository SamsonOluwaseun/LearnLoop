# LearnLoop guide video: YouTube upload pack

**File:** `LearnLoop-setup-guide.mp4` (1920 x 1080, 86 seconds, no sound)
**Thumbnail:** `youtube-thumbnail.png` (1280 x 720)

The video uses real LearnLoop screens with a synthetic child called Joy. The cartoon is drawn by LearnLoop's own test page, so there is no one else's content in it.

## Upload settings

- **Title:** LearnLoop: turn YouTube time into learning time (5-minute setup)
- **Audience:** choose **No, it's not made for kids**. The video is for parents setting LearnLoop up, not for children to watch.
- **Visibility:** Public or Unlisted. The Chrome Web Store accepts either, but not Private.
- **Category:** Education
- **Language:** English (United Kingdom)

## Description

LearnLoop is a free, open-source Chrome extension for families. After the YouTube time you choose, it opens a short Maths, English or 11+ reasoning session that follows the national curriculum in England. When the learning is done, your child goes back to the same video at the same point.

In this video:
0:00 What LearnLoop does and how to add it
0:09 Choose a parent PIN
0:19 Add your child and choose the times
0:29 How watching is counted, and the gentle countdown
0:40 The learning session, with help when it's needed
1:02 Back to the video, the report and spelling lists

Free, with no account, no adverts and no tracking. Everything stays on your laptop.

Website and privacy policy: https://samsonoluwaseun.github.io/LearnLoop/
Open source on GitHub: https://github.com/SamsonOluwaseun/LearnLoop

Made by a parent, for parents. Powered by Samlytics Data Services.

## Optional voice-over script

The video has no sound. YouTube Studio cannot add your own voice, so the voice goes into the file before upload. Open `voice-recorder.html` (or https://samsonoluwaseun.github.io/LearnLoop/voice-recorder.html), record each line, download the zip, then run `python3 store/video/build-video.py learnloop-voice-over.zip`. That makes `LearnLoop-setup-guide-voice.mp4`, with each scene lengthened to fit its line. Each line matches one scene. YouTube only shows chapters that are at least 10 seconds long, which is why some are grouped.

1. (0:00) Meet LearnLoop. Your children watch, then they learn, then they watch again.
2. (0:05) Add LearnLoop to Chrome. It's free, with no account and no adverts.
3. (0:10) Choose a parent PIN. It keeps the settings for grown-ups.
4. (0:14) Write down your recovery code, just in case.
5. (0:19) Add your child. Their date of birth sets the school year they start at. Then choose the video and learning times.
6. (0:25) On YouTube, your child taps their name.
7. (0:30) LearnLoop only counts real watching, when a video is playing in front of them.
8. (0:35) When the time is up, there's a gentle countdown, and the video pauses and keeps its place.
9. (0:41) Then a short learning session that follows the national curriculum in England.
10. (0:46) Stuck? Help me gives a clue. Wrong answers are never punished.
11. (0:52) Answers they give by themselves fill the stars.
12. (0:56) Enough of those and they can go back early. Sessions always end on time.
13. (1:02) Back to the same video, at the same point.
14. (1:08) And you can see real progress in the report.
15. (1:14) Focus on topics, and add this week's school spellings.
16. (1:19) LearnLoop is free, private and open source. Find it on our website.

## Rebuilding the video

```bash
python3 store/video/capture.py      # real screens from the extension (about 2 minutes)
python3 store/video/build-video.py  # the video and the thumbnail
```
