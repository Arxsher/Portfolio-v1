// GLSL for liquid glass. Two full-screen passes (see renderer.ts):
//
//   SCENE  the backdrop the glass sits over, drawn into a small mipmapped
//          texture (at most 1.25 device px per CSS px): the tile's grey with
//          a soft lift, two colour fields (a disc and a tilted band with a
//          thin echo), a fine grid, the big "arsher" word (a mask texture
//          drawn with Canvas 2D) and the glass's own soft shadow with a
//          caustic under the droplet. The glass reads it through the mips.
//   GLASS  the screen. Outside the glass it draws the same backdrop again,
//          straight from sceneColor() at full resolution, so the poster is
//          crisp at any DPR without a full-size texture. Inside, the dock (a
//          rounded box) and the droplet (a squashable ellipse) are one
//          signed distance field joined by a smooth union, so they bridge
//          and merge like liquid. A thickness profile over that field (a
//          rounded bevel at the rim, flat beyond it) gives a surface normal
//          at every pixel; the backdrop texture is read through it with
//          refract() at six wavelengths (dispersion) and through the mip
//          chain (frost), then tinted and lit by a Fresnel reflection of a
//          soft sky, a key light, a bright rim and, on hover, the pointer.
//
//          The dock is frosted and its rim lenses in a thin sliver of what
//          lies just beyond it. The droplet is the clearest part: it skips
//          the frost, magnifies what is under its flat middle, bends it hard
//          at its rim and gathers a crescent of light on its far side.
//          Under each icon the dock calms its ground toward a plate tone
//          (light under ink icons, dark under white ones) so the icons read
//          over anything. The selected tab is a small lens inside the bar
//          with its own rim and highlight.
//
// Coordinates are CSS pixels from the top-left (y down) in both passes.

const COMMON = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 u_res;      // CSS px
uniform float u_dpr;     // device px per CSS px of the target being drawn
uniform vec4 u_dock;     // centre x, y, half width, half height
uniform float u_dockR;   // corner radius
uniform vec4 u_drop;     // centre x, y, radius, smooth-union k
uniform vec3 u_squash;   // stretch axis x, y, stretch (0 = round)

