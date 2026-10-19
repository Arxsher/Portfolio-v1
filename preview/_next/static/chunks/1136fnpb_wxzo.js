(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95709,e=>{"use strict";var t=e.i(43476),i=e.i(71645),r=e.i(33209),a=e.i(37047),s=e.i(45219);function o(e,t,i,r){let a,s,o,l,n,h,c,d,u="tile"===i,f=!u&&e<560,p=e/2;u?(a=Math.round(.2*e),s=Math.round(.148*e),o=Math.round(.03*e),l=.6*t,n=.074*e,h=Math.round(.068*e),c=.245*e,d=e>190?10:9):f?(a=58,s=Math.min(52,Math.floor((e-56)/r)),o=8,l=.52*t,n=27,h=21,c=Math.min(.235*e,.25*t),d=14):(a=78,s=70,o=11,l=.585*t,n=39,h=24,c=Math.min(.2*e,.46*t,270),d=16);let g=r*s/2+o,m=a/2,x=p-g+o,v=Array.from({length:r},(e,t)=>({x:x+s*(t+.5),y:l})),b=u?e:f?1.35*e:Math.min(e,2.1*t);return{width:e,height:t,compact:f,count:r,dock:{cx:p,cy:l,hw:g,hh:m,r:.44*a},pitch:s,padX:o,icons:v,iconSize:h,dropR:n,k:1.05*n,bevelDock:.36*a,bevelDrop:.98*n,fontPx:c,word:{cx:p,baseline:l-m+.53*c*.5},disc:u?{x:p+.2*e,y:l-.33*t,r:.17*e}:f?{x:p+.2*e,y:l-.25*t,r:.2*e}:{x:p+.21*b,y:l-.09*t,r:.22*t},band:u?{x:p-.16*e,y:l+.15*t,hw:.2*e,hh:.052*e,angle:-.21}:f?{x:p-.16*e,y:l+.115*t,hw:.25*e,hh:.065*e,angle:-.2}:{x:p-.22*b,y:l+.03*t,hw:.17*b,hh:.05*t,angle:-.2},grid:d,fade:u?[6,6,.16*e,1]:f?[0,0,56,.85]:[0,0,90,.85],shadow:u?{x:0,y:4.5,blur:10}:f?{x:0,y:9,blur:20}:{x:0,y:12,blur:26},path:u?{ax:.8*g,up:1.6*a,down:1.25*a,period:10}:f?{ax:.8*g,up:1.85*a,down:1.05*a,period:12}:{ax:.8*g,up:1.95*a,down:1.15*a,period:12},rest:{x:p+.88*g+.25*n,y:l-m-.55*n},drift:.03*b}}let l=e=>{let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(255&t)/255]},n={base:l("#f2f2f2"),baseHi:l("#f6f6f6"),ink:l("#161616"),inkAlpha:1,c1:l("#ff8443"),c1b:l("#f24a1d"),c2:l("#2a55f5"),c2b:l("#6a8bff"),gridAlpha:.062,shadow:.13,caustic:.2},h={base:l("#232323"),baseHi:l("#292929"),ink:l("#ededed"),inkAlpha:.95,c1:l("#ff8048"),c1b:l("#dc4119"),c2:l("#3a5fff"),c2b:l("#7e98ff"),gridAlpha:.06,shadow:.42,caustic:.1},c=(e,t,i)=>[(0,a.lerp)(e[0],t[0],i),(0,a.lerp)(e[1],t[1],i),(0,a.lerp)(e[2],t[2],i)],d=[{id:"clear",label:"Clear",rgb:[1,1,1],amount:0,swatch:"linear-gradient(135deg, #ffffff 0%, #eef1f4 55%, #dfe4ea 100%)"},{id:"smoke",label:"Smoke",rgb:[.5,.52,.56],amount:.5,swatch:"linear-gradient(135deg, #b9bdc4 0%, #8a8f97 60%, #6f747c 100%)"},{id:"amber",label:"Amber",rgb:[1,.72,.36],amount:.48,swatch:"linear-gradient(135deg, #ffe0a8 0%, #f7b45a 60%, #e39431 100%)"},{id:"sea",label:"Sea glass",rgb:[.46,.84,.8],amount:.46,swatch:"linear-gradient(135deg, #cdf3ec 0%, #86d6cb 60%, #5fbdb2 100%)"},{id:"rose",label:"Rose",rgb:[1,.62,.7],amount:.42,swatch:"linear-gradient(135deg, #ffd9e0 0%, #f7a2b3 60%, #e77e95 100%)"}],u=e=>d.find(t=>t.id===e)??d[0];class f{mode;layout=null;word=null;dx=new a.Spring(0,{stiffness:150,damping:16});dy=new a.Spring(0,{stiffness:150,damping:16});qx=new a.Spring(0,{stiffness:230,damping:8.5});qy=new a.Spring(0,{stiffness:230,damping:8.5});driver="path";target={x:0,y:0};grab={x:0,y:0};placed=!1;merged=!1;pathTime=0;count;selected=0;pill=new a.Spring(0,{stiffness:340,damping:26});hoverIndex=-1;hover;press;glowX=new a.Spring(0,{stiffness:420,damping:34});glow=new a.Spring(0,{stiffness:260,damping:26});pointerLight=new a.Spring(0,{stiffness:120,damping:20});pointer={x:0,y:0,inside:!1};ripples=[];dark=0;refraction=.6;frost=.18;tint=[1,1,1,0];backdropTime=0;rippleData=new Float32Array(16);tone;toneTarget;lastDt=1/60;toneReady=!1;constructor(e,t){this.mode=e,this.count=t,this.hover=Array.from({length:t},()=>new a.Spring(0,{stiffness:320,damping:24})),this.press=Array.from({length:t},()=>new a.Spring(0,{stiffness:520,damping:15})),this.tone=Array.from({length:t},()=>0),this.toneTarget=Array.from({length:t},()=>0)}resize(e,t){let i=this.layout;if(i&&i.width===e&&i.height===t)return!1;let r=o(e,t,this.mode,this.count);if(i&&this.placed){let a=e/i.width,s=t/i.height;this.dx.set(this.dx.value*a),this.dy.set(this.dy.value*s),this.target.x*=a,this.target.y*=s,this.pill.set(r.icons[this.selected]?.x??r.dock.cx)}return this.layout=r,!0}pathAt(e){let t=this.layout,i=2*Math.PI/t.path.period,r=Math.sin(2*i*e);return{x:t.dock.cx+t.path.ax*Math.sin(i*e),y:t.dock.cy-r*(r>0?t.path.up:t.path.down)}}gap(e=this.dx.value,t=this.dy.value){let i=this.layout;if(!i)return 1/0;let{cx:r,cy:a,hw:s,hh:o,r:l}=i.dock,n=Math.abs(e-r)-s+l,h=Math.abs(t-a)-o+l;return Math.hypot(Math.max(n,0),Math.max(h,0))+Math.min(Math.max(n,h),0)-l-i.dropR}contact(){let{cx:e,cy:t,hw:i,hh:r}=this.layout.dock;return{x:(0,a.clamp)(this.dx.value,e-i,e+i),y:(0,a.clamp)(this.dy.value,t-r,t+r)}}hitDroplet(e,t){let i=this.layout;return!!i&&Math.hypot(e-this.dx.value,t-this.dy.value)<1.25*i.dropR}addRipple(e,t,i){this.ripples.push({x:e,y:t,age:0,amp:i}),this.ripples.length>4&&this.ripples.shift()}select(e,t=!0){let i=this.layout;this.selected=(0,a.clamp)(e,0,this.count-1),i&&(this.pill.to(i.icons[this.selected].x),this.press[this.selected].impulse(-4.2),t&&this.addRipple(i.icons[this.selected].x,i.dock.cy,.22))}toggleMerge(){let e=this.layout;if(!e)return;let{cx:t,cy:i,hw:r,hh:s}=e.dock;this.driver="keys",this.gap(this.target.x,this.target.y)<.5*e.k?this.target={x:(0,a.clamp)(this.target.x,t-.7*r,t+.7*r),y:i-s-2.1*e.dropR}:this.target={x:(0,a.clamp)(this.target.x,t-r+e.dropR,t+r-e.dropR),y:i}}nudge(e,t){this.layout&&("keys"!==this.driver&&(this.target={x:this.dx.value,y:this.dy.value}),this.driver="keys",this.target=this.clampTarget(this.target.x+e,this.target.y+t))}clampTarget(e,t){let i=this.layout,r=.9*i.dropR;return{x:(0,a.clamp)(e,r,i.width-r),y:(0,a.clamp)(t,r,i.height-r)}}get busy(){return Math.hypot(this.dx.value-this.target.x,this.dy.value-this.target.y)>.05||!this.dx.settled||!this.dy.settled||!this.qx.settled||!this.qy.settled||!this.pill.settled||!this.glow.settled||!this.glowX.settled||!this.pointerLight.settled||this.ripples.length>0||this.hover.some(e=>!e.settled)||this.press.some(e=>!e.settled)}step(e,t,i={}){let r=this.layout;if(!r)return;let s=!t.reducedMotion;if(!this.placed){let e=s?this.pathAt(0):r.rest;this.dx.set(e.x),this.dy.set(e.y),this.target={...e},this.pill.set(r.icons[this.selected].x),this.glowX.set(r.icons[0].x),this.merged=this.gap()<.5*r.k,this.placed=!0,this.dark=+!!t.dark,this.refraction=t.refraction,this.frost=t.frost;let i=u(t.tint);this.tint=[i.rgb[0],i.rgb[1],i.rgb[2],i.amount]}s&&(this.backdropTime+=e),this.lastDt=s?e:1,"path"===this.driver&&(s?(this.pathTime+=e,this.target=this.pathAt(this.pathTime)):this.target={...r.rest}),s?(this.dx.to(this.target.x),this.dy.to(this.target.y),this.dx.step(e),this.dy.step(e)):(this.dx.set((0,a.damp)(this.dx.value,this.target.x,18,e)),this.dy.set((0,a.damp)(this.dy.value,this.target.y,18,e)),.05>Math.hypot(this.dx.value-this.target.x,this.dy.value-this.target.y)&&(this.dx.set(this.target.x),this.dy.set(this.target.y)));let o=this.dx.velocity,l=this.dy.velocity,n="tile"===this.mode?.0016:48e-5,h=o*n,c=l*n,d=Math.hypot(h,c);d>.27&&(h*=.27/d,c*=.27/d),s?(this.qx.to(h),this.qy.to(c),this.qx.step(e),this.qy.step(e)):(this.qx.set(0),this.qy.set(0));let f=this.gap(),p=this.merged;if(!p&&f<.45*r.k?this.merged=!0:p&&f>.55*r.k&&(this.merged=!1),p!==this.merged){let e=this.contact();if(s){this.addRipple(e.x,e.y,this.merged?.3:.22);let t=this.dx.value-e.x,i=this.dy.value-e.y,r=Math.hypot(t,i)||1,a=this.merged?-1.6:2.2;this.qx.impulse(t/r*a),this.qy.impulse(i/r*a)}i.onMerge?.(this.merged,e.x,e.y)}let g=this.pill.value;s?this.pill.step(e):this.pill.set(this.pill.target);let m=e>0?(this.pill.value-g)/e:0;for(let t=0;t<this.count;t++)this.hover[t].to(+(t===this.hoverIndex)),s?(this.hover[t].step(e),this.press[t].step(e)):(this.hover[t].set(this.hover[t].target),this.press[t].set(0));for(let t of(this.hoverIndex>=0&&this.glowX.to(r.icons[this.hoverIndex].x),this.glow.to(+(this.hoverIndex>=0)),this.glowX.step(e),this.glow.step(e),this.pillVelocity=m,this.ripples))t.age+=e;this.ripples=this.ripples.filter(e=>e.age<1.8),this.pointerLight.to(this.pointer.inside&&"stage"===this.mode?1:0),this.pointerLight.step(e);let x=+!!t.dark;this.dark=s?(0,a.damp)(this.dark,x,7,e):x,.002>Math.abs(this.dark-x)&&(this.dark=x),this.refraction=(0,a.damp)(this.refraction,t.refraction,14,e),this.frost=(0,a.damp)(this.frost,t.frost,14,e);let v=u(t.tint),b=[v.rgb[0],v.rgb[1],v.rgb[2],v.amount];for(let t=0;t<4;t++)this.tint[t]=(0,a.damp)(this.tint[t],b[t],9,e)}pillVelocity=0;easing(e){let t=u(e.tint);return Math.abs(this.dark-!!e.dark)>.002||Math.abs(this.refraction-e.refraction)>.002||Math.abs(this.frost-e.frost)>.002||Math.abs(this.tint[3]-t.amount)>.002||Math.abs(this.tint[0]-t.rgb[0])>.002||Math.abs(this.tint[1]-t.rgb[1])>.002||Math.abs(this.tint[2]-t.rgb[2])>.002}updateTone(e,t,i,r,s){let o=this.layout;if(!o)return;let l=e=>.2126*e[0]+.7152*e[1]+.0722*e[2],n=l(s.base),h=l(s.ink),c=l(s.c1),d=l(s.c2),u=(0,a.lerp)(.985,.26,this.dark),f=.16+.7*this.frost,p=Math.cos(r),g=Math.sin(r),m=this.word,x=.9*o.iconSize,v=1-Math.exp(-9*this.lastDt);for(let r=0;r<this.count;r++){let l=o.icons[r],b=0,y=0;for(let r=-1;r<=1;r++)for(let o=-1;o<=1;o++){let u=l.x+o*x*.7,f=l.y+r*x*.7,v=n;Math.hypot(u-t[0],f-t[1])<t[2]&&(v=c);let _=u-i[0],w=f-i[1],k=Math.abs(p*_+g*w),T=Math.abs(-g*_+p*w);if(k<i[2]+.4*i[3]&&T<i[3]&&(v=d),m?.coverage&&e[2]>0){let t=Math.floor((u-e[0])/e[2]*m.pw),i=Math.floor((f-e[1])/e[3]*m.ph);if(t>=0&&i>=0&&t<m.pw&&i<m.ph){let e=m.coverage[i*m.pw+t]/255*s.inkAlpha;v=(0,a.lerp)(v,h,e)}}b+=v,y++}let _=(0,a.lerp)(b/y,u,f),w=this.toneTarget[r]>.5?_<.56:_<.46;this.toneTarget[r]=+!!w,this.tone[r]=this.toneReady?(0,a.lerp)(this.tone[r],this.toneTarget[r],v):this.toneTarget[r]}this.toneReady=!0}iconTransform(e){let t=this.hover[e].value;return{scale:1+.13*t+.9*this.press[e].value,lift:-1.5*t}}frame(e){let t=this.layout;if(!t)return null;let i={base:c(n.base,h.base,this.dark),baseHi:c(n.baseHi,h.baseHi,this.dark),ink:c(n.ink,h.ink,this.dark),inkAlpha:(0,a.lerp)(n.inkAlpha,h.inkAlpha,this.dark),c1:c(n.c1,h.c1,this.dark),c1b:c(n.c1b,h.c1b,this.dark),c2:c(n.c2,h.c2,this.dark),c2b:c(n.c2b,h.c2b,this.dark),gridAlpha:(0,a.lerp)(n.gridAlpha,h.gridAlpha,this.dark),shadow:(0,a.lerp)(n.shadow,h.shadow,this.dark),caustic:(0,a.lerp)(n.caustic,h.caustic,this.dark)},r=this.backdropTime,s=t.drift,o=t.word.cx+Math.sin(.11*r)*s*1.4,l=[t.disc.x+Math.cos(.13*r)*s,t.disc.y+Math.sin(.17*r)*s*.9,t.disc.r*(1+.025*Math.sin(.21*r)),0],d=[t.band.x+Math.sin(.09*r+1.1)*s*1.1,t.band.y+Math.cos(.12*r)*s*.7,t.band.hw,t.band.hh],u=t.band.angle+.05*Math.sin(.08*r),f=this.word,p=f?[o-f.inkWidth/2-f.inkLeft,t.word.baseline-f.baseline,f.width,f.height]:[0,0,0,0];this.updateTone(p,l,d,u,i);let g=this.qx.value,m=this.qy.value,x=Math.hypot(g,m),v=Math.abs(this.pillVelocity),b=.5*t.pitch-(t.compact||"tile"===this.mode?2:3)+Math.min(.016*v,.32*t.pitch),y=t.dock.hh-.62*t.padX-Math.min(.0035*v,.12*t.dock.hh),_=this.rippleData;return _.fill(0),this.ripples.forEach((e,t)=>{_[4*t]=e.x,_[4*t+1]=e.y,_[4*t+2]=e.age,_[4*t+3]=e.amp}),{width:t.width,height:t.height,dpr:e,dock:[t.dock.cx,t.dock.cy,t.dock.hw,t.dock.hh],dockR:t.dock.r,drop:[this.dx.value,this.dy.value,t.dropR,t.k],squash:x>1e-4?[g/x,m/x,x]:[1,0,0],bevelDock:t.bevelDock,bevelDrop:t.bevelDrop,typeRect:p,base:i.base,baseHi:i.baseHi,ink:i.ink,inkAlpha:i.inkAlpha,c1:i.c1,c1b:i.c1b,c2:i.c2,c2b:i.c2b,disc:l,band:d,bandAngle:u,grid:[t.grid,i.gridAlpha,t.width/2,t.height/2],fade:t.fade,shadow:[t.shadow.x,t.shadow.y,t.shadow.blur,i.shadow],caustic:i.caustic,grain:1.4/255,refract:this.refraction,frost:this.frost,tint:[this.tint[0],this.tint[1],this.tint[2],this.tint[3]],pill:[this.pill.value,t.dock.cy,b,y],pillAmt:1,hover:[this.glowX.value,t.dock.cy,.62*t.pitch,this.glow.value],ripples:_,pointer:[this.pointer.x,this.pointer.y,this.pointerLight.value],dark:this.dark}}}let p=[{id:"home",label:"Home"},{id:"search",label:"Search"},{id:"spark",label:"Spark"},{id:"saved",label:"Saved"},{id:"profile",label:"Profile"}],g=p.filter(e=>"saved"!==e.id);function m({size:e,children:i}){return(0,t.jsx)("svg",{width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",className:"block",children:i})}function x({id:e,size:i,filled:r}){let a=r?"currentColor":"none";switch(e){case"home":return(0,t.jsx)(m,{size:i,children:(0,t.jsx)("path",{d:"M4.25 10.4 12 4.2l7.75 6.2v8.1a1.5 1.5 0 0 1-1.5 1.5h-3.6v-5.1a.8.8 0 0 0-.8-.8h-3.7a.8.8 0 0 0-.8.8v5.1h-3.6a1.5 1.5 0 0 1-1.5-1.5z",fill:a})});case"search":return(0,t.jsxs)(m,{size:i,children:[(0,t.jsx)("circle",{cx:"10.8",cy:"10.8",r:"6.2",fill:r?"currentColor":"none",fillOpacity:.16*!!r}),(0,t.jsx)("path",{d:"m15.4 15.4 4.35 4.35"})]});case"spark":return(0,t.jsxs)(m,{size:i,children:[(0,t.jsx)("path",{d:"M12 3.6c.55 4.6 2.35 6.5 7 7.15-4.65.65-6.45 2.55-7 7.15-.55-4.6-2.35-6.5-7-7.15 4.65-.65 6.45-2.55 7-7.15z",fill:a}),(0,t.jsx)("path",{d:"M18.6 16.4v3.2M17 18h3.2",strokeWidth:1.6})]});case"saved":return(0,t.jsx)(m,{size:i,children:(0,t.jsx)("path",{d:"M7.2 4.2h9.6a1.2 1.2 0 0 1 1.2 1.2v14.2l-6-3.9-6 3.9V5.4a1.2 1.2 0 0 1 1.2-1.2z",fill:a})});case"profile":return(0,t.jsxs)(m,{size:i,children:[(0,t.jsx)("circle",{cx:"12",cy:"8.6",r:"3.6",fill:a}),(0,t.jsx)("path",{d:"M4.9 19.6c1.15-3.55 3.8-5.4 7.1-5.4s5.95 1.85 7.1 5.4",fill:a})]})}}var v=e.i(55171);let b=`#version 300 es
precision highp float;

uniform vec2 u_res;      // CSS px
uniform float u_dpr;
uniform vec4 u_dock;     // centre x, y, half width, half height
uniform float u_dockR;   // corner radius
uniform vec4 u_drop;     // centre x, y, radius, smooth-union k
uniform vec3 u_squash;   // stretch axis x, y, stretch (0 = round)

vec2 fragPos() {
  return vec2(gl_FragCoord.x, u_res.y * u_dpr - gl_FragCoord.y) / u_dpr;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Ellipse distance, the gradient-corrected approximation (good near the edge).
float sdEllipse(vec2 p, vec2 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  if (k1 < 1e-5) return -min(r.x, r.y);
  return k0 * (k0 - 1.0) / k1;
}

float sdDrop(vec2 p) {
  vec2 d = p - u_drop.xy;
  vec2 u = u_squash.xy;
  vec2 q = vec2(dot(d, u), dot(d, vec2(-u.y, u.x)));
  float s = 1.0 + u_squash.z;
  return sdEllipse(q, u_drop.z * vec2(s, 1.0 / s));
}

float sdDock(vec2 p) {
  return sdRoundBox(p - u_dock.xy, u_dock.zw, u_dockR);
}

// Polynomial smooth minimum; h is the weight of a (1 = all a).
float smin(float a, float b, float k, out float h) {
  h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// The glass: dock ∪ droplet. wDrop says how much of this point is droplet.
float glass(vec2 p, out float wDrop) {
  float h;
  float d = smin(sdDock(p), sdDrop(p), u_drop.w, h);
  wDrop = 1.0 - h;
  return d;
}

float glass(vec2 p) {
  float w;
  return glass(p, w);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`,y=`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,_=`${b}
uniform sampler2D u_type;
uniform vec4 u_typeRect;   // x, y, w, h (CSS px) the word texture covers
uniform vec3 u_base;       // the tile
uniform vec3 u_baseHi;     // its lift in the middle
uniform vec3 u_ink;
uniform float u_inkAlpha;
uniform vec3 u_c1;         // disc, top
uniform vec3 u_c1b;        // disc, bottom
uniform vec3 u_c2;         // band, left
uniform vec3 u_c2b;        // band, right
uniform vec4 u_disc;       // x, y, r, -
uniform vec4 u_band;       // x, y, half w, half h
uniform vec2 u_bandRot;    // cos, sin
uniform vec4 u_grid;       // pitch, alpha, origin x, origin y
uniform vec4 u_fade;       // edge fade of fields + grid: inset x, inset y, softness, strength
uniform vec4 u_shadow;     // offset x, y, blur, opacity
uniform float u_caustic;
uniform float u_grain;

out vec4 outColor;

float lineAA(float dist, float halfWidth, float px) {
  return 1.0 - smoothstep(halfWidth - px * 0.5, halfWidth + px * 0.5, dist);
}

float grid(vec2 p, float pitch, float halfWidth, float px) {
  vec2 g = abs(fract(p / pitch + 0.5) - 0.5) * pitch;
  return max(lineAA(g.x, halfWidth, px), lineAA(g.y, halfWidth, px));
}

void main() {
  vec2 p = fragPos();
  float px = 1.0 / u_dpr;

  // the tile, a touch lighter in the middle
  vec2 c = (p - u_res * 0.5) / max(u_res.y, 1.0);
  vec3 col = mix(u_baseHi, u_base, smoothstep(0.05, 0.85, length(c * vec2(0.8, 1.0))));

  // fields and grid fade out toward the edges (breathing room on tiles)
  vec2 e = min(p, u_res - p);
  float fade = smoothstep(0.0, u_fade.z, e.x - u_fade.x) * smoothstep(0.0, u_fade.z, e.y - u_fade.y);
  fade = mix(1.0, fade, u_fade.w);

  // colour field 1: a disc, lit from above
  float dDisc = length(p - u_disc.xy) - u_disc.z;
  float aDisc = smoothstep(px * 0.6, -px * 0.6, dDisc) * fade;
  float tDisc = clamp((p.y - (u_disc.y - u_disc.z)) / (2.0 * u_disc.z), 0.0, 1.0);
  col = mix(col, mix(u_c1, u_c1b, tDisc * tDisc), aDisc);

  // colour field 2: a tilted band with round ends
  vec2 bp = p - u_band.xy;
  bp = vec2(u_bandRot.x * bp.x + u_bandRot.y * bp.y, -u_bandRot.y * bp.x + u_bandRot.x * bp.y);
  float dBand = sdRoundBox(bp, u_band.zw, u_band.w);
  float aBand = smoothstep(px * 0.6, -px * 0.6, dBand) * fade;
  float tBand = clamp(bp.x / (2.0 * u_band.z) + 0.5, 0.0, 1.0);
  col = mix(col, mix(u_c2, u_c2b, tBand), aBand);

  // fine grid, with a firmer line every fourth
  vec2 gp = p - u_grid.zw;
  float hw = max(px, 0.5) * 0.5;
  float minor = grid(gp, u_grid.x, hw, px);
  float major = grid(gp, u_grid.x * 4.0, hw, px);
  float g = max(minor * u_grid.y, major * u_grid.y * 1.9) * fade;
  col = mix(col, u_ink, g);

  // the word
  vec2 tuv = (p - u_typeRect.xy) / u_typeRect.zw;
  if (tuv.x > 0.0 && tuv.y > 0.0 && tuv.x < 1.0 && tuv.y < 1.0) {
    float ta = texture(u_type, tuv).r;
    col = mix(col, u_ink, ta * u_inkAlpha);
  }

  // the glass's shadow: a wide soft drop plus a tight contact shade
  float ds = glass(p - u_shadow.xy);
  float drop = 1.0 - smoothstep(-u_shadow.z * 0.45, u_shadow.z, ds);
  float dc = glass(p - u_shadow.xy * 0.22);
  float contact = 1.0 - smoothstep(-1.0, u_shadow.z * 0.22, dc);
  col *= 1.0 - drop * u_shadow.w - contact * u_shadow.w * 0.45;

  // light the droplet gathers into a bright spot inside its shadow
  vec2 cp = p - (u_drop.xy + u_shadow.xy * 1.15);
  float spot = exp(-dot(cp, cp) / pow(u_drop.z * 0.42, 2.0));
  col += spot * u_caustic * (1.0 - drop * 0.4);

  // a whisper of grain so the gradients never band
  col += (hash12(gl_FragCoord.xy) - 0.5) * u_grain;
  outColor = vec4(col, 1.0);
}
`,w=`${b}
uniform sampler2D u_scene;
uniform float u_bevelDock;
uniform float u_bevelDrop;
uniform float u_refract;   // 0..1, the slider
uniform float u_frost;     // 0..1, the slider
uniform vec4 u_tint;       // rgb, strength
uniform vec4 u_pill;       // selection: x, y, half w, half h
uniform float u_pillAmt;
uniform vec4 u_hover;      // x, y, radius, strength
uniform vec4 u_ripples[4]; // x, y, age (s), amplitude
uniform vec3 u_pointer;    // x, y, strength
uniform float u_dark;      // 0 light .. 1 dark
uniform float u_lod;       // mip levels available - 1
uniform float u_lens;      // -1: the rim draws in what lies just beyond it (lensing); 1 would magnify

out vec4 outColor;

// Cubic B-spline lookup of one mip level from four bilinear taps: the
// mips stay smooth when magnified (no blocky frost).
vec3 bicubicLevel(vec2 uv, float level) {
  vec2 size = vec2(textureSize(u_scene, int(level)));
  vec2 st = uv * size - 0.5;
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 s0 = w0 + w1;
  vec2 s1 = w2 + w3;
  vec2 t0 = (i - 0.5 + w1 / s0) / size;
  vec2 t1 = (i + 1.5 + w3 / s1) / size;
  return (textureLod(u_scene, vec2(t0.x, t0.y), level).rgb * s0.x +
          textureLod(u_scene, vec2(t1.x, t0.y), level).rgb * s1.x) * s0.y +
         (textureLod(u_scene, vec2(t0.x, t1.y), level).rgb * s0.x +
          textureLod(u_scene, vec2(t1.x, t1.y), level).rgb * s1.x) * s1.y;
}

vec3 scene(vec2 p, float lod) {
  vec2 uv = p / u_res;
  uv.y = 1.0 - uv.y;
  uv = clamp(uv, vec2(0.0005), vec2(0.9995));
  if (lod < 0.35) return textureLod(u_scene, uv, 0.0).rgb;
  float l0 = floor(lod);
  return mix(bicubicLevel(uv, l0), bicubicLevel(uv, l0 + 1.0), lod - l0);
}

// a travelling ring on the surface; returns the tilt it adds
vec2 rippleTilt(vec2 p) {
  vec2 tilt = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 r = u_ripples[i];
    if (r.w <= 0.0) continue;
    vec2 d = p - r.xy;
    float dist = length(d);
    float front = r.z * 260.0;
    float x = dist - front;
    float env = exp(-x * x / 900.0) * exp(-r.z * 2.6) * r.w;
    tilt += (dist > 0.001 ? d / dist : vec2(0.0)) * cos(x * 0.16) * env;
  }
  return tilt;
}

void main() {
  vec2 p = fragPos();
  float px = 1.0 / u_dpr;
  vec2 uv0 = gl_FragCoord.xy / (u_res * u_dpr);
  vec3 back = textureLod(u_scene, uv0, 0.0).rgb;

  float wDrop;
  float d = glass(p, wDrop);
  if (d > px) {
    outColor = vec4(back, 1.0);
    return;
  }

  // the field's slope: which way is "out" from here
  float e = 0.6;
  vec2 g = vec2(glass(p + vec2(e, 0.0)) - glass(p - vec2(e, 0.0)), glass(p + vec2(0.0, e)) - glass(p - vec2(0.0, e)));
  float glen = length(g);
  g = glen > 1e-5 ? g / glen : vec2(0.0);

  // thickness profile: a quarter-round bevel at the rim, flat beyond it
  float bevel = mix(u_bevelDock, u_bevelDrop, wDrop);
  float depth = max(-d, 0.0);
  float t = clamp(depth / bevel, 0.0, 1.0);
  float s = 1.0 - t;
  float height = sqrt(max(1.0 - s * s, 0.0));
  float slope = s / max(height, 0.09);

  float strength = mix(0.25, 1.35, u_refract);
  vec2 tilt = g * slope * strength + rippleTilt(p) * (1.0 - wDrop * 0.6);
  vec3 n = normalize(vec3(tilt, 1.0));

  // refraction through the glass at six wavelengths, frosted through the mips
  float thick = bevel * (0.45 + 0.55 * height) * mix(0.5, 1.25, u_refract);
  float lod = min(u_lod - 1.0, (u_frost * 4.4 + height * (0.45 + 1.4 * u_frost)) * (1.0 - 0.3 * wDrop) + (1.0 - height) * 0.35);

  float disp = 0.045 * (0.35 + u_refract);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float f = float(i) / 5.0;
    float eta = 1.0 / (1.5 + (f - 0.5) * disp * 2.0);
    vec3 r = refract(vec3(0.0, 0.0, -1.0), n, eta);
    vec2 shift = r.xy / max(-r.z, 0.25) * thick * u_lens;
    vec3 smp = scene(p + shift, lod);
    vec3 w = i == 0 ? vec3(0.5, 0.0, 0.0)
           : i == 1 ? vec3(0.35, 0.15, 0.0)
           : i == 2 ? vec3(0.15, 0.35, 0.0)
           : i == 3 ? vec3(0.0, 0.35, 0.15)
           : i == 4 ? vec3(0.0, 0.15, 0.35)
           : vec3(0.0, 0.0, 0.5);
    col += smp * w;
  }

  // a little vibrancy: glass lifts saturation and light a touch
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(luma), col, 1.12);
  col = mix(col * 1.06 + 0.035, col * 1.03 + 0.012, 1.0 - u_dark);

  // frost scatters light: the dock's body is milky (so its icons read over
  // anything), the droplet stays clear unless frosted
  vec3 milk = mix(vec3(0.985), vec3(0.26), u_dark);
  float body = smoothstep(0.15, 1.0, height) * (0.16 + 0.7 * u_frost) * mix(1.0, 0.12, wDrop);
  col = mix(col, milk, body);

  // tint, deeper where the glass is thicker
  float tintAmt = u_tint.a * (0.55 + 0.45 * height);
  col = mix(col, col * u_tint.rgb * 1.08 + u_tint.rgb * 0.05, tintAmt);

  // the selected tab: a soft well inside the dock
  vec2 pq = p - u_pill.xy;
  float dp = sdRoundBox(pq, u_pill.zw, min(u_pill.z, u_pill.w));
  float pillMask = smoothstep(px, -px, dp) * u_pillAmt * (1.0 - wDrop);
  vec3 pillCol = mix(col * 0.86, col * 1.45 + 0.05, u_dark);
  col = mix(col, pillCol, pillMask);
  float pillRim = smoothstep(px * 1.4, 0.0, abs(dp)) * u_pillAmt * (1.0 - wDrop) * smoothstep(0.0, -u_pill.w * 2.0, pq.y);
  col += pillRim * mix(0.10, 0.06, u_dark);

  // hover: light pools under the icon
  vec2 hq = p - u_hover.xy;
  col += exp(-dot(hq, hq) / (u_hover.z * u_hover.z)) * u_hover.w * mix(0.085, 0.07, u_dark);

  // reflection of a soft sky (Fresnel), brighter for faces turned up
  vec3 V = vec3(0.0, 0.0, 1.0);
  // Schlick, glass (F0 = 0.04), a little generous so the rim still glows
  float fres = min(1.0, (0.04 + 0.96 * pow(1.0 - clamp(n.z, 0.0, 1.0), 5.0)) * 1.6);
  vec3 R = reflect(-V, n);
  float up = clamp(0.5 - 0.5 * R.y, 0.0, 1.0);
  vec3 sky = mix(mix(vec3(0.46), vec3(1.0), up), mix(vec3(0.16), vec3(0.78), up), u_dark);
  col = mix(col, sky, fres * mix(1.0, 0.85, u_dark));

  // key light from the upper left
  vec3 L = normalize(vec3(-0.42, -0.72, 0.62));
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 70.0);
  col += spec * mix(0.9, 0.75, u_dark);
  // the pointer, a second small light (stage)
  vec3 Lp = normalize(vec3(u_pointer.xy - p, 150.0));
  float specP = pow(max(dot(n, normalize(Lp + V)), 0.0), 120.0) * u_pointer.z;
  col += specP * 0.55;

  // bright rim: strong on the lit edge, a fainter echo on the far edge
  float rim = 1.0 - smoothstep(0.0, px * 1.5 + 0.75, depth);
  float facing = dot(g, normalize(vec2(-0.55, -0.84)));
  float rimLight = rim * (0.22 + 0.78 * max(facing, 0.0) + 0.5 * max(-facing, 0.0));
  col += rimLight * mix(0.55, 0.42, u_dark);
  // a hairline just inside the rim, so the edge reads on light grounds
  float inner = smoothstep(px * 0.5, px * 1.5, depth) * (1.0 - smoothstep(px * 1.5, px * 3.5 + 1.0, depth));
  col = mix(col, col * mix(0.9, 0.82, u_dark), inner * 0.5 * (1.0 - max(facing, 0.0)));

  col += (hash12(gl_FragCoord.xy + 17.0) - 0.5) / 255.0;

  float cover = smoothstep(px * 0.5, -px * 0.5, d);
  outColor = vec4(mix(back, col, cover), 1.0);
}
`;class k{gl;scene;glass;us;ug;vao;fbo;target;type;pw=0;ph=0;levels=1;constructor(e){this.gl=e,this.scene=(0,v.createProgram)(e,y,_),this.glass=(0,v.createProgram)(e,y,w),this.us=(0,v.uniformLocations)(e,this.scene),this.ug=(0,v.uniformLocations)(e,this.glass);const t=e.createVertexArray(),i=e.createFramebuffer(),r=e.createTexture(),a=e.createTexture();if(!t||!i||!r||!a)throw Error("liquid-glass: could not allocate GL objects");this.vao=t,this.fbo=i,this.target=r,this.type=a,e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texImage2D(e.TEXTURE_2D,0,e.R8,1,1,0,e.RED,e.UNSIGNED_BYTE,new Uint8Array([0]))}setType(e){let t=this.gl;t.bindTexture(t.TEXTURE_2D,this.type),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.R8,t.RED,t.UNSIGNED_BYTE,e)}ensureTarget(e,t){if(e===this.pw&&t===this.ph)return;let i=this.gl;this.pw=e,this.ph=t,this.levels=Math.floor(Math.log2(Math.max(e,t)))+1,i.bindTexture(i.TEXTURE_2D,this.target),i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,e,t,0,i.RGBA,i.UNSIGNED_BYTE,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR_MIPMAP_LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.generateMipmap(i.TEXTURE_2D),i.bindFramebuffer(i.FRAMEBUFFER,this.fbo),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,this.target,0),i.bindFramebuffer(i.FRAMEBUFFER,null)}shapes(e,t){let i=this.gl;i.uniform2f(e("u_res"),t.width,t.height),i.uniform1f(e("u_dpr"),this.pw/Math.max(1,t.width)),i.uniform4fv(e("u_dock"),t.dock),i.uniform1f(e("u_dockR"),t.dockR),i.uniform4fv(e("u_drop"),t.drop),i.uniform3fv(e("u_squash"),t.squash)}draw(e){let t=this.gl,i=t.canvas,r=i.width,a=i.height;if(r<2||a<2)return;this.ensureTarget(r,a),t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.bindVertexArray(this.vao),t.bindFramebuffer(t.FRAMEBUFFER,this.fbo),t.viewport(0,0,r,a),t.useProgram(this.scene);let s=this.us;this.shapes(s,e),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.type),t.uniform1i(s("u_type"),0),t.uniform4fv(s("u_typeRect"),e.typeRect),t.uniform3fv(s("u_base"),e.base),t.uniform3fv(s("u_baseHi"),e.baseHi),t.uniform3fv(s("u_ink"),e.ink),t.uniform1f(s("u_inkAlpha"),e.inkAlpha),t.uniform3fv(s("u_c1"),e.c1),t.uniform3fv(s("u_c1b"),e.c1b),t.uniform3fv(s("u_c2"),e.c2),t.uniform3fv(s("u_c2b"),e.c2b),t.uniform4fv(s("u_disc"),e.disc),t.uniform4fv(s("u_band"),e.band),t.uniform2f(s("u_bandRot"),Math.cos(e.bandAngle),Math.sin(e.bandAngle)),t.uniform4fv(s("u_grid"),e.grid),t.uniform4fv(s("u_fade"),e.fade),t.uniform4fv(s("u_shadow"),e.shadow),t.uniform1f(s("u_caustic"),e.caustic),t.uniform1f(s("u_grain"),e.grain),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,null),t.bindTexture(t.TEXTURE_2D,this.target),t.generateMipmap(t.TEXTURE_2D),t.viewport(0,0,r,a),t.useProgram(this.glass);let o=this.ug;this.shapes(o,e),t.uniform1i(o("u_scene"),0),t.uniform1f(o("u_bevelDock"),e.bevelDock),t.uniform1f(o("u_bevelDrop"),e.bevelDrop),t.uniform1f(o("u_refract"),e.refract),t.uniform1f(o("u_frost"),e.frost),t.uniform4fv(o("u_tint"),e.tint),t.uniform4fv(o("u_pill"),e.pill),t.uniform1f(o("u_pillAmt"),e.pillAmt),t.uniform4fv(o("u_hover"),e.hover),t.uniform4fv(o("u_ripples"),e.ripples),t.uniform3fv(o("u_pointer"),e.pointer),t.uniform1f(o("u_dark"),e.dark),t.uniform1f(o("u_lod"),this.levels-1),t.uniform1f(o("u_lens"),-1),t.drawArrays(t.TRIANGLES,0,3),t.bindVertexArray(null)}dispose(){let e=this.gl;e.deleteProgram(this.scene),e.deleteProgram(this.glass),e.deleteVertexArray(this.vao),e.deleteFramebuffer(this.fbo),e.deleteTexture(this.target),e.deleteTexture(this.type)}}var T=e.i(16442);function R(){(0,T.isMuted)()||(0,T.ensureAudio)()}function M(){if((0,T.isMuted)())return null;let e=(0,T.getAudio)();return e&&"closed"!==e.ctx.state?e:null}function E(e,t,i){if("function"!=typeof e.createStereoPanner)return t;let r=e.createStereoPanner();return r.pan.value=Math.max(-1,Math.min(1,i)),r.connect(t),r}function A(e,t,i,r,a,s,o){let{ctx:l,output:n}=e,h=E(l,n,o),c=l.createOscillator();c.type="sine",c.frequency.setValueAtTime(i,t),c.frequency.exponentialRampToValueAtTime(r,t+a);let d=l.createGain();d.gain.setValueAtTime(0,t),d.gain.linearRampToValueAtTime(s,t+.004),d.gain.exponentialRampToValueAtTime(1e-4,t+1.9*a),c.connect(d).connect(h),c.start(t),c.stop(t+2*a+.02)}function D(e,t,i,r,a){let{ctx:s,output:o}=e,l=E(s,o,a),n=s.createBufferSource();n.buffer=(0,T.noiseBuffer)(s,.25);let h=s.createBiquadFilter();h.type="bandpass",h.frequency.value=i,h.Q.value=2.2;let c=s.createGain();c.gain.setValueAtTime(r,t),c.gain.exponentialRampToValueAtTime(1e-4,t+.022),n.connect(h).connect(c).connect(l),n.start(t,.2*Math.random(),.03)}function S(e,t,i,r,a,s){let{ctx:o,output:l}=e,n=E(o,l,s),h=o.createOscillator();h.type="sine",h.frequency.value=i*(1+(Math.random()-.5)*.008);let c=o.createGain();c.gain.setValueAtTime(0,t),c.gain.linearRampToValueAtTime(r,t+.002),c.gain.exponentialRampToValueAtTime(1e-4,t+a),h.connect(c).connect(n),h.start(t),h.stop(t+a+.02)}function L(e,t){let i=M();if(!i)return;let r=i.ctx.currentTime+.003,a=520-180*e+40*Math.random();A(i,r,a,2.6*a,.05,.16,t),D(i,r,3200,.05,t)}let P="arsher";function z(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(e)return`${e}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}let j=d.map(e=>({value:e.id,label:e.label,swatch:e.swatch}));function U({mode:e,theme:r}){let a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=a.current;if(!t)return;let i=()=>{let i=t.getBoundingClientRect();if(i.width<2||i.height<2)return;let a=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);t.width=Math.round(i.width*a),t.height=Math.round(i.height*a);let s=t.getContext("2d");if(!s)return;let l="dark"===r,n=o(i.width,i.height,e,"stage"===e?p.length:g.length);s.setTransform(a,0,0,a,0,0),s.fillStyle=l?"#232323":"#f2f2f2",s.fillRect(0,0,i.width,i.height),s.fillStyle=l?"#ff8048":"#ff8443",s.beginPath(),s.arc(n.disc.x,n.disc.y,n.disc.r,0,2*Math.PI),s.fill(),s.save(),s.translate(n.band.x,n.band.y),s.rotate(n.band.angle),s.fillStyle=l?"#3a5fff":"#2a55f5",s.beginPath(),s.roundRect(-n.band.hw,-n.band.hh,2*n.band.hw,2*n.band.hh,n.band.hh),s.fill(),s.restore(),s.fillStyle=l?"#ededed":"#161616",s.font=`620 ${n.fontPx}px ${z()}`,s.textAlign="center",s.fillText(P,n.word.cx,n.word.baseline),s.fillStyle=l?"rgb(255 255 255 / 0.12)":"rgb(255 255 255 / 0.55)",s.strokeStyle=l?"rgb(255 255 255 / 0.3)":"rgb(255 255 255 / 0.95)",s.lineWidth=1,s.beginPath(),s.roundRect(n.dock.cx-n.dock.hw,n.dock.cy-n.dock.hh,2*n.dock.hw,2*n.dock.hh,n.dock.r),s.arc(n.rest.x,n.rest.y,n.dropR,0,2*Math.PI),s.fill(),s.stroke()};i();let s=new ResizeObserver(i);return s.observe(t),()=>s.disconnect()},[e,r]),(0,t.jsx)("canvas",{ref:a,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A glass dock over the word arsher":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function({mode:e,active:l,reducedMotion:n,theme:h}){let c="stage"===e,d=c?p:g,[m]=(0,i.useState)(()=>new f(e,d.length)),v=(0,i.useRef)(null),b=(0,i.useRef)(null),y=(0,i.useRef)(null),_=(0,i.useRef)([]),w=(0,i.useRef)([]),T=(0,i.useId)(),[E,B]=(0,i.useState)(.6),[C,F]=(0,i.useState)(.3),[q,I]=(0,i.useState)("clear"),[X,N]=(0,i.useState)(0),[V,$]=(0,i.useState)(!1),[G,W]=(0,i.useState)(""),H=(0,i.useRef)({acc:0,wordDirty:!0,wordKey:"",fontTick:0,nextTab:3.2}),K=(0,i.useRef)([]),O=(0,i.useRef)(null),Y=(0,a.useLatest)({refraction:E,frost:C,tint:q,dark:"dark"===h,reducedMotion:n,theme:h}),Q=e=>{let t=ei.current.width;return t?(0,a.clamp)(e/t*1.4-.7,-.8,.8):0},J=(0,a.useLatest)({onMerge:(e,t)=>{c&&"path"!==m.driver&&(e?function(e){let t=M();if(!t)return;let i=t.ctx.currentTime+.003,r=300+30*Math.random();A(t,i,r,2.1*r,.075,.15,e),S(t,i+.01,2350+120*Math.random(),.018,.22,e),S(t,i+.01,3710+160*Math.random(),.01,.16,e)}(Q(t)):function(e){let t=M();if(!t)return;let i=t.ctx.currentTime+.003,r=760+80*Math.random();A(t,i,r,2.3*r,.032,.11,e),D(t,i,4200,.035,e)}(Q(t)),W(e?"The droplet merged with the tab bar":"The droplet pulled free of the tab bar"))}}),Z=(0,a.useFrame)(l,e=>{let t=v.current,i=et.current,r=H.current,s=Y.current,{width:o,height:l,dpr:n}=ei.current;if(!t||!i||o<2||l<2)return;if(!c){if(r.acc+=e,r.acc<1/30-.002)return;e=r.acc,r.acc=0}m.resize(o,l)&&(r.wordDirty=!0);let h=m.layout,u=`${Math.round(h.fontPx*n)}:${r.fontTick}`;if((r.wordDirty||u!==r.wordKey)&&(O.current??=document.createElement("canvas"),m.word=function(e,t,i=document.createElement("canvas")){let r=e*t,a=z(),s=`${Math.round(r)}:${a}`,o=i.getContext("2d"),l=Math.ceil(.08*r),n={canvas:i,width:1,height:1,inkLeft:0,inkWidth:1,baseline:1,key:s,coverage:null,pw:1,ph:1};if(!o)return n;let h=`600 ${r}px ${a}`;o.font=h,"letterSpacing"in o&&(o.letterSpacing=`${(-.055*r).toFixed(2)}px`);let c=o.measureText(P),d=c.actualBoundingBoxLeft||0,u=c.actualBoundingBoxRight||c.width,f=c.actualBoundingBoxAscent||.75*r,p=c.actualBoundingBoxDescent||.02*r,g=d+u;i.width=Math.max(1,Math.ceil(g+2*l)),i.height=Math.max(1,Math.ceil(f+p+2*l));let m=i.getContext("2d");if(!m)return n;m.fillStyle="#000",m.fillRect(0,0,i.width,i.height),m.font=h,"letterSpacing"in m&&(m.letterSpacing=`${(-.055*r).toFixed(2)}px`),m.textBaseline="alphabetic",m.textAlign="left",m.fillStyle="#fff",m.fillText(P,l+d,l+f);let x=Math.max(1,Math.floor(i.width/4)),v=Math.max(1,Math.floor(i.height/4)),b=null;try{let e=m.getImageData(0,0,i.width,i.height).data;b=new Uint8Array(x*v);for(let t=0;t<v;t++)for(let r=0;r<x;r++)b[t*x+r]=e[((4*t+2)*i.width+4*r+2)*4]}catch{b=null}return{coverage:b,pw:x,ph:v,canvas:i,width:i.width/t,height:i.height/t,inkLeft:l/t,inkWidth:g/t,baseline:(l+f)/t,key:s}}(h.fontPx,n,O.current),t.setType(m.word.canvas),r.wordKey=u,r.wordDirty=!1),!c){let t=eo.current;if(t.inside&&"mouse"===t.type){m.driver="hover",m.target=m.clampTarget(t.x,t.y);let{cx:e,cy:i,hw:r,hh:s}=h.dock;m.hoverIndex=Math.abs(t.x-e)<r&&Math.abs(t.y-i)<s?(0,a.clamp)(Math.floor((t.x-(e-r+h.padX))/h.pitch),0,d.length-1):-1}else"hover"===m.driver&&(m.driver="path"),m.hoverIndex=-1;if(!s.reducedMotion&&(r.nextTab-=e,r.nextTab<=0)){r.nextTab=3.4;let e=(m.selected+1)%d.length;m.select(e),N(e)}}m.step(e,s,J.current);let f=m.frame(n);f&&t.draw(f);for(let e=0;e<d.length;e++){let t=_.current[e];if(!t)continue;let{scale:i,lift:r}=m.iconTransform(e),a=m.tone[e],s=Math.round(22+225*a),o=Math.round(255-255*a),l=`translate3d(0, ${r.toFixed(2)}px, 0) scale(${i.toFixed(3)})|rgb(${s} ${s} ${s})|drop-shadow(0 0 ${c?3:2}px rgb(${o} ${o} ${o} / ${(.38-.1*a).toFixed(2)}))`;if(K.current[e]===l)continue;K.current[e]=l;let[n,h,d]=l.split("|");t.style.transform=n,t.style.color=h,t.style.filter=d}if(c&&y.current){let e=eo.current,t="drag"===m.driver?"grabbing":e.inside&&m.hitDroplet(e.x,e.y)?"grab":"";y.current.style.cursor!==t&&(y.current.style.cursor=t)}if(s.reducedMotion&&!m.busy&&!m.easing(s))return!1}),{canvasRef:ee,glRef:et,sizeRef:ei,size:er,supported:ea}=(0,a.useWebGL2)({mode:e,maxDpr:c?2:1.5,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new k(e)}catch(e){console.error(e);return}return v.current=t,H.current.wordDirty=!0,Z(),()=>{t?.dispose(),v.current=null}},onResize:()=>Z()});(0,i.useEffect)(()=>{let e=!0;return(function(){try{let e=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!e||!document.fonts)return Promise.resolve();return document.fonts.load(`600 96px ${e}`,P).then(()=>void 0).catch(()=>void 0)}catch{return Promise.resolve()}})().then(()=>{e&&(H.current.fontTick++,Z())}),()=>{e=!1}},[Z]),(0,i.useEffect)(()=>{Z()},[E,C,q,h,n,Z]);let es=c?y:ee,eo=(0,a.usePointer)(es,{capture:c,onDown:e=>{if(!c)return;R();let t=m.hitDroplet(e.x,e.y);m.grab=t?{x:e.x-m.dx.value,y:e.y-m.dy.value}:{x:0,y:0},m.driver="drag",m.target=m.clampTarget(e.x-m.grab.x,e.y-m.grab.y),L(t?.5:.2,Q(e.x)),$(!0),Z()},onMove:e=>{c&&e.pressed&&"drag"===m.driver&&(m.target=m.clampTarget(e.x-m.grab.x,e.y-m.grab.y)),Z()},onUp:()=>{c&&("drag"===m.driver&&(m.driver="rest"),Z())},onLeave:()=>Z()});(0,i.useEffect)(()=>{let e=b.current;if(!c||!e)return;let t=t=>{if("mouse"!==t.pointerType)return;let i=e.getBoundingClientRect();m.pointer={x:t.clientX-i.left,y:t.clientY-i.top,inside:!0},Z()},i=()=>{m.pointer={...m.pointer,inside:!1},Z()};return e.addEventListener("pointermove",t),e.addEventListener("pointerleave",i),()=>{e.removeEventListener("pointermove",t),e.removeEventListener("pointerleave",i)}},[c,m,Z]);let el=e=>{R(),m.select(e),N(e);let t=m.layout;!function(e){let t=M();if(!t)return;let i=t.ctx.currentTime+.003;S(t,i,2960+60*Math.random(),.04,.12,e),S(t,i,4620+80*Math.random(),.022,.08,e),D(t,i,5200,.03,e)}(t?Q(t.icons[e].x):0),$(!0),Z()},en=e=>{m.hoverIndex=e,Z()},eh=(0,i.useMemo)(()=>er.width>1&&er.height>1?o(er.width,er.height,e,d.length):null,[er.width,er.height,e,d.length]);if(!1===ea)return(0,t.jsx)(U,{mode:e,theme:h});let ec=eh?(0,t.jsx)("div",{"data-lab-controls":c?"":void 0,role:c?"radiogroup":void 0,"aria-label":c?"Tab bar":void 0,"aria-hidden":!c||void 0,onKeyDown:c?e=>{let t=d.length,i=-1;switch(e.key){case"ArrowRight":case"ArrowDown":i=(X+1)%t;break;case"ArrowLeft":case"ArrowUp":i=(X-1+t)%t;break;case"Home":i=0;break;case"End":i=t-1;break;default:return}e.preventDefault(),e.stopPropagation(),el(i),w.current[i]?.focus()}:void 0,onPointerLeave:c?()=>en(-1):void 0,className:(0,r.cn)("absolute",!c&&"pointer-events-none"),style:{left:eh.dock.cx-eh.dock.hw,top:eh.dock.cy-eh.dock.hh,width:2*eh.dock.hw,height:2*eh.dock.hh},children:d.map((e,i)=>{let a=i===X,s=(0,t.jsx)("span",{ref:e=>{_.current[i]=e},className:(0,r.cn)("block text-primary transition-opacity duration-300 ease-out will-change-transform",a?"opacity-100":"opacity-[0.62]"),children:(0,t.jsx)(x,{id:e.id,size:eh.iconSize,filled:a})}),o={left:eh.padX+eh.pitch*i,width:eh.pitch,top:c?4:2,bottom:c?4:2};return c?(0,t.jsx)("button",{ref:e=>{w.current[i]=e},type:"button",role:"radio","aria-checked":a,"aria-label":e.label,title:e.label,tabIndex:a?0:-1,onClick:()=>el(i),onPointerEnter:e=>{"mouse"===e.pointerType&&en(i)},onFocus:()=>en(i),onBlur:()=>en(-1),className:"absolute grid cursor-pointer place-items-center rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",style:o,children:s},e.id):(0,t.jsx)("span",{className:"absolute grid place-items-center",style:o,children:s},e.id)})}):null;if(!c)return(0,t.jsxs)("div",{className:"absolute inset-0",children:[(0,t.jsx)("canvas",{ref:ee,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),ec]});let ed=eh?.compact??!1;return(0,t.jsxs)("div",{ref:b,className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:y,tabIndex:0,role:"application","aria-roledescription":"liquid glass","aria-label":"Glass droplet","aria-describedby":T,onKeyDown:e=>{if(!c||e.altKey||e.ctrlKey||e.metaKey)return;let t=m.layout;if(!t)return;let i=(e.shiftKey?3:1)*Math.max(12,.75*t.dropR),r=!0;switch(e.key){case"ArrowLeft":m.nudge(-i,0);break;case"ArrowRight":m.nudge(i,0);break;case"ArrowUp":m.nudge(0,-i);break;case"ArrowDown":m.nudge(0,i);break;case"Enter":case" ":if(e.repeat)break;m.toggleMerge();break;default:r=!1}r&&(e.preventDefault(),e.stopPropagation(),R(),("Enter"===e.key||" "===e.key)&&L(.35,Q(m.dx.value)),$(!0),Z())},className:"group/glass absolute inset-0 touch-none outline-none [-webkit-tap-highlight-color:transparent]",children:[(0,t.jsx)("canvas",{ref:ee,className:"absolute inset-0 block size-full"}),(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_var(--foreground)] opacity-0 transition-opacity duration-200 group-focus-visible/glass:opacity-30"})]}),ec,(0,t.jsx)("p",{id:T,className:"sr-only",children:"Drag the droplet, or use the arrow keys to move it. Enter or Space drops it into the tab bar or lifts it back out. Tab to the tab bar and use the arrow keys to switch tabs."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:G}),(0,t.jsx)(s.StageControls,{placement:"top",children:(0,t.jsxs)(s.Tray,{label:"Tint and sound",children:[(0,t.jsx)(s.Swatches,{label:"Tint",options:j,value:q,onChange:e=>{I(e),W(`Tint: ${u(e).label}`)}}),(0,t.jsx)(s.TrayDivider,{}),(0,t.jsx)(s.MuteButton,{})]})}),(0,t.jsxs)(s.StageControls,{placement:"bottom",children:[(0,t.jsx)(s.TrayRow,{children:(0,t.jsxs)(s.Tray,{label:"Glass",children:[(0,t.jsx)(s.Slider,{label:"Refraction",value:E,min:0,max:1,step:.01,width:ed?64:96,showValue:!ed,onChange:B,format:e=>`${Math.round(100*e)}`}),(0,t.jsx)(s.TrayDivider,{}),(0,t.jsx)(s.Slider,{label:"Frost",value:C,min:0,max:1,step:.01,width:ed?64:96,showValue:!ed,onChange:F,format:e=>`${Math.round(100*e)}`})]})}),(0,t.jsx)(s.StageHint,{className:(0,r.cn)("transition-opacity duration-700",V&&"opacity-0"),children:"Drag the droplet into the bar and pull it back out"})]})]})}],95709)},80920,function(e){e.n(e.i(95709))}]);