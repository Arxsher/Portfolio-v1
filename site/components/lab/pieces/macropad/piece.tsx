"use client";

// Macropad: nine sculpted keys and a knob, in believable 3D (WebGL2).
//
// Look
// - Materials: a CNC-milled aluminium case, bead-blasted and anodised
//   (silver by day, graphite by night) with diamond-cut chamfers that catch
//   the light as bright lines round the top and the pocket. The caps are
//   matte PBT with a spherical dish, rounded top edges and slightly bowed
//   walls; legends are dye-sublimated (Geist numerals) so they follow the
//   dish. The knob is knurled aluminium with a machined, concentric top
//   and a small lit indicator.
// - Light: a product studio (softbox overhead, a thin strip on the left, a
//   soft key from the upper left); reflections come from that room, so the
//   metal reads as metal. Occlusion is analytic: deep shadow on the plate
//   between the caps, walls darkening towards it, soft contact shadows on
//   the table and the top face.
// - Glow: an LED under every switch pools light on the plate, climbs the
//   caps' lower walls and the pocket walls, shows in the pocket's polished
//   edge and blooms softly. Restraint: one hue at a time, set by the knob.
// - Motion: caps ride a spring between two hard stops (land, bounce a hair,
//   rest); a press sends a ring of light across the plate that flares each
//   neighbour as it reaches it; a new hue travels out from the knob. The
//   knob is magnetic, notch to notch. The camera tilts a few degrees with
//   the pointer.
// - Sound (stage, after a gesture, through the lab mute): a thock per press
//   at the moment the cap bottoms out, a lighter clack on the way up, a tick
//   per notch of the knob. Every key has its own voice.
// - Tile: the keys play a slow little figure by themselves, ripples and all,
//   the knob moves on every few notes; hovering plays the key under the
//   mouse. No sound, 30 fps, low DPR.
// - Reduced motion: a composed still (the centre key lit); presses and the
//   knob still respond, but jump instead of travel, and light fades in place.
// - Battery: the stage draws only while something moves; the idle LEDs
//   breathe while someone is around (at 24 fps) and settle to a steady glow
//   after a quiet spell, when the loop sleeps. The frame loop allocates
//   nothing, and the WebGL context is handed back on unmount.
//
// Files: scene.ts (layout + meshes), shaders.ts + renderer.ts (WebGL2),
// engine.ts (switches, glow, knob, self-play), view.ts (camera, fit,
// picking), looks.ts (materials, colourways), atlas.ts (legends), sound.ts.

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ensureAudio } from "../../audio";
import { damp, useFinePointer, useFrame, useLatest, useWebGL2 } from "../../hooks";
import { ChevronLeft, ChevronRightSmall } from "../../lab-icons";
import type { PieceProps } from "../../types";
import { IconButton, MuteButton, StageControls, StageHint, Swatches, Tray, TrayDivider, TrayRow } from "../../ui";
import { drawAtlas, fontReady } from "./atlas";
import { AutoPlay, BOTTOM_OUT, DETENT_ANGLE, glowColor, HUE_STEP, HUE_ZERO, hueName, Pad, TOP_OUT, wrapHue, type FillTarget } from "./engine";
import { blankLook, capsFor, COLOURWAYS, copyCaps, DAY, lookInto, mixCapsInto, NIGHT, swatchFor, THEME_CAPS, type ColourwayId } from "./looks";
import { cssColor, insideConvex, type Vec3 } from "./math";
import { PadRenderer, type Frame } from "./renderer";
import { CAP, CASE, KEYS, KNOB } from "./scene";
import { MAX_RIPPLES } from "./shaders";
import { clack, detent as tick, thock } from "./sound";
import { box, ringPath, View, type Rect } from "./view";

const SWATCHES = COLOURWAYS.map((way) => ({ value: way.id, label: way.label, swatch: swatchFor(way) }));

const panFor = (index: number) => (KEYS[index].col - 1) * 0.38;

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** "Digit3" / "Numpad3" / "3" → key index 2. */
function digitIndex(event: KeyboardEvent | ReactKeyboardEvent): number {
  const code = /^(?:Digit|Numpad)([1-9])$/.exec(event.code ?? "");
  if (code) return Number(code[1]) - 1;
  if (/^[1-9]$/.test(event.key)) return Number(event.key) - 1;
  return -1;
}

/** The hue the knob shows, 0–345 in 15° notches. */
const shownHue = (detent: number) => wrapHue(HUE_ZERO + detent * HUE_STEP);

/** Seconds of quiet before the idle LEDs stop breathing and the stage sleeps. */
const BREATHE_FOR = 8;

/** A touch thock waits this long at least, so a swipe that becomes a scroll can cancel it unheard. */
const TOUCH_THOCK = 0.075;

