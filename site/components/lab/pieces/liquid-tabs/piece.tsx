"use client";

// Liquid tabs: a segmented control whose highlight is a drop of liquid.
//
// The look
// - A groove cut into the stage (a shade under the tile by day, a shade
//   over the darkest surface at night; shadow under its top wall, a lit
//   lip along its bottom edge), the labels printed on its floor in the
//   site's secondary colour, and one drop of liquid sitting in it. The
//   default liquid is the palette's own ink under a clear varnish: glossy
//   black by day, cherry red in Red Dragon, white enamel on AMOLED (look.ts
//   reads the CSS variables, live), with the label under it in the
//   palette's on-ink tone, so the letters invert exactly where the liquid
//   covers them, mid-motion too. Mercury (pure reflection, beads up, never
//   wets) and water (clear, magnifies the label, dark meniscus, a caustic)
//   are one tap away.
// - Everything is lit by one small studio: an overhead softbox the liquid
//   reflects as a highlight band, a strip light on the right, a key glint.
//
// The motion (engine.ts: all springs keep their velocity, nothing resets)
// - Pick a tab and the drop reaches for it: a fresh head leaves on a spring
//   whose pull saturates (a long jump travels, it doesn't teleport), and
//   mass flows into it through a bridge. The longer the bridge, the thinner
//   its middle and the less gets through: an adjacent tab is a teardrop
//   that pours across; two tabs over, the drop strings out like syrup and
//   is reeled back in once the head lands; further, it pinches: two threads
//   snap back, a satellite bead is left where it broke, the remnant (a
//   third of the drop) rounds up and races after the head, touches,
//   bridges gooily (profile.ts: a rolling-ball closing) and drains in with
//   a slosh and a ripple. The landing wobbles on under-damped springs.
// - The "wow" second: a click from Work to Guestbook. The ink pulls into a
//   hairline across the whole bar, snaps, and the last bead races home.
// - Drag: press the drop (it swells under your finger) or anywhere on the
//   bar (the drop comes to you) and scrub; the labels invert as it passes,
//   with a detent tick per tab. Let go and it settles where the throw is
//   heading, squashing against the channel's end if thrown hard. Grabbing
//   mid-flight takes the liquid from wherever it is.
// - Hover: the drop leans toward the tab under the pointer.
// - The floor stays faintly wet behind ink and water for half a second, a
//   film as thick as the liquid was there, drying from the edges.
// - Keys: ← → (wrapping, so End → Home is the longest jump), Home / End,
//   1–5. It's a radio group of real buttons over the canvas; the focus
//   ring sits round the drop's footprint, inside the channel.
// - Sound (stage, after a gesture, lab mute): a plip per landing pitched by
//   the tab, a dry tick at a pinch, a soft blup at a merge, detent ticks
//   while scrubbing, a thud against the channel's ends.
// - Tile: four tabs on a loop of long and short jumps, so every few seconds
//   it strings out and snaps; a mouse over it calls the drop to its tab.
// - Reduced motion: selections land at once, no wet film, no wobble; the
//   tile is a still caught just before the string snaps.
// - Cost: the shader runs only inside the bar's scissor box; the loop
//   sleeps once the liquid has settled and the floor is dry, and stops
//   offscreen (useFrame); the WebGL context is released on unmount
//   (useWebGL2) after the renderer frees its program and textures.
//
// Files: engine.ts (the liquid), profile.ts (outline + wet film), layout.ts
// (bar geometry, label mask), shaders.ts + renderer.ts (WebGL2), look.ts
// (palette), sound.ts, fallback.ts (Canvas 2D without WebGL2).

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ensureAudio } from "../../audio";
import { useElementSize, useFinePointer, useFrame, useLatest, useWebGL2 } from "../../hooks";
import type { PieceProps } from "../../types";
import { MuteButton, Segmented, StageControls, StageHint, Tray } from "../../ui";
import { FEELS, Liquid, type MaterialId } from "./engine";
import { draw2D } from "./fallback";
import { drawLabels, fontFamily, fontReady, layoutBar, STAGE_TABS, TILE_TABS, type BarLayout } from "./layout";
import { MATERIAL_INDEX, MATERIALS, newRoom, readRoom, WET_K } from "./look";
import { Profile, Wet } from "./profile";
import { LiquidRenderer, type Frame } from "./renderer";
import { join, pinch, plip, thud, tick } from "./sound";

