// GLSL for the night train. Every lit program shares one uniform block
// (the camera, the hour's light, the train's lamps), so a pass binds one
// buffer and draws. The passes (renderer.ts):
//
//   shadow   depth from the key light (the sun, or the moon after dark)
//   mirror   the scene reflected in the river's plane, at half size
//   main     sky, ground, viaduct, hamlet, pines, train, then the water
//            (which reads the mirror through its ripples)
//   beams    the headlights' cones in the air, marched at half size
//   bloom    a down/up chain of soft glow
//   final    exposure, filmic curve, grade, grain
//
// Colours are linear and unbounded until the final pass. Where the device
// can't render to float targets they are stored in 8 bits through ENCODE /
// DECODE (a square-root curve with headroom), which keeps night skies free
// of banding.

import { ARC_CZ, ARC_R, CAR_SCALE_Y, CAR_SCALE_Z, DECK_Y, HALF_W } from "./world";

export type ShaderOptions = { hdr: boolean; tile: boolean };

const header = ({ hdr, tile }: ShaderOptions) => `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DShadow;
#define HDR ${hdr ? 1 : 0}
#define TILE ${tile ? 1 : 0}
`;

/** The frame block: 40 vec4s (std140, everything padded to vec4). Keep in step with renderer.ts. */
const FRAME = /* glsl */ `
layout(std140) uniform Frame {
  mat4 uViewProj;
  mat4 uInvViewProj;
  mat4 uShadowMat;
  vec4 uCam;        // xyz eye, w time
  vec4 uKeyDir;     // xyz to the key light, w shadow texel (world)
  vec4 uKeyCol;     // rgb, w 1 in the mirror pass
  vec4 uSunDir;     // xyz, w disc scale
  vec4 uSunCol;     // rgb, w elevation (degrees)
  vec4 uMoonDir;    // xyz, w night
  vec4 uMoonCol;    // rgb, w dark (how much the air shows lamps)
  vec4 uZenith;     // rgb, w stars
  vec4 uHorizon;    // rgb, w mist
  vec4 uGlow;       // rgb, w haze density
  vec4 uSkyAmb;     // rgb, w hamlet windows (0..1 of them lit)
  vec4 uGroundAmb;  // rgb, w radians per pixel
  vec4 uHaze;       // rgb, w cloud drift
  vec4 uCloudLit;   // rgb, w motion (0 frozen)
  vec4 uCloudShade; // rgb, w unused
  vec4 uHeadPos;    // xyz, w strength
  vec4 uHeadDir;
  vec4 uHead2Pos;
  vec4 uHead2Dir;
  vec4 uCarLights[8];
  vec4 uMisc;       // x car lights, y train window glow, z unused, w unused
};
`;

const ENCODE = /* glsl */ `
vec4 encodeColor(vec3 c) {
#if HDR
  return vec4(c, 1.0);
#else
  return vec4(sqrt(clamp(c / 16.0, 0.0, 1.0)), 1.0);
#endif
}
vec3 decodeColor(vec3 c) {
#if HDR
  return c;
#else
  return c * c * 16.0;
#endif
}
`;

const NOISE = /* glsl */ `
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
float fbm4(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 3.7);
    a *= 0.5;
  }
  return s / 0.9375;
}
/** Value noise with its gradient (xy) and value (z). */
vec3 noised(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k1 = b - a;
  float k2 = c - a;
  float k4 = a - b - c + d;
  return vec3(du * vec2(k1 + k4 * u.y, k2 + k4 * u.x), a + k1 * u.x + k2 * u.y + k4 * u.x * u.y);
}
`;

