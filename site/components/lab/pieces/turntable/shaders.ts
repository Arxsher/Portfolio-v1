// The deck in one fragment shader: every part is an analytic shape in
// millimetres (deck.ts), shaded per pixel under one soft key light from the
// upper left, a sky-and-softbox environment for the metal, and soft shadows
// projected from each part's height toward the light. Painted back to
// front: ground shadow, plinth (with its printing), plinth parts, platter
// rim and strobe dots, record (vinyl, label, run-out etching, spindle),
// shadows of everything tall, then the tonearm.
//
// The vinyl's sheen is Kajiya-Kay style: the grooves are concentric, so
// the tangent at a point is perpendicular to its radius and the highlight
// lies where the tangent is square to the light, two bright wedges through
// the spindle along the light's direction. The tangent is nudged by groove
// modulation noise that turns with the record, and the highlight is broken
// by band-limited concentric striations, so the sheen shimmers as it spins
// while staying with the light.

import {
  BANDS,
  CENTRE,
  CUE,
  FADER,
  FADER_CAP,
  LABEL_R,
  LOCK_R,
  PIVOT,
  PLATTER_R,
  PLINTH,
  RECORD_R,
  REST_POINT,
  RUNOUT_OUTER,
  SPEED_BUTTONS,
  SPINDLE_R,
  START_BUTTON,
  STROBE_LAMP,
  STROBE_ROWS,
} from "./deck";

/** Record-space texture covers ±LABEL_TEX mm around the spindle. */
export const LABEL_TEX = 64;

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);
const v2 = (x: number, y: number) => `vec2(${f(x)}, ${f(y)})`;

const bandMask = BANDS.map(
  (b) => `  m += smoothstep(${f(b.inner)} - aa, ${f(b.inner)} + aa, r) * (1.0 - smoothstep(${f(b.outer)} - aa, ${f(b.outer)} + aa, r));`,
).join("\n");
const bandLoud = BANDS.map((b) => `  if (r < ${f(b.outer + 1)}) l = ${f(b.loud)};`).reverse().join("\n");

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uScale;
uniform float uDetail;

uniform vec3 uLight;
uniform vec3 uKey;
uniform vec3 uAmbTop;
uniform vec3 uAmbLow;
uniform vec3 uEnvHigh;
uniform vec3 uEnvLow;
uniform vec3 uBox;
uniform float uGround;
uniform vec3 uPlinth;
uniform vec3 uInk;
uniform vec3 uMetal;
uniform vec3 uDark;
uniform vec3 uVinyl;
uniform vec3 uSheen;
uniform float uTrans;
uniform vec3 uGlow;
uniform vec3 uCart;
uniform vec3 uGuard;
uniform float uExposure;
uniform float uRim;
uniform float uStrobeK;
uniform float uCap;

uniform float uRecordAngle;
uniform float uPlatterAngle;
uniform float uPlatterVel;
uniform vec2 uStrobe;
uniform float uLamp;

uniform vec2 uArmS;
uniform vec2 uArmK;
uniform vec2 uArmH;
uniform vec2 uArmU;
uniform vec2 uArmSide;
uniform float uLift;
uniform float uCue;
uniform float uStart;
uniform float uPower;
uniform vec2 uSpeedPress;
uniform vec2 uSpeedLed;
uniform float uFaderY;
uniform float uLock;
// hover (0..1, eased) per part: arm, record, start, 33, 45, cue, pitch
uniform float uHov[7];

uniform sampler2D uLabel;
uniform sampler2D uPrint;

const float PI = 3.14159265;
const float TAU = 6.2831853;
const vec2 C = ${v2(CENTRE.x, CENTRE.y)};
const vec2 PIV = ${v2(PIVOT.x, PIVOT.y)};
const vec2 REST = ${v2(REST_POINT.x, REST_POINT.y)};
const vec2 CUEP = ${v2(CUE.x, CUE.y)};
const vec2 LAMP = ${v2(STROBE_LAMP.x, STROBE_LAMP.y)};
const vec2 STARTP = ${v2(START_BUTTON.x, START_BUTTON.y)};
const vec2 SP33 = ${v2(SPEED_BUTTONS[0].x, SPEED_BUTTONS[0].y)};
const vec2 SP45 = ${v2(SPEED_BUTTONS[1].x, SPEED_BUTTONS[1].y)};

// heights above the plinth top (mm)
const float Z_PLATTER = 10.0;
const float Z_RECORD = 12.0;

/* ---------------------------------------------------------------- noise */

float hash11(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float vnoise1(float x) {
  float i = floor(x), t = fract(x);
  t = t * t * (3.0 - 2.0 * t);
  return mix(hash11(i), hash11(i + 1.0), t);
}
/** Value noise, periodic in x with period n. */
float vnoiseP(vec2 p, float n) {
  vec2 i = floor(p), t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  float x0 = mod(i.x, n), x1 = mod(i.x + 1.0, n);
  float a = hash21(vec2(x0, i.y)), b = hash21(vec2(x1, i.y));
  float c = hash21(vec2(x0, i.y + 1.0)), d = hash21(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}
float vnoise2(vec2 p) {
  vec2 i = floor(p), t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), t.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), t.x), t.y);
}

