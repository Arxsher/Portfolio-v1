// GLSL for the snow globe (WebGL2). Three programs:
//
//   SCENE      one ray per pixel, in the globe's own frame (the ray is
//              moved into it, so the globe can tilt and travel freely):
//              - the floor of the stage, with a contact shadow that
//                loosens as the globe lifts, the soft cast shadow of the
//                base and the pale one of the glass, and at night a warm
//                spill from the cabin through the water;
//              - the turned walnut base (a lathe profile, ray-marched) with
//                a clear coat and a brass band, both reflecting the studio;
//              - the glass: a 4.5% thick shell (air → glass → water, two
//                refractions, Schlick Fresnel), reflecting a studio with a
//                softbox, a strip light and two black flags that draw its
//                edges. Inside, the diorama is ray-marched as signed
//                distance fields (snow dome, a log cabin with a snowy roof,
//                chimney, windows and door, five pines), lit by the sun or
//                the moon with soft shadows and occlusion, and at night by
//                the cabin's windows, whose glow also hangs in the water.
//                Behind it all, a sky painted on the back of the glass.
//              Writes two targets: what is seen through the glass (with the
//              distance travelled in the water in alpha, so the flakes can
//              hide behind things), and the reflection with the share of
//              light that gets through.
//   FLAKES     the snow, as points. Each flake's image is found through the
//              glass in the vertex shader: the path from the camera that
//              refracts twice and passes through the flake lies in the
//              plane of the camera, the flake and the centre, so it is a
//              1-D search (bisection) over where it meets the sphere. Out
//              of focus flakes grow into soft discs; glitter turns and
//              flashes.
//   COMPOSITE  (seen * (1 - flakes) + flakes) * transmission + reflection,
//              then exposure, a soft shoulder, sRGB and a little dither.

import {
  BASE,
  CABIN,
  CABIN_RIDGE,
  CABIN_Y,
  FLOOR_Y,
  GROUND,
  HEARTH,
  IOR_GLASS,
  IOR_WATER,
  KNEE,
  OPENINGS,
  PIVOT,
  R_IN,
  R_OUT,
  TIERS,
  TREES,
  type Vec3,
} from "./scene";

const f = (n: number) => {
  const s = n.toFixed(5);
  return s.includes(".") ? s : `${s}.0`;
};
const v3 = (a: readonly number[]) => `vec3(${f(a[0])}, ${f(a[1])}, ${f(a[2])})`;

export type Quality = { steps: number; shadowSteps: number; baseSteps: number };

/** Cabin local → object space. */
function cabinToObject(l: Vec3): Vec3 {
  const c = Math.cos(CABIN.yaw);
  const s = Math.sin(CABIN.yaw);
  return [CABIN.x + c * l[0] + s * l[2], CABIN_Y + l[1], CABIN.z - s * l[0] + c * l[2]];
}
function cabinDir(l: Vec3): Vec3 {
  const c = Math.cos(CABIN.yaw);
  const s = Math.sin(CABIN.yaw);
  return [c * l[0] + s * l[2], l[1], -s * l[0] + c * l[2]];
}

const WIN_FRONT = cabinToObject([OPENINGS.front.x, OPENINGS.front.y, CABIN.wz - 0.004]);
const WIN_FRONT_N = cabinDir([0, 0, 1]);
const WIN_SIDE = cabinToObject([-CABIN.wx + 0.004, OPENINGS.side.y, OPENINGS.side.z]);
const WIN_SIDE_N = cabinDir([-1, 0, 0]);
const HEARTH_O = cabinToObject(HEARTH);

/** Constants and the diorama's distance field (shared by SCENE and, for the window light, FLAKES). */
function common(): string {
  const trees = TREES.map((t) => `vec4(${f(t.x)}, ${f(t.y)}, ${f(t.z)}, ${f(t.h)})`).join(", ");
  const radii = TREES.map((t) => f(t.r)).join(", ");
  return /* glsl */ `
#define PI 3.14159265
const float R_OUT = ${f(R_OUT)};
const float R_IN = ${f(R_IN)};
const float IOR_G = ${f(IOR_GLASS)};
const float IOR_W = ${f(IOR_WATER)};
const vec3 PIVOT = ${v3(PIVOT)};
const float FLOOR_Y = ${f(FLOOR_Y)};

const vec3 WIN_FRONT = ${v3(WIN_FRONT)};
const vec3 WIN_FRONT_N = ${v3(WIN_FRONT_N)};
const vec3 WIN_SIDE = ${v3(WIN_SIDE)};
const vec3 WIN_SIDE_N = ${v3(WIN_SIDE_N)};
const vec3 HEARTH = ${v3(HEARTH_O)};

// smoothstep that also runs downhill (edge0 > edge1 is undefined for the built-in)
float ss(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash13(i), b = hash13(i + vec3(1, 0, 0)), c = hash13(i + vec3(0, 1, 0)), d = hash13(i + vec3(1, 1, 0));
  float e = hash13(i + vec3(0, 0, 1)), g = hash13(i + vec3(1, 0, 1)), h = hash13(i + vec3(0, 1, 1)), k = hash13(i + vec3(1, 1, 1));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}

/* the window light, for the snow, the trees and the flakes */
vec3 windowLight(vec3 p, vec3 n, vec3 col) {
  vec3 l = WIN_FRONT - p;
  float d2 = dot(l, l);
  vec3 ld = l * inversesqrt(d2);
  float face = smoothstep(-0.1, 0.5, -dot(ld, WIN_FRONT_N));
  vec3 lit = col * face * max(0.0, dot(n, ld) * 0.75 + 0.25) / (1.0 + d2 * 70.0);
  l = WIN_SIDE - p;
  d2 = dot(l, l);
  ld = l * inversesqrt(d2);
  face = smoothstep(-0.1, 0.5, -dot(ld, WIN_SIDE_N));
  lit += 0.8 * col * face * max(0.0, dot(n, ld) * 0.75 + 0.25) / (1.0 + d2 * 70.0);
  return lit;
}

const vec4 TREE[${TREES.length}] = vec4[${TREES.length}](${trees});
const float TREE_R[${TREES.length}] = float[${TREES.length}](${radii});
`;
}

