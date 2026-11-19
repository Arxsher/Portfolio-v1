(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,55171,e=>{"use strict";let t=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;function r(e,t,r){let a=e.createShader(t);if(!a)throw Error("lab/gl: could not create shader");if(e.shaderSource(a,r),e.compileShader(a),!e.getShaderParameter(a,e.COMPILE_STATUS)&&!e.isContextLost()){let t=e.getShaderInfoLog(a);throw e.deleteShader(a),Error(`lab/gl: shader failed to compile
${t}`)}return a}e.s(["FULLSCREEN_VERTEX",0,t,"createProgram",0,function(e,t,a){let i=r(e,e.VERTEX_SHADER,t),n=r(e,e.FRAGMENT_SHADER,a),o=e.createProgram();if(!o)throw Error("lab/gl: could not create program");if(e.attachShader(o,i),e.attachShader(o,n),e.linkProgram(o),e.deleteShader(i),e.deleteShader(n),!e.getProgramParameter(o,e.LINK_STATUS)&&!e.isContextLost()){let t=e.getProgramInfoLog(o);throw e.deleteProgram(o),Error(`lab/gl: program failed to link
${t}`)}return o},"drawFullscreen",0,function(e,t){void 0!==t&&e.bindVertexArray(t),e.drawArrays(e.TRIANGLES,0,3)},"rgb",0,function(e){let t=e.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let e=3===t[1].length?t[1].replace(/./g,e=>e+e):t[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let r=e.match(/[\d.]+/g)?.map(Number)??[0,0,0];return[(r[0]??0)/255,(r[1]??0)/255,(r[2]??0)/255]},"uniformLocations",0,function(e,t){let r=new Map;return a=>(r.has(a)||r.set(a,e.getUniformLocation(t,a)),r.get(a)??null)}])},75048,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(33209),i=e.i(16442),n=e.i(37047),o=e.i(45219),l=e.i(55171);let s=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uNight;
uniform vec2 uRes;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  // light from the windows up and to the left
  vec2 c = vUv - vec2(0.3, 0.85);
  float glow = exp(-dot(c, c) * 2.2);
  vec3 day = mix(vec3(0.84, 0.865, 0.89), vec3(0.95, 0.955, 0.965), smoothstep(0.0, 1.0, vUv.y)) + glow * 0.04;
  vec3 night = mix(vec3(0.01, 0.01, 0.014), vec3(0.03, 0.032, 0.04), smoothstep(0.0, 1.0, vUv.y)) + glow * vec3(0.03, 0.035, 0.05);
  vec3 col = mix(day, night, uNight);
  col += (hash(vUv * uRes) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`,u=`#version 300 es
in vec2 aCorner;
in vec4 iA;
in vec4 iB;
in vec4 iC;
uniform vec2 uView;
out vec2 vQ;
flat out vec4 vA;
flat out vec4 vB;
flat out vec4 vC;
void main() {
  // room for the wobble
  float m = 1.0 + abs(iB.x) + abs(iB.y) + 0.06;
  vQ = aCorner * m;
  vec2 px = iA.xy + vec2(aCorner.x, -aCorner.y) * iA.z * m;
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
  vA = iA;
  vB = iB;
  vC = iC;
}
`,c=`#version 300 es
precision highp float;
in vec2 vQ;
flat in vec4 vA;
flat in vec4 vB;
flat in vec4 vC;
out vec4 outColor;
uniform float uTime;
uniform float uNight;

const float PI = 3.14159265;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1, 0, 0)), u.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), u.x), u.y),
    mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), u.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), u.x), u.y),
    u.z);
}

/** One window of the studio as seen along r: a bright pane with a cross of mullions. */
float pane(vec3 r, vec3 dir, vec2 size) {
  float facing = dot(r, dir);
  if (facing <= 0.05) return 0.0;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), dir));
  vec3 up = cross(dir, right);
  vec2 uv = vec2(dot(r, right), dot(r, up)) / facing;
  vec2 d = abs(uv) - size;
  float box = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  float bars = min(abs(uv.x), abs(uv.y));
  return smoothstep(0.025, 0.0, box) * smoothstep(0.006, 0.016, bars) + exp(-max(box, 0.0) * 12.0) * 0.12;
}

/** What the film reflects: a soft ceiling, a darker floor, two windows. */
vec3 studio(vec3 r) {
  vec3 ceiling = mix(vec3(0.93, 0.95, 0.99), vec3(0.16, 0.18, 0.24), uNight);
  vec3 floorC = mix(vec3(0.36, 0.37, 0.4), vec3(0.02, 0.02, 0.03), uNight);
  vec3 col = mix(floorC, ceiling, smoothstep(-0.4, 0.5, r.y));
  col += pane(r, normalize(vec3(-0.5, 0.55, 0.67)), vec2(0.24, 0.32)) * mix(2.4, 3.6, uNight);
  col += pane(r, normalize(vec3(0.66, 0.2, 0.72)), vec2(0.11, 0.17)) * mix(1.2, 2.0, uNight) * vec3(1.0, 0.92, 0.8);
  return col;
}

/** 1 - cos of the phase difference, averaged over three wavelengths (nm). */
float film(float path, vec3 lambda) {
  vec3 c = cos(2.0 * PI * path / lambda);
  return 1.0 - (c.x + c.y + c.z) / 3.0;
}

