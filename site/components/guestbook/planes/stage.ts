// The folding table in the send panel: your note, drawn as a sheet, folds
// itself into a paper plane step by step, then waits to be thrown.
//
// Motion model
// ------------
// Four fold springs (A corners, B edges, C keel, D wings; 0 flat … 1
// folded) and a pose spring (0 = the sheet facing you, 1 = the plane in
// three-quarter view) are retargeted by a small timeline, each step a beat
// after the last with a soft overshoot, a paper crinkle on each. Flat folds
// are clamped so paper never passes through paper. Unfolding (back to
// editing) replays it backwards from wherever the springs are, so either
// can interrupt the other.
//
// Throwing. While held, the plane's position follows the pointer through a
// stiff spring, it pitches with the vertical speed and banks with the
// horizontal acceleration. On release, the pointer's velocity over the
// last ~90ms decides: fast enough and it is thrown (handed to flight.ts at
// that velocity), otherwise it springs back to rest. Enter throws it up
// and to the right.
//
// Reduced motion: folding becomes a cross-fade from the sheet to the
// finished plane, and a throw fades the plane out where it is.

import { anglesFrom, buildSheet, type Sheet } from "./fold";
import { PlaneScratch, drawPlane, drawShadow, flatPaperCss, projectPlane, type PlaneContent, type PlaneParams } from "./draw";
import { launchFlight } from "./flight";
import { planeLook, type PlaneLook, type RGB } from "./look";
import { clamp, lerp, quatSlerp, quatToRigid, rigid, smoothstep, Spring, type Quat } from "./math";
import { drawNote, layoutNote, SHEET, type NoteLayout, type NoteText, type Rect } from "./note";
import { flightQuat, NOTE_QUAT, PLANE_LENGTH, PLANE_PIVOT } from "./pose";
import { foldSound, throwSound } from "./sound";

export type StagePhase = "idle" | "flat" | "folding" | "ready" | "held" | "unfolding" | "thrown";

export type StageCallbacks = {
  onPhase?(phase: StagePhase): void;
  /** The plane has left (thrown); `speed` 0…1 for the status copy. */
  onThrow?(speed: number): void;
};

const THROW_MIN = 260; // px/s
const DEFAULT_THROW = { vx: 760, vy: -540 };