/** The sky, the haze and the fog: shared by the sky pass and every surface. */
const ATMOSPHERE = /* glsl */ `
const float PI = 3.14159265;

/** The clear sky toward d (no sun disc, clouds, stars or moon). */
vec3 skyBase(vec3 d) {
  float h = max(d.y, 0.0);
  vec3 col = mix(uHorizon.rgb, uZenith.rgb, pow(h, 0.45));
  // a brighter band right on the horizon
  col += uHorizon.rgb * 0.22 * exp(-h * 22.0);
  // the glow around the sun: forward scattering, strongest low down
  float mu = max(dot(d, uSunDir.xyz), 0.0);
  float mie = 0.12 * mu + 0.55 * pow(mu, 9.0) + 1.5 * pow(mu, 90.0);
  col += uGlow.rgb * mie * (0.45 + 0.55 * exp(-h * 4.0));
  // the side away from the sun is a touch cooler and dimmer
  col *= 0.88 + 0.12 * (0.5 + 0.5 * dot(normalize(vec2(d.x, d.z) + 1e-4), normalize(uSunDir.xz + 1e-4)));
  // the moon's halo
  float mm = max(dot(d, uMoonDir.xyz), 0.0);
  col += vec3(0.05, 0.065, 0.1) * uMoonDir.w * (pow(mm, 60.0) * 0.8 + pow(mm, 8.0) * 0.15);
  return col;
}

/** The haze toward d (what distant things fade into). */
vec3 hazeColor(vec3 d) {
  vec3 level = normalize(vec3(d.x, 0.035 + max(d.y, 0.0) * 0.35, d.z));
  return mix(uHaze.rgb, skyBase(level), 0.62);
}

/** Fog and river mist over a surface at P lit to col. */
vec3 fogged(vec3 col, vec3 P) {
  vec3 v = P - uCam.xyz;
  float dist = length(v);
  vec3 d = v / max(dist, 1e-4);
  float lift = exp(-max(min(P.y, 60.0), 0.0) * 0.012);
  float f = 1.0 - exp(-dist * uGlow.w * lift);
  col = mix(col, hazeColor(d), f);
  // mist lying on the water after sundown
  float m = uHorizon.w * (1.0 - exp(-dist * 0.014)) * exp(-max(P.y, 0.0) / 3.5) * 0.26;
  col = mix(col, uHaze.rgb * 1.1 + uMoonCol.rgb * 0.12, m);
  return col;
}

/** Coverage and colour of the cloud deck toward d (d.y > 0). */
vec4 clouds(vec3 d) {
  if (d.y <= 0.0) return vec4(0.0);
  vec2 p = d.xz / (d.y + 0.07) * 0.75 + vec2(uHaze.w * 0.012, uHaze.w * 0.004);
  float n = fbm4(p * 1.35 + vec2(3.0, 9.0));
  float n2 = vnoise(p * 6.0 + 2.0);
  float shape = n + 0.12 * (n2 - 0.5);
  float cover = smoothstep(0.56, 0.79, shape);
  // thinner toward the horizon, none overhead-ish
  cover *= smoothstep(0.012, 0.09, d.y) * (1.0 - smoothstep(0.5, 0.8, d.y));
  if (cover <= 0.0) return vec4(0.0);
  float thin = 1.0 - smoothstep(0.53, 0.68, shape);
  float mu = max(dot(d, uSunDir.xyz), 0.0);
  float toward = pow(mu, 5.0);
  // lit from below near the horizon at golden hour and dusk
  float low = exp(-d.y * 9.0);
  vec3 lit = uCloudLit.rgb * (0.55 + 0.45 * thin + 1.6 * toward * thin);
  vec3 base = mix(uCloudShade.rgb, lit, 0.35 + 0.5 * thin);
  base += uGlow.rgb * low * 0.45 * (0.4 + thin);
  // silvered by the moon at night
  float mm = pow(max(dot(d, uMoonDir.xyz), 0.0), 6.0);
  base += vec3(0.05, 0.06, 0.09) * uMoonDir.w * (0.3 + 0.7 * thin) * (0.4 + mm);
  return vec4(base, cover * 0.92);
}

float starField(vec3 d, float scale, float keep, float seed) {
  vec2 sph = vec2(atan(d.x, d.z), asin(clamp(d.y, -1.0, 1.0)));
  vec2 g = sph * scale;
  vec2 id = floor(g);
  float r = hash12(id + seed);
  if (r < keep) return 0.0;
  vec2 c = (id + 0.2 + 0.6 * hash22(id + seed + 3.1)) / scale;
  vec2 q = (sph - c);
  q.x *= cos(sph.y);
  float px = uGroundAmb.w;
  float core = exp(-dot(q, q) / (px * px * 0.55));
  float tw = 0.75 + 0.25 * sin(uCam.w * uCloudLit.w * (1.5 + 3.0 * r) + r * 50.0);
  return core * (0.3 + 2.2 * pow((r - keep) / (1.0 - keep), 4.0)) * tw;
}

/** The full sky toward d: base, sun disc, clouds, stars, moon. */
vec3 skyColor(vec3 d, bool disc) {
  vec3 col = skyBase(d);
  // stars, faint ones only once it is properly dark
  if (uZenith.w > 0.0 && d.y > 0.0) {
    float s = starField(d, 150.0, 0.955, 1.7) + starField(d, 280.0, 0.975, 7.3) * smoothstep(0.4, 1.0, uZenith.w) * 0.6;
    col += vec3(0.9, 0.94, 1.0) * s * uZenith.w * smoothstep(0.02, 0.2, d.y) * 0.32;
  }
  // the moon: a lit sphere, its bright side toward the sun
  vec3 md = uMoonDir.xyz;
  float mc = dot(d, md);
  float R = 0.0175;
  if (mc > cos(R * 1.4)) {
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), md));
    vec3 up = cross(md, right);
    vec2 q = vec2(dot(d, right), dot(d, up)) / R;
    float r = length(q);
    float edge = 1.0 - smoothstep(0.92, 1.04, r);
    if (edge > 0.0) {
      vec3 n = normalize(right * q.x + up * q.y - md * sqrt(max(0.0, 1.0 - min(r * r, 1.0))));
      float lit = smoothstep(-0.08, 0.2, dot(n, uSunDir.xyz));
      float seas = smoothstep(0.5, 0.75, vnoise(q * 2.4 + 4.0)) * 0.25 + smoothstep(0.55, 0.8, vnoise(q * 5.0 + 9.0)) * 0.12;
      vec3 face = vec3(1.0, 0.97, 0.9) * (1.0 - seas) * (0.85 + 0.15 * n.z);
      float night = uMoonDir.w;
      vec3 moon = face * lit * mix(0.35, 2.2, night) + vec3(0.02, 0.025, 0.04) * night;
      col = mix(col, max(col * 0.92, moon + col * (1.0 - night) * 0.6), edge * smoothstep(-6.0, 4.0, -uSunCol.w + 2.0));
    }
  }
  vec4 c = clouds(d);
  col = mix(col, c.rgb, c.a);
  // the sun's disc (hidden behind anything in front: the sky is drawn first)
  if (disc) {
    float mu = dot(d, uSunDir.xyz);
    float r = 0.0125 * uSunDir.w;
    float k = smoothstep(cos(r * 1.08), cos(r * 0.92), mu);
    if (k > 0.0) {
      float limb = 0.75 + 0.25 * sqrt(max(0.0, 1.0 - pow(acos(min(mu, 1.0)) / r, 2.0)));
      vec3 sun = uSunCol.rgb * 14.0 * limb + vec3(2.0, 1.4, 0.8) * smoothstep(-1.5, 1.0, uSunCol.w);
      col = mix(col, sun * (1.0 - c.a * 0.85), k);
    }
  }
  return col;
}
`;

