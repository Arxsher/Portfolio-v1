// GLSL for the macropad. One surface shader shades every part by its tag
// (scene.ts), compiled twice: the full look, and an emissive-only variant
// that feeds the bloom (only the under-glow and the knob's light survive).
//
// Light. A small product studio: a big softbox overhead and a little
// behind, a thin strip light low on the left, a soft key light from the
// upper left and a grey sweep for the rest. Metals take their colour from
// what they reflect, so the anodised case reads as metal because the
// softbox slides across it; the polished chamfers catch it as bright
// lines. Ambient occlusion is analytic (we know where every cap is): the
// plate is in deep shadow between the caps, cap walls darken towards the
// plate, the knob and caps throw soft shadows on the top face.
//
// Glow. Each switch has an LED under its cap. Its light pools on the plate
// round the skirt (tighter and brighter when the cap is down), climbs the
// lower walls of the caps around it and the pocket walls, and is mirrored in
// the pocket chamfer. Ripples are rings of light that spread over the plate
// from a pressed key.

import { CAP, CASE, CASE_CZ, CASE_HD, ENGRAVING, KNOB, PLATE_Y, POCKET, SKIRT_REST, TAG, TRAVEL } from "./scene";

const f = (n: number) => (Number.isInteger(n) ? `${n}.0` : `${n}`);

export const MAX_RIPPLES = 8;

export const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aTag;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform vec4 uFit;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
flat out int vTag;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorld = world.xyz;
  vNormal = mat3(uModel) * aNormal;
  vLocal = aPos;
  vTag = int(aTag + 0.5);
  vec4 clip = uViewProj * world;
  clip.xy = clip.xy * uFit.xy + uFit.zw * clip.w;
  gl_Position = clip;
}
`;

const COMMON = `
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
flat in int vTag;
out vec4 outColor;

uniform mat4 uModel;
uniform vec3 uCamPos;
uniform int uKey;          // which cap this draw is (-1 for the rest)
uniform float uTravel;     // this cap's travel (0 up … 1 bottomed out)

uniform vec3 uGlow[9];     // each LED, colour × intensity (linear)
uniform float uPress[9];   // each cap's travel
uniform vec4 uRipple[${MAX_RIPPLES}];       // x, z, radius, amplitude
uniform vec3 uRippleColor[${MAX_RIPPLES}];
uniform vec3 uKnobLight;   // the knob's indicator (colour × intensity)
uniform float uGlowGain;

#define TAG_GROUND ${TAG.ground}
#define TAG_WALL ${TAG.wall}
#define TAG_CHAMFER ${TAG.chamfer}
#define TAG_TOP ${TAG.top}
#define TAG_POCKET_CHAMFER ${TAG.pocketChamfer}
#define TAG_POCKET_WALL ${TAG.pocketWall}
#define TAG_PLATE ${TAG.plate}
#define TAG_CAP ${TAG.cap}
#define TAG_KNOB_SIDE ${TAG.knobSide}
#define TAG_KNOB_CHAMFER ${TAG.knobChamfer}
#define TAG_KNOB_TOP ${TAG.knobTop}
#define TAG_SHAFT ${TAG.shaft}

const float PLATE_Y = ${f(PLATE_Y)};
const float CASE_H = ${f(CASE.height)};
const float CASE_HW = ${f(CASE.halfWidth)};
const float CASE_HD = ${f(CASE_HD)};
const float CASE_CZ = ${f(CASE_CZ)};
const float CASE_R = ${f(CASE.radius)};
const float POCKET_HALF = ${f(POCKET.half)};
const float POCKET_R = ${f(POCKET.radius)};
const float CAP_BASE = ${f(CAP.base)};
const float CAP_H = ${f(CAP.height)};
const float CAP_TOPX = ${f(CAP.topX)};
const float CAP_TOPZ = ${f(CAP.topZ)};
const float CAP_SHIFT = ${f(CAP.topShift)};
const float SKIRT_REST = ${f(SKIRT_REST)};
const float TRAVEL = ${f(TRAVEL)};
const vec2 KNOB_C = vec2(${f(KNOB.x)}, ${f(KNOB.z)});
const float KNOB_R = ${f(KNOB.radius)};
const float KNOB_H = ${f(KNOB.height)};
const vec4 ENGRAVING = vec4(${f(ENGRAVING.x)}, ${f(ENGRAVING.z)}, ${f(ENGRAVING.halfX)}, ${f(ENGRAVING.halfZ)});

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 keyCentre(int k) {
  return vec2(float(k - (k / 3) * 3) - 1.0, float(k / 3) - 1.0);
}

