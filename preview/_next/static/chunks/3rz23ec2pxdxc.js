(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,80443,e=>{"use strict";var t=e.i(43476),a=e.i(71645),o=e.i(16442),r=e.i(37047),i=e.i(7537),n=e.i(45219);let l=[[7,1,2,2],[5,3,2,3],[9,3,2,3],[3,6,2,4],[11,6,2,4],[1,10,2,5],[13,10,2,5],[7,10,2,2]];function s(e=document.createElement("canvas"),t=500){e.width=1024,e.height=1024;let a=e.getContext("2d");if(!a)return e;a.clearRect(0,0,1024,1024),a.fillStyle="#fff";let o=function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(e)return`${e}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}();a.textAlign="center",a.textBaseline="alphabetic",a.font=`${t} ${Math.round(256*(t>500?.4:.36))}px ${o}`;for(let e=0;e<9;e++){let t=e%3*256+128,o=256*Math.floor(e/3)+128,r=String(e+1),i=a.measureText(r),n=i.actualBoundingBoxAscent||66.56,l=i.actualBoundingBoxDescent||0;a.fillText(r,t,o+(n-l)/2-2.56)}let r=768,i=102.4,n=92.16,h=844.8,u=6.4;for(let[e,t,o,r]of l)a.fillRect(n+e*u,h+t*u,o*u,r*u);return a.textAlign="left",a.textBaseline="middle",a.font=`500 ${Math.round(69.12)}px ${o}`,"letterSpacing"in a&&(a.letterSpacing="1px"),a.fillText("arsher",n+i+35.84,r+128+2.56),e}let h=()=>{let e=new Float32Array(16);return e[0]=e[5]=e[10]=e[15]=1,e},u=[0,1,0],c=new Float32Array(16);function f(e,t,a){let o=0;for(let r=0;r<e.length;r++){let[i,n]=e[r],[l,s]=e[(r+1)%e.length],h=(l-i)*(a-n)-(s-n)*(t-i);if(1e-9>Math.abs(h))continue;let u=h>0?1:-1;if(o){if(u!==o)return!1}else o=u}return!0}function d(e){let t=e.slice().sort((e,t)=>e[0]-t[0]||e[1]-t[1]);if(t.length<3)return t;let a=(e,t,a)=>(t[0]-e[0])*(a[1]-e[1])-(t[1]-e[1])*(a[0]-e[0]),o=[];for(let e of t){for(;o.length>=2&&0>=a(o[o.length-2],o[o.length-1],e);)o.pop();o.push(e)}let r=[];for(let e=t.length-1;e>=0;e--){let o=t[e];for(;r.length>=2&&0>=a(r[r.length-2],r[r.length-1],o);)r.pop();r.push(o)}return r.pop(),o.pop(),o.concat(r)}function p(e){let t=e.replace("#",""),a=e=>{let a=parseInt(t.slice(e,e+2),16)/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4};return[a(0),a(2),a(4)]}let g=e=>{let t=Math.min(1,Math.max(0,e));return Math.round(255*(t<=.0031308?12.92*t:1.055*t**(1/2.4)-.055))};function m(e){return`rgb(${g(e[0])} ${g(e[1])} ${g(e[2])})`}let v={halfWidth:1.83,front:1.83,back:-2.73,radius:.34,height:.62,chamfer:.05},x=(v.front+v.back)/2,b=(v.front-v.back)/2,w=1.535,T=.14,y=.03,A={base:.455,baseRadius:.075,topX:.352,topZ:.338,topRadius:.11,topShift:-.014,height:.4,dish:.054,fillet:.034},E=v.height+.03,M=Array.from({length:9},(e,t)=>{let a=t%3,o=Math.floor(t/3);return{index:t,col:a,row:o,x:a-1,z:o-1}}),k=(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],P=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],R=(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2],_=e=>{let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]};function C(e){let t=[],a=[];for(let o of e){let e=t.length/7,{us:r,vs:i,at:n}=o,l=i[0],s=i[i.length-1];for(let e of i)for(let a of r){let r=n(a,e),i=k(n(o.wrap?(a+1e-4)%1:Math.min(1,a+1e-4),e),n(o.wrap?(a-1e-4+1)%1:Math.max(0,a-1e-4),e)),h=Math.max(l,e-1e-4),u=P(i,k(n(a,Math.min(s,e+1e-4)),n(a,h))),c=o.facing(r);1e-12>Math.hypot(u[0],u[1],u[2])&&(u=c),0>R(u=_(u),c)&&(u=[-u[0],-u[1],-u[2]]),t.push(r[0],r[1],r[2],u[0],u[1],u[2],o.tag)}let h=r.length,u=o.wrap?h:h-1;for(let t=0;t<i.length-1;t++)for(let o=0;o<u;o++){let r=e+t*h+o,i=e+t*h+(o+1)%h,n=e+(t+1)*h+o,l=e+(t+1)*h+(o+1)%h;a.push(r,i,n,i,l,n)}}return{vertices:new Float32Array(t),indices:new Uint32Array(a)}}function S(e,t,a,o,r=0,i=0){let n,l,s=Math.max(5e-4,Math.min(o,t,a)),h=t-s,u=a-s,c=(e%1+1)%1,f=Math.min(7,Math.floor(8*c)),d=8*c-f;switch(f){case 0:{let e=Math.PI/2*d;n=h+s*Math.cos(e),l=u+s*Math.sin(e);break}case 1:n=h-2*h*d,l=a;break;case 2:{let e=Math.PI/2+Math.PI/2*d;n=-h+s*Math.cos(e),l=u+s*Math.sin(e);break}case 3:n=-t,l=u-2*u*d;break;case 4:{let e=Math.PI+Math.PI/2*d;n=-h+s*Math.cos(e),l=-u+s*Math.sin(e);break}case 5:n=-h+2*h*d,l=-a;break;case 6:{let e=1.5*Math.PI+Math.PI/2*d;n=h+s*Math.cos(e),l=-u+s*Math.sin(e);break}default:n=t,l=-u+2*u*d}return[r+n,i+l]}function F(e,t){let a=[];for(let o=0;o<8;o++){let r=o%2==0?e:t;for(let e=0;e<r;e++)a.push((o+e/r)/8)}return a}let L=(e,t,a,o=e=>e)=>Array.from({length:a+1},(r,i)=>e+(t-e)*o(i/a));function D(e,t){let a=e/A.topX,o=(t-A.topShift)/A.topZ;return A.height-A.dish*(1-(a*a+o*o)/2)}let N=e=>Number.isInteger(e)?`${e}.0`:`${e}`,z=`#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aTag;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform vec4 uFit;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
flat out int vTag;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vWorld = world.xyz;
  vNormal = mat3(uModel) * aNormal;
  vLocal = aPos;
  vTag = int(aTag + 0.5);
  vec4 clip = uViewProj * world;
  clip.xy = clip.xy * uFit.xy + uFit.zw * clip.w;
  gl_Position = clip;
}
`,I=`
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
flat in int vTag;
out vec4 outColor;

uniform mat4 uModel;
uniform vec3 uCamPos;
uniform int uKey;          // which cap this draw is (-1 for the rest)
uniform float uTravel;     // this cap's travel (0 up … 1 bottomed out)

uniform vec3 uGlow[9];     // each LED, colour \xd7 intensity (linear)
uniform float uPress[9];   // each cap's travel
uniform vec4 uRipple[8];       // x, z, radius, amplitude
uniform vec3 uRippleColor[8];
uniform int uRippleCount;  // live ripples come first
uniform vec3 uKnobLight;   // the knob's indicator (colour \xd7 intensity)
uniform float uGlowGain;
uniform float uEmitKnee;   // where the LED light starts to roll off (lower by day)

#define TAG_GROUND 0
#define TAG_WALL 1
#define TAG_CHAMFER 2
#define TAG_TOP 3
#define TAG_POCKET_CHAMFER 4
#define TAG_POCKET_WALL 5
#define TAG_PLATE 6
#define TAG_CAP 7
#define TAG_KNOB_SIDE 8
#define TAG_KNOB_CHAMFER 9
#define TAG_KNOB_TOP 10
#define TAG_SHAFT 11

const float PLATE_Y = ${N(.4)};
const float CASE_H = ${N(v.height)};
const float CASE_HW = ${N(v.halfWidth)};
const float CASE_HD = ${N(b)};
const float CASE_CZ = ${N(x)};
const float CASE_R = ${N(v.radius)};
const float POCKET_HALF = ${N(w)};
const float POCKET_R = ${N(T)};
const float CAP_BASE = ${N(A.base)};
const float CAP_H = ${N(A.height)};
const float CAP_TOPX = ${N(A.topX)};
const float CAP_TOPZ = ${N(A.topZ)};
const float CAP_SHIFT = ${N(A.topShift)};
const float CAP_TOPR = ${N(A.topRadius)};
const float CAP_DISH = ${N(A.dish)};
const float CAP_FILLET = ${N(A.fillet)};
const float SKIRT_REST = ${N(.28)};
const float TRAVEL = ${N(.2)};
const vec2 KNOB_C = vec2(${N(1)}, ${N(-2.09)});
const float KNOB_R = ${N(.355)};
const float KNOB_H = ${N(.43)};
const vec4 ENGRAVING = vec4(${N(-.62)}, ${N(-2.09)}, ${N(.9)}, ${N(.225)});

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec2 keyCentre(int k) {
  return vec2(float(k - (k / 3) * 3) - 1.0, float(k / 3) - 1.0);
}

/** Light on the plate at p (xz): the LED pools and the ripples. */
vec3 plateGlow(vec2 p) {
  vec3 g = vec3(0.0);
  for (int k = 0; k < 9; k++) {
    float press = uPress[k];
    vec2 q = p - keyCentre(k);
    float sd = sdRoundBox(q, vec2(CAP_BASE - 0.03), 0.1);
    float fall = mix(6.5, 10.0, press);
    // each LED is a point under its cap: brightest where the skirt is
    // nearest (mid-side), dimmer into the corners where four caps meet,
    // so the light pools in scallops instead of filling the gaps evenly
    float spot = min(1.2, exp(-(dot(q, q) - 0.25) * 4.0));
    float pool = exp(-max(sd, 0.0) * fall) * spot;
    // under the skirt the light is hidden, but let it read through gaps
    g += uGlow[k] * pool * (1.0 + 0.5 * press);
  }
  for (int i = 0; i < 8; i++) {
    if (i >= uRippleCount) break;
    vec4 r = uRipple[i];
    if (r.w <= 0.0005) continue;
    float d = length(p - r.xy);
    float w = 0.16 + r.z * 0.09;
    float x = (d - r.z) / w;
    g += uRippleColor[i] * (r.w * exp(-x * x));
  }
  return g * uGlowGain;
}

/**
 * A hue-keeping shoulder for LED light: below the knee it is untouched,
 * above it the brightest channel rolls off and the others follow in
 * proportion, so a hot key stays tinted light instead of clipping to a
 * white band on the walls and the polished edge.
 */
vec3 softLight(vec3 e, float knee) {
  float m = max(max(e.r, e.g), e.b);
  if (m <= knee * 0.5) return e;
  float over = m - knee * 0.5;
  float rolled = knee * 0.5 + knee * 0.5 * (1.0 - exp(-over / (knee * 0.5)));
  return e * (rolled / m);
}

/** How much of the plate's light reaches a cap wall at height h with normal n (0 high up). */
float wallGlow(float h, vec3 n) {
  // the small offset lets it reach exactly zero, so the upper walls and the
  // top skip plateGlow without a visible edge
  return max(exp(-max(h, 0.0) / 0.1) * (0.55 - 0.45 * n.y) - 0.003, 0.0) * 1.06;
}
`,B=`
uniform vec3 uKeyDir;
uniform vec3 uKeyColor;
uniform vec3 uSky;
uniform vec3 uHorizon;
uniform vec3 uFloor;
uniform vec3 uSoftbox;
uniform vec3 uStrip;
uniform float uAmbient;
uniform float uExposure;

uniform vec3 uCaseAlbedo;
uniform vec3 uCaseF0;
uniform float uCaseRough;
uniform float uCaseMetal;
uniform vec3 uEdgeF0;
uniform vec3 uPlateAlbedo;
uniform vec3 uCapAlbedo;
uniform vec3 uLegend;
uniform vec3 uEngrave;
uniform vec3 uKnobF0;
uniform vec2 uShadow;      // contact, soft (ground shadow strengths)
uniform float uDetail;     // 1 on the stage, lower on tiles (fine texture)
uniform sampler2D uAtlas;

const float PI = 3.14159265;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float rectLight(vec3 r, vec3 c, vec2 halfSize, float rough) {
  float d = dot(r, c);
  if (d <= 0.0) return 0.0;
  vec3 up = abs(c.y) > 0.98 ? vec3(0.0, 0.0, -1.0) : vec3(0.0, 1.0, 0.0);
  vec3 bx = normalize(cross(up, c));
  vec3 by = cross(c, bx);
  vec3 q = r / d;
  vec2 uv = vec2(dot(q, bx), dot(q, by));
  float blur = 0.015 + rough * rough * 1.1;
  vec2 m = smoothstep(halfSize + blur, halfSize - blur, abs(uv));
  // a rough surface spreads the same light over a bigger patch
  float spread = (halfSize.x * halfSize.y) / ((halfSize.x + blur) * (halfSize.y + blur));
  return m.x * m.y * mix(1.0, spread, 0.85);
}

const vec3 SOFTBOX_DIR = vec3(-0.16, 0.97, -0.1);
const vec3 FILL_DIR = vec3(0.05, 0.55, 0.83);
const vec3 STRIP_DIR = vec3(-0.93, 0.33, 0.16);

vec3 environment(vec3 r, float rough) {
  vec3 col = mix(uFloor, uHorizon, smoothstep(-0.4, 0.04, r.y));
  col = mix(col, uSky, smoothstep(0.04, 0.85, r.y));
  col += uSoftbox * rectLight(r, normalize(SOFTBOX_DIR), vec2(0.42, 0.25), rough);
  col += uSoftbox * 0.3 * rectLight(r, normalize(FILL_DIR), vec2(0.7, 0.2), rough);
  col += uStrip * rectLight(r, normalize(STRIP_DIR), vec2(0.06, 0.55), rough);
  return col;
}

vec3 irradiance(vec3 n) {
  vec3 hemi = mix(uFloor, uSky, smoothstep(-0.6, 0.9, n.y)) * uAmbient;
  hemi += uSoftbox * 0.14 * max(dot(n, normalize(SOFTBOX_DIR)), 0.0);
  hemi += uSoftbox * 0.05 * max(dot(n, normalize(FILL_DIR)), 0.0);
  hemi += uStrip * 0.05 * max(dot(n, normalize(STRIP_DIR)), 0.0);
  return hemi;
}

/** Anisotropic GGX (t: along the grooves, b: across). */
float ggxAniso(vec3 n, vec3 h, vec3 t, vec3 b, float at, float ab) {
  float th = dot(t, h);
  float bh = dot(b, h);
  float nh = max(dot(n, h), 0.0);
  float d = th * th / (at * at) + bh * bh / (ab * ab) + nh * nh;
  return 1.0 / (PI * at * ab * d * d);
}

float ggx(float NoH, float rough) {
  float a = rough * rough;
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

vec3 shade(vec3 n, vec3 v, vec3 albedo, vec3 f0, float rough, float metal, float ao, float shadow, float specScale) {
  vec3 l = normalize(uKeyDir);
  vec3 h = normalize(l + v);
  float NoV = max(dot(n, v), 0.0);
  float NoL = max(dot(n, l), 0.0);
  float NoH = max(dot(n, h), 0.0);
  vec3 F = f0 + (max(vec3(1.0 - rough), f0) - f0) * pow(1.0 - NoV, 5.0);
  vec3 r = reflect(-v, n);
  vec3 diffuse = albedo * (1.0 - metal) * (irradiance(n) * ao + uKeyColor * NoL * shadow * 0.85);
  float specOcc = clamp(pow(NoV + ao, exp2(-16.0 * rough - 1.0)) - 1.0 + ao, 0.0, 1.0);
  vec3 spec = environment(r, rough) * F * specOcc;
  spec += uKeyColor * F * ggx(NoH, max(rough, 0.08)) * NoL * shadow * 0.55;
  return diffuse + spec * specScale;
}

vec3 shade(vec3 n, vec3 v, vec3 albedo, vec3 f0, float rough, float metal, float ao, float shadow) {
  return shade(n, v, albedo, f0, rough, metal, ao, shadow, 1.0);
}

/** Soft occlusion from the caps for a point at height y over (p.xz). */
float capShadow(vec2 p, float y, out float contact) {
  vec3 l = normalize(uKeyDir);
  float occ = 1.0;
  contact = 1.0;
  for (int k = 0; k < 9; k++) {
    float skirt = PLATE_Y + SKIRT_REST - uPress[k] * TRAVEL;
    float top = skirt + CAP_H;
    float above = top * 0.6 + skirt * 0.4 - y;
    if (above <= 0.0) continue;
    vec2 off = l.xz / max(l.y, 0.2) * above;
    float sd = sdRoundBox(p - keyCentre(k) + off, vec2(CAP_BASE - 0.05), 0.12);
    float blur = 0.04 + above * 0.22;
    occ = min(occ, mix(0.42, 1.0, smoothstep(-blur, blur, sd)));
    float gap = max(skirt - y, 0.0);
    float sdc = sdRoundBox(p - keyCentre(k), vec2(CAP_BASE - 0.02), 0.08);
    contact = min(contact, mix(0.2 + gap * 1.6, 1.0, smoothstep(0.0, 0.05 + gap * 0.9, sdc)));
  }
  return occ;
}

vec3 tonemap(vec3 c) {
  c *= uExposure;
  // linear through the mids, then a long, soft shoulder: bright surfaces
  // (white caps, the silver case under the softbox) keep their gradients
  // instead of flattening onto a plateau, and only real glints reach white
  vec3 x = max(c, 0.0);
  vec3 over = max(x - 0.7, 0.0);
  return min(x, 0.7 + over / (1.0 + over / 0.36));
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
`,G=`
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCamPos - vWorld);
  vec3 p = vWorld;
  float ao = 1.0;
  float shadow = 1.0;
  vec3 color;
  vec3 emit = vec3(0.0);
  float alpha = 1.0;
  // display-space shading for the dish (see the caps): the tonemap's
  // shoulder would flatten it on light caps otherwise
  float cavity = 1.0;

  if (vTag == TAG_GROUND) {
    vec2 q = p.xz - vec2(0.0, CASE_CZ);
    float sd = sdRoundBox(q, vec2(CASE_HW, CASE_HD), CASE_R);
    vec3 l = normalize(uKeyDir);
    vec2 off = -l.xz / l.y * CASE_H * 0.55;
    float sd2 = sdRoundBox(q - off, vec2(CASE_HW, CASE_HD) - 0.06, CASE_R);
    float contact = exp(-max(sd, 0.0) / 0.035);
    float near = exp(-max(sd, 0.0) / 0.22);
    float soft = 1.0 - smoothstep(-0.35, 0.95, sd2);
    alpha = clamp(uShadow.x * contact + uShadow.y * (0.55 * soft + 0.45 * near), 0.0, 1.0);
    outColor = vec4(0.0, 0.0, 0.0, alpha);
    return;
  }

  // fine bead-blast texture for the metal, a little grain on the caps
  float grain = (vnoise(p.xz * 260.0 + p.y * 37.0) - 0.5) * uDetail;

  if (vTag == TAG_CAP) {
    vec3 local = vLocal;
    float h = p.y - PLATE_Y;
    // walls darken towards the plate, more so when the cap is down in the well
    ao = mix(0.32, 1.0, smoothstep(0.02, 0.34, h));
    ao *= mix(1.0, 0.9, uTravel);

    // the sculpted dish: the mesh carries the true (shallow) dish; shading
    // it a little steeper makes the scoop read at stage size, the near half
    // turning to the key light and the far half to the softbox
    vec2 d = vec2(local.x, local.z - CAP_SHIFT);
    float sdTop = sdRoundBox(d, vec2(CAP_TOPX, CAP_TOPZ) - CAP_FILLET, CAP_TOPR - CAP_FILLET * 0.6);
    float onTop = step(CAP_H - CAP_DISH - CAP_FILLET - 0.02, local.y);
    float dishW = (1.0 - smoothstep(-0.035, 0.0, sdTop)) * onTop;
    vec2 slope = CAP_DISH * d / vec2(CAP_TOPX * CAP_TOPX, CAP_TOPZ * CAP_TOPZ);
    n = normalize(n - vec3(slope.x, 0.0, slope.y) * 1.6 * dishW);
    vec3 nSmooth = n;
    // light caps sit high on the tonemap's shoulder, where that shading is
    // all but flattened: the inner wall on the light's side of the dish
    // (turned away from it) goes a little darker, the other a little
    // lighter, after the tonemap, so the scoop reads on chalk as on graphite
    float side = dot(d / vec2(CAP_TOPX, CAP_TOPZ), normalize(uKeyDir.xz + vec2(0.0, 0.25)));
    cavity = 1.0 - 0.06 * dishW * side;
    // a faint micro-texture breaks the CG smoothness of PBT
    vec3 nb = n + vec3(grain, 0.0, (vnoise(p.zx * 240.0) - 0.5) * uDetail) * 0.05;
    n = normalize(nb);
    vec3 albedo = uCapAlbedo * (0.985 + 0.03 * hash(vec2(float(uKey), 3.7)));
    color = shade(n, v, albedo, vec3(0.034), 0.46, 0.0, ao, 1.0);

    // the lip where the dish rolls into the top edge is polished a little by
    // fingers: a thin, sharper sheen there, strongest on the far side where
    // it faces the softbox
    float lip = smoothstep(-0.05, -0.014, sdTop) * (1.0 - smoothstep(0.004, 0.03, sdTop)) * onTop;
    float far = smoothstep(-0.1, 0.85, -d.y / CAP_TOPZ);
    if (lip > 0.001) {
      vec3 r = reflect(-v, nSmooth);
      float NoV = max(dot(nSmooth, v), 0.0);
      float F = 0.04 + 0.5 * pow(1.0 - NoV, 5.0);
      color += environment(r, 0.24) * F * lip * mix(0.35, 1.0, far) * 1.5;
    }

    // the legend, dye-sublimated into the top: the ink sits in the plastic,
    // so it keeps the dish's shading but not its grain, and sheens less, so
    // it holds its value on every colourway
    if (local.y > CAP_H - 0.08 && uKey >= 0) {
      vec2 uv = vec2(local.x / (CAP_TOPX * 1.7) + 0.5, (local.z - CAP_SHIFT) / (CAP_TOPZ * 1.7) + 0.5);
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        vec2 cell = vec2(float(uKey - (uKey / 3) * 3), float(uKey / 3));
        float a = texture(uAtlas, (cell + uv) / 4.0).a;
        float ink = smoothstep(0.06, 0.62, a);
        if (ink > 0.002) {
          vec3 inked = shade(nSmooth, v, uLegend, vec3(0.03), 0.52, 0.0, ao, 1.0, 0.4);
          color = mix(color, inked, ink);
        }
      }
    }

    // glow from the plate climbs the lower walls (the upper walls and the
    // top are too high for it: skip the loop there)
    float wg = wallGlow(h, n);
    if (wg > 0.0) {
      vec2 outward = normalize(n.xz + 1e-4) * 0.06;
      vec3 g = softLight(plateGlow(p.xz + outward) * wg, uEmitKnee);
      emit += g * mix(vec3(1.0), uCapAlbedo * 1.6 + 0.25, 0.6);
    }
  } else if (vTag == TAG_PLATE) {
    float contact;
    float occ = capShadow(p.xz, p.y, contact);
    float sdPocket = -sdRoundBox(p.xz, vec2(POCKET_HALF), POCKET_R);
    float wallAo = mix(0.35, 1.0, smoothstep(0.0, 0.16, sdPocket));
    ao = contact * wallAo * 0.55;
    color = shade(n, v, uPlateAlbedo, uCaseF0 * 0.6, 0.5, 0.25, ao, occ * wallAo);
    emit += softLight(plateGlow(p.xz) * (0.55 + 0.45 * contact) * mix(0.7, 1.0, wallAo), uEmitKnee * 1.3);
  } else if (vTag == TAG_KNOB_SIDE || vTag == TAG_KNOB_CHAMFER || vTag == TAG_KNOB_TOP || vTag == TAG_SHAFT) {
    mat3 rot = mat3(uModel);
    vec3 local = vLocal;
    float a = atan(local.z, local.x);
    float rough = 0.3;
    vec3 f0 = uKnobF0;
    if (vTag == TAG_KNOB_SIDE) {
      // a knurled band between two smooth rings
      float band = smoothstep(0.07, 0.1, local.y) * smoothstep(KNOB_H - 0.06, KNOB_H - 0.09, local.y);
      float phase = a * 54.0;
      float ridge = sin(phase) * clamp(1.5 - fwidth(phase) * 0.9, 0.0, 1.0);
      vec3 radial = vec3(cos(a), 0.0, sin(a));
      vec3 tangent = vec3(-sin(a), 0.0, cos(a));
      vec3 ln = normalize(radial + tangent * ridge * 0.55 * band);
      n = normalize(rot * ln);
      rough = mix(0.3, 0.42, band);
      ao = mix(0.55, 1.0, smoothstep(0.0, 0.12, local.y)) * mix(1.0, 0.86 + 0.14 * abs(ridge), band);
    } else if (vTag == TAG_KNOB_CHAMFER) {
      rough = 0.12;
      f0 = uEdgeF0;
    } else if (vTag == TAG_KNOB_TOP) {
      // concentric machining: faint rings (only where they resolve) and an
      // anisotropic sheen that throws the highlight into a radial streak
      float r = length(local.xz);
      vec3 radial = vec3(local.x, 0.0, local.z) / max(r, 1e-4);
      float phase = r * 190.0;
      float resolve = clamp(1.4 - fwidth(phase) * 1.2, 0.0, 1.0);
      float rings = sin(phase) * 0.035 * uDetail * resolve;
      n = normalize(rot * normalize(vec3(0.0, 1.0, 0.0) + radial * rings));
      rough = 0.32;
      vec3 tw = normalize(rot * vec3(-radial.z, 0.0, radial.x));
      vec3 bw = normalize(rot * radial);
      for (int i = 0; i < 3; i++) {
        vec3 ld = i == 0 ? normalize(uKeyDir) : i == 1 ? normalize(SOFTBOX_DIR) : normalize(FILL_DIR);
        vec3 lc = i == 0 ? uKeyColor * 0.5 : i == 1 ? uSoftbox * 0.12 : uSoftbox * 0.05;
        vec3 hh = normalize(ld + v);
        float nl = max(dot(n, ld), 0.0);
        emit += lc * f0 * ggxAniso(n, hh, tw, bw, 0.05, 0.42) * nl * 0.5;
      }
      // the indicator: a small lit dot near the edge
      vec2 dotPos = vec2(KNOB_R * 0.66, 0.0);
      float dd = length(local.xz - dotPos);
      // a small engraved well with the lit dot in it
      float well = smoothstep(0.047, 0.04, dd);
      float lamp = smoothstep(0.032, 0.025, dd);
      f0 = mix(f0, f0 * 0.12, well);
      rough = mix(rough, 0.6, well);
      emit += uKnobLight * uGlowGain * (lamp * 1.5 + exp(-dd / 0.02) * 0.2);
    } else {
      f0 = vec3(0.02);
      rough = 0.6;
      ao = 0.2;
    }
    color = shade(n, v, vec3(0.0), f0, rough, 1.0, ao, 1.0);
  } else {
    // the case
    vec3 albedo = uCaseAlbedo;
    vec3 f0 = uCaseF0;
    float rough = uCaseRough + grain * 0.12;
    float metal = uCaseMetal;
    if (vTag == TAG_CHAMFER || vTag == TAG_POCKET_CHAMFER) {
      f0 = uEdgeF0;
      rough = 0.1 + grain * 0.04;
      metal = 1.0;
      albedo = vec3(0.0);
    }
    if (vTag == TAG_TOP) {
      // knob shadow and contact ring
      float dk = length(p.xz - KNOB_C);
      vec3 l = normalize(uKeyDir);
      vec2 off = l.xz / l.y * (KNOB_H * 0.6);
      float ds = length(p.xz - KNOB_C + off);
      shadow *= mix(0.45, 1.0, smoothstep(KNOB_R - 0.06, KNOB_R + 0.14, ds));
      ao *= mix(0.4, 1.0, smoothstep(KNOB_R - 0.01, KNOB_R + 0.07, dk));
      // caps shadow the frame round the pocket (they can't reach further
      // than this, where capShadow is exactly 1)
      float sdPocket = sdRoundBox(p.xz, vec2(POCKET_HALF), POCKET_R);
      if (sdPocket < 0.32) {
        float contact;
        shadow *= capShadow(p.xz, p.y, contact);
      }
      // the engraving
      vec2 uv = (p.xz - ENGRAVING.xy) / (ENGRAVING.zw * 2.0) + 0.5;
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        float ink = texture(uAtlas, vec2(uv.x, 0.75 + uv.y * 0.25)).a;
        albedo = mix(albedo, uEngrave, ink);
        f0 = mix(f0, f0 * 0.3, ink);
        metal = mix(metal, 0.2, ink);
        rough = mix(rough, 0.75, ink);
      }
      // glow spills a touch onto the frame right at the pocket
      float spill = max(0.05 * exp(-max(sdPocket, 0.0) / 0.03) - 0.0004, 0.0);
      if (spill > 0.0) emit += softLight(plateGlow(p.xz * 0.96) * spill, uEmitKnee);
    } else if (vTag == TAG_POCKET_WALL) {
      float h = p.y - PLATE_Y;
      ao = mix(0.3, 0.75, smoothstep(0.0, CASE_H - PLATE_Y, h));
      shadow = 0.5;
      emit += softLight(plateGlow(p.xz + n.xz * 0.12) * exp(-h / 0.12) * 0.8, uEmitKnee);
    } else if (vTag == TAG_POCKET_CHAMFER) {
      // the polished edge mirrors the light in the pocket
      emit += softLight(plateGlow(p.xz + n.xz * 0.16) * 0.4, uEmitKnee * 0.8);
      float contact;
      shadow *= capShadow(p.xz, p.y, contact);
    } else if (vTag == TAG_WALL) {
      ao = mix(0.55, 1.0, smoothstep(0.0, 0.2, p.y));
    }
    color = shade(n, v, albedo, f0, clamp(rough, 0.05, 1.0), metal, ao, shadow);
  }

  color += emit;
  outColor = vec4(toSrgb(tonemap(color)) * cavity, 1.0);
}
`,O=`
void main() {
  vec3 n = normalize(vNormal);
  vec3 p = vWorld;
  vec3 emit = vec3(0.0);
  if (vTag == TAG_PLATE) {
    emit = softLight(plateGlow(p.xz), uEmitKnee * 1.3);
  } else if (vTag == TAG_CAP) {
    float wg = wallGlow(p.y - PLATE_Y, n);
    if (wg > 0.0) emit = softLight(plateGlow(p.xz + normalize(n.xz + 1e-4) * 0.06) * wg, uEmitKnee);
  } else if (vTag == TAG_POCKET_WALL) {
    float h = p.y - PLATE_Y;
    emit = softLight(plateGlow(p.xz + n.xz * 0.12) * exp(-h / 0.12) * 0.8, uEmitKnee);
  } else if (vTag == TAG_KNOB_TOP) {
    float dd = length(vLocal.xz - vec2(KNOB_R * 0.66, 0.0));
    emit = uKnobLight * uGlowGain * (smoothstep(0.032, 0.025, dd) * 1.5 + exp(-dd / 0.02) * 0.2);
  } else if (vTag == TAG_GROUND) {
    discard;
  }
  outColor = vec4(emit * 0.5, 1.0);
}
`,K=`#version 300 es
${I}
${B}
${G}
`,U=`#version 300 es
${I}
${O}
`,H=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uSource;
uniform vec2 uStep;
void main() {
  const float w0 = 0.2270270270;
  const float w1 = 0.3162162162;
  const float w2 = 0.0702702703;
  const float o1 = 1.3846153846;
  const float o2 = 3.2307692308;
  vec3 c = texture(uSource, vUv).rgb * w0;
  c += texture(uSource, vUv + uStep * o1).rgb * w1;
  c += texture(uSource, vUv - uStep * o1).rgb * w1;
  c += texture(uSource, vUv + uStep * o2).rgb * w2;
  c += texture(uSource, vUv - uStep * o2).rgb * w2;
  outColor = vec4(c, 1.0);
}
`,$=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uNear;
uniform sampler2D uFar;
uniform float uStrength;
void main() {
  vec3 a = texture(uNear, vUv).rgb;
  vec3 b = texture(uFar, vUv).rgb;
  vec3 c = (a * 0.9 + b * 1.3) * uStrength;
  // encode roughly to display space so the bloom adds like light
  c = 1.0 - exp(-c * 2.0);
  outColor = vec4(c, 0.0);
}
`,X=2*Math.PI/24,V=[[0,"rose"],[15,"coral"],[30,"vermilion"],[45,"tangerine"],[60,"amber"],[75,"gold"],[90,"citrine"],[105,"lime"],[120,"chartreuse"],[135,"green"],[150,"emerald"],[165,"jade"],[180,"teal"],[195,"aqua"],[210,"cyan"],[225,"sky"],[240,"azure"],[255,"cornflower"],[270,"indigo"],[285,"violet"],[300,"purple"],[315,"orchid"],[330,"magenta"],[345,"pink"]],j=e=>(e%360+360)%360;function W(e){let t=15*Math.round(j(e)/15);return V.find(([e])=>e===t%360)?.[1]??"colour"}function Y(e){let t,a,o,r,i,n;return a=.175*Math.cos(t=j(e)*Math.PI/180),r=(.76+.3963377774*a+.2158037573*(o=.175*Math.sin(t)))**3,[Math.max(0,4.0767416621*r-3.3077115913*(i=(.76-.1055613458*a-.0638541728*o)**3)+.2309699292*(n=(.76-.0894841775*a-1.291485548*o)**3)),Math.max(0,-1.2684380046*r+2.6097574011*i-.3413193965*n),Math.max(0,-.0041960863*r-.7034186147*i+1.707614701*n)]}let q=(()=>{let e=new Float32Array(1083);for(let t=0;t<=360;t++)e.set(Y(t),3*t);return e})();function Z(e,t,a,o=1){let r=j(e),i=Math.min(359,Math.floor(r)),n=r-i,l=3*i,s=l+3;t[a]=(q[l]+(q[s]-q[l])*n)*o,t[a+1]=(q[l+1]+(q[s+1]-q[l+1])*n)*o,t[a+2]=(q[l+2]+(q[s+2]-q[l+2])*n)*o}class Q{x=0;v=0;held=!1;pending=!1;pendingAt=0;get resting(){return 0===this.v&&(this.held?1===this.x:0===this.x)&&!this.pending}step(e,t){if(this.pending&&(this.x>=.92||t-this.pendingAt>.14)&&(this.pending=!1,this.held=!1),this.resting)return;let a=1/480,o=Math.min(e,.05);for(;o>1e-6;){let e=Math.min(a,o);o-=e;let t=this.held?1.32:-.28,r=this.held?1150:760,i=this.held?38:30;this.v+=(-r*(this.x-t)-i*this.v)*e,this.x+=this.v*e,this.x>1?(this.x=1,this.v>0&&(this.v=-(.16*this.v))):this.x<0&&(this.x=0,this.v<0&&(this.v=-(.3*this.v)))}let r=+!!this.held;.004>Math.abs(this.x-r)&&.4>Math.abs(this.v)&&(this.x=r,this.v=0)}}let J=(()=>{let e=new Q;e.held=!0;let t=0;for(;e.x<1&&t<.3;)e.step(1/480,t),t+=1/480;return t})(),ee=(()=>{let e=new Q;e.x=1;let t=0;for(;e.x>0&&t<.3;)e.step(1/480,t),t+=1/480;return t})(),et=M.map(e=>Math.hypot(e.x-1,e.z- -2.09)),ea=(()=>{let e=new Float32Array(81);for(let t of M)for(let a of M)e[9*t.index+a.index]=Math.hypot(t.x-a.x,t.z-a.z);return e})();class eo{switches=M.map(()=>new Q);flash=new Float32Array(9);accent=new Float32Array(9);hues=new Float32Array(9);hue=60;knobHue=60;detent=0;angle=0;angleV=0;angleTarget=0;dragging=!1;ripples=Array.from({length:8},()=>({alive:!1,x:0,z:0,age:0,amp:0,hue:0,hit:0}));time=0;idle=.3;history=[{t:-1,hue:60}];constructor(){this.hues.fill(60)}press(e,t,a=1){let o=this.switches[e];if(!o||o.held&&!o.pending)return!1;if(o.held=!0,o.pending=!1,t&&(o.x=1,o.v=0),this.flash[e]=Math.max(this.flash[e],1.15*a),t)for(let t=0;t<9;t++){if(t===e)continue;let o=ea[9*e+t];this.flash[t]=Math.max(this.flash[t],.55*a*Math.exp(-(.55*o)))}else this.spawn(e,.9*a);return!0}pulse(e,t,a){M[e]&&(this.flash[e]=Math.max(this.flash[e],t),a||this.spawn(e,.8*t))}spawn(e,t){let a=this.ripples[0];for(let e of this.ripples){if(!e.alive){a=e;break}e.age>a.age&&(a=e)}let o=M[e];a.alive=!0,a.x=o.x,a.z=o.z,a.age=0,a.amp=t,a.hue=this.hues[e],a.hit=1<<e}release(e,t){let a=this.switches[e];if(a&&a.held){if(t){a.held=!1,a.pending=!1,a.x=0,a.v=0;return}a.x<.92?(a.pending=!0,a.pendingAt=this.time):a.held=!1}}isDown(e){let t=this.switches[e];return!!(t&&t.held&&!t.pending)}turn(e,t){return e&&(this.detent+=e,this.angleTarget=this.detent*X,t&&(this.angle=this.angleTarget,this.angleV=0),this.setHue(60+15*this.detent,t)),this.hue}dragTo(e,t){let a=Math.round(e/X),o=a-this.detent;o&&(this.detent=a,this.setHue(60+15*this.detent,t));let r=(e-a*X)/(X/2);return this.angleTarget=a*X+X/2*Math.sign(r)*Math.abs(r)**3*.85,t&&(this.angle=this.angleTarget,this.angleV=0),o}endDrag(){this.dragging=!1,this.angleTarget=this.detent*X}setHue(e,t){this.hue=e,this.history.push({t:this.time,hue:e}),this.history.length>64&&this.history.splice(0,this.history.length-64),t&&(this.hues.fill(e),this.knobHue=e)}hueAt(e){let t=this.history;for(let a=t.length-1;a>=0;a--)if(t[a].t<=e)return t[a].hue;return t[0].hue}step(e,t){this.time+=e;let a=this.time,o=!1;for(let r of this.switches)t?(r.pending&&(r.pending=!1,r.held=!1),r.x=+!!r.held,r.v=0):r.step(e,a),r.resting||(o=!0);for(let t of this.ripples){if(!t.alive)continue;if(t.age+=e,t.age>=1.6){t.alive=!1;continue}o=!0;let a=4.6*t.age;for(let e=0;e<9;e++){if(t.hit&1<<e)continue;let o=M[e],r=Math.hypot(o.x-t.x,o.z-t.z);a>=r-.25&&(t.hit|=1<<e,this.flash[e]=Math.max(this.flash[e],.62*t.amp*Math.exp(-(.42*r))))}}for(let a=0;a<9;a++)this.isDown(a)?this.flash[a]=Math.max(this.flash[a],.85):this.flash[a]>0&&(this.flash[a]*=Math.exp(-e*(t?4:3.1)),this.flash[a]<.002?this.flash[a]=0:o=!0);for(let r=0;r<9;r++){let i=this.hueAt(a-.075*et[r]);if(t)this.hues[r]=this.hue;else{let t=this.hues[r]+(i-this.hues[r])*(1-Math.exp(-(16*e)));this.hues[r]=.05>Math.abs(i-t)?i:t}this.hues[r]!==this.hue&&(o=!0)}if(this.knobHue=t?this.hue:this.knobHue+(this.hue-this.knobHue)*(1-Math.exp(-(22*e))),.05>Math.abs(this.knobHue-this.hue)?this.knobHue=this.hue:o=!0,t)this.angle=this.angleTarget;else{let t=1/480,a=Math.min(e,.05),r=this.dragging?900:520,i=this.dragging?52:26;for(;a>1e-6;){let e=Math.min(t,a);a-=e,this.angleV+=(-r*(this.angle-this.angleTarget)-i*this.angleV)*e,this.angle+=this.angleV*e}1e-4>Math.abs(this.angle-this.angleTarget)&&.001>Math.abs(this.angleV)?(this.angle=this.angleTarget,this.angleV=0):o=!0}return this.dragging&&(o=!0),o}fill(e){let t=this.time,a=e.reduced?0:e.breathe;for(let o=0;o<9;o++){e.travel[o]=this.switches[o].x;let r=.86+.14*a*Math.sin(1.25*t-.7*M[o].x-.5*M[o].z),i=(this.idle*r+this.flash[o]+this.accent[o])*e.gain;Z(this.hues[o],e.glow,3*o);let n=Math.min(.3,.24*this.flash[o]),l=e.glow;l[3*o]=(l[3*o]*(1-n)+n)*i,l[3*o+1]=(l[3*o+1]*(1-n)+n)*i,l[3*o+2]=(l[3*o+2]*(1-n)+n)*i}let o=0;for(let t of this.ripples){if(!t.alive)continue;let a=Math.exp(-(2.6*t.age))*Math.min(1,30*t.age);e.ripples[4*o]=t.x,e.ripples[4*o+1]=t.z,e.ripples[4*o+2]=4.6*t.age,e.ripples[4*o+3]=t.amp*a*.55*e.gain,Z(t.hue,e.rippleColors,3*o),o+=1}for(let t=o;t<8;t++)e.ripples[4*t+3]=0;e.rippleCount=o,Z(this.knobHue,e.knobLight,0,.9*e.gain)}}let er=[4,0,8,2,6,1,5,7,3,4,2,6,0,8];class ei{next=.9;step=0;holding=-1;releaseAt=0;poke(e,t,a){this.holding>=0&&e.release(this.holding,a),e.press(t,a,.7),this.holding=t,this.releaseAt=e.time+.12,this.next=Math.max(this.next,e.time+.9)}settle(e,t){this.holding>=0&&e.time>=this.releaseAt&&(e.release(this.holding,t),this.holding=-1)}tick(e,t){let a=e.time;if(this.settle(e,t),a<this.next)return;let o=er[this.step%er.length];this.step+=1,e.press(o,t,.8),this.holding=o,this.releaseAt=a+.13,this.step%5==0&&e.turn(this.step%10==0?2:1,t),this.next=a+1.05+.37*this.step%.5}}let en=e=>{let t=Math.hypot(e[0],e[1],e[2]);return[e[0]/t,e[1]/t,e[2]/t]},el={keyDir:en([-.5,.84,-.3]),keyColor:[1,.985,.96],sky:[.78,.79,.81],horizon:[.56,.57,.59],floor:[.5,.5,.51],softbox:[1.9,1.9,1.86],strip:[1.4,1.4,1.42],ambient:.6,exposure:.9,caseAlbedo:[.3,.305,.32],caseF0:[.4,.405,.42],caseRough:.34,caseMetal:.55,edgeF0:[.94,.94,.95],plateAlbedo:[.2,.2,.21],knobF0:[.82,.83,.85],engrave:[.07,.07,.075],shadow:[.3,.2],glowGain:.9,emitKnee:.85,bloom:.42},es={keyDir:en([-.5,.84,-.3]),keyColor:[.82,.83,.88],sky:[.16,.165,.18],horizon:[.055,.056,.062],floor:[.012,.012,.013],softbox:[1.25,1.25,1.32],strip:[.7,.7,.76],ambient:.55,exposure:1,caseAlbedo:[.022,.023,.026],caseF0:[.1,.104,.112],caseRough:.4,caseMetal:.6,edgeF0:[.78,.79,.81],plateAlbedo:[.025,.025,.028],knobF0:[.18,.18,.19],engrave:[.2,.2,.21],shadow:[.5,.36],glowGain:1,emitKnee:1.7,bloom:.75},eh=(e,t,a)=>e+(t-e)*a,eu=(e,t,a,o)=>(e[0]=eh(t[0],a[0],o),e[1]=eh(t[1],a[1],o),e[2]=eh(t[2],a[2],o),e);function ec(){let e=()=>[0,0,0];return{keyDir:e(),keyColor:e(),sky:e(),horizon:e(),floor:e(),softbox:e(),strip:e(),ambient:0,exposure:1,caseAlbedo:e(),caseF0:e(),caseRough:0,caseMetal:0,edgeF0:e(),plateAlbedo:e(),knobF0:e(),engrave:e(),shadow:[0,0],glowGain:1,emitKnee:1,bloom:0}}function ef(e,t){let a=Math.min(1,Math.max(0,e));eu(t.keyDir,el.keyDir,es.keyDir,a);let o=Math.hypot(t.keyDir[0],t.keyDir[1],t.keyDir[2])||1;return t.keyDir[0]/=o,t.keyDir[1]/=o,t.keyDir[2]/=o,eu(t.keyColor,el.keyColor,es.keyColor,a),eu(t.sky,el.sky,es.sky,a),eu(t.horizon,el.horizon,es.horizon,a),eu(t.floor,el.floor,es.floor,a),eu(t.softbox,el.softbox,es.softbox,a),eu(t.strip,el.strip,es.strip,a),t.ambient=eh(el.ambient,es.ambient,a),t.exposure=eh(el.exposure,es.exposure,a),eu(t.caseAlbedo,el.caseAlbedo,es.caseAlbedo,a),eu(t.caseF0,el.caseF0,es.caseF0,a),t.caseRough=eh(el.caseRough,es.caseRough,a),t.caseMetal=eh(el.caseMetal,es.caseMetal,a),eu(t.edgeF0,el.edgeF0,es.edgeF0,a),eu(t.plateAlbedo,el.plateAlbedo,es.plateAlbedo,a),eu(t.knobF0,el.knobF0,es.knobF0,a),eu(t.engrave,el.engrave,es.engrave,a),t.shadow[0]=eh(el.shadow[0],es.shadow[0],a),t.shadow[1]=eh(el.shadow[1],es.shadow[1],a),t.glowGain=eh(el.glowGain,es.glowGain,a),t.emitKnee=eh(el.emitKnee,es.emitKnee,a),t.bloom=eh(el.bloom,es.bloom,a),t}let ed=[{id:"chalk",label:"Chalk keycaps",cap:"#e8e5de",legend:"#3b3b3d"},{id:"graphite",label:"Graphite keycaps",cap:"#2f3034",legend:"#c4c4c6"},{id:"sage",label:"Sage keycaps",cap:"#a7b19c",legend:"#1f271d"},{id:"clay",label:"Clay keycaps",cap:"#c4876a",legend:"#3a2219"}],ep={light:"chalk",dark:"graphite"},eg=Object.fromEntries(ed.map(e=>[e.id,{albedo:p(e.cap),legend:p(e.legend)}]));function em(e){return eg[e]??eg.chalk}var ev=e.i(55171);let ex=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class eb{gl;main;emissive;blur;composite;uMain;uEmissive;uBlur;uComposite;meshes;empty;atlas;targets=null;targetsW=0;targetsH=0;model=new Float32Array(16);constructor(e){this.gl=e,this.main=(0,ev.createProgram)(e,z,K),this.emissive=(0,ev.createProgram)(e,z,U),this.blur=(0,ev.createProgram)(e,ev.FULLSCREEN_VERTEX,H),this.composite=(0,ev.createProgram)(e,ev.FULLSCREEN_VERTEX,$),this.uMain=(0,ev.uniformLocations)(e,this.main),this.uEmissive=(0,ev.uniformLocations)(e,this.emissive),this.uBlur=(0,ev.uniformLocations)(e,this.blur),this.uComposite=(0,ev.uniformLocations)(e,this.composite),this.meshes={case:this.upload(function(){let{halfWidth:e,radius:t,height:a,chamfer:o}=v,r=(a,o)=>S(a,e-o,b-o,t-o,0,x),i=(e,t)=>S(e,w+t,w+t,T+t,0,0),n=F(10,2),l=F(8,2);return C([{at:(e,t)=>{let a=Math.PI/2*t,[o,i]=r(e,.03*(1-Math.sin(a)));return[o,.03*(1-Math.cos(a)),i]},us:n,vs:L(0,1,3),wrap:!0,tag:1,facing:e=>_([e[0],-.3,e[2]-x])},{at:(e,t)=>{let[i,n]=r(e,0);return[i,.03+t*(a-o-.03),n]},us:n,vs:[0,1],wrap:!0,tag:1,facing:e=>_([e[0],0,e[2]-x])},{at:(e,t)=>{let[i,n]=r(e,t*o);return[i,a-o+t*o,n]},us:n,vs:[0,1],wrap:!0,tag:2,facing:e=>_([e[0],1.6,e[2]-x])},{at:(e,t)=>{let[n,l]=r(e,o),[s,h]=i(e,y);return[n+(s-n)*t,a,l+(h-l)*t]},us:n,vs:L(0,1,6),wrap:!0,tag:3,facing:()=>[0,1,0]},{at:(e,t)=>{let[o,r]=i(e,y*(1-t));return[o,a-y*t,r]},us:n,vs:[0,1],wrap:!0,tag:4,facing:e=>_([-e[0],1.6,-e[2]])},{at:(e,t)=>{let[o,r]=i(e,0);return[o,a-y-t*(a-y-.4),r]},us:n,vs:[0,1],wrap:!0,tag:5,facing:e=>_([-e[0],1e-4,-e[2]])},{at:(e,t)=>{let a=1-t,[o,r]=S(e,w*a,w*a,T*a,0,0);return[o,.4,r]},us:l,vs:L(0,1,8),wrap:!0,tag:6,facing:()=>[0,1,0]}])}()),cap:this.upload(function(){let{base:e,baseRadius:t,topX:a,topZ:o,topRadius:r,topShift:i,fillet:n}=A,l=[0,.45*A.height,A.topShift];return C([{at:(l,s)=>{if(s<=1){let h=.014*Math.sin(Math.PI*s)**1.2,[u,c]=S(l,e+(a-e)*s+h,e+(o-e)*s+h,t+(r-t)*s,0,i*s),f=s*(D(u,c)-n)-0;return[u,f,c]}if(s<=2){let e=Math.PI/2*(s-1),t=n*(1-Math.cos(e)),[h,u]=S(l,a-t,o-t,r-.6*t,0,i),c=D(h,u)-n+n*Math.sin(e);return[h,c,u]}let h=3-s,[u,c]=S(l,(a-n)*h,(o-n)*h,(r-.6*n)*h,0,i);return[u,D(u,c),c]},us:F(7,8),vs:[...L(0,1,9,e=>e**1.15).slice(0,-1),...L(1,2,6).slice(0,-1),...L(2,3,9,e=>1-(1-e)**1.4)],wrap:!0,tag:7,facing:e=>_(k(e,l))}])}()),knob:this.upload(function(){let e=Array.from({length:144},(e,t)=>t/144),t=(e,t,a)=>{let o=e*Math.PI*2;return[t*Math.cos(o),a,t*Math.sin(o)]},a=e=>_([e[0],0,e[2]]);return C([{at:(e,a)=>t(e,.30529999999999996,-.03+.05*a),us:e,vs:[0,1],wrap:!0,tag:11,facing:a},{at:(e,a)=>{if(a<.12){let o=a/.12*(Math.PI/2);return t(e,.355-.012*(1-Math.sin(o)),.012*(1-Math.cos(o)))}let o=(a-.12)/.88;return t(e,.355-.008*o,.012+.388*o)},us:e,vs:[0,.04,.08,.12,.5,1],wrap:!0,tag:8,facing:a},{at:(e,a)=>t(e,.347-.03*a,.4+.03*a),us:e,vs:[0,1],wrap:!0,tag:9,facing:e=>_([e[0],1.2,e[2]])},{at:(e,a)=>{let o=.31699999999999995*(1-a),r=o/.31699999999999995;return t(e,o,.43-.006*(1-r*r))},us:e,vs:L(0,1,10),wrap:!0,tag:10,facing:()=>[0,1,0]}])}()),ground:this.upload(function(){let e=-v.halfWidth-1.6,t=v.halfWidth+1.6,a=v.back-1.4,o=v.front+1.8;return{vertices:new Float32Array([e,0,a,0,1,0,0,t,0,a,0,1,0,0,e,0,o,0,1,0,0,t,0,o,0,1,0,0]),indices:new Uint32Array([0,1,2,1,3,2])}}())};const t=e.createVertexArray(),a=e.createTexture();if(!t||!a)throw Error("macropad: could not allocate GL objects");this.empty=t,this.atlas=a,e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]))}upload(e){let t=this.gl,a=t.createVertexArray(),o=t.createBuffer(),r=t.createBuffer();if(!a||!o||!r)throw Error("macropad: could not allocate a mesh");return t.bindVertexArray(a),t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,e.vertices,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,3,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,28,12),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,r),t.bufferData(t.ELEMENT_ARRAY_BUFFER,e.indices,t.STATIC_DRAW),t.bindVertexArray(null),{vao:a,vbo:o,ibo:r,count:e.indices.length}}setAtlas(e){let t=this.gl;t.bindTexture(t.TEXTURE_2D,this.atlas),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),t.generateMipmap(t.TEXTURE_2D),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);let a=t.getExtension("EXT_texture_filter_anisotropic");a&&t.texParameterf(t.TEXTURE_2D,a.TEXTURE_MAX_ANISOTROPY_EXT,4)}target(e,t,a,o){let r,i=this.gl;if(o&&o.width===e&&o.height===t)return o;o&&this.freeTarget(o);let n=i.createTexture(),l=i.createFramebuffer();if(!n||!l)throw Error("macropad: could not allocate a render target");return i.bindTexture(i.TEXTURE_2D,n),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,e,t,0,i.RGBA,i.UNSIGNED_BYTE,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.bindFramebuffer(i.FRAMEBUFFER,l),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,n,0),a&&(r=i.createRenderbuffer()??void 0)&&(i.bindRenderbuffer(i.RENDERBUFFER,r),i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_COMPONENT16,e,t),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,r)),i.bindFramebuffer(i.FRAMEBUFFER,null),{fbo:l,tex:n,width:e,height:t,depth:r}}freeTarget(e){let t=this.gl;t.deleteFramebuffer(e.fbo),t.deleteTexture(e.tex),e.depth&&t.deleteRenderbuffer(e.depth)}ensureTargets(e,t){let a=this.targets;if(a&&this.targetsW===e&&this.targetsH===t)return a;let o=Math.max(1,Math.round(e/4)),r=Math.max(1,Math.round(t/4)),i=Math.max(1,Math.round(e/8)),n=Math.max(1,Math.round(t/8));return this.targetsW=e,this.targetsH=t,this.targets={glow:this.target(o,r,!0,a?.glow),a:this.target(o,r,!1,a?.a),b:this.target(o,r,!1,a?.b),c:this.target(i,n,!1,a?.c),d:this.target(i,n,!1,a?.d)},this.targets}blurPass(e,t,a,o){let r=this.gl;r.bindFramebuffer(r.FRAMEBUFFER,t.fbo),r.viewport(0,0,t.width,t.height),r.bindTexture(r.TEXTURE_2D,e.tex),r.uniform2f(this.uBlur("uStep"),a/e.width,o/e.height),r.drawArrays(r.TRIANGLES,0,3)}setShared(e,t){let a=this.gl;a.uniformMatrix4fv(e("uViewProj"),!1,t.viewProj),a.uniform4f(e("uFit"),t.fit[0],t.fit[1],t.fit[2],t.fit[3]),a.uniform3fv(e("uCamPos"),t.camPos),a.uniform3fv(e("uGlow"),t.glow),a.uniform1fv(e("uPress"),t.travel),a.uniform4fv(e("uRipple"),t.ripples),a.uniform3fv(e("uRippleColor"),t.rippleColors),a.uniform1i(e("uRippleCount"),t.rippleCount),a.uniform3fv(e("uKnobLight"),t.knobLight),a.uniform1f(e("uGlowGain"),t.look.glowGain),a.uniform1f(e("uEmitKnee"),t.look.emitKnee)}setLook(e,t){let a=this.gl,o=t.look;a.uniform3fv(e("uKeyDir"),o.keyDir),a.uniform3fv(e("uKeyColor"),o.keyColor),a.uniform3fv(e("uSky"),o.sky),a.uniform3fv(e("uHorizon"),o.horizon),a.uniform3fv(e("uFloor"),o.floor),a.uniform3fv(e("uSoftbox"),o.softbox),a.uniform3fv(e("uStrip"),o.strip),a.uniform1f(e("uAmbient"),o.ambient),a.uniform1f(e("uExposure"),o.exposure),a.uniform3fv(e("uCaseAlbedo"),o.caseAlbedo),a.uniform3fv(e("uCaseF0"),o.caseF0),a.uniform1f(e("uCaseRough"),o.caseRough),a.uniform1f(e("uCaseMetal"),o.caseMetal),a.uniform3fv(e("uEdgeF0"),o.edgeF0),a.uniform3fv(e("uPlateAlbedo"),o.plateAlbedo),a.uniform3fv(e("uCapAlbedo"),t.caps.albedo),a.uniform3fv(e("uLegend"),t.caps.legend),a.uniform3fv(e("uEngrave"),o.engrave),a.uniform3fv(e("uKnobF0"),o.knobF0),a.uniform2f(e("uShadow"),o.shadow[0],o.shadow[1]),a.uniform1f(e("uDetail"),t.detail),a.uniform1i(e("uAtlas"),0)}drawMesh(e){let t=this.gl;t.bindVertexArray(e.vao),t.drawElements(t.TRIANGLES,e.count,t.UNSIGNED_INT,0)}translate(e,t,a){let o=this.model;return o.set(ex),o[12]=e,o[13]=t,o[14]=a,o}knobModel(e){let t=this.model,a=Math.cos(-e),o=Math.sin(-e);return t.set(ex),t[0]=a,t[2]=-o,t[8]=o,t[10]=a,t[12]=1,t[13]=E,t[14]=-2.09,t}drawPad(e,t){let a=this.gl;for(let o of(a.uniformMatrix4fv(e("uModel"),!1,this.translate(0,0,0)),a.uniform1i(e("uKey"),-1),a.uniform1f(e("uTravel"),0),this.drawMesh(this.meshes.case),a.uniformMatrix4fv(e("uModel"),!1,this.knobModel(t.knobAngle)),this.drawMesh(this.meshes.knob),M)){let r=t.travel[o.index];a.uniformMatrix4fv(e("uModel"),!1,this.translate(o.x,.68-.2*r,o.z)),a.uniform1i(e("uKey"),o.index),a.uniform1f(e("uTravel"),r),this.drawMesh(this.meshes.cap)}}draw(e){let t=this.gl,a=t.drawingBufferWidth,o=t.drawingBufferHeight;t.disable(t.CULL_FACE),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.atlas);let r=e.bloom&&e.look.bloom>.001;if(r){let r=this.ensureTargets(a,o);t.bindFramebuffer(t.FRAMEBUFFER,r.glow.fbo),t.viewport(0,0,r.glow.width,r.glow.height),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.depthMask(!0),t.disable(t.BLEND),t.useProgram(this.emissive),this.setShared(this.uEmissive,e),this.drawPad(this.uEmissive,e),t.disable(t.DEPTH_TEST),t.useProgram(this.blur),t.bindVertexArray(this.empty),t.uniform1i(this.uBlur("uSource"),0),this.blurPass(r.glow,r.a,1,0),this.blurPass(r.a,r.b,0,1),this.blurPass(r.b,r.c,1.5,0),this.blurPass(r.c,r.d,0,1.5),t.bindFramebuffer(t.FRAMEBUFFER,null),t.bindTexture(t.TEXTURE_2D,this.atlas)}if(t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,a,o),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.useProgram(this.main),this.setShared(this.uMain,e),this.setLook(this.uMain,e),t.disable(t.DEPTH_TEST),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.uniformMatrix4fv(this.uMain("uModel"),!1,this.translate(0,0,0)),t.uniform1i(this.uMain("uKey"),-1),this.drawMesh(this.meshes.ground),t.disable(t.BLEND),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.depthMask(!0),this.drawPad(this.uMain,e),t.disable(t.DEPTH_TEST),r){let a=this.targets;t.useProgram(this.composite),t.bindVertexArray(this.empty),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,a.b.tex),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,a.d.tex),t.uniform1i(this.uComposite("uNear"),0),t.uniform1i(this.uComposite("uFar"),1),t.uniform1f(this.uComposite("uStrength"),e.look.bloom),t.enable(t.BLEND),t.blendFuncSeparate(t.ONE,t.ONE,t.ZERO,t.ONE),t.drawArrays(t.TRIANGLES,0,3),t.disable(t.BLEND),t.activeTexture(t.TEXTURE0)}t.bindVertexArray(null)}dispose(){let e=this.gl;for(let t of Object.values(this.meshes))e.deleteVertexArray(t.vao),e.deleteBuffer(t.vbo),e.deleteBuffer(t.ibo);this.targets&&Object.values(this.targets).forEach(e=>this.freeTarget(e)),this.targets=null,this.targetsW=this.targetsH=0,e.deleteVertexArray(this.empty),e.deleteTexture(this.atlas),e.deleteProgram(this.main),e.deleteProgram(this.emissive),e.deleteProgram(this.blur),e.deleteProgram(this.composite)}}function ew(){if((0,o.isMuted)())return null;let e=(0,o.ensureAudio)();return e&&"closed"!==e.ctx.state?e:null}function eT(e,t,a){if("function"!=typeof e.createStereoPanner)return t;let o=e.createStereoPanner();return o.pan.value=Math.max(-1,Math.min(1,a)),o.connect(t),o}let ey=Array.from({length:9},(e,t)=>{let a=t%3,o=Math.floor(t/3),r=Math.abs(a-1)+Math.abs(o-1);return{body:205-14*r+(o-1)*5,hollow:470-30*r+(a-1)*12,band:1900-170*r+(a-1)*60,level:1-.04*r}}),eA=e=>1+(2*Math.random()-1)*e;function eE(e,t,a,r,i,n,l,s){let{ctx:h}=e,u=h.createBufferSource();u.buffer=(0,o.noiseBuffer)(h,.5);let c=h.createBiquadFilter();c.type=r,c.frequency.value=i,c.Q.value=n;let f=h.createGain();f.gain.setValueAtTime(0,t),f.gain.linearRampToValueAtTime(l,t+.0012),f.gain.exponentialRampToValueAtTime(1e-4,t+s),u.connect(c).connect(f).connect(a),u.start(t,.4*Math.random(),s+.03)}function eM(e,t,a,o,r,i,n,l,s="sine"){let{ctx:h}=e,u=h.createOscillator();u.type=s,u.frequency.setValueAtTime(o*r,t),u.frequency.exponentialRampToValueAtTime(o,t+i);let c=h.createGain();c.gain.setValueAtTime(0,t),c.gain.linearRampToValueAtTime(n,t+.002),c.gain.exponentialRampToValueAtTime(1e-4,t+l),u.connect(c).connect(a),u.start(t),u.stop(t+l+.02)}let ek=()=>{};function eP(e,t=0){let a=ew();if(!a)return;let o=a.ctx.currentTime+.002+t,r=eT(a.ctx,a.output,.32);eE(a,o,r,"highpass",2600*eA(.08),.8,.09,.007),eM(a,o,r,(e>0?2350:2150)*eA(.02),1,.001,.026,.012)}let eR={target:[0,.38,x+.06],distance:16,fov:21*Math.PI/180,yaw:.2,pitch:.98},e_=[[-1,-1],[1,-1],[1,1],[-1,1]],eC=Array.from({length:16},(e,t)=>[Math.cos(t/16*Math.PI*2),Math.sin(t/16*Math.PI*2)]);class eS{width=1;height=1;proj=h();view=h();viewProj=h();camPos=[0,0,0];fit=[1,1,0,0];version=0;bounds=(function(){let e=[],{halfWidth:t,front:a,back:o,height:r}=v;for(let i of[-t,t])for(let t of[o,a])e.push([i,0,t],[i,r,t]);let i=.68+A.height;for(let t of M)e.push([t.x-A.base,i,t.z-A.base],[t.x+A.base,i,t.z+A.base]);for(let t=0;t<8;t++){let a=t/8*Math.PI*2;e.push([1+.355*Math.cos(a),E+.43,-2.09+.355*Math.sin(a)])}return e})();rest=h();point=[0,0];matrices(e,t,a,o){var r,i,n;let l;!function(e,t,a,o,r=[0,0,0]){let i=Math.cos(o);r[0]=e[0]+t*i*Math.sin(a),r[1]=e[1]+t*Math.sin(o),r[2]=e[2]+t*i*Math.cos(a)}(eR.target,eR.distance,e,t,o),r=this.proj,i=eR.fov,n=this.width/this.height,l=1/Math.tan(i/2),r.fill(0),r[0]=l/n,r[5]=l,r[10]=-1.0338983050847457,r[11]=-1,r[14]=-2.0338983050847457,function(e,t,a,o=u){let r=t[0]-a[0],i=t[1]-a[1],n=t[2]-a[2],l=Math.hypot(r,i,n)||1;r/=l,i/=l,n/=l;let s=o[1]*n-o[2]*i,h=o[2]*r-o[0]*n,c=o[0]*i-o[1]*r;l=Math.hypot(s,h,c)||1,s/=l,h/=l;let f=i*(c/=l)-n*h,d=n*s-r*c,p=r*h-i*s;e[0]=s,e[1]=f,e[2]=r,e[3]=0,e[4]=h,e[5]=d,e[6]=i,e[7]=0,e[8]=c,e[9]=p,e[10]=n,e[11]=0,e[12]=-(s*t[0]+h*t[1]+c*t[2]),e[13]=-(f*t[0]+d*t[1]+p*t[2]),e[14]=-(r*t[0]+i*t[1]+n*t[2]),e[15]=1}(this.view,o,eR.target),function(e,t,a){for(let e=0;e<4;e++)for(let o=0;o<4;o++){let r=0;for(let i=0;i<4;i++)r+=t[4*i+o]*a[4*e+i];c[4*e+o]=r}e.set(c)}(a,this.proj,this.view)}resize(e,t,a,o=1/0){this.width=Math.max(1,e),this.height=Math.max(1,t);let r=this.rest;this.matrices(eR.yaw,eR.pitch,r,[0,0,0]);let i=1/0,n=1/0,l=-1/0,s=-1/0;for(let e of this.bounds){var h,u,c;let t=(h=e[0],u=e[1],c=e[2],[r[0]*h+r[4]*u+r[8]*c+r[12],r[1]*h+r[5]*u+r[9]*c+r[13],r[2]*h+r[6]*u+r[10]*c+r[14],r[3]*h+r[7]*u+r[11]*c+r[15]]),a=(t[0]/t[3]*.5+.5)*this.width,o=(.5-t[1]/t[3]*.5)*this.height;i=Math.min(i,a),l=Math.max(l,a),n=Math.min(n,o),s=Math.max(s,o)}let f=Math.min(Math.max(1,a.x1-a.x0)/Math.max(1,l-i),Math.max(1,Math.min(a.y1-a.y0,o))/Math.max(1,s-n)),d=this.width,p=this.height,g=(a.x0+a.x1)/2,m=(a.y0+a.y1)/2,v=(i+l)/2,x=(n+s)/2;this.fit[0]=f,this.fit[1]=f,this.fit[2]=(g-d/2-(v-d/2)*f)/(d/2),this.fit[3]=-(m-p/2-(x-p/2)*f)/(p/2),this.version+=1}update(e,t){this.matrices(eR.yaw+e,eR.pitch+t,this.viewProj,this.camPos)}toScreenInto(e,t,a,o){let r=this.viewProj,i=r[0]*e+r[4]*t+r[8]*a+r[12],n=r[1]*e+r[5]*t+r[9]*a+r[13],l=r[3]*e+r[7]*t+r[11]*a+r[15],s=i/l*this.fit[0]+this.fit[2],h=n/l*this.fit[1]+this.fit[3];return o[0]=(.5*s+.5)*this.width,o[1]=(.5-.5*h)*this.height,o}toScreen(e,t,a){return this.toScreenInto(e,t,a,[0,0])}capPoint(e,t,a,o){let r=M[e],i=.68-.2*t,[n,l]=e_[a>>1];return(1&a)==0?this.toScreenInto(r.x+n*A.base,i+.02,r.z+l*A.base,o):this.toScreenInto(r.x+n*A.topX,i+A.height,r.z+A.topShift+l*A.topZ,o)}capOutline(e,t){let a=M[e],o=.68-.2*t,r=[],i=(e,t,o,i,n)=>{for(let[l,s]of e_){let h=Math.atan2(s,l)-Math.PI/4;for(let u=0;u<=6;u++){let c=h+u/6*(Math.PI/2);r.push(this.toScreen(a.x+l*(e-o)+o*Math.cos(c),n,a.z+i+s*(t-o)+o*Math.sin(c)))}}};return i(A.base,A.base,A.baseRadius,0,o+.02),i(A.topX,A.topZ,A.topRadius,A.topShift,o+A.height),d(r)}knobOutline(){let e=[];for(let t=0;t<48;t++){let a=t/48*Math.PI*2,o=1+.355*Math.cos(a),r=-2.09+.355*Math.sin(a);e.push(this.toScreen(o,E,r)),e.push(this.toScreen(o,E+.43,r))}return d(e)}capHull(e,t){let a=[];for(let o=0;o<8;o++)a.push(this.capPoint(e,t,o,[0,0]));return d(a)}capBox(e,t,a){let o=1/0,r=1/0,i=-1/0,n=-1/0,l=this.point;for(let a=0;a<8;a++)this.capPoint(e,t,a,l),l[0]<o&&(o=l[0]),l[0]>i&&(i=l[0]),l[1]<r&&(r=l[1]),l[1]>n&&(n=l[1]);return a.x=o,a.y=r,a.w=i-o,a.h=n-r,a}capTop(e,t){let a=M[e],o=.68-.2*t+A.height;return[this.toScreen(a.x-A.topX,o,a.z+A.topShift-A.topZ),this.toScreen(a.x+A.topX,o,a.z+A.topShift-A.topZ),this.toScreen(a.x+A.topX,o,a.z+A.topShift+A.topZ),this.toScreen(a.x-A.topX,o,a.z+A.topShift+A.topZ)]}knobHull(){let e=[];for(let[t,a]of eC){let o=1+.355*t,r=-2.09+.355*a;e.push(this.toScreen(o,E,r)),e.push(this.toScreen(o,E+.43,r))}return d(e)}knobBox(e){let t=1/0,a=1/0,o=-1/0,r=-1/0,i=this.point;for(let e=0;e<eC.length;e++){let n=1+.355*eC[e][0],l=-2.09+.355*eC[e][1];for(let e=0;e<2;e++)this.toScreenInto(n,E+.43*e,l,i),i[0]<t&&(t=i[0]),i[0]>o&&(o=i[0]),i[1]<a&&(a=i[1]),i[1]>r&&(r=i[1])}return e.x=t,e.y=a,e.w=o-t,e.h=r-a,e}knobCentre(){return this.toScreen(1,E+.43,-2.09)}}function eF(e,t,a=0,o=0){let r=[];for(let t=0;t<e.length;t++){let a=e[(t-1+e.length)%e.length],o=e[t],i=e[(t+1)%e.length],n=o[0]-a[0],l=o[1]-a[1],s=i[0]-o[0],h=i[1]-o[1],u=Math.hypot(n,l),c=Math.hypot(s,h);!(u<.75)&&(u>0&&c>0&&Math.abs(n*h-l*s)/(u*c)<.02||r.push(o))}if(r.length<3)return"";let i=0;for(let e=0;e<r.length;e++){let[t,a]=r[e],[o,n]=r[(e+1)%r.length];i+=t*n-o*a}let n=i>0?1:-1,l=r.length,s=[],h=e=>e.toFixed(1);for(let e=0;e<l;e++){let[i,u]=r[e],[c,f]=r[(e+1)%l],d=Math.hypot(c-i,f-u)||1,p=n*(f-u)/d,g=-(n*(c-i))/d,m=i+p*t-a,v=u+g*t-o,x=c+p*t-a,b=f+g*t-o;0===e&&s.push(`M${h(m)} ${h(v)}`),s.push(`L${h(x)} ${h(b)}`);let[w,T]=r[(e+2)%l],y=Math.hypot(w-c,T-f)||1,A=n*(T-f)/y,E=-(n*(w-c))/y;s.push(`A${h(t)} ${h(t)} 0 0 ${+(n>0)} ${h(c+A*t-a)} ${h(f+E*t-o)}`)}return s.push("Z"),s.join("")}let eL=ed.map(e=>({value:e.id,label:e.label,swatch:`linear-gradient(180deg, color-mix(in oklab, ${e.cap} 82%, #fff) 0%, ${e.cap} 55%, color-mix(in oklab, ${e.cap} 88%, #000) 100%)`})),eD=e=>(M[e].col-1)*.38;function eN(e){let t=/^(?:Digit|Numpad)([1-9])$/.exec(e.code??"");return t?Number(t[1])-1:/^[1-9]$/.test(e.key)?Number(e.key)-1:-1}let ez=e=>j(60+15*e);function eI({stage:e,theme:a}){let o="dark"===a,r=m(Y(60)),i=2*v.halfWidth,n=v.front-v.back,l=(e,t)=>`${e/t*100}%`;return(0,t.jsx)("div",{role:e?"img":void 0,"aria-label":e?"A nine-key macropad with a knob":void 0,"aria-hidden":!e||void 0,className:"absolute inset-0 grid place-items-center",children:(0,t.jsxs)("div",{className:"relative h-[min(72%,420px)] max-w-[78%] rounded-[10%/8%] [container-type:size]",style:{aspectRatio:`${i} / ${n}`,background:o?"linear-gradient(#3a3b40,#26272b)":"linear-gradient(#e2e3e6,#c3c5c9)",boxShadow:`0 18px 34px -18px rgb(0 0 0 / ${o?.7:.45}), inset 0 1px 0 rgb(255 255 255 / ${o?.18:.6})`},children:[(0,t.jsx)("span",{className:"absolute rounded-full",style:{left:l(v.halfWidth+1-.355,i),top:l(-2.09-v.back-.355,n),width:l(.71,i),aspectRatio:"1",background:o?"radial-gradient(circle at 40% 35%, #5a5b60, #2a2b2f)":"radial-gradient(circle at 40% 35%, #fbfbfc, #b9bbc0)",boxShadow:"0 3px 8px rgb(0 0 0 / 0.3)"}}),M.map(e=>(0,t.jsx)("span",{className:"absolute grid place-items-center rounded-[16%] text-[7cqw] font-medium",style:{left:l(v.halfWidth+e.x-A.base,i),top:l(e.z-v.back-A.base,n),width:l(2*A.base,i),height:l(2*A.base,n),background:o?"#2f3034":"#ece9e3",color:o?"#c4c4c6":"#3b3b3d",boxShadow:`0 0 0 1px rgb(0 0 0 / 0.08), 0 3px 0 ${o?"#1d1e21":"#cbc8c1"}, 0 4px 14px -2px ${r}`},children:e.index+1},e.index))]})})}e.s(["default",0,function({mode:e,active:l,reducedMotion:h,theme:u}){let c="stage"===e,[d]=(0,a.useState)(()=>{let e=new eo;return h&&(e.accent[4]=.55,[1,3,5,7].forEach(t=>e.accent[t]=.1)),e}),[p]=(0,a.useState)(()=>new ei),[g]=(0,a.useState)(()=>new eS),v=(0,a.useRef)(null),x=(0,a.useRef)(null),b=(0,a.useRef)(null),w=(0,a.useRef)(null),T=(0,a.useRef)([]),y=(0,a.useRef)(null),A=(0,a.useId)(),E=(0,r.useFinePointer)(),[k,P]=(0,a.useState)(null),R=k??ep[u],[_,C]=(0,a.useState)(0),[S,F]=(0,a.useState)(""),[L,D]=(0,a.useState)(!1),[N,z]=(0,a.useState)(4),I=(0,r.useLatest)({reducedMotion:h,theme:u,caps:R,stage:c}),[B]=(0,a.useState)(()=>{let e,t,a,o;return{current:(t={albedo:[...(e=em(k??ep[u])).albedo],legend:[...e.legend]},o={travel:(a={viewProj:g.viewProj,camPos:g.camPos,fit:g.fit,look:"dark"===u?es:el,caps:t,travel:new Float32Array(9),glow:new Float32Array(27),ripples:new Float32Array(32),rippleColors:new Float32Array(24),rippleCount:0,knobAngle:0,knobLight:[0,0,0],detail:c?1:.35,bloom:!0}).travel,glow:a.glow,ripples:a.ripples,rippleColors:a.rippleColors,knobLight:a.knobLight,breathe:0,reduced:h,gain:1,rippleCount:0},{yaw:0,yawV:0,pitch:0,pitchV:0,aimYaw:0,aimPitch:0,night:+("dark"===u),caps:t,capsId:k??ep[u],capsGap:0,fade:ec(),tileLook:ec(),fitDirty:!0,acc:0,calm:!1,kick:!0,lastInput:performance.now(),breathedAt:0,pressedAt:-1/0,breathe:c&&!h?1:0,welcomed:!1,hover:-1,placedVersion:-1,placedYaw:NaN,placedPitch:NaN,placedTravel:new Float32Array(9).fill(NaN),placedBox:{x:0,y:0,w:0,h:0},ring:-1,ringTravel:NaN,frame:a,fill:o})}}),G=(0,a.useCallback)(()=>{let e,{width:t,height:a}=ea.current;if(t<2||a<2)return;let o=1/0;if(I.current.stage){let r=b.current,i=a-16,n=w.current?.querySelector("[data-lab-controls]");if(r&&n){let e=n.getBoundingClientRect().top-r.getBoundingClientRect().top;e>0&&(i=Math.min(i,e))}let l=t<520,s=l?18:40;e={x0:s,y0:l?24:44,x1:t-s,y1:i-(l?18:30)},o=520}else e={x0:.15*t,y0:.13*a,x1:.85*t,y1:.89*a};g.resize(t,a,e,o),B.current.fitDirty=!1},[g,I]),O=(0,a.useRef)(null),K=(0,a.useRef)(null),U=(0,a.useRef)(null),H=()=>{let e=B.current,t=O.current;if(!t)return;if(e.ring<0){t.style.opacity="0";return}let a=9===e.ring,o=a?g.knobOutline():g.capOutline(e.ring,d.switches[e.ring].x);K.current?.setAttribute("d",eF(o,4)),U.current?.setAttribute("d",eF(o,6.5)),e.ringTravel=a?0:d.switches[e.ring].x,t.style.opacity="1"},$=(0,r.useFrame)(l,e=>{let t=v.current,a=B.current,o=I.current,{width:i,height:n}=ea.current;if(!t||i<2||n<2)return!1;if(o.stage)if(a.calm&&!a.kick){if(a.acc+=e,a.acc<1/24-.002)return;e=Math.min(.1,a.acc),a.acc=0}else a.acc=0;else{if(a.acc+=e,a.acc<1/30-.002)return;e=Math.min(.1,a.acc),a.acc=0}a.kick=!1,a.fitDirty&&G();let l=o.reducedMotion;o.stage?a.welcomed||l||!(d.time>.45)||(a.welcomed=!0,d.pulse(4,.95,l)):l?p.settle(d,l):p.tick(d,l);let s=d.step(e,l);o.stage||l||(s=!0),l?a.yaw=a.pitch=a.yawV=a.pitchV=0:(a.yawV+=(-48*(a.yaw-a.aimYaw)-13*a.yawV)*e,a.yaw+=a.yawV*e,a.pitchV+=(-48*(a.pitch-a.aimPitch)-13*a.pitchV)*e,a.pitch+=a.pitchV*e,(Math.abs(a.yaw-a.aimYaw)+Math.abs(a.pitch-a.aimPitch)>1e-4||Math.abs(a.yawV)+Math.abs(a.pitchV)>.001)&&(s=!0)),g.update(a.yaw,a.pitch);let h=+("dark"===o.theme);a.night=l?h:(0,r.damp)(a.night,h,7,e),.002>Math.abs(a.night-h)?a.night=h:s=!0,(a.capsGap>0||a.capsId!==o.caps)&&(a.capsId=o.caps,a.capsGap=function(e,t,a){let o=0;for(let r=0;r<3;r++)e.albedo[r]=eh(e.albedo[r],t.albedo[r],a),e.legend[r]=eh(e.legend[r],t.legend[r],a),o+=Math.abs(e.albedo[r]-t.albedo[r])+Math.abs(e.legend[r]-t.legend[r]);if(o<.002){for(let a=0;a<3;a++)e.albedo[a]=t.albedo[a],e.legend[a]=t.legend[a];return 0}return o}(a.caps,em(o.caps),l?1:1-Math.exp(-(10*e))),a.capsGap>0&&(s=!0));let u=performance.now();if(o.stage&&!l){let t=a.breathedAt?Math.min(.5,(u-a.breathedAt)/1e3):e,o=+(u-a.lastInput<8e3);a.breathe=(0,r.damp)(a.breathe,o,o?2:1.2,t),.004>Math.abs(a.breathe-o)&&(a.breathe=o)}else a.breathe=0;a.breathedAt=u;let c=a.breathe>0,f=a.frame;if(o.stage)f.look=0===a.night?el:1===a.night?es:ef(a.night,a.fade);else{let e=ef(a.night,a.tileLook);e.glowGain*=1.25+.3*(1-a.night),e.shadow[0]*=1.25,e.shadow[1]*=1.2,f.look=e}f.knobAngle=-Math.PI/2+d.angle;let m=a.fill;if(m.breathe=a.breathe,m.reduced=l,d.fill(m),f.rippleCount=m.rippleCount,t.draw(f),(()=>{if(!I.current.stage)return;let e=B.current,t=e.placedVersion!==g.version||Math.abs(e.placedYaw-e.yaw)>2e-5||Math.abs(e.placedPitch-e.pitch)>2e-5;t&&(e.placedVersion=g.version,e.placedYaw=e.yaw,e.placedPitch=e.pitch);let a=e.placedBox;for(let o=0;o<9;o++){let r=d.switches[o].x;if(!t&&e.placedTravel[o]===r)continue;e.placedTravel[o]=r;let i=T.current[o];i&&(g.capBox(o,r,a),i.style.transform=`translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`,i.style.width=`${a.w.toFixed(1)}px`,i.style.height=`${a.h.toFixed(1)}px`)}let o=y.current;t&&o&&(g.knobBox(a),o.style.transform=`translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`,o.style.width=`${a.w.toFixed(1)}px`,o.style.height=`${a.h.toFixed(1)}px`),e.ring>=0&&(t||9!==e.ring&&e.ringTravel!==d.switches[e.ring].x)&&H()})(),a.calm=!s,!s&&!c)return a.breathedAt=0,!1}),V=(0,a.useCallback)(()=>{B.current.kick=!0,$()},[$]),j=(0,a.useCallback)(()=>{B.current.lastInput=performance.now(),V()},[V]),[q]=(0,a.useState)(()=>c?window.innerWidth*(window.devicePixelRatio||1)>2e3?1.75:2:1.5),Z=(0,a.useRef)(null),Q=(0,a.useRef)(!1),{canvasRef:et,sizeRef:ea,supported:er}=(0,r.useWebGL2)({mode:e,maxDpr:q,attributes:{alpha:!0,antialias:!0,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new eb(e)}catch(e){console.error(e);return}return x.current||(x.current=s(void 0,c?500:640)),t.setAtlas(x.current),v.current=t,Z.current=e,B.current.placedVersion=-1,V(),()=>{t?.dispose(),v.current=null}},onResize:()=>{B.current.fitDirty=!0,V()}});(0,a.useEffect)(()=>(Q.current=!0,()=>{Q.current=!1;let e=Z.current;e&&window.setTimeout(()=>{if(Q.current||e.isContextLost())return;e.getExtension("WEBGL_lose_context")?.loseContext();let t=e.canvas;t instanceof HTMLCanvasElement&&(t.width=0,t.height=0),Z.current===e&&(Z.current=null)},0)}),[]),(0,a.useEffect)(()=>{let e=!0;return(function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!e||!document.fonts)return Promise.resolve();return document.fonts.load(`500 64px ${e}`).then(()=>void 0).catch(()=>void 0)}catch{return Promise.resolve()}})().then(()=>{e&&(x.current=s(x.current??void 0,c?500:640),v.current?.setAtlas(x.current),V())}),()=>{e=!1}},[V,c]),(0,a.useEffect)(()=>{if(!c)return;let e=w.current?.querySelector("[data-lab-controls]");if(!e)return;let t=new ResizeObserver(()=>{B.current.fitDirty=!0,V()});return t.observe(e),()=>t.disconnect()},[c,V]),(0,a.useEffect)(()=>{h?(d.accent[4]=.55,[1,3,5,7].forEach(e=>d.accent[e]=.1)):d.accent.fill(0),j()},[u,R,h,d,j]);let en=(0,a.useRef)([]),eu=(0,a.useCallback)((e,t=!1)=>{let a=I.current.reducedMotion;if(!d.press(e,a))return!1;if(I.current.stage){let o=a?.004:J;en.current[e]=function(e,t,a=.024,o=1){let r=ew();if(!r)return ek;let i=ey[e]??ey[4],n=r.ctx.currentTime+a,l=r.ctx.createGain();l.connect(eT(r.ctx,r.output,t));let s=i.level*o*eA(.08),h=i.body*eA(.035);return eM(r,n,l,h,1.5,.028,.2*s,.09),eM(r,n,l,2.38*h,1.2,.02,.04*s,.04,"triangle"),eE(r,n,l,"bandpass",i.hollow*eA(.05),3.2,.62*s,.055),eE(r,n,l,"bandpass",i.band*eA(.08),1.15,.17*s,.024),eE(r,n,l,"lowpass",620*eA(.1),.7,.24*s,.05),eE(r,n,l,"highpass",4200,.7,.04*s,.006),()=>{let e=r.ctx.currentTime;l.gain.cancelScheduledValues(e),l.gain.setValueAtTime(e<n?0:l.gain.value,e),e>=n&&l.gain.setTargetAtTime(0,e,.004)}}(e,eD(e),t?Math.max(o,.075):o)}return D(!0),j(),!0},[d,I,j]),eg=(0,a.useCallback)((e,t=!1)=>{if(!d.isDown(e))return;let a=I.current.reducedMotion,o=d.switches[e],r=o.x<.92&&!a?Math.max(0,J*(1-o.x)):0;d.release(e,a),t?en.current[e]?.():I.current.stage&&function(e,t,a=.035){let o=ew();if(!o)return;let r=ey[e]??ey[4],i=o.ctx.currentTime+a,n=eT(o.ctx,o.output,t);eE(o,i,n,"bandpass",1.55*r.band*eA(.1),1.6,.12*r.level,.016),eE(o,i,n,"bandpass",1.35*r.hollow*eA(.05),3,.22*r.level,.03),eM(o,i,n,2.1*r.body*eA(.04),1.25,.012,.05*r.level,.035)}(e,eD(e),(a?.01:ee)+r),en.current[e]=null,j()},[d,I,j]),ev=(0,a.useRef)(0),ex=(0,a.useCallback)((e,t=!1)=>{if(!e)return;let a=I.current.reducedMotion;if(d.turn(e,a),I.current.stage&&!t){let t=Math.min(4,Math.abs(e));for(let a=0;a<t;a++)eP(Math.sign(e),.034*a)}C(d.detent),D(!0),window.clearTimeout(ev.current),ev.current=window.setTimeout(()=>F(`Glow: ${W(d.hue)}`),350),j()},[d,I,j]);(0,a.useEffect)(()=>()=>window.clearTimeout(ev.current),[]);let eR=(e,t)=>{if(f(g.knobHull(),e,t))return"knob";for(let a of M)if(f(g.capTop(a.index,d.switches[a.index].x),e,t))return a.index;for(let a of M)if(f(g.capHull(a.index,d.switches[a.index].x),e,t))return a.index;return null},e_=e=>{let t=b.current?.getBoundingClientRect();return t?[e.clientX-t.left,e.clientY-t.top]:[0,0]},eC=(0,a.useRef)(new Map),eB=(e,t)=>{let[a,o]=g.knobCentre();return{angle:Math.atan2(t-o,e-a),r:Math.hypot(e-a,t-o)}},eG=e=>{let[t,a]=e_(e),o=B.current,{width:r,height:i}=ea.current;"mouse"===e.pointerType&&r&&i&&!I.current.reducedMotion&&(o.aimYaw=(t/r*2-1)*(c?.075:.06),o.aimPitch=(a/i*2-1)*(c?-.045:-.035),j());let n=eC.current.get(e.pointerId);if(!c){if("mouse"!==e.pointerType)return;let r=eR(t,a),i="number"==typeof r?r:-1;i!==o.hover&&(o.hover=i,i>=0&&p.poke(d,i,I.current.reducedMotion),j());return}if(!n)return;if("keys"===n.kind){let e=eR(t,a),o="number"==typeof e?e:-1;if(o===n.over)return;n.over=o,n.key>=0&&eg(n.key),n.key=o>=0&&eu(o,n.touch)?o:-1;return}let{angle:l,r:s}=eB(t,a),h=l-n.last;h>Math.PI&&(h-=2*Math.PI),h<-Math.PI&&(h+=2*Math.PI),n.last=l;let u=Math.min(1,Math.max(0,(s-6)/16));n.raw+=h*u+(1-u)*(e.movementX||0)*.02,n.travelled+=Math.abs(h)*Math.max(s,8);let f=d.dragTo(n.raw,I.current.reducedMotion);if(f){for(let e=0;e<Math.min(3,Math.abs(f));e++)eP(Math.sign(f),.03*e);C(d.detent),D(!0),window.clearTimeout(ev.current),ev.current=window.setTimeout(()=>F(`Glow: ${W(d.hue)}`),350)}j()},eO=e=>{let t=eC.current.get(e.pointerId);if(t){if(eC.current.delete(e.pointerId),"keys"===t.kind){t.key>=0&&eg(t.key,"pointercancel"===e.type&&t.touch);return}b.current?.removeAttribute("data-grabbing"),d.endDrag(),"pointerup"===e.type&&t.travelled<5&&performance.now()-t.at<350&&ex(1),j()}},eK=()=>{let e=B.current;e.aimYaw=0,e.aimPitch=0,e.hover=-1,j()};(0,a.useEffect)(()=>{if(!c)return;let e=y.current;if(!e)return;let t=0,a=0,r=e=>{e.preventDefault(),(0,o.ensureAudio)();let r=performance.now();r-a>220&&(t=0),a=r;let i=1===e.deltaMode?1:2===e.deltaMode?3:1/40,n=(t+=(Math.abs(e.deltaY)>Math.abs(e.deltaX)?-e.deltaY:e.deltaX)*i)>0?Math.floor(t):Math.ceil(t);n&&(t-=n,ex(Math.max(-3,Math.min(3,n))))};return e.addEventListener("wheel",r,{passive:!1}),()=>e.removeEventListener("wheel",r)},[c,ex]),(0,a.useEffect)(()=>{if(!c||!l)return;let e=new Set,t=t=>{let a;if(t.defaultPrevented||t.ctrlKey||t.metaKey||t.altKey||(a=t.target)instanceof HTMLElement&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))||document.querySelector("[role='dialog'][data-open]"))return;let r=eN(t);if(r<0||(t.preventDefault(),t.repeat||e.has(r)))return;(0,o.ensureAudio)(),e.add(r);let i=T.current.indexOf(document.activeElement);i>=0&&i!==r&&(z(r),T.current[r]?.focus()),eu(r)},a=t=>{let a=eN(t);!(a<0)&&e.has(a)&&(e.delete(a),eg(a))},r=()=>{e.forEach(e=>eg(e)),e.clear()};return window.addEventListener("keydown",t),window.addEventListener("keyup",a),window.addEventListener("blur",r),()=>{window.removeEventListener("keydown",t),window.removeEventListener("keyup",a),window.removeEventListener("blur",r),r()}},[c,l,eu,eg]),(0,a.useEffect)(()=>{l||(M.forEach(e=>{d.release(e.index,!0),en.current[e.index]=null}),eC.current.clear(),b.current?.removeAttribute("data-grabbing"),d.endDrag())},[l,d]);let eU=e=>{let t=B.current;t.ring!==e&&(t.ring=e,H())},eH=e=>{let t=B.current;t.ring===e&&(t.ring=-1,H())},e$=e=>t=>{let a={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[t.key];if("keydown"===t.type&&eU(e),a){if("keydown"!==t.type)return;t.preventDefault(),t.stopPropagation();let o=Math.min(2,Math.max(0,e%3+a[0])),r=3*Math.min(2,Math.max(0,Math.floor(e/3)+a[1]))+o;z(r),T.current[r]?.focus();return}if("Home"===t.key||"End"===t.key){if("keydown"!==t.type)return;t.preventDefault();let e=8*("Home"!==t.key);z(e),T.current[e]?.focus();return}if(" "===t.key||"Enter"===t.key)if(t.preventDefault(),t.stopPropagation(),"keydown"===t.type){if(t.repeat)return;(0,o.ensureAudio)(),eu(e)}else eg(e)};if(!1===er)return(0,t.jsx)(eI,{stage:c,theme:u});if(!c)return(0,t.jsx)("div",{className:"absolute inset-0",onPointerMove:eG,onPointerLeave:eK,children:(0,t.jsx)("canvas",{ref:et,"aria-hidden":"true",className:"absolute inset-0 block size-full"})});let eX=ez(_),eV=W(eX),ej=m(Y(eX));return(0,t.jsxs)("div",{ref:b,className:"absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[grabbing]:cursor-grabbing data-[grabbing]:**:cursor-grabbing",style:{touchAction:"pan-y"},onContextMenu:e=>{e.target.closest("[data-lab-controls]")||e.preventDefault()},onPointerDown:e=>{if(!c||e.button>0||eC.current.has(e.pointerId)||e.target.closest("[data-lab-controls]"))return;(0,o.ensureAudio)();let[t,a]=e_(e),r=eR(t,a);if(null===r)return;e.preventDefault(),B.current.pressedAt=performance.now();try{b.current?.setPointerCapture(e.pointerId)}catch{}if("knob"===r){if([...eC.current.values()].some(e=>"knob"===e.kind))return;let{angle:o}=eB(t,a);d.dragging=!0,eC.current.set(e.pointerId,{kind:"knob",id:e.pointerId,raw:d.detent*X,last:o,startX:t,startY:a,at:performance.now(),travelled:0}),b.current?.setAttribute("data-grabbing",""),j();return}let i="touch"===e.pointerType;eC.current.set(e.pointerId,{kind:"keys",id:e.pointerId,key:eu(r,i)?r:-1,over:r,touch:i})},onPointerMove:eG,onPointerUp:eO,onPointerCancel:eO,onLostPointerCapture:eO,onPointerLeave:eK,children:[(0,t.jsx)("canvas",{ref:et,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),(0,t.jsx)("svg",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 size-full overflow-visible",children:(0,t.jsxs)("g",{ref:O,style:{opacity:0},fill:"none",strokeLinejoin:"round",children:[(0,t.jsx)("path",{ref:U,strokeWidth:3,style:{stroke:"color-mix(in oklab, var(--background) 70%, transparent)"}}),(0,t.jsx)("path",{ref:K,strokeWidth:2,style:{stroke:"var(--foreground)"}})]})}),(0,t.jsx)("div",{role:"group","aria-label":"Macropad keys","aria-describedby":A,children:M.map(e=>(0,t.jsx)("button",{ref:t=>{T.current[e.index]=t},type:"button","aria-label":`Key ${e.index+1}`,"aria-keyshortcuts":String(e.index+1),tabIndex:e.index===N?0:-1,onMouseDown:e=>e.preventDefault(),onFocus:t=>{z(e.index);let a=!0;try{a=t.currentTarget.matches(":focus-visible")}catch{}a&&eU(e.index)},onKeyDown:e$(e.index),onKeyUp:e$(e.index),onBlur:()=>{eH(e.index),eg(e.index)},onClick:t=>{0!==t.detail||d.isDown(e.index)||performance.now()-B.current.pressedAt<800||(eu(e.index),window.setTimeout(()=>eg(e.index),120))},className:"absolute top-0 left-0 cursor-pointer rounded-[18px] outline-none [touch-action:pan-y]"},e.index))}),(0,t.jsx)("div",{ref:y,role:"slider",tabIndex:0,"aria-label":"Glow hue knob","aria-describedby":A,"aria-valuemin":0,"aria-valuemax":345,"aria-valuenow":eX,"aria-valuetext":`${eV}, ${eX} degrees`,onMouseDown:e=>e.preventDefault(),onFocus:e=>{let t=!0;try{t=e.currentTarget.matches(":focus-visible")}catch{}t&&eU(9)},onBlur:()=>eH(9),onKeyDown:e=>{eU(9);let t={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:3,PageDown:-3}[e.key];if("Home"===e.key||"End"===e.key){let a=(345*("Home"!==e.key)-ez(d.detent))/15;a>12&&(a-=24),a<-12&&(a+=24),t=Math.round(a)}void 0!==t&&(e.preventDefault(),e.stopPropagation(),(0,o.ensureAudio)(),ex(t))},className:"absolute top-0 left-0 cursor-grab rounded-full outline-none [touch-action:none]"}),(0,t.jsx)("p",{id:A,className:"sr-only",children:"Press the digits 1 to 9 to play the keys, or focus the keys, move between them with the arrow keys and press Space or Enter. The knob sets the colour of the light: focus it and use the arrow keys, or drag it, scroll over it or tap it."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:S}),(0,t.jsx)("div",{ref:w,className:"contents",children:(0,t.jsxs)(n.StageControls,{placement:"bottom",children:[(0,t.jsxs)(n.TrayRow,{children:[(0,t.jsx)(n.Tray,{label:"Keycaps",children:(0,t.jsx)(n.Swatches,{label:"Keycaps",options:eL,value:R,onChange:e=>{(0,o.ensureAudio)(),P(e),D(!0),F(ed.find(t=>t.id===e)?.label??""),d.pulse(4,.6,I.current.reducedMotion),j()}})}),(0,t.jsxs)(n.Tray,{label:"Glow",children:[(0,t.jsx)(n.IconButton,{label:"Turn the knob back a notch",onClick:()=>((0,o.ensureAudio)(),ex(-1)),children:(0,t.jsx)(i.ChevronLeft,{size:14})}),(0,t.jsxs)("span",{"aria-hidden":"true",className:"flex h-10 min-w-[104px] items-center justify-center gap-2 px-1 text-[13px] text-primary capitalize",children:[(0,t.jsx)("span",{className:"size-2.5 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ease-out",style:{backgroundColor:ej,boxShadow:`0 0 0 1px rgb(0 0 0 / 0.08), 0 0 10px 1px ${ej}`}}),eV]}),(0,t.jsx)(n.IconButton,{label:"Turn the knob on a notch",onClick:()=>((0,o.ensureAudio)(),ex(1)),children:(0,t.jsx)(i.ChevronRightSmall,{size:14})}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.MuteButton,{})]})]}),(0,t.jsx)(n.StageHint,{className:L?"opacity-0 transition-opacity duration-700":"transition-opacity duration-700",children:E?"Click the keys or press 1–9 · drag, scroll or click the knob":"Tap the keys · turn or tap the knob"})]})})]})}],80443)}]);