/** Lighting shared by the lit surfaces. */
const LIGHTING = /* glsl */ `
uniform sampler2DShadow uShadow;

float shadowAt(vec3 P, vec3 n) {
  vec3 offset = n * uKeyDir.w * 1.6 + uKeyDir.xyz * uKeyDir.w * 0.8;
  vec4 s = uShadowMat * vec4(P + offset, 1.0);
  vec3 c = s.xyz / s.w * 0.5 + 0.5;
  if (c.x <= 0.001 || c.x >= 0.999 || c.y <= 0.001 || c.y >= 0.999 || c.z >= 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(uShadow, 0));
  float sum = 0.0;
  sum += texture(uShadow, vec3(c.xy + vec2(-0.6, -1.3) * t, c.z));
  sum += texture(uShadow, vec3(c.xy + vec2(1.3, -0.6) * t, c.z));
  sum += texture(uShadow, vec3(c.xy + vec2(0.6, 1.3) * t, c.z));
  sum += texture(uShadow, vec3(c.xy + vec2(-1.3, 0.6) * t, c.z));
#if !TILE
  sum += texture(uShadow, vec3(c.xy, c.z)) * 2.0;
  return sum / 6.0;
#else
  return sum / 4.0;
#endif
}

/** Warm light from the lit carriages, and the headlights (spot + a little spill). */
vec3 lamps(vec3 P, vec3 n) {
  vec3 sum = vec3(0.0);
  int count = int(uMisc.x);
  for (int i = 0; i < 8; i++) {
    if (i >= count) break;
    vec4 L = uCarLights[i];
    vec3 d = L.xyz - P;
    float d2 = dot(d, d);
    if (d2 > 110.0) continue;
    float ndl = max(dot(n, d * inversesqrt(d2)), 0.0) * 0.75 + 0.25;
    sum += vec3(1.0, 0.6, 0.3) * (L.w * 2.4 * ndl / (1.0 + d2 * 0.45)) * (1.0 - smoothstep(60.0, 110.0, d2));
  }
  for (int k = 0; k < 2; k++) {
    vec4 hp = k == 0 ? uHeadPos : uHead2Pos;
    if (hp.w <= 0.0) continue;
    vec3 hd = k == 0 ? uHeadDir.xyz : uHead2Dir.xyz;
    vec3 d = P - hp.xyz;
    float dist = length(d);
    vec3 l = d / max(dist, 1e-3);
    float cone = smoothstep(0.958, 0.993, dot(l, hd));
    float ndl = max(dot(n, -l), 0.0);
    // the lamp rides above the deck, which hides anything it would have to
    // look down at by more than a few degrees (there is no shadow map for it)
    float over = smoothstep(-0.085, -0.045, l.y);
    float fromLine = abs(length(vec2(P.x, ${ARC_CZ.toFixed(1)} - P.z)) - ${ARC_R.toFixed(1)});
    over *= 1.0 - step(fromLine, ${(HALF_W + 0.6).toFixed(2)}) * step(P.y, ${(DECK_Y - 0.25).toFixed(2)});
    sum += vec3(1.0, 0.93, 0.8) * hp.w * (cone * over * 3.2 / (1.0 + dist * dist * 0.005) + 0.9 / (1.0 + dist * dist * 0.6)) * (ndl * 0.85 + 0.15);
  }
  return sum;
}

/** Sun (or moon) with shadow, sky and ground ambient, the lamps. wrap: light through thin leaves. */
vec3 shade(vec3 albedo, vec3 n, vec3 P, float ao, float wrap, float spec) {
  float sh = shadowAt(P, n);
  float ndl = dot(n, uKeyDir.xyz);
  float diff = max(ndl, 0.0);
  diff = mix(diff, max(ndl * 0.5 + 0.5, 0.0) * 0.8, wrap);
  vec3 key = uKeyCol.rgb * diff * sh;
  vec3 amb = mix(uGroundAmb.rgb, uSkyAmb.rgb, n.y * 0.5 + 0.5);
  // the sky is brighter toward the sun
  amb += uGlow.rgb * 0.07 * max(dot(n, normalize(vec3(uSunDir.x, 0.25, uSunDir.z))), 0.0);
  vec3 col = albedo * (key + amb * ao) + albedo * lamps(P, n) * mix(1.0, ao, 0.5);
  if (spec > 0.0) {
    vec3 V = normalize(uCam.xyz - P);
    vec3 H = normalize(V + uKeyDir.xyz);
    col += uKeyCol.rgb * pow(max(dot(n, H), 0.0), 60.0) * spec * sh * diff;
  }
  return col;
}

/** A normal that faces the eye (meshes built in one go don't all agree on winding). */
vec3 facing(vec3 n, vec3 P) {
  return dot(n, uCam.xyz - P) < 0.0 ? -n : n;
}
`;

const COMMON = (o: ShaderOptions) => header(o) + FRAME + ENCODE + NOISE + ATMOSPHERE;

/* ---------------------------------------------------------------------- */
/* sky                                                                     */
/* ---------------------------------------------------------------------- */

export const SKY_VS = (o: ShaderOptions) => `${header(o)}
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vNdc = p * 2.0 - 1.0;
  gl_Position = vec4(vNdc, 1.0, 1.0);
}
`;

export const SKY_FS = (o: ShaderOptions) => `${COMMON(o)}
in vec2 vNdc;
out vec4 outColor;
void main() {
  vec4 far = uInvViewProj * vec4(vNdc, 1.0, 1.0);
  vec4 near = uInvViewProj * vec4(vNdc, -1.0, 1.0);
  vec3 d = normalize(far.xyz / far.w - near.xyz / near.w);
  // the mirror pass draws the world upside down: the sky it reflects is the one above
  if (uKeyCol.w > 0.5) d.y = -d.y;
  vec3 col = skyColor(d, true);
  // below the horizon (only seen past the far edge): the haze
  if (d.y < 0.0) col = mix(col, hazeColor(d), smoothstep(0.0, -0.02, d.y));
  outColor = encodeColor(col);
}
`;

/* ---------------------------------------------------------------------- */
/* static scenery                                                          */
/* ---------------------------------------------------------------------- */

export const STATIC_VS = (o: ShaderOptions) => `${header(o)}${FRAME}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aMat;
layout(location = 3) in vec4 aAux;
out vec3 vPos;
out vec3 vNormal;
flat out float vMat;
out vec4 vAux;
void main() {
  vPos = aPos;
  vNormal = aNormal;
  vMat = aMat;
  vAux = aAux;
  vec3 p = aPos;
  if (uKeyCol.w > 0.5) p.y = -p.y; // the mirror pass
  gl_Position = uViewProj * vec4(p, 1.0);
}
`;

