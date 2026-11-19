"use client";

// Turntable: a direct-drive deck seen from straight above.
//
// The look (what each part is for)
// - Materials: a lacquered plinth (pearl by day, graphite at night) with a
//   rounded edge; a machined aluminium platter with two rows of polished
//   strobe dots on its rim; the record, with pressed bands of fine grooves,
//   a smooth lead-in, a run-out with a hand-scratched matrix number, and a
//   paper label printed with the arsher mark; a black anodised pivot, a
//   polished tube and counterweight; a brushed headshell with slotted
//   screws over a black cartridge, its stylus housing in the accent.
// - Light: one soft studio key from the upper left and a big softbox
//   overhead. The metal takes its look from what it reflects; everything
//   tall throws a soft shadow that grows softer with height, so a lifted
//   arm visibly floats. The vinyl's sheen is anisotropic: the grooves are
//   concentric, so the highlight sits where they run square to the light,
//   two bright wedges through the spindle. Groove modulation and a slight
//   warp turn with the record, so the wedges shimmer and sway as it spins.
//   The strobe lamp freezes the dot row for the speed it's set to: lit up
//   at night, shaded orange by contrast in a bright room.
// - Motion: nothing snaps. The platter has weight (half a second to come
//   up to speed, it coasts to a stop), the arm lifts, swings and lowers on
//   springs, and a held record follows your hand on a stiff spring then
//   catches back up to the platter on the slipmat when you let go.
// - Sound (stage only, after a gesture, through the lab mute): a loop
//   rendered once offline (drums, bass, keys), played at the record's own
//   speed, so a scratch is the music moving with your hand, backwards on a
//   reversed copy; crackle in the groove; the needle's bump; the clicks of
//   the buttons and the cue lever.
// - Finding things: the part under the pointer (or in the hand) lifts a
//   little; after the first start a one-time hint and a soft glint point
//   out the arm and the pitch fader. Touch scrolls the page from anywhere
//   that isn't a part you can handle.
// - Tile: the record spins with the arm in the groove, no sound, 30 fps.
// - A slow machine: the stage renders a step or two below the screen's DPR
//   (only the canvas resizes), and the context is handed back on unmount.
// - Reduced motion: a still deck with the needle on the record (tile), or
//   at rest (stage). Pressing start still plays, since that motion is asked for.
//
// Files: deck.ts (layout + physics), shaders.ts + renderer.ts (WebGL2),
// art.ts (label and plinth printing), look.ts (materials, pressings),
// loop.ts (the music), sound.ts (playback and one-shots).

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ensureAudio } from "../../audio";
import { clamp, damp, lerp, Spring, useFinePointer, useFrame, useLatest, usePointer, useWebGL2 } from "../../hooks";
import { Play } from "../../lab-icons";
import type { PieceProps, PieceTheme } from "../../types";
import { MuteButton, Segmented, StageControls, StageHint, Swatches, Tray, TrayButton, TrayDivider, TrayRow } from "../../ui";
import { drawLabel, drawPrint, fontReady } from "./art";
import {
  angleFor,
  armPose,
  BANDS,
  CENTRE,
  Deck,
  faderY,
  hitTest,
  LABEL_R,
  newPose,
  omegaFor,
  pitchAt,
  PIVOT,
  PLATTER_R,
  PLINTH,
  RECORD_R,
  type Speed,
  type Target,
} from "./deck";
import { CueIcon, StopIcon } from "./icons";
import { LOOKS, PRESSINGS, pressingById, type Look, type Pressing, type PressingId, type Vec3 } from "./look";
import { renderLoop } from "./loop";
import { DeckRenderer, HOVER_PARTS, type Frame } from "./renderer";
import { buttonClick, DeckAudio, lockClick, needleDrop, needleLift, type DeckSound } from "./sound";

const SWATCHES = PRESSINGS.map((p) => ({ value: p.id, label: p.label, swatch: p.swatch }));
const SPEEDS = [
  { value: 33 as Speed, label: "33" },
  { value: 45 as Speed, label: "45" },
];
const SILENT: readonly [number, number, number] = [0, 0, 0];
const TAU = Math.PI * 2;
const BUTTONS = ["start", "s33", "s45"] as const;
type ButtonKey = (typeof BUTTONS)[number];

const HINT_KEYS_LONG = "Space start · hold ← → scratch · ↑ ↓ bands · C cue · 3/4 speed · − + 0 pitch · R park";
const HINT_KEYS_SHORT = "Space start · hold ← → scratch · ↑ ↓ bands · C cue · − + pitch";
const HINT_COACH = "Drag the arm · slide the pitch";
/** The long key hint fits on one line from about here. */
const WIDE_HINT = 720;

/**
 * If a machine can't hold the frame rate, the stage renders below the
 * screen's DPR in steps (the canvas is scaled up by the browser): on a 2x
 * screen 2 → 1.5 → 1.25, on a 1x screen 1 → 0.85 → 0.75.
 */
