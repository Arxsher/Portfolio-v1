// GLSL for the picture, in two passes.
//
// 1. SCENE: one fragment per dot (the dot grid, not the screen). It paints
//    the scene as a single tone, 0 (shadow) … 1 (the sun): a sky that
//    depends on the sun's height, its glow along the horizon, thin cloud
//    streaks lit from below, and after dark the stars, a shooting star now
//    and then, and the moon (a lit sphere whose bright side faces wherever
//    the sun is, already in the sky by day as a pale disc). On the right a
//    headland with rocks off its point, a keeper's cottage, a shed and
//    a tapered lighthouse: gallery, lantern, dome and vent, its white paint
//    shaded as a cylinder so the sun-side edge catches the low light. At
//    dusk the cottage windows come on one by one and the lamp turns its two
//    beams, drawn as cones of lit air in perspective (each converges toward
//    the horizon as it swings away and widens and flares as it turns toward
//    you). A small sailboat drifts on the horizon with a masthead light.
//    The sea is a perspective plane with layered waves; each dot reflects
//    the sky, the headland and its lights through its wave normal,
//    Fresnel-weighted, and three glitter paths (sun, moon, lamp) come from
//    a slope distribution around the waves, with a discrete twinkle per dot.
// 2. DITHER: one fragment per device pixel. It finds the dot it belongs to,
//    reads its tone and picks a palette colour with an 8×8 Bayer threshold,
//    so a gradient becomes the familiar crosshatch of an ordered dither.
//    Dots are whole device pixels, so the result is crisp at any DPR.
//    Each palette has its own tone curve (one ink on paper needs a darker
//    one than four inks). Palette and dot-size changes come in dot by dot
//    in Bayer order, from the top down.

import { FOCAL, HEADLAND_X, HORIZON, LIGHT_X, MOON_X, STILL_TIME } from "./look";

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
uniform float uLamp;     // the lighthouse lamp, 0 (out) … 1 (the JS side runs its strike)
uniform float uBeam;     // the lamp's turn (radians)

out vec4 outColor;

const float HORIZON = ${f(HORIZON)};
const float FOCAL = ${f(FOCAL)};
const float CAM_H = 2.4;   // camera height above the water (m)
const float STILL = ${f(STILL_TIME)}; // the reduced-motion still's clock
const float PI = 3.14159265;

// the lighthouse: tower height, half widths at the foot and the top
const float TH = 0.182;
const float TBW = 0.0235;
const float TTW = 0.0152;
// the lantern: its height and half width, and where it sits over the gallery
const float LH = 0.034;
const float LW = 0.0118;
const float LDY = 0.0085;
// the moon's radius and the angle between it and the sun as seen from here
// (72°: a fat crescent, its bright side toward the sun)
const float MOON_R = 0.043;
const float MOON_ELONG = 1.26;

float gElev, gDay, gGlow, gVis, gSunUp, gLights, gPx, gTime, gNight, gDark, gFlash;
float gX0, gLx, gGround, gCotX, gCotG, gShedX, gShedG, gStackX;
vec2 gSunP, gMoonP, gMoonL, gLamp;
vec3 gSunDir, gMoonDir, gLampDir;

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
/** Signed distance to the triangle a, b, c. */
float sdTri(vec2 p, vec2 a, vec2 b, vec2 c) {
  vec2 e0 = b - a, e1 = c - b, e2 = a - c;
  vec2 v0 = p - a, v1 = p - b, v2 = p - c;
  vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                   vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                   vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
float cover(float d, float aa) {
  return 1.0 - smoothstep(-aa * 0.5, aa * 0.5, d);
}

/** The height up the picture of something at this elevation (degrees). */
float heightAt(float e) {
  return HORIZON + tan(radians(e)) * FOCAL;
}

/* ------------------------------------------------------------------ sky */

/** Compress highlights so nothing in the sky reaches the sun's own tone. */
float knee(float t) {
  const float K = 0.68;
  const float R = 0.17;
  return t < K ? t : K + R * (1.0 - exp(-(t - K) / R));
}

/** The clear sky (gradient, the sun's glow, the moon's halo), no clouds, no discs. */
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
  // the moon's halo, once the sky is dark enough to show it
  float m = length(P - gMoonP);
  t += (exp(-m * 7.5) * 0.09 + exp(-m * m * 240.0) * 0.12) * gNight;
  return knee(t);
}

