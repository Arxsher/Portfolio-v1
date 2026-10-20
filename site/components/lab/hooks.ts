// Hooks and small helpers shared by the lab pieces. Everything here is
// client-side; pieces are loaded with ssr: false, so they can rely on
// window / document. Hooks that may also run in server-rendered parents
// (useReducedMotion, useTheme, usePageVisible, useInView) have safe server
// snapshots.
//
//   const { canvasRef, ctxRef, sizeRef, size } = useCanvas2D({ mode });
//   const pointer = usePointer(canvasRef);
//   const glow = useSpring(0, { stiffness: 220, damping: 24 });
//   useFrame(active, (dt, time) => {
//     const ctx = ctxRef.current;
//     if (!ctx) return;
//     const { width, height } = sizeRef.current;   // CSS px; ctx is pre-scaled by dpr
//     glow.to(pointer.current.inside ? 1 : 0);
//     glow.step(dt);
//     ctx.clearRect(0, 0, width, height);
//     …
//   });
//   return <canvas ref={canvasRef} className="absolute inset-0 size-full" />;

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import type { PieceMode, PieceTheme } from "./types";

const isBrowser = typeof window !== "undefined";

/** useLayoutEffect in the browser, useEffect on the server (no warning). */
export const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

/** A ref that always holds the latest value (for callbacks used in long-lived listeners). */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useIsoLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

/* ---------------------------------------------------------------------- */
/* math                                                                    */
/* ---------------------------------------------------------------------- */

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Inverse lerp: where `value` sits between a and b (0..1, unclamped). */
export const unlerp = (a: number, b: number, value: number) => (a === b ? 0 : (value - a) / (b - a));
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp(unlerp(edge0, edge1, x));
  return t * t * (3 - 2 * t);
};
/**
 * Frame-rate independent easing toward a target: `lambda` is how quickly it
 * closes the gap (about 1/lambda seconds to cover 63%).
 *   x = damp(x, target, 12, dt)
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Seeded PRNG (mulberry32): the same seed gives the same sequence, 0 <= n < 1. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 0..1 hash of two integers (cheap per-cell noise). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ---------------------------------------------------------------------- */
/* environment                                                             */
/* ---------------------------------------------------------------------- */

/** Live result of a media query. `serverValue` is used for SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** prefers-reduced-motion: reduce, live. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** True on devices whose main pointer is a mouse or trackpad. */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine)", true);
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const readTheme = (): PieceTheme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

/** The site theme as shown right now; follows the `dark` class on <html> live. */
export function useTheme(): PieceTheme {
  return useSyncExternalStore(subscribeTheme, readTheme, () => "light");
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** False while the tab is in the background. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}

/**
 * Whether the element is within `rootMargin` of the viewport. `once` keeps
 * it true after the first time (handy for mounting); otherwise it follows
 * the element in and out.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = "0px", threshold = 0, once = false }: { rootMargin?: string; threshold?: number; once?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setInView(visible);
        if (visible && once) observer.disconnect();
      },
      { rootMargin, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return inView;
}

/** The element's content-box size in CSS px (0 × 0 until measured). */
export function useElementSize(ref: RefObject<Element | null>): { width: number; height: number } {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useIsoLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = (width: number, height: number) =>
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    const rect = element.getBoundingClientRect();
    update(rect.width, rect.height);
    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/* ---------------------------------------------------------------------- */
/* frame loop                                                              */
/* ---------------------------------------------------------------------- */

/**
 * The frame callback: `dt` is seconds since the last frame (clamped to
 * 0.1 so a stalled tab never jumps), `time` the seconds this loop has been
 * running (paused time is not counted). Return `false` to let the loop
 * sleep until `wake()` is called (saves battery once things have settled).
 */
export type FrameCallback = (dt: number, time: number) => void | boolean;

/**
 * requestAnimationFrame loop that runs while `active` is true and the tab
 * is visible. The callback can change every render; the loop always calls
 * the latest one. Returns `wake()`, which restarts a loop that went to
 * sleep by returning false.
 */
export function useFrame(active: boolean, callback: FrameCallback): () => void {
  const latest = useLatest(callback);
  const visible = usePageVisible();
  const running = active && visible;
  const time = useRef(0);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!running) {
      wakeRef.current = () => {};
      return;
    }
    let raf = 0;
    let last = -1;
    let sleeping = false;
    const loop = (now: number) => {
      const dt = last < 0 ? 1 / 60 : Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      time.current += dt;
      const result = latest.current(dt, time.current);
      if (result === false) {
        sleeping = true;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    wakeRef.current = () => {
      if (!sleeping) return;
      sleeping = false;
      last = -1;
      raf = requestAnimationFrame(loop);
    };
    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
    };
  }, [running, latest]);

  // A stable function that forwards to the current loop.
  const [wake] = useState(() => () => wakeRef.current());
  return wake;
}