const RENDER_STEPS_HI = [1, 0.75, 0.625] as const;
const RENDER_STEPS_LO = [1, 0.85, 0.75] as const;

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function mix3(out: Vec3, a: Vec3, b: Vec3, t: number) {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
}

const LOOK_VECS = ["light", "key", "ambTop", "ambLow", "envHigh", "envLow", "box", "plinth", "ink", "metal", "dark", "glow", "cart", "guard"] as const;
const LOOK_NUMS = ["ground", "exposure", "rim", "sheen", "strobe", "cap"] as const;

function cloneLook(src: Look): Look {
  const out = { ...src };
  for (const k of LOOK_VECS) out[k] = [...src[k]] as Vec3;
  return out;
}

/** Day (0) to night (1), written into `out`. */
function mixLook(out: Look, t: number) {
  const a = LOOKS.light;
  const b = LOOKS.dark;
  for (let i = 0; i < LOOK_VECS.length; i++) {
    const k = LOOK_VECS[i];
    mix3(out[k], a[k], b[k], t);
  }
  for (let i = 0; i < LOOK_NUMS.length; i++) {
    const k = LOOK_NUMS[i];
    out[k] = lerp(a[k], b[k], t);
  }
}

/** Where the deck sits in the view (CSS px): top-left of the plinth and px per mm. */
type Fit = { ox: number; oy: number; s: number };

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** A fresh deck for each mode: the tile is already playing, the stage waits for you. */
function makeDeck(mode: "tile" | "stage", reduced: boolean): Deck {
  const deck = new Deck();
  deck.reduced = reduced;
  if (mode === "tile") {
    // the needle in the first band, a third of the way in
    deck.onRest = false;
    deck.arm.set(angleFor(BANDS[0].outer - 9));
    deck.recordAngle = 0.55;
    deck.platterAngle = 0.55;
    if (!reduced) {
      deck.motor = true;
      deck.platterVel = omegaFor(33);
      deck.recordVel = omegaFor(33);
    }
  } else {
    deck.recordAngle = -0.18;
    deck.platterAngle = 0.3;
  }
  return deck;
}

/** The part a target lights up (an index into HOVER_PARTS), or -1. */
function hoverIndex(target: Target): number {
  return target ? (HOVER_PARTS as readonly string[]).indexOf(target) : -1;
}