function sceneSdf(): string {
  const cy = Math.cos(CABIN.yaw);
  const sy = Math.sin(CABIN.yaw);
  const sp = Math.sin(CABIN.pitch);
  const cp = Math.cos(CABIN.pitch);
  const tiers = TIERS.map((t) => `vec3(${f(t[0])}, ${f(t[1])}, ${f(t[2])})`).join(", ");
  return /* glsl */ `
#define M_SNOW 1.0
#define M_WALL 2.0
#define M_ROOF 3.0
#define M_GLASS 4.0
#define M_FRAME 5.0
#define M_DOOR 6.0
#define M_STONE 7.0
#define M_PINE 8.0
#define M_TRUNK 9.0

const float G_BASE = ${f(GROUND.base)};
const float G_DOME = ${f(GROUND.dome)};
const float G_R2 = ${f(GROUND.r2)};

const vec3 CAB_P = vec3(${f(CABIN.x)}, ${f(CABIN_Y)}, ${f(CABIN.z)});
const vec2 CAB_CS = vec2(${f(cy)}, ${f(sy)});
const float CAB_WX = ${f(CABIN.wx)};
const float CAB_WZ = ${f(CABIN.wz)};
const float CAB_RIDGE = ${f(CABIN_RIDGE)};
const vec2 CAB_SLOPE = vec2(${f(sp)}, ${f(cp)});
const float CAB_OVX = ${f(CABIN.overX)};
const float CAB_OVZ = ${f(CABIN.overZ)};
const float CAB_RT = ${f(CABIN.roofT)};
const vec3 CHIM = vec3(${f(CABIN.chimX)}, ${f(CABIN.chimZ)}, ${f(CABIN.chimH)});
const float CHIM_TOP = ${f(CABIN_RIDGE + CABIN.chimTop)};
const vec4 WIN_F = vec4(${f(OPENINGS.front.x)}, ${f(OPENINGS.front.y)}, ${f(OPENINGS.front.hw)}, ${f(OPENINGS.front.hh)});
const vec4 DOOR = vec4(${f(OPENINGS.door.x)}, ${f(OPENINGS.door.y)}, ${f(OPENINGS.door.hw)}, ${f(OPENINGS.door.hh)});
const vec4 WIN_S = vec4(${f(OPENINGS.side.z)}, ${f(OPENINGS.side.y)}, ${f(OPENINGS.side.hw)}, ${f(OPENINGS.side.hh)});
const vec3 TIERS[3] = vec3[3](${tiers});

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
// a cone with its apex at the origin, base radius q.x at height q.y (< 0)
float sdCone(vec3 p, vec2 q) {
  vec2 w = vec2(length(p.xz), p.y);
  vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
  vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
  float k = sign(q.y);
  float d = min(dot(a, a), dot(b, b));
  float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
  return sqrt(d) * sign(s);
}

float groundH(vec2 xz) {
  float r2 = dot(xz, xz);
  float h = G_BASE + G_DOME * (1.0 - min(1.0, r2 / G_R2));
  h += 0.01 * sin(xz.x * 7.1 + 1.3) * sin(xz.y * 6.3 + 0.4) + 0.006 * sin(xz.x * 13.7 - xz.y * 11.1 + 2.0);
  return h;
}

vec3 cabinLocal(vec3 p) {
  vec3 d = p - CAB_P;
  return vec3(CAB_CS.x * d.x - CAB_CS.y * d.z, d.y, CAB_CS.y * d.x + CAB_CS.x * d.z);
}

// the cabin in its own frame; m: material
float sdCabin(vec3 q, out float m) {
  // distance above the roof's underside (a plane through the ridge and the eaves)
  float sB = CAB_SLOPE.x * abs(q.z) + CAB_SLOPE.y * (q.y - CAB_RIDGE);
  float walls = max(sdBox(q - vec3(0.0, CAB_RIDGE * 0.5, 0.0), vec3(CAB_WX, CAB_RIDGE * 0.5, CAB_WZ)), sB);
  // openings: a shallow recess for the windows and the door
  float win = sdBox(q - vec3(WIN_F.x, WIN_F.y, CAB_WZ), vec3(WIN_F.z, WIN_F.w, 0.011));
  float door = sdBox(q - vec3(DOOR.x, DOOR.y, CAB_WZ), vec3(DOOR.z, DOOR.w, 0.007));
  float side = sdBox(q - vec3(-CAB_WX, WIN_S.y, WIN_S.x), vec3(0.011, WIN_S.w, WIN_S.z));
  walls = max(walls, -min(win, min(door, side)));
  float roof = max(abs(sB - CAB_RT * 0.5) - CAB_RT * 0.5, max(abs(q.z) - (CAB_WZ + CAB_OVZ), abs(q.x) - (CAB_WX + CAB_OVX)));
  roof -= 0.003;
  float chim = sdBox(q - vec3(CHIM.x, (CHIM_TOP + CAB_RIDGE - 0.08) * 0.5, CHIM.y), vec3(CHIM.z, (CHIM_TOP - CAB_RIDGE + 0.08) * 0.5, CHIM.z));
  float cap = sdBox(q - vec3(CHIM.x, CHIM_TOP + 0.008, CHIM.y), vec3(CHIM.z + 0.004, 0.006, CHIM.z + 0.004)) - 0.005;
  float d = walls;
  m = M_WALL;
  if (roof < d) { d = roof; m = M_ROOF; }
  if (chim < d) { d = chim; m = M_STONE; }
  if (cap < d) { d = cap; m = M_SNOW; }
  return d;
}

float sdPine(vec3 p, int i, out float m) {
  vec4 t = TREE[i];
  float rb = TREE_R[i];
  vec3 q = p - t.xyz;
  float r = length(q.xz);
  float bound = max(r - rb - 0.02, max(q.y - t.w - 0.02, -q.y - 0.02));
  if (bound > 0.03) { m = M_PINE; return bound; }
  float ang = atan(q.z, q.x);
  float d = 1e3;
  for (int k = 0; k < 3; k++) {
    vec3 tier = TIERS[k];
    float apex = tier.y * t.w;
    float h = (tier.y - tier.x) * t.w;
    float rr = rb * tier.z;
    // scalloped skirts: the rim of each tier droops between branches
    float lobe = 0.5 + 0.5 * sin(ang * 7.0 + float(k) * 1.9 + float(i) * 2.3);
    float rim = ss(apex - h * 0.55, apex - h, q.y);
    float c = sdCone(q - vec3(0.0, apex, 0.0), vec2(rr, -h)) + rim * lobe * rr * 0.08;
    d = min(d, c);
  }
  d *= 0.9;
  float trunk = max(r - 0.016 * (0.6 + rb * 2.5), max(q.y - 0.22 * t.w, -q.y - 0.02));
  m = M_PINE;
  if (trunk < d) { d = trunk; m = M_TRUNK; }
  return d;
}

// the diorama: (distance, material)
vec2 map(vec3 p) {
  float g = (p.y - groundH(p.xz)) * 0.9;
  vec2 res = vec2(g, M_SNOW);
  vec3 q = cabinLocal(p);
  float cb = sdBox(q - vec3(0.0, 0.17, 0.0), vec3(0.27, 0.24, 0.23));
  if (cb < 0.04) {
    float m;
    float c = sdCabin(q, m);
    // the snow banks up against the walls
    float bank = smin(g, c, 0.04);
    res = vec2(bank, c + 0.01 < g ? m : M_SNOW);
  } else {
    res.x = min(res.x, cb);
    if (cb < res.x + 1e-5) res.y = M_SNOW;
  }
  for (int i = 0; i < ${TREES.length}; i++) {
    float m;
    float d = sdPine(p, i, m);
    if (d < res.x) res = vec2(d, m);
  }
  return res;
}
`;
}

