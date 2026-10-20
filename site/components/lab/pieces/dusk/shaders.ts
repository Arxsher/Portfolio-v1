// GLSL for the dusk picture, in two passes.
//
// 1. SCENE: one fragment per dot (the dot grid, not the screen). It paints
//    the scene as a single tone, 0 (shadow) … 1 (the sun): a sky that
//    depends on the sun's height, its glow along the horizon, thin cloud
//    streaks lit from below, stars after dark, the sun's disc (squashed a
//    little near the sea), gulls, and a low shore with houses and a
//    minaret whose windows light up one by one as the sun goes down. The
//    sea is a perspective plane with layered waves; each dot reflects the
//    sky (or the shore) through its wave normal, Fresnel-weighted, and the
//    sun's glitter path comes from a slope distribution around the waves,
//    with a discrete twinkle per dot.
// 2. DITHER: one fragment per device pixel. It finds the dot it belongs to,
//    reads its tone and picks a palette colour with an 8×8 Bayer threshold,
//    so a gradient becomes the familiar crosshatch of an ordered dither.
//    Dots are whole device pixels, so the result is crisp at any DPR.
//    Each palette has its own tone curve (one ink on paper needs a darker
//    one than four inks). Palette and dot-size changes come in dot by dot
//    in Bayer order, from the top down.

import { FOCAL, HORIZON, STILL_TIME } from "./look";

const f = (n: number) => n.toFixed(4);

export const SCENE = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uCells;     // dots across, dots down
uniform float uAspect;   // picture width / height
uniform float uTime;     // scene clock (stops while motion is off)
uniform vec2 uSun;       // x across the picture (0..1), elevation (degrees)
uniform float uTile;     // 1 on the small tile: fewer details
uniform float uZoom;     // > 1 looks closer (tiles)

out vec4 outColor;

const float HORIZON = ${f(HORIZON)};
const float FOCAL = ${f(FOCAL)};
const float CAM_H = 2.4;   // camera height above the water (m)
const float STILL = ${f(STILL_TIME)}; // the reduced-motion still's clock

float gElev, gDay, gGlow, gVis, gSunUp, gLights, gPx, gTime, gHigh, gSil;
float gX0, gMx;
vec2 gSunP;
vec3 gSunDir;

/* ---------------------------------------------------------------- noise */

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.07 + vec2(17.1, 3.7);
    a *= 0.5;
  }
  return s;
}

