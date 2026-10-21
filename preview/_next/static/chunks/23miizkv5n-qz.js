(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,14428,t=>{"use strict";let e;var a,i=t.i(43476),o=t.i(71645),r=t.i(16442),s=t.i(37047),l=t.i(45219);function n(t,e){let a=-.55+.12*(1-Math.min(1,(t*t+e*e)/.95));return a+(.01*Math.sin(7.1*t+1.3)*Math.sin(6.3*e+.4)+.006*Math.sin(13.7*t-11.1*e+2))}let c=n(.03,-.07)-.018,h=.165+.145*Math.tan(.66),f=-.075,u=.085,d=.045,m=.038,p=.085,v=.06,x=.032,y=.06,g=0,b=.085,w=.04,M=.035;function _(t,e,a,i){return{x:t,z:e,h:a,r:i,y:n(t,e)-.012}}let R=[_(-.5,-.31,.62,.19),_(-.22,-.58,.5,.155),_(.52,-.37,.56,.17),_(.47,.27,.33,.115),_(-.47,.3,.27,.095)],T=[[.13,.6,1],[.36,.82,.74],[.58,1,.5]],O=-1.32,A=-1.235,E=.92,S=-1.225,k=.875,F=.022,C=-1.215,B=-.845,N=.862,I=.718,q=-.845,P=-.792,D=.734,z=-.792,W=-.732,$=.71,L=O,U=[0,-.79,0],V=[0,-.2,0],X=(e=Math.hypot((a=[-.5,.86,.4])[0],a[1],a[2])||1,[a[0]/e,a[1]/e,a[2]/e]);function G(){return{k:1,cx:0,cy:0,ppu:100,focal:740,cam:[0,0,7],fwd:[0,0,-1],right:[1,0,0],up:[0,1,0]}}function j(t,e,a,i,o){let r=a?e<520?30:50:.05*e,s=Math.max(40,e-r-(a?i:.05*e)),l=Math.max(40,t-2*(a?20:.055*t));o.cam=[V[0],V[1]+7.4*.15931820661424598,V[2]+7.4*.9872272833756269],o.fwd=[0,-.15931820661424598,-.9872272833756269],o.right=[1,0,0],o.up=[0,.9872272833756269,-.15931820661424598],o.ppu=1,o.focal=7.4,o.cx=0,o.cy=0;let n={x:0,y:0};H([0,1,-.17],o,n);let c=n.y-.02;H([0,O,E],o,n);let h=n.y+.01;H([1,0,0],o,n);let f=Math.min(s/(h-c),l/(2*(n.x+.06)));return o.ppu=f,o.focal=7.4*f,o.cx=t/2,o.cy=r+(s-(h-c)*f)/2-c*f,o}function H(t,e,a){let i=e.cam,o=t[0]-i[0],r=t[1]-i[1],s=t[2]-i[2],l=o*e.fwd[0]+r*e.fwd[1]+s*e.fwd[2];if(l<.001)return!1;let n=o*e.right[0]+r*e.right[1]+s*e.right[2],c=o*e.up[0]+r*e.up[1]+s*e.up[2];return a.x=e.cx+e.focal*n/l,a.y=e.cy-e.focal*c/l,!0}function Y(t,e,a){let i=(e+.955)/1.91*112-.5,o=(a+.955)/1.91*112-.5,r=Math.max(0,Math.min(110,Math.floor(i))),s=Math.max(0,Math.min(110,Math.floor(o))),l=Math.max(0,Math.min(1,i-r)),n=Math.max(0,Math.min(1,o-s)),c=t[112*s+r],h=t[112*s+r+1],f=t[(s+1)*112+r];return(c+(h-c)*l)*(1-n)+(f+(t[(s+1)*112+r+1]-f)*l)*n}let K=1/240,Z={k:230,c:8.4},Q={k:185,c:3.9},J=U[1]-L,tt=E,te=(t,e)=>e*t/(e+t),ta=(t,e)=>e*Math.tanh(t/e),ti={lift:.22,amp:.42,freq:3.1,cycles:3,rise:.14,settle:.2},to={lift:.12,amp:.24,freq:2.7,cycles:2,rise:.16,settle:.24},tr={lift:.3,amp:0,freq:1,cycles:0,rise:.16,settle:0,hop:!0};class ts{x=0;y=0;vx=0;vy=0;roll=0;rollV=0;pitch=0;pitchV=0;yaw=0;yawV=0;held=!1;tx=0;ty=0;lean=0;reachX=1.05;reachUp=.6;script=null;scriptT=0;scriptX0=0;scriptY0=0;grounded=1;contact=!0;prevNeed=0;rot=new Float32Array([1,0,0,0,1,0,0,0,1]);offset=[0,0,0];up=[0,1,0];ax=0;ay=0;omega=[0,0,0];impact=0;rollOut=0;pitchOut=0;yawOut=0;grab(){this.script=null,this.held=!0,this.tx=this.x,this.ty=this.y}setHand(t,e){let a=Math.abs(t),i=this.reachX,o=this.reachUp;this.tx=a>i?Math.sign(t)*(i+te(a-i,Math.min(.3,.5*i))):t,e>o?this.ty=o+te(e-o,Math.min(.2,.6*o)):e<0?this.ty=-te(-e,.06):this.ty=e}release(t,e){this.held=!1,this.script=null,this.vx=Math.max(-7,Math.min(7,t)),this.vy=Math.max(-7,Math.min(Math.sqrt(52*Math.max(0,this.reachUp-this.y)),e))}reset(){this.script=null,this.held=!1,this.x=this.y=this.vx=this.vy=0,this.roll=this.rollV=this.pitch=this.pitchV=this.yaw=this.yawV=0,this.rollOut=this.pitchOut=this.yawOut=0,this.contact=!0,this.prevNeed=0,this.grounded=1,this.impact=0,this.ax=this.ay=0,this.compose()}nudge(t){this.rollV+=2.8*t,this.yawV-=.9*t,this.held||(this.vx+=.35*t)}play(t){this.script=t,this.scriptT=0,this.scriptX0=this.x,this.scriptY0=this.y,this.held=!0,this.tx=this.x,this.ty=this.y}get scripted(){return null!==this.script}get settled(){return!this.held&&.001>Math.abs(this.x)&&.001>Math.abs(this.vx)&&.001>Math.abs(this.vy)&&.001>Math.abs(this.roll-this.lean)&&.001>Math.abs(this.rollV)&&.001>Math.abs(this.pitch)&&.001>Math.abs(this.pitchV)&&.001>Math.abs(this.yaw)&&.001>Math.abs(this.yawV)&&this.y-this.need()<.001}runScript(t){let e=this.script;if(!e)return;this.scriptT+=t;let a=this.scriptT,i=e.cycles/e.freq,o=t=>t*t*(3-2*t);if(a<e.rise){let t=o(a/e.rise);this.tx=this.scriptX0*(1-t),this.ty=this.scriptY0+(Math.min(e.lift,this.reachUp)-this.scriptY0)*t;return}if(e.hop)return void this.release(this.vx,this.vy);let r=a-e.rise;if(r<i){let t=Math.sin(Math.PI*Math.min(1,r/i))**.6,a=Math.min(e.amp,.9*this.reachX);this.tx=a*Math.sin(2*Math.PI*e.freq*r)*t,this.ty=Math.min(e.lift,this.reachUp)+.04*Math.sin(4*Math.PI*e.freq*r)*t;return}let s=r-i;if(s<e.settle){let t=o(s/e.settle);this.tx=0,this.ty=Math.min(e.lift,this.reachUp)*(1-t)+.03*t;return}this.release(this.vx,this.vy)}need(){let t=Math.cos(this.rollOut)*Math.cos(this.pitchOut);return Math.max(0,J*t+tt*Math.sqrt(Math.max(0,1-t*t))-J)}step(t){let e=Math.min(t,.1),a=0,i=0,o=0;for(this.impact=0,this.runScript(t);e>1e-6;){let t,r,s=Math.min(K,e);e-=s,o+=s,this.held?(t=1100*(this.tx-this.x)-63*this.vx,r=1100*(this.ty-this.y)-63*this.vy):(t=-58*this.x-11.6*this.vx,r=-26-.6*this.vy),this.vx+=t*s,this.vy+=r*s,this.x+=this.vx*s,this.y+=this.vy*s;let l=this.need(),n=(l-this.prevNeed)/s;this.prevNeed=l;let c=this.vy;if(this.held)if(this.y<l){let t=n-this.vy;!this.contact&&t>this.impact&&(this.impact=t),this.y=l,this.vy=n,this.contact=!0}else this.y>l+.004&&(this.contact=!1);else if(this.contact)this.y=l,this.vy=n;else if(this.y<=l){let t=Math.max(0,-this.vy);t>this.impact&&(this.impact=t),this.y=l,t>.6?this.vy=.22*t:(this.vy=Math.max(0,n),this.contact=!0);let e=t>.3?.55:.85;this.rollV*=e,this.pitchV*=e,this.yawV*=.8}r+=(this.vy-c)/s;let h=this.held?Z:Q,f=-h.k*(this.roll-(this.held?0:this.lean))-h.c*this.rollV+.42*t,u=-h.k*this.pitch-h.c*this.pitchV-.14*r,d=-55*this.yaw-3.3*this.yawV+.34*t;this.rollV+=f*s,this.pitchV+=u*s,this.yawV+=d*s,this.roll+=this.rollV*s,this.pitch+=this.pitchV*s,this.yaw+=this.yawV*s,this.rollOut=ta(this.roll,.62),this.pitchOut=ta(this.pitch,.36),this.yawOut=ta(this.yaw,.7),a+=t*s,i+=r*s}this.ax=o>0?a/o:0,this.ay=o>0?i/o:0;let r=+!!(!this.held&&this.y-this.need()<.02);this.grounded+=(r-this.grounded)*(1-Math.exp(-(10*t))),this.compose()}compose(){let t=this.rollOut,e=this.pitchOut,a=this.yawOut,i=Math.cos(t),o=Math.sin(t),r=Math.cos(e),s=Math.sin(e),l=Math.cos(a),n=Math.sin(a),c=-o*r,h=i*r,f=this.rot;f[0]=i*l-o*s*n,f[1]=o*l+i*s*n,f[2]=-(r*n),f[3]=c,f[4]=h,f[5]=s,f[6]=i*n+o*s*l,f[7]=o*n-i*s*l,f[8]=r*l,this.up[0]=c,this.up[1]=h,this.up[2]=s;let u=-(J*o+tt*(1-i)*Math.sign(t));this.offset[0]=this.x+this.grounded*u,this.offset[1]=this.y,this.offset[2]=0,this.omega[0]=this.pitchV,this.omega[1]=this.yawV,this.omega[2]=this.rollV}}function tl({size:t=16,className:e,children:a}){return(0,i.jsx)("svg",{width:t,height:t,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:e?`shrink-0 ${e}`:"shrink-0",children:(0,i.jsx)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:a})})}function tn(t){return(0,i.jsxs)(tl,{...t,children:[(0,i.jsx)("circle",{cx:"8",cy:"7",r:"3.6"}),(0,i.jsx)("path",{d:"M5.4 13.6h5.2l-.7-2.3H6.1z"}),(0,i.jsx)("path",{d:"M1.8 5.2c-.5 1.2-.5 2.6 0 3.8"}),(0,i.jsx)("path",{d:"M14.2 5.2c.5 1.2.5 2.6 0 3.8"})]})}function tc(t){return(0,i.jsxs)(tl,{...t,children:[(0,i.jsx)("rect",{x:"3",y:"3",width:"10",height:"10",rx:"1.2"}),(0,i.jsx)("path",{d:"M8 3.4v9.2"}),(0,i.jsx)("path",{d:"M3.4 8h9.2"})]})}var th=t.i(55171);let tf=t=>{let e=t.toFixed(5);return e.includes(".")?e:`${e}.0`},tu=t=>`vec3(${tf(t[0])}, ${tf(t[1])}, ${tf(t[2])})`;function td(t){return[.03+.9130889403123083*t[0]+.40776045305957015*t[2],c+t[1],-.07-.40776045305957015*t[0]+.9130889403123083*t[2]]}function tm(t){return[.9130889403123083*t[0]+.40776045305957015*t[2],t[1],-.40776045305957015*t[0]+.9130889403123083*t[2]]}let tp=td([f,u,.141]),tv=tm([0,0,1]),tx=td([-.186,b,g]),ty=tm([-1,0,0]),tg=td([-.05,.08,.06]);function tb(){let t=R.map(t=>`vec4(${tf(t.x)}, ${tf(t.y)}, ${tf(t.z)}, ${tf(t.h)})`).join(", "),e=R.map(t=>tf(t.r)).join(", ");return`
#define PI 3.14159265
const float R_OUT = ${tf(1)};
const float R_IN = ${tf(.955)};
const float IOR_G = ${tf(1.5)};
const float IOR_W = ${tf(1.33)};
const vec3 PIVOT = ${tu(U)};
const float FLOOR_Y = ${tf(L)};

const vec3 WIN_FRONT = ${tu(tp)};
const vec3 WIN_FRONT_N = ${tu(tv)};
const vec3 WIN_SIDE = ${tu(tx)};
const vec3 WIN_SIDE_N = ${tu(ty)};
const vec3 HEARTH = ${tu(tg)};

// smoothstep that also runs downhill (edge0 > edge1 is undefined for the built-in)
float ss(float a, float b, float x) {
  float t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash13(i), b = hash13(i + vec3(1, 0, 0)), c = hash13(i + vec3(0, 1, 0)), d = hash13(i + vec3(1, 1, 0));
  float e = hash13(i + vec3(0, 0, 1)), g = hash13(i + vec3(1, 0, 1)), h = hash13(i + vec3(0, 1, 1)), k = hash13(i + vec3(1, 1, 1));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}

/* the window light, for the snow, the trees and the flakes */
vec3 windowLight(vec3 p, vec3 n, vec3 col) {
  vec3 l = WIN_FRONT - p;
  float d2 = dot(l, l);
  vec3 ld = l * inversesqrt(d2);
  float face = smoothstep(-0.1, 0.5, -dot(ld, WIN_FRONT_N));
  vec3 lit = col * face * max(0.0, dot(n, ld) * 0.75 + 0.25) / (1.0 + d2 * 70.0);
  l = WIN_SIDE - p;
  d2 = dot(l, l);
  ld = l * inversesqrt(d2);
  face = smoothstep(-0.1, 0.5, -dot(ld, WIN_SIDE_N));
  lit += 0.8 * col * face * max(0.0, dot(n, ld) * 0.75 + 0.25) / (1.0 + d2 * 70.0);
  return lit;
}

const vec4 TREE[${R.length}] = vec4[${R.length}](${t});
const float TREE_R[${R.length}] = float[${R.length}](${e});
`}let tw=`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,tM=`#version 300 es
precision highp float;
in vec4 vCol;
in float vDepth;
in float vPx;
in float vSoft;
uniform sampler2D uSeen;
out vec4 outColor;
void main() {
  float scene = texelFetch(uSeen, ivec2(gl_FragCoord.xy), 0).a;
  if (scene <= 0.0 || vDepth > scene + 0.002) discard;
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = length(q) * (vPx + 1.0) / max(vPx, 1e-3);
  float edge = 1.0 / max(vPx, 1.0);
  float a = 1.0 - smoothstep(1.0 - edge * 1.5, 1.0 + edge, r);
  // sharp flakes have a soft core; out of focus ones are flat discs with a faint rim
  a *= mix(1.0 - 0.45 * r * r, 0.85 + 0.15 * r * r, vSoft);
  if (a <= 0.002) discard;
  outColor = vCol * a;
}
`,t_=`#version 300 es
precision highp float;
uniform sampler2D uSeen;
uniform sampler2D uRefl;
uniform sampler2D uFlakes;
uniform vec2 uCanvas;
uniform vec2 uTexel;
uniform float uDec;
uniform float uExposure;
uniform float uAA;
out vec4 outColor;