/* ---------------------------------------------------------------------- */
/* scene pass                                                              */
/* ---------------------------------------------------------------------- */

export const FULLSCREEN_VS = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export function sceneFS(q: Quality): string {
  const B = BASE;
  return /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${common()}
${sceneSdf()}

uniform vec2 uCenter;
uniform float uFocal;
uniform vec3 uCam;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform mat3 uRot;
uniform vec3 uOffset;
uniform vec3 uKey;
uniform vec3 uBg;
uniform float uNight;
uniform float uWin;
uniform float uDark;
uniform float uEnc;
uniform vec3 uFoot;
uniform vec3 uGlobe;
uniform vec3 uFootUp;

layout(location = 0) out vec4 outSeen;
layout(location = 1) out vec4 outRefl;

/* -------------------------------------------------------------------- */
/* the studio                                                            */
/* -------------------------------------------------------------------- */

const vec3 SB_DIR = normalize(vec3(-0.62, 0.62, 0.48));
const vec3 SB_U = normalize(cross(SB_DIR, vec3(0.0, 1.0, 0.0)));
const vec3 SB_V = cross(SB_U, SB_DIR);
const vec3 STRIP_DIR = normalize(vec3(0.78, 0.0, -0.62));

vec3 studio(vec3 d, float rough) {
  float up = d.y;
  vec3 wall = uBg * mix(0.94, 1.12, smoothstep(-0.1, 0.9, up));
  vec3 flo = uBg * 0.8;
  vec3 c = mix(flo, wall, smoothstep(-0.05 - rough * 0.4, 0.05 + rough * 0.4, up));
  // black flags left and right draw the glass's edges
  float flag = smoothstep(0.56 - rough * 0.5, 0.8 + rough * 0.3, abs(d.x)) * (1.0 - smoothstep(0.42, 0.8 + rough, abs(up - 0.12)));
  c *= 1.0 - flag * mix(0.86, 0.6, uDark);
  // the softbox
  float cs = dot(d, SB_DIR);
  if (cs > 0.25) {
    vec2 sq = vec2(dot(d, SB_U), dot(d, SB_V)) / cs;
    vec2 e = abs(sq) - vec2(0.3, 0.44) + 0.12;
    float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.12;
    float m = 1.0 - smoothstep(-0.02 - rough * 0.5 - uDark * 0.03, 0.02 + rough * 0.5 + uDark * 0.03, sd);
    float lum = mix(5.0, 0.75, uDark) * (1.0 - 0.45 * dot(sq, sq)) * (0.8 + 0.2 * smoothstep(-0.4, 0.4, sq.y));
    c += m * lum * mix(vec3(1.0, 0.99, 0.97), vec3(0.86, 0.9, 1.0), uDark) / (1.0 + rough * 6.0);
  }
  // a tall strip light behind, on the right
  float sa = dot(normalize(d.xz), normalize(STRIP_DIR.xz));
  float strip = smoothstep(0.9965 - rough * 0.08, 0.9992 + rough * 0.02, sa) * smoothstep(-0.3, -0.12, up) * (1.0 - smoothstep(0.55, 0.75, up));
  c += strip * mix(3.4, 1.1, uDark) * vec3(1.0, 0.98, 0.95) / (1.0 + rough * 24.0);
  return c;
}

/* -------------------------------------------------------------------- */
/* the floor                                                             */
/* -------------------------------------------------------------------- */

float ellipseShadow(vec2 at, vec2 c, vec2 dir, float stretch, float r, float soft) {
  vec2 e = at - c;
  vec2 u = vec2(dot(e, dir) / stretch, dot(e, vec2(-dir.y, dir.x)));
  return 1.0 - smoothstep(r - soft, r + soft, length(u));
}

vec3 floorColor(vec3 ro, vec3 rd) {
  if (rd.y > -1e-4) return uBg;
  float t = (FLOOR_Y - ro.y) / rd.y;
  vec3 p = ro + rd * t;
  float lift = max(0.0, uFoot.y - FLOOR_Y);
  float d = length(p.xz - uFoot.xz);
  // contact under the foot: tight while it sits, loose and faint as it rises
  float tilt = clamp(1.0 - uFootUp.y, 0.0, 1.0);
  float contact = (1.0 - smoothstep(${f(B.footR * 0.7)}, ${f(B.footR + 0.08)} + lift * 1.8 + tilt * 0.6, d)) * mix(0.62, 0.06, clamp(lift * 2.6, 0.0, 1.0));
  // cast shadows along the key light
  vec2 dirL = normalize(-uKey.xz);
  float run = length(uKey.xz) / uKey.y;
  float stretch = 1.0 / max(0.3, uKey.y);
  vec3 bc = uFoot + uFootUp * 0.3;
  vec2 cb = bc.xz + dirL * (bc.y - FLOOR_Y) * run;
  float baseCast = ellipseShadow(p.xz, cb, dirL, stretch, 0.86, 0.36 + lift * 0.4);
  vec2 cg = uGlobe.xz + dirL * (uGlobe.y - FLOOR_Y) * run;
  float globeCast = ellipseShadow(p.xz, cg, dirL, stretch, 0.9, 0.55);
  float caustic = ellipseShadow(p.xz, cg + dirL * 0.2, dirL, stretch, 0.18, 0.2);
  float sh = max(contact, baseCast * 0.3) + globeCast * 0.06;
  vec3 col = uBg * (1.0 - clamp(sh, 0.0, 0.9));
  col += uBg * caustic * 0.09 * (1.0 - uDark);
  // at night the cabin glows through the water onto the floor
  float spill = exp(-dot(p.xz - uGlobe.xz, p.xz - uGlobe.xz) * 0.9);
  col += vec3(1.0, 0.5, 0.18) * uWin * uNight * spill * 0.016;
  return col;
}

/* -------------------------------------------------------------------- */
/* the turned base                                                       */
/* -------------------------------------------------------------------- */

float sdBox2(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

// (distance, material: 0 walnut, 1 brass)
vec2 mapBase(vec3 p) {
  vec2 q = vec2(length(p.xz), p.y);
  float foot = sdBox2(q - vec2(0.0, ${f((B.floor + B.footTop) / 2)}), vec2(${f(B.footR - 0.035)}, ${f((B.footTop - B.floor) / 2 - 0.035)})) - 0.035;
  float bead = length(q - vec2(${f(B.beadR)}, ${f(B.beadY)})) - ${f(B.beadT)};
  float t = clamp((${f(B.bodyY1)} - q.y) / ${f(B.bodyY1 - B.bodyY0)}, 0.0, 1.0);
  float rr = ${f(B.bodyR1)} + ${f(B.bodyR0 - B.bodyR1)} * pow(t, 2.2);
  float body = max((q.x - rr) * 0.8, max(q.y - ${f(B.bodyY1)}, ${f(B.bodyY0 - 0.01)} - q.y));
  float collar = sdBox2(q - vec2(0.0, ${f((B.collarY0 + B.collarY1) / 2)}), vec2(${f(B.collarR - 0.012)}, ${f((B.collarY1 - B.collarY0) / 2 - 0.012)})) - 0.012;
  float band = sdBox2(q - vec2(0.0, ${f((B.bandY0 + B.bandY1) / 2)}), vec2(${f(B.bandR - 0.006)}, ${f((B.bandY1 - B.bandY0) / 2)})) - 0.006;
  float wood = smin(smin(foot, bead, 0.02), body, 0.025);
  wood = min(wood, collar);
  return band < wood ? vec2(band, 1.0) : vec2(wood, 0.0);
}

vec3 baseNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0) * 0.0007;
  return normalize(k.xyy * mapBase(p + k.xyy).x + k.yyx * mapBase(p + k.yyx).x + k.yxy * mapBase(p + k.yxy).x + k.xxx * mapBase(p + k.xxx).x);
}

