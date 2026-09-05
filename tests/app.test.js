import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { Session, reminderDue } from "../src/session.js";
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = readFileSync(
  new URL("../src/main.js", import.meta.url),
  "utf8",
).replace(/^import .*;\n/gm, "");
const ayah = JSON.parse(
  readFileSync(new URL("../src/ayah.json", import.meta.url), "utf8"),
);
function setup({
  storageBlocked = false,
  previousQuote = null,
  audioMock = null,
} = {}) {
  const dom = new JSDOM(html, {
    url: "https://edriso.github.io/tawbah/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  let now = 0;
  let tick;
  w.Date.now = () => now;
  if (audioMock) w.AudioContext = audioMock;
  w.fetch = async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new w.Event("close"));
  };
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.setInterval = (callback) => {
    tick = callback;
    return 1;
  };
  w.clearInterval = () => {
    tick = undefined;
  };
  w.setTimeout = (callback) => {
    callback();
    return 1;
  };
  if (previousQuote !== null)
    w.sessionStorage.setItem("tawbah-quote", previousQuote);
  if (storageBlocked) {
    for (const key of ["localStorage", "sessionStorage"])
      Object.defineProperty(w, key, {
        get() {
          throw new Error("blocked");
        },
      });
  }
  Object.assign(w, { Session, reminderDue, ayah });
  w.eval(source);
  const get = (id) => w.document.getElementById(id);
  return {
    w,
    get,
    advance(milliseconds) {
      now += milliseconds;
      tick?.();
    },
    close: () => w.close(),
  };
}
test("complete user flow: select duration, start, hide setup, pause, resume, finish, restart", () => {
  const app = setup();
  const { get, w } = app;
  w.document.querySelector('input[value="10"]').checked = true;
  get("start").click();
  assert.equal(get("setup").hidden, true);
  assert.equal(get("active").hidden, false);
  assert.equal(w.document.activeElement.id, "pause");
  app.advance(60000);
  assert.equal(get("timer").textContent, "٠٩:٠٠");
  get("pause").click();
  app.advance(120000);
  assert.equal(get("timer").textContent, "٠٩:٠٠");
  get("pause").click();
  app.advance(60000);
  assert.equal(get("timer").textContent, "٠٨:٠٠");
  get("finish").click();
  assert.equal(get("done").hidden, false);
  assert.equal(get("done-label").textContent, "انتهت جلستك");
  get("restart").click();
  assert.equal(get("setup").hidden, false);
  assert.equal(get("setup").inert, false);
  get("start").click();
  app.advance(600000);
  assert.equal(get("done-label").textContent, "اكتملت جلستك");
  assert.equal(get("mountain").style.getPropertyValue("--scale"), "0.7");
  app.close();
});
test("theme and sound controls persist preferences; unavailable audio fails without blocking sessions", async () => {
  const app = setup();
  const { get, w } = app;
  get("theme").click();
  assert.equal(w.document.documentElement.dataset.theme, "dark");
  assert.equal(w.localStorage.getItem("tawbah-theme"), "dark");
  get("sound").click();
  await Promise.resolve();
  assert.equal(get("sound").getAttribute("aria-checked"), "true");
  assert.equal(get("sound-options").hidden, false);
  assert.equal(get("audio-error").hidden, false);
  get("interval").value = "30";
  get("interval").dispatchEvent(new w.Event("change"));
  assert.equal(w.localStorage.getItem("tawbah-interval"), "30");
  get("start").click();
  assert.equal(get("active").hidden, false);
  get("sound").click();
  assert.equal(get("sound").getAttribute("aria-checked"), "false");
  app.close();
});
test("footer alternates on refresh and uses the exact verified verse", () => {
  const first = setup({ previousQuote: "1" });
  assert.equal(first.get("quote").textContent, ayah.text);
  assert.equal(first.get("quote-open").textContent, "﴿ ");
  assert.equal(first.get("quote-close").textContent, " ﴾");
  assert.equal(
    first.get("quote-source").textContent,
    "سورة آل عمران · الآية ١٣٥",
  );
  assert.equal(first.get("quote-source").href, ayah.source);
  first.close();
  const second = setup({ previousQuote: "0" });
  assert.equal(
    second.get("quote-source").href,
    "https://sunnah.com/muslim:2702b",
  );
  assert.equal(
    second.get("quote-label").textContent,
    "قال رسول الله صلى الله عليه وسلم",
  );
  assert.equal(
    second.get("quote-source").textContent,
    "عن الأغر المزني رضي الله عنه · صحيح مسلم ٢٧٠٢",
  );
  second.close();
});
test("blocked storage does not prevent a complete session", () => {
  const app = setup({ storageBlocked: true });
  app.get("start").click();
  app.advance(300000);
  assert.equal(app.get("done").hidden, false);
  app.close();
});

