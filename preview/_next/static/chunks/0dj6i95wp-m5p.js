(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,70449,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(15127),n=e.i(16442),s=e.i(37047),i=e.i(7537),l=e.i(45219),o=e.i(97037);let c=new Intl.DateTimeFormat("en-GB",{timeZone:o.site.status.timeZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"});var h=e.i(98476);let u=" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/'!?&+@#",d=["012","0123456789","012345","0123456789"],f={ch:" ",tone:"ink"};function p(e){return e.normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/[‘’]/g,"'").replace(/[–—]/g,"-").split("").map(e=>u.includes(e)?e:" ").join("")}function g(e,t,a){let r=e.length;if(t<1||t>r)return null;let n=[0];for(let t of e)n.push(n[n.length-1]+t.length+1);let s=(e,t)=>n[t]-n[e]-1,i=(e,a)=>{let n=Array.from({length:t+1},()=>Array(r+1).fill(1/0)),s=Array.from({length:t+1},()=>Array(r+1).fill(-1));n[0][0]=0;for(let i=1;i<=t;i++)for(let t=i;t<=r;t++)for(let r=i-1;r<t;r++){if(n[i-1][r]===1/0)continue;let l=e(r,t);if(l===1/0)continue;let o=a(n[i-1][r],l);o<n[i][t]&&(n[i][t]=o,s[i][t]=r)}return{total:n[t][r],from:s}},l=i((e,t)=>s(e,t)<=a?s(e,t):1/0,Math.max).total;if(l===1/0)return null;let o=i((e,t)=>s(e,t)<=l?(l-s(e,t))**2:1/0,(e,t)=>e+t),c=[];for(let a=t,n=r;a>0;a--){let t=o.from[a][n];c.unshift(e.slice(t,n).join(" ")),n=t}return c}let m={"ON TIME":"green",BOARDING:"amber",DEPARTED:"muted"},b=h.default.map(e=>{let t="wip"===e.category||/progress/i.test(e.date)?"BOARDING":/2026/.test(e.date)?"ON TIME":"DEPARTED";return{name:p(e.name).trim(),remark:t,tone:m[t]}});function v(e){return b.filter(t=>t.name.length+1+t.remark.length<=e)}let w=["Marhaba, welcome aboard","Made in Morocco","Zero room for jank","Resident tinkerer","Every flap drawn in code","Next stop: your idea"],x=[{rows:["CASA","BLANCA"],tone:"ink",lamp:null},...b.filter(e=>e.name.length<=8).slice(0,4).map(e=>({rows:[e.name,e.remark],tone:e.tone,lamp:e.tone}))];function y(e,t,a){let r=p(e).slice(0,t),n=Math.floor((t-r.length)/2);return Array.from({length:t},(e,t)=>({ch:r[t-n]??" ",tone:a}))}let k={period:.066,fall:.062,bounce:17,bounceTime:.052,decay:.04,settle:.17,jitter:.07},M={period:.078,fall:.072,bounce:15,bounceTime:.056,decay:.04,settle:.16,jitter:.06};class j{el;ch="";tone="";transform="";shade=-1;shown;constructor(e,t,a,r){this.el=document.createElement("div"),this.el.className=e,r&&(this.el.dataset.o="l"),this.shown=a,a||(this.el.style.display="none"),t.appendChild(this.el)}glyph(e){e.ch!==this.ch&&(this.ch=e.ch,this.el.dataset.c=e.ch),e.tone!==this.tone&&(this.tone=e.tone,"ink"===e.tone?delete this.el.dataset.t:this.el.dataset.t=e.tone)}rotate(e){e!==this.transform&&(this.transform=e,this.el.style.transform=e)}setShade(e){let t=Math.round(100*e)/100;t!==this.shade&&(this.shade=t,this.el.style.setProperty("--s",String(t)))}show(e){e!==this.shown&&(this.shown=e,this.el.style.display=e?"":"none")}layer(e){this.el.style.zIndex=String(e)}}class T{el;drum;pan=0;seq;t0=0;spinning=!1;period;fall;top;bottom;falls;lands;layered=-1;constructor(e,t,a,r){this.drum=e,this.seq=[t];const n=1+(2*r()-1)*a.jitter;this.period=a.period*n,this.fall=Math.min(this.period,a.fall*(1+(2*r()-1)*a.jitter*.6)),this.el=document.createElement("div"),this.el.className="sf-cell",this.top=new j("sf-h sf-t",this.el,!0),this.bottom=new j("sf-h sf-b",this.el,!0),this.falls=[new j("sf-h sf-t sf-fall",this.el,!1),new j("sf-h sf-t sf-fall",this.el,!1)],this.lands=[new j("sf-h sf-b sf-land",this.el,!1,"light"),new j("sf-h sf-b sf-land",this.el,!1,"light")],this.top.glyph(t),this.bottom.glyph(t)}get target(){return this.seq[this.seq.length-1]}started(e){let t=this.seq.length-1;return t<=0||e<this.t0?0:Math.min(t,Math.floor((e-this.t0)/this.period)+1)}landed(e){let t=this.seq.length-1;if(t<=0)return 0;let a=Math.floor((e-this.t0-this.fall)/this.period)+1;return a<0?0:a>t?t:a}path(e,t){let a=this.drum.length,r=Math.max(0,this.drum.indexOf(e));return Array.from({length:(Math.max(0,this.drum.indexOf(t))-r+a)%a},(e,t)=>this.drum[(r+1+t)%a])}next(e){let t=Math.max(0,this.drum.indexOf(e));return this.drum[(t+1)%this.drum.length]}angle(e,t){if(e<=0)return 0;if(e<this.fall)return 180*Math.pow(e/this.fall,1.55);let a=e-this.fall;return 180-t.bounce*Math.exp(-a/t.decay)*Math.abs(Math.sin(Math.PI*a/t.bounceTime))}draw(e,t){let a,r=this.seq.length-1,n=this.started(e),s=this.fall+t.settle,i=-1,l=-1,o=this.bottom,c=0,h=!1,u=!1;for(let a=Math.max(1,n-1);a<=n;a++){let r=e-(this.t0+(a-1)*this.period);if(r<0||r>=s)continue;let d=1&a;d?u=!0:h=!0,i<0&&(i=a);let f=this.angle(r,t),p=this.falls[d],g=this.lands[d];if(p.glyph(this.seq[a-1]),g.glyph(this.seq[a]),f<90)p.show(!0),g.show(!1),p.rotate(`rotateX(${(-f).toFixed(2)}deg)`),p.setShade(.78*Math.pow(f/90,1.35));else{p.show(!1),g.show(!0),g.rotate(`rotateX(${(180-f).toFixed(2)}deg)`);let e=.3*Math.sin((180-f)/90*(Math.PI/2));g.setShade(e),a!==n&&(c=e)}a===n?l=f:o=g}h||(this.falls[0].show(!1),this.lands[0].show(!1)),u||(this.falls[1].show(!1),this.lands[1].show(!1));let d=1&n;d!==this.layered&&(this.layered=d,this.falls[d].layer(3),this.lands[d].layer(3),this.falls[1^d].layer(2),this.lands[1^d].layer(2)),this.top.glyph(this.seq[n]),this.bottom.glyph(this.seq[i>0?i-1:n]),this.top.setShade(l>=0&&l<90?.5*(1-l/90):0);let f=l>50?.55*Math.sin(Math.PI*((a=(l-50)/130)<0?0:a>1?1:a)):0;o===this.bottom?this.bottom.setShade(f):(this.bottom.setShade(0),o.setShade(Math.max(0,c-f)));let p=!this.spinning&&n>=r&&(0===r||e-(this.t0+(r-1)*this.period)>=s);return p&&this.rest(this.seq[r],e),!p}rebase(e){let t=this.started(e);if(t<=4)return;let a=t-1&-2;this.seq.splice(0,a),this.t0+=a*this.period}rest(e,t){this.seq=[e],this.t0=t,this.spinning=!1;for(let e=0;e<2;e++)this.falls[e].show(!1),this.lands[e].show(!1);this.top.glyph(e),this.bottom.glyph(e),this.top.setShade(0),this.bottom.setShade(0)}}class R{time=0;timing;active=new Set;random;constructor(e,t=Math.random){this.timing=e,this.random=t}create(e,t){return new T(e,t,this.timing,this.random)}release(e){this.active.delete(e),e.el.remove()}get busy(){return this.active.size>0}turning(e){return this.active.has(e)}set(e,t,a=0){if(!this.active.has(e)){let r=e.seq[0];if(r.ch===t.ch){r.tone!==t.tone&&e.rest(t,this.time);return}e.seq=[r,...e.path(r.ch,t.ch).map(e=>({ch:e,tone:t.tone}))],e.t0=this.time+a,this.active.add(e);return}let r=e.started(this.time),n=e.seq[r],s=e.path(n.ch,t.ch).map(e=>({ch:e,tone:t.tone}));e.seq=e.seq.slice(0,r+1).concat(s),s.length||n.tone===t.tone||(e.seq[r]=t)}place(e,t){this.active.delete(e),e.rest(t,this.time)}nudge(e){let t=e.target;this.set(e,{ch:e.next(t.ch),tone:t.tone})}spin(e,t){e.spinning=t,t&&this.nudge(e)}step(e){let t=this.time;this.time+=e;let a=this.time,r=0,n=0;for(let e of this.active){if(e.spinning&&e.seq.length-1-e.started(a)<2){let t=e.target;e.seq.push({ch:e.next(t.ch),tone:t.tone})}let s=e.landed(a)-e.landed(t);s>0&&(r+=s,n+=e.pan*s),e.spinning&&e.rebase(a),e.draw(a,this.timing)||this.active.delete(e)}return{busy:this.active.size>0,landings:r,pan:r?n/r:0}}}let A=(e=Math.random,t=.024,a=.07)=>(r,n)=>n*t+r*a+.03*e();class E{engine;container;withLamps;rows;cols;fresh;cells;rowEls;lamps;lookup;pendingLamps;constructor(e,t,a=!1){this.engine=e,this.container=t,this.withLamps=a,this.rows=0,this.cols=0,this.fresh=!0,this.cells=[],this.rowEls=[],this.lamps=[],this.lookup=new WeakMap,this.pendingLamps=[]}resize(e,t){if(e!==this.rows||t!==this.cols){if(t!==this.cols){for(;this.rowEls.length;)this.dropRow();this.cols=t}for(;this.rowEls.length>e;)this.dropRow();for(;this.rowEls.length<e;)this.addRow();this.rows=e}}addRow(){let e=document.createElement("div");e.className="sf-row";let t=[];for(let a=0;a<this.cols;a++){let r=this.engine.create(u,f);r.pan=this.cols>1?a/(this.cols-1)*2-1:0,this.lookup.set(r.el,r),e.appendChild(r.el),t.push(r)}if(this.withLamps){let t=document.createElement("span");t.className="sf-lamp",e.appendChild(t),this.lamps.push(t)}this.container.appendChild(e),this.rowEls.push(e),this.cells.push(t)}dropRow(){let e=this.rowEls.pop(),t=this.cells.pop();t?.forEach(e=>this.engine.release(e)),this.lamps.pop(),e?.remove()}show(e,{instant:t=!1,stagger:a=A()}={}){this.fresh=!1;for(let r=0;r<this.rows;r++)for(let n=0;n<this.cols;n++){let s=this.cells[r][n],i=e[r]?.[n]??f;t?this.engine.place(s,i):this.engine.set(s,i,a(r,n))}}setLamps(e){this.pendingLamps=[],this.lamps.forEach((t,a)=>{let r=e[a],n="green"===r||"amber"===r?r:"";this.rowTurning(a)?(delete t.dataset.tone,this.pendingLamps[a]=n):N(t,n)})}updateLamps(){for(let e=0;e<this.pendingLamps.length;e++){let t=this.pendingLamps[e];if(void 0===t||this.rowTurning(e))continue;this.pendingLamps[e]=void 0;let a=this.lamps[e];a&&N(a,t)}}rowTurning(e){let t=this.cells[e];if(!t)return!1;for(let e of t)if(this.engine.turning(e))return!0;return!1}cellAt(e){let t=e?.closest?.(".sf-cell");return t?this.lookup.get(t):void 0}positionOf(e){for(let t=0;t<this.cells.length;t++){let a=this.cells[t].indexOf(e);if(a>=0)return{row:t,col:a}}return null}destroy(){for(this.pendingLamps=[];this.rowEls.length;)this.dropRow()}}function N(e,t){(e.dataset.tone??"")!==t&&(t?e.dataset.tone=t:delete e.dataset.tone)}let S=0;function C({gain:e,pan:t,delay:a=0,bright:r=1}){let s=(0,n.getAudio)();if(!s||!(0,n.audioReady)())return;let{ctx:i,output:l}=s,o=i.currentTime+.004+a,c=Math.random,h=l;if("function"==typeof i.createStereoPanner){let e=i.createStereoPanner();e.pan.value=Math.max(-1,Math.min(1,.7*t+(c()-.5)*.1)),e.connect(l),h=e}let u=i.createBufferSource();u.buffer=(0,n.noiseBuffer)(i);let d=i.createBiquadFilter();d.type="bandpass",d.frequency.value=(2300+1300*c())*r,d.Q.value=.9+.6*c();let f=i.createBiquadFilter();f.type="highpass",f.frequency.value=700;let p=i.createGain(),g=.016+.012*c();p.gain.setValueAtTime(1e-4,o),p.gain.exponentialRampToValueAtTime(e,o+7e-4),p.gain.exponentialRampToValueAtTime(1e-4,o+g),u.connect(f).connect(d).connect(p).connect(h),u.start(o,.9*c(),.05),u.stop(o+.05);let m=i.createOscillator();m.type="triangle";let b=(2900+900*c())*r;m.frequency.setValueAtTime(b,o),m.frequency.exponentialRampToValueAtTime(.55*b,o+.008);let v=i.createGain();v.gain.setValueAtTime(1e-4,o),v.gain.exponentialRampToValueAtTime(.22*e,o+4e-4),v.gain.exponentialRampToValueAtTime(1e-4,o+.007),m.connect(v).connect(h),m.start(o),m.stop(o+.02);let w=i.createOscillator();w.type="sine";let x=150+50*c();w.frequency.setValueAtTime(x,o),w.frequency.exponentialRampToValueAtTime(.6*x,o+.03);let y=i.createGain();y.gain.setValueAtTime(1e-4,o),y.gain.exponentialRampToValueAtTime(.5*e,o+.002),y.gain.exponentialRampToValueAtTime(1e-4,o+.035),w.connect(y).connect(h),w.start(o),w.stop(o+.05)}function q(e,t,a=1){if(e<=0||!(0,n.audioReady)())return;let r=performance.now();if(r-S<14)return;S=r;let s=.32*Math.min(1,.42+.16*Math.log2(1+e))*a*(.85+.3*Math.random());C({gain:s,pan:t}),e>6&&C({gain:.6*s,pan:-(.5*t)+(Math.random()-.5)*.6,delay:.006+.006*Math.random(),bright:.85})}let L=`
.sf {
  --h: calc(var(--u) * 1.44);
  --gx: calc(var(--u) * 0.12);
  --gy: calc(var(--u) * 0.2);
  --fs: calc(var(--u) * 1.04);
  --r: max(1.5px, calc(var(--u) * 0.085));
  --sf-gap: #050505;
  --sf-ink: #f2f2f2;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* ---- one cell ---------------------------------------------------------- */

.sf-cell {
  position: relative;
  flex: none;
  width: var(--u);
  height: var(--h);
  border-radius: var(--r);
  background: var(--sf-gap);
  perspective: calc(var(--h) * 3.4);
  box-shadow: 0 calc(var(--u) * 0.05) calc(var(--u) * 0.1) rgb(0 0 0 / 0.6);
  contain: layout style;
}
/* axle notches: the hinge gap opens wider at both ends */
.sf-cell::after {
  content: "";
  position: absolute;
  z-index: 9;
  inset-inline: 0;
  top: calc(50% - var(--u) * 0.07);
  height: calc(var(--u) * 0.14);
  background: linear-gradient(90deg, var(--sf-gap) 0 calc(var(--u) * 0.06), transparent 0 calc(100% - var(--u) * 0.06), var(--sf-gap) 0);
  pointer-events: none;
}
.sf-h {
  position: absolute;
  inset-inline: 0;
  overflow: hidden;
  color: var(--sf-ink);
}
.sf-t {
  top: 0;
  height: calc(50% - 0.5px);
  border-radius: var(--r) var(--r) 0.5px 0.5px;
  background: linear-gradient(180deg, #2b2b2b 0%, #252525 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.07), inset 0 -1px 0 rgb(0 0 0 / 0.35);
  transform-origin: 50% calc(100% + 0.5px);
}
.sf-b {
  bottom: 0;
  height: calc(50% - 0.5px);
  border-radius: 0.5px 0.5px var(--r) var(--r);
  background: linear-gradient(180deg, #212121 0%, #1b1b1b 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.045);
  transform-origin: 50% -0.5px;
}
/*
 * The letter. Geist has no width axis, so the drum face is condensed with a
 * horizontal scale (0.88), and the three widest glyphs are drawn narrower
 * still, as flap typefaces do, so even W keeps an eighth of the flap clear on
 * each side. Geist's capitals already sit centred on the line, so --oy (the
 * measured cap-height correction) is ~0 unless a fallback font is in use.
 */
.sf-h::before {
  content: attr(data-c);
  position: absolute;
  inset-inline: 0;
  height: var(--h);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: var(--fs);
  line-height: var(--h);
  text-align: center;
  white-space: pre;
  translate: 0 var(--oy, 0em);
  scale: var(--sx, 0.88) 1;
}
.sf-h[data-c="M"] { --sx: 0.84; }
.sf-h[data-c="W"] { --sx: 0.74; }
.sf-h[data-c="@"] { --sx: 0.78; }
.sf-t::before { top: 0; }
.sf-b::before { bottom: 0; }
.sf-h::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: var(--s, 0);
  pointer-events: none;
}
.sf-t::after { background: linear-gradient(0deg, rgb(0 0 0 / 0.94), rgb(0 0 0 / 0.58)); }
.sf-b::after { background: linear-gradient(180deg, rgb(0 0 0 / 0.92), rgb(0 0 0 / 0.26)); }
.sf-h[data-o="l"]::after { background: linear-gradient(180deg, rgb(255 255 255 / 0.46), rgb(255 255 255 / 0.04)); }
.sf-h[data-t="green"] { color: #3fcf6e; }
.sf-h[data-t="amber"] { color: #e3b341; }
.sf-h[data-t="muted"] { color: #9c9c9c; }

.sf-grid { display: flex; flex-direction: column; gap: var(--gy); }
.sf-row { display: flex; align-items: center; gap: var(--gx); }
.sf-grid[data-touch] .sf-cell { cursor: pointer; }
@media (hover: hover) {
  .sf-grid[data-touch] .sf-cell:hover > .sf-t:not(.sf-fall) { background: linear-gradient(180deg, #313131 0%, #2a2a2a 100%); }
  .sf-grid[data-touch] .sf-cell:hover > .sf-b:not(.sf-land) { background: linear-gradient(180deg, #252525 0%, #1e1e1e 100%); }
}

/* ---- the bay ----------------------------------------------------------- */

.sf-bay {
  position: relative;
  padding: calc(var(--u) * 0.3);
  border-radius: calc(var(--u) * 0.2);
  background: linear-gradient(180deg, #0d0d0d, #090909);
  box-shadow: inset 0 calc(var(--u) * 0.1) calc(var(--u) * 0.3) rgb(0 0 0 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.7),
    0 1px 0 var(--sf-lip, rgb(255 255 255 / 0.06));
}
/* a hairline rim set into the housing around every bay */
.sf-housing .sf-bay::before {
  content: "";
  position: absolute;
  inset: calc(var(--u) * -0.1);
  border-radius: calc(var(--u) * 0.28);
  box-shadow: 0 0 0 1px var(--sf-rim);
  pointer-events: none;
}
.sf-housing .sf-clockbay::before { border-radius: calc(var(--u) * 0.24); }
.sf-bay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 20;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.045), transparent 24%, transparent 68%, rgb(0 0 0 / 0.24));
}

/* keyboard: the bay is one focusable board; a ring marks the chosen flap */
.sf-bay[tabindex] { outline: none; }
.sf-bay[tabindex]:focus-visible,
.sf-bay[data-kbd]:focus {
  outline: 2px solid var(--foreground);
  outline-offset: calc(var(--u) * 0.16);
}
.sf-bay:focus-visible .sf-cell[data-cursor],
.sf-bay[data-kbd]:focus .sf-cell[data-cursor] {
  z-index: 1;
  outline: max(1.5px, calc(var(--u) * 0.07)) solid rgb(255 255 255 / 0.92);
  outline-offset: max(1px, calc(var(--u) * 0.05));
}

/* ---- lamps ------------------------------------------------------------- */

.sf-lamp {
  flex: none;
  width: calc(var(--u) * 0.24);
  height: calc(var(--u) * 0.24);
  margin-inline-start: calc(var(--u) * 0.24);
  border-radius: 50%;
  background: radial-gradient(circle at 40% 34%, #3a3a3a, #161616 72%);
  box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.7), 0 1px 0 rgb(255 255 255 / 0.05);
}
.sf-lamp[data-tone="green"] {
  background: radial-gradient(circle at 38% 32%, #eafff0, #3fcf6e 42%, #157a37 100%);
  box-shadow: 0 0 calc(var(--u) * 0.36) rgb(63 207 110 / 0.55), 0 0 calc(var(--u) * 0.1) rgb(63 207 110 / 0.9);
}
.sf-lamp[data-tone="amber"] {
  background: radial-gradient(circle at 38% 32%, #fff5da, #e3b341 42%, #8a6512 100%);
  box-shadow: 0 0 calc(var(--u) * 0.36) rgb(227 179 65 / 0.55), 0 0 calc(var(--u) * 0.1) rgb(227 179 65 / 0.9);
  animation: sf-breathe 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
}
@keyframes sf-breathe { 50% { opacity: 0.38; } }

/* ---- the housing -------------------------------------------------------- */

.sf-board {
  position: absolute;
  left: 0;
  top: 0;
  width: max-content;
  opacity: 0;
}
.sf-board[data-ready] { opacity: 1; }
.sf-housing {
  position: relative;
  padding: calc(var(--u) * 0.5) calc(var(--u) * 0.66) calc(var(--u) * 0.66);
  border-radius: min(12px, calc(var(--u) * 0.34));
}
.sf-housing[data-theme="light"] {
  --sf-label: #6b6b6b;
  --sf-label-strong: #2a2a2a;
  --sf-lip: rgb(255 255 255 / 0.9);
  --sf-rim: rgb(0 0 0 / 0.1);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.6), transparent 60%),
    linear-gradient(180deg, #fdfdfd 0%, #f1f1f1 55%, #e8e8e8 100%);
  box-shadow: inset 0 1px 0 #ffffff, inset 0 0 0 1px rgb(0 0 0 / 0.06), inset 0 -2px 0 rgb(0 0 0 / 0.045),
    0 0 0 0.5px rgb(0 0 0 / 0.06), 0 1px 1px rgb(0 0 0 / 0.1),
    0 calc(var(--u) * 0.5) calc(var(--u) * 0.9) calc(var(--u) * -0.3) rgb(0 0 0 / 0.18),
    0 calc(var(--u) * 1.6) calc(var(--u) * 2.6) calc(var(--u) * -1.2) rgb(0 0 0 / 0.28);
}
.sf-housing[data-theme="dark"] {
  --sf-label: #9c9c9c;
  --sf-label-strong: #e6e6e6;
  --sf-lip: rgb(255 255 255 / 0.06);
  --sf-rim: rgb(255 255 255 / 0.07);
  background:
    radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.05), transparent 60%),
    linear-gradient(180deg, #2e2e2e 0%, #252525 55%, #1e1e1e 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.11), inset 0 0 0 1px rgb(255 255 255 / 0.05),
    inset 0 -2px 0 rgb(0 0 0 / 0.3), 0 0 0 1px rgb(0 0 0 / 0.42),
    0 calc(var(--u) * 0.5) calc(var(--u) * 0.9) calc(var(--u) * -0.3) rgb(0 0 0 / 0.5),
    0 calc(var(--u) * 1.6) calc(var(--u) * 2.6) calc(var(--u) * -1.2) rgb(0 0 0 / 0.66);
}

.sf-screw {
  --i: calc(var(--u) * 0.2);
  position: absolute;
  width: calc(var(--u) * 0.26);
  height: calc(var(--u) * 0.26);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff, #c9c9c9 45%, #8a8a8a 100%);
  box-shadow: 0 0.5px 0 rgb(255 255 255 / 0.8), inset 0 0 0 0.5px rgb(0 0 0 / 0.35);
}
.sf-screw[data-p="tl"] { left: var(--i); top: var(--i); }
.sf-screw[data-p="tr"] { right: var(--i); top: var(--i); }
.sf-screw[data-p="bl"] { left: var(--i); bottom: var(--i); }
.sf-screw[data-p="br"] { right: var(--i); bottom: var(--i); }
.sf-housing[data-theme="dark"] .sf-screw {
  background: radial-gradient(circle at 35% 30%, #8f8f8f, #4a4a4a 50%, #262626 100%);
  box-shadow: 0 0.5px 0 rgb(255 255 255 / 0.07), inset 0 0 0 0.5px rgb(0 0 0 / 0.6);
}
.sf-screw::after {
  content: "";
  position: absolute;
  left: 18%;
  right: 18%;
  top: calc(50% - 0.5px);
  height: 1px;
  background: rgb(0 0 0 / 0.45);
  rotate: var(--a, 30deg);
}
.sf-housing[data-theme="dark"] .sf-screw::after { background: rgb(0 0 0 / 0.65); }

.sf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u) * 0.8);
  min-height: calc(var(--u) * 1.62);
  padding-inline: calc(var(--u) * 0.16) 0;
  margin-bottom: calc(var(--u) * 0.18);
}
.sf-title { display: flex; align-items: center; gap: calc(var(--u) * 0.3); min-width: 0; }
.sf-title svg { width: calc(var(--u) * 0.52); height: calc(var(--u) * 0.52); color: var(--sf-label); flex: none; }
.sf-departs {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: calc(var(--u) * 0.78);
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--sf-label-strong);
  white-space: nowrap;
}
.sf-caps {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: max(7px, calc(var(--u) * 0.3));
  line-height: 1;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--sf-label);
  white-space: nowrap;
}
.sf-title .sf-caps { align-self: flex-end; padding-bottom: calc(var(--u) * 0.12); margin-inline-start: calc(var(--u) * 0.08); }
.sf-clock { display: flex; align-items: center; gap: calc(var(--u) * 0.42); }
.sf-place { display: flex; flex-direction: column; align-items: flex-end; gap: calc(var(--u) * 0.16); }
.sf-arabic {
  font-size: calc(var(--u) * 0.44);
  line-height: 1;
  color: var(--sf-label);
}
.sf-clockbay { display: flex; align-items: center; gap: var(--gx); padding: calc(var(--u) * 0.16); border-radius: calc(var(--u) * 0.16); }
.sf-colon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u) * 0.32);
  width: calc(var(--u) * 0.22);
}
.sf-colon::before, .sf-colon::after {
  content: "";
  width: calc(var(--u) * 0.11);
  height: calc(var(--u) * 0.11);
  border-radius: 50%;
  background: var(--sf-ink);
  opacity: 0.85;
}
.sf-cols {
  display: flex;
  justify-content: space-between;
  padding: 0 calc(var(--u) * 1.04) calc(var(--u) * 0.24) calc(var(--u) * 0.34);
  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);
}
.sf-cols[data-off] { opacity: 0; }

/* ---- the tile: the same object in miniature ----------------------------- */

.sf-tile {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.sf-mini {
  position: absolute;
  left: 50%;
  top: 50%;
  width: max-content;
  translate: -50% -52%;
  padding: calc(var(--u) * 0.24) calc(var(--u) * 0.5) calc(var(--u) * 0.5);
  border-radius: min(10px, calc(var(--u) * 0.36));
}
.sf-mini .sf-screw { --i: calc(var(--u) * 0.15); width: calc(var(--u) * 0.22); height: calc(var(--u) * 0.22); }
.sf-mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--u) * 0.98);
  padding-inline: calc(var(--u) * 0.2) calc(var(--u) * 0.22);
}
.sf-mini-head .sf-caps { font-size: max(6px, calc(var(--u) * 0.36)); letter-spacing: 0.22em; }
.sf-mini-head .sf-lamp { margin: 0; width: calc(var(--u) * 0.26); height: calc(var(--u) * 0.26); }

