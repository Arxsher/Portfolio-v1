// The sky: every visitor's note, folded into a paper plane, drifting across
// a band of the page. Plain TypeScript driving one canvas; the React side
// (components/guestbook/sky.tsx) owns the DOM around it.
//
// Motion model
// ------------
// Cruising. Each plane has a lane (height), a depth (0 near … 1 far: size,
// speed, shadow and draw order) and a cruise position x that is integrated
// every frame: x += speed · factors · dt, wrapping off the right edge back
// to the left. Height bobs on a slow sine (3.5–6 s) and the nose pitches
// with the bob's slope, so planes seem to ride the air; a second, slower
// sine rocks the wings a few degrees.
//
// Springs. Everything that reacts to people is a damped spring stepped
// with its exact solution (math.ts Spring), so it is frame-rate
// independent and any retarget keeps the current velocity: every motion
// can be interrupted mid-way and reverses smoothly.
//   hover   0→1   slows the plane to ~12%, lifts it 5px, grows it 8%,
//                 and kicks a roll spring so the wings give a little wiggle
//   boost   3→1   a new arrival enters from the left fast and settles
//   appear  0→1   staggered fade/rise when the sky first fills
//   dim     0→1   the other planes fade and slow while a note is open
//
// Catching. A caught plane leaves its lane (its cruise x freezes) and five
// springs take over: glide (0 = in its lane, 1 = at the middle of the sky,
// facing you) and the four fold steps D, C, B, A (1 folded … 0 flat). A
// small timeline retargets them in turn: glide first, then the wings open,
// the keel opens, and the two corner folds open, each a beat after the last
// with a soft overshoot (flat folds are clamped so paper never passes
// through paper). The path to the middle is a quadratic arc, the
// orientation a slerp from its flight attitude to flat, the scale a log
// blend, and the text fades in once the sheet is mostly open. Releasing
// replays the same timeline backwards from wherever the springs are.
//
// Reduced motion. No cruising, bobbing or wobble: planes rest in their
// lanes, spread across the visible width (never parked off the edge), and
// catching cross-fades the plane in place with the open note in the middle
// (one opacity spring) instead of gliding and unfolding.
//
// Keyboard focus stops a plane where it is and, if it sits partly off the
// band, eases it back inside so its ring and name tag show in full.
//
// The loop only runs while the band is on screen and the tab is visible;
// with reduced motion it also stops once every spring is at rest.

import type { GuestbookEntry } from "@/lib/guestbook";
import { anglesFrom, buildSheet, type Sheet } from "./fold";
import { PlaneScratch, drawPlane, drawShadow, drawSketch, projectPlane, type PlaneContent, type PlaneParams } from "./draw";
import { paperIndexFor, planeLook, type PlaneLook } from "./look";
import { clamp, hashString, lerp, quatSlerp, quatToRigid, rigid, seeded, smoothstep, Spring, type Quat } from "./math";
import { drawNote, layoutNote, noteFont, noteSprite, SHEET, type NoteLayout, type NoteText, type Rect } from "./note";
import { flightQuat, NOTE_QUAT, PLANE_LENGTH, PLANE_PIVOT } from "./pose";

export type SkyKind = "home" | "page";

export type SkyCallbacks = {
  /** A note opened (fully or on its way) or closed. */
  onOpen?(id: string | null): void;
  /** The pointer is over a plane (null when it leaves). */
  onHover?(id: string | null): void;
  /** The last released note has folded up and is back in its lane. */
  onSettle?(): void;
};

type SkyPlane = {
  id: string;
  note: NoteText;
  layout: NoteLayout;
  sprite: HTMLCanvasElement | null | undefined;
  spriteContent: PlaneContent | null;
  fullContent: PlaneContent;
  textAlpha: number;
  paper: number;
  depth: number;
  size: number;
  lane: number;
  /** 0…1 across the band: where it rests when nothing moves. */
  slot: number;
  x: number;
  speed: number;
  bobAmp: number;
  bobPeriod: number;
  bobPhase: number;
  rockPhase: number;
  yaw: number;
  tilt: number;
  appear: Spring;
  hover: Spring;
  roll: Spring;
  boost: Spring;
  glide: Spring;
  foldA: Spring;
  foldB: Spring;
  foldC: Spring;
  foldD: Spring;
  text: Spring;
  fade: Spring;
  timers: Array<{ at: number; run: () => void }>;
  scratch: PlaneScratch;
  params: PlaneParams;
  angles: Float64Array;
  quat: Quat;
  trail: Float32Array;
  trailCount: number;
  trailHead: number;
  trailClock: number;
  /** Last flight placement (where a released plane returns to). */
  fx: number;
  fy: number;
  fs: number;
  fq: Quat;
};

