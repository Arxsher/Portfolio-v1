// GLSL for the wall. One draw call: every piece is a fan of triangles
// (mesh.ts) and the fragment shader does the rest. All lighting happens in
// linear light; the result is tone-mapped with a soft knee and encoded to
// sRGB at the end.
//
// Per piece, from the tile data texture (3 texels per piece, 256 pieces a row):
//   texel 0  old glaze rgb · time the re-glaze reaches the piece
//   texel 1  new glaze rgb · time the piece is set (laid) on the wall
//   texel 2  ripple origin xy · seed · 1 when the change is a plain cross-fade
//
// The look, from the grout up:
//   grout     a recessed line of sandy cement; ambient occlusion from both
//             walls, and the shadow the nearer wall casts away from the light
//   bevel     the glaze rolls over the cut edge (a rounded rim, its normal
//             leaning out), and pools against it a shade deeper
//   face      each piece is set at its own slight tilt, its glaze undulates,
//             clouds a little, has the odd pinhole and an occasional chip
//             where the fired clay shows
//   light     a soft lamp (the pointer) for diffuse and a widened GGX glint,
//             plus the reflection of a room with a barred window: because
//             every piece leans differently, each catches a different part
//             of it, which is what makes zellige shimmer

export const VERTEX = `#version 300 es
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_center;
layout(location = 2) in vec3 a_edge;
layout(location = 3) in vec4 a_info;

uniform vec2 u_res;

out vec2 v_pos;
out vec2 v_center;
out float v_dist;
flat out vec2 v_normal;
flat out vec4 v_info;

void main() {
  v_pos = a_pos;
  v_center = a_center;
  v_dist = a_edge.x;
  v_normal = a_edge.yz;
  v_info = a_info;
  vec2 clip = a_pos / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

export const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 v_pos;
in vec2 v_center;
in float v_dist;
flat in vec2 v_normal;
flat in vec4 v_info; // index · reach · radius · shape

uniform sampler2D u_tiles;
uniform vec2 u_res;
uniform float u_time;
uniform float u_grout;       // half the grout line, CSS px
uniform float u_relief;      // how far the glaze stands above the grout, px
uniform vec3 u_light;        // the lamp, CSS px (z toward the viewer)
uniform float u_lightPower;
uniform float u_lightRadius; // falloff distance
uniform float u_lightSize;   // widens the glint (an area light, not a point)
uniform float u_specGain;
uniform vec3 u_key;          // lamp colour (linear)
uniform vec3 u_ambient;      // room light (linear)
uniform vec3 u_groutColor;
uniform vec3 u_body;         // fired clay, where a chip shows it
uniform vec3 u_envTop;
uniform vec3 u_envBottom;
uniform vec3 u_windowColor;
uniform vec4 u_window;       // the window in reflection space: centre xy, half size zw
uniform float u_motion;      // 0 under reduced motion: no rocking
uniform float u_vignette;
uniform float u_exposure;

out vec4 outColor;

const float PI = 3.14159265;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// value noise and its gradient
vec3 noised(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}

float vnoise(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// sparse round specks (pinholes in the glaze)
float speck(vec2 p, float density, float size) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float h = hash12(i + 7.31);
  vec2 c = vec2(hash12(i + 17.1), hash12(i + 43.7)) * 0.6 + 0.2;
  float d = length(f - c);
  return step(1.0 - density, h) * (1.0 - smoothstep(size * 0.45, size, d));
}

// a damped spring from 0 to 1 (ζ 0.75: a hair of overshoot)
float settle(float t) {
  if (t <= 0.0) return 0.0;
  const float z = 0.75;
  const float w = 15.0;
  const float wd = w * 0.6614;
  return 1.0 - exp(-z * w * t) * (cos(wd * t) + (z * w / wd) * sin(wd * t));
}

// a filmic shoulder on luminance (no hue shift), then highlights bleach toward white
vec3 shoulder(vec3 c) {
  const float k = 0.6;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float m = l < k ? l : k + (1.0 - k) * (1.0 - exp(-(l - k) / (1.0 - k)));
  c *= m / max(l, 1e-5);
  float over = max(max(c.r, c.g), c.b) - 1.0;
  return over > 0.0 ? mix(c, vec3(1.0), clamp(over / (1.0 + over), 0.0, 1.0)) : c;
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  int index = int(v_info.x + 0.5);
  ivec2 at = ivec2((index % 256) * 3, index / 256);
  vec4 A = texelFetch(u_tiles, at, 0);
  vec4 B = texelFetch(u_tiles, at + ivec2(1, 0), 0);
  vec4 C = texelFetch(u_tiles, at + ivec2(2, 0), 0);
  float seed = C.z;
  float reach = v_info.y;
  float radius = max(v_info.z, 1.0);

  // --- setting the piece: its glazed face grows from the centre on a spring
  float laid = min(settle(u_time - B.w), 1.03);

  // --- the re-glaze: a wipe across the piece, away from the ripple's origin
  float tf = u_time - A.w;
  vec2 dir = v_center - C.xy;
  float dl = length(dir);
  dir = dl > 0.5 ? dir / dl : vec2(0.0, -1.0);
  float wipe;
  if (C.w > 0.5) {
    wipe = smoothstep(0.0, 0.3, tf);
  } else {
    float s = dot(v_pos - v_center, dir) / radius;
    float f = clamp(tf / 0.36, 0.0, 1.0);
    f = 1.0 - (1.0 - f) * (1.0 - f) * (1.0 - f);
    float front = mix(-1.3, 1.3, f);
    wipe = tf <= 0.0 ? 0.0 : 1.0 - smoothstep(front - 0.16, front + 0.16, s);
  }
  vec3 albedo = mix(A.rgb, B.rgb, wipe);
  // the piece rocks as the new glaze lands, like a tile pressed into its bed
  float rock = tf > 0.0 ? u_motion * 0.14 * exp(-5.0 * tf) * sin(tf * 20.0) : 0.0;

  // --- the cut edge: not quite straight
  float wobble = (vnoise(v_pos * 0.19 + seed * 37.0) - 0.5) * 0.9 + (vnoise(v_pos * 0.77 + 5.0) - 0.5) * 0.32;
  float d = v_dist + wobble;
  float g = u_grout + (1.0 - laid) * (reach + 2.0);
  float aa = max(fwidth(v_dist), 1e-4) * 0.8;
  float mask = smoothstep(g - aa, g + aa, d);

  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 P = vec3(v_pos, 0.0);
  vec3 Lv = u_light - P;
  float dist2 = dot(Lv, Lv);
  float dist = sqrt(dist2);
  vec3 L = Lv / dist;
  // the lamp's pool on the wall: a soft gaussian with a gentle tail
  float hr = length(Lv.xy) / u_lightRadius;
  float fall = u_lightPower * (0.8 * exp(-hr * hr) + 0.2 / (1.0 + hr * hr));

  // --- glaze
  float e = max(d - g, 0.0);
  float bevel = clamp(reach * 0.13, 1.4, 4.2);
  float t = 1.0 - clamp(e / bevel, 0.0, 1.0);
  vec2 nxy = v_normal * (1.5 * t * t);
  float ang = seed * 6.28318;
  nxy += vec2(cos(ang), sin(ang)) * (0.01 + 0.045 * fract(seed * 13.7));
  vec3 und = noised(v_pos / 38.0 + seed * 19.0);
  nxy -= und.yz * 0.014;
  // no face is flat: the glaze domes a little, more on some pieces than
  // others (a dish would focus the lamp across the whole face)
  float cup = 0.012 + 0.05 * fract(seed * 5.31);
  nxy += (v_pos - v_center) / radius * cup;
  nxy += dir * rock;
  vec3 N = normalize(vec3(nxy, 1.0));

  float pool = 1.0 - smoothstep(0.0, bevel * 2.6, e);
  albedo = mix(albedo, pow(albedo, vec3(1.4)) * 0.88, pool * 0.6);
  float cloud = vnoise(v_pos / 12.0 + seed * 7.0) * 0.65 + vnoise(v_pos / 4.6 - seed * 3.0) * 0.35;
  albedo *= 0.9 + 0.2 * cloud;
  float pin = speck(v_pos / 6.0 + seed * 5.0, 0.022, 0.2);
  albedo *= 1.0 - pin * 0.32;
  float chip = smoothstep(0.8, 0.86, vnoise(v_pos * 0.17 + seed * 23.0)) * (1.0 - smoothstep(0.15, 1.0, e));
  albedo = mix(albedo, u_body, chip * 0.7);

  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(N.z, 0.0);
  vec3 H = normalize(L + V);
  float NdotH = max(dot(N, H), 0.0);
  float rough = mix(0.12, 0.55, chip);
  if (tf > 0.0) rough *= mix(0.55, 1.0, smoothstep(0.0, 1.8, tf));
  float a = clamp(rough * rough + u_lightSize / (2.0 * dist), 0.002, 1.0);
  float a2 = a * a;
  float den = NdotH * NdotH * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * den * den);
  float F = 0.045 + 0.955 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
  // and a broad sheen: the lamp's glow on wet-looking glass
  float b2 = 0.045;
  float denB = NdotH * NdotH * (b2 - 1.0) + 1.0;
  float sheen = b2 / (PI * denB * denB);
  vec3 spec = u_key * ((D + sheen * 0.22) * F * 0.25 * u_specGain) * NdotL * fall * (1.0 - chip);

  vec3 R = reflect(-V, N);
  float up = clamp(0.5 - R.y * 0.5, 0.0, 1.0);
  vec3 env = mix(u_envBottom, u_envTop, smoothstep(0.15, 0.85, up));
  vec2 q = R.xy - u_window.xy;
  vec2 qa = abs(q) - u_window.zw;
  float sd = length(max(qa, 0.0)) + min(max(qa.x, qa.y), 0.0);
  float pane = 1.0 - smoothstep(-0.008, 0.022, sd);
  float bars = max(1.0 - smoothstep(0.004, 0.012, abs(q.x)), 1.0 - smoothstep(0.004, 0.012, abs(q.y + u_window.w * 0.2)));
  pane *= 1.0 - 0.7 * bars;
  env += u_windowColor * pane;
  float Fe = (0.045 + 0.955 * pow(1.0 - NdotV, 5.0)) * (1.0 - chip * 0.85);

  vec3 diffuse = albedo * (u_ambient * (0.72 + 0.28 * NdotV) + u_key * NdotL * fall);
  vec3 glaze = diffuse * (1.0 - Fe) + env * Fe + spec;

  // --- grout
  float own = max(g - d, 0.0);
  float other = g + d;
  float sand = vnoise(v_pos * 0.9 + 3.0) * 0.6 + vnoise(v_pos * 2.3) * 0.4;
  vec3 galb = u_groutColor * (0.86 + 0.24 * sand);
  float ao = clamp(1.0 - 0.5 * exp(-own / 1.2) - 0.5 * exp(-other / 1.2), 0.15, 1.0);
  vec2 lxy = u_light.xy - v_pos;
  float lh = max(length(lxy), 1e-3);
  vec2 ldir = lxy / lh;
  float throw = u_relief * lh / max(u_light.z, 1.0);
  float toward = dot(ldir, -v_normal);
  float shade = toward > 0.0
    ? smoothstep(-0.5, 0.5, throw * toward - own)
    : smoothstep(-0.5, 0.5, -throw * toward - other);
  shade *= laid;
  vec3 grout = galb * (u_ambient * ao + u_key * max(L.z, 0.0) * fall * (1.0 - 0.8 * shade) * mix(1.0, ao, 0.6));

  vec3 col = mix(grout, glaze, mask) * u_exposure;

  vec2 uv = v_pos / u_res - 0.5;
  uv.x *= u_res.x / u_res.y;
  col *= 1.0 - u_vignette * smoothstep(0.35, 1.1, length(uv));

  col = toSrgb(shoulder(col));
  col += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;
