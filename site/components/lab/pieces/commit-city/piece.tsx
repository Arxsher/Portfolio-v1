"use client";

// Commit city: a year of real GitHub contributions as a small model city.
//
// The look
// - Material: an architect's massing model. By day, white card buildings
//   on a grey plaster plinth with rounded corners, a hairline bright rim on
//   every roof edge facing you, windows as faint glazing; almost no colour,
//   so the skyline (the data) carries it. By night the same model in
//   neutral graphite: dark walls, moonlit roofs, windows coming on floor by
//   floor as the theme turns, a soft bloom, and a red beacon breathing on
//   the year's tallest tower, which carries setbacks and a tapered antenna.
// - Plan: the year folds into three bands of a season each (city.ts), so
//   the model is close to square and fills the stage at rest; the most
//   recent weeks, with the tallest tower, end at the front corner. Month
//   names sit along the boulevards like street names, wherever the ground
//   is clear.
// - Light: one key from the upper left that stays with the camera (a lamp
//   over a turntable), a sky fill, ground bounce in the lower walls, a soft
//   directional shadow per building (one union clipped to the plinth),
//   contact shadows at every base and a drop shadow under the plinth. A
//   subtle sky over the stage: daylight haze by day, a night wash with a
//   few quiet stars after dark.
// - Motion: drag sideways and the turntable follows your hand; let go and
//   it settles into the nearest quarter turn on a spring (a flick carries
//   it on), clicking into each detent. The framing glides between the
//   quarters' fits and never lets the city leave the stage mid-turn. Wheel
//   / pinch zoom glides towards the point under the pointer; zooming out
//   recentres. A building you point at rises a little on a spring and its
//   date and count float above it (or below it, near the top edge).
// - Phones: the stage opens on the whole folded year, fitted between the
//   legend tray at the top and the controls at the bottom (zoom in for a
//   closer look), a one-line hint says what to do until the first touch,
//   and a tap that lands between buildings takes the nearest one.
// - Sound (stage, after a gesture, respecting the lab mute): a wooden
//   detent click per quarter turn and a small glassy note per building you
//   point at, pitched by its height.
// - Tile: the last eight weeks as a district on its own plinth, swaying
//   slowly either side of the isometric rest with its tallest tower in
//   front, framed for that sway so it fills the tile; drawn at 24 fps with
//   no canvas filters; no controls, no sound.
// - Reduced motion: a composed still at the isometric rest; turns and zooms
//   land at once, no stars twinkling, the beacon steady.
//
// Files: city.ts (the plan, from data/contributions.json), look.ts (day and
// night), render.ts (projection, drawing, picking), sound.ts, icons.tsx.

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ensureAudio } from "../../audio";
import { clamp, damp, hash2, lerp, smoothstep, Spring, useCanvas2D, useFrame, useFinePointer, useLatest } from "../../hooks";
import { Minus, Plus, Reset } from "../../lab-icons";
import type { PieceProps } from "../../types";
import { IconButton, MuteButton, StageControls, StageHint, Tray, TrayDivider, TrayRow } from "../../ui";
import { buildCity, describeLot, heightFor, longDate, plural, shortDate, type City, type Lot } from "./city";
import { TurnLeft, TurnRight } from "./icons";
import { css, lookAt, rgb, type Look } from "./look";
import {
  axesOnScreen,
  boundsAt,
  centreOf,
  CityRenderer,
  PITCH,
  plinthRect,
  project,
  REST,
  screenToGround,
  STEP,
  type Bounds,
  type RenderResult,
  type View,
} from "./render";
import { chime, detent } from "./sound";

export default function Piece(props: PieceProps) {
  return props.mode === "stage" ? <Stage {...props} /> : <Tile {...props} />;
}

/* ---------------------------------------------------------------------- */
/* shared                                                                  */
/* ---------------------------------------------------------------------- */

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
/** Below this stage width the stage counts as narrow (phones). */
const NARROW = 520;

export function fontFamily(): string {
  try {
    return getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  } catch {
    return "system-ui, sans-serif";
  }
}

/** The nearest resting angle to `yaw` (45° + k·90°). */
export const nearestRest = (yaw: number) => Math.round((yaw - REST) / STEP) * STEP + REST;

const fitBounds: Bounds = { minU: 0, maxU: 0, minW: 0, maxW: 0 };

/** Scale that fits the city into a box at a given yaw (CSS px per unit). */
export function fitScale(city: City, yaw: number, width: number, height: number) {
  const b = boundsAt(city, yaw, fitBounds);
  return Math.min(width / Math.max(1e-3, b.maxU - b.minU), height / Math.max(1e-3, b.maxW - b.minW));
}

export type Star = { x: number; y: number; r: number; a: number; phase: number; speed: number };

export function makeStars(width: number, height: number, seed: number): Star[] {
  const count = Math.round(Math.min(90, (width * height) / 9000));
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const y = Math.pow(hash2(i, 2, seed), 1.6) * height * 0.62;
    stars.push({
      x: hash2(i, 1, seed) * width,
      y,
      r: 0.45 + Math.pow(hash2(i, 3, seed), 3) * 0.9,
      a: 0.25 + hash2(i, 4, seed) * 0.55,
      phase: hash2(i, 5, seed) * Math.PI * 2,
      speed: 0.6 + hash2(i, 6, seed) * 1.4,
    });
  }
  return stars;
}

/** Sky gradients, made again only when the size or the (quantised) night changes. */
export type SkyCache = { ctx: CanvasRenderingContext2D | null; w: number; h: number; key: number; sky: CanvasGradient | null; haze: CanvasGradient | null };

