(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,55171,e=>{"use strict";let t=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;function a(e,t,a){let r=e.createShader(t);if(!r)throw Error("lab/gl: could not create shader");if(e.shaderSource(r,a),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)&&!e.isContextLost()){let t=e.getShaderInfoLog(r);throw e.deleteShader(r),Error(`lab/gl: shader failed to compile
${t}`)}return r}e.s(["FULLSCREEN_VERTEX",0,t,"createProgram",0,function(e,t,r){let n=a(e,e.VERTEX_SHADER,t),i=a(e,e.FRAGMENT_SHADER,r),o=e.createProgram();if(!o)throw Error("lab/gl: could not create program");if(e.attachShader(o,n),e.attachShader(o,i),e.linkProgram(o),e.deleteShader(n),e.deleteShader(i),!e.getProgramParameter(o,e.LINK_STATUS)&&!e.isContextLost()){let t=e.getProgramInfoLog(o);throw e.deleteProgram(o),Error(`lab/gl: program failed to link
${t}`)}return o},"drawFullscreen",0,function(e,t){void 0!==t&&e.bindVertexArray(t),e.drawArrays(e.TRIANGLES,0,3)},"rgb",0,function(e){let t=e.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(t){let e=3===t[1].length?t[1].replace(/./g,e=>e+e):t[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let a=e.match(/[\d.]+/g)?.map(Number)??[0,0,0];return[(a[0]??0)/255,(a[1]??0)/255,(a[2]??0)/255]},"uniformLocations",0,function(e,t){let a=new Map;return r=>(a.has(r)||a.set(r,e.getUniformLocation(t,r)),a.get(r)??null)}])},7537,e=>{"use strict";var t=e.i(43476);function a({size:e=16,className:r,title:n,children:i}){return(0,t.jsxs)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none",className:r?`shrink-0 ${r}`:"shrink-0",role:n?"img":void 0,"aria-hidden":!n||void 0,"aria-label":n,focusable:"false",children:[n?(0,t.jsx)("title",{children:n}):null,i]})}function r({children:e,width:a=1.5}){return(0,t.jsx)("g",{stroke:"currentColor",strokeWidth:a,strokeLinecap:"round",strokeLinejoin:"round",children:e})}e.s(["ChevronLeft",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsx)(r,{children:(0,t.jsx)("path",{d:"M9.75 4 5.75 8l4 4"})})})},"ChevronRightSmall",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsx)(r,{children:(0,t.jsx)("path",{d:"M6.25 4l4 4-4 4"})})})},"Expand",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M2.75 5.5V2.75H5.5"}),(0,t.jsx)("path",{d:"M10.5 2.75h2.75V5.5"}),(0,t.jsx)("path",{d:"M13.25 10.5v2.75H10.5"}),(0,t.jsx)("path",{d:"M5.5 13.25H2.75V10.5"})]})})},"GridView",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{width:1.4,children:[(0,t.jsx)("rect",{x:"2.75",y:"2.75",width:"4.25",height:"5.5",rx:"1.25"}),(0,t.jsx)("rect",{x:"9",y:"2.75",width:"4.25",height:"3.5",rx:"1.25"}),(0,t.jsx)("rect",{x:"2.75",y:"10.25",width:"4.25",height:"3",rx:"1.25"}),(0,t.jsx)("rect",{x:"9",y:"8.25",width:"4.25",height:"5",rx:"1.25"})]})})},"ListView",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M2.75 4.25h10.5"}),(0,t.jsx)("path",{d:"M2.75 8h10.5"}),(0,t.jsx)("path",{d:"M2.75 11.75h10.5"})]})})},"Minus",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsx)(r,{children:(0,t.jsx)("path",{d:"M3.5 8h9"})})})},"Play",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsx)("path",{d:"M4.75 3.9c0-.77.83-1.25 1.5-.87l6.6 3.83c.67.39.67 1.36 0 1.74l-6.6 3.83c-.67.38-1.5-.1-1.5-.87V3.9Z",fill:"currentColor"})})},"Plus",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M8 3.5v9"}),(0,t.jsx)("path",{d:"M3.5 8h9"})]})})},"Reset",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M3.5 8.5a4.5 4.5 0 1 0 1.32-3.68L3.25 6.25"}),(0,t.jsx)("path",{d:"M3.25 3.25v3h3"})]})})},"Return",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M12.75 3.5v3.75a2 2 0 0 1-2 2H3.75"}),(0,t.jsx)("path",{d:"M6.25 6.75 3.75 9.25l2.5 2.5"})]})})},"Share",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M8 2.5v7.25"}),(0,t.jsx)("path",{d:"M5.5 5 8 2.5 10.5 5"}),(0,t.jsx)("path",{d:"M5.25 7.25h-.75a1.25 1.25 0 0 0-1.25 1.25v3.75c0 .69.56 1.25 1.25 1.25h7a1.25 1.25 0 0 0 1.25-1.25V8.5a1.25 1.25 0 0 0-1.25-1.25h-.75"})]})})},"Shrink",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M5.75 2.75v3h-3"}),(0,t.jsx)("path",{d:"M13.25 5.75h-3v-3"}),(0,t.jsx)("path",{d:"M10.25 13.25v-3h3"}),(0,t.jsx)("path",{d:"M2.75 10.25h3v3"})]})})},"Shuffle",0,function(e){return(0,t.jsx)(a,{...e,children:(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M2.5 4.75h1.6c1.03 0 1.99.53 2.54 1.4l2.72 3.7c.55.87 1.51 1.4 2.54 1.4h1.6"}),(0,t.jsx)("path",{d:"M2.5 11.25h1.6c.84 0 1.63-.35 2.2-.95"}),(0,t.jsx)("path",{d:"M9.7 5.7c.57-.6 1.36-.95 2.2-.95h1.6"}),(0,t.jsx)("path",{d:"m11.75 3 1.75 1.75-1.75 1.75"}),(0,t.jsx)("path",{d:"m11.75 9.5 1.75 1.75-1.75 1.75"})]})})},"SpeakerOff",0,function(e){return(0,t.jsxs)(a,{...e,children:[(0,t.jsx)("path",{d:"M2.5 6.6c0-.47.38-.85.85-.85h1.6L7.6 3.5c.4-.34 1.02-.06 1.02.47v8.06c0 .53-.62.81-1.02.47L4.95 10.25h-1.6a.85.85 0 0 1-.85-.85V6.6Z",fill:"currentColor"}),(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"m10.75 6.25 3 3.5"}),(0,t.jsx)("path",{d:"m13.75 6.25-3 3.5"})]})]})},"SpeakerOn",0,function(e){return(0,t.jsxs)(a,{...e,children:[(0,t.jsx)("path",{d:"M2.5 6.6c0-.47.38-.85.85-.85h1.6L7.6 3.5c.4-.34 1.02-.06 1.02.47v8.06c0 .53-.62.81-1.02.47L4.95 10.25h-1.6a.85.85 0 0 1-.85-.85V6.6Z",fill:"currentColor"}),(0,t.jsxs)(r,{children:[(0,t.jsx)("path",{d:"M10.9 6.1a2.6 2.6 0 0 1 0 3.8"}),(0,t.jsx)("path",{d:"M12.55 4.4a5 5 0 0 1 0 7.2"})]})]})}])},66138,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(33209),n=e.i(16442),i=e.i(37047),o=e.i(45219),s=e.i(55171);let l=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform vec2 uRes;
uniform vec3 uCam;
uniform mat3 uBasis;
uniform float uTanHalf;
uniform float uTime;
uniform float uNight;
uniform vec4 uFlares[4];

const float PI = 3.14159265;
const float R_IN = 2.6;
const float R_OUT = 11.0;
const int STEPS = 150;

float hash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(vec3(i, 1.0));
  float b = hash(vec3(i + vec2(1.0, 0.0), 1.0));
  float c = hash(vec3(i + vec2(0.0, 1.0), 1.0));
  float d = hash(vec3(i + vec2(1.0, 1.0), 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return v;
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i);
  float n100 = hash(i + vec3(1, 0, 0));
  float n010 = hash(i + vec3(0, 1, 0));
  float n110 = hash(i + vec3(1, 1, 0));
  float n001 = hash(i + vec3(0, 0, 1));
  float n101 = hash(i + vec3(1, 0, 1));
  float n011 = hash(i + vec3(0, 1, 1));
  float n111 = hash(i + vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}

/** Ember → gold → white-blue. */
vec3 heat(float t) {
  vec3 ember = vec3(1.0, 0.28, 0.05);
  vec3 gold = vec3(1.0, 0.7, 0.36);
  vec3 white = vec3(0.86, 0.92, 1.0);
  return t < 1.0 ? mix(ember, gold, smoothstep(0.0, 1.0, t)) : mix(gold, white, smoothstep(1.0, 2.2, t));
}

/** The disk where a ray crossed it: emitted light (rgb) and opacity (a). */
vec4 disk(vec3 p, vec3 dir) {
  float r = length(p.xz);
  // Kepler: v = sqrt(M / r) with M = 1/2 (the horizon at r = 1); spun up 3x to read
  float v = sqrt(0.5 / r);
  float omega = v / r * 3.0;
  float a = uTime * omega;
  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  float phi = atan(q.y, q.x);
  // turbulence sheared along the orbit, and fine rings
  float n = fbm(q * 1.3 + vec2(r * 0.7)) * 0.65 + fbm(vec2(r * 5.5, phi * 2.0 + r)) * 0.35;
  float rings = 0.6 + 0.4 * sin(r * 10.0 + n * 6.0);
  float density = smoothstep(R_IN, R_IN + 0.35, r) * smoothstep(R_OUT, R_OUT - 5.0, r);
  density *= 0.35 + 0.9 * n * rings;

  // flares: clumps of gas dropped in, orbiting and fading
  float flare = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 f = uFlares[i];
    if (f.w <= 0.0) continue;
    float age = uTime - f.z;
    float fo = sqrt(0.5 / f.x) / f.x * 3.0;
    float ang = f.y + age * fo;
    vec2 c = f.x * vec2(cos(ang), sin(ang));
    vec2 d = p.xz - c;
    // smeared along the orbit as it shears
    vec2 t = vec2(-sin(ang), cos(ang));
    float along = dot(d, t);
    float across = dot(d, vec2(cos(ang), sin(ang)));
    float stretch = 0.35 + age * 0.45;
    float g = exp(-(along * along) / (stretch * stretch) - (across * across) / 0.08);
    flare += g * f.w * exp(-age * 0.45) * smoothstep(0.0, 0.25, age);
  }
  density += flare * 1.5;

  // temperature: hotter inside, zero at the inner edge
  float temp = pow(R_IN / r, 0.75) * pow(max(1.0 - sqrt(R_IN / r) * 0.9, 0.0), 0.25) * 2.2;
  temp += flare * 0.9;
  // beaming: gas moving toward us is brighter and bluer
  vec3 vel = normalize(vec3(-p.z, 0.0, p.x)) * v;
  float beta = length(vel);
  float gamma = inversesqrt(1.0 - beta * beta);
  float doppler = 1.0 / (gamma * (1.0 + dot(vel, normalize(dir))));
  float redshift = sqrt(max(1.0 - 1.0 / r, 0.0));
  float shift = doppler * redshift;
  vec3 light = heat(temp * shift * 1.25) * pow(shift, 3.0) * temp * 2.4;
  float alpha = clamp(density * 0.9, 0.0, 1.0);
  return vec4(light * (0.4 + density), alpha);
}

/** The night sky: two layers of stars and a faint band of nebula. */
vec3 nightSky(vec3 d) {
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float scale = k == 0 ? 60.0 : 150.0;
    float keep = k == 0 ? 0.965 : 0.93;
    vec3 p = d * scale;
    vec3 id = floor(p);
    float h = hash(id);
    if (h > keep) {
      vec3 off = hash3(id) - 0.5;
      vec3 f = fract(p) - 0.5 - off * 0.6;
      float dist = length(f);
      float b = smoothstep(0.16, 0.0, dist) * (h - keep) / (1.0 - keep);
      float tw = 0.75 + 0.25 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
      vec3 tint = mix(vec3(1.0, 0.82, 0.7), vec3(0.75, 0.85, 1.0), hash3(id + 7.0).x);
      col += tint * b * (k == 0 ? 3.0 : 1.4) * tw;
    }
  }
  vec3 bandN = normalize(vec3(0.3, 1.0, -0.2));
  float band = exp(-abs(dot(d, bandN)) * 5.0);
  float neb = noise3(d * 3.0) * 0.6 + noise3(d * 7.0) * 0.4;
  col += band * neb * mix(vec3(0.18, 0.08, 0.3), vec3(0.05, 0.16, 0.24), noise3(d * 2.0 + 4.0)) * 0.9;
  return col;
}

/** The day sky: a printed grid of longitude and latitude on paper, with a few ink stars. */
vec3 daySky(vec3 d) {
  vec3 paper = vec3(0.962, 0.952, 0.93);
  float lon = atan(d.z, d.x);
  float lon2 = atan(-d.z, -d.x);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  float cell = PI / 12.0;
  vec2 g = vec2(lon, lat) / cell;
  vec2 fw = vec2(min(fwidth(lon), fwidth(lon2)), fwidth(lat)) / cell;
  vec2 dist = abs(fract(g + 0.5) - 0.5);
  vec2 line = 1.0 - smoothstep(vec2(0.0), fw * 1.2 + 0.012, dist);
  // fade where the bending is too steep to draw a line
  vec2 fade = 1.0 - smoothstep(vec2(0.25), vec2(0.9), fw);
  float grid = max(line.x * fade.x, line.y * fade.y);
  vec2 major = abs(fract(g / 3.0 + 0.5) - 0.5) * 3.0;
  float strong = max((1.0 - smoothstep(0.0, fw.x * 1.4 + 0.02, major.x)) * fade.x, (1.0 - smoothstep(0.0, fw.y * 1.4 + 0.02, major.y)) * fade.y);
  vec3 ink = vec3(0.32, 0.3, 0.28);
  vec3 col = mix(paper, ink, grid * 0.22 + strong * 0.2);
  // the equator a touch warmer
  float eq = 1.0 - smoothstep(0.0, fw.y * 1.4 + 0.02, abs(g.y));
  col = mix(col, vec3(0.75, 0.38, 0.2), eq * fade.y * 0.35);
  // ink stars
  vec3 p = d * 70.0;
  vec3 id = floor(p);
  float h = hash(id);
  if (h > 0.975) {
    vec3 f = fract(p) - 0.5 - (hash3(id) - 0.5) * 0.6;
    col = mix(col, ink * 0.6, smoothstep(0.14, 0.04, length(f)) * 0.8);
  }
  return col;
}

void main() {
  vec2 ndc = (vUv * 2.0 - 1.0) * vec2(uRes.x / uRes.y, 1.0);
  vec3 dir = normalize(uBasis * vec3(ndc * uTanHalf, -1.0));
  vec3 pos = uCam;
  vec3 hv = cross(pos, dir);
  float h2 = dot(hv, hv);

  vec3 glow = vec3(0.0);
  float alpha = 0.0;
  bool captured = false;
  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    // finer steps near the hole and near the disk plane
    float dt = clamp(0.085 * r, 0.025, 1.2) * mix(0.5, 1.0, smoothstep(0.0, 0.6, abs(pos.y)));
    vec3 prev = pos;
    // light bends toward the hole: the photon's equation in Schwarzschild space
    dir += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    pos += dir * dt;
    if (prev.y * pos.y < 0.0) {
      vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));
      float rr = length(hit.xz);
      if (rr > R_IN * 0.95 && rr < R_OUT) {
        vec4 c = disk(hit, dir);
        glow += (1.0 - alpha) * c.rgb * c.a;
        alpha += (1.0 - alpha) * c.a;
      }
    }
    if (r < 1.0) {
      captured = true;
      break;
    }
    if (alpha > 0.985) break;
    if (r > 40.0 && dot(pos, dir) > 0.0) break;
  }

  vec3 d = normalize(dir);
  // both skies every pixel: the grid's line widths need derivatives in uniform flow
  vec3 starSky = nightSky(d);
  vec3 gridSky = daySky(d);
  // night: light adds up, then a soft shoulder
  vec3 sky = captured ? vec3(0.0) : starSky;
  vec3 night = 1.0 - exp(-(glow + (1.0 - alpha) * sky) * 1.15);
  // day: the disk is printed in warm inks over the grid
  vec3 paperSky = captured ? vec3(0.045, 0.043, 0.05) : gridSky;
  float lum = 1.0 - exp(-dot(glow, vec3(0.3, 0.5, 0.2)) * 1.6 / max(alpha, 0.05));
  vec3 diskInk = mix(vec3(0.52, 0.1, 0.05), vec3(0.98, 0.62, 0.2), clamp(lum, 0.0, 1.0));
  diskInk = mix(diskInk, vec3(1.0, 0.93, 0.75), smoothstep(0.85, 1.0, lum));
  vec3 day = mix(paperSky, diskInk, alpha);
  outColor = vec4(mix(day, night, uNight), 1.0);
}
`,c=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uNight;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main() {
  vec3 col = textureLod(uScene, vUv, 0.0).rgb;
  // a glow from the mipmaps: wide in the dark, a faint warmth on paper
  vec3 g = textureLod(uScene, vUv, 2.5).rgb * 0.5 + textureLod(uScene, vUv, 4.0).rgb * 0.35 + textureLod(uScene, vUv, 5.5).rgb * 0.15;
  vec3 bright = max(g - 0.25, 0.0);
  col += bright * mix(0.08, 0.55, uNight);
  vec2 c = vUv - 0.5;
  col *= mix(1.0, 1.0 - dot(c, c) * 0.5, uNight);
  col += (hash(vUv * uRes) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;class d{gl;scene;present;us;up;vao;tex=null;fbo=null;w=0;h=0;constructor(e){this.gl=e,this.scene=(0,s.createProgram)(e,s.FULLSCREEN_VERTEX,l),this.present=(0,s.createProgram)(e,s.FULLSCREEN_VERTEX,c),this.us=(0,s.uniformLocations)(e,this.scene),this.up=(0,s.uniformLocations)(e,this.present),this.vao=e.createVertexArray()}ensure(e,t){if(this.tex&&e===this.w&&t===this.h)return;let a=this.gl;this.tex&&a.deleteTexture(this.tex),this.fbo&&a.deleteFramebuffer(this.fbo),this.w=e,this.h=t,this.tex=a.createTexture(),a.bindTexture(a.TEXTURE_2D,this.tex),a.texImage2D(a.TEXTURE_2D,0,a.RGBA8,e,t,0,a.RGBA,a.UNSIGNED_BYTE,null),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR_MIPMAP_LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),a.generateMipmap(a.TEXTURE_2D),this.fbo=a.createFramebuffer(),a.bindFramebuffer(a.FRAMEBUFFER,this.fbo),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,this.tex,0),a.bindFramebuffer(a.FRAMEBUFFER,null)}draw(e){let t=this.gl,a=t.drawingBufferWidth,r=t.drawingBufferHeight,n=Math.max(16,Math.round(a*e.scale)),i=Math.max(16,Math.round(r*e.scale));this.ensure(n,i),t.bindVertexArray(this.vao),t.bindFramebuffer(t.FRAMEBUFFER,this.fbo),t.viewport(0,0,n,i),t.useProgram(this.scene);let o=this.us;t.uniform2f(o("uRes"),n,i),t.uniform3fv(o("uCam"),e.cam),t.uniformMatrix3fv(o("uBasis"),!1,e.basis),t.uniform1f(o("uTanHalf"),e.tanHalf),t.uniform1f(o("uTime"),e.time),t.uniform1f(o("uNight"),e.night),t.uniform4fv(o("uFlares"),e.flares),t.drawArrays(t.TRIANGLES,0,3),t.bindTexture(t.TEXTURE_2D,this.tex),t.generateMipmap(t.TEXTURE_2D),t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,a,r),t.useProgram(this.present);let s=this.up;t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.tex),t.uniform1i(s("uScene"),0),t.uniform2f(s("uRes"),a,r),t.uniform1f(s("uNight"),e.night),t.drawArrays(t.TRIANGLES,0,3)}dispose(){let e=this.gl;e.deleteProgram(this.scene),e.deleteProgram(this.present),e.deleteVertexArray(this.vao),this.tex&&e.deleteTexture(this.tex),this.fbo&&e.deleteFramebuffer(this.fbo),this.tex=null,this.fbo=null}}class u{nodes=null;start(e){if(this.nodes)return;let{ctx:t,output:a}=e,r=t.createGain();r.gain.value=0;let i=t.createBiquadFilter();i.type="lowpass",i.frequency.value=180,i.Q.value=.7,i.connect(r).connect(a);let o=[41.2,41.9,82.4].map((e,a)=>{let r=t.createOscillator();r.type=2===a?"triangle":"sine",r.frequency.value=e;let n=t.createGain();return n.gain.value=2===a?.25:.6,r.connect(n).connect(i),r.start(),r}),s=t.createBufferSource();s.buffer=(0,n.noiseBuffer)(t,2),s.loop=!0;let l=t.createGain();l.gain.value=.35,s.connect(l).connect(i),s.start(),this.nodes={oscs:o,src:s,gain:r,low:i}}set(e,t){if(!this.nodes||!e)return;let a=e.ctx.currentTime,r=Math.min(1,Math.max(0,t));this.nodes.gain.gain.setTargetAtTime(t<0?0:.05+.12*r,a,t<0?1.2:.25),this.nodes.low.frequency.setTargetAtTime(150+260*r,a,.3)}stop(){if(this.nodes){for(let e of this.nodes.oscs)try{e.stop()}catch{}try{this.nodes.src.stop()}catch{}this.nodes.gain.disconnect(),this.nodes=null}}}let h=[1,.8,.64,.5];function p(){return(0,t.jsx)("div",{"aria-hidden":"true",className:"absolute inset-0 grid place-items-center bg-[#f5f3ee] dark:bg-black",children:(0,t.jsx)("div",{className:"aspect-square w-[46%] rounded-full",style:{background:"radial-gradient(circle, #000 0 38%, rgb(255 190 110) 40%, rgb(240 110 40 / 0.7) 47%, transparent 64%)"}})})}e.s(["default",0,function({mode:e,active:s,reducedMotion:l,theme:c}){let f="stage"===e,m=(0,a.useRef)(null),x=(0,a.useRef)(null),v=(0,a.useRef)(new u),g=(0,a.useId)(),b=(0,i.useFinePointer)(),[w,y]=(0,a.useState)(!1),[_,j]=(0,a.useState)(!1),[k,T]=(0,a.useState)(""),[M]=(0,a.useState)(()=>({yaw:.6,pitch:.13,dist:f?15:17,yawV:0,pitchV:0,distGoal:f?15:17,night:+("dark"===c),theme:c,reduced:l,time:3,acc:0,lastInput:performance.now()/1e3,pts:new Map,pinch:0,downAt:0,downX:0,downY:0,moved:!1,dragYawV:0,dragPitchV:0,lastMove:0,flares:new Float32Array(16),nextFlare:0,scaleStep:0,perf:{time:0,slow:0},frame:{cam:new Float32Array(3),basis:new Float32Array(9),tanHalf:.42,time:0,night:0,flares:new Float32Array(16),scale:1}}));M.theme=c,M.reduced=l;let E=(0,a.useRef)(()=>{}),R=(0,a.useCallback)(()=>{M.lastInput=performance.now()/1e3,E.current()},[M]);(0,a.useEffect)(()=>{window.matchMedia("(pointer: fine)").matches||(M.scaleStep=1)},[M]);let S=()=>{let e=M.frame,t=Math.cos(M.pitch),a=e.cam;a[0]=M.dist*t*Math.sin(M.yaw),a[1]=M.dist*Math.sin(M.pitch),a[2]=M.dist*t*Math.cos(M.yaw);let r=a[0]/M.dist,n=a[1]/M.dist,i=a[2]/M.dist,o=i,s=-r,l=Math.hypot(o,s)||1;o/=l;let c=n*(s/=l),d=i*o-r*s,u=-n*o,h=e.basis;h[0]=o,h[1]=0,h[2]=s,h[3]=c,h[4]=d,h[5]=u,h[6]=r,h[7]=n,h[8]=i},N=(e,t)=>{let a=3.6+4*Math.random(),r=Math.random()*Math.PI*2,{width:i,height:o}=V.current;if(void 0!==e&&void 0!==t&&i>0){S();let n=M.frame,s=i/o*(e/i*2-1)*.42,l=(1-t/o*2)*.42,c=n.basis,d=c[0]*s+c[3]*l-c[6],u=c[1]*s+c[4]*l-c[7],h=c[2]*s+c[5]*l-c[8],p=-n.cam[1]/u;if(p>0){let e=n.cam[0]+d*p,t=n.cam[2]+h*p,i=Math.hypot(e,t);i>2.9&&i<10.5&&(a=i,r=Math.atan2(t,e))}}let s=M.nextFlare;M.nextFlare=(s+1)%4,M.flares.set([a,r,M.time,1],4*s);let l=(0,n.getAudio)();f&&l&&!(0,n.isMuted)()&&function(e){let{ctx:t,output:a}=e,r=t.currentTime+.01,i=t.createBufferSource();i.buffer=(0,n.noiseBuffer)(t,2);let o=t.createBiquadFilter();o.type="bandpass",o.Q.value=1.4,o.frequency.setValueAtTime(180,r),o.frequency.exponentialRampToValueAtTime(1400,r+1.2);let s=t.createGain();s.gain.setValueAtTime(0,r),s.gain.linearRampToValueAtTime(.14,r+.9),s.gain.exponentialRampToValueAtTime(1e-4,r+2),i.connect(o).connect(s).connect(a),i.start(r,0,2.1);let l=t.createOscillator();l.type="sine",l.frequency.setValueAtTime(880,r+.8),l.frequency.exponentialRampToValueAtTime(660,r+2.4);let c=t.createGain();c.gain.setValueAtTime(0,r+.8),c.gain.linearRampToValueAtTime(.05,r+.85),c.gain.exponentialRampToValueAtTime(1e-4,r+2.6),l.connect(c).connect(a),l.start(r+.8),l.stop(r+2.7)}(l),R()},A=(0,i.useFrame)(s&&!_,e=>{let t=x.current;if(!t||V.current.width<2)return!1;let a=performance.now()/1e3-M.lastInput,r=M.reduced,o=e;if(!f||a>12&&0===M.pts.size){if(M.acc+=o,M.acc<1/30-.002)return;o=Math.min(.1,M.acc),M.acc=0}else M.acc=0;let s=!1;for(let e=0;e<4;e++)M.flares[4*e+3]<=0||(M.time-M.flares[4*e+2]>7?M.flares[4*e+3]=0:s=!0);(!r||s)&&(M.time+=o);let l=M.pts.size>0;if(!l){let e=Math.exp(-(2.2*o));M.yawV*=e,M.pitchV*=e,M.yaw+=M.yawV*o,M.pitch+=M.pitchV*o,!r&&(M.yaw+=o*(f?.045:.08),f||(M.pitch=.13+.16*Math.sin(.21*M.time)))}M.pitch>1.25?(M.pitch=(0,i.damp)(M.pitch,1.25,10,o),M.pitchV=Math.min(M.pitchV,0)):M.pitch<-1.25&&(M.pitch=(0,i.damp)(M.pitch,-1.25,10,o),M.pitchV=Math.max(M.pitchV,0)),M.dist=r?M.distGoal:(0,i.damp)(M.dist,M.distGoal,6,o);let c=+("dark"===M.theme);if(M.night=r?c:(0,i.damp)(M.night,c,5,o),.003>Math.abs(M.night-c)&&(M.night=c),f){let e=Math.hypot(l?M.dragYawV:M.yawV,l?M.dragPitchV:M.pitchV);v.current.set((0,n.getAudio)(),a<12?(0,i.clamp)(e/3):-1)}if(f&&M.scaleStep<h.length-1){let t=M.perf;t.time+=e,e>1/42&&(t.slow+=e),t.time>=1.5&&(t.slow>.6*t.time&&(M.scaleStep+=1),t.time=0,t.slow=0)}S();let d=M.frame;if(d.time=M.time,d.night=M.night,d.flares.set(M.flares),d.scale=f?h[M.scaleStep]:.7,t.draw(d),r&&!l&&!s&&.002>Math.abs(M.yawV)&&.002>Math.abs(M.pitchV)&&.01>Math.abs(M.dist-M.distGoal)&&M.night===c)return!1});E.current=A;let{canvasRef:P,sizeRef:V,supported:I}=(0,i.useWebGL2)({mode:e,maxDpr:f?1.5:1,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!1,depth:!1,stencil:!1},onContext:e=>{let t;try{t=new d(e)}catch(e){console.error(e),j(!0);return}return x.current=t,A(),()=>{t.dispose(),x.current=null}},onResize:()=>A()});(0,a.useEffect)(()=>{A()},[c,l,A]),(0,a.useEffect)(()=>{let e=v.current;return s||e.stop(),()=>e.stop()},[s]);let L=e=>{let t=m.current?.getBoundingClientRect();return t?{x:e.clientX-t.left,y:e.clientY-t.top}:{x:0,y:0}},C=()=>{w||y(!0);let e=(0,n.ensureAudio)();e&&v.current.start(e)},U=()=>{let[e,t]=[...M.pts.values()];return e&&t?Math.hypot(e.x-t.x,e.y-t.y):0},D=e=>{if(!M.pts.has(e.pointerId))return;if(M.pts.delete(e.pointerId),M.pts.size>0){M.pinch=0;return}let t=performance.now()/1e3-M.downAt<.3;!M.moved&&t&&"pointerup"===e.type?N(M.downX,M.downY):e.timeStamp-M.lastMove<80&&(M.yawV=(0,i.clamp)(M.dragYawV,-4,4),M.pitchV=(0,i.clamp)(M.dragPitchV,-3,3)),R()};(0,a.useEffect)(()=>{let e=m.current;if(!e||!f)return;let t=e=>{e.ctrlKey&&(e.preventDefault(),M.distGoal=(0,i.clamp)(M.distGoal*Math.exp(.01*e.deltaY),8.5,24),R())};return e.addEventListener("wheel",t,{passive:!1}),()=>e.removeEventListener("wheel",t)},[M,f,R]);let F=!1===I||_;return f?(0,t.jsxs)("div",{ref:m,className:"absolute inset-0 select-none [-webkit-tap-highlight-color:transparent] cursor-grab active:cursor-grabbing",style:{touchAction:"none"},onPointerDown:e=>{if(e.button>0||e.target.closest("[data-lab-controls]"))return;m.current?.setPointerCapture(e.pointerId);let t=L(e);M.pts.set(e.pointerId,t),1===M.pts.size?(M.downAt=performance.now()/1e3,M.downX=t.x,M.downY=t.y,M.moved=!1,M.yawV=M.pitchV=0,M.dragYawV=M.dragPitchV=0,M.lastMove=e.timeStamp):(M.pinch=U(),M.moved=!0),C(),R()},onPointerMove:e=>{let t=M.pts.get(e.pointerId);if(!t)return;let a=L(e);if(M.pts.size>=2){M.pts.set(e.pointerId,a);let t=U();M.pinch>0&&t>0&&(M.distGoal=(0,i.clamp)(M.distGoal*(M.pinch/t),8.5,24)),M.pinch=t,R();return}let r=a.x-t.x,n=a.y-t.y;M.pts.set(e.pointerId,a),Math.hypot(a.x-M.downX,a.y-M.downY)>6&&(M.moved=!0);let o=4.2/Math.max(240,V.current.height);M.yaw-=r*o,M.pitch=(0,i.clamp)(M.pitch+n*o*.8,-1.4,1.4);let s=Math.max(.001,(e.timeStamp-M.lastMove)/1e3);M.lastMove=e.timeStamp;let l=1-Math.exp(-s/.06);M.dragYawV+=(-r*o/s-M.dragYawV)*l,M.dragPitchV+=(n*o*.8/s-M.dragPitchV)*l,R()},onPointerUp:D,onPointerCancel:D,children:[F?(0,t.jsx)(p,{}):(0,t.jsx)("canvas",{ref:P,"aria-hidden":"true",className:"absolute inset-0 size-full"}),(0,t.jsx)("div",{tabIndex:F?void 0:0,role:"img","aria-label":"A black hole with a glowing disk of gas, its gravity bending the light behind it","aria-describedby":g,onKeyDown:F?void 0:e=>{let t=e.key,a={ArrowLeft:[1.4,0],ArrowRight:[-1.4,0],ArrowUp:[0,1],ArrowDown:[0,-1]};a[t]?(e.preventDefault(),M.yawV+=a[t][0],M.pitchV+=a[t][1],C(),R()):"+"===t||"="===t?(M.distGoal=(0,i.clamp)(.85*M.distGoal,8.5,24),T("Closer"),R()):"-"===t||"_"===t?(M.distGoal=(0,i.clamp)(M.distGoal/.85,8.5,24),T("Further"),R()):(" "===t||"Enter"===t)&&(e.preventDefault(),C(),N(),T("A clump of gas flares in the disk"))},className:"absolute inset-0 rounded-[inherit] outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--foreground)]"}),(0,t.jsx)("p",{id:g,className:"sr-only",children:"A black hole. The arrow keys fly around it, plus and minus move closer and further, and Space drops a clump of gas into the disk. With a pointer: drag to fly around, pinch to move closer, and tap the disk to drop in gas."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:k}),(0,t.jsxs)(o.StageControls,{placement:"bottom",children:[F?null:(0,t.jsx)(o.TrayRow,{children:(0,t.jsx)(o.Tray,{label:"Sound",children:(0,t.jsx)(o.MuteButton,{})})}),(0,t.jsx)(o.StageHint,{className:(0,r.cn)("transition-opacity duration-700",w&&"opacity-0"),children:F?"A still: this browser can't run the live scene":b?"Drag to fly around · pinch to move closer · click the disk to drop in gas":"Drag to fly around · pinch to zoom · tap the disk"})]})]}):(0,t.jsx)("div",{ref:m,"aria-hidden":"true",className:"absolute inset-0",children:F?(0,t.jsx)(p,{}):(0,t.jsx)("canvas",{ref:P,className:"absolute inset-0 size-full"})})}],66138)},21031,function(e){e.n(e.i(66138))},45219,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(33209),n=e.i(16442),i=e.i(7537);let o=`