test("spoken reminders respect interval, mute and pause; only natural completion plays the message pop", async () => {
  let tones = 0;
  let voices = 0;
  let stopped = 0;
  class AudioMock {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async decodeAudioData(buffer) {
      return buffer;
    }
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        disconnect() {},
        start() {
          if (this.buffer.endsWith("/completion-pop.mp3")) tones++;
          else voices++;
        },
        stop() {
          stopped++;
        },
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    }
  }
  const app = setup({ audioMock: AudioMock });
  app.w.fetch = async (url) => ({ ok: true, arrayBuffer: async () => url });
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  app.get("sound").click();
  await settle();
  app.get("start").click();
  await settle();
  app.advance(19999);
  assert.equal(voices, 0);
  app.advance(1);
  assert.equal(voices, 1);
  assert.equal(tones, 0);
  app.advance(250);
  assert.equal(voices, 1);
  app.get("pause").click();
  assert.equal(stopped, 1);
  app.advance(60000);
  assert.equal(voices, 1);
  app.get("pause").click();
  await settle();
  app.advance(20000);
  assert.equal(voices, 2);
  app.get("sound").click();
  app.advance(20000);
  assert.equal(voices, 2);
  app.get("sound").click();
  await settle();
  app.get("completion-sound").click();
  await settle();
  app.advance(300000);
  assert.equal(tones, 1);
  app.advance(500);
  assert.equal(tones, 1);
  app.get("restart").click();
  app.get("start").click();
  await settle();
  app.get("finish").click();
  assert.equal(tones, 1);
  // The end chime works without spoken reminders or fetching the recording.
  app.get("sound").click();
  app.w.fetch = async () => {
    throw new Error("Voice download unavailable");
  };
  app.get("restart").click();
  app.get("start").click();
  await settle();
  app.advance(300000);
  assert.equal(tones, 2);
  app.get("completion-sound").click();
  assert.equal(app.w.localStorage.getItem("tawbah-completion-sound"), "false");
  app.get("restart").click();
  app.get("start").click();
  await settle();
  app.advance(300000);
  assert.equal(tones, 2);
  app.get("preview-chime").click();
  await settle();
  assert.equal(tones, 3);
  assert.equal(
    app.get("completion-sound").getAttribute("aria-checked"),
    "false",
  );
  app.close();
});
test("settings opens and closes with focus returned; passage attribution and repeated phrase remain visible", () => {
  const app = setup();
  assert.equal(
    app.w.document.querySelector(".wordmark").textContent.trim(),
    "توبة",
  );
  app.get("settings-open").click();
  assert.equal(app.get("settings").open, true);
  app.get("settings-close").click();
  assert.equal(app.get("settings").open, false);
  assert.equal(app.w.document.activeElement.id, "settings-open");
  assert.ok(
    app.w.document.querySelector("footer").contains(app.get("quote-source")),
  );
  assert.equal(
    app.w.document.querySelector(".subtitle").textContent.trim(),
    "أستغفر اللهوأتوب إليه",
  );
  assert.equal(app.get("settings").contains(app.get("theme")), true);
  assert.equal(app.get("settings").contains(app.get("sound")), true);
  app.close();
});

test("voice defaults to Bader, switches and caches recordings, and never overlaps repetitions", async () => {
  const played = [];
  const fetched = [];
  let stopped = 0;
  class AudioMock {
    state = "running";
    destination = {};
    async resume() {}
    async decodeAudioData(buffer) {
      return buffer;
    }
    createGain() {
      return { gain: {}, connect() {}, disconnect() {} };
    }
    createBufferSource() {
      return {
        buffer: null,
        connect() {},
        disconnect() {},
        start() {
          played.push(this.buffer);
        },
        stop() {
          stopped++;
        },
      };
    }
  }
  const app = setup({ audioMock: AudioMock });
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  app.w.fetch = async (url) => {
    fetched.push(url);
    return { ok: true, arrayBuffer: async () => url };
  };
  assert.equal(app.get("voice").value, "bader");
  app.get("sound").click();
  await settle();
  app.get("start").click();
  await settle();
  app.advance(20000);
  assert.ok(played[0].endsWith("/istighfar-bader.mp3"));
  app.advance(20000);
  assert.equal(played.length, 1);
  app.get("voice").value = "short";
  app.get("voice").dispatchEvent(new app.w.Event("change"));
  await settle();
  assert.equal(stopped, 1);
  assert.equal(app.w.localStorage.getItem("tawbah-voice"), "short");
  app.get("preview-sound").click();
  await settle();
  assert.ok(played[1].endsWith("/istighfar.mp3"));
  app.get("voice").value = "bader";
  app.get("voice").dispatchEvent(new app.w.Event("change"));
  await settle();
  app.get("preview-sound").click();
  await settle();
  assert.ok(played[2].endsWith("/istighfar-bader.mp3"));
  assert.equal(fetched.length, 2);
  app.close();
});