// ray against the base's bounding cylinder, then marched
float traceBase(vec3 ro, vec3 rd, out float mat) {
  mat = 0.0;
  const float RB = ${f(B.footR + 0.01)};
  const float Y0 = ${f(B.floor - 0.005)};
  const float Y1 = ${f(B.collarY1 + 0.005)};
  float a = dot(rd.xz, rd.xz);
  float b = dot(ro.xz, rd.xz);
  float c = dot(ro.xz, ro.xz) - RB * RB;
  float h = b * b - a * c;
  if (h < 0.0) return 1e9;
  h = sqrt(h);
  float t0 = (-b - h) / a;
  float t1 = (-b + h) / a;
  float ty0 = (Y0 - ro.y) / rd.y;
  float ty1 = (Y1 - ro.y) / rd.y;
  t0 = max(t0, min(ty0, ty1));
  t1 = min(t1, max(ty0, ty1));
  if (t0 > t1 || t1 < 0.0) return 1e9;
  float t = max(t0, 0.0);
  for (int i = 0; i < ${q.baseSteps}; i++) {
    vec2 d = mapBase(ro + rd * t);
    if (d.x < 0.0004 * t) { mat = d.y; return t; }
    t += d.x;
    if (t > t1) break;
  }
  return 1e9;
}

vec3 shadeBase(vec3 pO, vec3 rdW, float mat) {
  vec3 nO = baseNormal(pO);
  vec3 n = uRot * nO;
  float ndl = max(0.0, dot(n, uKey));
  vec3 keyS = mix(vec3(1.0, 0.97, 0.92) * 1.6, vec3(0.8, 0.84, 1.0) * 0.4, uDark);
  vec3 amb = mix(uBg * 0.5, vec3(0.012, 0.012, 0.016), uDark) * (0.6 + 0.4 * n.y);
  vec3 r = reflect(rdW, n);
  float cosv = max(0.0, -dot(rdW, n));
  // a little light from the window comes down through the water onto the collar
  float warm = uWin * uNight * smoothstep(-0.9, -0.72, pO.y) * 0.08;
  if (mat > 0.5) {
    // brass: brushed round the turning
    vec3 f0 = vec3(0.92, 0.7, 0.38);
    vec3 fr = f0 + (1.0 - f0) * pow(1.0 - cosv, 5.0);
    float brush = 0.92 + 0.08 * sin(pO.y * 900.0);
    vec3 col = studio(r, 0.18) * fr * brush * 0.85;
    col += f0 * (keyS * ndl * 0.25 + amb * 0.3);
    col += vec3(1.0, 0.6, 0.25) * warm * 2.0;
    return col;
  }
  // walnut: growth rings cut across by the turning, under a clear coat
  float rings = length(vec2(pO.z + 2.4, pO.y * 0.55 + pO.x * 0.1)) * 58.0 + noise3(pO * vec3(2.5, 7.0, 2.5)) * 3.0;
  float g = smoothstep(0.2, 1.0, abs(fract(rings) * 2.0 - 1.0));
  float streak = noise3(vec3(pO.x * 6.0, pO.y * 140.0, pO.z * 6.0));
  float pore = step(0.83, noise3(pO * vec3(220.0, 60.0, 220.0)));
  vec3 alb = mix(vec3(0.085, 0.048, 0.028), vec3(0.15, 0.088, 0.05), g * 0.55 + streak * 0.45) * (1.0 - 0.18 * pore);
  vec3 col = alb * (keyS * ndl + amb) * mix(1.0, 2.2, uDark);
  col += alb * vec3(1.0, 0.6, 0.3) * warm * 6.0;
  float fr = 0.04 + 0.96 * pow(1.0 - cosv, 5.0);
  col += studio(r, 0.06) * fr * 0.85;
  return col;
}

/* -------------------------------------------------------------------- */
/* the diorama                                                           */
/* -------------------------------------------------------------------- */

