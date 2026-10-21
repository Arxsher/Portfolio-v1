(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,9024,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(33209),o=e.i(16442),i=e.i(37047),n=e.i(45219);function s({size:e=16,className:a,children:r}){return(0,t.jsx)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:a?`shrink-0 ${a}`:"shrink-0",children:(0,t.jsx)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:r})})}function l(e){return(0,t.jsxs)(s,{...e,children:[(0,t.jsx)("path",{d:"M4.25 11.25V4.6c0-1.3 1.05-2.35 2.35-2.35h2.8c1.3 0 2.35 1.05 2.35 2.35v6.65"}),(0,t.jsx)("path",{d:"M4.25 11.25h7.5"}),(0,t.jsx)("path",{d:"M5.4 7.1h5.2"}),(0,t.jsx)("path",{d:"m5.25 13.75 1-2.5m4.5 2.5-1-2.5"}),(0,t.jsx)("circle",{cx:"6.1",cy:"9.25",r:"0.2",fill:"currentColor",strokeWidth:1.2}),(0,t.jsx)("circle",{cx:"9.9",cy:"9.25",r:"0.2",fill:"currentColor",strokeWidth:1.2})]})}function h(e){return(0,t.jsxs)(s,{...e,children:[(0,t.jsx)("circle",{cx:"8",cy:"8",r:"2.75"}),(0,t.jsx)("path",{d:"M8 1.75v1.1M8 13.15v1.1M1.75 8h1.1M13.15 8h1.1M3.6 3.6l.78.78M11.62 11.62l.78.78M3.6 12.4l.78-.78M11.62 4.38l.78-.78"})]})}function c(e){return(0,t.jsx)(s,{...e,children:(0,t.jsx)("path",{d:"M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z"})})}var u=e.i(55171);function d(e,t,a){let r=t*Math.PI/180,o=a*Math.PI/180;return e[0]=Math.sin(r)*Math.cos(o),e[1]=Math.sin(o),e[2]=Math.cos(r)*Math.cos(o),e}function f(e,t,a,r){let o=t[0]-a[0],i=t[1]-a[1],n=t[2]-a[2],s=Math.hypot(o,i,n)||1;o/=s,i/=s,n/=s;let l=r[1]*n-r[2]*i,h=r[2]*o-r[0]*n,c=r[0]*i-r[1]*o;s=Math.hypot(l,h,c)||1,l/=s,h/=s;let u=i*(c/=s)-n*h,d=n*l-o*c,f=o*h-i*l;return e[0]=l,e[1]=u,e[2]=o,e[3]=0,e[4]=h,e[5]=d,e[6]=i,e[7]=0,e[8]=c,e[9]=f,e[10]=n,e[11]=0,e[12]=-(l*t[0]+h*t[1]+c*t[2]),e[13]=-(u*t[0]+d*t[1]+f*t[2]),e[14]=-(o*t[0]+i*t[1]+n*t[2]),e[15]=1,e}function m(e,t,a){let r=t[0],o=t[1],i=t[2],n=t[3],s=t[4],l=t[5],h=t[6],c=t[7],u=t[8],d=t[9],f=t[10],m=t[11],v=t[12],p=t[13],g=t[14],x=t[15];for(let t=0;t<4;t++){let w=a[4*t],y=a[4*t+1],b=a[4*t+2],M=a[4*t+3];e[4*t]=w*r+y*s+b*u+M*v,e[4*t+1]=w*o+y*l+b*d+M*p,e[4*t+2]=w*i+y*h+b*f+M*g,e[4*t+3]=w*n+y*c+b*m+M*x}return e}function v(e,t){let a=e.length,r=[],o=Array(a).fill(0);for(let o=0;o<a-1;o++)r.push((t[o+1]-t[o])/(e[o+1]-e[o]));o[0]=r[0],o[a-1]=r[a-2];for(let e=1;e<a-1;e++)o[e]=r[e-1]*r[e]<=0?0:(r[e-1]+r[e])/2;for(let e=0;e<a-1;e++){if(0===r[e]){o[e]=0,o[e+1]=0;continue}let t=o[e]/r[e],a=o[e+1]/r[e],i=t*t+a*a;if(i>9){let n=3/Math.sqrt(i);o[e]=n*t*r[e],o[e+1]=n*a*r[e]}}return r=>{if(r<=e[0])return t[0]+o[0]*(r-e[0]);if(r>=e[a-1])return t[a-1]+o[a-1]*(r-e[a-1]);let i=0;for(;i<a-2&&r>e[i+1];)i++;let n=e[i+1]-e[i],s=(r-e[i])/n,l=s*s,h=l*s;return(2*h-3*l+1)*t[i]+(h-2*l+s)*n*o[i]+(-2*h+3*l)*t[i+1]+(h-l)*n*o[i+1]}}let p=8.981818181818182,g=7.1818181818181825/2,x=13.55-7.1818181818181825/2;function w(e,t,a,r=15){if(e<0)return a[0]=-((95+t)*.49688013784373675)+.8678191796776499*e,a[1]=r,a[2]=185-(95+t)*.8678191796776499+-.49688013784373675*e,a;if(e>98.8)return a[0]=(95+t)*.49688013784373675+.8678191796776499*(e-98.8),a[1]=r,a[2]=185-(95+t)*.8678191796776499+.49688013784373675*(e-98.8),a;let o=-.52+e/95;return a[0]=(95+t)*Math.sin(o),a[1]=r,a[2]=185-(95+t)*Math.cos(o),a}function y(e,t,a){let r=Math.hypot(e,185-t),o=(Math.atan2(e,185-t)+.52)*95;if(o>=0&&o<=98.8)return a[0]=o,a[1]=r-95,a;let i=o<0,n=i?-.52:.52,s=e-95*Math.sin(n),l=t-(185-95*Math.cos(n));return a[0]=98.8*!i+.8678191796776499*s+l*(i?-.49688013784373675:.49688013784373675),a[1]=s*Math.sin(n)-l*Math.cos(n),a}function b(e,t,a){let r=Math.imul(0|e,0x165667b1)+Math.imul(0|t,0x27d4eb2f)+Math.imul(0|a,362437)>>>0;return(((r=Math.imul(r^r>>>13,0x4bf19f61)>>>0)^r>>>16)>>>0)/0x100000000}function M(e,t,a,r){let o=0,i=.5,n=0;for(let s=0;s<a;s++)o+=i*function(e,t,a){let r=Math.floor(e),o=Math.floor(t),i=e-r,n=t-o,s=i*i*(3-2*i),l=n*n*(3-2*n),h=b(r,o,a),c=b(r+1,o,a),u=b(r,o+1,a);return h+(c-h)*s+(u-h)*l+(h-c-u+b(r+1,o+1,a))*s*l}(e,t,r+17*s),n+=i,e=2.03*e+11.7,t=2.03*t-5.3,i*=.5;return o/n}let T=(e,t,a)=>{let r=Math.min(1,Math.max(0,(a-e)/(t-e)));return r*r*(3-2*r)},E=(e,t,a)=>e+(t-e)*a;function R(e){return 2.6*Math.sin(.034*e+.4)+1.4*Math.sin(.081*e+2.2)-1.2+.012*Math.max(0,e-120)}function F(e){return 6.2+21*(1-T(16,50,e))-2.2*T(110,190,e)}let A=[0,0];function P(e,t){let a=function(e,t){let a,r=R(t),o=F(t),i=e-r,n=Math.abs(i),s=i<0;if(n<o){let e=n/o;a=-1.3*(1-e*e)}else a=.55*T(o,o+2.6,n);let l=s?E(E(6,22.5,T(34,92,t)),44,T(110,230,t)):E(E(7,24,T(34,92,t)),50,T(115,235,t)),h=s?E(30,36,T(40,100,t)):E(32,37,T(40,100,t)),c=Math.min(1,Math.max(0,(n-o-2.6)/h)),u=l*Math.pow(c,1.55)+Math.max(0,n-o-2.6-h)*(.32+.25*T(100,200,t)),d=M(.03*e+3.1,.03*t-1.7,4,7)-.5,f=M(.11*e,.11*t,3,23)-.5;a+=u+9*d*T(.05,.5,c)+1.4*f*T(0,.3,c);let m=Math.exp(-((e+25)**2)/90-(t-58)**2/140);return E(a,1.4+.08*(t-58),.8*m*T(.5,3,a))}(e,t),[r,o]=y(e,t,A),i=Math.abs(o);if(r<0||r>98.8){let e=r<0?-r:r-98.8;a=Math.max(a,E(a,23.2-.55*Math.max(0,i-7)-.12*Math.max(0,e-10),T(26,8,i)*T(40,4,e)))}let n=T(-1.3,-.25,r)*T(100.1,99.05,r),s=13.75+1.3*Math.max(0,i-3.3);return n>0&&(a=E(a,Math.min(a,s),n)),i<2.3&&(r<.5||r>98.3)&&r>-4.1&&r<102.89999999999999&&(a=Math.min(a,13.75)),a}class D{v=[];i=[];n=0;vert(e,t,a,r,o,i,n,s,l,h,c){return this.v.push(e,t,a,r,o,i,n,s,l,h,c),this.n++}tri(e,t,a){this.i.push(e,t,a)}quad(e,t,a,r){this.i.push(e,t,a,e,a,r)}face(e,t,a,r,o,i,n,s){let l=t[0]-e[0],h=t[1]-e[1],c=t[2]-e[2],u=r[0]-e[0],d=r[1]-e[1],f=r[2]-e[2],m=d*c-f*h,v=f*l-u*c,p=u*h-d*l,g=Math.hypot(m,v,p)||1;m/=g,v/=g,p/=g;let x=this.vert(e[0],e[1],e[2],m,v,p,o,i[0],n[0],n[1],s),w=this.vert(t[0],t[1],t[2],m,v,p,o,i[1],n[2],n[3],s),y=this.vert(a[0],a[1],a[2],m,v,p,o,i[2],n[4],n[5],s),b=this.vert(r[0],r[1],r[2],m,v,p,o,i[3],n[6],n[7],s);this.quad(x,w,y,b)}}let k=()=>[0,0,0],C=e=>14+.76*e;function S(e){let t=Math.floor(e/p),a=Math.abs(e-(t+.5)*p);return a>=g?x:x+Math.sqrt(g*g-a*a)}function _(e,t,a,r,o,i,n,s,l=63,h=1){let c=[k(),k(),k(),k()],u=[1,1,1,1],d=Math.max(1,h);for(let h=0;h<d;h++){let f=t+(a-t)*h/d,m=t+(a-t)*(h+1)/d;1&l&&(w(f,o,c[0],i),w(m,o,c[1],i),w(m,o,c[2],n),w(f,o,c[3],n),e.face(c[0],c[1],c[2],c[3],s,u,[f,i,m,i,m,n,f,n],0)),2&l&&(w(m,r,c[0],i),w(f,r,c[1],i),w(f,r,c[2],n),w(m,r,c[3],n),e.face(c[0],c[1],c[2],c[3],s,u,[m,i,f,i,f,n,m,n],0)),4&l&&(w(f,o,c[0],n),w(m,o,c[1],n),w(m,r,c[2],n),w(f,r,c[3],n),e.face(c[0],c[1],c[2],c[3],s,u,[f,o,m,o,m,r,f,r],0)),8&l&&(w(f,r,c[0],i),w(m,r,c[1],i),w(m,o,c[2],i),w(f,o,c[3],i),e.face(c[0],c[1],c[2],c[3],s,[.6,.6,.6,.6],[f,r,m,r,m,o,f,o],0))}16&l&&(w(t,r,c[0],i),w(t,o,c[1],i),w(t,o,c[2],n),w(t,r,c[3],n),e.face(c[0],c[1],c[2],c[3],s,u,[r,i,o,i,o,n,r,n],0)),32&l&&(w(a,o,c[0],i),w(a,r,c[1],i),w(a,r,c[2],n),w(a,o,c[3],n),e.face(c[0],c[1],c[2],c[3],s,u,[o,i,r,i,r,n,o,n],0))}function U(e,t){let a=98.8*(0!==t),r=0===t?-1:1,o=[k(),k(),k(),k()],i=(e,t,a,r)=>w(e,t,r,a),n=a-.35*r,s=(t,a,s,l,h,c)=>{r>0?(i(n,t,s,o[0]),i(n,a,h,o[1]),i(n,a,c,o[2]),i(n,t,l,o[3]),e.face(o[0],o[1],o[2],o[3],2,[.9,.9,1,1],[t,s,a,h,a,c,t,l],3)):(i(n,a,h,o[0]),i(n,t,s,o[1]),i(n,t,l,o[2]),i(n,a,c,o[3]),e.face(o[0],o[1],o[2],o[3],2,[.9,.9,1,1],[a,h,t,s,t,l,a,c],3))};s(-8.2,-1.45,12.6,21.4,12.6,21.4),s(1.45,8.2,12.6,21.4,12.6,21.4);for(let e=0;e<10;e++){let t=Math.PI-Math.PI*e/10,a=Math.PI-Math.PI*(e+1)/10;s(1.45*Math.cos(t),1.45*Math.cos(a),17.35+1.45*Math.sin(t),21.4,17.35+1.45*Math.sin(a),21.4)}s(-1.45,1.45,12.6,14.84,12.6,14.84);let l=a+.4*r,h=Math.min(n,l),c=Math.max(n,l);_(e,h-.12,c+.12,-8.35,8.35,21.4,21.72,2,63),_(e,h,c,8.19,8.2,12.6,21.4,2,1),_(e,h,c,-8.2,-8.19,12.6,21.4,2,2);let u=a+3.2*r,d=Math.min(n,u),f=Math.max(n,u);for(let t of[-1,1]){let a=1.45*t;i(d,a,14.86,o[0]),i(f,a,14.86,o[1]),i(f,a,17.35,o[2]),i(d,a,17.35,o[3]),t>0?e.face(o[1],o[0],o[3],o[2],4,[.4,.4,.4,.4],[f,14.86,d,14.86,d,17.35,f,17.35],0):e.face(o[0],o[1],o[2],o[3],4,[.4,.4,.4,.4],[d,14.86,f,14.86,f,17.35,d,17.35],0)}for(let t=0;t<10;t++){let a=Math.PI-Math.PI*t/10,r=Math.PI-Math.PI*(t+1)/10,n=1.45*Math.cos(a),s=1.45*Math.cos(r),l=17.35+1.45*Math.sin(a),h=17.35+1.45*Math.sin(r);i(d,n,l,o[0]),i(f,n,l,o[1]),i(f,s,h,o[2]),i(d,s,h,o[3]),e.face(o[0],o[1],o[2],o[3],4,[.35,.35,.35,.35],[d,h,f,h,f,l,d,l],0)}i(d,1.45,14.86,o[0]),i(f,1.45,14.86,o[1]),i(f,-1.45,14.86,o[2]),i(d,-1.45,14.86,o[3]),e.face(o[0],o[1],o[2],o[3],4,[.4,.4,.4,.4],[d,0,f,0,f,1,d,1],0),i(u,-1.55,14.76,o[0]),i(u,1.55,14.76,o[1]),i(u,1.55,18.900000000000002,o[2]),i(u,-1.55,18.900000000000002,o[3]),r<0?e.face(o[1],o[0],o[3],o[2],4,[0,0,0,0],[0,0,1,0,1,1,0,1],9):e.face(o[0],o[1],o[2],o[3],4,[0,0,0,0],[0,0,1,0,1,1,0,1],9)}let z=[{x:-23.5,z:55,w:3.4,d:2.4,h:2.3,yaw:.25,id:1},{x:-28.5,z:60.5,w:2.8,d:2.2,h:2,yaw:.5,id:2},{x:-20.8,z:63,w:2.6,d:2.3,h:2.6,yaw:.1,id:3},{x:-31.5,z:53.5,w:2.4,d:2,h:1.8,yaw:-.15,id:4},{x:-26,z:68.5,w:3,d:2.2,h:2.1,yaw:.35,id:5},{x:17.5,z:47,w:2.9,d:2.2,h:2,yaw:-.35,id:6}];function B(e,t,a,r){let o=t.length/9,i=(e,a,r,i,n,s,l,h,c)=>{let u=Math.hypot(i,n,s)||1;return t.push(e,a,r,i/u,n/u,s/u,l,h,c),o++},n=e=>{let{top:t,half:a,sill:r}=e,o=t-.3,i=[];i.push([.58,a-.06,-.4,1,0]),i.push([.95,a,0,1,0]),i.push([o,a,0,1,0]);for(let e=0;e<=6;e++){let r=e/6*Math.PI,n=o+Math.sin(r)*(t-o),s=Math.cos(r)*a;i.push([n,s,1.4*Math.sin(r)+.2,Math.cos(r),1])}return i.push([o,-a,0,-1,0]),i.push([.95,-a,0,-1,0]),i.push([.58,-a+.06,-.4,-1,0]),i},s=[];for(let t=0;t<e.length;t++){let a=e[t],r=e[Math.max(0,t-1)],o=e[Math.min(e.length-1,t+1)],l=o.x!==r.x?(o.top-r.top)/(o.x-r.x):0,h=n(a),c=[];for(let[e,t,r,o,n]of h){let s=Math.max(0,(e-1)/(a.top-1));c.push(i(a.x,e,t,-l*s*1.2,r,o,n,a.x,e))}s.push(c)}for(let e=0;e<s.length-1;e++){let t=s[e],r=s[e+1];for(let e=0;e<t.length-1;e++)a.push(t[e],r[e],r[e+1],t[e],r[e+1],t[e+1]);let o=t.length-1;a.push(t[o],r[o],r[0],t[o],r[0],t[0])}let l=(e,t,r)=>{let o=n(e),s=i(e.x,(e.top+.58)/2,0,t,0,0,r,0,(e.top+.58)/2),l=o.map(([a,o])=>i(e.x,a,o,t,0,0,r,o,a));for(let e=0;e<l.length;e++){let r=l[e],o=l[(e+1)%l.length];t>0?a.push(s,r,o):a.push(s,o,r)}};l(e[0],-1,3),l(e[e.length-1],1,r?5:3);let h=(e,t,r,o,n)=>{for(let[s,l,h,c]of[[0,0,1,[[e,r,n],[t,r,n],[t,o,n],[e,o,n]]],[0,0,-1,[[t,r,-n],[e,r,-n],[e,o,-n],[t,o,-n]]],[1,0,0,[[t,r,n],[t,r,-n],[t,o,-n],[t,o,n]]],[-1,0,0,[[e,r,-n],[e,r,n],[e,o,n],[e,o,-n]]],[0,-1,0,[[e,r,-n],[t,r,-n],[t,r,n],[e,r,n]]]]){let e=c.map(([e,t,a])=>i(e,t,a,s,l,h,2,e,t));a.push(e[0],e[1],e[2],e[0],e[2],e[3])}},c=e[0].x,u=e[e.length-1].x;for(let e of(h(c+.6,u-.6,.38,.6,.62),[c+1.9,u-1.9]))h(e-1.05,e+1.05,.05,.42,.68)}let I=({hdr:e,tile:t})=>`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DShadow;
#define HDR ${+!!e}
#define TILE ${+!!t}
`,N=`
layout(std140) uniform Frame {
  mat4 uViewProj;
  mat4 uInvViewProj;
  mat4 uShadowMat;
  vec4 uCam;        // xyz eye, w time
  vec4 uKeyDir;     // xyz to the key light, w shadow texel (world)
  vec4 uKeyCol;     // rgb, w 1 in the mirror pass
  vec4 uSunDir;     // xyz, w disc scale
  vec4 uSunCol;     // rgb, w elevation (degrees)
  vec4 uMoonDir;    // xyz, w night
  vec4 uMoonCol;    // rgb, w dark (how much the air shows lamps)
  vec4 uZenith;     // rgb, w stars
  vec4 uHorizon;    // rgb, w mist
  vec4 uGlow;       // rgb, w haze density
  vec4 uSkyAmb;     // rgb, w hamlet windows (0..1 of them lit)
  vec4 uGroundAmb;  // rgb, w radians per pixel
  vec4 uHaze;       // rgb, w cloud drift
  vec4 uCloudLit;   // rgb, w motion (0 frozen)
  vec4 uCloudShade; // rgb, w unused
  vec4 uHeadPos;    // xyz, w strength
  vec4 uHeadDir;
  vec4 uHead2Pos;
  vec4 uHead2Dir;
  vec4 uCarLights[8];
  vec4 uMisc;       // x car lights, y train window glow, z unused, w unused
};
`,L=`
vec4 encodeColor(vec3 c) {
#if HDR
  return vec4(c, 1.0);
#else
  return vec4(sqrt(clamp(c / 16.0, 0.0, 1.0)), 1.0);
#endif
}
vec3 decodeColor(vec3 c) {
#if HDR
  return c;
#else
  return c * c * 16.0;
#endif
}
`,j=`
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm4(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 3.7);
    a *= 0.5;
  }
  return s / 0.9375;
}
/** Value noise with its gradient (xy) and value (z). */
vec3 noised(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k1 = b - a;
  float k2 = c - a;
  float k4 = a - b - c + d;
  return vec3(du * vec2(k1 + k4 * u.y, k2 + k4 * u.x), a + k1 * u.x + k2 * u.y + k4 * u.x * u.y);
}
`,V=`
const float PI = 3.14159265;

/** The clear sky toward d (no sun disc, clouds, stars or moon). */
vec3 skyBase(vec3 d) {
  float h = max(d.y, 0.0);
  vec3 col = mix(uHorizon.rgb, uZenith.rgb, pow(h, 0.45));
  // a brighter band right on the horizon
  col += uHorizon.rgb * 0.22 * exp(-h * 22.0);
  // the glow around the sun: forward scattering, strongest low down
  float mu = max(dot(d, uSunDir.xyz), 0.0);
  float mie = 0.12 * mu + 0.55 * pow(mu, 9.0) + 1.5 * pow(mu, 90.0);
  col += uGlow.rgb * mie * (0.45 + 0.55 * exp(-h * 4.0));
  // the side away from the sun is a touch cooler and dimmer
  col *= 0.88 + 0.12 * (0.5 + 0.5 * dot(normalize(vec2(d.x, d.z) + 1e-4), normalize(uSunDir.xz + 1e-4)));
  // the moon's halo
  float mm = max(dot(d, uMoonDir.xyz), 0.0);
  col += vec3(0.05, 0.065, 0.1) * uMoonDir.w * (pow(mm, 60.0) * 0.8 + pow(mm, 8.0) * 0.15);
  return col;
}

/** The haze toward d (what distant things fade into). */
vec3 hazeColor(vec3 d) {
  vec3 level = normalize(vec3(d.x, 0.035 + max(d.y, 0.0) * 0.35, d.z));
  return mix(uHaze.rgb, skyBase(level), 0.62);
}

/** Fog and river mist over a surface at P lit to col. */
vec3 fogged(vec3 col, vec3 P) {
  vec3 v = P - uCam.xyz;
  float dist = length(v);
  vec3 d = v / max(dist, 1e-4);
  float lift = exp(-max(min(P.y, 60.0), 0.0) * 0.012);
  float f = 1.0 - exp(-dist * uGlow.w * lift);
  col = mix(col, hazeColor(d), f);
  // mist lying on the water after sundown
  float m = uHorizon.w * (1.0 - exp(-dist * 0.014)) * exp(-max(P.y, 0.0) / 3.5) * 0.26;
  col = mix(col, uHaze.rgb * 1.1 + uMoonCol.rgb * 0.12, m);
  return col;
}

/** Coverage and colour of the cloud deck toward d (d.y > 0). */
vec4 clouds(vec3 d) {
  if (d.y <= 0.0) return vec4(0.0);
  vec2 p = d.xz / (d.y + 0.07) * 0.75 + vec2(uHaze.w * 0.012, uHaze.w * 0.004);
  float n = fbm4(p * 1.35 + vec2(3.0, 9.0));
  float n2 = vnoise(p * 6.0 + 2.0);
  float shape = n + 0.12 * (n2 - 0.5);
  float cover = smoothstep(0.56, 0.79, shape);
  // thinner toward the horizon, none overhead-ish
  cover *= smoothstep(0.012, 0.09, d.y) * (1.0 - smoothstep(0.5, 0.8, d.y));
  if (cover <= 0.0) return vec4(0.0);
  float thin = 1.0 - smoothstep(0.53, 0.68, shape);
  float mu = max(dot(d, uSunDir.xyz), 0.0);
  float toward = pow(mu, 5.0);
  // lit from below near the horizon at golden hour and dusk
  float low = exp(-d.y * 9.0);
  vec3 lit = uCloudLit.rgb * (0.55 + 0.45 * thin + 1.6 * toward * thin);
  vec3 base = mix(uCloudShade.rgb, lit, 0.35 + 0.5 * thin);
  base += uGlow.rgb * low * 0.45 * (0.4 + thin);
  // silvered by the moon at night
  float mm = pow(max(dot(d, uMoonDir.xyz), 0.0), 6.0);
  base += vec3(0.05, 0.06, 0.09) * uMoonDir.w * (0.3 + 0.7 * thin) * (0.4 + mm);
  return vec4(base, cover * 0.92);
}

float starField(vec3 d, float scale, float keep, float seed) {
  vec2 sph = vec2(atan(d.x, d.z), asin(clamp(d.y, -1.0, 1.0)));
  vec2 g = sph * scale;
  vec2 id = floor(g);
  float r = hash12(id + seed);
  if (r < keep) return 0.0;
  vec2 c = (id + 0.2 + 0.6 * hash22(id + seed + 3.1)) / scale;
  vec2 q = (sph - c);
  q.x *= cos(sph.y);
  float px = uGroundAmb.w;
  float core = exp(-dot(q, q) / (px * px * 0.55));
  float tw = 0.75 + 0.25 * sin(uCam.w * uCloudLit.w * (1.5 + 3.0 * r) + r * 50.0);
  return core * (0.3 + 2.2 * pow((r - keep) / (1.0 - keep), 4.0)) * tw;
}

/** The full sky toward d: base, sun disc, clouds, stars, moon. */
vec3 skyColor(vec3 d, bool disc) {
  vec3 col = skyBase(d);
  // stars, faint ones only once it is properly dark
  if (uZenith.w > 0.0 && d.y > 0.0) {
    float s = starField(d, 150.0, 0.955, 1.7) + starField(d, 280.0, 0.975, 7.3) * smoothstep(0.4, 1.0, uZenith.w) * 0.6;
    col += vec3(0.9, 0.94, 1.0) * s * uZenith.w * smoothstep(0.02, 0.2, d.y) * 0.32;
  }
  // the moon: a lit sphere, its bright side toward the sun
  vec3 md = uMoonDir.xyz;
  float mc = dot(d, md);
  float R = 0.0175;
  if (mc > cos(R * 1.4)) {
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), md));
    vec3 up = cross(md, right);
    vec2 q = vec2(dot(d, right), dot(d, up)) / R;
    float r = length(q);
    float edge = 1.0 - smoothstep(0.92, 1.04, r);
    if (edge > 0.0) {
      vec3 n = normalize(right * q.x + up * q.y - md * sqrt(max(0.0, 1.0 - min(r * r, 1.0))));
      float lit = smoothstep(-0.08, 0.2, dot(n, uSunDir.xyz));
      float seas = smoothstep(0.5, 0.75, vnoise(q * 2.4 + 4.0)) * 0.25 + smoothstep(0.55, 0.8, vnoise(q * 5.0 + 9.0)) * 0.12;
      vec3 face = vec3(1.0, 0.97, 0.9) * (1.0 - seas) * (0.85 + 0.15 * n.z);
      float night = uMoonDir.w;
      vec3 moon = face * lit * mix(0.35, 2.2, night) + vec3(0.02, 0.025, 0.04) * night;
      col = mix(col, max(col * 0.92, moon + col * (1.0 - night) * 0.6), edge * smoothstep(-6.0, 4.0, -uSunCol.w + 2.0));
    }
  }
  vec4 c = clouds(d);
  col = mix(col, c.rgb, c.a);
  // the sun's disc (hidden behind anything in front: the sky is drawn first)
  if (disc) {
    float mu = dot(d, uSunDir.xyz);
    float r = 0.0125 * uSunDir.w;
    float k = smoothstep(cos(r * 1.08), cos(r * 0.92), mu);
    if (k > 0.0) {
      float limb = 0.75 + 0.25 * sqrt(max(0.0, 1.0 - pow(acos(min(mu, 1.0)) / r, 2.0)));
      vec3 sun = uSunCol.rgb * 14.0 * limb + vec3(2.0, 1.4, 0.8) * smoothstep(-1.5, 1.0, uSunCol.w);
      col = mix(col, sun * (1.0 - c.a * 0.85), k);
    }
  }
  return col;
}
`,X=`
uniform sampler2DShadow uShadow;

float shadowAt(vec3 P, vec3 n) {
  vec3 offset = n * uKeyDir.w * 1.6 + uKeyDir.xyz * uKeyDir.w * 0.8;
  vec4 s = uShadowMat * vec4(P + offset, 1.0);
  vec3 c = s.xyz / s.w * 0.5 + 0.5;
  if (c.x <= 0.001 || c.x >= 0.999 || c.y <= 0.001 || c.y >= 0.999 || c.z >= 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(uShadow, 0));
  float sum = 0.0;
  sum += texture(uShadow, vec3(c.xy + vec2(-0.6, -1.3) * t, c.z));
  sum += texture(uShadow, vec3(c.xy + vec2(1.3, -0.6) * t, c.z));
  sum += texture(uShadow, vec3(c.xy + vec2(0.6, 1.3) * t, c.z));
  sum += texture(uShadow, vec3(c.xy + vec2(-1.3, 0.6) * t, c.z));
#if !TILE
  sum += texture(uShadow, vec3(c.xy, c.z)) * 2.0;
  return sum / 6.0;
#else
  return sum / 4.0;
#endif
}

/** Warm light from the lit carriages, and the headlights (spot + a little spill). */
vec3 lamps(vec3 P, vec3 n) {
  vec3 sum = vec3(0.0);
  int count = int(uMisc.x);
  for (int i = 0; i < 8; i++) {
    if (i >= count) break;
    vec4 L = uCarLights[i];
    vec3 d = L.xyz - P;
    float d2 = dot(d, d);
    if (d2 > 110.0) continue;
    float ndl = max(dot(n, d * inversesqrt(d2)), 0.0) * 0.75 + 0.25;
    sum += vec3(1.0, 0.6, 0.3) * (L.w * 2.4 * ndl / (1.0 + d2 * 0.45)) * (1.0 - smoothstep(60.0, 110.0, d2));
  }
  for (int k = 0; k < 2; k++) {
    vec4 hp = k == 0 ? uHeadPos : uHead2Pos;
    if (hp.w <= 0.0) continue;
    vec3 hd = k == 0 ? uHeadDir.xyz : uHead2Dir.xyz;
    vec3 d = P - hp.xyz;
    float dist = length(d);
    vec3 l = d / max(dist, 1e-3);
    float cone = smoothstep(0.958, 0.993, dot(l, hd));
    float ndl = max(dot(n, -l), 0.0);
    // the lamp rides above the deck, which hides anything it would have to
    // look down at by more than a few degrees (there is no shadow map for it)
    float over = smoothstep(-0.085, -0.045, l.y);
    float fromLine = abs(length(vec2(P.x, 185.0 - P.z)) - 95.0);
    over *= 1.0 - step(fromLine, 2.70) * step(P.y, 14.75);
    sum += vec3(1.0, 0.93, 0.8) * hp.w * (cone * over * 3.2 / (1.0 + dist * dist * 0.005) + 0.9 / (1.0 + dist * dist * 0.6)) * (ndl * 0.85 + 0.15);
  }
  return sum;
}

/** Sun (or moon) with shadow, sky and ground ambient, the lamps. wrap: light through thin leaves. */
vec3 shade(vec3 albedo, vec3 n, vec3 P, float ao, float wrap, float spec) {
  float sh = shadowAt(P, n);
  float ndl = dot(n, uKeyDir.xyz);
  float diff = max(ndl, 0.0);
  diff = mix(diff, max(ndl * 0.5 + 0.5, 0.0) * 0.8, wrap);
  vec3 key = uKeyCol.rgb * diff * sh;
  vec3 amb = mix(uGroundAmb.rgb, uSkyAmb.rgb, n.y * 0.5 + 0.5);
  // the sky is brighter toward the sun
  amb += uGlow.rgb * 0.07 * max(dot(n, normalize(vec3(uSunDir.x, 0.25, uSunDir.z))), 0.0);
  vec3 col = albedo * (key + amb * ao) + albedo * lamps(P, n) * mix(1.0, ao, 0.5);
  if (spec > 0.0) {
    vec3 V = normalize(uCam.xyz - P);
    vec3 H = normalize(V + uKeyDir.xyz);
    col += uKeyCol.rgb * pow(max(dot(n, H), 0.0), 60.0) * spec * sh * diff;
  }
  return col;
}

/** A normal that faces the eye (meshes built in one go don't all agree on winding). */
vec3 facing(vec3 n, vec3 P) {
  return dot(n, uCam.xyz - P) < 0.0 ? -n : n;
}
`,O=e=>I(e)+N+L+j+V,H=e=>`${I(e)}${N}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aMat;
layout(location = 3) in vec4 aAux;
out vec3 vPos;
out vec3 vNormal;
flat out float vMat;
out vec4 vAux;
void main() {
  vPos = aPos;
  vNormal = aNormal;
  vMat = aMat;
  vAux = aAux;
  vec3 p = aPos;
  if (uKeyCol.w > 0.5) p.y = -p.y; // the mirror pass
  gl_Position = uViewProj * vec4(p, 1.0);
}
`,q=e=>`${I(e)}${N}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aPart;
layout(location = 3) in float aHeight;
layout(location = 4) in vec4 aInstA; // x, y, z, scale
layout(location = 5) in vec4 aInstB; // yaw, hue, lean, darkness
out vec3 vPos;
out vec3 vNormal;
flat out vec3 vTint;
out float vHeight;
flat out float vPart;
void main() {
  float c = cos(aInstB.x);
  float s = sin(aInstB.x);
  vec3 p = aPos * aInstA.w;
  p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  // a slight lean, and a breath of wind in the tops
  float sway = sin(uCam.w * 0.9 + aInstA.x * 0.13 + aInstA.z * 0.07) * 0.035 * uCloudLit.w;
  p.x += p.y * (aInstB.z + sway * aHeight);
  vec3 world = aInstA.xyz + p;
  vec3 n = aNormal;
  n = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
  vPos = world;
  vNormal = n;
  vHeight = aHeight;
  vPart = aPart;
  // needles: from blue-green to warmer green, some darker
  vec3 tint = mix(vec3(0.026, 0.055, 0.042), vec3(0.045, 0.066, 0.03), aInstB.y);
  vTint = tint * (0.7 + 0.4 * aInstB.w);
  vec3 q = world;
  if (uKeyCol.w > 0.5) q.y = -q.y;
  gl_Position = uViewProj * vec4(q, 1.0);
}
`,G=e=>`${I(e)}${N}
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in float aPart;
layout(location = 3) in vec2 aUV;
layout(location = 4) in vec4 aInstA; // x, y, z, s
layout(location = 5) in vec4 aInstB; // forward x, forward z, direction, kind
layout(location = 6) in vec4 aInstC; // livery, rear, seed, light
out vec3 vPos;
out vec3 vNormal;
out vec3 vLocal;
out float vS;
flat out float vPart;
flat out vec4 vInstB;
flat out vec4 vInstC;
void main() {
  vec3 F = normalize(vec3(aInstB.x, 0.0, aInstB.y));
  vec3 R = vec3(F.z, 0.0, -F.x);
  // the cars are drawn a little taller and wider than the mesh (it reads better from the bank)
  const vec3 SCALE = vec3(1.0, 1.320, 1.250);
  vec3 lp = aPos * SCALE;
  vec3 ln = normalize(aNormal / SCALE);
  vec3 world = aInstA.xyz + F * lp.x + vec3(0.0, lp.y, 0.0) + R * lp.z;
  vPos = world;
  vNormal = F * ln.x + vec3(0.0, ln.y, 0.0) + R * ln.z;
  vLocal = aPos;
  // where along the line this vertex is (to hide what is still in the tunnel)
  vS = aInstA.w + aPos.x * aInstB.z;
  vPart = aPart;
  vInstB = aInstB;
  vInstC = aInstC;
  vec3 q = world;
  if (uKeyCol.w > 0.5) q.y = -q.y;
  gl_Position = uViewProj * vec4(q, 1.0);
}
`,$=`
void livery(float id, out vec3 body, out vec3 stripe) {
  if (id < 0.5) { body = vec3(0.028, 0.04, 0.09); stripe = vec3(0.55, 0.4, 0.16); }
  else if (id < 1.5) { body = vec3(0.03, 0.075, 0.05); stripe = vec3(0.62, 0.58, 0.46); }
  else if (id < 2.5) { body = vec3(0.14, 0.025, 0.035); stripe = vec3(0.62, 0.56, 0.44); }
  else { body = vec3(0.36, 0.37, 0.39); stripe = vec3(0.04, 0.06, 0.13); }
}
`,W=e=>`${I(e)}
in vec3 vPos;
void main() {
  if (vPos.z > 142.0) discard;
}
`,K=e=>`${I(e)}
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,Y=4.9-1.9;class Z{trains=[];instances=new Float32Array(252);instanceCount=0;carLights=new Float32Array(32);carLightCount=0;headPos=[0,0,0];headDir=[1,0,0];head=0;head2Pos=[0,0,0];head2Dir=[1,0,0];head2=0;beats=[];beatCount=0;pending=0;nextDir=1;sent=0;random;scratchA=[0,0,0];scratchB=[0,0,0];constructor(e=7){let t=e>>>0;this.random=()=>{let e=t=t+0x6d2b79f5>>>0;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000};for(let e=0;e<3;e++)this.trains.push({live:!1,dir:1,head:0,cars:0,livery:0,speed:0,seed:0,age:0});for(let e=0;e<64;e++)this.beats.push({s:0,frac:0,speed:0,lead:!1})}get busy(){return this.pending>0||this.trains.some(e=>e.live)}get visible(){for(let e of this.trains){if(!e.live)continue;let t=e.head-e.dir*this.length(e),a=Math.min(e.head,t);if(Math.max(e.head,t)>-2.6&&a<101.39999999999999)return!0}return!1}length(e){return 10.05*e.cars-.25}request(){return this.pending=Math.min(this.pending+1,3),this.directionForNext()}directionForNext(){for(let e of this.trains)if(e.live)return e.dir;return this.nextDir}get lastDir(){let e=null;for(let t of this.trains)t.live&&(!e||t.age<e.age)&&(e=t);return e?e.dir:0}spawn(e){let t=this.trains.find(e=>!e.live);if(!t)return!1;let a=this.sent++,r=0===a?6:4+Math.floor(4*this.random());return t.live=!0,t.dir=e,t.cars=Math.min(7,r),t.livery=0===a?0:Math.floor(4*this.random()),t.speed=12.2+1.6*this.random(),t.seed=this.random(),t.age=0,t.head=e>0?-24:122.8,!0}clearFor(e){for(let t of this.trains){if(!t.live)continue;if(t.dir!==e)return!1;let a=t.head-t.dir*this.length(t);if((e>0?a- -24:122.8-a)<46)return!1}return!0}park(){for(let e of this.trains)e.live=!1;this.pending=0;let e=this.nextDir;this.nextDir=-e,this.spawn(e);let t=this.trains.find(e=>e.live);return t&&(t.head=49.4+t.dir*this.length(t)/2-6*t.dir),e}clear(){for(let e of this.trains)e.live=!1;this.pending=0}step(e,t){if(this.beatCount=0,this.pending>0){let e=this.directionForNext();this.clearFor(e)&&this.spawn(e)&&(this.pending--,this.trains.some(t=>t.live&&t.dir!==e)||(this.nextDir=-e))}for(let a of this.trains){if(!a.live)continue;let r=a.head;t||(a.head+=a.dir*a.speed*e,a.age+=e),!t&&e>0&&this.collectBeats(a,r,a.head);let o=a.head-a.dir*this.length(a);(a.dir>0&&o>122.8||a.dir<0&&o<-24)&&(a.live=!1)}this.buildFrame()}collectBeats(e,t,a){if(0!=a-t)for(let r=0;r<e.cars;r++){let o=-e.dir*(4.9+10.05*r);for(let r=0;r<2;r++){let i=o+(0===r?Y:-Y);for(let r=0;r<2;r++){let o=i+(0===r?.85:-.85)*e.dir,n=t+o,s=a+o;if(-18>Math.max(n,s)||Math.min(n,s)>116.8)continue;let l=Math.floor(n/12.5),h=Math.floor(s/12.5);if(l===h)continue;let c=(e.dir>0?h:l)*12.5;if(this.beatCount>=this.beats.length)return;let u=this.beats[this.beatCount++];u.s=c,u.frac=Math.min(1,Math.max(0,(c-n)/(s-n))),u.speed=e.speed,u.lead=0===r}}}}buildFrame(){let e=this.instances,t=0,a=0;this.head=0,this.head2=0;let r=this.scratchA,o=this.scratchB,i=0;for(let n=0;n<this.trains.length;n++){let s=this.trains[n];if(s.live){for(let i=0;i<s.cars;i++){let n=s.head-s.dir*(4.9+10.05*i);if(n+4.9<-3.1||n-4.9>101.89999999999999)continue;if(t>=21)break;w(n-9.8*s.dir/2,0,r),w(n+9.8*s.dir/2,0,o);let l=o[0]-r[0],h=o[2]-r[2],c=Math.hypot(l,h)||1;l/=c,h/=c;let u=12*t;e[u]=(r[0]+o[0])/2,e[u+1]=15,e[u+2]=(r[2]+o[2])/2,e[u+3]=n,e[u+4]=l,e[u+5]=h,e[u+6]=s.dir,e[u+7]=+(0!==i),e[u+8]=s.livery,e[u+9]=+(i===s.cars-1),e[u+10]=(13.7*s.seed+.618*i)%1;let d=Math.min(1,Math.max(0,Math.min(n+4.9,98.8-(n-4.9))/9.8));if(e[u+11]=1,t++,i>0&&d>0&&a<8){let e=4*a;this.carLights[e]=(r[0]+o[0])/2,this.carLights[e+1]=16.782,this.carLights[e+2]=(r[2]+o[2])/2,this.carLights[e+3]=d,a++}}if(i<2){let e=0===i?this.headPos:this.head2Pos,t=0===i?this.headDir:this.head2Dir,a=Math.min(99.1,Math.max(-.3,s.head));w(a,0,e,16.1616),w(a+14*s.dir,0,o,15.5616);let r=o[0]-e[0],n=o[1]-e[1],l=o[2]-e[2],h=Math.hypot(r,n,l)||1;r/=h,n/=h,l/=h,t[0]=r,t[1]=n,t[2]=l;let c=Math.min(1,Math.max(0,1-((s.dir>0?-s.head:s.head-98.8)-2)/16)),u=Math.min(1,Math.max(0,1-((s.dir>0?s.head-98.8:-s.head)-4)/10));0===i?this.head=Math.max(.001,c*u):this.head2=Math.max(.001,c*u),i++}}}this.instanceCount=t,this.carLightCount=a}}let Q=new Map,J=null,ee=null,et=null,ea=-100,er=100,eo=-3,ei=48,en=6,es=142,el=101.39999999999999;class eh{hdr;gl;mode;samples;programs=[];pStatic;pTree;pCar;pStaticDepth;pTreeDepth;pCarDepth;pSky;pWater;pBeam;pDown;pUp;pFinal;loc=new Map;ubo;data=new Float32Array(160);buffers=[];vaoStatic;vaoTree;vaoCar;vaoWater;vaoEmpty;staticCount;treeIndexCount;treeCount;carInstances;carStaging=new Float32Array(252);coachRange;engineRange;shadowSize;shadowTex;shadowFbo;trainShadowTex;trainShadowFbo;lightView=new Float32Array(16);lightProj=new Float32Array(16);lightVP=new Float32Array(16);lastKey=[9,9,9];shadowTexel=.1;shadowFresh=!1;w=0;h=0;msFbo=null;msColor=null;msDepth=null;scene=null;sceneDepth=null;mirror=null;mirrorDepth=null;beam=null;down=[];up=[];constructor(e,t){this.gl=e,this.mode=t,this.hdr=!!e.getExtension("EXT_color_buffer_float");const a=e.getParameter(e.MAX_SAMPLES)||0;this.samples=Math.min(4,a);const r={hdr:this.hdr,tile:"tile"===t},o=(t,a)=>{let r=(0,u.createProgram)(e,t,a);this.programs.push(r);let o=e.getUniformBlockIndex(r,"Frame");return o!==e.INVALID_INDEX&&e.uniformBlockBinding(r,o,0),r};this.pStatic=o(H(r),(e=>`${O(e)}${X}
in vec3 vPos;
in vec3 vNormal;
flat in float vMat;
in vec4 vAux;
out vec4 outColor;

