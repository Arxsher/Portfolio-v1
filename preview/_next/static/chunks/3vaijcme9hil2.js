(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,61480,e=>{"use strict";var t=e.i(43476),a=e.i(71645),i=e.i(33209),o=e.i(37047),r=e.i(45219);let l=2*Math.PI;function n(e){let t=0;for(let a=0;a<e.length;a++){let i=e[a],o=e[(a+1)%e.length];t+=i.x*o.y-o.x*i.y}return t/2}function s(e){let t=0,a=0,i=0;for(let o=0;o<e.length;o++){let r=e[o],l=e[(o+1)%e.length],n=r.x*l.y-l.x*r.y;i+=n,t+=(r.x+l.x)*n,a+=(r.y+l.y)*n}return{x:t/(3*i),y:a/(3*i)}}function h(e,t,a,i,o=0){let r=i/Math.cos(Math.PI/a),n=[];for(let i=0;i<a;i++){let s=o+(i-.5)*l/a;n.push({x:e+r*Math.cos(s),y:t+r*Math.sin(s)})}return n}function c(e,t,a,i){let o=e.length,r=i??s(e),l=n(e)>0;for(let i=0;i<o;i++){let n=e[i],s=e[(i+1)%o],h=(n.x+s.x)/2,c=(n.y+s.y)/2,u=Math.hypot(s.x-n.x,s.y-n.y),d=(s.x-n.x)/u,f=(s.y-n.y)/u,p=l?-f:f,x=l?d:-d;for(let[l,u]of[[s,1],[n,-1]]){let m=u*d*Math.cos(t)+p*Math.sin(t),g=u*f*Math.cos(t)+x*Math.sin(t),y=u>0?n:e[(i-1+o)%o],_=u>0?e[(i+2)%o]:s,v=y.x-l.x,b=y.y-l.y,w=_.x-l.x,M=_.y-l.y,k=Math.hypot(v,b),T=Math.hypot(w,M),z=v/k+w/T,R=b/k+M/T;1e-9>Math.hypot(z,R)&&(z=r.x-l.x,R=r.y-l.y);let A=m*R-g*z;if(1e-12>Math.abs(A))continue;let E=((l.x-h)*R-(l.y-c)*z)/A;E<=0||a.push([h,c,h+m*E,c+g*E])}}}function u(e,t,a,i){let o=e.length,r=n(e)>0,l=[];for(let a=0;a<o;a++){let i=e[a],n=e[(a+1)%o],s=(i.x+n.x)/2,h=(i.y+n.y)/2,c=Math.hypot(n.x-i.x,n.y-i.y),u=(n.x-i.x)/c,d=(n.y-i.y)/c,f=r?-d:d,p=r?u:-u;for(let e of[1,-1])l.push({x:s,y:h,dx:e*u*Math.cos(t)+f*Math.sin(t),dy:e*d*Math.cos(t)+p*Math.sin(t)})}for(let t of l){let o=[];for(let a of l){if(a===t)continue;let i=t.dx*a.dy-t.dy*a.dx;if(1e-12>Math.abs(i))continue;let r=a.x-t.x,l=a.y-t.y,n=(r*a.dy-l*a.dx)/i,s=(r*t.dy-l*t.dx)/i;n<=1e-9||s<=1e-9||function(e,t,a){let i=!1;for(let o=0,r=e.length-1;o<e.length;r=o++){let l=e[o],n=e[r];l.y>a!=n.y>a&&t<(n.x-l.x)*(a-l.y)/(n.y-l.y)+l.x&&(i=!i)}return i}(e,t.x+t.dx*n,t.y+t.dy*n)&&o.push(n)}o.sort((e,t)=>e-t);let r=[];for(let e of o)(!r.length||e-r[r.length-1]>1e-7)&&r.push(e);let n=r[Math.min(a,r.length)-1];void 0!==n&&i.push([t.x,t.y,t.x+t.dx*n,t.y+t.dy*n])}}let d=(e,t,a)=>({id:e,label:t,tones:a,swatch:`conic-gradient(from 210deg, ${a.main} 0 50%, ${a.light} 0 76%, ${a.second} 0 88%, ${a.accent} 0)`}),f=[d("fes","Fes blue",{main:"#1d3f95",second:"#3767bd",deep:"#11265a",light:"#ede5d3",accent:"#1c6a4d"}),d("terracotta","Terracotta",{main:"#ad4a27",second:"#c98a33",deep:"#5e2516",light:"#ebdcc1",accent:"#2a2321"}),d("chefchaouen","Chefchaouen",{main:"#4a7cc2",second:"#8db5e2",deep:"#24427f",light:"#f3f1ea",accent:"#c9dcef"}),d("emerald","Emerald",{main:"#156647",second:"#3d8b63",deep:"#0c4231",light:"#ece3cd",accent:"#c3892b"}),d("mono","Monochrome",{main:"#1a1b22",second:"#4b4b52",deep:"#0e0f13",light:"#efebe3",accent:"#8f8b83"})];function p(e){return f.find(t=>t.id===e)??f[0]}let x=(e,t)=>(e%t+t)%t,m={8:[(e,t,a)=>0===e?0===x(t-a,5)?"second":"main":"light",(e,t,a)=>0===e?"light":0===x(t+a,4)?"deep":"main",(e,t,a,i,o,r)=>1===e?0===r?"main":"light":["accent","second","deep","main","second","main"][r%6],(e,t,a)=>0===e?0===x(t+a,2)?"main":"deep":"light",(e,t,a,i,o)=>0===e?o<.68?"main":o<.9?"second":"accent":o<.86?"light":"second"],12:[e=>["main","second","light","accent"][e],e=>["light","deep","main","accent"][e],(e,t,a,i,o,r)=>0===e?["accent","main","deep"][r%3]:["","second","light","main"][e],(e,t,a)=>0===e?0===x(t-a,3)?"deep":"main":["","light","second","accent"][e],(e,t,a,i,o)=>0===e?o<.7?"main":"second":2===e?"light":1===e&&o<.8?"deep":"accent"],16:[e=>["second","deep","accent","main","light"][e],e=>["light","main","deep","deep","main"][e],(e,t,a,i,o,r)=>0===e?0===r?"accent":r%2?"second":"main":["","light","accent","deep","light"][e],(e,t,a)=>0===e?0===x(t+a,2)?"accent":"second":["","main","light","deep","light"][e],(e,t,a,i,o)=>0===e?o<.6?"main":"second":4===e?"light":1===e?"deep":2===e?"accent":o<.75?"second":"main"]};function g(e,t,a,i){let o=Math.imul(0|e,0x27d4eb2d)^Math.imul(0|t,0x165667b1)^Math.imul(0|a,0x9e3779b1)^Math.imul(0|i,0x85ebca77);return(((o=Math.imul((o=Math.imul(o^o>>>15,0x2c1b3c6d))^o>>>12,0x297a2d39))^o>>>15)>>>0)/0x100000000}let y=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4;function _(e){let t,[a,i,o]=[parseInt((t=e.replace("#","")).slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255];return[y(a),y(i),y(o)]}function v(e,t){let a=e.pieces.length,i=new Int32Array(a);if(t<0||t>=a)return i;let o=new Float64Array(a).fill(1/0),r=new Uint8Array(a),l=[],n=[],s=(e,t)=>{let a=l.length;for(l.push(e),n.push(t);a>0;){let e=a-1>>1;if(l[e]<=l[a])break;[l[e],l[a]]=[l[a],l[e]],[n[e],n[a]]=[n[a],n[e]],a=e}},h=()=>{let e=n[0],t=l.pop(),a=n.pop();if(l.length){l[0]=t,n[0]=a;let e=0;for(;;){let t=2*e+1,a=t+1,i=e;if(t<l.length&&l[t]<l[i]&&(i=t),a<l.length&&l[a]<l[i]&&(i=a),i===e)break;[l[i],l[e]]=[l[e],l[i]],[n[i],n[e]]=[n[e],n[i]],e=i}}return e};for(o[t]=0,s(0,t);l.length;){let t=h();if(r[t])continue;r[t]=1;let a=e.pieces[t].centre;for(let i of e.neighbours[t]){if(r[i])continue;let l=e.pieces[i].centre,n=o[t]+Math.hypot(l.x-a.x,l.y-a.y);n<o[i]&&(o[i]=n,s(n,i))}}let c=e.pieces[t].centre;for(let t=0;t<a;t++){let a=e.pieces[t].centre,r=Number.isFinite(o[t])?o[t]:Math.hypot(a.x-c.x,a.y-c.y);i[t]=Math.round(r/e.hop)}return i}function b(e,t,a){let i=-1,o=1/0;for(let r of e.pieces){let[e,l,n,s]=r.box;if(t>=e&&t<=n&&a>=l&&a<=s&&function(e,t,a){let i=!1;for(let o=0,r=e.length-1;o<e.length;r=o++){let l=e[o],n=e[r];l.y>a!=n.y>a&&t<(n.x-l.x)*(a-l.y)/(n.y-l.y)+l.x&&(i=!i)}return i}(r.points,t,a))return r.index;let h=Math.hypot(r.centre.x-t,r.centre.y-a);h<o&&(o=h,i=r.index)}return i}var w=e.i(55171);let M=`#version 300 es
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
`,k=`#version 300 es
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
  // the new glaze lands with a clean edge (kept a pixel wide at least) led
  // by a thin wet bead that catches the light and dries as it crosses
  float s = dot(v_pos - v_center, dir) / radius;
  float edge = max(0.05, fwidth(s));
  float wipe;
  float lip = 0.0;
  float ahead = 0.0;
  if (C.w > 0.5) {
    wipe = smoothstep(0.0, 0.3, tf);
  } else {
    float f = clamp(tf / 0.36, 0.0, 1.0);
    f = 1.0 - (1.0 - f) * (1.0 - f) * (1.0 - f);
    float front = mix(-1.3, 1.3, f);
    ahead = (s - front) / 0.06;
    wipe = tf <= 0.0 ? 0.0 : 1.0 - smoothstep(front - edge, front + edge, s);
    lip = tf <= 0.0 ? 0.0 : exp(-ahead * ahead) * (1.0 - f) * u_motion;
  }
  vec3 albedo = mix(A.rgb, B.rgb, wipe);
  float lum = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
  // white and cream glazes pool and cloud less visibly than the deep ones
  float pale = smoothstep(0.3, 0.7, lum);
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
  // big faces (the sixteen-fold star) are never flat either: the glaze
  // waves more, and more finely, so the window breaks up across them
  // instead of mirroring whole in one face
  float big = smoothstep(45.0, 120.0, radius);
  vec3 und = noised(v_pos / 38.0 + seed * 19.0);
  vec3 und2 = noised(v_pos / 15.0 - seed * 11.0);
  nxy -= und.yz * (0.014 + 0.018 * big) + und2.yz * (0.012 * big);
  // no face is flat: the glaze domes a little, more on some pieces than
  // others (a dish would focus the lamp across the whole face); a big face
  // keeps the curvature of a small one rather than flattening out
  float cup = (0.012 + 0.05 * fract(seed * 5.31)) * mix(1.0, radius / 60.0, big);
  nxy += (v_pos - v_center) / radius * cup;
  nxy += dir * rock;
  // the wet bead's rounded profile: its far side leans ahead, its near side back
  nxy += dir * (ahead * lip * 0.12);
  vec3 N = normalize(vec3(nxy, 1.0));

  float pool = 1.0 - smoothstep(0.0, bevel * 2.6, e);
  albedo = mix(albedo, pow(albedo, vec3(1.4)) * 0.88, pool * mix(0.6, 0.32, pale));
  float cloud = vnoise(v_pos / 12.0 + seed * 7.0) * 0.65 + vnoise(v_pos / 4.6 - seed * 3.0) * 0.35;
  albedo *= 1.0 + (cloud - 0.5) * mix(0.2, 0.11, pale);
  albedo *= 1.0 - 0.18 * lip;
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
  rough *= 1.0 - 0.6 * lip;
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
  // on a big face the window would be a picture, not a glint: let it go soft and faint
  pane *= 1.0 - 0.6 * big;
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
`;class T{gl;program;vao;buffer;texture;u;count=0;rows=0;constructor(e){this.gl=e,this.program=(0,w.createProgram)(e,M,k),this.u=(0,w.uniformLocations)(e,this.program);const t=e.createVertexArray(),a=e.createBuffer(),i=e.createTexture();if(!t||!a||!i)throw Error("zellige: could not allocate GL objects");this.vao=t,this.buffer=a,this.texture=i,e.bindVertexArray(t),e.bindBuffer(e.ARRAY_BUFFER,a);const o=(t,a,i)=>{e.enableVertexAttribArray(t),e.vertexAttribPointer(t,a,e.FLOAT,!1,44,4*i)};o(0,2,0),o(1,2,2),o(2,3,4),o(3,4,7),e.bindVertexArray(null),e.bindTexture(e.TEXTURE_2D,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}setVertices(e,t){let a=this.gl;a.bindBuffer(a.ARRAY_BUFFER,this.buffer),a.bufferData(a.ARRAY_BUFFER,e,a.STATIC_DRAW),this.count=t}setTiles(e,t){let a=this.gl,i=Math.max(1,Math.ceil(t/256)),o=768*i*4,r=e;e.length<o&&(r=new Float32Array(o)).set(e.subarray(0,Math.min(e.length,o))),a.bindTexture(a.TEXTURE_2D,this.texture),a.pixelStorei(a.UNPACK_ALIGNMENT,4),i!==this.rows?(a.texImage2D(a.TEXTURE_2D,0,a.RGBA32F,768,i,0,a.RGBA,a.FLOAT,r,0),this.rows=i):a.texSubImage2D(a.TEXTURE_2D,0,0,0,768,i,a.RGBA,a.FLOAT,r,0)}draw(e){let t=this.gl,{lighting:a}=e,i=Math.hypot(e.width,e.height);if(t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),!this.count)return;t.useProgram(this.program),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.texture);let o=this.u;t.uniform1i(o("u_tiles"),0),t.uniform2f(o("u_res"),e.width,e.height),t.uniform1f(o("u_time"),e.time),t.uniform1f(o("u_grout"),e.grout),t.uniform1f(o("u_relief"),e.relief),t.uniform3f(o("u_light"),e.light[0],e.light[1],e.light[2]),t.uniform1f(o("u_lightPower"),a.lightPower),t.uniform1f(o("u_lightRadius"),a.lightRadius*i),t.uniform1f(o("u_lightSize"),a.lightSize),t.uniform1f(o("u_specGain"),a.specGain),this.v3("u_key",a.key),this.v3("u_ambient",a.ambient),this.v3("u_groutColor",a.groutColor),this.v3("u_body",a.body),this.v3("u_envTop",a.envTop),this.v3("u_envBottom",a.envBottom),this.v3("u_windowColor",a.windowColor),t.uniform4f(o("u_window"),a.window[0],a.window[1],a.window[2],a.window[3]),t.uniform1f(o("u_motion"),+!!e.motion),t.uniform1f(o("u_vignette"),a.vignette),t.uniform1f(o("u_exposure"),a.exposure),t.bindVertexArray(this.vao),t.drawArrays(t.TRIANGLES,0,this.count),t.bindVertexArray(null)}v3(e,t){this.gl.uniform3f(this.u(e),t[0],t[1],t[2])}dispose(){let e=this.gl;e.deleteProgram(this.program),e.deleteVertexArray(this.vao),e.deleteBuffer(this.buffer),e.deleteTexture(this.texture)}}let z=new Map,R=(e,t,a)=>Math.min(a,Math.max(t,e));class A{mode;fold=8;palette="fes";colouring=0;seed=1;wall=null;tiles=new Float32Array(0);width=0;height=0;busyUntil=0;geometryDirty=!0;tilesDirty=!0;constructor(e){this.mode=e}resize(e,t){return!(e<2||t<2||this.wall&&.5>Math.abs(e-this.width)&&.5>Math.abs(t-this.height))&&(this.width=e,this.height=t,this.rebuild(),!0)}rebuild(){var e;let t,{scale:a,centre:i}=function(e,t,a,i){if("tile"===t)return{scale:a/3.3,centre:{x:a/2,y:i/2}};let o=Math.min(a,i);return{scale:8===e?R(o/7.2,44,84):12===e?R(o/2.45,128,236):R(o/3.2,110,190),centre:{x:a/2,y:i/2}}}(this.fold,this.mode,this.width,this.height);this.wall=function(e,{width:t,height:a,scale:i,centre:o,margin:r=0}){let{a:l,b:s}=e,h=l.x*s.y-l.y*s.x,c=(e,t)=>{let a=(e-o.x)/i,r=(t-o.y)/i;return{u:(a*s.y-r*s.x)/h,v:(l.x*r-l.y*a)/h}},u=[c(-r,-r),c(t+r,-r),c(-r,a+r),c(t+r,a+r)],d=Math.floor(Math.min(...u.map(e=>e.u)))-2,f=Math.ceil(Math.max(...u.map(e=>e.u)))+2,p=Math.floor(Math.min(...u.map(e=>e.v)))-2,x=Math.ceil(Math.max(...u.map(e=>e.v)))+2,m=[],g=0;for(let n=d;n<=f;n++)for(let h=p;h<=x;h++){let c=o.x+(n*l.x+h*s.x)*i,u=o.y+(n*l.y+h*s.y)*i;e.pieces.forEach((e,o)=>{let l=e.points.map(e=>({x:c+e.x*i,y:u+e.y*i})),s=1/0,d=1/0,f=-1/0,p=-1/0;for(let e of l)s=Math.min(s,e.x),d=Math.min(d,e.y),f=Math.max(f,e.x),p=Math.max(p,e.y);if(f<-r||p<-r||s>t+r||d>a+r)return;let x={x:c+e.centre.x*i,y:u+e.centre.y*i},y=0,_=0;for(let e=0;e<l.length;e++){let t=l[e],a=l[(e+1)%l.length],i=Math.hypot(a.x-t.x,a.y-t.y);y=Math.max(y,Math.abs((a.x-t.x)*(x.y-t.y)-(a.y-t.y)*(x.x-t.x))/i),_=Math.max(_,Math.hypot(t.x-x.x,t.y-x.y))}m.push({index:m.length,i:n,j:h,k:o,shape:e.shape,centre:x,points:l,reach:y,radius:_,box:[s,d,f,p]}),g+=l.length})}let y=new Float32Array(3*g*11),_=0,v=(e,t,a,i,o,r)=>{y[_++]=e,y[_++]=t,y[_++]=a.centre.x,y[_++]=a.centre.y,y[_++]=i,y[_++]=o,y[_++]=r,y[_++]=a.index,y[_++]=a.reach,y[_++]=a.radius,y[_++]=a.shape};for(let e of m){let{points:t,centre:a}=e,i=n(t)>0;for(let o=0;o<t.length;o++){let r=t[o],l=t[(o+1)%t.length],n=Math.hypot(l.x-r.x,l.y-r.y),s=(l.y-r.y)/n,h=-(l.x-r.x)/n;i||(s=-s,h=-h);let c=Math.abs((l.x-r.x)*(a.y-r.y)-(l.y-r.y)*(a.x-r.x))/n;v(a.x,a.y,e,c,s,h),v(r.x,r.y,e,0,s,h),v(l.x,l.y,e,0,s,h)}}let b=e=>`${Math.round(64*e.x)},${Math.round(64*e.y)}`,w=new Map;for(let e of m)for(let t of e.points){let a=b(t),i=w.get(a);i?i.includes(e.index)||i.push(e.index):w.set(a,[e.index])}let M=m.map(()=>new Set);for(let e of w.values())for(let t of e)for(let a of e)t!==a&&M[t].add(a);let k=M.map(e=>Int32Array.from(e)),T=0,z=0;for(let e of m)for(let t of k[e.index]){let a=m[t];T+=Math.hypot(a.centre.x-e.centre.x,a.centre.y-e.centre.y),z++}return{pieces:m,neighbours:k,vertices:y,vertexCount:3*g,hop:z?T/z:i,origin:o,scale:i}}((e=this.fold,(t=z.get(e))||(t=function(e){let t=function(e){let t,a;if(8===e)return{a:{x:1,y:0},b:{x:0,y:1},cell:e=>(function(e,t){for(let a=0;a<e.length;a++){let i=e[a],o=e[(a+1)%e.length];t.push([i.x,i.y,o.x,o.y])}})(function(e=0){let t=l/8,a=.5*Math.SQRT1_2/Math.cos(t/2),i=[];for(let o=0;o<8;o++){let r=e+o*t;i.push({x:0+.5*Math.cos(r),y:0+.5*Math.sin(r)});let l=r+t/2;i.push({x:0+a*Math.cos(l),y:0+a*Math.sin(l)})}return i}(0),e)};if(12===e){let e,t,a,i;return e={x:1,y:0},t={x:.5,y:Math.sqrt(3)/2},a=1/Math.sqrt(3)-.5,i=60*Math.PI/180,{a:e,b:t,cell:o=>{u(h(0,0,12,.5,0),i,2,o),c(h((e.x+t.x)/3,(e.y+t.y)/3,3,a,Math.PI/2),i,o),c(h((2*e.x+2*t.x)/3,(2*e.y+2*t.y)/3,3,a,-Math.PI/2),i,o)}}}return t=67.5*Math.PI/180,a=10*Math.PI/180,{a:{x:1,y:0},b:{x:0,y:1},cell:e=>{u(h(0,0,16,.5,0),t,2,e);let i={x:.5,y:.5},o=[];for(let[e,t]of[[0,0],[1,0],[1,1],[0,1]])for(let a of h(e,t,16,.5,0))!(Math.hypot(a.x-i.x,a.y-i.y)>=.5)&&(o.some(e=>1e-9>Math.hypot(e.x-a.x,e.y-a.y))||o.push(a));o.sort((e,t)=>Math.atan2(e.y-.5,e.x-.5)-Math.atan2(t.y-.5,t.x-.5)),c(o,a,e,i)}}}(e),{a,b:i}=t,o=[],r=[];t.cell(r);for(let e=-2;e<=2;e++)for(let t=-2;t<=2;t++){let l=e*a.x+t*i.x,n=e*a.y+t*i.y;for(let[e,t,a,i]of r)o.push([e+l,t+n,a+l,i+n])}let d=function(e,t=1e-7){let a=e.length,i=e.map(()=>[0,1]),o=e.map(([e,a,i,o])=>[Math.min(e,i)-t,Math.min(a,o)-t,Math.max(e,i)+t,Math.max(a,o)+t]);for(let r=0;r<a;r++){let[l,n,s,h]=e[r],c=s-l,u=h-n,d=o[r];for(let f=r+1;f<a;f++){let a=o[f];if(a[0]>d[2]||a[2]<d[0]||a[1]>d[3]||a[3]<d[1])continue;let[p,x,m,g]=e[f],y=m-p,_=g-x,v=c*_-u*y,b=p-l,w=x-n,M=Math.hypot(c,u),k=Math.hypot(y,_);if(Math.abs(v)<t*M*k){if(Math.abs(b*u-w*c)>t*M)continue;let e=c*c+u*u,a=y*y+_*_,o=(b*c+w*u)/e,d=((m-l)*c+(g-n)*u)/e;o>-t&&o<1+t&&i[r].push(o),d>-t&&d<1+t&&i[r].push(d);let v=((l-p)*y+(n-x)*_)/a,k=((s-p)*y+(h-x)*_)/a;v>-t&&v<1+t&&i[f].push(v),k>-t&&k<1+t&&i[f].push(k);continue}let T=(b*_-w*y)/v,z=(b*u-w*c)/v,R=t/M,A=t/k;T<-R||T>1+R||z<-A||z>1+A||(i[r].push(T),i[f].push(z))}}let r=20*t,l=new Map,n=[],s=[],h=(e,t)=>{let a=Math.round(e/r),i=Math.round(t/r);for(let o=-1;o<=1;o++)for(let h=-1;h<=1;h++){let c=l.get(`${a+o},${i+h}`);if(void 0!==c&&Math.abs(n[c]-e)<=r&&Math.abs(s[c]-t)<=r)return c}let o=n.length;return n.push(e),s.push(t),l.set(`${a},${i}`,o),o},c=new Set,u=new Map,d=(e,t)=>{if(e===t)return;let a=e<t?`${e}:${t}`:`${t}:${e}`;c.has(a)||(c.add(a),u.has(e)||u.set(e,new Set),u.has(t)||u.set(t,new Set),u.get(e).add(t),u.get(t).add(e))};for(let t=0;t<a;t++){let[a,o,r,l]=e[t],n=i[t].map(e=>Math.min(1,Math.max(0,e))).sort((e,t)=>e-t),s=h(a+(r-a)*n[0],o+(l-o)*n[0]);for(let e=1;e<n.length;e++){let t=h(a+(r-a)*n[e],o+(l-o)*n[e]);d(s,t),s=t}}let f=[...u.keys()].filter(e=>u.get(e).size<2);for(;f.length;){let e=f.pop(),t=u.get(e);if(t){for(let a of t){let t=u.get(a);t.delete(e),t.size<2&&f.push(a)}u.delete(e)}}let p=new Map;for(let[e,t]of u){let a=[...t].sort((t,a)=>Math.atan2(s[t]-s[e],n[t]-n[e])-Math.atan2(s[a]-s[e],n[a]-n[e]));p.set(e,a)}let x=new Set,m=[];for(let[e,t]of p)for(let a of t){if(x.has(`${e}>${a}`))continue;let t=[],i=e,o=a,r=0;for(;!x.has(`${i}>${o}`)&&r++<1e4;){x.add(`${i}>${o}`),t.push(i);let e=p.get(o),a=e.indexOf(i),r=e[(a-1+e.length)%e.length];i=o,o=r}let l=0;for(let e=0;e<t.length;e++){let a=t[e],i=t[(e+1)%t.length];l+=n[a]*s[i]-n[i]*s[a]}l>1e-9&&m.push(function(e){let t=[],a=e.length;for(let i=0;i<a;i++){let o=e[(i-1+a)%a],r=e[i],l=e[(i+1)%a];Math.abs((r.x-o.x)*(l.y-r.y)-(r.y-o.y)*(l.x-r.x))>1e-9*Math.max(Math.hypot(r.x-o.x,r.y-o.y)*Math.hypot(l.x-r.x,l.y-r.y),1e-12)&&t.push(r)}return t}(t.map(e=>({x:n[e],y:s[e]}))))}return m}(o),f=a.x*i.y-a.y*i.x,p=[];for(let e of d){let t=s(e),o=(t.x*i.y-t.y*i.x)/f,r=(a.x*t.y-a.y*t.x)/f;o<-.48766||o>=.51234||r<-.48766||r>=.51234||p.push({points:e,centre:t,area:n(e),shape:0})}let x=[],m=p.map(e=>{let t=(e=>{let t=0;for(let a=0;a<e.points.length;a++){let i=e.points[a],o=e.points[(a+1)%e.points.length];t+=Math.hypot(o.x-i.x,o.y-i.y)}return t})(e),a=x.findIndex(a=>a.n===e.points.length&&1e-6>Math.abs(a.area-e.area)&&1e-5>Math.abs(a.perimeter-t));return a<0&&(a=x.push({n:e.points.length,area:e.area,perimeter:t})-1),a}),g=x.map((e,t)=>t).sort((e,t)=>x[t].area-x[e].area);p.forEach((e,t)=>{e.shape=g.indexOf(m[t])});let y=0,_=1/0;for(let e of p){let t=Math.hypot(e.centre.x,e.centre.y);t<_&&(_=t,y=e.shape)}return{fold:e,a,b:i,pieces:p,shapes:x.length,star:y}}(e),z.set(e,t)),t),{width:this.width,height:this.height,scale:a,centre:i,margin:8});let o=this.wall.pieces.length;this.tiles=new Float32Array(12*o);let r=this.glazes(this.palette,this.colouring,this.seed);for(let e of this.wall.pieces){let t=12*e.index,a=3*e.index;this.tiles.set([r[a],r[a+1],r[a+2],-1e4],t),this.tiles.set([r[a],r[a+1],r[a+2],-1e4],t+4),this.tiles[t+8]=e.centre.x,this.tiles[t+9]=e.centre.y,this.tiles[t+10]=g(e.i,e.j,e.k,77),this.tiles[t+11]=0}this.geometryDirty=!0,this.tilesDirty=!0}glazes(e,t,a){let i=this.wall,o=new Float32Array(3*i.pieces.length);return!function(e,t,a,i,o,r,l,n){let s=m[t][x(i,5)],h=Object.fromEntries(Object.keys(a.tones).map(e=>[e,_(a.tones[e])]));for(let a of e){let e=g(a.i,a.j,a.k,911),i=function(e,t,a){if(12===e){let e=a/(Math.sqrt(3)/2),i=t-e/2;return Math.round(Math.max(Math.abs(i),Math.abs(e),Math.abs(i+e)))}return Math.round(Math.max(Math.abs(t),Math.abs(a))-.001)}(t,(a.centre.x-l.x)/n,(a.centre.y-l.y)/n),[c,u,d]=h[s(a.shape,a.i,a.j,a.k,e,i)],f=g(a.i,a.j,a.k,o),p=g(a.i,a.j,a.k,o+1),x=g(a.i,a.j,a.k,o+2),m=x>.95?2.2:1,y=.2126*c+.7152*u+.0722*d,_=y>.45,v=1+(f-.5)*(_?.07:.3)*m,b=(p-.5)*(_?.05:.08)*m,w=1+(x-.5)*.2,M=y+(c-y)*w,k=y+(u-y)*w,T=y+(d-y)*w;M=Math.max(0,M*v*(1+b)),k=Math.max(0,k*v*(1+.25*b)),T=Math.max(0,T*v*(1-.9*b));let z=3*a.index+0;r[z]=Math.min(M,1),r[z+1]=Math.min(k,1),r[z+2]=Math.min(T,1)}}(i.pieces,this.fold,p(e),t,a,o,i.origin,i.scale),o}setFold(e,t,a){return e===this.fold&&this.wall?[]:(this.fold=e,this.width)?(this.rebuild(),this.lay(t,a)):[]}lay(e,t,a=0){let i=this.wall;if(!i)return[];if(!t){for(let e=0;e<i.pieces.length;e++)this.tiles[12*e+7]=-1e4;return this.tilesDirty=!0,[]}let o=b(i,this.width/2,this.height/2),r=v(i,o),l=i.hop/1300,n=0;for(let t of i.pieces){let i=(g(t.i,t.j,t.k,5)-.5)*l*.8,o=e+a+r[t.index]*l+i;this.tiles[12*t.index+7]=o,n=Math.max(n,o)}return this.busyUntil=Math.max(this.busyUntil,n+1),this.tilesDirty=!0,this.steps(r,l,a)}reglaze(e,t,a,{palette:i,fade:o=!1}={}){let r=this.wall;if(!r)return[];i?this.palette=i:this.colouring=(this.colouring+1)%5,this.seed+=1;let l=this.glazes(this.palette,this.colouring,this.seed),n=o?new Int32Array(r.pieces.length):v(r,b(r,e,t)),s=o?0:r.hop/760,h=a;for(let i of r.pieces){let r=12*i.index,c=3*i.index,u=this.tiles[r+3],d=o?0:(g(i.i,i.j,i.k,this.seed)-.5)*s*.6,f=a+n[i.index]*s+d,p=f;u>a?p=Math.min(u,f):(this.tiles[r]=this.tiles[r+4],this.tiles[r+1]=this.tiles[r+5],this.tiles[r+2]=this.tiles[r+6]),p===f&&(this.tiles[r+8]=e,this.tiles[r+9]=t),this.tiles[r+3]=p,this.tiles[r+4]=l[c],this.tiles[r+5]=l[c+1],this.tiles[r+6]=l[c+2],this.tiles[r+11]=+!!o,h=Math.max(h,p)}return this.busyUntil=Math.max(this.busyUntil,h+2.2),this.tilesDirty=!0,o?[{delay:0,pan:0}]:this.steps(n,s,0)}steps(e,t,a){let i=this.wall,o=0;for(let t of e)o=Math.max(o,t);let r=new Float64Array(o+1),l=new Float64Array(o+1);for(let t of i.pieces){let a=e[t.index];t.centre.x<0||t.centre.x>this.width||t.centre.y<0||t.centre.y>this.height||(r[a]+=t.centre.x,l[a]+=1)}let n=Math.max(1,Math.ceil((o+1)/16)),s=[];for(let e=0;e<=o;e+=n)l[e]&&s.push({delay:a+e*t,pan:r[e]/l[e]/this.width*1.4-.7});return s}}var E=e.i(16442);function S(){if((0,E.isMuted)())return null;let e=(0,E.ensureAudio)();return e&&"closed"!==e.ctx.state?e:null}function C(e,t,a){if("function"!=typeof e.createStereoPanner)return t;let i=e.createStereoPanner();return i.pan.value=Math.max(-1,Math.min(1,a)),i.connect(t),i}function P(e,t,a,i,o){let{ctx:r,output:l}=e,n=C(r,l,o);for(let[e,o,l]of[[1,1,.16],[2.76,.42,.075],[5.4,.2,.035]]){let s=r.createOscillator();s.type="sine",s.frequency.value=a*e*(1+(Math.random()-.5)*.006);let h=r.createGain();h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(i*o,t+.0015),h.gain.exponentialRampToValueAtTime(1e-4,t+4*l),s.connect(h).connect(n),s.start(t),s.stop(t+4*l+.02)}let s=r.createBufferSource();s.buffer=(0,E.noiseBuffer)(r,.25);let h=r.createBiquadFilter();h.type="bandpass",h.frequency.value=Math.min(9e3,2.1*a),h.Q.value=1.4;let c=r.createGain();c.gain.setValueAtTime(.5*i,t),c.gain.exponentialRampToValueAtTime(1e-4,t+.018),s.connect(h).connect(c).connect(n),s.start(t,.2*Math.random(),.03)}function j(e){let t=S();if(!t)return;let{ctx:a,output:i}=t,o=a.currentTime+.002,r=C(a,i,e),l=a.createOscillator();l.type="sine",l.frequency.setValueAtTime(320,o),l.frequency.exponentialRampToValueAtTime(140,o+.05);let n=a.createGain();n.gain.setValueAtTime(0,o),n.gain.linearRampToValueAtTime(.12,o+.002),n.gain.exponentialRampToValueAtTime(1e-4,o+.09),l.connect(n).connect(r),l.start(o),l.stop(o+.1),P(t,o,2300+500*Math.random(),.05,e)}let N={key:[1,.96,.9],ambient:[.61,.61,.63],lightPower:.9,lightRadius:.36,lightSize:20,specGain:.85,groutColor:_("#cfc6b4"),body:_("#a8775e"),envTop:[.5,.52,.56],envBottom:[.32,.28,.24],windowColor:[3.6,3.55,3.4],window:[-.07,-.11,.075,.05],vignette:.07,exposure:1},D={key:[1,.79,.56],ambient:[.06,.075,.14],lightPower:1.08,lightRadius:.21,lightSize:16,specGain:.95,groutColor:_("#c9bfad"),body:_("#8f5f47"),envTop:[.025,.035,.08],envBottom:[.012,.01,.018],windowColor:[.3,.4,.75],window:[-.07,-.11,.075,.05],vignette:.32,exposure:1};function B(e,t,a,i,r=1){e[0]=(0,o.lerp)(t[0],a[0],i)*r,e[1]=(0,o.lerp)(t[1],a[1],i)*r,e[2]=(0,o.lerp)(t[2],a[2],i)*r}let F=[8,12,16].map(e=>({value:e,label:`${e}-fold`,icon:(0,t.jsx)("span",{className:"tabular-nums",children:e}),iconOnly:!0})),L={8:"Eight-fold: the khatam, star and cross",12:"Twelve-fold rosette",16:"Sixteen-fold rosette"},G=f.map(e=>({value:e.id,label:e.label,swatch:e.swatch}));function U({children:e}){return(0,t.jsx)("div",{"aria-hidden":"true",className:"absolute inset-x-[13%] top-[11%] bottom-[14%]",children:(0,t.jsx)("div",{className:"absolute inset-0 rounded-[11px] bg-[#e4dccd] p-[3px] shadow-[inset_0_1px_0_rgb(255_255_255/0.85),0_0_0_0.5px_rgb(60_44_28/0.16),0_1px_1.5px_rgb(52_36_24/0.16),0_3px_7px_-1px_rgb(52_36_24/0.12),0_12px_22px_-8px_rgb(52_36_24/0.26)] transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-y-px group-hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.85),0_0_0_0.5px_rgb(60_44_28/0.16),0_2px_3px_rgb(52_36_24/0.15),0_6px_12px_-2px_rgb(52_36_24/0.13),0_16px_28px_-8px_rgb(52_36_24/0.28)] dark:bg-[#3a3631] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_0_0_0.5px_rgb(0_0_0/0.6),0_2px_4px_rgb(0_0_0/0.4),0_10px_22px_-8px_rgb(0_0_0/0.6)] dark:group-hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.09),0_0_0_0.5px_rgb(0_0_0/0.6),0_3px_6px_rgb(0_0_0/0.45),0_14px_28px_-8px_rgb(0_0_0/0.65)]",children:(0,t.jsxs)("div",{className:"relative size-full overflow-hidden rounded-[8px]",children:[e,(0,t.jsx)("span",{className:"pointer-events-none absolute inset-0 rounded-[8px] shadow-[inset_0_1px_1.5px_rgb(40_28_16/0.32),inset_1px_0_1px_rgb(40_28_16/0.14),inset_0_0_0_0.5px_rgb(40_28_16/0.2)] dark:shadow-[inset_0_1px_1.5px_rgb(0_0_0/0.55),inset_1px_0_1px_rgb(0_0_0/0.3),inset_0_0_0_0.5px_rgb(0_0_0/0.4)]"})]})})})}let $=e=>Math.round(255*(e<=.0031308?12.92*e:1.055*e**(1/2.4)-.055));function I({mode:e,engine:i,theme:o}){let r=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=r.current;if(!t)return;let a=()=>{let a=t.getBoundingClientRect(),r=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);t.width=Math.max(1,Math.round(a.width*r)),t.height=Math.max(1,Math.round(a.height*r));let l=t.getContext("2d");if(!l)return;i.resize(a.width,a.height);let n=i.wall;if(!n)return;for(let e of(l.setTransform(r,0,0,r,0,0),l.fillStyle="dark"===o?"#4a463f":"#e4dccb",l.fillRect(0,0,a.width,a.height),l.lineJoin="round",l.strokeStyle=l.fillStyle,l.lineWidth=1.6,n.pieces)){let t=12*e.index+4,a="dark"===o?.55:1;l.fillStyle=`rgb(${$(i.tiles[t]*a)} ${$(i.tiles[t+1]*a)} ${$(i.tiles[t+2]*a)})`,l.beginPath(),e.points.forEach((e,t)=>t?l.lineTo(e.x,e.y):l.moveTo(e.x,e.y)),l.closePath(),l.fill(),l.stroke()}let s=l.createRadialGradient(.34*a.width,.36*a.height,0,.34*a.width,.36*a.height,.6*a.width);s.addColorStop(0,"rgb(255 250 240 / 0.28)"),s.addColorStop(1,"rgb(255 250 240 / 0)"),l.fillStyle=s,l.fillRect(0,0,a.width,a.height)};a();let l=new ResizeObserver(a);return l.observe(t),()=>l.disconnect()},[i,e,o]),(0,t.jsx)("canvas",{ref:r,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A wall of zellige tiles":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function({mode:e,active:l,reducedMotion:n,theme:s}){let h="stage"===e,[c]=(0,a.useState)(()=>{let t=new A(e);return t.colouring=2,t}),u=(0,a.useRef)(null),d=(0,a.useRef)(null),f=(0,a.useRef)(!1),x=(0,a.useRef)(null),m=(0,a.useRef)(null),g=(0,a.useId)(),[y,_]=(0,a.useState)("fes"),[v,b]=(0,a.useState)(8),[w,M]=(0,a.useState)(h?1.8:1.5),[k,z]=(0,a.useState)(""),[R,E]=(0,a.useState)(!1),C=(0,o.useFinePointer)(),$=(0,o.useMediaQuery)("(min-width: 640px)",!0),V=(0,a.useRef)({x:new o.Spring(0,{stiffness:70,damping:13}),y:new o.Spring(0,{stiffness:70,damping:13}),z:new o.Spring(0,{stiffness:120,damping:18}),placed:!1,driver:"drift",keyX:0,keyY:0,night:+("dark"===s),acc:0,clock:0,markX:NaN,markY:NaN}),[X]=(0,a.useState)(()=>{let e=[0,0,0],t={key:[0,0,0],ambient:[0,0,0],lightPower:0,lightRadius:0,lightSize:0,specGain:0,groutColor:[0,0,0],body:[0,0,0],envTop:[0,0,0],envBottom:[0,0,0],windowColor:[0,0,0],window:N.window,vignette:0,exposure:1};return{light:e,lighting:t,frame:{time:0,width:0,height:0,grout:0,relief:0,light:e,motion:!0,lighting:t},aim:{x:0,y:0}}}),q=(0,o.useLatest)({grout:w,reducedMotion:n,theme:s,mode:e}),O=(t,a,i=!1)=>{var r,l,n,s;let d,f,p,x,g,y=u.current,_=K.current,v=q.current,b=V.current;b.clock=a;let{width:w,height:M}=W.current;if(!y||!_||w<2||M<2)return;if(!h){if(b.acc+=t,!i&&b.acc<1/30-.002)return;t=b.acc,b.acc=0}c.resize(w,M)&&h&&!b.placed&&c.lay(a,!v.reducedMotion,.35),c.geometryDirty&&c.wall&&(y.setVertices(c.wall.vertices,c.wall.vertexCount),c.geometryDirty=!1),c.tilesDirty&&c.wall&&(y.setTiles(c.tiles,c.wall.pieces.length),c.tilesDirty=!1);let k=h?.38*Math.min(w,M)+110:.95*w,T=ei.current;if("pointer"===b.driver&&T.inside)d=T.x,f=T.y;else if("keys"===b.driver)d=b.keyX,f=b.keyY;else if(v.reducedMotion)d=.34*w,f=.36*M;else{let t=(r=X.aim,"tile"===e?(r.x=.5+.25*Math.sin(.33*a-1.63),r.y=.515+.165*Math.sin(.21*a-1.75)):(r.x=.5+.3*Math.sin(.16*a+.6)+.05*Math.sin(.41*a),r.y=.47+.22*Math.sin(.23*a+1.9)),r);d=t.x*w,f=t.y*M}let z=k*(T.pressed&&"pointer"===b.driver?.82:1);b.placed||(b.x.set(.34*w),b.y.set(.36*M),b.z.set(z),b.placed=!0),b.x.to(d),b.y.to(f),b.z.to(z),v.reducedMotion&&"drift"===b.driver?(b.x.set(d),b.y.set(f),b.z.set(z)):(b.x.step(t),b.y.step(t),b.z.step(t)),b.night=v.reducedMotion?+("dark"===v.theme):(0,o.damp)(b.night,+("dark"===v.theme),6,t);let R=X.frame;R.time=a,R.width=w,R.height=M,R.grout=v.grout/2,R.relief=h?1.5:1.2,R.motion=!v.reducedMotion,X.light[0]=b.x.value,X.light[1]=b.y.value,X.light[2]=b.z.value,l=X.lighting,n=b.night,p=(s=!h)?(0,o.lerp)(1.12,2,n):1,x=s?(0,o.lerp)(.56,.62,n):1,g=s?(0,o.lerp)(.78,1.05,n):1,B(l.key,N.key,D.key,n),B(l.ambient,N.ambient,D.ambient,n,p),B(l.groutColor,N.groutColor,D.groutColor,n),B(l.body,N.body,D.body,n),B(l.envTop,N.envTop,D.envTop,n),B(l.envBottom,N.envBottom,D.envBottom,n),B(l.windowColor,N.windowColor,D.windowColor,n,s?.55:1),l.lightPower=(0,o.lerp)(N.lightPower,D.lightPower,n)*x,l.lightRadius=(0,o.lerp)(N.lightRadius,D.lightRadius,n)*g,l.lightSize=(0,o.lerp)(N.lightSize,D.lightSize,n),l.specGain=(0,o.lerp)(N.specGain,D.specGain,n),l.vignette=(0,o.lerp)(N.vignette,D.vignette,n)*(s?.6:1),y.draw(R);let A=m.current;A&&(Math.abs(b.markX-b.x.value)>.05||Math.abs(b.markY-b.y.value)>.05)&&(b.markX=b.x.value,b.markY=b.y.value,A.style.transform=`translate(${b.markX}px, ${b.markY}px)`);let E="drift"===b.driver&&!v.reducedMotion,S=b.x.settled&&b.y.settled&&b.z.settled,C=.002>Math.abs(b.night-("dark"===v.theme));if(!E&&S&&C&&a>c.busyUntil)return!1},Y=(0,o.useFrame)(l,(e,t)=>O(e,t)),{canvasRef:H,glRef:K,sizeRef:W,supported:Q}=(0,o.useWebGL2)({mode:e,maxDpr:h?2:1.5,attributes:{alpha:!1,antialias:!0,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new T(e)}catch(e){console.error(e);return}return u.current=t,d.current=e,c.geometryDirty=!0,c.tilesDirty=!0,e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),O(0,V.current.clock,!0),Y(),()=>{t?.dispose(),u.current=null}},onResize:()=>{O(0,V.current.clock,!0),Y()}});(0,a.useEffect)(()=>(f.current=!0,()=>{f.current=!1;let e=d.current;e&&window.setTimeout(()=>{f.current||e.isContextLost()||(e.getExtension("WEBGL_lose_context")?.loseContext(),d.current===e&&(d.current=null))},0)}),[]);let J=e=>W.current.width?e/W.current.width*1.4-.7:0,Z=e=>{h&&e.length&&function(e){let t=S();if(!t)return;let a=t.ctx.currentTime+.01,i=2900+400*Math.random();e.forEach((e,o)=>{let r=.11*Math.pow(.84,o);r<.008||(P(t,a+e.delay,i*(.94+.12*Math.random()),r,e.pan),i*=.985)})}(e)},ee=(0,a.useCallback)((e,t)=>{Z(c.reglaze(e,t,V.current.clock,{fade:q.current.reducedMotion})),E(!0),z(`Re-glazed in ${p(c.palette).label}`),Y()},[c,Y]),et=(0,a.useRef)({x:0,y:0,t:0}),ea=h?x:H,ei=(0,o.usePointer)(ea,{capture:h,onDown:e=>{h&&(et.current={x:e.x,y:e.y,t:performance.now()},V.current.driver="pointer","mouse"===e.type&&j(J(e.x)),Y())},onMove:e=>{(h||"mouse"===e.type)&&(V.current.driver="pointer",Y())},onUp:(e,t)=>{if(!h)return;let a=Math.hypot(e.x-et.current.x,e.y-et.current.y);"pointercancel"!==t.type&&a<10&&performance.now()-et.current.t<700&&("mouse"!==e.type&&j(J(e.x)),ee(e.x,e.y)),"mouse"!==e.type&&(V.current.driver="pointer"),Y()},onLeave:()=>{V.current.driver="drift",Y()}});if((0,a.useEffect)(()=>{Y()},[w,s,n,Y]),(0,a.useEffect)(()=>{if(!h)return;let e=x.current;if(!e)return;let t=()=>{"keys"===V.current.driver&&(V.current.driver="drift"),Y()};return e.addEventListener("blur",t),()=>e.removeEventListener("blur",t)},[h,Y]),!1===Q){let a=(0,t.jsx)(I,{mode:e,engine:c,theme:s});return h?a:(0,t.jsx)(U,{children:a})}if(!h)return(0,t.jsx)(U,{children:(0,t.jsx)("canvas",{ref:H,"aria-hidden":"true",className:"absolute inset-0 block size-full"})});let eo=(0,t.jsx)(r.Swatches,{label:"Glaze",options:G,value:y,onChange:e=>{_(e);let{width:t,height:a}=W.current;Z(c.reglaze(t/2,a/2,V.current.clock,{palette:e,fade:q.current.reducedMotion})),z(`Glaze: ${p(e).label}`),Y()}});return(0,t.jsxs)("div",{className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:x,tabIndex:0,role:"application","aria-roledescription":"zellige wall","aria-label":"Zellige wall","aria-describedby":g,onKeyDown:e=>{if(!h||e.altKey||e.ctrlKey||e.metaKey)return;let t=V.current,{width:a,height:i}=W.current;"keys"!==t.driver&&(t.keyX=t.x.value,t.keyY=t.y.value);let o=(e.shiftKey?.18:.06)*Math.max(a,i),r=!0;switch(e.key){case"ArrowLeft":t.keyX=Math.max(0,t.keyX-o);break;case"ArrowRight":t.keyX=Math.min(a,t.keyX+o);break;case"ArrowUp":t.keyY=Math.max(0,t.keyY-o);break;case"ArrowDown":t.keyY=Math.min(i,t.keyY+o);break;case"Enter":case" ":if(e.repeat)break;j(J(t.keyX)),ee("keys"===t.driver?t.keyX:t.x.value,"keys"===t.driver?t.keyY:t.y.value);break;default:r=!1}r&&(e.preventDefault(),e.stopPropagation(),e.key.startsWith("Arrow")&&(t.driver="keys"),Y())},className:"group/wall absolute inset-0 cursor-crosshair touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]",children:[(0,t.jsx)("canvas",{ref:H,className:"absolute inset-0 block size-full"}),(0,t.jsxs)("div",{ref:m,"aria-hidden":"true",className:"pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-200 group-focus-visible/wall:opacity-100",children:[(0,t.jsx)("span",{className:"absolute -top-[15px] -left-[15px] size-[30px] rounded-full shadow-[0_0_0_1.5px_var(--foreground),0_0_0_4px_color-mix(in_oklab,var(--background)_60%,transparent)]"}),(0,t.jsx)("span",{className:"absolute -top-[2px] -left-[2px] size-[4px] rounded-full bg-primary shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--background)_60%,transparent)]"})]}),(0,t.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-1 rounded-[20px] shadow-[inset_0_0_0_2px_var(--foreground)] opacity-0 transition-opacity duration-200 group-focus-visible/wall:opacity-100"})]}),(0,t.jsx)("p",{id:g,className:"sr-only",children:"Move the pointer or use the arrow keys to move the lamp. Click, tap, Enter or Space re-glazes from the lamp."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:k}),(0,t.jsx)(r.StageControls,{placement:"top",children:$?(0,t.jsx)(r.Tray,{label:"Glaze",children:eo}):(0,t.jsxs)(r.Tray,{label:"Glaze and sound",children:[eo,(0,t.jsx)(r.TrayDivider,{}),(0,t.jsx)(r.MuteButton,{})]})}),(0,t.jsxs)(r.StageControls,{placement:"bottom",children:[(0,t.jsxs)(r.TrayRow,{children:[(0,t.jsx)(r.Tray,{label:"Pattern",children:(0,t.jsx)(r.Segmented,{label:"Rosette",showLabel:$,options:F,value:v,onChange:e=>{b(e);let t=c.setFold(e,V.current.clock,!q.current.reducedMotion);Z(t.length?t.filter((e,t)=>t%2==0):t),z(L[e]),Y()}})}),(0,t.jsxs)(r.Tray,{label:$?"Grout and sound":"Grout",children:[(0,t.jsx)(r.Slider,{label:"Grout",value:w,min:.6,max:4,step:.1,width:$?96:72,showValue:$,onChange:M,format:e=>`${e.toFixed(1)} px`}),$?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.TrayDivider,{}),(0,t.jsx)(r.MuteButton,{})]}):null]})]}),(0,t.jsx)(r.StageHint,{className:(0,i.cn)("rounded-[8px] bg-float/90 px-2 py-1 text-secondary! shadow-lift backdrop-blur-sm transition-opacity duration-700 max-sm:hidden",R&&"opacity-0"),children:C?"Move to light the glaze · click to re-glaze":"Drag sideways to move the light · tap to re-glaze"})]})]})}],61480)},91360,function(e){e.n(e.i(61480))}]);