/* ---------------------------------------------------------------------- */
/* canvas                                                                  */
/* ---------------------------------------------------------------------- */

export type CanvasSize = {
  /** CSS pixels. */
  width: number;
  height: number;
  /** Device pixels per CSS pixel actually used (capped). */
  dpr: number;
};

export type CanvasOptions = {
  mode: PieceMode;
  /**
   * DPR cap. Defaults: 2 on the stage, 1.5 on tiles. It may change while
   * mounted (e.g. a frame-rate safety net stepping down): the canvas is
   * re-sized and onResize called; the context and onContext are kept.
   */
  maxDpr?: number;
  /** Called after every resize (the backing store was just cleared). */
  onResize?: (size: CanvasSize) => void;
};

const EMPTY_SIZE: CanvasSize = { width: 0, height: 0, dpr: 1 };

function dprFor(mode: PieceMode, maxDpr?: number) {
  const cap = maxDpr ?? (mode === "stage" ? 2 : 1.5);
  return Math.max(1, Math.min(cap, window.devicePixelRatio || 1));
}

/**
 * Sizes a canvas's backing store to its CSS box × DPR whenever either
 * changes (ResizeObserver + DPR media query). `apply` receives the new
 * pixel size. Returns `stop` (the cleanup) and `measure` (re-size now, e.g.
 * after the DPR cap changed).
 */
function observeCanvas(canvas: HTMLCanvasElement, getDpr: () => number, apply: (size: CanvasSize) => void) {
  let frame = 0;
  let cssWidth = 0;
  let cssHeight = 0;
  const commit = () => {
    frame = 0;
    const dpr = getDpr();
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    apply({ width: cssWidth, height: cssHeight, dpr: width / Math.max(1, cssWidth) });
  };
  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    commit();
  };
  const observer = new ResizeObserver(([entry]) => {
    const box = entry.contentBoxSize?.[0];
    cssWidth = box ? box.inlineSize : entry.contentRect.width;
    cssHeight = box ? box.blockSize : entry.contentRect.height;
    // Resize once per frame at most (window drags fire many entries).
    if (!frame) frame = requestAnimationFrame(commit);
  });
  observer.observe(canvas);

  let dprQuery: MediaQueryList | null = null;
  const onDpr = () => {
    dprQuery?.removeEventListener("change", onDpr);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener("change", onDpr);
    measure();
  };
  dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  dprQuery.addEventListener("change", onDpr);

  measure();
  const stop = () => {
    observer.disconnect();
    dprQuery?.removeEventListener("change", onDpr);
    cancelAnimationFrame(frame);
  };
  return { stop, measure };
}

/**
 * Re-sizes the canvas when the DPR cap changes, without tearing the
 * context down (the cap is read live through `latest`).
 */
function useDprCap(maxDpr: number | undefined, measureRef: RefObject<(() => void) | null>) {
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    measureRef.current?.();
  }, [maxDpr, measureRef]);
}

export type Canvas2D = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Pre-scaled by dpr after every resize, so you draw in CSS pixels. */
  ctxRef: RefObject<CanvasRenderingContext2D | null>;
  /** Current size, readable inside frame callbacks without re-rendering. */
  sizeRef: RefObject<CanvasSize>;
  /** The same as state: changes trigger a render (redraw still frames in an effect on it). */
  size: CanvasSize;
};

