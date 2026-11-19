// GLSL for the rain window (WebGL2). The passes, in order (renderer.ts):
//
// 1. SCENE: the street outside, three times into small HDR targets that
//    cover the glass and a margin around it: crisp (what each drop focuses,
//    mipmapped), out of focus (the view through clear glass: the eye is on
//    the pane, so every light is a disc), and very soft (through fog).
//    Each target is the base pass (sky, towers, facades, the wet road and
//    its reflections, posts, cars) and then the lights as instanced quads,
//    added on top.
// 2. FIELD: every bead and drop, outside (R, G) and inside (B, A) the
//    glass, as a metaball kernel summed into one float target: R/B is the
//    field, G/A the field weighted by each kernel's radius, so the
//    composite can tell how big the drop under a pixel is (its slope, and so
//    its lens, then doesn't depend on its size). Where two kernels overlap
//    the field rises between them: drops bridge before they merge.
// 3. FOG: the condensation map; a fade pass (the fog creeping back) and the
//    stamps (wipes, drip lanes, breath).
// 4. COMPOSITE: the wall, the painted woodwork (a height field lit by the
//    room's lamp and, on its faces toward the glass, by the street), the
//    sill and the brass handle; on the glass, the outside drops as lenses
//    (each shows the street upside down and in focus), the fog over them
//    (thick at the bottom, thin at the top; wiped where you wiped, creeping
//    back as a grainy frost), the condensation's own beads and drips, the
//    room's faint reflection, the lightning.

