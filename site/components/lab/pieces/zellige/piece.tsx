"use client";

// Zellige: a wall of hand-cut glazed tile, lit by a lamp you carry.
//
// The look (what each part is for)
// - Material: glazed terracotta set in cement. Each piece is its own firing
//   (a slightly different shade), sits at its own slight tilt in the bed,
//   and its glaze rolls over the cut edge, pooling a shade deeper against
//   it. Pinholes, faint clouding and the odd chip where the clay shows keep
//   it hand-made. Grout is a recessed cement line, shaded by its walls.
// - Light: by day a soft lamp (the pointer) over a wall in a daylit room
//   with a barred window; by night the room goes dark and the lamp is warm.
//   Each piece's tilt means each one reflects a different patch of the
//   window and catches the lamp's glint at a different place, so moving
//   the light makes the wall shimmer piece by piece. That is the signature.
// - Motion: the lamp trails the pointer on a soft spring. A click re-glazes:
//   new colour travels outward through the pattern one ring of touching
//   pieces at a time (breadth first from the piece you clicked); each piece
//   wipes to its new glaze, rocks as if pressed into its bed, and stays wet
//   (glossier) for a moment. A new pattern is laid from the centre out,
//   each piece growing from its centre on a spring.
// - Sound (stage, after a gesture, respecting the lab mute): a dull knock
//   under the finger and one ceramic clink per ring of the ripple.
// - Tile mode: a fixed khatam patch under a slowly drifting lamp (the mouse
//   can borrow it), no controls, no sound, half the frame rate.
// - Reduced motion: one composed still frame with the lamp at the upper
//   left; re-glazes cross-fade in place.
//
// Files: geometry.ts (patterns), mesh.ts (the wall's triangles and
// neighbours), glaze.ts (palettes and colourings), engine.ts (state and
// timing), shaders.ts + renderer.ts (WebGL2), sound.ts (Web Audio).

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { damp, lerp, Spring, useFinePointer, useFrame, useLatest, usePointer, useWebGL2 } from "../../hooks";
import type { PieceProps, PieceTheme } from "../../types";
import { MuteButton, Segmented, Slider, StageControls, StageHint, Swatches, Tray, TrayDivider, TrayRow } from "../../ui";
import { Wallworks } from "./engine";
import type { Fold } from "./geometry";
import { linear, PALETTES, paletteById, type PaletteId } from "./glaze";
import { WallRenderer, type Lighting, type Vec3 } from "./renderer";
import { cascade, tap, type Step } from "./sound";

/* ---------------------------------------------------------------------- */
/* light                                                                   */
/* ---------------------------------------------------------------------- */

const DAY: Lighting = {
  key: [1, 0.96, 0.9],
  ambient: [0.52, 0.52, 0.55],
  lightPower: 0.95,
  lightRadius: 0.36,
  lightSize: 20,
  specGain: 0.85,
  groutColor: linear("#cfc6b4"),
  body: linear("#a8775e"),
  envTop: [0.46, 0.48, 0.52],
  envBottom: [0.3, 0.26, 0.22],
  windowColor: [3.6, 3.55, 3.4],
  window: [-0.07, -0.11, 0.075, 0.05],
  vignette: 0.07,
  exposure: 1,
};

const NIGHT: Lighting = {
  key: [1, 0.79, 0.56],
  ambient: [0.06, 0.075, 0.14],
  lightPower: 1.08,
  lightRadius: 0.21,
  lightSize: 16,
  specGain: 0.95,
  groutColor: linear("#c9bfad"),
  body: linear("#8f5f47"),
  envTop: [0.025, 0.035, 0.08],
  envBottom: [0.012, 0.01, 0.018],
  windowColor: [0.3, 0.4, 0.75],
  window: [-0.07, -0.11, 0.075, 0.05],
  vignette: 0.32,
  exposure: 1,
};

const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Tiles are small: a brighter room and a fainter window keep them crisp. */
function forTile(l: Lighting): Lighting {
  return {
    ...l,
    ambient: [l.ambient[0] * 1.12, l.ambient[1] * 1.12, l.ambient[2] * 1.12],
    windowColor: [l.windowColor[0] * 0.55, l.windowColor[1] * 0.55, l.windowColor[2] * 0.55],
    vignette: l.vignette * 0.6,
  };
}

