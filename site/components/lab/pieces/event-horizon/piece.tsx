"use client";

// Event horizon: a black hole you fly around. The shader (shaders.ts) bends
// every ray of light round the hole; this file is the camera (an orbit with
// inertia), the flares you drop into the disk, the frame-rate safety net,
// the keyboard and the sound.
//
// - Drag: orbit (yaw and pitch, with inertia on release). Pinch, a trackpad
//   pinch (ctrl + wheel) or + / − move closer or further.
// - Tap the disk: a clump of gas lands where you tapped (anywhere else: at
//   random), flares, shears along its orbit and fades.
// - Idle: the camera drifts slowly round; after a quiet spell the stage
//   drops to 30 fps. The tile drifts too, at 30 fps and lower resolution.
// - Reduced motion: the disk holds still and the camera only moves under
//   your hand; a flare plays out (time runs while one is alive).

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { ensureAudio, getAudio, isMuted } from "../../audio";
import { clamp, damp, useFinePointer, useFrame, useWebGL2 } from "../../hooks";
import type { PieceProps } from "../../types";
import { MuteButton, StageControls, StageHint, Tray, TrayRow } from "../../ui";
import { HoleRenderer, type HoleFrame } from "./renderer";
import { Drone, rush } from "./sound";

/** Scene resolution steps (fraction of the canvas) the safety net walks down. */
const SCALES = [1, 0.8, 0.64, 0.5] as const;
const DIST = { min: 8.5, max: 24, rest: 15 } as const;
const PITCH = { min: -1.25, max: 1.25, rest: 0.13 } as const;
/** The field of view: tan of half the vertical angle. */
const TAN_HALF = 0.42;
const QUIET = 12;
const FLARE_LIFE = 7;

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const rootRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<HoleRenderer | null>(null);
  const droneRef = useRef(new Drone());
  const hintId = useId();
  const fine = useFinePointer();
  const [touched, setTouched] = useState(false);
  const [broken, setBroken] = useState(false);
  const [announce, setAnnounce] = useState("");

  const [L] = useState(() => ({
    yaw: 0.6,
    pitch: PITCH.rest as number,
    dist: stage ? DIST.rest : DIST.rest + 2,
    yawV: 0,
    pitchV: 0,
    distGoal: stage ? DIST.rest : DIST.rest + 2,
    night: theme === "dark" ? 1 : 0,
    theme,
    reduced: reducedMotion,
    time: 3,
    acc: 0,
    lastInput: performance.now() / 1000,
    /** Pointers on the stage (for drag and pinch). */
    pts: new Map<number, { x: number; y: number }>(),
    pinch: 0,
    downAt: 0,
    downX: 0,
    downY: 0,
    moved: false,
    /** Smoothed drag speed (rad / s), for the inertia and the drone. */
    dragYawV: 0,
    dragPitchV: 0,
    lastMove: 0,
    flares: new Float32Array(16),
    nextFlare: 0,
    scaleStep: 0,
    perf: { time: 0, slow: 0 },
    frame: {
      cam: new Float32Array(3),
      basis: new Float32Array(9),
      tanHalf: TAN_HALF,
      time: 0,
      night: 0,
      flares: new Float32Array(16),
      scale: 1,
    } as HoleFrame,
  }));
  L.theme = theme;
  L.reduced = reducedMotion;

  const wakeRef = useRef<() => void>(() => {});
  const nudge = useCallback(() => {
    L.lastInput = performance.now() / 1000;
    wakeRef.current();
  }, [L]);

  // coarse pointers (phones) start a step down
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) L.scaleStep = 1;
  }, [L]);

  /** Camera position and basis for the current orbit, into L.frame. */
  const aim = () => {
    const f = L.frame;
    const cp = Math.cos(L.pitch);
    const cam = f.cam;
    cam[0] = L.dist * cp * Math.sin(L.yaw);
    cam[1] = L.dist * Math.sin(L.pitch);
    cam[2] = L.dist * cp * Math.cos(L.yaw);
    // back = cam / |cam|; right = up × back; up' = back × right
    const bx = cam[0] / L.dist;
    const by = cam[1] / L.dist;
    const bz = cam[2] / L.dist;
    let rx = bz;
    let rz = -bx;
    const rl = Math.hypot(rx, rz) || 1;
    rx /= rl;
    rz /= rl;
    const ux = by * rz;
    const uy = bz * rx - bx * rz;
    const uz = -by * rx;
    const b = f.basis;
    b[0] = rx;
    b[1] = 0;
    b[2] = rz;
    b[3] = ux;
    b[4] = uy;
    b[5] = uz;
    b[6] = bx;
    b[7] = by;
    b[8] = bz;
  };

  /** Drop a clump of gas: where (CSS px) lands on the disk, else somewhere random. */
  const flare = (x?: number, y?: number) => {
    let r = 3.6 + Math.random() * 4;
    let phi = Math.random() * Math.PI * 2;
    const { width, height } = sizeRef.current;
    if (x !== undefined && y !== undefined && width > 0) {
      aim();
      const f = L.frame;
      const nx = ((x / width) * 2 - 1) * (width / height) * TAN_HALF;
      const ny = (1 - (y / height) * 2) * TAN_HALF;
      const b = f.basis;
      const dx = b[0] * nx + b[3] * ny - b[6];
      const dy = b[1] * nx + b[4] * ny - b[7];
      const dz = b[2] * nx + b[5] * ny - b[8];
      const t = -f.cam[1] / dy;
      if (t > 0) {
        const hx = f.cam[0] + dx * t;
        const hz = f.cam[2] + dz * t;
        const hr = Math.hypot(hx, hz);
        if (hr > 2.9 && hr < 10.5) {
          r = hr;
          phi = Math.atan2(hz, hx);
        }
      }
    }
    const slot = L.nextFlare;
    L.nextFlare = (slot + 1) % 4;
    L.flares.set([r, phi, L.time, 1], slot * 4);
    const kit = getAudio();
    if (stage && kit && !isMuted()) rush(kit);
    nudge();
  };

  const wake = useFrame(active && !broken, (rawDt) => {
    const renderer = rendererRef.current;
    if (!renderer || sizeRef.current.width < 2) return false;
    const now = performance.now() / 1000;
    const idle = now - L.lastInput;
    const reduced = L.reduced;
    let dt = rawDt;
    // the tile, and a quiet stage, run at 30 fps
    if (!stage || (idle > QUIET && L.pts.size === 0)) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = Math.min(0.1, L.acc);
      L.acc = 0;
    } else L.acc = 0;

    // flares alive (time runs for them even with reduced motion)
    let flaring = false;
    for (let i = 0; i < 4; i++) {
      if (L.flares[i * 4 + 3] <= 0) continue;
      if (L.time - L.flares[i * 4 + 2] > FLARE_LIFE) L.flares[i * 4 + 3] = 0;
      else flaring = true;
    }
    if (!reduced || flaring) L.time += dt;

    // the orbit: inertia, a slow drift when nobody's holding it
    const holding = L.pts.size > 0;
    if (!holding) {
      const k = Math.exp(-dt * 2.2);
      L.yawV *= k;
      L.pitchV *= k;
      L.yaw += L.yawV * dt;
      L.pitch += L.pitchV * dt;
      if (!reduced) {
        L.yaw += dt * (stage ? 0.045 : 0.08);
        // the tile bobs a little above and below the disk
        if (!stage) L.pitch = PITCH.rest + 0.16 * Math.sin(L.time * 0.21);
      }
    }
    // soft walls on the pitch
    if (L.pitch > PITCH.max) {
      L.pitch = damp(L.pitch, PITCH.max, 10, dt);
      L.pitchV = Math.min(L.pitchV, 0);
    } else if (L.pitch < PITCH.min) {
      L.pitch = damp(L.pitch, PITCH.min, 10, dt);
      L.pitchV = Math.max(L.pitchV, 0);
    }
    L.dist = reduced ? L.distGoal : damp(L.dist, L.distGoal, 6, dt);

    // the theme eases over
    const nightGoal = L.theme === "dark" ? 1 : 0;
    L.night = reduced ? nightGoal : damp(L.night, nightGoal, 5, dt);
    if (Math.abs(L.night - nightGoal) < 0.003) L.night = nightGoal;

    // the drone follows how fast the view turns
    if (stage) {
      const speed = Math.hypot(holding ? L.dragYawV : L.yawV, holding ? L.dragPitchV : L.pitchV);
      droneRef.current.set(getAudio(), idle < QUIET ? clamp(speed / 3) : -1);
    }

    // frames running slow for a while: draw the scene smaller
    if (stage && L.scaleStep < SCALES.length - 1) {
      const perf = L.perf;
      perf.time += rawDt;
      if (rawDt > 1 / 42) perf.slow += rawDt;
      if (perf.time >= 1.5) {
        if (perf.slow > perf.time * 0.6) L.scaleStep += 1;
        perf.time = 0;
        perf.slow = 0;
      }
    }

    aim();
    const f = L.frame;
    f.time = L.time;
    f.night = L.night;
    f.flares.set(L.flares);
    f.scale = stage ? SCALES[L.scaleStep] : 0.7;
    renderer.draw(f);

    // reduced motion: sleep once nothing moves
    if (reduced) {
      const still =
        !holding &&
        !flaring &&
        Math.abs(L.yawV) < 0.002 &&
        Math.abs(L.pitchV) < 0.002 &&
        Math.abs(L.dist - L.distGoal) < 0.01 &&
        L.night === nightGoal;
      if (still) return false;
    }
  });
  wakeRef.current = wake;

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: stage ? 1.5 : 1,
    attributes: { alpha: false, antialias: false, premultipliedAlpha: false, depth: false, stencil: false },
    onContext: (gl) => {
      let renderer: HoleRenderer;
      try {
        renderer = new HoleRenderer(gl);
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
    onResize: () => wake(),
  });

  useEffect(() => {
    wake();
  }, [theme, reducedMotion, wake]);

  useEffect(() => {
    const drone = droneRef.current;
    if (!active) drone.stop();
    return () => drone.stop();
  }, [active]);

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : { x: 0, y: 0 };
  };

  const begin = () => {
    if (!touched) setTouched(true);
    const kit = ensureAudio();
    if (kit) droneRef.current.start(kit);
  };

  const spread = () => {
    const [a, b] = [...L.pts.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button > 0) return;
    if ((event.target as Element).closest("[data-lab-controls]")) return;
    rootRef.current?.setPointerCapture(event.pointerId);
    const p = local(event);
    L.pts.set(event.pointerId, p);
    if (L.pts.size === 1) {
      L.downAt = performance.now() / 1000;
      L.downX = p.x;
      L.downY = p.y;
      L.moved = false;
      L.yawV = L.pitchV = 0;
      L.dragYawV = L.dragPitchV = 0;
      L.lastMove = event.timeStamp;
    } else {
      L.pinch = spread();
      L.moved = true;
    }
    begin();
    nudge();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const prev = L.pts.get(event.pointerId);
    if (!prev) return;
    const p = local(event);
    if (L.pts.size >= 2) {
      L.pts.set(event.pointerId, p);
      const s = spread();
      if (L.pinch > 0 && s > 0) L.distGoal = clamp(L.distGoal * (L.pinch / s), DIST.min, DIST.max);
      L.pinch = s;
      nudge();
      return;
    }
    const dx = p.x - prev.x;
    const dy = p.y - prev.y;
    L.pts.set(event.pointerId, p);
    if (Math.hypot(p.x - L.downX, p.y - L.downY) > 6) L.moved = true;
    const k = 4.2 / Math.max(240, sizeRef.current.height);
    L.yaw -= dx * k;
    L.pitch = clamp(L.pitch + dy * k * 0.8, PITCH.min - 0.15, PITCH.max + 0.15);
    const dt = Math.max(1e-3, (event.timeStamp - L.lastMove) / 1000);
    L.lastMove = event.timeStamp;
    const a = 1 - Math.exp(-dt / 0.06);
    L.dragYawV += ((-dx * k) / dt - L.dragYawV) * a;
    L.dragPitchV += ((dy * k * 0.8) / dt - L.dragPitchV) * a;
    nudge();
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!L.pts.has(event.pointerId)) return;
    L.pts.delete(event.pointerId);
    if (L.pts.size > 0) {
      L.pinch = 0;
      return;
    }
    const quick = performance.now() / 1000 - L.downAt < 0.3;
    if (!L.moved && quick && event.type === "pointerup") {
      flare(L.downX, L.downY);
    } else if (event.timeStamp - L.lastMove < 80) {
      // let go mid-swing: it keeps turning
      L.yawV = clamp(L.dragYawV, -4, 4);
      L.pitchV = clamp(L.dragPitchV, -3, 3);
    }
    nudge();
  };

  // a trackpad pinch arrives as ctrl + wheel; plain scrolling scrolls the page
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !stage) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      L.distGoal = clamp(L.distGoal * Math.exp(event.deltaY * 0.01), DIST.min, DIST.max);
      nudge();
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [L, stage, nudge]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    const push: Record<string, [number, number]> = {
      ArrowLeft: [1.4, 0],
      ArrowRight: [-1.4, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    if (push[key]) {
      event.preventDefault();
      L.yawV += push[key][0];
      L.pitchV += push[key][1];
      begin();
      nudge();
    } else if (key === "+" || key === "=") {
      L.distGoal = clamp(L.distGoal * 0.85, DIST.min, DIST.max);
      setAnnounce("Closer");
      nudge();
    } else if (key === "-" || key === "_") {
      L.distGoal = clamp(L.distGoal / 0.85, DIST.min, DIST.max);
      setAnnounce("Further");
      nudge();
    } else if (key === " " || key === "Enter") {
      event.preventDefault();
      begin();
      flare();
      setAnnounce("A clump of gas flares in the disk");
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
      className="absolute inset-0 select-none [-webkit-tap-highlight-color:transparent] cursor-grab active:cursor-grabbing"
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
        aria-label="A black hole with a glowing disk of gas, its gravity bending the light behind it"
        aria-describedby={hintId}
        onKeyDown={fallback ? undefined : onKeyDown}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"
      />
      <p id={hintId} className="sr-only">
        A black hole. The arrow keys fly around it, plus and minus move closer and further, and Space drops a clump of
        gas into the disk. With a pointer: drag to fly around, pinch to move closer, and tap the disk to drop in gas.
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
            ? "A still: this browser can't run the live scene"
            : fine
              ? "Drag to fly around · pinch to move closer · click the disk to drop in gas"
              : "Drag to fly around · pinch to zoom · tap the disk"}
        </StageHint>
      </StageControls>
    </div>
  );
}

/** A still of the hole and its ring, for browsers without WebGL2. */
function Fallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-[#f5f3ee] dark:bg-black">
      <div
        className="aspect-square w-[46%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, #000 0 38%, rgb(255 190 110) 40%, rgb(240 110 40 / 0.7) 47%, transparent 64%)",
        }}
      />
    </div>
  );
}