/** Thin streaks of altostratus, lit from below near the sun at dusk and silvered near the moon at night. */
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
  // after dark: a shade darker than the sky, silver at the edges near the moon
  float nearMoon = exp(-length((P - gMoonP) * vec2(0.55, 1.5)) * 2.6);
  float night = mix(base * 0.75, 0.42, clamp(nearMoon * (0.25 + 0.75 * under) * 1.3, 0.0, 1.0) * gNight);
  tone = mix(night, tone, smoothstep(-9.0, -2.5, gElev));
  return mix(base, tone, cover);
}

float starLayer(vec2 P, float grid, float keep, float seed, float level) {
  vec2 id = floor(P * grid);
  float r = hash12(id + seed);
  if (r < keep) return 0.0;
  vec2 sp = (id + 0.2 + 0.6 * hash22(id + seed + 3.1)) / grid;
  vec2 q = abs(P - sp) / gPx;
  if (max(q.x, q.y) > 0.5) return 0.0;
  float twinkle = 0.7 + 0.3 * sin(gTime * (1.3 + 3.0 * r) + r * 40.0);
  return level * twinkle;
}

float stars(vec2 P) {
  float vis = smoothstep(-2.5, -9.0, gElev);
  if (vis <= 0.0) return 0.0;
  float h = (P.y - HORIZON) / (1.0 - HORIZON);
  vis *= smoothstep(0.14, 0.5, h);
  // the moon washes out the stars around it
  vis *= smoothstep(MOON_R * 1.3, MOON_R * 3.6, length(P - gMoonP));
  if (vis <= 0.0) return 0.0;
  float s = starLayer(P, 21.0, 0.8, 7.7, 1.0);
  // fainter ones fill in later, as the night deepens
  if (uTile < 0.5) s = max(s, starLayer(P, 37.0, 0.86, 1.9, 0.62) * smoothstep(-6.0, -11.0, gElev));
  return vis * s;
}

/** A shooting star now and then, once it is properly dark (stage only). */
float meteor(vec2 P) {
  if (uTile > 0.5 || gNight <= 0.05) return 0.0;
  const float PERIOD = 6.5;
  const float LIFE = 0.85;
  float k = floor(gTime / PERIOD);
  float ph = gTime - k * PERIOD;
  if (ph > LIFE || hash11(k * 1.37 + 0.21) > 0.6) return 0.0;
  float A = uAspect;
  vec2 start = vec2((0.12 + 0.62 * hash11(k * 2.11 + 3.0)) * A, 0.74 + 0.2 * hash11(k * 5.3 + 1.0));
  float side = hash11(k * 7.7 + 0.5) < 0.5 ? -1.0 : 1.0;
  vec2 dir = normalize(vec2(side * (0.75 + 0.5 * hash11(k * 3.3 + 2.0)), -0.42));
  vec2 head = start + dir * ph * 0.62;
  const float TAIL = 0.1;
  vec2 pa = P - (head - dir * TAIL);
  float h = clamp(dot(pa, dir) / TAIL, 0.0, 1.0);
  float d = length(pa - dir * TAIL * h);
  float core = 1.0 - smoothstep(gPx * 0.35, gPx * 0.9, d);
  float fade = sin(PI * clamp(ph / LIFE, 0.0, 1.0));
  return core * h * h * fade * gNight * 0.9;
}

/** Coverage of the sun's disc (it squashes a little as it meets the sea). */
float sunDisc(vec2 P) {
  float R = 0.052;
  float squash = mix(0.84, 1.0, smoothstep(-0.5, 5.0, gElev));
  vec2 q = (P - gSunP) / vec2(1.0, squash);
  float d = length(q) - R;
  return 1.0 - smoothstep(-gPx * 0.6, gPx * 0.6, d);
}

/**
 * The moon over the sky tone underneath: a sphere lit from the sun's side
 * (its bright limb turns as the sun moves), a few darker seas, earthshine on
 * the night side. By day it is a pale disc, a little brighter than the sky.
 */
