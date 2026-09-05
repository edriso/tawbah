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
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  w.setInterval = (callback) => {
    tick = callback;
    return 1;
  };
  w.clearInterval = () => {};
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
  assert.equal(get("mountain").style.getPropertyValue("--scale"), "0.62");
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
  get("session-sound").click();
  assert.equal(get("session-sound").getAttribute("aria-pressed"), "false");
  app.close();
});
test("footer alternates on refresh and uses the exact verified verse", () => {
  const first = setup({ previousQuote: "1" });
  assert.equal(first.get("quote").textContent, ayah.text);
  assert.equal(first.get("quote-source").href, ayah.source);
  first.close();
  const second = setup({ previousQuote: "0" });
  assert.equal(
    second.get("quote-source").href,
    "https://sunnah.com/muslim:2702b",
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

test("enabled chimes respect the interval, mute, and pause", async () => {
  let tones = 0;
  class AudioMock {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    createOscillator() {
      return {
        frequency: {},
        connect() {},
        disconnect() {},
        start() {
          tones++;
        },
        stop() {},
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
  app.get("sound").click();
  await Promise.resolve();
  app.get("start").click();
  app.advance(19999);
  assert.equal(tones, 0);
  app.advance(1);
  assert.equal(tones, 2);
  app.advance(250);
  assert.equal(tones, 2);
  app.get("pause").click();
  app.advance(60000);
  assert.equal(tones, 2);
  app.get("pause").click();
  app.advance(20000);
  assert.equal(tones, 4);
  app.get("session-sound").click();
  app.advance(20000);
  assert.equal(tones, 4);
  await new Promise((resolve) => setImmediate(resolve));
  app.close();
});