vec2 fragPos() {
  return vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Ellipse distance, the gradient-corrected approximation (good near the edge).
float sdEllipse(vec2 p, vec2 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  if (k1 < 1e-5) return -min(r.x, r.y);
  return k0 * (k0 - 1.0) / k1;
}

float sdDrop(vec2 p) {
  vec2 d = p - u_drop.xy;
  vec2 u = u_squash.xy;
  vec2 q = vec2(dot(d, u), dot(d, vec2(-u.y, u.x)));
  float s = 1.0 + u_squash.z;
  return sdEllipse(q, u_drop.z * vec2(s, 1.0 / s));
}

float sdDock(vec2 p) {
  return sdRoundBox(p - u_dock.xy, u_dock.zw, u_dockR);
}

// Polynomial smooth minimum; h is the weight of a (1 = all a).
float smin(float a, float b, float k, out float h) {
  h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// The glass: dock ∪ droplet. wDrop says how much of this point is droplet.
float glass(vec2 p, out float wDrop) {
  float h;
  float d = smin(sdDock(p), sdDrop(p), u_drop.w, h);
  wDrop = 1.0 - h;
  return d;
}

float glass(vec2 p) {
  float w;
  return glass(p, w);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

/** The backdrop as a function of position, shared by both passes. */
const SCENE_FN = /* glsl */ `
uniform sampler2D u_type;
uniform vec4 u_typeRect;   // x, y, w, h (CSS px) the word texture covers
uniform vec3 u_base;       // the tile
uniform vec3 u_baseHi;     // its lift in the middle
uniform vec3 u_ink;
uniform float u_inkAlpha;
uniform vec3 u_c1;         // disc, top
uniform vec3 u_c1b;        // disc, bottom
uniform vec3 u_c2;         // band, left
uniform vec3 u_c2b;        // band, right
uniform vec4 u_disc;       // x, y, r, -
uniform vec4 u_band;       // x, y, half w, half h
uniform vec4 u_band2;      // the thin echo: x, y, half w, half h (same angle)
uniform vec2 u_bandRot;    // cos, sin
uniform vec4 u_grid;       // pitch, alpha, origin x, origin y
uniform float u_lineW;     // grid half width (CSS px), the same in both passes
uniform vec4 u_fade;       // edge fade of fields + grid: inset x, inset y, softness, strength
uniform vec4 u_shadow;     // offset x, y, blur, opacity
uniform float u_caustic;

float lineAA(float dist, float halfWidth, float px) {
  return 1.0 - smoothstep(halfWidth - px * 0.5, halfWidth + px * 0.5, dist);
}

float gridLines(vec2 p, float pitch, float halfWidth, float px) {
  vec2 g = abs(fract(p / pitch + 0.5) - 0.5) * pitch;
  return max(lineAA(g.x, halfWidth, px), lineAA(g.y, halfWidth, px));
}

vec2 bandSpace(vec2 p, vec2 centre) {
  vec2 bp = p - centre;
  return vec2(u_bandRot.x * bp.x + u_bandRot.y * bp.y, -u_bandRot.y * bp.x + u_bandRot.x * bp.y);
}

// selfD: the glass's distance field at p. Under the glass itself its shadow
// and caustic are faint (light goes through it); they show where they fall
// beside it.
vec3 sceneColor(vec2 p, float px, float selfD) {
  // the tile, a touch lighter in the middle
  vec2 c = (p - u_res * 0.5) / max(u_res.y, 1.0);
  vec3 col = mix(u_baseHi, u_base, smoothstep(0.05, 0.85, length(c * vec2(0.8, 1.0))));

  // fields and grid fade out toward the edges (breathing room on tiles)
  vec2 e = min(p, u_res - p);
  float fade = smoothstep(0.0, u_fade.z, e.x - u_fade.x) * smoothstep(0.0, u_fade.z, e.y - u_fade.y);
  fade = mix(1.0, fade, u_fade.w);

  // colour field 1: a disc, lit from above
  float dDisc = length(p - u_disc.xy) - u_disc.z;
  float aDisc = smoothstep(px * 0.6, -px * 0.6, dDisc) * fade;
  float tDisc = clamp((p.y - (u_disc.y - u_disc.z)) / (2.0 * u_disc.z), 0.0, 1.0);
  col = mix(col, mix(u_c1, u_c1b, tDisc * tDisc), aDisc);

  // colour field 2: a tilted band with round ends, and a thin echo of it
  vec2 bp = bandSpace(p, u_band.xy);
  float aBand = smoothstep(px * 0.6, -px * 0.6, sdRoundBox(bp, u_band.zw, u_band.w)) * fade;
  float tBand = clamp(bp.x / (2.0 * u_band.z) + 0.5, 0.0, 1.0);
  col = mix(col, mix(u_c2, u_c2b, tBand), aBand);
  vec2 bq = bandSpace(p, u_band2.xy);
  float aEcho = smoothstep(px * 0.6, -px * 0.6, sdRoundBox(bq, u_band2.zw, u_band2.w)) * fade;
  float tEcho = clamp(bq.x / (2.0 * u_band2.z) + 0.5, 0.0, 1.0);
  col = mix(col, mix(u_c2, u_c2b, 0.35 + 0.65 * tEcho), aEcho);

  // fine grid, with a firmer line every fourth
  vec2 gp = p - u_grid.zw;
  float minor = gridLines(gp, u_grid.x, u_lineW, px);
  float major = gridLines(gp, u_grid.x * 4.0, u_lineW, px);
  float g = max(minor * u_grid.y, major * u_grid.y * 1.9) * fade;
  col = mix(col, u_ink, g);

  // the word
  vec2 tuv = (p - u_typeRect.xy) / u_typeRect.zw;
  if (tuv.x > 0.0 && tuv.y > 0.0 && tuv.x < 1.0 && tuv.y < 1.0) {
    float ta = texture(u_type, tuv).r;
    col = mix(col, u_ink, ta * u_inkAlpha);
  }

  // the glass's shadow: a wide soft drop plus a tight contact shade
  float ds = glass(p - u_shadow.xy);
  float drop = 1.0 - smoothstep(-u_shadow.z * 0.45, u_shadow.z, ds);
  float dc = glass(p - u_shadow.xy * 0.22);
  float contact = 1.0 - smoothstep(-1.0, u_shadow.z * 0.22, dc);
  float beside = smoothstep(-8.0, 2.0, selfD);
  col *= 1.0 - (drop * u_shadow.w + contact * u_shadow.w * 0.45) * mix(0.22, 1.0, beside);

  // light the droplet gathers into a bright spot inside its shadow
  vec2 cp = p - (u_drop.xy + u_shadow.xy * 1.15);
  float spot = exp(-dot(cp, cp) / pow(u_drop.z * 0.42, 2.0));
  col += spot * u_caustic * (1.0 - drop * 0.4) * mix(0.18, 1.0, beside);
  return col;
}
`;

export const VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const SCENE = /* glsl */ `${COMMON}
${SCENE_FN}
out vec4 outColor;

void main() {
  vec2 p = fragPos();
  outColor = vec4(sceneColor(p, 1.0 / u_dpr, glass(p)), 1.0);
}
`;

export const GLASS = /* glsl */ `${COMMON}
${SCENE_FN}
uniform sampler2D u_scene;
uniform float u_bevelDock;
uniform float u_bevelDrop;
uniform float u_refract;   // 0..1, the slider
uniform float u_frost;     // 0..1, the slider
uniform vec4 u_tint;       // rgb, strength
uniform vec4 u_pill;       // selection: x, y, half w, half h
uniform float u_pillAmt;
uniform vec4 u_hover;      // x, y, radius, strength
uniform vec4 u_ripples[4]; // x, y, age (s), amplitude
uniform vec3 u_pointer;    // x, y, strength (only while hovering near the glass)
uniform float u_dark;      // 0 light .. 1 dark
uniform float u_lod;       // mip levels available - 1
uniform vec4 u_icons;      // first icon x, row y, pitch, count
uniform vec4 u_plate;      // radius, strength, tone (0: ink icons, 1: white icons), -
uniform float u_grain;

out vec4 outColor;

// Cubic B-spline lookup of one mip level from four bilinear taps: the
// mips stay smooth when magnified (no blocky frost).
vec3 bicubicLevel(vec2 uv, float level) {
  vec2 size = vec2(textureSize(u_scene, int(level)));
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 s0 = w0 + w1;
  vec2 s1 = w2 + w3;
  vec2 t0 = (i - 0.5 + w1 / s0) / size;
  vec2 t1 = (i + 1.5 + w3 / s1) / size;
  return (textureLod(u_scene, vec2(t0.x, t0.y), level).rgb * s0.x +
          textureLod(u_scene, vec2(t1.x, t0.y), level).rgb * s1.x) * s0.y +
         (textureLod(u_scene, vec2(t0.x, t1.y), level).rgb * s0.x +
          textureLod(u_scene, vec2(t1.x, t1.y), level).rgb * s1.x) * s1.y;
}

// The backdrop through the glass. Clear glass reads the mips straight
// (trilinear); frosted glass uses the cubic filter, blended in over half a
// level so moving the slider never shows a step.
vec3 sceneTex(vec2 p, float lod) {
  vec2 uv = p / u_res;
  uv.y = 1.0 - uv.y;
  uv = clamp(uv, vec2(0.0005), vec2(0.9995));
  if (lod < 1.0) return textureLod(u_scene, uv, lod).rgb;
  float l0 = floor(lod);
  vec3 cubic = mix(bicubicLevel(uv, l0), bicubicLevel(uv, l0 + 1.0), lod - l0);
  if (lod < 1.5) return mix(textureLod(u_scene, uv, lod).rgb, cubic, (lod - 1.0) * 2.0);
  return cubic;
}

// a travelling ring on the surface; returns the tilt it adds
vec2 rippleTilt(vec2 p) {
  vec2 tilt = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 r = u_ripples[i];
    if (r.w <= 0.0) continue;
    vec2 d = p - r.xy;
    float dist = length(d);
    float front = r.z * 260.0;
    float x = dist - front;
    float env = exp(-x * x / 900.0) * exp(-r.z * 2.6) * r.w;
    tilt += (dist > 0.001 ? d / dist : vec2(0.0)) * cos(x * 0.16) * env;
  }
  return tilt;
}

float sdPill(vec2 q) {
  return sdRoundBox(q, u_pill.zw, min(u_pill.z, u_pill.w));
}

void main() {
  vec2 p = fragPos();
  float px = 1.0 / u_dpr;
  float grain = (hash12(gl_FragCoord.xy) - 0.5) * u_grain;

  float wDrop;
  float d = glass(p, wDrop);
  if (d > px) {
    outColor = vec4(sceneColor(p, px, d) + grain, 1.0);
    return;
  }

  // the field's slope: which way is "out" from here
  float e = 0.6;
  vec2 g = vec2(glass(p + vec2(e, 0.0)) - glass(p - vec2(e, 0.0)), glass(p + vec2(0.0, e)) - glass(p - vec2(0.0, e)));
  float glen = length(g);
  g = glen > 1e-5 ? g / glen : vec2(0.0);

  // thickness profile: a quarter-round bevel at the rim, flat beyond it
  float bevel = mix(u_bevelDock, u_bevelDrop, wDrop);
  float depth = max(-d, 0.0);
  float t = clamp(depth / bevel, 0.0, 1.0);
  float s = 1.0 - t;
  float height = sqrt(max(1.0 - s * s, 0.0));
  float slope = s / max(height, 0.09);
  float dock = 1.0 - wDrop;

  // the selected tab is a shallow lens of its own inside the bar
  vec2 pq = p - u_pill.xy;
  float dp = sdPill(pq);
  float pillOn = u_pillAmt * dock;
  float pillMask = smoothstep(px, -px, dp) * pillOn;
  vec2 pg = vec2(sdPill(pq + vec2(e, 0.0)) - sdPill(pq - vec2(e, 0.0)), sdPill(pq + vec2(0.0, e)) - sdPill(pq - vec2(0.0, e)));
  pg = length(pg) > 1e-5 ? normalize(pg) : vec2(0.0);
  float ps = 1.0 - clamp(-dp / max(u_pill.w * 0.5, 1.0), 0.0, 1.0);
  vec2 pillTilt = pg * (ps / max(sqrt(max(1.0 - ps * ps, 0.0)), 0.3)) * 0.2 * pillMask;

  float strength = mix(0.25, 1.35, u_refract);
  vec2 tilt = g * slope * strength + rippleTilt(p) * (1.0 - wDrop * 0.6) + pillTilt;
  vec3 n = normalize(vec3(tilt, 1.0));

  // refraction. The rim draws in what lies just beyond it; the dock keeps
  // that to a thin sliver, the droplet bends it further.
  float thick = bevel * (0.45 + 0.55 * height) * mix(0.5, 1.25, u_refract);
  thick = min(thick, bevel * mix(0.6, 1.3, wDrop));
  float maxShift = bevel * mix(0.75, 1.2, wDrop);
  // the droplet magnifies what lies under its flat middle a touch
  vec2 mag = -(p - u_drop.xy) * (0.07 + 0.11 * u_refract) * wDrop * height;
  // frost: the dock reads blurrier mips; the droplet stays clear unless frosted
  float lod = (u_frost * 4.4 + height * (0.45 + 1.4 * u_frost)) * (1.0 - 0.85 * wDrop) + (1.0 - height) * 0.35 * dock;
  lod = min(u_lod - 1.0, lod);

  float disp = 0.045 * (0.35 + u_refract);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float f = float(i) / 5.0;
    float eta = 1.0 / (1.5 + (f - 0.5) * disp * 2.0);
    vec3 r = refract(vec3(0.0, 0.0, -1.0), n, eta);
    vec2 shift = -r.xy / max(-r.z, 0.25) * thick;
    float sl = length(shift);
    if (sl > maxShift) shift *= maxShift / sl;
    vec3 smp = sceneTex(p + shift + mag, lod);
    vec3 w = i == 0 ? vec3(0.5, 0.0, 0.0)
           : i == 1 ? vec3(0.35, 0.15, 0.0)
           : i == 2 ? vec3(0.15, 0.35, 0.0)
           : i == 3 ? vec3(0.0, 0.35, 0.15)
           : i == 4 ? vec3(0.0, 0.15, 0.35)
           : vec3(0.0, 0.0, 0.5);
    col += smp * w;
  }

  // a little vibrancy: glass lifts saturation and light a touch
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, 1.12);
  col = mix(col * 1.06 + 0.035, col * 1.03 + 0.012, 1.0 - u_dark);

  // frost scatters light: the dock's body is milky, the droplet stays clear;
  // the dock's rim fades toward milk too, so the lensed sliver reads as a
  // refracting edge and not as a second copy of what is behind
  vec3 milk = mix(vec3(0.985), vec3(0.26), u_dark);
  col = mix(col, milk, (1.0 - height) * 0.35 * dock);
  float body = smoothstep(0.15, 1.0, height) * (0.16 + 0.7 * u_frost) * mix(1.0, 0.08, wDrop);
  col = mix(col, milk, body);

  // tint, deeper where the glass is thicker
  float tintAmt = u_tint.a * (0.55 + 0.45 * height);
  col = mix(col, col * u_tint.rgb * 1.08 + u_tint.rgb * 0.05, tintAmt);

  // vibrancy plate: under each icon the ground calms toward a plate tone
  // (light under ink icons, dark under white ones), so they always read
  float fi = clamp(floor((p.x - u_icons.x) / u_icons.z + 0.5), 0.0, u_icons.w - 1.0);
  vec2 ic = p - vec2(u_icons.x + fi * u_icons.z, u_icons.y);
  float dI = length(ic * vec2(1.0, 1.12));
  // (inside the bar's own outline, so it holds over the droplet when it merges in)
  float inBar = smoothstep(1.0, -4.0, sdDock(p));
  float plate = (1.0 - smoothstep(u_plate.x * 0.25, u_plate.x, dI)) * inBar * smoothstep(0.1, 0.7, height);
  vec3 plateCol = mix(vec3(0.985), vec3(0.13), u_plate.z);
  plateCol = mix(plateCol, plateCol * u_tint.rgb * 1.04 + u_tint.rgb * 0.03, u_tint.a * 0.5);
  col = mix(col, plateCol, plate * u_plate.y);

  // the selected tab: a lifted capsule with a hairline of light along its
  // top and a soft shade along its bottom. Under ink icons it is brighter
  // than the body; under white icons it only lifts dark ground, so it never
  // takes contrast from the icon it holds
  float pLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 pillInk = col * 1.04 + 0.04;
  vec3 pillWhite = col + 0.07 * (1.0 - smoothstep(0.12, 0.42, pLuma));
  col = mix(col, mix(pillInk, pillWhite, u_plate.z), pillMask);
  float pIn = -dp;
  float pRim = smoothstep(px * 0.2, px * 1.2, pIn) * (1.0 - smoothstep(px * 1.2, px * 2.6 + 0.4, pIn)) * pillOn;
  float pUp = clamp(-pq.y / max(u_pill.w, 1.0), -1.0, 1.0);
  col += pRim * max(pUp, 0.0) * mix(0.16, 0.12, u_dark);
  col *= 1.0 - pRim * max(-pUp, 0.0) * mix(0.1, 0.22, u_dark);

  // hover: light pools under the icon
  vec2 hq = p - u_hover.xy;
  col += exp(-dot(hq, hq) / (u_hover.z * u_hover.z)) * u_hover.w * mix(0.085, 0.07, u_dark);

  // reflection of a soft sky (Fresnel), brighter for faces turned up; the
  // droplet keeps more of what is behind it
  vec3 V = vec3(0.0, 0.0, 1.0);
  float fres = (0.04 + 0.96 * pow(1.0 - clamp(n.z, 0.0, 1.0), 5.0)) * mix(1.6, 1.0, wDrop);
  fres = min(fres, mix(1.0, 0.5, wDrop));
  vec3 R = reflect(-V, n);
  float up = clamp(0.5 - 0.5 * R.y, 0.0, 1.0);
  vec3 sky = mix(mix(vec3(0.46), vec3(1.0), up), mix(vec3(0.16), vec3(0.78), up), u_dark);
  col = mix(col, sky, fres * mix(1.0, 0.85, u_dark));

  // key light from the upper left
  vec3 L = normalize(vec3(-0.42, -0.72, 0.62));
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 70.0);
  col += spec * mix(0.9, 0.75, u_dark);
  // the pointer, a second small light while hovering: it glints on the
  // curved rims and only washes the flat faces
  if (u_pointer.z > 0.001) {
    vec3 Lp = normalize(vec3(u_pointer.xy - p, 150.0));
    float specP = pow(max(dot(n, normalize(Lp + V)), 0.0), 120.0) * u_pointer.z;
    col += specP * 0.5 * (1.0 - 0.85 * height);
  }

  // bright rim: strong on the lit edge, a fainter echo on the far edge
  float rim = 1.0 - smoothstep(0.0, px * 1.5 + 0.75, depth);
  float facing = dot(g, normalize(vec2(-0.55, -0.84)));
  float rimLight = rim * (0.22 + 0.78 * max(facing, 0.0) + 0.5 * max(-facing, 0.0));
  col += rimLight * mix(0.55, 0.42, u_dark);
  // the droplet focuses light into a soft crescent inside its far edge
  float crescent = wDrop * pow(1.0 - height, 1.6) * max(-facing, 0.0) * smoothstep(px, px * 4.0, depth);
  col += crescent * mix(0.2, 0.14, u_dark);
  // a hairline just inside the rim, so the edge reads on light grounds
  float inner = smoothstep(px * 0.5, px * 1.5, depth) * (1.0 - smoothstep(px * 1.5, px * 3.5 + 1.0, depth));
  col = mix(col, col * mix(0.9, 0.82, u_dark), inner * 0.5 * (1.0 - max(facing, 0.0)));

  float cover = smoothstep(px * 0.5, -px * 0.5, d);
  if (cover < 1.0) col = mix(sceneColor(p, px, d), col, cover);
  outColor = vec4(col + grain, 1.0);
}
`;
