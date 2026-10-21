"use client";

// The name at the top of the home page, set in Geist's weight axis and alive
// under the pointer.
//
//   <h1><NameWave text="Zakaria" /> <span>Full-stack developer…</span></h1>
//
// LOOK
//   At rest it is the plain medium name, glyph for glyph (kerning kept).
//   Bring the pointer near and the ink gathers under it: the letters closest
//   to the pointer swell toward a heavy weight on a soft Gaussian, the
//   letters further away thin a little, and the spacing far from the swell
//   tightens by a fraction of a pixel to make room. The word's two edges
//   never move, so it stays aligned with the title under it: the weight
//   seems to flow through the name like a bead of ink rather than the name
//   growing. No colour, no skew, no baseline tricks; only weight and spacing.
//
// MOTION MODEL (all springs integrated with real dt in fixed 1/240 s substeps)
//   pointer x   critically damped spring (ω 22/s): the swell glides after
//               the cursor instead of snapping letter to letter.
//   presence    critically damped, quicker in (ω 12) than out (ω 8): the
//               swell fades in by proximity (it starts about one line-height
//               away from the name, so it feels magnetic, not hit-tested).
//   pressure    critically damped (ω 10): pressing on the name concentrates
//               the swell (heavier, narrower).
//   letters     one slightly under-damped spring per letter (ω ≈ 17, ζ ≈ 0.64,
//               about 7% overshoot on a step): the targets above move them, so
//               a fast sweep leaves a short liquid wake and leaving the name
//               settles with a soft give instead of a cut.
//   Every spring keeps its value and velocity, so any change (enter, leave,
//   press, release, a new ripple) picks up from where the letters are: no
//   restarts, no jumps.
//
// THE "WOW" SECOND
//   Sweep across the name: the weight pours along with the cursor and rocks
//   to rest behind it. Tap or click: a ripple of weight runs out both ways
//   from the spot, crest then trough, and fades (with one soft marimba note
//   per letter, so tapping along the name plays it). Hold, then let go: the
//   swell gathers under the finger and the release sends a bigger ripple.
//   On load, one slow swell sweeps the name once, left to right, as a hint.
//
// TOUCH  Drag along the name (touch-action: pan-y keeps vertical scrolling);
//        a tap ripples. KEYBOARD  Nothing to operate (it is a heading).
// REDUCED MOTION  Static: the plain name, no listeners, no loop, no sound.
// NO LAYOUT SHIFT  The letters become inline-blocks with fixed em widths
//   measured from the kerned word, so the line box never changes; weight is
//   applied inside the boxes and positions move with `translate` only.
// ACCESSIBILITY  The visible letters are aria-hidden; the name is also plain
//   text in an sr-only span, so the heading reads "Zakaria Full-stack…".
//   The sr-only copy is unselectable, so selecting and copying the heading
//   gives the name once, from the visible letters. A long press that drives
//   the wave on touch does not start a text selection or the iOS callout.
// COST  The loop sleeps as soon as everything has settled, wakes on pointer
//   moves near the name, pauses offscreen and in hidden tabs, allocates
//   nothing per frame, and writes a style only when its value changed
//   (weights are quantised to 4 units so the font cache stays small).

import { useEffect, useRef, useState } from "react";
import { ensureAudio, isMuted } from "@/components/lab/audio";
import { useFrame, useInView, useReducedMotion } from "@/components/lab/hooks";

/* ---------------------------------------------------------------------- */
/* tuning                                                                  */
/* ---------------------------------------------------------------------- */

/** Peak extra weight under a resting pointer (font-weight units). */
const AMP = 260;
/** Extra amplitude while pressing (fraction of AMP). */
const PRESS_GAIN = 0.32;
/** Width of the swell (em). A letter of the name is about 0.46em, so this is about one letter. */
const SIGMA = 0.5;
/** Extra width at speed (em): fast sweeps spread the ink. */
const SIGMA_FAST = 0.26;
/** Share of the average extra weight taken back from every letter (the thinning). */
const THIN = 0.32;
const MIN_WEIGHT = 320;
const MAX_WEIGHT = 840;
/** Weights are written in steps of this many units. */
const QUANTUM = 4;