function lightingAt(t: number): Lighting {
  if (t <= 0) return DAY;
  if (t >= 1) return NIGHT;
  return {
    key: mix3(DAY.key, NIGHT.key, t),
    ambient: mix3(DAY.ambient, NIGHT.ambient, t),
    lightPower: lerp(DAY.lightPower, NIGHT.lightPower, t),
    lightRadius: lerp(DAY.lightRadius, NIGHT.lightRadius, t),
    lightSize: lerp(DAY.lightSize, NIGHT.lightSize, t),
    specGain: lerp(DAY.specGain, NIGHT.specGain, t),
    groutColor: mix3(DAY.groutColor, NIGHT.groutColor, t),
    body: mix3(DAY.body, NIGHT.body, t),
    envTop: mix3(DAY.envTop, NIGHT.envTop, t),
    envBottom: mix3(DAY.envBottom, NIGHT.envBottom, t),
    windowColor: mix3(DAY.windowColor, NIGHT.windowColor, t),
    window: DAY.window,
    vignette: lerp(DAY.vignette, NIGHT.vignette, t),
    exposure: 1,
  };
}

/** The lamp's resting place (reduced motion, and where it starts). */
const REST = { x: 0.34, y: 0.36 };

/** Where the idle lamp wanders (fractions of the view), over time t in seconds. */
function drift(mode: "tile" | "stage", t: number) {
  if (mode === "tile") {
    return { x: 0.5 + 0.34 * Math.sin(t * 0.33 + 0.4), y: 0.58 + 0.24 * Math.sin(t * 0.21 + 1.3) };
  }
  return {
    x: 0.5 + 0.3 * Math.sin(t * 0.16 + 0.6) + 0.05 * Math.sin(t * 0.41),
    y: 0.47 + 0.22 * Math.sin(t * 0.23 + 1.9),
  };
}

const FOLDS: ReadonlyArray<{ value: Fold; label: string }> = [
  { value: 8, label: "8" },
  { value: 12, label: "12" },
  { value: 16, label: "16" },
];

const FOLD_NAMES: Record<Fold, string> = {
  8: "Eight-fold: the khatam, star and cross",
  12: "Twelve-fold rosette",
  16: "Sixteen-fold rosette",
};

const SWATCHES = PALETTES.map((p) => ({ value: p.id, label: p.label, swatch: p.swatch }));

