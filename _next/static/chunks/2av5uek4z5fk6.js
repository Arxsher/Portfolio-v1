(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,10806,e=>{"use strict";var t=e.i(43476),a=e.i(71645),o=e.i(16442),r=e.i(37047),l=e.i(45219);function n({size:e=16,className:a}){return(0,t.jsxs)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:a?`shrink-0 ${a}`:"shrink-0",children:[(0,t.jsx)("circle",{cx:"8",cy:"8",r:"1.1",fill:"currentColor"}),(0,t.jsx)("path",{d:"M8 4.6a3.4 3.4 0 1 1-3.3 2.6",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round"}),(0,t.jsx)("path",{d:"M8 1.75a6.25 6.25 0 1 1-6.1 4.9",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",opacity:"0.55"})]})}var i=e.i(55171),s=e.i(3240);let u=2*Math.PI,h=u/7;function f(e){let[t,a,o]=e.split("-").map(Number);return Math.round(Date.UTC(t,(a||1)-1,o||1)/864e5)}let c=new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",timeZone:"UTC"}),d=new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",timeZone:"UTC"}),p=new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",timeZone:"UTC"}),m=(e,t)=>1===e?t:`${t}s`,v=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];function g(e,t){let a=.6*Math.sin(3*e+1.3+9*t)+.4*Math.sin(5*e+4.1-13*t),o=Math.sin(11*e+23*t+.7);return t*(1+.0075*a+.0028*o)}function x(e,t,a){let o=e.n,r=Math.max(0,Math.min(o,t)),l=Math.floor(r),n=Math.min(o,l+1),i=a/u*512;i-=512*Math.floor(i/512);let s=Math.floor(i)%512,h=(s+1)%512,f=i-Math.floor(i),c=e.bounds,d=c[512*l+s]+(c[512*l+h]-c[512*l+s])*f,p=c[512*n+s]+(c[512*n+h]-c[512*n+s])*f;return d+(p-d)*(r-l)}function b(e,t,a){let o=g(t,a),r=e.n,l=x(e,0,t);if(o<l)return o/l-1;let n=0,i=r;if(o>=x(e,r,t))return r+(o-x(e,r,t))/e.unit;for(;i-n>1;){let a=n+i>>1;x(e,a,t)<=o?n=a:i=a}let s=x(e,n,t),u=x(e,n+1,t);return n+(o-s)/Math.max(1e-6,u-s)}function w(e,t){let a=Math.atan2(e,-t);return a<0?a+u:a}function y(e,t){let a=t;for(let o=0;o<5;o++)a*=t/Math.max(1e-6,g(e,a));return a}function T(e,t,a){let o=t.weekday*h,r=x(e,t.week,o),l=x(e,t.week+1,o),n=y(o,(r+l)/2);return a.theta=o,a.r=n,a.x=Math.sin(o)*n,a.z=-Math.cos(o)*n,a}function k(e,t,a){if(!e.days.length)return null;if(!t)return a>=0?e.days[e.days.length-1]:e.days[0];let o=Math.max(0,Math.min(e.days.length-1,t.index+a));return e.days[o]}function R(e,t,a){if(!t)return k(e,null,a);let o=t.week+a;if(o<0||o>=e.n)return t;let r=e.weeks[o],l=r.days[t.weekday];if(l)return l;let n=null,i=1/0;for(let e of r.days){if(!e)continue;let a=Math.abs(e.weekday-t.weekday);a<i&&(i=a,n=e)}return n??t}let A=[[0,0,0,0],[.22,0,.0012,.22],[.74,0,.0034,.74],[1,0,.0095,1],[1,.0024,.024,1.2],[1,.0042,.16,2]],E=A.length,M=new Float32Array(257),F=new Float32Array(257),S=new Float32Array(257),z=`
precision highp float;
precision highp int;
precision highp sampler2D;
#define TAU 6.28318530718
#define PI 3.14159265359
#define SECTOR 0.897597901

uint hashu(uint x) {
  x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16;
  return x;
}
float hash2(ivec2 p) {
  return float(hashu(uint(p.x) * 0x9e3779b9U ^ hashu(uint(p.y) + 0x632be5abU))) * (1.0 / 4294967295.0);
}
float hash3(ivec3 p) {
  return float(hashu(uint(p.x) * 0x9e3779b9U ^ hashu(uint(p.y) * 0x85ebca6bU ^ hashu(uint(p.z) + 0xc2b2ae35U)))) * (1.0 / 4294967295.0);
}
float vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * (3.0 - 2.0 * f);
  ivec2 c = ivec2(i);
  float a = hash2(c);
  float b = hash2(c + ivec2(1, 0));
  float d = hash2(c + ivec2(0, 1));
  float e = hash2(c + ivec2(1, 1));
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * (3.0 - 2.0 * f);
  ivec3 c = ivec3(i);
  float n000 = hash3(c);
  float n100 = hash3(c + ivec3(1, 0, 0));
  float n010 = hash3(c + ivec3(0, 1, 0));
  float n110 = hash3(c + ivec3(1, 1, 0));
  float n001 = hash3(c + ivec3(0, 0, 1));
  float n101 = hash3(c + ivec3(1, 0, 1));
  float n011 = hash3(c + ivec3(0, 1, 1));
  float n111 = hash3(c + ivec3(1, 1, 1));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z);
}
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }
vec3 toSRGB(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
vec3 srgb(float r, float g, float b) { return toLinear(vec3(r, g, b) / 255.0); }
vec3 tonemap(vec3 x) {
  // Narkowicz's ACES fit
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
// the same small warp as rings.ts
float warpR(float th, float r) {
  float a = sin(3.0 * th + 1.3 + 9.0 * r) * 0.6 + sin(5.0 * th + 4.1 - 13.0 * r) * 0.4;
  float b = sin(11.0 * th + 23.0 * r + 0.7);
  return r * (1.0 + 0.0075 * a + 0.0028 * b);
}
float angleOf(vec2 xz) {
  float a = atan(xz.x, -xz.y);
  return a < 0.0 ? a + TAU : a;
}
// a lamp close by (dark theme): light falls off across the slice, 1 at its centre
float lampFall(vec3 p, vec4 lamp) {
  vec3 d = p - lamp.xyz;
  float a = 1.0 / (1.0 + dot(d, d) / 2.6);
  float a0 = 1.0 / (1.0 + dot(lamp.xyz, lamp.xyz) / 2.6);
  return mix(1.0, a / a0, lamp.w);
}
// GGX specular (normalised), times n\xb7l
float ggx(vec3 n, vec3 v, vec3 l, float rough, float f0) {
  vec3 h = normalize(v + l);
  float nl = max(dot(n, l), 0.0);
  float nv = max(dot(n, v), 1e-3);
  float nh = max(dot(n, h), 0.0);
  float a = rough * rough;
  float a2 = a * a;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * dd * dd);
  float k = a * 0.5;
  float G = (nl / (nl * (1.0 - k) + k)) * (nv / (nv * (1.0 - k) + k));
  float F = f0 + (1.0 - f0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
  return D * G * F / max(4.0 * nl * nv, 1e-3) * nl;
}
`,D=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,_=`#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
uniform mat4 uVP;
out vec3 vPos;
out vec3 vNrm;
out vec2 vUv;
void main() {
  vPos = aPos;
  vNrm = aNrm;
  vUv = aUv;
  gl_Position = uVP * vec4(aPos, 1.0);
}
`,L=`#version 300 es
uniform vec4 uRect;
void main() {
  // two triangles from six vertices
  int id = gl_VertexID % 6;
  vec2 q = id == 0 ? vec2(0.0, 0.0) : id == 1 ? vec2(1.0, 0.0) : id == 2 ? vec2(0.0, 1.0)
         : id == 3 ? vec2(1.0, 0.0) : id == 4 ? vec2(1.0, 1.0) : vec2(0.0, 1.0);
  gl_Position = vec4(mix(uRect.xy, uRect.zw, q), 0.0, 1.0);
}
`,N=`#version 300 es
${z}
uniform vec3 uLight;
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uEye;
uniform float uExposure;
uniform float uBump;
uniform vec4 uLamp;
in vec3 vPos;
in vec3 vNrm;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec3 N = normalize(vNrm);
  float th = vUv.x * TAU;
  float v = vUv.y;
  vec2 ring = vec2(sin(th), -cos(th));

  // fissures: noise on a fixed cylinder (stable while the trunk grows), stretched along the grain
  float height;
  vec3 albedo;
  if (v < 1.05) {
    // the top of the bark: cambium, inner bark, then the broken outer bark
    vec3 p = vec3(ring * 46.0, v * 6.0);
    float n1 = vnoise3(p);
    float n2 = vnoise3(p * 2.7 + 11.0);
    float plates = smoothstep(0.35, 0.75, n1 * 0.7 + n2 * 0.3);
    height = plates * smoothstep(0.3, 0.6, v);
    vec3 cambium = srgb(222.0, 204.0, 164.0);
    vec3 inner = srgb(124.0, 80.0, 52.0);
    vec3 outer = mix(srgb(66.0, 55.0, 48.0), srgb(118.0, 105.0, 94.0), plates);
    albedo = mix(cambium, inner, smoothstep(0.025, 0.06, v));
    albedo = mix(albedo, outer, smoothstep(0.14, 0.3, v));
    albedo *= 0.9 + 0.2 * n2;
  } else {
    // the side: long vertical ridges and deep furrows
    vec3 p = vec3(ring * 40.0, vPos.y * 9.0);
    float n1 = vnoise3(p);
    float n2 = vnoise3(p * vec3(2.3, 2.3, 1.6) + 7.0);
    float ridge = 1.0 - abs(2.0 * (n1 * 0.75 + n2 * 0.25) - 1.0);
    ridge = smoothstep(0.25, 0.9, ridge);
    height = ridge;
    albedo = mix(srgb(46.0, 38.0, 33.0), srgb(118.0, 104.0, 92.0), ridge);
    albedo *= 0.88 + 0.24 * vnoise3(p * 4.1 + 3.0);
  }

  // bump (surface gradient from screen derivatives)
  vec3 dpdx = dFdx(vPos);
  vec3 dpdy = dFdy(vPos);
  float dhx = dFdx(height);
  float dhy = dFdy(height);
  vec3 r1 = cross(dpdy, N);
  vec3 r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  vec3 bumped = normalize(abs(det) * N - grad * uBump);
  N = abs(det) > 1e-12 ? bumped : N;

  vec3 L = normalize(uLight);
  vec3 V = normalize(uEye - vPos);
  float ndl = max(dot(N, L), 0.0);
  // the floor occludes the foot of the side
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.06, vPos.y)) * (0.75 + 0.25 * height);
  vec3 sun = uSun * lampFall(vPos, uLamp);
  vec3 col = albedo * (sun * ndl + uSky * (0.55 + 0.45 * N.y) * ao);
  col += sun * ggx(N, V, L, 0.7, 0.03) * 0.25;
  outColor = vec4(toSRGB(tonemap(col * uExposure)), 1.0);
}
`,U=`#version 300 es
${z}
uniform sampler2D uView;
uniform vec2 uCentre;   // device px (y up)
uniform float uR;       // outer radius (device px)
uniform float uRim;     // rim width (device px)
uniform vec2 uShadowOff;
uniform float uShadowA;
uniform vec2 uLightDir; // toward the light, on screen (y up)
uniform float uDark;
uniform float uShow;
out vec4 outColor;

