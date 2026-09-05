import { test } from "node:test";
import assert from "node:assert/strict";
import { Session, reminderDue } from "../src/session.js";
test("wall-clock time catches up after background throttling, completes once, and retains a mountain", () => {
  const s = new Session();
  s.start(5, 1000);
  assert.equal(s.remaining(61000), 240);
  s.tick(601000);
  assert.equal(s.state, "done");
  assert.equal(s.remaining(601000), 0);
  assert.equal(s.scale(601000), 0.45);
  assert.equal(s.progress(601000), 1);
  s.tick(901000);
  assert.equal(s.elapsed, 300000);
});
test("pause freezes elapsed time; resume excludes the pause; early finish preserves progress", () => {
  const s = new Session();
  s.start(10, 1000);
  s.pause(61000);
  assert.equal(s.remaining(999999), 540);
  s.resume(1000000);
  assert.equal(s.remaining(1030000), 510);
  s.finish(1030000);
  assert.equal(s.remaining(9999999), 510);
  assert.equal(s.progress(9999999), 0.15);
});
test("new sessions reset all timing and mountain state", () => {
  const s = new Session();
  s.start(5, 0);
  s.finish(200000);
  s.start(15, 300000);
  assert.equal(s.remaining(300000), 900);
  assert.equal(s.scale(300000), 1);
});
test("10/20/30 second reminders fire once per boundary, without catch-up bursts", () => {
  for (const interval of [10, 20, 30]) {
    assert.equal(reminderDue(interval * 1000 - 1, interval, 0).due, false);
    assert.deepEqual(reminderDue(interval * 1000, interval, 0), {
      slot: 1,
      due: true,
    });
    assert.equal(reminderDue(interval * 1000 + 250, interval, 1).due, false);
    assert.deepEqual(reminderDue(interval * 5000, interval, 1), {
      slot: 5,
      due: true,
    });
    assert.equal(reminderDue(interval * 5000 + 250, interval, 5).due, false);
  }
});
