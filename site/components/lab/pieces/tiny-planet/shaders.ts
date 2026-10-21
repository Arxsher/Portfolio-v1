// GLSL for the tiny planet (WebGL2). Lighting happens in world space: the
// camera sits on +z looking at the planet's centre, the sun is a direction.
//
// Passes, in order: backdrop (studio colour, stars after dark) → land →
// pines → moon → clouds → sea (blended over the sea floor) → orbit dots →
// town lights (additive) → atmosphere (a shell whose fragments integrate
// the air along each view ray analytically).

const HEADER = `#version 300 es
precision highp float;
precision highp int;
`;

/** Uniforms shared by the surface passes. */
const SHARED = `
uniform mat4 uViewProj;
uniform mat3 uRot;      // planet: model → world (rotation × radius)
uniform vec3 uBulge;    // model-space stretch from spinning (equator out, poles in)
uniform vec3 uSun;      // toward the sun (unit, world)
uniform vec3 uCam;      // camera position (world)
uniform float uTime;
uniform float uDark;    // 0 light theme … 1 dark theme
uniform vec4 uMoon;     // moon centre (world) and radius
uniform vec4 uBanks[16];
uniform int uBankCount;
`;

/** Light on a surface point: the sun with its twilight colour, sky fill, cloud and moon shadows. */
const LIGHT = `
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }

/** A soft exposure curve, then back to sRGB. */
vec3 finish(vec3 c) {
  c = 1.0 - exp(-c * 1.6);
  return pow(c, vec3(1.0 / 2.2));
}

/** The sun's colour on the ground: white by day, amber and rose along the terminator. */
vec3 sunColour(float h) {
  vec3 low = vec3(1.0, 0.46, 0.26);
  vec3 mid = vec3(1.0, 0.78, 0.56);
  vec3 high = vec3(1.0, 0.97, 0.92);
  return mix(mix(low, mid, smoothstep(-0.06, 0.12, h)), high, smoothstep(0.1, 0.42, h));
}

float bankShadow(vec3 p) {
  float s = 1.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uBankCount) break;
    vec4 b = uBanks[i];
    vec3 d = b.xyz - p;
    float t = dot(d, uSun);
    if (t <= 0.0) continue;
    float dist = length(d - uSun * t);
    s *= 1.0 - 0.42 * smoothstep(b.w, b.w * 0.32, dist);
  }
  return s;
}

float moonShadow(vec3 p) {
  vec3 d = uMoon.xyz - p;
  float t = dot(d, uSun);
  if (t <= 0.0) return 1.0;
  float dist = length(d - uSun * t);
  return mix(0.18, 1.0, smoothstep(uMoon.w * 0.6, uMoon.w * 1.5, dist));
}

/** Daylight 0..1, measured on the sphere so the terminator stays smooth across facets. */
float dayAt(vec3 sn) { return smoothstep(-0.1, 0.12, dot(sn, uSun)); }

vec3 ambientAt(vec3 sn, vec3 n) {
  float h = dot(sn, uSun);
  vec3 nightLight = mix(vec3(0.03, 0.04, 0.075), vec3(0.0045, 0.006, 0.013), uDark);
  vec3 dayLight = vec3(0.17, 0.2, 0.25);
  vec3 a = mix(nightLight, dayLight, smoothstep(-0.2, 0.32, h));
  // facets turned up toward open sky get a little more fill
  return a * (0.72 + 0.28 * max(dot(n, sn), 0.0));
}

vec3 lightAt(vec3 n, vec3 sn, float shade) {
  float h = dot(sn, uSun);
  float day = dayAt(sn);
  float diff = clamp(dot(n, uSun) * 0.82 + 0.18, 0.0, 1.0) * day * shade;
  return sunColour(h) * diff * 1.18 + ambientAt(sn, n);
}
`;

/* ---------------------------------------------------------------------- */
/* backdrop                                                                */
/* ---------------------------------------------------------------------- */

