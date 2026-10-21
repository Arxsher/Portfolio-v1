// GLSL for the slice.
//
// floor   full-screen: the stage's own surface (so it meets the card's edge
//         seamlessly), the slice's soft cast shadow (the light's ray walked
//         from the floor up to the slice's top against the outline), contact
//         occlusion at its foot, a warm pool of lamp light after dark, and the
//         dotted dial the light rides on.
// face    the sanded end grain, per pixel: the ring coordinate from the
//         field table (θ × r), earlywood easing into each ring's latewood,
//         wider and darker on busy days; heartwood and sapwood; ring-porous
//         pores at the start of each ring and fine rays (seen under the
//         loupe; at a glance they average into the tone). Relief: the soft
//         earlywood wears below the latewood, so every ring ends in a tiny
//         step whose edge catches a light from outside and throws a hairline
//         shadow when the light comes from the pith side, which is what makes
//         the grain shimmer as the light goes round. Oiled: two specular
//         lobes. The day you point at is outlined.
// bark    cambium, inner bark and fissured outer bark on the rim and down the
//         side, bump-mapped from a stretched noise.
// loupe   composites the magnified view through a round glass with a steel
//         rim, a little barrel distortion and colour fringing at the edge, a
//         highlight on the side the light comes from and a soft shadow.

const COMMON = /* glsl */ `
precision highp float;
precision highp int;
precision highp sampler2D;
#define TAU 6.28318530718
#define PI 3.14159265359
#define SECTOR 0.897597901

uint hashu(uint x) {
  x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
  return x;
}
float hash2(ivec2 p) {
  return float(hashu(uint(p.x) * 0x9e3779b9U ^ hashu(uint(p.y) + 0x632be5abU))) * (1.0 / 4294967295.0);
}
float hash3(ivec3 p) {
  return float(hashu(uint(p.x) * 0x9e3779b9U ^ hashu(uint(p.y) * 0x85ebca6bU ^ hashu(uint(p.z) + 0xc2b2ae35U)))) * (1.0 / 4294967295.0);
}
float vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  ivec2 c = ivec2(i);
  float a = hash2(c);
  float b = hash2(c + ivec2(1, 0));
  float d = hash2(c + ivec2(0, 1));
  float e = hash2(c + ivec2(1, 1));
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * (3.0 - 2.0 * f);
  ivec3 c = ivec3(i);
  float n000 = hash3(c);
  float n100 = hash3(c + ivec3(1, 0, 0));
  float n010 = hash3(c + ivec3(0, 1, 0));
  float n110 = hash3(c + ivec3(1, 1, 0));
  float n001 = hash3(c + ivec3(0, 0, 1));
  float n101 = hash3(c + ivec3(1, 0, 1));
  float n011 = hash3(c + ivec3(0, 1, 1));
  float n111 = hash3(c + ivec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z);
}
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toSRGB(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec3 srgb(float r, float g, float b) { return toLinear(vec3(r, g, b) / 255.0); }
vec3 tonemap(vec3 x) {
  // Narkowicz's ACES fit
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
// the same small warp as rings.ts
float warpR(float th, float r) {
  float a = sin(3.0 * th + 1.3 + 9.0 * r) * 0.6 + sin(5.0 * th + 4.1 - 13.0 * r) * 0.4;
  float b = sin(11.0 * th + 23.0 * r + 0.7);
  return r * (1.0 + 0.0075 * a + 0.0028 * b);
}
float angleOf(vec2 xz) {
  float a = atan(xz.x, -xz.y);
  return a < 0.0 ? a + TAU : a;
}
// GGX specular (normalised), times n·l
float ggx(vec3 n, vec3 v, vec3 l, float rough, float f0) {
  vec3 h = normalize(v + l);
  float nl = max(dot(n, l), 0.0);
  float nv = max(dot(n, v), 1e-3);
  float nh = max(dot(n, h), 0.0);
  float a = rough * rough;
  float a2 = a * a;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * dd * dd);
  float k = a * 0.5;
  float G = (nl / (nl * (1.0 - k) + k)) * (nv / (nv * (1.0 - k) + k));
  float F = f0 + (1.0 - f0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
  return D * G * F / max(4.0 * nl * nv, 1e-3) * nl;
}
`;

