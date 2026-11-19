// One full-screen pass, scissored to the bar: the milled channel, the wet
// film, the printed labels, the drop's shadow and the drop itself.
//
// The drop comes in as its profile (profile.ts): half-height r and slope
// r′ per half pixel along the channel. Its signed distance is
// (|y| − r) / √(1 + r′²), and its surface is a height field across the
// channel: z = κ·r·(1 − sᴾ) with s = |y| / r, flat on top and rounding
// steeply into the edge, the same shape for a thick body and a hairline
// thread. Normals come straight from the derivatives, so there is no
// finite differencing. Lighting is a small studio: an overhead softbox
// the liquid reflects, a narrow strip light to the right, a key glint
// from the upper left, and the channel floor bounced into lower edges.
//
// Materials (uMat.x → uMat.y, wiping outward from uMat.w as uMat.z goes
// 0 → 1):
//   0 ink: the palette's own ink under a clear varnish (glossy black by
//          day, cherry red in Red Dragon, white enamel on AMOLED); the label
//          under it reads in the palette's on-ink tone, lensed a touch.
//   1 mercury: all reflection, a dark horizon band and the floor in it.
//   2 water: clear; magnifies the floor and the label (which reads in the
//            foreground tone), a dark meniscus at the rim, a caustic low inside.

import { FULLSCREEN_VERTEX } from "../../gl";

export const VERTEX = FULLSCREEN_VERTEX;

export const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uCanvas;
uniform float uDpr;
uniform vec4 uBar;
uniform float uDropH;
uniform sampler2D uProfile;
uniform vec3 uProf;
uniform sampler2D uWet;
uniform float uWetLen;
uniform sampler2D uLabels;
uniform float uDark;
uniform vec3 uFloor;
uniform vec3 uLabelCol;
uniform vec3 uFg;
uniform vec3 uOnInk;
uniform vec3 uInk;
uniform vec3 uLip;
uniform vec4 uMat;
uniform vec4 uRipple;
uniform float uPress;
uniform float uWetK;

out vec4 outColor;

const vec3 V = vec3(0.0, 0.0, 1.0);
const float KAPPA = 0.86;
const float POW = 2.4;

vec2 prof(float x) {
  float f = (x - uProf.x) * uProf.y;
  if (f < 0.0 || f > uProf.z - 1.001) return vec2(-64.0, 0.0);
  float i0 = floor(f);
  int i = int(i0);
  vec2 a = texelFetch(uProfile, ivec2(i, 0), 0).rg;
  vec2 b = texelFetch(uProfile, ivec2(i + 1, 0), 0).rg;
  return mix(a, b, f - i0);
}

/* Distance to the liquid for soft effects: vertical over the liquid, radial past its ends. */
float softDist(float y, float r) {
  return r >= 0.0 ? abs(y) - r : length(vec2(r, y));
}

float channelDist(vec2 q) {
  vec2 c = q - uBar.zw * 0.5;
  float hh = uBar.w * 0.5;
  return length(vec2(max(abs(c.x) - (uBar.z * 0.5 - hh), 0.0), c.y)) - hh;
}

/* The label mask is drawn at device pixels (scale exactly uDpr), so the
   printed labels are read texel for texel on the screen's own grid and
   stay crisp at any DPR; seen through liquid they are filtered. */
float labelCrisp(vec2 q) {
  ivec2 ts = textureSize(uLabels, 0);
  ivec2 p = ivec2(floor(q * uDpr));
  if (p.x < 0 || p.y < 0 || p.x >= ts.x || p.y >= ts.y) return 0.0;
  return texelFetch(uLabels, p, 0).a;
}

float labelSoft(vec2 q) {
  return texture(uLabels, q * uDpr / vec2(textureSize(uLabels, 0))).a;
}

/* The channel floor at q (bar-local CSS px): walls, wet film, labels. */
vec3 floorAt(vec2 q, vec3 labelColor, bool crisp) {
  vec3 col = uFloor;
  float dc = channelDist(q);
  float hh = uBar.w * 0.5;
  float yc = (q.y - hh) / hh;
  float inner = max(-dc, 0.0);
  float top = smoothstep(0.35, -0.9, yc);
  col *= 1.0 - mix(0.11, 0.34, uDark) * top * exp(-inner / 2.4) - mix(0.035, 0.08, uDark) * top * exp(-inner / 9.0);
  float bottom = smoothstep(0.25, 0.95, yc);
  col += mix(0.05, 0.022, uDark) * bottom * exp(-inner / 1.3);

  float w = texture(uWet, vec2(clamp(q.x / uWetLen, 0.0, 1.0), 0.5)).r;
  if (w > 0.003) {
    // a thin film where the liquid was: a breath of its colour, a little
    // darker, and a bright line where its upper edge catches the softbox
    float y = abs(q.y - hh);
    float band = w * uDropH * 0.45;
    float a = smoothstep(band + 1.2, band - 1.2, y) * sqrt(w) * uWetK;
    vec3 film = uMat.y < 0.5 ? uInk : uFloor * mix(0.86, 1.25, uDark);
    col = mix(col, mix(col * mix(0.97, 1.0, uDark), film, mix(0.06, 0.1, uDark)), a);
    float sheen = exp(-pow((y - band * 0.86) / 0.9, 2.0)) * step(q.y, hh) * a;
    col += sheen * mix(0.05, 0.04, uDark);
  }

  float l = crisp ? labelCrisp(q) : labelSoft(q);
  return mix(col, labelColor, l);
}