/** Tile loop: which tab to jump to, and how long to rest there (s). */
const TILE_LOOP: ReadonlyArray<[number, number]> = [
  [3, 1.5],
  [2, 1.0],
  [0, 1.45],
  [1, 0.95],
  [3, 1.35],
  [0, 1.5],
];

/** A press that moves this far along the bar becomes a drag. */
const DRAG_SLOP = 6;

/**
 * Which palette is on screen ("light", "red-dragon", "amoled"), live: the
 * two dark palettes share the `dark` class, so the theme prop alone can't
 * tell them apart.
 */
function subscribePalette(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-palette"] });
  return () => observer.disconnect();
}
const readPalette = () => {
  const root = document.documentElement;
  return `${root.classList.contains("dark") ? "dark" : "light"}:${root.getAttribute("data-palette") ?? ""}`;
};
function usePalette(): string {
  return useSyncExternalStore(subscribePalette, readPalette, () => "light:");
}

export default function Piece({ mode, active, reducedMotion, theme }: PieceProps) {
  const stage = mode === "stage";
  const labels = stage ? STAGE_TABS : TILE_TABS;
  const rootRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const fallbackRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<LiquidRenderer | null>(null);
  const fine = useFinePointer();
  const size = useElementSize(rootRef);

  const [liquid] = useState(() => {
    const l = new Liquid();
    l.index = stage ? 1 : 0;
    return l;
  });
  const [profile] = useState(() => new Profile());
  const [wet] = useState(() => new Wet());
  const [labelCanvas] = useState(() => (typeof document === "undefined" ? null : document.createElement("canvas")));

  const [index, setIndex] = useState(liquid.index);
  const [material, setMaterial] = useState<MaterialId>("ink");
  const [family, setFamily] = useState("");
  const [fontVersion, setFontVersion] = useState(0);

  const settings = useLatest({ reducedMotion, stage, material });
  const palette = usePalette();
  const live = useRef({
    /** The palette's colours (the site's own switch cross-fades the page, canvas included). */
    room: newRoom(),
    matFrom: 0,
    matTo: 0,
    matT: 1,
    matX: 0,
    labelsKey: "",
    /** Tile loop position and countdown; tile hover. */
    loop: 0,
    countdown: 0.9,
    hovering: false,
    still: false,
    frame: null as Frame | null,
    drag: { id: -1, startX: 0, mode: "none" as "none" | "pending" | "drag" },
  });

  // the font's family name, then again once Geist has loaded
  useEffect(() => {
    let alive = true;
    setFamily(fontFamily());
    void fontReady().then(() => {
      if (!alive) return;
      setFamily(fontFamily());
      setFontVersion((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  const bar: BarLayout | null = useMemo(() => {
    if (size.width < 40 || size.height < 30 || !family) return null;
    return layoutBar(labels, size.width, stage ? size.height * 0.5 : size.height * 0.5, mode, family);
    // fontVersion: re-measure once the real font is in
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, family, fontVersion, mode, labels, stage]);
  const barRef = useLatest(bar);

  const wakeRef = useRef<() => void>(() => {});
  const indexRef = useRef(liquid.index);

  const { canvasRef, sizeRef, supported } = useWebGL2({
    mode,
    attributes: { antialias: false, alpha: true, premultipliedAlpha: true },
    onContext: (gl) => {
      let renderer: LiquidRenderer;
      try {
        renderer = new LiquidRenderer(gl);
      } catch (error) {
        console.error(error);
        return;
      }
      rendererRef.current = renderer;
      live.current.labelsKey = "";
      wakeRef.current();
      return () => {
        renderer.dispose();
        if (rendererRef.current === renderer) rendererRef.current = null;
      };
    },
    onResize: () => {
      rendererRef.current?.resized();
      live.current.labelsKey = "";
      wakeRef.current();
    },
  });

  /**
   * Size the liquid's world to the bar and rest the drop on its tab (again
   * after a resize). Under reduced motion moves land at once and the tile
   * holds its still.
   */
  useEffect(() => {
    if (!bar) return;
    const feel = FEELS[settings.current.material];
    liquid.setFeel(feel);
    liquid.instant = false;
    liquid.setLayout(bar.liquid);
    profile.resize(bar.width, bar.height, feel.blend * bar.liquid.height);
    wet.resize(bar.width + 4);
    live.current.labelsKey = "";
    live.current.still = false;
    if (reducedMotion && !stage) {
      composeStill(liquid, profile, wet, bar);
      live.current.still = true;
    }
    liquid.instant = reducedMotion;
    profile.compute(liquid.prims, liquid.primCount);
    indexRef.current = liquid.index;
    setIndex(liquid.index);
    wakeRef.current();
  }, [bar, liquid, profile, wet, settings, reducedMotion, stage]);

  // the palette's colours, re-read whenever it changes
  useEffect(() => {
    readRoom(live.current.room, theme === "dark");
    wakeRef.current();
  }, [theme, palette]);

  /* -------------------------------------------------------------------- */
  /* frame                                                                 */
  /* -------------------------------------------------------------------- */

  const wake = useFrame(active, (dt) => {
    const b = barRef.current;
    if (!b) return false;
    const L = live.current;
    const s = settings.current;
    const reduced = s.reducedMotion;

    let busy = false;

    // the tile's loop (paused while a mouse is over it)
    if (!s.stage && !L.still) {
      if (!L.hovering) {
        L.countdown -= dt;
        if (L.countdown <= 0) {
          const [to, hold] = TILE_LOOP[L.loop % TILE_LOOP.length];
          L.loop++;
          liquid.select(Math.min(to, liquid.count - 1));
          L.countdown = hold;
        }
      }
      busy = true;
    }

    let moving = false;
    if (!L.still) {
      moving = liquid.step(dt);
      if (s.stage) handleEvents(b);
      if (liquid.index !== indexRef.current) {
        indexRef.current = liquid.index;
        setIndex(liquid.index);
      }
      profile.compute(liquid.prims, liquid.primCount);
      wet.update(profile, b.liquid.height / 2, reduced ? 0 : FEELS[s.material].dry, dt);
    }

    if (L.matT < 1) {
      L.matT = reduced ? 1 : Math.min(1, L.matT + dt / 0.55);
      if (L.matT >= 1) L.matFrom = L.matTo;
      busy = true;
    }

    draw(b);
    return busy || moving || wet.active;
  });
  useEffect(() => {
    wakeRef.current = wake;
  }, [wake]);

  function handleEvents(b: BarLayout) {
    const width = sizeRef.current.width || b.width;
    const m = settings.current.material;
    for (let e = 0; e < liquid.eventCount; e++) {
      const ev = liquid.events[e];
      const pan = ((b.x + ev.x) / width) * 2 - 1;
      if (ev.type === "land") plip(m, ev.index, 0.35 + ev.strength * 0.65, pan);
      else if (ev.type === "pinch") pinch(ev.strength, pan);
      else if (ev.type === "join") join(m, ev.strength, pan);
      else if (ev.type === "cross") tick(ev.index, ev.strength);
      else if (ev.type === "wall") thud(ev.strength, pan);
    }
  }

  function draw(b: BarLayout) {
    const L = live.current;
    const sz = sizeRef.current;
    const renderer = rendererRef.current;
    if (renderer && labelCanvas && sz.width > 0) {
      const key = `${b.key}@${sz.dpr}`;
      if (L.labelsKey !== key) {
        drawLabels(labelCanvas, b, sz.dpr, family || fontFamily());
        renderer.setLabels(labelCanvas);
        L.labelsKey = key;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const f = (L.frame ??= {
        width: 0,
        height: 0,
        dpr: 1,
        bar: { x: 0, y: 0, width: 0, height: 0 },
        dropH: 0,
        dark: 0,
        floor: L.room.floor,
        label: L.room.label,
        fg: L.room.fg,
        ink: L.room.ink,
        onInk: L.room.onInk,
        lip: L.room.lip,
        mat: [0, 0, 1, 0],
        ripple: [0, 10, 0],
        press: 0,
        wetK: 0,
      });
      f.width = canvas.width;
      f.height = canvas.height;
      f.dpr = sz.dpr;
      f.bar.x = b.x;
      f.bar.y = b.y;
      f.bar.width = b.width;
      f.bar.height = b.height;
      f.dropH = b.liquid.height;
      f.dark = L.room.dark;
      f.mat[0] = L.matFrom;
      f.mat[1] = L.matTo;
      f.mat[2] = L.matT;
      f.mat[3] = L.matX;
      f.ripple[0] = liquid.ripple.x;
      f.ripple[1] = liquid.ripple.age;
      f.ripple[2] = settings.current.reducedMotion ? 0 : liquid.ripple.amp;
      f.press = Math.max(0, liquid.press.value);
      f.wetK = WET_K[settings.current.material];
      renderer.render(f, profile, wet);
      return;
    }
    const fb = fallbackRef.current;
    if (fb && supported === false) {
      const ctx = fb.getContext("2d");
      const dpr = Math.min(stage ? 2 : 1.5, window.devicePixelRatio || 1);
      const w = Math.round(size.width * dpr);
      const h = Math.round(size.height * dpr);
      if (fb.width !== w) fb.width = w;
      if (fb.height !== h) fb.height = h;
      if (ctx) draw2D(ctx, dpr, size.width, size.height, b, profile, L.room, family || fontFamily());
    }
  }

  /* -------------------------------------------------------------------- */
  /* input                                                                 */
  /* -------------------------------------------------------------------- */

  const localX = (clientX: number) => {
    const el = hitRef.current;
    const b = barRef.current;
    if (!el || !b) return 0;
    return clientX - el.getBoundingClientRect().left;
  };

  const onDrop = (x: number) => Math.abs(x - liquid.head.x) <= liquid.head.w / 2 + 8;

  const focusTab = (i: number) => buttonsRef.current[i]?.focus({ preventScroll: true });

  const choose = (i: number) => {
    liquid.select(i);
    if (liquid.index !== indexRef.current) {
      indexRef.current = liquid.index;
      setIndex(liquid.index);
    }
    wake();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button > 0 || !barRef.current) return;
    ensureAudio();
    const d = live.current.drag;
    const x = localX(event.clientX);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    d.id = event.pointerId;
    d.startX = x;
    if (onDrop(x)) {
      liquid.grab(x);
      liquid.setPressed(true);
      d.mode = "drag";
      event.currentTarget.style.cursor = "grabbing";
    } else {
      choose(liquid.slotAt(x));
      d.mode = "pending";
    }
    wake();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const d = live.current.drag;
    const x = localX(event.clientX);
    if (d.id === event.pointerId) {
      if (d.mode === "pending" && Math.abs(x - d.startX) > DRAG_SLOP) {
        liquid.grab(x);
        liquid.setPressed(true);
        d.mode = "drag";
        event.currentTarget.style.cursor = "grabbing";
      }
      if (d.mode === "drag" && liquid.drag(x)) {
        indexRef.current = liquid.index;
        setIndex(liquid.index);
      }
      wake();
      return;
    }
    if (event.pointerType === "mouse") {
      liquid.hover(liquid.slotAt(x));
      event.currentTarget.style.cursor = onDrop(x) ? "grab" : "pointer";
      wake();
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = live.current.drag;
    if (d.id !== event.pointerId) return;
    if (d.mode === "drag") {
      const i = liquid.release();
      indexRef.current = i;
      setIndex(i);
    }
    // a mouse still over the bar: aim the hover reach from where it is now
    if (event.pointerType === "mouse") liquid.hover(liquid.slotAt(localX(event.clientX)));
    liquid.setPressed(false);
    d.mode = "none";
    d.id = -1;
    event.currentTarget.style.cursor = "";
    wake();
  };

  const onPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || live.current.drag.id !== -1) return;
    liquid.hover(-1);
    wake();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const n = labels.length;
    const current = liquid.index;
    let next = -1;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (current + 1) % n;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (current - 1 + n) % n;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = n - 1;
        break;
      default:
        if (/^[1-9]$/.test(event.key) && +event.key <= n) next = +event.key - 1;
    }
    if (next < 0) return;
    event.preventDefault();
    event.stopPropagation();
    ensureAudio();
    choose(next);
    focusTab(next);
  };

  const changeMaterial = (m: MaterialId) => {
    if (m === material) return;
    ensureAudio();
    setMaterial(m);
    const L = live.current;
    const b = barRef.current;
    const feel = FEELS[m];
    liquid.setFeel(feel);
    if (b) profile.resize(b.width, b.height, feel.blend * b.liquid.height);
    L.matFrom = L.matTo;
    L.matTo = MATERIAL_INDEX[m];
    L.matX = liquid.head.x;
    if (reducedMotion) {
      L.matT = 1;
      L.matFrom = L.matTo;
    } else {
      L.matT = 0;
      // the new liquid shivers in
      liquid.stretch.velocity += 2.4;
      liquid.ripple.x = liquid.head.x;
      liquid.ripple.age = 0;
      liquid.ripple.amp = 0.8;
    }
    plip(m, liquid.index, 0.5);
    wake();
  };

  // tile: a mouse over it calls the drop to the tab under it
  const onTileMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (stage || event.pointerType !== "mouse" || live.current.still) return;
    const b = barRef.current;
    const root = rootRef.current;
    if (!b || !root) return;
    const x = event.clientX - root.getBoundingClientRect().left - b.x;
    const L = live.current;
    L.hovering = true;
    L.countdown = 1.1;
    const i = liquid.slotAt(x);
    if (i !== liquid.index || Math.abs(liquid.target - liquid.slotCentre(i)) > 0.5) liquid.select(i);
    wake();
  };
  const onTileLeave = () => {
    live.current.hovering = false;
    wake();
  };

  /* -------------------------------------------------------------------- */
  /* render                                                                */
  /* -------------------------------------------------------------------- */

  const hint = fine ? "Click a tab, or drag the drop across · ← → and 1–5 on the keyboard" : "Tap a tab, or drag the drop along the bar";

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 select-none overflow-hidden"
      onPointerMove={stage ? undefined : onTileMove}
      onPointerLeave={stage ? undefined : onTileLeave}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
      {supported === false ? <canvas ref={fallbackRef} aria-hidden="true" className="absolute inset-0 size-full" /> : null}

      {stage && bar ? (
        <>
          <div
            ref={hitRef}
            role="radiogroup"
            aria-label="Sections"
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onPointerLeave={onPointerLeave}
            className="absolute cursor-pointer touch-pan-y"
            style={{ left: bar.x, top: bar.y, width: bar.width, height: bar.height }}
          >
            {/* a taller hit area for fingers, without moving the buttons */}
            <span aria-hidden="true" className="absolute inset-x-0 -inset-y-2.5" />
            {bar.slots.map((slot, i) => (
              <button
                key={labels[i]}
                ref={(node) => {
                  buttonsRef.current[i] = node;
                }}
                type="button"
                role="radio"
                aria-checked={i === index}
                aria-label={labels[i]}
                tabIndex={i === index ? 0 : -1}
                onClick={(event) => {
                  // assistive tech clicks arrive without a pointer press
                  if (event.detail === 0) choose(i);
                }}
                className="absolute cursor-[inherit] rounded-full bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                // the drop's own footprint, so the focus ring sits just
                // round it, inside the channel
                style={{ left: slot.x0, width: slot.x1 - slot.x0, top: bar.inset, bottom: bar.inset }}
              />
            ))}
          </div>

          <StageControls placement="top">
            <Tray>
              <Segmented label="Liquid" options={MATERIALS} value={material} onChange={changeMaterial} />
            </Tray>
          </StageControls>
          <StageControls placement="bottom">
            <Tray>
              <MuteButton />
            </Tray>
            <StageHint>{hint}</StageHint>
          </StageControls>
        </>
      ) : null}
    </div>
  );
}

/**
 * The reduced-motion tile: the drop caught the moment before its string
 * snaps on a long jump, with the floor still wet behind it.
 */
function composeStill(liquid: Liquid, profile: Profile, wet: Wet, bar: BarLayout) {
  liquid.instant = false;
  liquid.rest(0);
  liquid.select(liquid.count - 1);
  const half = bar.liquid.height / 2;
  for (let i = 0; i < 120; i++) {
    liquid.step(1 / 120);
    profile.compute(liquid.prims, liquid.primCount);
    wet.update(profile, half, FEELS.ink.dry, 1 / 120);
    if (liquid.connected && liquid.tail.on && liquid.neck() > 0.8) break;
  }
}