float tone(float x) {
  const float K = ${tf(.72)};
  return x < K ? x : K + (1.0 - K) * (1.0 - exp(-(x - K) / (1.0 - K)));
}
vec3 srgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// the three layers put together and toned (linear, 0..1)
vec3 shade(vec2 uv) {
  vec4 a = texture(uSeen, uv);
  vec4 b = texture(uRefl, uv);
  vec4 fl = texture(uFlakes, uv);
  vec3 c = (a.rgb * uDec * (1.0 - fl.a) + fl.rgb * uDec) * b.a + b.rgb * uDec;
  c *= uExposure;
  return clamp(vec3(tone(c.r), tone(c.g), tone(c.b)), 0.0, 1.0);
}
float luma(vec3 c) {
  return sqrt(dot(c, vec3(0.299, 0.587, 0.114)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uCanvas;
  vec3 c = shade(uv);
  if (uAA > 0.5) {
    // FXAA (the small console variant) where the scene is drawn at 1\xd7
    vec2 px = uTexel;
    vec3 nw = shade(uv + vec2(-1.0, -1.0) * px);
    vec3 ne = shade(uv + vec2(1.0, -1.0) * px);
    vec3 sw = shade(uv + vec2(-1.0, 1.0) * px);
    vec3 se = shade(uv + vec2(1.0, 1.0) * px);
    float lNW = luma(nw), lNE = luma(ne), lSW = luma(sw), lSE = luma(se), lM = luma(c);
    float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
    if (lMax - lMin > max(0.04, lMax * 0.1)) {
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
      float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
      float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
      dir = clamp(dir * rcp, vec2(-6.0), vec2(6.0)) * px;
      vec3 a = 0.5 * (shade(uv + dir * (1.0 / 3.0 - 0.5)) + shade(uv + dir * (2.0 / 3.0 - 0.5)));
      vec3 b = a * 0.5 + 0.25 * (shade(uv - dir * 0.5) + shade(uv + dir * 0.5));
      float lB = luma(b);
      c = lB < lMin || lB > lMax ? a : b;
    }
  }
  c = srgb(c);
  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(c, 1.0);
}
`,tR={tile:{steps:56,shadowSteps:14,baseSteps:36},stage:{steps:88,shadowSteps:22,baseSteps:56}};class tT{gl;scene;flakeProg;composite;uS;uF;uC;vao;flakeVao;posBuffer;attrBuffer;capacity;float;seen=null;refl=null;sceneFbo=null;flakes=null;w=0;h=0;maxPoint;constructor(t,e,a){this.gl=t,this.capacity=a,this.scene=(0,th.createProgram)(t,tw,function(t){let e;return`#version 300 es
precision highp float;
precision highp int;
${tb()}
${e=T.map(t=>`vec3(${tf(t[0])}, ${tf(t[1])}, ${tf(t[2])})`).join(", "),`
#define M_SNOW 1.0
#define M_WALL 2.0
#define M_ROOF 3.0
#define M_GLASS 4.0
#define M_FRAME 5.0
#define M_DOOR 6.0
#define M_STONE 7.0
#define M_PINE 8.0
#define M_TRUNK 9.0

const float G_BASE = ${tf(-.55)};
const float G_DOME = ${tf(.12)};
const float G_R2 = ${tf(.95)};

const vec3 CAB_P = vec3(${tf(.03)}, ${tf(c)}, ${tf(-.07)});
const vec2 CAB_CS = vec2(${tf(.9130889403123083)}, ${tf(.40776045305957015)});
const float CAB_WX = ${tf(.19)};
const float CAB_WZ = ${tf(.145)};
const float CAB_RIDGE = ${tf(h)};
const vec2 CAB_SLOPE = vec2(${tf(.6131168519734338)}, ${tf(.7899922314973651)});
const float CAB_OVX = ${tf(.035)};
const float CAB_OVZ = ${tf(.05)};
const float CAB_RT = ${tf(.03)};
const vec3 CHIM = vec3(${tf(.085)}, ${tf(-.045)}, ${tf(.028)});
const float CHIM_TOP = ${tf(h+.07)};
const vec4 WIN_F = vec4(${tf(f)}, ${tf(u)}, ${tf(d)}, ${tf(m)});
const vec4 DOOR = vec4(${tf(p)}, ${tf(v)}, ${tf(x)}, ${tf(y)});
const vec4 WIN_S = vec4(${tf(g)}, ${tf(b)}, ${tf(w)}, ${tf(M)});
const vec3 TIERS[3] = vec3[3](${e});

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
// a cone with its apex at the origin, base radius q.x at height q.y (< 0)
float sdCone(vec3 p, vec2 q) {
  vec2 w = vec2(length(p.xz), p.y);
  vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
  vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
  float k = sign(q.y);
  float d = min(dot(a, a), dot(b, b));
  float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
  return sqrt(d) * sign(s);
}

float groundH(vec2 xz) {
  float r2 = dot(xz, xz);
  float h = G_BASE + G_DOME * (1.0 - min(1.0, r2 / G_R2));
  h += 0.01 * sin(xz.x * 7.1 + 1.3) * sin(xz.y * 6.3 + 0.4) + 0.006 * sin(xz.x * 13.7 - xz.y * 11.1 + 2.0);
  return h;
}

vec3 cabinLocal(vec3 p) {
  vec3 d = p - CAB_P;
  return vec3(CAB_CS.x * d.x - CAB_CS.y * d.z, d.y, CAB_CS.y * d.x + CAB_CS.x * d.z);
}

// the cabin in its own frame; m: material
float sdCabin(vec3 q, out float m) {
  // distance above the roof's underside (a plane through the ridge and the eaves)
  float sB = CAB_SLOPE.x * abs(q.z) + CAB_SLOPE.y * (q.y - CAB_RIDGE);
  float walls = max(sdBox(q - vec3(0.0, CAB_RIDGE * 0.5, 0.0), vec3(CAB_WX, CAB_RIDGE * 0.5, CAB_WZ)), sB);
  // openings: a shallow recess for the windows and the door
  float win = sdBox(q - vec3(WIN_F.x, WIN_F.y, CAB_WZ), vec3(WIN_F.z, WIN_F.w, 0.011));
  float door = sdBox(q - vec3(DOOR.x, DOOR.y, CAB_WZ), vec3(DOOR.z, DOOR.w, 0.007));
  float side = sdBox(q - vec3(-CAB_WX, WIN_S.y, WIN_S.x), vec3(0.011, WIN_S.w, WIN_S.z));
  walls = max(walls, -min(win, min(door, side)));
  float roof = max(abs(sB - CAB_RT * 0.5) - CAB_RT * 0.5, max(abs(q.z) - (CAB_WZ + CAB_OVZ), abs(q.x) - (CAB_WX + CAB_OVX)));
  roof -= 0.003;
  float chim = sdBox(q - vec3(CHIM.x, (CHIM_TOP + CAB_RIDGE - 0.08) * 0.5, CHIM.y), vec3(CHIM.z, (CHIM_TOP - CAB_RIDGE + 0.08) * 0.5, CHIM.z));
  float cap = sdBox(q - vec3(CHIM.x, CHIM_TOP + 0.008, CHIM.y), vec3(CHIM.z + 0.004, 0.006, CHIM.z + 0.004)) - 0.005;
  float d = walls;
  m = M_WALL;
  if (roof < d) { d = roof; m = M_ROOF; }
  if (chim < d) { d = chim; m = M_STONE; }
  if (cap < d) { d = cap; m = M_SNOW; }
  return d;
}

float sdPine(vec3 p, int i, out float m) {
  vec4 t = TREE[i];
  float rb = TREE_R[i];
  vec3 q = p - t.xyz;
  float r = length(q.xz);
  float bound = max(r - rb - 0.02, max(q.y - t.w - 0.02, -q.y - 0.02));
  if (bound > 0.03) { m = M_PINE; return bound; }
  float ang = atan(q.z, q.x);
  float d = 1e3;
  for (int k = 0; k < 3; k++) {
    vec3 tier = TIERS[k];
    float apex = tier.y * t.w;
    float h = (tier.y - tier.x) * t.w;
    float rr = rb * tier.z;
    // scalloped skirts: the rim of each tier droops between branches
    float lobe = 0.5 + 0.5 * sin(ang * 7.0 + float(k) * 1.9 + float(i) * 2.3);
    float rim = ss(apex - h * 0.55, apex - h, q.y);
    float c = sdCone(q - vec3(0.0, apex, 0.0), vec2(rr, -h)) + rim * lobe * rr * 0.08;
    d = min(d, c);
  }
  d *= 0.9;
  float trunk = max(r - 0.016 * (0.6 + rb * 2.5), max(q.y - 0.22 * t.w, -q.y - 0.02));
  m = M_PINE;
  if (trunk < d) { d = trunk; m = M_TRUNK; }
  return d;
}

// the diorama: (distance, material)
vec2 map(vec3 p) {
  float g = (p.y - groundH(p.xz)) * 0.9;
  vec2 res = vec2(g, M_SNOW);
  vec3 q = cabinLocal(p);
  float cb = sdBox(q - vec3(0.0, 0.17, 0.0), vec3(0.27, 0.24, 0.23));
  if (cb < 0.04) {
    float m;
    float c = sdCabin(q, m);
    // the snow banks up against the walls
    float bank = smin(g, c, 0.04);
    res = vec2(bank, c + 0.01 < g ? m : M_SNOW);
  } else {
    res.x = min(res.x, cb);
    if (cb < res.x + 1e-5) res.y = M_SNOW;
  }
  for (int i = 0; i < ${R.length}; i++) {
    float m;
    float d = sdPine(p, i, m);
    if (d < res.x) res = vec2(d, m);
  }
  return res;
}
`}

uniform vec2 uCenter;
uniform float uFocal;
uniform vec3 uCam;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform mat3 uRot;
uniform vec3 uOffset;
uniform vec3 uKey;
uniform vec3 uBg;
uniform float uNight;
uniform float uWin;
uniform float uDark;
uniform float uEnc;
uniform vec3 uFoot;
uniform vec3 uGlobe;
uniform vec3 uFootUp;

layout(location = 0) out vec4 outSeen;
layout(location = 1) out vec4 outRefl;

/* -------------------------------------------------------------------- */
/* the studio                                                            */
/* -------------------------------------------------------------------- */

const vec3 SB_DIR = normalize(vec3(-0.62, 0.62, 0.48));
const vec3 SB_U = normalize(cross(SB_DIR, vec3(0.0, 1.0, 0.0)));
const vec3 SB_V = cross(SB_U, SB_DIR);
const vec3 STRIP_DIR = normalize(vec3(0.78, 0.0, -0.62));

vec3 studio(vec3 d, float rough) {
  float up = d.y;
  vec3 wall = uBg * mix(0.94, 1.12, smoothstep(-0.1, 0.9, up));
  vec3 flo = uBg * 0.8;
  vec3 c = mix(flo, wall, smoothstep(-0.05 - rough * 0.4, 0.05 + rough * 0.4, up));
  // black flags left and right draw the glass's edges
  float flag = smoothstep(0.56 - rough * 0.5, 0.8 + rough * 0.3, abs(d.x)) * (1.0 - smoothstep(0.42, 0.8 + rough, abs(up - 0.12)));
  c *= 1.0 - flag * mix(0.86, 0.6, uDark);
  // the softbox
  float cs = dot(d, SB_DIR);
  if (cs > 0.25) {
    vec2 sq = vec2(dot(d, SB_U), dot(d, SB_V)) / cs;
    vec2 e = abs(sq) - vec2(0.3, 0.44) + 0.12;
    float sd = length(max(e, 0.0)) + min(max(e.x, e.y), 0.0) - 0.12;
    float m = 1.0 - smoothstep(-0.02 - rough * 0.5 - uDark * 0.03, 0.02 + rough * 0.5 + uDark * 0.03, sd);
    float lum = mix(5.0, 0.75, uDark) * (1.0 - 0.45 * dot(sq, sq)) * (0.8 + 0.2 * smoothstep(-0.4, 0.4, sq.y));
    c += m * lum * mix(vec3(1.0, 0.99, 0.97), vec3(0.86, 0.9, 1.0), uDark) / (1.0 + rough * 6.0);
  }
  // a tall strip light behind, on the right
  float sa = dot(normalize(d.xz), normalize(STRIP_DIR.xz));
  float strip = smoothstep(0.9965 - rough * 0.08, 0.9992 + rough * 0.02, sa) * smoothstep(-0.3, -0.12, up) * (1.0 - smoothstep(0.55, 0.75, up));
  c += strip * mix(3.4, 1.1, uDark) * vec3(1.0, 0.98, 0.95) / (1.0 + rough * 24.0);
  return c;
}

/* -------------------------------------------------------------------- */
/* the floor                                                             */
/* -------------------------------------------------------------------- */

float ellipseShadow(vec2 at, vec2 c, vec2 dir, float stretch, float r, float soft) {
  vec2 e = at - c;
  vec2 u = vec2(dot(e, dir) / stretch, dot(e, vec2(-dir.y, dir.x)));
  return 1.0 - smoothstep(r - soft, r + soft, length(u));
}

vec3 floorColor(vec3 ro, vec3 rd) {
  if (rd.y > -1e-4) return uBg;
  float t = (FLOOR_Y - ro.y) / rd.y;
  vec3 p = ro + rd * t;
  float lift = max(0.0, uFoot.y - FLOOR_Y);
  float d = length(p.xz - uFoot.xz);
  // contact under the foot: tight while it sits, loose and faint as it rises
  float tilt = clamp(1.0 - uFootUp.y, 0.0, 1.0);
  float contact = (1.0 - smoothstep(${tf(.7*E)}, ${tf(E+.08)} + lift * 1.8 + tilt * 0.6, d)) * mix(0.62, 0.06, clamp(lift * 2.6, 0.0, 1.0));
  // cast shadows along the key light
  vec2 dirL = normalize(-uKey.xz);
  float run = length(uKey.xz) / uKey.y;
  float stretch = 1.0 / max(0.3, uKey.y);
  vec3 bc = uFoot + uFootUp * 0.3;
  vec2 cb = bc.xz + dirL * (bc.y - FLOOR_Y) * run;
  float baseCast = ellipseShadow(p.xz, cb, dirL, stretch, 0.86, 0.36 + lift * 0.4);
  vec2 cg = uGlobe.xz + dirL * (uGlobe.y - FLOOR_Y) * run;
  float globeCast = ellipseShadow(p.xz, cg, dirL, stretch, 0.9, 0.55);
  float caustic = ellipseShadow(p.xz, cg + dirL * 0.2, dirL, stretch, 0.18, 0.2);
  float sh = max(contact, baseCast * 0.3) + globeCast * 0.06;
  vec3 col = uBg * (1.0 - clamp(sh, 0.0, 0.9));
  col += uBg * caustic * 0.09 * (1.0 - uDark);
  // at night the cabin glows through the water onto the floor
  float spill = exp(-dot(p.xz - uGlobe.xz, p.xz - uGlobe.xz) * 0.9);
  col += vec3(1.0, 0.5, 0.18) * uWin * uNight * spill * 0.016;
  return col;
}

/* -------------------------------------------------------------------- */
/* the turned base                                                       */
/* -------------------------------------------------------------------- */

float sdBox2(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

// (distance, material: 0 walnut, 1 brass)
vec2 mapBase(vec3 p) {
  vec2 q = vec2(length(p.xz), p.y);
  float foot = sdBox2(q - vec2(0.0, ${tf((O+A)/2)}), vec2(${tf(E-.035)}, ${tf((A-O)/2-.035)})) - 0.035;
  float bead = length(q - vec2(${tf(k)}, ${tf(S)})) - ${tf(F)};
  float t = clamp((${tf(B)} - q.y) / ${tf(B-C)}, 0.0, 1.0);
  float rr = ${tf(I)} + ${tf(N-I)} * pow(t, 2.2);
  float body = max((q.x - rr) * 0.8, max(q.y - ${tf(B)}, ${tf(C-.01)} - q.y));
  float collar = sdBox2(q - vec2(0.0, ${tf((z+W)/2)}), vec2(${tf($-.012)}, ${tf((W-z)/2-.012)})) - 0.012;
  float band = sdBox2(q - vec2(0.0, ${tf((q+P)/2)}), vec2(${tf(D-.006)}, ${tf((P-q)/2)})) - 0.006;
  float wood = smin(smin(foot, bead, 0.02), body, 0.025);
  wood = min(wood, collar);
  return band < wood ? vec2(band, 1.0) : vec2(wood, 0.0);
}

vec3 baseNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0) * 0.0007;
  return normalize(k.xyy * mapBase(p + k.xyy).x + k.yyx * mapBase(p + k.yyx).x + k.yxy * mapBase(p + k.yxy).x + k.xxx * mapBase(p + k.xxx).x);
}

// ray against the base's bounding cylinder, then marched
float traceBase(vec3 ro, vec3 rd, out float mat) {
  mat = 0.0;
  const float RB = ${tf(E+.01)};
  const float Y0 = ${tf(O-.005)};
  const float Y1 = ${tf(W+.005)};
  float a = dot(rd.xz, rd.xz);
  float b = dot(ro.xz, rd.xz);
  float c = dot(ro.xz, ro.xz) - RB * RB;
  float h = b * b - a * c;
  if (h < 0.0) return 1e9;
  h = sqrt(h);
  float t0 = (-b - h) / a;
  float t1 = (-b + h) / a;
  float ty0 = (Y0 - ro.y) / rd.y;
  float ty1 = (Y1 - ro.y) / rd.y;
  t0 = max(t0, min(ty0, ty1));
  t1 = min(t1, max(ty0, ty1));
  if (t0 > t1 || t1 < 0.0) return 1e9;
  float t = max(t0, 0.0);
  for (int i = 0; i < ${t.baseSteps}; i++) {
    vec2 d = mapBase(ro + rd * t);
    if (d.x < 0.0004 * t) { mat = d.y; return t; }
    t += d.x;
    if (t > t1) break;
  }
  return 1e9;
}

vec3 shadeBase(vec3 pO, vec3 rdW, float mat) {
  vec3 nO = baseNormal(pO);
  vec3 n = uRot * nO;
  float ndl = max(0.0, dot(n, uKey));
  vec3 keyS = mix(vec3(1.0, 0.97, 0.92) * 1.6, vec3(0.8, 0.84, 1.0) * 0.4, uDark);
  vec3 amb = mix(uBg * 0.5, vec3(0.012, 0.012, 0.016), uDark) * (0.6 + 0.4 * n.y);
  vec3 r = reflect(rdW, n);
  float cosv = max(0.0, -dot(rdW, n));
  // a little light from the window comes down through the water onto the collar
  float warm = uWin * uNight * smoothstep(-0.9, -0.72, pO.y) * 0.08;
  if (mat > 0.5) {
    // brass: brushed round the turning
    vec3 f0 = vec3(0.92, 0.7, 0.38);
    vec3 fr = f0 + (1.0 - f0) * pow(1.0 - cosv, 5.0);
    float brush = 0.92 + 0.08 * sin(pO.y * 900.0);
    vec3 col = studio(r, 0.18) * fr * brush * 0.85;
    col += f0 * (keyS * ndl * 0.25 + amb * 0.3);
    col += vec3(1.0, 0.6, 0.25) * warm * 2.0;
    return col;
  }
  // walnut: growth rings cut across by the turning, under a clear coat
  float rings = length(vec2(pO.z + 2.4, pO.y * 0.55 + pO.x * 0.1)) * 58.0 + noise3(pO * vec3(2.5, 7.0, 2.5)) * 3.0;
  float g = smoothstep(0.2, 1.0, abs(fract(rings) * 2.0 - 1.0));
  float streak = noise3(vec3(pO.x * 6.0, pO.y * 140.0, pO.z * 6.0));
  float pore = step(0.83, noise3(pO * vec3(220.0, 60.0, 220.0)));
  vec3 alb = mix(vec3(0.085, 0.048, 0.028), vec3(0.15, 0.088, 0.05), g * 0.55 + streak * 0.45) * (1.0 - 0.18 * pore);
  vec3 col = alb * (keyS * ndl + amb) * mix(1.0, 2.2, uDark);
  col += alb * vec3(1.0, 0.6, 0.3) * warm * 6.0;
  float fr = 0.04 + 0.96 * pow(1.0 - cosv, 5.0);
  col += studio(r, 0.06) * fr * 0.85;
  return col;
}

/* -------------------------------------------------------------------- */
/* the diorama                                                           */
/* -------------------------------------------------------------------- */

vec3 sceneNormal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0) * 0.0009;
  return normalize(k.xyy * map(p + k.xyy).x + k.yyx * map(p + k.yyx).x + k.yxy * map(p + k.yxy).x + k.xxx * map(p + k.xxx).x);
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0;
  float t = 0.012;
  for (int i = 0; i < ${t.shadowSteps}; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.01, 0.09);
    if (res < 0.02 || t > 1.1) break;
  }
  return clamp(res, 0.0, 1.0);
}

