"use client";

// Commit city as a card: the home page's GitHub section
// (components/home/github.tsx) mounts this instead of a contribution grid.
//
// The same model as the lab piece (city.ts, render.ts, look.ts, and the sky,
// beacon and day ⇄ night helpers from piece.tsx), sized for a card in the
// middle of a scrolling page, keeping what reads well there and leaving out
// what would fight the page:
// - Drag or swipe sideways to turn the city; it follows the hand and
//   settles into the nearest quarter turn on a spring (a flick carries it
//   on). Vertical swipes scroll the page (touch-action: pan-y) and the
//   wheel is left alone: no zoom here, the lab stage has that.
// - Point at (or tap) a building: it rises a little, the rest of the city
//   steps back and "54 contributions on Oct 8" floats above it. A tap
//   elsewhere on the page puts it away.
// - Idle, it sways slowly either side of its quarter, and glides to a stop
//   while the pointer or the keyboard is on it, so what you aim at stays put.
//   The sway is slow enough (about 3° a second at most) to need only 20
//   frames a second, 15 on touch screens; anything you do (a turn, a
//   hover, a tap, a key) is drawn at the display's own rate.
// - Two small buttons turn it a quarter at a time. Focused, the arrow keys
//   walk the days (left / right a week, up / down a day, as seen on screen),
//   Home / End jump to the first / latest day, Q / E turn, and a polite
//   live region reads each day out.
// - Light theme: the white massing model on its plaster plinth. Dark: the
//   graphite model with its windows lit floor by floor, a soft bloom, a few
//   stars and the beacon on the tallest tower.
// - Reduced motion: a still at the isometric rest, turns land at once.
// - No sound (the lab's mute control lives on the lab pages).
//
// Lifecycle: the parent mounts it once it is near the viewport and passes
// `active` (on screen and the tab visible); the frame loop only runs while
// active and sleeps once nothing moves. On unmount every canvas, the
// renderer's offscreen buffers included, is shrunk to 1 × 1 so its memory
// goes at once.
//
// The piece fills its nearest positioned ancestor (absolute inset-0), and
// inherits that ancestor's corner radius for its focus ring.

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { clamp, damp, lerp, smoothstep, Spring, useCanvas2D, useFinePointer, useFrame, useLatest } from "../../hooks";
import type { PieceTheme } from "../../types";
import { buildCity, longDate, plural, shortDate, type Lot } from "./city";
import { lookAt } from "./look";
import { fitScale, fontFamily, makeStars, nearestRest, NightBlend, paintBeacon, paintSky, type SkyCache, type Star } from "./piece";
import { axesOnScreen, boundsAt, centreOf, CityRenderer, REST, STEP, type Bounds, type RenderResult, type View } from "./render";

export type CityCardProps = {
  /** False while offscreen or the tab is hidden: the frame loop stops. */
  active: boolean;
  /** prefers-reduced-motion: a still at the rest, no sway, turns land at once. */
  reducedMotion: boolean;
  /** The site theme, live. */
  theme: PieceTheme;
  /** id of an element that sums the year up (read with the city's label). */
  describedBy?: string;
};

/** The idle sway either side of the quarter, and its pace (radians of phase per second). */
const SWAY = (11 * Math.PI) / 180;
const PACE = (Math.PI * 2) / 22;
/**
 * Frames a second while only the sway, the stars or the beacon move: each
 * of those frames draws the whole city again at the stage's quality, and
 * the sway moves the city's far corners less than a pixel a frame even at
 * the lower rate (touch screens, so phones).
 */
const IDLE_FPS = 20;
const IDLE_FPS_LIGHT = 15;
/** Below this width the card counts as narrow. */
const NARROW = 480;
/** Below this height it is the short band over the figures on phones. */
const SHORT = 230;

/** Room kept clear around the city (CSS px). */
function insetsFor(width: number, height: number) {
  // The short band: just clear of the hint row, little sky under the plinth.
  if (height < SHORT) return { side: 10, top: 30, bottom: 10 };
  return width < NARROW ? { side: 10, top: 34, bottom: 16 } : { side: 20, top: 18, bottom: 22 };
}

