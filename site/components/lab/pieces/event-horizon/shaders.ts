// Event horizon's GLSL. SCENE traces a ray per pixel through the bent space
// round a Schwarzschild hole (radius 1), picking up the accretion disk each
// time it crosses the plane y = 0, then the sky it ends up pointing at.
// PRESENT scales the scene up to the canvas with a glow from its mipmaps.

export const SCENE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform vec2 uRes;
uniform vec3 uCam;
uniform mat3 uBasis;
uniform float uTanHalf;
uniform float uTime;
uniform float uNight;
uniform vec4 uFlares[4];

const float PI = 3.14159265;
const float R_IN = 2.6;
const float R_OUT = 11.0;
const int STEPS = 150;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(vec3(i, 1.0));
  float b = hash(vec3(i + vec2(1.0, 0.0), 1.0));
  float c = hash(vec3(i + vec2(0.0, 1.0), 1.0));
  float d = hash(vec3(i + vec2(1.0, 1.0), 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return v;
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1, 0, 0));
  float n010 = hash(i + vec3(0, 1, 0));
  float n110 = hash(i + vec3(1, 1, 0));
  float n001 = hash(i + vec3(0, 0, 1));
  float n101 = hash(i + vec3(1, 0, 1));
  float n011 = hash(i + vec3(0, 1, 1));
  float n111 = hash(i + vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}

/** Ember → gold → white-blue. */
vec3 heat(float t) {
  vec3 ember = vec3(1.0, 0.28, 0.05);
  vec3 gold = vec3(1.0, 0.7, 0.36);
  vec3 white = vec3(0.86, 0.92, 1.0);
  return t < 1.0 ? mix(ember, gold, smoothstep(0.0, 1.0, t)) : mix(gold, white, smoothstep(1.0, 2.2, t));
}

/** The disk where a ray crossed it: emitted light (rgb) and opacity (a). */
vec4 disk(vec3 p, vec3 dir) {
  float r = length(p.xz);
  // Kepler: v = sqrt(M / r) with M = 1/2 (the horizon at r = 1); spun up 3x to read
  float v = sqrt(0.5 / r);
  float omega = v / r * 3.0;
  float a = uTime * omega;
  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  float phi = atan(q.y, q.x);
  // turbulence sheared along the orbit, and fine rings
  float n = fbm(q * 1.3 + vec2(r * 0.7)) * 0.65 + fbm(vec2(r * 5.5, phi * 2.0 + r)) * 0.35;
  float rings = 0.6 + 0.4 * sin(r * 10.0 + n * 6.0);
  float density = smoothstep(R_IN, R_IN + 0.35, r) * smoothstep(R_OUT, R_OUT - 5.0, r);
  density *= 0.35 + 0.9 * n * rings;

  // flares: clumps of gas dropped in, orbiting and fading
  float flare = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 f = uFlares[i];
    if (f.w <= 0.0) continue;
    float age = uTime - f.z;
    float fo = sqrt(0.5 / f.x) / f.x * 3.0;
    float ang = f.y + age * fo;
    vec2 c = f.x * vec2(cos(ang), sin(ang));
    vec2 d = p.xz - c;
    // smeared along the orbit as it shears
    vec2 t = vec2(-sin(ang), cos(ang));
    float along = dot(d, t);
    float across = dot(d, vec2(cos(ang), sin(ang)));
    float stretch = 0.35 + age * 0.45;
    float g = exp(-(along * along) / (stretch * stretch) - (across * across) / 0.08);
    flare += g * f.w * exp(-age * 0.45) * smoothstep(0.0, 0.25, age);
  }
  density += flare * 1.5;

  // temperature: hotter inside, zero at the inner edge
  float temp = pow(R_IN / r, 0.75) * pow(max(1.0 - sqrt(R_IN / r) * 0.9, 0.0), 0.25) * 2.2;
  temp += flare * 0.9;
  // beaming: gas moving toward us is brighter and bluer
  vec3 vel = normalize(vec3(-p.z, 0.0, p.x)) * v;
  float beta = length(vel);
  float gamma = inversesqrt(1.0 - beta * beta);
  float doppler = 1.0 / (gamma * (1.0 + dot(vel, normalize(dir))));
  float redshift = sqrt(max(1.0 - 1.0 / r, 0.0));
  float shift = doppler * redshift;
  vec3 light = heat(temp * shift * 1.25) * pow(shift, 3.0) * temp * 2.4;
  float alpha = clamp(density * 0.9, 0.0, 1.0);
  return vec4(light * (0.4 + density), alpha);
}

/** The night sky: two layers of stars and a faint band of nebula. */
vec3 nightSky(vec3 d) {
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float scale = k == 0 ? 60.0 : 150.0;
    float keep = k == 0 ? 0.965 : 0.93;
    vec3 p = d * scale;
    vec3 id = floor(p);
    float h = hash(id);
    if (h > keep) {
      vec3 off = hash3(id) - 0.5;
      vec3 f = fract(p) - 0.5 - off * 0.6;
      float dist = length(f);
      float b = smoothstep(0.16, 0.0, dist) * (h - keep) / (1.0 - keep);
      float tw = 0.75 + 0.25 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
      vec3 tint = mix(vec3(1.0, 0.82, 0.7), vec3(0.75, 0.85, 1.0), hash3(id + 7.0).x);
      col += tint * b * (k == 0 ? 3.0 : 1.4) * tw;
    }
  }
  vec3 bandN = normalize(vec3(0.3, 1.0, -0.2));
  float band = exp(-abs(dot(d, bandN)) * 5.0);
  float neb = noise3(d * 3.0) * 0.6 + noise3(d * 7.0) * 0.4;
  col += band * neb * mix(vec3(0.18, 0.08, 0.3), vec3(0.05, 0.16, 0.24), noise3(d * 2.0 + 4.0)) * 0.9;
  return col;
}