void main() {
  vec2 p = gl_FragCoord.xy - uCentre;
  float d = length(p);
  float R = uR;
  float Rg = max(R - uRim, 1.0);
  float edge = 1.0 - smoothstep(R - 0.8, R + 0.8, d);
  float sd = length(p - uShadowOff);
  float shadow = (1.0 - smoothstep(R * 0.7, R * 1.28, sd)) * uShadowA * uShow;
  if (edge <= 0.0 && shadow <= 0.002) discard;

  vec2 dir = d > 1e-3 ? p / d : vec2(0.0, 1.0);
  float rho = clamp(d / Rg, 0.0, 1.0);
  vec3 col;
  if (d < Rg + 0.5) {
    // glass: the magnified view, a little barrel at the edge and a colour fringe
    float k = 1.0 + 0.16 * rho * rho * rho;
    float ca = 0.014 * rho * rho;
    vec2 base = p / (2.0 * Rg);
    vec3 view;
    view.r = texture(uView, clamp(0.5 + base * k * (1.0 + ca), 0.0, 1.0)).r;
    view.g = texture(uView, clamp(0.5 + base * k, 0.0, 1.0)).g;
    view.b = texture(uView, clamp(0.5 + base * k * (1.0 - ca), 0.0, 1.0)).b;
    col = view;
    // inner edge shadow and the glass's own faint tint
    col *= 1.0 - 0.28 * smoothstep(0.78, 1.0, rho);
    // reflections: a soft crescent on the light's side, a small hot glint, a faint one opposite
    float facing = dot(dir, uLightDir);
    float crescent = smoothstep(0.72, 0.98, rho) * pow(max(facing, 0.0), 3.0);
    col += vec3(1.0, 0.98, 0.95) * crescent * mix(0.22, 0.16, uDark);
    vec2 gp = p - uLightDir * Rg * 0.6;
    float glint = exp(-dot(gp, gp) / (Rg * Rg * 0.0025));
    col += vec3(1.0) * glint * 0.3;
    col += vec3(1.0) * smoothstep(0.82, 0.98, rho) * pow(max(-facing, 0.0), 4.0) * 0.08;
  } else {
    // the steel rim: lit on the light's side, with a bright bevel and a dark lip
    float t = clamp((d - Rg) / uRim, 0.0, 1.0);
    float facing = dot(dir, uLightDir);
    float lit = 0.5 + 0.5 * facing;
    vec3 steelDark = mix(vec3(0.36, 0.37, 0.39), vec3(0.16, 0.15, 0.15), uDark);
    vec3 steelLight = mix(vec3(0.92, 0.92, 0.93), vec3(0.62, 0.56, 0.48), uDark);
    col = mix(steelDark, steelLight, pow(lit, 1.6));
    float bevel = exp(-pow((t - 0.3) / 0.16, 2.0));
    col += bevel * 0.35 * (0.35 + 0.65 * lit);
    col *= 1.0 - 0.35 * smoothstep(0.75, 1.0, t);
    col *= 1.0 - 0.3 * exp(-pow(t / 0.08, 2.0));
  }
  float a = edge * uShow;
  outColor = vec4(col * a, a + shadow * (1.0 - a));
}
`,P={tile:{shadowSteps:5,detail:!1,loupe:!1},stage:{shadowSteps:9,detail:!0,loupe:!0}};class B{gl;rings;floor;face;bark;loupe=null;uF;uFa;uB;uL=null;fieldTex;levelTex;outlineTex;faceVao;barkVao;emptyVao;faceVbo;barkVbo;faceIbo;barkIbo;mesh;grownNow=NaN;outlineHalf=new Uint16Array(256);msFbo=null;msColor=null;msDepth=null;resolveFbo=null;resolveTex=null;loupeSize=0;samples=4;constructor(e,t,a){this.gl=e,this.rings=a;const o=P[t];this.floor=(0,i.createProgram)(e,D,function(e){return`#version 300 es
${z}
uniform mat4 uInv;
uniform vec3 uLight;
uniform vec3 uBg;
uniform vec3 uPoolCol;
uniform float uShadowK;
uniform float uSoft;
uniform float uH;
uniform sampler2D uOutline;
uniform float uDialR;
uniform vec4 uDialCol;
uniform float uDpr;
uniform vec4 uLamp;
in vec2 vUv;
out vec4 outColor;

float outerAt(vec2 q) {
  return texture(uOutline, vec2(angleOf(q) / TAU, 0.5)).r;
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec4 a = uInv * vec4(ndc, -1.0, 1.0);
  vec4 b = uInv * vec4(ndc, 1.0, 1.0);
  vec3 ro = a.xyz / a.w;
  vec3 rd = b.xyz / b.w - ro;
  float t = -ro.y / min(rd.y, -1e-6);
  vec2 q = ro.xz + rd.xz * t;

  // contact: how far outside the trunk this point of the floor is
  float d0 = length(q) - outerAt(q);
  float ao = 1.0 - 0.42 * exp(-max(d0, 0.0) / 0.018) - 0.2 * exp(-max(d0, 0.0) / 0.11);

  // the cast shadow: walk the ray toward the light from the floor to the slice's top
  vec2 lxz = uLight.xz / max(uLight.y, 0.08);
  float occ = 1e4;
  for (int i = 0; i < ${e}; i++) {
    float f = (float(i) + 0.5) / float(${e});
    float h = f * uH;
    vec2 s = q + lxz * h;
    float d = length(s) - outerAt(s);
    float pen = 0.003 + h * uSoft;
    occ = min(occ, d / pen);
  }
  float shadow = 1.0 - smoothstep(-1.0, 1.0, occ);
  // the light's distance through the shadow softens and pales it further out
  shadow *= 1.0 - 0.35 * smoothstep(0.0, 0.9, d0);

  vec3 bg = toLinear(uBg);
  // a pool of light round the slice, leaning toward the lamp
  vec2 lh = uLight.xz / max(length(uLight.xz), 1e-4);
  vec2 pc = q - lh * 0.3;
  float pool = exp(-dot(pc, pc) / 0.75) * 0.75 + exp(-dot(pc, pc) / 2.4) * 0.25;
  pool *= min(lampFall(vec3(q.x, 0.0, q.y), uLamp), 1.6);
  // and it always fades out before the frame's edge, so the edge is the card's own colour
  pool *= 1.0 - smoothstep(0.45, 1.0, max(abs(ndc.x), abs(ndc.y)));
  vec3 col = bg * (1.0 - uShadowK * shadow) * ao + uPoolCol * pool * (1.0 - 0.9 * shadow) * ao;

  // the dial: a dotted ring with gaps where the weekdays are written
  vec2 fw = fwidth(q);
  float px = max(length(fw) * 0.7071, 1e-5);
  float rho = length(q);
  float phi = angleOf(q);
  float dots = 132.0;
  float cell = phi / TAU * dots;
  float along = (fract(cell) - 0.5) * (TAU / dots) * rho / px;
  float across = (rho - uDialR) / px;
  float rDot = 0.95 * uDpr;
  float dotMask = 1.0 - smoothstep(rDot - 0.6, rDot + 0.6, length(vec2(along, across)));
  // gaps for the labels
  float s = phi / SECTOR;
  float toLabel = abs(s - floor(s + 0.5)) * SECTOR;
  dotMask *= smoothstep(0.13, 0.17, toLabel);
  col = mix(col, toLinear(uDialCol.rgb), dotMask * uDialCol.a);

  vec3 outc = toSRGB(col);
  // a whisper of noise against banding
  outc += (hash2(ivec2(gl_FragCoord.xy)) - 0.5) / 255.0;
  outColor = vec4(outc, 1.0);
}
`}(o.shadowSteps)),this.face=(0,i.createProgram)(e,_,function(e){return`#version 300 es
${z}
#define DETAIL ${+!!e.detail}
uniform sampler2D uField;
uniform sampler2D uLevel;
uniform int uN;
uniform float uGrown;
uniform vec3 uLight;
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uEye;
uniform float uRelief;
uniform float uExposure;
uniform vec4 uSelA;
uniform vec4 uSelB;
uniform vec3 uLineCol;
uniform vec4 uKnock;
uniform vec4 uLamp;
uniform float uClose;
in vec3 vPos;
in vec3 vNrm;
in vec2 vUv;
out vec4 outColor;

const int TH = 512;
const int FR = 1024;