float sdBox(vec2 p, vec2 c, vec2 h) {
  vec2 d = abs(p - c) - h;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

/* ------------------------------------------------------------------ sky */

/** Compress highlights so nothing in the sky reaches the sun's own tone. */
float knee(float t) {
  const float K = 0.68;
  const float R = 0.17;
  return t < K ? t : K + R * (1.0 - exp(-(t - K) / R));
}

/** The clear sky (gradient + the sun's glow), no clouds, no disc. */
float skyBase(vec2 P) {
  float h = clamp((P.y - HORIZON) / (1.0 - HORIZON), 0.0, 1.0);
  float top = mix(0.025, 0.56, pow(gDay, 1.45));
  float hor = mix(0.1, 0.86, pow(gDay, 0.72));
  float t = mix(hor, top, pow(h, 0.55));
  vec2 d = P - gSunP;
  float dist = length(d * vec2(1.0, 1.3));
  // a wide glow, a tight core and a band along the horizon under the sun
  t += exp(-dist * 2.6) * (0.12 + 0.24 * gGlow) * gVis;
  t += exp(-dist * dist * 160.0) * 0.22 * smoothstep(-3.0, 1.0, gElev);
  t += exp(-h * 7.5) * exp(-abs(d.x) * 1.15) * 0.36 * gGlow * gVis;
  // the afterglow: a warm low band that lingers once the sun has gone
  t += exp(-h * 4.5) * 0.11 * smoothstep(-11.0, -1.0, gElev) * (1.0 - smoothstep(-1.0, 4.0, gElev));
  return knee(t);
}

/** Thin streaks of altostratus, lit from below near the sun at dusk. */
float withClouds(vec2 P, float base) {
  float h = (P.y - HORIZON) / (1.0 - HORIZON);
  float shape = smoothstep(0.08, 0.18, h) * smoothstep(0.6, 0.34, h);
  if (shape <= 0.0) return base;
  vec2 q = vec2(P.x * 1.8 + gTime * 0.0045, P.y * 14.0);
  // a gentle warp so no streak runs dead straight across the sky
  q.y += 1.6 * (vnoise(vec2(P.x * 2.6 + 3.0, P.y * 3.0)) - 0.5) + 0.5 * sin(P.x * 1.7 + 0.8);
  float n = fbm(q + vec2(0.0, 4.2));
  // the same field a little lower: where it is thinner, this is a lower edge
  float below = fbm(q + vec2(0.0, 4.2 - 0.6));
  float cover = smoothstep(0.5 - 0.03 * uTile, 0.62, n * (0.66 + 0.34 * shape)) * shape;
  if (cover <= 0.0) return base;
  float near = exp(-length((P - gSunP) * vec2(0.5, 1.6)) * 2.0);
  float under = clamp((n - below) * 7.0 + 0.35, 0.0, 1.0);
  // at dusk: a dark body, its underside catching the sun near the sun
  float body = base * 0.62;
  float lit = clamp(near * (0.35 + 0.65 * under) * gGlow * gVis * 2.0, 0.0, 1.0);
  float dusk = mix(body, 0.84, lit);
  // by day: a little brighter than the sky
  float day = min(0.84, base + 0.1);
  float tone = mix(dusk, day, smoothstep(7.0, 16.0, gElev));
  // after dark: just a shade darker than the sky
  tone = mix(base * 0.75, tone, smoothstep(-9.0, -2.5, gElev));
  return mix(base, tone, cover);
}

float stars(vec2 P) {
  float vis = smoothstep(-2.5, -9.0, gElev);
  if (vis <= 0.0) return 0.0;
  float h = (P.y - HORIZON) / (1.0 - HORIZON);
  vis *= smoothstep(0.14, 0.5, h);
  const float GRID = 21.0;
  vec2 id = floor(P * GRID);
  float r = hash12(id + 7.7);
  if (r < 0.8) return 0.0;
  vec2 sp = (id + 0.2 + 0.6 * hash22(id + 3.1)) / GRID;
  vec2 q = abs(P - sp) / gPx;
  if (max(q.x, q.y) > 0.5) return 0.0;
  float twinkle = 0.7 + 0.3 * sin(gTime * (1.3 + 3.0 * r) + r * 40.0);
  return vis * twinkle;
}

/** Coverage of the sun's disc (it squashes a little as it meets the sea). */
float sunDisc(vec2 P) {
  float R = 0.052;
  float squash = mix(0.84, 1.0, smoothstep(-0.5, 5.0, gElev));
  vec2 q = (P - gSunP) / vec2(1.0, squash);
  float d = length(q) - R;
  return 1.0 - smoothstep(-gPx * 0.6, gPx * 0.6, d);
}

/* ---------------------------------------------------------------- gulls */

/** Signed distance to a gull seen head-on: an M of wings and a small body. */
float gull(vec2 P, vec2 c, float s, float up1, float up2) {
  vec2 q = (P - c) / s;
  q.x = abs(q.x);
  float px = gPx / s;   // one dot, in gull units
  vec2 wrist = vec2(0.4, 0.05 + 0.34 * up1);
  vec2 tip = vec2(1.0, wrist.y - 0.12 + 0.36 * up2);
  float t1 = max(mix(0.15, 0.1, clamp(q.x / 0.4, 0.0, 1.0)), px * 0.55);
  float t2 = max(mix(0.1, 0.035, clamp((q.x - 0.4) / 0.6, 0.0, 1.0)), px * 0.42);
  float d1 = sdSeg(q, vec2(0.0, -0.02), wrist) - t1;
  float d2 = sdSeg(q, wrist, tip) - t2;
  float body = length((q - vec2(0.0, -0.06)) * vec2(1.0, 1.45)) - max(0.15, px * 0.6);
  return min(min(d1, d2), body) * s;
}

float gulls(vec2 P) {
  float vis = smoothstep(-7.0, -3.0, gElev);
  if (vis <= 0.0) return 0.0;
  float A = uAspect;
  float span = A + 0.3;
  float cov = 0.0;
  bool tile = uTile > 0.5;
  // across (share of the width at the still frame), height, size, speed
  vec4 birds[3] = vec4[3](
    vec4(0.17, 0.79, tile ? 0.062 : 0.05, 0.012),
    vec4(0.5, 0.7, tile ? 0.046 : 0.036, -0.0085),
    vec4(0.6, 0.86, 0.028, 0.015)
  );
  int count = tile ? 2 : 3;
  for (int i = 0; i < 3; i++) {
    if (i >= count) break;
    vec4 b = birds[i];
    float k = float(i);
    float x = mod(b.x * A + b.w * (gTime - STILL) + 0.15, span) - 0.15;
    float y = b.y + 0.01 * sin(gTime * 0.45 + k * 2.1);
    // flapping in bouts, gliding between
    float glide = smoothstep(0.36, 0.6, vnoise(vec2(gTime * 0.22 + k * 11.0, k)));
    float ph = gTime * (5.4 + k * 0.8) + k * 1.7;
    float up1 = mix(sin(ph), 0.3, glide);
    float up2 = mix(sin(ph - 0.9), 0.16, glide);
    float d = gull(P, vec2(x, y), b.z, up1, up2);
    cov = max(cov, 1.0 - smoothstep(-gPx * 0.5, gPx * 0.5, d));
  }
  return cov * vis;
}

/* ---------------------------------------------------------------- shore */

/** The top of the low shore at x (it rises out of the sea at gX0). */
float groundTop(float x) {
  float rise = smoothstep(gX0, gX0 + 0.09, x);
  return HORIZON - 0.003 + rise * (0.019 + 0.0024 * sin(x * 31.0) + 0.0016 * sin(x * 77.0 + 1.0));
}

/**
 * The shore, houses, mosque and minaret: x = coverage, y = 1 on a lit
 * window. lightR is a lit window's half size (one dot is 0.5 × gPx).
 */
vec2 shore(vec2 P, float aa, float lightR) {
  if (P.x < gX0 - 0.02) return vec2(0.0);
  float d = P.y - groundTop(P.x);
  float lit = 0.0;

  // houses: low cubes along the shore, shoulder to shoulder
  float bw = 0.028;
  float start = gX0 + 0.04;
  float fi = floor((P.x - start) / bw);
  for (int k = -1; k <= 1; k++) {
    float i = fi + float(k);
    if (i < 0.0) continue;
    float cx = start + (i + 0.5) * bw;
    if (abs(cx - (gMx - 0.05)) < 0.105) continue; // the mosque's plot
    float r1 = hash11(i * 7.31 + 1.7);
    float r2 = hash11(i * 3.17 + 5.3);
    if (r1 < 0.08) continue;
    float hw = bw * (0.42 + 0.2 * r2);
    float hh = 0.007 + 0.016 * r1 * r1 + 0.006 * smoothstep(0.7, 0.95, r2);
    float base = groundTop(cx) - 0.002;
    vec2 c = vec2(cx + (r2 - 0.5) * bw * 0.2, base + hh * 0.5);
    d = min(d, sdBox(P, c, vec2(hw, hh * 0.5)));
    // a stair tower on some roofs
    if (r2 > 0.72) d = min(d, sdBox(P, c + vec2(hw * 0.45, hh * 0.5 + 0.003), vec2(hw * 0.22, 0.003)));
    for (int j = 0; j < 2; j++) {
      float fj = float(j);
      float rj = hash11(i * 11.1 + fj * 4.7 + 0.3);
      if (rj > gLights * 1.15 - 0.06) continue;
      vec2 wp = c + vec2((hash11(i * 5.9 + fj * 2.2) - 0.5) * hw * 1.3, (hash11(i * 2.3 + fj * 9.1) - 0.5) * hh * 0.5);
      vec2 q = abs(P - wp);
      if (max(q.x, q.y) < lightR) lit = 1.0;
    }
  }

  // the mosque: a low hall under two pyramid roofs, beside its minaret
  float W = 0.05;
  float base = groundTop(gMx) - 0.002;
  float hallTop = base + 0.024;
  d = min(d, sdBox(P, vec2(gMx - 0.085, base + 0.012), vec2(0.07, 0.012)));
  for (int k = 0; k < 2; k++) {
    float rc = gMx - 0.05 - float(k) * 0.07;
    float hw = 0.034;
    float rh = 0.011;
    float roof = (P.y - (hallTop + rh * (1.0 - abs(P.x - rc) / hw))) * 0.95;
    roof = max(roof, abs(P.x - rc) - hw);
    roof = max(roof, hallTop - 0.001 - P.y);
    d = min(d, roof);
  }

  // the minaret: a square tower, a crenellated top, the lantern, its dome
  // and a finial of three spheres
  float H = 0.3;
  d = min(d, sdBox(P, vec2(gMx, base + H * 0.5), vec2(W * 0.5, H * 0.5)));
  d = min(d, sdBox(P, vec2(gMx, base + H - 0.006), vec2(W * 0.5 + 0.0032, 0.0045)));
  for (int k = -1; k <= 1; k++) {
    float cx = gMx + float(k) * W * 0.4;
    d = min(d, sdBox(P, vec2(cx, base + H + 0.0065), vec2(W * 0.1, 0.0065)));
    d = min(d, sdBox(P, vec2(cx, base + H + 0.0155), vec2(W * 0.05, 0.004)));
  }
  float lb = base + H;
  float LW = W * 0.42;
  float LH = 0.07;
  d = min(d, sdBox(P, vec2(gMx, lb + LH * 0.5), vec2(LW * 0.5, LH * 0.5)));
  d = min(d, sdBox(P, vec2(gMx, lb + LH - 0.003), vec2(LW * 0.5 + 0.0028, 0.003)));
  float dr = LW * 0.4;
  vec2 dc = vec2(gMx, lb + LH);
  d = min(d, max(length(P - dc) - dr, dc.y - P.y));
  float ft = lb + LH + dr;
  d = min(d, sdBox(P, vec2(gMx, ft + 0.022), vec2(0.0017, 0.022)));
  d = min(d, length(P - vec2(gMx, ft + 0.01)) - 0.006);
  d = min(d, length(P - vec2(gMx, ft + 0.023)) - 0.0048);
  d = min(d, length(P - vec2(gMx, ft + 0.034)) - 0.0036);

  float cov = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);

  // the minaret's windows: small arches up the shaft and two in the
  // lantern, lit in turn as dusk deepens
  if (abs(P.x - gMx) < W * 0.5 && P.y > base && P.y < lb + LH) {
    float wd = 1e3;
    for (int k = 0; k < 4; k++) {
      float fk = float(k);
      if (hash11(fk * 3.3 + 0.7) > gLights * 1.25) continue;
      float wy = base + H * (0.2 + 0.24 * fk);
      float wx = gMx + (mod(fk, 2.0) < 0.5 ? -1.0 : 1.0) * W * 0.16;
      float aw = W * 0.09;
      float ah = 0.011;
      float a = min(sdBox(P, vec2(wx, wy), vec2(aw, ah)), length(P - vec2(wx, wy + ah)) - aw);
      wd = min(wd, a);
    }
    if (gLights > 0.08) {
      for (int k = -1; k <= 1; k += 2) {
        float wx = gMx + float(k) * LW * 0.2;
        float a = min(sdBox(P, vec2(wx, lb + LH * 0.48), vec2(LW * 0.11, 0.011)), length(P - vec2(wx, lb + LH * 0.48 + 0.011)) - LW * 0.11);
        wd = min(wd, a);
      }
    }
    float wcov = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, wd);
    lit = max(lit, wcov * 0.9);
  }
  return vec2(cov, lit * cov);
}