export class FoldStage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private callbacks: StageCallbacks;
  private sheet: Sheet = buildSheet(SHEET.width, SHEET.height);
  private scratch = new PlaneScratch(this.sheet);
  private angles = new Float64Array(8);
  private params: PlaneParams;
  private look: PlaneLook = planeLook("light");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private reduced = false;
  private note: NoteText | null = null;
  private layout: NoteLayout | null = null;
  private content: PlaneContent | null = null;
  private paperIndex = 0;
  private time = 0;
  private last = 0;
  private frame = 0;
  private destroyed = false;
  phase: StagePhase = "idle";

  private foldA = new Spring(0, 0.42, 0.62);
  private foldB = new Spring(0, 0.42, 0.62);
  private foldC = new Spring(0, 0.55, 0.66);
  private foldD = new Spring(0, 0.45, 0.55);
  private pose = new Spring(0, 0.9, 0.82);
  private tint = new Spring(0, 0.8, 1);
  private presence = new Spring(0, 0.3, 1);
  private crossfade = new Spring(0, 0.5, 1);
  private morph = new Spring(1, 0.34, 0.92);
  private morphFrom: Rect | null = null;
  private px = new Spring(0, 0.16, 0.86);
  private py = new Spring(0, 0.16, 0.86);
  private timers: Array<{ at: number; run: () => void }> = [];
  private quat: Quat = [0, 0, 0, 1];

  private hold: { id: number; dx: number; dy: number; samples: Array<{ x: number; y: number; t: number }> } | null = null;

  private onVisibility = () => this.wake();

  constructor(canvas: HTMLCanvasElement, callbacks: StageCallbacks = {}) {
    this.canvas = canvas;
    document.addEventListener("visibilitychange", this.onVisibility);
    this.ctx = canvas.getContext("2d");
    this.callbacks = callbacks;
    this.params = {
      sheet: this.sheet,
      angles: this.angles,
      rot: rigid(),
      pivotX: 0,
      pivotY: 0,
      pivotZ: 0,
      x: 0,
      y: 0,
      scale: 1,
      focal: 1400,
      paper: this.look.papers[0],
      look: this.look,
      content: null,
      creases: 1,
    };
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  setSize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width === this.width && height === this.height && dpr === this.dpr) return;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    if (this.phase !== "held") {
      const rest = this.rest();
      this.px.snap(rest.x);
      this.py.snap(rest.y);
    }
    this.wake();
  }

  setLook(look: PlaneLook) {
    this.look = look;
    this.wake();
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
    this.wake();
  }

  /** What is written on the sheet, and which paper it takes as it folds. */
  setNote(note: NoteText, paperIndex: number) {
    this.note = note;
    this.layout = layoutNote(note);
    this.paperIndex = paperIndex;
    const layout = this.layout;
    this.content = {
      rect: layout.ink,
      draw: (ctx) => this.note && drawNote(ctx, this.note, layout, this.look),
    };
    this.wake();
  }

  private setPhase(phase: StagePhase) {
    if (this.phase === phase) return;
    this.phase = phase;
    this.callbacks.onPhase?.(phase);
  }

  /* -------------------------------------------------------------------- */
  /* layout                                                                */
  /* -------------------------------------------------------------------- */

  private flatScale() {
    return Math.min((this.width - 4) / SHEET.width, (this.height - 4) / SHEET.height);
  }

  private readyScale() {
    return Math.min((this.width * 0.64) / PLANE_LENGTH, (this.height * 1.1) / PLANE_LENGTH, 0.85);
  }

  private rest() {
    return { x: this.width / 2, y: this.height / 2 };
  }

  /* -------------------------------------------------------------------- */
  /* the sequence                                                          */
  /* -------------------------------------------------------------------- */

  /** Show the flat sheet (no animation) — the moment the form hands over. */
  showFlat() {
    this.timers = [];
    for (const spring of [this.foldA, this.foldB, this.foldC, this.foldD, this.pose, this.tint, this.crossfade]) spring.snap(0);
    this.presence.snap(1);
    const rest = this.rest();
    this.px.snap(rest.x);
    this.py.snap(rest.y);
    this.setPhase("flat");
    this.wake();
  }

  /**
   * Fold the note into a plane. `from` is where the paper of the form sat
   * (canvas px): the sheet first settles from there into the note.
   */
  fold(from?: Rect) {
    if (!this.note) return;
    this.timers = [];
    this.setPhase("folding");
    const t = this.time;
    // The canvas takes over from the form's paper in one frame: it must be
    // fully there at once, or the handoff dips to an empty table.
    if (from || this.reduced) this.presence.snap(1);
    else this.presence.to(1);
    this.tint.to(1, 1.4, 1);
    if (this.reduced) {
      this.morphFrom = null;
      this.morph.snap(1);
      this.crossfade.to(1, 0.55, 1);
      this.timers.push({ at: t + 0.6, run: () => this.setPhase("ready") });
      this.wake();
      return;
    }
    let delay = 0.05;
    if (from) {
      this.morphFrom = from;
      this.morph.snap(0).to(1, 0.34, 0.92);
      delay = 0.5;
    }
    const step = (at: number, run: () => void, sound = 1) =>
      this.timers.push({
        at: t + delay + at,
        run: () => {
          run();
          foldSound(sound);
        },
      });
    step(0, () => this.foldA.to(1, 0.42, 0.6));
    step(0.45, () => this.foldB.to(1, 0.42, 0.6));
    step(0.9, () => {
      this.foldC.to(1, 0.56, 0.66);
      this.pose.to(1, 0.95, 0.8);
    }, 1.2);
    step(1.37, () => this.foldD.to(1, 0.42, 0.52), 0.8);
    this.timers.push({ at: t + delay + 2, run: () => this.setPhase("ready") });
    this.wake();
  }

  unfold() {
    this.timers = [];
    this.hold = null;
    this.setPhase("unfolding");
    const t = this.time;
    const rest = this.rest();
    this.px.to(rest.x);
    this.py.to(rest.y);
    this.presence.to(1);
    this.tint.to(0, 0.8, 1);
    if (this.reduced) {
      this.crossfade.to(0, 0.45, 1);
      this.timers.push({ at: t + 0.5, run: () => this.setPhase("flat") });
      this.wake();
      return;
    }
    this.foldD.to(0, 0.42, 0.75);
    this.timers.push(
      { at: t + 0.12, run: () => { this.foldC.to(0, 0.5, 0.78); this.pose.to(0, 0.8, 0.9); foldSound(0.7); } },
      { at: t + 0.42, run: () => { this.foldB.to(0, 0.42, 0.8); foldSound(0.6); } },
      { at: t + 0.62, run: () => this.foldA.to(0, 0.42, 0.8) },
      { at: t + 1.25, run: () => this.setPhase("flat") },
    );
    this.wake();
  }

  /** After a failed send: the plane comes back, ready to throw again. */
  comeBack() {
    this.timers = [];
    this.hold = null;
    for (const spring of [this.foldA, this.foldB, this.foldC, this.foldD, this.pose, this.tint, this.crossfade]) spring.snap(1);
    const rest = this.rest();
    this.px.snap(rest.x - this.width * 0.35);
    this.py.snap(rest.y + 20);
    this.px.to(rest.x, 0.6, 0.8);
    this.py.to(rest.y, 0.6, 0.8);
    this.presence.snap(0).to(1, 0.35, 1);
    this.setPhase("ready");
    this.wake();
  }

  /** Clear the table (after a successful send, or to start over). */
  clear() {
    this.timers = [];
    this.hold = null;
    this.presence.to(0, 0.25, 1);
    this.setPhase("idle");
    this.wake();
  }

  /* -------------------------------------------------------------------- */
  /* throwing                                                              */
  /* -------------------------------------------------------------------- */

  /** Is a point (CSS px in the canvas) on the plane? */
  hits(x: number, y: number) {
    return this.phase === "ready" && this.scratch.hit(x, y, 22);
  }

  grab(id: number, x: number, y: number) {
    if (this.phase !== "ready") return false;
    this.hold = { id, dx: this.px.value - x, dy: this.py.value - y, samples: [{ x, y, t: performance.now() }] };
    this.px.to(x + this.hold.dx, 0.1, 0.9);
    this.py.to(y + this.hold.dy, 0.1, 0.9);
    this.setPhase("held");
    this.wake();
    return true;
  }

  drag(id: number, x: number, y: number) {
    const hold = this.hold;
    if (!hold || hold.id !== id) return;
    const t = performance.now();
    hold.samples.push({ x, y, t });
    while (hold.samples.length > 3 && t - hold.samples[0].t > 260) hold.samples.shift();
    this.px.to(x + hold.dx, 0.1, 0.9);
    this.py.to(y + hold.dy, 0.1, 0.9);
    this.wake();
  }

  release(id: number, x: number, y: number) {
    const hold = this.hold;
    if (!hold || hold.id !== id) return;
    this.hold = null;
    const t = performance.now();
    if (Math.hypot(x - hold.samples[hold.samples.length - 1].x, y - hold.samples[hold.samples.length - 1].y) > 0.5) {
      hold.samples.push({ x, y, t });
    }
    // Velocity of the movement just before letting go: the samples within
    // ~110ms of the last one (at least the last two). A finger that paused
    // before lifting (>150ms) doesn't throw.
    const samples = hold.samples;
    const last = samples[samples.length - 1];
    let vx = 0;
    let vy = 0;
    if (samples.length >= 2 && t - last.t <= 150) {
      let first = samples[samples.length - 2];
      for (let i = samples.length - 2; i >= 0; i--) {
        if (last.t - samples[i].t > 110) break;
        first = samples[i];
      }
      const span = Math.max(16, last.t - first.t) / 1000;
      vx = (last.x - first.x) / span;
      vy = (last.y - first.y) / span;
    }
    if (Math.hypot(vx, vy) >= THROW_MIN) {
      this.throwAt(vx, vy);
      return;
    }
    const rest = this.rest();
    this.px.to(rest.x, 0.5, 0.7);
    this.py.to(rest.y, 0.5, 0.7);
    this.setPhase("ready");
    this.wake();
  }

  /** Throw it: from the keyboard (default arc) or a flick. */
  throwAt(vx = DEFAULT_THROW.vx, vy = DEFAULT_THROW.vy) {
    if (this.phase !== "ready" && this.phase !== "held") return;
    // Keep throws in a range that still reads as a throw.
    let speed = Math.hypot(vx, vy);
    const max = 2600;
    if (speed > max) {
      vx *= max / speed;
      vy *= max / speed;
      speed = max;
    }
    if (speed < 520) {
      const k = 520 / Math.max(speed, 1);
      vx *= k;
      vy *= k;
      speed = 520;
    }
    const strength = clamp((speed - 400) / 1600, 0, 1);
    throwSound(0.35 + strength * 0.65, clamp(vx / 1200, -1, 1));
    this.hold = null;
    this.timers = [];
    this.setPhase("thrown");
    this.callbacks.onThrow?.(strength);
    if (this.reduced || !this.note) {
      this.presence.to(0, 0.45, 1);
      this.wake();
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const paper = this.paperNow();
    void launchFlight({
      x: rect.left + this.params.x,
      y: rect.top + this.params.y,
      vx,
      vy,
      scale: this.params.scale,
      quat: [...this.quat] as Quat,
      look: this.look,
      paper,
      content: this.content,
    });
    this.presence.snap(0);
    this.wake();
  }

  /* -------------------------------------------------------------------- */
  /* loop                                                                  */
  /* -------------------------------------------------------------------- */

  private wake() {
    if (this.destroyed || this.frame || !this.width) return;
    this.last = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.frame = 0;
    if (this.destroyed) return;
    const dt = this.last ? Math.min(0.05, Math.max(0, (now - this.last) / 1000)) : 1 / 60;
    this.last = now;
    const busy = this.update(dt);
    this.draw();
    if (busy && document.visibilityState !== "hidden") this.frame = requestAnimationFrame(this.tick);
  };

  private update(dt: number): boolean {
    this.time += dt;
    if (this.timers.length) {
      const due = this.timers.filter((timer) => timer.at <= this.time);
      if (due.length) {
        this.timers = this.timers.filter((timer) => timer.at > this.time);
        due.forEach((timer) => timer.run());
      }
    }
    let busy = this.timers.length > 0;
    for (const spring of [this.foldA, this.foldB, this.foldC, this.foldD, this.pose, this.tint, this.presence, this.crossfade, this.morph, this.px, this.py]) {
      spring.step(dt);
      if (!spring.resting) busy = true;
    }
    this.foldA.value = clamp(this.foldA.value, -0.06, 1);
    this.foldB.value = clamp(this.foldB.value, -0.06, 1);
    // The finished plane idles (bobs) while it waits.
    if (!this.reduced && (this.phase === "ready" || this.phase === "held" || this.phase === "folding")) busy = true;
    return busy;
  }

  private paperNow(): RGB {
    const from = this.look.papers[0];
    const to = this.look.papers[this.paperIndex % this.look.papers.length];
    const t = clamp(this.tint.value, 0, 1);
    return [lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t)];
  }

  private draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const presence = this.presence.value;
    if (presence <= 0.002 || !this.note) return;
    if (this.reduced) {
      // cross-fade: the sheet, then the finished plane
      const f = clamp(this.crossfade.value, 0, 1);
      if (f < 0.999) this.drawState(ctx, 0, 0, 0, 0, 0, presence * (1 - f));
      if (f > 0.001) this.drawState(ctx, 1, 1, 1, 1, 1, presence * f);
      return;
    }
    const m = this.morph.value;
    if (this.morphFrom && m < 0.999) {
      this.drawMorph(ctx, this.morphFrom, m, presence);
      const contentIn = smoothstep(0.55, 1, m);
      if (contentIn > 0.001) this.drawState(ctx, 0, 0, 0, 0, 0, presence * contentIn);
      return;
    }
    this.morphFrom = null;
    this.drawState(ctx, this.foldA.value, this.foldB.value, this.foldC.value, this.foldD.value, this.pose.value, presence);
  }

  /** Blank paper easing from the form's sheet to the note's shape. */
  private drawMorph(ctx: CanvasRenderingContext2D, from: Rect, m: number, alpha: number) {
    const s = this.flatScale();
    const w = SHEET.width * s;
    const h = SHEET.height * s;
    const to = { x: this.px.value - w / 2, y: this.py.value - h / 2, w, h };
    const k = clamp(m, 0, 1.1);
    const x = lerp(from.x, to.x, k);
    const y = lerp(from.y, to.y, k);
    const rw = lerp(from.w, to.w, k);
    const rh = lerp(from.h, to.h, k);
    const r = lerp(4, 0, clamp(k, 0, 1));
    const { dpr } = this;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = this.look.shadow;
    ctx.shadowBlur = 14 * dpr;
    ctx.shadowOffsetX = 3 * dpr;
    ctx.shadowOffsetY = 10 * dpr;
    ctx.fillStyle = flatPaperCss(this.look, this.look.papers[0]);
    ctx.beginPath();
    ctx.roundRect(x, y, rw, rh, r);
    ctx.fill();
    ctx.restore();
  }

  private drawState(ctx: CanvasRenderingContext2D, a: number, b: number, c: number, d: number, pose: number, alpha: number) {
    const p = this.params;
    const t = this.time;
    const e = clamp(pose, 0, 1.05);
    const still = this.reduced;
    const held = this.phase === "held";

    // idle bob once it is a plane
    const bob = still ? 0 : Math.sin(t * 1.7) * 4 * smoothstep(0.6, 1, e);
    // attitude: pitch with vertical speed, bank with horizontal speed while held
    const vx = still ? 0 : this.px.velocity;
    const vy = still ? 0 : this.py.velocity;
    const pitch = 9 + (still ? 0 : Math.cos(t * 1.7) * 3) + (held ? clamp(-vy * 0.03, -32, 32) : 0);
    const roll = held ? clamp(vx * 0.012, -25, 25) : still ? 0 : Math.sin(t * 1.1) * 3;
    const ready = flightQuat(22, -24, pitch, roll);
    quatSlerp(NOTE_QUAT, ready, smoothstep(0, 1, e), this.quat);
    quatToRigid(this.quat, p.rot);

    anglesFrom(this.sheet, a, b, c, d, this.angles);
    const folded = clamp(c, 0, 1);
    p.pivotX = PLANE_PIVOT.x * folded;
    p.pivotZ = PLANE_PIVOT.z * folded;
    p.x = this.px.value;
    p.y = this.py.value + bob;
    p.scale = Math.exp(lerp(Math.log(this.flatScale()), Math.log(this.readyScale()), clamp(e, 0, 1)));
    p.focal = lerp(1600, 1000, clamp(e, 0, 1));
    p.creases = clamp(1 - Math.max(a, b, c, d) * 1.5, 0, 1);
    p.look = this.look;
    p.paper = this.paperNow();
    p.content = this.content;
    p.alpha = alpha;
    projectPlane(p, this.scratch);
    const lift = clamp(e, 0, 1);
    ctx.globalAlpha = alpha;
    drawShadow(ctx, this.dpr, this.scratch, lerp(3, 6, lift), lerp(10, 26 + (held ? 10 : 0), lift) + bob * 0.5, lerp(14, 12, lift), this.look.shadow);
    ctx.globalAlpha = 1;
    drawPlane(ctx, this.dpr, p, this.scratch);
  }
}