float fieldAt(float th01, float r) {
  float x = th01 * float(TH) - 0.5;
  float y = clamp(r * float(FR) - 0.5, 0.0, float(FR) - 1.001);
  float fx = floor(x);
  float fy = floor(y);
  vec2 f = vec2(x - fx, y - fy);
  int x0 = int(fx);
  x0 = x0 < 0 ? x0 + TH : (x0 >= TH ? x0 - TH : x0);
  int x1 = x0 + 1 >= TH ? 0 : x0 + 1;
  int y0 = int(fy);
  int y1 = min(y0 + 1, FR - 1);
  float a = texelFetch(uField, ivec2(x0, y0), 0).r;
  float b = texelFetch(uField, ivec2(x1, y0), 0).r;
  float c = texelFetch(uField, ivec2(x0, y1), 0).r;
  float d = texelFetch(uField, ivec2(x1, y1), 0).r;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float levelAt(int k, float th) {
  float s = th / SECTOR;
  s -= floor(s / 7.0) * 7.0;
  float fs = floor(s);
  int d0 = int(fs) % 7;
  int d1 = (d0 + 1) % 7;
  float u = s - fs;
  u = u * u * (3.0 - 2.0 * u);
  float a = texelFetch(uLevel, ivec2(d0, k), 0).r;
  float b = texelFetch(uLevel, ivec2(d1, k), 0).r;
  return mix(a, b, u);
}

float angleDiff(float a, float b) {
  float d = a - b;
  d -= TAU * floor(d / TAU + 0.5);
  return d;
}

// the outline of one selected day (sel: week, weekday, strength)
void selection(inout vec3 col, vec4 sel, float c, float aa, float th, float r, float px) {
  if (sel.z <= 0.002) return;
  // px from the segment's edges, positive inside
  float dRing = min(c - sel.x, sel.x + 1.0 - c) / aa;
  float dSec = (SECTOR * 0.5 - abs(angleDiff(th, sel.y * SECTOR))) * r / px;
  float edge = min(dRing, dSec);
  float inside = clamp(edge + 0.5, 0.0, 1.0);
  // a crisp line just inside the edge
  float line = 1.0 - smoothstep(0.55, 1.35, abs(edge - 0.85));
  col = mix(col, col * 1.04 + vec3(0.025, 0.018, 0.006), inside * sel.z);
  col = mix(col, uLineCol, line * sel.z * 0.95);
}

void main() {
  vec2 xz = vPos.xz;
  float r = length(xz);
  float th = angleOf(xz);
  float c = fieldAt(th / TAU, warpR(th, r));

  // the ring coordinate's gradient across the face (per unit), from screen derivatives
  vec2 dpx = dFdx(xz);
  vec2 dpy = dFdy(xz);
  float dcx = dFdx(c);
  float dcy = dFdy(c);
  float det = dpx.x * dpy.y - dpx.y * dpy.x;
  det = abs(det) < 1e-14 ? 1e-14 : det;
  vec2 g = vec2(dcx * dpy.y - dcy * dpx.y, dpx.x * dcy - dpy.x * dcx) / det;
  float gl = max(length(g), 1e-4);
  vec2 radial = r > 1e-5 ? xz / r : vec2(0.0, -1.0);
  // rings are near-circles: lean on the radial direction where the quad is noisy
  vec2 gdir = normalize(mix(radial, g / gl, 0.5));
  float px = sqrt(abs(det));
  float aa = clamp(gl * px, 1e-4, 4.0);

  float k = floor(c);
  float f = c - k;
  int ki = clamp(int(k), 0, uN - 1);
  float lev = c >= 0.0 ? levelAt(ki, th) : 0.0;

  // latewood: a band at the outer edge of each ring, wider and darker on busy days
  float lw = mix(0.18, 0.5, lev);
  float a0 = 1.0 - lw - 0.17;
  float a1 = 1.0 - lw + 0.07;
  float lmA = smoothstep(a0, a1, fract(c - 0.3 * aa));
  float lmB = smoothstep(a0, a1, fract(c + 0.3 * aa));
  float lm = 0.5 * (lmA + lmB);
  float tiny = smoothstep(0.22, 0.65, aa);
  lm = mix(lm, lw * 0.85, tiny);

  // colours (linear): pale sapwood round a warmer heartwood
  float n = float(uN);
  vec2 around = vec2(sin(th), -cos(th));
  float wobble = (vnoise3(vec3(around * 1.6, 0.5)) - 0.5) * 2.4;
  float heart = 1.0 - smoothstep(0.48 * n, 0.68 * n, c + wobble);
  vec3 early = mix(srgb(224.0, 199.0, 163.0), srgb(212.0, 174.0, 130.0), heart);
  vec3 late = mix(srgb(174.0, 133.0, 92.0), srgb(154.0, 108.0, 70.0), heart);
  // busy days: a wide band of dense, dark latewood
  vec3 busy = mix(srgb(100.0, 60.0, 34.0), srgb(90.0, 52.0, 30.0), heart);
  late = mix(late, busy, smoothstep(0.08, 0.95, lev));
  // figure: slow streaks in the tone along each ring, and fine fibres across it
  float figure = vnoise3(vec3(around * 6.0, c * 0.7)) * 0.6 + vnoise3(vec3(around * 21.0, c * 2.3)) * 0.4;
  float fibre = vnoise3(vec3(xz * 34.0, c * 23.0)) * 0.65 + vnoise3(vec3(xz * 90.0, c * 61.0)) * 0.35;
  float fibreVis = 1.0 - smoothstep(0.02, 0.09, aa);
  early *= 0.93 + 0.12 * figure;
  early *= 1.0 - 0.06 * lev;
  vec3 albedo = mix(early, late, lm);
  albedo *= 1.0 + (fibre - 0.5) * mix(0.05, 0.16, fibreVis);

  // the pith and the first wood round it
  float pith = 1.0 - smoothstep(-0.25, 0.05, c);
  albedo = mix(albedo, srgb(122.0, 82.0, 52.0), pith * 0.9);

  float relief = uRelief;
  float pore = 0.0;
  float ray = 0.0;
#if DETAIL
  // ring-porous: a band of open pores where each ring starts (seen close up)
  {
    const float CELLS = 270.0;
    vec2 cell = xz * CELLS;
    vec2 ci = floor(cell);
    vec2 cf = cell - ci;
    ivec2 ic = ivec2(ci);
    float h1 = hash2(ic);
    float h2 = hash2(ic + ivec2(17, 31));
    float h3 = hash2(ic + ivec2(53, 7));
    vec2 centre = 0.18 + 0.64 * vec2(h1, h2);
    float rad = mix(0.16, 0.34, h3);
    // the pore band: widest on busy days, thinning out into the ring
    float band = 0.22 + 0.18 * lev;
    float zone = 1.0 - smoothstep(band * (0.25 + 0.6 * h3), band, f);
    zone *= step(0.0, c) * step(0.35, h1 * 0.55 + h3 * 0.25 + 0.5 * zone);
    float sizePx = rad / CELLS / px;
    float dd = length(cf - centre) / rad;
    float visible = smoothstep(0.55, 1.4, sizePx) * uClose;
    pore = (1.0 - smoothstep(0.55, 1.0 + 0.6 / max(sizePx, 0.25), dd)) * zone * visible;
    // what can't be resolved still darkens the band a touch
    albedo *= 1.0 - 0.05 * zone * (1.0 - visible);
  }
  // rays: fine radial flecks, a little paler and glossier
  {
    float bins = 820.0;
    float b = th / TAU * bins;
    float bi = floor(b);
    float seg = floor(r * 26.0 + hash2(ivec2(int(bi), 3)) * 4.0);
    float present = step(0.8, hash2(ivec2(int(bi), int(seg))));
    float width = mix(0.0006, 0.0014, hash2(ivec2(int(bi), int(seg) + 911)));
    float across = abs(fract(b) - 0.5) * (TAU / bins) * r;
    float wpx = width / px;
    ray = present * (1.0 - smoothstep(0.5, 1.0, across / width)) * smoothstep(0.5, 1.4, wpx) * step(0.0, c) * uClose;
  }
  albedo = mix(albedo, albedo * vec3(0.38, 0.33, 0.3), pore * 0.9);
  albedo = mix(albedo, albedo * 1.1 + vec3(0.02, 0.016, 0.01), ray * 0.55);
#endif

  // relief: earlywood worn a hair below latewood, then a step down where the next ring starts
  float x = clamp((f - a0) / (a1 - a0), 0.0, 1.0);
  float slope = 6.0 * x * (1.0 - x) / (a1 - a0);
  float resolve = 1.0 - tiny;
  vec2 gh = relief * slope * g * resolve;
  vec3 nrm = normalize(vec3(-gh.x, 1.0, -gh.y));
#if DETAIL
  nrm = normalize(nrm + vec3(gdir.x, 0.0, gdir.y) * pore * 0.2);
#endif

  vec3 L = normalize(uLight);
  vec3 V = normalize(uEye - vPos);
  vec2 lh = L.xz / max(length(L.xz), 1e-4);
  float lenH = length(L.xz);
  // light from the pith side (travelling outward): each step shades the start of the next ring
  float inward = -dot(lh, gdir);
  float sLen = relief * lenH / max(L.y, 0.06) * max(inward, 0.0) * gl;
  float stepShadow = (1.0 - smoothstep(sLen * 0.4 - aa * 0.5, sLen + aa * 0.5, f)) * step(1e-4, sLen) * step(0.0, c - 0.5);
  stepShadow *= resolve;
  // light from outside: the step's face catches it as a fine bright line
  vec3 stepN = normalize(vec3(gdir.x, 0.8, gdir.y));
  float stepLine = exp(-pow(f / max(aa * 0.8, 1e-3), 2.0)) * resolve * step(0.0, c - 0.5);
  float stepLit = max(dot(stepN, L), 0.0);

  float ndl = max(dot(nrm, L), 0.0);
  float vis = 1.0 - 0.45 * stepShadow;
  float diffuse = mix(ndl, stepLit, stepLine * 0.35) * vis;
  // a little wrap: end grain scatters light under its surface
  diffuse = mix(diffuse, 0.25 + 0.75 * diffuse, 0.25);
  vec3 sun = uSun * lampFall(vPos, uLamp);
  vec3 col = albedo * (sun * diffuse + uSky * (0.62 + 0.38 * nrm.y) * (1.0 - 0.12 * stepShadow));
  // oil: a broad, soft sheen and a faint tighter coat
  float rough = mix(0.62, 0.5, lm);
  float spec = ggx(nrm, V, L, rough, 0.03) * vis * (1.0 - pore);
  float coat = ggx(normalize(vec3(-gh.x * 0.25, 1.0, -gh.y * 0.25)), V, L, 0.3, 0.025) * vis * (1.0 - 0.7 * pore);
  col += sun * (spec * 0.2 + coat * 0.09 + ray * spec * 0.3);

  // a knock: a ring of light running out through the grain
  if (uKnock.w > 0.001) {
    float dist = length(xz - uKnock.xy);
    float front = uKnock.z * 1.35;
    float wave = exp(-pow((dist - front) / 0.045, 2.0)) * uKnock.w;
    col += sun * wave * (0.04 + 0.18 * lm) * (0.6 + 0.4 * ndl);
  }

  vec3 outc = toSRGB(tonemap(col * uExposure));
  selection(outc, uSelB, c, aa, th, r, px);
  selection(outc, uSelA, c, aa, th, r, px);
  outColor = vec4(outc, 1.0);
}
`}({detail:o.detail})),this.bark=(0,i.createProgram)(e,_,N),this.uF=(0,i.uniformLocations)(e,this.floor),this.uFa=(0,i.uniformLocations)(e,this.face),this.uB=(0,i.uniformLocations)(e,this.bark),o.loupe&&(this.loupe=(0,i.createProgram)(e,L,U),this.uL=(0,i.uniformLocations)(e,this.loupe),this.samples=Math.max(0,Math.min(4,e.getParameter(e.MAX_SAMPLES)))),this.fieldTex=this.floatTexture(512,1024,a.field,!1),this.levelTex=this.floatTexture(7,Math.max(1,a.n),a.level,!1),this.outlineTex=e.createTexture(),e.bindTexture(e.TEXTURE_2D,this.outlineTex),e.texImage2D(e.TEXTURE_2D,0,e.R16F,256,1,0,e.RED,e.HALF_FLOAT,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.REPEAT),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),this.mesh=function(){let e=new Uint16Array(768);for(let t=0;t<256;t++)e[3*t]=0,e[3*t+1]=1+t,e[3*t+2]=2+t;let t=new Uint16Array((E-1)*1536),a=0;for(let e=0;e<E-1;e++)for(let o=0;o<256;o++){let r=257*e+o,l=r+1,n=r+257,i=n+1;t[a++]=r,t[a++]=n,t[a++]=l,t[a++]=l,t[a++]=n,t[a++]=i}return{face:new Float32Array(774),faceIndex:e,bark:new Float32Array(257*E*8),barkIndex:t,outline:new Float32Array(256),meanOuter:1}}(),this.faceVao=e.createVertexArray(),this.faceVbo=e.createBuffer(),this.faceIbo=e.createBuffer(),e.bindVertexArray(this.faceVao),e.bindBuffer(e.ARRAY_BUFFER,this.faceVbo),e.bufferData(e.ARRAY_BUFFER,this.mesh.face.byteLength,e.DYNAMIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,12,0),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.faceIbo),e.bufferData(e.ELEMENT_ARRAY_BUFFER,this.mesh.faceIndex,e.STATIC_DRAW),this.barkVao=e.createVertexArray(),this.barkVbo=e.createBuffer(),this.barkIbo=e.createBuffer(),e.bindVertexArray(this.barkVao),e.bindBuffer(e.ARRAY_BUFFER,this.barkVbo),e.bufferData(e.ARRAY_BUFFER,this.mesh.bark.byteLength,e.DYNAMIC_DRAW);e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,32,0),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,32,12),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,2,e.FLOAT,!1,32,24),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.barkIbo),e.bufferData(e.ELEMENT_ARRAY_BUFFER,this.mesh.barkIndex,e.STATIC_DRAW),this.emptyVao=e.createVertexArray(),e.bindVertexArray(null),this.setGrown(a.n)}floatTexture(e,t,a,o){let r=this.gl,l=r.createTexture();if(!l)throw Error("year-rings: no texture");r.bindTexture(r.TEXTURE_2D,l),r.pixelStorei(r.UNPACK_ALIGNMENT,1),r.texImage2D(r.TEXTURE_2D,0,r.R32F,e,t,0,r.RED,r.FLOAT,a);let n=o?r.LINEAR:r.NEAREST;return r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,n),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,n),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),l}setGrown(e){if(e===this.grownNow)return;this.grownNow=e;let t=this.gl;!function(e,t,a){let o=0,r=0;for(let e=0;e<=256;e++){let l=e/256*u,n=y(l,x(t,a,l));M[e]=n,e<256&&(r+=n,o+=x(t,t.n,l))}let l=Math.min(1,(r/=256)/Math.max(1e-6,o/=256)),n=.048*(.32+.68*l);for(let e=0;e<=256;e++){let t=e/256*u;F[e]=n*(1+.12*Math.sin(3*t+.4)+.08*Math.sin(7*t+2.1)),S[e]=(.0024*Math.sin(29*t+.3)+.0016*Math.sin(47*t+1.9)+.0011*Math.sin(83*t+4.4)+7e-4*Math.sin(131*t+2.2))*(.4+.6*l)}let i=e.face;i[0]=0,i[1]=.16,i[2]=0;for(let e=0;e<=256;e++){let t=e/256*u,a=Math.sin(t),o=Math.cos(t),r=(1+e)*3;i[r]=a*M[e],i[r+1]=.16,i[r+2]=-o*M[e]}let s=e.bark,h=0;for(let t=0;t<E;t++){let[a,o,r,l]=A[t];for(let n=0;n<=256;n++){let i=n/256*u,f=Math.sin(i),c=Math.cos(i),d=M[n]+F[n]*a+o+(t>=3?S[n]:2===t?.6*S[n]:0),p=(257*t+n)*8;s[p]=f*d,s[p+1]=.16-r,s[p+2]=-c*d,s[p+6]=n/256,s[p+7]=l,t===E-1&&n<256&&(e.outline[n]=d,h+=d)}}e.meanOuter=h/256;for(let e=0;e<E;e++){let t=Math.max(0,e-1),a=Math.min(E-1,e+1);for(let o=0;o<=256;o++){let r=0===o?255:o-1,l=(257*e+(256===o?1:o+1))*8,n=(257*e+r)*8,i=s[l]-s[n],u=s[l+1]-s[n+1],h=s[l+2]-s[n+2],f=(257*a+o)*8,c=(257*t+o)*8,d=s[f]-s[c],p=s[f+1]-s[c+1],m=s[f+2]-s[c+2],v=u*m-h*p,g=h*d-i*m,x=i*p-u*d,b=Math.hypot(v,g,x)||1;v/=b,g/=b,x/=b;let w=(257*e+o)*8;s[w+3]=v,s[w+4]=g,s[w+5]=x}}}(this.mesh,this.rings,e),t.bindBuffer(t.ARRAY_BUFFER,this.faceVbo),t.bufferSubData(t.ARRAY_BUFFER,0,this.mesh.face),t.bindBuffer(t.ARRAY_BUFFER,this.barkVbo),t.bufferSubData(t.ARRAY_BUFFER,0,this.mesh.bark),t.bindBuffer(t.ARRAY_BUFFER,null);let a=this.outlineHalf;for(let e=0;e<256;e++)a[e]=function(e){V[0]=e;let t=X[0],a=t>>>16&32768,o=(t>>>23&255)-127+15,r=8388607&t;return o<=0?a:o>=31||8388608&(r+=4096)&&(r=0,(o+=1)>=31)?31744|a:a|o<<10|r>>>13}(this.mesh.outline[e]);t.bindTexture(t.TEXTURE_2D,this.outlineTex),t.pixelStorei(t.UNPACK_ALIGNMENT,1),t.texSubImage2D(t.TEXTURE_2D,0,0,0,256,1,t.RED,t.HALF_FLOAT,a)}get outline(){return this.mesh.outline}ensureLoupeTarget(e){let t=this.gl;e===this.loupeSize&&this.msFbo||(this.freeLoupeTarget(),this.loupeSize=e,this.resolveTex=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.resolveTex),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,e,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),this.resolveFbo=t.createFramebuffer(),t.bindFramebuffer(t.FRAMEBUFFER,this.resolveFbo),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,this.resolveTex,0),this.msFbo=t.createFramebuffer(),this.msColor=t.createRenderbuffer(),this.msDepth=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,this.msColor),this.samples>1?t.renderbufferStorageMultisample(t.RENDERBUFFER,this.samples,t.RGBA8,e,e):t.renderbufferStorage(t.RENDERBUFFER,t.RGBA8,e,e),t.bindRenderbuffer(t.RENDERBUFFER,this.msDepth),this.samples>1?t.renderbufferStorageMultisample(t.RENDERBUFFER,this.samples,t.DEPTH_COMPONENT24,e,e):t.renderbufferStorage(t.RENDERBUFFER,t.DEPTH_COMPONENT24,e,e),t.bindFramebuffer(t.FRAMEBUFFER,this.msFbo),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.RENDERBUFFER,this.msColor),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_ATTACHMENT,t.RENDERBUFFER,this.msDepth),t.bindRenderbuffer(t.RENDERBUFFER,null),t.bindFramebuffer(t.FRAMEBUFFER,null))}freeLoupeTarget(){let e=this.gl;this.msFbo&&e.deleteFramebuffer(this.msFbo),this.msColor&&e.deleteRenderbuffer(this.msColor),this.msDepth&&e.deleteRenderbuffer(this.msDepth),this.resolveFbo&&e.deleteFramebuffer(this.resolveFbo),this.resolveTex&&e.deleteTexture(this.resolveTex),this.msFbo=this.msColor=this.msDepth=this.resolveFbo=null,this.resolveTex=null,this.loupeSize=0}drawScene(e,t,a,o,r){let l=this.gl;l.clear(l.DEPTH_BUFFER_BIT),l.disable(l.DEPTH_TEST),l.depthMask(!1),l.useProgram(this.floor);let n=this.uF;l.uniformMatrix4fv(n("uInv"),!1,a),l.uniform3fv(n("uLight"),e.light),l.uniform3fv(n("uBg"),e.bg),l.uniform3fv(n("uPoolCol"),e.pool),l.uniform1f(n("uShadowK"),e.shadowK),l.uniform1f(n("uSoft"),e.soft),l.uniform1f(n("uH"),.16),l.uniform1f(n("uDialR"),e.dialR),l.uniform4fv(n("uDialCol"),e.dial),l.uniform1f(n("uDpr"),o),l.uniform4fv(n("uLamp"),e.lamp),l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,this.outlineTex),l.uniform1i(n("uOutline"),0),l.bindVertexArray(this.emptyVao),l.drawArrays(l.TRIANGLES,0,3),l.enable(l.DEPTH_TEST),l.depthFunc(l.LEQUAL),l.depthMask(!0),l.useProgram(this.face);let i=this.uFa;l.uniformMatrix4fv(i("uVP"),!1,t),l.uniform3fv(i("uLight"),e.light),l.uniform3fv(i("uSun"),e.sun),l.uniform3fv(i("uSky"),e.sky),l.uniform3fv(i("uEye"),e.eye),l.uniform1f(i("uRelief"),e.relief),l.uniform1f(i("uExposure"),e.exposure),l.uniform1i(i("uN"),this.rings.n),l.uniform1f(i("uGrown"),this.grownNow),l.uniform4fv(i("uSelA"),e.selA),l.uniform4fv(i("uSelB"),e.selB),l.uniform3fv(i("uLineCol"),e.line),l.uniform4fv(i("uKnock"),e.knock),l.uniform4fv(i("uLamp"),e.lamp),l.uniform1f(i("uClose"),r),l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,this.fieldTex),l.uniform1i(i("uField"),0),l.activeTexture(l.TEXTURE1),l.bindTexture(l.TEXTURE_2D,this.levelTex),l.uniform1i(i("uLevel"),1),l.bindVertexArray(this.faceVao),l.drawElements(l.TRIANGLES,768,l.UNSIGNED_SHORT,0),l.useProgram(this.bark);let s=this.uB;l.uniformMatrix4fv(s("uVP"),!1,t),l.uniform3fv(s("uLight"),e.light),l.uniform3fv(s("uSun"),e.sun),l.uniform3fv(s("uSky"),e.sky),l.uniform3fv(s("uEye"),e.eye),l.uniform1f(s("uExposure"),e.exposure),l.uniform1f(s("uBump"),e.bump),l.uniform4fv(s("uLamp"),e.lamp),l.bindVertexArray(this.barkVao),l.drawElements(l.TRIANGLES,this.mesh.barkIndex.length,l.UNSIGNED_SHORT,0),l.bindVertexArray(null),l.activeTexture(l.TEXTURE0)}render(e,t,a){let o=this.gl;o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,t,a),o.disable(o.BLEND),this.drawScene(e,e.vp,e.inv,e.dpr,0);let r=e.loupe;if(!this.loupe||!this.uL||r.show<.01||r.radius<2)return;let l=Math.max(16,Math.min(1024,Math.ceil(2*Math.max(1,r.radius-r.rim)*e.dpr)));this.ensureLoupeTarget(l),o.bindFramebuffer(o.FRAMEBUFFER,this.msFbo),o.viewport(0,0,l,l),this.drawScene(e,r.vp,r.inv,e.dpr*r.mag,1),o.bindFramebuffer(o.READ_FRAMEBUFFER,this.msFbo),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,this.resolveFbo),o.blitFramebuffer(0,0,l,l,0,0,l,l,o.COLOR_BUFFER_BIT,o.NEAREST),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),o.viewport(0,0,t,a),o.disable(o.DEPTH_TEST),o.depthMask(!1),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),o.useProgram(this.loupe);let n=this.uL,i=e.dpr,s=r.x*i,u=a-r.y*i,h=r.radius*i,f=1.45*h+Math.hypot(r.shadowX,r.shadowY)*i;o.uniform4f(n("uRect"),(s-f)/t*2-1,(u-f)/a*2-1,(s+f)/t*2-1,(u+f)/a*2-1),o.uniform2f(n("uCentre"),s,u),o.uniform1f(n("uR"),h),o.uniform1f(n("uRim"),r.rim*i),o.uniform2f(n("uShadowOff"),r.shadowX*i,-r.shadowY*i),o.uniform1f(n("uShadowA"),r.shadowA),o.uniform2f(n("uLightDir"),r.lightX,-r.lightY),o.uniform1f(n("uDark"),e.dark),o.uniform1f(n("uShow"),Math.min(1,r.show)),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.resolveTex),o.uniform1i(n("uView"),0),o.bindVertexArray(this.emptyVao),o.drawArrays(o.TRIANGLES,0,6),o.bindVertexArray(null),o.disable(o.BLEND)}dispose(){let e=this.gl;this.freeLoupeTarget(),e.deleteProgram(this.floor),e.deleteProgram(this.face),e.deleteProgram(this.bark),this.loupe&&e.deleteProgram(this.loupe),e.deleteTexture(this.fieldTex),e.deleteTexture(this.levelTex),e.deleteTexture(this.outlineTex),e.deleteBuffer(this.faceVbo),e.deleteBuffer(this.barkVbo),e.deleteBuffer(this.faceIbo),e.deleteBuffer(this.barkIbo),e.deleteVertexArray(this.faceVao),e.deleteVertexArray(this.barkVao),e.deleteVertexArray(this.emptyVao)}}let V=new Float32Array(1),X=new Uint32Array(V.buffer),C=0;function I(e,t,a=0,r=16){if(!(0,o.audioReady)())return;let l=(0,o.getAudio)();if(!l)return;let n=performance.now();if(n-C<r)return;C=n;let{ctx:i,output:s}=l,u=i.currentTime,h=Math.max(0,Math.min(1,e));if(h<.02)return;let f=Math.max(0,Math.min(1,t)),c="function"==typeof i.createStereoPanner?i.createStereoPanner():null;c&&(c.pan.value=Math.max(-.7,Math.min(.7,a)),c.connect(s));let d=c??s,p=i.createBufferSource();p.buffer=(0,o.noiseBuffer)(i);let m=i.createBiquadFilter();m.type="bandpass",m.frequency.value=2400+2600*f+300*Math.random(),m.Q.value=3.2;let v=i.createGain();v.gain.setValueAtTime(0,u),v.gain.linearRampToValueAtTime(.09*h,u+.0015),v.gain.exponentialRampToValueAtTime(1e-4,u+.022),p.connect(m).connect(v).connect(d),p.start(u,.8*Math.random(),.04);let g=i.createOscillator();g.type="sine";let x=620+900*f;g.frequency.setValueAtTime(x,u),g.frequency.exponentialRampToValueAtTime(.82*x,u+.03);let b=i.createGain();b.gain.setValueAtTime(0,u),b.gain.linearRampToValueAtTime(.05*h,u+.002),b.gain.exponentialRampToValueAtTime(1e-4,u+.045),g.connect(b).connect(d),g.start(u),g.stop(u+.06)}let G=56*Math.PI/180;function Y(e,t){let a=t[0],o=t[1],r=t[2],l=t[3],n=t[4],i=t[5],s=t[6],u=t[7],h=t[8],f=t[9],c=t[10],d=t[11],p=t[12],m=t[13],v=t[14],g=t[15],x=a*i-o*n,b=a*s-r*n,w=a*u-l*n,y=o*s-r*i,T=o*u-l*i,k=r*u-l*s,R=h*m-f*p,A=h*v-c*p,E=h*g-d*p,M=f*v-c*m,F=f*g-d*m,S=c*g-d*v,z=x*S-b*F+w*M+y*E-T*A+k*R;return z&&(z=1/z,e[0]=(i*S-s*F+u*M)*z,e[1]=(r*F-o*S-l*M)*z,e[2]=(m*k-v*T+g*y)*z,e[3]=(c*T-f*k-d*y)*z,e[4]=(s*E-n*S-u*A)*z,e[5]=(a*S-r*E+l*A)*z,e[6]=(v*w-p*k-g*b)*z,e[7]=(h*k-c*w+d*b)*z,e[8]=(n*F-i*E+u*R)*z,e[9]=(o*E-a*F-l*R)*z,e[10]=(p*T-m*w+g*x)*z,e[11]=(f*w-h*T-d*x)*z,e[12]=(i*A-n*M-s*R)*z,e[13]=(a*M-o*A+r*R)*z,e[14]=(m*b-p*y-v*x)*z,e[15]=(h*y-f*b+c*x)*z),e}function O(e,t,a){var o,r,l,n;let i,s,u,h,f,c,d,p,m,v,g=Math.cos(a);e.eye[0]=Math.sin(t)*g*6.2,e.eye[1]=.064+6.2*Math.sin(a),e.eye[2]=Math.cos(t)*g*6.2,o=e.view,r=e.eye[0],l=e.eye[1],n=e.eye[2],h=Math.hypot(i=r-0,s=l-.064,u=n-0)||1,i/=h,s/=h,f=u/=h,c=0,h=Math.hypot(f,0,d=-i)||1,f/=h,c/=h,p=s*(d/=h)-u*c,m=u*f-i*d,v=i*c-s*f,o[0]=f,o[1]=p,o[2]=i,o[3]=0,o[4]=c,o[5]=m,o[6]=s,o[7]=0,o[8]=d,o[9]=v,o[10]=u,o[11]=0,o[12]=-(f*r+c*l+d*n),o[13]=-(p*r+m*l+v*n),o[14]=-(i*r+s*l+u*n),o[15]=1}let j=new Float32Array(4);function $(e,t,a,o,r){e.width=Math.max(1,t),e.height=Math.max(1,a),O(e,0,G);let l=e.width/e.height,n=1/0,i=-1/0,s=1/0,u=-1/0,h=e.view;for(let e=0;e<2;e++){let t=0===e?r:1,a=.16*(0!==e);for(let e=0;e<72;e++){let o=e/72*Math.PI*2,r=Math.sin(o)*t,l=-Math.cos(o)*t;j[0]=h[0]*r+h[4]*a+h[8]*l+h[12],j[1]=h[1]*r+h[5]*a+h[9]*l+h[13],j[2]=h[2]*r+h[6]*a+h[10]*l+h[14];let f=-j[2],c=j[0]/f,d=j[1]/f;c<n&&(n=c),c>i&&(i=c),d<s&&(s=d),d>u&&(u=d)}}let f=-1+2*o.side/e.width,c=1-2*o.side/e.width,d=-1+2*o.bottom/e.height,p=1-2*o.top/e.height,m=Math.max((i-n)/(Math.max(.2,c-f)*l),(u-s)/Math.max(.2,p-d)),v=e.framing;v.tanHalf=m,v.shiftX=(f+c)/2-(n+i)/2/(m*l),v.shiftY=(d+p)/2-(s+u)/2/m,e.pxPerUnit=e.height/2/(6.2*m),H(e,0,G)}function H(e,t,a){var o,r,l,n,i;let s;O(e,t,a);let u=e.framing;o=e.proj,r=u.tanHalf,l=e.width/e.height,n=u.shiftX,i=u.shiftY,s=1/r,o.fill(0),o[0]=s/l,o[5]=s,o[8]=-n,o[9]=-i,o[10]=-1.24,o[11]=-1,o[14]=-3.36,function(e,t,a){let o=t[0],r=t[1],l=t[2],n=t[3],i=t[4],s=t[5],u=t[6],h=t[7],f=t[8],c=t[9],d=t[10],p=t[11],m=t[12],v=t[13],g=t[14],x=t[15];for(let t=0;t<4;t++){let b=a[4*t],w=a[4*t+1],y=a[4*t+2],T=a[4*t+3];e[4*t]=b*o+w*i+y*f+T*m,e[4*t+1]=b*r+w*s+y*c+T*v,e[4*t+2]=b*l+w*u+y*d+T*g,e[4*t+3]=b*n+w*h+y*p+T*x}}(e.vp,e.proj,e.view),Y(e.inv,e.vp)}function W(e,t,a,o,r){let l=e.vp,n=l[0]*t+l[4]*a+l[8]*o+l[12],i=l[1]*t+l[5]*a+l[9]*o+l[13],s=l[2]*t+l[6]*a+l[10]*o+l[14],u=l[3]*t+l[7]*a+l[11]*o+l[15]||1e-6;return r.x=(n/u*.5+.5)*e.width,r.y=(.5-i/u*.5)*e.height,r.depth=s/u,r}function q(e,t,a,o,r){let l=t/e.width*2-1,n=1-a/e.height*2,i=e.inv,s=i[3]*l+i[7]*n+-1*i[11]+i[15],u=(i[0]*l+i[4]*n+-1*i[8]+i[12])/s,h=(i[1]*l+i[5]*n+-1*i[9]+i[13])/s,f=(i[2]*l+i[6]*n+-1*i[10]+i[14])/s;s=i[3]*l+i[7]*n+i[11]+i[15];let c=(i[0]*l+i[4]*n+i[8]+i[12])/s,d=(i[1]*l+i[5]*n+i[9]+i[13])/s,p=(i[2]*l+i[6]*n+i[10]+i[14])/s,m=d-h;if(1e-9>Math.abs(m))return r.ok=!1,r;let v=(o-h)/m;return r.x=u+(c-u)*v,r.z=f+(p-f)*v,r.ok=v>0,r}let K=Math.PI/180,Q=-78*K,J=25*K,Z=31*K,ee=12*K,et=150*K,ea={k:460,c:2*Math.sqrt(460)},eo={k:70,c:2*Math.sqrt(70)},er={k:5.5,c:2*Math.sqrt(5.5)},el=[2,1.5,1.25,1],en={light:{sun:[2.55,2.44,2.28],sky:[.34,.355,.38],pool:[0,0,0],line:[.1,.075,.055],shadowK:.3,dialA:.26,exposure:1},dark:{sun:[2.7,1.86,1.12],sky:[.05,.042,.04],pool:[.034,.019,.008],line:[1,.86,.55],shadowK:.7,dialA:.3,exposure:1.05}},ei=null,es={x:0,y:0,depth:0},eu={x:0,z:0,ok:!1},eh={x:0,z:0,r:0,theta:0},ef={day:null,onSlice:!1,r:0,px:0,pz:0};function ec(e,t){let a=e.trim(),o=a.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(o){let e=3===o[1].length?o[1].replace(/./g,e=>e+e):o[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let r=a.match(/[\d.]+/g);return r&&r.length>=3?[r[0]/255,r[1]/255,r[2]/255]:t}function ed(e){return e-u*Math.floor(e/u+.5)}function ep({mode:e,active:i,reducedMotion:d,theme:g}){var x,y,A,E;let M,F="stage"===e,[S]=(0,a.useState)(()=>{let e,t,a,o;return ei||(ei=function(e=s.default){let t=e.year,a=e.days.filter(e=>e.date.startsWith(`${t}-`)).slice().sort((e,t)=>e.date<t.date?-1:+(e.date>t.date)),o=f(a[0]?.date??`${t}-01-01`),r=new Date(864e5*o).getUTCDay(),l=[],n=[],i=0,c=null,d=0,p=0;for(let e of a){let t=f(e.date)-o+r,a=Math.floor(t/7),s=t-7*a,u=Math.max(0,Math.round(e.count)),h={date:e.date,count:u,week:a,weekday:s,index:l.length,level:0};for(l.push(h);n.length<=a;)n.push({index:n.length,days:[null,null,null,null,null,null,null],total:0,sunday:o-r+7*n.length});n[a].days[s]=h,n[a].total+=u,p+=u,u>0&&d++,u>i&&(i=u,c=h)}let m=n.length,v=new Float32Array(7*Math.max(1,m)),g=new Float32Array(7*Math.max(1,m));for(let e of l)v[7*e.week+e.weekday]=1+.62*Math.sqrt(e.count),e.level=e.count>0?1-Math.exp(-e.count/6.2):0,g[7*e.week+e.weekday]=e.level;let x=new Float32Array((m+1)*512),b=1.7;for(let e=0;e<512;e++){let t=e/512*u,a=1.7;x[e]=a;for(let o=0;o<m;o++)a+=function(e,t,a){var o;let r=a/h;r-=7*Math.floor(r/7);let l=Math.floor(r)%7,n=(o=r-Math.floor(r))*o*(3-2*o);return e[t+l]+(e[t+(l+1)%7]-e[t+l])*n}(v,7*o,t),x[(o+1)*512+e]=a;a>b&&(b=a)}let w=.952/b;for(let e=0;e<x.length;e++)x[e]*=w;let y=+w,T=new Float32Array(524288);for(let e=0;e<512;e++){let t=0;for(let a=0;a<1024;a++){let o,r=(a+.5)/1024,l=x[e];if(r<l)o=r/l-1;else{for(;t<m&&x[(t+1)*512+e]<=r;)t++;if(t>=m)o=m+(r-x[512*m+e])/y;else{let a=x[512*t+e],l=x[(t+1)*512+e];o=t+(r-a)/Math.max(1e-6,l-a)}}T[512*a+e]=o}}let k=l[0]??{date:`${t}-01-01`,count:0,week:0,weekday:0,index:0,level:0},R=l[l.length-1]??k;return{username:e.username,year:t,total:p,days:l,weeks:n,n:m,bounds:x,field:T,level:g,maxCount:i,busiest:c,activeDays:d,unit:y,first:k,last:R}}()),e=ei,t=d?e.n:0,a=F&&!d?Q+et:Q+.6*!F,o={vp:new Float32Array(16),inv:new Float32Array(16),eye:new Float32Array(3),light:new Float32Array(3),sun:new Float32Array(3),sky:new Float32Array(3),pool:new Float32Array(3),bg:new Float32Array(3),line:new Float32Array(3),dial:new Float32Array(4),dialR:F?1.2:99,exposure:1,relief:7e-4,shadowK:.3,soft:.32,bump:.0022,dark:+("dark"===g),dpr:1,selA:new Float32Array(4),selB:new Float32Array(4),knock:new Float32Array(4),lamp:new Float32Array(4),loupe:{show:0,x:0,y:0,radius:64,rim:5,shadowX:0,shadowY:0,shadowA:.22,lightX:0,lightY:-1,mag:2.8,vp:new Float32Array(16),inv:new Float32Array(16)}},{rings:e,cam:{width:1,height:1,eye:new Float32Array(3),view:new Float32Array(16),proj:new Float32Array(16),vp:new Float32Array(16),inv:new Float32Array(16),framing:{tanHalf:.3,shiftX:0,shiftY:0},pxPerUnit:100},frame:o,az:a,azV:.42*!F,azGoal:a,azMode:F?"coast":"orbit",el:new r.Spring(F?J:Z,{stiffness:40,damping:12.6}),grown:t,phase:"idle",phaseT:0,rewindFrom:0,lastRing:Math.floor(t),introPending:!d,leanX:new r.Spring(0,{stiffness:50,damping:14}),leanY:new r.Spring(0,{stiffness:50,damping:14}),loupeX:new r.Spring(0,{stiffness:620,damping:44}),loupeY:new r.Spring(0,{stiffness:620,damping:44}),loupeShow:new r.Spring(0,{stiffness:340,damping:23}),loupeWant:!1,loupeAimX:0,loupeAimY:0,loupeUntil:0,loupeR:64,loupeRing:NaN,topSafe:0,hoverDay:null,pinned:null,shown:null,slotA:{week:0,weekday:0,s:0,day:null},slotB:{week:0,weekday:0,s:0,day:null},knockAge:10,knockS:0,drag:null,pointerX:0,pointerY:0,pointerIn:!1,hovering:!1,lastInput:-10,acc:0,dark:+("dark"===g),bg:"dark"===g?[.055,.02,.024]:[.949,.949,.949],bgHover:"dark"===g?[.031,.012,.012]:[.922,.922,.922],ink:"dark"===g?[.886,.647,.157]:[.09,.09,.09],hover:0,theme:g,reduced:d,perf:{time:0,slow:0},dom:{bx:NaN,by:NaN,tx:NaN,ty:NaN,tipOn:!1,labels:new Float32Array(21).fill(NaN),az:NaN}}}),z=S.rings,D=(0,a.useRef)(null),_=(0,a.useRef)(null),L=(0,a.useRef)(null),N=(0,a.useRef)(null),U=(0,a.useRef)([]),P=(0,r.useFinePointer)(),V=(0,a.useId)(),[X,C]=(0,a.useState)(null),[O,j]=(0,a.useState)(""),[eb,ew]=(0,a.useState)(!1),[ey,eT]=(0,a.useState)(!1),[ek,eR]=(0,a.useState)(!1),[eA,eE]=(0,a.useState)(0),eM=(0,a.useRef)(0),eF=(0,a.useRef)("mouse"),eS=(0,a.useCallback)(()=>{let{width:e,height:t}=eB.current;if(e<2||t<2)return;let a=e<560;F?($(S.cam,e,t,{top:a?66:22,bottom:a?100:96,side:a?14:24},1.27),S.topSafe=60*!!a,S.loupeR=a?54:Math.round((0,r.clamp)(.055*e,58,72))):$(S.cam,e,t,{top:4,bottom:4,side:4},1.2)},[F]),ez=(0,a.useCallback)(()=>{if(S.reduced){S.grown=S.rings.n,S.phase="idle";return}S.grown>.5?(S.phase="rewind",S.rewindFrom=S.grown):S.phase="grow",S.phaseT=0},[]),eD=()=>{var e,t,a;let o,l=D.current,n=eP.current,{width:i,height:s,dpr:u}=eB.current;if(!l||!n||i<2||s<2)return!1;let h=S.frame,f=S.cam,c=en[S.theme],d=en["dark"===S.theme?"light":"dark"],p="dark"===S.theme?S.dark:1-S.dark;H(f,3.2*S.leanX.value*K,G+2.2*S.leanY.value*K),h.vp.set(f.vp),h.inv.set(f.inv),h.eye.set(f.eye),e=S.az,t=S.el.value,a=h.light,o=Math.cos(t),a[0]=Math.sin(e)*o,a[1]=Math.sin(t),a[2]=-Math.cos(e)*o,h.lamp[0]=2.4*h.light[0],h.lamp[1]=2.4*h.light[1],h.lamp[2]=2.4*h.light[2],h.lamp[3]=.9*S.dark;for(let e=0;e<3;e++)h.sun[e]=(0,r.lerp)(d.sun[e],c.sun[e],p),h.sky[e]=(0,r.lerp)(d.sky[e],c.sky[e],p),h.pool[e]=(0,r.lerp)(d.pool[e],c.pool[e],p),h.line[e]=(0,r.lerp)(d.line[e],c.line[e],p),h.bg[e]=(0,r.lerp)(S.bg[e],S.bgHover[e],S.hover),h.dial[e]=S.ink[e];h.dial[3]=(0,r.lerp)(d.dialA,c.dialA,p),h.shadowK=(0,r.lerp)(d.shadowK,c.shadowK,p),h.exposure=(0,r.lerp)(d.exposure,c.exposure,p),h.dark=S.dark,h.dpr=u,l.setGrown(S.grown);let m=S.slotA,v=S.slotB,g=Math.floor(S.grown);h.selA[0]=m.week,h.selA[1]=m.weekday,h.selA[2]=m.day&&m.week<g?m.s:0,h.selB[0]=v.week,h.selB[1]=v.weekday,h.selB[2]=v.day&&v.week<g?v.s:0,h.knock[2]=S.knockAge,h.knock[3]=S.knockS*Math.exp(-(2.2*S.knockAge));let x=h.loupe;if(x.show=S.loupeShow.value,F&&x.show>.01){x.radius=S.loupeR*(0,r.clamp)(.35+.65*x.show,0,1.12),x.rim=Math.max(2.5,.075*S.loupeR),x.x=S.loupeX.value,x.y=S.loupeY.value,x.mag=2.8,W(f,0,.16,0,es);let e=es.x,t=es.y;W(f,.6*h.light[0],.16+.6*h.light[1],.6*h.light[2],es);let a=es.x-e,o=es.y-t,l=Math.hypot(a,o)||1;a/=l,o/=l,x.lightX=a,x.lightY=o;let n=8+20*Math.cos(S.el.value);x.shadowX=-a*n,x.shadowY=-o*n+6,x.shadowA=(0,r.lerp)(.2,.42,S.dark)*(0,r.clamp)(x.show);let i=2*Math.max(1,x.radius-x.rim);!function(e,t,a,o,r,l,n){let i=t/e.width*2-1,s=1-a/e.height*2,u=r*e.width/o,h=r*e.height/o,f=e.vp;for(let e=0;e<4;e++){let t=f[4*e],a=f[4*e+1],o=f[4*e+2],r=f[4*e+3];l[4*e]=u*(t-i*r),l[4*e+1]=h*(a-s*r),l[4*e+2]=o,l[4*e+3]=r}Y(n,l)}(f,x.x,x.y,i,x.mag,x.vp,x.inv)}return l.render(h,n.width,n.height),!0},e_=()=>{if(!F)return;let e=S.cam,t=S.dom,a=L.current;if(a){W(e,1.2*Math.sin(S.az),0,-(1.2*Math.cos(S.az)),es);let o=Math.round(4*es.x)/4,r=Math.round(4*es.y)/4;(o!==t.bx||r!==t.by)&&(t.bx=o,t.by=r,a.style.transform=`translate3d(${o-20}px, ${r-20}px, 0)`);let l=5*Math.round((S.az/K%360+360)%360/5);l!==t.az&&(t.az=l,a.setAttribute("aria-valuenow",String(l)),a.setAttribute("aria-valuetext",`Light from ${["behind","behind, right","the right","in front, right","in front","in front, left","the left","behind, left"][Math.round(l/45)%8]}`))}for(let a=0;a<7;a++){let o=U.current[a];if(!o)continue;let l=a*h;W(e,1.2*Math.sin(l),0,-(1.2*Math.cos(l)),es);let n=Math.round(4*es.x)/4,i=Math.round(4*es.y)/4,s=Math.abs(ed(S.az-l)),u=Math.round(100*(0,r.smoothstep)(.1,.32,s))/100;(n!==t.labels[3*a]||i!==t.labels[3*a+1])&&(t.labels[3*a]=n,t.labels[3*a+1]=i,o.style.transform=`translate3d(${n}px, ${i}px, 0) translate(-50%, -50%)`),u!==t.labels[3*a+2]&&(t.labels[3*a+2]=u,o.style.opacity=String(u))}let o=N.current;if(o){let a=S.shown,l=!!a&&(!a||a.week<Math.floor(S.grown)),n=t.tx,i=t.ty;if(a&&(S.loupeShow.value>.5?(n=S.loupeX.value,i=S.loupeY.value-S.loupeR*(0,r.clamp)(.35+.65*S.loupeShow.value,0,1.1)-10):(T(z,a,eh),W(e,eh.x,.16,eh.z,es),n=es.x,i=es.y-12),n=Math.round(2*n)/2,i=Math.round(2*i)/2),l&&(n!==t.tx||i!==t.ty)){t.tx=n,t.ty=i;let e=i<46+S.topSafe,a=S.loupeShow.value>.5?2*S.loupeR+26:30;o.style.transform=e?`translate3d(${n}px, ${i+a}px, 0) translate(-50%, 0)`:`translate3d(${n}px, ${i}px, 0) translate(-50%, -100%)`}l!==t.tipOn&&(t.tipOn=l,o.style.opacity=l?"1":"0")}},eL=(e,t)=>{if(q(S.cam,e,t,.16,eu),ef.day=null,ef.onSlice=!1,!eu.ok)return ef;let a=eu.x,o=eu.z,l=Math.hypot(a,o),n=D.current?.outline,i=1;if(n){let e=w(a,o)/u*256,t=Math.floor(e)%256;i=(0,r.lerp)(n[t],n[(t+1)%256],e-Math.floor(e))}return ef.day=function(e,t,a,o){let r=Math.hypot(t,a),l=w(t,a),n=b(e,l,r);if(n<0||n>=Math.min(o,e.n))return null;let i=e.weeks[Math.floor(n)];if(!i)return null;let s=l/h,u=null,f=1/0;for(let e=0;e<7;e++){let t=i.days[e];if(!t)continue;let a=Math.abs(s-e);(a=Math.min(a,7-a))<f&&(f=a,u=t)}return u}(z,a,o,S.grown),ef.onSlice=l<i+.015,ef.r=l,ef.px=a,ef.pz=o,ef},eN=(0,r.useFrame)(i,e=>{let t=D.current,{width:a}=eB.current;if(!t||a<2)return!1;let o=S.reduced,l=performance.now()/1e3;if(!F){if(S.acc+=e,S.acc<1/30-.002)return;e=Math.min(.1,S.acc),S.acc=0}if(F&&("idle"!==S.phase||S.drag||S.loupeShow.value>.01)){let t=S.perf;t.time+=e,e>1/40&&(t.slow+=e),t.time>=1.6&&(t.slow>.7*t.time&&eU.current<el.length-1&&eE(eU.current+1),t.time=0,t.slow=0)}if(S.introPending&&(S.introPending=!1,!o&&(S.grown=0,S.lastRing=0,S.phase="grow",S.phaseT=0,F&&(S.azMode="intro",S.azGoal=Q))),"idle"!==S.phase){S.phaseT+=e;let t=z.n;if("rewind"===S.phase){let e=(0,r.clamp)(S.phaseT/.85);S.grown=S.rewindFrom*(1-e*e*(3-2*e)),e>=1&&(S.phase="grow",S.phaseT=0,S.grown=0)}else{let e=(0,r.clamp)(S.phaseT/(F?3.9:3.2));S.grown=t*(1-Math.pow(1-(0,r.clamp)(e),1.85)),e>=1&&(S.phase="idle",S.grown=t)}let a=Math.floor(S.grown+1e-6);if(a!==S.lastRing&&F){let e=Math.max(0,Math.min(t-1,Math.min(a,S.lastRing))),o=z.weeks[e],l=o?.35+.65*(0,r.smoothstep)(0,40,o.total):.4,n="rewind"===S.phase;I(n?.28:.85*l,n?.25+e/t*.5:.15+e/t*.85,0,n?10:14)}S.lastRing=a}if(F)if("coast"===S.azMode)S.az+=S.azV*e,S.azV*=Math.exp(-1.35*e),.004>Math.abs(S.azV)&&(S.azV=0),S.azGoal=S.az;else{let t="hand"===S.azMode?ea:"keys"===S.azMode?eo:er;if(o)S.az=S.azGoal,S.azV=0;else{let a=e;for(;a>1e-6;){let e=Math.min(1/240,a),o=t.k*(S.azGoal-S.az)-t.c*S.azV;S.azV+=o*e,S.az+=S.azV*e,a-=e}}"hand"!==S.azMode&&1e-4>Math.abs(S.azGoal-S.az)&&.001>Math.abs(S.azV)&&(S.az=S.azGoal,S.azV=0,S.azMode="coast")}else if(!o){let t=S.hovering?.95:.42;S.azV=(0,r.damp)(S.azV,t,2.2,e),S.az+=S.azV*e,S.el.to(S.hovering?ee:Z+5*Math.sin(.37*l)*K)}if(S.az>40||S.az<-40){let e=Math.round(S.az/u)*u;S.az-=e,S.azGoal-=e}if(o?S.el.set(S.el.target):S.el.step(e),F){let t=P&&S.pointerIn&&!S.drag&&!o,{height:l}=eB.current;S.leanX.to(t?(0,r.clamp)(S.pointerX/a*2-1,-1,1):0),S.leanY.to(t?(0,r.clamp)(S.pointerY/Math.max(1,l)*2-1,-1,1):0),o?(S.leanX.set(0),S.leanY.set(0)):(S.leanX.step(e),S.leanY.step(e))}if(F){let t=S.drag?.kind==="loupe",n=l<S.loupeUntil,i=(S.loupeWant||t||n)&&S.grown>1;i&&S.loupeShow.value<.02&&0===S.loupeShow.target&&(S.loupeX.set(S.loupeAimX),S.loupeY.set(S.loupeAimY)),S.loupeShow.to(+!!i);let{height:s}=eB.current,u=S.loupeR+6;if(S.loupeAimX=(0,r.clamp)(S.loupeAimX,u,Math.max(u,a-u)),S.loupeAimY=(0,r.clamp)(S.loupeAimY,u+S.topSafe,Math.max(u+S.topSafe,s-u)),S.loupeX.to(S.loupeAimX),S.loupeY.to(S.loupeAimY),o?(S.loupeShow.set(S.loupeShow.target),S.loupeX.set(S.loupeAimX),S.loupeY.set(S.loupeAimY)):(S.loupeShow.step(e),S.loupeX.step(e),S.loupeY.step(e)),S.loupeShow.value>.05&&S.loupeShow.target>0){let e=eL(S.loupeX.value,S.loupeY.value);if((S.loupeWant||t)&&(S.hoverDay=e.day),e.onSlice){let t=Math.floor(Math.min(b(z,w(e.px,e.pz),e.r),S.grown));if(!Number.isNaN(S.loupeRing)&&t!==S.loupeRing&&t>=0){let e=Math.hypot(S.loupeX.velocity,S.loupeY.velocity);I(.55*(1-.55*(0,r.smoothstep)(300,2400,e)),(0,r.clamp)(.25+.6*(t/z.n)+e/6e3),S.loupeX.value/a*2-1,20)}S.loupeRing=t}else S.loupeRing=NaN}else 0===S.loupeShow.target&&(S.loupeRing=NaN)}let n=F?S.hoverDay??S.pinned:null;n!==S.shown&&(e=>{if(e===S.shown)return;S.shown=e;let t=S.slotA,a=S.slotB;if(a.day===e&&e){let o=a.s;a.day=t.day,a.week=t.week,a.weekday=t.weekday,a.s=t.s,t.day=e,t.week=e.week,t.weekday=e.weekday,t.s=o}else a.day=t.day,a.week=t.week,a.weekday=t.weekday,a.s=t.s,t.day=e,e&&(t.week=e.week,t.weekday=e.weekday),t.s=0;F&&C(e)})(n);let i=S.slotA,s=S.slotB;if(o?(i.s=+!!i.day,s.s=0):(i.s=(0,r.damp)(i.s,+!!i.day,16,e),s.s=(0,r.damp)(s.s,0,12,e)),s.s<.002&&(s.s=0),S.knockAge+=e,S.hover=o?+!!S.hovering:(0,r.damp)(S.hover,S.hovering&&!F?1:0,10,e),S.dark=o?+("dark"===S.theme):(0,r.damp)(S.dark,+("dark"===S.theme),5,e),eD(),e_(),"idle"===S.phase&&!S.drag&&(F?"coast"===S.azMode&&0===S.azV:o)&&S.el.settled&&S.leanX.settled&&S.leanY.settled&&S.loupeShow.settled&&S.loupeX.settled&&S.loupeY.settled&&l>=S.loupeUntil&&(0===i.s||i.s>.998)&&0===s.s&&S.knockAge>2.5&&.002>Math.abs(S.dark-("dark"===S.theme))&&(0===S.hover||S.hover>.998))return i.s>.998&&(i.s=1),S.hover=+(S.hover>.5),S.dark=+("dark"===S.theme),eD(),!1}),eU=(0,r.useLatest)(eA),{canvasRef:eP,sizeRef:eB,supported:eV}=(0,r.useWebGL2)({mode:e,maxDpr:F?el[eA]:1.5,attributes:{alpha:!1,antialias:!0,depth:!0,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:t=>{let a=null;try{a=new B(t,e,z)}catch(e){console.error(e);return}return D.current=a,eS(),eD(),eN(),()=>{a?.dispose(),D.current=null}},onResize:e=>{eR(e.width<560),eS(),eD(),e_(),eN()}}),eX=(0,a.useCallback)(()=>{try{let e=getComputedStyle(document.documentElement);S.bg=ec(e.getPropertyValue("--tile"),S.bg),S.bgHover=ec(e.getPropertyValue("--tile-hover"),S.bgHover),S.ink=ec(e.getPropertyValue("--foreground"),S.ink)}catch{}},[]);(0,a.useEffect)(()=>{S.theme=g,eX();let e=new MutationObserver(()=>{eX(),eN()});return e.observe(document.documentElement,{attributes:!0,attributeFilter:["data-palette","class"]}),eN(),()=>e.disconnect()},[g]),(0,a.useEffect)(()=>{S.reduced=d,d&&(S.introPending=!1,S.phase="idle",S.grown=z.n,"coast"!==S.azMode&&"orbit"!==S.azMode&&(S.az=S.azGoal,S.azMode="coast"),S.azV=F?0:S.azV),eN()},[d]);let eC=(0,r.useLatest)(eN),eI=()=>{S.lastInput=performance.now()/1e3,eC.current()},eG=e=>{let t=_.current?.getBoundingClientRect();return{x:e.clientX-(t?.left??0),y:e.clientY-(t?.top??0)}},eY=(e,t)=>(q(S.cam,e,t,0,eu),{phi:w(eu.x,eu.z),rho:Math.hypot(eu.x,eu.z),z:eu.z}),eO=(e,t)=>{let a=e.n%e.ts.length;e.ts[a]=t/1e3,e.gs[a]=S.azGoal,e.n+=1},ej=()=>{S.azGoal=S.az,S.azMode="hand"},e$=(e,t,a)=>{S.frame.knock[0]=e,S.frame.knock[1]=t,S.knockAge=0,S.knockS=+!S.reduced;let{width:r}=eB.current;!function(e,t=1,a=0){if(!(0,o.audioReady)())return;let r=(0,o.getAudio)();if(!r)return;let{ctx:l,output:n}=r,i=l.currentTime,s=Math.max(.2,Math.min(1,t)),u=Math.max(0,Math.min(1,e)),h="function"==typeof l.createStereoPanner?l.createStereoPanner():null;h&&(h.pan.value=Math.max(-.6,Math.min(.6,a)),h.connect(n));let f=h??n,c=l.createBufferSource();c.buffer=(0,o.noiseBuffer)(l);let d=l.createBiquadFilter();d.type="bandpass",d.frequency.value=1500+700*u,d.Q.value=1.1;let p=l.createGain();p.gain.setValueAtTime(0,i),p.gain.linearRampToValueAtTime(.2*s,i+.001),p.gain.exponentialRampToValueAtTime(1e-4,i+.018),c.connect(d).connect(p).connect(f),c.start(i,.8*Math.random(),.03);let m=170+90*u;for(let[e,t,a]of[[1,.24,.16],[2.31,.12,.08],[4.07,.05,.045]]){let o=l.createOscillator();o.type="sine";let r=m*e*(1+(Math.random()-.5)*.02);o.frequency.setValueAtTime(1.04*r,i),o.frequency.exponentialRampToValueAtTime(r,i+.02);let n=l.createGain();n.gain.setValueAtTime(0,i),n.gain.linearRampToValueAtTime(t*s,i+.003),n.gain.exponentialRampToValueAtTime(1e-4,i+a),o.connect(n).connect(f),o.start(i),o.stop(i+a+.02)}}(a,1,S.pointerX/Math.max(1,r)*2-1)},eH=(e,t)=>{let a=S.drag;if(!a||e.pointerId!==a.id)return;S.drag=null,window.clearTimeout(eM.current);try{_.current?.releasePointerCapture(e.pointerId)}catch{}let{x:o,y:l}=eG(e);if(_.current&&(_.current.style.cursor=P?eL(o,l).onSlice?"crosshair":"grab":""),"pending"===a.kind&&!t){let e=eL(o,l);e.day?(S.pinned=S.pinned===e.day&&"mouse"===a.type?null:e.day,S.pinned&&j(em(z,e.day)),e$(e.px,e.pz,e.r)):S.pinned=null,"mouse"===a.type&&(S.loupeWant=e.onSlice,S.loupeAimX=o,S.loupeAimY=l),eI();return}if("loupe"===a.kind){S.hoverDay&&(S.pinned=S.hoverDay,j(em(z,S.hoverDay))),S.hoverDay=null,S.loupeUntil=performance.now()/1e3+1.1,eI();return}if("spin"===a.kind||"grab"===a.kind){let n=t||S.reduced?0:((e,t)=>{let a=e.ts.length;if(e.n<2)return 0;let o=(e.n-1)%a,r=e.ts[o];if(t/1e3-r>.09)return 0;let l=o;for(let t=1;t<Math.min(e.n,a);t++){let o=(e.n-1-t)%a;if(l=o,r-e.ts[o]>.08)break}let n=r-e.ts[l];return n<.012?0:(e.gs[o]-e.gs[l])/n})(a,e.timeStamp);S.azMode="coast",S.az=S.reduced?S.azGoal:S.az,S.azV=(0,r.clamp)(n,-15,15),"mouse"===a.type&&(S.loupeWant=eL(o,l).onSlice,S.loupeAimX=o,S.loupeAimY=l)}eI()};(0,a.useEffect)(()=>{if(!F)return;let e=_.current;if(!e)return;let t=e=>{let t=S.drag?.kind;("loupe"===t||"spin"===t||"grab"===t)&&e.cancelable&&e.preventDefault()};return e.addEventListener("touchmove",t,{passive:!1}),()=>{e.removeEventListener("touchmove",t),window.clearTimeout(eM.current)}},[F]);let eW=e=>{if(S.pinned=e,!e){S.loupeWant=!1,S.hoverDay=null;return}T(z,e,eh),W(S.cam,eh.x,.16,eh.z,es),S.loupeAimX=es.x,S.loupeAimY=es.y,S.loupeWant=!0,S.hoverDay=null,j(em(z,e)),I(.5,.3+.6*(e.week/z.n),0,0)},eq=e=>{S.azGoal=("coast"===S.azMode?S.az:S.azGoal)+e,S.azMode="keys",S.reduced&&(S.az=S.azGoal,S.azMode="coast")};if((0,a.useEffect)(()=>{if(F)return;let e=eP.current;if(!e)return;let t=e=>{"mouse"===e.pointerType&&(S.hovering=!0,eC.current())},a=()=>{S.hovering=!1,eC.current()};return e.addEventListener("pointerenter",t),e.addEventListener("pointerleave",a),()=>{e.removeEventListener("pointerenter",t),e.removeEventListener("pointerleave",a)}},[F,eV]),(0,r.useIsoLayoutEffect)(()=>{S.dom.bx=NaN,S.dom.tx=NaN,S.dom.az=NaN,S.dom.labels.fill(NaN),e_()}),!1===eV)return(0,t.jsx)(ex,{mode:e,theme:g,rings:z});if(!F)return(0,t.jsx)("canvas",{ref:eP,"aria-hidden":"true",className:"absolute inset-0 block size-full"});let eK=z.busiest,eQ=`A slice of a tree trunk grown from ${z.username}'s ${z.total} GitHub contributions in ${z.year}: ${z.n} rings, one for each week from January at the pith to this week at the bark. Each day is a seventh of its ring, Sunday at the back and the rest clockwise, and the more contributions a day had, the wider and darker its part of the ring.${eK?` The widest, darkest band is ${0===eK.count?"No":eK.count} ${m(eK.count,"contribution")} on ${x=eK.date,c.format(new Date(864e5*f(x)))}.`:""}`,eJ=!P&&!ey&&eb;return(0,t.jsxs)("div",{ref:_,className:"absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]",style:{touchAction:"pan-y",cursor:P?"grab":void 0},onPointerDown:e=>{if(!F||!e.isPrimary||e.button>0||e.target.closest("[data-lab-controls]"))return;(0,o.ensureAudio)();let{x:t,y:a}=eG(e);S.pointerX=t,S.pointerY=a;let r=!!e.target.closest("[data-light]"),l=eY(t,a),n=eL(t,a),i={id:e.pointerId,kind:r?"grab":"pending",type:e.pointerType,x0:t,y0:a,t0:performance.now()/1e3,lastX:t,lastPhi:l.phi,sign:l.z>0?-1:1,moved:!1,onWood:!!n.day,ts:new Float64Array(8),gs:new Float64Array(8),n:0};S.drag=i;try{_.current?.setPointerCapture(e.pointerId)}catch{}"grab"===i.kind&&(ej(),S.loupeWant=!1,_.current&&(_.current.style.cursor="grabbing")),eF.current=i.type,window.clearTimeout(eM.current),"mouse"!==i.type&&"pending"===i.kind&&n.onSlice&&(S.loupeAimX=t,S.loupeAimY=a-S.loupeR-34,eM.current=window.setTimeout(()=>{let e=S.drag;e&&e===i&&"pending"===e.kind&&!e.moved&&(e.kind="loupe",eC.current())},260)),eO(i,e.timeStamp),eb||ew(!0),eI()},onPointerMove:e=>{if(!F)return;let{x:t,y:a}=eG(e);S.pointerX=t,S.pointerY=a,S.pointerIn=!0;let o=S.drag;if(!o){if("mouse"===e.pointerType){let e=eL(t,a);S.loupeWant=e.onSlice,S.loupeAimX=t,S.loupeAimY=a,e.onSlice||(S.hoverDay=null),_.current&&(_.current.style.cursor=e.onSlice?"crosshair":"grab")}eI();return}if(e.pointerId!==o.id)return;let l="mouse"===o.type?5:9;if(!o.moved&&Math.hypot(t-o.x0,a-o.y0)>l&&(o.moved=!0,"pending"===o.kind&&(o.kind="spin",ej(),S.loupeWant=!1,S.hoverDay=null,o.lastX=t,o.lastPhi=eY(t,a).phi,_.current&&(_.current.style.cursor="grabbing"))),"loupe"===o.kind)S.loupeAimX=t,S.loupeAimY=a-S.loupeR-34;else if("grab"===o.kind){let e=eY(t,a);S.azGoal+=ed(e.phi-S.azGoal)}else if("spin"===o.kind){let e=eY(t,a),l=t-o.lastX,n=Math.max(40,S.cam.pxPerUnit);if("mouse"===o.type||"pen"===o.type){let t=(0,r.smoothstep)(.22,.6,e.rho),a=e.z>0?-1:1;S.azGoal+=t*ed(e.phi-o.lastPhi)+(1-t)*a*(l/n)}else S.azGoal+=o.sign*(l/(.95*n));o.lastX=t,o.lastPhi=e.phi}eO(o,e.timeStamp),eI()},onPointerUp:e=>eH(e,!1),onPointerCancel:e=>eH(e,!0),onPointerLeave:e=>{!F||S.drag||"mouse"===e.pointerType&&(S.pointerIn=!1,S.loupeWant=!1,S.hoverDay=null,eI())},onContextMenu:e=>{"mouse"!==eF.current&&e.preventDefault()},children:[(0,t.jsx)("canvas",{ref:eP,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),(0,t.jsx)("div",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0",children:v.map((e,a)=>(0,t.jsx)("span",{ref:e=>{U.current[a]=e},"data-on":X&&X.weekday===a?"":void 0,className:"absolute start-0 top-0 text-[11px] leading-none font-medium tracking-[0.02em] text-tertiary transition-colors duration-200 will-change-transform data-[on]:text-primary",children:e},e))}),(0,t.jsx)("div",{role:"application",tabIndex:0,"aria-roledescription":"tree ring slice","aria-label":`Year rings. ${eQ}`,"aria-describedby":V,"aria-keyshortcuts":"ArrowLeft ArrowRight ArrowUp ArrowDown PageUp PageDown Home End Enter Q E Escape",onKeyDown:e=>{let t;if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey)return;(0,o.ensureAudio)();let a=S.pinned??S.hoverDay;switch(e.key){case"ArrowRight":t=a?k(z,a,1):ev(z);break;case"ArrowLeft":t=a?k(z,a,-1):ev(z);break;case"ArrowUp":t=a?R(z,a,1):ev(z);break;case"ArrowDown":t=a?R(z,a,-1):ev(z);break;case"PageUp":t=a?R(z,a,4):ev(z);break;case"PageDown":t=a?R(z,a,-4):ev(z);break;case"Home":t=z.days[0]??null;break;case"End":t=z.days[z.days.length-1]??null;break;case"q":case"Q":case"[":e.preventDefault(),eq(-Math.PI/6),eI();return;case"e":case"E":case"]":e.preventDefault(),eq(Math.PI/6),eI();return;case"Enter":case" ":{e.preventDefault();let t=a??ev(z);t&&(a||eW(t),T(z,t,eh),e$(eh.x,eh.z,eh.r)),eI();return}case"Escape":(S.pinned||S.loupeWant)&&(e.preventDefault(),eW(null),j(""),eI());return;default:return}e.preventDefault(),void 0!==t&&(t===a&&t?j(em(z,t)):eW(t),eI())},onFocus:e=>{try{e.currentTarget.matches(":focus-visible")&&eT(!0)}catch{}},onBlur:()=>eT(!1),className:"absolute inset-0 rounded-[24px] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"}),(0,t.jsx)("div",{ref:L,"data-light":"",role:"slider",tabIndex:0,"aria-label":"Light direction","aria-valuemin":0,"aria-valuemax":360,"aria-orientation":"horizontal",onKeyDown:e=>{let t=e.shiftKey?Math.PI/4:Math.PI/12;switch(e.key){case"ArrowRight":case"ArrowUp":eq(t);break;case"ArrowLeft":case"ArrowDown":eq(-t);break;case"PageUp":eq(Math.PI/2);break;case"PageDown":eq(-Math.PI/2);break;case"Home":eq(ed(Q-S.az));break;default:return}e.preventDefault(),(0,o.ensureAudio)(),eI()},className:"group/bead absolute start-0 top-0 grid size-10 touch-none place-items-center rounded-full outline-none will-change-transform",style:{cursor:"grab"},children:(0,t.jsx)("span",{"aria-hidden":"true",className:"block size-[15px] rounded-full bg-[radial-gradient(circle_at_38%_35%,#fffdf6_0%,#ffe7b8_42%,#f3b968_100%)] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_1px_3px_rgb(0_0_0/0.18),0_0_14px_3px_rgb(255_196_110/0.45)] transition-[scale,box-shadow] duration-200 ease-out group-hover/bead:scale-115 group-focus-visible/bead:shadow-[0_0_0_2px_var(--foreground),0_0_14px_3px_rgb(255_196_110/0.5)] group-active/bead:scale-125 dark:shadow-[0_0_0_1px_rgb(255_220_160/0.25),0_0_18px_5px_rgb(255_170_80/0.5)]"})}),(0,t.jsx)("div",{ref:N,"aria-hidden":"true",className:"pointer-events-none absolute start-0 top-0 z-[5] rounded-[10px] bg-float px-2.5 py-1.5 text-center text-[12px] leading-[1.35] whitespace-nowrap text-primary opacity-0 shadow-float transition-opacity duration-150 ease-out",children:X?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("span",{className:"font-medium tabular-nums",children:0===X.count?"No":X.count})," ",(0,t.jsxs)("span",{className:"text-secondary",children:[m(X.count,"contribution")," on ",function(e){let[,t,a]=e.date.split("-").map(Number),o=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][(t||1)-1];return`${v[e.weekday]}, ${o} ${a}`}(X)]}),(0,t.jsxs)("span",{className:"block text-[11px] text-tertiary",children:["Ring ",X.week+1," of ",z.n," · ",(y=z,A=X.week,(M=y.weeks[A])?`week of ${E=M.sunday,p.format(new Date(864e5*E))}`:"")]})]}):null}),(0,t.jsx)("p",{id:V,className:"sr-only",children:"The light rides on a dial round the slice: drag anywhere, or move the light's handle with the arrow keys."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:O}),(0,t.jsx)(l.StageControls,{placement:"top",className:"sm:hidden",children:(0,t.jsx)(eg,{rings:z})}),(0,t.jsxs)(l.StageControls,{placement:"bottom",children:[(0,t.jsxs)(l.TrayRow,{children:[(0,t.jsx)(eg,{rings:z,className:"max-sm:hidden"}),(0,t.jsxs)(l.Tray,{label:"Controls",children:[(0,t.jsx)(l.TrayButton,{icon:(0,t.jsx)(n,{size:15}),onClick:()=>{(0,o.ensureAudio)(),ez(),eI()},children:"Grow"}),(0,t.jsx)(l.TrayDivider,{}),(0,t.jsx)(l.MuteButton,{})]})]}),(0,t.jsx)(l.StageHint,{className:`transition-opacity duration-500 ease-out ${eJ?"opacity-0":"opacity-100"}`,children:(0,t.jsx)("span",{"aria-hidden":!!eJ||void 0,children:ey?ek?"← → days · ↑ ↓ rings · Q E light":"← → walk the days · ↑ ↓ the rings · Enter knocks · Q E swing the light":P?"Move over the wood to look closer · Drag to swing the light round · Click to knock":ek?"Tap a ring · Hold for the loupe · Swipe to turn the light":"Tap a ring for its day · Hold to look closer · Swipe sideways to swing the light"})})]})]})}function em(e,t){var a;return`${0===t.count?"No":t.count} ${m(t.count,"contribution")} on ${a=t.date,d.format(new Date(864e5*f(a)))}, ring ${t.week+1} of ${e.n}.`}function ev(e){for(let t=e.days.length-1;t>=0;t--)if(e.days[t].count>0)return e.days[t];return e.days[e.days.length-1]??null}function eg({rings:e,className:a}){let o=e.maxCount||1,n=[0,Math.max(1,Math.round(o/14)),Math.max(2,Math.round(o/4)),o].filter((e,t,a)=>a.indexOf(e)===t),i=1,s=n.map(e=>{let t=2+1.05*Math.sqrt(e),a={x:i,w:t,level:e>0?1-Math.exp(-e/6.2):0,count:e};return i+=t+3,a}),u=i;return(0,t.jsxs)(l.Tray,{label:"Legend",className:a,children:[(0,t.jsx)("div",{className:"flex h-10 items-center gap-2 ps-2.5 pe-2",children:(0,t.jsxs)("span",{className:"text-[13px] whitespace-nowrap text-primary",children:[(0,t.jsx)("span",{className:"font-medium tabular-nums",children:e.total.toLocaleString("en-US")})," ",(0,t.jsxs)("span",{className:"text-secondary",children:["contributions in ",e.year]})]})}),(0,t.jsx)(l.TrayDivider,{}),(0,t.jsxs)("div",{className:"flex h-10 items-center gap-1.5 ps-1.5 pe-2.5",role:"img","aria-label":`A ring is wider and darker the more contributions its day had: from none to ${o}`,children:[(0,t.jsx)("span",{"aria-hidden":"true",className:"text-[11px] text-tertiary tabular-nums",children:"0"}),(0,t.jsx)("svg",{"aria-hidden":"true",width:Math.ceil(u),height:18,viewBox:`0 0 ${Math.ceil(u)} 18`,children:s.map(e=>(0,t.jsxs)("g",{children:[(0,t.jsx)("rect",{x:e.x,y:2,width:e.w,height:14,rx:1,fill:"#e2c7a2"}),(0,t.jsx)("rect",{x:e.x+e.w*(1-(0,r.lerp)(.22,.55,e.level)),y:2,width:e.w*(0,r.lerp)(.22,.55,e.level),height:14,rx:.8,fill:e.level>.5?"#6e4426":e.level>.1?"#9a6a42":"#c39d71"})]},e.count))}),(0,t.jsx)("span",{"aria-hidden":"true",className:"text-[11px] text-tertiary tabular-nums",children:o})]})]})}function ex({mode:e,theme:o,rings:r}){let l=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=l.current;if(!t)return;let a=()=>{let a=t.getBoundingClientRect(),l=Math.min(window.devicePixelRatio||1,2);t.width=Math.max(1,Math.round(a.width*l)),t.height=Math.max(1,Math.round(a.height*l));let n=t.getContext("2d");if(!n)return;n.setTransform(l,0,0,l,0,0),n.clearRect(0,0,a.width,a.height);let i="stage"===e,s=a.width/2,f=i?.45*a.height:a.height/2,c=.44*Math.min(a.width,a.height*(i?.78:1)),d=(e,t)=>{n.beginPath();for(let a=0;a<=96;a++){let o=a/96*u,l=(x(r,e,o)+t)*c,i=s+Math.sin(o)*l,h=f-Math.cos(o)*l;a?n.lineTo(i,h):n.moveTo(i,h)}n.closePath()};n.fillStyle="dark"===o?"#4a3d34":"#6f6156",d(r.n,.045),n.fill(),n.fillStyle="#e4c9a3",d(r.n,0),n.fill();for(let e=1;e<=r.n;e++)for(let t=0;t<7;t++){let a=r.weeks[e-1]?.days[t];if(a){n.beginPath();for(let a=0;a<=8;a++){let o=(t-.5+a/8)*h,l=x(r,e,o)*c-.6,i=s+Math.sin(o)*l,u=f-Math.cos(o)*l;a?n.lineTo(i,u):n.moveTo(i,u)}n.strokeStyle=a.level>.5?"#6e4426":a.level>.1?"#9a6a42":"#c9a67c",n.lineWidth=.8+2.2*a.level,n.stroke()}}n.fillStyle="#7a5034",n.beginPath(),n.arc(s,f,Math.max(1.5,x(r,0,0)*c),0,u),n.fill()};a();let n=new ResizeObserver(a);return n.observe(t),()=>n.disconnect()},[e,o,r]),(0,t.jsx)("canvas",{ref:l,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?`Year rings: ${r.total} GitHub contributions in ${r.year} as the rings of a tree, one ring per week`:void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function(e){return(0,t.jsx)(ep,{...e})}],10806)},37211,function(e){e.n(e.i(10806))}]);