void main() {
  float R = vA.z;
  float rad = length(vQ);
  float th = atan(vQ.y, vQ.x);
  float shape = 1.0 + vB.x * cos(2.0 * th - vB.z) + vB.y * cos(3.0 * th - vB.w);
  float s = rad / shape;
  float aa = 1.4 / max(R * shape, 1.0);
  if (s > 1.0 + aa) discard;
  vec2 q = vQ / shape;
  float q2 = min(dot(q, q), 0.9995);
  vec3 n = vec3(q, sqrt(1.0 - q2));

  // a burst: a hole racing round the film from where it broke, a thick rim at its edge
  float rim = 0.0;
  if (vC.z >= 0.0) {
    vec3 p0 = normalize(vec3(cos(vC.w) * 0.55, sin(vC.w) * 0.55, 0.83));
    float ang = acos(clamp(dot(n, p0), -1.0, 1.0));
    float hole = vC.z * 3.4;
    if (ang < hole) discard;
    rim = 1.0 - smoothstep(0.0, 0.18, ang - hole);
  }

  // the film: draining to the bottom, swirling, thinning with age (nm)
  float drain = 0.5 - 0.5 * n.y;
  vec3 flow = vec3(vA.w * 17.0, uTime * 0.09, vA.w * 5.0);
  float swirl = noise(n * 2.3 + flow) * 0.6 + noise(n * 5.1 - flow * 1.7) * 0.4;
  float thick = 0.2 + 0.55 * drain + 0.5 * (swirl - 0.5) - vC.x * 0.45 * (1.0 - drain);
  float d = 90.0 + 760.0 * clamp(thick, 0.0, 1.0);
  d = mix(d, 1100.0, rim);

  // interference: the extra path through the film at this angle
  float cosV = n.z;
  float cosT = sqrt(1.0 - (1.0 - cosV * cosV) / 1.769);
  float path = 2.0 * 1.33 * d * cosT;
  vec3 tint = vec3(film(path, vec3(610.0, 650.0, 690.0)), film(path, vec3(510.0, 540.0, 570.0)), film(path, vec3(430.0, 460.0, 490.0)));

  float F = 0.04 + 0.96 * pow(1.0 - cosV, 5.0);
  vec3 r = vec3(2.0 * n.z * n.x, 2.0 * n.z * n.y, 2.0 * n.z * n.z - 1.0);
  vec3 light = studio(r) * F * tint;
  float alpha = F * (tint.r + tint.g + tint.b) / 3.0;
  // on paper the very edge reads as a fine darker line
  alpha += smoothstep(0.9, 1.0, s) * 0.12 * (1.0 - uNight);
  light += rim * vec3(0.5) * mix(0.6, 1.0, uNight);
  alpha = clamp(alpha + rim * 0.35, 0.0, 1.0);

  float edge = smoothstep(1.0 + aa, 1.0 - aa, s);
  outColor = vec4(light, alpha) * edge;
}
`,d=`#version 300 es
in vec2 aCorner;
in vec4 iD;
uniform vec2 uView;
out vec2 vQ;
flat out float vAlpha;
void main() {
  vQ = aCorner;
  vec2 px = iD.xy + aCorner * (iD.z + 1.0);
  gl_Position = vec4(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0, 0.0, 1.0);
  vAlpha = iD.w;
}
`,h=`#version 300 es
precision highp float;
in vec2 vQ;
flat in float vAlpha;
out vec4 outColor;
uniform float uNight;
void main() {
  float d = length(vQ);
  float a = smoothstep(1.0, 0.45, d) * vAlpha;
  vec3 c = mix(vec3(0.42, 0.45, 0.5), vec3(0.92, 0.95, 1.0), uNight);
  outColor = vec4(c * a, a);
}
`;class p{bubbles=[];drops=[];w=1;h=1;air={x:0,y:0,vx:0,vy:0,on:0};breeze={x:0,y:0};popped=[];time=0;nextSeed=1;resize(e,t){let r=this.w>1?e/this.w:1,a=this.h>1?t/this.h:1;for(let e of this.bubbles)e.x*=r,e.y*=a;this.w=e,this.h=t}maxRadius(){return Math.max(26,.17*Math.min(this.w,this.h))}spawn(e,t,r,a=0,i=0,n=!1){if(this.bubbles.length>=28){let e=this.bubbles.find(e=>!e.held&&e.pop<0);e&&this.burst(e)}let o={x:e,y:t,vx:a,vy:i,r,held:n,a2:.06,a3:.03,v2:0,v3:0,p2:6.28*Math.random(),p3:6.28*Math.random(),seed:.6180339*this.nextSeed++%1,age:0,life:14+16*Math.random(),pop:-1,popAngle:0};return this.bubbles.push(o),o}at(e,t){for(let r=this.bubbles.length-1;r>=0;r--){let a=this.bubbles[r];if(!(a.pop>=0)&&Math.hypot(e-a.x,t-a.y)<1.05*a.r)return a}return null}burst(e,t,r){e.pop>=0||(e.pop=0,e.held=!1,e.popAngle=void 0!==t&&void 0!==r?Math.atan2(e.y-r,t-e.x):Math.random()*Math.PI*2,this.popped.push(e.r))}kick(e,t){e.v2+=t*(.7+.6*Math.sin(40*e.seed+this.time)),e.v3+=.6*t*(.7+.6*Math.cos(31*e.seed+this.time))}step(e,t){this.time+=e;let{w:r,h:a,air:i,breeze:n}=this,o=this.bubbles;for(let l of o){if(l.pop>=0){l.pop+=e/.16;continue}l.age+=e,!l.held&&l.age>l.life&&this.burst(l);let o=Math.min(40,15*Math.pow(40/Math.max(8,l.r),1.3));for(let[t,r]of[["a2","v2"],["a3","v3"]]){let a="a2"===t?o:1.6*o;l[r]+=(-a*a*l[t]-.28*a*l[r])*e,l[t]+=l[r]*e,l[t]=Math.max(-.18,Math.min(.18,l[t]))}if(l.p2+=.35*e,l.p3-=.5*e,l.held||t)continue;let s=90*Math.exp(-l.age/1.6);if(l.vy+=(16-s)*e,l.vx+=6*Math.sin(.4*this.time+9*l.seed)*e,i.on>0){let t=l.x-i.x,r=l.y-i.y,a=70+1.5*l.r,n=Math.exp(-(t*t+r*r)/(a*a))*i.on;n>.002&&(l.vx+=(i.vx-l.vx)*n*Math.min(1,6*e),l.vy+=(i.vy-l.vy)*n*Math.min(1,6*e),this.kick(l,n*Math.hypot(i.vx,i.vy)*6e-4))}l.vx+=n.x*e*1.5,l.vy+=n.y*e*1.5;let u=Math.exp(-e*(.55+6/l.r));l.vx*=u,l.vy*=u,l.x+=l.vx*e,l.y+=l.vy*e,l.x<l.r?(l.x=l.r,l.vx<0&&(this.kick(l,-(.004*l.vx)),l.vx=-(.45*l.vx))):l.x>r-l.r&&(l.x=r-l.r,l.vx>0&&(this.kick(l,.004*l.vx),l.vx=-(.45*l.vx))),l.y<l.r?(l.y=l.r,l.vy<0&&(this.kick(l,-(.004*l.vy)),l.vy=-(.45*l.vy))):l.y>a-.92*l.r&&this.burst(l,l.x,a)}if(!t)for(let e=0;e<o.length;e++){let t=o[e];if(!(t.pop>=0))for(let r=e+1;r<o.length;r++){let e=o[r];if(e.pop>=0)continue;let a=e.x-t.x,i=e.y-t.y,n=(t.r+e.r)*.98,l=a*a+i*i;if(l>=n*n||l<1e-6)continue;let s=Math.sqrt(l),u=a/s,c=i/s,d=n-s,h=t.held?0:1/t.r,p=e.held?0:1/e.r,f=h+p||1;t.x-=u*d*(h/f),t.y-=c*d*(h/f),e.x+=u*d*(p/f),e.y+=c*d*(p/f);let b=(e.vx-t.vx)*u+(e.vy-t.vy)*c;if(b<0){let r=-1.35*b/f;t.vx-=r*h*u,t.vy-=r*h*c,e.vx+=r*p*u,e.vy+=r*p*c,this.kick(t,-(.003*b)),this.kick(e,-(.003*b))}}}for(let e=o.length-1;e>=0;e--){let r=o[e];if(r.pop<1||(o.splice(e,1),t))continue;let a=Math.round(8+.25*r.r);for(let e=0;e<a&&this.drops.length<220;e++){let e=r.popAngle+Math.PI+(Math.random()-.5)*4.2,t=90+220*Math.random()+1.5*r.r;this.drops.push({x:r.x+Math.cos(e)*r.r*.85,y:r.y-Math.sin(e)*r.r*.85,vx:Math.cos(e)*t+r.vx,vy:-Math.sin(e)*t+r.vy-40,age:0,life:.3+.35*Math.random(),size:1+1.4*Math.random()})}}for(let t=this.drops.length-1;t>=0;t--){let r=this.drops[t];if(r.age+=e,r.age>r.life){this.drops.splice(t,1);continue}r.vy+=700*e,r.vx*=Math.exp(-(1.5*e)),r.x+=r.vx*e,r.y+=r.vy*e}let l=Math.exp(-(1.5*e));n.x*=l,n.y*=l,i.on*=Math.exp(-(5*e))}busy(){return this.bubbles.length>0||this.drops.length>0}}class f{gl;back;bubble;drop;ub;uu;ud;empty;bubbleVao;dropVao;quad;bubbleBuf;dropBuf;bubbleData=new Float32Array(336);dropData=new Float32Array(1024);constructor(e){this.gl=e,this.back=(0,l.createProgram)(e,l.FULLSCREEN_VERTEX,s),this.bubble=(0,l.createProgram)(e,u,c),this.drop=(0,l.createProgram)(e,d,h),this.ub=(0,l.uniformLocations)(e,this.back),this.uu=(0,l.uniformLocations)(e,this.bubble),this.ud=(0,l.uniformLocations)(e,this.drop),this.empty=e.createVertexArray(),this.quad=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),e.STATIC_DRAW),this.bubbleVao=e.createVertexArray(),e.bindVertexArray(this.bubbleVao),this.corner(this.bubble),this.bubbleBuf=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.bubbleBuf),e.bufferData(e.ARRAY_BUFFER,this.bubbleData.byteLength,e.DYNAMIC_DRAW),["iA","iB","iC"].forEach((t,r)=>{let a=e.getAttribLocation(this.bubble,t);a<0||(e.enableVertexAttribArray(a),e.vertexAttribPointer(a,4,e.FLOAT,!1,48,16*r),e.vertexAttribDivisor(a,1))}),this.dropVao=e.createVertexArray(),e.bindVertexArray(this.dropVao),this.corner(this.drop),this.dropBuf=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.dropBuf),e.bufferData(e.ARRAY_BUFFER,this.dropData.byteLength,e.DYNAMIC_DRAW);const t=e.getAttribLocation(this.drop,"iD");t>=0&&(e.enableVertexAttribArray(t),e.vertexAttribPointer(t,4,e.FLOAT,!1,16,0),e.vertexAttribDivisor(t,1)),e.bindVertexArray(null)}corner(e){let t=this.gl,r=t.getAttribLocation(e,"aCorner");t.bindBuffer(t.ARRAY_BUFFER,this.quad),t.enableVertexAttribArray(r),t.vertexAttribPointer(r,2,t.FLOAT,!1,0,0)}draw(e,t,r){let a=this.gl,i=a.drawingBufferWidth,n=a.drawingBufferHeight;a.bindFramebuffer(a.FRAMEBUFFER,null),a.viewport(0,0,i,n),a.disable(a.BLEND),a.useProgram(this.back),a.uniform1f(this.ub("uNight"),t),a.uniform2f(this.ub("uRes"),i,n),a.bindVertexArray(this.empty),a.drawArrays(a.TRIANGLES,0,3),a.enable(a.BLEND),a.blendFunc(a.ONE,a.ONE_MINUS_SRC_ALPHA);let o=e.bubbles,l=Math.min(o.length,28),s=this.bubbleData,u=o.slice(0,l).sort((e,t)=>t.r-e.r);for(let e=0;e<l;e++){let t=u[e],r=12*e;s[r]=t.x,s[r+1]=t.y,s[r+2]=t.r,s[r+3]=t.seed,s[r+4]=t.a2,s[r+5]=t.a3,s[r+6]=t.p2,s[r+7]=t.p3,s[r+8]=Math.min(1,t.age/t.life),s[r+9]=0,s[r+10]=t.pop,s[r+11]=t.popAngle}l>0&&(a.useProgram(this.bubble),a.uniform2f(this.uu("uView"),e.w,e.h),a.uniform1f(this.uu("uTime"),r),a.uniform1f(this.uu("uNight"),t),a.bindVertexArray(this.bubbleVao),a.bindBuffer(a.ARRAY_BUFFER,this.bubbleBuf),a.bufferSubData(a.ARRAY_BUFFER,0,s,0,12*l),a.drawArraysInstanced(a.TRIANGLE_STRIP,0,4,l));let c=e.drops,d=Math.min(c.length,256);if(d>0){let r=this.dropData;for(let e=0;e<d;e++){let t=c[e];r[4*e]=t.x,r[4*e+1]=t.y,r[4*e+2]=t.size,r[4*e+3]=1-t.age/t.life}a.useProgram(this.drop),a.uniform2f(this.ud("uView"),e.w,e.h),a.uniform1f(this.ud("uNight"),t),a.bindVertexArray(this.dropVao),a.bindBuffer(a.ARRAY_BUFFER,this.dropBuf),a.bufferSubData(a.ARRAY_BUFFER,0,r,0,4*d),a.drawArraysInstanced(a.TRIANGLE_STRIP,0,4,d)}a.bindVertexArray(null),a.disable(a.BLEND)}dispose(){let e=this.gl;e.deleteProgram(this.back),e.deleteProgram(this.bubble),e.deleteProgram(this.drop),e.deleteVertexArray(this.empty),e.deleteVertexArray(this.bubbleVao),e.deleteVertexArray(this.dropVao),e.deleteBuffer(this.quad),e.deleteBuffer(this.bubbleBuf),e.deleteBuffer(this.dropBuf)}}class b{nodes=null;start(e){if(this.nodes)return;let{ctx:t,output:r}=e,a=t.createBufferSource();a.buffer=(0,i.noiseBuffer)(t,2),a.loop=!0;let n=t.createBiquadFilter();n.type="bandpass",n.frequency.value=900,n.Q.value=.6;let o=t.createGain();o.gain.value=0,a.connect(n).connect(o).connect(r),a.start(),this.nodes={src:a,band:n,gain:o}}set(e,t){if(!this.nodes||!e)return;let r=e.ctx.currentTime,a=Math.min(1,Math.max(0,t));this.nodes.gain.gain.setTargetAtTime(.05*a,r,a>0?.08:.15),this.nodes.band.frequency.setTargetAtTime(700+700*a,r,.1)}stop(){if(this.nodes){try{this.nodes.src.stop()}catch{}this.nodes.gain.disconnect(),this.nodes=null}}}function x(){return(0,t.jsx)("div",{"aria-hidden":"true",className:"absolute inset-0 bg-[#e6eaee] dark:bg-[#050506]",children:[{x:34,y:38,s:30},{x:66,y:30,s:20},{x:56,y:62,s:24}].map((e,r)=>(0,t.jsx)("div",{className:"absolute -translate-x-1/2 -translate-y-1/2 rounded-full",style:{left:`${e.x}%`,top:`${e.y}%`,width:`${e.s}%`,aspectRatio:"1",background:"radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.7) 0 6%, transparent 14%), radial-gradient(circle, transparent 58%, rgb(140 120 255 / 0.25) 70%, rgb(80 220 200 / 0.3) 80%, rgb(255 170 80 / 0.35) 92%, transparent 100%)"}},r))})}e.s(["default",0,function({mode:e,active:l,reducedMotion:s,theme:u}){let c="stage"===e,d=(0,r.useRef)(null),h=(0,r.useRef)(null),m=(0,r.useRef)(new b),v=(0,r.useId)(),g=(0,n.useFinePointer)(),[y,w]=(0,r.useState)(!1),[A,_]=(0,r.useState)(!1),[M,R]=(0,r.useState)(""),[k]=(0,r.useState)(()=>({froth:new p,night:+("dark"===u),theme:u,reduced:s,time:0,acc:0,wand:null,down:!1,id:-1,x:0,y:0,vx:0,vy:0,lastT:0,downAt:0,downX:0,downY:0,moved:!1,nextBlow:.4,seeded:!1}));k.theme=u,k.reduced=s;let N=(0,r.useRef)(()=>{}),j=(0,r.useCallback)(()=>N.current(),[]),B=(0,r.useCallback)(()=>{let e=k.froth;if(k.seeded||e.w<2||(k.seeded=!0,!c))return;let t=e.maxRadius();for(let[r,a,i]of[[.32,.36,.85],[.66,.3,.55],[.56,.62,.7],[.26,.68,.38]]){let n=e.spawn(r*e.w,a*e.h,t*i,(Math.random()-.5)*20,(Math.random()-.5)*10);n.age=3+4*Math.random(),n.life=30+20*Math.random()}},[k,c]),C=(e,t)=>{let r=k.wand;r&&(r.held=!1,r.vx=e,r.vy=t,r.age=0,r.v2+=.6,k.wand=null)},T=()=>{k.wand=k.froth.spawn(k.x,k.y,6,0,0,!0)},P=(0,n.useFrame)(l&&!A,e=>{let t=h.current,r=k.froth;if(!t||r.w<2)return!1;let a=e;if(!c){if(k.acc+=a,k.acc<1/30-.002)return;a=Math.min(.1,k.acc),k.acc=0}a=Math.min(a,1/30),k.time+=a;let o=k.reduced,l=k.wand;if(l){l.x=k.x,l.y=k.y;let e=Math.hypot(k.vx,k.vy),t=38+Math.min(120,.05*e);l.r+=t*a,m.current.set((0,i.getAudio)(),.5+Math.min(.5,e/1500)),l.r>=r.maxRadius()&&(C(.4*k.vx,Math.min(-25,.4*k.vy)),k.down&&T())}else m.current.set((0,i.getAudio)(),0);if(!c&&!o&&(k.nextBlow-=a,k.nextBlow<=0)){k.nextBlow=.9+1.1*Math.random();let e=r.maxRadius();r.spawn(.12*r.w,.86*r.h,e*(.35+.55*Math.random()),40+50*Math.random(),-20-30*Math.random()).life=6+5*Math.random()}if(r.step(a,o),r.popped.length){let e=(0,i.getAudio)();if(c&&e&&!(0,i.isMuted)())for(let t of r.popped.slice(0,4))!function(e,t){let{ctx:r,output:a}=e,n=r.currentTime+.003,o=Math.min(1,Math.max(0,(t-8)/80)),l=r.createBufferSource();l.buffer=(0,i.noiseBuffer)(r,1);let s=r.createBiquadFilter();s.type="bandpass",s.frequency.value=3800-1800*o,s.Q.value=.9;let u=r.createGain();u.gain.setValueAtTime(1e-4,n),u.gain.exponentialRampToValueAtTime(.18,n+.002),u.gain.exponentialRampToValueAtTime(1e-4,n+.04+.03*o),l.connect(s).connect(u).connect(a),l.start(n,.8*Math.random(),.09);let c=r.createOscillator();c.type="sine";let d=1900-1e3*o;c.frequency.setValueAtTime(d,n),c.frequency.exponentialRampToValueAtTime(.55*d,n+.05);let h=r.createGain();h.gain.setValueAtTime(1e-4,n),h.gain.exponentialRampToValueAtTime(.06,n+.003),h.gain.exponentialRampToValueAtTime(1e-4,n+.06),c.connect(h).connect(a),c.start(n),c.stop(n+.08)}(e,t);r.popped.length=0}let s=+("dark"===k.theme);k.night=o?s:(0,n.damp)(k.night,s,5,a),.003>Math.abs(k.night-s)&&(k.night=s),t.draw(r,k.night,o?0:k.time);let u=null!==k.wand||r.bubbles.some(e=>e.pop>=0)||r.drops.length>0||k.night!==s;if(c&&!u&&(o||0===r.bubbles.length)||!c&&o)return!1});N.current=P;let{canvasRef:S,supported:D}=(0,n.useWebGL2)({mode:e,maxDpr:c?2:1.5,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!0,depth:!1,stencil:!1},onContext:e=>{let t;try{t=new f(e)}catch(e){console.error(e),_(!0);return}return h.current=t,P(),()=>{t.dispose(),h.current=null}},onResize:e=>{k.froth.resize(e.width,e.height),B(),P()}});(0,r.useEffect)(()=>{P()},[u,s,P]),(0,r.useEffect)(()=>{let e=m.current;return l||e.stop(),()=>e.stop()},[l]);let E=e=>{let t=d.current?.getBoundingClientRect();return t?[e.clientX-t.left,e.clientY-t.top]:[0,0]},V=()=>{y||w(!0);let e=(0,i.ensureAudio)();e&&m.current.start(e)},z=(e,t,r)=>{let a=Math.max(.001,(r-k.lastT)/1e3);if(k.lastT>0&&a<.2){let r=1-Math.exp(-a/.05);k.vx+=((e-k.x)/a-k.vx)*r,k.vy+=((t-k.y)/a-k.vy)*r}else k.vx=k.vy=0;k.lastT=r,k.x=e,k.y=t;let i=k.froth.air;i.x=e,i.y=t,i.vx=k.vx,i.vy=k.vy,i.on=Math.min(1,Math.hypot(k.vx,k.vy)/300)},F=e=>{if(!k.down||e.pointerId!==k.id)return;k.down=!1,k.id=-1;let t=performance.now()/1e3-k.downAt<.25,r=k.wand;if(r&&!k.moved&&t&&"pointerup"===e.type){k.froth.bubbles.splice(k.froth.bubbles.indexOf(r),1),k.wand=null;let e=k.froth.maxRadius();for(let t=0;t<3;t++)k.froth.spawn(k.x+(t-1)*14,k.y-6*t,e*(.18+.2*Math.random()),(t-1)*50,-60-60*Math.random())}else C(.55*k.vx,.55*k.vy);j()},L=!1===D||A;return c?(0,t.jsxs)("div",{ref:d,className:"absolute inset-0 select-none [-webkit-tap-highlight-color:transparent]",style:{touchAction:"none"},onPointerDown:e=>{if(!c||e.button>0||e.target.closest("[data-lab-controls]"))return;let[t,r]=E(e);V(),k.lastT=0,z(t,r,e.timeStamp);let a=k.froth.at(t,r);if(a){k.froth.burst(a,t,r),j();return}d.current?.setPointerCapture(e.pointerId),k.down=!0,k.id=e.pointerId,k.downAt=performance.now()/1e3,k.downX=t,k.downY=r,k.moved=!1,T(),j()},onPointerMove:e=>{if(!c||k.down&&e.pointerId!==k.id||!k.down&&"mouse"!==e.pointerType)return;let[t,r]=E(e);z(t,r,e.timeStamp),Math.hypot(t-k.downX,r-k.downY)>6&&(k.moved=!0);let a=k.wand;a&&a.r>11&&Math.hypot(k.vx,k.vy)>750&&(C(.5*k.vx,.5*k.vy),T()),j()},onPointerUp:F,onPointerCancel:F,children:[L?(0,t.jsx)(x,{}):(0,t.jsx)("canvas",{ref:S,"aria-hidden":"true",className:"absolute inset-0 size-full"}),(0,t.jsx)("div",{tabIndex:L?void 0:0,role:"img","aria-label":"Soap bubbles floating in a bright room","aria-describedby":v,onKeyDown:L?void 0:e=>{let t=k.froth,r=e.key;if(" "===r||"Enter"===r){e.preventDefault(),V();let r=t.maxRadius();t.spawn(t.w*(.3+.4*Math.random()),t.h-1.2*r,r*(.4+.5*Math.random()),(Math.random()-.5)*60,-90),R(`${t.bubbles.length} ${1===t.bubbles.length?"bubble":"bubbles"}`),j()}else if("p"===r||"P"===r){let e=[...t.bubbles].reverse().find(e=>e.pop<0&&!e.held);e&&(V(),t.burst(e),R("Pop"),j())}else if(r.startsWith("Arrow")){e.preventDefault();let[a,i]={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[r]??[0,0];t.breeze.x+=120*a,t.breeze.y+=120*i,j()}},className:"absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"}),(0,t.jsx)("p",{id:v,className:"sr-only",children:"Soap bubbles. Space or Enter blows a bubble, P pops one, and the arrow keys blow a breeze. With a pointer: press and hold on empty air to blow a bubble and let go to set it free, and tap a bubble to pop it."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:M}),(0,t.jsxs)(o.StageControls,{placement:"bottom",children:[L?null:(0,t.jsx)(o.TrayRow,{children:(0,t.jsx)(o.Tray,{label:"Sound",children:(0,t.jsx)(o.MuteButton,{})})}),(0,t.jsx)(o.StageHint,{className:(0,a.cn)("transition-opacity duration-700",y&&"opacity-0"),children:L?"A still: this browser can't run the live bubbles":g?"Hold to blow a bubble · drag to let it go · click one to pop it":"Hold to blow · drag to let go · tap to pop"})]})]}):(0,t.jsx)("div",{ref:d,"aria-hidden":"true",className:"absolute inset-0",children:L?(0,t.jsx)(x,{}):(0,t.jsx)("canvas",{ref:S,className:"absolute inset-0 size-full"})})}],75048)},18166,function(e){e.n(e.i(75048))},45219,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(33209),i=e.i(16442),n=e.i(7537);let o=`
@keyframes lab-roll-up { from { translate: 0 55%; opacity: 0; filter: blur(2px); } }
@keyframes lab-roll-down { from { translate: 0 -55%; opacity: 0; filter: blur(2px); } }
.lab-roll[data-dir="up"] { animation: lab-roll-up 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.lab-roll[data-dir="down"] { animation: lab-roll-down 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .lab-roll[data-dir] { animation: none; }
}
`;function l(){return(0,t.jsx)("style",{href:"lab-ui",precedence:"default",children:o})}let s="relative inline-flex h-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-[12px] outline-none transition-[background-color,color,scale,opacity] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",u="text-secondary hover:bg-well hover:text-primary",c="shrink-0 whitespace-nowrap ps-2.5 pe-1 text-[13px] text-secondary",d="bg-[color-mix(in_oklab,var(--foreground)_14%,transparent)]",h={top:"top-3 inset-x-3 justify-center sm:top-4",bottom:"bottom-3 inset-x-3 justify-center sm:bottom-4","top-left":"top-3 start-3 justify-start sm:top-4 sm:start-4","top-right":"top-3 end-3 justify-end sm:top-4 sm:end-4","bottom-left":"bottom-3 start-3 justify-start sm:bottom-4 sm:start-4","bottom-right":"bottom-3 end-3 justify-end sm:bottom-4 sm:end-4"};function p({placement:e="bottom",label:r,className:i,children:n}){let o=e.startsWith("bottom")?"flex-col-reverse":"flex-col";return(0,t.jsx)("div",{role:r?"group":void 0,"aria-label":r,"data-lab-controls":"",className:(0,a.cn)("pointer-events-none absolute z-10 flex items-center gap-2",o,e.endsWith("left")&&"items-start",e.endsWith("right")&&"items-end",h[e],i),children:n})}function f({label:e,pressed:r,size:i="md",className:n,children:o,...l}){return(0,t.jsx)("button",{type:"button","aria-label":e,title:e,"aria-pressed":r,className:(0,a.cn)(s,u,"md"===i?"size-10":"size-8 rounded-[10px]",r&&"bg-well text-primary",n),...l,children:o})}function b(e,t,a){let i=(0,r.useRef)([]);return{refs:i,onKeyDown:r=>{let n=e.length;if(!n)return;let o=Math.max(0,e.indexOf(t)),l=-1;switch(r.key){case"ArrowRight":case"ArrowDown":l=(o+1)%n;break;case"ArrowLeft":case"ArrowUp":l=(o-1+n)%n;break;case"Home":l=0;break;case"End":l=n-1;break;default:return}r.preventDefault(),r.stopPropagation(),a(e[l]),i.current[l]?.focus()}}}function x(e){let t=String(e),r=t.indexOf(".");return r<0?0:t.length-r-1}function m(e,t,r,a){let i=Math.round((e-t)/a)*a+t;return Number(Math.min(r,Math.max(t,i)).toFixed(x(a)))}e.s(["IconButton",0,f,"MuteButton",0,function({size:e="md",className:r}){let a=(0,i.useMuted)();return(0,t.jsx)(f,{label:"Mute",pressed:a,size:e,onClick:()=>(0,i.toggleMuted)(),className:r,title:a?"Sound off":"Sound on",children:(0,t.jsxs)("span",{className:"icon-swap",children:[(0,t.jsx)("span",{"data-hidden":a?"true":void 0,className:"flex",children:(0,t.jsx)(n.SpeakerOn,{size:16})}),(0,t.jsx)("span",{"data-hidden":a?void 0:"true",className:"flex",children:(0,t.jsx)(n.SpeakerOff,{size:16})})]})})},"Segmented",0,function({label:e,options:i,value:n,onChange:o,showLabel:l=!1,className:u}){let d=i.map(e=>e.value),{refs:h,onKeyDown:p}=b(d,n,o),f=Math.max(0,d.indexOf(n)),x=(0,r.useRef)(null),[m,v]=(0,r.useState)(null),[g,y]=(0,r.useState)(!1),w=(0,r.useCallback)(()=>{let e=h.current[f];e&&v(t=>t&&t.left===e.offsetLeft&&t.width===e.offsetWidth?t:{left:e.offsetLeft,width:e.offsetWidth})},[h,f]);return(0,r.useLayoutEffect)(()=>{w()},[w]),(0,r.useEffect)(()=>{let e=x.current;if(!e)return;let t=new ResizeObserver(()=>w());t.observe(e);let r=requestAnimationFrame(()=>y(!0));return()=>{t.disconnect(),cancelAnimationFrame(r)}},[w]),(0,t.jsxs)("div",{className:(0,a.cn)("flex items-center",u),children:[l?(0,t.jsx)("span",{"aria-hidden":"true",className:c,children:e}):null,(0,t.jsxs)("div",{ref:x,role:"radiogroup","aria-label":e,onKeyDown:p,className:"relative flex items-center",children:[m?(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("absolute inset-y-0 start-0 rounded-[12px] bg-well",g&&"transition-[translate,width] duration-300 ease-out motion-reduce:transition-none"),style:{width:m.width,translate:`${m.left}px 0`}}):null,i.map((e,r)=>{let i=r===f;return(0,t.jsxs)("button",{ref:e=>{h.current[r]=e},type:"button",role:"radio","aria-checked":i,"aria-label":e.iconOnly?e.label:void 0,title:e.iconOnly?e.label:void 0,tabIndex:i?0:-1,onClick:()=>o(e.value),className:(0,a.cn)(s,"gap-1.5",e.iconOnly?"w-10":"px-3",i?"text-primary":"text-secondary hover:text-primary",!m&&i&&"bg-well"),children:[e.icon,e.iconOnly?null:(0,t.jsx)("span",{className:"tabular-nums",children:e.label})]},String(e.value))})]})]})},"Slider",0,function({label:e,value:i,min:n=0,max:o=1,step:l=.01,onChange:s,format:u,showValue:h=!0,showLabel:p=!0,width:f=112,className:b}){let v=(0,r.useRef)(null),[g,y]=(0,r.useState)(!1),w=(0,r.useId)(),A=o-n||1,_=Math.min(1,Math.max(0,(i-n)/A)),M=u?u(i):String(Number(i.toFixed(x(l)))),R=e=>{let t=v.current;if(!t)return;let r=t.getBoundingClientRect(),a=m(n+(e-r.left)/r.width*A,n,o,l);a!==i&&s(a)};return(0,t.jsxs)("div",{className:(0,a.cn)("flex h-10 items-center gap-2.5 pe-2.5",!p&&"ps-2.5",b),children:[p?(0,t.jsx)("span",{id:w,className:c,children:e}):null,(0,t.jsxs)("div",{ref:v,role:"slider",tabIndex:0,"aria-label":p?void 0:e,"aria-labelledby":p?w:void 0,"aria-valuenow":i,"aria-valuemin":n,"aria-valuemax":o,"aria-valuetext":u?M:void 0,"aria-orientation":"horizontal",onKeyDown:e=>{let t=Math.max(l,A/10),r={ArrowRight:i+l,ArrowUp:i+l,ArrowLeft:i-l,ArrowDown:i-l,PageUp:i+t,PageDown:i-t,Home:n,End:o}[e.key];if(void 0===r)return;e.preventDefault(),e.stopPropagation();let a=m(r,n,o,l);a!==i&&s(a)},onPointerDown:e=>{0===e.button&&(e.preventDefault(),e.currentTarget.focus({preventScroll:!0}),e.currentTarget.setPointerCapture(e.pointerId),y(!0),R(e.clientX))},onPointerMove:e=>{g&&R(e.clientX)},onPointerUp:()=>y(!1),onPointerCancel:()=>y(!1),onLostPointerCapture:()=>y(!1),className:"group/slider relative flex h-10 shrink-0 cursor-pointer touch-none items-center rounded-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",style:{width:f},children:[(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("absolute inset-x-0 h-1 rounded-full",d)}),(0,t.jsx)("span",{"aria-hidden":"true",className:"absolute start-0 h-1 rounded-full bg-ink",style:{width:`${100*_}%`}}),(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff] shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.18)] transition-[scale] duration-150 ease-out group-hover/slider:scale-110 dark:bg-[#e8e8e8] dark:shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_3px_rgb(0_0_0/0.5)]",g&&"scale-[1.18] group-hover/slider:scale-[1.18]"),style:{left:`${100*_}%`}})]}),h?(0,t.jsx)("span",{"aria-hidden":"true",className:"min-w-[3.5ch] text-end text-[13px] text-primary tabular-nums",children:M}):null]})},"StageControls",0,p,"StageHint",0,function({placement:e,className:r,children:i}){let n=(0,t.jsx)("p",{className:(0,a.cn)("pointer-events-none max-w-full text-center text-[12px] leading-[1.4] text-balance text-tertiary",r),children:i});return e?(0,t.jsx)(p,{placement:e,children:n}):n},"Stepper",0,function({label:e,value:i,min:o,max:l,step:d=1,onChange:h,format:p,showLabel:f=!0,className:b}){let x,v,[g,y]=(0,r.useState)(void 0),w=(0,r.useRef)({value:i,onChange:h});(0,r.useLayoutEffect)(()=>{w.current={value:i,onChange:h}});let A=(x=(0,r.useRef)(0),v=(0,r.useCallback)(()=>{window.clearTimeout(x.current),x.current=0},[]),(0,r.useEffect)(()=>v,[v]),{start:(0,r.useCallback)(e=>{if(v(),!e())return;let t=r=>{x.current=window.setTimeout(()=>{e()&&t(Math.max(50,.82*r))},r)};t(380)},[v]),stop:v}),_=(0,r.useId)(),M=e=>{let t=m(e,o,l,d);return t!==w.current.value&&(y(t>w.current.value?"up":"down"),w.current.value=t,w.current.onChange(t),!0)},R=e=>t=>{0===t.button&&(t.preventDefault(),A.start(()=>M(w.current.value+e)))},k=p?p(i):String(i),N=(0,a.cn)(s,u,"w-8");return(0,t.jsxs)("div",{className:(0,a.cn)("flex items-center",b),children:[f?(0,t.jsx)("span",{id:_,className:c,children:e}):null,(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Decrease ${e.toLowerCase()}`,disabled:i<=o,onPointerDown:R(-d),onPointerUp:A.stop,onPointerLeave:A.stop,onPointerCancel:A.stop,onClick:e=>{0===e.detail&&M(i-d)},className:N,children:(0,t.jsx)(n.Minus,{size:14})}),(0,t.jsx)("span",{role:"spinbutton",tabIndex:0,"aria-label":f?void 0:e,"aria-labelledby":f?_:void 0,"aria-valuenow":i,"aria-valuemin":o,"aria-valuemax":l,"aria-valuetext":p?k:void 0,onKeyDown:e=>{let t={ArrowUp:i+d,ArrowRight:i+d,ArrowDown:i-d,ArrowLeft:i-d,PageUp:i+5*d,PageDown:i-5*d,Home:o,End:l}[e.key];void 0!==t&&(e.preventDefault(),e.stopPropagation(),M(t))},className:"relative flex h-10 min-w-[3ch] cursor-default items-center justify-center overflow-hidden rounded-[10px] px-1.5 text-[15px] text-primary tabular-nums outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:(0,t.jsx)("span",{className:"lab-roll block","data-dir":g,children:k},k)}),(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Increase ${e.toLowerCase()}`,disabled:i>=l,onPointerDown:R(d),onPointerUp:A.stop,onPointerLeave:A.stop,onPointerCancel:A.stop,onClick:e=>{0===e.detail&&M(i+d)},className:N,children:(0,t.jsx)(n.Plus,{size:14})})]})},"Swatches",0,function({label:e,options:r,value:i,onChange:n,className:o}){let l=r.map(e=>e.value),{refs:s,onKeyDown:u}=b(l,i,n),c=Math.max(0,l.indexOf(i));return(0,t.jsx)("div",{role:"radiogroup","aria-label":e,onKeyDown:u,className:(0,a.cn)("flex items-center",o),children:r.map((e,r)=>{let i=r===c;return(0,t.jsx)("button",{ref:e=>{s.current[r]=e},type:"button",role:"radio","aria-checked":i,"aria-label":e.label,title:e.label,tabIndex:i?0:-1,onClick:()=>n(e.value),className:(0,a.cn)("group/swatch relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-[12px] outline-none transition-[box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",i?"shadow-[inset_0_0_0_2px_var(--foreground)]":"hover:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"),children:(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("block size-6 rounded-[7px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1),inset_0_1px_0_rgb(255_255_255/0.35)] transition-[scale] duration-200 ease-out dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.2)]",!i&&"group-hover/swatch:scale-[1.06] group-active/swatch:scale-95"),style:{background:e.swatch}})},String(e.value))})})},"TextInput",0,function({label:e,value:r,onChange:i,onSubmit:o,placeholder:l,maxLength:s,submitLabel:u,width:c=200,inputProps:d,className:h}){return(0,t.jsxs)("form",{className:(0,a.cn)("flex min-w-0 items-center gap-1",h),onSubmit:e=>{e.preventDefault(),o?.(r)},children:[(0,t.jsx)("input",{type:"text","aria-label":e,value:r,placeholder:l,maxLength:s,autoComplete:"off",autoCorrect:"off",spellCheck:!1,enterKeyHint:o?"go":void 0,onChange:e=>i(e.target.value),onKeyDown:e=>{e.stopPropagation(),"Escape"===e.key&&e.currentTarget.blur()},className:"h-10 min-w-0 shrink rounded-[12px] bg-transparent px-3 text-[16px] text-primary outline-none placeholder:text-tertiary focus-visible:bg-well/60 sm:text-[14px]",style:{width:c},...d}),o&&u?(0,t.jsxs)("button",{type:"submit",className:"me-1 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] bg-ink px-2.5 text-[12.5px] font-medium text-on-ink outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:[u,(0,t.jsx)(n.Return,{size:12,className:"opacity-70"})]}):null]})},"Toggle",0,function({label:e,checked:r,onChange:i,showLabel:n=!0,className:o}){return(0,t.jsxs)("button",{type:"button",role:"switch","aria-checked":r,"aria-label":n?void 0:e,onClick:()=>i(!r),className:(0,a.cn)(s,"gap-2.5 px-2.5 hover:bg-well",r?"text-primary":"text-secondary hover:text-primary",o),children:[n?(0,t.jsx)("span",{className:"text-[13px]",children:e}):null,(0,t.jsx)("span",{"aria-hidden":"true",className:(0,a.cn)("relative h-[18px] w-[30px] shrink-0 rounded-full transition-[background-color] duration-200 ease-out",r?"bg-ink":d),children:(0,t.jsx)("span",{className:(0,a.cn)("absolute top-[2px] start-[2px] size-[14px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[translate,background-color] duration-300 ease-spring motion-reduce:transition-none",r?"translate-x-3 bg-on-ink":"bg-[#fff] dark:bg-[#a3a3a3]")})})]})},"Tray",0,function({placement:e,label:r,className:i,style:n,children:o}){let s=(0,t.jsxs)("div",{role:r?"group":void 0,"aria-label":r,"data-lab-controls":"",className:(0,a.cn)("pointer-events-auto flex max-w-full items-center gap-0.5 rounded-[16px] bg-float p-1 text-[13px] text-primary shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_-1px_rgb(0_0_0/0.08),0_6px_16px_-6px_rgb(0_0_0/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_1px_2px_-1px_rgb(0_0_0/0.4),0_10px_24px_-8px_rgb(0_0_0/0.6)]","no-scrollbar overflow-x-auto",i),style:n,children:[(0,t.jsx)(l,{}),o]});return e?(0,t.jsx)(p,{placement:e,children:s}):s},"TrayButton",0,function({icon:e,variant:r="quiet",className:i,children:n,...o}){return(0,t.jsxs)("button",{type:"button",className:(0,a.cn)(s,"gap-1.5 px-3 text-[13px] font-medium","quiet"===r?"text-primary hover:bg-well":"bg-ink text-on-ink hover:opacity-90",i),...o,children:[e,n]})},"TrayDivider",0,function(){return(0,t.jsx)("span",{"aria-hidden":"true",className:"mx-1 h-5 w-px shrink-0 bg-border"})},"TrayRow",0,function({className:e,children:r}){return(0,t.jsx)("div",{className:(0,a.cn)("pointer-events-none flex max-w-full flex-wrap items-center justify-center gap-2",e),children:r})}])}]);