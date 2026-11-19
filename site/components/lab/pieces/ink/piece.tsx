"use client";

// Ink: a dish of water you pour ink into and stir. A GPU fluid (fluid.ts)
// carries the flow and the ink; this file turns the pointer into pushes and
// ink, runs the tile's self-stirring, the first drops on the stage, the
// keyboard, the palette and the sound.
//
// - Mouse over the water: stirs what is there (a push, no ink).
// - Press and drag: pours a line of ink along the stroke and stirs it;
//   held still, it keeps pouring. A quick tap lets a drop fall and bloom.
// - Keys: Space / Enter drops ink, arrows push a current, R rinses, 1–3
//   change the ink.
// - Tile: an unseen hand stirs in slow loops, a drop now and then (30 fps).
// - Reduced motion: no ambient current; the stage moves only under your
//   hand, the tile is a still made by running a stirred dish to rest.
// - The stage sleeps after a long quiet spell (the print stays on screen).

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { ensureAudio, getAudio, isMuted } from "../../audio";
import { clamp, damp, useFinePointer, useFrame, useWebGL2 } from "../../hooks";
import { Reset } from "../../lab-icons";
import type { PieceProps } from "../../types";
import { IconButton, MuteButton, StageControls, StageHint, Swatches, Tray, TrayDivider, TrayRow } from "../../ui";
import { InkFluid } from "./fluid";
import { plip, rinse as rinseSound, Swish } from "./sound";

type InkId = "spectrum" | "indigo" | "mono";

const INKS: ReadonlyArray<{ value: InkId; label: string; swatch: string }> = [
  {
    value: "spectrum",
    label: "Spectrum",
    swatch: "conic-gradient(from 200deg,#e0403a,#e9a23b,#3fae6a,#2f7fd0,#8b4fd6,#e0403a)",
  },
  { value: "indigo", label: "Indigo", swatch: "linear-gradient(135deg,#16245e,#2f86c8)" },
  { value: "mono", label: "Mono", swatch: "linear-gradient(135deg,#0d0d0f,#6b6b70)" },
];

const PAPER = [0.962, 0.952, 0.928] as const;
const DEEP = [0.022, 0.022, 0.028] as const;
/** Quiet seconds before the stage's current fades and the loop sleeps. */
const SETTLE_AFTER = 22;

