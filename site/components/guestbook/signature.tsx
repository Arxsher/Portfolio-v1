// A stored signature drawn as inline SVG. The stroke is currentColor, so a
// `text-primary` parent makes it near-black in light mode and near-white in
// dark mode. The view box is cropped to the ink, so every signature sits
// flush left (or centred) at the same height whatever size it was drawn.

import type { Ref } from "react";
import { SIGNATURE_PATTERN } from "@/lib/guestbook";
import { cn } from "@/lib/cn";

type Box = { x: number; y: number; width: number; height: number };

/** Bounding box of an M/L/Q path, control points included (close enough). */
export function signatureBounds(path: string): Box | null {
  const numbers = path.match(/-?\d*\.?\d+/g);
  if (!numbers || numbers.length < 2) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = Number(numbers[i]);
    const y = Number(numbers[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return null;
  // Room for the round caps, and a minimum size so a lone dot still shows.
  const pad = 3;
  const width = Math.max(maxX - minX, 8) + pad * 2;
  const height = Math.max(maxY - minY, 8) + pad * 2;
  return { x: minX - pad, y: minY - pad, width, height };
}

export function Signature({
  ref,
  path,
  name,
  align = "start",
  draw = false,
  drawMs = DRAW_MS,
  strokeWidth = 2,
  className,
}: {
  ref?: Ref<SVGSVGElement>;
  path: string;
  /** Whose signature it is; becomes the accessible name. */
  name?: string;
  /** Flush left or centred in its box. */
  align?: "start" | "center";
  /** Trace the stroke in once when it mounts. */
  draw?: boolean;
  /** How long the trace takes in total. */
  drawMs?: number;
  /** Stroke width in screen px (the stroke doesn't scale with the box). */
  strokeWidth?: number;
  className?: string;
}) {
  const box = SIGNATURE_PATTERN.test(path) ? signatureBounds(path) : null;
  if (!box) return null;
  const label = name ? `Signature of ${name}` : undefined;
  return (
    <svg
      ref={ref}
      viewBox={`${round(box.x)} ${round(box.y)} ${round(box.width)} ${round(box.height)}`}
      preserveAspectRatio={align === "center" ? "xMidYMid meet" : "xMinYMid meet"}
      className={cn("block shrink-0 overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {label ? <title>{label}</title> : null}
      {draw ? (
        <DrawnStrokes path={path} total={drawMs} strokeWidth={strokeWidth} />
      ) : (
        <path d={path} {...STROKE_PROPS} strokeWidth={strokeWidth} />
      )}
    </svg>
  );
}

const STROKE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
} as const;

// Total time to write the whole signature, shared out by stroke length so
// it traces in the order it was drawn.
const DRAW_MS = 900;
const DRAW_DELAY_MS = 120;

function DrawnStrokes({ path, total: drawMs, strokeWidth }: { path: string; total: number; strokeWidth: number }) {
  const strokes = path.split(/(?=M)/).filter(Boolean);
  const lengths = strokes.map(strokeLength);
  const total = lengths.reduce((sum, n) => sum + n, 0) || 1;
  let elapsed = 0;
  return (
    <>
      {strokes.map((d, index) => {
        const duration = Math.max(30, (lengths[index] / total) * drawMs);
        const delay = DRAW_DELAY_MS + elapsed;
        elapsed += duration;
        return (
          <path
            key={index}
            d={d}
            {...STROKE_PROPS}
            strokeWidth={strokeWidth}
            pathLength={1}
            className="signature-draw"
            style={{ animationDuration: `${Math.round(duration)}ms`, animationDelay: `${Math.round(delay)}ms` }}
          />
        );
      })}
      <style>{`
        .signature-draw {
          stroke-dasharray: 1 2;
          stroke-dashoffset: 1;
          animation-name: signature-draw;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes signature-draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .signature-draw { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  );
}

/** Rough length of one stroke: the polyline through its numbers. */
function strokeLength(d: string): number {
  const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  let length = 0;
  for (let i = 2; i + 1 < n.length; i += 2) length += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
  return Math.max(length, 1);
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