/* ------------------------------------------------------------------ sea */

/**
 * The slope of the sea at w (metres, x across, z away), as d(height)/d(x, z).
 * "dropped" gets the slope variance (per axis) of the waves left out at this
 * distance: they are too small to draw, but they still tilt the facets.
 */
vec2 waveGrad(vec2 w, float time, float foot, out vec2 dropped) {
  vec2 g = vec2(0.0);
  dropped = vec2(0.0);
  // wavelength (m), steepness, direction of travel (toward the shore)
  vec4 waves[7] = vec4[7](
    vec4(15.0, 0.085, 0.16, -1.0),
    vec4(9.0, 0.075, -0.32, -1.0),
    vec4(5.4, 0.065, 0.52, -1.0),
    vec4(3.2, 0.06, -0.7, -1.0),
    vec4(1.8, 0.05, 0.9, -0.6),
    vec4(0.95, 0.045, -0.25, -1.0),
    vec4(0.52, 0.04, 0.62, -0.8)
  );
  for (int i = 0; i < 7; i++) {
    vec4 wv = waves[i];
    float L = wv.x;
    // drop the waves too small to show at this distance (they would only shimmer)
    float lod = 1.0 - smoothstep(0.6, 1.6, foot * 2.2 / L);
    vec2 dir = normalize(wv.zw);
    // a sine of slope amplitude a has variance a^2 / 2 along its direction
    float miss = wv.y * (1.0 - lod);
    dropped += dir * dir * (0.5 * miss * miss);
    if (lod <= 0.0) continue;
    float k = 6.2831853 / L;
    float om = sqrt(9.81 * k) * 0.62;
    float ph = k * dot(dir, w) - om * time + float(i) * 1.93;
    g += dir * (wv.y * cos(ph) * lod);
  }
  return g;
}