/** Light on the plate at p (xz): the LED pools and the ripples. */
vec3 plateGlow(vec2 p) {
  vec3 g = vec3(0.0);
  for (int k = 0; k < 9; k++) {
    float press = uPress[k];
    float sd = sdRoundBox(p - keyCentre(k), vec2(CAP_BASE - 0.03), 0.1);
    float fall = mix(6.5, 10.0, press);
    float pool = exp(-max(sd, 0.0) * fall);
    // under the skirt the light is hidden, but let it read through gaps
    g += uGlow[k] * pool * (1.0 + 0.5 * press);
  }
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipple[i];
    if (r.w <= 0.0005) continue;
    float d = length(p - r.xy);
    float w = 0.16 + r.z * 0.09;
    float x = (d - r.z) / w;
    g += uRippleColor[i] * (r.w * exp(-x * x));
  }
  return g * uGlowGain;
}
`;

const LIGHTING = `
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uSky;
uniform vec3 uHorizon;
uniform vec3 uFloor;
uniform vec3 uSoftbox;
uniform vec3 uStrip;
uniform float uAmbient;
uniform float uExposure;

uniform vec3 uCaseAlbedo;
uniform vec3 uCaseF0;
uniform float uCaseRough;
uniform float uCaseMetal;
uniform vec3 uEdgeF0;
uniform vec3 uPlateAlbedo;
uniform vec3 uCapAlbedo;
uniform vec3 uLegend;
uniform vec3 uEngrave;
uniform vec3 uKnobF0;
uniform vec2 uShadow;      // contact, soft (ground shadow strengths)
uniform float uDetail;     // 1 on the stage, lower on tiles (fine texture)
uniform sampler2D uAtlas;

const float PI = 3.14159265;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float rectLight(vec3 r, vec3 c, vec2 halfSize, float rough) {
  float d = dot(r, c);
  if (d <= 0.0) return 0.0;
  vec3 up = abs(c.y) > 0.98 ? vec3(0.0, 0.0, -1.0) : vec3(0.0, 1.0, 0.0);
  vec3 bx = normalize(cross(up, c));
  vec3 by = cross(c, bx);
  vec3 q = r / d;
  vec2 uv = vec2(dot(q, bx), dot(q, by));
  float blur = 0.015 + rough * rough * 1.1;
  vec2 m = smoothstep(halfSize + blur, halfSize - blur, abs(uv));
  // a rough surface spreads the same light over a bigger patch
  float spread = (halfSize.x * halfSize.y) / ((halfSize.x + blur) * (halfSize.y + blur));
  return m.x * m.y * mix(1.0, spread, 0.85);
}

const vec3 SOFTBOX_DIR = vec3(-0.16, 0.97, -0.1);
const vec3 FILL_DIR = vec3(0.05, 0.55, 0.83);
const vec3 STRIP_DIR = vec3(-0.93, 0.33, 0.16);

vec3 environment(vec3 r, float rough) {
  vec3 col = mix(uFloor, uHorizon, smoothstep(-0.4, 0.04, r.y));
  col = mix(col, uSky, smoothstep(0.04, 0.85, r.y));
  col += uSoftbox * rectLight(r, normalize(SOFTBOX_DIR), vec2(0.42, 0.25), rough);
  col += uSoftbox * 0.3 * rectLight(r, normalize(FILL_DIR), vec2(0.7, 0.2), rough);
  col += uStrip * rectLight(r, normalize(STRIP_DIR), vec2(0.06, 0.55), rough);
  return col;
}