export const STATIC_FS = (o: ShaderOptions) => `${COMMON(o)}${LIGHTING}
in vec3 vPos;
in vec3 vNormal;
flat in float vMat;
in vec4 vAux;
out vec4 outColor;

vec3 terrainAlbedo(vec3 P, vec3 n) {
  float slope = 1.0 - n.y;
  float h = P.y;
  float a = fbm4(P.xz * 0.045);
  float b = vnoise(P.xz * 0.35);
  float c = vnoise(P.xz * 1.6);
  // meadow: greens with drier, warmer patches
  vec3 grass = mix(vec3(0.055, 0.1, 0.03), vec3(0.12, 0.15, 0.045), a);
  grass = mix(grass, vec3(0.17, 0.15, 0.07), smoothstep(0.62, 0.85, b) * 0.45);
  grass *= 0.88 + 0.24 * c;
  // under the pines on the valley sides: darker, browner
  float forest = smoothstep(4.0, 12.0, h) * smoothstep(0.35, 0.6, fbm4(P.xz * 0.045 + 7.0));
  grass = mix(grass, vec3(0.05, 0.06, 0.03), forest * 0.55);
  // bare rock on the steep faces and in the cuttings
  vec3 rock = vec3(0.2, 0.19, 0.17) * (0.75 + 0.5 * b);
  vec3 col = mix(grass, rock, smoothstep(0.32, 0.55, slope + (a - 0.5) * 0.25));
  // bracken and heather high up
  col = mix(col, vec3(0.13, 0.085, 0.06), smoothstep(24.0, 42.0, h + (a - 0.5) * 8.0) * 0.55);
  // shingle and mud along the water
  vec3 bank = mix(vec3(0.1, 0.09, 0.075), vec3(0.16, 0.15, 0.13), c);
  col = mix(bank, col, smoothstep(0.12, 0.85, h + (b - 0.5) * 0.3));
  col = mix(vec3(0.04, 0.045, 0.035), col, smoothstep(-0.25, 0.08, h));
  return col;
}

/** Courses of dressed stone: uv in units (along, up), with soft joints. */
vec3 masonry(vec2 uv, vec3 P, float id) {
  float course = 0.46;
  float row = floor(uv.y / course);
  float shift = mod(row, 2.0) * 0.5;
  float block = 0.92;
  float col = floor(uv.x / block + shift);
  vec2 f = vec2(fract(uv.x / block + shift), fract(uv.y / course));
  float h = hash12(vec2(col, row));
  vec3 stone = vec3(0.4, 0.375, 0.34) * (0.82 + 0.28 * h);
  stone = mix(stone, vec3(0.42, 0.4, 0.38), 0.3 * vnoise(uv * 0.7));
  // joints fade out once they get thinner than a pixel
  vec2 px = fwidth(uv);
  float sharp = 1.0 - smoothstep(0.035, 0.12, max(px.x / block, px.y / course));
  float jx = smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x);
  float jy = smoothstep(0.0, 0.09, f.y) * smoothstep(1.0, 0.91, f.y);
  stone *= mix(1.0, 0.62 + 0.38 * jx * jy, sharp);
  // weathering: streaks down from the deck, damp and moss low on the piers
  float streak = vnoise(vec2(uv.x * 2.2, uv.y * 0.12));
  stone *= 0.86 + 0.18 * streak;
  stone = mix(stone, vec3(0.12, 0.13, 0.08), smoothstep(5.0, 0.0, P.y) * 0.45 * (0.6 + 0.4 * h));
  return stone;
}

/**
 * Windows in a house wall: emission (rgb) and glass (a). uv: across the
 * wall from its middle, and up from the ground. id packs the house, two
 * storeys or one, a long or short wall, and which face (4: a gable).
 */
vec4 houseWindows(vec2 uv, float id) {
  float face = mod(id, 8.0);
  bool wide = mod(floor(id / 8.0), 2.0) > 0.5;
  bool two = mod(floor(id / 16.0), 2.0) > 0.5;
  float house = floor(id / 32.0);
  float mask = 0.0;
  float key = 0.0;
  if (face > 3.5) {
    // the gable: one small window up in the loft
    mask = step(abs(uv.x), 0.2) * step(abs(uv.y - 0.4), 0.17);
    key = hash12(vec2(house, 9.0));
  } else {
    float pitch = 0.92;
    float i = wide ? floor(uv.x / pitch + 0.5) : floor(uv.x / pitch) + 0.5;
    float x = uv.x - i * pitch;
    float cols = wide ? 1.0 : 0.5;
    float j = uv.y < 1.6 ? 0.0 : 1.0;
    float y0 = j < 0.5 ? 0.75 : 1.85;
    float inRow = step(y0, uv.y) * step(uv.y, y0 + 0.52) * (j < 0.5 || two ? 1.0 : 0.0);
    mask = step(abs(x), 0.21) * step(abs(i), cols) * inRow;
    // a door on the front of the ground floor of some
    key = hash12(vec2(i + house * 13.0 + face * 3.0, j + 1.7));
  }
  // windows come on one by one as it gets dark; a few stay dark
  float on = step(key, uSkyAmb.w) * step(0.14, fract(key * 7.13));
  vec3 warm = mix(vec3(1.0, 0.52, 0.2), vec3(1.0, 0.7, 0.38), fract(key * 3.7));
  return vec4(warm * on * 3.2, mask);
}

void main() {
  if (uKeyCol.w > 0.5 && vPos.y < -0.02) discard;
  vec3 P = vPos;
  vec3 n = normalize(vNormal);
  int mat = int(vMat + 0.5);
  float ao = vAux.x;
  vec3 albedo;
  vec3 emit = vec3(0.0);
  float wrap = 0.0;
  float spec = 0.0;
  if (mat == 0) {
    albedo = terrainAlbedo(P, n);
    spec = 0.05 * (1.0 - smoothstep(0.0, 0.5, P.y));
  } else if (mat == 1) {
    // the far ranges: forested lower down, scree and rock higher up
    float r = vnoise(P.xz * 0.05);
    albedo = mix(vec3(0.05, 0.065, 0.045), vec3(0.15, 0.14, 0.13), smoothstep(30.0, 80.0, P.y + r * 25.0));
  } else if (mat == 2) {
    n = facing(n, P);
    albedo = vAux.w > 1.5 && vAux.w < 2.5 ? vec3(0.46, 0.44, 0.41) : masonry(vAux.yz, P, vAux.w);
    spec = 0.04;
  } else if (mat == 3) {
    albedo = vec3(0.07, 0.065, 0.06) * (0.8 + 0.4 * vnoise(vAux.yz * 3.0));
  } else if (mat == 4) {
    n = facing(n, P);
    albedo = vAux.w > 8.5 ? vec3(0.0) : vec3(0.05, 0.048, 0.045);
  } else if (mat == 5) {
    n = facing(n, P);
    float house = floor(vAux.w / 32.0);
    albedo = mix(vec3(0.6, 0.58, 0.53), vec3(0.5, 0.47, 0.42), hash12(vec2(house, 3.0)));
    vec4 w = houseWindows(vAux.yz, vAux.w);
    albedo = mix(albedo, vec3(0.03, 0.035, 0.04), w.a);
    emit = w.rgb * w.a;
    spec = w.a * 0.4;
  } else if (mat == 6) {
    n = facing(n, P);
    albedo = mix(vec3(0.07, 0.07, 0.08), vec3(0.12, 0.08, 0.07), hash12(vec2(vAux.w, 1.0)));
    spec = 0.08;
  } else {
    n = facing(n, P);
    albedo = vec3(0.17, 0.165, 0.155) * (0.7 + 0.5 * hash12(vAux.ww));
  }
  vec3 col = shade(albedo, n, P, ao, wrap, spec) + emit;
  col = fogged(col, P);
  outColor = encodeColor(col);
}
`;