/* ---------------------------------------------------------------- shapes */

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
/** Oriented rounded box: centre c, unit axis u, half extents (along, across). */
float sdOBox(vec2 p, vec2 c, vec2 u, vec2 he, float r) {
  vec2 d = p - c;
  vec2 q = abs(vec2(dot(d, u), dot(d, vec2(-u.y, u.x)))) - he + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
/** Rounded rect centred at the origin: (distance, gradient). */
vec3 sdgRect(vec2 p, vec2 he, float r) {
  vec2 s = sign(p);
  vec2 q = abs(p) - he + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  vec2 g = (q.x > 0.0 && q.y > 0.0) ? normalize(q) : (q.x > q.y ? vec2(1, 0) : vec2(0, 1));
  return vec3(d, s * g);
}
/** Normal of a rounded edge of radius b, at signed distance d (negative inside), outward gradient g. */
vec3 bevel(float d, vec2 g, float b) {
  float x = clamp((d + b) / b, 0.0, 0.985);
  return normalize(vec3(g * x, sqrt(1.0 - x * x)));
}
/** Normal across a cylinder lying flat: s in -1..1 across it, v the across direction. */
vec3 cyl(float s, vec2 v) {
  s = clamp(s, -0.985, 0.985);
  return normalize(vec3(v * s, sqrt(1.0 - s * s)));
}
/** Outward gradient of sdOBox (central differences). */
vec2 gOBox(vec2 p, vec2 c, vec2 u, vec2 he, float r) {
  vec2 e = vec2(0.04, 0.0);
  return normalize(vec2(
    sdOBox(p + e.xy, c, u, he, r) - sdOBox(p - e.xy, c, u, he, r),
    sdOBox(p + e.yx, c, u, he, r) - sdOBox(p - e.yx, c, u, he, r)) + 1e-6);
}
float fill(float d, float aa) { return 1.0 - smoothstep(-aa, aa, d); }
float soft(float d, float w) { return 1.0 - smoothstep(-w, w, d); }
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
/** Unit vector v turned by angle a. */
vec2 turn(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

/* ---------------------------------------------------------------- light */

vec3 toLight(vec3 P) { return normalize(uLight - P); }

// The camera: high over the deck, a little toward the front. Seen from a
// point rather than from infinity, every flat part reflects a slightly
// different patch of the studio, which is what gives metal its gradients.
const vec3 CAM = vec3(250.0, 240.0, 1300.0);
vec3 viewDir(vec3 P) { return normalize(CAM - P); }

vec3 diffuse(vec3 n, vec3 P, float vis, float ao) {
  vec3 L = toLight(P);
  float ndl = max(dot(n, L), 0.0);
  vec3 amb = mix(uAmbLow, uAmbTop, clamp(n.z * 0.6 + 0.4, 0.0, 1.0));
  return amb * ao + uKey * ndl * vis;
}
float spec(vec3 n, vec3 P, float shine) {
  vec3 H = normalize(toLight(P) + viewDir(P));
  return pow(max(dot(n, H), 0.0), shine) * (shine + 8.0) / 40.0;
}
/** A soft-edged rectangle on the ceiling plane, seen along R from P. */
float panel(vec3 P, vec3 R, vec2 c, vec2 he, float feather) {
  if (R.z <= 0.02) return 0.0;
  vec2 hit = P.xy + R.xy * ((1500.0 - P.z) / R.z);
  vec2 q = abs(hit - c) - he;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  return 1.0 - smoothstep(-feather, feather, d);
}
// The studio: a dim room, a big softbox over the upper left (where the key
// is), and a thin strip light off to the right for the far edges.
vec3 env(vec3 n, vec3 P) {
  vec3 R = reflect(-viewDir(P), n);
  vec3 col = mix(uEnvLow, uEnvHigh, smoothstep(-0.2, 0.9, R.z));
  float box = panel(P, R, uLight.xy + vec2(-60.0, -40.0), vec2(330.0, 260.0), 170.0);
  float strip = panel(P, R, vec2(1250.0, 200.0), vec2(70.0, 700.0), 90.0) * 0.4;
  return col + uBox * (box + strip);
}
/** Brushed or polished metal. */
vec3 metal(vec3 n, vec3 P, vec3 f0, float vis, float shine, float ao) {
  vec3 e = env(n, P);
  vec3 col = f0 * (e * mix(0.6, 1.0, vis) * ao + diffuse(n, P, vis, ao) * 0.16);
  col += uKey * spec(n, P, shine) * vis * f0 * 1.3;
  return col;
}
/** Matte / satin dielectric. */
vec3 satin(vec3 n, vec3 P, vec3 albedo, float vis, float ao, float gloss) {
  vec3 col = albedo * diffuse(n, P, vis, ao);
  col += uKey * spec(n, P, 60.0) * vis * gloss * 0.12;
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, viewDir(P)), 0.0), 5.0);
  col += env(n, P) * fres * gloss * ao;
  return col;
}

/**
 * A part under the pointer (h 0..1): a touch brighter, its edge (where
 * edge is 1) catching more light, and a little lift in its blacks.
 */
vec3 hl(vec3 c, float h, float edge) { return c * (1.0 + h * (0.13 + 0.5 * edge)) + uKey * 0.02 * h; }

/** Where a point at height h above the receiving plane lands in its shadow. */
vec2 proj(vec2 x, float h) { return x + (x - uLight.xy) * h / max(uLight.z - h, 1.0); }

/* ---------------------------------------------------------------- vinyl */

float grooved(float r, float aa) {
  float m = 0.0;
${bandMask}
  return m;
}
float loudness(float r) {
  float l = 0.4;
${bandLoud}
  return l;
}
/** Concentric striations, each octave faded out before it aliases. */
float striation(float r, float px) {
  float s = 0.0;
  s += (vnoise1(r / 0.32) - 0.5) * 1.0 * smoothstep(1.3, 3.0, 0.32 / px);
  s += (vnoise1(r / 0.85 + 17.0) - 0.5) * 0.9 * smoothstep(1.3, 3.0, 0.85 / px);
  s += (vnoise1(r / 2.2 + 41.0) - 0.5) * 0.7 * smoothstep(1.3, 3.0, 2.2 / px);
  s += (vnoise1(r / 7.0 + 73.0) - 0.5) * 0.6;
  return s;
}

/* ---------------------------------------------------------------- shadows */

float armShadow(vec2 p, float zr, float px) {
  float lz = uLift * 11.0;
  float s = 0.0;
  // tube: high at the pivot, lower toward the headshell
  float hP = 38.0 - zr, hK = 25.0 + lz - zr;
  vec2 rear = PIV - uArmU * 44.0;
  vec2 a = proj(rear, hP + 2.0), b = proj(PIV, hP), c = proj(uArmK, hK);
  float t = clamp(dot(p - b, c - b) / dot(c - b, c - b), 0.0, 1.0);
  float hT = mix(hP, hK, t);
  s = max(s, soft(sdSeg(p, b, c) - 4.0, 0.6 + hT * 0.2));
  s = max(s, soft(sdSeg(p, a, b) - 4.5, 0.6 + hP * 0.2));
  // counterweight
  float hW = 39.0 - zr;
  s = max(s, soft(sdOBox(p, proj(PIV - uArmU * 62.0, hW), uArmU, vec2(16.0, 17.0), 4.0), 0.8 + hW * 0.2));
  // headshell: the cartridge and plate, then the narrow neck
  float hH = 20.0 + lz - zr;
  s = max(s, soft(sdOBox(p, proj(uArmS - uArmH * 8.4, hH), uArmH, vec2(14.0, 7.6), 2.4), 0.6 + hH * 0.2));
  s = max(s, soft(sdOBox(p, proj(uArmS - uArmH * 28.5, hH + 1.0), uArmH, vec2(8.5, 4.4), 2.0), 0.6 + hH * 0.2));
  // finger lift
  vec2 f0 = uArmS - uArmH * 7.0 + uArmSide * 5.0, f1 = uArmS - uArmH * 3.0 + uArmSide * 15.5;
  s = max(s, soft(sdSeg(p, proj(f0, hH + 1.0), proj(f1, hH + 2.0)) - 2.0, 0.5 + hH * 0.2));
  return s;
}

