(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,80443,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(16442),o=e.i(37047),i=e.i(7537),n=e.i(45219);let l=[[7,1,2,2],[5,3,2,3],[9,3,2,3],[3,6,2,4],[11,6,2,4],[1,10,2,5],[13,10,2,5],[7,10,2,2]];function s(e=document.createElement("canvas"),t=500){e.width=1024,e.height=1024;let a=e.getContext("2d");if(!a)return e;a.clearRect(0,0,1024,1024),a.fillStyle="#fff";let r=function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(e)return`${e}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}();a.textAlign="center",a.textBaseline="alphabetic",a.font=`${t} ${Math.round(256*(t>500?.4:.36))}px ${r}`;for(let e=0;e<9;e++){let t=e%3*256+128,r=256*Math.floor(e/3)+128,o=String(e+1),i=a.measureText(o),n=i.actualBoundingBoxAscent||66.56,l=i.actualBoundingBoxDescent||0;a.fillText(o,t,r+(n-l)/2-2.56)}let o=768,i=102.4,n=92.16,h=844.8,u=6.4;for(let[e,t,r,o]of l)a.fillRect(n+e*u,h+t*u,r*u,o*u);return a.textAlign="left",a.textBaseline="middle",a.font=`500 ${Math.round(69.12)}px ${r}`,"letterSpacing"in a&&(a.letterSpacing="1px"),a.fillText("arsher",n+i+35.84,o+128+2.56),e}let h=()=>{let e=new Float32Array(16);return e[0]=e[5]=e[10]=e[15]=1,e};function u(e,t,a,r){return[e[0]*t+e[4]*a+e[8]*r+e[12],e[1]*t+e[5]*a+e[9]*r+e[13],e[2]*t+e[6]*a+e[10]*r+e[14],e[3]*t+e[7]*a+e[11]*r+e[15]]}function c(e,t,a){let r=0;for(let o=0;o<e.length;o++){let[i,n]=e[o],[l,s]=e[(o+1)%e.length],h=(l-i)*(a-n)-(s-n)*(t-i);if(1e-9>Math.abs(h))continue;let u=h>0?1:-1;if(r){if(u!==r)return!1}else r=u}return!0}function f(e){let t=e.slice().sort((e,t)=>e[0]-t[0]||e[1]-t[1]);if(t.length<3)return t;let a=(e,t,a)=>(t[0]-e[0])*(a[1]-e[1])-(t[1]-e[1])*(a[0]-e[0]),r=[];for(let e of t){for(;r.length>=2&&0>=a(r[r.length-2],r[r.length-1],e);)r.pop();r.push(e)}let o=[];for(let e=t.length-1;e>=0;e--){let r=t[e];for(;o.length>=2&&0>=a(o[o.length-2],o[o.length-1],r);)o.pop();o.push(r)}return o.pop(),r.pop(),r.concat(o)}function d(e){let t=e.replace("#",""),a=e=>{let a=parseInt(t.slice(e,e+2),16)/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4};return[a(0),a(2),a(4)]}let p=e=>{let t=Math.min(1,Math.max(0,e));return Math.round(255*(t<=.0031308?12.92*t:1.055*t**(1/2.4)-.055))};function m(e){return`rgb(${p(e[0])} ${p(e[1])} ${p(e[2])})`}let g={halfWidth:1.83,front:1.83,back:-2.73,radius:.34,height:.62,chamfer:.05},v=(g.front+g.back)/2,x=(g.front-g.back)/2,b=1.535,w=.14,T=.03,y={base:.455,baseRadius:.075,topX:.352,topZ:.338,topRadius:.11,topShift:-.014,height:.4,dish:.046,fillet:.034},E=g.height+.03,A=Array.from({length:9},(e,t)=>{let a=t%3,r=Math.floor(t/3);return{index:t,col:a,row:r,x:a-1,z:r-1}}),M=(e,t)=>[e[0]-t[0],e[1]-t[1],e[2]-t[2]],_=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],k=(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2],R=e=>{let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]};function P(e){let t=[],a=[];for(let r of e){let e=t.length/7,{us:o,vs:i,at:n}=r,l=i[0],s=i[i.length-1];for(let e of i)for(let a of o){let o=n(a,e),i=M(n(r.wrap?(a+1e-4)%1:Math.min(1,a+1e-4),e),n(r.wrap?(a-1e-4+1)%1:Math.max(0,a-1e-4),e)),h=Math.max(l,e-1e-4),u=_(i,M(n(a,Math.min(s,e+1e-4)),n(a,h))),c=r.facing(o);1e-12>Math.hypot(u[0],u[1],u[2])&&(u=c),0>k(u=R(u),c)&&(u=[-u[0],-u[1],-u[2]]),t.push(o[0],o[1],o[2],u[0],u[1],u[2],r.tag)}let h=o.length,u=r.wrap?h:h-1;for(let t=0;t<i.length-1;t++)for(let r=0;r<u;r++){let o=e+t*h+r,i=e+t*h+(r+1)%h,n=e+(t+1)*h+r,l=e+(t+1)*h+(r+1)%h;a.push(o,i,n,i,l,n)}}return{vertices:new Float32Array(t),indices:new Uint32Array(a)}}function S(e,t,a,r,o=0,i=0){let n,l,s=Math.max(5e-4,Math.min(r,t,a)),h=t-s,u=a-s,c=(e%1+1)%1,f=Math.min(7,Math.floor(8*c)),d=8*c-f;switch(f){case 0:{let e=Math.PI/2*d;n=h+s*Math.cos(e),l=u+s*Math.sin(e);break}case 1:n=h-2*h*d,l=a;break;case 2:{let e=Math.PI/2+Math.PI/2*d;n=-h+s*Math.cos(e),l=u+s*Math.sin(e);break}case 3:n=-t,l=u-2*u*d;break;case 4:{let e=Math.PI+Math.PI/2*d;n=-h+s*Math.cos(e),l=-u+s*Math.sin(e);break}case 5:n=-h+2*h*d,l=-a;break;case 6:{let e=1.5*Math.PI+Math.PI/2*d;n=h+s*Math.cos(e),l=-u+s*Math.sin(e);break}default:n=t,l=-u+2*u*d}return[o+n,i+l]}function C(e,t){let a=[];for(let r=0;r<8;r++){let o=r%2==0?e:t;for(let e=0;e<o;e++)a.push((r+e/o)/8)}return a}let F=(e,t,a,r=e=>e)=>Array.from({length:a+1},(o,i)=>e+(t-e)*r(i/a));function L(e,t){let a=e/y.topX,r=(t-y.topShift)/y.topZ;return y.height-y.dish*(1-(a*a+r*r)/2)}let D=e=>Number.isInteger(e)?`${e}.0`:`${e}`,z=`#version 300 es
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
`,N=`
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
uniform vec3 uKnobLight;   // the knob's indicator (colour \xd7 intensity)
uniform float uGlowGain;

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

const float PLATE_Y = ${D(.4)};
const float CASE_H = ${D(g.height)};
const float CASE_HW = ${D(g.halfWidth)};
const float CASE_HD = ${D(x)};
const float CASE_CZ = ${D(v)};
const float CASE_R = ${D(g.radius)};
const float POCKET_HALF = ${D(b)};
const float POCKET_R = ${D(w)};
const float CAP_BASE = ${D(y.base)};
const float CAP_H = ${D(y.height)};
const float CAP_TOPX = ${D(y.topX)};
const float CAP_TOPZ = ${D(y.topZ)};
const float CAP_SHIFT = ${D(y.topShift)};
const float SKIRT_REST = ${D(.28)};
const float TRAVEL = ${D(.2)};
const vec2 KNOB_C = vec2(${D(1)}, ${D(-2.09)});
const float KNOB_R = ${D(.355)};
const float KNOB_H = ${D(.43)};
const vec4 ENGRAVING = vec4(${D(-.62)}, ${D(-2.09)}, ${D(.9)}, ${D(.225)});

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
    float sd = sdRoundBox(p - keyCentre(k), vec2(CAP_BASE - 0.03), 0.1);
    float fall = mix(6.5, 10.0, press);
    float pool = exp(-max(sd, 0.0) * fall);
    // under the skirt the light is hidden, but let it read through gaps
    g += uGlow[k] * pool * (1.0 + 0.5 * press);
  }
  for (int i = 0; i < 8; i++) {
    vec4 r = uRipple[i];
    if (r.w <= 0.0005) continue;
    float d = length(p - r.xy);
    float w = 0.16 + r.z * 0.09;
    float x = (d - r.z) / w;
    g += uRippleColor[i] * (r.w * exp(-x * x));
  }
  return g * uGlowGain;
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

vec3 shade(vec3 n, vec3 v, vec3 albedo, vec3 f0, float rough, float metal, float ao, float shadow) {
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
  return diffuse + spec;
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
  // a gentle filmic shoulder: linear up to the mids, rolls off highlights
  vec3 x = max(c, 0.0);
  vec3 mapped = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return mix(x, mapped, smoothstep(0.35, 1.2, x));
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
    // a faint micro-texture breaks the CG smoothness of PBT
    vec3 nb = n + vec3(grain, 0.0, (vnoise(p.zx * 240.0) - 0.5) * uDetail) * 0.05;
    n = normalize(nb);
    vec3 albedo = uCapAlbedo * (0.985 + 0.03 * hash(vec2(float(uKey), 3.7)));
    // the legend, dye-sublimated into the top
    if (local.y > CAP_H - 0.07 && uKey >= 0) {
      vec2 uv = vec2(local.x / (CAP_TOPX * 1.7) + 0.5, (local.z - CAP_SHIFT) / (CAP_TOPZ * 1.7) + 0.5);
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        vec2 cell = vec2(float(uKey - (uKey / 3) * 3), float(uKey / 3));
        float ink = texture(uAtlas, (cell + uv) / 4.0).a;
        albedo = mix(albedo, uLegend, ink);
      }
    }
    color = shade(n, v, albedo, vec3(0.034), 0.46, 0.0, ao, 1.0);
    // glow from the plate climbs the lower walls
    vec2 outward = normalize(n.xz + 1e-4) * 0.06;
    vec3 g = plateGlow(p.xz + outward) * exp(-max(h, 0.0) / 0.1) * (0.55 - 0.45 * n.y);
    emit += g * mix(vec3(1.0), uCapAlbedo * 1.6 + 0.25, 0.6);
  } else if (vTag == TAG_PLATE) {
    float contact;
    float occ = capShadow(p.xz, p.y, contact);
    float sdPocket = -sdRoundBox(p.xz, vec2(POCKET_HALF), POCKET_R);
    float wallAo = mix(0.35, 1.0, smoothstep(0.0, 0.16, sdPocket));
    ao = contact * wallAo * 0.55;
    color = shade(n, v, uPlateAlbedo, uCaseF0 * 0.6, 0.5, 0.25, ao, occ * wallAo);
    emit += plateGlow(p.xz) * (0.55 + 0.45 * contact) * mix(0.7, 1.0, wallAo);
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
      // caps shadow the frame round the pocket
      float contact;
      shadow *= capShadow(p.xz, p.y, contact);
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
      float sdPocket = sdRoundBox(p.xz, vec2(POCKET_HALF), POCKET_R);
      emit += plateGlow(p.xz * 0.96) * 0.05 * exp(-max(sdPocket, 0.0) / 0.03);
    } else if (vTag == TAG_POCKET_WALL) {
      float h = p.y - PLATE_Y;
      ao = mix(0.3, 0.75, smoothstep(0.0, CASE_H - PLATE_Y, h));
      shadow = 0.5;
      vec2 inward = -normalize(p.xz) * 0.0;
      inward = n.xz * 0.12;
      emit += plateGlow(p.xz + inward) * exp(-h / 0.12) * 0.8;
    } else if (vTag == TAG_POCKET_CHAMFER) {
      // the polished edge mirrors the light in the pocket
      emit += plateGlow(p.xz + n.xz * 0.16) * 0.4;
      float contact;
      shadow *= capShadow(p.xz, p.y, contact);
    } else if (vTag == TAG_WALL) {
      ao = mix(0.55, 1.0, smoothstep(0.0, 0.2, p.y));
    }
    color = shade(n, v, albedo, f0, clamp(rough, 0.05, 1.0), metal, ao, shadow);
  }

  color += emit;
  outColor = vec4(toSrgb(tonemap(color)), 1.0);
}
`,I=`
void main() {
  vec3 n = normalize(vNormal);
  vec3 p = vWorld;
  vec3 emit = vec3(0.0);
  if (vTag == TAG_PLATE) {
    emit = plateGlow(p.xz);
  } else if (vTag == TAG_CAP) {
    float h = p.y - PLATE_Y;
    emit = plateGlow(p.xz + normalize(n.xz + 1e-4) * 0.06) * exp(-max(h, 0.0) / 0.1) * (0.55 - 0.45 * n.y);
  } else if (vTag == TAG_POCKET_WALL) {
    float h = p.y - PLATE_Y;
    emit = plateGlow(p.xz + n.xz * 0.12) * exp(-h / 0.12) * 0.8;
  } else if (vTag == TAG_KNOB_TOP) {
    float dd = length(vLocal.xz - vec2(KNOB_R * 0.66, 0.0));
    emit = uKnobLight * uGlowGain * (smoothstep(0.032, 0.025, dd) * 1.5 + exp(-dd / 0.02) * 0.2);
  } else if (vTag == TAG_GROUND) {
    discard;
  }
  outColor = vec4(emit * 0.5, 1.0);
}
`,U=`#version 300 es
${N}
${B}
${G}
`,O=`#version 300 es
${N}
${I}
`,K=`#version 300 es
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
`,H=`#version 300 es
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
`,$=2*Math.PI/24,X=[[0,"rose"],[15,"coral"],[30,"vermilion"],[45,"tangerine"],[60,"amber"],[75,"gold"],[90,"citrine"],[105,"lime"],[120,"chartreuse"],[135,"green"],[150,"emerald"],[165,"jade"],[180,"teal"],[195,"aqua"],[210,"cyan"],[225,"sky"],[240,"azure"],[255,"cornflower"],[270,"indigo"],[285,"violet"],[300,"purple"],[315,"orchid"],[330,"magenta"],[345,"pink"]],V=e=>(e%360+360)%360;function j(e){let t=15*Math.round(V(e)/15);return X.find(([e])=>e===t%360)?.[1]??"colour"}function W(e){let t,a,r,o,i,n;return a=.175*Math.cos(t=V(e)*Math.PI/180),o=(.76+.3963377774*a+.2158037573*(r=.175*Math.sin(t)))**3,[Math.max(0,4.0767416621*o-3.3077115913*(i=(.76-.1055613458*a-.0638541728*r)**3)+.2309699292*(n=(.76-.0894841775*a-1.291485548*r)**3)),Math.max(0,-1.2684380046*o+2.6097574011*i-.3413193965*n),Math.max(0,-.0041960863*o-.7034186147*i+1.707614701*n)]}class Y{x=0;v=0;held=!1;pending=!1;pendingAt=0;get resting(){return 0===this.v&&(this.held?1===this.x:0===this.x)&&!this.pending}step(e,t){if(this.pending&&(this.x>=.92||t-this.pendingAt>.14)&&(this.pending=!1,this.held=!1),this.resting)return;let a=1/480,r=Math.min(e,.05);for(;r>1e-6;){let e=Math.min(a,r);r-=e;let t=this.held?1.32:-.28,o=this.held?1150:760,i=this.held?38:30;this.v+=(-o*(this.x-t)-i*this.v)*e,this.x+=this.v*e,this.x>1?(this.x=1,this.v>0&&(this.v=-(.16*this.v))):this.x<0&&(this.x=0,this.v<0&&(this.v=-(.3*this.v)))}let o=+!!this.held;.004>Math.abs(this.x-o)&&.4>Math.abs(this.v)&&(this.x=o,this.v=0)}}let q=(()=>{let e=new Y;e.held=!0;let t=0;for(;e.x<1&&t<.3;)e.step(1/480,t),t+=1/480;return t})(),Z=(()=>{let e=new Y;e.x=1;let t=0;for(;e.x>0&&t<.3;)e.step(1/480,t),t+=1/480;return t})(),Q=A.map(e=>Math.hypot(e.x-1,e.z- -2.09));class J{switches=A.map(()=>new Y);flash=new Float32Array(9);accent=new Float32Array(9);hues=new Float32Array(9);hue=60;knobHue=60;detent=0;angle=0;angleV=0;angleTarget=0;dragging=!1;ripples=[];time=0;idle=.3;history=[{t:-1,hue:60}];constructor(){this.hues.fill(60)}press(e,t,a=1){let r=this.switches[e];if(!r||r.held&&!r.pending)return!1;r.held=!0,r.pending=!1,t&&(r.x=1,r.v=0),this.flash[e]=Math.max(this.flash[e],1.15*a);let o=A[e];return t?A.forEach((t,r)=>{if(r===e)return;let i=Math.hypot(t.x-o.x,t.z-o.z);this.flash[r]=Math.max(this.flash[r],.55*a*Math.exp(-(.55*i)))}):(this.ripples.length>=8&&this.ripples.shift(),this.ripples.push({x:o.x,z:o.z,age:0,amp:.9*a,hue:this.hues[e],hit:1<<e})),!0}pulse(e,t,a){let r=A[e];!r||(this.flash[e]=Math.max(this.flash[e],t),a||(this.ripples.length>=8&&this.ripples.shift(),this.ripples.push({x:r.x,z:r.z,age:0,amp:.8*t,hue:this.hues[e],hit:1<<e})))}release(e,t){let a=this.switches[e];if(a&&a.held){if(t){a.held=!1,a.pending=!1,a.x=0,a.v=0;return}a.x<.92?(a.pending=!0,a.pendingAt=this.time):a.held=!1}}isDown(e){let t=this.switches[e];return!!(t&&t.held&&!t.pending)}turn(e,t){return e&&(this.detent+=e,this.angleTarget=this.detent*$,t&&(this.angle=this.angleTarget,this.angleV=0),this.setHue(60+15*this.detent,t)),this.hue}dragTo(e,t){let a=Math.round(e/$),r=a-this.detent;r&&(this.detent=a,this.setHue(60+15*this.detent,t));let o=(e-a*$)/($/2);return this.angleTarget=a*$+$/2*Math.sign(o)*Math.abs(o)**3*.85,t&&(this.angle=this.angleTarget,this.angleV=0),r}endDrag(){this.dragging=!1,this.angleTarget=this.detent*$}setHue(e,t){this.hue=e,this.history.push({t:this.time,hue:e}),this.history.length>64&&this.history.splice(0,this.history.length-64),t&&(this.hues.fill(e),this.knobHue=e)}hueAt(e){let t=this.history;for(let a=t.length-1;a>=0;a--)if(t[a].t<=e)return t[a].hue;return t[0].hue}step(e,{reduced:t,breathe:a}){this.time+=e;let r=this.time,o=!1;for(let a of this.switches)t?(a.pending&&(a.pending=!1,a.held=!1),a.x=+!!a.held,a.v=0):a.step(e,r),a.resting||(o=!0);for(let t of this.ripples){t.age+=e;let a=4.6*t.age;A.forEach((e,r)=>{if(t.hit&1<<r)return;let o=Math.hypot(e.x-t.x,e.z-t.z);a>=o-.25&&(t.hit|=1<<r,this.flash[r]=Math.max(this.flash[r],.62*t.amp*Math.exp(-(.42*o))))})}this.ripples=this.ripples.filter(e=>e.age<1.6),this.ripples.length&&(o=!0);for(let a=0;a<9;a++)this.isDown(a)?this.flash[a]=Math.max(this.flash[a],.85):this.flash[a]>0&&(this.flash[a]*=Math.exp(-e*(t?4:3.1)),this.flash[a]<.002?this.flash[a]=0:o=!0);for(let a=0;a<9;a++){let i=this.hueAt(r-.075*Q[a]);if(t)this.hues[a]=this.hue;else{let t=this.hues[a]+(i-this.hues[a])*(1-Math.exp(-(16*e)));this.hues[a]=.05>Math.abs(i-t)?i:t}this.hues[a]!==this.hue&&(o=!0)}if(this.knobHue=t?this.hue:this.knobHue+(this.hue-this.knobHue)*(1-Math.exp(-(22*e))),.05>Math.abs(this.knobHue-this.hue)?this.knobHue=this.hue:o=!0,t)this.angle=this.angleTarget;else{let t=1/480,a=Math.min(e,.05),r=this.dragging?900:520,i=this.dragging?52:26;for(;a>1e-6;){let e=Math.min(t,a);a-=e,this.angleV+=(-r*(this.angle-this.angleTarget)-i*this.angleV)*e,this.angle+=this.angleV*e}1e-4>Math.abs(this.angle-this.angleTarget)&&.001>Math.abs(this.angleV)?(this.angle=this.angleTarget,this.angleV=0):o=!0}return this.dragging&&(o=!0),o||a&&!t}fill(e){let t=this.time;for(let a=0;a<9;a++){e.travel[a]=this.switches[a].x;let r=e.breathe&&!e.reduced?.86+.14*Math.sin(1.25*t-.7*A[a].x-.5*A[a].z):1,o=(this.idle*r+this.flash[a]+this.accent[a])*e.gain,i=W(this.hues[a]),n=Math.min(.35,.28*this.flash[a]);e.glow[3*a]=(i[0]*(1-n)+n)*o,e.glow[3*a+1]=(i[1]*(1-n)+n)*o,e.glow[3*a+2]=(i[2]*(1-n)+n)*o}e.ripples.fill(0),e.rippleColors.fill(0),this.ripples.forEach((t,a)=>{let r=Math.exp(-(2.6*t.age))*Math.min(1,30*t.age);e.ripples[4*a]=t.x,e.ripples[4*a+1]=t.z,e.ripples[4*a+2]=4.6*t.age,e.ripples[4*a+3]=t.amp*r*.55*e.gain;let o=W(t.hue);e.rippleColors.set(o,3*a)});let a=W(this.knobHue),r=.9*e.gain;e.knobLight[0]=a[0]*r,e.knobLight[1]=a[1]*r,e.knobLight[2]=a[2]*r}}let ee=[4,0,8,2,6,1,5,7,3,4,2,6,0,8];class et{next=.9;step=0;holding=-1;releaseAt=0;poke(e,t,a){this.holding>=0&&e.release(this.holding,a),e.press(t,a,.7),this.holding=t,this.releaseAt=e.time+.12,this.next=Math.max(this.next,e.time+.9)}settle(e,t){this.holding>=0&&e.time>=this.releaseAt&&(e.release(this.holding,t),this.holding=-1)}tick(e,t){let a=e.time;if(this.settle(e,t),a<this.next)return;let r=ee[this.step%ee.length];this.step+=1,e.press(r,t,.8),this.holding=r,this.releaseAt=a+.13,this.step%5==0&&e.turn(this.step%10==0?2:1,t),this.next=a+1.05+.37*this.step%.5}}let ea=e=>{let t=Math.hypot(e[0],e[1],e[2]);return[e[0]/t,e[1]/t,e[2]/t]},er={keyDir:ea([-.5,.84,-.3]),keyColor:[1,.985,.96],sky:[.78,.79,.81],horizon:[.56,.57,.59],floor:[.5,.5,.51],softbox:[1.9,1.9,1.86],strip:[1.4,1.4,1.42],ambient:.6,exposure:1,caseAlbedo:[.3,.305,.32],caseF0:[.4,.405,.42],caseRough:.34,caseMetal:.55,edgeF0:[.94,.94,.95],plateAlbedo:[.2,.2,.21],knobF0:[.82,.83,.85],engrave:[.07,.07,.075],shadow:[.3,.2],glowGain:1.2,bloom:.3},eo={keyDir:ea([-.5,.84,-.3]),keyColor:[.82,.83,.88],sky:[.16,.165,.18],horizon:[.055,.056,.062],floor:[.012,.012,.013],softbox:[1.25,1.25,1.32],strip:[.7,.7,.76],ambient:.55,exposure:1,caseAlbedo:[.022,.023,.026],caseF0:[.1,.104,.112],caseRough:.4,caseMetal:.6,edgeF0:[.78,.79,.81],plateAlbedo:[.025,.025,.028],knobF0:[.18,.18,.19],engrave:[.2,.2,.21],shadow:[.5,.36],glowGain:1,bloom:.75},ei=(e,t,a)=>e+(t-e)*a,en=(e,t,a)=>[ei(e[0],t[0],a),ei(e[1],t[1],a),ei(e[2],t[2],a)];function el(e,t){return e<=0&&!t?er:e>=1&&!t?eo:{keyDir:ea(en(er.keyDir,eo.keyDir,e)),keyColor:en(er.keyColor,eo.keyColor,e),sky:en(er.sky,eo.sky,e),horizon:en(er.horizon,eo.horizon,e),floor:en(er.floor,eo.floor,e),softbox:en(er.softbox,eo.softbox,e),strip:en(er.strip,eo.strip,e),ambient:ei(er.ambient,eo.ambient,e),exposure:ei(er.exposure,eo.exposure,e),caseAlbedo:en(er.caseAlbedo,eo.caseAlbedo,e),caseF0:en(er.caseF0,eo.caseF0,e),caseRough:ei(er.caseRough,eo.caseRough,e),caseMetal:ei(er.caseMetal,eo.caseMetal,e),edgeF0:en(er.edgeF0,eo.edgeF0,e),plateAlbedo:en(er.plateAlbedo,eo.plateAlbedo,e),knobF0:en(er.knobF0,eo.knobF0,e),engrave:en(er.engrave,eo.engrave,e),shadow:[ei(er.shadow[0],eo.shadow[0],e),ei(er.shadow[1],eo.shadow[1],e)],glowGain:ei(er.glowGain,eo.glowGain,e),bloom:ei(er.bloom,eo.bloom,e)}}let es=[{id:"chalk",label:"Chalk keycaps",cap:"#e8e5de",legend:"#3b3b3d"},{id:"graphite",label:"Graphite keycaps",cap:"#2f3034",legend:"#c4c4c6"},{id:"sage",label:"Sage keycaps",cap:"#a7b19c",legend:"#2c3629"},{id:"clay",label:"Clay keycaps",cap:"#c4876a",legend:"#fbefe4"}],eh={light:"chalk",dark:"graphite"};function eu(e){let t=es.find(t=>t.id===e)??es[0];return{albedo:d(t.cap),legend:d(t.legend)}}var ec=e.i(55171);let ef=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class ed{gl;main;emissive;blur;composite;uMain;uEmissive;uBlur;uComposite;meshes;empty;atlas;targets=null;model=new Float32Array(16);constructor(e){this.gl=e,this.main=(0,ec.createProgram)(e,z,U),this.emissive=(0,ec.createProgram)(e,z,O),this.blur=(0,ec.createProgram)(e,ec.FULLSCREEN_VERTEX,K),this.composite=(0,ec.createProgram)(e,ec.FULLSCREEN_VERTEX,H),this.uMain=(0,ec.uniformLocations)(e,this.main),this.uEmissive=(0,ec.uniformLocations)(e,this.emissive),this.uBlur=(0,ec.uniformLocations)(e,this.blur),this.uComposite=(0,ec.uniformLocations)(e,this.composite),this.meshes={case:this.upload(function(){let{halfWidth:e,radius:t,height:a,chamfer:r}=g,o=(a,r)=>S(a,e-r,x-r,t-r,0,v),i=(e,t)=>S(e,b+t,b+t,w+t,0,0),n=C(10,2),l=C(8,2);return P([{at:(e,t)=>{let a=Math.PI/2*t,[r,i]=o(e,.03*(1-Math.sin(a)));return[r,.03*(1-Math.cos(a)),i]},us:n,vs:F(0,1,3),wrap:!0,tag:1,facing:e=>R([e[0],-.3,e[2]-v])},{at:(e,t)=>{let[i,n]=o(e,0);return[i,.03+t*(a-r-.03),n]},us:n,vs:[0,1],wrap:!0,tag:1,facing:e=>R([e[0],0,e[2]-v])},{at:(e,t)=>{let[i,n]=o(e,t*r);return[i,a-r+t*r,n]},us:n,vs:[0,1],wrap:!0,tag:2,facing:e=>R([e[0],1.6,e[2]-v])},{at:(e,t)=>{let[n,l]=o(e,r),[s,h]=i(e,T);return[n+(s-n)*t,a,l+(h-l)*t]},us:n,vs:F(0,1,6),wrap:!0,tag:3,facing:()=>[0,1,0]},{at:(e,t)=>{let[r,o]=i(e,T*(1-t));return[r,a-T*t,o]},us:n,vs:[0,1],wrap:!0,tag:4,facing:e=>R([-e[0],1.6,-e[2]])},{at:(e,t)=>{let[r,o]=i(e,0);return[r,a-T-t*(a-T-.4),o]},us:n,vs:[0,1],wrap:!0,tag:5,facing:e=>R([-e[0],1e-4,-e[2]])},{at:(e,t)=>{let a=1-t,[r,o]=S(e,b*a,b*a,w*a,0,0);return[r,.4,o]},us:l,vs:F(0,1,8),wrap:!0,tag:6,facing:()=>[0,1,0]}])}()),cap:this.upload(function(){let{base:e,baseRadius:t,topX:a,topZ:r,topRadius:o,topShift:i,fillet:n}=y,l=[0,.45*y.height,y.topShift];return P([{at:(l,s)=>{if(s<=1){let h=.014*Math.sin(Math.PI*s)**1.2,[u,c]=S(l,e+(a-e)*s+h,e+(r-e)*s+h,t+(o-t)*s,0,i*s),f=s*(L(u,c)-n)-0;return[u,f,c]}if(s<=2){let e=Math.PI/2*(s-1),t=n*(1-Math.cos(e)),[h,u]=S(l,a-t,r-t,o-.6*t,0,i),c=L(h,u)-n+n*Math.sin(e);return[h,c,u]}let h=3-s,[u,c]=S(l,(a-n)*h,(r-n)*h,(o-.6*n)*h,0,i);return[u,L(u,c),c]},us:C(7,8),vs:[...F(0,1,9,e=>e**1.15).slice(0,-1),...F(1,2,6).slice(0,-1),...F(2,3,9,e=>1-(1-e)**1.4)],wrap:!0,tag:7,facing:e=>R(M(e,l))}])}()),knob:this.upload(function(){let e=Array.from({length:144},(e,t)=>t/144),t=(e,t,a)=>{let r=e*Math.PI*2;return[t*Math.cos(r),a,t*Math.sin(r)]},a=e=>R([e[0],0,e[2]]);return P([{at:(e,a)=>t(e,.30529999999999996,-.03+.05*a),us:e,vs:[0,1],wrap:!0,tag:11,facing:a},{at:(e,a)=>{if(a<.12){let r=a/.12*(Math.PI/2);return t(e,.355-.012*(1-Math.sin(r)),.012*(1-Math.cos(r)))}let r=(a-.12)/.88;return t(e,.355-.008*r,.012+.388*r)},us:e,vs:[0,.04,.08,.12,.5,1],wrap:!0,tag:8,facing:a},{at:(e,a)=>t(e,.347-.03*a,.4+.03*a),us:e,vs:[0,1],wrap:!0,tag:9,facing:e=>R([e[0],1.2,e[2]])},{at:(e,a)=>{let r=.31699999999999995*(1-a),o=r/.31699999999999995;return t(e,r,.43-.006*(1-o*o))},us:e,vs:F(0,1,10),wrap:!0,tag:10,facing:()=>[0,1,0]}])}()),ground:this.upload(function(){let e=-g.halfWidth-1.6,t=g.halfWidth+1.6,a=g.back-1.4,r=g.front+1.8;return{vertices:new Float32Array([e,0,a,0,1,0,0,t,0,a,0,1,0,0,e,0,r,0,1,0,0,t,0,r,0,1,0,0]),indices:new Uint32Array([0,1,2,1,3,2])}}())};const t=e.createVertexArray(),a=e.createTexture();if(!t||!a)throw Error("macropad: could not allocate GL objects");this.empty=t,this.atlas=a,e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]))}upload(e){let t=this.gl,a=t.createVertexArray(),r=t.createBuffer(),o=t.createBuffer();if(!a||!r||!o)throw Error("macropad: could not allocate a mesh");return t.bindVertexArray(a),t.bindBuffer(t.ARRAY_BUFFER,r),t.bufferData(t.ARRAY_BUFFER,e.vertices,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,3,t.FLOAT,!1,28,0),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,3,t.FLOAT,!1,28,12),t.enableVertexAttribArray(2),t.vertexAttribPointer(2,1,t.FLOAT,!1,28,24),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,o),t.bufferData(t.ELEMENT_ARRAY_BUFFER,e.indices,t.STATIC_DRAW),t.bindVertexArray(null),{vao:a,vbo:r,ibo:o,count:e.indices.length}}setAtlas(e){let t=this.gl;t.bindTexture(t.TEXTURE_2D,this.atlas),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),t.generateMipmap(t.TEXTURE_2D),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE);let a=t.getExtension("EXT_texture_filter_anisotropic");a&&t.texParameterf(t.TEXTURE_2D,a.TEXTURE_MAX_ANISOTROPY_EXT,4)}target(e,t,a,r){let o,i=this.gl;if(r&&r.width===e&&r.height===t)return r;r&&this.freeTarget(r);let n=i.createTexture(),l=i.createFramebuffer();if(!n||!l)throw Error("macropad: could not allocate a render target");return i.bindTexture(i.TEXTURE_2D,n),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,e,t,0,i.RGBA,i.UNSIGNED_BYTE,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.bindFramebuffer(i.FRAMEBUFFER,l),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,n,0),a&&(o=i.createRenderbuffer()??void 0)&&(i.bindRenderbuffer(i.RENDERBUFFER,o),i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_COMPONENT16,e,t),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,o)),i.bindFramebuffer(i.FRAMEBUFFER,null),{fbo:l,tex:n,width:e,height:t,depth:o}}freeTarget(e){let t=this.gl;t.deleteFramebuffer(e.fbo),t.deleteTexture(e.tex),e.depth&&t.deleteRenderbuffer(e.depth)}ensureTargets(e,t){let a=Math.max(1,Math.round(e/4)),r=Math.max(1,Math.round(t/4)),o=Math.max(1,Math.round(e/8)),i=Math.max(1,Math.round(t/8)),n=this.targets;this.targets={glow:this.target(a,r,!0,n?.glow),a:this.target(a,r,!1,n?.a),b:this.target(a,r,!1,n?.b),c:this.target(o,i,!1,n?.c),d:this.target(o,i,!1,n?.d)}}setShared(e,t){let a=this.gl;a.uniformMatrix4fv(e("uViewProj"),!1,t.viewProj),a.uniform4f(e("uFit"),t.fit[0],t.fit[1],t.fit[2],t.fit[3]),a.uniform3fv(e("uCamPos"),t.camPos),a.uniform3fv(e("uGlow"),t.glow),a.uniform1fv(e("uPress"),t.travel),a.uniform4fv(e("uRipple"),t.ripples),a.uniform3fv(e("uRippleColor"),t.rippleColors),a.uniform3fv(e("uKnobLight"),t.knobLight),a.uniform1f(e("uGlowGain"),t.look.glowGain)}setLook(e,t){let a=this.gl,r=t.look;a.uniform3fv(e("uKeyDir"),r.keyDir),a.uniform3fv(e("uKeyColor"),r.keyColor),a.uniform3fv(e("uSky"),r.sky),a.uniform3fv(e("uHorizon"),r.horizon),a.uniform3fv(e("uFloor"),r.floor),a.uniform3fv(e("uSoftbox"),r.softbox),a.uniform3fv(e("uStrip"),r.strip),a.uniform1f(e("uAmbient"),r.ambient),a.uniform1f(e("uExposure"),r.exposure),a.uniform3fv(e("uCaseAlbedo"),r.caseAlbedo),a.uniform3fv(e("uCaseF0"),r.caseF0),a.uniform1f(e("uCaseRough"),r.caseRough),a.uniform1f(e("uCaseMetal"),r.caseMetal),a.uniform3fv(e("uEdgeF0"),r.edgeF0),a.uniform3fv(e("uPlateAlbedo"),r.plateAlbedo),a.uniform3fv(e("uCapAlbedo"),t.caps.albedo),a.uniform3fv(e("uLegend"),t.caps.legend),a.uniform3fv(e("uEngrave"),r.engrave),a.uniform3fv(e("uKnobF0"),r.knobF0),a.uniform2f(e("uShadow"),r.shadow[0],r.shadow[1]),a.uniform1f(e("uDetail"),t.detail),a.uniform1i(e("uAtlas"),0)}drawMesh(e){let t=this.gl;t.bindVertexArray(e.vao),t.drawElements(t.TRIANGLES,e.count,t.UNSIGNED_INT,0)}translate(e,t,a){let r=this.model;return r.set(ef),r[12]=e,r[13]=t,r[14]=a,r}knobModel(e){let t=this.model,a=Math.cos(-e),r=Math.sin(-e);return t.set(ef),t[0]=a,t[2]=-r,t[8]=r,t[10]=a,t[12]=1,t[13]=E,t[14]=-2.09,t}drawPad(e,t){let a=this.gl;for(let r of(a.uniformMatrix4fv(e("uModel"),!1,this.translate(0,0,0)),a.uniform1i(e("uKey"),-1),a.uniform1f(e("uTravel"),0),this.drawMesh(this.meshes.case),a.uniformMatrix4fv(e("uModel"),!1,this.knobModel(t.knobAngle)),this.drawMesh(this.meshes.knob),A)){let o=t.travel[r.index];a.uniformMatrix4fv(e("uModel"),!1,this.translate(r.x,.68-.2*o,r.z)),a.uniform1i(e("uKey"),r.index),a.uniform1f(e("uTravel"),o),this.drawMesh(this.meshes.cap)}}draw(e){let t=this.gl,a=t.drawingBufferWidth,r=t.drawingBufferHeight;t.disable(t.CULL_FACE),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.atlas);let o=e.bloom&&e.look.bloom>.001;if(o){this.ensureTargets(a,r);let o=this.targets;t.bindFramebuffer(t.FRAMEBUFFER,o.glow.fbo),t.viewport(0,0,o.glow.width,o.glow.height),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.depthMask(!0),t.disable(t.BLEND),t.useProgram(this.emissive),this.setShared(this.uEmissive,e),this.drawPad(this.uEmissive,e),t.disable(t.DEPTH_TEST),t.useProgram(this.blur),t.bindVertexArray(this.empty),t.uniform1i(this.uBlur("uSource"),0);let i=(e,a,r,o)=>{t.bindFramebuffer(t.FRAMEBUFFER,a.fbo),t.viewport(0,0,a.width,a.height),t.bindTexture(t.TEXTURE_2D,e.tex),t.uniform2f(this.uBlur("uStep"),r/e.width,o/e.height),t.drawArrays(t.TRIANGLES,0,3)};i(o.glow,o.a,1,0),i(o.a,o.b,0,1),i(o.b,o.c,1.5,0),i(o.c,o.d,0,1.5),t.bindFramebuffer(t.FRAMEBUFFER,null),t.bindTexture(t.TEXTURE_2D,this.atlas)}if(t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,a,r),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT|t.DEPTH_BUFFER_BIT),t.useProgram(this.main),this.setShared(this.uMain,e),this.setLook(this.uMain,e),t.disable(t.DEPTH_TEST),t.enable(t.BLEND),t.blendFunc(t.ONE,t.ONE_MINUS_SRC_ALPHA),t.uniformMatrix4fv(this.uMain("uModel"),!1,this.translate(0,0,0)),t.uniform1i(this.uMain("uKey"),-1),this.drawMesh(this.meshes.ground),t.disable(t.BLEND),t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t.depthMask(!0),this.drawPad(this.uMain,e),t.disable(t.DEPTH_TEST),o){let a=this.targets;t.useProgram(this.composite),t.bindVertexArray(this.empty),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,a.b.tex),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,a.d.tex),t.uniform1i(this.uComposite("uNear"),0),t.uniform1i(this.uComposite("uFar"),1),t.uniform1f(this.uComposite("uStrength"),e.look.bloom),t.enable(t.BLEND),t.blendFuncSeparate(t.ONE,t.ONE,t.ZERO,t.ONE),t.drawArrays(t.TRIANGLES,0,3),t.disable(t.BLEND),t.activeTexture(t.TEXTURE0)}t.bindVertexArray(null)}dispose(){let e=this.gl;for(let t of Object.values(this.meshes))e.deleteVertexArray(t.vao),e.deleteBuffer(t.vbo),e.deleteBuffer(t.ibo);this.targets&&Object.values(this.targets).forEach(e=>this.freeTarget(e)),this.targets=null,e.deleteVertexArray(this.empty),e.deleteTexture(this.atlas),e.deleteProgram(this.main),e.deleteProgram(this.emissive),e.deleteProgram(this.blur),e.deleteProgram(this.composite)}}function ep(){if((0,r.isMuted)())return null;let e=(0,r.ensureAudio)();return e&&"closed"!==e.ctx.state?e:null}function em(e,t,a){if("function"!=typeof e.createStereoPanner)return t;let r=e.createStereoPanner();return r.pan.value=Math.max(-1,Math.min(1,a)),r.connect(t),r}let eg=Array.from({length:9},(e,t)=>{let a=t%3,r=Math.floor(t/3),o=Math.abs(a-1)+Math.abs(r-1);return{body:205-14*o+(r-1)*5,hollow:470-30*o+(a-1)*12,band:1900-170*o+(a-1)*60,level:1-.04*o}}),ev=e=>1+(2*Math.random()-1)*e;function ex(e,t,a,o,i,n,l,s){let{ctx:h}=e,u=h.createBufferSource();u.buffer=(0,r.noiseBuffer)(h,.5);let c=h.createBiquadFilter();c.type=o,c.frequency.value=i,c.Q.value=n;let f=h.createGain();f.gain.setValueAtTime(0,t),f.gain.linearRampToValueAtTime(l,t+.0012),f.gain.exponentialRampToValueAtTime(1e-4,t+s),u.connect(c).connect(f).connect(a),u.start(t,.4*Math.random(),s+.03)}function eb(e,t,a,r,o,i,n,l,s="sine"){let{ctx:h}=e,u=h.createOscillator();u.type=s,u.frequency.setValueAtTime(r*o,t),u.frequency.exponentialRampToValueAtTime(r,t+i);let c=h.createGain();c.gain.setValueAtTime(0,t),c.gain.linearRampToValueAtTime(n,t+.002),c.gain.exponentialRampToValueAtTime(1e-4,t+l),u.connect(c).connect(a),u.start(t),u.stop(t+l+.02)}function ew(e,t=0){let a=ep();if(!a)return;let r=a.ctx.currentTime+.002+t,o=em(a.ctx,a.output,.32);ex(a,r,o,"highpass",2600*ev(.08),.8,.09,.007),eb(a,r,o,(e>0?2350:2150)*ev(.02),1,.001,.026,.012)}let eT={target:[0,.38,v+.06],distance:16,fov:21*Math.PI/180,yaw:.2,pitch:.98};class ey{width=1;height=1;proj=h();view=h();viewProj=h();camPos=[0,0,0];fit=[1,1,0,0];bounds=(function(){let e=[],{halfWidth:t,front:a,back:r,height:o}=g;for(let i of[-t,t])for(let t of[r,a])e.push([i,0,t],[i,o,t]);let i=.68+y.height;for(let t of A)e.push([t.x-y.base,i,t.z-y.base],[t.x+y.base,i,t.z+y.base]);for(let t=0;t<8;t++){let a=t/8*Math.PI*2;e.push([1+.355*Math.cos(a),E+.43,-2.09+.355*Math.sin(a)])}return e})();matrices(e,t,a){var r,o,i,n,l;let s,h,u=(r=eT.target,o=eT.distance,s=Math.cos(t),[r[0]+o*s*Math.sin(e),r[1]+o*Math.sin(t),r[2]+o*s*Math.cos(e)]);return i=this.proj,n=eT.fov,l=this.width/this.height,h=1/Math.tan(n/2),i.fill(0),i[0]=h/l,i[5]=h,i[10]=-1.0338983050847457,i[11]=-1,i[14]=-2.0338983050847457,!function(e,t,a,r=[0,1,0]){let o=t[0]-a[0],i=t[1]-a[1],n=t[2]-a[2],l=Math.hypot(o,i,n)||1;o/=l,i/=l,n/=l;let s=r[1]*n-r[2]*i,h=r[2]*o-r[0]*n,u=r[0]*i-r[1]*o;l=Math.hypot(s,h,u)||1,s/=l,h/=l;let c=i*(u/=l)-n*h,f=n*s-o*u,d=o*h-i*s;e[0]=s,e[1]=c,e[2]=o,e[3]=0,e[4]=h,e[5]=f,e[6]=i,e[7]=0,e[8]=u,e[9]=d,e[10]=n,e[11]=0,e[12]=-(s*t[0]+h*t[1]+u*t[2]),e[13]=-(c*t[0]+f*t[1]+d*t[2]),e[14]=-(o*t[0]+i*t[1]+n*t[2]),e[15]=1}(this.view,u,eT.target),!function(e,t,a){let r=new Float32Array(16);for(let e=0;e<4;e++)for(let o=0;o<4;o++){let i=0;for(let r=0;r<4;r++)i+=t[4*r+o]*a[4*e+r];r[4*e+o]=i}e.set(r)}(a,this.proj,this.view),u}resize(e,t,a,r=1/0){this.width=Math.max(1,e),this.height=Math.max(1,t);let o=h();this.matrices(eT.yaw,eT.pitch,o);let i=1/0,n=1/0,l=-1/0,s=-1/0;for(let e of this.bounds){let t=u(o,e[0],e[1],e[2]),a=(t[0]/t[3]*.5+.5)*this.width,r=(.5-t[1]/t[3]*.5)*this.height;i=Math.min(i,a),l=Math.max(l,a),n=Math.min(n,r),s=Math.max(s,r)}let c=Math.min(Math.max(1,a.x1-a.x0)/Math.max(1,l-i),Math.max(1,Math.min(a.y1-a.y0,r))/Math.max(1,s-n)),f=this.width,d=this.height,p=(a.x0+a.x1)/2,m=(a.y0+a.y1)/2,g=(i+l)/2,v=(n+s)/2;this.fit=[c,c,(p-f/2-(g-f/2)*c)/(f/2),-(m-d/2-(v-d/2)*c)/(d/2)]}update(e,t){this.camPos=this.matrices(eT.yaw+e,eT.pitch+t,this.viewProj)}toScreen(e,t,a){let r=u(this.viewProj,e,t,a),o=r[0]/r[3]*this.fit[0]+this.fit[2],i=r[1]/r[3]*this.fit[1]+this.fit[3];return[(.5*o+.5)*this.width,(.5-.5*i)*this.height]}capHull(e,t){let a=A[e],r=.68-.2*t,o=r+y.height,i=[];for(let[e,t]of[[-1,-1],[1,-1],[1,1],[-1,1]])i.push(this.toScreen(a.x+e*y.base,r+.02,a.z+t*y.base)),i.push(this.toScreen(a.x+e*y.topX,o,a.z+y.topShift+t*y.topZ));return f(i)}capTop(e,t){let a=A[e],r=.68-.2*t+y.height;return[this.toScreen(a.x-y.topX,r,a.z+y.topShift-y.topZ),this.toScreen(a.x+y.topX,r,a.z+y.topShift-y.topZ),this.toScreen(a.x+y.topX,r,a.z+y.topShift+y.topZ),this.toScreen(a.x-y.topX,r,a.z+y.topShift+y.topZ)]}knobHull(){let e=[];for(let t=0;t<16;t++){let a=t/16*Math.PI*2,r=1+.355*Math.cos(a),o=-2.09+.355*Math.sin(a);e.push(this.toScreen(r,E,o)),e.push(this.toScreen(r,E+.43,o))}return f(e)}knobCentre(){return this.toScreen(1,E+.43,-2.09)}}function eE(e){let t=1/0,a=1/0,r=-1/0,o=-1/0;for(let[i,n]of e)t=Math.min(t,i),a=Math.min(a,n),r=Math.max(r,i),o=Math.max(o,n);return{x:t,y:a,w:r-t,h:o-a}}let eA=es.map(e=>({value:e.id,label:e.label,swatch:`linear-gradient(180deg, color-mix(in oklab, ${e.cap} 82%, #fff) 0%, ${e.cap} 55%, color-mix(in oklab, ${e.cap} 88%, #000) 100%)`})),eM=e=>(A[e].col-1)*.38;function e_(e){let t=/^(?:Digit|Numpad)([1-9])$/.exec(e.code??"");return t?Number(t[1])-1:/^[1-9]$/.test(e.key)?Number(e.key)-1:-1}let ek=e=>V(60+15*e);function eR({stage:e,theme:a}){let r="dark"===a,o=m(W(60)),i=2*g.halfWidth,n=g.front-g.back,l=(e,t)=>`${e/t*100}%`;return(0,t.jsx)("div",{role:e?"img":void 0,"aria-label":e?"A nine-key macropad with a knob":void 0,"aria-hidden":!e||void 0,className:"absolute inset-0 grid place-items-center",children:(0,t.jsxs)("div",{className:"relative h-[min(72%,420px)] max-w-[78%] rounded-[10%/8%] [container-type:size]",style:{aspectRatio:`${i} / ${n}`,background:r?"linear-gradient(#3a3b40,#26272b)":"linear-gradient(#e2e3e6,#c3c5c9)",boxShadow:`0 18px 34px -18px rgb(0 0 0 / ${r?.7:.45}), inset 0 1px 0 rgb(255 255 255 / ${r?.18:.6})`},children:[(0,t.jsx)("span",{className:"absolute rounded-full",style:{left:l(g.halfWidth+1-.355,i),top:l(-2.09-g.back-.355,n),width:l(.71,i),aspectRatio:"1",background:r?"radial-gradient(circle at 40% 35%, #5a5b60, #2a2b2f)":"radial-gradient(circle at 40% 35%, #fbfbfc, #b9bbc0)",boxShadow:"0 3px 8px rgb(0 0 0 / 0.3)"}}),A.map(e=>(0,t.jsx)("span",{className:"absolute grid place-items-center rounded-[16%] text-[7cqw] font-medium",style:{left:l(g.halfWidth+e.x-y.base,i),top:l(e.z-g.back-y.base,n),width:l(2*y.base,i),height:l(2*y.base,n),background:r?"#2f3034":"#ece9e3",color:r?"#c4c4c6":"#3b3b3d",boxShadow:`0 0 0 1px rgb(0 0 0 / 0.08), 0 3px 0 ${r?"#1d1e21":"#cbc8c1"}, 0 4px 14px -2px ${o}`},children:e.index+1},e.index))]})})}e.s(["default",0,function({mode:e,active:l,reducedMotion:h,theme:u}){let f="stage"===e,[d]=(0,a.useState)(()=>{let e=new J;return h&&(e.accent[4]=.55,[1,3,5,7].forEach(t=>e.accent[t]=.1)),e}),[p]=(0,a.useState)(()=>new et),[g]=(0,a.useState)(()=>new ey),v=(0,a.useRef)(null),x=(0,a.useRef)(null),b=(0,a.useRef)(null),w=(0,a.useRef)(null),T=(0,a.useRef)([]),y=(0,a.useRef)(null),E=(0,a.useId)(),M=(0,o.useFinePointer)(),[_,k]=(0,a.useState)(null),R=_??eh[u],[P,S]=(0,a.useState)(0),[C,F]=(0,a.useState)(""),[L,D]=(0,a.useState)(!1),[z,N]=(0,a.useState)(4),B=(0,o.useLatest)({reducedMotion:h,theme:u,caps:R,stage:f}),G=(0,a.useRef)({yaw:0,yawV:0,pitch:0,pitchV:0,aimYaw:0,aimPitch:0,night:+("dark"===u),caps:eu(eh[u]),fitDirty:!0,acc:0,idle:0,welcomed:!1,hover:-1,overlay:"",frame:{viewProj:g.viewProj,camPos:[0,0,0],fit:g.fit,look:el(+("dark"===u)),caps:eu(eh[u]),travel:new Float32Array(9),glow:new Float32Array(27),ripples:new Float32Array(32),rippleColors:new Float32Array(24),knobAngle:0,knobLight:[0,0,0],detail:f?1:.35,bloom:!0}}),I=(0,a.useCallback)(()=>{let e,{width:t,height:a}=K.current;if(t<2||a<2)return;let r=1/0;if(B.current.stage){let o=b.current,i=a-16,n=w.current?.querySelector("[data-lab-controls]");if(o&&n){let e=n.getBoundingClientRect().top-o.getBoundingClientRect().top;e>0&&(i=Math.min(i,e))}let l=t<520,s=l?18:40;e={x0:s,y0:l?24:44,x1:t-s,y1:i-(l?18:30)},r=520}else e={x0:.15*t,y0:.13*a,x1:.85*t,y1:.89*a};g.resize(t,a,e,r),G.current.fitDirty=!1},[g,B]),U=(0,o.useFrame)(l,e=>{var t;let a=v.current,r=G.current,i=B.current,{width:n,height:l}=K.current;if(!a||n<2||l<2)return!1;if(!i.stage){if(r.acc+=e,r.acc<1/30-.002)return;e=Math.min(.1,r.acc),r.acc=0}r.fitDirty&&I();let s=i.reducedMotion;i.stage?r.welcomed||s||!(d.time>.45)||(r.welcomed=!0,d.pulse(4,.95,s)):s?p.settle(d,s):p.tick(d,s);let h=d.step(e,{reduced:s,breathe:!1});i.stage||s||(h=!0),s?r.yaw=r.pitch=r.yawV=r.pitchV=0:(r.yawV+=(-48*(r.yaw-r.aimYaw)-13*r.yawV)*e,r.yaw+=r.yawV*e,r.pitchV+=(-48*(r.pitch-r.aimPitch)-13*r.pitchV)*e,r.pitch+=r.pitchV*e,(Math.abs(r.yaw-r.aimYaw)+Math.abs(r.pitch-r.aimPitch)>1e-4||Math.abs(r.yawV)+Math.abs(r.pitchV)>.001)&&(h=!0)),g.update(r.yaw,r.pitch);let u=+("dark"===i.theme);r.night=s?u:(0,o.damp)(r.night,u,7,e),.002>Math.abs(r.night-u)?r.night=u:h=!0;let c=eu(i.caps),f=s?1:1-Math.exp(-(10*e));t=r.caps,r.caps={albedo:en(t.albedo,c.albedo,f),legend:en(t.legend,c.legend,f)},Math.abs(r.caps.albedo[0]-c.albedo[0])+Math.abs(r.caps.albedo[2]-c.albedo[2])>.002?h=!0:r.caps=c;let m=r.frame,x=el(r.night);m.look=i.stage?x:{...x,glowGain:1.25*x.glowGain,shadow:[1.25*x.shadow[0],1.2*x.shadow[1]]},m.caps=r.caps,m.camPos=g.camPos,m.fit=g.fit,m.knobAngle=-Math.PI/2+d.angle,d.fill({travel:m.travel,glow:m.glow,ripples:m.ripples,rippleColors:m.rippleColors,knobLight:m.knobLight,breathe:i.stage,reduced:s,gain:1});let b=i.stage&&!s&&!h;if(b){if(r.idle+=e,r.idle<1/24)return;r.idle=0}if(a.draw(m),(()=>{if(!B.current.stage)return;let e="",t=A.map(t=>{let a=eE(g.capHull(t.index,d.switches[t.index].x));return e+=`${Math.round(a.x)},${Math.round(a.y)},${Math.round(a.w)},${Math.round(a.h)};`,a}),a=eE(g.knobHull());if((e+=`${Math.round(a.x)},${Math.round(a.y)},${Math.round(a.w)}`)===G.current.overlay)return;G.current.overlay=e,t.forEach((e,t)=>{let a=T.current[t];a&&(a.style.transform=`translate(${e.x.toFixed(1)}px, ${e.y.toFixed(1)}px)`,a.style.width=`${e.w.toFixed(1)}px`,a.style.height=`${e.h.toFixed(1)}px`)});let r=y.current;r&&(r.style.transform=`translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`,r.style.width=`${a.w.toFixed(1)}px`,r.style.height=`${a.h.toFixed(1)}px`)})(),!h&&!b)return!1}),{canvasRef:O,sizeRef:K,supported:H}=(0,o.useWebGL2)({mode:e,maxDpr:f?2:1.5,attributes:{alpha:!0,antialias:!0,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new ed(e)}catch(e){console.error(e);return}return x.current||(x.current=s(void 0,f?500:640)),t.setAtlas(x.current),v.current=t,U(),()=>{t?.dispose(),v.current=null}},onResize:()=>{G.current.fitDirty=!0,U()}});(0,a.useEffect)(()=>{let e=!0;return(function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!e||!document.fonts)return Promise.resolve();return document.fonts.load(`500 64px ${e}`).then(()=>void 0).catch(()=>void 0)}catch{return Promise.resolve()}})().then(()=>{e&&(x.current=s(x.current??void 0,f?500:640),v.current?.setAtlas(x.current),U())}),()=>{e=!1}},[U,f]),(0,a.useEffect)(()=>{if(!f)return;let e=w.current?.querySelector("[data-lab-controls]");if(!e)return;let t=new ResizeObserver(()=>{G.current.fitDirty=!0,U()});return t.observe(e),()=>t.disconnect()},[f,U]),(0,a.useEffect)(()=>{h?(d.accent[4]=.55,[1,3,5,7].forEach(e=>d.accent[e]=.1)):d.accent.fill(0),U()},[u,R,h,d,U]);let X=(0,a.useCallback)(e=>{let t=B.current.reducedMotion;return!!d.press(e,t)&&(B.current.stage&&function(e,t,a=.024,r=1){let o=ep();if(!o)return;let i=eg[e]??eg[4],n=o.ctx.currentTime+a,l=em(o.ctx,o.output,t),s=i.level*r*ev(.08),h=i.body*ev(.035);eb(o,n,l,h,1.5,.028,.2*s,.09),eb(o,n,l,2.38*h,1.2,.02,.04*s,.04,"triangle"),ex(o,n,l,"bandpass",i.hollow*ev(.05),3.2,.62*s,.055),ex(o,n,l,"bandpass",i.band*ev(.08),1.15,.17*s,.024),ex(o,n,l,"lowpass",620*ev(.1),.7,.24*s,.05),ex(o,n,l,"highpass",4200,.7,.04*s,.006)}(e,eM(e),t?.004:q),D(!0),U(),!0)},[d,B,U]),V=(0,a.useCallback)(e=>{if(!d.isDown(e))return;let t=B.current.reducedMotion,a=d.switches[e],r=a.x<.92&&!t?Math.max(0,q*(1-a.x)):0;d.release(e,t),B.current.stage&&function(e,t,a=.035){let r=ep();if(!r)return;let o=eg[e]??eg[4],i=r.ctx.currentTime+a,n=em(r.ctx,r.output,t);ex(r,i,n,"bandpass",1.55*o.band*ev(.1),1.6,.12*o.level,.016),ex(r,i,n,"bandpass",1.35*o.hollow*ev(.05),3,.22*o.level,.03),eb(r,i,n,2.1*o.body*ev(.04),1.25,.012,.05*o.level,.035)}(e,eM(e),(t?.01:Z)+r),U()},[d,B,U]),Y=(0,a.useRef)(0),Q=(0,a.useCallback)((e,t=!1)=>{if(!e)return;let a=B.current.reducedMotion;if(d.turn(e,a),B.current.stage&&!t){let t=Math.min(4,Math.abs(e));for(let a=0;a<t;a++)ew(Math.sign(e),.034*a)}S(d.detent),D(!0),window.clearTimeout(Y.current),Y.current=window.setTimeout(()=>F(`Glow: ${j(d.hue)}`),350),U()},[d,B,U]);(0,a.useEffect)(()=>()=>window.clearTimeout(Y.current),[]);let ee=(e,t)=>{if(c(g.knobHull(),e,t))return"knob";for(let a of A)if(c(g.capTop(a.index,d.switches[a.index].x),e,t))return a.index;for(let a of A)if(c(g.capHull(a.index,d.switches[a.index].x),e,t))return a.index;return null},ea=e=>{let t=b.current?.getBoundingClientRect();return t?[e.clientX-t.left,e.clientY-t.top]:[0,0]},er=(0,a.useRef)(new Map),eo=(e,t)=>{let[a,r]=g.knobCentre();return{angle:Math.atan2(t-r,e-a),r:Math.hypot(e-a,t-r)}},ei=e=>{let[t,a]=ea(e),r=G.current,{width:o,height:i}=K.current;"mouse"===e.pointerType&&o&&i&&!B.current.reducedMotion&&(r.aimYaw=(t/o*2-1)*(f?.075:.06),r.aimPitch=(a/i*2-1)*(f?-.045:-.035),U());let n=er.current.get(e.pointerId);if(!f){if("mouse"!==e.pointerType)return;let o=ee(t,a),i="number"==typeof o?o:-1;i!==r.hover&&(r.hover=i,i>=0&&p.poke(d,i,B.current.reducedMotion),U());return}if(!n)return;if("keys"===n.kind){let e=ee(t,a),r="number"==typeof e?e:-1;if(r===n.over)return;n.over=r,n.key>=0&&V(n.key),n.key=r>=0&&X(r)?r:-1;return}let{angle:l,r:s}=eo(t,a),h=l-n.last;h>Math.PI&&(h-=2*Math.PI),h<-Math.PI&&(h+=2*Math.PI),n.last=l;let u=Math.min(1,Math.max(0,(s-6)/16));n.raw+=h*u+(1-u)*(e.movementX||0)*.02,n.travelled+=Math.abs(h)*Math.max(s,8);let c=d.dragTo(n.raw,B.current.reducedMotion);if(c){for(let e=0;e<Math.min(3,Math.abs(c));e++)ew(Math.sign(c),.03*e);S(d.detent),D(!0),window.clearTimeout(Y.current),Y.current=window.setTimeout(()=>F(`Glow: ${j(d.hue)}`),350)}U()},ec=e=>{let t=er.current.get(e.pointerId);if(t){if(er.current.delete(e.pointerId),"keys"===t.kind){t.key>=0&&V(t.key);return}b.current?.removeAttribute("data-grabbing"),d.endDrag(),"pointerup"===e.type&&t.travelled<5&&performance.now()-t.at<350&&Q(1),U()}},ef=()=>{let e=G.current;e.aimYaw=0,e.aimPitch=0,e.hover=-1,U()};(0,a.useEffect)(()=>{if(!f)return;let e=y.current;if(!e)return;let t=0,a=0,o=e=>{e.preventDefault(),(0,r.ensureAudio)();let o=performance.now();o-a>220&&(t=0),a=o;let i=1===e.deltaMode?1:2===e.deltaMode?3:1/40,n=(t+=(Math.abs(e.deltaY)>Math.abs(e.deltaX)?-e.deltaY:e.deltaX)*i)>0?Math.floor(t):Math.ceil(t);n&&(t-=n,Q(Math.max(-3,Math.min(3,n))))};return e.addEventListener("wheel",o,{passive:!1}),()=>e.removeEventListener("wheel",o)},[f,Q]),(0,a.useEffect)(()=>{if(!f||!l)return;let e=new Set,t=t=>{let a;if(t.defaultPrevented||t.ctrlKey||t.metaKey||t.altKey||(a=t.target)instanceof HTMLElement&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))||document.querySelector("[role='dialog'][data-open]"))return;let o=e_(t);o<0||(t.preventDefault(),t.repeat||e.has(o)||((0,r.ensureAudio)(),e.add(o),X(o)))},a=t=>{let a=e_(t);!(a<0)&&e.has(a)&&(e.delete(a),V(a))},o=()=>{e.forEach(e=>V(e)),e.clear()};return window.addEventListener("keydown",t),window.addEventListener("keyup",a),window.addEventListener("blur",o),()=>{window.removeEventListener("keydown",t),window.removeEventListener("keyup",a),window.removeEventListener("blur",o),o()}},[f,l,X,V]),(0,a.useEffect)(()=>{l||(A.forEach(e=>d.release(e.index,!0)),er.current.clear(),b.current?.removeAttribute("data-grabbing"),d.endDrag())},[l,d]);let eT=e=>t=>{let a={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[t.key];if(a){if("keydown"!==t.type)return;t.preventDefault(),t.stopPropagation();let r=Math.min(2,Math.max(0,e%3+a[0])),o=3*Math.min(2,Math.max(0,Math.floor(e/3)+a[1]))+r;N(o),T.current[o]?.focus();return}if("Home"===t.key||"End"===t.key){if("keydown"!==t.type)return;t.preventDefault();let e=8*("Home"!==t.key);N(e),T.current[e]?.focus();return}if(" "===t.key||"Enter"===t.key)if(t.preventDefault(),t.stopPropagation(),"keydown"===t.type){if(t.repeat)return;(0,r.ensureAudio)(),X(e)}else V(e)};if(!1===H)return(0,t.jsx)(eR,{stage:f,theme:u});if(!f)return(0,t.jsx)("div",{className:"absolute inset-0",onPointerMove:ei,onPointerLeave:ef,children:(0,t.jsx)("canvas",{ref:O,"aria-hidden":"true",className:"absolute inset-0 block size-full"})});let eP=ek(P),eS=j(eP),eC=m(W(eP));return(0,t.jsxs)("div",{ref:b,className:"absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[grabbing]:cursor-grabbing data-[grabbing]:**:cursor-grabbing",style:{touchAction:"pan-y"},onContextMenu:e=>{e.target.closest("[data-lab-controls]")||e.preventDefault()},onPointerDown:e=>{if(!f||e.button>0||er.current.has(e.pointerId)||e.target.closest("[data-lab-controls]"))return;(0,r.ensureAudio)();let[t,a]=ea(e),o=ee(t,a);if(null!==o){e.preventDefault();try{b.current?.setPointerCapture(e.pointerId)}catch{}if("knob"===o){if([...er.current.values()].some(e=>"knob"===e.kind))return;let{angle:r}=eo(t,a);d.dragging=!0,er.current.set(e.pointerId,{kind:"knob",id:e.pointerId,raw:d.detent*$,last:r,startX:t,startY:a,at:performance.now(),travelled:0}),b.current?.setAttribute("data-grabbing",""),U();return}er.current.set(e.pointerId,{kind:"keys",id:e.pointerId,key:X(o)?o:-1,over:o})}},onPointerMove:ei,onPointerUp:ec,onPointerCancel:ec,onLostPointerCapture:ec,onPointerLeave:ef,children:[(0,t.jsx)("canvas",{ref:O,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),(0,t.jsx)("div",{role:"group","aria-label":"Macropad keys","aria-describedby":E,children:A.map(e=>(0,t.jsx)("button",{ref:t=>{T.current[e.index]=t},type:"button","aria-label":`Key ${e.index+1}`,"aria-keyshortcuts":String(e.index+1),tabIndex:e.index===z?0:-1,onFocus:()=>N(e.index),onKeyDown:eT(e.index),onKeyUp:eT(e.index),onBlur:()=>V(e.index),onClick:t=>{0!==t.detail||d.isDown(e.index)||(X(e.index),window.setTimeout(()=>V(e.index),120))},className:"absolute top-0 left-0 cursor-pointer rounded-[18px] outline-none [touch-action:none] focus-visible:shadow-[0_0_0_2px_var(--foreground),0_0_0_5px_color-mix(in_oklab,var(--background)_70%,transparent)]"},e.index))}),(0,t.jsx)("div",{ref:y,role:"slider",tabIndex:0,"aria-label":"Glow hue knob","aria-describedby":E,"aria-valuemin":0,"aria-valuemax":345,"aria-valuenow":eP,"aria-valuetext":`${eS}, ${eP} degrees`,onKeyDown:e=>{let t={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,PageUp:3,PageDown:-3}[e.key];if("Home"===e.key||"End"===e.key){let a=(345*("Home"!==e.key)-ek(d.detent))/15;a>12&&(a-=24),a<-12&&(a+=24),t=Math.round(a)}void 0!==t&&(e.preventDefault(),e.stopPropagation(),(0,r.ensureAudio)(),Q(t))},className:"absolute top-0 left-0 cursor-grab rounded-full outline-none [touch-action:none] focus-visible:shadow-[0_0_0_2px_var(--foreground),0_0_0_5px_color-mix(in_oklab,var(--background)_70%,transparent)]"}),(0,t.jsx)("p",{id:E,className:"sr-only",children:"Press the digits 1 to 9 to play the keys, or focus the keys, move between them with the arrow keys and press Space or Enter. The knob sets the colour of the light: focus it and use the arrow keys, or drag it, scroll over it or tap it."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:C}),(0,t.jsx)("div",{ref:w,className:"contents",children:(0,t.jsxs)(n.StageControls,{placement:"bottom",children:[(0,t.jsxs)(n.TrayRow,{children:[(0,t.jsx)(n.Tray,{label:"Keycaps",children:(0,t.jsx)(n.Swatches,{label:"Keycaps",options:eA,value:R,onChange:e=>{(0,r.ensureAudio)(),k(e),D(!0),F(es.find(t=>t.id===e)?.label??""),d.pulse(4,.6,B.current.reducedMotion),U()}})}),(0,t.jsxs)(n.Tray,{label:"Glow",children:[(0,t.jsx)(n.IconButton,{label:"Turn the knob back a notch",onClick:()=>((0,r.ensureAudio)(),Q(-1)),children:(0,t.jsx)(i.ChevronLeft,{size:14})}),(0,t.jsxs)("span",{"aria-hidden":"true",className:"flex h-10 min-w-[104px] items-center justify-center gap-2 px-1 text-[13px] text-primary capitalize",children:[(0,t.jsx)("span",{className:"size-2.5 shrink-0 rounded-full transition-[background-color,box-shadow] duration-300 ease-out",style:{backgroundColor:eC,boxShadow:`0 0 0 1px rgb(0 0 0 / 0.08), 0 0 10px 1px ${eC}`}}),eS]}),(0,t.jsx)(n.IconButton,{label:"Turn the knob on a notch",onClick:()=>((0,r.ensureAudio)(),Q(1)),children:(0,t.jsx)(i.ChevronRightSmall,{size:14})}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.MuteButton,{})]})]}),(0,t.jsx)(n.StageHint,{className:L?"opacity-0 transition-opacity duration-700":"transition-opacity duration-700",children:M?"Click the keys or press 1–9 · drag, scroll or click the knob":"Tap the keys · turn or tap the knob"})]})})]})}],80443)},93100,function(e){e.n(e.i(80443))}]);