/* ---------------------------------------------------------------------- */
/* vertex shaders                                                          */
/* ---------------------------------------------------------------------- */

export const FULLSCREEN_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const SLICE_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
uniform mat4 uVP;
out vec3 vPos;
out vec3 vNrm;
out vec2 vUv;
void main() {
  vPos = aPos;
  vNrm = aNrm;
  vUv = aUv;
  gl_Position = uVP * vec4(aPos, 1.0);
}
`;

/** A quad over a rectangle given in NDC (x0, y0, x1, y1). */
export const RECT_VS = /* glsl */ `#version 300 es
uniform vec4 uRect;
void main() {
  // two triangles from six vertices
  int id = gl_VertexID % 6;
  vec2 q = id == 0 ? vec2(0.0, 0.0) : id == 1 ? vec2(1.0, 0.0) : id == 2 ? vec2(0.0, 1.0)
         : id == 3 ? vec2(1.0, 0.0) : id == 4 ? vec2(1.0, 1.0) : vec2(0.0, 1.0);
  gl_Position = vec4(mix(uRect.xy, uRect.zw, q), 0.0, 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* floor                                                                   */
/* ---------------------------------------------------------------------- */

export function floorFS(shadowSteps: number) {
  return /* glsl */ `#version 300 es
${COMMON}
uniform mat4 uInv;
uniform vec3 uLight;
uniform vec3 uBg;
uniform vec3 uPoolCol;
uniform float uShadowK;
uniform float uSoft;
uniform float uH;
uniform sampler2D uOutline;
uniform float uDialR;
uniform vec4 uDialCol;
uniform float uDpr;
in vec2 vUv;
out vec4 outColor;

float outerAt(vec2 q) {
  return texture(uOutline, vec2(angleOf(q) / TAU, 0.5)).r;
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 a = uInv * vec4(ndc, -1.0, 1.0);
  vec4 b = uInv * vec4(ndc, 1.0, 1.0);
  vec3 ro = a.xyz / a.w;
  vec3 rd = b.xyz / b.w - ro;
  float t = -ro.y / min(rd.y, -1e-6);
  vec2 q = ro.xz + rd.xz * t;

  // contact: how far outside the trunk this point of the floor is
  float d0 = length(q) - outerAt(q);
  float ao = 1.0 - 0.42 * exp(-max(d0, 0.0) / 0.018) - 0.2 * exp(-max(d0, 0.0) / 0.11);

  // the cast shadow: walk the ray toward the light from the floor to the slice's top
  vec2 lxz = uLight.xz / max(uLight.y, 0.08);
  float occ = 1e4;
  for (int i = 0; i < ${shadowSteps}; i++) {
    float f = (float(i) + 0.5) / float(${shadowSteps});
    float h = f * uH;
    vec2 s = q + lxz * h;
    float d = length(s) - outerAt(s);
    float pen = 0.003 + h * uSoft;
    occ = min(occ, d / pen);
  }
  float shadow = 1.0 - smoothstep(-1.0, 1.0, occ);
  // the light's distance through the shadow softens and pales it further out
  shadow *= 1.0 - 0.35 * smoothstep(0.0, 0.9, d0);

  vec3 bg = toLinear(uBg);
  // a pool of light round the slice, leaning toward the lamp
  vec2 lh = uLight.xz / max(length(uLight.xz), 1e-4);
  vec2 pc = q - lh * 0.35;
  float pool = exp(-dot(pc, pc) / 2.1);
  vec3 col = bg * (1.0 - uShadowK * shadow) * ao + uPoolCol * pool * (1.0 - 0.9 * shadow) * ao;

  // the dial: a dotted ring with gaps where the weekdays are written
  vec2 fw = fwidth(q);
  float px = max(length(fw) * 0.7071, 1e-5);
  float rho = length(q);
  float phi = angleOf(q);
  float dots = 132.0;
  float cell = phi / TAU * dots;
  float along = (fract(cell) - 0.5) * (TAU / dots) * rho / px;
  float across = (rho - uDialR) / px;
  float rDot = 0.95 * uDpr;
  float dotMask = 1.0 - smoothstep(rDot - 0.6, rDot + 0.6, length(vec2(along, across)));
  // gaps for the labels
  float s = phi / SECTOR;
  float toLabel = abs(s - floor(s + 0.5)) * SECTOR;
  dotMask *= smoothstep(0.13, 0.17, toLabel);
  col = mix(col, toLinear(uDialCol.rgb), dotMask * uDialCol.a);

  vec3 outc = toSRGB(col);
  // a whisper of noise against banding
  outc += (hash2(ivec2(gl_FragCoord.xy)) - 0.5) / 255.0;
  outColor = vec4(outc, 1.0);
}
`;
}

/* ---------------------------------------------------------------------- */
/* face                                                                    */
/* ---------------------------------------------------------------------- */

export type FaceQuality = { detail: boolean };

export function faceFS(q: FaceQuality) {
  return /* glsl */ `#version 300 es
${COMMON}
#define DETAIL ${q.detail ? 1 : 0}
uniform sampler2D uField;
uniform sampler2D uLevel;
uniform int uN;
uniform float uGrown;
uniform vec3 uLight;
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uEye;
uniform float uRelief;
uniform float uExposure;
uniform vec4 uSelA;
uniform vec4 uSelB;
uniform vec3 uLineCol;
uniform vec4 uKnock;
in vec3 vPos;
in vec3 vNrm;
in vec2 vUv;
out vec4 outColor;

const int TH = 512;
const int FR = 1024;

float fieldAt(float th01, float r) {
  float x = th01 * float(TH) - 0.5;
  float y = clamp(r * float(FR) - 0.5, 0.0, float(FR) - 1.001);
  float fx = floor(x);
  float fy = floor(y);
  vec2 f = vec2(x - fx, y - fy);
  int x0 = int(fx);
  x0 = x0 < 0 ? x0 + TH : (x0 >= TH ? x0 - TH : x0);
  int x1 = x0 + 1 >= TH ? 0 : x0 + 1;
  int y0 = int(fy);
  int y1 = min(y0 + 1, FR - 1);
  float a = texelFetch(uField, ivec2(x0, y0), 0).r;
  float b = texelFetch(uField, ivec2(x1, y0), 0).r;
  float c = texelFetch(uField, ivec2(x0, y1), 0).r;
  float d = texelFetch(uField, ivec2(x1, y1), 0).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float levelAt(int k, float th) {
  float s = th / SECTOR;
  s -= floor(s / 7.0) * 7.0;
  float fs = floor(s);
  int d0 = int(fs) % 7;
  int d1 = (d0 + 1) % 7;
  float u = s - fs;
  u = u * u * (3.0 - 2.0 * u);
  float a = texelFetch(uLevel, ivec2(d0, k), 0).r;
  float b = texelFetch(uLevel, ivec2(d1, k), 0).r;
  return mix(a, b, u);
}

float angleDiff(float a, float b) {
  float d = a - b;
  d -= TAU * floor(d / TAU + 0.5);
  return d;
}

// the outline of one selected day (sel: week, weekday, strength)
void selection(inout vec3 col, vec4 sel, float c, float aa, float th, float r, float px) {
  if (sel.z <= 0.002) return;
  // px from the segment's edges, positive inside
  float dRing = min(c - sel.x, sel.x + 1.0 - c) / aa;
  float dSec = (SECTOR * 0.5 - abs(angleDiff(th, sel.y * SECTOR))) * r / px;
  float edge = min(dRing, dSec);
  float inside = clamp(edge + 0.5, 0.0, 1.0);
  // a crisp line just inside the edge
  float line = 1.0 - smoothstep(0.55, 1.35, abs(edge - 0.85));
  col = mix(col, col * 1.08 + vec3(0.03, 0.026, 0.018), inside * sel.z);
  col = mix(col, uLineCol, line * sel.z * 0.95);
}

void main() {
  vec2 xz = vPos.xz;
  float r = length(xz);
  float th = angleOf(xz);
  float c = fieldAt(th / TAU, warpR(th, r));

  // the ring coordinate's gradient across the face (per unit), from screen derivatives
  vec2 dpx = dFdx(xz);
  vec2 dpy = dFdy(xz);
  float dcx = dFdx(c);
  float dcy = dFdy(c);
  float det = dpx.x * dpy.y - dpx.y * dpy.x;
  det = abs(det) < 1e-14 ? 1e-14 : det;
  vec2 g = vec2(dcx * dpy.y - dcy * dpx.y, dpx.x * dcy - dpy.x * dcx) / det;
  float gl = max(length(g), 1e-4);
  vec2 radial = r > 1e-5 ? xz / r : vec2(0.0, -1.0);
  // rings are near-circles: lean on the radial direction where the quad is noisy
  vec2 gdir = normalize(mix(radial, g / gl, 0.5));
  float px = sqrt(abs(det));
  float aa = clamp(gl * px, 1e-4, 4.0);

  float k = floor(c);
  float f = c - k;
  int ki = clamp(int(k), 0, uN - 1);
  float lev = c >= 0.0 ? levelAt(ki, th) : 0.0;

  // latewood: a band at the outer edge of each ring, wider and darker on busy days
  float lw = mix(0.18, 0.5, lev);
  float a0 = 1.0 - lw - 0.17;
  float a1 = 1.0 - lw + 0.07;
  float lmA = smoothstep(a0, a1, fract(c - 0.3 * aa));
  float lmB = smoothstep(a0, a1, fract(c + 0.3 * aa));
  float lm = 0.5 * (lmA + lmB);
  float tiny = smoothstep(0.12, 0.45, aa);
  lm = mix(lm, lw * 0.85, tiny);

  // colours (linear): pale sapwood round a warmer heartwood
  float n = float(uN);
  vec2 around = vec2(sin(th), -cos(th));
  float wobble = (vnoise3(vec3(around * 1.6, 0.5)) - 0.5) * 2.4;
  float heart = 1.0 - smoothstep(0.48 * n, 0.68 * n, c + wobble);
  vec3 early = mix(srgb(224.0, 199.0, 163.0), srgb(212.0, 174.0, 130.0), heart);
  vec3 late = mix(srgb(184.0, 146.0, 104.0), srgb(166.0, 120.0, 80.0), heart);
  // busy days: a wide band of dense, dark latewood
  vec3 busy = mix(srgb(118.0, 74.0, 44.0), srgb(104.0, 62.0, 36.0), heart);
  late = mix(late, busy, smoothstep(0.08, 0.95, lev));
  // figure: slow streaks in the tone along each ring, and fine fibres across it
  float figure = vnoise3(vec3(around * 6.0, c * 0.7)) * 0.6 + vnoise3(vec3(around * 21.0, c * 2.3)) * 0.4;
  float fibre = vnoise3(vec3(xz * 34.0, c * 23.0)) * 0.65 + vnoise3(vec3(xz * 90.0, c * 61.0)) * 0.35;
  float fibreVis = 1.0 - smoothstep(0.02, 0.09, aa);
  early *= 0.93 + 0.12 * figure;
  early *= 1.0 - 0.06 * lev;
  vec3 albedo = mix(early, late, lm);
  albedo *= 1.0 + (fibre - 0.5) * mix(0.05, 0.16, fibreVis);

  // the pith and the first wood round it
  float pith = 1.0 - smoothstep(-0.25, 0.05, c);
  albedo = mix(albedo, srgb(122.0, 82.0, 52.0), pith * 0.9);

  float relief = uRelief;
  float pore = 0.0;
  float ray = 0.0;
#if DETAIL
  // ring-porous: a band of open pores where each ring starts (seen close up)
  {
    vec2 cell = xz * 150.0;
    vec2 ci = floor(cell);
    vec2 cf = cell - ci;
    ivec2 ic = ivec2(ci);
    float h1 = hash2(ic);
    float h2 = hash2(ic + ivec2(17, 31));
    float h3 = hash2(ic + ivec2(53, 7));
    vec2 centre = 0.3 + 0.4 * vec2(h1, h2);
    float rad = mix(0.17, 0.36, h3);
    float zone = 1.0 - smoothstep(0.04, 0.26 + 0.14 * lev, f);
    zone *= step(0.0, c) * step(0.25, h2 + 0.5 * zone);
    float sizePx = rad / 150.0 / px;
    float dd = length((cf - centre) * vec2(1.0, 1.0)) / rad;
    float visible = smoothstep(0.5, 1.6, sizePx);
    pore = (1.0 - smoothstep(0.6, 1.0 + 0.6 / max(sizePx, 0.25), dd)) * zone * visible;
    // what can't be resolved still darkens the band a touch
    albedo *= 1.0 - 0.07 * zone * (1.0 - visible);
  }
  // rays: fine radial flecks, a little paler and glossier
  {
    float bins = 820.0;
    float b = th / TAU * bins;
    float bi = floor(b);
    float seg = floor(r * 26.0 + hash2(ivec2(int(bi), 3)) * 4.0);
    float present = step(0.8, hash2(ivec2(int(bi), int(seg))));
    float width = mix(0.0006, 0.0014, hash2(ivec2(int(bi), int(seg) + 911)));
    float across = abs(fract(b) - 0.5) * (TAU / bins) * r;
    float wpx = width / px;
    ray = present * (1.0 - smoothstep(0.5, 1.0, across / width)) * smoothstep(0.5, 1.6, wpx) * step(0.0, c);
  }
  albedo = mix(albedo, albedo * vec3(0.38, 0.33, 0.3), pore * 0.9);
  albedo = mix(albedo, albedo * 1.1 + vec3(0.02, 0.016, 0.01), ray * 0.55);
#endif

  // relief: earlywood worn a hair below latewood, then a step down where the next ring starts
  float x = clamp((f - a0) / (a1 - a0), 0.0, 1.0);
  float slope = 6.0 * x * (1.0 - x) / (a1 - a0);
  float resolve = 1.0 - tiny;
  vec2 gh = relief * slope * g * resolve;
  vec3 nrm = normalize(vec3(-gh.x, 1.0, -gh.y));
#if DETAIL
  nrm = normalize(nrm + vec3(gdir.x, 0.0, gdir.y) * pore * 0.2);
#endif

  vec3 L = normalize(uLight);
  vec3 V = normalize(uEye - vPos);
  vec2 lh = L.xz / max(length(L.xz), 1e-4);
  float lenH = length(L.xz);
  // light from the pith side (travelling outward): each step shades the start of the next ring
  float inward = -dot(lh, gdir);
  float sLen = relief * lenH / max(L.y, 0.06) * max(inward, 0.0) * gl;
  float stepShadow = (1.0 - smoothstep(sLen * 0.4 - aa * 0.5, sLen + aa * 0.5, f)) * step(1e-4, sLen) * step(0.0, c - 0.5);
  stepShadow *= resolve;
  // light from outside: the step's face catches it as a fine bright line
  vec3 stepN = normalize(vec3(gdir.x, 0.8, gdir.y));
  float stepLine = exp(-pow(f / max(aa * 0.8, 1e-3), 2.0)) * resolve * step(0.0, c - 0.5);
  float stepLit = max(dot(stepN, L), 0.0);

  float ndl = max(dot(nrm, L), 0.0);
  float vis = 1.0 - 0.45 * stepShadow;
  float diffuse = mix(ndl, stepLit, stepLine * 0.35) * vis;
  // a little wrap: end grain scatters light under its surface
  diffuse = mix(diffuse, 0.25 + 0.75 * diffuse, 0.25);
  vec3 col = albedo * (uSun * diffuse + uSky * (0.62 + 0.38 * nrm.y) * (1.0 - 0.12 * stepShadow));
  // oil: a broad, soft sheen and a faint tighter coat
  float rough = mix(0.62, 0.5, lm);
  float spec = ggx(nrm, V, L, rough, 0.03) * vis * (1.0 - pore);
  float coat = ggx(normalize(vec3(-gh.x * 0.25, 1.0, -gh.y * 0.25)), V, L, 0.3, 0.025) * vis * (1.0 - 0.7 * pore);
  col += uSun * (spec * 0.35 + coat * 0.16 + ray * spec * 0.4);

  // a knock: a ring of light running out through the grain
  if (uKnock.w > 0.001) {
    float dist = length(xz - uKnock.xy);
    float front = uKnock.z * 1.35;
    float wave = exp(-pow((dist - front) / 0.045, 2.0)) * uKnock.w;
    col += uSun * wave * (0.04 + 0.18 * lm) * (0.6 + 0.4 * ndl);
  }

  vec3 outc = toSRGB(tonemap(col * uExposure));
  selection(outc, uSelB, c, aa, th, r, px);
  selection(outc, uSelA, c, aa, th, r, px);
  outColor = vec4(outc, 1.0);
}
`;
}

/* ---------------------------------------------------------------------- */
/* bark                                                                    */
/* ---------------------------------------------------------------------- */

export const BARK_FS = /* glsl */ `#version 300 es
${COMMON}
uniform vec3 uLight;
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uEye;
uniform float uExposure;
uniform float uBump;
in vec3 vPos;
in vec3 vNrm;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec3 N = normalize(vNrm);
  float th = vUv.x * TAU;
  float v = vUv.y;
  vec2 ring = vec2(sin(th), -cos(th));

  // fissures: noise on a fixed cylinder (stable while the trunk grows), stretched along the grain
  float height;
  vec3 albedo;
  if (v < 1.05) {
    // the top of the bark: cambium, inner bark, then the broken outer bark
    vec3 p = vec3(ring * 46.0, v * 6.0);
    float n1 = vnoise3(p);
    float n2 = vnoise3(p * 2.7 + 11.0);
    float plates = smoothstep(0.35, 0.75, n1 * 0.7 + n2 * 0.3);
    height = plates * smoothstep(0.3, 0.6, v);
    vec3 cambium = srgb(222.0, 204.0, 164.0);
    vec3 inner = srgb(124.0, 80.0, 52.0);
    vec3 outer = mix(srgb(66.0, 55.0, 48.0), srgb(118.0, 105.0, 94.0), plates);
    albedo = mix(cambium, inner, smoothstep(0.025, 0.06, v));
    albedo = mix(albedo, outer, smoothstep(0.14, 0.3, v));
    albedo *= 0.9 + 0.2 * n2;
  } else {
    // the side: long vertical ridges and deep furrows
    vec3 p = vec3(ring * 40.0, vPos.y * 9.0);
    float n1 = vnoise3(p);
    float n2 = vnoise3(p * vec3(2.3, 2.3, 1.6) + 7.0);
    float ridge = 1.0 - abs(2.0 * (n1 * 0.75 + n2 * 0.25) - 1.0);
    ridge = smoothstep(0.25, 0.9, ridge);
    height = ridge;
    albedo = mix(srgb(46.0, 38.0, 33.0), srgb(118.0, 104.0, 92.0), ridge);
    albedo *= 0.88 + 0.24 * vnoise3(p * 4.1 + 3.0);
  }

  // bump (surface gradient from screen derivatives)
  vec3 dpdx = dFdx(vPos);
  vec3 dpdy = dFdy(vPos);
  float dhx = dFdx(height);
  float dhy = dFdy(height);
  vec3 r1 = cross(dpdy, N);
  vec3 r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  vec3 bumped = normalize(abs(det) * N - grad * uBump);
  N = abs(det) > 1e-12 ? bumped : N;

  vec3 L = normalize(uLight);
  vec3 V = normalize(uEye - vPos);
  float ndl = max(dot(N, L), 0.0);
  // the floor occludes the foot of the side
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.06, vPos.y)) * (0.75 + 0.25 * height);
  vec3 col = albedo * (uSun * ndl + uSky * (0.55 + 0.45 * N.y) * ao);
  col += uSun * ggx(N, V, L, 0.7, 0.03) * 0.25;
  outColor = vec4(toSRGB(tonemap(col * uExposure)), 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* loupe                                                                   */
/* ---------------------------------------------------------------------- */

export const LOUPE_FS = /* glsl */ `#version 300 es
${COMMON}
uniform sampler2D uView;
uniform vec2 uCentre;   // device px (y up)
uniform float uR;       // outer radius (device px)
uniform float uRim;     // rim width (device px)
uniform vec2 uShadowOff;
uniform float uShadowA;
uniform vec2 uLightDir; // toward the light, on screen (y up)
uniform float uDark;
uniform float uShow;
out vec4 outColor;

void main() {
  vec2 p = gl_FragCoord.xy - uCentre;
  float d = length(p);
  float R = uR;
  float Rg = max(R - uRim, 1.0);
  float edge = 1.0 - smoothstep(R - 0.8, R + 0.8, d);
  float sd = length(p - uShadowOff);
  float shadow = (1.0 - smoothstep(R * 0.7, R * 1.28, sd)) * uShadowA * uShow;
  if (edge <= 0.0 && shadow <= 0.002) discard;

  vec2 dir = d > 1e-3 ? p / d : vec2(0.0, 1.0);
  float rho = clamp(d / Rg, 0.0, 1.0);
  vec3 col;
  if (d < Rg + 0.5) {
    // glass: the magnified view, a little barrel at the edge and a colour fringe
    float k = 1.0 + 0.16 * rho * rho * rho;
    float ca = 0.014 * rho * rho;
    vec2 base = p / (2.0 * Rg);
    vec3 view;
    view.r = texture(uView, clamp(0.5 + base * k * (1.0 + ca), 0.0, 1.0)).r;
    view.g = texture(uView, clamp(0.5 + base * k, 0.0, 1.0)).g;
    view.b = texture(uView, clamp(0.5 + base * k * (1.0 - ca), 0.0, 1.0)).b;
    col = view;
    // inner edge shadow and the glass's own faint tint
    col *= 1.0 - 0.28 * smoothstep(0.78, 1.0, rho);
    // reflections: a soft crescent on the light's side, a small hot glint, a faint one opposite
    float facing = dot(dir, uLightDir);
    float crescent = smoothstep(0.72, 0.98, rho) * pow(max(facing, 0.0), 3.0);
    col += vec3(1.0, 0.98, 0.95) * crescent * mix(0.22, 0.16, uDark);
    vec2 gp = p - uLightDir * Rg * 0.6;
    float glint = exp(-dot(gp, gp) / (Rg * Rg * 0.0025));
    col += vec3(1.0) * glint * 0.3;
    col += vec3(1.0) * smoothstep(0.82, 0.98, rho) * pow(max(-facing, 0.0), 4.0) * 0.08;
  } else {
    // the steel rim: lit on the light's side, with a bright bevel and a dark lip
    float t = clamp((d - Rg) / uRim, 0.0, 1.0);
    float facing = dot(dir, uLightDir);
    float lit = 0.5 + 0.5 * facing;
    vec3 steelDark = mix(vec3(0.36, 0.37, 0.39), vec3(0.16, 0.15, 0.15), uDark);
    vec3 steelLight = mix(vec3(0.92, 0.92, 0.93), vec3(0.62, 0.56, 0.48), uDark);
    col = mix(steelDark, steelLight, pow(lit, 1.6));
    float bevel = exp(-pow((t - 0.3) / 0.16, 2.0));
    col += bevel * 0.35 * (0.35 + 0.65 * lit);
    col *= 1.0 - 0.35 * smoothstep(0.75, 1.0, t);
    col *= 1.0 - 0.3 * exp(-pow(t / 0.08, 2.0));
  }
  float a = edge * uShow;
  outColor = vec4(col * a, a + shadow * (1.0 - a));
}
`;
