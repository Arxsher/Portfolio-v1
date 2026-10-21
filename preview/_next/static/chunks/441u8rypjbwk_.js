(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,55171,e=>{"use strict";let t=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;function r(e,t,r){let i=e.createShader(t);if(!i)throw Error("lab/gl: could not create shader");if(e.shaderSource(i,r),e.compileShader(i),!e.getShaderParameter(i,e.COMPILE_STATUS)&&!e.isContextLost()){let t=e.getShaderInfoLog(i);throw e.deleteShader(i),Error(`lab/gl: shader failed to compile
${t}`)}return i}e.s(["FULLSCREEN_VERTEX",0,t,"createProgram",0,function(e,t,i){let a=r(e,e.VERTEX_SHADER,t),n=r(e,e.FRAGMENT_SHADER,i),o=e.createProgram();if(!o)throw Error("lab/gl: could not create program");if(e.attachShader(o,a),e.attachShader(o,n),e.linkProgram(o),e.deleteShader(a),e.deleteShader(n),!e.getProgramParameter(o,e.LINK_STATUS)&&!e.isContextLost()){let t=e.getProgramInfoLog(o);throw e.deleteProgram(o),Error(`lab/gl: program failed to link
${t}`)}return o},"drawFullscreen",0,function(e,t){void 0!==t&&e.bindVertexArray(t),e.drawArrays(e.TRIANGLES,0,3)},"rgb",0,function(e){let t=e.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let e=3===t[1].length?t[1].replace(/./g,e=>e+e):t[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let r=e.match(/[\d.]+/g)?.map(Number)??[0,0,0];return[(r[0]??0)/255,(r[1]??0)/255,(r[2]??0)/255]},"uniformLocations",0,function(e,t){let r=new Map;return i=>(r.has(i)||r.set(i,e.getUniformLocation(t,i)),r.get(i)??null)}])},7537,e=>{"use strict";var t=e.i(43476);function r({size:e=16,className:i,title:a,children:n}){return(0,t.jsxs)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none",className:i?`shrink-0 ${i}`:"shrink-0",role:a?"img":void 0,"aria-hidden":!a||void 0,"aria-label":a,focusable:"false",children:[a?(0,t.jsx)("title",{children:a}):null,n]})}function i({children:e,width:r=1.5}){return(0,t.jsx)("g",{stroke:"currentColor",strokeWidth:r,strokeLinecap:"round",strokeLinejoin:"round",children:e})}e.s(["ChevronLeft",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsx)(i,{children:(0,t.jsx)("path",{d:"M9.75 4 5.75 8l4 4"})})})},"ChevronRightSmall",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsx)(i,{children:(0,t.jsx)("path",{d:"M6.25 4l4 4-4 4"})})})},"Expand",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M2.75 5.5V2.75H5.5"}),(0,t.jsx)("path",{d:"M10.5 2.75h2.75V5.5"}),(0,t.jsx)("path",{d:"M13.25 10.5v2.75H10.5"}),(0,t.jsx)("path",{d:"M5.5 13.25H2.75V10.5"})]})})},"GridView",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{width:1.4,children:[(0,t.jsx)("rect",{x:"2.75",y:"2.75",width:"4.25",height:"5.5",rx:"1.25"}),(0,t.jsx)("rect",{x:"9",y:"2.75",width:"4.25",height:"3.5",rx:"1.25"}),(0,t.jsx)("rect",{x:"2.75",y:"10.25",width:"4.25",height:"3",rx:"1.25"}),(0,t.jsx)("rect",{x:"9",y:"8.25",width:"4.25",height:"5",rx:"1.25"})]})})},"ListView",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M2.75 4.25h10.5"}),(0,t.jsx)("path",{d:"M2.75 8h10.5"}),(0,t.jsx)("path",{d:"M2.75 11.75h10.5"})]})})},"Minus",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsx)(i,{children:(0,t.jsx)("path",{d:"M3.5 8h9"})})})},"Play",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsx)("path",{d:"M4.75 3.9c0-.77.83-1.25 1.5-.87l6.6 3.83c.67.39.67 1.36 0 1.74l-6.6 3.83c-.67.38-1.5-.1-1.5-.87V3.9Z",fill:"currentColor"})})},"Plus",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M8 3.5v9"}),(0,t.jsx)("path",{d:"M3.5 8h9"})]})})},"Reset",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M3.5 8.5a4.5 4.5 0 1 0 1.32-3.68L3.25 6.25"}),(0,t.jsx)("path",{d:"M3.25 3.25v3h3"})]})})},"Return",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M12.75 3.5v3.75a2 2 0 0 1-2 2H3.75"}),(0,t.jsx)("path",{d:"M6.25 6.75 3.75 9.25l2.5 2.5"})]})})},"Share",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M8 2.5v7.25"}),(0,t.jsx)("path",{d:"M5.5 5 8 2.5 10.5 5"}),(0,t.jsx)("path",{d:"M5.25 7.25h-.75a1.25 1.25 0 0 0-1.25 1.25v3.75c0 .69.56 1.25 1.25 1.25h7a1.25 1.25 0 0 0 1.25-1.25V8.5a1.25 1.25 0 0 0-1.25-1.25h-.75"})]})})},"Shrink",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M5.75 2.75v3h-3"}),(0,t.jsx)("path",{d:"M13.25 5.75h-3v-3"}),(0,t.jsx)("path",{d:"M10.25 13.25v-3h3"}),(0,t.jsx)("path",{d:"M2.75 10.25h3v3"})]})})},"Shuffle",0,function(e){return(0,t.jsx)(r,{...e,children:(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M2.5 4.75h1.6c1.03 0 1.99.53 2.54 1.4l2.72 3.7c.55.87 1.51 1.4 2.54 1.4h1.6"}),(0,t.jsx)("path",{d:"M2.5 11.25h1.6c.84 0 1.63-.35 2.2-.95"}),(0,t.jsx)("path",{d:"M9.7 5.7c.57-.6 1.36-.95 2.2-.95h1.6"}),(0,t.jsx)("path",{d:"m11.75 3 1.75 1.75-1.75 1.75"}),(0,t.jsx)("path",{d:"m11.75 9.5 1.75 1.75-1.75 1.75"})]})})},"SpeakerOff",0,function(e){return(0,t.jsxs)(r,{...e,children:[(0,t.jsx)("path",{d:"M2.5 6.6c0-.47.38-.85.85-.85h1.6L7.6 3.5c.4-.34 1.02-.06 1.02.47v8.06c0 .53-.62.81-1.02.47L4.95 10.25h-1.6a.85.85 0 0 1-.85-.85V6.6Z",fill:"currentColor"}),(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"m10.75 6.25 3 3.5"}),(0,t.jsx)("path",{d:"m13.75 6.25-3 3.5"})]})]})},"SpeakerOn",0,function(e){return(0,t.jsxs)(r,{...e,children:[(0,t.jsx)("path",{d:"M2.5 6.6c0-.47.38-.85.85-.85h1.6L7.6 3.5c.4-.34 1.02-.06 1.02.47v8.06c0 .53-.62.81-1.02.47L4.95 10.25h-1.6a.85.85 0 0 1-.85-.85V6.6Z",fill:"currentColor"}),(0,t.jsxs)(i,{children:[(0,t.jsx)("path",{d:"M10.9 6.1a2.6 2.6 0 0 1 0 3.8"}),(0,t.jsx)("path",{d:"M12.55 4.4a5 5 0 0 1 0 7.2"})]})]})}])},34579,e=>{"use strict";var t=e.i(43476),r=e.i(71645),i=e.i(33209),a=e.i(16442),n=e.i(37047),o=e.i(7537),s=e.i(45219),l=e.i(55171);let u=`#version 300 es
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  vL = p - vec2(uTexel.x, 0.0);
  vR = p + vec2(uTexel.x, 0.0);
  vT = p + vec2(0.0, uTexel.y);
  vB = p - vec2(0.0, uTexel.y);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,c=`#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
`,d=`${c}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uSimTexel;
uniform float uDt;
uniform float uKeep;
void main() {
  vec2 back = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  outColor = uKeep * texture(uSource, back);
}
`,h=`${c}
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform float uAspect;
uniform float uRadius;
uniform vec4 uColor;
uniform float uRadial;
uniform float uCap;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float g = exp(-dot(p, p) / uRadius);
  vec4 base = texture(uTarget, vUv);
  vec4 add = uColor * g;
  if (uRadial > 0.5) {
    // a drop landing: water pushed out from where it fell
    float r = length(p);
    vec2 dir = r > 1e-5 ? p / r : vec2(0.0);
    dir.x /= uAspect;
    add = vec4(dir * uColor.x * g * smoothstep(0.0, sqrt(uRadius), r) * 2.0, 0.0, 0.0);
  }
  vec4 sum = base + add;
  // dye: keep the amount (w) under a cap, scaling the colour with it
  if (uCap > 0.0 && sum.w > uCap) sum *= uCap / sum.w;
  outColor = sum;
}
`,f=`${c}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`,p=`${c}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float uStrength;
uniform float uDt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= uStrength * C;
  force.y = -force.y;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(v, -2000.0, 2000.0), 0.0, 1.0);
}
`,x=`${c}
uniform sampler2D uVelocity;
void main() {
  vec2 C = texture(uVelocity, vUv).xy;
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  // walls: the water can't leave the dish
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`,m=`${c}
uniform sampler2D uSource;
uniform float uValue;
void main() {
  outColor = uValue * texture(uSource, vUv);
}
`,v=`${c}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  outColor = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
}
`,g=`${c}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - 0.5 * vec2(R - L, T - B);
  outColor = vec4(v, 0.0, 1.0);
}
`,b=`${c}
uniform sampler2D uSource;
void main() {
  outColor = texture(uSource, vUv);
}
`,y=`${c}
uniform sampler2D uDye;
uniform vec2 uDyeTexel;
uniform vec2 uRes;
uniform float uNight;
uniform vec3 uPaper;
uniform vec3 uDeep;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec4 d = max(texture(uDye, vUv), 0.0);
  float a = d.w;
  float aL = texture(uDye, vUv - vec2(uDyeTexel.x, 0.0)).w;
  float aR = texture(uDye, vUv + vec2(uDyeTexel.x, 0.0)).w;
  float aB = texture(uDye, vUv - vec2(0.0, uDyeTexel.y)).w;
  float aT = texture(uDye, vUv + vec2(0.0, uDyeTexel.y)).w;
  vec2 grad = vec2(aR - aL, aT - aB);
  float edge = clamp(length(grad) * 5.0, 0.0, 1.0);

  // the ink as a thin wet film: its slope catches a light from the top left
  vec3 n = normalize(vec3(-grad * 7.0, 1.0));
  vec3 h = normalize(vec3(-0.35, 0.5, 0.79) + vec3(0.0, 0.0, 1.0));
  float wet = smoothstep(0.02, 0.3, a);
  float spec = pow(max(dot(n, h), 0.0), 48.0) * wet;

  vec2 px = vUv * uRes;
  vec2 c = vUv - 0.5;
  float vignette = 1.0 - dot(c, c) * 0.5;

  // paper: long fibres and a fine tooth
  float fibre = noise(px * vec2(0.08, 0.6)) * 0.5 + noise(px * 0.25) * 0.35 + noise(px * 1.3) * 0.15;
  vec3 paper = uPaper * (0.975 + 0.05 * fibre) * mix(1.0, vignette, 0.35);
  vec3 absorb = max(vec3(a) - d.rgb, 0.0) * 1.35 + a * 0.14;
  absorb *= 1.0 + edge * 0.55;
  vec3 day = paper * exp(-absorb);
  day += vec3(spec * 0.16 * (1.0 - min(a, 1.0) * 0.4));

  // dark water: the ink glows, and its edges carry a faint light
  vec3 deep = uDeep * (0.85 + 0.3 * vignette) + vec3(noise(px * 0.02) * 0.012);
  vec3 glow = 1.0 - exp(-d.rgb * 1.25);
  vec3 night = deep + glow + spec * 0.1 + glow * edge * 0.25;

  vec3 col = mix(day, night, uNight);
  col += (hash(px + 17.0) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;class w{gl;vao;size;fmt;p;velocity=null;dye=null;pressure=null;divergence=null;curl=null;cssW=1;cssH=1;aspect=1;constructor(e,t){if(this.gl=e,this.size=t,!(e.getExtension("EXT_color_buffer_float")??e.getExtension("EXT_color_buffer_half_float")))throw Error("ink: this GPU can't render to half-float targets");this.vao=e.createVertexArray();const r=t=>{let r=(0,l.createProgram)(e,u,t);return{program:r,u:(0,l.uniformLocations)(e,r)}};this.p={advect:r(d),splat:r(h),curl:r(f),vorticity:r(p),divergence:r(x),scale:r(m),pressure:r(v),gradient:r(g),copy:r(b),display:r(y)};const i=this.target(4,4,e.RG16F,e.RG),a=null!==i;if(i&&this.free(i),this.fmt=a?{two:[e.RG16F,e.RG],one:[e.R16F,e.RED]}:{two:[e.RGBA16F,e.RGBA],one:[e.RGBA16F,e.RGBA]},!this.target(4,4,e.RGBA16F,e.RGBA,!0))throw Error("ink: no half-float framebuffer")}resize(e,t){let r=this.gl;if(e<2||t<2)return;this.cssW=e,this.cssH=t,this.aspect=e/t;let i=r=>{let i=r/Math.min(e,t);return[Math.max(8,Math.round(e*i)),Math.max(8,Math.round(t*i))]},[a,n]=i(this.size.sim),[o,s]=i(this.size.dye);if(this.velocity&&this.velocity.read.w===a&&this.velocity.read.h===n&&this.dye?.read.w===o&&this.dye.read.h===s)return;let l=(e,t,[r,i],a)=>{let n=this.target(e,t,r,i),o=this.target(e,t,r,i);if(!n||!o)throw Error("ink: could not allocate targets");return a&&(this.run(this.p.copy,n,{uSource:a.read}),this.free(a.read),this.free(a.write)),{read:n,write:o}};for(let e of(this.velocity=l(a,n,this.fmt.two,this.velocity),this.dye=l(o,s,[r.RGBA16F,r.RGBA],this.dye),this.pressure&&(this.free(this.pressure.read),this.free(this.pressure.write)),this.pressure=l(a,n,this.fmt.one,null),this.divergence&&this.free(this.divergence),this.curl&&this.free(this.curl),this.divergence=this.target(a,n,...this.fmt.one),this.curl=this.target(a,n,...this.fmt.one),[this.pressure.read,this.pressure.write,this.divergence,this.curl]))e&&this.clear(e)}splat(e,t,r,i,a,n,o,s,l){let u=this.velocity,c=this.dye;if(u&&c){if(0!==r||0!==i){let a=u.read.w/this.cssW;this.run(this.p.splat,u.write,{uTarget:u.read,uPoint:[e,t],uAspect:this.aspect,uRadius:l,uColor:[r*a,i*a,0,0],uRadial:0,uCap:0}),j(u)}s>0&&(this.run(this.p.splat,c.write,{uTarget:c.read,uPoint:[e,t],uAspect:this.aspect,uRadius:l,uColor:[a*s,n*s,o*s,s],uRadial:0,uCap:3}),j(c))}}bloom(e,t,r,i){let a=this.velocity;if(!a)return;let n=a.read.w/this.cssW;this.run(this.p.splat,a.write,{uTarget:a.read,uPoint:[e,t],uAspect:this.aspect,uRadius:i,uColor:[r*n,0,0,0],uRadial:1,uCap:0}),j(a)}step(e,t,r){let i=this.velocity,a=this.dye,n=this.pressure,o=this.curl,s=this.divergence;if(!i||!a||!n||!o||!s)return;let l=this.p,u=[1/i.read.w,1/i.read.h];this.run(l.curl,o,{uVelocity:i.read},u),this.run(l.vorticity,i.write,{uVelocity:i.read,uCurl:o,uStrength:16,uDt:e},u),j(i),this.run(l.divergence,s,{uVelocity:i.read},u),this.run(l.scale,n.write,{uSource:n.read,uValue:.8},u),j(n);for(let e=0;e<20;e++)this.run(l.pressure,n.write,{uPressure:n.read,uDivergence:s},u),j(n);this.run(l.gradient,i.write,{uPressure:n.read,uVelocity:i.read},u),j(i),this.run(l.advect,i.write,{uVelocity:i.read,uSource:i.read,uSimTexel:u,uDt:e,uKeep:Math.pow(t,e)}),j(i),this.run(l.advect,a.write,{uVelocity:i.read,uSource:a.read,uSimTexel:u,uDt:e,uKeep:Math.pow(r,e)}),j(a)}render(e,t,r,i,a){let n=this.gl,o=this.dye;if(!o)return;n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,e,t);let{program:s,u:l}=this.p.display;n.useProgram(s),n.uniform2f(l("uTexel"),1/e,1/t),this.bind(l("uDye"),0,o.read),n.uniform2f(l("uDyeTexel"),1/o.read.w,1/o.read.h),n.uniform2f(l("uRes"),e,t),n.uniform1f(l("uNight"),r),n.uniform3f(l("uPaper"),i[0],i[1],i[2]),n.uniform3f(l("uDeep"),a[0],a[1],a[2]),n.bindVertexArray(this.vao),n.drawArrays(n.TRIANGLES,0,3)}clearAll(){for(let e of[this.velocity,this.dye,this.pressure])e&&(this.clear(e.read),this.clear(e.write))}dispose(){let e=this.gl;for(let e of[this.velocity,this.dye,this.pressure])e&&(this.free(e.read),this.free(e.write));for(let{program:t}of(this.divergence&&this.free(this.divergence),this.curl&&this.free(this.curl),Object.values(this.p)))e.deleteProgram(t);e.deleteVertexArray(this.vao),this.velocity=this.dye=this.pressure=null,this.divergence=this.curl=null}target(e,t,r,i,a=!1){let n=this.gl,o=n.createTexture(),s=n.createFramebuffer();if(!o||!s)return null;n.bindTexture(n.TEXTURE_2D,o),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),n.texImage2D(n.TEXTURE_2D,0,r,e,t,0,i,n.HALF_FLOAT,null),n.bindFramebuffer(n.FRAMEBUFFER,s),n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,o,0);let l=n.checkFramebufferStatus(n.FRAMEBUFFER)===n.FRAMEBUFFER_COMPLETE;n.bindFramebuffer(n.FRAMEBUFFER,null);let u={tex:o,fbo:s,w:e,h:t};return!l||a?(this.free(u),l?u:null):(this.clear(u),u)}free(e){this.gl.deleteTexture(e.tex),this.gl.deleteFramebuffer(e.fbo)}clear(e){let t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,e.fbo),t.viewport(0,0,e.w,e.h),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.bindFramebuffer(t.FRAMEBUFFER,null)}bind(e,t,r){let i=this.gl;i.activeTexture(i.TEXTURE0+t),i.bindTexture(i.TEXTURE_2D,r.tex),i.uniform1i(e,t)}run({program:e,u:t},r,i,a){let n=this.gl;n.useProgram(e),n.bindFramebuffer(n.FRAMEBUFFER,r.fbo),n.viewport(0,0,r.w,r.h);let o=a??[1/r.w,1/r.h];n.uniform2f(t("uTexel"),o[0],o[1]);let s=0;for(let e in i){let r=i[e],a=t(e);"number"==typeof r?n.uniform1f(a,r):void 0!==r.fbo?this.bind(a,s++,r):2===r.length?n.uniform2f(a,r[0],r[1]):3===r.length?n.uniform3f(a,r[0],r[1],r[2]):n.uniform4f(a,r[0],r[1],r[2],r[3])}n.bindVertexArray(this.vao),n.drawArrays(n.TRIANGLES,0,3)}}function j(e){let t=e.read;e.read=e.write,e.write=t}class _{nodes=null;start(e){if(this.nodes)return;let{ctx:t,output:r}=e,i=t.createBufferSource();i.buffer=(0,a.noiseBuffer)(t,2),i.loop=!0;let n=t.createBiquadFilter();n.type="bandpass",n.frequency.value=600,n.Q.value=1.1;let o=t.createBiquadFilter();o.type="lowpass",o.frequency.value=2200;let s=t.createGain();s.gain.value=0,i.connect(n).connect(o).connect(s).connect(r),i.start(),this.nodes={src:i,band:n,gain:s}}set(e,t){if(!this.nodes||!e)return;let r=e.ctx.currentTime,i=Math.min(1,Math.max(0,t));this.nodes.gain.gain.setTargetAtTime(i*i*.12,r,i>.02?.05:.18),this.nodes.band.frequency.setTargetAtTime(420+1100*i,r,.08)}stop(){if(this.nodes){try{this.nodes.src.stop()}catch{}this.nodes.src.disconnect(),this.nodes.gain.disconnect(),this.nodes=null}}}let T=[{value:"spectrum",label:"Spectrum",swatch:"conic-gradient(from 200deg,#e0403a,#e9a23b,#3fae6a,#2f7fd0,#8b4fd6,#e0403a)"},{value:"indigo",label:"Indigo",swatch:"linear-gradient(135deg,#16245e,#2f86c8)"},{value:"mono",label:"Mono",swatch:"linear-gradient(135deg,#0d0d0f,#6b6b70)"}],R=[.962,.952,.928],M=[.022,.022,.028];function k(e,t,r){let i=t=>(t+12*e)%12,a=t*Math.min(r,1-r),n=e=>r-a*Math.max(-1,Math.min(i(e)-3,9-i(e),1));return[n(0),n(8),n(4)]}function A(e,t,r){if("spectrum"===e)return r?k(t%1,.9,.58):k(t%1,.78,.42);if("indigo"===e){let e=.5+.5*Math.sin(9*t);return r?[.12+.06*e,.32+.45*e,1]:[.07+.02*e,.12+.22*e,.42+.22*e]}return r?[.86,.87,.92]:[.05,.05,.06]}function D(){return(0,t.jsx)("div",{"aria-hidden":"true",className:"absolute inset-0 bg-[#f5f3ee] dark:bg-[#060607]",style:{backgroundImage:"radial-gradient(40% 30% at 35% 40%, rgb(47 127 208 / 0.55), transparent 70%), radial-gradient(35% 28% at 64% 52%, rgb(224 64 58 / 0.45), transparent 70%), radial-gradient(30% 25% at 46% 68%, rgb(233 162 59 / 0.45), transparent 70%)"}})}e.s(["default",0,function({mode:e,active:l,reducedMotion:u,theme:c}){let d="stage"===e,h=(0,r.useRef)(null),f=(0,r.useRef)(null),p=(0,r.useRef)(new _),x=(0,r.useId)(),m=(0,n.useFinePointer)(),[v,g]=(0,r.useState)("spectrum"),[b,y]=(0,r.useState)(!1),[j,k]=(0,r.useState)(!1),[E,C]=(0,r.useState)(""),[S]=(0,r.useState)(()=>({ink:"spectrum",night:+("dark"===c),theme:c,reduced:u,over:!1,down:!1,id:-1,x:0,y:0,fx:0,fy:0,downAt:0,downX:0,downY:0,moved:!1,hue:Math.random(),drops:[],pushes:[],rinse:0,lastInput:performance.now()/1e3,time:0,acc:0,nextDrop:1.2,stir:0,dealt:!1}));S.ink=v,S.theme=c,S.reduced=u;let P=(0,r.useCallback)(()=>{S.lastInput=performance.now()/1e3,L.current()},[S]),L=(0,r.useRef)(()=>{}),N=(0,r.useCallback)((e,t,r)=>{let i="dark"===S.theme,a=[[.36,.62,1],[.64,.5,.8],[.45,.34,.9]];if(!S.reduced){d&&S.drops.push(...a);return}for(let[t,r,n]of a){let[a,o,s]=A(S.ink,S.hue+=.21,i);e.splat(t,r,0,0,a,o,s,1.6*n,.006*n),e.bloom(t,r,260*n,.006*n)}for(let i=0;i<140;i++){let a=i/60,n=.5+.3*Math.sin(1.7*a),o=.5+.25*Math.sin(2.3*a+1);e.splat(n,o,.3*Math.cos(1.7*a)*1.7*t,.25*Math.cos(2.3*a+1)*2.3*r,0,0,0,0,.003),e.step(1/60,.3,1)}},[S,d]),U=(0,n.useFrame)(l&&!j,e=>{let t=f.current,r=B.current;if(!t||r.width<2)return!1;let i=e;if(!d){if(S.acc+=i,S.acc<1/30-.002)return;i=Math.min(.1,S.acc),S.acc=0}i=Math.min(i,1/30),S.time+=i;let o=performance.now()/1e3,s=o-S.lastInput,l=S.reduced,u="dark"===S.theme,{width:c,height:h}=r,x=d?.0011:.0016,m=Math.sqrt(x)*h,v=(e,r,a,o,s,l)=>{let d=a-e,f=o-r,p=Math.hypot(d,f),v=(0,n.clamp)(Math.ceil(p/(.5*m)),1,16),g=p/v/(1.77*m),b=d/i*s*g,y=-f/i*s*g;for(let i=1;i<=v;i++){let a=i/v,n=0,o=0,s=0;l>0&&(S.hue+=p/v*7e-4,[n,o,s]=A(S.ink,S.hue,u)),t.splat((e+d*a)/c,1-(r+f*a)/h,b,y,n,o,s,l*g,x)}return p};if(S.over||S.down){let e=Math.hypot(S.x-S.fx,S.y-S.fy);if(e>.25)v(S.fx,S.fy,S.x,S.y,S.down?1:.7,.8*!!S.down),p.current.set((0,a.getAudio)(),Math.min(1,e/i/2200));else if(p.current.set((0,a.getAudio)(),0),S.down&&o-S.downAt>.25){let[e,r,a]=A(S.ink,S.hue+=.05*i,u);t.splat(S.x/c,1-S.y/h,0,0,e,r,a,1.4*i,2.2*x)}S.fx=S.x,S.fy=S.y}for(;S.drops.length;){let[e,r,i]=S.drops.shift(),[n,o,s]=A(S.ink,S.hue+=.19,u),l=(d?.0042:.006)*i;t.splat(e,r,0,0,n,o,s,1.7*i,l),t.bloom(e,r,(d?340:160)*i,1.3*l);let c=(0,a.getAudio)();d&&c&&!(0,a.isMuted)()&&function(e,t=.5){let{ctx:r,output:i}=e,n=r.currentTime+.005,o=(e,t,a,n,o)=>{let s=r.createOscillator();s.type="sine",s.frequency.setValueAtTime(t,e),s.frequency.exponentialRampToValueAtTime(a,e+.6*o);let l=r.createGain();l.gain.setValueAtTime(0,e),l.gain.linearRampToValueAtTime(n,e+.004),l.gain.exponentialRampToValueAtTime(1e-4,e+o),s.connect(l).connect(i),s.start(e),s.stop(e+o+.02)},s=1-.45*t;o(n,1500*s,520*s,.22,.11),o(n+.045,2300*s,900*s,.07,.06);let l=r.createBufferSource();l.buffer=(0,a.noiseBuffer)(r,1);let u=r.createBiquadFilter();u.type="highpass",u.frequency.value=2500;let c=r.createGain();c.gain.setValueAtTime(.05+.05*t,n),c.gain.exponentialRampToValueAtTime(1e-4,n+.07),l.connect(u).connect(c).connect(i),l.start(n,.5*Math.random(),.09)}(c,i)}for(;S.pushes.length;){let[e,r]=S.pushes.shift();for(let i=0;i<5;i++){let a=(i+.5)/5,n=0===e?.2+.6*a:.5-.25*e,o=0===r?.2+.6*a:.5-.25*r;t.splat(n,o,900*e,900*r,0,0,0,0,.004)}}if(d){if(!l&&s<26){let e=(0,n.clamp)((26-s)/4),r=S.time;t.splat(.5+.35*Math.sin(.21*r),.5+.3*Math.sin(.17*r+2),40*Math.cos(.31*r)*i*e,40*Math.sin(.27*r)*i*e,0,0,0,0,.02)}}else if(!l){let e=(e,t)=>{t[0]=(.5+.3*Math.sin(.9*e))*c,t[1]=(.5+.27*Math.sin(1.23*e+1.1))*h},t=[0,0],r=[0,0];e(S.time-i,t),e(S.time,r),v(t[0],t[1],r[0],r[1],1.4,.9),S.nextDrop-=i,S.nextDrop<=0&&(S.nextDrop=3.2+2*Math.random(),S.drops.push([.25+.5*Math.random(),.25+.5*Math.random(),.8]))}let g=d?.975:.9,b=.35;S.rinse>0&&(S.rinse-=i,g=.02,b=.6),t.step(i,b,g);let y=+!!u;S.night=l?y:(0,n.damp)(S.night,y,6,i),.003>Math.abs(S.night-y)&&(S.night=y);let w=F.current;w&&t.render(w.width,w.height,S.night,R,M);let j=S.down||S.drops.length>0||S.rinse>0||S.night!==y;if(d){if(!j&&s>(l?3:28))return!1}else if(l&&!j)return!1});L.current=U;let{canvasRef:F,sizeRef:B,supported:V}=(0,n.useWebGL2)({mode:e,maxDpr:d?2:1.25,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!1,depth:!1,stencil:!1},onContext:e=>{let t;try{t=new w(e,d?{sim:128,dye:512}:{sim:56,dye:168})}catch(e){console.error(e),k(!0);return}f.current=t;let{width:r,height:i}=B.current;return t.resize(r,i),S.dealt||(S.dealt=!0,N(t,r,i)),U(),()=>{t.dispose(),f.current=null}},onResize:e=>{f.current?.resize(e.width,e.height),U()}});(0,r.useEffect)(()=>{U()},[c,U]),(0,r.useEffect)(()=>{let e=p.current;return l||e.stop(),()=>e.stop()},[l]);let I=e=>{let t=h.current?.getBoundingClientRect();return t?[e.clientX-t.left,e.clientY-t.top]:[0,0]},z=()=>{b||y(!0);let e=(0,a.ensureAudio)();e&&p.current.start(e)},G=e=>{if(!S.down||e.pointerId!==S.id)return;S.down=!1,S.id=-1;let t=performance.now()/1e3-S.downAt<.3;if(!S.moved&&t&&"pointerup"===e.type){let{width:e,height:t}=B.current;S.drops.push([S.x/e,1-S.y/t,1])}"mouse"!==e.pointerType&&(S.over=!1),p.current.set((0,a.getAudio)(),0),P()},O=()=>{S.rinse=1.1;let e=(0,a.ensureAudio)();e&&!(0,a.isMuted)()&&function(e){let{ctx:t,output:r}=e,i=t.currentTime+.005,n=t.createBufferSource();n.buffer=(0,a.noiseBuffer)(t,2);let o=t.createBiquadFilter();o.type="bandpass",o.Q.value=.8,o.frequency.setValueAtTime(900,i),o.frequency.exponentialRampToValueAtTime(260,i+1.1);let s=t.createGain();s.gain.setValueAtTime(0,i),s.gain.linearRampToValueAtTime(.16,i+.12),s.gain.exponentialRampToValueAtTime(1e-4,i+1.3),n.connect(o).connect(s).connect(r),n.start(i,0,1.4)}(e),C("Rinsed: the water is clear"),P()},q=e=>{g(e),C(`${T.find(t=>t.value===e)?.label} ink`)},X=!1===V||j;return d?(0,t.jsxs)("div",{ref:h,className:"absolute inset-0 select-none [-webkit-tap-highlight-color:transparent]",style:{touchAction:"none"},onPointerDown:e=>{if(!d||e.button>0||e.target.closest("[data-lab-controls]"))return;let[t,r]=I(e);h.current?.setPointerCapture(e.pointerId),S.down=!0,S.id=e.pointerId,S.x=S.fx=S.downX=t,S.y=S.fy=S.downY=r,S.downAt=performance.now()/1e3,S.moved=!1,z(),P()},onPointerMove:e=>{if(!d||S.down&&e.pointerId!==S.id)return;let[t,r]=I(e);if(!S.down){if("mouse"!==e.pointerType)return;S.over||(S.over=!0,S.fx=t,S.fy=r)}S.x=t,S.y=r,Math.hypot(t-S.downX,r-S.downY)>6&&(S.moved=!0),P()},onPointerUp:G,onPointerCancel:G,onPointerLeave:e=>{"mouse"!==e.pointerType||S.down||(S.over=!1,p.current.set((0,a.getAudio)(),0))},children:[X?(0,t.jsx)(D,{}):(0,t.jsx)("canvas",{ref:F,"aria-hidden":"true",className:"absolute inset-0 size-full"}),(0,t.jsx)("div",{tabIndex:X?void 0:0,role:"img","aria-label":"A dish of water with ink swirling in it","aria-describedby":x,onKeyDown:X?void 0:e=>{let t=e.key;" "===t||"Enter"===t?(e.preventDefault(),z(),S.drops.push([.3+.4*Math.random(),.3+.4*Math.random(),.9+.2*Math.random()]),P()):t.startsWith("Arrow")?(e.preventDefault(),S.pushes.push({ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[t]??[0,0]),z(),P()):"r"===t||"R"===t?O():("1"===t||"2"===t||"3"===t)&&q(T[Number(t)-1].value)},className:"absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"}),(0,t.jsx)("p",{id:x,className:"sr-only",children:"Ink in water. Space or Enter drops ink, the arrow keys push a current through the water, R rinses the dish clear, and 1 to 3 change the ink. With a pointer: press and drag to pour and stir, and tap to drop ink."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:E}),(0,t.jsxs)(s.StageControls,{placement:"bottom",children:[(0,t.jsxs)(s.TrayRow,{children:[(0,t.jsx)(s.Tray,{label:"Ink",children:(0,t.jsx)(s.Swatches,{label:"Ink",options:T,value:v,onChange:q})}),X?null:(0,t.jsxs)(s.Tray,{label:"Dish",children:[(0,t.jsx)(s.IconButton,{label:"Rinse the dish",onClick:O,children:(0,t.jsx)(o.Reset,{size:16})}),(0,t.jsx)(s.TrayDivider,{}),(0,t.jsx)(s.MuteButton,{})]})]}),(0,t.jsx)(s.StageHint,{className:(0,i.cn)("transition-opacity duration-700",b&&"opacity-0"),children:X?"A still: this browser can't run the live fluid":m?"Drag to pour and stir · move over the water to push the ink · click for a drop":"Drag to pour and stir · tap for a drop"})]})]}):(0,t.jsx)("div",{ref:h,"aria-hidden":"true",className:"absolute inset-0",children:X?(0,t.jsx)(D,{}):(0,t.jsx)("canvas",{ref:F,className:"absolute inset-0 size-full"})})}],34579)},45603,function(e){e.n(e.i(34579))},45219,e=>{"use strict";var t=e.i(43476),r=e.i(71645),i=e.i(33209),a=e.i(16442),n=e.i(7537);let o=`
@keyframes lab-roll-up { from { translate: 0 55%; opacity: 0; filter: blur(2px); } }
@keyframes lab-roll-down { from { translate: 0 -55%; opacity: 0; filter: blur(2px); } }
.lab-roll[data-dir="up"] { animation: lab-roll-up 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.lab-roll[data-dir="down"] { animation: lab-roll-down 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .lab-roll[data-dir] { animation: none; }
}
`;function s(){return(0,t.jsx)("style",{href:"lab-ui",precedence:"default",children:o})}let l="relative inline-flex h-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-[12px] outline-none transition-[background-color,color,scale,opacity] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",u="text-secondary hover:bg-well hover:text-primary",c="shrink-0 whitespace-nowrap ps-2.5 pe-1 text-[13px] text-secondary",d="bg-[color-mix(in_oklab,var(--foreground)_14%,transparent)]",h={top:"top-3 inset-x-3 justify-center sm:top-4",bottom:"bottom-3 inset-x-3 justify-center sm:bottom-4","top-left":"top-3 start-3 justify-start sm:top-4 sm:start-4","top-right":"top-3 end-3 justify-end sm:top-4 sm:end-4","bottom-left":"bottom-3 start-3 justify-start sm:bottom-4 sm:start-4","bottom-right":"bottom-3 end-3 justify-end sm:bottom-4 sm:end-4"};function f({placement:e="bottom",label:r,className:a,children:n}){let o=e.startsWith("bottom")?"flex-col-reverse":"flex-col";return(0,t.jsx)("div",{role:r?"group":void 0,"aria-label":r,"data-lab-controls":"",className:(0,i.cn)("pointer-events-none absolute z-10 flex items-center gap-2",o,e.endsWith("left")&&"items-start",e.endsWith("right")&&"items-end",h[e],a),children:n})}function p({label:e,pressed:r,size:a="md",className:n,children:o,...s}){return(0,t.jsx)("button",{type:"button","aria-label":e,title:e,"aria-pressed":r,className:(0,i.cn)(l,u,"md"===a?"size-10":"size-8 rounded-[10px]",r&&"bg-well text-primary",n),...s,children:o})}function x(e,t,i){let a=(0,r.useRef)([]);return{refs:a,onKeyDown:r=>{let n=e.length;if(!n)return;let o=Math.max(0,e.indexOf(t)),s=-1;switch(r.key){case"ArrowRight":case"ArrowDown":s=(o+1)%n;break;case"ArrowLeft":case"ArrowUp":s=(o-1+n)%n;break;case"Home":s=0;break;case"End":s=n-1;break;default:return}r.preventDefault(),r.stopPropagation(),i(e[s]),a.current[s]?.focus()}}}function m(e){let t=String(e),r=t.indexOf(".");return r<0?0:t.length-r-1}function v(e,t,r,i){let a=Math.round((e-t)/i)*i+t;return Number(Math.min(r,Math.max(t,a)).toFixed(m(i)))}e.s(["IconButton",0,p,"MuteButton",0,function({size:e="md",className:r}){let i=(0,a.useMuted)();return(0,t.jsx)(p,{label:"Mute",pressed:i,size:e,onClick:()=>(0,a.toggleMuted)(),className:r,title:i?"Sound off":"Sound on",children:(0,t.jsxs)("span",{className:"icon-swap",children:[(0,t.jsx)("span",{"data-hidden":i?"true":void 0,className:"flex",children:(0,t.jsx)(n.SpeakerOn,{size:16})}),(0,t.jsx)("span",{"data-hidden":i?void 0:"true",className:"flex",children:(0,t.jsx)(n.SpeakerOff,{size:16})})]})})},"Segmented",0,function({label:e,options:a,value:n,onChange:o,showLabel:s=!1,className:u}){let d=a.map(e=>e.value),{refs:h,onKeyDown:f}=x(d,n,o),p=Math.max(0,d.indexOf(n)),m=(0,r.useRef)(null),[v,g]=(0,r.useState)(null),[b,y]=(0,r.useState)(!1),w=(0,r.useCallback)(()=>{let e=h.current[p];e&&g(t=>t&&t.left===e.offsetLeft&&t.width===e.offsetWidth?t:{left:e.offsetLeft,width:e.offsetWidth})},[h,p]);return(0,r.useLayoutEffect)(()=>{w()},[w]),(0,r.useEffect)(()=>{let e=m.current;if(!e)return;let t=new ResizeObserver(()=>w());t.observe(e);let r=requestAnimationFrame(()=>y(!0));return()=>{t.disconnect(),cancelAnimationFrame(r)}},[w]),(0,t.jsxs)("div",{className:(0,i.cn)("flex items-center",u),children:[s?(0,t.jsx)("span",{"aria-hidden":"true",className:c,children:e}):null,(0,t.jsxs)("div",{ref:m,role:"radiogroup","aria-label":e,onKeyDown:f,className:"relative flex items-center",children:[v?(0,t.jsx)("span",{"aria-hidden":"true",className:(0,i.cn)("absolute inset-y-0 start-0 rounded-[12px] bg-well",b&&"transition-[translate,width] duration-300 ease-out motion-reduce:transition-none"),style:{width:v.width,translate:`${v.left}px 0`}}):null,a.map((e,r)=>{let a=r===p;return(0,t.jsxs)("button",{ref:e=>{h.current[r]=e},type:"button",role:"radio","aria-checked":a,"aria-label":e.iconOnly?e.label:void 0,title:e.iconOnly?e.label:void 0,tabIndex:a?0:-1,onClick:()=>o(e.value),className:(0,i.cn)(l,"gap-1.5",e.iconOnly?"w-10":"px-3",a?"text-primary":"text-secondary hover:text-primary",!v&&a&&"bg-well"),children:[e.icon,e.iconOnly?null:(0,t.jsx)("span",{className:"tabular-nums",children:e.label})]},String(e.value))})]})]})},"Slider",0,function({label:e,value:a,min:n=0,max:o=1,step:s=.01,onChange:l,format:u,showValue:h=!0,showLabel:f=!0,width:p=112,className:x}){let g=(0,r.useRef)(null),[b,y]=(0,r.useState)(!1),w=(0,r.useId)(),j=o-n||1,_=Math.min(1,Math.max(0,(a-n)/j)),T=u?u(a):String(Number(a.toFixed(m(s)))),R=e=>{let t=g.current;if(!t)return;let r=t.getBoundingClientRect(),i=v(n+(e-r.left)/r.width*j,n,o,s);i!==a&&l(i)};return(0,t.jsxs)("div",{className:(0,i.cn)("flex h-10 items-center gap-2.5 pe-2.5",!f&&"ps-2.5",x),children:[f?(0,t.jsx)("span",{id:w,className:c,children:e}):null,(0,t.jsxs)("div",{ref:g,role:"slider",tabIndex:0,"aria-label":f?void 0:e,"aria-labelledby":f?w:void 0,"aria-valuenow":a,"aria-valuemin":n,"aria-valuemax":o,"aria-valuetext":u?T:void 0,"aria-orientation":"horizontal",onKeyDown:e=>{let t=Math.max(s,j/10),r={ArrowRight:a+s,ArrowUp:a+s,ArrowLeft:a-s,ArrowDown:a-s,PageUp:a+t,PageDown:a-t,Home:n,End:o}[e.key];if(void 0===r)return;e.preventDefault(),e.stopPropagation();let i=v(r,n,o,s);i!==a&&l(i)},onPointerDown:e=>{0===e.button&&(e.preventDefault(),e.currentTarget.focus({preventScroll:!0}),e.currentTarget.setPointerCapture(e.pointerId),y(!0),R(e.clientX))},onPointerMove:e=>{b&&R(e.clientX)},onPointerUp:()=>y(!1),onPointerCancel:()=>y(!1),onLostPointerCapture:()=>y(!1),className:"group/slider relative flex h-10 shrink-0 cursor-pointer touch-none items-center rounded-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",style:{width:p},children:[(0,t.jsx)("span",{"aria-hidden":"true",className:(0,i.cn)("absolute inset-x-0 h-1 rounded-full",d)}),(0,t.jsx)("span",{"aria-hidden":"true",className:"absolute start-0 h-1 rounded-full bg-ink",style:{width:`${100*_}%`}}),(0,t.jsx)("span",{"aria-hidden":"true",className:(0,i.cn)("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff] shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.18)] transition-[scale] duration-150 ease-out group-hover/slider:scale-110 dark:bg-[#e8e8e8] dark:shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_3px_rgb(0_0_0/0.5)]",b&&"scale-[1.18] group-hover/slider:scale-[1.18]"),style:{left:`${100*_}%`}})]}),h?(0,t.jsx)("span",{"aria-hidden":"true",className:"min-w-[3.5ch] text-end text-[13px] text-primary tabular-nums",children:T}):null]})},"StageControls",0,f,"StageHint",0,function({placement:e,className:r,children:a}){let n=(0,t.jsx)("p",{className:(0,i.cn)("pointer-events-none max-w-full text-center text-[12px] leading-[1.4] text-balance text-tertiary",r),children:a});return e?(0,t.jsx)(f,{placement:e,children:n}):n},"Stepper",0,function({label:e,value:a,min:o,max:s,step:d=1,onChange:h,format:f,showLabel:p=!0,className:x}){let m,g,[b,y]=(0,r.useState)(void 0),w=(0,r.useRef)({value:a,onChange:h});(0,r.useLayoutEffect)(()=>{w.current={value:a,onChange:h}});let j=(m=(0,r.useRef)(0),g=(0,r.useCallback)(()=>{window.clearTimeout(m.current),m.current=0},[]),(0,r.useEffect)(()=>g,[g]),{start:(0,r.useCallback)(e=>{if(g(),!e())return;let t=r=>{m.current=window.setTimeout(()=>{e()&&t(Math.max(50,.82*r))},r)};t(380)},[g]),stop:g}),_=(0,r.useId)(),T=e=>{let t=v(e,o,s,d);return t!==w.current.value&&(y(t>w.current.value?"up":"down"),w.current.value=t,w.current.onChange(t),!0)},R=e=>t=>{0===t.button&&(t.preventDefault(),j.start(()=>T(w.current.value+e)))},M=f?f(a):String(a),k=(0,i.cn)(l,u,"w-8");return(0,t.jsxs)("div",{className:(0,i.cn)("flex items-center",x),children:[p?(0,t.jsx)("span",{id:_,className:c,children:e}):null,(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Decrease ${e.toLowerCase()}`,disabled:a<=o,onPointerDown:R(-d),onPointerUp:j.stop,onPointerLeave:j.stop,onPointerCancel:j.stop,onClick:e=>{0===e.detail&&T(a-d)},className:k,children:(0,t.jsx)(n.Minus,{size:14})}),(0,t.jsx)("span",{role:"spinbutton",tabIndex:0,"aria-label":p?void 0:e,"aria-labelledby":p?_:void 0,"aria-valuenow":a,"aria-valuemin":o,"aria-valuemax":s,"aria-valuetext":f?M:void 0,onKeyDown:e=>{let t={ArrowUp:a+d,ArrowRight:a+d,ArrowDown:a-d,ArrowLeft:a-d,PageUp:a+5*d,PageDown:a-5*d,Home:o,End:s}[e.key];void 0!==t&&(e.preventDefault(),e.stopPropagation(),T(t))},className:"relative flex h-10 min-w-[3ch] cursor-default items-center justify-center overflow-hidden rounded-[10px] px-1.5 text-[15px] text-primary tabular-nums outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:(0,t.jsx)("span",{className:"lab-roll block","data-dir":b,children:M},M)}),(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Increase ${e.toLowerCase()}`,disabled:a>=s,onPointerDown:R(d),onPointerUp:j.stop,onPointerLeave:j.stop,onPointerCancel:j.stop,onClick:e=>{0===e.detail&&T(a+d)},className:k,children:(0,t.jsx)(n.Plus,{size:14})})]})},"Swatches",0,function({label:e,options:r,value:a,onChange:n,className:o}){let s=r.map(e=>e.value),{refs:l,onKeyDown:u}=x(s,a,n),c=Math.max(0,s.indexOf(a));return(0,t.jsx)("div",{role:"radiogroup","aria-label":e,onKeyDown:u,className:(0,i.cn)("flex items-center",o),children:r.map((e,r)=>{let a=r===c;return(0,t.jsx)("button",{ref:e=>{l.current[r]=e},type:"button",role:"radio","aria-checked":a,"aria-label":e.label,title:e.label,tabIndex:a?0:-1,onClick:()=>n(e.value),className:(0,i.cn)("group/swatch relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-[12px] outline-none transition-[box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",a?"shadow-[inset_0_0_0_2px_var(--foreground)]":"hover:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"),children:(0,t.jsx)("span",{"aria-hidden":"true",className:(0,i.cn)("block size-6 rounded-[7px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1),inset_0_1px_0_rgb(255_255_255/0.35)] transition-[scale] duration-200 ease-out dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.2)]",!a&&"group-hover/swatch:scale-[1.06] group-active/swatch:scale-95"),style:{background:e.swatch}})},String(e.value))})})},"TextInput",0,function({label:e,value:r,onChange:a,onSubmit:o,placeholder:s,maxLength:l,submitLabel:u,width:c=200,inputProps:d,className:h}){return(0,t.jsxs)("form",{className:(0,i.cn)("flex min-w-0 items-center gap-1",h),onSubmit:e=>{e.preventDefault(),o?.(r)},children:[(0,t.jsx)("input",{type:"text","aria-label":e,value:r,placeholder:s,maxLength:l,autoComplete:"off",autoCorrect:"off",spellCheck:!1,enterKeyHint:o?"go":void 0,onChange:e=>a(e.target.value),onKeyDown:e=>{e.stopPropagation(),"Escape"===e.key&&e.currentTarget.blur()},className:"h-10 min-w-0 shrink rounded-[12px] bg-transparent px-3 text-[16px] text-primary outline-none placeholder:text-tertiary focus-visible:bg-well/60 sm:text-[14px]",style:{width:c},...d}),o&&u?(0,t.jsxs)("button",{type:"submit",className:"me-1 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] bg-ink px-2.5 text-[12.5px] font-medium text-on-ink outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:[u,(0,t.jsx)(n.Return,{size:12,className:"opacity-70"})]}):null]})},"Toggle",0,function({label:e,checked:r,onChange:a,showLabel:n=!0,className:o}){return(0,t.jsxs)("button",{type:"button",role:"switch","aria-checked":r,"aria-label":n?void 0:e,onClick:()=>a(!r),className:(0,i.cn)(l,"gap-2.5 px-2.5 hover:bg-well",r?"text-primary":"text-secondary hover:text-primary",o),children:[n?(0,t.jsx)("span",{className:"text-[13px]",children:e}):null,(0,t.jsx)("span",{"aria-hidden":"true",className:(0,i.cn)("relative h-[18px] w-[30px] shrink-0 rounded-full transition-[background-color] duration-200 ease-out",r?"bg-ink":d),children:(0,t.jsx)("span",{className:(0,i.cn)("absolute top-[2px] start-[2px] size-[14px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[translate,background-color] duration-300 ease-spring motion-reduce:transition-none",r?"translate-x-3 bg-on-ink":"bg-[#fff] dark:bg-[#a3a3a3]")})})]})},"Tray",0,function({placement:e,label:r,className:a,style:n,children:o}){let l=(0,t.jsxs)("div",{role:r?"group":void 0,"aria-label":r,"data-lab-controls":"",className:(0,i.cn)("pointer-events-auto flex max-w-full items-center gap-0.5 rounded-[16px] bg-float p-1 text-[13px] text-primary shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_-1px_rgb(0_0_0/0.08),0_6px_16px_-6px_rgb(0_0_0/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_1px_2px_-1px_rgb(0_0_0/0.4),0_10px_24px_-8px_rgb(0_0_0/0.6)]","no-scrollbar overflow-x-auto",a),style:n,children:[(0,t.jsx)(s,{}),o]});return e?(0,t.jsx)(f,{placement:e,children:l}):l},"TrayButton",0,function({icon:e,variant:r="quiet",className:a,children:n,...o}){return(0,t.jsxs)("button",{type:"button",className:(0,i.cn)(l,"gap-1.5 px-3 text-[13px] font-medium","quiet"===r?"text-primary hover:bg-well":"bg-ink text-on-ink hover:opacity-90",a),...o,children:[e,n]})},"TrayDivider",0,function(){return(0,t.jsx)("span",{"aria-hidden":"true",className:"mx-1 h-5 w-px shrink-0 bg-border"})},"TrayRow",0,function({className:e,children:r}){return(0,t.jsx)("div",{className:(0,i.cn)("pointer-events-none flex max-w-full flex-wrap items-center justify-center gap-2",e),children:r})}])}]);