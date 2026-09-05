# توبة · Tawbah

مساحة هادئة للاستغفار. اختر مدة الجلسة وابدأ. من الإعدادات يمكنك تغيير المظهر، وتفعيل التذكير الصوتي أو نغمة نهاية الجلسة، وتجربة كل صوت.

A quiet Arabic app for istighfar (seeking forgiveness).

**[Open Tawbah](https://edriso.github.io/tawbah/)**

## Features

- Sessions of 5, 10, 15, or 30 minutes, with pause, resume, and early finish.
- A full-page mountain scene behind the remembrance text. The central mountain starts large on phones and desktops and gradually recedes, keeping a visible peak at the end. A subtle overlay keeps text and controls readable.
- A full-height layout for phones and desktops, with light and dark themes.
- Optional spoken reminders every 10, 20, or 30 seconds. Choose the default Bader Alnufais recording (one complete repetition of “أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه”) or the original short “أستغفر الله” recording. The choice is saved; recordings never overlap.
- A separate, optional four-note chime when the timer finishes. Both sounds have preview buttons in settings. Ending a session early does not play the chime.
- A footer that alternates between Quran 3:135, framed by ﴿ ﴾ with its surah reference, and Sahih Muslim 2702b, with the narrator and collection shown.
- Keyboard controls and support for reduced motion. No accounts or analytics.

Settings are saved on your device when storage is available. Audio, fonts, and images are hosted with the app. Refreshing starts a new session. Browsers may suspend audio when the phone is locked or the page is in the background; the timer still catches up, without replaying missed reminders.

The mountain is symbolic, not a count of sins or a measure of forgiveness. It eases gently through the full selected session, retaining about 95% of its height after the first quarter, 85% halfway through, and at least 70% at the end. The same pacing applies to every duration, and pausing freezes the mountain.

## Run locally

Use Node.js 22+ and npm:

```sh
npm ci
npm run dev
```

Open the local URL at `/tawbah/`.

```sh
npm test              # Session and interaction tests
npm run build        # Verify Quran text and build into dist/
npm run preview      # Preview the production build
npm run format:check # Check formatting
```

Built with vanilla JavaScript, CSS, and Vite. No runtime dependencies or backend.

## Text and audio sources

The build verifies the complete Tanzil Uthmani corpus using SHA-256, then extracts verse 3:135 without changing its text. A mismatch stops the build. Only the selected verse is sent to the browser. See `scripts/quran.mjs`.

- [Quran 3:135 — Tanzil](https://tanzil.net/#3:135)
- [Sahih Muslim 2702b](https://sunnah.com/muslim:2702b)
- [Default recording, attributed to Bader Alnufais](https://www.youtube.com/watch?v=mjf4K7aVuUc): a single repetition trimmed from the selected video, with short fades at the edges. The recording is separate from the MIT-licensed code; see NOTICE.
- [Short spoken reminder by ArabicAudios](https://commons.wikimedia.org/wiki/File:Ar-أستغفر_الله.ogg), licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The app uses Wikimedia's MP3 transcode, with no content changes.

## Deployment

Pushes to `main` run tests, build the app, and deploy to GitHub Pages through `.github/workflows/pages.yml`. Pull requests run checks without deploying. Set the repository's Pages source to **GitHub Actions**.

## License

App code: [MIT](LICENSE). Quran text, the spoken recording, and the font retain their own licenses; see [NOTICE](NOTICE).
