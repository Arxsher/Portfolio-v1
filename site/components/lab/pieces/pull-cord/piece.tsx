"use client";

// Pull cord: a pendant lamp you switch with its cord.
//
// The look
// - A graphite enamel dome on a textile cable from a ceiling cup, seen from
//   a little below, so the rim reads as an ellipse with the white inside of
//   the shade and a clear globe bulb showing through it. Brass at the neck
//   and at the grommet on the rim where a braided cotton cord comes out,
//   ending in a turned porcelain pull.
// - Lit, the lamp throws a scallop of warm light down the wall (the shade
//   cuts it off above the rim), the cord and the pull cast soft shadows in
//   it, the inside of the shade glows and the room sits in the light
//   theme's greys. Dark, only the bulb's afterglow and the pull's
//   phosphorescent glaze are left, on the dark theme's greys.
//
// The motion (physics.ts, light.ts)
// - The cord is a Verlet/XPBD rope of 20 particles, the switch a preloaded
//   spring slider behind the grommet with a cam bump at the click point,
//   the lamp a heavy pendulum with a little give in its cable, all solved
//   together 600 times a second. Grab anywhere on the cord: the hand is a
//   force-capped spring, so the cord follows exactly until the switch is
//   all the way out, then the hand runs on ahead. Every gesture can be
//   interrupted: grab the pull mid-swing and it comes from where it is.
// - The "wow" second: draw the pull down. The braid slides out of the
//   grommet, the lamp tips toward your hand and dips on its cable, the
//   switch clicks. Lights out: the filament fades through orange, the room
//   goes dark around it, the pull starts to glow, and (with "Site theme"
//   on) the whole site goes dark with it. Pull again: the filament flares,
//   the scallop of light blooms onto the dark wall, then the room fills
//   with light outward from the lamp. Let go and the cord snaps home, the
//   pull bounces and swings, the lamp sways, and the light and the
//   shadows swing with it.
//
// Modes
// - Stage: everything above; tap the shade to set it swinging, ← → swing
//   the pull, Space / Enter / ↓ pull it (hold to keep it drawn). Linked to
//   the site theme by default: changing the theme elsewhere tugs the cord
//   by itself. Sound after a gesture: the click, the cord running home, a
//   rasp of braid through the grommet, the pull knocking the shade.
// - Tile: the same lamp, pulled every few seconds by an unseen hand,
//   lights out and on again; hovering asks for the next pull sooner. Never
//   touches the site theme.
// - Reduced motion: the cord still follows a drag but settles without
//   swinging, the light switches at once; the tile is a still at the
//   theme's state.
// - Frames: the loop sleeps once everything has settled. If a machine can't
//   hold the frame rate, the stage steps its pixel ratio down.

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { getResolvedTheme, setTheme } from "@/lib/theme";
import { ensureAudio } from "../../audio";
import { useFinePointer, useFrame, useLatest, useWebGL2 } from "../../hooks";
import type { PieceProps } from "../../types";
import { MuteButton, StageControls, StageHint, Toggle, Tray, TrayDivider } from "../../ui";
import { PullCord } from "./controller";
import { BEAD_LENGTH, BEAD_R1 } from "./geometry";
import { click, clink, filament, knock, Rasp, rearm } from "./sound";

export default function Piece(props: PieceProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Fallback {...props} />;
  return props.mode === "stage" ? <Stage {...props} onFail={() => setFailed(true)} /> : <Tile {...props} onFail={() => setFailed(true)} />;
}

type Props = PieceProps & { onFail: () => void };

/* ---------------------------------------------------------------------- */
/* shared                                                                  */
/* ---------------------------------------------------------------------- */

/** The canvas and its context for a lamp, and the frame-rate safety net. */
function useLampCanvas(lamp: PullCord, maxDpr: number, reserve: (width: number) => number, onFail: () => void) {
  const wakeRef = useRef<() => void>(() => {});
  const onFailRef = useLatest(onFail);
  const { canvasRef, supported } = useWebGL2({
    mode: lamp.mode,
    maxDpr,
    attributes: { antialias: false, alpha: false, premultipliedAlpha: true, preserveDrawingBuffer: false },
    onContext: (gl) => {
      try {
        lamp.attach(gl);
      } catch (error) {
        console.error(error);
        onFailRef.current();
        return;
      }
      lamp.render();
      wakeRef.current();
      return () => lamp.detach();
    },
    onResize: (size) => {
      lamp.resize(size.width, size.height, reserve(size.width));
      // the backing store was just cleared: draw before the browser shows it
      lamp.render();
      wakeRef.current();
    },
  });
  useEffect(() => {
    if (supported === false) onFailRef.current();
  }, [supported, onFailRef]);
  return { canvasRef, wakeRef };
}

