// One full-screen pass draws the whole picture: the wall and the light the
// lamp throws on it, the canopy, cable and lamp (ray-cast: the shade is half
// an ellipsoid seen from a little below, so the lit inside shows through
// the rim), the pull cord and the porcelain pull, and the bulb's bloom.
// Everything is computed per pixel in scene units, lit in linear light,
// tone-mapped with a soft shoulder and dithered.
//
// Spaces: scene (2D, y down, the canvas in scene units), the lamp's screen
// frame (lx right, ly up the lamp's axis, origin at the rim centre), lamp
// space (3D, y up the axis, z toward the viewer, before the camera's tilt)
// and camera space (3D, y up, z toward the viewer) for lighting.

import {
  BEAD_H,
  BEAD_R1,
  BEAD_R2,
  BULB_R,
  BULB_Y,
  CABLE_R,
  CANOPY_R,
  CORD_R,
  DOME_H,
  DOME_R,
  DOME_SIL,
  GROMMET_BOTTOM,
  GROMMET_R,
  GROMMET_TOP,
  GROMMET_X,
  NECK_R,
  NECK_TOP,
  RIM_E,
  TILT_C,
  TILT_S,
} from "./geometry";

/** Points of the cord polyline the shader reads (a spline through the particles). */
export const CORD_POINTS = 44;

const f = (n: number) => n.toFixed(5);