vec3 sceneNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0) * 0.0009;
  return normalize(k.xyy * map(p + k.xyy).x + k.yyx * map(p + k.yyx).x + k.yxy * map(p + k.yxy).x + k.xxx * map(p + k.xxx).x);
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0;
  float t = 0.012;
  for (int i = 0; i < ${q.shadowSteps}; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.01, 0.09);
    if (res < 0.02 || t > 1.1) break;
  }
  return clamp(res, 0.0, 1.0);
}

float occlusion(vec3 p, vec3 n) {
  float o = 0.0;
  float s = 1.0;
  for (int i = 1; i <= 3; i++) {
    float h = 0.012 * float(i * i) + 0.006;
    o += (h - map(p + n * h).x) * s;
    s *= 0.62;
  }
  return clamp(1.0 - 3.2 * o, 0.0, 1.0);
}

// The sky painted behind the scene. Through the lens the exit point folds
// back near the rim, so the painting is placed by the average of where the
// ray enters the water and where it leaves it, which runs smoothly across
// the globe: u across, v up (about -0.7 .. 0.65).
float ridgeAt(float u) {
  return -0.2 + 0.075 * sin(u * 4.3 + 1.1) + 0.05 * sin(u * 9.1 + 0.4) + 0.022 * sin(u * 21.0 + 2.0);
}

vec3 backdrop(vec2 uv) {
  float u = uv.x;
  float v = uv.y;
  // day: a clear winter sky, paler toward the hills
  vec3 day = mix(vec3(0.8, 0.87, 0.96), vec3(0.3, 0.5, 0.88), ss(-0.32, 0.6, v));
  day += vec3(1.0, 0.9, 0.72) * 0.25 * exp(-5.0 * dot(uv - vec2(-0.55, 0.42), uv - vec2(-0.55, 0.42)));
  // night: deep blue, stars, the moon
  vec3 night = mix(vec3(0.075, 0.09, 0.21), vec3(0.012, 0.02, 0.06), ss(-0.35, 0.6, v));
  vec2 sc = uv * 70.0;
  float star = step(0.985, hash12(floor(sc))) * ss(0.4, 0.0, length(fract(sc) - 0.5));
  night += vec3(0.8, 0.85, 1.0) * star * (0.4 + 0.6 * hash12(floor(sc) + 7.0)) * ss(-0.18, 0.15, v) * 1.5;
  vec2 mp = uv - vec2(0.34, 0.34);
  float md = length(mp);
  night += vec3(0.6, 0.7, 1.0) * 0.16 * exp(-md * 6.0);
  float moon = 1.0 - smoothstep(0.055, 0.063, md);
  float lit = smoothstep(-0.05, 0.03, dot(mp, normalize(vec2(-0.8, 0.5))) + 0.02);
  night = mix(night, vec3(0.97, 0.95, 0.88) * (1.15 - 0.3 * noise3(vec3(mp * 70.0, 1.0))) * mix(0.18, 1.0, lit), moon);
  // far mountains: lit from the left, snow on the tops
  float ridge = ridgeAt(u);
  float slope = (ridgeAt(u + 0.01) - ridge) / 0.01;
  float mtn = ss(ridge + 0.004, ridge - 0.004, v);
  float face = clamp(0.5 - slope * 0.6, 0.0, 1.0);
  float cap = ss(ridge - 0.09, ridge - 0.015, v) * (0.55 + 0.45 * noise3(vec3(u * 30.0, v * 30.0, 2.0)));
  vec3 mDay = mix(vec3(0.46, 0.55, 0.72), vec3(0.62, 0.7, 0.84), face);
  mDay = mix(mDay, mix(vec3(0.74, 0.8, 0.9), vec3(0.95, 0.97, 1.0), face), cap);
  vec3 mNight = mix(vec3(0.03, 0.045, 0.1), vec3(0.08, 0.1, 0.2), face);
  mNight = mix(mNight, mix(vec3(0.1, 0.13, 0.24), vec3(0.3, 0.36, 0.55), face), cap);
  // a band of forest nearer in
  float saw = 1.0 - abs(fract(u * 13.0) * 2.0 - 1.0);
  float tl = -0.4 + 0.045 * saw * (0.6 + 0.4 * sin(u * 3.7 + 1.0)) + 0.015 * sin(u * 5.0);
  float wood = ss(tl + 0.004, tl - 0.004, v);
  day = mix(mix(day, mDay, mtn), vec3(0.24, 0.36, 0.42), wood);
  night = mix(mix(night, mNight, mtn), vec3(0.018, 0.03, 0.065), wood);
  return mix(day, night, uNight);
}