float softbox(vec3 R) {
  return smoothstep(0.3, 0.42, -R.y) * (1.0 - smoothstep(0.45, 0.85, abs(R.x + 0.08)));
}

/* a tall strip light to the right, with soft edges so a shoulder sweeping
   past it glows instead of flashing a hard-edged block */
float stripLight(vec3 R) {
  return smoothstep(0.46, 0.66, R.x) * (1.0 - smoothstep(0.76, 0.95, R.x)) * (1.0 - smoothstep(0.0, 0.42, abs(R.y + 0.12)));
}

float glint(vec3 N, float sharp) {
  vec3 L = normalize(vec3(-0.42, -0.78, 0.9));
  return pow(max(dot(N, normalize(L + V)), 0.0), sharp);
}

float lambert(vec3 N) {
  return max(dot(N, normalize(vec3(-0.42, -0.78, 0.9))), 0.0);
}

vec3 shadeInk(vec3 N, vec2 q, float z, float s, float yn) {
  vec3 R = reflect(-V, N);
  float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
  // the label under the varnish: crisp where the surface is flat, lensed
  // (and so filtered) where it curves
  vec2 lens = N.xy * z * 0.12;
  float la = mix(labelCrisp(q), labelSoft(q + lens), smoothstep(0.15, 0.6, length(lens) * uDpr));
  float lum = dot(uInk, vec3(0.2126, 0.7152, 0.0722));
  float sat = max(uInk.r, max(uInk.g, uInk.b)) - min(uInk.r, min(uInk.g, uInk.b));
  // the pigment, lit softly from above and deepening where the surface
  // turns away toward the rim
  vec3 body = uInk * (0.8 + 0.3 * lambert(N)) * mix(1.0, mix(0.62, 0.74, lum), smoothstep(0.5, 1.0, s));
  // a coloured ink lets a little light through: its lower shoulder glows
  body += uInk * sat * 0.22 * smoothstep(0.15, 0.85, yn) * (1.0 - smoothstep(0.85, 1.0, s));
  body = mix(body, uOnInk, la);
  // the studio in the varnish: dark inks show it all, light ones a little
  float k = mix(1.0, 0.32, lum);
  vec3 room = uFloor * mix(0.5, 0.62, smoothstep(0.0, 0.6, R.y));
  vec3 env = vec3(softbox(R) * (6.5 + uPress * 2.0) + stripLight(R) * 2.0) * k + room * smoothstep(0.35, -0.2, R.z);
  return body + F * env + glint(N, 90.0) * mix(0.85, 0.45, lum);
}

vec3 shadeMercury(vec3 N, vec2 q) {
  // a mirror bead seen from above: the bright ceiling and a soft key on its
  // flat top, the dark walls of the room in a band round its shoulders, and
  // the pale floor in a thin rim at the very edge
  vec3 R = reflect(-V, N);
  vec2 k = (R.xy - vec2(-0.14, -0.3)) / vec2(0.55, 0.32);
  float env = mix(0.36, 0.9, smoothstep(-0.1, 0.85, R.z)) + 0.48 * exp(-dot(k, k));
  float wall = smoothstep(0.42, 0.16, R.z) * smoothstep(-0.62, -0.4, R.z);
  env = mix(env, mix(0.27, 0.15, uDark) + 0.07 * smoothstep(-0.2, 0.4, R.y), wall);
  float rim = smoothstep(-0.48, -0.72, R.z);
  vec3 col = mix(vec3(env), uFloor * mix(1.02, 0.9, step(0.0, R.y)), rim);
  col += stripLight(R) * 0.45;
  // a dark room's own light colours the chrome a little
  vec3 tint = uFg / max(max(uFg.r, max(uFg.g, uFg.b)), 1e-3);
  col *= mix(vec3(1.0), mix(vec3(1.0), tint, 0.22) * 0.72, uDark);
  float la = labelCrisp(q);
  col = mix(col, vec3(mix(0.08, 0.06, uDark)), la * 0.9);
  return col + glint(N, 160.0) * 0.7;
}

