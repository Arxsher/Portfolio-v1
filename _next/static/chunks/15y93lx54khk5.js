(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,11047,e=>{"use strict";var t=e.i(43476),o=e.i(71645),r=e.i(16442),a=e.i(37047),n=e.i(45219);function i({size:e=16,className:o,children:r}){return(0,t.jsx)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:o?`shrink-0 ${o}`:"shrink-0",children:(0,t.jsx)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:r})})}function l(e){return(0,t.jsxs)(i,{...e,children:[(0,t.jsx)("path",{d:"M4 14h6"}),(0,t.jsx)("path",{d:"M6.5 14 5 8.5l4.2-3.2"}),(0,t.jsx)("path",{d:"m9.2 5.3 1.6-1.9 3.2 3.4-2.1 1.5z"}),(0,t.jsx)("path",{d:"M11.4 9.6 10.6 11"})]})}function s(e){return(0,t.jsxs)(i,{...e,children:[(0,t.jsx)("rect",{x:"2",y:"3",width:"12",height:"7.5",rx:"1.25"}),(0,t.jsx)("path",{d:"M8 10.5V13M5.5 13.25h5"})]})}function c(e){return(0,t.jsxs)(i,{...e,children:[(0,t.jsx)("circle",{cx:"8",cy:"8",r:"2.6"}),(0,t.jsx)("path",{d:"M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1"})]})}function u(e){return(0,t.jsx)(i,{...e,children:(0,t.jsx)("path",{d:"M12.8 9.6A5.2 5.2 0 0 1 6.4 3.2a5.2 5.2 0 1 0 6.4 6.4Z"})})}var f=e.i(55171);let h=Math.PI/180,m={W:4.2,D:4.2,H:2.7,T:.16,slab:.2},d=2.754,v=[0,(.8+2.42)/2,2.27],p=[2.72,.738,.4],x=[.95,.017,.36],g=p[1]+x[1],b=[2.72,1.17,.19],w=[.32,.19,.012],y=[3.16,1.31,.43],R=[-.3,-.84,.45],M=Math.hypot(...R),T=[R[0]/M,R[1]/M,R[2]/M],_={base:[3.38,g,.2],elbow:[3.32,1.24,.13],head:y,axis:T,shadeLen:.17,shadeR0:.032,shadeR1:.088,bulb:[y[0]+.06*T[0],y[1]+.06*T[1],y[2]+.06*T[2]]},E=[2.62,0,1.2],A=[.62,0,.66],S=[2.72,1.98,0],C=[1.18,1.42,0],L=[.24,.31,.012],D=e=>{let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]},P=(e,t)=>[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],B=[[A[0],.44-.03,A[2]],[A[0]+.04,1.12,A[2]-.03],[A[0]-.02,1.74,A[2]+.05]],k=(()=>{let e=[];for(let t=0;t<13;t++){let o=t/12,r=function(e){let t=e<.5?0:1,o=0===t?2*e:(e-.5)*2,r=B[t],n=B[t+1];return[(0,a.lerp)(r[0],n[0],o),(0,a.lerp)(r[1],n[1],o),(0,a.lerp)(r[2],n[2],o)]}(.3+.7*o),n=2.39996*t+.6,i=(0,a.lerp)(-.12,.85,Math.pow(o,1.4)),l=D([Math.cos(n)*Math.cos(i),Math.sin(i),Math.sin(n)*Math.cos(i)]),s=(0,a.lerp)(.15,.12,o)*(.92+7*t%5*.16/4),c=.66*s,u=[r[0]+l[0]*(s+.02),r[1]+l[1]*(s+.02)+.02,r[2]+l[2]*(s+.02)],f=D(P([0,1,0],l)),h=(5*t%7/6-.5)*.9,m=D(P(l,f));m=D([m[0]*Math.cos(h)+f[0]*Math.sin(h),m[1]*Math.cos(h)+f[1]*Math.sin(h),m[2]*Math.cos(h)+f[2]*Math.sin(h)]);let d=D(P(m,l));e.push({c:u,u:l,w:m,v:d,len:s,wid:c})}return e})(),N=32*h,O=45*h,F=[Math.cos(N)*Math.sin(O),Math.sin(N),Math.cos(N)*Math.cos(O)],W=D([F[2],0,-F[0]]),H=P(F,W),U=[(m.W-m.T)/2,1.05,(m.D-m.T)/2],I=(e,t)=>e[0]*t[0]+e[1]*t[1]+e[2]*t[2];function z(e,t){let o=[e[0]-U[0],e[1]-U[1],e[2]-U[2]];return t.x=I(o,W),t.y=I(o,H),t}let G=(()=>{let{W:e,D:t,H:o,T:r,slab:a}=m,n=[-r,e],i=[-r,t],l=[];for(let e of n)for(let t of i)l.push([e,-a,t]);return l.push([-r,o,-r],[-r,o,t],[e,o,-r],[0,o,t],[e,o,0]),l})(),q=34*h,$=10*h,K=225*h;function V(){return{dir:[0,1,0],elevation:0,bearing:0}}function Y(e,t){let o=(e-13.25)*15*h,r=Math.sin(q)*Math.sin($)+Math.cos(q)*Math.cos($)*Math.cos(o),n=Math.asin((0,a.clamp)(r,-1,1)),i=Math.atan2(Math.sin(o),Math.cos(o)*Math.sin(q)-Math.tan($)*Math.cos(q))+Math.PI,l=i-K,s=Math.cos(n);return t.dir[0]=-Math.cos(l)*s,t.dir[1]=Math.sin(n),t.dir[2]=Math.sin(l)*s,t.elevation=n/h,t.bearing=(i/h%360+360)%360,t}let X=D([-.62,.58,.28]),j=new Float64Array(501);{let e=V(),t=0;for(let o=0;o<=500;o++){Y(3.5+25*o/500,e);let r=Math.atan2(I(e.dir,H),I(e.dir,W));if(o>0){for(;r-t>Math.PI;)r-=2*Math.PI;for(;r-t<-Math.PI;)r+=2*Math.PI}j[o]=r,t=r}}function Z(e){let t=((0,a.clamp)(e,3.5,28.5)-3.5)/25*500,o=Math.min(499,Math.floor(t));return(0,a.lerp)(j[o],j[o+1],t-o)}function Q(e,t,o=4.5,r=25){let n=Z(t),i=e;for(;i-n>Math.PI;)i-=2*Math.PI;for(;i-n<-Math.PI;)i+=2*Math.PI;let l=0,s=500;if(i<=j[0])return(0,a.clamp)(3.5,o,r);if(i>=j[500])return(0,a.clamp)(28.5,o,r);for(;s-l>1;){let e=l+s>>1;j[e]<i?l=e:s=e}let c=(i-j[l])/Math.max(1e-9,j[s]-j[l]),u=3.5+25*(l+c)/500;return(0,a.clamp)(u,o,r)}function J(){return{scale:1,ox:0,oy:0,cx:0,cy:0,rx:1,ry:1,sunR:10}}let ee={x:0,y:0};function et(e,t,o,r,a){let n=1/0,i=-1/0,l=1/0,s=-1/0;for(let e of G)z(e,ee),n=Math.min(n,ee.x),i=Math.max(i,ee.x),l=Math.min(l,ee.y),s=Math.max(s,ee.y);let c=(n+i)/2,u=(l+s)/2;if("tile"===o){let o=Math.min(.9*e/(i-n),.86*t/(s-l));return a.scale=o,a.ox=e/2-c*o,a.oy=.53*t+u*o,a.sunR=Math.max(6,.04*Math.min(e,t)),a.cx=e/2,a.cy=.5*t,a.rx=.47*e,a.ry=.47*t,a}let f=e<560,h=f?13:16;a.sunR=h;let m=h+(f?14:22),d=t-r-h-8,v=Math.max(40,(d-m)/1.8),p=m+v,x=Math.max(40,Math.min(e/2-h-(f?14:26),2.25*v));a.cx=e/2,a.cy=p,a.rx=x,a.ry=v;let g=h+(f?8:18),b=Math.min((d+h-(f?10:16)-m+h)/(s-l),2*(x-g)/(i-n),(e-24)/(i-n));return a.scale=b,a.ox=a.cx-c*b,a.oy=p-6*!f+u*b,a}function eo(e,t,o){let r=Z(e);return o.x=t.cx+Math.cos(r)*t.rx,o.y=t.cy-Math.sin(r)*t.ry,o}function er(e,t,o){return Math.atan2(-(t-o.cy)/o.ry,(e-o.cx)/o.rx)}function ea(e,t,o){return z(e,o),o.x=t.ox+o.x*t.scale,o.y=t.oy-o.y*t.scale,o}let en={lamp:{lo:[3,g,.06],hi:[3.48,1.38,.6]},screen:{lo:[2.38,.96,.16],hi:[3.06,1.38,.22]}},ei={x:0,y:0};function el(e,t,o){for(let r of["screen","lamp"]){let{lo:a,hi:n}=en[r],i=1/0,l=-1/0,s=1/0,c=-1/0;for(let e=0;e<8;e++)ea([1&e?n[0]:a[0],2&e?n[1]:a[1],4&e?n[2]:a[2]],o,ei),i=Math.min(i,ei.x),l=Math.max(l,ei.x),s=Math.min(s,ei.y),c=Math.max(c,ei.y);let u=2*("lamp"===r);if(e>=i-u&&e<=l+u&&t>=s-u&&t<=c+u)return r}return null}let es=[{el:-18,top:[.006,.009,.024],low:[.014,.018,.038],exposure:2.7},{el:-11,top:[.012,.02,.06],low:[.04,.045,.1],exposure:2.7},{el:-7,top:[.035,.06,.17],low:[.16,.13,.26],exposure:2.5},{el:-3.5,top:[.11,.15,.34],low:[.55,.3,.3],exposure:1.95},{el:0,top:[.26,.3,.52],low:[1,.46,.24],exposure:1.55},{el:5,top:[.36,.46,.7],low:[1,.68,.42],exposure:1.3},{el:14,top:[.36,.55,.86],low:[.86,.82,.74],exposure:1.15},{el:35,top:[.3,.52,.9],low:[.74,.82,.92],exposure:1.05}],ec=[.62,.46,.32],eu=[.86,.85,.83],ef=e=>{let t=e.toFixed(5);return t.includes(".")?t:`${t}.0`},eh=e=>`vec3(${ef(e[0])}, ${ef(e[1])}, ${ef(e[2])})`,em=(e,t)=>`const vec3 ${e}[${t.length}] = vec3[${t.length}](${t.map(eh).join(", ")});`;function ed(){let e=function(){let e=[A[0]-.2,0,A[2]-.2],t=[A[0]+.2,.44,A[2]+.2],o=(o,r)=>{e=[Math.min(e[0],o[0]-r),Math.min(e[1],o[1]-r),Math.min(e[2],o[2]-r)],t=[Math.max(t[0],o[0]+r),Math.max(t[1],o[1]+r),Math.max(t[2],o[2]+r)]};for(let e of B)o(e,.02);for(let e of k)o(e.c,e.len+.03);return{c:[(e[0]+t[0])/2,(e[1]+t[1])/2,(e[2]+t[2])/2],h:[(t[0]-e[0])/2+.01,(t[1]-e[1])/2+.01,(t[2]-e[2])/2+.01]}}(),t=k.map(e=>[e.c[0]-e.u[0]*e.len*.92,e.c[1]-e.u[1]*e.len*.92,e.c[2]-e.u[2]*e.len*.92]);return`
#define PI 3.14159265
const float RW = ${ef(m.W)};
const float RD = ${ef(m.D)};
const float RH = ${ef(m.H)};
const float RT = ${ef(m.T)};
const float SLAB = ${ef(m.slab)};
const float WY0 = ${ef(.8)};
const float WY1 = ${ef(2.42)};
const float WZ0 = ${ef(1.42)};
const float WZ1 = ${ef(3.12)};
const float WFRAME = ${ef(.05)};
const float WBAR = ${ef(.026)};
const float WCOLS = ${ef(3)};
const float WROWS = ${ef(4)};
const float GX = -RT * 0.5;

const vec3 CAM_RIGHT = ${eh(W)};
const vec3 CAM_UP = ${eh(H)};
const vec3 CAM_BACK = ${eh(F)};
const vec3 CAM_TARGET = ${eh(U)};
const float FAR = 14.0;
const float DEPTH_RANGE = 28.0;

const vec3 DESK_C = ${eh(p)};
const vec3 DESK_H = ${eh(x)};
const float DESK_Y = ${ef(g)};
const vec3 MON_C = ${eh(b)};
const vec3 MON_H = ${eh(w)};
const float MON_BEZEL = ${ef(.014)};
const vec3 LAMP_BASE = ${eh(_.base)};
const vec3 LAMP_ELBOW = ${eh(_.elbow)};
const vec3 LAMP_HEAD = ${eh(_.head)};
const vec3 LAMP_AXIS = ${eh(_.axis)};
const vec3 LAMP_BULB = ${eh(_.bulb)};
const float LAMP_LEN = ${ef(_.shadeLen)};
const float LAMP_R0 = ${ef(_.shadeR0)};
const float LAMP_R1 = ${ef(_.shadeR1)};
const vec3 CHAIR_AT = ${eh(E)};
const vec2 CHAIR_CS = vec2(${ef(.9713379748520297)}, ${ef(-.23770262642713458)});
const vec3 PLANT_AT = ${eh(A)};
const float POT_H = ${ef(.44)};
const float POT_R0 = ${ef(.15)};
const float POT_R1 = ${ef(.2)};
const vec3 STEM0 = ${eh(B[0])};
const vec3 STEM1 = ${eh(B[1])};
const vec3 STEM2 = ${eh(B[2])};
const vec3 CLOCK_C = ${eh(S)};
const float CLOCK_R = ${ef(.15)};
const float CLOCK_D = ${ef(.035)};
const vec3 PRINT_C = ${eh(C)};
const vec3 PRINT_H = ${eh(L)};
const vec3 MUG_C = vec3(2.02, DESK_Y + 0.05, 0.53);
const vec3 BOOKS_C = vec3(2.1, DESK_Y, 0.22);
const vec3 KEYS_C = vec3(2.68, DESK_Y + 0.007, 0.53);
const vec3 MOUSE_C = vec3(3.04, DESK_Y + 0.011, 0.55);
const vec3 RUG_C = vec3(2.5, 0.004, 1.62);
const vec3 RUG_H = vec3(1.0, 0.004, 0.72);

#define LEAF_N ${k.length}
${em("LEAF_C",k.map(e=>e.c))}
${em("LEAF_U",k.map(e=>e.u))}
${em("LEAF_W",k.map(e=>e.w))}
${em("LEAF_V",k.map(e=>e.v))}
${em("LEAF_R",k.map(e=>[e.len,e.wid,0]))}
${em("LEAF_S",k.map(e=>{let t=[e.c[0]-e.u[0]*e.len,e.c[1]-e.u[1]*e.len,e.c[2]-e.u[2]*e.len],o=B[0],r=1/0;for(let e=0;e<B.length-1;e++){let a=B[e],n=B[e+1];for(let e=0;e<=20;e++){let i=e/20,l=[a[0]+(n[0]-a[0])*i,a[1]+(n[1]-a[1])*i,a[2]+(n[2]-a[2])*i],s=Math.hypot(l[0]-t[0],l[1]-t[1],l[2]-t[2]);s<r&&(r=s,o=l)}}return o}))}
${em("LEAF_B",t)}

// culling boxes (centre, half size) for the furniture groups
const vec3 DESKB_C = vec3(DESK_C.x, 0.72, 0.42);
const vec3 DESKB_H = vec3(DESK_H.x + 0.02, 0.72, 0.43);
const vec3 CHAIRB_C = vec3(CHAIR_AT.x, 0.45, CHAIR_AT.z);
const vec3 CHAIRB_H = vec3(0.34, 0.46, 0.34);
const vec3 PLANTB_C = ${eh(e.c)};
const vec3 PLANTB_H = ${eh(e.h)};
const vec3 DECOB_C = vec3(1.95, 1.62, 0.03);
const vec3 DECOB_H = vec3(1.0, 0.56, 0.04);

// materials
#define M_FLOOR 1.0
#define M_PLASTER 2.0
#define M_CUT 3.0
#define M_STEEL 4.0
#define M_GLASS 5.0
#define M_SILL 6.0
#define M_DESK 7.0
#define M_SCREEN 8.0
#define M_CHAIR 9.0
#define M_LEAF 10.0
#define M_POT 11.0
#define M_SOIL 12.0
#define M_MUG 13.0
#define M_BOOK1 14.0
#define M_BOOK2 15.0
#define M_BOOK3 16.0
#define M_RUG 17.0
#define M_KEYS 18.0
#define M_SHADE_IN 19.0
#define M_BULB 20.0
#define M_CLOCK 21.0
#define M_PRINT 22.0
#define M_STEM 23.0
#define M_SKIRT 24.0
#define M_SHELL 25.0
#define M_SHADE 26.0
#define M_COFFEE 27.0
#define M_BEZEL 28.0

/* --- distance helpers ---------------------------------------------------- */

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
float sdRBox(vec3 p, vec3 b, float r) { return sdBox(p, b - r) - r; }
float sdCylY(vec3 p, float r, float h) {
  vec2 d = vec2(length(p.xz) - r, abs(p.y) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}
float sdCappedCone(vec3 p, vec3 a, vec3 b, float ra, float rb) {
  float rba = rb - ra;
  float baba = dot(b - a, b - a);
  float papa = dot(p - a, p - a);
  float paba = dot(p - a, b - a) / baba;
  float x = sqrt(max(papa - paba * paba * baba, 0.0));
  float cax = max(0.0, x - ((paba < 0.5) ? ra : rb));
  float cay = abs(paba - 0.5) - 0.5;
  float k = rba * rba + baba;
  float f = clamp((rba * (x - ra) + paba * baba) / k, 0.0, 1.0);
  float cbx = x - ra - f * rba;
  float cby = paba - f;
  float s = (cbx < 0.0 && cay < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(cax * cax + cay * cay * baba, cbx * cbx + cby * cby * baba));
}
vec2 rot2(vec2 v, float c, float s) { return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
vec2 U(vec2 a, vec2 b) { return a.x < b.x ? a : b; }

/* --- the shell: slab, two walls with the opening, skirting, sill ------- */

float holeD(vec3 p) {
  return sdBox(p - vec3(-RT * 0.5, (WY0 + WY1) * 0.5, (WZ0 + WZ1) * 0.5), vec3(RT, (WY1 - WY0) * 0.5, (WZ1 - WZ0) * 0.5));
}

vec2 shellD(vec3 p) {
  float slab = sdRBox(p - vec3((RW - RT) * 0.5, -SLAB * 0.5, (RD - RT) * 0.5), vec3((RW + RT) * 0.5, SLAB * 0.5, (RD + RT) * 0.5), 0.02);
  float wa = sdRBox(p - vec3(-RT * 0.5, (RH - 0.06) * 0.5, (RD - RT) * 0.5), vec3(RT * 0.5, (RH + 0.06) * 0.5, (RD + RT) * 0.5), 0.007);
  float wb = sdRBox(p - vec3((RW - RT) * 0.5, (RH - 0.06) * 0.5, -RT * 0.5), vec3((RW + RT) * 0.5, (RH + 0.06) * 0.5, RT * 0.5), 0.007);
  wa = max(wa, -holeD(p));
  vec2 r = vec2(min(slab, min(wa, wb)), M_SHELL);
  float skirt = min(
    sdBox(p - vec3(0.007, 0.036, RD * 0.5), vec3(0.007, 0.036, RD * 0.5)),
    sdBox(p - vec3(RW * 0.5, 0.036, 0.007), vec3(RW * 0.5, 0.036, 0.007)));
  r = U(r, vec2(skirt, M_SKIRT));
  float sill = sdRBox(p - vec3(-0.005, WY0 - 0.014, (WZ0 + WZ1) * 0.5), vec3(0.09, 0.014, (WZ1 - WZ0) * 0.5 + 0.06), 0.004);
  r = U(r, vec2(sill, M_SILL));
  return r;
}

vec2 windowD(vec3 p) {
  vec3 q = p - vec3(GX, (WY0 + WY1) * 0.5, (WZ0 + WZ1) * 0.5);
  vec3 hh = vec3(0.024, (WY1 - WY0) * 0.5, (WZ1 - WZ0) * 0.5);
  float outer = sdBox(q, hh);
  float inner = sdBox(q, vec3(0.06, hh.y - WFRAME, hh.z - WFRAME));
  float frame = max(outer, -inner);
  float cw = (WZ1 - WZ0 - 2.0 * WFRAME) / WCOLS;
  float rh = (WY1 - WY0 - 2.0 * WFRAME) / WROWS;
  float zl = q.z + hh.z - WFRAME;
  float yl = q.y + hh.y - WFRAME;
  float dz = abs(zl - cw * clamp(floor(zl / cw + 0.5), 1.0, WCOLS - 1.0)) - WBAR * 0.5;
  float dy = abs(yl - rh * clamp(floor(yl / rh + 0.5), 1.0, WROWS - 1.0)) - WBAR * 0.5;
  float bars = max(max(min(dz, dy), abs(q.x) - 0.014), inner);
  float glass = max(abs(q.x) - 0.003, inner);
  return U(vec2(min(frame, bars), M_STEEL), vec2(glass, M_GLASS));
}

/* --- the desk and what's on it ------------------------------------------ */

vec2 lampD(vec3 p) {
  float base = sdCylY(p - vec3(LAMP_BASE.x, LAMP_BASE.y + 0.011, LAMP_BASE.z), 0.07, 0.011) - 0.002;
  float arms = min(
    sdCapsule(p, LAMP_BASE + vec3(0.0, 0.02, 0.0), LAMP_ELBOW, 0.0105),
    sdCapsule(p, LAMP_ELBOW, LAMP_HEAD, 0.0095));
  arms = min(arms, length(p - LAMP_ELBOW) - 0.019);
  vec3 mouth = LAMP_HEAD + LAMP_AXIS * LAMP_LEN;
  float cone = sdCappedCone(p, LAMP_HEAD, mouth, LAMP_R0, LAMP_R1);
  float shade = max(abs(cone) - 0.0035, dot(p - (mouth - LAMP_AXIS * 0.004), LAMP_AXIS));
  float cap = max(length(p - LAMP_HEAD) - 0.036, dot(p - LAMP_HEAD, LAMP_AXIS));
  vec2 r = vec2(min(min(base, arms), cap), M_STEEL);
  r = U(r, vec2(shade, M_SHADE));
  r = U(r, vec2(length(p - LAMP_BULB) - 0.024, M_BULB));
  return r;
}

vec2 deskD(vec3 p, bool lampToo) {
  vec2 r = vec2(sdRBox(p - DESK_C, DESK_H, 0.006), M_DESK);
  vec3 q = p - vec3(DESK_C.x, 0.0, DESK_C.z);
  q.x = abs(q.x) - (DESK_H.x - 0.05);
  q.z = abs(q.z) - (DESK_H.z - 0.045);
  float legH = (DESK_C.y - DESK_H.y) * 0.5;
  r = U(r, vec2(sdBox(q - vec3(0.0, legH, 0.0), vec3(0.016, legH, 0.016)), M_STEEL));
  // monitor: panel, neck, foot
  r = U(r, vec2(sdRBox(p - MON_C, MON_H, 0.006), M_BEZEL));
  float neck = sdRBox(p - vec3(MON_C.x, (DESK_Y + MON_C.y) * 0.5, MON_C.z - 0.03), vec3(0.026, (MON_C.y - DESK_Y) * 0.5, 0.01), 0.005);
  float foot = sdRBox(p - vec3(MON_C.x, DESK_Y + 0.005, MON_C.z - 0.02), vec3(0.11, 0.005, 0.075), 0.004);
  r = U(r, vec2(min(neck, foot), M_STEEL));
  // keyboard, mouse
  r = U(r, vec2(sdRBox(p - KEYS_C, vec3(0.21, 0.007, 0.064), 0.005), M_KEYS));
  r = U(r, vec2(sdEllipsoid(p - MOUSE_C, vec3(0.028, 0.013, 0.046)), M_KEYS));
  // a mug of coffee
  vec3 m = p - MUG_C;
  float cup = max(sdCylY(m, 0.042, 0.05) - 0.001, -sdCylY(m - vec3(0.0, 0.012, 0.0), 0.0365, 0.05));
  vec3 hq = m - vec3(0.048, 0.004, 0.0);
  float handle = length(vec2(length(hq.xy) - 0.025, hq.z)) - 0.0072;
  handle = max(handle, 0.041 - m.x);
  r = U(r, vec2(min(cup, handle), M_MUG));
  r = U(r, vec2(sdCylY(m - vec3(0.0, 0.026, 0.0), 0.037, 0.002), M_COFFEE));
  // a stack of three books
  vec3 b = p - BOOKS_C;
  vec3 b1 = b - vec3(0.0, 0.021, 0.0); b1.xz = rot2(b1.xz, 0.9982, 0.0600);
  vec3 b2 = b - vec3(0.012, 0.06, 0.006); b2.xz = rot2(b2.xz, 0.9902, -0.1395);
  vec3 b3 = b - vec3(-0.008, 0.093, -0.004); b3.xz = rot2(b3.xz, 0.9801, 0.1987);
  r = U(r, vec2(sdRBox(b1, vec3(0.15, 0.021, 0.105), 0.004), M_BOOK1));
  r = U(r, vec2(sdRBox(b2, vec3(0.13, 0.018, 0.095), 0.004), M_BOOK2));
  r = U(r, vec2(sdRBox(b3, vec3(0.115, 0.015, 0.085), 0.004), M_BOOK3));
  if (lampToo) r = U(r, lampD(p));
  return r;
}

/* --- the chair ------------------------------------------------------------ */

vec2 chairD(vec3 p) {
  vec3 q = p - CHAIR_AT;
  q.xz = rot2(q.xz, CHAIR_CS.x, -CHAIR_CS.y);
  float seat = sdRBox(q - vec3(0.0, 0.45, 0.0), vec3(0.215, 0.018, 0.205), 0.014);
  vec3 l = vec3(abs(q.x), q.y, q.z);
  float legs = min(
    sdCapsule(l, vec3(0.19, 0.0, -0.18), vec3(0.178, 0.44, -0.168), 0.0155),
    sdCapsule(l, vec3(0.19, 0.0, 0.2), vec3(0.178, 0.44, 0.176), 0.0155));
  float posts = sdCapsule(l, vec3(0.178, 0.44, 0.176), vec3(0.188, 0.86, 0.228), 0.0135);
  vec3 rq = q - vec3(0.0, 0.78, 0.21);
  rq.yz = rot2(rq.yz, 0.9921, 0.1253);
  float rest = sdRBox(rq, vec3(0.2, 0.062, 0.012), 0.011);
  float rail = sdCapsule(l, vec3(0.0, 0.17, -0.172), vec3(0.183, 0.17, -0.172), 0.008);
  return vec2(min(min(seat, rest), min(min(legs, posts), rail)), M_CHAIR);
}

/* --- the fig in its pot --------------------------------------------------- */

vec2 plantD(vec3 p) {
  vec3 q = p - PLANT_AT;
  float pot = sdCappedCone(q, vec3(0.0), vec3(0.0, POT_H, 0.0), POT_R0, POT_R1) - 0.004;
  pot = max(pot, -sdCappedCone(q, vec3(0.0, 0.06, 0.0), vec3(0.0, POT_H + 0.06, 0.0), POT_R0 - 0.012, POT_R1 - 0.01));
  vec2 r = vec2(pot, M_POT);
  r = U(r, vec2(sdCylY(q - vec3(0.0, POT_H - 0.05, 0.0), POT_R1 - 0.018, 0.012), M_SOIL));
  float stem = min(sdCapsule(p, STEM0, STEM1, 0.013), sdCapsule(p, STEM1, STEM2, 0.0105));
  float leaf = 1e9;
  for (int i = 0; i < LEAF_N; i++) {
    vec3 d = p - LEAF_C[i];
    vec2 rr = LEAF_R[i].xy;
    // the stalk first (cheap), then skip leaves whose bounding sphere is further than the nearest so far
    stem = min(stem, sdCapsule(p, LEAF_S[i], LEAF_B[i], 0.0045));
    if (length(d) - rr.x - 0.03 > leaf) continue;
    vec3 lp = vec3(dot(d, LEAF_U[i]), dot(d, LEAF_W[i]), dot(d, LEAF_V[i]));
    // cupped a little, and narrower toward the stalk (a fiddle-leaf shape)
    float side = clamp(lp.z, -rr.y, rr.y);
    lp.y -= 0.32 * side * side / rr.y;
    // a flat ellipse with a little thickness (a thin ellipsoid's distance
    // estimate falls apart just off its plane)
    vec2 er = vec2(rr.x, rr.y * (0.78 + 0.22 * smoothstep(-rr.x, rr.x * 0.4, lp.x)));
    float e = (length(lp.xz / er) - 1.0) * min(er.x, er.y);
    vec2 ew = vec2(e, abs(lp.y) - 0.0035);
    leaf = min(leaf, min(max(ew.x, ew.y), 0.0) + length(max(ew, 0.0)) - 0.002);
  }
  r = U(r, vec2(stem, M_STEM));
  r = U(r, vec2(leaf * 0.85, M_LEAF));
  return r;
}

/* --- on the desk wall: a clock and a framed print ------------------------ */

vec2 decorD(vec3 p) {
  vec3 q = p - CLOCK_C;
  vec2 w = vec2(length(q.xy) - (CLOCK_R - 0.008), abs(q.z - CLOCK_D * 0.5) - (CLOCK_D * 0.5 - 0.008));
  float clock = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.008;
  vec2 r = vec2(clock, M_CLOCK);
  r = U(r, vec2(sdRBox(p - PRINT_C - vec3(0.0, 0.0, PRINT_H.z), PRINT_H, 0.003), M_PRINT));
  return r;
}

float rugD(vec3 p) { return sdRBox(p - RUG_C, RUG_H, 0.004); }

/** The whole room, with materials. */
vec2 mapScene(vec3 p) {
  vec2 r = shellD(p);
  r = U(r, windowD(p));
  r = U(r, vec2(rugD(p), M_RUG));
  if (sdBox(p - DESKB_C, DESKB_H) < r.x) r = U(r, deskD(p, true));
  if (sdBox(p - CHAIRB_C, CHAIRB_H) < r.x) r = U(r, chairD(p));
  if (sdBox(p - PLANTB_C, PLANTB_H) < r.x) r = U(r, plantD(p));
  if (sdBox(p - DECOB_C, DECOB_H) < r.x) r = U(r, decorD(p));
  return r;
}

/** Only what can throw a shadow inside the room (the window is analytic). */
float occluders(vec3 p, bool lampToo) {
  float d = 1e9;
  float b = sdBox(p - DESKB_C, DESKB_H);
  d = b > 0.06 ? b : deskD(p, lampToo).x;
  b = sdBox(p - CHAIRB_C, CHAIRB_H);
  d = min(d, b > 0.06 ? b : chairD(p).x);
  b = sdBox(p - PLANTB_C, PLANTB_H);
  d = min(d, b > 0.06 ? b : plantD(p).x);
  b = sdBox(p - DECOB_C, DECOB_H);
  d = min(d, b > 0.06 ? b : decorD(p).x);
  return d;
}

vec2 boxRange(vec3 ro, vec3 inv, vec3 c, vec3 h) {
  vec3 t0 = (c - h - ro) * inv;
  vec3 t1 = (c + h - ro) * inv;
  vec3 mn = min(t0, t1);
  vec3 mx = max(t0, t1);
  return vec2(max(max(mn.x, mn.y), mn.z), min(min(mx.x, mx.y), mx.z));
}

vec3 safeInv(vec3 d) {
  return 1.0 / vec3(abs(d.x) < 1e-5 ? 1e-5 : d.x, abs(d.y) < 1e-5 ? 1e-5 : d.y, abs(d.z) < 1e-5 ? 1e-5 : d.z);
}

uniform vec3 uView; // internal px of the target point (x, y) and world units per px

void cameraRay(vec2 frag, out vec3 ro, out vec3 rd) {
  vec2 l = (frag - uView.xy) * uView.z;
  ro = CAM_TARGET + CAM_RIGHT * l.x + CAM_UP * l.y + CAM_BACK * FAR;
  rd = -CAM_BACK;
}

vec2 packDepth(float d) {
  float v = floor(clamp(d, 0.0, 1.0) * 65535.0 + 0.5);
  float hi = floor(v / 256.0);
  return vec2(hi, v - hi * 256.0) / 255.0;
}
float unpackDepth(vec2 e) {
  vec2 b = floor(e * 255.0 + 0.5);
  return (b.x * 256.0 + b.y) / 65535.0;
}

/**
 * How much of the light along L reaches S through the window: the opening
 * on both faces of the wall, then the frame and the glazing bars in the
 * glass, each with a penumbra that widens with distance. s0 returns the
 * distance to the inner face (where the furniture shadow march can stop).
 */
float aperture(vec3 S, vec3 L, out float s0) {
  s0 = 0.0;
  if (L.x > -0.004) return 0.0;
  float inv = -1.0 / L.x;
  float sIn = S.x * inv;
  float sOut = (S.x + RT) * inv;
  float sGl = (S.x - GX) * inv;
  s0 = max(sIn, 0.0);
  vec2 c = vec2((WZ0 + WZ1) * 0.5, (WY0 + WY1) * 0.5);
  vec2 h = vec2((WZ1 - WZ0) * 0.5, (WY1 - WY0) * 0.5);
  const float PEN = 0.016;
  const float W0 = 0.0025;
  float cov = 1.0;
  vec2 q; vec2 d; float w;
  if (sIn > 0.0) {
    q = (S + L * sIn).zy; w = W0 + PEN * sIn;
    d = abs(q - c) - h;
    cov *= clamp(0.5 - (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) / w, 0.0, 1.0);
  }
  q = (S + L * sOut).zy; w = W0 + PEN * sOut;
  d = abs(q - c) - h;
  cov *= clamp(0.5 - (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) / w, 0.0, 1.0);
  if (cov < 0.001 || sGl < 0.0) return cov;
  q = (S + L * sGl).zy; w = W0 + PEN * sGl;
  d = abs(q - c) - (h - WFRAME);
  cov *= clamp(0.5 - (length(max(d, 0.0)) + min(max(d.x, d.y), 0.0)) / w, 0.0, 1.0);
  float cw = (WZ1 - WZ0 - 2.0 * WFRAME) / WCOLS;
  float rh = (WY1 - WY0 - 2.0 * WFRAME) / WROWS;
  float zl = q.x - WZ0 - WFRAME;
  float yl = q.y - WY0 - WFRAME;
  float dz = abs(zl - cw * clamp(floor(zl / cw + 0.5), 1.0, WCOLS - 1.0)) - WBAR * 0.5;
  float dy = abs(yl - rh * clamp(floor(yl / rh + 0.5), 1.0, WROWS - 1.0)) - WBAR * 0.5;
  cov *= clamp(0.5 + dz / w, 0.0, 1.0) * clamp(0.5 + dy / w, 0.0, 1.0);
  return cov;
}
`}let ev=`#version 300 es
precision highp float;
precision highp int;
`,ep=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,ex=`#version 300 es
precision highp float;
in float vBright;
in float vGlint;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d) * 4.0;
  float a = exp(-r2 * 4.0);
  outColor = vec4(uColor * vBright * a * (0.35 + 0.55 * vGlint), 0.0);
}
`,eg=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uTexel; // source texel
out vec4 outColor;
vec3 pick(vec2 uv) {
  vec4 c = texture(uSrc, uv);
  float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  return c.rgb * smoothstep(0.62, 1.0, l) * c.a;
}
void main() {
  vec3 c = pick(vUv + uTexel * vec2(-1.0, -1.0)) + pick(vUv + uTexel * vec2(1.0, -1.0)) +
           pick(vUv + uTexel * vec2(-1.0, 1.0)) + pick(vUv + uTexel * vec2(1.0, 1.0));
  outColor = vec4(c * 0.25, 1.0);
}
`,eb=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uStep; // texel \xd7 direction
out vec4 outColor;
void main() {
  vec3 c = texture(uSrc, vUv).rgb * 0.2270270;
  c += (texture(uSrc, vUv + uStep * 1.3846154).rgb + texture(uSrc, vUv - uStep * 1.3846154).rgb) * 0.3162162;
  c += (texture(uSrc, vUv + uStep * 3.2307692).rgb + texture(uSrc, vUv - uStep * 3.2307692).rgb) * 0.0702703;
  outColor = vec4(c, 1.0);
}
`,ew=`#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uLit;
uniform sampler2D uBloom;
uniform sampler2D uShafts;
uniform vec2 uTexel;  // lit texel
uniform float uBloomAmt;
out vec4 outColor;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

vec3 fxaa(vec2 uv) {
  vec3 nw = texture(uLit, uv + vec2(-1.0, -1.0) * uTexel).rgb;
  vec3 ne = texture(uLit, uv + vec2(1.0, -1.0) * uTexel).rgb;
  vec3 sw = texture(uLit, uv + vec2(-1.0, 1.0) * uTexel).rgb;
  vec3 se = texture(uLit, uv + vec2(1.0, 1.0) * uTexel).rgb;
  vec3 m = texture(uLit, uv).rgb;
  float lnw = luma(nw), lne = luma(ne), lsw = luma(sw), lse = luma(se), lm = luma(m);
  float lo = min(lm, min(min(lnw, lne), min(lsw, lse)));
  float hi = max(lm, max(max(lnw, lne), max(lsw, lse)));
  if (hi - lo < max(0.03, hi * 0.08)) return m;
  vec2 dir = vec2(-((lnw + lne) - (lsw + lse)), (lnw + lsw) - (lne + lse));
  float reduce = max((lnw + lne + lsw + lse) * 0.03125, 1.0 / 128.0);
  float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
  dir = clamp(dir * rcp, vec2(-8.0), vec2(8.0)) * uTexel;
  vec3 a = 0.5 * (texture(uLit, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(uLit, uv + dir * (2.0 / 3.0 - 0.5)).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture(uLit, uv - dir * 0.5).rgb + texture(uLit, uv + dir * 0.5).rgb);
  float lb = luma(b);
  return (lb < lo || lb > hi) ? a : b;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 c = fxaa(vUv);
  c += texture(uBloom, vUv).rgb * uBloomAmt;
  vec3 sh = texture(uShafts, vUv).rgb;
  c = c + sh - c * sh * 0.6;
  c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(c, 1.0);
}
`,ey={tile:{shadowSteps:22,lampSteps:12,shaftSteps:14},stage:{shadowSteps:40,lampSteps:22,shaftSteps:26}};function eR(e,t,o,r){let a=e.createTexture();if(!a)throw Error("golden-room: no texture");return e.bindTexture(e.TEXTURE_2D,a),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,t,o,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),a}function eM(e,t,o,r){let a=eR(e,t,o,r),n=e.createFramebuffer();if(!n)throw Error("golden-room: no framebuffer");return e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,a,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{tex:a,fbo:n,w:t,h:o}}function eT(e,t){t&&(e.deleteTexture(t.tex),e.deleteFramebuffer(t.fbo))}class e_{gl;gbuf;light;shaft;motes;bright;blur;composite;uG;uL;uS;uM;uB;uBl;uC;vao;moteVao;moteBuffer;moteCount;g0=null;g1=null;gFbo=null;lit=null;bloomA=null;bloomB=null;shaftA=null;shaftB=null;w=0;h=0;gView=[NaN,NaN,NaN];gDirty=!0;constructor(e,t){this.gl=e;const o=ey[t];this.gbuf=(0,f.createProgram)(e,ep,`${ev}
${ed()}
layout(location = 0) out vec4 outG0;
layout(location = 1) out vec4 outG1;

vec3 normalAt(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.0006;
  return normalize(
    k.xyy * mapScene(p + k.xyy * e).x +
    k.yyx * mapScene(p + k.yyx * e).x +
    k.yxy * mapScene(p + k.yxy * e).x +
    k.xxx * mapScene(p + k.xxx * e).x);
}

/** Everything but the walls and the floor (their corners are shaded analytically). */
float objectsD(vec3 p) {
  vec3 q = p;
  float d = rugD(p);
  float skirt = min(
    sdBox(q - vec3(0.007, 0.036, RD * 0.5), vec3(0.007, 0.036, RD * 0.5)),
    sdBox(q - vec3(RW * 0.5, 0.036, 0.007), vec3(RW * 0.5, 0.036, 0.007)));
  d = min(d, skirt);
  d = min(d, sdRBox(p - vec3(-0.005, WY0 - 0.014, (WZ0 + WZ1) * 0.5), vec3(0.09, 0.014, (WZ1 - WZ0) * 0.5 + 0.06), 0.004));
  d = min(d, windowD(p).x);
  float b = sdBox(p - DESKB_C, DESKB_H);
  d = min(d, b > 0.3 ? b : deskD(p, true).x);
  b = sdBox(p - CHAIRB_C, CHAIRB_H);
  d = min(d, b > 0.3 ? b : chairD(p).x);
  b = sdBox(p - PLANTB_C, PLANTB_H);
  d = min(d, b > 0.3 ? b : plantD(p).x);
  b = sdBox(p - DECOB_C, DECOB_H);
  d = min(d, b > 0.3 ? b : decorD(p).x);
  return d;
}

float occlusion(vec3 p, vec3 n) {
  // contact shading from the furniture, short range
  float occ = 0.0;
  float weight = 1.0;
  for (int i = 0; i < 6; i++) {
    float h = 0.01 + 0.048 * float(i);
    float d = objectsD(p + n * h);
    occ += max(h - d, 0.0) * weight;
    weight *= 0.72;
  }
  float ao = clamp(1.0 - 2.4 * occ, 0.0, 1.0);
  // the room's own corners: darker toward the walls and the floor a surface meets
  if (p.x > -0.01 && p.z > -0.01 && p.y > -0.01 && p.y < RH - 0.01) {
    float wa = 1.0 - abs(n.x);
    float wb = 1.0 - abs(n.z);
    float wf = 1.0 - abs(n.y);
    ao *= 1.0 - 0.42 * wa * exp(-max(p.x, 0.0) / 0.36);
    ao *= 1.0 - 0.42 * wb * exp(-max(p.z, 0.0) / 0.36);
    ao *= 1.0 - 0.36 * wf * exp(-max(p.y, 0.0) / 0.3);
  }
  return ao;
}

float refine(float mat, vec3 p, vec3 n) {
  if (mat == M_SHELL) {
    // the cut faces of the model (wall tops, the slab's edges, the walls' ends) are outside
    if (p.y > RH - 0.02 && n.y > 0.5) return M_CUT;
    if (p.y < -0.004) return M_CUT;
    if (p.z > RD - 0.004 && n.z > 0.5) return M_CUT;
    if (p.x > RW - 0.004 && n.x > 0.5) return M_CUT;
    if (n.y > 0.7 && p.y < 0.01) return M_FLOOR;
    return M_PLASTER;
  }
  if (mat == M_BEZEL) {
    vec3 q = p - MON_C;
    if (n.z > 0.8 && abs(q.x) < MON_H.x - MON_BEZEL && abs(q.y) < MON_H.y - MON_BEZEL) return M_SCREEN;
    return M_STEEL;
  }
  if (mat == M_SHADE) {
    vec3 q = p - LAMP_HEAD;
    vec3 radial = q - LAMP_AXIS * dot(q, LAMP_AXIS);
    return dot(n, radial) < 0.0 ? M_SHADE_IN : M_STEEL;
  }
  return mat;
}

void main() {
  vec3 ro, rd;
  cameraRay(gl_FragCoord.xy, ro, rd);
  vec2 tb = boxRange(ro, safeInv(rd), vec3((RW - RT) * 0.5, (RH - SLAB) * 0.5, (RD - RT) * 0.5), vec3((RW + RT) * 0.5 + 0.03, (RH + SLAB) * 0.5 + 0.03, (RD + RT) * 0.5 + 0.03));
  outG0 = vec4(1.0, 1.0, 0.0, 1.0);
  outG1 = vec4(0.5, 0.5, 0.5, 0.0);
  if (tb.x > tb.y) return;
  float t = max(tb.x, 0.0);
  float mat = -1.0;
  for (int i = 0; i < 220; i++) {
    vec2 h = mapScene(ro + rd * t);
    if (h.x < 0.00035) { mat = h.y; break; }
    t += h.x * 0.92;
    if (t > tb.y) break;
  }
  if (mat < 0.0) return;
  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  mat = refine(mat, p, n);
  float ao = occlusion(p, n);
  outG0 = vec4(packDepth(t / DEPTH_RANGE), mat / 255.0, ao);
  outG1 = vec4(n * 0.5 + 0.5, 1.0);
}
`),this.light=(0,f.createProgram)(e,ep,function(e){return`${ev}
${ed()}
#define SHADOW_STEPS ${e.shadowSteps}
#define LAMP_STEPS ${e.lampSteps}

uniform sampler2D uG0;
uniform sampler2D uG1;
uniform vec3 uWinDir;
uniform vec3 uWinCol;
uniform float uSunShare;
uniform vec3 uSkyTop;
uniform vec3 uSkyLow;
uniform vec3 uAmb;
uniform vec3 uStudio;
uniform vec3 uBounceAt;
uniform vec3 uBounceCol;
uniform float uLamp;
uniform float uScreen;
uniform float uNight;
uniform float uExposure;
uniform float uHour;
uniform float uTime;
uniform vec3 uBg;
uniform float uDark;
uniform vec4 uSun;      // x, y (internal px), radius (px), 1 = sun … 0 = moon
uniform vec3 uDisc;     // the sun disc's colour (sRGB)
uniform float uGlow;    // strength of the sun's glow on the stage

out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec3 toDisplay(vec3 hdr, float exposure) {
  vec3 x = hdr * exposure;
  vec3 a = aces(x);
  // the same curve on luminance only keeps the colour of bright light (a
  // golden patch stays golden instead of bleaching), clipped softly
  float l = dot(x, vec3(0.2126, 0.7152, 0.0722));
  float lt = aces(vec3(l)).x;
  vec3 h = x * (lt / max(l, 1e-5));
  float m = max(h.r, max(h.g, h.b));
  h = m > 1.0 ? mix(h / m, vec3(1.0), clamp((m - 1.0) * 0.35, 0.0, 1.0)) : h;
  return pow(clamp(mix(a, h, 0.55), 0.0, 1.0), vec3(1.0 / 2.2));
}

/* --- materials ------------------------------------------------------------ */

vec3 floorAlbedo(vec3 P, float px) {
  const float WIDTH = 0.15;
  const float LEN = 1.35;
  float row = floor(P.z / WIDTH);
  float off = hash12(vec2(row, 3.7)) * LEN;
  float col = floor((P.x + off) / LEN);
  float id = hash12(vec2(row, col));
  vec3 base = vec3(0.66, 0.49, 0.33) * (0.88 + 0.2 * id);
  base *= mix(vec3(1.0), vec3(1.04, 0.97, 0.9), hash12(vec2(col, row) + 9.1));
  float grain = noise2(vec2(P.x * 1.6 + id * 17.0, P.z * 46.0)) * 0.6 + noise2(vec2(P.x * 7.0, P.z * 140.0)) * 0.4;
  base *= 0.92 + 0.13 * grain;
  float seamZ = (0.5 - abs(fract(P.z / WIDTH) - 0.5)) * WIDTH;
  float seamX = (0.5 - abs(fract((P.x + off) / LEN) - 0.5)) * LEN;
  float seam = min(seamZ, seamX);
  base *= mix(0.62, 1.0, smoothstep(0.0, px * 1.1 + 0.0015, seam));
  return base;
}

vec3 deskAlbedo(vec3 P, vec3 N) {
  vec3 base = vec3(0.71, 0.56, 0.4);
  float grain = noise2(vec2(P.x * 2.2, P.z * 70.0)) * 0.7 + noise2(vec2(P.x * 9.0, P.z * 190.0)) * 0.3;
  base *= 0.93 + 0.1 * grain;
  if (abs(N.y) < 0.5) base *= 0.82; // end grain on the edges
  return base;
}

vec3 rugAlbedo(vec3 P, float px) {
  vec2 q = (P.xz - RUG_C.xz);
  vec3 base = vec3(0.84, 0.81, 0.75);
  float weave = 0.5 + 0.5 * sin(P.x * 260.0) * sin(P.z * 260.0);
  base *= 0.965 + 0.035 * mix(weave, 0.5, smoothstep(0.002, 0.006, px));
  vec2 e = RUG_H.xz - abs(q);
  float edge = min(e.x, e.y);
  float band = smoothstep(0.075, 0.075 + px, edge) * (1.0 - smoothstep(0.1, 0.1 + px, edge));
  base = mix(base, base * vec3(0.72, 0.68, 0.62), band);
  return base;
}

vec3 leafAlbedo(vec3 P) {
  float v = hash12(floor(P.xz * 9.0) + floor(P.y * 9.0));
  return mix(vec3(0.085, 0.2, 0.075), vec3(0.14, 0.26, 0.09), v);
}

/** Thin dark segment from the centre toward angle a (clockwise from twelve). */
float hand(vec2 q, float a, float len, float w, float px) {
  vec2 dir = vec2(sin(a), cos(a));
  float h = clamp(dot(q, dir), -0.12, len);
  float d = length(q - dir * h) - w;
  return 1.0 - smoothstep(-px, px, d);
}

vec3 clockFace(vec3 P, float px) {
  vec2 q = (P.xy - CLOCK_C.xy) / CLOCK_R;
  float r = length(q);
  float u = px / CLOCK_R;
  vec3 c = vec3(0.93, 0.92, 0.9);
  c = mix(c, vec3(0.1), smoothstep(0.86 - u, 0.86 + u, r));
  float a = atan(q.x, q.y);
  float seg = PI / 6.0;
  float tick = abs(fract(a / seg + 0.5) - 0.5) * seg * r;
  c = mix(c, vec3(0.2), (1.0 - smoothstep(0.018 - u, 0.018 + u, tick)) * smoothstep(0.64, 0.66, r) * (1.0 - smoothstep(0.78, 0.8, r)));
  float hourA = mod(uHour, 12.0) / 12.0 * 2.0 * PI;
  float minA = fract(uHour) * 2.0 * PI;
  c = mix(c, vec3(0.1), hand(q, hourA, 0.42, 0.04, u * 1.2));
  c = mix(c, vec3(0.12), hand(q, minA, 0.64, 0.024, u * 1.2));
  c = mix(c, vec3(0.08), 1.0 - smoothstep(0.06 - u, 0.06 + u, r));
  return c;
}

vec3 printArt(vec3 P, float px) {
  vec2 q = (P.xy - PRINT_C.xy);
  vec2 h = PRINT_H.xy;
  vec2 e = h - abs(q);
  float edge = min(e.x, e.y);
  vec3 frame = vec3(0.12, 0.11, 0.1);
  vec3 paper = vec3(0.93, 0.92, 0.89);
  if (edge < 0.022) return frame;
  if (edge < 0.07) return paper;
  // a sun over three bands of land, in soft print colours
  vec2 a = (q - vec2(0.0, -0.02)) / (h - 0.07);
  vec3 c = vec3(0.89, 0.86, 0.8);
  float sun = length(a - vec2(0.12, 0.18)) - 0.36;
  c = mix(c, vec3(0.86, 0.55, 0.32), 1.0 - smoothstep(-px * 4.0, px * 4.0, sun));
  float land1 = a.y - (-0.12 + 0.06 * sin(a.x * 2.4 + 0.4));
  c = mix(c, vec3(0.6, 0.58, 0.52), 1.0 - smoothstep(-px * 4.0, px * 4.0, land1));
  float land2 = a.y - (-0.42 + 0.05 * sin(a.x * 3.1 + 2.0));
  c = mix(c, vec3(0.36, 0.36, 0.34), 1.0 - smoothstep(-px * 4.0, px * 4.0, land2));
  return c;
}

vec3 screenImage(vec3 P, float px) {
  vec2 s = (P.xy - MON_C.xy) / (MON_H.xy - MON_BEZEL); // -1..1
  vec3 c = mix(vec3(0.07, 0.075, 0.085), vec3(0.11, 0.115, 0.13), 0.5 + 0.5 * s.y);
  // an editor: a gutter, then lines of code
  float lineH = 0.105;
  float row = floor((0.86 - s.y) / lineH);
  float inRow = fract((0.86 - s.y) / lineH);
  if (row >= 0.0 && row < 15.0 && s.x > -0.9 && s.x < 0.92) {
    float indent = floor(hash12(vec2(row, 2.0)) * 3.0) * 0.1;
    float len = 0.25 + hash12(vec2(row, 7.0)) * 0.95;
    float x0 = -0.72 + indent;
    float on = step(x0, s.x) * step(s.x, x0 + len) * smoothstep(0.25, 0.3, inRow) * (1.0 - smoothstep(0.7, 0.75, inRow));
    float word = step(0.2, fract((s.x - x0) * 3.1 + hash12(vec2(row, 1.0))));
    vec3 ink = hash12(vec2(row, 5.0)) > 0.72 ? vec3(0.36, 0.64, 0.95) : vec3(0.62, 0.63, 0.66);
    c = mix(c, ink, on * word * 0.85);
    float gutter = step(-0.86, s.x) * step(s.x, -0.8) * smoothstep(0.3, 0.35, inRow) * (1.0 - smoothstep(0.65, 0.7, inRow));
    c = mix(c, vec3(0.3), gutter * 0.7);
  }
  // a cursor that blinks
  float blink = step(0.5, fract(uTime * 0.9));
  vec2 cur = s - vec2(-0.72 + 0.32, 0.86 - lineH * 6.5);
  c = mix(c, vec3(0.85), blink * step(abs(cur.x), 0.012) * step(abs(cur.y), lineH * 0.3));
  return c;
}

vec3 albedoOf(float mat, vec3 P, vec3 N, float px) {
  if (mat == M_FLOOR) return floorAlbedo(P, px);
  if (mat == M_PLASTER) return vec3(0.88, 0.865, 0.835) * (0.985 + 0.03 * noise2(P.xy * 31.0 + P.zz * 17.0));
  if (mat == M_CUT) return vec3(0.9, 0.89, 0.87);
  if (mat == M_SKIRT || mat == M_SILL) return vec3(0.9, 0.895, 0.88);
  if (mat == M_STEEL) return vec3(0.032, 0.033, 0.036);
  if (mat == M_DESK) return deskAlbedo(P, N);
  if (mat == M_CHAIR) return vec3(0.33, 0.21, 0.13) * (0.92 + 0.12 * noise2(vec2(P.y * 40.0, (P.x + P.z) * 4.0)));
  if (mat == M_LEAF) return leafAlbedo(P);
  if (mat == M_STEM) return vec3(0.17, 0.15, 0.08);
  if (mat == M_POT) return vec3(0.8, 0.78, 0.74) * (0.97 + 0.05 * noise2(P.xz * 60.0 + P.y * 40.0));
  if (mat == M_SOIL) return vec3(0.09, 0.07, 0.055);
  if (mat == M_COFFEE) return vec3(0.12, 0.065, 0.03);
  if (mat == M_MUG) return vec3(0.88, 0.87, 0.84);
  if (mat == M_BOOK1) return abs(N.y) > 0.5 ? vec3(0.44, 0.51, 0.44) : vec3(0.86, 0.83, 0.74);
  if (mat == M_BOOK2) return abs(N.y) > 0.5 ? vec3(0.78, 0.68, 0.52) : vec3(0.88, 0.85, 0.77);
  if (mat == M_BOOK3) return abs(N.y) > 0.5 ? vec3(0.2, 0.2, 0.22) : vec3(0.86, 0.83, 0.74);
  if (mat == M_RUG) return rugAlbedo(P, px);
  if (mat == M_KEYS) return vec3(0.8, 0.8, 0.79);
  if (mat == M_SHADE_IN) return vec3(0.88, 0.86, 0.82);
  if (mat == M_CLOCK) return N.z > 0.8 ? clockFace(P, px) : vec3(0.9, 0.9, 0.89);
  if (mat == M_PRINT) return N.z > 0.8 ? printArt(P, px) : vec3(0.12, 0.11, 0.1);
  return vec3(0.5);
}

/* --- light ---------------------------------------------------------------- */

float furnitureShadow(vec3 ro, vec3 rd, float tmax, float k, bool lampToo, int steps) {
  vec3 inv = safeInv(rd);
  vec2 a = boxRange(ro, inv, DESKB_C, DESKB_H);
  vec2 b = boxRange(ro, inv, CHAIRB_C, CHAIRB_H);
  vec2 c = boxRange(ro, inv, PLANTB_C, PLANTB_H);
  vec2 d = boxRange(ro, inv, DECOB_C, DECOB_H);
  float t0 = 1e9;
  float t1 = -1e9;
  if (a.x < a.y && a.y > 0.0) { t0 = min(t0, a.x); t1 = max(t1, a.y); }
  if (b.x < b.y && b.y > 0.0) { t0 = min(t0, b.x); t1 = max(t1, b.y); }
  if (c.x < c.y && c.y > 0.0) { t0 = min(t0, c.x); t1 = max(t1, c.y); }
  if (d.x < d.y && d.y > 0.0) { t0 = min(t0, d.x); t1 = max(t1, d.y); }
  float t = max(t0, 0.012);
  float end = min(t1, tmax);
  if (t >= end) return 1.0;
  float res = 1.0;
  for (int i = 0; i < 64; i++) {
    if (i >= steps) break;
    float h = occluders(ro + rd * t, lampToo);
    res = min(res, k * h / t);
    if (res < 0.004) return 0.0;
    t += clamp(h, 0.006, 0.3);
    if (t >= end) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}

float spec(vec3 N, vec3 L, vec3 V, float shininess) {
  vec3 h = normalize(L + V);
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(h, V), 0.0, 1.0), 5.0);
  return pow(max(dot(N, h), 0.0), shininess) * f * (shininess + 8.0) / 25.0;
}

void gloss(float mat, out float shine, out float amount) {
  shine = 12.0; amount = 0.0;
  if (mat == M_FLOOR) { shine = 36.0; amount = 0.32; }
  else if (mat == M_DESK) { shine = 30.0; amount = 0.22; }
  else if (mat == M_STEEL) { shine = 70.0; amount = 0.6; }
  else if (mat == M_SCREEN) { shine = 260.0; amount = 1.0; }
  else if (mat == M_MUG) { shine = 90.0; amount = 0.55; }
  else if (mat == M_LEAF) { shine = 28.0; amount = 0.3; }
  else if (mat == M_KEYS) { shine = 24.0; amount = 0.12; }
  else if (mat == M_CHAIR) { shine = 24.0; amount = 0.18; }
  else if (mat == M_COFFEE) { shine = 160.0; amount = 0.9; }
  else if (mat == M_CLOCK || mat == M_PRINT) { shine = 120.0; amount = 0.25; }
}

/** The sky outside, as seen through the glass (a little landscape, stars, the moon). */
vec3 windowView(vec3 P, float px) {
  float v = clamp((P.y - WY0) / (WY1 - WY0), 0.0, 1.0);
  float u = clamp((P.z - WZ0) / (WZ1 - WZ0), 0.0, 1.0);
  const float HORIZON = 0.26;
  vec3 sky = mix(uSkyLow, uSkyTop, smoothstep(HORIZON, 0.95, v));
  // the low sun warms the side of the sky it's on
  sky += uSkyLow * 0.35 * smoothstep(0.2, 1.0, u) * (1.0 - smoothstep(HORIZON, 0.7, v)) * (1.0 - uNight);
  // stars
  if (uNight > 0.01) {
    vec2 g = vec2(u * 26.0, v * 24.0);
    vec2 cell = floor(g);
    float rnd = hash12(cell);
    vec2 sp = fract(g) - (0.25 + 0.5 * vec2(hash12(cell + 3.1), hash12(cell + 7.7)));
    float star = step(0.82, rnd) * smoothstep(0.09, 0.0, length(sp)) * (0.6 + 0.4 * sin(uTime * (1.0 + rnd * 2.0) + rnd * 40.0));
    sky += vec3(0.75, 0.8, 1.0) * star * uNight * 0.9 * smoothstep(HORIZON, HORIZON + 0.15, v);
    // a crescent moon, high on the right
    vec2 m = vec2((u - 0.28) * 1.0, (v - 0.74) * 0.95);
    float disc = length(m) - 0.075;
    float bite = length(m - vec2(0.032, 0.022)) - 0.068;
    float moon = (1.0 - smoothstep(-0.006, 0.006, disc)) * smoothstep(-0.006, 0.006, bite);
    sky += vec3(0.95, 0.93, 0.85) * moon * uNight * 1.6;
    sky += vec3(0.4, 0.45, 0.6) * exp(-dot(m, m) * 90.0) * uNight * 0.12;
  }
  // far hills
  float hill = HORIZON - 0.02 + 0.045 * sin(u * 4.3 + 1.1) + 0.02 * sin(u * 11.0 + 0.3);
  float hills = 1.0 - smoothstep(hill - 0.006, hill + 0.006, v);
  vec3 land = mix(uSkyLow * 0.42 + uSkyTop * 0.2, vec3(0.006, 0.008, 0.016), uNight);
  sky = mix(sky, land, hills);
  // the glass: a faint reflection streak
  float streak = smoothstep(0.0, 0.02, abs(fract((u - v) * 1.4 + 0.2) - 0.5) - 0.44);
  sky += vec3(0.04) * (1.0 - streak) * (1.0 - uNight * 0.6);
  return sky;
}

vec3 shade(vec3 P, vec3 N, float mat, float ao, vec3 V, float px) {
  if (mat == M_GLASS) return windowView(P, px);
  vec3 albedo = albedoOf(mat, P, N, px);
  float shine; float glossy;
  gloss(mat, shine, glossy);
  vec3 col = vec3(0.0);

  if (mat == M_CUT) {
    // outside the room: the studio's light, and the sun straight on
    float ndl = max(dot(N, uWinDir), 0.0) * uSunShare;
    return albedo * (uStudio * (0.55 + 0.45 * ao) + uWinCol * ndl);
  }

  // the window as a big soft light (the sky)
  vec3 wc = vec3(0.0, (WY0 + WY1) * 0.5, (WZ0 + WZ1) * 0.5);
  vec3 tw = wc - P;
  float d2 = dot(tw, tw);
  vec3 lw = tw * inversesqrt(d2 + 1e-6);
  float cosW = clamp(-lw.x, 0.0, 1.0);
  float cosR = 0.65 * max(dot(N, lw), 0.0) + 0.35 * (0.5 + 0.5 * dot(N, lw));
  float area = (WY1 - WY0) * (WZ1 - WZ0);
  vec3 skyRad = mix(uSkyLow, uSkyTop, 0.35);
  // light from a window reads close to white indoors: keep only some of the sky's tint
  skyRad = mix(vec3(dot(skyRad, vec3(0.2126, 0.7152, 0.0722))), skyRad, 0.55);
  col += albedo * skyRad * (area * cosW * cosR / (d2 + area * 0.6)) * (0.35 + 0.65 * ao);
  // light that has gone round the room
  col += albedo * uAmb * ao;

  // the bright patch, bouncing back into the room
  vec3 tb = uBounceAt - P;
  float bd2 = dot(tb, tb);
  vec3 lb = tb * inversesqrt(bd2 + 1e-6);
  col += albedo * uBounceCol * (0.3 + 0.7 * max(dot(N, lb), 0.0)) / (0.35 + bd2) * (0.4 + 0.6 * ao);

  // sun or moon through the window
  float ndl = dot(N, uWinDir);
  bool leaf = mat == M_LEAF;
  if ((ndl > 0.0 || leaf) && dot(uWinCol, vec3(1.0)) > 0.0005) {
    float s0;
    vec3 start = P + N * (ndl > 0.0 ? 0.004 : -0.004);
    float m = aperture(start, uWinDir, s0);
    if (m > 0.002) {
      float sh = furnitureShadow(leaf ? P + uWinDir * 0.02 : start, uWinDir, s0, 16.0, true, SHADOW_STEPS);
      float vis = m * sh;
      if (ndl > 0.0) {
        col += albedo * uWinCol * ndl * vis;
        col += uWinCol * vis * spec(N, uWinDir, V, shine) * glossy * ndl;
      }
      if (leaf && ndl < 0.0) {
        // light through the leaf
        col += vec3(0.32, 0.5, 0.1) * uWinCol * (-ndl) * vis * 0.55;
      }
    }
  }

  // the desk lamp: a spot with soft shadows, plus what leaks out of the shade
  if (uLamp > 0.001) {
    vec3 tl = LAMP_BULB - P;
    float ld2 = dot(tl, tl);
    float ld = sqrt(ld2);
    vec3 ll = tl / ld;
    float cone = smoothstep(0.62, 0.86, dot(-ll, LAMP_AXIS));
    float lndl = max(dot(N, ll), 0.0);
    vec3 lampCol = vec3(1.0, 0.7, 0.42) * uLamp;
    if (mat == M_BULB) return vec3(9.0, 6.6, 4.0) * uLamp + vec3(0.25) * albedo;
    if (mat == M_SHADE_IN) {
      col += lampCol * 1.6 * (0.4 + 0.6 * lndl) / (0.6 + ld2 * 40.0) * 3.0;
    } else if (lndl > 0.0) {
      float sh = cone > 0.01 ? furnitureShadow(P + N * 0.003, ll, ld - 0.05, 10.0, false, LAMP_STEPS) : 1.0;
      float power = (cone * 1.0 + 0.035) * sh;
      col += albedo * lampCol * lndl * power * 0.9 / (ld2 + 0.03);
      col += lampCol * lndl * power * spec(N, ll, V, shine) * glossy * 0.5 / (ld2 + 0.03);
    }
    // the pool on the desk bouncing back up
    vec3 pool = vec3(2.98, DESK_Y + 0.05, 0.56) - P;
    float pd2 = dot(pool, pool);
    col += albedo * lampCol * 0.06 * (0.4 + 0.6 * max(dot(N, pool * inversesqrt(pd2 + 1e-6)), 0.0)) / (0.12 + pd2);
  } else if (mat == M_BULB) {
    col += albedo * 0.0;
  }

  // the screen's glow
  if (uScreen > 0.001) {
    vec3 sc = vec3(MON_C.x, MON_C.y, MON_C.z + 0.05);
    vec3 ts = sc - P;
    float sd2 = dot(ts, ts);
    vec3 ls = ts * inversesqrt(sd2 + 1e-6);
    float cosS = clamp(-ls.z, 0.0, 1.0);
    vec3 screenCol = vec3(0.62, 0.7, 0.9) * uScreen;
    col += albedo * screenCol * max(dot(N, ls), 0.0) * cosS * 0.12 / (sd2 + 0.04);
  }

  if (mat == M_SCREEN) {
    // glass: the picture when it's on, a dark reflection either way
    col = vec3(0.004, 0.0045, 0.006) + skyRad * 0.02;
    col += screenImage(P, px) * uScreen * 1.25;
    float fres = 0.05 + 0.25 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);
    col += mix(uSkyLow, uSkyTop, 0.5) * fres * 0.25;
  }
  return col;
}

vec3 background(vec2 frag, vec3 ro, vec3 rd) {
  vec3 bg = uBg;
  // a soft contact shadow round the base
  float t = (-SLAB - ro.y) / rd.y;
  vec3 g = ro + rd * t;
  vec2 dd = abs(g.xz - vec2((RW - RT) * 0.5, (RD - RT) * 0.5)) - vec2((RW + RT) * 0.5, (RD + RT) * 0.5);
  float sd = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0);
  float shadow = exp(-max(sd, 0.0) * 9.0) * 0.16 + exp(-max(sd, 0.0) * 2.2) * 0.06;
  bg *= 1.0 - shadow * (uDark > 0.5 ? 2.4 : 1.0);
  // the sun's glow, and the disc (a crescent moon after dark)
  vec2 d = frag - uSun.xy;
  float r = length(d);
  float R = uSun.z;
  if (R > 0.0) {
    vec3 glowCol = mix(vec3(0.55, 0.62, 0.8), vec3(1.0, 0.72, 0.42), uSun.w);
    float glow = exp(-r * r / (R * R * 22.0)) * 0.28 + exp(-r * r / (R * R * 3.2)) * 0.35;
    bg = mix(bg, glowCol, clamp(glow * uGlow, 0.0, 1.0) * (uDark > 0.5 ? 0.75 : 0.55));
    float aa = 1.0;
    float disc = 1.0 - smoothstep(R - aa, R + aa, r);
    // a warm gradient with a slightly deeper rim, so the sun holds its own on a light stage
    float k = clamp(r / R, 0.0, 1.0);
    vec3 core = mix(vec3(1.0, 0.97, 0.86), uDisc, smoothstep(0.15, 1.0, k));
    core = mix(core, uDisc * vec3(0.97, 0.86, 0.78), smoothstep(0.78, 1.0, k) * 0.7);
    // the moon: lit disc minus a bite, cool
    float bite = smoothstep(R * 0.95 - aa, R * 0.95 + aa, length(d - vec2(R * 0.5, R * 0.3)));
    vec3 moonCol = uDark > 0.5 ? vec3(0.86, 0.88, 0.94) : vec3(0.58, 0.62, 0.7);
    vec3 discCol = mix(moonCol, core, uSun.w);
    float discA = disc * mix(bite, 1.0, uSun.w);
    bg = mix(bg, discCol, discA);
  }
  return bg;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  ivec2 ip = ivec2(frag);
  vec4 g0 = texelFetch(uG0, ip, 0);
  vec4 g1 = texelFetch(uG1, ip, 0);
  vec3 ro, rd;
  cameraRay(frag, ro, rd);
  if (g1.a < 0.5) {
    vec2 d = frag - uSun.xy;
    float disc = uSun.z > 0.0 ? 1.0 - smoothstep(uSun.z - 1.0, uSun.z + 1.0, length(d)) : 0.0;
    outColor = vec4(background(frag, ro, rd), disc * 0.6);
    return;
  }
  float depth = unpackDepth(g0.rg) * DEPTH_RANGE;
  vec3 P = ro + rd * depth;
  vec3 N = normalize(g1.rgb * 2.0 - 1.0);
  float mat = floor(g0.b * 255.0 + 0.5);
  float ao = g0.a;
  float px = uView.z;
  vec3 hdr = shade(P, N, mat, ao, -rd, px);
  if (mat == M_CUT) {
    outColor = vec4(toDisplay(hdr, 1.0), 0.0);
    return;
  }
  outColor = vec4(toDisplay(hdr, uExposure), 1.0);
}
`}(o)),this.shaft=(0,f.createProgram)(e,ep,function(e){return`${ev}
${ed()}
#define SHAFT_STEPS ${e.shaftSteps}
uniform sampler2D uG0;
uniform sampler2D uG1;
uniform vec3 uWinDir;
uniform vec3 uWinCol;
uniform float uShaft;
uniform float uExposure;
uniform vec2 uFull; // the full internal size
out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  outColor = vec4(0.0, 0.0, 0.0, 1.0);
  if (uShaft <= 0.0 || uWinDir.x > -0.004) return;
  vec2 frag = gl_FragCoord.xy * 2.0;
  ivec2 ip = ivec2(clamp(frag, vec2(0.0), uFull - 1.0));
  vec4 g0 = texelFetch(uG0, ip, 0);
  vec4 g1 = texelFetch(uG1, ip, 0);
  if (g1.a < 0.5) return;
  float mat = floor(g0.b * 255.0 + 0.5);
  if (mat == M_CUT) return;
  float depth = unpackDepth(g0.rg) * DEPTH_RANGE;
  vec3 ro, rd;
  cameraRay(frag, ro, rd);
  vec2 tr = boxRange(ro, safeInv(rd), vec3(RW * 0.5, RH * 0.5, RD * 0.5), vec3(RW * 0.5, RH * 0.5, RD * 0.5));
  float t0 = max(tr.x, 0.0);
  float t1 = min(tr.y, depth);
  if (t1 <= t0) return;
  float dt = (t1 - t0) / float(SHAFT_STEPS);
  float jitter = hash12(gl_FragCoord.xy);
  float acc = 0.0;
  float s0;
  for (int i = 0; i < SHAFT_STEPS; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + jitter) * dt);
    // thicker air lower down, where the dust hangs
    acc += aperture(p, uWinDir, s0) * (1.15 - 0.3 * p.y / RH);
  }
  acc *= dt;
  float mu = dot(uWinDir, rd);
  const float G = 0.55;
  float hg = (1.0 - G * G) / pow(1.0 + G * G - 2.0 * G * mu, 1.5);
  vec3 s = uWinCol * acc * uShaft * (0.25 + 0.2 * hg) * uExposure;
  outColor = vec4(1.0 - exp(-s), 1.0);
}
`}(o)),this.motes=(0,f.createProgram)(e,`${ev}
${ed()}
in vec4 aSeed;
uniform sampler2D uG0;
uniform vec2 uSize;     // internal px
uniform float uTime;
uniform float uStir;
uniform vec3 uWinDir;
uniform float uScale;   // point size multiplier
out float vBright;
out float vGlint;

void main() {
  vec3 b = aSeed.xyz;
  float ph = aSeed.w * 6.2831853;
  float t = uTime;
  vec3 p;
  p.x = 0.12 + b.x * 3.6 + sin(t * 0.13 + ph) * 0.14 + sin(t * 0.41 + ph * 2.3) * 0.035;
  p.z = 0.15 + b.z * 3.9 + cos(t * 0.11 + ph * 1.7) * 0.14 + sin(t * 0.37 + ph * 3.1) * 0.035;
  p.y = 0.08 + mod(b.y * 2.4 + t * (0.008 + 0.012 * fract(aSeed.w * 7.31)) + sin(t * 0.23 + ph) * 0.06, 2.4);
  // stirred by a fast sun (the air "moves" with the light): a little swirl
  p.x += uStir * sin(t * 2.3 + ph * 5.0) * 0.07;
  p.y += uStir * cos(t * 1.9 + ph * 3.0) * 0.05;
  p.z += uStir * sin(t * 2.1 + ph * 4.0) * 0.07;
  float s0;
  float lit = aperture(p, uWinDir, s0);
  vec3 d = p - CAM_TARGET;
  vec2 px = uView.xy + vec2(dot(d, CAM_RIGHT), dot(d, CAM_UP)) / uView.z;
  float tMote = FAR - dot(d, CAM_BACK);
  ivec2 ip = ivec2(clamp(px, vec2(0.0), uSize - 1.0));
  float tScene = unpackDepth(texelFetch(uG0, ip, 0).rg) * DEPTH_RANGE;
  float seen = tMote < tScene - 0.004 ? 1.0 : 0.0;
  float glint = pow(0.5 + 0.5 * sin(t * (1.2 + fract(aSeed.w * 13.7) * 2.0) + ph * 7.0), 6.0);
  vBright = lit * seen;
  vGlint = glint;
  float size = (0.8 + 1.1 * fract(aSeed.w * 3.17)) * uScale * (0.85 + 0.4 * glint);
  gl_PointSize = size * 2.4;
  gl_Position = vBright > 0.004 ? vec4(px / uSize * 2.0 - 1.0, 0.0, 1.0) : vec4(2.0, 2.0, 0.0, 1.0);
}
`,ex),this.bright=(0,f.createProgram)(e,ep,eg),this.blur=(0,f.createProgram)(e,ep,eb),this.composite=(0,f.createProgram)(e,ep,ew),this.uG=(0,f.uniformLocations)(e,this.gbuf),this.uL=(0,f.uniformLocations)(e,this.light),this.uS=(0,f.uniformLocations)(e,this.shaft),this.uM=(0,f.uniformLocations)(e,this.motes),this.uB=(0,f.uniformLocations)(e,this.bright),this.uBl=(0,f.uniformLocations)(e,this.blur),this.uC=(0,f.uniformLocations)(e,this.composite);const r=e.createVertexArray(),n=e.createVertexArray(),i=e.createBuffer();if(!r||!n||!i)throw Error("golden-room: no buffers");this.vao=r,this.moteVao=n,this.moteBuffer=i,this.moteCount="stage"===t?520:110;const l=new Float32Array(4*this.moteCount),s=(0,a.seededRandom)(24605);for(let e=0;e<l.length;e++)l[e]=s();e.bindVertexArray(n),e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,l,e.STATIC_DRAW);const c=e.getAttribLocation(this.motes,"aSeed");e.enableVertexAttribArray(c),e.vertexAttribPointer(c,4,e.FLOAT,!1,0,0),e.bindVertexArray(null),e.bindBuffer(e.ARRAY_BUFFER,null)}setSize(e,t){let o=this.gl;if(e=Math.max(2,Math.round(e)),t=Math.max(2,Math.round(t)),e===this.w&&t===this.h&&this.lit)return;this.w=e,this.h=t,this.g0&&o.deleteTexture(this.g0),this.g1&&o.deleteTexture(this.g1),this.gFbo&&o.deleteFramebuffer(this.gFbo),eT(o,this.lit),eT(o,this.bloomA),eT(o,this.bloomB),eT(o,this.shaftA),eT(o,this.shaftB),this.g0=eR(o,e,t,o.NEAREST),this.g1=eR(o,e,t,o.NEAREST);let r=o.createFramebuffer();if(!r)throw Error("golden-room: no framebuffer");o.bindFramebuffer(o.FRAMEBUFFER,r),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,this.g0,0),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT1,o.TEXTURE_2D,this.g1,0),o.drawBuffers([o.COLOR_ATTACHMENT0,o.COLOR_ATTACHMENT1]),o.bindFramebuffer(o.FRAMEBUFFER,null),this.gFbo=r,this.lit=eM(o,e,t,o.LINEAR);let a=Math.max(1,Math.round(e/4)),n=Math.max(1,Math.round(t/4));this.bloomA=eM(o,a,n,o.LINEAR),this.bloomB=eM(o,a,n,o.LINEAR);let i=Math.max(1,Math.ceil(e/2)),l=Math.max(1,Math.ceil(t/2));this.shaftA=eM(o,i,l,o.LINEAR),this.shaftB=eM(o,i,l,o.LINEAR),this.gDirty=!0}get width(){return this.w}get height(){return this.h}invalidate(){this.gDirty=!0}drawGBuffer(e){let t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,this.gFbo),t.viewport(0,0,this.w,this.h),t.useProgram(this.gbuf),t.uniform3f(this.uG("uView"),e.viewX,e.viewY,e.unitsPerPx),t.bindVertexArray(this.vao),t.drawArrays(t.TRIANGLES,0,3),this.gView[0]=e.viewX,this.gView[1]=e.viewY,this.gView[2]=e.unitsPerPx,this.gDirty=!1}draw(e,t,o){let r=this.gl,a=this.lit,n=this.bloomA,i=this.bloomB,l=this.shaftA,s=this.shaftB;if(!a||!n||!i||!l||!s||!this.g0||!this.g1)return;r.disable(r.DEPTH_TEST),r.disable(r.BLEND),(this.gDirty||this.gView[0]!==e.viewX||this.gView[1]!==e.viewY||this.gView[2]!==e.unitsPerPx)&&this.drawGBuffer(e),r.bindVertexArray(this.vao);let c=e.light,u=this.uL;r.bindFramebuffer(r.FRAMEBUFFER,a.fbo),r.viewport(0,0,this.w,this.h),r.useProgram(this.light),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.g0),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,this.g1),r.uniform1i(u("uG0"),0),r.uniform1i(u("uG1"),1),r.uniform3f(u("uView"),e.viewX,e.viewY,e.unitsPerPx),r.uniform3f(u("uWinDir"),c.winDir[0],c.winDir[1],c.winDir[2]),r.uniform3f(u("uWinCol"),c.winCol[0],c.winCol[1],c.winCol[2]),r.uniform1f(u("uSunShare"),c.sunShare),r.uniform3f(u("uSkyTop"),c.skyTop[0],c.skyTop[1],c.skyTop[2]),r.uniform3f(u("uSkyLow"),c.skyLow[0],c.skyLow[1],c.skyLow[2]),r.uniform3f(u("uAmb"),c.ambient[0],c.ambient[1],c.ambient[2]),r.uniform3f(u("uStudio"),e.studio[0],e.studio[1],e.studio[2]),r.uniform3f(u("uBounceAt"),c.bounceAt[0],c.bounceAt[1],c.bounceAt[2]),r.uniform3f(u("uBounceCol"),c.bounceCol[0],c.bounceCol[1],c.bounceCol[2]),r.uniform1f(u("uLamp"),e.lamp),r.uniform1f(u("uScreen"),e.screen),r.uniform1f(u("uNight"),c.night),r.uniform1f(u("uExposure"),c.exposure),r.uniform1f(u("uHour"),e.hour),r.uniform1f(u("uTime"),e.time),r.uniform3f(u("uBg"),e.bg[0],e.bg[1],e.bg[2]),r.uniform1f(u("uDark"),+!!e.dark),r.uniform4f(u("uSun"),e.sunX,e.sunY,e.sunR,c.discSun),r.uniform3f(u("uDisc"),c.disc[0],c.disc[1],c.disc[2]),r.uniform1f(u("uGlow"),e.glow),r.drawArrays(r.TRIANGLES,0,3);let f=Math.min(this.moteCount,Math.max(0,Math.round(e.motes)));if(f>0){let t=this.uM;r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE),r.useProgram(this.motes),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.g0),r.uniform1i(t("uG0"),0),r.uniform3f(t("uView"),e.viewX,e.viewY,e.unitsPerPx),r.uniform2f(t("uSize"),this.w,this.h),r.uniform1f(t("uTime"),e.time),r.uniform1f(t("uStir"),e.stir),r.uniform3f(t("uWinDir"),c.winDir[0],c.winDir[1],c.winDir[2]),r.uniform1f(t("uScale"),e.moteScale),r.uniform3f(t("uColor"),e.moteColor[0],e.moteColor[1],e.moteColor[2]),r.bindVertexArray(this.moteVao),r.drawArrays(r.POINTS,0,f),r.bindVertexArray(this.vao),r.disable(r.BLEND)}let h=this.uS;r.useProgram(this.shaft),r.bindFramebuffer(r.FRAMEBUFFER,l.fbo),r.viewport(0,0,l.w,l.h),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.g0),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,this.g1),r.uniform1i(h("uG0"),0),r.uniform1i(h("uG1"),1),r.uniform3f(h("uView"),e.viewX,e.viewY,e.unitsPerPx),r.uniform3f(h("uWinDir"),c.winDir[0],c.winDir[1],c.winDir[2]),r.uniform3f(h("uWinCol"),c.winCol[0],c.winCol[1],c.winCol[2]),r.uniform1f(h("uShaft"),e.shaft),r.uniform1f(h("uExposure"),c.exposure),r.uniform2f(h("uFull"),this.w,this.h),r.drawArrays(r.TRIANGLES,0,3),r.useProgram(this.blur),r.activeTexture(r.TEXTURE0),r.uniform1i(this.uBl("uSrc"),0),r.bindFramebuffer(r.FRAMEBUFFER,s.fbo),r.bindTexture(r.TEXTURE_2D,l.tex),r.uniform2f(this.uBl("uStep"),1/l.w,0),r.drawArrays(r.TRIANGLES,0,3),r.bindFramebuffer(r.FRAMEBUFFER,l.fbo),r.bindTexture(r.TEXTURE_2D,s.tex),r.uniform2f(this.uBl("uStep"),0,1/l.h),r.drawArrays(r.TRIANGLES,0,3),r.useProgram(this.bright),r.bindFramebuffer(r.FRAMEBUFFER,n.fbo),r.viewport(0,0,n.w,n.h),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,a.tex),r.uniform1i(this.uB("uSrc"),0),r.uniform2f(this.uB("uTexel"),1/this.w,1/this.h),r.drawArrays(r.TRIANGLES,0,3),r.useProgram(this.blur),r.uniform1i(this.uBl("uSrc"),0);for(let e=0;e<2;e++){let t=0===e?1:2.2;r.bindFramebuffer(r.FRAMEBUFFER,i.fbo),r.bindTexture(r.TEXTURE_2D,n.tex),r.uniform2f(this.uBl("uStep"),t/n.w,0),r.drawArrays(r.TRIANGLES,0,3),r.bindFramebuffer(r.FRAMEBUFFER,n.fbo),r.bindTexture(r.TEXTURE_2D,i.tex),r.uniform2f(this.uBl("uStep"),0,t/n.h),r.drawArrays(r.TRIANGLES,0,3)}r.bindFramebuffer(r.FRAMEBUFFER,null),r.viewport(0,0,t,o),r.useProgram(this.composite),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,a.tex),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,n.tex),r.activeTexture(r.TEXTURE2),r.bindTexture(r.TEXTURE_2D,l.tex),r.uniform1i(this.uC("uLit"),0),r.uniform1i(this.uC("uBloom"),1),r.uniform1i(this.uC("uShafts"),2),r.uniform2f(this.uC("uTexel"),1/this.w,1/this.h),r.uniform1f(this.uC("uBloomAmt"),e.bloom),r.drawArrays(r.TRIANGLES,0,3),r.activeTexture(r.TEXTURE0),r.bindVertexArray(null)}dispose(){let e=this.gl;for(let t of[this.gbuf,this.light,this.shaft,this.motes,this.bright,this.blur,this.composite])e.deleteProgram(t);e.deleteVertexArray(this.vao),e.deleteVertexArray(this.moteVao),e.deleteBuffer(this.moteBuffer),this.g0&&e.deleteTexture(this.g0),this.g1&&e.deleteTexture(this.g1),this.gFbo&&e.deleteFramebuffer(this.gFbo),eT(e,this.lit),eT(e,this.bloomA),eT(e,this.bloomB),eT(e,this.shaftA),eT(e,this.shaftB),this.lit=this.bloomA=this.bloomB=this.shaftA=this.shaftB=null,this.g0=this.g1=null,this.gFbo=null}}let eE=0;function eA(e,t){if("function"!=typeof e.createStereoPanner)return null;let o=e.createStereoPanner();return o.pan.value=Math.max(-.8,Math.min(.8,t)),o}function eS(e,t=.4){if(!(0,r.audioReady)())return;let o=(0,r.getAudio)();if(!o)return;let{ctx:a,output:n}=o,i=a.currentTime,l=eA(a,t),s=l?(l.connect(n),l):n;for(let[e,t,o]of[[0,2300,.2],[.024,1700,.13]]){let n=a.createBufferSource();n.buffer=(0,r.noiseBuffer)(a);let l=a.createBiquadFilter();l.type="bandpass",l.frequency.value=t,l.Q.value=1.4;let c=a.createGain();c.gain.setValueAtTime(0,i+e),c.gain.linearRampToValueAtTime(o,i+e+.0012),c.gain.exponentialRampToValueAtTime(1e-4,i+e+.022),n.connect(l).connect(c).connect(s),n.start(i+e,.5*Math.random(),.04)}let c=a.createOscillator();c.type="sine",c.frequency.setValueAtTime(300,i),c.frequency.exponentialRampToValueAtTime(140,i+.05);let u=a.createGain();if(u.gain.setValueAtTime(0,i),u.gain.linearRampToValueAtTime(.14,i+.003),u.gain.exponentialRampToValueAtTime(1e-4,i+.08),c.connect(u).connect(s),c.start(i),c.stop(i+.1),e)for(let[e,t]of[[1,.022],[2.76,.008]]){let o=a.createOscillator();o.type="sine",o.frequency.value=3150*e;let r=a.createGain();r.gain.setValueAtTime(0,i+.05),r.gain.linearRampToValueAtTime(t,i+.056),r.gain.exponentialRampToValueAtTime(1e-4,i+.5),o.connect(r).connect(s),o.start(i+.05),o.stop(i+.55)}}let eC={light:19.3,dark:21.6},eL={stiffness:260,damping:31},eD={stiffness:40,damping:12.6},eP={stiffness:8,damping:5.8},eB=[1,.8,.64],ek={light:[1.24,1.23,1.21],dark:[.068,.068,.072]},eN=V();function eO(e,t){let o=e.trim(),r=o.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(r){let e=3===r[1].length?r[1].replace(/./g,e=>e+e):r[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let a=o.match(/[\d.]+/g);return a&&a.length>=3?[a[0]/255,a[1]/255,a[2]/255]:t}function eF({mode:e,active:i,reducedMotion:f,theme:p}){let x="stage"===e,[g]=(0,o.useState)(()=>{let e,t,o,r;return e=eC[p],o=Y(t=x?f?e:e-3:f?e:16.4,{dir:[0,1,0],elevation:0,bearing:0}),r={sun:V(),winDir:[0,1,0],winCol:[0,0,0],sunShare:1,skyTop:[0,0,0],skyLow:[0,0,0],ambient:[0,0,0],bounceAt:[1,0,1],bounceCol:[0,0,0],day:1,night:0,exposure:1,disc:[1,1,1],discSun:1},{hour:new a.Spring(t,eD),held:new a.Spring(0,{stiffness:380,damping:22}),goal:t,drag:null,lampOn:o.elevation<-3.2,lampLevel:+(o.elevation<-3.2),lampT:10,screenOn:o.elevation<.6,screenLevel:+(o.elevation<.6),screenT:10,prevEl:o.elevation,light:r,frame:{viewX:0,viewY:0,unitsPerPx:.01,light:r,lamp:0,screen:0,hour:t,time:0,shaft:0,stir:0,bg:[.95,.95,.95],dark:"dark"===p,studio:[...ek[p]],sunX:0,sunY:0,sunR:0,glow:0,bloom:.5,motes:0,moteScale:1,moteColor:[1,.86,.62]},layout:J(),sun:{x:0,y:0},clock:0,stir:0,hovering:!1,hover:0,tileHour:t,acc:0,renderStep:0,perf:{time:0,slow:0},bg:"dark"===p?[.137,.137,.137]:[.949,.949,.949],bgHover:"dark"===p?[.165,.165,.165]:[.922,.922,.922],studio:[...ek[p]],k:1,lastInput:-10,prevHour:t,introPending:x&&!f,minute:NaN,phase:"",handleX:NaN,handleY:NaN,night:o.elevation<-.6,theme:p,reduced:f}}),b=(0,o.useRef)(null),w=(0,o.useRef)(null),y=(0,o.useRef)(null),R=(0,o.useRef)(null),M=(0,o.useRef)(null),T=(0,o.useRef)(null),_=(0,o.useRef)(null),E=`gr-sun-${(0,o.useId)().replace(/[^a-zA-Z0-9_-]/g,"")}`,A=(0,a.useFinePointer)(),S=(0,o.useId)(),[C,L]=(0,o.useState)(null),[D,P]=(0,o.useState)(g.night),[B,k]=(0,o.useState)(g.lampOn),[N,O]=(0,o.useState)(g.screenOn),[F,W]=(0,o.useState)(!1),[H,U]=(0,o.useState)(!1),[I,z]=(0,o.useState)(!0),G=(0,o.useCallback)(()=>{let t=b.current,{width:o,height:r,dpr:a}=en.current;if(!t||o<2||r<2)return;let n=(x&&a>=1.5?Math.min(a,1.5):a)*(x?eB[g.renderStep]:1);t.setSize(o*n,r*n),g.k=t.width/o,et(o,r,e,o<560?92:102,g.layout)},[x,e]),q=(0,o.useCallback)(()=>{if(!x)return;let{width:e,height:t}=en.current,o=g.layout,r={x:0,y:0},a="",n="",i=null;for(let e=6;e<=23.500001;e+=.125){eo(e,o,r);let t=Y(e,g.light.sun).elevation<-.6,l=`${r.x.toFixed(1)} ${r.y.toFixed(1)}`;t?n+=!0===i?` L${l}`:`M${l}`:a+=!1===i?` L${l}`:`M${l}`,null!==i&&i!==t&&(t?a+=` L${l}`:n+=` L${l}`),i=t}Y(g.hour.value,g.light.sun),L({day:a,night:n,w:e,h:t}),z(e>=640)},[x]),$=(0,o.useCallback)((e,t)=>{g.lampOn!==e&&(g.lampOn=e,g.lampT=0,k(e),t&&x&&eS(e,.45))},[x]),K=(0,o.useCallback)((e,t)=>{g.screenOn!==e&&(g.screenOn=e,g.screenT=0,O(e),t&&x&&e&&function(e=.2){if(!(0,r.audioReady)())return;let t=(0,r.getAudio)();if(!t)return;let{ctx:o,output:a}=t,n=o.currentTime,i=eA(o,e),l=i?(i.connect(a),i):a,s=o.createOscillator();s.type="sine",s.frequency.setValueAtTime(120,n),s.frequency.exponentialRampToValueAtTime(70,n+.12);let c=o.createGain();c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.1,n+.01),c.gain.exponentialRampToValueAtTime(1e-4,n+.2),s.connect(c).connect(l),s.start(n),s.stop(n+.22);let u=o.createBiquadFilter();for(let[e,t]of(u.type="lowpass",u.frequency.value=5200,u.connect(l),[[.06,1318.5],[.16,1975.5]])){let r=o.createOscillator();r.type="sine",r.frequency.value=t;let a=o.createGain();a.gain.setValueAtTime(0,n+e),a.gain.linearRampToValueAtTime(.026,n+e+.012),a.gain.exponentialRampToValueAtTime(1e-4,n+e+.7),r.connect(a).connect(u),r.start(n+e),r.stop(n+e+.75)}}(.25))},[x]),j=()=>{let e=b.current,t=ea.current,{width:o,height:r}=en.current;if(!e||!t||o<2||r<2)return!1;let n=g.layout,i=g.k,l=g.frame,s=g.hour.value,c=function(e,t,o,r){let n,i=Y(e,r.sun),l=i.elevation,s=function(e,t,o){if(e<=es[0].el){for(let e=0;e<3;e++)t[e]=es[0].top[e],o[e]=es[0].low[e];return es[0].exposure}for(let r=1;r<es.length;r++){let n=es[r];if(e<=n.el){let i=es[r-1],l=(0,a.smoothstep)(0,1,(e-i.el)/(n.el-i.el));for(let e=0;e<3;e++)t[e]=(0,a.lerp)(i.top[e],n.top[e],l),o[e]=(0,a.lerp)(i.low[e],n.low[e],l);return(0,a.lerp)(i.exposure,n.exposure,l)}}let r=es[es.length-1];for(let e=0;e<3;e++)t[e]=r.top[e],o[e]=r.low[e];return r.exposure}(l,r.skyTop,r.skyLow),c=1/(Math.sin(Math.max(0,n=Math.max(-1,l))*h)+.50572*Math.pow(Math.max(.5,n+6.07995),-1.6364)),u=(0,a.smoothstep)(-.9,1.2,l),f=2.7*Math.exp(-.04*c)*u,p=2.7*Math.exp(-.11*c)*u,x=2.7*Math.exp(-.28*c)*u,g=(0,a.smoothstep)(-4,-12,l),b=.1*g;(f+p+x)/3>=b?(r.winDir[0]=i.dir[0],r.winDir[1]=i.dir[1],r.winDir[2]=i.dir[2],r.winCol[0]=f,r.winCol[1]=p,r.winCol[2]=x,r.sunShare=1):(r.winDir[0]=X[0],r.winDir[1]=X[1],r.winDir[2]=X[2],r.winCol[0]=.46*b,r.winCol[1]=.6*b,r.winCol[2]=+b,r.sunShare=0),r.night=g,r.day=(0,a.smoothstep)(-10,6,l);let w=r.winDir,y=w[0]<-.001?-w[0]*d:0,R=1/0,M=ec;if(w[1]>.001&&(R=v[1]/w[1]),w[2]>.001){let e=v[2]/w[2];e<R&&(R=e,M=eu)}Number.isFinite(R)||(R=2),R=Math.min(R,4.5),r.bounceAt[0]=(0,a.clamp)(v[0]-w[0]*R,.1,m.W-.1),r.bounceAt[1]=(0,a.clamp)(v[1]-w[1]*R,.05,m.H-.1),r.bounceAt[2]=(0,a.clamp)(v[2]-w[2]*R,.05,m.D-.1);let T=.1*y;r.bounceCol[0]=r.winCol[0]*M[0]*T,r.bounceCol[1]=r.winCol[1]*M[1]*T,r.bounceCol[2]=r.winCol[2]*M[2]*T;let _=(r.skyTop[0]+r.skyLow[0])*.5,E=(r.skyTop[1]+r.skyLow[1])*.5,A=(r.skyTop[2]+r.skyLow[2])*.5;r.ambient[0]=.12*_+.012*t+.004*o,r.ambient[1]=.12*E+.008*t+.005*o,r.ambient[2]=.12*A+.005*t+.008*o,r.exposure=s*(0,a.lerp)(1,.82,t*g);let S=(0,a.smoothstep)(20,0,l);return r.disc[0]=1,r.disc[1]=(0,a.lerp)(.8,.52,S),r.disc[2]=(0,a.lerp)(.44,.26,S),r.discSun=(0,a.smoothstep)(-2.5,.5,l),r}(s,g.lampLevel,g.screenLevel,g.light);l.viewX=n.ox*i,l.viewY=(r-n.oy)*i,l.unitsPerPx=1/(n.scale*i),l.hour=s,l.time=g.clock,l.lamp=g.lampLevel,l.screen=g.screenLevel,l.stir=g.stir,l.dark="dark"===g.theme;let u=g.hover;l.bg[0]=(0,a.lerp)(g.bg[0],g.bgHover[0],u),l.bg[1]=(0,a.lerp)(g.bg[1],g.bgHover[1],u),l.bg[2]=(0,a.lerp)(g.bg[2],g.bgHover[2],u),l.studio[0]=g.studio[0],l.studio[1]=g.studio[1],l.studio[2]=g.studio[2];let f=c.sun.elevation;if(c.sunShare>0){l.shaft=(0,a.lerp)(.1,.6,(0,a.smoothstep)(34,4,f));let e=(0,a.clamp)((c.winCol[0]+c.winCol[1]+c.winCol[2])/5.5,.2,1),t=(0,a.smoothstep)(25,2,f);l.moteColor[0]=.95*e,l.moteColor[1]=(0,a.lerp)(.9,.7,t)*e,l.moteColor[2]=(0,a.lerp)(.78,.42,t)*e}else l.shaft=.22*c.night,l.moteColor[0]=.32*c.night,l.moteColor[1]=.38*c.night,l.moteColor[2]=.52*c.night;if(l.motes=e.moteCount,l.moteScale=i*(x?1:.75),l.bloom=x?.55:.45,eo(s,n,g.sun),x){l.sunX=g.sun.x*i,l.sunY=(r-g.sun.y)*i;let e=g.held.value;l.sunR=n.sunR*i*(1+.16*e),l.glow=c.discSun>0?(0,a.lerp)(.5,1,(0,a.smoothstep)(30,2,f))*(0,a.smoothstep)(-2.5,.5,f):0,l.glow=Math.max(l.glow,.4*c.night)*(1+.45*e)}else l.sunR=0,l.glow=0;return e.draw(l,t.width,t.height),!0},Z=()=>{if(!x)return;let e=y.current,t=Math.round(4*g.sun.x)/4,o=Math.round(4*g.sun.y)/4;e&&(t!==g.handleX||o!==g.handleY)&&(g.handleX=t,g.handleY=o,e.style.transform=`translate3d(${t-22}px, ${o-22}px, 0)`,_.current?.setAttribute("cx",String(t)),_.current?.setAttribute("cy",String(o)));let r=g.drag?g.goal:g.hour.value,a=Math.round(60*r);if(a!==g.minute){var n;let t,o,i,l;g.minute=a;let s=(o=Math.floor((t=Math.round((r%24+24)%24*60)%1440)/60),`${String(o).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`),c=(n=Y(r,eN).elevation,l=(i=(r%24+24)%24)>=13.25,n<-12?"Night":n<-5?l?"Blue hour":"Before dawn":n<-.6?l?"Dusk":"Dawn":n<3?l?"Sunset":"Sunrise":n<12?"Golden hour":i<11?"Morning":i<14.5?"Midday":"Afternoon");R.current&&(R.current.textContent=s),M.current&&c!==g.phase&&(M.current.textContent=c),g.phase=c,e&&(e.setAttribute("aria-valuenow",(a/60).toFixed(2)),e.setAttribute("aria-valuetext",`${s}, ${c.toLowerCase()}`))}let i=Y(g.hour.value,eN).elevation<-.6;i!==g.night&&(g.night=i,P(i))};(0,a.useIsoLayoutEffect)(()=>{g.minute=NaN,g.phase="",g.handleX=NaN,Z()});let ee=(0,a.useFrame)(i,e=>{let t=b.current,{width:o}=en.current;if(!t||o<2)return!1;let n=g.reduced,i=performance.now()/1e3,l=!g.drag&&i-g.lastInput>4&&g.hour.settled&&g.held.settled&&g.lampLevel%1==0;if(!x||l){if(g.acc+=e,g.acc<1/30-.002)return;e=Math.min(.1,g.acc),g.acc=0}if(n||(g.clock+=e),x&&!l&&g.renderStep<eB.length-1){let t=g.perf;t.time+=e,e>1/42&&(t.slow+=e),t.time>=1.6&&(t.slow>.7*t.time&&(g.renderStep+=1,G()),t.time=0,t.slow=0)}if(x)g.introPending&&(g.introPending=!1,g.hour.configure(eP),g.goal=eC[g.theme],g.hour.to(g.goal)),n?g.hour.set(g.hour.target):g.hour.step(e),g.held.to(g.drag&&"grab"===g.drag.kind?1:0),n?g.held.set(g.held.target):g.held.step(e);else if(g.hover=n?+!!g.hovering:(0,a.damp)(g.hover,+!!g.hovering,10,e),n)g.hour.set(eC[g.theme]);else if(g.hovering)g.hour.configure(eD),g.hour.to(19.15+24*Math.floor((g.hour.value-19.15+12)/24)),g.hour.step(e),g.tileHour=g.hour.value;else{let t;g.tileHour+=(1.45-1.05*Math.exp(-((((t=(g.tileHour%24+24)%24)-18.6)/1.9)**2))+1.1*(t<9||t>21.5))*e,g.tileHour>=28&&(g.tileHour-=24,g.prevHour-=24),g.hour.set(g.tileHour)}let s=Math.abs(g.hour.value-g.prevHour)/Math.max(.001,e);g.stir=n?0:(0,a.damp)(g.stir,(0,a.clamp)(s/5,0,1),s/5>g.stir?8:1.6,e);let c=Y(g.hour.value,g.light.sun).elevation;if(g.prevEl>=-3.2&&c<-3.2&&$(!0,x),g.prevEl<=-1.6&&c>-1.6&&$(!1,x),g.prevEl>=.6&&c<.6&&K(!0,x),g.prevEl<=2.4&&c>2.4&&K(!1,x),g.prevEl=c,g.lampT+=e,g.screenT+=e,n)g.lampLevel=+!!g.lampOn,g.screenLevel=+!!g.screenOn;else{var u;g.lampLevel=g.lampOn?(u=g.lampT)<.03?0:u<.07?.7:u<.13?.06:u<.17?.5:u<.22?.18:1-.82*Math.exp(-(u-.22)/.08):g.lampLevel*Math.exp(-e/.09),!g.lampOn&&g.lampLevel<.002&&(g.lampLevel=0),g.lampOn&&g.lampT>1.2&&(g.lampLevel=1),g.screenLevel=g.screenOn?function(e){if(e<.09)return 0;let t=(e-.09)/.5;return t>=1?1:1-Math.pow(1-t,3)+.08*Math.sin(t*Math.PI)}(g.screenT):g.screenLevel*Math.exp(-e/.12),!g.screenOn&&g.screenLevel<.002&&(g.screenLevel=0)}if(x&&i-g.lastInput<3){let e=Math.floor(g.prevHour),t=Math.floor(g.hour.value);e!==t&&s>.05&&function(e,t,o){if(!(0,r.audioReady)())return;let a=(0,r.getAudio)();if(!a)return;let n=performance.now();if(n-eE<55)return;eE=n;let{ctx:i,output:l}=a,s=i.currentTime,c=Math.round(e)%3==0?1.25:1,u=.11*(1-.55*Math.min(1,Math.max(0,(o-2)/14)))*c,f=eA(i,t),h=f?(f.connect(l),f):l,m=i.createBufferSource();m.buffer=(0,r.noiseBuffer)(i),m.playbackRate.value=.95+.1*Math.random();let d=i.createBiquadFilter();d.type="bandpass",d.frequency.value=(c>1?3400:2900)+300*Math.random(),d.Q.value=2.2;let v=i.createGain();v.gain.setValueAtTime(0,s),v.gain.linearRampToValueAtTime(u,s+.0015),v.gain.exponentialRampToValueAtTime(1e-4,s+.035),m.connect(d).connect(v).connect(h),m.start(s,.5*Math.random(),.05);let p=i.createOscillator();p.type="sine",p.frequency.setValueAtTime(c>1?1250:980,s),p.frequency.exponentialRampToValueAtTime(520,s+.03);let x=i.createGain();x.gain.setValueAtTime(0,s),x.gain.linearRampToValueAtTime(.5*u,s+.002),x.gain.exponentialRampToValueAtTime(1e-4,s+.05),p.connect(x).connect(h),p.start(s),p.stop(s+.07)}(Math.max(e,t),g.sun.x/Math.max(1,o)*2-1,s)}g.prevHour=g.hour.value;let f=ek[g.theme];for(let t=0;t<3;t++)g.studio[t]=n?f[t]:(0,a.damp)(g.studio[t],f[t],4,e);if(j(),Z(),n&&!g.drag&&g.hour.settled&&g.held.settled&&g.lampLevel%1==0&&g.screenLevel%1==0&&(x||g.hover%1==0))return!1}),{canvasRef:ea,sizeRef:en,supported:ei}=(0,a.useWebGL2)({mode:e,attributes:{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:t=>{let o=null;try{o=new e_(t,e)}catch(e){console.error(e);return}return b.current=o,G(),q(),j(),ee(),()=>{o?.dispose(),b.current=null}},onResize:()=>{G(),q(),j(),Z(),ee()}}),ef=(0,o.useCallback)(()=>{try{let e=getComputedStyle(document.documentElement);g.bg=eO(e.getPropertyValue("--tile"),g.bg),g.bgHover=eO(e.getPropertyValue("--tile-hover"),g.bgHover)}catch{}},[]),eh=(0,o.useRef)(!0);(0,o.useEffect)(()=>{if(g.theme=p,ef(),eh.current){eh.current=!1,ee();return}x&&(g.hour.configure(eP),g.goal=eC[p],g.hour.to(g.goal)),ee()},[p]),(0,o.useEffect)(()=>{g.reduced=f,f&&g.introPending&&(g.introPending=!1,g.goal=eC[g.theme],g.hour.set(g.goal)),ee()},[f]);let em=(0,a.useLatest)(ee),ed=()=>{g.lastInput=performance.now()/1e3,F||W(!0),em.current()},ev=(e,t=eL)=>{var o,r;let a=e;a<6&&(a=6-.9*(o=6-a)/(.9+o)),a>23.5&&(a=23.5+.9*(r=a-23.5)/(.9+r)),g.goal=a,g.hour.configure(t),g.hour.to(a)},ep=e=>{let t=w.current?.getBoundingClientRect();return{x:e.clientX-(t?.left??0),y:e.clientY-(t?.top??0)}},ex=(e,t,o)=>{let r=e.n%e.ts.length;e.ts[r]=o/1e3,e.hs[r]=t,e.n+=1},eg=(e,t)=>{let o=g.drag;if(!o||e.pointerId!==o.id)return;g.drag=null,T.current?.removeAttribute("data-dragging");try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}if(w.current&&(w.current.style.cursor=A?"grab":""),"pick"===o.kind&&!t&&o.pick){"lamp"===o.pick?$(!g.lampOn,!0):K(!g.screenOn,!0),"screen"!==o.pick||g.screenOn||eS(!1,.2),ed();return}let r=t||g.reduced?0:((e,t)=>{let o=e.ts.length;if(e.n<2)return 0;let r=(e.n-1)%o,a=e.ts[r];if(t/1e3-a>.09)return 0;let n=r;for(let t=1;t<Math.min(e.n,o);t++){let r=(e.n-1-t)%o;if(n=r,a-e.ts[r]>.08)break}let i=a-e.ts[n];return i<.012?0:(e.hs[r]-e.hs[n])/i})(o,e.timeStamp),n=(0,a.clamp)(r,-10,10),i=(0,a.clamp)(g.goal+.2*n,6,23.5);g.goal=i,g.hour.configure(eD),g.hour.to(i,n),ed()};return((0,o.useEffect)(()=>{if(x)return;let e=ea.current;if(!e)return;let t=e=>{"mouse"===e.pointerType&&(g.hovering=!0,em.current())},o=()=>{g.hovering=!1,em.current()};return e.addEventListener("pointerenter",t),e.addEventListener("pointerleave",o),()=>{e.removeEventListener("pointerenter",t),e.removeEventListener("pointerleave",o)}},[x,ei]),!1===ei)?(0,t.jsx)(eW,{mode:e,theme:p}):x?(0,t.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:w,onPointerDown:e=>{if(!x||!e.isPrimary||e.button>0||e.target.closest("[data-lab-controls]"))return;(0,r.ensureAudio)();let{x:t,y:o}=ep(e),a=!!e.target.closest("[data-sun]"),n=a?null:el(t,o,g.layout),i={id:e.pointerId,kind:a?"grab":n?"pick":"scrub",x0:t,y0:o,hour0:g.hour.value,moved:!1,pick:n,ts:new Float64Array(8),hs:new Float64Array(8),n:0};g.drag=i;try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}"grab"===i.kind?ev(Q(er(t,o,g.layout),g.hour.value)):ev(g.hour.value),ex(i,g.goal,e.timeStamp),"pick"!==i.kind&&T.current?.setAttribute("data-dragging",""),w.current&&(w.current.style.cursor="pick"===i.kind?"pointer":"grabbing"),ed()},onPointerMove:e=>{if(!x)return;let t=g.drag,{x:o,y:r}=ep(e);if(!t){if(A&&w.current){let t=!!e.target.closest("[data-sun]");w.current.style.cursor=t?"grab":el(o,r,g.layout)?"pointer":"grab"}return}if(e.pointerId===t.id){if(!t.moved&&Math.hypot(o-t.x0,r-t.y0)>5&&(t.moved=!0,"pick"===t.kind&&(t.kind="scrub",t.x0=o,t.hour0=g.hour.value,T.current?.setAttribute("data-dragging",""),w.current&&(w.current.style.cursor="grabbing"))),"grab"===t.kind)ev(Q(er(o,r,g.layout),g.goal));else{let e;"scrub"===t.kind&&t.moved&&ev((e=Math.max(56,.27*g.layout.rx),t.hour0-(o-t.x0)/e))}ex(t,g.goal,e.timeStamp),ed()}},onPointerUp:e=>eg(e,!1),onPointerCancel:e=>eg(e,!0),className:"absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]",style:{cursor:A?"grab":void 0},children:[(0,t.jsx)("canvas",{ref:ea,role:"img","aria-label":"A small room seen as a cut-away model, lit through its window by the sun",className:"absolute inset-0 block size-full"}),C?(0,t.jsxs)("svg",{ref:T,"aria-hidden":"true",className:"pointer-events-none absolute inset-0 size-full overflow-visible opacity-70 transition-opacity duration-300 ease-out data-[dragging]:opacity-100 data-[dragging]:duration-150",viewBox:`0 0 ${C.w} ${C.h}`,preserveAspectRatio:"none",children:[(0,t.jsx)("defs",{children:(0,t.jsxs)("mask",{id:E,maskUnits:"userSpaceOnUse",x:"0",y:"0",width:C.w,height:C.h,children:[(0,t.jsx)("rect",{width:C.w,height:C.h,fill:"white"}),(0,t.jsx)("circle",{ref:_,r:g.layout.sunR+7,fill:"black"})]})}),(0,t.jsxs)("g",{mask:`url(#${E})`,children:[(0,t.jsx)("path",{d:C.day,fill:"none",stroke:"currentColor",strokeWidth:1.6,strokeLinecap:"round",strokeDasharray:"0 7",className:"text-[color-mix(in_oklab,var(--foreground)_22%,transparent)]"}),(0,t.jsx)("path",{d:C.night,fill:"none",stroke:"currentColor",strokeWidth:1.4,strokeLinecap:"round",strokeDasharray:"0 9",className:"text-[color-mix(in_oklab,var(--foreground)_12%,transparent)]"})]})]}):null,(0,t.jsx)("div",{ref:y,"data-sun":"",role:"slider",tabIndex:0,"aria-label":"Time of day","aria-describedby":S,"aria-orientation":"horizontal","aria-valuemin":6,"aria-valuemax":23.5,onKeyDown:e=>{let t=null,o=e.shiftKey?1:.25,n=g.goal;switch(e.key){case"ArrowRight":case"ArrowUp":t=n+o;break;case"ArrowLeft":case"ArrowDown":t=n-o;break;case"PageUp":t=n+1;break;case"PageDown":t=n-1;break;case"Home":t=6;break;case"End":t=23.5;break;default:return}e.preventDefault(),(0,r.ensureAudio)();let i="Home"===e.key||"End"===e.key?t:.25*Math.round(t/.25);g.goal=(0,a.clamp)(i,6,23.5),g.hour.configure(eD),g.hour.to(g.goal),ed()},onFocus:e=>U(e.currentTarget.matches(":focus-visible")),onBlur:()=>U(!1),className:"group/sun absolute start-0 top-0 size-11 touch-none rounded-full outline-none will-change-transform",style:{cursor:"grab"},children:(0,t.jsx)("span",{"aria-hidden":"true",className:"absolute inset-1 rounded-full opacity-0 shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--foreground)_38%,transparent)] transition-[opacity,scale] duration-200 ease-out group-hover/sun:scale-105 group-hover/sun:opacity-100 group-focus-visible/sun:opacity-100 group-focus-visible/sun:shadow-[0_0_0_2px_var(--foreground)] group-active/sun:scale-110"})})]}),(0,t.jsx)("p",{id:S,className:"sr-only",children:"The sun moves along its path across the sky from six in the morning to half past eleven at night. Use the arrow keys to move it a quarter of an hour, with Shift or Page Up and Page Down an hour, and Home or End for the ends of the day. The lamp and the screen buttons switch them by hand."}),(0,t.jsxs)(n.StageControls,{placement:"bottom",children:[(0,t.jsxs)(n.Tray,{label:"Time and lights",children:[(0,t.jsxs)("span",{className:"flex h-10 items-center gap-2 ps-2.5 pe-2 text-[13px]","aria-hidden":"true",children:[(0,t.jsx)("span",{className:"text-secondary",children:D?(0,t.jsx)(u,{size:15}):(0,t.jsx)(c,{size:15})}),(0,t.jsx)("span",{ref:R,className:"w-[38px] font-medium text-primary tabular-nums"}),(0,t.jsx)("span",{ref:M,className:"w-[82px] whitespace-nowrap text-secondary"})]}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.IconButton,{label:"Desk lamp",pressed:B,onClick:()=>{(0,r.ensureAudio)(),$(!g.lampOn,!0),ed()},children:(0,t.jsx)(l,{})}),(0,t.jsx)(n.IconButton,{label:"Screen",pressed:N,onClick:()=>{(0,r.ensureAudio)(),K(!g.screenOn,!0),ed()},children:(0,t.jsx)(s,{})}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.MuteButton,{})]}),(0,t.jsx)(n.StageHint,{className:!F||H?"transition-opacity duration-300":"opacity-0 transition-opacity duration-700",children:H?I?"← → move the sun a quarter hour · Shift for an hour · Home and End jump to dawn and night":"← → a quarter hour · Shift for an hour":A?"Drag the sun across the sky · click the lamp or the screen":"Drag sideways to move the sun · tap the lamp"})]})]}):(0,t.jsx)("canvas",{ref:ea,"aria-hidden":"true",className:"absolute inset-0 block size-full"})}function eW({mode:e,theme:r}){let a=(0,o.useRef)(null);return(0,o.useEffect)(()=>{let t=a.current;if(!t)return;let o=()=>{let o=t.getBoundingClientRect(),a=Math.min(window.devicePixelRatio||1,2);t.width=Math.max(1,Math.round(o.width*a)),t.height=Math.max(1,Math.round(o.height*a));let n=t.getContext("2d");if(!n)return;let i=et(o.width,o.height,e,100*("stage"===e),J()),l={x:0,y:0},s=[0,0,0],c=(e,t,o)=>(s[0]=e,s[1]=t,s[2]=o,ea(s,i,l),[l.x,l.y]);n.setTransform(a,0,0,a,0,0),n.clearRect(0,0,o.width,o.height);let u="dark"===r,f=(e,t)=>{n.fillStyle=t,n.beginPath(),e.forEach(([e,t],o)=>o?n.lineTo(e,t):n.moveTo(e,t)),n.closePath(),n.fill()};f([c(0,0,0),c(4.2,0,0),c(4.2,0,4.2),c(0,0,4.2)],u?"#3a3530":"#cdb79c"),f([c(0,0,0),c(0,2.7,0),c(0,2.7,4.2),c(0,0,4.2)],u?"#2c2d30":"#e4e2de"),f([c(0,0,0),c(0,2.7,0),c(4.2,2.7,0),c(4.2,0,0)],u?"#333437":"#ecebe8"),f([c(0,.8,1.42),c(0,2.42,1.42),c(0,2.42,3.12),c(0,.8,3.12)],u?"#1b2236":"#c9d7e8"),f([c(.6,0,1.6),c(1.6,0,1),c(2.6,0,2.6),c(1.4,0,3.4)],u?"rgb(120 140 200 / 0.18)":"rgb(255 196 120 / 0.55)")};o();let n=new ResizeObserver(o);return n.observe(t),()=>n.disconnect()},[e,r]),(0,t.jsx)("canvas",{ref:a,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A small room lit through its window":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function(e){return(0,t.jsx)(eF,{...e})}],11047)},75975,function(e){e.n(e.i(11047))}]);