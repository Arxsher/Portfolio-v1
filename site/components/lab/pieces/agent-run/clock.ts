// One clock per mounted piece. The piece's frame loop advances it and then
// calls every subscriber (odometers, the timer, the packets on the graph,
// the transcript's follow scroll), so all of them move on the same frame
// without re-rendering React. A subscriber returns true while it still has
// motion to finish (a spring settling, a scroll easing in), which keeps the
// loop awake after the run itself has stopped.

import type { Timeline } from "./script";

export type RunState = "idle" | "running" | "done" | "stopped";

export type ClockListener = (dt: number, clock: RunClock) => boolean | void;

export class RunClock {
  t = 0;
  timeline: Timeline | null = null;
  state: RunState = "idle";
  /** Seconds the loop stays awake after something changed (layout settling). */
  linger = 0;
  private listeners = new Set<ClockListener>();

  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Runs every subscriber; true if any of them is still moving. */
  emit(dt: number): boolean {
    let busy = false;
    this.listeners.forEach((listener) => {
      if (listener(dt, this)) busy = true;
    });
    if (this.linger > 0) {
      this.linger -= dt;
      busy = true;
    }
    return busy;
  }

  get stopped() {
    return this.state === "stopped";
  }
}
