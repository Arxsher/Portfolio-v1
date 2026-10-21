(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,66396,t=>{"use strict";var e=t.i(43476),a=t.i(71645),r=t.i(16442),i=t.i(37047),o=t.i(45219),n=t.i(15127);let l=[{pattern:0,pearl:0,name:"Prism",foil:"Radial grating"},{pattern:1,pearl:1,name:"Lattice",foil:"Pixel hologram"},{pattern:2,pearl:0,name:"Ripple",foil:"Wave grating"}],s=[[31.5,31],[31.5,31.5],[31.5,30],[31.5,40]],h={x:4.5,y:4.5,w:54,h:56,r:2.2};function c(t,e){let a=document.createElement("canvas");return a.width=t,a.height=e,a}function f(t,e=!1){let a=t.getContext("2d",e?{willReadFrequently:!0}:void 0);if(!a)throw Error("holo-cards: no 2D context");return a}function d(t,e,a,r,i,o){t.beginPath(),t.moveTo(e+o,a),t.arcTo(e+r,a,e+r,a+i,o),t.arcTo(e+r,a+i,e,a+i,o),t.arcTo(e,a+i,e,a,o),t.arcTo(e,a,e+r,a,o),t.closePath()}let u="u">typeof Path2D?new Path2D(n.LOGO_PATH):null;function m(t,e,a,r,i){if(!u)return;let o=r/14.4;t.save(),t.translate(e-8*o,a-8.1*o),t.scale(o,o),t.fillStyle=i,t.fill(u,"evenodd"),t.restore()}function p(t,e,a,r,i,o,n,l="left",s=0){var h;t.save(),t.font=`${o} ${i}px ${function(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(t)return`${t}, ui-sans-serif, system-ui, sans-serif`}catch{}return"ui-sans-serif, system-ui, sans-serif"}()}`,t.textAlign=l,t.textBaseline="alphabetic",t.fillStyle=n,h=`${s}px`,"letterSpacing"in t&&(t.letterSpacing=h),t.fillText(e,a,r),t.restore()}function g(t,e,a){"filter"in t&&(t.filter=e>0?`blur(${(e*a).toFixed(2)}px)`:"none")}class v{width;height;print;chans;mask;k;constructor(t){this.width=t,this.height=Math.round(88*t/63),this.k=t/63,this.print=c(this.width,this.height),this.chans=[0,1,2].map(()=>c(this.width,this.height)),this.mask=new ImageData(this.width,this.height)}paint(t){let e=f(this.print),[a,r,i]=this.chans.map(t=>f(t,!0));for(let t of[e,a,r,i])t.setTransform(1,0,0,1,0,0),t.filter="none",t.globalAlpha=1,t.globalCompositeOperation="source-over",t.fillStyle="#000",t.fillRect(0,0,this.width,this.height),t.setTransform(this.k,0,0,this.k,0,0);return 0===t?this.prism(e,a,r,i):1===t?this.lattice(e,a,r,i):2===t?this.ripple(e,a,r,i):this.back(e,a,r,i),this.pack(t),{print:this.print,mask:this.mask}}pack(t){let e=this.width,a=this.height,[r,i,o]=this.chans.map(t=>f(t,!0).getImageData(0,0,e,a).data),n=this.mask.data,l=2===t,[h,c]=s[2],d=this.k;for(let t=0,s=0;t<a;t++)for(let a=0;a<e;a++,s+=4){let e=i[s];if(l){let i=a/d-h,o=t/d-c,n=Math.sqrt(i*i+o*o);n>6.2&&o<32&&(e=Math.min(255,e+(.5+.5*Math.cos(3.1*Math.pow(n-6.2,.86)))*(Math.exp(-(n-6.2)/15)*Math.min(1,(n-6.2)/1.2)*Math.min(1,Math.max(0,(32-o)/3)))*30*(r[s]/255)))}n[s]=r[s],n[s+1]=e,n[s+2]=o[s],n[s+3]=255}}frame(t,e,a,r){for(let i of[t,e])d(i,a,a,63-2*a,88-2*a,3.2-.6*a),i.lineWidth=.32,i.strokeStyle=i===t?r:"#fff",i.stroke()}prism(t,e,a,r){let[i,o]=s[0],n=t.createLinearGradient(0,0,0,88);n.addColorStop(0,"#1a1b21"),n.addColorStop(1,"#0d0e11"),t.fillStyle=n,t.fillRect(0,0,63,88);let{x:l,y:c,w:f,h:u,r:v}=h,x=t.createRadialGradient(i,o,2,i,o,40);x.addColorStop(0,"#ffffff"),x.addColorStop(.45,"#eceef6"),x.addColorStop(1,"#8d93ad"),t.fillStyle=x,d(t,l,c,f,u,v),t.fill(),e.fillStyle="#fff",d(e,l,c,f,u,v),e.fill(),t.save(),d(t,l,c,f,u,v),t.clip(),t.strokeStyle="rgba(20, 21, 28, 0.32)";for(let e=0;e<96;e++){let a=e/96*Math.PI*2,r=e%2==0;t.lineWidth=r?.16:.1,t.beginPath(),t.moveTo(i+17.6*Math.cos(a),o+17.6*Math.sin(a)),t.lineTo(i+Math.cos(a)*(r?60:26),o+Math.sin(a)*(r?60:26)),t.stroke()}for(let[e,r]of(t.restore(),[[16.2,.3],[17.2,.16]]))t.beginPath(),t.arc(i,o,e,0,2*Math.PI),t.lineWidth=r,t.strokeStyle="rgba(20, 21, 28, 0.7)",t.stroke(),a.beginPath(),a.arc(i,o,e,0,2*Math.PI),a.lineWidth=r+.3,a.strokeStyle="rgba(255,255,255,0.45)",a.stroke();m(t,i,o,21,"#ffffff"),m(r,i,o,21,"#ffffff"),g(a,.45,this.k),m(a,i,o,21,"#ffffff"),g(a,0,this.k),p(t,"Prism",5.6,73.2,7.6,600,"#f1f1f4","left",-.15),p(t,"Radial grating",5.7,79.6,2.9,500,"#8d8f9b"),p(t,"01 / 03",57.4,79.6,2.9,500,"#8d8f9b","right",.05),m(t,55.4,70.6,3.4,"#8d8f9b"),g(a,.25,this.k),p(a,"Prism",5.6,73.2,7.6,600,"rgba(255,255,255,0.55)","left",-.15),g(a,0,this.k),this.frame(t,e,1.6,"#ffffff")}lattice(t,e,a,r){let[i,o]=s[1],n=t.createLinearGradient(0,0,63,88);n.addColorStop(0,"#f5f2ec"),n.addColorStop(1,"#e8e3da"),t.fillStyle=n,t.fillRect(0,0,63,88);let{x:l,y:c,w:f,h:u,r:v}=h;for(let r of(t.fillStyle="#fbfbfd",d(t,l,c,f,u,v),t.fill(),e.fillStyle="#fff",d(e,l,c,f,u,v),e.fill(),a.fillStyle="rgba(255,255,255,0.32)",d(a,l,c,f,u,v),a.fill(),[t,e,a])){r.save(),d(r,l,c,f,u,v),r.clip(),r.translate(i,o),r.rotate(Math.PI/4),r.strokeStyle=r===t?"#ece8e1":"#000",r.lineWidth=r===a?.5:.24;for(let t=-24;t<=24;t++)r.beginPath(),r.moveTo(4.2*t,-120),r.lineTo(4.2*t,120),r.moveTo(-120,4.2*t),r.lineTo(120,4.2*t),r.stroke();r.restore()}m(t,i,o,25.3,"#cfc9bf"),m(t,i,o,24,"#f6f3ee"),m(e,i,o,25.3,"#000"),g(a,.5,this.k),m(a,i,o,24,"#ffffff"),g(a,0,this.k),p(t,"Lattice",5.6,73.2,7.6,600,"#1c1c20","left",-.15),p(t,"Pixel hologram",5.7,79.6,2.9,500,"#7b766d"),p(t,"02 / 03",57.4,79.6,2.9,500,"#7b766d","right",.05),m(t,55.4,70.6,3.4,"#9d978c"),g(a,.25,this.k),p(a,"Lattice",5.6,73.2,7.6,600,"rgba(255,255,255,0.5)","left",-.15),g(a,0,this.k),this.frame(t,e,1.6,"#fbfbfd")}ripple(t,e,a,r){let[i,o]=s[2],n=t.createLinearGradient(0,0,63,88);n.addColorStop(0,"#f4f5f8"),n.addColorStop(.6,"#dfe1e7"),n.addColorStop(1,"#c9ccd4"),t.fillStyle=n,t.fillRect(0,0,63,88),e.fillStyle="#fff",e.fillRect(0,0,63,88);t.fillStyle="#24252b",d(t,4.5,63.6,54,20.4,2.2),t.fill(),e.fillStyle="#000",d(e,4.5,63.6,54,20.4,2.2),e.fill(),g(a,.3,this.k),a.strokeStyle="rgba(255,255,255,0.35)",a.lineWidth=.6,d(a,4.5,63.6,54,20.4,2.2),a.stroke(),g(a,0,this.k),t.beginPath(),t.arc(i,o,5.6,0,2*Math.PI),t.lineWidth=.35,t.strokeStyle="rgba(36, 37, 43, 0.85)",t.stroke(),m(t,i,o,7.6,"#ffffff"),m(r,i,o,7.6,"#ffffff"),g(a,.3,this.k),m(a,i,o,7.6,"#ffffff"),g(a,0,this.k),p(t,"Ripple",7.4,74.2,7.6,600,"#f1f1f4","left",-.15),p(t,"Wave grating",7.5,80.2,2.9,500,"#9a9ca7"),p(t,"03 / 03",55.6,80.2,2.9,500,"#9a9ca7","right",.05),m(t,53.6,71.4,3.4,"#9a9ca7")}back(t,e,a,r){let[i,o]=s[3],n=t.createRadialGradient(i,o,4,i,o,60);n.addColorStop(0,"#1d1e24"),n.addColorStop(1,"#0e0f12"),t.fillStyle=n,t.fillRect(0,0,63,88);let l=[{R:13.4,A:1.5,n:12,count:6},{R:19.2,A:2,n:16,count:7},{R:25,A:2.3,n:20,count:8}];for(let a of[t,e]){for(let e of(a.strokeStyle=a===t?"#e9eaf0":"#fff",a.lineWidth=.11,l))for(let t=0;t<e.count;t++){let r=t/e.count*Math.PI*2;a.beginPath();for(let t=0;t<=720;t++){let n=t/720*Math.PI*2,l=e.R+e.A*Math.sin(e.n*n+r),s=i+l*Math.cos(n),h=o+1.32*l*Math.sin(n);0===t?a.moveTo(s,h):a.lineTo(s,h)}a.closePath(),a.stroke()}d(a,3.6,3.6,55.8,80.8,1.6),a.lineWidth=.12,a.stroke()}for(let e of[t,r])e.beginPath(),e.arc(i,o,9.4,0,2*Math.PI),e.fillStyle=e===t?"#f4f5f8":"#fff",e.fill();m(t,i,o,11.5,"#15161b"),m(r,i,o,11.5,"#000"),g(a,.4,this.k),a.beginPath(),a.arc(i,o,9.4,0,2*Math.PI),a.lineWidth=1.1,a.strokeStyle="rgba(255,255,255,0.7)",a.stroke(),g(a,0,this.k),p(t,"arsher",31.5,81.4,3.1,500,"#8d8f9b","center",.6),this.frame(t,e,2.2,"#e9eaf0")}}let x=63/88,y=3.2/88,b=63/88/2,k=2*Math.PI,T=1/240,M=[210,210,260,190,230,230,150,560],w=[.78,.78,.95,.72,.6,.6,.6,.17],A=[[0,0,0],[-.016,.036,-.042],[.02,.066,.05]],R=[0,.07,.03],E=1.8*Math.sqrt(2600),P=(63/88*(63/88)+1)/12*1.4,C=1.72*Math.sqrt(95);class S{id;rank;pendingRank;wait=0;hold=!1;mode=0;p=new Float64Array(8);v=new Float64Array(8);g=new Float64Array(8);axes=new Float64Array(9);model=new Float32Array(16);hx=0;hy=0;px=0;py=0;pvx=0;pvy=0;flyT=0;clearT=-1;landed=!1;flipping=!1;constructor(t){this.id=t,this.rank=t,this.pendingRank=t}get x(){return this.p[0]}get y(){return this.p[1]}get z(){return this.p[2]}get showsFront(){return Math.cos(this.p[6])>=0}updateBasis(){let t=this.p,e=Math.cos(t[3]),a=Math.sin(t[3]),r=Math.cos(t[6]),i=Math.sin(t[6]),o=Math.cos(t[5]),n=Math.sin(t[5]),l=Math.cos(t[4]),s=Math.sin(t[4]),h=e*r,c=-a,f=e*i,d=-i,u=a*r,m=a*i,p=-n*h+o*d,g=-n*c+0*o,v=-n*f+o*r,x=o*h+n*d,y=o*c+0*n,b=o*f+n*r,k=l*u-s*p,T=l*e-s*g,M=l*m-s*v,w=s*u+l*p,A=s*e+l*g,R=s*m+l*v,E=this.axes;E[0]=x,E[1]=k,E[2]=w,E[3]=y,E[4]=T,E[5]=A,E[6]=b,E[7]=M,E[8]=R;let P=this.model;P[0]=x,P[1]=k,P[2]=w,P[3]=0,P[4]=y,P[5]=T,P[6]=A,P[7]=0,P[8]=b,P[9]=M,P[10]=R,P[11]=0,P[12]=t[0],P[13]=t[1],P[14]=t[2],P[15]=1}}let _=new Float64Array(4);class L{cards=[];order=[];drawOrder=[];fan=0;fanAngle=.27;fanV=0;fanGoal=0;fanHeld=!1;fanTarget=0;aimCard=-1;aimX=0;aimY=0;aimOn=!1;aimAmt=0;extraTx=0;extraTy=0;bounds=new Float64Array([-2,2,-1.4,1.4]);events=0;throwSpeed=0;time=0;reduced=!1;introT=-1;touched=!1;autoT=0;autoNext=2.4;autoDir=1;constructor(){for(let t=0;t<3;t++)this.cards.push(new S(t)),this.order.push(t),this.drawOrder.push(t);this.settle()}slot(t,e,a){let r=A[Math.min(t,A.length-1)],o=e<0?.15*e:e,n=-(2-t-1)*this.fanAngle,l=-1.75*Math.sin(n),s=1.75*(Math.cos(n)-1);a[0]=r[0]+(l-r[0])*o,a[1]=r[1]+(s-r[1])*o,a[2]=-t*(.05+-.015*(0,i.clamp)(o,0,1.2)),a[3]=r[2]+(n-r[2])*o}settle(){for(let t of this.cards)t.mode=0,t.hold=!1,t.wait=0,t.rank=t.pendingRank=this.order.indexOf(t.id),this.slot(t.rank,this.fan,_),t.p.fill(0),t.v.fill(0),t.p[0]=_[0],t.p[1]=_[1],t.p[2]=_[2],t.p[3]=_[3],t.p[6]=t.g[6]=Math.round(t.p[6]/Math.PI)*Math.PI,t.updateBasis();this.sortDraw()}setFanNow(t){this.fan=this.fanGoal=this.fanTarget=t,this.fanV=0}deal(){this.setFanNow(0),this.fanGoal=1,this.introT=0;for(let t=0;t<3;t++){let e=this.cards[this.order[t]];e.mode=0,e.p.fill(0),e.v.fill(0),e.p[0]=(t-1)*.22,e.p[1]=-1.75-.08*(2-t),e.p[2]=.18,e.p[3]=(1-t)*.35,e.p[4]=.75,e.hold=!0,e.wait=.05+.09*(2-t),e.rank=e.pendingRank=t,e.updateBasis()}}setFan(t){let e=+(t>=.5);this.touched=!0,e!==this.fanGoal&&(this.events|=64),this.fanGoal=e,this.reduced&&this.setFanNow(e)}holdFan(){this.fanHeld=!0,this.fanTarget=this.fan,this.touched=!0}releaseFan(t){this.fanHeld=!1;let e=+(this.fan+.18*t>=.5);e!==this.fanGoal&&(this.events|=64),this.fanGoal=e,this.reduced?this.setFanNow(e):this.fanV=(0,i.clamp)(t,-8,8)}heldCard(){for(let t of this.cards)if(1===t.mode)return t;return null}grab(t,e,a){let r=this.cards[t];r.mode=1,r.hold=!1;let i=e-r.p[0],o=a-r.p[1],n=Math.cos(r.p[3]),l=Math.sin(r.p[3]);r.hx=n*i+l*o,r.hy=-l*i+n*o,r.px=e,r.py=a,r.pvx=r.pvy=0,this.touched=!0,this.events|=1}drag(t,e,a,r){let i=this.heldCard();i&&(i.px=t,i.py=e,i.pvx=a,i.pvy=r)}release(t,e){let a=this.heldCard();if(!a)return!1;this.slot(a.rank,this.fan,_);let r=a.p[0]-_[0],o=a.p[1]-_[1],n=Math.hypot(r,o),l=Math.hypot(t,e),s=n>1e-4?(t*r+e*o)/n:0,h=l>1.5&&(s>-.25*l||l>3.4),c=n>.62*x&&(l>.25||n>.9*x);if(!h&&!c)return a.mode=0,!1;l<.8&&n>1e-4&&(t+=r/n*.8,e+=o/n*.8);let f=(l=Math.hypot(t,e))>9?9/l:1;a.v[0]=t*f,a.v[1]=e*f;let d=Math.cos(a.p[3]),u=Math.sin(a.p[3]),m=d*a.hx-u*a.hy,p=u*a.hx+d*a.hy;return a.v[3]=(0,i.clamp)(a.v[3]+(m*a.v[1]-p*a.v[0])*1.6,-10,10),a.v[7]+=(0,i.clamp)(-(.5*(d*a.v[0]+u*a.v[1])),-3,3),this.launch(a,Math.min(l,9)),!0}throwTop(t){let e=this.cards[this.order[0]];1!==e.mode&&(this.touched=!0,e.mode=2,e.v[0]=3.3*t,e.v[1]=1.05,e.v[3]=-(2.6*t),e.v[7]=1.6*t,this.launch(e,3.4))}launch(t,e){t.mode=2,t.flyT=0,t.clearT=-1,t.landed=!1,t.hold=!1,this.throwSpeed=e,this.events|=2,this.toBack(t.id),this.reduced&&(t.mode=0,t.landed=!0)}toBack(t){let e=this.order,a=e.indexOf(t);for(;a<e.length-1;a++)e[a]=e[a+1];e[e.length-1]=t;for(let a=0;a<e.length;a++){let r=this.cards[e[a]];r.id===t?(r.rank=r.pendingRank=a,r.wait=0):(r.pendingRank!==a||r.rank!==a)&&(r.pendingRank=a,r.wait=this.reduced?0:.035+.06*a,this.reduced&&(r.rank=a))}}toFront(t){let e=this.order,a=e.indexOf(t);if(!(a<=0)){for(;a>0;a--)e[a]=e[a-1];e[0]=t;for(let t=0;t<e.length;t++){let a=this.cards[e[t]];(a.pendingRank!==t||a.rank!==t)&&(a.pendingRank=t,a.wait=this.reduced?0:.02+.05*t,this.reduced&&(a.rank=t))}this.events|=128}}flip(t,e){let a=this.cards[t];a.g[6]=Math.round(a.g[6]/Math.PI)*Math.PI+(e>=0?Math.PI:-Math.PI),a.flipping=!0,a.v[7]+=2.2*e,this.touched=!0,this.events|=16,this.reduced&&(a.p[6]=a.g[6],a.v[6]=0)}auto(t){this.autoT+=t,this.autoT<this.autoNext||(this.throwTop(this.autoDir),this.autoDir=-this.autoDir,this.autoNext=this.autoT+5.4)}step(t){this.time+=t;let e=!1,a=this.reduced;if(this.introT>=0&&(this.introT+=t,e=!0,this.introT>1.9&&(this.touched||1!==this.fanGoal||(this.fanGoal=0,this.events|=64),this.introT=-1)),a)this.fan=this.fanHeld?this.fanTarget:this.fanGoal,this.fanV=0;else{let a=this.fanHeld?this.fanTarget:this.fanGoal,r=this.fanHeld?700:120,i=2*(this.fanHeld?1:.68)*Math.sqrt(r),o=t;for(;o>1e-6;){let t=Math.min(T,o);this.fanV+=(-r*(this.fan-a)-i*this.fanV)*t,this.fan+=this.fanV*t,o-=t}Math.abs(this.fan-a)>1e-4||Math.abs(this.fanV)>.001?e=!0:(this.fan=a,this.fanV=0)}let r=+!!this.aimOn;this.aimAmt=a?r:this.aimAmt+(r-this.aimAmt)*(1-Math.exp(-(9*t))),.001>Math.abs(this.aimAmt-r)?this.aimAmt=r:e=!0;let o=1-(0,i.clamp)(this.fan,0,1),n=this.heldCard(),l=0,s=0;for(let r of(n&&0===n.rank&&(this.slot(0,this.fan,_),l=(n.p[0]-_[0])*o,s=(n.p[1]-_[1])*o),this.cards)){let i=r.p,h=r.v,c=r.g;if(r.wait>0&&(r.wait-=t,e=!0,r.wait<=0&&(r.wait=0,r.hold&&(r.hold=!1,h[1]=2.4),r.rank!==r.pendingRank&&(this.events|=128),r.rank=r.pendingRank)),r.hold)continue;if(this.slot(r.rank,this.fan,_),c[0]=_[0],c[1]=_[1],c[2]=_[2],c[3]=_[3]+k*Math.round((i[3]-_[3])/k),0===r.mode){if(n&&n!==r&&r.rank>0){let t=R[Math.min(r.rank,R.length-1)];c[0]+=l*t,c[1]+=s*t}let t=0;if(this.aimCard>=0){let e=0===r.rank?1:1===r.rank?.85:.72;t=r.id===this.aimCard?1:o*e}let e=this.aimAmt*t;c[4]=-(.25*this.aimY)*e+this.extraTx,c[5]=.25*this.aimX*e+this.extraTy,c[2]+=.05*this.aimAmt*(r.id===this.aimCard?1:.4*o),c[7]=0}if(c[2]+=.14*Math.abs(Math.sin(i[6])),a){this.snap(r);continue}let f=t;for(;f>1e-6;){let t=Math.min(T,f);if(f-=t,1===r.mode)this.stepHeld(r,t);else if(2===r.mode)this.stepFly(r,t);else for(let e=0;e<8;e++){let a=e<2?M[e]*(1-.1*r.rank):M[e],o=2*w[e]*Math.sqrt(a);h[e]+=(-a*(i[e]-c[e])-o*h[e])*t,i[e]+=h[e]*t}}if(2===r.mode&&(r.flyT+=t,this.flight(r)),r.flipping&&.12>Math.abs(i[6]-c[6])&&(r.flipping=!1,this.events|=32),0!==r.mode)e=!0;else{let t=!1;for(let e=0;e<8;e++)if(Math.abs(i[e]-c[e])>2e-4||Math.abs(h[e])>.002){t=!0;break}if(t)e=!0;else for(let t=0;t<8;t++)i[t]=c[t],h[t]=0}}for(let t of this.cards)t.updateBasis();return this.sortDraw(),e}snap(t){let e=t.p,a=t.v,r=t.g;if(1===t.mode){let i=Math.cos(e[3]),o=Math.sin(e[3]);e[0]=t.px-(i*t.hx-o*t.hy),e[1]=t.py-(o*t.hx+i*t.hy),e[2]=.16,e[4]=e[5]=e[7]=0,e[6]=r[6],a.fill(0);return}2===t.mode&&(t.mode=0,this.events|=8);for(let t=0;t<8;t++)e[t]=r[t],a[t]=0;e[4]=e[5]=e[7]=0,t.flipping=!1}stepHeld(t,e){let a=t.p,r=t.v,o=t.g,n=Math.cos(a[3]),l=Math.sin(a[3]),s=n*t.hx-l*t.hy,h=l*t.hx+n*t.hy,c=r[0]-r[3]*h,f=r[1]+r[3]*s,d=2600*(t.px-(a[0]+s))-E*(c-t.pvx),u=2600*(t.py-(a[1]+h))-E*(f-t.pvy),m=s*u-h*d-.5*r[3]-.9*(a[3]-o[3]);r[0]+=(d-2.6*r[0])*e,r[1]+=(u-2.6*r[1])*e,r[3]+=m/P*e,a[0]+=r[0]*e,a[1]+=r[1]*e,a[3]+=r[3]*e,o[2]=.16+.14*Math.abs(Math.sin(a[6])),o[4]=(0,i.clamp)(-(.075*r[1]),-.42,.42),o[5]=(0,i.clamp)(.075*r[0],-.42,.42),o[7]=(0,i.clamp)(-(.045*(n*r[0]+l*r[1])),-.3,.3);for(let t=2;t<8;t++){if(3===t)continue;let i=M[t],n=2*w[t]*Math.sqrt(i);r[t]+=(-i*(a[t]-o[t])-n*r[t])*e,a[t]+=r[t]*e}}stepFly(t,e){var a;let r,o=t.p,n=t.v,l=t.g,s=t.clearT>=0,h=s?(a=(t.flyT-t.clearT)/.35,(r=(0,i.clamp)(a))*r*(3-2*r)):0,c=-1.9*n[0],f=-1.9*n[1],d=this.bounds;if(o[0]<d[0]?c+=-110*(o[0]-d[0])-9*n[0]:o[0]>d[1]&&(c+=-110*(o[0]-d[1])-9*n[0]),o[1]<d[2]?f+=-110*(o[1]-d[2])-9*n[1]:o[1]>d[3]&&(f+=-110*(o[1]-d[3])-9*n[1]),s)c+=h*(-95*(o[0]-l[0])-C*n[0]),f+=h*(-95*(o[1]-l[1])-C*n[1]);else if(t.flyT>.2){let t=o[0],e=o[1]-.03,a=Math.hypot(t,e)||1;c+=t/a*7,f+=e/a*7}if(n[0]+=c*e,n[1]+=f*e,o[0]+=n[0]*e,o[1]+=n[1]*e,s){let t=.6*M[3]*h;n[3]+=(-t*(o[3]-l[3])-(1.6*Math.sqrt(.6*M[3])*h+1.1)*n[3])*e}else n[3]-=1.1*n[3]*e;o[3]+=n[3]*e,s||(l[2]=.26+.14*Math.abs(Math.sin(o[6])));let u=1-.7*h;l[4]=(0,i.clamp)(-(.06*n[1]),-.45,.45)*u,l[5]=(0,i.clamp)(.06*n[0],-.45,.45)*u,l[7]=0;for(let t=2;t<8;t++){if(3===t)continue;let a=2===t?240:M[t],r=2*(2===t?.9:w[t])*Math.sqrt(a);n[t]+=(-a*(o[t]-l[t])-r*n[t])*e,o[t]+=n[t]*e}}flight(t){let e=t.p,a=t.v,r=t.g;if(t.clearT<0){let e=!1;for(let a of this.cards)if(a!==t&&!a.hold&&function(t,e){let a=Math.cos(t.p[3]),r=Math.sin(t.p[3]),i=Math.cos(e.p[3]),o=Math.sin(e.p[3]),n=e.p[0]-t.p[0],l=e.p[1]-t.p[1];for(let t=0;t<4;t++){let e,s;0===t?(e=a,s=r):1===t?(e=-r,s=a):2===t?(e=i,s=o):(e=-o,s=i);let h=b*Math.abs(a*e+r*s)+.5*Math.abs(-r*e+a*s),c=b*Math.abs(i*e+o*s)+.5*Math.abs(-o*e+i*s);if(Math.abs(n*e+l*s)>h+c+.01)return!1}return!0}(t,a)){e=!0;break}(!e||t.flyT>1.4)&&(t.clearT=t.flyT,this.events|=4);return}let i=Math.hypot(e[0]-r[0],e[1]-r[1]);!t.landed&&i<.035&&t.flyT-t.clearT>.15&&(t.landed=!0,this.events|=8),i<.012&&.2>Math.hypot(a[0],a[1])&&.01>Math.abs(e[2]-r[2])&&t.flyT-t.clearT>.35&&(t.mode=0,t.landed||(t.landed=!0,this.events|=8))}sortDraw(){let t=this.drawOrder,e=this.cards;for(let a=1;a<t.length;a++){let r=t[a],i=e[r].p[2],o=a-1;for(;o>=0&&e[t[o]].p[2]>i;)t[o+1]=t[o],o--;t[o+1]=r}}}function F({size:t=16,className:a,children:r}){return(0,e.jsx)("svg",{width:t,height:t,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:a?`shrink-0 ${a}`:"shrink-0",children:(0,e.jsx)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:r})})}function B(t){return(0,e.jsxs)(F,{...t,children:[(0,e.jsx)("rect",{x:"2",y:"4.5",width:"7",height:"9.5",rx:"1.4"}),(0,e.jsx)("path",{d:"M11 4.5h1.6A1.4 1.4 0 0 1 14 5.9v6.7"}),(0,e.jsx)("path",{d:"M5.5 4.5V3.4A1.4 1.4 0 0 1 6.9 2h3.4"}),(0,e.jsx)("path",{d:"m8.8.9 1.5 1.1-1.5 1.1"})]})}function D(t){return(0,e.jsxs)(F,{...t,children:[(0,e.jsx)("rect",{x:"4.5",y:"2",width:"7",height:"12",rx:"1.4"}),(0,e.jsx)("path",{d:"M1.5 6.2a6.5 6.5 0 0 0 0 3.6"}),(0,e.jsx)("path",{d:"M14.5 6.2a6.5 6.5 0 0 1 0 3.6"})]})}var N=t.i(55171);let j=`#version 300 es
layout(location = 0) in vec2 aPos;
uniform mat4 uViewProj;
uniform mat4 uModel;
uniform float uBend;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vTanX;
out vec3 vTanY;
out vec2 vLocal;
void main() {
  // a gentle bow across the card (z = bend \xb7 x\xb2)
  vec3 p = vec3(aPos, uBend * aPos.x * aPos.x);
  vec3 n = normalize(vec3(-2.0 * uBend * aPos.x, 0.0, 1.0));
  vec3 tx = normalize(vec3(1.0, 0.0, 2.0 * uBend * aPos.x));
  mat3 r = mat3(uModel);
  vec4 world = uModel * vec4(p, 1.0);
  vWorld = world.xyz;
  vNormal = r * n;
  vTanX = r * tx;
  vTanY = r * vec3(0.0, 1.0, 0.0);
  vLocal = aPos;
  gl_Position = uViewProj * world;
}
`,q=`
float sdCard(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`,V=`#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vTanX;
in vec3 vTanY;
in vec2 vLocal;
out vec4 outColor;

uniform sampler2DArray uPrint;
uniform sampler2DArray uMask;
uniform vec2 uTexel;
uniform float uLayer;
uniform float uBackLayer;
uniform int uPattern;
uniform float uPearl;
uniform vec2 uEmblem;      // card-local, front face
uniform vec2 uEmblemBack;  // card-local, back face
uniform float uLatticeCell;
uniform vec2 uHalf;
uniform float uRadius;
uniform vec3 uEye;
uniform vec3 uLight;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec3 uEnvTop;
uniform vec3 uEnvBottom;
uniform vec3 uSky;
uniform float uFoilGain;
uniform float uSparkle;
uniform float uEmboss;
uniform int uSelf;
uniform vec3 uCardC[3];
uniform vec3 uCardX[3];
uniform vec3 uCardY[3];
uniform vec3 uCardN[3];

${q}

// CIE 1931 colour matching, multi-lobe Gaussian fit (Wyman, Sloan & Shirley 2013)
float lobe(float x, float mu, float s1, float s2) {
  float t = (x - mu) / (x < mu ? s1 : s2);
  return exp(-0.5 * t * t);
}
vec3 spectral(float l) {
  float X = 1.056 * lobe(l, 599.8, 37.9, 31.0) + 0.362 * lobe(l, 442.0, 16.0, 26.7) - 0.065 * lobe(l, 501.1, 20.4, 26.2);
  float Y = 0.821 * lobe(l, 568.8, 46.9, 40.5) + 0.286 * lobe(l, 530.9, 16.3, 31.1);
  float Z = 1.217 * lobe(l, 437.0, 11.8, 36.0) + 0.681 * lobe(l, 459.0, 26.0, 13.8);
  vec3 rgb = vec3(
    3.2406 * X - 1.5372 * Y - 0.4986 * Z,
    -0.9689 * X + 1.8758 * Y + 0.0415 * Z,
    0.0557 * X - 0.2040 * Y + 1.0570 * Z);
  // out-of-gamut spectral hues: pull toward white a touch instead of clipping hard
  float lo = min(min(rgb.r, rgb.g), rgb.b);
  rgb -= min(lo, 0.0) * 0.35;
  return max(rgb, 0.0) * 0.6;
}

// orders 1–3 of a grating with period d (nm) across direction g, grooves along t
vec3 grating(vec3 h, vec3 g, vec3 t, float d, float sigma) {
  float u = abs(dot(h, g));
  float w = dot(h, t);
  float cone = exp(-w * w / (2.0 * sigma * sigma));
  float l = d * u;
  vec3 c = spectral(l) + spectral(l * 0.5) * 0.34 + spectral(l / 3.0) * 0.12;
  return c * cone;
}

// thin film (pearl): two-beam interference for a coat of thickness t (nm)
vec3 thinFilm(float cosV, float t) {
  float n = 1.42;
  float cosT = sqrt(max(0.0, 1.0 - (1.0 - cosV * cosV) / (n * n)));
  float opd = 2.0 * n * t * cosT;
  vec3 lambda = vec3(640.0, 545.0, 465.0);
  return 0.5 - 0.5 * cos(6.2831853 * opd / lambda);
}

const vec3 SOFTBOX = vec3(-0.5529, 0.6233, 0.5529);

float ggx(float ndh, float a) {
  float a2 = a * a;
  float d = ndh * ndh * (a2 - 1.0) + 1.0;
  return a2 / (3.14159 * d * d);
}

// the other cards' shadows on this one (soft, widening with the gap)
float cardShadow(vec3 p, vec3 dir, float maxT, float soft0, float softK, float strength) {
  float lit = 1.0;
  for (int i = 0; i < 3; i++) {
    if (i == uSelf) continue;
    vec3 n = uCardN[i];
    float denom = dot(dir, n);
    if (abs(denom) < 1e-3) continue;
    float t = dot(uCardC[i] - p, n) / denom;
    if (t <= 0.003 || t > maxT) continue;
    vec3 h = p + dir * t - uCardC[i];
    vec2 q = vec2(dot(h, uCardX[i]), dot(h, uCardY[i]));
    float d = sdCard(q, uHalf, uRadius);
    float w = soft0 + softK * t;
    lit *= 1.0 - strength * (1.0 - smoothstep(-w, w, d)) * smoothstep(0.04, 0.35, abs(denom));
  }
  return lit;
}

void main() {
  float dist = sdCard(vLocal, uHalf, uRadius);
  float aa = max(fwidth(dist), 1e-5);
  float cover = clamp(0.5 - dist / aa, 0.0, 1.0);
  if (cover <= 0.0) discard;

  bool front = gl_FrontFacing;
  vec2 lp = vLocal;
  vec3 N = normalize(vNormal);
  vec3 T = normalize(vTanX);
  vec3 B = normalize(vTanY);
  float layer = uLayer;
  int pattern = uPattern;
  vec2 emblem = uEmblem;
  float pearl = uPearl;
  if (!front) {
    N = -N;
    T = -T;
    lp.x = -lp.x;
    layer = uBackLayer;
    pattern = 3;
    emblem = uEmblemBack;
    pearl = 0.0;
  }
  vec2 uv = vec2(lp.x / (2.0 * uHalf.x) + 0.5, 0.5 - lp.y / (2.0 * uHalf.y));
  vec3 print = texture(uPrint, vec3(uv, layer)).rgb;
  vec4 mask = texture(uMask, vec3(uv, layer));

  // embossing: the height map's slope tilts the normal
  vec2 e = uTexel * 1.6;
  float hx = texture(uMask, vec3(uv + vec2(e.x, 0.0), layer)).g - texture(uMask, vec3(uv - vec2(e.x, 0.0), layer)).g;
  float hy = texture(uMask, vec3(uv - vec2(0.0, e.y), layer)).g - texture(uMask, vec3(uv + vec2(0.0, e.y), layer)).g;
  N = normalize(N - (T * hx + B * hy) * uEmboss);

  vec3 V = normalize(uEye - vWorld);
  vec3 toL = uLight - vWorld;
  float ld = length(toL);
  vec3 L = toL / ld;
  float atten = 1.6 / (1.0 + 0.16 * ld * ld);
  float lit = cardShadow(vWorld, L, ld, 0.003, 0.16, 0.82);
  // the cards just in front darken this one where they overlap (contact)
  float contact = cardShadow(vWorld, N, 0.5, 0.012, 0.55, 0.32);
  vec3 key = uLightColor * atten * lit;

  float ndl = max(dot(N, L), 0.0);
  float ndv = max(dot(N, V), 1e-3);
  vec3 H = normalize(L + V);
  float ndh = max(dot(N, H), 0.0);
  vec3 R = reflect(-V, N);
  // a studio: a dark room, brighter toward the ceiling, a big softbox up
  // to the left and a thin strip light on the right
  vec3 env = uEnvBottom + uEnvTop * 0.38 * smoothstep(0.05, 0.95, R.y);
  env += uEnvTop * 0.85 * smoothstep(0.7, 0.93, dot(R, SOFTBOX));
  env += uEnvTop * 0.55 * smoothstep(0.93, 0.985, dot(R, normalize(vec3(0.82, 0.1, 0.56))));
  float fresnel = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);

  // ink on paper (or on the pearl coat)
  vec3 paper = print * (uAmbient * contact + key * ndl * 0.9);
  if (pearl > 0.0) {
    float thick = 330.0 + 120.0 * sin(lp.x * 7.0 + lp.y * 5.0) + 60.0 * sin(lp.y * 17.0 - lp.x * 4.0);
    vec3 film = thinFilm(ndv, thick);
    paper *= mix(vec3(1.0), 0.84 + 0.34 * film, 0.55 * pearl);
  }
  // satin varnish: a soft highlight where the lamp reflects, the room at grazing angles
  paper += key * ggx(ndh, 0.22) * 0.012 + env * fresnel * 0.3 * contact;

  // the foil
  float secondary = mask.b;
  float foilAmt = max(mask.r, secondary);
  vec3 col = paper;
  if (foilAmt > 0.002) {
    vec2 g2;
    float period;
    float sigma;
    if (secondary > 0.5) {
      vec2 q = lp - emblem;
      g2 = q / max(length(q), 1e-4);
      period = 1050.0;
      sigma = 0.26;
    } else if (pattern == 0) {
      vec2 q = lp - emblem;
      vec2 radial = q / max(length(q), 1e-4);
      g2 = vec2(-radial.y, radial.x);
      float sector = floor((atan(q.y, q.x) / 6.2831853 + 0.5) * 72.0);
      period = 940.0 * (0.92 + 0.16 * hash12(vec2(sector, 7.0)));
      sigma = 0.3;
    } else if (pattern == 1) {
      vec2 r = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678) * (lp - emblem);
      vec2 cell = floor(r / uLatticeCell);
      // each tile its own grating, drifting in angle across the mosaic so
      // neighbours are related: colour moves through it in waves
      vec2 c = (cell + 0.5) * uLatticeCell;
      float a = 0.9 * sin(c.x * 5.0 + 0.6) + 0.7 * sin(c.y * 4.0 - 0.3) + (hash12(cell) - 0.5) * 0.7;
      g2 = vec2(cos(a), sin(a));
      period = 900.0 * (0.9 + 0.2 * hash12(cell + 17.0));
      sigma = 0.24;
    } else if (pattern == 2) {
      float a = 0.6 + 0.5 * sin(lp.y * 8.0 + 2.3 * sin(lp.x * 5.5 + lp.y * 2.0));
      g2 = vec2(cos(a), sin(a));
      period = 960.0;
      sigma = 0.3;
    } else {
      float a = 1.15 + lp.y * 0.9 + 0.25 * sin(lp.x * 4.0);
      g2 = vec2(cos(a), sin(a));
      period = 1000.0;
      sigma = 0.26;
    }
    vec3 g = normalize(T * g2.x + B * g2.y);
    vec3 t = normalize(cross(N, g));
    vec3 sky = normalize(vec3(-0.25, 0.9, 0.35));
    vec3 rainbow = grating(L + V, g, t, period, sigma) * key * uFoilGain;
    rainbow += grating(sky + V, g, t, period, 0.34) * uSky * contact * uFoilGain;
    // the softbox diffracts too: colour fringes round its reflection
    rainbow += grating(SOFTBOX + V, g, t, period, 0.3) * uEnvTop * 0.45 * contact * uFoilGain;
    vec3 metal = env * 0.55 * contact + key * ggx(ndh, 0.1) * 0.06;
    vec3 foil = (metal + rainbow) * print;

    // micro-facets glinting as the angle passes
    if (uSparkle > 0.0) {
      vec2 q = lp * 240.0;
      vec2 cell = floor(q);
      vec2 f = fract(q) - 0.5;
      float h = hash12(cell);
      if (h < 0.45) {
        vec2 j = vec2(hash12(cell + 3.7), hash12(cell + 9.1)) - 0.5;
        vec3 fn = normalize(N + (T * j.x + B * j.y) * 1.1);
        float r = max(dot(reflect(-L, fn), V), 0.0);
        float lod = clamp(1.6 - fwidth(q.x) * 1.4, 0.0, 1.0);
        float shape = smoothstep(0.42, 0.08, length(f - j * 0.25));
        foil += key * pow(r, 700.0) * 7.0 * shape * lod * uSparkle * lit;
      }
    }
    col = mix(paper, foil, foilAmt);
  }

  // the cut edge catches the light
  float edge = 1.0 - smoothstep(0.0, 2.2 * aa, -dist);
  col += edge * (uAmbient * 0.06 + key * 0.1 * (0.3 + 0.7 * ndl));

  // a soft filmic shoulder, then sRGB
  vec3 x = max(col, 0.0);
  vec3 over = max(x - 0.72, 0.0);
  x = min(x, 0.72) + 0.28 * (1.0 - exp(-over / 0.28));
  vec3 srgb = mix(x * 12.92, 1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, x));
  srgb += (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(srgb * cover, cover);
}
`,X=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec4 uCam;       // cx, cy (device px, y down), F (device px per unit at z = 0 \xd7 eye distance), eye distance
uniform vec2 uCanvas;    // device px
uniform float uEyeY;
uniform float uBackZ;
uniform vec3 uLight;
uniform vec3 uCardC[3];
uniform vec3 uCardX[3];
uniform vec3 uCardY[3];
uniform vec3 uCardN[3];
uniform vec2 uHalf;
uniform float uRadius;
uniform vec4 uShade;     // key shadow, contact shadow, pool strength, unused
uniform vec3 uPool;

