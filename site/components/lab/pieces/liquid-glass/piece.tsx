"use client";

// Liquid glass: a glass tab bar over a printed backdrop, and a droplet of
// the same glass you can pull away from it and pour back in.
//
// The look (what each part is for)
// - Backdrop: the tile's own grey, a fine grid, two crisp colour fields (an
//   orange disc lit from above, a cobalt band) and the word "arsher" set
//   huge in Geist. Crisp edges are what make refraction legible, so nothing
//   behind the glass is blurry; it all drifts very slowly so the glass
//   always has something passing through it.
// - Material: clear glass with a rounded rim and a flat middle (the dock),
//   a full dome (the droplet), joined by a smooth union so they bridge like
//   liquid. The rim bends the backdrop inward and splits it into colour; a
//   soft sky reflects off faces that tilt up, a key light from the upper
//   left leaves a highlight and a bright rim, and the pointer is a second,
//   smaller light. The glass casts a soft shadow, and the droplet gathers a
//   caustic into the middle of its own.
// - Motion: the droplet chases the pointer on a spring and stretches along
//   its velocity; letting go wobbles it like jelly. Touching the dock
//   bridges, merges and sends a ripple through the glass; pulling free
//   pinches the neck off with a pop. The selected tab is a soft well that
//   slides on a spring and stretches as it travels; icons lift on hover and
//   dip on press.
// - Sound (stage, after a gesture, lab mute respected): a water plip when
//   the droplet is picked up, a round blob as it merges, a pop as it
//   pinches off, a glass tap for the tabs.
// - Tile: the droplet loops a figure-eight that dips in and out of the
//   dock while the tabs step along; a mouse over the tile borrows the
//   droplet. Half frame rate, no sound, nothing focusable.
// - Reduced motion: one still frame, the droplet caught mid-merge at the
//   dock's right end, no drift; dragging still works but eases straight
//   to the pointer without wobble.
//
// Files: engine.ts (layout, springs, colours), shaders.ts + renderer.ts
// (WebGL2), type.ts (the word), icons.tsx (dock glyphs), sound.ts.

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { clamp, useFrame, useLatest, usePointer, useWebGL2 } from "../../hooks";
import type { PieceMode, PieceProps, PieceTheme } from "../../types";
import { MuteButton, Slider, StageControls, StageHint, Swatches, Tray, TrayDivider, TrayRow } from "../../ui";
import { computeLayout, GlassWorld, TINTS, tintById, type Settings, type TintId } from "./engine";
import { TabGlyph, TABS, TILE_TABS } from "./icons";
import { GlassRenderer } from "./renderer";
import { merge, pinch, plip, tap, wake as wakeAudio } from "./sound";
import { drawWord, fontFamily, fontReady, WORD } from "./type";

