// GLSL for the holo cards (WebGL2).
//
// The foil is a diffraction grating, the physics of a real holographic
// foil: it is embossed with grooves a micron or so apart, and light that
// reaches the eye off it obeys the grating equation
//     d · (sin θin + sin θout) = m · λ
// For each pixel, the half-way vector between the light and the eye (L + V)
// is projected onto the grating direction g (across the grooves, in the
// card's surface): the wavelength that order m sends to the eye is
// λ = d · |(L + V)·g| / m. That λ goes through a fit of the CIE colour
// matching functions to linear sRGB, for orders 1–3, so as the card or the
// light turns, bands of spectral colour sweep across the foil. Light only
// diffracts this way within a cone round the plane across the grooves:
// the further (L + V) leans along them, the dimmer (a Gaussian lobe).
//
// Each card lays its grooves out differently:
//   0 Prism    grooves radiating from the emblem (g runs round it): a
//              sunburst whose rays each catch a different colour, with the
//              period varied ray by ray
//   1 Lattice  a mosaic of tiny tiles, each with its own groove angle and
//              period (a "pixel hologram"): tiles flash in and out of colour
//   2 Ripple   grooves that flow in waves across the card: rivers of colour
//   3 back     a single grating slowly twisting across the face
//   emblems    fine concentric grooves (mask blue): rings of rainbow
// The pearl paper is thin-film interference instead: a coat a few hundred
// nanometres thick, whose two reflections add or cancel by wavelength
// depending on the angle you see it from (a faint pink-to-green sheen).
// Then: an embossed height map tilts the normals, sparse micro-facets
// glint as their angle passes, the cards cast soft shadows on each other
// and on the stage, and a filmic shoulder keeps the flares from clipping.

export const CARD_VERTEX = `#version 300 es
layout(location = 0) in vec2 aPos;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform float uBend;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vTanX;
out vec3 vTanY;
out vec2 vLocal;
void main() {
  // a gentle bow across the card (z = bend · x²)
  vec3 p = vec3(aPos, uBend * aPos.x * aPos.x);
  vec3 n = normalize(vec3(-2.0 * uBend * aPos.x, 0.0, 1.0));
  vec3 tx = normalize(vec3(1.0, 0.0, 2.0 * uBend * aPos.x));
  mat3 r = mat3(uModel);
  vec4 world = uModel * vec4(p, 1.0);
  vWorld = world.xyz;
  vNormal = r * n;
  vTanX = r * tx;
  vTanY = r * vec3(0.0, 1.0, 0.0);
  vLocal = aPos;
  gl_Position = uViewProj * world;
}
`;