vec3 terrainAlbedo(vec3 P, vec3 n) {
  float slope = 1.0 - n.y;
  float h = P.y;
  float a = fbm4(P.xz * 0.045);
  float b = vnoise(P.xz * 0.35);
  float c = vnoise(P.xz * 1.6);
  // meadow: greens with drier, warmer patches
  vec3 grass = mix(vec3(0.055, 0.1, 0.03), vec3(0.12, 0.15, 0.045), a);
  grass = mix(grass, vec3(0.17, 0.15, 0.07), smoothstep(0.62, 0.85, b) * 0.45);
  grass *= 0.88 + 0.24 * c;
  // under the pines on the valley sides: darker, browner
  float forest = smoothstep(4.0, 12.0, h) * smoothstep(0.35, 0.6, fbm4(P.xz * 0.045 + 7.0));
  grass = mix(grass, vec3(0.05, 0.06, 0.03), forest * 0.55);
  // bare rock on the steep faces and in the cuttings
  vec3 rock = vec3(0.2, 0.19, 0.17) * (0.75 + 0.5 * b);
  vec3 col = mix(grass, rock, smoothstep(0.32, 0.55, slope + (a - 0.5) * 0.25));
  // bracken and heather high up
  col = mix(col, vec3(0.13, 0.085, 0.06), smoothstep(24.0, 42.0, h + (a - 0.5) * 8.0) * 0.55);
  // shingle and mud along the water
  vec3 bank = mix(vec3(0.1, 0.09, 0.075), vec3(0.16, 0.15, 0.13), c);
  col = mix(bank, col, smoothstep(0.12, 0.85, h + (b - 0.5) * 0.3));
  col = mix(vec3(0.04, 0.045, 0.035), col, smoothstep(-0.25, 0.08, h));
  return col;
}