vec3 shadeDiorama(vec3 p, vec3 rd, float mat, vec3 L) {
  vec3 n = sceneNormal(p);
  vec3 keyCol = mix(vec3(1.0, 0.94, 0.84) * 2.25, vec3(0.55, 0.66, 1.0) * 0.5, uNight);
  vec3 skyCol = mix(vec3(0.6, 0.72, 0.96) * 0.62, vec3(0.12, 0.17, 0.36) * 0.42, uNight);
  vec3 winCol = vec3(1.0, 0.56, 0.22) * 2.6 * uWin;
  float ndl = dot(n, L);
  float sh = ndl > -0.25 ? softShadow(p + n * 0.006, L) : 0.0;
  float ao = occlusion(p, n);
  vec3 alb;
  float wrap = 0.0;
  float spec = 0.0;
  vec3 emit = vec3(0.0);
  vec3 q = cabinLocal(p);
  if (mat == M_SNOW) {
    alb = vec3(0.92, 0.94, 0.98);
    // packed against the glass low down: a little greyer with depth
    float under = clamp((groundH(p.xz) - p.y) * 5.0, 0.0, 1.0);
    alb *= 1.0 - 0.1 * under;
    // a trodden path from the door
    float path = (1.0 - smoothstep(0.024, 0.04, abs(q.x - DOOR.x + 0.01 * sin(q.z * 30.0)))) * smoothstep(CAB_WZ, CAB_WZ + 0.03, q.z) * (1.0 - smoothstep(0.32, 0.5, q.z));
    alb *= 1.0 - 0.13 * path;
    wrap = 0.3;
    spec = 1.0;
  } else if (mat == M_WALL) {
    // round logs: a groove every 2.4 cm, each log shaded as a cylinder
    float f = fract(q.y / 0.024);
    vec3 bend = vec3(0.0, (0.5 - f) * 1.4, 0.0);
    n = normalize(n + bend);
    ndl = dot(n, L);
    float groove = smoothstep(0.0, 0.12, f) * ss(1.0, 0.86, f);
    float grain = noise3(vec3(q.x * 40.0, q.y * 300.0, q.z * 40.0));
    alb = vec3(0.17, 0.09, 0.05) * (0.55 + 0.45 * groove) * (0.85 + 0.3 * grain);
    // the window frames, door and trim
    float onFront = step(CAB_WZ - 0.013, q.z);
    vec2 wf = abs(q.xy - WIN_F.xy) - WIN_F.zw;
    vec2 dd = abs(q.xy - DOOR.xy) - DOOR.zw;
    vec2 sw = abs(q.zy - WIN_S.xy) - WIN_S.zw;
    float onSide = step(q.x, -CAB_WX + 0.013);
    if (onFront > 0.5 && max(wf.x, wf.y) < 0.0) {
      if (q.z < CAB_WZ - 0.009) {
        mat = M_GLASS;
        vec2 g = q.xy - WIN_F.xy;
        float bar = min(abs(g.x), abs(g.y));
        if (bar < 0.0045) mat = M_FRAME;
      } else mat = M_FRAME;
    } else if (onSide > 0.5 && max(sw.x, sw.y) < 0.0) {
      if (q.x > -CAB_WX + 0.009) {
        mat = M_GLASS;
        float bar = abs(q.z - WIN_S.x);
        if (bar < 0.004) mat = M_FRAME;
      } else mat = M_FRAME;
    } else if (onFront > 0.5 && max(dd.x, dd.y) < 0.0) {
      mat = M_DOOR;
    } else if (max(wf.x, wf.y) < 0.012 && max(wf.x, wf.y) > 0.0 && onFront > 0.5) {
      alb = vec3(0.62, 0.56, 0.48);
    } else if (max(sw.x, sw.y) < 0.011 && max(sw.x, sw.y) > 0.0 && onSide > 0.5) {
      alb = vec3(0.62, 0.56, 0.48);
    }
    if (mat == M_FRAME) alb = vec3(0.66, 0.6, 0.52);
    if (mat == M_DOOR) {
      float plank = smoothstep(0.0, 0.15, fract((q.x - DOOR.x) / 0.016 + 0.5)) * 0.25 + 0.75;
      alb = vec3(0.24, 0.12, 0.06) * plank;
    }
    if (mat == M_GLASS) {
      vec2 g = mat == M_GLASS && onFront > 0.5 ? (q.xy - WIN_F.xy) / WIN_F.zw : vec2((q.z - WIN_S.x) / WIN_S.z, (q.y - WIN_S.y) / WIN_S.w);
      // dark glass by day; at night the room behind it glows, warmer and brighter low down
      alb = vec3(0.02, 0.025, 0.035);
      float room = 0.7 + 0.3 * ss(1.0, -1.0, g.y) - 0.15 * dot(g, g);
      emit = vec3(1.0, 0.6, 0.26) * 3.2 * uWin * room;
      vec3 r = reflect(rd, n);
      emit += mix(vec3(0.55, 0.66, 0.85), vec3(0.06, 0.08, 0.16), uNight) * 0.35 * smoothstep(-0.2, 0.6, r.y);
    }
  } else if (mat == M_ROOF) {
    float top = smoothstep(0.35, 0.6, n.y);
    float sB = CAB_SLOPE.x * abs(q.z) + CAB_SLOPE.y * (q.y - CAB_RIDGE);
    top = max(top, smoothstep(CAB_RT * 0.45, CAB_RT * 0.7, sB));
    alb = mix(vec3(0.1, 0.06, 0.04), vec3(0.93, 0.95, 0.99), top);
    wrap = 0.3 * top;
    spec = top;
  } else if (mat == M_STONE) {
    vec2 st = vec2(q.x + q.z, q.y) / vec2(0.022, 0.016);
    st.x += floor(st.y) * 0.5;
    float joint = smoothstep(0.0, 0.12, min(fract(st.x), fract(st.y))) * ss(1.0, 0.88, max(fract(st.x), fract(st.y)));
    alb = vec3(0.3, 0.28, 0.27) * (0.7 + 0.3 * joint) * (0.85 + 0.3 * hash12(floor(st)));
  } else if (mat == M_PINE) {
    float nv = noise3(p * 90.0);
    alb = mix(vec3(0.03, 0.085, 0.055), vec3(0.06, 0.14, 0.08), nv);
    // snow lies on the upper side of the boughs
    float lie = ss(0.45 + 0.25 * noise3(p * 40.0), 0.78, n.y);
    alb = mix(alb, vec3(0.9, 0.93, 0.98), lie);
    wrap = 0.25 * lie;
    spec = lie;
  } else {
    alb = vec3(0.12, 0.07, 0.04);
  }

  vec3 h = normalize(L - rd);
  float diff = max(0.0, (ndl + wrap) / (1.0 + wrap));
  vec3 col = alb * keyCol * diff * sh;
  col += alb * skyCol * (0.55 + 0.45 * n.y) * ao;
  // snow scatters a little blue light into its own shadows
  col += alb * spec * vec3(0.12, 0.17, 0.3) * (1.0 - sh) * (1.0 - uNight) * 0.6 * ao;
  col += alb * windowLight(p, n, winCol) * mix(0.6, 1.0, ao);
  // glints in the snow
  if (spec > 0.0) {
    vec3 cell = floor(p * 520.0);
    float g = step(0.9955, hash13(cell));
    col += keyCol * g * spec * pow(max(0.0, dot(n, h)), 24.0) * sh * 2.2;
    col += winCol * g * spec * 0.25 * ss(0.35, 0.0, length(p - WIN_FRONT));
  }
  col += emit;
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec3 rdW = normalize(uFwd * uFocal + uRight * (frag.x - uCenter.x) + uUp * (frag.y - uCenter.y));
  mat3 inv = transpose(uRot);
  vec3 roO = inv * (uCam - PIVOT - uOffset) + PIVOT;
  vec3 rdO = inv * rdW;

  vec3 behind = floorColor(uCam, rdW);
  float bm;
  float tb = traceBase(roO, rdO, bm);
  if (tb < 1e8) behind = shadeBase(roO + rdO * tb, rdW, bm);

  vec4 seen = vec4(behind, 0.0);
  vec4 refl = vec4(0.0, 0.0, 0.0, 1.0);

  // the glass
  float b = dot(roO, rdO);
  float c = dot(roO, roO) - R_OUT * R_OUT;
  float disc = b * b - c;
  float closest = length(roO - rdO * b);
  float pixel = max(-b, 0.1) / uFocal;
  float cover = clamp((R_OUT - closest) / pixel + 0.5, 0.0, 1.0);
  if (disc > -0.05 && cover > 0.0) {
    float tg = -b - sqrt(max(disc, 0.0));
    if (tg < tb) {
      vec3 P1 = roO + rdO * tg;
      vec3 N1 = normalize(P1);
      float cosi = clamp(-dot(rdO, N1), 0.0, 1.0);
      float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      vec3 rr = studio(uRot * reflect(rdO, N1), 0.0);
      vec3 d1 = refract(rdO, N1, 1.0 / IOR_G);
      vec3 col;
      float depth = 0.0;
      float bi = dot(P1, d1);
      float ci = dot(P1, P1) - R_IN * R_IN;
      float hi = bi * bi - ci;
      if (hi > 0.0 && dot(d1, d1) > 0.5) {
        vec3 P2 = P1 + d1 * (-bi - sqrt(hi));
        vec3 N2 = P2 / R_IN;
        vec3 d2 = refract(d1, N2, IOR_G / IOR_W);
        float tE = -2.0 * dot(P2, d2);
        vec3 L = inv * uKey;
        float t = 0.0;
        float mat = -1.0;
        for (int i = 0; i < ${q.steps}; i++) {
          vec2 h = map(P2 + d2 * t);
          if (h.x < 0.0005 + 0.0008 * t) { mat = h.y; break; }
          t += h.x;
          if (t > tE) break;
        }
        vec3 waterCol = mix(vec3(0.7, 0.8, 0.95), vec3(0.04, 0.055, 0.12), uNight);
        if (mat > 0.0 && t < tE) {
          col = shadeDiorama(P2 + d2 * t, d2, mat, L);
        } else {
          t = tE;
          vec3 E = P2 + d2 * tE;
          col = backdrop(0.5 * (P2.xy + E.xy) / R_IN);
        }
        // a hint of the water, and the window's glow hanging in it
        col = mix(col, waterCol, (1.0 - exp(-t * 0.2)) * 0.32);
        float glow = 0.0;
        float tc = clamp(dot(WIN_FRONT - P2, d2), 0.0, t);
        vec3 cp = P2 + d2 * tc - WIN_FRONT;
        glow += 0.0016 / (dot(cp, cp) + 0.0022);
        tc = clamp(dot(WIN_SIDE - P2, d2), 0.0, t);
        cp = P2 + d2 * tc - WIN_SIDE;
        glow += 0.0011 / (dot(cp, cp) + 0.0022);
        col += vec3(1.0, 0.5, 0.18) * glow * uWin;
        depth = t / (2.0 * R_IN);
      } else {
        // the rim: only glass on this path
        float bo = dot(P1, d1);
        vec3 P3 = P1 + d1 * (-2.0 * bo);
        vec3 N3 = P3 / R_OUT;
        vec3 d3 = refract(d1, -N3, IOR_G);
        if (dot(d3, d3) < 0.5) d3 = reflect(d1, -N3);
        col = floorColor(uRot * (P3 - PIVOT) + PIVOT + uOffset, uRot * d3) * vec3(0.72, 0.8, 0.78);
      }
      vec4 glassSeen = vec4(col, depth);
      // the silhouette is blended over what is behind it
      seen = vec4(mix(behind, glassSeen.rgb, cover), cover > 0.5 ? glassSeen.a : 0.0);
      refl = vec4(rr * F * cover, mix(1.0, 1.0 - F, cover));
    }
  }
  outSeen = vec4(seen.rgb * uEnc, seen.a);
  outRefl = vec4(refl.rgb * uEnc, refl.a);
}
`;
}

/* ---------------------------------------------------------------------- */
/* flakes                                                                  */
/* ---------------------------------------------------------------------- */

export function flakesVS(): string {
  return /* glsl */ `#version 300 es