/**
 * A DPR-aware 2D canvas. Put `canvasRef` on a <canvas> sized by CSS
 * (e.g. `absolute inset-0 size-full`). After each resize the backing store
 * is cleared and the transform reset to scale(dpr); if you change the
 * transform yourself, restore it with ctx.setTransform(dpr, 0, 0, dpr, 0, 0).
 */
export function useCanvas2D(options: CanvasOptions & { alpha?: boolean }): Canvas2D {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<CanvasSize>(EMPTY_SIZE);
  const [size, setSize] = useState<CanvasSize>(EMPTY_SIZE);
  const latest = useLatest(options);
  const measureRef = useRef<(() => void) | null>(null);
  const { mode, maxDpr, alpha = true } = options;

  useIsoLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha });
    ctxRef.current = ctx;
    const { stop, measure } = observeCanvas(
      canvas,
      () => dprFor(mode, latest.current.maxDpr),
      (next) => {
        ctx?.setTransform(next.dpr, 0, 0, next.dpr, 0, 0);
        sizeRef.current = next;
        setSize(next);
        latest.current.onResize?.(next);
      },
    );
    measureRef.current = measure;
    return () => {
      stop();
      measureRef.current = null;
      ctxRef.current = null;
    };
  }, [mode, alpha, latest]);
  useDprCap(maxDpr, measureRef);

  return { canvasRef, ctxRef, sizeRef, size };
}

export type WebGLOptions = CanvasOptions & {
  /** Passed to getContext("webgl2"). Defaults: antialias true, alpha true, premultipliedAlpha true. */
  attributes?: WebGLContextAttributes;
  /**
   * Set up programs, buffers and textures here. Called when the context is
   * created and again after a lost context is restored; return a cleanup
   * (called on loss and unmount).
   */
  onContext?: (gl: WebGL2RenderingContext) => void | (() => void);
};

export type WebGL2 = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Null before creation, while the context is lost, or when WebGL2 is unavailable. */
  glRef: RefObject<WebGL2RenderingContext | null>;
  sizeRef: RefObject<CanvasSize>;
  size: CanvasSize;
  /** null until checked; false means no WebGL2 here (render a fallback). */
  supported: boolean | null;
};

/**
 * A DPR-aware WebGL2 canvas. The viewport is set to the full backing store
 * after every resize; draw with sizeRef.current (CSS px) × dpr in mind.
 *
 * When the component really unmounts, the context is handed back to the
 * browser (WEBGL_lose_context) and the backing store freed, a tick later:
 * home and /lab/ run several pieces at once, and browsers keep only about
 * 16 live contexts, force-losing the oldest (maybe a live tile) past that.
 * The tick matters for StrictMode's rehearsal unmount, which remounts at
 * once on the same canvas and must keep its context. A piece that also
 * releases its own context is fine: whichever runs second sees it lost.
 */
export function useWebGL2(options: WebGLOptions): WebGL2 {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const sizeRef = useRef<CanvasSize>(EMPTY_SIZE);
  const [size, setSize] = useState<CanvasSize>(EMPTY_SIZE);
  const [supported, setSupported] = useState<boolean | null>(null);
  const latest = useLatest(options);
  const measureRef = useRef<(() => void) | null>(null);
  /** Bumped by every run of the effect below, so a stale release can tell it was superseded. */
  const runRef = useRef(0);
  const { mode, maxDpr } = options;

  useIsoLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const run = ++runRef.current;
    const attributes: WebGLContextAttributes = {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
      ...latest.current.attributes,
    };
    const gl = canvas.getContext("webgl2", attributes);
    if (!gl) {
      setSupported(false);
      return;
    }
    setSupported(true);
    let cleanupContext: void | (() => void);
    const setup = () => {
      glRef.current = gl;
      cleanupContext = latest.current.onContext?.(gl);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const teardown = () => {
      if (typeof cleanupContext === "function") cleanupContext();
      cleanupContext = undefined;
      glRef.current = null;
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      teardown();
    };
    const onRestored = () => setup();
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    const { stop, measure } = observeCanvas(
      canvas,
      () => dprFor(mode, latest.current.maxDpr),
      (next) => {
        if (glRef.current) glRef.current.viewport(0, 0, canvas.width, canvas.height);
        sizeRef.current = next;
        setSize(next);
        latest.current.onResize?.(next);
      },
    );
    measureRef.current = measure;
    setup();

    return () => {
      stop();
      measureRef.current = null;
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      teardown();
      // Released only if nothing re-ran on this canvas meanwhile (StrictMode,
      // a mode change) and the canvas has left the document.
      window.setTimeout(() => {
        if (runRef.current !== run || canvas.isConnected || gl.isContextLost()) return;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.width = 0;
        canvas.height = 0;
      }, 0);
    };
  }, [mode, latest]);
  useDprCap(maxDpr, measureRef);

  return { canvasRef, glRef, sizeRef, size, supported };
}