function fragment(objects: boolean) {
  return /* glsl */ `#version 300 es
precision highp float;
#define OBJECTS ${objects ? 1 : 0}

out vec4 outColor;

uniform vec2 uRes;
uniform float uPx;
uniform vec2 uView;
uniform float uSeed;

uniform vec3 uWallLit;
uniform vec3 uWallDark;
uniform vec3 uWarm;
uniform vec3 uGlowCol;

uniform vec2 uAnchor;
uniform vec2 uO;
uniform vec2 uRight;
uniform vec2 uDown;
uniform vec2 uBulb;
uniform float uEmit;
uniform float uFil;
uniform float uRoom;
uniform float uFront;
uniform float uReach;
uniform float uGlow;
uniform float uHover;
uniform vec3 uLampCol;
uniform float uRvLamp;

uniform vec4 uCord[${CORD_POINTS}];
uniform int uCordN;
uniform vec4 uCordBox;
uniform vec2 uBeadO;
uniform vec2 uBeadUp;

const float R = ${f(DOME_R)};
const float HD = ${f(DOME_H)};
const float SIL = ${f(DOME_SIL)};
const float RIM_E = ${f(RIM_E)};
const float TC = ${f(TILT_C)};
const float TS = ${f(TILT_S)};
const float BULB_R = ${f(BULB_R)};
const float BULB_Y = ${f(BULB_Y)};
const float NECK_R = ${f(NECK_R)};
const float NECK_TOP = ${f(NECK_TOP)};
const float GX = ${f(GROMMET_X)};
const float GR = ${f(GROMMET_R)};
const float GY0 = ${f(GROMMET_BOTTOM)};
const float GY1 = ${f(GROMMET_TOP)};
const float CANOPY_R = ${f(CANOPY_R)};
const float CABLE_R = ${f(CABLE_R)};
const float CORD_R = ${f(CORD_R)};
const float BR1 = ${f(BEAD_R1)};
const float BR2 = ${f(BEAD_R2)};
const float BH = ${f(BEAD_H)};

const float WALL_Z = 120.0;
const float CUT = 0.30;
const float SHADOW_K = 1.3;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sdEllipse(vec2 p, vec2 ab) {
  float k0 = length(p / ab);
  float k1 = length(p / (ab * ab));
  return k0 * (k0 - 1.0) / max(k1, 1e-5);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdUnevenCapsule(vec2 p, float r1, float r2, float h) {
  p.x = abs(p.x);
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);
  float k = dot(p, vec2(-b, a));
  if (k < 0.0) return length(p) - r1;
  if (k > a * h) return length(p - vec2(0.0, h)) - r2;
  return dot(p, vec2(a, b)) - r1;
}

vec3 toSrgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

/** Soft shoulder above 0.8: the palette below stays exact, light rolls off to white. */
vec3 tone(vec3 c) {
  vec3 x = max(c - 0.8, 0.0);
  return min(c, vec3(0.8)) + 0.2 * (1.0 - exp(-x * 5.0));
}

/** From the lamp's screen frame (lx, ly up) to scene coordinates. */
vec2 lampToScene(vec2 l) {
  return uO + uRight * l.x - uDown * l.y;
}

/** A lamp-space direction (y up its axis) in camera space (y up). */
vec3 lampToCamera(vec3 n) {
  vec3 c = vec3(n.x, n.y * TC + n.z * TS, -n.y * TS + n.z * TC);
  vec2 right = vec2(uRight.x, -uRight.y);
  vec2 up = vec2(-uDown.x, uDown.y);
  return vec3(right * c.x + up * c.y, c.z);
}

/** How lit the room is at p: the front spreading out from the lamp. */
float revealAt(vec2 p) {
  float r = clamp((uRoom * (uReach + uFront) - length(p - uBulb)) / uFront, 0.0, 1.0);
  return r * r * (3.0 - 2.0 * r);
}

/* ------------------------------------------------------------------ */
/* light                                                               */
/* ------------------------------------------------------------------ */

/**
 * What a surface sees in direction r (camera space): the ceiling dim above,
 * the room lit by the lamp below, a soft key up and to the left in front.
 */
vec3 envAt(vec3 r, float rv, vec3 lampCol) {
  float up = clamp(r.y, -1.0, 1.0) * 0.5 + 0.5;
  float below = smoothstep(0.55, 0.0, up);
  vec3 lit = uWallLit * mix(0.98, 0.66, up) + lampCol * uEmit * 0.16 * below;
  vec3 dark = uWallDark * mix(1.15, 0.85, up) + lampCol * uEmit * 0.42 * below;
  vec3 e = mix(dark, lit, rv);
  vec3 key = normalize(vec3(-0.5, 0.55, 0.67));
  float k = pow(max(dot(r, key), 0.0), 14.0);
  e += mix(vec3(0.030, 0.033, 0.040), vec3(1.35), rv) * k;
  return e;
}

/** The lamp's direct light on the wall: the scallop below the shade. */
float scallop(vec2 p) {
  vec3 v = vec3(p - uBulb, -WALL_Z);
  float len = length(v);
  float ca = dot(v.xy, uDown) / len;
  float soft = 0.04 + 0.12 * clamp(len / 420.0, 0.0, 1.0);
  float cone = smoothstep(CUT - soft, CUT + soft, ca);
  return cone * WALL_Z / len;
}

/** Distance to the cord's centreline (and the arc length and offset at the nearest point). */
float cordField(vec2 p, out float s, out vec2 off) {
  float best = 1e9;
  s = 0.0;
  off = vec2(0.0);
  for (int i = 0; i < ${CORD_POINTS - 1}; i++) {
    if (i >= uCordN - 1) break;
    vec4 a = uCord[i];
    vec4 b = uCord[i + 1];
    vec2 pa = p - a.xy;
    vec2 ba = b.xy - a.xy;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    float d2 = dot(q, q);
    if (d2 < best) {
      best = d2;
      s = mix(a.z, b.z, h);
      off = q;
    }
  }
  return sqrt(best);
}

float cordDistance(vec2 p) {
  float best = 1e9;
  for (int i = 0; i < ${CORD_POINTS - 1}; i++) {
    if (i >= uCordN - 1) break;
    vec2 pa = p - uCord[i].xy;
    vec2 ba = uCord[i + 1].xy - uCord[i].xy;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    best = min(best, dot(q, q));
  }
  return sqrt(best);
}

vec2 beadLocal(vec2 p) {
  vec2 q = p - uBeadO;
  return vec2(dot(q, vec2(-uBeadUp.y, uBeadUp.x)), -dot(q, uBeadUp));
}

float beadDistance(vec2 p) {
  vec2 l = beadLocal(p);
  return sdUnevenCapsule(vec2(l.x, -l.y), BR1, BR2, BH);
}

bool inBox(vec2 p, vec4 box, float pad) {
  return p.x > box.x - pad && p.y > box.y - pad && p.x < box.z + pad && p.y < box.w + pad;
}

/** Graphite enamel (shade, canopy): diffuse from the room, a glossy coat. */
vec3 enamel(vec3 n, vec3 albedo, float rv, vec3 lampCol, float gloss) {
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-v, n);
  float fres = 0.04 + 0.96 * pow(1.0 - max(n.z, 0.0), 5.0);
  return albedo * envAt(n, rv, lampCol) + envAt(r, rv, lampCol) * mix(0.05, 0.75, fres) * gloss;
}

/** Brushed brass (neck, grommet). */
vec3 brass(vec3 n, float rv, vec3 lampCol, float streak) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 base = vec3(0.62, 0.42, 0.20);
  vec3 e = envAt(r, rv, lampCol);
  return base * (e * (0.75 + 0.25 * streak) + 0.04 * envAt(n, rv, lampCol));
}

/** Braided cotton: a herringbone of grooves along the cord, faded out when too small to resolve. */
float braid(float s, float across, float period) {
  float v = fract(s / period + abs(across) * 0.42);
  float groove = smoothstep(0.0, 0.2, v) * smoothstep(1.0, 0.8, v);
  float lod = smoothstep(2.2, 4.5, period * uPx);
  return mix(1.0, mix(0.66, 1.0, groove), lod);
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = frag / uPx;
  float aa = 1.0 / uPx;
  vec3 lampCol = uLampCol;
  float rvHere = revealAt(p);
  float rvLamp = uRvLamp;

  /* wall ----------------------------------------------------------- */
  vec2 cv = p / uView - vec2(0.5, 0.42);
  float vig = clamp(1.0 - dot(cv, cv) * 0.95, 0.0, 1.0);
  vec3 dark = uWallDark * (0.74 + 0.34 * vig);
  // lit: only bounced light reaches the wall above the shade's cut-off, a
  // shade dimmer toward the ceiling; the lamp's own light adds the rest
  vec3 lit = uWallLit * (0.90 + 0.04 * vig) * (1.0 - 0.07 * (1.0 - smoothstep(0.0, 230.0, p.y)));
  lit *= 1.0 + 0.5 * max(uRoom - 1.0, 0.0);
  vec3 col = mix(dark, lit, rvHere);

  float shade = 0.0;
  float covOuter = 0.0;
  float ly = 0.0;
#if OBJECTS
  // the cord's and the pull's shadows, cast by the bulb onto the wall behind
  vec2 caster = uBulb + (p - uBulb) / SHADOW_K;
  if (uEmit > 0.002 && inBox(caster, uCordBox, 14.0)) {
    float pen = 1.4 + 0.016 * length(caster - uBulb);
    float dc = cordDistance(caster);
    shade = 1.0 - smoothstep(CORD_R - pen, CORD_R + pen, dc);
    float db = beadDistance(caster);
    shade = max(shade, 1.0 - smoothstep(-pen * 1.4, pen * 1.4, db));
  }
#endif
  float direct = scallop(p) * uEmit * (1.0 - 0.8 * shade);
  col += lampCol * direct * mix(1.25, 0.24, rvHere);

#if OBJECTS
  // the pull's glow on the wall around it
  float dBead = 1e9;
  if (uGlow > 0.002 && inBox(p, uCordBox, 48.0)) {
    dBead = beadDistance(p);
    col += uGlowCol * uGlow * 0.07 * exp(-max(dBead, 0.0) / 13.0);
  }

  /* canopy --------------------------------------------------------- */
  {
    vec2 q = p - uAnchor;
    float cy = -q.y;
    if (abs(q.x) < CANOPY_R + 3.0 && cy > -CANOPY_R * TS - 3.0) {
      float dSide = max(abs(q.x) - CANOPY_R, -cy);
      float dDisc = sdEllipse(vec2(q.x, cy), vec2(CANOPY_R, CANOPY_R * TS));
      float covSide = clamp(0.5 - dSide / aa, 0.0, 1.0);
      float nx = clamp(q.x / CANOPY_R, -1.0, 1.0);
      float nz = sqrt(1.0 - nx * nx);
      vec3 nSide = vec3(nx, nz * TS, nz * TC);
      vec3 cSide = enamel(nSide, vec3(0.034), rvLamp, lampCol, 1.0);
      col = mix(col, cSide, covSide);
      float covDisc = clamp(0.5 - dDisc / aa, 0.0, 1.0);
      vec3 nDisc = vec3(0.0, -TC, TS);
      vec3 cDisc = enamel(nDisc, vec3(0.034), rvLamp, lampCol, 0.6);
      // the cable's hole
      float hole = sdEllipse(vec2(q.x, cy), vec2(3.2, 3.2 * TS + 0.4));
      cDisc *= mix(1.0, 0.35, clamp(0.5 - hole / aa, 0.0, 1.0));
      col = mix(col, cDisc, covDisc);
    }
  }

  /* cable ---------------------------------------------------------- */
  vec2 neckTop = lampToScene(vec2(0.0, NECK_TOP * TC));
  {
    float dc = sdSegment(p, uAnchor, neckTop);
    if (dc < CABLE_R + 2.0) {
      vec2 axis = normalize(neckTop - uAnchor);
      vec2 rel = p - uAnchor;
      float across = clamp(dot(rel, vec2(axis.y, -axis.x)) / CABLE_R, -1.0, 1.0);
      vec3 n = vec3(vec2(axis.y, -axis.x) * across * vec2(1.0, -1.0), sqrt(1.0 - across * across));
      float b = braid(dot(rel, axis), across, 3.4);
      vec3 c = enamel(n, vec3(0.030) * b, rvLamp, lampCol, 0.25);
      col = mix(col, c, clamp(0.5 - (dc - CABLE_R) / aa, 0.0, 1.0));
    }
  }

  /* lamp ----------------------------------------------------------- */
  vec2 dl = p - uO;
  float lx = dot(dl, uRight);
  ly = -dot(dl, uDown);
  if (lx > -R - 6.0 && lx < R + 6.0 && ly > BULB_Y * TC - BULB_R - 8.0 && ly < NECK_TOP * TC + 8.0) {
    vec2 l = vec2(lx, ly);
    float dRim = sdEllipse(l, vec2(R, RIM_E));
    float dDome = max(sdEllipse(l, vec2(R, SIL)), -ly);
    float dOuter = max(dDome, -dRim);

    // ray through this pixel in lamp space
    vec3 ro = vec3(lx, ly * TC, ly * TS) + 400.0 * vec3(0.0, -TS, TC);
    vec3 rd = vec3(0.0, TS, -TC);
    vec3 sc = vec3(1.0 / R, 1.0 / HD, 1.0 / R);
    vec3 o2 = ro * sc;
    vec3 d2 = rd * sc;
    float qa = dot(d2, d2);
    float qb = dot(o2, d2);
    float qc = dot(o2, o2) - 1.0;
    float sq = sqrt(max(qb * qb - qa * qc, 0.0));
    vec3 p1 = ro + rd * ((-qb - sq) / qa);
    vec3 p2 = ro + rd * ((-qb + sq) / qa);
    vec3 bulbC = vec3(0.0, BULB_Y, 0.0);

    // inside of the shade: white enamel lit by the bulb
    float covIn = clamp(0.5 - dRim / aa, 0.0, 1.0);
    vec3 interior = vec3(0.0);
    if (covIn > 0.0) {
      vec3 nIn = -normalize(p2 * sc * sc);
      vec3 L = bulbC - p2;
      float dist2 = dot(L, L);
      float irr = max(dot(nIn, L * inversesqrt(dist2)), 0.0) * 2400.0 / (dist2 + 400.0);
      vec3 amb = envAt(vec3(0.0, -0.6, 0.8), rvLamp, lampCol) * 0.42;
      interior = vec3(0.80, 0.79, 0.76) * (lampCol * uEmit * irr + amb);
      // the rolled edge of the rim, seen from inside
      float lip = exp(-pow(max(-dRim, 0.0) / 1.1, 2.0)) * step(ly, 0.0);
      interior = mix(interior, interior * 1.25 + vec3(0.02), lip * 0.6);
      col = mix(col, interior, covIn);
    }

    // the socket above the bulb (dark porcelain), seen through the opening
    {
      float top = (BULB_Y + BULB_R - 4.0) * TC;
      float dS = max(abs(lx) - 9.5, top - ly);
      float covS = clamp(0.5 - dS / aa, 0.0, 1.0) * covIn;
      float nx = clamp(lx / 9.5, -1.0, 1.0);
      vec3 cS = enamel(lampToCamera(vec3(nx, 0.0, sqrt(1.0 - nx * nx))), vec3(0.05), rvLamp, lampCol, 0.5);
      cS += vec3(0.6, 0.58, 0.55) * lampCol * uEmit * 0.5 * (1.0 - smoothstep(top, top + 8.0, ly));
      col = mix(col, cS, covS);
    }

    // the bulb: clear glass, a coiled filament on two supports
    vec2 bq = vec2(lx, ly - BULB_Y * TC);
    float dB = length(bq) - BULB_R;
    if (dB < 2.0) {
      float covB = clamp(0.5 - dB / aa, 0.0, 1.0);
      vec2 n2 = bq / BULB_R;
      float rr = min(dot(n2, n2), 1.0);
      vec3 n = lampToCamera(normalize(vec3(n2.x, n2.y, sqrt(1.0 - rr))));
      vec3 behind = col;
      vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
      float fres = 0.04 + 0.96 * pow(1.0 - max(n.z, 0.0), 5.0);
      vec3 glass = behind * 0.9 + envAt(r, rvLamp, lampCol) * fres * 0.9;
      // a crisp highlight from the key
      glass += mix(vec3(0.05), vec3(1.4), rvLamp) * pow(max(dot(r, normalize(vec3(-0.5, 0.55, 0.67))), 0.0), 90.0);
      // filament: a coil across the middle, two support wires up to the stem
      vec2 fq = bq;
      float coil = abs(fq.y + 1.5 - 1.3 * sin(fq.x * 2.6)) - 0.35;
      coil = max(coil, abs(fq.x) - 6.0);
      float wireL = sdSegment(fq, vec2(-6.0, -1.5), vec2(-2.0, 9.5)) - 0.3;
      float wireR = sdSegment(fq, vec2(6.0, -1.5), vec2(2.0, 9.5)) - 0.3;
      float stem = max(abs(fq.x) - 1.4, max(fq.y - BULB_R, 8.0 - fq.y));
      float dF = min(coil, min(wireL, wireR));
      float covF = clamp(0.5 - dF / max(aa, 0.35), 0.0, 1.0);
      float covStem = clamp(0.5 - stem / aa, 0.0, 1.0);
      glass = mix(glass, glass * 0.85 + 0.03 * envAt(n, rvLamp, lampCol), covStem * 0.6);
      float heat = uFil * uFil;
      vec3 wire = mix(vec3(0.03), lampCol * (1.0 + 10.0 * heat), smoothstep(0.02, 0.3, uFil));
      glass = mix(glass, wire, covF * mix(0.75, 1.0, smoothstep(0.0, 0.3, uFil)));
      // glow inside the glass around the hot wire
      glass += lampCol * uEmit * (0.7 * exp(-max(dF, 0.0) / 2.2) + 0.45 * (0.55 + 0.45 * n.z));
      col = mix(col, glass, covB);
    }

    // grommet: a small brass eyelet on the rim the cord leaves through
    {
      float gx = lx - GX;
      float bottom = GY0 * TC - GR * TS * sqrt(max(1.0 - (gx / GR) * (gx / GR), 0.0));
      float dG = max(abs(gx) - GR, max(ly - GY1 * TC, bottom - ly));
      float covG = clamp(0.5 - dG / aa, 0.0, 1.0);
      if (covG > 0.0) {
        float nx = clamp(gx / GR, -1.0, 1.0);
        vec3 n = lampToCamera(vec3(nx, 0.0, sqrt(1.0 - nx * nx)));
        vec3 cG = brass(n, rvLamp, lampCol, 0.5 + 0.5 * sin(ly * 3.0));
        // its underside, lit from the room below
        float cap = smoothstep(GY0 * TC + 0.8, GY0 * TC - 0.5, ly);
        cG = mix(cG, brass(lampToCamera(vec3(0.0, -1.0, 0.0)), rvLamp, lampCol, 1.0) * 0.8, cap);
        cG += vec3(0.62, 0.42, 0.2) * lampCol * uEmit * 0.6 * smoothstep(GR, -GR, gx);
        col = mix(col, cG, covG);
      }
    }

    // neck: brass, where the cable comes in
    {
      float dN = max(abs(lx) - NECK_R, max(ly - NECK_TOP * TC, (SIL - 10.0) - ly));
      float covN = clamp(0.5 - dN / aa, 0.0, 1.0);
      if (covN > 0.0) {
        float nx = clamp(lx / NECK_R, -1.0, 1.0);
        vec3 n = lampToCamera(vec3(nx, 0.0, sqrt(1.0 - nx * nx)));
        // two turned rings
        float ring = smoothstep(0.6, 0.0, abs(ly - (NECK_TOP - 5.0) * TC) - 0.9);
        vec3 cN = brass(n, rvLamp, lampCol, 0.6 + 0.4 * sin(ly * 2.0)) * (1.0 - 0.35 * ring);
        col = mix(col, cN, covN);
      }
    }

    // outside of the shade: graphite enamel
    covOuter = clamp(0.5 - dOuter / aa, 0.0, 1.0);
    if (covOuter > 0.0) {
      vec3 nl = normalize(p1 * sc * sc);
      vec3 n = lampToCamera(nl);
      vec3 cO = enamel(n, vec3(0.032), rvLamp, lampCol, 1.0);
      // bounce from the lit room below catches the lower edge
      float low = smoothstep(26.0, 0.0, p1.y);
      cO += vec3(0.032) * lampCol * uEmit * low * 1.8 * mix(1.0, 0.4, rvLamp);
      // the rolled lip along the near rim
      float lip = exp(-pow(max(dRim, 0.0) / 1.2, 2.0));
      cO = mix(cO, enamel(lampToCamera(normalize(vec3(nl.x, -0.4, nl.z))), vec3(0.06), rvLamp, lampCol, 1.4), lip * 0.8);
      col = mix(col, cO, covOuter);
    }
  }

  /* cord ----------------------------------------------------------- */
  if (inBox(p, uCordBox, 3.0)) {
    float s;
    vec2 off;
    float dc = cordField(p, s, off);
    if (dc < CORD_R + 1.5) {
      vec2 o = off / CORD_R;
      float across = clamp(length(o), 0.0, 1.0);
      vec3 n = vec3(o.x, -o.y, sqrt(max(1.0 - across * across, 0.0)));
      float b = braid(s, across, 4.2);
      vec3 c = enamel(n, vec3(0.034) * b, revealAt(p), lampCol, 0.18);
      // the bulb lights the side that faces it, below the rim
      vec2 toB = uBulb - p;
      float dist = length(toB);
      vec3 L = normalize(vec3(toB.x, -toB.y, 6.0));
      float vis = smoothstep(-0.02, 0.25, dot(-toB / dist, uDown));
      c += vec3(0.05) * b * lampCol * uEmit * max(dot(n, L), 0.0) * vis * 9000.0 / (dist * dist + 1600.0);
      // the pull's glow reaches the last stretch of cord
      if (uGlow > 0.002) c += uGlowCol * uGlow * 0.12 * exp(-max(beadDistance(p), 0.0) / 9.0);
      col = mix(col, c, clamp(0.5 - (dc - CORD_R) / aa, 0.0, 1.0));
    }
  }

  /* the pull ------------------------------------------------------- */
  if (inBox(p, uCordBox, 4.0)) {
    float db = beadDistance(p);
    if (db < 1.5) {
      float e = 0.6;
      vec2 g = vec2(beadDistance(p + vec2(e, 0.0)) - beadDistance(p - vec2(e, 0.0)),
                    beadDistance(p + vec2(0.0, e)) - beadDistance(p - vec2(0.0, e)));
      g = g / max(length(g), 1e-5);
      vec2 bl = beadLocal(p);
      float along = clamp((-bl.y) / BH, 0.0, 1.0);
      float rLoc = mix(BR1, BR2, along);
      float s = clamp(1.0 + min(db, 0.0) / rLoc, 0.0, 1.0);
      vec3 n = normalize(vec3(g.x * s, -g.y * s, sqrt(max(1.0 - s * s, 0.0))));
      vec3 albedo = vec3(0.86, 0.85, 0.82);
      float rv = revealAt(p);
      vec3 c = albedo * envAt(n, rv, lampCol);
      // the bulb, up and to the side
      vec2 toB = uBulb - p;
      float dist = length(toB);
      vec3 L = normalize(vec3(toB.x, -toB.y, 10.0));
      c += albedo * lampCol * uEmit * max(dot(n, L), 0.0) * 9000.0 / (dist * dist + 1600.0) * 0.5;
      // glaze: reflections, a sharp glint of the bulb
      vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
      float fres = 0.04 + 0.96 * pow(1.0 - max(n.z, 0.0), 5.0);
      c += envAt(r, rv, lampCol) * mix(0.05, 0.8, fres) * 0.6;
      c += lampCol * uEmit * pow(max(dot(r, L), 0.0), 160.0) * 2.5;
      // a turned groove near the top
      float groove = exp(-pow((-bl.y - (BH - 2.5)) / 0.8, 2.0));
      c *= 1.0 - 0.28 * groove;
      // phosphorescent glaze glowing in the dark
      c += uGlowCol * uGlow * (0.36 + 0.2 * n.z);
      c += albedo * uHover * 0.05;
      col = mix(col, c, clamp(0.5 - db / aa, 0.0, 1.0));
    }
  }

#endif

  /* bloom ---------------------------------------------------------- */
  if (uEmit > 0.001) {
    vec2 bq = p - uBulb;
    float rb = length(bq * vec2(1.0, 1.18));
    float bloom = 0.55 * exp(-rb / 10.0) + 0.22 * exp(-rb / 36.0) + 0.07 * exp(-rb / 120.0);
    // the shade hides the bulb from above: less glare over the dome
    bloom *= mix(1.0, 0.3, covOuter * smoothstep(0.0, 26.0, ly));
    col += lampCol * uEmit * bloom * mix(1.0, 0.5, rvHere);
  }

  col = toSrgb(tone(col));
  col += (hash12(frag + uSeed) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;
}

/** The room alone (wall, the lamp's light, bloom): drawn over the whole canvas. */
export const FRAGMENT_ROOM = fragment(false);
/** Everything: drawn only inside the box around the lamp, the cord and their shadows. */
export const FRAGMENT_FULL = fragment(true);