float landTone() {
  return 0.012 + 0.11 * smoothstep(9.0, 26.0, gElev);
}

float sea(vec2 P, vec2 cell) {
  float A = uAspect;
  float v = max(HORIZON - P.y, 1e-4);
  vec3 ray = normalize(vec3(P.x - 0.5 * A, -v, FOCAL));
  float t = CAM_H / max(-ray.y, 1e-4);
  vec2 w = vec2(ray.x, ray.z) * t;
  float foot = CAM_H * FOCAL / (v * v) * gPx;
  vec2 dropped;
  vec2 g = waveGrad(w, gTime, foot, dropped);
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));

  // what the water mirrors: the sky, or the shore and its lights
  vec3 nr = normalize(vec3(-g.x * 0.55, 1.0, -g.y * 0.55));
  vec3 r = reflect(ray, nr);
  r.y = max(r.y, 0.0015);
  r.z = max(r.z, 0.05);
  vec2 Pr = vec2(0.5 * A + r.x / r.z * FOCAL, HORIZON + r.y / r.z * FOCAL);
  float refl = withClouds(Pr, skyBase(Pr));
  vec2 L = shore(Pr, gPx * 1.6, gPx * 1.7);
  float mirror = 1.0 - smoothstep(0.03, 0.17, v);
  refl = mix(refl, landTone(), L.x * mirror);
  refl = max(refl, L.y * 0.95 * mirror);

  float cosT = clamp(dot(-ray, n), 0.0, 1.0);
  float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
  float body = 0.02 + 0.15 * gDay + 0.05 * gGlow;
  float tone = mix(body, refl, F);

  // the sun's glitter: how likely a wavelet here is tilted to throw the
  // sun at the camera, around the slope of the waves underneath
  if (gSunUp > 0.0) {
    vec3 hv = normalize(-ray + gSunDir);
    vec2 need = hv.xz / max(hv.y, 1e-3);
    vec2 dev = need + g;
    float base = 0.07 + 0.03 * smoothstep(12.0, 25.0, gElev);
    // the waves left out at this distance still tilt the facets: their slope
    // variance widens the spread (as in LEAN / Toksvig mapping), so the path
    // stays whole into the distance instead of breaking into clumps. It is
    // mostly variance along z, which lengthens the path, not widens it.
    vec2 s2 = vec2(base * base) + dropped * 0.85;
    float p = exp(-0.5 * (dev.x * dev.x / s2.x + dev.y * dev.y / s2.y));
    // the same light spread over more slopes is dimmer per facet
    float spread = base * base * inversesqrt(s2.x * s2.y);
    float frame = floor(gTime * 7.0);
    float tw = hash12(cell * 1.37 + vec2(frame * 13.1, frame * 7.7));
    // far off, fewer and finer sparkles: a shimmer rather than a glare
    float sparkle = step(tw, p * 1.25 * mix(1.0, spread, 0.75)) * smoothstep(0.015, 0.12, p);
    float glit = 0.5 * p * mix(1.0, spread, 0.4) + 0.8 * sparkle;
    tone += glit * gSunUp * (0.75 + 0.25 * gGlow);
  }

  // foam where the swell meets the shore
  if (P.x > gX0 + 0.012 && v < 0.0075) {
    float surge = vnoise(vec2(P.x * 95.0 + gTime * 0.45, gTime * 0.32));
    float foam = smoothstep(0.55, 0.72, surge) * (1.0 - smoothstep(0.003, 0.0075, v));
    tone = mix(tone, 0.35 + 0.5 * gDay, foam * 0.85);
  }
  return tone;
}