${q}

float shadowOf(int i, vec3 p, vec3 dir, float soft0, float softK) {
  vec3 n = uCardN[i];
  float denom = dot(dir, n);
  if (abs(denom) < 1e-3) return 0.0;
  float t = dot(uCardC[i] - p, n) / denom;
  if (t <= 0.0) return 0.0;
  vec3 h = p + dir * t - uCardC[i];
  vec2 q = vec2(dot(h, uCardX[i]), dot(h, uCardY[i]));
  float d = sdCard(q, uHalf, uRadius);
  float w = soft0 + softK * t;
  // lighter the further the card floats, and a card edge-on to the light
  // (turning over) throws only a faint sliver
  return (1.0 - smoothstep(-w, w, d)) / (1.0 + 1.6 * t) * smoothstep(0.04, 0.35, abs(denom));
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y);
  float k = (uCam.w - uBackZ) / uCam.z;
  vec3 p = vec3((frag.x - uCam.x) * k, uEyeY + (uCam.y - frag.y) * k, uBackZ);
  vec3 toL = normalize(uLight - p);
  float keyLit = 1.0;
  float contactLit = 1.0;
  for (int i = 0; i < 3; i++) {
    keyLit *= 1.0 - shadowOf(i, p, toL, 0.03, 0.2);
    contactLit *= 1.0 - shadowOf(i, p, vec3(0.0, 0.0, 1.0), 0.05, 0.42);
  }
  float a = 1.0 - (1.0 - (1.0 - keyLit) * uShade.x) * (1.0 - (1.0 - contactLit) * uShade.y);
  // the lamp's pool on the stage (night)
  vec2 lp = p.xy - uLight.xy * 0.55;
  float pool = exp(-dot(lp, lp) / 1.6) * uShade.z * keyLit;
  float n = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
  a = clamp(a + n, 0.0, 1.0);
  outColor = vec4(uPool * (pool + n) * (1.0 - a), a);
}
`,G=[.5,.5,.52],I=[1,.98,.95],O=[.9,.9,.93],Y=[.1,.1,.106],z=[.34,.34,.35],U=[0,0,0],W=[.15,.145,.14],H=[1.2,1.12,1],$=[.42,.39,.37],K=[.012,.012,.013],Z=[.1,.095,.09],Q=[1,.86,.68];function J(t,e){let a=(e,a,r)=>{r[0]=e[0]+(a[0]-e[0])*t,r[1]=e[1]+(a[1]-e[1])*t,r[2]=e[2]+(a[2]-e[2])*t};return a(G,W,e.ambient),a(I,H,e.light),a(O,$,e.envTop),a(Y,K,e.envBottom),a(z,Z,e.sky),a(U,Q,e.poolColor),e.foilGain=2.1+.19999999999999973*t,e.shadow=.36+.19000000000000006*t,e.contact=.24+.16000000000000003*t,e.pool=0+.075*t,e}let tt=(t,e)=>[(t/63-.5)*x,(.5-e/88)*1];class te{gl;cardProgram;backProgram;uc;ub;cardVao;emptyVao;buffers=[];indexCount;print=null;mask=null;texW=0;texH=0;aniso;anisoExt;sc=new Float32Array(9);sx=new Float32Array(9);sy=new Float32Array(9);sn=new Float32Array(9);emblems;emblemBack;constructor(t,e){this.gl=t,this.cardProgram=(0,N.createProgram)(t,j,V),this.backProgram=(0,N.createProgram)(t,N.FULLSCREEN_VERTEX,X),this.uc=(0,N.uniformLocations)(t,this.cardProgram),this.ub=(0,N.uniformLocations)(t,this.backProgram);const a=new Float32Array((e+1)*4);for(let t=0;t<=e;t++){const r=(t/e-.5)*x;a.set([r,-.5,r,.5],4*t)}const r=new Uint16Array(6*e);for(let t=0;t<e;t++){const e=2*t;r.set([e,e+2,e+1,e+1,e+2,e+3],6*t)}this.indexCount=r.length;const i=t.createVertexArray(),o=t.createBuffer(),n=t.createBuffer();if(!i||!o||!n)throw Error("holo-cards: could not create buffers");t.bindVertexArray(i),t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,a,t.STATIC_DRAW),t.enableVertexAttribArray(0),t.vertexAttribPointer(0,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,n),t.bufferData(t.ELEMENT_ARRAY_BUFFER,r,t.STATIC_DRAW),t.bindVertexArray(null),this.cardVao=i,this.buffers.push(o,n);const l=t.createVertexArray();if(!l)throw Error("holo-cards: could not create a vertex array");this.emptyVao=l,this.anisoExt=t.getExtension("EXT_texture_filter_anisotropic"),this.aniso=this.anisoExt?Math.min(8,t.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)):0,this.emblems=s.slice(0,3).map(([t,e])=>tt(t,e)),this.emblemBack=tt(s[3][0],s[3][1])}allocate(t,e){if(this.print&&t===this.texW&&e===this.texH)return;let a=this.gl;this.print&&a.deleteTexture(this.print),this.mask&&a.deleteTexture(this.mask);let r=Math.floor(Math.log2(Math.max(t,e)))+1,i=i=>{let o=a.createTexture();if(!o)throw Error("holo-cards: could not create a texture");return a.bindTexture(a.TEXTURE_2D_ARRAY,o),a.texStorage3D(a.TEXTURE_2D_ARRAY,r,i,t,e,4),a.texParameteri(a.TEXTURE_2D_ARRAY,a.TEXTURE_MIN_FILTER,a.LINEAR_MIPMAP_LINEAR),a.texParameteri(a.TEXTURE_2D_ARRAY,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D_ARRAY,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D_ARRAY,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),this.anisoExt&&this.aniso>1&&a.texParameterf(a.TEXTURE_2D_ARRAY,this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT,this.aniso),o};this.print=i(a.SRGB8_ALPHA8),this.mask=i(a.RGBA8),this.texW=t,this.texH=e}uploadLayer(t,e,a){let r=this.gl;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,!1),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,r.NONE),r.bindTexture(r.TEXTURE_2D_ARRAY,this.print),r.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,t,this.texW,this.texH,1,r.RGBA,r.UNSIGNED_BYTE,e),r.bindTexture(r.TEXTURE_2D_ARRAY,this.mask),r.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,t,this.texW,this.texH,1,r.RGBA,r.UNSIGNED_BYTE,a)}finishArt(){let t=this.gl;for(let e of[this.print,this.mask])t.bindTexture(t.TEXTURE_2D_ARRAY,e),t.generateMipmap(t.TEXTURE_2D_ARRAY);t.bindTexture(t.TEXTURE_2D_ARRAY,null)}get hasArt(){return null!==this.print}draw(t){let e=this.gl,a=e.canvas,{view:r,dpr:i,cards:o,look:n,light:s}=t;e.viewport(0,0,a.width,a.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.disable(e.DEPTH_TEST),e.disable(e.CULL_FACE),e.enable(e.BLEND),e.blendFunc(e.ONE,e.ONE_MINUS_SRC_ALPHA);for(let t=0;t<3;t++){let e=o[t],a=e.axes,r=e.p[7]*x*x*(1/12);this.sc[3*t]=e.x+a[6]*r,this.sc[3*t+1]=e.y+a[7]*r,this.sc[3*t+2]=e.z+a[8]*r;for(let e=0;e<3;e++)this.sx[3*t+e]=a[e],this.sy[3*t+e]=a[3+e],this.sn[3*t+e]=a[6+e]}let h=this.ub;if(e.useProgram(this.backProgram),e.uniform4f(h("uCam"),r.cx*i,r.cy*i,r.scale*r.depth*i,r.depth),e.uniform2f(h("uCanvas"),a.width,a.height),e.uniform1f(h("uEyeY"),r.yc),e.uniform1f(h("uBackZ"),-.42),e.uniform3fv(h("uLight"),s),e.uniform3fv(h("uCardC"),this.sc),e.uniform3fv(h("uCardX"),this.sx),e.uniform3fv(h("uCardY"),this.sy),e.uniform3fv(h("uCardN"),this.sn),e.uniform2f(h("uHalf"),x/2,.5),e.uniform1f(h("uRadius"),y),e.uniform4f(h("uShade"),n.shadow,n.contact,n.pool,0),e.uniform3fv(h("uPool"),n.poolColor),(0,N.drawFullscreen)(e,this.emptyVao),!this.print||!this.mask)return;let c=this.uc;for(let a of(e.useProgram(this.cardProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D_ARRAY,this.print),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D_ARRAY,this.mask),e.uniform1i(c("uPrint"),0),e.uniform1i(c("uMask"),1),e.uniform2f(c("uTexel"),1/this.texW,1/this.texH),e.uniformMatrix4fv(c("uViewProj"),!1,r.viewProj),e.uniform3fv(c("uEye"),r.eye),e.uniform3fv(c("uLight"),s),e.uniform3fv(c("uLightColor"),n.light),e.uniform3fv(c("uAmbient"),n.ambient),e.uniform3fv(c("uEnvTop"),n.envTop),e.uniform3fv(c("uEnvBottom"),n.envBottom),e.uniform3fv(c("uSky"),n.sky),e.uniform1f(c("uFoilGain"),n.foilGain),e.uniform1f(c("uSparkle"),t.sparkle),e.uniform1f(c("uEmboss"),2.2*(this.texW/640)),e.uniform2f(c("uHalf"),x/2,.5),e.uniform1f(c("uRadius"),y),e.uniform1f(c("uBackLayer"),3),e.uniform2f(c("uEmblemBack"),this.emblemBack[0],this.emblemBack[1]),e.uniform1f(c("uLatticeCell"),.04772727272727273),e.uniform3fv(c("uCardC"),this.sc),e.uniform3fv(c("uCardX"),this.sx),e.uniform3fv(c("uCardY"),this.sy),e.uniform3fv(c("uCardN"),this.sn),e.bindVertexArray(this.cardVao),t.drawOrder)){let t=o[a],r=l[a];e.uniformMatrix4fv(c("uModel"),!1,t.model),e.uniform1f(c("uBend"),t.p[7]),e.uniform1f(c("uLayer"),a),e.uniform1i(c("uPattern"),r.pattern),e.uniform1f(c("uPearl"),r.pearl),e.uniform2f(c("uEmblem"),this.emblems[a][0],this.emblems[a][1]),e.uniform1i(c("uSelf"),a),e.drawElements(e.TRIANGLES,this.indexCount,e.UNSIGNED_SHORT,0)}e.bindVertexArray(null)}dispose(){let t=this.gl;for(let e of(t.deleteProgram(this.cardProgram),t.deleteProgram(this.backProgram),t.deleteVertexArray(this.cardVao),t.deleteVertexArray(this.emptyVao),this.buffers))t.deleteBuffer(e);this.print&&t.deleteTexture(this.print),this.mask&&t.deleteTexture(this.mask),this.print=this.mask=null}}function ta(){if((0,r.isMuted)())return null;let t=(0,r.ensureAudio)();return t&&"closed"!==t.ctx.state?t:null}let tr=t=>1+(2*Math.random()-1)*t;function ti(t,e,a){if("function"!=typeof t.createStereoPanner)return e;let r=t.createStereoPanner();return r.pan.value=Math.max(-1,Math.min(1,a)),r.connect(e),r}function to(t,e,a,i){let{ctx:o}=t,n=o.createBufferSource();n.buffer=(0,r.noiseBuffer)(o,1);let l=o.createBiquadFilter();l.type=i.type,l.frequency.setValueAtTime(i.freq,e),i.to&&l.frequency.exponentialRampToValueAtTime(i.to,e+.85*i.decay),l.Q.value=i.q;let s=o.createGain();s.gain.setValueAtTime(0,e),s.gain.linearRampToValueAtTime(i.gain,e+i.attack),s.gain.exponentialRampToValueAtTime(1e-4,e+i.attack+i.decay),n.connect(l).connect(s).connect(a),n.start(e,.5*Math.random(),i.attack+i.decay+.03)}function tn(t,e,a,r,i,o){let{ctx:n}=t,l=n.createOscillator();l.type="sine",l.frequency.setValueAtTime(1.5*r,e),l.frequency.exponentialRampToValueAtTime(r,e+.03);let s=n.createGain();s.gain.setValueAtTime(0,e),s.gain.linearRampToValueAtTime(i,e+.003),s.gain.exponentialRampToValueAtTime(1e-4,e+o),l.connect(s).connect(a),l.start(e),l.stop(e+o+.02)}let tl=x/2;class ts{width=1;height=1;cx=.5;cy=.5;scale=100;depth=3.3;yc=0;viewProj=new Float32Array(16);eye=new Float32Array(3);version=0;set(t,e,a,r,i,o){if(t===this.width&&e===this.height&&1e-4>Math.abs(a-this.cx)&&1e-4>Math.abs(r-this.cy)&&1e-4>Math.abs(i-this.scale)&&1e-6>Math.abs(o-this.yc))return;this.width=Math.max(1,t),this.height=Math.max(1,e),this.cx=a,this.cy=r,this.scale=i,this.yc=o,this.version++;let n=this.depth,l=i*n,s=this.width,h=this.height,c=2*a/s-1,f=1-2*r/h,d=this.viewProj;d[0]=2*l/s,d[1]=0,d[2]=0,d[3]=0,d[4]=0,d[5]=2*l/h,d[6]=0,d[7]=0,d[8]=-c,d[9]=-f,d[10]=-.05,d[11]=-1,d[12]=c*n,d[13]=f*n-2*l/h*o,d[14]=0,d[15]=n,this.eye[0]=0,this.eye[1]=o,this.eye[2]=n}project(t,e,a,r){let i=this.depth-a;if(i<=1e-4)return!1;let o=this.scale*this.depth/i;return r[0]=this.cx+t*o,r[1]=this.cy-(e-this.yc)*o,!0}unproject(t,e,a,r){let i=(this.depth-a)/(this.scale*this.depth);r[0]=(t-this.cx)*i,r[1]=this.yc+(this.cy-e)*i}hitCard(t,e,a,r){let i=this.depth,o=(t-this.cx)/this.scale,n=(this.cy-e)/this.scale,l=-i,s=this.yc,h=a.axes,c=h[6],f=h[7],d=h[8],u=o*c+n*f+l*d;if(1e-6>Math.abs(u))return 1/0;let m=((a.x-0)*c+(a.y-s)*f+(a.z-i)*d)/u;if(m<=0)return 1/0;let p=0+o*m-a.x,g=s+n*m-a.y,v=i+l*m-a.z;return r[0]=p*h[0]+g*h[1]+v*h[2],r[1]=p*h[3]+g*h[4]+v*h[5],m}projectLocal(t,e,a,r){let i=t.axes;return this.project(t.x+i[0]*e+i[3]*a,t.y+i[1]*e+i[4]*a,t.z+i[2]*e+i[5]*a,r)}}let th=new Float64Array(2),tc=new Float64Array(8);function tf(t,e,a,r){let i,o,n,l,s,h,c,f,d=[-1,1,1,1,1,-1,-1,-1];for(let a=0;a<4;a++){if(!t.projectLocal(e,d[2*a]*tl,.5*d[2*a+1],th))return null;tc[2*a]=th[0],tc[2*a+1]=th[1]}let[u,m,p,g,v,x,y,b]=tc,k=p-v,T=y-v,M=u-p+v-y,w=g-x,A=b-x,R=m-g+x-b;if(1e-9>Math.abs(M)&&1e-9>Math.abs(R))i=p-u,o=y-u,n=u,l=g-m,s=b-m,h=m,c=0,f=0;else{let t=k*A-T*w;if(1e-9>Math.abs(t))return null;c=(M*A-T*R)/t,f=(k*R-M*w)/t,i=p-u+c*p,o=y-u+f*y,n=u,l=g-m+c*g,s=b-m+f*b,h=m}i/=a,l/=a,c/=a,o/=r,s/=r,f/=r;let E=t=>1e-12>Math.abs(t)?"0":t.toPrecision(7);return`matrix3d(${E(i)},${E(l)},0,${E(c)},${E(o)},${E(s)},0,${E(f)},0,0,1,0,${E(n)},${E(h)},0,1)`}let td=[2,1.5,1.2],tu={light:[-.8,1.15,1.9],dark:[-.7,1.05,1.55]},tm=[{value:"stack",label:"Stack",icon:(0,e.jsx)(function(t){return(0,e.jsxs)(F,{...t,children:[(0,e.jsx)("rect",{x:"4",y:"4",width:"8",height:"10.5",rx:"1.6"}),(0,e.jsx)("path",{d:"M5.6 1.75h4.8"})]})},{size:15})},{value:"fan",label:"Fan",icon:(0,e.jsx)(function(t){return(0,e.jsxs)(F,{...t,children:[(0,e.jsx)("rect",{x:"5",y:"2",width:"6",height:"9",rx:"1.3"}),(0,e.jsx)("path",{d:"M4.1 3.9 2.3 4.4a1.2 1.2 0 0 0-.8 1.5l1.9 6.4"}),(0,e.jsx)("path",{d:"M11.9 3.9l1.8.5a1.2 1.2 0 0 1 .8 1.5l-1.9 6.4"})]})},{size:15})}];function tp({stage:t}){return(0,e.jsx)("div",{role:t?"img":void 0,"aria-label":t?"Three holographic cards in a stack":void 0,"aria-hidden":!t||void 0,className:"absolute inset-0 grid place-items-center",children:(0,e.jsx)("div",{className:"relative h-[min(64%,380px)] aspect-[63/88]",children:[{bg:"linear-gradient(160deg,#1c1d23,#0e0f12)",foil:"conic-gradient(from 200deg at 50% 38%,#f6a5c0,#f7e08a,#9ee6b8,#8fc8f7,#c6a3f5,#f6a5c0)",rot:5},{bg:"linear-gradient(160deg,#f5f2ec,#e8e3da)",foil:"linear-gradient(135deg,#d8f1ff,#f8d9ef,#fff3c9,#d9fbe8)",rot:-4},{bg:"linear-gradient(160deg,#f4f5f8,#c9ccd4)",foil:"linear-gradient(120deg,#e6e9f2,#cfe7ff,#f3d6f3,#e6e9f2)",rot:0}].map((t,a)=>(0,e.jsx)("div",{className:"absolute inset-0 overflow-hidden rounded-[5%/3.6%] shadow-[0_14px_30px_-14px_rgb(0_0_0/0.45)]",style:{background:t.bg,rotate:`${t.rot}deg`,translate:`0 ${-((2-a)*3)}%`},children:(0,e.jsx)("div",{className:"absolute inset-[7%_7%_30%] rounded-[4%] opacity-80",style:{background:t.foil}})},a))})})}t.s(["default",0,function({mode:t,active:n,reducedMotion:s,theme:h}){let c="stage"===t,[f]=(0,a.useState)(()=>{let t=new L;return t.reduced=s,c&&!s&&t.deal(),t}),[d]=(0,a.useState)(()=>new ts),[u]=(0,a.useState)(()=>{let t;return t=tu[h],{theme:h,reduced:s,night:+("dark"===h),look:J(+("dark"===h),{ambient:[0,0,0],light:[0,0,0],envTop:[0,0,0],envBottom:[0,0,0],sky:[0,0,0],foilGain:0,shadow:0,contact:0,pool:0,poolColor:[0,0,0]}),light:new Float64Array(t),lightV:new Float64Array(3),lightGoal:new Float64Array(t),lightWorld:new Float32Array(3),hover:!1,hx:0,hy:0,keyAim:!1,kx:0,ky:0,orient:{has:!1,beta:0,gamma:0,baseB:0,baseG:0,lastX:0,lastY:0},drag:null,st:new Float64Array(16),sx:new Float64Array(16),sy:new Float64Array(16),sn:0,pvx:0,pvy:0,rect:new Float64Array(4),fitDirty:!0,ext:new Float64Array(4),slot:new Float64Array(4),hit:new Float64Array(2),tmp:new Float64Array(2),lastInput:performance.now()/1e3,drift:+!s,time:0,acc:0,perf:{time:0,slow:0,step:0},audio:!1,throwDir:1,pressedAt:-1/0,placed:["","","",""],placedZ:[-1,-1,-1],ring:!1,ringPath:"",frontShown:-1,fanShown:!1,flippedShown:[!1,!1,!1],frame:null}}),m=(0,a.useRef)(null),p=(0,a.useRef)(null),g=(0,a.useRef)(!1),b=(0,a.useRef)(null),k=(0,a.useRef)(null),T=(0,a.useRef)([]),M=(0,a.useRef)(null),w=(0,a.useRef)(null),A=(0,a.useRef)(null),R=(0,a.useId)(),E=(0,i.useFinePointer)(),[P,C]=(0,a.useState)("stack"),[S,_]=(0,a.useState)(0),[F,N]=(0,a.useState)(""),[j,q]=(0,a.useState)(!1),[V,X]=(0,a.useState)(0),[G,I]=(0,a.useState)(!1),O=(0,a.useCallback)(()=>{let{width:t,height:e}=K.current,a=u.rect;if(c){let r=t<520,i=e-16,o=b.current,n=k.current?.querySelector("[data-lab-controls]");if(o&&n){let t=n.getBoundingClientRect().top-o.getBoundingClientRect().top;t>0&&(i=Math.min(i,t))}a[0]=r?14:40,a[1]=r?20:34,a[2]=t-a[0],a[3]=i-(r?14:22),f.fanAngle=t/Math.max(1,e)<1.05?.2:.27}else a[0]=.12*t,a[1]=.1*e,a[2]=.88*t,a[3]=.9*e;u.fitDirty=!1},[c]),Y=(t,e)=>{let a=f.drawOrder;for(let r=a.length-1;r>=0;r--){let i=f.cards[a[r]];if(!i.hold&&d.hitCard(t,e,i,u.hit)<1/0&&.006>function(t,e,a=0){let r=Math.abs(t)-(tl-a)+y,i=Math.abs(e)-(.5-a)+y;return Math.hypot(Math.max(r,0),Math.max(i,0))+Math.min(Math.max(r,i),0)-y}(u.hit[0],u.hit[1]))return i.id}return -1},z=(t,e,a)=>(d.unproject(t,e,a,u.tmp),u.tmp),U=(0,i.useFrame)(n,t=>{let e=m.current,{width:a,height:r}=K.current;if(!e||a<2||r<2||!u.frame)return!1;let o=u.reduced,n=performance.now()/1e3,s=n-u.lastInput,h=c&&!u.drag&&s>2.5&&f.introT<0;if(!c||h){if(u.acc+=t,u.acc<1/30-.002)return;t=Math.min(.1,u.acc),u.acc=0}else u.acc=0;if(c&&!h&&u.perf.step<td.length-1){let e=u.perf;e.time+=t,t>1/40&&(e.slow+=t),e.time>=1.6&&(e.slow>.7*e.time&&(e.step+=1,X(e.step)),e.time=0,e.slow=0)}u.fitDirty&&O(),u.time+=t,f.reduced=o;let p=o?0:+(!c||s<14);if(u.drift=o?0:(0,i.damp)(u.drift,p,p?2:.6,t),.003>Math.abs(u.drift-p)&&(u.drift=p),o||u.drag||!u.hover)o||u.drag||!u.keyAim?f.aimOn=!1:(f.aimCard=f.order[0],f.aimOn=!0,f.aimX=u.kx,f.aimY=u.ky);else{var g,v;let t,e,a,r,o,n,l=Y(u.hx,u.hy);f.aimCard=l,f.aimOn=l>=0,l>=0&&(g=u.hx,v=u.hy,a=(e=z(g,v,(t=f.cards[l]).z))[0]-t.x,r=e[1]-t.y,o=Math.cos(t.p[3]),n=Math.sin(t.p[3]),f.aimX=(0,i.clamp)((o*a+n*r)/(x/2),-1,1),f.aimY=(0,i.clamp)((-n*a+o*r)/.5,-1,1))}c?u.orient.has&&!o?(f.extraTy=.05*(0,i.clamp)((u.orient.gamma-u.orient.baseG)/22,-1,1),f.extraTx=.04*(0,i.clamp)((u.orient.beta-u.orient.baseB)/22,-1,1)):f.extraTx=f.extraTy=0:o||(f.extraTy=.11*Math.sin(.47*u.time),f.extraTx=.06*Math.sin(.33*u.time+.6),f.auto(t));let b=u.drag;if(b?.kind==="card"){let e=f.cards[b.card],a=u.sn-1&15;if(n-u.st[a]>.045){let e=Math.exp(-t/.035);u.pvx*=e,u.pvy*=e}let r=z(u.sx[a],u.sy[a],e.z),i=(d.depth-e.z)/(d.scale*d.depth);f.drag(r[0],r[1],u.pvx*i,-u.pvy*i)}let k=f.step(t);(()=>{let t=f.events;if(f.events=0,!c)return;let e=u.audio,a=t=>(0,i.clamp)(f.cards[t].x/1.4,-1,1),r=f.order[2];e&&(2&t&&function(t,e=0){let a=ta();if(!a)return;let r=Math.max(0,Math.min(1,(t-1)/6)),i=a.ctx.currentTime+.004,o=ti(a.ctx,a.output,e);to(a,i,o,{type:"bandpass",freq:520*tr(.08),to:(1700+1500*r)*tr(.08),q:.9,gain:.08+.16*r,attack:.035,decay:.26+.1*r}),to(a,i+.01,o,{type:"highpass",freq:4200,q:.5,gain:.025+.04*r,attack:.02,decay:.12})}(f.throwSpeed,a(r)),4&t&&function(t=0){let e=ta();if(!e)return;let a=e.ctx.currentTime+.004,r=ti(e.ctx,e.output,.6*t);to(e,a,r,{type:"bandpass",freq:1500*tr(.1),to:900,q:1.1,gain:.05,attack:.03,decay:.16})}(a(r)),8&t&&function(t=0){let e=ta();if(!e)return;let a=e.ctx.currentTime+.003,r=ti(e.ctx,e.output,.5*t);to(e,a,r,{type:"bandpass",freq:1900*tr(.12),q:1.2,gain:.07,attack:.001,decay:.04}),tn(e,a,r,150*tr(.06),.09,.07)}(a(r)),32&t&&function(t=0){let e=ta();if(!e)return;let a=e.ctx.currentTime+.002,r=ti(e.ctx,e.output,.5*t);to(e,a,r,{type:"highpass",freq:2400*tr(.1),q:.8,gain:.06,attack:.001,decay:.03}),tn(e,a,r,210*tr(.05),.05,.05)}(a(f.order[0])),64&t&&function(t){let e=ta();if(!e)return;let a=e.ctx.currentTime+.01;for(let r=0;r<3;r++){let i=a+r*(.05+.012*Math.random()),o=t?(r-1)*.5:(1-r)*.5,n=ti(e.ctx,e.output,o);to(e,i,n,{type:"bandpass",freq:(t?2600+400*r:3400-400*r)*tr(.08),q:1.6,gain:.05,attack:.001,decay:.03})}to(e,a,e.output,{type:"bandpass",freq:1300,to:t?2e3:900,q:.8,gain:.03,attack:.04,decay:.16})}(1===f.fanGoal)),16&t&&e&&function(t=0){let e=ta();if(!e)return;let a=e.ctx.currentTime+.004,r=ti(e.ctx,e.output,t+.15);to(e,a,r,{type:"bandpass",freq:900*tr(.1),to:2600*tr(.1),q:1,gain:.08,attack:.025,decay:.15})}(a(f.order[0]));let o=f.order[0];130&t&&o!==u.frontShown&&(u.frontShown=o,_(o),N(`${l[o].name} is in front`));let n=1===f.fanGoal;if(n!==u.fanShown&&(u.fanShown=n,C(n?"fan":"stack"),f.introT<0&&N(n?"Fanned out":"Stacked")),32&t)for(let t of f.cards){let e=0>Math.cos(t.g[6]);e!==u.flippedShown[t.id]&&(u.flippedShown[t.id]=e,N(`${l[t.id].name}, ${e?"face down":"face up"}`))}})(),(()=>{let{width:t,height:e}=K.current,a=(0,i.clamp)(f.fan,0,1),r=u.ext;r[0]=r[2]=1/0,r[1]=r[3]=-1/0;for(let t=0;t<3;t++){f.slot(t,a,u.slot);let e=Math.cos(u.slot[3]),i=Math.sin(u.slot[3]);for(let t=0;t<4;t++){let a=(1&t?.5:-.5)*x,o=(2&t?.5:-.5)*1,n=u.slot[0]+e*a-i*o,l=u.slot[1]+i*a+e*o;n<r[0]&&(r[0]=n),n>r[1]&&(r[1]=n),l<r[2]&&(r[2]=l),l>r[3]&&(r[3]=l)}}let o=c?.07:.03,n=u.rect,l=r[1]-r[0]+2*o,s=r[3]-r[2]+2*o,h=Math.min((n[2]-n[0])/l,(n[3]-n[1])/s);c&&(h=Math.min(h,470)),h=Math.max(20,h);let m=(r[0]+r[1])/2,p=(r[2]+r[3])/2,g=(n[0]+n[2])/2-m*h,v=(n[1]+n[3])/2;d.set(t,e,g,v,h,p);let y=f.bounds,b=c?.2:.3,k=c?.3:.42;y[0]=-g/h+b,y[1]=(t-g)/h-b,y[2]=p+(v-e)/h+k,y[3]=p+v/h-k})();let R=(t=>{let e=tu[u.theme],a=u.lightGoal,r=u.reduced;a[0]=e[0],a[1]=e[1],a[2]=e[2];let o=60;if(f.introT>=0&&f.introT<1.7&&!r){let t=(0,i.clamp)((f.introT-.15)/1.35),e=t*t*(3-2*t);a[0]=-1.9+3.1*e,a[1]=.55+.35*Math.sin(e*Math.PI),a[2]=1.5,o=220}else if(u.drag?.kind==="card"||u.hover){let t=z(u.drag?u.sx[u.sn-1&15]:u.hx,u.drag?u.sy[u.sn-1&15]:u.hy,0);a[0]=(0,i.clamp)(1.3*t[0],-1.8,1.8),a[1]=(0,i.clamp)((t[1]-d.yc)*1.3+.12,-.45,1.5),a[2]=1.75,o=140}else if(u.keyAim)a[0]=1.5*u.kx,a[1]=1.1*u.ky+.15,a[2]=1.75,o=120;else if(u.orient.has){let r=u.orient,n=1-Math.exp(-t/6);r.baseB+=(r.beta-r.baseB)*n,r.baseG+=(r.gamma-r.baseG)*n,a[0]=.4*e[0]+1.1*(0,i.clamp)((r.gamma-r.baseG)/22,-1.3,1.3),a[1]=.6*e[1]+-.9*(0,i.clamp)((r.beta-r.baseB)/22,-1.3,1.3),o=90}else if(!r&&u.drift>0){let t=u.time;a[0]+=(.55*Math.sin(.29*t)+.18*Math.sin(.71*t+.4))*u.drift,a[1]+=.3*Math.sin(.41*t+1.3)*u.drift}let n=!1,l=2*Math.sqrt(o),s=Math.max(1,Math.ceil(240*t)),h=t/s;for(let t=0;t<3;t++){if(r){u.light[t]=a[t],u.lightV[t]=0;continue}for(let e=0;e<s;e++)u.lightV[t]+=(-o*(u.light[t]-a[t])-l*u.lightV[t])*h,u.light[t]+=u.lightV[t]*h;(Math.abs(u.light[t]-a[t])>1e-4||Math.abs(u.lightV[t])>.001)&&(n=!0)}return u.lightWorld[0]=u.light[0],u.lightWorld[1]=u.light[1]+d.yc,u.lightWorld[2]=u.light[2],n})(t),E=+("dark"===u.theme);u.night=o?E:(0,i.damp)(u.night,E,5,t),.002>Math.abs(u.night-E)&&(u.night=E),J(u.night,u.look);let P=u.frame;P.dpr=K.current.dpr,e.draw(P),(()=>{if(!c)return;let t=f.drawOrder;for(let e=0;e<t.length;e++){let a=t[e],r=T.current[a];if(!r)continue;let i=f.cards[a],o=(i.hold?null:tf(d,i,100*x,100))??"scale(0)";u.placed[a]!==o&&(u.placed[a]=o,r.style.transform=o),u.placedZ[a]!==e&&(u.placedZ[a]=e,r.style.zIndex=String(e+1))}let e=f.cards[f.order[0]],a=M.current;if(a){let t=e.hold||2===e.mode?"scale(0)":tf(d,e,100*x,100)??"scale(0)";u.placed[3]!==t&&(u.placed[3]=t,a.style.transform=t)}if(u.ring){let t=function(t,e){let a=5/Math.max(1,t.scale),r=tl+a,i=.5+a,o=y+a,n="",l=[[r-o,i-o,0],[r-o,-(i-o),-Math.PI/2],[-(r-o),-(i-o),-Math.PI],[-(r-o),i-o,Math.PI/2]];for(let a=0;a<4;a++){let[r,i,s]=l[a];for(let a=0;a<=6;a++){let l=s+Math.PI/2-a/6*(Math.PI/2);if(!t.projectLocal(e,r+Math.cos(l)*o,i+Math.sin(l)*o,th))return"";n+=`${n?"L":"M"}${th[0].toFixed(1)} ${th[1].toFixed(1)}`}}return n+"Z"}(d,e);t!==u.ringPath&&(u.ringPath=t,w.current?.setAttribute("d",t),A.current?.setAttribute("d",t))}})();let S=!k&&!R&&u.night===E&&!u.drag;if(c?S&&0===u.drift:o&&S)return!1}),W=(0,a.useCallback)(()=>{u.lastInput=performance.now()/1e3,U()},[U]),H=(0,a.useCallback)(()=>{let t=m.current;if(!t)return;p.current||(p.current=new v(c?640:320));let e=p.current;g.current=function(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!t||!document.fonts)return!0;return document.fonts.check(`600 20px ${t}`)&&document.fonts.check(`500 20px ${t}`)}catch{return!0}}();try{t.allocate(e.width,e.height);for(let a=0;a<4;a++){let{print:r,mask:i}=e.paint(a);t.uploadLayer(a,r,i)}t.finishArt()}catch(t){console.error(t)}},[c]),{canvasRef:$,sizeRef:K,supported:Z}=(0,i.useWebGL2)({mode:t,maxDpr:c?td[V]:1.5,attributes:{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:t=>{let e=null;try{e=new te(t,c?24:12)}catch(t){console.error(t);return}return m.current=e,H(),u.frame={view:d,dpr:1,cards:f.cards,drawOrder:f.drawOrder,light:u.lightWorld,look:u.look,sparkle:c?1:.6},u.placed.fill(""),u.placedZ.fill(-1),U(),()=>{e?.dispose(),m.current=null}},onResize:()=>{u.fitDirty=!0,U()}});(0,a.useEffect)(()=>{let t=!0;return(function(){try{let t=getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim();if(!t||!document.fonts)return Promise.resolve();return Promise.all([document.fonts.load(`500 20px ${t}`),document.fonts.load(`600 20px ${t}`)]).then(()=>void 0,()=>void 0)}catch{return Promise.resolve()}})().then(()=>{t&&!g.current&&(H(),U())}),()=>{t=!1}},[H,U]),(0,a.useEffect)(()=>{if(!c)return;let t=k.current?.querySelector("[data-lab-controls]");if(!t)return;let e=new ResizeObserver(()=>{u.fitDirty=!0,U()});return e.observe(t),()=>e.disconnect()},[c,U]),(0,a.useEffect)(()=>{u.theme=h,W()},[h]),(0,a.useEffect)(()=>{u.reduced=s,f.reduced=s,s&&(f.introT=-1,f.setFanNow(f.fanGoal),f.settle(),u.drift=0),W()},[s]),(0,a.useEffect)(()=>{n||(u.drag&&("card"===u.drag.kind?f.release(0,0):f.releaseFan(0),u.drag=null),u.hover=!1,b.current?.removeAttribute("data-grabbing"))},[n]);let Q=()=>"u">typeof DeviceOrientationEvent&&"function"==typeof DeviceOrientationEvent.requestPermission;(0,a.useEffect)(()=>{c&&"u">typeof DeviceOrientationEvent&&(Q()||I(!0))},[c]);let tt=()=>{G||!Q()||(0,DeviceOrientationEvent.requestPermission)().then(t=>{"granted"===t&&I(!0)}).catch(()=>{})};(0,a.useEffect)(()=>{if(!c||!n||!G||s)return;let t=u.orient,e=e=>{if(null==e.beta||null==e.gamma)return;t.has||(t.has=!0,t.baseB=e.beta,t.baseG=e.gamma),t.beta=e.beta,t.gamma=e.gamma;let a=t.gamma-t.baseG,r=t.beta-t.baseB;Math.abs(a-t.lastX)+Math.abs(r-t.lastY)>.4&&(t.lastX=a,t.lastY=r,W())};return window.addEventListener("deviceorientation",e),()=>{window.removeEventListener("deviceorientation",e),t.has=!1}},[c,n,G,s,W]);let tc=t=>{let e=b.current?.getBoundingClientRect();return e?[t.clientX-e.left,t.clientY-e.top]:[0,0]},tg=(t,e,a)=>{let r=a/1e3,i=u.sn-1&15;if(u.sn>0){let a=r-u.st[i];if(a>1e-4&&a<.25){let r=1-Math.exp(-a/.045);u.pvx+=((t-u.sx[i])/a-u.pvx)*r,u.pvy+=((e-u.sy[i])/a-u.pvy)*r}else a>=.25&&(u.pvx=u.pvy=0)}let o=15&u.sn;u.st[o]=r,u.sx[o]=t,u.sy[o]=e,u.sn++},tv=()=>{j||q(!0)},tx=t=>{let e=u.drag;if(!e||t.pointerId!==e.pointer)return;u.drag=null,b.current?.removeAttribute("data-grabbing");let a="pointerup"!==t.type,[r,i]=tc(t);a||tg(r,i,t.timeStamp);let o=u.tmp;if(a?o[0]=o[1]=0:(t=>{if(t[0]=t[1]=0,u.sn<2)return;let e=u.sn-1&15,a=u.sn-2&15;if(u.st[e]-u.st[a]>.07&&2>Math.hypot(u.sx[e]-u.sx[a],u.sy[e]-u.sy[a]))return;let r=e;for(let t=1;t<Math.min(u.sn,16);t++){let a=u.sn-1-t&15;if(u.st[e]-u.st[a]>.09)break;r=a}let i=u.st[e]-u.st[r];if(i<.012){t[0]=u.pvx,t[1]=u.pvy;return}t[0]=(u.sx[e]-u.sx[r])/i,t[1]=(u.sy[e]-u.sy[r])/i})(o),"fan"===e.kind){f.releaseFan(e.side?o[0]*e.side/e.range:0),W();return}let n=f.cards[e.card],l=t.timeStamp/1e3-e.startT<.45;if(!e.moved&&l&&!a){if(f.release(0,0),f.order[0]===n.id){let t=Math.cos(n.p[3]),e=Math.sin(n.p[3]),a=z(r,i,n.z),o=t*(a[0]-n.x)+e*(a[1]-n.y);f.flip(n.id,o>=0?1:-1)}else f.toFront(n.id);tt(),W();return}let s=(d.depth-n.z)/(d.scale*d.depth);f.release(o[0]*s,-o[1]*s),tt(),W()},ty=()=>{(0,r.ensureAudio)(),u.audio=!0,f.throwTop(u.throwDir),u.throwDir=-u.throwDir,tv(),W()},tb=()=>{(0,r.ensureAudio)(),u.audio=!0,f.flip(f.order[0],1),tv(),W()},tk=t=>{(0,r.ensureAudio)(),u.audio=!0,f.setFan(+("fan"===t)),tv(),W()};if(!1===Z)return(0,e.jsx)(tp,{stage:c});if(!c)return(0,e.jsx)("div",{className:"absolute inset-0",onPointerMove:t=>{if("mouse"!==t.pointerType||u.reduced)return;let[e,a]=tc(t);u.hover=!0,u.hx=e,u.hy=a,U()},onPointerLeave:()=>{u.hover=!1,U()},ref:b,children:(0,e.jsx)("canvas",{ref:$,"aria-hidden":"true",className:"absolute inset-0 block size-full"})});let tT=l[S].name;return(0,e.jsxs)("div",{ref:b,className:"absolute inset-0 overflow-hidden select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[over]:cursor-grab data-[grabbing]:cursor-grabbing data-[grabbing]:**:cursor-grabbing",style:{touchAction:"pan-y"},onContextMenu:t=>{t.target.closest("[data-lab-controls]")||t.preventDefault()},onPointerDown:t=>{if(!c||t.button>0||u.drag||t.target.closest("[data-lab-controls]"))return;(0,r.ensureAudio)(),u.audio=!0,u.pressedAt=performance.now();let[e,a]=tc(t);u.sn=0,u.pvx=u.pvy=0,tg(e,a,t.timeStamp);let o=Y(e,a),n="mouse"!==t.pointerType;try{b.current?.setPointerCapture(t.pointerId)}catch{}let l={pointer:t.pointerId,startX:e,startY:a,startT:t.timeStamp/1e3,moved:!1,touch:n};if(o>=0){t.preventDefault();let r=f.cards[o],n=z(e,a,r.z);f.grab(o,n[0],n[1]),u.drag={...l,kind:"card",card:o,front:f.order[0]===o,fan0:0,side:0,range:1},b.current?.setAttribute("data-grabbing",""),function(t=0){let e=ta();if(!e)return;let a=e.ctx.currentTime+.005,r=ti(e.ctx,e.output,t);to(e,a,r,{type:"highpass",freq:3200*tr(.1),q:.7,gain:.05,attack:.001,decay:.022}),to(e,a,r,{type:"bandpass",freq:1100*tr(.1),q:1.4,gain:.04,attack:.001,decay:.03})}((0,i.clamp)(r.x/1.4,-1,1))}else{let{width:t}=K.current;f.holdFan(),u.drag={...l,kind:"fan",card:-1,front:!1,fan0:f.fan,side:0,range:Math.max(110,.28*t)}}tv(),W()},onPointerMove:t=>{let[e,a]=tc(t),r=u.drag;if(!r){if("mouse"===t.pointerType){if(t.target.closest("[data-lab-controls]")){u.hover&&(u.hover=!1,b.current?.removeAttribute("data-over"),W());return}u.hover=!0,u.hx=e,u.hy=a,u.keyAim&&(u.keyAim=!1);let r=Y(e,a)>=0,i=b.current;i&&i.hasAttribute("data-over")!==r&&i.toggleAttribute("data-over",r),W()}return}if(t.pointerId===r.pointer){if(tg(e,a,t.timeStamp),!r.moved&&Math.hypot(e-r.startX,a-r.startY)>6&&(r.moved=!0),"fan"===r.kind){let t=e-r.startX;if(!r.side){if(8>Math.abs(t))return;r.side=r.fan0>=.5?-Math.sign(t):Math.sign(t)}let a=r.fan0+t*r.side/r.range,i=t=>t/(1+3*t);f.fanTarget=a>1?1+i(a-1):a<0?-i(-a):a}W()}},onPointerUp:tx,onPointerCancel:tx,onLostPointerCapture:tx,onPointerLeave:t=>{"mouse"===t.pointerType&&(u.hover=!1,b.current?.removeAttribute("data-over"),W())},onDoubleClick:t=>{if(t.target.closest("[data-lab-controls]"))return;let[e,a]=tc(t);Y(e,a)>=0||(f.setFan(+(1!==f.fanGoal)),W())},children:[(0,e.jsx)("canvas",{ref:$,"aria-hidden":"true",className:"absolute inset-0 block size-full"}),Array.from({length:3},(t,a)=>(0,e.jsx)("div",{ref:t=>{T.current[a]=t},"aria-hidden":"true",className:"absolute top-0 left-0 origin-top-left [touch-action:none]",style:{width:100*x,height:100,transform:"scale(0)"}},a)),(0,e.jsx)("button",{ref:M,type:"button","aria-label":`${tT}, the front card of three`,"aria-describedby":R,"aria-keyshortcuts":"Space Enter F S",onMouseDown:t=>t.preventDefault(),onFocus:t=>{let e=!0;try{e=t.currentTarget.matches(":focus-visible")}catch{}u.ring=e,u.ringPath="",w.current?.parentElement?.setAttribute("opacity",e?"1":"0"),W()},onBlur:()=>{u.ring=!1,u.keyAim=!1,w.current?.parentElement?.setAttribute("opacity","0"),W()},onKeyDown:t=>{if(t.ctrlKey||t.metaKey||t.altKey)return;let e=t.key,a={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};if(a[e]){t.preventDefault();let[r,o]=a[e];u.keyAim||(u.keyAim=!0,u.kx=u.ky=0),u.kx=(0,i.clamp)(u.kx+.34*r,-1,1),u.ky=(0,i.clamp)(u.ky+.34*o,-1,1),u.hover=!1,W();return}if("Escape"===e&&u.keyAim){u.keyAim=!1,W();return}t.repeat||(" "===e||"Enter"===e?(t.preventDefault(),ty()):"f"===e||"F"===e?(t.preventDefault(),tb()):("s"===e||"S"===e)&&(t.preventDefault(),tk(1===f.fanGoal?"stack":"fan")))},onClick:t=>{0===t.detail&&performance.now()-u.pressedAt>800&&ty()},className:"absolute top-0 left-0 z-[5] origin-top-left cursor-grab rounded-[4%] outline-none [touch-action:none]",style:{width:100*x,height:100,transform:"scale(0)"}}),(0,e.jsx)("svg",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0 z-[6] size-full overflow-visible",children:(0,e.jsxs)("g",{opacity:"0",fill:"none",strokeLinejoin:"round",children:[(0,e.jsx)("path",{ref:A,strokeWidth:4,style:{stroke:"color-mix(in oklab, var(--background) 70%, transparent)"}}),(0,e.jsx)("path",{ref:w,strokeWidth:2,style:{stroke:"var(--foreground)"}})]})}),(0,e.jsx)("p",{id:R,className:"sr-only",children:"Three holographic cards. Space or Enter sends the front card to the back, F turns it over, S fans the cards out or stacks them, and the arrow keys tilt the front card in the light. With a pointer: drag a card and flick it to send it to the back, tap the front card to turn it over, tap another card to bring it to the front, and drag the table sideways to fan the cards."}),(0,e.jsx)("p",{className:"sr-only","aria-live":"polite",children:F}),(0,e.jsx)("div",{ref:k,className:"contents",children:(0,e.jsxs)(o.StageControls,{placement:"bottom",children:[(0,e.jsxs)(o.TrayRow,{children:[(0,e.jsx)(o.Tray,{label:"Layout",children:(0,e.jsx)(o.Segmented,{label:"Layout",options:tm,value:P,onChange:tk})}),(0,e.jsxs)(o.Tray,{label:"Cards",children:[(0,e.jsx)(o.IconButton,{label:"Send the front card to the back",onClick:ty,children:(0,e.jsx)(B,{size:15})}),(0,e.jsx)(o.IconButton,{label:"Turn the front card over",onClick:tb,children:(0,e.jsx)(D,{size:15})}),(0,e.jsx)(o.TrayDivider,{}),(0,e.jsx)(o.MuteButton,{})]})]}),(0,e.jsx)(o.StageHint,{className:j?"opacity-0 transition-opacity duration-700":"transition-opacity duration-700",children:E?"Flick a card to the back · tap to turn it over · drag the table to fan":"Flick a card to the back · tap to turn it over · swipe the table to fan"})]})})]})}],66396)},66936,function(t){t.n(t.i(66396))}]);