/* ---------------------------------------------------------------------- */
/* tile                                                                    */
/* ---------------------------------------------------------------------- */

function Tile({ active, reducedMotion, theme, onFail }: Props) {
  const home = theme === "light";
  const [lamp] = useState(() => {
    const l = new PullCord("tile", home);
    l.setReduced(reducedMotion);
    if (!reducedMotion) l.sim.nudge(90);
    return l;
  });
  const homeRef = useLatest(home);
  const { canvasRef, wakeRef } = useLampCanvas(lamp, 1.5, () => 0, onFail);

  const wake = useFrame(active, (dt) => {
    lamp.tileLoop(dt, homeRef.current);
    const busy = lamp.step(dt);
    lamp.render();
    return busy || !reducedMotion;
  });
  wakeRef.current = wake;

  // reduced motion, or the theme changed: back to the theme's own state (with a pull)
  useEffect(() => {
    lamp.setReduced(reducedMotion);
    lamp.follow(home, !reducedMotion);
    wake();
  }, [reducedMotion, home, lamp, wake]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        lamp.hurry();
        wake();
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* stage                                                                   */
/* ---------------------------------------------------------------------- */

/** Room kept clear at the bottom of the stage for the hint and the tray. */
const reserveFor = (width: number) => (width < 640 ? 96 : 108);

type Box = { x: number; y: number; w: number; h: number };

function Stage({ active, reducedMotion, theme, onFail }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const beadRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const hintId = useId();

  const [linked, setLinked] = useState(true);
  const [on, setOn] = useState(theme === "light");
  const [touched, setTouched] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [dprCap, setDprCap] = useState(2);
  const [lamp] = useState(() => {
    const l = new PullCord("stage", theme === "light", 800, 575);
    l.setReduced(reducedMotion);
    if (!reducedMotion) {
      // arrive with a little life in it
      l.sim.nudge(150);
      l.sim.push(-0.04);
    }
    return l;
  });
  const linkedRef = useLatest(linked);
  const reducedRef = useLatest(reducedMotion);
  const rasp = useRef<Rasp | null>(null);
  const perf = useRef({ slow: 0 });
  const dom = useRef({ hit: { x: -1, y: -1, w: -1, h: -1 } as Box, bx: -1, by: -1, angle: 99, cursor: "" });
  const bounds = useRef({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  const pose = useRef({ x: 0, y: 0, angle: 0 });

  const { canvasRef, wakeRef } = useLampCanvas(lamp, dprCap, reserveFor, onFail);

  const wake = useFrame(active, (dt) => {
    const busy = lamp.step(dt);
    lamp.render();
    syncDom();
    rasp.current?.set(lamp.sim.vd);
    // frame-time safety net while things move: 2 → 1.5 → 1.25
    const f = perf.current;
    if (busy) {
      f.slow = dt > 1 / 40 ? f.slow + dt : Math.max(0, f.slow - dt * 0.5);
      if (f.slow > 1 && dprCap > 1.25) {
        f.slow = 0;
        setDprCap(dprCap > 1.5 ? 1.5 : 1.25);
      }
    }
    return busy;
  });
  wakeRef.current = wake;

  /** Keep the touch target over the cord and the focus target on the pull. */
  function syncDom() {
    const k = lamp.layout.scale;
    const d = dom.current;
    const hit = hitRef.current;
    if (hit) {
      const b = lamp.cordBounds(bounds.current);
      const pad = 22;
      const x = Math.round(b.minX * k - pad);
      const y = Math.round(b.minY * k - pad);
      const w = Math.round((b.maxX - b.minX) * k + pad * 2);
      const h = Math.round((b.maxY - b.minY) * k + pad * 2);
      if (x !== d.hit.x || y !== d.hit.y || w !== d.hit.w || h !== d.hit.h) {
        d.hit.x = x;
        d.hit.y = y;
        d.hit.w = w;
        d.hit.h = h;
        hit.style.transform = `translate(${x}px, ${y}px)`;
        hit.style.width = `${w}px`;
        hit.style.height = `${h}px`;
      }
    }
    const bead = beadRef.current;
    if (bead) {
      const p = lamp.beadPose(pose.current);
      const bx = Math.round(p.x * k * 2) / 2;
      const by = Math.round(p.y * k * 2) / 2;
      const angle = Math.round(p.angle * 200) / 200;
      if (bx !== d.bx || by !== d.by || angle !== d.angle) {
        d.bx = bx;
        d.by = by;
        d.angle = angle;
        bead.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%) rotate(${angle}rad)`;
      }
    }
    const root = rootRef.current;
    if (root) {
      const cursor = lamp.holding ? "grabbing" : lamp.hoverTarget > 0 ? "grab" : "";
      if (cursor !== d.cursor) {
        d.cursor = cursor;
        root.style.cursor = cursor;
      }
    }
  }

  // the switch's events: sound, the site theme, the announcement
  useEffect(() => {
    lamp.onToggle = (next, speed) => {
      setOn(next);
      click(next, speed);
      if (next) filament();
      if (linkedRef.current) {
        const want = next ? "light" : "dark";
        if (getResolvedTheme() !== want) setTheme(want);
      }
      setAnnounce(
        next
          ? `Light on${linkedRef.current ? ", light theme" : ""}.`
          : `Light off${linkedRef.current ? ", dark theme" : ""}.`,
      );
    };
    lamp.onRearm = (speed) => rearm(speed);
    lamp.onClink = (speed, part) => clink(speed, part);
    return () => {
      lamp.onToggle = null;
      lamp.onRearm = null;
      lamp.onClink = null;
    };
  }, [lamp, linkedRef]);

  // the site theme changed (the header, the palette, the OS): the cord tugs itself
  useEffect(() => {
    if (!linked) return;
    lamp.follow(theme === "light", !reducedMotion);
    if (reducedMotion) setOn(theme === "light");
    wake();
  }, [theme, linked, lamp, reducedMotion, wake]);

  useEffect(() => {
    lamp.setReduced(reducedMotion);
    wake();
  }, [reducedMotion, lamp, wake]);

  // sound stops with the piece
  useEffect(() => {
    if (!active) rasp.current?.set(0);
  }, [active]);
  useEffect(
    () => () => {
      rasp.current?.stop();
      rasp.current = null;
    },
    [],
  );

  // pointer: grab the cord anywhere, tap the shade
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let pointerId: number | null = null;
    const toScene = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const k = lamp.layout.scale;
      return { x: (event.clientX - rect.left) / k, y: (event.clientY - rect.top) / k };
    };
    const slopFor = (event: PointerEvent) => (event.pointerType === "mouse" ? 9 : 22) / lamp.layout.scale;
    const gesture = () => {
      const audio = ensureAudio();
      if (audio && !rasp.current) {
        rasp.current = new Rasp();
        rasp.current.start();
      }
    };

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0) return;
      if ((event.target as Element | null)?.closest?.("[data-lab-controls]")) return;
      gesture();
      const p = toScene(event);
      const hit = lamp.sim.nearest(p.x, p.y);
      if (hit.distance < slopFor(event)) {
        event.preventDefault();
        lamp.grab(hit.index, p.x, p.y);
        pointerId = event.pointerId;
        try {
          root.setPointerCapture(event.pointerId);
        } catch {}
        setTouched(true);
        wake();
        return;
      }
      const side = lamp.lampSide(p.x, p.y);
      if (side !== 0 && !reducedRef.current) {
        lamp.knock(side);
        knock(0.6);
        setTouched(true);
        wake();
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      const p = toScene(event);
      if (event.pointerId === pointerId) {
        lamp.drag(p.x, p.y);
        wake();
        return;
      }
      if (event.pointerType !== "mouse") return;
      const near = lamp.sim.nearest(p.x, p.y).distance < slopFor(event) ? 1 : 0;
      if (near !== lamp.hoverTarget) {
        lamp.hoverTarget = near;
        wake();
      }
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      lamp.letGo();
      if (event.pointerType !== "mouse") lamp.hoverTarget = 0;
      wake();
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || pointerId !== null) return;
      lamp.hoverTarget = 0;
      wake();
    };
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [lamp, wake, reducedRef]);

  // keyboard, on the pull itself
  const keyAt = useRef(-Infinity);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key;
    if (key === " " || key === "Enter" || key === "ArrowDown") {
      event.preventDefault();
      keyAt.current = performance.now();
      if (event.repeat) return;
      ensureAudio();
      setTouched(true);
      if (reducedMotion) lamp.toggleNow();
      else lamp.autoPull("key");
      wake();
    } else if (key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();
      ensureAudio();
      if (!reducedMotion) lamp.nudge(key === "ArrowRight" ? 1 : -1);
      wake();
    }
  };
  const onKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const key = event.key;
    if (key === " " || key === "Enter" || key === "ArrowDown") {
      keyAt.current = performance.now();
      lamp.keyUp();
      wake();
    }
  };

  const k = lamp.layout.scale;
  const beadW = Math.max(32, (BEAD_R1 * 2 + 10) * k);
  const beadH = Math.max(44, (BEAD_LENGTH + 12) * k);
  const darkRoom = !on;

  const hint = fine
    ? "Grab the pull and draw it down until it clicks · flick it to set it swinging"
    : "Pull the cord down until it clicks";

  return (
    <div ref={rootRef} className="absolute inset-0 touch-pan-y select-none [-webkit-tap-highlight-color:transparent]">
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
      {/* where a touch takes the cord instead of scrolling the page */}
      <div ref={hitRef} aria-hidden="true" className="absolute start-0 top-0 touch-none" style={{ width: 0, height: 0 }} />
      <div
        ref={beadRef}
        role="switch"
        tabIndex={0}
        aria-checked={on}
        aria-label={linked ? "Pull cord: light (sets the site theme)" : "Pull cord: light"}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={() => lamp.keyUp()}
        onClick={(event) => {
          // assistive tech activates without a key or a press
          if (event.detail !== 0 || performance.now() - keyAt.current < 600) return;
          if (reducedMotion) lamp.toggleNow();
          else {
            lamp.autoPull("key");
            lamp.keyUp();
          }
          wake();
        }}
        className="absolute start-0 top-0 touch-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{ width: beadW, height: beadH }}
      />
      <p id={hintId} className="sr-only">
        A pendant lamp with a pull cord. Press Space or Enter to pull the cord and switch the light; hold to keep
        it drawn. The left and right arrows set the pull swinging.
        {linked ? " Switching the light also sets this site's light or dark theme." : ""}
      </p>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <StageControls placement="bottom">
        <Tray label="Lamp settings">
          <Toggle label="Site theme" checked={linked} onChange={setLinked} />
          <TrayDivider />
          <MuteButton />
        </Tray>
        <StageHint
          className={cn(
            "transition-[opacity,color] duration-700",
            touched && "opacity-0",
            darkRoom ? "text-[#9a9a9a]" : "text-[#6b6b6b]",
          )}
        >
          {hint}
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* fallback (no WebGL2)                                                    */
/* ---------------------------------------------------------------------- */

/** A still drawing of the lamp in 2D, lit or not with the theme. */
function Fallback({ mode, theme }: PieceProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, mode === "stage" ? 2 : 1.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const lit = theme === "light";
      const lamp = new PullCord(mode, lit, rect.width, rect.height);
      lamp.resize(rect.width, rect.height, mode === "stage" ? reserveFor(rect.width) : 0);
      const L = lamp.layout;
      const s = lamp.sim;
      ctx.setTransform(dpr * L.scale, 0, 0, dpr * L.scale, 0, 0);
      ctx.fillStyle = lit ? "#efefef" : "#232323";
      ctx.fillRect(0, 0, L.width, L.height);
      if (lit) {
        const glow = ctx.createRadialGradient(s.ox, s.oy + 10, 10, s.ox, s.oy + 10, 320);
        glow.addColorStop(0, "rgb(255 236 210 / 0.9)");
        glow.addColorStop(1, "rgb(255 236 210 / 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, s.oy, L.width, L.height);
      }
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(s.ax, 0);
      ctx.lineTo(s.ox, s.oy - 60);
      ctx.stroke();
      ctx.fillStyle = "#262626";
      ctx.fillRect(s.ax - 24, 0, 48, s.ay);
      ctx.beginPath();
      ctx.ellipse(s.ox, s.oy, 84, 57, 0, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = lit ? "#fff4e4" : "#3a3a3a";
      ctx.beginPath();
      ctx.ellipse(s.ox, s.oy, 84, 18, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = lit ? "#fffaf0" : "#4a4a4a";
      ctx.beginPath();
      ctx.arc(s.ox, s.oy + 5, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(s.ex, s.ey);
      for (let i = 0; i < s.x.length; i++) ctx.lineTo(s.x[i], s.y[i]);
      ctx.stroke();
      const last = s.x.length - 1;
      ctx.fillStyle = lit ? "#e9e7e2" : "#cfe6db";
      ctx.beginPath();
      ctx.ellipse(s.x[last], s.y[last] + 14, 8.4, 14, 0, 0, 2 * Math.PI);
      ctx.fill();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [mode, theme]);
  return (
    <div aria-hidden={mode === "tile" ? "true" : undefined} className="absolute inset-0">
      <canvas ref={ref} className="absolute inset-0 size-full" />
      {mode === "stage" ? (
        <StageHint placement="bottom">The lamp needs WebGL 2, which this browser doesn&rsquo;t offer.</StageHint>
      ) : null}
    </div>
  );
}