float occlusion(vec3 p, vec3 n) {
  float o = 0.0;
  float s = 1.0;
  for (int i = 1; i <= 3; i++) {
    float h = 0.012 * float(i * i) + 0.006;
    o += (h - map(p + n * h).x) * s;
    s *= 0.62;
  }
  return clamp(1.0 - 3.2 * o, 0.0, 1.0);
}

// The sky painted behind the scene. Through the lens the exit point folds
// back near the rim, so the painting is placed by the average of where the
// ray enters the water and where it leaves it, which runs smoothly across
// the globe: u across, v up (about -0.7 .. 0.65).
float ridgeAt(float u) {
  return -0.2 + 0.075 * sin(u * 4.3 + 1.1) + 0.05 * sin(u * 9.1 + 0.4) + 0.022 * sin(u * 21.0 + 2.0);
}

vec3 backdrop(vec2 uv) {
  float u = uv.x;
  float v = uv.y;
  // day: a clear winter sky, paler toward the hills
  vec3 day = mix(vec3(0.8, 0.87, 0.96), vec3(0.3, 0.5, 0.88), ss(-0.32, 0.6, v));
  day += vec3(1.0, 0.9, 0.72) * 0.25 * exp(-5.0 * dot(uv - vec2(-0.55, 0.42), uv - vec2(-0.55, 0.42)));
  // night: deep blue, stars, the moon
  vec3 night = mix(vec3(0.075, 0.09, 0.21), vec3(0.012, 0.02, 0.06), ss(-0.35, 0.6, v));
  vec2 sc = uv * 70.0;
  float star = step(0.985, hash12(floor(sc))) * ss(0.4, 0.0, length(fract(sc) - 0.5));
  night += vec3(0.8, 0.85, 1.0) * star * (0.4 + 0.6 * hash12(floor(sc) + 7.0)) * ss(-0.18, 0.15, v) * 1.5;
  vec2 mp = uv - vec2(0.34, 0.34);
  float md = length(mp);
  night += vec3(0.6, 0.7, 1.0) * 0.16 * exp(-md * 6.0);
  float moon = 1.0 - smoothstep(0.055, 0.063, md);
  float lit = smoothstep(-0.05, 0.03, dot(mp, normalize(vec2(-0.8, 0.5))) + 0.02);
  night = mix(night, vec3(0.97, 0.95, 0.88) * (1.15 - 0.3 * noise3(vec3(mp * 70.0, 1.0))) * mix(0.18, 1.0, lit), moon);
  // far mountains: lit from the left, snow on the tops
  float ridge = ridgeAt(u);
  float slope = (ridgeAt(u + 0.01) - ridge) / 0.01;
  float mtn = ss(ridge + 0.004, ridge - 0.004, v);
  float face = clamp(0.5 - slope * 0.6, 0.0, 1.0);
  float cap = ss(ridge - 0.09, ridge - 0.015, v) * (0.55 + 0.45 * noise3(vec3(u * 30.0, v * 30.0, 2.0)));
  vec3 mDay = mix(vec3(0.46, 0.55, 0.72), vec3(0.62, 0.7, 0.84), face);
  mDay = mix(mDay, mix(vec3(0.74, 0.8, 0.9), vec3(0.95, 0.97, 1.0), face), cap);
  vec3 mNight = mix(vec3(0.03, 0.045, 0.1), vec3(0.08, 0.1, 0.2), face);
  mNight = mix(mNight, mix(vec3(0.1, 0.13, 0.24), vec3(0.3, 0.36, 0.55), face), cap);
  // a band of forest nearer in
  float saw = 1.0 - abs(fract(u * 13.0) * 2.0 - 1.0);
  float tl = -0.4 + 0.045 * saw * (0.6 + 0.4 * sin(u * 3.7 + 1.0)) + 0.015 * sin(u * 5.0);
  float wood = ss(tl + 0.004, tl - 0.004, v);
  day = mix(mix(day, mDay, mtn), vec3(0.24, 0.36, 0.42), wood);
  night = mix(mix(night, mNight, mtn), vec3(0.018, 0.03, 0.065), wood);
  return mix(day, night, uNight);
}

