"use client";

// Draw-your-signature canvas. Works with mouse, pen and touch (pointer
// events, touch-action: none so the page doesn't scroll mid-stroke), draws
// crisp on high-DPI screens and smooths strokes with quadratic curves
// through the midpoints of the sampled points.
//
// onChange receives the drawing as compact SVG path data: every point is
// scaled so the pad is SIGNATURE_WIDTH (600) units wide, rounded to one
// decimal, and each stroke becomes "M x y Q … L x y". An empty string
// means the pad is blank. <Signature> renders the result.
//
// Without a pointer (keyboard, screen readers) the pad offers a button that
// only shows when it has focus: it writes a flowing, signature-like line
// from the typed name (see nameStrokes), which can be cleared like ink.

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, Ref } from "react";
import { GUESTBOOK_LIMITS } from "@/lib/guestbook";
import { cn } from "@/lib/cn";
import { useResolvedTheme } from "@/lib/theme";

/** Width of the coordinate space signatures are stored in. */
export const SIGNATURE_WIDTH = 600;
/** Stroke width in signature units (≈1.7px on the 516px desktop pad). */
const STROKE = 2;
/** Points closer than this (in signature units) to the last one are skipped. */
const MIN_STEP = 1.2;

type Point = [number, number];

export type SignaturePadHandle = {
  clear(): void;
  isEmpty(): boolean;
};

