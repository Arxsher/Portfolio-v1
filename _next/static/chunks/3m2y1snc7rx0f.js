(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,98307,e=>{"use strict";let t,a,r,l;var o=e.i(43476),i=e.i(71645),n=e.i(16442),s=e.i(37047),c=e.i(7537),h=e.i(45219);let u=[{id:"A1",name:"Full loop",outer:146,inner:118.5,stems:[1,1,1],loud:1},{id:"A2",name:"Drums and bass",outer:116.5,inner:97,stems:[1,1,0],loud:.8},{id:"A3",name:"Drums",outer:95,inner:80,stems:[1,0,0],loud:.62},{id:"A4",name:"Keys and bass",outer:78,inner:64,stems:[0,.55,1],loud:.45}],f={x:404,y:84},p=Math.hypot(188-f.x,180-f.y),d=p+15.5,m=Math.atan2(180-f.y,188-f.x),v=91.2*Math.PI/180,g=[{rpm:33,x:437,y:322,r:6.4},{rpm:45,x:461,y:322,r:6.4}],x={x:448,y:150,r:6.5,length:19},b=200*Math.PI/180,y=156*Math.PI/180,w=[{rpm:33.333,r:158.4,dots:216},{rpm:45,r:154.4,dots:160}],A=e=>e*Math.PI*2/60,T=A(100/3),k=e=>A(33===e?100/3:45);function P(e){return m-Math.acos((0,s.clamp)((p*p+d*d-e*e)/(2*p*d),-1,1))}let R=(t=P(100),0>Math.cos((r=Math.atan2((a={x:f.x+d*Math.cos(t),y:f.y+d*Math.sin(t)}).y-180,a.x-188)+Math.PI/2)-t)&&(r+=Math.PI),Math.atan2(Math.sin(r-t),Math.cos(r-t))),M=()=>({s:{x:0,y:0},k:{x:0,y:0},h:{x:0,y:0},u:{x:0,y:0}});function S(e,t=M()){let{s:a,k:r,h:l,u:o}=t;a.x=f.x+d*Math.cos(e),a.y=f.y+d*Math.sin(e),l.x=Math.cos(e+R),l.y=Math.sin(e+R),r.x=a.x-36*l.x,r.y=a.y-36*l.y;let i=Math.hypot(r.x-f.x,r.y-f.y);return o.x=(r.x-f.x)/i,o.y=(r.y-f.y)/i,t}let E=(l=S(v),{x:f.x+172*l.u.x,y:f.y+172*l.u.y}),C=P(54),L=P(147.4);function $(e,t,a){let r=a.x-t.x,l=a.y-t.y,o=(0,s.clamp)(((e.x-t.x)*r+(e.y-t.y)*l)/(r*r+l*l));return Math.hypot(e.x-t.x-r*o,e.y-t.y-l*o)}let V=e=>238+e/.08*48,q=e=>.08*(0,s.clamp)((e-238)/48,-1,1),B=M();function H(e,t,a=0){let r,l=S(t,B),o={x:l.s.x+16*l.h.x,y:l.s.y+16*l.h.y};if($(e,l.k,o)<12+a||Math.hypot(e.x-f.x,e.y-f.y)>70&&$(e,f,l.k)<7+a)return"arm";let i={x:-l.h.y,y:l.h.x},n={x:l.s.x+15*i.x-4*l.h.x,y:l.s.y+15*i.y-4*l.h.y};if(Math.hypot(e.x-n.x,e.y-n.y)<9+a)return"arm";if(Math.abs(e.x-458)<10+a&&Math.abs(e.y-238)<54.6+a)return"pitch";if(Math.abs(e.x-37)<18+a&&Math.abs(e.y-323)<18+a)return"start";for(let t of g)if(Math.hypot(e.x-t.x,e.y-t.y)<t.r+4+a)return 33===t.rpm?"speed33":"speed45";let s=(r=b+(y-b)*1,{x:x.x+Math.cos(r)*x.length,y:x.y+Math.sin(r)*x.length});return Math.hypot(e.x-x.x,e.y-x.y)<x.r+6+a||$(e,x,s)<7+a?"cue":Math.hypot(e.x-188,e.y-180)<=152+a?"record":null}function U(e){for(let t=0;t<u.length;t++)if(e<=u[t].outer+.05&&e>=u[t].inner-.05)return t;return -1}let D=2*Math.PI,z={stiffness:240,damping:31},I={stiffness:120,damping:21},_={stiffness:160,damping:26},O={stiffness:72,damping:16},G={stiffness:46,damping:13.2},j={stiffness:120,damping:22};class N{motor=!1;speed=33;pitch=0;platterAngle=0;platterVel=0;recordAngle=0;recordVel=0;held=!1;holdTarget=0;hold=new s.Spring(0,{stiffness:2600,damping:96,precision:1e-6});coasting=!1;strobe=[0,0];arm=new s.Spring(v,{stiffness:60,damping:15,precision:1e-5});lift=new s.Spring(0,{stiffness:34,damping:11.6,precision:1e-4});onRest=!0;dragging=!1;plan=null;contact=!1;lastTurn=0;band=-1;reduced=!1;events=[];get needleDown(){return this.contact}get cueUp(){return this.lift.target>.5}get radius(){var e;return e=this.arm.value,Math.hypot(f.x+d*Math.cos(e)-188,f.y+d*Math.sin(e)-180)}get currentBand(){return this.contact?U(this.radius):-1}get rate(){return this.recordVel/T}get position(){return this.recordAngle/T}get busy(){return this.motor||Math.abs(this.platterVel)>1e-4||Math.abs(this.recordVel)>1e-4||this.held||this.dragging||null!==this.plan||!this.arm.settled||!this.lift.settled}setMotor(e){this.motor=e,this.coasting=!1,e&&this.onRest&&!this.dragging?this.cueTo(L):!e||this.onRest||!(this.lift.target>.5)||this.dragging||this.plan||this.lower()}setPitch(e){this.pitch=(0,s.clamp)(e,-.08,.08),.0012>Math.abs(this.pitch)&&(this.pitch=0)}setSpeed(e){this.speed=e}raise(){this.plan=null,this.lift.configure(z).to(1),this.onRest&&(this.onRest=!1)}lower(){if(this.plan=null,this.arm.target<=v+.035){this.arm.configure({stiffness:60,damping:15}).to(v),this.plan={phi:v,then:"rest",stage:"swing"};return}this.lift.configure(this.reduced?j:G).to(-.04)}toggleCue(){this.cueUp?this.lower():this.raise()}cueTo(e){this.dragging=!1;let t=(0,s.clamp)(e,v,C);this.plan={phi:t,then:"lower",stage:"lift"},this.onRest=!1,this.lift.configure(z).to(1)}park(){this.dragging=!1,this.plan={phi:v,then:"rest",stage:"lift"},this.lift.configure(z).to(1)}cueBand(e){let t=u[(0,s.clamp)(Math.round(e),0,u.length-1)];this.cueTo(P(t.outer-.4))}grabOffset=0;grabArm(e){this.dragging=!0,this.plan=null,this.onRest=!1,this.grabOffset=this.arm.value-e,this.lift.configure({stiffness:260,damping:32}).to(1),this.arm.configure({stiffness:420,damping:38})}dragArm(e){if(!this.dragging)return;let t=e+this.grabOffset;for(;t-this.arm.value>Math.PI;)t-=D;for(;t-this.arm.value<-Math.PI;)t+=D;this.arm.to((0,s.clamp)(t,v-.02,C))}releaseArm(){if(!this.dragging)return;this.dragging=!1,this.arm.configure({stiffness:60,damping:15});let e=this.arm.target;if(e<v+(P(150)-v)*.55)this.plan={phi:v,then:"rest",stage:"swing"},this.arm.to(v);else{let t=Math.max(e,L);this.arm.to(t),this.plan={phi:t,then:"lower",stage:"swing"},this.lift.configure({stiffness:60,damping:15.5})}}grabRecord(){this.held=!0,this.holdTarget=this.recordAngle,this.hold.set(this.recordAngle),this.hold.velocity=this.recordVel}turnRecord(e){this.held&&(this.holdTarget+=e)}releaseRecord({flick:e=!0}={}){if(this.held){if(this.held=!1,!e&&!this.motor){this.recordVel=this.platterVel;return}this.recordVel=(0,s.clamp)(this.hold.velocity,-(5*T),5*T),!this.motor&&Math.abs(this.recordVel)>Math.abs(this.platterVel)&&(this.platterVel=this.platterVel+(this.recordVel-this.platterVel)*.55,this.coasting=!0)}}step(e){if(e<=0)return;let t=((this.motor?k(this.speed)*(1+this.pitch):0)-this.platterVel)*11,a=this.motor?4.6:this.coasting?1.5:4.6;if(this.platterVel+=(0,s.clamp)(t,-a,this.motor?7.4:a)*e,!this.motor&&.002>Math.abs(this.platterVel)&&(this.platterVel=0,this.coasting=!1),this.platterAngle+=this.platterVel*e,this.held){this.hold.to(this.holdTarget);let t=this.hold.value;this.hold.step(e),this.recordAngle=this.hold.value,this.recordVel=(this.hold.value-t)/e}else{let t=1-Math.exp(-13*e);this.recordVel+=(this.platterVel-this.recordVel)*t,1e-4>Math.abs(this.recordVel)&&0===this.platterVel&&(this.recordVel=0),this.recordAngle+=this.recordVel*e}Math.abs(this.platterAngle)>64*D&&(this.platterAngle%=D);let r=this.platterVel/120;for(let t=0;t<w.length;t++){let a=D/w[t].dots,l=r-Math.round(r/a)*a;this.strobe[t]=(this.strobe[t]+120*l*e)%D}this.stepArm(e)}stepArm(e){let t=this.plan;if(t&&("lift"===t.stage?this.lift.value>.72&&(t.stage="swing",this.arm.configure(this.reduced?_:I).to(t.phi)):"swing"===t.stage?.02>Math.abs(this.arm.value-t.phi)&&.15>Math.abs(this.arm.velocity)&&("lower"===t.then?(t.stage="settle",this.lift.configure(this.reduced?j:O).to(-.04)):"rest"===t.then?(t.stage="settle",this.lift.configure(O).to(-.04)):this.plan=null):this.lift.value<=0&&("rest"===t.then&&(this.onRest=!0,this.events.push({type:"rest"})),this.plan=null)),this.contact&&!this.dragging&&!this.plan){let t=this.radius;if(0>U(t)&&t>54.65){let a=t>u[0].outer?u[0].outer-.4:t<62.3?54.6:(function(e){for(let t=0;t<u.length;t++)if(u[t].outer<e)return u[t].outer;return null}(t)??55)-.4,r=t<62.3?4.2:t>u[0].outer?16:4,l=Math.max(a,t-Math.abs(this.recordVel)/D*r*e);l!==t&&this.arm.set(P(l))}}this.arm.step(e),this.arm.value<v-.03&&this.arm.set(v-.03);let a=this.lift.value;this.lift.step(e),this.lift.value<0&&(this.lift.set(0),this.lift.target=0);let r=this.radius,l=!this.onRest&&r<=148.6&&r>=54.1&&this.arm.value>v+.05&&this.lift.value<=.001&&!this.dragging;l&&!this.contact?(this.contact=!0,this.events.push({type:"touchdown",speed:Math.abs(a-this.lift.value)/Math.max(e,.001)})):!l&&this.contact&&(this.contact=!1,this.events.push({type:"liftoff"}));let o=this.currentBand;o!==this.band&&(this.band=o,o>=0&&this.events.push({type:"band",band:o}));let i=Math.floor(this.recordAngle/D);i!==this.lastTurn&&(this.contact&&this.radius<61&&this.events.push({type:"lock"}),this.lastTurn=i)}}let K=e=>Number.isInteger(e)?`${e}.0`:`${e}`,F=(e,t)=>`vec2(${K(e)}, ${K(t)})`,X=u.map(e=>`  m += smoothstep(${K(e.inner)} - aa, ${K(e.inner)} + aa, r) * (1.0 - smoothstep(${K(e.outer)} - aa, ${K(e.outer)} + aa, r));`).join("\n"),W=u.map(e=>`  if (r < ${K(e.outer+1)}) l = ${K(e.loud)};`).reverse().join("\n"),Y=`#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform vec2 uOrigin;
uniform float uScale;
uniform float uDetail;

uniform vec3 uLight;
uniform vec3 uKey;
uniform vec3 uAmbTop;
uniform vec3 uAmbLow;
uniform vec3 uEnvHigh;
uniform vec3 uEnvLow;
uniform vec3 uBox;
uniform float uGround;
uniform vec3 uPlinth;
uniform vec3 uInk;
uniform vec3 uMetal;
uniform vec3 uDark;
uniform vec3 uVinyl;
uniform vec3 uSheen;
uniform float uTrans;
uniform vec3 uGlow;
uniform vec3 uCart;
uniform vec3 uGuard;
uniform float uExposure;
uniform float uRim;
uniform float uStrobeK;
uniform float uCap;

uniform float uRecordAngle;
uniform float uPlatterAngle;
uniform float uPlatterVel;
uniform vec2 uStrobe;
uniform float uLamp;

uniform vec2 uArmS;
uniform vec2 uArmK;
uniform vec2 uArmH;
uniform vec2 uArmU;
uniform vec2 uArmSide;
uniform float uLift;
uniform float uCue;
uniform float uStart;
uniform float uPower;
uniform vec2 uSpeedPress;
uniform vec2 uSpeedLed;
uniform float uFaderY;
uniform float uLock;
// hover (0..1, eased) per part: arm, record, start, 33, 45, cue, pitch
uniform float uHov[7];

uniform sampler2D uLabel;
uniform sampler2D uPrint;

const float PI = 3.14159265;
const float TAU = 6.2831853;
const vec2 C = ${F(188,180)};
const vec2 PIV = ${F(f.x,f.y)};
const vec2 REST = ${F(E.x,E.y)};
const vec2 CUEP = ${F(x.x,x.y)};
const vec2 LAMP = ${F(24,262)};
const vec2 STARTP = ${F(37,323)};
const vec2 SP33 = ${F(g[0].x,g[0].y)};
const vec2 SP45 = ${F(g[1].x,g[1].y)};

// heights above the plinth top (mm)
const float Z_PLATTER = 10.0;
const float Z_RECORD = 12.0;

/* ---------------------------------------------------------------- noise */

float hash11(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float vnoise1(float x) {
  float i = floor(x), t = fract(x);
  t = t * t * (3.0 - 2.0 * t);
  return mix(hash11(i), hash11(i + 1.0), t);
}
/** Value noise, periodic in x with period n. */
float vnoiseP(vec2 p, float n) {
  vec2 i = floor(p), t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  float x0 = mod(i.x, n), x1 = mod(i.x + 1.0, n);
  float a = hash21(vec2(x0, i.y)), b = hash21(vec2(x1, i.y));
  float c = hash21(vec2(x0, i.y + 1.0)), d = hash21(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}
float vnoise2(vec2 p) {
  vec2 i = floor(p), t = fract(p);
  t = t * t * (3.0 - 2.0 * t);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), t.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), t.x), t.y);
}

/* ---------------------------------------------------------------- shapes */

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
/** Oriented rounded box: centre c, unit axis u, half extents (along, across). */
float sdOBox(vec2 p, vec2 c, vec2 u, vec2 he, float r) {
  vec2 d = p - c;
  vec2 q = abs(vec2(dot(d, u), dot(d, vec2(-u.y, u.x)))) - he + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
/** Rounded rect centred at the origin: (distance, gradient). */
vec3 sdgRect(vec2 p, vec2 he, float r) {
  vec2 s = sign(p);
  vec2 q = abs(p) - he + r;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  vec2 g = (q.x > 0.0 && q.y > 0.0) ? normalize(q) : (q.x > q.y ? vec2(1, 0) : vec2(0, 1));
  return vec3(d, s * g);
}
/** Normal of a rounded edge of radius b, at signed distance d (negative inside), outward gradient g. */
vec3 bevel(float d, vec2 g, float b) {
  float x = clamp((d + b) / b, 0.0, 0.985);
  return normalize(vec3(g * x, sqrt(1.0 - x * x)));
}
/** Normal across a cylinder lying flat: s in -1..1 across it, v the across direction. */
vec3 cyl(float s, vec2 v) {
  s = clamp(s, -0.985, 0.985);
  return normalize(vec3(v * s, sqrt(1.0 - s * s)));
}
/** Outward gradient of sdOBox (central differences). */
vec2 gOBox(vec2 p, vec2 c, vec2 u, vec2 he, float r) {
  vec2 e = vec2(0.04, 0.0);
  return normalize(vec2(
    sdOBox(p + e.xy, c, u, he, r) - sdOBox(p - e.xy, c, u, he, r),
    sdOBox(p + e.yx, c, u, he, r) - sdOBox(p - e.yx, c, u, he, r)) + 1e-6);
}
float fill(float d, float aa) { return 1.0 - smoothstep(-aa, aa, d); }
float soft(float d, float w) { return 1.0 - smoothstep(-w, w, d); }
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
/** Unit vector v turned by angle a. */
vec2 turn(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

/* ---------------------------------------------------------------- light */

vec3 toLight(vec3 P) { return normalize(uLight - P); }

// The camera: high over the deck, a little toward the front. Seen from a
// point rather than from infinity, every flat part reflects a slightly
// different patch of the studio, which is what gives metal its gradients.
const vec3 CAM = vec3(250.0, 240.0, 1300.0);
vec3 viewDir(vec3 P) { return normalize(CAM - P); }

vec3 diffuse(vec3 n, vec3 P, float vis, float ao) {
  vec3 L = toLight(P);
  float ndl = max(dot(n, L), 0.0);
  vec3 amb = mix(uAmbLow, uAmbTop, clamp(n.z * 0.6 + 0.4, 0.0, 1.0));
  return amb * ao + uKey * ndl * vis;
}
float spec(vec3 n, vec3 P, float shine) {
  vec3 H = normalize(toLight(P) + viewDir(P));
  return pow(max(dot(n, H), 0.0), shine) * (shine + 8.0) / 40.0;
}
/** A soft-edged rectangle on the ceiling plane, seen along R from P. */
float panel(vec3 P, vec3 R, vec2 c, vec2 he, float feather) {
  if (R.z <= 0.02) return 0.0;
  vec2 hit = P.xy + R.xy * ((1500.0 - P.z) / R.z);
  vec2 q = abs(hit - c) - he;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  return 1.0 - smoothstep(-feather, feather, d);
}
// The studio: a dim room, a big softbox over the upper left (where the key
// is), and a thin strip light off to the right for the far edges.
vec3 env(vec3 n, vec3 P) {
  vec3 R = reflect(-viewDir(P), n);
  vec3 col = mix(uEnvLow, uEnvHigh, smoothstep(-0.2, 0.9, R.z));
  float box = panel(P, R, uLight.xy + vec2(-60.0, -40.0), vec2(330.0, 260.0), 170.0);
  float strip = panel(P, R, vec2(1250.0, 200.0), vec2(70.0, 700.0), 90.0) * 0.4;
  return col + uBox * (box + strip);
}
/** Brushed or polished metal. */
vec3 metal(vec3 n, vec3 P, vec3 f0, float vis, float shine, float ao) {
  vec3 e = env(n, P);
  vec3 col = f0 * (e * mix(0.6, 1.0, vis) * ao + diffuse(n, P, vis, ao) * 0.16);
  col += uKey * spec(n, P, shine) * vis * f0 * 1.3;
  return col;
}
/** Matte / satin dielectric. */
vec3 satin(vec3 n, vec3 P, vec3 albedo, float vis, float ao, float gloss) {
  vec3 col = albedo * diffuse(n, P, vis, ao);
  col += uKey * spec(n, P, 60.0) * vis * gloss * 0.12;
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, viewDir(P)), 0.0), 5.0);
  col += env(n, P) * fres * gloss * ao;
  return col;
}

/**
 * A part under the pointer (h 0..1): a touch brighter, its edge (where
 * edge is 1) catching more light, and a little lift in its blacks.
 */
vec3 hl(vec3 c, float h, float edge) { return c * (1.0 + h * (0.13 + 0.5 * edge)) + uKey * 0.02 * h; }

/** Where a point at height h above the receiving plane lands in its shadow. */
vec2 proj(vec2 x, float h) { return x + (x - uLight.xy) * h / max(uLight.z - h, 1.0); }

/* ---------------------------------------------------------------- vinyl */

float grooved(float r, float aa) {
  float m = 0.0;
${X}
  return m;
}
float loudness(float r) {
  float l = 0.4;
${W}
  return l;
}
/** Concentric striations, each octave faded out before it aliases. */
float striation(float r, float px) {
  float s = 0.0;
  s += (vnoise1(r / 0.32) - 0.5) * 1.0 * smoothstep(1.3, 3.0, 0.32 / px);
  s += (vnoise1(r / 0.85 + 17.0) - 0.5) * 0.9 * smoothstep(1.3, 3.0, 0.85 / px);
  s += (vnoise1(r / 2.2 + 41.0) - 0.5) * 0.7 * smoothstep(1.3, 3.0, 2.2 / px);
  s += (vnoise1(r / 7.0 + 73.0) - 0.5) * 0.6;
  return s;
}

/* ---------------------------------------------------------------- shadows */

float armShadow(vec2 p, float zr, float px) {
  float lz = uLift * 11.0;
  float s = 0.0;
  // tube: high at the pivot, lower toward the headshell
  float hP = 38.0 - zr, hK = 25.0 + lz - zr;
  vec2 rear = PIV - uArmU * 44.0;
  vec2 a = proj(rear, hP + 2.0), b = proj(PIV, hP), c = proj(uArmK, hK);
  float t = clamp(dot(p - b, c - b) / dot(c - b, c - b), 0.0, 1.0);
  float hT = mix(hP, hK, t);
  s = max(s, soft(sdSeg(p, b, c) - 4.0, 0.6 + hT * 0.2));
  s = max(s, soft(sdSeg(p, a, b) - 4.5, 0.6 + hP * 0.2));
  // counterweight
  float hW = 39.0 - zr;
  s = max(s, soft(sdOBox(p, proj(PIV - uArmU * 62.0, hW), uArmU, vec2(16.0, 17.0), 4.0), 0.8 + hW * 0.2));
  // headshell: the cartridge and plate, then the narrow neck
  float hH = 20.0 + lz - zr;
  s = max(s, soft(sdOBox(p, proj(uArmS - uArmH * 8.4, hH), uArmH, vec2(14.0, 7.6), 2.4), 0.6 + hH * 0.2));
  s = max(s, soft(sdOBox(p, proj(uArmS - uArmH * 28.5, hH + 1.0), uArmH, vec2(8.5, 4.4), 2.0), 0.6 + hH * 0.2));
  // finger lift
  vec2 f0 = uArmS - uArmH * 7.0 + uArmSide * 5.0, f1 = uArmS - uArmH * 3.0 + uArmSide * 15.5;
  s = max(s, soft(sdSeg(p, proj(f0, hH + 1.0), proj(f1, hH + 2.0)) - 2.0, 0.5 + hH * 0.2));
  return s;
}

float tallShadow(vec2 p, float zr) {
  float s = 0.0;
  // pivot housing: a cylinder 36 mm tall
  float h = 36.0 - zr;
  if (h > 0.0) s = max(s, soft(sdSeg(p, PIV, proj(PIV, h)) - 18.0, 1.2 + h * 0.06));
  // arm rest post
  h = 24.0 - zr;
  if (h > 0.0) s = max(s, soft(sdSeg(p, REST, proj(REST, h)) - 4.2, 0.8 + h * 0.08));
  // cue lever
  h = 10.0 - zr;
  if (h > 0.0) s = max(s, soft(sdSeg(p, CUEP, proj(CUEP, h)) - ${K(x.r)}, 0.8 + h * 0.1));
  return s;
}

/** The headshell plate: a mount over the cartridge on a narrow neck. */
float sdHead(vec2 p) {
  float mount = sdOBox(p, uArmS - uArmH * 11.5, uArmH, vec2(9.5, 6.3), 2.2);
  float neck = sdOBox(p, uArmS - uArmH * 28.5, uArmH, vec2(8.5, 4.0), 1.8);
  return smin(mount, neck, 2.4);
}

/* ---------------------------------------------------------------- main */

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = (frag - uOrigin) / uScale;
  float px = 1.0 / uScale;
  float aa = px * 0.75;

  // ground shadow under the plinth
  vec3 pl = sdgRect(p - vec2(${K(240)}, ${K(180)}), vec2(${K(240)}, ${K(180)}), ${K(16)});
  if (pl.x > 90.0) { outColor = vec4(0.0); return; }
  float g1 = soft(sdgRect(p - vec2(${K(241)}, ${K(182.5)}), vec2(${K(240)}, ${K(180)}), ${K(16)}).x, 3.5);
  float g2 = soft(sdgRect(p - vec2(${K(246)}, ${K(196)}), vec2(${K(234)}, ${K(176)}), ${K(22)}).x, 30.0);
  float g3 = soft(sdgRect(p - vec2(${K(244)}, ${K(210)}), vec2(${K(220)}, ${K(160)}), ${K(46)}).x, 60.0);
  float ground = clamp(uGround * (g1 * 0.5 + g2 * 0.34 + g3 * 0.16), 0.0, 1.0);
  float mPl = fill(pl.x, aa);
  if (mPl <= 0.0) { outColor = vec4(0.0, 0.0, 0.0, ground); return; }

  vec2 d = p - C;
  float r = length(d);
  vec2 rad = d / max(r, 1e-4);
  vec2 tng = vec2(-rad.y, rad.x);
  float ang = atan(d.y, d.x);

  // which surface receives shadows here
  float zr = r < ${K(151)} ? Z_RECORD : r < ${K(166)} ? Z_PLATTER : 0.0;
  bool nearArm = sdSeg(p, PIV - uArmU * 90.0, uArmS + uArmH * 20.0) < 70.0;
  float shArm = nearArm ? armShadow(p, zr, px) : 0.0;
  float shTall = tallShadow(p, zr);
  float vis = 1.0 - 0.9 * max(shArm, shTall);

  /* ------------------------------------------------------------ plinth */
  vec3 n = bevel(pl.x, pl.yz, 3.2);
  vec3 P = vec3(p, 0.0);
  float grain = (vnoise2(p * 2.6) - 0.5) * 0.035 * smoothstep(0.6, 1.6, 0.38 / px) + (vnoise2(p * 0.35) - 0.5) * 0.02;
  vec3 albedo = uPlinth * (1.0 + grain);
  // the printing: what always shows (red), and hairlines (green) only
  // where the screen has the pixels for them
  vec4 pr = texture(uPrint, p / vec2(${K(480)}, ${K(360)}));
  float ink = clamp(pr.r + pr.g * smoothstep(1.8, 2.9, 1.0 / px), 0.0, 1.0);
  albedo = mix(albedo, uInk, ink * 0.92);

  // contact shadows and occlusion on the plinth
  float ao = 1.0;
  ao *= mix(0.42, 1.0, smoothstep(${K(166)}, ${K(175)}, r));
  vec2 pc = proj(C, Z_PLATTER);
  float platShadow = soft(length(p - pc) - ${K(166)}, 4.5);
  float dPiv = length(p - PIV);
  ao *= mix(0.55, 1.0, smoothstep(27.0, 34.0, dPiv));
  ao *= mix(0.6, 1.0, smoothstep(8.0, 13.0, length(p - REST)));
  ao *= mix(0.62, 1.0, smoothstep(${K(x.r)}, ${K(x.r+5)}, length(p - CUEP)));
  float visP = vis * (1.0 - 0.85 * platShadow);
  vec3 col = satin(n, P, albedo, visP, ao, 0.35);
  // a cool rim on the far edges in the dark (keeps the slab off the tile)
  col += uRim * vec3(0.55, 0.6, 0.7) * smoothstep(-3.0, -0.4, pl.x) * smoothstep(0.2, 0.9, dot(-pl.yz, normalize(vec2(-0.6, -1.0))));

  /* ------------------------------------------------------------ strobe lamp */
  {
    float dl = length(p - LAMP);
    float bez = fill(dl - ${K(6.5)}, aa);
    if (bez > 0.0) {
      vec3 nb = bevel(dl - ${K(6.5)}, (p - LAMP) / max(dl, 1e-3), 1.6);
      vec3 cb = metal(nb, vec3(p, 3.0), uMetal, vis, 80.0, 1.0);
      float lens = fill(dl - 4.6, aa);
      vec3 nl = normalize(vec3((p - LAMP) / 4.6 * 0.8, 1.0));
      vec3 glass = vec3(0.09, 0.012, 0.004) * diffuse(nl, vec3(p, 4.0), vis, 1.0) + env(nl, vec3(p, 4.0)) * 0.06 + uKey * spec(nl, vec3(p, 4.0), 160.0) * 0.5 * vis;
      glass += uGlow * uLamp * (1.4 - dl / 4.6) * 2.0;
      cb = mix(cb, glass, lens);
      col = mix(col, cb, bez);
    }
    // its light on the plinth
    col += uGlow * uLamp * 0.28 * exp(-max(dl - 5.0, 0.0) / 9.0) * (1.0 - bez);
  }

  /* ------------------------------------------------------------ start / stop */
  {
    vec3 sb = sdgRect(p - STARTP, vec2(${K(15)}), 4.4);
    if (sb.x < 1.2) {
      float well = fill(sb.x, aa);
      vec3 cap = sdgRect(p - STARTP, vec2(${K(13.7)}), 3.4);
      float mc = fill(cap.x, aa);
      float press = uStart;
      vec3 nc = bevel(cap.x, cap.yz, 1.8);
      vec3 cc = metal(nc, vec3(p, 2.0 - press), uMetal * uCap * mix(1.0, 0.86, press), vis, 60.0, 1.0);
      // brushed: straight lines across the cap
      cc *= 1.0 + (vnoise1((p.y - STARTP.y) * 6.0) - 0.5) * 0.07 * smoothstep(0.5, 1.5, 0.3 / px);
      cc = hl(cc, uHov[2], smoothstep(-2.0, -0.3, cap.x));
      // the power light in its corner
      float led = length(p - (STARTP + vec2(8.6, -8.6)));
      cc = mix(cc, mix(vec3(0.05, 0.02, 0.01), uGlow * 2.2, uPower), fill(led - 1.25, aa));
      cc += uGlow * uPower * 0.35 * exp(-max(led - 1.2, 0.0) / 1.6);
      vec3 cw = col * mix(0.34, 0.6, smoothstep(-1.4, 0.0, sb.x));
      col = mix(col, mix(cw, cc, mc), well);
      // its shadow inside the well
      col *= 1.0 - 0.25 * well * (1.0 - mc) * (1.0 - press);
    }
  }

  /* ------------------------------------------------------------ 33 / 45 */
  for (int i = 0; i < 2; i++) {
    vec2 bp = i == 0 ? SP33 : SP45;
    float press = i == 0 ? uSpeedPress.x : uSpeedPress.y;
    float lit = i == 0 ? uSpeedLed.x : uSpeedLed.y;
    float db = length(p - bp);
    if (db < ${K(g[0].r+2)}) {
      float well = fill(db - ${K(g[0].r+1)}, aa);
      float mc = fill(db - ${K(g[0].r)}, aa);
      vec3 nc = bevel(db - ${K(g[0].r)}, (p - bp) / max(db, 1e-3), 1.6);
      vec3 cc = metal(nc, vec3(p, 2.0 - press), uMetal * mix(1.0, 0.86, press), vis, 60.0, 1.0);
      cc = hl(cc, i == 0 ? uHov[3] : uHov[4], smoothstep(-1.8, -0.3, db - ${K(g[0].r)}));
      col = mix(col, mix(col * 0.4, cc, mc), well);
    }
    float dl = length(p - (bp + vec2(0.0, -11.0)));
    col = mix(col, mix(vec3(0.03, 0.012, 0.006), uGlow * 2.2, lit), fill(dl - 1.2, aa));
    col += uGlow * lit * 0.4 * exp(-max(dl - 1.1, 0.0) / 1.8);
  }

  /* ------------------------------------------------------------ pitch fader */
  {
    vec2 FC = ${F(458,238)};
    // the slot: a narrow recess, its far wall in shade and its near lip lit
    float slot = sdOBox(p, FC, vec2(0.0, 1.0), vec2(${K(54.1)}, 1.7), 1.7);
    if (slot < 3.0) {
      float ms = fill(slot, aa);
      float across = (p.x - FC.x) / 1.7;
      vec3 inner = uDark * diffuse(vec3(0, 0, 1), vec3(p, -6.0), 0.4, 0.5) + uDark * 0.4;
      inner *= mix(0.5, 1.1, smoothstep(-1.0, 1.0, across));
      col = mix(col, inner, ms);
      // the lip: lit on the side away from the light
      float lip = (1.0 - smoothstep(0.0, 0.7, abs(slot))) * (1.0 - ms * 0.6);
      col += uKey * 0.05 * lip * smoothstep(-0.5, 1.0, across) * vis;
    }
    // the cap and its shadow
    vec2 kc = vec2(FC.x, uFaderY);
    vec2 kh = vec2(${K(4.6)}, ${K(8)});
    float sh = soft(sdOBox(p, proj(kc, 9.0), vec2(0.0, 1.0), kh, 2.0), 1.6 + 9.0 * 0.12);
    col *= 1.0 - 0.42 * sh;
    float kd = sdOBox(p, kc, vec2(0.0, 1.0), kh, 2.0);
    float mk = fill(kd, aa);
    if (mk > 0.0) {
      vec3 nk = bevel(kd, gOBox(p, kc, vec2(0.0, 1.0), kh, 2.0), 2.2);
      // a shallow dish across the top, so the light rolls over it
      nk = normalize(nk + vec3(0.0, -(p.y - kc.y) / kh.x * 0.12, 0.0));
      vec3 ck = satin(nk, vec3(p, 9.0), uDark * 1.25, 1.0, 1.0, 1.1);
      // the index line
      float line = fill(abs(p.y - kc.y) - 0.38, aa) * step(abs(p.x - kc.x), kh.y - 1.6);
      ck = mix(ck, vec3(0.82) * diffuse(vec3(0, 0, 1), vec3(p, 9.0), 1.0, 1.0), line * 0.92);
      col = mix(col, hl(ck, uHov[6], smoothstep(-2.4, -0.3, kd)), mk);
    }
    // quartz lock: a small green light by the zero mark
    float dl = length(p - (FC + vec2(10.6, 0.0)));
    vec3 green = vec3(0.12, 1.0, 0.32);
    col = mix(col, mix(vec3(0.01, 0.03, 0.012), green * 1.8, uLock), fill(dl - 1.15, aa));
    col += green * uLock * 0.3 * exp(-max(dl - 1.1, 0.0) / 1.6);
  }

  /* ------------------------------------------------------------ pivot base, rest, cue */
  {
    // base flange round the housing
    float m = fill(dPiv - 27.0, aa);
    if (m > 0.0) {
      vec3 nb = bevel(dPiv - 27.0, (p - PIV) / max(dPiv, 1e-3), 3.0);
      vec3 cb = metal(nb, vec3(p, 3.0), uMetal * 0.92, vis, 40.0, 1.0);
      cb *= 1.0 + (vnoise1(dPiv * 5.0) - 0.5) * 0.08 * smoothstep(0.5, 1.5, 0.2 / px);
      col = mix(col, cb, m);
    }
    // arm rest: base disc, post, cradle
    float dr = length(p - REST);
    float mb = fill(dr - 8.0, aa);
    if (mb > 0.0) {
      vec3 nb = bevel(dr - 8.0, (p - REST) / max(dr, 1e-3), 2.0);
      col = mix(col, metal(nb, vec3(p, 2.0), uMetal * 0.9, vis, 60.0, 1.0), mb);
      float post = fill(dr - 4.2, aa);
      vec3 np = normalize(vec3((p - REST) / 4.2 * 0.85, 1.0));
      col = mix(col, metal(np, vec3(p, 22.0), uMetal, 1.0, 90.0, 1.0), post);
      // the rubber cradle across the tube's line
      float cr = sdOBox(p, REST, vec2(1.0, 0.0), vec2(6.5, 2.2), 1.6);
      col = mix(col, satin(vec3(0, 0, 1), vec3(p, 24.0), uDark * 0.7, 1.0, 1.0, 0.6), fill(cr, aa));
    }
    // cue lever base
    float dq = length(p - CUEP);
    float mq = fill(dq - ${K(x.r)}, aa);
    if (mq > 0.0) {
      vec3 nq = bevel(dq - ${K(x.r)}, (p - CUEP) / max(dq, 1e-3), 2.4);
      col = mix(col, metal(nq, vec3(p, 8.0), uMetal * 0.92, vis, 60.0, 1.0), mq);
    }
  }

  /* ------------------------------------------------------------ platter */
  if (r < ${K(166)} + aa) {
    float mP = fill(r - ${K(166)}, aa);
    // flat top, a chamfer and a rounded lip
    vec3 np = vec3(0.0, 0.0, 1.0);
    np = mix(np, normalize(vec3(rad * 0.62, 1.0)), smoothstep(161.0, 161.6, r));
    np = r > 165.0 ? bevel(r - ${K(166)}, rad, 1.0) : np;
    vec3 Pp = vec3(p, Z_PLATTER);
    float visR = vis * (1.0 - 0.8 * soft(length(p - proj(C, 2.0)) - ${K(151)}, 0.7));
    float aoR = mix(0.5, 1.0, smoothstep(${K(151)}, ${K(153.2)}, r));
    vec3 cp = metal(np, Pp, uMetal, visR, 30.0, aoR);
    // machined: concentric anisotropic highlight, fine rings
    vec3 Hp = normalize(toLight(Pp) + viewDir(Pp));
    float TL = dot(tng, Hp.xy);
    float lobe = exp(-900.0 * TL * TL) * 0.5 + exp(-70.0 * TL * TL) * 0.16;
    cp += uKey * uMetal * lobe * visR * (np.z > 0.99 ? 1.0 : 0.4);
    cp *= 1.0 + (vnoise1(r / 0.3) - 0.5) * 0.12 * smoothstep(1.2, 2.6, 0.3 / px) + (vnoise1(r / 1.1 + 9.0) - 0.5) * 0.06;

    // strobe dots: polished bumps, motion-blurred under the room light,
    // frozen where the lamp's flashes catch them
    // The lamp lights an arc of about 40 degrees, a run of some 20 dots.
    // Under room light alone the dots smear into a band once the platter
    // turns; under the lamp they stand still at the set speed (or drift
    // when the pitch is off). A dim room shows them lit up; a bright one by
    // contrast, orange and darker than the polished rim, since added glow
    // would only wash out against bright metal.
    float lampA = atan(LAMP.y - C.y, LAMP.x - C.x);
    float dA = atan(sin(ang - lampA), cos(ang - lampA));
    float lampLit = uLamp * exp(-dA * dA / (2.0 * 0.35 * 0.35));
    float dotR = 0.9;
    for (int i = 0; i < 2; i++) {
      float rr = i == 0 ? ${K(w[0].r)} : ${K(w[1].r)};
      float N = i == 0 ? ${K(w[0].dots)} : ${K(w[1].dots)};
      float dy = r - rr;
      if (abs(dy) > dotR + 1.0) continue;
      float spacing = TAU * rr / N;
      // room light: real position, smeared by one frame of motion
      float blur = abs(uPlatterVel) * (1.0 / 60.0) * rr;
      float x = (ang - uPlatterAngle) / TAU * N;
      float dx = (fract(x + 0.5) - 0.5) * spacing;
      float dxs = max(abs(dx) - blur * 0.5, 0.0);
      float amb = fill(length(vec2(dxs, dy)) - dotR, aa) * (2.0 * dotR) / min(2.0 * dotR + blur, spacing);
      // the smeared band stays quiet, so the frozen dots stand out from it
      amb *= 1.0 - 0.5 * smoothstep(0.3, 0.9, blur / spacing);
      // flash light: the apparent (aliased) position, sharp
      float phase = i == 0 ? uStrobe.x : uStrobe.y;
      float xs = (ang - phase) / TAU * N;
      float dxf = (fract(xs + 0.5) - 0.5) * spacing;
      float flash = fill(length(vec2(dxf, dy)) - dotR, aa);
      float dome = sqrt(max(0.0, 1.0 - (dxs * dxs + dy * dy) / (dotR * dotR)));
      vec3 dn = normalize(vec3(vec2(dxs, dy) / dotR * 0.7, 1.0));
      vec3 dc = metal(dn, Pp, uMetal * 1.05, visR, 120.0, 1.0);
      cp = mix(cp, dc * (1.0 + 0.3 * dome), amb * (1.0 - lampLit));
      float fl = flash * lampLit;
      // dim room: the lamp is most of the light on the rim, the dots glow
      vec3 lit = mix(cp, cp * 0.5, lampLit * 0.35 * (1.0 - flash)) + uGlow * fl * 1.6;
      // bright room: the dots read by contrast, domed, a glint at the top
      float domeF = sqrt(max(0.0, 1.0 - (dxf * dxf + dy * dy) / (dotR * dotR)));
      vec3 shade = mix(cp, cp * 0.12 + uGlow * (0.32 + 0.24 * domeF), fl);
      cp = mix(lit, shade, uStrobeK);
    }
    // the lamp's warm wash on the rim
    cp += uGlow * lampLit * 0.08 * smoothstep(151.0, 160.0, r) * (1.0 - 0.75 * uStrobeK);
    col = mix(col, cp, mP);
  }

  /* ------------------------------------------------------------ record */
  if (r < ${K(151)} + aa) {
    float mR = fill(r - ${K(151)}, aa);
    vec2 q = vec2(cos(-uRecordAngle) * d.x - sin(-uRecordAngle) * d.y, sin(-uRecordAngle) * d.x + cos(-uRecordAngle) * d.y);
    float a = ang - uRecordAngle;
    vec3 Pr = vec3(p, Z_RECORD);
    vec3 L = toLight(Pr);

    // the edge bead and the pressed step round the label
    vec3 nr = vec3(0.0, 0.0, 1.0);
    if (r > 149.2) nr = bevel(r - ${K(151)}, rad, 1.8);
    float g = grooved(r, aa);
    float loud = loudness(r) * (0.75 + 0.5 * vnoise1(r * 0.3 + 5.0));

    // The sheen, Kajiya-Kay: the grooves run along the tangent, so the
    // highlight is where the tangent is square to the half vector. Groove
    // modulation nudges the tangent a hair (it turns with the record, so the
    // wedges shimmer), and a slight warp tilts it out of the plane once a
    // turn, so they sway as the record spins.
    vec3 V = viewDir(Pr);
    vec3 H = normalize(L + V);
    float m1 = vnoiseP(vec2(a / TAU * 72.0, r * 0.42), 72.0) - 0.5;
    float m2 = (vnoiseP(vec2(a / TAU * 240.0, r * 1.3 + 11.0), 240.0) - 0.5) * uDetail;
    float delta = (m1 * 0.035 + m2 * 0.018) * loud;
    vec2 t2 = cos(delta) * tng + sin(delta) * rad;
    float warp = (r / ${K(151)}) * (cos(a + 0.6) * 0.010 + cos(2.0 * a + 2.1) * 0.004);
    vec3 T = normalize(vec3(t2, warp));
    float TH = dot(T, H);
    float stri = striation(r, px);
    float narrow = exp(-TH * TH * 2400.0 / (0.45 + loud));
    float broad = exp(-TH * TH * 150.0);
    float sheen = (narrow * clamp(0.7 + 0.75 * stri, 0.05, 2.0) + broad * 0.05 * (1.0 + 0.6 * stri)) * g;

    // run-out: lead-out spiral and the locked groove
    float ro = smoothstep(${K(54.6)} - 0.3, ${K(54.6)}, r) * (1.0 - smoothstep(${K(62)} - aa, ${K(62)} + aa, r));
    float u = (${K(62)} - r) / 3.6 - a / TAU;
    float lw = max(0.07, px * 0.6);
    float spiral = (1.0 - smoothstep(lw, lw + px, abs(fract(u + 0.5) - 0.5) * 3.6)) * ro;
    float lock = 1.0 - smoothstep(lw, lw + px, abs(r - ${K(54.6)}));
    float lines = max(spiral, lock) * min(1.0, 0.12 / px);
    sheen += lines * exp(-TH * TH * 600.0) * 0.8;

    vec4 lab = texture(uLabel, q / ${K(128)} + 0.5);
    float etch = lab.a * smoothstep(${K(51.5)}, ${K(52.5)}, r) * (1.0 - smoothstep(${K(61.2)}, ${K(62)}, r));

    // the body: near-black plastic, a little lighter where the grooves are
    vec3 base = uVinyl * (1.0 + g * 0.35 + lines * 0.4);
    vec3 cr = base * diffuse(nr, Pr, vis, 1.0);
    // coloured pressings let light in and back out (more toward the edge,
    // where the platter beneath shows least)
    cr += uVinyl * uTrans * (0.4 + 0.6 * vis) * (0.55 + 0.45 * smoothstep(60.0, ${K(151)}, r));
    cr += uSheen * sheen * vis;
    // gloss: the smooth vinyl mirrors the studio; the grooves scatter it
    float fres = 0.045 + 0.955 * pow(1.0 - max(dot(nr, V), 0.0), 5.0);
    cr += env(nr, Pr) * fres * (1.0 - g * 0.82) * mix(0.7, 1.0, vis);
    cr += uKey * spec(nr, Pr, 400.0) * vis * 0.08 * (1.0 - g * 0.8);
    // etching: matte scratches that catch the light
    cr = mix(cr, cr + uSheen * 0.04 + vec3(0.03) * diffuse(vec3(0, 0, 1), Pr, vis, 1.0), etch);
    cr += uSheen * etch * broad * 0.4 * vis;
    // under the pointer, the edge bead and the sheen lift a little
    float hRec = uHov[1];
    cr += uKey * hRec * (0.05 * smoothstep(147.6, 150.4, r) + 0.12 * uSheen.x * sheen) * (0.4 + 0.6 * vis);

    // label
    if (r < ${K(50)} + 1.4) {
      float mL = fill(r - ${K(50)}, aa);
      vec3 art = pow(lab.rgb, vec3(2.2));
      float paper = (vnoise2(q * 3.4) - 0.5) * 0.05 * smoothstep(0.6, 1.6, 0.3 / px) + (vnoise2(q * 0.6 + 3.0) - 0.5) * 0.03;
      vec3 nl = vec3(0.0, 0.0, 1.0);
      vec3 cl = art * (1.0 + paper) * diffuse(nl, Pr, vis, 1.0);
      cl += uKey * spec(nl, Pr, 18.0) * vis * 0.03;
      // the label is pressed in: a fine shadow line round it
      float edge = smoothstep(${K(49)}, ${K(50)}, r) * mL;
      cl *= 1.0 - 0.35 * edge;
      cr = mix(cr, cl, mL);
      cr *= 1.0 - 0.6 * (1.0 - smoothstep(0.0, 0.9, abs(r - ${K(50.5)}))) * (1.0 - mL);
    }
    // spindle
    if (r < ${K(3.6)} + 1.6) {
      float ms = fill(r - ${K(3.6)}, aa);
      vec3 ns = normalize(vec3(rad * clamp(r / ${K(3.6)}, 0.0, 0.95), 1.0 - 0.5 * clamp(r / ${K(3.6)}, 0.0, 1.0)));
      vec3 cs = metal(ns, vec3(p, 22.0), vec3(0.9), 1.0, 220.0, 1.0);
      cr *= 1.0 - 0.55 * (1.0 - smoothstep(${K(3.6)}, ${K(5)}, r));
      cr = mix(cr, cs, ms);
    }
    col = mix(col, cr, mR);
  }

  /* ------------------------------------------------------------ cue lever handle */
  {
    float t = uCue;
    float aq = mix(${K(200*Math.PI/180)}, ${K(156*Math.PI/180)}, t);
    vec2 tip = CUEP + vec2(cos(aq), sin(aq)) * ${K(x.length)};
    float sq = soft(sdSeg(p, proj(CUEP, 12.0), proj(tip, 14.0)) - 2.6, 1.6);
    col *= 1.0 - 0.45 * sq * (1.0 - fill(length(p - CUEP) - ${K(x.r)}, aa));
    float dh = sdSeg(p, CUEP, tip) - 2.4;
    float mh = fill(dh, aa);
    if (mh > 0.0) {
      vec2 hu = normalize(tip - CUEP);
      vec2 hv = vec2(-hu.y, hu.x);
      vec3 nh = cyl(dot(p - CUEP, hv) / 2.4, hv);
      col = mix(col, hl(metal(nh, vec3(p, 12.0), uMetal, 1.0, 120.0, 1.0), uHov[5], 0.5), mh);
    }
    float db = length(p - tip) - 3.3;
    float mk = fill(db, aa);
    if (mk > 0.0) {
      vec3 nk = normalize(vec3((p - tip) / 3.3 * 0.85, 1.0));
      col = mix(col, hl(satin(nk, vec3(p, 14.0), uDark * 0.9, 1.0, 1.0, 1.2), uHov[5], smoothstep(-1.6, 0.0, db)), mk);
    }
    float dc = length(p - CUEP) - 3.0;
    col = mix(col, metal(normalize(vec3((p - CUEP) / 3.0 * 0.7, 1.0)), vec3(p, 13.0), uMetal, 1.0, 100.0, 1.0), fill(dc, aa));
  }

  /* ------------------------------------------------------------ tonearm */
  if (nearArm) {
    vec2 v = vec2(-uArmU.y, uArmU.x);
    float lz = uLift * 11.0;

    // pivot housing: black anodised, a polished bearing cap, the yoke
    float mH = fill(dPiv - 18.0, aa);
    if (mH > 0.0) {
      vec3 nh = bevel(dPiv - 18.0, (p - PIV) / max(dPiv, 1e-3), 2.6);
      vec3 ch = metal(nh, vec3(p, 36.0), uDark * 1.4, 1.0, 40.0, 1.0) + uDark * diffuse(nh, vec3(p, 36.0), 1.0, 1.0) * 0.5;
      ch *= 1.0 + (vnoise1(dPiv / 0.35) - 0.5) * 0.12 * smoothstep(1.2, 2.6, 0.35 / px);
      float TLh = dot(vec2(-(p - PIV).y, (p - PIV).x) / max(dPiv, 1e-3), toLight(vec3(p, 36.0)).xy);
      ch += uKey * 0.06 * exp(-90.0 * TLh * TLh) * nh.z;
      col = mix(col, ch, mH);
      // the arm's shadow on the housing top
      col *= 1.0 - 0.4 * mH * soft(sdSeg(p, proj(PIV - uArmU * 40.0, 4.0), proj(PIV + uArmU * 30.0, 4.0)) - 5.0, 2.0);
    }
    // the gimbal: a polished ring round the bearing, with a bearing cap
    // either side of the arm
    float ringD = abs(dPiv - 10.6) - 2.3;
    float mY = fill(ringD, aa);
    if (mY > 0.0) {
      float t = clamp((dPiv - 10.6) / 2.3, -1.0, 1.0);
      vec3 ny = normalize(vec3((p - PIV) / max(dPiv, 1e-3) * t * 0.9, sqrt(max(0.0, 1.0 - t * t * 0.81))));
      col = mix(col, metal(ny, vec3(p, 40.0), uMetal, 1.0, 110.0, 1.0), mY);
    }
    for (int k = -1; k <= 1; k += 2) {
      vec2 sp = PIV + v * 11.6 * float(k);
      float ds = length(p - sp) - 3.4;
      float mB = fill(ds, aa);
      if (mB > 0.0) {
        vec3 nb = normalize(vec3((p - sp) / 3.4 * 0.82, 1.0));
        vec3 cb = metal(nb, vec3(p, 41.0), uMetal * 1.04, 1.0, 160.0, 1.0);
        cb *= 1.0 - 0.35 * (1.0 - smoothstep(0.6, 1.1, length(p - sp)));
        col = mix(col * (1.0 - 0.35 * fill(ds - 1.2, 1.4)), cb, mB);
      }
    }
    // the bearing's own cap, under the tube
    {
      float dc = dPiv - 6.2;
      float mc = fill(dc, aa);
      vec3 nc = normalize(vec3((p - PIV) / 6.2 * 0.5, 1.0));
      col = mix(col, metal(nc, vec3(p, 39.0), uDark * 2.2 + uMetal * 0.08, 1.0, 90.0, 1.0), mc);
    }

    // counterweight and the stub it rides on
    vec2 cw = PIV - uArmU * 62.0;
    float stub = sdSeg(p, PIV, PIV - uArmU * 46.0) - 4.6;
    float mS = fill(stub, aa);
    if (mS > 0.0) col = mix(col, metal(cyl(dot(p - PIV, v) / 4.6, v), vec3(p, 40.0), uMetal, 1.0, 160.0, 1.0), mS);
    float cwd = sdOBox(p, cw, uArmU, vec2(16.0, 17.0), 3.0);
    float mW = fill(cwd, aa);
    if (mW > 0.0) {
      float along = dot(p - cw, uArmU);
      float across = dot(p - cw, v) / 17.0;
      vec3 nw = cyl(across, v);
      // rounded ends
      nw = normalize(nw + vec3(uArmU * smoothstep(12.5, 16.0, abs(along)) * sign(along) * 1.2, 0.0));
      bool ring = abs(along - 12.5) < 2.0;
      vec3 cwc = ring ? metal(nw, vec3(p, 46.0), uMetal, 1.0, 120.0, 1.0)
                      : metal(nw, vec3(p, 46.0), uDark * 1.5, 1.0, 50.0, 1.0) + uDark * diffuse(nw, vec3(p, 46.0), 1.0, 1.0) * 0.6;
      // knurling in the middle
      float kn = step(abs(along + 1.5), 9.0) * (0.5 + 0.5 * cos(along * TAU / 1.05));
      cwc *= 1.0 - 0.28 * kn * smoothstep(0.5, 1.2, 0.33 / px) * (ring ? 0.0 : 1.0);
      col = mix(col, cwc, mW);
    }

    // the tube
    float tube = sdSeg(p, PIV, uArmK) - 4.0;
    float mT = fill(tube, aa);
    if (mT > 0.0) {
      float s = dot(p - PIV, v) / 4.0;
      vec3 nt = cyl(s, v);
      vec3 ct = metal(nt, vec3(p, 30.0 + lz), uMetal * 1.04, 1.0, 220.0, 1.0);
      col = mix(col, hl(ct, uHov[0], smoothstep(0.45, 1.0, abs(s))), mT);
    }
    // collar at the headshell joint (knurled)
    float coll = sdOBox(p, uArmK - uArmU * 2.5, uArmU, vec2(5.5, 5.6), 1.6);
    float mC = fill(coll, aa);
    if (mC > 0.0) {
      vec3 nc = cyl(dot(p - uArmK, v) / 5.6, v);
      vec3 cc = metal(nc, vec3(p, 28.0 + lz), uMetal, 1.0, 90.0, 1.0);
      cc *= 1.0 - 0.18 * (0.5 + 0.5 * cos(dot(p - uArmK, uArmU) * TAU / 0.9)) * smoothstep(0.6, 1.4, 0.3 / px);
      col = mix(col, hl(cc, uHov[0], 0.3), mC);
    }

    // The headshell, as on the classic decks: a brushed aluminium plate on
    // a narrow neck, the cartridge under it (black anodised; its flanks and
    // nose show past the plate), the stylus housing at the front in the
    // accent, two slotted screws in their mounting slots, and the finger
    // lift, a rounded tab off the side.
    float hArm = uHov[0];
    vec2 hv = uArmSide;
    float fine = smoothstep(1.6, 3.2, 1.0 / px);

    // cartridge body
    vec2 cartC = uArmS - uArmH * 5.0;
    vec2 cartHe = vec2(8.6, 7.4);
    float cart = sdOBox(p, cartC, uArmH, cartHe, 1.2);
    if (cart < aa) {
      vec3 nk = bevel(cart, gOBox(p, cartC, uArmH, cartHe, 1.2), 1.6);
      vec3 Pk = vec3(p, 17.0 + lz);
      vec3 ck = satin(nk, Pk, uCart, 1.0, 1.0, 1.2) + metal(nk, Pk, vec3(0.06), 1.0, 90.0, 1.0);
      col = mix(col, hl(ck, hArm, smoothstep(-1.6, -0.2, cart)), fill(cart, aa));
    }
    // stylus housing, past the body's nose
    vec2 guardC = uArmS + uArmH * 2.6;
    vec2 guardHe = vec2(2.5, 4.0);
    float guard = sdOBox(p, guardC, uArmH, guardHe, 1.6);
    if (guard < aa) {
      vec3 ng = bevel(guard, gOBox(p, guardC, uArmH, guardHe, 1.6), 1.5);
      vec3 Pg = vec3(p, 15.0 + lz);
      // moulded plastic: a soft gloss
      vec3 cg = satin(ng, Pg, uGuard, 1.0, 1.0, 1.4) + uKey * spec(ng, Pg, 90.0) * 0.06;
      // its grip: fine ribs across the front
      float along = dot(p - guardC, uArmH);
      cg *= 1.0 - 0.14 * step(0.6, along) * (0.5 + 0.5 * cos(along * TAU / 0.7)) * fine;
      col = mix(col, hl(cg, hArm, 0.0), fill(guard, aa));
    }

    // finger lift: a capsule that widens to a rounded pad
    vec2 f0 = uArmS - uArmH * 7.0 + hv * 5.0, f1 = uArmS - uArmH * 3.0 + hv * 15.5;
    vec2 fu = f1 - f0;
    float fLen = length(fu);
    fu /= fLen;
    float ft = clamp(dot(p - f0, fu), 0.0, fLen);
    vec2 fq = p - (f0 + fu * ft);
    float fr = mix(1.45, 2.3, smoothstep(fLen * 0.5, fLen, ft));
    float fl = length(fq) - fr;
    if (fl < aa) {
      vec3 nf = normalize(vec3(fq / fr * 0.92, sqrt(max(0.0, 1.0 - dot(fq, fq) / (fr * fr) * 0.85))));
      vec3 cf = metal(nf, vec3(p, 24.0 + lz), uMetal * 0.96, 1.0, 180.0, 1.0);
      col = mix(col, hl(cf, hArm, smoothstep(0.4, 1.0, length(fq) / fr)), fill(fl, aa));
    }

    // the plate
    float hs = sdHead(p);
    if (hs < aa) {
      vec2 e = vec2(0.05, 0.0);
      vec2 gh = normalize(vec2(sdHead(p + e.xy) - sdHead(p - e.xy), sdHead(p + e.yx) - sdHead(p - e.yx)) + 1e-6);
      // (the outermost sliver keeps a gentler slope: at its steepest the
      // edge would catch the strip light in single pixels)
      vec3 nhs = bevel(min(hs, -0.3), gh, 1.25);
      // pressed with a shallow crown across, so the light rolls over it
      float across = dot(p - uArmS, hv);
      nhs = normalize(nhs + vec3(hv * clamp(across / 6.3, -1.0, 1.0) * 0.1, 0.0));
      vec3 Ph = vec3(p, 22.0 + lz);
      vec3 chs = metal(nhs, Ph, uMetal * 0.92, 1.0, 140.0, 1.0);
      // brushed along its length; the chamfers cut bright
      chs *= 1.0 + (vnoise1(across * 7.0 + 3.0) - 0.5) * 0.1 * fine;
      float cham = smoothstep(-1.25, -0.35, hs) * (1.0 - smoothstep(-0.2, 0.3, hs));
      chs += uKey * uMetal * cham * 0.22 * pow(max(dot(nhs, normalize(toLight(Ph) + viewDir(Ph))), 0.0), 6.0);
      // mounting slots (the black cartridge below shows through) and screws
      for (int k = -1; k <= 1; k += 2) {
        vec2 c0 = uArmS - uArmH * 11.0 + hv * 3.5 * float(k);
        float slot = sdSeg(p, c0 - uArmH * 3.4, c0 + uArmH * 3.4) - 0.95;
        float mSl = fill(slot, aa);
        vec3 inSlot = uCart * diffuse(vec3(0, 0, 1), Ph, 0.5, 0.6);
        chs = mix(chs, inSlot, mSl);
        vec2 sc = c0 + uArmH * (k < 0 ? -1.1 : 0.9);
        float dsc = length(p - sc);
        chs *= 1.0 - 0.32 * (1.0 - smoothstep(1.45, 2.2, dsc)) * (1.0 - mSl * 0.5);
        if (dsc < 1.45 + aa) {
          vec3 nsc = normalize(vec3((p - sc) / 1.45 * 0.78, 1.0));
          vec3 csc = metal(nsc, vec3(p, 23.0 + lz), uMetal, 1.0, 160.0, 1.0);
          // the driver slot, each screw turned its own way
          vec2 sd = turn(uArmH, float(k) * 0.55 + 0.35);
          float cut = abs(dot(p - sc, vec2(-sd.y, sd.x))) - 0.24;
          csc = mix(csc, csc * 0.22, fill(cut, aa) * step(dsc, 1.15) * fine);
          chs = mix(chs, csc, fill(dsc - 1.45, aa));
        }
      }
      col = mix(col, hl(chs, hArm, smoothstep(-1.4, -0.2, hs)), fill(hs, aa));
    }
  }

  // exposure and a soft shoulder (keeps highlights from clipping hard)
  col *= uExposure;
  const float knee = 0.8;
  vec3 over = max(col - knee, 0.0);
  col = min(col, vec3(knee)) + (1.0 - knee) * (1.0 - exp(-over / (1.0 - knee)));
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  float alpha = mPl + (1.0 - mPl) * ground;
  outColor = vec4(col * mPl, alpha);
}
`,Z=[[7,1,2,2],[5,3,2,3],[9,3,2,3],[3,6,2,4],[11,6,2,4],[1,10,2,5],[13,10,2,5],[7,10,2,2]];function Q(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(e)return`${e}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}function J(e,t){"letterSpacing"in e&&(e.letterSpacing=t)}function ee(e,t,a,r){let l=r/16,o=t-r/2,i=a-r/2;for(let[t,a,r,n]of Z)e.fillRect(o+t*l,i+a*l,r*l,n*l)}function et(e,t,a,r,l){let o=[...t].map(t=>e.measureText(t).width+l),i=r-o.reduce((e,t)=>e+t,0)/a/2;e.textAlign="center",e.textBaseline="alphabetic",[...t].forEach((t,r)=>{let l=o[r],n=i+l/2/a;e.save(),e.rotate(n),e.translate(0,-a),e.fillText(t,0,0),e.restore(),i+=l/a})}function ea(e,t,a=document.createElement("canvas")){a.width=t,a.height=t;let r=a.getContext("2d");if(!r)return a;let l=t/128,o=Q();r.setTransform(1,0,0,1,0,0),r.clearRect(0,0,t,t),r.setTransform(l,0,0,l,t/2,t/2),r.fillStyle=e.paper,r.beginPath(),r.arc(0,0,51,0,2*Math.PI),r.fill(),r.strokeStyle=e.accent,r.lineWidth=1.5,r.beginPath(),r.arc(0,0,47.6,0,2*Math.PI),r.stroke(),r.strokeStyle=e.ink,r.globalAlpha=.5,r.lineWidth=.22,r.beginPath(),r.arc(0,0,41.4,0,2*Math.PI),r.stroke(),r.globalAlpha=1,r.fillStyle=e.ink,r.font=`500 2.15px ${o}`,r.globalAlpha=.78,et(r,"SYNTHESISED IN THE BROWSER  ·  NO SAMPLES  ·  90 BPM  ·  D MINOR",44,0,.42),et(r,"ARSHER LAB No. 08  ·  SIDE A",44,Math.PI,.42),r.globalAlpha=1,r.fillStyle=e.ink,ee(r,0,-25.5,13),r.textAlign="center",r.textBaseline="middle",r.font=`600 5.6px ${o}`,J(r,"0.1px"),r.fillText("arsher",0,-12.6),J(r,"0px"),r.fillStyle=e.accent,r.font=`600 9px ${o}`,r.fillText("A",-24,.4),r.fillStyle=e.ink,r.font=`600 5px ${o}`,r.fillText("33⅓",24,-1.2),r.font=`500 2.2px ${o}`,J(r,"0.35px"),r.fillText("RPM",24,3.4),J(r,"0px"),r.globalAlpha=.35,r.fillRect(-20,8.4,40,.18),r.globalAlpha=1,r.font=`500 2.55px ${o}`,r.textBaseline="alphabetic",u.forEach((e,t)=>{let a=13.6+3.9*t;r.globalAlpha=.9,r.textAlign="right",r.fillText(e.id,-5.4,a),r.textAlign="left",r.fillText(e.name,-3.2,a)}),r.globalAlpha=1,r.globalCompositeOperation="source-over",r.fillStyle="#fff",r.strokeStyle="#fff",r.lineCap="round",r.lineJoin="round",r.font=`italic 400 2.6px ${o}`;for(let[e,t,a,l]of(r.save(),r.rotate(Math.PI),et(r,"ARS-008-A1",52.9,0,.32),r.restore(),r.save(),r.rotate(-(.62*Math.PI)),r.translate(0,-52.1),r.lineWidth=.22,Z))r.strokeRect(-1.6+.2*e,-1.6+.2*t,.2*a,.2*l);return r.restore(),r.save(),r.rotate(.55*Math.PI),r.font=`italic 400 2.2px ${o}`,et(r,"90 · Dm",55.699999999999996,0,.3),r.restore(),r.setTransform(1,0,0,1,0,0),a}let er="#ff0000";function el(e,t=document.createElement("canvas")){t.width=Math.round(480*e),t.height=Math.round(360*e);let a=t.getContext("2d");if(!a)return t;let r=Q();for(let l of(a.setTransform(1,0,0,1,0,0),a.clearRect(0,0,t.width,t.height),a.setTransform(e,0,0,e,0,0),a.fillStyle=er,ee(a,20,22,9),a.textAlign="left",a.textBaseline="middle",a.font=`600 6.4px ${r}`,a.fillText("arsher",28.5,22.4),a.textAlign="center",a.textBaseline="alphabetic",a.font=`600 4.2px ${r}`,J(a,"0.32px"),a.fillText("START · STOP",37,304),a.font=`600 4.4px ${r}`,J(a,"0.2px"),g))a.fillText(String(l.rpm),l.x,l.y+l.r+6.6);a.font=`600 4.2px ${r}`,J(a,"0.45px"),a.fillText("RPM",(g[0].x+g[1].x)/2,g[0].y+g[0].r+12.8),J(a,"0px");let l=447.6;for(let e=-8;e<=8;e++){let t=238+e/8*48;e%4==0?(a.fillStyle=er,a.fillRect(l-4.4,t-.26,4.4,.52)):(a.fillStyle="#00ff00",a.fillRect(l-2.4,t-.17,2.4,.34))}return a.fillStyle=er,a.textAlign="right",a.textBaseline="middle",a.font=`600 4.2px ${r}`,a.fillText("−",l-5.6,190.1),a.fillText("0",l-5.6,238.15),a.fillText("+",l-5.6,286.1),a.textAlign="center",a.textBaseline="alphabetic",J(a,"0.45px"),a.fillText("PITCH",458,180),J(a,"0px"),a.setTransform(1,0,0,1,0,0),t}function eo({size:e=16,className:t,children:a}){return(0,o.jsx)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none",className:t?`shrink-0 ${t}`:"shrink-0","aria-hidden":"true",focusable:"false",children:a})}function ei(e){return(0,o.jsx)(eo,{...e,children:(0,o.jsx)("rect",{x:"4",y:"4",width:"8",height:"8",rx:"1.6",fill:"currentColor"})})}function en({up:e,...t}){return(0,o.jsx)(eo,{...t,children:(0,o.jsxs)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:[(0,o.jsx)("path",{d:"M3 13.25h10"}),e?(0,o.jsx)("path",{d:"M8 10.5V3.5M5.25 6.25 8 3.5l2.75 2.75"}):(0,o.jsx)("path",{d:"M8 3.5v7M5.25 7.75 8 10.5l2.75-2.75"})]})})}let es=e=>{let t=e.replace("#","");return[0,2,4].map(e=>{let a=parseInt(t.slice(e,e+2),16)/255;return a<=.04045?a/12.92:((a+.055)/1.055)**2.4})},ec={light:{light:[-160,-260,1500],key:[.86,.85,.83],ambTop:[.4,.405,.42],ambLow:[.2,.2,.21],envHigh:[.3,.305,.32],envLow:[.09,.09,.095],box:[2.3,2.3,2.25],ground:.62,plinth:es("#dedbd5"),ink:es("#4a4845"),metal:[.8,.805,.81],dark:[.03,.03,.034],glow:[1,.22,.05],cart:[.016,.016,.019],guard:es("#cf4a2c"),exposure:1,rim:0,sheen:1,strobe:1,cap:1},dark:{light:[-160,-260,1500],key:[.62,.6,.57],ambTop:[.075,.078,.088],ambLow:[.03,.031,.036],envHigh:[.072,.075,.084],envLow:[.012,.012,.015],box:[1.12,1.13,1.17],ground:.75,plinth:es("#2c2c2f"),ink:es("#c2c0bb"),metal:[.56,.57,.585],dark:[.022,.022,.026],glow:[1,.24,.06],cart:[.014,.014,.017],guard:es("#c4442a"),exposure:1,rim:.12,sheen:.85,strobe:0,cap:.7}},eh=[{id:"black",label:"Black vinyl",swatch:"radial-gradient(circle at 50% 50%, #e8e2d4 0 22%, #161616 23% 100%)",vinyl:[.0075,.0075,.0082],sheen:[.3,.3,.31],trans:0,paper:{paper:"#ece6d8",ink:"#1b1a18",accent:"#d2462a"}},{id:"smoke",label:"Smoke",swatch:"radial-gradient(circle at 50% 50%, #1d1d1d 0 22%, #6d6a66 23% 100%)",vinyl:es("#2e2c2a"),sheen:[.28,.28,.29],trans:.55,paper:{paper:"#1e1d1c",ink:"#ece8df",accent:"#e8b04a"}},{id:"oxblood",label:"Oxblood",swatch:"radial-gradient(circle at 50% 50%, #efe9dd 0 22%, #6e1a1d 23% 100%)",vinyl:es("#43090e"),sheen:[.3,.28,.28],trans:.6,paper:{paper:"#efe9dd",ink:"#2a1214",accent:"#6e1a1d"}},{id:"marine",label:"Marine",swatch:"radial-gradient(circle at 50% 50%, #f1ede4 0 22%, #173a66 23% 100%)",vinyl:es("#0b2650"),sheen:[.28,.29,.31],trans:.6,paper:{paper:"#f1ede4",ink:"#0f2340",accent:"#2b62b0"}}],eu=e=>eh.find(t=>t.id===e)??eh[0],ef=.6666666666666666/4,ep=10.666666666666666,ed=e=>440*2**((e-69)/12),em=e=>e*ef+(Math.floor(e)%2==1?.2*ef:0),ev=[[{step:0,vel:1},{step:6,vel:.7},{step:10,vel:.85}],[{step:0,vel:1},{step:7,vel:.6},{step:10,vel:.85}],[{step:0,vel:1},{step:6,vel:.7},{step:10,vel:.85}],[{step:0,vel:1},{step:6,vel:.7},{step:9,vel:.55},{step:11,vel:.8}]],eg=[[{step:4,vel:1},{step:7,vel:.16},{step:12,vel:1},{step:15,vel:.14}],[{step:4,vel:1},{step:9,vel:.13},{step:12,vel:1}],[{step:4,vel:1},{step:7,vel:.16},{step:12,vel:1},{step:15,vel:.14}],[{step:4,vel:1},{step:12,vel:1},{step:13,vel:.2},{step:14,vel:.32},{step:15,vel:.5}]],ex=[.9,.3,.55,.28,.85,.3,.55,.32,.9,.3,.55,.28,.85,.3,.6,.35],eb=[[[0,5,38],[6,2,38],[10,3,45],[14,2,48]],[[0,5,43],[6,2,43],[10,3,50],[14,2,53]],[[0,5,36],[6,2,36],[10,3,43],[14,2,47]],[[0,5,33],[6,2,33],[10,3,40],[13,1,43],[14,2,49]]],ey=[[53,57,60,64],[53,57,59,64],[52,55,59,62],[55,59,61,65]],ew=[[0,9,.8],[10,5,.55]];function eA(e,t,a=1){let r=Math.max(1,Math.floor(e.sampleRate*t)),l=e.createBuffer(1,r,e.sampleRate),o=l.getChannelData(0),i=0x9e3779b1*a;for(let e=0;e<r;e++)i^=i<<13,i^=i>>>17,i^=i<<5,o[e]=(i>>>0)/0x100000000*2-1;return l}function eT(e,t,a){let r=Math.floor(e.sampleRate*t),l=e.createBuffer(a,r,e.sampleRate);for(let t=0;t<a;t++){let a=l.getChannelData(t),o=0x1234567+977*t,i=0;for(let t=0;t<r;t++){o^=o<<13,o^=o>>>17;let l=((o^=o<<5)>>>0)/0x100000000*2-1,n=t/r,s=.55-.42*n;i+=(l-i)*s;let c=t<.012*e.sampleRate?0:1;a[t]=i*Math.exp(-6.2*n)*c*.6}}return l}function ek(e){let t=new Float32Array(new ArrayBuffer(4096));for(let a=0;a<1024;a++){let r=a/1023*2-1;t[a]=Math.tanh(r*e)/Math.tanh(e)}return t}function eP(e,t,a,r,l,o,i){let n=ed(l),s=e.createOscillator();s.type="sine",s.frequency.value=n,s.detune.value=i;let c=e.createOscillator();c.type="sine",c.frequency.value=n,c.detune.value=i;let h=e.createGain();h.gain.setValueAtTime(n*(1.6+1.4*o),a),h.gain.setTargetAtTime(.35*n,a+.005,.18),c.connect(h).connect(s.frequency);let u=e.createOscillator();u.type="sine",u.frequency.value=4.02*n;let f=e.createGain();f.gain.setValueAtTime(.05*o,a),f.gain.setTargetAtTime(0,a+.002,.05);let p=e.createGain(),d=a+r;for(let e of(p.gain.setValueAtTime(0,a),p.gain.linearRampToValueAtTime(.16*o,a+.005),p.gain.setTargetAtTime(.09*o,a+.01,.4),p.gain.setTargetAtTime(0,d,.16),s.connect(p).connect(t),u.connect(f).connect(t),[s,c,u]))e.start(a),e.stop(d+1)}function eR(e){let t=new AudioBuffer({length:e.length,numberOfChannels:e.numberOfChannels,sampleRate:e.sampleRate});for(let a=0;a<e.numberOfChannels;a++){let r=e.getChannelData(a),l=t.getChannelData(a);for(let e=0,t=r.length;e<t;e++)l[e]=r[t-1-e]}return t}function eM(e,t,a,r,l){let o=new AudioBuffer({length:r,numberOfChannels:a,sampleRate:e.sampleRate});for(let i=0;i<a;i++){let a=e.getChannelData(t+i),n=o.getChannelData(i);for(let e=0;e<r;e++)n[e]=a[e]*l;for(let e=r;e<a.length;e++)n[e-r]+=a[e]*l}return o}let eS=null;async function eE(e){let t=window.OfflineAudioContext??window.webkitOfflineAudioContext;if(!t)throw Error("turntable: no OfflineAudioContext");let a=Math.round(ep*e),r=new t({numberOfChannels:4,length:a+Math.round(2.5*e),sampleRate:e});r.destination.channelCount=4,r.destination.channelInterpretation="discrete";let l=r.createChannelMerger(4);l.connect(r.destination);let o=r.createGain();o.channelCount=1,o.channelCountMode="explicit";let i=r.createBiquadFilter();i.type="lowpass",i.frequency.value=11e3;let n=r.createWaveShaper();n.curve=ek(1.25),o.connect(n).connect(i).connect(l,0,0);let s=r.createConvolver();s.normalize=!1,s.buffer=eT(r,.7,1);let c=r.createGain();c.gain.value=.22,c.connect(s).connect(o);let h=r.createGain();h.channelCount=1,h.channelCountMode="explicit";let u=r.createBiquadFilter();u.type="lowpass",u.frequency.value=900,u.Q.value=.5;let f=r.createWaveShaper();f.curve=ek(1.8),h.connect(f).connect(u).connect(l,0,1);let p=r.createGain(),d=r.createGain(),m=r.createChannelMerger(2);p.connect(m,0,0),d.connect(m,0,1);let v=r.createBiquadFilter();v.type="lowpass",v.frequency.value=3800;let g=r.createGain();g.gain.value=.82;let x=r.createOscillator();x.frequency.value=4.4;let b=r.createGain();b.gain.value=.16,x.connect(b).connect(g.gain),x.start(0);let y=r.createConvolver();y.normalize=!1,y.buffer=eT(r,1.6,2);let w=r.createGain();w.gain.value=.3;let A=r.createGain();m.connect(v).connect(g).connect(A),g.connect(w).connect(y).connect(A);let T=r.createChannelSplitter(2);A.connect(T),T.connect(l,0,2),T.connect(l,1,3);let k=eA(r,1,7),P=eA(r,1,11),R=eA(r,.2,3),M=(e,t)=>{let a=43758.5453*Math.sin(12.9898*e+78.233*t);return(a-Math.floor(a))*.005};for(let e=0;e<4;e++){let t=16*e;for(let a of ev[e])!function(e,t,a,r,l){let o=e.createOscillator();o.type="sine",o.frequency.setValueAtTime(150,a),o.frequency.exponentialRampToValueAtTime(52,a+.06),o.frequency.exponentialRampToValueAtTime(44,a+.32);let i=e.createGain();i.gain.setValueAtTime(0,a),i.gain.linearRampToValueAtTime(.95*r,a+.003),i.gain.setTargetAtTime(0,a+.03,.11),o.connect(i).connect(t),o.start(a),o.stop(a+.7);let n=e.createBufferSource();n.buffer=l;let s=e.createBiquadFilter();s.type="bandpass",s.frequency.value=3200,s.Q.value=.8;let c=e.createGain();c.gain.setValueAtTime(.28*r,a),c.gain.exponentialRampToValueAtTime(.001,a+.012),n.connect(s).connect(c).connect(t),n.start(a,.1,.03)}(r,o,em(t+a.step)+M(t+a.step,1),a.vel,R);for(let a of eg[e])!function(e,t,a,r,l,o){let i=l<.4,n=e.createBufferSource();n.buffer=o;let s=e.createBiquadFilter();s.type="highpass",s.frequency.value=900;let c=e.createBiquadFilter();c.type="peaking",c.frequency.value=2400,c.gain.value=5,c.Q.value=.8;let h=e.createBiquadFilter();h.type="lowpass",h.frequency.value=i?5200:8200;let u=e.createGain();u.gain.setValueAtTime(0,r),u.gain.linearRampToValueAtTime(.55*l,r+.002),u.gain.setTargetAtTime(0,r+.012,i?.03:.065),n.connect(s).connect(c).connect(h).connect(u),u.connect(t),i||u.connect(a),n.start(r,7.31*r%.5,.5);let f=e.createOscillator();f.type="triangle",f.frequency.setValueAtTime(205,r),f.frequency.exponentialRampToValueAtTime(168,r+.05);let p=e.createGain();p.gain.setValueAtTime(0,r),p.gain.linearRampToValueAtTime(.5*l,r+.002),p.gain.setTargetAtTime(0,r+.01,.035),f.connect(p).connect(t),f.start(r),f.stop(r+.3)}(r,o,c,em(t+a.step)+.006+M(t+a.step,2),a.vel,k);for(let a=0;a<16;a+=1){let l=a%2==0,i=1===e&&11===a||3===e&&(7===a||15===a);if(!l&&!i)continue;let n=3===e&&14===a;!function(e,t,a,r,l,o){let i=e.createBufferSource();i.buffer=o;let n=e.createBiquadFilter();n.type="highpass",n.frequency.value=7200;let s=e.createBiquadFilter();s.type="peaking",s.frequency.value=10500,s.gain.value=6;let c=e.createGain();c.gain.setValueAtTime(0,a),c.gain.linearRampToValueAtTime(.22*r,a+.001),c.gain.setTargetAtTime(0,a+.004,l?.09:.014),i.connect(n).connect(s).connect(c).connect(t),i.start(a,3.17*a%.6,l?.6:.12)}(r,o,em(t+a)+M(t+a,3),ex[a]*(n?.8:1),n,P)}for(let[a,l,o]of eb[e])!function(e,t,a,r,l){let o=ed(l),i=e.createOscillator();i.type="sine",i.frequency.value=o;let n=e.createOscillator();n.type="triangle",n.frequency.value=o;let s=e.createGain();s.gain.value=.32;let c=e.createGain(),h=a+r;c.gain.setValueAtTime(0,a),c.gain.linearRampToValueAtTime(.7,a+.012),c.gain.setTargetAtTime(.5,a+.02,.25),c.gain.setTargetAtTime(0,h,.035),i.connect(c),n.connect(s).connect(c),c.connect(t),i.start(a),n.start(a),i.stop(h+.3),n.stop(h+.3)}(r,h,em(t+a)+.004,l*ef*.92,o);for(let[a,l,o]of ew)ey[e].forEach((e,i)=>{let n=em(t+a)+.007*i+M(t+a+i,4);eP(r,p,n,l*ef,e,o,-4),eP(r,d,n+.003,l*ef,e,.96*o,5)});if(e%2==1){let a=1===e?69:68;eP(r,p,em(t+14),2.5*ef,a,.45,-3),eP(r,d,em(t+14)+.003,2.5*ef,a,.42,4)}}let S=await r.startRendering(),E=0,C=[0,1,2,3].map(e=>S.getChannelData(e));for(let e=0;e<S.length;e+=2)E=Math.max(E,Math.abs(C[0][e]+C[1][e]+C[2][e]),Math.abs(C[0][e]+C[1][e]+C[3][e]));let L=E>0?.78/E:1,$=eM(S,0,1,a,L),V=eM(S,1,1,a,L),q=eM(S,2,2,a,L);return{duration:a/e,stems:[{fwd:$,rev:eR($)},{fwd:V,rev:eR(V)},{fwd:q,rev:eR(q)}],crackle:function(e,t=7){let a=Math.floor(e*t),r=new AudioBuffer({length:a,numberOfChannels:1,sampleRate:e}),l=r.getChannelData(0),o=0x2468ace,i=()=>(o^=o<<13,o^=o>>>17,((o^=o<<5)>>>0)/0x100000000),n=0,s=0;for(let e=0;e<a;e++){let t=2*i()-1;n+=(t-n)*.35,s+=(n-s)*.02,l[e]=(n-s)*.0045}let c=0;for(;;){let t=Math.floor((c+=-Math.log(1-i())/16)*e);if(t>=a)break;let r=.05>i(),o=r?.12+.14*i():.012+i()**3*.06,n=(r?.0016:35e-5+5e-4*i())*e,s=Math.floor(6*n),h=.5>i()?-1:1,u=0;for(let e=0;e<s;e++){let i=h*o*Math.exp(-e/n)*(r?Math.sin(.18*e):1),s=(t+e)%a;l[s]+=i-.6*u,u=i}}return r}(e)}}var eC=e.i(55171);let eL=["arm","record","start","speed33","speed45","cue","pitch"];class e${gl;program;vao;u;label;print;constructor(e){this.gl=e,this.program=(0,eC.createProgram)(e,eC.FULLSCREEN_VERTEX,Y),this.u=(0,eC.uniformLocations)(e,this.program),this.vao=e.createVertexArray(),this.label=this.blank(),this.print=this.blank(),e.useProgram(this.program),e.uniform1i(this.u("uLabel"),0),e.uniform1i(this.u("uPrint"),1)}blank(){let e=this.gl,t=e.createTexture();return e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,new Uint8Array([200,200,200,0])),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),t}upload(e,t,a){let r=this.gl;r.bindTexture(r.TEXTURE_2D,e),r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,a),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,t),r.generateMipmap(r.TEXTURE_2D),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR_MIPMAP_LINEAR),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.LINEAR);let l=r.getExtension("EXT_texture_filter_anisotropic");l&&r.texParameterf(r.TEXTURE_2D,l.TEXTURE_MAX_ANISOTROPY_EXT,4),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1)}setLabel(e){this.upload(this.label,e,!1)}setPrint(e){this.upload(this.print,e,!0)}draw(e){let t=this.gl,a=this.u,r=e.look,l=e.pressing;t.viewport(0,0,e.width,e.height),t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(this.program),t.uniform2f(a("uRes"),e.width,e.height),t.uniform2f(a("uOrigin"),e.originX,e.originY),t.uniform1f(a("uScale"),e.scale),t.uniform1f(a("uDetail"),e.detail),t.uniform3fv(a("uLight"),r.light),t.uniform3fv(a("uKey"),r.key),t.uniform3fv(a("uAmbTop"),r.ambTop),t.uniform3fv(a("uAmbLow"),r.ambLow),t.uniform3fv(a("uEnvHigh"),r.envHigh),t.uniform3fv(a("uEnvLow"),r.envLow),t.uniform3fv(a("uBox"),r.box),t.uniform1f(a("uGround"),r.ground),t.uniform3fv(a("uPlinth"),r.plinth),t.uniform3fv(a("uInk"),r.ink),t.uniform3fv(a("uMetal"),r.metal),t.uniform3fv(a("uDark"),r.dark),t.uniform3fv(a("uGlow"),r.glow),t.uniform3fv(a("uCart"),r.cart),t.uniform3fv(a("uGuard"),r.guard),t.uniform1f(a("uExposure"),r.exposure),t.uniform1f(a("uRim"),r.rim),t.uniform1f(a("uStrobeK"),r.strobe),t.uniform1f(a("uCap"),r.cap),t.uniform3fv(a("uVinyl"),l.vinyl),t.uniform3f(a("uSheen"),l.sheen[0]*r.sheen,l.sheen[1]*r.sheen,l.sheen[2]*r.sheen),t.uniform1f(a("uTrans"),l.trans),t.uniform1f(a("uRecordAngle"),e.recordAngle),t.uniform1f(a("uPlatterAngle"),e.platterAngle),t.uniform1f(a("uPlatterVel"),e.platterVel),t.uniform2f(a("uStrobe"),e.strobe[0],e.strobe[1]),t.uniform1f(a("uLamp"),e.lamp);let{s:o,k:i,h:n,u:s}=e.arm;t.uniform2f(a("uArmS"),o.x,o.y),t.uniform2f(a("uArmK"),i.x,i.y),t.uniform2f(a("uArmH"),n.x,n.y),t.uniform2f(a("uArmU"),s.x,s.y),t.uniform2f(a("uArmSide"),-n.y,n.x),t.uniform1f(a("uLift"),e.lift),t.uniform1f(a("uCue"),e.cue),t.uniform1f(a("uStart"),e.start),t.uniform1f(a("uPower"),e.power),t.uniform2f(a("uSpeedPress"),e.speedPress[0],e.speedPress[1]),t.uniform2f(a("uSpeedLed"),e.speedLed[0],e.speedLed[1]),t.uniform1f(a("uFaderY"),e.faderY),t.uniform1f(a("uLock"),e.lock),t.uniform1fv(a("uHov[0]"),e.hover),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.label),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.print),(0,eC.drawFullscreen)(t,this.vao)}dispose(){let e=this.gl;e.deleteProgram(this.program),e.deleteVertexArray(this.vao),e.deleteTexture(this.label),e.deleteTexture(this.print)}}let eV=(e,t)=>(e%t+t)%t,eq=(e,t,a)=>{let r=Math.min(1,Math.max(0,(a-e)/(t-e)));return r*r*(3-2*r)};class eB{kit;loop;gate;warmth;trim;dc;voice=null;crackle=null;crackleGain;stemLevels=[0,0,0];running=!1;disposed=!1;constructor(e,t){this.kit=e,this.loop=t;const{ctx:a,output:r}=e;this.warmth=a.createBiquadFilter(),this.warmth.type="lowpass",this.warmth.frequency.value=12500,this.warmth.Q.value=.4,this.gate=a.createGain(),this.gate.gain.value=0,this.trim=a.createGain(),this.trim.gain.value=.62,this.dc=a.createBiquadFilter(),this.dc.type="highpass",this.dc.frequency.value=24,this.dc.Q.value=.5,this.gate.connect(this.warmth).connect(this.dc).connect(this.trim).connect(r),this.crackleGain=a.createGain(),this.crackleGain.gain.value=0,this.crackleGain.connect(this.gate)}update(e){if(this.disposed)return;let{ctx:t}=this.kit,a=t.currentTime,r=Math.abs(e.rate),l=e.down&&this.running,o=eq(.004,.07,r);this.gate.gain.setTargetAtTime(l?o:0,a,e.down?.006:.012);for(let t=0;t<3;t++)Math.abs(this.stemLevels[t]-e.stems[t])>.001&&(this.stemLevels[t]=e.stems[t],this.voice&&this.voice.stems[t].gain.setTargetAtTime(e.stems[t],a,.03));if(!l){this.voice&&this.stopVoice(this.voice,.03),this.voice=null,this.crackleGain.gain.setTargetAtTime(0,a,.02);return}let i=e.rate>=0?1:-1;(!this.voice||this.voice.dir!==i&&r>.025)&&(this.voice&&this.stopVoice(this.voice,.005),this.voice=this.startVoice(i,e.position,r));let n=Math.max(1e-4,Math.min(6,r));for(let e of this.voice.sources)e.playbackRate.setTargetAtTime(n,a,.008);this.ensureCrackle(),this.crackle&&this.crackle.playbackRate.setTargetAtTime(Math.max(1e-4,Math.min(4,r)),a,.01),this.crackleGain.gain.setTargetAtTime(1.1+.6*eq(0,1.2,r),a,.03)}setRunning(e){if(this.running!==e&&!this.disposed&&(this.running=e,!e)){let{ctx:e}=this.kit;this.gate.gain.setTargetAtTime(0,e.currentTime,.015),this.voice&&this.stopVoice(this.voice,.04),this.voice=null,this.stopCrackle()}}startVoice(e,t,a){let{ctx:r}=this.kit,l=r.currentTime,o=this.loop.duration,i=eV(t,o),n=e>0?i:eV(o-i,o),s=r.createGain();s.gain.setValueAtTime(0,l),s.gain.linearRampToValueAtTime(1,l+.005),s.connect(this.gate);let c=[],h=this.loop.stems.map((t,o)=>{let i=r.createGain();i.gain.value=this.stemLevels[o],i.connect(s),c.push(i);let h=r.createBufferSource();return h.buffer=e>0?t.fwd:t.rev,h.loop=!0,h.playbackRate.value=Math.max(1e-4,Math.min(6,a)),h.connect(i),h.start(l,n),h});return{dir:e,sources:h,stems:c,gain:s}}stopVoice(e,t){let{ctx:a}=this.kit,r=a.currentTime;for(let a of(e.gain.gain.cancelScheduledValues(r),e.gain.gain.setValueAtTime(e.gain.gain.value,r),e.gain.gain.linearRampToValueAtTime(0,r+t),e.sources))try{a.stop(r+t+.01)}catch{}window.setTimeout(()=>e.gain.disconnect(),(t+.1)*1e3)}ensureCrackle(){if(this.crackle)return;let{ctx:e}=this.kit,t=e.createBufferSource();t.buffer=this.loop.crackle,t.loop=!0,t.connect(this.crackleGain),t.start(e.currentTime,Math.random()*this.loop.crackle.duration),this.crackle=t}stopCrackle(){if(this.crackle){try{this.crackle.stop(this.kit.ctx.currentTime+.05)}catch{}this.crackle=null}}dispose(){this.disposed||(this.setRunning(!1),this.disposed=!0,window.setTimeout(()=>{this.gate.disconnect(),this.crackleGain.disconnect(),this.warmth.disconnect(),this.trim.disconnect(),this.dc.disconnect()},200))}}function eH(e=0){let t=(0,n.getAudio)();if(!t||!(0,n.audioReady)())return null;let{ctx:a,output:r}=t;if(e&&"function"==typeof a.createStereoPanner){let t=a.createStereoPanner();return t.pan.value=Math.max(-1,Math.min(1,e)),t.connect(r),{ctx:a,node:t}}return{ctx:a,node:r}}function eU(e,t,a,r){let l=e.createBufferSource();l.buffer=(0,n.noiseBuffer)(e);let o=e.createBiquadFilter();o.type=r.type,o.frequency.value=r.freq,o.Q.value=r.q??.8;let i=e.createGain();i.gain.setValueAtTime(1e-4,a),i.gain.exponentialRampToValueAtTime(r.gain,a+.0015),i.gain.exponentialRampToValueAtTime(1e-4,a+r.decay),l.connect(o).connect(i).connect(t),l.start(a,.8*Math.random(),r.decay+.05)}function eD(e,t,a,r,l,o){let i=e.createOscillator();i.type="sine",i.frequency.setValueAtTime(1.6*r,a),i.frequency.exponentialRampToValueAtTime(r,a+.02);let n=e.createGain();n.gain.setValueAtTime(1e-4,a),n.gain.exponentialRampToValueAtTime(l,a+.003),n.gain.exponentialRampToValueAtTime(1e-4,a+o),i.connect(n).connect(t),i.start(a),i.stop(a+o+.05)}function ez(e,t=0){let a=eH(t);if(!a)return;let{ctx:r,node:l}=a,o=r.currentTime+.002;"start"===e?(eU(r,l,o,{type:"bandpass",freq:2600,q:1.4,gain:.12,decay:.018}),eD(r,l,o,120,.14,.05),eU(r,l,o+.055,{type:"bandpass",freq:3100,q:1.6,gain:.05,decay:.012})):"speed"===e?(eU(r,l,o,{type:"bandpass",freq:3400,q:1.8,gain:.08,decay:.012}),eD(r,l,o,180,.05,.03)):"cue"===e?(eU(r,l,o,{type:"bandpass",freq:1900,q:1.1,gain:.07,decay:.022}),eD(r,l,o,140,.05,.04)):(eD(r,l,o,95,.1,.06),eU(r,l,o,{type:"bandpass",freq:1500,q:.9,gain:.04,decay:.03}))}let eI=eh.map(e=>({value:e.id,label:e.label,swatch:e.swatch})),e_=[{value:33,label:"33"},{value:45,label:"45"}],eO=[0,0,0],eG=2*Math.PI,ej=["start","s33","s45"],eN=[1,.75,.625],eK=[1,.85,.75];function eF(e,t,a,r){e[0]=(0,s.lerp)(t[0],a[0],r),e[1]=(0,s.lerp)(t[1],a[1],r),e[2]=(0,s.lerp)(t[2],a[2],r)}let eX=["light","key","ambTop","ambLow","envHigh","envLow","box","plinth","ink","metal","dark","glow","cart","guard"],eW=["ground","exposure","rim","sheen","strobe","cap"];function eY({mode:e,theme:t}){let a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let r=a.current;if(!r)return;let l=()=>{let a=r.getBoundingClientRect(),l=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);r.width=Math.max(1,Math.round(a.width*l)),r.height=Math.max(1,Math.round(a.height*l));let o=r.getContext("2d");if(!o)return;let i="dark"===t,n=Math.min(.76*a.width/480,.66*a.height/360),s=a.width/2-240*n,c=a.height/2-180*n;o.setTransform(l*n,0,0,l*n,l*s,l*c),o.shadowColor="rgb(0 0 0 / 0.18)",o.shadowBlur=24*n*l,o.shadowOffsetY=8*n*l,o.fillStyle=i?"#2c2c2f":"#e4e1dc",o.beginPath(),o.roundRect(0,0,480,360,16),o.fill(),o.shadowColor="transparent";let h=(e,t)=>{o.fillStyle=t,o.beginPath(),o.arc(188,180,e,0,eG),o.fill()};h(166,i?"#8a8c90":"#c9cbce"),h(151,"#141414"),h(50,"#ece6d8"),h(3.6,"#9a9a9a");let p=S(P(u[0].outer-9));o.strokeStyle=i?"#b9bbbf":"#a9abaf",o.lineWidth=8,o.lineCap="round",o.beginPath(),o.moveTo(f.x,f.y),o.lineTo(p.k.x,p.k.y),o.lineTo(p.s.x,p.s.y),o.stroke(),o.fillStyle="#1a1a1a",o.beginPath(),o.arc(f.x,f.y,18,0,eG),o.fill()};l();let o=new ResizeObserver(l);return o.observe(r),()=>o.disconnect()},[e,t]),(0,o.jsx)("canvas",{ref:a,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A turntable seen from above":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function({mode:e,active:t,reducedMotion:a,theme:r}){let l,p="stage"===e,[d]=(0,i.useState)(()=>{let t;return(t=new N).reduced=a,"tile"===e?(t.onRest=!1,t.arm.set(P(u[0].outer-9)),t.recordAngle=.55,t.platterAngle=.55,a||(t.motor=!0,t.platterVel=k(33),t.recordVel=k(33))):(t.recordAngle=-.18,t.platterAngle=.3),t}),m=(0,i.useRef)(null),v=(0,i.useRef)(null),g=(0,i.useRef)(!1),x=(0,i.useRef)(null),b=(0,i.useRef)(null),y=(0,i.useRef)(null),w=(0,i.useId)(),A=(0,s.useFinePointer)(),[T,R]=(0,i.useState)(d.motor),[E,C]=(0,i.useState)(33),[L,$]=(0,i.useState)(!1),[B,U]=(0,i.useState)("black"),[D,z]=(0,i.useState)(""),[I,_]=(0,i.useState)(!1),[O,G]=(0,i.useState)(!1),[j,K]=(0,i.useState)("idle"),[F,X]=(0,i.useState)(!0),W=(0,s.useLatest)({reducedMotion:a,theme:r,pressingId:B,stage:p,active:t}),Y=(0,i.useRef)({fit:{ox:0,oy:0,s:1},fitDirty:!0,night:+("dark"===r),acc:0,look:function(e){let t={...e};for(let a of eX)t[a]=[...e[a]];return t}("dark"===r?ec.dark:ec.light),shown:{...l=eu("black"),vinyl:[...l.vinyl],sheen:[...l.sheen]},cue:new s.Spring(0,{stiffness:260,damping:22}),start:new s.Spring(0,{stiffness:900,damping:40}),s33:new s.Spring(0,{stiffness:900,damping:40}),s45:new s.Spring(0,{stiffness:900,damping:40}),fader:new s.Spring(V(0),{stiffness:520,damping:42}),springs:[],lock:1,lastPitchDown:0,led33:1,led45:0,power:+!!d.motor,lamp:+!p,releaseAt:{start:0,s33:0,s45:0},clock:0,keyScratch:0,cueShown:!1,hover:null,hoverAmt:new Float32Array(eL.length),teachAt:-1,coach:"idle",usedArm:!1,usedPitch:!1,started:!1,wide:!0,grab:null,loading:!1,disposed:!1,perf:{time:0,slow:0},renderStep:0,pose:M(),frame:null,sound:{rate:0,position:0,down:!1,stems:eO}}),Z=(0,i.useCallback)(()=>{let e,t,a,r,{width:l,height:o}=et.current;if(l<2||o<2)return;if(W.current.stage){let i=l<560,n=x.current,s=i?28:40,c=o-24,h=n?.getBoundingClientRect(),u=b.current?.querySelectorAll("[data-lab-controls]");h&&u&&u.forEach(e=>{let t=e.getBoundingClientRect();t.height&&(t.top+t.height/2-h.top<o/2?s=Math.max(s,t.bottom-h.top+(i?18:22)):c=Math.min(c,t.top-h.top-(i?22:30)))});let f=i?16:48;e=f,a=l-f,t=s,r=c}else e=.13*l,a=.87*l,t=.12*o,r=.76*o;let i=Math.max(.1,Math.min((a-e)/480,(r-t)/360)),n=Y.current.fit;n.s=i,n.ox=Math.round(((e+a)/2-240*i)*2)/2,n.oy=Math.round(((t+r)/2-180*i)*2)/2,Y.current.fitDirty=!1},[W]),Q=()=>{let e=m.current,t=ee.current,a=Y.current,r=W.current,{width:l,height:o,dpr:i}=et.current;if(!e||!t||l<2||o<2)return!1;a.fitDirty&&Z();let n=i>=1.5?eN:eK,c=r.stage?n[a.renderStep]:1,h=Math.max(1,Math.round(l*i*c)),u=Math.max(1,Math.round(o*i*c));t.width!==h&&(t.width=h),t.height!==u&&(t.height=u);let f=h/l,p=r.reducedMotion,v=a.fit;!function(e,t){let a=ec.light,r=ec.dark;for(let l=0;l<eX.length;l++){let o=eX[l];eF(e[o],a[o],r[o],t)}for(let l=0;l<eW.length;l++){let o=eW[l];e[o]=(0,s.lerp)(a[o],r[o],t)}}(a.look,a.night),S(d.arm.value,a.pose);let g=a.frame??={width:0,height:0,originX:0,originY:0,scale:1,detail:1,look:a.look,pressing:a.shown,recordAngle:0,platterAngle:0,platterVel:0,strobe:d.strobe,lamp:0,arm:a.pose,lift:0,cue:0,start:0,power:0,speedPress:[0,0],speedLed:[0,0],faderY:0,lock:0,hover:a.hoverAmt};return g.width=h,g.height=u,g.originX=v.ox*f,g.originY=v.oy*f,g.scale=v.s*f,g.detail=r.stage?1:.5,g.recordAngle=d.recordAngle%eG,g.platterAngle=d.platterAngle%eG,g.platterVel=p&&!d.motor?0:d.platterVel,g.lamp=a.lamp,g.lift=d.lift.value,g.cue=a.cue.value,g.start=a.start.value,g.power=a.power,g.speedPress[0]=a.s33.value,g.speedPress[1]=a.s45.value,g.speedLed[0]=a.led33,g.speedLed[1]=a.led45,g.faderY=a.fader.value,g.lock=a.lock,e.draw(g),!0},J=(0,s.useFrame)(t,e=>{var t;let a=Y.current,r=W.current,{width:l,height:o}=et.current;if(!m.current||l<2||o<2)return!1;if(!r.stage){if(a.acc+=e,a.acc<1/30-.002)return;e=Math.min(.1,a.acc),a.acc=0}if(a.clock+=e,r.stage&&(d.motor||a.grab)&&a.renderStep<eN.length-1){let t=a.perf;t.time+=e,e>1/45&&(t.slow+=e),t.time>=1.5&&(t.slow>.7*t.time&&(a.renderStep+=1),t.time=0,t.slow=0)}let i=r.reducedMotion;if(d.reduced=i,0!==a.keyScratch){d.held||d.grabRecord();let t=a.keyScratch<0?-1.4:1.8;d.turnRecord(t*k(33)*e)}d.step(e);let n=d.events;for(let e=0;r.stage&&e<n.length;e++){let t=n[e];"touchdown"===t.type?(!function(e,t){let a=eH(.25);if(!a)return;let{ctx:r,node:l}=a,o=r.currentTime+.002,i=Math.min(1,Math.max(.35,e));eD(r,l,o,48,.32*i,.16),eU(r,l,o,{type:"bandpass",freq:1300,q:.6,gain:.05*i,decay:.05}),t&&eU(r,l,o+.01,{type:"highpass",freq:2500,gain:.025,decay:.12})}((0,s.clamp)(t.speed/3),Math.abs(d.recordVel)>.3),"idle"===a.coach&&a.started&&(a.usedArm&&a.usedPitch?a.coach="done":(a.coach="show",a.teachAt=i?-1:a.clock,K("show")))):"liftoff"===t.type?function(){let e=eH(.25);if(!e)return;let{ctx:t,node:a}=e,r=t.currentTime+.002;eD(t,a,r,70,.08,.06),eU(t,a,r,{type:"bandpass",freq:2200,gain:.025,decay:.03})}():"rest"===t.type?ez("rest",.6):"lock"===t.type?function(){let e=eH(.2);if(!e)return;let{ctx:t,node:a}=e,r=t.currentTime+.002;eD(t,a,r,58,.12,.08),eU(t,a,r,{type:"bandpass",freq:1800,q:1.2,gain:.06,decay:.02})}():"band"===t.type&&z(`Needle on ${u[t.band].id}: ${u[t.band].name}`)}n.length=0,d.cueUp!==a.cueShown&&(a.cueShown=d.cueUp,$(d.cueUp)),a.cue.to(+!!d.cueUp);for(let e=0;e<ej.length;e++){let t=ej[e];a.releaseAt[t]&&a.clock>=a.releaseAt[t]&&(a.releaseAt[t]=0,a[t].to(0))}a.fader.to(V(d.pitch)),a.springs.length||a.springs.push(a.cue,a.start,a.s33,a.s45,a.fader);let c=a.springs,h=!0;for(let t=0;t<c.length;t++){let a=c[t];i?a.set(a.target):a.step(e),a.settled||(h=!1)}let f=i?1:1-Math.exp(-(14*e));a.led33=(0,s.lerp)(a.led33,+(33===d.speed),f),a.led45=(0,s.lerp)(a.led45,+(45===d.speed),f),a.power=(0,s.lerp)(a.power,+!!d.motor,f),a.lock=(0,s.lerp)(a.lock,+(0===d.pitch),f),a.lamp=(0,s.lerp)(a.lamp,1,i?1:1-Math.exp(-(2.5*e)));let p=a.grab,v=(t=p?"button"===p.kind?"start"===p.which?"start":"s33"===p.which?"speed33":"speed45":p.kind:a.hover)?eL.indexOf(t):-1,g=a.teachAt>=0?a.clock-a.teachAt:-1;g>2.6&&(a.teachAt=-1);let x=.9*(g<0?0:(0,s.clamp)(g/.45)**2*(1-(0,s.clamp)((g-1.5)/1.1))),b=!0;for(let t=0;t<a.hoverAmt.length;t++){let r=eL[t],l=+(t===v);("arm"===r||"pitch"===r)&&(l=Math.max(l,x));let o=i?l:(0,s.damp)(a.hoverAmt[t],l,25,e);a.hoverAmt[t]=.001>Math.abs(o-l)?l:o,a.hoverAmt[t]!==l&&(b=!1)}let w=+("dark"===r.theme);a.night=i?w:(0,s.damp)(a.night,w,7,e),.002>Math.abs(a.night-w)&&(a.night=w);let A=eu(r.pressingId),T=i?1:1-Math.exp(-(9*e)),P=a.shown;eF(P.vinyl,P.vinyl,A.vinyl,T),eF(P.sheen,P.sheen,A.sheen,T),P.trans=(0,s.lerp)(P.trans,A.trans,T);let R=y.current;if(R){let e=d.currentBand,t=a.sound;t.rate=d.rate,t.position=d.position,t.down=d.needleDown,t.stems=e>=0?u[e].stems:eO,R.update(t)}if(Q(),!d.busy&&h&&b&&a.teachAt<0&&a.night===w&&.001>Math.abs(P.trans-A.trans)&&1e-4>Math.abs(P.vinyl[0]-A.vinyl[0])&&.001>Math.abs(a.power-!!d.motor)&&.001>Math.abs(a.lock-(0===d.pitch))&&a.lamp>.999&&.001>Math.abs(a.led33-(33===d.speed))&&0===a.keyScratch&&!a.releaseAt.start&&!a.releaseAt.s33&&!a.releaseAt.s45)return!1}),{canvasRef:ee,sizeRef:et,supported:er}=(0,s.useWebGL2)({mode:e,attributes:{alpha:!0,antialias:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:e=>{v.current=e;let t=null;try{t=new e$(e)}catch(e){console.error(e);return}return m.current=t,t.setLabel(ea(eu(W.current.pressingId).paper,p?1024:512)),t.setPrint(el(p?3:1.25)),J(),()=>{t?.dispose(),m.current=null}},onResize:e=>{let t=Y.current;t.fitDirty=!0;let a=e.width>=720;a!==t.wide&&(t.wide=a,X(a)),Q(),J()}});(0,i.useEffect)(()=>(g.current=!0,()=>{g.current=!1;let e=v.current;e&&window.setTimeout(()=>{let t=e.canvas,a=t instanceof HTMLCanvasElement&&t.isConnected;g.current||a||e.isContextLost()||(e.getExtension("WEBGL_lose_context")?.loseContext(),t instanceof HTMLCanvasElement&&(t.width=0,t.height=0),v.current===e&&(v.current=null))},0)}),[]);let eo=(0,i.useCallback)(()=>{let e=m.current;e&&(e.setLabel(ea(eu(W.current.pressingId).paper,p?1024:512)),e.setPrint(el(p?3:1.25)),J())},[W,p,J]);(0,i.useEffect)(()=>{let e=!0;return(function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!e||!document.fonts)return Promise.resolve();return Promise.all([document.fonts.load(`500 20px ${e}`),document.fonts.load(`600 20px ${e}`)]).then(()=>void 0,()=>void 0)}catch{return Promise.resolve()}})().then(()=>{e&&eo()}),()=>{e=!1}},[eo]),(0,i.useEffect)(()=>{eo()},[B,eo]),(0,i.useEffect)(()=>{if(!p)return;let e=b.current;if(!e)return;let t=new ResizeObserver(()=>{Y.current.fitDirty=!0,J()});return e.querySelectorAll("[data-lab-controls]").forEach(e=>t.observe(e)),()=>t.disconnect()},[p,J]),(0,i.useEffect)(()=>{J()},[r,a,J]),(0,i.useEffect)(()=>{y.current?.setRunning(t),t&&J()},[t,J]),(0,i.useEffect)(()=>{let e=Y.current;return e.disposed=!1,()=>{e.disposed=!0,y.current?.dispose(),y.current=null}},[]),(0,i.useEffect)(()=>{if("show"!==j)return;let e=window.setTimeout(()=>{Y.current.coach="done",K("done")},4e3);return()=>window.clearTimeout(e)},[j]);let es=e=>{let t=Y.current;"arm"===e?t.usedArm=!0:t.usedPitch=!0,"show"===t.coach&&t.usedArm&&t.usedPitch&&(t.coach="done",K("done"))},eh=(0,i.useCallback)(()=>{if(!W.current.stage)return;let e=(0,n.ensureAudio)(),t=Y.current;!e||y.current||t.loading||(t.loading=!0,(function(e=44100){return eS||(eS=eE(e).catch(e=>{throw eS=null,e}))})(e.ctx.sampleRate).then(a=>{if(t.loading=!1,t.disposed)return;let r=new eB(e,a);r.setRunning(W.current.active),y.current=r,J()}).catch(e=>{t.loading=!1,console.error(e)}))},[W,J]),ef=(e,t=!1)=>{let a=Y.current;a[e].to(1),a.releaseAt[e]=t?0:a.clock+.11},ep=(0,i.useCallback)(e=>{d.setMotor(e),R(e),_(!0),e&&(Y.current.started=!0),z(e?`Playing at ${33===d.speed?"33⅓":"45"}`:"Stopped"),J()},[d,J]),ed=(0,i.useCallback)((e=!0)=>{eh(),e&&ef("start"),ez("start",-.6),ep(!d.motor)},[d,ep,eh]),em=(0,i.useCallback)((e,t=!0)=>{eh(),t&&ef(33===e?"s33":"s45"),ez("speed",.6),d.setSpeed(e),C(e),_(!0),z(33===e?"33⅓ revolutions a minute":"45 revolutions a minute"),J()},[d,eh,J]),ev=(0,i.useCallback)(()=>{eh(),ez("cue",.55);let e=!d.cueUp;d.toggleCue(),$(d.cueUp),Y.current.cueShown=d.cueUp,_(!0),z(e?"Arm lifted":d.onRest||d.arm.target<=P(151)?"Arm lowered":"Needle down"),J()},[d,eh,J]),eg=(0,i.useRef)(0),ex=(0,i.useCallback)(e=>{d.setPitch(e),_(!0),window.clearTimeout(eg.current),eg.current=window.setTimeout(()=>{let e=Math.round(1e3*d.pitch)/10;z(0===e?"Pitch 0, locked":`Pitch ${e>0?"+":"−"}${Math.abs(e).toFixed(1)}%`)},250),J()},[d,J]);(0,i.useEffect)(()=>()=>window.clearTimeout(eg.current),[]);let eb=(e,t)=>{let a=Y.current.fit;return{x:(e-a.ox)/a.s,y:(t-a.oy)/a.s}},ey=(e,t)=>t?"grabbing":"record"===e||"arm"===e||"pitch"===e?"grab":e?"pointer":"",ew=e=>{let t=x.current;t&&t.style.cursor!==e&&(t.style.cursor=e)};(0,s.usePointer)(x,{capture:!0,onDown:e=>{if(!p)return;let t=Y.current,a=eb(e.x,e.y),r="mouse"===e.type?0:10/t.fit.s,l=H(a,d.arm.value,r);if(l){if(eh(),_(!0),"record"===l)d.grabRecord(),t.grab={kind:"record",last:Math.atan2(a.y-180,a.x-188)},ew("grabbing");else if("arm"===l)d.grabArm(Math.atan2(a.y-f.y,a.x-f.x)),t.grab={kind:"arm"},es("arm"),ew("grabbing");else if("start"===l)ef("start",!0),t.grab={kind:"button",which:"start"},ed(!1);else if("speed33"===l||"speed45"===l){let e="speed33"===l?"s33":"s45";ef(e,!0),t.grab={kind:"button",which:e},em("speed33"===l?33:45,!1)}else if("cue"===l)ev();else if("pitch"===l){let e=V(d.pitch),l=Math.abs(a.y-e)<7+r,o=performance.now();es("pitch"),l&&o-t.lastPitchDown<320?(ex(0),t.lastPitchDown=0):(t.lastPitchDown=l?o:0,t.grab={kind:"pitch",offset:l?a.y-e:0},l||ex(q(a.y))),ew("grabbing")}J()}},onMove:e=>{if(!p)return;let t=Y.current,a=eb(e.x,e.y),r=t.grab;if(r?.kind==="record"){let e,t=Math.atan2(a.y-180,a.x-188),l=Math.hypot(a.x-188,a.y-180),o=(0,s.clamp)(l/40);d.turnRecord(Math.atan2(Math.sin(e=t-r.last),Math.cos(e))*o),r.last=t,J()}else if(r?.kind==="arm")d.dragArm(Math.atan2(a.y-f.y,a.x-f.x)),J();else if(r?.kind==="pitch")ex(q(a.y-r.offset));else if(!e.pressed&&"mouse"===e.type){let e=H(a,d.arm.value);e!==t.hover&&(t.hover=e,ew(ey(e,!1)),J())}},onUp:()=>{let e=Y.current,t=e.grab;e.grab=null,t?.kind==="record"?d.releaseRecord():t?.kind==="arm"?d.releaseArm():t?.kind==="button"&&(e.releaseAt[t.which]=e.clock+.06),ew(ey(e.hover,!1)),J()},onLeave:()=>{Y.current.hover=null,ew(""),J()}}),(0,i.useEffect)(()=>{if(!p)return;let e=x.current;if(!e)return;let t=t=>{let a=t.touches[0];if(!a||t.touches.length>1||!t.cancelable)return;let r=e.getBoundingClientRect(),l=Y.current.fit;H({x:(a.clientX-r.left-l.ox)/l.s,y:(a.clientY-r.top-l.oy)/l.s},d.arm.value,10/l.s)&&t.preventDefault()};return e.addEventListener("touchstart",t,{passive:!1}),()=>e.removeEventListener("touchstart",t)},[p,d]);let eA=()=>{let e=Y.current;e.keyScratch&&(e.keyScratch=0,d.releaseRecord({flick:!1}),J())};if(!1===er)return(0,o.jsx)(eY,{mode:e,theme:r});if(!p)return(0,o.jsx)("canvas",{ref:ee,"aria-hidden":"true",className:"absolute inset-0 block size-full"});let eT=O||"show"===j||!I;return(0,o.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,o.jsxs)("div",{ref:x,tabIndex:0,role:"application","aria-roledescription":"turntable","aria-label":"Turntable","aria-describedby":w,onKeyDown:e=>{let t;if(!p||e.altKey||e.ctrlKey||e.metaKey||(t=e.target)instanceof HTMLElement&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;let a=Y.current,r=!0;switch(e.key){case" ":case"Enter":case"k":case"K":e.repeat||ed();break;case"ArrowLeft":case"ArrowRight":eh(),a.keyScratch="ArrowLeft"===e.key?-1:1,_(!0);break;case"ArrowUp":case"ArrowDown":{let t;if(e.repeat)break;eh(),es("arm");let a=d.currentBand,r=d.radius;if(d.onRest)t=0;else if(a>=0)t=a+("ArrowDown"===e.key?1:-1);else{let a=u.findIndex(e=>e.outer<r);t="ArrowDown"===e.key?a<0?u.length-1:a:(a<0?u.length:a)-1}t=(0,s.clamp)(t,0,u.length-1),d.cueBand(t),_(!0),z(`Moving to ${u[t].id}: ${u[t].name}`);break}case"c":case"C":e.repeat||ev();break;case"3":em(33);break;case"4":em(45);break;case"-":case"_":es("pitch"),ex(d.pitch-.005);break;case"=":case"+":es("pitch"),ex(d.pitch+.005);break;case"0":ex(0);break;case"r":case"R":d.onRest||(eh(),d.park(),z("Arm back on its rest"));break;default:r=!1}r&&(e.preventDefault(),e.stopPropagation(),J())},onKeyUp:e=>{if("ArrowLeft"!==e.key&&"ArrowRight"!==e.key)return;let t=Y.current;("ArrowLeft"===e.key?t.keyScratch<0:t.keyScratch>0)&&eA()},onFocus:e=>{e.target===e.currentTarget&&G(e.currentTarget.matches(":focus-visible"))},onBlur:()=>{G(!1),eA()},className:"group/deck absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]",children:[(0,o.jsx)("canvas",{ref:ee,className:"absolute inset-0 block size-full"}),(0,o.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_70%,transparent)] opacity-0 transition-opacity duration-200 group-focus-visible/deck:opacity-100"})]}),(0,o.jsx)("p",{id:w,className:"sr-only",children:"Space starts and stops the platter. Hold the left or right arrow to pull the record back or push it on. Up and down move the needle between the four bands. C lifts or lowers the arm, 3 and 4 choose 33 or 45, minus and plus move the pitch fader by half a percent and 0 sends it back to zero, R puts the arm back on its rest."}),(0,o.jsx)("p",{className:"sr-only","aria-live":"polite",children:D}),(0,o.jsx)("div",{ref:b,children:(0,o.jsxs)(h.StageControls,{placement:"bottom",children:[(0,o.jsxs)(h.TrayRow,{children:[(0,o.jsxs)(h.Tray,{label:"Pressing and sound",children:[(0,o.jsx)(h.Swatches,{label:"Pressing",options:eI,value:B,onChange:e=>{U(e),z(`${eu(e).label}`),J()}}),(0,o.jsx)(h.TrayDivider,{}),(0,o.jsx)(h.MuteButton,{})]}),(0,o.jsxs)(h.Tray,{label:"Deck",children:[(0,o.jsx)(h.TrayButton,{icon:T?(0,o.jsx)(ei,{size:14}):(0,o.jsx)(c.Play,{size:14}),onClick:()=>ed(),className:"w-[78px] px-2.5",children:T?"Stop":"Start"}),(0,o.jsx)(h.TrayDivider,{}),(0,o.jsx)(h.Segmented,{label:"Speed",options:e_,value:E,onChange:e=>em(e)}),(0,o.jsx)(h.TrayDivider,{}),(0,o.jsx)(h.TrayButton,{icon:(0,o.jsx)(en,{up:!L,size:14}),onClick:ev,className:"w-[84px] px-2.5",children:L?"Lower":"Lift"})]})]}),(0,o.jsx)(h.StageHint,{className:eT?"transition-opacity duration-300":"opacity-0 transition-opacity duration-700",children:O?F?"Space start · hold ← → scratch · ↑ ↓ bands · C cue · 3/4 speed · − + 0 pitch · R park":"Space start · hold ← → scratch · ↑ ↓ bands · C cue · − + pitch":"idle"!==j?"Drag the arm · slide the pitch":A?"Press start, then drag the record to scratch":"Tap start, then drag the record to scratch"})]})})]})}],98307)},27796,function(e){e.n(e.i(98307))}]);