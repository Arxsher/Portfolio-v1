// GLSL for Disintegrate (WebGL2). Four programs:
//
//   UPDATE    transform feedback: one vertex per particle, no raster. Moves
//             every loose particle on a breeze (a drifting curl-noise flow
//             plus the chosen wind), releases cells as the sweep passes
//             them, and on Undo steers each one home with an exactly
//             integrated, critically damped spring from wherever it is.
//   PARTICLE  an instanced quad per particle. Attached, it is exactly its
//             cell of the card (the cells tile the card without seams, so
//             the card IS its particles while it dissolves); loose, it is a
//             flake of the card that tumbles in 3D, catches the light,
//             glints, and opens into a soft disc as it drifts toward the
//             camera (depth of field). With SHADOW defined the same
//             program lays each loose flake's soft shadow on the stage.
//   CARD      a whole card as one quad (the intact front card and the
//             stack behind it), shaded by the same cardColor() as the
//             particles, so handing the card over to its particles is
//             invisible.
//   SHADOW    a card's soft shadow on the stage (ambient + contact), masked
//             by the release order so it goes as the card goes.
//
// World space is CSS px of the stage, origin at its centre, y up, z toward
// the viewer; the camera looks down -z from uDist (see project()).

const PROJECT = /* glsl */ `
uniform vec2 uView;
uniform float uDist;
vec4 project(vec3 w) {
  // the plane z = 0 maps 1:1 to CSS px; nearer things grow by D / (D - z)
  return vec4(w.x * 2.0 / uView.x, w.y * 2.0 / uView.y, 0.0, (uDist - w.z) / uDist);
}
`;

/** The card's colour at q (card px from the top-left, y down), premultiplied. */
const CARD_COLOR = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec2 uCard;
uniform vec4 uSlot;
uniform vec4 uFillSlot;
uniform vec4 uButton;
uniform float uButtonR;
uniform float uFill;
uniform float uHover;
uniform float uHoverMul;
uniform vec2 uShine;
uniform vec4 uGloss;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec4 cardColor(vec2 q) {
  vec4 c = texture(uAtlas, uSlot.xy + clamp(q / uCard, 0.0, 1.0) * uSlot.zw);
  vec2 bq = (q - uButton.xy) / uButton.zw;
  bool inPill = bq.x >= 0.0 && bq.x <= 1.0 && bq.y >= 0.0 && bq.y <= 1.0;
  if (inPill) {
    float pill = 1.0 - smoothstep(-0.5, 0.5, sdRound(q - uButton.xy - uButton.zw * 0.5, uButton.zw * 0.5, uButtonR));
    // hover and press: the pill's wash deepens (light) or lifts (dark)
    c.rgb = mix(c.rgb, c.rgb * uHoverMul, pill * uHover);
    if (uFill > 0.0) {
      // the hold reveals the filled pill from the left, with a bright lip on its edge
      vec4 f = texture(uAtlas, uFillSlot.xy + bq * uFillSlot.zw);
      float fx = uButton.x + uFill * uButton.z;
      float m = clamp((fx - q.x) / max(fwidth(q.x), 1e-3) + 0.5, 0.0, 1.0);
      c = f * m + c * (1.0 - f.a * m);
      float lip = exp(-abs(q.x - fx) * 0.45) * f.a * (1.0 - step(0.999, uFill));
      c.rgb += vec3(1.0, 0.86, 0.84) * lip * 0.28;
    }
  }
  // the glint that runs across the card when it is whole again
  float s = (q.x + q.y * 0.6) / (uCard.x + uCard.y * 0.6);
  float band = exp(-pow((s - uShine.x) * 7.0, 2.0)) * uShine.y;
  // a soft sheen where the light sits on the tilted card
  vec2 g = q - uGloss.xy;
  float gloss = exp(-dot(g, g) / (uGloss.w * uGloss.w)) * uGloss.z;
  c.rgb += vec3(band + gloss) * c.a;
  return c;
}
`;

const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 3D simplex noise with its analytic gradient (xyz) and value (w).
vec4 snoiseGrad(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  vec4 m2 = m * m;
  vec4 m4 = m2 * m2;
  vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
  vec4 t = m2 * m * pdotx;
  vec3 grad = -8.0 * (t.x * x0 + t.y * x1 + t.z * x2 + t.w * x3);
  grad += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
  return 42.0 * vec4(grad, dot(m4, pdotx));
}

// A divergence-free flow (the cross product of two noise gradients), so
// the dust swirls and folds without bunching up or thinning out.
vec3 curlFlow(vec3 q) {
  vec3 a = snoiseGrad(q).xyz;
  vec3 b = snoiseGrad(q + vec3(31.416, -17.13, 9.71)).xyz;
  return cross(a, b);
}
`;

