// Elapsed wall time avoids drift when browsers throttle background tabs.
export class Session {
  constructor() {
    this.state = "idle";
    this.duration = 0;
    this.elapsed = 0;
    this.started = 0;
  }
  start(minutes, now) {
    this.duration = minutes * 60000;
    this.elapsed = 0;
    this.started = now;
    this.state = "running";
  }
  current(now) {
    return Math.min(
      this.duration,
      this.elapsed +
        (this.state === "running" ? Math.max(0, now - this.started) : 0),
    );
  }
  pause(now) {
    if (this.state !== "running") return;
    this.elapsed = this.current(now);
    this.state = "paused";
  }
  resume(now) {
    if (this.state !== "paused") return;
    this.started = now;
    this.state = "running";
  }
  finish(now) {
    this.elapsed = this.current(now);
    this.state = "done";
  }
  tick(now) {
    if (this.state === "running" && this.current(now) >= this.duration)
      this.finish(now);
  }
  progress(now) {
    return this.duration ? this.current(now) / this.duration : 0;
  }
  scale(now) {
    return Math.max(0.45, 1 - this.progress(now) * 0.55);
  }
  remaining(now) {
    return Math.max(0, Math.ceil((this.duration - this.current(now)) / 1000));
  }
}
export function reminderDue(elapsed, interval, last) {
  const slot = Math.floor(elapsed / (interval * 1000));
  return { slot, due: slot > last && slot > 0 };
}
