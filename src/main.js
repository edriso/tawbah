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
let completionSound =
  read("tawbah-completion-sound") === null
    ? sound
    : read("tawbah-completion-sound") === "true";
let interval = [10, 20, 30].includes(Number(read("tawbah-interval")))
  ? Number(read("tawbah-interval"))
  : 20;
const duration = read("tawbah-duration");
if (["5", "10", "15", "30"].includes(duration))
  document.querySelector(`input[value="${duration}"]`).checked = true;
$("interval").value = interval;
let audio;
let voiceBuffer;
let voiceLoading;
let voiceNode;
function stopVoice() {
  if (voiceNode) {
    voiceNode.stop();
    voiceNode = null;
  }
}
function loadVoice() {
  voiceLoading ??= fetch($("voice-file").src)
    .then((response) => {
      if (!response.ok) throw new Error("Audio unavailable");
      return response.arrayBuffer();
    })
    .then((buffer) => audio.decodeAudioData(buffer))
    .then((buffer) => {
      voiceBuffer = buffer;
    })
    .catch((error) => {
      voiceLoading = null;
      throw error;
    });
  return voiceLoading;
}
function playVoice() {
  if (!voiceBuffer || !audio || audio.state !== "running") return;
  stopVoice();
  const node = audio.createBufferSource();
  const gain = audio.createGain();
  node.buffer = voiceBuffer;
  gain.gain.value = 0.75;
  node.connect(gain);
  gain.connect(audio.destination);
  voiceNode = node;
  node.onended = () => {
    node.disconnect();
    gain.disconnect();
    if (voiceNode === node) voiceNode = null;
  };
  node.start();
}

async function unlockAudio(withVoice = true) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    await audio.resume();
    if (withVoice) await loadVoice();
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
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const start = now + index * 0.13;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.065, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.9);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  });
}
function updateSound() {
  $("sound").setAttribute("aria-checked", String(sound));
  $("sound-options").hidden = !sound;
  if (!sound) stopVoice();
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
$("completion-sound").setAttribute("aria-checked", String(completionSound));
$("completion-sound").onclick = () => {
  completionSound = !completionSound;
  $("completion-sound").setAttribute("aria-checked", String(completionSound));
  save("tawbah-completion-sound", String(completionSound));
  if (completionSound) void unlockAudio(false);
};
$("preview-chime").onclick = async () => {
  if (await unlockAudio(false)) chime();
};

$("preview-sound").onclick = async () => {
  if (await unlockAudio()) playVoice();
};
$("interval").onchange = (event) => {
  interval = Number(event.target.value);
  save("tawbah-interval", String(interval));
  lastReminder = Math.floor(session.current(Date.now()) / (interval * 1000));
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

$("quote").textContent = quote.text;
$("quote-source").setAttribute(
  "aria-label",
  `${quote.label} · ${quote.reference}: ${quote.text}`,
);
$("quote-source").title = quote.reference;
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
  $("mountain").style.setProperty(
    "--width-scale",
    1 - session.progress(now) * 0.16,
  );
}
function complete(natural) {
  clearInterval(ticker);
  session.finish(Date.now());
  stopVoice();
  if (natural && completionSound) chime();
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
  if (session.state !== "running") return;
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
  if (reminder.due && sound && !document.hidden) playVoice();
  lastReminder = reminder.slot;
}
$("start").onclick = () => {
  if (sound || completionSound) void unlockAudio(sound);
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
  $("session-label").textContent = "وقت للذكر";
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
    stopVoice();
    $("pause").textContent = "متابعة الجلسة";
    $("session-label").textContent = "الجلسة متوقفة";
    document.body.dataset.state = "paused";
    announce("الجلسة متوقفة مؤقتًا");
  } else {
    if (sound || completionSound) void unlockAudio(sound);
    session.resume(Date.now());
    $("pause").textContent = "إيقاف مؤقت";
    $("session-label").textContent = "وقت للذكر";
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
  $("mountain").style.setProperty("--width-scale", 1);
  $("eyebrow").textContent = "لحظاتٌ لذكر الله";
  $("subtitle").textContent = "اترك ما حولك قليلًا، وأقبل بقلبك.";
  $("start").focus({ preventScroll: true });
};
document.addEventListener("visibilitychange", () => {
  if (session.state === "running") tick();
});

const settings = $("settings");
$("settings-open").onclick = () => settings.showModal();
$("settings-close").onclick = () => settings.close();
settings.addEventListener("click", (event) => {
  if (event.target !== settings) return;
  const rect = settings.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    settings.close();
});
settings.addEventListener("close", () =>
  $("settings-open").focus({ preventScroll: true }),
);
