# توبة · Tawbah

مساحة هادئة للاستغفار. اختر مدة الجلسة وابدأ. من الإعدادات يمكنك تغيير المظهر، وتفعيل التذكير الصوتي أو نغمة نهاية الجلسة، وتجربة كل صوت.

A quiet Arabic app for istighfar (seeking forgiveness).

**[Open Tawbah](https://edriso.github.io/tawbah/)**

## Features

- Sessions of 5, 10, 15, or 30 minutes, with pause, resume, and early finish.
- A mountain that gradually recedes, keeping a visible peak at the end.
- A full-height layout for phones and desktops, with light and dark themes.
- Optional spoken “أستغفر الله” reminders every 10, 20, or 30 seconds.
- A separate, optional four-note chime when the timer finishes. Both sounds have preview buttons in settings. Ending a session early does not play the chime.
- A footer that alternates between Quran 3:135, framed by ﴿ ﴾ with its surah reference, and Sahih Muslim 2702b, with the narrator and collection shown.
- Keyboard controls and support for reduced motion. No accounts or analytics.

Settings are saved on your device when storage is available. Audio, fonts, and images are hosted with the app. Refreshing starts a new session. Browsers may suspend audio when the phone is locked or the page is in the background; the timer still catches up, without replaying missed reminders.

The mountain is symbolic, not a count of sins or a measure of forgiveness. It keeps 45% of its original height at the end of a session.

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
- [Spoken reminder by ArabicAudios](https://commons.wikimedia.org/wiki/File:Ar-أستغفر_الله.ogg), licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The app uses Wikimedia's MP3 transcode, with no content changes.

## Deployment

Pushes to `main` run tests, build the app, and deploy to GitHub Pages through `.github/workflows/pages.yml`. Pull requests run checks without deploying. Set the repository's Pages source to **GitHub Actions**.

## License

App code: [MIT](LICENSE). Quran text, the spoken recording, and the font retain their own licenses; see [NOTICE](NOTICE).