/** Sky over the stage and its stars: painted under the city layer. */
export function paintSky(
  ctx: CanvasRenderingContext2D,
  cache: SkyCache,
  width: number,
  height: number,
  dpr: number,
  look: Look,
  night: number,
  stars: Star[],
  time: number,
  still: boolean,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const key = Math.round(night * 200);
  if (cache.ctx !== ctx || cache.w !== width || cache.h !== height || cache.key !== key || !cache.sky || !cache.haze) {
    cache.ctx = ctx;
    cache.w = width;
    cache.h = height;
    cache.key = key;
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.72);
    sky.addColorStop(0, css(look.skyTop, look.skyAlpha));
    sky.addColorStop(0.55, css(look.skyTop, look.skyAlpha * 0.28));
    sky.addColorStop(1, css(look.skyTop, 0));
    // Haze around the key light (upper left).
    const r = Math.max(width, height) * 0.7;
    const haze = ctx.createRadialGradient(width * 0.16, -height * 0.1, 0, width * 0.16, -height * 0.1, r);
    haze.addColorStop(0, css(look.haze, look.hazeAlpha));
    haze.addColorStop(1, css(look.haze, 0));
    cache.sky = sky;
    cache.haze = haze;
  }
  ctx.fillStyle = cache.sky!;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = cache.haze!;
  ctx.fillRect(0, 0, width, height);

  if (night > 0.02) {
    for (const star of stars) {
      const twinkle = still ? 0.85 : 0.65 + 0.35 * Math.sin(time * star.speed + star.phase);
      const fade = 1 - star.y / (height * 0.62);
      const alpha = star.a * twinkle * fade * night;
      if (alpha < 0.02) continue;
      ctx.fillStyle = rgb(222, 226, 236, alpha);
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** The beacon's halo, drawn once into a small sprite and then only scaled and faded. */
let beaconSprite: HTMLCanvasElement | null = null;
function beaconHalo(): HTMLCanvasElement | null {
  if (beaconSprite) return beaconSprite;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgb(255 92 76 / 1)");
  glow.addColorStop(0.35, "rgb(255 64 52 / 0.33)");
  glow.addColorStop(1, "rgb(255 64 52 / 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  beaconSprite = canvas;
  return canvas;
}

export function paintBeacon(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  at: { x: number; y: number } | null,
  night: number,
  time: number,
  still: boolean,
  scale: number,
) {
  if (!at || night < 0.02) return;
  // A slow aircraft-warning breathe: mostly dim, a soft swell every 2.4s.
  const phase = (time % 2.4) / 2.4;
  const pulse = still ? 0.8 : 0.22 + 0.78 * Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 6);
  const k = night * pulse;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const radius = Math.max(5, scale * 0.42);
  const halo = beaconHalo();
  if (halo) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55 * k;
    ctx.drawImage(halo, at.x - radius, at.y - radius, radius * 2, radius * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.fillStyle = rgb(255, 120 + 80 * k, 110 + 60 * k, 0.35 + 0.65 * k);
  ctx.beginPath();
  ctx.arc(at.x, at.y, Math.max(1, scale * 0.045), 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Day ⇄ night on the wall clock (not on frames, which a busy or slow
 * device may drop): eases from where it was to the new target in 1.6s.
 */
export class NightBlend {
  value: number;
  private from: number;
  private target: number;
  private start = 0;
  constructor(value: number) {
    this.value = value;
    this.from = value;
    this.target = value;
  }
  to(target: number, instant: boolean) {
    if (instant) {
      this.value = this.from = this.target = target;
      return;
    }
    if (target === this.target) return;
    this.from = this.value;
    this.target = target;
    this.start = performance.now();
  }
  /** Advances; returns true while it is still changing. */
  step(): boolean {
    if (this.value === this.target) return false;
    const t = clamp((performance.now() - this.start) / 1600);
    // ease in-out (sine)
    const k = 0.5 - 0.5 * Math.cos(Math.PI * t);
    this.value = t >= 1 ? this.target : lerp(this.from, this.target, k);
    return true;
  }
}

/** An offscreen layer the size of the visible canvas's backing store. */
function useLayer() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  return useCallback((width: number, height: number) => {
    if (!ref.current) ref.current = document.createElement("canvas");
    const canvas = ref.current;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    return canvas;
  }, []);
}

const announcement = (lot: Lot) => `${lot.count === 0 ? "No" : lot.count} ${plural(lot.count, "contribution")} on ${longDate(lot.date)}.`;

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

/** Safe area for the city (px from each edge, padding included) and the trays' own edges. */
type Insets = { top: number; bottom: number; side: number; trayTop: number; trayBottom: number };

function Stage({ active, reducedMotion, theme }: PieceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wakeRef = useRef<() => void>(() => {});
  const dirty = useRef(true);
  const city = useMemo(() => buildCity(), []);
  const renderer = useMemo(() => new CityRenderer(city), [city]);
  const layer = useLayer();
  const fine = useFinePointer();
  const starsRef = useRef<Star[]>([]);
  const skyCache = useRef<SkyCache>({ ctx: null, w: 0, h: 0, key: NaN, sky: null, haze: null });
  /** Any gesture or key on the stage: ends the phone hint. */
  const interacted = useRef(false);
  const [hintGone, setHintGone] = useState(false);
  const [keysHint, setKeysHint] = useState(false);

  // Camera.
  const [yaw] = useState(() => new Spring(REST, { stiffness: 70, damping: 13, precision: 0.0004 }));
  const [nightBlend] = useState(() => new NightBlend(theme === "dark" ? 1 : 0));
  const zoom = useRef({ value: 1, target: 1, anchor: null as { x: number; z: number } | null });
  /** Focus offset from the fitted centre (world units); 0 at zoom 1. */
  const offset = useRef({ x: 0, z: 0 });
  const offsetGoal = useRef<{ x: number; z: number } | null>(null);
  const viewRef = useRef<View | null>(null);
  const insets = useRef<Insets>({ top: 72, bottom: 96, side: 24, trayTop: 0, trayBottom: 80 });
  const fits = useRef({ w: 0, h: 0, rests: [1, 1, 1, 1] });
  const lastRest = useRef(REST);
  const idle = useRef(0);
  const settledTurn = useRef(false);
  const painted = useRef(false);
  const scratch = useRef({ bounds: { minU: 0, maxU: 0, minW: 0, maxW: 0 } as Bounds, centre: { x: 0, z: 0 } });

  // Selection.
  const [selected, setSelected] = useState<Lot | null>(null);
  const selectedRef = useRef<Lot | null>(null);
  const lifts = useRef(new Map<number, Spring>());
  const [focus] = useState(() => new Spring(0, { stiffness: 240, damping: 30, precision: 0.002 }));
  /** A lot to keep in view once it has been drawn (keys, taps, zooming in on it). */
  const reveal = useRef<Lot | null>(null);
  /** Last pointer position over the stage (mouse / pen), to re-pick after a turn. */
  const hoverAt = useRef<{ x: number; y: number } | null>(null);
  const pointerSpeed = useRef({ x: 0, y: 0, t: 0, speed: 0 });
  const [announce, setAnnounce] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [turning, setTurning] = useState(false);
  const font = useMemo(() => fontFamily(), []);
  const reduced = useLatest(reducedMotion);
  const liftOf = useCallback((slot: number) => lifts.current.get(slot)?.value ?? 0, []);

  /** Where the fitted city's centre is at a yaw (ground point). */
  const centreAt = (at: number) => {
    const s = scratch.current;
    return centreOf(boundsAt(city, at, s.bounds), at, s.centre);
  };

  const { canvasRef, ctxRef, sizeRef } = useCanvas2D({
    mode: "stage",
    onResize: (size) => {
      starsRef.current = makeStars(size.width, size.height, 17);
      dirty.current = true;
      wakeRef.current();
    },
  });

  const markInteracted = useCallback(() => {
    if (interacted.current) return;
    interacted.current = true;
    setHintGone(true);
  }, []);

  const select = useCallback(
    (lot: Lot | null, how: "pointer" | "key" | "tap" = "pointer", speed = 0) => {
      const previous = selectedRef.current;
      if (previous === lot) return;
      selectedRef.current = lot;
      setSelected(lot);
      const springs = lifts.current;
      if (previous) springs.get(previous.slot)?.to(0);
      if (reduced.current) focus.set(lot ? 1 : 0);
      else focus.to(lot ? 1 : 0);
      if (lot && lot.height > 0) {
        let spring = springs.get(lot.slot);
        if (!spring) {
          spring = new Spring(0, { stiffness: 380, damping: 18 });
          springs.set(lot.slot, spring);
        }
        if (reduced.current) spring.set(1);
        else spring.to(1);
        // Pan the note by where the building stands on the stage.
        const view = viewRef.current;
        const width = sizeRef.current.width || 1;
        const at = view ? project(view, lot.x, lot.height, lot.z).x : width / 2;
        chime(lot.count, (at / width) * 2 - 1, speed);
      }
      if (how === "key" && lot) setAnnounce(announcement(lot));
      if (how !== "pointer" && lot) reveal.current = lot;
      dirty.current = true;
      wakeRef.current();
    },
    [reduced, sizeRef, focus],
  );

  /** Turn by whole quarter turns (+1 clockwise seen from above). */
  const turn = useCallback(
    (quarters: number) => {
      const target = nearestRest(yaw.target) + quarters * STEP;
      if (reduced.current) yaw.set(target);
      else yaw.to(target);
      dirty.current = true;
      wakeRef.current();
    },
    [yaw, reduced],
  );

  /**
   * Zoom to `value`. With an `anchor` (the ground point under the pointer)
   * that point stays put; with a `lot` the view glides to centre on it.
   */
  const zoomTo = useCallback(
    (value: number, anchor: { x: number; z: number } | null, lot: Lot | null = null) => {
      const z = zoom.current;
      z.target = clamp(value, MIN_ZOOM, MAX_ZOOM);
      z.anchor = anchor;
      offsetGoal.current = null;
      if (lot && z.target > 1.001) {
        const centre = centreAt(yaw.value);
        offsetGoal.current = { x: lot.x - centre.x, z: lot.z - centre.z };
      }
      if (reduced.current) stepZoom(1);
      setZoomed(z.target > 1.001);
      dirty.current = true;
      wakeRef.current();
    },
    // stepZoom / centreAt are defined in this component and only read refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  );

  /** Move the zoom towards its target, keeping the anchor under the pointer (zooming in) or recentring (out). */
  function stepZoom(k: number) {
    const z = zoom.current;
    const before = z.value;
    const after = k >= 1 ? z.target : lerp(before, z.target, k);
    if (Math.abs(after - before) < 1e-6) {
      z.value = z.target;
      return false;
    }
    const view = viewRef.current;
    if (after > before && z.anchor && view) {
      // F' = W − (W − F)·z/z'  (in world units around the anchor W)
      const nfx = z.anchor.x - (z.anchor.x - view.fx) * (before / after);
      const nfz = z.anchor.z - (z.anchor.z - view.fz) * (before / after);
      offset.current.x += nfx - view.fx;
      offset.current.z += nfz - view.fz;
    } else if (after < before && !offsetGoal.current) {
      const t = before - 1 > 1e-6 ? clamp((after - 1) / (before - 1)) : 0;
      offset.current.x *= t;
      offset.current.z *= t;
    }
    z.value = Math.abs(after - z.target) < 1e-4 ? z.target : after;
    return true;
  }

  /**
   * The fitted scale at this yaw: the quarter turns' own fits blended as the
   * turn goes, and never more than what fits at this very angle, so the
   * city never runs off the stage or under the trays mid-turn.
   */
  function fitAt(at: number, availW: number, availH: number) {
    const f = fits.current;
    if (f.w !== availW || f.h !== availH) {
      f.w = availW;
      f.h = availH;
      for (let k = 0; k < 4; k++) f.rests[k] = fitScale(city, REST + k * STEP, availW, availH);
    }
    const q = (at - REST) / STEP;
    const k0 = Math.floor(q);
    const t = q - k0;
    const a = f.rests[((k0 % 4) + 4) % 4];
    const b = f.rests[(((k0 + 1) % 4) + 4) % 4];
    const blend = lerp(a, b, smoothstep(0, 1, t));
    return Math.min(blend, fitScale(city, at, availW, availH));
  }

  /** Where everything sits this frame. */
  function computeView(): View | null {
    const { width, height } = sizeRef.current;
    if (!width || !height) return null;
    const { top, bottom, side } = insets.current;
    const availW = Math.max(40, width - side * 2);
    const availH = Math.max(40, height - top - bottom);
    const fit = fitAt(yaw.value, availW, availH);
    const centre = centreAt(yaw.value);
    // Keep the focus over the plinth.
    const rect = plinthRect(city);
    const o = offset.current;
    o.x = clamp(centre.x + o.x, rect.x0, rect.x1) - centre.x;
    o.z = clamp(centre.z + o.z, rect.z0, rect.z1) - centre.z;
    return {
      yaw: yaw.value,
      scale: fit * zoom.current.value,
      cx: width / 2,
      cy: top + availH / 2,
      fx: centre.x + o.x,
      fz: centre.z + o.z,
    };
  }

  // Insets: keep the city clear of the trays, and fade it softly where it
  // runs under them when zoomed (so the hint never sits on a building).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const rootRect = root.getBoundingClientRect();
      if (!rootRect.height) return;
      let top = 0;
      let bottom = rootRect.height;
      root.querySelectorAll<HTMLElement>(":scope > [data-lab-controls]").forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (!rect.height) return;
        const mid = rect.top + rect.height / 2 - rootRect.top;
        if (mid < rootRect.height / 2) top = Math.max(top, rect.bottom - rootRect.top);
        else bottom = Math.min(bottom, rect.top - rootRect.top);
      });
      const narrow = rootRect.width < NARROW;
      const pad = narrow ? 10 : 18;
      const trayBottom = rootRect.height - bottom;
      insets.current = { top: top + pad, bottom: trayBottom + pad, side: narrow ? 14 : 36, trayTop: top, trayBottom };
      const canvas = canvasRef.current;
      if (canvas) {
        const fadeTop = top > 0 ? `rgb(0 0 0 / 0.3) 0px, #000 ${Math.round(top + 6)}px` : "#000 0px";
        const mask = `linear-gradient(to bottom, ${fadeTop}, #000 calc(100% - ${Math.round(trayBottom + 4)}px), rgb(0 0 0 / 0.22) calc(100% - ${Math.round(Math.max(8, trayBottom - 40))}px))`;
        canvas.style.maskImage = mask;
        canvas.style.setProperty("-webkit-mask-image", mask);
      }
      dirty.current = true;
      wakeRef.current();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll(":scope > [data-lab-controls]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [canvasRef]);

  // Theme: day ⇄ night.
  const nightTarget = theme === "dark" ? 1 : 0;
  useEffect(() => {
    nightBlend.to(nightTarget, reducedMotion);
    dirty.current = true;
    wakeRef.current();
  }, [nightTarget, reducedMotion, nightBlend]);

  const result = useRef<RenderResult>({ anchor: null, base: null, beacon: null });

  const wake = useFrame(active, (dt, time) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return false;
    const { width, height, dpr } = sizeRef.current;
    if (!width || !height) return false;
    const still = reduced.current;
    let moving = false;

    // Turntable.
    if (!yaw.settled) {
      const before = yaw.value;
      yaw.step(dt);
      if (yaw.settled) settledTurn.current = true;
      moving = true;
      // A click as it passes (or lands on) a quarter-turn detent.
      const rest = nearestRest(yaw.value);
      if (rest !== lastRest.current && Math.abs(yaw.value - rest) < Math.abs(before - rest) + 1e-9) {
        if (Math.sign(before - rest) !== Math.sign(yaw.value - rest) || Math.abs(yaw.value - rest) < 0.02) {
          lastRest.current = rest;
          detent(Math.min(1, Math.abs(yaw.velocity) / 3 + 0.4));
        }
      }
      dirty.current = true;
    }
    // Zoom.
    if (zoom.current.value !== zoom.current.target) {
      if (stepZoom(still ? 1 : 1 - Math.exp(-14 * dt))) moving = true;
      dirty.current = true;
    }
    // Glide towards a lot that should be in view.
    const goal = offsetGoal.current;
    if (goal) {
      const o = offset.current;
      o.x = still ? goal.x : damp(o.x, goal.x, 9, dt);
      o.z = still ? goal.z : damp(o.z, goal.z, 9, dt);
      if (Math.hypot(o.x - goal.x, o.z - goal.z) < 0.002) offsetGoal.current = null;
      else moving = true;
      dirty.current = true;
    }
    // Day ⇄ night.
    if (nightBlend.step()) {
      dirty.current = true;
      moving = true;
    }
    if (!focus.settled) {
      focus.step(dt);
      dirty.current = true;
      moving = true;
    }
    // Hover lifts.
    for (const [slot, spring] of lifts.current) {
      if (spring.settled) {
        if (spring.value === 0) lifts.current.delete(slot);
        continue;
      }
      spring.step(dt);
      dirty.current = true;
      moving = true;
    }

    const night = nightBlend.value;
    // Nothing moving but the stars and the beacon: 30 frames a second is plenty.
    const rendering = dirty.current;
    idle.current = rendering ? 0 : idle.current + dt;
    if (!rendering && idle.current < 1 / 30 && painted.current) return undefined;
    idle.current = 0;
    painted.current = true;
    const look = lookAt(night);
    const layerCanvas = layer(canvas.width, canvas.height);
    if (dirty.current) {
      dirty.current = false;
      const view = computeView();
      if (view) {
        viewRef.current = view;
        const lctx = layerCanvas.getContext("2d");
        if (lctx) {
          // Month names show once a turn has settled.
          const off = Math.abs(view.yaw - nearestRest(view.yaw));
          result.current = renderer.render(lctx, width, height, dpr, view, {
            look,
            night,
            hover: selectedRef.current?.slot ?? -1,
            liftOf,
            focus: clamp(focus.value),
            labels: 1 - smoothstep(0.03, 0.2, off),
            quality: "stage",
            fontFamily: font,
          });
        }
        placeTooltip();
        keepInView();
        // The turn has landed: whatever is under the resting mouse now is the hover.
        if (settledTurn.current) {
          settledTurn.current = false;
          const at = hoverAt.current;
          if (at && gesture.current.kind === "none") select(renderer.pick(at.x, at.y));
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintSky(ctx, skyCache.current, width, height, dpr, look, night, starsRef.current, time, still);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layerCanvas, 0, 0);
    paintBeacon(ctx, dpr, result.current.beacon, night, time, still, viewRef.current?.scale ?? 20);

    // Keep running while things move, or at night for the stars and the beacon.
    return moving || (night > 0.02 && !still) ? undefined : false;
  });
  wakeRef.current = wake;

  /** Zoomed in, a lot picked by key or tap (or zoomed in on) glides into view if it isn't. */
  function keepInView() {
    const lot = reveal.current;
    if (!lot) return;
    reveal.current = null;
    if (zoom.current.target <= 1.02 || lot !== selectedRef.current) return;
    const { anchor, base } = result.current;
    const { width, height } = sizeRef.current;
    const { top, bottom, side } = insets.current;
    const tipRoom = 40;
    const out =
      !anchor ||
      anchor.y < top + tipRoom ||
      (base ? base.y : anchor.y) > height - bottom ||
      anchor.x < side ||
      anchor.x > width - side;
    if (!out) return;
    const centre = centreAt(yaw.value);
    offsetGoal.current = { x: lot.x - centre.x, z: lot.z - centre.z };
    wakeRef.current();
  }

  function placeTooltip() {
    const tip = tooltipRef.current;
    const { anchor, base } = result.current;
    if (!tip) return;
    if (!anchor || !selectedRef.current) {
      tip.style.opacity = "0";
      return;
    }
    const { width, height } = sizeRef.current;
    const { trayTop, trayBottom } = insets.current;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const minY = Math.max(8, trayTop + 6);
    const maxY = height - Math.max(8, trayBottom + 6) - h;
    let x = anchor.x - w / 2;
    let y = anchor.y - h - 6;
    if (y < minY) {
      // No room above: under the lot, or else beside the building.
      const below = (base ?? anchor).y + 10;
      if (below <= maxY) y = below;
      else {
        y = clamp(anchor.y + 8, minY, Math.max(minY, maxY));
        x = anchor.x + 18 + w <= width - 8 ? anchor.x + 18 : anchor.x - 18 - w;
      }
    }
    x = clamp(x, 8, Math.max(8, width - w - 8));
    tip.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    tip.style.opacity = "1";
  }

  // Re-place the tooltip once its text (and so its width) has changed.
  useEffect(() => {
    placeTooltip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  /* ---------------- pointer ---------------- */

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    kind: "none" | "maybe" | "turn" | "pinch";
    startX: number;
    startY: number;
    startYaw: number;
    lastX: number;
    lastT: number;
    velocity: number;
    /** Set once a pinch has happened in this gesture: lifting the last finger is then not a tap. */
    noTap: boolean;
    pinch?: { dist: number; zoom: number; anchor: { x: number; z: number } };
  }>({ kind: "none", startX: 0, startY: 0, startYaw: REST, lastX: 0, lastT: 0, velocity: 0, noTap: false });

  /** Radians per CSS px of drag. */
  const turnRate = () => STEP / Math.max(180, Math.min(320, (sizeRef.current.width || 600) * 0.3));

  const local = (event: PointerEvent | React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const pinchState = () => {
    const pts = [...pointers.current.values()];
    const [a, b] = pts;
    return { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    markInteracted();
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    if (event.button > 0) return;
    ensureAudio();
    const p = local(event);
    pointers.current.set(event.pointerId, p);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    const g = gesture.current;
    if (pointers.current.size === 1) {
      g.kind = "maybe";
      g.startX = p.x;
      g.startY = p.y;
      g.startYaw = yaw.value;
      g.lastX = p.x;
      g.lastT = performance.now();
      g.velocity = 0;
      g.noTap = false;
    } else if (pointers.current.size === 2) {
      // Second finger: pinch (settle any half-turn first).
      if (g.kind === "turn") yaw.to(nearestRest(yaw.value));
      const view = viewRef.current;
      const { mid, dist } = pinchState();
      g.kind = "pinch";
      g.noTap = true;
      g.pinch = {
        dist,
        zoom: zoom.current.value,
        anchor: view ? screenToGround(view, mid.x, mid.y) : { x: 0, z: 0 },
      };
      wake();
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const p = local(event);
    const g = gesture.current;
    if (pointers.current.has(event.pointerId)) pointers.current.set(event.pointerId, p);

    if (g.kind === "pinch" && g.pinch && pointers.current.size >= 2) {
      const { mid, dist } = pinchState();
      const z = zoom.current;
      const nextZoom = clamp(g.pinch.zoom * (dist / g.pinch.dist), MIN_ZOOM, MAX_ZOOM);
      z.value = z.target = nextZoom;
      z.anchor = null;
      offsetGoal.current = null;
      setZoomed(nextZoom > 1.001);
      // Keep the pinched point under the fingers' midpoint.
      const view = computeView();
      if (view) {
        const under = screenToGround(view, mid.x, mid.y);
        offset.current.x += g.pinch.anchor.x - under.x;
        offset.current.z += g.pinch.anchor.z - under.z;
        if (nextZoom <= 1.001) offset.current = { x: 0, z: 0 };
      }
      dirty.current = true;
      wake();
      return;
    }

    if ((g.kind === "maybe" || g.kind === "turn") && pointers.current.has(event.pointerId)) {
      const dx = p.x - g.startX;
      const dy = p.y - g.startY;
      if (g.kind === "maybe" && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        g.kind = "turn";
        g.startX = p.x;
        g.startYaw = yaw.value;
        setTurning(true);
        select(null);
      }
      if (g.kind === "turn") {
        const now = performance.now();
        const step = Math.max(1, now - g.lastT) / 1000;
        const v = (p.x - g.lastX) / step;
        g.velocity = lerp(g.velocity, v, 1 - Math.exp(-step / 0.05));
        g.lastX = p.x;
        g.lastT = now;
        const next = g.startYaw - (p.x - g.startX) * turnRate();
        yaw.set(next);
        yaw.velocity = -g.velocity * turnRate();
        // Detent clicks while dragging through a rest.
        const rest = nearestRest(next);
        if (rest !== lastRest.current && Math.abs(next - rest) < 0.05) {
          lastRest.current = rest;
          detent(0.6);
        }
        dirty.current = true;
        wake();
      }
      return;
    }

    // Plain hover (mouse / pen).
    if (event.pointerType === "touch") return;
    hoverAt.current = p;
    const s = pointerSpeed.current;
    const now = performance.now();
    const dt = Math.max(1, now - s.t) / 1000;
    const v = dt < 0.25 ? Math.hypot(p.x - s.x, p.y - s.y) / dt : 0;
    s.speed = lerp(s.speed, v, 1 - Math.exp(-dt / 0.06));
    s.x = p.x;
    s.y = p.y;
    s.t = now;
    if (g.kind === "none") select(renderer.pick(p.x, p.y), "pointer", s.speed);
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    const p = local(event);
    if (g.kind === "pinch") {
      if (pointers.current.size === 0) g.kind = "none";
      else {
        // One finger left: carry on as a fresh turn from here.
        const [rest] = [...pointers.current.values()];
        g.kind = "maybe";
        g.startX = rest.x;
        g.startY = rest.y;
        g.startYaw = yaw.value;
      }
      return;
    }
    if (g.kind === "turn") {
      const omega = -g.velocity * turnRate();
      // A flick carries on to the next quarter.
      const target = nearestRest(yaw.value + clamp(omega * 0.22, -STEP * 0.9, STEP * 0.9));
      if (reduced.current) yaw.set(target);
      else yaw.to(target, clamp(omega, -12, 12));
      dirty.current = true;
      wake();
    } else if (g.kind === "maybe" && event.type === "pointerup" && !g.noTap) {
      // A tap / click: pick what's under it (touch has no hover; a finger
      // that lands between buildings takes the nearest one).
      const touch = event.pointerType !== "mouse";
      select(renderer.pick(p.x, p.y, touch ? 14 : 0), touch ? "tap" : "pointer");
    }
    g.kind = "none";
    setTurning(false);
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") hoverAt.current = null;
    if (event.pointerType === "mouse" && gesture.current.kind === "none") select(null);
  };

  // Wheel / trackpad pinch: zoom towards the pointer. At the limits the
  // page scrolls as usual, except for the tail of a gesture that was
  // zooming (so zooming out never ends in a sudden page scroll).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let latchUntil = 0;
    const onWheel = (event: WheelEvent) => {
      if ((event.target as Element | null)?.closest?.("[data-lab-controls]")) return;
      const now = performance.now();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * 400 : event.deltaY;
      const rate = event.ctrlKey ? 0.012 : 0.0022;
      const z = zoom.current;
      const next = clamp(z.target * Math.exp(-delta * rate), MIN_ZOOM, MAX_ZOOM);
      if (Math.abs(next - z.target) < 1e-4) {
        // At a limit: let the page scroll, unless this is the same gesture.
        if (now < latchUntil) {
          event.preventDefault();
          latchUntil = now + 250;
        }
        return;
      }
      event.preventDefault();
      latchUntil = now + 250;
      ensureAudio();
      markInteracted();
      const rect = root.getBoundingClientRect();
      const view = viewRef.current;
      const anchor = view ? screenToGround(view, event.clientX - rect.left, event.clientY - rect.top) : null;
      zoomTo(next, anchor);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [zoomTo, markInteracted]);

  /* ---------------- keyboard ---------------- */

  /**
   * Arrow → a step along the plan, following the screen at the current
   * turn: each arrow takes the world axis (weeks along x, days along z)
   * that best matches its direction on screen; at the isometric rests,
   * where both match equally, ← → take the weeks and ↑ ↓ the days.
   */
  function stepFor(key: string): { axis: "week" | "day"; sign: number } | null {
    let dx = 0;
    let dy = 0;
    if (key === "ArrowRight") dx = 1;
    else if (key === "ArrowLeft") dx = -1;
    else if (key === "ArrowDown") dy = 1;
    else if (key === "ArrowUp") dy = -1;
    else return null;
    const a = axesOnScreen(yaw.target);
    const onX = dx * a.xx + dy * a.xy;
    const onZ = dx * a.zx + dy * a.zy;
    const tie = Math.abs(Math.abs(onX) - Math.abs(onZ)) < 0.08;
    const weeks = tie ? dx !== 0 : Math.abs(onX) > Math.abs(onZ);
    const along = weeks ? onX : onZ;
    return { axis: weeks ? "week" : "day", sign: along >= 0 ? 1 : -1 };
  }

  const byCell = useMemo(() => {
    const map = new Map<string, Lot>();
    for (const lot of city.lots) map.set(`${lot.col}:${lot.row}`, lot);
    return map;
  }, [city]);

  /** Where the keys start: the latest day with contributions. */
  const startLot = useMemo(() => {
    for (let i = city.lots.length - 1; i >= 0; i--) if (city.lots[i].count > 0) return city.lots[i];
    return city.lots[city.lots.length - 1] ?? null;
  }, [city]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    ensureAudio();
    markInteracted();
    setKeysHint(true);
    const step = stepFor(event.key);
    if (step) {
      event.preventDefault();
      const current = selectedRef.current;
      let next: Lot | null;
      if (!current) next = startLot;
      else if (step.axis === "week") next = byCell.get(`${current.col + step.sign}:${current.row}`) ?? current;
      else next = city.lots[current.slot + step.sign] ?? current;
      if (!next) return;
      if (next === current) {
        // At an edge: read it again.
        setAnnounce(announcement(next));
        return;
      }
      select(next, "key");
      // Zoomed in: follow the selection.
      if (zoom.current.target > 1.05) {
        const centre = centreAt(yaw.value);
        offsetGoal.current = { x: next.x - centre.x, z: next.z - centre.z };
        wake();
      }
      return;
    }
    switch (event.key) {
      case "q":
      case "Q":
      case "[":
        event.preventDefault();
        turn(-1);
        return;
      case "e":
      case "E":
      case "]":
        event.preventDefault();
        turn(1);
        return;
      case "+":
      case "=":
        event.preventDefault();
        zoomTo(zoom.current.target * 1.5, null, selectedRef.current);
        return;
      case "-":
      case "_":
        event.preventDefault();
        zoomTo(zoom.current.target / 1.5, null);
        return;
      case "0":
        event.preventDefault();
        resetView();
        return;
      case "Escape":
        if (selectedRef.current) {
          event.preventDefault();
          select(null);
        }
        return;
    }
  };

  const resetView = () => {
    markInteracted();
    zoomTo(1, null);
    const target = REST;
    // Take the short way home.
    const here = yaw.target;
    const turns = Math.round((here - target) / (Math.PI * 2));
    if (reducedMotion) yaw.set(target + turns * Math.PI * 2);
    else yaw.to(target + turns * Math.PI * 2);
    wake();
  };

  useEffect(
    () => () => {
      lifts.current.clear();
      pointers.current.clear();
    },
    [],
  );

  const tallest = city.tallest;
  const description = `A model city of ${city.username}'s GitHub contributions in ${city.year}: ${city.total} contributions from ${city.first} to ${city.last}, one lot per day laid out week by week and folded into ${city.bands} ${plural(city.bands, "district")} of a season each, with a building on every day that has contributions, its height following the count.${
    tallest ? ` The tallest tower is ${describeLot(tallest)}.` : ""
  }`;

  const hint = keysHint
    ? "← → weeks · ↑ ↓ days · Q E turn · + − zoom"
    : fine
      ? "Hover a building · Drag to turn · Scroll or pinch to zoom"
      : "Tap a building · Swipe to turn · Pinch to zoom";
  // On touch screens the hint bows out after the first touch; with a mouse it stays.
  const hintHidden = !fine && !keysHint && hintGone;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 cursor-grab overflow-hidden select-none data-turning:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      data-turning={turning ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={endPointer}
      onPointerLeave={onPointerLeave}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />

      {/* The city as a keyboard-walkable application region. */}
      <div
        role="application"
        tabIndex={0}
        aria-roledescription="model city"
        aria-label={`Commit city. ${description} Left and right arrows walk the weeks, up and down the days, Q and E turn the city, plus and minus zoom, 0 resets the view.`}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Q E + - 0"
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          try {
            if (event.currentTarget.matches(":focus-visible")) setKeysHint(true);
          } catch {}
        }}
        onBlur={() => setKeysHint(false)}
        className="absolute inset-0 rounded-[24px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"
      />

      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-[5] rounded-[8px] bg-float px-2 py-1 text-[12px] whitespace-nowrap text-primary opacity-0 shadow-float transition-[opacity] duration-150 ease-out"
      >
        {selected ? (
          <>
            <span className="font-medium tabular-nums">{selected.count === 0 ? "No" : selected.count}</span>{" "}
            <span className="text-secondary">
              {plural(selected.count, "contribution")} on {shortDate(selected.date)}
            </span>
          </>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {/* Phones: the legend rides at the top. */}
      <StageControls placement="top" className="sm:hidden">
        <Legend city={city} />
      </StageControls>

      <StageControls placement="bottom">
        <TrayRow>
          <Legend city={city} className="max-sm:hidden" />
          <Tray label="View">
            <IconButton label="Turn anticlockwise" onClick={() => turn(-1)} aria-keyshortcuts="Q">
              <TurnLeft />
            </IconButton>
            <IconButton label="Turn clockwise" onClick={() => turn(1)} aria-keyshortcuts="E">
              <TurnRight />
            </IconButton>
            <TrayDivider />
            <IconButton
              label="Zoom out"
              disabled={!zoomed}
              onClick={() => zoomTo(zoom.current.target / 1.6, null)}
              aria-keyshortcuts="-"
            >
              <Minus size={14} />
            </IconButton>
            <IconButton
              label="Zoom in"
              onClick={() => zoomTo(zoom.current.target * 1.6, null, selectedRef.current)}
              aria-keyshortcuts="+"
            >
              <Plus size={14} />
            </IconButton>
            <IconButton label="Reset view" onClick={resetView} aria-keyshortcuts="0">
              <Reset size={15} />
            </IconButton>
            <TrayDivider />
            <MuteButton />
          </Tray>
        </TrayRow>
        <StageHint
          className={`transition-opacity duration-500 ease-out ${hintHidden ? "opacity-0" : "opacity-100"}`}
        >
          <span aria-hidden={hintHidden ? true : undefined}>{hint}</span>
        </StageHint>
      </StageControls>
    </div>
  );
}

/** "544 contributions · 2026" with a small height key. */
function Legend({ city, className }: { city: City; className?: string }) {
  const max = city.tallest?.count ?? 1;
  const steps = [1, Math.max(2, Math.round(max / 12)), Math.max(3, Math.round(max / 4)), max]
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);
  const tallestH = heightFor(max);
  return (
    <Tray label="Legend" className={className}>
      <div className="flex h-10 items-center gap-2 ps-2.5 pe-2">
        <span className="text-[13px] whitespace-nowrap text-primary">
          <span className="font-medium tabular-nums">{city.total.toLocaleString("en-US")}</span>{" "}
          <span className="text-secondary">contributions in {city.year}</span>
        </span>
      </div>
      <TrayDivider />
      <div className="flex h-10 items-center gap-1.5 ps-1.5 pe-2.5" role="img" aria-label={`Height follows the count: from 1 to ${max} contributions a day`}>
        <span aria-hidden="true" className="text-[11px] text-tertiary tabular-nums">
          1
        </span>
        <svg aria-hidden="true" width={steps.length * 11 + 2} height={22} viewBox={`0 0 ${steps.length * 11 + 2} 22`} className="text-primary">
          {steps.map((count, index) => {
            const h = 3 + (heightFor(count) / tallestH) * 15;
            const x = 1 + index * 11;
            const top = 20 - h;
            return (
              <g key={count}>
                {/* left (lit) and right (shaded) faces of a tiny block, then its roof */}
                <path d={`M${x} ${top + 2}L${x + 4.5} ${top + 4.25}V${21.25}L${x} ${19}Z`} fill="currentColor" opacity={0.42} />
                <path d={`M${x + 4.5} ${top + 4.25}L${x + 9} ${top + 2}V${19}L${x + 4.5} ${21.25}Z`} fill="currentColor" opacity={0.7} />
                <path d={`M${x} ${top + 2}L${x + 4.5} ${top - 0.25}L${x + 9} ${top + 2}L${x + 4.5} ${top + 4.25}Z`} fill="currentColor" opacity={0.18} />
              </g>
            );
          })}
        </svg>
        <span aria-hidden="true" className="text-[11px] text-tertiary tabular-nums">
          {max}
        </span>
      </div>
    </Tray>
  );
}

/* ---------------------------------------------------------------------- */
/* tile                                                                    */
/* ---------------------------------------------------------------------- */

/** The tile's district: the most recent weeks. */
const TILE_WEEKS = 8;
/** The sway either side of the isometric rest, and its pace (radians of phase per second, resting / hovered). */
const TILE_SWAY = (25 * Math.PI) / 180;
const TILE_PACE = (Math.PI * 2) / 16;
const TILE_PACE_HOVER = (Math.PI * 2) / 6;
/** Frames per second on the tile. */
const TILE_FPS = 24;

function Tile({ active, reducedMotion, theme }: PieceProps) {
  const city = useMemo(() => buildCity({ weeks: TILE_WEEKS, fold: false, margin: [0.6, 0.6] }), []);
  const renderer = useMemo(() => new CityRenderer(city), [city]);
  const layer = useLayer();
  const wakeRef = useRef<() => void>(() => {});
  const dirty = useRef(true);
  const frame = useRef({ scale: 0, cx: 0, cy: 0 });
  const axis = useRef({ x: 0, z: 0 });
  const { canvasRef, ctxRef, sizeRef } = useCanvas2D({
    mode: "tile",
    onResize: (size) => {
      // One scale and one axis (the plinth's centre) for the whole sway, so
      // the district never breathes or wobbles; framed for the sway only
      // (not a full turn), so it fills the tile. A little higher than
      // centred, clear of the title chip that slides up on hover.
      const rect = plinthRect(city);
      const ax = (rect.x0 + rect.x1) / 2;
      const az = (rect.z0 + rect.z1) / 2;
      const sinP = Math.sin(PITCH);
      let halfW = 0;
      let above = 0;
      let below = 0;
      const bounds: Bounds = { minU: 0, maxU: 0, minW: 0, maxW: 0 };
      for (let i = 0; i <= 20; i++) {
        const yaw = REST + TILE_SWAY * Math.sin(((i / 20) * 2 - 1) * (Math.PI / 2));
        const b = boundsAt(city, yaw, bounds);
        const au = ax * Math.cos(yaw) - az * Math.sin(yaw);
        const aw = (ax * Math.sin(yaw) + az * Math.cos(yaw)) * sinP;
        halfW = Math.max(halfW, au - b.minU, b.maxU - au);
        above = Math.max(above, aw - b.minW);
        below = Math.max(below, b.maxW - aw);
      }
      const scale = Math.min((size.width * 0.94) / (halfW * 2), (size.height * 0.84) / (above + below));
      frame.current = {
        scale,
        cx: size.width / 2,
        // Top margin 4% of the tile, the rest of the room below.
        cy: size.height * 0.04 + above * scale + (size.height * 0.84 - (above + below) * scale) / 2,
      };
      axis.current = { x: ax, z: az };
      dirty.current = true;
      wakeRef.current();
    },
  });
  const phase = useRef(-0.5);
  const pace = useRef({ value: TILE_PACE, target: TILE_PACE });
  const nightTarget = theme === "dark" ? 1 : 0;
  const [night] = useState(() => new NightBlend(nightTarget));
  const font = useMemo(() => fontFamily(), []);
  const acc = useRef(0);
  const noLift = useCallback(() => 0, []);

  useEffect(() => {
    night.to(nightTarget, reducedMotion);
    dirty.current = true;
    wakeRef.current();
  }, [nightTarget, reducedMotion, night]);

  useEffect(() => {
    dirty.current = true;
    wakeRef.current();
  }, [reducedMotion]);

  const wake = useFrame(active, (dt) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return false;
    const { width, height, dpr } = sizeRef.current;
    const f = frame.current;
    if (!width || !height || !f.scale) return false;
    let moving = false;
    if (!reducedMotion) {
      pace.current.value = damp(pace.current.value, pace.current.target, 3, dt);
      phase.current += pace.current.value * dt;
      moving = true;
    }
    if (night.step()) {
      moving = true;
      dirty.current = true;
    }
    // A slow sway on a small tile needs no more than 24 frames a second.
    acc.current += dt;
    if (!dirty.current && acc.current < 1 / TILE_FPS) return moving || (night.value > 0.02 && !reducedMotion) ? undefined : false;
    acc.current = 0;
    dirty.current = false;

    const view: View = {
      yaw: reducedMotion ? REST : REST + TILE_SWAY * Math.sin(phase.current),
      scale: f.scale,
      cx: f.cx,
      cy: f.cy,
      fx: axis.current.x,
      fz: axis.current.z,
    };
    const lctx = layer(canvas.width, canvas.height).getContext("2d");
    if (!lctx) return false;
    const look = lookAt(night.value);
    const result = renderer.render(lctx, width, height, dpr, view, {
      look,
      night: night.value,
      hover: -1,
      liftOf: noLift,
      focus: 0,
      labels: 0,
      quality: "tile",
      fontFamily: font,
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(lctx.canvas, 0, 0);
    paintBeacon(ctx, dpr, result.beacon, night.value, performance.now() / 1000, reducedMotion, view.scale);
    return moving || (night.value > 0.02 && !reducedMotion) ? undefined : false;
  });
  wakeRef.current = wake;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      onPointerEnter={() => {
        pace.current.target = TILE_PACE_HOVER;
      }}
      onPointerLeave={() => {
        pace.current.target = TILE_PACE;
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