/** Stars stay this far (CSS px) inside the card's edges, and clear of its rounded corners. */
const STAR_MARGIN = 10;
const CORNER = 24;

/** The night sky's stars, kept off the card's border so none of them reads as dust on its edge. */
function cardStars(width: number, height: number): Star[] {
  const m = STAR_MARGIN;
  const stars = makeStars(Math.max(1, width - m * 2), Math.max(1, height - m * 2), 23);
  const kept: Star[] = [];
  for (const star of stars) {
    const x = star.x + m;
    const y = star.y + m;
    // In a corner's square, only what sits well inside its curve.
    const cx = x < CORNER ? CORNER : x > width - CORNER ? width - CORNER : x;
    const cy = y < CORNER ? CORNER : y > height - CORNER ? height - CORNER : y;
    if (Math.hypot(x - cx, y - cy) > CORNER - m) continue;
    kept.push({ ...star, x, y });
  }
  return kept;
}

const announcement = (lot: Lot) => `${lot.count === 0 ? "No" : lot.count} ${plural(lot.count, "contribution")} on ${longDate(lot.date)}.`;

type Gesture = {
  kind: "none" | "maybe" | "turn";
  id: number;
  startX: number;
  startY: number;
  startYaw: number;
  lastX: number;
  lastT: number;
  velocity: number;
};