/* ---------------------------------------------------------------------- */
/* pointer                                                                 */
/* ---------------------------------------------------------------------- */

export type PointerState = {
  /** CSS px from the element's top-left. */
  x: number;
  y: number;
  /** 0..1 across the element (y down); goes past 0..1 while a drag is captured outside. */
  nx: number;
  ny: number;
  /** Over the element (or captured by it). */
  inside: boolean;
  pressed: boolean;
  /** Smoothed velocity in CSS px per second. */
  vx: number;
  vy: number;
  /** Where the current / last press started (CSS px). */
  downX: number;
  downY: number;
  /** "mouse" | "pen" | "touch", or "" before any event. */
  type: string;
  /** Element size at the last event (CSS px). */
  width: number;
  height: number;
  /** performance.now() of the last event. */
  time: number;
};

export type PointerHandlers = {
  onDown?: (state: PointerState, event: PointerEvent) => void;
  onMove?: (state: PointerState, event: PointerEvent) => void;
  onUp?: (state: PointerState, event: PointerEvent) => void;
  onLeave?: (state: PointerState, event: PointerEvent) => void;
  /** Capture the pointer on press so drags continue outside (default true). */
  capture?: boolean;
};

const initialPointer = (): PointerState => ({
  x: 0,
  y: 0,
  nx: 0.5,
  ny: 0.5,
  inside: false,
  pressed: false,
  vx: 0,
  vy: 0,
  downX: 0,
  downY: 0,
  type: "",
  width: 0,
  height: 0,
  time: 0,
});

/**
 * Tracks the primary pointer over an element without re-rendering: read
 * `.current` in your frame loop, or react in the handlers. Presses that
 * start on the shared stage controls (ui.tsx, marked data-lab-controls)
 * are ignored, so a click on a tray never paints on the piece below it.
 * Add `touch-none` (touch-action: none) to the element for drag pieces.
 */
export function usePointer(ref: RefObject<HTMLElement | null>, handlers: PointerHandlers = {}): RefObject<PointerState> {
  const state = useRef<PointerState>(initialPointer());
  const latest = useLatest(handlers);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let activeId: number | null = null;

    const update = (event: PointerEvent) => {
      const s = state.current;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      const dt = s.time ? Math.max(1, now - s.time) / 1000 : 0;
      if (dt > 0 && dt < 0.25) {
        const k = 1 - Math.exp(-dt / 0.05);
        s.vx = lerp(s.vx, (x - s.x) / dt, k);
        s.vy = lerp(s.vy, (y - s.y) / dt, k);
      } else {
        s.vx = 0;
        s.vy = 0;
      }
      s.x = x;
      s.y = y;
      s.width = rect.width;
      s.height = rect.height;
      s.nx = rect.width ? x / rect.width : 0.5;
      s.ny = rect.height ? y / rect.height : 0.5;
      s.type = event.pointerType;
      s.time = now;
    };

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button > 0) return;
      if ((event.target as Element | null)?.closest?.("[data-lab-controls]")) return;
      update(event);
      const s = state.current;
      s.pressed = true;
      s.inside = true;
      s.downX = s.x;
      s.downY = s.y;
      activeId = event.pointerId;
      if (latest.current.capture !== false) {
        try {
          element.setPointerCapture(event.pointerId);
        } catch {}
      }
      latest.current.onDown?.(s, event);
    };
    const onMove = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      update(event);
      const s = state.current;
      if (!s.pressed) s.inside = true;
      latest.current.onMove?.(s, event);
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== activeId) return;
      update(event);
      const s = state.current;
      s.pressed = false;
      activeId = null;
      // A finger lifting means it is no longer over the element.
      if (event.pointerType !== "mouse") s.inside = false;
      latest.current.onUp?.(s, event);
    };
    const onLeave = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      const s = state.current;
      if (s.pressed) return;
      s.inside = false;
      latest.current.onLeave?.(s, event);
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    element.addEventListener("pointerleave", onLeave);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, latest]);

  return state;
}

