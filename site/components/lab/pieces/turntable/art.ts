// The printed parts, drawn once with Canvas 2D and sampled by the shader.
//
//   label texture  record space, ±LABEL_TEX mm round the spindle. RGB is the
//                  paper label (sRGB): the arsher mark, the side and speed,
//                  the four bands, small print round the rim. Alpha is the
//                  hand-scratched etching in the run-out, which the shader
//                  turns into matte scratches that catch the light.
//   print texture  the plinth, 480 × 360 mm, uploaded premultiplied: red is
//                  the printing that always shows (the mark and wordmark,
//                  START · STOP, 33, 45, RPM, PITCH, the fader's 0, − and +
//                  and its major ticks), green the hairline detail (the
//                  minor ticks), which the shader fades out wherever it
//                  would only smudge. The shader inks both in the theme's ink.
//
// Everything is original artwork: the mark is the site's pixel arrowhead
// (the same blocks as components/logo.tsx).

import { BANDS, FADER, FADER_CAP, LABEL_R, LOCK_R, PLINTH, RUNOUT_OUTER, SPEED_BUTTONS, START_BUTTON } from "./deck";
import type { LabelStyle } from "./look";
import { LABEL_TEX } from "./shaders";

const MARK: ReadonlyArray<readonly [number, number, number, number]> = [
  [7, 1, 2, 2],
  [5, 3, 2, 3],
  [9, 3, 2, 3],
  [3, 6, 2, 4],
  [11, 6, 2, 4],
  [1, 10, 2, 5],
  [13, 10, 2, 5],
  [7, 10, 2, 2],
];

function fontFamily(): string {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (value) return `${value}, ui-sans-serif, system-ui, sans-serif`;
  } catch {}
  return "ui-sans-serif, system-ui, sans-serif";
}

/** Resolves when Geist can be drawn (or at once when that can't be checked). */
export function fontReady(): Promise<void> {
  try {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();
    if (!family || !document.fonts) return Promise.resolve();
    return Promise.all([document.fonts.load(`500 20px ${family}`), document.fonts.load(`600 20px ${family}`)]).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

type Ctx = CanvasRenderingContext2D;

function spacing(ctx: Ctx, value: string) {
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = value;
}

/** The mark, `size` units tall, centred on (x, y). */
function mark(ctx: Ctx, x: number, y: number, size: number) {
  const u = size / 16;
  const x0 = x - size / 2;
  const y0 = y - size / 2;
  for (const [bx, by, bw, bh] of MARK) ctx.fillRect(x0 + bx * u, y0 + by * u, bw * u, bh * u);
}

/** Text set on a circle, centred on angle `at` (0 = top, clockwise), tops outward. */
function arcText(ctx: Ctx, text: string, radius: number, at: number, track: number) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width + track);
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = at - total / radius / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  [...text].forEach((ch, i) => {
    const w = widths[i];
    const a = angle + w / 2 / radius;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -radius);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    angle += w / radius;
  });
}

/**
 * The label and the run-out etching. `size` is the texture's side in
 * pixels (it spans 2 × LABEL_TEX mm).
 */