/* ---------------------------------------------------------------------- */
/* pines                                                                   */
/* ---------------------------------------------------------------------- */

export const TREE_VS = (o: ShaderOptions) => `${header(o)}${FRAME}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aPart;
layout(location = 3) in float aHeight;
layout(location = 4) in vec4 aInstA; // x, y, z, scale
layout(location = 5) in vec4 aInstB; // yaw, hue, lean, darkness
out vec3 vPos;
out vec3 vNormal;
flat out vec3 vTint;
out float vHeight;
flat out float vPart;
void main() {
  float c = cos(aInstB.x);
  float s = sin(aInstB.x);
  vec3 p = aPos * aInstA.w;
  p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  // a slight lean, and a breath of wind in the tops
  float sway = sin(uCam.w * 0.9 + aInstA.x * 0.13 + aInstA.z * 0.07) * 0.035 * uCloudLit.w;
  p.x += p.y * (aInstB.z + sway * aHeight);
  vec3 world = aInstA.xyz + p;
  vec3 n = aNormal;
  n = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
  vPos = world;
  vNormal = n;
  vHeight = aHeight;
  vPart = aPart;
  // needles: from blue-green to warmer green, some darker
  vec3 tint = mix(vec3(0.026, 0.055, 0.042), vec3(0.045, 0.066, 0.03), aInstB.y);
  vTint = tint * (0.7 + 0.4 * aInstB.w);
  vec3 q = world;
  if (uKeyCol.w > 0.5) q.y = -q.y;
  gl_Position = uViewProj * vec4(q, 1.0);
}
`;

export const TREE_FS = (o: ShaderOptions) => `${COMMON(o)}${LIGHTING}
in vec3 vPos;
in vec3 vNormal;
flat in vec3 vTint;
in float vHeight;
flat in float vPart;
out vec4 outColor;
void main() {
  if (uKeyCol.w > 0.5 && vPos.y < -0.02) discard;
  vec3 n = normalize(vNormal);
  vec3 albedo = vPart > 0.5 ? vec3(0.07, 0.05, 0.035) : vTint;
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.85, vHeight));
  vec3 col = shade(albedo, n, vPos, ao, vPart > 0.5 ? 0.0 : 0.45, 0.0);
  // backlit needles glow at the edges (the scene looks toward the sun)
  vec3 V = normalize(uCam.xyz - vPos);
  float through = pow(max(dot(-V, uKeyDir.xyz), 0.0), 14.0);
  float rim = pow(1.0 - abs(dot(n, V)), 3.0);
  col += uKeyCol.rgb * vec3(0.5, 0.55, 0.22) * through * rim * 0.16 * shadowAt(vPos, n) * (1.0 - vPart);
  col = fogged(col, vPos);
  outColor = encodeColor(col);
}
`;

/* ---------------------------------------------------------------------- */
/* the train                                                               */
/* ---------------------------------------------------------------------- */

export const CAR_VS = (o: ShaderOptions) => `${header(o)}${FRAME}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aPart;
layout(location = 3) in vec2 aUV;
layout(location = 4) in vec4 aInstA; // x, y, z, s
layout(location = 5) in vec4 aInstB; // forward x, forward z, direction, kind
layout(location = 6) in vec4 aInstC; // livery, rear, seed, light
out vec3 vPos;
out vec3 vNormal;
out vec3 vLocal;
out float vS;
flat out float vPart;
flat out vec4 vInstB;
flat out vec4 vInstC;
void main() {
  vec3 F = normalize(vec3(aInstB.x, 0.0, aInstB.y));
  vec3 R = vec3(F.z, 0.0, -F.x);
  // the cars are drawn a little taller and wider than the mesh (it reads better from the bank)
  const vec3 SCALE = vec3(1.0, ${CAR_SCALE_Y.toFixed(3)}, ${CAR_SCALE_Z.toFixed(3)});
  vec3 lp = aPos * SCALE;
  vec3 ln = normalize(aNormal / SCALE);
  vec3 world = aInstA.xyz + F * lp.x + vec3(0.0, lp.y, 0.0) + R * lp.z;
  vPos = world;
  vNormal = F * ln.x + vec3(0.0, ln.y, 0.0) + R * ln.z;
  vLocal = aPos;
  // where along the line this vertex is (to hide what is still in the tunnel)
  vS = aInstA.w + aPos.x * aInstB.z;
  vPart = aPart;
  vInstB = aInstB;
  vInstC = aInstC;
  vec3 q = world;
  if (uKeyCol.w > 0.5) q.y = -q.y;
  gl_Position = uViewProj * vec4(q, 1.0);
}
`;