export const QUAD_VS = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const NOISE = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
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
    p = p * 2.03 + vec2(17.1, 9.7);
    a *= 0.5;
  }
  return s;
}
`;

/* ---------------------------------------------------------------------- */
/* 1. the street                                                           */
/* ---------------------------------------------------------------------- */

export const SCENE_BASE_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 outColor;

uniform vec4 uDomain;   // scene x0, y0, w, h covered by this target
uniform float uBlur;    // edge softness, scene units
uniform float uNight;
uniform float uFlash;
uniform float uFlashX;
uniform vec2 uPar;
uniform vec4 uB[20];    // x0, x1, top, tone
uniform vec4 uG[20];    // column spacing, first column, window w, window h
uniform float uF[20];   // floor height
uniform int uBN;
uniform vec4 uAwn[2];
uniform vec4 uLamp[10]; // x, head y, LED?, -
uniform int uLampN;
uniform vec3 uTower;    // x, top, half width
uniform vec2 uTraffic;

const float BASE = 0.2;
const float CURB = 0.245;
${NOISE}

float band(float x, float a, float b, float s) {
  return smoothstep(a - s, a + s, x) * (1.0 - smoothstep(b - s, b + s, x));
}
float box(vec2 p, vec2 a, vec2 b, float s) {
  return band(p.x, a.x, b.x, s) * band(p.y, a.y, b.y, s);
}

vec3 sky(vec2 s) {
  float h = clamp((BASE - s.y) / 0.85, 0.0, 1.0);
  vec3 top = mix(vec3(0.058, 0.078, 0.14), vec3(0.005, 0.007, 0.016), uNight);
  vec3 low = mix(vec3(0.14, 0.14, 0.18), vec3(0.022, 0.019, 0.03), uNight);
  vec3 glow = mix(vec3(0.17, 0.1, 0.065), vec3(0.08, 0.036, 0.022), uNight);
  vec3 c = mix(low, top, smoothstep(0.0, 0.95, h));
  c += glow * exp(-h * 3.2);
  // low rain clouds, lit from below by the town
  float cl = fbm(vec2(s.x * 1.4, s.y * 3.0));
  c *= 0.72 + 0.6 * cl;
  // lightning inside the clouds
  float near = exp(-abs(s.x - uFlashX) * 1.2);
  c += uFlash * vec3(0.62, 0.66, 0.85) * (0.25 + 1.4 * cl * cl) * (0.45 + 0.9 * near) * (0.35 + h);
  return c;
}

/** The towers beyond the street: blocks of haze with a few lit floors. */
vec3 towers(vec2 s, vec3 base, float b) {
  vec2 q = s - uPar * 0.35;
  float cell = floor(q.x / 0.085);
  float hx = hash12(vec2(cell, 3.0));
  float top = -0.04 - 0.26 * hx * hx - 0.05 * hash12(vec2(cell, 7.0));
  float x0 = cell * 0.085 + 0.01 * hash12(vec2(cell, 11.0));
  float x1 = (cell + 1.0) * 0.085 - 0.01 * hash12(vec2(cell, 13.0));
  float cov = band(q.x, x0, x1, b) * smoothstep(top - b, top + b, q.y);
  // the tall one with the beacon
  float t = band(q.x, uTower.x - uTower.z, uTower.x + uTower.z, b) * smoothstep(uTower.y - b, uTower.y + b, q.y);
  cov = max(cov, t);
  vec3 haze = mix(vec3(0.13, 0.14, 0.19), vec3(0.016, 0.015, 0.024), uNight);
  vec3 c = mix(base, haze, cov * 0.85);
  // a few lit windows, far away
  vec2 g = floor(q / vec2(0.016, 0.022));
  float lit = step(0.86, hash12(g + cell * 0.37)) * cov;
  vec2 f = fract(q / vec2(0.016, 0.022));
  float w = band(f.x, 0.3, 0.7, 0.1) * band(f.y, 0.35, 0.7, 0.1);
  c += lit * w * vec3(1.0, 0.7, 0.4) * mix(0.25, 0.5, uNight) * smoothstep(0.03, 0.006, b);
  return c;
}

/** The facades across the street (and their ground floors, awnings, posts, cars). */
vec3 street(vec2 s, float b) {
  vec3 c = sky(s);
  c = towers(s, c, b);
  vec2 q = s - uPar * 0.75;
  vec3 facadeDay = vec3(0.085, 0.09, 0.112);
  vec3 facadeNight = vec3(0.011, 0.0105, 0.014);
  vec3 lampTint = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uLampN) break;
    vec4 L = uLamp[i];
    vec2 d = (s - vec2(L.x + uPar.x, 0.03)) / vec2(0.3, 0.2);
    vec3 lc = L.z > 0.5 ? vec3(1.0, 0.8, 0.58) : vec3(1.0, 0.52, 0.18);
    lampTint += lc * exp(-dot(d, d));
  }
  float best = 0.0;
  vec3 facade = c;
  for (int i = 0; i < 20; i++) {
    if (i >= uBN) break;
    vec4 B = uB[i];
    float cov = band(q.x, B.x, B.y, b) * smoothstep(B.z - b, B.z + b, q.y) * (1.0 - smoothstep(BASE - b, BASE + b, q.y));
    if (cov <= best) continue;
    best = cov;
    vec3 f = mix(facadeDay, facadeNight, uNight) * B.w;
    // the cornice catches the light; floors are faintly banded
    f *= 1.0 + 0.45 * band(q.y, B.z, B.z + 0.012, b * 0.5);
    vec4 G = uG[i];
    float fh = uF[i];
    // unlit windows: dark glass with a little sky in it
    float col = floor((q.x - G.y) / G.x + 0.5);
    float cx = G.y + col * G.x;
    float row = floor((0.09 - q.y) / fh);
    float cy = 0.09 - fh * (row + 0.5);
    float inside = band(q.x, cx - G.z * 0.5, cx + G.z * 0.5, b) * band(q.y, cy - G.w * 0.5, cy + G.w * 0.5, b);
    inside *= step(0.0, row) * step(col, (B.y - G.y) / G.x) * step(0.0, col) * step(B.z + 0.022, cy - G.w * 0.5);
    vec3 glass = mix(sky(vec2(q.x, -0.3)) * 0.5, vec3(0.006, 0.006, 0.01), uNight * 0.6);
    f = mix(f, glass, inside * 0.85);
    // the ground floor: shopfront frames and doors, darker
    float ground = smoothstep(0.088 - b, 0.088 + b, q.y);
    f = mix(f, f * 0.55, ground);
    // lamplight on the walls, and the lightning
    f += f * lampTint * 2.2;
    f += uFlash * vec3(0.05, 0.055, 0.07) * (1.0 - ground * 0.6);
    facade = f;
  }
  c = mix(c, facade, best);
  // awnings over the shop and the café
  for (int i = 0; i < 2; i++) {
    vec4 A = uAwn[i];
    if (A.y <= A.x) continue;
    float a = box(q, A.xz, A.yw, b);
    vec3 cloth = i == 0 ? vec3(0.03, 0.06, 0.045) : vec3(0.07, 0.025, 0.02);
    cloth = mix(cloth, cloth * 0.25, uNight) + vec3(0.12, 0.07, 0.03) * 0.25;
    c = mix(c, cloth, a);
  }
  // the pavement, wet
  vec2 p = s - uPar;
  float walk = band(p.y, BASE, CURB, b);
  vec3 pave = mix(vec3(0.06, 0.062, 0.075), vec3(0.012, 0.011, 0.013), uNight);
  pave += lampTint * vec3(0.06, 0.04, 0.025) * 1.4;
  c = mix(c, pave, walk);
  // streetlamp posts and their heads
  for (int i = 0; i < 10; i++) {
    if (i >= uLampN) break;
    vec4 L = uLamp[i];
    float x = L.x + uPar.x;
    float post = band(s.x, x - 0.0035, x + 0.0035, b) * band(s.y, L.y + uPar.y, CURB - 0.003 + uPar.y, b);
    float head = box(s, vec2(x - 0.014, L.y - 0.006 + uPar.y), vec2(x + 0.014, L.y + 0.004 + uPar.y), b);
    c = mix(c, vec3(0.008, 0.008, 0.01), max(post, head) * 0.95);
  }
  // the traffic light
  {
    float x = uTraffic.x + uPar.x;
    float post = band(s.x, x - 0.003, x + 0.003, b) * band(s.y, uTraffic.y + uPar.y, CURB + uPar.y, b);
    float head = box(s, vec2(x - 0.009, uTraffic.y - 0.008 + uPar.y), vec2(x + 0.009, uTraffic.y + 0.05 + uPar.y), b);
    c = mix(c, vec3(0.006), max(post, head));
  }
  return c;
}

vec3 scene(vec2 s, float b) {
  vec2 p = s - uPar;
  if (p.y < CURB) return street(s, b);
  // the road: wet asphalt, mirroring the street in long broken streaks
  float d = p.y - CURB;
  vec3 road = mix(vec3(0.03, 0.032, 0.04), vec3(0.006, 0.006, 0.008), uNight);
  float ripple = vnoise(vec2(s.x * 90.0, s.y * 22.0)) - 0.5;
  vec2 m = vec2(s.x + ripple * 0.012 * (0.3 + d * 3.0), CURB - d * 1.25 + uPar.y);
  vec3 refl = street(m, b + d * 0.08);
  vec3 c = road + refl * (0.42 - 0.22 * smoothstep(0.0, 0.3, d));
  // the lane line, a little shine of paint
  float dash = step(0.5, fract(p.x * 3.5)) * band(p.y, 0.343, 0.349, b);
  c += dash * mix(vec3(0.06), vec3(0.02), uNight);
  // the kerb's edge
  c += band(p.y, CURB, CURB + 0.004, b) * mix(vec3(0.05), vec3(0.012), uNight);
  return c;
}

void main() {
  vec2 s = uDomain.xy + vec2(vUv.x, 1.0 - vUv.y) * uDomain.zw;
  outColor = vec4(scene(s, uBlur), 1.0);
}
`;