/** Letter weight springs: ω ≈ 17.3/s, ζ ≈ 0.64. */
const LETTER_K = 300;
const LETTER_C = 22;
/** Pointer glide: critically damped, ω 22/s (about 0.2 s to catch up). */
const POINTER_W = 22;
/** Presence in / out (critically damped). */
const PRESENCE_IN = 12;
const PRESENCE_OUT = 8;
/** Pressure (critically damped). */
const PRESSURE_W = 10;

/** Proximity radius as a multiple of the font size. */
const REACH = 1.1;

/**
 * Ripples: speed (em/s), crest width (em), decay time (s), lifetime (s), and
 * the depth of the trough that follows the crest (fraction of the crest).
 * The name is about 3.2em wide: a ripple from the middle reaches both ends
 * in about 0.6 s.
 */
const RIPPLE_SPEED = 2.6;
const RIPPLE_WIDTH = 0.4;
const RIPPLE_DECAY = 0.75;
const RIPPLE_LIFE = 2.6;
const RIPPLE_TROUGH = 0.5;
const MAX_RIPPLES = 4;

/** The hint sweep on first view: delay and duration (s). */
const INTRO_DELAY = 0.7;
const INTRO_TIME = 1.5;
const INTRO_GAIN = 0.7;
const INTRO_SIGMA = 0.6;

/** Isolated advances are sampled every 50 weight units from 100 to 900. */
const SAMPLE_FROM = 100;
const SAMPLE_STEP = 50;
const SAMPLES = 17;

/** Fixed spring substep (s). */
const H = 1 / 240;

/** G major pentatonic, low and warm: one note per letter, left to right. */
const NOTES = [392, 440, 493.88, 587.33, 659.25, 783.99, 880, 987.77, 1174.66];

/* ---------------------------------------------------------------------- */
/* engine                                                                  */
/* ---------------------------------------------------------------------- */

type Metrics = {
  n: number;
  fontSize: number;
  base: number;
  /** em: kerned rest left edge and advance of each letter. */
  left: Float64Array;
  adv: Float64Array;
  centre: Float64Array;
  width: number;
  /** em: isolated advance of letter i at sample s is table[i * SAMPLES + s]. */
  table: Float64Array;
};

function advanceAt(m: Metrics, i: number, weight: number): number {
  const f = (weight - SAMPLE_FROM) / SAMPLE_STEP;
  const s = Math.max(0, Math.min(SAMPLES - 2, Math.floor(f)));
  const t = Math.max(0, Math.min(1, f - s));
  const row = i * SAMPLES;
  return m.table[row + s] * (1 - t) + m.table[row + s + 1] * t;
}