const LIVERY = /* glsl */ `
void livery(float id, out vec3 body, out vec3 stripe) {
  if (id < 0.5) { body = vec3(0.028, 0.04, 0.09); stripe = vec3(0.55, 0.4, 0.16); }
  else if (id < 1.5) { body = vec3(0.03, 0.075, 0.05); stripe = vec3(0.62, 0.58, 0.46); }
  else if (id < 2.5) { body = vec3(0.14, 0.025, 0.035); stripe = vec3(0.62, 0.56, 0.44); }
  else { body = vec3(0.36, 0.37, 0.39); stripe = vec3(0.04, 0.06, 0.13); }
}
`;

export const carFS = (o: ShaderOptions, sLo: number, sHi: number) => `${COMMON(o)}${LIGHTING}${LIVERY}
in vec3 vPos;
in vec3 vNormal;
in vec3 vLocal;
in float vS;
flat in float vPart;
flat in vec4 vInstB;
flat in vec4 vInstC;
out vec4 outColor;
const float S_LO = ${sLo.toFixed(3)};
const float S_HI = ${sHi.toFixed(3)};
void main() {
  if (vS < S_LO || vS > S_HI) discard;
  if (uKeyCol.w > 0.5 && vPos.y < -0.02) discard;
  vec3 n = normalize(vNormal);
  vec3 V = normalize(uCam.xyz - vPos);
  int part = int(vPart + 0.5);
  bool engine = vInstB.w < 0.5;
  vec3 body;
  vec3 stripe;
  livery(vInstC.x, body, stripe);
  vec3 albedo = body;
  vec3 emit = vec3(0.0);
  float spec = 0.35;
  float glass = 0.0;
  float x = vLocal.x;
  float y = vLocal.y;
  float glow = uMisc.y;
  if (part == 0) {
    // the side: window band, a fine stripe under it, a darker skirt
    if (y > 0.98 && y < 1.05) albedo = stripe;
    if (y < 0.72) albedo = body * 0.6;
    if (!engine) {
      float pitch = 1.06;
      float i = floor((x + 3.95) / pitch);
      float fx = (x + 3.95) - i * pitch;
      bool row = i >= 0.0 && i < 7.5 && fx > 0.14 && fx < 0.92 && y > 1.17 && y < 1.63;
      bool door = abs(abs(x) - 4.42) < 0.17 && y > 1.2 && y < 1.62;
      if (row || door) {
        glass = 1.0;
        float key = hash12(vec2(i + vInstC.z * 31.0, sign(vLocal.z) + (door ? 9.0 : 0.0)));
        // compartments: most lit warm, some blinds half down, a few dark
        float lit = step(0.1, key);
        float blind = step(0.72, key) * smoothstep(1.48, 1.44, y);
        vec3 warm = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.8, 0.52), fract(key * 5.3));
        emit = warm * lit * (1.0 - 0.6 * blind) * glow * (door ? 0.6 : 1.0);
      }
    } else {
      // the cab's side window, and louvres along the engine room
      if (x > 3.15 && x < 3.85 && y > 1.2 && y < 1.62) {
        glass = 1.0;
        emit = vec3(0.35, 0.5, 0.45) * 0.12 * glow;
      } else if (x > -3.6 && x < 2.6 && y > 1.2 && y < 1.62) {
        float lv = step(0.5, fract(x * 3.2));
        albedo = mix(body * 0.55, body * 0.85, lv);
      }
    }
  } else if (part == 1) {
    albedo = vec3(0.13, 0.13, 0.14);
    spec = 0.25;
  } else if (part == 2) {
    albedo = vec3(0.018);
    spec = 0.0;
  } else if (part == 3) {
    // a coach end: tail lamps on the last one's rear
    albedo = body * 0.85;
    if (vInstC.y > 0.5 && x < 0.0) {
      vec2 q = vec2(abs(vLocal.z) - 0.47, y - 0.84);
      float lamp = 1.0 - smoothstep(0.07, 0.1, length(q));
      emit = vec3(4.0, 0.18, 0.08) * lamp;
    }
  } else if (part == 4) {
    albedo = vec3(0.012, 0.016, 0.02);
    glass = 1.0;
    emit = vec3(0.3, 0.42, 0.36) * 0.05 * glow;
  } else {
    // the nose: livery, a stripe, two headlamps and a marker lamp
    albedo = body;
    if (y > 0.98 && y < 1.05) albedo = stripe;
    vec2 q = vec2(abs(vLocal.z) - 0.36, y - 0.86);
    float lamp = 1.0 - smoothstep(0.075, 0.105, length(q));
    vec2 m = vec2(vLocal.z, y - 1.2);
    float marker = 1.0 - smoothstep(0.045, 0.07, length(m));
    emit = vec3(9.0, 8.6, 7.6) * max(lamp, marker * 0.6);
  }
  vec3 col = shade(albedo, facing(n, vPos), vPos, 1.0, 0.0, glass > 0.5 ? 0.0 : spec);
  if (glass > 0.5) {
    // glass: the sky in it by day, the lit interior at night
    vec3 r = reflect(-V, facing(n, vPos));
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(V, facing(n, vPos)), 0.0), 5.0);
    vec3 sky = skyBase(normalize(vec3(r.x, abs(r.y), r.z)));
    col = mix(col, sky * 0.7, clamp(F * 0.8 + 0.12, 0.0, 1.0));
  }
  col += emit;
  col = fogged(col, vPos);
  outColor = encodeColor(col);
}
`;

/* ---------------------------------------------------------------------- */
/* depth only (the shadow map)                                             */
/* ---------------------------------------------------------------------- */

/**
 * The far slopes and ranges don't cast: in a valley this deep they would
 * put the floor in shade for the whole golden hour. Light comes over them.
 */