float withMoon(vec2 P, float sky) {
  vec2 q = (P - gMoonP) / MOON_R;
  float r = length(q);
  float aa = gPx / MOON_R;
  float edge = 1.0 - smoothstep(1.0 - aa * 0.6, 1.0 + aa * 0.6, r);
  float show = smoothstep(7.0, -1.0, gElev);
  if (edge <= 0.0 || show <= 0.0) return sky;
  vec3 n = vec3(q, sqrt(max(0.0, 1.0 - r * r)));
  vec3 toSun = vec3(gMoonL * sin(MOON_ELONG), -cos(MOON_ELONG));
  float lit = smoothstep(-0.05, 0.14, dot(n, toSun));
  float seas = smoothstep(0.52, 0.72, vnoise(q * 2.2 + vec2(4.1, 1.3))) * 0.2
             + smoothstep(0.6, 0.8, vnoise(q * 4.6 + vec2(9.0, 2.0))) * 0.1;
  // the limb is a touch darker than the middle
  float face = (0.92 - seas) * (0.86 + 0.14 * n.z);
  float night = mix(0.06, face, lit);
  float day = sky + lit * (0.1 - seas * 0.2);
  return mix(sky, mix(day, max(sky, night), gNight), edge * show);
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

/* ----------------------------------------------------------------- boat */

float boatX() {
  float A = uAspect;
  return mod(0.44 * A - 0.0014 * (gTime - STILL) + 0.06, A + 0.12) - 0.06;
}

/**
 * A small sailboat on the horizon (stage only): x = coverage, y = its
 * masthead light, lit at dusk. lightR is the light's half size.
 */
vec2 boat(vec2 P, float aa, float lightR) {
  if (uTile > 0.5) return vec2(0.0);
  float bx = boatX();
  if (abs(P.x - bx) > 0.04 || P.y > HORIZON + 0.06 || P.y < HORIZON - 0.005) return vec2(0.0);
  const float K = 1.35;   // its size
  float b = HORIZON + 0.0004;
  // the hull: a low wedge, longer at the deck than at the waterline
  float hull = sdTri(P, vec2(bx - 0.0125 * K, b + 0.0042 * K), vec2(bx + 0.0125 * K, b + 0.0042 * K), vec2(bx - 0.006 * K, b - 0.002 * K));
  hull = min(hull, sdBox(P, vec2(bx + 0.001 * K, b + 0.0018 * K), vec2(0.0085 * K, 0.0024 * K)));
  float mx = bx + 0.0015 * K;
  float d = min(hull, sdBox(P, vec2(mx, b + 0.022 * K), vec2(0.0008, 0.018 * K)));
  // the mainsail aft of the mast, the jib before it
  d = min(d, sdTri(P, vec2(mx - 0.0006, b + 0.039 * K), vec2(mx - 0.0006, b + 0.0062 * K), vec2(mx - 0.0125 * K, b + 0.0062 * K)));
  d = min(d, sdTri(P, vec2(mx + 0.0012, b + 0.034 * K), vec2(mx + 0.0012, b + 0.0062 * K), vec2(mx + 0.0105 * K, b + 0.0062 * K)));
  float cov = cover(d, aa);
  vec2 q = abs(P - vec2(mx, b + 0.041 * K));
  float light = max(q.x, q.y) < lightR ? smoothstep(0.25, 0.6, gLights) : 0.0;
  return vec2(cov, light);
}

/* ------------------------------------------------------------- headland */

/** The top of the headland at x: a steep face from the point, a rounded brow, the plateau climbing inland. */
float groundTop(float x) {
  float t = (x - gX0) / max(uAspect - gX0, 1e-3);
  float rise = smoothstep(0.0, 0.2, t);
  float face = rise * (1.0 - rise) * 4.0;
  float h = 0.062 * rise + 0.014 * smoothstep(0.15, 1.0, t);
  h += rise * (0.0021 * sin(x * 47.0) + 0.0013 * sin(x * 121.0 + 1.3));
  h += face * 0.006 * (vnoise(vec2(x * 90.0, 0.5)) - 0.5);
  return HORIZON - 0.003 + h;
}

float landTone() {
  return 0.012 + 0.11 * smoothstep(9.0, 26.0, gElev);
}

/**
 * Light on a white vertical cylinder of half width hw at offset u across
 * it (-1 … 1): sky light from the front, the sun wrapped round its side.
 */
float paint(float u) {
  float z = sqrt(max(0.0, 1.0 - u * u));
  // toward the camera is -z in the scene; the sun is far ahead of us
  float lam = (u * gSunDir.x - z * gSunDir.z * 0.35 + gSunDir.y * 0.4 + 0.22) / 1.22;
  float sun = max(0.0, lam) * gSunUp * (0.42 + 0.3 * gGlow);
  float sky = 0.01 + 0.33 * gDay * gDay * (0.75 + 0.25 * z);
  return landTone() + sky + sun + 0.02 * gNight * z;
}

/**
 * The headland, the rocks off its point, the shed, the keeper's cottage and the
 * lighthouse: x = coverage, y = 1 on a lit window or the lamp, z = the
 * tone of whatever is there. lightR is a lit window's half size.
 */
vec3 headland(vec2 P, float aa, float lightR) {
  if (P.x < gStackX - 0.02 || P.y > gGround + TH + LDY + LH + 0.045) return vec3(0.0);
  float land = landTone();

  // the ground (cliff and plateau) and the rocks off the point
  float dGround = P.y - groundTop(P.x);
  float dStack = (length((P - vec2(gX0 - 0.004, HORIZON - 0.001)) / vec2(0.019, 0.0125)) - 1.0) * 0.0125;
  dStack = min(dStack, (length((P - vec2(gStackX, HORIZON - 0.001)) / vec2(0.0085, 0.0072)) - 1.0) * 0.0072);
  dStack += 0.0012 * (vnoise(P * 520.0) - 0.5);
  float d = min(dGround, dStack);
  float shade = land;
  // the low sun grazes the brow of the headland and the tops of the rocks
  float brow = (1.0 - smoothstep(0.0, gPx * 1.6, -min(dGround, dStack))) * step(min(dGround, dStack), 0.0);
  shade += brow * (0.22 * gGlow * gSunUp + 0.08 * smoothstep(6.0, 20.0, gElev));
  // strata in the rock face by day
  if (dGround < 0.0 && gDay > 0.01) shade += 0.05 * gDay * (fbm(P * vec2(80.0, 34.0)) - 0.5);

  float lit = 0.0;

  // the shed: a small block with a lean-to roof
  float dShed = sdBox(P, vec2(gShedX, gShedG + 0.006), vec2(0.0095, 0.0075));
  dShed = min(dShed, max(P.y - (gShedG + 0.0145 - (P.x - gShedX) * 0.22), max(abs(P.x - gShedX) - 0.0108, gShedG - P.y)));
  if (dShed < d) shade = mix(shade, paint(0.4) * 0.8, cover(dShed, aa));
  d = min(d, dShed);

  // the keeper's cottage: white walls under a gabled roof, a chimney, two windows
  float g = gCotG;
  float cx = gCotX;
  float dWall = sdBox(P, vec2(cx, g + 0.0095), vec2(0.022, 0.0105));
  float dRoof = max(max((P.y - (g + 0.035 - 0.58 * abs(P.x - cx))) * 0.86, g + 0.019 - P.y), abs(P.x - cx) - 0.0255);
  dRoof = min(dRoof, sdBox(P, vec2(cx + 0.012, g + 0.033), vec2(0.0024, 0.0055)));
  float dHouse = min(dWall, dRoof);
  // the windows: dark panes by day, lit one by one at dusk
  bool pane = false;
  for (int j = 0; j < 2; j++) {
    float fj = float(j);
    vec2 q = abs(P - vec2(cx + (j == 0 ? -0.0105 : 0.0085), g + 0.0105));
    if (max(q.x, q.y * 0.8) < max(lightR, 0.0034)) {
      pane = true;
      if (hash11(fj * 4.7 + 0.3) <= gLights * 1.15 - 0.04) lit = 1.0;
    }
  }
  if (dHouse < d) {
    float wall = pane ? land + 0.015 : paint(clamp((P.x - cx) / 0.03, -1.0, 1.0) * 0.6) * 0.92;
    shade = mix(shade, dWall < dRoof ? wall : land + 0.03 * gDay, cover(dHouse, aa));
  }
  d = min(d, dHouse);

  // the lighthouse: a tapered white tower with two painted bands
  float ty = clamp((P.y - gGround) / TH, 0.0, 1.0);
  float hw = mix(TBW, TTW, ty);
  float dTower = max(abs(P.x - gLx) - hw, max(gGround - 0.012 - P.y, P.y - (gGround + TH)));
  float gy = gGround + TH;
  // the gallery round the top, then the lantern, its dome and the vent
  float dGallery = sdBox(P, vec2(gLx, gy + 0.004), vec2(TTW + 0.0068, 0.0041));
  float dRail = sdBox(P, vec2(gLx, gy + 0.0102), vec2(TTW + 0.0054, 0.0012));
  float ly = gy + LDY;
  float dLantern = sdBox(P, vec2(gLx, ly + LH * 0.5), vec2(LW, LH * 0.5));
  float dDome = max(length((P - vec2(gLx, ly + LH)) * vec2(1.0, 1.15)) - LW * 1.18, ly + LH - 0.001 - P.y);
  float dVent = length(P - vec2(gLx, ly + LH + 0.0148)) - 0.0036;
  dVent = min(dVent, sdBox(P, vec2(gLx, ly + LH + 0.0215), vec2(0.0008, 0.0045)));
  float dIron = min(min(dGallery, dRail), min(dDome, dVent));
  float dLight = min(min(dTower, dLantern), dIron);
  if (dLight < d) {
    float tone;
    if (dTower <= min(dLantern, dIron)) {
      float bands = step(0.34, ty) * step(ty, 0.47) + step(0.66, ty) * step(ty, 0.79);
      float white = paint(clamp((P.x - gLx) / hw, -1.0, 1.0));
      tone = mix(white, land + (white - land) * 0.42, bands);
    } else {
      // black iron, and the glazing: a little sky in it by day
      tone = land + 0.025 * gDay;
      vec2 gq = abs(P - vec2(gLx, ly + LH * 0.5)) - vec2(LW - 0.0024, LH * 0.5 - 0.004);
      if (max(gq.x, gq.y) < 0.0) tone = land + 0.1 + 0.36 * gDay;
    }
    shade = mix(shade, tone, cover(dLight, aa));
  }
  d = min(d, dLight);

  float cov = cover(d, aa);
  // the lamp behind the glazing
  if (uLamp > 0.0) {
    vec2 gq = abs(P - vec2(gLx, ly + LH * 0.5)) - vec2(LW - 0.002, LH * 0.5 - 0.0035);
    float glass = cover(max(gq.x, gq.y), aa);
    lit = max(lit, glass * uLamp * 1.04);
  }
  return vec3(cov, min(lit, 1.0) * cov, shade);
}

/* ---------------------------------------------------------------- beams */

/**
 * One beam turned to angle th about the tower (cos: across the picture,
 * sin: into it). Seen in perspective its axis leaves the lamp toward the
 * point on the horizon it is heading for (away from you it narrows and
 * runs down toward the line; across, it is long and level; toward you it
 * shortens, widens and flares).
 */
float beamOne(vec2 P, float th) {
  float cx = cos(th);
  float cz = sin(th);
  vec2 o = vec2((gLamp.x - 0.5 * uAspect) / FOCAL, (gLamp.y - HORIZON) / FOCAL);
  vec2 dr = vec2(cx - o.x * cz, -o.y * cz);
  float sp = length(dr);
  float toward = smoothstep(0.25, -0.95, cz);
  // a beam coming toward you climbs out of the frame in a true projection;
  // held flatter it reads as the sweep it is
  vec2 dir = normalize(vec2(dr.x, dr.y * mix(1.0, 0.3, step(cz, 0.0))) + 1e-5);
  vec2 q = P - gLamp;
  float a = dot(q, dir);
  if (a <= 0.0) return 0.0;
  float perp = abs(q.x * dir.y - q.y * dir.x);
  float w = 0.0035 + a * (0.055 + 0.22 * toward);
  float fall = exp(-a / ((0.05 + 0.95 * sp) * mix(1.0, 0.5, toward))) * smoothstep(0.0, 0.014, a);
  // a beam heading away ends where it meets the horizon
  if (cz > 0.0) fall *= 1.0 - smoothstep(0.55, 1.0, a * cz / (FOCAL * sp + 1e-4));
  return exp(-(perp * perp) / (w * w)) * fall * mix(0.34, 1.0, toward);
}

float beams(vec2 P) {
  if (uLamp <= 0.0 || gDark <= 0.0) return 0.0;
  // a touch bolder on the small tile, where the beams are only a few dots wide
  return (beamOne(P, uBeam) + beamOne(P, uBeam + PI)) * gDark * uLamp * mix(0.62, 0.8, uTile);
}

/** The lamp's own glow, and the flash as a beam swings through you. */
float lampGlow(vec2 P) {
  if (uLamp <= 0.0) return 0.0;
  float r = length((P - gLamp) * vec2(1.0, 1.1));
  float halo = exp(-r * 44.0) * (0.05 + 0.16 * gDark) + exp(-r * r * 5200.0) * 0.4;
  float flash = gFlash * (exp(-r * 10.0) * 0.22 * (0.35 + 0.65 * gDark) + exp(-r * r * 700.0) * 0.5);
  return uLamp * (halo + flash);
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

/**
 * A glitter path toward the light in direction L: how likely a wavelet
 * here is tilted to throw that light at the camera, around the slope of
 * the waves underneath, plus a discrete twinkle per dot.
 */
float glitter(vec3 ray, vec2 g, vec2 dropped, vec3 L, vec2 cell, float base, float seed, float sparkles) {
  vec3 hv = normalize(-ray + L);
  vec2 need = hv.xz / max(hv.y, 1e-3);
  vec2 dev = need + g;
  // the waves left out at this distance still tilt the facets: their slope
  // variance widens the spread (as in LEAN / Toksvig mapping), so the path
  // stays whole into the distance instead of breaking into clumps. It is
  // mostly variance along z, which lengthens the path, not widens it.
  vec2 s2 = vec2(base * base) + dropped * 0.85;
  float p = exp(-0.5 * (dev.x * dev.x / s2.x + dev.y * dev.y / s2.y));
  // the same light spread over more slopes is dimmer per facet
  float spread = base * base * inversesqrt(s2.x * s2.y);
  float frame = floor(gTime * 7.0);
  float tw = hash12(cell * 1.37 + vec2(frame * 13.1 + seed, frame * 7.7 - seed));
  // far off, fewer and finer sparkles: a shimmer rather than a glare
  float sparkle = step(tw, p * 1.25 * mix(1.0, spread, 0.75)) * smoothstep(0.015, 0.12, p);
  return 0.5 * p * mix(1.0, spread, 0.4) + 0.8 * sparkle * sparkles;
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

  // what the water mirrors: the sky, or the headland and its lights
  vec3 nr = normalize(vec3(-g.x * 0.55, 1.0, -g.y * 0.55));
  vec3 r = reflect(ray, nr);
  r.y = max(r.y, 0.0015);
  r.z = max(r.z, 0.05);
  vec2 Pr = vec2(0.5 * A + r.x / r.z * FOCAL, HORIZON + r.y / r.z * FOCAL);
  float refl = withClouds(Pr, skyBase(Pr));
  float mirror = 1.0 - smoothstep(0.1, 0.3, v);
  refl += beams(Pr) * 0.5 * mirror;
  vec3 L = headland(Pr, gPx * 1.6, gPx * 1.7);
  refl = mix(refl, L.z, L.x * mirror);
  refl = max(refl, L.y * 0.95 * mirror);
  vec2 B = boat(Pr, gPx * 1.6, gPx * 1.4);
  refl = mix(refl, landTone(), B.x * mirror);
  refl = max(refl, B.y * 0.8 * mirror);

  float cosT = clamp(dot(-ray, n), 0.0, 1.0);
  float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
  float body = 0.02 + 0.15 * gDay + 0.05 * gGlow;
  float tone = mix(body, refl, F);

  // the three glitter paths: the sun, the moon, the lamp
  if (gSunUp > 0.0) {
    float base = 0.07 + 0.03 * smoothstep(12.0, 25.0, gElev);
    tone += glitter(ray, g, dropped, gSunDir, cell, base, 0.0, 1.0) * gSunUp * (0.75 + 0.25 * gGlow);
  }
  if (gNight > 0.0) {
    tone += glitter(ray, g, dropped, gMoonDir, cell, 0.06, 17.0, 0.7) * gNight * 0.42;
  }
  if (uLamp * gDark > 0.0) {
    tone += glitter(ray, g, dropped, gLampDir, cell, 0.05, 31.0, 0.7) * uLamp * gDark * (0.26 + 0.5 * gFlash);
  }

  // foam where the swell meets the cliff and the rocks
  bool rock = P.x > gX0 - 0.022 || abs(P.x - gStackX) < 0.009;
  if (rock && v < 0.0075) {
    float surge = vnoise(vec2(P.x * 95.0 + gTime * 0.45, gTime * 0.32));
    float foam = smoothstep(0.58, 0.76, surge) * (1.0 - smoothstep(0.003, 0.0075, v));
    tone = mix(tone, 0.32 + 0.42 * gDay, foam * 0.75);
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
  gSunP = vec2(uSun.x * A, heightAt(gElev));
  gSunDir = normalize(vec3(gSunP.x - 0.5 * A, gSunP.y - HORIZON, FOCAL));
  gDay = smoothstep(-9.0, 15.0, gElev);
  gGlow = exp(-pow((gElev - 1.0) / 8.0, 2.0));
  gVis = smoothstep(-12.0, -0.5, gElev);
  gSunUp = smoothstep(-1.2, 0.8, gElev);
  // the first windows come on while the sun is still touching the sea
  gLights = smoothstep(2.5, -7.5, gElev);
  gNight = smoothstep(-1.5, -9.0, gElev);
  // how much the air shows the beams
  gDark = smoothstep(1.0, -5.5, gElev);
  // a beam swinging through the line of sight
  gFlash = pow(abs(sin(uBeam)), 16.0);

  // the moon climbs a little as the night deepens; its lit side faces the sun
  gMoonP = vec2(${f(MOON_X)} * A, heightAt(mix(12.5, 19.0, smoothstep(2.0, -12.0, gElev))));
  gMoonL = normalize(gSunP - gMoonP);
  gMoonDir = normalize(vec3(gMoonP.x - 0.5 * A, gMoonP.y - HORIZON, FOCAL));

  gX0 = ${f(HEADLAND_X)} * A;
  gLx = ${f(LIGHT_X)} * A;
  gGround = groundTop(gLx);
  gCotX = gLx + 0.074;
  gCotG = groundTop(gCotX) - 0.002;
  gShedX = gLx - 0.046;
  gShedG = groundTop(gShedX) - 0.002;
  gStackX = gX0 - 0.036;
  gLamp = vec2(gLx, gGround + TH + LDY + LH * 0.5);
  gLampDir = normalize(vec3(gLamp.x - 0.5 * A, gLamp.y - HORIZON, FOCAL));

  float tone;
  if (P.y >= HORIZON) {
    tone = withClouds(P, skyBase(P));
    tone = max(tone, stars(P));
    tone = withMoon(P, tone);
    tone = max(tone, meteor(P));
    float disc = sunDisc(P);
    if (disc > 0.0) {
      // the low sun is a touch dimmer at its foot, seen through more air,
      // but always clearly brighter than the glow around it (a half-sunk
      // disc must still read as the sun)
      float foot = smoothstep(0.0, 0.06, P.y - HORIZON);
      float sunTone = mix(0.93, 1.0, max(foot, smoothstep(2.0, 8.0, gElev)));
      tone = mix(tone, max(tone, sunTone), disc);
    }
    tone += beams(P);
    float gl = gulls(P);
    tone = mix(tone, landTone() + 0.02, gl);
    vec2 B = boat(P, gPx, gPx * 0.5);
    tone = mix(tone, landTone() + 0.01, B.x);
    tone = max(tone, B.y * 0.85);
    vec3 L = headland(P, gPx, gPx * 0.5);
    tone = mix(tone, L.z, L.x);
    tone = max(tone, L.y);
    tone += lampGlow(P);
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