const smooth01 = (x: number) => {
  const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/** Critically damped spring step toward `target`; box is [value, velocity], updated in place. */
function critical(box: Float64Array, target: number, omega: number, dt: number) {
  const k = omega * omega;
  const c = 2 * omega;
  let remaining = Math.min(dt, 0.1);
  let x = box[0];
  let v = box[1];
  while (remaining > 1e-6) {
    const h = remaining < H ? remaining : H;
    v += (-k * (x - target) - c * v) * h;
    x += v * h;
    remaining -= h;
  }
  // close enough: land exactly, so a sleeping loop holds a clean value
  if (Math.abs(x - target) < 0.0005 && Math.abs(v) < 0.005) {
    x = target;
    v = 0;
  }
  box[0] = x;
  box[1] = v;
}

class Wave {
  m: Metrics | null = null;
  els: HTMLElement[] = [];

  // per-letter state
  w = new Float64Array(0);
  v = new Float64Array(0);
  target = new Float64Array(0);
  shownW = new Float64Array(0);
  shownX = new Float64Array(0);
  delta = new Float64Array(0);
  gap = new Float64Array(0);

  // [value, velocity] boxes
  px = new Float64Array(2);
  presence = new Float64Array(2);
  pressure = new Float64Array(2);

  // input (client px)
  hover = false;
  clientX = 0;
  clientY = 0;
  touching = false;
  pressing = false;
  pressX = 0;
  pressY = 0;
  pressT = 0;
  pressMoved = 0;

  rect = { left: 0, top: 0, right: 0, bottom: 0 };

  // ripples: x0 (em), age (s), amplitude; age < 0 = free slot
  rx = new Float64Array(MAX_RIPPLES);
  rage = new Float64Array(MAX_RIPPLES).fill(-1);
  ramp = new Float64Array(MAX_RIPPLES);

  /** Seconds since the intro was armed (< 0 = not armed, Infinity = done). */
  intro = -1;

  attach(m: Metrics, els: HTMLElement[]) {
    const fresh = !this.m || this.m.n !== m.n;
    this.m = m;
    this.els = els;
    if (fresh) {
      const n = m.n;
      this.w = new Float64Array(n).fill(m.base);
      this.v = new Float64Array(n);
      this.target = new Float64Array(n).fill(m.base);
      this.shownW = new Float64Array(n).fill(NaN);
      this.shownX = new Float64Array(n).fill(NaN);
      this.delta = new Float64Array(n);
      this.gap = new Float64Array(Math.max(0, n - 1));
    } else {
      this.shownW.fill(NaN);
      this.shownX.fill(NaN);
    }
  }

  readRect() {
    const first = this.els[0];
    const root = first?.parentElement;
    if (!root) return;
    const r = root.getBoundingClientRect();
    this.rect.left = r.left;
    this.rect.top = r.top;
    this.rect.right = r.right;
    this.rect.bottom = r.bottom;
  }

  /** Pointer x in em from the name's left edge. */
  toEm(clientX: number): number {
    const m = this.m;
    if (!m) return 0;
    return (clientX - this.rect.left) / m.fontSize;
  }

  /** Whether a mouse at (x, y) is close enough to matter. */
  near(x: number, y: number): boolean {
    const m = this.m;
    if (!m) return false;
    this.readRect();
    const r = this.rect;
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    return dx * dx + dy * dy < (REACH * m.fontSize) ** 2;
  }

  /** Index of the letter under x (em), clamped. */
  letterAt(xEm: number): number {
    const m = this.m;
    if (!m) return 0;
    for (let i = 0; i < m.n; i++) if (xEm < m.left[i] + m.adv[i]) return i;
    return m.n - 1;
  }

  ripple(xEm: number, amplitude: number) {
    let slot = 0;
    let oldest = -2;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      if (this.rage[i] < 0) {
        slot = i;
        oldest = Infinity;
        break;
      }
      if (this.rage[i] > oldest) {
        oldest = this.rage[i];
        slot = i;
      }
    }
    this.rx[slot] = xEm;
    this.rage[slot] = 0;
    this.ramp[slot] = amplitude;
    // A real gesture: the hint is no longer needed.
    if (this.intro >= 0 && this.intro < Infinity) this.intro = Infinity;
  }

  /** One frame. Returns false once everything has settled (the loop sleeps). */
  frame(dt: number): boolean {
    const m = this.m;
    if (!m) return false;
    // The name can move without a scroll (content above it reflowing):
    // read its box every frame while awake (the layout is clean by now).
    this.readRect();
    const n = m.n;

    // --- input → targets for the scalar springs --------------------------
    let presenceTarget = 0;
    let pointerTarget = this.px[0];
    if (this.touching) {
      presenceTarget = 1;
      pointerTarget = this.toEm(this.clientX);
    } else if (this.hover) {
      const r = this.rect;
      const x = this.clientX;
      const y = this.clientY;
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = Math.sqrt(dx * dx + dy * dy) / (REACH * m.fontSize);
      presenceTarget = 1 - smooth01(d);
      pointerTarget = this.toEm(x);
    }
    if (presenceTarget > 0 && this.intro >= 0 && this.intro < INTRO_DELAY) this.intro = Infinity;
    pointerTarget = Math.max(-0.6, Math.min(m.width + 0.6, pointerTarget));
    // Coming in from nothing: start the swell where the pointer is.
    if (this.presence[0] < 0.02 && presenceTarget > 0) {
      this.px[0] = pointerTarget;
      this.px[1] = 0;
    }
    critical(this.presence, presenceTarget, presenceTarget > this.presence[0] ? PRESENCE_IN : PRESENCE_OUT, dt);
    critical(this.px, pointerTarget, POINTER_W, dt);
    critical(this.pressure, this.pressing ? 1 : 0, PRESSURE_W, dt);

    const presence = Math.max(0, this.presence[0]);
    const pressure = Math.max(0, this.pressure[0]);
    const speed = Math.abs(this.px[1]);
    const sigma = (SIGMA + SIGMA_FAST * smooth01((speed - 1) / 13)) * (1 - 0.22 * pressure);
    const amp = AMP * presence * (1 + PRESS_GAIN * pressure);
    const px = this.px[0];

    // --- intro hint sweep --------------------------------------------------
    let introX = 0;
    let introAmp = 0;
    if (this.intro >= 0 && this.intro < Infinity) {
      this.intro += dt;
      const u = (this.intro - INTRO_DELAY) / INTRO_TIME;
      if (u >= 1) this.intro = Infinity;
      else if (u > 0) {
        introX = -0.8 + (m.width + 1.6) * smooth01(u);
        // the hint yields to a real pointer
        introAmp = AMP * INTRO_GAIN * Math.pow(Math.sin(Math.PI * u), 1.2) * (1 - presence);
      }
    }

    // --- ripples -------------------------------------------------------------
    let ripplesAlive = false;
    for (let r = 0; r < MAX_RIPPLES; r++) {
      if (this.rage[r] < 0) continue;
      this.rage[r] += dt;
      if (this.rage[r] > RIPPLE_LIFE) this.rage[r] = -1;
      else ripplesAlive = true;
    }

    // --- per-letter targets ------------------------------------------------
    let meanDev = 0;
    for (let i = 0; i < n; i++) {
      const c = m.centre[i];
      let dev = 0;
      if (amp > 0.01) {
        const z = (c - px) / sigma;
        dev += amp * Math.exp(-0.5 * z * z);
      }
      if (introAmp > 0.01) {
        const z = (c - introX) / INTRO_SIGMA;
        dev += introAmp * Math.exp(-0.5 * z * z);
      }
      if (ripplesAlive) {
        for (let r = 0; r < MAX_RIPPLES; r++) {
          const age = this.rage[r];
          if (age < 0) continue;
          const front = RIPPLE_SPEED * age;
          const z = (Math.abs(c - this.rx[r]) - front) / RIPPLE_WIDTH;
          // the trough rides 1.6 crest-widths behind the crest
          const zt = z + 1.6;
          // ease the crest in over the first 60 ms so a tap never kicks
          const onset = smooth01(age / 0.06);
          const shape = Math.exp(-0.5 * z * z) - RIPPLE_TROUGH * Math.exp(-0.5 * zt * zt);
          dev += AMP * this.ramp[r] * onset * Math.exp(-age / RIPPLE_DECAY) * shape;
        }
      }
      this.target[i] = dev;
      meanDev += dev;
    }
    meanDev /= n;
    const thin = THIN * meanDev;
    for (let i = 0; i < n; i++) {
      const t = m.base + this.target[i] - thin;
      this.target[i] = t < MIN_WEIGHT ? MIN_WEIGHT : t > MAX_WEIGHT ? MAX_WEIGHT : t;
    }

    // --- letter springs ----------------------------------------------------
    let moving = false;
    for (let i = 0; i < n; i++) {
      let x = this.w[i];
      let v = this.v[i];
      const target = this.target[i];
      let remaining = Math.min(dt, 0.1);
      while (remaining > 1e-6) {
        const h = remaining < H ? remaining : H;
        v += (-LETTER_K * (x - target) - LETTER_C * v) * h;
        x += v * h;
        remaining -= h;
      }
      if (Math.abs(x - target) < 0.4 && Math.abs(v) < 2) {
        x = target;
        v = 0;
      } else moving = true;
      this.w[i] = x;
      this.v[i] = v;
    }

    // --- layout: advance deltas, spacing that keeps both edges pinned ------
    let total = 0;
    for (let i = 0; i < n; i++) {
      const q = Math.round(this.w[i] / QUANTUM) * QUANTUM;
      const d = advanceAt(m, i, q) - advanceAt(m, i, m.base);
      this.delta[i] = d;
      total += d;
    }
    if (n > 1) {
      let sum = 0;
      for (let j = 0; j < n - 1; j++) {
        const a = Math.abs(this.w[j] - m.base);
        const b = Math.abs(this.w[j + 1] - m.base);
        const heavy = Math.min(1, (a > b ? a : b) / AMP);
        const g = 1.05 - 0.85 * heavy;
        this.gap[j] = g;
        sum += g;
      }
      for (let j = 0; j < n - 1; j++) this.gap[j] = (-total * this.gap[j]) / sum;
    }

    // --- write ---------------------------------------------------------------
    let shift = 0;
    for (let i = 0; i < n; i++) {
      const el = this.els[i];
      const q = Math.round(this.w[i] / QUANTUM) * QUANTUM;
      if (q !== this.shownW[i]) {
        this.shownW[i] = q;
        el.style.fontWeight = String(q);
      }
      // em, rounded to ~1/100 px at 34px
      const x = Math.round(shift * 3000) / 3000;
      if (x !== this.shownX[i]) {
        this.shownX[i] = x;
        el.style.translate = x === 0 ? "" : `${x}em`;
      }
      shift += this.delta[i] + (i < n - 1 ? this.gap[i] : 0);
    }

    const scalarsMoving =
      Math.abs(this.presence[0] - presenceTarget) > 0.002 ||
      Math.abs(this.presence[1]) > 0.01 ||
      Math.abs(this.pressure[0] - (this.pressing ? 1 : 0)) > 0.002 ||
      Math.abs(this.pressure[1]) > 0.01 ||
      (presence > 0.01 && (Math.abs(this.px[0] - pointerTarget) > 0.002 || Math.abs(this.px[1]) > 0.02));
    const introPending = this.intro >= 0 && this.intro < Infinity;
    return moving || scalarsMoving || ripplesAlive || introPending;
  }
}