const COMMON = `
float sdCard(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

export const CARD_FRAGMENT = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vTanX;
in vec3 vTanY;
in vec2 vLocal;
out vec4 outColor;

uniform sampler2DArray uPrint;
uniform sampler2DArray uMask;
uniform vec2 uTexel;
uniform float uLayer;
uniform float uBackLayer;
uniform int uPattern;
uniform float uPearl;
uniform vec2 uEmblem;      // card-local, front face
uniform vec2 uEmblemBack;  // card-local, back face
uniform float uLatticeCell;
uniform vec2 uHalf;
uniform float uRadius;
uniform vec3 uEye;
uniform vec3 uLight;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec3 uEnvTop;
uniform vec3 uEnvBottom;
uniform vec3 uSky;
uniform float uFoilGain;
uniform float uSparkle;
uniform float uEmboss;
uniform int uSelf;
uniform vec3 uCardC[3];
uniform vec3 uCardX[3];
uniform vec3 uCardY[3];
uniform vec3 uCardN[3];

${COMMON}

// CIE 1931 colour matching, multi-lobe Gaussian fit (Wyman, Sloan & Shirley 2013)
float lobe(float x, float mu, float s1, float s2) {
  float t = (x - mu) / (x < mu ? s1 : s2);
  return exp(-0.5 * t * t);
}
vec3 spectral(float l) {
  float X = 1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2);
  float Y = 0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1);
  float Z = 1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8);
  vec3 rgb = vec3(
    3.2406 * X - 1.5372 * Y - 0.4986 * Z,
    -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
    0.0557 * X - 0.2040 * Y + 1.0570 * Z);
  // out-of-gamut spectral hues: pull toward white a touch instead of clipping hard
  float lo = min(min(rgb.r, rgb.g), rgb.b);
  rgb -= min(lo, 0.0) * 0.35;
  return max(rgb, 0.0) * 0.6;
}

// orders 1–3 of a grating with period d (nm) across direction g, grooves along t
vec3 grating(vec3 h, vec3 g, vec3 t, float d, float sigma) {
  float u = abs(dot(h, g));
  float w = dot(h, t);
  float cone = exp(-w * w / (2.0 * sigma * sigma));
  float l = d * u;
  vec3 c = spectral(l) + spectral(l * 0.5) * 0.34 + spectral(l / 3.0) * 0.12;
  return c * cone;
}

// thin film (pearl): two-beam interference for a coat of thickness t (nm)
vec3 thinFilm(float cosV, float t) {
  float n = 1.42;
  float cosT = sqrt(max(0.0, 1.0 - (1.0 - cosV * cosV) / (n * n)));
  float opd = 2.0 * n * t * cosT;
  vec3 lambda = vec3(640.0, 545.0, 465.0);
  return 0.5 - 0.5 * cos(6.2831853 * opd / lambda);
}

const vec3 SOFTBOX = vec3(-0.5529, 0.6233, 0.5529);

float ggx(float ndh, float a) {
  float a2 = a * a;
  float d = ndh * ndh * (a2 - 1.0) + 1.0;
  return a2 / (3.14159 * d * d);
}

// the other cards' shadows on this one (soft, widening with the gap)
float cardShadow(vec3 p, vec3 dir, float maxT, float soft0, float softK, float strength) {
  float lit = 1.0;
  for (int i = 0; i < 3; i++) {
    if (i == uSelf) continue;
    vec3 n = uCardN[i];
    float denom = dot(dir, n);
    if (abs(denom) < 1e-3) continue;
    float t = dot(uCardC[i] - p, n) / denom;
    if (t <= 0.003 || t > maxT) continue;
    vec3 h = p + dir * t - uCardC[i];
    vec2 q = vec2(dot(h, uCardX[i]), dot(h, uCardY[i]));
    float d = sdCard(q, uHalf, uRadius);
    float w = soft0 + softK * t;
    lit *= 1.0 - strength * (1.0 - smoothstep(-w, w, d)) * smoothstep(0.04, 0.35, abs(denom));
  }
  return lit;
}

void main() {
  float dist = sdCard(vLocal, uHalf, uRadius);
  float aa = max(fwidth(dist), 1e-5);
  float cover = clamp(0.5 - dist / aa, 0.0, 1.0);
  if (cover <= 0.0) discard;

  bool front = gl_FrontFacing;
  vec2 lp = vLocal;
  vec3 N = normalize(vNormal);
  vec3 T = normalize(vTanX);
  vec3 B = normalize(vTanY);
  float layer = uLayer;
  int pattern = uPattern;
  vec2 emblem = uEmblem;
  float pearl = uPearl;
  if (!front) {
    N = -N;
    T = -T;
    lp.x = -lp.x;
    layer = uBackLayer;
    pattern = 3;
    emblem = uEmblemBack;
    pearl = 0.0;
  }
  vec2 uv = vec2(lp.x / (2.0 * uHalf.x) + 0.5, 0.5 - lp.y / (2.0 * uHalf.y));
  vec3 print = texture(uPrint, vec3(uv, layer)).rgb;
  vec4 mask = texture(uMask, vec3(uv, layer));

  // embossing: the height map's slope tilts the normal
  vec2 e = uTexel * 1.6;
  float hx = texture(uMask, vec3(uv + vec2(e.x, 0.0), layer)).g - texture(uMask, vec3(uv - vec2(e.x, 0.0), layer)).g;
  float hy = texture(uMask, vec3(uv - vec2(0.0, e.y), layer)).g - texture(uMask, vec3(uv + vec2(0.0, e.y), layer)).g;
  N = normalize(N - (T * hx + B * hy) * uEmboss);

  vec3 V = normalize(uEye - vWorld);
  vec3 toL = uLight - vWorld;
  float ld = length(toL);
  vec3 L = toL / ld;
  float atten = 1.6 / (1.0 + 0.16 * ld * ld);
  float lit = cardShadow(vWorld, L, ld, 0.003, 0.16, 0.82);
  // the cards just in front darken this one where they overlap (contact)
  float contact = cardShadow(vWorld, N, 0.5, 0.012, 0.55, 0.32);
  vec3 key = uLightColor * atten * lit;

  float ndl = max(dot(N, L), 0.0);
  float ndv = max(dot(N, V), 1e-3);
  vec3 H = normalize(L + V);
  float ndh = max(dot(N, H), 0.0);
  vec3 R = reflect(-V, N);
  // a studio: a dark room, brighter toward the ceiling, a big softbox up
  // to the left and a thin strip light on the right
  vec3 env = uEnvBottom + uEnvTop * 0.38 * smoothstep(0.05, 0.95, R.y);
  env += uEnvTop * 0.85 * smoothstep(0.7, 0.93, dot(R, SOFTBOX));
  env += uEnvTop * 0.55 * smoothstep(0.93, 0.985, dot(R, normalize(vec3(0.82, 0.1, 0.56))));
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

  // ink on paper (or on the pearl coat)
  vec3 paper = print * (uAmbient * contact + key * ndl * 0.9);
  if (pearl > 0.0) {
    float thick = 330.0 + 120.0 * sin(lp.x * 7.0 + lp.y * 5.0) + 60.0 * sin(lp.y * 17.0 - lp.x * 4.0);
    vec3 film = thinFilm(ndv, thick);
    paper *= mix(vec3(1.0), 0.84 + 0.34 * film, 0.55 * pearl);
  }
  // satin varnish: a soft highlight where the lamp reflects, the room at grazing angles
  paper += key * ggx(ndh, 0.22) * 0.012 + env * fresnel * 0.3 * contact;

  // the foil
  float secondary = mask.b;
  float foilAmt = max(mask.r, secondary);
  vec3 col = paper;
  if (foilAmt > 0.002) {
    vec2 g2;
    float period;
    float sigma;
    if (secondary > 0.5) {
      vec2 q = lp - emblem;
      g2 = q / max(length(q), 1e-4);
      period = 1050.0;
      sigma = 0.26;
    } else if (pattern == 0) {
      vec2 q = lp - emblem;
      vec2 radial = q / max(length(q), 1e-4);
      g2 = vec2(-radial.y, radial.x);
      float sector = floor((atan(q.y, q.x) / 6.2831853 + 0.5) * 72.0);
      period = 940.0 * (0.92 + 0.16 * hash12(vec2(sector, 7.0)));
      sigma = 0.3;
    } else if (pattern == 1) {
      vec2 r = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678) * (lp - emblem);
      vec2 cell = floor(r / uLatticeCell);
      // each tile its own grating, drifting in angle across the mosaic so
      // neighbours are related: colour moves through it in waves
      vec2 c = (cell + 0.5) * uLatticeCell;
      float a = 0.9 * sin(c.x * 5.0 + 0.6) + 0.7 * sin(c.y * 4.0 - 0.3) + (hash12(cell) - 0.5) * 0.7;
      g2 = vec2(cos(a), sin(a));
      period = 900.0 * (0.9 + 0.2 * hash12(cell + 17.0));
      sigma = 0.24;
    } else if (pattern == 2) {
      float a = 0.6 + 0.5 * sin(lp.y * 8.0 + 2.3 * sin(lp.x * 5.5 + lp.y * 2.0));
      g2 = vec2(cos(a), sin(a));
      period = 960.0;
      sigma = 0.3;
    } else {
      float a = 1.15 + lp.y * 0.9 + 0.25 * sin(lp.x * 4.0);
      g2 = vec2(cos(a), sin(a));
      period = 1000.0;
      sigma = 0.26;
    }
    vec3 g = normalize(T * g2.x + B * g2.y);
    vec3 t = normalize(cross(N, g));
    vec3 sky = normalize(vec3(-0.25, 0.9, 0.35));
    vec3 rainbow = grating(L + V, g, t, period, sigma) * key * uFoilGain;
    rainbow += grating(sky + V, g, t, period, 0.34) * uSky * contact * uFoilGain;
    // the softbox diffracts too: colour fringes round its reflection
    rainbow += grating(SOFTBOX + V, g, t, period, 0.3) * uEnvTop * 0.45 * contact * uFoilGain;
    vec3 metal = env * 0.55 * contact + key * ggx(ndh, 0.1) * 0.06;
    vec3 foil = (metal + rainbow) * print;

    // micro-facets glinting as the angle passes
    if (uSparkle > 0.0) {
      vec2 q = lp * 240.0;
      vec2 cell = floor(q);
      vec2 f = fract(q) - 0.5;
      float h = hash12(cell);
      if (h < 0.45) {
        vec2 j = vec2(hash12(cell + 3.7), hash12(cell + 9.1)) - 0.5;
        vec3 fn = normalize(N + (T * j.x + B * j.y) * 1.1);
        float r = max(dot(reflect(-L, fn), V), 0.0);
        float lod = clamp(1.6 - fwidth(q.x) * 1.4, 0.0, 1.0);
        float shape = smoothstep(0.42, 0.08, length(f - j * 0.25));
        foil += key * pow(r, 700.0) * 7.0 * shape * lod * uSparkle * lit;
      }
    }
    col = mix(paper, foil, foilAmt);
  }

  // the cut edge catches the light
  float edge = 1.0 - smoothstep(0.0, 2.2 * aa, -dist);
  col += edge * (uAmbient * 0.06 + key * 0.1 * (0.3 + 0.7 * ndl));

  // a soft filmic shoulder, then sRGB
  vec3 x = max(col, 0.0);
  vec3 over = max(x - 0.72, 0.0);
  x = min(x, 0.72) + 0.28 * (1.0 - exp(-over / 0.28));
  vec3 srgb = mix(x * 12.92, 1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, x));
  srgb += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(srgb * cover, cover);
}
`;

