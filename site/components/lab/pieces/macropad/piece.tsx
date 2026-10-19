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
import { AutoPlay, BOTTOM_OUT, DETENT_ANGLE, glowColor, HUE_STEP, HUE_ZERO, hueName, Pad, TOP_OUT, wrapHue } from "./engine";
import { capsFor, COLOURWAYS, lookAt, mixCaps, swatchFor, THEME_CAPS, type ColourwayId } from "./looks";
import { cssColor, insideConvex, type Vec3 } from "./math";
import { PadRenderer, type Caps, type Frame } from "./renderer";
import { CAP, CASE, KEYS, KNOB } from "./scene";
import { MAX_RIPPLES } from "./shaders";
import { clack, detent as tick, thock } from "./sound";
import { bbox, View, type Rect } from "./view";

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

type Drag =
  | { kind: "keys"; id: number; key: number; over: number }
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

  // per-frame state that never re-renders
  const live = useRef({
    yaw: 0,
    yawV: 0,
    pitch: 0,
    pitchV: 0,
    aimYaw: 0,
    aimPitch: 0,
    night: theme === "dark" ? 1 : 0,
    caps: capsFor(THEME_CAPS[theme]) as Caps,
    fitDirty: true,
    acc: 0,
    idle: 0,
    welcomed: false,
    hover: -1,
    overlay: "",
    frame: {
      viewProj: view.viewProj,
      camPos: [0, 0, 0] as Vec3,
      fit: view.fit,
      look: lookAt(theme === "dark" ? 1 : 0),
      caps: capsFor(THEME_CAPS[theme]),
      travel: new Float32Array(9),
      glow: new Float32Array(27),
      ripples: new Float32Array(MAX_RIPPLES * 4),
      rippleColors: new Float32Array(MAX_RIPPLES * 3),
      knobAngle: 0,
      knobLight: [0, 0, 0] as Vec3,
      detail: stage ? 1 : 0.35,
      bloom: true,
    } satisfies Frame,
  });

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

  const placeOverlays = () => {
    if (!settings.current.stage) return;
    let signature = "";
    const boxes = KEYS.map((k) => {
      const b = bbox(view.capHull(k.index, pad.switches[k.index].x));
      signature += `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.w)},${Math.round(b.h)};`;
      return b;
    });
    const knob = bbox(view.knobHull());
    signature += `${Math.round(knob.x)},${Math.round(knob.y)},${Math.round(knob.w)}`;
    if (signature === live.current.overlay) return;
    live.current.overlay = signature;
    boxes.forEach((b, i) => {
      const el = keyRefs.current[i];
      if (!el) return;
      el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px)`;
      el.style.width = `${b.w.toFixed(1)}px`;
      el.style.height = `${b.h.toFixed(1)}px`;
    });
    const el = knobRef.current;
    if (el) {
      el.style.transform = `translate(${knob.x.toFixed(1)}px, ${knob.y.toFixed(1)}px)`;
      el.style.width = `${knob.w.toFixed(1)}px`;
      el.style.height = `${knob.h.toFixed(1)}px`;
    }
  };

  const wake = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const L = live.current;
    const s = settings.current;
    const { width, height } = sizeRef.current;
    // nothing to draw yet: sleep until the context or a resize wakes the loop
    if (!renderer || width < 2 || height < 2) return false;

    // tiles run at half rate
    if (!s.stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    if (L.fitDirty) layout();

    const reduced = s.reducedMotion;
    if (!s.stage) {
      if (!reduced) auto.tick(pad, reduced);
      else auto.settle(pad, reduced);
    } else if (!L.welcomed && !reduced && pad.time > 0.45) {
      L.welcomed = true;
      pad.pulse(4, 0.95, reduced);
    }
    let busy = pad.step(dt, { reduced, breathe: false });
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

    // theme and keycaps cross-fade
    const night = s.theme === "dark" ? 1 : 0;
    L.night = reduced ? night : damp(L.night, night, 7, dt);
    if (Math.abs(L.night - night) < 0.002) L.night = night;
    else busy = true;
    const capsTarget = capsFor(s.caps);
    const ct = reduced ? 1 : 1 - Math.exp(-dt * 10);
    L.caps = mixCaps(L.caps, capsTarget, ct);
    const capsGap = Math.abs(L.caps.albedo[0] - capsTarget.albedo[0]) + Math.abs(L.caps.albedo[2] - capsTarget.albedo[2]);
    if (capsGap > 0.002) busy = true;
    else L.caps = capsTarget;

    const f = L.frame;
    const look = lookAt(L.night);
    // tiles are small: a touch more glow and a firmer footprint keep them legible
    f.look = s.stage
      ? look
      : { ...look, glowGain: look.glowGain * 1.25, shadow: [look.shadow[0] * 1.25, look.shadow[1] * 1.2] };
    f.caps = L.caps;
    f.camPos = view.camPos;
    f.fit = view.fit;
    f.knobAngle = -Math.PI / 2 + pad.angle;
    pad.fill({
      travel: f.travel,
      glow: f.glow,
      ripples: f.ripples,
      rippleColors: f.rippleColors,
      knobLight: f.knobLight,
      breathe: s.stage,
      reduced,
      gain: 1,
    });
    // only breathing: a slower frame is plenty (saves the battery)
    const breathing = s.stage && !reduced && !busy;
    if (breathing) {
      L.idle += dt;
      if (L.idle < 1 / 24) return;
      L.idle = 0;
    }
    renderer.draw(f);
    placeOverlays();
    if (!busy && !breathing) return false;
  });

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? 2 : 1.5,
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
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      live.current.fitDirty = true;
      wake();
    },
  });

  // redraw the legends once Geist has loaded
  useEffect(() => {
    let alive = true;
    void fontReady().then(() => {
      if (!alive) return;
      atlasRef.current = drawAtlas(atlasRef.current ?? undefined, stage ? 500 : 640);
      rendererRef.current?.setAtlas(atlasRef.current);
      wake();
    });
    return () => {
      alive = false;
    };
  }, [wake, stage]);

  // the trays' height decides how much room the pad has
  useEffect(() => {
    if (!stage) return;
    const controls = controlsRef.current?.querySelector<HTMLElement>("[data-lab-controls]");
    if (!controls) return;
    const observer = new ResizeObserver(() => {
      live.current.fitDirty = true;
      wake();
    });
    observer.observe(controls);
    return () => observer.disconnect();
  }, [stage, wake]);

  // wake on any change from React's side
  useEffect(() => {
    if (reducedMotion) {
      pad.accent[4] = 0.55;
      [1, 3, 5, 7].forEach((i) => (pad.accent[i] = 0.1));
    } else pad.accent.fill(0);
    wake();
  }, [theme, caps, reducedMotion, pad, wake]);

  /* -------------------------------------------------------------------- */
  /* playing                                                               */
  /* -------------------------------------------------------------------- */

  const pressKey = useCallback(
    (index: number) => {
      const reduced = settings.current.reducedMotion;
      if (!pad.press(index, reduced)) return false;
      if (settings.current.stage) thock(index, panFor(index), reduced ? 0.004 : BOTTOM_OUT);
      setTouched(true);
      wake();
      return true;
    },
    [pad, settings, wake],
  );

  const releaseKey = useCallback(
    (index: number) => {
      if (!pad.isDown(index)) return;
      const reduced = settings.current.reducedMotion;
      const s = pad.switches[index];
      // a short tap waits for the bottom before it comes back up
      const wait = s.x < 0.92 && !reduced ? Math.max(0, BOTTOM_OUT * (1 - s.x)) : 0;
      pad.release(index, reduced);
      if (settings.current.stage) clack(index, panFor(index), (reduced ? 0.01 : TOP_OUT) + wait);
      wake();
    },
    [pad, settings, wake],
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
      wake();
    },
    [pad, settings, wake],
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
      wake();
      return;
    }
    // a key this pointer pressed is its own to release (another finger may hold the rest)
    drags.current.set(event.pointerId, { kind: "keys", id: event.pointerId, key: pressKey(hit) ? hit : -1, over: hit });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const [x, y] = local(event);
    const L = live.current;
    const { width, height } = sizeRef.current;
    if (event.pointerType === "mouse" && width && height && !settings.current.reducedMotion) {
      L.aimYaw = ((x / width) * 2 - 1) * (stage ? 0.075 : 0.06);
      L.aimPitch = ((y / height) * 2 - 1) * (stage ? -0.045 : -0.035);
      wake();
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
        wake();
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
      current.key = key >= 0 && pressKey(key) ? key : -1;
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
    wake();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drags.current.get(event.pointerId);
    if (!current) return;
    drags.current.delete(event.pointerId);
    if (current.kind === "keys") {
      if (current.key >= 0) releaseKey(current.key);
      return;
    }
    rootRef.current?.removeAttribute("data-grabbing");
    pad.endDrag();
    // a tap on the knob turns it one notch
    if (event.type === "pointerup" && current.travelled < 5 && performance.now() - current.at < 350) turnBy(1);
    wake();
  };

  const onPointerLeave = () => {
    const L = live.current;
    L.aimYaw = 0;
    L.aimPitch = 0;
    L.hover = -1;
    wake();
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
    KEYS.forEach((k) => pad.release(k.index, true));
    drags.current.clear();
    rootRef.current?.removeAttribute("data-grabbing");
    pad.endDrag();
  }, [active, pad]);

  const onKeyCapKey = (index: number) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const move = moves[event.key];
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
    wake();
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

      {/* focusable stand-ins over the caps and the knob (they also stop touch scrolling there) */}
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
            onFocus={() => setRover(k.index)}
            onKeyDown={onKeyCapKey(k.index)}
            onKeyUp={onKeyCapKey(k.index)}
            onBlur={() => releaseKey(k.index)}
            onClick={(event) => {
              // assistive tech "clicks" without pointer or key events
              if (event.detail !== 0 || pad.isDown(k.index)) return;
              pressKey(k.index);
              window.setTimeout(() => releaseKey(k.index), 120);
            }}
            className="absolute top-0 left-0 cursor-pointer rounded-[18px] outline-none [touch-action:none] focus-visible:shadow-[0_0_0_2px_var(--foreground),0_0_0_5px_color-mix(in_oklab,var(--background)_70%,transparent)]"
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
        onKeyDown={onKnobKey}
        className="absolute top-0 left-0 cursor-grab rounded-full outline-none [touch-action:none] focus-visible:shadow-[0_0_0_2px_var(--foreground),0_0_0_5px_color-mix(in_oklab,var(--background)_70%,transparent)]"
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