/* ---------------------------------------------------------------------- */
/* measuring                                                               */
/* ---------------------------------------------------------------------- */

const unquote = (family: string) => family.trim().replace(/^["']|["']$/g, "");

/** True once the first family of the stack is a loaded variable face (a weight range). */
function variableFaceReady(fontFamily: string): boolean {
  if (typeof document === "undefined" || !document.fonts) return false;
  const family = unquote(fontFamily.split(",")[0] ?? "");
  let ready = false;
  document.fonts.forEach((face) => {
    if (unquote(face.family) === family && face.status === "loaded" && /\d+\s+\d+/.test(face.weight)) ready = true;
  });
  return ready;
}

/** Put the letters back to plain inline text at the rest weight. */
function resetLetters(els: HTMLElement[]) {
  for (const el of els) {
    el.style.display = "";
    el.style.width = "";
    el.style.fontWeight = "";
    el.style.translate = "";
  }
}

/**
 * Measure the kerned rest layout of the letters (while they are plain inline
 * text) and the isolated advance of each letter across the weight axis, then
 * turn the letters into fixed-width boxes. Returns null when Geist's variable
 * face is not in use (fallback font): the name then stays static.
 */
function measure(root: HTMLElement, els: HTMLElement[]): Metrics | null {
  if (els.length === 0) return null;
  resetLetters(els);
  const cs = getComputedStyle(root);
  if (!variableFaceReady(cs.fontFamily)) return null;
  const fontSize = parseFloat(cs.fontSize);
  const base = parseFloat(cs.fontWeight) || 500;
  if (!(fontSize > 0)) return null;
  const n = els.length;

  const origin = els[0].getBoundingClientRect().left;
  const lefts = els.map((el) => el.getBoundingClientRect().left - origin);
  const last = els[n - 1].getBoundingClientRect();
  const left = new Float64Array(n);
  const adv = new Float64Array(n);
  const centre = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    left[i] = lefts[i] / fontSize;
    adv[i] = (i < n - 1 ? lefts[i + 1] - lefts[i] : last.right - last.left) / fontSize;
    centre[i] = left[i] + adv[i] / 2;
  }
  const width = left[n - 1] + adv[n - 1];

  // Isolated advances, measured large for precision, in em.
  const PROBE = 200;
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    `position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none;white-space:pre;` +
    `font-family:${cs.fontFamily};font-size:${PROBE}px;font-style:${cs.fontStyle};letter-spacing:0;line-height:1;font-kerning:none`;
  const chars = els.map((el) => el.textContent ?? "");
  for (let i = 0; i < n; i++) {
    for (let s = 0; s < SAMPLES; s++) {
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.style.fontWeight = String(SAMPLE_FROM + s * SAMPLE_STEP);
      span.textContent = chars[i];
      probe.appendChild(span);
    }
  }
  document.body.appendChild(probe);
  const table = new Float64Array(n * SAMPLES);
  const spans = probe.children;
  for (let k = 0; k < spans.length; k++) table[k] = spans[k].getBoundingClientRect().width / PROBE;
  probe.remove();

  for (let i = 0; i < n; i++) {
    const el = els[i];
    el.style.display = "inline-block";
    el.style.width = `${adv[i]}em`;
  }
  return { n, fontSize, base, left, adv, centre, width, table };
}

/* ---------------------------------------------------------------------- */
/* sound                                                                   */
/* ---------------------------------------------------------------------- */

/** One soft marimba-ish note: a sine with a short inharmonic tine, quick decay. */
function playNote(index: number, strength: number) {
  const audio = ensureAudio();
  if (!audio || isMuted()) return;
  const { ctx, output } = audio;
  const t = ctx.currentTime + 0.004;
  const f = NOTES[Math.max(0, Math.min(NOTES.length - 1, index))];
  const level = 0.05 * Math.max(0.4, Math.min(1.3, strength));

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(f * 1.012, t);
  body.frequency.exponentialRampToValueAtTime(f, t + 0.03);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.0001, t);
  bodyGain.gain.exponentialRampToValueAtTime(level, t + 0.005);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);

  const tine = ctx.createOscillator();
  tine.type = "sine";
  tine.frequency.setValueAtTime(f * 3.93, t);
  const tineGain = ctx.createGain();
  tineGain.gain.setValueAtTime(0.0001, t);
  tineGain.gain.exponentialRampToValueAtTime(level * 0.22, t + 0.002);
  tineGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 3200;
  tone.Q.value = 0.4;

  body.connect(bodyGain).connect(tone);
  tine.connect(tineGain).connect(tone);
  tone.connect(output);
  body.start(t);
  tine.start(t);
  body.stop(t + 0.45);
  tine.stop(t + 0.1);
  body.onended = () => {
    body.disconnect();
    tine.disconnect();
    bodyGain.disconnect();
    tineGain.disconnect();
    tone.disconnect();
  };
}

