(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96705,173,t=>{"use strict";t.i(43476);var e=t.i(71645),a=t.i(97037);let r={name:40,message:120,signature:2e4},i=/^[MLQ0-9 .-]+$/;class n extends Error{constructor(t){super(t),this.name="GuestbookError"}}let o="Couldn't load the guestbook right now.";function s(t){let e=t.name.trim().replace(/\s+/g," "),a=t.message.trim().replace(/\s+/g," "),o=t.signature.trim();if(!e)throw new n("Add your name first.");if(!a)throw new n("Write a short message first.");if(!o)throw new n("Add your signature first.");if([...e].length>r.name)throw new n(`Names can be up to ${r.name} characters.`);if([...a].length>r.message)throw new n(`Messages can be up to ${r.message} characters.`);if(o.length>r.signature||!i.test(o))throw new n("That signature is a little too detailed. Clear it and try a simpler one.");return{name:e,message:a,signature:o}}function l(t){return!!t&&"object"==typeof t&&"string"==typeof t.id&&"string"==typeof t.name&&"string"==typeof t.message&&"string"==typeof t.signature&&"string"==typeof t.created_at}let h=function(t){let e=t.url.trim().replace(/\/+$/,""),a=t.anonKey.trim(),r=!!(e&&a),i=`${e}/rest/v1/guestbook`,h=new Set,d=t=>({apikey:a,...a.startsWith("eyJ")?{Authorization:`Bearer ${a}`}:{},Accept:"application/json",...t});async function c(t,e){let a=new AbortController,r=setTimeout(()=>a.abort(),12e3);try{let r=await fetch(t,{...e,signal:a.signal,cache:"no-store"});if(!r.ok){var i;throw new n((i=r.status,429===i?"Lots of people signing right now. Give it a minute and try again.":i>=500?"The guestbook is having a moment. Please try again shortly.":"The guestbook didn't accept that note. Please check it and try again."))}return r}catch(t){if(t instanceof n)throw t;if(a.signal.aborted)throw new n("The guestbook took too long to answer. Please try again.");throw new n("The guestbook is out of reach right now. Try again in a moment.")}finally{clearTimeout(r)}}let g=null;return{enabled:r,async list(t=100){if(!r)return[];let e=Math.max(1,Math.min(1e3,Math.floor(t))),a=`select=id,name,message,signature,created_at&order=created_at.desc,id.desc&limit=${e}`,s=await c(`${i}?${a}`,{method:"GET",headers:d()}),h=await s.json().catch(()=>{throw new n(o)});return Array.isArray(h)?h.filter(l):[]},count:()=>r?g||(g=(async()=>{try{let t=(await c(`${i}?select=id&limit=1`,{method:"HEAD",headers:d({Prefer:"count=exact"})})).headers.get("content-range")??"",e=Number(t.split("/")[1]);if(!Number.isFinite(e))throw new n(o);return e}finally{g=null}})()):Promise.resolve(0),async create(t){if(!r)throw new n("The guestbook isn't connected yet.");let e=s(t),a=await c(i,{method:"POST",headers:d({"Content-Type":"application/json",Prefer:"return=representation"}),body:JSON.stringify(e)}),o=await a.json().catch(()=>null),g=Array.isArray(o)?o[0]:o,u=l(g)?g:{id:`local-${Date.now()}`,created_at:new Date().toISOString(),...e};return[...h].forEach(t=>t({type:"created",entry:u})),u},subscribe:t=>(h.add(t),()=>{h.delete(t)})}}({url:a.site.supabaseUrl,anonKey:a.site.supabaseAnonKey});h.enabled,t.s(["GUESTBOOK_LIMITS",0,r,"GuestbookError",0,n,"SIGNATURE_PATTERN",0,i,"cleanEntry",0,s,"guestbookClient",0,h],173);let d=new WeakMap;function c(t){let e=d.get(t);if(!e){let a,r,i,n,o,s,l,h,c;r=a={status:t.enabled?"loading":"disabled",entries:[],count:t.enabled?null:0,error:null},i=0,n=0,o=0,s=null,l=null,h=new Set,c=t=>{r={...r,...t},h.forEach(t=>t())},t.subscribe(t=>{if("created"!==t.type)return;let{entry:e}=t;c({status:"ready",error:null,entries:[e,...r.entries.filter(t=>t.id!==e.id)],count:null===r.count?null:r.count+1}),i+=1}),e={subscribe:t=>(h.add(t),()=>{h.delete(t)}),get:()=>r,server:()=>a,load(e){if(!t.enabled)return Promise.resolve();let a=Date.now()-n<3e4;if("ready"===r.status&&i>=e&&a)return Promise.resolve();if(s&&s.limit>=e)return s.promise;"ready"!==r.status&&c({status:"loading",error:null});let l=(async()=>{var a;let[s,l]=await Promise.allSettled([t.list(e),t.count()]),h="fulfilled"===l.status?l.value:r.count;"fulfilled"===l.status&&(o=Date.now()),"fulfilled"===s.status?(i=e,n=Date.now(),c({status:"ready",entries:s.value,count:h,error:null})):"ready"!==r.status&&c({status:"error",count:h,error:(a=s.reason)instanceof Error&&a.message?a.message:"Couldn't load the guestbook right now."})})().finally(()=>{s?.promise===l&&(s=null)});return s={limit:e,promise:l},l},loadCount:()=>!t.enabled||null!==r.count&&Date.now()-o<3e4?Promise.resolve():l||(l=t.count().then(t=>{o=Date.now(),c({count:t})},()=>{}).finally(()=>{l=null}))},d.set(t,e)}return e}let g=(0,e.createContext)(h);function u(){return(0,e.useContext)(g)}t.s(["useGuestbook",0,function(t){let a=u(),r=c(a),i=(0,e.useSyncExternalStore)(r.subscribe,r.get,r.server);(0,e.useEffect)(()=>{r.load(t)},[r,t]);let n=i.entries.length>t?i.entries.slice(0,t):i.entries;return{...i,entries:n,enabled:a.enabled}},"useGuestbookClient",0,u,"useGuestbookCount",0,function(){let t=c(u()),a=(0,e.useSyncExternalStore)(t.subscribe,t.get,t.server);return(0,e.useEffect)(()=>{t.loadCount()},[t]),a.count}],96705)},43847,38442,t=>{"use strict";var e=t.i(37047),a=t.i(43476),r=t.i(173),i=t.i(33209);function n(t){let e=t.match(/-?\d*\.?\d+/g);if(!e||e.length<2)return null;let a=1/0,r=1/0,i=-1/0,n=-1/0;for(let t=0;t+1<e.length;t+=2){let o=Number(e[t]),s=Number(e[t+1]);Number.isFinite(o)&&Number.isFinite(s)&&(o<a&&(a=o),o>i&&(i=o),s<r&&(r=s),s>n&&(n=s))}if(!Number.isFinite(a))return null;let o=Math.max(i-a,8)+6,s=Math.max(n-r,8)+6;return{x:a-3,y:r-3,width:o,height:s}}let o={fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round",vectorEffect:"non-scaling-stroke"};function s({path:t,total:e,strokeWidth:r}){let i=t.split(/(?=M)/).filter(Boolean),n=i.map(l),h=n.reduce((t,e)=>t+e,0)||1,d=0;return(0,a.jsxs)(a.Fragment,{children:[i.map((t,i)=>{let s=Math.max(30,n[i]/h*e),l=120+d;return d+=s,(0,a.jsx)("path",{d:t,...o,strokeWidth:r,pathLength:1,className:"signature-draw",style:{animationDuration:`${Math.round(s)}ms`,animationDelay:`${Math.round(l)}ms`}},i)}),(0,a.jsx)("style",{children:`
        .signature-draw {
          stroke-dasharray: 1 2;
          stroke-dashoffset: 1;
          animation-name: signature-draw;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes signature-draw { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .signature-draw { animation: none; stroke-dashoffset: 0; }
        }
      `})]})}function l(t){let e=(t.match(/-?\d*\.?\d+/g)??[]).map(Number),a=0;for(let t=2;t+1<e.length;t+=2)a+=Math.hypot(e[t]-e[t-2],e[t+1]-e[t-1]);return Math.max(a,1)}function h(t){return Math.round(10*t)/10}t.s(["Signature",0,function({ref:t,path:e,name:l,align:d="start",draw:c=!1,drawMs:g=900,strokeWidth:u=2,className:p}){let f=r.SIGNATURE_PATTERN.test(e)?n(e):null;if(!f)return null;let m=l?`Signature of ${l}`:void 0;return(0,a.jsxs)("svg",{ref:t,viewBox:`${h(f.x)} ${h(f.y)} ${h(f.width)} ${h(f.height)}`,preserveAspectRatio:"center"===d?"xMidYMid meet":"xMinYMid meet",className:(0,i.cn)("block shrink-0 overflow-visible",p),role:m?"img":void 0,"aria-label":m,"aria-hidden":!m||void 0,focusable:"false",children:[m?(0,a.jsx)("title",{children:m}):null,c?(0,a.jsx)(s,{path:e,total:g,strokeWidth:u}):(0,a.jsx)("path",{d:e,...o,strokeWidth:u})]})},"signatureBounds",0,n],38442);let d=new Set;function c(t,e){let a=Math.min(t.width/e.width,t.height/e.height),r=e.width*a,i=e.height*a;return{x:t.left+(t.width-r)/2,y:t.top+(t.height-i)/2,w:r,h:i}}let g=t=>t.width>0&&t.top>=0&&t.left>=0&&t.bottom<=window.innerHeight&&t.right<=window.innerWidth,u="http://www.w3.org/2000/svg";t.s(["flySignature",0,function(t,a){let r=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=n(t.signature),o=null,s=null;if(!r&&a&&i&&a.isConnected)for(let e of d){let a=e.locate(t.id);if(a&&g(a.rect)){o=e,s=a;break}}if(!o||!s||!i||!a)return d.forEach(e=>e.land(t.id,!1)),!1;let l=c(a.getBoundingClientRect(),i),h=getComputedStyle(a).color,p=document.createElementNS(u,"svg");p.setAttribute("viewBox",`${i.x} ${i.y} ${i.width} ${i.height}`),p.setAttribute("preserveAspectRatio","none"),p.setAttribute("aria-hidden","true"),p.style.cssText="position:fixed;left:0;top:0;overflow:visible;pointer-events:none;z-index:2147483000;will-change:transform,width,height;transform-origin:50% 50%;transition:color .45s ease-out, opacity .24s ease-out;",p.style.color=h;let f=document.createElementNS(u,"path");f.setAttribute("d",t.signature),f.setAttribute("fill","none"),f.setAttribute("stroke","currentColor"),f.setAttribute("stroke-linecap","round"),f.setAttribute("stroke-linejoin","round"),f.setAttribute("vector-effect","non-scaling-stroke"),f.setAttribute("stroke-width",String(2)),p.appendChild(f),p.style.width=`${l.w}px`,p.style.height=`${l.h}px`,p.style.transform=`translate3d(${l.x}px, ${l.y}px, 0)`,document.body.appendChild(p),a.style.transition="opacity 120ms ease-out",a.style.opacity="0";let m=new e.Spring(0,{stiffness:40,damping:12,precision:5e-4});m.to(1);let b=o,w=s,y=!1,x=!1,v=performance.now(),k=v,M=()=>{window.setTimeout(()=>p.remove(),280),p.style.opacity="0"},S=e=>{let a=Math.min(.05,(e-v)/1e3);v=e;let r=m.step(a),n=d.has(b)?b.locate(t.id):null;n&&(w=n);let o=c(w.rect,i),s=l.x+l.w/2,h=l.y+l.h/2,g=o.x+o.w/2,u=o.y+o.h/2,C=Math.min(200,Math.max(80,.32*Math.hypot(g-s,u-h))),T=s+(g-s)*.15,A=Math.min(h,u)-C,L=g-(g-s)*.05,P=u-.55*C,j=Math.min(1.04,Math.max(0,r)),$=1-j,E=$*$*$*s+3*$*$*j*T+3*$*j*j*L+j*j*j*g,R=$*$*$*h+3*$*$*j*A+3*$*j*j*P+j*j*j*u,F=3*$*$*(T-s)+6*$*j*(L-T)+3*j*j*(g-L),I=Math.min(1,Math.max(0,r)),N=Math.exp(Math.log(l.w)+(Math.log(o.w)-Math.log(l.w))*I),D=Math.exp(Math.log(l.h)+(Math.log(o.h)-Math.log(l.h))*I),G=Math.sin(Math.PI*I),B=Math.max(-.22,Math.min(.22,F/(Math.hypot(F,3*$*$*(A-h)+6*$*j*(P-A)+3*j*j*(u-P))||1)*.16*G));if(p.style.width=`${N}px`,p.style.height=`${D}px`,p.style.transform=`translate3d(${E-N/2}px, ${R-D/2}px, 0) rotate(${B}rad)`,p.style.filter=G>.02?`drop-shadow(0 ${(9*G).toFixed(1)}px ${(10*G).toFixed(1)}px rgb(0 0 0 / ${(.18*G).toFixed(3)}))`:"none",f.setAttribute("stroke-width",(2+(w.stroke-2)*I).toFixed(2)),!x&&I>.45&&(x=!0,p.style.color=w.color),!y&&(r>=.95||e-k>1800)&&(y=!0,d.has(b)&&b.land(t.id,!0),d.forEach(e=>e!==b&&e.land(t.id,!1)),M()),m.settled||e-k>2200){y||(y=!0,b.land(t.id,!0),M());return}requestAnimationFrame(S)};return requestAnimationFrame(S),!0},"registerHouse",0,function(t){return d.add(t),()=>{d.delete(t)}}],43847)},82798,t=>{"use strict";let e=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"});t.s(["formatEntryDate",0,function(t){let a=new Date(t);return Number.isNaN(a.getTime())?"":e.format(a)},"windowNumber",0,function(t){return String(t+1).padStart(2,"0")}])},41294,t=>{"use strict";let e=':is(.gh[data-night="1"], .dark .gh:not([data-night]))',a=`
.gh {
  --gh-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --gh-star: 0;
  --gh-plinth-top: #e2e1de;
  --gh-plinth-front: #d6d4d0;
  --gh-plinth-side: #cdcbc7;
  --gh-plinth-rim: rgb(255 255 255 / 0.95);
  --gh-drop: rgb(30 28 36 / 0.16);
  --gh-shadow: rgb(46 44 56 / 0.2);
  --gh-shadow-a: 0.2;
  --gh-contact-a: 0.22;
  --gh-wall: #ffffff;
  --gh-wall-lo: #f4f3f0;
  --gh-wall-shade: 0.05;
  --gh-side: #e7e7e8;
  --gh-side-shade: 0.06;
  --gh-roof: #f5f5f4;
  --gh-deck: #ebebea;
  --gh-rim: rgb(255 255 255 / 1);
  --gh-slab: rgb(0 0 0 / 0.045);
  --gh-slab-side: rgb(0 0 0 / 0.05);
  --gh-jamb: #d9dadd;
  --gh-reveal-lit: #fbfbfa;
  --gh-glass: #c7d0db;
  --gh-glass-lift: 0.55;
  --gh-sill: #ffffff;
  --gh-sill-shadow: rgb(0 0 0 / 0.07);
  --gh-lobby: #cfd7e0;
  --gh-lobby-on: 0;
  --gh-mullion: #ffffff;
  --gh-text: rgb(0 0 0 / 0.42);
  --gh-tree: #e2e2e0;
  --gh-tree-hl: 1;
  --gh-trunk: #cfcfcd;
  --gh-lamp-on: 0;
  --gh-lamp-head: #d4d4d4;
  --gh-beacon: #d4574d;
  --gh-beacon-glow: 0;
  --gh-break: rgb(0 0 0 / 0.28);
  --gh-break-fill: #f2f2f2;
  --gh-room-hi: #fbf5ea;
  --gh-room-lo: #f1e7d6;
  --gh-ink: rgb(28 28 32 / 0.86);
  --gh-sheen: 0.55;
  --gh-free: color-mix(in oklab, var(--foreground) 46%, transparent);
  --gh-free-glow: transparent;
  --gh-ring: color-mix(in oklab, var(--foreground) 35%, transparent);
}
${e} {
  --gh-star: 1;
  --gh-plinth-top: #3d3e41;
  --gh-plinth-front: #343538;
  --gh-plinth-side: #2f3033;
  --gh-plinth-rim: rgb(178 192 232 / 0.22);
  --gh-drop: rgb(0 0 0 / 0.5);
  --gh-shadow: rgb(0 0 0 / 0.38);
  --gh-shadow-a: 0.42;
  --gh-contact-a: 0.45;
  --gh-wall: #4a4b4f;
  --gh-wall-lo: #3f4043;
  --gh-wall-shade: 0.16;
  --gh-side: #37383b;
  --gh-side-shade: 0.14;
  --gh-roof: #5b5c60;
  --gh-deck: #505155;
  --gh-rim: rgb(178 192 232 / 0.42);
  --gh-slab: rgb(0 0 0 / 0.16);
  --gh-slab-side: rgb(0 0 0 / 0.14);
  --gh-jamb: #2a2b2e;
  --gh-reveal-lit: #56575b;
  --gh-glass: #1b1c20;
  --gh-glass-lift: 0.05;
  --gh-sill: #5d5e62;
  --gh-sill-shadow: rgb(0 0 0 / 0.25);
  --gh-lobby: #1d1e22;
  --gh-lobby-on: 0.8;
  --gh-mullion: #55565a;
  --gh-text: rgb(255 228 190 / 0.55);
  --gh-tree: #3a3b3e;
  --gh-tree-hl: 0.22;
  --gh-trunk: #444548;
  --gh-lamp-on: 1;
  --gh-lamp-head: #ffe3b8;
  --gh-beacon: #ff5a4d;
  --gh-beacon-glow: 1;
  --gh-break: rgb(255 255 255 / 0.3);
  --gh-break-fill: #232323;
  --gh-ink: rgb(74 44 18 / 0.82);
  --gh-sheen: 0.1;
  --gh-free: rgb(255 214 160 / 0.78);
  --gh-free-glow: rgb(255 196 120 / 0.35);
  --gh-ring: rgb(255 210 150 / 0.75);
}

/* the scene ------------------------------------------------------------ */

/* Dusk and dawn on the model: a slow ease-in-out, so the windows have
   time to come on one by one while the walls darken. */
.gh-scene * {
  transition-property: fill, stroke, opacity;
  transition-duration: 1.1s;
  transition-timing-function: cubic-bezier(0.45, 0, 0.3, 1);
}
.gh[data-still] .gh-scene *,
.gh[data-still] .gh-win,
.gh[data-still] .gh-win * {
  transition: none !important;
}
/* The sky follows the page theme at once, like the panel it sits on. */
.gh-sky {
  background: radial-gradient(70% 90% at 12% 0%, rgb(255 255 255 / 0.7), transparent 70%);
}
.dark .gh-sky {
  background:
    radial-gradient(70% 90% at 12% 0%, rgb(150 160 190 / 0.06), transparent 70%),
    linear-gradient(180deg, rgb(10 10 14 / 0.35), transparent 60%);
}
.gh-star {
  position: absolute;
  will-change: opacity;
  width: 2px;
  height: 2px;
  border-radius: 9999px;
  background: rgb(235 238 255);
  opacity: calc(var(--gh-star) * var(--a, 0.6));
  transition: opacity 1.2s var(--gh-ease) var(--d, 0s);
}
${e}[data-inview] .gh-star {
  animation: gh-twinkle var(--t, 5s) ease-in-out var(--d, 0s) infinite;
}
@keyframes gh-twinkle {
  50% { opacity: calc(var(--a, 0.6) * 0.35); }
}
.gh-beacon-glow {
  position: absolute;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  border-radius: 9999px;
  background: radial-gradient(closest-side, rgb(255 90 77 / 0.7), rgb(255 90 77 / 0));
  opacity: var(--gh-beacon-glow);
  transition: opacity 1.1s cubic-bezier(0.45, 0, 0.3, 1);
  pointer-events: none;
  will-change: opacity;
}
${e}[data-inview] .gh-beacon-glow {
  animation: gh-breathe 2.8s ease-in-out infinite;
}
@keyframes gh-breathe {
  50% { opacity: 0.25; }
}
.gh-lamp-glow { opacity: var(--gh-lamp-on); transition-delay: 0.15s; }
.gh-lobby-light { opacity: var(--gh-lobby-on); transition-delay: 0.3s; }

/* windows -------------------------------------------------------------- */

.gh-win {
  position: absolute;
  display: block;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: none;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gh-win::before {
  /* the hit area: the whole cell, gaps included */
  content: "";
  position: absolute;
  inset: -34% -16%;
}
.gh-win > span,
.gh-win > svg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.gh-room {
  background: linear-gradient(180deg, var(--gh-room-hi), var(--gh-room-lo));
  opacity: 0;
  transition: opacity 0.6s var(--gh-ease) var(--gh-delay, 0s);
}
.gh-lamp {
  background:
    radial-gradient(120% 95% at 50% -10%, rgb(var(--gh-l)) 0%, color-mix(in srgb, rgb(var(--gh-l)) 86%, rgb(var(--gh-l-lo))) 45%, rgb(var(--gh-l-lo)) 100%);
  box-shadow:
    0 0 0 0.5px rgb(var(--gh-l) / 0.6),
    0 0 10px 1px rgb(var(--gh-l) / 0.36),
    0 0 30px 6px rgb(var(--gh-l) / 0.13);
  opacity: 0;
  transition: opacity 0.55s var(--gh-ease) var(--gh-delay, 0s);
}
.gh-lamp::after,
.gh-room::after {
  /* brighter while its note is out */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgb(255 252 244 / 0.2);
  opacity: 0;
  transition: opacity 0.3s var(--gh-ease);
}
.gh-win[data-active] .gh-lamp::after,
.gh-win[data-active] .gh-room::after { opacity: 1; }
.gh-ink {
  color: var(--gh-ink);
  padding: 11% 9%;
  opacity: 0;
  transition: opacity 0.6s var(--gh-ease) var(--gh-delay, 0s), color 0.6s var(--gh-ease) var(--gh-delay, 0s);
}
.gh-ink > svg { width: 100%; height: 100%; }
.gh-sheen {
  background: linear-gradient(118deg, transparent 22%, rgb(255 255 255 / 0.55) 34%, rgb(255 255 255 / 0.08) 47%, transparent 58%);
  opacity: var(--gh-sheen);
  transition: opacity 0.8s var(--gh-ease);
}
.gh-win[data-lit] .gh-room { opacity: 1; }
.gh-win[data-lit] .gh-ink { opacity: 1; }
${e} .gh-win[data-lit] .gh-room { opacity: 0; }
${e} .gh-win[data-lit] .gh-lamp { opacity: 1; }

.gh-win[data-kind="guest"]:hover,
.gh-win[data-active] {
  transform: translateY(-1px) scale(1.07);
  z-index: 2;
}
.gh-win[data-kind="guest"]:active { transform: scale(1.02); transition-duration: 0.12s; }
.gh-win:focus-visible {
  outline: 2px solid var(--foreground);
  outline-offset: 3px;
}

/* the free window: a dashed outline that breathes */
.gh-free {
  will-change: opacity;
  color: var(--gh-free);
  filter: drop-shadow(0 0 4px var(--gh-free-glow));
  overflow: visible;
}
.gh[data-inview] .gh-win[data-kind="free"] .gh-free,
.gh[data-inview] .gh-win[data-kind="arriving"] .gh-free {
  animation: gh-free 2.6s ease-in-out infinite;
}
.gh-win[data-kind="arriving"] .gh-free { animation-duration: 1.1s !important; }
@keyframes gh-free {
  50% { opacity: 0.45; }
}
.gh-win[data-kind="free"]:hover,
.gh-win[data-kind="free"][data-active] {
  transform: scale(1.07);
}

/* landing: a flash and a ring when a signature flies in */
.gh-win[data-landing] .gh-lamp,
.gh-win[data-landing] .gh-room {
  animation: gh-flash 1.1s var(--gh-ease) both;
  transition-delay: 0s;
}
.gh-win[data-landing] .gh-ink { transition-delay: 0s; }
.gh-win[data-landing]::after,
.gh-win[data-highlight]::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 4px;
  border: 1.5px solid var(--gh-ring);
  pointer-events: none;
  animation: gh-ring 1s var(--gh-ease) both;
}
.gh-win[data-highlight]::after { animation: gh-ring 1.4s var(--gh-ease) infinite; }
@keyframes gh-flash {
  0% { filter: brightness(1.9) saturate(0.7); }
  100% { filter: brightness(1); }
}
@keyframes gh-ring {
  0% { opacity: 0.95; scale: 1; }
  100% { opacity: 0; scale: 1.75 1.95; }
}

/* the window panes of the sign form ------------------------------------ */

.gh-pane {
  position: relative;
  border-radius: 10px;
  background: linear-gradient(180deg, color-mix(in oklab, var(--gh-glass) 34%, var(--float)), color-mix(in oklab, var(--gh-glass) 14%, var(--float)));
  box-shadow:
    inset 0 0 0 1px var(--edge),
    inset 3px 3px 0 -1px color-mix(in oklab, var(--foreground) 4%, transparent);
}
${e} .gh-pane {
  background: linear-gradient(180deg, #1d1e22, #24252a);
}
.gh-pane::after {
  /* the sill */
  content: "";
  position: absolute;
  left: -6px;
  right: -6px;
  bottom: -6px;
  height: 6px;
  border-radius: 0 0 5px 5px;
  background: var(--float);
  box-shadow: 0 1px 0 0 var(--edge-firm), 0 3px 6px -3px rgb(0 0 0 / 0.18);
  pointer-events: none;
}
.gh-pane-sheen {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(112deg, transparent 18%, rgb(255 255 255 / 0.5) 30%, transparent 46%);
  opacity: 0.6;
  pointer-events: none;
}
${e} .gh-pane-sheen { opacity: 0.08; }
.gh-pane[data-lit] {
  background: linear-gradient(180deg, var(--gh-room-hi), var(--gh-room-lo));
  transition: background 0.5s var(--gh-ease), box-shadow 0.5s var(--gh-ease);
}
${e} .gh-pane[data-lit] {
  background: radial-gradient(120% 100% at 50% -10%, rgb(255 222 176), rgb(255 206 140) 55%, rgb(214 150 82));
  box-shadow:
    inset 0 0 0 1px rgb(255 214 160 / 0.6),
    0 0 18px 2px rgb(255 196 120 / 0.3),
    0 0 60px 10px rgb(255 190 110 / 0.12);
}
.gh-pane[data-lit] .gh-pane-ink { color: var(--gh-ink); }

/* the register's window chip */
.gh-chip {
  display: inline-block;
  width: 16px;
  height: 11px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--gh-room-hi), var(--gh-room-lo));
  box-shadow: inset 0 0 0 1px var(--edge-firm);
}
${e} .gh-chip {
  background: radial-gradient(120% 100% at 50% -10%, rgb(255 222 176), rgb(255 200 132) 60%, rgb(214 150 82));
  box-shadow: 0 0 6px 0 rgb(255 196 120 / 0.35);
}

@media (prefers-reduced-motion: reduce) {
  .gh-scene *, .gh-win, .gh-win * { transition-duration: 0.2s !important; transition-delay: 0s !important; }
  .gh-win[data-kind="guest"]:hover, .gh-win[data-active], .gh-win[data-kind="free"]:hover { transform: none; }
  .gh-win[data-landing]::after, .gh-win[data-highlight]::after { animation: none; opacity: 0.8; }
  .gh-free, .gh-star, .gh-beacon-glow { animation: none !important; }
}
`;t.s(["HOUSE_CSS",0,a])},47244,t=>{"use strict";var e=t.i(43476),a=t.i(33209);let r=["0","1","2","3","4","5","6","7","8","9"];t.s(["Odometer",0,function({value:t,digits:i=4,className:n}){let o=null!==t&&Number.isFinite(t),s=o?Math.max(0,Math.floor(t)):0,l=String(s).padStart(i,"0");return(0,e.jsxs)("span",{dir:"ltr",className:(0,a.cn)("inline-flex gap-1 rounded-chip p-1 align-middle shadow-lift",n),children:[l.split("").map((t,i)=>{let n=l.length-1-i;return(0,e.jsx)("span",{"aria-hidden":"true",className:"relative inline-flex h-6 w-[18px] overflow-hidden rounded-md bg-float text-[14px] leading-none text-primary tabular-nums shadow-lift",children:(0,e.jsx)("span",{className:(0,a.cn)("block w-full transition-[translate,opacity] duration-[460ms] ease-swap motion-reduce:transition-none",!o&&"opacity-35"),style:{translate:`0 ${-(24*Number(t))}px`,transitionDelay:`${45*n}ms`},children:r.map(t=>(0,e.jsx)("span",{className:"flex h-6 items-center justify-center",children:t},t))})},n)}),(0,e.jsx)("span",{className:"sr-only",children:o?s:"Counting"})]})}])},54446,t=>{"use strict";var e=t.i(16442);t.s(["lightOn",0,function(){if(!(0,e.audioReady)())return;let t=(0,e.getAudio)();if(!t)return;let{ctx:a,output:r}=t,i=a.currentTime,n=a.createBufferSource();n.buffer=(0,e.noiseBuffer)(a);let o=a.createBiquadFilter();o.type="bandpass",o.frequency.value=3200,o.Q.value=1.4;let s=a.createGain();s.gain.setValueAtTime(0,i),s.gain.linearRampToValueAtTime(.11,i+.002),s.gain.exponentialRampToValueAtTime(1e-4,i+.026),n.connect(o).connect(s).connect(r),n.start(i,.1,.04);let l=a.createGain();l.gain.setValueAtTime(0,i+.012),l.gain.linearRampToValueAtTime(.045,i+.02),l.gain.exponentialRampToValueAtTime(1e-4,i+1.1);let h=a.createBiquadFilter();for(let[t,e]of(h.type="lowpass",h.frequency.value=4200,l.connect(h).connect(r),[[1318.5,1],[1975.5,.45],[2637,.12]])){let r=a.createOscillator();r.type="sine",r.frequency.value=t;let n=a.createGain();n.gain.value=e,r.connect(n).connect(l),r.start(i+.012),r.stop(i+1.2)}},"primeSound",0,function(){(0,e.ensureAudio)()}])},24831,t=>{"use strict";var e=t.i(71645),a=t.i(37047);t.s(["bindSwitch",0,function(t,e){let a=null,r=-1/0,i=r=>{if(!r.isPrimary||r.button>0)return;let{model:i,view:n,wake:o,onGesture:s}=e();a=r.pointerId;try{t.setPointerCapture(r.pointerId)}catch{}i.down(r.clientX,n.track.travel,performance.now()),s?.(),o()},n=t=>{let{model:r,wake:i}=e();if(t.pointerId===a){r.move(t.clientX,performance.now()),i();return}"mouse"!==t.pointerType||r.hovering||(r.hovering=!0,i())},o=(t,i)=>{if(t.pointerId!==a)return;a=null;let{model:n,wake:o}=e();i?n.cancel():n.up(t.clientX,performance.now()),r=performance.now(),"mouse"!==t.pointerType&&(n.hovering=!1),o()},s=t=>o(t,!1),l=t=>o(t,!0),h=t=>{if("mouse"!==t.pointerType)return;let{model:a,wake:r}=e();a.hovering=!0,r()},d=t=>{if("mouse"!==t.pointerType)return;let{model:a,wake:r}=e();a.hovering=!1,r()},c=a=>{let{model:i,wake:n,onGesture:o,keys:s=!0}=e();if(s&&!a.altKey&&!a.ctrlKey&&!a.metaKey){if("Enter"===a.key||" "===a.key){if(a.preventDefault(),r=performance.now(),a.repeat)return;o?.(),i.flip(),n()}else if("ArrowRight"===a.key||"ArrowLeft"===a.key){a.preventDefault();let e="rtl"===getComputedStyle(t).direction,r="ArrowRight"===a.key!==e;a.repeat||o?.(),i.keyDown(r?1:-1),n()}}},g=t=>{if("ArrowRight"===t.key||"ArrowLeft"===t.key){let{model:t,wake:a}=e();t.keyUp(),r=performance.now(),a()}else" "===t.key&&(r=performance.now())},u=()=>{let{model:t,wake:a}=e();t.keyUp(),a()},p=t=>{if(t.preventDefault(),performance.now()-r<600)return;let{model:a,wake:i,onGesture:n}=e();n?.(),a.flip(),i()};return t.addEventListener("pointerdown",i),t.addEventListener("pointermove",n),t.addEventListener("pointerup",s),t.addEventListener("pointercancel",l),t.addEventListener("pointerenter",h),t.addEventListener("pointerleave",d),t.addEventListener("keydown",c),t.addEventListener("keyup",g),t.addEventListener("blur",u),t.addEventListener("click",p),()=>{t.removeEventListener("pointerdown",i),t.removeEventListener("pointermove",n),t.removeEventListener("pointerup",s),t.removeEventListener("pointercancel",l),t.removeEventListener("pointerenter",h),t.removeEventListener("pointerleave",d),t.removeEventListener("keydown",c),t.removeEventListener("keyup",g),t.removeEventListener("blur",u),t.removeEventListener("click",p)}},"useSwitchCanvas",0,function(t,r,i){let n=(0,e.useRef)(null),o=(0,a.useLatest)(i);return(0,a.useIsoLayoutEffect)(()=>{let e=n.current;if(!e)return;t.attach(e);let a=e.clientWidth,i=e.clientHeight,s=()=>{if(a<1||i<1)return;let n=Math.max(1,Math.min(r,window.devicePixelRatio||1)),s=Math.max(1,Math.round(a*n)),l=Math.max(1,Math.round(i*n));e.width!==s&&(e.width=s),e.height!==l&&(e.height=l),t.resize(a,i,s/a),o.current()};s();let l=new ResizeObserver(([t])=>{let e=t.contentBoxSize?.[0];a=e?e.inlineSize:t.contentRect.width,i=e?e.blockSize:t.contentRect.height,s()});l.observe(e);let h=null,d=()=>{h?.removeEventListener("change",d),(h=window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)).addEventListener("change",d),s()};return(h=window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)).addEventListener("change",d),()=>{l.disconnect(),h?.removeEventListener("change",d),t.attach(null)}},[t,r,o]),n}])},67128,t=>{"use strict";var e=t.i(37047);let a={compact:{stiffness:140,damping:14.6,peek:.1},tile:{stiffness:70,damping:11.4,peek:.065},stage:{stiffness:70,damping:11.4,peek:.06}};function r(t){return t>1?1+.12*(1-1/(1+3*(t-1))):t<0?-.12*(1-1/(1+-(3*t))):t}class i{pos;press=new e.Spring(0,{stiffness:520,damping:32,precision:.002});peek=new e.Spring(0,{stiffness:230,damping:24,precision:4e-4});stretch=0;target=0;committed=0;pending=-1;dragging=!1;hovering=!1;reduced=!1;onCommit=null;onLand=null;source=null;dragP=0;grabP=0;grabX=0;startX=0;travelPx=1;lastX=0;lastT=0;downT=0;vel=0;moved=!1;keyDir=0;landed=!0;lean;constructor(t=a.compact,r=0){this.pos=new e.Spring(r,{stiffness:t.stiffness,damping:t.damping,precision:3e-4}),this.lean=t.peek??.065,this.target=r,this.committed=r}get p(){return this.dragging?this.dragP:this.pos.value+this.peek.value}get t(){return(0,e.clamp)(this.p,0,1)}get speed(){return this.dragging?this.vel:this.pos.velocity+this.peek.velocity}get held(){return this.dragging}get pointerHeld(){return"pointer"===this.source}grab(){let t=this.pos.value+this.peek.value;this.pos.set(t),this.peek.set(0),this.dragP=t,this.pending=-1,this.dragging=!0,this.vel=0}release(t,a){this.dragging=!1,this.source=null,this.pos.value=this.dragP,this.pos.velocity=(0,e.clamp)(a,-14,14),this.goTo(t)}goTo(t){this.target=t,this.pending=t!==this.committed?t:-1,this.landed=!1,this.reduced?(this.pos.set(t),this.peek.set(0)):this.pos.to(t)}down(t,e,a){"key"===this.source&&this.keyUp(),this.grab(),this.source="pointer",this.grabP=this.dragP,this.grabX=t,this.startX=t,this.lastX=t,this.lastT=a,this.downT=a,this.travelPx=Math.max(1,e),this.moved=!1,this.press.to(1)}move(t,e){if("pointer"!==this.source)return;let a=Math.max(1,e-this.lastT)/1e3,i=(t-this.lastX)/this.travelPx/a;this.vel+=(i-this.vel)*(1-Math.exp(-a/.045)),this.lastX=t,this.lastT=e,Math.abs(t-this.startX)>4&&(this.moved=!0),this.dragP=r(this.grabP+(t-this.grabX)/this.travelPx)}up(t,e){if("pointer"!==this.source)return!1;if(this.dragP=r(this.grabP+(t-this.grabX)/this.travelPx),Math.abs(t-this.startX)>4&&(this.moved=!0),this.press.to(0),!this.moved&&e-this.downT<500)return this.release(this.target,0),this.flip(),!0;let a=e-this.lastT>90?0:this.vel,i=this.dragP+.16*a;return this.release(+(i>=.5),a),!1}cancel(){"pointer"===this.source&&(this.press.to(0),this.release(this.committed,0))}keyDown(t){"pointer"!==this.source&&("key"!==this.source&&(this.grab(),this.source="key",this.press.to(1)),this.keyDir=t)}keyUp(){if("key"!==this.source)return;let t=this.keyDir;this.keyDir=0,this.press.to(0),this.release(+(t>0),.55*t)}flip(){this.dragging||(this.pos.value+=this.peek.value,this.pos.velocity+=this.peek.velocity,this.peek.set(0),this.press.impulse(7),this.goTo(+(1!==this.target)))}sync(t,e){if(this.committed=t,!this.dragging){if(this.pending>=0){if(this.pending===t)return;this.pending=-1}this.target!==t&&(this.target=t,this.landed=!1,!e||this.reduced?(this.pos.set(t),this.peek.set(0)):this.pos.to(t))}}place(t){this.pos.set(t),this.peek.set(0),this.press.set(0),this.stretch=0,this.target=t,this.committed=t,this.pending=-1,this.dragging=!1,this.source=null,this.landed=!0}step(t){if("key"===this.source){let a=(0,e.clamp)(this.dragP+.55*this.keyDir*t,0,1);this.vel=t>0?(a-this.dragP)/t:0,this.dragP=a}let a=!this.dragging&&this.pending<0&&.02>Math.abs(this.pos.value-this.target),r=this.hovering&&a&&!this.reduced?0===this.target?this.lean:-this.lean:0;this.peek.to(r),this.dragging||this.pos.step(t),this.peek.step(t),this.press.step(t),this.dragging||this.landed||((1===this.target?this.pos.value>=1:this.pos.value<=0)?(this.landed=!0,this.onLand?.(Math.abs(this.pos.velocity))):this.pos.settled&&(this.landed=!0));let i=this.pending;-1!==i&&!this.dragging&&(this.reduced||.25>Math.abs(this.pos.value-i))&&(this.pending=-1,this.committed=i,this.onCommit?.(i));let n=this.reduced?0:Math.min(.16,.024*Math.abs(this.speed));return this.stretch=(0,e.damp)(this.stretch,n,16,t),this.stretch<5e-4&&0===n&&(this.stretch=0),this.dragging||!this.pos.settled||!this.peek.settled||!this.press.settled||this.stretch>0||this.pending>=0}}t.s(["FEEL",0,a,"SwitchModel",0,i])},11382,52802,t=>{"use strict";let e=[0,.34,.58,.75,1],a={zenith:["#80aedb","#879fcc","#56659b","#252f59","#0b1020"],upper:["#a2c5e6","#b4bbd6","#8f80a6","#394273","#121932"],lower:["#c7ddee","#ecc6a6","#de9886","#666290","#19223f"],horizon:["#e3edf0","#f7d89f","#f3aa74","#9c7c9c","#232e4d"],sun:["#fffcf2","#fff0cb","#ffc07c","#ff9a66","#ff9a66"],sunGlow:["#fff8e2","#ffd897","#ffa56e","#e07f6c","#e07f6c"],far:["#b2c6d1","#c5b3ab","#94808f","#3d3f5d","#1b2238"],mid:["#97b2a2","#988d77","#675b69","#2c2e48","#141a2c"],near:["#789884","#706d57","#473f4d","#1f2139","#0d111d"],fore:["#5e7f6b","#565541","#342d39","#16182b","#080b14"],rim:["#ffffff","#ffe1a6","#ffb27e","#b98a9e","#6a76a3"],cloud:["#ffffff","#fff1dd","#f6c4a8","#8a85a8","#4a5374"],cloudShade:["#dde8f1","#dcc3c1","#a98199","#4a4b6d","#212943"],lake:["#b4cfe2","#e9c59c","#da9478","#5b5882","#18203c"],lakeDeep:["#8db0cb","#ab9ba1","#8b6f87","#2d3257","#0e1427"],knob:["#ffffff","#fffaf3","#fff3ec","#dfe2ec","#c9cfdc"],knobShade:["#e3e7eb","#eee1d5","#ecd8d1","#aab0c2","#8a93a9"]},r=t=>{let e=t/255;return e<=.04045?e/12.92:((e+.055)/1.055)**2.4},i=t=>Math.max(0,Math.min(255,Math.round(255*(t<=.0031308?12.92*t:1.055*Math.max(0,t)**(1/2.4)-.055))));function n(t){let e=parseInt(t.slice(1),16),a=r(e>>16&255),i=r(e>>8&255),n=r(255&e),o=Math.cbrt(.4122214708*a+.5363325363*i+.0514459929*n),s=Math.cbrt(.2119034982*a+.6806995451*i+.1073969566*n),l=Math.cbrt(.0883024619*a+.2817188376*i+.6299787005*n);return[.2104542553*o+.793617785*s-.0040720468*l,1.9779984951*o-2.428592205*s+.4505937099*l,.0259040371*o+.7827717662*s-.808675766*l]}let o=new Map;function s(t){let r=o.get(t);if(r)return r;let s=a[t].map(n),l=new Uint8ClampedArray(768),h=Array(256);for(let t=0;t<256;t++){let[a,r]=function(t){for(let a=0;a<e.length-1;a++)if(t<=e[a+1]||a===e.length-2){let r=Math.max(0,Math.min(1,(t-e[a])/(e[a+1]-e[a])));return[a,r*r*(3-2*r)]}return[0,0]}(t/255),n=s[a],o=s[a+1];!function(t,e,a,r,n){let o=(t+.3963377774*e+.2158037573*a)**3,s=(t-.1055613458*e-.0638541728*a)**3,l=(t-.0894841775*e-1.291485548*a)**3;r[n]=i(4.0767416621*o-3.3077115913*s+.2309699292*l),r[n+1]=i(-1.2684380046*o+2.6097574011*s-.3413193965*l),r[n+2]=i(-.0041960863*o-.7034186147*s+1.707614701*l)}(n[0]+(o[0]-n[0])*r,n[1]+(o[1]-n[1])*r,n[2]+(o[2]-n[2])*r,l,3*t),h[t]=`rgb(${l[3*t]},${l[3*t+1]},${l[3*t+2]})`}return r={rgb:l,css:h},o.set(t,r),r}let l=t=>Math.max(0,Math.min(255,Math.round(255*t))),h=[840,1100,1180,1225,1350];t.s(["color",0,function(t,e){return s(t).css[l(e)]},"formatClock",0,function(t){let e=Math.floor(t)%1440,a=Math.floor(e/60),r=e%60;return`${a<10?"0":""}${a}:${r<10?"0":""}${r}`},"keyColor",0,function(t,e){return a[t][e]},"minutesAt",0,function(t){let a=Math.max(0,Math.min(1,t));for(let t=0;t<e.length-1;t++)if(a<=e[t+1]){let r=(a-e[t])/(e[t+1]-e[t]);return h[t]+(h[t+1]-h[t])*r}return h[h.length-1]},"phaseAt",0,function(t){return t<.18?"Afternoon":t<.48?"Golden hour":t<.64?"Sunset":t<.84?"Blue hour":"Night"},"rgbInto",0,function(t,e,a,r=0){let{rgb:i}=s(t),n=3*l(e);a[r]=i[n],a[r+1]=i[n+1],a[r+2]=i[n+2]},"rgba",0,function(t,e,a){let{rgb:r}=s(t),i=3*l(e);return`rgba(${r[i]},${r[i+1]},${r[i+2]},${Math.max(0,Math.min(1,a)).toFixed(3)})`}],11382);var d=t.i(37047);let c={far:[.6,.565,.585,.55,.53,.565,.585,.55,.52,.545,.575,.55,.57],mid:[.72,.7,.685,.705,.68,.655,.69,.705,.665,.675,.71,.685,.7],near:[.84,.81,.83,.87,.85,.815,.82,.845,.88,.885,.835,.815,.84]},g={far:.014,mid:.026,near:.042},u={compact:.135,tile:.1,stage:.072},p={compact:.14,tile:.1,stage:.07};function f(t){let e=(0,d.clamp)(t/.7);return[.675+.22*Math.pow(e,1.1),.2+.6*Math.pow(e,1.9)]}function m(t){let e=(0,d.smoothstep)(.5,1,t);return[.14+.15*e,.95-.63*Math.pow(e,.8)]}t.s(["HILLS",0,c,"STAR_FIELDS",0,7,"createScene",0,function(){return{t:0,sunX:0,sunY:0,sunR:0,sunFlat:1,sunLight:1,moonX:0,moonY:0,moonR:0,moonLight:0,golden:0,glow:0,belt:0,night:0,lamps:0,birds:1,lightX:0,lightY:0,light:1,warm:0}},"hillY",0,function(t,e){let a=c[t],r=(0,d.clamp)((e+.1)/.1,0,a.length-1.0001),i=Math.floor(r),n=r-i,o=a[Math.max(0,i-1)],s=a[i],l=a[Math.min(a.length-1,i+1)],h=a[Math.min(a.length-1,i+2)];return .5*(2*s+(-o+l)*n+(2*o-5*s+4*l-h)*n*n+(-o+3*s-3*l+h)*n*n*n)},"makeStars",0,function(t){if("compact"===t){let t=[[.71,.36,.04,.6,1.3,.2,1],[.12,.3,.03,.7,1.9,1.1,0],[.2,.15,.036,.72,2.3,2.3,1],[.36,.2,.026,.76,1.7,.7,0],[.45,.42,.022,.8,2.6,3.1,0],[.53,.13,.03,.74,1.5,4.2,0],[.06,.52,.022,.84,2.1,5,0],[.27,.46,.02,.86,2.9,1.9,0],[.42,.07,.024,.82,1.2,2.8,0]],e=new Float32Array(7*t.length);return t.forEach((t,a)=>e.set(t,7*a)),e}let e="stage"===t?230:46,a=(0,d.seededRandom)("stage"===t?0x135289c:7),r=new Float32Array((e+1)*7);r.set([.73,.38,"stage"===t?.012:.022,.58,1.1,.4,1],0);for(let i=1;i<=e;i++){let e=a(),n=.03+.56*Math.pow(a(),1.35),o=a(),s=+(o>("stage"===t?.955:.9)),l=("stage"===t?.0028:.006)+Math.pow(o,3)*("stage"===t?.0062:.012),h=.64+(1-o)*.18+.12*n+.04*a();r.set([e,n,l,h,.8+2.6*a(),6.283*a(),s],7*i)}return r},"moonAt",0,m,"shiftAt",0,(t,e)=>(.5-e)*g[t],"sunAt",0,f,"trackFor",0,function(t,e,a){let r="compact"===a?Math.max(2.5,Math.round(.11*e*2)/2):e*("tile"===a?.09:.1),i=e-2*r;return{w:t,h:e,pad:r,d:i,travel:Math.max(1,t-2*r-i)}},"updateScene",0,function(t,e,a){t.t=e;let[r,i]=f(e);t.sunX=r,t.sunY=i,t.sunR=u[a],t.sunFlat=(0,d.lerp)(1,.9,(0,d.smoothstep)(.45,.6,e)),t.sunLight=1-(0,d.smoothstep)(.48,.62,e);let[n,o]=m(e);t.moonX=n,t.moonY=o,t.moonR=p[a],t.moonLight=(0,d.smoothstep)(.7,.95,e),t.golden=(0,d.smoothstep)(.1,.38,e)*(1-(0,d.smoothstep)(.58,.72,e)),t.glow=(0,d.smoothstep)(.28,.55,e)*(1-(0,d.smoothstep)(.64,.86,e)),t.belt=(0,d.smoothstep)(.52,.66,e)*(1-(0,d.smoothstep)(.74,.9,e)),t.night=(0,d.smoothstep)(.58,.92,e),t.lamps=(0,d.smoothstep)(.5,.68,e),t.birds=1-(0,d.smoothstep)(.38,.56,e);let s=t.sunLight,l=.55*t.moonLight,h=s+l;h>.001?(t.lightX=(r*s+n*l)/h,t.lightY=(i*s+o*l)/h):(t.lightX=.5,t.lightY=.2),t.light=Math.max(s,l,.18),t.warm=t.golden}],52802)},21642,t=>{"use strict";var e=t.i(37047),a=t.i(11382),r=t.i(52802);let i=[[-.13,.02,.045],[-.06,-.005,.07],[.03,-.035,.085],[.12,-.01,.065],[.19,.015,.045]],n={x:.885,y:.25,s:.85,speed:.0035},o={compact:[n],tile:[{x:.87,y:.31,s:1,speed:.004},{x:.52,y:.14,s:.65,speed:.006},{x:.2,y:.24,s:.8,speed:.005}],stage:[{x:.86,y:.31,s:.95,speed:.0042},{x:.52,y:.13,s:.6,speed:.0063},{x:.19,y:.23,s:.8,speed:.0049},{x:.36,y:.08,s:.42,speed:.0078}]},s={compact:.16,tile:.1,stage:.06},l={far:Math.min(...r.HILLS.far),mid:Math.min(...r.HILLS.mid),near:Math.min(...r.HILLS.near)};function h(t,e,a,r,i){if(r>=i){let n=i/2,o=e-r/2+n,s=e+r/2-n;t.moveTo(o,a-n),t.lineTo(s,a-n),t.arc(s,a,n,-Math.PI/2,Math.PI/2),t.lineTo(o,a+n),t.arc(o,a,n,Math.PI/2,3*Math.PI/2)}else{let n=r/2,o=a-i/2+n,s=a+i/2-n;t.moveTo(e+n,o),t.lineTo(e+n,s),t.arc(e,s,n,0,Math.PI),t.lineTo(e-n,o),t.arc(e,o,n,Math.PI,2*Math.PI)}t.closePath()}function d(t,e,a){let r=e+2*a,i=document.createElement("canvas");i.width=Math.max(1,Math.ceil(r*t)),i.height=i.width;let n=i.getContext("2d");if(!n)return i;n.scale(i.width/r,i.width/r);let o=e/2+a,s=n.createRadialGradient(r/2,r/2,0,r/2,r/2,o),l=Math.max(0,e/2-a)/o;for(let t=0;t<=10;t++){let e=l+(1-l)*t/10,a=t/10;s.addColorStop(e,`rgba(0,0,0,${(1-a*a*(3-2*a)).toFixed(3)})`)}return l>0&&s.addColorStop(0,"rgba(0,0,0,1)"),n.fillStyle=s,n.fillRect(0,0,r,r),i}class c{lod;scene=(0,r.createScene)();stars;knob={cx:0,cy:0,w:0,h:0};canvas=null;ctx=null;w=0;h=0;dpr=1;track=(0,r.trackFor)(2,1,"compact");pill=null;hills=null;crests=null;extras=null;still=!1;ambient=!1;recess=null;shadowSoft=null;shadowTight=null;softBlur=0;tightBlur=0;constructor(t,e=null){this.lod=t,this.extras=e,this.stars=(0,r.makeStars)(t)}attach(t){this.canvas=t,this.ctx=t?t.getContext("2d"):null}resize(t,e,a){if(t===this.w&&e===this.h&&a===this.dpr&&this.pill)return;this.w=t,this.h=e,this.dpr=a,this.track=(0,r.trackFor)(t,e,this.lod);let i=new Path2D;h(i,t/2,e/2,t,e),this.pill=i,this.hills={far:this.ridge("far",!0),mid:this.ridge("mid",!0),near:this.ridge("near",!0)},this.crests={far:this.ridge("far",!1),mid:this.ridge("mid",!1),near:this.ridge("near",!1)},this.bake(),this.extras?.resize?.(this)}ridge(t,e){let{w:a,h:i}=this,n=new Path2D,o="compact"===this.lod?36:"tile"===this.lod?64:120,s=-.08*a,l=(0,r.hillY)(t,-.08)*i;e?(n.moveTo(s,i+2),n.lineTo(s,l)):n.moveTo(s,l);for(let e=1;e<=o;e++){let h=-.08+1.1600000000000001*e/o,d=h*a,c=(0,r.hillY)(t,h)*i;n.quadraticCurveTo(s,l,(s+d)/2,(l+c)/2),s=d,l=c}return n.lineTo(s,l),e&&(n.lineTo(1.08*a,i+2),n.closePath()),n}bake(){let{w:t,h:e,dpr:a,lod:r}=this,i=document.createElement("canvas");i.width=Math.max(1,Math.round(t*a)),i.height=Math.max(1,Math.round(e*a));let n=i.getContext("2d");if(n&&this.pill){n.scale(a,a),n.save(),n.clip(this.pill);let i=new Path2D;i.rect(-t,-e,3*t,3*e),h(i,t/2,e/2,t+.5,e+.5),n.shadowColor="rgba(0,0,0,0.34)",n.shadowBlur=("compact"===r?2.4:e*("tile"===r?.06:.04))*a,n.shadowOffsetY=("compact"===r?.9:.014*e)*a,n.fillStyle="#000",n.fill(i,"evenodd"),n.shadowColor="transparent";let o=n.createLinearGradient(0,0,0,.55*e);o.addColorStop(0,"rgba(255,255,255,0.16)"),o.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=o,n.fillRect(0,0,t,.55*e),n.restore()}this.recess=i;let o=this.track.d;this.softBlur=.22*o,this.tightBlur=Math.max(.8,.05*o),this.shadowSoft=d(a,o,this.softBlur),this.shadowTight=d(a,o,this.tightBlur)}layoutKnob(t){let{pad:a,d:r,travel:i,w:n,h:o}=this.track,l=t.p,h=(0,e.clamp)(l,0,1),d=(l-h)*i,c=(0,e.clamp)(t.press.value,-.4,1.4),g=r*(1+s[this.lod]*c+t.stretch),u=r*(1-.2*t.stretch-.02*Math.max(0,c)),p=n-a,f=a+r/2+h*i-g/2;f<a&&(f=a),f+g>p&&(f=p-g),d>0?(f=Math.min(f+d,p-.55*g),g=p-f,u+=.55*d):d<0&&(g=Math.max(f+g+d,a+.55*g)-(f=a),u-=.55*d),u=Math.min(u,o-.7*a);let m=this.knob;return m.cx=f+g/2,m.cy=o/2,m.w=g,m.h=u,m}draw(t,e){let a=this.ctx;if(!a||!this.pill||!this.hills||this.w<2)return;let{w:i,h:n,dpr:o,lod:s}=this,l=this.scene,h=t.t,d=this.still?0:e;(0,r.updateScene)(l,h,s),this.ambient=!1,a.setTransform(o,0,0,o,0,0),a.clearRect(0,0,i,n),a.save(),a.clip(this.pill),this.sky(a,l),this.extras?.sky?.(this,a,l,d),this.starField(a,l,d),this.moon(a,l),this.sun(a,l),this.clouds(a,l,d),this.extras?.air?.(this,a,l,d),this.hill(a,"far",l),this.hill(a,"mid",l),this.extras?.middle?.(this,a,l,d),this.hill(a,"near",l),this.extras?.front?.(this,a,l,d),this.recess&&(a.setTransform(1,0,0,1,0,0),a.drawImage(this.recess,0,0),a.setTransform(o,0,0,o,0,0));let c=this.layoutKnob(t);this.knobShadow(a,l,c),a.restore(),this.knobBody(a,l,c),this.ring(a,l)}sky(t,e){let{w:r,h:i}=this,n=e.t,o=t.createLinearGradient(0,0,0,.68*i);if(o.addColorStop(0,(0,a.color)("zenith",n)),o.addColorStop(.42,(0,a.color)("upper",n)),o.addColorStop(.78,(0,a.color)("lower",n)),o.addColorStop(1,(0,a.color)("horizon",n)),t.fillStyle=o,t.fillRect(0,0,r,i),e.glow>.01){let o=e.sunX*r,s=.5*i,l=.42*r;t.save(),t.translate(o,.6*i),t.scale(l/s,1);let h=t.createRadialGradient(0,0,0,0,0,s);h.addColorStop(0,(0,a.rgba)("sunGlow",n,.85*e.glow)),h.addColorStop(.45,(0,a.rgba)("sunGlow",n,.32*e.glow)),h.addColorStop(1,(0,a.rgba)("sunGlow",n,0)),t.fillStyle=h,t.fillRect(-s,-s,2*s,2*s),t.restore()}if(e.belt>.01&&"compact"!==this.lod){let a=.32*i;t.save(),t.translate(.16*r,.58*i),t.scale(.55*r/a,1);let n=t.createRadialGradient(0,0,0,0,0,a);n.addColorStop(0,`rgba(226,160,178,${(.42*e.belt).toFixed(3)})`),n.addColorStop(1,"rgba(226,160,178,0)"),t.fillStyle=n,t.fillRect(-a,-a,2*a,2*a),t.restore()}}starField(t,a,i){if(a.night<=.001)return;let{w:n,h:o,dpr:s,stars:l}=this,h=a.t,d="compact"===this.lod,c=l.length/r.STAR_FIELDS;t.fillStyle="#ffffff",t.strokeStyle="#ffffff",t.lineWidth=d?.5:Math.max(.6,.0022*o);for(let a=0;a<c;a++){let c=a*r.STAR_FIELDS,g=(0,e.clamp)((h-l[c+3])/.07);if(g<=0)continue;let u=l[c+6]>.5,p=.7+.3*Math.sin(i*l[c+4]+l[c+5]);t.globalAlpha=g*p*(u?1:.82);let f=l[c+2]*o*(1+.7*Math.sin(g*Math.PI)*(1-.3*g)),m=l[c]*n,b=l[c+1]*o;if(f*s<1.1?t.fillRect(m-f,b-f,2*f,2*f):(t.beginPath(),t.arc(m,b,f,0,2*Math.PI),t.fill()),u){let e=f*(d?2.4:3.6)*p;t.globalAlpha*=.45,t.beginPath(),t.moveTo(m-e,b),t.lineTo(m+e,b),t.moveTo(m,b-e),t.lineTo(m,b+e),t.stroke()}}t.globalAlpha=1,this.still||(this.ambient=!0)}clouds(t,n,s){let{w:l,h}=this,d=n.t,c=o[this.lod],g=(0,e.lerp)(.95,.2,(0,e.smoothstep)(.55,.9,d));for(let e=0;e<c.length;e++){let o=c[e],u=o.x+s*o.speed,p=(u=((u+.35)%1.7+1.7)%1.7-.35)*l+(0,r.shiftAt)("far",d)*l*1.5,f=o.y*h,m=o.s*h;t.save(),t.beginPath(),t.rect(p-m,f-m,2*m,1.05*m),t.clip(),t.beginPath();for(let e=0;e<i.length;e++){let[a,r,n]=i[e],o=p+a*m,s=f+r*m;t.moveTo(o+n*m,s),t.arc(o,s,n*m,0,2*Math.PI)}t.rect(p-.13*m,f,.32*m,.05*m);let b=f-.12*m,w=f+.05*m,y=t.createLinearGradient(0,b,0,w);if(y.addColorStop(0,(0,a.color)("cloud",d)),y.addColorStop(1,(0,a.color)("cloudShade",d)),t.globalAlpha=g,t.fillStyle=y,t.fill(),n.glow>.02){let e=t.createLinearGradient(0,b,0,w);e.addColorStop(.35,(0,a.rgba)("rim",d,0)),e.addColorStop(1,(0,a.rgba)("rim",d,.85*n.glow)),t.fillStyle=e,t.fill()}t.restore()}t.globalAlpha=1,this.still||(this.ambient=!0)}moon(t,a){let r=(0,e.smoothstep)(.5,.64,a.t);if(r<=0)return;let{w:i,h:n}=this,o=a.moonX*i,s=a.moonY*n,l=a.moonR*n,h=t.createRadialGradient(o,s,.8*l,o,s,l*("compact"===this.lod?3.2:5));h.addColorStop(0,`rgba(205,215,245,${(.3*r).toFixed(3)})`),h.addColorStop(1,"rgba(205,215,245,0)"),t.fillStyle=h,t.fillRect(o-5*l,s-5*l,10*l,10*l),t.globalAlpha=.16*r,t.fillStyle="#c9cfdf",t.beginPath(),t.arc(o,s,l,0,2*Math.PI),t.fill(),t.globalAlpha=r;let[d,c]=[a.sunX*i,a.sunY*n],g=Math.atan2(c-s,d-o);if(t.save(),t.translate(o,s),t.rotate(g),t.beginPath(),t.arc(0,0,l,-Math.PI/2,Math.PI/2),t.ellipse(0,0,.3*l,l,0,Math.PI/2,-Math.PI/2,!0),t.closePath(),"compact"===this.lod)t.fillStyle="#f4f1e6";else{let e=t.createRadialGradient(.35*l,-(.2*l),0,0,0,l);e.addColorStop(0,"#fbf9f1"),e.addColorStop(1,"#ddd8c8"),t.fillStyle=e}t.fill(),t.restore(),t.globalAlpha=1}sun(t,e){if(e.t>.68)return;let{w:r,h:i}=this,n=e.t,o=e.sunX*r,s=e.sunY*i,l=e.sunR*i,h=l*("compact"===this.lod?2.6:3.6)*(1+.5*e.golden),d=t.createRadialGradient(o,s,.6*l,o,s,h);if(d.addColorStop(0,(0,a.rgba)("sunGlow",n,.7)),d.addColorStop(.35,(0,a.rgba)("sunGlow",n,.26)),d.addColorStop(1,(0,a.rgba)("sunGlow",n,0)),t.fillStyle=d,t.fillRect(o-h,s-h,2*h,2*h),t.beginPath(),t.ellipse(o,s,l,l*e.sunFlat,0,0,2*Math.PI),"compact"===this.lod)t.fillStyle=(0,a.color)("sun",n);else{let e=t.createRadialGradient(o,s,0,o,s,l);e.addColorStop(0,"#fffef8"),e.addColorStop(.55,(0,a.color)("sun",n)),e.addColorStop(1,(0,a.rgba)("sunGlow",n,1)),t.fillStyle=e}t.fill()}hill(t,e,i){let n=this.hills?.[e];if(!n)return;let{w:o,h:s}=this,h=i.t,d=(0,r.shiftAt)(e,h)*o;if(t.save(),t.translate(d,0),"compact"===this.lod)t.fillStyle=(0,a.color)(e,h);else{let r=l[e]*s,i=t.createLinearGradient(0,r,0,s);i.addColorStop(0,(0,a.color)(e,h)),i.addColorStop(1,"near"===e?(0,a.color)("fore",h):(0,a.color)("far"===e?"mid":"near",h)),t.fillStyle=i}t.fill(n);let c=("far"===e?.35*i.golden:Math.max(.85*i.golden+.25*i.sunLight*(1-i.golden),.4*i.moonLight))*("compact"===this.lod?.5:1);if(c>.02){let r=i.lightX*o-d,n=t.createLinearGradient(r-.55*o,0,r+.55*o,0);n.addColorStop(0,(0,a.rgba)("rim",h,0)),n.addColorStop(.5,(0,a.rgba)("rim",h,c)),n.addColorStop(1,(0,a.rgba)("rim",h,0)),t.strokeStyle=n,t.lineWidth="compact"===this.lod?.6:Math.max(.9,.0045*s);let l=this.crests?.[e];l&&t.stroke(l)}t.restore()}knobShadow(t,a,r){let{w:i,h:n}=this,o=this.track.d,s=r.cx-a.lightX*i,l=r.cy-a.lightY*n,h=Math.hypot(s,l)||1;s/=h,l/=h;let d=o*(.05+.12*(0,e.clamp)(1.4*a.lightY))*a.light,c=s*d,g=l*d*.6+.05*o,u=this.shadowSoft,p=this.shadowTight;if(u){let e=this.softBlur;t.globalAlpha=.16+.2*a.light,t.drawImage(u,r.cx+c-r.w/2-e,r.cy+g-r.h/2-e,r.w+2*e,r.h+2*e)}if(p&&"stage"!==this.lod){let e=this.tightBlur;t.globalAlpha=.22,t.drawImage(p,r.cx-r.w/2-e,r.cy+.025*o-r.h/2-e,r.w+2*e,r.h+2*e)}t.globalAlpha=1}knobBody(t,e,r){let{w:i,h:n}=this,o=e.t,s="compact"===this.lod,l=e.lightX*i-r.cx,d=e.lightY*n-r.cy,c=Math.hypot(l,d)||1;l/=c,d/=c;let g=Math.max(r.w,r.h)/2;t.beginPath(),h(t,r.cx,r.cy,r.w,r.h);let u=r.cx+l*r.w*.18,p=r.cy-.28*r.h+d*r.h*.06,f=t.createRadialGradient(u,p,0,r.cx,r.cy+.1*r.h,1.12*g);if(f.addColorStop(0,(0,a.color)("knob",o)),f.addColorStop(.6,(0,a.color)("knob",o)),f.addColorStop(1,(0,a.color)("knobShade",o)),t.fillStyle=f,t.fill(),!s){let i=t.createLinearGradient(0,r.cy-r.h/2,0,r.cy+r.h/2);if(i.addColorStop(0,(0,a.rgba)("upper",o,.13)),i.addColorStop(.3,(0,a.rgba)("upper",o,.05)),i.addColorStop(.5,(0,a.rgba)("upper",o,0)),i.addColorStop(.5,(0,a.rgba)("near",o,0)),i.addColorStop(.78,(0,a.rgba)("near",o,.06)),i.addColorStop(1,(0,a.rgba)("near",o,.17)),t.fillStyle=i,t.fill(),e.golden>.02){let i=t.createLinearGradient(r.cx-l*g,r.cy-d*g,r.cx+l*g,r.cy+d*g);i.addColorStop(.35,(0,a.rgba)("sunGlow",o,0)),i.addColorStop(1,(0,a.rgba)("sunGlow",o,.34*e.golden)),t.fillStyle=i,t.fill()}let n=r.cx+l*r.w*.2,s=r.cy-.27*r.h,h=.7*e.light+.2,c=.36*g,u=t.createRadialGradient(n,s,0,n,s,c);u.addColorStop(0,`rgba(255,255,255,${h.toFixed(3)})`),u.addColorStop(.22,`rgba(255,255,255,${(.75*h).toFixed(3)})`),u.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=u,t.fillRect(n-c,s-c,2*c,2*c)}if(t.lineWidth=s?.6:Math.max(.8,.004*n),t.strokeStyle=`rgba(0,0,0,${(.08+.12*e.night).toFixed(3)})`,t.stroke(),!s){let e=Math.max(1.2,.013*r.h);t.beginPath(),h(t,r.cx,r.cy,r.w-e,r.h-e);let i=t.createLinearGradient(0,r.cy-r.h/2,0,r.cy+r.h/2);i.addColorStop(0,"rgba(255,255,255,0.9)"),i.addColorStop(.28,"rgba(255,255,255,0)"),i.addColorStop(.66,(0,a.rgba)("horizon",o,0)),i.addColorStop(1,(0,a.rgba)("horizon",o,.5)),t.strokeStyle=i,t.lineWidth=e,t.stroke()}}ring(t,a){let{w:r,h:i}=this,n=a.t,o=Math.round((0,e.lerp)(0,255,n)),s=(0,e.lerp)(.1,.12,n);t.beginPath();let l="compact"===this.lod?.5:.75;h(t,r/2,i/2,r-2*l,i-2*l),t.lineWidth=2*l,t.strokeStyle=`rgba(${o},${o},${o},${s.toFixed(3)})`,t.stroke()}}t.s(["CLOUD_BASE",0,.05,"CLOUD_PUFFS",0,i,"COMPACT_CLOUD",0,n,"SwitchView",0,c])},55810,t=>{"use strict";var e=t.i(43476),a=t.i(33209);function r({className:t,title:i,children:n}){return(0,e.jsxs)("svg",{viewBox:"0 0 20 20",fill:"currentColor",className:(0,a.cn)("block shrink-0",t),role:i?"img":void 0,"aria-hidden":!i||void 0,"aria-label":i,focusable:"false",children:[i?(0,e.jsx)("title",{children:i}):null,n]})}let i={aegilabs:{draw:function(){return(0,e.jsx)("path",{fillRule:"evenodd",d:"M9.05 2.05a2.5 2.5 0 0 1 1.9 0l5 2.03c.66.27 1.05.88 1.05 1.6v3.7c0 3.97-2.6 7.25-6.35 8.6a1.9 1.9 0 0 1-1.3 0C5.6 16.63 3 13.35 3 9.38v-3.7c0-.72.4-1.33 1.05-1.6l5-2.03ZM7.25 8.4a1 1 0 0 1 2 0v2.2a1 1 0 0 1-2 0V8.4Zm3.5 0a1 1 0 0 1 2 0v2.2a1 1 0 0 1-2 0V8.4Z"})},box:[3,1.85,17,18.1]},"liquid-glass":{draw:function(){return(0,e.jsx)("path",{fillRule:"evenodd",d:"M9.2 2.75a1 1 0 0 1 1.6 0c1.95 2.55 5.2 6.4 5.2 9.75a6 6 0 0 1-12 0c0-3.35 3.25-7.2 5.2-9.75ZM6.75 12.3a.75.75 0 0 1 1.5.05 2.75 2.75 0 0 0 1.85 2.75.75.75 0 1 1-.5 1.42 4.25 4.25 0 0 1-2.85-4.22Z"})},box:[4,2.35,16,18.5]},laya:{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"3.05",y:"5.5",width:"1.7",height:"10",rx:".85"}),(0,e.jsx)("rect",{x:"1.8",y:"8",width:"4.2",height:"5.5",rx:"1.3"}),(0,e.jsx)("rect",{x:"9.15",y:"2.5",width:"1.7",height:"11",rx:".85"}),(0,e.jsx)("rect",{x:"7.9",y:"4.5",width:"4.2",height:"7",rx:"1.3"}),(0,e.jsxs)("g",{opacity:".45",children:[(0,e.jsx)("rect",{x:"15.25",y:"7",width:"1.7",height:"10.5",rx:".85"}),(0,e.jsx)("rect",{x:"14",y:"9.5",width:"4.2",height:"5.5",rx:"1.3"})]})]})},box:[1.8,2.5,18.2,17.5]},archexcellence:{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"1.75",y:"2.75",width:"16.5",height:"2.5",rx:"1"}),(0,e.jsx)("path",{d:"M3 6.5h14v10a1 1 0 0 1-1 1h-2.6v-6a3.4 3.4 0 0 0-6.8 0v6H4a1 1 0 0 1-1-1v-10Z"})]})},box:[1.75,2.75,18.25,17.5]},sealed:{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M6.4 9V6.6a3.6 3.6 0 0 1 7.2 0V9",fill:"none",stroke:"currentColor",strokeWidth:"2.1",strokeLinecap:"round"}),(0,e.jsx)("path",{fillRule:"evenodd",d:"M3.5 10.9c0-1.33 1.07-2.4 2.4-2.4h8.2c1.33 0 2.4 1.07 2.4 2.4v4.7c0 1.33-1.07 2.4-2.4 2.4H5.9a2.4 2.4 0 0 1-2.4-2.4v-4.7Zm6.5.6a1.4 1.4 0 0 0-.7 2.61v1.24a.7.7 0 0 0 1.4 0v-1.24A1.4 1.4 0 0 0 10 11.5Z"})]})},box:[3.5,1.95,16.5,18]},skillsy:{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M3 17.5a1 1 0 0 1-1-1v-2.25a1 1 0 0 1 1-1h3.25V10a1 1 0 0 1 1-1h3.25V5.75a1 1 0 0 1 1-1H17a1 1 0 0 1 1 1V16.5a1 1 0 0 1-1 1H3Z"}),(0,e.jsx)("circle",{cx:"5",cy:"9",r:"1.6",opacity:".45"})]})},box:[2,4.75,18,17.5]},"spotify-wrapped":{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("rect",{x:"2.4",y:"6.5",width:"2.8",height:"7",rx:"1.4"}),(0,e.jsx)("rect",{x:"6.6",y:"2.5",width:"2.8",height:"15",rx:"1.4"}),(0,e.jsx)("rect",{x:"10.8",y:"4.75",width:"2.8",height:"10.5",rx:"1.4"}),(0,e.jsx)("rect",{x:"15",y:"7.5",width:"2.8",height:"5",rx:"1.4",opacity:".45"})]})},box:[2.4,2.5,17.8,17.5]},"comet-chat":{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("g",{fill:"none",stroke:"currentColor",strokeLinecap:"round",children:[(0,e.jsx)("path",{d:"M10.6 9.4 3.6 16.4",strokeWidth:"2.6",opacity:".45"}),(0,e.jsx)("path",{d:"M8.3 7.5 4.8 11",strokeWidth:"2",opacity:".3"}),(0,e.jsx)("path",{d:"M12.5 11.7 9 15.2",strokeWidth:"2",opacity:".3"})]}),(0,e.jsx)("circle",{cx:"13.2",cy:"6.8",r:"4"})]})},box:[2.3,2.8,17.2,17.7]},hologesture:{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("g",{fill:"none",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",children:[(0,e.jsx)("path",{d:"M6.6 10V5.1"}),(0,e.jsx)("path",{d:"M9.8 9.6V3.4"}),(0,e.jsx)("path",{d:"M13 9.8V4.2"}),(0,e.jsx)("path",{d:"M16 11V6.6"}),(0,e.jsx)("path",{d:"M6.2 13.6 3.6 10.9"})]}),(0,e.jsx)("path",{d:"M5.5 9.2h11.6v3.2a5.6 5.6 0 0 1-5.6 5.6h-.7a5.3 5.3 0 0 1-4.3-2.2L5 14.1a2 2 0 0 1 .5-.9V9.2Z"})]})},box:[2.5,2.3,17.1,18]},edenmorph:{draw:function(){return(0,e.jsxs)(e.Fragment,{children:[(0,e.jsx)("path",{d:"M8.7 2.9c2.4-.5 3.6 1.4 5.3 2.1 2.2.9 3 2.8 2.4 4.9-.5 1.5-1.6 2.1-1.7 3.7-.1 2.3-2.1 3.8-4.4 3.5-1.5-.2-2.3-1.1-3.8-1.2-2.2-.2-4.1-1.6-4.3-3.9-.2-1.9.9-2.8 1.2-4.4.5-2.5 2.6-4.2 5.3-4.7Z"}),(0,e.jsx)("circle",{cx:"16.4",cy:"16",r:"2",opacity:".45"})]})},box:[2.15,2.8,18.4,18]}},n={draw:function(){return(0,e.jsx)("rect",{x:"4",y:"4",width:"12",height:"12",rx:"3.5"})},box:[2.6,2.6,17.4,17.4]};function o({slug:t,className:a,title:s}){let l=i[t]??n,h=l.draw;return(0,e.jsx)(r,{className:a,title:s,children:(0,e.jsx)("g",{transform:function([t,e,a,r]){let i=18/Math.max(a-t,r-e),n=t=>Math.round(1e3*t)/1e3;return`translate(10 10) scale(${n(i)}) translate(${n(-(t+a)/2)} ${n(-(e+r)/2)})`}(l.box),children:(0,e.jsx)(h,{})})})}t.s(["ProjectIcon",0,o,"ProjectTile",0,function({slug:t,className:r}){return(0,e.jsx)("span",{className:(0,a.cn)("flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-tile",r),children:(0,e.jsx)(o,{slug:t,className:"size-5 text-primary brightness-[.82] dark:brightness-100"})})}])},76198,t=>{"use strict";let e=new Set;t.s(["onCommand",0,function(t){return e.add(t),()=>{e.delete(t)}},"openCommand",0,function(t="palette",a){var r;r={type:"open",view:t,prefill:a},[...e].forEach(t=>t(r))}])},91392,t=>{"use strict";let e=/^\d{4}-\d{2}(-\d{2})?$/;t.s(["formatMonthYear",0,function(t,a="short"){let r=function(t){if(t instanceof Date)return Number.isNaN(t.getTime())?null:t;let a=t.trim();if(e.test(a)){let[t,e,r="01"]=a.split("-");return new Date(Date.UTC(Number(t),Number(e)-1,Number(r)))}let r=new Date(a);return Number.isNaN(r.getTime())?null:/\d{1,2}:\d{2}/.test(a)?r:new Date(Date.UTC(r.getFullYear(),r.getMonth(),r.getDate()))}(t);return r?new Intl.DateTimeFormat("en-US",{month:a,year:"numeric",timeZone:"UTC"}).format(r):String(t)},"formatNumber",0,function(t){return new Intl.NumberFormat("en-US").format(t)},"pad",0,function(t,e=2){return(t<0?"-":"")+String(Math.abs(Math.trunc(t))).padStart(e,"0")}])},47261,t=>{"use strict";var e=t.i(71645);let a="theme",r="(prefers-color-scheme: dark)";function i(){try{let t=localStorage.getItem(a);if("light"===t||"dark"===t||"system"===t)return t}catch{}return"system"}function n(){return window.matchMedia(r).matches?"dark":"light"}function o(t){return"system"===t?n():t}let s=new Set,l=!1;function h(){s.forEach(t=>t())}function d(t){return l||(l=!0,window.matchMedia(r).addEventListener("change",()=>{"system"===i()&&g(n(),!1)}),window.addEventListener("storage",t=>{t.key===a&&g(o(i()),!1)})),s.add(t),()=>{s.delete(t)}}function c(t){let e=document.documentElement;e.setAttribute("data-theme-changing",""),e.classList.toggle("dark","dark"===t),e.style.colorScheme=t,window.getComputedStyle(e).color,requestAnimationFrame(()=>{requestAnimationFrame(()=>e.removeAttribute("data-theme-changing"))}),h()}function g(t,e){let a=document.documentElement;if(a.classList.contains("dark")===("dark"===t)){a.style.colorScheme=t,h();return}let r=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(!e||r||"function"!=typeof document.startViewTransition)return void c(t);a.setAttribute("data-theme-switch","");try{document.startViewTransition(()=>c(t)).finished.finally(()=>a.removeAttribute("data-theme-switch"))}catch{a.removeAttribute("data-theme-switch"),c(t)}}function u(){return i()}function p(){return document.documentElement.classList.contains("dark")?"dark":"light"}t.s(["getResolvedTheme",0,p,"setTheme",0,function(t){try{"system"===t?localStorage.removeItem(a):localStorage.setItem(a,t)}catch{}g(o(t),!0),h()},"syncTheme",0,function(){let t=o(i()),e=document.documentElement;e.classList.toggle("dark","dark"===t),e.style.colorScheme=t},"useResolvedTheme",0,function(){return(0,e.useSyncExternalStore)(d,p,()=>"light")},"useThemePreference",0,function(){return(0,e.useSyncExternalStore)(d,u,()=>"system")}],47261)},18566,(t,e,a)=>{e.exports=t.r(76562)}]);