const TRAIL = 14;
const TRAIL_EVERY = 0.11;
const DEG = 180 / Math.PI;

export function formatPlaneDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function noteFromEntry(entry: GuestbookEntry): NoteText {
  return { name: entry.name, message: entry.message, date: formatPlaneDate(entry.created_at), doodle: entry.signature };
}

/** How many planes a band of this size holds. */
export function skyCapacity(kind: SkyKind, width: number, height: number): number {
  const area = width * height;
  if (kind === "page") return clamp(Math.round(area / 8200), 8, 40);
  return clamp(Math.round(area / 19000), 6, 14);
}

export class PlaneSky {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private kind: SkyKind;
  private callbacks: SkyCallbacks;
  private sheet: Sheet;
  private look: PlaneLook = planeLook("light");
  private width = 0;
  private height = 0;
  private dpr = 1;
  private reduced = false;
  private planes: SkyPlane[] = [];
  private byId = new Map<string, SkyPlane>();
  private time = 0;
  private last = 0;
  private frame = 0;
  private onScreen = false;
  private hidden = false;
  private hoverId: string | null = null;
  private focusId: string | null = null;
  private openId: string | null = null;
  /** The note last let go of, until it is back in its lane. */
  private settlingId: string | null = null;
  private dim = new Spring(0, 0.6, 1);
  private focusRing = new Spring(0, 0.25, 1);
  private loaded = false;
  private spritesThisFrame = 0;
  private destroyed = false;
  private ghost = false;
  private ghostScratch: PlaneScratch | null = null;
  private ghostParams: PlaneParams | null = null;

