"use client";

// Bubbles: soap bubbles you blow, waft and pop. sim.ts is the little world
// (breath, air, bumps, wobble, bursts), shaders.ts the soap film; this file
// is the wand under your pointer, the tile's self-play, the keyboard and the
// sound.
//
// - Press on empty air: a bubble grows on the wand at your pointer; let go
//   (or drag) and it floats off with your speed. Hold still and it grows
//   until it lets go on its own; sweep fast for a stream of small ones. A
//   quick tap on empty air puffs out a few small ones.
// - Press on a bubble: it pops, torn open from where you touched it.
// - Mouse over the stage: the air moves with the pointer and wafts them.
// - Keys: Space blows a bubble from below, P pops one, arrows blow a breeze.
// - Tile: a wand off the lower left blows one now and then (30 fps).
// - Reduced motion: bubbles stay where they're let go; no spray.

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { ensureAudio, getAudio, isMuted } from "../../audio";
import { damp, useFinePointer, useFrame, useWebGL2 } from "../../hooks";
import type { PieceProps } from "../../types";
import { MuteButton, StageControls, StageHint, Tray, TrayRow } from "../../ui";
import { BubbleRenderer } from "./renderer";
import { Froth, type Bubble } from "./sim";
import { Breath, pop as popSound } from "./sound";

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<BubbleRenderer | null>(null);
  const breathRef = useRef(new Breath());
  const hintId = useId();
  const fine = useFinePointer();
  const [touched, setTouched] = useState(false);
  const [broken, setBroken] = useState(false);
  const [announce, setAnnounce] = useState("");

  const [L] = useState(() => ({
    froth: new Froth(),
    night: theme === "dark" ? 1 : 0,
    theme,
    reduced: reducedMotion,
    time: 0,
    acc: 0,
    /** The wand: the bubble on it, the pointer, its smoothed velocity. */
    wand: null as Bubble | null,
    down: false,
    id: -1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lastT: 0,
    downAt: 0,
    downX: 0,
    downY: 0,
    moved: false,
    /** Tile: when the next bubble leaves the wand. */
    nextBlow: 0.4,
    seeded: false,
  }));
  L.theme = theme;
  L.reduced = reducedMotion;

  const wakeRef = useRef<() => void>(() => {});
  const nudge = useCallback(() => wakeRef.current(), []);

  /** A few bubbles already in the air when the stage opens. */
  const seed = useCallback(() => {
    const f = L.froth;
    if (L.seeded || f.w < 2) return;
    L.seeded = true;
    if (!stage) return;
    const m = f.maxRadius();
    const spots: Array<[number, number, number]> = [
      [0.32, 0.36, 0.85],
      [0.66, 0.3, 0.55],
      [0.56, 0.62, 0.7],
      [0.26, 0.68, 0.38],
    ];
    for (const [x, y, s] of spots) {
      const b = f.spawn(x * f.w, y * f.h, m * s, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10);
      b.age = 3 + Math.random() * 4;
      b.life = 30 + Math.random() * 20;
    }
  }, [L, stage]);

  /** Let the wand's bubble go with the pointer's speed. */
  const release = (vx: number, vy: number) => {
    const b = L.wand;
    if (!b) return;
    b.held = false;
    b.vx = vx;
    b.vy = vy;
    b.age = 0;
    b.v2 += 0.6;
    L.wand = null;
  };

  const startWand = () => {
    L.wand = L.froth.spawn(L.x, L.y, 6, 0, 0, true);
  };

  const wake = useFrame(active && !broken, (rawDt) => {
    const renderer = rendererRef.current;
    const f = L.froth;
    if (!renderer || f.w < 2) return false;
    let dt = rawDt;
    if (!stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    }
    dt = Math.min(dt, 1 / 30);
    L.time += dt;
    const reduced = L.reduced;

    // the wand: the bubble on it grows; at full size it lets go by itself
    const w = L.wand;
    if (w) {
      w.x = L.x;
      w.y = L.y;
      const speed = Math.hypot(L.vx, L.vy);
      const grow = 38 + Math.min(120, speed * 0.05);
      w.r += grow * dt;
      breathRef.current.set(getAudio(), 0.5 + Math.min(0.5, speed / 1500));
      if (w.r >= f.maxRadius()) {
        release(L.vx * 0.4, Math.min(-25, L.vy * 0.4));
        if (L.down) startWand();
      }
    } else breathRef.current.set(getAudio(), 0);

    // the tile: a wand off the lower left
    if (!stage && !reduced) {
      L.nextBlow -= dt;
      if (L.nextBlow <= 0) {
        L.nextBlow = 0.9 + Math.random() * 1.1;
        const m = f.maxRadius();
        const b = f.spawn(f.w * 0.12, f.h * 0.86, m * (0.35 + Math.random() * 0.55), 40 + Math.random() * 50, -20 - Math.random() * 30);
        b.life = 6 + Math.random() * 5;
      }
    }

    f.step(dt, reduced);

    // pops
    if (f.popped.length) {
      const kit = getAudio();
      if (stage && kit && !isMuted()) for (const r of f.popped.slice(0, 4)) popSound(kit, r);
      f.popped.length = 0;
    }

    const nightGoal = L.theme === "dark" ? 1 : 0;
    L.night = reduced ? nightGoal : damp(L.night, nightGoal, 5, dt);
    if (Math.abs(L.night - nightGoal) < 0.003) L.night = nightGoal;
    renderer.draw(f, L.night, reduced ? 0 : L.time);

    // sleep when the air is empty (or, with reduced motion, nothing is changing)
    const changing = L.wand !== null || f.bubbles.some((b) => b.pop >= 0) || f.drops.length > 0 || L.night !== nightGoal;
    if (stage && !changing && (reduced || f.bubbles.length === 0)) return false;
    if (!stage && reduced) return false;
  });
  wakeRef.current = wake;

  const { canvasRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? 2 : 1.5,
    attributes: { alpha: false, antialias: false, premultipliedAlpha: true, depth: false, stencil: false },
    onContext: (gl) => {
      let renderer: BubbleRenderer;
      try {
        renderer = new BubbleRenderer(gl);
      } catch (error) {
        console.error(error);
        setBroken(true);
        return;
      }
      rendererRef.current = renderer;
      wake();
      return () => {
        renderer.dispose();
        rendererRef.current = null;
      };
    },
    onResize: (size) => {
      L.froth.resize(size.width, size.height);
      seed();
      wake();
    },
  });

  useEffect(() => {
    wake();
  }, [theme, reducedMotion, wake]);

  useEffect(() => {
    const breath = breathRef.current;
    if (!active) breath.stop();
    return () => breath.stop();
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
    if (kit) breathRef.current.start(kit);
  };

  /** Follow the pointer and its velocity (smoothed), and push the air with it. */
  const track = (x: number, y: number, stamp: number) => {
    const dt = Math.max(1e-3, (stamp - L.lastT) / 1000);
    if (L.lastT > 0 && dt < 0.2) {
      const a = 1 - Math.exp(-dt / 0.05);
      L.vx += ((x - L.x) / dt - L.vx) * a;
      L.vy += ((y - L.y) / dt - L.vy) * a;
    } else {
      L.vx = L.vy = 0;
    }
    L.lastT = stamp;
    L.x = x;
    L.y = y;
    const air = L.froth.air;
    air.x = x;
    air.y = y;
    air.vx = L.vx;
    air.vy = L.vy;
    air.on = Math.min(1, Math.hypot(L.vx, L.vy) / 300);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!stage || event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    const [x, y] = local(event);
    begin();
    L.lastT = 0;
    track(x, y, event.timeStamp);
    const hit = L.froth.at(x, y);
    if (hit) {
      L.froth.burst(hit, x, y);
      nudge();
      return;
    }
    rootRef.current?.setPointerCapture(event.pointerId);
    L.down = true;
    L.id = event.pointerId;
    L.downAt = performance.now() / 1000;
    L.downX = x;
    L.downY = y;
    L.moved = false;
    startWand();
    nudge();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!stage) return;
    if (L.down && event.pointerId !== L.id) return;
    if (!L.down && event.pointerType !== "mouse") return;
    const [x, y] = local(event);
    track(x, y, event.timeStamp);
    if (Math.hypot(x - L.downX, y - L.downY) > 6) L.moved = true;
    // a fast sweep shakes the bubble off the wand: a stream of small ones
    const w = L.wand;
    if (w && w.r > 11 && Math.hypot(L.vx, L.vy) > 750) {
      release(L.vx * 0.5, L.vy * 0.5);
      startWand();
    }
    nudge();
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!L.down || event.pointerId !== L.id) return;
    L.down = false;
    L.id = -1;
    const quick = performance.now() / 1000 - L.downAt < 0.25;
    const w = L.wand;
    if (w && !L.moved && quick && event.type === "pointerup") {
      // a tap on empty air: the wand's bubble is gone, a puff of small ones instead
      L.froth.bubbles.splice(L.froth.bubbles.indexOf(w), 1);
      L.wand = null;
      const m = L.froth.maxRadius();
      for (let i = 0; i < 3; i++) {
        L.froth.spawn(L.x + (i - 1) * 14, L.y - i * 6, m * (0.18 + Math.random() * 0.2), (i - 1) * 50, -60 - Math.random() * 60);
      }
    } else release(L.vx * 0.55, L.vy * 0.55);
    nudge();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const f = L.froth;
    const key = event.key;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      begin();
      const m = f.maxRadius();
      f.spawn(f.w * (0.3 + Math.random() * 0.4), f.h - m * 1.2, m * (0.4 + Math.random() * 0.5), (Math.random() - 0.5) * 60, -90);
      setAnnounce(`${f.bubbles.length} ${f.bubbles.length === 1 ? "bubble" : "bubbles"}`);
      nudge();
    } else if (key === "p" || key === "P") {
      const b = [...f.bubbles].reverse().find((x) => x.pop < 0 && !x.held);
      if (b) {
        begin();
        f.burst(b);
        setAnnounce("Pop");
        nudge();
      }
    } else if (key.startsWith("Arrow")) {
      event.preventDefault();
      const dir: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const [dx, dy] = dir[key] ?? [0, 0];
      f.breeze.x += dx * 120;
      f.breeze.y += dy * 120;
      nudge();
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
    >
      {fallback ? <Fallback /> : <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />}
      <div
        tabIndex={fallback ? undefined : 0}
        role="img"
        aria-label="Soap bubbles floating in a bright room"
        aria-describedby={hintId}
        onKeyDown={fallback ? undefined : onKeyDown}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"
      />
      <p id={hintId} className="sr-only">
        Soap bubbles. Space or Enter blows a bubble, P pops one, and the arrow keys blow a breeze. With a pointer: press
        and hold on empty air to blow a bubble and let go to set it free, and tap a bubble to pop it.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <StageControls placement="bottom">
        {fallback ? null : (
          <TrayRow>
            <Tray label="Sound">
              <MuteButton />
            </Tray>
          </TrayRow>
        )}
        <StageHint className={cn("transition-opacity duration-700", touched && "opacity-0")}>
          {fallback
            ? "A still: this browser can't run the live bubbles"
            : fine
              ? "Hold to blow a bubble · drag to let it go · click one to pop it"
              : "Hold to blow · drag to let go · tap to pop"}
        </StageHint>
      </StageControls>
    </div>
  );
}

/** A still of a few bubbles, for browsers without WebGL2. */
function Fallback() {
  const bubbles = [
    { x: 34, y: 38, s: 30 },
    { x: 66, y: 30, s: 20 },
    { x: 56, y: 62, s: 24 },
  ];
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[#e6eaee] dark:bg-[#050506]">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.s}%`,
            aspectRatio: "1",
            background:
              "radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.7) 0 6%, transparent 14%), radial-gradient(circle, transparent 58%, rgb(140 120 255 / 0.25) 70%, rgb(80 220 200 / 0.3) 80%, rgb(255 170 80 / 0.35) 92%, transparent 100%)",
          }}
        />
      ))}
    </div>
  );
}
