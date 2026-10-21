// The detail the big switches add to the landscape (the lab tile and the
// stage; the header switch never imports this): a cabin on the middle ridge
// whose windows light one after the other at dusk and whose chimney smokes
// at night, a few pines, a lake in the valley that mirrors the ridge and
// lays a glitter path under the sun and then the moon, birds crossing the
// day sky, fireflies over the near hills at night, the Milky Way and now and
// then a shooting star (stage). Everything is in track fractions like the
// rest of the scene and moves with its ridge's parallax.
//
// Allocation: random tables are made once here; per frame only a few
// gradients are built. The Milky Way and the firefly glow are drawn once per
// size into offscreen canvases.

import { clamp, seededRandom, smoothstep } from "../../hooks";
import { color, rgba } from "./palette";
import type { Extras, SwitchView } from "./render";
import { hillY, shiftAt, type Scene } from "./scene";

const LAKE = 0.742;
const CABIN_X = 0.4;

type Detail = "tile" | "stage";

export function createExtras(detail: Detail): Extras {
  const stage = detail === "stage";
  const random = seededRandom(stage ? 913 : 77);

  // glitter: per dash depth, jitter, length, phase, speed
  const GLITTER = stage ? 34 : 14;
  const glitter = new Float32Array(GLITTER * 5);
  for (let i = 0; i < GLITTER; i++) {
    glitter.set([Math.pow(random(), 0.8), random() * 2 - 1, 0.4 + random(), random() * 6.283, 1.5 + random() * 3], i * 5);
  }

  // fireflies: base x, base y, three phases, speed
  const FLIES = stage ? 16 : 6;
  const flies = new Float32Array(FLIES * 6);
  for (let i = 0; i < FLIES; i++) {
    flies.set(
      [0.04 + random() * 0.5, 0.74 + random() * 0.17, random() * 6.283, random() * 6.283, random() * 6.283, 0.6 + random()],
      i * 6,
    );
  }

  // pines: layer, x, height (fraction of the track height)
  const PINES: ReadonlyArray<readonly ["mid" | "near", number, number]> = stage
    ? [
        ["mid", 0.452, 0.075],
        ["mid", 0.47, 0.058],
        ["mid", 0.338, 0.052],
        ["mid", 0.66, 0.05],
        ["mid", 0.676, 0.066],
        ["near", 0.88, 0.1],
        ["near", 0.905, 0.132],
        ["near", 0.935, 0.088],
        ["near", 0.115, 0.11],
        ["near", 0.14, 0.082],
      ]
    : [
        ["mid", 0.455, 0.085],
        ["mid", 0.66, 0.06],
        ["near", 0.89, 0.12],
        ["near", 0.92, 0.09],
        ["near", 0.12, 0.11],
      ];

  let milky: HTMLCanvasElement | null = null;
  let fly: HTMLCanvasElement | null = null;
  // shooting star
  let shotOn = false;
  let shotAt = 0;
  let shotNext = 4;
  let shotX = 0;
  let shotY = 0;
  let shotVX = 0;
  let shotVY = 0;
  const SHOT_DUR = 0.75;

  function bakeMilkyWay(view: SwitchView) {
    const { w, h, dpr } = view;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const g = canvas.getContext("2d");
    if (!g) return null;
    g.scale(dpr, dpr);
    // a band from the lower left up to the top, across the night side
    const ax = 0.0 * w;
    const ay = 0.66 * h;
    const bx = 0.6 * w;
    const by = -0.05 * h;
    const length = Math.hypot(bx - ax, by - ay);
    g.translate((ax + bx) / 2, (ay + by) / 2);
    g.rotate(Math.atan2(by - ay, bx - ax));
    const band = h * 0.2;
    const glow = g.createLinearGradient(0, -band, 0, band);
    glow.addColorStop(0, "rgba(190,200,240,0)");
    glow.addColorStop(0.35, "rgba(200,206,240,0.07)");
    glow.addColorStop(0.5, "rgba(236,226,232,0.13)");
    glow.addColorStop(0.65, "rgba(200,206,240,0.07)");
    glow.addColorStop(1, "rgba(190,200,240,0)");
    g.fillStyle = glow;
    g.fillRect(-length / 2, -band, length, band * 2);
    const r = seededRandom(5150);
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 1400; i++) {
      const u = r() - 0.5;
      // roughly Gaussian across the band
      const v = (r() + r() + r() - 1.5) * 0.62;
      g.globalAlpha = 0.12 + r() * 0.4;
      const size = 0.25 + r() * r() * 0.65;
      g.fillRect(u * length, v * band, size, size);
    }
    // a dark dust lane along it
    g.globalAlpha = 1;
    const lane = g.createLinearGradient(0, -band * 0.25, 0, band * 0.25);
    lane.addColorStop(0, "rgba(8,12,26,0)");
    lane.addColorStop(0.5, "rgba(8,12,26,0.22)");
    lane.addColorStop(1, "rgba(8,12,26,0)");
    g.fillStyle = lane;
    g.fillRect(-length / 2, -band * 0.25 + band * 0.08, length, band * 0.5);
    return canvas;
  }

  function bakeFly(dpr: number) {
    const size = 24;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(size * dpr);
    canvas.height = canvas.width;
    const g = canvas.getContext("2d");
    if (!g) return null;
    g.scale(dpr, dpr);
    const glow = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    glow.addColorStop(0, "rgba(255,246,190,1)");
    glow.addColorStop(0.18, "rgba(255,232,150,0.75)");
    glow.addColorStop(0.45, "rgba(250,214,120,0.2)");
    glow.addColorStop(1, "rgba(250,214,120,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, size, size);
    return canvas;
  }

  function pine(ctx: CanvasRenderingContext2D, x: number, base: number, height: number) {
    const half = height * 0.3;
    const top = base - height;
    ctx.moveTo(x, top);
    ctx.lineTo(x + half * 0.55, top + height * 0.36);
    ctx.lineTo(x + half * 0.32, top + height * 0.36);
    ctx.lineTo(x + half * 0.85, top + height * 0.7);
    ctx.lineTo(x + half * 0.5, top + height * 0.7);
    ctx.lineTo(x + half, base);
    ctx.lineTo(x - half, base);
    ctx.lineTo(x - half * 0.5, top + height * 0.7);
    ctx.lineTo(x - half * 0.85, top + height * 0.7);
    ctx.lineTo(x - half * 0.32, top + height * 0.36);
    ctx.lineTo(x - half * 0.55, top + height * 0.36);
    ctx.closePath();
  }

  function pines(ctx: CanvasRenderingContext2D, view: SwitchView, s: Scene, layer: "mid" | "near") {
    const { w, h } = view;
    const dx = shiftAt(layer, s.t);
    ctx.beginPath();
    for (let i = 0; i < PINES.length; i++) {
      const [l, x, height] = PINES[i];
      if (l !== layer) continue;
      pine(ctx, (x + dx) * w, hillY(layer, x) * h + h * 0.012, height * h);
    }
    ctx.fillStyle = layer === "mid" ? color("near", s.t) : color("fore", s.t);
    ctx.globalAlpha = layer === "mid" ? 0.88 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function cabin(ctx: CanvasRenderingContext2D, view: SwitchView, s: Scene, time: number) {
    const { w, h } = view;
    const t = s.t;
    const x = (CABIN_X + shiftAt("mid", t)) * w;
    const base = hillY("mid", CABIN_X) * h + h * 0.006;
    const bw = h * (stage ? 0.072 : 0.1);
    const bh = h * (stage ? 0.042 : 0.058);
    const roof = h * (stage ? 0.032 : 0.044);
    // chimney smoke at night, drifting off to the right
    const smoke = smoothstep(0.62, 0.8, t);
    if (smoke > 0.01) {
      const cx = x + bw * 0.24;
      const cy = base - bh - roof * 0.95;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const rise = h * 0.11;
      for (let k = 1; k <= 8; k++) {
        const u = k / 8;
        ctx.lineTo(cx + u * h * 0.05 + Math.sin(time * 0.9 + u * 5) * h * 0.008 * u, cy - u * rise);
      }
      const plume = ctx.createLinearGradient(0, cy, 0, cy - rise);
      plume.addColorStop(0, `rgba(190,198,220,${(0.2 * smoke).toFixed(3)})`);
      plume.addColorStop(1, "rgba(190,198,220,0)");
      ctx.strokeStyle = plume;
      ctx.lineWidth = h * 0.018;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    // the house
    ctx.fillStyle = color("near", t);
    ctx.fillRect(x - bw / 2, base - bh, bw, bh + h * 0.01);
    ctx.fillRect(x + bw * 0.18, base - bh - roof * 0.95, h * 0.011, roof * 0.7);
    ctx.beginPath();
    ctx.moveTo(x - bw / 2 - h * 0.008, base - bh + h * 0.002);
    ctx.lineTo(x - bw * 0.05, base - bh - roof);
    ctx.lineTo(x + bw * 0.05, base - bh - roof);
    ctx.lineTo(x + bw / 2 + h * 0.008, base - bh + h * 0.002);
    ctx.closePath();
    ctx.fillStyle = color("fore", t);
    ctx.fill();
    // windows: sky-coloured glass by day, then lit one after the other
    const winW = bw * 0.17;
    const winH = bh * 0.36;
    const wy = base - bh * 0.7;
    const first = smoothstep(0.5, 0.58, t);
    const second = smoothstep(0.6, 0.7, t);
    for (let i = 0; i < 2; i++) {
      const on = i === 0 ? first : second;
      const wx = i === 0 ? x - bw * 0.28 : x + bw * 0.1;
      ctx.globalAlpha = 1;
      ctx.fillStyle = rgba("lower", t, 0.55 * (1 - on));
      ctx.fillRect(wx, wy, winW, winH);
      if (on > 0.01) {
        const gx = wx + winW / 2;
        const gy = wy + winH / 2;
        const reach = h * (stage ? 0.06 : 0.08);
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, reach);
        glow.addColorStop(0, `rgba(255,206,128,${(0.42 * on).toFixed(3)})`);
        glow.addColorStop(1, "rgba(255,206,128,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(gx - reach, gy - reach, reach * 2, reach * 2);
        ctx.globalAlpha = on;
        ctx.fillStyle = "#ffd58e";
        ctx.fillRect(wx, wy, winW, winH);
      }
    }
    ctx.globalAlpha = 1;
  }

  function lake(ctx: CanvasRenderingContext2D, view: SwitchView, s: Scene, time: number) {
    const { w, h } = view;
    const t = s.t;
    const top = LAKE * h;
    const water = ctx.createLinearGradient(0, top, 0, h);
    water.addColorStop(0, color("lake", t));
    water.addColorStop(1, color("lakeDeep", t));
    ctx.fillStyle = water;
    ctx.fillRect(0, top, w, h - top);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, w, h - top);
    ctx.clip();
    // the middle ridge, upside down
    const mid = view.hills?.mid;
    if (mid) {
      ctx.save();
      ctx.translate(shiftAt("mid", t) * w, top * 2);
      ctx.scale(1, -1);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color("mid", t);
      ctx.fill(mid);
      ctx.restore();
    }
    // the shoreline catches the light
    ctx.globalAlpha = 1;
    ctx.fillStyle = rgba("horizon", t, 0.35);
    ctx.fillRect(0, top, w, Math.max(0.6, h * 0.004));

    // glitter under the sun, then under the moon
    const sunGlint = s.sunLight * (0.45 + 0.55 * s.golden);
    const moonGlint = s.moonLight * 0.85;
    for (let pass = 0; pass < 2; pass++) {
      const amount = pass === 0 ? sunGlint : moonGlint;
      if (amount < 0.02) continue;
      const cx = (pass === 0 ? s.sunX : s.moonX) * w;
      ctx.fillStyle = pass === 0 ? color("sun", t) : "#e9edf7";
      for (let i = 0; i < GLITTER; i++) {
        const o = i * 5;
        const depth = glitter[o];
        const y = top + h * 0.008 + depth * (h - top) * 0.95;
        const spread = w * (0.012 + 0.05 * depth);
        const x = cx + glitter[o + 1] * spread + Math.sin(time * 0.7 + glitter[o + 3]) * h * 0.006;
        const len = glitter[o + 2] * h * (0.03 + 0.05 * depth);
        const flicker = 0.5 + 0.5 * Math.sin(time * glitter[o + 4] + glitter[o + 3]);
        ctx.globalAlpha = amount * (0.35 + 0.65 * flicker) * (1 - depth * 0.45);
        ctx.fillRect(x - len / 2, y, len, Math.max(0.6, h * 0.0045));
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function birds(ctx: CanvasRenderingContext2D, view: SwitchView, s: Scene, time: number) {
    if (s.birds < 0.01) return;
    const { w, h } = view;
    const count = stage ? 3 : 2;
    ctx.strokeStyle = `rgba(52,58,70,${(0.6 * s.birds).toFixed(3)})`;
    ctx.lineWidth = Math.max(0.8, h * 0.0045);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const phase = (time * 0.016 + i * 0.07 + 0.25) % 1.4;
      const x = (1.12 - phase) * w + i * h * 0.05;
      const y = (0.2 + i * 0.045 + 0.012 * Math.sin(time * 0.7 + i * 2)) * h;
      const size = h * (stage ? 0.02 : 0.03) * (1 - i * 0.12);
      // flap in bouts, glide between
      const bout = smoothstep(0.2, 0.6, Math.sin(time * 0.9 + i * 1.7));
      const flap = Math.sin(time * (9 + i)) * bout * 0.8 + 0.25;
      ctx.moveTo(x - size, y - flap * size * 0.55);
      ctx.quadraticCurveTo(x - size * 0.45, y - flap * size * 0.6 - size * 0.12, x, y);
      ctx.quadraticCurveTo(x + size * 0.45, y - flap * size * 0.6 - size * 0.12, x + size, y - flap * size * 0.55);
    }
    ctx.stroke();
  }

  function fireflies(ctx: CanvasRenderingContext2D, view: SwitchView, s: Scene, time: number) {
    const on = smoothstep(0.76, 0.95, s.t);
    if (on < 0.01 || !fly) return;
    const { w, h } = view;
    const size = h * (stage ? 0.05 : 0.09);
    const dx = shiftAt("near", s.t) * w;
    for (let i = 0; i < FLIES; i++) {
      const o = i * 6;
      const speed = flies[o + 5];
      const x = (flies[o] + 0.025 * Math.sin(time * 0.45 * speed + flies[o + 2])) * w + dx;
      const y = (flies[o + 1] + 0.02 * Math.sin(time * 0.6 * speed + flies[o + 3])) * h;
      const blink = clamp(Math.sin(time * 1.3 * speed + flies[o + 4]) * 1.6 - 0.3);
      if (blink <= 0.01) continue;
      ctx.globalAlpha = on * blink;
      ctx.drawImage(fly, x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  function shootingStar(ctx: CanvasRenderingContext2D, view: SwitchView, s: Scene, time: number) {
    if (!stage && !shotOn && time < shotNext) return;
    if (!shotOn) {
      if (time <= 0 || time < shotNext || s.night < 0.92) return;
      shotOn = true;
      shotAt = time;
      shotX = 0.1 + random() * 0.34;
      shotY = 0.04 + random() * 0.16;
      shotVX = -(0.28 + random() * 0.16);
      shotVY = 0.16 + random() * 0.08;
    }
    const u = (time - shotAt) / SHOT_DUR;
    if (u >= 1 || u < 0) {
      shotOn = false;
      shotNext = time + 5 + random() * 8;
      return;
    }
    const { w, h } = view;
    const hx = (shotX + shotVX * u * SHOT_DUR) * w;
    const hy = (shotY + shotVY * u * SHOT_DUR) * h;
    const tx = hx - shotVX * 0.22 * w;
    const ty = hy - shotVY * 0.22 * h;
    const alpha = Math.sin(Math.PI * u) * s.night;
    const trail = ctx.createLinearGradient(tx, ty, hx, hy);
    trail.addColorStop(0, "rgba(255,255,255,0)");
    trail.addColorStop(1, `rgba(255,255,255,${(0.9 * alpha).toFixed(3)})`);
    ctx.strokeStyle = trail;
    ctx.lineWidth = Math.max(0.8, h * 0.005);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(hx, hy);
    ctx.stroke();
  }

  return {
    resize(view) {
      milky = stage ? bakeMilkyWay(view) : null;
      fly = bakeFly(view.dpr);
    },
    sky(view, ctx, s, time) {
      const t = s.t;
      if (milky) {
        const a = smoothstep(0.78, 1, t) * 0.85;
        if (a > 0.01) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = a;
          ctx.drawImage(milky, 0, 0);
          ctx.restore();
        }
      }
      shootingStar(ctx, view, s, time);
      if (time > 0) view.ambient = true;
    },
    air(view, ctx, s, time) {
      birds(ctx, view, s, time);
    },
    middle(view, ctx, s, time) {
      pines(ctx, view, s, "mid");
      cabin(ctx, view, s, time);
      lake(ctx, view, s, time);
    },
    front(view, ctx, s, time) {
      pines(ctx, view, s, "near");
      fireflies(ctx, view, s, time);
    },
  };
}