/* ---------------------------------------------------------------------- */
/* the piece                                                               */
/* ---------------------------------------------------------------------- */

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const [engine] = useState(() => {
    const works = new Wallworks(mode);
    // both open on the medallion: rings of glaze framing the centre star
    works.colouring = 2;
    return works;
  });
  const rendererRef = useRef<WallRenderer | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const hintId = useId();

  const [palette, setPalette] = useState<PaletteId>("fes");
  const [fold, setFoldState] = useState<Fold>(8);
  const [grout, setGrout] = useState(stage ? 1.8 : 1.5);
  const [announce, setAnnounce] = useState("");
  const [touched, setTouched] = useState(false);
  const fine = useFinePointer();

  // the lamp
  const lamp = useRef({
    x: new Spring(0, { stiffness: 70, damping: 13 }),
    y: new Spring(0, { stiffness: 70, damping: 13 }),
    z: new Spring(0, { stiffness: 120, damping: 18 }),
    placed: false,
    /** "drift" (idle), "pointer" or "keys" */
    driver: "drift" as "drift" | "pointer" | "keys",
    keyX: 0,
    keyY: 0,
    idleAt: 0,
    night: theme === "dark" ? 1 : 0,
    acc: 0,
    clock: 0,
  });

  const settings = useLatest({ grout, reducedMotion, theme, mode });

  const wake = useFrame(active, (dt, time) => {
    const renderer = rendererRef.current;
    const gl = glRef.current;
    const s = settings.current;
    const L = lamp.current;
    L.clock = time;
    const { width, height } = sizeRef.current;
    if (!renderer || !gl || width < 2 || height < 2) return;

    // half the frame rate on tiles
    if (!stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = L.acc;
      L.acc = 0;
    }

    if (engine.resize(width, height)) {
      if (stage && !L.placed) {
        // the first wall is laid from the centre once the piece has faded in
        engine.lay(time, !s.reducedMotion, 0.35);
      }
    }
    if (engine.geometryDirty && engine.wall) {
      renderer.setVertices(engine.wall.vertices, engine.wall.vertexCount);
      engine.geometryDirty = false;
    }
    if (engine.tilesDirty && engine.wall) {
      renderer.setTiles(engine.tiles, engine.wall.pieces.length);
      engine.tilesDirty = false;
    }

    // where the lamp wants to be
    const height3 = stage ? Math.min(width, height) * 0.38 + 110 : width * 0.95;
    let tx: number;
    let ty: number;
    const p = pointer.current;
    if (L.driver === "pointer" && p.inside) {
      tx = p.x;
      ty = p.y;
    } else if (L.driver === "keys") {
      tx = L.keyX;
      ty = L.keyY;
    } else if (s.reducedMotion) {
      tx = REST.x * width;
      ty = REST.y * height;
    } else {
      const d = drift(stage ? "stage" : "tile", time);
      tx = d.x * width;
      ty = d.y * height;
    }
    const tz = height3 * (p.pressed && L.driver === "pointer" ? 0.82 : 1);
    if (!L.placed) {
      L.x.set(REST.x * width);
      L.y.set(REST.y * height);
      L.z.set(tz);
      L.placed = true;
    }
    L.x.to(tx);
    L.y.to(ty);
    L.z.to(tz);
    if (s.reducedMotion && L.driver === "drift") {
      L.x.set(tx);
      L.y.set(ty);
      L.z.set(tz);
    } else {
      L.x.step(dt);
      L.y.step(dt);
      L.z.step(dt);
    }
    L.night = s.reducedMotion ? (s.theme === "dark" ? 1 : 0) : damp(L.night, s.theme === "dark" ? 1 : 0, 6, dt);

    renderer.draw({
      time,
      width,
      height,
      grout: s.grout / 2,
      relief: stage ? 1.5 : 1.2,
      light: [L.x.value, L.y.value, L.z.value],
      motion: !s.reducedMotion,
      lighting: stage ? lightingAt(L.night) : forTile(lightingAt(L.night)),
    });

    if (markerRef.current) {
      markerRef.current.style.transform = `translate(${L.x.value}px, ${L.y.value}px)`;
    }

    // sleep once nothing moves
    const drifting = L.driver === "drift" && !s.reducedMotion;
    const lampStill = L.x.settled && L.y.settled && L.z.settled;
    const themeStill = Math.abs(L.night - (s.theme === "dark" ? 1 : 0)) < 0.002;
    if (!drifting && lampStill && themeStill && time > engine.busyUntil) return false;
  });

  const { canvasRef, glRef, sizeRef, supported } = useWebGL2({
    mode,
    maxDpr: 2,
    attributes: { alpha: false, antialias: true, premultipliedAlpha: false, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: WallRenderer | null = null;
      try {
        renderer = new WallRenderer(gl);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      engine.geometryDirty = true;
      engine.tilesDirty = true;
      wake();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => wake(),
  });

  /* -------------------------------------------------------------------- */
  /* gestures                                                              */
  /* -------------------------------------------------------------------- */

  const panAt = (x: number) => (sizeRef.current.width ? (x / sizeRef.current.width) * 1.4 - 0.7 : 0);
  const play = (steps: Step[]) => {
    if (stage && steps.length) cascade(steps);
  };

  const reglazeAt = useCallback(
    (x: number, y: number) => {
      const steps = engine.reglaze(x, y, lamp.current.clock, { fade: settings.current.reducedMotion });
      play(steps);
      setTouched(true);
      setAnnounce(`Re-glazed in ${paletteById(engine.palette).label}`);
      wake();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, wake],
  );

  const press = useRef({ x: 0, y: 0, t: 0 });
  // the stage listens on its surface; a tile on its canvas (the niche is a
  // link, so nothing is captured there)
  const pointerTarget = stage ? surfaceRef : (canvasRef as RefObject<HTMLElement | null>);
  const pointer = usePointer(pointerTarget, {
    capture: stage,
    onDown: (state) => {
      if (!stage) return;
      press.current = { x: state.x, y: state.y, t: performance.now() };
      lamp.current.driver = "pointer";
      tap(panAt(state.x));
      wake();
    },
    onMove: (state) => {
      if (!stage && state.type !== "mouse") return;
      lamp.current.driver = "pointer";
      wake();
    },
    onUp: (state) => {
      if (!stage) return;
      const moved = Math.hypot(state.x - press.current.x, state.y - press.current.y);
      if (moved < 10 && performance.now() - press.current.t < 700) reglazeAt(state.x, state.y);
      if (state.type !== "mouse") lamp.current.driver = "pointer";
      wake();
    },
    onLeave: () => {
      lamp.current.driver = "drift";
      wake();
    },
  });

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!stage || event.altKey || event.ctrlKey || event.metaKey) return;
    const L = lamp.current;
    const { width, height } = sizeRef.current;
    if (L.driver !== "keys") {
      L.keyX = L.x.value;
      L.keyY = L.y.value;
    }
    const step = (event.shiftKey ? 0.18 : 0.06) * Math.max(width, height);
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
        L.keyX = Math.max(0, L.keyX - step);
        break;
      case "ArrowRight":
        L.keyX = Math.min(width, L.keyX + step);
        break;
      case "ArrowUp":
        L.keyY = Math.max(0, L.keyY - step);
        break;
      case "ArrowDown":
        L.keyY = Math.min(height, L.keyY + step);
        break;
      case "Enter":
      case " ":
        if (event.repeat) break;
        tap(panAt(L.keyX));
        reglazeAt(L.driver === "keys" ? L.keyX : L.x.value, L.driver === "keys" ? L.keyY : L.y.value);
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key.startsWith("Arrow")) L.driver = "keys";
    wake();
  };

  /* -------------------------------------------------------------------- */
  /* controls                                                              */
  /* -------------------------------------------------------------------- */

  const choosePalette = (id: PaletteId) => {
    setPalette(id);
    const { width, height } = sizeRef.current;
    const steps = engine.reglaze(width / 2, height / 2, lamp.current.clock, {
      palette: id,
      fade: settings.current.reducedMotion,
    });
    play(steps);
    setAnnounce(`Glaze: ${paletteById(id).label}`);
    wake();
  };

  const chooseFold = (value: Fold) => {
    setFoldState(value);
    const steps = engine.setFold(value, lamp.current.clock, !settings.current.reducedMotion);
    play(steps.length ? steps.filter((_, i) => i % 2 === 0) : steps);
    setAnnounce(FOLD_NAMES[value]);
    wake();
  };

  // redraw when a setting or the theme changes while the loop sleeps
  useEffect(() => {
    wake();
  }, [grout, theme, reducedMotion, wake]);

  // leaving the wall with the keyboard hands the lamp back to its drift
  useEffect(() => {
    if (!stage) return;
    const el = surfaceRef.current;
    if (!el) return;
    const onBlur = () => {
      if (lamp.current.driver === "keys") lamp.current.driver = "drift";
      wake();
    };
    el.addEventListener("blur", onBlur);
    return () => el.removeEventListener("blur", onBlur);
  }, [stage, wake]);

  if (supported === false) return <Fallback mode={mode} engine={engine} theme={theme} />;

  if (!stage) {
    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 block size-full"
      />
    );
  }

  return (
    <div className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        tabIndex={0}
        role="application"
        aria-roledescription="zellige wall"
        aria-label="Zellige wall"
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        className="group/wall absolute inset-0 cursor-crosshair touch-none outline-none [-webkit-tap-highlight-color:transparent]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
        {/* where the lamp is, for keyboard users */}
        <div
          ref={markerRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-200 group-focus-visible/wall:opacity-100"
        >
          <span className="absolute -top-[15px] -left-[15px] size-[30px] rounded-full shadow-[0_0_0_1.5px_var(--cobalt),0_0_0_5px_rgb(255_255_255/0.35)]" />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_2px_var(--cobalt)] opacity-0 transition-opacity duration-200 group-focus-visible/wall:opacity-100"
        />
      </div>

      <p id={hintId} className="sr-only">
        Move the pointer or use the arrow keys to move the lamp. Click, tap, Enter or Space re-glazes from the lamp.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="top">
        <Tray label="Glaze">
          <Swatches label="Glaze" options={SWATCHES} value={palette} onChange={choosePalette} />
        </Tray>
      </StageControls>

      <StageControls placement="bottom">
        <TrayRow>
          <Tray label="Pattern">
            <Segmented label="Rosette" showLabel options={FOLDS} value={fold} onChange={chooseFold} />
          </Tray>
          <Tray label="Grout and sound">
            <Slider
              label="Grout"
              value={grout}
              min={0.6}
              max={4}
              step={0.1}
              width={96}
              onChange={setGrout}
              format={(v) => v.toFixed(1)}
            />
            <TrayDivider />
            <MuteButton />
          </Tray>
        </TrayRow>
        <StageHint
          className={touched ? "opacity-0 transition-opacity duration-700" : "transition-opacity duration-700"}
        >
          {fine ? "Move to light the glaze · click to re-glaze" : "Drag to move the light · tap to re-glaze"}
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

const toSrgb = (c: number) => Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));

