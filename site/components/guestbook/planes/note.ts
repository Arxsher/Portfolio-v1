// What is written on a sheet, and where. Everything here works in sheet
// units with the origin at the middle of the sheet (x right, y down), the
// same space fold.ts folds, so the renderer can map it onto each folded
// face with that face's own transform.
//
//   ┌───────────────────────────────────────────┐
//   │  doodle (fitted, left aligned)            │
//   │                                           │
//   │  the note, up to four lines               │
//   │                                           │
//   │  — name                        21 Oct 2026│
//   └───────────────────────────────────────────┘

import { SIGNATURE_PATTERN } from "@/lib/guestbook";

/** The sheet every plane is folded from (sheet units ≈ CSS px at scale 1). */
export const SHEET = { width: 384, height: 240 } as const;

export type NoteText = {
  name: string;
  message: string;
  /** Already formatted ("21 Oct 2026"), or empty. */
  date: string;
  /** Stored doodle: SVG path data in a 600-unit-wide space. */
  doodle: string;
};

export type Rect = { x: number; y: number; w: number; h: number };

export type NoteLayout = {
  width: number;
  height: number;
  doodle: Rect;
  message: { x: number; y: number; w: number; size: number; line: number; lines: string[] };
  footer: { y: number; left: number; right: number; size: number };
  /** Bounding box of everything written (for skipping blank faces). */
  ink: Rect;
};

let fontFamily = "";

/** The page's sans-serif stack (Geist), read once from the body. */
export function noteFont(): string {
  if (!fontFamily && typeof document !== "undefined") {
    fontFamily = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
  }
  return fontFamily || "system-ui, sans-serif";
}

let measurer: CanvasRenderingContext2D | null = null;
function measureContext(): CanvasRenderingContext2D | null {
  if (measurer) return measurer;
  if (typeof document === "undefined") return null;
  measurer = document.createElement("canvas").getContext("2d");
  return measurer;
}

/** Greedy word wrap; very long words are broken by character. */
export function wrapText(text: string, width: number, size: number, maxLines: number): string[] {
  const ctx = measureContext();
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!ctx || words.length === 0) return words.length ? [text] : [];
  ctx.font = `${size}px ${noteFont()}`;
  const fits = (line: string) => ctx.measureText(line).width <= width;
  const lines: string[] = [];
  let line = "";
  const push = (next: string) => {
    lines.push(next);
  };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (fits(candidate)) {
      line = candidate;
      continue;
    }
    if (line) push(line);
    line = "";
    if (fits(word)) {
      line = word;
      continue;
    }
    // Break a long word across lines.
    let chunk = "";
    for (const char of word) {
      if (fits(chunk + char)) chunk += char;
      else {
        push(chunk);
        chunk = char;
      }
    }
    line = chunk;
  }
  if (line) push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && !fits(`${last}…`)) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

/** Lay a note out on a sheet of the given size. */
export function layoutNote(note: Pick<NoteText, "message">, width = SHEET.width, height = SHEET.height): NoteLayout {
  const pad = Math.round(width * 0.0625);
  const left = -width / 2 + pad;
  const top = -height / 2;
  const inner = width - pad * 2;
  const doodle: Rect = { x: left, y: top + height * 0.085, w: inner, h: height * 0.32 };
  // Shrink a step for long notes that would need a fourth line.
  let size = 15.5;
  let lines = wrapText(note.message, inner, size, 3);
  if (lines.length >= 3 && lines[2].endsWith("…")) {
    size = 14;
    lines = wrapText(note.message, inner, size, 4);
  }
  const line = Math.round(size * 1.42);
  const messageTop = top + height * 0.47;
  const footerY = height / 2 - height * 0.095;
  return {
    width,
    height,
    doodle,
    message: { x: left, y: messageTop, w: inner, size, line, lines },
    footer: { y: footerY, left, right: width / 2 - pad, size: 12.5 },
    ink: { x: left, y: doodle.y, w: inner, h: footerY + 4 - doodle.y },
  };
}

/* ---------------------------------------------------------------------- */
/* doodles                                                                 */
/* ---------------------------------------------------------------------- */

export type DoodleShape = {
  path: Path2D;
  /** Ink bounds in the doodle's own 600-unit space. */
  x: number;
  y: number;
  w: number;
  h: number;
};

const doodleCache = new Map<string, DoodleShape | null>();