float tallShadow(vec2 p, float zr) {
  float s = 0.0;
  // pivot housing: a cylinder 36 mm tall
  float h = 36.0 - zr;
  if (h > 0.0) s = max(s, soft(sdSeg(p, PIV, proj(PIV, h)) - 18.0, 1.2 + h * 0.06));
  // arm rest post
  h = 24.0 - zr;
  if (h > 0.0) s = max(s, soft(sdSeg(p, REST, proj(REST, h)) - 4.2, 0.8 + h * 0.08));
  // cue lever
  h = 10.0 - zr;
  if (h > 0.0) s = max(s, soft(sdSeg(p, CUEP, proj(CUEP, h)) - ${f(CUE.r)}, 0.8 + h * 0.1));
  return s;
}

/** The headshell plate: a mount over the cartridge on a narrow neck. */
float sdHead(vec2 p) {
  float mount = sdOBox(p, uArmS - uArmH * 11.5, uArmH, vec2(9.5, 6.3), 2.2);
  float neck = sdOBox(p, uArmS - uArmH * 28.5, uArmH, vec2(8.5, 4.0), 1.8);
  return smin(mount, neck, 2.4);
}

/* ---------------------------------------------------------------- main */

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = (frag - uOrigin) / uScale;
  float px = 1.0 / uScale;
  float aa = px * 0.75;

  // ground shadow under the plinth
  vec3 pl = sdgRect(p - vec2(${f(PLINTH.w / 2)}, ${f(PLINTH.h / 2)}), vec2(${f(PLINTH.w / 2)}, ${f(PLINTH.h / 2)}), ${f(PLINTH.r)});
  if (pl.x > 90.0) { outColor = vec4(0.0); return; }
  float g1 = soft(sdgRect(p - vec2(${f(PLINTH.w / 2 + 1.0)}, ${f(PLINTH.h / 2 + 2.5)}), vec2(${f(PLINTH.w / 2)}, ${f(PLINTH.h / 2)}), ${f(PLINTH.r)}).x, 3.5);
  float g2 = soft(sdgRect(p - vec2(${f(PLINTH.w / 2 + 6.0)}, ${f(PLINTH.h / 2 + 16.0)}), vec2(${f(PLINTH.w / 2 - 6.0)}, ${f(PLINTH.h / 2 - 4.0)}), ${f(PLINTH.r + 6)}).x, 30.0);
  float g3 = soft(sdgRect(p - vec2(${f(PLINTH.w / 2 + 4.0)}, ${f(PLINTH.h / 2 + 30.0)}), vec2(${f(PLINTH.w / 2 - 20.0)}, ${f(PLINTH.h / 2 - 20.0)}), ${f(PLINTH.r + 30)}).x, 60.0);
  float ground = clamp(uGround * (g1 * 0.5 + g2 * 0.34 + g3 * 0.16), 0.0, 1.0);
  float mPl = fill(pl.x, aa);
  if (mPl <= 0.0) { outColor = vec4(0.0, 0.0, 0.0, ground); return; }

  vec2 d = p - C;
  float r = length(d);
  vec2 rad = d / max(r, 1e-4);
  vec2 tng = vec2(-rad.y, rad.x);
  float ang = atan(d.y, d.x);

  // which surface receives shadows here
  float zr = r < ${f(RECORD_R)} ? Z_RECORD : r < ${f(PLATTER_R)} ? Z_PLATTER : 0.0;
  bool nearArm = sdSeg(p, PIV - uArmU * 90.0, uArmS + uArmH * 20.0) < 70.0;
  float shArm = nearArm ? armShadow(p, zr, px) : 0.0;
  float shTall = tallShadow(p, zr);
  float vis = 1.0 - 0.9 * max(shArm, shTall);

  /* ------------------------------------------------------------ plinth */
  vec3 n = bevel(pl.x, pl.yz, 3.2);
  vec3 P = vec3(p, 0.0);
  float grain = (vnoise2(p * 2.6) - 0.5) * 0.035 * smoothstep(0.6, 1.6, 0.38 / px) + (vnoise2(p * 0.35) - 0.5) * 0.02;
  vec3 albedo = uPlinth * (1.0 + grain);
  // the printing: what always shows (red), and hairlines (green) only
  // where the screen has the pixels for them
  vec4 pr = texture(uPrint, p / vec2(${f(PLINTH.w)}, ${f(PLINTH.h)}));
  float ink = clamp(pr.r + pr.g * smoothstep(1.8, 2.9, 1.0 / px), 0.0, 1.0);
  albedo = mix(albedo, uInk, ink * 0.92);

  // contact shadows and occlusion on the plinth
  float ao = 1.0;
  ao *= mix(0.42, 1.0, smoothstep(${f(PLATTER_R)}, ${f(PLATTER_R + 9)}, r));
  vec2 pc = proj(C, Z_PLATTER);
  float platShadow = soft(length(p - pc) - ${f(PLATTER_R)}, 4.5);
  float dPiv = length(p - PIV);
  ao *= mix(0.55, 1.0, smoothstep(27.0, 34.0, dPiv));
  ao *= mix(0.6, 1.0, smoothstep(8.0, 13.0, length(p - REST)));
  ao *= mix(0.62, 1.0, smoothstep(${f(CUE.r)}, ${f(CUE.r + 5)}, length(p - CUEP)));
  float visP = vis * (1.0 - 0.85 * platShadow);
  vec3 col = satin(n, P, albedo, visP, ao, 0.35);
  // a cool rim on the far edges in the dark (keeps the slab off the tile)
  col += uRim * vec3(0.55, 0.6, 0.7) * smoothstep(-3.0, -0.4, pl.x) * smoothstep(0.2, 0.9, dot(-pl.yz, normalize(vec2(-0.6, -1.0))));

  /* ------------------------------------------------------------ strobe lamp */
  {
    float dl = length(p - LAMP);
    float bez = fill(dl - ${f(STROBE_LAMP.r)}, aa);
    if (bez > 0.0) {
      vec3 nb = bevel(dl - ${f(STROBE_LAMP.r)}, (p - LAMP) / max(dl, 1e-3), 1.6);
      vec3 cb = metal(nb, vec3(p, 3.0), uMetal, vis, 80.0, 1.0);
      float lens = fill(dl - 4.6, aa);
      vec3 nl = normalize(vec3((p - LAMP) / 4.6 * 0.8, 1.0));
      vec3 glass = vec3(0.09, 0.012, 0.004) * diffuse(nl, vec3(p, 4.0), vis, 1.0) + env(nl, vec3(p, 4.0)) * 0.06 + uKey * spec(nl, vec3(p, 4.0), 160.0) * 0.5 * vis;
      glass += uGlow * uLamp * (1.4 - dl / 4.6) * 2.0;
      cb = mix(cb, glass, lens);
      col = mix(col, cb, bez);
    }
    // its light on the plinth
    col += uGlow * uLamp * 0.28 * exp(-max(dl - 5.0, 0.0) / 9.0) * (1.0 - bez);
  }

  /* ------------------------------------------------------------ start / stop */
  {
    vec3 sb = sdgRect(p - STARTP, vec2(${f(START_BUTTON.half)}), 4.4);
    if (sb.x < 1.2) {
      float well = fill(sb.x, aa);
      vec3 cap = sdgRect(p - STARTP, vec2(${f(START_BUTTON.half - 1.3)}), 3.4);
      float mc = fill(cap.x, aa);
      float press = uStart;
      vec3 nc = bevel(cap.x, cap.yz, 1.8);
      vec3 cc = metal(nc, vec3(p, 2.0 - press), uMetal * uCap * mix(1.0, 0.86, press), vis, 60.0, 1.0);
      // brushed: straight lines across the cap
      cc *= 1.0 + (vnoise1((p.y - STARTP.y) * 6.0) - 0.5) * 0.07 * smoothstep(0.5, 1.5, 0.3 / px);
      cc = hl(cc, uHov[2], smoothstep(-2.0, -0.3, cap.x));
      // the power light in its corner
      float led = length(p - (STARTP + vec2(8.6, -8.6)));
      cc = mix(cc, mix(vec3(0.05, 0.02, 0.01), uGlow * 2.2, uPower), fill(led - 1.25, aa));
      cc += uGlow * uPower * 0.35 * exp(-max(led - 1.2, 0.0) / 1.6);
      vec3 cw = col * mix(0.34, 0.6, smoothstep(-1.4, 0.0, sb.x));
      col = mix(col, mix(cw, cc, mc), well);
      // its shadow inside the well
      col *= 1.0 - 0.25 * well * (1.0 - mc) * (1.0 - press);
    }
  }

  /* ------------------------------------------------------------ 33 / 45 */
  for (int i = 0; i < 2; i++) {
    vec2 bp = i == 0 ? SP33 : SP45;
    float press = i == 0 ? uSpeedPress.x : uSpeedPress.y;
    float lit = i == 0 ? uSpeedLed.x : uSpeedLed.y;
    float db = length(p - bp);
    if (db < ${f(SPEED_BUTTONS[0].r + 2)}) {
      float well = fill(db - ${f(SPEED_BUTTONS[0].r + 1)}, aa);
      float mc = fill(db - ${f(SPEED_BUTTONS[0].r)}, aa);
      vec3 nc = bevel(db - ${f(SPEED_BUTTONS[0].r)}, (p - bp) / max(db, 1e-3), 1.6);
      vec3 cc = metal(nc, vec3(p, 2.0 - press), uMetal * mix(1.0, 0.86, press), vis, 60.0, 1.0);
      cc = hl(cc, i == 0 ? uHov[3] : uHov[4], smoothstep(-1.8, -0.3, db - ${f(SPEED_BUTTONS[0].r)}));
      col = mix(col, mix(col * 0.4, cc, mc), well);
    }
    float dl = length(p - (bp + vec2(0.0, -11.0)));
    col = mix(col, mix(vec3(0.03, 0.012, 0.006), uGlow * 2.2, lit), fill(dl - 1.2, aa));
    col += uGlow * lit * 0.4 * exp(-max(dl - 1.1, 0.0) / 1.8);
  }

  /* ------------------------------------------------------------ pitch fader */
  {
    vec2 FC = ${v2(FADER.x, FADER.y)};
    // the slot: a narrow recess, its far wall in shade and its near lip lit
    float slot = sdOBox(p, FC, vec2(0.0, 1.0), vec2(${f(FADER.half + FADER_CAP.along + 1.5)}, 1.7), 1.7);
    if (slot < 3.0) {
      float ms = fill(slot, aa);
      float across = (p.x - FC.x) / 1.7;
      vec3 inner = uDark * diffuse(vec3(0, 0, 1), vec3(p, -6.0), 0.4, 0.5) + uDark * 0.4;
      inner *= mix(0.5, 1.1, smoothstep(-1.0, 1.0, across));
      col = mix(col, inner, ms);
      // the lip: lit on the side away from the light
      float lip = (1.0 - smoothstep(0.0, 0.7, abs(slot))) * (1.0 - ms * 0.6);
      col += uKey * 0.05 * lip * smoothstep(-0.5, 1.0, across) * vis;
    }
    // the cap and its shadow
    vec2 kc = vec2(FC.x, uFaderY);
    vec2 kh = vec2(${f(FADER_CAP.along)}, ${f(FADER_CAP.across)});
    float sh = soft(sdOBox(p, proj(kc, 9.0), vec2(0.0, 1.0), kh, 2.0), 1.6 + 9.0 * 0.12);
    col *= 1.0 - 0.42 * sh;
    float kd = sdOBox(p, kc, vec2(0.0, 1.0), kh, 2.0);
    float mk = fill(kd, aa);
    if (mk > 0.0) {
      vec3 nk = bevel(kd, gOBox(p, kc, vec2(0.0, 1.0), kh, 2.0), 2.2);
      // a shallow dish across the top, so the light rolls over it
      nk = normalize(nk + vec3(0.0, -(p.y - kc.y) / kh.x * 0.12, 0.0));
      vec3 ck = satin(nk, vec3(p, 9.0), uDark * 1.25, 1.0, 1.0, 1.1);
      // the index line
      float line = fill(abs(p.y - kc.y) - 0.38, aa) * step(abs(p.x - kc.x), kh.y - 1.6);
      ck = mix(ck, vec3(0.82) * diffuse(vec3(0, 0, 1), vec3(p, 9.0), 1.0, 1.0), line * 0.92);
      col = mix(col, hl(ck, uHov[6], smoothstep(-2.4, -0.3, kd)), mk);
    }
    // quartz lock: a small green light by the zero mark
    float dl = length(p - (FC + vec2(10.6, 0.0)));
    vec3 green = vec3(0.12, 1.0, 0.32);
    col = mix(col, mix(vec3(0.01, 0.03, 0.012), green * 1.8, uLock), fill(dl - 1.15, aa));
    col += green * uLock * 0.3 * exp(-max(dl - 1.1, 0.0) / 1.6);
  }

  /* ------------------------------------------------------------ pivot base, rest, cue */
  {
    // base flange round the housing
    float m = fill(dPiv - 27.0, aa);
    if (m > 0.0) {
      vec3 nb = bevel(dPiv - 27.0, (p - PIV) / max(dPiv, 1e-3), 3.0);
      vec3 cb = metal(nb, vec3(p, 3.0), uMetal * 0.92, vis, 40.0, 1.0);
      cb *= 1.0 + (vnoise1(dPiv * 5.0) - 0.5) * 0.08 * smoothstep(0.5, 1.5, 0.2 / px);
      col = mix(col, cb, m);
    }
    // arm rest: base disc, post, cradle
    float dr = length(p - REST);
    float mb = fill(dr - 8.0, aa);
    if (mb > 0.0) {
      vec3 nb = bevel(dr - 8.0, (p - REST) / max(dr, 1e-3), 2.0);
      col = mix(col, metal(nb, vec3(p, 2.0), uMetal * 0.9, vis, 60.0, 1.0), mb);
      float post = fill(dr - 4.2, aa);
      vec3 np = normalize(vec3((p - REST) / 4.2 * 0.85, 1.0));
      col = mix(col, metal(np, vec3(p, 22.0), uMetal, 1.0, 90.0, 1.0), post);
      // the rubber cradle across the tube's line
      float cr = sdOBox(p, REST, vec2(1.0, 0.0), vec2(6.5, 2.2), 1.6);
      col = mix(col, satin(vec3(0, 0, 1), vec3(p, 24.0), uDark * 0.7, 1.0, 1.0, 0.6), fill(cr, aa));
    }
    // cue lever base
    float dq = length(p - CUEP);
    float mq = fill(dq - ${f(CUE.r)}, aa);
    if (mq > 0.0) {
      vec3 nq = bevel(dq - ${f(CUE.r)}, (p - CUEP) / max(dq, 1e-3), 2.4);
      col = mix(col, metal(nq, vec3(p, 8.0), uMetal * 0.92, vis, 60.0, 1.0), mq);
    }
  }

  /* ------------------------------------------------------------ platter */
  if (r < ${f(PLATTER_R)} + aa) {
    float mP = fill(r - ${f(PLATTER_R)}, aa);
    // flat top, a chamfer and a rounded lip
    vec3 np = vec3(0.0, 0.0, 1.0);
    np = mix(np, normalize(vec3(rad * 0.62, 1.0)), smoothstep(161.0, 161.6, r));
    np = r > 165.0 ? bevel(r - ${f(PLATTER_R)}, rad, 1.0) : np;
    vec3 Pp = vec3(p, Z_PLATTER);
    float visR = vis * (1.0 - 0.8 * soft(length(p - proj(C, 2.0)) - ${f(RECORD_R)}, 0.7));
    float aoR = mix(0.5, 1.0, smoothstep(${f(RECORD_R)}, ${f(RECORD_R + 2.2)}, r));
    vec3 cp = metal(np, Pp, uMetal, visR, 30.0, aoR);
    // machined: concentric anisotropic highlight, fine rings
    vec3 Hp = normalize(toLight(Pp) + viewDir(Pp));
    float TL = dot(tng, Hp.xy);
    float lobe = exp(-900.0 * TL * TL) * 0.5 + exp(-70.0 * TL * TL) * 0.16;
    cp += uKey * uMetal * lobe * visR * (np.z > 0.99 ? 1.0 : 0.4);
    cp *= 1.0 + (vnoise1(r / 0.3) - 0.5) * 0.12 * smoothstep(1.2, 2.6, 0.3 / px) + (vnoise1(r / 1.1 + 9.0) - 0.5) * 0.06;

    // strobe dots: polished bumps, motion-blurred under the room light,
    // frozen where the lamp's flashes catch them
    // The lamp lights an arc of about 40 degrees, a run of some 20 dots.
    // Under room light alone the dots smear into a band once the platter
    // turns; under the lamp they stand still at the set speed (or drift
    // when the pitch is off). A dim room shows them lit up; a bright one by
    // contrast, orange and darker than the polished rim, since added glow
    // would only wash out against bright metal.
    float lampA = atan(LAMP.y - C.y, LAMP.x - C.x);
    float dA = atan(sin(ang - lampA), cos(ang - lampA));
    float lampLit = uLamp * exp(-dA * dA / (2.0 * 0.35 * 0.35));
    float dotR = 0.9;
    for (int i = 0; i < 2; i++) {
      float rr = i == 0 ? ${f(STROBE_ROWS[0].r)} : ${f(STROBE_ROWS[1].r)};
      float N = i == 0 ? ${f(STROBE_ROWS[0].dots)} : ${f(STROBE_ROWS[1].dots)};
      float dy = r - rr;
      if (abs(dy) > dotR + 1.0) continue;
      float spacing = TAU * rr / N;
      // room light: real position, smeared by one frame of motion
      float blur = abs(uPlatterVel) * (1.0 / 60.0) * rr;
      float x = (ang - uPlatterAngle) / TAU * N;
      float dx = (fract(x + 0.5) - 0.5) * spacing;
      float dxs = max(abs(dx) - blur * 0.5, 0.0);
      float amb = fill(length(vec2(dxs, dy)) - dotR, aa) * (2.0 * dotR) / min(2.0 * dotR + blur, spacing);
      // the smeared band stays quiet, so the frozen dots stand out from it
      amb *= 1.0 - 0.5 * smoothstep(0.3, 0.9, blur / spacing);
      // flash light: the apparent (aliased) position, sharp
      float phase = i == 0 ? uStrobe.x : uStrobe.y;
      float xs = (ang - phase) / TAU * N;
      float dxf = (fract(xs + 0.5) - 0.5) * spacing;
      float flash = fill(length(vec2(dxf, dy)) - dotR, aa);
      float dome = sqrt(max(0.0, 1.0 - (dxs * dxs + dy * dy) / (dotR * dotR)));
      vec3 dn = normalize(vec3(vec2(dxs, dy) / dotR * 0.7, 1.0));
      vec3 dc = metal(dn, Pp, uMetal * 1.05, visR, 120.0, 1.0);
      cp = mix(cp, dc * (1.0 + 0.3 * dome), amb * (1.0 - lampLit));
      float fl = flash * lampLit;
      // dim room: the lamp is most of the light on the rim, the dots glow
      vec3 lit = mix(cp, cp * 0.5, lampLit * 0.35 * (1.0 - flash)) + uGlow * fl * 1.6;
      // bright room: the dots read by contrast, domed, a glint at the top
      float domeF = sqrt(max(0.0, 1.0 - (dxf * dxf + dy * dy) / (dotR * dotR)));
      vec3 shade = mix(cp, cp * 0.12 + uGlow * (0.32 + 0.24 * domeF), fl);
      cp = mix(lit, shade, uStrobeK);
    }
    // the lamp's warm wash on the rim
    cp += uGlow * lampLit * 0.08 * smoothstep(151.0, 160.0, r) * (1.0 - 0.75 * uStrobeK);
    col = mix(col, cp, mP);
  }

  /* ------------------------------------------------------------ record */
  if (r < ${f(RECORD_R)} + aa) {
    float mR = fill(r - ${f(RECORD_R)}, aa);
    vec2 q = vec2(cos(-uRecordAngle) * d.x - sin(-uRecordAngle) * d.y, sin(-uRecordAngle) * d.x + cos(-uRecordAngle) * d.y);
    float a = ang - uRecordAngle;
    vec3 Pr = vec3(p, Z_RECORD);
    vec3 L = toLight(Pr);

    // the edge bead and the pressed step round the label
    vec3 nr = vec3(0.0, 0.0, 1.0);
    if (r > 149.2) nr = bevel(r - ${f(RECORD_R)}, rad, 1.8);
    float g = grooved(r, aa);
    float loud = loudness(r) * (0.75 + 0.5 * vnoise1(r * 0.3 + 5.0));

    // The sheen, Kajiya-Kay: the grooves run along the tangent, so the
    // highlight is where the tangent is square to the half vector. Groove
    // modulation nudges the tangent a hair (it turns with the record, so the
    // wedges shimmer), and a slight warp tilts it out of the plane once a
    // turn, so they sway as the record spins.
    vec3 V = viewDir(Pr);
    vec3 H = normalize(L + V);
    float m1 = vnoiseP(vec2(a / TAU * 72.0, r * 0.42), 72.0) - 0.5;
    float m2 = (vnoiseP(vec2(a / TAU * 240.0, r * 1.3 + 11.0), 240.0) - 0.5) * uDetail;
    float delta = (m1 * 0.035 + m2 * 0.018) * loud;
    vec2 t2 = cos(delta) * tng + sin(delta) * rad;
    float warp = (r / ${f(RECORD_R)}) * (cos(a + 0.6) * 0.010 + cos(2.0 * a + 2.1) * 0.004);
    vec3 T = normalize(vec3(t2, warp));
    float TH = dot(T, H);
    float stri = striation(r, px);
    float narrow = exp(-TH * TH * 2400.0 / (0.45 + loud));
    float broad = exp(-TH * TH * 150.0);
    float sheen = (narrow * clamp(0.7 + 0.75 * stri, 0.05, 2.0) + broad * 0.05 * (1.0 + 0.6 * stri)) * g;

    // run-out: lead-out spiral and the locked groove
    float ro = smoothstep(${f(LOCK_R)} - 0.3, ${f(LOCK_R)}, r) * (1.0 - smoothstep(${f(RUNOUT_OUTER)} - aa, ${f(RUNOUT_OUTER)} + aa, r));
    float u = (${f(RUNOUT_OUTER)} - r) / 3.6 - a / TAU;
    float lw = max(0.07, px * 0.6);
    float spiral = (1.0 - smoothstep(lw, lw + px, abs(fract(u + 0.5) - 0.5) * 3.6)) * ro;
    float lock = 1.0 - smoothstep(lw, lw + px, abs(r - ${f(LOCK_R)}));
    float lines = max(spiral, lock) * min(1.0, 0.12 / px);
    sheen += lines * exp(-TH * TH * 600.0) * 0.8;

    vec4 lab = texture(uLabel, q / ${f(LABEL_TEX * 2)} + 0.5);
    float etch = lab.a * smoothstep(${f(LABEL_R + 1.5)}, ${f(LABEL_R + 2.5)}, r) * (1.0 - smoothstep(${f(RUNOUT_OUTER - 0.8)}, ${f(RUNOUT_OUTER)}, r));

    // the body: near-black plastic, a little lighter where the grooves are
    vec3 base = uVinyl * (1.0 + g * 0.35 + lines * 0.4);
    vec3 cr = base * diffuse(nr, Pr, vis, 1.0);
    // coloured pressings let light in and back out (more toward the edge,
    // where the platter beneath shows least)
    cr += uVinyl * uTrans * (0.4 + 0.6 * vis) * (0.55 + 0.45 * smoothstep(60.0, ${f(RECORD_R)}, r));
    cr += uSheen * sheen * vis;
    // gloss: the smooth vinyl mirrors the studio; the grooves scatter it
    float fres = 0.045 + 0.955 * pow(1.0 - max(dot(nr, V), 0.0), 5.0);
    cr += env(nr, Pr) * fres * (1.0 - g * 0.82) * mix(0.7, 1.0, vis);
    cr += uKey * spec(nr, Pr, 400.0) * vis * 0.08 * (1.0 - g * 0.8);
    // etching: matte scratches that catch the light
    cr = mix(cr, cr + uSheen * 0.04 + vec3(0.03) * diffuse(vec3(0, 0, 1), Pr, vis, 1.0), etch);
    cr += uSheen * etch * broad * 0.4 * vis;
    // under the pointer, the edge bead and the sheen lift a little
    float hRec = uHov[1];
    cr += uKey * hRec * (0.05 * smoothstep(147.6, 150.4, r) + 0.12 * uSheen.x * sheen) * (0.4 + 0.6 * vis);

    // label
    if (r < ${f(LABEL_R)} + 1.4) {
      float mL = fill(r - ${f(LABEL_R)}, aa);
      vec3 art = pow(lab.rgb, vec3(2.2));
      float paper = (vnoise2(q * 3.4) - 0.5) * 0.05 * smoothstep(0.6, 1.6, 0.3 / px) + (vnoise2(q * 0.6 + 3.0) - 0.5) * 0.03;
      vec3 nl = vec3(0.0, 0.0, 1.0);
      vec3 cl = art * (1.0 + paper) * diffuse(nl, Pr, vis, 1.0);
      cl += uKey * spec(nl, Pr, 18.0) * vis * 0.03;
      // the label is pressed in: a fine shadow line round it
      float edge = smoothstep(${f(LABEL_R - 1.0)}, ${f(LABEL_R)}, r) * mL;
      cl *= 1.0 - 0.35 * edge;
      cr = mix(cr, cl, mL);
      cr *= 1.0 - 0.6 * (1.0 - smoothstep(0.0, 0.9, abs(r - ${f(LABEL_R + 0.5)}))) * (1.0 - mL);
    }
    // spindle
    if (r < ${f(SPINDLE_R)} + 1.6) {
      float ms = fill(r - ${f(SPINDLE_R)}, aa);
      vec3 ns = normalize(vec3(rad * clamp(r / ${f(SPINDLE_R)}, 0.0, 0.95), 1.0 - 0.5 * clamp(r / ${f(SPINDLE_R)}, 0.0, 1.0)));
      vec3 cs = metal(ns, vec3(p, 22.0), vec3(0.9), 1.0, 220.0, 1.0);
      cr *= 1.0 - 0.55 * (1.0 - smoothstep(${f(SPINDLE_R)}, ${f(SPINDLE_R + 1.4)}, r));
      cr = mix(cr, cs, ms);
    }
    col = mix(col, cr, mR);
  }

  /* ------------------------------------------------------------ cue lever handle */
  {
    float t = uCue;
    float aq = mix(${f((200 * Math.PI) / 180)}, ${f((156 * Math.PI) / 180)}, t);
    vec2 tip = CUEP + vec2(cos(aq), sin(aq)) * ${f(CUE.length)};
    float sq = soft(sdSeg(p, proj(CUEP, 12.0), proj(tip, 14.0)) - 2.6, 1.6);
    col *= 1.0 - 0.45 * sq * (1.0 - fill(length(p - CUEP) - ${f(CUE.r)}, aa));
    float dh = sdSeg(p, CUEP, tip) - 2.4;
    float mh = fill(dh, aa);
    if (mh > 0.0) {
      vec2 hu = normalize(tip - CUEP);
      vec2 hv = vec2(-hu.y, hu.x);
      vec3 nh = cyl(dot(p - CUEP, hv) / 2.4, hv);
      col = mix(col, hl(metal(nh, vec3(p, 12.0), uMetal, 1.0, 120.0, 1.0), uHov[5], 0.5), mh);
    }
    float db = length(p - tip) - 3.3;
    float mk = fill(db, aa);
    if (mk > 0.0) {
      vec3 nk = normalize(vec3((p - tip) / 3.3 * 0.85, 1.0));
      col = mix(col, hl(satin(nk, vec3(p, 14.0), uDark * 0.9, 1.0, 1.0, 1.2), uHov[5], smoothstep(-1.6, 0.0, db)), mk);
    }
    float dc = length(p - CUEP) - 3.0;
    col = mix(col, metal(normalize(vec3((p - CUEP) / 3.0 * 0.7, 1.0)), vec3(p, 13.0), uMetal, 1.0, 100.0, 1.0), fill(dc, aa));
  }

  /* ------------------------------------------------------------ tonearm */
  if (nearArm) {
    vec2 v = vec2(-uArmU.y, uArmU.x);
    float lz = uLift * 11.0;

    // pivot housing: black anodised, a polished bearing cap, the yoke
    float mH = fill(dPiv - 18.0, aa);
    if (mH > 0.0) {
      vec3 nh = bevel(dPiv - 18.0, (p - PIV) / max(dPiv, 1e-3), 2.6);
      vec3 ch = metal(nh, vec3(p, 36.0), uDark * 1.4, 1.0, 40.0, 1.0) + uDark * diffuse(nh, vec3(p, 36.0), 1.0, 1.0) * 0.5;
      ch *= 1.0 + (vnoise1(dPiv / 0.35) - 0.5) * 0.12 * smoothstep(1.2, 2.6, 0.35 / px);
      float TLh = dot(vec2(-(p - PIV).y, (p - PIV).x) / max(dPiv, 1e-3), toLight(vec3(p, 36.0)).xy);
      ch += uKey * 0.06 * exp(-90.0 * TLh * TLh) * nh.z;
      col = mix(col, ch, mH);
      // the arm's shadow on the housing top
      col *= 1.0 - 0.4 * mH * soft(sdSeg(p, proj(PIV - uArmU * 40.0, 4.0), proj(PIV + uArmU * 30.0, 4.0)) - 5.0, 2.0);
    }
    // the gimbal: a polished ring round the bearing, with a bearing cap
    // either side of the arm
    float ringD = abs(dPiv - 10.6) - 2.3;
    float mY = fill(ringD, aa);
    if (mY > 0.0) {
      float t = clamp((dPiv - 10.6) / 2.3, -1.0, 1.0);
      vec3 ny = normalize(vec3((p - PIV) / max(dPiv, 1e-3) * t * 0.9, sqrt(max(0.0, 1.0 - t * t * 0.81))));
      col = mix(col, metal(ny, vec3(p, 40.0), uMetal, 1.0, 110.0, 1.0), mY);
    }
    for (int k = -1; k <= 1; k += 2) {
      vec2 sp = PIV + v * 11.6 * float(k);
      float ds = length(p - sp) - 3.4;
      float mB = fill(ds, aa);
      if (mB > 0.0) {
        vec3 nb = normalize(vec3((p - sp) / 3.4 * 0.82, 1.0));
        vec3 cb = metal(nb, vec3(p, 41.0), uMetal * 1.04, 1.0, 160.0, 1.0);
        cb *= 1.0 - 0.35 * (1.0 - smoothstep(0.6, 1.1, length(p - sp)));
        col = mix(col * (1.0 - 0.35 * fill(ds - 1.2, 1.4)), cb, mB);
      }
    }
    // the bearing's own cap, under the tube
    {
      float dc = dPiv - 6.2;
      float mc = fill(dc, aa);
      vec3 nc = normalize(vec3((p - PIV) / 6.2 * 0.5, 1.0));
      col = mix(col, metal(nc, vec3(p, 39.0), uDark * 2.2 + uMetal * 0.08, 1.0, 90.0, 1.0), mc);
    }

    // counterweight and the stub it rides on
    vec2 cw = PIV - uArmU * 62.0;
    float stub = sdSeg(p, PIV, PIV - uArmU * 46.0) - 4.6;
    float mS = fill(stub, aa);
    if (mS > 0.0) col = mix(col, metal(cyl(dot(p - PIV, v) / 4.6, v), vec3(p, 40.0), uMetal, 1.0, 160.0, 1.0), mS);
    float cwd = sdOBox(p, cw, uArmU, vec2(16.0, 17.0), 3.0);
    float mW = fill(cwd, aa);
    if (mW > 0.0) {
      float along = dot(p - cw, uArmU);
      float across = dot(p - cw, v) / 17.0;
      vec3 nw = cyl(across, v);
      // rounded ends
      nw = normalize(nw + vec3(uArmU * smoothstep(12.5, 16.0, abs(along)) * sign(along) * 1.2, 0.0));
      bool ring = abs(along - 12.5) < 2.0;
      vec3 cwc = ring ? metal(nw, vec3(p, 46.0), uMetal, 1.0, 120.0, 1.0)
                      : metal(nw, vec3(p, 46.0), uDark * 1.5, 1.0, 50.0, 1.0) + uDark * diffuse(nw, vec3(p, 46.0), 1.0, 1.0) * 0.6;
      // knurling in the middle
      float kn = step(abs(along + 1.5), 9.0) * (0.5 + 0.5 * cos(along * TAU / 1.05));
      cwc *= 1.0 - 0.28 * kn * smoothstep(0.5, 1.2, 0.33 / px) * (ring ? 0.0 : 1.0);
      col = mix(col, cwc, mW);
    }

    // the tube
    float tube = sdSeg(p, PIV, uArmK) - 4.0;
    float mT = fill(tube, aa);
    if (mT > 0.0) {
      float s = dot(p - PIV, v) / 4.0;
      vec3 nt = cyl(s, v);
      vec3 ct = metal(nt, vec3(p, 30.0 + lz), uMetal * 1.04, 1.0, 220.0, 1.0);
      col = mix(col, hl(ct, uHov[0], smoothstep(0.45, 1.0, abs(s))), mT);
    }
    // collar at the headshell joint (knurled)
    float coll = sdOBox(p, uArmK - uArmU * 2.5, uArmU, vec2(5.5, 5.6), 1.6);
    float mC = fill(coll, aa);
    if (mC > 0.0) {
      vec3 nc = cyl(dot(p - uArmK, v) / 5.6, v);
      vec3 cc = metal(nc, vec3(p, 28.0 + lz), uMetal, 1.0, 90.0, 1.0);
      cc *= 1.0 - 0.18 * (0.5 + 0.5 * cos(dot(p - uArmK, uArmU) * TAU / 0.9)) * smoothstep(0.6, 1.4, 0.3 / px);
      col = mix(col, hl(cc, uHov[0], 0.3), mC);
    }

    // The headshell, as on the classic decks: a brushed aluminium plate on
    // a narrow neck, the cartridge under it (black anodised; its flanks and
    // nose show past the plate), the stylus housing at the front in the
    // accent, two slotted screws in their mounting slots, and the finger
    // lift, a rounded tab off the side.
    float hArm = uHov[0];
    vec2 hv = uArmSide;
    float fine = smoothstep(1.6, 3.2, 1.0 / px);

    // cartridge body
    vec2 cartC = uArmS - uArmH * 5.0;
    vec2 cartHe = vec2(8.6, 7.4);
    float cart = sdOBox(p, cartC, uArmH, cartHe, 1.2);
    if (cart < aa) {
      vec3 nk = bevel(cart, gOBox(p, cartC, uArmH, cartHe, 1.2), 1.6);
      vec3 Pk = vec3(p, 17.0 + lz);
      vec3 ck = satin(nk, Pk, uCart, 1.0, 1.0, 1.2) + metal(nk, Pk, vec3(0.06), 1.0, 90.0, 1.0);
      col = mix(col, hl(ck, hArm, smoothstep(-1.6, -0.2, cart)), fill(cart, aa));
    }
    // stylus housing, past the body's nose
    vec2 guardC = uArmS + uArmH * 2.6;
    vec2 guardHe = vec2(2.5, 4.0);
    float guard = sdOBox(p, guardC, uArmH, guardHe, 1.6);
    if (guard < aa) {
      vec3 ng = bevel(guard, gOBox(p, guardC, uArmH, guardHe, 1.6), 1.5);
      vec3 Pg = vec3(p, 15.0 + lz);
      // moulded plastic: a soft gloss
      vec3 cg = satin(ng, Pg, uGuard, 1.0, 1.0, 1.4) + uKey * spec(ng, Pg, 90.0) * 0.06;
      // its grip: fine ribs across the front
      float along = dot(p - guardC, uArmH);
      cg *= 1.0 - 0.14 * step(0.6, along) * (0.5 + 0.5 * cos(along * TAU / 0.7)) * fine;
      col = mix(col, hl(cg, hArm, 0.0), fill(guard, aa));
    }

    // finger lift: a capsule that widens to a rounded pad
    vec2 f0 = uArmS - uArmH * 7.0 + hv * 5.0, f1 = uArmS - uArmH * 3.0 + hv * 15.5;
    vec2 fu = f1 - f0;
    float fLen = length(fu);
    fu /= fLen;
    float ft = clamp(dot(p - f0, fu), 0.0, fLen);
    vec2 fq = p - (f0 + fu * ft);
    float fr = mix(1.45, 2.3, smoothstep(fLen * 0.5, fLen, ft));
    float fl = length(fq) - fr;
    if (fl < aa) {
      vec3 nf = normalize(vec3(fq / fr * 0.92, sqrt(max(0.0, 1.0 - dot(fq, fq) / (fr * fr) * 0.85))));
      vec3 cf = metal(nf, vec3(p, 24.0 + lz), uMetal * 0.96, 1.0, 180.0, 1.0);
      col = mix(col, hl(cf, hArm, smoothstep(0.4, 1.0, length(fq) / fr)), fill(fl, aa));
    }

    // the plate
    float hs = sdHead(p);
    if (hs < aa) {
      vec2 e = vec2(0.05, 0.0);
      vec2 gh = normalize(vec2(sdHead(p + e.xy) - sdHead(p - e.xy), sdHead(p + e.yx) - sdHead(p - e.yx)) + 1e-6);
      // (the outermost sliver keeps a gentler slope: at its steepest the
      // edge would catch the strip light in single pixels)
      vec3 nhs = bevel(min(hs, -0.3), gh, 1.25);
      // pressed with a shallow crown across, so the light rolls over it
      float across = dot(p - uArmS, hv);
      nhs = normalize(nhs + vec3(hv * clamp(across / 6.3, -1.0, 1.0) * 0.1, 0.0));
      vec3 Ph = vec3(p, 22.0 + lz);
      vec3 chs = metal(nhs, Ph, uMetal * 0.92, 1.0, 140.0, 1.0);
      // brushed along its length; the chamfers cut bright
      chs *= 1.0 + (vnoise1(across * 7.0 + 3.0) - 0.5) * 0.1 * fine;
      float cham = smoothstep(-1.25, -0.35, hs) * (1.0 - smoothstep(-0.2, 0.3, hs));
      chs += uKey * uMetal * cham * 0.22 * pow(max(dot(nhs, normalize(toLight(Ph) + viewDir(Ph))), 0.0), 6.0);
      // mounting slots (the black cartridge below shows through) and screws
      for (int k = -1; k <= 1; k += 2) {
        vec2 c0 = uArmS - uArmH * 11.0 + hv * 3.5 * float(k);
        float slot = sdSeg(p, c0 - uArmH * 3.4, c0 + uArmH * 3.4) - 0.95;
        float mSl = fill(slot, aa);
        vec3 inSlot = uCart * diffuse(vec3(0, 0, 1), Ph, 0.5, 0.6);
        chs = mix(chs, inSlot, mSl);
        vec2 sc = c0 + uArmH * (k < 0 ? -1.1 : 0.9);
        float dsc = length(p - sc);
        chs *= 1.0 - 0.32 * (1.0 - smoothstep(1.45, 2.2, dsc)) * (1.0 - mSl * 0.5);
        if (dsc < 1.45 + aa) {
          vec3 nsc = normalize(vec3((p - sc) / 1.45 * 0.78, 1.0));
          vec3 csc = metal(nsc, vec3(p, 23.0 + lz), uMetal, 1.0, 160.0, 1.0);
          // the driver slot, each screw turned its own way
          vec2 sd = turn(uArmH, float(k) * 0.55 + 0.35);
          float cut = abs(dot(p - sc, vec2(-sd.y, sd.x))) - 0.24;
          csc = mix(csc, csc * 0.22, fill(cut, aa) * step(dsc, 1.15) * fine);
          chs = mix(chs, csc, fill(dsc - 1.45, aa));
        }
      }
      col = mix(col, hl(chs, hArm, smoothstep(-1.4, -0.2, hs)), fill(hs, aa));
    }
  }

  // exposure and a soft shoulder (keeps highlights from clipping hard)
  col *= uExposure;
  const float knee = 0.8;
  vec3 over = max(col - knee, 0.0);
  col = min(col, vec3(knee)) + (1.0 - knee) * (1.0 - exp(-over / (1.0 - knee)));
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  float alpha = mPl + (1.0 - mPl) * ground;
  outColor = vec4(col * mPl, alpha);
}
`;