export const SHADOW_CUT = 142;

export const DEPTH_FS = (o: ShaderOptions) => `${header(o)}
in vec3 vPos;
void main() {
  if (vPos.z > ${SHADOW_CUT.toFixed(1)}) discard;
}
`;

export const carDepthFS = (o: ShaderOptions, sLo: number, sHi: number) => `${header(o)}
in float vS;
void main() {
  if (vS < ${sLo.toFixed(3)} || vS > ${sHi.toFixed(3)}) discard;
}
`;

/** Shadow-pass vertex shaders reuse the lit ones with the light's matrix (see renderer.ts). */

/* ---------------------------------------------------------------------- */
/* the water                                                               */
/* ---------------------------------------------------------------------- */

export const WATER_VS = (o: ShaderOptions) => `${header(o)}${FRAME}
layout(location = 0) in vec3 aPos;
out vec3 vPos;
void main() {
  vPos = aPos;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`;

export const WATER_FS = (o: ShaderOptions) => `${COMMON(o)}${LIGHTING}
uniform sampler2D uMirror;
uniform vec2 uViewport;
in vec3 vPos;
out vec4 outColor;

/** The ripples: a slow swell coming down the river and finer cat's-paws. */
vec2 ripple(vec2 p, float dist) {
  float t = uCam.w * uCloudLit.w;
  vec2 g = vec2(0.0);
  vec3 a = noised(p * vec2(0.16, 0.07) + vec2(0.0, t * 0.09));
  g += a.xy * vec2(0.16, 0.07) * 2.2;
  vec3 b = noised(p * vec2(0.42, 0.22) + vec2(t * 0.05, t * 0.3));
  g += b.xy * vec2(0.42, 0.22) * 0.9;
  float lod = 1.0 - smoothstep(30.0, 110.0, dist);
  vec3 c = noised(p * vec2(1.3, 0.85) + vec2(-t * 0.1, t * 0.75));
  g += c.xy * vec2(1.3, 0.85) * 0.22 * lod;
  return g;
}

void main() {
  vec3 P = vPos;
  vec3 toEye = uCam.xyz - P;
  float dist = length(toEye);
  vec3 V = toEye / dist;
  vec2 g = ripple(P.xz, dist);
  float k = 0.32;
  vec3 n = normalize(vec3(-g.x * k, 1.0, -g.y * k));
  // the mirror, bent by the ripples (more along the river than across: streaks)
  vec2 uv = gl_FragCoord.xy / uViewport;
  float bend = 1.0 / (1.0 + dist * 0.035);
  vec2 off = vec2(g.x * 0.010, g.y * 0.03) * bend;
  vec3 refl = decodeColor(texture(uMirror, clamp(uv + off, vec2(0.001), vec2(0.999))).rgb);
  float cosT = max(dot(n, V), 0.0);
  float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
  F = mix(F, 1.0, 0.18);
  // the water itself: peaty, dark, lit only a little
  vec3 body = vec3(0.012, 0.022, 0.02) * (uSkyAmb.rgb * 2.0 + uKeyCol.rgb * 0.15);
  vec3 col = mix(body, refl, clamp(F, 0.0, 1.0));
  // glitter: how likely a wavelet here is tilted to throw the key light at
  // the eye (a path down the water toward the light), broken into sparkles
  // that twinkle dot by dot, plus a narrow sheen right under the light
  float sh = shadowAt(P, vec3(0.0, 1.0, 0.0));
  vec3 h = normalize(V + uKeyDir.xyz);
  float slope = mix(0.42, 0.24, uMoonDir.w);
  float path = pow(max(dot(normalize(vec3(-g.x * slope, 1.0, -g.y * slope)), h), 0.0), mix(160.0, 520.0, uMoonDir.w));
  float frame = floor(uCam.w * uCloudLit.w * 9.0);
  float tw = hash12(floor(gl_FragCoord.xy / 1.5) + vec2(frame * 13.1, frame * 7.7));
  float sparkle = step(tw, path * 0.55) * smoothstep(0.02, 0.2, path);
  // a high sun spreads into a broad glare: keep the soft terms for a low one
  float low = 1.0 - smoothstep(4.0, 14.0, uSunCol.w);
#if TILE
  float glint = sparkle * 3.5 + (path * 0.8 + pow(max(dot(n, h), 0.0), 380.0) * 0.9) * mix(0.35, 1.0, low);
#else
  float glint = sparkle * 9.0 + (path * 0.6 + pow(max(dot(n, h), 0.0), 380.0) * 0.9) * mix(0.3, 1.0, low);
#endif
  // the moon's path only once it is properly dark
  float moonGlint = uMoonDir.w * uMoonDir.w;
  col += uKeyCol.rgb * glint * sh * (uSunCol.w > -0.9 ? 1.0 : 0.4 * moonGlint);
  // the headlights' sheen on the water
  col += lamps(P, n) * 0.04;
  col = fogged(col, P);
  outColor = encodeColor(col);
}
`;

/* ---------------------------------------------------------------------- */
/* post                                                                    */
/* ---------------------------------------------------------------------- */

export const POST_VS = (o: ShaderOptions) => `${header(o)}
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

/** Light in the air from the headlights: marched along each view ray up to whatever it hits. */
export const BEAM_FS = (o: ShaderOptions) => `${COMMON(o)}
uniform sampler2D uDepth;
in vec2 vUv;
out vec4 outColor;

float cone(vec3 X, vec4 pos, vec3 dir) {
  vec3 d = X - pos.xyz;
  float l = length(d);
  float c = dot(d, dir) / max(l, 1e-3);
  float over = smoothstep(-0.085, -0.045, d.y / max(l, 1e-3));
  return smoothstep(0.962, 0.994, c) * over / (1.0 + l * l * 0.004) * smoothstep(0.3, 3.0, l);
}