/** Courses of dressed stone: uv in units (along, up), with soft joints. */
vec3 masonry(vec2 uv, vec3 P, float id) {
  float course = 0.46;
  float row = floor(uv.y / course);
  float shift = mod(row, 2.0) * 0.5;
  float block = 0.92;
  float col = floor(uv.x / block + shift);
  vec2 f = vec2(fract(uv.x / block + shift), fract(uv.y / course));
  float h = hash12(vec2(col, row));
  vec3 stone = vec3(0.4, 0.375, 0.34) * (0.82 + 0.28 * h);
  stone = mix(stone, vec3(0.42, 0.4, 0.38), 0.3 * vnoise(uv * 0.7));
  // joints fade out once they get thinner than a pixel
  vec2 px = fwidth(uv);
  float sharp = 1.0 - smoothstep(0.035, 0.12, max(px.x / block, px.y / course));
  float jx = smoothstep(0.0, 0.05, f.x) * smoothstep(1.0, 0.95, f.x);
  float jy = smoothstep(0.0, 0.09, f.y) * smoothstep(1.0, 0.91, f.y);
  stone *= mix(1.0, 0.62 + 0.38 * jx * jy, sharp);
  // weathering: streaks down from the deck, damp and moss low on the piers
  float streak = vnoise(vec2(uv.x * 2.2, uv.y * 0.12));
  stone *= 0.86 + 0.18 * streak;
  stone = mix(stone, vec3(0.12, 0.13, 0.08), smoothstep(5.0, 0.0, P.y) * 0.45 * (0.6 + 0.4 * h));
  return stone;
}

/**
 * Windows in a house wall: emission (rgb) and glass (a). uv: across the
 * wall from its middle, and up from the ground. id packs the house, two
 * storeys or one, a long or short wall, and which face (4: a gable).
 */
vec4 houseWindows(vec2 uv, float id) {
  float face = mod(id, 8.0);
  bool wide = mod(floor(id / 8.0), 2.0) > 0.5;
  bool two = mod(floor(id / 16.0), 2.0) > 0.5;
  float house = floor(id / 32.0);
  float mask = 0.0;
  float key = 0.0;
  if (face > 3.5) {
    // the gable: one small window up in the loft
    mask = step(abs(uv.x), 0.2) * step(abs(uv.y - 0.4), 0.17);
    key = hash12(vec2(house, 9.0));
  } else {
    float pitch = 0.92;
    float i = wide ? floor(uv.x / pitch + 0.5) : floor(uv.x / pitch) + 0.5;
    float x = uv.x - i * pitch;
    float cols = wide ? 1.0 : 0.5;
    float j = uv.y < 1.6 ? 0.0 : 1.0;
    float y0 = j < 0.5 ? 0.75 : 1.85;
    float inRow = step(y0, uv.y) * step(uv.y, y0 + 0.52) * (j < 0.5 || two ? 1.0 : 0.0);
    mask = step(abs(x), 0.21) * step(abs(i), cols) * inRow;
    // a door on the front of the ground floor of some
    key = hash12(vec2(i + house * 13.0 + face * 3.0, j + 1.7));
  }
  // windows come on one by one as it gets dark; a few stay dark
  float on = step(key, uSkyAmb.w) * step(0.14, fract(key * 7.13));
  vec3 warm = mix(vec3(1.0, 0.52, 0.2), vec3(1.0, 0.7, 0.38), fract(key * 3.7));
  return vec4(warm * on * 3.2, mask);
}