/* ---------------------------------------------------------------------- */
/* component                                                               */
/* ---------------------------------------------------------------------- */

/** Movement (px) after which a press counts as a drag, not a tap. */
const TAP_SLOP = 8;

export function NameWave({ text }: { text: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLSpanElement>(null);
  const [wave] = useState(() => new Wave());
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const inView = useInView(rootRef, { rootMargin: "96px 0px" });
  const active = ready && inView && !reduced;
  const wake = useFrame(active, (dt) => wave.frame(dt));

  // Measure once Geist's variable face is in, again if the font size changes
  // (the sm breakpoint), and hand the letters back as plain text on cleanup
  // or under reduced motion.
  useEffect(() => {
    const root = rootRef.current;
    const row = rowRef.current;
    if (!root || !row || reduced) return;
    const els = Array.from(row.children) as HTMLElement[];
    let cancelled = false;
    let measuredSize = 0;

    const run = () => {
      if (cancelled) return;
      const metrics = measure(root, els);
      if (!metrics) {
        setReady(false);
        return;
      }
      measuredSize = metrics.fontSize;
      const first = wave.m === null;
      wave.attach(metrics, els);
      if (first && wave.intro < 0) wave.intro = 0;
      setReady(true);
      wake();
    };

    // A late font load (slow network, swap) gets a second chance to measure.
    const runIfPending = () => {
      if (!wave.m) run();
    };
    const fonts = document.fonts;
    if (fonts) {
      void fonts.ready.then(run);
      fonts.addEventListener("loadingdone", runIfPending);
    } else run();

    const observer = new ResizeObserver(() => {
      if (!measuredSize) return;
      const size = parseFloat(getComputedStyle(root).fontSize);
      if (Math.abs(size - measuredSize) > 0.01) run();
    });
    observer.observe(root);

    return () => {
      cancelled = true;
      fonts?.removeEventListener("loadingdone", runIfPending);
      observer.disconnect();
      resetLetters(els);
      wave.m = null;
      setReady(false);
    };
  }, [reduced, wave, wake]);

  // Input, only while the name is on screen and animating is allowed.
  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root) return;
    wave.hover = false;
    wave.touching = false;
    wave.pressing = false;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      wave.clientX = event.clientX;
      wave.clientY = event.clientY;
      wave.hover = true;
      if (wave.pressing) {
        wave.pressMoved = Math.max(wave.pressMoved, Math.hypot(event.clientX - wave.pressX, event.clientY - wave.pressY));
      }
      // Far from the name and already at rest: nothing to do, stay asleep.
      if (wave.pressing || wave.presence[0] > 0.001 || wave.near(event.clientX, event.clientY)) wake();
    };
    const onOut = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.relatedTarget) return;
      wave.hover = false;
      wake();
    };
    const onScroll = () => {
      // The name moves under a still pointer.
      if (wave.hover && (wave.presence[0] > 0.001 || wave.near(wave.clientX, wave.clientY))) wake();
    };

    const release = (event: PointerEvent, cancelled: boolean) => {
      if (!wave.pressing) return;
      wave.pressing = false;
      const tap = !cancelled && wave.pressMoved < TAP_SLOP;
      if (event.pointerType === "touch") wave.touching = false;
      if (tap) {
        wave.readRect();
        const held = (performance.now() - wave.pressT) / 1000;
        const x = wave.toEm(event.clientX);
        const strength = 1.15 + 0.3 * smooth01((held - 0.15) / 0.6);
        wave.ripple(x, strength);
        playNote(wave.letterAt(x), strength);
      }
      wake();
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      wave.readRect();
      wave.pressing = true;
      wave.pressX = event.clientX;
      wave.pressY = event.clientY;
      wave.pressT = performance.now();
      wave.pressMoved = 0;
      wave.clientX = event.clientX;
      wave.clientY = event.clientY;
      if (event.pointerType === "touch") {
        wave.touching = true;
        try {
          root.setPointerCapture(event.pointerId);
        } catch {}
      } else wave.hover = true;
      wake();
    };
    const onRootMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !wave.touching) return;
      wave.clientX = event.clientX;
      wave.clientY = event.clientY;
      wave.pressMoved = Math.max(wave.pressMoved, Math.hypot(event.clientX - wave.pressX, event.clientY - wave.pressY));
      wake();
    };
    const onUp = (event: PointerEvent) => release(event, false);
    const onCancel = (event: PointerEvent) => {
      wave.touching = false;
      release(event, true);
    };
    // A long press on the name is a hold, not a text selection.
    const onSelectStart = (event: Event) => {
      if (wave.touching) event.preventDefault();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onCancel, { passive: true });
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onRootMove, { passive: true });
    root.addEventListener("selectstart", onSelectStart);
    wake();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onRootMove);
      root.removeEventListener("selectstart", onSelectStart);
      wave.hover = false;
      wave.touching = false;
      wave.pressing = false;
    };
  }, [active, wave, wake]);

  const letters = Array.from(text);

  return (
    <span
      ref={rootRef}
      data-name-wave=""
      className="relative inline-block touch-pan-y whitespace-nowrap before:absolute before:-inset-x-2 before:-top-2.5 before:-bottom-1 before:content-['']"
    >
      <span className="sr-only select-none">{text}</span>
      <span ref={rowRef} aria-hidden="true" className="pointer-coarse:[-webkit-touch-callout:none]">
        {letters.map((letter, index) => (
          <span key={index}>{letter === " " ? "\u00a0" : letter}</span>
        ))}
      </span>
    </span>
  );
}