/** The one-time nudge toward the arm and the fader: a slow breath in, a hold, out. */
const teachEnvelope = (t: number) => (t < 0 ? 0 : clamp(t / 0.45) ** 2 * (1 - clamp((t - 1.5) / 1.1)));

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [deck] = useState(() => makeDeck(mode, reducedMotion));
  const rendererRef = useRef<DeckRenderer | null>(null);
  const contextRef = useRef<WebGL2RenderingContext | null>(null);
  const mountedRef = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<DeckAudio | null>(null);
  const hintId = useId();
  const fine = useFinePointer();

  const [motor, setMotorState] = useState(deck.motor);
  const [speed, setSpeedState] = useState<Speed>(33);
  const [cueUp, setCueUp] = useState(false);
  const [pressingId, setPressingId] = useState<PressingId>("black");
  const [announce, setAnnounce] = useState("");
  const [touched, setTouched] = useState(false);
  const [keyFocus, setKeyFocus] = useState(false);
  /** The second hint (the arm and the fader), shown once after the first start. */
  const [coach, setCoach] = useState<"idle" | "show" | "done">("idle");
  const [wide, setWide] = useState(true);

  const settings = useLatest({ reducedMotion, theme, pressingId, stage, active });

  // per-frame state that never re-renders; everything the frame touches is
  // allocated here once and updated in place
  const live = useRef({
    fit: { ox: 0, oy: 0, s: 1 } as Fit,
    fitDirty: true,
    night: theme === "dark" ? 1 : 0,
    acc: 0,
    look: cloneLook(theme === "dark" ? LOOKS.dark : LOOKS.light),
    /** The pressing as drawn (colours ease between pressings). */
    shown: (() => {
      const p = pressingById("black");
      return { ...p, vinyl: [...p.vinyl] as Vec3, sheen: [...p.sheen] as Vec3 } as Pressing;
    })(),
    cue: new Spring(0, { stiffness: 260, damping: 22 }),
    start: new Spring(0, { stiffness: 900, damping: 40 }),
    s33: new Spring(0, { stiffness: 900, damping: 40 }),
    s45: new Spring(0, { stiffness: 900, damping: 40 }),
    fader: new Spring(faderY(0), { stiffness: 520, damping: 42 }),
    springs: [] as Spring[],
    lock: 1,
    lastPitchDown: 0,
    led33: 1,
    led45: 0,
    power: deck.motor ? 1 : 0,
    lamp: stage ? 0 : 1,
    releaseAt: { start: 0, s33: 0, s45: 0 } as Record<ButtonKey, number>,
    clock: 0,
    keyScratch: 0,
    cueShown: false,
    hover: null as Target,
    /** Eased hover per part (HOVER_PARTS order). */
    hoverAmt: new Float32Array(HOVER_PARTS.length),
    /** When the nudge toward the arm and fader began (clock), or -1. */
    teachAt: -1,
    coach: "idle" as "idle" | "show" | "done",
    usedArm: false,
    usedPitch: false,
    started: false,
    wide: true,
    grab: null as
      | null
      | { kind: "record"; last: number }
      | { kind: "arm" }
      | { kind: "pitch"; offset: number }
      | { kind: "button"; which: ButtonKey },
    loading: false,
    disposed: false,
    /** Seconds of frames lately, and how many of them were slow ones. */
    perf: { time: 0, slow: 0 },
    /** Index into the render-scale steps (0 is full DPR). */
    renderStep: 0,
    pose: newPose(),
    frame: null as Frame | null,
    sound: { rate: 0, position: 0, down: false, stems: SILENT } as DeckSound,
  });
  /* -------------------------------------------------------------------- */
  /* layout                                                                */
  /* -------------------------------------------------------------------- */

  const layout = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (width < 2 || height < 2) return;
    let x0: number;
    let y0: number;
    let x1: number;
    let y1: number;
    if (settings.current.stage) {
      const narrow = width < 560;
      const surface = surfaceRef.current;
      let top = narrow ? 28 : 40;
      let bottom = height - 24;
      const root = surface?.getBoundingClientRect();
      const trays = controlsRef.current?.querySelectorAll<HTMLElement>("[data-lab-controls]");
      if (root && trays) {
        trays.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (!r.height) return;
          const mid = r.top + r.height / 2 - root.top;
          if (mid < height / 2) top = Math.max(top, r.bottom - root.top + (narrow ? 18 : 22));
          else bottom = Math.min(bottom, r.top - root.top - (narrow ? 22 : 30));
        });
      }
      const side = narrow ? 16 : 48;
      x0 = side;
      x1 = width - side;
      y0 = top;
      y1 = bottom;
    } else {
      // centred with room to breathe, and high enough that the tile's title
      // chip (bottom left, on hover) sits under the deck, not over it; the
      // ground shadow fills the space below
      x0 = width * 0.13;
      x1 = width * 0.87;
      y0 = height * 0.12;
      y1 = height * 0.76;
    }
    const s = Math.max(0.1, Math.min((x1 - x0) / PLINTH.w, (y1 - y0) / PLINTH.h));
    const fit = live.current.fit;
    fit.s = s;
    fit.ox = Math.round(((x0 + x1) / 2 - (PLINTH.w / 2) * s) * 2) / 2;
    fit.oy = Math.round(((y0 + y1) / 2 - (PLINTH.h / 2) * s) * 2) / 2;
    live.current.fitDirty = false;
  }, [settings]);

  /* -------------------------------------------------------------------- */
  /* drawing                                                               */
  /* -------------------------------------------------------------------- */

  /** Draw the deck as it is now (no stepping). False when there's nothing to draw on yet. */
  const paint = (): boolean => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const L = live.current;
    const s = settings.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || !canvas || width < 2 || height < 2) return false;
    if (L.fitDirty) layout();

    // the backing store, at the render scale this machine can keep up with
    const steps = dpr >= 1.5 ? RENDER_STEPS_HI : RENDER_STEPS_LO;
    const scale = s.stage ? steps[L.renderStep] : 1;
    const bw = Math.max(1, Math.round(width * dpr * scale));
    const bh = Math.max(1, Math.round(height * dpr * scale));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const k = bw / width;

    const reduced = s.reducedMotion;
    const fit = L.fit;
    mixLook(L.look, L.night);
    armPose(deck.arm.value, L.pose);
    const f = (L.frame ??= {
      width: 0,
      height: 0,
      originX: 0,
      originY: 0,
      scale: 1,
      detail: 1,
      look: L.look,
      pressing: L.shown,
      recordAngle: 0,
      platterAngle: 0,
      platterVel: 0,
      strobe: deck.strobe,
      lamp: 0,
      arm: L.pose,
      lift: 0,
      cue: 0,
      start: 0,
      power: 0,
      speedPress: [0, 0],
      speedLed: [0, 0],
      faderY: 0,
      lock: 0,
      hover: L.hoverAmt,
    });
    f.width = bw;
    f.height = bh;
    f.originX = fit.ox * k;
    f.originY = fit.oy * k;
    f.scale = fit.s * k;
    f.detail = s.stage ? 1 : 0.5;
    f.recordAngle = deck.recordAngle % TAU;
    f.platterAngle = deck.platterAngle % TAU;
    f.platterVel = reduced && !deck.motor ? 0 : deck.platterVel;
    f.lamp = L.lamp;
    f.lift = deck.lift.value;
    f.cue = L.cue.value;
    f.start = L.start.value;
    f.power = L.power;
    f.speedPress[0] = L.s33.value;
    f.speedPress[1] = L.s45.value;
    f.speedLed[0] = L.led33;
    f.speedLed[1] = L.led45;
    f.faderY = L.fader.value;
    f.lock = L.lock;
    renderer.draw(f);
    return true;
  };

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const wake = useFrame(active, (dt) => {
    const L = live.current;
    const s = settings.current;
    const { width, height } = sizeRef.current;
    if (!rendererRef.current || width < 2 || height < 2) return false;

    if (!s.stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    L.clock += dt;

    // a stage that runs slow for a sustained stretch (most of a second and
    // a half spent in frames under 45 fps) renders a step below the
    // screen's DPR; only the canvas's size changes, nothing is rebuilt
    if (s.stage && (deck.motor || L.grab) && L.renderStep < RENDER_STEPS_HI.length - 1) {
      const perf = L.perf;
      perf.time += dt;
      if (dt > 1 / 45) perf.slow += dt;
      if (perf.time >= 1.5) {
        if (perf.slow > perf.time * 0.7) L.renderStep += 1;
        perf.time = 0;
        perf.slow = 0;
      }
    }
    const reduced = s.reducedMotion;
    deck.reduced = reduced;

    // keys held on the record: a hand pulling it back or pushing it on
    if (L.keyScratch !== 0) {
      if (!deck.held) deck.grabRecord();
      const rate = L.keyScratch < 0 ? -1.4 : 1.8;
      deck.turnRecord(rate * omegaFor(33) * dt);
    }

    deck.step(dt);

    // what the deck did this frame
    const events = deck.events;
    for (let i = 0; s.stage && i < events.length; i++) {
      const event = events[i];
      if (event.type === "touchdown") {
        needleDrop(clamp(event.speed / 3), Math.abs(deck.recordVel) > 0.3);
        // the first time the needle drops after a start, point out the
        // arm and the fader (unless they've been found already)
        if (L.coach === "idle" && L.started) {
          if (L.usedArm && L.usedPitch) L.coach = "done";
          else {
            L.coach = "show";
            L.teachAt = reduced ? -1 : L.clock;
            setCoach("show");
          }
        }
      } else if (event.type === "liftoff") needleLift();
      else if (event.type === "rest") buttonClick("rest", 0.6);
      else if (event.type === "lock") lockClick();
      else if (event.type === "band") setAnnounce(`Needle on ${BANDS[event.band].id}: ${BANDS[event.band].name}`);
    }
    events.length = 0;

    // the cue lever follows the arm's lift; the tray follows the lever
    if (deck.cueUp !== L.cueShown) {
      L.cueShown = deck.cueUp;
      setCueUp(deck.cueUp);
    }
    L.cue.to(deck.cueUp ? 1 : 0);
    // buttons spring back once released
    for (let i = 0; i < BUTTONS.length; i++) {
      const key = BUTTONS[i];
      if (L.releaseAt[key] && L.clock >= L.releaseAt[key]) {
        L.releaseAt[key] = 0;
        L[key].to(0);
      }
    }
    L.fader.to(faderY(deck.pitch));
    if (!L.springs.length) L.springs.push(L.cue, L.start, L.s33, L.s45, L.fader);
    const springs = L.springs;
    let springsSettled = true;
    for (let i = 0; i < springs.length; i++) {
      const spring = springs[i];
      if (reduced) spring.set(spring.target);
      else spring.step(dt);
      if (!spring.settled) springsSettled = false;
    }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 14);
    L.led33 = lerp(L.led33, deck.speed === 33 ? 1 : 0, k);
    L.led45 = lerp(L.led45, deck.speed === 45 ? 1 : 0, k);
    L.power = lerp(L.power, deck.motor ? 1 : 0, k);
    L.lock = lerp(L.lock, deck.pitch === 0 ? 1 : 0, k);
    L.lamp = lerp(L.lamp, 1, reduced ? 1 : 1 - Math.exp(-dt * 2.5));

    // hover: the part under the pointer (or in the hand) lifts a little,
    // easing in and out over about 120 ms
    const g = L.grab;
    const focus = hoverIndex(
      g ? (g.kind === "button" ? (g.which === "start" ? "start" : g.which === "s33" ? "speed33" : "speed45") : g.kind) : L.hover,
    );
    const teachT = L.teachAt >= 0 ? L.clock - L.teachAt : -1;
    if (teachT > 2.6) L.teachAt = -1;
    const teach = teachEnvelope(teachT) * 0.9;
    let hoverSettled = true;
    for (let i = 0; i < L.hoverAmt.length; i++) {
      const part = HOVER_PARTS[i];
      let want = i === focus ? 1 : 0;
      if (part === "arm" || part === "pitch") want = Math.max(want, teach);
      const now = reduced ? want : damp(L.hoverAmt[i], want, 25, dt);
      L.hoverAmt[i] = Math.abs(now - want) < 1e-3 ? want : now;
      if (L.hoverAmt[i] !== want) hoverSettled = false;
    }

    const night = s.theme === "dark" ? 1 : 0;
    L.night = reduced ? night : damp(L.night, night, 7, dt);
    if (Math.abs(L.night - night) < 0.002) L.night = night;
    const pressing = pressingById(s.pressingId);
    const pk = reduced ? 1 : 1 - Math.exp(-dt * 9);
    const shown = L.shown;
    mix3(shown.vinyl, shown.vinyl, pressing.vinyl, pk);
    mix3(shown.sheen, shown.sheen, pressing.sheen, pk);
    shown.trans = lerp(shown.trans, pressing.trans, pk);

    // sound
    const audio = audioRef.current;
    if (audio) {
      const band = deck.currentBand;
      const sound = L.sound;
      sound.rate = deck.rate;
      sound.position = deck.position;
      sound.down = deck.needleDown;
      sound.stems = band >= 0 ? BANDS[band].stems : SILENT;
      audio.update(sound);
    }

    paint();

    // sleep once everything has settled (a spinning platter never has)
    const settled =
      !deck.busy &&
      springsSettled &&
      hoverSettled &&
      L.teachAt < 0 &&
      L.night === night &&
      Math.abs(shown.trans - pressing.trans) < 1e-3 &&
      Math.abs(shown.vinyl[0] - pressing.vinyl[0]) < 1e-4 &&
      Math.abs(L.power - (deck.motor ? 1 : 0)) < 1e-3 &&
      Math.abs(L.lock - (deck.pitch === 0 ? 1 : 0)) < 1e-3 &&
      L.lamp > 0.999 &&
      Math.abs(L.led33 - (deck.speed === 33 ? 1 : 0)) < 1e-3 &&
      L.keyScratch === 0 &&
      !L.releaseAt.start &&
      !L.releaseAt.s33 &&
      !L.releaseAt.s45;
    if (settled) return false;
  });

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    attributes: { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      contextRef.current = gl;
      let renderer: DeckRenderer | null = null;
      try {
        renderer = new DeckRenderer(gl);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      renderer.setLabel(drawLabel(pressingById(settings.current.pressingId).paper, stage ? 1024 : 512));
      renderer.setPrint(drawPrint(stage ? 3 : 1.25));
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: (size) => {
      const L = live.current;
      L.fitDirty = true;
      const isWide = size.width >= WIDE_HINT;
      if (isWide !== L.wide) {
        L.wide = isWide;
        setWide(isWide);
      }
      // the backing store was just cleared: repaint before the browser shows it
      paint();
      wake();
    },
  });

  // Hand the WebGL context back when the piece really goes away (the home
  // page and /lab/ run several pieces, and browsers keep only ~16 contexts,
  // dropping the oldest, maybe another piece's live tile, past that). It
  // runs a tick later because StrictMode's rehearsal unmount remounts at
  // once on the same canvas, and not in onContext's cleanup, which also
  // runs when the context is lost.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const gl = contextRef.current;
      if (!gl) return;
      window.setTimeout(() => {
        const canvas = gl.canvas;
        const connected = canvas instanceof HTMLCanvasElement && canvas.isConnected;
        if (mountedRef.current || connected || gl.isContextLost()) return;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        // and free the backing store now rather than at the next GC
        if (canvas instanceof HTMLCanvasElement) {
          canvas.width = 0;
          canvas.height = 0;
        }
        if (contextRef.current === gl) contextRef.current = null;
      }, 0);
    };
  }, []);

  // reprint once Geist has loaded, and whenever the pressing changes
  const reprint = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setLabel(drawLabel(pressingById(settings.current.pressingId).paper, stage ? 1024 : 512));
    renderer.setPrint(drawPrint(stage ? 3 : 1.25));
    wake();
  }, [settings, stage, wake]);

  useEffect(() => {
    let alive = true;
    void fontReady().then(() => {
      if (alive) reprint();
    });
    return () => {
      alive = false;
    };
  }, [reprint]);

  useEffect(() => {
    reprint();
  }, [pressingId, reprint]);

  // the trays decide how much room the deck has
  useEffect(() => {
    if (!stage) return;
    const root = controlsRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => {
      live.current.fitDirty = true;
      wake();
    });
    root.querySelectorAll("[data-lab-controls]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [stage, wake]);

  // wake on changes from React's side
  useEffect(() => {
    wake();
  }, [theme, reducedMotion, wake]);

  // sound runs only while the piece does; everything stops on unmount
  useEffect(() => {
    audioRef.current?.setRunning(active);
    if (active) wake();
  }, [active, wake]);

  useEffect(() => {
    const L = live.current;
    L.disposed = false;
    return () => {
      L.disposed = true;
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  // the second hint shows for four seconds
  useEffect(() => {
    if (coach !== "show") return;
    const timer = window.setTimeout(() => {
      live.current.coach = "done";
      setCoach("done");
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [coach]);

  /** Someone found the arm or the fader by themselves: no need to point them out. */
  const found = (part: "arm" | "pitch") => {
    const L = live.current;
    if (part === "arm") L.usedArm = true;
    else L.usedPitch = true;
    if (L.coach === "show" && L.usedArm && L.usedPitch) {
      L.coach = "done";
      setCoach("done");
    }
  };

  /* -------------------------------------------------------------------- */
  /* sound                                                                 */
  /* -------------------------------------------------------------------- */

  /** From a gesture: open the shared audio and render the loop (once). */
  const startAudio = useCallback(() => {
    if (!settings.current.stage) return;
    const kit = ensureAudio();
    const L = live.current;
    if (!kit || audioRef.current || L.loading) return;
    L.loading = true;
    renderLoop(kit.ctx.sampleRate)
      .then((loop) => {
        L.loading = false;
        if (L.disposed) return;
        const audio = new DeckAudio(kit, loop);
        audio.setRunning(settings.current.active);
        audioRef.current = audio;
        wake();
      })
      .catch((error) => {
        L.loading = false;
        console.error(error);
      });
  }, [settings, wake]);

  /* -------------------------------------------------------------------- */
  /* actions                                                               */
  /* -------------------------------------------------------------------- */

  const pressButton = (which: ButtonKey, hold = false) => {
    const L = live.current;
    L[which].to(1);
    L.releaseAt[which] = hold ? 0 : L.clock + 0.11;
  };

  const setMotor = useCallback(
    (on: boolean) => {
      deck.setMotor(on);
      setMotorState(on);
      setTouched(true);
      if (on) live.current.started = true;
      setAnnounce(on ? `Playing at ${deck.speed === 33 ? "33⅓" : "45"}` : "Stopped");
      wake();
    },
    [deck, wake],
  );

  const toggleMotor = useCallback(
    (fromKeys = true) => {
      startAudio();
      if (fromKeys) pressButton("start");
      buttonClick("start", -0.6);
      setMotor(!deck.motor);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, setMotor, startAudio],
  );

  const chooseSpeed = useCallback(
    (value: Speed, fromKeys = true) => {
      startAudio();
      if (fromKeys) pressButton(value === 33 ? "s33" : "s45");
      buttonClick("speed", 0.6);
      deck.setSpeed(value);
      setSpeedState(value);
      setTouched(true);
      setAnnounce(value === 33 ? "33⅓ revolutions a minute" : "45 revolutions a minute");
      wake();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, startAudio, wake],
  );

  const toggleCue = useCallback(() => {
    startAudio();
    buttonClick("cue", 0.55);
    const up = !deck.cueUp;
    deck.toggleCue();
    setCueUp(deck.cueUp);
    live.current.cueShown = deck.cueUp;
    setTouched(true);
    setAnnounce(up ? "Arm lifted" : deck.onRest || deck.arm.target <= angleFor(RECORD_R) ? "Arm lowered" : "Needle down");
    wake();
  }, [deck, startAudio, wake]);

  const announcePitch = useRef(0);
  const setPitch = useCallback(
    (value: number) => {
      deck.setPitch(value);
      setTouched(true);
      window.clearTimeout(announcePitch.current);
      announcePitch.current = window.setTimeout(() => {
        const pct = Math.round(deck.pitch * 1000) / 10;
        setAnnounce(pct === 0 ? "Pitch 0, locked" : `Pitch ${pct > 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`);
      }, 250);
      wake();
    },
    [deck, wake],
  );
  useEffect(() => () => window.clearTimeout(announcePitch.current), []);

  const choosePressing = (id: PressingId) => {
    setPressingId(id);
    setAnnounce(`${pressingById(id).label}`);
    wake();
  };

  /* -------------------------------------------------------------------- */
  /* pointer                                                               */
  /* -------------------------------------------------------------------- */

  const toDeck = (x: number, y: number) => {
    const f = live.current.fit;
    return { x: (x - f.ox) / f.s, y: (y - f.oy) / f.s };
  };

  const cursorFor = (target: Target, grabbing: boolean) => {
    if (grabbing) return "grabbing";
    if (target === "record" || target === "arm" || target === "pitch") return "grab";
    if (target) return "pointer";
    return "";
  };

  const setCursor = (value: string) => {
    const el = surfaceRef.current;
    if (el && el.style.cursor !== value) el.style.cursor = value;
  };

  usePointer(surfaceRef, {
    capture: true,
    onDown: (state) => {
      if (!stage) return;
      const L = live.current;
      const p = toDeck(state.x, state.y);
      const slop = state.type === "mouse" ? 0 : 10 / L.fit.s;
      const target = hitTest(p, deck.arm.value, slop);
      if (!target) return;
      startAudio();
      setTouched(true);
      if (target === "record") {
        deck.grabRecord();
        L.grab = { kind: "record", last: Math.atan2(p.y - CENTRE.y, p.x - CENTRE.x) };
        setCursor("grabbing");
      } else if (target === "arm") {
        deck.grabArm(Math.atan2(p.y - PIVOT.y, p.x - PIVOT.x));
        L.grab = { kind: "arm" };
        found("arm");
        setCursor("grabbing");
      } else if (target === "start") {
        pressButton("start", true);
        L.grab = { kind: "button", which: "start" };
        toggleMotor(false);
      } else if (target === "speed33" || target === "speed45") {
        const which = target === "speed33" ? "s33" : "s45";
        pressButton(which, true);
        L.grab = { kind: "button", which };
        chooseSpeed(target === "speed33" ? 33 : 45, false);
      } else if (target === "cue") {
        toggleCue();
      } else if (target === "pitch") {
        const capY = faderY(deck.pitch);
        const onCap = Math.abs(p.y - capY) < 7 + slop;
        const now = performance.now();
        found("pitch");
        if (onCap && now - L.lastPitchDown < 320) {
          // a double tap on the cap sends it home
          setPitch(0);
          L.lastPitchDown = 0;
        } else {
          L.lastPitchDown = onCap ? now : 0;
          L.grab = { kind: "pitch", offset: onCap ? p.y - capY : 0 };
          if (!onCap) setPitch(pitchAt(p.y));
        }
        setCursor("grabbing");
      }
      wake();
    },
    onMove: (state) => {
      if (!stage) return;
      const L = live.current;
      const p = toDeck(state.x, state.y);
      const grab = L.grab;
      if (grab?.kind === "record") {
        const a = Math.atan2(p.y - CENTRE.y, p.x - CENTRE.x);
        const r = Math.hypot(p.x - CENTRE.x, p.y - CENTRE.y);
        // near the spindle a small move is a big angle: damp it there
        const weight = clamp(r / (LABEL_R * 0.8));
        deck.turnRecord(wrap(a - grab.last) * weight);
        grab.last = a;
        wake();
      } else if (grab?.kind === "arm") {
        deck.dragArm(Math.atan2(p.y - PIVOT.y, p.x - PIVOT.x));
        wake();
      } else if (grab?.kind === "pitch") {
        setPitch(pitchAt(p.y - grab.offset));
      } else if (!state.pressed && state.type === "mouse") {
        const target = hitTest(p, deck.arm.value);
        if (target !== L.hover) {
          L.hover = target;
          setCursor(cursorFor(target, false));
          wake();
        }
      }
    },
    onUp: () => {
      const L = live.current;
      const grab = L.grab;
      L.grab = null;
      if (grab?.kind === "record") deck.releaseRecord();
      else if (grab?.kind === "arm") deck.releaseArm();
      else if (grab?.kind === "button") L.releaseAt[grab.which] = L.clock + 0.06;
      setCursor(cursorFor(L.hover, false));
      wake();
    },
    onLeave: () => {
      live.current.hover = null;
      setCursor("");
      wake();
    },
  });

  // Touch: the page scrolls from anywhere on the stage that isn't part of
  // the deck you can handle (touch-action: pan-y); a touch that lands on
  // the record, the arm, the fader or a button keeps the gesture.
  useEffect(() => {
    if (!stage) return;
    const el = surfaceRef.current;
    if (!el) return;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || event.touches.length > 1 || !event.cancelable) return;
      const rect = el.getBoundingClientRect();
      const f = live.current.fit;
      const p = { x: (touch.clientX - rect.left - f.ox) / f.s, y: (touch.clientY - rect.top - f.oy) / f.s };
      if (hitTest(p, deck.arm.value, 10 / f.s)) event.preventDefault();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => el.removeEventListener("touchstart", onTouchStart);
  }, [stage, deck]);

  /* -------------------------------------------------------------------- */
  /* keyboard                                                              */
  /* -------------------------------------------------------------------- */

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!stage || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
    const L = live.current;
    let handled = true;
    switch (event.key) {
      case " ":
      case "Enter":
      case "k":
      case "K":
        if (!event.repeat) toggleMotor();
        break;
      case "ArrowLeft":
      case "ArrowRight":
        startAudio();
        L.keyScratch = event.key === "ArrowLeft" ? -1 : 1;
        setTouched(true);
        break;
      case "ArrowUp":
      case "ArrowDown": {
        if (event.repeat) break;
        startAudio();
        found("arm");
        const band = deck.currentBand;
        const r = deck.radius;
        let next: number;
        if (deck.onRest) next = 0;
        else if (band >= 0) next = band + (event.key === "ArrowDown" ? 1 : -1);
        else {
          // between bands: the next one in (down) or out (up)
          const inward = BANDS.findIndex((b) => b.outer < r);
          next = event.key === "ArrowDown" ? (inward < 0 ? BANDS.length - 1 : inward) : (inward < 0 ? BANDS.length : inward) - 1;
        }
        next = clamp(next, 0, BANDS.length - 1);
        deck.cueBand(next);
        setTouched(true);
        setAnnounce(`Moving to ${BANDS[next].id}: ${BANDS[next].name}`);
        break;
      }
      case "c":
      case "C":
        if (!event.repeat) toggleCue();
        break;
      case "3":
        chooseSpeed(33);
        break;
      case "4":
        chooseSpeed(45);
        break;
      case "-":
      case "_":
        found("pitch");
        setPitch(deck.pitch - 0.005);
        break;
      case "=":
      case "+":
        found("pitch");
        setPitch(deck.pitch + 0.005);
        break;
      case "0":
        setPitch(0);
        break;
      case "r":
      case "R":
        if (!deck.onRest) {
          startAudio();
          deck.park();
          setAnnounce("Arm back on its rest");
        }
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    event.stopPropagation();
    wake();
  };

  /** Let go of a key-held record. A key isn't a flick: it doesn't send a stopped record spinning. */
  const releaseKeys = () => {
    const L = live.current;
    if (!L.keyScratch) return;
    L.keyScratch = 0;
    deck.releaseRecord({ flick: false });
    wake();
  };

  const onKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const L = live.current;
    const still = event.key === "ArrowLeft" ? L.keyScratch < 0 : L.keyScratch > 0;
    if (still) releaseKeys();
  };

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  if (supported === false) return <Fallback mode={mode} theme={theme} />;

  if (!stage) {
    return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />;
  }

  const hintText = keyFocus
    ? wide
      ? HINT_KEYS_LONG
      : HINT_KEYS_SHORT
    : coach !== "idle"
      ? HINT_COACH
      : fine
        ? "Press start, then drag the record to scratch"
        : "Tap start, then drag the record to scratch";
  const hintShown = keyFocus || coach === "show" || !touched;

  return (
    <div className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        tabIndex={0}
        role="application"
        aria-roledescription="turntable"
        aria-label="Turntable"
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={(event) => {
          if (event.target === event.currentTarget) setKeyFocus(event.currentTarget.matches(":focus-visible"));
        }}
        onBlur={() => {
          setKeyFocus(false);
          releaseKeys();
        }}
        className="group/deck absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_70%,transparent)] opacity-0 transition-opacity duration-200 group-focus-visible/deck:opacity-100"
        />
      </div>

      <p id={hintId} className="sr-only">
        Space starts and stops the platter. Hold the left or right arrow to pull the record back or push it on. Up and
        down move the needle between the four bands. C lifts or lowers the arm, 3 and 4 choose 33 or 45, minus and plus
        move the pitch fader by half a percent and 0 sends it back to zero, R puts the arm back on its rest.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <div ref={controlsRef}>
        <StageControls placement="bottom">
          <TrayRow>
            <Tray label="Pressing and sound">
              <Swatches label="Pressing" options={SWATCHES} value={pressingId} onChange={choosePressing} />
              <TrayDivider />
              <MuteButton />
            </Tray>
            <Tray label="Deck">
              <TrayButton
                icon={motor ? <StopIcon size={14} /> : <Play size={14} />}
                onClick={() => toggleMotor()}
                className="w-[78px] px-2.5"
              >
                {motor ? "Stop" : "Start"}
              </TrayButton>
              <TrayDivider />
              <Segmented label="Speed" options={SPEEDS} value={speed} onChange={(v) => chooseSpeed(v)} />
              <TrayDivider />
              <TrayButton icon={<CueIcon up={!cueUp} size={14} />} onClick={toggleCue} className="w-[84px] px-2.5">
                {cueUp ? "Lower" : "Lift"}
              </TrayButton>
            </Tray>
          </TrayRow>
          <StageHint
            className={hintShown ? "transition-opacity duration-300" : "opacity-0 transition-opacity duration-700"}
          >
            {hintText}
          </StageHint>
        </StageControls>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the deck for browsers without WebGL2. */
function Fallback({ mode, theme }: { mode: "tile" | "stage"; theme: PieceTheme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, mode === "stage" ? 2 : 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dark = theme === "dark";
      const s = Math.min((rect.width * 0.76) / PLINTH.w, (rect.height * 0.66) / PLINTH.h);
      const ox = rect.width / 2 - (PLINTH.w / 2) * s;
      const oy = rect.height / 2 - (PLINTH.h / 2) * s;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      ctx.shadowColor = "rgb(0 0 0 / 0.18)";
      ctx.shadowBlur = 24 * s * dpr;
      ctx.shadowOffsetY = 8 * s * dpr;
      ctx.fillStyle = dark ? "#2c2c2f" : "#e4e1dc";
      ctx.beginPath();
      ctx.roundRect(0, 0, PLINTH.w, PLINTH.h, PLINTH.r);
      ctx.fill();
      ctx.shadowColor = "transparent";
      const circle = (r: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(CENTRE.x, CENTRE.y, r, 0, TAU);
        ctx.fill();
      };
      circle(PLATTER_R, dark ? "#8a8c90" : "#c9cbce");
      circle(RECORD_R, "#141414");
      circle(LABEL_R, "#ece6d8");
      circle(3.6, "#9a9a9a");
      const pose = armPose(angleFor(BANDS[0].outer - 9));
      ctx.strokeStyle = dark ? "#b9bbbf" : "#a9abaf";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(PIVOT.x, PIVOT.y);
      ctx.lineTo(pose.k.x, pose.k.y);
      ctx.lineTo(pose.s.x, pose.s.y);
      ctx.stroke();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(PIVOT.x, PIVOT.y, 18, 0, TAU);
      ctx.fill();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [mode, theme]);
  return (
    <canvas
      ref={ref}
      role={mode === "stage" ? "img" : undefined}
      aria-label={mode === "stage" ? "A turntable seen from above" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 block size-full"
    />
  );
}