vec3 shadeDiorama(vec3 p, vec3 rd, float mat, vec3 L) {
  vec3 n = sceneNormal(p);
  vec3 keyCol = mix(vec3(1.0, 0.94, 0.84) * 2.25, vec3(0.55, 0.66, 1.0) * 0.5, uNight);
  vec3 skyCol = mix(vec3(0.6, 0.72, 0.96) * 0.62, vec3(0.12, 0.17, 0.36) * 0.42, uNight);
  vec3 winCol = vec3(1.0, 0.56, 0.22) * 2.6 * uWin;
  float ndl = dot(n, L);
  float sh = ndl > -0.25 ? softShadow(p + n * 0.006, L) : 0.0;
  float ao = occlusion(p, n);
  vec3 alb;
  float wrap = 0.0;
  float spec = 0.0;
  vec3 emit = vec3(0.0);
  vec3 q = cabinLocal(p);
  if (mat == M_SNOW) {
    alb = vec3(0.92, 0.94, 0.98);
    // packed against the glass low down: a little greyer with depth
    float under = clamp((groundH(p.xz) - p.y) * 5.0, 0.0, 1.0);
    alb *= 1.0 - 0.1 * under;
    // a trodden path from the door
    float path = (1.0 - smoothstep(0.024, 0.04, abs(q.x - DOOR.x + 0.01 * sin(q.z * 30.0)))) * smoothstep(CAB_WZ, CAB_WZ + 0.03, q.z) * (1.0 - smoothstep(0.32, 0.5, q.z));
    alb *= 1.0 - 0.13 * path;
    wrap = 0.3;
    spec = 1.0;
  } else if (mat == M_WALL) {
    // round logs: a groove every 2.4 cm, each log shaded as a cylinder
    float f = fract(q.y / 0.024);
    vec3 bend = vec3(0.0, (0.5 - f) * 1.4, 0.0);
    n = normalize(n + bend);
    ndl = dot(n, L);
    float groove = smoothstep(0.0, 0.12, f) * ss(1.0, 0.86, f);
    float grain = noise3(vec3(q.x * 40.0, q.y * 300.0, q.z * 40.0));
    alb = vec3(0.17, 0.09, 0.05) * (0.55 + 0.45 * groove) * (0.85 + 0.3 * grain);
    // the window frames, door and trim
    float onFront = step(CAB_WZ - 0.013, q.z);
    vec2 wf = abs(q.xy - WIN_F.xy) - WIN_F.zw;
    vec2 dd = abs(q.xy - DOOR.xy) - DOOR.zw;
    vec2 sw = abs(q.zy - WIN_S.xy) - WIN_S.zw;
    float onSide = step(q.x, -CAB_WX + 0.013);
    if (onFront > 0.5 && max(wf.x, wf.y) < 0.0) {
      if (q.z < CAB_WZ - 0.009) {
        mat = M_GLASS;
        vec2 g = q.xy - WIN_F.xy;
        float bar = min(abs(g.x), abs(g.y));
        if (bar < 0.0045) mat = M_FRAME;
      } else mat = M_FRAME;
    } else if (onSide > 0.5 && max(sw.x, sw.y) < 0.0) {
      if (q.x > -CAB_WX + 0.009) {
        mat = M_GLASS;
        float bar = abs(q.z - WIN_S.x);
        if (bar < 0.004) mat = M_FRAME;
      } else mat = M_FRAME;
    } else if (onFront > 0.5 && max(dd.x, dd.y) < 0.0) {
      mat = M_DOOR;
    } else if (max(wf.x, wf.y) < 0.012 && max(wf.x, wf.y) > 0.0 && onFront > 0.5) {
      alb = vec3(0.62, 0.56, 0.48);
    } else if (max(sw.x, sw.y) < 0.011 && max(sw.x, sw.y) > 0.0 && onSide > 0.5) {
      alb = vec3(0.62, 0.56, 0.48);
    }
    if (mat == M_FRAME) alb = vec3(0.66, 0.6, 0.52);
    if (mat == M_DOOR) {
      float plank = smoothstep(0.0, 0.15, fract((q.x - DOOR.x) / 0.016 + 0.5)) * 0.25 + 0.75;
      alb = vec3(0.24, 0.12, 0.06) * plank;
    }
    if (mat == M_GLASS) {
      vec2 g = mat == M_GLASS && onFront > 0.5 ? (q.xy - WIN_F.xy) / WIN_F.zw : vec2((q.z - WIN_S.x) / WIN_S.z, (q.y - WIN_S.y) / WIN_S.w);
      // dark glass by day; at night the room behind it glows, warmer and brighter low down
      alb = vec3(0.02, 0.025, 0.035);
      float room = 0.7 + 0.3 * ss(1.0, -1.0, g.y) - 0.15 * dot(g, g);
      emit = vec3(1.0, 0.6, 0.26) * 3.2 * uWin * room;
      vec3 r = reflect(rd, n);
      emit += mix(vec3(0.55, 0.66, 0.85), vec3(0.06, 0.08, 0.16), uNight) * 0.35 * smoothstep(-0.2, 0.6, r.y);
    }
  } else if (mat == M_ROOF) {
    float top = smoothstep(0.35, 0.6, n.y);
    float sB = CAB_SLOPE.x * abs(q.z) + CAB_SLOPE.y * (q.y - CAB_RIDGE);
    top = max(top, smoothstep(CAB_RT * 0.45, CAB_RT * 0.7, sB));
    alb = mix(vec3(0.1, 0.06, 0.04), vec3(0.93, 0.95, 0.99), top);
    wrap = 0.3 * top;
    spec = top;
  } else if (mat == M_STONE) {
    vec2 st = vec2(q.x + q.z, q.y) / vec2(0.022, 0.016);
    st.x += floor(st.y) * 0.5;
    float joint = smoothstep(0.0, 0.12, min(fract(st.x), fract(st.y))) * ss(1.0, 0.88, max(fract(st.x), fract(st.y)));
    alb = vec3(0.3, 0.28, 0.27) * (0.7 + 0.3 * joint) * (0.85 + 0.3 * hash12(floor(st)));
  } else if (mat == M_PINE) {
    float nv = noise3(p * 90.0);
    alb = mix(vec3(0.03, 0.085, 0.055), vec3(0.06, 0.14, 0.08), nv);
    // snow lies on the upper side of the boughs
    float lie = ss(0.45 + 0.25 * noise3(p * 40.0), 0.78, n.y);
    alb = mix(alb, vec3(0.9, 0.93, 0.98), lie);
    wrap = 0.25 * lie;
    spec = lie;
  } else {
    alb = vec3(0.12, 0.07, 0.04);
  }

  vec3 h = normalize(L - rd);
  float diff = max(0.0, (ndl + wrap) / (1.0 + wrap));
  vec3 col = alb * keyCol * diff * sh;
  col += alb * skyCol * (0.55 + 0.45 * n.y) * ao;
  // snow scatters a little blue light into its own shadows
  col += alb * spec * vec3(0.12, 0.17, 0.3) * (1.0 - sh) * (1.0 - uNight) * 0.6 * ao;
  col += alb * windowLight(p, n, winCol) * mix(0.6, 1.0, ao);
  // glints in the snow
  if (spec > 0.0) {
    vec3 cell = floor(p * 520.0);
    float g = step(0.9955, hash13(cell));
    col += keyCol * g * spec * pow(max(0.0, dot(n, h)), 24.0) * sh * 2.2;
    col += winCol * g * spec * 0.25 * ss(0.35, 0.0, length(p - WIN_FRONT));
  }
  col += emit;
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec3 rdW = normalize(uFwd * uFocal + uRight * (frag.x - uCenter.x) + uUp * (frag.y - uCenter.y));
  mat3 inv = transpose(uRot);
  vec3 roO = inv * (uCam - PIVOT - uOffset) + PIVOT;
  vec3 rdO = inv * rdW;

  vec3 behind = floorColor(uCam, rdW);
  float bm;
  float tb = traceBase(roO, rdO, bm);
  if (tb < 1e8) behind = shadeBase(roO + rdO * tb, rdW, bm);

  vec4 seen = vec4(behind, 0.0);
  vec4 refl = vec4(0.0, 0.0, 0.0, 1.0);

  // the glass
  float b = dot(roO, rdO);
  float c = dot(roO, roO) - R_OUT * R_OUT;
  float disc = b * b - c;
  float closest = length(roO - rdO * b);
  float pixel = max(-b, 0.1) / uFocal;
  float cover = clamp((R_OUT - closest) / pixel + 0.5, 0.0, 1.0);
  if (disc > -0.05 && cover > 0.0) {
    float tg = -b - sqrt(max(disc, 0.0));
    if (tg < tb) {
      vec3 P1 = roO + rdO * tg;
      vec3 N1 = normalize(P1);
      float cosi = clamp(-dot(rdO, N1), 0.0, 1.0);
      float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);
      vec3 rr = studio(uRot * reflect(rdO, N1), 0.0);
      vec3 d1 = refract(rdO, N1, 1.0 / IOR_G);
      vec3 col;
      float depth = 0.0;
      float bi = dot(P1, d1);
      float ci = dot(P1, P1) - R_IN * R_IN;
      float hi = bi * bi - ci;
      if (hi > 0.0 && dot(d1, d1) > 0.5) {
        vec3 P2 = P1 + d1 * (-bi - sqrt(hi));
        vec3 N2 = P2 / R_IN;
        vec3 d2 = refract(d1, N2, IOR_G / IOR_W);
        float tE = -2.0 * dot(P2, d2);
        vec3 L = inv * uKey;
        float t = 0.0;
        float mat = -1.0;
        for (int i = 0; i < ${t.steps}; i++) {
          vec2 h = map(P2 + d2 * t);
          if (h.x < 0.0005 + 0.0008 * t) { mat = h.y; break; }
          t += h.x;
          if (t > tE) break;
        }
        vec3 waterCol = mix(vec3(0.7, 0.8, 0.95), vec3(0.04, 0.055, 0.12), uNight);
        if (mat > 0.0 && t < tE) {
          col = shadeDiorama(P2 + d2 * t, d2, mat, L);
        } else {
          t = tE;
          vec3 E = P2 + d2 * tE;
          col = backdrop(0.5 * (P2.xy + E.xy) / R_IN);
        }
        // a hint of the water, and the window's glow hanging in it
        col = mix(col, waterCol, (1.0 - exp(-t * 0.2)) * 0.32);
        float glow = 0.0;
        float tc = clamp(dot(WIN_FRONT - P2, d2), 0.0, t);
        vec3 cp = P2 + d2 * tc - WIN_FRONT;
        glow += 0.0016 / (dot(cp, cp) + 0.0022);
        tc = clamp(dot(WIN_SIDE - P2, d2), 0.0, t);
        cp = P2 + d2 * tc - WIN_SIDE;
        glow += 0.0011 / (dot(cp, cp) + 0.0022);
        col += vec3(1.0, 0.5, 0.18) * glow * uWin;
        depth = t / (2.0 * R_IN);
      } else {
        // the rim: only glass on this path
        float bo = dot(P1, d1);
        vec3 P3 = P1 + d1 * (-2.0 * bo);
        vec3 N3 = P3 / R_OUT;
        vec3 d3 = refract(d1, -N3, IOR_G);
        if (dot(d3, d3) < 0.5) d3 = reflect(d1, -N3);
        col = floorColor(uRot * (P3 - PIVOT) + PIVOT + uOffset, uRot * d3) * vec3(0.72, 0.8, 0.78);
      }
      vec4 glassSeen = vec4(col, depth);
      // the silhouette is blended over what is behind it
      seen = vec4(mix(behind, glassSeen.rgb, cover), cover > 0.5 ? glassSeen.a : 0.0);
      refl = vec4(rr * F * cover, mix(1.0, 1.0 - F, cover));
    }
  }
  outSeen = vec4(seen.rgb * uEnc, seen.a);
  outRefl = vec4(refl.rgb * uEnc, refl.a);
}
`}(tR[e])),this.flakeProg=(0,th.createProgram)(t,`#version 300 es
precision highp float;
${tb()}
layout(location = 0) in vec4 aPos;
layout(location = 1) in vec4 aAttr;

