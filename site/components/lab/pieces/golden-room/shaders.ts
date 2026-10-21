// GLSL for the golden hour room (WebGL2). The programs:
//
//   GBUFFER   the room as signed distance fields, ray-marched once per
//             size (the camera never moves): depth, normal, material and
//             ambient occlusion into two RGBA8 targets.
//   LIGHT     every frame: rebuilds each pixel's point from the depth and
//             lights it. Sunlight only gets in through the window, so its
//             visibility is the window's opening, frame and glazing bars
//             found analytically along the ray to the sun (soft by distance,
//             so the bars' shadows are crisp by the sill and soft across
//             the room), times a soft shadow ray-marched through the
//             furniture only. Then the sky through the window as an area
//             light, the patch's bounce, the lamp (a spot with its own soft
//             shadows) and the screen; the background, the sun disc and its
//             glow. A hue-keeping tone curve, so golden light stays golden.
//   SHAFTS    at half size: the light scattered by the air in the beam,
//             marched from where each view ray enters the room to the
//             surface it hits, then blurred.
//   MOTES     dust drifting through the room, lit only where it crosses
//             the beam, hidden behind things by the cached depth.
//   BLOOM / COMPOSITE  a quarter-size glow, then FXAA and the upscale.
//
// Everything about the room's shape comes from scene.ts, baked in as
// constants by sceneGlsl().

import {
  BACK,
  CHAIR,
  CLOCK,
  DESK,
  DESK_Y,
  LAMP,
  LEAVES,
  MONITOR,
  PLANT,
  PRINT,
  RIGHT,
  ROOM,
  STEM,
  TARGET,
  UP,
  WINDOW,
} from "./scene";

type V3 = readonly [number, number, number];

const f = (n: number) => {
  const s = n.toFixed(5);
  return s.includes(".") ? s : `${s}.0`;
};
const v3 = (a: V3) => `vec3(${f(a[0])}, ${f(a[1])}, ${f(a[2])})`;
const arr = (name: string, items: readonly V3[]) =>
  `const vec3 ${name}[${items.length}] = vec3[${items.length}](${items.map(v3).join(", ")});`;

/** Bounds of the plant (pot, stem, leaves) for culling. */
function plantBounds(): { c: V3; h: V3 } {
  let lo: [number, number, number] = [PLANT.at[0] - PLANT.potR1, 0, PLANT.at[2] - PLANT.potR1];
  let hi: [number, number, number] = [PLANT.at[0] + PLANT.potR1, PLANT.potH, PLANT.at[2] + PLANT.potR1];
  const grow = (p: V3, r: number) => {
    lo = [Math.min(lo[0], p[0] - r), Math.min(lo[1], p[1] - r), Math.min(lo[2], p[2] - r)];
    hi = [Math.max(hi[0], p[0] + r), Math.max(hi[1], p[1] + r), Math.max(hi[2], p[2] + r)];
  };
  for (const s of STEM) grow(s, 0.02);
  for (const leaf of LEAVES) grow(leaf.c, leaf.len + 0.03);
  return {
    c: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2],
    h: [(hi[0] - lo[0]) / 2 + 0.01, (hi[1] - lo[1]) / 2 + 0.01, (hi[2] - lo[2]) / 2 + 0.01],
  };
}