/* ---------------------------------------------------------------------- */
/* springs                                                                 */
/* ---------------------------------------------------------------------- */

export type SpringConfig = {
  /** Default 170. */
  stiffness?: number;
  /** Default 26 (critically damped at mass 1 is 2 × √stiffness ≈ 26). */
  damping?: number;
  /** Default 1. */
  mass?: number;
  /** Settles when both distance and speed are under this. Default 0.001. */
  precision?: number;
};

/** Ready-made feels. */
export const SPRINGS = {
  /** UI snaps: quick, no overshoot to speak of. */
  snappy: { stiffness: 420, damping: 38 },
  /** The default: soft landing. */
  gentle: { stiffness: 170, damping: 26 },
  /** Visible overshoot (stamps, keycaps). */
  bouncy: { stiffness: 320, damping: 14 },
  /** Jelly (glass droplet). */
  wobbly: { stiffness: 180, damping: 10 },
  /** Heavy and slow (platter, camera). */
  slow: { stiffness: 60, damping: 16 },
} as const satisfies Record<string, SpringConfig>;

/**
 * A damped spring, stepped by your frame loop (fixed 1/240 s substeps, so
 * it is stable at any frame rate).
 *   const s = new Spring(0, SPRINGS.bouncy); s.to(1); s.step(dt) → value
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  stiffness = 170;
  damping = 26;
  mass = 1;
  precision = 0.001;

  constructor(value = 0, config: SpringConfig = {}) {
    this.value = value;
    this.target = value;
    this.configure(config);
  }

  configure(config: SpringConfig) {
    if (config.stiffness !== undefined) this.stiffness = config.stiffness;
    if (config.damping !== undefined) this.damping = config.damping;
    if (config.mass !== undefined) this.mass = config.mass;
    if (config.precision !== undefined) this.precision = config.precision;
    return this;
  }

  /** Spring toward a new target (optionally with a kick of velocity). */
  to(target: number, velocity?: number) {
    this.target = target;
    if (velocity !== undefined) this.velocity = velocity;
    return this;
  }

  /** Jump straight to a value and stop. */
  set(value: number) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    return this;
  }

  /** Add velocity (e.g. a flick). */
  impulse(velocity: number) {
    this.velocity += velocity;
    return this;
  }

  get settled() {
    return Math.abs(this.target - this.value) < this.precision && Math.abs(this.velocity) < this.precision;
  }

  step(dt: number): number {
    if (this.settled) {
      this.value = this.target;
      this.velocity = 0;
      return this.value;
    }
    const h = 1 / 240;
    let remaining = Math.min(dt, 0.1);
    while (remaining > 1e-6) {
      const step = Math.min(h, remaining);
      const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
      this.velocity += (force / this.mass) * step;
      this.value += this.velocity * step;
      remaining -= step;
    }
    return this.value;
  }
}

/** A Spring that lives as long as the component (config updates apply on render). */
export function useSpring(initial = 0, config: SpringConfig = {}): Spring {
  const [spring] = useState(() => new Spring(initial, config));
  spring.configure(config);
  return spring;
}
