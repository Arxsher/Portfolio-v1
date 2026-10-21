// The ink's GLSL: a stable-fluids solver (advect, vorticity, divergence,
// pressure, gradient) on half-float targets, plus the pass that draws the
// dye as pigment on paper or as glowing ink in the dark.

/** Full-screen triangle with the four neighbour coordinates (uTexel apart). */
export const SIM_VERTEX = `#version 300 es
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  vL = p - vec2(uTexel.x, 0.0);
  vR = p + vec2(uTexel.x, 0.0);
  vT = p + vec2(0.0, uTexel.y);
  vB = p - vec2(0.0, uTexel.y);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
`;

/** Carry a field along the velocity (semi-Lagrangian), and let it fade. */
export const ADVECT = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uSimTexel;
uniform float uDt;
uniform float uKeep;
void main() {
  vec2 back = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  outColor = uKeep * texture(uSource, back);
}
`;

/** Add a soft blob: dye (uColor, uAmount in w), or a push (uColor.xy), or a radial bloom. */
export const SPLAT = `${HEAD}
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform float uAspect;
uniform float uRadius;
uniform vec4 uColor;
uniform float uRadial;
uniform float uCap;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float g = exp(-dot(p, p) / uRadius);
  vec4 base = texture(uTarget, vUv);
  vec4 add = uColor * g;
  if (uRadial > 0.5) {
    // a drop landing: water pushed out from where it fell
    float r = length(p);
    vec2 dir = r > 1e-5 ? p / r : vec2(0.0);
    dir.x /= uAspect;
    add = vec4(dir * uColor.x * g * smoothstep(0.0, sqrt(uRadius), r) * 2.0, 0.0, 0.0);
  }
  vec4 sum = base + add;
  // dye: keep the amount (w) under a cap, scaling the colour with it
  if (uCap > 0.0 && sum.w > uCap) sum *= uCap / sum.w;
  outColor = sum;
}
`;

export const CURL = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`;

/** Vorticity confinement: nudge the flow round its own curls so they don't smear out. */
export const VORTICITY = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= uStrength * C;
  force.y = -force.y;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(v, -2000.0, 2000.0), 0.0, 1.0);
}
`;

export const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  vec2 C = texture(uVelocity, vUv).xy;
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  // walls: the water can't leave the dish
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`;

/** Multiply a field (the last pressure, as a warm start). */
export const SCALE = `${HEAD}
uniform sampler2D uSource;
uniform float uValue;
void main() {
  outColor = uValue * texture(uSource, vUv);
}
`;

/** One Jacobi pass of the pressure solve. */
export const PRESSURE = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  outColor = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
}
`;

/** Take the pressure gradient off the velocity: what's left doesn't compress. */
export const GRADIENT = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - 0.5 * vec2(R - L, T - B);
  outColor = vec4(v, 0.0, 1.0);
}
`;

/** Plain copy (resampling a field into a new size). */
export const COPY = `${HEAD}
uniform sampler2D uSource;
void main() {
  outColor = texture(uSource, vUv);
}
`;

/**
 * The dish. The dye holds premultiplied ink colour (rgb) and amount (w).
 * On paper the ink absorbs: what it takes out is its amount less its
 * colour, so each ink removes its complement and inks mix toward black;
 * pigment gathers at the edges, and the amount read as a height gives a
 * wet sheen. In the dark the colour glows instead.
 */
export const DISPLAY = `${HEAD}
uniform sampler2D uDye;
uniform vec2 uDyeTexel;
uniform vec2 uRes;
uniform float uNight;
uniform vec3 uPaper;
uniform vec3 uDeep;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec4 d = max(texture(uDye, vUv), 0.0);
  float a = d.w;
  float aL = texture(uDye, vUv - vec2(uDyeTexel.x, 0.0)).w;
  float aR = texture(uDye, vUv + vec2(uDyeTexel.x, 0.0)).w;
  float aB = texture(uDye, vUv - vec2(0.0, uDyeTexel.y)).w;
  float aT = texture(uDye, vUv + vec2(0.0, uDyeTexel.y)).w;
  vec2 grad = vec2(aR - aL, aT - aB);
  float edge = clamp(length(grad) * 5.0, 0.0, 1.0);

  // the ink as a thin wet film: its slope catches a light from the top left
  vec3 n = normalize(vec3(-grad * 7.0, 1.0));
  vec3 h = normalize(vec3(-0.35, 0.5, 0.79) + vec3(0.0, 0.0, 1.0));
  float wet = smoothstep(0.02, 0.3, a);
  float spec = pow(max(dot(n, h), 0.0), 48.0) * wet;

  vec2 px = vUv * uRes;
  vec2 c = vUv - 0.5;
  float vignette = 1.0 - dot(c, c) * 0.5;

  // paper: long fibres and a fine tooth
  float fibre = noise(px * vec2(0.08, 0.6)) * 0.5 + noise(px * 0.25) * 0.35 + noise(px * 1.3) * 0.15;
  vec3 paper = uPaper * (0.975 + 0.05 * fibre) * mix(1.0, vignette, 0.35);
  vec3 absorb = max(vec3(a) - d.rgb, 0.0) * 1.35 + a * 0.14;
  absorb *= 1.0 + edge * 0.55;
  vec3 day = paper * exp(-absorb);
  day += vec3(spec * 0.16 * (1.0 - min(a, 1.0) * 0.4));

  // dark water: the ink glows, and its edges carry a faint light
  vec3 deep = uDeep * (0.85 + 0.3 * vignette) + vec3(noise(px * 0.02) * 0.012);
  vec3 glow = 1.0 - exp(-d.rgb * 1.25);
  vec3 night = deep + glow + spec * 0.1 + glow * edge * 0.25;

  vec3 col = mix(day, night, uNight);
  col += (hash(px + 17.0) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;