/** A flat drawing of the same wall for browsers without WebGL2. */
function Fallback({ mode, engine, theme }: { mode: "tile" | "stage"; engine: Wallworks; theme: PieceTheme }) {
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
      engine.resize(rect.width, rect.height);
      const wall = engine.wall;
      if (!wall) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = theme === "dark" ? "#4a463f" : "#e4dccb";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.lineJoin = "round";
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1.6;
      for (const piece of wall.pieces) {
        const o = piece.index * 12 + 4;
        const dim = theme === "dark" ? 0.55 : 1;
        ctx.fillStyle = `rgb(${toSrgb(engine.tiles[o] * dim)} ${toSrgb(engine.tiles[o + 1] * dim)} ${toSrgb(engine.tiles[o + 2] * dim)})`;
        ctx.beginPath();
        piece.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(rect.width * 0.34, rect.height * 0.36, 0, rect.width * 0.34, rect.height * 0.36, rect.width * 0.6);
      glow.addColorStop(0, "rgb(255 250 240 / 0.28)");
      glow.addColorStop(1, "rgb(255 250 240 / 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, rect.width, rect.height);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [engine, mode, theme]);
  return (
    <canvas
      ref={ref}
      role={mode === "stage" ? "img" : undefined}
      aria-label={mode === "stage" ? "A wall of zellige tiles" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 block size-full"
    />
  );
}
