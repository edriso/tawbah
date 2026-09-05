# استغفر

مساحة هادئة لذكر الله والاستغفار. اختر وقتك، واترك ما حولك قليلًا.

**[افتح التطبيق](https://edriso.github.io/tawbah/)**

واجهة عربية باتجاه RTL، ومساحات واسعة، وجبال هادئة. اختر جلسة من ٥ أو ١٠ أو ١٥ أو ٣٠ دقيقة؛ تتوارى الإعدادات عند البدء، ويصغر الجبل تدريجيًا مع مرور الوقت دون أن يختفي. يمكنك إيقاف الجلسة مؤقتًا، أو متابعتها، أو إنهاؤها مبكرًا.

- مظهر فاتح وداكن، يبدأ حسب إعداد الجهاز ويحفظ اختيارك.
- تنبيه صوتي اختياري كل ١٠ أو ٢٠ أو ٣٠ ثانية، مع تجربة الصوت وكتمه أثناء الجلسة.
- آية آل عمران ١٣٥ أو حديث صحيح مسلم ٢٧٠٢، بالتناوب عند إعادة تحميل الصفحة.
- تصميم للهواتف والحواسيب، وتنقّل بلوحة المفاتيح، واحترام تقليل الحركة.
- بلا حسابات، أو تحليلات، أو خدمات خارجية أثناء الجلسة. الخط والصورة محليّان.

الجبل تعبير بصري عن مرور الوقت، وليس مقياسًا للذنوب أو المغفرة. الصوت تنبيه لطيف وليس تلاوة. قد يوقف المتصفح الصوت عند قفل الهاتف أو وضع الصفحة في الخلفية؛ يبقى المؤقّت محسوبًا من الوقت المنقضي، ولا تتراكم التنبيهات الفائتة. إعادة تحميل الصفحة تبدأ جلسة جديدة.

## Development

Node.js 22+ and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Vite serves the app at `/tawbah/`. Vanilla JavaScript and CSS keep the production app small. No framework or runtime dependencies. Settings use localStorage when available; sessions stay in memory. Footer selection uses sessionStorage and falls back to a random choice when storage is blocked.

`npm test` covers elapsed-time accounting, pauses, completion, reminder boundaries, and DOM interactions. `npm run build` verifies the Quran corpus before producing `dist/`.

## Quran text and sources

Following [learn-tajweed's verification approach](https://github.com/edriso/learn-tajweed/blob/main/docs/quran-pipeline.md), `scripts/quran.mjs` checks the complete Tanzil Uthmani corpus against SHA-256 `7f30c647331a61100ebf24a80507dc0fcdd9f2df97f1312b5b2dfcb982a7f326`, then extracts 3:135 without changing any characters. A mismatch stops the build. The browser receives only the selected verse.

- [Quran 3:135 — Tanzil](https://tanzil.net/#3:135)
- [Sahih Muslim 2702b](https://sunnah.com/muslim:2702b)

## Deployment

`.github/workflows/pages.yml` installs the locked dependencies, runs tests and the verified production build, uploads `dist/`, and deploys to GitHub Pages on pushes to `main`. Pull requests run checks without deploying. Repository Pages must use **GitHub Actions** as its source. No tokens or secrets need to be committed.

## License

MIT, matching [Zola](https://github.com/edriso/zola). Third-party Quran text and fonts retain their licenses; see [NOTICE](NOTICE).