/** The cars' dark bodies, laid over the street before their lights. */
export const CAR_VS = `#version 300 es
layout(location = 0) in vec4 aCar;   // x, lane y, direction, present
uniform vec4 uDomain;
uniform float uBlur;
uniform vec2 uPar;
out vec2 vO;
flat out float vDir;
void main() {
  vec2 ext = vec2(0.13, 0.06) + uBlur * 1.5;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 c = vec2(aCar.x, aCar.y - 0.03) + uPar;
  vec2 s = c + corner * ext;
  vO = s - (vec2(aCar.x, aCar.y) + uPar);
  vDir = aCar.z;
  vec2 uv = (s - uDomain.xy) / uDomain.zw;
  gl_Position = aCar.w > 0.5 ? vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}
`;

export const CAR_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vO;
flat in float vDir;
out vec4 outColor;
uniform float uBlur;
uniform float uNight;
float band(float x, float a, float b, float s) {
  return smoothstep(a - s, a + s, x) * (1.0 - smoothstep(b - s, b + s, x));
}
void main() {
  float b = uBlur + 0.002;
  vec2 o = vO;
  float body = band(o.x, -0.105, 0.105, b) * band(o.y, -0.042, 0.0, b);
  float cabin = band(o.x, -0.062 - vDir * 0.012, 0.05 - vDir * 0.012, b + 0.002) * band(o.y, -0.07, -0.04, b + 0.002);
  float shadow = band(o.x, -0.115, 0.115, b + 0.01) * band(o.y, -0.004, 0.014, b + 0.006);
  vec3 paint = mix(vec3(0.026, 0.028, 0.035), vec3(0.005), uNight);
  vec3 glass = mix(vec3(0.07, 0.075, 0.09), vec3(0.012), uNight);
  vec3 c = mix(paint, glass, cabin * (1.0 - body));
  float a = max(max(body, cabin * 0.92), shadow * 0.55) * mix(1.0, 0.6, smoothstep(0.004, 0.04, uBlur));
  if (a < 0.002) discard;
  outColor = vec4(c * (body + cabin > 0.01 ? 1.0 : 0.0), a);
}
`;

export const SCENE_LIGHTS_VS = `#version 300 es
layout(location = 0) in vec4 aRect;   // x, y, w, h
layout(location = 1) in vec4 aColor;  // r, g, b, kind
uniform vec4 uDomain;
uniform float uBlur;
uniform int uMode;      // 0 crisp, 1 out of focus, 2 fog
out vec2 vLocal;
out vec2 vHalf;
out vec3 vColor;
flat out int vKind;
void main() {
  int kind = int(aColor.w + 0.5);
  vec2 hs = aRect.zw * 0.5;
  float pad;
  if (uMode == 0) pad = kind == 1 ? 0.07 : kind == 4 ? 0.03 : kind == 2 ? 0.01 : kind == 3 ? 0.0 : 0.014;
  else if (uMode == 1) pad = uBlur * 1.3 + 0.004;
  else pad = uBlur * 2.4;
  if (kind == 3) pad += max(hs.x, hs.y);
  vec2 ext = hs + pad;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 s = aRect.xy + corner * ext;
  vLocal = corner * ext;
  vHalf = hs;
  vColor = aColor.rgb;
  vKind = kind;
  vec2 uv = (s - uDomain.xy) / uDomain.zw;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}