precision highp float;
${common()}
layout(location = 0) in vec4 aPos;
layout(location = 1) in vec4 aAttr;

uniform vec3 uCamO;
uniform mat3 uRot;
uniform vec3 uOffset;
uniform vec3 uCam;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uFocal;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uTime;
uniform float uNight;
uniform float uWin;
uniform float uStir;
uniform float uFocus;
uniform float uDof;
uniform float uMinPx;
uniform float uEnc;
uniform vec3 uKeyO;

out vec4 vCol;
out float vDepth;
out float vPx;
out float vSoft;

vec2 trace(vec2 c, float th, out vec2 s2) {
  vec2 s = R_OUT * vec2(cos(th), sin(th));
  vec2 d = normalize(s - c);
  vec2 d1 = refract(d, s / R_OUT, 1.0 / IOR_G);
  float b = dot(s, d1);
  float cc = dot(s, s) - R_IN * R_IN;
  float h = b * b - cc;
  if (h < 0.0) { s2 = s; return vec2(0.0); }
  s2 = s + d1 * (-b - sqrt(h));
  return refract(d1, s2 / R_IN, IOR_G / IOR_W);
}

void main() {
  vec3 p = aPos.xyz;
  float rad = abs(aPos.w);
  bool resting = aPos.w < 0.0;
  float seed = aAttr.x;
  float kind = aAttr.y;

  float cl = length(uCamO);
  vec3 e1 = uCamO / cl;
  float al = dot(p, e1);
  vec3 perp = p - al * e1;
  float py = length(perp);
  vec3 e2 = py > 1e-6 ? perp / py : normalize(cross(e1, vec3(0.0, 1.0, 0.0)));
  vec2 c = vec2(cl, 0.0);
  vec2 qp = vec2(al, py);
  float lo = 0.0;
  float hi = acos(R_OUT / cl) - 1e-4;
  vec2 s2;
  for (int i = 0; i < 16; i++) {
    float th = 0.5 * (lo + hi);
    vec2 d2 = trace(c, th, s2);
    float res = dot(d2, d2) < 0.5 ? 1.0 : d2.x * (qp.y - s2.y) - d2.y * (qp.x - s2.x);
    if (res < 0.0) lo = th; else hi = th;
  }
  float th = 0.5 * (lo + hi);
  vec2 d2 = trace(c, th, s2);
  float miss = dot(d2, d2) < 0.5 ? 1.0 : abs(d2.x * (qp.y - s2.y) - d2.y * (qp.x - s2.x));
  float along = dot(qp - s2, d2);
  if (miss > 0.01 || along < 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  vec3 S = R_OUT * (cos(th) * e1 + sin(th) * e2);
  vec3 Sw = uRot * (S - PIVOT) + PIVOT + uOffset;
  vec3 v = Sw - uCam;
  float z = dot(v, uFwd);
  vec2 px = uCenter + uFocal * vec2(dot(v, uRight), dot(v, uUp)) / z;
  gl_Position = vec4(px / uSize * 2.0 - 1.0, 0.0, 1.0);
  vDepth = along / (2.0 * R_IN);

  // size through the lens, and focus
  vec3 pw = uRot * (p - PIVOT) + PIVOT + uOffset;
  float zf = dot(pw - uCam, uFwd);
  float r = rad * uFocal / zf * 1.3;
  float coc = resting ? 0.0 : abs(zf - uFocus) * uDof;
  float size = max(sqrt(r * r + coc * coc), uMinPx);
  float energy = clamp((r * r + 0.3) / (size * size), 0.12, 1.0);
  vPx = size;
  vSoft = clamp(coc / max(size, 1e-3), 0.0, 1.0);
  gl_PointSize = size * 2.0 + 2.0;

  // light: sun or moon, the sky, the windows
  vec3 keyCol = mix(vec3(1.0, 0.95, 0.86) * 1.5, vec3(0.6, 0.7, 1.0) * 0.42, uNight);
  vec3 amb = mix(vec3(0.66, 0.76, 0.96) * 0.75, vec3(0.16, 0.22, 0.44) * 0.5, uNight);
  vec3 winCol = vec3(1.0, 0.56, 0.22) * 2.6 * uWin;
  vec3 col = vec3(0.96, 0.97, 1.0) * (keyCol * 0.62 + amb);
  vec3 toW = WIN_FRONT - p;
  float near = 1.0 / (1.0 + dot(toW, toW) * 40.0);
  col += winCol * near * 1.6 * smoothstep(-0.2, 0.4, -dot(normalize(toW), WIN_FRONT_N));
  vec3 toS = WIN_SIDE - p;
  col += winCol * 1.2 / (1.0 + dot(toS, toS) * 40.0) * smoothstep(-0.2, 0.4, -dot(normalize(toS), WIN_SIDE_N));
  float alpha = (kind > 0.5 && kind < 1.5 ? 0.82 : 0.95) * energy;
  if (kind > 1.5) {
    // glitter: a flat flake turning; it flashes when it faces between the light and the eye
    float spin = aAttr.z + uTime * aAttr.w * (1.0 + uStir * 5.0);
    vec3 nrm = normalize(vec3(sin(spin) * cos(seed * 9.0), cos(spin * 1.3 + seed), sin(spin * 0.7 + seed * 4.0)));
    vec3 hv = normalize(uKeyO + e1);
    float flash = pow(abs(dot(nrm, hv)), 40.0);
    col = mix(col * 0.55, keyCol * 3.2 + winCol * near * 3.0, flash);
    alpha = mix(0.5, 1.0, flash) * energy;
  }
  if (resting) alpha *= 0.9;
  vCol = vec4(col * alpha * uEnc, alpha);
}
`;
}

export const FLAKES_FS = /* glsl */ `#version 300 es
precision highp float;
in vec4 vCol;
in float vDepth;
in float vPx;
in float vSoft;
uniform sampler2D uSeen;
out vec4 outColor;
void main() {
  float scene = texelFetch(uSeen, ivec2(gl_FragCoord.xy), 0).a;
  if (scene <= 0.0 || vDepth > scene + 0.002) discard;
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = length(q) * (vPx + 1.0) / max(vPx, 1e-3);
  float edge = 1.0 / max(vPx, 1.0);
  float a = 1.0 - smoothstep(1.0 - edge * 1.5, 1.0 + edge, r);
  // sharp flakes have a soft core; out of focus ones are flat discs with a faint rim
  a *= mix(1.0 - 0.45 * r * r, 0.85 + 0.15 * r * r, vSoft);
  if (a <= 0.002) discard;
  outColor = vCol * a;
}
`;

/* ---------------------------------------------------------------------- */
/* composite                                                               */
/* ---------------------------------------------------------------------- */

export const COMPOSITE_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uSeen;
uniform sampler2D uRefl;
uniform sampler2D uFlakes;
uniform vec2 uCanvas;
uniform vec2 uTexel;
uniform float uDec;
uniform float uExposure;
uniform float uAA;
out vec4 outColor;

float tone(float x) {
  const float K = ${f(KNEE)};
  return x < K ? x : K + (1.0 - K) * (1.0 - exp(-(x - K) / (1.0 - K)));
}
vec3 srgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// the three layers put together and toned (linear, 0..1)
vec3 shade(vec2 uv) {
  vec4 a = texture(uSeen, uv);
  vec4 b = texture(uRefl, uv);
  vec4 fl = texture(uFlakes, uv);
  vec3 c = (a.rgb * uDec * (1.0 - fl.a) + fl.rgb * uDec) * b.a + b.rgb * uDec;
  c *= uExposure;
  return clamp(vec3(tone(c.r), tone(c.g), tone(c.b)), 0.0, 1.0);
}
float luma(vec3 c) {
  return sqrt(dot(c, vec3(0.299, 0.587, 0.114)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uCanvas;
  vec3 c = shade(uv);
  if (uAA > 0.5) {
    // FXAA (the small console variant) where the scene is drawn at 1×
    vec2 px = uTexel;
    vec3 nw = shade(uv + vec2(-1.0, -1.0) * px);
    vec3 ne = shade(uv + vec2(1.0, -1.0) * px);
    vec3 sw = shade(uv + vec2(-1.0, 1.0) * px);
    vec3 se = shade(uv + vec2(1.0, 1.0) * px);
    float lNW = luma(nw), lNE = luma(ne), lSW = luma(sw), lSE = luma(se), lM = luma(c);
    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    if (lMax - lMin > max(0.04, lMax * 0.1)) {
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
      float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
      float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
      dir = clamp(dir * rcp, vec2(-6.0), vec2(6.0)) * px;
      vec3 a = 0.5 * (shade(uv + dir * (1.0 / 3.0 - 0.5)) + shade(uv + dir * (2.0 / 3.0 - 0.5)));
      vec3 b = a * 0.5 + 0.25 * (shade(uv - dir * 0.5) + shade(uv + dir * 0.5));
      float lB = luma(b);
      c = lB < lMin || lB > lMax ? a : b;
    }
  }
  c = srgb(c);
  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(c, 1.0);
}
`;