/** The focus ring round a cap or the knob: its gap from the outline (CSS px). */
const RING_GAP = 4;
/** `live.ring` for the knob (0–8 are the keys). */
const KNOB_RING = 9;

type Drag =
  | { kind: "keys"; id: number; key: number; over: number; touch: boolean }
  | { kind: "knob"; id: number; raw: number; last: number; startX: number; startY: number; at: number; travelled: number };

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [pad] = useState(() => {
    const p = new Pad();
    if (reducedMotion) {
      p.accent[4] = 0.55;
      [1, 3, 5, 7].forEach((i) => (p.accent[i] = 0.1));
    }
    return p;
  });
  const [auto] = useState(() => new AutoPlay());
  const [view] = useState(() => new View());
  const rendererRef = useRef<PadRenderer | null>(null);
  const atlasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const knobRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const fine = useFinePointer();

  const [chosen, setChosen] = useState<ColourwayId | null>(null);
  const caps: ColourwayId = chosen ?? THEME_CAPS[theme];
  const [detentShown, setDetentShown] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [touched, setTouched] = useState(false);
  /** The key that holds the group's single tab stop (arrows move it). */
  const [rover, setRover] = useState(4);

  const settings = useLatest({ reducedMotion, theme, caps, stage });

  // per-frame state that never re-renders (the frame loop allocates nothing:
  // everything it writes lives here)
  const [live] = useState(() => ({
    current: (() => {
      const caps = copyCaps(capsFor(chosen ?? THEME_CAPS[theme]));
      const frame: Frame = {
        viewProj: view.viewProj,
        camPos: view.camPos,
        fit: view.fit,
        look: theme === "dark" ? NIGHT : DAY,
        caps,
        travel: new Float32Array(9),
        glow: new Float32Array(27),
        ripples: new Float32Array(MAX_RIPPLES * 4),
        rippleColors: new Float32Array(MAX_RIPPLES * 3),
        rippleCount: 0,
        knobAngle: 0,
        knobLight: [0, 0, 0] as Vec3,
        detail: stage ? 1 : 0.35,
        bloom: true,
      };
      const fill: FillTarget = {
        travel: frame.travel,
        glow: frame.glow,
        ripples: frame.ripples,
        rippleColors: frame.rippleColors,
        knobLight: frame.knobLight,
        breathe: 0,
        reduced: reducedMotion,
        gain: 1,
        rippleCount: 0,
      };
      return {
        yaw: 0,
        yawV: 0,
        pitch: 0,
        pitchV: 0,
        aimYaw: 0,
        aimPitch: 0,
        night: theme === "dark" ? 1 : 0,
        caps,
        capsId: chosen ?? THEME_CAPS[theme],
        capsGap: 0,
        /** Scratch looks: the theme cross-fade, and the tile's firmer variant. */
        fade: blankLook(),
        tileLook: blankLook(),
        fitDirty: true,
        acc: 0,
        /** Last frame only breathed: the next can wait (24 fps). */
        calm: false,
        /** Something asked for a full-rate frame (input, resize). */
        kick: true,
        /** performance.now() of the last input (wall clock: slow frames don't stretch it); breathing 0…1. */
        lastInput: performance.now(),
        /** When the breathing was last stepped (0: not yet, or the loop slept). */
        breathedAt: 0,
        /** performance.now() of the last pointer press on the pad (to tell its click apart). */
        pressedAt: -Infinity,
        breathe: stage && !reducedMotion ? 1 : 0,
        welcomed: false,
        hover: -1,
        // where the overlays were last placed
        placedVersion: -1,
        placedYaw: NaN,
        placedPitch: NaN,
        placedTravel: new Float32Array(9).fill(NaN),
        placedBox: box(),
        /** The key whose focus ring shows (-1: none). */
        ring: -1,
        ringTravel: NaN,
        frame,
        fill,
      };
    })(),
  }));

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const layout = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (width < 2 || height < 2) return;
    let rect: Rect;
    let maxHeight = Infinity;
    if (settings.current.stage) {
      const root = rootRef.current;
      let bottom = height - 16;
      const controls = controlsRef.current?.querySelector<HTMLElement>("[data-lab-controls]");
      if (root && controls) {
        const top = controls.getBoundingClientRect().top - root.getBoundingClientRect().top;
        if (top > 0) bottom = Math.min(bottom, top);
      }
      const narrow = width < 520;
      const side = narrow ? 18 : 40;
      rect = { x0: side, y0: narrow ? 24 : 44, x1: width - side, y1: bottom - (narrow ? 18 : 30) };
      maxHeight = 520;
    } else {
      rect = { x0: width * 0.15, y0: height * 0.13, x1: width * 0.85, y1: height * 0.89 };
    }
    view.resize(width, height, rect, maxHeight);
    live.current.fitDirty = false;
  }, [view, settings]);

  const ringRef = useRef<SVGGElement>(null);
  const ringLineRef = useRef<SVGPathElement>(null);
  const ringHaloRef = useRef<SVGPathElement>(null);

  /**
   * Draws the focus ring round the cap (or the knob, KNOB_RING) as it sits
   * in perspective, or hides it.
   */
  const placeRing = () => {
    const L = live.current;
    const g = ringRef.current;
    if (!g) return;
    if (L.ring < 0) {
      g.style.opacity = "0";
      return;
    }
    const knob = L.ring === KNOB_RING;
    const outline = knob ? view.knobOutline() : view.capOutline(L.ring, pad.switches[L.ring].x);
    ringLineRef.current?.setAttribute("d", ringPath(outline, RING_GAP));
    ringHaloRef.current?.setAttribute("d", ringPath(outline, RING_GAP + 2.5));
    L.ringTravel = knob ? 0 : pad.switches[L.ring].x;
    g.style.opacity = "1";
  };

  /**
   * Moves the focusable stand-ins over the caps and the knob. Only what
   * changed since last time is touched (camera, fit, a cap's travel).
   */
  const placeOverlays = () => {
    if (!settings.current.stage) return;
    const L = live.current;
    const camera =
      L.placedVersion !== view.version || Math.abs(L.placedYaw - L.yaw) > 2e-5 || Math.abs(L.placedPitch - L.pitch) > 2e-5;
    if (camera) {
      L.placedVersion = view.version;
      L.placedYaw = L.yaw;
      L.placedPitch = L.pitch;
    }
    const b = L.placedBox;
    for (let i = 0; i < 9; i++) {
      const x = pad.switches[i].x;
      if (!camera && L.placedTravel[i] === x) continue;
      L.placedTravel[i] = x;
      const el = keyRefs.current[i];
      if (!el) continue;
      view.capBox(i, x, b);
      el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`;
      el.style.width = `${b.w.toFixed(1)}px`;
      el.style.height = `${b.h.toFixed(1)}px`;
    }
    const el = knobRef.current;
    if (camera && el) {
      view.knobBox(b);
      el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`;
      el.style.width = `${b.w.toFixed(1)}px`;
      el.style.height = `${b.h.toFixed(1)}px`;
    }
    if (L.ring >= 0 && (camera || (L.ring !== KNOB_RING && L.ringTravel !== pad.switches[L.ring].x))) placeRing();
  };

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const L = live.current;
    const s = settings.current;
    const { width, height } = sizeRef.current;
    // nothing to draw yet: sleep until the context or a resize wakes the loop
    if (!renderer || width < 2 || height < 2) return false;

    if (!s.stage) {
      // tiles run at half rate
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    } else if (L.calm && !L.kick) {
      // only the LEDs breathing: skip the whole frame until 1/24 s has passed
      L.acc += dt;
      if (L.acc < 1 / 24 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    } else L.acc = 0;
    L.kick = false;
    if (L.fitDirty) layout();

    const reduced = s.reducedMotion;
    if (!s.stage) {
      if (!reduced) auto.tick(pad, reduced);
      else auto.settle(pad, reduced);
    } else if (!L.welcomed && !reduced && pad.time > 0.45) {
      L.welcomed = true;
      pad.pulse(4, 0.95, reduced);
    }
    let busy = pad.step(dt, reduced);
    if (!s.stage && !reduced) busy = true;

    // parallax
    if (reduced) {
      L.yaw = L.pitch = L.yawV = L.pitchV = 0;
    } else {
      const k = 48;
      const c = 13;
      L.yawV += (-k * (L.yaw - L.aimYaw) - c * L.yawV) * dt;
      L.yaw += L.yawV * dt;
      L.pitchV += (-k * (L.pitch - L.aimPitch) - c * L.pitchV) * dt;
      L.pitch += L.pitchV * dt;
      if (Math.abs(L.yaw - L.aimYaw) + Math.abs(L.pitch - L.aimPitch) > 1e-4 || Math.abs(L.yawV) + Math.abs(L.pitchV) > 1e-3) busy = true;
    }
    view.update(L.yaw, L.pitch);

    // theme and keycaps cross-fade (in place)
    const night = s.theme === "dark" ? 1 : 0;
    L.night = reduced ? night : damp(L.night, night, 7, dt);
    if (Math.abs(L.night - night) < 0.002) L.night = night;
    else busy = true;
    if (L.capsGap > 0 || L.capsId !== s.caps) {
      L.capsId = s.caps;
      L.capsGap = mixCapsInto(L.caps, capsFor(s.caps), reduced ? 1 : 1 - Math.exp(-dt * 10));
      if (L.capsGap > 0) busy = true;
    }

    // the idle LEDs breathe while someone is about, then settle
    const now = performance.now();
    if (s.stage && !reduced) {
      // timed on the wall clock, so a slow device still settles after ~8 s
      const real = L.breathedAt ? Math.min(0.5, (now - L.breathedAt) / 1000) : dt;
      const target = now - L.lastInput < BREATHE_FOR * 1000 ? 1 : 0;
      L.breathe = damp(L.breathe, target, target ? 2 : 1.2, real);
      if (Math.abs(L.breathe - target) < 0.004) L.breathe = target;
    } else L.breathe = 0;
    L.breathedAt = now;
    const breathing = L.breathe > 0;

    const f = L.frame;
    if (s.stage) f.look = L.night === 0 ? DAY : L.night === 1 ? NIGHT : lookInto(L.night, L.fade);
    else {
      // tiles are small: a touch more glow (more still by day, where the
      // studio light washes it out) and a firmer footprint keep them legible
      const t = lookInto(L.night, L.tileLook);
      t.glowGain *= 1.25 + 0.3 * (1 - L.night);
      t.shadow[0] *= 1.25;
      t.shadow[1] *= 1.2;
      f.look = t;
    }
    f.knobAngle = -Math.PI / 2 + pad.angle;
    const fill = L.fill;
    fill.breathe = L.breathe;
    fill.reduced = reduced;
    pad.fill(fill);
    f.rippleCount = fill.rippleCount;
    renderer.draw(f);
    placeOverlays();
    // nothing but the breathing: the next frames can be throttled
    L.calm = !busy;
    if (!busy && !breathing) {
      L.breathedAt = 0;
      return false;
    }
  });

  /** Redraw at full rate on the next frame (and wake the loop if it slept). */
  const redraw = useCallback(() => {
    live.current.kick = true;
    wake();
  }, [wake]);

  /** Someone did something: full rate, and the LEDs breathe again. */
  const nudge = useCallback(() => {
    live.current.lastInput = performance.now();
    redraw();
  }, [redraw]);

  // a big stage at 2× is ~2.7 MP with MSAA and a bloom chain: 1.75× is
  // indistinguishable there and a quarter cheaper
  const [maxDpr] = useState(() => (stage ? (window.innerWidth * (window.devicePixelRatio || 1) > 2000 ? 1.75 : 2) : 1.5));
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const mountedRef = useRef(false);

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr,
    attributes: { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: PadRenderer | null = null;
      try {
        renderer = new PadRenderer(gl);
      } catch (error) {
        console.error(error);
        return;
      }
      if (!atlasRef.current) atlasRef.current = drawAtlas(undefined, stage ? 500 : 640);
      renderer.setAtlas(atlasRef.current);
      rendererRef.current = renderer;
      glRef.current = gl;
      // the overlays and the ring belong to the new context's first frame
      live.current.placedVersion = -1;
      redraw();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      live.current.fitDirty = true;
      redraw();
    },
  });

  // Hand the WebGL context back when the piece really goes away: home and
  // /lab/ run several pieces at once and browsers keep only ~16 contexts,
  // force-losing the oldest (a live tile) past that. This runs a tick later
  // because StrictMode's rehearsal unmount remounts at once and keeps using
  // the same context; onContext's own cleanup also runs on a context loss,
  // so it can't do this.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const gl = glRef.current;
      if (!gl) return;
      window.setTimeout(() => {
        if (mountedRef.current || gl.isContextLost()) return;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        // free the backing store now rather than at the next GC
        const canvas = gl.canvas;
        if (canvas instanceof HTMLCanvasElement) {
          canvas.width = 0;
          canvas.height = 0;
        }
        if (glRef.current === gl) glRef.current = null;
      }, 0);
    };
  }, []);

  // redraw the legends once Geist has loaded
  useEffect(() => {
    let alive = true;
    void fontReady().then(() => {
      if (!alive) return;
      atlasRef.current = drawAtlas(atlasRef.current ?? undefined, stage ? 500 : 640);
      rendererRef.current?.setAtlas(atlasRef.current);
      redraw();
    });
    return () => {
      alive = false;
    };
  }, [redraw, stage]);

  // the trays' height decides how much room the pad has
  useEffect(() => {
    if (!stage) return;
    const controls = controlsRef.current?.querySelector<HTMLElement>("[data-lab-controls]");
    if (!controls) return;
    const observer = new ResizeObserver(() => {
      live.current.fitDirty = true;
      redraw();
    });
    observer.observe(controls);
    return () => observer.disconnect();
  }, [stage, redraw]);

  // wake on any change from React's side
  useEffect(() => {
    if (reducedMotion) {
      pad.accent[4] = 0.55;
      [1, 3, 5, 7].forEach((i) => (pad.accent[i] = 0.1));
    } else pad.accent.fill(0);
    nudge();
  }, [theme, caps, reducedMotion, pad, nudge]);

  /* -------------------------------------------------------------------- */
  /* playing                                                               */
  /* -------------------------------------------------------------------- */

  /** Each key's pending thock, so a touch that turns into a scroll can call it off. */
  const thocks = useRef<Array<(() => void) | null>>([]);

  const pressKey = useCallback(
    (index: number, touch = false) => {
      const reduced = settings.current.reducedMotion;
      if (!pad.press(index, reduced)) return false;
      if (settings.current.stage) {
        const delay = reduced ? 0.004 : BOTTOM_OUT;
        thocks.current[index] = thock(index, panFor(index), touch ? Math.max(delay, TOUCH_THOCK) : delay);
      }
      setTouched(true);
      nudge();
      return true;
    },
    [pad, settings, nudge],
  );

  /** `silent`: the browser took the touch over (a scroll), so no clack and no thock. */
  const releaseKey = useCallback(
    (index: number, silent = false) => {
      if (!pad.isDown(index)) return;
      const reduced = settings.current.reducedMotion;
      const s = pad.switches[index];
      // a short tap waits for the bottom before it comes back up
      const wait = s.x < 0.92 && !reduced ? Math.max(0, BOTTOM_OUT * (1 - s.x)) : 0;
      pad.release(index, reduced);
      if (silent) thocks.current[index]?.();
      else if (settings.current.stage) clack(index, panFor(index), (reduced ? 0.01 : TOP_OUT) + wait);
      thocks.current[index] = null;
      nudge();
    },
    [pad, settings, nudge],
  );

  const announceHue = useRef(0);
  const turnBy = useCallback(
    (delta: number, silent = false) => {
      if (!delta) return;
      const reduced = settings.current.reducedMotion;
      pad.turn(delta, reduced);
      if (settings.current.stage && !silent) {
        const steps = Math.min(4, Math.abs(delta));
        for (let i = 0; i < steps; i++) tick(Math.sign(delta), i * 0.034);
      }
      setDetentShown(pad.detent);
      setTouched(true);
      window.clearTimeout(announceHue.current);
      announceHue.current = window.setTimeout(() => setAnnounce(`Glow: ${hueName(pad.hue)}`), 350);
      nudge();
    },
    [pad, settings, nudge],
  );

  useEffect(() => () => window.clearTimeout(announceHue.current), []);

  /** Which cap or the knob is at (x, y) in CSS px. */
  const pick = (x: number, y: number): number | "knob" | null => {
    if (insideConvex(view.knobHull(), x, y)) return "knob";
    for (const k of KEYS) if (insideConvex(view.capTop(k.index, pad.switches[k.index].x), x, y)) return k.index;
    for (const k of KEYS) if (insideConvex(view.capHull(k.index, pad.switches[k.index].x), x, y)) return k.index;
    return null;
  };

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect ? [event.clientX - rect.left, event.clientY - rect.top] : [0, 0];
  };

  /** One entry per pointer: several fingers can hold keys (chords), one turns the knob. */
  const drags = useRef(new Map<number, Drag>());

  const knobAngleAt = (x: number, y: number) => {
    const [cx, cy] = view.knobCentre();
    return { angle: Math.atan2(y - cy, x - cx), r: Math.hypot(x - cx, y - cy) };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!stage || event.button > 0 || drags.current.has(event.pointerId)) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    ensureAudio();
    const [x, y] = local(event);
    const hit = pick(x, y);
    if (hit === null) return;
    event.preventDefault();
    live.current.pressedAt = performance.now();
    try {
      rootRef.current?.setPointerCapture(event.pointerId);
    } catch {}
    if (hit === "knob") {
      if ([...drags.current.values()].some((d) => d.kind === "knob")) return;
      const { angle } = knobAngleAt(x, y);
      pad.dragging = true;
      drags.current.set(event.pointerId, {
        kind: "knob",
        id: event.pointerId,
        raw: pad.detent * DETENT_ANGLE,
        last: angle,
        startX: x,
        startY: y,
        at: performance.now(),
        travelled: 0,
      });
      rootRef.current?.setAttribute("data-grabbing", "");
      nudge();
      return;
    }
    // a key this pointer pressed is its own to release (another finger may hold the rest)
    const touch = event.pointerType === "touch";
    drags.current.set(event.pointerId, { kind: "keys", id: event.pointerId, key: pressKey(hit, touch) ? hit : -1, over: hit, touch });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const [x, y] = local(event);
    const L = live.current;
    const { width, height } = sizeRef.current;
    if (event.pointerType === "mouse" && width && height && !settings.current.reducedMotion) {
      L.aimYaw = ((x / width) * 2 - 1) * (stage ? 0.075 : 0.06);
      L.aimPitch = ((y / height) * 2 - 1) * (stage ? -0.045 : -0.035);
      nudge();
    }
    const current = drags.current.get(event.pointerId);
    if (!stage) {
      // tiles: the key under the mouse plays
      if (event.pointerType !== "mouse") return;
      const hit = pick(x, y);
      const key = typeof hit === "number" ? hit : -1;
      if (key !== L.hover) {
        L.hover = key;
        if (key >= 0) auto.poke(pad, key, settings.current.reducedMotion);
        nudge();
      }
      return;
    }
    if (!current) return;
    if (current.kind === "keys") {
      // slide across the caps to play them in turn
      const hit = pick(x, y);
      const key = typeof hit === "number" ? hit : -1;
      if (key === current.over) return;
      current.over = key;
      if (current.key >= 0) releaseKey(current.key);
      current.key = key >= 0 && pressKey(key, current.touch) ? key : -1;
      return;
    }
    const { angle, r } = knobAngleAt(x, y);
    let delta = angle - current.last;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    current.last = angle;
    // near the axis the angle is unreliable: use the sideways motion there
    const weight = Math.min(1, Math.max(0, (r - 6) / 16));
    current.raw += delta * weight + (1 - weight) * (event.movementX || 0) * 0.02;
    current.travelled += Math.abs(delta) * Math.max(r, 8);
    const moved = pad.dragTo(current.raw, settings.current.reducedMotion);
    if (moved) {
      for (let i = 0; i < Math.min(3, Math.abs(moved)); i++) tick(Math.sign(moved), i * 0.03);
      setDetentShown(pad.detent);
      setTouched(true);
      window.clearTimeout(announceHue.current);
      announceHue.current = window.setTimeout(() => setAnnounce(`Glow: ${hueName(pad.hue)}`), 350);
    }
    nudge();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drags.current.get(event.pointerId);
    if (!current) return;
    drags.current.delete(event.pointerId);
    if (current.kind === "keys") {
      // a cancelled touch is the page scrolling: let go without a sound
      if (current.key >= 0) releaseKey(current.key, event.type === "pointercancel" && current.touch);
      return;
    }
    rootRef.current?.removeAttribute("data-grabbing");
    pad.endDrag();
    // a tap on the knob turns it one notch
    if (event.type === "pointerup" && current.travelled < 5 && performance.now() - current.at < 350) turnBy(1);
    nudge();
  };

  const onPointerLeave = () => {
    const L = live.current;
    L.aimYaw = 0;
    L.aimPitch = 0;
    L.hover = -1;
    nudge();
  };

  // the wheel turns the knob; the listener sits on the knob alone, so the
  // page scrolls freely everywhere else
  useEffect(() => {
    if (!stage) return;
    const knob = knobRef.current;
    if (!knob) return;
    let acc = 0;
    let last = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      ensureAudio();
      const now = performance.now();
      if (now - last > 220) acc = 0;
      last = now;
      const unit = event.deltaMode === 1 ? 1 : event.deltaMode === 2 ? 3 : 1 / 40;
      acc += (Math.abs(event.deltaY) > Math.abs(event.deltaX) ? -event.deltaY : event.deltaX) * unit;
      const steps = acc > 0 ? Math.floor(acc) : Math.ceil(acc);
      if (steps) {
        acc -= steps;
        turnBy(Math.max(-3, Math.min(3, steps)));
      }
    };
    knob.addEventListener("wheel", onWheel, { passive: false });
    return () => knob.removeEventListener("wheel", onWheel);
  }, [stage, turnBy]);

  // 1–9 anywhere on the page press the keys (not while typing)
  useEffect(() => {
    if (!stage || !active) return;
    const down = new Set<number>();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector("[role='dialog'][data-open]")) return;
      const index = digitIndex(event);
      if (index < 0) return;
      event.preventDefault();
      if (event.repeat || down.has(index)) return;
      ensureAudio();
      down.add(index);
      // focus on a key follows the digit played, so the ring is on the key going down
      const focused = keyRefs.current.indexOf(document.activeElement as HTMLButtonElement);
      if (focused >= 0 && focused !== index) {
        setRover(index);
        keyRefs.current[index]?.focus();
      }
      pressKey(index);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const index = digitIndex(event);
      if (index < 0 || !down.has(index)) return;
      down.delete(index);
      releaseKey(index);
    };
    const onBlur = () => {
      down.forEach((index) => releaseKey(index));
      down.clear();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      onBlur();
    };
  }, [stage, active, pressKey, releaseKey]);

  // let go of everything when the piece stops (offscreen, hidden tab)
  useEffect(() => {
    if (active) return;
    KEYS.forEach((k) => {
      pad.release(k.index, true);
      thocks.current[k.index] = null;
    });
    drags.current.clear();
    rootRef.current?.removeAttribute("data-grabbing");
    pad.endDrag();
  }, [active, pad]);

  /** The ring follows keyboard focus only (a click never shows it). */
  const showRing = (index: number) => {
    const L = live.current;
    if (L.ring === index) return;
    L.ring = index;
    placeRing();
  };
  const hideRing = (index: number) => {
    const L = live.current;
    if (L.ring !== index) return;
    L.ring = -1;
    placeRing();
  };

  const onKeyCapKey = (index: number) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[event.key];
    if (event.type === "keydown") showRing(index);
    if (move) {
      if (event.type !== "keydown") return;
      event.preventDefault();
      event.stopPropagation();
      const col = Math.min(2, Math.max(0, (index % 3) + move[0]));
      const row = Math.min(2, Math.max(0, Math.floor(index / 3) + move[1]));
      const next = row * 3 + col;
      setRover(next);
      keyRefs.current[next]?.focus();
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (event.type !== "keydown") return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : 8;
      setRover(next);
      keyRefs.current[next]?.focus();
      return;
    }
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "keydown") {
      if (event.repeat) return;
      ensureAudio();
      pressKey(index);
    } else releaseKey(index);
  };

  const onKnobKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 3,
      PageDown: -3,
    };
    let delta = map[event.key];
    if (event.key === "Home" || event.key === "End") {
      // Home: the lowest hue (0°), End: the highest (345°), the short way round
      const target = event.key === "Home" ? 0 : 360 - HUE_STEP;
      const now = shownHue(pad.detent);
      let diff = (target - now) / HUE_STEP;
      if (diff > 12) diff -= 24;
      if (diff < -12) diff += 24;
      delta = Math.round(diff);
    }
    if (delta === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    ensureAudio();
    turnBy(delta);
  };

  const chooseCaps = (id: ColourwayId) => {
    ensureAudio();
    setChosen(id);
    setTouched(true);
    setAnnounce(COLOURWAYS.find((c) => c.id === id)?.label ?? "");
    pad.pulse(4, 0.6, settings.current.reducedMotion);
    nudge();
  };

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  if (supported === false) return <Fallback stage={stage} theme={theme} />;

  if (!stage) {
    return (
      <div className="absolute inset-0" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />
      </div>
    );
  }

  const hue = shownHue(detentShown);
  const name = hueName(hue);
  const dot = cssColor(glowColor(hue));

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[grabbing]:cursor-grabbing data-[grabbing]:**:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onContextMenu={(event) => {
        if (!(event.target as Element).closest("[data-lab-controls]")) event.preventDefault();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onPointerLeave={onPointerLeave}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />

      {/* the focus ring, drawn round the cap as it sits in perspective */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <g ref={ringRef} style={{ opacity: 0 }} fill="none" strokeLinejoin="round">
          <path ref={ringHaloRef} strokeWidth={3} style={{ stroke: "color-mix(in oklab, var(--background) 70%, transparent)" }} />
          <path ref={ringLineRef} strokeWidth={2} style={{ stroke: "var(--foreground)" }} />
        </g>
      </svg>

      {/* focusable stand-ins over the caps and the knob; a vertical swipe on
          a cap still scrolls the page, the knob keeps every touch */}
      <div role="group" aria-label="Macropad keys" aria-describedby={hintId}>
        {KEYS.map((k) => (
          <button
            key={k.index}
            ref={(node) => {
              keyRefs.current[k.index] = node;
            }}
            type="button"
            aria-label={`Key ${k.index + 1}`}
            aria-keyshortcuts={String(k.index + 1)}
            tabIndex={k.index === rover ? 0 : -1}
            // a click or tap plays the key without taking focus
            onMouseDown={(event) => event.preventDefault()}
            onFocus={(event) => {
              setRover(k.index);
              let keyboard = true;
              try {
                keyboard = event.currentTarget.matches(":focus-visible");
              } catch {}
              if (keyboard) showRing(k.index);
            }}
            onKeyDown={onKeyCapKey(k.index)}
            onKeyUp={onKeyCapKey(k.index)}
            onBlur={() => {
              hideRing(k.index);
              releaseKey(k.index);
            }}
            onClick={(event) => {
              // assistive tech "clicks" without pointer or key events (a
              // synthetic click right after a press of our own is not one)
              if (event.detail !== 0 || pad.isDown(k.index) || performance.now() - live.current.pressedAt < 800) return;
              pressKey(k.index);
              window.setTimeout(() => releaseKey(k.index), 120);
            }}
            className="absolute top-0 left-0 cursor-pointer rounded-[18px] outline-none [touch-action:pan-y]"
          />
        ))}
      </div>
      <div
        ref={knobRef}
        role="slider"
        tabIndex={0}
        aria-label="Glow hue knob"
        aria-describedby={hintId}
        aria-valuemin={0}
        aria-valuemax={360 - HUE_STEP}
        aria-valuenow={hue}
        aria-valuetext={`${name}, ${hue} degrees`}
        onMouseDown={(event) => event.preventDefault()}
        onFocus={(event) => {
          let keyboard = true;
          try {
            keyboard = event.currentTarget.matches(":focus-visible");
          } catch {}
          if (keyboard) showRing(KNOB_RING);
        }}
        onBlur={() => hideRing(KNOB_RING)}
        onKeyDown={(event) => {
          showRing(KNOB_RING);
          onKnobKey(event);
        }}
        className="absolute top-0 left-0 cursor-grab rounded-full outline-none [touch-action:none]"
      />

      <p id={hintId} className="sr-only">
        Press the digits 1 to 9 to play the keys, or focus the keys, move between them with the arrow keys and press
        Space or Enter. The knob sets the colour of the light: focus it and use the arrow keys, or drag it, scroll
        over it or tap it.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <div ref={controlsRef} className="contents">
        <StageControls placement="bottom">
          <TrayRow>
            <Tray label="Keycaps">
              <Swatches label="Keycaps" options={SWATCHES} value={caps} onChange={chooseCaps} />
            </Tray>
            <Tray label="Glow">
              <IconButton label="Turn the knob back a notch" onClick={() => (ensureAudio(), turnBy(-1))}>
                <ChevronLeft size={14} />
              </IconButton>
              <span
                aria-hidden="true"
                className="flex h-10 min-w-[104px] items-center justify-center gap-2 px-1 text-[13px] text-primary capitalize"
              >
                <span
                  className="size-2.5 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ease-out"
                  style={{ backgroundColor: dot, boxShadow: `0 0 0 1px rgb(0 0 0 / 0.08), 0 0 10px 1px ${dot}` }}
                />
                {name}
              </span>
              <IconButton label="Turn the knob on a notch" onClick={() => (ensureAudio(), turnBy(1))}>
                <ChevronRightSmall size={14} />
              </IconButton>
              <TrayDivider />
              <MuteButton />
            </Tray>
          </TrayRow>
          <StageHint className={touched ? "opacity-0 transition-opacity duration-700" : "transition-opacity duration-700"}>
            {fine ? "Click the keys or press 1–9 · drag, scroll or click the knob" : "Tap the keys · turn or tap the knob"}
          </StageHint>
        </StageControls>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat, top-down drawing of the pad for browsers without WebGL2 (same layout as scene.ts). */
function Fallback({ stage, theme }: { stage: boolean; theme: "light" | "dark" }) {
  const dark = theme === "dark";
  const glow = cssColor(glowColor(HUE_ZERO));
  // percentages of the case: 3.66 × 4.56 key pitches
  const W = CASE.halfWidth * 2;
  const D = CASE.front - CASE.back;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div
      role={stage ? "img" : undefined}
      aria-label={stage ? "A nine-key macropad with a knob" : undefined}
      aria-hidden={stage ? undefined : true}
      className="absolute inset-0 grid place-items-center"
    >
      <div
        className="relative h-[min(72%,420px)] max-w-[78%] rounded-[10%/8%] [container-type:size]"
        style={{
          aspectRatio: `${W} / ${D}`,
          background: dark ? "linear-gradient(#3a3b40,#26272b)" : "linear-gradient(#e2e3e6,#c3c5c9)",
          boxShadow: `0 18px 34px -18px rgb(0 0 0 / ${dark ? 0.7 : 0.45}), inset 0 1px 0 rgb(255 255 255 / ${dark ? 0.18 : 0.6})`,
        }}
      >
        <span
          className="absolute rounded-full"
          style={{
            left: pct(CASE.halfWidth + KNOB.x - KNOB.radius, W),
            top: pct(KNOB.z - CASE.back - KNOB.radius, D),
            width: pct(KNOB.radius * 2, W),
            aspectRatio: "1",
            background: dark ? "radial-gradient(circle at 40% 35%, #5a5b60, #2a2b2f)" : "radial-gradient(circle at 40% 35%, #fbfbfc, #b9bbc0)",
            boxShadow: "0 3px 8px rgb(0 0 0 / 0.3)",
          }}
        />
        {KEYS.map((k) => (
          <span
            key={k.index}
            className="absolute grid place-items-center rounded-[16%] text-[7cqw] font-medium"
            style={{
              left: pct(CASE.halfWidth + k.x - CAP.base, W),
              top: pct(k.z - CASE.back - CAP.base, D),
              width: pct(CAP.base * 2, W),
              height: pct(CAP.base * 2, D),
              background: dark ? "#2f3034" : "#ece9e3",
              color: dark ? "#c4c4c6" : "#3b3b3d",
              boxShadow: `0 0 0 1px rgb(0 0 0 / 0.08), 0 3px 0 ${dark ? "#1d1e21" : "#cbc8c1"}, 0 4px 14px -2px ${glow}`,
            }}
          >
            {k.index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