`;

export const SCENE_LIGHTS_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vLocal;
in vec2 vHalf;
in vec3 vColor;
flat in int vKind;
out vec4 outColor;
uniform float uBlur;
uniform int uMode;
uniform float uPx;      // one texel, in scene units
uniform float uTime;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 p = vLocal;
  vec3 c = vColor;
  float I = 0.0;
  if (uMode == 0) {
    // in focus
    if (vKind == 0) {
      float d = sdBox(p, vHalf);
      I = 1.0 - smoothstep(-uPx, uPx, d);
      I += 0.16 * exp(-max(d, 0.0) / 0.006);
    } else if (vKind == 1 || vKind == 4) {
      float r = length(p);
      float core = vHalf.x;
      I = (1.0 - smoothstep(core - uPx, core + uPx, r)) * 1.2;
      I += vKind == 1 ? 0.32 * exp(-r / 0.012) + 0.07 * exp(-r / 0.045) : 0.25 * exp(-r / 0.007);
    } else if (vKind == 2) {
      vec2 q = p / max(vHalf, vec2(1e-4));
      float e = dot(q, q);
      float rip = 0.55 + 0.45 * sin(p.y * 520.0 + uTime * 6.0 + p.x * 60.0);
      I = exp(-e * 2.6) * rip * 0.75;
    } else {
      vec2 q = p / max(vHalf, vec2(1e-4));
      I = exp(-dot(q, q) * 2.0);
    }
  } else if (uMode == 1) {
    // out of focus: discs with a slightly brighter rim and a hint of colour fringe
    if (vKind == 3) {
      vec2 q = p / (vHalf + uBlur);
      I = exp(-dot(q, q) * 2.2) * 0.9;
    } else {
      vec2 R = vKind == 2 ? vec2(uBlur * 0.75 + vHalf.x, uBlur * 0.6 + vHalf.y) : vec2(uBlur + max(vHalf.x, vHalf.y) * 0.7);
      vec2 q = p / R;
      float d = length(q);
      float edge = uPx / R.x * 1.5 + 0.02;
      float disc = 1.0 - smoothstep(1.0 - edge, 1.0, d);
      float rim = 1.0 + 0.32 * smoothstep(0.55, 0.97, d);
      // a touch of chromatic fringe at the rim
      float dr = 1.0 - smoothstep(1.0 - edge, 1.0, d * 0.985);
      float db = 1.0 - smoothstep(1.0 - edge, 1.0, d * 1.02);
      float gain = vKind == 0 ? 0.36 : vKind == 1 ? 0.2 : vKind == 2 ? 0.4 : 0.11;
      if (vKind == 2) { disc = exp(-dot(q, q) * 1.6); dr = disc; db = disc; rim = 1.0; }
      outColor = vec4(c * vec3(dr, disc, db) * rim * gain, 1.0);
      return;
    }
  } else {
    // through fog: wide soft glows
    vec2 R = vec2(uBlur) + vHalf * 0.8;
    vec2 q = p / R;
    I = exp(-dot(q, q) * 1.4) * (vKind == 3 ? 0.4 : vKind == 0 ? 0.18 : vKind == 1 ? 0.05 : vKind == 2 ? 0.07 : 0.012);
  }
  outColor = vec4(c * I, 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* 2. water                                                                */
/* ---------------------------------------------------------------------- */

export const FIELD_VS = `#version 300 es
layout(location = 0) in vec4 aDrop;   // x, y, rx, ry (CSS px)
uniform vec4 uGlass;                  // CSS rect of the target
uniform float uTexel;                 // CSS px per texel
out vec2 vQ;
out float vR;
void main() {
  vec2 r = max(aDrop.zw, vec2(0.05));
  vec2 ext = r * 1.6 + uTexel;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 p = aDrop.xy + corner * ext;
  vQ = corner * ext / r;
  vR = sqrt(r.x * r.y);
  vec2 uv = (p - uGlass.xy) / uGlass.zw;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}
`;

export const FIELD_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vQ;
in float vR;
uniform float uRScale;  // 1 in a float target; small in an 8-bit one, so k × r fits
out vec4 outColor;
void main() {
  float q2 = dot(vQ, vQ) / 2.56;
  if (q2 >= 1.0) discard;
  float k = 1.0 - q2;
  k = k * k * k;
  float kr = k * vR * uRScale;
  outColor = vec4(k, kr, k, kr);
}
`;

/* ---------------------------------------------------------------------- */
/* 3. fog                                                                  */
/* ---------------------------------------------------------------------- */

export const FADE_FS = `#version 300 es
precision highp float;
precision highp int;
uniform vec4 uAmount;
out vec4 outColor;
void main() { outColor = uAmount; }
`;

export const STAMP_VS = `#version 300 es
layout(location = 0) in vec4 aSeg;    // x0, y0, x1, y1 (CSS px)
layout(location = 1) in vec4 aParam;  // radius, alpha, kind, softness
uniform vec4 uGlass;
out vec2 vP;
flat out vec4 vSeg;
flat out vec4 vParam;
void main() {
  float reach = aParam.x + aParam.w + 1.0;
  vec2 lo = min(aSeg.xy, aSeg.zw) - reach;
  vec2 hi = max(aSeg.xy, aSeg.zw) + reach;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 p = mix(lo, hi, corner);
  vP = p;
  vSeg = aSeg;
  vParam = aParam;
  vec2 uv = (p - uGlass.xy) / uGlass.zw;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}
`;

export const STAMP_FS = `#version 300 es
precision highp float;
precision highp int;
in vec2 vP;
flat in vec4 vSeg;
flat in vec4 vParam;
out vec4 outColor;
void main() {
  vec2 a = vSeg.xy;
  vec2 ab = vSeg.zw - a;
  float l2 = dot(ab, ab);
  float t = l2 > 0.0 ? clamp(dot(vP - a, ab) / l2, 0.0, 1.0) : 0.0;
  float d = length(vP - (a + ab * t));
  float r = vParam.x;
  float soft = vParam.w;
  int kind = int(vParam.z + 0.5);
  float w;
  vec3 target;
  if (kind == 2) {
    w = 1.0 - smoothstep(r - soft, r, d);
    target = vec3(0.0, 1.0, 0.0);
  } else {
    w = 1.0 - smoothstep(r - soft, r + soft, d);
    target = kind == 0 ? vec3(1.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.35);
  }
  float alpha = w * vParam.y;
  if (alpha <= 0.002) discard;
  outColor = vec4(target, alpha);
}
`;

/* ---------------------------------------------------------------------- */
/* 4. composite                                                            */
/* ---------------------------------------------------------------------- */

