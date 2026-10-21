(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,95709,e=>{"use strict";let t;var i=e.i(43476),o=e.i(71645),a=e.i(33209),r=e.i(37047),s=e.i(45219),l=e.i(55171);let n=["albedoTop","albedoBottom","ambient","lamp","window","windowFar","wire","bulb","bulbOff","halo","bokehA","bokehB","bokehC","shadowTint","caustic","milk","envLow","envHigh","envWindow","envLamp","rim","plateInk","plateWhite"],h=e=>{let t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(255&t)/255]},c=h("#f2e4d1"),u=h("#ebd8c2"),d={albedoTop:c,albedoBottom:u,ambient:[.95,.89,.79],lamp:[.14,.07,.025],window:[.42,.3,.13],windowFar:[.46,.26,.08],wire:h("#4a3a2f"),bulb:[1.55,1.24,.82],bulbOff:h("#f3e7d6"),halo:[.2,.11,.035],bokehA:h("#fff2da"),bokehB:h("#ffe4ba"),bokehC:h("#ffdcc8"),shadowTint:h("#8a6f5c"),caustic:[.34,.25,.11],milk:h("#fbf6ef"),envLow:h("#a08a78"),envHigh:h("#fffaf2"),envWindow:[.7,.64,.52],envLamp:[.16,.1,.04],rim:[1,.97,.92],plateInk:h("#fcf8f2"),plateWhite:h("#2a221d"),bokehAmount:.64,bokehBlend:1,vignette:.22,wireAlpha:.7,shadow:.24,causticAmount:1,grain:3.4/255},p={albedoTop:c,albedoBottom:u,ambient:[.088,.072,.064],lamp:[1.05,.52,.2],window:[.088,.112,.168],windowFar:[.072,.092,.142],wire:h("#0b0806"),bulb:[2.6*(t=[1.25,.86,.44])[0],2.236,1.1440000000000001],bulbOff:h("#3a2f27"),halo:[.5,.25,.07],bokehA:[1,.66,.3],bokehB:[1,.82,.55],bokehC:[.95,.48,.22],shadowTint:h("#3b2a20"),caustic:[.22,.16,.12],milk:h("#2a211c"),envLow:h("#0c0908"),envHigh:h("#4a382c"),envWindow:[.26,.31,.42],envLamp:[1.1,.6,.24],rim:[.95,.8,.64],plateInk:h("#f4ede4"),plateWhite:h("#1c1613"),bokehAmount:.6,bokehBlend:0,vignette:.34,wireAlpha:.85,shadow:.5,causticAmount:1,grain:3/255};function f(e,t){return(0,r.lerp)(d[e],p[e],t)}let m=[[.86,.17,.085,.13],[.955,.36,.06,.71],[.755,.3,.048,.42],[.67,.12,.036,.9],[.81,.84,.1,.27],[.935,.68,.07,.58],[.69,.96,.062,.36],[.995,.95,.09,.05],[.11,.9,.07,.83],[.265,.975,.05,.19],[.035,.7,.055,.64],[.6,.66,.048,.48],[.405,.73,.036,.95],[.355,.115,.032,.31]],g=[[.85,.13,.13,.13],[.6,.24,.07,.71],[.97,.36,.085,.42],[.79,.84,.15,.27],[.985,.64,.08,.58],[.53,.955,.09,.36],[.1,.87,.1,.83],[.3,.99,.07,.19],[.035,.6,.065,.64],[.68,.7,.06,.48],[.24,.72,.05,.95],[.2,.06,.05,.9]];function v(e,t,i,o){let a="stage"===i&&!o&&e/t>1.15,r=new Float32Array(56),s="tile"===i;if(a){m.forEach(([i,o,a,s],l)=>{r.set([i*e,o*t,a*t,s],4*l)});let i=Math.min(t,640);return{landscape:a,lamp:{x:+e,y:1.08*t,r:.95*t},win:{x:.1*e,y:-(.1*t),w:.4*e,h:.84*t,slope:.36,mullion:.5,transom:.38,bar:.0105*i,softNear:1.2,softFar:.014*i},sun:{x:.052*i,y:.034*i},rain:.023*i,plant:{x:.4*e*.26,y:.84*t,size:.42*i},swags:[{x0:-(.04*e),y0:.085*t,x1:.52*e,y1:.045*t,sag:.215*t,spacing:.068*i,phase:.3,sway:.01*i},{x0:.52*e,y0:.045*t,x1:1.04*e,y1:.15*t,sag:.165*t,spacing:.068*i,phase:.7,sway:.012*i}],bulb:{r:.0058*i,hang:.012*i,halo:.034*i,wire:.42},bokeh:r,shadow:{x:0,y:12,blur:26}}}g.forEach(([i,o,a,s],l)=>{r.set([i*e,o*t,a*e,s],4*l)});let l=Math.min(e,520),n=62*("stage"===i);return{landscape:a,lamp:{x:1.02*e,y:+t,r:.95*e},win:{x:-(.05*e),y:-(.06*t),w:.78*e,h:.68*t,slope:.38,mullion:.52,transom:.4,bar:l*(s?.02:.016),softNear:s?.8:1.1,softFar:.022*l},sun:{x:.07*l,y:.046*l},rain:l*(s?.05:.036),plant:{x:.78*e*.3,y:.68*t,size:.36*l},swags:[{x0:-(.06*e),y0:n+.1*t,x1:.57*e,y1:n+.04*t,sag:.1*t,spacing:l*(s?.1:.085),phase:.3,sway:.012*l},{x0:.57*e,y0:n+.04*t,x1:1.06*e,y1:n+.11*t,sag:.085*t,spacing:l*(s?.1:.085),phase:.6,sway:.014*l}],bulb:{r:l*(s?.011:.0092),hang:.018*l,halo:.05*l,wire:s?.36:.42},bokeh:r,shadow:s?{x:0,y:4.5,blur:10}:{x:0,y:9,blur:20}}}let x=n.map((e,t)=>`#define P_${e.replace(/[A-Z]/g,e=>`_${e}`).toUpperCase()} u_pal[${t}]`).join("\n"),w=`#version 300 es
precision highp float;

uniform vec2 u_res;      // CSS px
uniform float u_dpr;     // device px per CSS px of the target being drawn
uniform vec4 u_dock;     // centre x, y, half width, half height
uniform float u_dockR;   // corner radius
uniform vec4 u_drop;     // centre x, y, radius, smooth-union k
uniform vec3 u_squash;   // stretch axis x, y, stretch (0 = round)
uniform float u_bevelDock;
uniform float u_bevelDrop;
uniform float u_time;    // seconds of ambient motion (frozen under reduced motion)
uniform vec3 u_pal[${n.length}];
${x}

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
`,b=`
uniform float u_ignite;     // seconds since the lights were switched on
uniform vec4 u_lamp;        // x, y, radius, -
uniform vec4 u_win;         // x, y (top-left), width, height
uniform vec4 u_winBars;     // slope, mullion (0..1), transom (0..1), bar half width
uniform vec2 u_winSoft;     // edge softness near the window, far from it
uniform vec2 u_sun;         // the sun's shadow offset
uniform float u_rain;       // raindrop cell
uniform vec4 u_plant;       // the plant on the sill, in window space: base x, y, size, -
uniform vec4 u_swag[2];     // x0, y0, x1, y1
uniform vec4 u_swagB[2];    // sag, bulb spacing, phase, sway
uniform vec4 u_bulb;        // radius, hang, halo radius, wire half width
uniform vec4 u_bokeh[14];  // x, y, radius, seed
uniform vec4 u_look;        // bokeh amount, bokeh blend (0 add .. 1 veil), vignette, wire alpha
uniform vec4 u_shadow;      // offset x, y, blur, opacity
uniform float u_caustic;

float lineAA(float dist, float halfWidth, float px) {
  return 1.0 - smoothstep(halfWidth - px * 0.5, halfWidth + px * 0.5, dist);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

// A bead of water on the window, as its shadow lands: light bent away from
// its rim (a dark ring) and gathered into a bright point. q and c in cells.
float bead(vec2 q, vec2 c, float r) {
  vec2 d = (q - c) / r;
  float l = length(d * vec2(1.0, 0.9));
  float shade = 1.0 - smoothstep(0.55, 1.08, l);
  vec2 dc = d - vec2(0.12, 0.2);
  float core = exp(-dot(dc, dc) * 14.0);
  return 1.0 - 0.42 * shade + 1.25 * core;
}

// The rain on the window glass, at w (CSS px across and down the window).
float rain(vec2 w) {
  float f = 1.0;
  // small beads, one per cell, some cells dry
  vec2 cell = floor(w / u_rain);
  vec2 q = w / u_rain - cell;
  float h = hash12(cell + 17.0);
  if (h > 0.56) {
    vec2 c = vec2(hash12(cell + 3.1), hash12(cell + 7.7)) * 0.5 + 0.25;
    f *= bead(q, c, mix(0.08, 0.17, hash12(cell + 11.3)));
  }
  // fewer, bigger beads
  float big = u_rain * 2.7;
  vec2 cell2 = floor(w / big + 0.37);
  vec2 q2 = w / big + 0.37 - cell2;
  float h2 = hash12(cell2 + 51.0);
  if (h2 > 0.7) {
    vec2 c = vec2(hash12(cell2 + 5.3), hash12(cell2 + 9.1)) * 0.44 + 0.28;
    f *= bead(q2, c, mix(0.1, 0.17, hash12(cell2 + 2.9)));
  }
  // in some columns a drop slides down in fits and starts, leaving a trail
  float cw = u_rain * 3.4;
  float ci = floor(w.x / cw);
  float hc = hash12(vec2(ci, 41.0));
  if (hc > 0.52) {
    float span = u_win.w + u_rain * 8.0;
    float hop = u_rain * 3.0;
    float tt = u_time * mix(0.35, 0.9, hash12(vec2(ci, 7.0))) + hc * 29.0;
    float k = floor(tt);
    float y = (k + smoothstep(0.55, 1.0, fract(tt))) * hop;
    y = mod(y + hc * span, span) - u_rain * 4.0;
    float x = (ci + 0.5 + (hash12(vec2(ci, 3.0)) - 0.5) * 0.4) * cw;
    vec2 d = (w - vec2(x + sin(w.y * 0.05 + hc * 9.0) * u_rain * 0.18, y)) / u_rain;
    f *= bead(d, vec2(0.0), 0.3);
    float trail = (1.0 - smoothstep(0.04, 0.12, abs(d.x))) * smoothstep(0.0, -0.4, d.y) * smoothstep(-14.0, -1.0, d.y);
    f *= 1.0 - 0.16 * trail;
  }
  return f;
}

// The window's light at p: 0..1, and where on the window it is.
float windowLight(vec2 p, out vec2 w, out float across) {
  float slope = u_winBars.x;
  float u = (p.x - u_win.x) / u_win.z;
  float top = u_win.y + slope * (p.x - u_win.x);
  float v = (p.y - top) / u_win.w;
  across = clamp(u, 0.0, 1.0);
  w = vec2(p.x - u_win.x, p.y - top);
  float soft = mix(u_winSoft.x, u_winSoft.y, across);
  float perp = inversesqrt(1.0 + slope * slope);
  float dx = min(p.x - u_win.x, u_win.x + u_win.z - p.x);
  float dy = min(v, 1.0 - v) * u_win.w * perp;
  float m = smoothstep(-soft, soft, dx) * smoothstep(-soft, soft, dy);
  // the bars
  float bm = abs(p.x - (u_win.x + u_winBars.y * u_win.z)) - u_winBars.w;
  float bt = abs(v - u_winBars.z) * u_win.w * perp - u_winBars.w * 0.85;
  m *= smoothstep(-soft, soft, bm) * smoothstep(-soft, soft, bt);
  return m;
}

// A leaf: the intersection of two discs (pointed at both ends), along y.
float sdLeaf(vec2 p, float r, float d) {
  p = abs(p);
  float b = sqrt(r * r - d * d);
  return ((p.y - b) * d > p.x * b) ? length(p - vec2(0.0, b)) : length(p - vec2(-d, 0.0)) - r;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}

// The shadow of a small potted plant on the window sill (0 clear .. 1
// shade): a pot, and broad leaves fanning out on short stems, stirring in
// a draught. w in window space (CSS px across and down the window).
float plantShade(vec2 w) {
  float S = u_plant.z;
  if (S <= 0.0) return 0.0;
  vec2 q = (w - u_plant.xy) / S;
  if (q.y > 0.05 || q.y < -1.3 || abs(q.x) > 1.0) return 0.0;
  // the pot: a little wider at the rim
  float potH = 0.24;
  float potW = mix(0.13, 0.17, clamp(-q.y / potH, 0.0, 1.0));
  float d = max(abs(q.x) - potW, abs(q.y + potH * 0.5) - potH * 0.5);
  d = min(d, max(abs(q.x) - 0.185, abs(q.y + potH + 0.012) - 0.026));
  vec2 base = vec2(0.0, -potH - 0.02);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float h = hash12(vec2(fi, 3.7));
    // fan the stems out, the middle ones tallest
    float side = fi / 7.0 - 0.5;
    float a = side * 2.1 + (h - 0.5) * 0.25;
    a += sin(u_time * (0.5 + h * 0.4) + fi * 1.3) * 0.03;
    float len = mix(0.5, 0.22, abs(side) * 2.0) * (0.8 + 0.4 * h);
    vec2 dir = vec2(sin(a), -cos(a));
    vec2 tip = base + dir * len;
    d = min(d, sdSegment(q, base, tip) - 0.009);
    // a broad leaf from the tip, drooping outward a little more
    float la = a * 1.25 + sign(side) * 0.15;
    float ll = mix(0.3, 0.22, abs(side) * 2.0) * (0.85 + 0.3 * h);
    vec2 lc = tip + vec2(sin(la), -cos(la)) * ll;
    vec2 lq = q - lc;
    lq = vec2(cos(la) * lq.x + sin(la) * lq.y, -sin(la) * lq.x + cos(la) * lq.y);
    // a leaf of length 2 * ll and width about 0.75 * ll
    d = min(d, sdLeaf(lq / ll, 1.0, 0.64) * ll);
  }
  float soft = 0.03;
  return smoothstep(soft, -soft, d);
}

// Inside the window light: the glass's crisp sun shadow.
float sunShadow(vec2 p) {
  float w;
  float ds = glass(p - u_sun, w);
  if (ds > 3.0) return 1.0;
  float inside = smoothstep(1.4, -1.4, ds);
  float bevel = mix(u_bevelDock, u_bevelDrop, w);
  // the rim bends light away from its own shadow's edge, and gathers it a
  // little further in
  float edge = exp(-pow((ds + bevel * 0.4) / (bevel * 0.42), 2.0));
  float focus = exp(-pow((ds + bevel * 1.05) / (bevel * 0.2), 2.0)) * (1.0 - w);
  vec2 cq = p - u_sun - u_drop.xy;
  float spot = exp(-dot(cq, cq) / pow(u_drop.z * 0.26, 2.0)) * w;
  float t = 0.56 - 0.4 * edge + 0.5 * focus + 2.6 * spot;
  return mix(1.0, t, inside);
}

// The fairy lights: light they cast on the wall, light they give off, and
// how much the wire and caps cover.
void strings(vec2 p, float px, inout vec3 glow, inout vec3 emit, inout float cover) {
  // the hook both swags hang from
  cover = max(cover, lineAA(length(p - u_swag[0].zw), u_bulb.x * 0.75, px));
  float first = floor((u_swag[0].z - u_swag[0].x) / u_swagB[0].y);
  for (int s = 0; s < 2; s++) {
    vec4 a = u_swag[s];
    vec4 b = u_swagB[s];
    float fs = float(s);
    float span = a.z - a.x;
    float sag = b.x * (1.0 + 0.035 * sin(u_time * 0.45 + fs * 2.3));
    float sway = sin(u_time * 0.5 + fs * 1.7) * b.w;
    // the wire: a parabola through both ends, its low point swaying
    float t0 = clamp((p.x - a.x) / span, 0.0, 1.0);
    float t = (p.x - a.x - sway * 4.0 * t0 * (1.0 - t0)) / span;
    if (t > 0.0 && t < 1.0) {
      float y = mix(a.y, a.w, t) + sag * 4.0 * t * (1.0 - t);
      float dy = ((a.w - a.y) + sag * 4.0 * (1.0 - 2.0 * t)) / span;
      float d = abs(p.y - y) * inversesqrt(1.0 + dy * dy);
      cover = max(cover, lineAA(d, u_bulb.w, px));
    }
    // the bulbs (this one and its neighbours)
    float sp = b.y;
    float fi = floor((p.x - a.x) / sp - b.z + 0.5);
    for (int k = -1; k <= 1; k++) {
      float i = fi + float(k);
      float bx = a.x + (i + b.z) * sp;
      float tb = (bx - a.x) / span;
      if (tb < 0.0 || tb > 1.0) continue;
      float by = mix(a.y, a.w, tb) + sag * 4.0 * tb * (1.0 - tb);
      bx += sway * 4.0 * tb * (1.0 - tb);
      float h = hash12(vec2(i * 1.7 + 3.0, fs * 13.0 + 1.0));
      // each hangs from the wire and swings a little
      float swing = sin(u_time * (0.8 + h * 0.6) + h * 6.2832) * 0.14;
      vec2 hang = vec2(sin(swing), cos(swing));
      vec2 top = vec2(bx, by);
      vec2 c = top + hang * u_bulb.y;
      vec2 q = p - c;
      float r = u_bulb.x;
      // switched on one after another along the string, with a blink
      float order = fs * first + i;
      float tOn = 0.35 + order * 0.034 + h * 0.03;
      float on = smoothstep(tOn, tOn + 0.06, u_ignite);
      on *= 1.0 - 0.65 * exp(-pow((u_ignite - tOn - 0.13) * 22.0, 2.0));
      // and then breathe, each at its own pace
      on *= 0.86 + 0.14 * sin(u_time * (0.7 + h * 1.4) + h * 40.0);
      // the cap: a short dark stem from the wire to the bulb
      vec2 pa = p - top;
      vec2 ba = (c - hang * r * 0.8) - top;
      float hseg = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
      float stem = length(pa - ba * hseg);
      cover = max(cover, lineAA(stem, max(r * 0.42, 0.5), px));
      // the bulb: a small glass drop, hot in its core
      vec2 bq = vec2(dot(q, vec2(hang.y, -hang.x)), dot(q, hang));
      float e = length(bq / vec2(r * 0.8, r * 1.05));
      float body = 1.0 - smoothstep(1.0 - px / r, 1.0 + px / r, e);
      vec2 cq = bq - vec2(0.0, r * 0.15);
      float core = exp(-dot(cq, cq) / (r * r * 0.35));
      emit += mix(P_BULB_OFF * 0.9, P_BULB * (0.55 + 0.45 * core), on) * body;
      // a little bloom around it, and the light it throws on the wall
      emit += P_BULB * on * 0.14 * exp(-dot(q, q) / (r * r * 7.0));
      glow += P_HALO * on * exp(-dot(q, q) / (u_bulb.z * u_bulb.z));
    }
  }
}

// The near string, out of focus: rgb is light, a is coverage.
vec4 bokeh(vec2 p) {
  vec4 acc = vec4(0.0);
  vec2 mid = u_res * 0.5;
  float reach = length(u_res) * 0.5;
  for (int i = 0; i < 14; i++) {
    vec4 b = u_bokeh[i];
    if (b.z <= 0.0) continue;
    float s = b.w;
    vec2 c = b.xy + vec2(sin(u_time * (0.11 + 0.08 * fract(s * 7.13)) + s * 6.2832),
                         cos(u_time * (0.09 + 0.06 * fract(s * 3.71)) + s * 4.1)) * b.z * 0.16;
    float r = b.z * (1.0 + 0.035 * sin(u_time * 0.3 + s * 9.0));
    vec2 d = p - c;
    if (dot(d, d) > r * r * 1.35) continue;
    float dist = length(d) - r;
    // toward the frame's edges the disc is cut by the lens barrel: a cat's eye
    vec2 away = c - mid;
    float off = smoothstep(0.4, 1.0, length(away) / reach);
    vec2 dir = away / max(length(away), 1.0);
    float cut = length(d + dir * r * 0.42 * off) - r;
    dist = max(dist, cut);
    float soft = max(1.1, r * 0.075);
    float disc = smoothstep(soft, -soft, dist);
    // nearly flat, a little brighter toward the edge, with a faint rim
    float fill = 0.84 + 0.16 * smoothstep(-r * 0.8, 0.0, dist);
    float rim = exp(-pow((dist + soft * 1.4) / (soft * 1.3), 2.0));
    vec3 col = mix(mix(P_BOKEH_A, P_BOKEH_B, fract(s * 3.3)), P_BOKEH_C, step(0.72, fract(s * 5.9)));
    float on = smoothstep(0.0, 0.7, u_ignite - 0.7 - fract(s * 11.3) * 1.1);
    float breathe = 0.88 + 0.12 * sin(u_time * (0.35 + 0.5 * fract(s * 2.9)) + s * 20.0);
    // (a veil of light has no bright rim: only added light shows one)
    float a = (disc * fill + rim * 0.14 * (1.0 - u_look.y)) * on * breathe * (0.45 + 0.55 * fract(s * 13.7));
    acc += vec4(col * a, a);
  }
  return acc * u_look.x;
}

// selfD: the glass's distance field at p. Under the glass itself its soft
// shadow is faint (light goes through it); it shows where it falls beside it.
vec3 sceneColor(vec2 p, float px, float selfD) {
  vec2 n = p / u_res;
  // the plaster
  vec3 albedo = mix(P_ALBEDO_TOP, P_ALBEDO_BOTTOM, smoothstep(0.0, 1.0, n.y));
  float tex = vnoise(p * 0.035) * 0.6 + vnoise(p * 0.19 + 7.0) * 0.4;
  albedo *= 0.975 + 0.05 * tex;

  // room light: ambient and the lamp
  vec3 light = P_AMBIENT;
  vec2 lq = (p - u_lamp.xy) / u_lamp.z;
  float l2 = dot(lq, lq);
  light += P_LAMP * (1.0 / (1.0 + l2 * 4.0)) * (1.0 - smoothstep(0.6, 2.2, l2));

  // the glass's soft shadow in it: a wide drop plus a tight contact shade
  float ds = glass(p - u_shadow.xy);
  float drop = 1.0 - smoothstep(-u_shadow.z * 0.45, u_shadow.z, ds);
  float dc = glass(p - u_shadow.xy * 0.22);
  float contact = 1.0 - smoothstep(-1.0, u_shadow.z * 0.22, dc);
  float beside = smoothstep(-8.0, 2.0, selfD);
  float shade = clamp((drop + contact * 0.45) * u_shadow.w * mix(0.25, 1.0, beside), 0.0, 1.0);
  light *= mix(vec3(1.0), P_SHADOW_TINT, shade);

  // the window, with the rain on it and the glass in its way
  vec2 w;
  float across;
  float win = windowLight(p, w, across);
  vec3 sun = mix(P_WINDOW, P_WINDOW_FAR, across);
  if (win > 0.001) {
    light += sun * win * rain(w) * sunShadow(p) * (1.0 - 0.82 * plantShade(w));
  }
  // and a little of it bounced around the patch
  float spillX = smoothstep(-u_win.z * 0.35, u_win.z * 0.25, min(p.x - u_win.x, u_win.x + u_win.z - p.x));
  float spillY = smoothstep(-u_win.w * 0.3, u_win.w * 0.3, min(w.y, u_win.w - w.y));
  light += sun * spillX * spillY * 0.12;

  // the fairy lights
  vec3 glow = vec3(0.0);
  vec3 emit = vec3(0.0);
  float cover = 0.0;
  strings(p, px, glow, emit, cover);
  light += glow;

  vec3 col = albedo * light;
  // the droplet's soft caustic in the room light
  vec2 cp = p - (u_drop.xy + u_shadow.xy * 1.15);
  float spot = exp(-dot(cp, cp) / pow(u_drop.z * 0.42, 2.0));
  col += spot * P_CAUSTIC * u_caustic * (1.0 - drop * 0.4) * mix(0.2, 1.0, beside);

  // a soft vignette
  vec2 vq = (n - 0.5) * vec2(1.0, 0.9);
  col *= 1.0 - u_look.z * smoothstep(0.2, 0.85, length(vq) * 1.25);

  col = mix(col, P_WIRE, cover * u_look.w);
  col += emit;

  vec4 bk = bokeh(p);
  col = col * (1.0 - min(bk.a, 1.0) * u_look.y) + bk.rgb;
  return col;
}
`,y=`#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,_=`${w}
${b}
out vec4 outColor;

void main() {
  vec2 p = fragPos();
  outColor = vec4(sceneColor(p, 1.0 / u_dpr, glass(p)), 1.0);
}
`,k=`${w}
uniform sampler2D u_scene;
uniform vec2 u_px;         // canvas size in device px
uniform float u_refract;   // 0..1, the slider
uniform float u_frost;     // 0..1, the slider
uniform vec4 u_tint;       // rgb, strength
uniform vec4 u_pill;       // selection: x, y, half w, half h
uniform float u_pillAmt;
uniform vec4 u_hover;      // x, y, radius, strength
uniform vec4 u_ripples[4]; // x, y, age (s), amplitude
uniform vec3 u_pointer;    // x, y, strength (only while hovering near the glass)
uniform float u_dark;      // 0 light .. 1 dark
uniform float u_lod;       // mip levels available - 1
uniform vec4 u_icons;      // first icon x, row y, pitch, count
uniform vec4 u_plate;      // radius, strength, tone (0: ink icons, 1: white icons), -
uniform vec4 u_envWin;     // the window in the reflection: centre (R.xy), half size
uniform float u_grain;
uniform float u_grainSeed;
uniform float u_hdr;       // 1 when the scene kept its extra light (half float)

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

// The scene through the glass. Clear glass reads the mips straight
// (trilinear); frosted glass uses the cubic filter, blended in over half a
// level so moving the slider never shows a step.
vec3 sceneTex(vec2 p, float lod) {
  vec2 uv = p / u_res;
  uv.y = 1.0 - uv.y;
  uv = clamp(uv, vec2(0.0005), vec2(0.9995));
  if (lod < 1.0) return textureLod(u_scene, uv, lod).rgb;
  float l0 = floor(lod);
  vec3 cubic = mix(bicubicLevel(uv, l0), bicubicLevel(uv, l0 + 1.0), lod - l0);
  if (lod < 1.5) return mix(textureLod(u_scene, uv, lod).rgb, cubic, (lod - 1.0) * 2.0);
  return cubic;
}

// The scene as drawn, at this very pixel.
vec3 sceneHere() {
  return textureLod(u_scene, gl_FragCoord.xy / u_px, 0.0).rgb;
}

// Identity up to the knee, then a soft shoulder to 1: the bulbs' and the
// sun's extra light turns into a white-hot core instead of clipping.
vec3 shoulder(vec3 c) {
  const float k = 0.8;
  vec3 over = max(c - k, 0.0);
  return min(c, vec3(k)) + (1.0 - k) * (1.0 - exp(-over / (1.0 - k)));
}

// Film grain, a touch stronger in the mid tones. (An 8-bit scene has
// already lost its extra light, so it skips the shoulder.)
vec3 finish(vec3 c) {
  c = max(c, 0.0);
  c = u_hdr > 0.5 ? shoulder(c) : min(c, 1.0);
  float y = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float g = hash12(gl_FragCoord.xy + u_grainSeed) - 0.5;
  g += hash12(gl_FragCoord.xy * 1.37 + u_grainSeed + 19.0) - 0.5;
  return c + g * u_grain * (0.55 + 0.9 * y * (1.0 - y));
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

float sdPill(vec2 q) {
  return sdRoundBox(q, u_pill.zw, min(u_pill.z, u_pill.w));
}

void main() {
  vec2 p = fragPos();
  float px = 1.0 / u_dpr;

  float wDrop;
  float d = glass(p, wDrop);
  if (d > px) {
    outColor = vec4(finish(sceneHere()), 1.0);
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
  float dock = 1.0 - wDrop;

  // the selected tab is a shallow lens of its own inside the bar
  vec2 pq = p - u_pill.xy;
  float dp = sdPill(pq);
  float pillOn = u_pillAmt * dock;
  float pillMask = smoothstep(px, -px, dp) * pillOn;
  vec2 pg = vec2(sdPill(pq + vec2(e, 0.0)) - sdPill(pq - vec2(e, 0.0)), sdPill(pq + vec2(0.0, e)) - sdPill(pq - vec2(0.0, e)));
  pg = length(pg) > 1e-5 ? normalize(pg) : vec2(0.0);
  float ps = 1.0 - clamp(-dp / max(u_pill.w * 0.5, 1.0), 0.0, 1.0);
  vec2 pillTilt = pg * (ps / max(sqrt(max(1.0 - ps * ps, 0.0)), 0.3)) * 0.2 * pillMask;

  float strength = mix(0.25, 1.35, u_refract);
  vec2 tilt = g * slope * strength + rippleTilt(p) * (1.0 - wDrop * 0.6) + pillTilt;
  vec3 n = normalize(vec3(tilt, 1.0));

  // refraction. The rim draws in what lies just beyond it; the dock keeps
  // that to a thin sliver, the droplet bends it further.
  float thick = bevel * (0.45 + 0.55 * height) * mix(0.5, 1.25, u_refract);
  thick = min(thick, bevel * mix(0.6, 1.3, wDrop));
  float maxShift = bevel * mix(0.75, 1.2, wDrop);
  // the droplet magnifies what lies under its flat middle, like a lens
  vec2 mag = -(p - u_drop.xy) * (0.1 + 0.2 * u_refract) * wDrop * height;
  // frost: the dock reads blurrier mips; the droplet stays clear unless frosted
  float lod = (u_frost * 4.4 + height * (0.45 + 1.4 * u_frost)) * (1.0 - 0.85 * wDrop) + (1.0 - height) * 0.35 * dock;
  lod = min(u_lod - 1.0, lod);

  // dispersion: stronger in the clear droplet, where it shows
  float disp = 0.045 * (0.35 + u_refract) * (1.0 + 1.4 * wDrop);
  vec3 col = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float f = float(i) / 5.0;
    float eta = 1.0 / (1.5 + (f - 0.5) * disp * 2.0);
    vec3 r = refract(vec3(0.0, 0.0, -1.0), n, eta);
    vec2 shift = -r.xy / max(-r.z, 0.25) * thick;
    float sl = length(shift);
    if (sl > maxShift) shift *= maxShift / sl;
    vec3 smp = sceneTex(p + shift + mag, lod);
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
  col = mix(col * 1.05 + 0.03, col * 1.04 + 0.006, 1.0 - u_dark);

  // frost scatters light: the dock's body is milky, the droplet stays clear;
  // the dock's rim fades toward milk too, so the lensed sliver reads as a
  // refracting edge and not as a second copy of what is behind
  vec3 milk = P_MILK;
  col = mix(col, milk, (1.0 - height) * 0.3 * dock);
  float body = smoothstep(0.15, 1.0, height) * (0.16 + 0.66 * u_frost) * mix(1.0, 0.08, wDrop);
  col = mix(col, milk, body);

  // tint, deeper where the glass is thicker
  float tintAmt = u_tint.a * (0.55 + 0.45 * height);
  col = mix(col, col * u_tint.rgb * 1.08 + u_tint.rgb * 0.05, tintAmt);

  // vibrancy plate: under each icon the ground calms toward a plate tone
  // (light under ink icons, dark under white ones), so they always read
  float fi = clamp(floor((p.x - u_icons.x) / u_icons.z + 0.5), 0.0, u_icons.w - 1.0);
  vec2 ic = p - vec2(u_icons.x + fi * u_icons.z, u_icons.y);
  float dI = length(ic * vec2(1.0, 1.12));
  // (inside the bar's own outline, so it holds over the droplet when it merges in)
  float inBar = smoothstep(1.0, -4.0, sdDock(p));
  float plate = (1.0 - smoothstep(u_plate.x * 0.25, u_plate.x, dI)) * inBar * smoothstep(0.1, 0.7, height);
  vec3 plateCol = mix(P_PLATE_INK, P_PLATE_WHITE, u_plate.z);
  plateCol = mix(plateCol, plateCol * u_tint.rgb * 1.04 + u_tint.rgb * 0.03, u_tint.a * 0.5);
  col = mix(col, plateCol, plate * u_plate.y);

  // the selected tab: a lifted capsule with a hairline of light along its
  // top and a soft shade along its bottom. Under ink icons it is brighter
  // than the body; under white icons it only lifts dark ground, so it never
  // takes contrast from the icon it holds
  float pLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 pillInk = col * 1.04 + 0.04;
  vec3 pillWhite = col + 0.07 * (1.0 - smoothstep(0.12, 0.42, pLuma));
  col = mix(col, mix(pillInk, pillWhite, u_plate.z), pillMask);
  float pIn = -dp;
  float pRim = smoothstep(px * 0.2, px * 1.2, pIn) * (1.0 - smoothstep(px * 1.2, px * 2.6 + 0.4, pIn)) * pillOn;
  float pUp = clamp(-pq.y / max(u_pill.w, 1.0), -1.0, 1.0);
  col += pRim * max(pUp, 0.0) * mix(0.16, 0.12, u_dark) * P_RIM;
  col *= 1.0 - pRim * max(-pUp, 0.0) * mix(0.1, 0.22, u_dark);

  // hover: light pools under the icon
  vec2 hq = p - u_hover.xy;
  col += exp(-dot(hq, hq) / (u_hover.z * u_hover.z)) * u_hover.w * mix(0.085, 0.07, u_dark) * P_RIM;

  // reflection of the room (Fresnel), brighter for faces turned up; the
  // droplet keeps more of what is behind it
  vec3 V = vec3(0.0, 0.0, 1.0);
  float fres = (0.04 + 0.96 * pow(1.0 - clamp(n.z, 0.0, 1.0), 5.0)) * mix(1.6, 1.0, wDrop);
  fres = min(fres, mix(1.0, 0.5, wDrop));
  vec3 R = reflect(-V, n);
  float up = clamp(0.5 - 0.5 * R.y, 0.0, 1.0);
  vec3 room = mix(P_ENV_LOW, P_ENV_HIGH, up);
  col = mix(col, room, fres * mix(1.0, 0.85, u_dark));

  // highlights, read off the reflected direction:
  // the window up on the left, a soft box with its bars across it
  vec2 wq = (R.xy - u_envWin.xy) / u_envWin.zw;
  float box = (1.0 - smoothstep(0.3, 1.0, abs(wq.x))) * (1.0 - smoothstep(0.3, 1.0, abs(wq.y)));
  col += P_ENV_WINDOW * box * box;
  // the lamp, low on the right
  vec2 lq = (R.xy - vec2(0.62, 0.42)) / vec2(0.34, 0.3);
  col += P_ENV_LAMP * exp(-dot(lq, lq)) * 0.6;
  // the fairy lights above: a warm sheen along faces turned up
  float rowUp = smoothstep(-0.5, -0.8, R.y) * (1.0 - smoothstep(-0.85, -0.98, R.y));
  col += P_HALO * rowUp * 0.5;

  // the pointer, a second small light while hovering: it glints on the
  // curved rims and only washes the flat faces
  if (u_pointer.z > 0.001) {
    vec3 Lp = normalize(vec3(u_pointer.xy - p, 150.0));
    float specP = pow(max(dot(n, normalize(Lp + V)), 0.0), 120.0) * u_pointer.z;
    col += specP * 0.5 * (1.0 - 0.85 * height) * P_RIM;
  }

  // bright rim: strong on the lit edge, a fainter echo on the far edge
  float rim = 1.0 - smoothstep(0.0, px * 1.5 + 0.75, depth);
  float facing = dot(g, normalize(vec2(-0.55, -0.84)));
  float rimLight = rim * (0.22 + 0.78 * max(facing, 0.0) + 0.5 * max(-facing, 0.0));
  col += rimLight * mix(0.55, 0.42, u_dark) * P_RIM;
  // the droplet focuses light into a soft crescent inside its far edge
  float crescent = wDrop * pow(1.0 - height, 1.6) * max(-facing, 0.0) * smoothstep(px, px * 4.0, depth);
  col += crescent * mix(0.2, 0.16, u_dark) * P_RIM;
  // a hairline just inside the rim, so the edge reads on light grounds
  float inner = smoothstep(px * 0.5, px * 1.5, depth) * (1.0 - smoothstep(px * 1.5, px * 3.5 + 1.0, depth));
  col = mix(col, col * mix(0.9, 0.82, u_dark), inner * 0.5 * (1.0 - max(facing, 0.0)));

  float cover = smoothstep(px * 0.5, -px * 0.5, d);
  if (cover < 1.0) col = mix(sceneHere(), col, cover);
  outColor = vec4(finish(col), 1.0);
}
`;class T{gl;scene;glass;us;ug;vao;fbo;target;tw=0;th=0;levels=1;hdr;constructor(e){this.gl=e,this.scene=(0,l.createProgram)(e,y,_),this.glass=(0,l.createProgram)(e,y,k),this.us=(0,l.uniformLocations)(e,this.scene),this.ug=(0,l.uniformLocations)(e,this.glass);const t=e.createVertexArray(),i=e.createFramebuffer(),o=e.createTexture();if(!t||!i||!o)throw Error("liquid-glass: could not allocate GL objects");this.vao=t,this.fbo=i,this.target=o,this.hdr=!!e.getExtension("EXT_color_buffer_float")}allocate(e,t){let i=this.gl;i.bindTexture(i.TEXTURE_2D,this.target),this.hdr?i.texImage2D(i.TEXTURE_2D,0,i.RGBA16F,e,t,0,i.RGBA,i.HALF_FLOAT,null):i.texImage2D(i.TEXTURE_2D,0,i.RGBA8,e,t,0,i.RGBA,i.UNSIGNED_BYTE,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR_MIPMAP_LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.generateMipmap(i.TEXTURE_2D),i.bindFramebuffer(i.FRAMEBUFFER,this.fbo),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,this.target,0);let o=i.checkFramebufferStatus(i.FRAMEBUFFER)===i.FRAMEBUFFER_COMPLETE;return i.bindFramebuffer(i.FRAMEBUFFER,null),o}ensureTarget(e,t){(e!==this.tw||t!==this.th)&&(this.tw=e,this.th=t,this.levels=Math.floor(Math.log2(Math.max(e,t)))+1,!this.allocate(e,t)&&this.hdr&&(this.hdr=!1,this.allocate(e,t)))}shapeUniforms(e,t,i){let o=this.gl;o.uniform2f(e("u_res"),t.width,t.height),o.uniform1f(e("u_dpr"),i),o.uniform4fv(e("u_dock"),t.dock),o.uniform1f(e("u_dockR"),t.dockR),o.uniform4fv(e("u_drop"),t.drop),o.uniform3fv(e("u_squash"),t.squash),o.uniform1f(e("u_bevelDock"),t.bevelDock),o.uniform1f(e("u_bevelDrop"),t.bevelDrop),o.uniform1f(e("u_time"),t.time),o.uniform3fv(e("u_pal"),t.pal)}draw(e){let t=this.gl,i=t.canvas,o=i.width,a=i.height;if(o<2||a<2||e.width<1||e.height<1)return;let r=1;o*a>36e5&&(r=Math.sqrt(36e5/(o*a)));let s=Math.max(2,Math.round(o*r)),l=Math.max(2,Math.round(a*r));this.ensureTarget(s,l),t.disable(t.BLEND),t.disable(t.DEPTH_TEST),t.bindVertexArray(this.vao),t.bindFramebuffer(t.FRAMEBUFFER,this.fbo),t.viewport(0,0,s,l),t.useProgram(this.scene);let n=this.us;this.shapeUniforms(n,e,s/e.width),t.uniform1f(n("u_ignite"),e.ignite),t.uniform4fv(n("u_lamp"),e.lamp),t.uniform4fv(n("u_win"),e.win),t.uniform4fv(n("u_winBars"),e.winBars),t.uniform2fv(n("u_winSoft"),e.winSoft),t.uniform2fv(n("u_sun"),e.sun),t.uniform1f(n("u_rain"),e.rain),t.uniform4fv(n("u_plant"),e.plant),t.uniform4fv(n("u_swag"),e.swag),t.uniform4fv(n("u_swagB"),e.swagB),t.uniform4fv(n("u_bulb"),e.bulb),t.uniform4fv(n("u_bokeh"),e.bokeh),t.uniform4fv(n("u_look"),e.look),t.uniform4fv(n("u_shadow"),e.shadow),t.uniform1f(n("u_caustic"),e.caustic),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,null),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.target),t.generateMipmap(t.TEXTURE_2D),t.viewport(0,0,o,a),t.useProgram(this.glass);let h=this.ug;this.shapeUniforms(h,e,o/e.width),t.uniform1i(h("u_scene"),0),t.uniform2f(h("u_px"),o,a),t.uniform1f(h("u_refract"),e.refract),t.uniform1f(h("u_frost"),e.frost),t.uniform4fv(h("u_tint"),e.tint),t.uniform4fv(h("u_pill"),e.pill),t.uniform1f(h("u_pillAmt"),e.pillAmt),t.uniform4fv(h("u_hover"),e.hover),t.uniform4fv(h("u_ripples"),e.ripples),t.uniform3fv(h("u_pointer"),e.pointer),t.uniform1f(h("u_dark"),e.dark),t.uniform1f(h("u_lod"),this.levels-1),t.uniform4fv(h("u_icons"),e.icons),t.uniform4fv(h("u_plate"),e.plate),t.uniform4fv(h("u_envWin"),e.envWin),t.uniform1f(h("u_grain"),e.grain),t.uniform1f(h("u_grainSeed"),e.grainSeed),t.uniform1f(h("u_hdr"),+!!this.hdr),t.drawArrays(t.TRIANGLES,0,3),t.bindVertexArray(null)}dispose(){let e=this.gl;e.deleteProgram(this.scene),e.deleteProgram(this.glass),e.deleteVertexArray(this.vao),e.deleteFramebuffer(this.fbo),e.deleteTexture(this.target)}}function M(e,t,i,o){let a,r,s,l,n,h,c="tile"===i,u=!c&&e<560,d=e/2;c?(a=Math.round(.2*e),r=Math.round(.148*e),s=Math.round(.03*e),l=.6*t,n=.074*e,h=Math.round(.068*e)):u?(a=58,r=Math.min(52,Math.floor((e-56)/o)),s=8,l=Math.max(84+a,Math.min(.56*t,t-96-1.6*a)),n=27,h=21):(a=78,r=70,s=11,l=.585*t,n=39,h=24);let p=o*r/2+s,f=a/2,m=d-p+s,g=Array.from({length:o},(e,t)=>({x:m+r*(t+.5),y:l}));return{width:e,height:t,compact:u,count:o,dock:{cx:d,cy:l,hw:p,hh:f,r:.44*a},pitch:r,padX:s,icons:g,iconSize:h,dropR:n,k:1.05*n,bevelDock:a*(c||u?.22:.3),bevelDrop:.6*n,scene:v(e,t,i,u),path:c?{ax:.8*p,up:1.6*a,down:1.25*a,period:10}:u?{ax:.8*p,up:1.85*a,down:1.05*a,period:12}:{ax:.8*p,up:1.95*a,down:1.15*a,period:12},rest:{x:d+.88*p+.25*n,y:l-f-.55*n}}}let R=[{id:"clear",label:"Clear",rgb:[1,1,1],amount:0,swatch:"linear-gradient(135deg, #ffffff 0%, #eef1f4 55%, #dfe4ea 100%)"},{id:"smoke",label:"Smoke",rgb:[.5,.52,.56],amount:.5,swatch:"linear-gradient(135deg, #b9bdc4 0%, #8a8f97 60%, #6f747c 100%)"},{id:"amber",label:"Amber",rgb:[1,.72,.36],amount:.48,swatch:"linear-gradient(135deg, #ffe0a8 0%, #f7b45a 60%, #e39431 100%)"},{id:"sea",label:"Sea glass",rgb:[.46,.84,.8],amount:.46,swatch:"linear-gradient(135deg, #cdf3ec 0%, #86d6cb 60%, #5fbdb2 100%)"},{id:"rose",label:"Rose",rgb:[1,.62,.7],amount:.42,swatch:"linear-gradient(135deg, #ffd9e0 0%, #f7a2b3 60%, #e77e95 100%)"}];function A(e){for(let t=0;t<R.length;t++)if(R[t].id===e)return R[t];return R[0]}class q{mode;layout=null;dx=new r.Spring(0,{stiffness:150,damping:16});dy=new r.Spring(0,{stiffness:150,damping:16});qx=new r.Spring(0,{stiffness:230,damping:8.5});qy=new r.Spring(0,{stiffness:230,damping:8.5});driver="path";target={x:0,y:0};grab={x:0,y:0};placed=!1;merged=!1;pathTime=0;count;selected=0;pill=new r.Spring(0,{stiffness:340,damping:26});pillVelocity=0;hoverIndex=-1;hover;press;glowX=new r.Spring(0,{stiffness:420,damping:34});glow=new r.Spring(0,{stiffness:260,damping:26});pointerLight=new r.Spring(0,{stiffness:120,damping:20});pointer={x:0,y:0,inside:!1};ripples=Array.from({length:4},()=>({x:0,y:0,age:0,amp:0}));dark=0;refraction=.6;frost=.18;tint=new Float32Array([1,1,1,0]);ambient=0;ignite=0;grainSeed=0;tone=0;out=(function(){let e=()=>new Float32Array(2),t=()=>new Float32Array(3),i=()=>new Float32Array(4);return{width:0,height:0,dpr:1,dock:i(),dockR:0,drop:i(),squash:t(),bevelDock:1,bevelDrop:1,time:0,ignite:0,pal:new Float32Array(3*n.length),lamp:i(),win:i(),winBars:i(),winSoft:e(),sun:e(),rain:10,plant:i(),swag:new Float32Array(8),swagB:new Float32Array(8),bulb:i(),bokeh:new Float32Array(56),look:i(),shadow:i(),caustic:0,refract:0,frost:0,tint:i(),pill:i(),pillAmt:1,hover:i(),ripples:new Float32Array(16),pointer:t(),dark:0,icons:i(),plate:i(),envWin:i(),grain:0,grainSeed:0}})();contactPoint={x:0,y:0};constructor(e,t){this.mode=e,this.count=t,this.hover=Array.from({length:t},()=>new r.Spring(0,{stiffness:320,damping:24})),this.press=Array.from({length:t},()=>new r.Spring(0,{stiffness:520,damping:15}))}resize(e,t){let i=this.layout;if(i&&i.width===e&&i.height===t)return!1;let o=M(e,t,this.mode,this.count);if(i&&this.placed){let a=e/i.width,r=t/i.height;this.dx.set(this.dx.value*a),this.dy.set(this.dy.value*r),this.target.x*=a,this.target.y*=r,this.pill.set(o.icons[this.selected]?.x??o.dock.cx)}return this.layout=o,!0}pathInto(e,t){let i=this.layout,o=2*Math.PI/i.path.period,a=Math.sin(2*o*e);t.x=i.dock.cx+i.path.ax*Math.sin(o*e),t.y=i.dock.cy-a*(a>0?i.path.up:i.path.down)}setTarget(e,t){this.target.x=e,this.target.y=t}gap(e=this.dx.value,t=this.dy.value){let i=this.layout;return i?this.dockDistance(e,t)-i.dropR:1/0}dockDistance(e,t){let i=this.layout;if(!i)return 1/0;let{cx:o,cy:a,hw:r,hh:s,r:l}=i.dock,n=Math.abs(e-o)-r+l,h=Math.abs(t-a)-s+l;return Math.hypot(Math.max(n,0),Math.max(h,0))+Math.min(Math.max(n,h),0)-l}glassDistance(e,t){let i=this.layout;return i?Math.min(this.dockDistance(e,t),Math.hypot(e-this.dx.value,t-this.dy.value)-i.dropR):1/0}contact(){let{cx:e,cy:t,hw:i,hh:o}=this.layout.dock;return this.contactPoint.x=(0,r.clamp)(this.dx.value,e-i,e+i),this.contactPoint.y=(0,r.clamp)(this.dy.value,t-o,t+o),this.contactPoint}hitDroplet(e,t,i=1.25){let o=this.layout;return!!o&&Math.hypot(e-this.dx.value,t-this.dy.value)<o.dropR*i}beginDrag(e,t,i){i?(this.grab.x=e-this.dx.value,this.grab.y=t-this.dy.value):(this.grab.x=0,this.grab.y=0),this.driver="drag",this.dragTo(e,t)}dragTo(e,t){let i=this.clampTarget(e-this.grab.x,t-this.grab.y);this.setTarget(i.x,i.y)}endDrag(e=!1){if("drag"!==this.driver)return;this.driver="rest";let t=this.layout;if(!t)return;let i=this.target.x,o=this.target.y;if(!e){let e=this.dx.velocity,a=this.dy.velocity,r=Math.hypot(e,a);if(r>260){let s=Math.min(.14*r,6*t.dropR);i+=e/r*s,o+=a/r*s}}let{cx:a,cy:s,hw:l,hh:n}=t.dock;this.gap(i,o)<.32*t.k&&(i=(0,r.clamp)(i,a-l+.9*t.dropR,a+l-.9*t.dropR),o=(0,r.lerp)(o,s,Math.abs(o-s)<1.4*n?1:.6));let h=this.clampTarget(i,o);this.setTarget(h.x,h.y)}addRipple(e,t,i){let o=this.ripples[0];for(let e of this.ripples){if(e.amp<=0){o=e;break}e.age>o.age&&(o=e)}o.x=e,o.y=t,o.age=0,o.amp=i}get rippling(){for(let e of this.ripples)if(e.amp>0)return!0;return!1}select(e,t=!0){let i=this.layout;this.selected=(0,r.clamp)(e,0,this.count-1),i&&(this.pill.to(i.icons[this.selected].x),this.press[this.selected].impulse(-4.2),t&&this.addRipple(i.icons[this.selected].x,i.dock.cy,.22))}toggleMerge(){let e=this.layout;if(!e)return;let{cx:t,cy:i,hw:o,hh:a}=e.dock;this.driver="keys",this.gap(this.target.x,this.target.y)<.5*e.k?this.setTarget((0,r.clamp)(this.target.x,t-.7*o,t+.7*o),i-a-2.1*e.dropR):this.setTarget((0,r.clamp)(this.target.x,t-o+e.dropR,t+o-e.dropR),i)}nudge(e,t){if(!this.layout)return;"keys"!==this.driver&&this.setTarget(this.dx.value,this.dy.value),this.driver="keys";let i=this.clampTarget(this.target.x+e,this.target.y+t);this.setTarget(i.x,i.y)}clamped={x:0,y:0};clampTarget(e,t){let i=this.layout,o=.9*i.dropR;return this.clamped.x=(0,r.clamp)(e,o,i.width-o),this.clamped.y=(0,r.clamp)(t,o,i.height-o),this.clamped}get busy(){if(Math.hypot(this.dx.value-this.target.x,this.dy.value-this.target.y)>.05||!this.dx.settled||!this.dy.settled||!this.qx.settled||!this.qy.settled||!this.pill.settled||!this.glow.settled||!this.glowX.settled||!this.pointerLight.settled||this.rippling||Math.abs(this.tone-(this.dark>.5))>.002)return!0;for(let e=0;e<this.count;e++)if(!this.hover[e].settled||!this.press[e].settled)return!0;return!1}step(e,t,i={}){let o=this.layout;if(!o)return;let a=!t.reducedMotion;if(!this.placed){a?this.pathInto(0,this.target):this.setTarget(o.rest.x,o.rest.y),this.dx.set(this.target.x),this.dy.set(this.target.y),this.pill.set(o.icons[this.selected].x),this.glowX.set(o.icons[0].x),this.merged=this.gap()<.5*o.k,this.placed=!0,this.dark=+!!t.dark,this.tone=this.dark,a||(this.ignite=60),this.refraction=t.refraction,this.frost=t.frost;let e=A(t.tint);this.tint[0]=e.rgb[0],this.tint[1]=e.rgb[1],this.tint[2]=e.rgb[2],this.tint[3]=e.amount}a?(this.ambient+=e,this.ignite+=e,this.grainSeed=(this.grainSeed+97.31)%4096):this.ignite=Math.max(this.ignite,60),"path"===this.driver&&(a?(this.pathTime+=e,this.pathInto(this.pathTime,this.target)):this.setTarget(o.rest.x,o.rest.y)),a?(this.dx.to(this.target.x),this.dy.to(this.target.y),this.dx.step(e),this.dy.step(e)):(this.dx.set((0,r.damp)(this.dx.value,this.target.x,18,e)),this.dy.set((0,r.damp)(this.dy.value,this.target.y,18,e)),.05>Math.hypot(this.dx.value-this.target.x,this.dy.value-this.target.y)&&(this.dx.set(this.target.x),this.dy.set(this.target.y)));let s="tile"===this.mode?.0016:48e-5,l=this.dx.velocity*s,n=this.dy.velocity*s,h=Math.hypot(l,n);h>.27&&(l*=.27/h,n*=.27/h),a?(this.qx.to(l),this.qy.to(n),this.qx.step(e),this.qy.step(e)):(this.qx.set(0),this.qy.set(0));let c=this.gap(),u=this.merged;if(!u&&c<.45*o.k?this.merged=!0:u&&c>.55*o.k&&(this.merged=!1),u!==this.merged){let e=this.contact();if(a){this.addRipple(e.x,e.y,this.merged?.3:.22);let t=this.dx.value-e.x,i=this.dy.value-e.y,o=Math.hypot(t,i)||1,a=this.merged?-1.6:2.2;this.qx.impulse(t/o*a),this.qy.impulse(i/o*a)}i.onMerge?.(this.merged,e.x,e.y)}let d=this.pill.value;a?this.pill.step(e):this.pill.set(this.pill.target),this.pillVelocity=e>0?(this.pill.value-d)/e:0;for(let t=0;t<this.count;t++)this.hover[t].to(+(t===this.hoverIndex)),a?(this.hover[t].step(e),this.press[t].step(e)):(this.hover[t].set(this.hover[t].target),this.press[t].set(0));for(let t of(this.hoverIndex>=0&&this.glowX.to(o.icons[this.hoverIndex].x),this.glow.to(+(this.hoverIndex>=0)),this.glowX.step(e),this.glow.step(e),this.ripples))!(t.amp<=0)&&(t.age+=e,t.age>=1.8&&(t.amp=0));let p=this.pointer,f="stage"===this.mode&&p.inside&&"drag"!==this.driver&&this.glassDistance(p.x,p.y)<1.4*o.dock.hh;this.pointerLight.to(+!!f),a?this.pointerLight.step(e):this.pointerLight.set(this.pointerLight.target);let m=+!!t.dark;this.dark=a?(0,r.damp)(this.dark,m,5,e):m,.002>Math.abs(this.dark-m)&&(this.dark=m);let g=+(this.dark>.5);this.tone=a?(0,r.damp)(this.tone,g,9,e):g,.002>Math.abs(this.tone-g)&&(this.tone=g),this.refraction=(0,r.damp)(this.refraction,t.refraction,14,e),this.frost=(0,r.damp)(this.frost,t.frost,14,e);let v=A(t.tint);this.tint[0]=(0,r.damp)(this.tint[0],v.rgb[0],9,e),this.tint[1]=(0,r.damp)(this.tint[1],v.rgb[1],9,e),this.tint[2]=(0,r.damp)(this.tint[2],v.rgb[2],9,e),this.tint[3]=(0,r.damp)(this.tint[3],v.amount,9,e)}easing(e){let t=A(e.tint);return Math.abs(this.dark-!!e.dark)>.002||Math.abs(this.refraction-e.refraction)>.002||Math.abs(this.frost-e.frost)>.002||Math.abs(this.tint[3]-t.amount)>.002||Math.abs(this.tint[0]-t.rgb[0])>.002||Math.abs(this.tint[1]-t.rgb[1])>.002||Math.abs(this.tint[2]-t.rgb[2])>.002}iconScale(e){return 1+.13*this.hover[e].value+.9*this.press[e].value}iconLift(e){return -1.5*this.hover[e].value}frame(e){let t=this.layout;if(!t)return null;let i=this.out,o=this.dark;i.width=t.width,i.height=t.height,i.dpr=e;let a=t.scene;i.time=this.ambient,i.ignite=this.ignite,function(e,t){for(let i=0;i<n.length;i++){let o=d[n[i]],a=p[n[i]];e[3*i]=(0,r.lerp)(o[0],a[0],t),e[3*i+1]=(0,r.lerp)(o[1],a[1],t),e[3*i+2]=(0,r.lerp)(o[2],a[2],t)}}(i.pal,o),i.lamp[0]=a.lamp.x,i.lamp[1]=a.lamp.y,i.lamp[2]=a.lamp.r,i.win[0]=a.win.x,i.win[1]=a.win.y,i.win[2]=a.win.w,i.win[3]=a.win.h,i.winBars[0]=a.win.slope,i.winBars[1]=a.win.mullion,i.winBars[2]=a.win.transom,i.winBars[3]=a.win.bar,i.winSoft[0]=a.win.softNear,i.winSoft[1]=a.win.softFar,i.sun[0]=a.sun.x,i.sun[1]=a.sun.y,i.rain=a.rain,i.plant[0]=a.plant.x,i.plant[1]=a.plant.y,i.plant[2]=a.plant.size;for(let e=0;e<2;e++){let t=a.swags[e];i.swag[4*e]=t.x0,i.swag[4*e+1]=t.y0,i.swag[4*e+2]=t.x1,i.swag[4*e+3]=t.y1,i.swagB[4*e]=t.sag,i.swagB[4*e+1]=t.spacing,i.swagB[4*e+2]=t.phase,i.swagB[4*e+3]=t.sway}i.bulb[0]=a.bulb.r,i.bulb[1]=a.bulb.hang,i.bulb[2]=a.bulb.halo,i.bulb[3]=a.bulb.wire,i.bokeh.set(a.bokeh),i.look[0]=f("bokehAmount",o),i.look[1]=f("bokehBlend",o),i.look[2]=f("vignette",o),i.look[3]=f("wireAlpha",o),i.shadow[0]=a.shadow.x,i.shadow[1]=a.shadow.y,i.shadow[2]=a.shadow.blur,i.shadow[3]=f("shadow",o),i.caustic=f("causticAmount",o),i.grain=f("grain",o),i.grainSeed=this.grainSeed,i.envWin[0]=-.48,i.envWin[1]=-.6,i.envWin[2]=.3,i.envWin[3]=.32,i.dock[0]=t.dock.cx,i.dock[1]=t.dock.cy,i.dock[2]=t.dock.hw,i.dock[3]=t.dock.hh,i.dockR=t.dock.r,i.drop[0]=this.dx.value,i.drop[1]=this.dy.value,i.drop[2]=t.dropR,i.drop[3]=t.k;let s=this.qx.value,l=this.qy.value,h=Math.hypot(s,l);h>1e-4?(i.squash[0]=s/h,i.squash[1]=l/h,i.squash[2]=h):(i.squash[0]=1,i.squash[1]=0,i.squash[2]=0),i.bevelDock=t.bevelDock,i.bevelDrop=t.bevelDrop,i.refract=this.refraction,i.frost=this.frost,i.tint.set(this.tint),i.dark=o;let c=Math.abs(this.pillVelocity),u="tile"===this.mode;i.pill[0]=this.pill.value,i.pill[1]=t.dock.cy,i.pill[2]=.5*t.pitch-(u||t.compact?1.5:2)+Math.min(.016*c,.32*t.pitch),i.pill[3]=t.dock.hh*(u?.56:.62)-Math.min(.0035*c,.12*t.dock.hh),i.pillAmt=1,i.hover[0]=this.glowX.value,i.hover[1]=t.dock.cy,i.hover[2]=.62*t.pitch,i.hover[3]=this.glow.value;let m=i.ripples;for(let e=0;e<4;e++){let t=this.ripples[e];m[4*e]=t.x,m[4*e+1]=t.y,m[4*e+2]=t.age,m[4*e+3]=t.amp}return i.pointer[0]=this.pointer.x,i.pointer[1]=this.pointer.y,i.pointer[2]=this.pointerLight.value,i.icons[0]=t.icons[0].x,i.icons[1]=t.dock.cy,i.icons[2]=t.pitch,i.icons[3]=t.count,i.plate[0]=.45*t.pitch,i.plate[1]=(0,r.lerp)(.36,.44,o),i.plate[2]=this.tone,i.plate[3]=0,i}}let E=[{id:"home",label:"Home"},{id:"search",label:"Search"},{id:"spark",label:"Spark"},{id:"saved",label:"Saved"},{id:"profile",label:"Profile"}],D=E.filter(e=>"saved"!==e.id);function P({size:e,children:t}){return(0,i.jsx)("svg",{width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",className:"block",children:t})}function S({id:e,size:t,filled:o}){let a=o?"currentColor":"none";switch(e){case"home":return(0,i.jsx)(P,{size:t,children:(0,i.jsx)("path",{d:"M4.25 10.4 12 4.2l7.75 6.2v8.1a1.5 1.5 0 0 1-1.5 1.5h-3.6v-5.1a.8.8 0 0 0-.8-.8h-3.7a.8.8 0 0 0-.8.8v5.1h-3.6a1.5 1.5 0 0 1-1.5-1.5z",fill:a})});case"search":return(0,i.jsxs)(P,{size:t,children:[(0,i.jsx)("circle",{cx:"10.8",cy:"10.8",r:"6.2",fill:o?"currentColor":"none",fillOpacity:.16*!!o}),(0,i.jsx)("path",{d:"m15.4 15.4 4.35 4.35"})]});case"spark":return(0,i.jsxs)(P,{size:t,children:[(0,i.jsx)("path",{d:"M12 3.6c.55 4.6 2.35 6.5 7 7.15-4.65.65-6.45 2.55-7 7.15-.55-4.6-2.35-6.5-7-7.15 4.65-.65 6.45-2.55 7-7.15z",fill:a}),(0,i.jsx)("path",{d:"M18.6 16.4v3.2M17 18h3.2",strokeWidth:1.6})]});case"saved":return(0,i.jsx)(P,{size:t,children:(0,i.jsx)("path",{d:"M7.2 4.2h9.6a1.2 1.2 0 0 1 1.2 1.2v14.2l-6-3.9-6 3.9V5.4a1.2 1.2 0 0 1 1.2-1.2z",fill:a})});case"profile":return(0,i.jsxs)(P,{size:t,children:[(0,i.jsx)("circle",{cx:"12",cy:"8.6",r:"3.6",fill:a}),(0,i.jsx)("path",{d:"M4.9 19.6c1.15-3.55 3.8-5.4 7.1-5.4s5.95 1.85 7.1 5.4",fill:a})]})}}var L=e.i(16442);function z(){(0,L.isMuted)()||(0,L.ensureAudio)()}function B(){if((0,L.isMuted)())return null;let e=(0,L.getAudio)();return e&&"closed"!==e.ctx.state?e:null}function C(e,t,i){if("function"!=typeof e.createStereoPanner)return t;let o=e.createStereoPanner();return o.pan.value=Math.max(-1,Math.min(1,i)),o.connect(t),o}function I(e,t,i,o,a,r,s){let{ctx:l,output:n}=e,h=C(l,n,s),c=l.createOscillator();c.type="sine",c.frequency.setValueAtTime(i,t),c.frequency.exponentialRampToValueAtTime(o,t+a);let u=l.createGain();u.gain.setValueAtTime(0,t),u.gain.linearRampToValueAtTime(r,t+.004),u.gain.exponentialRampToValueAtTime(1e-4,t+1.9*a),c.connect(u).connect(h),c.start(t),c.stop(t+2*a+.02)}function F(e,t,i,o,a){let{ctx:r,output:s}=e,l=C(r,s,a),n=r.createBufferSource();n.buffer=(0,L.noiseBuffer)(r,.25);let h=r.createBiquadFilter();h.type="bandpass",h.frequency.value=i,h.Q.value=2.2;let c=r.createGain();c.gain.setValueAtTime(o,t),c.gain.exponentialRampToValueAtTime(1e-4,t+.022),n.connect(h).connect(c).connect(l),n.start(t,.2*Math.random(),.03)}function j(e,t,i,o,a,r){let{ctx:s,output:l}=e,n=C(s,l,r),h=s.createOscillator();h.type="sine",h.frequency.value=i*(1+(Math.random()-.5)*.008);let c=s.createGain();c.gain.setValueAtTime(0,t),c.gain.linearRampToValueAtTime(o,t+.002),c.gain.exponentialRampToValueAtTime(1e-4,t+a),h.connect(c).connect(n),h.start(t),h.stop(t+a+.02)}function U(e,t){let i=B();if(!i)return;let o=i.ctx.currentTime+.003,a=520-180*e+40*Math.random();I(i,o,a,2.6*a,.05,.16,t),F(i,o,3200,.05,t)}let N=R.map(e=>({value:e.id,label:e.label,swatch:e.swatch})),W=e=>e?"The droplet merged with the tab bar":"The droplet pulled free of the tab bar";function O({mode:e,theme:t}){let a=(0,o.useRef)(null);return(0,o.useEffect)(()=>{let i=a.current;if(!i)return;let o=()=>{let o=i.getBoundingClientRect();if(o.width<2||o.height<2)return;let a=Math.min(window.devicePixelRatio||1,"stage"===e?2:1.5);i.width=Math.round(o.width*a),i.height=Math.round(o.height*a);let r=i.getContext("2d");if(!r)return;let s="dark"===t?p:d,l=o.width,n=o.height,h=M(l,n,e,"stage"===e?E.length:D.length),c=v(l,n,e,h.compact),u=(e,t=1,i=1)=>`rgb(${e.map(e=>Math.round(255*Math.min(1,Math.max(0,e*t)))).join(" ")} / ${i})`,f=e=>s.albedoTop.map((t,i)=>t*e[i]);r.setTransform(a,0,0,a,0,0),r.fillStyle=u(f(s.ambient)),r.fillRect(0,0,l,n);let m=r.createRadialGradient(c.lamp.x,c.lamp.y,0,c.lamp.x,c.lamp.y,1.3*c.lamp.r);m.addColorStop(0,u(f(s.lamp),1,.9)),m.addColorStop(1,u(f(s.lamp),1,0)),r.globalCompositeOperation="lighter",r.fillStyle=m,r.fillRect(0,0,l,n);let{win:g}=c;r.fillStyle=u(f(s.window));let x=(e,t,i,o)=>{let a=g.x+e*g.w,s=g.x+t*g.w;r.beginPath(),r.moveTo(a,g.y+g.slope*(a-g.x)+i*g.h),r.lineTo(s,g.y+g.slope*(s-g.x)+i*g.h),r.lineTo(s,g.y+g.slope*(s-g.x)+o*g.h),r.lineTo(a,g.y+g.slope*(a-g.x)+o*g.h),r.fill()},w=g.bar/g.w,b=g.bar/g.h;for(let e of(x(0,g.mullion-w,0,g.transom-b),x(g.mullion+w,1,0,g.transom-b),x(0,g.mullion-w,g.transom+b,1),x(g.mullion+w,1,g.transom+b,1),r.globalCompositeOperation="source-over",c.swags)){let t=t=>{let i=(t-e.x0)/(e.x1-e.x0);return e.y0+(e.y1-e.y0)*i+4*e.sag*i*(1-i)};r.strokeStyle=u(s.wire,1,s.wireAlpha),r.lineWidth=e===c.swags[0]?1:.9,r.beginPath();for(let i=e.x0;i<=e.x1;i+=4)r.lineTo(i,t(i));r.stroke(),r.fillStyle=u(s.bulb);for(let i=e.x0+e.phase*e.spacing;i<e.x1;i+=e.spacing)r.beginPath(),r.ellipse(i,t(i)+c.bulb.hang,.8*c.bulb.r,1.05*c.bulb.r,0,0,2*Math.PI),r.fill()}for(let e=0;e<c.bokeh.length;e+=4){let t=c.bokeh[e+2];t<=0||(r.fillStyle=u(s.bokehA,1,.6*s.bokehAmount),r.beginPath(),r.arc(c.bokeh[e],c.bokeh[e+1],t,0,2*Math.PI),r.fill())}r.fillStyle=u(s.milk,1,"dark"===t?.55:.6),r.strokeStyle=u(s.rim,1,"dark"===t?.35:.9),r.lineWidth=1,r.beginPath(),r.roundRect(h.dock.cx-h.dock.hw,h.dock.cy-h.dock.hh,2*h.dock.hw,2*h.dock.hh,h.dock.r),r.arc(h.rest.x,h.rest.y,h.dropR,0,2*Math.PI),r.fill(),r.stroke()};o();let r=new ResizeObserver(o);return r.observe(i),()=>r.disconnect()},[e,t]),(0,i.jsx)("canvas",{ref:a,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A glass tab bar in front of a warm room lit by fairy lights":void 0,"aria-hidden":"stage"!==e||void 0,className:"absolute inset-0 block size-full"})}e.s(["default",0,function({mode:e,active:t,reducedMotion:l,theme:n}){let h="stage"===e,c=h?E:D,[u]=(0,o.useState)(()=>new q(e,c.length)),d=(0,o.useRef)(null),p=(0,o.useRef)(null),f=(0,o.useRef)(null),m=(0,o.useRef)(null),g=(0,o.useRef)(null),v=(0,o.useRef)([]),x=(0,o.useRef)([]),w=(0,o.useId)(),[b,y]=(0,o.useState)(.6),[_,k]=(0,o.useState)(.3),[R,P]=(0,o.useState)("clear"),[L,C]=(0,o.useState)(0),[X,V]=(0,o.useState)(!1),[H,$]=(0,o.useState)(""),G=(0,o.useRef)({acc:0,urgent:!0,nextTab:3.2}),K=(0,o.useRef)({iconEls:[],lift:[],scale:[],tone:[],dockEl:null,handleX:NaN,handleY:NaN,handleR:NaN,surfaceCursor:"",dockCursor:"",dockTouch:""}),Y=(0,o.useRef)({source:"",id:-1,x:0,y:0,moved:!1,merged:!1,suppressUntil:0}),Q=(0,o.useRef)(0),Z=(0,r.useLatest)({refraction:b,frost:_,tint:R,dark:"dark"===n,reducedMotion:l,theme:n}),J=e=>{let t=ea.current.width;return t?(0,r.clamp)(e/t*1.4-.7,-.8,.8):0},ee=(0,r.useLatest)({onMerge:(e,t)=>{h&&"path"!==u.driver&&(e?function(e){let t=B();if(!t)return;let i=t.ctx.currentTime+.003,o=300+30*Math.random();I(t,i,o,2.1*o,.075,.15,e),j(t,i+.01,2350+120*Math.random(),.018,.22,e),j(t,i+.01,3710+160*Math.random(),.01,.16,e)}(J(t)):function(e){let t=B();if(!t)return;let i=t.ctx.currentTime+.003,o=760+80*Math.random();I(t,i,o,2.3*o,.032,.11,e),F(t,i,4200,.035,e)}(J(t)),"keys"===u.driver&&$(W(e)))}}),et=(0,r.useFrame)(t,e=>{let t=d.current,i=eo.current,o=G.current,a=Z.current,{width:r,height:s,dpr:l}=ea.current;if(!t||!i||r<2||s<2)return;if(h){if(!o.urgent&&"path"!==u.driver&&"drag"!==u.driver&&!u.busy&&!u.easing(a)){if(o.acc+=e,o.acc<1/30-.002)return;e=o.acc}o.acc=0,o.urgent=!1}else{if(o.acc+=e,o.acc<1/30-.002)return;e=o.acc,o.acc=0}u.resize(r,s);let n=u.layout;if(!h){let t=ed.current;if(t.inside&&"mouse"===t.type){u.driver="hover";let e=u.clampTarget(t.x,t.y);u.target.x=e.x,u.target.y=e.y;let{cx:i,cy:o,hw:a,hh:r}=n.dock;u.hoverIndex=Math.abs(t.x-i)<a&&Math.abs(t.y-o)<r?en(t.x):-1}else"hover"===u.driver&&(u.driver="path"),u.hoverIndex=-1;if(!a.reducedMotion&&(o.nextTab-=e,o.nextTab<=0)){o.nextTab=3.4;let e=(u.selected+1)%c.length;u.select(e),C(e)}}u.step(e,a,ee.current);let p=u.frame(l);p&&t.draw(p);let x=K.current,w=Math.round(40*u.tone)/40;for(let e=0;e<c.length;e++){let t=v.current[e];if(!t)continue;t!==x.iconEls[e]&&(x.iconEls[e]=t,x.lift[e]=x.scale[e]=x.tone[e]=NaN);let i=Math.round(50*u.iconLift(e))/50,o=Math.round(500*u.iconScale(e))/500;if((i!==x.lift[e]||o!==x.scale[e])&&(x.lift[e]=i,x.scale[e]=o,t.style.transform=`translate3d(0, ${i}px, 0) scale(${o})`),w!==x.tone[e]){x.tone[e]=w;let i=Math.round(22+225*w),o=Math.round(255-255*w);t.style.color=`rgb(${i} ${i} ${i})`,t.style.filter=`drop-shadow(0 0 ${h?2:1.5}px rgb(${o} ${o} ${o} / ${(.5-.12*w).toFixed(2)}))`}}if(h){let e=ed.current,t="drag"===u.driver,i=g.current;if(i){let e=Math.round(1.6*n.dropR),t=Math.round(2*u.dx.value)/2,o=Math.round(2*u.dy.value)/2;e!==x.handleR&&(x.handleR=e,i.style.width=i.style.height=`${2*e}px`),(t!==x.handleX||o!==x.handleY)&&(x.handleX=t,x.handleY=o,i.style.transform=`translate3d(${t-e}px, ${o-e}px, 0)`)}let o=m.current;if(o&&o!==x.dockEl&&(x.dockEl=o,x.dockTouch=x.dockCursor=""),o){let e=u.gap()<n.k?"none":"pan-y";e!==x.dockTouch&&(x.dockTouch=e,o.style.touchAction=e);let t=u.pointer,i=t.inside&&u.hitDroplet(t.x,t.y,1.25),a="dock"===Y.current.source?"grabbing":i?"grab":"pointer";a!==x.dockCursor&&(x.dockCursor=a,o.style.setProperty("--lg-cursor",a))}let a=f.current;if(a){let i=t?"grabbing":e.inside&&u.hitDroplet(e.x,e.y,1.25)?"grab":"";i!==x.surfaceCursor&&(x.surfaceCursor=i,a.style.cursor=i)}}if(a.reducedMotion&&!u.busy&&!u.easing(a))return!1}),{canvasRef:ei,glRef:eo,sizeRef:ea,size:er,supported:es}=(0,r.useWebGL2)({mode:e,maxDpr:h?2:1.5,attributes:{alpha:!1,antialias:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new T(e)}catch(e){console.error(e);return}return d.current=t,G.current.urgent=!0,et(),()=>{t?.dispose(),d.current=null}},onResize:()=>{G.current.urgent=!0,et()}});(0,o.useEffect)(()=>{let e=ei.current;return()=>{e&&window.setTimeout(()=>{if(e.isConnected)return;let t=e.getContext("webgl2");t&&!t.isContextLost()&&t.getExtension("WEBGL_lose_context")?.loseContext()},0)}},[ei]),(0,o.useEffect)(()=>{G.current.urgent=!0,et()},[b,_,R,n,l,et]),(0,o.useEffect)(()=>()=>window.clearTimeout(Q.current),[]);let el=()=>{G.current.urgent=!0,et()},en=e=>{let t=u.layout;return t?(0,r.clamp)(Math.floor((e-(t.dock.cx-t.dock.hw+t.padX))/t.pitch),0,c.length-1):0},eh=(e,t,i,o)=>{z(),window.clearTimeout(Q.current),Y.current.merged=u.merged,u.beginDrag(e,t,i),i&&o&&U(.5,J(e)),V(!0),el()},ec=()=>{if("drag"!==u.driver)return;u.endDrag(Z.current.reducedMotion);let e=Y.current.merged;window.clearTimeout(Q.current),Q.current=window.setTimeout(()=>{u.merged!==e&&$(W(u.merged))},600),el()},eu=h?f:ei,ed=(0,r.usePointer)(eu,{capture:h,onDown:(e,t)=>{if(!h)return;let i="mouse"!==t.pointerType,o=u.hitDroplet(e.x,e.y,i?1.6:1.25);(!i||o)&&(Y.current.source="surface",eh(e.x,e.y,o,!0))},onMove:e=>{h&&e.pressed&&"surface"===Y.current.source&&"drag"===u.driver&&u.dragTo(e.x,e.y),el()},onUp:()=>{h&&("surface"===Y.current.source&&(Y.current.source="",ec()),el())},onLeave:()=>el()});(0,o.useEffect)(()=>{let e=p.current;if(!h||!e)return;let t=t=>{if("mouse"!==t.pointerType)return;let i=e.getBoundingClientRect();u.pointer.x=t.clientX-i.left,u.pointer.y=t.clientY-i.top,u.pointer.inside=!0,G.current.urgent=!0,et()},i=()=>{u.pointer.inside=!1,G.current.urgent=!0,et()};return e.addEventListener("pointermove",t),e.addEventListener("pointerleave",i),()=>{e.removeEventListener("pointermove",t),e.removeEventListener("pointerleave",i)}},[h,u,et]);let ep=e=>{let t=p.current?.getBoundingClientRect();return t?{x:e.clientX-t.left,y:e.clientY-t.top}:{x:0,y:0}},ef=e=>{let t=Y.current;if("dock"!==t.source||e.pointerId!==t.id)return;t.source="",t.suppressUntil=performance.now()+500;let i=!t.moved&&"pointerup"===e.type;ec(),i&&em(en(t.x))},em=e=>{z(),u.select(e),C(e);let t=u.layout;!function(e){let t=B();if(!t)return;let i=t.ctx.currentTime+.003;j(t,i,2960+60*Math.random(),.04,.12,e),j(t,i,4620+80*Math.random(),.022,.08,e),F(t,i,5200,.03,e)}(t?J(t.icons[e].x):0),V(!0),el()},eg=e=>{u.hoverIndex=e,el()},ev=(0,o.useMemo)(()=>er.width>1&&er.height>1?M(er.width,er.height,e,c.length):null,[er.width,er.height,e,c.length]);if(!1===es)return(0,i.jsx)(O,{mode:e,theme:n});let ex=ev?(0,i.jsx)("div",{ref:m,"data-lab-controls":h?"":void 0,role:h?"radiogroup":void 0,"aria-label":h?"Tab bar":void 0,"aria-hidden":!h||void 0,onKeyDown:h?e=>{let t=c.length,i=-1;switch(e.key){case"ArrowRight":case"ArrowDown":i=(L+1)%t;break;case"ArrowLeft":case"ArrowUp":i=(L-1+t)%t;break;case"Home":i=0;break;case"End":i=t-1;break;default:return}e.preventDefault(),e.stopPropagation(),em(i),x.current[i]?.focus()}:void 0,onPointerLeave:h?()=>eg(-1):void 0,onPointerDown:h?e=>{if(!e.isPrimary||e.button>0)return;let{x:t,y:i}=ep(e),o="mouse"!==e.pointerType;if(!u.hitDroplet(t,i,o?1.6:1.25))return;e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}let a=Y.current;a.source="dock",a.id=e.pointerId,a.x=t,a.y=i,a.moved=!1,eh(t,i,!0,!1)}:void 0,onPointerMove:h?e=>{let t=Y.current;if("dock"!==t.source||e.pointerId!==t.id)return;let{x:i,y:o}=ep(e);!t.moved&&Math.hypot(i-t.x,o-t.y)>4&&(t.moved=!0,U(.5,J(i))),t.moved&&u.dragTo(i,o),el()}:void 0,onPointerUp:h?ef:void 0,onPointerCancel:h?ef:void 0,onClickCapture:h?e=>{performance.now()<Y.current.suppressUntil&&(Y.current.suppressUntil=0,e.preventDefault(),e.stopPropagation())}:void 0,className:(0,a.cn)("absolute",h?"touch-pan-y":"pointer-events-none"),style:{left:ev.dock.cx-ev.dock.hw,top:ev.dock.cy-ev.dock.hh,width:2*ev.dock.hw,height:2*ev.dock.hh},children:c.map((e,t)=>{let o=t===L,r=(0,i.jsx)("span",{ref:e=>{v.current[t]=e},className:(0,a.cn)("block text-primary transition-opacity duration-300 ease-out will-change-transform",o?"opacity-100":"opacity-[0.78]"),children:(0,i.jsx)(S,{id:e.id,size:ev.iconSize,filled:o})}),s={left:ev.padX+ev.pitch*t,width:ev.pitch,top:h?4:2,bottom:h?4:2};return h?(0,i.jsx)("button",{ref:e=>{x.current[t]=e},type:"button",role:"radio","aria-checked":o,"aria-label":e.label,title:e.label,tabIndex:o?0:-1,onClick:()=>em(t),onPointerEnter:e=>{"mouse"===e.pointerType&&eg(t)},onFocus:()=>eg(t),onBlur:()=>eg(-1),className:"absolute grid cursor-[var(--lg-cursor,pointer)] place-items-center rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",style:s,children:r},e.id):(0,i.jsx)("span",{className:"absolute grid place-items-center",style:s,children:r},e.id)})}):null;if(!h)return(0,i.jsxs)("div",{className:"absolute inset-0",children:[(0,i.jsx)("canvas",{ref:ei,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),ex]});let ew=ev?.compact??!1;return(0,i.jsxs)("div",{ref:p,className:"absolute inset-0 select-none",children:[(0,i.jsxs)("div",{ref:f,tabIndex:0,role:"application","aria-roledescription":"liquid glass","aria-label":"Glass droplet","aria-describedby":w,onKeyDown:e=>{if(!h||e.altKey||e.ctrlKey||e.metaKey)return;let t=u.layout;if(!t)return;let i=(e.shiftKey?3:1)*Math.max(12,.75*t.dropR),o=!0;switch(e.key){case"ArrowLeft":u.nudge(-i,0);break;case"ArrowRight":u.nudge(i,0);break;case"ArrowUp":u.nudge(0,-i);break;case"ArrowDown":u.nudge(0,i);break;case"Enter":case" ":if(e.repeat)break;u.toggleMerge();break;default:o=!1}o&&(e.preventDefault(),e.stopPropagation(),z(),("Enter"===e.key||" "===e.key)&&U(.35,J(u.dx.value)),V(!0),el())},className:"group/glass absolute inset-0 touch-pan-y outline-none [-webkit-tap-highlight-color:transparent]",children:[(0,i.jsx)("canvas",{ref:ei,className:"absolute inset-0 block size-full"}),(0,i.jsx)("span",{ref:g,"aria-hidden":"true",className:"absolute top-0 left-0 touch-none rounded-full",style:{width:0,height:0}}),(0,i.jsx)("span",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_2px_var(--foreground)] opacity-0 transition-opacity duration-200 group-focus-visible/glass:opacity-30"})]}),ex,(0,i.jsx)("p",{id:w,className:"sr-only",children:"Drag the droplet, or use the arrow keys to move it. Enter or Space drops it into the tab bar or lifts it back out. Tab to the tab bar and use the arrow keys to switch tabs."}),(0,i.jsx)("p",{className:"sr-only","aria-live":"polite",children:H}),(0,i.jsx)(s.StageControls,{placement:"top",children:(0,i.jsxs)(s.Tray,{label:"Tint and sound",children:[(0,i.jsx)(s.Swatches,{label:"Tint",options:N,value:R,onChange:e=>{P(e),$(`Tint: ${A(e).label}`)}}),(0,i.jsx)(s.TrayDivider,{}),(0,i.jsx)(s.MuteButton,{})]})}),(0,i.jsxs)(s.StageControls,{placement:"bottom",children:[(0,i.jsx)(s.TrayRow,{children:(0,i.jsxs)(s.Tray,{label:"Glass",children:[(0,i.jsx)(s.Slider,{label:"Refraction",value:b,min:0,max:1,step:.01,width:ew?64:96,showValue:!ew,onChange:y,format:e=>`${Math.round(100*e)}`}),(0,i.jsx)(s.TrayDivider,{}),(0,i.jsx)(s.Slider,{label:"Frost",value:_,min:0,max:1,step:.01,width:ew?64:96,showValue:!ew,onChange:k,format:e=>`${Math.round(100*e)}`})]})}),(0,i.jsx)(s.StageHint,{className:(0,a.cn)("transition-opacity duration-700",X&&"opacity-0"),children:"Drag the droplet into the bar and pull it back out"})]})]})}],95709)},80920,function(e){e.n(e.i(95709))}]);