(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,60276,t=>{"use strict";var e=t.i(43476),i=t.i(71645),a=t.i(16442),r=t.i(37047),n=t.i(45219);let s={ink:{head:[150,18],drag:[900,52],flow:9,rejoin:30,tension:52,chase:[95,14],breakLen:2.5,satellite:.014,stretch:.3,stretchSpeed:26,wobble:[300,11],lean:[240,19],blend:.3,dry:.55},mercury:{head:[190,21],drag:[1100,60],flow:13,rejoin:36,tension:110,chase:[130,17],breakLen:1.5,satellite:.02,stretch:.18,stretchSpeed:30,wobble:[520,13],lean:[420,17],blend:.24,dry:0},water:{head:[165,15],drag:[850,44],flow:10,rejoin:28,tension:80,chase:[90,12],breakLen:2,satellite:.018,stretch:.38,stretchSpeed:24,wobble:[240,6],lean:[190,11],blend:.34,dry:.5}},l=1/240;class o{x=0;v=0;m=0;on=!1;W=0;w=0;h=0;lean=0;copy(t){this.x=t.x,this.v=t.v,this.m=t.m,this.on=t.on,this.W=t.W,this.w=t.w,this.h=t.h,this.lean=t.lean}}class h{value=0;velocity=0;target=0;k;c;constructor(t,e){this.k=t,this.c=e}step(t){let e=-this.k*(this.value-this.target)-this.c*this.velocity;this.velocity+=e*t,this.value+=this.velocity*t}get quiet(){return .001>Math.abs(this.value-this.target)&&.01>Math.abs(this.velocity)}set(t){this.value=this.target=t,this.velocity=0}}let u=t=>t<0?0:t>1?1:t;class c{layout={slots:[{x0:0,x1:100}],height:40,room:4,min:0,max:100};feel=s.ink;index=0;head=new o;tail=new o;connected=!1;rejoined=!1;threads=[{on:!1,body:0,dir:1,len:0,r:0},{on:!1,body:1,dir:-1,len:0,r:0}];beads=[{on:!1,x:0,v:0,m:0},{on:!1,x:0,v:0,m:0}];nextBead=0;target=50;targetW=100;dragging=!1;dragX=0;press=new h(320,26);reach=new h(260,18);stretch=new h(300,9);lean=new h(240,12);landed=!0;hovered=-1;lastV=0;accel=0;instant=!1;ripple={x:0,age:10,amp:0};prims=new Float32Array(60);primCount=0;events=Array.from({length:8},()=>({type:"land",x:0,strength:0,index:0}));eventCount=0;capsH={a:0,b:0,ra:0,rb:0};capsT={a:0,b:0,ra:0,rb:0};setFeel(t){this.feel=t,this.stretch.k=t.wobble[0],this.stretch.c=t.wobble[1],this.lean.k=t.lean[0],this.lean.c=t.lean[1]}setLayout(t){this.layout=t,this.rest(Math.min(this.index,t.slots.length-1))}get count(){return this.layout.slots.length}slotCentre(t){let e=this.layout.slots[t];return(e.x0+e.x1)/2}slotWidth(t){let e=this.layout.slots[t];return e.x1-e.x0}slotAt(t){let e=this.layout.slots;for(let i=0;i<e.length;i++)if(t<e[i].x1)return i;return e.length-1}widthAt(t){let e=this.layout.slots.length;if(t<=this.slotCentre(0))return this.slotWidth(0);for(let i=0;i<e-1;i++){let e=this.slotCentre(i),a=this.slotCentre(i+1);if(t<=a){let r=(t-e)/Math.max(.001,a-e),n=r*r*(3-2*r);return this.slotWidth(i)+(this.slotWidth(i+1)-this.slotWidth(i))*n}}return this.slotWidth(e-1)}rest(t){this.index=t,this.target=this.slotCentre(t),this.targetW=this.slotWidth(t);let e=this.head;for(let t of(e.on=!0,e.x=this.target,e.v=0,e.m=1,e.W=this.targetW,this.tail.on=!1,this.tail.m=0,this.connected=!1,this.threads))t.on=!1;for(let t of this.beads)t.on=!1;this.stretch.set(0),this.lean.set(0),this.reach.set(0),this.lastV=0,this.accel=0,this.landed=!0,this.dragging=!1,this.ripple.age=10,this.shape(),this.build()}seed(){let t=this.head,e=this.tail;e.on&&e.m>.12||(e.on&&(t.m+=e.m,e.on=!1),e.copy(t),e.on=!0,t.m=0,this.connected=!0,this.rejoined=!1)}select(t){let e=(t=Math.max(0,Math.min(this.count-1,t)))!==this.index;if(this.index=t,this.instant)return this.rest(t),e;let i=this.slotCentre(t);return!this.dragging&&Math.abs(i-this.head.x)>.6*this.layout.height&&this.seed(),this.target=i,this.targetW=this.slotWidth(t),this.landed=!1,this.hover(this.hovered),e}grab(t){this.dragging=!0,this.dragX=t,this.reach.target=0,this.instant||(Math.abs(t-this.head.x)>.6*this.layout.height&&this.seed(),this.landed=!1)}drag(t){let e=this.layout;this.dragX=Math.max(e.min-e.height,Math.min(e.max+e.height,t));let i=this.slotAt(this.instant?this.dragX:this.head.x);return i!==this.index&&(this.instant?(this.rest(i),this.dragging=!0):this.index=i,this.emit("cross",this.head.x,Math.min(1,Math.abs(this.head.v)/(20*e.height)),i),!0)}release(){this.dragging=!1;let t=this.layout,e=this.slotAt(Math.max(t.min,Math.min(t.max,this.head.x+.11*this.head.v)));return(this.index=e,this.instant)?this.rest(e):(this.target=this.slotCentre(e),this.targetW=this.slotWidth(e),this.landed=!1,this.hover(this.hovered)),e}setPressed(t){this.press.target=+!!t,this.instant&&this.press.set(this.press.target)}hover(t){if(this.hovered=t,t<0||t===this.index||this.dragging||this.instant){this.reach.target=0;return}let e=Math.sign(this.slotCentre(t)-this.slotCentre(this.index)),i=1===Math.abs(t-this.index)?1:.72;this.reach.target=e*this.layout.height*.2*i}emit(t,e,i,a=this.index){if(this.eventCount>=8)return;let r=this.events[this.eventCount++];r.type=t,r.x=e,r.strength=i,r.index=a}fullArea(t){let e=this.layout.height;return(Math.max(t,e)-e)*e+Math.PI*e*e/4}sizeOf(t,e,i){let a=this.layout.height,r=Math.max(0,t)*this.fullArea(e),n=Math.sqrt(4*r/Math.PI),s=n;n>a&&(n=a,s=(r-Math.PI*a*a/4)/a+a),i.w=s,i.h=n}gap(){return Math.abs(this.head.x-this.tail.x)-(this.head.w+this.tail.w)/2}facingRadius(t,e){return t.h/2*Math.max(.3,Math.min(1.3,1+e*t.lean))}neck(){let t=this.layout.height,e=this.gap();if(e<=0)return 0;let i=u(this.tail.m/.4);return Math.pow(u(e/(this.feel.breakLen*t*(.55+.45*Math.sqrt(i)))),1.35)}step(t){this.eventCount=0;let e=Math.min(Math.max(0,t),.1);for(;e>1e-6;){let t=Math.min(l,e);this.substep(t),e-=t}return this.ripple.age+=t,this.shape(),this.build(),!this.settled()}wall(t,e){let i=this.layout,a=t+e/2-i.max;if(a>0)return-a;let r=i.min-(t-e/2);return r>0?r:0}substep(t){let e=this.feel,i=this.layout.height,a=this.head,r=this.tail,[n,s]=this.dragging?e.drag:e.head,l=this.dragging?this.dragX:this.target,o=a.x-this.target,h=this.dragging?6*i:4*i,u=n*Math.max(-h,Math.min(h,l-a.x))-s*a.v,c=this.wall(a.x,a.w);0!==c&&(u+=2600*c-(Math.sign(c)!==Math.sign(a.v)?24*a.v:0)),a.v+=u*t,a.x+=a.v*t;let d=this.dragging?this.widthAt(a.x):this.targetW;if(a.W+=(d-a.W)*(1-Math.exp(-14*t)),!this.landed&&!this.dragging){let t=a.x-this.target;(0!==o&&Math.sign(t)!==Math.sign(o)||Math.abs(t)<Math.max(2,.05*a.W))&&(this.landed=!0,this.emit("land",a.x,Math.min(1,Math.abs(a.v)/(30*i)),this.index))}if(0!==c&&Math.abs(a.v)>8*i&&Math.sign(a.v)!==Math.sign(c)&&this.emit("wall",a.x,Math.min(1,Math.abs(a.v)/(30*i))),r.on){let n;if(this.connected&&this.rejoined)n=1.5*e.chase[0]*(a.x-r.x)-30*(r.v-a.v);else if(this.connected){let t=this.neck(),i=this.landed&&!this.dragging?3.2:1;n=e.tension*i*(1-t)*(a.x-r.x)-(i>1?17:9)*r.v}else n=e.chase[0]*(a.x-r.x)-e.chase[1]*(r.v-.4*a.v);let s=this.wall(r.x,r.w);0!==s&&(n+=2600*s),r.v+=n*t,r.x+=r.v*t,r.W+=(a.W-r.W)*(1-Math.exp(-3*t));let l=this.gap();if(this.connected){let i=this.neck(),n=Math.abs(a.x-r.x)+r.w/2<=a.w/2+.5,s=1+3*Math.max(0,1-r.m/.25),o=(1-i)*(1-i),h=n?1.6*e.rejoin*s:this.rejoined?e.rejoin*s:e.flow*o*(1+2*Math.max(0,1-r.m/.12)*o),u=r.m*(1-Math.exp(-h*t));r.m-=u,a.m+=u,i>=.985&&l>0&&this.pinch(l)}else if(l<.04*i){this.connected=!0,this.rejoined=!0;let t=r.v-a.v,e=r.m/Math.max(.001,r.m+a.m);a.v+=t*e*.22;let n=Math.sign(r.x-a.x);this.lean.velocity+=n*Math.min(5,Math.abs(t)/i*.25)*e,this.stretch.velocity-=Math.min(4,Math.abs(t)/i*.2)*e,this.ripple.x=a.x+n*a.w*.4,this.ripple.age=0,this.ripple.amp=Math.min(1,2*e+.3),this.emit("join",(a.x+r.x)/2,Math.min(1,Math.abs(t)/(18*i)*.6+e))}r.m<.004&&(a.m+=r.m,r.m=0,r.on=!1,this.connected=!1)}else{let t=0;for(let e of this.beads)e.on&&(t+=e.m);a.m=1-t}for(let i of this.beads){if(!i.on)continue;let n=r.on&&Math.abs(r.x-i.x)<Math.abs(a.x-i.x)?r:a,s=1.7*e.chase[0]*(n.x-i.x)-1.3*e.chase[1]*(i.v-.5*n.v);if(i.v+=s*t,i.x+=i.v*t,Math.abs(n.x-i.x)-n.w/2-this.beadRadius(i.m)<0){let e=i.m*(1-Math.exp(-26*t));i.m-=e,n.m+=e,i.m<6e-4&&(n.m+=i.m,i.on=!1)}}for(let e of this.threads)e.on&&(e.len*=Math.exp(-t/.018),e.len<1.2&&(e.on=!1));let m=Math.min(1,Math.abs(a.v)/(i*e.stretchSpeed));this.stretch.target=m*e.stretch*(this.dragging?1.35:1),this.stretch.step(t);let f=(a.v-this.lastV)/t;this.lastV=a.v,this.accel+=(f-this.accel)*(1-Math.exp(-t/.03));let p=Math.sign(a.v)*Math.sqrt(m)*.1;this.lean.target=Math.max(-.2,Math.min(.2,p-this.accel/(1100*i))),this.lean.step(t),this.press.step(t),this.reach.step(t)}beadRadius(t){return Math.sqrt(t*this.fullArea(this.head.W)/Math.PI)}pinch(t){let e=this.head,i=this.tail;this.connected=!1;let a=Math.sign(e.x-i.x)||1,r=Math.max(.8,.06*Math.min(e.h,i.h)),n=this.threads[0];n.on=!0,n.body=0,n.dir=-a,n.len=.45*t,n.r=r;let s=this.threads[1];s.on=!0,s.body=1,s.dir=a,s.len=.45*t,s.r=r;let l=this.feel.satellite;if(l>0&&i.m>2*l){let r=this.beads[this.nextBead];this.nextBead=(this.nextBead+1)%this.beads.length,r.on&&(e.m+=r.m),r.on=!0,r.x=i.x+a*(i.w/2+.5*t),r.v=(e.v+i.v)*.5,r.m=l,i.m-=l}this.emit("pinch",(e.x+i.x)/2,Math.min(1,.4+Math.abs(e.v-i.v)/(40*this.layout.height)))}shape(){let t=this.layout,e=t.height,i=this.head,a=this.tail,r=Math.max(0,this.press.value);this.sizeOf(i.m,i.W,i);let n=Math.max(.7,1+this.stretch.value),s=i.w*n,l=i.h/n;l*=1+r*(t.room/e)*1.5,s*=1+.035*r;let o=e+2*t.room*.86;l>o&&(s*=l/o,l=o);let h=Math.max(0,i.x+s/2-t.max)+Math.max(0,t.min-(i.x-s/2));if(h>0){let t=Math.max(.7*l,s-.85*h);l=Math.min(o,l*Math.sqrt(s/t)),s=t}if(i.w=Math.max(s,l),i.h=l,i.lean=Math.max(-.2,Math.min(.2,this.lean.value)),a.on){this.sizeOf(a.m,a.W,a);let t=Math.min(1,Math.abs(a.v)/(e*this.feel.stretchSpeed)),i=1+t*this.feel.stretch*.8;a.w*=i,a.h/=i,a.lean=this.connected?0:Math.sign(a.v)*t*.22}}push(t,e,i,a,r){if(this.primCount>=12||i<.05&&a<.05)return;if(t>e){let r=t;t=e,e=r,r=i,i=a,a=r}let n=5*this.primCount,s=this.prims;s[n]=t,s[n+1]=e,s[n+2]=i,s[n+3]=a,s[n+4]=r,this.primCount++}caps(t,e){let i=t.h/2,a=i*Math.max(.3,Math.min(1.3,1-t.lean)),r=i*Math.max(.3,Math.min(1.3,1+t.lean)),n=t.x-t.w/2+a,s=t.x+t.w/2-r;n>s&&(n=s=(n+s)/2),e.a=n,e.b=s,e.ra=a,e.rb=r}build(){this.primCount=0;let t=this.head,e=this.tail,i=this.capsH,a=this.capsT;if(t.m>1e-4){this.caps(t,i);let e=this.reach.value;if(Math.abs(e)>.05){let t=1-Math.min(.14,Math.abs(e)/this.layout.height*.7);e>0?(i.b+=e,i.rb*=t):(i.a+=e,i.ra*=t)}this.push(i.a,i.b,i.ra,i.rb,2)}else i.a=i.b=t.x,i.ra=i.rb=0;for(let t of(e.on&&e.m>1e-4&&(this.caps(e,a),this.push(a.a,a.b,a.ra,a.rb,2),this.connected&&this.bridge(a,i)),this.threads)){if(!t.on||1===t.body&&!e.on)continue;let r=0===t.body?i:a,n=t.dir>0?r.b:r.a,s=t.dir>0?r.rb:r.ra,l=n+t.dir*s,o=Math.min(1,t.len/(.5*this.layout.height));this.push(l-t.dir*s*.4,l+t.dir*t.len,Math.min(.45*s,2.6*t.r)*(.4+.6*o),t.r*(1.1+.5*(1-o)),0)}for(let t of this.beads){if(!t.on)continue;let e=this.beadRadius(t.m),i=Math.min(1,Math.abs(t.v)/(this.layout.height*this.feel.stretchSpeed)),a=e*i*.7,r=e*(1-.18*i);this.push(t.x-a,t.x+a,r,r,0)}}bridge(t,e){let i=Math.sign(this.head.x-this.tail.x)||1,a=i>0?t.b:t.a,r=(i>0?t.rb:t.ra)*.94,n=i>0?e.a:e.b,s=(i>0?e.ra:e.rb)*.94;(n-a)*i<-Math.min(r,s)||this.push(a,n,Math.max(r,.25),Math.max(s,.25),3+Math.min(.999,this.neck()))}settled(){let t=this.head;if(this.dragging||this.tail.on)return!1;for(let t of this.beads)if(t.on)return!1;for(let t of this.threads)if(t.on)return!1;return!(Math.abs(t.x-this.target)>.05||Math.abs(t.v)>.5||Math.abs(t.W-this.targetW)>.05)&&!!this.stretch.quiet&&!!this.lean.quiet&&!!this.press.quiet&&!!this.reach.quiet&&this.ripple.age>1.6}}var d=t.i(55171);let m=[{value:"ink",label:"Ink"},{value:"mercury",label:"Mercury"},{value:"water",label:"Water"}],f={ink:0,mercury:1,water:2},p={ink:.8,mercury:0,water:.75},g={floor:(0,d.rgb)("#e7e7e7"),label:(0,d.rgb)("#626262"),fg:(0,d.rgb)("#171717"),ink:(0,d.rgb)("#151515"),onInk:(0,d.rgb)("#fbfbfb"),lip:[1,1,1],dark:0},x=t=>.2126*t[0]+.7152*t[1]+.0722*t[2],b=["floor","label","fg","ink","onInk","lip"];function y(t,e){for(let i of b){let a=t[i],r=e[i];a[0]=r[0],a[1]=r[1],a[2]=r[2]}t.dark=e.dark}let v=(t,e=1)=>`rgb(${Math.round(255*t[0])} ${Math.round(255*t[1])} ${Math.round(255*t[2])} / ${e})`,M=["Work","Lab","Writing","GitHub","Guestbook"],w=["Work","Lab","Writing","GitHub"];function T(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(t)return`${t}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}let k=null;function A(t,e,i){let a=k||(k=document.createElement("canvas").getContext("2d"));return a?(a.font=`500 ${e}px ${i}`,t.map(t=>a.measureText(t).width)):t.map(t=>t.length*e*.56)}class R{origin=0;count=0;rho=0;raw=new Float32Array(1);dil=new Float32Array(1);kernel=new Float32Array(1);reach=0;r=new Float32Array(1);data=new Float32Array(2);rBuf=new Float32Array(1);get step(){return .5}resize(t,e,i){let a=Math.ceil((t+2*e)*2)+1;if(this.origin=-e,a!==this.count&&(this.count=a,this.raw=new Float32Array(a),this.dil=new Float32Array(a),this.rBuf=new Float32Array(a),this.data=new Float32Array(2*a)),i!==this.rho){this.rho=i;let t=Math.max(1,Math.ceil(2*i));this.reach=t,this.kernel=new Float32Array(t+1);for(let e=0;e<=t;e++){let t=e/2;this.kernel[e]=Math.sqrt(Math.max(0,i*i-t*t))}}}at(t){let e=(t-this.origin)*2,i=Math.floor(e);if(i<0||i>=this.count-1)return 0;let a=this.rBuf,r=a[i]+(a[i+1]-a[i])*(e-i);return r>0?r:0}get values(){return this.rBuf}compute(t,e){let i=this.count,a=this.raw;a.fill(-1);let r=i,n=-1;for(let s=0;s<e;s++){let e=5*s,l=t[e],o=t[e+1],h=t[e+2],u=t[e+3],c=t[e+4],d=Math.max(0,Math.ceil((l-h-this.origin)*2)),m=Math.min(i-1,Math.floor((o+u-this.origin)*2)),f=o-l,p=l,g=o,x=h,b=u;if(c>1.5&&f>1e-4&&Math.abs(u-h)<f){let t=(u-h)/f,e=Math.sqrt(1-t*t);p=l-h*t,x=h*e,g=o-u*t,b=u*e}let y=g-p;if(c>=3){let t=c-3;if(f<=1e-4)continue;let e=Math.max(0,Math.ceil((l-this.origin)*2)),s=Math.min(i-1,Math.floor((o-this.origin)*2));for(let i=e;i<=s;i++){let e=(this.origin+.5*i-l)/f,r=(h+(u-h)*e)*(1-4*t*e*(1-e));r>a[i]&&(a[i]=r)}e<r&&(r=e),s>n&&(n=s);continue}for(let t=d;t<=m;t++){let e=this.origin+.5*t,i=-1;if(e>=p&&e<=g&&y>1e-4){let t=(e-p)/y;c>.5&&c<1.5&&(t=t*t*(3-2*t)),i=x+(b-x)*t}let r=e-l;if(r*r<h*h){let t=Math.sqrt(h*h-r*r);t>i&&(i=t)}let n=e-o;if(n*n<u*u){let t=Math.sqrt(u*u-n*n);t>i&&(i=t)}i>a[t]&&(a[t]=i)}d<r&&(r=d),m>n&&(n=m)}let s=this.rBuf;if(n<r){s.fill(-64),this.pack();return}let l=this.reach,o=this.kernel,h=this.dil,u=Math.max(0,r-l),c=Math.min(i-1,n+l);h.fill(-1);for(let t=u;t<=c;t++){let e=-1,i=Math.max(r,t-l),s=Math.min(n,t+l);for(let r=i;r<=s;r++){let i=a[r];if(i<0)continue;let n=i+o[r>t?r-t:t-r];n>e&&(e=n)}h[t]=e}s.fill(-1);for(let t=r;t<=n;t++){let e=1e9,r=t-l,n=t+l;for(let a=r;a<=n;a++){let r=a<0||a>=i?-1:h[a],n=r<0?-1e9:r-o[a>t?a-t:t-a];if(n<e&&(e=n)<0)break}let u=Math.max(e,a[t]);s[t]=u>=0?u:-1}let d=-1e9;for(let t=0;t<i;t++)s[t]>=0?d=t:s[t]=-Math.min(64,(t-d)*.5);d=1e9;for(let t=i-1;t>=0;t--)s[t]>=0?d=t:s[t]=Math.max(s[t],-Math.min(64,(d-t)*.5));this.pack()}pack(){let t=this.rBuf,e=this.dil,i=this.data,a=this.count;for(let i=0;i<a;i++){let r=t[i>1?i-2:0],n=t[i>0?i-1:0],s=t[i<a-1?i+1:a-1],l=t[i<a-2?i+2:a-1];e[i]=(r+4*n+6*t[i]+4*s+l)/16}for(let r=0;r<a;r++){let n=t[r]>0&&(t[r>1?r-2:0]<=0||t[r<a-2?r+2:a-1]<=0)?t:e,s=(n[r<a-2?r+2:a-1]-n[r>1?r-2:0])*.5;s>10?s=10:s<-10&&(s=-10),i[2*r]=t[r],i[2*r+1]=s}}}class E{values=new Float32Array(1);bytes=new Uint8Array(1);active=!1;dirty=!0;resize(t){let e=Math.max(1,Math.ceil(t/2)+1);e!==this.values.length&&(this.values=new Float32Array(e),this.bytes=new Uint8Array(e)),this.clear()}clear(){this.values.fill(0),this.bytes.fill(0),this.active=!1,this.dirty=!0}update(t,e,i,a){let r=this.values,n=!1;if(i<=0)for(let t=0;t<r.length;t++)r[t]<=0||(r[t]=Math.max(0,r[t]-3*a),n=!0);else{let s=Math.exp(-a/i);for(let i=0;i<r.length;i++){let l=Math.min(1,t.at(2*i)/e),o=r[i]*s-.12*a;l>o&&(o=l),o<0&&(o=0),Math.abs(o-r[i])>1e-4&&(n=!0),r[i]=o}}if(n||this.active){let t=this.bytes;for(let e=0;e<r.length;e++)t[e]=Math.round(255*Math.min(1,r[e]));this.dirty=!0}this.active=n}}let q=d.FULLSCREEN_VERTEX,D=`#version 300 es
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
uniform vec3 uInk;
uniform vec3 uLip;
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

/* The label mask is drawn at device pixels (scale exactly uDpr), so the
   printed labels are read texel for texel on the screen's own grid and
   stay crisp at any DPR; seen through liquid they are filtered. */
float labelCrisp(vec2 q) {
  ivec2 ts = textureSize(uLabels, 0);
  ivec2 p = ivec2(floor(q * uDpr));
  if (p.x < 0 || p.y < 0 || p.x >= ts.x || p.y >= ts.y) return 0.0;
  return texelFetch(uLabels, p, 0).a;
}

float labelSoft(vec2 q) {
  return texture(uLabels, q * uDpr / vec2(textureSize(uLabels, 0))).a;
}

/* The channel floor at q (bar-local CSS px): walls, wet film, labels. */
vec3 floorAt(vec2 q, vec3 labelColor, bool crisp) {
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
    // a thin film where the liquid was: a breath of its colour, a little
    // darker, and a bright line where its upper edge catches the softbox
    float y = abs(q.y - hh);
    float band = w * uDropH * 0.45;
    float a = smoothstep(band + 1.2, band - 1.2, y) * sqrt(w) * uWetK;
    vec3 film = uMat.y < 0.5 ? uInk : uFloor * mix(0.86, 1.25, uDark);
    col = mix(col, mix(col * mix(0.97, 1.0, uDark), film, mix(0.06, 0.1, uDark)), a);
    float sheen = exp(-pow((y - band * 0.86) / 0.9, 2.0)) * step(q.y, hh) * a;
    col += sheen * mix(0.05, 0.04, uDark);
  }

  float l = crisp ? labelCrisp(q) : labelSoft(q);
  return mix(col, labelColor, l);
}

float softbox(vec3 R) {
  return smoothstep(0.3, 0.42, -R.y) * (1.0 - smoothstep(0.45, 0.85, abs(R.x + 0.08)));
}

/* a tall strip light to the right, with soft edges so a shoulder sweeping
   past it glows instead of flashing a hard-edged block */
float stripLight(vec3 R) {
  return smoothstep(0.46, 0.66, R.x) * (1.0 - smoothstep(0.76, 0.95, R.x)) * (1.0 - smoothstep(0.0, 0.42, abs(R.y + 0.12)));
}

float glint(vec3 N, float sharp) {
  vec3 L = normalize(vec3(-0.42, -0.78, 0.9));
  return pow(max(dot(N, normalize(L + V)), 0.0), sharp);
}

float lambert(vec3 N) {
  return max(dot(N, normalize(vec3(-0.42, -0.78, 0.9))), 0.0);
}

vec3 shadeInk(vec3 N, vec2 q, float z, float s, float yn) {
  vec3 R = reflect(-V, N);
  float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
  // the label under the varnish: crisp where the surface is flat, lensed
  // (and so filtered) where it curves
  vec2 lens = N.xy * z * 0.12;
  float la = mix(labelCrisp(q), labelSoft(q + lens), smoothstep(0.15, 0.6, length(lens) * uDpr));
  float lum = dot(uInk, vec3(0.2126, 0.7152, 0.0722));
  float sat = max(uInk.r, max(uInk.g, uInk.b)) - min(uInk.r, min(uInk.g, uInk.b));
  // the pigment, lit softly from above and deepening where the surface
  // turns away toward the rim
  vec3 body = uInk * (0.8 + 0.3 * lambert(N)) * mix(1.0, mix(0.62, 0.74, lum), smoothstep(0.5, 1.0, s));
  // a coloured ink lets a little light through: its lower shoulder glows
  body += uInk * sat * 0.22 * smoothstep(0.15, 0.85, yn) * (1.0 - smoothstep(0.85, 1.0, s));
  body = mix(body, uOnInk, la);
  // the studio in the varnish: dark inks show it all, light ones a little
  float k = mix(1.0, 0.32, lum);
  vec3 room = uFloor * mix(0.5, 0.62, smoothstep(0.0, 0.6, R.y));
  vec3 env = vec3(softbox(R) * (6.5 + uPress * 2.0) + stripLight(R) * 2.0) * k + room * smoothstep(0.35, -0.2, R.z);
  return body + F * env + glint(N, 90.0) * mix(0.85, 0.45, lum);
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
  // a dark room's own light colours the chrome a little
  vec3 tint = uFg / max(max(uFg.r, max(uFg.g, uFg.b)), 1e-3);
  col *= mix(vec3(1.0), mix(vec3(1.0), tint, 0.22) * 0.72, uDark);
  float la = labelCrisp(q);
  col = mix(col, vec3(mix(0.08, 0.06, uDark)), la * 0.9);
  return col + glint(N, 160.0) * 0.7;
}

vec3 shadeWater(vec3 N, vec2 q, float z, float s, float yn) {
  vec2 off = -N.xy * z * 0.3;
  vec3 col = floorAt(q + off, uFg, false) * mix(0.975, 1.03, uDark);
  col *= 1.0 - mix(0.4, 0.3, uDark) * smoothstep(0.6, 1.0, s);
  col += mix(0.2, 0.08, uDark) * exp(-pow((yn - 0.42) / 0.22, 2.0)) * smoothstep(0.98, 0.55, s);
  vec3 R = reflect(-V, N);
  float F = 0.02 + 0.98 * pow(1.0 - N.z, 5.0);
  col += F * (softbox(R) * (4.5 + uPress * 1.5) + stripLight(R) * 1.4);
  return col + glint(N, 120.0) * 0.9;
}

vec3 shadeAs(float m, vec3 N, vec2 q, float z, float s, float yn) {
  if (m < 0.5) return shadeInk(N, q, z, s, yn);
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
  float lip = (1.0 - smoothstep(0.0, 1.3, dc)) * smoothstep(-0.1, 0.85, yc) * mix(0.85, 0.32, uDark);
  float chA = clamp(0.5 - dc / px, 0.0, 1.0);
  if (chA <= 0.0) {
    outColor = vec4(uLip * lip, lip) * step(0.0, dc);
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

  vec3 col = floorAt(q, uLabelCol, true);
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
      // one smooth swell running outward (the slope of a travelling bump),
      // so the highlight rolls over it instead of breaking into dashes
      float u = (abs(dx) - age * 380.0) / 24.0;
      float env = uRipple.z * exp(-age * 5.0) * exp(-u * u);
      // (flat at its origin, where the two outgoing fronts meet)
      dzdx -= env * 1.1 * u * sign(dx) * (1.0 - exp(-dx * dx / 90.0));
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
  outColor = vec4(col * chA + uLip * lip * (1.0 - chA) * step(0.0, dc), a);
}
`;class P{gl;program;vao;u;profileTex;wetTex;labelTex;profileW=0;wetW=0;hasLabels=!1;last={x:0,y:0,w:0,h:0};constructor(t){this.gl=t,this.program=(0,d.createProgram)(t,q,D),this.u=(0,d.uniformLocations)(t,this.program),this.vao=t.createVertexArray();const e=e=>{let i=t.createTexture();return t.bindTexture(t.TEXTURE_2D,i),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),i};this.profileTex=e(t.NEAREST),this.wetTex=e(t.LINEAR),this.labelTex=e(t.LINEAR),t.bindTexture(t.TEXTURE_2D,this.labelTex),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array(4)),t.useProgram(this.program),t.uniform1i(this.u("uProfile"),0),t.uniform1i(this.u("uWet"),1),t.uniform1i(this.u("uLabels"),2)}setLabels(t){let e=this.gl;e.bindTexture(e.TEXTURE_2D,this.labelTex),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,e.RGBA,e.UNSIGNED_BYTE,t),this.hasLabels=!0}get labelsReady(){return this.hasLabels}render(t,e,i){let a=this.gl;a.useProgram(this.program),a.bindVertexArray(this.vao),a.disable(a.BLEND),a.disable(a.DEPTH_TEST),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,this.profileTex),a.pixelStorei(a.UNPACK_ALIGNMENT,1),this.profileW!==e.count?(this.profileW=e.count,a.texImage2D(a.TEXTURE_2D,0,a.RG32F,e.count,1,0,a.RG,a.FLOAT,e.data)):a.texSubImage2D(a.TEXTURE_2D,0,0,0,e.count,1,a.RG,a.FLOAT,e.data),a.activeTexture(a.TEXTURE1),a.bindTexture(a.TEXTURE_2D,this.wetTex);let r=i.bytes.length;this.wetW!==r?(this.wetW=r,a.texImage2D(a.TEXTURE_2D,0,a.R8,r,1,0,a.RED,a.UNSIGNED_BYTE,i.bytes),i.dirty=!1):i.dirty&&(a.texSubImage2D(a.TEXTURE_2D,0,0,0,r,1,a.RED,a.UNSIGNED_BYTE,i.bytes),i.dirty=!1),a.activeTexture(a.TEXTURE2),a.bindTexture(a.TEXTURE_2D,this.labelTex);let n=this.u;a.uniform2f(n("uCanvas"),t.width,t.height),a.uniform1f(n("uDpr"),t.dpr),a.uniform4f(n("uBar"),t.bar.x,t.bar.y,t.bar.width,t.bar.height),a.uniform1f(n("uDropH"),t.dropH),a.uniform3f(n("uProf"),e.origin,1/e.step,e.count),a.uniform1f(n("uWetLen"),2*r),a.uniform1f(n("uDark"),t.dark),a.uniform3f(n("uFloor"),t.floor[0],t.floor[1],t.floor[2]),a.uniform3f(n("uLabelCol"),t.label[0],t.label[1],t.label[2]),a.uniform3f(n("uFg"),t.fg[0],t.fg[1],t.fg[2]),a.uniform3f(n("uOnInk"),t.onInk[0],t.onInk[1],t.onInk[2]),a.uniform3f(n("uInk"),t.ink[0],t.ink[1],t.ink[2]),a.uniform3f(n("uLip"),t.lip[0],t.lip[1],t.lip[2]),a.uniform4f(n("uMat"),t.mat[0],t.mat[1],t.mat[2],t.mat[3]),a.uniform4f(n("uRipple"),t.ripple[0],t.ripple[1],t.ripple[2],0),a.uniform1f(n("uPress"),t.press),a.uniform1f(n("uWetK"),t.wetK);let s=Math.max(0,Math.floor((t.bar.x-3)*t.dpr)),l=Math.max(0,Math.floor((t.bar.y-3)*t.dpr)),o=Math.min(t.width,Math.ceil((t.bar.x+t.bar.width+3)*t.dpr)),h=Math.min(t.height,Math.ceil((t.bar.y+t.bar.height+3)*t.dpr)),u={x:s,y:t.height-h,w:Math.max(0,o-s),h:Math.max(0,h-l)};a.enable(a.SCISSOR_TEST);let c=this.last;c.w>0&&(c.x!==u.x||c.y!==u.y||c.w!==u.w||c.h!==u.h)&&(a.scissor(c.x,c.y,c.w,c.h),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT)),a.scissor(u.x,u.y,u.w,u.h),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.drawArrays(a.TRIANGLES,0,3),a.disable(a.SCISSOR_TEST),c.x=u.x,c.y=u.y,c.w=u.w,c.h=u.h}resized(){this.last.w=0}dispose(){let t=this.gl;t.deleteProgram(this.program),t.deleteVertexArray(this.vao),t.deleteTexture(this.profileTex),t.deleteTexture(this.wetTex),t.deleteTexture(this.labelTex)}}let C=0,L=0,F=0,S=0,W=[0,2,4,7,9,12,14];function B(){return(0,a.audioReady)()?(0,a.getAudio)():null}function I(t,e){if("function"!=typeof t.createStereoPanner)return null;let i=t.createStereoPanner();return i.pan.value=Math.max(-.7,Math.min(.7,e)),i}function N(t,e,i,r=0){let n=B();if(!n)return;let s=performance.now();if(s-C<55)return;C=s;let{ctx:l,output:o}=n,h=l.currentTime,u=.05+.13*Math.max(0,Math.min(1,i)),c=("mercury"===t?980:"water"===t?620:430)*Math.pow(2,W[Math.max(0,Math.min(W.length-1,e))]/24),d="mercury"===t?.07:"water"===t?.09:.12,m=l.createGain();m.gain.value=1;let f=I(l,r);f?m.connect(f).connect(o):m.connect(o);let p=l.createOscillator();p.type="sine",p.frequency.setValueAtTime(c,h),p.frequency.exponentialRampToValueAtTime(c*("mercury"===t?1.35:"water"===t?2.1:1.7),h+.035);let g=l.createGain();if(g.gain.setValueAtTime(0,h),g.gain.linearRampToValueAtTime(u,h+.003),g.gain.exponentialRampToValueAtTime(1e-4,h+d),p.connect(g).connect(m),p.start(h),p.stop(h+d+.03),"mercury"===t){let t=l.createOscillator();t.type="sine",t.frequency.value=2.76*c;let e=l.createGain();e.gain.setValueAtTime(0,h),e.gain.linearRampToValueAtTime(.35*u,h+.002),e.gain.exponentialRampToValueAtTime(1e-4,h+.16),t.connect(e).connect(m),t.start(h),t.stop(h+.2)}else{let e=l.createBufferSource();e.buffer=(0,a.noiseBuffer)(l);let i=l.createBiquadFilter();i.type="bandpass",i.frequency.value="water"===t?2600:1700,i.Q.value=1.1;let r=l.createGain();r.gain.setValueAtTime(0,h),r.gain.linearRampToValueAtTime(.28*u,h+.002),r.gain.exponentialRampToValueAtTime(1e-4,h+.028),e.connect(i).connect(r).connect(m),e.start(h,.5*Math.random(),.05)}}let z=[[3,1.5],[2,1],[0,1.45],[1,.95],[3,1.35],[0,1.5]];function _(t){let e=new MutationObserver(t);return e.observe(document.documentElement,{attributes:!0,attributeFilter:["class","data-palette"]}),()=>e.disconnect()}let V=()=>{let t=document.documentElement;return`${t.classList.contains("dark")?"dark":"light"}:${t.getAttribute("data-palette")??""}`};t.s(["default",0,function({mode:t,active:l,reducedMotion:o,theme:h}){let u="stage"===t,b=u?M:w,k=(0,i.useRef)(null),q=(0,i.useRef)(null),D=(0,i.useRef)([]),C=(0,i.useRef)(null),U=(0,i.useRef)(null),X=(0,r.useFinePointer)(),G=(0,r.useElementSize)(k),[O]=(0,i.useState)(()=>{let t=new c;return t.index=+!!u,t}),[j]=(0,i.useState)(()=>new R),[K]=(0,i.useState)(()=>new E),[$]=(0,i.useState)(()=>"u"<typeof document?null:document.createElement("canvas")),[H,Y]=(0,i.useState)(O.index),[Q,J]=(0,i.useState)("ink"),[Z,tt]=(0,i.useState)(""),[te,ti]=(0,i.useState)(0),ta=(0,r.useLatest)({reducedMotion:o,stage:u,material:Q}),tr=(0,i.useSyncExternalStore)(_,V,()=>"light:"),tn=(0,i.useRef)({room:{floor:[0,0,0],label:[0,0,0],fg:[0,0,0],ink:[0,0,0],onInk:[0,0,0],lip:[0,0,0],dark:0},matFrom:0,matTo:0,matT:1,matX:0,labelsKey:"",loop:0,countdown:.9,hovering:!1,still:!1,frame:null,drag:{id:-1,startX:0,mode:"none"}});(0,i.useEffect)(()=>{let t=!0;return tt(T()),(function(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!t||!document.fonts)return Promise.resolve();return document.fonts.load(`500 20px ${t}`,"WorkLabWritingGitHubGuestbook").then(()=>void 0).catch(()=>void 0)}catch{return Promise.resolve()}})().then(()=>{t&&(tt(T()),ti(t=>t+1))}),()=>{t=!1}},[]);let ts=(0,i.useMemo)(()=>G.width<40||G.height<30||!Z?null:function(t,e,i,a,r){let n,s="tile"===a?Math.max(7,.04*e):16,l=Math.max(60,e-2*s);if("tile"===a){let t=e/204;n={font:12*t,pad:7.5*t,height:37*t,inset:3.4*t}}else n=e>=940?{font:23,pad:31,height:80,inset:6.5}:e>=760?{font:20,pad:27,height:68,inset:5.5}:e>=520?{font:16.5,pad:20,height:56,inset:5}:{font:14.5,pad:14,height:48,inset:4};let o=A(t,n.font,r),h=(t,e)=>e.reduce((e,i)=>e+i+2*t.pad,0)+2*t.inset;for(let e=0;e<12&&h(n,o)>l;e++)n.pad>.62*n.font?n={...n,pad:.88*n.pad}:o=A(t,(n={...n,font:.94*n.font,pad:.96*n.pad,height:.97*n.height}).font,r);let u=h(n,o),c=[],d=n.inset;for(let t of o){let e=t+2*n.pad;c.push({x0:d,x1:d+e}),d+=e}let m=n.height-2*n.inset;return{x:Math.round((e-u)/2),y:Math.round(i-n.height/2),width:u,height:n.height,inset:n.inset,font:n.font,labels:t,slots:c,liquid:{slots:c,height:m,room:n.inset,min:n.inset,max:u-n.inset},key:`${t.join("|")}:${u.toFixed(2)}:${n.font.toFixed(2)}:${r}`}}(b,G.width,.5*G.height,t,Z),[G.width,G.height,Z,te,t,b,u]),tl=(0,r.useLatest)(ts),to=(0,i.useRef)(()=>{}),th=(0,i.useRef)(O.index),{canvasRef:tu,sizeRef:tc,supported:td}=(0,r.useWebGL2)({mode:t,attributes:{antialias:!1,alpha:!0,premultipliedAlpha:!0},onContext:t=>{let e;try{e=new P(t)}catch(t){console.error(t);return}return U.current=e,tn.current.labelsKey="",to.current(),()=>{e.dispose(),U.current===e&&(U.current=null)}},onResize:()=>{U.current?.resized(),tn.current.labelsKey="",to.current()}});(0,i.useEffect)(()=>{if(!ts)return;let t=s[ta.current.material];O.setFeel(t),O.instant=!1,O.setLayout(ts.liquid),j.resize(ts.width,ts.height,t.blend*ts.liquid.height),K.resize(ts.width+4),tn.current.labelsKey="",tn.current.still=!1,o&&!u&&(function(t,e,i,a){t.instant=!1,t.rest(0),t.select(t.count-1);let r=a.liquid.height/2;for(let a=0;a<120&&(t.step(1/120),e.compute(t.prims,t.primCount),i.update(e,r,s.ink.dry,1/120),!(t.connected&&t.tail.on&&t.neck()>.8));a++);}(O,j,K,ts),tn.current.still=!0),O.instant=o,j.compute(O.prims,O.primCount),th.current=O.index,Y(O.index),to.current()},[ts,O,j,K,ta,o,u]),(0,i.useEffect)(()=>{!function(t,e){let i;y(t,g);try{i=getComputedStyle(document.documentElement)}catch{return t}let a=t=>i.getPropertyValue(t).trim(),r=a("--tile");if(!r)return;let n=(t,e)=>t?(0,d.rgb)(t):e,s=(0,d.rgb)(r),l=n(a("--background"),s),o=n(a("--foreground"),g.fg),h=n(a("--ink"),g.ink),u={...g,fg:o,ink:h,onInk:n(a("--on-ink"),g.onInk),dark:+!!e};if(e){let t=x(s)>=x(l)?s:l;u.floor=[Math.min(1,t[0]+.022),Math.min(1,t[1]+.02),Math.min(1,t[2]+.02)],u.label=n(a("--secondary"),[.6,.6,.6]),u.lip=[.5*o[0],.5*o[1],.5*o[2]]}else{u.floor=[.955*s[0],.955*s[1],.955*s[2]];let t=n(a("--secondary"),g.label);u.label=[.92*t[0],.92*t[1],.92*t[2]],.03>x(h)&&(h=[.082,.082,.082]),u.ink=h,u.lip=[1,1,1]}y(t,u)}(tn.current.room,"dark"===h),to.current()},[h,tr]);let tm=(0,r.useFrame)(l,t=>{let e=tl.current;if(!e)return!1;let i=tn.current,r=ta.current,n=r.reducedMotion,l=!1;if(!r.stage&&!i.still){if(!i.hovering&&(i.countdown-=t,i.countdown<=0)){let[t,e]=z[i.loop%z.length];i.loop++,O.select(Math.min(t,O.count-1)),i.countdown=e}l=!0}let o=!1;return i.still||(o=O.step(t),r.stage&&function(t){let e=tc.current.width||t.width,i=ta.current.material;for(let r=0;r<O.eventCount;r++){let n=O.events[r],s=(t.x+n.x)/e*2-1;"land"===n.type?N(i,n.index,.35+.65*n.strength,s):"pinch"===n.type?function(t,e=0){let i=B();if(!i)return;let r=performance.now();if(r-L<50)return;L=r;let{ctx:n,output:s}=i,l=n.currentTime,o=.04+.06*Math.max(0,Math.min(1,t)),h=I(n,e),u=n.createBufferSource();u.buffer=(0,a.noiseBuffer)(n);let c=n.createBiquadFilter();c.type="bandpass",c.frequency.value=3800+500*Math.random(),c.Q.value=2.2;let d=n.createGain();d.gain.setValueAtTime(0,l),d.gain.linearRampToValueAtTime(o,l+.001),d.gain.exponentialRampToValueAtTime(1e-4,l+.018);let m=u.connect(c).connect(d);h?m.connect(h).connect(s):m.connect(s),u.start(l,.5*Math.random(),.03);let f=n.createOscillator();f.type="sine",f.frequency.setValueAtTime(2300,l),f.frequency.exponentialRampToValueAtTime(1500,l+.02);let p=n.createGain();p.gain.setValueAtTime(0,l),p.gain.linearRampToValueAtTime(.5*o,l+.001),p.gain.exponentialRampToValueAtTime(1e-4,l+.03),f.connect(p).connect(s),f.start(l),f.stop(l+.04)}(n.strength,s):"join"===n.type?function(t,e,i=0){let a=B();if(!a)return;let r=performance.now();if(r-S<70)return;S=r;let{ctx:n,output:s}=a,l=n.currentTime,o=.05+.09*Math.max(0,Math.min(1,e)),h="mercury"===t?360:"water"===t?260:200,u=I(n,i),c=n.createOscillator();c.type="sine",c.frequency.setValueAtTime(h,l),c.frequency.exponentialRampToValueAtTime(1.6*h,l+.045);let d=n.createGain();d.gain.setValueAtTime(0,l),d.gain.linearRampToValueAtTime(o,l+.006),d.gain.exponentialRampToValueAtTime(1e-4,l+.14);let m=n.createBiquadFilter();m.type="lowpass",m.frequency.value=1400;let f=c.connect(d).connect(m);u?f.connect(u).connect(s):f.connect(s),c.start(l),c.stop(l+.17)}(i,n.strength,s):"cross"===n.type?function(t,e){let i=B();if(!i)return;let r=performance.now();if(r-F<28)return;F=r;let{ctx:n,output:s}=i,l=n.currentTime,o=.025+.03*Math.max(0,Math.min(1,e)),h=n.createBufferSource();h.buffer=(0,a.noiseBuffer)(n);let u=n.createBiquadFilter();u.type="bandpass",u.frequency.value=1900*Math.pow(2,W[Math.max(0,Math.min(W.length-1,t))]/24),u.Q.value=3;let c=n.createGain();c.gain.setValueAtTime(0,l),c.gain.linearRampToValueAtTime(o,l+.001),c.gain.exponentialRampToValueAtTime(1e-4,l+.014),h.connect(u).connect(c).connect(s),h.start(l,.5*Math.random(),.03)}(n.index,n.strength):"wall"===n.type&&function(t,e=0){let i=B();if(!i)return;let{ctx:a,output:r}=i,n=a.currentTime,s=.05+.08*Math.max(0,Math.min(1,t)),l=I(a,e),o=a.createOscillator();o.type="sine",o.frequency.setValueAtTime(150,n),o.frequency.exponentialRampToValueAtTime(85,n+.07);let h=a.createGain();h.gain.setValueAtTime(0,n),h.gain.linearRampToValueAtTime(s,n+.004),h.gain.exponentialRampToValueAtTime(1e-4,n+.1);let u=o.connect(h);l?u.connect(l).connect(r):u.connect(r),o.start(n),o.stop(n+.12)}(n.strength,s)}}(e),O.index!==th.current&&(th.current=O.index,Y(O.index)),j.compute(O.prims,O.primCount),K.update(j,e.liquid.height/2,n?0:s[r.material].dry,t)),i.matT<1&&(i.matT=n?1:Math.min(1,i.matT+t/.55),i.matT>=1&&(i.matFrom=i.matTo),l=!0),function(t){let e=tn.current,i=tc.current,a=U.current;if(a&&$&&i.width>0){let r=`${t.key}@${i.dpr}`;e.labelsKey!==r&&(!function(t,e,i,a){let r=Math.max(1,Math.ceil(e.width*i)),n=Math.max(1,Math.ceil(e.height*i));t.width!==r&&(t.width=r),t.height!==n&&(t.height=n);let s=t.getContext("2d");if(!s)return;s.setTransform(1,0,0,1,0,0),s.clearRect(0,0,r,n),s.setTransform(i,0,0,i,0,0),s.fillStyle="#fff",s.font=`500 ${e.font}px ${a}`,s.textAlign="center",s.textBaseline="alphabetic";let l=s.measureText("Wbg"),o=l.actualBoundingBoxAscent||.72*e.font,h=l.actualBoundingBoxDescent||.2*e.font,u=s.measureText("W").actualBoundingBoxAscent||.7*e.font,c=e.height/2+u/2-.04*Math.min(h,o);e.labels.forEach((t,i)=>{let a=e.slots[i];s.fillText(t,(a.x0+a.x1)/2,c)})}($,t,i.dpr,Z||T()),a.setLabels($),e.labelsKey=r);let n=tu.current;if(!n)return;let s=e.frame??={width:0,height:0,dpr:1,bar:{x:0,y:0,width:0,height:0},dropH:0,dark:0,floor:e.room.floor,label:e.room.label,fg:e.room.fg,ink:e.room.ink,onInk:e.room.onInk,lip:e.room.lip,mat:[0,0,1,0],ripple:[0,10,0],press:0,wetK:0};s.width=n.width,s.height=n.height,s.dpr=i.dpr,s.bar.x=t.x,s.bar.y=t.y,s.bar.width=t.width,s.bar.height=t.height,s.dropH=t.liquid.height,s.dark=e.room.dark,s.mat[0]=e.matFrom,s.mat[1]=e.matTo,s.mat[2]=e.matT,s.mat[3]=e.matX,s.ripple[0]=O.ripple.x,s.ripple[1]=O.ripple.age,s.ripple[2]=ta.current.reducedMotion?0:O.ripple.amp,s.press=Math.max(0,O.press.value),s.wetK=p[ta.current.material],a.render(s,j,K);return}let r=C.current;if(r&&!1===td){let i=r.getContext("2d"),a=Math.min(u?2:1.5,window.devicePixelRatio||1),n=Math.round(G.width*a),s=Math.round(G.height*a);r.width!==n&&(r.width=n),r.height!==s&&(r.height=s),i&&function(t,e,i,a,r,n,s,l){t.setTransform(e,0,0,e,0,0),t.clearRect(0,0,i,a),t.save(),t.translate(r.x,r.y);let o=r.height/2,h=new Path2D;h.roundRect(0,0,r.width,r.height,o),t.fillStyle=v(s.floor),t.fill(h);let u=e=>{t.fillStyle=e,t.font=`500 ${r.font}px ${l}`,t.textAlign="center",t.textBaseline="middle",r.labels.forEach((e,i)=>{let a=r.slots[i];t.fillText(e,(a.x0+a.x1)/2,o+.04*r.font)})};u(v(s.label));let c=new Path2D,d=n.values,m=n.step,f=!1,p=0,g=t=>{for(let e=t;e>=p;e--)c.lineTo(n.origin+e*m,o+Math.max(0,d[e]));c.closePath()};for(let t=0;t<n.count;t++){let e=d[t],i=n.origin+t*m;e>0?(f||(c.moveTo(i,o),f=!0,p=t),c.lineTo(i,o-e)):f&&(c.lineTo(i,o),g(t-1),f=!1)}f&&g(n.count-1),t.fillStyle=v(s.ink),t.fill(c),t.save(),t.clip(c),u(v(s.onInk)),t.restore(),t.restore()}(i,a,G.width,G.height,t,j,e.room,Z||T())}}(e),l||o||K.active});(0,i.useEffect)(()=>{to.current=tm},[tm]);let tf=t=>{let e=q.current,i=tl.current;return e&&i?t-e.getBoundingClientRect().left:0},tp=t=>Math.abs(t-O.head.x)<=O.head.w/2+8,tg=t=>{O.select(t),O.index!==th.current&&(th.current=O.index,Y(O.index)),tm()},tx=t=>{let e=tn.current.drag;if(e.id===t.pointerId){if("drag"===e.mode){let t=O.release();th.current=t,Y(t)}"mouse"===t.pointerType&&O.hover(O.slotAt(tf(t.clientX))),O.setPressed(!1),e.mode="none",e.id=-1,t.currentTarget.style.cursor="",tm()}};return(0,e.jsxs)("div",{ref:k,className:"absolute inset-0 select-none overflow-hidden",onPointerMove:u?void 0:t=>{if(u||"mouse"!==t.pointerType||tn.current.still)return;let e=tl.current,i=k.current;if(!e||!i)return;let a=t.clientX-i.getBoundingClientRect().left-e.x,r=tn.current;r.hovering=!0,r.countdown=1.1;let n=O.slotAt(a);(n!==O.index||Math.abs(O.target-O.slotCentre(n))>.5)&&O.select(n),tm()},onPointerLeave:u?void 0:()=>{tn.current.hovering=!1,tm()},children:[(0,e.jsx)("canvas",{ref:tu,"aria-hidden":"true",className:"absolute inset-0 size-full"}),!1===td?(0,e.jsx)("canvas",{ref:C,"aria-hidden":"true",className:"absolute inset-0 size-full"}):null,u&&ts?(0,e.jsxs)(e.Fragment,{children:[(0,e.jsxs)("div",{ref:q,role:"radiogroup","aria-label":"Sections",onKeyDown:t=>{let e=b.length,i=O.index,r=-1;switch(t.key){case"ArrowRight":case"ArrowDown":r=(i+1)%e;break;case"ArrowLeft":case"ArrowUp":r=(i-1+e)%e;break;case"Home":r=0;break;case"End":r=e-1;break;default:/^[1-9]$/.test(t.key)&&+t.key<=e&&(r=t.key-1)}if(!(r<0)){let e;t.preventDefault(),t.stopPropagation(),(0,a.ensureAudio)(),tg(r),e=r,D.current[e]?.focus({preventScroll:!0})}},onPointerDown:t=>{if(!t.isPrimary||t.button>0||!tl.current)return;(0,a.ensureAudio)();let e=tn.current.drag,i=tf(t.clientX);try{t.currentTarget.setPointerCapture(t.pointerId)}catch{}e.id=t.pointerId,e.startX=i,tp(i)?(O.grab(i),O.setPressed(!0),e.mode="drag",t.currentTarget.style.cursor="grabbing"):(tg(O.slotAt(i)),e.mode="pending"),tm()},onPointerMove:t=>{if(!tl.current)return;let e=tn.current.drag,i=tf(t.clientX);if(e.id===t.pointerId){"pending"===e.mode&&Math.abs(i-e.startX)>6&&(O.grab(i),O.setPressed(!0),e.mode="drag",t.currentTarget.style.cursor="grabbing"),"drag"===e.mode&&O.drag(i)&&(th.current=O.index,Y(O.index)),tm();return}"mouse"===t.pointerType&&(O.hover(O.slotAt(i)),t.currentTarget.style.cursor=tp(i)?"grab":"pointer",tm())},onPointerUp:tx,onPointerCancel:tx,onPointerLeave:t=>{"mouse"===t.pointerType&&-1===tn.current.drag.id&&(O.hover(-1),tm())},className:"absolute cursor-pointer touch-pan-y",style:{left:ts.x,top:ts.y,width:ts.width,height:ts.height},children:[(0,e.jsx)("span",{"aria-hidden":"true",className:"absolute inset-x-0 -inset-y-2.5"}),ts.slots.map((t,i)=>(0,e.jsx)("button",{ref:t=>{D.current[i]=t},type:"button",role:"radio","aria-checked":i===H,"aria-label":b[i],tabIndex:i===H?0:-1,onClick:t=>{0===t.detail&&tg(i)},className:"absolute cursor-[inherit] rounded-full bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",style:{left:t.x0,width:t.x1-t.x0,top:ts.inset,bottom:ts.inset}},b[i]))]}),(0,e.jsx)(n.StageControls,{placement:"top",children:(0,e.jsx)(n.Tray,{children:(0,e.jsx)(n.Segmented,{label:"Liquid",options:m,value:Q,onChange:t=>{if(t===Q)return;(0,a.ensureAudio)(),J(t);let e=tn.current,i=tl.current,r=s[t];O.setFeel(r),i&&j.resize(i.width,i.height,r.blend*i.liquid.height),e.matFrom=e.matTo,e.matTo=f[t],e.matX=O.head.x,o?(e.matT=1,e.matFrom=e.matTo):(e.matT=0,O.stretch.velocity+=2.4,O.ripple.x=O.head.x,O.ripple.age=0,O.ripple.amp=.8),N(t,O.index,.5),tm()}})})}),(0,e.jsxs)(n.StageControls,{placement:"bottom",children:[(0,e.jsx)(n.Tray,{children:(0,e.jsx)(n.MuteButton,{})}),(0,e.jsx)(n.StageHint,{children:X?"Click a tab, or drag the drop across · ← → and 1–5 on the keyboard":"Tap a tab, or drag the drop along the bar"})]})]}):null]})}],60276)},41729,function(t){t.n(t.i(60276))}]);