void main() {
  float z = texture(uDepth, vUv).r;
  vec4 w = uInvViewProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
  vec3 P = w.xyz / w.w;
  vec3 ray = P - uCam.xyz;
  float len = length(ray);
  vec3 rd = ray / max(len, 1e-4);
  len = min(len, 420.0);
  vec3 sum = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    vec4 hp = k == 0 ? uHeadPos : uHead2Pos;
    if (hp.w <= 0.0) continue;
    vec3 hd = k == 0 ? uHeadDir.xyz : uHead2Dir.xyz;
    // march only the stretch of the ray near the beam
    float tc = dot(hp.xyz - uCam.xyz, rd);
    float t0 = max(0.0, tc - 95.0);
    float t1 = min(len, tc + 95.0);
    if (t1 <= t0) continue;
    const int STEPS = ${o.tile ? 14 : 28};
    float dt = (t1 - t0) / float(STEPS);
    // interleaved gradient noise: an even jitter that blurs out, not sparkle
    float j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float acc = 0.0;
    for (int i = 0; i < STEPS; i++) {
      float t = t0 + (float(i) + j) * dt;
      vec3 X = uCam.xyz + rd * t;
      // the air is thicker low over the river
      float dens = 0.55 + 1.6 * uHorizon.w * exp(-max(X.y, 0.0) / 5.0);
      acc += cone(X, hp, hd) * dens;
    }
    sum += vec3(1.0, 0.93, 0.8) * acc * dt * hp.w;
  }
  outColor = encodeColor(sum * 0.026 * uMoonCol.w);
}
`;

/** 13-tap downsample (the first level averages by brightness to tame fireflies). */
export const DOWN_FS = (o: ShaderOptions) => `${header(o)}${ENCODE}
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uFirst;
uniform float uThreshold;
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 o) { return decodeColor(texture(uSrc, vUv + o * uTexel).rgb); }
float w(vec3 c) { return 1.0 / (1.0 + max(max(c.r, c.g), c.b) * uFirst); }
/** Only what is brighter than the threshold glows (a soft knee, no hard edge). */
vec3 prefilter(vec3 c) {
  float br = max(max(c.r, c.g), c.b);
  float knee = uThreshold * 0.6;
  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  return c * max(soft, br - uThreshold) / max(br, 1e-4);
}
void main() {
  vec3 a = tap(vec2(-2.0, 2.0)), b = tap(vec2(0.0, 2.0)), c = tap(vec2(2.0, 2.0));
  vec3 d = tap(vec2(-2.0, 0.0)), e = tap(vec2(0.0, 0.0)), f = tap(vec2(2.0, 0.0));
  vec3 g = tap(vec2(-2.0, -2.0)), h = tap(vec2(0.0, -2.0)), i = tap(vec2(2.0, -2.0));
  vec3 j = tap(vec2(-1.0, 1.0)), k = tap(vec2(1.0, 1.0)), l = tap(vec2(-1.0, -1.0)), m = tap(vec2(1.0, -1.0));
  vec3 g0 = (a + b + d + e) * 0.25, g1 = (b + c + e + f) * 0.25, g2 = (d + e + g + h) * 0.25, g3 = (e + f + h + i) * 0.25;
  vec3 g4 = (j + k + l + m) * 0.25;
  float w0 = w(g0), w1 = w(g1), w2 = w(g2), w3 = w(g3), w4 = w(g4);
  vec3 sum = g0 * w0 * 0.125 + g1 * w1 * 0.125 + g2 * w2 * 0.125 + g3 * w3 * 0.125 + g4 * w4 * 0.5;
  float ws = w0 * 0.125 + w1 * 0.125 + w2 * 0.125 + w3 * 0.125 + w4 * 0.5;
  vec3 res = sum / ws;
  if (uFirst > 0.5) res = prefilter(res);
  outColor = encodeColor(res);
}
`;

/** 3×3 tent upsample of the level below, added to this level's own downsample. */
export const UP_FS = (o: ShaderOptions) => `${header(o)}${ENCODE}
uniform sampler2D uSrc;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform float uWeight;
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 o) { return decodeColor(texture(uSrc, vUv + o * uTexel).rgb); }
void main() {
  vec3 s = tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0)) + tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0));
  s += 2.0 * (tap(vec2(0.0, 1.0)) + tap(vec2(0.0, -1.0)) + tap(vec2(-1.0, 0.0)) + tap(vec2(1.0, 0.0)));
  s += 4.0 * tap(vec2(0.0));
  outColor = encodeColor(decodeColor(texture(uBase, vUv).rgb) + s / 16.0 * uWeight);
}
`;

export const FINAL_FS = (o: ShaderOptions) => `${header(o)}${ENCODE}
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uBeam;
uniform float uExposure;
uniform float uBloomMix;
uniform float uTime;
uniform float uGrain;
uniform float uBeamOn;
uniform vec3 uLift;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 c = decodeColor(texture(uScene, vUv).rgb);
  if (uBeamOn > 0.5) {
    // the half-size beams, softened with a small tent on the way up
    vec2 bt = 1.0 / vec2(textureSize(uBeam, 0));
    vec3 beam = decodeColor(texture(uBeam, vUv).rgb) * 0.4;
    beam += decodeColor(texture(uBeam, vUv + vec2(1.0, 1.0) * bt).rgb) * 0.15;
    beam += decodeColor(texture(uBeam, vUv + vec2(-1.0, 1.0) * bt).rgb) * 0.15;
    beam += decodeColor(texture(uBeam, vUv + vec2(1.0, -1.0) * bt).rgb) * 0.15;
    beam += decodeColor(texture(uBeam, vUv + vec2(-1.0, -1.0) * bt).rgb) * 0.15;
    c += beam;
  }
  vec3 b = decodeColor(texture(uBloom, vUv).rgb);
  c += b * uBloomMix;
  c *= uExposure;
  // a gentle lift in the shadows (a print never goes fully black)
  c += uLift;
  c = aces(c);
  // vignette
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * 0.38;
  c = pow(c, vec3(1.0 / 2.2));
  // fine grain, strongest in the mid tones
  float n = hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5;
  c += n * uGrain * (0.35 + 0.65 * (1.0 - abs(c - 0.5) * 2.0));
  outColor = vec4(c, 1.0);
}
`;