/** The day sky: a printed grid of longitude and latitude on paper, with a few ink stars. */
vec3 daySky(vec3 d) {
  vec3 paper = vec3(0.962, 0.952, 0.93);
  float lon = atan(d.z, d.x);
  float lon2 = atan(-d.z, -d.x);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  float cell = PI / 12.0;
  vec2 g = vec2(lon, lat) / cell;
  vec2 fw = vec2(min(fwidth(lon), fwidth(lon2)), fwidth(lat)) / cell;
  vec2 dist = abs(fract(g + 0.5) - 0.5);
  vec2 line = 1.0 - smoothstep(vec2(0.0), fw * 1.2 + 0.012, dist);
  // fade where the bending is too steep to draw a line
  vec2 fade = 1.0 - smoothstep(vec2(0.25), vec2(0.9), fw);
  float grid = max(line.x * fade.x, line.y * fade.y);
  vec2 major = abs(fract(g / 3.0 + 0.5) - 0.5) * 3.0;
  float strong = max((1.0 - smoothstep(0.0, fw.x * 1.4 + 0.02, major.x)) * fade.x, (1.0 - smoothstep(0.0, fw.y * 1.4 + 0.02, major.y)) * fade.y);
  vec3 ink = vec3(0.32, 0.3, 0.28);
  vec3 col = mix(paper, ink, grid * 0.22 + strong * 0.2);
  // the equator a touch warmer
  float eq = 1.0 - smoothstep(0.0, fw.y * 1.4 + 0.02, abs(g.y));
  col = mix(col, vec3(0.75, 0.38, 0.2), eq * fade.y * 0.35);
  // ink stars
  vec3 p = d * 70.0;
  vec3 id = floor(p);
  float h = hash(id);
  if (h > 0.975) {
    vec3 f = fract(p) - 0.5 - (hash3(id) - 0.5) * 0.6;
    col = mix(col, ink * 0.6, smoothstep(0.14, 0.04, length(f)) * 0.8);
  }
  return col;
}

void main() {
  vec2 ndc = (vUv * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0);
  vec3 dir = normalize(uBasis * vec3(ndc * uTanHalf, -1.0));
  vec3 pos = uCam;
  vec3 hv = cross(pos, dir);
  float h2 = dot(hv, hv);

  vec3 glow = vec3(0.0);
  float alpha = 0.0;
  bool captured = false;
  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    // finer steps near the hole and near the disk plane
    float dt = clamp(0.085 * r, 0.025, 1.2) * mix(0.5, 1.0, smoothstep(0.0, 0.6, abs(pos.y)));
    vec3 prev = pos;
    // light bends toward the hole: the photon's equation in Schwarzschild space
    dir += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    pos += dir * dt;
    if (prev.y * pos.y < 0.0) {
      vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
      float rr = length(hit.xz);
      if (rr > R_IN * 0.95 && rr < R_OUT) {
        vec4 c = disk(hit, dir);
        glow += (1.0 - alpha) * c.rgb * c.a;
        alpha += (1.0 - alpha) * c.a;
      }
    }
    if (r < 1.0) {
      captured = true;
      break;
    }
    if (alpha > 0.985) break;
    if (r > 40.0 && dot(pos, dir) > 0.0) break;
  }

  vec3 d = normalize(dir);
  // both skies every pixel: the grid's line widths need derivatives in uniform flow
  vec3 starSky = nightSky(d);
  vec3 gridSky = daySky(d);
  // night: light adds up, then a soft shoulder
  vec3 sky = captured ? vec3(0.0) : starSky;
  vec3 night = 1.0 - exp(-(glow + (1.0 - alpha) * sky) * 1.15);
  // day: the disk is printed in warm inks over the grid
  vec3 paperSky = captured ? vec3(0.045, 0.043, 0.05) : gridSky;
  float lum = 1.0 - exp(-dot(glow, vec3(0.3, 0.5, 0.2)) * 1.6 / max(alpha, 0.05));
  vec3 diskInk = mix(vec3(0.52, 0.1, 0.05), vec3(0.98, 0.62, 0.2), clamp(lum, 0.0, 1.0));
  diskInk = mix(diskInk, vec3(1.0, 0.93, 0.75), smoothstep(0.85, 1.0, lum));
  vec3 day = mix(paperSky, diskInk, alpha);
  outColor = vec4(mix(day, night, uNight), 1.0);
}
`;

export const PRESENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uNight;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  vec3 col = textureLod(uScene, vUv, 0.0).rgb;
  // a glow from the mipmaps: wide in the dark, a faint warmth on paper
  vec3 g = textureLod(uScene, vUv, 2.5).rgb * 0.5 + textureLod(uScene, vUv, 4.0).rgb * 0.35 + textureLod(uScene, vUv, 5.5).rgb * 0.15;
  vec3 bright = max(g - 0.25, 0.0);
  col += bright * mix(0.08, 0.55, uNight);
  vec2 c = vUv - 0.5;
  col *= mix(1.0, 1.0 - dot(c, c) * 0.5, uNight);
  col += (hash(vUv * uRes) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;
