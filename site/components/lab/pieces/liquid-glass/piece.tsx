"use client";

// Liquid glass: a glass tab bar over a printed backdrop, and a droplet of
// the same glass you can pull away from it and pour back in.
//
// The look (what each part is for)
// - Backdrop: the tile's own grey, a fine grid, crisp colour fields (an
//   orange disc lit from above, a cobalt band and a thin echo of it) and
//   the word "arsher" set huge in Geist. Crisp edges are what make
//   refraction legible, so nothing behind the glass is blurry; it all
//   drifts very slowly so the glass always has something passing through.
// - Material: the dock is frosted glass with a narrow rounded rim that
//   lenses in a thin sliver of what lies just beyond it. The droplet is the
//   clearest part: a flat-topped lens that magnifies what is under it,
//   bends it hard at its rim and gathers a crescent of light on its far
//   side. They are one field joined by a smooth union, so they bridge like
//   liquid. A soft sky reflects off faces that tilt up, a key light from
//   the upper left leaves a highlight and a bright rim, and a hovering
//   mouse is a second light that glints along the rims.
// - Icons: one tone for the whole bar (ink, or white over dark ground,
//   switching together with hysteresis), each sitting on a plate of denser
//   frost so it reads over anything. The selected tab is a small lifted
//   lens inside the bar that slides on a spring and stretches as it goes.
// - Motion: the droplet chases the pointer on a spring and stretches along
//   its velocity; letting go wobbles it like jelly. Touching the dock
//   bridges, merges and sends a ripple through the glass; pulling free
//   pinches the neck off with a pop. Icons lift on hover and dip on press.
// - Sound (stage, after a gesture, lab mute respected): a water plip when
//   the droplet is picked up, a round blob as it merges, a pop as it
//   pinches off, a glass tap for the tabs.
// - Input: a mouse press anywhere calls the droplet over (silently), a
//   press on it picks it up, also while it sits inside the bar (a press
//   there that never moves is still a tab press). A finger has to land on
//   or near the droplet; anywhere else the page scrolls as usual.
// - Tile: the droplet loops a figure-eight that dips in and out of the
//   dock while the tabs step along; a mouse over the tile borrows the
//   droplet. Half frame rate, no sound, nothing focusable.
// - Reduced motion: one still frame, the droplet caught mid-merge at the
//   dock's right end, no drift; dragging still works but eases straight
//   to the pointer without wobble.
// - Cost: once nothing but the backdrop's slow drift is moving, the stage
//   draws at 30fps; the backdrop texture is small (see renderer.ts).
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
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { clamp, useFrame, useLatest, usePointer, useWebGL2 } from "../../hooks";
import type { PieceMode, PieceProps, PieceTheme } from "../../types";
import { MuteButton, Slider, StageControls, StageHint, Swatches, Tray, TrayDivider, TrayRow } from "../../ui";
import { computeLayout, GlassWorld, TINTS, tintById, type Settings, type TintId } from "./engine";
import { TabGlyph, TABS, TILE_TABS } from "./icons";
import { GlassRenderer, releaseContextLater } from "./renderer";
import { merge, pinch, plip, tap, wake as wakeAudio } from "./sound";
import { drawWord, fontFamily, fontReady, WORD } from "./type";

const SWATCHES = TINTS.map((t) => ({ value: t.id, label: t.label, swatch: t.swatch }));

/** Droplet reach for a press, in radii: a fingertip gets more room than a mouse. */
const REACH_MOUSE = 1.25;
const REACH_TOUCH = 1.6;
/** A press on the bar that moves less than this is a tab press, not a drag. */
const DRAG_SLOP = 4;
/** How long after a drag ends its outcome is announced. */
const ANNOUNCE_DELAY = 600;

const mergedText = (merged: boolean) =>
  merged ? "The droplet merged with the tab bar" : "The droplet pulled free of the tab bar";