/** The leaf petioles start on the stem: the point of the stem nearest each leaf's base. */
function leafStems(): V3[] {
  return LEAVES.map((leaf) => {
    const base: V3 = [leaf.c[0] - leaf.u[0] * leaf.len, leaf.c[1] - leaf.u[1] * leaf.len, leaf.c[2] - leaf.u[2] * leaf.len];
    let best: V3 = STEM[0];
    let bestD = Infinity;
    for (let s = 0; s < STEM.length - 1; s++) {
      const a = STEM[s];
      const b = STEM[s + 1];
      for (let i = 0; i <= 20; i++) {
        const k = i / 20;
        const p: V3 = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
        const d = Math.hypot(p[0] - base[0], p[1] - base[1], p[2] - base[2]);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
    }
    return best;
  });
}

/** Constants and distance fields shared by every program. */
function sceneGlsl(): string {
  const plant = plantBounds();
  const leafBase = LEAVES.map((l) => [l.c[0] - l.u[0] * l.len * 0.92, l.c[1] - l.u[1] * l.len * 0.92, l.c[2] - l.u[2] * l.len * 0.92] as V3);
  const cy = Math.cos(CHAIR.yaw);
  const sy = Math.sin(CHAIR.yaw);
  return /* glsl */ `
#define PI 3.14159265
const float RW = ${f(ROOM.W)};
const float RD = ${f(ROOM.D)};
const float RH = ${f(ROOM.H)};
const float RT = ${f(ROOM.T)};
const float SLAB = ${f(ROOM.slab)};
const float WY0 = ${f(WINDOW.y0)};
const float WY1 = ${f(WINDOW.y1)};
const float WZ0 = ${f(WINDOW.z0)};
const float WZ1 = ${f(WINDOW.z1)};
const float WFRAME = ${f(WINDOW.frame)};
const float WBAR = ${f(WINDOW.bar)};
const float WCOLS = ${f(WINDOW.cols)};
const float WROWS = ${f(WINDOW.rows)};
const float GX = -RT * 0.5;

const vec3 CAM_RIGHT = ${v3(RIGHT)};
const vec3 CAM_UP = ${v3(UP)};
const vec3 CAM_BACK = ${v3(BACK)};
const vec3 CAM_TARGET = ${v3(TARGET)};
const float FAR = 14.0;
const float DEPTH_RANGE = 28.0;

const vec3 DESK_C = ${v3(DESK.top)};
const vec3 DESK_H = ${v3(DESK.half)};
const float DESK_Y = ${f(DESK_Y)};
const vec3 MON_C = ${v3(MONITOR.centre)};
const vec3 MON_H = ${v3(MONITOR.half)};
const float MON_BEZEL = ${f(MONITOR.bezel)};
const vec3 LAMP_BASE = ${v3(LAMP.base)};
const vec3 LAMP_ELBOW = ${v3(LAMP.elbow)};
const vec3 LAMP_HEAD = ${v3(LAMP.head)};
const vec3 LAMP_AXIS = ${v3(LAMP.axis)};
const vec3 LAMP_BULB = ${v3(LAMP.bulb)};
const float LAMP_LEN = ${f(LAMP.shadeLen)};
const float LAMP_R0 = ${f(LAMP.shadeR0)};
const float LAMP_R1 = ${f(LAMP.shadeR1)};
const vec3 CHAIR_AT = ${v3(CHAIR.at)};
const vec2 CHAIR_CS = vec2(${f(cy)}, ${f(sy)});
const vec3 PLANT_AT = ${v3(PLANT.at)};
const float POT_H = ${f(PLANT.potH)};
const float POT_R0 = ${f(PLANT.potR0)};
const float POT_R1 = ${f(PLANT.potR1)};
const vec3 STEM0 = ${v3(STEM[0])};
const vec3 STEM1 = ${v3(STEM[1])};
const vec3 STEM2 = ${v3(STEM[2])};
const vec3 CLOCK_C = ${v3(CLOCK.centre)};
const float CLOCK_R = ${f(CLOCK.r)};
const float CLOCK_D = ${f(CLOCK.depth)};
const vec3 PRINT_C = ${v3(PRINT.centre)};
const vec3 PRINT_H = ${v3(PRINT.half)};
const vec3 MUG_C = vec3(2.02, DESK_Y + 0.05, 0.53);
const vec3 BOOKS_C = vec3(2.1, DESK_Y, 0.22);
const vec3 KEYS_C = vec3(2.68, DESK_Y + 0.007, 0.53);
const vec3 MOUSE_C = vec3(3.04, DESK_Y + 0.011, 0.55);
const vec3 RUG_C = vec3(2.5, 0.004, 1.62);
const vec3 RUG_H = vec3(1.0, 0.004, 0.72);

#define LEAF_N ${LEAVES.length}
${arr("LEAF_C", LEAVES.map((l) => l.c))}
${arr("LEAF_U", LEAVES.map((l) => l.u))}
${arr("LEAF_W", LEAVES.map((l) => l.w))}
${arr("LEAF_V", LEAVES.map((l) => l.v))}
${arr("LEAF_R", LEAVES.map((l) => [l.len, l.wid, 0] as V3))}
${arr("LEAF_S", leafStems())}
${arr("LEAF_B", leafBase)}

// culling boxes (centre, half size) for the furniture groups
const vec3 DESKB_C = vec3(DESK_C.x, 0.72, 0.42);
const vec3 DESKB_H = vec3(DESK_H.x + 0.02, 0.72, 0.43);
const vec3 CHAIRB_C = vec3(CHAIR_AT.x, 0.45, CHAIR_AT.z);
const vec3 CHAIRB_H = vec3(0.34, 0.46, 0.34);
const vec3 PLANTB_C = ${v3(plant.c)};
const vec3 PLANTB_H = ${v3(plant.h)};
const vec3 DECOB_C = vec3(1.95, 1.62, 0.03);
const vec3 DECOB_H = vec3(1.0, 0.56, 0.04);

// materials
#define M_FLOOR 1.0
#define M_PLASTER 2.0
#define M_CUT 3.0
#define M_STEEL 4.0
#define M_GLASS 5.0
#define M_SILL 6.0
#define M_DESK 7.0
#define M_SCREEN 8.0
#define M_CHAIR 9.0
#define M_LEAF 10.0
#define M_POT 11.0
#define M_SOIL 12.0
#define M_MUG 13.0
#define M_BOOK1 14.0
#define M_BOOK2 15.0
#define M_BOOK3 16.0
#define M_RUG 17.0
#define M_KEYS 18.0
#define M_SHADE_IN 19.0
#define M_BULB 20.0
#define M_CLOCK 21.0
#define M_PRINT 22.0
#define M_STEM 23.0
#define M_SKIRT 24.0
#define M_SHELL 25.0
#define M_SHADE 26.0
#define M_COFFEE 27.0
#define M_BEZEL 28.0

/* --- distance helpers ---------------------------------------------------- */

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdRBox(vec3 p, vec3 b, float r) { return sdBox(p, b - r) - r; }
float sdCylY(vec3 p, float r, float h) {
  vec2 d = vec2(length(p.xz) - r, abs(p.y) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}
float sdCappedCone(vec3 p, vec3 a, vec3 b, float ra, float rb) {
  float rba = rb - ra;
  float baba = dot(b - a, b - a);
  float papa = dot(p - a, p - a);
  float paba = dot(p - a, b - a) / baba;
  float x = sqrt(max(papa - paba * paba * baba, 0.0));
  float cax = max(0.0, x - ((paba < 0.5) ? ra : rb));
  float cay = abs(paba - 0.5) - 0.5;
  float k = rba * rba + baba;
  float f = clamp((rba * (x - ra) + paba * baba) / k, 0.0, 1.0);
  float cbx = x - ra - f * rba;
  float cby = paba - f;
  float s = (cbx < 0.0 && cay < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba));
}
vec2 rot2(vec2 v, float c, float s) { return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
vec2 U(vec2 a, vec2 b) { return a.x < b.x ? a : b; }

/* --- the shell: slab, two walls with the opening, skirting, sill ------- */

float holeD(vec3 p) {
  return sdBox(p - vec3(-RT * 0.5, (WY0 + WY1) * 0.5, (WZ0 + WZ1) * 0.5), vec3(RT, (WY1 - WY0) * 0.5, (WZ1 - WZ0) * 0.5));
}

vec2 shellD(vec3 p) {
  float slab = sdRBox(p - vec3((RW - RT) * 0.5, -SLAB * 0.5, (RD - RT) * 0.5), vec3((RW + RT) * 0.5, SLAB * 0.5, (RD + RT) * 0.5), 0.02);
  float wa = sdRBox(p - vec3(-RT * 0.5, (RH - 0.06) * 0.5, (RD - RT) * 0.5), vec3(RT * 0.5, (RH + 0.06) * 0.5, (RD + RT) * 0.5), 0.007);
  float wb = sdRBox(p - vec3((RW - RT) * 0.5, (RH - 0.06) * 0.5, -RT * 0.5), vec3((RW + RT) * 0.5, (RH + 0.06) * 0.5, RT * 0.5), 0.007);
  wa = max(wa, -holeD(p));
  vec2 r = vec2(min(slab, min(wa, wb)), M_SHELL);
  float skirt = min(
    sdBox(p - vec3(0.007, 0.036, RD * 0.5), vec3(0.007, 0.036, RD * 0.5)),
    sdBox(p - vec3(RW * 0.5, 0.036, 0.007), vec3(RW * 0.5, 0.036, 0.007)));
  r = U(r, vec2(skirt, M_SKIRT));
  float sill = sdRBox(p - vec3(-0.005, WY0 - 0.014, (WZ0 + WZ1) * 0.5), vec3(0.09, 0.014, (WZ1 - WZ0) * 0.5 + 0.06), 0.004);
  r = U(r, vec2(sill, M_SILL));
  return r;
}

vec2 windowD(vec3 p) {
  vec3 q = p - vec3(GX, (WY0 + WY1) * 0.5, (WZ0 + WZ1) * 0.5);
  vec3 hh = vec3(0.024, (WY1 - WY0) * 0.5, (WZ1 - WZ0) * 0.5);
  float outer = sdBox(q, hh);
  float inner = sdBox(q, vec3(0.06, hh.y - WFRAME, hh.z - WFRAME));
  float frame = max(outer, -inner);
  float cw = (WZ1 - WZ0 - 2.0 * WFRAME) / WCOLS;
  float rh = (WY1 - WY0 - 2.0 * WFRAME) / WROWS;
  float zl = q.z + hh.z - WFRAME;
  float yl = q.y + hh.y - WFRAME;
  float dz = abs(zl - cw * clamp(floor(zl / cw + 0.5), 1.0, WCOLS - 1.0)) - WBAR * 0.5;
  float dy = abs(yl - rh * clamp(floor(yl / rh + 0.5), 1.0, WROWS - 1.0)) - WBAR * 0.5;
  float bars = max(max(min(dz, dy), abs(q.x) - 0.014), inner);
  float glass = max(abs(q.x) - 0.003, inner);
  return U(vec2(min(frame, bars), M_STEEL), vec2(glass, M_GLASS));
}

/* --- the desk and what's on it ------------------------------------------ */

vec2 lampD(vec3 p) {
  float base = sdCylY(p - vec3(LAMP_BASE.x, LAMP_BASE.y + 0.011, LAMP_BASE.z), 0.07, 0.011) - 0.002;
  float arms = min(
    sdCapsule(p, LAMP_BASE + vec3(0.0, 0.02, 0.0), LAMP_ELBOW, 0.0105),
    sdCapsule(p, LAMP_ELBOW, LAMP_HEAD, 0.0095));
  arms = min(arms, length(p - LAMP_ELBOW) - 0.019);
  vec3 mouth = LAMP_HEAD + LAMP_AXIS * LAMP_LEN;
  float cone = sdCappedCone(p, LAMP_HEAD, mouth, LAMP_R0, LAMP_R1);
  float shade = max(abs(cone) - 0.0035, dot(p - (mouth - LAMP_AXIS * 0.004), LAMP_AXIS));
  float cap = max(length(p - LAMP_HEAD) - 0.036, dot(p - LAMP_HEAD, LAMP_AXIS));
  vec2 r = vec2(min(min(base, arms), cap), M_STEEL);
  r = U(r, vec2(shade, M_SHADE));
  r = U(r, vec2(length(p - LAMP_BULB) - 0.024, M_BULB));
  return r;
}

vec2 deskD(vec3 p, bool lampToo) {
  vec2 r = vec2(sdRBox(p - DESK_C, DESK_H, 0.006), M_DESK);
  vec3 q = p - vec3(DESK_C.x, 0.0, DESK_C.z);
  q.x = abs(q.x) - (DESK_H.x - 0.05);
  q.z = abs(q.z) - (DESK_H.z - 0.045);
  float legH = (DESK_C.y - DESK_H.y) * 0.5;
  r = U(r, vec2(sdBox(q - vec3(0.0, legH, 0.0), vec3(0.016, legH, 0.016)), M_STEEL));
  // monitor: panel, neck, foot
  r = U(r, vec2(sdRBox(p - MON_C, MON_H, 0.006), M_BEZEL));
  float neck = sdRBox(p - vec3(MON_C.x, (DESK_Y + MON_C.y) * 0.5, MON_C.z - 0.03), vec3(0.026, (MON_C.y - DESK_Y) * 0.5, 0.01), 0.005);
  float foot = sdRBox(p - vec3(MON_C.x, DESK_Y + 0.005, MON_C.z - 0.02), vec3(0.11, 0.005, 0.075), 0.004);
  r = U(r, vec2(min(neck, foot), M_STEEL));
  // keyboard, mouse
  r = U(r, vec2(sdRBox(p - KEYS_C, vec3(0.21, 0.007, 0.064), 0.005), M_KEYS));
  r = U(r, vec2(sdEllipsoid(p - MOUSE_C, vec3(0.028, 0.013, 0.046)), M_KEYS));
  // a mug of coffee
  vec3 m = p - MUG_C;
  float cup = max(sdCylY(m, 0.042, 0.05) - 0.001, -sdCylY(m - vec3(0.0, 0.012, 0.0), 0.0365, 0.05));
  vec3 hq = m - vec3(0.048, 0.004, 0.0);
  float handle = length(vec2(length(hq.xy) - 0.025, hq.z)) - 0.0072;
  handle = max(handle, 0.041 - m.x);
  r = U(r, vec2(min(cup, handle), M_MUG));
  r = U(r, vec2(sdCylY(m - vec3(0.0, 0.026, 0.0), 0.037, 0.002), M_COFFEE));
  // a stack of three books
  vec3 b = p - BOOKS_C;
  vec3 b1 = b - vec3(0.0, 0.021, 0.0); b1.xz = rot2(b1.xz, 0.9982, 0.0600);
  vec3 b2 = b - vec3(0.012, 0.06, 0.006); b2.xz = rot2(b2.xz, 0.9902, -0.1395);
  vec3 b3 = b - vec3(-0.008, 0.093, -0.004); b3.xz = rot2(b3.xz, 0.9801, 0.1987);
  r = U(r, vec2(sdRBox(b1, vec3(0.15, 0.021, 0.105), 0.004), M_BOOK1));
  r = U(r, vec2(sdRBox(b2, vec3(0.13, 0.018, 0.095), 0.004), M_BOOK2));
  r = U(r, vec2(sdRBox(b3, vec3(0.115, 0.015, 0.085), 0.004), M_BOOK3));
  if (lampToo) r = U(r, lampD(p));
  return r;
}

/* --- the chair ------------------------------------------------------------ */

vec2 chairD(vec3 p) {
  vec3 q = p - CHAIR_AT;
  q.xz = rot2(q.xz, CHAIR_CS.x, -CHAIR_CS.y);
  float seat = sdRBox(q - vec3(0.0, 0.45, 0.0), vec3(0.215, 0.018, 0.205), 0.014);
  vec3 l = vec3(abs(q.x), q.y, q.z);
  float legs = min(
    sdCapsule(l, vec3(0.19, 0.0, -0.18), vec3(0.178, 0.44, -0.168), 0.0155),
    sdCapsule(l, vec3(0.19, 0.0, 0.2), vec3(0.178, 0.44, 0.176), 0.0155));
  float posts = sdCapsule(l, vec3(0.178, 0.44, 0.176), vec3(0.188, 0.86, 0.228), 0.0135);
  vec3 rq = q - vec3(0.0, 0.78, 0.21);
  rq.yz = rot2(rq.yz, 0.9921, 0.1253);
  float rest = sdRBox(rq, vec3(0.2, 0.062, 0.012), 0.011);
  float rail = sdCapsule(l, vec3(0.0, 0.17, -0.172), vec3(0.183, 0.17, -0.172), 0.008);
  return vec2(min(min(seat, rest), min(min(legs, posts), rail)), M_CHAIR);
}

/* --- the fig in its pot --------------------------------------------------- */

vec2 plantD(vec3 p) {
  vec3 q = p - PLANT_AT;
  float pot = sdCappedCone(q, vec3(0.0), vec3(0.0, POT_H, 0.0), POT_R0, POT_R1) - 0.004;
  pot = max(pot, -sdCappedCone(q, vec3(0.0, 0.06, 0.0), vec3(0.0, POT_H + 0.06, 0.0), POT_R0 - 0.012, POT_R1 - 0.01));
  vec2 r = vec2(pot, M_POT);
  r = U(r, vec2(sdCylY(q - vec3(0.0, POT_H - 0.05, 0.0), POT_R1 - 0.018, 0.012), M_SOIL));
  float stem = min(sdCapsule(p, STEM0, STEM1, 0.013), sdCapsule(p, STEM1, STEM2, 0.0105));
  float leaf = 1e9;
  for (int i = 0; i < LEAF_N; i++) {
    vec3 d = p - LEAF_C[i];
    vec2 rr = LEAF_R[i].xy;
    // the stalk first (cheap), then skip leaves whose bounding sphere is further than the nearest so far
    stem = min(stem, sdCapsule(p, LEAF_S[i], LEAF_B[i], 0.0045));
    if (length(d) - rr.x - 0.03 > leaf) continue;
    vec3 lp = vec3(dot(d, LEAF_U[i]), dot(d, LEAF_W[i]), dot(d, LEAF_V[i]));
    // cupped a little, and narrower toward the stalk (a fiddle-leaf shape)
    float side = clamp(lp.z, -rr.y, rr.y);
    lp.y -= 0.32 * side * side / rr.y;
    // a flat ellipse with a little thickness (a thin ellipsoid's distance
    // estimate falls apart just off its plane)
    vec2 er = vec2(rr.x, rr.y * (0.78 + 0.22 * smoothstep(-rr.x, rr.x * 0.4, lp.x)));
    float e = (length(lp.xz / er) - 1.0) * min(er.x, er.y);
    vec2 ew = vec2(e, abs(lp.y) - 0.0035);
    leaf = min(leaf, min(max(ew.x, ew.y), 0.0) + length(max(ew, 0.0)) - 0.002);
  }
  r = U(r, vec2(stem, M_STEM));
  r = U(r, vec2(leaf * 0.85, M_LEAF));
  return r;
}

/* --- on the desk wall: a clock and a framed print ------------------------ */

vec2 decorD(vec3 p) {
  vec3 q = p - CLOCK_C;
  vec2 w = vec2(length(q.xy) - (CLOCK_R - 0.008), abs(q.z - CLOCK_D * 0.5) - (CLOCK_D * 0.5 - 0.008));
  float clock = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.008;
  vec2 r = vec2(clock, M_CLOCK);
  r = U(r, vec2(sdRBox(p - PRINT_C - vec3(0.0, 0.0, PRINT_H.z), PRINT_H, 0.003), M_PRINT));
  return r;
}

float rugD(vec3 p) { return sdRBox(p - RUG_C, RUG_H, 0.004); }

/** The whole room, with materials. */
vec2 mapScene(vec3 p) {
  vec2 r = shellD(p);
  r = U(r, windowD(p));
  r = U(r, vec2(rugD(p), M_RUG));
  if (sdBox(p - DESKB_C, DESKB_H) < r.x) r = U(r, deskD(p, true));
  if (sdBox(p - CHAIRB_C, CHAIRB_H) < r.x) r = U(r, chairD(p));
  if (sdBox(p - PLANTB_C, PLANTB_H) < r.x) r = U(r, plantD(p));
  if (sdBox(p - DECOB_C, DECOB_H) < r.x) r = U(r, decorD(p));
  return r;
}

/** Only what can throw a shadow inside the room (the window is analytic). */
float occluders(vec3 p, bool lampToo) {
  float d = 1e9;
  float b = sdBox(p - DESKB_C, DESKB_H);
  d = b > 0.06 ? b : deskD(p, lampToo).x;
  b = sdBox(p - CHAIRB_C, CHAIRB_H);
  d = min(d, b > 0.06 ? b : chairD(p).x);
  b = sdBox(p - PLANTB_C, PLANTB_H);
  d = min(d, b > 0.06 ? b : plantD(p).x);
  b = sdBox(p - DECOB_C, DECOB_H);
  d = min(d, b > 0.06 ? b : decorD(p).x);
  return d;
}

vec2 boxRange(vec3 ro, vec3 inv, vec3 c, vec3 h) {
  vec3 t0 = (c - h - ro) * inv;
  vec3 t1 = (c + h - ro) * inv;
  vec3 mn = min(t0, t1);
  vec3 mx = max(t0, t1);
  return vec2(max(max(mn.x, mn.y), mn.z), min(min(mx.x, mx.y), mx.z));
}

vec3 safeInv(vec3 d) {
  return 1.0 / vec3(abs(d.x) < 1e-5 ? 1e-5 : d.x, abs(d.y) < 1e-5 ? 1e-5 : d.y, abs(d.z) < 1e-5 ? 1e-5 : d.z);
}

uniform vec3 uView; // internal px of the target point (x, y) and world units per px

void cameraRay(vec2 frag, out vec3 ro, out vec3 rd) {
  vec2 l = (frag - uView.xy) * uView.z;
  ro = CAM_TARGET + CAM_RIGHT * l.x + CAM_UP * l.y + CAM_BACK * FAR;
  rd = -CAM_BACK;
}

vec2 packDepth(float d) {
  float v = floor(clamp(d, 0.0, 1.0) * 65535.0 + 0.5);
  float hi = floor(v / 256.0);
  return vec2(hi, v - hi * 256.0) / 255.0;
}
float unpackDepth(vec2 e) {
  vec2 b = floor(e * 255.0 + 0.5);
  return (b.x * 256.0 + b.y) / 65535.0;
}

/**
 * How much of the light along L reaches S through the window: the opening
 * on both faces of the wall, then the frame and the glazing bars in the
 * glass, each with a penumbra that widens with distance. s0 returns the
 * distance to the inner face (where the furniture shadow march can stop).
 */
float aperture(vec3 S, vec3 L, out float s0) {
  s0 = 0.0;
  if (L.x > -0.004) return 0.0;
  float inv = -1.0 / L.x;
  float sIn = S.x * inv;
  float sOut = (S.x + RT) * inv;
  float sGl = (S.x - GX) * inv;
  s0 = max(sIn, 0.0);
  vec2 c = vec2((WZ0 + WZ1) * 0.5, (WY0 + WY1) * 0.5);
  vec2 h = vec2((WZ1 - WZ0) * 0.5, (WY1 - WY0) * 0.5);
  const float PEN = 0.016;
  const float W0 = 0.0025;
  float cov = 1.0;
  vec2 q; vec2 d; float w;
  if (sIn > 0.0) {
    q = (S + L * sIn).zy; w = W0 + PEN * sIn;
    d = abs(q - c) - h;
    cov *= clamp(0.5 - (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) / w, 0.0, 1.0);
  }
  q = (S + L * sOut).zy; w = W0 + PEN * sOut;
  d = abs(q - c) - h;
  cov *= clamp(0.5 - (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) / w, 0.0, 1.0);
  if (cov < 0.001 || sGl < 0.0) return cov;
  q = (S + L * sGl).zy; w = W0 + PEN * sGl;
  d = abs(q - c) - (h - WFRAME);
  cov *= clamp(0.5 - (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) / w, 0.0, 1.0);
  float cw = (WZ1 - WZ0 - 2.0 * WFRAME) / WCOLS;
  float rh = (WY1 - WY0 - 2.0 * WFRAME) / WROWS;
  float zl = q.x - WZ0 - WFRAME;
  float yl = q.y - WY0 - WFRAME;
  float dz = abs(zl - cw * clamp(floor(zl / cw + 0.5), 1.0, WCOLS - 1.0)) - WBAR * 0.5;
  float dy = abs(yl - rh * clamp(floor(yl / rh + 0.5), 1.0, WROWS - 1.0)) - WBAR * 0.5;
  cov *= clamp(0.5 + dz / w, 0.0, 1.0) * clamp(0.5 + dy / w, 0.0, 1.0);
  return cov;
}
`;
}

const HEADER = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
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

/* ---------------------------------------------------------------------- */
/* G-buffer                                                                */
/* ---------------------------------------------------------------------- */

export function gbufferFS(): string {
  return `${HEADER}
${sceneGlsl()}
layout(location = 0) out vec4 outG0;
layout(location = 1) out vec4 outG1;

vec3 normalAt(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.0006;
  return normalize(
    k.xyy * mapScene(p + k.xyy * e).x +
    k.yyx * mapScene(p + k.yyx * e).x +
    k.yxy * mapScene(p + k.yxy * e).x +
    k.xxx * mapScene(p + k.xxx * e).x);
}

/** Everything but the walls and the floor (their corners are shaded analytically). */
float objectsD(vec3 p) {
  vec3 q = p;
  float d = rugD(p);
  float skirt = min(
    sdBox(q - vec3(0.007, 0.036, RD * 0.5), vec3(0.007, 0.036, RD * 0.5)),
    sdBox(q - vec3(RW * 0.5, 0.036, 0.007), vec3(RW * 0.5, 0.036, 0.007)));
  d = min(d, skirt);
  d = min(d, sdRBox(p - vec3(-0.005, WY0 - 0.014, (WZ0 + WZ1) * 0.5), vec3(0.09, 0.014, (WZ1 - WZ0) * 0.5 + 0.06), 0.004));
  d = min(d, windowD(p).x);
  float b = sdBox(p - DESKB_C, DESKB_H);
  d = min(d, b > 0.3 ? b : deskD(p, true).x);
  b = sdBox(p - CHAIRB_C, CHAIRB_H);
  d = min(d, b > 0.3 ? b : chairD(p).x);
  b = sdBox(p - PLANTB_C, PLANTB_H);
  d = min(d, b > 0.3 ? b : plantD(p).x);
  b = sdBox(p - DECOB_C, DECOB_H);
  d = min(d, b > 0.3 ? b : decorD(p).x);
  return d;
}

float occlusion(vec3 p, vec3 n) {
  // contact shading from the furniture, short range
  float occ = 0.0;
  float weight = 1.0;
  for (int i = 0; i < 6; i++) {
    float h = 0.01 + 0.048 * float(i);
    float d = objectsD(p + n * h);
    occ += max(h - d, 0.0) * weight;
    weight *= 0.72;
  }
  float ao = clamp(1.0 - 2.4 * occ, 0.0, 1.0);
  // the room's own corners: darker toward the walls and the floor a surface meets
  if (p.x > -0.01 && p.z > -0.01 && p.y > -0.01 && p.y < RH - 0.01) {
    float wa = 1.0 - abs(n.x);
    float wb = 1.0 - abs(n.z);
    float wf = 1.0 - abs(n.y);
    ao *= 1.0 - 0.42 * wa * exp(-max(p.x, 0.0) / 0.36);
    ao *= 1.0 - 0.42 * wb * exp(-max(p.z, 0.0) / 0.36);
    ao *= 1.0 - 0.36 * wf * exp(-max(p.y, 0.0) / 0.3);
  }
  return ao;
}

float refine(float mat, vec3 p, vec3 n) {
  if (mat == M_SHELL) {
    // the cut faces of the model (wall tops, the slab's edges, the walls' ends) are outside
    if (p.y > RH - 0.02 && n.y > 0.5) return M_CUT;
    if (p.y < -0.004) return M_CUT;
    if (p.z > RD - 0.004 && n.z > 0.5) return M_CUT;
    if (p.x > RW - 0.004 && n.x > 0.5) return M_CUT;
    if (n.y > 0.7 && p.y < 0.01) return M_FLOOR;
    return M_PLASTER;
  }
  if (mat == M_BEZEL) {
    vec3 q = p - MON_C;
    if (n.z > 0.8 && abs(q.x) < MON_H.x - MON_BEZEL && abs(q.y) < MON_H.y - MON_BEZEL) return M_SCREEN;
    return M_STEEL;
  }
  if (mat == M_SHADE) {
    vec3 q = p - LAMP_HEAD;
    vec3 radial = q - LAMP_AXIS * dot(q, LAMP_AXIS);
    return dot(n, radial) < 0.0 ? M_SHADE_IN : M_STEEL;
  }
  return mat;
}

void main() {
  vec3 ro, rd;
  cameraRay(gl_FragCoord.xy, ro, rd);
  vec2 tb = boxRange(ro, safeInv(rd), vec3((RW - RT) * 0.5, (RH - SLAB) * 0.5, (RD - RT) * 0.5), vec3((RW + RT) * 0.5 + 0.03, (RH + SLAB) * 0.5 + 0.03, (RD + RT) * 0.5 + 0.03));
  outG0 = vec4(1.0, 1.0, 0.0, 1.0);
  outG1 = vec4(0.5, 0.5, 0.5, 0.0);
  if (tb.x > tb.y) return;
  float t = max(tb.x, 0.0);
  float mat = -1.0;
  for (int i = 0; i < 220; i++) {
    vec2 h = mapScene(ro + rd * t);
    if (h.x < 0.00035) { mat = h.y; break; }
    t += h.x * 0.92;
    if (t > tb.y) break;
  }
  if (mat < 0.0) return;
  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  mat = refine(mat, p, n);
  float ao = occlusion(p, n);
  outG0 = vec4(packDepth(t / DEPTH_RANGE), mat / 255.0, ao);
  outG1 = vec4(n * 0.5 + 0.5, 1.0);
}
`;
}

/* ---------------------------------------------------------------------- */
/* lighting                                                                */
/* ---------------------------------------------------------------------- */

export type Quality = { shadowSteps: number; lampSteps: number; shaftSteps: number };


export function lightFS(q: Quality): string {
  return `${HEADER}
${sceneGlsl()}
#define SHADOW_STEPS ${q.shadowSteps}
#define LAMP_STEPS ${q.lampSteps}

uniform sampler2D uG0;
uniform sampler2D uG1;
uniform vec3 uWinDir;
uniform vec3 uWinCol;
uniform float uSunShare;
uniform vec3 uSkyTop;
uniform vec3 uSkyLow;
uniform vec3 uAmb;
uniform vec3 uStudio;
uniform vec3 uBounceAt;
uniform vec3 uBounceCol;
uniform float uLamp;
uniform float uScreen;
uniform float uNight;
uniform float uExposure;
uniform float uHour;
uniform float uTime;
uniform vec3 uBg;
uniform float uDark;
uniform vec4 uSun;      // x, y (internal px), radius (px), 1 = sun … 0 = moon
uniform vec3 uDisc;     // the sun disc's colour (sRGB)
uniform float uGlow;    // strength of the sun's glow on the stage

out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec3 toDisplay(vec3 hdr, float exposure) {
  vec3 x = hdr * exposure;
  vec3 a = aces(x);
  // the same curve on luminance only keeps the colour of bright light (a
  // golden patch stays golden instead of bleaching), clipped softly
  float l = dot(x, vec3(0.2126, 0.7152, 0.0722));
  float lt = aces(vec3(l)).x;
  vec3 h = x * (lt / max(l, 1e-5));
  float m = max(h.r, max(h.g, h.b));
  h = m > 1.0 ? mix(h / m, vec3(1.0), clamp((m - 1.0) * 0.35, 0.0, 1.0)) : h;
  return pow(clamp(mix(a, h, 0.55), 0.0, 1.0), vec3(1.0 / 2.2));
}

/* --- materials ------------------------------------------------------------ */

vec3 floorAlbedo(vec3 P, float px) {
  const float WIDTH = 0.15;
  const float LEN = 1.35;
  float row = floor(P.z / WIDTH);
  float off = hash12(vec2(row, 3.7)) * LEN;
  float col = floor((P.x + off) / LEN);
  float id = hash12(vec2(row, col));
  vec3 base = vec3(0.66, 0.49, 0.33) * (0.88 + 0.2 * id);
  base *= mix(vec3(1.0), vec3(1.04, 0.97, 0.9), hash12(vec2(col, row) + 9.1));
  float grain = noise2(vec2(P.x * 1.6 + id * 17.0, P.z * 46.0)) * 0.6 + noise2(vec2(P.x * 7.0, P.z * 140.0)) * 0.4;
  base *= 0.92 + 0.13 * grain;
  float seamZ = (0.5 - abs(fract(P.z / WIDTH) - 0.5)) * WIDTH;
  float seamX = (0.5 - abs(fract((P.x + off) / LEN) - 0.5)) * LEN;
  float seam = min(seamZ, seamX);
  base *= mix(0.62, 1.0, smoothstep(0.0, px * 1.1 + 0.0015, seam));
  return base;
}

vec3 deskAlbedo(vec3 P, vec3 N) {
  vec3 base = vec3(0.71, 0.56, 0.4);
  float grain = noise2(vec2(P.x * 2.2, P.z * 70.0)) * 0.7 + noise2(vec2(P.x * 9.0, P.z * 190.0)) * 0.3;
  base *= 0.93 + 0.1 * grain;
  if (abs(N.y) < 0.5) base *= 0.82; // end grain on the edges
  return base;
}

vec3 rugAlbedo(vec3 P, float px) {
  vec2 q = (P.xz - RUG_C.xz);
  vec3 base = vec3(0.84, 0.81, 0.75);
  float weave = 0.5 + 0.5 * sin(P.x * 260.0) * sin(P.z * 260.0);
  base *= 0.965 + 0.035 * mix(weave, 0.5, smoothstep(0.002, 0.006, px));
  vec2 e = RUG_H.xz - abs(q);
  float edge = min(e.x, e.y);
  float band = smoothstep(0.075, 0.075 + px, edge) * (1.0 - smoothstep(0.1, 0.1 + px, edge));
  base = mix(base, base * vec3(0.72, 0.68, 0.62), band);
  return base;
}

vec3 leafAlbedo(vec3 P) {
  float v = hash12(floor(P.xz * 9.0) + floor(P.y * 9.0));
  return mix(vec3(0.085, 0.2, 0.075), vec3(0.14, 0.26, 0.09), v);
}

/** Thin dark segment from the centre toward angle a (clockwise from twelve). */
float hand(vec2 q, float a, float len, float w, float px) {
  vec2 dir = vec2(sin(a), cos(a));
  float h = clamp(dot(q, dir), -0.12, len);
  float d = length(q - dir * h) - w;
  return 1.0 - smoothstep(-px, px, d);
}

vec3 clockFace(vec3 P, float px) {
  vec2 q = (P.xy - CLOCK_C.xy) / CLOCK_R;
  float r = length(q);
  float u = px / CLOCK_R;
  vec3 c = vec3(0.93, 0.92, 0.9);
  c = mix(c, vec3(0.1), smoothstep(0.86 - u, 0.86 + u, r));
  float a = atan(q.x, q.y);
  float seg = PI / 6.0;
  float tick = abs(fract(a / seg + 0.5) - 0.5) * seg * r;
  c = mix(c, vec3(0.2), (1.0 - smoothstep(0.018 - u, 0.018 + u, tick)) * smoothstep(0.64, 0.66, r) * (1.0 - smoothstep(0.78, 0.8, r)));
  float hourA = mod(uHour, 12.0) / 12.0 * 2.0 * PI;
  float minA = fract(uHour) * 2.0 * PI;
  c = mix(c, vec3(0.1), hand(q, hourA, 0.42, 0.04, u * 1.2));
  c = mix(c, vec3(0.12), hand(q, minA, 0.64, 0.024, u * 1.2));
  c = mix(c, vec3(0.08), 1.0 - smoothstep(0.06 - u, 0.06 + u, r));
  return c;
}

vec3 printArt(vec3 P, float px) {
  vec2 q = (P.xy - PRINT_C.xy);
  vec2 h = PRINT_H.xy;
  vec2 e = h - abs(q);
  float edge = min(e.x, e.y);
  vec3 frame = vec3(0.12, 0.11, 0.1);
  vec3 paper = vec3(0.93, 0.92, 0.89);
  if (edge < 0.022) return frame;
  if (edge < 0.07) return paper;
  // a sun over three bands of land, in soft print colours
  vec2 a = (q - vec2(0.0, -0.02)) / (h - 0.07);
  vec3 c = vec3(0.89, 0.86, 0.8);
  float sun = length(a - vec2(0.12, 0.18)) - 0.36;
  c = mix(c, vec3(0.86, 0.55, 0.32), 1.0 - smoothstep(-px * 4.0, px * 4.0, sun));
  float land1 = a.y - (-0.12 + 0.06 * sin(a.x * 2.4 + 0.4));
  c = mix(c, vec3(0.6, 0.58, 0.52), 1.0 - smoothstep(-px * 4.0, px * 4.0, land1));
  float land2 = a.y - (-0.42 + 0.05 * sin(a.x * 3.1 + 2.0));
  c = mix(c, vec3(0.36, 0.36, 0.34), 1.0 - smoothstep(-px * 4.0, px * 4.0, land2));
  return c;
}

vec3 screenImage(vec3 P, float px) {
  vec2 s = (P.xy - MON_C.xy) / (MON_H.xy - MON_BEZEL); // -1..1
  vec3 c = mix(vec3(0.07, 0.075, 0.085), vec3(0.11, 0.115, 0.13), 0.5 + 0.5 * s.y);
  // an editor: a gutter, then lines of code
  float lineH = 0.105;
  float row = floor((0.86 - s.y) / lineH);
  float inRow = fract((0.86 - s.y) / lineH);
  if (row >= 0.0 && row < 15.0 && s.x > -0.9 && s.x < 0.92) {
    float indent = floor(hash12(vec2(row, 2.0)) * 3.0) * 0.1;
    float len = 0.25 + hash12(vec2(row, 7.0)) * 0.95;
    float x0 = -0.72 + indent;
    float on = step(x0, s.x) * step(s.x, x0 + len) * smoothstep(0.25, 0.3, inRow) * (1.0 - smoothstep(0.7, 0.75, inRow));
    float word = step(0.2, fract((s.x - x0) * 3.1 + hash12(vec2(row, 1.0))));
    vec3 ink = hash12(vec2(row, 5.0)) > 0.72 ? vec3(0.36, 0.64, 0.95) : vec3(0.62, 0.63, 0.66);
    c = mix(c, ink, on * word * 0.85);
    float gutter = step(-0.86, s.x) * step(s.x, -0.8) * smoothstep(0.3, 0.35, inRow) * (1.0 - smoothstep(0.65, 0.7, inRow));
    c = mix(c, vec3(0.3), gutter * 0.7);
  }
  // a cursor that blinks
  float blink = step(0.5, fract(uTime * 0.9));
  vec2 cur = s - vec2(-0.72 + 0.32, 0.86 - lineH * 6.5);
  c = mix(c, vec3(0.85), blink * step(abs(cur.x), 0.012) * step(abs(cur.y), lineH * 0.3));
  return c;
}

vec3 albedoOf(float mat, vec3 P, vec3 N, float px) {
  if (mat == M_FLOOR) return floorAlbedo(P, px);
  if (mat == M_PLASTER) return vec3(0.88, 0.865, 0.835) * (0.985 + 0.03 * noise2(P.xy * 31.0 + P.zz * 17.0));
  if (mat == M_CUT) return vec3(0.9, 0.89, 0.87);
  if (mat == M_SKIRT || mat == M_SILL) return vec3(0.9, 0.895, 0.88);
  if (mat == M_STEEL) return vec3(0.032, 0.033, 0.036);
  if (mat == M_DESK) return deskAlbedo(P, N);
  if (mat == M_CHAIR) return vec3(0.33, 0.21, 0.13) * (0.92 + 0.12 * noise2(vec2(P.y * 40.0, (P.x + P.z) * 4.0)));
  if (mat == M_LEAF) return leafAlbedo(P);
  if (mat == M_STEM) return vec3(0.17, 0.15, 0.08);
  if (mat == M_POT) return vec3(0.8, 0.78, 0.74) * (0.97 + 0.05 * noise2(P.xz * 60.0 + P.y * 40.0));
  if (mat == M_SOIL) return vec3(0.09, 0.07, 0.055);
  if (mat == M_COFFEE) return vec3(0.12, 0.065, 0.03);
  if (mat == M_MUG) return vec3(0.88, 0.87, 0.84);
  if (mat == M_BOOK1) return abs(N.y) > 0.5 ? vec3(0.44, 0.51, 0.44) : vec3(0.86, 0.83, 0.74);
  if (mat == M_BOOK2) return abs(N.y) > 0.5 ? vec3(0.78, 0.68, 0.52) : vec3(0.88, 0.85, 0.77);
  if (mat == M_BOOK3) return abs(N.y) > 0.5 ? vec3(0.2, 0.2, 0.22) : vec3(0.86, 0.83, 0.74);
  if (mat == M_RUG) return rugAlbedo(P, px);
  if (mat == M_KEYS) return vec3(0.8, 0.8, 0.79);
  if (mat == M_SHADE_IN) return vec3(0.88, 0.86, 0.82);
  if (mat == M_CLOCK) return N.z > 0.8 ? clockFace(P, px) : vec3(0.9, 0.9, 0.89);
  if (mat == M_PRINT) return N.z > 0.8 ? printArt(P, px) : vec3(0.12, 0.11, 0.1);
  return vec3(0.5);
}

/* --- light ---------------------------------------------------------------- */

float furnitureShadow(vec3 ro, vec3 rd, float tmax, float k, bool lampToo, int steps) {
  vec3 inv = safeInv(rd);
  vec2 a = boxRange(ro, inv, DESKB_C, DESKB_H);
  vec2 b = boxRange(ro, inv, CHAIRB_C, CHAIRB_H);
  vec2 c = boxRange(ro, inv, PLANTB_C, PLANTB_H);
  vec2 d = boxRange(ro, inv, DECOB_C, DECOB_H);
  float t0 = 1e9;
  float t1 = -1e9;
  if (a.x < a.y && a.y > 0.0) { t0 = min(t0, a.x); t1 = max(t1, a.y); }
  if (b.x < b.y && b.y > 0.0) { t0 = min(t0, b.x); t1 = max(t1, b.y); }
  if (c.x < c.y && c.y > 0.0) { t0 = min(t0, c.x); t1 = max(t1, c.y); }
  if (d.x < d.y && d.y > 0.0) { t0 = min(t0, d.x); t1 = max(t1, d.y); }
  float t = max(t0, 0.012);
  float end = min(t1, tmax);
  if (t >= end) return 1.0;
  float res = 1.0;
  for (int i = 0; i < 64; i++) {
    if (i >= steps) break;
    float h = occluders(ro + rd * t, lampToo);
    res = min(res, k * h / t);
    if (res < 0.004) return 0.0;
    t += clamp(h, 0.006, 0.3);
    if (t >= end) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

float spec(vec3 N, vec3 L, vec3 V, float shininess) {
  vec3 h = normalize(L + V);
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(h, V), 0.0, 1.0), 5.0);
  return pow(max(dot(N, h), 0.0), shininess) * f * (shininess + 8.0) / 25.0;
}

void gloss(float mat, out float shine, out float amount) {
  shine = 12.0; amount = 0.0;
  if (mat == M_FLOOR) { shine = 36.0; amount = 0.32; }
  else if (mat == M_DESK) { shine = 30.0; amount = 0.22; }
  else if (mat == M_STEEL) { shine = 70.0; amount = 0.6; }
  else if (mat == M_SCREEN) { shine = 260.0; amount = 1.0; }
  else if (mat == M_MUG) { shine = 90.0; amount = 0.55; }
  else if (mat == M_LEAF) { shine = 28.0; amount = 0.3; }
  else if (mat == M_KEYS) { shine = 24.0; amount = 0.12; }
  else if (mat == M_CHAIR) { shine = 24.0; amount = 0.18; }
  else if (mat == M_COFFEE) { shine = 160.0; amount = 0.9; }
  else if (mat == M_CLOCK || mat == M_PRINT) { shine = 120.0; amount = 0.25; }
}

/** The sky outside, as seen through the glass (a little landscape, stars, the moon). */
vec3 windowView(vec3 P, float px) {
  float v = clamp((P.y - WY0) / (WY1 - WY0), 0.0, 1.0);
  float u = clamp((P.z - WZ0) / (WZ1 - WZ0), 0.0, 1.0);
  const float HORIZON = 0.26;
  vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(HORIZON, 0.95, v));
  // the low sun warms the side of the sky it's on
  sky += uSkyLow * 0.35 * smoothstep(0.2, 1.0, u) * (1.0 - smoothstep(HORIZON, 0.7, v)) * (1.0 - uNight);
  // stars
  if (uNight > 0.01) {
    vec2 g = vec2(u * 26.0, v * 24.0);
    vec2 cell = floor(g);
    float rnd = hash12(cell);
    vec2 sp = fract(g) - (0.25 + 0.5 * vec2(hash12(cell + 3.1), hash12(cell + 7.7)));
    float star = step(0.82, rnd) * smoothstep(0.09, 0.0, length(sp)) * (0.6 + 0.4 * sin(uTime * (1.0 + rnd * 2.0) + rnd * 40.0));
    sky += vec3(0.75, 0.8, 1.0) * star * uNight * 0.9 * smoothstep(HORIZON, HORIZON + 0.15, v);
    // a crescent moon, high on the right
    vec2 m = vec2((u - 0.28) * 1.0, (v - 0.74) * 0.95);
    float disc = length(m) - 0.075;
    float bite = length(m - vec2(0.032, 0.022)) - 0.068;
    float moon = (1.0 - smoothstep(-0.006, 0.006, disc)) * smoothstep(-0.006, 0.006, bite);
    sky += vec3(0.95, 0.93, 0.85) * moon * uNight * 1.6;
    sky += vec3(0.4, 0.45, 0.6) * exp(-dot(m, m) * 90.0) * uNight * 0.12;
  }
  // far hills
  float hill = HORIZON - 0.02 + 0.045 * sin(u * 4.3 + 1.1) + 0.02 * sin(u * 11.0 + 0.3);
  float hills = 1.0 - smoothstep(hill - 0.006, hill + 0.006, v);
  vec3 land = mix(uSkyLow * 0.42 + uSkyTop * 0.2, vec3(0.006, 0.008, 0.016), uNight);
  sky = mix(sky, land, hills);
  // the glass: a faint reflection streak
  float streak = smoothstep(0.0, 0.02, abs(fract((u - v) * 1.4 + 0.2) - 0.5) - 0.44);
  sky += vec3(0.04) * (1.0 - streak) * (1.0 - uNight * 0.6);
  return sky;
}

vec3 shade(vec3 P, vec3 N, float mat, float ao, vec3 V, float px) {
  if (mat == M_GLASS) return windowView(P, px);
  vec3 albedo = albedoOf(mat, P, N, px);
  float shine; float glossy;
  gloss(mat, shine, glossy);
  vec3 col = vec3(0.0);

  if (mat == M_CUT) {
    // outside the room: the studio's light, and the sun straight on
    float ndl = max(dot(N, uWinDir), 0.0) * uSunShare;
    return albedo * (uStudio * (0.55 + 0.45 * ao) + uWinCol * ndl);
  }

  // the window as a big soft light (the sky)
  vec3 wc = vec3(0.0, (WY0 + WY1) * 0.5, (WZ0 + WZ1) * 0.5);
  vec3 tw = wc - P;
  float d2 = dot(tw, tw);
  vec3 lw = tw * inversesqrt(d2 + 1e-6);
  float cosW = clamp(-lw.x, 0.0, 1.0);
  float cosR = 0.65 * max(dot(N, lw), 0.0) + 0.35 * (0.5 + 0.5 * dot(N, lw));
  float area = (WY1 - WY0) * (WZ1 - WZ0);
  vec3 skyRad = mix(uSkyLow, uSkyTop, 0.35);
  // light from a window reads close to white indoors: keep only some of the sky's tint
  skyRad = mix(vec3(dot(skyRad, vec3(0.2126, 0.7152, 0.0722))), skyRad, 0.55);
  col += albedo * skyRad * (area * cosW * cosR / (d2 + area * 0.6)) * (0.35 + 0.65 * ao);
  // light that has gone round the room
  col += albedo * uAmb * ao;

  // the bright patch, bouncing back into the room
  vec3 tb = uBounceAt - P;
  float bd2 = dot(tb, tb);
  vec3 lb = tb * inversesqrt(bd2 + 1e-6);
  col += albedo * uBounceCol * (0.3 + 0.7 * max(dot(N, lb), 0.0)) / (0.35 + bd2) * (0.4 + 0.6 * ao);

  // sun or moon through the window
  float ndl = dot(N, uWinDir);
  bool leaf = mat == M_LEAF;
  if ((ndl > 0.0 || leaf) && dot(uWinCol, vec3(1.0)) > 0.0005) {
    float s0;
    vec3 start = P + N * (ndl > 0.0 ? 0.004 : -0.004);
    float m = aperture(start, uWinDir, s0);
    if (m > 0.002) {
      float sh = furnitureShadow(leaf ? P + uWinDir * 0.02 : start, uWinDir, s0, 16.0, true, SHADOW_STEPS);
      float vis = m * sh;
      if (ndl > 0.0) {
        col += albedo * uWinCol * ndl * vis;
        col += uWinCol * vis * spec(N, uWinDir, V, shine) * glossy * ndl;
      }
      if (leaf && ndl < 0.0) {
        // light through the leaf
        col += vec3(0.32, 0.5, 0.1) * uWinCol * (-ndl) * vis * 0.55;
      }
    }
  }

  // the desk lamp: a spot with soft shadows, plus what leaks out of the shade
  if (uLamp > 0.001) {
    vec3 tl = LAMP_BULB - P;
    float ld2 = dot(tl, tl);
    float ld = sqrt(ld2);
    vec3 ll = tl / ld;
    float cone = smoothstep(0.62, 0.86, dot(-ll, LAMP_AXIS));
    float lndl = max(dot(N, ll), 0.0);
    vec3 lampCol = vec3(1.0, 0.7, 0.42) * uLamp;
    if (mat == M_BULB) return vec3(9.0, 6.6, 4.0) * uLamp + vec3(0.25) * albedo;
    if (mat == M_SHADE_IN) {
      col += lampCol * 1.6 * (0.4 + 0.6 * lndl) / (0.6 + ld2 * 40.0) * 3.0;
    } else if (lndl > 0.0) {
      float sh = cone > 0.01 ? furnitureShadow(P + N * 0.003, ll, ld - 0.05, 10.0, false, LAMP_STEPS) : 1.0;
      float power = (cone * 1.0 + 0.035) * sh;
      col += albedo * lampCol * lndl * power * 0.9 / (ld2 + 0.03);
      col += lampCol * lndl * power * spec(N, ll, V, shine) * glossy * 0.5 / (ld2 + 0.03);
    }
    // the pool on the desk bouncing back up
    vec3 pool = vec3(2.98, DESK_Y + 0.05, 0.56) - P;
    float pd2 = dot(pool, pool);
    col += albedo * lampCol * 0.06 * (0.4 + 0.6 * max(dot(N, pool * inversesqrt(pd2 + 1e-6)), 0.0)) / (0.12 + pd2);
  } else if (mat == M_BULB) {
    col += albedo * 0.0;
  }

  // the screen's glow
  if (uScreen > 0.001) {
    vec3 sc = vec3(MON_C.x, MON_C.y, MON_C.z + 0.05);
    vec3 ts = sc - P;
    float sd2 = dot(ts, ts);
    vec3 ls = ts * inversesqrt(sd2 + 1e-6);
    float cosS = clamp(-ls.z, 0.0, 1.0);
    vec3 screenCol = vec3(0.62, 0.7, 0.9) * uScreen;
    col += albedo * screenCol * max(dot(N, ls), 0.0) * cosS * 0.12 / (sd2 + 0.04);
  }

  if (mat == M_SCREEN) {
    // glass: the picture when it's on, a dark reflection either way
    col = vec3(0.004, 0.0045, 0.006) + skyRad * 0.02;
    col += screenImage(P, px) * uScreen * 1.25;
    float fres = 0.05 + 0.25 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
    col += mix(uSkyLow, uSkyTop, 0.5) * fres * 0.25;
  }
  return col;
}

vec3 background(vec2 frag, vec3 ro, vec3 rd) {
  vec3 bg = uBg;
  // a soft contact shadow round the base
  float t = (-SLAB - ro.y) / rd.y;
  vec3 g = ro + rd * t;
  vec2 dd = abs(g.xz - vec2((RW - RT) * 0.5, (RD - RT) * 0.5)) - vec2((RW + RT) * 0.5, (RD + RT) * 0.5);
  float sd = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0);
  float shadow = exp(-max(sd, 0.0) * 9.0) * 0.16 + exp(-max(sd, 0.0) * 2.2) * 0.06;
  bg *= 1.0 - shadow * (uDark > 0.5 ? 2.4 : 1.0);
  // the sun's glow, and the disc (a crescent moon after dark)
  vec2 d = frag - uSun.xy;
  float r = length(d);
  float R = uSun.z;
  if (R > 0.0) {
    vec3 glowCol = mix(vec3(0.55, 0.62, 0.8), vec3(1.0, 0.72, 0.42), uSun.w);
    float glow = exp(-r * r / (R * R * 22.0)) * 0.28 + exp(-r * r / (R * R * 3.2)) * 0.35;
    bg = mix(bg, glowCol, clamp(glow * uGlow, 0.0, 1.0) * (uDark > 0.5 ? 0.75 : 0.55));
    float aa = 1.0;
    float disc = 1.0 - smoothstep(R - aa, R + aa, r);
    // a warm gradient with a slightly deeper rim, so the sun holds its own on a light stage
    float k = clamp(r / R, 0.0, 1.0);
    vec3 core = mix(vec3(1.0, 0.97, 0.86), uDisc, smoothstep(0.15, 1.0, k));
    core = mix(core, uDisc * vec3(0.97, 0.86, 0.78), smoothstep(0.78, 1.0, k) * 0.7);
    // the moon: lit disc minus a bite, cool
    float bite = smoothstep(R * 0.95 - aa, R * 0.95 + aa, length(d - vec2(R * 0.5, R * 0.3)));
    vec3 moonCol = uDark > 0.5 ? vec3(0.86, 0.88, 0.94) : vec3(0.58, 0.62, 0.7);
    vec3 discCol = mix(moonCol, core, uSun.w);
    float discA = disc * mix(bite, 1.0, uSun.w);
    bg = mix(bg, discCol, discA);
  }
  return bg;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  ivec2 ip = ivec2(frag);
  vec4 g0 = texelFetch(uG0, ip, 0);
  vec4 g1 = texelFetch(uG1, ip, 0);
  vec3 ro, rd;
  cameraRay(frag, ro, rd);
  if (g1.a < 0.5) {
    vec2 d = frag - uSun.xy;
    float disc = uSun.z > 0.0 ? 1.0 - smoothstep(uSun.z - 1.0, uSun.z + 1.0, length(d)) : 0.0;
    outColor = vec4(background(frag, ro, rd), disc * 0.6);
    return;
  }
  float depth = unpackDepth(g0.rg) * DEPTH_RANGE;
  vec3 P = ro + rd * depth;
  vec3 N = normalize(g1.rgb * 2.0 - 1.0);
  float mat = floor(g0.b * 255.0 + 0.5);
  float ao = g0.a;
  float px = uView.z;
  vec3 hdr = shade(P, N, mat, ao, -rd, px);
  if (mat == M_CUT) {
    outColor = vec4(toDisplay(hdr, 1.0), 0.0);
    return;
  }
  outColor = vec4(toDisplay(hdr, uExposure), 1.0);
}
`;
}

/* ---------------------------------------------------------------------- */
/* shafts                                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Light scattered toward the eye by the air in the beam, at half size:
 * marched from where the view ray enters the room to the surface it hits,
 * the window's opening tested at each step (white-noise jittered, then
 * blurred, so there's no pattern). Stored tone-compressed, to be added.
 */
export function shaftFS(q: Quality): string {
  return `${HEADER}
${sceneGlsl()}
#define SHAFT_STEPS ${q.shaftSteps}
uniform sampler2D uG0;
uniform sampler2D uG1;
uniform vec3 uWinDir;
uniform vec3 uWinCol;
uniform float uShaft;
uniform float uExposure;
uniform vec2 uFull; // the full internal size
out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (uShaft <= 0.0 || uWinDir.x > -0.004) return;
  vec2 frag = gl_FragCoord.xy * 2.0;
  ivec2 ip = ivec2(clamp(frag, vec2(0.0), uFull - 1.0));
  vec4 g0 = texelFetch(uG0, ip, 0);
  vec4 g1 = texelFetch(uG1, ip, 0);
  if (g1.a < 0.5) return;
  float mat = floor(g0.b * 255.0 + 0.5);
  if (mat == M_CUT) return;
  float depth = unpackDepth(g0.rg) * DEPTH_RANGE;
  vec3 ro, rd;
  cameraRay(frag, ro, rd);
  vec2 tr = boxRange(ro, safeInv(rd), vec3(RW * 0.5, RH * 0.5, RD * 0.5), vec3(RW * 0.5, RH * 0.5, RD * 0.5));
  float t0 = max(tr.x, 0.0);
  float t1 = min(tr.y, depth);
  if (t1 <= t0) return;
  float dt = (t1 - t0) / float(SHAFT_STEPS);
  float jitter = hash12(gl_FragCoord.xy);
  float acc = 0.0;
  float s0;
  for (int i = 0; i < SHAFT_STEPS; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + jitter) * dt);
    // thicker air lower down, where the dust hangs
    acc += aperture(p, uWinDir, s0) * (1.15 - 0.3 * p.y / RH);
  }
  acc *= dt;
  float mu = dot(uWinDir, rd);
  const float G = 0.55;
  float hg = (1.0 - G * G) / pow(1.0 + G * G - 2.0 * G * mu, 1.5);
  vec3 s = uWinCol * acc * uShaft * (0.25 + 0.2 * hg) * uExposure;
  outColor = vec4(1.0 - exp(-s), 1.0);
}
`;
}

/* ---------------------------------------------------------------------- */
/* dust                                                                    */
/* ---------------------------------------------------------------------- */

export function motesVS(): string {
  return `${HEADER}
${sceneGlsl()}
in vec4 aSeed;
uniform sampler2D uG0;
uniform vec2 uSize;     // internal px
uniform float uTime;
uniform float uStir;
uniform vec3 uWinDir;
uniform float uScale;   // point size multiplier
out float vBright;
out float vGlint;

void main() {
  vec3 b = aSeed.xyz;
  float ph = aSeed.w * 6.2831853;
  float t = uTime;
  vec3 p;
  p.x = 0.12 + b.x * 3.6 + sin(t * 0.13 + ph) * 0.14 + sin(t * 0.41 + ph * 2.3) * 0.035;
  p.z = 0.15 + b.z * 3.9 + cos(t * 0.11 + ph * 1.7) * 0.14 + sin(t * 0.37 + ph * 3.1) * 0.035;
  p.y = 0.08 + mod(b.y * 2.4 + t * (0.008 + 0.012 * fract(aSeed.w * 7.31)) + sin(t * 0.23 + ph) * 0.06, 2.4);
  // stirred by a fast sun (the air "moves" with the light): a little swirl
  p.x += uStir * sin(t * 2.3 + ph * 5.0) * 0.07;
  p.y += uStir * cos(t * 1.9 + ph * 3.0) * 0.05;
  p.z += uStir * sin(t * 2.1 + ph * 4.0) * 0.07;
  float s0;
  float lit = aperture(p, uWinDir, s0);
  vec3 d = p - CAM_TARGET;
  vec2 px = uView.xy + vec2(dot(d, CAM_RIGHT), dot(d, CAM_UP)) / uView.z;
  float tMote = FAR - dot(d, CAM_BACK);
  ivec2 ip = ivec2(clamp(px, vec2(0.0), uSize - 1.0));
  float tScene = unpackDepth(texelFetch(uG0, ip, 0).rg) * DEPTH_RANGE;
  float seen = tMote < tScene - 0.004 ? 1.0 : 0.0;
  float glint = pow(0.5 + 0.5 * sin(t * (1.2 + fract(aSeed.w * 13.7) * 2.0) + ph * 7.0), 6.0);
  vBright = lit * seen;
  vGlint = glint;
  float size = (0.8 + 1.1 * fract(aSeed.w * 3.17)) * uScale * (0.85 + 0.4 * glint);
  gl_PointSize = size * 2.4;
  gl_Position = vBright > 0.004 ? vec4(px / uSize * 2.0 - 1.0, 0.0, 1.0) : vec4(2.0, 2.0, 0.0, 1.0);
}
`;
}

export const MOTES_FS = /* glsl */ `#version 300 es
precision highp float;
in float vBright;
in float vGlint;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d) * 4.0;
  float a = exp(-r2 * 4.0);
  outColor = vec4(uColor * vBright * a * (0.35 + 0.55 * vGlint), 0.0);
}
`;

/* ---------------------------------------------------------------------- */
/* bloom and composite                                                     */
/* ---------------------------------------------------------------------- */

export const BRIGHT_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uTexel; // source texel
out vec4 outColor;
vec3 pick(vec2 uv) {
  vec4 c = texture(uSrc, uv);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  return c.rgb * smoothstep(0.62, 1.0, l) * c.a;
}
void main() {
  vec3 c = pick(vUv + uTexel * vec2(-1.0, -1.0)) + pick(vUv + uTexel * vec2(1.0, -1.0)) +
           pick(vUv + uTexel * vec2(-1.0, 1.0)) + pick(vUv + uTexel * vec2(1.0, 1.0));
  outColor = vec4(c * 0.25, 1.0);
}
`;

export const BLUR_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uStep; // texel × direction
out vec4 outColor;
void main() {
  vec3 c = texture(uSrc, vUv).rgb * 0.2270270;
  c += (texture(uSrc, vUv + uStep * 1.3846154).rgb + texture(uSrc, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  c += (texture(uSrc, vUv + uStep * 3.2307692).rgb + texture(uSrc, vUv - uStep * 3.2307692).rgb) * 0.0702703;
  outColor = vec4(c, 1.0);
}
`;

export const COMPOSITE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uLit;
uniform sampler2D uBloom;
uniform sampler2D uShafts;
uniform vec2 uTexel;  // lit texel
uniform float uBloomAmt;
out vec4 outColor;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 fxaa(vec2 uv) {
  vec3 nw = texture(uLit, uv + vec2(-1.0, -1.0) * uTexel).rgb;
  vec3 ne = texture(uLit, uv + vec2(1.0, -1.0) * uTexel).rgb;
  vec3 sw = texture(uLit, uv + vec2(-1.0, 1.0) * uTexel).rgb;
  vec3 se = texture(uLit, uv + vec2(1.0, 1.0) * uTexel).rgb;
  vec3 m = texture(uLit, uv).rgb;
  float lnw = luma(nw), lne = luma(ne), lsw = luma(sw), lse = luma(se), lm = luma(m);
  float lo = min(lm, min(min(lnw, lne), min(lsw, lse)));
  float hi = max(lm, max(max(lnw, lne), max(lsw, lse)));
  if (hi - lo < max(0.03, hi * 0.08)) return m;
  vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), (lnw + lsw) - (lne + lse));
  float reduce = max((lnw + lne + lsw + lse) * 0.03125, 1.0 / 128.0);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * uTexel;
  vec3 a = 0.5 * (texture(uLit, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uLit, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture(uLit, uv - dir * 0.5).rgb + texture(uLit, uv + dir * 0.5).rgb);
  float lb = luma(b);
  return (lb < lo || lb > hi) ? a : b;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 c = fxaa(vUv);
  c += texture(uBloom, vUv).rgb * uBloomAmt;
  vec3 sh = texture(uShafts, vUv).rgb;
  c = c + sh - c * sh * 0.6;
  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(c, 1.0);
}
`;
