(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,49732,e=>{"use strict";var t=e.i(43476),o=e.i(71645),a=e.i(33209),i=e.i(16442),r=e.i(37047),n=e.i(45219);function s(e){return .36+ +Math.tan(e*Math.PI/180)}let l=[0,1,1,0],c=[{id:"ink",label:"Ink",colors:["#1d2747","#efe7d6"],levels:[.1,.97,1.6,0]},{id:"sunset",label:"Sunset",colors:["#26122d","#8a2a4c","#e8663a","#ffd590"],levels:l},{id:"tide",label:"Tide",colors:["#0c2433","#2d7686","#d6ece2"],levels:l},{id:"mono",label:"Mono",colors:["#121212","#f2f1ee"],levels:[.14,.97,1.8,0]}];function u(e){return c.find(t=>t.id===e)??c[0]}function d(e){let t=e.replace("#","");return[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255]}function h(e){return e>=9?"Afternoon":e>=.8?"Golden hour":e>=-.8?"Sunset":e>=-4.5?"Dusk":e>=-8?"Blue hour":"Nightfall"}function f(e){let t=Math.round(e);return`${t<0?"−":""}${Math.abs(t)}\xb0`}var p=e.i(55171);let x=`#version 300 es
precision highp float;
precision highp int;

uniform vec2 uCells;     // dots across, dots down
uniform float uAspect;   // picture width / height
uniform float uTime;     // scene clock (stops while motion is off)
uniform vec2 uSun;       // x across the picture (0..1), elevation (degrees)
uniform float uTile;     // 1 on the small tile: fewer details
uniform float uZoom;     // > 1 looks closer (tiles)

out vec4 outColor;

const float HORIZON = 0.3600;
const float FOCAL = 1.0000;
const float CAM_H = 2.4;   // camera height above the water (m)
const float STILL = 31.4000; // the reduced-motion still's clock

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
 * window. lightR is a lit window's half size (one dot is 0.5 \xd7 gPx).
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
`,g=(e,t)=>{t.fill(0);let o=Math.min(4,e.length);for(let a=0;a<o;a++){let o=e[a];t[3*a]=o[0],t[3*a+1]=o[1],t[3*a+2]=o[2]}return t};class v{gl;scene;dither;us;ud;vao;grids=[null,null];current=0;width=0;height=0;pal=new Float32Array(12);prevPal=new Float32Array(12);constructor(e){this.gl=e,this.scene=(0,p.createProgram)(e,p.FULLSCREEN_VERTEX,x),this.dither=(0,p.createProgram)(e,p.FULLSCREEN_VERTEX,m),this.us=(0,p.uniformLocations)(e,this.scene),this.ud=(0,p.uniformLocations)(e,this.dither);const t=e.createVertexArray();if(!t)throw Error("dusk: could not allocate a vertex array");this.vao=t}needsGrid(e,t,o){let a=this.grids[this.current];return!a||this.width!==e||this.height!==t||a.cellPx!==o}setGrid(e,t,o,a){let i=this.gl,r=this.width!==e||this.height!==t;this.width=e,this.height=t,a&&!r&&this.grids[this.current]?this.current=1-this.current:this.free(1-this.current),this.free(this.current);let n=Math.ceil(e/o),s=Math.ceil(t/o),l=i.createTexture(),c=i.createFramebuffer();if(!l||!c)throw Error("dusk: could not allocate the dot grid");i.bindTexture(i.TEXTURE_2D,l),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.NEAREST),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,n,s,0,i.RGBA,i.UNSIGNED_BYTE,null),i.bindFramebuffer(i.FRAMEBUFFER,c),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,l,0),i.bindFramebuffer(i.FRAMEBUFFER,null),this.grids[this.current]={texture:l,fbo:c,cols:n,rows:s,cellPx:o,ox:Math.floor((e-n*o)/2),oy:Math.floor((t-s*o)/2)}}get hasPrevious(){return!!this.grids[1-this.current]}dropPrevious(){this.free(1-this.current)}draw(e){let t=this.gl,o=this.grids[this.current];if(!o)return;t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.bindVertexArray(this.vao),t.bindFramebuffer(t.FRAMEBUFFER,o.fbo),t.viewport(0,0,o.cols,o.rows),t.useProgram(this.scene);let a=this.us;t.uniform2f(a("uCells"),o.cols,o.rows),t.uniform1f(a("uAspect"),o.cols*o.cellPx/(o.rows*o.cellPx)),t.uniform1f(a("uTime"),e.time),t.uniform2f(a("uSun"),e.sunX,e.elevation),t.uniform1f(a("uTile"),+!!e.tile),t.uniform1f(a("uZoom"),e.tile?1.28:1),(0,p.drawFullscreen)(t),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.width,this.height),t.useProgram(this.dither);let i=this.ud,r=this.grids[1-this.current];t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,o.texture),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,(r??o).texture),t.uniform1i(i("uScene"),0),t.uniform1i(i("uPrev"),1),t.uniform2f(i("uRes"),this.width,this.height),t.uniform1f(i("uCellPx"),o.cellPx),t.uniform2f(i("uOffset"),o.ox,o.oy),t.uniform1f(i("uPrevCellPx"),(r??o).cellPx),t.uniform2f(i("uPrevOffset"),(r??o).ox,(r??o).oy),t.uniform1f(i("uDotMix"),r?e.dotMix:1),t.uniform3fv(i("uPal"),g(e.palette,this.pal)),t.uniform1i(i("uCount"),Math.min(4,e.palette.length));let n=e.levels;t.uniform4f(i("uLevels"),n[0],n[1],n[2],n[3]),t.uniform3fv(i("uPrevPal"),g(e.previousPalette,this.prevPal)),t.uniform1i(i("uPrevCount"),Math.min(4,e.previousPalette.length));let s=e.previousLevels;t.uniform4f(i("uPrevLevels"),s[0],s[1],s[2],s[3]),t.uniform1f(i("uPalMix"),e.paletteMix),t.uniform1f(i("uDim"),e.dim),(0,p.drawFullscreen)(t),t.activeTexture(t.TEXTURE0),t.bindVertexArray(null)}free(e){let t=this.grids[e];t&&(this.gl.deleteTexture(t.texture),this.gl.deleteFramebuffer(t.fbo),this.grids[e]=null)}dispose(){this.free(0),this.free(1),this.gl.deleteProgram(this.scene),this.gl.deleteProgram(this.dither),this.gl.deleteVertexArray(this.vao)}}class w{kit=null;out=null;echo=null;sides=[];timer=0;nextSwell=0;nextGull=0;side=0;daylight=1;get playing(){return!!this.out}start(e){if(this.out)return;let{ctx:t,output:o}=e;this.kit=e;let a=t.currentTime,r=t.createGain();r.gain.setValueAtTime(0,a),r.gain.linearRampToValueAtTime(.22,a+1.26),r.gain.linearRampToValueAtTime(1,a+2.8),r.connect(o),this.out=r;let n=t.createDelay(1);n.delayTime.value=.23;let s=t.createGain();s.gain.value=.28;let l=t.createGain();l.gain.value=.5;let c=t.createBiquadFilter();c.type="lowpass",c.frequency.value=2200,n.connect(c).connect(s).connect(n),c.connect(l).connect(r),this.echo={delay:n,feedback:s,wet:l};let u=(0,i.noiseBuffer)(t,4);this.sides=[-.55,.55].map((e,o)=>{let i=t.createBufferSource();i.buffer=u,i.loop=!0,i.playbackRate.value=o?.93:1;let n=t.createBiquadFilter();n.type="lowpass",n.frequency.value=380,n.Q.value=.4;let s=t.createGain();s.gain.value=.16;let l=t.createBiquadFilter();l.type="bandpass",l.frequency.value=5200,l.Q.value=.6;let c=t.createGain();c.gain.value=0;let d=r;if("function"==typeof t.createStereoPanner){let o=t.createStereoPanner();o.pan.value=e,o.connect(r),d=o}return i.connect(n).connect(s).connect(d),i.connect(l).connect(c).connect(d),i.start(a,1.7*o),{source:i,filter:n,gain:s,fizzFilter:l,fizz:c}}),this.nextSwell=a+1.4,this.nextGull=a+4+6*Math.random(),this.tick()}tick=()=>{let e=this.kit;if(!e||!this.out)return;let t=e.ctx.currentTime;for(;this.nextSwell<t+2;)this.swell(this.nextSwell),this.nextSwell+=5.8+3.2*Math.random();t>this.nextGull&&(this.daylight>.25&&.8>Math.random()&&this.gull(t+.05,this.daylight),this.nextGull=t+9+13*Math.random()),this.timer=window.setTimeout(this.tick,400)};swell(e){let t=this.sides[this.side];if(this.side=1-this.side,!t)return;let o=.16*(2.4+1.1*Math.random());t.gain.gain.setTargetAtTime(o,e,.85),t.filter.frequency.setTargetAtTime(1100+500*Math.random(),e,.8),t.gain.gain.setTargetAtTime(.16,e+1.9,1.5),t.filter.frequency.setTargetAtTime(380,e+1.9,1.7),t.fizz.gain.setTargetAtTime(.045+.025*Math.random(),e+1.5,.25),t.fizz.gain.setTargetAtTime(0,e+2.1,.9)}gull(e,t){let o=this.kit,a=this.out;if(!o||!a||!this.echo)return;let{ctx:i}=o,r=(.5>Math.random()?-1:1)*(.35+.45*Math.random()),n=a;if("function"==typeof i.createStereoPanner){let e=i.createStereoPanner();e.pan.value=r,e.connect(a),e.connect(this.echo.delay),n=e}let s=2+Math.floor(3*Math.random()),l=1180+260*Math.random(),c=.05*t;for(let t=0;t<s;t++){let o=e+t*(.2+.05*Math.random()),a=l*(1-.035*t),r=t===s-1,u=r?.32:.17,d=i.createOscillator();d.type="sawtooth",d.frequency.setValueAtTime(.72*a,o),d.frequency.exponentialRampToValueAtTime(a,o+.04),d.frequency.exponentialRampToValueAtTime(a*(r?.55:.68),o+u);let h=i.createOscillator();h.frequency.value=26;let f=i.createGain();f.gain.value=.012*a,h.connect(f).connect(d.frequency);let p=i.createBiquadFilter();p.type="bandpass",p.frequency.value=2100,p.Q.value=2.2;let x=i.createBiquadFilter();x.type="lowpass",x.frequency.value=3200;let m=i.createGain();m.gain.setValueAtTime(0,o),m.gain.linearRampToValueAtTime(c,o+.025),m.gain.setTargetAtTime(.7*c,o+.05,.06),m.gain.setTargetAtTime(0,o+u-.05,.04),d.connect(p).connect(x).connect(m).connect(n),d.start(o),h.start(o),d.stop(o+u+.3),h.stop(o+u+.3)}}stop(){let e=this.kit,t=this.out;if(window.clearTimeout(this.timer),this.timer=0,!e||!t)return;let o=this.sides,a=this.echo;this.out=null,this.sides=[],this.echo=null;let i=e.ctx.currentTime;if("function"==typeof t.gain.cancelAndHoldAtTime)t.gain.cancelAndHoldAtTime(i);else{let e=t.gain.value;t.gain.cancelScheduledValues(i),t.gain.setValueAtTime(e,i)}t.gain.setTargetAtTime(0,i,.25),window.setTimeout(()=>{for(let e of o){try{e.source.stop()}catch{}e.source.disconnect()}a?.delay.disconnect(),t.disconnect()},1400)}}function b(e){for(let t=1;t<=16;t++)if(1e-4>Math.abs(t*e-Math.round(t*e)))return t;return 1}let y=(e,t)=>{let o=b(t);return Math.max(o,Math.floor(e/o+1e-6)*o)},k={card:{x:0,y:0,w:0,h:0},win:{x:0,y:0,w:0,h:0},bevel:0,caption:0,matSide:0},P=(e,t,o)=>{let a=b(o);return Math.round((t+e)/a)*a-t};function T(e,t,o,a,i,r,n){return{x:P((o-e)/2,n.x,r),y:P(a+(i-a-t)/2,n.y,r),w:y(e,r),h:y(t,r)}}let M={tile:{light:{x:.3,e:4.6},dark:{x:.3,e:1.4}},stage:{light:{x:.3,e:4.2},dark:{x:.31,e:.2}}},E={stiffness:34,damping:11.7},A=Math.tan(56.4*Math.PI/180),R=c.map(e=>({value:e.id,label:e.label,swatch:function(e){let t=e.colors;if(t.length<=2)return`linear-gradient(135deg, ${t[t.length-1]} 0 50%, ${t[0]} 50% 100%)`;let o=[...t].reverse(),a=100/o.length;return`linear-gradient(180deg, ${o.map((e,t)=>`${e} ${t*a}% ${(t+1)*a}%`).join(", ")})`}(e)})),L=e=>u(e).colors.map(d),S=e=>`${h(e)}, sun ${f(e)}`,C=`url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.32 0 0 0 0 0.27 0 0 0 0 0.2 0 0 0 0.11 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>")}")`,j=`
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
  background-image: ${C};
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
`;function O({palette:e}){let o=u(e).colors,a=o.length,i=o[a-1],r=o[0],n=a>2?[o[1],o[a-2],o[a-2]]:[r,r,i],l=(1-s(4))*100;return(0,t.jsxs)("svg",{"aria-hidden":"true",className:"absolute inset-0 size-full",viewBox:"0 0 160 100",preserveAspectRatio:"xMidYMid slice",children:[(0,t.jsx)("rect",{width:"160",height:64,fill:n[0]}),(0,t.jsx)("rect",{y:28.8,width:"160",height:35.2,fill:n[1],opacity:+(a>2)}),(0,t.jsx)("rect",{y:51.2,width:"160",height:12.8,fill:a>2?i:n[2],opacity:.55*(a>2)}),(0,t.jsx)("circle",{cx:"48",cy:l,r:"5.2",fill:i}),(0,t.jsx)("rect",{y:64,width:"160",height:36,fill:a>2?o[1]:r}),(0,t.jsx)("rect",{x:"45",y:65.5,width:"6",height:"1.4",fill:i}),(0,t.jsx)("rect",{x:"46",y:69,width:"4",height:"1.2",fill:i}),(0,t.jsx)("rect",{x:"44",y:73.5,width:"8",height:"1.4",fill:i}),(0,t.jsx)("path",{fill:r,d:"M96 64 q6 -3 12 -3 h52 v3 Z"}),(0,t.jsx)("path",{fill:r,d:`M109 ${61.4} h10 v-2.4 l-5 -1.8 l-5 1.8 Z`}),(0,t.jsx)("rect",{x:"119.5",y:33,width:"4",height:"28.6",fill:r}),(0,t.jsx)("rect",{x:"119.2",y:31.799999999999997,width:"0.9",height:"1.4",fill:r}),(0,t.jsx)("rect",{x:"121.05",y:31.799999999999997,width:"0.9",height:"1.4",fill:r}),(0,t.jsx)("rect",{x:"122.9",y:31.799999999999997,width:"0.9",height:"1.4",fill:r}),(0,t.jsx)("rect",{x:"120.65",y:26.5,width:"1.7",height:"6.6",fill:r}),(0,t.jsx)("circle",{cx:"121.5",cy:26.6,r:"0.75",fill:r}),(0,t.jsx)("rect",{x:"121.35",y:22.5,width:"0.3",height:"4",fill:r}),(0,t.jsx)("circle",{cx:"121.5",cy:25,r:"0.45",fill:r}),(0,t.jsx)("circle",{cx:"121.5",cy:23.700000000000003,r:"0.35",fill:r})]})}e.s(["default",0,function({mode:e,active:l,reducedMotion:c,theme:d}){let p="stage"===e,x=(0,o.useRef)(null),m=(0,o.useRef)(null),g=(0,o.useRef)(null),b=(0,o.useId)(),P=(0,r.useElementSize)(x),C=(0,r.useFinePointer)(),D=(0,i.useMuted)(),[F,q]=(0,o.useState)("sunset"),[z,H]=(0,o.useState)(()=>p&&window.innerWidth<640?1:2),[N,B]=(0,o.useState)(null),_=p?N??!c:!c,[I,G]=(0,o.useState)(!1),[U,X]=(0,o.useState)(""),[W,V]=(0,o.useState)(!1),[Z,$]=(0,o.useState)(!1),[K,Q]=(0,o.useState)(null),[Y,J]=(0,o.useState)(0),[ee,et]=(0,o.useState)(!1),eo=(0,o.useRef)(!1),ea=p?3:2,ei=Math.max(1,Math.min(ea,window.devicePixelRatio||1));(0,r.useIsoLayoutEffect)(()=>{if(!p)return;let e=x.current?.querySelector(".dusk-controls");if(!e)return;let t=()=>{let t=x.current?.getBoundingClientRect();if(!t)return;let o=t.height;for(let a of Array.from(e.children)){let e=a.getBoundingClientRect();e.height>0&&(o=Math.min(o,e.top-t.top))}J(o)};t();let o=new ResizeObserver(t);return o.observe(e),x.current&&o.observe(x.current),()=>o.disconnect()},[p]);let[er,en]=(0,o.useState)({x:0,y:0}),es=(0,o.useCallback)(()=>{let e=x.current;if(!e)return;let t=e.getBoundingClientRect(),o=t.left+window.scrollX,a=t.top+window.scrollY;en(e=>.01>Math.abs(e.x-o)&&.01>Math.abs(e.y-a)?e:{x:o,y:a})},[]);(0,r.useIsoLayoutEffect)(()=>{es()},[es,P.width,P.height]),(0,o.useEffect)(()=>{let e=0,t=!0,o=()=>{!e&&t&&(e=requestAnimationFrame(()=>(e=0,es())))},a=new ResizeObserver(o);return a.observe(document.body),window.addEventListener("resize",o),document.addEventListener("transitionend",o,!0),document.addEventListener("animationend",o,!0),document.fonts?.ready.then(o),()=>{t=!1,cancelAnimationFrame(e),a.disconnect(),window.removeEventListener("resize",o),document.removeEventListener("transitionend",o,!0),document.removeEventListener("animationend",o,!0)}},[es]);let el=(0,o.useMemo)(()=>P.width&&P.height?p?function(e,t,o,a){let i=e<640,n=i?14:30,s=Math.max(n+120,t-(i?14:24)),l=e-2*(i?14:48),c=s-n;if(l<80||c<80)return null;let u=Math.round((0,r.clamp)(.038*Math.min(l,1.6*c),12,24)),d=i?30:36,h=l-2*u,f=c-u-d,p=(0,r.clamp)(h/f,1.12,1.72),x=Math.min(h,Math.max(720,.86*l)),m=x/p;m>f&&(x=(m=f)*p),x=y(x,o),m=y(m,o);let g=y(u,o),v=y(d,o);return{card:T(x+2*g,m+g+v,e,n,s,o,a),win:{x:g,y:g,w:x,h:m},bevel:i?2:3,caption:v,matSide:g}}(P.width,Y||P.height-96,ei,er):function(e,t,o,a){if(e<40||t<30)return null;let i=e>=190?5:4,n=i+2,s=.76*e-2*i,l=.74*t-i-n,c=(0,r.clamp)(s/l,1.4,2);s/l>c?s=l*c:l=s/c,s=y(s,o),l=y(l,o);let u=y(i,o);return{card:T(s+2*u,l+u+y(n,o),e,0,t,o,a),win:{x:u,y:u,w:s,h:l},bevel:1,caption:0,matSide:u}}(P.width,P.height,ei,er):null,[p,P.width,P.height,Y,ei,er]),ec=(0,r.useLatest)(el),[eu]=(0,o.useState)(()=>{let t=M[e][d],o=L("sunset"),a=u("sunset").levels,i={time:31.4,sunX:t.x,elevation:t.e,tile:"tile"===e,palette:o,previousPalette:o,levels:a,previousLevels:a,paletteMix:1,dotMix:1,dim:1};return{x:new r.Spring(t.x,E),e:new r.Spring(t.e,E),pin:{x:t.x,e:t.e},pinned:!1,input:"rest",dragging:!1,probe:{x:0,e:0,v:0},preview:{x:t.x,e:t.e},previewing:!1,enteredAt:-1,fast:!1,lingerSince:-1,sunk:!1,pending:!1,touch:{mode:0,x0:0,y0:0,e0:0,sx:0},clock:31.4,acc:0,palette:"sunset",colors:o,previous:o,levels:a,previousLevels:a,paletteMix:1,dotMix:1,dotChanged:!1,dim:"dark"===d?.86:1,capE:NaN,capPhase:"",noted:!1,frame:i}}),ed=(0,o.useRef)(null),eh=(0,o.useRef)(null),ef=(0,o.useRef)(!1),ep=(0,o.useRef)(null),ex=(0,o.useRef)(!1),em=(0,o.useRef)(0),eg=(0,r.useLatest)({dot:p?z:1,motion:_,reducedMotion:c,theme:d,mode:e,active:l,muted:D}),ev=(0,o.useCallback)((e,t,o,a)=>{let i=ec.current;if(!i||!i.win.w||!i.win.h)return!1;let n=i.card.x+i.win.x,s=i.card.y+i.win.y;return!(e<n-o)&&!(e>n+i.win.w+o)&&!(t<s-o)&&!(t>s+i.win.h+o)&&(a.v=1-(t-s)/i.win.h,a.x=(0,r.clamp)((e-n)/i.win.w,.03,.97),a.e=(0,r.clamp)(180*Math.atan((a.v-.36)/1)/Math.PI,-13,27),!0)},[ec]),ew=(0,r.useFrame)(l,e=>{let t=ed.current,o=eb.current,a=eg.current;if(!t||!o||!ey.current)return;let i=o.width,n=o.height;if(i<4||n<4)return;if("tile"===a.mode){if(eu.acc+=e,eu.acc<1/30-.002)return;e=eu.acc,eu.acc=0}let s=Math.max(1,Math.round(a.dot*ek.current.dpr));if(t.needsGrid(i,n,s)){let e=eu.dotChanged&&!a.reducedMotion;t.setGrid(i,n,s,e),eu.dotMix=+!e,eu.dotChanged=!1}let l=M[a.mode][a.theme],c=eu.pinned?eu.pin:l,u=c.x,d=c.e,p=eR.current;"stage"===a.mode?((e,t,o)=>{let a=eu.probe;if(e.pressed||!e.inside||"mouse"!==e.type||"pointer"!==eu.input||!ev(e.x,e.y,0,a))return eu.previewing=!1,eu.enteredAt=-1,eu.fast=!1,eu.lingerSince=-1,eu.sunk=!1,eu.pending=!1,!1;eu.enteredAt<0&&(eu.enteredAt=o);let i=o-e.time>90?0:Math.hypot(e.vx,e.vy);i>600?eu.fast=!0:i<380&&(eu.fast=!1);let r=o-eu.enteredAt>=200;if(eu.pending=!r||eu.fast,!r||eu.fast||a.v<.12)return eu.previewing;let n=a.e,s=Math.min(0,t);return n<s?(i<160?eu.lingerSince<0&&(eu.lingerSince=o):eu.sunk||(eu.lingerSince=-1),!eu.sunk&&eu.lingerSince>=0&&o-eu.lingerSince>=380&&(eu.sunk=!0),eu.sunk||(n=s,eu.pending=!0)):(eu.sunk=!1,eu.lingerSince=-1),eu.preview.x=a.x,eu.preview.e=n,eu.previewing=!0,!0})(p,c.e,performance.now())&&(u=eu.preview.x,d=eu.preview.e):p.inside&&"mouse"===p.type&&!a.reducedMotion&&(u=l.x+(p.nx-.5)*.12,d=l.e-3.6),eu.x.to(u),eu.e.to(d),a.reducedMotion?(eu.x.set(u),eu.e.set(d)):(eu.x.step(e),eu.e.step(e)),a.motion&&(eu.clock+=e*("stage"===a.mode?1:.6));let x=a.reducedMotion?1:e;eu.paletteMix=Math.min(1,eu.paletteMix+x/.6),eu.dotMix=Math.min(1,eu.dotMix+x/.55),eu.dotMix>=1&&t.hasPrevious&&t.dropPrevious();let m="dark"===a.theme?.86:1;eu.dim=a.reducedMotion?m:(0,r.damp)(eu.dim,m,5,e);let v=eu.frame;v.time=eu.clock,v.sunX=eu.x.value,v.elevation=eu.e.value,v.tile="tile"===a.mode,v.palette=eu.colors,v.previousPalette=eu.previous,v.levels=eu.levels,v.previousLevels=eu.previousLevels,v.paletteMix=eu.paletteMix,v.dotMix=eu.dotMix,v.dim=eu.dim,t.draw(v),eo.current||(eo.current=!0,et(!0));let w=g.current;if(w){let e=eu.e.value,t=Math.round(e),o=h(e);(t!==eu.capE||o!==eu.capPhase)&&(eu.capE=t,eu.capPhase=o,w.textContent=`${o} \xb7 sun ${f(e)}`)}ep.current&&(ep.current.daylight=(0,r.smoothstep)(-6,2,eu.e.value));let b=eu.x.settled&&eu.e.settled&&eu.paletteMix>=1&&eu.dotMix>=1&&.002>Math.abs(eu.dim-m);if(!a.motion&&b&&!p.pressed&&!eu.pending)return!1}),{canvasRef:eb,glRef:ey,sizeRef:ek,supported:eP}=(0,r.useWebGL2)({mode:e,maxDpr:ea,attributes:{alpha:!0,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{eh.current=e;let t=null;try{t=new v(e)}catch(e){console.error(e);return}return ed.current=t,ew(),()=>{t?.dispose(),ed.current=null,eo.current=!1,et(!1)}},onResize:()=>ew()});(0,o.useEffect)(()=>(ef.current=!0,()=>{ef.current=!1;let e=eh.current;e&&window.setTimeout(()=>{let t=e.canvas,o=t instanceof HTMLCanvasElement&&t.isConnected;ef.current||o||e.isContextLost()||(e.getExtension("WEBGL_lose_context")?.loseContext(),t instanceof HTMLCanvasElement&&(t.width=0,t.height=0),eh.current===e&&(eh.current=null))},0)}),[]);let eT=(0,o.useCallback)(()=>{let e=eg.current,t="stage"===e.mode&&ex.current&&e.active&&e.motion&&!e.muted,o=ep.current??=new w;if(t){let e=(0,i.getAudio)();e&&!o.playing&&(o.start(e),eu.noted||(eu.noted=!0,$(!0),V(!0),X("Sound on: the surf. The mute button turns it off."),window.clearTimeout(em.current),em.current=window.setTimeout(()=>V(!1),4200)))}else o.playing&&o.stop()},[eg,eu]);(0,o.useEffect)(()=>{eT()},[eT,l,_,D]),(0,o.useEffect)(()=>()=>{ep.current?.stop(),window.clearTimeout(em.current)},[]);let eM=(0,o.useCallback)(()=>{p&&(ex.current=!0,(0,i.ensureAudio)(),eT())},[p,eT]),eE=(e,t)=>{eu.pin.x=(0,r.clamp)(e,.03,.97),eu.pin.e=(0,r.clamp)(t,-13,27),eu.pinned=!0;let o=eu.pin.e;Q(e=>null!==e&&Math.round(e)===Math.round(o)&&h(e)===h(o)?e:o)},eA=()=>{document.activeElement!==m.current&&X(S(eu.pin.e))},eR=(0,r.usePointer)(p?m:x,{capture:p,onDown:e=>{if(p){if(!ev(e.x,e.y,6,eu.probe)){e.pressed=!1;return}if("mouse"===e.type)eu.input="pointer",eu.dragging=!0,eE(eu.probe.x,eu.probe.e),G(!0),eM();else{let t=eg.current,o=eu.pinned?eu.pin:M[t.mode][t.theme];eu.touch.mode=1,eu.touch.x0=e.x,eu.touch.y0=e.y,eu.touch.e0=o.e,eu.touch.sx=o.x}ew()}},onMove:e=>{if(p){if("mouse"===e.type)eu.input="pointer",eu.dragging&&ev(e.x,e.y,1/0,eu.probe)&&eE(eu.probe.x,eu.probe.e);else if(0!==eu.touch.mode&&e.pressed){let t=eu.touch;if(1===t.mode){let o=e.x-t.x0,a=e.y-t.y0;Math.abs(o)>8&&Math.abs(o)>1.2*Math.abs(a)&&(t.mode=2,t.x0=e.x,eu.input="pointer",G(!0))}if(2===t.mode){let o=ec.current,a=o?.win.w||300,i=o&&o.win.h?o.win.w/o.win.h:1.6,n=(0,r.clamp)(t.e0-(e.x-t.x0)/a*30,-13,27);eE(t.sx-(s(n)-s(t.e0))/(A*i),n)}}}ew()},onUp:(e,t)=>{if(eu.dragging)ev(e.x,e.y,1/0,eu.probe)&&eE(eu.probe.x,eu.probe.e),eu.dragging=!1,eA();else if(0!==eu.touch.mode){let o=eu.touch,a="pointercancel"===t.type,i=12>Math.hypot(e.x-o.x0,e.y-o.y0);1===o.mode&&!a&&i&&ev(e.x,e.y,12,eu.probe)?(eu.input="pointer",eE(eu.probe.x,eu.probe.e),G(!0),eM(),eA()):2===o.mode&&(a||eM(),eA()),o.mode=0}ew()},onLeave:()=>ew()});(0,o.useEffect)(()=>{ew()},[z,_,d,c,el,ew]);let eL=!1===eP,eS=K??M[e][d].e,eC=el??k,ej=(0,t.jsxs)("div",{className:"dusk-card","data-tile":p?void 0:"",style:{left:eC.card.x,top:eC.card.y,width:eC.card.w,height:eC.card.h,visibility:el?void 0:"hidden"},children:[(0,t.jsx)("span",{"aria-hidden":"true",className:"dusk-bevel",style:{left:eC.win.x-eC.bevel,top:eC.win.y-eC.bevel,width:eC.win.w,height:eC.win.h,borderWidth:eC.bevel}}),(0,t.jsxs)("div",{className:(0,a.cn)("dusk-window",p&&"cursor-crosshair touch-pan-y"),style:{left:eC.win.x,top:eC.win.y,width:eC.win.w,height:eC.win.h,"--dusk-ground":u(F).colors[1]},children:[(0,t.jsx)("canvas",{ref:eb,"aria-hidden":"true",className:(0,a.cn)("dusk-canvas absolute top-0 left-0",eL?"hidden":"block"),style:{width:eC.win.w,height:eC.win.h}}),eL||!ee?(0,t.jsx)(O,{palette:F}):null]}),eC.caption?(0,t.jsxs)("div",{"aria-hidden":"true",className:"dusk-caption absolute flex items-center justify-between gap-3 text-[11.5px] leading-none tracking-[0.01em] whitespace-nowrap select-none",style:{left:eC.win.x+1,right:eC.matSide+1,top:eC.win.y+eC.win.h,height:eC.caption},children:[(0,t.jsx)("span",{children:eC.card.w<440?"Casablanca":"Casablanca, the Atlantic"}),(0,t.jsx)("span",{ref:g,className:"tabular-nums",children:eL?`${h(4)} \xb7 sun ${f(4)}`:null})]}):null,p?(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute -inset-[5px] rounded-[7px] opacity-0 shadow-[0_0_0_2px_var(--foreground)] transition-opacity duration-150 group-focus-visible/surface:opacity-100"}):null]}),eO=(0,t.jsx)("style",{href:"lab-dusk",precedence:"default",children:j});if(!p)return(0,t.jsxs)("div",{ref:x,"aria-hidden":"true",className:"absolute inset-0",children:[eO,ej]});let eD=eL?"A still: this browser can't run the live scene":Z?"Sound on: the surf · the speaker mutes it":C?"Move over the sky to move the sun · rest on the sea to let it set · click to keep it":"Tap to place the sun · drag sideways to change the hour";return(0,t.jsxs)("div",{ref:x,className:"absolute inset-0 select-none",children:[eO,(0,t.jsx)("div",{ref:m,tabIndex:eL?void 0:0,...eL?{role:"img","aria-label":"Casablanca at dusk: the sun over the Atlantic, a minaret on the shore"}:{role:"slider","aria-label":"Time of day: the sun over the Atlantic at Casablanca","aria-orientation":"vertical","aria-valuemin":-13,"aria-valuemax":27,"aria-valuenow":Math.round(eS),"aria-valuetext":S(eS),"aria-describedby":b},onKeyDown:eL?void 0:e=>{if(!p||e.altKey||e.ctrlKey||e.metaKey)return;let t="keys"===eu.input?eu.pin.x:eu.x.target,o="keys"===eu.input?eu.pin.e:eu.e.target,a=e.shiftKey,i=t,r=o;switch(e.key){case"ArrowUp":r+=a?5:1;break;case"ArrowDown":r-=a?5:1;break;case"PageUp":r+=5;break;case"PageDown":r-=5;break;case"Home":r=-13;break;case"End":r=27;break;case"ArrowLeft":i-=a?.12:.04;break;case"ArrowRight":i+=a?.12:.04;break;default:return}e.preventDefault(),e.stopPropagation(),r!==o&&"Home"!==e.key&&"End"!==e.key&&(r=Math.round(r)),eE(i,r),eu.input="keys",G(!0),eM(),ew()},className:(0,a.cn)("group/surface absolute inset-0 outline-none [-webkit-tap-highlight-color:transparent]",C?"cursor-default":""),children:ej}),(0,t.jsx)("p",{id:b,className:"sr-only",children:"A dithered print of the Atlantic at Casablanca, a minaret on the shore. The up and down arrows raise and lower the sun, Page Up and Page Down by five degrees, Home and End take it to the lowest and the highest. The left and right arrows move it along the horizon. With a mouse, move over the sky to move the sun and click to keep it there; on a touch screen, tap to place it and drag sideways to change the hour."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:U}),(0,t.jsxs)(n.StageControls,{placement:"bottom",className:"dusk-controls",children:[(0,t.jsxs)(n.TrayRow,{children:[(0,t.jsx)(n.Tray,{label:"Palette",children:(0,t.jsx)(n.Swatches,{label:"Palette",options:R,value:F,onChange:e=>{e!==eu.palette&&(eu.previous=eu.colors,eu.previousLevels=eu.levels,eu.palette=e,eu.colors=L(e),eu.levels=u(e).levels,eu.paletteMix=+!!eg.current.reducedMotion,q(e),ew())}})}),eL?null:(0,t.jsxs)(n.Tray,{label:"Dither, motion and sound",children:[(0,t.jsx)(n.Stepper,{label:"Dot",value:z,min:1,max:6,onChange:e=>{eu.dotChanged=!0,H(e),ew()},format:e=>`${e}px`}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.Toggle,{label:"Motion",checked:_,onChange:e=>B(e)}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)("span",{className:"dusk-sound relative inline-flex shrink-0","data-note":W?"":void 0,children:(0,t.jsx)(n.MuteButton,{})})]})]}),(0,t.jsx)(n.StageHint,{className:(0,a.cn)("transition-opacity duration-700",I&&!W&&"opacity-0"),children:eD})]})]})}],49732)}]);