@media (prefers-reduced-motion: reduce) {
  .sf-lamp[data-tone] { animation: none; }
  .sf-cols { transition: none; }
  .sf-board { transition: none !important; }
}
`;function B(){try{let e=getComputedStyle(document.body).fontFamily,t=document.createElement("canvas").getContext("2d");if(!t||!e)return 0;t.font=`600 100px ${e}`;let a=t.measureText("H"),r=a.fontBoundingBoxAscent,n=a.fontBoundingBoxDescent,s=a.actualBoundingBoxAscent;if(!r||!s)return 0;return Math.round((s-r+n)/2/100*1e3)/1e3}catch{return 0}}function $(){let[e,t]=(0,a.useState)(0);return(0,a.useEffect)(()=>{let e=!0;return t(B()),document.fonts?.ready.then(()=>e&&t(B())).catch(()=>{}),()=>{e=!1}},[]),e}function D(e,t){e&&e.hasAttribute("data-moving")!==t&&e.toggleAttribute("data-moving",t)}function I(e,t){e&&("green"===t||"amber"===t?e.dataset.tone=t:delete e.dataset.tone)}let P=[{at:"tl",angle:"28deg"},{at:"tr",angle:"-52deg"},{at:"bl",angle:"74deg"},{at:"br",angle:"12deg"}];function z(){return(0,t.jsx)(t.Fragment,{children:P.map(({at:e,angle:a})=>(0,t.jsx)("span",{"aria-hidden":"true",className:"sf-screw","data-p":e,style:{"--a":a}},e))})}let O=(e,t,a)=>`Row ${e+1}, column ${t+1}: ${" "===a.target.ch?"blank":a.target.ch}`;function F({active:e,reducedMotion:o,theme:h}){let u=(0,a.useRef)(null),m=(0,a.useRef)(null),b=(0,a.useRef)(null),x=(0,a.useRef)(null),y=(0,a.useRef)(null),M=(0,a.useRef)(null),[j]=(0,a.useState)(()=>new R(k)),T=(0,a.useRef)(null),N=(0,a.useRef)([]),S=(0,a.useRef)(0),C=(0,a.useRef)(0),L=(0,a.useRef)({key:"",u:0}),B=(0,a.useRef)({row:0,col:0}),I=(0,a.useRef)(null),[P,V]=(0,a.useState)(0),[G,K]=(0,a.useState)(0),[U,W]=(0,a.useState)(!1),[H,X]=(0,a.useState)(""),[Z,Q]=(0,a.useState)(null),[Y,J]=(0,a.useState)(0),[_,ee]=(0,a.useState)(null),[et,ea]=(0,a.useState)(""),er=$(),en=(0,a.useId)(),es=(0,a.useRef)(-1e9),ei=(0,a.useRef)(0),el=(0,s.useFrame)(e,e=>{let t=j.step(e);return t.landings&&q(t.landings,t.pan,performance.now()-es.current<6e3?1:.35),T.current?.updateLamps(),D(m.current,t.busy),!!t.busy&&void 0});(0,s.useIsoLayoutEffect)(()=>{let e=y.current,t=M.current;if(!e||!t)return;let a=new E(j,e,!0);T.current=a;let r=d.map(e=>j.create(e,{ch:"0",tone:"ink"}));return r.forEach((e,a)=>{if(e.pan=.85,2===a){let e=document.createElement("span");e.className="sf-colon",t.appendChild(e)}t.appendChild(e.el)}),N.current=r,()=>{a.destroy(),r.forEach(e=>j.release(e)),t.replaceChildren(),T.current=null,N.current=[],I.current=null}},[j]);let eo=(0,a.useCallback)(()=>{let e=T.current;if(!e||!e.rows||!e.cols)return null;let t=B.current;t.row=Math.max(0,Math.min(e.rows-1,t.row)),t.col=Math.max(0,Math.min(e.cols-1,t.col));let a=e.cells[t.row][t.col];return I.current!==a.el&&(I.current?.removeAttribute("data-cursor"),a.el.setAttribute("data-cursor",""),I.current=a.el),a},[]),ec=(0,a.useCallback)((e=!1)=>{let t=u.current,a=m.current,r=b.current,n=T.current;if(!t||!a||!r||!n)return;let s=t.clientWidth,i=t.clientHeight;if(!s||!i)return;let l=s<520,o=l?12:Math.max(40,Math.round(.06*s)),c=s-2*o,h=c>=1240?30:c>=960?26:c>=740?22:c>=520?18:16,d=Math.max(3,Math.min(6,v(h).length));S.current||(S.current=d,K(d));let f=S.current;n.resize(f,h),eo(),V(h),W(h<=16);let p=t.getBoundingClientRect().top,g=i;t.querySelectorAll(":scope > [data-lab-controls]").forEach(e=>{let t=e.getBoundingClientRect();t.height&&(g=Math.min(g,t.top-p))}),a.style.setProperty("--u","20px");let w=r.getBoundingClientRect(),x=w.width,y=w.height,k=l?14:22,M=g-2*k,j=e=>20*Math.min(c/x,M/e),R=`${s}:${i}:${Math.round(g)}:${h}`;L.current.key!==R&&(L.current={key:R,u:j(y+(d-f)*32.8)});let A=Math.max(8,Math.min(64,Math.floor(4*Math.min(j(y),L.current.u))/4));a.style.setProperty("--u",`${A}px`);let E=y*A/20;a.style.transition=e&&A===C.current?"top 300ms cubic-bezier(0.23, 1, 0.32, 1)":"none",C.current=A,a.style.left=`${Math.round((s-x*A/20)/2)}px`,a.style.top=`${Math.round(k+Math.max(0,(M-E)/2))}px`,a.dataset.ready=""},[eo]);(0,s.useIsoLayoutEffect)(()=>{let e=u.current;if(!e)return;ec();let t=new ResizeObserver(()=>ec());return t.observe(e),e.querySelectorAll(":scope > [data-lab-controls]").forEach(e=>t.observe(e)),document.fonts?.ready.then(()=>ec()).catch(()=>{}),()=>t.disconnect()},[ec]),(0,s.useIsoLayoutEffect)(()=>{if(!G)return;let e=0!==S.current&&S.current!==G;S.current=G,ec(e)},[G,ec]);let eh=(0,a.useMemo)(()=>P?v(P):[],[P]),eu=(0,a.useMemo)(()=>Array.from({length:G},(e,t)=>eh.length&&t<eh.length?eh[(Y+t)%eh.length]:void 0),[eh,Y,G]);(0,a.useEffect)(()=>{let e=T.current;e&&P&&G&&e.cols===P&&e.rows===G&&(Z?(e.show(function(e,t,a){let r=p(e).trim().split(/\s+/).filter(Boolean),n=function(e,t){let a=[],r="";for(let n of e){let e=n;for(;e.length>t;)r&&(a.push(r),r=""),a.push(e.slice(0,t)),e=e.slice(t);e&&(r?r.length+1+e.length<=t?r+=` ${e}`:(a.push(r),r=e):r=e)}return r&&a.push(r),a}(r,a);if(n.length>1&&n.length<=t)n=g(r,n.length,a)??n;else if(1===n.length&&r.length>=2){let e=t%2==0?2:t>=5&&r.length>=3?3:1;e>1&&(n=g(r,e,a)??n)}let s=n.slice(0,t),i=Math.floor((t-s.length)/2);return Array.from({length:t},(e,t)=>{let r=s[t-i]??"",n=Math.floor((a-r.length)/2);return Array.from({length:a},(e,t)=>({ch:r[t-n]??" ",tone:"ink"}))})}(Z.text,G,P),{instant:o,stagger:A(Math.random,.022,.06)}),e.setLamps([])):(e.show(eu.map(e=>(function(e,t){let a=Array.from({length:t},()=>f);if(!e)return a;for(let r=0;r<e.name.length&&r<t;r++)a[r]={ch:e.name[r],tone:"ink"};let r=t-e.remark.length;for(let t=0;t<e.remark.length;t++)a[r+t]={ch:e.remark[t],tone:e.tone};return a})(e,P)),{instant:o}),e.setLamps(eu.map(e=>e?.tone??null))),el())},[P,G,Z,eu,o,el]),(0,a.useEffect)(()=>{if(!e)return;let t=0,a=()=>{let e=function(e){if(!e)return null;let[t,a]=c.format(new Date(1e3*e)).split(":");return{hh:t,mm:a}}(Math.floor(Date.now()/1e3));if(!e)return;let a=e.hh+e.mm;N.current.forEach((e,t)=>{let r={ch:a[t],tone:"ink"};e.target.ch!==r.ch&&(o?j.place(e,r):j.set(e,r,.35+.06*t))}),ee(`${e.hh}:${e.mm}`),el(),performance.now()-es.current>8e3&&(t+=1),o||Z||!(t>=14)||(t=0,J(e=>e+1))};a();let r=window.setInterval(a,1e3);return()=>window.clearInterval(r)},[e,o,Z,j,el]);let ed=()=>{(0,n.ensureAudio)(),es.current=performance.now()},ef=e=>{ed();let t=p(e).replace(/\s+/g," ").trim();if(!t){Q(null),ea("Back to the departures.");return}Q({text:t,key:performance.now()}),ea(`The board turns to: ${t.toLowerCase()}`)},ep=()=>{ed(),X(""),Q(null),ea("Back to the departures.")},eg=e=>{if(!o)return void j.nudge(e);let t=e.target;j.place(e,{ch:e.next(t.ch),tone:t.tone}),q(1,e.pan)},em=(e,t)=>{ed();let a={ch:t,tone:"ink"};o?(e.target.ch!==t||"ink"!==e.target.tone)&&(j.place(e,a),q(1,e.pan)):j.set(e,a),el()},eb=(0,a.useRef)(null),ev=e=>{let t=eb.current;t&&t.id===e.pointerId&&(window.clearTimeout(t.timer),j.spin(t.cell,!1),eb.current=null)},ew=(0,a.useRef)(null),ex=()=>{let e=ew.current;if(!e)return;window.clearTimeout(e.timer),j.spin(e.cell,!1),ew.current=null,el();let t=T.current?.positionOf(e.cell);t&&ea(O(t.row,t.col,e.cell))};(0,a.useEffect)(()=>()=>{eb.current&&window.clearTimeout(eb.current.timer),ew.current&&window.clearTimeout(ew.current.timer)},[]);let ey=Math.max(16,(G||6)*(P||26)),ek=Z?`It reads: ${Z.text.toLowerCase()}.`:`${_?`${_} in Casablanca. `:""}${eu.filter(e=>!!e).map(e=>`${e.name.toLowerCase()}, ${e.remark.toLowerCase()}`).join("; ")}.`,eM=P>=18;return(0,t.jsxs)("div",{ref:u,className:"absolute inset-0 overflow-hidden",onPointerDownCapture:()=>(0,n.ensureAudio)(),onKeyDownCapture:()=>(0,n.ensureAudio)(),children:[(0,t.jsx)("div",{ref:m,className:"sf sf-board","data-narrow":U?"":void 0,style:{"--oy":`${er}em`},children:(0,t.jsxs)("div",{ref:b,className:"sf-housing","data-theme":h,children:[(0,t.jsx)(z,{}),(0,t.jsxs)("div",{className:"sf-head","aria-hidden":"true",children:[(0,t.jsxs)("div",{className:"sf-title",children:[(0,t.jsx)(r.Logo,{size:14}),(0,t.jsx)("span",{className:"sf-departs",children:"Départs"}),eM?(0,t.jsx)("span",{className:"sf-caps",children:"Departures"}):null]}),(0,t.jsxs)("div",{className:"sf-clock",children:[(0,t.jsxs)("div",{className:"sf-place",children:[eM?(0,t.jsx)("span",{className:"sf-arabic",lang:"ar",dir:"rtl",children:"الدار البيضاء"}):null,(0,t.jsx)("span",{className:"sf-caps",children:"Casablanca"})]}),(0,t.jsx)("div",{ref:M,className:"sf-bay sf-clockbay"})]})]}),(0,t.jsxs)("div",{className:"sf-cols","aria-hidden":"true","data-off":Z?"":void 0,children:[(0,t.jsx)("span",{className:"sf-caps",children:"Destination"}),(0,t.jsx)("span",{className:"sf-caps",children:"Remarks"})]}),(0,t.jsx)("div",{ref:x,className:"sf-bay",tabIndex:0,role:"application","aria-roledescription":"split-flap board","aria-label":"Departures board","aria-describedby":`${en}-board ${en}-keys`,onKeyDown:e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.nativeEvent.isComposing)return;let t=T.current;if(!t||!t.rows||!t.cols)return;let a=B.current,r=(e,t)=>{a.row=e,a.col=t;let r=eo();r&&ea(O(a.row,a.col,r))},n=e.key;switch(n){case"ArrowLeft":r(a.row,a.col-1);break;case"ArrowRight":r(a.row,a.col+1);break;case"ArrowUp":r(a.row-1,a.col);break;case"ArrowDown":r(a.row+1,a.col);break;case"Home":r(a.row,0);break;case"End":r(a.row,t.cols-1);break;case" ":case"Enter":{if(e.repeat||ew.current)break;let t=eo();if(!t)break;ed(),eg(t);let a=o?0:window.setTimeout(()=>{j.spin(t,!0),el()},340);ew.current={cell:t,timer:a},el();break}case"Escape":if(!Z)return;ep();break;case"Backspace":{a.col>0?a.col-=1:a.row>0&&(a.row-=1,a.col=t.cols-1);let e=eo();e&&em(e," ");break}case"Delete":{let e=eo();e&&em(e," ");break}default:{if(1!==n.length)return;let e=p(n),r=e.trim()?eo():null;if(!r)return;em(r,e),a.col<t.cols-1?a.col+=1:a.row<t.rows-1&&(a.row+=1,a.col=0),eo()}}e.currentTarget.setAttribute("data-kbd",""),e.preventDefault()},onKeyUp:e=>{(" "===e.key||"Enter"===e.key)&&ex()},onBlur:ex,children:(0,t.jsx)("div",{ref:y,"aria-hidden":"true",className:"sf-grid","data-touch":"",style:{touchAction:"pan-y"},...{onPointerDown(e){if(e.button>0||eb.current)return;let t=T.current,a=t?.cellAt(e.target);if(!t||!a)return;ed(),x.current?.removeAttribute("data-kbd");let r=t.positionOf(a);r&&(B.current=r,eo());try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}eg(a);let n=o?0:window.setTimeout(()=>{j.spin(a,!0),el()},340);eb.current={id:e.pointerId,cell:a,timer:n},el()},onPointerMove(e){let t=eb.current;if(!t||t.id!==e.pointerId)return;let a=T.current?.cellAt(document.elementFromPoint(e.clientX,e.clientY));a&&a!==t.cell&&(window.clearTimeout(t.timer),j.spin(t.cell,!1),eg(a),t.cell=a,es.current=performance.now(),el())},onPointerUp:ev,onPointerCancel:ev,onLostPointerCapture:ev}})})]})}),(0,t.jsx)("p",{id:`${en}-board`,className:"sr-only",children:ek}),(0,t.jsxs)("p",{id:`${en}-keys`,className:"sr-only",children:["Arrow keys choose a flap. Space or Enter turns it; hold to keep it turning. Type a letter or figure to set the flap and move on, Backspace to clear one",Z?", Escape to go back to the departures":"","."]}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:et}),(0,t.jsxs)(l.StageControls,{placement:"bottom",children:[(0,t.jsxs)(l.TrayRow,{children:[(0,t.jsxs)(l.Tray,{label:"Message",children:[(0,t.jsx)(l.TextInput,{label:"Message for the board",value:H,onChange:X,onSubmit:ef,placeholder:"Write to the board",maxLength:ey,submitLabel:"Flip",width:U?168:228}),(0,t.jsx)(l.IconButton,{label:"Shuffle a message",onClick:()=>{let e=w[ei.current%w.length];ei.current+=1,X(e),ef(e)},children:(0,t.jsx)(i.Shuffle,{size:16})})]}),(0,t.jsxs)(l.Tray,{label:"Board",children:[(0,t.jsx)(l.Stepper,{label:"Rows",value:G||6,min:2,max:U?7:8,onChange:K}),(0,t.jsx)(l.TrayDivider,{}),Z?(0,t.jsx)(l.TrayButton,{icon:(0,t.jsx)(i.Reset,{size:14}),onClick:ep,children:"Departures"}):null,(0,t.jsx)(l.MuteButton,{})]})]}),(0,t.jsx)(l.StageHint,{className:"max-sm:hidden",children:"Press a flap to turn it, hold to riffle, drag along a row"})]})]})}function V({active:e,reducedMotion:r,theme:n}){let i=(0,a.useRef)(null),l=(0,a.useRef)(null),o=(0,a.useRef)(null),c=(0,a.useRef)(null),[h]=(0,a.useState)(()=>new R(M)),u=(0,a.useRef)(null),d=(0,s.useElementSize)(i),[f,p]=(0,a.useState)(()=>+!!r),g=(0,a.useRef)(0),m=(0,a.useRef)(void 0),b=(0,a.useRef)(0),v=(0,a.useCallback)(()=>{window.clearTimeout(b.current),b.current=window.setTimeout(()=>p(e=>e+1),2600)},[]),w=$(),k=(0,s.useFrame)(e,e=>{let{busy:t}=h.step(e);return t||void 0===m.current||(I(c.current,m.current),m.current=void 0,v()),D(i.current,t),!!t&&void 0});return(0,s.useIsoLayoutEffect)(()=>{let e=o.current;if(!e)return;let t=new E(h,e,!1);return t.resize(2,8),u.current=t,()=>{t.destroy(),u.current=null}},[h]),(0,s.useIsoLayoutEffect)(()=>{let e=i.current,t=l.current;if(!e||!t||!d.width||!d.height)return;e.style.setProperty("--u","20px");let a=t.offsetWidth,r=t.offsetHeight;if(!a||!r)return;let n=Math.max(5,20*Math.min(.78*d.width/a,.62*d.height/r));e.style.setProperty("--u",`${Math.round(4*n)/4}px`)},[d.width,d.height]),(0,a.useEffect)(()=>{let e=u.current;if(!e)return;window.clearTimeout(b.current);let t=x[f%x.length],a=[y(t.rows[0],8,"ink"),y(t.rows[1],8,t.tone)],n=e.fresh;if(e.show(a,{instant:n||r,stagger:A(Math.random,.03,.11)}),g.current=performance.now(),n||r){m.current=void 0,I(c.current,t.lamp);return}I(c.current,null),m.current=t.lamp,k()},[f,r,k]),(0,a.useEffect)(()=>{if(e&&!r)return void 0===m.current&&v(),()=>window.clearTimeout(b.current)},[e,r,v]),(0,t.jsx)("div",{ref:i,"aria-hidden":"true",className:"sf sf-tile",style:{"--oy":`${w}em`},onPointerEnter:()=>{!e||r||performance.now()-g.current<1600||p(e=>e+1)},children:(0,t.jsxs)("div",{ref:l,className:"sf-housing sf-mini","data-theme":n,children:[(0,t.jsx)(z,{}),(0,t.jsxs)("div",{className:"sf-mini-head",children:[(0,t.jsx)("span",{className:"sf-caps",children:"Departures"}),(0,t.jsx)("span",{ref:c,className:"sf-lamp"})]}),(0,t.jsx)("div",{className:"sf-bay",children:(0,t.jsx)("div",{ref:o,className:"sf-grid"})})]})})}e.s(["default",0,function(e){return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{href:"lab-split-flap",precedence:"default",children:L}),"stage"===e.mode?(0,t.jsx)(F,{...e}):(0,t.jsx)(V,{...e})]})}],70449)},60699,function(e){e.n(e.i(70449))}]);