@keyframes lab-roll-up { from { translate: 0 55%; opacity: 0; filter: blur(2px); } }
@keyframes lab-roll-down { from { translate: 0 -55%; opacity: 0; filter: blur(2px); } }
.lab-roll[data-dir="up"] { animation: lab-roll-up 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.lab-roll[data-dir="down"] { animation: lab-roll-down 260ms cubic-bezier(0.23, 1, 0.32, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .lab-roll[data-dir] { animation: none; }
}
`;function s(){return(0,t.jsx)("style",{href:"lab-ui",precedence:"default",children:o})}let l="relative inline-flex h-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-[12px] outline-none transition-[background-color,color,scale,opacity] duration-150 ease-out active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40",c="text-secondary hover:bg-well hover:text-primary",d="shrink-0 whitespace-nowrap ps-2.5 pe-1 text-[13px] text-secondary",u="bg-[color-mix(in_oklab,var(--foreground)_14%,transparent)]",h={top:"top-3 inset-x-3 justify-center sm:top-4",bottom:"bottom-3 inset-x-3 justify-center sm:bottom-4","top-left":"top-3 start-3 justify-start sm:top-4 sm:start-4","top-right":"top-3 end-3 justify-end sm:top-4 sm:end-4","bottom-left":"bottom-3 start-3 justify-start sm:bottom-4 sm:start-4","bottom-right":"bottom-3 end-3 justify-end sm:bottom-4 sm:end-4"};function p({placement:e="bottom",label:a,className:n,children:i}){let o=e.startsWith("bottom")?"flex-col-reverse":"flex-col";return(0,t.jsx)("div",{role:a?"group":void 0,"aria-label":a,"data-lab-controls":"",className:(0,r.cn)("pointer-events-none absolute z-10 flex items-center gap-2",o,e.endsWith("left")&&"items-start",e.endsWith("right")&&"items-end",h[e],n),children:i})}function f({label:e,pressed:a,size:n="md",className:i,children:o,...s}){return(0,t.jsx)("button",{type:"button","aria-label":e,title:e,"aria-pressed":a,className:(0,r.cn)(l,c,"md"===n?"size-10":"size-8 rounded-[10px]",a&&"bg-well text-primary",i),...s,children:o})}function m(e,t,r){let n=(0,a.useRef)([]);return{refs:n,onKeyDown:a=>{let i=e.length;if(!i)return;let o=Math.max(0,e.indexOf(t)),s=-1;switch(a.key){case"ArrowRight":case"ArrowDown":s=(o+1)%i;break;case"ArrowLeft":case"ArrowUp":s=(o-1+i)%i;break;case"Home":s=0;break;case"End":s=i-1;break;default:return}a.preventDefault(),a.stopPropagation(),r(e[s]),n.current[s]?.focus()}}}function x(e){let t=String(e),a=t.indexOf(".");return a<0?0:t.length-a-1}function v(e,t,a,r){let n=Math.round((e-t)/r)*r+t;return Number(Math.min(a,Math.max(t,n)).toFixed(x(r)))}e.s(["IconButton",0,f,"MuteButton",0,function({size:e="md",className:a}){let r=(0,n.useMuted)();return(0,t.jsx)(f,{label:"Mute",pressed:r,size:e,onClick:()=>(0,n.toggleMuted)(),className:a,title:r?"Sound off":"Sound on",children:(0,t.jsxs)("span",{className:"icon-swap",children:[(0,t.jsx)("span",{"data-hidden":r?"true":void 0,className:"flex",children:(0,t.jsx)(i.SpeakerOn,{size:16})}),(0,t.jsx)("span",{"data-hidden":r?void 0:"true",className:"flex",children:(0,t.jsx)(i.SpeakerOff,{size:16})})]})})},"Segmented",0,function({label:e,options:n,value:i,onChange:o,showLabel:s=!1,className:c}){let u=n.map(e=>e.value),{refs:h,onKeyDown:p}=m(u,i,o),f=Math.max(0,u.indexOf(i)),x=(0,a.useRef)(null),[v,g]=(0,a.useState)(null),[b,w]=(0,a.useState)(!1),y=(0,a.useCallback)(()=>{let e=h.current[f];e&&g(t=>t&&t.left===e.offsetLeft&&t.width===e.offsetWidth?t:{left:e.offsetLeft,width:e.offsetWidth})},[h,f]);return(0,a.useLayoutEffect)(()=>{y()},[y]),(0,a.useEffect)(()=>{let e=x.current;if(!e)return;let t=new ResizeObserver(()=>y());t.observe(e);let a=requestAnimationFrame(()=>w(!0));return()=>{t.disconnect(),cancelAnimationFrame(a)}},[y]),(0,t.jsxs)("div",{className:(0,r.cn)("flex items-center",c),children:[s?(0,t.jsx)("span",{"aria-hidden":"true",className:d,children:e}):null,(0,t.jsxs)("div",{ref:x,role:"radiogroup","aria-label":e,onKeyDown:p,className:"relative flex items-center",children:[v?(0,t.jsx)("span",{"aria-hidden":"true",className:(0,r.cn)("absolute inset-y-0 start-0 rounded-[12px] bg-well",b&&"transition-[translate,width] duration-300 ease-out motion-reduce:transition-none"),style:{width:v.width,translate:`${v.left}px 0`}}):null,n.map((e,a)=>{let n=a===f;return(0,t.jsxs)("button",{ref:e=>{h.current[a]=e},type:"button",role:"radio","aria-checked":n,"aria-label":e.iconOnly?e.label:void 0,title:e.iconOnly?e.label:void 0,tabIndex:n?0:-1,onClick:()=>o(e.value),className:(0,r.cn)(l,"gap-1.5",e.iconOnly?"w-10":"px-3",n?"text-primary":"text-secondary hover:text-primary",!v&&n&&"bg-well"),children:[e.icon,e.iconOnly?null:(0,t.jsx)("span",{className:"tabular-nums",children:e.label})]},String(e.value))})]})]})},"Slider",0,function({label:e,value:n,min:i=0,max:o=1,step:s=.01,onChange:l,format:c,showValue:h=!0,showLabel:p=!0,width:f=112,className:m}){let g=(0,a.useRef)(null),[b,w]=(0,a.useState)(!1),y=(0,a.useId)(),_=o-i||1,j=Math.min(1,Math.max(0,(n-i)/_)),k=c?c(n):String(Number(n.toFixed(x(s)))),T=e=>{let t=g.current;if(!t)return;let a=t.getBoundingClientRect(),r=v(i+(e-a.left)/a.width*_,i,o,s);r!==n&&l(r)};return(0,t.jsxs)("div",{className:(0,r.cn)("flex h-10 items-center gap-2.5 pe-2.5",!p&&"ps-2.5",m),children:[p?(0,t.jsx)("span",{id:y,className:d,children:e}):null,(0,t.jsxs)("div",{ref:g,role:"slider",tabIndex:0,"aria-label":p?void 0:e,"aria-labelledby":p?y:void 0,"aria-valuenow":n,"aria-valuemin":i,"aria-valuemax":o,"aria-valuetext":c?k:void 0,"aria-orientation":"horizontal",onKeyDown:e=>{let t=Math.max(s,_/10),a={ArrowRight:n+s,ArrowUp:n+s,ArrowLeft:n-s,ArrowDown:n-s,PageUp:n+t,PageDown:n-t,Home:i,End:o}[e.key];if(void 0===a)return;e.preventDefault(),e.stopPropagation();let r=v(a,i,o,s);r!==n&&l(r)},onPointerDown:e=>{0===e.button&&(e.preventDefault(),e.currentTarget.focus({preventScroll:!0}),e.currentTarget.setPointerCapture(e.pointerId),w(!0),T(e.clientX))},onPointerMove:e=>{b&&T(e.clientX)},onPointerUp:()=>w(!1),onPointerCancel:()=>w(!1),onLostPointerCapture:()=>w(!1),className:"group/slider relative flex h-10 shrink-0 cursor-pointer touch-none items-center rounded-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",style:{width:f},children:[(0,t.jsx)("span",{"aria-hidden":"true",className:(0,r.cn)("absolute inset-x-0 h-1 rounded-full",u)}),(0,t.jsx)("span",{"aria-hidden":"true",className:"absolute start-0 h-1 rounded-full bg-ink",style:{width:`${100*j}%`}}),(0,t.jsx)("span",{"aria-hidden":"true",className:(0,r.cn)("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff] shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_1px_3px_rgb(0_0_0/0.18)] transition-[scale] duration-150 ease-out group-hover/slider:scale-110 dark:bg-[#e8e8e8] dark:shadow-[0_0_0_1px_rgb(0_0_0/0.4),0_1px_3px_rgb(0_0_0/0.5)]",b&&"scale-[1.18] group-hover/slider:scale-[1.18]"),style:{left:`${100*j}%`}})]}),h?(0,t.jsx)("span",{"aria-hidden":"true",className:"min-w-[3.5ch] text-end text-[13px] text-primary tabular-nums",children:k}):null]})},"StageControls",0,p,"StageHint",0,function({placement:e,className:a,children:n}){let i=(0,t.jsx)("p",{className:(0,r.cn)("pointer-events-none max-w-full text-center text-[12px] leading-[1.4] text-balance text-tertiary",a),children:n});return e?(0,t.jsx)(p,{placement:e,children:i}):i},"Stepper",0,function({label:e,value:n,min:o,max:s,step:u=1,onChange:h,format:p,showLabel:f=!0,className:m}){let x,g,[b,w]=(0,a.useState)(void 0),y=(0,a.useRef)({value:n,onChange:h});(0,a.useLayoutEffect)(()=>{y.current={value:n,onChange:h}});let _=(x=(0,a.useRef)(0),g=(0,a.useCallback)(()=>{window.clearTimeout(x.current),x.current=0},[]),(0,a.useEffect)(()=>g,[g]),{start:(0,a.useCallback)(e=>{if(g(),!e())return;let t=a=>{x.current=window.setTimeout(()=>{e()&&t(Math.max(50,.82*a))},a)};t(380)},[g]),stop:g}),j=(0,a.useId)(),k=e=>{let t=v(e,o,s,u);return t!==y.current.value&&(w(t>y.current.value?"up":"down"),y.current.value=t,y.current.onChange(t),!0)},T=e=>t=>{0===t.button&&(t.preventDefault(),_.start(()=>k(y.current.value+e)))},M=p?p(n):String(n),E=(0,r.cn)(l,c,"w-8");return(0,t.jsxs)("div",{className:(0,r.cn)("flex items-center",m),children:[f?(0,t.jsx)("span",{id:j,className:d,children:e}):null,(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Decrease ${e.toLowerCase()}`,disabled:n<=o,onPointerDown:T(-u),onPointerUp:_.stop,onPointerLeave:_.stop,onPointerCancel:_.stop,onClick:e=>{0===e.detail&&k(n-u)},className:E,children:(0,t.jsx)(i.Minus,{size:14})}),(0,t.jsx)("span",{role:"spinbutton",tabIndex:0,"aria-label":f?void 0:e,"aria-labelledby":f?j:void 0,"aria-valuenow":n,"aria-valuemin":o,"aria-valuemax":s,"aria-valuetext":p?M:void 0,onKeyDown:e=>{let t={ArrowUp:n+u,ArrowRight:n+u,ArrowDown:n-u,ArrowLeft:n-u,PageUp:n+5*u,PageDown:n-5*u,Home:o,End:s}[e.key];void 0!==t&&(e.preventDefault(),e.stopPropagation(),k(t))},className:"relative flex h-10 min-w-[3ch] cursor-default items-center justify-center overflow-hidden rounded-[10px] px-1.5 text-[15px] text-primary tabular-nums outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:(0,t.jsx)("span",{className:"lab-roll block","data-dir":b,children:M},M)}),(0,t.jsx)("button",{type:"button",tabIndex:-1,"aria-label":`Increase ${e.toLowerCase()}`,disabled:n>=s,onPointerDown:T(u),onPointerUp:_.stop,onPointerLeave:_.stop,onPointerCancel:_.stop,onClick:e=>{0===e.detail&&k(n+u)},className:E,children:(0,t.jsx)(i.Plus,{size:14})})]})},"Swatches",0,function({label:e,options:a,value:n,onChange:i,className:o}){let s=a.map(e=>e.value),{refs:l,onKeyDown:c}=m(s,n,i),d=Math.max(0,s.indexOf(n));return(0,t.jsx)("div",{role:"radiogroup","aria-label":e,onKeyDown:c,className:(0,r.cn)("flex items-center",o),children:a.map((e,a)=>{let n=a===d;return(0,t.jsx)("button",{ref:e=>{l.current[a]=e},type:"button",role:"radio","aria-checked":n,"aria-label":e.label,title:e.label,tabIndex:n?0:-1,onClick:()=>i(e.value),className:(0,r.cn)("group/swatch relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-[12px] outline-none transition-[box-shadow] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",n?"shadow-[inset_0_0_0_2px_var(--foreground)]":"hover:shadow-[inset_0_0_0_2px_color-mix(in_oklab,var(--foreground)_14%,transparent)]"),children:(0,t.jsx)("span",{"aria-hidden":"true",className:(0,r.cn)("block size-6 rounded-[7px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1),inset_0_1px_0_rgb(255_255_255/0.35)] transition-[scale] duration-200 ease-out dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.2)]",!n&&"group-hover/swatch:scale-[1.06] group-active/swatch:scale-95"),style:{background:e.swatch}})},String(e.value))})})},"TextInput",0,function({label:e,value:a,onChange:n,onSubmit:o,placeholder:s,maxLength:l,submitLabel:c,width:d=200,inputProps:u,className:h}){return(0,t.jsxs)("form",{className:(0,r.cn)("flex min-w-0 items-center gap-1",h),onSubmit:e=>{e.preventDefault(),o?.(a)},children:[(0,t.jsx)("input",{type:"text","aria-label":e,value:a,placeholder:s,maxLength:l,autoComplete:"off",autoCorrect:"off",spellCheck:!1,enterKeyHint:o?"go":void 0,onChange:e=>n(e.target.value),onKeyDown:e=>{e.stopPropagation(),"Escape"===e.key&&e.currentTarget.blur()},className:"h-10 min-w-0 shrink rounded-[12px] bg-transparent px-3 text-[16px] text-primary outline-none placeholder:text-tertiary focus-visible:bg-well/60 sm:text-[14px]",style:{width:d},...u}),o&&c?(0,t.jsxs)("button",{type:"submit",className:"me-1 inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] bg-ink px-2.5 text-[12.5px] font-medium text-on-ink outline-none transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",children:[c,(0,t.jsx)(i.Return,{size:12,className:"opacity-70"})]}):null]})},"Toggle",0,function({label:e,checked:a,onChange:n,showLabel:i=!0,className:o}){return(0,t.jsxs)("button",{type:"button",role:"switch","aria-checked":a,"aria-label":i?void 0:e,onClick:()=>n(!a),className:(0,r.cn)(l,"gap-2.5 px-2.5 hover:bg-well",a?"text-primary":"text-secondary hover:text-primary",o),children:[i?(0,t.jsx)("span",{className:"text-[13px]",children:e}):null,(0,t.jsx)("span",{"aria-hidden":"true",className:(0,r.cn)("relative h-[18px] w-[30px] shrink-0 rounded-full transition-[background-color] duration-200 ease-out",a?"bg-ink":u),children:(0,t.jsx)("span",{className:(0,r.cn)("absolute top-[2px] start-[2px] size-[14px] rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-[translate,background-color] duration-300 ease-spring motion-reduce:transition-none",a?"translate-x-3 bg-on-ink":"bg-[#fff] dark:bg-[#a3a3a3]")})})]})},"Tray",0,function({placement:e,label:a,className:n,style:i,children:o}){let l=(0,t.jsxs)("div",{role:a?"group":void 0,"aria-label":a,"data-lab-controls":"",className:(0,r.cn)("pointer-events-auto flex max-w-full items-center gap-0.5 rounded-[16px] bg-float p-1 text-[13px] text-primary shadow-[0_0_0_1px_rgb(0_0_0/0.07),0_1px_2px_-1px_rgb(0_0_0/0.08),0_6px_16px_-6px_rgb(0_0_0/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_1px_2px_-1px_rgb(0_0_0/0.4),0_10px_24px_-8px_rgb(0_0_0/0.6)]","no-scrollbar overflow-x-auto",n),style:i,children:[(0,t.jsx)(s,{}),o]});return e?(0,t.jsx)(p,{placement:e,children:l}):l},"TrayButton",0,function({icon:e,variant:a="quiet",className:n,children:i,...o}){return(0,t.jsxs)("button",{type:"button",className:(0,r.cn)(l,"gap-1.5 px-3 text-[13px] font-medium","quiet"===a?"text-primary hover:bg-well":"bg-ink text-on-ink hover:opacity-90",n),...o,children:[e,i]})},"TrayDivider",0,function(){return(0,t.jsx)("span",{"aria-hidden":"true",className:"mx-1 h-5 w-px shrink-0 bg-border"})},"TrayRow",0,function({className:e,children:a}){return(0,t.jsx)("div",{className:(0,r.cn)("pointer-events-none flex max-w-full flex-wrap items-center justify-center gap-2",e),children:a})}])}]);