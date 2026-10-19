(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,61480,e=>{"use strict";var t=e.i(43476),i=e.i(71645),a=e.i(37047),o=e.i(45219);let l=2*Math.PI;function r(e){let t=0;for(let i=0;i<e.length;i++){let a=e[i],o=e[(i+1)%e.length];t+=a.x*o.y-o.x*a.y}return t/2}function n(e){let t=0,i=0,a=0;for(let o=0;o<e.length;o++){let l=e[o],r=e[(o+1)%e.length],n=l.x*r.y-r.x*l.y;a+=n,t+=(l.x+r.x)*n,i+=(l.y+r.y)*n}return{x:t/(3*a),y:i/(3*a)}}function s(e,t,i,a,o=0){let r=a/Math.cos(Math.PI/i),n=[];for(let a=0;a<i;a++){let s=o+(a-.5)*l/i;n.push({x:e+r*Math.cos(s),y:t+r*Math.sin(s)})}return n}function h(e,t,i,a){let o=e.length,l=a??n(e),s=r(e)>0;for(let a=0;a<o;a++){let r=e[a],n=e[(a+1)%o],h=(r.x+n.x)/2,c=(r.y+n.y)/2,u=Math.hypot(n.x-r.x,n.y-r.y),f=(n.x-r.x)/u,d=(n.y-r.y)/u,p=s?-d:d,x=s?f:-f;for(let[s,u]of[[n,1],[r,-1]]){let m=u*f*Math.cos(t)+p*Math.sin(t),y=u*d*Math.cos(t)+x*Math.sin(t),g=u>0?r:e[(a-1+o)%o],v=u>0?e[(a+2)%o]:n,w=g.x-s.x,b=g.y-s.y,M=v.x-s.x,_=v.y-s.y,k=Math.hypot(w,b),T=Math.hypot(M,_),z=w/k+M/T,R=b/k+_/T;1e-9>Math.hypot(z,R)&&(z=l.x-s.x,R=l.y-s.y);let A=m*R-y*z;if(1e-12>Math.abs(A))continue;let E=((s.x-h)*R-(s.y-c)*z)/A;E<=0||i.push([h,c,h+m*E,c+y*E])}}}function c(e,t,i,a){let o=e.length,l=r(e)>0,n=[];for(let i=0;i<o;i++){let a=e[i],r=e[(i+1)%o],s=(a.x+r.x)/2,h=(a.y+r.y)/2,c=Math.hypot(r.x-a.x,r.y-a.y),u=(r.x-a.x)/c,f=(r.y-a.y)/c,d=l?-f:f,p=l?u:-u;for(let e of[1,-1])n.push({x:s,y:h,dx:e*u*Math.cos(t)+d*Math.sin(t),dy:e*f*Math.cos(t)+p*Math.sin(t)})}for(let t of n){let o=[];for(let i of n){if(i===t)continue;let a=t.dx*i.dy-t.dy*i.dx;if(1e-12>Math.abs(a))continue;let l=i.x-t.x,r=i.y-t.y,n=(l*i.dy-r*i.dx)/a,s=(l*t.dy-r*t.dx)/a;n<=1e-9||s<=1e-9||function(e,t,i){let a=!1;for(let o=0,l=e.length-1;o<e.length;l=o++){let r=e[o],n=e[l];r.y>i!=n.y>i&&t<(n.x-r.x)*(i-r.y)/(n.y-r.y)+r.x&&(a=!a)}return a}(e,t.x+t.dx*n,t.y+t.dy*n)&&o.push(n)}o.sort((e,t)=>e-t);let l=[];for(let e of o)(!l.length||e-l[l.length-1]>1e-7)&&l.push(e);let r=l[Math.min(i,l.length)-1];void 0!==r&&a.push([t.x,t.y,t.x+t.dx*r,t.y+t.dy*r])}}let u=(e,t,i)=>({id:e,label:t,tones:i,swatch:`conic-gradient(from 210deg, ${i.main} 0 50%, ${i.light} 0 76%, ${i.second} 0 88%, ${i.accent} 0)`}),f=[u("fes","Fes blue",{main:"#1d3f95",second:"#3767bd",deep:"#11265a",light:"#ede5d3",accent:"#1c6a4d"}),u("terracotta","Terracotta",{main:"#ad4a27",second:"#c98a33",deep:"#5e2516",light:"#ebdcc1",accent:"#2a2321"}),u("chefchaouen","Chefchaouen",{main:"#2b4e95",second:"#6c99d1",deep:"#1b3166",light:"#f0eee7",accent:"#a6c4e6"}),u("emerald","Emerald",{main:"#156647",second:"#3d8b63",deep:"#0c4231",light:"#ece3cd",accent:"#c3892b"}),u("mono","Monochrome",{main:"#1a1b22",second:"#4b4b52",deep:"#0e0f13",light:"#efebe3",accent:"#8f8b83"})];function d(e){return f.find(t=>t.id===e)??f[0]}let p=(e,t)=>(e%t+t)%t,x={8:[(e,t,i)=>0===e?0===p(t-i,5)?"second":"main":"light",(e,t,i)=>0===e?"light":0===p(t+i,4)?"deep":"main",(e,t,i,a,o,l)=>1===e?0===l?"main":"light":["accent","second","deep","main","second","main"][l%6],(e,t,i)=>0===e?0===p(t+i,2)?"main":"deep":"light",(e,t,i,a,o)=>0===e?o<.68?"main":o<.9?"second":"accent":o<.86?"light":"second"],12:[e=>["main","second","light","accent"][e],e=>["light","deep","main","accent"][e],(e,t,i,a,o,l)=>0===e?["accent","main","deep"][l%3]:["","second","light","main"][e],(e,t,i)=>0===e?0===p(t-i,3)?"deep":"main":["","light","second","accent"][e],(e,t,i,a,o)=>0===e?o<.7?"main":"second":2===e?"light":1===e&&o<.8?"deep":"accent"],16:[e=>["main","deep","accent","second","light"][e],e=>["light","main","deep","deep","main"][e],(e,t,i,a,o,l)=>0===e?0===l?"accent":0===p(t+i,2)?"main":"deep":["","accent","second","main","light"][e],e=>["deep","second","light","main","light"][e],(e,t,i,a,o)=>0===e?o<.6?"main":"second":4===e?"light":1===e?"deep":2===e?"accent":o<.75?"second":"main"]};function m(e,t,i,a){let o=Math.imul(0|e,0x27d4eb2d)^Math.imul(0|t,0x165667b1)^Math.imul(0|i,0x9e3779b1)^Math.imul(0|a,0x85ebca77);return(((o=Math.imul((o=Math.imul(o^o>>>15,0x2c1b3c6d))^o>>>12,0x297a2d39))^o>>>15)>>>0)/0x100000000}let y=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4;function g(e){let t,[i,a,o]=[parseInt((t=e.replace("#","")).slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255];return[y(i),y(a),y(o)]}function v(e,t){let i=e.pieces.length,a=new Int32Array(i);if(t<0||t>=i)return a;let o=new Float64Array(i).fill(1/0),l=new Uint8Array(i),r=[],n=[],s=(e,t)=>{let i=r.length;for(r.push(e),n.push(t);i>0;){let e=i-1>>1;if(r[e]<=r[i])break;[r[e],r[i]]=[r[i],r[e]],[n[e],n[i]]=[n[i],n[e]],i=e}},h=()=>{let e=n[0],t=r.pop(),i=n.pop();if(r.length){r[0]=t,n[0]=i;let e=0;for(;;){let t=2*e+1,i=t+1,a=e;if(t<r.length&&r[t]<r[a]&&(a=t),i<r.length&&r[i]<r[a]&&(a=i),a===e)break;[r[a],r[e]]=[r[e],r[a]],[n[a],n[e]]=[n[e],n[a]],e=a}}return e};for(o[t]=0,s(0,t);r.length;){let t=h();if(l[t])continue;l[t]=1;let i=e.pieces[t].centre;for(let a of e.neighbours[t]){if(l[a])continue;let r=e.pieces[a].centre,n=o[t]+Math.hypot(r.x-i.x,r.y-i.y);n<o[a]&&(o[a]=n,s(n,a))}}let c=e.pieces[t].centre;for(let t=0;t<i;t++){let i=e.pieces[t].centre,l=Number.isFinite(o[t])?o[t]:Math.hypot(i.x-c.x,i.y-c.y);a[t]=Math.round(l/e.hop)}return a}function w(e,t,i){let a=-1,o=1/0;for(let l of e.pieces){let[e,r,n,s]=l.box;if(t>=e&&t<=n&&i>=r&&i<=s&&function(e,t,i){let a=!1;for(let o=0,l=e.length-1;o<e.length;l=o++){let r=e[o],n=e[l];r.y>i!=n.y>i&&t<(n.x-r.x)*(i-r.y)/(n.y-r.y)+r.x&&(a=!a)}return a}(l.points,t,i))return l.index;let h=Math.hypot(l.centre.x-t,l.centre.y-i);h<o&&(o=h,a=l.index)}return a}var b=e.i(55171);let M=`#version 300 es
layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_center;
layout(location = 2) in vec3 a_edge;
layout(location = 3) in vec4 a_info;

uniform vec2 u_res;

out vec2 v_pos;
out vec2 v_center;
out float v_dist;
flat out vec2 v_normal;
flat out vec4 v_info;

void main() {
  v_pos = a_pos;
  v_center = a_center;
  v_dist = a_edge.x;
  v_normal = a_edge.yz;
  v_info = a_info;
  vec2 clip = a_pos / u_res * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`,_=`#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 v_pos;
in vec2 v_center;
in float v_dist;
flat in vec2 v_normal;
flat in vec4 v_info; // index \xb7 reach \xb7 radius \xb7 shape

uniform sampler2D u_tiles;
uniform vec2 u_res;
uniform float u_time;
uniform float u_grout;       // half the grout line, CSS px
uniform float u_relief;      // how far the glaze stands above the grout, px
uniform vec3 u_light;        // the lamp, CSS px (z toward the viewer)
uniform float u_lightPower;
uniform float u_lightRadius; // falloff distance
uniform float u_lightSize;   // widens the glint (an area light, not a point)
uniform float u_specGain;
uniform vec3 u_key;          // lamp colour (linear)
uniform vec3 u_ambient;      // room light (linear)
uniform vec3 u_groutColor;
uniform vec3 u_body;         // fired clay, where a chip shows it
uniform vec3 u_envTop;
uniform vec3 u_envBottom;
uniform vec3 u_windowColor;
uniform vec4 u_window;       // the window in reflection space: centre xy, half size zw
uniform float u_motion;      // 0 under reduced motion: no rocking
uniform float u_vignette;
uniform float u_exposure;

out vec4 outColor;

const float PI = 3.14159265;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// value noise and its gradient
vec3 noised(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  float k = a - b - c + d;
  return vec3(a + (b - a) * u.x + (c - a) * u.y + k * u.x * u.y, du * (vec2(b - a, c - a) + k * u.yx));
}

float vnoise(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// sparse round specks (pinholes in the glaze)
float speck(vec2 p, float density, float size) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float h = hash12(i + 7.31);
  vec2 c = vec2(hash12(i + 17.1), hash12(i + 43.7)) * 0.6 + 0.2;
  float d = length(f - c);
  return step(1.0 - density, h) * (1.0 - smoothstep(size * 0.45, size, d));
}

// a damped spring from 0 to 1 (ζ 0.75: a hair of overshoot)
float settle(float t) {
  if (t <= 0.0) return 0.0;
  const float z = 0.75;
  const float w = 15.0;
  const float wd = w * 0.6614;
  return 1.0 - exp(-z * w * t) * (cos(wd * t) + (z * w / wd) * sin(wd * t));
}

// a filmic shoulder on luminance (no hue shift), then highlights bleach toward white
vec3 shoulder(vec3 c) {
  const float k = 0.6;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float m = l < k ? l : k + (1.0 - k) * (1.0 - exp(-(l - k) / (1.0 - k)));
  c *= m / max(l, 1e-5);
  float over = max(max(c.r, c.g), c.b) - 1.0;
  return over > 0.0 ? mix(c, vec3(1.0), clamp(over / (1.0 + over), 0.0, 1.0)) : c;
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

void main() {
  int index = int(v_info.x + 0.5);
  ivec2 at = ivec2((index % 256) * 3, index / 256);
  vec4 A = texelFetch(u_tiles, at, 0);
  vec4 B = texelFetch(u_tiles, at + ivec2(1, 0), 0);
  vec4 C = texelFetch(u_tiles, at + ivec2(2, 0), 0);
  float seed = C.z;
  float reach = v_info.y;
  float radius = max(v_info.z, 1.0);

  // --- setting the piece: its glazed face grows from the centre on a spring
  float laid = min(settle(u_time - B.w), 1.03);

  // --- the re-glaze: a wipe across the piece, away from the ripple's origin
  float tf = u_time - A.w;
  vec2 dir = v_center - C.xy;
  float dl = length(dir);
  dir = dl > 0.5 ? dir / dl : vec2(0.0, -1.0);
  float wipe;
  if (C.w > 0.5) {
    wipe = smoothstep(0.0, 0.3, tf);
  } else {
    float s = dot(v_pos - v_center, dir) / radius;
    float f = clamp(tf / 0.36, 0.0, 1.0);
    f = 1.0 - (1.0 - f) * (1.0 - f) * (1.0 - f);
    float front = mix(-1.3, 1.3, f);
    wipe = tf <= 0.0 ? 0.0 : 1.0 - smoothstep(front - 0.16, front + 0.16, s);
  }
  vec3 albedo = mix(A.rgb, B.rgb, wipe);
  // the piece rocks as the new glaze lands, like a tile pressed into its bed
  float rock = tf > 0.0 ? u_motion * 0.14 * exp(-5.0 * tf) * sin(tf * 20.0) : 0.0;

  // --- the cut edge: not quite straight
  float wobble = (vnoise(v_pos * 0.19 + seed * 37.0) - 0.5) * 0.9 + (vnoise(v_pos * 0.77 + 5.0) - 0.5) * 0.32;
  float d = v_dist + wobble;
  float g = u_grout + (1.0 - laid) * (reach + 2.0);
  float aa = max(fwidth(v_dist), 1e-4) * 0.8;
  float mask = smoothstep(g - aa, g + aa, d);

  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 P = vec3(v_pos, 0.0);
  vec3 Lv = u_light - P;
  float dist2 = dot(Lv, Lv);
  float dist = sqrt(dist2);
  vec3 L = Lv / dist;
  // the lamp's pool on the wall: a soft gaussian with a gentle tail
  float hr = length(Lv.xy) / u_lightRadius;
  float fall = u_lightPower * (0.8 * exp(-hr * hr) + 0.2 / (1.0 + hr * hr));

  // --- glaze
  float e = max(d - g, 0.0);
  float bevel = clamp(reach * 0.13, 1.4, 4.2);
  float t = 1.0 - clamp(e / bevel, 0.0, 1.0);
  vec2 nxy = v_normal * (1.5 * t * t);
  float ang = seed * 6.28318;
  nxy += vec2(cos(ang), sin(ang)) * (0.01 + 0.045 * fract(seed * 13.7));
  vec3 und = noised(v_pos / 38.0 + seed * 19.0);
  nxy -= und.yz * 0.014;
  // no face is flat: the glaze domes a little, more on some pieces than
  // others (a dish would focus the lamp across the whole face)
  float cup = 0.012 + 0.05 * fract(seed * 5.31);
  nxy += (v_pos - v_center) / radius * cup;
  nxy += dir * rock;
  vec3 N = normalize(vec3(nxy, 1.0));

  float pool = 1.0 - smoothstep(0.0, bevel * 2.6, e);
  albedo = mix(albedo, pow(albedo, vec3(1.4)) * 0.88, pool * 0.6);
  float cloud = vnoise(v_pos / 12.0 + seed * 7.0) * 0.65 + vnoise(v_pos / 4.6 - seed * 3.0) * 0.35;
  albedo *= 0.9 + 0.2 * cloud;
  float pin = speck(v_pos / 6.0 + seed * 5.0, 0.022, 0.2);
  albedo *= 1.0 - pin * 0.32;
  float chip = smoothstep(0.8, 0.86, vnoise(v_pos * 0.17 + seed * 23.0)) * (1.0 - smoothstep(0.15, 1.0, e));
  albedo = mix(albedo, u_body, chip * 0.7);

  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(N.z, 0.0);
  vec3 H = normalize(L + V);
  float NdotH = max(dot(N, H), 0.0);
  float rough = mix(0.12, 0.55, chip);
  if (tf > 0.0) rough *= mix(0.55, 1.0, smoothstep(0.0, 1.8, tf));
  float a = clamp(rough * rough + u_lightSize / (2.0 * dist), 0.002, 1.0);
  float a2 = a * a;
  float den = NdotH * NdotH * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * den * den);
  float F = 0.045 + 0.955 * pow(1.0 - max(dot(V, H), 0.0), 5.0);
  // and a broad sheen: the lamp's glow on wet-looking glass
  float b2 = 0.045;
  float denB = NdotH * NdotH * (b2 - 1.0) + 1.0;
  float sheen = b2 / (PI * denB * denB);
  vec3 spec = u_key * ((D + sheen * 0.22) * F * 0.25 * u_specGain) * NdotL * fall * (1.0 - chip);

  vec3 R = reflect(-V, N);
  float up = clamp(0.5 - R.y * 0.5, 0.0, 1.0);
  vec3 env = mix(u_envBottom, u_envTop, smoothstep(0.15, 0.85, up));
  vec2 q = R.xy - u_window.xy;
  vec2 qa = abs(q) - u_window.zw;
  float sd = length(max(qa, 0.0)) + min(max(qa.x, qa.y), 0.0);
  float pane = 1.0 - smoothstep(-0.008, 0.022, sd);
  float bars = max(1.0 - smoothstep(0.004, 0.012, abs(q.x)), 1.0 - smoothstep(0.004, 0.012, abs(q.y + u_window.w * 0.2)));
  pane *= 1.0 - 0.7 * bars;
  env += u_windowColor * pane;
  float Fe = (0.045 + 0.955 * pow(1.0 - NdotV, 5.0)) * (1.0 - chip * 0.85);

  vec3 diffuse = albedo * (u_ambient * (0.72 + 0.28 * NdotV) + u_key * NdotL * fall);
  vec3 glaze = diffuse * (1.0 - Fe) + env * Fe + spec;

  // --- grout
  float own = max(g - d, 0.0);
  float other = g + d;
  float sand = vnoise(v_pos * 0.9 + 3.0) * 0.6 + vnoise(v_pos * 2.3) * 0.4;
  vec3 galb = u_groutColor * (0.86 + 0.24 * sand);
  float ao = clamp(1.0 - 0.5 * exp(-own / 1.2) - 0.5 * exp(-other / 1.2), 0.15, 1.0);
  vec2 lxy = u_light.xy - v_pos;
  float lh = max(length(lxy), 1e-3);
  vec2 ldir = lxy / lh;
  float throw = u_relief * lh / max(u_light.z, 1.0);
  float toward = dot(ldir, -v_normal);
  float shade = toward > 0.0
    ? smoothstep(-0.5, 0.5, throw * toward - own)
    : smoothstep(-0.5, 0.5, -throw * toward - other);
  shade *= laid;
  vec3 grout = galb * (u_ambient * ao + u_key * max(L.z, 0.0) * fall * (1.0 - 0.8 * shade) * mix(1.0, ao, 0.6));

  vec3 col = mix(grout, glaze, mask) * u_exposure;

  vec2 uv = v_pos / u_res - 0.5;
  uv.x *= u_res.x / u_res.y;
  col *= 1.0 - u_vignette * smoothstep(0.35, 1.1, length(uv));

  col = toSrgb(shoulder(col));
  col += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`;class k{gl;program;vao;buffer;texture;u;count=0;rows=0;constructor(e){this.gl=e,this.program=(0,b.createProgram)(e,M,_),this.u=(0,b.uniformLocations)(e,this.program);const t=e.createVertexArray(),i=e.createBuffer(),a=e.createTexture();if(!t||!i||!a)throw Error("zellige: could not allocate GL objects");this.vao=t,this.buffer=i,this.texture=a,e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,i);const o=(t,i,a)=>{e.enableVertexAttribArray(t),e.vertexAttribPointer(t,i,e.FLOAT,!1,44,4*a)};o(0,2,0),o(1,2,2),o(2,3,4),o(3,4,7),e.bindVertexArray(null),e.bindTexture(e.TEXTURE_2D,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}setVertices(e,t){let i=this.gl;i.bindBuffer(i.ARRAY_BUFFER,this.buffer),i.bufferData(i.ARRAY_BUFFER,e,i.STATIC_DRAW),this.count=t}setTiles(e,t){let i=this.gl,a=Math.max(1,Math.ceil(t/256)),o=768*a*4,l=e;e.length<o&&(l=new Float32Array(o)).set(e.subarray(0,Math.min(e.length,o))),i.bindTexture(i.TEXTURE_2D,this.texture),i.pixelStorei(i.UNPACK_ALIGNMENT,4),a!==this.rows?(i.texImage2D(i.TEXTURE_2D,0,i.RGBA32F,768,a,0,i.RGBA,i.FLOAT,l,0),this.rows=a):i.texSubImage2D(i.TEXTURE_2D,0,0,0,768,a,i.RGBA,i.FLOAT,l,0)}draw(e){let t=this.gl,{lighting:i}=e,a=Math.hypot(e.width,e.height);if(t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),!this.count)return;t.useProgram(this.program),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.texture);let o=this.u;t.uniform1i(o("u_tiles"),0),t.uniform2f(o("u_res"),e.width,e.height),t.uniform1f(o("u_time"),e.time),t.uniform1f(o("u_grout"),e.grout),t.uniform1f(o("u_relief"),e.relief),t.uniform3f(o("u_light"),e.light[0],e.light[1],e.light[2]),t.uniform1f(o("u_lightPower"),i.lightPower),t.uniform1f(o("u_lightRadius"),i.lightRadius*a),t.uniform1f(o("u_lightSize"),i.lightSize),t.uniform1f(o("u_specGain"),i.specGain),t.uniform3fv(o("u_key"),i.key),t.uniform3fv(o("u_ambient"),i.ambient),t.uniform3fv(o("u_groutColor"),i.groutColor),t.uniform3fv(o("u_body"),i.body),t.uniform3fv(o("u_envTop"),i.envTop),t.uniform3fv(o("u_envBottom"),i.envBottom),t.uniform3fv(o("u_windowColor"),i.windowColor),t.uniform4fv(o("u_window"),i.window),t.uniform1f(o("u_motion"),+!!e.motion),t.uniform1f(o("u_vignette"),i.vignette),t.uniform1f(o("u_exposure"),i.exposure),t.bindVertexArray(this.vao),t.drawArrays(t.TRIANGLES,0,this.count),t.bindVertexArray(null)}dispose(){let e=this.gl;e.deleteProgram(this.program),e.deleteVertexArray(this.vao),e.deleteBuffer(this.buffer),e.deleteTexture(this.texture)}}let T=new Map,z=(e,t,i)=>Math.min(i,Math.max(t,e));class R{mode;fold=8;palette="fes";colouring=0;seed=1;wall=null;tiles=new Float32Array(0);width=0;height=0;busyUntil=0;geometryDirty=!0;tilesDirty=!0;constructor(e){this.mode=e}resize(e,t){return!(e<2||t<2||this.wall&&.5>Math.abs(e-this.width)&&.5>Math.abs(t-this.height))&&(this.width=e,this.height=t,this.rebuild(),!0)}rebuild(){var e;let t,{scale:i,centre:a}=function(e,t,i,a){if("tile"===t)return{scale:i/3,centre:{x:i/2,y:.6*a}};let o=Math.min(i,a);return{scale:8===e?z(o/7.2,44,84):12===e?z(o/2.45,128,236):z(o/2.1,150,276),centre:{x:i/2,y:a/2}}}(this.fold,this.mode,this.width,this.height);this.wall=function(e,{width:t,height:i,scale:a,centre:o,margin:l=0}){let{a:n,b:s}=e,h=n.x*s.y-n.y*s.x,c=(e,t)=>{let i=(e-o.x)/a,l=(t-o.y)/a;return{u:(i*s.y-l*s.x)/h,v:(n.x*l-n.y*i)/h}},u=[c(-l,-l),c(t+l,-l),c(-l,i+l),c(t+l,i+l)],f=Math.floor(Math.min(...u.map(e=>e.u)))-2,d=Math.ceil(Math.max(...u.map(e=>e.u)))+2,p=Math.floor(Math.min(...u.map(e=>e.v)))-2,x=Math.ceil(Math.max(...u.map(e=>e.v)))+2,m=[],y=0;for(let r=f;r<=d;r++)for(let h=p;h<=x;h++){let c=o.x+(r*n.x+h*s.x)*a,u=o.y+(r*n.y+h*s.y)*a;e.pieces.forEach((e,o)=>{let n=e.points.map(e=>({x:c+e.x*a,y:u+e.y*a})),s=1/0,f=1/0,d=-1/0,p=-1/0;for(let e of n)s=Math.min(s,e.x),f=Math.min(f,e.y),d=Math.max(d,e.x),p=Math.max(p,e.y);if(d<-l||p<-l||s>t+l||f>i+l)return;let x={x:c+e.centre.x*a,y:u+e.centre.y*a},g=0,v=0;for(let e=0;e<n.length;e++){let t=n[e],i=n[(e+1)%n.length],a=Math.hypot(i.x-t.x,i.y-t.y);g=Math.max(g,Math.abs((i.x-t.x)*(x.y-t.y)-(i.y-t.y)*(x.x-t.x))/a),v=Math.max(v,Math.hypot(t.x-x.x,t.y-x.y))}m.push({index:m.length,i:r,j:h,k:o,shape:e.shape,centre:x,points:n,reach:g,radius:v,box:[s,f,d,p]}),y+=n.length})}let g=new Float32Array(3*y*11),v=0,w=(e,t,i,a,o,l)=>{g[v++]=e,g[v++]=t,g[v++]=i.centre.x,g[v++]=i.centre.y,g[v++]=a,g[v++]=o,g[v++]=l,g[v++]=i.index,g[v++]=i.reach,g[v++]=i.radius,g[v++]=i.shape};for(let e of m){let{points:t,centre:i}=e,a=r(t)>0;for(let o=0;o<t.length;o++){let l=t[o],r=t[(o+1)%t.length],n=Math.hypot(r.x-l.x,r.y-l.y),s=(r.y-l.y)/n,h=-(r.x-l.x)/n;a||(s=-s,h=-h);let c=Math.abs((r.x-l.x)*(i.y-l.y)-(r.y-l.y)*(i.x-l.x))/n;w(i.x,i.y,e,c,s,h),w(l.x,l.y,e,0,s,h),w(r.x,r.y,e,0,s,h)}}let b=e=>`${Math.round(64*e.x)},${Math.round(64*e.y)}`,M=new Map;for(let e of m)for(let t of e.points){let i=b(t),a=M.get(i);a?a.includes(e.index)||a.push(e.index):M.set(i,[e.index])}let _=m.map(()=>new Set);for(let e of M.values())for(let t of e)for(let i of e)t!==i&&_[t].add(i);let k=_.map(e=>Int32Array.from(e)),T=0,z=0;for(let e of m)for(let t of k[e.index]){let i=m[t];T+=Math.hypot(i.centre.x-e.centre.x,i.centre.y-e.centre.y),z++}return{pieces:m,neighbours:k,vertices:g,vertexCount:3*y,hop:z?T/z:a,origin:o,scale:a}}((e=this.fold,(t=T.get(e))||(t=function(e){let t=function(e){let t,i;if(8===e)return{a:{x:1,y:0},b:{x:0,y:1},cell:e=>(function(e,t){for(let i=0;i<e.length;i++){let a=e[i],o=e[(i+1)%e.length];t.push([a.x,a.y,o.x,o.y])}})(function(e=0){let t=l/8,i=.5*Math.SQRT1_2/Math.cos(t/2),a=[];for(let o=0;o<8;o++){let l=e+o*t;a.push({x:0+.5*Math.cos(l),y:0+.5*Math.sin(l)});let r=l+t/2;a.push({x:0+i*Math.cos(r),y:0+i*Math.sin(r)})}return a}(0),e)};if(12===e){let e,t,i,a;return e={x:1,y:0},t={x:.5,y:Math.sqrt(3)/2},i=1/Math.sqrt(3)-.5,a=60*Math.PI/180,{a:e,b:t,cell:o=>{c(s(0,0,12,.5,0),a,2,o),h(s((e.x+t.x)/3,(e.y+t.y)/3,3,i,Math.PI/2),a,o),h(s((2*e.x+2*t.x)/3,(2*e.y+2*t.y)/3,3,i,-Math.PI/2),a,o)}}}return t=67.5*Math.PI/180,i=10*Math.PI/180,{a:{x:1,y:0},b:{x:0,y:1},cell:e=>{c(s(0,0,16,.5,0),t,2,e);let a={x:.5,y:.5},o=[];for(let[e,t]of[[0,0],[1,0],[1,1],[0,1]])for(let i of s(e,t,16,.5,0))!(Math.hypot(i.x-a.x,i.y-a.y)>=.5)&&(o.some(e=>1e-9>Math.hypot(e.x-i.x,e.y-i.y))||o.push(i));o.sort((e,t)=>Math.atan2(e.y-.5,e.x-.5)-Math.atan2(t.y-.5,t.x-.5)),h(o,i,e,a)}}}(e),{a:i,b:a}=t,o=[],u=[];t.cell(u);for(let e=-2;e<=2;e++)for(let t=-2;t<=2;t++){let l=e*i.x+t*a.x,r=e*i.y+t*a.y;for(let[e,t,i,a]of u)o.push([e+l,t+r,i+l,a+r])}let f=function(e,t=1e-7){let i=e.length,a=e.map(()=>[0,1]),o=e.map(([e,i,a,o])=>[Math.min(e,a)-t,Math.min(i,o)-t,Math.max(e,a)+t,Math.max(i,o)+t]);for(let l=0;l<i;l++){let[r,n,s,h]=e[l],c=s-r,u=h-n,f=o[l];for(let d=l+1;d<i;d++){let i=o[d];if(i[0]>f[2]||i[2]<f[0]||i[1]>f[3]||i[3]<f[1])continue;let[p,x,m,y]=e[d],g=m-p,v=y-x,w=c*v-u*g,b=p-r,M=x-n,_=Math.hypot(c,u),k=Math.hypot(g,v);if(Math.abs(w)<t*_*k){if(Math.abs(b*u-M*c)>t*_)continue;let e=c*c+u*u,i=g*g+v*v,o=(b*c+M*u)/e,f=((m-r)*c+(y-n)*u)/e;o>-t&&o<1+t&&a[l].push(o),f>-t&&f<1+t&&a[l].push(f);let w=((r-p)*g+(n-x)*v)/i,k=((s-p)*g+(h-x)*v)/i;w>-t&&w<1+t&&a[d].push(w),k>-t&&k<1+t&&a[d].push(k);continue}let T=(b*v-M*g)/w,z=(b*u-M*c)/w,R=t/_,A=t/k;T<-R||T>1+R||z<-A||z>1+A||(a[l].push(T),a[d].push(z))}}let l=20*t,r=new Map,n=[],s=[],h=(e,t)=>{let i=Math.round(e/l),a=Math.round(t/l);for(let o=-1;o<=1;o++)for(let h=-1;h<=1;h++){let c=r.get(`${i+o},${a+h}`);if(void 0!==c&&Math.abs(n[c]-e)<=l&&Math.abs(s[c]-t)<=l)return c}let o=n.length;return n.push(e),s.push(t),r.set(`${i},${a}`,o),o},c=new Set,u=new Map,f=(e,t)=>{if(e===t)return;let i=e<t?`${e}:${t}`:`${t}:${e}`;c.has(i)||(c.add(i),u.has(e)||u.set(e,new Set),u.has(t)||u.set(t,new Set),u.get(e).add(t),u.get(t).add(e))};for(let t=0;t<i;t++){let[i,o,l,r]=e[t],n=a[t].map(e=>Math.min(1,Math.max(0,e))).sort((e,t)=>e-t),s=h(i+(l-i)*n[0],o+(r-o)*n[0]);for(let e=1;e<n.length;e++){let t=h(i+(l-i)*n[e],o+(r-o)*n[e]);f(s,t),s=t}}let d=[...u.keys()].filter(e=>u.get(e).size<2);for(;d.length;){let e=d.pop(),t=u.get(e);if(t){for(let i of t){let t=u.get(i);t.delete(e),t.size<2&&d.push(i)}u.delete(e)}}let p=new Map;for(let[e,t]of u){let i=[...t].sort((t,i)=>Math.atan2(s[t]-s[e],n[t]-n[e])-Math.atan2(s[i]-s[e],n[i]-n[e]));p.set(e,i)}let x=new Set,m=[];for(let[e,t]of p)for(let i of t){if(x.has(`${e}>${i}`))continue;let t=[],a=e,o=i,l=0;for(;!x.has(`${a}>${o}`)&&l++<1e4;){x.add(`${a}>${o}`),t.push(a);let e=p.get(o),i=e.indexOf(a),l=e[(i-1+e.length)%e.length];a=o,o=l}let r=0;for(let e=0;e<t.length;e++){let i=t[e],a=t[(e+1)%t.length];r+=n[i]*s[a]-n[a]*s[i]}r>1e-9&&m.push(function(e){let t=[],i=e.length;for(let a=0;a<i;a++){let o=e[(a-1+i)%i],l=e[a],r=e[(a+1)%i];Math.abs((l.x-o.x)*(r.y-l.y)-(l.y-o.y)*(r.x-l.x))>1e-9*Math.max(Math.hypot(l.x-o.x,l.y-o.y)*Math.hypot(r.x-l.x,r.y-l.y),1e-12)&&t.push(l)}return t}(t.map(e=>({x:n[e],y:s[e]}))))}return m}(o),d=i.x*a.y-i.y*a.x,p=[];for(let e of f){let t=n(e),o=(t.x*a.y-t.y*a.x)/d,l=(i.x*t.y-i.y*t.x)/d;o<-.48766||o>=.51234||l<-.48766||l>=.51234||p.push({points:e,centre:t,area:r(e),shape:0})}let x=[],m=p.map(e=>{let t=(e=>{let t=0;for(let i=0;i<e.points.length;i++){let a=e.points[i],o=e.points[(i+1)%e.points.length];t+=Math.hypot(o.x-a.x,o.y-a.y)}return t})(e),i=x.findIndex(i=>i.n===e.points.length&&1e-6>Math.abs(i.area-e.area)&&1e-5>Math.abs(i.perimeter-t));return i<0&&(i=x.push({n:e.points.length,area:e.area,perimeter:t})-1),i}),y=x.map((e,t)=>t).sort((e,t)=>x[t].area-x[e].area);p.forEach((e,t)=>{e.shape=y.indexOf(m[t])});let g=0,v=1/0;for(let e of p){let t=Math.hypot(e.centre.x,e.centre.y);t<v&&(v=t,g=e.shape)}return{fold:e,a:i,b:a,pieces:p,shapes:x.length,star:g}}(e),T.set(e,t)),t),{width:this.width,height:this.height,scale:i,centre:a,margin:8});let o=this.wall.pieces.length;this.tiles=new Float32Array(12*o);let u=this.glazes(this.palette,this.colouring,this.seed);for(let e of this.wall.pieces){let t=12*e.index,i=3*e.index;this.tiles.set([u[i],u[i+1],u[i+2],-1e4],t),this.tiles.set([u[i],u[i+1],u[i+2],-1e4],t+4),this.tiles[t+8]=e.centre.x,this.tiles[t+9]=e.centre.y,this.tiles[t+10]=m(e.i,e.j,e.k,77),this.tiles[t+11]=0}this.geometryDirty=!0,this.tilesDirty=!0}glazes(e,t,i){let a=this.wall,o=new Float32Array(3*a.pieces.length);return!function(e,t,i,a,o,l,r,n){let s=x[t][p(a,5)],h=Object.fromEntries(Object.keys(i.tones).map(e=>[e,g(i.tones[e])]));for(let i of e){let e=m(i.i,i.j,i.k,911),a=function(e,t,i){if(12===e){let e=i/(Math.sqrt(3)/2),a=t-e/2;return Math.round(Math.max(Math.abs(a),Math.abs(e),Math.abs(a+e)))}return Math.round(Math.max(Math.abs(t),Math.abs(i))-.001)}(t,(i.centre.x-r.x)/n,(i.centre.y-r.y)/n),[c,u,f]=h[s(i.shape,i.i,i.j,i.k,e,a)],d=m(i.i,i.j,i.k,o),p=m(i.i,i.j,i.k,o+1),x=m(i.i,i.j,i.k,o+2),y=x>.95?2.2:1,g=.2126*c+.7152*u+.0722*f,v=g>.45,w=1+(d-.5)*(v?.07:.3)*y,b=(p-.5)*(v?.05:.08)*y,M=1+(x-.5)*.2,_=g+(c-g)*M,k=g+(u-g)*M,T=g+(f-g)*M;_=Math.max(0,_*w*(1+b)),k=Math.max(0,k*w*(1+.25*b)),T=Math.max(0,T*w*(1-.9*b));let z=3*i.index+0;l[z]=Math.min(_,1),l[z+1]=Math.min(k,1),l[z+2]=Math.min(T,1)}}(a.pieces,this.fold,d(e),t,i,o,a.origin,a.scale),o}setFold(e,t,i){return e===this.fold&&this.wall?[]:(this.fold=e,this.width)?(this.rebuild(),this.lay(t,i)):[]}lay(e,t,i=0){let a=this.wall;if(!a)return[];if(!t){for(let e=0;e<a.pieces.length;e++)this.tiles[12*e+7]=-1e4;return this.tilesDirty=!0,[]}let o=w(a,this.width/2,this.height/2),l=v(a,o),r=a.hop/1300,n=0;for(let t of a.pieces){let a=(m(t.i,t.j,t.k,5)-.5)*r*.8,o=e+i+l[t.index]*r+a;this.tiles[12*t.index+7]=o,n=Math.max(n,o)}return this.busyUntil=Math.max(this.busyUntil,n+1),this.tilesDirty=!0,this.steps(l,r,i)}reglaze(e,t,i,{palette:a,fade:o=!1}={}){let l=this.wall;if(!l)return[];a?this.palette=a:this.colouring=(this.colouring+1)%5,this.seed+=1;let r=this.glazes(this.palette,this.colouring,this.seed),n=o?new Int32Array(l.pieces.length):v(l,w(l,e,t)),s=o?0:l.hop/760,h=i;for(let a of l.pieces){let l=12*a.index,c=3*a.index,u=this.tiles[l+3],f=o?0:(m(a.i,a.j,a.k,this.seed)-.5)*s*.6,d=i+n[a.index]*s+f,p=d;u>i?p=Math.min(u,d):(this.tiles[l]=this.tiles[l+4],this.tiles[l+1]=this.tiles[l+5],this.tiles[l+2]=this.tiles[l+6]),p===d&&(this.tiles[l+8]=e,this.tiles[l+9]=t),this.tiles[l+3]=p,this.tiles[l+4]=r[c],this.tiles[l+5]=r[c+1],this.tiles[l+6]=r[c+2],this.tiles[l+11]=+!!o,h=Math.max(h,p)}return this.busyUntil=Math.max(this.busyUntil,h+2.2),this.tilesDirty=!0,o?[{delay:0,pan:0}]:this.steps(n,s,0)}steps(e,t,i){let a=this.wall,o=0;for(let t of e)o=Math.max(o,t);let l=new Float64Array(o+1),r=new Float64Array(o+1);for(let t of a.pieces){let i=e[t.index];t.centre.x<0||t.centre.x>this.width||t.centre.y<0||t.centre.y>this.height||(l[i]+=t.centre.x,r[i]+=1)}let n=Math.max(1,Math.ceil((o+1)/16)),s=[];for(let e=0;e<=o;e+=n)r[e]&&s.push({delay:i+e*t,pan:l[e]/r[e]/this.width*1.4-.7});return s}}var A=e.i(16442);function E(){if((0,A.isMuted)())return null;let e=(0,A.ensureAudio)();return e&&"closed"!==e.ctx.state?e:null}function S(e,t,i){if("function"!=typeof e.createStereoPanner)return t;let a=e.createStereoPanner();return a.pan.value=Math.max(-1,Math.min(1,i)),a.connect(t),a}function C(e,t,i,a,o){let{ctx:l,output:r}=e,n=S(l,r,o);for(let[e,o,r]of[[1,1,.16],[2.76,.42,.075],[5.4,.2,.035]]){let s=l.createOscillator();s.type="sine",s.frequency.value=i*e*(1+(Math.random()-.5)*.006);let h=l.createGain();h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(a*o,t+.0015),h.gain.exponentialRampToValueAtTime(1e-4,t+4*r),s.connect(h).connect(n),s.start(t),s.stop(t+4*r+.02)}let s=l.createBufferSource();s.buffer=(0,A.noiseBuffer)(l,.25);let h=l.createBiquadFilter();h.type="bandpass",h.frequency.value=Math.min(9e3,2.1*i),h.Q.value=1.4;let c=l.createGain();c.gain.setValueAtTime(.5*a,t),c.gain.exponentialRampToValueAtTime(1e-4,t+.018),s.connect(h).connect(c).connect(n),s.start(t,.2*Math.random(),.03)}function P(e){let t=E();if(!t)return;let{ctx:i,output:a}=t,o=i.currentTime+.002,l=S(i,a,e),r=i.createOscillator();r.type="sine",r.frequency.setValueAtTime(320,o),r.frequency.exponentialRampToValueAtTime(140,o+.05);let n=i.createGain();n.gain.setValueAtTime(0,o),n.gain.linearRampToValueAtTime(.12,o+.002),n.gain.exponentialRampToValueAtTime(1e-4,o+.09),r.connect(n).connect(l),r.start(o),r.stop(o+.1),C(t,o,2300+500*Math.random(),.05,e)}let D={key:[1,.96,.9],ambient:[.52,.52,.55],lightPower:.95,lightRadius:.36,lightSize:20,specGain:.85,groutColor:g("#cfc6b4"),body:g("#a8775e"),envTop:[.46,.48,.52],envBottom:[.3,.26,.22],windowColor:[3.6,3.55,3.4],window:[-.07,-.11,.075,.05],vignette:.07,exposure:1},F={key:[1,.79,.56],ambient:[.06,.075,.14],lightPower:1.08,lightRadius:.21,lightSize:16,specGain:.95,groutColor:g("#c9bfad"),body:g("#8f5f47"),envTop:[.025,.035,.08],envBottom:[.012,.01,.018],windowColor:[.3,.4,.75],window:[-.07,-.11,.075,.05],vignette:.32,exposure:1},B=(e,t,i)=>[(0,a.lerp)(e[0],t[0],i),(0,a.lerp)(e[1],t[1],i),(0,a.lerp)(e[2],t[2],i)];function N(e){return e<=0?D:e>=1?F:{key:B(D.key,F.key,e),ambient:B(D.ambient,F.ambient,e),lightPower:(0,a.lerp)(D.lightPower,F.lightPower,e),lightRadius:(0,a.lerp)(D.lightRadius,F.lightRadius,e),lightSize:(0,a.lerp)(D.lightSize,F.lightSize,e),specGain:(0,a.lerp)(D.specGain,F.specGain,e),groutColor:B(D.groutColor,F.groutColor,e),body:B(D.body,F.body,e),envTop:B(D.envTop,F.envTop,e),envBottom:B(D.envBottom,F.envBottom,e),windowColor:B(D.windowColor,F.windowColor,e),window:D.window,vignette:(0,a.lerp)(D.vignette,F.vignette,e),exposure:1}}let j=[{value:8,label:"8"},{value:12,label:"12"},{value:16,label:"16"}],L={8:"Eight-fold: the khatam, star and cross",12:"Twelve-fold rosette",16:"Sixteen-fold rosette"},U=f.map(e=>({value:e.id,label:e.label,swatch:e.swatch})),G=e=>Math.round(255*(e<=.0031308?12.92*e:1.055*e**(1/2.4)-.055));function I({mode:e,engine:a,theme:o}){let l=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=l.current;if(!t)return;let i=()=>{let i=t.getBoundingClientRect(),l=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);t.width=Math.max(1,Math.round(i.width*l)),t.height=Math.max(1,Math.round(i.height*l));let r=t.getContext("2d");if(!r)return;a.resize(i.width,i.height);let n=a.wall;if(!n)return;for(let e of(r.setTransform(l,0,0,l,0,0),r.fillStyle="dark"===o?"#4a463f":"#e4dccb",r.fillRect(0,0,i.width,i.height),r.lineJoin="round",r.strokeStyle=r.fillStyle,r.lineWidth=1.6,n.pieces)){let t=12*e.index+4,i="dark"===o?.55:1;r.fillStyle=`rgb(${G(a.tiles[t]*i)} ${G(a.tiles[t+1]*i)} ${G(a.tiles[t+2]*i)})`,r.beginPath(),e.points.forEach((e,t)=>t?r.lineTo(e.x,e.y):r.moveTo(e.x,e.y)),r.closePath(),r.fill(),r.stroke()}let s=r.createRadialGradient(.34*i.width,.36*i.height,0,.34*i.width,.36*i.height,.6*i.width);s.addColorStop(0,"rgb(255 250 240 / 0.28)"),s.addColorStop(1,"rgb(255 250 240 / 0)"),r.fillStyle=s,r.fillRect(0,0,i.width,i.height)};i();let r=new ResizeObserver(i);return r.observe(t),()=>r.disconnect()},[a,e,o]),(0,t.jsx)("canvas",{ref:l,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A wall of zellige tiles":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function({mode:e,active:l,reducedMotion:r,theme:n}){let s="stage"===e,[h]=(0,i.useState)(()=>{let t=new R(e);return t.colouring=2,t}),c=(0,i.useRef)(null),u=(0,i.useRef)(null),f=(0,i.useRef)(null),p=(0,i.useId)(),[x,m]=(0,i.useState)("fes"),[y,g]=(0,i.useState)(8),[v,w]=(0,i.useState)(s?1.8:1.5),[b,M]=(0,i.useState)(""),[_,T]=(0,i.useState)(!1),z=(0,a.useFinePointer)(),A=(0,i.useRef)({x:new a.Spring(0,{stiffness:70,damping:13}),y:new a.Spring(0,{stiffness:70,damping:13}),z:new a.Spring(0,{stiffness:120,damping:18}),placed:!1,driver:"drift",keyX:0,keyY:0,idleAt:0,night:+("dark"===n),acc:0,clock:0}),S=(0,a.useLatest)({grout:v,reducedMotion:r,theme:n,mode:e}),D=(0,a.useFrame)(l,(e,t)=>{var i;let o,l,r=c.current,n=B.current,u=S.current,d=A.current;d.clock=t;let{width:p,height:x}=G.current;if(!r||!n||p<2||x<2)return;if(!s){if(d.acc+=e,d.acc<1/30-.002)return;e=d.acc,d.acc=0}h.resize(p,x)&&s&&!d.placed&&h.lay(t,!u.reducedMotion,.35),h.geometryDirty&&h.wall&&(r.setVertices(h.wall.vertices,h.wall.vertexCount),h.geometryDirty=!1),h.tilesDirty&&h.wall&&(r.setTiles(h.tiles,h.wall.pieces.length),h.tilesDirty=!1);let m=s?.38*Math.min(p,x)+110:.95*p,y=H.current;if("pointer"===d.driver&&y.inside)o=y.x,l=y.y;else if("keys"===d.driver)o=d.keyX,l=d.keyY;else if(u.reducedMotion)o=.34*p,l=.36*x;else{let e="tile"==(s?"stage":"tile")?{x:.5+.34*Math.sin(.33*t+.4),y:.58+.24*Math.sin(.21*t+1.3)}:{x:.5+.3*Math.sin(.16*t+.6)+.05*Math.sin(.41*t),y:.47+.22*Math.sin(.23*t+1.9)};o=e.x*p,l=e.y*x}let g=m*(y.pressed&&"pointer"===d.driver?.82:1);d.placed||(d.x.set(.34*p),d.y.set(.36*x),d.z.set(g),d.placed=!0),d.x.to(o),d.y.to(l),d.z.to(g),u.reducedMotion&&"drift"===d.driver?(d.x.set(o),d.y.set(l),d.z.set(g)):(d.x.step(e),d.y.step(e),d.z.step(e)),d.night=u.reducedMotion?+("dark"===u.theme):(0,a.damp)(d.night,+("dark"===u.theme),6,e),r.draw({time:t,width:p,height:x,grout:u.grout/2,relief:s?1.5:1.2,light:[d.x.value,d.y.value,d.z.value],motion:!u.reducedMotion,lighting:s?N(d.night):{...i=N(d.night),ambient:[1.12*i.ambient[0],1.12*i.ambient[1],1.12*i.ambient[2]],windowColor:[.55*i.windowColor[0],.55*i.windowColor[1],.55*i.windowColor[2]],vignette:.6*i.vignette}}),f.current&&(f.current.style.transform=`translate(${d.x.value}px, ${d.y.value}px)`);let v="drift"===d.driver&&!u.reducedMotion,w=d.x.settled&&d.y.settled&&d.z.settled,b=.002>Math.abs(d.night-("dark"===u.theme));if(!v&&w&&b&&t>h.busyUntil)return!1}),{canvasRef:F,glRef:B,sizeRef:G,supported:$}=(0,a.useWebGL2)({mode:e,maxDpr:2,attributes:{alpha:!1,antialias:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new k(e)}catch(e){console.error(e);return}return c.current=t,h.geometryDirty=!0,h.tilesDirty=!0,D(),()=>{t?.dispose(),c.current=null}},onResize:()=>D()}),V=e=>G.current.width?e/G.current.width*1.4-.7:0,X=e=>{s&&e.length&&function(e){let t=E();if(!t)return;let i=t.ctx.currentTime+.01,a=2900+400*Math.random();e.forEach((e,o)=>{let l=.11*Math.pow(.84,o);l<.008||(C(t,i+e.delay,a*(.94+.12*Math.random()),l,e.pan),a*=.985)})}(e)},q=(0,i.useCallback)((e,t)=>{X(h.reglaze(e,t,A.current.clock,{fade:S.current.reducedMotion})),T(!0),M(`Re-glazed in ${d(h.palette).label}`),D()},[h,D]),O=(0,i.useRef)({x:0,y:0,t:0}),Y=s?u:F,H=(0,a.usePointer)(Y,{capture:s,onDown:e=>{s&&(O.current={x:e.x,y:e.y,t:performance.now()},A.current.driver="pointer",P(V(e.x)),D())},onMove:e=>{(s||"mouse"===e.type)&&(A.current.driver="pointer",D())},onUp:e=>{s&&(10>Math.hypot(e.x-O.current.x,e.y-O.current.y)&&performance.now()-O.current.t<700&&q(e.x,e.y),"mouse"!==e.type&&(A.current.driver="pointer"),D())},onLeave:()=>{A.current.driver="drift",D()}});return((0,i.useEffect)(()=>{D()},[v,n,r,D]),(0,i.useEffect)(()=>{if(!s)return;let e=u.current;if(!e)return;let t=()=>{"keys"===A.current.driver&&(A.current.driver="drift"),D()};return e.addEventListener("blur",t),()=>e.removeEventListener("blur",t)},[s,D]),!1===$)?(0,t.jsx)(I,{mode:e,engine:h,theme:n}):s?(0,t.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:u,tabIndex:0,role:"application","aria-roledescription":"zellige wall","aria-label":"Zellige wall","aria-describedby":p,onKeyDown:e=>{if(!s||e.altKey||e.ctrlKey||e.metaKey)return;let t=A.current,{width:i,height:a}=G.current;"keys"!==t.driver&&(t.keyX=t.x.value,t.keyY=t.y.value);let o=(e.shiftKey?.18:.06)*Math.max(i,a),l=!0;switch(e.key){case"ArrowLeft":t.keyX=Math.max(0,t.keyX-o);break;case"ArrowRight":t.keyX=Math.min(i,t.keyX+o);break;case"ArrowUp":t.keyY=Math.max(0,t.keyY-o);break;case"ArrowDown":t.keyY=Math.min(a,t.keyY+o);break;case"Enter":case" ":if(e.repeat)break;P(V(t.keyX)),q("keys"===t.driver?t.keyX:t.x.value,"keys"===t.driver?t.keyY:t.y.value);break;default:l=!1}l&&(e.preventDefault(),e.stopPropagation(),e.key.startsWith("Arrow")&&(t.driver="keys"),D())},className:"group/wall absolute inset-0 cursor-crosshair touch-none outline-none [-webkit-tap-highlight-color:transparent]",children:[(0,t.jsx)("canvas",{ref:F,className:"absolute inset-0 block size-full"}),(0,t.jsx)("div",{ref:f,"aria-hidden":"true",className:"pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-200 group-focus-visible/wall:opacity-100",children:(0,t.jsx)("span",{className:"absolute -top-[15px] -left-[15px] size-[30px] rounded-full shadow-[0_0_0_1.5px_var(--cobalt),0_0_0_5px_rgb(255_255_255/0.35)]"})}),(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 shadow-[inset_0_0_0_2px_var(--cobalt)] opacity-0 transition-opacity duration-200 group-focus-visible/wall:opacity-100"})]}),(0,t.jsx)("p",{id:p,className:"sr-only",children:"Move the pointer or use the arrow keys to move the lamp. Click, tap, Enter or Space re-glazes from the lamp."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:b}),(0,t.jsx)(o.StageControls,{placement:"top",children:(0,t.jsx)(o.Tray,{label:"Glaze",children:(0,t.jsx)(o.Swatches,{label:"Glaze",options:U,value:x,onChange:e=>{m(e);let{width:t,height:i}=G.current;X(h.reglaze(t/2,i/2,A.current.clock,{palette:e,fade:S.current.reducedMotion})),M(`Glaze: ${d(e).label}`),D()}})})}),(0,t.jsxs)(o.StageControls,{placement:"bottom",children:[(0,t.jsxs)(o.TrayRow,{children:[(0,t.jsx)(o.Tray,{label:"Pattern",children:(0,t.jsx)(o.Segmented,{label:"Rosette",showLabel:!0,options:j,value:y,onChange:e=>{g(e);let t=h.setFold(e,A.current.clock,!S.current.reducedMotion);X(t.length?t.filter((e,t)=>t%2==0):t),M(L[e]),D()}})}),(0,t.jsxs)(o.Tray,{label:"Grout and sound",children:[(0,t.jsx)(o.Slider,{label:"Grout",value:v,min:.6,max:4,step:.1,width:96,onChange:w,format:e=>e.toFixed(1)}),(0,t.jsx)(o.TrayDivider,{}),(0,t.jsx)(o.MuteButton,{})]})]}),(0,t.jsx)(o.StageHint,{className:_?"opacity-0 transition-opacity duration-700":"transition-opacity duration-700",children:z?"Move to light the glaze · click to re-glaze":"Drag to move the light · tap to re-glaze"})]})]}):(0,t.jsx)("canvas",{ref:F,"aria-hidden":"true",className:"absolute inset-0 block size-full"})}],61480)},91360,function(e){e.n(e.i(61480))}]);