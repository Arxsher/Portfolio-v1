(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,49732,e=>{"use strict";var t=e.i(43476),a=e.i(71645),o=e.i(33209),i=e.i(16442),n=e.i(37047),r=e.i(45219);function l(e){return .36+ +Math.tan(e*Math.PI/180)}let s=[0,1,1,0],h=[{id:"ink",label:"Ink",colors:["#1d2747","#efe7d6"],levels:[.1,.97,1.6,0]},{id:"sunset",label:"Sunset",colors:["#26122d","#8a2a4c","#e8663a","#ffd590"],levels:s},{id:"tide",label:"Tide",colors:["#0c2433","#2d7686","#d6ece2"],levels:s},{id:"mono",label:"Mono",colors:["#121212","#f2f1ee"],levels:[.14,.97,1.8,0]}];function d(e){return h.find(t=>t.id===e)??h[0]}function c(e){let t=e.replace("#","");return[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255]}function u(e){return e>=9?"Afternoon":e>=.8?"Golden hour":e>=-.8?"Sunset":e>=-4.5?"Dusk":e>=-8?"Blue hour":e>=-11?"Nightfall":"Night"}function f(e){let t=Math.round(e);return`${t<0?"−":""}${Math.abs(t)}\xb0`}var p=e.i(55171);let g=`#version 300 es
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

const float HORIZON = 0.3600;
const float FOCAL = 1.0000;
const float CAM_H = 2.4;   // camera height above the water (m)
const float STILL = 31.4000; // the reduced-motion still's clock
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
// (72\xb0: a fat crescent, its bright side toward the sun)
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
  gMoonP = vec2(0.3400 * A, heightAt(mix(12.5, 19.0, smoothstep(2.0, -12.0, gElev))));
  gMoonL = normalize(gSunP - gMoonP);
  gMoonDir = normalize(vec3(gMoonP.x - 0.5 * A, gMoonP.y - HORIZON, FOCAL));

  gX0 = 0.6000 * A;
  gLx = 0.7800 * A;
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
`,m=`#version 300 es
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
`,v=(e,t)=>{t.fill(0);let a=Math.min(4,e.length);for(let o=0;o<a;o++){let a=e[o];t[3*o]=a[0],t[3*o+1]=a[1],t[3*o+2]=a[2]}return t};class x{gl;scene;dither;us;ud;vao;grids=[null,null];current=0;width=0;height=0;pal=new Float32Array(12);prevPal=new Float32Array(12);constructor(e){this.gl=e,this.scene=(0,p.createProgram)(e,p.FULLSCREEN_VERTEX,g),this.dither=(0,p.createProgram)(e,p.FULLSCREEN_VERTEX,m),this.us=(0,p.uniformLocations)(e,this.scene),this.ud=(0,p.uniformLocations)(e,this.dither);const t=e.createVertexArray();if(!t)throw Error("dusk: could not allocate a vertex array");this.vao=t}needsGrid(e,t,a){let o=this.grids[this.current];return!o||this.width!==e||this.height!==t||o.cellPx!==a}setGrid(e,t,a,o){let i=this.gl,n=this.width!==e||this.height!==t;this.width=e,this.height=t,o&&!n&&this.grids[this.current]?this.current=1-this.current:this.free(1-this.current),this.free(this.current);let r=Math.ceil(e/a),l=Math.ceil(t/a),s=i.createTexture(),h=i.createFramebuffer();if(!s||!h)throw Error("dusk: could not allocate the dot grid");i.bindTexture(i.TEXTURE_2D,s),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,r,l,0,i.RGBA,i.UNSIGNED_BYTE,null),i.bindFramebuffer(i.FRAMEBUFFER,h),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,s,0),i.bindFramebuffer(i.FRAMEBUFFER,null),this.grids[this.current]={texture:s,fbo:h,cols:r,rows:l,cellPx:a,ox:Math.floor((e-r*a)/2),oy:Math.floor((t-l*a)/2)}}get hasPrevious(){return!!this.grids[1-this.current]}dropPrevious(){this.free(1-this.current)}draw(e){let t=this.gl,a=this.grids[this.current];if(!a)return;t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.bindVertexArray(this.vao),t.bindFramebuffer(t.FRAMEBUFFER,a.fbo),t.viewport(0,0,a.cols,a.rows),t.useProgram(this.scene);let o=this.us;t.uniform2f(o("uCells"),a.cols,a.rows),t.uniform1f(o("uAspect"),a.cols*a.cellPx/(a.rows*a.cellPx)),t.uniform1f(o("uTime"),e.time),t.uniform2f(o("uSun"),e.sunX,e.elevation),t.uniform1f(o("uLamp"),e.lamp),t.uniform1f(o("uBeam"),e.beam),t.uniform1f(o("uTile"),+!!e.tile),t.uniform1f(o("uZoom"),e.tile?1.28:1),(0,p.drawFullscreen)(t),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.width,this.height),t.useProgram(this.dither);let i=this.ud,n=this.grids[1-this.current];t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,a.texture),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,(n??a).texture),t.uniform1i(i("uScene"),0),t.uniform1i(i("uPrev"),1),t.uniform2f(i("uRes"),this.width,this.height),t.uniform1f(i("uCellPx"),a.cellPx),t.uniform2f(i("uOffset"),a.ox,a.oy),t.uniform1f(i("uPrevCellPx"),(n??a).cellPx),t.uniform2f(i("uPrevOffset"),(n??a).ox,(n??a).oy),t.uniform1f(i("uDotMix"),n?e.dotMix:1);let r=Math.min(1,Math.max(0,(-1.5-e.elevation)/7.5)),l=r*r*(3-2*r),s=e.levels,h=e.palette.length<=2?l:0;t.uniform3fv(i("uPal"),v(e.palette,this.pal)),t.uniform1i(i("uCount"),Math.min(4,e.palette.length)),t.uniform4f(i("uLevels"),s[0]-.07*h,s[1],s[2]+(1-s[2])*.7*h,s[3]);let d=e.previousLevels,c=e.previousPalette.length<=2?l:0;t.uniform3fv(i("uPrevPal"),v(e.previousPalette,this.prevPal)),t.uniform1i(i("uPrevCount"),Math.min(4,e.previousPalette.length)),t.uniform4f(i("uPrevLevels"),d[0]-.07*c,d[1],d[2]+(1-d[2])*.7*c,d[3]),t.uniform1f(i("uPalMix"),e.paletteMix),t.uniform1f(i("uDim"),e.dim),(0,p.drawFullscreen)(t),t.activeTexture(t.TEXTURE0),t.bindVertexArray(null)}free(e){let t=this.grids[e];t&&(this.gl.deleteTexture(t.texture),this.gl.deleteFramebuffer(t.fbo),this.grids[e]=null)}dispose(){this.free(0),this.free(1),this.gl.deleteProgram(this.scene),this.gl.deleteProgram(this.dither),this.gl.deleteVertexArray(this.vao)}}class w{kit=null;out=null;echo=null;sides=[];timer=0;nextSwell=0;nextGull=0;nextBell=0;side=0;buffer=null;daylight=1;night=0;get playing(){return!!this.out}start(e){if(this.out)return;let{ctx:t,output:a}=e;this.kit=e;let o=t.currentTime,n=t.createGain();n.gain.setValueAtTime(0,o),n.gain.linearRampToValueAtTime(.22,o+1.26),n.gain.linearRampToValueAtTime(1,o+2.8),n.connect(a),this.out=n;let r=t.createDelay(1);r.delayTime.value=.23;let l=t.createGain();l.gain.value=.28;let s=t.createGain();s.gain.value=.5;let h=t.createBiquadFilter();h.type="lowpass",h.frequency.value=2200,r.connect(h).connect(l).connect(r),h.connect(s).connect(n),this.echo={delay:r,feedback:l,wet:s};let d=(0,i.noiseBuffer)(t,4);this.buffer=d,this.sides=[-.55,.55].map((e,a)=>{let i=t.createBufferSource();i.buffer=d,i.loop=!0,i.playbackRate.value=a?.93:1;let r=t.createBiquadFilter();r.type="lowpass",r.frequency.value=380,r.Q.value=.4;let l=t.createGain();l.gain.value=.16;let s=t.createBiquadFilter();s.type="bandpass",s.frequency.value=5200,s.Q.value=.6;let h=t.createGain();h.gain.value=0;let c=n;if("function"==typeof t.createStereoPanner){let a=t.createStereoPanner();a.pan.value=e,a.connect(n),c=a}return i.connect(r).connect(l).connect(c),i.connect(s).connect(h).connect(c),i.start(o,1.7*a),{source:i,filter:r,gain:l,fizzFilter:s,fizz:h}}),this.nextSwell=o+1.4,this.nextGull=o+4+6*Math.random(),this.nextBell=o+2.5+4*Math.random(),this.tick()}tick=()=>{let e=this.kit;if(!e||!this.out)return;let t=e.ctx.currentTime;for(;this.nextSwell<t+2;)this.swell(this.nextSwell),this.nextSwell+=5.8+3.2*Math.random();t>this.nextGull&&(this.daylight>.25&&.8>Math.random()&&this.gull(t+.05,this.daylight),this.nextGull=t+9+13*Math.random()),t>this.nextBell&&(this.night>.5&&.75>Math.random()&&this.bell(t+.05,this.night),this.nextBell=t+10+12*Math.random()),this.timer=window.setTimeout(this.tick,400)};swell(e){let t=this.sides[this.side];if(this.side=1-this.side,!t)return;let a=.16*(2.4+1.1*Math.random());t.gain.gain.setTargetAtTime(a,e,.85),t.filter.frequency.setTargetAtTime(1100+500*Math.random(),e,.8),t.gain.gain.setTargetAtTime(.16,e+1.9,1.5),t.filter.frequency.setTargetAtTime(380,e+1.9,1.7),t.fizz.gain.setTargetAtTime(.045+.025*Math.random(),e+1.5,.25),t.fizz.gain.setTargetAtTime(0,e+2.1,.9)}gull(e,t){let a=this.kit,o=this.out;if(!a||!o||!this.echo)return;let{ctx:i}=a,n=(.5>Math.random()?-1:1)*(.35+.45*Math.random()),r=o;if("function"==typeof i.createStereoPanner){let e=i.createStereoPanner();e.pan.value=n,e.connect(o),e.connect(this.echo.delay),r=e}let l=2+Math.floor(3*Math.random()),s=1180+260*Math.random(),h=.05*t;for(let t=0;t<l;t++){let a=e+t*(.2+.05*Math.random()),o=s*(1-.035*t),n=t===l-1,d=n?.32:.17,c=i.createOscillator();c.type="sawtooth",c.frequency.setValueAtTime(.72*o,a),c.frequency.exponentialRampToValueAtTime(o,a+.04),c.frequency.exponentialRampToValueAtTime(o*(n?.55:.68),a+d);let u=i.createOscillator();u.frequency.value=26;let f=i.createGain();f.gain.value=.012*o,u.connect(f).connect(c.frequency);let p=i.createBiquadFilter();p.type="bandpass",p.frequency.value=2100,p.Q.value=2.2;let g=i.createBiquadFilter();g.type="lowpass",g.frequency.value=3200;let m=i.createGain();m.gain.setValueAtTime(0,a),m.gain.linearRampToValueAtTime(h,a+.025),m.gain.setTargetAtTime(.7*h,a+.05,.06),m.gain.setTargetAtTime(0,a+d-.05,.04),c.connect(p).connect(g).connect(m).connect(r),c.start(a),u.start(a),c.stop(a+d+.3),u.stop(a+d+.3)}}bell(e,t){let a=this.kit,o=this.out;if(!a||!o||!this.echo)return;let{ctx:i}=a,n=o;if("function"==typeof i.createStereoPanner){let e=i.createStereoPanner();e.pan.value=(.5>Math.random()?-1:1)*(.2+.4*Math.random()),e.connect(o),e.connect(this.echo.delay),n=e}let r=i.createBiquadFilter();r.type="lowpass",r.frequency.value=2600,r.connect(n);let l=410+40*Math.random(),s=[[.5,.45,3.4],[1,1,2.6],[1.19,.4,2.1],[1.5,.32,1.7],[2,.28,1.3],[2.74,.14,.8]],h=.55>Math.random()?2:1;for(let a=0;a<h;a++){let o=e+a*(.5+.35*Math.random()),n=.016*t*(a?.55:1);for(let[e,t,a]of s){let s=i.createOscillator();s.frequency.value=l*e*(1+(Math.random()-.5)*.002);let h=i.createGain();h.gain.setValueAtTime(0,o),h.gain.linearRampToValueAtTime(n*t,o+.004),h.gain.setTargetAtTime(0,o+.006,a/3),s.connect(h).connect(r),s.start(o),s.stop(o+1.6*a)}}}strike(){let e=this.kit;if(!e||!this.out||!this.buffer)return;let{ctx:t,output:a}=e,o=t.currentTime+.005,i=t.createGain();i.gain.value=.9,i.connect(a);let n=t.createOscillator();n.frequency.setValueAtTime(150,o),n.frequency.exponentialRampToValueAtTime(52,o+.13);let r=t.createGain();for(let[e,a]of(r.gain.setValueAtTime(0,o),r.gain.linearRampToValueAtTime(.13,o+.005),r.gain.setTargetAtTime(0,o+.02,.045),n.connect(r).connect(i),n.start(o),n.stop(o+.4),[[0,1],[.11,.55],[.24,.4]])){let n=t.createBufferSource();n.buffer=this.buffer;let r=t.createBiquadFilter();r.type="bandpass",r.frequency.value=2600+900*Math.random(),r.Q.value=1.4;let l=t.createGain(),s=o+e;l.gain.setValueAtTime(0,s),l.gain.linearRampToValueAtTime(.11*a,s+.0015),l.gain.setTargetAtTime(0,s+.003,.006),n.connect(r).connect(l).connect(i),n.start(s,3*Math.random(),.06)}for(let[e,a]of[[2793,1],[4186,.5]]){let n=t.createOscillator();n.frequency.value=e;let r=t.createGain(),l=o+.26;r.gain.setValueAtTime(0,l),r.gain.linearRampToValueAtTime(.006*a,l+.01),r.gain.setTargetAtTime(0,l+.02,.35),n.connect(r).connect(i),n.start(l),n.stop(l+1.6)}window.setTimeout(()=>i.disconnect(),2200)}stop(){let e=this.kit,t=this.out;if(window.clearTimeout(this.timer),this.timer=0,!e||!t)return;let a=this.sides,o=this.echo;this.out=null,this.sides=[],this.echo=null,this.buffer=null;let i=e.ctx.currentTime;if("function"==typeof t.gain.cancelAndHoldAtTime)t.gain.cancelAndHoldAtTime(i);else{let e=t.gain.value;t.gain.cancelScheduledValues(i),t.gain.setValueAtTime(e,i)}t.gain.setTargetAtTime(0,i,.25),window.setTimeout(()=>{for(let e of a){try{e.source.stop()}catch{}e.source.disconnect()}o?.delay.disconnect(),t.disconnect()},1400)}}function b(e){for(let t=1;t<=16;t++)if(1e-4>Math.abs(t*e-Math.round(t*e)))return t;return 1}let y=(e,t)=>{let a=b(t);return Math.max(a,Math.floor(e/a+1e-6)*a)},P={card:{x:0,y:0,w:0,h:0},win:{x:0,y:0,w:0,h:0},bevel:0,caption:0,matSide:0},T=(e,t,a)=>{let o=b(a);return Math.round((t+e)/o)*o-t};function k(e,t,a,o,i,n,r){return{x:T((a-e)/2,r.x,n),y:T(o+(i-o-t)/2,r.y,n),w:y(e,n),h:y(t,n)}}let L={tile:{light:{x:.3,e:4.6},dark:{x:.3,e:-4.2}},stage:{light:{x:.3,e:4.2},dark:{x:.31,e:-6}}},M={stiffness:34,damping:11.7},A=Math.tan(54*Math.PI/180),E=h.map(e=>({value:e.id,label:e.label,swatch:function(e){let t=e.colors;if(t.length<=2)return`linear-gradient(135deg, ${t[t.length-1]} 0 50%, ${t[0]} 50% 100%)`;let a=[...t].reverse(),o=100/a.length;return`linear-gradient(180deg, ${a.map((e,t)=>`${e} ${t*o}% ${(t+1)*o}%`).join(", ")})`}(e)})),S=e=>d(e).colors.map(c),R=e=>`${u(e)}, sun ${f(e)}`,O=`url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.27 0 0 0 0 0.2 0 0 0 0.11 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>")}")`,q=`
.dusk-card {
  position: absolute;
  border-radius: 3px;
  background: #fbfaf6;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.95),
    inset 0 -1px 0 rgb(120 100 70 / 0.06),
    0 0 0 0.5px rgb(60 44 28 / 0.12),
    0 1px 1.5px rgb(52 36 24 / 0.12),
    0 4px 9px -2px rgb(52 36 24 / 0.1),
    0 16px 30px -10px rgb(52 36 24 / 0.17),
    0 38px 64px -26px rgb(52 36 24 / 0.24);
  transition: background-color 500ms var(--ease-out), box-shadow 300ms var(--ease-out);
}
.dusk-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background-image: ${O};
  background-size: 180px 180px;
  opacity: 0.55;
}
.dusk-card[data-tile] {
  border-radius: 2px;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.9),
    0 0 0 0.5px rgb(60 44 28 / 0.12),
    0 1px 1.5px rgb(52 36 24 / 0.14),
    0 3px 7px -1px rgb(52 36 24 / 0.1),
    0 10px 20px -8px rgb(52 36 24 / 0.2);
}
.group:hover .dusk-card[data-tile] {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.9),
    0 0 0 0.5px rgb(60 44 28 / 0.12),
    0 1px 2px rgb(52 36 24 / 0.14),
    0 5px 10px -2px rgb(52 36 24 / 0.12),
    0 14px 26px -8px rgb(52 36 24 / 0.24);
}
.dusk-bevel {
  position: absolute;
  border-style: solid;
  /* light from the upper left: the top and left faces of the cut look down
     and away, the bottom and right faces catch it */
  border-color: #e3ded3 #fdfcf9 #ffffff #ebe7de;
}
.dusk-window {
  position: absolute;
  overflow: hidden;
  background: var(--dusk-ground, #8a7f74);
}
.dusk-window::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 1px 1.5px rgb(30 20 10 / 0.28), inset 1px 0 1px rgb(30 20 10 / 0.12);
}
.dusk-caption { color: #8a8478; }
.dark .dusk-card {
  background: #2b2a28;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 0 0 0.5px rgb(0 0 0 / 0.6),
    0 1px 2px rgb(0 0 0 / 0.45),
    0 5px 12px -3px rgb(0 0 0 / 0.4),
    0 18px 36px -12px rgb(0 0 0 / 0.55),
    0 40px 70px -28px rgb(0 0 0 / 0.6);
}
.dark .dusk-card::before { opacity: 0.35; mix-blend-mode: overlay; }
.dark .dusk-card[data-tile] {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    0 0 0 0.5px rgb(0 0 0 / 0.6),
    0 2px 4px rgb(0 0 0 / 0.4),
    0 10px 22px -8px rgb(0 0 0 / 0.6);
}
.dark .group:hover .dusk-card[data-tile] {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    0 0 0 0.5px rgb(0 0 0 / 0.6),
    0 3px 6px rgb(0 0 0 / 0.45),
    0 14px 28px -8px rgb(0 0 0 / 0.65);
}
.dark .dusk-bevel { border-color: #1d1c1b #3a3936 #45433f #22211f; }
.dark .dusk-window::after { box-shadow: inset 0 1px 1.5px rgb(0 0 0 / 0.5), inset 1px 0 1px rgb(0 0 0 / 0.25); }
.dark .dusk-caption { color: #8f8a82; }
.dusk-canvas { image-rendering: pixelated; }
/* the speaker glows twice when the sea first comes in */
.dusk-sound::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
  pointer-events: none;
  opacity: 0;
  background: var(--well);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--foreground) 20%, transparent);
}
.dusk-sound[data-note]::before { animation: dusk-note 1.4s var(--ease-out) 2; }
@keyframes dusk-note {
  0%, 100% { opacity: 0; }
  32% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .dusk-card { transition: none; }
  .dusk-sound[data-note]::before { animation: none; opacity: 1; }
}
`;function C({palette:e}){let a=d(e).colors,o=a.length,i=a[o-1],n=a[0],r=o>2?[a[1],a[o-2],a[o-2]]:[n,n,i],s=(1-l(4))*100,h=56.7;return(0,t.jsxs)("svg",{"aria-hidden":"true",className:"absolute inset-0 size-full",viewBox:"0 0 160 100",preserveAspectRatio:"xMidYMid slice",children:[(0,t.jsx)("rect",{width:"160",height:64,fill:r[0]}),(0,t.jsx)("rect",{y:28.8,width:"160",height:35.2,fill:r[1],opacity:+(o>2)}),(0,t.jsx)("rect",{y:51.2,width:"160",height:12.8,fill:o>2?i:r[2],opacity:.55*(o>2)}),(0,t.jsx)("circle",{cx:"48",cy:s,r:"5.2",fill:i}),(0,t.jsx)("rect",{y:64,width:"160",height:36,fill:o>2?a[1]:n}),(0,t.jsx)("rect",{x:"45",y:65.5,width:"6",height:"1.4",fill:i}),(0,t.jsx)("rect",{x:"46",y:69,width:"4",height:"1.2",fill:i}),(0,t.jsx)("rect",{x:"44",y:73.5,width:"8",height:"1.4",fill:i}),(0,t.jsx)("path",{fill:n,d:"M91.55 64 q0.85 -1.45 1.7 0 Z M93.7 64 q1.9 -2.5 3.8 0 Z"}),(0,t.jsx)("path",{fill:n,d:`M95.6 64 C99 64 101 ${58} 108.5 ${57.6} L160 ${56.3} V64 Z`}),(0,t.jsx)("path",{fill:n,d:`M119.3 ${h+.4} v-1.6 h2.1 v1.2 Z`}),(0,t.jsx)("path",{fill:n,d:`M130 ${h+.4} v-2 l-0.35 0 l2.55 -1.6 l2.55 1.6 l-0.35 0 v2 Z`}),(0,t.jsx)("path",{fill:n,d:`M122.9 ${h+.6} L123.58 ${h-17} h2.44 L126.7 ${h+.6} Z`}),(0,t.jsx)("rect",{x:"122.98",y:h-17.72,width:"3.64",height:"0.72",fill:n}),(0,t.jsx)("rect",{x:"123.84",y:h-20.75,width:"1.92",height:"3.05",fill:n}),(0,t.jsx)("path",{fill:n,d:`M123.67 ${h-20.7} a1.13 1 0 0 1 2.26 0 Z`}),(0,t.jsx)("circle",{cx:"124.8",cy:h-22.1,r:"0.31",fill:n})]})}e.s(["default",0,function({mode:e,active:s,reducedMotion:h,theme:c}){let p="stage"===e,g=(0,a.useRef)(null),m=(0,a.useRef)(null),v=(0,a.useRef)(null),b=(0,a.useId)(),T=(0,n.useElementSize)(g),O=(0,n.useFinePointer)(),D=(0,i.useMuted)(),[z,N]=(0,a.useState)("sunset"),[F,G]=(0,a.useState)(()=>p&&window.innerWidth<640?1:2),[I,B]=(0,a.useState)(null),H=p?I??!h:!h,[j,_]=(0,a.useState)(!1),[X,U]=(0,a.useState)(""),[V,K]=(0,a.useState)(!1),[Z,$]=(0,a.useState)(!1),[W,Y]=(0,a.useState)(null),[Q,J]=(0,a.useState)(0),[ee,et]=(0,a.useState)(!1),ea=(0,a.useRef)(!1),eo=p?3:2,ei=Math.max(1,Math.min(eo,window.devicePixelRatio||1));(0,n.useIsoLayoutEffect)(()=>{if(!p)return;let e=g.current?.querySelector(".dusk-controls");if(!e)return;let t=()=>{let t=g.current?.getBoundingClientRect();if(!t)return;let a=t.height;for(let o of Array.from(e.children)){let e=o.getBoundingClientRect();e.height>0&&(a=Math.min(a,e.top-t.top))}J(a)};t();let a=new ResizeObserver(t);return a.observe(e),g.current&&a.observe(g.current),()=>a.disconnect()},[p]);let[en,er]=(0,a.useState)({x:0,y:0}),el=(0,a.useCallback)(()=>{let e=g.current;if(!e)return;let t=e.getBoundingClientRect(),a=t.left+window.scrollX,o=t.top+window.scrollY;er(e=>.01>Math.abs(e.x-a)&&.01>Math.abs(e.y-o)?e:{x:a,y:o})},[]);(0,n.useIsoLayoutEffect)(()=>{el()},[el,T.width,T.height]),(0,a.useEffect)(()=>{let e=0,t=!0,a=()=>{!e&&t&&(e=requestAnimationFrame(()=>(e=0,el())))},o=new ResizeObserver(a);return o.observe(document.body),window.addEventListener("resize",a),document.addEventListener("transitionend",a,!0),document.addEventListener("animationend",a,!0),document.fonts?.ready.then(a),()=>{t=!1,cancelAnimationFrame(e),o.disconnect(),window.removeEventListener("resize",a),document.removeEventListener("transitionend",a,!0),document.removeEventListener("animationend",a,!0)}},[el]);let es=(0,a.useMemo)(()=>T.width&&T.height?p?function(e,t,a,o){let i=e<640,r=i?14:30,l=Math.max(r+120,t-(i?14:24)),s=e-2*(i?14:48),h=l-r;if(s<80||h<80)return null;let d=Math.round((0,n.clamp)(.038*Math.min(s,1.6*h),12,24)),c=i?30:36,u=s-2*d,f=h-d-c,p=(0,n.clamp)(u/f,1.12,1.72),g=Math.min(u,Math.max(720,.86*s)),m=g/p;m>f&&(g=(m=f)*p),g=y(g,a),m=y(m,a);let v=y(d,a),x=y(c,a);return{card:k(g+2*v,m+v+x,e,r,l,a,o),win:{x:v,y:v,w:g,h:m},bevel:i?2:3,caption:x,matSide:v}}(T.width,Q||T.height-96,ei,en):function(e,t,a,o){if(e<40||t<30)return null;let i=e>=190?5:4,r=i+2,l=.76*e-2*i,s=.74*t-i-r,h=(0,n.clamp)(l/s,1.4,2);l/s>h?l=s*h:s=l/h,l=y(l,a),s=y(s,a);let d=y(i,a);return{card:k(l+2*d,s+d+y(r,a),e,0,t,a,o),win:{x:d,y:d,w:l,h:s},bevel:1,caption:0,matSide:d}}(T.width,T.height,ei,en):null,[p,T.width,T.height,Q,ei,en]),eh=(0,n.useLatest)(es),[ed]=(0,a.useState)(()=>{let t=L[e][c],a=S("sunset"),o=d("sunset").levels,i=t.e<1.5,r={time:31.4,sunX:t.x,elevation:t.e,lamp:+!!i,beam:3.5,tile:"tile"===e,palette:a,previousPalette:a,levels:o,previousLevels:o,paletteMix:1,dotMix:1,dim:1};return{x:new n.Spring(t.x,M),e:new n.Spring(t.e,M),pin:{x:t.x,e:t.e},pinned:!1,input:"rest",dragging:!1,probe:{x:0,e:0,v:0},preview:{x:t.x,e:t.e},previewing:!1,enteredAt:-1,fast:!1,lingerSince:-1,sunk:!1,pending:!1,touch:{mode:0,x0:0,y0:0,e0:0,sx:0},clock:31.4,acc:0,palette:"sunset",colors:a,previous:a,levels:o,previousLevels:o,paletteMix:1,dotMix:1,dotChanged:!1,dim:"dark"===c?.86:1,lampOn:i,lamp:+!!i,lampT:10,lampFrom:0,beam:3.5,capE:NaN,capPhase:"",noted:!1,frame:r}}),ec=(0,a.useRef)(null),eu=(0,a.useRef)(null),ef=(0,a.useRef)(!1),ep=(0,a.useRef)(null),eg=(0,a.useRef)(!1),em=(0,a.useRef)(0),ev=(0,n.useLatest)({dot:p?F:1,motion:H,reducedMotion:h,theme:c,mode:e,active:s,muted:D}),ex=(0,a.useCallback)((e,t,a,o)=>{let i=eh.current;if(!i||!i.win.w||!i.win.h)return!1;let r=i.card.x+i.win.x,l=i.card.y+i.win.y;return!(e<r-a)&&!(e>r+i.win.w+a)&&!(t<l-a)&&!(t>l+i.win.h+a)&&(o.v=1-(t-l)/i.win.h,o.x=(0,n.clamp)((e-r)/i.win.w,.03,.97),o.e=(0,n.clamp)(180*Math.atan((o.v-.36)/1)/Math.PI,-13,27),!0)},[eh]),ew=(0,n.useFrame)(s,e=>{let t=ec.current,a=eb.current,o=ev.current;if(!t||!a||!ey.current)return;let i=a.width,r=a.height;if(i<4||r<4)return;if("tile"===o.mode){if(ed.acc+=e,ed.acc<1/30-.002)return;e=ed.acc,ed.acc=0}let l=Math.max(1,Math.round(o.dot*eP.current.dpr));if(t.needsGrid(i,r,l)){let e=ed.dotChanged&&!o.reducedMotion;t.setGrid(i,r,l,e),ed.dotMix=+!e,ed.dotChanged=!1}let s=L[o.mode][o.theme],h=ed.pinned?ed.pin:s,d=h.x,c=h.e,p=eE.current;"stage"===o.mode?((e,t,a)=>{let o=ed.probe;if(e.pressed||!e.inside||"mouse"!==e.type||"pointer"!==ed.input||!ex(e.x,e.y,0,o))return ed.previewing=!1,ed.enteredAt=-1,ed.fast=!1,ed.lingerSince=-1,ed.sunk=!1,ed.pending=!1,!1;ed.enteredAt<0&&(ed.enteredAt=a);let i=a-e.time>90?0:Math.hypot(e.vx,e.vy);i>600?ed.fast=!0:i<380&&(ed.fast=!1);let n=a-ed.enteredAt>=200;if(ed.pending=!n||ed.fast,!n||ed.fast||o.v<.12)return ed.previewing;let r=o.e,l=Math.min(0,t);return r<l?(i<160?ed.lingerSince<0&&(ed.lingerSince=a):ed.sunk||(ed.lingerSince=-1),!ed.sunk&&ed.lingerSince>=0&&a-ed.lingerSince>=380&&(ed.sunk=!0),ed.sunk||(r=l,ed.pending=!0)):(ed.sunk=!1,ed.lingerSince=-1),ed.preview.x=o.x,ed.preview.e=r,ed.previewing=!0,!0})(p,h.e,performance.now())&&(d=ed.preview.x,c=ed.preview.e):p.inside&&"mouse"===p.type&&!o.reducedMotion&&(d=s.x+(p.nx-.5)*.12,c=s.e-3.6),ed.x.to(d),ed.e.to(c),o.reducedMotion?(ed.x.set(d),ed.e.set(c)):(ed.x.step(e),ed.e.step(e)),o.motion&&(ed.clock+=e*("stage"===o.mode?1:.6));let g=ed.lampOn?ed.e.value<3:ed.e.value<1.5;if(g!==ed.lampOn&&(ed.lampOn=g,ed.lampFrom=ed.lamp,ed.lampT=0,g&&"stage"===o.mode&&!o.reducedMotion&&ep.current?.strike()),ed.lampT+=e,o.reducedMotion)ed.lamp=+!!ed.lampOn;else{let e=ed.lampFrom*Math.exp(-(7*ed.lampT));ed.lamp=ed.lampOn?Math.max(function(e){if(e<.05)return .75;if(e<.11)return .08;if(e<.17)return .55;if(e<.24)return .14;let t=Math.min(1,(e-.24)/.75);return .38+.62*(1-(1-t)*(1-t)*(1-t))}(ed.lampT),e):e<.002?0:e}o.motion?ed.beam=(ed.beam+2*e*Math.PI/9)%(2*Math.PI):o.reducedMotion&&(ed.beam=3.5);let m=ed.lampOn?ed.lampT>1.1||o.reducedMotion:0===ed.lamp,x=o.reducedMotion?1:e;ed.paletteMix=Math.min(1,ed.paletteMix+x/.6),ed.dotMix=Math.min(1,ed.dotMix+x/.55),ed.dotMix>=1&&t.hasPrevious&&t.dropPrevious();let w="dark"===o.theme?.86:1;ed.dim=o.reducedMotion?w:(0,n.damp)(ed.dim,w,5,e);let b=ed.frame;b.time=ed.clock,b.sunX=ed.x.value,b.elevation=ed.e.value,b.lamp=ed.lamp,b.beam=ed.beam,b.tile="tile"===o.mode,b.palette=ed.colors,b.previousPalette=ed.previous,b.levels=ed.levels,b.previousLevels=ed.previousLevels,b.paletteMix=ed.paletteMix,b.dotMix=ed.dotMix,b.dim=ed.dim,t.draw(b),ea.current||(ea.current=!0,et(!0));let y=v.current;if(y){let e=ed.e.value,t=Math.round(e),a=u(e);(t!==ed.capE||a!==ed.capPhase)&&(ed.capE=t,ed.capPhase=a,y.textContent=`${a} \xb7 sun ${f(e)}`)}ep.current&&(ep.current.daylight=(0,n.smoothstep)(-6,2,ed.e.value),ep.current.night=(0,n.smoothstep)(-3,-9,ed.e.value));let P=ed.x.settled&&ed.e.settled&&ed.paletteMix>=1&&ed.dotMix>=1&&.002>Math.abs(ed.dim-w);if(!o.motion&&P&&m&&!p.pressed&&!ed.pending)return!1}),{canvasRef:eb,glRef:ey,sizeRef:eP,supported:eT}=(0,n.useWebGL2)({mode:e,maxDpr:eo,attributes:{alpha:!0,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{eu.current=e;let t=null;try{t=new x(e)}catch(e){console.error(e);return}return ec.current=t,ew(),()=>{t?.dispose(),ec.current=null,ea.current=!1,et(!1)}},onResize:()=>ew()});(0,a.useEffect)(()=>(ef.current=!0,()=>{ef.current=!1;let e=eu.current;e&&window.setTimeout(()=>{let t=e.canvas,a=t instanceof HTMLCanvasElement&&t.isConnected;ef.current||a||e.isContextLost()||(e.getExtension("WEBGL_lose_context")?.loseContext(),t instanceof HTMLCanvasElement&&(t.width=0,t.height=0),eu.current===e&&(eu.current=null))},0)}),[]);let ek=(0,a.useCallback)(()=>{let e=ev.current,t="stage"===e.mode&&eg.current&&e.active&&e.motion&&!e.muted,a=ep.current??=new w;if(t){let e=(0,i.getAudio)();e&&!a.playing&&(a.start(e),ed.noted||(ed.noted=!0,$(!0),K(!0),U("Sound on: the surf. The mute button turns it off."),window.clearTimeout(em.current),em.current=window.setTimeout(()=>K(!1),4200)))}else a.playing&&a.stop()},[ev,ed]);(0,a.useEffect)(()=>{ek()},[ek,s,H,D]),(0,a.useEffect)(()=>()=>{ep.current?.stop(),window.clearTimeout(em.current)},[]);let eL=(0,a.useCallback)(()=>{p&&(eg.current=!0,(0,i.ensureAudio)(),ek())},[p,ek]),eM=(e,t)=>{ed.pin.x=(0,n.clamp)(e,.03,.97),ed.pin.e=(0,n.clamp)(t,-13,27),ed.pinned=!0;let a=ed.pin.e;Y(e=>null!==e&&Math.round(e)===Math.round(a)&&u(e)===u(a)?e:a)},eA=()=>{document.activeElement!==m.current&&U(R(ed.pin.e))},eE=(0,n.usePointer)(p?m:g,{capture:p,onDown:e=>{if(p){if(!ex(e.x,e.y,6,ed.probe)){e.pressed=!1;return}if("mouse"===e.type)ed.input="pointer",ed.dragging=!0,eM(ed.probe.x,ed.probe.e),_(!0),eL();else{let t=ev.current,a=ed.pinned?ed.pin:L[t.mode][t.theme];ed.touch.mode=1,ed.touch.x0=e.x,ed.touch.y0=e.y,ed.touch.e0=a.e,ed.touch.sx=a.x}ew()}},onMove:e=>{if(p){if("mouse"===e.type)ed.input="pointer",ed.dragging&&ex(e.x,e.y,1/0,ed.probe)&&eM(ed.probe.x,ed.probe.e);else if(0!==ed.touch.mode&&e.pressed){let t=ed.touch;if(1===t.mode){let a=e.x-t.x0,o=e.y-t.y0;Math.abs(a)>8&&Math.abs(a)>1.2*Math.abs(o)&&(t.mode=2,t.x0=e.x,ed.input="pointer",_(!0))}if(2===t.mode){let a=eh.current,o=a?.win.w||300,i=a&&a.win.h?a.win.w/a.win.h:1.6,r=(0,n.clamp)(t.e0-(e.x-t.x0)/o*30,-13,27);eM(t.sx-(l(r)-l(t.e0))/(A*i),r)}}}ew()},onUp:(e,t)=>{if(ed.dragging)ex(e.x,e.y,1/0,ed.probe)&&eM(ed.probe.x,ed.probe.e),ed.dragging=!1,eA();else if(0!==ed.touch.mode){let a=ed.touch,o="pointercancel"===t.type,i=12>Math.hypot(e.x-a.x0,e.y-a.y0);1===a.mode&&!o&&i&&ex(e.x,e.y,12,ed.probe)?(ed.input="pointer",eM(ed.probe.x,ed.probe.e),_(!0),eL(),eA()):2===a.mode&&(o||eL(),eA()),a.mode=0}ew()},onLeave:()=>ew()});(0,a.useEffect)(()=>{ew()},[F,H,c,h,es,ew]);let eS=!1===eT,eR=W??L[e][c].e,eO=es??P,eq=(0,t.jsxs)("div",{className:"dusk-card","data-tile":p?void 0:"",style:{left:eO.card.x,top:eO.card.y,width:eO.card.w,height:eO.card.h,visibility:es?void 0:"hidden"},children:[(0,t.jsx)("span",{"aria-hidden":"true",className:"dusk-bevel",style:{left:eO.win.x-eO.bevel,top:eO.win.y-eO.bevel,width:eO.win.w,height:eO.win.h,borderWidth:eO.bevel}}),(0,t.jsxs)("div",{className:(0,o.cn)("dusk-window",p&&"cursor-crosshair touch-pan-y"),style:{left:eO.win.x,top:eO.win.y,width:eO.win.w,height:eO.win.h,"--dusk-ground":d(z).colors[1]},children:[(0,t.jsx)("canvas",{ref:eb,"aria-hidden":"true",className:(0,o.cn)("dusk-canvas absolute top-0 left-0",eS?"hidden":"block"),style:{width:eO.win.w,height:eO.win.h}}),eS||!ee?(0,t.jsx)(C,{palette:z}):null]}),eO.caption?(0,t.jsxs)("div",{"aria-hidden":"true",className:"dusk-caption absolute flex items-center justify-between gap-3 text-[11.5px] leading-none tracking-[0.01em] whitespace-nowrap select-none",style:{left:eO.win.x+1,right:eO.matSide+1,top:eO.win.y+eO.win.h,height:eO.caption},children:[(0,t.jsx)("span",{children:eO.card.w<440?"Last light":"Last light, the lighthouse on the point"}),(0,t.jsx)("span",{ref:v,className:"tabular-nums",children:eS?`${u(4)} \xb7 sun ${f(4)}`:null})]}):null,p?(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute -inset-[5px] rounded-[7px] opacity-0 shadow-[0_0_0_2px_var(--foreground)] transition-opacity duration-150 group-focus-visible/surface:opacity-100"}):null]}),eC=(0,t.jsx)("style",{href:"lab-dusk",precedence:"default",children:q});if(!p)return(0,t.jsxs)("div",{ref:g,"aria-hidden":"true",className:"absolute inset-0",children:[eC,eq]});let eD=eS?"A still: this browser can't run the live scene":Z?"Sound on: the surf · the speaker mutes it":O?"Move over the sky to move the sun · drag it down into the sea for night · click to keep it":"Tap to place the sun · drag sideways to run the day into night";return(0,t.jsxs)("div",{ref:g,className:"absolute inset-0 select-none",children:[eC,(0,t.jsx)("div",{ref:m,tabIndex:eS?void 0:0,...eS?{role:"img","aria-label":"Last light: the sun low over the sea, a lighthouse on the headland"}:{role:"slider","aria-label":"Time of day: the sun over the sea by the lighthouse","aria-orientation":"vertical","aria-valuemin":-13,"aria-valuemax":27,"aria-valuenow":Math.round(eR),"aria-valuetext":R(eR),"aria-describedby":b},onKeyDown:eS?void 0:e=>{if(!p||e.altKey||e.ctrlKey||e.metaKey)return;let t="keys"===ed.input?ed.pin.x:ed.x.target,a="keys"===ed.input?ed.pin.e:ed.e.target,o=e.shiftKey,i=t,n=a;switch(e.key){case"ArrowUp":n+=o?5:1;break;case"ArrowDown":n-=o?5:1;break;case"PageUp":n+=5;break;case"PageDown":n-=5;break;case"Home":n=-13;break;case"End":n=27;break;case"ArrowLeft":i-=o?.12:.04;break;case"ArrowRight":i+=o?.12:.04;break;default:return}e.preventDefault(),e.stopPropagation(),n!==a&&"Home"!==e.key&&"End"!==e.key&&(n=Math.round(n)),eM(i,n),ed.input="keys",_(!0),eL(),ew()},className:(0,o.cn)("group/surface absolute inset-0 outline-none [-webkit-tap-highlight-color:transparent]",O?"cursor-default":""),children:eq}),(0,t.jsx)("p",{id:b,className:"sr-only",children:"A dithered print of the sea with a lighthouse on a headland. Lower the sun past the horizon and night falls: the lamp comes on and turns its beams, the cottage windows light up, the moon and the stars come out. The up and down arrows raise and lower the sun, Page Up and Page Down by five degrees, Home and End take it to the lowest and the highest. The left and right arrows move it along the horizon. With a mouse, move over the sky to move the sun, drag it into the sea for night, and click to keep it there; on a touch screen, tap to place it and drag sideways to change the hour."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:X}),(0,t.jsxs)(r.StageControls,{placement:"bottom",className:"dusk-controls",children:[(0,t.jsxs)(r.TrayRow,{children:[(0,t.jsx)(r.Tray,{label:"Palette",children:(0,t.jsx)(r.Swatches,{label:"Palette",options:E,value:z,onChange:e=>{e!==ed.palette&&(ed.previous=ed.colors,ed.previousLevels=ed.levels,ed.palette=e,ed.colors=S(e),ed.levels=d(e).levels,ed.paletteMix=+!!ev.current.reducedMotion,N(e),ew())}})}),eS?null:(0,t.jsxs)(r.Tray,{label:"Dither, motion and sound",children:[(0,t.jsx)(r.Stepper,{label:"Dot",value:F,min:1,max:6,onChange:e=>{ed.dotChanged=!0,G(e),ew()},format:e=>`${e}px`}),(0,t.jsx)(r.TrayDivider,{}),(0,t.jsx)(r.Toggle,{label:"Motion",checked:H,onChange:e=>B(e)}),(0,t.jsx)(r.TrayDivider,{}),(0,t.jsx)("span",{className:"dusk-sound relative inline-flex shrink-0","data-note":V?"":void 0,children:(0,t.jsx)(r.MuteButton,{})})]})]}),(0,t.jsx)(r.StageHint,{className:(0,o.cn)("transition-opacity duration-700",j&&!V&&"opacity-0"),children:eD})]})]})}],49732)}]);