const SWATCHES = TINTS.map((t) => ({ value: t.id, label: t.label, swatch: t.swatch }));

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const tabs = stage ? TABS : TILE_TABS;
  const [world] = useState(() => new GlassWorld(mode, tabs.length));
  const rendererRef = useRef<GlassRenderer | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hintId = useId();

  const [refraction, setRefraction] = useState(0.6);
  const [frost, setFrost] = useState(0.3);
  const [tint, setTint] = useState<TintId>("clear");
  const [selected, setSelected] = useState(0);
  const [touched, setTouched] = useState(false);
  const [announce, setAnnounce] = useState("");

  const loop = useRef({ acc: 0, wordDirty: true, wordKey: "", fontTick: 0, nextTab: 3.2 });
  const iconStyles = useRef<string[]>([]);
  const wordCanvas = useRef<HTMLCanvasElement | null>(null);

  const settings = useLatest<Settings & { theme: PieceTheme }>({
    refraction,
    frost,
    tint,
    dark: theme === "dark",
    reducedMotion,
    theme,
  });

  const panAt = (x: number) => {
    const w = sizeRef.current.width;
    return w ? clamp((x / w) * 1.4 - 0.7, -0.8, 0.8) : 0;
  };

  const onMerge = (merged: boolean, x: number) => {
    if (!stage || world.driver === "path") return;
    if (merged) merge(panAt(x));
    else pinch(panAt(x));
    setAnnounce(merged ? "The droplet merged with the tab bar" : "The droplet pulled free of the tab bar");
  };
  const events = useLatest({ onMerge });

  const wakeLoop = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const gl = glRef.current;
    const L = loop.current;
    const s = settings.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || !gl || width < 2 || height < 2) return;

    // half the frame rate on tiles
    if (!stage) {
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = L.acc;
      L.acc = 0;
    }

    if (world.resize(width, height)) L.wordDirty = true;
    const layout = world.layout!;

    // the word, at device pixels
    const key = `${Math.round(layout.fontPx * dpr)}:${L.fontTick}`;
    if (L.wordDirty || key !== L.wordKey) {
      wordCanvas.current ??= document.createElement("canvas");
      world.word = drawWord(layout.fontPx, dpr, wordCanvas.current);
      renderer.setType(world.word.canvas);
      L.wordKey = key;
      L.wordDirty = false;
    }

    // tiles: the mouse borrows the droplet; tabs step along on their own
    if (!stage) {
      const p = pointer.current;
      const hovering = p.inside && p.type === "mouse";
      if (hovering) {
        world.driver = "hover";
        world.target = world.clampTarget(p.x, p.y);
        const { cx, cy, hw, hh } = layout.dock;
        const inDock = Math.abs(p.x - cx) < hw && Math.abs(p.y - cy) < hh;
        world.hoverIndex = inDock ? clamp(Math.floor((p.x - (cx - hw + layout.padX)) / layout.pitch), 0, tabs.length - 1) : -1;
      } else {
        if (world.driver === "hover") world.driver = "path";
        world.hoverIndex = -1;
      }
      if (!s.reducedMotion) {
        L.nextTab -= dt;
        if (L.nextTab <= 0) {
          L.nextTab = 3.4;
          const next = (world.selected + 1) % tabs.length;
          world.select(next);
          setSelected(next);
        }
      }
    }

    world.step(dt, s, events.current);
    const frame = world.frame(dpr);
    if (frame) renderer.draw(frame);

    // icons follow their springs
    for (let i = 0; i < tabs.length; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;
      const { scale, lift } = world.iconTransform(i);
      // ink over light ground, white over dark, with a soft halo of the
      // opposite tone that keeps the glyph's edge crisp
      const t = world.tone[i];
      const c = Math.round(22 + (247 - 22) * t);
      const h = Math.round(255 - 255 * t);
      const css = `translate3d(0, ${lift.toFixed(2)}px, 0) scale(${scale.toFixed(3)})|rgb(${c} ${c} ${c})|drop-shadow(0 0 ${stage ? 3 : 2}px rgb(${h} ${h} ${h} / ${(0.38 - 0.1 * t).toFixed(2)}))`;
      if (iconStyles.current[i] === css) continue;
      iconStyles.current[i] = css;
      const [transform, color, filter] = css.split("|");
      el.style.transform = transform;
      el.style.color = color;
      el.style.filter = filter;
    }

    // cursor: grab over the droplet
    if (stage && surfaceRef.current) {
      const p = pointer.current;
      const cursor = world.driver === "drag" ? "grabbing" : p.inside && world.hitDroplet(p.x, p.y) ? "grab" : "";
      if (surfaceRef.current.style.cursor !== cursor) surfaceRef.current.style.cursor = cursor;
    }

    // the backdrop always drifts; a still frame sleeps once it has settled
    if (s.reducedMotion && !world.busy && !world.easing(s)) return false;
  });

  const { canvasRef, glRef, sizeRef, size, supported } = useWebGL2({
    mode,
    maxDpr: stage ? 2 : 1.5,
    attributes: { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false },
    onContext: (gl) => {
      let renderer: GlassRenderer | null = null;
      try {
        renderer = new GlassRenderer(gl);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      loop.current.wordDirty = true;
      wakeLoop();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => wakeLoop(),
  });

  // redraw the word once Geist has arrived
  useEffect(() => {
    let live = true;
    void fontReady().then(() => {
      if (!live) return;
      loop.current.fontTick++;
      wakeLoop();
    });
    return () => {
      live = false;
    };
  }, [wakeLoop]);

  // settings and theme changes wake a sleeping loop
  useEffect(() => {
    wakeLoop();
  }, [refraction, frost, tint, theme, reducedMotion, wakeLoop]);

  /* -------------------------------------------------------------------- */
  /* gestures                                                              */
  /* -------------------------------------------------------------------- */

  const pointerTarget = stage ? surfaceRef : (canvasRef as RefObject<HTMLElement | null>);
  const pointer = usePointer(pointerTarget, {
    capture: stage,
    onDown: (state) => {
      if (!stage) return;
      wakeAudio();
      const hit = world.hitDroplet(state.x, state.y);
      world.grab = hit ? { x: state.x - world.dx.value, y: state.y - world.dy.value } : { x: 0, y: 0 };
      world.driver = "drag";
      world.target = world.clampTarget(state.x - world.grab.x, state.y - world.grab.y);
      plip(hit ? 0.5 : 0.2, panAt(state.x));
      setTouched(true);
      wakeLoop();
    },
    onMove: (state) => {
      if (stage && state.pressed && world.driver === "drag") {
        world.target = world.clampTarget(state.x - world.grab.x, state.y - world.grab.y);
      }
      wakeLoop();
    },
    onUp: () => {
      if (!stage) return;
      if (world.driver === "drag") world.driver = "rest";
      wakeLoop();
    },
    onLeave: () => wakeLoop(),
  });

  // the pointer light follows the mouse anywhere over the stage (dock too)
  useEffect(() => {
    const root = rootRef.current;
    if (!stage || !root) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = root.getBoundingClientRect();
      world.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, inside: true };
      wakeLoop();
    };
    const leave = () => {
      world.pointer = { ...world.pointer, inside: false };
      wakeLoop();
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, [stage, world, wakeLoop]);

  const onSurfaceKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!stage || event.altKey || event.ctrlKey || event.metaKey) return;
    const layout = world.layout;
    if (!layout) return;
    const step = (event.shiftKey ? 3 : 1) * Math.max(12, layout.dropR * 0.75);
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
        world.nudge(-step, 0);
        break;
      case "ArrowRight":
        world.nudge(step, 0);
        break;
      case "ArrowUp":
        world.nudge(0, -step);
        break;
      case "ArrowDown":
        world.nudge(0, step);
        break;
      case "Enter":
      case " ":
        if (event.repeat) break;
        world.toggleMerge();
        break;
      default:
        handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    event.stopPropagation();
    wakeAudio();
    if (event.key === "Enter" || event.key === " ") plip(0.35, panAt(world.dx.value));
    setTouched(true);
    wakeLoop();
  };

  /* -------------------------------------------------------------------- */
  /* tabs                                                                  */
  /* -------------------------------------------------------------------- */

  const choose = (index: number) => {
    wakeAudio();
    world.select(index);
    setSelected(index);
    const layout = world.layout;
    tap(layout ? panAt(layout.icons[index].x) : 0);
    setTouched(true);
    wakeLoop();
  };

  const onTabsKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const count = tabs.length;
    let next = -1;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (selected + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (selected - 1 + count) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    choose(next);
    tabRefs.current[next]?.focus();
  };

  const setHover = (index: number) => {
    world.hoverIndex = index;
    wakeLoop();
  };

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  const layout = useMemo(
    () => (size.width > 1 && size.height > 1 ? computeLayout(size.width, size.height, mode, tabs.length) : null),
    [size.width, size.height, mode, tabs.length],
  );

  if (supported === false) return <Fallback mode={mode} theme={theme} />;

  const dock = layout ? (
    <div
      data-lab-controls={stage ? "" : undefined}
      role={stage ? "radiogroup" : undefined}
      aria-label={stage ? "Tab bar" : undefined}
      aria-hidden={stage ? undefined : true}
      onKeyDown={stage ? onTabsKey : undefined}
      onPointerLeave={stage ? () => setHover(-1) : undefined}
      className={cn("absolute", !stage && "pointer-events-none")}
      style={{
        left: layout.dock.cx - layout.dock.hw,
        top: layout.dock.cy - layout.dock.hh,
        width: layout.dock.hw * 2,
        height: layout.dock.hh * 2,
      }}
    >
      {tabs.map((tab, i) => {
        const on = i === selected;
        const glyph = (
          <span
            ref={(node) => {
              iconRefs.current[i] = node;
            }}
            className={cn(
              "block text-primary transition-opacity duration-300 ease-out will-change-transform",
              on ? "opacity-100" : "opacity-[0.62]",
            )}
          >
            <TabGlyph id={tab.id} size={layout.iconSize} filled={on} />
          </span>
        );
        const box = {
          left: layout.padX + layout.pitch * i,
          width: layout.pitch,
          top: stage ? 4 : 2,
          bottom: stage ? 4 : 2,
        };
        return stage ? (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[i] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={tab.label}
            title={tab.label}
            tabIndex={on ? 0 : -1}
            onClick={() => choose(i)}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setHover(i);
            }}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(-1)}
            className="absolute grid cursor-pointer place-items-center rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            style={box}
          >
            {glyph}
          </button>
        ) : (
          <span key={tab.id} className="absolute grid place-items-center" style={box}>
            {glyph}
          </span>
        );
      })}
    </div>
  ) : null;

  if (!stage) {
    return (
      <div className="absolute inset-0">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block size-full" />
        {dock}
      </div>
    );
  }

  const compact = layout?.compact ?? false;

  return (
    <div ref={rootRef} className="absolute inset-0 select-none">
      <div
        ref={surfaceRef}
        tabIndex={0}
        role="application"
        aria-roledescription="liquid glass"
        aria-label="Glass droplet"
        aria-describedby={hintId}
        onKeyDown={onSurfaceKey}
        className="group/glass absolute inset-0 touch-none outline-none [-webkit-tap-highlight-color:transparent]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_var(--foreground)] opacity-0 transition-opacity duration-200 group-focus-visible/glass:opacity-30"
        />
      </div>
      {dock}

      <p id={hintId} className="sr-only">
        Drag the droplet, or use the arrow keys to move it. Enter or Space drops it into the tab bar or lifts it
        back out. Tab to the tab bar and use the arrow keys to switch tabs.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      <StageControls placement="top">
        <Tray label="Tint and sound">
          <Swatches
            label="Tint"
            options={SWATCHES}
            value={tint}
            onChange={(value) => {
              setTint(value);
              setAnnounce(`Tint: ${tintById(value).label}`);
            }}
          />
          <TrayDivider />
          <MuteButton />
        </Tray>
      </StageControls>

      <StageControls placement="bottom">
        <TrayRow>
          <Tray label="Glass">
            <Slider
              label="Refraction"
              value={refraction}
              min={0}
              max={1}
              step={0.01}
              width={compact ? 64 : 96}
              showValue={!compact}
              onChange={setRefraction}
              format={(v) => `${Math.round(v * 100)}`}
            />
            <TrayDivider />
            <Slider
              label="Frost"
              value={frost}
              min={0}
              max={1}
              step={0.01}
              width={compact ? 64 : 96}
              showValue={!compact}
              onChange={setFrost}
              format={(v) => `${Math.round(v * 100)}`}
            />
          </Tray>
        </TrayRow>
        <StageHint className={cn("transition-opacity duration-700", touched && "opacity-0")}>
          Drag the droplet into the bar and pull it back out
        </StageHint>
      </StageControls>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* without WebGL2                                                          */
/* ---------------------------------------------------------------------- */

/** A flat drawing of the same scene for browsers without WebGL2. */
function Fallback({ mode, theme }: { mode: PieceMode; theme: PieceTheme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, mode === "stage" ? 2 : 1.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dark = theme === "dark";
      const l = computeLayout(rect.width, rect.height, mode, mode === "stage" ? TABS.length : TILE_TABS.length);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = dark ? "#232323" : "#f2f2f2";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = dark ? "#ff8048" : "#ff8443";
      ctx.beginPath();
      ctx.arc(l.disc.x, l.disc.y, l.disc.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(l.band.x, l.band.y);
      ctx.rotate(l.band.angle);
      ctx.fillStyle = dark ? "#3a5fff" : "#2a55f5";
      ctx.beginPath();
      ctx.roundRect(-l.band.hw, -l.band.hh, l.band.hw * 2, l.band.hh * 2, l.band.hh);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = dark ? "#ededed" : "#161616";
      ctx.font = `620 ${l.fontPx}px ${fontFamily()}`;
      ctx.textAlign = "center";
      ctx.fillText(WORD, l.word.cx, l.word.baseline);
      ctx.fillStyle = dark ? "rgb(255 255 255 / 0.12)" : "rgb(255 255 255 / 0.55)";
      ctx.strokeStyle = dark ? "rgb(255 255 255 / 0.3)" : "rgb(255 255 255 / 0.95)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(l.dock.cx - l.dock.hw, l.dock.cy - l.dock.hh, l.dock.hw * 2, l.dock.hh * 2, l.dock.r);
      ctx.arc(l.rest.x, l.rest.y, l.dropR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
      aria-label={mode === "stage" ? "A glass dock over the word arsher" : undefined}
      aria-hidden={mode === "stage" ? undefined : true}
      className="absolute inset-0 block size-full"
    />
  );
}