/* ----------------------------------------------------------------- main */

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 uv = (cell + 0.5) / uCells;
  float A = uAspect;
  vec2 P = vec2(uv.x * A, uv.y);
  // tiles look closer: zoom about the middle of the horizon
  vec2 pivot = vec2(0.5 * A, HORIZON);
  P = pivot + (P - pivot) / uZoom;

  gPx = 1.0 / (uCells.y * uZoom);
  gTime = uTime;
  gElev = uSun.y;
  gSunP = vec2(uSun.x * A, HORIZON + tan(radians(gElev)) * FOCAL);
  gSunDir = normalize(vec3(gSunP.x - 0.5 * A, gSunP.y - HORIZON, FOCAL));
  gDay = smoothstep(-9.0, 15.0, gElev);
  gGlow = exp(-pow((gElev - 1.0) / 8.0, 2.0));
  gVis = smoothstep(-12.0, -0.5, gElev);
  gSunUp = smoothstep(-1.2, 0.8, gElev);
  // the first windows come on while the sun is still touching the sea
  gLights = smoothstep(2.5, -7.5, gElev);
  gX0 = 0.6 * A;
  gMx = 0.775 * A;

  float tone;
  if (P.y >= HORIZON) {
    tone = withClouds(P, skyBase(P));
    tone = max(tone, stars(P));
    float disc = sunDisc(P);
    if (disc > 0.0) {
      // the low sun is a touch dimmer at its foot, seen through more air,
      // but always clearly brighter than the glow around it (a half-sunk
      // disc must still read as the sun)
      float foot = smoothstep(0.0, 0.06, P.y - HORIZON);
      float sunTone = mix(0.93, 1.0, max(foot, smoothstep(2.0, 8.0, gElev)));
      tone = mix(tone, max(tone, sunTone), disc);
    }
    float g = gulls(P);
    tone = mix(tone, landTone() + 0.02, g);
    vec2 L = shore(P, gPx, gPx * 0.5);
    tone = mix(tone, landTone(), L.x);
    tone = max(tone, L.y);
  } else {
    tone = sea(P, cell);
  }
  outColor = vec4(clamp(tone, 0.0, 1.0), 0.0, 0.0, 1.0);
}
`;

export const DITHER = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D uScene;
uniform sampler2D uPrev;
uniform vec2 uRes;          // canvas size (device px)
uniform float uCellPx;      // device px per dot (now)
uniform float uPrevCellPx;  // and before a dot-size change
uniform vec2 uOffset;       // grid origin (device px), centring partial dots
uniform vec2 uPrevOffset;
uniform float uDotMix;      // 0 → 1: old dots giving way to new ones
uniform vec3 uPal[4];
uniform int uCount;
uniform vec4 uLevels;       // the palette's tone curve: black, white, gamma, S-shape
uniform vec3 uPrevPal[4];
uniform int uPrevCount;
uniform vec4 uPrevLevels;
uniform float uPalMix;      // 0 → 1: old palette giving way to the new
uniform float uDim;         // the room light (dimmer in the dark theme)

out vec4 outColor;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
float bayer8(vec2 a) {
  a = mod(a, 8.0);
  float b4 = bayer2(0.5 * (0.5 * a)) * 0.25 + bayer2(0.5 * a);
  return b4 * 0.25 + bayer2(a) + 0.5 / 64.0;
}

/**
 * Each palette's own curve before the dither. Four or three inks step
 * between neighbours and keep the scene's tones as they are; one ink on
 * paper needs the sky pushed toward the ink, so mid tones become a gradient
 * of sparse to dense dots instead of an even 50% checkerboard, and paper
 * is left for the sun, the glitter, the lit clouds and the horizon.
 */
float curve(float tone, vec4 L) {
  float x = clamp((tone - L.x) / (L.y - L.x), 0.0, 1.0);
  x = mix(x, x * x * (3.0 - 2.0 * x), L.w);
  return pow(x, L.z);
}

vec3 pick(float tone, float threshold, bool previous) {
  int n = previous ? uPrevCount : uCount;
  float v = curve(tone, previous ? uPrevLevels : uLevels) * float(n - 1);
  float base = floor(v);
  int idx = int(base) + (v - base > threshold ? 1 : 0);
  idx = clamp(idx, 0, n - 1);
  return previous ? uPrevPal[idx] : uPal[idx];
}

/**
 * The order dots change in during a palette or dot-size change: the same
 * Bayer matrix, shifted off the dither's own so the two don't line up, with
 * a lean from the top down, like a print being pulled. 0 changes first.
 */
float order(vec2 cell) {
  float down = 1.0 - gl_FragCoord.y / uRes.y;
  return bayer8(cell + vec2(3.0, 5.0)) * 0.76 + down * 0.24;
}

vec3 shade(sampler2D scene, float cellPx, vec2 offset) {
  vec2 cell = floor((gl_FragCoord.xy - offset) / cellPx);
  ivec2 size = textureSize(scene, 0);
  ivec2 ic = clamp(ivec2(cell), ivec2(0), size - 1);
  float tone = texelFetch(scene, ic, 0).r;
  float th = bayer8(cell);
  bool old = uPalMix < 1.0 && order(cell) >= uPalMix;
  return pick(tone, th, old);
}

void main() {
  vec3 color = shade(uScene, uCellPx, uOffset);
  if (uDotMix < 1.0) {
    vec2 cell = floor((gl_FragCoord.xy - uOffset) / uCellPx);
    if (order(cell) >= uDotMix) color = shade(uPrev, uPrevCellPx, uPrevOffset);
  }
  outColor = vec4(color * uDim, 1.0);
}
`;