/** Parse a stored doodle once; null when it isn't one the pad could have made. */
export function doodleShape(path: string): DoodleShape | null {
  if (doodleCache.has(path)) return doodleCache.get(path) ?? null;
  let shape: DoodleShape | null = null;
  if (path && SIGNATURE_PATTERN.test(path) && typeof Path2D !== "undefined") {
    const numbers = path.match(/-?\d*\.?\d+/g) ?? [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i + 1 < numbers.length; i += 2) {
      const x = Number(numbers[i]);
      const y = Number(numbers[i + 1]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (Number.isFinite(minX)) {
      shape = {
        path: new Path2D(path),
        x: minX,
        y: minY,
        w: Math.max(maxX - minX, 6),
        h: Math.max(maxY - minY, 6),
      };
    }
  }
  if (doodleCache.size > 400) doodleCache.clear();
  doodleCache.set(path, shape);
  return shape;
}

/** Where a doodle lands inside a box: scale and top-left, left aligned. */
export function fitDoodle(shape: DoodleShape, box: Rect) {
  const scale = Math.min(box.w / shape.w, box.h / shape.h, 0.95);
  const w = shape.w * scale;
  const h = shape.h * scale;
  return {
    scale,
    x: box.x - shape.x * scale,
    y: box.y + (box.h - h) / 2 - shape.y * scale,
    w,
    h,
  };
}

export function drawDoodle(ctx: CanvasRenderingContext2D, shape: DoodleShape, box: Rect, color: string, width = 2) {
  const fit = fitDoodle(shape, box);
  ctx.save();
  ctx.translate(fit.x, fit.y);
  ctx.scale(fit.scale, fit.scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = width / fit.scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(shape.path);
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* the written side                                                        */
/* ---------------------------------------------------------------------- */

export type InkColors = { ink: string; inkSoft: string; inkMuted: string };

/** Draw everything written on the sheet, in sheet units. */
export function drawNote(ctx: CanvasRenderingContext2D, note: NoteText, layout: NoteLayout, colors: InkColors, textAlpha = 1) {
  const shape = doodleShape(note.doodle);
  if (shape) drawDoodle(ctx, shape, layout.doodle, colors.ink, 2.1);
  if (textAlpha <= 0.01) return;
  const family = noteFont();
  ctx.save();
  ctx.globalAlpha *= textAlpha;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colors.inkSoft;
  const { message, footer } = layout;
  ctx.font = `${message.size}px ${family}`;
  ctx.textAlign = "left";
  message.lines.forEach((text, index) => {
    ctx.fillText(text, message.x, message.y + message.size + index * message.line);
  });
  ctx.font = `500 ${footer.size + 0.5}px ${family}`;
  ctx.fillStyle = colors.ink;
  const name = `— ${note.name}`;
  ctx.fillText(name, footer.left, footer.y);
  if (note.date) {
    ctx.font = `${footer.size}px ${family}`;
    ctx.fillStyle = colors.inkMuted;
    ctx.textAlign = "right";
    ctx.fillText(note.date, footer.right, footer.y);
  }
  ctx.restore();
}

/**
 * A small bitmap of the written side for planes far away: the doodle in
 * ink, the words as soft pencil lines. Drawn once per plane, then mapped
 * onto its faces like the full note.
 */
export function noteSprite(note: NoteText, layout: NoteLayout, colors: InkColors, unitsPerPixel = 1.6): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const px = 1 / unitsPerPixel;
  canvas.width = Math.ceil(layout.width * px);
  canvas.height = Math.ceil(layout.height * px);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(px, 0, 0, px, (layout.width / 2) * px, (layout.height / 2) * px);
  const shape = doodleShape(note.doodle);
  if (shape) drawDoodle(ctx, shape, layout.doodle, colors.ink, 3.4);
  ctx.strokeStyle = colors.inkMuted;
  ctx.globalAlpha = 0.55;
  ctx.lineCap = "round";
  ctx.lineWidth = layout.message.size * 0.42;
  const family = noteFont();
  ctx.font = `${layout.message.size}px ${family}`;
  layout.message.lines.forEach((text, index) => {
    const width = Math.min(layout.message.w, ctx.measureText(text).width);
    const y = layout.message.y + layout.message.size * 0.62 + index * layout.message.line;
    ctx.beginPath();
    ctx.moveTo(layout.message.x + 1, y);
    ctx.lineTo(layout.message.x + width - 1, y);
    ctx.stroke();
  });
  ctx.globalAlpha = 0.75;
  ctx.font = `500 ${layout.footer.size}px ${family}`;
  const nameWidth = ctx.measureText(`— ${note.name}`).width;
  ctx.beginPath();
  ctx.moveTo(layout.footer.left + 1, layout.footer.y - 4);
  ctx.lineTo(layout.footer.left + nameWidth, layout.footer.y - 4);
  ctx.stroke();
  return canvas;
}
