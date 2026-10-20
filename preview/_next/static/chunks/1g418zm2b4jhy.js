(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95709,e=>{"use strict";var t=e.i(43476),i=e.i(71645),r=e.i(33209),a=e.i(37047),o=e.i(45219),s=e.i(55171);let l=`#version 300 es
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
`,n=`
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
`,h=`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,c=`${l}
${n}
out vec4 outColor;

void main() {
  vec2 p = fragPos();
  outColor = vec4(sceneColor(p, 1.0 / u_dpr, glass(p)), 1.0);
}
`,d=`${l}
${n}
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
`;class u{gl;scene;glass;us;ug;vao;fbo;target;type;tw=0;th=0;levels=1;constructor(e){this.gl=e,this.scene=(0,s.createProgram)(e,h,c),this.glass=(0,s.createProgram)(e,h,d),this.us=(0,s.uniformLocations)(e,this.scene),this.ug=(0,s.uniformLocations)(e,this.glass);const t=e.createVertexArray(),i=e.createFramebuffer(),r=e.createTexture(),a=e.createTexture();if(!t||!i||!r||!a)throw Error("liquid-glass: could not allocate GL objects");this.vao=t,this.fbo=i,this.target=r,this.type=a,e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.R8,1,1,0,e.RED,e.UNSIGNED_BYTE,new Uint8Array([0]))}setType(e){let t=this.gl;t.bindTexture(t.TEXTURE_2D,this.type),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.R8,t.RED,t.UNSIGNED_BYTE,e)}ensureTarget(e,t){if(e===this.tw&&t===this.th)return;let i=this.gl;this.tw=e,this.th=t,this.levels=Math.floor(Math.log2(Math.max(e,t)))+1,i.bindTexture(i.TEXTURE_2D,this.target),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,e,t,0,i.RGBA,i.UNSIGNED_BYTE,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR_MIPMAP_LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.generateMipmap(i.TEXTURE_2D),i.bindFramebuffer(i.FRAMEBUFFER,this.fbo),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,this.target,0),i.bindFramebuffer(i.FRAMEBUFFER,null)}sceneUniforms(e,t,i){let r=this.gl;r.uniform2f(e("u_res"),t.width,t.height),r.uniform1f(e("u_dpr"),i),r.uniform4fv(e("u_dock"),t.dock),r.uniform1f(e("u_dockR"),t.dockR),r.uniform4fv(e("u_drop"),t.drop),r.uniform3fv(e("u_squash"),t.squash),r.uniform1i(e("u_type"),1),r.uniform4fv(e("u_typeRect"),t.typeRect),r.uniform3fv(e("u_base"),t.base),r.uniform3fv(e("u_baseHi"),t.baseHi),r.uniform3fv(e("u_ink"),t.ink),r.uniform1f(e("u_inkAlpha"),t.inkAlpha),r.uniform3fv(e("u_c1"),t.c1),r.uniform3fv(e("u_c1b"),t.c1b),r.uniform3fv(e("u_c2"),t.c2),r.uniform3fv(e("u_c2b"),t.c2b),r.uniform4fv(e("u_disc"),t.disc),r.uniform4fv(e("u_band"),t.band),r.uniform4fv(e("u_band2"),t.band2),r.uniform2f(e("u_bandRot"),Math.cos(t.bandAngle),Math.sin(t.bandAngle)),r.uniform4fv(e("u_grid"),t.grid),r.uniform1f(e("u_lineW"),.5*Math.max(1/Math.max(t.dpr,1),.5)),r.uniform4fv(e("u_fade"),t.fade),r.uniform4fv(e("u_shadow"),t.shadow),r.uniform1f(e("u_caustic"),t.caustic)}draw(e){let t=this.gl,i=t.canvas,r=i.width,a=i.height;if(r<2||a<2||e.width<1||e.height<1)return;let o=Math.min(e.dpr,1.25),s=e.width*e.height*o*o;s>25e5&&(o*=Math.sqrt(25e5/s));let l=Math.max(2,Math.round(e.width*o)),n=Math.max(2,Math.round(e.height*o));this.ensureTarget(l,n),t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.bindVertexArray(this.vao),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.type),t.bindFramebuffer(t.FRAMEBUFFER,this.fbo),t.viewport(0,0,l,n),t.useProgram(this.scene),this.sceneUniforms(this.us,e,l/e.width),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,null),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.target),t.generateMipmap(t.TEXTURE_2D),t.viewport(0,0,r,a),t.useProgram(this.glass);let h=this.ug;this.sceneUniforms(h,e,r/e.width),t.uniform1i(h("u_scene"),0),t.uniform1f(h("u_bevelDock"),e.bevelDock),t.uniform1f(h("u_bevelDrop"),e.bevelDrop),t.uniform1f(h("u_refract"),e.refract),t.uniform1f(h("u_frost"),e.frost),t.uniform4fv(h("u_tint"),e.tint),t.uniform4fv(h("u_pill"),e.pill),t.uniform1f(h("u_pillAmt"),e.pillAmt),t.uniform4fv(h("u_hover"),e.hover),t.uniform4fv(h("u_ripples"),e.ripples),t.uniform3fv(h("u_pointer"),e.pointer),t.uniform1f(h("u_dark"),e.dark),t.uniform1f(h("u_lod"),this.levels-1),t.uniform4fv(h("u_icons"),e.icons),t.uniform4fv(h("u_plate"),e.plate),t.uniform1f(h("u_grain"),e.grain),t.drawArrays(t.TRIANGLES,0,3),t.bindVertexArray(null)}dispose(){let e=this.gl;e.deleteProgram(this.scene),e.deleteProgram(this.glass),e.deleteVertexArray(this.vao),e.deleteFramebuffer(this.fbo),e.deleteTexture(this.target),e.deleteTexture(this.type)}}function p(e,t,i,r,a){let o=Math.cos(e.angle),s=Math.sin(e.angle);return{x:e.x+o*t-s*i,y:e.y+s*t+o*i,hw:e.hw*r,hh:a,angle:e.angle}}function f(e,t,i,r){let a,o,s,l,n,h,c,d,u,f,g,m,x="tile"===i,v=!x&&e<560,b=e/2;if(x)a=Math.round(.2*e),o=Math.round(.148*e),s=Math.round(.03*e),l=.6*t,n=.074*e,h=Math.round(.068*e),c=.245*e,d=e>190?10:9,u=.5;else if(v){a=58,o=Math.min(52,Math.floor((e-56)/r)),s=8;let i=1.35*e*.03;l=Math.max(84+a,Math.min(.56*t,t-96-(.25*e*.19866933079506122+.06*e*.9800665778412416+i)-.17*t)),n=27,h=21,c=Math.min(.272*e,.27*t,(e-48-2.8*i)/2.75),d=14,u=.44}else a=78,o=70,s=11,l=.585*t,n=39,h=24,c=Math.min(.2*e,.46*t,270),d=16,u=.5;let y=r*o/2+s,w=a/2,_=b-y+s,k=Array.from({length:r},(e,t)=>({x:_+o*(t+.5),y:l})),T=x?e:v?1.35*e:Math.min(e,2.1*t);if(x)f={x:b+.2*e,y:l-.33*t,r:.17*e},m=p(g={x:b-.16*e,y:l+.15*t,hw:.2*e,hh:.052*e,angle:-.21},.05*e,2.4*g.hh,.62,.011*e);else if(v){let i=.17*e;f={x:b+.2*e,y:Math.max(l-.2*t,84+i),r:i},m={x:-1e4,y:-1e4,hw:0,hh:0,angle:(g={x:b-.15*e,y:l+.17*t,hw:.25*e,hh:.06*e,angle:-.2}).angle}}else{let e=Math.min(.16*t,1.3*a);f={x:b+.8*y,y:Math.max(l-1.6*a,50.4+e),r:e},m=p(g={x:b-.22*T,y:l+.03*t,hw:.17*T,hh:.05*t,angle:-.2},-(.035*T),2.5*g.hh,.62,4.5)}return{width:e,height:t,compact:v,count:r,dock:{cx:b,cy:l,hw:y,hh:w,r:.44*a},pitch:o,padX:s,icons:k,iconSize:h,dropR:n,k:1.05*n,bevelDock:a*(x||v?.22:.3),bevelDrop:.6*n,fontPx:c,word:{cx:b,baseline:l-w+.53*c*u},disc:f,band:g,band2:m,grid:d,fade:x?[6,6,.16*e,1]:v?[0,0,56,.85]:[0,0,90,.85],shadow:x?{x:0,y:4.5,blur:10}:v?{x:0,y:9,blur:20}:{x:0,y:12,blur:26},path:x?{ax:.8*y,up:1.6*a,down:1.25*a,period:10}:v?{ax:.8*y,up:1.85*a,down:1.05*a,period:12}:{ax:.8*y,up:1.95*a,down:1.15*a,period:12},rest:{x:b+.88*y+.25*n,y:l-w-.55*n},drift:.03*T}}let g=e=>{let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(255&t)/255]},m=(e,t,i)=>.2126*e+.7152*t+.0722*i,x=(e,t)=>{let i=m(e[0],e[1],e[2]);return[(0,a.lerp)(e[0],i,t),(0,a.lerp)(e[1],i,t),(0,a.lerp)(e[2],i,t)]},v={base:g("#f2f2f2"),baseHi:g("#f6f6f6"),ink:g("#161616"),inkAlpha:1,c1:x(g("#ff8443"),.1),c1b:x(g("#f24a1d"),.1),c2:x(g("#2a55f5"),.1),c2b:x(g("#6a8bff"),.1),gridAlpha:.062,shadow:.13,caustic:.2},b={base:g("#232323"),baseHi:g("#292929"),ink:g("#ededed"),inkAlpha:.95,c1:g("#ff8048"),c1b:g("#dc4119"),c2:g("#3a5fff"),c2b:g("#7e98ff"),gridAlpha:.06,shadow:.42,caustic:.1};function y(e,t,i,r){e[0]=(0,a.lerp)(t[0],i[0],r),e[1]=(0,a.lerp)(t[1],i[1],r),e[2]=(0,a.lerp)(t[2],i[2],r)}let w=[{id:"clear",label:"Clear",rgb:[1,1,1],amount:0,swatch:"linear-gradient(135deg, #ffffff 0%, #eef1f4 55%, #dfe4ea 100%)"},{id:"smoke",label:"Smoke",rgb:[.5,.52,.56],amount:.5,swatch:"linear-gradient(135deg, #b9bdc4 0%, #8a8f97 60%, #6f747c 100%)"},{id:"amber",label:"Amber",rgb:[1,.72,.36],amount:.48,swatch:"linear-gradient(135deg, #ffe0a8 0%, #f7b45a 60%, #e39431 100%)"},{id:"sea",label:"Sea glass",rgb:[.46,.84,.8],amount:.46,swatch:"linear-gradient(135deg, #cdf3ec 0%, #86d6cb 60%, #5fbdb2 100%)"},{id:"rose",label:"Rose",rgb:[1,.62,.7],amount:.42,swatch:"linear-gradient(135deg, #ffd9e0 0%, #f7a2b3 60%, #e77e95 100%)"}];function _(e){for(let t=0;t<w.length;t++)if(w[t].id===e)return w[t];return w[0]}class k{mode;layout=null;word=null;dx=new a.Spring(0,{stiffness:150,damping:16});dy=new a.Spring(0,{stiffness:150,damping:16});qx=new a.Spring(0,{stiffness:230,damping:8.5});qy=new a.Spring(0,{stiffness:230,damping:8.5});driver="path";target={x:0,y:0};grab={x:0,y:0};placed=!1;merged=!1;pathTime=0;count;selected=0;pill=new a.Spring(0,{stiffness:340,damping:26});pillVelocity=0;hoverIndex=-1;hover;press;glowX=new a.Spring(0,{stiffness:420,damping:34});glow=new a.Spring(0,{stiffness:260,damping:26});pointerLight=new a.Spring(0,{stiffness:120,damping:20});pointer={x:0,y:0,inside:!1};ripples=Array.from({length:4},()=>({x:0,y:0,age:0,amp:0}));dark=0;refraction=.6;frost=.18;tint=new Float32Array([1,1,1,0]);backdropTime=0;tone=0;toneTarget=0;toneReady=!1;lastDt=1/60;out=(function(){let e=()=>new Float32Array(3),t=()=>new Float32Array(4);return{width:0,height:0,dpr:1,dock:t(),dockR:0,drop:t(),squash:e(),bevelDock:1,bevelDrop:1,typeRect:t(),base:e(),baseHi:e(),ink:e(),inkAlpha:1,c1:e(),c1b:e(),c2:e(),c2b:e(),disc:t(),band:t(),band2:t(),bandAngle:0,grid:t(),fade:t(),shadow:t(),caustic:0,grain:0,refract:0,frost:0,tint:t(),pill:t(),pillAmt:1,hover:t(),ripples:new Float32Array(16),pointer:e(),dark:0,icons:t(),plate:t()}})();contactPoint={x:0,y:0};constructor(e,t){this.mode=e,this.count=t,this.hover=Array.from({length:t},()=>new a.Spring(0,{stiffness:320,damping:24})),this.press=Array.from({length:t},()=>new a.Spring(0,{stiffness:520,damping:15}))}resize(e,t){let i=this.layout;if(i&&i.width===e&&i.height===t)return!1;let r=f(e,t,this.mode,this.count);if(i&&this.placed){let a=e/i.width,o=t/i.height;this.dx.set(this.dx.value*a),this.dy.set(this.dy.value*o),this.target.x*=a,this.target.y*=o,this.pill.set(r.icons[this.selected]?.x??r.dock.cx)}return this.layout=r,!0}pathInto(e,t){let i=this.layout,r=2*Math.PI/i.path.period,a=Math.sin(2*r*e);t.x=i.dock.cx+i.path.ax*Math.sin(r*e),t.y=i.dock.cy-a*(a>0?i.path.up:i.path.down)}setTarget(e,t){this.target.x=e,this.target.y=t}gap(e=this.dx.value,t=this.dy.value){let i=this.layout;return i?this.dockDistance(e,t)-i.dropR:1/0}dockDistance(e,t){let i=this.layout;if(!i)return 1/0;let{cx:r,cy:a,hw:o,hh:s,r:l}=i.dock,n=Math.abs(e-r)-o+l,h=Math.abs(t-a)-s+l;return Math.hypot(Math.max(n,0),Math.max(h,0))+Math.min(Math.max(n,h),0)-l}glassDistance(e,t){let i=this.layout;return i?Math.min(this.dockDistance(e,t),Math.hypot(e-this.dx.value,t-this.dy.value)-i.dropR):1/0}contact(){let{cx:e,cy:t,hw:i,hh:r}=this.layout.dock;return this.contactPoint.x=(0,a.clamp)(this.dx.value,e-i,e+i),this.contactPoint.y=(0,a.clamp)(this.dy.value,t-r,t+r),this.contactPoint}hitDroplet(e,t,i=1.25){let r=this.layout;return!!r&&Math.hypot(e-this.dx.value,t-this.dy.value)<r.dropR*i}beginDrag(e,t,i){i?(this.grab.x=e-this.dx.value,this.grab.y=t-this.dy.value):(this.grab.x=0,this.grab.y=0),this.driver="drag",this.dragTo(e,t)}dragTo(e,t){let i=this.clampTarget(e-this.grab.x,t-this.grab.y);this.setTarget(i.x,i.y)}endDrag(){"drag"===this.driver&&(this.driver="rest")}addRipple(e,t,i){let r=this.ripples[0];for(let e of this.ripples){if(e.amp<=0){r=e;break}e.age>r.age&&(r=e)}r.x=e,r.y=t,r.age=0,r.amp=i}get rippling(){for(let e of this.ripples)if(e.amp>0)return!0;return!1}select(e,t=!0){let i=this.layout;this.selected=(0,a.clamp)(e,0,this.count-1),i&&(this.pill.to(i.icons[this.selected].x),this.press[this.selected].impulse(-4.2),t&&this.addRipple(i.icons[this.selected].x,i.dock.cy,.22))}toggleMerge(){let e=this.layout;if(!e)return;let{cx:t,cy:i,hw:r,hh:o}=e.dock;this.driver="keys",this.gap(this.target.x,this.target.y)<.5*e.k?this.setTarget((0,a.clamp)(this.target.x,t-.7*r,t+.7*r),i-o-2.1*e.dropR):this.setTarget((0,a.clamp)(this.target.x,t-r+e.dropR,t+r-e.dropR),i)}nudge(e,t){if(!this.layout)return;"keys"!==this.driver&&this.setTarget(this.dx.value,this.dy.value),this.driver="keys";let i=this.clampTarget(this.target.x+e,this.target.y+t);this.setTarget(i.x,i.y)}clamped={x:0,y:0};clampTarget(e,t){let i=this.layout,r=.9*i.dropR;return this.clamped.x=(0,a.clamp)(e,r,i.width-r),this.clamped.y=(0,a.clamp)(t,r,i.height-r),this.clamped}get busy(){if(Math.hypot(this.dx.value-this.target.x,this.dy.value-this.target.y)>.05||!this.dx.settled||!this.dy.settled||!this.qx.settled||!this.qy.settled||!this.pill.settled||!this.glow.settled||!this.glowX.settled||!this.pointerLight.settled||this.rippling||Math.abs(this.tone-this.toneTarget)>.002)return!0;for(let e=0;e<this.count;e++)if(!this.hover[e].settled||!this.press[e].settled)return!0;return!1}step(e,t,i={}){let r=this.layout;if(!r)return;let o=!t.reducedMotion;if(!this.placed){o?this.pathInto(0,this.target):this.setTarget(r.rest.x,r.rest.y),this.dx.set(this.target.x),this.dy.set(this.target.y),this.pill.set(r.icons[this.selected].x),this.glowX.set(r.icons[0].x),this.merged=this.gap()<.5*r.k,this.placed=!0,this.dark=+!!t.dark,this.refraction=t.refraction,this.frost=t.frost;let e=_(t.tint);this.tint[0]=e.rgb[0],this.tint[1]=e.rgb[1],this.tint[2]=e.rgb[2],this.tint[3]=e.amount}o&&(this.backdropTime+=e),this.lastDt=o?e:1,"path"===this.driver&&(o?(this.pathTime+=e,this.pathInto(this.pathTime,this.target)):this.setTarget(r.rest.x,r.rest.y)),o?(this.dx.to(this.target.x),this.dy.to(this.target.y),this.dx.step(e),this.dy.step(e)):(this.dx.set((0,a.damp)(this.dx.value,this.target.x,18,e)),this.dy.set((0,a.damp)(this.dy.value,this.target.y,18,e)),.05>Math.hypot(this.dx.value-this.target.x,this.dy.value-this.target.y)&&(this.dx.set(this.target.x),this.dy.set(this.target.y)));let s="tile"===this.mode?.0016:48e-5,l=this.dx.velocity*s,n=this.dy.velocity*s,h=Math.hypot(l,n);h>.27&&(l*=.27/h,n*=.27/h),o?(this.qx.to(l),this.qy.to(n),this.qx.step(e),this.qy.step(e)):(this.qx.set(0),this.qy.set(0));let c=this.gap(),d=this.merged;if(!d&&c<.45*r.k?this.merged=!0:d&&c>.55*r.k&&(this.merged=!1),d!==this.merged){let e=this.contact();if(o){this.addRipple(e.x,e.y,this.merged?.3:.22);let t=this.dx.value-e.x,i=this.dy.value-e.y,r=Math.hypot(t,i)||1,a=this.merged?-1.6:2.2;this.qx.impulse(t/r*a),this.qy.impulse(i/r*a)}i.onMerge?.(this.merged,e.x,e.y)}let u=this.pill.value;o?this.pill.step(e):this.pill.set(this.pill.target),this.pillVelocity=e>0?(this.pill.value-u)/e:0;for(let t=0;t<this.count;t++)this.hover[t].to(+(t===this.hoverIndex)),o?(this.hover[t].step(e),this.press[t].step(e)):(this.hover[t].set(this.hover[t].target),this.press[t].set(0));for(let t of(this.hoverIndex>=0&&this.glowX.to(r.icons[this.hoverIndex].x),this.glow.to(+(this.hoverIndex>=0)),this.glowX.step(e),this.glow.step(e),this.ripples))!(t.amp<=0)&&(t.age+=e,t.age>=1.8&&(t.amp=0));let p=this.pointer,f="stage"===this.mode&&p.inside&&"drag"!==this.driver&&this.glassDistance(p.x,p.y)<1.4*r.dock.hh;this.pointerLight.to(+!!f),o?this.pointerLight.step(e):this.pointerLight.set(this.pointerLight.target);let g=+!!t.dark;this.dark=o?(0,a.damp)(this.dark,g,7,e):g,.002>Math.abs(this.dark-g)&&(this.dark=g),this.refraction=(0,a.damp)(this.refraction,t.refraction,14,e),this.frost=(0,a.damp)(this.frost,t.frost,14,e);let m=_(t.tint);this.tint[0]=(0,a.damp)(this.tint[0],m.rgb[0],9,e),this.tint[1]=(0,a.damp)(this.tint[1],m.rgb[1],9,e),this.tint[2]=(0,a.damp)(this.tint[2],m.rgb[2],9,e),this.tint[3]=(0,a.damp)(this.tint[3],m.amount,9,e)}easing(e){let t=_(e.tint);return Math.abs(this.dark-!!e.dark)>.002||Math.abs(this.refraction-e.refraction)>.002||Math.abs(this.frost-e.frost)>.002||Math.abs(this.tint[3]-t.amount)>.002||Math.abs(this.tint[0]-t.rgb[0])>.002||Math.abs(this.tint[1]-t.rgb[1])>.002||Math.abs(this.tint[2]-t.rgb[2])>.002}updateTone(e){let t=this.layout;if(!t)return;let i=m(e.base[0],e.base[1],e.base[2]),r=m(e.ink[0],e.ink[1],e.ink[2]),o=m(e.c1[0],e.c1[1],e.c1[2]),s=m(e.c2[0],e.c2[1],e.c2[2]),l=(0,a.lerp)(.985,.26,this.dark),n=.16+.7*this.frost,h=Math.cos(e.bandAngle),c=Math.sin(e.bandAngle),d=this.word,u=e.typeRect,p=e.disc,f=.9*t.iconSize,g=0,x=0;for(let l=0;l<this.count;l++){let n=t.icons[l];for(let t=-1;t<=1;t++)for(let l=-1;l<=1;l++){let m=n.x+l*f*.7,v=n.y+t*f*.7,b=i;Math.hypot(m-p[0],v-p[1])<p[2]&&(b=o);for(let t=0;t<2;t++){let i=0===t?e.band:e.band2,r=m-i[0],a=v-i[1],o=Math.abs(h*r+c*a),l=Math.abs(-c*r+h*a);o<i[2]+.4*i[3]&&l<i[3]&&(b=s)}if(d?.coverage&&u[2]>0){let t=Math.floor((m-u[0])/u[2]*d.pw),i=Math.floor((v-u[1])/u[3]*d.ph);t>=0&&i>=0&&t<d.pw&&i<d.ph&&(b=(0,a.lerp)(b,r,d.coverage[i*d.pw+t]/255*e.inkAlpha))}g+=b,x++}}let v=m(this.tint[0],this.tint[1],this.tint[2]),b=(0,a.lerp)(g/x,l,n);b=(0,a.lerp)(b,b*v*1.08+.05*v,.8*this.tint[3]);let y=this.toneTarget>.5?b<.56:b<.46;this.toneTarget=+!!y;let w=1-Math.exp(-9*this.lastDt);this.tone=this.toneReady?(0,a.lerp)(this.tone,this.toneTarget,w):this.toneTarget,.002>Math.abs(this.tone-this.toneTarget)&&(this.tone=this.toneTarget),this.toneReady=!0}iconScale(e){return 1+.13*this.hover[e].value+.9*this.press[e].value}iconLift(e){return -1.5*this.hover[e].value}frame(e){let t=this.layout;if(!t)return null;let i=this.out,r=this.dark;i.width=t.width,i.height=t.height,i.dpr=e,y(i.base,v.base,b.base,r),y(i.baseHi,v.baseHi,b.baseHi,r),y(i.ink,v.ink,b.ink,r),i.inkAlpha=(0,a.lerp)(v.inkAlpha,b.inkAlpha,r),y(i.c1,v.c1,b.c1,r),y(i.c1b,v.c1b,b.c1b,r),y(i.c2,v.c2,b.c2,r),y(i.c2b,v.c2b,b.c2b,r);let o=this.backdropTime,s=t.drift,l=t.word.cx+Math.sin(.11*o)*s*1.4;i.disc[0]=t.disc.x+Math.cos(.13*o)*s,i.disc[1]=t.disc.y+Math.sin(.17*o)*s*.9,i.disc[2]=t.disc.r*(1+.025*Math.sin(.21*o)),i.disc[3]=0;let n=Math.sin(.09*o+1.1)*s*1.1,h=Math.cos(.12*o)*s*.7;i.band[0]=t.band.x+n,i.band[1]=t.band.y+h,i.band[2]=t.band.hw,i.band[3]=t.band.hh,i.band2[0]=t.band2.x+1.25*n,i.band2[1]=t.band2.y+1.25*h,i.band2[2]=t.band2.hw,i.band2[3]=t.band2.hh,i.bandAngle=t.band.angle+.05*Math.sin(.08*o);let c=this.word;c?(i.typeRect[0]=l-c.inkWidth/2-c.inkLeft,i.typeRect[1]=t.word.baseline-c.baseline,i.typeRect[2]=c.width,i.typeRect[3]=c.height):i.typeRect.fill(0),i.grid[0]=t.grid,i.grid[1]=(0,a.lerp)(v.gridAlpha,b.gridAlpha,r),i.grid[2]=t.width/2,i.grid[3]=t.height/2,i.fade.set(t.fade),i.shadow[0]=t.shadow.x,i.shadow[1]=t.shadow.y,i.shadow[2]=t.shadow.blur,i.shadow[3]=(0,a.lerp)(v.shadow,b.shadow,r),i.caustic=(0,a.lerp)(v.caustic,b.caustic,r),i.grain=1.4/255,i.dock[0]=t.dock.cx,i.dock[1]=t.dock.cy,i.dock[2]=t.dock.hw,i.dock[3]=t.dock.hh,i.dockR=t.dock.r,i.drop[0]=this.dx.value,i.drop[1]=this.dy.value,i.drop[2]=t.dropR,i.drop[3]=t.k;let d=this.qx.value,u=this.qy.value,p=Math.hypot(d,u);p>1e-4?(i.squash[0]=d/p,i.squash[1]=u/p,i.squash[2]=p):(i.squash[0]=1,i.squash[1]=0,i.squash[2]=0),i.bevelDock=t.bevelDock,i.bevelDrop=t.bevelDrop,i.refract=this.refraction,i.frost=this.frost,i.tint.set(this.tint),i.dark=r;let f=Math.abs(this.pillVelocity),g="tile"===this.mode;i.pill[0]=this.pill.value,i.pill[1]=t.dock.cy,i.pill[2]=.5*t.pitch-(g||t.compact?1.5:2)+Math.min(.016*f,.32*t.pitch),i.pill[3]=t.dock.hh*(g?.56:.62)-Math.min(.0035*f,.12*t.dock.hh),i.pillAmt=1,i.hover[0]=this.glowX.value,i.hover[1]=t.dock.cy,i.hover[2]=.62*t.pitch,i.hover[3]=this.glow.value;let m=i.ripples;for(let e=0;e<4;e++){let t=this.ripples[e];m[4*e]=t.x,m[4*e+1]=t.y,m[4*e+2]=t.age,m[4*e+3]=t.amp}return i.pointer[0]=this.pointer.x,i.pointer[1]=this.pointer.y,i.pointer[2]=this.pointerLight.value,this.updateTone(i),i.icons[0]=t.icons[0].x,i.icons[1]=t.dock.cy,i.icons[2]=t.pitch,i.icons[3]=t.count,i.plate[0]=.45*t.pitch,i.plate[1]=(0,a.lerp)(.36,.44,r),i.plate[2]=this.tone,i.plate[3]=0,i}}let T=[{id:"home",label:"Home"},{id:"search",label:"Search"},{id:"spark",label:"Spark"},{id:"saved",label:"Saved"},{id:"profile",label:"Profile"}],M=T.filter(e=>"saved"!==e.id);function R({size:e,children:i}){return(0,t.jsx)("svg",{width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",className:"block",children:i})}function E({id:e,size:i,filled:r}){let a=r?"currentColor":"none";switch(e){case"home":return(0,t.jsx)(R,{size:i,children:(0,t.jsx)("path",{d:"M4.25 10.4 12 4.2l7.75 6.2v8.1a1.5 1.5 0 0 1-1.5 1.5h-3.6v-5.1a.8.8 0 0 0-.8-.8h-3.7a.8.8 0 0 0-.8.8v5.1h-3.6a1.5 1.5 0 0 1-1.5-1.5z",fill:a})});case"search":return(0,t.jsxs)(R,{size:i,children:[(0,t.jsx)("circle",{cx:"10.8",cy:"10.8",r:"6.2",fill:r?"currentColor":"none",fillOpacity:.16*!!r}),(0,t.jsx)("path",{d:"m15.4 15.4 4.35 4.35"})]});case"spark":return(0,t.jsxs)(R,{size:i,children:[(0,t.jsx)("path",{d:"M12 3.6c.55 4.6 2.35 6.5 7 7.15-4.65.65-6.45 2.55-7 7.15-.55-4.6-2.35-6.5-7-7.15 4.65-.65 6.45-2.55 7-7.15z",fill:a}),(0,t.jsx)("path",{d:"M18.6 16.4v3.2M17 18h3.2",strokeWidth:1.6})]});case"saved":return(0,t.jsx)(R,{size:i,children:(0,t.jsx)("path",{d:"M7.2 4.2h9.6a1.2 1.2 0 0 1 1.2 1.2v14.2l-6-3.9-6 3.9V5.4a1.2 1.2 0 0 1 1.2-1.2z",fill:a})});case"profile":return(0,t.jsxs)(R,{size:i,children:[(0,t.jsx)("circle",{cx:"12",cy:"8.6",r:"3.6",fill:a}),(0,t.jsx)("path",{d:"M4.9 19.6c1.15-3.55 3.8-5.4 7.1-5.4s5.95 1.85 7.1 5.4",fill:a})]})}}var D=e.i(16442);function A(){(0,D.isMuted)()||(0,D.ensureAudio)()}function P(){if((0,D.isMuted)())return null;let e=(0,D.getAudio)();return e&&"closed"!==e.ctx.state?e:null}function S(e,t,i){if("function"!=typeof e.createStereoPanner)return t;let r=e.createStereoPanner();return r.pan.value=Math.max(-1,Math.min(1,i)),r.connect(t),r}function L(e,t,i,r,a,o,s){let{ctx:l,output:n}=e,h=S(l,n,s),c=l.createOscillator();c.type="sine",c.frequency.setValueAtTime(i,t),c.frequency.exponentialRampToValueAtTime(r,t+a);let d=l.createGain();d.gain.setValueAtTime(0,t),d.gain.linearRampToValueAtTime(o,t+.004),d.gain.exponentialRampToValueAtTime(1e-4,t+1.9*a),c.connect(d).connect(h),c.start(t),c.stop(t+2*a+.02)}function C(e,t,i,r,a){let{ctx:o,output:s}=e,l=S(o,s,a),n=o.createBufferSource();n.buffer=(0,D.noiseBuffer)(o,.25);let h=o.createBiquadFilter();h.type="bandpass",h.frequency.value=i,h.Q.value=2.2;let c=o.createGain();c.gain.setValueAtTime(r,t),c.gain.exponentialRampToValueAtTime(1e-4,t+.022),n.connect(h).connect(c).connect(l),n.start(t,.2*Math.random(),.03)}function z(e,t,i,r,a,o){let{ctx:s,output:l}=e,n=S(s,l,o),h=s.createOscillator();h.type="sine",h.frequency.value=i*(1+(Math.random()-.5)*.008);let c=s.createGain();c.gain.setValueAtTime(0,t),c.gain.linearRampToValueAtTime(r,t+.002),c.gain.exponentialRampToValueAtTime(1e-4,t+a),h.connect(c).connect(n),h.start(t),h.stop(t+a+.02)}function U(e,t){let i=P();if(!i)return;let r=i.ctx.currentTime+.003,a=520-180*e+40*Math.random();L(i,r,a,2.6*a,.05,.16,t),C(i,r,3200,.05,t)}let q="arsher";function I(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(e)return`${e}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}let j=null,B=w.map(e=>({value:e.id,label:e.label,swatch:e.swatch})),F=e=>e?"The droplet merged with the tab bar":"The droplet pulled free of the tab bar";function N({mode:e,theme:r}){let a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=a.current;if(!t)return;let i=()=>{let i=t.getBoundingClientRect();if(i.width<2||i.height<2)return;let a=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);t.width=Math.round(i.width*a),t.height=Math.round(i.height*a);let o=t.getContext("2d");if(!o)return;let s="dark"===r,l=f(i.width,i.height,e,"stage"===e?T.length:M.length);for(let e of(o.setTransform(a,0,0,a,0,0),o.fillStyle=s?"#232323":"#f2f2f2",o.fillRect(0,0,i.width,i.height),o.fillStyle=s?"#ff8048":"#f7874d",o.beginPath(),o.arc(l.disc.x,l.disc.y,l.disc.r,0,2*Math.PI),o.fill(),o.fillStyle=s?"#3a5fff":"#3a5ae6",[l.band,l.band2]))o.save(),o.translate(e.x,e.y),o.rotate(e.angle),o.beginPath(),o.roundRect(-e.hw,-e.hh,2*e.hw,2*e.hh,e.hh),o.fill(),o.restore();o.fillStyle=s?"#ededed":"#161616",o.font=`600 ${l.fontPx}px ${I()}`,o.textAlign="center",o.fillText(q,l.word.cx,l.word.baseline),o.fillStyle=s?"rgb(255 255 255 / 0.12)":"rgb(255 255 255 / 0.55)",o.strokeStyle=s?"rgb(255 255 255 / 0.3)":"rgb(255 255 255 / 0.95)",o.lineWidth=1,o.beginPath(),o.roundRect(l.dock.cx-l.dock.hw,l.dock.cy-l.dock.hh,2*l.dock.hw,2*l.dock.hh,l.dock.r),o.arc(l.rest.x,l.rest.y,l.dropR,0,2*Math.PI),o.fill(),o.stroke()};i();let o=new ResizeObserver(i);return o.observe(t),()=>o.disconnect()},[e,r]),(0,t.jsx)("canvas",{ref:a,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A glass dock over the word arsher":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function({mode:e,active:s,reducedMotion:l,theme:n}){let h="stage"===e,c=h?T:M,[d]=(0,i.useState)(()=>new k(e,c.length)),p=(0,i.useRef)(null),g=(0,i.useRef)(null),m=(0,i.useRef)(null),x=(0,i.useRef)(null),v=(0,i.useRef)(null),b=(0,i.useRef)([]),y=(0,i.useRef)([]),w=(0,i.useId)(),[R,D]=(0,i.useState)(.6),[S,X]=(0,i.useState)(.3),[$,V]=(0,i.useState)("clear"),[W,G]=(0,i.useState)(0),[H,O]=(0,i.useState)(!1),[K,Y]=(0,i.useState)(""),Q=(0,i.useRef)({acc:0,urgent:!0,wordDirty:!0,wordPx:0,wordFont:-1,fontTick:0,nextTab:3.2}),J=(0,i.useRef)({iconEls:[],lift:[],scale:[],tone:[],dockEl:null,handleX:NaN,handleY:NaN,handleR:NaN,surfaceCursor:"",dockCursor:"",dockTouch:""}),Z=(0,i.useRef)({source:"",id:-1,x:0,y:0,moved:!1,merged:!1,suppressUntil:0}),ee=(0,i.useRef)(0),et=(0,i.useRef)(null),ei=(0,a.useLatest)({refraction:R,frost:S,tint:$,dark:"dark"===n,reducedMotion:l,theme:n}),er=e=>{let t=en.current.width;return t?(0,a.clamp)(e/t*1.4-.7,-.8,.8):0},ea=(0,a.useLatest)({onMerge:(e,t)=>{h&&"path"!==d.driver&&(e?function(e){let t=P();if(!t)return;let i=t.ctx.currentTime+.003,r=300+30*Math.random();L(t,i,r,2.1*r,.075,.15,e),z(t,i+.01,2350+120*Math.random(),.018,.22,e),z(t,i+.01,3710+160*Math.random(),.01,.16,e)}(er(t)):function(e){let t=P();if(!t)return;let i=t.ctx.currentTime+.003,r=760+80*Math.random();L(t,i,r,2.3*r,.032,.11,e),C(t,i,4200,.035,e)}(er(t)),"keys"===d.driver&&Y(F(e)))}}),eo=(0,a.useFrame)(s,e=>{let t=p.current,i=el.current,r=Q.current,a=ei.current,{width:o,height:s,dpr:l}=en.current;if(!t||!i||o<2||s<2)return;if(h){if(!r.urgent&&"path"!==d.driver&&"drag"!==d.driver&&!d.busy&&!d.easing(a)){if(r.acc+=e,r.acc<1/30-.002)return;e=r.acc}r.acc=0,r.urgent=!1}else{if(r.acc+=e,r.acc<1/30-.002)return;e=r.acc,r.acc=0}d.resize(o,s)&&(r.wordDirty=!0);let n=d.layout,u=Math.round(n.fontPx*l);if((r.wordDirty||u!==r.wordPx||r.fontTick!==r.wordFont)&&(et.current??=document.createElement("canvas"),d.word=function(e,t,i=document.createElement("canvas")){let r=e*t,a=I(),o=`${Math.round(r)}:${a}`,s=i.getContext("2d"),l=Math.ceil(.08*r),n={canvas:i,width:1,height:1,inkLeft:0,inkWidth:1,baseline:1,key:o,coverage:null,pw:1,ph:1};if(!s)return n;let h=`600 ${r}px ${a}`;s.font=h,"letterSpacing"in s&&(s.letterSpacing=`${(-.055*r).toFixed(2)}px`);let c=s.measureText(q),d=c.actualBoundingBoxLeft||0,u=c.actualBoundingBoxRight||c.width,p=c.actualBoundingBoxAscent||.75*r,f=c.actualBoundingBoxDescent||.02*r,g=d+u;i.width=Math.max(1,Math.ceil(g+2*l)),i.height=Math.max(1,Math.ceil(p+f+2*l));let m=i.getContext("2d");if(!m)return n;m.fillStyle="#000",m.fillRect(0,0,i.width,i.height),m.font=h,"letterSpacing"in m&&(m.letterSpacing=`${(-.055*r).toFixed(2)}px`),m.textBaseline="alphabetic",m.textAlign="left",m.fillStyle="#fff",m.fillText(q,l+d,l+p);let x=Math.max(1,Math.floor(i.width/4)),v=Math.max(1,Math.floor(i.height/4)),b=null;try{(j??=document.createElement("canvas")).width=x,j.height=v;let e=j.getContext("2d",{willReadFrequently:!0});if(e){e.imageSmoothingEnabled=!0,e.imageSmoothingQuality="medium",e.drawImage(i,0,0,4*x,4*v,0,0,x,v);let t=e.getImageData(0,0,x,v).data;b=new Uint8Array(x*v);for(let e=0;e<x*v;e++)b[e]=t[4*e]}}catch{b=null}return{coverage:b,pw:x,ph:v,canvas:i,width:i.width/t,height:i.height/t,inkLeft:l/t,inkWidth:g/t,baseline:(l+p)/t,key:o}}(n.fontPx,l,et.current),t.setType(d.word.canvas),r.wordPx=u,r.wordFont=r.fontTick,r.wordDirty=!1),!h){let t=em.current;if(t.inside&&"mouse"===t.type){d.driver="hover";let e=d.clampTarget(t.x,t.y);d.target.x=e.x,d.target.y=e.y;let{cx:i,cy:r,hw:a,hh:o}=n.dock;d.hoverIndex=Math.abs(t.x-i)<a&&Math.abs(t.y-r)<o?eu(t.x):-1}else"hover"===d.driver&&(d.driver="path"),d.hoverIndex=-1;if(!a.reducedMotion&&(r.nextTab-=e,r.nextTab<=0)){r.nextTab=3.4;let e=(d.selected+1)%c.length;d.select(e),G(e)}}d.step(e,a,ea.current);let f=d.frame(l);f&&t.draw(f);let g=J.current,y=Math.round(40*d.tone)/40;for(let e=0;e<c.length;e++){let t=b.current[e];if(!t)continue;t!==g.iconEls[e]&&(g.iconEls[e]=t,g.lift[e]=g.scale[e]=g.tone[e]=NaN);let i=Math.round(50*d.iconLift(e))/50,r=Math.round(500*d.iconScale(e))/500;if((i!==g.lift[e]||r!==g.scale[e])&&(g.lift[e]=i,g.scale[e]=r,t.style.transform=`translate3d(0, ${i}px, 0) scale(${r})`),y!==g.tone[e]){g.tone[e]=y;let i=Math.round(22+225*y),r=Math.round(255-255*y);t.style.color=`rgb(${i} ${i} ${i})`,t.style.filter=`drop-shadow(0 0 ${h?2:1.5}px rgb(${r} ${r} ${r} / ${(.5-.12*y).toFixed(2)}))`}}if(h){let e=em.current,t="drag"===d.driver,i=v.current;if(i){let e=Math.round(1.6*n.dropR),t=Math.round(2*d.dx.value)/2,r=Math.round(2*d.dy.value)/2;e!==g.handleR&&(g.handleR=e,i.style.width=i.style.height=`${2*e}px`),(t!==g.handleX||r!==g.handleY)&&(g.handleX=t,g.handleY=r,i.style.transform=`translate3d(${t-e}px, ${r-e}px, 0)`)}let r=x.current;if(r&&r!==g.dockEl&&(g.dockEl=r,g.dockTouch=g.dockCursor=""),r){let e=d.gap()<n.k?"none":"pan-y";e!==g.dockTouch&&(g.dockTouch=e,r.style.touchAction=e);let t=d.pointer,i=t.inside&&d.hitDroplet(t.x,t.y,1.25),a="dock"===Z.current.source?"grabbing":i?"grab":"pointer";a!==g.dockCursor&&(g.dockCursor=a,r.style.setProperty("--lg-cursor",a))}let a=m.current;if(a){let i=t?"grabbing":e.inside&&d.hitDroplet(e.x,e.y,1.25)?"grab":"";i!==g.surfaceCursor&&(g.surfaceCursor=i,a.style.cursor=i)}}if(a.reducedMotion&&!d.busy&&!d.easing(a))return!1}),{canvasRef:es,glRef:el,sizeRef:en,size:eh,supported:ec}=(0,a.useWebGL2)({mode:e,maxDpr:h?2:1.5,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new u(e)}catch(e){console.error(e);return}return p.current=t,Q.current.wordDirty=!0,Q.current.urgent=!0,eo(),()=>{t?.dispose(),p.current=null}},onResize:()=>{Q.current.urgent=!0,eo()}});(0,i.useEffect)(()=>{let e=es.current;return()=>{e&&window.setTimeout(()=>{if(e.isConnected)return;let t=e.getContext("webgl2");t&&!t.isContextLost()&&t.getExtension("WEBGL_lose_context")?.loseContext()},0)}},[es]),(0,i.useEffect)(()=>{let e=!0;return(function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!e||!document.fonts)return Promise.resolve();return document.fonts.load(`600 96px ${e}`,q).then(()=>void 0).catch(()=>void 0)}catch{return Promise.resolve()}})().then(()=>{e&&(Q.current.fontTick++,Q.current.urgent=!0,eo())}),()=>{e=!1}},[eo]),(0,i.useEffect)(()=>{Q.current.urgent=!0,eo()},[R,S,$,n,l,eo]),(0,i.useEffect)(()=>()=>window.clearTimeout(ee.current),[]);let ed=()=>{Q.current.urgent=!0,eo()},eu=e=>{let t=d.layout;return t?(0,a.clamp)(Math.floor((e-(t.dock.cx-t.dock.hw+t.padX))/t.pitch),0,c.length-1):0},ep=(e,t,i,r)=>{A(),window.clearTimeout(ee.current),Z.current.merged=d.merged,d.beginDrag(e,t,i),i&&r&&U(.5,er(e)),O(!0),ed()},ef=()=>{if("drag"!==d.driver)return;d.endDrag();let e=Z.current.merged;window.clearTimeout(ee.current),ee.current=window.setTimeout(()=>{d.merged!==e&&Y(F(d.merged))},600),ed()},eg=h?m:es,em=(0,a.usePointer)(eg,{capture:h,onDown:(e,t)=>{if(!h)return;let i="mouse"!==t.pointerType,r=d.hitDroplet(e.x,e.y,i?1.6:1.25);(!i||r)&&(Z.current.source="surface",ep(e.x,e.y,r,!0))},onMove:e=>{h&&e.pressed&&"surface"===Z.current.source&&"drag"===d.driver&&d.dragTo(e.x,e.y),ed()},onUp:()=>{h&&("surface"===Z.current.source&&(Z.current.source="",ef()),ed())},onLeave:()=>ed()});(0,i.useEffect)(()=>{let e=g.current;if(!h||!e)return;let t=t=>{if("mouse"!==t.pointerType)return;let i=e.getBoundingClientRect();d.pointer.x=t.clientX-i.left,d.pointer.y=t.clientY-i.top,d.pointer.inside=!0,Q.current.urgent=!0,eo()},i=()=>{d.pointer.inside=!1,Q.current.urgent=!0,eo()};return e.addEventListener("pointermove",t),e.addEventListener("pointerleave",i),()=>{e.removeEventListener("pointermove",t),e.removeEventListener("pointerleave",i)}},[h,d,eo]);let ex=e=>{let t=g.current?.getBoundingClientRect();return t?{x:e.clientX-t.left,y:e.clientY-t.top}:{x:0,y:0}},ev=e=>{let t=Z.current;if("dock"!==t.source||e.pointerId!==t.id)return;t.source="",t.suppressUntil=performance.now()+500;let i=!t.moved&&"pointerup"===e.type;ef(),i&&eb(eu(t.x))},eb=e=>{A(),d.select(e),G(e);let t=d.layout;!function(e){let t=P();if(!t)return;let i=t.ctx.currentTime+.003;z(t,i,2960+60*Math.random(),.04,.12,e),z(t,i,4620+80*Math.random(),.022,.08,e),C(t,i,5200,.03,e)}(t?er(t.icons[e].x):0),O(!0),ed()},ey=e=>{d.hoverIndex=e,ed()},ew=(0,i.useMemo)(()=>eh.width>1&&eh.height>1?f(eh.width,eh.height,e,c.length):null,[eh.width,eh.height,e,c.length]);if(!1===ec)return(0,t.jsx)(N,{mode:e,theme:n});let e_=ew?(0,t.jsx)("div",{ref:x,"data-lab-controls":h?"":void 0,role:h?"radiogroup":void 0,"aria-label":h?"Tab bar":void 0,"aria-hidden":!h||void 0,onKeyDown:h?e=>{let t=c.length,i=-1;switch(e.key){case"ArrowRight":case"ArrowDown":i=(W+1)%t;break;case"ArrowLeft":case"ArrowUp":i=(W-1+t)%t;break;case"Home":i=0;break;case"End":i=t-1;break;default:return}e.preventDefault(),e.stopPropagation(),eb(i),y.current[i]?.focus()}:void 0,onPointerLeave:h?()=>ey(-1):void 0,onPointerDown:h?e=>{if(!e.isPrimary||e.button>0)return;let{x:t,y:i}=ex(e),r="mouse"!==e.pointerType;if(!d.hitDroplet(t,i,r?1.6:1.25))return;e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}let a=Z.current;a.source="dock",a.id=e.pointerId,a.x=t,a.y=i,a.moved=!1,ep(t,i,!0,!1)}:void 0,onPointerMove:h?e=>{let t=Z.current;if("dock"!==t.source||e.pointerId!==t.id)return;let{x:i,y:r}=ex(e);!t.moved&&Math.hypot(i-t.x,r-t.y)>4&&(t.moved=!0,U(.5,er(i))),t.moved&&d.dragTo(i,r),ed()}:void 0,onPointerUp:h?ev:void 0,onPointerCancel:h?ev:void 0,onClickCapture:h?e=>{performance.now()<Z.current.suppressUntil&&(Z.current.suppressUntil=0,e.preventDefault(),e.stopPropagation())}:void 0,className:(0,r.cn)("absolute",h?"touch-pan-y":"pointer-events-none"),style:{left:ew.dock.cx-ew.dock.hw,top:ew.dock.cy-ew.dock.hh,width:2*ew.dock.hw,height:2*ew.dock.hh},children:c.map((e,i)=>{let a=i===W,o=(0,t.jsx)("span",{ref:e=>{b.current[i]=e},className:(0,r.cn)("block text-primary transition-opacity duration-300 ease-out will-change-transform",a?"opacity-100":"opacity-[0.78]"),children:(0,t.jsx)(E,{id:e.id,size:ew.iconSize,filled:a})}),s={left:ew.padX+ew.pitch*i,width:ew.pitch,top:h?4:2,bottom:h?4:2};return h?(0,t.jsx)("button",{ref:e=>{y.current[i]=e},type:"button",role:"radio","aria-checked":a,"aria-label":e.label,title:e.label,tabIndex:a?0:-1,onClick:()=>eb(i),onPointerEnter:e=>{"mouse"===e.pointerType&&ey(i)},onFocus:()=>ey(i),onBlur:()=>ey(-1),className:"absolute grid cursor-[var(--lg-cursor,pointer)] place-items-center rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",style:s,children:o},e.id):(0,t.jsx)("span",{className:"absolute grid place-items-center",style:s,children:o},e.id)})}):null;if(!h)return(0,t.jsxs)("div",{className:"absolute inset-0",children:[(0,t.jsx)("canvas",{ref:es,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),e_]});let ek=ew?.compact??!1;return(0,t.jsxs)("div",{ref:g,className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:m,tabIndex:0,role:"application","aria-roledescription":"liquid glass","aria-label":"Glass droplet","aria-describedby":w,onKeyDown:e=>{if(!h||e.altKey||e.ctrlKey||e.metaKey)return;let t=d.layout;if(!t)return;let i=(e.shiftKey?3:1)*Math.max(12,.75*t.dropR),r=!0;switch(e.key){case"ArrowLeft":d.nudge(-i,0);break;case"ArrowRight":d.nudge(i,0);break;case"ArrowUp":d.nudge(0,-i);break;case"ArrowDown":d.nudge(0,i);break;case"Enter":case" ":if(e.repeat)break;d.toggleMerge();break;default:r=!1}r&&(e.preventDefault(),e.stopPropagation(),A(),("Enter"===e.key||" "===e.key)&&U(.35,er(d.dx.value)),O(!0),ed())},className:"group/glass absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]",children:[(0,t.jsx)("canvas",{ref:es,className:"absolute inset-0 block size-full"}),(0,t.jsx)("span",{ref:v,"aria-hidden":"true",className:"absolute top-0 left-0 touch-none rounded-full",style:{width:0,height:0}}),(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_var(--foreground)] opacity-0 transition-opacity duration-200 group-focus-visible/glass:opacity-30"})]}),e_,(0,t.jsx)("p",{id:w,className:"sr-only",children:"Drag the droplet, or use the arrow keys to move it. Enter or Space drops it into the tab bar or lifts it back out. Tab to the tab bar and use the arrow keys to switch tabs."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:K}),(0,t.jsx)(o.StageControls,{placement:"top",children:(0,t.jsxs)(o.Tray,{label:"Tint and sound",children:[(0,t.jsx)(o.Swatches,{label:"Tint",options:B,value:$,onChange:e=>{V(e),Y(`Tint: ${_(e).label}`)}}),(0,t.jsx)(o.TrayDivider,{}),(0,t.jsx)(o.MuteButton,{})]})}),(0,t.jsxs)(o.StageControls,{placement:"bottom",children:[(0,t.jsx)(o.TrayRow,{children:(0,t.jsxs)(o.Tray,{label:"Glass",children:[(0,t.jsx)(o.Slider,{label:"Refraction",value:R,min:0,max:1,step:.01,width:ek?64:96,showValue:!ek,onChange:D,format:e=>`${Math.round(100*e)}`}),(0,t.jsx)(o.TrayDivider,{}),(0,t.jsx)(o.Slider,{label:"Frost",value:S,min:0,max:1,step:.01,width:ek?64:96,showValue:!ek,onChange:X,format:e=>`${Math.round(100*e)}`})]})}),(0,t.jsx)(o.StageHint,{className:(0,r.cn)("transition-opacity duration-700",H&&"opacity-0"),children:"Drag the droplet into the bar and pull it back out"})]})]})}],95709)},80920,function(e){e.n(e.i(95709))}]);