function hsl(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

/** The ink's colour now (`t` walks along the stroke), for paper or the dark. */
function inkColor(id: InkId, t: number, night: boolean): [number, number, number] {
  if (id === "spectrum") return night ? hsl(t % 1, 0.9, 0.58) : hsl(t % 1, 0.78, 0.42);
  if (id === "indigo") {
    const k = 0.5 + 0.5 * Math.sin(t * 9);
    return night
      ? [0.12 + 0.06 * k, 0.32 + 0.45 * k, 1.0]
      : [0.07 + 0.02 * k, 0.12 + 0.22 * k, 0.42 + 0.22 * k];
  }
  return night ? [0.86, 0.87, 0.92] : [0.05, 0.05, 0.06];
}

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const rootRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<InkFluid | null>(null);
  const swishRef = useRef(new Swish());
  const hintId = useId();
  const fine = useFinePointer();
  const [ink, setInk] = useState<InkId>("spectrum");
  const [touched, setTouched] = useState(false);
  const [broken, setBroken] = useState(false);
  const [announce, setAnnounce] = useState("");

  const [L] = useState(() => ({
    ink: "spectrum" as InkId,
    night: theme === "dark" ? 1 : 0,
    theme,
    reduced: reducedMotion,
    /** The pointer: over the water, pressed, where (CSS px), where it was last frame. */
    over: false,
    down: false,
    id: -1,
    x: 0,
    y: 0,
    fx: 0,
    fy: 0,
    downAt: 0,
    downX: 0,
    downY: 0,
    moved: false,
    /** Walks along the strokes (the spectrum's hue). */
    hue: Math.random(),
    /** Queued drops (x, y 0…1, size) and keyboard pushes. */
    drops: [] as Array<[number, number, number]>,
    pushes: [] as Array<[number, number]>,
    /** Seconds left of a rinse. */
    rinse: 0,
    lastInput: performance.now() / 1000,
    time: 0,
    acc: 0,
    /** Tile: the unseen hand, and when its next drop falls. */
    nextDrop: 1.2,
    stir: 0,
    /** The stage's first drops have been queued. */
    dealt: false,
  }));
  L.ink = ink;
  L.theme = theme;
  L.reduced = reducedMotion;

  const nudge = useCallback(() => {
    L.lastInput = performance.now() / 1000;
    wakeRef.current();
  }, [L]);
  const wakeRef = useRef<() => void>(() => {});

  /** Queue the stage's first three drops (or run a stirred dish to rest when motion is reduced). */
  const seed = useCallback(
    (fluid: InkFluid, cssW: number, cssH: number) => {
      const night = L.theme === "dark";
      const spots: Array<[number, number, number]> = [
        [0.36, 0.62, 1],
        [0.64, 0.5, 0.8],
        [0.45, 0.34, 0.9],
      ];
      if (!L.reduced) {
        if (stage) L.drops.push(...spots);
        return;
      }
      // a still: a few drops and a slow stir, run until it rests
      for (const [x, y, s] of spots) {
        const [r, g, b] = inkColor(L.ink, (L.hue += 0.21), night);
        fluid.splat(x, y, 0, 0, r, g, b, 1.6 * s, 0.006 * s);
        fluid.bloom(x, y, 260 * s, 0.006 * s);
      }
      for (let i = 0; i < 140; i++) {
        const t = i / 60;
        const x = 0.5 + 0.3 * Math.sin(t * 1.7);
        const y = 0.5 + 0.25 * Math.sin(t * 2.3 + 1);
        fluid.splat(x, y, Math.cos(t * 1.7) * 0.3 * 1.7 * cssW, Math.cos(t * 2.3 + 1) * 0.25 * 2.3 * cssH, 0, 0, 0, 0, 0.003);
        fluid.step(1 / 60, 0.3, 1);
      }
    },
    [L, stage],
  );

  const wake = useFrame(active && !broken, (rawDt) => {
    const fluid = fluidRef.current;
    const size = sizeRef.current;
    if (!fluid || size.width < 2) return false;
    let dt = rawDt;
    // the tile runs at 30 fps
    if (!stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    dt = Math.min(dt, 1 / 30);
    L.time += dt;
    const now = performance.now() / 1000;
    const idle = now - L.lastInput;
    const reduced = L.reduced;
    const night = L.theme === "dark";
    const { width, height } = size;
    const strokeR = stage ? 0.0011 : 0.0016;
    /** The stroke's width (one sigma of its splats), CSS px. */
    const sigma = Math.sqrt(strokeR) * height;

    /**
     * A stroke from (x0, y0) to (x1, y1) CSS px in `dt`: splats half a
     * sigma apart, each carrying its share of the push (and of the ink), so
     * the water under the path ends up moving with it and the line of ink
     * is as dense at any speed.
     */
    const stroke = (x0: number, y0: number, x1: number, y1: number, push: number, ink: number) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.hypot(dx, dy);
      const steps = clamp(Math.ceil(dist / (sigma * 0.5)), 1, 16);
      const share = dist / steps / (sigma * 1.77);
      const vx = (dx / dt) * push * share;
      const vy = (-dy / dt) * push * share;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        let r = 0;
        let g = 0;
        let b = 0;
        if (ink > 0) {
          L.hue += (dist / steps) * 0.0007;
          [r, g, b] = inkColor(L.ink, L.hue, night);
        }
        fluid.splat((x0 + dx * t) / width, 1 - (y0 + dy * t) / height, vx, vy, r, g, b, ink * share, strokeR);
      }
      return dist;
    };

    // the pointer: a push along its path, and ink while pressed
    if (L.over || L.down) {
      const dist = Math.hypot(L.x - L.fx, L.y - L.fy);
      if (dist > 0.25) {
        stroke(L.fx, L.fy, L.x, L.y, L.down ? 1 : 0.7, L.down ? 0.8 : 0);
        swishRef.current.set(getAudio(), Math.min(1, dist / dt / 2200));
      } else {
        swishRef.current.set(getAudio(), 0);
        if (L.down && now - L.downAt > 0.25) {
          // held still: it keeps pouring, a little wider
          const [r, g, b] = inkColor(L.ink, (L.hue += dt * 0.05), night);
          fluid.splat(L.x / width, 1 - L.y / height, 0, 0, r, g, b, dt * 1.4, strokeR * 2.2);
        }
      }
      L.fx = L.x;
      L.fy = L.y;
    }

    // drops (taps, keys, the first ones on the stage)
    while (L.drops.length) {
      const [x, y, s] = L.drops.shift()!;
      const [r, g, b] = inkColor(L.ink, (L.hue += 0.19), night);
      const radius = (stage ? 0.0042 : 0.006) * s;
      fluid.splat(x, y, 0, 0, r, g, b, 1.7 * s, radius);
      fluid.bloom(x, y, (stage ? 340 : 160) * s, radius * 1.3);
      const kit = getAudio();
      if (stage && kit && !isMuted()) plip(kit, s);
    }
    // keyboard currents: a broad push across the middle
    while (L.pushes.length) {
      const [px, py] = L.pushes.shift()!;
      for (let i = 0; i < 5; i++) {
        const t = (i + 0.5) / 5;
        const x = px === 0 ? 0.2 + 0.6 * t : 0.5 - px * 0.25;
        const y = py === 0 ? 0.2 + 0.6 * t : 0.5 - py * 0.25;
        fluid.splat(x, y, px * 900, py * 900, 0, 0, 0, 0, 0.004);
      }
    }

    if (!stage) {
      // the tile: an unseen hand stirring in slow loops
      if (!reduced) {
        const hand = (t: number, out: number[]) => {
          out[0] = (0.5 + 0.3 * Math.sin(t * 0.9)) * width;
          out[1] = (0.5 + 0.27 * Math.sin(t * 1.23 + 1.1)) * height;
        };
        const a = [0, 0];
        const b = [0, 0];
        hand(L.time - dt, a);
        hand(L.time, b);
        stroke(a[0], a[1], b[0], b[1], 1.4, 0.9);
        L.nextDrop -= dt;
        if (L.nextDrop <= 0) {
          L.nextDrop = 3.2 + Math.random() * 2;
          L.drops.push([0.25 + Math.random() * 0.5, 0.25 + Math.random() * 0.5, 0.8]);
        }
      }
    } else if (!reduced && idle < SETTLE_AFTER + 4) {
      // a faint current keeps the dish alive, fading after a quiet spell
      const fade = clamp((SETTLE_AFTER + 4 - idle) / 4);
      const t = L.time;
      // a gentle force (about 40 px/s settled against the drag)
      fluid.splat(
        0.5 + 0.35 * Math.sin(t * 0.21),
        0.5 + 0.3 * Math.sin(t * 0.17 + 2),
        Math.cos(t * 0.31) * 40 * dt * fade,
        Math.sin(t * 0.27) * 40 * dt * fade,
        0,
        0,
        0,
        0,
        0.02,
      );
    }

    // a rinse washes the ink away over about a second
    let inkKeep = stage ? 0.975 : 0.9;
    let flowKeep = 0.35;
    if (L.rinse > 0) {
      L.rinse -= dt;
      inkKeep = 0.02;
      flowKeep = 0.6;
    }
    fluid.step(dt, flowKeep, inkKeep);

    // the theme eases over
    const nightGoal = night ? 1 : 0;
    L.night = reduced ? nightGoal : damp(L.night, nightGoal, 6, dt);
    if (Math.abs(L.night - nightGoal) < 0.003) L.night = nightGoal;
    const canvas = canvasRef.current;
    if (canvas) fluid.render(canvas.width, canvas.height, L.night, PAPER, DEEP);

    // sleep: the stage after a long quiet spell, a reduced tile at once
    const busy = L.down || L.drops.length > 0 || L.rinse > 0 || L.night !== nightGoal;
    if (stage) {
      if (!busy && idle > (reduced ? 3 : SETTLE_AFTER + 6)) return false;
    } else if (reduced && !busy) return false;
  });
  wakeRef.current = wake;

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? 2 : 1.25,
    attributes: { alpha: false, antialias: false, premultipliedAlpha: false, depth: false, stencil: false },
    onContext: (gl) => {
      let fluid: InkFluid;
      try {
        fluid = new InkFluid(gl, stage ? { sim: 128, dye: 512 } : { sim: 56, dye: 168 });
      } catch (error) {
        console.error(error);
        setBroken(true);
        return;
      }
      fluidRef.current = fluid;
      const { width, height } = sizeRef.current;
      fluid.resize(width, height);
      if (!L.dealt) {
        L.dealt = true;
        seed(fluid, width, height);
      }
      wake();
      return () => {
        fluid.dispose();
        fluidRef.current = null;
      };
    },
    onResize: (next) => {
      fluidRef.current?.resize(next.width, next.height);
      wake();
    },
  });

  useEffect(() => {
    wake();
  }, [theme, wake]);

  // stop the swish when the piece pauses or goes away
  useEffect(() => {
    const swish = swishRef.current;
    if (!active) swish.stop();
    return () => swish.stop();
  }, [active]);

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect ? [event.clientX - rect.left, event.clientY - rect.top] : [0, 0];
  };

  const begin = () => {
    if (!touched) setTouched(true);
    const kit = ensureAudio();
    if (kit) swishRef.current.start(kit);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!stage || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    const [x, y] = local(event);
    rootRef.current?.setPointerCapture(event.pointerId);
    L.down = true;
    L.id = event.pointerId;
    L.x = L.fx = L.downX = x;
    L.y = L.fy = L.downY = y;
    L.downAt = performance.now() / 1000;
    L.moved = false;
    begin();
    nudge();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    if (L.down && event.pointerId !== L.id) return;
    const [x, y] = local(event);
    if (!L.down) {
      if (event.pointerType !== "mouse") return;
      if (!L.over) {
        L.over = true;
        L.fx = x;
        L.fy = y;
      }
    }
    L.x = x;
    L.y = y;
    if (Math.hypot(x - L.downX, y - L.downY) > 6) L.moved = true;
    nudge();
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!L.down || event.pointerId !== L.id) return;
    L.down = false;
    L.id = -1;
    const quick = performance.now() / 1000 - L.downAt < 0.3;
    if (!L.moved && quick && event.type === "pointerup") {
      const { width, height } = sizeRef.current;
      L.drops.push([L.x / width, 1 - L.y / height, 1]);
    }
    if (event.pointerType !== "mouse") L.over = false;
    swishRef.current.set(getAudio(), 0);
    nudge();
  };

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || L.down) return;
    L.over = false;
    swishRef.current.set(getAudio(), 0);
  };

  const dropSomewhere = () => {
    L.drops.push([0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.9 + Math.random() * 0.2]);
    nudge();
  };

  const rinse = () => {
    L.rinse = 1.1;
    const kit = ensureAudio();
    if (kit && !isMuted()) rinseSound(kit);
    setAnnounce("Rinsed: the water is clear");
    nudge();
  };

  const chooseInk = (value: InkId) => {
    setInk(value);
    setAnnounce(`${INKS.find((i) => i.value === value)?.label} ink`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      begin();
      dropSomewhere();
    } else if (key.startsWith("Arrow")) {
      event.preventDefault();
      const dir: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, 1],
        ArrowDown: [0, -1],
      };
      L.pushes.push(dir[key] ?? [0, 0]);
      begin();
      nudge();
    } else if (key === "r" || key === "R") {
      rinse();
    } else if (key === "1" || key === "2" || key === "3") {
      chooseInk(INKS[Number(key) - 1].value);
    }
  };

  const fallback = supported === false || broken;

  if (!stage) {
    return (
      <div ref={rootRef} aria-hidden="true" className="absolute inset-0">
        {fallback ? <Fallback /> : <canvas ref={canvasRef} className="absolute inset-0 size-full" />}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 select-none [-webkit-tap-highlight-color:transparent]"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      {fallback ? <Fallback /> : <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />}
      <div
        tabIndex={fallback ? undefined : 0}
        role="img"
        aria-label="A dish of water with ink swirling in it"
        aria-describedby={hintId}
        onKeyDown={fallback ? undefined : onKeyDown}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"
      />
      <p id={hintId} className="sr-only">
        Ink in water. Space or Enter drops ink, the arrow keys push a current through the water, R rinses the dish clear,
        and 1 to 3 change the ink. With a pointer: press and drag to pour and stir, and tap to drop ink.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <StageControls placement="bottom">
        <TrayRow>
          <Tray label="Ink">
            <Swatches label="Ink" options={INKS} value={ink} onChange={chooseInk} />
          </Tray>
          {fallback ? null : (
            <Tray label="Dish">
              <IconButton label="Rinse the dish" onClick={rinse}>
                <Reset size={16} />
              </IconButton>
              <TrayDivider />
              <MuteButton />
            </Tray>
          )}
        </TrayRow>
        <StageHint className={cn("transition-opacity duration-700", touched && "opacity-0")}>
          {fallback
            ? "A still: this browser can't run the live fluid"
            : fine
              ? "Drag to pour and stir · move over the water to push the ink · click for a drop"
              : "Drag to pour and stir · tap for a drop"}
        </StageHint>
      </StageControls>
    </div>
  );
}

/** A still of marbled ink, for browsers without WebGL2 or half-float targets. */
function Fallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[#f5f3ee] dark:bg-[#060607]"
      style={{
        backgroundImage:
          "radial-gradient(40% 30% at 35% 40%, rgb(47 127 208 / 0.55), transparent 70%), radial-gradient(35% 28% at 64% 52%, rgb(224 64 58 / 0.45), transparent 70%), radial-gradient(30% 25% at 46% 68%, rgb(233 162 59 / 0.45), transparent 70%)",
      }}
    />
  );
}
