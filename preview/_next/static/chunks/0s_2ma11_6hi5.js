(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,15472,t=>{"use strict";let e,a,o,r;var i=t.i(43476),n=t.i(71645),s=t.i(16442),l=t.i(37047),u=t.i(45219);function h({size:t=16,className:e,children:a}){return(0,i.jsx)("svg",{width:t,height:t,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:e?`shrink-0 ${e}`:"shrink-0",children:(0,i.jsx)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:a})})}function c(t){return(0,i.jsxs)(h,{...t,children:[(0,i.jsx)("circle",{cx:"8",cy:"8",r:"3.25"}),(0,i.jsx)("path",{d:"M2.4 10.6c.9 1.5 4.3 1.3 7.4-.3 2.6-1.4 4.2-3.3 3.8-4.6"}),(0,i.jsx)("path",{d:"M11.9 5.1l1.75.55.45-1.8"})]})}let f=(t=0,e=0,a=0)=>new Float64Array([t,e,a]),d=()=>new Float64Array([0,0,0,1]),m=(t,e)=>t[0]*e[0]+t[1]*e[1]+t[2]*e[2],v=t=>Math.hypot(t[0],t[1],t[2]);function p(t,e,a){let o=e[1]*a[2]-e[2]*a[1],r=e[2]*a[0]-e[0]*a[2],i=e[0]*a[1]-e[1]*a[0];return t[0]=o,t[1]=r,t[2]=i,t}function g(t,e){return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t}function b(t,e,a){let o=e[0],r=e[1],i=e[2],n=e[3],s=a[0],l=a[1],u=a[2],h=a[3];return t[0]=n*s+o*h+r*u-i*l,t[1]=n*l-o*u+r*h+i*s,t[2]=n*u+o*l-r*s+i*h,t[3]=n*h-o*s-r*l-i*u,t}function y(t){let e=Math.hypot(t[0],t[1],t[2],t[3])||1;return t[0]/=e,t[1]/=e,t[2]/=e,t[3]/=e,t}function w(t,e,a,o,r){let i=Math.sin(r/2)/(Math.hypot(e,a,o)||1);return t[0]=e*i,t[1]=a*i,t[2]=o*i,t[3]=Math.cos(r/2),t}function M(t,e,a,o){let r=Math.hypot(e,a,o);if(r<1e-9)return t[0]=e/2,t[1]=a/2,t[2]=o/2,t[3]=1,y(t);let i=Math.sin(r/2)/r;return t[0]=e*i,t[1]=a*i,t[2]=o*i,t[3]=Math.cos(r/2),t}function x(t,e){let a=e[0],o=e[1],r=e[2],i=e[3];i<0&&(a=-a,o=-o,r=-r,i=-i);let n=Math.hypot(a,o,r);if(n<1e-9)return t[0]=2*a,t[1]=2*o,t[2]=2*r,t;let s=2*Math.atan2(n,i);return t[0]=a/n*s,t[1]=o/n*s,t[2]=r/n*s,t}function A(t,e,a){let o=e[0],r=e[1],i=e[2],n=e[3],s=a[0],l=a[1],u=a[2],h=2*(r*u-i*l),c=2*(i*s-o*u),f=2*(o*l-r*s);return t[0]=s+n*h+(r*f-i*c),t[1]=l+n*c+(i*h-o*f),t[2]=u+n*f+(o*c-r*h),t}function P(t,e,a=1){let o=e[0],r=e[1],i=e[2],n=e[3],s=o+o,l=r+r,u=i+i,h=o*s,c=o*l,f=o*u,d=r*l,m=r*u,v=i*u,p=n*s,g=n*l,b=n*u;return t[0]=(1-(d+v))*a,t[1]=(c+b)*a,t[2]=(f-g)*a,t[3]=(c-b)*a,t[4]=(1-(h+v))*a,t[5]=(m+p)*a,t[6]=(f+g)*a,t[7]=(m-p)*a,t[8]=(1-(h+d))*a,t}let k=1/240,R=(e=d(),a=d(),w(e,0,0,1,-22*Math.PI/180),w(a,1,0,0,14*Math.PI/180),b(d(),e,a)),S=f(Math.cos(o=-9*Math.PI/180),Math.sin(o),0),T=f(0,-Math.sin(r=17*Math.PI/180),Math.cos(r)),C=p(f(),S,T),V={k:720,c:2*Math.sqrt(720)},F={k:70,c:2*Math.sqrt(70)*.92},I={k:300,c:2*Math.sqrt(300)};class N{o=d();w=f();target=d();mode="free";idle=.16;spin=0;rest=f();air=f();airW=f();moon=2.2;moonW=.24;moonPace=.24;moonHeld=!1;moonGoal=0;orbit=1.78;p=f();e=f();t3=f();dq=d();cq=d();y=f(0,1,0);constructor(t){w(this.dq,0,1,0,t),b(this.o,R,this.dq),g(this.target,this.o),A(this.rest,R,this.y),this.w[0]=0,this.w[1]=0,this.w[2]=0}pole(t){return A(t,this.o,this.y)}get spinRate(){return A(this.p,this.o,this.y),m(this.w,this.p)}hold(){this.mode="hold",g(this.target,this.o)}turnTarget(t){b(this.cq,t,this.target),g(this.target,y(this.cq))}release(t,e,a){this.mode="free";let o=Math.hypot(t,e,a),r=o>22?22/o:1;this.w[0]=t*r,this.w[1]=e*r,this.w[2]=a*r}keyTurn(t){let e="key"===this.mode?this.target:this.o;A(this.p,e,this.y),w(this.dq,this.p[0],this.p[1],this.p[2],t),b(this.cq,this.dq,e),g(this.target,y(this.cq)),this.mode="key"}keyTip(t){let e="key"===this.mode?this.target:this.o;w(this.dq,1,0,0,t),b(this.cq,this.dq,e),g(this.target,y(this.cq)),this.mode="key"}kick(t){"free"!==this.mode&&(this.mode="free"),A(this.p,this.o,this.y),this.w[0]+=this.p[0]*t,this.w[1]+=this.p[1]*t,this.w[2]+=this.p[2]*t}snapToTarget(){g(this.o,this.target),this.w[0]=this.w[1]=this.w[2]=0}step(t){let e=Math.min(t,.1);for(;e>1e-6;){let t=Math.min(k,e);this.substep(t),e-=t}}substep(t){let{o:e,w:a,p:o,e:r}=this;if(A(o,e,this.y),"free"===this.mode){let e=m(a,o),i=a[0]-o[0]*e,n=a[1]-o[1]*e,s=a[2]-o[2]*e,l=e-this.idle,u=.32+.055*Math.abs(l);e=this.idle+l*Math.exp(-u*t),p(r,o,this.rest),-.95>m(o,this.rest)&&(r[0]+=.3);let h=i+(7.5*r[0]-3.4*i)*t,c=n+(7.5*r[1]-3.4*n)*t,f=s+(7.5*r[2]-3.4*s)*t,d=h*o[0]+c*o[1]+f*o[2];h-=o[0]*d,c-=o[1]*d,f-=o[2]*d,a[0]=o[0]*e+h,a[1]=o[1]*e+c,a[2]=o[2]*e+f}else{var i;let o="hold"===this.mode?V:F;i=this.cq,i[0]=-e[0],i[1]=-e[1],i[2]=-e[2],i[3]=e[3],b(this.dq,this.target,this.cq),x(r,this.dq),a[0]+=(o.k*r[0]-o.c*a[0])*t,a[1]+=(o.k*r[1]-o.c*a[1])*t,a[2]+=(o.k*r[2]-o.c*a[2])*t,"key"===this.mode&&.0015>v(r)&&.02>v(a)&&(this.mode="free")}this.spin+=m(a,o)*t,M(this.dq,a[0]*t,a[1]*t,a[2]*t),b(this.cq,this.dq,e),g(e,y(this.cq));let n=this.air,s=this.airW;for(let e=0;e<3;e++){let o=s[e]-a[e];s[e]+=(-55*n[e]-6.2*o)*t,n[e]+=(s[e]-a[e])*t}if(this.moonHeld){let e=this.moonGoal-this.moon;e-=Math.round(e/(2*Math.PI))*Math.PI*2,this.moonW+=(I.k*e-I.c*this.moonW)*t}else this.moonW=this.moonPace+(this.moonW-this.moonPace)*Math.exp(-.75*t);this.moon+=this.moonW*t}moonPosition(t){let e=Math.cos(this.moon)*this.orbit,a=Math.sin(this.moon)*this.orbit;return t[0]=S[0]*e+T[0]*a,t[1]=S[1]*e+T[1]*a,t[2]=S[2]*e+T[2]*a,t}airShown(t,e=.32){let a=v(this.air),o=a>1e-9?e/(e+a):1;return t[0]=this.air[0]*o,t[1]=this.air[1]*o,t[2]=this.air[2]*o,t}get still(){return"free"===this.mode&&1e-4>v(this.w)&&1e-4>v(this.air)&&1e-4>v(this.airW)}}var E=t.i(55171);let W=`#version 300 es
precision highp float;
precision highp int;
`,D=`
uniform mat4 uViewProj;
uniform mat3 uRot;      // planet: model → world (rotation \xd7 radius)
uniform vec3 uBulge;    // model-space stretch from spinning (equator out, poles in)
uniform vec3 uSun;      // toward the sun (unit, world)
uniform vec3 uCam;      // camera position (world)
uniform float uTime;
uniform float uDark;    // 0 light theme … 1 dark theme
uniform vec4 uMoon;     // moon centre (world) and radius
uniform vec4 uBanks[16];
uniform int uBankCount;
`,B=`
vec3 toLinear(vec3 c) { return pow(max(c, 0.0), vec3(2.2)); }

/** A soft exposure curve, then back to sRGB. */
vec3 finish(vec3 c) {
  c = 1.0 - exp(-c * 1.6);
  return pow(c, vec3(1.0 / 2.2));
}

/** The sun's colour on the ground: white by day, amber and rose along the terminator. */
vec3 sunColour(float h) {
  vec3 low = vec3(1.0, 0.46, 0.26);
  vec3 mid = vec3(1.0, 0.78, 0.56);
  vec3 high = vec3(1.0, 0.97, 0.92);
  return mix(mix(low, mid, smoothstep(-0.06, 0.12, h)), high, smoothstep(0.1, 0.42, h));
}

float bankShadow(vec3 p) {
  float s = 1.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uBankCount) break;
    vec4 b = uBanks[i];
    vec3 d = b.xyz - p;
    float t = dot(d, uSun);
    if (t <= 0.0) continue;
    float dist = length(d - uSun * t);
    s *= 1.0 - 0.42 * smoothstep(b.w, b.w * 0.32, dist);
  }
  return s;
}

float moonShadow(vec3 p) {
  vec3 d = uMoon.xyz - p;
  float t = dot(d, uSun);
  if (t <= 0.0) return 1.0;
  float dist = length(d - uSun * t);
  return mix(0.18, 1.0, smoothstep(uMoon.w * 0.6, uMoon.w * 1.5, dist));
}

/** Daylight 0..1, measured on the sphere so the terminator stays smooth across facets. */
float dayAt(vec3 sn) { return smoothstep(-0.1, 0.12, dot(sn, uSun)); }

vec3 ambientAt(vec3 sn, vec3 n) {
  float h = dot(sn, uSun);
  vec3 nightLight = mix(vec3(0.03, 0.04, 0.075), vec3(0.011, 0.014, 0.03), uDark);
  vec3 dayLight = vec3(0.17, 0.2, 0.25);
  vec3 a = mix(nightLight, dayLight, smoothstep(-0.2, 0.32, h));
  // facets turned up toward open sky get a little more fill
  return a * (0.72 + 0.28 * max(dot(n, sn), 0.0));
}

vec3 lightAt(vec3 n, vec3 sn, float shade) {
  float h = dot(sn, uSun);
  float day = dayAt(sn);
  float diff = clamp(dot(n, uSun) * 0.82 + 0.18, 0.0, 1.0) * day * shade;
  return sunColour(h) * diff * 1.18 + ambientAt(sn, n);
}
`,z=`${W}
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 1.0, 1.0);
}
`,q=`${W}
in vec2 vUv;
uniform vec3 uBg;
uniform vec2 uRes;      // CSS px
uniform vec2 uCenter;   // planet centre, CSS px from the top left
uniform float uRadius;  // planet radius, CSS px
uniform float uDark;
uniform float uTime;
uniform float uStars;
out vec4 o;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 bg = uBg;
  float d = length(px - uCenter) / uRadius;
  // by day: a faint pool of light behind the planet, like a studio sweep
  bg = mix(bg, min(bg * 1.035 + 0.01, vec3(1.0)), (1.0 - uDark) * exp(-d * d * 0.16) * 0.9);
  // after dark: a slow dust of stars, thinning toward the planet
  if (uStars > 0.001) {
    float cell = 30.0;
    vec2 g = floor(px / cell);
    float s = 0.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = g + vec2(float(i), float(j));
        float h = hash(c);
        if (h < 0.6) continue;
        vec2 at = (c + vec2(hash(c + 7.1), hash(c + 3.7))) * cell;
        float size = mix(0.5, 1.25, hash(c + 1.3));
        float r = length(px - at);
        float tw = 0.65 + 0.35 * sin(uTime * (0.6 + hash(c + 9.2) * 1.6) + h * 30.0);
        s += smoothstep(size + 0.6, size - 0.4, r) * (h - 0.6) * 2.5 * tw;
      }
    }
    s *= smoothstep(1.05, 1.6, d);
    bg += vec3(1.0, 0.94, 0.86) * s * 0.75 * uStars;
  }
  o = vec4(bg, 1.0);
}
`,j=`${W}${D}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColour;
out vec3 vW;
out vec3 vN;
out vec3 vS;
out vec3 vC;
void main() {
  vec3 m = aPos * uBulge;
  vW = uRot * m;
  vN = uRot * aNormal;
  vS = uRot * aPos;
  vC = aColour;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`,_=`${W}${D}${B}
in vec3 vW;
in vec3 vN;
in vec3 vS;
in vec3 vC;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  vec3 sn = normalize(vS);
  float shade = bankShadow(vW) * moonShadow(vW);
  vec3 c = toLinear(vC) * lightAt(n, sn, shade);
  o = vec4(finish(c), 1.0);
}
`,L=`${W}${D}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aPart;
layout(location = 3) in vec4 aBase;   // base (model), height
layout(location = 4) in vec4 aTint;   // colour, seed
uniform vec3 uAir;                    // the air's lag (world rotation vector)
uniform float uSway;
out vec3 vW;
out vec3 vN;
out vec3 vS;
out vec3 vC;
void main() {
  vec3 up = normalize(aBase.xyz);
  vec3 ref = abs(up.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(ref, up));
  vec3 b = cross(up, t);
  float a = aTint.w * 6.2832;
  float ca = cos(a), sa = sin(a);
  vec2 xz = vec2(ca * aPos.x - sa * aPos.z, sa * aPos.x + ca * aPos.z);
  vec2 nxz = vec2(ca * aNormal.x - sa * aNormal.z, sa * aNormal.x + ca * aNormal.z);
  float hgt = aBase.w;
  vec3 m = aBase.xyz * uBulge + (t * xz.x + up * aPos.y + b * xz.y) * hgt;
  vec3 w = uRot * m;
  // lean with the air sliding over the ground, plus a breath of sway
  vec3 baseW = uRot * aBase.xyz;
  vec3 upW = normalize(baseW);
  vec3 wind = cross(uAir, baseW);
  wind -= upW * dot(wind, upW);
  float bend = max(aPos.y, 0.0);
  bend *= bend;
  float sway = sin(uTime * 1.9 + aTint.w * 37.0) * uSway;
  vec3 side = uRot * t;
  w += (wind * 2.3 + normalize(side) * sway * length(uRot[0])) * bend * hgt;
  vW = w;
  vN = uRot * (t * nxz.x + up * aNormal.y + b * nxz.y);
  vS = baseW;
  vC = mix(aTint.rgb, vec3(0.42, 0.31, 0.22), aPart);
  gl_Position = uViewProj * vec4(w, 1.0);
}
`,U=`${W}${D}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aPuff;   // centre (model), radius
layout(location = 3) in vec4 aMore;   // flatness, drift (rad/s), shade, seed
uniform mat3 uCloudRot;               // the cloud layer: lag \xd7 planet \xd7 radius
out vec3 vW;
out vec3 vN;
out vec3 vS;
out float vShade;
void main() {
  float a = aMore.y * uTime;
  float c = cos(a), s = sin(a);
  vec3 ctr = vec3(c * aPuff.x + s * aPuff.z, aPuff.y, -s * aPuff.x + c * aPuff.z);
  vec3 up = normalize(ctr);
  vec3 ref = abs(up.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(ref, up));
  vec3 b = cross(up, t);
  vec3 local = aPos * aPuff.w;
  // a puff breathes very slightly
  float breathe = 1.0 + 0.04 * sin(uTime * 0.5 + aMore.w * 20.0);
  vec3 m = ctr * uBulge + (t * local.x + up * (local.y * aMore.x) + b * local.z) * breathe;
  vW = uCloudRot * m;
  vN = uCloudRot * (t * aNormal.x + up * (aNormal.y / aMore.x) + b * aNormal.z);
  vS = uCloudRot * ctr;
  vShade = aMore.z;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`,$=`${W}${D}${B}
in vec3 vW;
in vec3 vN;
in vec3 vS;
in float vShade;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  vec3 sn = normalize(vS);
  float h = dot(sn, uSun);
  float day = smoothstep(-0.2, 0.16, h);
  float diff = clamp(dot(n, uSun) * 0.6 + 0.4, 0.0, 1.0) * day * moonShadow(vW);
  vec3 nightLight = mix(vec3(0.045, 0.052, 0.085), vec3(0.014, 0.016, 0.028), uDark);
  vec3 amb = mix(nightLight, vec3(0.3, 0.33, 0.39), smoothstep(-0.22, 0.3, h)) * (0.75 + 0.25 * max(dot(n, sn), 0.0));
  vec3 c = vec3(0.92) * vShade * (sunColour(h) * diff * 1.45 + amb * 1.25);
  o = vec4(finish(c), 1.0);
}
`,H=`${W}${D}
layout(location = 0) in vec3 aPos;
layout(location = 1) in float aDepth;
uniform float uWave;
out vec3 vW;
out vec3 vS;
out float vD;
void main() {
  vec3 p = aPos;
  float w = sin(dot(p, vec3(13.1, 7.3, -9.7)) * 1.6 + uTime * 1.25)
          + sin(dot(p, vec3(-8.4, 12.7, 6.1)) * 1.9 - uTime * 1.05)
          + 0.6 * sin(dot(p, vec3(5.2, -9.9, 14.3)) * 2.6 + uTime * 1.7);
  vec3 m = p * (1.0 + w * uWave) * uBulge;
  vW = uRot * m;
  vS = uRot * p;
  vD = aDepth;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`,G=`${W}${D}${B}
in vec3 vW;
in vec3 vS;
in float vD;
out vec4 o;
void main() {
  vec3 sn = normalize(vS);
  vec3 fn = normalize(cross(dFdx(vW), dFdy(vW)));
  if (dot(fn, sn) < 0.0) fn = -fn;
  vec3 n = normalize(mix(sn, fn, 0.75));
  vec3 v = normalize(uCam - vW);
  float deep = smoothstep(0.0, 0.05, vD);
  vec3 water = mix(vec3(0.14, 0.56, 0.6), vec3(0.028, 0.15, 0.3), deep);
  float alpha = mix(0.34, 0.93, smoothstep(0.0, 0.028, vD));
  float shade = bankShadow(vW) * moonShadow(vW);
  float h = dot(sn, uSun);
  float day = dayAt(sn);
  vec3 c = water * lightAt(n, sn, shade);
  // the sky in the water at grazing angles
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 sky = mix(vec3(0.02, 0.03, 0.06), vec3(0.45, 0.62, 0.85), smoothstep(-0.2, 0.3, h));
  c = mix(c, sky, fres * 0.55);
  // the sun's glint, broken up by the facets
  vec3 hv = normalize(uSun + v);
  float spec = pow(max(dot(n, hv), 0.0), 320.0) * day * shade;
  float sheen = pow(max(dot(sn, hv), 0.0), 90.0) * day * shade;
  c += sunColour(h) * (spec * 1.5 + sheen * 0.06);
  alpha = clamp(max(alpha, spec * 1.5 + fres * 0.4), 0.0, 1.0);
  o = vec4(finish(c) * alpha, alpha);
}
`,O=`${W}${D}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec3 aColour;
uniform mat3 uMoonRot;  // spin \xd7 radius
out vec3 vW;
out vec3 vN;
out vec3 vC;
void main() {
  vW = uMoon.xyz + uMoonRot * aPos;
  vN = uMoonRot * aNormal;
  vC = aColour;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`,Y=`${W}${D}${B}
in vec3 vW;
in vec3 vN;
in vec3 vC;
uniform float uPlanetR;
out vec4 o;
void main() {
  vec3 n = normalize(vN);
  // the planet's shadow (an eclipse when the moon passes behind it)
  float shade = 1.0;
  float t = dot(-vW, uSun);
  if (t > 0.0) {
    float dist = length(-vW - uSun * t);
    shade = smoothstep(uPlanetR * 0.9, uPlanetR * 1.12, dist);
  }
  float diff = clamp(dot(n, uSun) * 0.9 + 0.1, 0.0, 1.0) * shade;
  vec3 amb = mix(vec3(0.07, 0.075, 0.1), vec3(0.03, 0.032, 0.045), uDark);
  vec3 c = toLinear(vC) * (vec3(1.0, 0.97, 0.93) * diff * 1.25 + amb);
  o = vec4(finish(c), 1.0);
}
`,K=`${W}${D}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aInfo;   // comes on at (sun height), seed, size
uniform float uPx;                    // point size for size 1 (device px)
uniform float uLights;                // 0..1 overall
out float vI;
void main() {
  vec3 w = uRot * (aPos * uBulge);
  vec3 sn = normalize(uRot * aPos);
  float h = dot(sn, uSun);
  float on = smoothstep(aInfo.x + 0.03, aInfo.x - 0.015, h);
  vec3 v = normalize(uCam - w);
  float facing = dot(sn, v);
  float tw = 0.8 + 0.2 * sin(uTime * (0.8 + aInfo.y * 2.4) + aInfo.y * 61.0);
  vI = on * smoothstep(0.03, 0.32, facing) * tw * uLights;
  gl_PointSize = vI < 0.004 ? 0.0 : uPx * aInfo.z * (0.6 + 0.4 * on);
  gl_Position = uViewProj * vec4(w + v * 0.022 * length(uRot[0]), 1.0);
}
`,Q=`${W}
in float vI;
out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 16.0);
  float halo = exp(-r2 * 3.6) * (1.0 - r2);
  vec3 col = vec3(1.0, 0.86, 0.56) * core * 1.25 + vec3(1.0, 0.6, 0.26) * halo * 0.38;
  o = vec4(col * vI, 0.0);
}
`,X=`${W}
layout(location = 0) in float aAngle;
uniform mat4 uViewProj;
uniform vec3 uU;        // orbit axes \xd7 radius
uniform vec3 uV;
uniform vec4 uMoon;
uniform float uDot;     // device px
out float vA;
void main() {
  vec3 w = uU * cos(aAngle) + uV * sin(aAngle);
  float gap = distance(w, uMoon.xyz);
  // the dots step aside around the moon, and thin out toward the back
  vA = smoothstep(uMoon.w * 1.5, uMoon.w * 2.9, gap) * mix(0.55, 1.0, smoothstep(-1.0, 0.6, w.z / length(uV)));
  gl_PointSize = uDot;
  gl_Position = uViewProj * vec4(w, 1.0);
}
`,J=`${W}
in float vA;
uniform vec4 uColour;   // sRGB, alpha
out vec4 o;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float a = smoothstep(1.0, 0.45, dot(c, c)) * uColour.a * vA;
  o = vec4(uColour.rgb * a, a);
}
`,Z=`${W}
layout(location = 0) in vec3 aPos;
uniform mat4 uViewProj;
uniform float uShell;   // shell radius (world)
out vec3 vW;
void main() {
  vW = aPos * uShell;
  gl_Position = uViewProj * vec4(vW, 1.0);
}
`,tt=`${W}
in vec3 vW;
uniform vec3 uSun;
uniform vec3 uCam;
uniform float uPlanetR;
uniform float uDark;
uniform float uGlow;
out vec4 o;
void main() {
  vec3 rd = normalize(vW - uCam);
  float tca = -dot(uCam, rd);
  vec3 cp = uCam + rd * tca;
  float b = length(cp) / uPlanetR;
  const float H = 0.06;
  float depth;
  vec3 n;
  if (b < 1.0) {
    float thc = sqrt(1.0 - b * b) * uPlanetR;
    vec3 hit = uCam + rd * (tca - thc);
    n = normalize(hit);
    float mu = max(dot(n, -rd), 0.0);
    // looking down through the air onto the ground: only a thin veil, thickening toward the rim
    depth = H / max(mu, 0.1) * mix(0.35, 1.0, smoothstep(0.55, 0.98, b));
  } else {
    n = normalize(cp);
    depth = exp(-(b - 1.0) / H) * sqrt(6.2832 * b * H);
  }
  float h = dot(n, uSun);
  float lit = smoothstep(-0.32, 0.2, h);
  vec3 blue = mix(vec3(0.5, 0.72, 1.0), vec3(0.42, 0.62, 1.0), uDark);
  vec3 dusk = vec3(1.0, 0.52, 0.3);
  vec3 col = mix(dusk, blue, smoothstep(-0.1, 0.3, h));
  // light coming through the air from behind the planet
  float forward = pow(max(dot(rd, uSun), 0.0), 5.0) * smoothstep(-0.4, 0.05, h);
  float a = (1.0 - exp(-depth * mix(2.0, 2.6, uDark))) * (lit + forward * 1.4) * uGlow;
  a = clamp(a, 0.0, 1.0);
  // lighter, airier on the light studio; a glow on the dark
  vec3 c = mix(col * 0.98 + 0.04, col, uDark);
  o = vec4(c * a * mix(0.85, 1.0, uDark), a * mix(0.72, 0.55, uDark));
}
`;class te{gl;backdrop;land;pine;cloud;sea;moon;lights;dots;air;vaos=[];buffers=[];emptyVao;landVao;pineVao;cloudVao;seaVao;moonVao;lightsVao;dotsVao;airVao;world;seaCount;airCount;constructor(t,e){this.gl=t,this.world=e;const a=(e,a)=>{let o=(0,E.createProgram)(t,e,a);return{program:o,u:(0,E.uniformLocations)(t,o)}};this.backdrop=a(z,q),this.land=a(j,_),this.pine=a(L,_),this.cloud=a(U,$),this.sea=a(H,G),this.moon=a(O,Y),this.lights=a(K,Q),this.dots=a(X,J),this.air=a(Z,tt),this.emptyVao=this.vao(),this.landVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.terrain),this.attrib(0,3,36,0),this.attrib(1,3,36,12),this.attrib(2,3,36,24),this.pineVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.treeMesh),this.attrib(0,3,28,0),this.attrib(1,3,28,12),this.attrib(2,1,28,24),this.buffer(t.ARRAY_BUFFER,e.trees),this.attrib(3,4,32,0,1),this.attrib(4,4,32,16,1),this.cloudVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.puffMesh),this.attrib(0,3,24,0),this.attrib(1,3,24,12),this.buffer(t.ARRAY_BUFFER,e.puffs),this.attrib(2,4,32,0,1),this.attrib(3,4,32,16,1),this.seaVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.ocean),this.attrib(0,3,16,0),this.attrib(1,1,16,12),this.buffer(t.ELEMENT_ARRAY_BUFFER,e.oceanIndices),this.seaCount=e.oceanIndices.length,this.moonVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.moon),this.attrib(0,3,36,0),this.attrib(1,3,36,12),this.attrib(2,3,36,24),this.lightsVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.lights),this.attrib(0,3,24,0),this.attrib(1,3,24,12),this.dotsVao=this.vao();const o=new Float32Array(150);for(let t=0;t<150;t++)o[t]=t/150*Math.PI*2;this.buffer(t.ARRAY_BUFFER,o),this.attrib(0,1,4,0),this.airVao=this.vao(),this.buffer(t.ARRAY_BUFFER,e.shell),this.attrib(0,3,12,0),this.buffer(t.ELEMENT_ARRAY_BUFFER,e.shellIndices),this.airCount=e.shellIndices.length,t.bindVertexArray(null)}vao(){let t=this.gl.createVertexArray();if(!t)throw Error("tiny-planet: no vertex array");return this.vaos.push(t),this.gl.bindVertexArray(t),t}buffer(t,e){let a=this.gl,o=a.createBuffer();if(!o)throw Error("tiny-planet: no buffer");this.buffers.push(o),a.bindBuffer(t,o),a.bufferData(t,e,a.STATIC_DRAW)}attrib(t,e,a,o,r=0){let i=this.gl;i.enableVertexAttribArray(t),i.vertexAttribPointer(t,e,i.FLOAT,!1,a,o),r&&i.vertexAttribDivisor(t,r)}shared(t,e){let a=this.gl,o=t.u;a.uniformMatrix4fv(o("uViewProj"),!1,e.viewProj),a.uniformMatrix3fv(o("uRot"),!1,e.rot),a.uniform3fv(o("uBulge"),e.bulge),a.uniform3fv(o("uSun"),e.sun),a.uniform3fv(o("uCam"),e.cam),a.uniform1f(o("uTime"),e.time),a.uniform1f(o("uDark"),e.dark),a.uniform4fv(o("uMoon"),e.moon),a.uniform4fv(o("uBanks"),e.banks),a.uniform1i(o("uBankCount"),e.bankCount)}draw(t,e,a){let o=this.gl,r=this.world;o.bindFramebuffer(o.FRAMEBUFFER,null),o.viewport(0,0,e,a),o.disable(o.BLEND),o.depthMask(!0),o.clearDepth(1),o.clear(o.DEPTH_BUFFER_BIT),o.disable(o.DEPTH_TEST),o.disable(o.CULL_FACE),o.useProgram(this.backdrop.program);{let e=this.backdrop.u;o.uniform3fv(e("uBg"),t.bg),o.uniform2f(e("uRes"),t.width,t.height),o.uniform2f(e("uCenter"),t.cx,t.cy),o.uniform1f(e("uRadius"),t.radiusPx),o.uniform1f(e("uDark"),t.dark),o.uniform1f(e("uTime"),t.time),o.uniform1f(e("uStars"),t.stars)}o.bindVertexArray(this.emptyVao),o.drawArrays(o.TRIANGLES,0,3),o.enable(o.DEPTH_TEST),o.depthFunc(o.LEQUAL),o.enable(o.CULL_FACE),o.cullFace(o.BACK),o.useProgram(this.land.program),this.shared(this.land,t),o.bindVertexArray(this.landVao),o.drawArrays(o.TRIANGLES,0,r.terrainVertices),o.disable(o.CULL_FACE),o.useProgram(this.pine.program),this.shared(this.pine,t),o.uniform3fv(this.pine.u("uAir"),t.air),o.uniform1f(this.pine.u("uSway"),t.sway),o.bindVertexArray(this.pineVao),o.drawArraysInstanced(o.TRIANGLES,0,r.treeMeshVertices,r.treeCount),o.enable(o.CULL_FACE),o.useProgram(this.moon.program),this.shared(this.moon,t),o.uniformMatrix3fv(this.moon.u("uMoonRot"),!1,t.moonRot),o.uniform1f(this.moon.u("uPlanetR"),t.planetR),o.bindVertexArray(this.moonVao),o.drawArrays(o.TRIANGLES,0,r.moonVertices),o.useProgram(this.cloud.program),this.shared(this.cloud,t),o.uniformMatrix3fv(this.cloud.u("uCloudRot"),!1,t.cloudRot),o.bindVertexArray(this.cloudVao),o.drawArraysInstanced(o.TRIANGLES,0,r.puffMeshVertices,r.puffCount),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),o.useProgram(this.sea.program),this.shared(this.sea,t),o.uniform1f(this.sea.u("uWave"),t.wave),o.bindVertexArray(this.seaVao),o.drawElements(o.TRIANGLES,this.seaCount,o.UNSIGNED_SHORT,0),o.depthMask(!1),o.useProgram(this.dots.program);{let e=this.dots.u;o.uniformMatrix4fv(e("uViewProj"),!1,t.viewProj),o.uniform3fv(e("uU"),t.orbitU),o.uniform3fv(e("uV"),t.orbitV),o.uniform4fv(e("uMoon"),t.moon),o.uniform1f(e("uDot"),t.dotPx),o.uniform4fv(e("uColour"),t.dotColour)}o.bindVertexArray(this.dotsVao),o.drawArrays(o.POINTS,0,150),t.lights>.001&&(o.blendFunc(o.ONE,o.ONE),o.useProgram(this.lights.program),this.shared(this.lights,t),o.uniform1f(this.lights.u("uPx"),t.lightPx),o.uniform1f(this.lights.u("uLights"),t.lights),o.bindVertexArray(this.lightsVao),o.drawArrays(o.POINTS,0,r.lightCount)),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),o.useProgram(this.air.program);{let e=this.air.u;o.uniformMatrix4fv(e("uViewProj"),!1,t.viewProj),o.uniform1f(e("uShell"),1.34*t.planetR),o.uniform3fv(e("uSun"),t.sun),o.uniform3fv(e("uCam"),t.cam),o.uniform1f(e("uPlanetR"),t.planetR),o.uniform1f(e("uDark"),t.dark),o.uniform1f(e("uGlow"),t.glow)}o.bindVertexArray(this.airVao),o.drawElements(o.TRIANGLES,this.airCount,o.UNSIGNED_SHORT,0),o.depthMask(!0),o.disable(o.BLEND),o.bindVertexArray(null)}dispose(){let t=this.gl;for(let e of[this.backdrop,this.land,this.pine,this.cloud,this.sea,this.moon,this.lights,this.dots,this.air])t.deleteProgram(e.program);for(let e of this.vaos)t.deleteVertexArray(e);for(let e of this.buffers)t.deleteBuffer(e);this.vaos=[],this.buffers=[]}}let ta=0;class to{gain=null;band=null;source=null;level=0;pitch=0;start(){if(this.gain)return;let t=(0,s.getAudio)();if(!t)return;let{ctx:e,output:a}=t,o=e.createBufferSource();o.buffer=(0,s.noiseBuffer)(e,2),o.loop=!0;let r=e.createBiquadFilter();r.type="bandpass",r.frequency.value=260,r.Q.value=1.4;let i=e.createBiquadFilter();i.type="lowpass",i.frequency.value=1800;let n=e.createGain();n.gain.value=0,o.connect(r).connect(i).connect(n).connect(a),o.start(),this.source=o,this.band=r,this.gain=n}set(t){let e=this.gain,a=this.band;if(!e||!a||!Number.isFinite(t))return;let o=Math.min(1,Math.max(0,(t-1.2)/14)),r=o*o*(3-2*o)*.075,i=210+46*t,n=e.context.currentTime;Math.abs(r-this.level)>.001&&(this.level=r,e.gain.setTargetAtTime(r,n,.06)),Math.abs(i-this.pitch)>6&&(this.pitch=i,a.frequency.setTargetAtTime(i,n,.08))}stop(){let{gain:t,source:e}=this;if(this.gain=null,this.band=null,this.source=null,this.level=0,this.pitch=0,!t||!e)return;let a=t.context.currentTime;t.gain.cancelScheduledValues(a),t.gain.setTargetAtTime(0,a,.04);try{e.stop(a+.25)}catch{}window.setTimeout(()=>{try{e.disconnect(),t.disconnect()}catch{}},400)}}function tr(t,e){if("function"!=typeof t.createStereoPanner)return null;let a=t.createStereoPanner();return a.pan.value=Math.max(-.8,Math.min(.8,e)),a}function ti(t,e=0){if(!(0,s.audioReady)())return;let a=(0,s.getAudio)();if(!a)return;let{ctx:o,output:r}=a,i=o.currentTime,n=tr(o,e),l=n?(n.connect(r),n):r,u=1320*Math.pow(2,.5*Math.min(1,Math.abs(t)/8));for(let[t,e,a]of[[1,.05,.5],[2.76,.016,.22],[5.4,.006,.1]]){let r=o.createOscillator();r.type="sine",r.frequency.value=u*t;let n=o.createGain();n.gain.setValueAtTime(0,i),n.gain.linearRampToValueAtTime(e,i+.003),n.gain.exponentialRampToValueAtTime(1e-4,i+a),r.connect(n).connect(l),r.start(i),r.stop(i+a+.05)}}let tn={stage:{level:5,trees:760,towns:17,villages:70,banks:15},tile:{level:4,trees:300,towns:14,villages:30,banks:12}};function ts(t){let e=t>>>0;return()=>{let t=e=e+0x6d2b79f5>>>0;return t=Math.imul(t^t>>>15,1|t),(((t^=t+Math.imul(t^t>>>7,61|t))^t>>>14)>>>0)/0x100000000}}function tl(t){let e=ts(t),a=new Uint8Array(256);for(let t=0;t<256;t++)a[t]=t;for(let t=255;t>0;t--){let o=Math.floor(e()*(t+1)),r=a[t];a[t]=a[o],a[o]=r}let o=new Uint8Array(512);for(let t=0;t<512;t++)o[t]=a[255&t];let r=t=>t*t*t*(t*(6*t-15)+10),i=(t,e,a,o)=>{let r=15&t,i=r<8?e:a,n=r<4?a:12===r||14===r?e:o;return((1&r)==0?i:-i)+((2&r)==0?n:-n)},n=(t,e,a)=>t+(e-t)*a;return(t,e,a)=>{let s=255&Math.floor(t),l=255&Math.floor(e),u=255&Math.floor(a);t-=Math.floor(t),e-=Math.floor(e),a-=Math.floor(a);let h=r(t),c=r(e),f=r(a),d=o[s]+l,m=o[d]+u,v=o[d+1]+u,p=o[s+1]+l,g=o[p]+u,b=o[p+1]+u;return n(n(n(i(o[m],t,e,a),i(o[g],t-1,e,a),h),n(i(o[v],t,e-1,a),i(o[b],t-1,e-1,a),h),c),n(n(i(o[m+1],t,e,a-1),i(o[g+1],t-1,e,a-1),h),n(i(o[v+1],t,e-1,a-1),i(o[b+1],t-1,e-1,a-1),h),c),f)}}function tu(t,e,a,o,r,i=2.03,n=.5){let s=0,l=1,u=0,h=1;for(let c=0;c<r;c++)s+=l*t(e*h+17.1*c,a*h-9.3*c,o*h+5.7*c),u+=l,l*=n,h*=i;return s/u}let th=new Map;function tc(t){let e=th.get(t);if(e)return e;let a=(1+Math.sqrt(5))/2,o=[-1,a,0,1,a,0,-1,-a,0,1,-a,0,0,-1,a,0,1,a,0,-1,-a,0,1,-a,a,0,-1,a,0,1,-a,0,-1,-a,0,1];for(let t=0;t<o.length;t+=3){let e=Math.hypot(o[t],o[t+1],o[t+2]);o[t]/=e,o[t+1]/=e,o[t+2]/=e}let r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];for(let e=0;e<t;e++){let t=new Map,e=(e,a)=>{let r=e<a?65536*e+a:65536*a+e,i=t.get(r);if(void 0!==i)return i;let n=o[3*e]+o[3*a],s=o[3*e+1]+o[3*a+1],l=o[3*e+2]+o[3*a+2],u=Math.hypot(n,s,l),h=o.length/3;return o.push(n/u,s/u,l/u),t.set(r,h),h},a=[];for(let t=0;t<r.length;t+=3){let o=r[t],i=r[t+1],n=r[t+2],s=e(o,i),l=e(i,n),u=e(n,o);a.push(o,s,u,i,l,s,n,u,l,s,l,u)}r=a}let i={verts:new Float64Array(o),faces:new Uint16Array(r),vertexCount:o.length/3,faceCount:r.length/3};return th.set(t,i),i}let tf=null;function td(t,e,a){let o=Math.min(1,Math.max(0,(a-t)/(e-t)));return o*o*(3-2*o)}let tm=t=>[parseInt(t.slice(1,3),16)/255,parseInt(t.slice(3,5),16)/255,parseInt(t.slice(5,7),16)/255],tv={floorShallow:tm("#d9cfa4"),floorDeep:tm("#3a6274"),sand:tm("#eadbab"),meadow:tm("#9fc46a"),meadowDry:tm("#bfc97c"),forest:tm("#6b9c4f"),desert:tm("#e3c48d"),hills:tm("#a9a275"),rock:tm("#958a7c"),snow:tm("#f2f4f6"),ice:tm("#e9f1f6"),pine:tm("#3e7a4b"),pineDark:tm("#2f6640"),pineCold:tm("#4f7d63"),moon:tm("#d5d1c8"),moonSea:tm("#aeaba3"),crater:tm("#bdb9b0")};function tp(t,e,a,o,r,i,n,s,l,u,h){let c=r-e,f=i-a,d=n-o,m=s-e,v=l-a,p=u-o,g=f*p-d*v,b=d*m-c*p,y=c*v-f*m,w=Math.hypot(g,b,y)||1;g/=w,b/=w,g*(e+r+s)+b*(a+i+l)+(y/=w)*(o+n+u)<0&&(g=-g,b=-b,y=-y);let M=[e,a,o,r,i,n,s,l,u];for(let e=0;e<3;e++)t.push(M[3*e],M[3*e+1],M[3*e+2],g,b,y),h&&t.push(h[0],h[1],h[2])}function tg(t,e,a,o,r,i=!1){let n=a[0]-e[0],s=a[1]-e[1],l=a[2]-e[2],u=o[0]-e[0],h=o[1]-e[1],c=o[2]-e[2],f=s*c-l*h,d=l*u-n*c,m=n*h-s*u,v=Math.hypot(f,d,m)||1;f/=v,d/=v,m/=v;let p=(e[0]+a[0]+o[0])/3,g=(e[2]+a[2]+o[2])/3;for(let n of((i?d>0:f*p+m*g<0)&&(f=-f,d=-d,m=-m),[e,a,o]))t.push(n[0],n[1],n[2],f,d,m,r)}let tb=22*Math.PI/180,ty=Math.tan(tb/2),tw=2*Math.PI,tM=(t,e,a)=>{let o=Math.hypot(t,e,a);return[t/o,e/o,a/o]},tx=tM(-.8,.24,.55),tA=tM(-.74,.3,-.6),tP={stage:.16,tile:.42,hover:1.35},tk={stage:.24,tile:.46},tR={stage:1.78,tile:1.5},tS=Math.PI/12,tT=[2,1.5,1.2];function tC(t,e){let a=t.trim(),o=a.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(o){let t=3===o[1].length?o[1].replace(/./g,t=>t+t):o[1];return[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255]}let r=a.match(/[\d.]+/g);return r&&r.length>=3?[r[0]/255,r[1]/255,r[2]/255]:e}let tV={};function tF(t){return tV[t]??=function(t){let e=function(){if(tf)return tf;let t=tl(0x135289d),e=tl(0x135289e),a=tl(0x135289f),o=tl(0x13528a0),r=(a,o,r)=>{let i=tu(e,1.1*a+3.1,1.1*o,1.1*r,3),n=tu(e,1.1*a,1.1*o+7.7,1.1*r,3),s=tu(e,1.1*a,1.1*o,1.1*r-4.2,3);return tu(t,1.25*(a+.55*i),1.25*(o+.55*n),1.25*(r+.55*s),5,2.07,.52)},i=tc(4),n=new Float64Array(i.vertexCount);for(let t=0;t<i.vertexCount;t++)n[t]=r(i.verts[3*t],i.verts[3*t+1],i.verts[3*t+2]);let s=Float64Array.from(n).sort(),l=s[Math.floor(.63*s.length)],u=s[s.length-1]-l,h=l-s[0],c=(t,e,a)=>{let o=r(t,e,a)-l;return o>0?Math.min(1,o/u):Math.max(-1,o/h)},f=(t,e,a)=>Math.abs(e)+.07*o(3.1*t,3.1*e,3.1*a)>.915;return tf={height:c,radius:(t,e,o)=>{let r,i=c(t,e,o);if(i>0){let n=1-Math.abs(a(3.3*t,3.3*e,3.3*o)),s=n*n*td(.28,.75,i);r=1.011+.07*Math.pow(i,1.25)+.045*s}else r=.988-.07*Math.pow(-i,.8);return f(t,e,o)&&(r=Math.max(r,1.009+.02*Math.max(0,i))),r},moisture:(t,e,a)=>tu(o,1.9*t+11,1.9*e,1.9*a,3),ice:f}}(),a=ts(0x1352901),o=function(t,e,a){let o=tc(t),{verts:r,faces:i,vertexCount:n,faceCount:s}=o,l=new Float64Array(n),u=new Float64Array(n);for(let t=0;t<n;t++){let a=r[3*t],o=r[3*t+1],i=r[3*t+2];u[t]=e.height(a,o,i),l[t]=e.radius(a,o,i)}let h=[],c=[0,0,0],f=Array(s),d=new Float64Array(s),m=0;for(let t=0;t<s;t++){let o=i[3*t],n=i[3*t+1],s=i[3*t+2],v=u[o],p=u[n],g=u[s],b=(v+p+g)/3,y=Math.max(l[o],l[n],l[s]),w=Math.min(v,p,g),M=(r[3*o]+r[3*n]+r[3*s])/3,x=(r[3*o+1]+r[3*n+1]+r[3*s+1])/3,A=(r[3*o+2]+r[3*n+2]+r[3*s+2])/3,P=Math.hypot(M,x,A),k=y<1,R=w<=0,S=k?"floor":function(t,e,a,o,r,i){if(t.ice(e,a,o))return"ice";if(r<=0)return"floor";let n=Math.abs(a),s=t.moisture(e,a,o);return r>.8||1.05*n+.6*r>1.16?"snow":r>.62?"rock":i&&r<.07?"sand":r>.44?"hills":s<-.13&&n<.5?"desert":s>-.02?"forest":s<-.08?"dry":"meadow"}(e,M/P,x/P,A/P,Math.max(b,.001),R);"floor"!==S||k||(S="sand"),"floor"!==S&&"ice"!==S&&(m+=1),f[t]=S,d[t]=b,function(t,e,a,o){let r;switch(t){case"floor":{let t=td(0,.55,e);a[0]=tv.floorShallow[0]+(tv.floorDeep[0]-tv.floorShallow[0])*t,a[1]=tv.floorShallow[1]+(tv.floorDeep[1]-tv.floorShallow[1])*t,a[2]=tv.floorShallow[2]+(tv.floorDeep[2]-tv.floorShallow[2])*t;return}case"sand":r=tv.sand;break;case"meadow":r=tv.meadow;break;case"dry":r=tv.meadowDry;break;case"forest":r=tv.forest;break;case"desert":r=tv.desert;break;case"hills":r=tv.hills;break;case"rock":r=tv.rock;break;case"snow":r=tv.snow;break;default:r=tv.ice}let i=1+o;a[0]=Math.min(1,r[0]*i),a[1]=Math.min(1,r[1]*i),a[2]=Math.min(1,r[2]*i)}(S,-Math.min(0,b),c,(a()-.5)*.085);let T=l[o],C=l[n],V=l[s];tp(h,r[3*o]*T,r[3*o+1]*T,r[3*o+2]*T,r[3*n]*C,r[3*n+1]*C,r[3*n+2]*C,r[3*s]*V,r[3*s+1]*V,r[3*s+2]*V,c)}return{data:new Float32Array(h),vertices:h.length/9,sphere:o,radius:l,height:u,faceBiome:f,faceHeight:d,land:m/s}}(t.level,e,a),r=function(t,e){let{verts:a,vertexCount:o,faces:r}=t,i=new Float32Array(4*o);for(let t=0;t<o;t++)i[4*t]=a[3*t],i[4*t+1]=a[3*t+1],i[4*t+2]=a[3*t+2],i[4*t+3]=Math.max(0,1-e[t]);return{data:i,indices:r}}(o.sphere,o.radius),i=function(){let t=[],e=(t,e,a,o)=>{let r=(a+o)/6*Math.PI*2;return[Math.cos(r)*e,t,Math.sin(r)*e]},a=(a,o,r,i,n)=>{for(let s=0;s<6;s++){let l=e(a,r,s,i),u=e(a,r,s+1,i);tg(t,l,[0,o,0],u,n),tg(t,u,[0,a+.02,0],l,n,!0)}};for(let e=0;e<4;e++){let a=e/4*Math.PI*2+Math.PI/4,o=(e+1)/4*Math.PI*2+Math.PI/4,r=[.07*Math.cos(a),-.15,.07*Math.sin(a)],i=[.07*Math.cos(o),-.15,.07*Math.sin(o)],n=[.07*Math.cos(o),.3,.07*Math.sin(o)],s=[.07*Math.cos(a),.3,.07*Math.sin(a)];tg(t,r,n,i,1),tg(t,r,s,n,1)}return a(.16,.78,.34,0,0),a(.5,1,.24,.5,0),{data:new Float32Array(t),vertices:t.length/7}}(),n=function(t,e,a){let{sphere:o,radius:r,faceBiome:i,faceHeight:n}=t,{verts:s,faces:l,faceCount:u}=o,h=[],c=[];for(let t=0;t<u;t++){let e=i[t],a="forest"===e?1:"hills"===e?.45:"meadow"===e?.12:.04*("dry"===e);a>0&&(h.push(t),c.push(a))}let f=[],d=0,m=h.map((t,e)=>e);for(let t=m.length-1;t>0;t--){let e=Math.floor(a()*(t+1)),o=m[t];m[t]=m[e],m[e]=o}for(let t=0;t<2&&d<e;t++)for(let o of m){if(d>=e)break;if(a()>c[o]*(0===t?1:.6))continue;let i=h[o],u=l[3*i],m=l[3*i+1],v=l[3*i+2],p=a(),g=a();if(p+g>1&&(p=1-p,g=1-g),(p=.15+.7*p)+(g=.15+.7*g)>.85){let t=.85/(p+g);p*=t,g*=t}let b=1-p-g,y=r[u],w=r[m],M=r[v],x=s[3*u]*y*b+s[3*m]*w*p+s[3*v]*M*g,A=s[3*u+1]*y*b+s[3*m+1]*w*p+s[3*v+1]*M*g,P=s[3*u+2]*y*b+s[3*m+2]*w*p+s[3*v+2]*M*g,k=n[i],R=Math.abs(A)>.62||k>.32,S=R?tv.pineCold:.5>a()?tv.pine:tv.pineDark,T=1+(a()-.5)*.14,C=(R?.03:.036)*(.8+.45*a());f.push(x,A,P,C,S[0]*T,S[1]*T,S[2]*T,a()),d+=1}return{data:new Float32Array(f),count:d}}(o,t.trees,ts(0x1352965)),s=function(){let t=tc(1),e=[],{verts:a,faces:o,faceCount:r}=t;for(let t=0;t<r;t++){let r=o[3*t],i=o[3*t+1],n=o[3*t+2];tp(e,a[3*r],a[3*r+1],a[3*r+2],a[3*i],a[3*i+1],a[3*i+2],a[3*n],a[3*n+1],a[3*n+2],null)}return{data:new Float32Array(e),vertices:e.length/6}}(),l=function(t,e){let a=[],o=[],r=0,i=0,n=[];for(;r<t&&i++<400;){let t=(2*e()-1)*.78,i=e()*Math.PI*2,s=Math.sqrt(1-t*t),l=Math.cos(i)*s,u=Math.sin(i)*s,h=!1;for(let e=0;e<n.length;e+=3)if(l*n[e]+t*n[e+1]+u*n[e+2]>.86){h=!0;break}if(h)continue;n.push(l,t,u);let c=(.36>Math.abs(t)?-1:1)*(.018+.022*e()),f=-u,d=l,m=Math.hypot(f,d)||1;f/=m;let v=t*(d/=m),p=u*f-l*d,g=-t*f,b=(e()-.5)*.7,y=f*Math.cos(b)+v*Math.sin(b),w=p*Math.sin(b),M=d*Math.cos(b)+g*Math.sin(b),x=3+Math.floor(4*e()),A=.1+.045*x,P=1.072+.026*e(),k=.94+.06*e(),R=0,S=0,T=0;for(let o=0;o<x;o++){let r=(1===x?0:o/(x-1)-.5)*A,i=1-Math.abs(r/(A/2+1e-6)),n=(.042+.034*i)*(.85+.3*e()),s=(e()-.5)*.03,h=(e()-.5)*.03,f=l+y*r+v*s,d=t+w*r+p*s+.2*h,m=u+M*r+g*s,b=Math.hypot(f,d,m),C=P+.01*i+(e()-.5)*.006;f=f/b*C,d=d/b*C,m=m/b*C,R+=f,S+=d,T+=m,a.push(f,d,m,n,.62+.1*e(),c,k,e())}o.push(R/x,S/x,T/x,A/2+.06,c),r+=1}return{puffs:new Float32Array(a),puffCount:a.length/8,banks:new Float32Array(o),bankCount:r}}(t.banks,ts(0x13529c9)),u=function(t,e,a,o){let r=[],i=[],n=(e,a,o)=>t.height(e,a,o)>.012&&!t.ice(e,a,o),s=()=>{let t=2*o()-1,e=o()*Math.PI*2,a=Math.sqrt(1-t*t);return[Math.cos(e)*a,t,Math.sin(e)*a]},l=(e,a,o)=>{for(let r=0;r<8;r++){let i=r/8*Math.PI*2,n=-o,s=e,l=Math.hypot(n,s)||1;n/=l;let u=a*(s/=l),h=o*n-e*s,c=-a*n,f=e+(n*Math.cos(i)+u*Math.sin(i))*.075,d=a+h*Math.sin(i)*.075,m=o+(s*Math.cos(i)+c*Math.sin(i))*.075,v=Math.hypot(f,d,m);if(0>=t.height(f/v,d/v,m/v))return!0}return!1},u=(e,a,i,n)=>{let s=t.radius(e,a,i)+.004,l=-(.015+.2*o());r.push(e*s,a*s,i*s,l,o(),n)},h=0;for(;i.length/3<e&&h++<6e3;){let[e,a,r]=s();if(Math.abs(a)>.74||!n(e,a,r)||t.height(e,a,r)>.34||!l(e,a,r)&&o()>.25)continue;let h=!1;for(let t=0;t<i.length;t+=3)if(e*i[t]+a*i[t+1]+r*i[t+2]>.955){h=!0;break}if(h)continue;i.push(e,a,r);let c=8+Math.floor(o()*o()*26),f=.022+.0011*c,d=-r,m=e,v=Math.hypot(d,m)||1;d/=v;let p=a*(m/=v),g=r*d-e*m,b=-a*d;for(let t=0;t<c;t++){let t=Math.sqrt(-2*Math.log(Math.max(1e-6,o()))),i=o()*Math.PI*2,s=t*Math.cos(i)*f,l=t*Math.sin(i)*f,h=e+d*s+p*l,c=a+g*l,v=r+m*s+b*l,y=Math.hypot(h,c,v);n(h/=y,c/=y,v/=y)&&u(h,c,v,.55+.75*Math.exp(-(t*t)/2))}}let c=0;for(h=0;c<a&&h++<6e3;){let[e,a,r]=s();Math.abs(a)>.78||!n(e,a,r)||t.height(e,a,r)>.42||(u(e,a,r,.4+.25*o()),c+=1)}return{data:new Float32Array(r),count:r.length/6}}(e,t.towns,t.villages,ts(0x1352a2d)),h=function(t){let{verts:e,faces:a,faceCount:o,vertexCount:r}=tc(2),i=tl(0x13528a6),n=[];for(let e=0;e<9;e++){let e=2*t()-1,a=t()*Math.PI*2,o=Math.sqrt(1-e*e);n.push([Math.cos(a)*o,e,Math.sin(a)*o,.22+.3*t(),.05+.06*t()])}let s=new Float64Array(r),l=new Float64Array(r);for(let t=0;t<r;t++){let a=e[3*t],o=e[3*t+1],r=e[3*t+2],u=1+.03*i(2.4*a,2.4*o,2.4*r),h=0;for(let[t,e,i,s,l]of n){let n=Math.acos(Math.max(-1,Math.min(1,a*t+o*e+r*i)))/s;n<1?(u-=l*(1-n*n),h=Math.max(h,1-n)):n<1.35&&(u+=.35*l*Math.sin((n-1)/.35*Math.PI))}s[t]=u,l[t]=h}let u=[],h=[0,0,0];for(let r=0;r<o;r++){let o=a[3*r],n=a[3*r+1],c=a[3*r+2],f=td(.05,.3,i(.9*(e[3*o]+e[3*n]+e[3*c])+5,.9*(e[3*o+1]+e[3*n+1]+e[3*c+1]),.9*(e[3*o+2]+e[3*n+2]+e[3*c+2]))),d=Math.max(l[o],l[n],l[c]),m=1+(t()-.5)*.07;for(let t=0;t<3;t++){let e=tv.moon[t]+(tv.moonSea[t]-tv.moon[t])*f;h[t]=(e+(tv.crater[t]-e)*td(.2,.7,d))*m}let v=s[o],p=s[n],g=s[c];tp(u,e[3*o]*v,e[3*o+1]*v,e[3*o+2]*v,e[3*n]*p,e[3*n+1]*p,e[3*n+2]*p,e[3*c]*g,e[3*c+1]*g,e[3*c+2]*g,h)}return{data:new Float32Array(u),vertices:u.length/9}}(ts(0x1352a91)),c=tc(3),f=new Float32Array(3*c.vertexCount);for(let t=0;t<f.length;t++)f[t]=c.verts[t];return{terrain:o.data,terrainVertices:o.vertices,ocean:r.data,oceanIndices:r.indices,treeMesh:i.data,treeMeshVertices:i.vertices,trees:n.data,treeCount:n.count,puffMesh:s.data,puffMeshVertices:s.vertices,puffs:l.puffs,puffCount:l.puffCount,banks:l.banks,bankCount:l.bankCount,lights:u.data,lightCount:u.count,moon:h.data,moonVertices:h.vertices,shell:f,shellIndices:c.faces,land:o.land}}(tn[t])}function tI({mode:t,active:e,reducedMotion:a,theme:o}){let r="stage"===t,[h]=(0,n.useState)(()=>(function(t,e,a){let o="stage"===t,r=new N(2.4);r.orbit=tR[t],r.idle=a?0:tP[t],r.moonPace=a?0:tk[t],r.moonW=r.moonPace,r.moon=o?2.25:2.6;let i=o&&!a;if(i){let t=d();w(t,1,.25,0,.62);let e=d();b(e,t,r.o),r.o.set(e),r.target.set(e),r.kick(5.2),r.moonW=r.moonPace+1.1}else a||r.kick(r.idle);let n="dark"===e;return{planet:r,press:new l.Spring(i?.84:1,{stiffness:120,damping:11}),moonHold:new l.Spring(0,{stiffness:380,damping:24}),theme:new l.Spring(+!!n,{stiffness:18,damping:8.2}),themeName:e,reduced:a,time:0,acc:0,lastInput:-10,lights:+!i,introAt:0,hovering:!1,hover:0,frame:{viewProj:new Float32Array(16),cam:new Float32Array(3),sun:new Float32Array(3),time:0,dark:0,rot:new Float32Array(9),cloudRot:new Float32Array(9),bulge:new Float32Array([1,1,1]),planetR:1,air:new Float32Array(3),sway:0,wave:.0016,moon:new Float32Array(4),moonRot:new Float32Array(9),banks:new Float32Array(64),bankCount:0,lights:1,stars:0,glow:1,bg:new Float32Array([.95,.95,.95]),width:1,height:1,cx:0,cy:0,radiusPx:1,dpr:1,orbitU:new Float32Array(3),orbitV:new Float32Array(3),dotColour:new Float32Array([0,0,0,.2]),dotPx:2,lightPx:4},layout:{width:0,height:0,cx:0,cy:0,r:1,dist:6,sx:0,sy:0},drag:null,dayOffset:1,day:1,shownRate:r.idle,rateText:"",whirr:new to,audio:!1,bg:n?[.055,.02,.024]:[.949,.949,.949],bgHover:n?[.03,.012,.012]:[.922,.922,.922],fg:n?[.886,.647,.157]:[.09,.09,.09],perf:{time:0,slow:0,step:0},keyDir:1,q:d(),q2:d(),v:f(),v2:f(),rv:f()}})(t,o,a)),p=h;window.__tp=p;let g=(0,n.useRef)(null),A=(0,n.useRef)(null),k=(0,n.useRef)(null),R=(0,l.useFinePointer)(),V=(0,n.useId)(),[F,I]=(0,n.useState)(0),[E,W]=(0,n.useState)(null),[D,B]=(0,n.useState)({value:1,dir:void 0}),[z,q]=(0,n.useState)(""),[j,_]=(0,n.useState)(!1),[L,U]=(0,n.useState)(!1),[$,H]=(0,n.useState)(!0),G=(0,n.useCallback)(()=>{let{width:t,height:e}=Q.current;if(t<2||e<2)return;let a=function(t,e,a,o,r){let i,n=t/2,s=e/2;if(a){let a=t<560,r=a?12:22,n=Math.max(80,e-(a?92:102)-r);i=Math.min(n/2.55,(t/2-14)/(o+.24)),s=r+n/2}else i=Math.min(e/2.6,(t/2-4)/(o+.2));let l=e/2/ty,u=1/Math.sin(Math.atan((i=Math.max(10,i))/l));return r.width=t,r.height=e,r.cx=n,r.cy=s,r.r=i,r.dist=u,r.sx=(n-t/2)/(t/2),r.sy=-(s-e/2)/(e/2),r}(t,e,r,p.planet.orbit,p.layout);r&&(W(t=>t&&.5>Math.abs(t.x-a.cx)&&.5>Math.abs(t.y-a.cy)&&.5>Math.abs(t.r-a.r)?t:{x:a.cx,y:a.cy,r:a.r}),H(t>=640))},[r]),O=()=>{var e,a,o,i,n,s;let u,h,c,f,d,m=g.current,y=K.current,{width:x,height:A,dpr:k}=Q.current;if(!m||!y||x<2||A<2)return!1;let R=p.frame,V=p.layout,F=p.planet,I=p.theme.value,N=V.dist;e=R.viewProj,a=x/A,o=Math.max(.1,N-2.6),i=N+2.6,n=V.sx,s=V.sy,u=1/Math.tan(tb/2),h=1/(o-i),c=-n,f=-s,d=(i+o)*h,e.fill(0),e[0]=u/a,e[5]=u,e[8]=c,e[9]=f,e[10]=d,e[11]=-1,e[12]=-(c*N),e[13]=-(f*N),e[14]=-(d*N)+2*i*o*h,e[15]=N,R.cam[0]=0,R.cam[1]=0,R.cam[2]=N;let E=(0,l.lerp)(tx[0],tA[0],I),W=(0,l.lerp)(tx[1],tA[1],I),D=(0,l.lerp)(tx[2],tA[2],I),B=Math.hypot(E,W,D)||1;R.sun[0]=E/B,R.sun[1]=W/B,R.sun[2]=D/B;let z=p.press.value*(1+.035*p.hover);R.planetR=z,P(R.rot,F.o,z),F.airShown(p.v),M(p.q,p.v[0],p.v[1],p.v[2]),b(p.q2,p.q,F.o),P(R.cloudRot,p.q2,z),R.air[0]=p.v[0],R.air[1]=p.v[1],R.air[2]=p.v[2];let q=F.spinRate,j=p.reduced?0:Math.min(.075,55e-5*q*q);R.bulge[0]=1+j,R.bulge[1]=1-.85*j,R.bulge[2]=1+j;let _=Math.min(1,2.5*v(F.air));R.wave=p.reduced?.0012:.0015+.0016*_,R.sway=p.reduced?0:r?.07:.05,F.moonPosition(p.v2);let L=.16*(1+.12*p.moonHold.value);R.moon[0]=p.v2[0],R.moon[1]=p.v2[1],R.moon[2]=p.v2[2],R.moon[3]=L,w(p.q,C[0],C[1],C[2],F.moon),P(R.moonRot,p.q,L),R.orbitU[0]=S[0]*F.orbit,R.orbitU[1]=S[1]*F.orbit,R.orbitU[2]=S[2]*F.orbit,R.orbitV[0]=T[0]*F.orbit,R.orbitV[1]=T[1]*F.orbit,R.orbitV[2]=T[2]*F.orbit;let U=tF(t),$=U.banks,H=p.time,G=R.cloudRot;for(let t=0;t<U.bankCount;t++){let e=$[5*t],a=$[5*t+1],o=$[5*t+2],r=$[5*t+4]*H,i=Math.cos(r),n=Math.sin(r),s=(i*e+n*o)*R.bulge[0],l=a*R.bulge[1],u=(-n*e+i*o)*R.bulge[2];R.banks[4*t]=G[0]*s+G[3]*l+G[6]*u,R.banks[4*t+1]=G[1]*s+G[4]*l+G[7]*u,R.banks[4*t+2]=G[2]*s+G[5]*l+G[8]*u,R.banks[4*t+3]=$[5*t+3]*z}R.bankCount=Math.min(16,U.bankCount),R.time=H,R.dark=I,R.stars=I,R.glow=1,R.lights=p.lights;let O=p.hover;return R.bg[0]=(0,l.lerp)(p.bg[0],p.bgHover[0],O),R.bg[1]=(0,l.lerp)(p.bg[1],p.bgHover[1],O),R.bg[2]=(0,l.lerp)(p.bg[2],p.bgHover[2],O),R.width=x,R.height=A,R.cx=V.cx,R.cy=V.cy,R.radiusPx=V.r*z,R.dpr=k,R.dotColour[0]=p.fg[0],R.dotColour[1]=p.fg[1],R.dotColour[2]=p.fg[2],R.dotColour[3]=(0,l.lerp)(r?.3:.2,r?.42:.3,I),R.dotPx=(r?1.9:1.35)*k,R.lightPx=(0,l.clamp)(.03*V.r,2.3,6.4)*k,m.draw(R,y.width,y.height),!0},Y=(0,l.useFrame)(e,t=>{let e=g.current,{width:a}=Q.current;if(!e||a<2)return!1;let o=p.reduced,i=p.planet,n=performance.now()/1e3,u=v(i.w),h=!p.drag&&n-p.lastInput>4&&u<.5&&p.press.settled&&p.theme.settled&&p.lights>=1;if(!r||h){if(p.acc+=t,p.acc<1/30-.002)return;t=Math.min(.1,p.acc),p.acc=0}if(r&&!h&&p.perf.step<tT.length-1){let e=p.perf;e.time+=t,t>1/40&&(e.slow+=t),e.time>=1.6&&(e.slow>.7*e.time&&(e.step+=1,I(e.step)),e.time=0,e.slow=0)}o||(p.time+=t),!r&&(p.hover=o?+!!p.hovering:(0,l.damp)(p.hover,+!!p.hovering,8,t),o||(i.idle=p.hovering?tP.hover:tP.tile)),o?("free"!==i.mode&&(i.snapToTarget(),"key"===i.mode&&(i.mode="free")),i.w[0]=i.w[1]=i.w[2]=0,i.air.fill(0),i.airW.fill(0),i.moonHeld&&(i.moon=i.moonGoal),p.press.set(p.press.target),p.moonHold.set(p.moonHold.target),p.theme.set(p.theme.target),p.lights=1):(i.step(t),p.press.step(t),p.moonHold.step(t),p.theme.step(t),p.lights<1&&(p.introAt+=t,p.introAt>1.1&&(p.lights=Math.min(1,p.lights+t/1.4))));let c=i.spinRate;if(p.shownRate=o?c:(0,l.damp)(p.shownRate,c,6,t),r&&p.audio&&p.whirr.set(v(i.w)),r&&1>Math.abs(c)&&!p.drag){let t=`Day ${p.day}`;t!==z&&q(t)}if(O(),(()=>{if(!r)return;let t=p.planet,e=Math.floor(t.spin/tw)+p.dayOffset;if(e<1&&(p.dayOffset+=1-e,e=1),e!==p.day){let a=e>p.day?"up":"down";p.day=e,B({value:e,dir:a}),p.audio&&function(t){if(!(0,s.audioReady)())return;let e=(0,s.getAudio)();if(!e)return;let a=performance.now();if(a-ta<70)return;ta=a;let{ctx:o,output:r}=e,i=o.currentTime,n=.085*(1-.6*Math.min(1,Math.max(0,(t-2)/16))),l=o.createBufferSource();l.buffer=(0,s.noiseBuffer)(o);let u=o.createBiquadFilter();u.type="bandpass",u.frequency.value=2400+300*Math.random(),u.Q.value=2.4;let h=o.createGain();h.gain.setValueAtTime(0,i),h.gain.linearRampToValueAtTime(n,i+.0015),h.gain.exponentialRampToValueAtTime(1e-4,i+.03),l.connect(u).connect(h).connect(r),l.start(i,.5*Math.random(),.05);let c=o.createOscillator();c.type="sine",c.frequency.setValueAtTime(880,i),c.frequency.exponentialRampToValueAtTime(480,i+.03);let f=o.createGain();f.gain.setValueAtTime(0,i),f.gain.linearRampToValueAtTime(.55*n,i+.002),f.gain.exponentialRampToValueAtTime(1e-4,i+.055),c.connect(f).connect(r),c.start(i),c.stop(i+.08)}(Math.abs(t.spinRate))}let a=function(t){let e=Math.abs(t);if(e<.02)return"standing still";if(t<-.05)return"rewinding";let a=tw/e;return a<10?`1 day = ${a.toFixed(1)} s`:a<100?`1 day = ${Math.round(a)} s`:`1 day = ${Math.round(a/60)} min`}(p.shownRate);a!==p.rateText&&(p.rateText=a,k.current&&(k.current.textContent=a))})(),o&&!p.drag&&"free"===i.mode&&p.hover%1==0)return!1}),{canvasRef:K,sizeRef:Q,supported:X}=(0,l.useWebGL2)({mode:t,maxDpr:r?tT[F]:1.5,attributes:{alpha:!1,antialias:!0,depth:!0,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:e=>{let a=null;try{a=new te(e,tF(t))}catch(t){console.error(t);return}return g.current=a,window.__tpr={renderer:a,gl:e},G(),O(),Y(),()=>{a?.dispose(),g.current=null}},onResize:()=>{G(),O(),Y()}}),J=(0,n.useCallback)(()=>{try{let t=getComputedStyle(document.documentElement);p.bg=tC(t.getPropertyValue("--tile"),p.bg),p.bgHover=tC(t.getPropertyValue("--tile-hover"),p.bgHover),p.fg=tC(t.getPropertyValue("--foreground"),p.fg)}catch{}},[]),Z=(0,n.useRef)(0);(0,n.useEffect)(()=>{Z.current||(Z.current=performance.now()),p.themeName=o,p.theme.to(+("dark"===o)),(p.reduced||performance.now()-Z.current<800)&&p.theme.set(p.theme.target),J(),O(),Y()},[o]),(0,n.useEffect)(()=>{p.reduced=a;let e=p.planet;a?(e.idle=0,e.moonPace=0,e.moonW=0,p.lights=1,p.press.set(1)):(e.idle=r?tP.stage:p.hovering?tP.hover:tP.tile,e.moonPace=tk[t]),Y()},[a]),(0,n.useEffect)(()=>{e||p.whirr.stop()},[e]),(0,n.useEffect)(()=>{let t=p.whirr;return()=>t.stop()},[]);let tt=(t,e,a)=>{var o;let r,i,n,s,l,u,h,c=(o=p.rv,i=(r=p.layout).width/Math.max(1,r.height),n=t/r.width*2-1-r.sx,s=1-e/r.height*2-r.sy,h=Math.hypot(l=n*ty*i,u=s*ty,1),o[0]=l/h,o[1]=u/h,o[2]=-1/h,o),f=p.layout.dist,d=p.frame.planetR||1,m=f*c[2],v=m*m-(f*f-d*d),g=v>=0?-m-Math.sqrt(v):-m,b=c[0]*g,y=c[1]*g,w=f+c[2]*g,M=Math.hypot(b,y,w)||1;return a[0]=b/M,a[1]=y/M,a[2]=w/M,v>=0},tn=(t,e,a,o)=>{let r=p.frame.viewProj,i=r[0]*t+r[4]*e+r[8]*a+r[12],n=r[1]*t+r[5]*e+r[9]*a+r[13],s=r[3]*t+r[7]*e+r[11]*a+r[15];return o[0]=(i/s+1)/2*p.layout.width,o[1]=(1-n/s)/2*p.layout.height,o[2]=s,o},ts=(0,l.useLatest)(Y),tl=()=>{p.lastInput=performance.now()/1e3,j||_(!0),ts.current()},tu=()=>{r&&(0,s.ensureAudio)()&&!p.audio&&(p.audio=!0,p.whirr.start())},th=t=>{let e=A.current?.getBoundingClientRect();return{x:t.clientX-(e?.left??0),y:t.clientY-(e?.top??0)}},tc=(t,e,a,o=0,r=0)=>{let i=t.n%t.ts.length;t.ts[i]=e/1e3,t.rs[3*i]=a,t.rs[3*i+1]=o,t.rs[3*i+2]=r,t.n+=1},tf=(t,e)=>{let a=p.drag;if(!a||t.pointerId!==a.id)return;p.drag=null;try{t.currentTarget.releasePointerCapture(t.pointerId)}catch{}A.current&&(A.current.style.cursor=R?"grab":"");let o=p.planet,r=p.v,i=!e&&!p.reduced&&((t,e,a)=>{let o=t.ts.length;if(t.n<2)return!1;let r=(t.n-1)%o,i=t.ts[r];if(e/1e3-i>.09)return!1;let n=r,s=0,l=0,u=0;for(let e=0;e<Math.min(t.n,o)-1;e++){let a=(t.n-1-e+4*o)%o,r=(a-1+o)%o;if(i-t.ts[r]>.085)break;n=r,"planet"===t.kind&&(s+=t.rs[3*a],l+=t.rs[3*a+1],u+=t.rs[3*a+2])}let h=i-t.ts[n];if(h<.012)return!1;if("planet"===t.kind)a[0]=s/h,a[1]=l/h,a[2]=u/h;else{let e=t.rs[3*r]-t.rs[3*n];e-=Math.round(e/tw)*tw,a[0]=e/h}return!0})(a,t.timeStamp,r);"planet"===a.kind?(p.press.configure({stiffness:320,damping:13}),p.press.to(1),p.reduced?o.release(0,0,0):i?o.release(r[0],r[1],r[2]):o.release(o.w[0],o.w[1],o.w[2])):(o.moonHeld=!1,p.moonHold.to(0),a.moved||e?i&&(o.moonW=(0,l.clamp)(r[0],-12,12)):(p.reduced?o.moon+=.5:o.moonW+=2.4,ti(o.moonW,0))),tl()},td=(t=p.keyDir)=>{tu();let e=p.planet;p.reduced?(e.keyTurn(t*Math.PI/2),e.snapToTarget(),e.mode="free"):e.kick(9.5*t),tl()};if((0,n.useEffect)(()=>{if(r)return;let t=K.current;if(!t)return;let e=t=>{"mouse"===t.pointerType&&(p.hovering=!0,ts.current())},a=()=>{p.hovering=!1,ts.current()};return t.addEventListener("pointerenter",e),t.addEventListener("pointerleave",a),()=>{t.removeEventListener("pointerenter",e),t.removeEventListener("pointerleave",a)}},[r,X]),!1===X)return(0,i.jsx)(tN,{theme:o});if(!r)return(0,i.jsx)("canvas",{ref:K,"aria-hidden":"true",className:"absolute inset-0 block size-full"});let tm=E?1.07*E.r+6:0;return(0,i.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,i.jsxs)("div",{ref:A,onPointerDown:t=>{let e,a,o,i;if(!r||!t.isPrimary||t.button>0||t.target.closest("[data-lab-controls]"))return;tu();let{x:n,y:l}=th(t),u=p.planet,h=(e=p.v2,tn((a=p.frame.moon)[0],a[1],a[2],e),o=p.layout.height/2/ty/e[2],i=a[3]*o,!(p.frame.moon[2]<0&&Math.hypot(e[0]-p.layout.cx,e[1]-p.layout.cy)<.98*p.layout.r)&&Math.hypot(n-e[0],l-e[1])<i+14),c={id:t.pointerId,kind:h?"moon":"planet",onPlanet:!1,x:n,y:l,x0:n,y0:l,t0:t.timeStamp,moved:!1,last:f(),ts:new Float64Array(12),rs:new Float64Array(36),n:0};if(h)u.moonHeld=!0,u.moonGoal=u.moon,p.moonHold.to(1),tc(c,t.timeStamp,u.moonGoal),ti(u.moonW,p.v2[0]/Math.max(1,p.layout.width)*2-1);else{c.onPlanet=tt(n,l,c.last);let e=v(u.w);p.audio&&e>1&&function(t,e=0){if(!(0,s.audioReady)())return;let a=(0,s.getAudio)();if(!a)return;let o=Math.min(1,Math.max(0,(t-.8)/10));if(o<=0)return;let{ctx:r,output:i}=a,n=r.currentTime,l=tr(r,e),u=l?(l.connect(i),l):i,h=r.createOscillator();h.type="sine",h.frequency.setValueAtTime(150,n),h.frequency.exponentialRampToValueAtTime(62,n+.12);let c=r.createGain();c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.16*o,n+.006),c.gain.exponentialRampToValueAtTime(1e-4,n+.22),h.connect(c).connect(u),h.start(n),h.stop(n+.25);let f=r.createBufferSource();f.buffer=(0,s.noiseBuffer)(r);let d=r.createBiquadFilter();d.type="lowpass",d.frequency.value=700;let m=r.createGain();m.gain.setValueAtTime(0,n),m.gain.linearRampToValueAtTime(.05*o,n+.004),m.gain.exponentialRampToValueAtTime(1e-4,n+.09),f.connect(d).connect(m).connect(u),f.start(n,.5*Math.random(),.12)}(e,(n/Math.max(1,p.layout.width)*2-1)*.5),u.hold(),p.press.configure({stiffness:420,damping:30}),p.press.to(.972),tc(c,t.timeStamp,0,0,0)}p.drag=c;try{t.currentTarget.setPointerCapture(t.pointerId)}catch{}A.current&&(A.current.style.cursor="grabbing"),tl()},onPointerMove:t=>{if(!r)return;let e=p.drag;if(!e||t.pointerId!==e.id)return;let{x:a,y:o}=th(t);!e.moved&&Math.hypot(a-e.x0,o-e.y0)>3&&(e.moved=!0);let i=p.planet;if("planet"===e.kind){let r=p.q;if(e.onPlanet)tt(a,o,p.v),function(t,e,a){let o=m(e,a);if(o<-.999999){let a=0,o=-e[2],r=e[1];return 1e-6>Math.hypot(a,o,r)&&(a=e[2],o=0,r=-e[0]),w(t,a,o,r,Math.PI)}t[0]=e[1]*a[2]-e[2]*a[1],t[1]=e[2]*a[0]-e[0]*a[2],t[2]=e[0]*a[1]-e[1]*a[0],t[3]=1+o,y(t)}(r,e.last,p.v),e.last.set(p.v);else{let t=Math.max(30,p.layout.r);M(r,(o-e.y)/t,(a-e.x)/t,0)}i.turnTarget(r),x(p.rv,r),tc(e,t.timeStamp,p.rv[0],p.rv[1],p.rv[2]),p.reduced&&i.snapToTarget()}else if(e.moved){let r=((t,e)=>{let a=p.planet.orbit,o=p.v2,r=0,i=1/0,n=r=>{let i=Math.cos(r)*a,n=Math.sin(r)*a;return tn(S[0]*i+T[0]*n,S[1]*i+T[1]*n,S[2]*i+T[2]*n,o),Math.hypot(o[0]-t,o[1]-e)};for(let t=0;t<72;t++){let e=t/72*tw,a=n(e);a<i&&(i=a,r=e)}let s=tw/72/2;for(let t=0;t<6;t++){let t=n(r-s),e=n(r+s);t<i?(i=t,r-=s):e<i&&(i=e,r+=s),s/=2}return r})(a,o)-i.moonGoal;r-=Math.round(r/tw)*tw,i.moonGoal+=r,tc(e,t.timeStamp,i.moonGoal)}e.x=a,e.y=o,tl()},onPointerUp:t=>tf(t,!1),onPointerCancel:t=>tf(t,!0),className:"absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]",style:{cursor:R?"grab":void 0},children:[(0,i.jsx)("canvas",{ref:K,role:"img","aria-label":"A small low-poly planet with seas, forests and drifting clouds, town lights on its night side and a moon on a tilted orbit",className:"absolute inset-0 block size-full"}),E?(0,i.jsx)("div",{tabIndex:0,role:"application","aria-roledescription":"planet","aria-label":"Tiny planet","aria-describedby":V,"aria-keyshortcuts":"ArrowLeft ArrowRight ArrowUp ArrowDown Space Enter Home",onKeyDown:t=>{let e=p.planet,a=!0;switch(t.key){case"ArrowRight":case"ArrowLeft":{let a="ArrowRight"===t.key?1:-1;p.keyDir=a,e.keyTurn(a*tS*(t.shiftKey?6:1)),p.reduced&&e.snapToTarget();break}case"ArrowUp":case"ArrowDown":{let a="ArrowUp"===t.key?1:-1;p.reduced?e.moon+=.4*a:e.moonW+=1.6*a,ti(e.moonW,0);break}case" ":case"Enter":td();break;case"Home":e.keyTurn(0),p.reduced&&e.snapToTarget();break;default:a=!1}a&&(t.preventDefault(),tu(),tl())},onFocus:t=>U(t.currentTarget.matches(":focus-visible")),onBlur:()=>U(!1),className:"absolute touch-none rounded-full outline-none focus-visible:shadow-[0_0_0_2px_var(--foreground)]",style:{left:E.x-tm,top:E.y-tm,width:2*tm,height:2*tm}}):null]}),(0,i.jsx)("p",{id:V,className:"sr-only",children:"Drag the planet to turn it and flick to set it spinning; it slows back to its own pace and sets itself upright. With the keyboard, the left and right arrows turn it an hour, with Shift six hours; up and down nudge the moon along its orbit; Space or Enter spins it, and Home stops it."}),(0,i.jsx)("p",{className:"sr-only","aria-live":"polite",children:z}),(0,i.jsxs)(u.StageControls,{placement:"bottom",children:[(0,i.jsxs)(u.Tray,{label:"Planet",children:[(0,i.jsxs)("span",{className:"flex h-10 items-center gap-2.5 ps-2.5 pe-2 text-[13px]",children:[(0,i.jsx)("span",{"aria-hidden":"true",className:"relative inline-flex h-5 min-w-[50px] items-center overflow-hidden font-medium text-primary tabular-nums",children:(0,i.jsxs)("span",{className:"lab-roll block whitespace-nowrap","data-dir":D.dir,children:["Day ",D.value]},D.value)}),(0,i.jsx)("span",{ref:k,"aria-hidden":"true",className:"w-[96px] whitespace-nowrap text-secondary tabular-nums"})]}),(0,i.jsx)(u.TrayDivider,{}),(0,i.jsx)(u.IconButton,{label:"Give it a spin",onClick:()=>td(),children:(0,i.jsx)(c,{})}),(0,i.jsx)(u.TrayDivider,{}),(0,i.jsx)(u.MuteButton,{})]}),(0,i.jsx)(u.StageHint,{className:!j||L?"transition-opacity duration-300":"opacity-0 transition-opacity duration-700",children:L?$?"← → turn it an hour, Shift for six · ↑ ↓ nudge the moon · Space to spin it":"← → turn it · ↑ ↓ the moon · Space to spin":R?"Drag the planet to turn it, flick to spin it · drag the moon along its orbit":"Drag or flick the planet · tap the moon"})]})]})}function tN({theme:t}){let e=(0,n.useRef)(null);return(0,n.useEffect)(()=>{let a=e.current;if(!a)return;let o=()=>{let e=a.getBoundingClientRect(),o=Math.min(window.devicePixelRatio||1,2);a.width=Math.max(1,Math.round(e.width*o)),a.height=Math.max(1,Math.round(e.height*o));let r=a.getContext("2d");if(!r)return;r.setTransform(o,0,0,o,0,0);let i=e.width,n=e.height,s="dark"===t,l=Math.min(n/2.6,i/4.2),u=i/2,h=n/2;for(let[t,e,a]of(r.clearRect(0,0,i,n),r.save(),r.beginPath(),r.arc(u,h,l,0,2*Math.PI),r.clip(),r.fillStyle="#2f7fa8",r.fillRect(u-l,h-l,2*l,2*l),r.fillStyle="#93bd63",[[-.35,-.2,.42],[.3,.25,.36],[.1,-.55,.22]]))r.beginPath(),r.ellipse(u+t*l,h+e*l,a*l,a*l*.7,t,0,2*Math.PI),r.fill();let c=r.createLinearGradient(u-l,h,u+l,h),f=s?.05:.55;c.addColorStop(0,"rgba(8, 12, 30, 0)"),c.addColorStop(f,"rgba(8, 12, 30, 0)"),c.addColorStop(Math.min(1,f+.3),"rgba(8, 12, 30, 0.82)"),c.addColorStop(1,"rgba(8, 12, 30, 0.88)"),r.fillStyle=c,r.fillRect(u-l,h-l,2*l,2*l),r.restore(),r.fillStyle=s?"#9c9a94":"#d5d1c8",r.beginPath(),r.arc(u+1.6*l,h+.35*l,.16*l,0,2*Math.PI),r.fill()};o();let r=new ResizeObserver(o);return r.observe(a),()=>r.disconnect()},[t]),(0,i.jsx)("canvas",{ref:e,role:"img","aria-label":"A small planet and its moon",className:"absolute inset-0 block size-full"})}t.s(["default",0,function(t){return(0,i.jsx)(tI,{...t})}],15472)},24421,function(t){t.n(t.i(15472))}]);