type DragSource = "" | "surface" | "dock";

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const tabs = stage ? TABS : TILE_TABS;
  const [world] = useState(() => new GlassWorld(mode, tabs.length));
  const rendererRef = useRef<GlassRenderer | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const iconRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hintId = useId();

  const [refraction, setRefraction] = useState(0.6);
  const [frost, setFrost] = useState(0.3);
  const [tint, setTint] = useState<TintId>("clear");
  const [selected, setSelected] = useState(0);
  const [touched, setTouched] = useState(false);
  const [announce, setAnnounce] = useState("");

  const loop = useRef({
    acc: 0,
    /** Set by input: draw the next frame at once, even at the idle cadence. */
    urgent: true,
    wordDirty: true,
    wordPx: 0,
    wordFont: -1,
    fontTick: 0,
    nextTab: 3.2,
  });
  /** What was last written to each icon and to the DOM helpers (written only on change). */
  const written = useRef({
    /** The element each icon's values were written to (a remounted one is rewritten). */
    iconEls: [] as Array<HTMLSpanElement | null>,
    lift: [] as number[],
    scale: [] as number[],
    tone: [] as number[],
    dockEl: null as HTMLDivElement | null,
    handleX: NaN,
    handleY: NaN,
    handleR: NaN,
    surfaceCursor: "",
    dockCursor: "",
    dockTouch: "",
  });
  const drag = useRef({ source: "" as DragSource, id: -1, x: 0, y: 0, moved: false, merged: false, suppressUntil: 0 });
  const announceTimer = useRef(0);
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
    // pointer drags are announced once, after the droplet is let go
    if (world.driver === "keys") setAnnounce(mergedText(merged));
  };
  const events = useLatest({ onMerge });

  const wakeLoop = useFrame(active, (dt) => {
    const renderer = rendererRef.current;
    const gl = glRef.current;
    const L = loop.current;
    const s = settings.current;
    const { width, height, dpr } = sizeRef.current;
    if (!renderer || !gl || width < 2 || height < 2) return;

    if (!stage) {
      // half the frame rate on tiles
      L.acc += dt;
      if (L.acc < 1 / 30 - 0.002) return;
      dt = L.acc;
      L.acc = 0;
    } else {
      // once only the backdrop's slow drift is moving, 30fps is plenty
      const idle =
        !L.urgent && world.driver !== "path" && world.driver !== "drag" && !world.busy && !world.easing(s);
      if (idle) {
        L.acc += dt;
        if (L.acc < 1 / 30 - 0.002) return;
        dt = L.acc;
      }
      L.acc = 0;
      L.urgent = false;
    }

    if (world.resize(width, height)) L.wordDirty = true;
    const layout = world.layout!;

    // the word, at device pixels
    const wordPx = Math.round(layout.fontPx * dpr);
    if (L.wordDirty || wordPx !== L.wordPx || L.fontTick !== L.wordFont) {
      wordCanvas.current ??= document.createElement("canvas");
      world.word = drawWord(layout.fontPx, dpr, wordCanvas.current);
      renderer.setType(world.word.canvas);
      L.wordPx = wordPx;
      L.wordFont = L.fontTick;
      L.wordDirty = false;
    }

    // tiles: the mouse borrows the droplet; tabs step along on their own
    if (!stage) {
      const p = pointer.current;
      const hovering = p.inside && p.type === "mouse";
      if (hovering) {
        world.driver = "hover";
        const t = world.clampTarget(p.x, p.y);
        world.target.x = t.x;
        world.target.y = t.y;
        const { cx, cy, hw, hh } = layout.dock;
        const inDock = Math.abs(p.x - cx) < hw && Math.abs(p.y - cy) < hh;
        world.hoverIndex = inDock ? tabAt(p.x) : -1;
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

    // icons follow their springs; the whole bar shares one tone
    const W = written.current;
    const tone = Math.round(world.tone * 40) / 40;
    for (let i = 0; i < tabs.length; i++) {
      const el = iconRefs.current[i];
      if (!el) continue;
      if (el !== W.iconEls[i]) {
        W.iconEls[i] = el;
        W.lift[i] = W.scale[i] = W.tone[i] = NaN;
      }
      const lift = Math.round(world.iconLift(i) * 50) / 50;
      const scale = Math.round(world.iconScale(i) * 500) / 500;
      if (lift !== W.lift[i] || scale !== W.scale[i]) {
        W.lift[i] = lift;
        W.scale[i] = scale;
        el.style.transform = `translate3d(0, ${lift}px, 0) scale(${scale})`;
      }
      if (tone !== W.tone[i]) {
        W.tone[i] = tone;
        // ink over light ground, white over dark, with a soft halo of the
        // opposite tone that keeps the glyph's edge crisp
        const c = Math.round(22 + (247 - 22) * tone);
        const h = Math.round(255 - 255 * tone);
        el.style.color = `rgb(${c} ${c} ${c})`;
        el.style.filter = `drop-shadow(0 0 ${stage ? 2 : 1.5}px rgb(${h} ${h} ${h} / ${(0.5 - 0.12 * tone).toFixed(2)}))`;
      }
    }

    if (stage) {
      const p = pointer.current;
      const dragging = world.driver === "drag";
      // a finger's grab area rides on the droplet (it alone opts out of
      // scrolling, so the page still scrolls under a finger anywhere else)
      const handle = handleRef.current;
      if (handle) {
        const r = Math.round(layout.dropR * REACH_TOUCH);
        const hx = Math.round(world.dx.value * 2) / 2;
        const hy = Math.round(world.dy.value * 2) / 2;
        if (r !== W.handleR) {
          W.handleR = r;
          handle.style.width = handle.style.height = `${r * 2}px`;
        }
        if (hx !== W.handleX || hy !== W.handleY) {
          W.handleX = hx;
          W.handleY = hy;
          handle.style.transform = `translate3d(${hx - r}px, ${hy - r}px, 0)`;
        }
      }
      // the bar opts out of scrolling only while the droplet is in it
      const dockEl = dockRef.current;
      if (dockEl && dockEl !== W.dockEl) {
        W.dockEl = dockEl;
        W.dockTouch = W.dockCursor = "";
      }
      if (dockEl) {
        const touch = world.gap() < layout.k ? "none" : "pan-y";
        if (touch !== W.dockTouch) {
          W.dockTouch = touch;
          dockEl.style.touchAction = touch;
        }
        // (the stage-wide mouse position: the bar is not part of the surface)
        const m = world.pointer;
        const overDrop = m.inside && world.hitDroplet(m.x, m.y, REACH_MOUSE);
        const dockCursor = drag.current.source === "dock" ? "grabbing" : overDrop ? "grab" : "pointer";
        if (dockCursor !== W.dockCursor) {
          W.dockCursor = dockCursor;
          dockEl.style.setProperty("--lg-cursor", dockCursor);
        }
      }
      // cursor: grab over the droplet
      const surface = surfaceRef.current;
      if (surface) {
        const cursor = dragging ? "grabbing" : p.inside && world.hitDroplet(p.x, p.y, REACH_MOUSE) ? "grab" : "";
        if (cursor !== W.surfaceCursor) {
          W.surfaceCursor = cursor;
          surface.style.cursor = cursor;
        }
      }
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
      loop.current.urgent = true;
      wakeLoop();
      return () => {
        renderer?.dispose();
        rendererRef.current = null;
      };
    },
    onResize: () => {
      loop.current.urgent = true;
      wakeLoop();
    },
  });

  // give the context back to the browser once the canvas is really gone
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => releaseContextLater(canvas);
  }, [canvasRef]);

  // redraw the word once Geist has arrived
  useEffect(() => {
    let live = true;
    void fontReady().then(() => {
      if (!live) return;
      loop.current.fontTick++;
      loop.current.urgent = true;
      wakeLoop();
    });
    return () => {
      live = false;
    };
  }, [wakeLoop]);

  // settings and theme changes wake a sleeping loop
  useEffect(() => {
    loop.current.urgent = true;
    wakeLoop();
  }, [refraction, frost, tint, theme, reducedMotion, wakeLoop]);

  useEffect(() => () => window.clearTimeout(announceTimer.current), []);

  const kick = () => {
    loop.current.urgent = true;
    wakeLoop();
  };

  /* -------------------------------------------------------------------- */
  /* gestures                                                              */
  /* -------------------------------------------------------------------- */

  /** The tab under x (CSS px across the piece). */
  const tabAt = (x: number) => {
    const l = world.layout;
    if (!l) return 0;
    return clamp(Math.floor((x - (l.dock.cx - l.dock.hw + l.padX)) / l.pitch), 0, tabs.length - 1);
  };

  const startDrag = (x: number, y: number, hit: boolean, sound: boolean) => {
    wakeAudio();
    window.clearTimeout(announceTimer.current);
    drag.current.merged = world.merged;
    world.beginDrag(x, y, hit);
    if (hit && sound) plip(0.5, panAt(x));
    setTouched(true);
    kick();
  };

  const finishDrag = () => {
    if (world.driver !== "drag") return;
    world.endDrag();
    // say where it ended up, once, after it has settled
    const before = drag.current.merged;
    window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => {
      if (world.merged !== before) setAnnounce(mergedText(world.merged));
    }, ANNOUNCE_DELAY);
    kick();
  };

  const pointerTarget = stage ? surfaceRef : (canvasRef as RefObject<HTMLElement | null>);
  const pointer = usePointer(pointerTarget, {
    capture: stage,
    onDown: (state, event) => {
      if (!stage) return;
      const finger = event.pointerType !== "mouse";
      const hit = world.hitDroplet(state.x, state.y, finger ? REACH_TOUCH : REACH_MOUSE);
      // a finger away from the droplet is left alone (the page may scroll)
      if (finger && !hit) return;
      drag.current.source = "surface";
      // a mouse press elsewhere calls the droplet over, silently
      startDrag(state.x, state.y, hit, true);
    },
    onMove: (state) => {
      if (stage && state.pressed && drag.current.source === "surface" && world.driver === "drag") {
        world.dragTo(state.x, state.y);
      }
      kick();
    },
    onUp: () => {
      if (!stage) return;
      if (drag.current.source === "surface") {
        drag.current.source = "";
        finishDrag();
      }
      kick();
    },
    onLeave: () => kick(),
  });

  // the pointer light follows the mouse anywhere over the stage (dock too)
  useEffect(() => {
    const root = rootRef.current;
    if (!stage || !root) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = root.getBoundingClientRect();
      world.pointer.x = event.clientX - rect.left;
      world.pointer.y = event.clientY - rect.top;
      world.pointer.inside = true;
      loop.current.urgent = true;
      wakeLoop();
    };
    const leave = () => {
      world.pointer.inside = false;
      loop.current.urgent = true;
      wakeLoop();
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, [stage, world, wakeLoop]);

  const localPoint = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect ? { x: event.clientX - rect.left, y: event.clientY - rect.top } : { x: 0, y: 0 };
  };

  // The droplet inside the bar sits under the tab buttons, so the bar
  // checks for it first: a press on it carries the droplet (pressing a tab
  // only if it never moves past DRAG_SLOP).
  const onDockDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button > 0) return;
    const { x, y } = localPoint(event);
    const finger = event.pointerType !== "mouse";
    if (!world.hitDroplet(x, y, finger ? REACH_TOUCH : REACH_MOUSE)) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    const d = drag.current;
    d.source = "dock";
    d.id = event.pointerId;
    d.x = x;
    d.y = y;
    d.moved = false;
    // silent until it really moves: it may yet be a tab press
    startDrag(x, y, true, false);
  };
  const onDockMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.source !== "dock" || event.pointerId !== d.id) return;
    const { x, y } = localPoint(event);
    if (!d.moved && Math.hypot(x - d.x, y - d.y) > DRAG_SLOP) {
      d.moved = true;
      plip(0.5, panAt(x));
    }
    if (d.moved) world.dragTo(x, y);
    kick();
  };
  const onDockUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.source !== "dock" || event.pointerId !== d.id) return;
    d.source = "";
    // whatever click follows belongs to this gesture, not to a tab
    d.suppressUntil = performance.now() + 500;
    const tapped = !d.moved && event.type === "pointerup";
    finishDrag();
    if (tapped) choose(tabAt(d.x));
  };
  const onDockClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (performance.now() < drag.current.suppressUntil) {
      drag.current.suppressUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    }
  };

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
    kick();
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
    kick();
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
    kick();
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
      ref={dockRef}
      data-lab-controls={stage ? "" : undefined}
      role={stage ? "radiogroup" : undefined}
      aria-label={stage ? "Tab bar" : undefined}
      aria-hidden={stage ? undefined : true}
      onKeyDown={stage ? onTabsKey : undefined}
      onPointerLeave={stage ? () => setHover(-1) : undefined}
      onPointerDown={stage ? onDockDown : undefined}
      onPointerMove={stage ? onDockMove : undefined}
      onPointerUp={stage ? onDockUp : undefined}
      onPointerCancel={stage ? onDockUp : undefined}
      onClickCapture={stage ? onDockClickCapture : undefined}
      className={cn("absolute", stage ? "touch-pan-y" : "pointer-events-none")}
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
              on ? "opacity-100" : "opacity-[0.78]",
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
            className="absolute grid cursor-[var(--lg-cursor,pointer)] place-items-center rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
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
        className="group/glass absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
        {/* a finger's grab area; it rides on the droplet */}
        <span
          ref={handleRef}
          aria-hidden="true"
          className="absolute top-0 left-0 touch-none rounded-full"
          style={{ width: 0, height: 0 }}
        />
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
      ctx.fillStyle = dark ? "#ff8048" : "#f7874d";
      ctx.beginPath();
      ctx.arc(l.disc.x, l.disc.y, l.disc.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark ? "#3a5fff" : "#3a5ae6";
      for (const band of [l.band, l.band2]) {
        ctx.save();
        ctx.translate(band.x, band.y);
        ctx.rotate(band.angle);
        ctx.beginPath();
        ctx.roundRect(-band.hw, -band.hh, band.hw * 2, band.hh * 2, band.hh);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = dark ? "#ededed" : "#161616";
      ctx.font = `600 ${l.fontPx}px ${fontFamily()}`;
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
