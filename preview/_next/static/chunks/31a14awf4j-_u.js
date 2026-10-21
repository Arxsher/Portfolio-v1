(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,60276,t=>{"use strict";var e=t.i(43476),a=t.i(71645),i=t.i(16442),r=t.i(37047),n=t.i(45219);let s={ink:{head:[150,18],drag:[900,52],flow:20,rejoin:30,tension:52,chase:[95,14],string:.36,satellite:.014,stretch:.3,stretchSpeed:26,wobble:[300,9],lean:[240,12],blend:.3,dry:.9},mercury:{head:[190,21],drag:[1100,60],flow:30,rejoin:36,tension:110,chase:[130,17],string:.24,satellite:.02,stretch:.18,stretchSpeed:30,wobble:[520,13],lean:[420,17],blend:.24,dry:0},water:{head:[165,15],drag:[850,44],flow:20,rejoin:28,tension:80,chase:[90,12],string:.32,satellite:.018,stretch:.38,stretchSpeed:24,wobble:[240,5.5],lean:[190,7.5],blend:.34,dry:.7}},l=1/240;class o{x=0;v=0;m=0;on=!1;W=0;w=0;h=0;lean=0;copy(t){this.x=t.x,this.v=t.v,this.m=t.m,this.on=t.on,this.W=t.W,this.w=t.w,this.h=t.h,this.lean=t.lean}}class h{value=0;velocity=0;target=0;k;c;constructor(t,e){this.k=t,this.c=e}step(t){let e=-this.k*(this.value-this.target)-this.c*this.velocity;this.velocity+=e*t,this.value+=this.velocity*t}get quiet(){return .001>Math.abs(this.value-this.target)&&.01>Math.abs(this.velocity)}set(t){this.value=this.target=t,this.velocity=0}}class u{layout={slots:[{x0:0,x1:100}],height:40,room:4,min:0,max:100};feel=s.ink;index=0;head=new o;tail=new o;connected=!1;rejoined=!1;threads=[{on:!1,body:0,dir:1,len:0,r:0},{on:!1,body:1,dir:-1,len:0,r:0}];beads=[{on:!1,x:0,v:0,m:0},{on:!1,x:0,v:0,m:0}];nextBead=0;target=50;targetW=100;dragging=!1;dragX=0;press=new h(320,26);reach=new h(260,18);stretch=new h(300,9);lean=new h(240,12);landed=!0;lastV=0;accel=0;instant=!1;ripple={x:0,age:10,amp:0};prims=new Float32Array(60);primCount=0;events=Array.from({length:8},()=>({type:"land",x:0,strength:0,index:0}));eventCount=0;capsH={a:0,b:0,ra:0,rb:0};capsT={a:0,b:0,ra:0,rb:0};setFeel(t){this.feel=t,this.stretch.k=t.wobble[0],this.stretch.c=t.wobble[1],this.lean.k=t.lean[0],this.lean.c=t.lean[1]}setLayout(t){this.layout=t,this.rest(Math.min(this.index,t.slots.length-1))}get count(){return this.layout.slots.length}slotCentre(t){let e=this.layout.slots[t];return(e.x0+e.x1)/2}slotWidth(t){let e=this.layout.slots[t];return e.x1-e.x0}slotAt(t){let e=this.layout.slots;for(let a=0;a<e.length;a++)if(t<e[a].x1)return a;return e.length-1}widthAt(t){let e=this.layout.slots.length;if(t<=this.slotCentre(0))return this.slotWidth(0);for(let a=0;a<e-1;a++){let e=this.slotCentre(a),i=this.slotCentre(a+1);if(t<=i){let r=(t-e)/Math.max(.001,i-e),n=r*r*(3-2*r);return this.slotWidth(a)+(this.slotWidth(a+1)-this.slotWidth(a))*n}}return this.slotWidth(e-1)}rest(t){this.index=t,this.target=this.slotCentre(t),this.targetW=this.slotWidth(t);let e=this.head;for(let t of(e.on=!0,e.x=this.target,e.v=0,e.m=1,e.W=this.targetW,this.tail.on=!1,this.tail.m=0,this.connected=!1,this.threads))t.on=!1;for(let t of this.beads)t.on=!1;this.stretch.set(0),this.lean.set(0),this.reach.set(0),this.lastV=0,this.accel=0,this.landed=!0,this.dragging=!1,this.ripple.age=10,this.shape(),this.build()}seed(){let t=this.head,e=this.tail;e.on&&e.m>.12||(e.on&&(t.m+=e.m,e.on=!1),e.copy(t),e.on=!0,t.m=0,this.connected=!0,this.rejoined=!1)}select(t){let e=(t=Math.max(0,Math.min(this.count-1,t)))!==this.index;if(this.index=t,this.instant)return this.rest(t),e;let a=this.slotCentre(t);return!this.dragging&&Math.abs(a-this.head.x)>.6*this.layout.height&&this.seed(),this.target=a,this.targetW=this.slotWidth(t),this.landed=!1,e}grab(t){this.dragging=!0,this.dragX=t,this.reach.target=0,this.instant||(Math.abs(t-this.head.x)>.6*this.layout.height&&this.seed(),this.landed=!1)}drag(t){let e=this.layout;this.dragX=Math.max(e.min-e.height,Math.min(e.max+e.height,t));let a=this.slotAt(this.instant?this.dragX:this.head.x);return a!==this.index&&(this.instant?(this.rest(a),this.dragging=!0):this.index=a,this.emit("cross",this.head.x,Math.min(1,Math.abs(this.head.v)/(20*e.height)),a),!0)}release(){this.dragging=!1;let t=this.layout,e=this.slotAt(Math.max(t.min,Math.min(t.max,this.head.x+.11*this.head.v)));return(this.index=e,this.instant)?this.rest(e):(this.target=this.slotCentre(e),this.targetW=this.slotWidth(e),this.landed=!1),e}setPressed(t){this.press.target=+!!t,this.instant&&this.press.set(this.press.target)}hover(t){if(t<0||t===this.index||this.dragging||this.instant){this.reach.target=0;return}let e=Math.sign(this.slotCentre(t)-this.slotCentre(this.index)),a=1===Math.abs(t-this.index)?1:.72;this.reach.target=e*this.layout.height*.15*a}emit(t,e,a,i=this.index){if(this.eventCount>=8)return;let r=this.events[this.eventCount++];r.type=t,r.x=e,r.strength=a,r.index=i}fullArea(t){let e=this.layout.height;return(Math.max(t,e)-e)*e+Math.PI*e*e/4}sizeOf(t,e,a){let i=this.layout.height,r=Math.max(0,t)*this.fullArea(e),n=Math.sqrt(4*r/Math.PI),s=n;n>i&&(n=i,s=(r-Math.PI*i*i/4)/i+i),a.w=s,a.h=n}gap(){return Math.abs(this.head.x-this.tail.x)-(this.head.w+this.tail.w)/2}facingRadius(t,e){return t.h/2*Math.max(.3,Math.min(1.3,1+e*t.lean))}neck(){let t,e=this.head,a=this.tail,i=this.facingRadius(a,Math.sign(e.x-a.x)),r=this.facingRadius(e,Math.sign(a.x-e.x)),n=Math.max(0,this.gap())+i+r;return n<=.001?0:(t=(1-this.feel.string*this.fullArea(e.W)/(2*n)/Math.max(.001,(i+r)/2))*1.5)<0?0:t>1?1:t}step(t){this.eventCount=0;let e=Math.min(Math.max(0,t),.1);for(;e>1e-6;){let t=Math.min(l,e);this.substep(t),e-=t}return this.ripple.age+=t,this.shape(),this.build(),!this.settled()}wall(t,e){let a=this.layout,i=t+e/2-a.max;if(i>0)return-i;let r=a.min-(t-e/2);return r>0?r:0}substep(t){let e=this.feel,a=this.layout.height,i=this.head,r=this.tail,[n,s]=this.dragging?e.drag:e.head,l=this.dragging?this.dragX:this.target,o=i.x-this.target,h=this.dragging?6*a:4*a,u=n*Math.max(-h,Math.min(h,l-i.x))-s*i.v,c=this.wall(i.x,i.w);0!==c&&(u+=2600*c-(Math.sign(c)!==Math.sign(i.v)?24*i.v:0)),i.v+=u*t,i.x+=i.v*t;let d=this.dragging?this.widthAt(i.x):this.targetW;if(i.W+=(d-i.W)*(1-Math.exp(-14*t)),!this.landed&&!this.dragging){let t=i.x-this.target;(0!==o&&Math.sign(t)!==Math.sign(o)||Math.abs(t)<Math.max(2,.05*i.W))&&(this.landed=!0,this.emit("land",i.x,Math.min(1,Math.abs(i.v)/(30*a)),this.index))}if(0!==c&&Math.abs(i.v)>8*a&&Math.sign(i.v)!==Math.sign(c)&&this.emit("wall",i.x,Math.min(1,Math.abs(i.v)/(30*a))),r.on){let n;if(this.connected&&this.rejoined)n=1.5*e.chase[0]*(i.x-r.x)-30*(r.v-i.v);else if(this.connected){let t=this.neck();n=e.tension*(1-t)*(i.x-r.x)-9*r.v}else n=e.chase[0]*(i.x-r.x)-e.chase[1]*(r.v-.4*i.v);let s=this.wall(r.x,r.w);0!==s&&(n+=2600*s),r.v+=n*t,r.x+=r.v*t,r.W+=(i.W-r.W)*(1-Math.exp(-3*t));let l=this.gap();if(this.connected){let a=this.neck(),n=Math.abs(i.x-r.x)+r.w/2<=i.w/2+.5,s=1+3*Math.max(0,1-r.m/.25),o=(n?1.6*e.rejoin:this.rejoined?e.rejoin:e.flow*(1-a))*s,h=r.m*(1-Math.exp(-o*t));r.m-=h,i.m+=h,a>=.985&&l>0&&this.pinch(l)}else if(l<.04*a){this.connected=!0,this.rejoined=!0;let t=r.v-i.v,e=r.m/Math.max(.001,r.m+i.m);i.v+=t*e*.22;let n=Math.sign(r.x-i.x);this.lean.velocity+=n*Math.min(5,Math.abs(t)/a*.25)*e,this.stretch.velocity-=Math.min(4,Math.abs(t)/a*.2)*e,this.ripple.x=i.x+n*i.w*.4,this.ripple.age=0,this.ripple.amp=Math.min(1,2*e+.3),this.emit("join",(i.x+r.x)/2,Math.min(1,Math.abs(t)/(18*a)*.6+e))}r.m<.004&&(i.m+=r.m,r.m=0,r.on=!1,this.connected=!1)}else i.m<1&&(i.m=1);for(let a of this.beads){if(!a.on)continue;let n=r.on&&Math.abs(r.x-a.x)<Math.abs(i.x-a.x)?r:i,s=1.25*e.chase[0]*(n.x-a.x)-1.1*e.chase[1]*(a.v-.5*n.v);if(a.v+=s*t,a.x+=a.v*t,Math.abs(n.x-a.x)-n.w/2-this.beadRadius(a.m)<0){let e=a.m*(1-Math.exp(-26*t));a.m-=e,n.m+=e,a.m<6e-4&&(n.m+=a.m,a.on=!1)}}for(let e of this.threads)e.on&&(e.len*=Math.exp(-t/.022),e.len<1.2&&(e.on=!1));let m=Math.min(1,Math.abs(i.v)/(a*e.stretchSpeed));this.stretch.target=m*e.stretch*(this.dragging?1.35:1),this.stretch.step(t);let f=(i.v-this.lastV)/t;this.lastV=i.v,this.accel+=(f-this.accel)*(1-Math.exp(-t/.03));let p=Math.sign(i.v)*Math.sqrt(m)*.1;this.lean.target=Math.max(-.2,Math.min(.2,p-this.accel/(1100*a))),this.lean.step(t),this.press.step(t),this.reach.step(t)}beadRadius(t){return Math.sqrt(t*this.fullArea(this.head.W)/Math.PI)}pinch(t){let e=this.head,a=this.tail;this.connected=!1;let i=Math.sign(e.x-a.x)||1,r=Math.max(.8,.06*Math.min(e.h,a.h)),n=this.threads[0];n.on=!0,n.body=0,n.dir=-i,n.len=.45*t,n.r=r;let s=this.threads[1];s.on=!0,s.body=1,s.dir=i,s.len=.45*t,s.r=r;let l=this.feel.satellite;if(l>0&&a.m>2*l){let r=this.beads[this.nextBead];this.nextBead=(this.nextBead+1)%this.beads.length,r.on&&(e.m+=r.m),r.on=!0,r.x=a.x+i*(a.w/2+.5*t),r.v=(e.v+a.v)*.5,r.m=l,a.m-=l}this.emit("pinch",(e.x+a.x)/2,Math.min(1,.4+Math.abs(e.v-a.v)/(40*this.layout.height)))}shape(){let t=this.layout,e=t.height,a=this.head,i=this.tail,r=Math.max(0,this.press.value);this.sizeOf(a.m,a.W,a);let n=Math.max(.7,1+this.stretch.value),s=a.w*n,l=a.h/n;l*=1+r*(t.room/e)*1.5,s*=1+.035*r;let o=e+2*t.room*.86;l>o&&(s*=l/o,l=o);let h=Math.max(0,a.x+s/2-t.max)+Math.max(0,t.min-(a.x-s/2));if(h>0){let t=Math.max(.7*l,s-.85*h);l=Math.min(o,l*Math.sqrt(s/t)),s=t}if(a.w=Math.max(s,l),a.h=l,a.lean=Math.max(-.2,Math.min(.2,this.lean.value)),i.on){this.sizeOf(i.m,i.W,i);let t=Math.min(1,Math.abs(i.v)/(e*this.feel.stretchSpeed)),a=1+t*this.feel.stretch*.8;i.w*=a,i.h/=a,i.lean=this.connected?0:Math.sign(i.v)*t*.22}}push(t,e,a,i,r){if(this.primCount>=12||a<.05&&i<.05)return;if(t>e){let r=t;t=e,e=r,r=a,a=i,i=r}let n=5*this.primCount,s=this.prims;s[n]=t,s[n+1]=e,s[n+2]=a,s[n+3]=i,s[n+4]=r,this.primCount++}caps(t,e){let a=t.h/2,i=a*Math.max(.3,Math.min(1.3,1-t.lean)),r=a*Math.max(.3,Math.min(1.3,1+t.lean)),n=t.x-t.w/2+i,s=t.x+t.w/2-r;n>s&&(n=s=(n+s)/2),e.a=n,e.b=s,e.ra=i,e.rb=r}build(){this.primCount=0;let t=this.head,e=this.tail,a=this.capsH,i=this.capsT;if(t.m>1e-4){this.caps(t,a);let e=this.reach.value;if(Math.abs(e)>.05){let t=1-Math.min(.14,Math.abs(e)/this.layout.height*.7);e>0?(a.b+=e,a.rb*=t):(a.a+=e,a.ra*=t)}this.push(a.a,a.b,a.ra,a.rb,1)}else a.a=a.b=t.x,a.ra=a.rb=0;for(let t of(e.on&&e.m>1e-4&&(this.caps(e,i),this.push(i.a,i.b,i.ra,i.rb,1),this.connected&&this.bridge(i,a)),this.threads)){if(!t.on||1===t.body&&!e.on)continue;let r=0===t.body?a:i,n=t.dir>0?r.b:r.a,s=t.dir>0?r.rb:r.ra,l=n+t.dir*s,o=Math.min(1,t.len/(.5*this.layout.height));this.push(l-t.dir*s*.4,l+t.dir*t.len,Math.min(.45*s,2.6*t.r)*(.4+.6*o),t.r*(.5+.5*o),0)}for(let t of this.beads){if(!t.on)continue;let e=this.beadRadius(t.m),a=Math.min(1,Math.abs(t.v)/(this.layout.height*this.feel.stretchSpeed)),i=e*a*.7,r=e*(1-.18*a);this.push(t.x-i,t.x+i,r,r,0)}}bridge(t,e){let a=Math.sign(this.head.x-this.tail.x)||1,i=a>0?t.b:t.a,r=(a>0?t.rb:t.ra)*.94,n=a>0?e.a:e.b,s=(a>0?e.ra:e.rb)*.94;if((n-i)*a<-Math.min(r,s))return;let l=this.neck(),o=i,h=r;for(let t=1;t<=4;t++){let e=t/4,a=i+(n-i)*e,u=(r+(s-r)*e)*Math.max(0,1-4*l*e*(1-e));this.push(o,a,Math.max(h,.25),Math.max(u,.25),0),o=a,h=u}}settled(){let t=this.head;if(this.dragging||this.tail.on)return!1;for(let t of this.beads)if(t.on)return!1;for(let t of this.threads)if(t.on)return!1;return!(Math.abs(t.x-this.target)>.05||Math.abs(t.v)>.5||Math.abs(t.W-this.targetW)>.05)&&!!this.stretch.quiet&&!!this.lean.quiet&&!!this.press.quiet&&!!this.reach.quiet&&this.ripple.age>1.6}}let c=[{value:"ink",label:"Ink"},{value:"mercury",label:"Mercury"},{value:"water",label:"Water"}],d={ink:0,mercury:1,water:2},m={ink:.95,mercury:0,water:.8},f=t=>[parseInt(t.slice(1,3),16)/255,parseInt(t.slice(3,5),16)/255,parseInt(t.slice(5,7),16)/255],p={floor:f("#e6e6e6"),label:f("#6e6e6e"),fg:f("#171717"),onInk:f("#fbfbfb")},x={floor:f("#1a1a1a"),label:f("#9a9a9a"),fg:f("#f2f2f2"),onInk:f("#1a1a1a")},g=(t,e=1)=>`rgb(${Math.round(255*t[0])} ${Math.round(255*t[1])} ${Math.round(255*t[2])} / ${e})`,b=["Work","Lab","Writing","GitHub","Guestbook"],v=["Work","Lab","Writing","GitHub"];function y(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(t)return`${t}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}let M=null;function w(t,e,a){let i=M||(M=document.createElement("canvas").getContext("2d"));return i?(i.font=`500 ${e}px ${a}`,t.map(t=>i.measureText(t).width)):t.map(t=>t.length*e*.56)}class T{origin=0;count=0;rho=0;raw=new Float32Array(1);dil=new Float32Array(1);kernel=new Float32Array(1);reach=0;r=new Float32Array(1);data=new Float32Array(2);rBuf=new Float32Array(1);get step(){return .5}resize(t,e,a){let i=Math.ceil((t+2*e)*2)+1;if(this.origin=-e,i!==this.count&&(this.count=i,this.raw=new Float32Array(i),this.dil=new Float32Array(i),this.rBuf=new Float32Array(i),this.data=new Float32Array(2*i)),a!==this.rho){this.rho=a;let t=Math.max(1,Math.ceil(2*a));this.reach=t,this.kernel=new Float32Array(t+1);for(let e=0;e<=t;e++){let t=e/2;this.kernel[e]=Math.sqrt(Math.max(0,a*a-t*t))}}}at(t){let e=(t-this.origin)*2,a=Math.floor(e);if(a<0||a>=this.count-1)return 0;let i=this.rBuf,r=i[a]+(i[a+1]-i[a])*(e-a);return r>0?r:0}get values(){return this.rBuf}compute(t,e){let a=this.count,i=this.raw;i.fill(-1);let r=a,n=-1;for(let s=0;s<e;s++){let e=5*s,l=t[e],o=t[e+1],h=t[e+2],u=t[e+3],c=t[e+4],d=Math.max(0,Math.ceil((l-h-this.origin)*2)),m=Math.min(a-1,Math.floor((o+u-this.origin)*2)),f=o-l;for(let t=d;t<=m;t++){let e=this.origin+.5*t,a=-1;if(e>=l&&e<=o&&f>1e-4){let t=(e-l)/f;c>0&&(t=t*t*(3-2*t)),a=h+(u-h)*t}let r=e-l;if(r*r<h*h){let t=Math.sqrt(h*h-r*r);t>a&&(a=t)}let n=e-o;if(n*n<u*u){let t=Math.sqrt(u*u-n*n);t>a&&(a=t)}a>i[t]&&(i[t]=a)}d<r&&(r=d),m>n&&(n=m)}let s=this.rBuf;if(n<r){s.fill(-64),this.pack();return}let l=this.reach,o=this.kernel,h=this.dil,u=Math.max(0,r-l),c=Math.min(a-1,n+l);h.fill(-1);for(let t=u;t<=c;t++){let e=-1,a=Math.max(r,t-l),s=Math.min(n,t+l);for(let r=a;r<=s;r++){let a=i[r];if(a<0)continue;let n=a+o[r>t?r-t:t-r];n>e&&(e=n)}h[t]=e}s.fill(-1);for(let t=r;t<=n;t++){let e=1e9,r=t-l,n=t+l;for(let i=r;i<=n;i++){let r=i<0||i>=a?-1:h[i],n=r<0?-1e9:r-o[i>t?i-t:t-i];if(n<e&&(e=n)<0)break}let u=Math.max(e,i[t]);s[t]=u>=0?u:-1}let d=-1e9;for(let t=0;t<a;t++)s[t]>=0?d=t:s[t]=-Math.min(64,(t-d)*.5);d=1e9;for(let t=a-1;t>=0;t--)s[t]>=0?d=t:s[t]=Math.max(s[t],-Math.min(64,(d-t)*.5));this.pack()}pack(){let t=this.rBuf,e=this.data,a=this.count;for(let i=0;i<a;i++){let r=t[i>0?i-1:0],n=(t[i<a-1?i+1:a-1]-r)*1;n>10?n=10:n<-10&&(n=-10),e[2*i]=t[i],e[2*i+1]=n}}}class R{values=new Float32Array(1);bytes=new Uint8Array(1);active=!1;dirty=!0;resize(t){let e=Math.max(1,Math.ceil(t/2)+1);e!==this.values.length&&(this.values=new Float32Array(e),this.bytes=new Uint8Array(e)),this.clear()}clear(){this.values.fill(0),this.bytes.fill(0),this.active=!1,this.dirty=!0}update(t,e,a,i){let r=this.values,n=!1;if(a<=0)for(let t=0;t<r.length;t++)r[t]<=0||(r[t]=Math.max(0,r[t]-3*i),n=!0);else{let s=Math.exp(-i/a);for(let a=0;a<r.length;a++){let l=Math.min(1,t.at(2*a)/e),o=r[a]*s-.12*i;l>o&&(o=l),o<0&&(o=0),Math.abs(o-r[a])>1e-4&&(n=!0),r[a]=o}}if(n||this.active){let t=this.bytes;for(let e=0;e<r.length;e++)t[e]=Math.round(255*Math.min(1,r[e]));this.dirty=!0}this.active=n}}var A=t.i(55171);let k=A.FULLSCREEN_VERTEX,E=`#version 300 es
precision highp float;
precision highp int;

uniform vec2 uCanvas;
uniform float uDpr;
uniform vec4 uBar;
uniform float uDropH;
uniform sampler2D uProfile;
uniform vec3 uProf;
uniform sampler2D uWet;
uniform float uWetLen;
uniform sampler2D uLabels;
uniform float uDark;
uniform vec3 uFloor;
uniform vec3 uLabelCol;
uniform vec3 uFg;
uniform vec3 uOnInk;
uniform vec4 uMat;
uniform vec4 uRipple;
uniform float uPress;
uniform float uWetK;

out vec4 outColor;

const vec3 V = vec3(0.0, 0.0, 1.0);
const float KAPPA = 0.86;
const float POW = 2.4;

vec2 prof(float x) {
  float f = (x - uProf.x) * uProf.y;
  if (f < 0.0 || f > uProf.z - 1.001) return vec2(-64.0, 0.0);
  float i0 = floor(f);
  int i = int(i0);
  vec2 a = texelFetch(uProfile, ivec2(i, 0), 0).rg;
  vec2 b = texelFetch(uProfile, ivec2(i + 1, 0), 0).rg;
  return mix(a, b, f - i0);
}

/* Distance to the liquid for soft effects: vertical over the liquid, radial past its ends. */
float softDist(float y, float r) {
  return r >= 0.0 ? abs(y) - r : length(vec2(r, y));
}

float channelDist(vec2 q) {
  vec2 c = q - uBar.zw * 0.5;
  float hh = uBar.w * 0.5;
  return length(vec2(max(abs(c.x) - (uBar.z * 0.5 - hh), 0.0), c.y)) - hh;
}

/* The channel floor at q (bar-local CSS px): walls, wet film, labels. */
vec3 floorAt(vec2 q, vec3 labelColor) {
  vec3 col = uFloor;
  float dc = channelDist(q);
  float hh = uBar.w * 0.5;
  float yc = (q.y - hh) / hh;
  float inner = max(-dc, 0.0);
  float top = smoothstep(0.35, -0.9, yc);
  col *= 1.0 - mix(0.11, 0.34, uDark) * top * exp(-inner / 2.4) - mix(0.035, 0.08, uDark) * top * exp(-inner / 9.0);
  float bottom = smoothstep(0.25, 0.95, yc);
  col += mix(0.05, 0.022, uDark) * bottom * exp(-inner / 1.3);

  float w = texture(uWet, vec2(clamp(q.x / uWetLen, 0.0, 1.0), 0.5)).r;
  if (w > 0.003) {
    float y = abs(q.y - hh);
    float band = w * uDropH * 0.47;
    float a = smoothstep(band + 1.0, band - 1.0, y) * sqrt(w) * uWetK;
    col = mix(col, col * mix(0.91, 1.0, uDark) + vec3(mix(0.0, 0.03, uDark)), a);
    float sheen = exp(-pow((y - band * 0.8) / 1.0, 2.0)) * step(q.y, hh) * a;
    col += sheen * mix(0.08, 0.05, uDark);
  }

  float l = texture(uLabels, q / uBar.zw).a;
  return mix(col, labelColor, l);
}

float softbox(vec3 R) {
  return smoothstep(0.3, 0.42, -R.y) * (1.0 - smoothstep(0.5, 0.8, abs(R.x + 0.08)));
}

float stripLight(vec3 R) {
  return smoothstep(0.52, 0.62, R.x) * (1.0 - smoothstep(0.74, 0.86, R.x)) * (1.0 - smoothstep(0.08, 0.36, abs(R.y + 0.12)));
}

float glint(vec3 N, float sharp) {
  vec3 L = normalize(vec3(-0.42, -0.78, 0.9));
  return pow(max(dot(N, normalize(L + V)), 0.0), sharp);
}

float lambert(vec3 N) {
  return max(dot(N, normalize(vec3(-0.42, -0.78, 0.9))), 0.0);
}

vec3 shadeInk(vec3 N, vec2 q, float z) {
  vec3 R = reflect(-V, N);
  float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
  float la = texture(uLabels, (q + N.xy * z * 0.12) / uBar.zw).a;
  // black ink (light room)
  vec3 cb = vec3(0.05) + 0.03 * lambert(N);
  cb = mix(cb, uOnInk, la);
  // what the rim sees at grazing angles: the floor right beside it, in its shadow
  vec3 room = uFloor * mix(0.5, 0.62, smoothstep(0.0, 0.6, R.y));
  vec3 env = vec3(softbox(R) * (6.5 + uPress * 2.0) + stripLight(R) * 2.0 + 0.04) + room * smoothstep(0.35, -0.2, R.z);
  cb += F * env + glint(N, 90.0) * 0.85;
  // white enamel (dark room)
  vec3 cw = vec3(0.9) * (0.6 + 0.4 * lambert(N));
  cw = mix(cw, uOnInk, la);
  vec3 envw = vec3(softbox(R) * 1.5 + stripLight(R) * 0.6) + mix(vec3(0.8), uFloor, smoothstep(0.05, 0.6, R.y));
  cw = mix(cw, envw, F * 0.85) + glint(N, 90.0) * 0.4;
  return mix(cb, cw, uDark);
}

vec3 shadeMercury(vec3 N, vec2 q) {
  // a mirror bead seen from above: the bright ceiling and a soft key on its
  // flat top, the dark walls of the room in a band round its shoulders, and
  // the pale floor in a thin rim at the very edge
  vec3 R = reflect(-V, N);
  vec2 k = (R.xy - vec2(-0.14, -0.3)) / vec2(0.55, 0.32);
  float env = mix(0.36, 0.9, smoothstep(-0.1, 0.85, R.z)) + 0.48 * exp(-dot(k, k));
  float wall = smoothstep(0.42, 0.16, R.z) * smoothstep(-0.62, -0.4, R.z);
  env = mix(env, mix(0.27, 0.15, uDark) + 0.07 * smoothstep(-0.2, 0.4, R.y), wall);
  float rim = smoothstep(-0.48, -0.72, R.z);
  vec3 col = mix(vec3(env), uFloor * mix(1.02, 0.9, step(0.0, R.y)), rim);
  col += stripLight(R) * 0.45;
  col *= mix(1.0, 0.72, uDark);
  float la = texture(uLabels, q / uBar.zw).a;
  col = mix(col, vec3(mix(0.08, 0.06, uDark)), la * 0.9);
  return col + glint(N, 160.0) * 0.7;
}

vec3 shadeWater(vec3 N, vec2 q, float z, float s, float yn) {
  vec2 off = -N.xy * z * 0.3;
  vec3 col = floorAt(q + off, uFg) * mix(0.975, 1.03, uDark);
  col *= 1.0 - mix(0.4, 0.3, uDark) * smoothstep(0.6, 1.0, s);
  col += mix(0.2, 0.08, uDark) * exp(-pow((yn - 0.42) / 0.22, 2.0)) * smoothstep(0.98, 0.55, s);
  vec3 R = reflect(-V, N);
  float F = 0.02 + 0.98 * pow(1.0 - N.z, 5.0);
  col += F * (softbox(R) * (4.5 + uPress * 1.5) + stripLight(R) * 1.4);
  return col + glint(N, 120.0) * 0.9;
}

vec3 shadeAs(float m, vec3 N, vec2 q, float z, float s, float yn) {
  if (m < 0.5) return shadeInk(N, q, z);
  if (m < 1.5) return shadeMercury(N, q);
  return shadeWater(N, q, z, s, yn);
}

/* how dark a material's shadow is, and how opaque it is when thin */
float shadowOf(float m) {
  if (m < 0.5) return mix(0.2, 0.55, uDark);
  if (m < 1.5) return mix(0.24, 0.55, uDark);
  return mix(0.07, 0.3, uDark);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uDpr;
  vec2 q = frag - uBar.xy;
  float px = 1.0 / uDpr;
  float dc = channelDist(q);
  float hh = uBar.w * 0.5;
  float yc = (q.y - hh) / hh;

  // the lip: the cut's lower edge catches the light
  float lip = (1.0 - smoothstep(0.0, 1.3, dc)) * smoothstep(-0.1, 0.85, yc) * mix(0.85, 0.07, uDark);
  float chA = clamp(0.5 - dc / px, 0.0, 1.0);
  if (chA <= 0.0) {
    outColor = vec4(vec3(1.0) * lip, lip) * step(0.0, dc);
    return;
  }

  vec2 p = vec2(q.x, q.y - hh);
  vec2 pr = prof(q.x);
  // antialiasing wants the distance across the outline (slope-corrected);
  // past the ends there is only the tip to be near
  float d = pr.x >= 0.0 ? (abs(p.y) - pr.x) * inversesqrt(1.0 + pr.y * pr.y) : length(vec2(pr.x, p.y));

  // which material shades this pixel (a wipe spreads the new one outward)
  float wipe = 1.0;
  if (uMat.z < 1.0) wipe = 1.0 - smoothstep(-6.0, 6.0, abs(q.x - uMat.w) - uMat.z * (uBar.z + 40.0));
  float matA = uMat.x;
  float matB = uMat.y;

  vec3 col = floorAt(q, uLabelCol);
  // soft shadow (offset down a little) and a tight contact shadow
  vec2 ps = prof(q.x + 0.5);
  float ds = softDist(p.y - 2.2, ps.x);
  float dc0 = softDist(p.y, pr.x);
  float sk = mix(shadowOf(matA), shadowOf(matB), wipe) * (1.0 + uPress * 0.25);
  col *= 1.0 - sk * (1.0 - smoothstep(-3.0, 4.5, ds)) * 0.55 - sk * 0.3 * exp(-max(dc0, 0.0) / 1.5) * step(0.0, dc0);

  float cov = clamp(0.5 - d / px, 0.0, 1.0);
  if (cov > 0.0) {
    float r = max(pr.x, 1e-3);
    float yn = clamp(p.y / r, -1.0, 1.0);
    float s = abs(yn);
    float sp = pow(s, POW - 1.0);
    float dzdy = -KAPPA * POW * sp * sign(p.y);
    float dzdx = KAPPA * pr.y * (1.0 + (POW - 1.0) * sp * s);
    // a ripple running out from where a remnant merged
    if (uRipple.z > 0.001) {
      float dx = q.x - uRipple.x;
      float age = uRipple.y;
      float front = age * 420.0;
      float env = uRipple.z * exp(-age * 5.5) * exp(-pow((abs(dx) - front) / 26.0, 2.0));
      dzdx += env * 0.55 * sin(abs(dx) * 0.22 - age * 34.0) * sign(dx);
    }
    vec3 N = normalize(vec3(-dzdx, -dzdy, 1.0));
    float z = KAPPA * r * (1.0 - sp * s);
    vec3 dropCol = shadeAs(matA, N, q, z, s, yn);
    if (wipe > 0.001 && matB != matA) dropCol = mix(dropCol, shadeAs(matB, N, q, z, s, yn), wipe);
    // a hairline of liquid is thin enough to see through a little
    float body = mix(0.5, 1.0, smoothstep(0.4, 2.6, r));
    col = mix(col, min(dropCol, vec3(1.0)), cov * body);
  }

  float a = chA + lip * (1.0 - chA) * step(0.0, dc);
  outColor = vec4(col * chA + vec3(1.0) * lip * (1.0 - chA) * step(0.0, dc), a);
}
`;class P{gl;program;vao;u;profileTex;wetTex;labelTex;profileW=0;wetW=0;hasLabels=!1;last={x:0,y:0,w:0,h:0};constructor(t){this.gl=t,this.program=(0,A.createProgram)(t,k,E),this.u=(0,A.uniformLocations)(t,this.program),this.vao=t.createVertexArray();const e=e=>{let a=t.createTexture();return t.bindTexture(t.TEXTURE_2D,a),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),a};this.profileTex=e(t.NEAREST),this.wetTex=e(t.LINEAR),this.labelTex=e(t.LINEAR),t.bindTexture(t.TEXTURE_2D,this.labelTex),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array(4)),t.useProgram(this.program),t.uniform1i(this.u("uProfile"),0),t.uniform1i(this.u("uWet"),1),t.uniform1i(this.u("uLabels"),2)}setLabels(t){let e=this.gl;e.bindTexture(e.TEXTURE_2D,this.labelTex),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,e.RGBA,e.UNSIGNED_BYTE,t),this.hasLabels=!0}get labelsReady(){return this.hasLabels}render(t,e,a){let i=this.gl;i.useProgram(this.program),i.bindVertexArray(this.vao),i.disable(i.BLEND),i.disable(i.DEPTH_TEST),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.profileTex),i.pixelStorei(i.UNPACK_ALIGNMENT,1),this.profileW!==e.count?(this.profileW=e.count,i.texImage2D(i.TEXTURE_2D,0,i.RG32F,e.count,1,0,i.RG,i.FLOAT,e.data)):i.texSubImage2D(i.TEXTURE_2D,0,0,0,e.count,1,i.RG,i.FLOAT,e.data),i.activeTexture(i.TEXTURE1),i.bindTexture(i.TEXTURE_2D,this.wetTex);let r=a.bytes.length;this.wetW!==r?(this.wetW=r,i.texImage2D(i.TEXTURE_2D,0,i.R8,r,1,0,i.RED,i.UNSIGNED_BYTE,a.bytes),a.dirty=!1):a.dirty&&(i.texSubImage2D(i.TEXTURE_2D,0,0,0,r,1,i.RED,i.UNSIGNED_BYTE,a.bytes),a.dirty=!1),i.activeTexture(i.TEXTURE2),i.bindTexture(i.TEXTURE_2D,this.labelTex);let n=this.u;i.uniform2f(n("uCanvas"),t.width,t.height),i.uniform1f(n("uDpr"),t.dpr),i.uniform4f(n("uBar"),t.bar.x,t.bar.y,t.bar.width,t.bar.height),i.uniform1f(n("uDropH"),t.dropH),i.uniform3f(n("uProf"),e.origin,1/e.step,e.count),i.uniform1f(n("uWetLen"),2*r),i.uniform1f(n("uDark"),t.dark),i.uniform3f(n("uFloor"),t.floor[0],t.floor[1],t.floor[2]),i.uniform3f(n("uLabelCol"),t.label[0],t.label[1],t.label[2]),i.uniform3f(n("uFg"),t.fg[0],t.fg[1],t.fg[2]),i.uniform3f(n("uOnInk"),t.onInk[0],t.onInk[1],t.onInk[2]),i.uniform4f(n("uMat"),t.mat[0],t.mat[1],t.mat[2],t.mat[3]),i.uniform4f(n("uRipple"),t.ripple[0],t.ripple[1],t.ripple[2],0),i.uniform1f(n("uPress"),t.press),i.uniform1f(n("uWetK"),t.wetK);let s=Math.max(0,Math.floor((t.bar.x-3)*t.dpr)),l=Math.max(0,Math.floor((t.bar.y-3)*t.dpr)),o=Math.min(t.width,Math.ceil((t.bar.x+t.bar.width+3)*t.dpr)),h=Math.min(t.height,Math.ceil((t.bar.y+t.bar.height+3)*t.dpr)),u={x:s,y:t.height-h,w:Math.max(0,o-s),h:Math.max(0,h-l)};i.enable(i.SCISSOR_TEST);let c=this.last;c.w>0&&(c.x!==u.x||c.y!==u.y||c.w!==u.w||c.h!==u.h)&&(i.scissor(c.x,c.y,c.w,c.h),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT)),i.scissor(u.x,u.y,u.w,u.h),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT),i.drawArrays(i.TRIANGLES,0,3),i.disable(i.SCISSOR_TEST),c.x=u.x,c.y=u.y,c.w=u.w,c.h=u.h}resized(){this.last.w=0}dispose(){let t=this.gl;t.deleteProgram(this.program),t.deleteVertexArray(this.vao),t.deleteTexture(this.profileTex),t.deleteTexture(this.wetTex),t.deleteTexture(this.labelTex)}}let q=0,D=0,C=0,W=0,B=[0,2,4,7,9,12,14];function F(){return(0,i.audioReady)()?(0,i.getAudio)():null}function L(t,e){if("function"!=typeof t.createStereoPanner)return null;let a=t.createStereoPanner();return a.pan.value=Math.max(-.7,Math.min(.7,e)),a}function S(t,e,a,r=0){let n=F();if(!n)return;let s=performance.now();if(s-q<55)return;q=s;let{ctx:l,output:o}=n,h=l.currentTime,u=.05+.13*Math.max(0,Math.min(1,a)),c=("mercury"===t?980:"water"===t?620:430)*Math.pow(2,B[Math.max(0,Math.min(B.length-1,e))]/24),d="mercury"===t?.07:"water"===t?.09:.12,m=l.createGain();m.gain.value=1;let f=L(l,r);f?m.connect(f).connect(o):m.connect(o);let p=l.createOscillator();p.type="sine",p.frequency.setValueAtTime(c,h),p.frequency.exponentialRampToValueAtTime(c*("mercury"===t?1.35:"water"===t?2.1:1.7),h+.035);let x=l.createGain();if(x.gain.setValueAtTime(0,h),x.gain.linearRampToValueAtTime(u,h+.003),x.gain.exponentialRampToValueAtTime(1e-4,h+d),p.connect(x).connect(m),p.start(h),p.stop(h+d+.03),"mercury"===t){let t=l.createOscillator();t.type="sine",t.frequency.value=2.76*c;let e=l.createGain();e.gain.setValueAtTime(0,h),e.gain.linearRampToValueAtTime(.35*u,h+.002),e.gain.exponentialRampToValueAtTime(1e-4,h+.16),t.connect(e).connect(m),t.start(h),t.stop(h+.2)}else{let e=l.createBufferSource();e.buffer=(0,i.noiseBuffer)(l);let a=l.createBiquadFilter();a.type="bandpass",a.frequency.value="water"===t?2600:1700,a.Q.value=1.1;let r=l.createGain();r.gain.setValueAtTime(0,h),r.gain.linearRampToValueAtTime(.28*u,h+.002),r.gain.exponentialRampToValueAtTime(1e-4,h+.028),e.connect(a).connect(r).connect(m),e.start(h,.5*Math.random(),.05)}}let N=[[3,1.5],[2,1],[0,1.45],[1,.95],[3,1.35],[0,1.5]];t.s(["default",0,function({mode:t,active:l,reducedMotion:o,theme:h}){let f="stage"===t,M=f?b:v,A=(0,a.useRef)(null),k=(0,a.useRef)(null),E=(0,a.useRef)([]),q=(0,a.useRef)(null),z=(0,a.useRef)(null),I=(0,r.useFinePointer)(),_=(0,r.useElementSize)(A),[V]=(0,a.useState)(()=>{let t=new u;return t.index=+!!f,t}),[U]=(0,a.useState)(()=>new T),[X]=(0,a.useState)(()=>new R),[G]=(0,a.useState)(()=>"u"<typeof document?null:document.createElement("canvas")),[O,j]=(0,a.useState)(V.index),[K,$]=(0,a.useState)("ink"),[H,Y]=(0,a.useState)(""),[Q,J]=(0,a.useState)(0),Z=(0,r.useLatest)({reducedMotion:o,stage:f,material:K}),tt=(0,a.useRef)({dark:+("dark"===h),darkTarget:+("dark"===h),room:{floor:[0,0,0],label:[0,0,0],fg:[0,0,0],onInk:[0,0,0]},matFrom:0,matTo:0,matT:1,matX:0,labelsKey:"",loop:0,countdown:.9,hovering:!1,still:!1,frame:null,drag:{id:-1,startX:0,mode:"none"}});(0,a.useEffect)(()=>{let t=!0;return Y(y()),(function(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!t||!document.fonts)return Promise.resolve();return document.fonts.load(`500 20px ${t}`,"WorkLabWritingGitHubGuestbook").then(()=>void 0).catch(()=>void 0)}catch{return Promise.resolve()}})().then(()=>{t&&(Y(y()),J(t=>t+1))}),()=>{t=!1}},[]);let te=(0,a.useMemo)(()=>_.width<40||_.height<30||!H?null:function(t,e,a,i,r){let n,s="tile"===i?Math.max(7,.04*e):16,l=Math.max(60,e-2*s);if("tile"===i){let t=e/204;n={font:12*t,pad:7.5*t,height:37*t,inset:3.4*t}}else n=e>=940?{font:21,pad:29,height:72,inset:6}:e>=760?{font:19,pad:26,height:64,inset:5}:e>=520?{font:16.5,pad:20,height:56,inset:5}:{font:14.5,pad:14,height:48,inset:4};let o=w(t,n.font,r),h=(t,e)=>e.reduce((e,a)=>e+a+2*t.pad,0)+2*t.inset;for(let e=0;e<12&&h(n,o)>l;e++)n.pad>.62*n.font?n={...n,pad:.88*n.pad}:o=w(t,(n={...n,font:.94*n.font,pad:.96*n.pad,height:.97*n.height}).font,r);let u=h(n,o),c=[],d=n.inset;for(let t of o){let e=t+2*n.pad;c.push({x0:d,x1:d+e}),d+=e}let m=n.height-2*n.inset;return{x:Math.round((e-u)/2),y:Math.round(a-n.height/2),width:u,height:n.height,inset:n.inset,font:n.font,labels:t,slots:c,liquid:{slots:c,height:m,room:n.inset,min:n.inset,max:u-n.inset},key:`${t.join("|")}:${u.toFixed(2)}:${n.font.toFixed(2)}:${r}`}}(M,_.width,.5*_.height,t,H),[_.width,_.height,H,Q,t,M,f]),ta=(0,r.useLatest)(te),ti=(0,a.useRef)(()=>{}),tr=(0,a.useRef)(V.index),{canvasRef:tn,sizeRef:ts,supported:tl}=(0,r.useWebGL2)({mode:t,attributes:{antialias:!1,alpha:!0,premultipliedAlpha:!0},onContext:t=>{let e;try{e=new P(t)}catch(t){console.error(t);return}return z.current=e,tt.current.labelsKey="",ti.current(),()=>{e.dispose(),z.current===e&&(z.current=null)}},onResize:()=>{z.current?.resized(),tt.current.labelsKey="",ti.current()}});(0,a.useEffect)(()=>{if(!te)return;let t=s[Z.current.material];V.setFeel(t),V.instant=!1,V.setLayout(te.liquid),U.resize(te.width,te.height,t.blend*te.liquid.height),X.resize(te.width+4),tt.current.labelsKey="",tt.current.still=!1,o&&!f&&(function(t,e,a,i){t.instant=!1,t.rest(0),t.select(t.count-1);let r=i.liquid.height/2;for(let i=0;i<120&&(t.step(1/120),e.compute(t.prims,t.primCount),a.update(e,r,s.ink.dry,1/120),!(t.connected&&t.tail.on&&t.neck()>.8));i++);}(V,U,X,te),tt.current.still=!0),V.instant=o,U.compute(V.prims,V.primCount),tr.current=V.index,j(V.index),ti.current()},[te,V,U,X,Z,o,f]),(0,a.useEffect)(()=>{let t=tt.current;t.darkTarget=+("dark"===h),o&&(t.dark=t.darkTarget),ti.current()},[h,o]);let to=(0,r.useFrame)(l,t=>{let e=ta.current;if(!e)return!1;let a=tt.current,n=Z.current,l=n.reducedMotion,o=!1;if(a.dark!==a.darkTarget&&(a.dark=l?a.darkTarget:(0,r.damp)(a.dark,a.darkTarget,7,t),.002>Math.abs(a.dark-a.darkTarget)&&(a.dark=a.darkTarget),o=!0),!function(t,e){for(let a of["floor","label","fg","onInk"]){let i=p[a],r=x[a],n=t[a];n[0]=i[0]+(r[0]-i[0])*e,n[1]=i[1]+(r[1]-i[1])*e,n[2]=i[2]+(r[2]-i[2])*e}}(a.room,a.dark),!n.stage&&!a.still){if(!a.hovering&&(a.countdown-=t,a.countdown<=0)){let[t,e]=N[a.loop%N.length];a.loop++,V.select(Math.min(t,V.count-1)),a.countdown=e}o=!0}let h=!1;return a.still||(h=V.step(t),n.stage&&function(t){let e=ts.current.width||t.width,a=Z.current.material;for(let r=0;r<V.eventCount;r++){let n=V.events[r],s=(t.x+n.x)/e*2-1;"land"===n.type?S(a,n.index,.35+.65*n.strength,s):"pinch"===n.type?function(t,e=0){let a=F();if(!a)return;let r=performance.now();if(r-D<50)return;D=r;let{ctx:n,output:s}=a,l=n.currentTime,o=.04+.06*Math.max(0,Math.min(1,t)),h=L(n,e),u=n.createBufferSource();u.buffer=(0,i.noiseBuffer)(n);let c=n.createBiquadFilter();c.type="bandpass",c.frequency.value=3800+500*Math.random(),c.Q.value=2.2;let d=n.createGain();d.gain.setValueAtTime(0,l),d.gain.linearRampToValueAtTime(o,l+.001),d.gain.exponentialRampToValueAtTime(1e-4,l+.018);let m=u.connect(c).connect(d);h?m.connect(h).connect(s):m.connect(s),u.start(l,.5*Math.random(),.03);let f=n.createOscillator();f.type="sine",f.frequency.setValueAtTime(2300,l),f.frequency.exponentialRampToValueAtTime(1500,l+.02);let p=n.createGain();p.gain.setValueAtTime(0,l),p.gain.linearRampToValueAtTime(.5*o,l+.001),p.gain.exponentialRampToValueAtTime(1e-4,l+.03),f.connect(p).connect(s),f.start(l),f.stop(l+.04)}(n.strength,s):"join"===n.type?function(t,e,a=0){let i=F();if(!i)return;let r=performance.now();if(r-W<70)return;W=r;let{ctx:n,output:s}=i,l=n.currentTime,o=.05+.09*Math.max(0,Math.min(1,e)),h="mercury"===t?360:"water"===t?260:200,u=L(n,a),c=n.createOscillator();c.type="sine",c.frequency.setValueAtTime(h,l),c.frequency.exponentialRampToValueAtTime(1.6*h,l+.045);let d=n.createGain();d.gain.setValueAtTime(0,l),d.gain.linearRampToValueAtTime(o,l+.006),d.gain.exponentialRampToValueAtTime(1e-4,l+.14);let m=n.createBiquadFilter();m.type="lowpass",m.frequency.value=1400;let f=c.connect(d).connect(m);u?f.connect(u).connect(s):f.connect(s),c.start(l),c.stop(l+.17)}(a,n.strength,s):"cross"===n.type?function(t,e){let a=F();if(!a)return;let r=performance.now();if(r-C<28)return;C=r;let{ctx:n,output:s}=a,l=n.currentTime,o=.025+.03*Math.max(0,Math.min(1,e)),h=n.createBufferSource();h.buffer=(0,i.noiseBuffer)(n);let u=n.createBiquadFilter();u.type="bandpass",u.frequency.value=1900*Math.pow(2,B[Math.max(0,Math.min(B.length-1,t))]/24),u.Q.value=3;let c=n.createGain();c.gain.setValueAtTime(0,l),c.gain.linearRampToValueAtTime(o,l+.001),c.gain.exponentialRampToValueAtTime(1e-4,l+.014),h.connect(u).connect(c).connect(s),h.start(l,.5*Math.random(),.03)}(n.index,n.strength):"wall"===n.type&&function(t,e=0){let a=F();if(!a)return;let{ctx:i,output:r}=a,n=i.currentTime,s=.05+.08*Math.max(0,Math.min(1,t)),l=L(i,e),o=i.createOscillator();o.type="sine",o.frequency.setValueAtTime(150,n),o.frequency.exponentialRampToValueAtTime(85,n+.07);let h=i.createGain();h.gain.setValueAtTime(0,n),h.gain.linearRampToValueAtTime(s,n+.004),h.gain.exponentialRampToValueAtTime(1e-4,n+.1);let u=o.connect(h);l?u.connect(l).connect(r):u.connect(r),o.start(n),o.stop(n+.12)}(n.strength,s)}}(e),V.index!==tr.current&&(tr.current=V.index,j(V.index)),U.compute(V.prims,V.primCount),X.update(U,e.liquid.height/2,l?0:s[n.material].dry,t)),a.matT<1&&(a.matT=l?1:Math.min(1,a.matT+t/.55),a.matT>=1&&(a.matFrom=a.matTo),o=!0),function(t){let e=tt.current,a=ts.current,i=z.current;if(i&&G&&a.width>0){let r=`${t.key}@${a.dpr}`;e.labelsKey!==r&&(!function(t,e,a,i){let r=Math.max(1,Math.round(e.width*a)),n=Math.max(1,Math.round(e.height*a));t.width!==r&&(t.width=r),t.height!==n&&(t.height=n);let s=t.getContext("2d");if(!s)return;s.setTransform(1,0,0,1,0,0),s.clearRect(0,0,r,n),s.setTransform(r/e.width,0,0,n/e.height,0,0),s.fillStyle="#fff",s.font=`500 ${e.font}px ${i}`,s.textAlign="center",s.textBaseline="alphabetic";let l=s.measureText("Wbg"),o=l.actualBoundingBoxAscent||.72*e.font,h=l.actualBoundingBoxDescent||.2*e.font,u=s.measureText("W").actualBoundingBoxAscent||.7*e.font,c=e.height/2+u/2-.04*Math.min(h,o);e.labels.forEach((t,a)=>{let i=e.slots[a];s.fillText(t,(i.x0+i.x1)/2,c)})}(G,t,a.dpr,H||y()),i.setLabels(G),e.labelsKey=r);let n=tn.current;if(!n)return;let s=e.frame??={width:0,height:0,dpr:1,bar:{x:0,y:0,width:0,height:0},dropH:0,dark:0,floor:e.room.floor,label:e.room.label,fg:e.room.fg,onInk:e.room.onInk,mat:[0,0,1,0],ripple:[0,10,0],press:0,wetK:0};s.width=n.width,s.height=n.height,s.dpr=a.dpr,s.bar.x=t.x,s.bar.y=t.y,s.bar.width=t.width,s.bar.height=t.height,s.dropH=t.liquid.height,s.dark=e.dark,s.mat[0]=e.matFrom,s.mat[1]=e.matTo,s.mat[2]=e.matT,s.mat[3]=e.matX,s.ripple[0]=V.ripple.x,s.ripple[1]=V.ripple.age,s.ripple[2]=Z.current.reducedMotion?0:V.ripple.amp,s.press=Math.max(0,V.press.value),s.wetK=m[Z.current.material],i.render(s,U,X);return}let r=q.current;if(r&&!1===tl){let a=r.getContext("2d"),i=Math.min(f?2:1.5,window.devicePixelRatio||1),n=Math.round(_.width*i),s=Math.round(_.height*i);r.width!==n&&(r.width=n),r.height!==s&&(r.height=s),a&&function(t,e,a,i,r,n,s,l,o){t.setTransform(e,0,0,e,0,0),t.clearRect(0,0,a,i),t.save(),t.translate(r.x,r.y);let h=r.height/2,u=new Path2D;u.roundRect(0,0,r.width,r.height,h),t.fillStyle=g(s.floor),t.fill(u);let c=e=>{t.fillStyle=e,t.font=`500 ${r.font}px ${o}`,t.textAlign="center",t.textBaseline="middle",r.labels.forEach((e,a)=>{let i=r.slots[a];t.fillText(e,(i.x0+i.x1)/2,h+.04*r.font)})};c(g(s.label));let d=new Path2D,m=n.values,f=n.step,p=!1,x=0,b=t=>{for(let e=t;e>=x;e--)d.lineTo(n.origin+e*f,h+Math.max(0,m[e]));d.closePath()};for(let t=0;t<n.count;t++){let e=m[t],a=n.origin+t*f;e>0?(p||(d.moveTo(a,h),p=!0,x=t),d.lineTo(a,h-e)):p&&(d.lineTo(a,h),b(t-1),p=!1)}p&&b(n.count-1),t.fillStyle=l>.5?"rgb(232 232 232)":"rgb(20 20 20)",t.fill(d),t.save(),t.clip(d),c(g(s.onInk)),t.restore(),t.restore()}(a,i,_.width,_.height,t,U,e.room,e.dark,H||y())}}(e),o||h||X.active});(0,a.useEffect)(()=>{ti.current=to},[to]);let th=t=>{let e=k.current,a=ta.current;return e&&a?t-e.getBoundingClientRect().left:0},tu=t=>Math.abs(t-V.head.x)<=V.head.w/2+8,tc=t=>{V.select(t),V.index!==tr.current&&(tr.current=V.index,j(V.index)),to()},td=t=>{let e=tt.current.drag;if(e.id===t.pointerId){if("drag"===e.mode){let t=V.release();tr.current=t,j(t)}V.setPressed(!1),e.mode="none",e.id=-1,t.currentTarget.style.cursor="",to()}};return(0,e.jsxs)("div",{ref:A,className:"absolute inset-0 select-none overflow-hidden",onPointerMove:f?void 0:t=>{if(f||"mouse"!==t.pointerType||tt.current.still)return;let e=ta.current,a=A.current;if(!e||!a)return;let i=t.clientX-a.getBoundingClientRect().left-e.x,r=tt.current;r.hovering=!0,r.countdown=1.1;let n=V.slotAt(i);(n!==V.index||Math.abs(V.target-V.slotCentre(n))>.5)&&V.select(n),to()},onPointerLeave:f?void 0:()=>{tt.current.hovering=!1,to()},children:[(0,e.jsx)("canvas",{ref:tn,"aria-hidden":"true",className:"absolute inset-0 size-full"}),!1===tl?(0,e.jsx)("canvas",{ref:q,"aria-hidden":"true",className:"absolute inset-0 size-full"}):null,f&&te?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{ref:k,role:"radiogroup","aria-label":"Sections",onKeyDown:t=>{let e=M.length,a=V.index,r=-1;switch(t.key){case"ArrowRight":case"ArrowDown":r=(a+1)%e;break;case"ArrowLeft":case"ArrowUp":r=(a-1+e)%e;break;case"Home":r=0;break;case"End":r=e-1;break;default:/^[1-9]$/.test(t.key)&&+t.key<=e&&(r=t.key-1)}if(!(r<0)){let e;t.preventDefault(),t.stopPropagation(),(0,i.ensureAudio)(),tc(r),e=r,E.current[e]?.focus({preventScroll:!0})}},onPointerDown:t=>{if(!t.isPrimary||t.button>0||!ta.current)return;(0,i.ensureAudio)();let e=tt.current.drag,a=th(t.clientX);try{t.currentTarget.setPointerCapture(t.pointerId)}catch{}e.id=t.pointerId,e.startX=a,tu(a)?(V.grab(a),V.setPressed(!0),e.mode="drag",t.currentTarget.style.cursor="grabbing"):(tc(V.slotAt(a)),e.mode="pending"),to()},onPointerMove:t=>{if(!ta.current)return;let e=tt.current.drag,a=th(t.clientX);if(e.id===t.pointerId){"pending"===e.mode&&Math.abs(a-e.startX)>6&&(V.grab(a),V.setPressed(!0),e.mode="drag",t.currentTarget.style.cursor="grabbing"),"drag"===e.mode&&V.drag(a)&&(tr.current=V.index,j(V.index)),to();return}"mouse"===t.pointerType&&(V.hover(V.slotAt(a)),t.currentTarget.style.cursor=tu(a)?"grab":"pointer",to())},onPointerUp:td,onPointerCancel:td,onPointerLeave:t=>{"mouse"===t.pointerType&&-1===tt.current.drag.id&&(V.hover(-1),to())},className:"absolute cursor-pointer touch-pan-y",style:{left:te.x,top:te.y,width:te.width,height:te.height},children:[(0,e.jsx)("span",{"aria-hidden":"true",className:"absolute inset-x-0 -inset-y-2.5"}),te.slots.map((t,a)=>(0,e.jsx)("button",{ref:t=>{E.current[a]=t},type:"button",role:"radio","aria-checked":a===O,"aria-label":M[a],tabIndex:a===O?0:-1,onClick:t=>{0===t.detail&&tc(a)},className:"absolute top-0 h-full cursor-[inherit] rounded-full bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",style:{left:t.x0,width:t.x1-t.x0}},M[a]))]}),(0,e.jsx)(n.StageControls,{placement:"top",children:(0,e.jsx)(n.Tray,{children:(0,e.jsx)(n.Segmented,{label:"Liquid",options:c,value:K,onChange:t=>{if(t===K)return;(0,i.ensureAudio)(),$(t);let e=tt.current,a=ta.current,r=s[t];V.setFeel(r),a&&U.resize(a.width,a.height,r.blend*a.liquid.height),e.matFrom=e.matTo,e.matTo=d[t],e.matX=V.head.x,o?(e.matT=1,e.matFrom=e.matTo):(e.matT=0,V.stretch.velocity+=2.4,V.ripple.x=V.head.x,V.ripple.age=0,V.ripple.amp=.8),S(t,V.index,.5),to()}})})}),(0,e.jsxs)(n.StageControls,{placement:"bottom",children:[(0,e.jsx)(n.Tray,{children:(0,e.jsx)(n.MuteButton,{})}),(0,e.jsx)(n.StageHint,{children:I?"Click a tab, or drag the drop across · ← → and 1–5 on the keyboard":"Tap a tab, or drag the drop along the bar"})]})]}):null]})}],60276)},41729,function(t){t.n(t.i(60276))}]);