export function drawLabel(style: LabelStyle, size: number, canvas: HTMLCanvasElement = document.createElement("canvas")) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const k = size / (LABEL_TEX * 2);
  const family = fontFamily();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, size, size);
  ctx.setTransform(k, 0, 0, k, size / 2, size / 2);

  // paper (a hair past the label's edge, so filtering never reaches bare texels)
  ctx.fillStyle = style.paper;
  ctx.beginPath();
  ctx.arc(0, 0, LABEL_R + 1, 0, Math.PI * 2);
  ctx.fill();

  // accent band and a fine ring inside it
  ctx.strokeStyle = style.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, LABEL_R - 2.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = style.ink;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  ctx.arc(0, 0, LABEL_R - 8.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // small print round the rim
  ctx.fillStyle = style.ink;
  ctx.font = `500 2.15px ${family}`;
  ctx.globalAlpha = 0.78;
  arcText(ctx, "SYNTHESISED IN THE BROWSER  ·  NO SAMPLES  ·  90 BPM  ·  D MINOR", LABEL_R - 6, 0, 0.42);
  arcText(ctx, "ARSHER LAB No. 08  ·  SIDE A", LABEL_R - 6, Math.PI, 0.42);
  ctx.globalAlpha = 1;

  // the mark and the wordmark
  ctx.fillStyle = style.ink;
  mark(ctx, 0, -25.5, 13);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 5.6px ${family}`;
  spacing(ctx, "0.1px");
  ctx.fillText("arsher", 0, -12.6);
  spacing(ctx, "0px");

  // side and speed, either side of the spindle
  ctx.fillStyle = style.accent;
  ctx.font = `600 9px ${family}`;
  ctx.fillText("A", -24, 0.4);
  ctx.fillStyle = style.ink;
  ctx.font = `600 5px ${family}`;
  ctx.fillText("33⅓", 24, -1.2);
  ctx.font = `500 2.2px ${family}`;
  spacing(ctx, "0.35px");
  ctx.fillText("RPM", 24, 3.4);
  spacing(ctx, "0px");

  // a hairline under the centre row
  ctx.globalAlpha = 0.35;
  ctx.fillRect(-20, 8.4, 40, 0.18);
  ctx.globalAlpha = 1;

  // the four bands
  ctx.font = `500 2.55px ${family}`;
  ctx.textBaseline = "alphabetic";
  BANDS.forEach((band, i) => {
    const y = 13.6 + i * 3.9;
    ctx.globalAlpha = 0.9;
    ctx.textAlign = "right";
    ctx.fillText(band.id, -5.4, y);
    ctx.textAlign = "left";
    ctx.fillText(band.name, -3.2, y);
  });
  ctx.globalAlpha = 1;

  // the run-out etching (alpha only): a matrix number and a little mark,
  // scratched by hand between the label and the lead-out
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.font = `italic 400 2.6px ${family}`;
  const etchR = (LOCK_R + LABEL_R) / 2 + 0.6;
  ctx.save();
  // at the bottom, reading along the arc
  ctx.rotate(Math.PI);
  arcText(ctx, "ARS-008-A1", etchR, 0, 0.32);
  ctx.restore();
  // the mark, outlined as if scratched, a third of a turn round
  ctx.save();
  ctx.rotate(-Math.PI * 0.62);
  ctx.translate(0, -etchR + 0.8);
  ctx.lineWidth = 0.22;
  const u = 3.2 / 16;
  for (const [bx, by, bw, bh] of MARK) ctx.strokeRect(-1.6 + bx * u, -1.6 + by * u, bw * u, bh * u);
  ctx.restore();
  ctx.save();
  ctx.rotate(Math.PI * 0.55);
  ctx.font = `italic 400 2.2px ${family}`;
  arcText(ctx, "90 · Dm", (RUNOUT_OUTER + LOCK_R) / 2 - 2.6, 0, 0.3);
  ctx.restore();

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}

/** Printing that always shows, and hairline detail the shader drops when small (see the header). */
const ESSENTIAL = "#ff0000";
const FINE = "#00ff00";

/**
 * The plinth's printing, `k` pixels per millimetre. Nothing is set smaller
 * than 4.2 mm, about 5 CSS px at the stage's usual size: below that, type
 * on a deck reads as dirt, not detail.
 */
export function drawPrint(k: number, canvas: HTMLCanvasElement = document.createElement("canvas")) {
  canvas.width = Math.round(PLINTH.w * k);
  canvas.height = Math.round(PLINTH.h * k);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const family = fontFamily();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = ESSENTIAL;

  // the mark and wordmark in the far left corner
  mark(ctx, 20, 22, 9);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 6.4px ${family}`;
  ctx.fillText("arsher", 28.5, 22.4);

  // START · STOP over the button
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 4.2px ${family}`;
  spacing(ctx, "0.32px");
  ctx.fillText("START · STOP", START_BUTTON.x, START_BUTTON.y - START_BUTTON.half - 4);

  // speeds under their buttons, RPM between them
  ctx.font = `600 4.4px ${family}`;
  spacing(ctx, "0.2px");
  for (const b of SPEED_BUTTONS) ctx.fillText(String(b.rpm), b.x, b.y + b.r + 6.6);
  ctx.font = `600 4.2px ${family}`;
  spacing(ctx, "0.45px");
  ctx.fillText("RPM", (SPEED_BUTTONS[0].x + SPEED_BUTTONS[1].x) / 2, SPEED_BUTTONS[0].y + SPEED_BUTTONS[0].r + 12.8);
  spacing(ctx, "0px");

  // the pitch scale: a major tick every 4%, hairlines between
  const x = FADER.x - FADER_CAP.across - 2.4;
  for (let i = -8; i <= 8; i++) {
    const y = FADER.y + (i / 8) * FADER.half;
    if (i % 4 === 0) {
      ctx.fillStyle = ESSENTIAL;
      ctx.fillRect(x - 4.4, y - 0.26, 4.4, 0.52);
    } else {
      ctx.fillStyle = FINE;
      ctx.fillRect(x - 2.4, y - 0.17, 2.4, 0.34);
    }
  }
  ctx.fillStyle = ESSENTIAL;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.font = `600 4.2px ${family}`;
  // slower away from you, faster toward you, as on a DJ deck
  ctx.fillText("−", x - 5.6, FADER.y - FADER.half + 0.1);
  ctx.fillText("0", x - 5.6, FADER.y + 0.15);
  ctx.fillText("+", x - 5.6, FADER.y + FADER.half + 0.1);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  spacing(ctx, "0.45px");
  ctx.fillText("PITCH", FADER.x, FADER.y - FADER.half - FADER_CAP.along - 5.4);
  spacing(ctx, "0px");

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}
