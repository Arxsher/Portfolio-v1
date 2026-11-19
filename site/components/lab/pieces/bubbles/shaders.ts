// The bubbles' GLSL: a soft room behind them (BACKDROP), each bubble an
// instanced quad shaded as a wobbling sphere of soap film (thin-film
// interference over nine wavelengths, reflecting a small studio by its
// Fresnel term, with premultiplied alpha), and the droplets of a burst.

export const BACKDROP = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uNight;
uniform vec2 uRes;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  // light from the windows up and to the left
  vec2 c = vUv - vec2(0.3, 0.85);
  float glow = exp(-dot(c, c) * 2.2);
  vec3 day = mix(vec3(0.84, 0.865, 0.89), vec3(0.95, 0.955, 0.965), smoothstep(0.0, 1.0, vUv.y)) + glow * 0.04;
  vec3 night = mix(vec3(0.01, 0.01, 0.014), vec3(0.03, 0.032, 0.04), smoothstep(0.0, 1.0, vUv.y)) + glow * vec3(0.03, 0.035, 0.05);
  vec3 col = mix(day, night, uNight);
  col += (hash(vUv * uRes) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;

export const BUBBLE_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 iA;
in vec4 iB;
in vec4 iC;
uniform vec2 uView;
out vec2 vQ;
flat out vec4 vA;
flat out vec4 vB;
flat out vec4 vC;
void main() {
  // room for the wobble
  float m = 1.0 + abs(iB.x) + abs(iB.y) + 0.06;
  vQ = aCorner * m;
  vec2 px = iA.xy + vec2(aCorner.x, -aCorner.y) * iA.z * m;
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
  vA = iA;
  vB = iB;
  vC = iC;
}
`;

export const BUBBLE = `#version 300 es
precision highp float;
in vec2 vQ;
flat in vec4 vA;
flat in vec4 vB;
flat in vec4 vC;
out vec4 outColor;
uniform float uTime;
uniform float uNight;

const float PI = 3.14159265;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y),
    u.z);
}

/** One window of the studio as seen along r: a bright pane with a cross of mullions. */
float pane(vec3 r, vec3 dir, vec2 size) {
  float facing = dot(r, dir);
  if (facing <= 0.05) return 0.0;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), dir));
  vec3 up = cross(dir, right);
  vec2 uv = vec2(dot(r, right), dot(r, up)) / facing;
  vec2 d = abs(uv) - size;
  float box = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  float bars = min(abs(uv.x), abs(uv.y));
  return smoothstep(0.025, 0.0, box) * smoothstep(0.006, 0.016, bars) + exp(-max(box, 0.0) * 12.0) * 0.12;
}

/** What the film reflects: a soft ceiling, a darker floor, two windows. */
vec3 studio(vec3 r) {
  vec3 ceiling = mix(vec3(0.93, 0.95, 0.99), vec3(0.16, 0.18, 0.24), uNight);
  vec3 floorC = mix(vec3(0.36, 0.37, 0.4), vec3(0.02, 0.02, 0.03), uNight);
  vec3 col = mix(floorC, ceiling, smoothstep(-0.4, 0.5, r.y));
  col += pane(r, normalize(vec3(-0.5, 0.55, 0.67)), vec2(0.24, 0.32)) * mix(2.4, 3.6, uNight);
  col += pane(r, normalize(vec3(0.66, 0.2, 0.72)), vec2(0.11, 0.17)) * mix(1.2, 2.0, uNight) * vec3(1.0, 0.92, 0.8);
  return col;
}

/** 1 - cos of the phase difference, averaged over three wavelengths (nm). */
float film(float path, vec3 lambda) {
  vec3 c = cos(2.0 * PI * path / lambda);
  return 1.0 - (c.x + c.y + c.z) / 3.0;
}

void main() {
  float R = vA.z;
  float rad = length(vQ);
  float th = atan(vQ.y, vQ.x);
  float shape = 1.0 + vB.x * cos(2.0 * th - vB.z) + vB.y * cos(3.0 * th - vB.w);
  float s = rad / shape;
  float aa = 1.4 / max(R * shape, 1.0);
  if (s > 1.0 + aa) discard;
  vec2 q = vQ / shape;
  float q2 = min(dot(q, q), 0.9995);
  vec3 n = vec3(q, sqrt(1.0 - q2));

  // a burst: a hole racing round the film from where it broke, a thick rim at its edge
  float rim = 0.0;
  if (vC.z >= 0.0) {
    vec3 p0 = normalize(vec3(cos(vC.w) * 0.55, sin(vC.w) * 0.55, 0.83));
    float ang = acos(clamp(dot(n, p0), -1.0, 1.0));
    float hole = vC.z * 3.4;
    if (ang < hole) discard;
    rim = 1.0 - smoothstep(0.0, 0.18, ang - hole);
  }

  // the film: draining to the bottom, swirling, thinning with age (nm)
  float drain = 0.5 - 0.5 * n.y;
  vec3 flow = vec3(vA.w * 17.0, uTime * 0.09, vA.w * 5.0);
  float swirl = noise(n * 2.3 + flow) * 0.6 + noise(n * 5.1 - flow * 1.7) * 0.4;
  float thick = 0.2 + 0.55 * drain + 0.5 * (swirl - 0.5) - vC.x * 0.45 * (1.0 - drain);
  float d = 90.0 + 760.0 * clamp(thick, 0.0, 1.0);
  d = mix(d, 1100.0, rim);

  // interference: the extra path through the film at this angle
  float cosV = n.z;
  float cosT = sqrt(1.0 - (1.0 - cosV * cosV) / 1.769);
  float path = 2.0 * 1.33 * d * cosT;
  vec3 tint = vec3(film(path, vec3(610.0, 650.0, 690.0)), film(path, vec3(510.0, 540.0, 570.0)), film(path, vec3(430.0, 460.0, 490.0)));

  float F = 0.04 + 0.96 * pow(1.0 - cosV, 5.0);
  vec3 r = vec3(2.0 * n.z * n.x, 2.0 * n.z * n.y, 2.0 * n.z * n.z - 1.0);
  vec3 light = studio(r) * F * tint;
  float alpha = F * (tint.r + tint.g + tint.b) / 3.0;
  // on paper the very edge reads as a fine darker line
  alpha += smoothstep(0.9, 1.0, s) * 0.12 * (1.0 - uNight);
  light += rim * vec3(0.5) * mix(0.6, 1.0, uNight);
  alpha = clamp(alpha + rim * 0.35, 0.0, 1.0);

  float edge = smoothstep(1.0 + aa, 1.0 - aa, s);
  outColor = vec4(light, alpha) * edge;
}
`;

export const DROP_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 iD;
uniform vec2 uView;
out vec2 vQ;
flat out float vAlpha;
void main() {
  vQ = aCorner;
  vec2 px = iD.xy + aCorner * (iD.z + 1.0);
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
  vAlpha = iD.w;
}
`;

export const DROP = `#version 300 es
precision highp float;
in vec2 vQ;
flat in float vAlpha;
out vec4 outColor;
uniform float uNight;
void main() {
  float d = length(vQ);
  float a = smoothstep(1.0, 0.45, d) * vAlpha;
  vec3 c = mix(vec3(0.42, 0.45, 0.5), vec3(0.92, 0.95, 1.0), uNight);
  outColor = vec4(c * a, a);
}
`;