export const BACKDROP_VS = `${HEADER}
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 1.0, 1.0);
}
`;

export const BACKDROP_FS = `${HEADER}
in vec2 vUv;
uniform vec3 uBg;
uniform vec2 uRes;      // CSS px
uniform vec2 uCenter;   // planet centre, CSS px from the top left
uniform float uRadius;  // planet radius, CSS px
uniform float uDark;
uniform float uTime;
uniform float uStars;
out vec4 o;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 bg = uBg;
  float d = length(px - uCenter) / uRadius;
  // by day: a faint pool of light behind the planet, like a studio sweep
  bg = mix(bg, min(bg * 1.035 + 0.01, vec3(1.0)), (1.0 - uDark) * exp(-d * d * 0.16) * 0.9);
  // after dark: a slow dust of stars, thinning toward the planet
  if (uStars > 0.001) {
    float cell = 30.0;
    vec2 g = floor(px / cell);
    float s = 0.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = g + vec2(float(i), float(j));
        float h = hash(c);
        if (h < 0.6) continue;
        vec2 at = (c + vec2(hash(c + 7.1), hash(c + 3.7))) * cell;
        float size = mix(0.5, 1.25, hash(c + 1.3));
        float r = length(px - at);
        float tw = 0.65 + 0.35 * sin(uTime * (0.6 + hash(c + 9.2) * 1.6) + h * 30.0);
        s += smoothstep(size + 0.6, size - 0.4, r) * (h - 0.6) * 2.5 * tw;
      }
    }
    s *= smoothstep(1.05, 1.6, d);
    bg += vec3(1.0, 0.94, 0.86) * s * 0.75 * uStars;
  }
  o = vec4(bg, 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* land                                                                    */
/* ---------------------------------------------------------------------- */

export const LAND_VS = `${HEADER}${SHARED}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColour;
out vec3 vW;
out vec3 vN;
out vec3 vS;
out vec3 vC;
void main() {
  vec3 m = aPos * uBulge;
  vW = uRot * m;
  vN = uRot * aNormal;
  vS = uRot * aPos;
  vC = aColour;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`;

export const LAND_FS = `${HEADER}${SHARED}${LIGHT}
in vec3 vW;
in vec3 vN;
in vec3 vS;
in vec3 vC;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  vec3 sn = normalize(vS);
  float shade = bankShadow(vW) * moonShadow(vW);
  vec3 c = toLinear(vC) * lightAt(n, sn, shade);
  o = vec4(finish(c), 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* pines                                                                   */
/* ---------------------------------------------------------------------- */

export const PINE_VS = `${HEADER}${SHARED}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aPart;
layout(location = 3) in vec4 aBase;   // base (model), height
layout(location = 4) in vec4 aTint;   // colour, seed
uniform vec3 uAir;                    // the air's lag (world rotation vector)
uniform float uSway;
out vec3 vW;
out vec3 vN;
out vec3 vS;
out vec3 vC;
void main() {
  vec3 up = normalize(aBase.xyz);
  vec3 ref = abs(up.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(ref, up));
  vec3 b = cross(up, t);
  float a = aTint.w * 6.2832;
  float ca = cos(a), sa = sin(a);
  vec2 xz = vec2(ca * aPos.x - sa * aPos.z, sa * aPos.x + ca * aPos.z);
  vec2 nxz = vec2(ca * aNormal.x - sa * aNormal.z, sa * aNormal.x + ca * aNormal.z);
  float hgt = aBase.w;
  vec3 m = aBase.xyz * uBulge + (t * xz.x + up * aPos.y + b * xz.y) * hgt;
  vec3 w = uRot * m;
  // lean with the air sliding over the ground, plus a breath of sway
  vec3 baseW = uRot * aBase.xyz;
  vec3 upW = normalize(baseW);
  vec3 wind = cross(uAir, baseW);
  wind -= upW * dot(wind, upW);
  float bend = max(aPos.y, 0.0);
  bend *= bend;
  float sway = sin(uTime * 1.9 + aTint.w * 37.0) * uSway;
  vec3 side = uRot * t;
  w += (wind * 2.3 + normalize(side) * sway * length(uRot[0])) * bend * hgt;
  vW = w;
  vN = uRot * (t * nxz.x + up * aNormal.y + b * nxz.y);
  vS = baseW;
  vC = mix(aTint.rgb, vec3(0.42, 0.31, 0.22), aPart);
  gl_Position = uViewProj * vec4(w, 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* clouds                                                                  */
/* ---------------------------------------------------------------------- */

export const CLOUD_VS = `${HEADER}${SHARED}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aPuff;   // centre (model), radius
layout(location = 3) in vec4 aMore;   // flatness, drift (rad/s), shade, seed
uniform mat3 uCloudRot;               // the cloud layer: lag × planet × radius
out vec3 vW;
out vec3 vN;
out vec3 vS;
out float vShade;
void main() {
  float a = aMore.y * uTime;
  float c = cos(a), s = sin(a);
  vec3 ctr = vec3(c * aPuff.x + s * aPuff.z, aPuff.y, -s * aPuff.x + c * aPuff.z);
  vec3 up = normalize(ctr);
  vec3 ref = abs(up.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(ref, up));
  vec3 b = cross(up, t);
  vec3 local = aPos * aPuff.w;
  // a puff breathes very slightly
  float breathe = 1.0 + 0.04 * sin(uTime * 0.5 + aMore.w * 20.0);
  vec3 m = ctr * uBulge + (t * local.x + up * (local.y * aMore.x) + b * local.z) * breathe;
  vW = uCloudRot * m;
  vN = uCloudRot * (t * aNormal.x + up * (aNormal.y / aMore.x) + b * aNormal.z);
  vS = uCloudRot * ctr;
  vShade = aMore.z;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`;

export const CLOUD_FS = `${HEADER}${SHARED}${LIGHT}
in vec3 vW;
in vec3 vN;
in vec3 vS;
in float vShade;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  vec3 sn = normalize(vS);
  float h = dot(sn, uSun);
  float day = smoothstep(-0.2, 0.16, h);
  float diff = clamp(dot(n, uSun) * 0.6 + 0.4, 0.0, 1.0) * day * moonShadow(vW);
  vec3 nightLight = mix(vec3(0.075, 0.085, 0.125), vec3(0.008, 0.009, 0.017), uDark);
  vec3 amb = mix(nightLight, vec3(0.3, 0.33, 0.39), smoothstep(-0.22, 0.3, h)) * (0.75 + 0.25 * max(dot(n, sn), 0.0));
  vec3 c = vec3(0.92) * vShade * (sunColour(h) * diff * 1.45 + amb * 1.25);
  o = vec4(finish(c), 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* sea                                                                     */
/* ---------------------------------------------------------------------- */

export const SEA_VS = `${HEADER}${SHARED}
layout(location = 0) in vec3 aPos;
layout(location = 1) in float aDepth;
uniform float uWave;
out vec3 vW;
out vec3 vS;
out float vD;
void main() {
  vec3 p = aPos;
  float w = sin(dot(p, vec3(13.1, 7.3, -9.7)) * 1.6 + uTime * 1.25)
          + sin(dot(p, vec3(-8.4, 12.7, 6.1)) * 1.9 - uTime * 1.05)
          + 0.6 * sin(dot(p, vec3(5.2, -9.9, 14.3)) * 2.6 + uTime * 1.7);
  vec3 m = p * (1.0 + w * uWave) * uBulge;
  vW = uRot * m;
  vS = uRot * p;
  vD = aDepth;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`;

export const SEA_FS = `${HEADER}${SHARED}${LIGHT}
in vec3 vW;
in vec3 vS;
in float vD;
out vec4 o;
void main() {
  vec3 sn = normalize(vS);
  vec3 fn = normalize(cross(dFdx(vW), dFdy(vW)));
  if (dot(fn, sn) < 0.0) fn = -fn;
  vec3 n = normalize(mix(sn, fn, 0.75));
  vec3 v = normalize(uCam - vW);
  float deep = smoothstep(0.0, 0.05, vD);
  vec3 water = mix(vec3(0.14, 0.56, 0.6), vec3(0.028, 0.15, 0.3), deep);
  float alpha = mix(0.34, 0.93, smoothstep(0.0, 0.028, vD));
  float shade = bankShadow(vW) * moonShadow(vW);
  float h = dot(sn, uSun);
  float day = dayAt(sn);
  vec3 c = water * lightAt(n, sn, shade);
  // the sky in the water at grazing angles
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 sky = mix(vec3(0.02, 0.03, 0.06), vec3(0.45, 0.62, 0.85), smoothstep(-0.2, 0.3, h));
  c = mix(c, sky, fres * 0.55);
  // the sun's glint, broken up by the facets
  vec3 hv = normalize(uSun + v);
  float spec = pow(max(dot(n, hv), 0.0), 320.0) * day * shade;
  float sheen = pow(max(dot(sn, hv), 0.0), 90.0) * day * shade;
  c += sunColour(h) * (spec * 1.5 + sheen * 0.06);
  alpha = clamp(max(alpha, spec * 1.5 + fres * 0.4), 0.0, 1.0);
  o = vec4(finish(c) * alpha, alpha);
}
`;

/* ---------------------------------------------------------------------- */
/* moon                                                                    */
/* ---------------------------------------------------------------------- */

export const MOON_VS = `${HEADER}${SHARED}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColour;
uniform mat3 uMoonRot;  // spin × radius
out vec3 vW;
out vec3 vN;
out vec3 vC;
void main() {
  vW = uMoon.xyz + uMoonRot * aPos;
  vN = uMoonRot * aNormal;
  vC = aColour;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`;

export const MOON_FS = `${HEADER}${SHARED}${LIGHT}
in vec3 vW;
in vec3 vN;
in vec3 vC;
uniform float uPlanetR;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  // the planet's shadow (an eclipse when the moon passes behind it)
  float shade = 1.0;
  float t = dot(-vW, uSun);
  if (t > 0.0) {
    float dist = length(-vW - uSun * t);
    shade = smoothstep(uPlanetR * 0.9, uPlanetR * 1.12, dist);
  }
  float diff = clamp(dot(n, uSun) * 0.9 + 0.1, 0.0, 1.0) * shade;
  vec3 amb = mix(vec3(0.07, 0.075, 0.1), vec3(0.03, 0.032, 0.045), uDark);
  vec3 c = toLinear(vC) * (vec3(1.0, 0.97, 0.93) * diff * 1.25 + amb);
  o = vec4(finish(c), 1.0);
}
`;

/* ---------------------------------------------------------------------- */
/* town lights                                                             */
/* ---------------------------------------------------------------------- */

export const LIGHTS_VS = `${HEADER}${SHARED}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aInfo;   // comes on at (sun height), seed, size
uniform float uPx;                    // point size for size 1 (device px)
uniform float uLights;                // 0..1 overall
out float vI;
void main() {
  vec3 w = uRot * (aPos * uBulge);
  vec3 sn = normalize(uRot * aPos);
  float h = dot(sn, uSun);
  float on = smoothstep(aInfo.x + 0.03, aInfo.x - 0.015, h);
  vec3 v = normalize(uCam - w);
  float facing = dot(sn, v);
  float tw = 0.8 + 0.2 * sin(uTime * (0.8 + aInfo.y * 2.4) + aInfo.y * 61.0);
  vI = on * smoothstep(0.03, 0.32, facing) * tw * uLights;
  gl_PointSize = vI < 0.004 ? 0.0 : uPx * aInfo.z * (0.6 + 0.4 * on);
  gl_Position = uViewProj * vec4(w + v * 0.022 * length(uRot[0]), 1.0);
}
`;

export const LIGHTS_FS = `${HEADER}
in float vI;
out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 16.0);
  float halo = exp(-r2 * 3.6) * (1.0 - r2);
  vec3 col = vec3(1.0, 0.86, 0.56) * core * 1.25 + vec3(1.0, 0.6, 0.26) * halo * 0.38;
  o = vec4(col * vI, 0.0);
}
`;

/* ---------------------------------------------------------------------- */
/* the moon's orbit, dotted                                                */
/* ---------------------------------------------------------------------- */

export const DOTS_VS = `${HEADER}
layout(location = 0) in float aAngle;
uniform mat4 uViewProj;
uniform vec3 uU;        // orbit axes × radius
uniform vec3 uV;
uniform vec4 uMoon;
uniform float uDot;     // device px
out float vA;
void main() {
  vec3 w = uU * cos(aAngle) + uV * sin(aAngle);
  float gap = distance(w, uMoon.xyz);
  // the dots step aside around the moon, and thin out toward the back
  vA = smoothstep(uMoon.w * 1.5, uMoon.w * 2.9, gap) * mix(0.55, 1.0, smoothstep(-1.0, 0.6, w.z / length(uV)));
  gl_PointSize = uDot;
  gl_Position = uViewProj * vec4(w, 1.0);
}
`;

export const DOTS_FS = `${HEADER}
in float vA;
uniform vec4 uColour;   // sRGB, alpha
out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float a = smoothstep(1.0, 0.45, dot(c, c)) * uColour.a * vA;
  o = vec4(uColour.rgb * a, a);
}
`;

/* ---------------------------------------------------------------------- */
/* atmosphere                                                              */
/* ---------------------------------------------------------------------- */

export const AIR_VS = `${HEADER}
layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
uniform float uShell;   // shell radius (world)
out vec3 vW;
void main() {
  vW = aPos * uShell;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`;

export const AIR_FS = `${HEADER}
in vec3 vW;
uniform vec3 uSun;
uniform vec3 uCam;
uniform float uPlanetR;
uniform float uDark;
uniform float uGlow;
out vec4 o;
void main() {
  vec3 rd = normalize(vW - uCam);
  float tca = -dot(uCam, rd);
  vec3 cp = uCam + rd * tca;
  float b = length(cp) / uPlanetR;
  const float H = 0.06;
  float depth;
  vec3 n;
  if (b < 1.0) {
    float thc = sqrt(1.0 - b * b) * uPlanetR;
    vec3 hit = uCam + rd * (tca - thc);
    n = normalize(hit);
    float mu = max(dot(n, -rd), 0.0);
    // looking down through the air onto the ground: only a thin veil, thickening toward the rim
    depth = H / max(mu, 0.1) * mix(0.35, 1.0, smoothstep(0.55, 0.98, b));
  } else {
    n = normalize(cp);
    depth = exp(-(b - 1.0) / H) * sqrt(6.2832 * b * H);
  }
  float h = dot(n, uSun);
  float lit = smoothstep(-0.32, 0.2, h);
  vec3 blue = mix(vec3(0.5, 0.72, 1.0), vec3(0.42, 0.62, 1.0), uDark);
  vec3 dusk = vec3(1.0, 0.52, 0.3);
  vec3 col = mix(dusk, blue, smoothstep(-0.1, 0.3, h));
  // light coming through the air from behind the planet
  float forward = pow(max(dot(rd, uSun), 0.0), 5.0) * smoothstep(-0.4, 0.05, h);
  float a = (1.0 - exp(-depth * mix(2.0, 2.6, uDark))) * (lit + forward * 1.4) * uGlow;
  a = clamp(a, 0.0, 1.0);
  // lighter, airier on the light studio; a glow on the dark
  vec3 c = mix(col * 0.98 + 0.04, col, uDark);
  o = vec4(c * a * mix(0.85, 1.0, uDark), a * mix(0.72, 0.55, uDark));
}
`;