export const COMPOSITE_FS = `#version 300 es
precision highp float;
precision highp int;
out vec4 outColor;

uniform vec2 uRes;          // canvas, device px
uniform float uScale;       // device px per CSS px
uniform vec4 uCasing;
uniform vec4 uOpening;
uniform vec4 uPanes[3];
uniform int uPaneN;
uniform vec4 uGlass;
uniform vec4 uWood;         // casing width, stile, bottom rail, unit
uniform vec4 uSill;         // x0, x1, y (top of the stool), depth of its top face
uniform vec4 uSill2;        // nose, apron, handle x, handle y
uniform vec4 uSceneRect;    // CSS rect the street textures cover
uniform vec2 uFieldTexel;   // field texel, in uv
uniform float uFieldCss;    // CSS px per field texel
uniform sampler2D uSharp;
uniform sampler2D uBokeh;
uniform sampler2D uFogTex;
uniform sampler2D uField;
uniform sampler2D uFog;
uniform float uNight;
uniform float uFlash;
uniform float uTime;
uniform vec3 uWall;         // the stage colour (linear)
uniform vec2 uFogLevel;     // settled fog: top, bottom
uniform float uLens;        // how far a drop's lens reaches (CSS px)
uniform vec4 uRing;         // the fingertip: x, y, radius, alpha
uniform float uPressed;
uniform float uTile;
uniform float uRScale;
uniform float uSharpScale; // sharp texels per CSS px

const float T = 0.2259;
${NOISE}

vec2 sceneUv(vec2 p) {
  vec2 uv = (p - uSceneRect.xy) / uSceneRect.zw;
  return vec2(uv.x, 1.0 - uv.y);
}
vec2 glassUv(vec2 p) {
  vec2 uv = (p - uGlass.xy) / uGlass.zw;
  return vec2(uv.x, 1.0 - uv.y);
}

float sdBox(vec2 p, vec4 r) {
  vec2 c = r.xy + r.zw * 0.5;
  vec2 d = abs(p - c) - r.zw * 0.5;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/* ---- the room's light ------------------------------------------------ */

// a lamp in the room, up and to the left of the window
const vec3 KEY = vec3(-0.5, -0.42, 0.76);

vec3 keyColor() {
  return mix(vec3(1.0, 0.96, 0.9) * 0.62, vec3(1.0, 0.6, 0.3) * 0.22, uNight);
}
vec3 ambient() {
  return mix(vec3(0.86, 0.89, 0.96) * 0.5, vec3(0.42, 0.33, 0.32) * 0.07, uNight);
}
/** How much of the lamp reaches x (it stands off to the left). */
float lampReach(vec2 p) {
  float x = p.x / max(1.0, uRes.x / uScale);
  return mix(0.9, 1.25, 1.0 - x) * mix(1.0, 1.35 - 0.9 * x, uNight);
}

/* ---- the street through the glass ------------------------------------ */

vec3 outside(vec2 p) { return texture(uBokeh, sceneUv(p)).rgb; }
vec3 outsideFog(vec2 p) { return texture(uFogTex, sceneUv(p)).rgb; }

/* ---- the woodwork: a height field ------------------------------------ */

int paneIndex(vec2 p) {
  for (int i = 0; i < 3; i++) {
    if (i >= uPaneN) break;
    vec4 r = uPanes[i];
    if (p.x >= r.x && p.x <= r.x + r.z && p.y >= r.y && p.y <= r.y + r.w) return i;
  }
  return -1;
}

/** Distance to the nearest pane's edge (outside it), and that pane. */
float paneDist(vec2 p, out int which) {
  float best = 1e5;
  which = 0;
  for (int i = 0; i < 3; i++) {
    if (i >= uPaneN) break;
    float d = sdBox(p, uPanes[i]);
    if (d < best) { best = d; which = i; }
  }
  return best;
}

/** Height of the paintwork at p (px toward the room), or -1 off the woodwork. */
float woodHeight(vec2 p, out float material) {
  material = 0.0;
  float cw = uWood.x;
  float st = uWood.y;
  float dCasing = sdBox(p, uCasing);
  float dOpen = sdBox(p, uOpening);
  if (p.y > uSill.z) return -1.0;
  if (dCasing > 0.0) return -1.0;
  if (dOpen > 0.0) {
    // the casing: a rounded outer edge, a flat face, a cove up to a raised back band
    float de = -dCasing;
    float h = 5.5 * smoothstep(0.0, 2.6, de);
    h += 2.5 * smoothstep(cw * 0.5, cw * 0.78, de);
    h -= 1.4 * smoothstep(cw - 1.6, cw, de);
    return h;
  }
  // inside the opening: the frame and the sashes
  int which;
  float dp = paneDist(p, which);
  float h = 12.0;
  // the putty bevel down to the glass
  float bev = max(2.0, st * 0.32);
  h -= (bev - min(dp, bev)) * 0.9;
  // the gap between the fixed frame and the sash
  float dO = -dOpen;
  float g = st * 0.38;
  h -= 2.2 * exp(-pow((dO - g) / 0.75, 2.0));
  h -= 1.6 * smoothstep(g, 0.0, dO);
  // where two sashes meet: a fine line down the middle
  for (int i = 0; i < 2; i++) {
    if (i + 1 >= uPaneN) break;
    float mid = (uPanes[i].x + uPanes[i].z + uPanes[i + 1].x) * 0.5;
    h -= 2.0 * exp(-pow((p.x - mid) / 0.7, 2.0));
  }
  // the handle: a brass plate and its lever
  vec2 hp = p - uSill2.zw;
  float plate = sdBox(hp, vec4(-st * 0.24, -st * 1.0, st * 0.48, st * 2.0)) - st * 0.12;
  vec2 lv = hp - vec2(0.0, clamp(hp.y, -st * 0.15, st * 1.35));
  float lever = length(lv) - st * 0.2;
  if (plate < 0.0 || lever < 0.0) {
    material = 1.0;
    float hPlate = 15.0 + 1.2 * smoothstep(0.0, -1.6, plate);
    float hLever = 18.5 + 2.0 * sqrt(max(0.0, 1.0 - pow(length(lv) / (st * 0.2), 2.0)));
    h = lever < 0.0 ? max(hLever, plate < 0.0 ? hPlate : 0.0) : hPlate;
  }
  return h;
}

vec3 shadeWood(vec2 p, float h, float m) {
  float m2;
  float e = 0.7;
  float hx = woodHeight(p + vec2(e, 0.0), m2) - h;
  float hy = woodHeight(p + vec2(0.0, e), m2) - h;
  vec3 n = normalize(vec3(-hx / e, -hy / e, 1.0));
  vec3 L = normalize(KEY);
  vec3 V = vec3(0.0, 0.0, 1.0);
  float ndl = max(dot(n, L), 0.0);
  vec3 paint = vec3(0.86, 0.84, 0.8);
  vec3 c = paint * (ambient() * (0.75 + 0.25 * n.z) + keyColor() * ndl * lampReach(p));
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 36.0) * 0.07;
  c += keyColor() * spec;
  // the faces toward the glass catch the street's light (and the lightning)
  int which;
  float dp = paneDist(p, which);
  vec4 r = uPanes[which];
  vec2 nearest = clamp(p, r.xy, r.xy + r.zw);
  vec2 toGlass = nearest - p;
  float facing = dp > 0.01 ? max(0.0, dot(n.xy, normalize(toGlass))) : 0.0;
  vec3 street = outsideFog(nearest);
  c += paint * street * (facing * 1.2 + 0.08) * exp(-dp / (uWood.y * 1.5)) * (dp < uWood.y * 3.0 ? 1.0 : 0.0);
  if (m > 0.5) {
    // brass: warm, glossy, dark in its flanks
    vec3 brass = vec3(0.62, 0.45, 0.2);
    float fres = pow(1.0 - n.z, 2.0);
    c = brass * (ambient() * 0.6 + keyColor() * ndl * 0.9) + keyColor() * pow(max(dot(n, normalize(L + V)), 0.0), 60.0) * 1.4;
    c += brass * street * 0.4 + brass * fres * 0.15 * keyColor();
  }
  // a little occlusion in the creases
  c *= 0.82 + 0.18 * smoothstep(4.0, 12.0, h);
  return c;
}

/* ---- the sill and the wall ------------------------------------------- */

vec3 shadeSill(vec2 p, out bool hit) {
  hit = false;
  float x0 = uSill.x;
  float x1 = uSill.y;
  float y0 = uSill.z;
  float top = uSill.w;
  float nose = uSill2.x;
  float apron = uSill2.y;
  vec3 paint = vec3(0.86, 0.84, 0.8);
  vec3 street = outsideFog(vec2(clamp(p.x, uGlass.x, uGlass.x + uGlass.z), uGlass.y + uGlass.w - 2.0));
  float ear = 3.0;
  // the stool's top face, seen from a little above
  if (p.y >= y0 && p.y < y0 + top && p.x > x0 && p.x < x1) {
    hit = true;
    float t = (p.y - y0) / top;
    vec3 n = normalize(vec3(0.0, -0.9, 0.45));
    float ndl = max(dot(n, normalize(KEY)), 0.0);
    vec3 c = paint * (ambient() * 1.05 + keyColor() * ndl * lampReach(p) * 0.9);
    // the light from the window falls on it, strongest by the glass
    float under = step(uOpening.x, p.x) * step(p.x, uOpening.x + uOpening.z);
    c += paint * street * (0.9 - 0.5 * t) * (0.35 + 0.65 * under);
    // the frame's shadow on it, from the lamp
    c *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.5, t));
    // rounded ends
    float end = min(p.x - x0, x1 - p.x);
    c *= 0.75 + 0.25 * smoothstep(0.0, ear, end);
    return c;
  }
  // its rounded nose
  if (p.y >= y0 + top && p.y < y0 + top + nose && p.x > x0 && p.x < x1) {
    hit = true;
    float t = (p.y - y0 - top) / nose;
    float a = mix(-1.2, 1.3, t);
    vec3 n = normalize(vec3(0.0, sin(a), cos(a)));
    float ndl = max(dot(n, normalize(KEY)), 0.0);
    vec3 c = paint * (ambient() * (0.6 + 0.4 * n.z) + keyColor() * ndl * lampReach(p));
    c += keyColor() * pow(max(dot(n, normalize(normalize(KEY) + vec3(0, 0, 1))), 0.0), 30.0) * 0.08;
    float end = min(p.x - x0, x1 - p.x);
    c *= 0.75 + 0.25 * smoothstep(0.0, ear, end);
    return c;
  }
  // the apron under it, in the stool's shadow
  if (p.y >= y0 + top + nose && p.y < y0 + top + nose + apron && p.x > uCasing.x && p.x < uCasing.x + uCasing.z) {
    hit = true;
    float t = (p.y - y0 - top - nose) / apron;
    vec3 c = paint * (ambient() * 0.85 + keyColor() * 0.55 * lampReach(p));
    c *= 0.55 + 0.45 * smoothstep(0.0, 0.8, t);
    float edge = min(p.x - uCasing.x, uCasing.x + uCasing.z - p.x);
    c *= 0.8 + 0.2 * smoothstep(0.0, 2.0, edge);
    return c;
  }
  return vec3(0.0);
}

vec3 shadeWall(vec2 p) {
  vec3 c = uWall;
  // the woodwork stands off the wall: a soft shadow down and to the right
  vec2 off = vec2(5.0, 6.0) * (0.6 + 0.4 * uWood.w);
  vec4 body = vec4(uCasing.x, uCasing.y, uCasing.z, uSill.z + uSill.w + uSill2.x - uCasing.y);
  float d = sdBox(p - off, body);
  float sh = 1.0 - smoothstep(-6.0, 16.0, d);
  float ds = sdBox(p - vec2(0.0, 5.0), vec4(uSill.x, uSill.z, uSill.y - uSill.x, uSill.w + uSill2.x + uSill2.y));
  sh = max(sh, (1.0 - smoothstep(-2.0, 12.0, ds)) * 0.9);
  float contact = exp(-max(sdBox(p, body), 0.0) / 3.0);
  c *= 1.0 - mix(0.07, 0.3, uNight) * sh - 0.06 * contact;
  // the lamp's glow on the wall in the evening
  vec2 lamp = vec2(-0.15, 0.25) * vec2(uRes.x / uScale, uRes.y / uScale);
  float g = exp(-length(p - lamp) / (uRes.x / uScale * 0.42));
  c += vec3(0.05, 0.022, 0.008) * g * uNight * (1.0 - 0.5 * sh) * (1.0 - uTile * 0.5);
  // lightning spills through the window
  float near = exp(-max(0.0, sdBox(p, uCasing)) / 70.0);
  c += uFlash * vec3(0.12, 0.13, 0.17) * near * (1.0 - sh * 0.7) * mix(0.3, 1.0, uNight);
  return c;
}

/* ---- the glass ------------------------------------------------------- */

/** The settled fog's density (fog.ts's fogBase, with a patchy noise). */
float fogBase(vec2 p, int i) {
  vec4 r = uPanes[i];
  float v = (p.y - r.y) / r.w;
  // the cold frame fogs first, at the sides and the bottom (warm air keeps the top clearer)
  float edge = min(min(p.x - r.x, r.x + r.z - p.x), r.y + r.w - p.y) / uWood.w;
  float d = uFogLevel.x + (uFogLevel.y - uFogLevel.x) * smoothstep(0.3, 0.92, v) + 0.3 * exp(-max(0.0, edge) / 24.0);
  vec2 q = p / (uWood.w * 70.0);
  d += (vnoise(q) * 0.65 + vnoise(q * 2.7 + 5.3) * 0.35 - 0.5) * 0.22;
  return clamp(d, 0.0, 1.0);
}

struct Lens { float mask; vec3 n; float r; };

/** The drop under p in one layer of the field (x = field, y = field × radius). */
Lens lens(vec4 c, vec4 px, vec4 nx, vec4 py, vec4 ny, bool inner) {
  Lens L;
  float F = inner ? c.b : c.r;
  float FR = inner ? c.a : c.g;
  vec2 g = inner ? vec2(px.b - nx.b, py.b - ny.b) : vec2(px.r - nx.r, py.r - ny.r);
  g /= 2.0 * uFieldCss;
  float aa = length(g) / uScale * 0.9 + 1e-4;
  L.mask = smoothstep(T - aa, T + aa, F);
  L.r = FR / max(F, 1e-3) / uRScale;
  float u = clamp((F - T) / (1.0 - T), 0.0, 1.0);
  vec2 slope = g * L.r * 1.25 * pow(max(u, 0.035), -0.42);
  L.n = normalize(vec3(-slope, 1.0));
  return L;
}

vec3 shadeGlass(vec2 p, int pane) {
  vec2 uv = glassUv(p);
  vec4 c = textureLod(uField, uv, 0.0);
  vec4 px = textureLod(uField, uv + vec2(uFieldTexel.x, 0.0), 0.0);
  vec4 nx = textureLod(uField, uv - vec2(uFieldTexel.x, 0.0), 0.0);
  // texture v runs up: +v is up the glass (smaller CSS y)
  vec4 py = textureLod(uField, uv - vec2(0.0, uFieldTexel.y), 0.0);
  vec4 ny = textureLod(uField, uv + vec2(0.0, uFieldTexel.y), 0.0);
  Lens o = lens(c, px, nx, py, ny, false);
  Lens i = lens(c, px, nx, py, ny, true);
  vec4 fog = texture(uFog, uv);

  vec3 L = normalize(KEY);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

  // the condensation's beads bend the view a little
  vec2 q = p - i.n.xy * uLens * 0.35 * i.mask;
  // a fresh wipe leaves a thin wet film, faintly streaked
  if (fog.b > 0.01) q += (vec2(vnoise(p * vec2(0.9, 0.12)), vnoise(p * vec2(0.12, 0.9) + 7.0)) - 0.5) * 3.0 * fog.b;

  // through clear glass: the street out of focus
  vec3 view = outside(q);
  // through a raindrop: the street in focus, upside down, small
  vec2 dq = q - o.n.xy * uLens;
  // a drop shrinks a wide view into itself: pick the mip for that, a little
  // on the sharp side (they are jewels, not blurs)
  float lod = clamp(log2(uLens / max(o.r, 0.4) * uSharpScale) - 2.0, 0.0, 5.0);
  vec3 drop = textureLod(uSharp, sceneUv(dq), lod).rgb * 1.18;
  float edge = length(o.n.xy);
  drop *= 1.0 - 0.62 * smoothstep(0.5, 0.97, edge);
  // the sky reflected in the drop's rim, and the room lamp's glint
  float fres = 0.04 + 0.5 * pow(1.0 - o.n.z, 4.0);
  drop += fres * mix(vec3(0.3, 0.32, 0.4), vec3(0.06, 0.045, 0.05), uNight);
  drop += keyColor() * (pow(max(dot(o.n, H), 0.0), 90.0) * 1.8 + pow(max(dot(o.n, H), 0.0), 12.0) * 0.06);
  drop += uFlash * vec3(0.5, 0.55, 0.7) * (0.35 + edge);
  vec3 clear = mix(view, drop, o.mask);

  // the fog: thick low down, thin up top; wiped where you wiped, creeping back grain by grain
  // (soft islands of frost at two sizes, so it closes in like breath, not like a wipe in reverse)
  float n = 0.18 + 0.38 * vnoise(p / (uWood.w * 7.0) + 3.1) + 0.26 * vnoise(p / (uWood.w * 22.0) + 9.7);
  n = mix(n, 0.95, 0.35 * exp(-max(0.0, min(min(p.x - uPanes[pane].x, uPanes[pane].x + uPanes[pane].z - p.x), uPanes[pane].y + uPanes[pane].w - p.y)) / (uWood.w * 30.0)));
  float wiped = smoothstep(n - 0.2, n + 0.2, fog.r);
  float density = max(fogBase(p, pane) * (1.0 - wiped), fog.g);
  density *= 1.0 - i.mask;
  // what fog looks like: the street as glows, the room's light scattered in it, a frost of grain
  vec3 behind = outsideFog(q);
  float blobs = smoothstep(0.08, 0.45, textureLod(uField, uv, 2.5).r);
  behind *= 1.0 - 0.1 * blobs;
  vec3 milk = mix(vec3(0.58, 0.62, 0.7) * 0.095, vec3(0.24, 0.15, 0.11) * 0.05, uNight) * lampReach(p);
  milk += uFlash * vec3(0.35, 0.37, 0.45);
  float grain = hash12(floor(p * 1.4));
  float lum = dot(behind, vec3(0.3, 0.55, 0.15));
  vec3 frosted = mix(behind, vec3(lum), 0.35) * mix(0.56, 0.36, uNight) + milk + milk * (grain * grain * grain) * 0.5;
  // the frame's shadow in the fog (the fog takes the room's light, so it shows)
  float dEdge = min(min(p.x - uPanes[pane].x, uPanes[pane].x + uPanes[pane].z - p.x), min(p.y - uPanes[pane].y, uPanes[pane].y + uPanes[pane].w - p.y));
  frosted *= 1.0 - 0.2 * exp(-dEdge / (5.0 * uWood.w + 2.0));
  vec3 col = mix(clear, frosted, density);

  // the condensation's own drops: clear little lenses in the fog
  if (i.mask > 0.001) {
    // clear water on the inside: the street through it, bent and a little magnified
    vec2 bq = p - i.n.xy * uLens * 0.45;
    float blod = clamp(log2(uLens * 0.45 / max(i.r, 0.4) * uSharpScale) - 1.0, 0.0, 5.0);
    vec3 bead = mix(outside(bq), textureLod(uSharp, sceneUv(bq), blod).rgb, 0.35) * 1.1;
    bead *= 1.0 - 0.28 * smoothstep(0.55, 0.97, length(i.n.xy));
    // they sit on the room side, so they catch the room's lamp: a glint and a warm rim
    bead += keyColor() * (pow(max(dot(i.n, H), 0.0), 80.0) * 1.6 + pow(max(dot(i.n, H), 0.0), 10.0) * 0.08);
    bead += pow(1.0 - i.n.z, 3.0) * (milk * 2.0 + keyColor() * 0.12);
    col = mix(col, bead, i.mask);
  }
  // the room, faintly mirrored in the dark glass
  vec2 lampImg = vec2(uGlass.x - uGlass.z * 0.1, uGlass.y + uGlass.w * 0.75);
  float refl = exp(-length((p - lampImg) / vec2(uGlass.z * 0.35, uGlass.w * 0.5)));
  col += vec3(0.05, 0.025, 0.01) * refl * uNight * (1.0 - 0.7 * density);
  // a wipe still wet shines a little
  if (fog.b > 0.01) col += keyColor() * 0.035 * fog.b * (0.4 + vnoise(p * vec2(0.05, 0.6)));
  return col;
}

/* ---- output ---------------------------------------------------------- */

vec3 tone(vec3 x) {
  // identity up to 0.9, then a soft shoulder (keeps the stage colour exact)
  vec3 a = vec3(0.9);
  vec3 over = max(x - a, 0.0);
  return min(x, a) + (1.0 - a) * (1.0 - exp(-over / (1.0 - a)));
}
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec3 col;
  int pane = paneIndex(p);
  if (pane >= 0) {
    col = shadeGlass(p, pane);
  } else {
    bool sill;
    col = shadeSill(p, sill);
    if (!sill) {
      float m;
      float h = woodHeight(p, m);
      col = h >= 0.0 ? shadeWood(p, h, m) : shadeWall(p);
    }
  }
  // the fingertip
  if (uRing.w > 0.001) {
    float d = length(p - uRing.xy) - uRing.z;
    float line = 1.0 - smoothstep(0.0, 1.1, abs(d));
    float halo = (1.0 - smoothstep(0.0, 4.0, abs(d - 1.5))) * 0.5;
    col *= 1.0 - halo * 0.35 * uRing.w;
    col = mix(col, vec3(1.0, 0.98, 0.95), line * 0.55 * uRing.w);
    col += vec3(1.0) * (1.0 - smoothstep(-uRing.z, 0.0, d)) * 0.04 * uRing.w * uPressed;
  }
  col = toSrgb(tone(col));
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;
