// GLSL for liquid glass. Two full-screen passes (see renderer.ts):
//
//   SCENE  the room behind the glass, drawn once per frame at the canvas's
//          own resolution into a half-float texture (8-bit where half float
//          can't be rendered) with a full mip chain. Values go above 1 for
//          the bulbs and the sun patch, so frosted glass over a bulb spreads
//          its light into a real glow instead of a grey smudge.
//            wall    plaster (the same paint in both themes, a faint
//                    texture) lit by an ambient term, a lamp glow from the
//                    lower right and a vignette
//            window  the light of a window on the left wall: a
//                    parallelogram with vertical sides and sloping top and
//                    bottom (as a window's bars land on a back wall),
//                    crisp near the window and softer away from it, cut by
//                    a mullion and a transom. Raindrops on the glass cast
//                    beads (a dark ring with a bright point), some slide
//                    down in fits and starts and leave a wet trail
//            glass   shadows: a soft one from the room light (warm-tinted,
//                    lighter right under the glass), and inside the window
//                    light a crisp sun shadow that lets most light through,
//                    darkens where the rim bends it away, gathers it in a
//                    bright line just inside, and focuses the droplet's
//                    light into a hot spot (the droplet's caustic)
//            string  two swags of fairy lights: a thin wire on a parabola,
//                    small bulbs hanging from it on little caps, each one
//                    lighting the wall around it; they come on one by one
//                    and then breathe
//            bokeh   a second string close to the lens, out of focus: big
//                    discs with a brighter rim, squeezed into cat's eyes
//                    toward the frame's edges, drifting and breathing.
//                    Dark: added light. Light: a veil of soft cream light
//   GLASS  the screen. Outside the glass it is the scene texture, texel for
//          texel. Inside, the dock (a rounded box) and the droplet (a
//          squashable ellipse) are one signed distance field joined by a
//          smooth union, so they bridge and merge like liquid. A thickness
//          profile over that field (a rounded bevel at the rim, flat beyond
//          it) gives a surface normal at every pixel; the scene is read
//          through it with refract() at six wavelengths (dispersion) and
//          through the mip chain (frost), then tinted and lit: a Fresnel
//          reflection of the room, the window reflected as a soft box with
//          its bars, the lamp low on the right, the fairy lights as a row of
//          glints along upward-facing rims, a bright rim, and on hover the
//          pointer. A soft shoulder brings it all back under 1, then film
//          grain.
//
//          The dock is frosted and its rim lenses in a thin sliver of what
//          lies just beyond it. The droplet is the clearest part: it skips
//          the frost, magnifies what is under its flat middle, bends it hard
//          at its rim and gathers a crescent of light on its far side.
//          Under each icon the dock calms its ground toward a plate tone
//          (light under ink icons, dark under white ones) so the icons read
//          over anything. The selected tab is a small lens inside the bar
//          with its own rim and highlight.
//
// Coordinates are CSS pixels from the top-left (y down) in both passes.

import { BOKEH_SLOTS, PALETTE_KEYS } from "./scene";

const PALETTE = PALETTE_KEYS.map(
  (key, i) => `#define P_${key.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()} u_pal[${i}]`,
).join("\n");

const COMMON = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 u_res;      // CSS px
uniform float u_dpr;     // device px per CSS px of the target being drawn
uniform vec4 u_dock;     // centre x, y, half width, half height
uniform float u_dockR;   // corner radius
uniform vec4 u_drop;     // centre x, y, radius, smooth-union k
uniform vec3 u_squash;   // stretch axis x, y, stretch (0 = round)
uniform float u_bevelDock;
uniform float u_bevelDrop;
uniform float u_time;    // seconds of ambient motion (frozen under reduced motion)
uniform vec3 u_pal[${PALETTE_KEYS.length}];
${PALETTE}

