(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,49795,e=>{"use strict";var t=e.i(43476),a=e.i(71645),i=e.i(33209),o=e.i(47261),l=e.i(16442),s=e.i(37047),r=e.i(45219);let n=Math.sqrt(3203.792297535979+(84*.21822962308086932)**2),h=84*.21822962308086932,c=-5*.9758974493306055;function m(e,t,a,i=0){let o="tile"===e,l=o?142:196,s=o?112:148,r=Math.min(Math.max(80,a-i-(o?4:12))/(12+l- -4.391538521987725+s+27.799999999999997+(o?22:40)),t*(o?.98:.9)/(168+(o?28:120))),n=t/(r=Math.max(.2,Math.min(o?1.4:1.12,r))),h=a/r,c=Math.min(h-6,(a-.35*i)/r);return{scale:r,width:n,height:h,ax:n/2-84*(o?.12:.16),ay:12,arm:l,cord:s,floor:c}}class u{on;power;filament;room;front;charge;reduced=!1;constructor(e){this.on=e,this.power=+!!e,this.filament=+!!e,this.room=new s.Spring(+!!e,{stiffness:46,damping:11.2,precision:5e-4}),this.front=e?.55:2.6,this.charge=e?1:.55}get emission(){let e=this.filament;return e*e*Math.sqrt(e)*(1+.04*(this.room.value-1))}set(e,t=!1){this.on=e,this.room.to(+!!e),(t||this.reduced)&&this.snap()}snap(){this.power=+!!this.on,this.filament=this.power,this.room.set(+!!this.on),this.front=this.on?.55:2.6,this.on&&(this.charge=1)}step(e){let t=+!!this.on;this.power+=(t-this.power)*(1-Math.exp(-e/.006));let a=this.power>this.filament?.045:.32;this.filament+=(this.power-this.filament)*(1-Math.exp(-e/a)),1e-4>Math.abs(this.filament-t)&&(this.filament=t),1e-4>Math.abs(this.power-t)&&(this.power=t);let i=this.on?.55:2.6;this.front+=(i-this.front)*(1-Math.exp(-e/.08)),.001>Math.abs(this.front-i)&&(this.front=i),this.room.step(e);let o=Math.max(0,Math.min(1,this.room.value));o>.4?this.charge+=(1-this.charge)*(1-Math.exp(-(1.6*e)*o)):this.charge+=(.55-this.charge)*(1-Math.exp(-e/3.2));let l=.002>Math.abs(this.charge-(o>.4?1:.55));return l&&(this.charge=o>.4?1:.55),!(this.power===t&&this.filament===t&&this.front===i&&this.room.settled&&l)}get glow(){let e=1-Math.max(0,Math.min(1,this.room.value));return this.charge*e*e}}let d=(e,t,a)=>{let i=Math.min(1,Math.max(0,(a-e)/(t-e)));return i*i*(3-2*i)};class f{x=new Float64Array(20);y=new Float64Array(20);px=new Float64Array(20);py=new Float64Array(20);vx=new Float64Array(20);vy=new Float64Array(20);w=new Float64Array(20);ax=0;ay=0;arm=196;seg=7.4;width=600;floor=500;inertia=1;rcm=1;theta=0;omega=0;yl=0;vyl=0;d=0;vd=0;armed=!0;tension=0;grab=-1;hx=0;hy=0;hxPrev=0;hyPrev=0;rx=1;ry=0;ux=0;uy=1;ox=0;oy=0;ex=0;ey=0;reduced=!1;maxSpeed=0;events={};flip=!1;clinkCooldown=0;lambdaLinks=new Float64Array(20);lambdaBends=new Float64Array(20);lambdaGrip=0;lambdaExit=0;constructor(e){for(let e=0;e<20;e++)this.w[e]=1/(19===e?.6:.04);this.applyLayout(e,!0)}applyLayout(e,t=!1){let a=e.ax-this.ax,i=e.ay-this.ay;if(this.ax=e.ax,this.ay=e.ay,this.arm=e.arm,this.seg=e.cord/20,this.width=e.width,this.floor=e.floor,this.rcm=e.arm-22,this.inertia=50*this.rcm*this.rcm,t)return void this.hang();for(let e=0;e<20;e++)this.x[e]+=a,this.y[e]+=i,this.px[e]+=a,this.py[e]+=i;this.hx+=a,this.hy+=i,this.hxPrev+=a,this.hyPrev+=i,this.frame()}hang(){this.theta=0,this.omega=0,this.yl=0,this.vyl=0,this.d=0,this.vd=0,this.armed=!0,this.grab=-1,this.frame();for(let e=0;e<20;e++)this.x[e]=this.ex,this.y[e]=this.ey+(e+1)*this.seg,this.px[e]=this.x[e],this.py[e]=this.y[e],this.vx[e]=0,this.vy[e]=0;let e=this.events,t=this.reduced;this.events={},this.reduced=!0;for(let e=0;e<40;e++)this.step(1/60);this.reduced=t,this.events=e,this.omega=0,this.vyl=0;for(let e=0;e<20;e++)this.vx[e]=0,this.vy[e]=0}frame(){let e=Math.cos(this.theta),t=Math.sin(this.theta);this.rx=e,this.ry=t,this.ux=-t,this.uy=e;let a=this.arm+this.yl;this.ox=this.ax+this.ux*a,this.oy=this.ay+this.uy*a,this.ex=this.ox+80.5*this.rx- -4.391538521987725*this.ux,this.ey=this.oy+80.5*this.ry- -4.391538521987725*this.uy}restX(){return this.ex}restY(){return this.ey+20*this.seg}hold(e){this.grab=e,this.hx=this.hxPrev=this.x[e],this.hy=this.hyPrev=this.y[e]}moveHand(e,t){this.hx=e,this.hy=t}release(){this.grab=-1}nearest(e,t){let a=1/0,i=-1;for(let o=0;o<20;o++){let l=this.x[o],s=this.y[o],r=2.1;if(19===o){let e=l-this.x[o-1],t=s-this.y[o-1],a=Math.hypot(e,t)||1;l+=e/a*12,s+=t/a*12,r=10.4}let n=Math.hypot(e-l,t-s)-r;n<a&&(a=n,i=o)}return{index:i,distance:a}}nudge(e,t=0){this.vx[19]+=e,this.vy[19]+=t}push(e){this.omega+=e}get settled(){return this.grab<0&&this.maxSpeed<.6&&.002>Math.abs(this.omega)&&.05>Math.abs(this.vyl)&&.3>Math.abs(this.vd)&&this.d<.02}step(e){let t=Math.min(16,Math.max(4,Math.ceil(600*e))),a=e/t;this.maxSpeed=0;for(let e=0;e<t;e++){let i=(e+1)/t;this.substep(a,this.hxPrev+(this.hx-this.hxPrev)*i,this.hyPrev+(this.hy-this.hyPrev)*i)}this.hxPrev=this.hx,this.hyPrev=this.hy,this.clinkCooldown=Math.max(0,this.clinkCooldown-e)}substep(e,t,a){var i;let o,l=this.reduced,s=Math.exp(-(l?9:.5)*e),r=Math.exp(-(l?9:.7)*e),n=Math.exp(-(l?40:9)*e),{x:h,y:c,px:m,py:u,vx:f,vy:p,w:v}=this,x=e*e,y=this.theta,b=this.yl;this.omega+=-(1800/this.rcm)*Math.sin(this.theta)*e,this.omega*=r,this.theta+=this.omega*e,this.vyl+=-666.6666666666666*this.yl*e,this.vyl*=n,this.yl+=this.vyl*e;let g=Math.max(0,this.tension);this.vd=(this.vd+(g-(o=(i=this.d)<=16?d(9,16,i):1-d(16,16.8,i),6119.999999999999+235.38461538461536*i+2141.9999999999995*o))/.1*e)/(1+140*e),this.d+=this.vd*e,this.d<0?(this.d=0,this.vd<0&&(this.vd=0)):this.d>26&&(this.d=26,this.vd>0&&(this.vd=0)),this.frame();for(let t=0;t<20;t++)p[t]+=1800*e,f[t]*=s,p[t]*=s,m[t]=h[t],u[t]=c[t],h[t]+=f[t]*e,c[t]+=p[t]*e;let w=this.lambdaLinks,C=this.lambdaBends;w.fill(0),C.fill(0),this.lambdaGrip=0,this.lambdaExit=0;let M=this.seg,R=15e-6/x,T=.003/x;for(let e=0;e<3;e++){if(this.grab>=0&&this.solveGrip(t,a,1e-6/x,16e3*x),this.flip=!this.flip,this.flip){this.solveExit(R);for(let e=1;e<20;e++)w[e]+=this.solveLink(e-1,e,M,R,w[e])}else{for(let e=19;e>=1;e--)w[e]+=this.solveLink(e-1,e,M,R,w[e]);this.solveExit(R)}for(let e=2;e<20;e++)C[e]+=this.solveLink(e-2,e,2*M,T,C[e])}this.collide(e);let B=this.maxSpeed*this.maxSpeed;for(let t=0;t<20;t++){f[t]=(h[t]-m[t])/e,p[t]=(c[t]-u[t])/e;let a=f[t]*f[t]+p[t]*p[t];a>B&&(B=a)}this.maxSpeed=Math.sqrt(B),this.omega=(this.theta-y)/e,this.vyl=(this.yl-b)/e;let L=-this.lambdaExit/x;this.tension+=(L-this.tension)*(1-Math.exp(-e/.006)),this.armed&&this.d>=16?this.grab>=0&&(this.armed=!1,this.events.onClick?.(this.vd)):!this.armed&&this.d<=5&&(this.armed=!0,this.events.onRearm?.(-this.vd))}solveGrip(e,t,a,i){let{x:o,y:l,w:s}=this,r=this.grab,n=o[r]-e,h=l[r]-t,c=Math.hypot(n,h);if(c<1e-9)return;let m=(-c-a*this.lambdaGrip)/(s[r]+a);this.lambdaGrip+m<-i&&(m=-i-this.lambdaGrip),this.lambdaGrip+=m,o[r]+=s[r]*m*n/c,l[r]+=s[r]*m*h/c}solveExit(e){let{x:t,y:a,w:i}=this,o=t[0]-this.ex,l=a[0]-this.ey,s=Math.hypot(o,l);if(s<1e-9)return;let r=o/s,n=l/s,h=s-(this.seg+this.d),c=(this.ex-this.ax)*n-(this.ey-this.ay)*r,m=this.ux*r+this.uy*n,u=c*c/this.inertia+m*m/6,d=(-h-e*this.lambdaExit)/(i[0]+u+e);this.lambdaExit+=d,t[0]+=i[0]*d*r,a[0]+=i[0]*d*n,this.theta+=-c*d/this.inertia,this.yl+=-m*d/6,this.frame()}solveLink(e,t,a,i,o){let{x:l,y:s,w:r}=this,n=l[t]-l[e],h=s[t]-s[e],c=Math.hypot(n,h);if(c<1e-9)return 0;let m=(-(c-a)-i*o)/(r[e]+r[t]+i),u=n/c,d=h/c;return l[e]-=r[e]*m*u,s[e]-=r[e]*m*d,l[t]+=r[t]*m*u,s[t]+=r[t]*m*d,m}collide(e){let{x:t,y:a,px:i,py:o}=this,{rx:l,ry:s,ux:r,uy:h,ox:m,oy:u}=this;for(let d=1;d<20;d++){let f=19===d,p=f?7.5600000000000005:2.5,v=t[d]-m,x=a[d]-u,y=v*l+x*s,b=-(v*r+x*h),g=null;if(b>-p){let e=84+p,t=n+p,a=Math.max(0,b),i=y/e*(y/e)+a/t*(a/t);if(i<1){let e=1/Math.sqrt(Math.max(i,1e-6));b+p<Math.hypot(y,a)*(e-1)?b=-p:(y*=e,b=a*e),g="shade"}}if(!g){let e=y,t=b-c,a=18+p,i=Math.hypot(e,t);i<a&&i>1e-6&&(y=e/i*a,b=c+t/i*a,g="bulb")}if(g){let n=m+l*y-r*b,c=u+s*y-h*b,p=n-t[d],v=c-a[d],x=Math.hypot(p,v)||1;p/=x,v/=x;let w=(t[d]-i[d])/e,C=(a[d]-o[d])/e,M=w*p+C*v,R=w,T=C;M<0&&(R=(w-M*p)*.82-.25*M*p,T=(C-M*v)*.82-.25*M*v,f&&-M>90&&this.clinkCooldown<=0&&(this.clinkCooldown=.08,this.events.onClink?.(-M,g))),t[d]=n,a[d]=c,i[d]=n-R*e,o[d]=c-T*e}let w=f?8.4:3.1;t[d]<w?t[d]=w:t[d]>this.width-w&&(t[d]=this.width-w),a[d]<this.ay+2?a[d]=this.ay+2:a[d]>this.floor&&(a[d]=this.floor)}}}var p=e.i(55171);function v(e){return`#version 300 es
precision highp float;
#define OBJECTS ${+!!e}

out vec4 outColor;

uniform vec2 uRes;
uniform float uPx;
uniform vec2 uView;
uniform float uSeed;

uniform vec3 uWallLit;
uniform vec3 uWallDark;
uniform vec3 uWarm;
uniform vec3 uGlowCol;

uniform vec2 uAnchor;
uniform vec2 uO;
uniform vec2 uRight;
uniform vec2 uDown;
uniform vec2 uBulb;
uniform float uEmit;
uniform float uFil;
uniform float uRoom;
uniform float uFront;
uniform float uReach;
uniform float uGlow;
uniform float uHover;
uniform vec3 uLampCol;
uniform float uRvLamp;

uniform vec4 uCord[44];
uniform int uCordN;
uniform vec4 uCordBox;
uniform vec2 uBeadO;
uniform vec2 uBeadUp;

const float R = 84.00000;
const float HD = 58.00000;
const float SIL = ${n.toFixed(5)};
const float RIM_E = ${h.toFixed(5)};
const float TC = 0.97590;
const float TS = 0.21823;
const float BULB_R = 18.00000;
const float BULB_Y = -5.00000;
const float NECK_R = 8.00000;
const float NECK_TOP = 74.00000;
const float GX = 80.50000;
const float GR = 3.40000;
const float GY0 = -4.50000;
const float GY1 = 2.00000;
const float CANOPY_R = 24.00000;
const float CABLE_R = 1.70000;
const float CORD_R = 2.10000;
const float BR1 = 8.40000;
const float BR2 = 3.40000;
const float BH = 16.00000;

const float WALL_Z = 120.0;
const float CUT = 0.30;
const float SHADOW_K = 1.3;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sdEllipse(vec2 p, vec2 ab) {
  float k0 = length(p / ab);
  float k1 = length(p / (ab * ab));
  return k0 * (k0 - 1.0) / max(k1, 1e-5);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdUnevenCapsule(vec2 p, float r1, float r2, float h) {
  p.x = abs(p.x);
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);
  float k = dot(p, vec2(-b, a));
  if (k < 0.0) return length(p) - r1;
  if (k > a * h) return length(p - vec2(0.0, h)) - r2;
  return dot(p, vec2(a, b)) - r1;
}

vec3 toSrgb(vec3 c) {
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

/** Soft shoulder above 0.8: the palette below stays exact, light rolls off to white. */
vec3 tone(vec3 c) {
  vec3 x = max(c - 0.8, 0.0);
  return min(c, vec3(0.8)) + 0.2 * (1.0 - exp(-x * 5.0));
}

/** From the lamp's screen frame (lx, ly up) to scene coordinates. */
vec2 lampToScene(vec2 l) {
  return uO + uRight * l.x - uDown * l.y;
}

/** A lamp-space direction (y up its axis) in camera space (y up). */
vec3 lampToCamera(vec3 n) {
  vec3 c = vec3(n.x, n.y * TC + n.z * TS, -n.y * TS + n.z * TC);
  vec2 right = vec2(uRight.x, -uRight.y);
  vec2 up = vec2(-uDown.x, uDown.y);
  return vec3(right * c.x + up * c.y, c.z);
}

/** How lit the room is at p: the front spreading out from the lamp. */
float revealAt(vec2 p) {
  float r = clamp((uRoom * (uReach + uFront) - length(p - uBulb)) / uFront, 0.0, 1.0);
  return r * r * (3.0 - 2.0 * r);
}

/* ------------------------------------------------------------------ */
/* light                                                               */
/* ------------------------------------------------------------------ */

/**
 * What a surface sees in direction r (camera space): the ceiling dim above,
 * the room lit by the lamp below, a soft key up and to the left in front.
 */
vec3 envAt(vec3 r, float rv, vec3 lampCol) {
  float up = clamp(r.y, -1.0, 1.0) * 0.5 + 0.5;
  float below = smoothstep(0.55, 0.0, up);
  vec3 lit = uWallLit * mix(0.98, 0.66, up) + lampCol * uEmit * 0.16 * below;
  vec3 dark = uWallDark * mix(1.15, 0.85, up) + lampCol * uEmit * 0.42 * below;
  vec3 e = mix(dark, lit, rv);
  vec3 key = normalize(vec3(-0.5, 0.55, 0.67));
  float k = pow(max(dot(r, key), 0.0), 14.0);
  e += mix(vec3(0.030, 0.033, 0.040), vec3(1.35), rv) * k;
  return e;
}

/** The lamp's direct light on the wall: the scallop below the shade. */
float scallop(vec2 p) {
  vec3 v = vec3(p - uBulb, -WALL_Z);
  float len = length(v);
  float ca = dot(v.xy, uDown) / len;
  float soft = 0.04 + 0.12 * clamp(len / 420.0, 0.0, 1.0);
  float cone = smoothstep(CUT - soft, CUT + soft, ca);
  return cone * WALL_Z / len;
}

/** Distance to the cord's centreline (and the arc length and offset at the nearest point). */
float cordField(vec2 p, out float s, out vec2 off) {
  float best = 1e9;
  s = 0.0;
  off = vec2(0.0);
  for (int i = 0; i < 43; i++) {
    if (i >= uCordN - 1) break;
    vec4 a = uCord[i];
    vec4 b = uCord[i + 1];
    vec2 pa = p - a.xy;
    vec2 ba = b.xy - a.xy;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    float d2 = dot(q, q);
    if (d2 < best) {
      best = d2;
      s = mix(a.z, b.z, h);
      off = q;
    }
  }
  return sqrt(best);
}

float cordDistance(vec2 p) {
  float best = 1e9;
  for (int i = 0; i < 43; i++) {
    if (i >= uCordN - 1) break;
    vec2 pa = p - uCord[i].xy;
    vec2 ba = uCord[i + 1].xy - uCord[i].xy;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    best = min(best, dot(q, q));
  }
  return sqrt(best);
}

vec2 beadLocal(vec2 p) {
  vec2 q = p - uBeadO;
  return vec2(dot(q, vec2(-uBeadUp.y, uBeadUp.x)), -dot(q, uBeadUp));
}

float beadDistance(vec2 p) {
  vec2 l = beadLocal(p);
  return sdUnevenCapsule(vec2(l.x, -l.y), BR1, BR2, BH);
}

bool inBox(vec2 p, vec4 box, float pad) {
  return p.x > box.x - pad && p.y > box.y - pad && p.x < box.z + pad && p.y < box.w + pad;
}

/** Graphite enamel (shade, canopy): diffuse from the room, a glossy coat. */
vec3 enamel(vec3 n, vec3 albedo, float rv, vec3 lampCol, float gloss) {
  vec3 v = vec3(0.0, 0.0, 1.0);
  vec3 r = reflect(-v, n);
  float fres = 0.04 + 0.96 * pow(1.0 - max(n.z, 0.0), 5.0);
  return albedo * envAt(n, rv, lampCol) + envAt(r, rv, lampCol) * mix(0.05, 0.75, fres) * gloss;
}

/** Brushed brass (neck, grommet). */
vec3 brass(vec3 n, float rv, vec3 lampCol, float streak) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 base = vec3(0.62, 0.42, 0.20);
  vec3 e = envAt(r, rv, lampCol);
  return base * (e * (0.75 + 0.25 * streak) + 0.04 * envAt(n, rv, lampCol));
}

/** Braided cotton: a herringbone of grooves along the cord, faded out when too small to resolve. */
float braid(float s, float across, float period) {
  float v = fract(s / period + abs(across) * 0.42);
  float groove = smoothstep(0.0, 0.2, v) * smoothstep(1.0, 0.8, v);
  float lod = smoothstep(2.2, 4.5, period * uPx);
  return mix(1.0, mix(0.66, 1.0, groove), lod);
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 p = frag / uPx;
  float aa = 1.0 / uPx;
  vec3 lampCol = uLampCol;
  float rvHere = revealAt(p);
  float rvLamp = uRvLamp;

  /* wall ----------------------------------------------------------- */
  vec2 cv = p / uView - vec2(0.5, 0.42);
  float vig = clamp(1.0 - dot(cv, cv) * 0.95, 0.0, 1.0);
  vec3 dark = uWallDark * (0.74 + 0.34 * vig);
  // lit: only bounced light reaches the wall above the shade's cut-off, a
  // shade dimmer toward the ceiling; the lamp's own light adds the rest
  vec3 lit = uWallLit * (0.90 + 0.04 * vig) * (1.0 - 0.07 * (1.0 - smoothstep(0.0, 230.0, p.y)));
  lit *= 1.0 + 0.5 * max(uRoom - 1.0, 0.0);
  vec3 col = mix(dark, lit, rvHere);

  float shade = 0.0;
  float covOuter = 0.0;
  float ly = 0.0;
#if OBJECTS
  // the cord's and the pull's shadows, cast by the bulb onto the wall behind
  vec2 caster = uBulb + (p - uBulb) / SHADOW_K;
  if (uEmit > 0.002 && inBox(caster, uCordBox, 14.0)) {
    float pen = 1.4 + 0.016 * length(caster - uBulb);
    float dc = cordDistance(caster);
    shade = 1.0 - smoothstep(CORD_R - pen, CORD_R + pen, dc);
    float db = beadDistance(caster);
    shade = max(shade, 1.0 - smoothstep(-pen * 1.4, pen * 1.4, db));
  }
#endif
  float direct = scallop(p) * uEmit * (1.0 - 0.8 * shade);
  col += lampCol * direct * mix(1.25, 0.24, rvHere);

#if OBJECTS
  // the pull's glow on the wall around it
  float dBead = 1e9;
  if (uGlow > 0.002 && inBox(p, uCordBox, 48.0)) {
    dBead = beadDistance(p);
    col += uGlowCol * uGlow * 0.07 * exp(-max(dBead, 0.0) / 13.0);
  }

  /* canopy --------------------------------------------------------- */
  {
    vec2 q = p - uAnchor;
    float cy = -q.y;
    if (abs(q.x) < CANOPY_R + 3.0 && cy > -CANOPY_R * TS - 3.0) {
      float dSide = max(abs(q.x) - CANOPY_R, -cy);
      float dDisc = sdEllipse(vec2(q.x, cy), vec2(CANOPY_R, CANOPY_R * TS));
      float covSide = clamp(0.5 - dSide / aa, 0.0, 1.0);
      float nx = clamp(q.x / CANOPY_R, -1.0, 1.0);
      float nz = sqrt(1.0 - nx * nx);
      vec3 nSide = vec3(nx, nz * TS, nz * TC);
      vec3 cSide = enamel(nSide, vec3(0.034), rvLamp, lampCol, 1.0);
      col = mix(col, cSide, covSide);
      float covDisc = clamp(0.5 - dDisc / aa, 0.0, 1.0);
      vec3 nDisc = vec3(0.0, -TC, TS);
      vec3 cDisc = enamel(nDisc, vec3(0.034), rvLamp, lampCol, 0.6);
      // the cable's hole
      float hole = sdEllipse(vec2(q.x, cy), vec2(3.2, 3.2 * TS + 0.4));
      cDisc *= mix(1.0, 0.35, clamp(0.5 - hole / aa, 0.0, 1.0));
      col = mix(col, cDisc, covDisc);
    }
  }

  /* cable ---------------------------------------------------------- */
  vec2 neckTop = lampToScene(vec2(0.0, NECK_TOP * TC));
  {
    float dc = sdSegment(p, uAnchor, neckTop);
    if (dc < CABLE_R + 2.0) {
      vec2 axis = normalize(neckTop - uAnchor);
      vec2 rel = p - uAnchor;
      float across = clamp(dot(rel, vec2(axis.y, -axis.x)) / CABLE_R, -1.0, 1.0);
      vec3 n = vec3(vec2(axis.y, -axis.x) * across * vec2(1.0, -1.0), sqrt(1.0 - across * across));
      float b = braid(dot(rel, axis), across, 3.4);
      vec3 c = enamel(n, vec3(0.030) * b, rvLamp, lampCol, 0.25);
      col = mix(col, c, clamp(0.5 - (dc - CABLE_R) / aa, 0.0, 1.0));
    }
  }

  /* lamp ----------------------------------------------------------- */
  vec2 dl = p - uO;
  float lx = dot(dl, uRight);
  ly = -dot(dl, uDown);
  if (lx > -R - 6.0 && lx < R + 6.0 && ly > BULB_Y * TC - BULB_R - 8.0 && ly < NECK_TOP * TC + 8.0) {
    vec2 l = vec2(lx, ly);
    float dRim = sdEllipse(l, vec2(R, RIM_E));
    float dDome = max(sdEllipse(l, vec2(R, SIL)), -ly);
    float dOuter = max(dDome, -dRim);

    // ray through this pixel in lamp space
    vec3 ro = vec3(lx, ly * TC, ly * TS) + 400.0 * vec3(0.0, -TS, TC);
    vec3 rd = vec3(0.0, TS, -TC);
    vec3 sc = vec3(1.0 / R, 1.0 / HD, 1.0 / R);
    vec3 o2 = ro * sc;
    vec3 d2 = rd * sc;
    float qa = dot(d2, d2);
    float qb = dot(o2, d2);
    float qc = dot(o2, o2) - 1.0;
    float sq = sqrt(max(qb * qb - qa * qc, 0.0));
    vec3 p1 = ro + rd * ((-qb - sq) / qa);
    vec3 p2 = ro + rd * ((-qb + sq) / qa);
    vec3 bulbC = vec3(0.0, BULB_Y, 0.0);

    // inside of the shade: white enamel lit by the bulb
    float covIn = clamp(0.5 - dRim / aa, 0.0, 1.0);
    vec3 interior = vec3(0.0);
    if (covIn > 0.0) {
      vec3 nIn = -normalize(p2 * sc * sc);
      vec3 L = bulbC - p2;
      float dist2 = dot(L, L);
      float irr = max(dot(nIn, L * inversesqrt(dist2)), 0.0) * 2400.0 / (dist2 + 400.0);
      vec3 amb = envAt(vec3(0.0, -0.6, 0.8), rvLamp, lampCol) * 0.42;
      interior = vec3(0.80, 0.79, 0.76) * (lampCol * uEmit * irr + amb);
      // the rolled edge of the rim, seen from inside
      float lip = exp(-pow(max(-dRim, 0.0) / 1.1, 2.0)) * step(ly, 0.0);
      interior = mix(interior, interior * 1.25 + vec3(0.02), lip * 0.6);
      col = mix(col, interior, covIn);
    }

    // the socket above the bulb (dark porcelain), seen through the opening
    {
      float top = (BULB_Y + BULB_R - 4.0) * TC;
      float dS = max(abs(lx) - 9.5, top - ly);
      float covS = clamp(0.5 - dS / aa, 0.0, 1.0) * covIn;
      float nx = clamp(lx / 9.5, -1.0, 1.0);
      vec3 cS = enamel(lampToCamera(vec3(nx, 0.0, sqrt(1.0 - nx * nx))), vec3(0.05), rvLamp, lampCol, 0.5);
      cS += vec3(0.6, 0.58, 0.55) * lampCol * uEmit * 0.5 * (1.0 - smoothstep(top, top + 8.0, ly));
      col = mix(col, cS, covS);
    }

    // the bulb: clear glass, a coiled filament on two supports
    vec2 bq = vec2(lx, ly - BULB_Y * TC);
    float dB = length(bq) - BULB_R;
    if (dB < 2.0) {
      float covB = clamp(0.5 - dB / aa, 0.0, 1.0);
      vec2 n2 = bq / BULB_R;
      float rr = min(dot(n2, n2), 1.0);
      vec3 n = lampToCamera(normalize(vec3(n2.x, n2.y, sqrt(1.0 - rr))));
      vec3 behind = col;
      vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
      float fres = 0.04 + 0.96 * pow(1.0 - max(n.z, 0.0), 5.0);
      vec3 glass = behind * 0.9 + envAt(r, rvLamp, lampCol) * fres * 0.9;
      // a crisp highlight from the key
      glass += mix(vec3(0.05), vec3(1.4), rvLamp) * pow(max(dot(r, normalize(vec3(-0.5, 0.55, 0.67))), 0.0), 90.0);
      // filament: a coil across the middle, two support wires up to the stem
      vec2 fq = bq;
      float coil = abs(fq.y + 1.5 - 1.3 * sin(fq.x * 2.6)) - 0.35;
      coil = max(coil, abs(fq.x) - 6.0);
      float wireL = sdSegment(fq, vec2(-6.0, -1.5), vec2(-2.0, 9.5)) - 0.3;
      float wireR = sdSegment(fq, vec2(6.0, -1.5), vec2(2.0, 9.5)) - 0.3;
      float stem = max(abs(fq.x) - 1.4, max(fq.y - BULB_R, 8.0 - fq.y));
      float dF = min(coil, min(wireL, wireR));
      float covF = clamp(0.5 - dF / max(aa, 0.35), 0.0, 1.0);
      float covStem = clamp(0.5 - stem / aa, 0.0, 1.0);
      glass = mix(glass, glass * 0.85 + 0.03 * envAt(n, rvLamp, lampCol), covStem * 0.6);
      float heat = uFil * uFil;
      vec3 wire = mix(vec3(0.03), lampCol * (1.0 + 10.0 * heat), smoothstep(0.02, 0.3, uFil));
      glass = mix(glass, wire, covF * mix(0.75, 1.0, smoothstep(0.0, 0.3, uFil)));
      // glow inside the glass around the hot wire
      glass += lampCol * uEmit * (0.7 * exp(-max(dF, 0.0) / 2.2) + 0.45 * (0.55 + 0.45 * n.z));
      col = mix(col, glass, covB);
    }

    // grommet: a small brass eyelet on the rim the cord leaves through
    {
      float gx = lx - GX;
      float bottom = GY0 * TC - GR * TS * sqrt(max(1.0 - (gx / GR) * (gx / GR), 0.0));
      float dG = max(abs(gx) - GR, max(ly - GY1 * TC, bottom - ly));
      float covG = clamp(0.5 - dG / aa, 0.0, 1.0);
      if (covG > 0.0) {
        float nx = clamp(gx / GR, -1.0, 1.0);
        vec3 n = lampToCamera(vec3(nx, 0.0, sqrt(1.0 - nx * nx)));
        vec3 cG = brass(n, rvLamp, lampCol, 0.5 + 0.5 * sin(ly * 3.0));
        // its underside, lit from the room below
        float cap = smoothstep(GY0 * TC + 0.8, GY0 * TC - 0.5, ly);
        cG = mix(cG, brass(lampToCamera(vec3(0.0, -1.0, 0.0)), rvLamp, lampCol, 1.0) * 0.8, cap);
        cG += vec3(0.62, 0.42, 0.2) * lampCol * uEmit * 0.6 * smoothstep(GR, -GR, gx);
        col = mix(col, cG, covG);
      }
    }

    // neck: brass, where the cable comes in
    {
      float dN = max(abs(lx) - NECK_R, max(ly - NECK_TOP * TC, (SIL - 10.0) - ly));
      float covN = clamp(0.5 - dN / aa, 0.0, 1.0);
      if (covN > 0.0) {
        float nx = clamp(lx / NECK_R, -1.0, 1.0);
        vec3 n = lampToCamera(vec3(nx, 0.0, sqrt(1.0 - nx * nx)));
        // two turned rings
        float ring = smoothstep(0.6, 0.0, abs(ly - (NECK_TOP - 5.0) * TC) - 0.9);
        vec3 cN = brass(n, rvLamp, lampCol, 0.6 + 0.4 * sin(ly * 2.0)) * (1.0 - 0.35 * ring);
        col = mix(col, cN, covN);
      }
    }

    // outside of the shade: graphite enamel
    covOuter = clamp(0.5 - dOuter / aa, 0.0, 1.0);
    if (covOuter > 0.0) {
      vec3 nl = normalize(p1 * sc * sc);
      vec3 n = lampToCamera(nl);
      vec3 cO = enamel(n, vec3(0.032), rvLamp, lampCol, 1.0);
      // bounce from the lit room below catches the lower edge
      float low = smoothstep(26.0, 0.0, p1.y);
      cO += vec3(0.032) * lampCol * uEmit * low * 1.8 * mix(1.0, 0.4, rvLamp);
      // the rolled lip along the near rim
      float lip = exp(-pow(max(dRim, 0.0) / 1.2, 2.0));
      cO = mix(cO, enamel(lampToCamera(normalize(vec3(nl.x, -0.4, nl.z))), vec3(0.06), rvLamp, lampCol, 1.4), lip * 0.8);
      col = mix(col, cO, covOuter);
    }
  }

  /* cord ----------------------------------------------------------- */
  if (inBox(p, uCordBox, 3.0)) {
    float s;
    vec2 off;
    float dc = cordField(p, s, off);
    if (dc < CORD_R + 1.5) {
      vec2 o = off / CORD_R;
      float across = clamp(length(o), 0.0, 1.0);
      vec3 n = vec3(o.x, -o.y, sqrt(max(1.0 - across * across, 0.0)));
      float b = braid(s, across, 4.2);
      vec3 c = enamel(n, vec3(0.034) * b, revealAt(p), lampCol, 0.18);
      // the bulb lights the side that faces it, below the rim
      vec2 toB = uBulb - p;
      float dist = length(toB);
      vec3 L = normalize(vec3(toB.x, -toB.y, 6.0));
      float vis = smoothstep(-0.02, 0.25, dot(-toB / dist, uDown));
      c += vec3(0.05) * b * lampCol * uEmit * max(dot(n, L), 0.0) * vis * 9000.0 / (dist * dist + 1600.0);
      // the pull's glow reaches the last stretch of cord
      if (uGlow > 0.002) c += uGlowCol * uGlow * 0.12 * exp(-max(beadDistance(p), 0.0) / 9.0);
      col = mix(col, c, clamp(0.5 - (dc - CORD_R) / aa, 0.0, 1.0));
    }
  }

  /* the pull ------------------------------------------------------- */
  if (inBox(p, uCordBox, 4.0)) {
    float db = beadDistance(p);
    if (db < 1.5) {
      float e = 0.6;
      vec2 g = vec2(beadDistance(p + vec2(e, 0.0)) - beadDistance(p - vec2(e, 0.0)),
                    beadDistance(p + vec2(0.0, e)) - beadDistance(p - vec2(0.0, e)));
      g = g / max(length(g), 1e-5);
      vec2 bl = beadLocal(p);
      float along = clamp((-bl.y) / BH, 0.0, 1.0);
      float rLoc = mix(BR1, BR2, along);
      float s = clamp(1.0 + min(db, 0.0) / rLoc, 0.0, 1.0);
      vec3 n = normalize(vec3(g.x * s, -g.y * s, sqrt(max(1.0 - s * s, 0.0))));
      vec3 albedo = vec3(0.86, 0.85, 0.82);
      float rv = revealAt(p);
      vec3 c = albedo * envAt(n, rv, lampCol);
      // the bulb, up and to the side
      vec2 toB = uBulb - p;
      float dist = length(toB);
      vec3 L = normalize(vec3(toB.x, -toB.y, 10.0));
      c += albedo * lampCol * uEmit * max(dot(n, L), 0.0) * 9000.0 / (dist * dist + 1600.0) * 0.5;
      // glaze: reflections, a sharp glint of the bulb
      vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
      float fres = 0.04 + 0.96 * pow(1.0 - max(n.z, 0.0), 5.0);
      c += envAt(r, rv, lampCol) * mix(0.05, 0.8, fres) * 0.6;
      c += lampCol * uEmit * pow(max(dot(r, L), 0.0), 160.0) * 2.5;
      // a turned groove near the top
      float groove = exp(-pow((-bl.y - (BH - 2.5)) / 0.8, 2.0));
      c *= 1.0 - 0.28 * groove;
      // phosphorescent glaze glowing in the dark
      c += uGlowCol * uGlow * (0.36 + 0.2 * n.z);
      c += albedo * uHover * 0.05;
      col = mix(col, c, clamp(0.5 - db / aa, 0.0, 1.0));
    }
  }

#endif

  /* bloom ---------------------------------------------------------- */
  if (uEmit > 0.001) {
    vec2 bq = p - uBulb;
    float rb = length(bq * vec2(1.0, 1.18));
    float bloom = 0.55 * exp(-rb / 10.0) + 0.22 * exp(-rb / 36.0) + 0.07 * exp(-rb / 120.0);
    // the shade hides the bulb from above: less glare over the dome
    bloom *= mix(1.0, 0.3, covOuter * smoothstep(0.0, 26.0, ly));
    col += lampCol * uEmit * bloom * mix(1.0, 0.5, rvHere);
  }

  col = toSrgb(tone(col));
  col += (hash12(frag + uSeed) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`}let x=v(!1),y=v(!0),b=e=>{let t=e/255;return t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)},g=e=>[b(parseInt(e.slice(1,3),16)),b(parseInt(e.slice(3,5),16)),b(parseInt(e.slice(5,7),16))],w={wallLit:g("#efefef"),wallDark:g("#232323"),warm:g("#ffd8ae"),glow:g("#d9f2e6")},C=(e,t,a)=>{let i=Math.min(1,Math.max(0,(a-e)/(t-e)));return i*i*(3-2*i)};class M{gl;room;full;vao;cord=new Float32Array(176);lampCol=new Float32Array(3);cx=new Float64Array(21);cy=new Float64Array(21);cs=new Float64Array(21);count=0;seed=0;bx=0;by=0;reach=1;beadX=0;beadY=0;beadUx=0;beadUy=-1;box={minX:0,minY:0,maxX:0,maxY:0};constructor(e){this.gl=e;const t=(0,p.createProgram)(e,p.FULLSCREEN_VERTEX,x),a=(0,p.createProgram)(e,p.FULLSCREEN_VERTEX,y);this.room={program:t,u:(0,p.uniformLocations)(e,t)},this.full={program:a,u:(0,p.uniformLocations)(e,a)},this.vao=e.createVertexArray()}render(e,t,a,i,o){let{gl:l}=this,s=l.canvas,r=s.width,n=s.height;if(!r||!n)return;let h=r/a.width;this.prepare(e,t,a,i),l.viewport(0,0,r,n),l.disable(l.BLEND),l.disable(l.DEPTH_TEST),l.bindVertexArray(this.vao),this.seed=(this.seed+17.31)%1e3,l.disable(l.SCISSOR_TEST),this.uniforms(this.room,e,t,a,i,o,h,r,n),l.drawArrays(l.TRIANGLES,0,3);let c=this.objectsBox(e,a),m=Math.max(0,Math.floor(c.minX*h)-2),u=Math.min(r,Math.ceil(c.maxX*h)+2),d=Math.max(0,Math.floor(c.minY*h)-2),f=Math.min(n,Math.ceil(c.maxY*h)+2);u>m&&f>d&&(l.enable(l.SCISSOR_TEST),l.scissor(m,n-f,u-m,f-d),this.uniforms(this.full,e,t,a,i,o,h,r,n),l.drawArrays(l.TRIANGLES,0,3),l.disable(l.SCISSOR_TEST))}prepare(e,t,a,i){var o,l,s;let r,n,h,m;this.bx=e.ox-e.ux*c,this.by=e.oy-e.uy*c;let{bx:u,by:d}=this,f=Math.hypot(u,d);f=Math.max(f=Math.max(f=Math.max(f,Math.hypot(a.width-u,d)),Math.hypot(u,a.height-d)),Math.hypot(a.width-u,a.height-d)),this.reach=f,o=t.filament,l=i.warm,s=this.lampCol,r=C(.12,.55,o),n=C(.5,.96,o),h=.13+.27*r,m=.015+.075*r,s[0]=1+(l[0]-1)*n,s[1]=h+(l[1]-h)*n,s[2]=m+(l[2]-m)*n;let{cx:p,cy:v,cs:x}=this;p[0]=e.ex,v[0]=e.ey,x[0]=-e.d;for(let t=0;t<20;t++)p[t+1]=e.x[t],v[t+1]=e.y[t],x[t+1]=(t+1)*e.seg;this.count=this.spline();let y=e.x[19]-e.x[18],b=e.y[19]-e.y[18],g=Math.hypot(y,b)||1;y/=g,b/=g,this.beadX=e.x[19]+18.2*y,this.beadY=e.y[19]+18.2*b,this.beadUx=-y,this.beadUy=-b;let w=1/0,M=1/0,R=-1/0,T=-1/0;for(let e=0;e<this.count;e++){let t=this.cord[4*e],a=this.cord[4*e+1];t<w&&(w=t),t>R&&(R=t),a<M&&(M=a),a>T&&(T=a)}let B=this.box;B.minX=Math.min(w,this.beadX-14.1)-2.1,B.maxX=Math.max(R,this.beadX+14.1)+2.1,B.minY=Math.min(M,this.beadY-14.1)-2.1,B.maxY=Math.max(T,this.beadY+14.1)+2.1}objects={minX:0,minY:0,maxX:0,maxY:0};objectsBox(e,t){let a=this.objects,i=this.box,o=Math.min(e.ax,e.ox)-124,l=Math.max(e.ax,e.ox)+124,s=0,r=e.oy+124;return o=Math.min(o,i.minX-50),l=Math.max(l,i.maxX+50),s=Math.min(s,i.minY-50),r=Math.max(r,i.maxY+50),o=Math.min(o,this.bx+(i.minX-this.bx)*1.3-20),l=Math.max(l,this.bx+(i.maxX-this.bx)*1.3+20),s=Math.min(s,this.by+(i.minY-this.by)*1.3-20),r=Math.max(r,this.by+(i.maxY-this.by)*1.3+20),a.minX=Math.max(0,o),a.minY=Math.max(0,s),a.maxX=Math.min(t.width,l),a.maxY=Math.min(t.height,r),a}uniforms(e,t,a,i,o,l,s,r,n){let{gl:h}=this,{u:c}=e;h.useProgram(e.program),h.uniform2f(c("uRes"),r,n),h.uniform1f(c("uPx"),s),h.uniform2f(c("uView"),i.width,i.height),h.uniform1f(c("uSeed"),this.seed),h.uniform3fv(c("uWallLit"),o.wallLit),h.uniform3fv(c("uWallDark"),o.wallDark),h.uniform3fv(c("uWarm"),o.warm),h.uniform3fv(c("uGlowCol"),o.glow),h.uniform3fv(c("uLampCol"),this.lampCol),h.uniform2f(c("uAnchor"),t.ax,t.ay),h.uniform2f(c("uO"),t.ox,t.oy),h.uniform2f(c("uRight"),t.rx,t.ry),h.uniform2f(c("uDown"),t.ux,t.uy),h.uniform2f(c("uBulb"),this.bx,this.by);let m=Math.max(1,a.front*this.reach),u=a.room.value;h.uniform1f(c("uEmit"),a.emission),h.uniform1f(c("uFil"),a.filament),h.uniform1f(c("uRoom"),u),h.uniform1f(c("uFront"),m),h.uniform1f(c("uReach"),this.reach),h.uniform1f(c("uGlow"),a.glow),h.uniform1f(c("uHover"),l);let d=Math.min(1,Math.max(0,u*(this.reach+m)/m));h.uniform1f(c("uRvLamp"),d*d*(3-2*d)),h.uniform4fv(c("uCord"),this.cord),h.uniform1i(c("uCordN"),this.count);let f=this.box;h.uniform4f(c("uCordBox"),f.minX,f.minY,f.maxX,f.maxY),h.uniform2f(c("uBeadO"),this.beadX,this.beadY),h.uniform2f(c("uBeadUp"),this.beadUx,this.beadUy)}put(e,t,a,i){let o=this.cord;o[4*e]=t,o[4*e+1]=a,o[4*e+2]=i,o[4*e+3]=0}spline(){let{cx:e,cy:t,cs:a}=this,i=0;this.put(i++,e[0],t[0],a[0]);for(let o=0;o<20;o++){let l=Math.max(0,o-1),s=o+1,r=Math.min(20,o+2);i<43&&this.put(i++,-.0625*e[l]+.5625*e[o]+.5625*e[s]+-.0625*e[r],-.0625*t[l]+.5625*t[o]+.5625*t[s]+-.0625*t[r],(a[o]+a[s])*.5),i<44&&this.put(i++,e[s],t[s],a[s])}return i}dispose(){let{gl:e}=this;e.deleteProgram(this.room.program),e.deleteProgram(this.full.program),this.vao&&e.deleteVertexArray(this.vao)}}class R{mode;sim;light;layout;hover=0;hoverTarget=0;onToggle=null;onClink=null;onRearm=null;renderer=null;script=null;source="hand";grabDx=0;grabDy=0;reduced=!1;sway=1;idle=0;constructor(e,t,a=400,i=400){this.mode=e,this.layout=m(e,a,i),this.sim=new f(this.layout),this.light=new u(t),this.sim.events={onClick:e=>this.clicked(e),onRearm:e=>this.onRearm?.(e),onClink:(e,t)=>this.onClink?.(e,t)}}attach(e){this.renderer=new M(e)}detach(){this.renderer?.dispose(),this.renderer=null}resize(e,t,a=0){e&&t&&(this.layout=m(this.mode,e,t,a),this.sim.applyLayout(this.layout))}setReduced(e){this.reduced=e,this.sim.reduced=e,this.light.reduced=e,e&&(this.light.snap(),this.script=null,this.sim.release())}get busyScript(){return null!==this.script}grab(e,t,a){this.script=null,this.source="hand",this.sim.hold(e),this.grabDx=this.sim.x[e]-t,this.grabDy=this.sim.y[e]-a}drag(e,t){this.sim.grab<0||this.script||this.sim.moveHand(e+this.grabDx,t+this.grabDy)}letGo(){this.script||this.sim.release()}get holding(){return this.sim.grab>=0&&!this.script}lampSide(e,t){let a=this.sim,i=e-a.ox,o=t-a.oy,l=i*a.rx+o*a.ry,s=-(i*a.ux+o*a.uy),r=s>=0&&(l/84)**2+(s/n)**2<=1,m=(l/84)**2+(s/h)**2<=1,u=18>=Math.hypot(l,s-c);return r||m||u?l<0?-1:1:0}knock(e){this.sim.push(e>0?.55:-.55)}nudge(e){this.sim.nudge(260*e)}autoPull(e="auto"){if(this.reduced)return;let t=this.sim;t.grab>=0&&!this.script||(t.hold(19),this.sway=-this.sway,this.source="key"===e?"key":"auto",this.script={kind:e,t:0,x0:t.x[19],y0:t.y[19],depth:30,dx:"key"===e?0:this.sway*("tile"===this.mode?7:10),reach:"key"===e?.17:.3,hold:"key"===e?.06:.1,held:"key"===e})}keyUp(){this.script?.kind==="key"&&(this.script.held=!1)}toggleNow(){let e=!this.light.on;this.light.set(e,!0),this.onToggle?.(e,120,"key")}follow(e,t){this.light.on===e||(!t||this.reduced?this.light.set(e,!0):this.script||this.autoPull("auto"))}clicked(e){let t=!this.light.on;this.light.set(t),this.idle=0,this.onToggle?.(t,e,this.script?this.source:"hand")}runScript(e){let t,a=this.script;if(!a)return;a.t+=e;let i=this.sim,o=(t=a.t/a.reach)<=0?0:t>=1?1:t*t*(3-2*t),l=i.restX()+a.dx,s=i.restY()+a.depth;i.moveHand(a.x0+(l-a.x0)*o,a.y0+(s-a.y0)*o),a.t>=a.reach+a.hold&&!a.held&&(!i.armed||a.t>.8)&&(this.script=null,i.release())}tileLoop(e,t){if(this.reduced||this.script)return;this.idle+=e;let a=this.light.on===t?3.1:2.2;this.idle>a&&(this.idle=0,this.autoPull("auto"))}hurry(){this.script||this.reduced||(this.idle=Math.max(this.idle,this.light.on?2.6:1.8))}step(e){this.runScript(e),this.sim.step(e);let t=this.light.step(e);return this.hover+=(this.hoverTarget-this.hover)*(1-Math.exp(-(14*e))),.002>Math.abs(this.hover-this.hoverTarget)&&(this.hover=this.hoverTarget),t||!this.sim.settled||null!==this.script||this.hover!==this.hoverTarget}render(){this.renderer?.render(this.sim,this.light,this.layout,w,this.hover)}beadPose(e){let t=this.sim,a=t.x[19]-t.x[18],i=t.y[19]-t.y[18],o=Math.hypot(a,i)||1;return a/=o,i/=o,e.x=t.x[19]+12*a,e.y=t.y[19]+12*i,e.angle=Math.atan2(i,a)-Math.PI/2,e}cordBounds(e){let t=this.sim,a=t.ex,i=t.ex,o=t.ey,l=t.ey;for(let e=0;e<20;e++){let s=t.x[e],r=t.y[e];s<a&&(a=s),s>i&&(i=s),r<o&&(o=r),r>l&&(l=r)}let s=this.beadPose(T);return a=Math.min(a,s.x-14),i=Math.max(i,s.x+14),o=Math.min(o,s.y-16),l=Math.max(l,s.y+16),e.minX=a,e.minY=o,e.maxX=i,e.maxY=l,e}}let T={x:0,y:0,angle:0};function B(){return(0,l.audioReady)()?(0,l.getAudio)():null}function L(e,t,a,{type:i,freq:o,q:s,level:r,decay:n}){let h=e.createBufferSource();h.buffer=(0,l.noiseBuffer)(e);let c=e.createBiquadFilter();c.type=i,c.frequency.value=o,c.Q.value=s;let m=e.createGain();m.gain.setValueAtTime(0,a),m.gain.linearRampToValueAtTime(r,a+.0012),m.gain.exponentialRampToValueAtTime(1e-4,a+n),h.connect(c).connect(m).connect(t),h.start(a,.6*Math.random(),n+.03)}function S(e,t,a,{freq:i,to:o,level:l,decay:s,type:r="sine"}){let n=e.createOscillator();n.type=r,n.frequency.setValueAtTime(i,a),o&&n.frequency.exponentialRampToValueAtTime(o,a+s);let h=e.createGain();h.gain.setValueAtTime(0,a),h.gain.linearRampToValueAtTime(l,a+.002),h.gain.exponentialRampToValueAtTime(1e-4,a+s),n.connect(h).connect(t),n.start(a),n.stop(a+s+.02)}class q{gain=null;source=null;level=0;start(){if(this.gain)return;let e=(0,l.getAudio)();if(!e)return;let{ctx:t,output:a}=e,i=t.createBufferSource();i.buffer=(0,l.noiseBuffer)(t,2),i.loop=!0;let o=t.createBiquadFilter();o.type="bandpass",o.frequency.value=2600,o.Q.value=.6;let s=t.createBiquadFilter();s.type="highpass",s.frequency.value=900;let r=t.createGain();r.gain.value=0,i.connect(o).connect(s).connect(r).connect(a),i.start(),this.source=i,this.gain=r}set(e){let t=this.gain;if(!t)return;let a=.06*Math.min(1,Math.max(0,(Math.abs(e)-15)/420));.0015>Math.abs(a-this.level)||(this.level=a,t.gain.setTargetAtTime(a,t.context.currentTime,.02))}stop(){let{gain:e,source:t}=this;if(this.gain=null,this.source=null,this.level=0,!e||!t)return;let a=e.context.currentTime;e.gain.setTargetAtTime(0,a,.02);try{t.stop(a+.12)}catch{}window.setTimeout(()=>{try{t.disconnect(),e.disconnect()}catch{}},200)}}function k(e,t,i,o){let l=(0,a.useRef)(()=>{}),r=(0,s.useLatest)(o),{canvasRef:n,supported:h}=(0,s.useWebGL2)({mode:e.mode,maxDpr:t,attributes:{antialias:!1,alpha:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:t=>{try{e.attach(t)}catch(e){console.error(e),r.current();return}return e.render(),l.current(),()=>e.detach()},onResize:t=>{e.resize(t.width,t.height,i(t.width)),e.render(),l.current()}});return(0,a.useEffect)(()=>{!1===h&&r.current()},[h,r]),{canvasRef:n,wakeRef:l}}function E({active:e,reducedMotion:i,theme:o,onFail:l}){let r="light"===o,[n]=(0,a.useState)(()=>{let e=new R("tile",r);return e.setReduced(i),i||e.sim.nudge(90),e}),h=(0,s.useLatest)(r),{canvasRef:c,wakeRef:m}=k(n,1.5,()=>0,l),u=(0,s.useFrame)(e,e=>{n.tileLoop(e,h.current);let t=n.step(e);return n.render(),t||!i});return m.current=u,(0,a.useEffect)(()=>{n.setReduced(i),n.follow(r,!i),u()},[i,r,n,u]),(0,t.jsx)("div",{"aria-hidden":"true",className:"absolute inset-0",onPointerEnter:e=>{"mouse"===e.pointerType&&(n.hurry(),u())},children:(0,t.jsx)("canvas",{ref:c,className:"absolute inset-0 size-full"})})}let A=e=>e<640?96:108;function P({active:e,reducedMotion:n,theme:h,onFail:c}){let m=(0,a.useRef)(null),u=(0,a.useRef)(null),d=(0,a.useRef)(null),f=(0,s.useFinePointer)(),p=(0,a.useId)(),[v,x]=(0,a.useState)(!0),[y,b]=(0,a.useState)("light"===h),[g,w]=(0,a.useState)(!1),[C,M]=(0,a.useState)(""),[T,E]=(0,a.useState)(2),[D]=(0,a.useState)(()=>{let e=new R("stage","light"===h,800,575);return e.setReduced(n),n||(e.sim.nudge(150),e.sim.push(-.04)),e}),G=(0,s.useLatest)(v),_=(0,s.useLatest)(n),O=(0,a.useRef)(null),Y=(0,a.useRef)({slow:0}),F=(0,a.useRef)({hit:{x:-1,y:-1,w:-1,h:-1},bx:-1,by:-1,angle:99,cursor:""}),N=(0,a.useRef)({minX:0,minY:0,maxX:0,maxY:0}),z=(0,a.useRef)({x:0,y:0,angle:0}),{canvasRef:U,wakeRef:X}=k(D,T,A,c),I=(0,s.useFrame)(e,e=>{let t=D.step(e);D.render(),function(){let e=D.layout.scale,t=F.current,a=u.current;if(a){let i=D.cordBounds(N.current),o=Math.round(i.minX*e-22),l=Math.round(i.minY*e-22),s=Math.round((i.maxX-i.minX)*e+44),r=Math.round((i.maxY-i.minY)*e+44);(o!==t.hit.x||l!==t.hit.y||s!==t.hit.w||r!==t.hit.h)&&(t.hit.x=o,t.hit.y=l,t.hit.w=s,t.hit.h=r,a.style.transform=`translate(${o}px, ${l}px)`,a.style.width=`${s}px`,a.style.height=`${r}px`)}let i=d.current;if(i){let a=D.beadPose(z.current),o=Math.round(a.x*e*2)/2,l=Math.round(a.y*e*2)/2,s=Math.round(200*a.angle)/200;(o!==t.bx||l!==t.by||s!==t.angle)&&(t.bx=o,t.by=l,t.angle=s,i.style.transform=`translate(${o}px, ${l}px) translate(-50%, -50%) rotate(${s}rad)`)}let o=m.current;if(o){let e=D.holding?"grabbing":D.hoverTarget>0?"grab":"";e!==t.cursor&&(t.cursor=e,o.style.cursor=e)}}(),O.current?.set(D.sim.vd);let a=Y.current;return t&&(a.slow=e>1/40?a.slow+e:Math.max(0,a.slow-.5*e),a.slow>1&&T>1.25&&(a.slow=0,E(T>1.5?1.5:1.25))),t});X.current=I,(0,a.useEffect)(()=>(D.onToggle=(e,t)=>{if(b(e),!function(e,t){let a=B();if(!a)return;let{ctx:i,output:o}=a,l=i.currentTime,s=.55+.45*Math.min(1,Math.max(0,t/260)),r=e?1.06:.94;L(i,o,l,{type:"bandpass",freq:3300*r,q:1.1,level:.2*s,decay:.022}),L(i,o,l+.004,{type:"highpass",freq:6500,q:.7,level:.07*s,decay:.012}),S(i,o,l,{freq:1180*r,to:1040*r,level:.06*s,decay:.05,type:"triangle"}),S(i,o,l,{freq:4870*r,level:.012*s,decay:.07}),S(i,o,l,{freq:165*r,to:90,level:.2*s,decay:.07})}(e,t),e&&function(){let e=B();if(!e)return;let{ctx:t,output:a}=e,i=t.currentTime+.012;S(t,a,i,{freq:7400,level:.008,decay:.05}),S(t,a,i,{freq:120,to:100,level:.02,decay:.16})}(),G.current){let t=e?"light":"dark";(0,o.getResolvedTheme)()!==t&&(0,o.setTheme)(t)}M(e?`Light on${G.current?", light theme":""}.`:`Light off${G.current?", dark theme":""}.`)},D.onRearm=e=>(function(e){let t=B();if(!t)return;let a=Math.min(1,Math.max(0,(e-20)/300));if(a<.05)return;let{ctx:i,output:o}=t,l=i.currentTime;L(i,o,l,{type:"bandpass",freq:1900,q:1.4,level:.08*a,decay:.018}),S(i,o,l,{freq:620,to:480,level:.04*a,decay:.04,type:"triangle"})})(e),D.onClink=(e,t)=>(function(e,t){let a=B();if(!a)return;let i=Math.min(1,Math.max(0,(e-80)/700));if(i<.03)return;let{ctx:o,output:l}=a,s=o.currentTime,r=1+(Math.random()-.5)*.06;"bulb"===t?(S(o,l,s,{freq:3950*r,level:.05*i,decay:.12}),S(o,l,s,{freq:6100*r,level:.025*i,decay:.07})):(S(o,l,s,{freq:2350*r,level:.06*i,decay:.18}),S(o,l,s,{freq:3720*r,level:.03*i,decay:.1})),L(o,l,s,{type:"bandpass",freq:4200,q:2,level:.05*i,decay:.01})})(e,t),()=>{D.onToggle=null,D.onRearm=null,D.onClink=null}),[D,G]),(0,a.useEffect)(()=>{v&&(D.follow("light"===h,!n),n&&b("light"===h),I())},[h,v,D,n,I]),(0,a.useEffect)(()=>{D.setReduced(n),I()},[n,D,I]),(0,a.useEffect)(()=>{e||O.current?.set(0)},[e]),(0,a.useEffect)(()=>()=>{O.current?.stop(),O.current=null},[]),(0,a.useEffect)(()=>{let e=m.current;if(!e)return;let t=null,a=t=>{let a=e.getBoundingClientRect(),i=D.layout.scale;return{x:(t.clientX-a.left)/i,y:(t.clientY-a.top)/i}},i=e=>("mouse"===e.pointerType?9:22)/D.layout.scale,o=o=>{if(!o.isPrimary||o.button>0||o.target?.closest?.("[data-lab-controls]"))return;(0,l.ensureAudio)()&&!O.current&&(O.current=new q,O.current.start());let s=a(o),r=D.sim.nearest(s.x,s.y);if(r.distance<i(o)){o.preventDefault(),D.grab(r.index,s.x,s.y),t=o.pointerId;try{e.setPointerCapture(o.pointerId)}catch{}w(!0),I();return}let n=D.lampSide(s.x,s.y);0===n||_.current||(D.knock(n),function(){let e=B();if(!e)return;let{ctx:t,output:a}=e,i=t.currentTime,o=.8;S(t,a,i,{freq:410,to:360,level:.096,decay:.32}),S(t,a,i,{freq:1130,level:.035*o,decay:.2}),S(t,a,i,{freq:2210,level:.015*o,decay:.12}),L(t,a,i,{type:"lowpass",freq:1800,q:.7,level:.08*o,decay:.03})}(),w(!0),I())},s=e=>{if(!e.isPrimary)return;let o=a(e);if(e.pointerId===t){D.drag(o.x,o.y),I();return}if("mouse"!==e.pointerType)return;let l=+(D.sim.nearest(o.x,o.y).distance<i(e));l!==D.hoverTarget&&(D.hoverTarget=l,I())},r=e=>{e.pointerId===t&&(t=null,D.letGo(),"mouse"!==e.pointerType&&(D.hoverTarget=0),I())},n=e=>{"mouse"===e.pointerType&&null===t&&(D.hoverTarget=0,I())};return e.addEventListener("pointerdown",o),e.addEventListener("pointermove",s),e.addEventListener("pointerup",r),e.addEventListener("pointercancel",r),e.addEventListener("pointerleave",n),()=>{e.removeEventListener("pointerdown",o),e.removeEventListener("pointermove",s),e.removeEventListener("pointerup",r),e.removeEventListener("pointercancel",r),e.removeEventListener("pointerleave",n)}},[D,I,_]);let j=(0,a.useRef)(-1/0),H=D.layout.scale,W=Math.max(32,26.8*H),K=Math.max(44,39.8*H),V=!y;return(0,t.jsxs)("div",{ref:m,className:"absolute inset-0 touch-pan-y select-none [-webkit-tap-highlight-color:transparent]",children:[(0,t.jsx)("canvas",{ref:U,"aria-hidden":"true",className:"absolute inset-0 size-full"}),(0,t.jsx)("div",{ref:u,"aria-hidden":"true",className:"absolute start-0 top-0 touch-none",style:{width:0,height:0}}),(0,t.jsx)("div",{ref:d,role:"switch",tabIndex:0,"aria-checked":y,"aria-label":v?"Pull cord: light (sets the site theme)":"Pull cord: light","aria-describedby":p,onKeyDown:e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;let t=e.key;if(" "===t||"Enter"===t||"ArrowDown"===t){if(e.preventDefault(),j.current=performance.now(),e.repeat)return;(0,l.ensureAudio)(),w(!0),n?D.toggleNow():D.autoPull("key"),I()}else("ArrowLeft"===t||"ArrowRight"===t)&&(e.preventDefault(),(0,l.ensureAudio)(),n||D.nudge("ArrowRight"===t?1:-1),I())},onKeyUp:e=>{let t=e.key;(" "===t||"Enter"===t||"ArrowDown"===t)&&(j.current=performance.now(),D.keyUp(),I())},onBlur:()=>D.keyUp(),onClick:e=>{0!==e.detail||performance.now()-j.current<600||(n?D.toggleNow():(D.autoPull("key"),D.keyUp()),I())},className:"absolute start-0 top-0 touch-none rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",style:{width:W,height:K}}),(0,t.jsxs)("p",{id:p,className:"sr-only",children:["A pendant lamp with a pull cord. Press Space or Enter to pull the cord and switch the light; hold to keep it drawn. The left and right arrows set the pull swinging.",v?" Switching the light also sets this site's light or dark theme.":""]}),(0,t.jsx)("p",{"aria-live":"polite",className:"sr-only",children:C}),(0,t.jsxs)(r.StageControls,{placement:"bottom",children:[(0,t.jsxs)(r.Tray,{label:"Lamp settings",children:[(0,t.jsx)(r.Toggle,{label:"Site theme",checked:v,onChange:x}),(0,t.jsx)(r.TrayDivider,{}),(0,t.jsx)(r.MuteButton,{})]}),(0,t.jsx)(r.StageHint,{className:(0,i.cn)("transition-[opacity,color] duration-700",g&&"opacity-0",V?"text-[#9a9a9a]":"text-[#6b6b6b]"),children:f?"Grab the pull and draw it down until it clicks · flick it to set it swinging":"Pull the cord down until it clicks"})]})]})}function D({mode:e,theme:i}){let o=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=o.current;if(!t)return;let a=()=>{let a=t.getBoundingClientRect();if(!a.width||!a.height)return;let o=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);t.width=Math.round(a.width*o),t.height=Math.round(a.height*o);let l=t.getContext("2d");if(!l)return;let s="light"===i,r=new R(e,s,a.width,a.height);r.resize(a.width,a.height,"stage"===e?A(a.width):0);let n=r.layout,h=r.sim;if(l.setTransform(o*n.scale,0,0,o*n.scale,0,0),l.fillStyle=s?"#efefef":"#232323",l.fillRect(0,0,n.width,n.height),s){let e=l.createRadialGradient(h.ox,h.oy+10,10,h.ox,h.oy+10,320);e.addColorStop(0,"rgb(255 236 210 / 0.9)"),e.addColorStop(1,"rgb(255 236 210 / 0)"),l.fillStyle=e,l.fillRect(0,h.oy,n.width,n.height)}l.strokeStyle="#2a2a2a",l.lineWidth=3.4,l.beginPath(),l.moveTo(h.ax,0),l.lineTo(h.ox,h.oy-60),l.stroke(),l.fillStyle="#262626",l.fillRect(h.ax-24,0,48,h.ay),l.beginPath(),l.ellipse(h.ox,h.oy,84,57,0,Math.PI,2*Math.PI),l.fill(),l.fillStyle=s?"#fff4e4":"#3a3a3a",l.beginPath(),l.ellipse(h.ox,h.oy,84,18,0,0,2*Math.PI),l.fill(),l.fillStyle=s?"#fffaf0":"#4a4a4a",l.beginPath(),l.arc(h.ox,h.oy+5,18,0,2*Math.PI),l.fill(),l.strokeStyle="#333",l.lineWidth=4.2,l.beginPath(),l.moveTo(h.ex,h.ey);for(let e=0;e<h.x.length;e++)l.lineTo(h.x[e],h.y[e]);l.stroke();let c=h.x.length-1;l.fillStyle=s?"#e9e7e2":"#cfe6db",l.beginPath(),l.ellipse(h.x[c],h.y[c]+14,8.4,14,0,0,2*Math.PI),l.fill()};a();let l=new ResizeObserver(a);return l.observe(t),()=>l.disconnect()},[e,i]),(0,t.jsxs)("div",{"aria-hidden":"tile"===e?"true":void 0,className:"absolute inset-0",children:[(0,t.jsx)("canvas",{ref:o,className:"absolute inset-0 size-full"}),"stage"===e?(0,t.jsx)(r.StageHint,{placement:"bottom",children:"The lamp needs WebGL 2, which this browser doesn’t offer."}):null]})}e.s(["default",0,function(e){let[i,o]=(0,a.useState)(!1);return i?(0,t.jsx)(D,{...e}):"stage"===e.mode?(0,t.jsx)(P,{...e,onFail:()=>o(!0)}):(0,t.jsx)(E,{...e,onFail:()=>o(!0)})}],49795)},9334,function(e){e.n(e.i(49795))}]);