export default function CityCard({ active, reducedMotion, theme, describedBy }: CityCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLCanvasElement | null>(null);
  const wakeRef = useRef<() => void>(() => {});
  const dirty = useRef(true);
  const city = useMemo(() => buildCity(), []);
  const renderer = useMemo(() => new CityRenderer(city), [city]);
  const fine = useFinePointer();
  const fineRef = useLatest(fine);
  const font = useMemo(() => fontFamily(), []);
  const reduced = useLatest(reducedMotion);
  const keysId = useId();

  // Camera: a turntable (quarter turns on a spring) plus the idle sway.
  const [yaw] = useState(() => new Spring(REST, { stiffness: 70, damping: 13, precision: 0.0004 }));
  const sway = useRef({ phase: 0, pace: PACE, amp: SWAY, offset: 0 });
  const [nightBlend] = useState(() => new NightBlend(theme === "dark" ? 1 : 0));
  const fit = useRef({ ready: false, w: 0, h: 0, rests: [1, 1, 1, 1] });
  const viewRef = useRef<View | null>(null);
  const starsRef = useRef<Star[]>([]);
  const skyCache = useRef<SkyCache>({ ctx: null, w: 0, h: 0, key: NaN, sky: null, haze: null });
  const scratch = useRef({ bounds: { minU: 0, maxU: 0, minW: 0, maxW: 0 } as Bounds, centre: { x: 0, z: 0 } });
  const result = useRef<RenderResult>({ anchor: null, base: null, beacon: null });
  const acc = useRef(0);
  const painted = useRef(false);
  const settledTurn = useRef(false);

  // What holds the city still: a mouse over it, keyboard focus on it.
  const hovering = useRef(false);
  const focused = useRef(false);
  /** Last mouse / pen position over the card, to re-pick once a turn lands. */
  const hoverAt = useRef<{ x: number; y: number } | null>(null);

  // Selection.
  const [selected, setSelected] = useState<Lot | null>(null);
  const selectedRef = useRef<Lot | null>(null);
  const lifts = useRef(new Map<number, Spring>());
  const [focus] = useState(() => new Spring(0, { stiffness: 240, damping: 30, precision: 0.002 }));
  const [announce, setAnnounce] = useState("");
  const [turning, setTurning] = useState(false);
  /** Any turn, tap or key: the hint bows out. */
  const [used, setUsed] = useState(false);
  const [keysHint, setKeysHint] = useState(false);
  const liftOf = useCallback((slot: number) => lifts.current.get(slot)?.value ?? 0, []);

  const { canvasRef, ctxRef, sizeRef } = useCanvas2D({
    // The stage's DPR cap (2): the card is about as large as a stage on phones.
    mode: "stage",
    onResize: (size) => {
      starsRef.current = cardStars(size.width, size.height);
      fit.current.ready = false;
      dirty.current = true;
      wakeRef.current();
    },
  });

  const select = useCallback(
    (lot: Lot | null, how: "pointer" | "key" | "tap" = "pointer") => {
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
      }
      if (how === "key" && lot) setAnnounce(announcement(lot));
      dirty.current = true;
      wakeRef.current();
    },
    [reduced, focus],
  );

  /** The sway's current offset becomes part of the turntable's angle (before a drag or a turn). */
  const foldSway = useCallback(() => {
    const s = sway.current;
    if (s.offset !== 0) {
      yaw.value += s.offset;
      yaw.target += s.offset;
    }
    s.amp = 0;
    s.phase = 0;
    s.offset = 0;
  }, [yaw]);

  /** Turn by whole quarter turns (+1 clockwise seen from above). */
  const turn = useCallback(
    (quarters: number) => {
      foldSway();
      const target = nearestRest(yaw.target) + quarters * STEP;
      if (reduced.current) yaw.set(target);
      else yaw.to(target);
      settledTurn.current = false;
      setUsed(true);
      dirty.current = true;
      wakeRef.current();
    },
    [yaw, reduced, foldSway],
  );

  /** Where everything sits this frame. */
  function computeView(): View | null {
    const { width, height } = sizeRef.current;
    if (!width || !height) return null;
    const insets = insetsFor(width, height);
    const availW = Math.max(40, width - insets.side * 2);
    const availH = Math.max(40, height - insets.top - insets.bottom);
    const f = fit.current;
    if (!f.ready || f.w !== availW || f.h !== availH) {
      // Each quarter's own fit, held over its whole sway, so the city never
      // breathes while it sways (the tallest tower stands at the back in
      // some quarters, so they fit smaller).
      for (let k = 0; k < 4; k++) {
        let scale = Infinity;
        for (let j = -4; j <= 4; j++) scale = Math.min(scale, fitScale(city, REST + k * STEP + (SWAY * 1.05 * j) / 4, availW, availH));
        f.rests[k] = scale;
      }
      f.ready = true;
      f.w = availW;
      f.h = availH;
    }
    const at = yaw.value + sway.current.offset;
    // Mid-turn the quarters' fits blend, never past what fits at this very angle.
    const q = (yaw.value - REST) / STEP;
    const k0 = Math.floor(q);
    const blend = lerp(f.rests[((k0 % 4) + 4) % 4], f.rests[(((k0 + 1) % 4) + 4) % 4], smoothstep(0, 1, q - k0));
    const scale = yaw.settled && gesture.current.kind !== "turn" ? blend : Math.min(blend, fitScale(city, at, availW, availH));
    const s = scratch.current;
    const centre = centreOf(boundsAt(city, at, s.bounds), at, s.centre);
    return { yaw: at, scale, cx: width / 2, cy: insets.top + availH / 2, fx: centre.x, fz: centre.z };
  }

  // Theme: day ⇄ night.
  const nightTarget = theme === "dark" ? 1 : 0;
  useEffect(() => {
    nightBlend.to(nightTarget, reducedMotion);
    dirty.current = true;
    wakeRef.current();
  }, [nightTarget, reducedMotion, nightBlend]);

  // Reduced motion switched on: back to the rest, at once.
  useEffect(() => {
    if (!reducedMotion) return;
    foldSway();
    yaw.set(nearestRest(yaw.target));
    dirty.current = true;
    wakeRef.current();
  }, [reducedMotion, foldSway, yaw]);

  const gesture = useRef<Gesture>({ kind: "none", id: -1, startX: 0, startY: 0, startYaw: REST, lastX: 0, lastT: 0, velocity: 0 });

  const wake = useFrame(active, (dt, time) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return false;
    const { width, height, dpr } = sizeRef.current;
    if (!width || !height) return false;
    const still = reduced.current;
    const g = gesture.current;
    let moving = false;

    // Idle sway: glides to a stop while the city is held, grows back after a turn.
    const s = sway.current;
    if (!still) {
      const held = hovering.current || focused.current || g.kind !== "none" || selectedRef.current !== null;
      s.pace = damp(s.pace, held ? 0 : PACE, 2.4, dt);
      if (held && s.pace < 1e-3) s.pace = 0;
      if (g.kind !== "turn" && yaw.settled) s.amp = s.amp > SWAY - 1e-4 ? SWAY : damp(s.amp, SWAY, 0.7, dt);
      s.phase += s.pace * dt;
      const offset = s.amp * Math.sin(s.phase);
      if (Math.abs(offset - s.offset) > 1e-6) {
        s.offset = offset;
        dirty.current = true;
      }
    } else if (s.offset !== 0) {
      foldSway();
      dirty.current = true;
    }

    // Turntable.
    if (!yaw.settled) {
      yaw.step(dt);
      if (yaw.settled) settledTurn.current = true;
      moving = true;
      dirty.current = true;
    }
    // Day ⇄ night.
    if (nightBlend.step()) {
      moving = true;
      dirty.current = true;
    }
    if (!focus.settled) {
      focus.step(dt);
      moving = true;
      dirty.current = true;
    }
    // Hover lifts.
    for (const [slot, spring] of lifts.current) {
      if (spring.settled) {
        if (spring.value === 0) lifts.current.delete(slot);
        continue;
      }
      spring.step(dt);
      moving = true;
      dirty.current = true;
    }

    const night = nightBlend.value;
    const twinkling = night > 0.02 && !still;
    const swaying = !still && s.pace > 0 && s.amp > 0;
    const alive = moving || swaying || twinkling;
    if (!dirty.current && !twinkling && painted.current) return alive ? undefined : false;
    // Only the sway, the stars or the beacon: a slow cadence is plenty.
    if (!moving && painted.current) {
      acc.current += dt;
      const fps = fineRef.current ? IDLE_FPS : IDLE_FPS_LIGHT;
      if (acc.current < 1 / fps - 1e-3) return undefined;
    }
    acc.current = 0;
    painted.current = true;

    const look = lookAt(night);
    if (!layerRef.current) layerRef.current = document.createElement("canvas");
    const layer = layerRef.current;
    if (layer.width !== canvas.width) layer.width = canvas.width;
    if (layer.height !== canvas.height) layer.height = canvas.height;
    if (dirty.current) {
      dirty.current = false;
      const view = computeView();
      const lctx = layer.getContext("2d");
      if (view && lctx) {
        viewRef.current = view;
        // Month names only once a turn has settled.
        const off = Math.abs(view.yaw - nearestRest(view.yaw));
        result.current = renderer.render(lctx, width, height, dpr, view, {
          look,
          night,
          hover: selectedRef.current?.slot ?? -1,
          liftOf,
          focus: clamp(focus.value),
          labels: still ? 1 : 1 - clamp((off - 0.03) / 0.17),
          quality: "stage",
          fontFamily: font,
        });
        placeTooltip();
        // The turn has landed: whatever is under the resting mouse is the hover now.
        if (settledTurn.current) {
          settledTurn.current = false;
          const at = hoverAt.current;
          if (at && hovering.current && g.kind === "none") select(renderer.pick(at.x, at.y));
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // The sky at half strength by day: the card sits beside plain tile.
    ctx.globalAlpha = lerp(0.5, 1, night);
    paintSky(ctx, skyCache.current, width, height, dpr, look, night, starsRef.current, time, still);
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);
    paintBeacon(ctx, dpr, result.current.beacon, night, time, still, viewRef.current?.scale ?? 14);
    return alive || dirty.current ? undefined : false;
  });
  wakeRef.current = wake;

  function placeTooltip() {
    const tip = tooltipRef.current;
    const { anchor, base } = result.current;
    if (!tip) return;
    if (!anchor || !selectedRef.current) {
      tip.style.opacity = "0";
      return;
    }
    const { width, height } = sizeRef.current;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const minY = 8;
    const maxY = height - 8 - h;
    let x = anchor.x - w / 2;
    let y = anchor.y - h - 6;
    if (y < minY) {
      // No room above: under the lot, or else beside the building.
      const below = (base ?? anchor).y + 10;
      if (below <= maxY) y = below;
      else {
        y = clamp(anchor.y + 8, minY, Math.max(minY, maxY));
        x = anchor.x + 16 + w <= width - 8 ? anchor.x + 16 : anchor.x - 16 - w;
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

  // Off screen: nothing stays pointed at.
  useEffect(() => {
    if (active) {
      dirty.current = true;
      return;
    }
    hovering.current = false;
    select(null);
  }, [active, select]);

  // A tap or click anywhere else on the page puts the tooltip away.
  useEffect(() => {
    if (!selected) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) select(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [selected, select]);

  // Unmount: let the pixels go now rather than at the next collection.
  useEffect(() => {
    const canvas = canvasRef.current;
    const springs = lifts.current;
    return () => {
      renderer.dispose();
      const layer = layerRef.current;
      if (layer) layer.width = layer.height = 1;
      if (canvas) canvas.width = canvas.height = 1;
      springs.clear();
    };
  }, [renderer, canvasRef]);

  /* ---------------- pointer ---------------- */

  /** Radians per CSS px of drag: a quarter turn for about a third of the card. */
  const turnRate = () => STEP / Math.max(160, Math.min(260, (sizeRef.current.width || 600) * 0.36));

  const local = (event: ReactPointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button > 0 || !event.isPrimary) return;
    if ((event.target as Element).closest("[data-city-controls]")) return;
    const p = local(event);
    const g = gesture.current;
    g.kind = "maybe";
    g.id = event.pointerId;
    g.startX = p.x;
    g.startY = p.y;
    g.lastX = p.x;
    g.lastT = performance.now();
    g.velocity = 0;
    wake();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const p = local(event);
    const g = gesture.current;
    if (g.kind !== "none" && event.pointerId === g.id) {
      const dx = p.x - g.startX;
      const dy = p.y - g.startY;
      if (g.kind === "maybe" && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        foldSway();
        g.kind = "turn";
        g.startX = p.x;
        g.startYaw = yaw.value;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {}
        setTurning(true);
        setUsed(true);
        select(null);
      }
      if (g.kind === "turn") {
        const now = performance.now();
        const step = Math.max(1, now - g.lastT) / 1000;
        g.velocity = lerp(g.velocity, (p.x - g.lastX) / step, 1 - Math.exp(-step / 0.05));
        g.lastX = p.x;
        g.lastT = now;
        yaw.set(g.startYaw - (p.x - g.startX) * turnRate());
        dirty.current = true;
        wake();
      }
      return;
    }
    // Plain hover (mouse / pen).
    if (event.pointerType === "touch") return;
    hovering.current = true;
    hoverAt.current = p;
    select(renderer.pick(p.x, p.y));
    wake();
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (event.pointerId !== g.id || g.kind === "none") return;
    const p = local(event);
    if (g.kind === "turn") {
      const omega = -g.velocity * turnRate();
      // A flick carries on to the next quarter.
      const target = nearestRest(yaw.value + clamp(omega * 0.22, -STEP * 0.9, STEP * 0.9));
      if (reduced.current) yaw.set(target);
      else yaw.to(target, clamp(omega, -12, 12));
      settledTurn.current = false;
      setTurning(false);
      dirty.current = true;
    } else if (event.type === "pointerup") {
      // A tap or click: what's under it (a finger that lands between
      // buildings takes the nearest one).
      const touch = event.pointerType !== "mouse";
      const lot = renderer.pick(p.x, p.y, touch ? 14 : 0);
      if (touch) setUsed(true);
      select(lot, touch ? "tap" : "pointer");
    }
    g.kind = "none";
    g.id = -1;
    wake();
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    hovering.current = false;
    hoverAt.current = null;
    if (gesture.current.kind === "none") select(null);
    wake();
  };

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
    focused.current = true;
    const step = stepFor(event.key);
    if (step) {
      event.preventDefault();
      setUsed(true);
      const current = selectedRef.current;
      let next: Lot | null;
      if (!current) next = startLot;
      else if (step.axis === "week") next = byCell.get(`${current.col + step.sign}:${current.row}`) ?? current;
      else next = city.lots[current.slot + step.sign] ?? current;
      if (!next) return;
      if (next === current) setAnnounce(announcement(next));
      else select(next, "key");
      return;
    }
    switch (event.key) {
      case "Home":
      case "End": {
        const lots = city.lots;
        const next = event.key === "Home" ? lots[0] : lots[lots.length - 1];
        if (!next) return;
        event.preventDefault();
        setUsed(true);
        if (next === selectedRef.current) setAnnounce(announcement(next));
        else select(next, "key");
        return;
      }
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
      case "Escape":
        if (selectedRef.current) {
          event.preventDefault();
          select(null);
        }
        return;
    }
  };

  const label = `Commit city, GitHub contributions in ${city.year}`;
  const keys =
    "One lot per day, each building as tall as that day's count. Left and right arrows walk the weeks, up and down arrows the days, Home and End jump to the first and the latest day, Q and E turn the city.";

  const hint = keysHint ? "← → ↑ ↓ walk the days · Q E turn" : fine ? "Drag to turn · hover a building" : "Swipe to turn · tap a building";
  const hintHidden = used && !keysHint;

  const controlClass =
    "grid size-8 cursor-pointer place-items-center rounded-[10px] text-tertiary outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-well hover:text-primary active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 cursor-grab overflow-hidden rounded-[inherit] select-none data-turning:cursor-grabbing"
      style={{ touchAction: "pan-y pinch-zoom" }}
      data-turning={turning ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={(event) => {
        // Only the capture the turn took on this element ends it (a finger's
        // implicit capture on the region below is handed over when it starts).
        if (event.target === event.currentTarget) endPointer(event);
      }}
      onPointerLeave={onPointerLeave}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />

      {/* The city as a keyboard-walkable region. */}
      <div
        role="application"
        tabIndex={0}
        aria-roledescription="model city"
        aria-label={label}
        aria-describedby={describedBy ? `${describedBy} ${keysId}` : keysId}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End Q E"
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          // Keyboard focus holds the city still; a click or tap that focuses it doesn't.
          try {
            if (event.currentTarget.matches(":focus-visible")) {
              focused.current = true;
              setKeysHint(true);
            }
          } catch {}
          wake();
        }}
        onBlur={() => {
          focused.current = false;
          setKeysHint(false);
          if (!hovering.current) select(null);
          wake();
        }}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"
      />

      <div
        ref={tooltipRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-[5] rounded-[8px] bg-float px-2 py-1 text-[12px] whitespace-nowrap text-primary opacity-0 shadow-float transition-opacity duration-150 ease-out"
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

      <p
        aria-hidden="true"
        className={`pointer-events-none absolute start-4 top-3 text-[12px]/[18px] text-tertiary transition-opacity duration-500 ease-out ${hintHidden ? "opacity-0" : "opacity-100"}`}
      >
        {hint}
      </p>

      <div data-city-controls="" className="absolute end-2 top-2 z-[6] flex gap-0.5">
        <button type="button" aria-label="Turn the city anticlockwise" className={controlClass} onClick={() => turn(-1)}>
          <TurnGlyph />
        </button>
        <button type="button" aria-label="Turn the city clockwise" className={controlClass} onClick={() => turn(1)}>
          <TurnGlyph clockwise />
        </button>
      </div>

      <p id={keysId} className="sr-only">
        {keys}
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

/**
 * The card's turn buttons: a plain circular arrow (16 × 16, 1.5px round
 * strokes, currentColor), its arrowhead drawn square to the pixel grid so
 * it stays crisp at 1x. The stage keeps its own glyph (icons.tsx), which
 * sits in a tray and reads at its larger zoom.
 */
function TurnGlyph({ clockwise = false }: { clockwise?: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      style={clockwise ? { transform: "scaleX(-1)" } : undefined}
    >
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {/* Round from nine o'clock, under and over, back to half past ten. */}
        <path d="M2.75 8.5A5.25 5.25 0 1 0 4.29 4.79L3.25 5.75" />
        <path d="M3.25 2.6v3.15h3.2" />
      </g>
    </svg>
  );
}