vec3 irradiance(vec3 n) {
  vec3 hemi = mix(uFloor, uSky, smoothstep(-0.6, 0.9, n.y)) * uAmbient;
  hemi += uSoftbox * 0.14 * max(dot(n, normalize(SOFTBOX_DIR)), 0.0);
  hemi += uSoftbox * 0.05 * max(dot(n, normalize(FILL_DIR)), 0.0);
  hemi += uStrip * 0.05 * max(dot(n, normalize(STRIP_DIR)), 0.0);
  return hemi;
}

/** Anisotropic GGX (t: along the grooves, b: across). */
float ggxAniso(vec3 n, vec3 h, vec3 t, vec3 b, float at, float ab) {
  float th = dot(t, h);
  float bh = dot(b, h);
  float nh = max(dot(n, h), 0.0);
  float d = th * th / (at * at) + bh * bh / (ab * ab) + nh * nh;
  return 1.0 / (PI * at * ab * d * d);
}

float ggx(float NoH, float rough) {
  float a = rough * rough;
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

vec3 shade(vec3 n, vec3 v, vec3 albedo, vec3 f0, float rough, float metal, float ao, float shadow) {
  vec3 l = normalize(uKeyDir);
  vec3 h = normalize(l + v);
  float NoV = max(dot(n, v), 0.0);
  float NoL = max(dot(n, l), 0.0);
  float NoH = max(dot(n, h), 0.0);
  vec3 F = f0 + (max(vec3(1.0 - rough), f0) - f0) * pow(1.0 - NoV, 5.0);
  vec3 r = reflect(-v, n);
  vec3 diffuse = albedo * (1.0 - metal) * (irradiance(n) * ao + uKeyColor * NoL * shadow * 0.85);
  float specOcc = clamp(pow(NoV + ao, exp2(-16.0 * rough - 1.0)) - 1.0 + ao, 0.0, 1.0);
  vec3 spec = environment(r, rough) * F * specOcc;
  spec += uKeyColor * F * ggx(NoH, max(rough, 0.08)) * NoL * shadow * 0.55;
  return diffuse + spec;
}

/** Soft occlusion from the caps for a point at height y over (p.xz). */
float capShadow(vec2 p, float y, out float contact) {
  vec3 l = normalize(uKeyDir);
  float occ = 1.0;
  contact = 1.0;
  for (int k = 0; k < 9; k++) {
    float skirt = PLATE_Y + SKIRT_REST - uPress[k] * TRAVEL;
    float top = skirt + CAP_H;
    float above = top * 0.6 + skirt * 0.4 - y;
    if (above <= 0.0) continue;
    vec2 off = l.xz / max(l.y, 0.2) * above;
    float sd = sdRoundBox(p - keyCentre(k) + off, vec2(CAP_BASE - 0.05), 0.12);
    float blur = 0.04 + above * 0.22;
    occ = min(occ, mix(0.42, 1.0, smoothstep(-blur, blur, sd)));
    float gap = max(skirt - y, 0.0);
    float sdc = sdRoundBox(p - keyCentre(k), vec2(CAP_BASE - 0.02), 0.08);
    contact = min(contact, mix(0.2 + gap * 1.6, 1.0, smoothstep(0.0, 0.05 + gap * 0.9, sdc)));
  }
  return occ;
}

vec3 tonemap(vec3 c) {
  c *= uExposure;
  // a gentle filmic shoulder: linear up to the mids, rolls off highlights
  vec3 x = max(c, 0.0);
  vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return mix(x, mapped, smoothstep(0.35, 1.2, x));
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
`;

const SURFACE = `
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCamPos - vWorld);
  vec3 p = vWorld;
  float ao = 1.0;
  float shadow = 1.0;
  vec3 color;
  vec3 emit = vec3(0.0);
  float alpha = 1.0;

  if (vTag == TAG_GROUND) {
    vec2 q = p.xz - vec2(0.0, CASE_CZ);
    float sd = sdRoundBox(q, vec2(CASE_HW, CASE_HD), CASE_R);
    vec3 l = normalize(uKeyDir);
    vec2 off = -l.xz / l.y * CASE_H * 0.55;
    float sd2 = sdRoundBox(q - off, vec2(CASE_HW, CASE_HD) - 0.06, CASE_R);
    float contact = exp(-max(sd, 0.0) / 0.035);
    float near = exp(-max(sd, 0.0) / 0.22);
    float soft = 1.0 - smoothstep(-0.35, 0.95, sd2);
    alpha = clamp(uShadow.x * contact + uShadow.y * (0.55 * soft + 0.45 * near), 0.0, 1.0);
    outColor = vec4(0.0, 0.0, 0.0, alpha);
    return;
  }

  // fine bead-blast texture for the metal, a little grain on the caps
  float grain = (vnoise(p.xz * 260.0 + p.y * 37.0) - 0.5) * uDetail;

  if (vTag == TAG_CAP) {
    vec3 local = vLocal;
    float h = p.y - PLATE_Y;
    // walls darken towards the plate, more so when the cap is down in the well
    ao = mix(0.32, 1.0, smoothstep(0.02, 0.34, h));
    ao *= mix(1.0, 0.9, uTravel);
    // a faint micro-texture breaks the CG smoothness of PBT
    vec3 nb = n + vec3(grain, 0.0, (vnoise(p.zx * 240.0) - 0.5) * uDetail) * 0.05;
    n = normalize(nb);
    vec3 albedo = uCapAlbedo * (0.985 + 0.03 * hash(vec2(float(uKey), 3.7)));
    // the legend, dye-sublimated into the top
    if (local.y > CAP_H - 0.07 && uKey >= 0) {
      vec2 uv = vec2(local.x / (CAP_TOPX * 1.7) + 0.5, (local.z - CAP_SHIFT) / (CAP_TOPZ * 1.7) + 0.5);
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        vec2 cell = vec2(float(uKey - (uKey / 3) * 3), float(uKey / 3));
        float ink = texture(uAtlas, (cell + uv) / 4.0).a;
        albedo = mix(albedo, uLegend, ink);
      }
    }
    color = shade(n, v, albedo, vec3(0.034), 0.46, 0.0, ao, 1.0);
    // glow from the plate climbs the lower walls
    vec2 outward = normalize(n.xz + 1e-4) * 0.06;
    vec3 g = plateGlow(p.xz + outward) * exp(-max(h, 0.0) / 0.1) * (0.55 - 0.45 * n.y);
    emit += g * mix(vec3(1.0), uCapAlbedo * 1.6 + 0.25, 0.6);
  } else if (vTag == TAG_PLATE) {
    float contact;
    float occ = capShadow(p.xz, p.y, contact);
    float sdPocket = -sdRoundBox(p.xz, vec2(POCKET_HALF), POCKET_R);
    float wallAo = mix(0.35, 1.0, smoothstep(0.0, 0.16, sdPocket));
    ao = contact * wallAo * 0.55;
    color = shade(n, v, uPlateAlbedo, uCaseF0 * 0.6, 0.5, 0.25, ao, occ * wallAo);
    emit += plateGlow(p.xz) * (0.55 + 0.45 * contact) * mix(0.7, 1.0, wallAo);
  } else if (vTag == TAG_KNOB_SIDE || vTag == TAG_KNOB_CHAMFER || vTag == TAG_KNOB_TOP || vTag == TAG_SHAFT) {
    mat3 rot = mat3(uModel);
    vec3 local = vLocal;
    float a = atan(local.z, local.x);
    float rough = 0.3;
    vec3 f0 = uKnobF0;
    if (vTag == TAG_KNOB_SIDE) {
      // a knurled band between two smooth rings
      float band = smoothstep(0.07, 0.1, local.y) * smoothstep(KNOB_H - 0.06, KNOB_H - 0.09, local.y);
      float phase = a * 54.0;
      float ridge = sin(phase) * clamp(1.5 - fwidth(phase) * 0.9, 0.0, 1.0);
      vec3 radial = vec3(cos(a), 0.0, sin(a));
      vec3 tangent = vec3(-sin(a), 0.0, cos(a));
      vec3 ln = normalize(radial + tangent * ridge * 0.55 * band);
      n = normalize(rot * ln);
      rough = mix(0.3, 0.42, band);
      ao = mix(0.55, 1.0, smoothstep(0.0, 0.12, local.y)) * mix(1.0, 0.86 + 0.14 * abs(ridge), band);
    } else if (vTag == TAG_KNOB_CHAMFER) {
      rough = 0.12;
      f0 = uEdgeF0;
    } else if (vTag == TAG_KNOB_TOP) {
      // concentric machining: faint rings (only where they resolve) and an
      // anisotropic sheen that throws the highlight into a radial streak
      float r = length(local.xz);
      vec3 radial = vec3(local.x, 0.0, local.z) / max(r, 1e-4);
      float phase = r * 190.0;
      float resolve = clamp(1.4 - fwidth(phase) * 1.2, 0.0, 1.0);
      float rings = sin(phase) * 0.035 * uDetail * resolve;
      n = normalize(rot * normalize(vec3(0.0, 1.0, 0.0) + radial * rings));
      rough = 0.32;
      vec3 tw = normalize(rot * vec3(-radial.z, 0.0, radial.x));
      vec3 bw = normalize(rot * radial);
      for (int i = 0; i < 3; i++) {
        vec3 ld = i == 0 ? normalize(uKeyDir) : i == 1 ? normalize(SOFTBOX_DIR) : normalize(FILL_DIR);
        vec3 lc = i == 0 ? uKeyColor * 0.5 : i == 1 ? uSoftbox * 0.12 : uSoftbox * 0.05;
        vec3 hh = normalize(ld + v);
        float nl = max(dot(n, ld), 0.0);
        emit += lc * f0 * ggxAniso(n, hh, tw, bw, 0.05, 0.42) * nl * 0.5;
      }
      // the indicator: a small lit dot near the edge
      vec2 dotPos = vec2(KNOB_R * 0.66, 0.0);
      float dd = length(local.xz - dotPos);
      // a small engraved well with the lit dot in it
      float well = smoothstep(0.047, 0.04, dd);
      float lamp = smoothstep(0.032, 0.025, dd);
      f0 = mix(f0, f0 * 0.12, well);
      rough = mix(rough, 0.6, well);
      emit += uKnobLight * uGlowGain * (lamp * 1.5 + exp(-dd / 0.02) * 0.2);
    } else {
      f0 = vec3(0.02);
      rough = 0.6;
      ao = 0.2;
    }
    color = shade(n, v, vec3(0.0), f0, rough, 1.0, ao, 1.0);
  } else {
    // the case
    vec3 albedo = uCaseAlbedo;
    vec3 f0 = uCaseF0;
    float rough = uCaseRough + grain * 0.12;
    float metal = uCaseMetal;
    if (vTag == TAG_CHAMFER || vTag == TAG_POCKET_CHAMFER) {
      f0 = uEdgeF0;
      rough = 0.1 + grain * 0.04;
      metal = 1.0;
      albedo = vec3(0.0);
    }
    if (vTag == TAG_TOP) {
      // knob shadow and contact ring
      float dk = length(p.xz - KNOB_C);
      vec3 l = normalize(uKeyDir);
      vec2 off = l.xz / l.y * (KNOB_H * 0.6);
      float ds = length(p.xz - KNOB_C + off);
      shadow *= mix(0.45, 1.0, smoothstep(KNOB_R - 0.06, KNOB_R + 0.14, ds));
      ao *= mix(0.4, 1.0, smoothstep(KNOB_R - 0.01, KNOB_R + 0.07, dk));
      // caps shadow the frame round the pocket
      float contact;
      shadow *= capShadow(p.xz, p.y, contact);
      // the engraving
      vec2 uv = (p.xz - ENGRAVING.xy) / (ENGRAVING.zw * 2.0) + 0.5;
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        float ink = texture(uAtlas, vec2(uv.x, 0.75 + uv.y * 0.25)).a;
        albedo = mix(albedo, uEngrave, ink);
        f0 = mix(f0, f0 * 0.3, ink);
        metal = mix(metal, 0.2, ink);
        rough = mix(rough, 0.75, ink);
      }
      // glow spills a touch onto the frame right at the pocket
      float sdPocket = sdRoundBox(p.xz, vec2(POCKET_HALF), POCKET_R);
      emit += plateGlow(p.xz * 0.96) * 0.05 * exp(-max(sdPocket, 0.0) / 0.03);
    } else if (vTag == TAG_POCKET_WALL) {
      float h = p.y - PLATE_Y;
      ao = mix(0.3, 0.75, smoothstep(0.0, CASE_H - PLATE_Y, h));
      shadow = 0.5;
      vec2 inward = -normalize(p.xz) * 0.0;
      inward = n.xz * 0.12;
      emit += plateGlow(p.xz + inward) * exp(-h / 0.12) * 0.8;
    } else if (vTag == TAG_POCKET_CHAMFER) {
      // the polished edge mirrors the light in the pocket
      emit += plateGlow(p.xz + n.xz * 0.16) * 0.4;
      float contact;
      shadow *= capShadow(p.xz, p.y, contact);
    } else if (vTag == TAG_WALL) {
      ao = mix(0.55, 1.0, smoothstep(0.0, 0.2, p.y));
    }
    color = shade(n, v, albedo, f0, clamp(rough, 0.05, 1.0), metal, ao, shadow);
  }

  color += emit;
  outColor = vec4(toSrgb(tonemap(color)), 1.0);
}
`;

/** Only the light sources: what blooms. Everything else renders black. */
const EMISSIVE = `
void main() {
  vec3 n = normalize(vNormal);
  vec3 p = vWorld;
  vec3 emit = vec3(0.0);
  if (vTag == TAG_PLATE) {
    emit = plateGlow(p.xz);
  } else if (vTag == TAG_CAP) {
    float h = p.y - PLATE_Y;
    emit = plateGlow(p.xz + normalize(n.xz + 1e-4) * 0.06) * exp(-max(h, 0.0) / 0.1) * (0.55 - 0.45 * n.y);
  } else if (vTag == TAG_POCKET_WALL) {
    float h = p.y - PLATE_Y;
    emit = plateGlow(p.xz + n.xz * 0.12) * exp(-h / 0.12) * 0.8;
  } else if (vTag == TAG_KNOB_TOP) {
    float dd = length(vLocal.xz - vec2(KNOB_R * 0.66, 0.0));
    emit = uKnobLight * uGlowGain * (smoothstep(0.032, 0.025, dd) * 1.5 + exp(-dd / 0.02) * 0.2);
  } else if (vTag == TAG_GROUND) {
    discard;
  }
  outColor = vec4(emit * 0.5, 1.0);
}
`;

export const FRAGMENT = `#version 300 es
${COMMON}
${LIGHTING}
${SURFACE}
`;

export const FRAGMENT_EMISSIVE = `#version 300 es
${COMMON}
${EMISSIVE}
`;

/** Separable Gaussian blur (9 linear taps ≈ 17 texels). */
export const BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSource;
uniform vec2 uStep;
void main() {
  const float w0 = 0.2270270270;
  const float w1 = 0.3162162162;
  const float w2 = 0.0702702703;
  const float o1 = 1.3846153846;
  const float o2 = 3.2307692308;
  vec3 c = texture(uSource, vUv).rgb * w0;
  c += texture(uSource, vUv + uStep * o1).rgb * w1;
  c += texture(uSource, vUv - uStep * o1).rgb * w1;
  c += texture(uSource, vUv + uStep * o2).rgb * w2;
  c += texture(uSource, vUv - uStep * o2).rgb * w2;
  outColor = vec4(c, 1.0);
}
`;

/** Adds the bloom (two radii) over the frame. */
export const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uNear;
uniform sampler2D uFar;
uniform float uStrength;
void main() {
  vec3 a = texture(uNear, vUv).rgb;
  vec3 b = texture(uFar, vUv).rgb;
  vec3 c = (a * 0.9 + b * 1.3) * uStrength;
  // encode roughly to display space so the bloom adds like light
  c = 1.0 - exp(-c * 2.0);
  outColor = vec4(c, 0.0);
}
`;