void main() {
  if (uKeyCol.w > 0.5 && vPos.y < -0.02) discard;
  vec3 P = vPos;
  vec3 n = normalize(vNormal);
  int mat = int(vMat + 0.5);
  float ao = vAux.x;
  vec3 albedo;
  vec3 emit = vec3(0.0);
  float wrap = 0.0;
  float spec = 0.0;
  if (mat == 0) {
    albedo = terrainAlbedo(P, n);
    spec = 0.05 * (1.0 - smoothstep(0.0, 0.5, P.y));
  } else if (mat == 1) {
    // the far ranges: forested lower down, scree and rock higher up
    float r = vnoise(P.xz * 0.05);
    albedo = mix(vec3(0.05, 0.065, 0.045), vec3(0.15, 0.14, 0.13), smoothstep(30.0, 80.0, P.y + r * 25.0));
  } else if (mat == 2) {
    n = facing(n, P);
    albedo = vAux.w > 1.5 && vAux.w < 2.5 ? vec3(0.46, 0.44, 0.41) : masonry(vAux.yz, P, vAux.w);
    spec = 0.04;
  } else if (mat == 3) {
    albedo = vec3(0.07, 0.065, 0.06) * (0.8 + 0.4 * vnoise(vAux.yz * 3.0));
  } else if (mat == 4) {
    n = facing(n, P);
    albedo = vAux.w > 8.5 ? vec3(0.0) : vec3(0.05, 0.048, 0.045);
  } else if (mat == 5) {
    n = facing(n, P);
    float house = floor(vAux.w / 32.0);
    albedo = mix(vec3(0.6, 0.58, 0.53), vec3(0.5, 0.47, 0.42), hash12(vec2(house, 3.0)));
    vec4 w = houseWindows(vAux.yz, vAux.w);
    albedo = mix(albedo, vec3(0.03, 0.035, 0.04), w.a);
    emit = w.rgb * w.a;
    spec = w.a * 0.4;
  } else if (mat == 6) {
    n = facing(n, P);
    albedo = mix(vec3(0.07, 0.07, 0.08), vec3(0.12, 0.08, 0.07), hash12(vec2(vAux.w, 1.0)));
    spec = 0.08;
  } else {
    n = facing(n, P);
    albedo = vec3(0.17, 0.165, 0.155) * (0.7 + 0.5 * hash12(vAux.ww));
  }
  vec3 col = shade(albedo, n, P, ao, wrap, spec) + emit;
  col = fogged(col, P);
  outColor = encodeColor(col);
}
`)(r)),this.pTree=o(q(r),(e=>`${O(e)}${X}
in vec3 vPos;
in vec3 vNormal;
flat in vec3 vTint;
in float vHeight;
flat in float vPart;
out vec4 outColor;
void main() {
  if (uKeyCol.w > 0.5 && vPos.y < -0.02) discard;
  vec3 n = normalize(vNormal);
  vec3 albedo = vPart > 0.5 ? vec3(0.07, 0.05, 0.035) : vTint;
  float ao = mix(0.45, 1.0, smoothstep(0.0, 0.85, vHeight));
  vec3 col = shade(albedo, n, vPos, ao, vPart > 0.5 ? 0.0 : 0.45, 0.0);
  // backlit needles glow at the edges (the scene looks toward the sun)
  vec3 V = normalize(uCam.xyz - vPos);
  float through = pow(max(dot(-V, uKeyDir.xyz), 0.0), 14.0);
  float rim = pow(1.0 - abs(dot(n, V)), 3.0);
  col += uKeyCol.rgb * vec3(0.5, 0.55, 0.22) * through * rim * 0.16 * shadowAt(vPos, n) * (1.0 - vPart);
  col = fogged(col, vPos);
  outColor = encodeColor(col);
}
`)(r)),this.pCar=o(G(r),((e,t)=>`${O(e)}${X}${$}
in vec3 vPos;
in vec3 vNormal;
in vec3 vLocal;
in float vS;
flat in float vPart;
flat in vec4 vInstB;
flat in vec4 vInstC;
out vec4 outColor;
const float S_LO = -2.600;
const float S_HI = ${t.toFixed(3)};
void main() {
  if (vS < S_LO || vS > S_HI) discard;
  if (uKeyCol.w > 0.5 && vPos.y < -0.02) discard;
  vec3 n = normalize(vNormal);
  vec3 V = normalize(uCam.xyz - vPos);
  int part = int(vPart + 0.5);
  bool engine = vInstB.w < 0.5;
  vec3 body;
  vec3 stripe;
  livery(vInstC.x, body, stripe);
  vec3 albedo = body;
  vec3 emit = vec3(0.0);
  float spec = 0.35;
  float glass = 0.0;
  float x = vLocal.x;
  float y = vLocal.y;
  float glow = uMisc.y;
  if (part == 0) {
    // the side: window band, a fine stripe under it, a darker skirt
    if (y > 0.98 && y < 1.05) albedo = stripe;
    if (y < 0.72) albedo = body * 0.6;
    if (!engine) {
      float pitch = 1.06;
      float i = floor((x + 3.95) / pitch);
      float fx = (x + 3.95) - i * pitch;
      bool row = i >= 0.0 && i < 7.5 && fx > 0.14 && fx < 0.92 && y > 1.17 && y < 1.63;
      bool door = abs(abs(x) - 4.42) < 0.17 && y > 1.2 && y < 1.62;
      if (row || door) {
        glass = 1.0;
        float key = hash12(vec2(i + vInstC.z * 31.0, sign(vLocal.z) + (door ? 9.0 : 0.0)));
        // compartments: most lit warm, some blinds half down, a few dark
        float lit = step(0.1, key);
        float blind = step(0.72, key) * smoothstep(1.48, 1.44, y);
        vec3 warm = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.8, 0.52), fract(key * 5.3));
        emit = warm * lit * (1.0 - 0.6 * blind) * glow * (door ? 0.6 : 1.0);
      }
    } else {
      // the cab's side window, and louvres along the engine room
      if (x > 3.15 && x < 3.85 && y > 1.2 && y < 1.62) {
        glass = 1.0;
        emit = vec3(0.35, 0.5, 0.45) * 0.12 * glow;
      } else if (x > -3.6 && x < 2.6 && y > 1.2 && y < 1.62) {
        float lv = step(0.5, fract(x * 3.2));
        albedo = mix(body * 0.55, body * 0.85, lv);
      }
    }
  } else if (part == 1) {
    albedo = vec3(0.13, 0.13, 0.14);
    spec = 0.25;
  } else if (part == 2) {
    albedo = vec3(0.018);
    spec = 0.0;
  } else if (part == 3) {
    // a coach end: tail lamps on the last one's rear
    albedo = body * 0.85;
    if (vInstC.y > 0.5 && x < 0.0) {
      vec2 q = vec2(abs(vLocal.z) - 0.47, y - 0.84);
      float lamp = 1.0 - smoothstep(0.07, 0.1, length(q));
      emit = vec3(4.0, 0.18, 0.08) * lamp;
    }
  } else if (part == 4) {
    albedo = vec3(0.012, 0.016, 0.02);
    glass = 1.0;
    emit = vec3(0.3, 0.42, 0.36) * 0.05 * glow;
  } else {
    // the nose: livery, a stripe, two headlamps and a marker lamp
    albedo = body;
    if (y > 0.98 && y < 1.05) albedo = stripe;
    vec2 q = vec2(abs(vLocal.z) - 0.36, y - 0.86);
    float lamp = 1.0 - smoothstep(0.075, 0.105, length(q));
    vec2 m = vec2(vLocal.z, y - 1.2);
    float marker = 1.0 - smoothstep(0.045, 0.07, length(m));
    emit = vec3(9.0, 8.6, 7.6) * max(lamp, marker * 0.6);
  }
  vec3 col = shade(albedo, facing(n, vPos), vPos, 1.0, 0.0, glass > 0.5 ? 0.0 : spec);
  if (glass > 0.5) {
    // glass: the sky in it by day, the lit interior at night
    vec3 r = reflect(-V, facing(n, vPos));
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(V, facing(n, vPos)), 0.0), 5.0);
    vec3 sky = skyBase(normalize(vec3(r.x, abs(r.y), r.z)));
    col = mix(col, sky * 0.7, clamp(F * 0.8 + 0.12, 0.0, 1.0));
  }
  col += emit;
  col = fogged(col, vPos);
  outColor = encodeColor(col);
}
`)(r,el)),this.pStaticDepth=o(H(r),W(r)),this.pTreeDepth=o(q(r),W(r)),this.pCarDepth=o(G(r),((e,t)=>`${I(e)}
in float vS;
void main() {
  if (vS < -2.600 || vS > ${t.toFixed(3)}) discard;
}
`)(r,el)),this.pSky=o((e=>`${I(e)}
out vec2 vNdc;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vNdc = p * 2.0 - 1.0;
  gl_Position = vec4(vNdc, 1.0, 1.0);
}
`)(r),(e=>`${O(e)}
in vec2 vNdc;
out vec4 outColor;
void main() {
  vec4 far = uInvViewProj * vec4(vNdc, 1.0, 1.0);
  vec4 near = uInvViewProj * vec4(vNdc, -1.0, 1.0);
  vec3 d = normalize(far.xyz / far.w - near.xyz / near.w);
  // the mirror pass draws the world upside down: the sky it reflects is the one above
  if (uKeyCol.w > 0.5) d.y = -d.y;
  vec3 col = skyColor(d, true);
  // below the horizon (only seen past the far edge): the haze
  if (d.y < 0.0) col = mix(col, hazeColor(d), smoothstep(0.0, -0.02, d.y));
  outColor = encodeColor(col);
}
`)(r)),this.pWater=o((e=>`${I(e)}${N}
layout(location = 0) in vec3 aPos;
out vec3 vPos;
void main() {
  vPos = aPos;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`)(r),(e=>`${O(e)}${X}
uniform sampler2D uMirror;
uniform vec2 uViewport;
in vec3 vPos;
out vec4 outColor;

/** The ripples: a slow swell coming down the river and finer cat's-paws. */
vec2 ripple(vec2 p, float dist) {
  float t = uCam.w * uCloudLit.w;
  vec2 g = vec2(0.0);
  vec3 a = noised(p * vec2(0.16, 0.07) + vec2(0.0, t * 0.09));
  g += a.xy * vec2(0.16, 0.07) * 2.2;
  vec3 b = noised(p * vec2(0.42, 0.22) + vec2(t * 0.05, t * 0.3));
  g += b.xy * vec2(0.42, 0.22) * 0.9;
  float lod = 1.0 - smoothstep(30.0, 110.0, dist);
  vec3 c = noised(p * vec2(1.3, 0.85) + vec2(-t * 0.1, t * 0.75));
  g += c.xy * vec2(1.3, 0.85) * 0.22 * lod;
  return g;
}

void main() {
  vec3 P = vPos;
  vec3 toEye = uCam.xyz - P;
  float dist = length(toEye);
  vec3 V = toEye / dist;
  vec2 g = ripple(P.xz, dist);
  float k = 0.32;
  vec3 n = normalize(vec3(-g.x * k, 1.0, -g.y * k));
  // the mirror, bent by the ripples (more along the river than across: streaks)
  vec2 uv = gl_FragCoord.xy / uViewport;
  float bend = 1.0 / (1.0 + dist * 0.035);
  vec2 off = vec2(g.x * 0.010, g.y * 0.03) * bend;
  vec3 refl = decodeColor(texture(uMirror, clamp(uv + off, vec2(0.001), vec2(0.999))).rgb);
  float cosT = max(dot(n, V), 0.0);
  float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
  F = mix(F, 1.0, 0.18);
  // the water itself: peaty, dark, lit only a little
  vec3 body = vec3(0.012, 0.022, 0.02) * (uSkyAmb.rgb * 2.0 + uKeyCol.rgb * 0.15);
  vec3 col = mix(body, refl, clamp(F, 0.0, 1.0));
  // glitter: how likely a wavelet here is tilted to throw the key light at
  // the eye (a path down the water toward the light), broken into sparkles
  // that twinkle dot by dot, plus a narrow sheen right under the light
  float sh = shadowAt(P, vec3(0.0, 1.0, 0.0));
  vec3 h = normalize(V + uKeyDir.xyz);
  float slope = mix(0.42, 0.24, uMoonDir.w);
  float path = pow(max(dot(normalize(vec3(-g.x * slope, 1.0, -g.y * slope)), h), 0.0), mix(160.0, 520.0, uMoonDir.w));
  float frame = floor(uCam.w * uCloudLit.w * 9.0);
  float tw = hash12(floor(gl_FragCoord.xy / 1.5) + vec2(frame * 13.1, frame * 7.7));
  float sparkle = step(tw, path * 0.55) * smoothstep(0.02, 0.2, path);
  // a high sun spreads into a broad glare: keep the soft terms for a low one
  float low = 1.0 - smoothstep(4.0, 14.0, uSunCol.w);
#if TILE
  float glint = sparkle * 3.5 + (path * 0.8 + pow(max(dot(n, h), 0.0), 380.0) * 0.9) * mix(0.35, 1.0, low);
#else
  float glint = sparkle * 9.0 + (path * 0.6 + pow(max(dot(n, h), 0.0), 380.0) * 0.9) * mix(0.3, 1.0, low);
#endif
  // the moon's path only once it is properly dark
  float moonGlint = uMoonDir.w * uMoonDir.w;
  col += uKeyCol.rgb * glint * sh * (uSunCol.w > -0.9 ? 1.0 : 0.4 * moonGlint);
  // the headlights' sheen on the water
  col += lamps(P, n) * 0.04;
  col = fogged(col, P);
  outColor = encodeColor(col);
}
`)(r)),this.pBeam=o(K(r),(e=>`${O(e)}
uniform sampler2D uDepth;
in vec2 vUv;
out vec4 outColor;

float cone(vec3 X, vec4 pos, vec3 dir) {
  vec3 d = X - pos.xyz;
  float l = length(d);
  float c = dot(d, dir) / max(l, 1e-3);
  float over = smoothstep(-0.085, -0.045, d.y / max(l, 1e-3));
  return smoothstep(0.962, 0.994, c) * over / (1.0 + l * l * 0.004) * smoothstep(0.3, 3.0, l);
}

void main() {
  float z = texture(uDepth, vUv).r;
  vec4 w = uInvViewProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
  vec3 P = w.xyz / w.w;
  vec3 ray = P - uCam.xyz;
  float len = length(ray);
  vec3 rd = ray / max(len, 1e-4);
  len = min(len, 420.0);
  vec3 sum = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    vec4 hp = k == 0 ? uHeadPos : uHead2Pos;
    if (hp.w <= 0.0) continue;
    vec3 hd = k == 0 ? uHeadDir.xyz : uHead2Dir.xyz;
    // march only the stretch of the ray near the beam
    float tc = dot(hp.xyz - uCam.xyz, rd);
    float t0 = max(0.0, tc - 95.0);
    float t1 = min(len, tc + 95.0);
    if (t1 <= t0) continue;
    const int STEPS = ${e.tile?14:28};
    float dt = (t1 - t0) / float(STEPS);
    // interleaved gradient noise: an even jitter that blurs out, not sparkle
    float j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float acc = 0.0;
    for (int i = 0; i < STEPS; i++) {
      float t = t0 + (float(i) + j) * dt;
      vec3 X = uCam.xyz + rd * t;
      // the air is thicker low over the river
      float dens = 0.55 + 1.6 * uHorizon.w * exp(-max(X.y, 0.0) / 5.0);
      acc += cone(X, hp, hd) * dens;
    }
    sum += vec3(1.0, 0.93, 0.8) * acc * dt * hp.w;
  }
  outColor = encodeColor(sum * 0.026 * uMoonCol.w);
}
`)(r)),this.pDown=o(K(r),(e=>`${I(e)}${L}
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uFirst;
uniform float uThreshold;
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 o) { return decodeColor(texture(uSrc, vUv + o * uTexel).rgb); }
float w(vec3 c) { return 1.0 / (1.0 + max(max(c.r, c.g), c.b) * uFirst); }
/** Only what is brighter than the threshold glows (a soft knee, no hard edge). */
vec3 prefilter(vec3 c) {
  float br = max(max(c.r, c.g), c.b);
  float knee = uThreshold * 0.6;
  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  return c * max(soft, br - uThreshold) / max(br, 1e-4);
}
void main() {
  vec3 a = tap(vec2(-2.0, 2.0)), b = tap(vec2(0.0, 2.0)), c = tap(vec2(2.0, 2.0));
  vec3 d = tap(vec2(-2.0, 0.0)), e = tap(vec2(0.0, 0.0)), f = tap(vec2(2.0, 0.0));
  vec3 g = tap(vec2(-2.0, -2.0)), h = tap(vec2(0.0, -2.0)), i = tap(vec2(2.0, -2.0));
  vec3 j = tap(vec2(-1.0, 1.0)), k = tap(vec2(1.0, 1.0)), l = tap(vec2(-1.0, -1.0)), m = tap(vec2(1.0, -1.0));
  vec3 g0 = (a + b + d + e) * 0.25, g1 = (b + c + e + f) * 0.25, g2 = (d + e + g + h) * 0.25, g3 = (e + f + h + i) * 0.25;
  vec3 g4 = (j + k + l + m) * 0.25;
  float w0 = w(g0), w1 = w(g1), w2 = w(g2), w3 = w(g3), w4 = w(g4);
  vec3 sum = g0 * w0 * 0.125 + g1 * w1 * 0.125 + g2 * w2 * 0.125 + g3 * w3 * 0.125 + g4 * w4 * 0.5;
  float ws = w0 * 0.125 + w1 * 0.125 + w2 * 0.125 + w3 * 0.125 + w4 * 0.5;
  vec3 res = sum / ws;
  if (uFirst > 0.5) res = prefilter(res);
  outColor = encodeColor(res);
}
`)(r)),this.pUp=o(K(r),(e=>`${I(e)}${L}
uniform sampler2D uSrc;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform float uWeight;
in vec2 vUv;
out vec4 outColor;
vec3 tap(vec2 o) { return decodeColor(texture(uSrc, vUv + o * uTexel).rgb); }
void main() {
  vec3 s = tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0)) + tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0));
  s += 2.0 * (tap(vec2(0.0, 1.0)) + tap(vec2(0.0, -1.0)) + tap(vec2(-1.0, 0.0)) + tap(vec2(1.0, 0.0)));
  s += 4.0 * tap(vec2(0.0));
  outColor = encodeColor(decodeColor(texture(uBase, vUv).rgb) + s / 16.0 * uWeight);
}
`)(r)),this.pFinal=o(K(r),(e=>`${I(e)}${L}
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform sampler2D uBeam;
uniform float uExposure;
uniform float uBloomMix;
uniform float uTime;
uniform float uGrain;
uniform float uBeamOn;
uniform vec3 uLift;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 c = decodeColor(texture(uScene, vUv).rgb);
  if (uBeamOn > 0.5) {
    // the half-size beams, softened with a small tent on the way up
    vec2 bt = 1.0 / vec2(textureSize(uBeam, 0));
    vec3 beam = decodeColor(texture(uBeam, vUv).rgb) * 0.4;
    beam += decodeColor(texture(uBeam, vUv + vec2(1.0, 1.0) * bt).rgb) * 0.15;
    beam += decodeColor(texture(uBeam, vUv + vec2(-1.0, 1.0) * bt).rgb) * 0.15;
    beam += decodeColor(texture(uBeam, vUv + vec2(1.0, -1.0) * bt).rgb) * 0.15;
    beam += decodeColor(texture(uBeam, vUv + vec2(-1.0, -1.0) * bt).rgb) * 0.15;
    c += beam;
  }
  vec3 b = decodeColor(texture(uBloom, vUv).rgb);
  c += b * uBloomMix;
  c *= uExposure;
  // a gentle lift in the shadows (a print never goes fully black)
  c += uLift;
  c = aces(c);
  // vignette
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * 0.38;
  c = pow(c, vec3(1.0 / 2.2));
  // fine grain, strongest in the mid tones
  float n = hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5;
  c += n * uGrain * (0.35 + 0.65 * (1.0 - abs(c - 0.5) * 2.0));
  outColor = vec4(c, 1.0);
}
`)(r));const n=(t,a,r)=>{let o=e.createBuffer();if(!o)throw Error("night-train: no buffer");return e.bindBuffer(t,o),e.bufferData(t,a,r),this.buffers.push(o),o},s=()=>{let t=e.createBuffer();if(!t)throw Error("night-train: no uniform buffer");return e.bindBuffer(e.UNIFORM_BUFFER,t),e.bufferData(e.UNIFORM_BUFFER,640,e.DYNAMIC_DRAW),this.buffers.push(t),t};this.ubo={main:s(),mirror:s(),shadow:s()},e.bindBuffer(e.UNIFORM_BUFFER,null);const l=()=>{let t=e.createVertexArray();if(!t)throw Error("night-train: no vertex array");return t},h=(t,a,r,o,i=0)=>{e.enableVertexAttribArray(t),e.vertexAttribPointer(t,a,e.FLOAT,!1,4*r,4*o),e.vertexAttribDivisor(t,i)},{scenery:c,trees:d,pine:f,cars:m,water:v}=function(e){let t,a,r=Q.get(e);return r||(r={scenery:function(e){let t=new D,a="tile"===e;for(let e of(!function(e,t,a,r){let o=Math.ceil(420/r)+1,i=Math.ceil(280/r)+1,n=new Float32Array(o*i);for(let e=0;e<i;e++)for(let t=0;t<o;t++)n[e*o+t]=P(-210+t*r,-10+e*r);let s=(e,t)=>{let a=Math.min(o-1.001,Math.max(0,(e- -210)/r)),s=Math.min(i-1.001,Math.max(0,(t- -10)/r)),l=Math.floor(a),h=Math.floor(s),c=a-l,u=s-h,d=n[h*o+l],f=n[h*o+l+1],m=n[(h+1)*o+l];return d+(f-d)*c+(m-d)*u+(d-f-m+n[(h+1)*o+l+1])*c*u},l=[2,6,14,30],h=Array.from({length:7},(e,t)=>Math.cos(t/7*Math.PI*2+.3)),c=Array.from({length:7},(e,t)=>Math.sin(t/7*Math.PI*2+.3)),u=e.n,d=t+1,f=new Float32Array(d*(a+1)),m=new Float32Array(d*(a+1)),v=new Float32Array(d*(a+1));for(let e=0;e<=a;e++){let r=e/a,o=.5+254.5*(.3*r+.7*r*r),i=C(o);for(let a=0;a<=t;a++){let r=e*d+a;f[r]=-i+2*i*a/t,m[r]=o,v[r]=P(f[r],o)}}for(let r=0;r<=a;r++)for(let o=0;o<=t;o++){let i=r*d+o,n=f[i],u=m[i],p=v[i],g=r*d+Math.max(0,o-1),x=r*d+Math.min(t,o+1),w=Math.max(0,r-1)*d+o,y=Math.min(a,r+1)*d+o,b=f[x]-f[g],M=v[x]-v[g],T=m[x]-m[g],E=f[y]-f[w],R=v[y]-v[w],F=m[y]-m[w],A=R*T-F*M,P=F*b-E*T,D=E*M-R*b;P<0&&(A=-A,P=-P,D=-D);let k=Math.hypot(A,P,D)||1;A/=k,P/=k,D/=k;let C=0;for(let e=0;e<7;e++){let t=0;for(let a of l){let r=(s(n+h[e]*a,u+c[e]*a)-p)/a;r>t&&(t=r)}C+=t/Math.sqrt(1+t*t)}let S=Math.max(.35,1-C/7*1.15);e.vert(n,p,u,A,P,D,0,S,n,u,0)}for(let r=0;r<a;r++)for(let a=0;a<t;a++){let t=u+r*d+a;e.quad(t,t+d,t+d+1,t+1)}}(t,a?124:214,a?108:196,a?3:2),!function(e,t){let a=[{r:300,depth:70,base:26,amp:30,seed:3,freq:2.6},{r:430,depth:110,base:46,amp:44,seed:9,freq:1.9},{r:640,depth:160,base:70,amp:70,seed:15,freq:1.4}];for(let r=0;r<a.length;r++){let o=a[r],i=e.n,n=(e,t)=>{let a=e/1.32,i=1.7*Math.pow(M(e*o.freq*3+o.seed,.7*o.seed,5,31+o.seed),1.4),n=1-.78*Math.exp(-(((e-.02)/(.09+.025*r))**2)),s=1+.35*Math.abs(a),l=(o.base+o.amp*i)*n*s,h=(t-o.r)/o.depth,c=Math.max(0,1-h*h*.9);return l*c+6*(M(9*e+o.seed,.02*t,3,77+r)-.5)*c-8*(1-c)};for(let a=0;a<=9;a++){let i=o.r-o.depth+2*o.depth*a/9;for(let a=0;a<=t;a++){let o=-1.32+2.64*a/t,s=n(o,i),l=(n(o+.002,i)-n(o-.002,i))/(.004*i),h=(n(o,i+2)-n(o,i-2))/4,c=Math.cos(o),u=-Math.sin(o),d=-(l*c+h*Math.sin(o)),f=1,m=-(l*u+h*Math.cos(o)),v=Math.hypot(d,1,m);d/=v,f/=v,m/=v,e.vert(i*Math.sin(o),s,i*Math.cos(o),d,f,m,1,1,r,o,0)}}let s=t+1;for(let a=0;a<9;a++)for(let r=0;r<t;r++){let t=i+a*s+r;e.quad(t,t+1,t+s+1,t+s)}}}(t,a?110:200),!function(e){let t=function(){let e=[];for(let t=0;t<11;t++){let a=(t+.5)*p,r=t*p;e.push(r),e.push(a-g);for(let t=1;t<18;t++){let r=-Math.cos(t/18*Math.PI);e.push(a+r*g)}e.push(a+g)}return e.push(98.8),e}(),a=[k(),k(),k(),k()];for(let r of[1,-1]){let o=2.1*r;for(let i=0;i<t.length-1;i++){let n=t[i],s=t[i+1];if(s-n<1e-5)continue;let l=S(n+1e-4),h=S(s-1e-4);w(n,o,a[0],l),w(s,o,a[1],h),w(s,o,a[2],15.3),w(n,o,a[3],15.3);let c=.82+.18*T(l,l+2.5,l+.4);r>0?e.face(a[0],a[1],a[2],a[3],2,[c,c,1,1],[n,l,s,h,s,15.3,n,15.3],0):e.face(a[1],a[0],a[3],a[2],2,[c,c,1,1],[s,h,n,l,n,15.3,s,15.3],0)}}for(let r=0;r<t.length-1;r++){let o=t[r],i=t[r+1];if(i-o<1e-5)continue;let n=S(o+1e-4),s=S(i-1e-4);n<=x+.001&&s<=x+.001||(w(i,2.1,a[0],s),w(o,2.1,a[1],n),w(o,-2.1,a[2],n),w(i,-2.1,a[3],s),e.face(a[0],a[1],a[2],a[3],2,[.5,.5,.5,.5],[i,2.1,o,2.1,o,-2.1,i,-2.1],1))}for(let t=0;t<=11;t++){let a=t*p,r=w(a,0,k()),o=Math.min(P(r[0],r[2]),x)-1.5,i=Math.max(-.5,a-.9),n=Math.min(99.3,a+.9);_(e,i,n,-2.1,2.1,o,x+.02,2,51),_(e,i-.18,n+.18,2.1-.05,2.38,o,14.05,2,53),_(e,i-.18,n+.18,-2.38,-2.1+.05,o,14.05,2,54),.6>P(r[0],r[2])&&_(e,i-.45,n+.45,-2.7,2.7,o,1,2,63)}_(e,-.3,99.1,2.1-.05,2.27,14.05,14.38,2,13,48),_(e,-.3,99.1,-2.27,-2.1+.05,14.05,14.38,2,14,48);for(let t=0;t<64;t++){let r=98.8*t/64,o=98.8*(t+1)/64;for(let t of[1,-1]){let i=2.1*t,n=1.8*t;w(r,i,a[0],15.360000000000001),w(o,i,a[1],15.360000000000001),w(o,n,a[2],15.360000000000001),w(r,n,a[3],15.360000000000001),t>0?e.face(a[0],a[1],a[2],a[3],2,[1,1,1,1],[r,0,o,0,o,.3,r,.3],2):e.face(a[1],a[0],a[3],a[2],2,[1,1,1,1],[o,0,r,0,r,.3,o,.3],2),w(r,n,a[0],14.86),w(o,n,a[1],14.86),w(o,n,a[2],15.360000000000001),w(r,n,a[3],15.360000000000001),t>0?e.face(a[1],a[0],a[3],a[2],2,[.7,.7,1,1],[o,14.86,r,14.86,r,15.3,o,15.3],0):e.face(a[0],a[1],a[2],a[3],2,[.7,.7,1,1],[r,14.86,o,14.86,o,15.3,r,15.3],0),w(r,i+.08*t,a[0],15.25),w(o,i+.08*t,a[1],15.25),w(o,i+.08*t,a[2],15.360000000000001),w(r,i+.08*t,a[3],15.360000000000001),t>0?e.face(a[0],a[1],a[2],a[3],2,[1,1,1,1],[r,15.3,o,15.3,o,15.4,r,15.4],2):e.face(a[1],a[0],a[3],a[2],2,[1,1,1,1],[o,15.3,r,15.3,r,15.4,o,15.4],2)}w(r,1.8,a[0],14.86),w(o,1.8,a[1],14.86),w(o,-1.8,a[2],14.86),w(r,-1.8,a[3],14.86),e.face(a[0],a[1],a[2],a[3],3,[.8,.8,.8,.8],[r,1.8,o,1.8,o,-1.8,r,-1.8],0)}}(t),U(t,0),U(t,1),z))!function(e,t){let{x:a,z:r,w:o,d:i,h:n,yaw:s,id:l}=t,h=Math.min(P(a-o/2,r-i/2),P(a+o/2,r-i/2),P(a-o/2,r+i/2),P(a+o/2,r+i/2))-.3,c=Math.cos(s),u=Math.sin(s),d=(e,t,o,i)=>(i[0]=a+e*c+o*u,i[1]=h+t,i[2]=r-e*u+o*c,i),f=[k(),k(),k(),k()],m=o/2,v=i/2,p=n+.3,g=p+.36*o,x=16*(n>=2.25);for(let[t,a,r,o,i]of[[-m,-v,m,-v,0],[m,-v,m,v,1],[m,v,-m,v,2],[-m,v,-m,-v,3]]){let n=Math.hypot(r-t,o-a),s=8*(n>=2.6);d(t,0,a,f[0]),d(r,0,o,f[1]),d(r,p,o,f[2]),d(t,p,a,f[3]),e.face(f[0],f[1],f[2],f[3],5,[.75,.75,1,1],[-n/2,.3,n/2,.3,n/2,p,-n/2,p],32*l+x+s+i)}for(let t of[1,-1]){let a=t*m,r=d(a,p,-v*t,k()),o=d(a,p,v*t,k()),i=d(a,g,0,k()),n=t*c,s=-t*u,h=e.vert(r[0],r[1],r[2],n,0,s,5,1,-v,0,32*l+4),f=e.vert(o[0],o[1],o[2],n,0,s,5,1,v,0,32*l+4),x=e.vert(i[0],i[1],i[2],n,0,s,5,1,0,g-p,32*l+4);e.tri(h,f,x)}for(let t of[1,-1])d(-m-.22,p-.12,t*(v+.22),f[0]),d(m+.22,p-.12,t*(v+.22),f[1]),d(m+.22,g,0,f[2]),d(-m-.22,g,0,f[3]),t<0?e.face(f[0],f[1],f[2],f[3],6,[.8,.8,1,1],[0,0,1,0,1,1,0,1],l):e.face(f[1],f[0],f[3],f[2],6,[.8,.8,1,1],[0,0,1,0,1,1,0,1],l);let w=.55*m,y=[k(),k(),k(),k()],b=g-.5,M=g+.55,T=[[w-.18,-.36],[w+.18,-.36],[w+.18,0],[w-.18,0]];for(let t=0;t<4;t++){let[a,r]=T[t],[o,i]=T[(t+1)%4];d(a,b,r,y[0]),d(o,b,i,y[1]),d(o,M,i,y[2]),d(a,M,r,y[3]),e.face(y[0],y[1],y[2],y[3],6,[1,1,1,1],[0,0,1,0,1,1,0,1],l)}}(t,e);return!function(e,t){let a=(0,i.seededRandom)(3150),r=0;for(let o=0;o<30*t&&r<t;o++){let t=10+95*a(),o=.5>a()?-1:1,i=R(t)+o*(F(t)+(a()-.35)*3.2),n=P(i,t);if(n>1.2||n<-.9)continue;let s=.35+a()*a()*1.2,l=e.n,h=a()*Math.PI,c=.55+.25*a(),u=[];for(let a=0;a<=3;a++){let o=a/3*(Math.PI/2);for(let l=0;l<6;l++){let d=h+l/6*Math.PI*2,f=s*Math.cos(o)*(.8+.4*b(l,a,r)),m=i+Math.cos(d)*f,v=t+Math.sin(d)*f*.85,p=n-.25+Math.sin(o)*s*c,g=Math.cos(d)*Math.cos(o),x=Math.sin(o)+.2,w=Math.sin(d)*Math.cos(o),y=Math.hypot(g,x,w);u.push(e.vert(m,p,v,g/y,x/y,w/y,7,.65+a/3*.35,i,t,r))}}for(let t=0;t<3;t++)for(let a=0;a<6;a++){let r=l+6*t+a,o=l+6*t+(a+1)%6;e.quad(r,o,o+6,r+6)}r++}}(t,a?14:30),{vertices:new Float32Array(t.v),indices:new Uint32Array(t.i)}}(e),trees:function(e){let t=(0,i.seededRandom)(40465),a=[],r="tile"===e?4.6:3.3;for(let e=12;e<245;e+=r*(1+e/260)){let o=C(e)-2;for(let i=-o;i<o;i+=r*(1+e/260)){let o=i+(t()-.5)*r*1.1,n=e+(t()-.5)*r*1.1,s=P(o,n);if(function(e,t,a,r){if(a<.75)return!0;let[o,i]=y(e,t,A);if(o>-6&&o<104.8&&7>Math.abs(i)||(10>Math.abs(o)||10>Math.abs(o-98.8))&&11>Math.abs(i))return!0;for(let a of z)if(3.6>Math.hypot(e-a.x,t-a.z))return!0;let n=Math.abs(e-R(t));return!!(t>30&&t<100&&n<24&&r()>.06)}(o,n,s,t)||Math.hypot(P(o+1,n)-P(o-1,n),P(o,n+1)-P(o,n-1))/2>1.25)continue;let l=Math.abs(o-R(n))-F(n),h=M(.045*o,.045*n,3,101),c=T(4,16,l)*(.3+.85*T(.38,.62,h));if(c*=(1-.75*T(30,52,s))*(.35+.65*T(28,70,n)),t()>c)continue;let u=(.5+.42*t())*(.9+.2*T(0,30,l));a.push(o,s-.25,n,u,t()*Math.PI*2,t(),(t()-.5)*.08,t())}}for(let[e,r,o]of[[-36,47,1.1],[-31,52,.8],[37.5,50,1.15],[32.5,55,.78]]){let i=P(e,r);i<.6||a.push(e,i-.25,r,o,t()*Math.PI*2,t(),(t()-.5)*.05,t())}return{data:new Float32Array(a),count:a.length/8}}(e)},Q.set(e,r)),J??=function(){let e=[],t=[],a=0,r=(t,r,o,i,n,s,l)=>{let h=Math.hypot(i,n,s)||1;return e.push(t,r,o,i/h,n/h,s/h,l,r/6.4),a++};for(let e=0;e<5;e++){let a=e/5*Math.PI*2,o=(e+1)/5*Math.PI*2,i=r(.17*Math.cos(a),0,.17*Math.sin(a),Math.cos(a),0,Math.sin(a),1),n=r(.17*Math.cos(o),0,.17*Math.sin(o),Math.cos(o),0,Math.sin(o),1),s=r(.17*Math.cos(o)*.7,1.9,.17*Math.sin(o)*.7,Math.cos(o),0,Math.sin(o),1),l=r(.17*Math.cos(a)*.7,1.9,.17*Math.sin(a)*.7,Math.cos(a),0,Math.sin(a),1);t.push(i,s,n,i,l,s)}let o=[[.85,3,1.2],[1.85,3.85,.98],[2.8,4.7,.76],[3.7,5.55,.54],[4.55,6.4,.33]];for(let e=0;e<o.length;e++){let[a,i,n]=o[e],s=.45*e;for(let e=0;e<7;e++){let o=s+e/7*Math.PI*2,l=s+(e+1)/7*Math.PI*2,h=(o+l)/2,c=a-.12,u=a-.12,d=n/(i-a)*.9+.35,f=r(Math.cos(o)*n,c,Math.sin(o)*n,Math.cos(o),d,Math.sin(o),0),m=r(Math.cos(l)*n,u,Math.sin(l)*n,Math.cos(l),d,Math.sin(l),0),v=r(0,i,0,Math.cos(h),d+.6,Math.sin(h),0);t.push(f,v,m);let p=r(Math.cos(o)*n,c,Math.sin(o)*n,.3*Math.cos(o),-1,.3*Math.sin(o),0),g=r(Math.cos(l)*n,u,Math.sin(l)*n,.3*Math.cos(l),-1,.3*Math.sin(l),0),x=r(0,a+.45,0,0,-1,0,0);t.push(p,g,x)}}return{vertices:new Float32Array(e),indices:new Uint32Array(t)}}(),ee??=function(){let e=[],t=[],a=e=>({x:e,top:2.12,half:.75,sill:.95});B([a(-4.9),a(-2.45),a(0),a(2.45),a(4.9)],e,t,!1);let r=t.length,o=e.length;B([a(-4.9),a(0),a(4.9-1.9),{x:4.9-1.1,top:2.02,half:.75,sill:.95},{x:4.9-.55,top:1.78,half:.72,sill:.95},{x:4.75,top:1.48,half:.66,sill:.95},{x:4.9,top:1.3,half:.6,sill:.95}],e,t,!0);for(let t=o;t<e.length;t+=9){let a=e[t],r=e[t+1],o=e[t+6];a>4.9-1.15&&a<4.9-.1&&r>1.25&&(1===o||0===o)&&(e[t+6]=4)}return{vertices:new Float32Array(e),indices:new Uint32Array(t),coach:[0,r],engine:[r,t.length-r]}}(),et??=(t=-C(262),new Float32Array([t,0,1,a=C(262),0,1,a,0,262,t,0,1,a,0,262,t,0,262])),{...r,pine:J,cars:ee,water:et}}(t);this.vaoStatic=l(),e.bindVertexArray(this.vaoStatic),n(e.ARRAY_BUFFER,c.vertices,e.STATIC_DRAW),h(0,3,11,0),h(1,3,11,3),h(2,1,11,6),h(3,4,11,7),n(e.ELEMENT_ARRAY_BUFFER,c.indices,e.STATIC_DRAW),this.staticCount=c.indices.length,this.vaoTree=l(),e.bindVertexArray(this.vaoTree),n(e.ARRAY_BUFFER,f.vertices,e.STATIC_DRAW),h(0,3,8,0),h(1,3,8,3),h(2,1,8,6),h(3,1,8,7),n(e.ARRAY_BUFFER,d.data,e.STATIC_DRAW),h(4,4,8,0,1),h(5,4,8,4,1),n(e.ELEMENT_ARRAY_BUFFER,f.indices,e.STATIC_DRAW),this.treeIndexCount=f.indices.length,this.treeCount=d.count,this.vaoCar=l(),e.bindVertexArray(this.vaoCar),n(e.ARRAY_BUFFER,m.vertices,e.STATIC_DRAW),h(0,3,9,0),h(1,3,9,3),h(2,1,9,6),h(3,2,9,7),this.carInstances=n(e.ARRAY_BUFFER,this.carStaging,e.DYNAMIC_DRAW),h(4,4,12,0,1),h(5,4,12,4,1),h(6,4,12,8,1),n(e.ELEMENT_ARRAY_BUFFER,m.indices,e.STATIC_DRAW),this.coachRange=m.coach,this.engineRange=m.engine,this.vaoWater=l(),e.bindVertexArray(this.vaoWater),n(e.ARRAY_BUFFER,v,e.STATIC_DRAW),h(0,3,3,0),this.vaoEmpty=l(),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null),this.shadowSize="stage"===t?2048:1024;const E=()=>{let t=e.createTexture(),a=e.createFramebuffer();if(!t||!a)throw Error("night-train: no shadow map");return e.bindTexture(e.TEXTURE_2D,t),e.texStorage2D(e.TEXTURE_2D,1,e.DEPTH_COMPONENT24,this.shadowSize,this.shadowSize),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_COMPARE_FUNC,e.LEQUAL),e.bindFramebuffer(e.FRAMEBUFFER,a),e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,t,0),e.drawBuffers([e.NONE]),e.readBuffer(e.NONE),e.bindFramebuffer(e.FRAMEBUFFER,null),{tex:t,fbo:a}},j=E(),V=E();this.shadowTex=j.tex,this.shadowFbo=j.fbo,this.trainShadowTex=V.tex,this.trainShadowFbo=V.fbo}colorTexture(e,t){let a=this.gl,r=a.createTexture();if(!r)throw Error("night-train: no texture");return a.bindTexture(a.TEXTURE_2D,r),a.texStorage2D(a.TEXTURE_2D,1,this.hdr?a.RGBA16F:a.RGBA8,e,t),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),r}target(e,t){let a=this.gl,r=this.colorTexture(e,t),o=a.createFramebuffer();if(!o)throw Error("night-train: no framebuffer");return a.bindFramebuffer(a.FRAMEBUFFER,o),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,r,0),a.bindFramebuffer(a.FRAMEBUFFER,null),{tex:r,fbo:o,w:e,h:t}}freeTarget(e){e&&(this.gl.deleteTexture(e.tex),this.gl.deleteFramebuffer(e.fbo))}freeTargets(){let e=this.gl;for(let e of(this.freeTarget(this.scene),this.freeTarget(this.mirror),this.freeTarget(this.beam),this.down))this.freeTarget(e);for(let e of this.up)this.freeTarget(e);this.down=[],this.up=[],this.sceneDepth&&e.deleteTexture(this.sceneDepth),this.mirrorDepth&&e.deleteRenderbuffer(this.mirrorDepth),this.msFbo&&e.deleteFramebuffer(this.msFbo),this.msColor&&e.deleteRenderbuffer(this.msColor),this.msDepth&&e.deleteRenderbuffer(this.msDepth),this.scene=this.mirror=this.beam=null,this.sceneDepth=null,this.mirrorDepth=null,this.msFbo=null,this.msColor=this.msDepth=null}setSize(e,t){let a=this.gl;if(e=Math.max(4,Math.round(e)),t=Math.max(4,Math.round(t)),e===this.w&&t===this.h&&this.scene)return;this.w=e,this.h=t,this.freeTargets(),this.scene=this.target(e,t);let r=a.createTexture();if(!r)throw Error("night-train: no depth texture");if(a.bindTexture(a.TEXTURE_2D,r),a.texStorage2D(a.TEXTURE_2D,1,a.DEPTH_COMPONENT24,e,t),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.NEAREST),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.NEAREST),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),a.bindFramebuffer(a.FRAMEBUFFER,this.scene.fbo),a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,r,0),this.sceneDepth=r,this.samples>1){let r=a.createFramebuffer(),o=a.createRenderbuffer(),i=a.createRenderbuffer();r&&o&&i&&(a.bindRenderbuffer(a.RENDERBUFFER,o),a.renderbufferStorageMultisample(a.RENDERBUFFER,this.samples,this.hdr?a.RGBA16F:a.RGBA8,e,t),a.bindRenderbuffer(a.RENDERBUFFER,i),a.renderbufferStorageMultisample(a.RENDERBUFFER,this.samples,a.DEPTH_COMPONENT24,e,t),a.bindFramebuffer(a.FRAMEBUFFER,r),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.RENDERBUFFER,o),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.RENDERBUFFER,i),a.checkFramebufferStatus(a.FRAMEBUFFER)===a.FRAMEBUFFER_COMPLETE?(this.msFbo=r,this.msColor=o,this.msDepth=i):(a.deleteFramebuffer(r),a.deleteRenderbuffer(o),a.deleteRenderbuffer(i)),a.bindRenderbuffer(a.RENDERBUFFER,null))}let o=Math.max(2,Math.round(e/2)),i=Math.max(2,Math.round(t/2));this.mirror=this.target(o,i);let n=a.createRenderbuffer();if(!n)throw Error("night-train: no renderbuffer");a.bindRenderbuffer(a.RENDERBUFFER,n),a.renderbufferStorage(a.RENDERBUFFER,a.DEPTH_COMPONENT24,o,i),a.bindFramebuffer(a.FRAMEBUFFER,this.mirror.fbo),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.RENDERBUFFER,n),a.bindRenderbuffer(a.RENDERBUFFER,null),this.mirrorDepth=n,this.beam=this.target(o,i);let s="stage"===this.mode?6:4,l=o,h=i;for(let e=0;e<s;e++)this.down.push(this.target(l,h)),this.up.push(this.target(l,h)),l=Math.max(1,Math.round(l/2)),h=Math.max(1,Math.round(h/2));a.bindFramebuffer(a.FRAMEBUFFER,null)}get width(){return this.w}get height(){return this.h}u(e,t){let a=this.loc.get(e);return a||(a=new Map,this.loc.set(e,a)),a.has(t)||a.set(t,this.gl.getUniformLocation(e,t)),a.get(t)??null}fitShadow(e){var t,a,r,o,i,n,s;let l=(ea+er)/2,h=(eo+ei)/2,c=(en+es)/2,u=[l+400*e[0],h+400*e[1],c+400*e[2]],d=Math.abs(e[1])>.95?[0,0,1]:[0,1,0];f(this.lightView,u,[l,h,c],d);let v=1/0,p=1/0,g=1/0,x=-1/0,w=-1/0,y=-1/0,b=this.lightView;for(let e=0;e<8;e++){let t=1&e?er:ea,a=2&e?ei:eo,r=4&e?es:en,o=b[0]*t+b[4]*a+b[8]*r+b[12],i=b[1]*t+b[5]*a+b[9]*r+b[13],n=b[2]*t+b[6]*a+b[10]*r+b[14];v=Math.min(v,o),x=Math.max(x,o),p=Math.min(p,i),w=Math.max(w,i),g=Math.min(g,n),y=Math.max(y,n)}t=this.lightProj,a=v,r=x,o=p,i=w,n=-y-5,s=-g+5,t.fill(0),t[0]=2/(r-a),t[5]=2/(i-o),t[10]=-2/(s-n),t[12]=-(r+a)/(r-a),t[13]=-(i+o)/(i-o),t[14]=-(s+n)/(s-n),t[15]=1,m(this.lightVP,this.lightProj,this.lightView),this.shadowTexel=Math.max(x-v,w-p)/this.shadowSize}writeBlock(e,t,a,r,o){let i=this.data,n=t.light,s=t.timetable;"shadow"===a?i.set(this.lightVP,0):i.set(t.viewProj,0),i.set(t.invViewProj,16),i.set(this.lightVP,32);let l=(e,t,a,r,o)=>{i[e]=t,i[e+1]=a,i[e+2]=r,i[e+3]=o},h="mirror"===a?-t.eye[1]:t.eye[1];l(48,t.eye[0],h,t.eye[2],t.time),l(52,r[0],r[1],r[2],this.shadowTexel),l(56,o[0],o[1],o[2],+("mirror"===a)),l(60,n.sunDir[0],n.sunDir[1],n.sunDir[2],t.sunScale),l(64,n.sun[0],n.sun[1],n.sun[2],n.el),l(68,n.moonDir[0],n.moonDir[1],n.moonDir[2],n.night),l(72,n.moon[0],n.moon[1],n.moon[2],n.dark),l(76,n.zenith[0],n.zenith[1],n.zenith[2],n.stars),l(80,n.horizon[0],n.horizon[1],n.horizon[2],n.mist),l(84,n.glow[0],n.glow[1],n.glow[2],n.density),l(88,n.skyAmb[0],n.skyAmb[1],n.skyAmb[2],t.windows),l(92,n.groundAmb[0],n.groundAmb[1],n.groundAmb[2],"mirror"===a?2*t.pixelAngle:t.pixelAngle),l(96,n.haze[0],n.haze[1],n.haze[2],t.drift),l(100,n.cloudLit[0],n.cloudLit[1],n.cloudLit[2],"shadow"===a?0:t.motion),l(104,n.cloudShade[0],n.cloudShade[1],n.cloudShade[2],0),l(108,s.headPos[0],s.headPos[1],s.headPos[2],s.head),l(112,s.headDir[0],s.headDir[1],s.headDir[2],0),l(116,s.head2Pos[0],s.head2Pos[1],s.head2Pos[2],s.head2),l(120,s.head2Dir[0],s.head2Dir[1],s.head2Dir[2],0);let c=Math.min(8,s.carLightCount);i.fill(0,124,156);for(let e=0;e<4*c;e++)i[124+e]=s.carLights[e]*(e%4==3?t.trainGlow:1);l(156,c,t.trainGlow,0,0);let u=this.gl;u.bindBuffer(u.UNIFORM_BUFFER,e),u.bufferSubData(u.UNIFORM_BUFFER,0,i)}uploadCars(e){let t=e.instances,a=this.carStaging,r=0,o=0;for(let i=0;i<2;i++){for(let r=0;r<e.instanceCount;r++)if(0===i==t[12*r+7]<.5){for(let e=0;e<12;e++)a[12*o+e]=t[12*r+e];o++}0===i&&(r=o)}let i=this.gl;return i.bindBuffer(i.ARRAY_BUFFER,this.carInstances),i.bufferSubData(i.ARRAY_BUFFER,0,a,0,12*Math.max(1,o)),i.bindBuffer(i.ARRAY_BUFFER,null),[r,o-r]}drawCars(e,t){let a=this.gl;if(!e&&!t)return;a.bindVertexArray(this.vaoCar),a.bindBuffer(a.ARRAY_BUFFER,this.carInstances);let r=e=>{let t=12*e*4;a.vertexAttribPointer(4,4,a.FLOAT,!1,48,t),a.vertexAttribPointer(5,4,a.FLOAT,!1,48,t+16),a.vertexAttribPointer(6,4,a.FLOAT,!1,48,t+32)};e&&(r(0),a.drawElementsInstanced(a.TRIANGLES,this.engineRange[1],a.UNSIGNED_INT,4*this.engineRange[0],e)),t&&(r(e),a.drawElementsInstanced(a.TRIANGLES,this.coachRange[1],a.UNSIGNED_INT,4*this.coachRange[0],t)),r(0),a.bindBuffer(a.ARRAY_BUFFER,null)}drawScenery(e,t,a=!0,r=!0){let o=this.gl;if(!a){o.useProgram(e?this.pCarDepth:this.pCar),e||o.uniform1i(this.u(this.pCar,"uShadow"),1),this.drawCars(t[0],t[1]);return}o.useProgram(e?this.pStaticDepth:this.pStatic),e||o.uniform1i(this.u(this.pStatic,"uShadow"),1),o.bindVertexArray(this.vaoStatic),o.drawElements(o.TRIANGLES,this.staticCount,o.UNSIGNED_INT,0),o.useProgram(e?this.pTreeDepth:this.pTree),e||o.uniform1i(this.u(this.pTree,"uShadow"),1),o.bindVertexArray(this.vaoTree),o.drawElementsInstanced(o.TRIANGLES,this.treeIndexCount,o.UNSIGNED_INT,0,this.treeCount),r&&(o.useProgram(e?this.pCarDepth:this.pCar),e||o.uniform1i(this.u(this.pCar,"uShadow"),1),this.drawCars(t[0],t[1]))}drawSky(){let e=this.gl;e.disable(e.DEPTH_TEST),e.depthMask(!1),e.useProgram(this.pSky),e.bindVertexArray(this.vaoEmpty),e.drawArrays(e.TRIANGLES,0,3),e.enable(e.DEPTH_TEST),e.depthMask(!0)}fullscreen(e,t,a){let r=this.gl;r.bindFramebuffer(r.FRAMEBUFFER,e?e.fbo:null),r.viewport(0,0,t,a),r.bindVertexArray(this.vaoEmpty),r.drawArrays(r.TRIANGLES,0,3)}draw(e,t,a,r){let o=this.gl,i=this.scene,n=this.mirror;if(!i||!n||!this.beam||!this.sceneDepth)return;let s=e.light,l=e.timetable,h=s.el>-.9,c=h?s.sunDir:s.moonDir,u=h?s.sun:s.moon,d=Math.abs(c[0]-this.lastKey[0])>1e-4||Math.abs(c[1]-this.lastKey[1])>1e-4||Math.abs(c[2]-this.lastKey[2])>1e-4;d&&(this.lastKey[0]=c[0],this.lastKey[1]=c[1],this.lastKey[2]=c[2],this.fitShadow(c));let f=this.uploadCars(l),m=f[0]+f[1]>0;o.disable(o.BLEND),o.disable(o.CULL_FACE),o.enable(o.DEPTH_TEST),o.depthFunc(o.LEQUAL);let v=this.shadowSize;(d||!this.shadowFresh)&&(this.writeBlock(this.ubo.shadow,e,"shadow",c,u),o.bindBufferBase(o.UNIFORM_BUFFER,0,this.ubo.shadow),o.bindFramebuffer(o.FRAMEBUFFER,this.shadowFbo),o.viewport(0,0,v,v),o.clear(o.DEPTH_BUFFER_BIT),o.enable(o.POLYGON_OFFSET_FILL),o.polygonOffset(1.6,3),this.drawScenery(!0,f,!0,!1),o.disable(o.POLYGON_OFFSET_FILL),this.shadowFresh=!0);let p=this.shadowTex;m&&(o.bindFramebuffer(o.READ_FRAMEBUFFER,this.shadowFbo),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,this.trainShadowFbo),o.blitFramebuffer(0,0,v,v,0,0,v,v,o.DEPTH_BUFFER_BIT,o.NEAREST),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null),d||this.writeBlock(this.ubo.shadow,e,"shadow",c,u),o.bindBufferBase(o.UNIFORM_BUFFER,0,this.ubo.shadow),o.bindFramebuffer(o.FRAMEBUFFER,this.trainShadowFbo),o.viewport(0,0,v,v),o.enable(o.POLYGON_OFFSET_FILL),o.polygonOffset(1.6,3),this.drawScenery(!0,f,!1,!0),o.disable(o.POLYGON_OFFSET_FILL),p=this.trainShadowTex),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,p),o.activeTexture(o.TEXTURE0),this.writeBlock(this.ubo.mirror,e,"mirror",c,u),o.bindBufferBase(o.UNIFORM_BUFFER,0,this.ubo.mirror),o.bindFramebuffer(o.FRAMEBUFFER,n.fbo),o.viewport(0,0,n.w,n.h),o.clear(o.DEPTH_BUFFER_BIT),this.drawSky(),this.drawScenery(!1,f),this.writeBlock(this.ubo.main,e,"main",c,u),o.bindBufferBase(o.UNIFORM_BUFFER,0,this.ubo.main),o.bindFramebuffer(o.FRAMEBUFFER,this.msFbo??i.fbo),o.viewport(0,0,this.w,this.h),o.clear(o.DEPTH_BUFFER_BIT),this.drawSky(),this.drawScenery(!1,f),o.useProgram(this.pWater),o.uniform1i(this.u(this.pWater,"uShadow"),1),o.uniform1i(this.u(this.pWater,"uMirror"),2),o.uniform2f(this.u(this.pWater,"uViewport"),this.w,this.h),o.activeTexture(o.TEXTURE2),o.bindTexture(o.TEXTURE_2D,n.tex),o.activeTexture(o.TEXTURE0),o.bindVertexArray(this.vaoWater),o.drawArrays(o.TRIANGLES,0,6),this.msFbo&&(o.bindFramebuffer(o.READ_FRAMEBUFFER,this.msFbo),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,i.fbo),o.blitFramebuffer(0,0,this.w,this.h,0,0,this.w,this.h,o.COLOR_BUFFER_BIT|o.DEPTH_BUFFER_BIT,o.NEAREST),o.bindFramebuffer(o.READ_FRAMEBUFFER,null),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,null)),o.disable(o.DEPTH_TEST),o.activeTexture(o.TEXTURE2),o.bindTexture(o.TEXTURE_2D,null),o.activeTexture(o.TEXTURE0);let g=r&&(l.head>0||l.head2>0)&&s.dark>.01;g&&(o.useProgram(this.pBeam),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.sceneDepth),o.uniform1i(this.u(this.pBeam,"uDepth"),0),this.fullscreen(this.beam,this.beam.w,this.beam.h)),o.useProgram(this.pDown),o.uniform1i(this.u(this.pDown,"uSrc"),0);let x=i;for(let e=0;e<this.down.length;e++){let t=this.down[e];o.bindTexture(o.TEXTURE_2D,x.tex),o.uniform2f(this.u(this.pDown,"uTexel"),1/x.w,1/x.h),o.uniform1f(this.u(this.pDown,"uFirst"),+(0===e)),o.uniform1f(this.u(this.pDown,"uThreshold"),1.05/s.exposure),this.fullscreen(t,t.w,t.h),x=t}o.useProgram(this.pUp),o.uniform1i(this.u(this.pUp,"uSrc"),0),o.uniform1i(this.u(this.pUp,"uBase"),1);let w=this.down.length-1,y=this.down[w];for(let e=w-1;e>=0;e--){let t=this.up[e];o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,this.down[e].tex),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,y.tex),o.uniform2f(this.u(this.pUp,"uTexel"),1/y.w,1/y.h),o.uniform1f(this.u(this.pUp,"uWeight"),1),this.fullscreen(t,t.w,t.h),y=t}o.useProgram(this.pFinal),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,i.tex),o.activeTexture(o.TEXTURE1),o.bindTexture(o.TEXTURE_2D,y.tex),o.activeTexture(o.TEXTURE2),o.bindTexture(o.TEXTURE_2D,this.beam.tex),o.activeTexture(o.TEXTURE0),o.uniform1i(this.u(this.pFinal,"uScene"),0),o.uniform1i(this.u(this.pFinal,"uBloom"),1),o.uniform1i(this.u(this.pFinal,"uBeam"),2),o.uniform1f(this.u(this.pFinal,"uExposure"),s.exposure),o.uniform1f(this.u(this.pFinal,"uBloomMix"),e.bloom/this.down.length),o.uniform1f(this.u(this.pFinal,"uTime"),e.time),o.uniform1f(this.u(this.pFinal,"uGrain"),e.grain),o.uniform1f(this.u(this.pFinal,"uBeamOn"),+!!g);let b=.0018*s.night;o.uniform3f(this.u(this.pFinal,"uLift"),.8*b,.95*b,1.4*b),this.fullscreen(null,t,a);for(let e=2;e>=0;e--)o.activeTexture(o.TEXTURE0+e),o.bindTexture(o.TEXTURE_2D,null);o.bindVertexArray(null),o.bindBufferBase(o.UNIFORM_BUFFER,0,null)}dispose(){let e=this.gl;for(let t of(this.freeTargets(),e.deleteTexture(this.shadowTex),e.deleteFramebuffer(this.shadowFbo),e.deleteTexture(this.trainShadowTex),e.deleteFramebuffer(this.trainShadowFbo),this.programs))e.deleteProgram(t);for(let t of this.buffers)e.deleteBuffer(t);e.deleteVertexArray(this.vaoStatic),e.deleteVertexArray(this.vaoTree),e.deleteVertexArray(this.vaoCar),e.deleteVertexArray(this.vaoWater),e.deleteVertexArray(this.vaoEmpty)}}let ec=v([16,17.5,19,19.8,20.35,21,22,23,24],[21,14,6.5,3,0,-3.1,-8,-13,-17]),eu=v([16,18,19.2,19.75,20.35,22,24],[-28,-14,-4.5,-.5,1.4,7,12]),ed=(e,t,a,r,o,i,n,s,l,h,c,u)=>({el:e,zenith:t,horizon:a,glow:r,sun:o,skyAmb:i,groundAmb:n,haze:s,density:l,cloudLit:h,cloudShade:c,exposure:u}),ef=[ed(24,[.1,.27,.72],[.55,.7,.9],[.5,.42,.3],[3.3,3.05,2.75],[.3,.42,.66],[.15,.16,.11],[.56,.68,.86],.0012,[1.5,1.48,1.44],[.5,.56,.7],.9),ed(12,[.1,.24,.62],[.66,.72,.8],[.95,.62,.34],[3.25,2.8,2.2],[.27,.36,.55],[.16,.14,.09],[.66,.68,.72],.0013,[1.6,1.45,1.2],[.48,.5,.62],.92),ed(6,[.1,.2,.48],[1.05,.66,.36],[1.9,.86,.32],[3.1,2.05,1.05],[.23,.27,.42],[.18,.12,.07],[.9,.62,.42],.0015,[1.85,1.2,.66],[.42,.36,.44],.95),ed(2.5,[.09,.15,.38],[1.2,.52,.2],[2.5,.8,.2],[2.6,1.25,.42],[.19,.2,.33],[.17,.09,.05],[.95,.5,.3],.0017,[2.1,.92,.42],[.4,.27,.32],1),ed(0,[.08,.11,.3],[1,.36,.14],[1.8,.42,.12],[1.1,.4,.12],[.15,.14,.26],[.11,.06,.04],[.72,.36,.26],.0018,[1.6,.52,.3],[.3,.18,.26],1.12),ed(-2.5,[.045,.065,.2],[.55,.25,.2],[.75,.25,.12],[0,0,0],[.1,.1,.19],[.045,.036,.042],[.3,.22,.29],.0016,[.85,.36,.32],[.14,.1,.18],1.3),ed(-5,[.026,.04,.14],[.22,.14,.21],[.28,.11,.1],[0,0,0],[.065,.068,.14],[.026,.024,.032],[.13,.115,.19],.0015,[.36,.19,.25],[.07,.06,.12],1.48),ed(-8,[.012,.021,.075],[.075,.07,.15],[.06,.04,.055],[0,0,0],[.038,.043,.088],[.014,.013,.02],[.065,.065,.12],.0015,[.1,.09,.14],[.03,.03,.065],1.8),ed(-12,[.005,.009,.034],[.03,.035,.07],[.01,.01,.015],[0,0,0],[.024,.028,.056],[.009,.009,.013],[.03,.035,.062],.0015,[.045,.05,.075],[.015,.017,.035],2.25),ed(-17,[.003,.0055,.02],[.017,.022,.046],[0,0,0],[0,0,0],[.019,.023,.046],[.007,.007,.011],[.019,.024,.045],.0014,[.036,.04,.06],[.012,.014,.028],2.4)],em=()=>[0,0,0],ev=(e,t,a)=>{let r=Math.min(1,Math.max(0,(a-e)/(t-e)));return r*r*(3-2*r)};function ep(e,t,a,r){e[0]=t[0]+(a[0]-t[0])*r,e[1]=t[1]+(a[1]-t[1])*r,e[2]=t[2]+(a[2]-t[2])*r}function eg(e){return e>=9?"Afternoon":e>=1?"Golden hour":e>=-1.2?"Sunset":e>=-5?"Dusk":e>=-9.5?"Blue hour":"Night"}function ex(e){let t=Math.round(60*e),a=Math.floor(t/60)%24;return`${String(a).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`}function ew(e,t){if("function"!=typeof e.createStereoPanner)return null;let a=e.createStereoPanner();return a.pan.value=Math.max(-.85,Math.min(.85,t)),a}function ey(e,t,a){let{ctx:r,output:o}=e,i=r.currentTime+a,n=ew(r,.7*t),s=n?(n.connect(o),n):o,l=r.createBiquadFilter();l.type="lowpass",l.frequency.value=1150,l.Q.value=.6;let h=r.createGain();h.gain.value=.11,l.connect(h).connect(s);let c=r.createDelay(1);c.delayTime.value=.27;let u=r.createBiquadFilter();u.type="lowpass",u.frequency.value=650;let d=r.createGain();d.gain.value=.045;let f=r.createGain();for(let[e,t,a]of(f.gain.value=.32,l.connect(c),c.connect(u).connect(d).connect(o),u.connect(f).connect(c),[[0,.46,370],[.52,.7,311]])){let o=i+e,n=r.createGain();for(let e of(n.gain.setValueAtTime(0,o),n.gain.linearRampToValueAtTime(1,o+.07),n.gain.setValueAtTime(1,o+t-.12),n.gain.linearRampToValueAtTime(0,o+t),n.connect(l),[-6,5])){let i=r.createOscillator();i.type="sawtooth",i.frequency.setValueAtTime(1.012*a,o),i.frequency.exponentialRampToValueAtTime(a,o+.12),i.detune.value=e;let s=r.createGain();s.gain.value=.5,i.connect(s).connect(n),i.start(o),i.stop(o+t+.05)}let s=r.createOscillator();s.type="square",s.frequency.value=.5*a;let h=r.createGain();h.gain.value=.12,s.connect(h).connect(n),s.start(o),s.stop(o+t+.05)}window.setTimeout(()=>{try{f.disconnect(),c.disconnect(),n?.disconnect()}catch{}},(a+3.5)*1e3)}class eb{kit=null;nodes=[];sources=[];river=null;rumble=null;rumbleTone=null;rumblePan=null;nextChirp=0;playing=!1;start(e){if(this.playing)return;this.kit=e;let{ctx:t,output:a}=e,r=t.currentTime,i=(0,o.noiseBuffer)(t,2),n=t.createBufferSource();n.buffer=i,n.loop=!0;let s=t.createBiquadFilter();s.type="lowpass",s.frequency.value=520;let l=t.createBiquadFilter();l.type="highpass",l.frequency.value=90;let h=t.createGain();h.gain.setValueAtTime(0,r),h.gain.linearRampToValueAtTime(.016,r+2.5),n.connect(s).connect(l).connect(h).connect(a),n.start(r,Math.random());let c=t.createBufferSource();c.buffer=i,c.loop=!0,c.playbackRate.value=.7;let u=t.createBiquadFilter();u.type="lowpass",u.frequency.value=160,u.Q.value=.9;let d=t.createGain();d.gain.value=0;let f=ew(t,0);c.connect(u).connect(d),f?d.connect(f).connect(a):d.connect(a),c.start(r,Math.random()),this.river=h,this.rumble=d,this.rumbleTone=u,this.rumblePan=f,this.sources=[n,c],this.nodes=[s,l,h,u,d,...f?[f]:[]],this.nextChirp=r+1,this.playing=!0}update(e,t,a){let r=this.kit;if(!this.playing||!r)return;let{ctx:o,output:i}=r,n=o.currentTime;if(this.rumble?.gain.setTargetAtTime(.11*e,n,.12),this.rumbleTone?.frequency.setTargetAtTime(120+160*e,n,.2),this.rumblePan?.pan.setTargetAtTime(Math.max(-.8,Math.min(.8,t)),n,.15),a>.25&&n>=this.nextChirp){let e=2+Math.floor(3*Math.random()),t=4300+600*Math.random(),r=ew(o,1.6*Math.random()-.8),s=r?(r.connect(i),r):i,l=.006*a*(.5+.5*Math.random());for(let a=0;a<e;a++){let e=n+.02+.045*a,r=o.createOscillator();r.type="sine",r.frequency.value=t;let i=o.createGain();i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(l,e+.006),i.gain.exponentialRampToValueAtTime(1e-4,e+.03),r.connect(i).connect(s),r.start(e),r.stop(e+.04)}this.nextChirp=n+.35+.9*Math.random()/(.4+a)}}stop(){if(!this.playing||!this.kit)return;let{ctx:e}=this.kit,t=e.currentTime;this.river?.gain.cancelScheduledValues(t),this.river?.gain.setTargetAtTime(0,t,.15),this.rumble?.gain.cancelScheduledValues(t),this.rumble?.gain.setTargetAtTime(0,t,.1);let a=this.sources,r=this.nodes;window.setTimeout(()=>{for(let e of a)try{e.stop(),e.disconnect()}catch{}for(let e of r)try{e.disconnect()}catch{}},700),this.sources=[],this.nodes=[],this.river=this.rumble=null,this.rumbleTone=null,this.rumblePan=null,this.playing=!1}}let eM=[0,1,0],eT=Math.PI/180,eE=[0,0,0],eR=[0,0,0];function eF(e,t,a){var r,o,i,n;let s,l,h;return d(eE,eu(t)*e.sunScale,ec(t)),r=e.viewProj,o=e.eye[0]+1e3*eE[0],i=e.eye[1]+1e3*eE[1],n=e.eye[2]+1e3*eE[2],l=0!==(s=r[3]*o+r[7]*i+r[11]*n+r[15])?1/s:0,eR[0]=(r[0]*o+r[4]*i+r[8]*n+r[12])*l,eR[1]=(r[1]*o+r[5]*i+r[9]*n+r[13])*l,eR[2]=(r[2]*o+r[6]*i+r[10]*n+r[14])*l,h=s,a.x=(.5*eR[0]+.5)*e.width,a.y=(.5-.5*eR[1])*e.height,h>0}let eA={x:0,y:0},eP={light:19.72,dark:22.55},eD={light:18.25,dark:20.2},ek={light:[19.05,20.75],dark:[22.05,23.4]},eC={light:20.15,dark:22.9},eS={stiffness:260,damping:31},e_={stiffness:40,damping:12.6},eU={stiffness:4.4,damping:4.2},ez={stiffness:36,damping:11},eB=[1,.8,.64];function eI({mode:e,theme:a}){let r="dark"===a,o=r?{top:"#0a0f22",low:"#29304f",far:"#151a2e",hill:"#0b0e18",stone:"#1d2030",water:"#0c1020",body:"#0d1430",win:"#ffc56e"}:{top:"#6d8cc0",low:"#f3b37a",far:"#9a8aa0",hill:"#3a4232",stone:"#8c8174",water:"#a88e7c",body:"#1b2648",win:"#e7b46a"},i=176/9,n=(176/9-3.6)/2,s="";for(let e=0;e<9;e++){let t=12+e*i+1.8,a=t+2*n;s+=`M${t.toFixed(2)} 78V${(50+n).toFixed(2)}A${n.toFixed(2)} ${n.toFixed(2)} 0 0 1 ${a.toFixed(2)} ${(50+n).toFixed(2)}V78Z`}let l=`M12 44H188V78H12Z${s}`,h=[0,1,2,3,4];return(0,t.jsxs)("svg",{role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A stone viaduct across a valley at evening, a train crossing it":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 size-full",viewBox:"0 0 200 120",preserveAspectRatio:"xMidYMid slice",children:[(0,t.jsxs)("defs",{children:[(0,t.jsxs)("linearGradient",{id:"nt-sky",x1:"0",y1:"0",x2:"0",y2:"1",children:[(0,t.jsx)("stop",{offset:"0",stopColor:o.top}),(0,t.jsx)("stop",{offset:"0.65",stopColor:o.low})]}),(0,t.jsxs)("linearGradient",{id:"nt-water",x1:"0",y1:"0",x2:"0",y2:"1",children:[(0,t.jsx)("stop",{offset:"0",stopColor:o.low,stopOpacity:r?.35:.55}),(0,t.jsx)("stop",{offset:"1",stopColor:o.water})]})]}),(0,t.jsx)("rect",{width:"200",height:"78",fill:"url(#nt-sky)"}),r?(0,t.jsx)("path",{d:"M58 20a4.5 4.5 0 1 0 4.2 6.1A3.6 3.6 0 0 1 58 20Z",fill:"#f2ead8"}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("circle",{cx:"100",cy:"58.5",r:"9",fill:"#ffd9a0",opacity:"0.35"}),(0,t.jsx)("circle",{cx:"100",cy:"58.5",r:"4",fill:"#fff4dc"})]}),(0,t.jsx)("path",{d:"M0 64 L40 50 L70 58 L90 64.5 L110 64.5 L132 52 L170 46 L200 54 V78 H0 Z",fill:o.far,opacity:"0.7"}),(0,t.jsx)("path",{d:"M0 44 L22 52 L34 70 L44 78 H0 Z M200 40 L178 50 L166 70 L156 78 H200 Z",fill:o.hill}),(0,t.jsxs)("g",{children:[(0,t.jsx)("path",{d:l,fill:o.stone,fillRule:"evenodd"}),(0,t.jsx)("rect",{x:11,y:"43",width:178,height:"1.6",fill:o.stone}),h.map(e=>(0,t.jsxs)("g",{children:[(0,t.jsx)("rect",{x:58+17*e,y:38.6,width:16,height:4.6,rx:1,fill:o.body}),[0,1,2,3,4,5].map(a=>(0,t.jsx)("rect",{x:59.6+17*e+2.4*a,y:39.7,width:1.5,height:1.5,rx:.2,fill:o.win,opacity:r?1:.55},a))]},e))]}),(0,t.jsx)("rect",{y:"78",width:"200",height:"42",fill:"url(#nt-water)"}),(0,t.jsxs)("g",{transform:"translate(0 156) scale(1 -1)",opacity:r?.32:.25,children:[(0,t.jsx)("path",{d:l,fill:o.stone,fillRule:"evenodd"}),r?h.map(e=>(0,t.jsx)("rect",{x:59+17*e,y:39.6,width:14,height:1.5,fill:o.win},e)):null]})]})}e.s(["default",0,function({mode:e,active:s,reducedMotion:u,theme:v}){let p="stage"===e,[g]=(0,a.useState)(()=>{var t,a,r;let o,n,s,l,h;return t=e,a=v,r=u,o="stage"===t,n=r?eP[a]:o?eD[a]:ek[a][0],s={hour:0,el:0,az:0,sunDir:em(),moonDir:em(),zenith:em(),horizon:em(),glow:em(),sun:em(),moon:em(),skyAmb:em(),groundAmb:em(),haze:em(),density:0,cloudLit:em(),cloudShade:em(),exposure:1,night:0,dark:0,stars:0,mist:0},l={viewProj:new Float32Array(16),invViewProj:new Float32Array(16),view:new Float32Array(16),proj:new Float32Array(16),eye:[0,2,12],target:[0,12,100],vHalf:.3,sunScale:1,width:1,height:1},h=new Z(o?7:11),{hour:new i.Spring(n,e_),goal:n,held:new i.Spring(0,{stiffness:380,damping:24}),eyeX:new i.Spring(0,ez),eyeY:new i.Spring(0,ez),drag:null,timetable:h,light:s,view:l,frame:{viewProj:l.viewProj,invViewProj:l.invViewProj,eye:l.eye,light:s,timetable:h,time:0,motion:+!r,drift:37,sunScale:1,windows:0,trainGlow:1,pixelAngle:.001,bloom:.5,grain:o?.022:.014},clock:0,drift:37,acc:0,tilePhase:0,hovering:!1,lastInput:-10,clear:o?15.3:3.2-.4,introPending:o&&!r,parked:!1,started:!1,renderStep:0,perf:{time:0,slow:0},scale:1,sun:{x:0,y:0},sunVisible:!1,minute:NaN,phase:"",night:-1>ec(n),handleX:NaN,handleY:NaN,handleOn:!1,theme:a,reduced:r,scratch:[0,0,0]}}),x=(0,a.useRef)(null),y=(0,a.useRef)(null),b=(0,a.useRef)(null),M=(0,a.useRef)(null),T=(0,a.useRef)(null),E=(0,a.useRef)(null),R=(0,a.useRef)(!1),F=(0,a.useId)(),A=(0,i.useFinePointer)(),P=(0,o.useMuted)(),[D,k]=(0,a.useState)(g.night),[C,S]=(0,a.useState)(!1),[_,U]=(0,a.useState)(!1),[z,B]=(0,a.useState)(""),[I,N]=(0,a.useState)(!0),L=(0,i.useLatest)({active:s,muted:P,stage:p}),j=(0,a.useCallback)(()=>{let e=x.current,{width:t,height:a,dpr:r}=$.current;if(!e||t<2||a<2)return;let o=Math.min(r,p?1.5:1.35)*(p?eB[g.renderStep]:1);e.setSize(t*o,a*o),g.scale=e.width/t,p&&N(t>=560)},[p]),V=(0,a.useCallback)(e=>{let t=g.timetable;if(g.reduced){let a=t.park();e&&B(a>0?"The next train stands on the viaduct, bound right.":"The next train stands on the viaduct, bound left."),K.current();return}let a=t.pending>0||t.visible,r=t.request();g.clear=0,p&&R.current&&function(e,t=.35){let a=(0,o.getAudio)();if(!(!a||(0,o.isMuted)())&&"closed"!==a.ctx.state){if("running"!==a.ctx.state)return a.ctx.resume().then(()=>{"running"!==a.ctx.state||(0,o.isMuted)()||ey(a,e,t)}).catch(()=>{});ey(a,e,t)}}(r>0?-1:1,a?.9:.35),p&&e&&B(a?"Another train is on its way; it will follow when the line is clear.":r>0?"A train is coming out of the tunnel on the left.":"A train is coming out of the tunnel on the right."),K.current()},[p]),X=(0,a.useCallback)(()=>{let e=L.current,t=e.stage&&R.current&&e.active&&!e.muted,a=E.current??=new eb;if(t){let e=(0,o.getAudio)();e&&"closed"!==e.ctx.state&&!a.playing&&a.start(e)}else a.playing&&a.stop()},[L]);(0,a.useEffect)(()=>{X()},[X,s,P]),(0,a.useEffect)(()=>()=>E.current?.stop(),[]);let O=()=>{p&&(R.current=!0,(0,o.ensureAudio)(),X())},H=()=>{if(!p)return;let e=g.drag?g.goal:g.hour.value,t=Math.round(60*(0,i.clamp)(e,16,24));if(t!==g.minute){g.minute=t;let e=t/60,a=ex(e),r=eg(ec(e));M.current&&(M.current.textContent=a),T.current&&r!==g.phase&&(T.current.textContent=r),g.phase=r;let o=y.current;o&&(o.setAttribute("aria-valuenow",e.toFixed(2)),o.setAttribute("aria-valuetext",`${a}, ${r.toLowerCase()}`))}let a=-1>ec(g.hour.value);a!==g.night&&(g.night=a,k(a));let r=b.current;if(r){let e=g.sunVisible;e!==g.handleOn&&(g.handleOn=e,r.style.visibility=e?"visible":"hidden");let t=Math.round(4*g.sun.x)/4,a=Math.round(4*g.sun.y)/4;e&&(t!==g.handleX||a!==g.handleY)&&(g.handleX=t,g.handleY=a,r.style.transform=`translate3d(${t-26}px, ${a-26}px, 0)`)}};(0,i.useIsoLayoutEffect)(()=>{g.minute=NaN,g.phase="",g.handleX=NaN,H()});let q=(0,i.useFrame)(s,e=>{var t,a,r,n,s,l,h;let c,u,v,y,b,M,T,R,F,A,P,D,k,C,S,_,U,z,B,I,N,L,X,O,q,W,K,Y,Z,Q,J,ee,et,ea,er,eo,ei,en=x.current,es=G.current,{width:el,height:eh}=$.current;if(!en||!es||el<2||eh<2)return!1;let ed=g.reduced,em=g.timetable,eg=performance.now()/1e3,ex=em.visible||em.pending>0,ey=p&&!g.drag&&eg-g.lastInput>4&&g.hour.settled&&!ex;if(!p||ey){if(g.acc+=e,g.acc<1/30-.002)return;e=Math.min(.1,g.acc),g.acc=0}let eb=!0===window.__labFullRes;if(p&&!ey&&!eb&&g.renderStep<eB.length-1){let t=g.perf;t.time+=e,e>1/42&&(t.slow+=e),t.time>=1.6&&(t.slow>.7*t.time&&(g.renderStep+=1,j()),t.time=0,t.slow=0)}if(ed||(g.clock+=e,g.drift+=e),p)g.introPending&&(g.introPending=!1,g.hour.configure(eU),g.goal=eP[g.theme],g.hour.to(g.goal)),ed?g.hour.set(g.hour.target):g.hour.step(e),g.held.to(g.drag&&"grab"===g.drag.kind?1:0),ed?g.held.set(g.held.target):g.held.step(e);else if(ed)g.hour.set(eP[g.theme]);else if(g.hovering)g.hour.configure(e_),g.hour.to(eC[g.theme]),g.hour.step(e);else{g.tilePhase+=e/26;let[t,a]=ek[g.theme],r=.5-.5*Math.cos(g.tilePhase*Math.PI*2);g.hour.configure(e_),g.hour.to(t+(a-t)*r),g.hour.step(e)}if(ed||(g.eyeX.step(e),g.eyeY.step(e)),ed)g.parked||(em.park(),g.parked=!0),em.step(0,!0);else{if(g.parked&&(em.clear(),g.parked=!1),p||g.started||(g.started=!0,em.request(),em.step(4.4,!1),g.clear=0),!em.busy){g.clear+=e;let t=p?16:3.2;(g.clear>t||!p&&g.hovering&&g.clear>.4)&&V(!1)}em.step(e,!1)}let eE=g.hour.value;t=g.view,a=g.eyeX.value,r=g.eyeY.value,n=!p,u=Math.min(1,Math.max(0,((c=Math.max(.4,el/Math.max(1,eh)))-.75)/(1.65-.75))),y=Math.atan(Math.tan(v=(n?20+7*u:20+12.5*u)*eT)/c),b=(1-u)*1*eT+u*(y-(n?16.5:15)*eT),t.vHalf=y,t.width=el,t.height=eh,t.sunScale=Math.min(1,Math.tan(.86*v)/Math.tan(32*eT)),(M=t.eye)[0]=1.4*a,M[1]=2+.45*r,M[2]=12,t.target[0]=0,t.target[1]=M[1]+100*Math.tan(b),t.target[2]=112,f(t.view,M,t.target,eM),s=t.proj,T=1/Math.tan(2*y/2),R=-1/2399.5,s.fill(0),s[0]=T/c,s[5]=T,s[10]=2400.5*R,s[11]=-1,s[14]=2400*R,t.proj[0]=-t.proj[0],m(t.viewProj,t.proj,t.view),l=t.invViewProj,F=(h=t.viewProj)[0],A=h[1],P=h[2],D=h[3],k=h[4],C=h[5],S=h[6],_=h[7],U=h[8],z=h[9],B=h[10],I=h[11],N=h[12],L=h[13],X=h[14],O=h[15],q=F*C-A*k,W=F*S-P*k,K=F*_-D*k,Y=A*S-P*C,Z=A*_-D*C,Q=P*_-D*S,J=U*L-z*N,ee=U*X-B*N,et=U*O-I*N,ea=z*X-B*L,er=z*O-I*L,(ei=q*(eo=B*O-I*X)-W*er+K*ea+Y*et-Z*ee+Q*J)&&(ei=1/ei,l[0]=(C*eo-S*er+_*ea)*ei,l[1]=(P*er-A*eo-D*ea)*ei,l[2]=(L*Q-X*Z+O*Y)*ei,l[3]=(B*Z-z*Q-I*Y)*ei,l[4]=(S*et-k*eo-_*ee)*ei,l[5]=(F*eo-P*et+D*ee)*ei,l[6]=(X*K-N*Q-O*W)*ei,l[7]=(U*Q-B*K+I*W)*ei,l[8]=(k*er-C*et+_*J)*ei,l[9]=(A*et-F*er-D*J)*ei,l[10]=(N*Z-L*K+O*q)*ei,l[11]=(z*K-U*Z-I*q)*ei,l[12]=(C*ee-k*ea-S*J)*ei,l[13]=(F*ea-A*ee+P*J)*ei,l[14]=(L*W-N*Y-X*q)*ei,l[15]=(U*Y-z*W+B*q)*ei);let eR=function(e,t,a=1){let r=ec(e),o=eu(e)*a;t.hour=e,t.el=r,t.az=o,d(t.sunDir,o,r),d(t.moonDir,-19*a,15.5);let i=0;for(;i<ef.length-2&&r<ef[i+1].el;)i++;let n=ef[i],s=ef[i+1],l=(n.el-r)/(n.el-s.el);l=(l=Math.min(1,Math.max(0,l)))*l*(3-2*l)*.5+.5*l,ep(t.zenith,n.zenith,s.zenith,l),ep(t.horizon,n.horizon,s.horizon,l),ep(t.glow,n.glow,s.glow,l),ep(t.sun,n.sun,s.sun,l),ep(t.skyAmb,n.skyAmb,s.skyAmb,l),ep(t.groundAmb,n.groundAmb,s.groundAmb,l),ep(t.haze,n.haze,s.haze,l),ep(t.cloudLit,n.cloudLit,s.cloudLit,l),ep(t.cloudShade,n.cloudShade,s.cloudShade,l),t.density=n.density+(s.density-n.density)*l,t.exposure=n.exposure+(s.exposure-n.exposure)*l;let h=ev(-.6,1.6,r);t.sun[0]*=h,t.sun[1]*=h,t.sun[2]*=h,t.night=ev(-3,-11,r),t.dark=ev(2,-6,r),t.stars=ev(-4.5,-11,r),t.mist=ev(-1.5,-9,r);let c=t.night;return t.moon[0]=.15*c,t.moon[1]=.19*c,t.moon[2]=.3*c,t}(eE,g.light,g.view.sunScale),eA=g.frame;if(eA.time=g.clock,eA.drift=g.drift,eA.motion=+!ed,eA.sunScale=1+.18*g.held.value,eA.windows=(0,i.smoothstep)(3.5,-7,eR.el),eA.trainGlow=(.28+.72*eR.dark)*2.3,eA.pixelAngle=2*g.view.vHalf/Math.max(1,en.height),eA.bloom=.32+.4*eR.dark,en.draw(eA,es.width,es.height,!0),g.sunVisible=eF(g.view,eE,g.sun)&&eR.el>-.4&&g.sun.y>-20&&g.sun.y<eh,(e=>{let t=E.current,a=(0,o.getAudio)();if(!p||!t?.playing||!a)return;let r=g.timetable,n=g.view,s=g.scratch,l=a.ctx.currentTime;for(let t=0;t<r.beatCount;t++){let a=r.beats[t];w(a.s,0,s,15);let h=Math.hypot(s[0]-n.eye[0],s[1]-n.eye[1],s[2]-n.eye[2]),c=a.s<0?-a.s:a.s>98.8?a.s-98.8:0,u=(0,i.clamp)(c/14),d=.85*(0,i.clamp)(95/h)*(1-.75*u),f=(0,i.clamp)(s[0]/60*.9,-.9,.9);!function(e,t,a,r,i){let n,s=!(n=(0,o.getAudio)())||"running"!==n.ctx.state||(0,o.isMuted)()?null:n;if(!s||a<.01)return;let{ctx:l,output:h}=s,c=Math.max(l.currentTime+.005,e),u=ew(l,t),d=u?(u.connect(h),u):h,f=a*(i?1:.8),m=l.createBufferSource();m.buffer=(0,o.noiseBuffer)(l),m.playbackRate.value=.9+.2*Math.random();let v=l.createBiquadFilter();v.type="bandpass",v.frequency.value=(i?1900:1650)*(1-.55*r),v.Q.value=1.4;let p=l.createGain();p.gain.setValueAtTime(0,c),p.gain.linearRampToValueAtTime(.09*f,c+.002),p.gain.exponentialRampToValueAtTime(1e-4,c+.05),m.connect(v).connect(p).connect(d),m.start(c,.6*Math.random(),.07);let g=l.createOscillator();g.type="sine",g.frequency.setValueAtTime(92,c),g.frequency.exponentialRampToValueAtTime(48,c+.06);let x=l.createGain();x.gain.setValueAtTime(0,c),x.gain.linearRampToValueAtTime(.12*f,c+.003),x.gain.exponentialRampToValueAtTime(1e-4,c+.09),g.connect(x).connect(d),g.start(c),g.stop(c+.11)}(l+.04-(1-a.frac)*e,f,d,u,a.lead)}let h=0,c=0;for(let e of r.trains){if(!e.live)continue;let t=e.head-e.dir*r.length(e)*.5,a=(0,i.clamp)(Math.min(t+10,108.8-t)/25);a<=h||(h=a,w((0,i.clamp)(t,0,98.8),0,s),c=(0,i.clamp)(s[0]/55,-.9,.9))}t.update(h,c,g.light.night)})(e),H(),ed&&!g.drag&&g.hour.settled&&g.held.settled)return!1}),{canvasRef:G,sizeRef:$,supported:W}=(0,i.useWebGL2)({mode:e,attributes:{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:t=>{let a=null;try{a=new eh(t,e)}catch(e){console.error(e);return}return x.current=a,j(),q(),()=>{a?.dispose(),x.current=null}},onResize:()=>{j(),q()}}),K=(0,i.useLatest)(q),Y=(0,a.useRef)(!0);(0,a.useEffect)(()=>{if(g.theme=v,Y.current){Y.current=!1,q();return}p&&(g.introPending=!1,g.hour.configure(eU),g.goal=eP[v],g.hour.to(g.goal)),q()},[v]),(0,a.useEffect)(()=>{g.reduced=u,u&&(g.introPending=!1,g.drag||g.hour.set(p?g.hour.target:eP[g.theme])),q()},[u]);let Q=()=>{g.lastInput=performance.now()/1e3,C||S(!0),K.current()},J=(e,t=eS)=>{var a,r;let o=e;o<16&&(o=16-.7*(a=16-o)/(.7+a)),o>24&&(o=24+.7*(r=o-24)/(.7+r)),g.goal=o,g.hour.configure(t),g.hour.to(o)},ee=e=>{let t=y.current?.getBoundingClientRect();return{x:e.clientX-(t?.left??0),y:e.clientY-(t?.top??0)}},et=(e,t,a)=>{let r=e.n%e.ts.length;e.ts[r]=a/1e3,e.hs[r]=t,e.n+=1},ea=(e,t)=>{let a=g.drag;if(!a||e.pointerId!==a.id)return;g.drag=null,y.current?.removeAttribute("data-dragging");try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}if(y.current&&(y.current.style.cursor=A?"pointer":""),"press"===a.kind){t||V(!0),Q();return}let r=t||g.reduced?0:((e,t)=>{let a=e.ts.length;if(e.n<2)return 0;let r=(e.n-1)%a,o=e.ts[r];if(t/1e3-o>.09)return 0;let i=r;for(let t=1;t<Math.min(e.n,a);t++){let r=(e.n-1-t)%a;if(i=r,o-e.ts[r]>.08)break}let n=o-e.ts[i];return n<.012?0:(e.hs[r]-e.hs[i])/n})(a,e.timeStamp),o=(0,i.clamp)(r,-9,9),n=(0,i.clamp)(g.goal+.2*o,16,24);g.goal=n,g.hour.configure(e_),g.hour.to(n,o),B(`${ex(n)}, ${eg(ec(n)).toLowerCase()}`),Q()};return((0,a.useEffect)(()=>{if(p)return;let e=G.current;if(!e)return;let t=e=>{"mouse"===e.pointerType&&(g.hovering=!0,K.current())},a=t=>{if("mouse"!==t.pointerType||g.reduced)return;let a=e.getBoundingClientRect();g.eyeX.to(.7*(0,i.clamp)((t.clientX-a.left)/a.width*2-1,-1,1)),g.eyeY.to(.7*(0,i.clamp)(1-(t.clientY-a.top)/a.height*2,-1,1))},r=()=>{g.hovering=!1,g.eyeX.to(0),g.eyeY.to(0),K.current()};return e.addEventListener("pointerenter",t),e.addEventListener("pointermove",a),e.addEventListener("pointerleave",r),()=>{e.removeEventListener("pointerenter",t),e.removeEventListener("pointermove",a),e.removeEventListener("pointerleave",r)}},[p,W]),!1===W)?(0,t.jsx)(eI,{mode:e,theme:v}):p?(0,t.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:y,role:"slider",tabIndex:0,"aria-label":"Time of day in the valley","aria-describedby":F,"aria-orientation":"horizontal","aria-valuemin":16,"aria-valuemax":24,onPointerDown:e=>{if(!p||!e.isPrimary||e.button>0||e.target.closest("[data-lab-controls]"))return;O();let{x:t,y:a}=ee(e),r=g.sunVisible&&46>Math.hypot(t-g.sun.x,a-g.sun.y),o={id:e.pointerId,kind:r?"grab":"press",pointer:e.pointerType,x0:t,y0:a,hour0:g.hour.value,ts:new Float64Array(8),hs:new Float64Array(8),n:0};g.drag=o;try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}r&&(J(g.hour.value),y.current?.setAttribute("data-dragging","")),et(o,g.goal,e.timeStamp),Q()},onPointerMove:e=>{if(!p)return;let{x:t,y:a}=ee(e),r=g.drag;if(!r){if("mouse"===e.pointerType&&!g.reduced){let e=g.view.width||1,r=g.view.height||1;g.eyeX.to((0,i.clamp)(t/e*2-1,-1,1)),g.eyeY.to((0,i.clamp)(1-a/r*2,-1,1));let o=g.sunVisible&&46>Math.hypot(t-g.sun.x,a-g.sun.y);y.current&&(y.current.style.cursor=o?"grab":"pointer"),K.current()}return}if(e.pointerId===r.id){if("press"===r.kind){let e=t-r.x0,o=a-r.y0;if(!("mouse"===r.pointer?Math.hypot(e,o)>6:Math.abs(e)>8&&Math.abs(e)>1.1*Math.abs(o)))return;r.kind="scrub",r.x0=t,r.y0=a,r.hour0=g.hour.value,y.current?.setAttribute("data-dragging","")}if("grab"===r.kind)J(function(e,t,a){let r=14.8,o=1/0;for(let i=14.8;i<=25.200001;i+=.05){eF(e,i,eA);let n=(eA.x-t)**2+(eA.y-a)**2;n<o&&(o=n,r=i)}let i=Math.max(14.8,r-.06),n=Math.min(25.2,r+.06);for(let s=i;s<=n+1e-6;s+=.004){eF(e,s,eA);let i=(eA.x-t)**2+(eA.y-a)**2;i<o&&(o=i,r=s)}return r}(g.view,t,a));else{let e,o;J((e=t-r.x0,o="mouse"===r.pointer?a-r.y0:0,r.hour0+(e+.6*o)/(0,i.clamp)(.115*g.view.width,62,150)))}y.current&&(y.current.style.cursor="grabbing"),et(r,g.goal,e.timeStamp),Q()}},onPointerUp:e=>ea(e,!1),onPointerCancel:e=>ea(e,!0),onPointerLeave:e=>{"mouse"!==e.pointerType||g.drag||(g.eyeX.to(0),g.eyeY.to(0),K.current())},onKeyDown:e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;if("Enter"===e.key||" "===e.key){e.preventDefault(),O(),V(!0),Q();return}let t=null,a=e.shiftKey?1:.25,r=g.goal;switch(e.key){case"ArrowRight":case"ArrowUp":t=r+a;break;case"ArrowLeft":case"ArrowDown":t=r-a;break;case"PageUp":t=r+1;break;case"PageDown":t=r-1;break;case"Home":t=16;break;case"End":t=24;break;default:return}e.preventDefault(),O();let o="Home"===e.key||"End"===e.key?t:.25*Math.round(t/.25);g.goal=(0,i.clamp)(o,16,24),g.hour.configure(e_),g.hour.to(g.goal),Q()},onFocus:e=>U(e.currentTarget.matches(":focus-visible")),onBlur:()=>U(!1),className:"group/surface absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]",style:{cursor:A?"pointer":void 0},children:[(0,t.jsx)("canvas",{ref:G,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),(0,t.jsx)("div",{ref:b,"aria-hidden":"true",className:"absolute start-0 top-0 size-[52px] touch-none rounded-full will-change-transform",style:{visibility:"hidden",cursor:"grab"},children:(0,t.jsx)("span",{className:"absolute inset-[7px] rounded-full opacity-0 shadow-[0_0_0_1.5px_rgb(255_255_255/0.55)] transition-[opacity,scale] duration-200 ease-out group-hover/surface:opacity-60 group-data-[dragging]/surface:scale-110 group-data-[dragging]/surface:opacity-90 group-focus-visible/surface:opacity-90"})}),(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-[inset_0_0_0_2px_var(--foreground)] transition-opacity duration-150 group-focus-visible/surface:opacity-100"})]}),(0,t.jsx)("p",{id:F,className:"sr-only",children:"A valley in the evening, seen from the river: a stone viaduct of eleven arches crosses it between two tunnels. The arrow keys move the time of day a quarter of an hour, with Shift or Page Up and Page Down a whole hour; Home and End go to the afternoon and to midnight. Enter or Space sends the next train across. With a mouse, drag the sun or the sky to change the time and click to send a train; on a touch screen, drag sideways and tap."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:z}),(0,t.jsxs)(n.StageControls,{placement:"bottom",children:[(0,t.jsxs)(n.Tray,{label:"Time and trains",children:[(0,t.jsxs)("span",{className:"flex h-10 items-center gap-2 ps-2.5 pe-2 text-[13px]","aria-hidden":"true",children:[(0,t.jsx)("span",{className:"text-secondary",children:D?(0,t.jsx)(c,{size:15}):(0,t.jsx)(h,{size:15})}),(0,t.jsx)("span",{ref:M,className:"w-[38px] font-medium text-primary tabular-nums"}),(0,t.jsx)("span",{ref:T,className:(0,r.cn)("whitespace-nowrap text-secondary",I?"w-[82px]":"w-[74px]")})]}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.TrayButton,{icon:(0,t.jsx)(l,{}),"aria-label":"Send a train",onClick:()=>{O(),V(!0),Q()},children:I?"Send a train":"Train"}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.MuteButton,{})]}),(0,t.jsx)(n.StageHint,{className:(0,r.cn)("rounded-full bg-[color-mix(in_oklab,var(--float)_74%,transparent)] px-2.5 py-0.5 text-secondary backdrop-blur-md",!C||_?"transition-opacity duration-300":"opacity-0 transition-opacity duration-700"),children:_?I?"← → move the hour · Shift for a whole hour · Enter sends a train":"← → the hour · Enter sends a train":A?"Drag the sky to change the time · click to send the next train":"Drag sideways to change the time · tap to send a train"})]})]}):(0,t.jsx)("canvas",{ref:G,"aria-hidden":"true",className:"absolute inset-0 block size-full"})}],9024)},20068,function(e){e.n(e.i(9024))}]);