export function SignaturePad({
  ref,
  onChange,
  disabled = false,
  labelledBy,
  name = "",
  onNeedName,
  className,
}: {
  ref?: Ref<SignaturePadHandle>;
  onChange?: (path: string) => void;
  disabled?: boolean;
  /** id of the visible label ("Signature"). */
  labelledBy?: string;
  /** The signer's name, for signing without a pointer. */
  name?: string;
  /** Asked to sign from the keyboard before a name was typed. */
  onNeedName?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Point[][]>([]);
  const active = useRef<{ id: number; points: Point[] } | null>(null);
  const size = useRef({ width: 0, height: 0, dpr: 1 });
  const frame = useRef(0);
  const [empty, setEmpty] = useState(true);
  const theme = useResolvedTheme();

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const paint = useCallback(() => {
    frame.current = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, dpr } = size.current;
    if (!width) return;
    const scale = (width / SIGNATURE_WIDTH) * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const color = getComputedStyle(canvas).color;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    // At least 1.6 CSS px of ink, so the narrow phone pad doesn't feel scratchy.
    ctx.lineWidth = Math.max(STROKE, (1.6 * SIGNATURE_WIDTH) / width);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = active.current ? [...strokes.current, active.current.points] : strokes.current;
    for (const points of all) traceStroke(ctx, points);
  }, []);

  const schedulePaint = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  }, [paint]);

  // Keep the backing store in step with the CSS size and pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      size.current = { width: rect.width, height: rect.height, dpr };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      paint();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // Zooming or moving the window to another screen changes the ratio;
    // each query only matches one ratio, so re-arm it after every change.
    let media: MediaQueryList | null = null;
    const onRatioChange = () => {
      resize();
      watchRatio();
    };
    const watchRatio = () => {
      media?.removeEventListener("change", onRatioChange);
      media = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      media.addEventListener("change", onRatioChange);
    };
    watchRatio();
    return () => {
      observer.disconnect();
      media?.removeEventListener("change", onRatioChange);
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [paint]);

  // The ink colour follows the theme. Paint again on the next frame too, in
  // case the theme class lands just after this render.
  useEffect(() => {
    paint();
    const id = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(id);
  }, [theme, paint]);

  const emit = useCallback(() => {
    const path = encodeSignature(strokes.current);
    setEmpty(strokes.current.length === 0);
    onChangeRef.current?.(path);
  }, []);

  const clear = useCallback(() => {
    strokes.current = [];
    active.current = null;
    paint();
    emit();
  }, [emit, paint]);

  const typedRef = useRef<HTMLButtonElement>(null);
  const clearRef = useRef<HTMLButtonElement>(null);
  // Which of the pad's own buttons should take focus once it has rendered
  // (the one that was pressed has just been swapped for the other).
  const focusNext = useRef<"typed" | "clear" | null>(null);
  useEffect(() => {
    const next = focusNext.current;
    if (!next) return;
    focusNext.current = null;
    (next === "clear" ? clearRef : typedRef).current?.focus({ preventScroll: true });
  });

  const signWithName = () => {
    if (disabled) return;
    if (!name.trim()) {
      onNeedName?.();
      return;
    }
    const { width, height } = size.current;
    const unitHeight = width ? (height * SIGNATURE_WIDTH) / width : SIGNATURE_WIDTH / 4;
    strokes.current = nameStrokes(name, unitHeight);
    active.current = null;
    paint();
    emit();
    focusNext.current = "clear";
  };

  const clearByButton = () => {
    clear();
    focusNext.current = "typed";
  };

  useImperativeHandle(ref, () => ({ clear, isEmpty: () => strokes.current.length === 0 }), [clear]);

  const toPoint = (event: { clientX: number; clientY: number }): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const unit = SIGNATURE_WIDTH / (rect.width || 1);
    const maxY = rect.height * unit;
    return [
      clamp((event.clientX - rect.left) * unit, 0, SIGNATURE_WIDTH),
      clamp((event.clientY - rect.top) * unit, 0, maxY),
    ];
  };

  const addPoint = (points: Point[], point: Point) => {
    const last = points[points.length - 1];
    if (last && Math.hypot(point[0] - last[0], point[1] - last[1]) < MIN_STEP) return;
    points.push(point);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || active.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = { id: event.pointerId, points: [toPoint(event)] };
    setEmpty(false);
    schedulePaint();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = active.current;
    if (!stroke || stroke.id !== event.pointerId) return;
    // Coalesced events carry every sample since the last frame: smoother
    // curves on fast strokes and on 120Hz pens.
    const samples = event.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event.nativeEvent]) addPoint(stroke.points, toPoint(sample));
    schedulePaint();
  };

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = active.current;
    if (!stroke || stroke.id !== event.pointerId) return;
    active.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const candidate = [...strokes.current, stroke.points];
    // Stop accepting ink once the stored path would get too long.
    if (encodeSignature(candidate).length <= GUESTBOOK_LIMITS.signature) strokes.current = candidate;
    paint();
    emit();
  };

  const statusId = labelledBy ? `${labelledBy}-state` : undefined;
  const typedLabel = name.trim() ? `Press Enter to sign as “${name.trim()}”` : "Type your name above to sign with it";

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={statusId}
      className={cn("relative touch-none", className)}
    >
      <span id={statusId} className="sr-only">
        {empty
          ? "Required. Draw your signature with a mouse, pen or finger, or use the sign button to sign with your name."
          : "Signed."}
      </span>
      {/* The pad is a window pane of the guest house: glass, a sheen, a sill. */}
      <div className="gh-pane mb-1.5">
        <span className="gh-pane-sheen" />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onLostPointerCapture={endStroke}
          className={cn(
            "relative block aspect-2/1 w-full touch-none rounded-[10px] text-primary select-none sm:aspect-4/1",
            disabled ? "cursor-default" : "cursor-crosshair",
          )}
        />
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 bottom-1.5 flex items-center justify-center text-[14px] text-tertiary transition-opacity duration-200 ease-out",
          empty ? "opacity-100" : "opacity-0",
        )}
      >
        Sign here with your mouse or finger
      </span>
      {empty && !disabled ? (
        // Shows only while focused, over the hint; pointer presses go
        // through to the canvas underneath.
        <button
          ref={typedRef}
          type="button"
          onClick={signWithName}
          className="pointer-events-none absolute inset-x-0 top-0 bottom-1.5 flex items-center justify-center rounded-[10px] bg-float px-4 text-center text-[14px] text-primary opacity-0 focus-visible:opacity-100 focus-ring"
        >
          {typedLabel}
        </button>
      ) : null}
      {!empty && !disabled ? (
        <button
          ref={clearRef}
          type="button"
          onClick={clearByButton}
          aria-label="Clear signature"
          className="absolute end-1.5 bottom-3 cursor-pointer rounded-lg px-2 py-0.5 text-[13px] text-secondary outline-none transition-[color,background-color] duration-150 ease-out animate-fade-in hover:bg-wash hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

/**
 * A signature-like line for a typed name, in signature units: one flowing
 * stroke per word, letters drawn as humps, tall loops for capitals and
 * ascenders, dips for descenders, and an underline flourish. It is not a
 * font, just a hand-ish line with the rhythm of the name.
 */
export function nameStrokes(name: string, height: number): Point[][] {
  const text = name.trim().replace(/\s+/g, " ").slice(0, 24);
  const letters = [...text];
  if (letters.length === 0) return [];
  const h = Math.max(80, Math.min(height, 300));
  const base = h * 0.6;
  const xHeight = h * 0.17;
  const tall = h * 0.4;
  const deep = h * 0.22;
  const start = SIGNATURE_WIDTH * 0.16;
  const span = SIGNATURE_WIDTH * 0.68;
  const step = Math.min(42, span / Math.max(4, letters.length));
  const used = step * letters.length;
  let x = start + (span - used) / 2;
  const wobble = (index: number, salt: number) => (((letters[index].codePointAt(0) ?? 0) * (salt + 7) + index * 13) % 11) / 10 - 0.5;

  const strokes: Point[][] = [];
  let line: Point[] = [];
  letters.forEach((letter, index) => {
    if (letter === " ") {
      if (line.length) strokes.push(line);
      line = [];
      x += step;
      return;
    }
    const w = step * (0.85 + wobble(index, 1) * 0.2);
    const lift = wobble(index, 3) * xHeight * 0.25;
    const at = (dx: number, dy: number): Point => [clamp(x + dx * w, 0, SIGNATURE_WIDTH), clamp(base - dy + lift, 0, h)];
    if (line.length === 0) line.push(at(-0.15, xHeight * 0.1));
    if (/[A-Z]/.test(letter) || (index === 0 && /\p{L}/u.test(letter))) {
      line.push(at(0.05, tall * 0.8), at(0.35, tall), at(0.25, xHeight * 0.4), at(0.75, xHeight * 0.8), at(1, 0));
    } else if (/[bdfhklt]/.test(letter)) {
      line.push(at(0.25, tall * 0.85), at(0.45, tall * 0.7), at(0.5, 0), at(0.85, xHeight * 0.5), at(1, 0));
    } else if (/[gjpqy]/.test(letter)) {
      line.push(at(0.3, xHeight), at(0.55, 0), at(0.55, -deep), at(0.35, -deep * 0.6), at(1, xHeight * 0.2));
    } else if (/\p{L}/u.test(letter)) {
      line.push(at(0.3, xHeight), at(0.65, xHeight * 0.9), at(1, 0));
    } else {
      line.push(at(0.5, xHeight * 0.5), at(1, 0));
    }
    x += step;
  });
  if (line.length) strokes.push(line);

  // the underline: a long, slightly rising sweep with a small hook
  const first = start + (span - used) / 2;
  const end = Math.min(SIGNATURE_WIDTH * 0.9, first + used + step * 0.6);
  const under = base + Math.min(deep * 0.9, h * 0.16);
  strokes.push([
    [clamp(first - step * 0.2, 0, SIGNATURE_WIDTH), under + 4],
    [first + (end - first) * 0.35, under],
    [first + (end - first) * 0.75, under - 4],
    [end, under - 9],
    [end - step * 0.25, under - 2],
  ]);
  return strokes;
}

function traceStroke(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length === 0) return;
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0][0], points[0][1], ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
}

/** Strokes → "M10 20Q12 22 14 23L16 24M…" (same curve as traceStroke). */
export function encodeSignature(strokes: Point[][]): string {
  let d = "";
  for (const points of strokes) {
    if (points.length === 0) continue;
    const [x0, y0] = points[0];
    d += `M${num(x0)} ${num(y0)}`;
    if (points.length === 1) {
      // A dot: a hair-length line that the round cap turns into a circle.
      d += `L${num(x0 + 0.1)} ${num(y0)}`;
      continue;
    }
    for (let i = 1; i < points.length - 1; i++) {
      const [x, y] = points[i];
      const [nx, ny] = points[i + 1];
      d += `Q${num(x)} ${num(y)} ${num((x + nx) / 2)} ${num((y + ny) / 2)}`;
    }
    const [lx, ly] = points[points.length - 1];
    d += `L${num(lx)} ${num(ly)}`;
  }
  return d;
}

function num(n: number): string {
  // One decimal, no trailing ".0", no negative zero.
  const r = Math.round(n * 10) / 10;
  return String(r === 0 ? 0 : r);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