vec2 fragPos() {
  return vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Ellipse distance, the gradient-corrected approximation (good near the edge).
float sdEllipse(vec2 p, vec2 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  if (k1 < 1e-5) return -min(r.x, r.y);
  return k0 * (k0 - 1.0) / k1;
}

float sdDrop(vec2 p) {
  vec2 d = p - u_drop.xy;
  vec2 u = u_squash.xy;
  vec2 q = vec2(dot(d, u), dot(d, vec2(-u.y, u.x)));
  float s = 1.0 + u_squash.z;
  return sdEllipse(q, u_drop.z * vec2(s, 1.0 / s));
}

float sdDock(vec2 p) {
  return sdRoundBox(p - u_dock.xy, u_dock.zw, u_dockR);
}

// Polynomial smooth minimum; h is the weight of a (1 = all a).
float smin(float a, float b, float k, out float h) {
  h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// The glass: dock ∪ droplet. wDrop says how much of this point is droplet.
float glass(vec2 p, out float wDrop) {
  float h;
  float d = smin(sdDock(p), sdDrop(p), u_drop.w, h);
  wDrop = 1.0 - h;
  return d;
}

float glass(vec2 p) {
  float w;
  return glass(p, w);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/** The room as a function of position (the SCENE pass). */
const SCENE_FN = /* glsl */ `
uniform float u_ignite;     // seconds since the lights were switched on
uniform vec4 u_lamp;        // x, y, radius, -
uniform vec4 u_win;         // x, y (top-left), width, height
uniform vec4 u_winBars;     // slope, mullion (0..1), transom (0..1), bar half width
uniform vec2 u_winSoft;     // edge softness near the window, far from it
uniform vec2 u_sun;         // the sun's shadow offset
uniform float u_rain;       // raindrop cell
uniform vec4 u_plant;       // the plant on the sill, in window space: base x, y, size, -
uniform vec4 u_swag[2];     // x0, y0, x1, y1
uniform vec4 u_swagB[2];    // sag, bulb spacing, phase, sway
uniform vec4 u_bulb;        // radius, hang, halo radius, wire half width
uniform vec4 u_bokeh[${BOKEH_SLOTS}];  // x, y, radius, seed
uniform vec4 u_look;        // bokeh amount, bokeh blend (0 add .. 1 veil), vignette, wire alpha
uniform vec4 u_shadow;      // offset x, y, blur, opacity
uniform float u_caustic;

float lineAA(float dist, float halfWidth, float px) {
  return 1.0 - smoothstep(halfWidth - px * 0.5, halfWidth + px * 0.5, dist);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

// A bead of water on the window, as its shadow lands: light bent away from
// its rim (a dark ring) and gathered into a bright point. q and c in cells.
float bead(vec2 q, vec2 c, float r) {
  vec2 d = (q - c) / r;
  float l = length(d * vec2(1.0, 0.9));
  float shade = 1.0 - smoothstep(0.55, 1.08, l);
  vec2 dc = d - vec2(0.12, 0.2);
  float core = exp(-dot(dc, dc) * 14.0);
  return 1.0 - 0.42 * shade + 1.25 * core;
}

// The rain on the window glass, at w (CSS px across and down the window).
float rain(vec2 w) {
  float f = 1.0;
  // small beads, one per cell, some cells dry
  vec2 cell = floor(w / u_rain);
  vec2 q = w / u_rain - cell;
  float h = hash12(cell + 17.0);
  if (h > 0.56) {
    vec2 c = vec2(hash12(cell + 3.1), hash12(cell + 7.7)) * 0.5 + 0.25;
    f *= bead(q, c, mix(0.08, 0.17, hash12(cell + 11.3)));
  }
  // fewer, bigger beads
  float big = u_rain * 2.7;
  vec2 cell2 = floor(w / big + 0.37);
  vec2 q2 = w / big + 0.37 - cell2;
  float h2 = hash12(cell2 + 51.0);
  if (h2 > 0.7) {
    vec2 c = vec2(hash12(cell2 + 5.3), hash12(cell2 + 9.1)) * 0.44 + 0.28;
    f *= bead(q2, c, mix(0.1, 0.17, hash12(cell2 + 2.9)));
  }
  // in some columns a drop slides down in fits and starts, leaving a trail
  float cw = u_rain * 3.4;
  float ci = floor(w.x / cw);
  float hc = hash12(vec2(ci, 41.0));
  if (hc > 0.52) {
    float span = u_win.w + u_rain * 8.0;
    float hop = u_rain * 3.0;
    float tt = u_time * mix(0.35, 0.9, hash12(vec2(ci, 7.0))) + hc * 29.0;
    float k = floor(tt);
    float y = (k + smoothstep(0.55, 1.0, fract(tt))) * hop;
    y = mod(y + hc * span, span) - u_rain * 4.0;
    float x = (ci + 0.5 + (hash12(vec2(ci, 3.0)) - 0.5) * 0.4) * cw;
    vec2 d = (w - vec2(x + sin(w.y * 0.05 + hc * 9.0) * u_rain * 0.18, y)) / u_rain;
    f *= bead(d, vec2(0.0), 0.3);
    float trail = (1.0 - smoothstep(0.04, 0.12, abs(d.x))) * smoothstep(0.0, -0.4, d.y) * smoothstep(-14.0, -1.0, d.y);
    f *= 1.0 - 0.16 * trail;
  }
  return f;
}

// The window's light at p: 0..1, and where on the window it is.
float windowLight(vec2 p, out vec2 w, out float across) {
  float slope = u_winBars.x;
  float u = (p.x - u_win.x) / u_win.z;
  float top = u_win.y + slope * (p.x - u_win.x);
  float v = (p.y - top) / u_win.w;
  across = clamp(u, 0.0, 1.0);
  w = vec2(p.x - u_win.x, p.y - top);
  float soft = mix(u_winSoft.x, u_winSoft.y, across);
  float perp = inversesqrt(1.0 + slope * slope);
  float dx = min(p.x - u_win.x, u_win.x + u_win.z - p.x);
  float dy = min(v, 1.0 - v) * u_win.w * perp;
  float m = smoothstep(-soft, soft, dx) * smoothstep(-soft, soft, dy);
  // the bars
  float bm = abs(p.x - (u_win.x + u_winBars.y * u_win.z)) - u_winBars.w;
  float bt = abs(v - u_winBars.z) * u_win.w * perp - u_winBars.w * 0.85;
  m *= smoothstep(-soft, soft, bm) * smoothstep(-soft, soft, bt);
  return m;
}

// A leaf: the intersection of two discs (pointed at both ends), along y.
float sdLeaf(vec2 p, float r, float d) {
  p = abs(p);
  float b = sqrt(r * r - d * d);
  return ((p.y - b) * d > p.x * b) ? length(p - vec2(0.0, b)) : length(p - vec2(-d, 0.0)) - r;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}

// The shadow of a small potted plant on the window sill (0 clear .. 1
// shade): a pot, and broad leaves fanning out on short stems, stirring in
// a draught. w in window space (CSS px across and down the window).
float plantShade(vec2 w) {
  float S = u_plant.z;
  if (S <= 0.0) return 0.0;
  vec2 q = (w - u_plant.xy) / S;
  if (q.y > 0.05 || q.y < -1.3 || abs(q.x) > 1.0) return 0.0;
  // the pot: a little wider at the rim
  float potH = 0.24;
  float potW = mix(0.13, 0.17, clamp(-q.y / potH, 0.0, 1.0));
  float d = max(abs(q.x) - potW, abs(q.y + potH * 0.5) - potH * 0.5);
  d = min(d, max(abs(q.x) - 0.185, abs(q.y + potH + 0.012) - 0.026));
  vec2 base = vec2(0.0, -potH - 0.02);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float h = hash12(vec2(fi, 3.7));
    // fan the stems out, the middle ones tallest
    float side = fi / 7.0 - 0.5;
    float a = side * 2.1 + (h - 0.5) * 0.25;
    a += sin(u_time * (0.5 + h * 0.4) + fi * 1.3) * 0.03;
    float len = mix(0.5, 0.22, abs(side) * 2.0) * (0.8 + 0.4 * h);
    vec2 dir = vec2(sin(a), -cos(a));
    vec2 tip = base + dir * len;
    d = min(d, sdSegment(q, base, tip) - 0.009);
    // a broad leaf from the tip, drooping outward a little more
    float la = a * 1.25 + sign(side) * 0.15;
    float ll = mix(0.3, 0.22, abs(side) * 2.0) * (0.85 + 0.3 * h);
    vec2 lc = tip + vec2(sin(la), -cos(la)) * ll;
    vec2 lq = q - lc;
    lq = vec2(cos(la) * lq.x + sin(la) * lq.y, -sin(la) * lq.x + cos(la) * lq.y);
    // a leaf of length 2 * ll and width about 0.75 * ll
    d = min(d, sdLeaf(lq / ll, 1.0, 0.64) * ll);
  }
  float soft = 0.03;
  return smoothstep(soft, -soft, d);
}

// Inside the window light: the glass's crisp sun shadow.
float sunShadow(vec2 p) {
  float w;
  float ds = glass(p - u_sun, w);
  if (ds > 3.0) return 1.0;
  float inside = smoothstep(1.4, -1.4, ds);
  float bevel = mix(u_bevelDock, u_bevelDrop, w);
  // the rim bends light away from its own shadow's edge, and gathers it a
  // little further in
  float edge = exp(-pow((ds + bevel * 0.4) / (bevel * 0.42), 2.0));
  float focus = exp(-pow((ds + bevel * 1.05) / (bevel * 0.2), 2.0)) * (1.0 - w);
  vec2 cq = p - u_sun - u_drop.xy;
  float spot = exp(-dot(cq, cq) / pow(u_drop.z * 0.26, 2.0)) * w;
  float t = 0.7 - 0.5 * edge + 0.4 * focus + 1.8 * spot;
  return mix(1.0, t, inside);
}

// The fairy lights: light they cast on the wall, light they give off, and
// how much the wire and caps cover.
void strings(vec2 p, float px, inout vec3 glow, inout vec3 emit, inout float cover) {
  for (int s = 0; s < 2; s++) {
    vec4 a = u_swag[s];
    vec4 b = u_swagB[s];
    float fs = float(s);
    float span = a.z - a.x;
    float sag = b.x * (1.0 + 0.035 * sin(u_time * 0.45 + fs * 2.3));
    float sway = sin(u_time * 0.5 + fs * 1.7) * b.w;
    // the wire: a parabola through both ends, its low point swaying
    float t0 = clamp((p.x - a.x) / span, 0.0, 1.0);
    float t = (p.x - a.x - sway * 4.0 * t0 * (1.0 - t0)) / span;
    if (t > 0.0 && t < 1.0) {
      float y = mix(a.y, a.w, t) + sag * 4.0 * t * (1.0 - t);
      float dy = ((a.w - a.y) + sag * 4.0 * (1.0 - 2.0 * t)) / span;
      float d = abs(p.y - y) * inversesqrt(1.0 + dy * dy);
      cover = max(cover, lineAA(d, u_bulb.w, px));
    }
    // the bulbs (this one and its neighbours)
    float sp = b.y;
    float fi = floor((p.x - a.x) / sp - b.z + 0.5);
    for (int k = -1; k <= 1; k++) {
      float i = fi + float(k);
      float bx = a.x + (i + b.z) * sp;
      float tb = (bx - a.x) / span;
      if (tb < 0.0 || tb > 1.0) continue;
      float by = mix(a.y, a.w, tb) + sag * 4.0 * tb * (1.0 - tb);
      bx += sway * 4.0 * tb * (1.0 - tb);
      float h = hash12(vec2(i * 1.7 + 3.0, fs * 13.0 + 1.0));
      // each hangs from the wire and swings a little
      float swing = sin(u_time * (0.8 + h * 0.6) + h * 6.2832) * 0.14;
      vec2 hang = vec2(sin(swing), cos(swing));
      vec2 top = vec2(bx, by);
      vec2 c = top + hang * u_bulb.y;
      vec2 q = p - c;
      float r = u_bulb.x;
      // switched on one after another along the string, with a blink
      float order = fs * 22.0 + i;
      float tOn = 0.35 + order * 0.034 + h * 0.03;
      float on = smoothstep(tOn, tOn + 0.06, u_ignite);
      on *= 1.0 - 0.65 * exp(-pow((u_ignite - tOn - 0.13) * 22.0, 2.0));
      // and then breathe, each at its own pace
      on *= 0.86 + 0.14 * sin(u_time * (0.7 + h * 1.4) + h * 40.0);
      // the cap: a short dark stem from the wire to the bulb
      vec2 pa = p - top;
      vec2 ba = (c - hang * r * 0.8) - top;
      float hseg = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
      float stem = length(pa - ba * hseg);
      cover = max(cover, lineAA(stem, max(r * 0.42, 0.5), px));
      // the bulb: a small glass drop, hot in its core
      vec2 bq = vec2(dot(q, vec2(hang.y, -hang.x)), dot(q, hang));
      float e = length(bq / vec2(r * 0.8, r * 1.05));
      float body = 1.0 - smoothstep(1.0 - px / r, 1.0 + px / r, e);
      vec2 cq = bq - vec2(0.0, r * 0.15);
      float core = exp(-dot(cq, cq) / (r * r * 0.35));
      emit += mix(P_BULB_OFF * 0.9, P_BULB * (0.55 + 0.45 * core), on) * body;
      // a little bloom around it, and the light it throws on the wall
      emit += P_BULB * on * 0.14 * exp(-dot(q, q) / (r * r * 7.0));
      glow += P_HALO * on * exp(-dot(q, q) / (u_bulb.z * u_bulb.z));
    }
  }
}

// The near string, out of focus: rgb is light, a is coverage.
vec4 bokeh(vec2 p) {
  vec4 acc = vec4(0.0);
  vec2 mid = u_res * 0.5;
  float reach = length(u_res) * 0.5;
  for (int i = 0; i < ${BOKEH_SLOTS}; i++) {
    vec4 b = u_bokeh[i];
    if (b.z <= 0.0) continue;
    float s = b.w;
    vec2 c = b.xy + vec2(sin(u_time * (0.11 + 0.08 * fract(s * 7.13)) + s * 6.2832),
                         cos(u_time * (0.09 + 0.06 * fract(s * 3.71)) + s * 4.1)) * b.z * 0.16;
    float r = b.z * (1.0 + 0.035 * sin(u_time * 0.3 + s * 9.0));
    vec2 d = p - c;
    if (dot(d, d) > r * r * 1.35) continue;
    float dist = length(d) - r;
    // toward the frame's edges the disc is cut by the lens barrel: a cat's eye
    vec2 away = c - mid;
    float off = smoothstep(0.4, 1.0, length(away) / reach);
    vec2 dir = away / max(length(away), 1.0);
    float cut = length(d + dir * r * 0.42 * off) - r;
    dist = max(dist, cut);
    float soft = max(1.1, r * 0.075);
    float disc = smoothstep(soft, -soft, dist);
    // nearly flat, a little brighter toward the edge, with a faint rim
    float fill = 0.84 + 0.16 * smoothstep(-r * 0.8, 0.0, dist);
    float rim = exp(-pow((dist + soft * 1.4) / (soft * 1.3), 2.0));
    vec3 col = mix(mix(P_BOKEH_A, P_BOKEH_B, fract(s * 3.3)), P_BOKEH_C, step(0.72, fract(s * 5.9)));
    float on = smoothstep(0.0, 0.7, u_ignite - 0.7 - fract(s * 11.3) * 1.1);
    float breathe = 0.88 + 0.12 * sin(u_time * (0.35 + 0.5 * fract(s * 2.9)) + s * 20.0);
    float a = (disc * fill + rim * 0.14) * on * breathe * (0.45 + 0.55 * fract(s * 13.7));
    acc += vec4(col * a, a);
  }
  return acc * u_look.x;
}

// selfD: the glass's distance field at p. Under the glass itself its soft
// shadow is faint (light goes through it); it shows where it falls beside it.
vec3 sceneColor(vec2 p, float px, float selfD) {
  vec2 n = p / u_res;
  // the plaster
  vec3 albedo = mix(P_ALBEDO_TOP, P_ALBEDO_BOTTOM, smoothstep(0.0, 1.0, n.y));
  float tex = vnoise(p * 0.035) * 0.6 + vnoise(p * 0.19 + 7.0) * 0.4;
  albedo *= 0.975 + 0.05 * tex;

  // room light: ambient and the lamp
  vec3 light = P_AMBIENT;
  vec2 lq = (p - u_lamp.xy) / u_lamp.z;
  float l2 = dot(lq, lq);
  light += P_LAMP * (1.0 / (1.0 + l2 * 4.0)) * (1.0 - smoothstep(0.6, 2.2, l2));

  // the glass's soft shadow in it: a wide drop plus a tight contact shade
  float ds = glass(p - u_shadow.xy);
  float drop = 1.0 - smoothstep(-u_shadow.z * 0.45, u_shadow.z, ds);
  float dc = glass(p - u_shadow.xy * 0.22);
  float contact = 1.0 - smoothstep(-1.0, u_shadow.z * 0.22, dc);
  float beside = smoothstep(-8.0, 2.0, selfD);
  float shade = clamp((drop + contact * 0.45) * u_shadow.w * mix(0.25, 1.0, beside), 0.0, 1.0);
  light *= mix(vec3(1.0), P_SHADOW_TINT, shade);

  // the window, with the rain on it and the glass in its way
  vec2 w;
  float across;
  float win = windowLight(p, w, across);
  vec3 sun = mix(P_WINDOW, P_WINDOW_FAR, across);
  if (win > 0.001) {
    light += sun * win * rain(w) * sunShadow(p) * (1.0 - 0.82 * plantShade(w));
  }
  // and a little of it bounced around the patch
  float spillX = smoothstep(-u_win.z * 0.35, u_win.z * 0.25, min(p.x - u_win.x, u_win.x + u_win.z - p.x));
  float spillY = smoothstep(-u_win.w * 0.3, u_win.w * 0.3, min(w.y, u_win.w - w.y));
  light += sun * spillX * spillY * 0.12;

  // the fairy lights
  vec3 glow = vec3(0.0);
  vec3 emit = vec3(0.0);
  float cover = 0.0;
  strings(p, px, glow, emit, cover);
  light += glow;

  vec3 col = albedo * light;
  // the droplet's soft caustic in the room light
  vec2 cp = p - (u_drop.xy + u_shadow.xy * 1.15);
  float spot = exp(-dot(cp, cp) / pow(u_drop.z * 0.42, 2.0));
  col += spot * P_CAUSTIC * u_caustic * (1.0 - drop * 0.4) * mix(0.2, 1.0, beside);

  // a soft vignette
  vec2 vq = (n - 0.5) * vec2(1.0, 0.9);
  col *= 1.0 - u_look.z * smoothstep(0.2, 0.85, length(vq) * 1.25);

  col = mix(col, P_WIRE, cover * u_look.w);
  col += emit;

  vec4 bk = bokeh(p);
  col = col * (1.0 - min(bk.a, 1.0) * u_look.y) + bk.rgb;
  return col;
}
`;

export const VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const SCENE = /* glsl */ `${COMMON}
${SCENE_FN}
out vec4 outColor;

void main() {
  vec2 p = fragPos();
  outColor = vec4(sceneColor(p, 1.0 / u_dpr, glass(p)), 1.0);
}
`;

export const GLASS = /* glsl */ `${COMMON}
uniform sampler2D u_scene;
uniform vec2 u_px;         // canvas size in device px
uniform float u_refract;   // 0..1, the slider
uniform float u_frost;     // 0..1, the slider
uniform vec4 u_tint;       // rgb, strength
uniform vec4 u_pill;       // selection: x, y, half w, half h
uniform float u_pillAmt;
uniform vec4 u_hover;      // x, y, radius, strength
uniform vec4 u_ripples[4]; // x, y, age (s), amplitude
uniform vec3 u_pointer;    // x, y, strength (only while hovering near the glass)
uniform float u_dark;      // 0 light .. 1 dark
uniform float u_lod;       // mip levels available - 1
uniform vec4 u_icons;      // first icon x, row y, pitch, count
uniform vec4 u_plate;      // radius, strength, tone (0: ink icons, 1: white icons), -
uniform vec4 u_envWin;     // the window in the reflection: centre (R.xy), half size
uniform float u_grain;
uniform float u_grainSeed;

out vec4 outColor;

// Cubic B-spline lookup of one mip level from four bilinear taps: the
// mips stay smooth when magnified (no blocky frost).
vec3 bicubicLevel(vec2 uv, float level) {
  vec2 size = vec2(textureSize(u_scene, int(level)));
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 s0 = w0 + w1;
  vec2 s1 = w2 + w3;
  vec2 t0 = (i - 0.5 + w1 / s0) / size;
  vec2 t1 = (i + 1.5 + w3 / s1) / size;
  return (textureLod(u_scene, vec2(t0.x, t0.y), level).rgb * s0.x +
          textureLod(u_scene, vec2(t1.x, t0.y), level).rgb * s1.x) * s0.y +
         (textureLod(u_scene, vec2(t0.x, t1.y), level).rgb * s0.x +
          textureLod(u_scene, vec2(t1.x, t1.y), level).rgb * s1.x) * s1.y;
}

// The scene through the glass. Clear glass reads the mips straight
// (trilinear); frosted glass uses the cubic filter, blended in over half a
// level so moving the slider never shows a step.
vec3 sceneTex(vec2 p, float lod) {
  vec2 uv = p / u_res;
  uv.y = 1.0 - uv.y;
  uv = clamp(uv, vec2(0.0005), vec2(0.9995));
  if (lod < 1.0) return textureLod(u_scene, uv, lod).rgb;
  float l0 = floor(lod);
  vec3 cubic = mix(bicubicLevel(uv, l0), bicubicLevel(uv, l0 + 1.0), lod - l0);
  if (lod < 1.5) return mix(textureLod(u_scene, uv, lod).rgb, cubic, (lod - 1.0) * 2.0);
  return cubic;
}

// The scene as drawn, at this very pixel.
vec3 sceneHere() {
  return textureLod(u_scene, gl_FragCoord.xy / u_px, 0.0).rgb;
}

// Identity up to the knee, then a soft shoulder to 1: the bulbs' and the
// sun's extra light turns into a white-hot core instead of clipping.
vec3 shoulder(vec3 c) {
  const float k = 0.8;
  vec3 over = max(c - k, 0.0);
  return min(c, vec3(k)) + (1.0 - k) * (1.0 - exp(-over / (1.0 - k)));
}

// Film grain, a touch stronger in the mid tones.
vec3 finish(vec3 c) {
  c = shoulder(max(c, 0.0));
  float y = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float g = hash12(gl_FragCoord.xy + u_grainSeed) - 0.5;
  g += hash12(gl_FragCoord.xy * 1.37 + u_grainSeed + 19.0) - 0.5;
  return c + g * u_grain * (0.55 + 0.9 * y * (1.0 - y));
}

// a travelling ring on the surface; returns the tilt it adds
vec2 rippleTilt(vec2 p) {
  vec2 tilt = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 r = u_ripples[i];
    if (r.w <= 0.0) continue;
    vec2 d = p - r.xy;
    float dist = length(d);
    float front = r.z * 260.0;
    float x = dist - front;
    float env = exp(-x * x / 900.0) * exp(-r.z * 2.6) * r.w;
    tilt += (dist > 0.001 ? d / dist : vec2(0.0)) * cos(x * 0.16) * env;
  }
  return tilt;
}

float sdPill(vec2 q) {
  return sdRoundBox(q, u_pill.zw, min(u_pill.z, u_pill.w));
}

void main() {
  vec2 p = fragPos();
  float px = 1.0 / u_dpr;

  float wDrop;
  float d = glass(p, wDrop);
  if (d > px) {
    outColor = vec4(finish(sceneHere()), 1.0);
    return;
  }

  // the field's slope: which way is "out" from here
  float e = 0.6;
  vec2 g = vec2(glass(p + vec2(e, 0.0)) - glass(p - vec2(e, 0.0)), glass(p + vec2(0.0, e)) - glass(p - vec2(0.0, e)));
  float glen = length(g);
  g = glen > 1e-5 ? g / glen : vec2(0.0);

  // thickness profile: a quarter-round bevel at the rim, flat beyond it
  float bevel = mix(u_bevelDock, u_bevelDrop, wDrop);
  float depth = max(-d, 0.0);
  float t = clamp(depth / bevel, 0.0, 1.0);
  float s = 1.0 - t;
  float height = sqrt(max(1.0 - s * s, 0.0));
  float slope = s / max(height, 0.09);
  float dock = 1.0 - wDrop;

  // the selected tab is a shallow lens of its own inside the bar
  vec2 pq = p - u_pill.xy;
  float dp = sdPill(pq);
  float pillOn = u_pillAmt * dock;
  float pillMask = smoothstep(px, -px, dp) * pillOn;
  vec2 pg = vec2(sdPill(pq + vec2(e, 0.0)) - sdPill(pq - vec2(e, 0.0)), sdPill(pq + vec2(0.0, e)) - sdPill(pq - vec2(0.0, e)));
  pg = length(pg) > 1e-5 ? normalize(pg) : vec2(0.0);
  float ps = 1.0 - clamp(-dp / max(u_pill.w * 0.5, 1.0), 0.0, 1.0);
  vec2 pillTilt = pg * (ps / max(sqrt(max(1.0 - ps * ps, 0.0)), 0.3)) * 0.2 * pillMask;

  float strength = mix(0.25, 1.35, u_refract);
  vec2 tilt = g * slope * strength + rippleTilt(p) * (1.0 - wDrop * 0.6) + pillTilt;
  vec3 n = normalize(vec3(tilt, 1.0));

  // refraction. The rim draws in what lies just beyond it; the dock keeps
  // that to a thin sliver, the droplet bends it further.
  float thick = bevel * (0.45 + 0.55 * height) * mix(0.5, 1.25, u_refract);
  thick = min(thick, bevel * mix(0.6, 1.3, wDrop));
  float maxShift = bevel * mix(0.75, 1.2, wDrop);
  // the droplet magnifies what lies under its flat middle a touch
  vec2 mag = -(p - u_drop.xy) * (0.07 + 0.11 * u_refract) * wDrop * height;
  // frost: the dock reads blurrier mips; the droplet stays clear unless frosted
  float lod = (u_frost * 4.4 + height * (0.45 + 1.4 * u_frost)) * (1.0 - 0.85 * wDrop) + (1.0 - height) * 0.35 * dock;
  lod = min(u_lod - 1.0, lod);

  // dispersion: a little stronger in the clear droplet, where it shows
  float disp = 0.045 * (0.35 + u_refract) * (1.0 + 0.5 * wDrop);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float f = float(i) / 5.0;
    float eta = 1.0 / (1.5 + (f - 0.5) * disp * 2.0);
    vec3 r = refract(vec3(0.0, 0.0, -1.0), n, eta);
    vec2 shift = -r.xy / max(-r.z, 0.25) * thick;
    float sl = length(shift);
    if (sl > maxShift) shift *= maxShift / sl;
    vec3 smp = sceneTex(p + shift + mag, lod);
    vec3 w = i == 0 ? vec3(0.5, 0.0, 0.0)
           : i == 1 ? vec3(0.35, 0.15, 0.0)
           : i == 2 ? vec3(0.15, 0.35, 0.0)
           : i == 3 ? vec3(0.0, 0.35, 0.15)
           : i == 4 ? vec3(0.0, 0.15, 0.35)
           : vec3(0.0, 0.0, 0.5);
    col += smp * w;
  }

  // a little vibrancy: glass lifts saturation and light a touch
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, 1.12);
  col = mix(col * 1.05 + 0.03, col * 1.04 + 0.006, 1.0 - u_dark);

  // frost scatters light: the dock's body is milky, the droplet stays clear;
  // the dock's rim fades toward milk too, so the lensed sliver reads as a
  // refracting edge and not as a second copy of what is behind
  vec3 milk = P_MILK;
  col = mix(col, milk, (1.0 - height) * 0.3 * dock);
  float body = smoothstep(0.15, 1.0, height) * (0.16 + 0.66 * u_frost) * mix(1.0, 0.08, wDrop);
  col = mix(col, milk, body);

  // tint, deeper where the glass is thicker
  float tintAmt = u_tint.a * (0.55 + 0.45 * height);
  col = mix(col, col * u_tint.rgb * 1.08 + u_tint.rgb * 0.05, tintAmt);

  // vibrancy plate: under each icon the ground calms toward a plate tone
  // (light under ink icons, dark under white ones), so they always read
  float fi = clamp(floor((p.x - u_icons.x) / u_icons.z + 0.5), 0.0, u_icons.w - 1.0);
  vec2 ic = p - vec2(u_icons.x + fi * u_icons.z, u_icons.y);
  float dI = length(ic * vec2(1.0, 1.12));
  // (inside the bar's own outline, so it holds over the droplet when it merges in)
  float inBar = smoothstep(1.0, -4.0, sdDock(p));
  float plate = (1.0 - smoothstep(u_plate.x * 0.25, u_plate.x, dI)) * inBar * smoothstep(0.1, 0.7, height);
  vec3 plateCol = mix(P_PLATE_INK, P_PLATE_WHITE, u_plate.z);
  plateCol = mix(plateCol, plateCol * u_tint.rgb * 1.04 + u_tint.rgb * 0.03, u_tint.a * 0.5);
  col = mix(col, plateCol, plate * u_plate.y);

  // the selected tab: a lifted capsule with a hairline of light along its
  // top and a soft shade along its bottom. Under ink icons it is brighter
  // than the body; under white icons it only lifts dark ground, so it never
  // takes contrast from the icon it holds
  float pLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 pillInk = col * 1.04 + 0.04;
  vec3 pillWhite = col + 0.07 * (1.0 - smoothstep(0.12, 0.42, pLuma));
  col = mix(col, mix(pillInk, pillWhite, u_plate.z), pillMask);
  float pIn = -dp;
  float pRim = smoothstep(px * 0.2, px * 1.2, pIn) * (1.0 - smoothstep(px * 1.2, px * 2.6 + 0.4, pIn)) * pillOn;
  float pUp = clamp(-pq.y / max(u_pill.w, 1.0), -1.0, 1.0);
  col += pRim * max(pUp, 0.0) * mix(0.16, 0.12, u_dark) * P_RIM;
  col *= 1.0 - pRim * max(-pUp, 0.0) * mix(0.1, 0.22, u_dark);

  // hover: light pools under the icon
  vec2 hq = p - u_hover.xy;
  col += exp(-dot(hq, hq) / (u_hover.z * u_hover.z)) * u_hover.w * mix(0.085, 0.07, u_dark) * P_RIM;

  // reflection of the room (Fresnel), brighter for faces turned up; the
  // droplet keeps more of what is behind it
  vec3 V = vec3(0.0, 0.0, 1.0);
  float fres = (0.04 + 0.96 * pow(1.0 - clamp(n.z, 0.0, 1.0), 5.0)) * mix(1.6, 1.0, wDrop);
  fres = min(fres, mix(1.0, 0.5, wDrop));
  vec3 R = reflect(-V, n);
  float up = clamp(0.5 - 0.5 * R.y, 0.0, 1.0);
  vec3 room = mix(P_ENV_LOW, P_ENV_HIGH, up);
  col = mix(col, room, fres * mix(1.0, 0.85, u_dark));

  // highlights, read off the reflected direction:
  // the window up on the left, a soft box with its bars across it
  vec2 wq = (R.xy - u_envWin.xy) / u_envWin.zw;
  float box = (1.0 - smoothstep(0.3, 1.0, abs(wq.x))) * (1.0 - smoothstep(0.3, 1.0, abs(wq.y)));
  col += P_ENV_WINDOW * box * box;
  // the lamp, low on the right
  vec2 lq = (R.xy - vec2(0.62, 0.42)) / vec2(0.34, 0.3);
  col += P_ENV_LAMP * exp(-dot(lq, lq)) * 0.6;
  // the fairy lights above: a warm sheen along faces turned up
  float rowUp = smoothstep(-0.5, -0.8, R.y) * (1.0 - smoothstep(-0.85, -0.98, R.y));
  col += P_HALO * rowUp * 0.5;

  // the pointer, a second small light while hovering: it glints on the
  // curved rims and only washes the flat faces
  if (u_pointer.z > 0.001) {
    vec3 Lp = normalize(vec3(u_pointer.xy - p, 150.0));
    float specP = pow(max(dot(n, normalize(Lp + V)), 0.0), 120.0) * u_pointer.z;
    col += specP * 0.5 * (1.0 - 0.85 * height) * P_RIM;
  }

  // bright rim: strong on the lit edge, a fainter echo on the far edge
  float rim = 1.0 - smoothstep(0.0, px * 1.5 + 0.75, depth);
  float facing = dot(g, normalize(vec2(-0.55, -0.84)));
  float rimLight = rim * (0.22 + 0.78 * max(facing, 0.0) + 0.5 * max(-facing, 0.0));
  col += rimLight * mix(0.55, 0.42, u_dark) * P_RIM;
  // the droplet focuses light into a soft crescent inside its far edge
  float crescent = wDrop * pow(1.0 - height, 1.6) * max(-facing, 0.0) * smoothstep(px, px * 4.0, depth);
  col += crescent * mix(0.2, 0.16, u_dark) * P_RIM;
  // a hairline just inside the rim, so the edge reads on light grounds
  float inner = smoothstep(px * 0.5, px * 1.5, depth) * (1.0 - smoothstep(px * 1.5, px * 3.5 + 1.0, depth));
  col = mix(col, col * mix(0.9, 0.82, u_dark), inner * 0.5 * (1.0 - max(facing, 0.0)));

  float cover = smoothstep(px * 0.5, -px * 0.5, d);
  if (cover < 1.0) col = mix(sceneHere(), col, cover);
  outColor = vec4(finish(col), 1.0);
}
`;