/**
 * The stage under the cards: their soft shadows (a key shadow toward the
 * light and a broad contact shadow straight behind) and, at night, a faint
 * pool of the lamp's light. Drawn as premultiplied black (and a little
 * additive warmth) over the page's tile colour.
 */
export const BACKDROP_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec4 uCam;       // cx, cy (device px, y down), F (device px per unit at z = 0 × eye distance), eye distance
uniform vec2 uCanvas;    // device px
uniform float uEyeY;
uniform float uBackZ;
uniform vec3 uLight;
uniform vec3 uCardC[3];
uniform vec3 uCardX[3];
uniform vec3 uCardY[3];
uniform vec3 uCardN[3];
uniform vec2 uHalf;
uniform float uRadius;
uniform vec4 uShade;     // key shadow, contact shadow, pool strength, unused
uniform vec3 uPool;

${COMMON}

float shadowOf(int i, vec3 p, vec3 dir, float soft0, float softK) {
  vec3 n = uCardN[i];
  float denom = dot(dir, n);
  if (abs(denom) < 1e-3) return 0.0;
  float t = dot(uCardC[i] - p, n) / denom;
  if (t <= 0.0) return 0.0;
  vec3 h = p + dir * t - uCardC[i];
  vec2 q = vec2(dot(h, uCardX[i]), dot(h, uCardY[i]));
  float d = sdCard(q, uHalf, uRadius);
  float w = soft0 + softK * t;
  // lighter the further the card floats, and a card edge-on to the light
  // (turning over) throws only a faint sliver
  return (1.0 - smoothstep(-w, w, d)) / (1.0 + 1.6 * t) * smoothstep(0.04, 0.35, abs(denom));
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y);
  float k = (uCam.w - uBackZ) / uCam.z;
  vec3 p = vec3((frag.x - uCam.x) * k, uEyeY + (uCam.y - frag.y) * k, uBackZ);
  vec3 toL = normalize(uLight - p);
  float keyLit = 1.0;
  float contactLit = 1.0;
  for (int i = 0; i < 3; i++) {
    keyLit *= 1.0 - shadowOf(i, p, toL, 0.03, 0.2);
    contactLit *= 1.0 - shadowOf(i, p, vec3(0.0, 0.0, 1.0), 0.05, 0.42);
  }
  float a = 1.0 - (1.0 - (1.0 - keyLit) * uShade.x) * (1.0 - (1.0 - contactLit) * uShade.y);
  // the lamp's pool on the stage (night)
  vec2 lp = p.xy - uLight.xy * 0.55;
  float pool = exp(-dot(lp, lp) / 1.6) * uShade.z * keyLit;
  float n = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  a = clamp(a + n, 0.0, 1.0);
  outColor = vec4(uPool * (pool + n) * (1.0 - a), a);
}
`;