vec3 shadeWater(vec3 N, vec2 q, float z, float s, float yn) {
  vec2 off = -N.xy * z * 0.3;
  vec3 col = floorAt(q + off, uFg, false) * mix(0.975, 1.03, uDark);
  col *= 1.0 - mix(0.4, 0.3, uDark) * smoothstep(0.6, 1.0, s);
  col += mix(0.2, 0.08, uDark) * exp(-pow((yn - 0.42) / 0.22, 2.0)) * smoothstep(0.98, 0.55, s);
  vec3 R = reflect(-V, N);
  float F = 0.02 + 0.98 * pow(1.0 - N.z, 5.0);
  col += F * (softbox(R) * (4.5 + uPress * 1.5) + stripLight(R) * 1.4);
  return col + glint(N, 120.0) * 0.9;
}

vec3 shadeAs(float m, vec3 N, vec2 q, float z, float s, float yn) {
  if (m < 0.5) return shadeInk(N, q, z, s, yn);
  if (m < 1.5) return shadeMercury(N, q);
  return shadeWater(N, q, z, s, yn);
}

/* how dark a material's shadow is, and how opaque it is when thin */
float shadowOf(float m) {
  if (m < 0.5) return mix(0.2, 0.55, uDark);
  if (m < 1.5) return mix(0.24, 0.55, uDark);
  return mix(0.07, 0.3, uDark);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uDpr;
  vec2 q = frag - uBar.xy;
  float px = 1.0 / uDpr;
  float dc = channelDist(q);
  float hh = uBar.w * 0.5;
  float yc = (q.y - hh) / hh;

  // the lip: the cut's lower edge catches the light
  float lip = (1.0 - smoothstep(0.0, 1.3, dc)) * smoothstep(-0.1, 0.85, yc) * mix(0.85, 0.32, uDark);
  float chA = clamp(0.5 - dc / px, 0.0, 1.0);
  if (chA <= 0.0) {
    outColor = vec4(uLip * lip, lip) * step(0.0, dc);
    return;
  }

  vec2 p = vec2(q.x, q.y - hh);
  vec2 pr = prof(q.x);
  // antialiasing wants the distance across the outline (slope-corrected);
  // past the ends there is only the tip to be near
  float d = pr.x >= 0.0 ? (abs(p.y) - pr.x) * inversesqrt(1.0 + pr.y * pr.y) : length(vec2(pr.x, p.y));

  // which material shades this pixel (a wipe spreads the new one outward)
  float wipe = 1.0;
  if (uMat.z < 1.0) wipe = 1.0 - smoothstep(-6.0, 6.0, abs(q.x - uMat.w) - uMat.z * (uBar.z + 40.0));
  float matA = uMat.x;
  float matB = uMat.y;

  vec3 col = floorAt(q, uLabelCol, true);
  // soft shadow (offset down a little) and a tight contact shadow
  vec2 ps = prof(q.x + 0.5);
  float ds = softDist(p.y - 2.2, ps.x);
  float dc0 = softDist(p.y, pr.x);
  float sk = mix(shadowOf(matA), shadowOf(matB), wipe) * (1.0 + uPress * 0.25);
  col *= 1.0 - sk * (1.0 - smoothstep(-3.0, 4.5, ds)) * 0.55 - sk * 0.3 * exp(-max(dc0, 0.0) / 1.5) * step(0.0, dc0);

  float cov = clamp(0.5 - d / px, 0.0, 1.0);
  if (cov > 0.0) {
    float r = max(pr.x, 1e-3);
    float yn = clamp(p.y / r, -1.0, 1.0);
    float s = abs(yn);
    float sp = pow(s, POW - 1.0);
    float dzdy = -KAPPA * POW * sp * sign(p.y);
    float dzdx = KAPPA * pr.y * (1.0 + (POW - 1.0) * sp * s);
    // a ripple running out from where a remnant merged
    if (uRipple.z > 0.001) {
      float dx = q.x - uRipple.x;
      float age = uRipple.y;
      // one smooth swell running outward (the slope of a travelling bump),
      // so the highlight rolls over it instead of breaking into dashes
      float u = (abs(dx) - age * 380.0) / 24.0;
      float env = uRipple.z * exp(-age * 5.0) * exp(-u * u);
      // (flat at its origin, where the two outgoing fronts meet)
      dzdx -= env * 1.1 * u * sign(dx) * (1.0 - exp(-dx * dx / 90.0));
    }
    vec3 N = normalize(vec3(-dzdx, -dzdy, 1.0));
    float z = KAPPA * r * (1.0 - sp * s);
    vec3 dropCol = shadeAs(matA, N, q, z, s, yn);
    if (wipe > 0.001 && matB != matA) dropCol = mix(dropCol, shadeAs(matB, N, q, z, s, yn), wipe);
    // a hairline of liquid is thin enough to see through a little
    float body = mix(0.5, 1.0, smoothstep(0.4, 2.6, r));
    col = mix(col, min(dropCol, vec3(1.0)), cov * body);
  }

  float a = chA + lip * (1.0 - chA) * step(0.0, dc);
  outColor = vec4(col * chA + uLip * lip * (1.0 - chA) * step(0.0, dc), a);
}
`;
