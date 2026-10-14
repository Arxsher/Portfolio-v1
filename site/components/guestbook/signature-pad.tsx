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
  className,
}: {
  ref?: Ref<SignaturePadHandle>;
  onChange?: (path: string) => void;
  disabled?: boolean;
  /** id of the visible label ("Signature"). */
  labelledBy?: string;
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

  return (
    <div className={cn("relative touch-none", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-labelledby={labelledBy}
        aria-describedby={labelledBy ? `${labelledBy}-hint` : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onLostPointerCapture={endStroke}
        className={cn(
          "block aspect-2/1 w-full touch-none rounded-xl bg-raised text-primary shadow-tray select-none sm:aspect-4/1",
          disabled ? "cursor-default" : "cursor-crosshair",
        )}
      />
      <span
        id={labelledBy ? `${labelledBy}-hint` : undefined}
        aria-hidden={!empty}
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] text-tertiary transition-opacity duration-200 ease-out",
          empty ? "opacity-100" : "opacity-0",
        )}
      >
        Draw your signature here
      </span>
      {!empty && !disabled ? (
        <button
          type="button"
          onClick={clear}
          className="absolute end-1.5 bottom-1.5 cursor-pointer rounded-lg px-2 py-0.5 text-[13px] text-secondary outline-none transition-[color,background-color] duration-150 ease-out animate-fade-in hover:bg-tint hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
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