  constructor(canvas: HTMLCanvasElement, kind: SkyKind, callbacks: SkyCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.kind = kind;
    this.callbacks = callbacks;
    this.sheet = buildSheet(SHEET.width, SHEET.height);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.hidden = document.visibilityState === "hidden";
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  /* -------------------------------------------------------------------- */
  /* setup                                                                 */
  /* -------------------------------------------------------------------- */

  setSize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width === this.width && height === this.height && dpr === this.dpr) return;
    const ratio = this.width ? width / this.width : 1;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    for (const plane of this.planes) plane.x *= ratio;
    this.wake();
  }

  setLook(look: PlaneLook) {
    this.look = look;
    // sprites carry the ink colour
    for (const plane of this.planes) plane.sprite = undefined;
    this.wake();
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced;
    this.wake();
  }

  /** The empty sky: one dashed "your plane here" outline. */
  setGhost(on: boolean) {
    this.ghost = on;
    this.wake();
  }

  setVisible(visible: boolean) {
    this.onScreen = visible;
    this.wake();
  }

  private onVisibility = () => {
    this.hidden = document.visibilityState === "hidden";
    this.wake();
  };

  /** Newest first. Only the first `capacity` fly. */
  setEntries(entries: GuestbookEntry[]) {
    const capacity = skyCapacity(this.kind, this.width || 676, this.height || 300);
    const shown = entries.slice(0, capacity);
    const keep = new Set(shown.map((entry) => entry.id));
    const firstFill = !this.loaded;
    this.loaded = true;

    // Drop planes that left (unless one is open).
    this.planes = this.planes.filter((plane) => keep.has(plane.id) || plane.id === this.openId);
    this.byId = new Map(this.planes.map((plane) => [plane.id, plane]));

    const fresh: GuestbookEntry[] = shown.filter((entry) => !this.byId.has(entry.id));
    const cascade = firstFill || this.planes.length === 0;
    fresh.forEach((entry, index) => {
      const plane = this.createPlane(entry, shown.indexOf(entry), shown.length);
      if (cascade) {
        // Fill the sky in a soft cascade.
        plane.appear.snap(0);
        // scattered order, the whole sky in at most ~1.1s
        const delay = (((index * 0.618034) % 1) * Math.min(1.1, fresh.length * 0.07));
        plane.timers.push({ at: this.time + delay, run: () => plane.appear.to(1, 0.9, 0.9) });
      } else {
        // A new plane just landed in the guestbook: it flies in from the
        // left, in the widest free stretch of sky.
        const lanes = [0, ...this.planes.map((p) => p.lane).sort((a, b) => a - b), 1];
        let best = 0.5;
        let gap = -1;
        for (let i = 1; i < lanes.length; i++) {
          if (lanes[i] - lanes[i - 1] > gap) {
            gap = lanes[i] - lanes[i - 1];
            best = (lanes[i] + lanes[i - 1]) / 2;
          }
        }
        plane.lane = clamp(best, 0.04, 0.96);
        plane.x = -this.margin(plane);
        plane.boost.snap(4).to(1, 2.4, 1);
        plane.appear.snap(1);
      }
      this.planes.push(plane);
      this.byId.set(plane.id, plane);
    });
    // Far planes draw first.
    this.planes.sort((a, b) => b.depth - a.depth);
    this.wake();
  }

  private createPlane(entry: GuestbookEntry, index: number, total: number): SkyPlane {
    const random = seeded(hashString(entry.id));
    const note = noteFromEntry(entry);
    const layout = layoutNote(note);
    const depth = random();
    // Spread lanes evenly by position in the list, with a little jitter,
    // and stagger the start positions along a golden-ratio sequence so the
    // first view is evenly filled.
    const lane = clamp((index + 0.5) / Math.max(total, 1) + (random() - 0.5) * (0.55 / Math.max(total, 1)), 0.02, 0.98);
    const golden = ((index * 0.618034 + random() * 0.12) % 1 + 1) % 1;
    const span = (this.width || 676) + 140;
    const look = this.look;
    const plane: SkyPlane = {
      id: entry.id,
      note,
      layout,
      sprite: undefined,
      spriteContent: null,
      fullContent: null as unknown as PlaneContent,
      textAlpha: 0,
      paper: paperIndexFor(entry, look.papers.length),
      depth,
      size: 0.9 + random() * 0.22,
      lane,
      slot: golden,
      x: -70 + golden * span,
      speed: lerp(21, 10, depth) * (0.9 + random() * 0.2),
      bobAmp: 3 + random() * 4.5,
      bobPeriod: 3.6 + random() * 2.6,
      bobPhase: random() * Math.PI * 2,
      rockPhase: random() * Math.PI * 2,
      yaw: -28 + random() * 36,
      tilt: 20 + random() * 10,
      appear: new Spring(1, 0.9, 0.9),
      hover: new Spring(0, 0.38, 0.9),
      roll: new Spring(0, 0.42, 0.32),
      boost: new Spring(1, 2.4, 1),
      glide: new Spring(0, 0.72, 0.84),
      foldA: new Spring(1, 0.55, 0.78),
      foldB: new Spring(1, 0.55, 0.78),
      foldC: new Spring(1, 0.6, 0.74),
      foldD: new Spring(1, 0.55, 0.72),
      text: new Spring(0, 0.35, 1),
      fade: new Spring(0, 0.4, 1),
      timers: [],
      scratch: new PlaneScratch(this.sheet),
      params: null as unknown as PlaneParams,
      angles: new Float64Array(8),
      quat: [0, 0, 0, 1],
      trail: new Float32Array(TRAIL * 2),
      trailCount: 0,
      trailHead: 0,
      trailClock: 0,
      fx: 0,
      fy: 0,
      fs: 0,
      fq: [0, 0, 0, 1],
    };
    plane.fullContent = {
      rect: layout.ink,
      draw: (ctx) => drawNote(ctx, plane.note, plane.layout, this.look, plane.textAlpha),
    };
    plane.params = {
      sheet: this.sheet,
      angles: plane.angles,
      rot: rigid(),
      pivotX: PLANE_PIVOT.x,
      pivotY: 0,
      pivotZ: PLANE_PIVOT.z,
      x: 0,
      y: 0,
      scale: 0.2,
      focal: 900,
      paper: look.papers[plane.paper],
      look,
      content: null,
      creases: 0,
    };
    return plane;
  }

  /* -------------------------------------------------------------------- */
  /* geometry of the band                                                  */
  /* -------------------------------------------------------------------- */

  /** CSS px per sheet unit for a cruising plane of this depth and size. */
  private cruiseScale(plane: SkyPlane): number {
    const narrow = this.width < 520;
    const base = (narrow ? 72 : this.kind === "page" ? 88 : 92) / PLANE_LENGTH;
    return base * plane.size * lerp(1, 0.72, plane.depth);
  }

  /** Where a plane rests with reduced motion: always fully on the band. */
  private restX(plane: SkyPlane) {
    const m = PLANE_LENGTH * this.cruiseScale(plane) * 0.5 + 14;
    return m + plane.slot * Math.max(0, this.width - m * 2);
  }

  private margin(plane: SkyPlane) {
    return PLANE_LENGTH * this.cruiseScale(plane) * 0.6 + 16;
  }

  private laneY(plane: SkyPlane) {
    const top = 30;
    const bottom = this.height - (this.kind === "home" ? 58 : 46);
    return lerp(top, Math.max(top, bottom), plane.lane);
  }

  /** Where an open note sits, CSS px (the middle of the band). */
  noteRect(): Rect {
    const scale = this.noteScale();
    const w = SHEET.width * scale;
    const h = SHEET.height * scale;
    const cx = this.width / 2;
    const cy = this.height / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }

  private noteScale() {
    const m = this.width < 520 ? 12 : 22;
    return Math.min(this.kind === "page" ? 1.25 : 1.1, (this.width - m * 2) / SHEET.width, (this.height - m * 2) / SHEET.height);
  }

  /* -------------------------------------------------------------------- */
  /* people                                                                */
  /* -------------------------------------------------------------------- */

  /** Topmost plane at a point (CSS px in the band), skipping the open one. */
  planeAt(x: number, y: number, slack = 8): string | null {
    for (let i = this.planes.length - 1; i >= 0; i--) {
      const plane = this.planes[i];
      if (plane.id === this.openId || plane.appear.value < 0.5) continue;
      if (plane.scratch.hit(x, y, slack)) return plane.id;
    }
    return null;
  }

  isOverNote(x: number, y: number) {
    if (!this.openId) return false;
    const r = this.noteRect();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  setHover(id: string | null) {
    if (id === this.hoverId) return;
    const previous = this.hoverId ? this.byId.get(this.hoverId) : null;
    if (previous) previous.hover.to(0);
    this.hoverId = id;
    const plane = id ? this.byId.get(id) : null;
    if (plane) {
      plane.hover.to(1);
      if (!this.reduced) plane.roll.velocity += 75;
    }
    this.callbacks.onHover?.(id);
    this.wake();
  }

  setFocus(id: string | null) {
    this.focusId = id;
    this.focusRing.to(id ? 1 : 0);
    this.setHover(id);
    this.wake();
  }

  get openNote(): string | null {
    return this.openId;
  }

  open(id: string) {
    const plane = this.byId.get(id);
    if (!plane || this.openId === id) return;
    if (this.openId) this.release(this.byId.get(this.openId)!);
    this.openId = id;
    if (this.settlingId === id) this.settlingId = null;
    this.setHover(null);
    this.dim.to(1);
    plane.timers = [];
    if (this.reduced) {
      plane.fade.to(1, 0.45, 1);
      plane.text.snap(1);
    } else {
      // capture where it is flying now
      this.placeInFlight(plane);
      const t = this.time;
      plane.glide.to(1, 0.78, 0.86);
      plane.timers.push(
        { at: t + 0.22, run: () => plane.foldD.to(0, 0.5, 0.7) },
        { at: t + 0.36, run: () => plane.foldC.to(0, 0.58, 0.72) },
        { at: t + 0.58, run: () => plane.foldB.to(0, 0.5, 0.74) },
        { at: t + 0.74, run: () => plane.foldA.to(0, 0.5, 0.74) },
        { at: t + 0.7, run: () => plane.text.to(1, 0.45, 1) },
      );
    }
    this.callbacks.onOpen?.(id);
    this.wake();
  }

  close() {
    const plane = this.openId ? this.byId.get(this.openId) : null;
    this.openId = null;
    this.dim.to(0);
    if (plane) {
      this.release(plane);
      this.settlingId = plane.id;
    }
    this.callbacks.onOpen?.(null);
    if (!plane) this.callbacks.onSettle?.();
    this.wake();
  }

  private release(plane: SkyPlane) {
    plane.timers = [];
    if (this.reduced) {
      plane.fade.to(0, 0.45, 1);
      plane.text.to(0, 0.3, 1);
      return;
    }
    const t = this.time;
    plane.text.to(0, 0.25, 1);
    plane.foldA.to(1, 0.42, 0.82);
    plane.timers.push(
      { at: t + 0.1, run: () => plane.foldB.to(1, 0.42, 0.82) },
      { at: t + 0.24, run: () => plane.foldC.to(1, 0.5, 0.8) },
      { at: t + 0.36, run: () => plane.foldD.to(1, 0.48, 0.74) },
      { at: t + 0.3, run: () => plane.glide.to(0, 0.85, 0.88) },
    );
  }

  /* -------------------------------------------------------------------- */
  /* loop                                                                  */
  /* -------------------------------------------------------------------- */

  wake() {
    if (this.destroyed || this.frame) return;
    if (!this.onScreen || this.hidden || !this.width) return;
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
    if (!this.onScreen || this.hidden) return;
    if (this.reduced && !busy) return;
    this.frame = requestAnimationFrame(this.tick);
  };

  /** Advance everything; true while anything is still moving. */
  private update(dt: number): boolean {
    this.time += dt;
    let busy = false;
    const step = (spring: Spring) => {
      spring.step(dt);
      if (!spring.resting) busy = true;
      return spring.value;
    };
    const dim = step(this.dim);
    step(this.focusRing);

    for (const plane of this.planes) {
      if (plane.timers.length) {
        busy = true;
        const due = plane.timers.filter((timer) => timer.at <= this.time);
        if (due.length) {
          plane.timers = plane.timers.filter((timer) => timer.at > this.time);
          due.forEach((timer) => timer.run());
        }
      }
      step(plane.appear);
      const hover = step(plane.hover);
      step(plane.roll);
      const boost = step(plane.boost);
      step(plane.glide);
      step(plane.foldA);
      step(plane.foldB);
      step(plane.foldC);
      step(plane.foldD);
      step(plane.text);
      step(plane.fade);
      // Never let the corner folds pass through the paper under them.
      plane.foldA.value = clamp(plane.foldA.value, -0.06, 1);
      plane.foldB.value = clamp(plane.foldB.value, -0.06, 1);

      const caught = plane.id === this.openId || plane.glide.value > 0.001 || plane.fade.value > 0.001;
      plane.trailClock += dt;
      if (!this.reduced && !caught) {
        const others = plane.id === this.openId ? 0 : dim;
        // hover slows a plane right down; keyboard focus stops it
        const focused = plane.id === this.focusId;
        const speed = plane.speed * (1 - (focused ? 1 : 0.88) * hover) * (1 - 0.65 * others) * boost;
        plane.x += speed * dt;
        const m = this.margin(plane);
        if (plane.x > this.width + m) {
          plane.x -= this.width + m * 2;
          plane.trailCount = 0;
        }
        if (focused && plane.scratch.visible) {
          // keep the focus ring (7px out, 2px wide) inside the band
          const s = plane.scratch;
          const pad = 10;
          let shift = 0;
          if (s.minX - pad < 6) shift = 6 - (s.minX - pad);
          else if (s.maxX + pad > this.width - 6) shift = this.width - 6 - (s.maxX + pad);
          if (Math.abs(shift) > 0.25) {
            plane.x += shift * (1 - Math.exp(-dt * 8));
            busy = true;
          }
        }
      }
    }

    // Tell the page once the note let go of is folded and back in its lane.
    if (this.settlingId) {
      const plane = this.byId.get(this.settlingId);
      const home =
        !plane ||
        (plane.timers.length === 0 && (this.reduced ? plane.fade.value < 0.08 : plane.glide.value < 0.2 && plane.foldD.value > 0.85));
      if (home) {
        this.settlingId = null;
        this.callbacks.onSettle?.();
      }
    }
    return busy || (!this.reduced && (this.planes.length > 0 || this.ghost));
  }

  /** Flight placement from the cruise state (also used as the glide start). */
  private placeInFlight(plane: SkyPlane) {
    const t = this.time;
    const hover = plane.hover.value;
    const still = this.reduced;
    const w = (Math.PI * 2) / plane.bobPeriod;
    const bob = still ? 0 : plane.bobAmp * Math.sin(w * t + plane.bobPhase);
    const climb = still ? 0 : plane.bobAmp * w * Math.cos(w * t + plane.bobPhase);
    const appear = plane.appear.value;
    plane.fx = still ? this.restX(plane) : plane.x;
    plane.fy = this.laneY(plane) + bob - (still ? 0 : 5 * hover) + (1 - appear) * 12;
    plane.fs = this.cruiseScale(plane) * (1 + (still ? 0 : 0.08) * hover) * (0.7 + 0.3 * appear);
    const pitch = still ? 0 : clamp(Math.atan2(-climb, plane.speed * 1.6) * DEG, -9, 9);
    const rock = still ? 0 : 3.5 * Math.sin((w / 1.37) * t + plane.rockPhase);
    plane.fq = flightQuat(plane.tilt, plane.yaw, pitch, rock + plane.roll.value);
  }

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  private draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const { dpr, look } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.spritesThisFrame = 0;
    const dim = this.dim.value;

    // 1. place and project everything
    for (const plane of this.planes) this.place(plane);

    // 2. shadows on the band, under every plane
    for (const plane of this.planes) {
      const p = plane.params;
      const alpha = p.alpha ?? 1;
      if (alpha <= 0.01) continue;
      const lifted = plane.glide.value;
      const near = 1 - plane.depth;
      const k = p.scale / 0.19;
      ctx.globalAlpha = alpha * lerp(0.55 + 0.45 * near, 1, lifted);
      drawShadow(
        ctx,
        dpr,
        plane.scratch,
        lerp(2 * k, 4, lifted),
        lerp((9 + 9 * near) * k, 16, lifted),
        lerp(4 + 4 * k, 18, lifted),
        look.shadow,
      );
    }
    ctx.globalAlpha = 1;

    // 3. dotted trails
    if (!this.reduced) this.drawTrails(ctx, dim);

    // 4. the planes, far to near; a caught one (or one flying back) on top
    let lifted: SkyPlane | null = null;
    for (const plane of this.planes) {
      if (plane.id === this.openId || plane.glide.value > 0.001) {
        if (!lifted || plane.id === this.openId) {
          if (lifted) drawPlane(ctx, dpr, lifted.params, lifted.scratch);
          lifted = plane;
          continue;
        }
      }
      drawPlane(ctx, dpr, plane.params, plane.scratch);
    }
    if (lifted) drawPlane(ctx, dpr, lifted.params, lifted.scratch);

    // 5. reduced motion: the open note fades in over the middle
    if (this.reduced) this.drawReducedNotes(ctx);

    // 6. name tag + focus ring
    this.drawTag(ctx);

    if (this.ghost) this.drawGhost(ctx);
  }

  private drawGhost(ctx: CanvasRenderingContext2D) {
    this.ghostScratch ??= new PlaneScratch(this.sheet);
    const params: PlaneParams = (this.ghostParams ??= {
      sheet: this.sheet,
      angles: anglesFrom(this.sheet, 1, 1, 1, 1, new Float64Array(8)),
      rot: rigid(),
      pivotX: PLANE_PIVOT.x,
      pivotY: 0,
      pivotZ: PLANE_PIVOT.z,
      x: 0,
      y: 0,
      scale: 0.3,
      focal: 900,
      paper: this.look.papers[0],
      look: this.look,
    });
    const t = this.reduced ? 0 : this.time;
    const bob = Math.sin(t * 1.3) * 5;
    const narrow = this.width < 520;
    params.x = this.width / 2 + (narrow ? 0 : 6);
    params.y = this.height / 2 - (narrow ? 26 : 46) + bob;
    params.scale = (narrow ? 150 : 190) / PLANE_LENGTH;
    quatToRigid(flightQuat(34, -30, 6 + Math.cos(t * 1.3) * 3, Math.sin(t * 0.9) * 3), params.rot);
    projectPlane(params, this.ghostScratch);
    drawSketch(ctx, this.dpr, params, this.ghostScratch, this.look.ghost);
  }

  private place(plane: SkyPlane) {
    const p = plane.params;
    const look = this.look;
    p.look = look;
    p.paper = look.papers[plane.paper % look.papers.length];
    this.placeInFlight(plane);
    const isOpen = plane.id === this.openId;
    // The caught plane (and one on its way back) never dims.
    const dim = isOpen || plane.glide.value > 0.001 || plane.fade.value > 0.001 ? 0 : this.dim.value;
    const appear = plane.appear.value;
    const g = this.reduced ? 0 : clamp(plane.glide.value, 0, 1.08);
    const a = plane.foldA.value;
    const b = plane.foldB.value;
    const c = plane.foldC.value;
    const d = plane.foldD.value;
    anglesFrom(this.sheet, a, b, c, d, plane.angles);

    let x = plane.fx;
    let y = plane.fy;
    let scale = plane.fs;
    let q = plane.fq;
    if (g > 0.0005) {
      const target = this.noteRect();
      const tx = target.x + target.w / 2;
      const ty = target.y + target.h / 2;
      const e = clamp(g, 0, 1);
      // a gentle arc up and over to the middle
      const mx = (plane.fx + tx) / 2;
      const my = Math.min(plane.fy, ty) - 36;
      const u = 1 - e;
      x = u * u * plane.fx + 2 * u * e * mx + e * e * tx;
      y = u * u * plane.fy + 2 * u * e * my + e * e * ty;
      scale = Math.exp(lerp(Math.log(plane.fs), Math.log(this.noteScale()), clamp(g, 0, 1.02)));
      q = quatSlerp(plane.fq, NOTE_QUAT, smoothstep(0, 0.92, e), plane.quat);
    }
    quatToRigid(q, p.rot);
    // Turn about the plane's middle while folded, the sheet's middle when flat.
    const folded = clamp(c, 0, 1);
    p.pivotX = PLANE_PIVOT.x * folded;
    p.pivotZ = PLANE_PIVOT.z * folded;
    p.x = x;
    p.y = y;
    p.scale = scale;
    p.focal = lerp(900, 1500, clamp(g, 0, 1));
    p.creases = clamp(1 - Math.max(a, b, c, d), 0, 1);
    p.alpha = appear * (1 - 0.62 * dim) * (this.reduced ? 1 - plane.fade.value : 1);
    plane.textAlpha = this.reduced ? 1 : clamp(plane.text.value, 0, 1);
    p.content = g > 0.0005 ? plane.fullContent : this.spriteFor(plane);
    projectPlane(p, plane.scratch);
    this.recordTrail(plane);
  }

  private spriteFor(plane: SkyPlane): PlaneContent | null {
    if (plane.sprite === undefined) {
      // A few per frame so a big sky doesn't stall its first frame.
      if (this.spritesThisFrame >= 6) return null;
      this.spritesThisFrame++;
      plane.sprite = noteSprite(plane.note, plane.layout, this.look);
      const sprite = plane.sprite;
      const { width, height } = plane.layout;
      plane.spriteContent = sprite
        ? { rect: plane.layout.ink, draw: (ctx) => ctx.drawImage(sprite, -width / 2, -height / 2, width, height) }
        : null;
    }
    return plane.spriteContent;
  }

  private recordTrail(plane: SkyPlane) {
    if (this.reduced || plane.glide.value > 0.01 || plane.id === this.openId) {
      plane.trailCount = 0;
      return;
    }
    if (plane.trailClock < TRAIL_EVERY && plane.trailCount > 0) return;
    plane.trailClock = 0;
    // the tail: the back of the keel, in screen space
    const r = plane.params.rot;
    const tx = -SHEET.width / 2 - plane.params.pivotX;
    const tz = -plane.params.pivotZ;
    const s = plane.params.scale;
    const x = plane.params.x + (r[0] * tx + r[2] * tz) * s;
    const y = plane.params.y + (r[3] * tx + r[5] * tz) * s;
    plane.trail[plane.trailHead * 2] = x;
    plane.trail[plane.trailHead * 2 + 1] = y;
    plane.trailHead = (plane.trailHead + 1) % TRAIL;
    plane.trailCount = Math.min(TRAIL, plane.trailCount + 1);
  }

  private drawTrails(ctx: CanvasRenderingContext2D, dim: number) {
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.look.trail;
    for (const plane of this.planes) {
      if (plane.trailCount < 2) continue;
      const alpha = (plane.params.alpha ?? 1) * (1 - plane.depth * 0.55) * (1 - dim * 0.8);
      const k = plane.params.scale / 0.19;
      // one path per plane: dots that shrink away behind it
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i = 1; i < plane.trailCount; i++) {
        const index = (plane.trailHead - 1 - i + TRAIL * 2) % TRAIL;
        const fade = 1 - i / TRAIL;
        const x = plane.trail[index * 2];
        const y = plane.trail[index * 2 + 1];
        const r = Math.max(0.35, 1.2 * k * fade);
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();
  }

  /** Reduced motion: the open note is drawn flat in the middle, cross-faded. */
  private reducedNoteParams: PlaneParams | null = null;
  private reducedScratch: PlaneScratch | null = null;
  private reducedAngles = new Float64Array(8);

  private drawReducedNotes(ctx: CanvasRenderingContext2D) {
    for (const plane of this.planes) {
      const f = plane.fade.value;
      if (f <= 0.002) continue;
      this.reducedScratch ??= new PlaneScratch(this.sheet);
      const rect = this.noteRect();
      const params: PlaneParams = (this.reducedNoteParams ??= {
        sheet: this.sheet,
        angles: this.reducedAngles,
        rot: quatToRigid(NOTE_QUAT),
        pivotX: 0,
        pivotY: 0,
        pivotZ: 0,
        x: 0,
        y: 0,
        scale: 1,
        focal: 1500,
        paper: this.look.papers[0],
        look: this.look,
        content: null,
        creases: 1,
      });
      params.look = this.look;
      params.paper = this.look.papers[plane.paper % this.look.papers.length];
      params.x = rect.x + rect.w / 2;
      params.y = rect.y + rect.h / 2;
      params.scale = this.noteScale();
      params.alpha = f;
      params.content = plane.fullContent;
      plane.textAlpha = 1;
      projectPlane(params, this.reducedScratch);
      ctx.globalAlpha = f;
      drawShadow(ctx, this.dpr, this.reducedScratch, 4, 16, 18, this.look.shadow);
      ctx.globalAlpha = 1;
      drawPlane(ctx, this.dpr, params, this.reducedScratch);
    }
  }

  private drawTag(ctx: CanvasRenderingContext2D) {
    const id = this.hoverId ?? this.focusId;
    const plane = id ? this.byId.get(id) : null;
    if (!plane || plane.id === this.openId) return;
    // While a released note refolds and flies home, no ring or tag: they
    // fade in once the plane is back in its lane.
    const home = 1 - smoothstep(0, 0.3, plane.glide.value);
    const ring = this.focusId === plane.id ? this.focusRing.value * home : 0;
    const show = Math.max(plane.hover.value * home, ring);
    if (show < 0.02) return;
    const s = plane.scratch;
    const { dpr, look } = this;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (ring > 0.01) {
      // the site's focus style: 2px in the foreground colour, a little out
      const pad = 7;
      const x0 = Math.max(2, s.minX - pad);
      const y0 = Math.max(2, s.minY - pad);
      const x1 = Math.min(this.width - 2, s.maxX + pad);
      const y1 = Math.min(this.height - 2, s.maxY + pad);
      ctx.globalAlpha = ring;
      ctx.strokeStyle = look.focus;
      ctx.lineWidth = 2;
      roundRect(ctx, x0, y0, x1 - x0, y1 - y0, 12);
      ctx.stroke();
    }

    const label = plane.note.name;
    ctx.font = `500 12px ${noteFont()}`;
    const textWidth = Math.min(ctx.measureText(label).width, 180);
    const w = textWidth + 20;
    const h = 24;
    let x = (s.minX + s.maxX) / 2 - w / 2;
    let y = s.maxY + 9 + (1 - show) * 4;
    x = clamp(x, 8, this.width - w - 8);
    if (y + h > this.height - 6) y = s.minY - h - 9;
    y = clamp(y, 6, this.height - h - 6);
    ctx.globalAlpha = show;
    ctx.shadowColor = "rgba(0,0,0,0.08)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = look.tagFill;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = look.tagRing;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = look.tagText;
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 10, y + h / 2 + 0.5, 180);
    ctx.restore();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
