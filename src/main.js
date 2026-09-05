import "./style.css";
import ayah from "./ayah.json";
import { Session, reminderDue } from "./session.js";
const $ = (id) => document.getElementById(id);
const session = new Session();
const digits = new Intl.NumberFormat("ar-EG", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});
const icons = {
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>',
  sound:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m11 5-5 4H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>',
};
function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage is optional. */
  }
}
function updateTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("theme").innerHTML = icons[dark ? "sun" : "moon"];
  $("theme").setAttribute(
    "aria-label",
    dark ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن",
  );
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#111817"
    : "#fafbfc";
}
$("theme").onclick = () => {
  document.documentElement.dataset.theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  save("tawbah-theme", document.documentElement.dataset.theme);
  updateTheme();
};
matchMedia("(prefers-color-scheme: dark)").addEventListener(
  "change",
  (event) => {
    if (!read("tawbah-theme")) {
      document.documentElement.dataset.theme = event.matches ? "dark" : "light";
      updateTheme();
    }
  },
);
updateTheme();
$("sound-icon").innerHTML = icons.sound;
let sound = read("tawbah-sound") === "true";
let interval = [10, 20, 30].includes(Number(read("tawbah-interval")))
  ? Number(read("tawbah-interval"))
  : 20;
const duration = read("tawbah-duration");
if (["5", "10", "15", "30"].includes(duration))
  document.querySelector(`input[value="${duration}"]`).checked = true;
$("interval").value = interval;
let audio;
async function unlockAudio() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    await audio.resume();
    $("audio-error").hidden = audio.state === "running";
    return audio.state === "running";
  } catch {
    $("audio-error").hidden = false;
    return false;
  }
}
function chime() {
  if (!audio || audio.state !== "running") return;
  const now = audio.currentTime;
  [660, 990].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(index ? 0.025 : 0.07, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.5);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  });
}
function updateSound() {
  $("sound").setAttribute("aria-checked", String(sound));
  $("sound-options").hidden = !sound;
  $("session-sound").setAttribute("aria-pressed", String(sound));
  $("session-sound").textContent = sound ? "الصوت مفعّل" : "الصوت مغلق";
  save("tawbah-sound", String(sound));
}
async function toggleSound() {
  sound = !sound;
  updateSound();
  if (sound) {
    await unlockAudio();
    lastReminder = Math.floor(session.current(Date.now()) / (interval * 1000));
  }
}
$("sound").onclick = toggleSound;
$("session-sound").onclick = toggleSound;
$("preview-sound").onclick = async () => {
  if (await unlockAudio()) chime();
};
$("interval").onchange = (event) => {
  interval = Number(event.target.value);
  save("tawbah-interval", String(interval));
};
updateSound();
let quoteIndex = Math.random() < 0.5 ? 0 : 1;
try {
  const previous = sessionStorage.getItem("tawbah-quote");
  if (previous !== null) quoteIndex = previous === "0" ? 1 : 0;
  sessionStorage.setItem("tawbah-quote", String(quoteIndex));
} catch {
  /* Random choice still works without storage. */
}
const quote =
  quoteIndex === 0
    ? {
        label: "من القرآن الكريم",
        text: ayah.text,
        reference: "آل عمران · ١٣٥",
        url: ayah.source,
      }
    : {
        label: "قال رسول الله صلى الله عليه وسلم",
        text: "يَا أَيُّهَا النَّاسُ تُوبُوا إِلَى اللَّهِ فَإِنِّي أَتُوبُ فِي الْيَوْمِ إِلَيْهِ مِائَةَ مَرَّةٍ",
        reference: "صحيح مسلم · ٢٧٠٢",
        url: "https://sunnah.com/muslim:2702b",
      };
$("quote-label").textContent = quote.label;
$("quote").textContent = quote.text;
$("quote-source").textContent = quote.reference;
$("quote-source").href = quote.url;
let ticker;
let lastReminder = 0;
let transitionTimer;
function announce(text) {
  $("announcement").textContent = text;
}
function render() {
  const now = Date.now();
  $("timer").textContent =
    `${digits.format(Math.floor(session.remaining(now) / 60))}:${digits.format(session.remaining(now) % 60)}`;
  $("progress").value = session.progress(now);
  $("mountain").style.setProperty("--scale", session.scale(now));
}
function complete(natural) {
  clearInterval(ticker);
  session.finish(Date.now());
  render();
  $("active").hidden = true;
  $("done").hidden = false;
  $("done-label").textContent = natural ? "اكتملت جلستك" : "انتهت جلستك";
  document.body.dataset.state = "done";
  $("eyebrow").textContent = "والذكر لا ينتهي";
  announce(
    natural ? "اكتملت جلستك. تقبّل الله منك." : "انتهت جلستك. تقبّل الله منك.",
  );
  $("restart").focus({ preventScroll: true });
}
function tick() {
  session.tick(Date.now());
  render();
  if (session.state === "done") {
    complete(true);
    return;
  }
  if (session.state !== "running") return;
  const reminder = reminderDue(
    session.current(Date.now()),
    interval,
    lastReminder,
  );
  if (reminder.due && sound && !document.hidden) chime();
  lastReminder = reminder.slot;
}
$("start").onclick = () => {
  if (sound) void unlockAudio();
  const minutes = Number(
    document.querySelector('input[name="duration"]:checked').value,
  );
  save("tawbah-duration", String(minutes));
  session.start(minutes, Date.now());
  lastReminder = 0;
  document.body.dataset.state = "running";
  $("setup").inert = true;
  $("active").hidden = false;
  $("pause").textContent = "إيقاف مؤقت";
  $("session-label").textContent = "وقتٌ للذكر";
  $("eyebrow").textContent = "أقبل بقلبك";
  $("subtitle").textContent = "أستغفر الله، وأتوب إليه.";
  transitionTimer = setTimeout(() => {
    $("setup").hidden = true;
  }, 450);
  render();
  announce("بدأت جلسة الاستغفار");
  $("pause").focus({ preventScroll: true });
  ticker = setInterval(tick, 250);
};
$("pause").onclick = () => {
  session.tick(Date.now());
  if (session.state === "done") {
    complete(true);
    return;
  }
  if (session.state === "running") {
    session.pause(Date.now());
    $("pause").textContent = "متابعة الجلسة";
    $("session-label").textContent = "خذ وقتك";
    document.body.dataset.state = "paused";
    announce("الجلسة متوقفة مؤقتًا");
  } else {
    if (sound) void unlockAudio();
    session.resume(Date.now());
    $("pause").textContent = "إيقاف مؤقت";
    $("session-label").textContent = "وقتٌ للذكر";
    document.body.dataset.state = "running";
    announce("استؤنفت الجلسة");
  }
  render();
};
$("finish").onclick = () => complete(false);
$("restart").onclick = () => {
  clearTimeout(transitionTimer);
  $("done").hidden = true;
  $("setup").hidden = false;
  $("setup").inert = false;
  document.body.dataset.state = "idle";
  $("mountain").style.setProperty("--scale", 1);
  $("eyebrow").textContent = "لحظاتٌ لذكر الله";
  $("subtitle").textContent = "اترك ما حولك قليلًا، وأقبل بقلبك.";
  $("start").focus({ preventScroll: true });
};
document.addEventListener("visibilitychange", () => {
  if (session.state === "running") tick();
});
