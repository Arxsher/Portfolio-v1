(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,55171,e=>{"use strict";let t=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;function r(e,t,r){let a=e.createShader(t);if(!a)throw Error("lab/gl: could not create shader");if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS)&&!e.isContextLost()){let t=e.getShaderInfoLog(a);throw e.deleteShader(a),Error(`lab/gl: shader failed to compile
${t}`)}return a}e.s(["FULLSCREEN_VERTEX",0,t,"createProgram",0,function(e,t,a){let i=r(e,e.VERTEX_SHADER,t),n=r(e,e.FRAGMENT_SHADER,a),o=e.createProgram();if(!o)throw Error("lab/gl: could not create program");if(e.attachShader(o,i),e.attachShader(o,n),e.linkProgram(o),e.deleteShader(i),e.deleteShader(n),!e.getProgramParameter(o,e.LINK_STATUS)&&!e.isContextLost()){let t=e.getProgramInfoLog(o);throw e.deleteProgram(o),Error(`lab/gl: program failed to link
${t}`)}return o},"drawFullscreen",0,function(e,t){void 0!==t&&e.bindVertexArray(t),e.drawArrays(e.TRIANGLES,0,3)},"rgb",0,function(e){let t=e.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let e=3===t[1].length?t[1].replace(/./g,e=>e+e):t[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let r=e.match(/[\d.]+/g)?.map(Number)??[0,0,0];return[(r[0]??0)/255,(r[1]??0)/255,(r[2]??0)/255]},"uniformLocations",0,function(e,t){let r=new Map;return a=>(r.has(a)||r.set(a,e.getUniformLocation(t,a)),r.get(a)??null)}])},34579,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(33209),i=e.i(16442),n=e.i(37047),o=e.i(7537),s=e.i(45219),l=e.i(55171);let u=`#version 300 es
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
`,f=`${c}
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
`,p=`${c}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`,h=`${c}
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
`,m=`${c}
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
`,x=`${c}
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
`;class w{gl;vao;size;fmt;p;velocity=null;dye=null;pressure=null;divergence=null;curl=null;cssW=1;cssH=1;aspect=1;constructor(e,t){if(this.gl=e,this.size=t,!(e.getExtension("EXT_color_buffer_float")??e.getExtension("EXT_color_buffer_half_float")))throw Error("ink: this GPU can't render to half-float targets");this.vao=e.createVertexArray();const r=t=>{let r=(0,l.createProgram)(e,u,t);return{program:r,u:(0,l.uniformLocations)(e,r)}};this.p={advect:r(d),splat:r(f),curl:r(p),vorticity:r(h),divergence:r(m),scale:r(x),pressure:r(v),gradient:r(g),copy:r(b),display:r(y)};const a=this.target(4,4,e.RG16F,e.RG),i=null!==a;if(a&&this.free(a),this.fmt=i?{two:[e.RG16F,e.RG],one:[e.R16F,e.RED]}:{two:[e.RGBA16F,e.RGBA],one:[e.RGBA16F,e.RGBA]},!this.target(4,4,e.RGBA16F,e.RGBA,!0))throw Error("ink: no half-float framebuffer")}resize(e,t){let r=this.gl;if(e<2||t<2)return;this.cssW=e,this.cssH=t,this.aspect=e/t;let a=r=>{let a=r/Math.min(e,t);return[Math.max(8,Math.round(e*a)),Math.max(8,Math.round(t*a))]},[i,n]=a(this.size.sim),[o,s]=a(this.size.dye);if(this.velocity&&this.velocity.read.w===i&&this.velocity.read.h===n&&this.dye?.read.w===o&&this.dye.read.h===s)return;let l=(e,t,[r,a],i)=>{let n=this.target(e,t,r,a),o=this.target(e,t,r,a);if(!n||!o)throw Error("ink: could not allocate targets");return i&&(this.run(this.p.copy,n,{uSource:i.read}),this.free(i.read),this.free(i.write)),{read:n,write:o}};for(let e of(this.velocity=l(i,n,this.fmt.two,this.velocity),this.dye=l(o,s,[r.RGBA16F,r.RGBA],this.dye),this.pressure&&(this.free(this.pressure.read),this.free(this.pressure.write)),this.pressure=l(i,n,this.fmt.one,null),this.divergence&&this.free(this.divergence),this.curl&&this.free(this.curl),this.divergence=this.target(i,n,...this.fmt.one),this.curl=this.target(i,n,...this.fmt.one),[this.pressure.read,this.pressure.write,this.divergence,this.curl]))e&&this.clear(e)}splat(e,t,r,a,i,n,o,s,l){let u=this.velocity,c=this.dye;if(u&&c){if(0!==r||0!==a){let i=u.read.w/this.cssW;this.run(this.p.splat,u.write,{uTarget:u.read,uPoint:[e,t],uAspect:this.aspect,uRadius:l,uColor:[r*i,a*i,0,0],uRadial:0,uCap:0}),_(u)}s>0&&(this.run(this.p.splat,c.write,{uTarget:c.read,uPoint:[e,t],uAspect:this.aspect,uRadius:l,uColor:[i*s,n*s,o*s,s],uRadial:0,uCap:3}),_(c))}}bloom(e,t,r,a){let i=this.velocity;if(!i)return;let n=i.read.w/this.cssW;this.run(this.p.splat,i.write,{uTarget:i.read,uPoint:[e,t],uAspect:this.aspect,uRadius:a,uColor:[r*n,0,0,0],uRadial:1,uCap:0}),_(i)}step(e,t,r){let a=this.velocity,i=this.dye,n=this.pressure,o=this.curl,s=this.divergence;if(!a||!i||!n||!o||!s)return;let l=this.p,u=[1/a.read.w,1/a.read.h];this.run(l.curl,o,{uVelocity:a.read},u),this.run(l.vorticity,a.write,{uVelocity:a.read,uCurl:o,uStrength:16,uDt:e},u),_(a),this.run(l.divergence,s,{uVelocity:a.read},u),this.run(l.scale,n.write,{uSource:n.read,uValue:.8},u),_(n);for(let e=0;e<20;e++)this.run(l.pressure,n.write,{uPressure:n.read,uDivergence:s},u),_(n);this.run(l.gradient,a.write,{uPressure:n.read,uVelocity:a.read},u),_(a),this.run(l.advect,a.write,{uVelocity:a.read,uSource:a.read,uSimTexel:u,uDt:e,uKeep:Math.pow(t,e)}),_(a),this.run(l.advect,i.write,{uVelocity:a.read,uSource:i.read,uSimTexel:u,uDt:e,uKeep:Math.pow(r,e)}),_(i)}render(e,t,r,a,i){let n=this.gl,o=this.dye;if(!o)return;n.bindFramebuffer(n.FRAMEBUFFER,null),n.viewport(0,0,e,t);let{program:s,u:l}=this.p.display;n.useProgram(s),n.uniform2f(l("uTexel"),1/e,1/t),this.bind(l("uDye"),0,o.read),n.uniform2f(l("uDyeTexel"),1/o.read.w,1/o.read.h),n.uniform2f(l("uRes"),e,t),n.uniform1f(l("uNight"),r),n.uniform3f(l("uPaper"),a[0],a[1],a[2]),n.uniform3f(l("uDeep"),i[0],i[1],i[2]),n.bindVertexArray(this.vao),n.drawArrays(n.TRIANGLES,0,3)}clearAll(){for(let e of[this.velocity,this.dye,this.pressure])e&&(this.clear(e.read),this.clear(e.write))}dispose(){let e=this.gl;for(let e of[this.velocity,this.dye,this.pressure])e&&(this.free(e.read),this.free(e.write));for(let{program:t}of(this.divergence&&this.free(this.divergence),this.curl&&this.free(this.curl),Object.values(this.p)))e.deleteProgram(t);e.deleteVertexArray(this.vao),this.velocity=this.dye=this.pressure=null,this.divergence=this.curl=null}target(e,t,r,a,i=!1){let n=this.gl,o=n.createTexture(),s=n.createFramebuffer();if(!o||!s)return null;n.bindTexture(n.TEXTURE_2D,o),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),n.texImage2D(n.TEXTURE_2D,0,r,e,t,0,a,n.HALF_FLOAT,null),n.bindFramebuffer(n.FRAMEBUFFER,s),n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,o,0);let l=n.checkFramebufferStatus(n.FRAMEBUFFER)===n.FRAMEBUFFER_COMPLETE;n.bindFramebuffer(n.FRAMEBUFFER,null);let u={tex:o,fbo:s,w:e,h:t};return!l||i?(this.free(u),l?u:null):(this.clear(u),u)}free(e){this.gl.deleteTexture(e.tex),this.gl.deleteFramebuffer(e.fbo)}clear(e){let t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,e.fbo),t.viewport(0,0,e.w,e.h),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.bindFramebuffer(t.FRAMEBUFFER,null)}bind(e,t,r){let a=this.gl;a.activeTexture(a.TEXTURE0+t),a.bindTexture(a.TEXTURE_2D,r.tex),a.uniform1i(e,t)}run({program:e,u:t},r,a,i){let n=this.gl;n.useProgram(e),n.bindFramebuffer(n.FRAMEBUFFER,r.fbo),n.viewport(0,0,r.w,r.h);let o=i??[1/r.w,1/r.h];n.uniform2f(t("uTexel"),o[0],o[1]);let s=0;for(let e in a){let r=a[e],i=t(e);"number"==typeof r?n.uniform1f(i,r):void 0!==r.fbo?this.bind(i,s++,r):2===r.length?n.uniform2f(i,r[0],r[1]):3===r.length?n.uniform3f(i,r[0],r[1],r[2]):n.uniform4f(i,r[0],r[1],r[2],r[3])}n.bindVertexArray(this.vao),n.drawArrays(n.TRIANGLES,0,3)}}function _(e){let t=e.read;e.read=e.write,e.write=t}class T{nodes=null;start(e){if(this.nodes)return;let{ctx:t,output:r}=e,a=t.createBufferSource();a.buffer=(0,i.noiseBuffer)(t,2),a.loop=!0;let n=t.createBiquadFilter();n.type="bandpass",n.frequency.value=600,n.Q.value=1.1;let o=t.createBiquadFilter();o.type="lowpass",o.frequency.value=2200;let s=t.createGain();s.gain.value=0,a.connect(n).connect(o).connect(s).connect(r),a.start(),this.nodes={src:a,band:n,gain:s}}set(e,t){if(!this.nodes||!e)return;let r=e.ctx.currentTime,a=Math.min(1,Math.max(0,t));this.nodes.gain.gain.setTargetAtTime(a*a*.12,r,a>.02?.05:.18),this.nodes.band.frequency.setTargetAtTime(420+1100*a,r,.08)}stop(){if(this.nodes){try{this.nodes.src.stop()}catch{}this.nodes.src.disconnect(),this.nodes.gain.disconnect(),this.nodes=null}}}let R=[{value:"spectrum",label:"Spectrum",swatch:"conic-gradient(from 200deg,#e0403a,#e9a23b,#3fae6a,#2f7fd0,#8b4fd6,#e0403a)"},{value:"indigo",label:"Indigo",swatch:"linear-gradient(135deg,#16245e,#2f86c8)"},{value:"mono",label:"Mono",swatch:"linear-gradient(135deg,#0d0d0f,#6b6b70)"}],A=[.962,.952,.928],D=[.022,.022,.028];function E(e,t,r){let a=t=>(t+12*e)%12,i=t*Math.min(r,1-r),n=e=>r-i*Math.max(-1,Math.min(a(e)-3,9-a(e),1));return[n(0),n(8),n(4)]}function k(e,t,r){if("spectrum"===e)return r?E(t%1,.9,.58):E(t%1,.78,.42);if("indigo"===e){let e=.5+.5*Math.sin(9*t);return r?[.12+.06*e,.32+.45*e,1]:[.07+.02*e,.12+.22*e,.42+.22*e]}return r?[.86,.87,.92]:[.05,.05,.06]}function C(){return(0,t.jsx)("div",{"aria-hidden":"true",className:"absolute inset-0 bg-[#f5f3ee] dark:bg-[#060607]",style:{backgroundImage:"radial-gradient(40% 30% at 35% 40%, rgb(47 127 208 / 0.55), transparent 70%), radial-gradient(35% 28% at 64% 52%, rgb(224 64 58 / 0.45), transparent 70%), radial-gradient(30% 25% at 46% 68%, rgb(233 162 59 / 0.45), transparent 70%)"}})}e.s(["default",0,function({mode:e,active:l,reducedMotion:u,theme:c}){let d="stage"===e,f=(0,r.useRef)(null),p=(0,r.useRef)(null),h=(0,r.useRef)(new T),m=(0,r.useId)(),x=(0,n.useFinePointer)(),[v,g]=(0,r.useState)("spectrum"),[b,y]=(0,r.useState)(!1),[_,E]=(0,r.useState)(!1),[j,M]=(0,r.useState)(""),[P]=(0,r.useState)(()=>({ink:"spectrum",night:+("dark"===c),theme:c,reduced:u,over:!1,down:!1,id:-1,x:0,y:0,fx:0,fy:0,downAt:0,downX:0,downY:0,moved:!1,hue:Math.random(),drops:[],pushes:[],rinse:0,lastInput:performance.now()/1e3,time:0,acc:0,nextDrop:1.2,stir:0,dealt:!1}));P.ink=v,P.theme=c,P.reduced=u;let S=(0,r.useCallback)(()=>{P.lastInput=performance.now()/1e3,N.current()},[P]),N=(0,r.useRef)(()=>{}),L=(0,r.useCallback)((e,t,r)=>{let a="dark"===P.theme,i=[[.36,.62,1],[.64,.5,.8],[.45,.34,.9]];if(!P.reduced){d&&P.drops.push(...i);return}for(let[t,r,n]of i){let[i,o,s]=k(P.ink,P.hue+=.21,a);e.splat(t,r,0,0,i,o,s,1.6*n,.006*n),e.bloom(t,r,260*n,.006*n)}for(let a=0;a<140;a++){let i=a/60,n=.5+.3*Math.sin(1.7*i),o=.5+.25*Math.sin(2.3*i+1);e.splat(n,o,.3*Math.cos(1.7*i)*1.7*t,.25*Math.cos(2.3*i+1)*2.3*r,0,0,0,0,.003),e.step(1/60,.3,1)}},[P,d]),U=(0,n.useFrame)(l&&!_,e=>{let t=p.current,r=B.current;if(!t||r.width<2)return!1;let a=e;if(!d){if(P.acc+=a,P.acc<1/30-.002)return;a=Math.min(.1,P.acc),P.acc=0}a=Math.min(a,1/30),P.time+=a;let o=performance.now()/1e3,s=o-P.lastInput,l=P.reduced,u="dark"===P.theme,{width:c,height:f}=r,m=d?.0011:.0016,x=Math.sqrt(m)*f,v=(e,r,i,o,s,l)=>{let d=i-e,p=o-r,h=Math.hypot(d,p),v=(0,n.clamp)(Math.ceil(h/(.5*x)),1,16),g=h/v/(1.77*x),b=d/a*s*g,y=-p/a*s*g;for(let a=1;a<=v;a++){let i=a/v,n=0,o=0,s=0;l>0&&(P.hue+=h/v*7e-4,[n,o,s]=k(P.ink,P.hue,u)),t.splat((e+d*i)/c,1-(r+p*i)/f,b,y,n,o,s,l*g,m)}return h};if(P.over||P.down){let e=Math.hypot(P.x-P.fx,P.y-P.fy);if(e>.25)v(P.fx,P.fy,P.x,P.y,P.down?1:.7,.8*!!P.down),h.current.set((0,i.getAudio)(),Math.min(1,e/a/2200));else if(h.current.set((0,i.getAudio)(),0),P.down&&o-P.downAt>.25){let[e,r,i]=k(P.ink,P.hue+=.05*a,u);t.splat(P.x/c,1-P.y/f,0,0,e,r,i,1.4*a,2.2*m)}P.fx=P.x,P.fy=P.y}for(;P.drops.length;){let[e,r,a]=P.drops.shift(),[n,o,s]=k(P.ink,P.hue+=.19,u),l=(d?.0042:.006)*a;t.splat(e,r,0,0,n,o,s,1.7*a,l),t.bloom(e,r,(d?340:160)*a,1.3*l);let c=(0,i.getAudio)();d&&c&&!(0,i.isMuted)()&&function(e,t=.5){let{ctx:r,output:a}=e,n=r.currentTime+.005,o=(e,t,i,n,o)=>{let s=r.createOscillator();s.type="sine",s.frequency.setValueAtTime(t,e),s.frequency.exponentialRampToValueAtTime(i,e+.6*o);let l=r.createGain();l.gain.setValueAtTime(0,e),l.gain.linearRampToValueAtTime(n,e+.004),l.gain.exponentialRampToValueAtTime(1e-4,e+o),s.connect(l).connect(a),s.start(e),s.stop(e+o+.02)},s=1-.45*t;o(n,1500*s,520*s,.22,.11),o(n+.045,2300*s,900*s,.07,.06);let l=r.createBufferSource();l.buffer=(0,i.noiseBuffer)(r,1);let u=r.createBiquadFilter();u.type="highpass",u.frequency.value=2500;let c=r.createGain();c.gain.setValueAtTime(.05+.05*t,n),c.gain.exponentialRampToValueAtTime(1e-4,n+.07),l.connect(u).connect(c).connect(a),l.start(n,.5*Math.random(),.09)}(c,a)}for(;P.pushes.length;){let[e,r]=P.pushes.shift();for(let a=0;a<5;a++){let i=(a+.5)/5,n=0===e?.2+.6*i:.5-.25*e,o=0===r?.2+.6*i:.5-.25*r;t.splat(n,o,900*e,900*r,0,0,0,0,.004)}}if(d){if(!l&&s<26){let e=(0,n.clamp)((26-s)/4),r=P.time;t.splat(.5+.35*Math.sin(.21*r),.5+.3*Math.sin(.17*r+2),40*Math.cos(.31*r)*a*e,40*Math.sin(.27*r)*a*e,0,0,0,0,.02)}}else if(!l){let e=(e,t)=>{t[0]=(.5+.3*Math.sin(.9*e))*c,t[1]=(.5+.27*Math.sin(1.23*e+1.1))*f},t=[0,0],r=[0,0];e(P.time-a,t),e(P.time,r),v(t[0],t[1],r[0],r[1],1.4,.9),P.nextDrop-=a,P.nextDrop<=0&&(P.nextDrop=3.2+2*Math.random(),P.drops.push([.25+.5*Math.random(),.25+.5*Math.random(),.8]))}let g=d?.975:.9,b=.35;P.rinse>0&&(P.rinse-=a,g=.02,b=.6),t.step(a,b,g);let y=+!!u;P.night=l?y:(0,n.damp)(P.night,y,6,a),.003>Math.abs(P.night-y)&&(P.night=y);let w=F.current;w&&t.render(w.width,w.height,P.night,A,D);let _=P.down||P.drops.length>0||P.rinse>0||P.night!==y;if(d){if(!_&&s>(l?3:28))return!1}else if(l&&!_)return!1});N.current=U;let{canvasRef:F,sizeRef:B,supported:V}=(0,n.useWebGL2)({mode:e,maxDpr:d?2:1.25,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!1,depth:!1,stencil:!1},onContext:e=>{let t;try{t=new w(e,d?{sim:128,dye:512}:{sim:56,dye:168})}catch(e){console.error(e),E(!0);return}p.current=t;let{width:r,height:a}=B.current;return t.resize(r,a),P.dealt||(P.dealt=!0,L(t,r,a)),U(),()=>{t.dispose(),p.current=null}},onResize:e=>{p.current?.resize(e.width,e.height),U()}});(0,r.useEffect)(()=>{U()},[c,U]),(0,r.useEffect)(()=>{let e=h.current;return l||e.stop(),()=>e.stop()},[l]);let I=e=>{let t=f.current?.getBoundingClientRect();return t?[e.clientX-t.left,e.clientY-t.top]:[0,0]},z=()=>{b||y(!0);let e=(0,i.ensureAudio)();e&&h.current.start(e)},G=e=>{if(!P.down||e.pointerId!==P.id)return;P.down=!1,P.id=-1;let t=performance.now()/1e3-P.downAt<.3;if(!P.moved&&t&&"pointerup"===e.type){let{width:e,height:t}=B.current;P.drops.push([P.x/e,1-P.y/t,1])}"mouse"!==e.pointerType&&(P.over=!1),h.current.set((0,i.getAudio)(),0),S()},q=()=>{P.rinse=1.1;let e=(0,i.ensureAudio)();e&&!(0,i.isMuted)()&&function(e){let{ctx:t,output:r}=e,a=t.currentTime+.005,n=t.createBufferSource();n.buffer=(0,i.noiseBuffer)(t,2);let o=t.createBiquadFilter();o.type="bandpass",o.Q.value=.8,o.frequency.setValueAtTime(900,a),o.frequency.exponentialRampToValueAtTime(260,a+1.1);let s=t.createGain();s.gain.setValueAtTime(0,a),s.gain.linearRampToValueAtTime(.16,a+.12),s.gain.exponentialRampToValueAtTime(1e-4,a+1.3),n.connect(o).connect(s).connect(r),n.start(a,0,1.4)}(e),M("Rinsed: the water is clear"),S()},O=e=>{g(e),M(`${R.find(t=>t.value===e)?.label} ink`)},X=!1===V||_;return d?(0,t.jsxs)("div",{ref:f,className:"absolute inset-0 select-none [-webkit-tap-highlight-color:transparent]",style:{touchAction:"none"},onPointerDown:e=>{if(!d||e.button>0||e.target.closest("[data-lab-controls]"))return;let[t,r]=I(e);f.current?.setPointerCapture(e.pointerId),P.down=!0,P.id=e.pointerId,P.x=P.fx=P.downX=t,P.y=P.fy=P.downY=r,P.downAt=performance.now()/1e3,P.moved=!1,z(),S()},onPointerMove:e=>{if(!d||P.down&&e.pointerId!==P.id)return;let[t,r]=I(e);if(!P.down){if("mouse"!==e.pointerType)return;P.over||(P.over=!0,P.fx=t,P.fy=r)}P.x=t,P.y=r,Math.hypot(t-P.downX,r-P.downY)>6&&(P.moved=!0),S()},onPointerUp:G,onPointerCancel:G,onPointerLeave:e=>{"mouse"!==e.pointerType||P.down||(P.over=!1,h.current.set((0,i.getAudio)(),0))},children:[X?(0,t.jsx)(C,{}):(0,t.jsx)("canvas",{ref:F,"aria-hidden":"true",className:"absolute inset-0 size-full"}),(0,t.jsx)("div",{tabIndex:X?void 0:0,role:"img","aria-label":"A dish of water with ink swirling in it","aria-describedby":m,onKeyDown:X?void 0:e=>{let t=e.key;" "===t||"Enter"===t?(e.preventDefault(),z(),P.drops.push([.3+.4*Math.random(),.3+.4*Math.random(),.9+.2*Math.random()]),S()):t.startsWith("Arrow")?(e.preventDefault(),P.pushes.push({ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[t]??[0,0]),z(),S()):"r"===t||"R"===t?q():("1"===t||"2"===t||"3"===t)&&O(R[Number(t)-1].value)},className:"absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"}),(0,t.jsx)("p",{id:m,className:"sr-only",children:"Ink in water. Space or Enter drops ink, the arrow keys push a current through the water, R rinses the dish clear, and 1 to 3 change the ink. With a pointer: press and drag to pour and stir, and tap to drop ink."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:j}),(0,t.jsxs)(s.StageControls,{placement:"bottom",children:[(0,t.jsxs)(s.TrayRow,{children:[(0,t.jsx)(s.Tray,{label:"Ink",children:(0,t.jsx)(s.Swatches,{label:"Ink",options:R,value:v,onChange:O})}),X?null:(0,t.jsxs)(s.Tray,{label:"Dish",children:[(0,t.jsx)(s.IconButton,{label:"Rinse the dish",onClick:q,children:(0,t.jsx)(o.Reset,{size:16})}),(0,t.jsx)(s.TrayDivider,{}),(0,t.jsx)(s.MuteButton,{})]})]}),(0,t.jsx)(s.StageHint,{className:(0,a.cn)("transition-opacity duration-700",b&&"opacity-0"),children:X?"A still: this browser can't run the live fluid":x?"Drag to pour and stir · move over the water to push the ink · click for a drop":"Drag to pour and stir · tap for a drop"})]})]}):(0,t.jsx)("div",{ref:f,"aria-hidden":"true",className:"absolute inset-0",children:X?(0,t.jsx)(C,{}):(0,t.jsx)("canvas",{ref:F,className:"absolute inset-0 size-full"})})}],34579)},45603,function(e){e.n(e.i(34579))},45219,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(33209),i=e.i(16442),n=e.i(7537);let o=`
@keyframes lab-roll-up { from { translate: 0 55%; opacity: 0; filter: blur(2px); } }
@keyframes lab-roll-down { from { translate: 0 -55%; opacity: 0; filter: blur(2px); } }
.lab-roll[data-dir="up"] { animation: lab-roll-up 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.lab-roll[data-dir="down"] { animation: lab-roll-down 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .lab-roll[data-dir] { animation: none; }
}
`;function s(){return(0,t.jsx)("style",{href:"lab-ui",precedence:"default",children:o})}let l="relative inline-flex h-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-[12px] outline-none transition-[background-color,color,scale,opacity] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",u="text-secondary hover:bg-well hover:text-primary",c="shrink-0 whitespace-nowrap ps-2.5 pe-1 text-[13px] text-secondary",d="bg-[color-mix(in_oklab,var(--foreground)_14%,transparent)]",f={top:"top-3 inset-x-3 justify-center sm:top-4",bottom:"bottom-3 inset-x-3 justify-center sm:bottom-4","top-left":"top-3 start-3 justify-start sm:top-4 sm:start-4","top-right":"top-3 end-3 justify-end sm:top-4 sm:end-4","bottom-left":"bottom-3 start-3 justify-start sm:bottom-4 sm:start-4","bottom-right":"bottom-3 end-3 justify-end sm:bottom-4 sm:end-4"};function p({placement:e="bottom",label:r,className:i,children:n}){let o=e.startsWith("bottom")?"flex-col-reverse":"flex-col";return(0,t.jsx)("div",{role:r?"group":void 0,"aria-label":r,"data-lab-controls":"",className:(0,a.cn)("pointer-events-none absolute z-10 flex items-center gap-2",o,e.endsWith("left")&&"items-start",e.endsWith("right")&&"items-end",f[e],i),children:n})}function h({label:e,pressed:r,size:i="md",className:n,children:o,...s}){return(0,t.jsx)("button",{type:"button","aria-label":e,title:e,"aria-pressed":r,className:(0,a.cn)(l,u,"md"===i?"size-10":"size-8 rounded-[10px]",r&&"bg-well text-primary",n),...s,children:o})}function m(e,t,a){let i=(0,r.useRef)([]);return{refs:i,onKeyDown:r=>{let n=e.length;if(!n)return;let o=Math.max(0,e.indexOf(t)),s=-1;switch(r.key){case"ArrowRight":case"ArrowDown":s=(o+1)%n;break;case"ArrowLeft":case"ArrowUp":s=(o-1+n)%n;break;case"Home":s=0;break;case"End":s=n-1;break;default:return}r.preventDefault(),r.stopPropagation(),a(e[s]),i.current[s]?.focus()}}}function x(e){let t=String(e),r=t.indexOf(".");return r<0?0:t.length-r-1}function v(e,t,r,a){let i=Math.round((e-t)/a)*a+t;return Number(Math.min(r,Math.max(t,i)).toFixed(x(a)))}e.s(["IconButton",0,h,"MuteButton",0,function({size:e="md",className:r}){let a=(0,i.useMuted)();return(0,t.jsx)(h,{label:"Mute",pressed:a,size:e,onClick:()=>(0,i.toggleMuted)(),className:r,title:a?"Sound off":"Sound on",children:(0,t.jsxs)("span",{className:"icon-swap",children:[(0,t.jsx)("span",{"data-hidden":a?"true":void 0,className:"flex",children:(0,t.jsx)(n.SpeakerOn,{size:16})}),(0,t.jsx)("span",{"data-hidden":a?void 0:"true",className:"flex",children:(0,t.jsx)(n.SpeakerOff,{size:16})})]})})},"Segmented",0,function({label:e,options:i,value:n,onChange:o,showLabel:s=!1,className:u}){let d=i.map(e=>e.value),{refs:f,onKeyDown:p}=m(d,n,o),h=Math.max(0,d.indexOf(n)),x=(0,r.useRef)(null),[v,g]=(0,r.useState)(null),[b,y]=(0,r.useState)(!1),w=(0,r.useCallback)(()=>{let e=f.current[h];e&&g(t=>t&&t.left===e.offsetLeft&&t.width===e.offsetWidth?t:{left:e.offsetLeft,width:e.offsetWidth})},[f,h]);return(0,r.useLayoutEffect)(()=>{w()},[w]),(0,r.useEffect)(()=>{let e=x.current;if(!e)return;let t=new ResizeObserver(()=>w());t.observe(e);let r=requestAnimationFrame(()=>y(!0));return()=>{t.disconnect(),cancelAnimationFrame(r)}},[w]),(0,t.jsxs)("div",{className:(0,a.cn)("flex items-center",u),children:[s?(0,t.jsx)("span",{"aria-hidden":"true",className:c,children:e}):null,(0,t.jsxs)("div",{ref:x,role:"radiogroup","aria-label":e,onKeyDown:p,className:"relative flex items-center",children:[v?(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("absolute inset-y-0 start-0 rounded-[12px] bg-well",b&&"transition-[translate,width] duration-300 ease-out motion-reduce:transition-none"),style:{width:v.width,translate:`${v.left}px 0`}}):null,i.map((e,r)=>{let i=r===h;return(0,t.jsxs)("button",{ref:e=>{f.current[r]=e},type:"button",role:"radio","aria-checked":i,"aria-label":e.iconOnly?e.label:void 0,title:e.iconOnly?e.label:void 0,tabIndex:i?0:-1,onClick:()=>o(e.value),className:(0,a.cn)(l,"gap-1.5",e.iconOnly?"w-10":"px-3",i?"text-primary":"text-secondary hover:text-primary",!v&&i&&"bg-well"),children:[e.icon,e.iconOnly?null:(0,t.jsx)("span",{className:"tabular-nums",children:e.label})]},String(e.value))})]})]})},"Slider",0,function({label:e,value:i,min:n=0,max:o=1,step:s=.01,onChange:l,format:u,showValue:f=!0,showLabel:p=!0,width:h=112,className:m}){let g=(0,r.useRef)(null),[b,y]=(0,r.useState)(!1),w=(0,r.useId)(),_=o-n||1,T=Math.min(1,Math.max(0,(i-n)/_)),R=u?u(i):String(Number(i.toFixed(x(s)))),A=e=>{let t=g.current;if(!t)return;let r=t.getBoundingClientRect(),a=v(n+(e-r.left)/r.width*_,n,o,s);a!==i&&l(a)};return(0,t.jsxs)("div",{className:(0,a.cn)("flex h-10 items-center gap-2.5 pe-2.5",!p&&"ps-2.5",m),children:[p?(0,t.jsx)("span",{id:w,className:c,children:e}):null,(0,t.jsxs)("div",{ref:g,role:"slider",tabIndex:0,"aria-label":p?void 0:e,"aria-labelledby":p?w:void 0,"aria-valuenow":i,"aria-valuemin":n,"aria-valuemax":o,"aria-valuetext":u?R:void 0,"aria-orientation":"horizontal",onKeyDown:e=>{let t=Math.max(s,_/10),r={ArrowRight:i+s,ArrowUp:i+s,ArrowLeft:i-s,ArrowDown:i-s,PageUp:i+t,PageDown:i-t,Home:n,End:o}[e.key];if(void 0===r)return;e.preventDefault(),e.stopPropagation();let a=v(r,n,o,s);a!==i&&l(a)},onPointerDown:e=>{0===e.button&&(e.preventDefault(),e.currentTarget.focus({preventScroll:!0}),e.currentTarget.setPointerCapture(e.pointerId),y(!0),A(e.clientX))},onPointerMove:e=>{b&&A(e.clientX)},onPointerUp:()=>y(!1),onPointerCancel:()=>y(!1),onLostPointerCapture:()=>y(!1),className:"group/slider relative flex h-10 shrink-0 cursor-pointer touch-none items-center rounded-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",style:{width:h},children:[(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("absolute inset-x-0 h-1 rounded-full",d)}),(0,t.jsx)("span",{"aria-hidden":"true",className:"absolute start-0 h-1 rounded-full bg-ink",style:{width:`${100*T}%`}}),(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff] shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.18)] transition-[scale] duration-150 ease-out group-hover/slider:scale-110 dark:bg-[#e8e8e8] dark:shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_3px_rgb(0_0_0/0.5)]",b&&"scale-[1.18] group-hover/slider:scale-[1.18]"),style:{left:`${100*T}%`}})]}),f?(0,t.jsx)("span",{"aria-hidden":"true",className:"min-w-[3.5ch] text-end text-[13px] text-primary tabular-nums",children:R}):null]})},"StageControls",0,p,"StageHint",0,function({placement:e,className:r,children:i}){let n=(0,t.jsx)("p",{className:(0,a.cn)("pointer-events-none max-w-full text-center text-[12px] leading-[1.4] text-balance text-tertiary",r),children:i});return e?(0,t.jsx)(p,{placement:e,children:n}):n},"Stepper",0,function({label:e,value:i,min:o,max:s,step:d=1,onChange:f,format:p,showLabel:h=!0,className:m}){let x,g,[b,y]=(0,r.useState)(void 0),w=(0,r.useRef)({value:i,onChange:f});(0,r.useLayoutEffect)(()=>{w.current={value:i,onChange:f}});let _=(x=(0,r.useRef)(0),g=(0,r.useCallback)(()=>{window.clearTimeout(x.current),x.current=0},[]),(0,r.useEffect)(()=>g,[g]),{start:(0,r.useCallback)(e=>{if(g(),!e())return;let t=r=>{x.current=window.setTimeout(()=>{e()&&t(Math.max(50,.82*r))},r)};t(380)},[g]),stop:g}),T=(0,r.useId)(),R=e=>{let t=v(e,o,s,d);return t!==w.current.value&&(y(t>w.current.value?"up":"down"),w.current.value=t,w.current.onChange(t),!0)},A=e=>t=>{0===t.button&&(t.preventDefault(),_.start(()=>R(w.current.value+e)))},D=p?p(i):String(i),E=(0,a.cn)(l,u,"w-8");return(0,t.jsxs)("div",{className:(0,a.cn)("flex items-center",m),children:[h?(0,t.jsx)("span",{id:T,className:c,children:e}):null,(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Decrease ${e.toLowerCase()}`,disabled:i<=o,onPointerDown:A(-d),onPointerUp:_.stop,onPointerLeave:_.stop,onPointerCancel:_.stop,onClick:e=>{0===e.detail&&R(i-d)},className:E,children:(0,t.jsx)(n.Minus,{size:14})}),(0,t.jsx)("span",{role:"spinbutton",tabIndex:0,"aria-label":h?void 0:e,"aria-labelledby":h?T:void 0,"aria-valuenow":i,"aria-valuemin":o,"aria-valuemax":s,"aria-valuetext":p?D:void 0,onKeyDown:e=>{let t={ArrowUp:i+d,ArrowRight:i+d,ArrowDown:i-d,ArrowLeft:i-d,PageUp:i+5*d,PageDown:i-5*d,Home:o,End:s}[e.key];void 0!==t&&(e.preventDefault(),e.stopPropagation(),R(t))},className:"relative flex h-10 min-w-[3ch] cursor-default items-center justify-center overflow-hidden rounded-[10px] px-1.5 text-[15px] text-primary tabular-nums outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:(0,t.jsx)("span",{className:"lab-roll block","data-dir":b,children:D},D)}),(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Increase ${e.toLowerCase()}`,disabled:i>=s,onPointerDown:A(d),onPointerUp:_.stop,onPointerLeave:_.stop,onPointerCancel:_.stop,onClick:e=>{0===e.detail&&R(i+d)},className:E,children:(0,t.jsx)(n.Plus,{size:14})})]})},"Swatches",0,function({label:e,options:r,value:i,onChange:n,className:o}){let s=r.map(e=>e.value),{refs:l,onKeyDown:u}=m(s,i,n),c=Math.max(0,s.indexOf(i));return(0,t.jsx)("div",{role:"radiogroup","aria-label":e,onKeyDown:u,className:(0,a.cn)("flex items-center",o),children:r.map((e,r)=>{let i=r===c;return(0,t.jsx)("button",{ref:e=>{l.current[r]=e},type:"button",role:"radio","aria-checked":i,"aria-label":e.label,title:e.label,tabIndex:i?0:-1,onClick:()=>n(e.value),className:(0,a.cn)("group/swatch relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-[12px] outline-none transition-[box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",i?"shadow-[inset_0_0_0_2px_var(--foreground)]":"hover:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"),children:(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("block size-6 rounded-[7px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1),inset_0_1px_0_rgb(255_255_255/0.35)] transition-[scale] duration-200 ease-out dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.2)]",!i&&"group-hover/swatch:scale-[1.06] group-active/swatch:scale-95"),style:{background:e.swatch}})},String(e.value))})})},"TextInput",0,function({label:e,value:r,onChange:i,onSubmit:o,placeholder:s,maxLength:l,submitLabel:u,width:c=200,inputProps:d,className:f}){return(0,t.jsxs)("form",{className:(0,a.cn)("flex min-w-0 items-center gap-1",f),onSubmit:e=>{e.preventDefault(),o?.(r)},children:[(0,t.jsx)("input",{type:"text","aria-label":e,value:r,placeholder:s,maxLength:l,autoComplete:"off",autoCorrect:"off",spellCheck:!1,enterKeyHint:o?"go":void 0,onChange:e=>i(e.target.value),onKeyDown:e=>{e.stopPropagation(),"Escape"===e.key&&e.currentTarget.blur()},className:"h-10 min-w-0 shrink rounded-[12px] bg-transparent px-3 text-[16px] text-primary outline-none placeholder:text-tertiary focus-visible:bg-well/60 sm:text-[14px]",style:{width:c},...d}),o&&u?(0,t.jsxs)("button",{type:"submit",className:"me-1 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] bg-ink px-2.5 text-[12.5px] font-medium text-on-ink outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:[u,(0,t.jsx)(n.Return,{size:12,className:"opacity-70"})]}):null]})},"Toggle",0,function({label:e,checked:r,onChange:i,showLabel:n=!0,className:o}){return(0,t.jsxs)("button",{type:"button",role:"switch","aria-checked":r,"aria-label":n?void 0:e,onClick:()=>i(!r),className:(0,a.cn)(l,"gap-2.5 px-2.5 hover:bg-well",r?"text-primary":"text-secondary hover:text-primary",o),children:[n?(0,t.jsx)("span",{className:"text-[13px]",children:e}):null,(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("relative h-[18px] w-[30px] shrink-0 rounded-full transition-[background-color] duration-200 ease-out",r?"bg-ink":d),children:(0,t.jsx)("span",{className:(0,a.cn)("absolute top-[2px] start-[2px] size-[14px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[translate,background-color] duration-300 ease-spring motion-reduce:transition-none",r?"translate-x-3 bg-on-ink":"bg-[#fff] dark:bg-[#a3a3a3]")})})]})},"Tray",0,function({placement:e,label:r,className:i,style:n,children:o}){let l=(0,t.jsxs)("div",{role:r?"group":void 0,"aria-label":r,"data-lab-controls":"",className:(0,a.cn)("pointer-events-auto flex max-w-full items-center gap-0.5 rounded-[16px] bg-float p-1 text-[13px] text-primary shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_-1px_rgb(0_0_0/0.08),0_6px_16px_-6px_rgb(0_0_0/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_1px_2px_-1px_rgb(0_0_0/0.4),0_10px_24px_-8px_rgb(0_0_0/0.6)]","no-scrollbar overflow-x-auto",i),style:n,children:[(0,t.jsx)(s,{}),o]});return e?(0,t.jsx)(p,{placement:e,children:l}):l},"TrayButton",0,function({icon:e,variant:r="quiet",className:i,children:n,...o}){return(0,t.jsxs)("button",{type:"button",className:(0,a.cn)(l,"gap-1.5 px-3 text-[13px] font-medium","quiet"===r?"text-primary hover:bg-well":"bg-ink text-on-ink hover:opacity-90",i),...o,children:[e,n]})},"TrayDivider",0,function(){return(0,t.jsx)("span",{"aria-hidden":"true",className:"mx-1 h-5 w-px shrink-0 bg-border"})},"TrayRow",0,function({className:e,children:r}){return(0,t.jsx)("div",{className:(0,a.cn)("pointer-events-none flex max-w-full flex-wrap items-center justify-center gap-2",e),children:r})}])}]);