uniform vec3 uCamO;
uniform mat3 uRot;
uniform vec3 uOffset;
uniform vec3 uCam;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform float uFocal;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uTime;
uniform float uNight;
uniform float uWin;
uniform float uStir;
uniform float uFocus;
uniform float uDof;
uniform float uMinPx;
uniform float uEnc;
uniform vec3 uKeyO;

out vec4 vCol;
out float vDepth;
out float vPx;
out float vSoft;

vec2 trace(vec2 c, float th, out vec2 s2) {
  vec2 s = R_OUT * vec2(cos(th), sin(th));
  vec2 d = normalize(s - c);
  vec2 d1 = refract(d, s / R_OUT, 1.0 / IOR_G);
  float b = dot(s, d1);
  float cc = dot(s, s) - R_IN * R_IN;
  float h = b * b - cc;
  if (h < 0.0) { s2 = s; return vec2(0.0); }
  s2 = s + d1 * (-b - sqrt(h));
  return refract(d1, s2 / R_IN, IOR_G / IOR_W);
}

void main() {
  vec3 p = aPos.xyz;
  float rad = abs(aPos.w);
  bool resting = aPos.w < 0.0;
  float seed = aAttr.x;
  float kind = aAttr.y;

  float cl = length(uCamO);
  vec3 e1 = uCamO / cl;
  float al = dot(p, e1);
  vec3 perp = p - al * e1;
  float py = length(perp);
  vec3 e2 = py > 1e-6 ? perp / py : normalize(cross(e1, vec3(0.0, 1.0, 0.0)));
  vec2 c = vec2(cl, 0.0);
  vec2 qp = vec2(al, py);
  float lo = 0.0;
  float hi = acos(R_OUT / cl) - 1e-4;
  vec2 s2;
  for (int i = 0; i < 16; i++) {
    float th = 0.5 * (lo + hi);
    vec2 d2 = trace(c, th, s2);
    float res = dot(d2, d2) < 0.5 ? 1.0 : d2.x * (qp.y - s2.y) - d2.y * (qp.x - s2.x);
    if (res < 0.0) lo = th; else hi = th;
  }
  float th = 0.5 * (lo + hi);
  vec2 d2 = trace(c, th, s2);
  float miss = dot(d2, d2) < 0.5 ? 1.0 : abs(d2.x * (qp.y - s2.y) - d2.y * (qp.x - s2.x));
  float along = dot(qp - s2, d2);
  if (miss > 0.01 || along < 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  vec3 S = R_OUT * (cos(th) * e1 + sin(th) * e2);
  vec3 Sw = uRot * (S - PIVOT) + PIVOT + uOffset;
  vec3 v = Sw - uCam;
  float z = dot(v, uFwd);
  vec2 px = uCenter + uFocal * vec2(dot(v, uRight), dot(v, uUp)) / z;
  gl_Position = vec4(px / uSize * 2.0 - 1.0, 0.0, 1.0);
  vDepth = along / (2.0 * R_IN);

  // size through the lens, and focus
  vec3 pw = uRot * (p - PIVOT) + PIVOT + uOffset;
  float zf = dot(pw - uCam, uFwd);
  float r = rad * uFocal / zf * 1.3;
  float coc = resting ? 0.0 : abs(zf - uFocus) * uDof;
  float size = max(sqrt(r * r + coc * coc), uMinPx);
  float energy = clamp((r * r + 0.3) / (size * size), 0.12, 1.0);
  vPx = size;
  vSoft = clamp(coc / max(size, 1e-3), 0.0, 1.0);
  gl_PointSize = size * 2.0 + 2.0;

  // light: sun or moon, the sky, the windows
  vec3 keyCol = mix(vec3(1.0, 0.95, 0.86) * 1.5, vec3(0.6, 0.7, 1.0) * 0.42, uNight);
  vec3 amb = mix(vec3(0.66, 0.76, 0.96) * 0.75, vec3(0.16, 0.22, 0.44) * 0.5, uNight);
  vec3 winCol = vec3(1.0, 0.56, 0.22) * 2.6 * uWin;
  vec3 col = vec3(0.96, 0.97, 1.0) * (keyCol * 0.62 + amb);
  vec3 toW = WIN_FRONT - p;
  float near = 1.0 / (1.0 + dot(toW, toW) * 40.0);
  col += winCol * near * 1.6 * smoothstep(-0.2, 0.4, -dot(normalize(toW), WIN_FRONT_N));
  vec3 toS = WIN_SIDE - p;
  col += winCol * 1.2 / (1.0 + dot(toS, toS) * 40.0) * smoothstep(-0.2, 0.4, -dot(normalize(toS), WIN_SIDE_N));
  float alpha = (kind > 0.5 && kind < 1.5 ? 0.82 : 0.95) * energy;
  if (kind > 1.5) {
    // glitter: a flat flake turning; it flashes when it faces between the light and the eye
    float spin = aAttr.z + uTime * aAttr.w * (1.0 + uStir * 5.0);
    vec3 nrm = normalize(vec3(sin(spin) * cos(seed * 9.0), cos(spin * 1.3 + seed), sin(spin * 0.7 + seed * 4.0)));
    vec3 hv = normalize(uKeyO + e1);
    float flash = pow(abs(dot(nrm, hv)), 40.0);
    col = mix(col * 0.55, keyCol * 3.2 + winCol * near * 3.0, flash);
    alpha = mix(0.5, 1.0, flash) * energy;
  }
  if (resting) alpha *= 0.9;
  vCol = vec4(col * alpha * uEnc, alpha);
}
`,tM),this.composite=(0,th.createProgram)(t,tw,t_),this.uS=(0,th.uniformLocations)(t,this.scene),this.uF=(0,th.uniformLocations)(t,this.flakeProg),this.uC=(0,th.uniformLocations)(t,this.composite),this.float=!!t.getExtension("EXT_color_buffer_float");const i=t.getParameter(t.ALIASED_POINT_SIZE_RANGE);this.maxPoint=i?i[1]:64;const o=t.createVertexArray(),r=t.createVertexArray(),s=t.createBuffer(),l=t.createBuffer();if(!o||!r||!s||!l)throw Error("snow-globe: no buffers");this.vao=o,this.flakeVao=r,this.posBuffer=s,this.attrBuffer=l,t.bindVertexArray(r),t.bindBuffer(t.ARRAY_BUFFER,s),t.bufferData(t.ARRAY_BUFFER,16*a,t.DYNAMIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,4,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,l),t.bufferData(t.ARRAY_BUFFER,16*a,t.STATIC_DRAW),t.enableVertexAttribArray(1),t.vertexAttribPointer(1,4,t.FLOAT,!1,0,0),t.bindVertexArray(null),t.bindBuffer(t.ARRAY_BUFFER,null)}setAttributes(t){let e=this.gl;e.bindBuffer(e.ARRAY_BUFFER,this.attrBuffer),e.bufferSubData(e.ARRAY_BUFFER,0,t,0,Math.min(t.length,4*this.capacity)),e.bindBuffer(e.ARRAY_BUFFER,null)}get width(){return this.w}get height(){return this.h}get encode(){return this.float?1:.25}texture(t,e){let a=this.gl,i=a.createTexture();if(!i)throw Error("snow-globe: no texture");return a.bindTexture(a.TEXTURE_2D,i),this.float?a.texImage2D(a.TEXTURE_2D,0,a.RGBA16F,t,e,0,a.RGBA,a.HALF_FLOAT,null):a.texImage2D(a.TEXTURE_2D,0,a.RGBA8,t,e,0,a.RGBA,a.UNSIGNED_BYTE,null),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),i}free(){let t=this.gl;this.seen&&t.deleteTexture(this.seen),this.refl&&t.deleteTexture(this.refl),this.sceneFbo&&t.deleteFramebuffer(this.sceneFbo),this.flakes&&(t.deleteTexture(this.flakes.tex),t.deleteFramebuffer(this.flakes.fbo)),this.seen=this.refl=null,this.sceneFbo=null,this.flakes=null}allocate(t,e){let a=this.gl;this.free(),this.seen=this.texture(t,e),this.refl=this.texture(t,e);let i=a.createFramebuffer(),o=this.texture(t,e),r=a.createFramebuffer();if(!i||!r)throw Error("snow-globe: no framebuffer");a.bindFramebuffer(a.FRAMEBUFFER,i),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,this.seen,0),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT1,a.TEXTURE_2D,this.refl,0),a.drawBuffers([a.COLOR_ATTACHMENT0,a.COLOR_ATTACHMENT1]);let s=a.checkFramebufferStatus(a.FRAMEBUFFER)===a.FRAMEBUFFER_COMPLETE;a.bindFramebuffer(a.FRAMEBUFFER,r),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,o,0);let l=a.checkFramebufferStatus(a.FRAMEBUFFER)===a.FRAMEBUFFER_COMPLETE;return a.bindFramebuffer(a.FRAMEBUFFER,null),this.sceneFbo=i,this.flakes={tex:o,fbo:r},s&&l}setSize(t,e){t=Math.max(2,Math.round(t)),e=Math.max(2,Math.round(e)),t===this.w&&e===this.h&&this.seen||(this.w=t,this.h=e,!this.allocate(t,e)&&this.float&&(this.float=!1,this.allocate(t,e)))}setFlakes(t,e){let a=this.gl;a.bindBuffer(a.ARRAY_BUFFER,this.posBuffer),a.bufferSubData(a.ARRAY_BUFFER,0,t,0,4*Math.min(e,this.capacity)),a.bindBuffer(a.ARRAY_BUFFER,null)}camera(t,e){let a=this.gl;a.uniform3f(t("uCam"),e.cam[0],e.cam[1],e.cam[2]),a.uniform3f(t("uFwd"),e.fwd[0],e.fwd[1],e.fwd[2]),a.uniform3f(t("uRight"),e.right[0],e.right[1],e.right[2]),a.uniform3f(t("uUp"),e.up[0],e.up[1],e.up[2]),a.uniform1f(t("uFocal"),e.focal),a.uniform2f(t("uCenter"),e.centerX,e.centerY),a.uniformMatrix3fv(t("uRot"),!1,e.rot),a.uniform3f(t("uOffset"),e.offset[0],e.offset[1],e.offset[2]),a.uniform1f(t("uNight"),e.night),a.uniform1f(t("uWin"),e.win),a.uniform1f(t("uEnc"),this.encode)}drawScene(t){let e=this.gl;if(!this.sceneFbo)return;let a=this.uS;e.disable(e.BLEND),e.bindFramebuffer(e.FRAMEBUFFER,this.sceneFbo),e.viewport(0,0,this.w,this.h),e.useProgram(this.scene),this.camera(a,t),e.uniform3f(a("uKey"),t.key[0],t.key[1],t.key[2]),e.uniform3f(a("uBg"),t.bg[0],t.bg[1],t.bg[2]),e.uniform1f(a("uDark"),t.dark),e.uniform3f(a("uFoot"),t.foot[0],t.foot[1],t.foot[2]),e.uniform3f(a("uGlobe"),t.globe[0],t.globe[1],t.globe[2]),e.uniform3f(a("uFootUp"),t.footUp[0],t.footUp[1],t.footUp[2]),e.bindVertexArray(this.vao),e.drawArrays(e.TRIANGLES,0,3)}drawFrame(t,e,a){let i=this.gl,o=this.flakes;if(!o||!this.seen||!this.refl)return;i.bindFramebuffer(i.FRAMEBUFFER,o.fbo),i.viewport(0,0,this.w,this.h),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT);let r=Math.min(this.capacity,t.flakes);if(r>0){let e=this.uF;i.enable(i.BLEND),i.blendFunc(i.ONE,i.ONE_MINUS_SRC_ALPHA),i.useProgram(this.flakeProg),this.camera(e,t),i.uniform3f(e("uCamO"),t.camO[0],t.camO[1],t.camO[2]),i.uniform3f(e("uKeyO"),t.keyO[0],t.keyO[1],t.keyO[2]),i.uniform2f(e("uSize"),this.w,this.h),i.uniform1f(e("uTime"),t.time),i.uniform1f(e("uStir"),t.stir),i.uniform1f(e("uFocus"),t.focus),i.uniform1f(e("uDof"),t.dof),i.uniform1f(e("uMinPx"),t.minPx),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.seen),i.uniform1i(e("uSeen"),0),i.bindVertexArray(this.flakeVao),i.drawArrays(i.POINTS,0,r),i.disable(i.BLEND)}i.bindFramebuffer(i.FRAMEBUFFER,null),i.viewport(0,0,e,a),i.useProgram(this.composite);let s=this.uC;i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.seen),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,this.refl),i.activeTexture(i.TEXTURE2),i.bindTexture(i.TEXTURE_2D,o.tex),i.uniform1i(s("uSeen"),0),i.uniform1i(s("uRefl"),1),i.uniform1i(s("uFlakes"),2),i.uniform2f(s("uCanvas"),e,a),i.uniform2f(s("uTexel"),1/this.w,1/this.h),i.uniform1f(s("uAA"),t.aa),i.uniform1f(s("uDec"),1/this.encode),i.uniform1f(s("uExposure"),.62),i.bindVertexArray(this.vao),i.drawArrays(i.TRIANGLES,0,3),i.activeTexture(i.TEXTURE0),i.bindVertexArray(null)}dispose(){let t=this.gl;this.free(),t.deleteProgram(this.scene),t.deleteProgram(this.flakeProg),t.deleteProgram(this.composite),t.deleteVertexArray(this.vao),t.deleteVertexArray(this.flakeVao),t.deleteBuffer(this.posBuffer),t.deleteBuffer(this.attrBuffer)}}class tO{count;pos;attr;vel;fall;lift;flutter;field;random;swirl=[0,0,0];roll=[0,0,0];churn=0;phase=[0,0,0];prevW=[0,0,0];hasPrevW=!1;time=0;free=0;activity=0;u=[0,0,0];constructor(t,e=23051){this.count=t,this.pos=new Float32Array(4*t),this.attr=new Float32Array(4*t),this.vel=new Float32Array(3*t),this.fall=new Float32Array(t),this.lift=new Float32Array(t),this.flutter=new Float32Array(t),this.field=function(){let t=new Float32Array(12544);for(let e=0;e<112;e++)for(let a=0;a<112;a++){let i=(a+.5)/112*1.91-.955,o=(e+.5)/112*1.91-.955;t[112*e+a]=Math.max(n(i,o),function(t,e){let a=t-.03,i=e- -.07,o=.9130889403123083*a-.40776045305957015*i,r=.40776045305957015*a+.9130889403123083*i,s=-1/0;return .225>=Math.abs(o)&&.195>=Math.abs(r)&&(s=c+(h-Math.abs(r)*Math.tan(.66)+.037975056973835644)),.034>=Math.abs(o-.085)&&.034>=Math.abs(r- -.045)&&(s=Math.max(s,c+h+.07+.012)),s}(i,o),function(t,e){let a=-1/0;for(let i of R){let o=Math.hypot(t-i.x,e-i.z);if(!(o>1.02*i.r))for(let[t,e,r]of T){let s=i.r*r;if(o>s)continue;let l=i.y+e*i.h,n=l-o/s*(l-(i.y+t*i.h));n>a&&(a=n)}}return a}(i,o))}return t}(),this.random=(0,s.seededRandom)(e);const a=this.random;for(let e=0;e<t;e++){let t;const i=a(),o=i<.08?2:+(i<.22);2===o?(t=.0068+.0015*a(),this.fall[e]=.05+.025*a(),this.lift[e]=.06+.12*a()):1===o?(t=.0105+.0035*a(),this.fall[e]=.085+.04*a(),this.lift[e]=.12+.2*a()):(t=.0056+.003*a(),this.fall[e]=.055+.045*a(),this.lift[e]=.08+.2*a()),this.flutter[e]=.7+1.1*a(),this.pos[4*e+3]=t,this.attr[4*e]=a(),this.attr[4*e+1]=o,this.attr[4*e+2]=a()*Math.PI*2,this.attr[4*e+3]=(1.5+3.5*a())*(.5>a()?-1:1)}this.scatter(.3,.9)}scatter(t,e){let a=this.random,i=this.pos,o=0;for(let r=0;r<this.count;r++){let s=4*r,l=Math.abs(i[s+3]);if(this.vel[3*r]=0,this.vel[3*r+1]=0,this.vel[3*r+2]=0,a()<t){let t=a()*Math.PI*2,e=.8*Math.sqrt(a()),o=Math.cos(t)*e,r=Math.sin(t)*e;i[s]=o,i[s+1]=Y(this.field,o,r)+.6*l,i[s+2]=r,i[s+3]=-l;continue}let n=.955-l-.01;for(let t=0;t<24;t++){let t=a()*Math.PI*2,r=Math.sqrt(a())*(n-.02),c=Math.cos(t)*r,h=Math.sin(t)*r,f=Y(this.field,c,h)+.02,u=Math.min(e,Math.sqrt(Math.max(0,n*n-c*c-h*h)));if(u<=f)continue;let d=1-Math.pow(a(),1.25);i[s]=c,i[s+1]=f+(u-f)*(1-d),i[s+2]=h,i[s+3]=l,o++;break}if(i[s+3]<0)continue}this.free=o}stir(t,e){this.swirl[1]+=t,this.churn=Math.min(1.5,this.churn+e)}flow(t,e,a){let i=this.swirl,o=this.roll,r=this.u,s=i[1]*a-i[2]*e,l=i[2]*t-i[0]*a,n=i[0]*e-i[1]*t,c=1.0471204188481675*t,h=1.0471204188481675*e,f=1.0471204188481675*a,u=o[0]*c+o[1]*h+o[2]*f,d=1-2*(c*c+h*h+f*f);s+=o[0]*d+u*c,l+=o[1]*d+u*h,n+=o[2]*d+u*f;let m=.78*this.churn;if(m>1e-4){let i=this.phase,o=Math.sin(4.6*t+i[2]),r=Math.cos(4.6*t+i[2]),c=Math.sin(4.6*e+i[1]),h=Math.cos(4.6*e+i[1]),f=Math.sin(4.6*a+i[0]),u=Math.cos(4.6*a+i[0]);s+=m*(f+.55*h),l+=m*(.75*o+u),n+=m*(.55*c+.75*r)}r[0]=s,r[1]=l,r[2]=n}step(t,e,a,i){let o=Math.min(t,.1);this.hasPrevW||(this.prevW[0]=i[0],this.prevW[1]=i[1],this.prevW[2]=i[2],this.hasPrevW=!0);let r=i[0]-this.prevW[0],s=i[1]-this.prevW[1],l=i[2]-this.prevW[2];this.prevW[0]=i[0],this.prevW[1]=i[1],this.prevW[2]=i[2];let n=this.swirl,c=Math.exp(-t/2.6);n[0]=tA((n[0]-.42*r)*c,3.2),n[1]=tA((n[1]-.42*s)*c,3.2),n[2]=tA((n[2]-.42*l)*c,3.2);let h=this.roll,f=Math.exp(-t/.95);h[0]=tA((h[0]-.016*a[0]*t)*f,1.1),h[1]=tA((h[1]-.016*a[1]*t*.6)*f,1.1),h[2]=tA((h[2]-.016*a[2]*t)*f,1.1);let u=Math.hypot(a[0],a[1],a[2]),d=Math.hypot(r,s,l);this.churn=Math.min(1.5,this.churn*Math.exp(-t/1.8)+.0055*u*t+.012*d),this.churn<1e-4&&(this.churn=0);let m=t*(.3+1.4*this.churn);this.phase[0]+=m,this.phase[1]+=.8*m,this.phase[2]+=1.23*m;let p=Math.hypot(n[0],n[1],n[2]),v=Math.hypot(h[0],h[1],h[2]);this.activity=Math.min(1.5,.22*p+.9*v+.8*this.churn);let x=this.churn<.02&&p<.05&&v<.02&&u<1,y=.015*u;for(;o>1e-6;){let t=Math.min(1/60,o);o-=t,this.time+=t,this.integrate(t,e,a,x,y)}}integrate(t,e,a,i,o){let r=this.pos,s=this.vel,l=this.field,n=this.u,c=1-Math.exp(-t/.2),h=this.time,f=this.random,u=this.churn>.05?1.2*this.churn*Math.sqrt(t)*3.4:0,d=0;for(let m=0;m<this.count;m++){let p=4*m,v=3*m,x=r[p],y=r[p+1],g=r[p+2],b=r[p+3],w=b<0?-b:b;if(b<0){if(i)continue;this.flow(x,y,g);let t=Math.hypot(n[0],n[1],n[2])+.12*o;if(t>this.lift[m]){let e=Math.min(2.2,t/this.lift[m]);r[p+3]=w,s[v]=.6*n[0]+(f()-.5)*.12*e,s[v+1]=(.15+.4*f())*e+.6*Math.max(0,n[1]),s[v+2]=.6*n[2]+(f()-.5)*.12*e,d++}continue}d++,this.flow(x,y,g);let M=this.fall[m],_=this.flutter[m],R=this.attr[p+2],T=.03*Math.sin(h*_*2.2+R),O=.03*Math.cos(h*_*1.8+1.7*R),A=s[v],E=s[v+1],S=s[v+2];A+=(n[0]+e[0]*M+T-A)*c-.015*a[0]*t,E+=(n[1]+e[1]*M-E)*c-.015*a[1]*t,S+=(n[2]+e[2]*M+O-S)*c-.015*a[2]*t,u>0&&(A+=(f()-.5)*u,E+=(f()-.5)*u,S+=(f()-.5)*u);let k=x,F=y,C=g;x+=A*t,y+=E*t,g+=S*t;let B=.955-w-.006,N=x*x+y*y+g*g;if(N>B*B){let t=Math.sqrt(N),e=x/t,a=y/t,i=g/t;x=e*B,y=a*B,g=i*B;let o=A*e+E*a+S*i;o>0&&(A-=o*e,E-=o*a,S-=o*i)}let I=Y(l,x,g)+.6*w;if(y<I)if(F>=I-.025){let t=Math.hypot(A,E,S);if(y=I,t<.45){r[p]=x,r[p+1]=y,r[p+2]=g,r[p+3]=-w,s[v]=0,s[v+1]=0,s[v+2]=0,d--;continue}E=.25*Math.abs(E)}else x=k,g=C,y=Math.max(F,y),A*=-.3,S*=-.3;r[p]=x,r[p+1]=y,r[p+2]=g,s[v]=A,s[v+1]=E,s[v+2]=S}this.free=d}}function tA(t,e){return t>e?e:t<-e?-e:t}function tE(){return(0,r.audioReady)()?(0,r.getAudio)():null}function tS(t,e,a,{freq:i,to:o,level:r,decay:s,type:l="sine"}){let n=t.createOscillator();n.type=l,n.frequency.setValueAtTime(i,a),o&&n.frequency.exponentialRampToValueAtTime(o,a+s);let c=t.createGain();c.gain.setValueAtTime(0,a),c.gain.linearRampToValueAtTime(r,a+.003),c.gain.exponentialRampToValueAtTime(1e-4,a+s),n.connect(c).connect(e),n.start(a),n.stop(a+s+.03)}function tk(t,e,a,{type:i,freq:o,q:s,level:l,decay:n}){let c=t.createBufferSource();c.buffer=(0,r.noiseBuffer)(t);let h=t.createBiquadFilter();h.type=i,h.frequency.value=o,h.Q.value=s;let f=t.createGain();f.gain.setValueAtTime(0,a),f.gain.linearRampToValueAtTime(l,a+.0015),f.gain.exponentialRampToValueAtTime(1e-4,a+n),c.connect(h).connect(f).connect(e),c.start(a,.5*Math.random(),n+.05)}class tF{nodes=null;quiet=0;wobble=0;update(t,e){let a=Math.min(1,t);if(a<.02){if(this.nodes){let{ctx:t,gain:a}=this.nodes;a.gain.setTargetAtTime(0,t.currentTime,.12),this.quiet+=e,this.quiet>1.2&&this.stop()}return}if(this.quiet=0,!this.nodes){let t=tE();if(!t)return;let{ctx:e,output:a}=t,i=e.createBufferSource();i.buffer=(0,r.noiseBuffer)(e,2),i.loop=!0;let o=e.createBiquadFilter();o.type="bandpass",o.frequency.value=600,o.Q.value=.9;let s=e.createBiquadFilter();s.type="lowpass",s.frequency.value=1800,s.Q.value=.4;let l=e.createGain();l.gain.value=0,i.connect(o).connect(s).connect(l).connect(a),i.start(),this.nodes={src:i,band:o,low:s,gain:l,ctx:e}}let{ctx:i,band:o,low:s,gain:l}=this.nodes;this.wobble+=e*(2.2+3*a);let n=i.currentTime,c=.75+.25*Math.sin(this.wobble)*Math.sin(.37*this.wobble+1);l.gain.setTargetAtTime(.11*a*a*c,n,.06),o.frequency.setTargetAtTime(380+900*a*c,n,.08),s.frequency.setTargetAtTime(1200+1600*a,n,.1)}stop(){let t=this.nodes;if(t){this.nodes=null;try{t.gain.gain.cancelScheduledValues(t.ctx.currentTime),t.gain.gain.setTargetAtTime(0,t.ctx.currentTime,.03),t.src.stop(t.ctx.currentTime+.15)}catch{}window.setTimeout(()=>{try{t.src.disconnect(),t.gain.disconnect()}catch{}},300)}}}let tC=[1,.8,.64,.5];function tB(t,e){let a=t.trim(),i=a.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(i){let t=3===i[1].length?i[1].replace(/./g,t=>t+t):i[1];return[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255]}let o=a.match(/[\d.]+/g);return o&&o.length>=3?[o[0]/255,o[1]/255,o[2]/255]:e}function tN({mode:t,active:e,reducedMotion:a,theme:n}){let c="stage"===t,[h]=(0,o.useState)(()=>{let t,e,i;return t=new tO(c?1500:550,c?23051:1822),a?t.scatter(.42,.82):(t.scatter(.55,.9),t.stir(.12,.06)),e="dark"===n,i={centerX:0,centerY:0,focal:1,cam:[0,0,7],fwd:[0,0,-1],right:[1,0,0],up:[0,1,0],rot:new Float32Array([1,0,0,0,1,0,0,0,1]),offset:[0,0,0],key:[0,1,0],keyO:[0,1,0],camO:[0,0,7],bg:[1,1,1],night:0,win:0,dark:0,foot:[0,-1.4,0],globe:[0,0,0],footUp:[0,1,0],time:0,stir:0,focus:7,dof:0,minPx:1,flakes:0,aa:0},{globe:new ts,snow:t,frame:i,layout:G(),water:new tF,theme:n,reduced:a,stage:c,night:+!!e,winOn:e,winT:e?a?10:-.55:10,winLevel:e&&a?1:0,flicker:1,flickerT:0,bg:e?[.055,.02,.024]:[.949,.949,.949],bgHover:e?[.03,.012,.012]:[.922,.922,.922],hovering:!1,hover:0,clock:0,acc:0,renderStep:0,perf:{time:0,slow:0},k:1,sig:new Float32Array(20).fill(NaN),sceneDirty:!0,drag:null,lastInput:-10,tileNext:1.4,down:[0,-1,0],accO:[0,0,0],wO:[0,0,0],leanX:0,flakesDirty:!0}}),f=(0,o.useRef)(null),u=(0,o.useRef)(null),d=(0,s.useFinePointer)(),m=(0,o.useId)(),[p,v]=(0,o.useState)(null),[x,y]=(0,o.useState)(h.winOn),[g,b]=(0,o.useState)(!1),[w,M]=(0,o.useState)(!1),_=(0,o.useCallback)(()=>{let t=f.current,{width:e,height:a,dpr:i}=S.current;if(!t||e<2||a<2)return;let o=Math.min(i,1.5)*(c?tC[h.renderStep]:1);t.setSize(e*o,a*o),h.k=t.width/e,j(e,a,c,e<560?92:104,h.layout),h.sceneDirty=!0;{let t=h.layout,a={x:0,y:0};H([0,1,-.17],t,a),h.globe.reachUp=(0,s.clamp)((a.y-4)/t.ppu,.1,.6),h.globe.reachX=(0,s.clamp)((e/2-.96*t.ppu)/t.ppu,.12,1.05)}if(c){let t={x:0,y:0},e={x:0,y:0};H([0,0,0],h.layout,t),H([0,L,E],h.layout,e);let a=1.04*h.layout.ppu;v(i=>{let o={x:t.x-a,y:t.y-a,w:2*a,h:e.y-(t.y-a),r:a};return i&&.5>Math.abs(i.x-o.x)&&.5>Math.abs(i.y-o.y)&&.5>Math.abs(i.w-o.w)&&.5>Math.abs(i.h-o.h)?i:o})}},[c]),R=(0,o.useCallback)((t,e,a)=>{(h.winOn!==t||t&&h.winT<0)&&(h.winOn=t,h.winT=t?-e:0,y(t),a&&c&&function(t){let e=tE();if(!e)return;let{ctx:a,output:i}=e,o=a.currentTime,r=t?1.05:.95;tk(a,i,o,{type:"bandpass",freq:3e3*r,q:1.2,level:.09,decay:.02}),tS(a,i,o,{freq:1250*r,to:1080*r,level:.035,decay:.045,type:"triangle"}),tS(a,i,o,{freq:180*r,to:110,level:.08,decay:.05})}(t))},[c]),T=()=>{let t=f.current,e=A.current,{width:a,height:i}=S.current;return!!t&&!!e&&!(a<2)&&!(i<2)&&((()=>{let{height:t}=S.current,e=h.frame,a=h.layout,i=h.globe,o=h.k,r=i.rot;e.centerX=a.cx*o,e.centerY=(t-a.cy)*o,e.focal=a.focal*o,e.cam=a.cam,e.fwd=a.fwd,e.right=a.right,e.up=a.up,e.rot=r,e.offset=i.offset,e.key=X,e.keyO[0]=r[0]*X[0]+r[1]*X[1]+r[2]*X[2],e.keyO[1]=r[3]*X[0]+r[4]*X[1]+r[5]*X[2],e.keyO[2]=r[6]*X[0]+r[7]*X[1]+r[8]*X[2];let s=a.cam[0]-U[0]-i.offset[0],l=a.cam[1]-U[1]-i.offset[1],n=a.cam[2]-U[2]-i.offset[2];e.camO[0]=r[0]*s+r[1]*l+r[2]*n+U[0],e.camO[1]=r[3]*s+r[4]*l+r[5]*n+U[1],e.camO[2]=r[6]*s+r[7]*l+r[8]*n+U[2];let f=h.hover;for(let t=0;t<3;t++){var u;e.bg[t]=function(t){let e=Math.min(.9995,Math.max(0,t));return(e<=.72?e:.72-.28*Math.log(1-(e-.72)/.28))/.62}((u=h.bg[t]+(h.bgHover[t]-h.bg[t])*f)<=.04045?u/12.92:Math.pow((u+.055)/1.055,2.4))}e.night=h.night,e.dark=h.night,e.win=h.winLevel*h.flicker;let d=i.up,m=U[1]-L;e.foot[0]=U[0]+i.offset[0]-m*d[0],e.foot[1]=U[1]+i.offset[1]-m*d[1],e.foot[2]=U[2]+i.offset[2]-m*d[2],e.globe[0]=U[0]+i.offset[0]-U[1]*d[0],e.globe[1]=U[1]+i.offset[1]-U[1]*d[1],e.globe[2]=U[2]+i.offset[2]-U[1]*d[2],e.footUp=d,e.time=h.clock,e.stir=h.snow.activity;let p=e.globe[0]-a.cam[0],v=e.globe[1]-a.cam[1],x=e.globe[2]-a.cam[2];e.focus=Math.hypot(p,v,x)-.15,e.dof=(c?.024:.012)*a.ppu*o,e.minPx=(c?.8:.75)*o,e.flakes=h.snow.count,e.aa=+(o<1.2)})(),(()=>{let t=h.frame,e=h.sig,a=h.sceneDirty,i=(t,i)=>{1e-5>Math.abs(e[t]-i)||(e[t]=i,a=!0)};for(let e=0;e<9;e++)i(e,t.rot[e]);return i(9,t.offset[0]),i(10,t.offset[1]),i(11,t.night),i(12,t.win),i(13,t.bg[0]),i(14,t.bg[1]),i(15,t.bg[2]),h.sceneDirty=!1,a})()&&t.drawScene(h.frame),h.flakesDirty&&(t.setFlakes(h.snow.pos,h.snow.count),h.flakesDirty=!1),t.drawFrame(h.frame,e.width,e.height),!0)},O=(0,s.useFrame)(e,t=>{let e=f.current,{width:a}=S.current;if(!e||a<2)return!1;let i=h.reduced,o=h.globe,r=h.snow,l=performance.now()/1e3,n=!h.drag&&!o.scripted&&o.settled&&r.activity<.05&&l-h.lastInput>2&&h.winT>1.5&&.001>Math.abs(h.night-("dark"===h.theme));if(!c||n){if(h.acc+=t,h.acc<1/30-.002)return;t=Math.min(.1,h.acc),h.acc=0}if(h.clock+=t,c&&!n&&h.renderStep<tC.length-1){let e=h.perf;e.time+=t,t>1/40&&(e.slow+=t),e.time>=1.5&&(e.slow>.7*e.time&&(h.renderStep+=1,_()),e.time=0,e.slow=0)}if(c||i?c||(h.hover=+!!h.hovering):(h.hover=(0,s.damp)(h.hover,+!!h.hovering,10,t),h.tileNext-=t,h.tileNext<=0&&!o.scripted&&(o.play(to),h.tileNext=10*(.85+.3*Math.random()))),!i){c&&!h.drag&&d?o.lean=(0,s.clamp)(-(.008*h.leanX),-.01,.01):o.lean=0,o.step(t);let e=o.rot;h.down[0]=-e[1],h.down[1]=-e[4],h.down[2]=-e[7];let i=o.ax,l=o.ay;h.accO[0]=e[0]*i+e[1]*l,h.accO[1]=e[3]*i+e[4]*l,h.accO[2]=e[6]*i+e[7]*l;let n=o.omega;if(h.wO[0]=e[0]*n[0]+e[1]*n[1]+e[2]*n[2],h.wO[1]=e[3]*n[0]+e[4]*n[1]+e[5]*n[2],h.wO[2]=e[6]*n[0]+e[7]*n[1]+e[8]*n[2],r.step(t,h.down,h.accO,h.wO),h.flakesDirty=!0,c&&o.impact>.5){let t=(h.layout.cx+o.offset[0]*h.layout.ppu)/Math.max(1,a)*2-1;!function(t,e){let a=tE();if(!a)return;let i=Math.min(1,Math.max(0,(t-.35)/3));if(i<.03)return;let{ctx:o,output:r}=a,s=r;if("function"==typeof o.createStereoPanner){let t=o.createStereoPanner();t.pan.value=Math.max(-.6,Math.min(.6,e)),t.connect(r),s=t}let l=o.currentTime,n=1+(Math.random()-.5)*.06;tS(o,s,l,{freq:150*n,to:82,level:.34*i,decay:.16}),tS(o,s,l,{freq:410*n,to:360*n,level:.07*i,decay:.08,type:"triangle"}),tk(o,s,l,{type:"lowpass",freq:1500,q:.8,level:.16*i,decay:.035}),tk(o,s,l,{type:"bandpass",freq:3200,q:1.2,level:.025*i,decay:.02}),tS(o,s,l+.004,{freq:2630*n,level:.012*i,decay:.5}),tS(o,s,l+.004,{freq:4170*n,level:.006*i,decay:.32})}(o.impact,t)}}let u=+("dark"===h.theme);if(h.night=i?u:(0,s.damp)(h.night,u,3.2,t),.001>Math.abs(h.night-u)&&(h.night=u),h.winT+=t,i)h.winLevel=+!!h.winOn,h.flicker=1;else{if(h.winOn){var m;h.winLevel=(m=h.winT)<0||m<.04?0:m<.09?.75:m<.16?.08:m<.21?.55:m<.27?.2:1-.8*Math.exp(-(m-.27)/.12)}else h.winLevel*=Math.exp(-t/.14),h.winLevel<.003&&(h.winLevel=0);if(h.flickerT-=t,h.winOn&&h.winT>1.2&&h.flickerT<=0){h.flickerT=1/12;let t=h.clock;h.flicker=.94+.04*Math.sin(7.1*t)*Math.sin(2.3*t+1)+.03*Math.sin(17.3*t+Math.sin(3.1*t))}}if(c&&h.water.update(i?0:r.activity,t),T(),i&&!h.drag&&h.hover%1==0&&.001>Math.abs(h.night-u)&&h.winLevel%1==0||c&&n&&0===r.free&&!(h.winOn&&h.winLevel>0))return!1}),{canvasRef:A,sizeRef:S,supported:k}=(0,s.useWebGL2)({mode:t,attributes:{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:e=>{let a=null;try{a=new tT(e,t,h.snow.count)}catch(t){console.error(t);return}return a.setAttributes(h.snow.attr),f.current=a,h.sceneDirty=!0,h.flakesDirty=!0,_(),T(),O(),()=>{a?.dispose(),f.current=null}},onResize:()=>{_(),h.flakesDirty=!0,T(),O()}}),F=(0,o.useCallback)(()=>{try{let t=getComputedStyle(document.documentElement);h.bg=tB(t.getPropertyValue("--tile"),h.bg),h.bgHover=tB(t.getPropertyValue("--tile-hover"),h.bgHover)}catch{}h.sceneDirty=!0},[]),C=(0,o.useRef)(!0);(0,o.useEffect)(()=>{if(h.theme=n,F(),C.current){C.current=!1,O();return}R("dark"===n,.55*!h.reduced,!1),O()},[n]),(0,o.useEffect)(()=>{let t=new MutationObserver(()=>{F(),B.current()});return t.observe(document.documentElement,{attributes:!0,attributeFilter:["data-palette","style"]}),()=>t.disconnect()},[]),(0,o.useEffect)(()=>{h.reduced=a,h.flakesDirty=!0,a&&(h.snow.scatter(.42,.82),h.globe.reset(),h.drag=null),O()},[a]),(0,o.useEffect)(()=>{let t=h.water;return()=>t.stop()},[]),(0,o.useEffect)(()=>{e||h.water.stop()},[e]);let B=(0,s.useLatest)(O),N=()=>{h.lastInput=performance.now()/1e3,g||b(!0),B.current()},I=()=>{(0,r.ensureAudio)(),h.reduced?(h.snow.scatter(.42,.82),h.flakesDirty=!0):h.globe.play(ti),N()},q=t=>{let e=u.current?.getBoundingClientRect();return{x:t.clientX-(e?.left??0),y:t.clientY-(e?.top??0)}},P=(t,e,a,i)=>{let o=t.n%t.ts.length;t.ts[o]=i/1e3,t.xs[o]=e,t.ys[o]=a,t.n+=1},D=(t,e)=>{if(h.reduced&&c&&!e&&!h.drag)return void I();let a=h.drag;if(!a||t.pointerId!==a.id)return;h.drag=null;try{t.currentTarget.releasePointerCapture(t.pointerId)}catch{}u.current&&(u.current.style.cursor=d?"grab":"");let[i,o]=e?[0,0]:((t,e)=>{let a=t.ts.length;if(t.n<2)return[0,0];let i=(t.n-1)%a,o=t.ts[i];if(e/1e3-o>.09)return[0,0];let r=i;for(let e=1;e<Math.min(t.n,a);e++){let i=(t.n-1-e)%a;if(r=i,o-t.ts[i]>.08)break}let s=o-t.ts[r];return s<.012?[0,0]:[(t.xs[i]-t.xs[r])/s,(t.ys[i]-t.ys[r])/s]})(a,t.timeStamp);if(h.globe.release(i,o),!e&&!a.moved&&t.timeStamp-a.t0<300){let{x:e}=q(t),a=e<h.layout.cx?1:-1;h.globe.nudge(.45*a),h.snow.stir(.12*a,.05),function(t){let e=tE();if(!e)return;let{ctx:a,output:i}=e,o=i;if("function"==typeof a.createStereoPanner){let e=a.createStereoPanner();e.pan.value=Math.max(-.6,Math.min(.6,t)),e.connect(i),o=e}let r=a.currentTime,s=1+(Math.random()-.5)*.04;tS(a,o,r,{freq:2480*s,level:.03,decay:.42}),tS(a,o,r,{freq:3910*s,level:.014,decay:.26}),tS(a,o,r,{freq:6020*s,level:.006,decay:.12}),tk(a,o,r,{type:"bandpass",freq:2200,q:.9,level:.05,decay:.012}),tS(a,o,r,{freq:220,to:160,level:.05,decay:.06})}((e-h.layout.cx)/Math.max(1,S.current.width)*2)}N()};if((0,o.useEffect)(()=>{if(c)return;let t=A.current;if(!t)return;let e=t=>{"mouse"===t.pointerType&&(h.hovering=!0,h.reduced||h.globe.scripted||!h.globe.settled||(h.globe.play(to),h.tileNext=10),B.current())},a=()=>{h.hovering=!1,B.current()};return t.addEventListener("pointerenter",e),t.addEventListener("pointerleave",a),()=>{t.removeEventListener("pointerenter",e),t.removeEventListener("pointerleave",a)}},[c,k]),!1===k)return(0,i.jsx)(tI,{mode:t,theme:n});if(!c)return(0,i.jsx)("canvas",{ref:A,"aria-hidden":"true",className:"absolute inset-0 block size-full"});let z=a?w?"Space shakes it · L for the light":"Press the globe or Space to shake up the snow":w?"Space shakes it · ← → tip it · ↑ lifts it · L for the light":d?"Pick up the globe and shake it · Space shakes it":"Drag the globe to shake it · tap the glass";return(0,i.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,i.jsxs)("div",{ref:u,onPointerDown:t=>{if(!c||!t.isPrimary||t.button>0||t.target.closest("[data-lab-controls]"))return;(0,r.ensureAudio)();let{x:e,y:a}=q(t),i=h.globe;if(h.reduced){h.drag=null,N();return}i.grab();let o={id:t.pointerId,x0:e,y0:a,t0:t.timeStamp,moved:!1,gx:i.x,gy:i.y,ts:new Float64Array(10),xs:new Float64Array(10),ys:new Float64Array(10),n:0};h.drag=o,P(o,i.x,i.y,t.timeStamp);try{t.currentTarget.setPointerCapture(t.pointerId)}catch{}u.current&&(u.current.style.cursor="grabbing"),N()},onPointerMove:t=>{let e;if(!c)return;let a=h.drag,{x:i,y:o}=q(t);if(!a){h.leanX=(i-h.layout.cx)/Math.max(1,h.layout.ppu),d&&B.current();return}if(t.pointerId!==a.id)return;!a.moved&&Math.hypot(i-a.x0,o-a.y0)>6&&(a.moved=!0);let[r,s]=(e=Math.max(1,h.layout.ppu),[a.gx+(i-a.x0)/e,a.gy-(o-a.y0)/e]);h.globe.setHand(r,s),P(a,r,s,t.timeStamp),N()},onPointerUp:t=>D(t,!1),onPointerCancel:t=>D(t,!0),onPointerLeave:()=>{h.leanX=0},className:"absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]",style:{cursor:d?"grab":void 0},children:[(0,i.jsx)("canvas",{ref:A,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),p?(0,i.jsx)("div",{role:"button",tabIndex:0,"aria-label":`Snow globe with a cabin in the pines${x?", its window lit":""}. Press to shake it.`,"aria-describedby":m,onKeyDown:t=>{let e=h.globe;switch(t.key){case" ":case"Enter":t.preventDefault(),t.repeat||I();return;case"ArrowLeft":case"ArrowRight":t.preventDefault(),(0,r.ensureAudio)(),h.reduced?I():h.drag||e.nudge("ArrowLeft"===t.key?-1:1),N();return;case"ArrowUp":t.preventDefault(),(0,r.ensureAudio)(),h.reduced?I():h.drag||e.scripted||e.play(tr),N();return;case"l":case"L":t.preventDefault(),(0,r.ensureAudio)(),R(!h.winOn,0,!0),N();return}},onFocus:t=>M(t.currentTarget.matches(":focus-visible")),onBlur:()=>M(!1),className:"absolute touch-none rounded-[999px] outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]",style:{left:p.x,top:p.y,width:p.w,height:p.h,borderRadius:`${p.r}px ${p.r}px ${.6*p.r}px ${.6*p.r}px`}}):null]}),(0,i.jsx)("p",{id:m,className:"sr-only",children:"A glass snow globe on a wooden base, with a log cabin and pine trees inside. Space or Enter shakes it, the left and right arrow keys tip it on the table, the up arrow lifts it and lets it drop, and L switches the light in the cabin."}),(0,i.jsxs)(l.StageControls,{placement:"bottom",children:[(0,i.jsxs)(l.Tray,{label:"Snow globe",children:[(0,i.jsx)(l.TrayButton,{icon:(0,i.jsx)(tn,{size:15}),onClick:I,children:"Shake"}),(0,i.jsx)(l.TrayDivider,{}),(0,i.jsx)(l.IconButton,{label:"Cabin light",pressed:x,onClick:()=>{(0,r.ensureAudio)(),R(!h.winOn,0,!0),N()},children:(0,i.jsx)(tc,{size:16})}),(0,i.jsx)(l.TrayDivider,{}),(0,i.jsx)(l.MuteButton,{})]}),(0,i.jsx)(l.StageHint,{className:!g||w?"transition-opacity duration-300":"opacity-0 transition-opacity duration-700",children:z})]})]})}function tI({mode:t,theme:e}){let a=(0,o.useRef)(null);return(0,o.useEffect)(()=>{let i=a.current;if(!i)return;let o=()=>{let a=i.getBoundingClientRect(),o=Math.min(window.devicePixelRatio||1,2);i.width=Math.max(1,Math.round(a.width*o)),i.height=Math.max(1,Math.round(a.height*o));let r=i.getContext("2d");if(!r)return;let s=j(a.width,a.height,"stage"===t,104*("stage"===t),G()),l="dark"===e,n={x:0,y:0};r.setTransform(o,0,0,o,0,0),r.clearRect(0,0,a.width,a.height),H([0,0,0],s,n);let c=n.x,h=n.y,f=s.ppu,u={x:0,y:0},d={x:0,y:0};H([0,W,$],s,u),H([0,L,E],s,d);let m=r.createLinearGradient(c-f,0,c+f,0);m.addColorStop(0,l?"#1b0f09":"#3a2414"),m.addColorStop(.4,l?"#3a2213":"#6a4226"),m.addColorStop(1,l?"#120a06":"#2a190e"),r.fillStyle=m,r.beginPath(),r.moveTo(c-.72*f,u.y),r.lineTo(c+.72*f,u.y),r.lineTo(c+.94*f,d.y),r.lineTo(c-.94*f,d.y),r.closePath(),r.fill();let p=r.createLinearGradient(0,h-f,0,h+f);for(let[t,e]of(p.addColorStop(0,l?"#0b1430":"#8fb2e6"),p.addColorStop(.6,l?"#1a2550":"#dfe8f5"),r.fillStyle=p,r.beginPath(),r.arc(c,h,f,0,2*Math.PI),r.fill(),r.save(),r.beginPath(),r.arc(c,h,.97*f,0,2*Math.PI),r.clip(),r.fillStyle=l?"#c9d3ea":"#f6f8fc",r.fillRect(c-f,h+.45*f,2*f,f),r.fillStyle=l?"#2a160c":"#4a2a17",r.fillRect(c-.2*f,h+.2*f,.4*f,.25*f),r.fillStyle=l?"#e8edf8":"#ffffff",r.beginPath(),r.moveTo(c-.27*f,h+.22*f),r.lineTo(c,h+.02*f),r.lineTo(c+.27*f,h+.22*f),r.closePath(),r.fill(),r.fillStyle=l?"#ffb35c":"#1b2230",r.fillRect(c-.12*f,h+.27*f,.08*f,.07*f),r.fillStyle=l?"#0d2a1a":"#1d4a2e",[[-.55,.62],[.5,.56],[.45,.32]]))r.beginPath(),r.moveTo(c+t*f-.17*f,h+.48*f),r.lineTo(c+t*f,h+f*(.48-e)),r.lineTo(c+t*f+.17*f,h+.48*f),r.closePath(),r.fill();r.restore(),r.strokeStyle=l?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.7)",r.lineWidth=Math.max(1,.04*f),r.beginPath(),r.arc(c,h,.82*f,1.08*Math.PI,1.38*Math.PI),r.stroke()};o();let r=new ResizeObserver(o);return r.observe(i),()=>r.disconnect()},[t,e]),(0,i.jsx)("canvas",{ref:a,role:"stage"===t?"img":void 0,"aria-label":"stage"===t?"A snow globe with a cabin in the pines":void 0,"aria-hidden":"stage"!==t||void 0,className:"absolute inset-0 block size-full"})}t.s(["default",0,function(t){return(0,i.jsx)(tN,{...t})}],14428)}]);