export const UPDATE_VERTEX = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec4 aP;     // position (world), life (-1 attached, else seconds loose)
layout(location = 1) in vec4 aV;     // velocity (world px / s), tumble angle
layout(location = 2) in vec4 aHome;  // home (card px from the centre, y up), release order, return jitter
layout(location = 3) in vec4 aRand;
out vec4 vP;
out vec4 vV;

uniform mat4 uModel;
uniform float uDt;
uniform float uTime;
uniform int uMode;        // 1 breeze (cells go as the sweep passes), 2 return home, 3 snap home
uniform float uSweep;
uniform float uReturnT;
uniform vec3 uWind;
uniform float uCurl;
uniform float uCurlScale;
uniform vec4 uVortex;     // centre (world), swirl speed, outward speed
uniform float uLift;
uniform vec4 uStir;       // pointer (world), its velocity
uniform float uStirR;
uniform float uLeash;
uniform float uKick;
uniform float uDepth;     // the nearest z a particle may reach

${NOISE}

void main() {
  vec3 p = aP.xyz;
  float life = aP.w;
  vec3 v = aV.xyz;
  float angle = aV.w;
  float dt = uDt;
  vec3 home = (uModel * vec4(aHome.xy, 0.0, 1.0)).xyz;

  if (uMode == 3) {
    vP = vec4(home, -1.0);
    vV = vec4(0.0);
    return;
  }

  if (life < 0.0) {
    if (uMode == 1 && aHome.z < uSweep) {
      // let go: off the card's face, a little toward you, with the first of the breeze
      vec3 normal = normalize(mat3(uModel) * vec3(0.0, 0.0, 1.0));
      p = home;
      v = normal * uKick * (0.35 + 0.9 * aRand.x) + uWind * (0.08 + 0.12 * aRand.w)
        + vec3(aRand.y - 0.5, aRand.z - 0.5, 0.0) * uKick * 0.7;
      life = 0.0;
      angle = 0.0;
    } else {
      vP = vec4(home, -1.0);
      vV = vec4(0.0);
      return;
    }
  } else if (uMode == 1) {
    life += dt;
    float gust = smoothstep(0.0, 1.2, life);
    vec3 q = p * uCurlScale + vec3(0.0, -uTime * 0.21, uTime * 0.12);
    vec3 curl = curlFlow(q);
    vec3 target = uWind * (0.5 + 0.9 * aRand.w) * gust + curl * uCurl * (0.35 + 0.65 * gust);
    target.y += uLift * aRand.y * gust;
    vec2 d = p.xy - uVortex.xy;
    float rr = length(d) + 24.0;
    target.xy += (vec2(-d.y, d.x) * uVortex.z + d * uVortex.w) / rr * gust;
    // air drag toward the flow: light flakes follow it closely, heavy ones lag
    v += (target - v) * (1.0 - exp(-dt * (1.1 + aRand.x * 1.4)));
    // the pointer stirs the dust it passes through
    vec2 s = p.xy - uStir.xy;
    float f = exp(-dot(s, s) / (uStirR * uStirR));
    v.xy += uStir.zw * f * (1.0 - exp(-dt * 10.0));
    v.z += length(uStir.zw) * f * 0.25 * (aRand.z - 0.3) * (1.0 - exp(-dt * 10.0));
    // stay in front of the stage, and out of the camera
    if (p.z < 0.0) v.z += -p.z * 8.0 * dt;
    if (p.z > uDepth) v.z -= (p.z - uDepth) * 8.0 * dt;
    // far off the stage, slow down (the dust is gone by then; Undo has less to fetch)
    if (length(p - home) > uLeash) v *= exp(-dt * 1.6);
    p += v * dt;
    angle += dt * (aRand.z * 2.0 - 1.0) * (2.5 + length(v) / 40.0);
  } else {
    // Undo: the cells that left last come back first, after a beat of turning round
    float wait = (1.0 - aHome.z) * 0.3 + aHome.w * 0.1;
    float t = uReturnT - wait;
    life = max(0.0, min(life, 3.6) - dt * 4.0);
    if (t < 0.0) {
      v *= exp(-dt * 4.0);
      p += v * dt;
    } else {
      vec3 x = p - home;
      float dist = length(x);
      // a little of the breeze still bends the way back, less as it nears home
      vec3 curl = curlFlow(p * uCurlScale + vec3(0.0, -uTime * 0.21, uTime * 0.12));
      v += curl * uCurl * 2.2 * clamp(dist / 220.0, 0.0, 1.0) * dt;
      // exact step of a critically damped spring: stable at any frame time
      float w = 7.0 + aRand.x * 3.5;
      vec3 j = v + w * x;
      float e = exp(-w * dt);
      x = (x + j * dt) * e;
      v = (v - w * j * dt) * e;
      p = home + x;
      if (dot(x, x) < 0.04 && dot(v, v) < 400.0 && t > 0.2) {
        p = home;
        v = vec3(0.0);
        life = -1.0;
        angle = 0.0;
      }
    }
    // the tumble comes to rest face up
    float rest = floor(angle / 6.2831853 + 0.5) * 6.2831853;
    angle = rest + (angle - rest) * exp(-dt * 7.0);
  }
  vP = vec4(p, life);
  vV = vec4(v, angle);
}
`;

export const UPDATE_FRAGMENT = /* glsl */ `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(0.0); }
`;

const ROTATE = /* glsl */ `
vec3 rotate(vec3 v, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

export const PARTICLE_VERTEX = (shadow: boolean) => /* glsl */ `#version 300 es
precision highp float;
${shadow ? "#define SHADOW" : ""}
layout(location = 0) in vec4 aP;
layout(location = 1) in vec4 aV;
layout(location = 2) in vec4 aHome;
layout(location = 3) in vec4 aRand;

uniform mat4 uModel;
uniform vec2 uCard;
uniform float uCell;
uniform float uScale;
uniform float uSweep;
uniform float uLoose;
uniform float uTime;
uniform int uMode;
uniform float uAlpha;
uniform vec3 uLight;
uniform vec3 uHalf;
uniform float uShadeAmt;
uniform float uSpark;
uniform float uGlowGain;
uniform float uShadowAlpha;

${PROJECT}
${ROTATE}

out vec2 vQ;
flat out vec2 vQc;
out vec2 vCorner;
flat out float vFree;
flat out float vAlpha;
flat out float vGlow;
flat out float vShade;
flat out float vSpark;
flat out float vBlur;

void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vec2 c = (corner - 0.5) * uCell;
  vec2 local = aHome.xy + c;
  vQ = vec2(local.x + uCard.x * 0.5, uCard.y * 0.5 - local.y);
  vQc = vec2(aHome.x + uCard.x * 0.5, uCard.y * 0.5 - aHome.y);
  vCorner = corner * 2.0 - 1.0;
  vSpark = 0.0;
  vBlur = 0.0;
  vShade = 1.0;

  float life = aP.w;
  float r = aHome.z;
#ifdef SHADOW
  if (life < 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vFree = 0.0;
    vAlpha = 0.0;
    vGlow = 0.0;
    return;
  }
  float fadeIn = 1.0 - smoothstep(1.3 + aRand.y * 1.3, 2.2 + aRand.y * 1.3, life);
  float h = max(aP.z, 0.0);
  float spread = 1.0 + h / 55.0;
  vec2 at = aP.xy + vec2(0.1, -0.32) * h + vec2(0.0, -3.0);
  vec2 off = c * uScale * spread * 1.25;
  gl_Position = project(vec3(at + off, 0.0));
  vFree = 1.0;
  vBlur = 1.0;
  vAlpha = uShadowAlpha * fadeIn / (spread * spread) * smoothstep(0.0, 6.0, h + 2.0);
  vGlow = 0.0;
#else
  if (life < 0.0) {
    // part of the card: exactly its cell; near the sweep's start, cells strain and fizz while you hold
    float edge = uLoose * 0.07;
    float loose = edge > 0.0 ? 1.0 - smoothstep(edge * 0.25, edge, r) : 0.0;
    vec2 jitter = (vec2(hash12(aRand.xy * 97.0 + floor(uTime * 24.0)), hash12(aRand.zw * 91.0 + floor(uTime * 24.0))) - 0.5) * uCell * 0.55 * loose;
    vec4 w = uModel * vec4(local + jitter, 0.0, 1.0);
    gl_Position = project(w.xyz);
    vFree = 0.0;
    vAlpha = uAlpha;
    float front = uMode == 1 && uSweep > 0.0 ? 1.0 - smoothstep(uSweep, uSweep + 0.075, r) : 0.0;
    vGlow = max(front, loose * 0.7) * uGlowGain;
    return;
  }
  vec3 axis = normalize(aRand.xyz - 0.5 + vec3(0.0, 0.0, 0.0001));
  float angle = aV.w;
  // toward the camera the flake falls out of focus and opens into a soft disc
  float blur = clamp((aP.z - 40.0) / 240.0, 0.0, 1.0);
  float grow = 1.0 + blur * 2.4;
  float erode = mix(1.0, 0.6, smoothstep(0.4, 3.0, life));
  vec3 flat3 = vec3(c * uScale * erode * grow, 0.0);
  vec3 off = mix(rotate(flat3, axis, angle), flat3, smoothstep(0.2, 0.7, blur));
  gl_Position = project(aP.xyz + off);
  vec3 n = rotate(vec3(0.0, 0.0, 1.0), axis, angle);
  float facing = abs(dot(n, uLight));
  vShade = mix(1.0, 0.58 + 0.52 * facing, uShadeAmt);
  float glint = max(dot(n, uHalf), -dot(n, uHalf));
  vSpark = pow(max(glint, 0.0), 60.0) * uSpark * (1.0 - blur);
  float fade = 1.0 - smoothstep(1.3 + aRand.y * 1.3, 2.2 + aRand.y * 1.3, life);
  vAlpha = uAlpha * fade / pow(grow, 1.3);
  vBlur = blur;
  vFree = 1.0;
  if (uMode == 2) {
    vec3 home = (uModel * vec4(aHome.xy, 0.0, 1.0)).xyz;
    vGlow = 0.4 * smoothstep(1.5, 90.0, length(aP.xyz - home)) * uGlowGain;
  } else {
    vGlow = exp(-life * 2.6) * uGlowGain;
  }
#endif
}
`;

export const PARTICLE_FRAGMENT = (shadow: boolean) => /* glsl */ `#version 300 es
precision highp float;
${shadow ? "#define SHADOW" : ""}
in vec2 vQ;
flat in vec2 vQc;
in vec2 vCorner;
flat in float vFree;
flat in float vAlpha;
flat in float vGlow;
flat in float vShade;
flat in float vSpark;
flat in float vBlur;
uniform vec3 uGlowColor;
out vec4 outColor;

${CARD_COLOR}

void main() {
#ifdef SHADOW
  float d = length(vCorner);
  float m = 1.0 - smoothstep(0.2, 1.0, d);
  outColor = vec4(0.0, 0.0, 0.0, m * vAlpha);
#else
  if (vFree < 0.5) {
    vec4 c = cardColor(vQ);
    c.rgb += uGlowColor * vGlow * c.a;
    outColor = c * vAlpha;
    return;
  }
  float b = smoothstep(0.1, 0.55, vBlur);
  vec4 c = cardColor(mix(vQ, vQc, b));
  float sq = max(abs(vCorner.x), abs(vCorner.y));
  float d = mix(sq, length(vCorner), b);
  float aa = max(fwidth(d), 1e-3);
  float soft = mix(aa * 1.25, 0.95, b);
  float mask = 1.0 - smoothstep(1.0 - soft, 1.0, d);
  c.rgb *= vShade;
  c.rgb += (uGlowColor * vGlow + vec3(vSpark)) * c.a;
  outColor = c * (mask * vAlpha);
#endif
}
`;

export const CARD_VERTEX = /* glsl */ `#version 300 es
precision highp float;
uniform mat4 uModel;
uniform vec2 uCard;
${PROJECT}
out vec2 vQ;
void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vec2 local = (corner - 0.5) * uCard;
  vQ = vec2(local.x + uCard.x * 0.5, uCard.y * 0.5 - local.y);
  gl_Position = project((uModel * vec4(local, 0.0, 1.0)).xyz);
}
`;

export const CARD_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vQ;
uniform vec4 uTint;
uniform float uAlpha;
out vec4 outColor;
${CARD_COLOR}
void main() {
  vec4 c = cardColor(vQ);
  c.rgb *= uTint.rgb;
  outColor = c * (uTint.a * uAlpha);
}
`;

export const SHADOW_VERTEX = /* glsl */ `#version 300 es
precision highp float;
uniform vec4 uRect;    // centre (world), half size (world)
uniform float uMargin;
${PROJECT}
out vec2 vP;
void main() {
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1));
  vec2 half_ = uRect.zw + uMargin;
  vP = (corner * 2.0 - 1.0) * half_;
  gl_Position = project(vec3(uRect.xy + vP, 0.0));
}
`;

export const SHADOW_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec2 vP;
uniform vec4 uRect;
uniform float uRadius;
uniform vec4 uAmbient;  // offset x, y, blur, strength
uniform vec4 uContact;
uniform sampler2D uOrder;
uniform float uFront;   // cells with release order above this are still on the card
out vec4 outColor;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float layer(vec4 l) {
  vec2 p = vP - l.xy;
  float d = sdRound(p, uRect.zw - l.z * 0.35, uRadius);
  return (1.0 - smoothstep(-l.z, l.z, d)) * l.w;
}

void main() {
  float a = layer(uAmbient) + layer(uContact);
  if (uFront > -0.5) {
    vec2 uv = vec2(vP.x / (2.0 * uRect.z) + 0.5, 0.5 - vP.y / (2.0 * uRect.w));
    float r = texture(uOrder, clamp(uv, 0.0, 1.0)).r;
    a *= smoothstep(uFront - 0.02, uFront + 0.09, r);
  }
  outColor = vec4(0.0, 0.0, 0.0, a);
}
`;
