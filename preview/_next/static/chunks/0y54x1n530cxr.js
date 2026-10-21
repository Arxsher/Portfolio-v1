(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,57045,e=>{"use strict";var t=e.i(43476),i=e.i(71645),a=e.i(33209),s=e.i(16442),r=e.i(37047),n=e.i(45219);class o{down=!1;x=0;y=0;lx=0;ly=0;size=20;r=0;rv=0;load=0;edgeAcc=0;speed=0;fog=0;travelled=0;rng;constructor(e){this.rng=e}begin(e,t,i){this.down=!0,this.x=this.lx=e,this.y=this.ly=t,this.size=i,this.r=.62*i,this.rv=0,this.load=0,this.edgeAcc=0,this.travelled=0}to(e,t,i,a,s,r,n){if(this.x=e,this.y=t,!this.down)return;let o=e-this.lx,l=t-this.ly,h=Math.hypot(o,l);if(i>0&&(this.speed+=(Math.min(4e3,h/i)-this.speed)*Math.min(1,14*i)),h<1.2)return;let c=this.r,u=a.unit,f=-l/h,d=o/h,p=r.at(e+o/h*c*.75,t+l/h*c*.75);this.fog+=(p-this.fog)*.3,this.load+=.024*r.wipe(this.lx,this.ly,e,t,c,Math.max(1.5,.14*c)),n.wipe(this.lx,this.ly,e,t,c);let g=2.6*u+1.2;for(this.edgeAcc+=h;this.edgeAcc>g;){this.edgeAcc-=g;let e=1-this.edgeAcc/h;this.shed(this.lx+o*e,this.ly+l*e,f,d,c,this.fog,a,s)}this.load+=s.sweep(e,t,.92*c),h>c&&(this.load+=s.sweep((e+this.lx)/2,(t+this.ly)/2,.92*c));let m=Math.pow(3.1*u,3);if(this.load>m){let i=Math.min(3.6*u,Math.cbrt(.8*this.load)),a=(this.rng()-.5)*c*.7,r=Math.sqrt(Math.max(0,c*c-a*a))+.35*i;s.addDrop(e+a,t+r,i,0,12*u),this.load*=.18}this.travelled+=h,this.lx=e,this.ly=t}shed(e,t,i,a,s,r,n,o){if(r<.05)return;let l=n.unit;for(let n=-1;n<=1;n+=2){if(this.rng()>.35+.6*r)continue;let h=i*n,c=a*n,u=c>0?.55+.6*c:.55+.25*c,f=this.rng(),d=l*(.4+1.25*f*f)*(.45+.75*r)*u;this.load=Math.max(0,this.load-d*d*d);let p=s+.6*d+(this.rng()-.25)*2.2*l;o.addBead(e+h*p,t+c*p,d)}}end(e,t){if(!this.down)return;this.down=!1;let i=e.unit;if(this.load>Math.pow(1.2*i,3)){let e=Math.min(3.6*i,Math.cbrt(.9*this.load)),a=this.y+this.r+.25*e;e<=t.cfg.beadMax*i?t.addBead(this.x,a,e):t.addDrop(this.x,a,e,0,0)}this.load=0}step(e){let t=this.down?this.size:.62*this.size,i=2*Math.sqrt(900)*.85,a=Math.min(e,.1);for(;a>1e-5;){let e=Math.min(a,1/240);this.rv+=(-900*(this.r-t)-i*this.rv)*e,this.r+=this.rv*e,a-=e}return this.down?this.speed*=Math.exp(-(4*e)):this.speed*=Math.exp(-(10*e)),Math.abs(this.r-t)>.05||Math.abs(this.rv)>.1||this.speed>1}}let l=(e,t,i)=>{let a=Math.min(1,Math.max(0,(i-e)/(t-e)));return a*a*(3-2*a)};function h(e,t,i,a,s){let r=e.panes[t],n=(a-r.y)/r.h,o=Math.min(i-r.x,r.x+r.w-i,r.y+r.h-a)/e.unit;return Math.min(1,Math.max(0,s.lo+(s.hi-s.lo)*l(.3,.92,n)+.3*Math.exp(-Math.max(0,o)/24)))}function c(e,t,i){for(let a=0;a<e.paneCount;a++){let s=e.panes[a];if(t>=s.x&&t<=s.x+s.w&&i>=s.y&&i<=s.y+s.h)return a}return -1}class u{data=new Float32Array(4096);count=0;push(e,t,i,a,s,r,n,o){if(this.count>=512)return;let l=8*this.count,h=this.data;h[l]=e,h[l+1]=t,h[l+2]=i,h[l+3]=a,h[l+4]=s,h[l+5]=r,h[l+6]=n,h[l+7]=o,this.count++}wipe(e,t,i,a,s){this.push(e,t,i,a,s,1,0,Math.max(1.5,.14*s))}lane(e,t,i,a,s){this.push(e,t,i,a,s,.9,1,Math.max(.8,.3*s))}breath(e,t,i,a){this.push(e,t,e,t,i,a,2,.55*i)}clear(){this.count=0}}class f{cols=0;rows=0;gx=0;gy=0;clear=new Float32Array(0);breath=new Float32Array(0);layout=null;level;live=!1;constructor(e){this.level=e}setBounds(e){this.layout=e,this.gx=e.glass.x,this.gy=e.glass.y,this.cols=Math.ceil(e.glass.w/6)+1,this.rows=Math.ceil(e.glass.h/6)+1;let t=this.cols*this.rows;this.clear.length<t&&(this.clear=new Float32Array(t),this.breath=new Float32Array(t)),this.reset()}reset(){this.clear.fill(0),this.breath.fill(0),this.live=!1}decay(e,t){if(!this.live||!t)return;let i=e/7.5,a=e/6,s=this.cols*this.rows,r=!1;for(let e=0;e<s;e++){let t=this.clear[e];t>0&&(this.clear[e]=t>i?t-i:0,r=!0);let s=this.breath[e];s>0&&(this.breath[e]=s>a?s-a:0,r=!0)}this.live=r}wipe(e,t,i,a,s,r){let n=this.layout,o=0,u=s+r,f=Math.max(0,Math.floor((Math.min(e,i)-u-this.gx)/6)),d=Math.min(this.cols-1,Math.ceil((Math.max(e,i)+u-this.gx)/6)),p=Math.max(0,Math.floor((Math.min(t,a)-u-this.gy)/6)),g=Math.min(this.rows-1,Math.ceil((Math.max(t,a)+u-this.gy)/6)),m=i-e,x=a-t,v=m*m+x*x;for(let i=p;i<=g;i++){let a=this.gy+(i+.5)*6;for(let u=f;u<=d;u++){let f=this.gx+(u+.5)*6,d=v>0?((f-e)*m+(a-t)*x)/v:0,p=f-(e+m*(d=d<0?0:d>1?1:d)),g=a-(t+x*d),y=1-l(s-r,s+r,Math.sqrt(p*p+g*g));if(y<=0)continue;let b=i*this.cols+u,w=this.clear[b],M=this.breath[b],k=w+(1-w)*y,A=M*(1-y);if(this.clear[b]=k,this.breath[b]=A,this.live=!0,n){let e=c(n,f,a);if(e>=0){let t=h(n,e,f,a,this.level);o+=6*Math.max(0,Math.max(t*(1-w),M)-Math.max(t*(1-k),A))*6}}}}return o}breathe(e,t,i,a){let s=Math.max(0,Math.floor((e-i-this.gx)/6)),r=Math.min(this.cols-1,Math.ceil((e+i-this.gx)/6)),n=Math.max(0,Math.floor((t-i-this.gy)/6)),o=Math.min(this.rows-1,Math.ceil((t+i-this.gy)/6));for(let h=n;h<=o;h++){let n=this.gy+(h+.5)*6;for(let o=s;o<=r;o++){let s=a*(1-l(.45,1,Math.hypot(this.gx+(o+.5)*6-e,n-t)/i));if(s<=0)continue;let r=h*this.cols+o;this.breath[r]+=(1-this.breath[r])*s,this.clear[r]*=1-s,this.live=!0}}}at(e,t){let i=this.layout;if(!i)return 0;let a=c(i,e,t);if(a<0)return 0;let s=Math.min(this.cols-1,Math.max(0,Math.floor((e-this.gx)/6))),r=Math.min(this.rows-1,Math.max(0,Math.floor((t-this.gy)/6)))*this.cols+s;return Math.max(h(i,a,e,t,this.level)*(1-this.clear[r]),this.breath[r])}}function d({size:e=16,className:i,children:a}){return(0,t.jsx)("svg",{width:e,height:e,viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",className:i?`shrink-0 ${i}`:"shrink-0",children:(0,t.jsx)("g",{stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",children:a})})}function p(e){return(0,t.jsx)(d,{...e,children:(0,t.jsx)("path",{d:"M9.2 1.8 4.4 8.9h3.4l-1 5.3 4.8-7.1H8.2z"})})}function g(e){return(0,t.jsxs)(d,{...e,children:[(0,t.jsx)("path",{d:"M2.2 5.2c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0c.9-.7 1.9-.9 3.2-.5"}),(0,t.jsx)("path",{d:"M2.2 8.6c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0c.9-.7 1.9-.9 3.2-.5"}),(0,t.jsx)("path",{d:"M4.4 12c1-.8 2-.8 3 0s2.2.9 3.4 0"})]})}function m(){let e=()=>({x:0,y:0,w:0,h:0});return{W:0,H:0,unit:1,paneCount:1,panes:[e(),e(),e()],glass:e(),opening:e(),casing:e(),casingW:0,stile:0,topRail:0,bottomRail:0,sillX0:0,sillX1:0,sillY:0,sillTop:0,nose:0,apron:0,handleX:0,handleY:0,bottom:0}}let x=(e,t,i)=>Math.min(i,Math.max(t,e));function v(e,t,i,a,s){s.W=e,s.H=t;let r=e<560,n=i?Math.round(.06*t):r?16:26,o=i?t-Math.round(.075*t):t-a,l=i?Math.round(.1*e):r?16:56,h=Math.max(60,o-n),c=Math.max(60,e-2*l),u=Math.round(x(.04*h,6,20)),f=Math.round(x(.032*h,5,15)),d=Math.round(1.4*f),p=Math.round(x(.034*h,5,14)),g=Math.round(x(.016*h,2,7)),m=Math.round(x(.028*h,4,12)),v=Math.round(.85*u),y=2*f,b=h-u-f-d-p-g-m,w=(u+f)*2,M=i?1:x(Math.round((c-w+y)/(.82*b+y)),1,3),k=(c-w-(M-1)*y)/M;(k=Math.min(k,b*(1===M?1.15:.95)))<.5*b&&M>1&&(M-=1,k=Math.min((c-w-(M-1)*y)/M,.95*b)),k<.55*b&&(b=Math.max(40,k/.55));let A=(k=Math.floor(k))*M+y*(M-1),T=u+f+(b=Math.floor(b))+d+p+g+m,F=Math.round((e-A)/2),R=Math.round(n+(h-T)/2+u+f);s.paneCount=M;for(let e=0;e<3;e++){let t=s.panes[e];e<M?(t.x=F+e*(k+y),t.y=R,t.w=k,t.h=b):t.x=t.y=t.w=t.h=0}return s.glass.x=F,s.glass.y=R,s.glass.w=A,s.glass.h=b,s.opening.x=F-f,s.opening.y=R-f,s.opening.w=A+2*f,s.opening.h=b+f+d,s.casing.x=s.opening.x-u,s.casing.y=s.opening.y-u,s.casing.w=s.opening.w+2*u,s.casing.h=s.opening.h+u,s.casingW=u,s.stile=f,s.topRail=f,s.bottomRail=d,s.sillX0=s.casing.x-v,s.sillX1=s.casing.x+s.casing.w+v,s.sillY=s.opening.y+s.opening.h,s.sillTop=p,s.nose=g,s.apron=m,s.bottom=s.sillY+p+g+m,s.handleX=M>=2?F+k+y/2:F+A+f/2,s.handleY=R+.56*b,s.unit=x(b/330,.42,1.3),s}function y(e,t,i,a=0){for(let s=0;s<e.paneCount;s++){let r=e.panes[s];if(t>=r.x-a&&t<=r.x+r.w+a&&i>=r.y-a&&i<=r.y+r.h+a)return s}return -1}var b=e.i(55171);let w=[1,.62,.3],M=[1,.8,.56],k=[.55,.72,1],A=[1,.45,.2],T=[1,.52,.18],F=[1,.8,.58],R=[1,.66,.3],B=[1,.08,.05],S=[1,.55,.08],C=[.2,1,.55];class N{buildings=new Float32Array(80);grids=new Float32Array(80);floors=new Float32Array(20);buildingN=0;awnings=new Float32Array(8);lamps=new Float32Array(40);lampN=0;tower=new Float32Array(3);traffic=new Float32Array(2);carBodies=new Float32Array(16);win;winN=0;winLevel;winFlip;fixed;fixedN=0;cars=new Float32Array(16);carTimer=new Float32Array(2);out=new Float32Array(7200);count=0;rand;flipTimer=3;trafficT=2;time=0;constructor(e=31261){this.rand=(0,r.seededRandom)(e),this.win=new Float32Array(12800),this.winLevel=new Float32Array(1600),this.winFlip=new Uint8Array(1600),this.fixed=new Float32Array(1280),this.build(),this.carTimer[0]=.4,this.carTimer[1]=2.2}addBuilding(e,t,i,a){if(this.buildingN>=20)return -1;let s=this.buildingN++,r=this.buildings;r[4*s]=e,r[4*s+1]=t,r[4*s+2]=i,r[4*s+3]=a;let n=this.rand,o=t-e,l=.07+.022*n(),h=Math.max(1,Math.floor((o-.05)/l)),c=e+(o-(h-1)*l)/2,u=.03+.008*n(),f=.048+.012*n(),d=this.grids;d[4*s]=l,d[4*s+1]=c,d[4*s+2]=u,d[4*s+3]=f;let p=.094+.012*n();this.floors[s]=p;for(let e=0;;e++){let t=.09-p*(e+.5);if(t-f/2<i+.022)break;for(let e=0;e<h&&!(this.winN>=1600);e++){let i=c+e*l,a=8*this.winN,s=n(),r=s<.62?0:s<.84?1:s<.92?2:3;this.win[a]=i,this.win[a+1]=t,this.win[a+2]=u,this.win[a+3]=f,this.win[a+4]=r,this.win[a+5]=n(),this.win[a+6]=.55+.6*n(),this.win[a+7]=100*n(),this.winN++}}return s}addFixed(e,t,i,a,s,r,n){if(this.fixedN>=160)return;let o=8*this.fixedN,l=this.fixed;l[o]=e,l[o+1]=t,l[o+2]=i,l[o+3]=a,l[o+4]=s[0]*r,l[o+5]=s[1]*r,l[o+6]=s[2]*r,l[o+7]=n,this.fixedN++}addLamp(e,t){if(this.lampN>=10)return;let i=this.lampN++;this.lamps[4*i]=e,this.lamps[4*i+1]=-.035,this.lamps[4*i+2]=+!!t,this.addFixed(e,-.026,.016,.009,t?F:T,5.5,1)}addString(e,t,i,a,s,r){let n=Math.max(2,Math.round((i-e)/r));for(let r=0;r<=n;r++){let o=r/n,l=e+(i-e)*o,h=t+(a-t)*o+4*s*o*(1-o),c=.85+.3*this.rand();this.addFixed(l,h,.007,.007,R,2.6*c,4)}}build(){let e=this.rand;this.addBuilding(-1.02,-.66,-.44,.95),this.addBuilding(-.66,-.43,-.17,1.15);let t=this.addBuilding(-.43,.14,-.33,.85);this.addBuilding(.14,.31,-.68,1.05);let i=this.addBuilding(.47,.98,-.25,1),a=.98;for(;a<3.4&&this.buildingN<19;){.16>e()&&(a+=.12+.08*e());let t=.3+.3*e();this.addBuilding(a,a+t,-.1-.52*e(),.8+.45*e()),a+=t}for(a=-1.02;a>-3.4&&this.buildingN<20;){.16>e()&&(a-=.12+.08*e());let t=.3+.3*e();this.addBuilding(a-t,a,-.1-.52*e(),.8+.45*e()),a-=t}if(t>=0&&(this.awnings[0]=-.41,this.awnings[1]=.12,this.awnings[2]=.083,this.awnings[3]=.104,this.addFixed(-.15,.152,.46,.07,w,1.5,0),this.addString(-.41,.107,.12,.107,.012,.034)),i>=0){this.awnings[4]=.5,this.awnings[5]=.95,this.awnings[6]=.088,this.awnings[7]=.1;for(let e=0;e<3;e++)this.addFixed(.56+.15*e,.15,.1,.075,M,1.05,0);this.addString(.5,.103,.95,.103,.016,.036)}this.addFixed(.505,.012,.013,.085,[1,.2,.42],1.7,0),this.addFixed(-.84,.06,.13,.014,[.14,.86,.78],1.35,0),this.addString(.31,-.01,.47,.004,.045,.026);for(let t=0;t<this.buildingN;t++){let i=this.buildings[4*t],a=this.buildings[4*t+1];if(a>-.45&&i<1)continue;let s=e();s<.4?this.addFixed(i+(a-i)*(.25+.5*e()),.118,.008,.008,R,2.4,4):s<.7&&this.addFixed((i+a)/2,.15,(a-i)*.6,.06,.5>e()?w:M,.75,0)}for(let t of[-3.1,-2.4,-1.72,-1.12,.39,1.25,1.95,2.7])this.addLamp(t,.45>e());this.traffic[0]=1.03,this.traffic[1]=.03,this.tower[0]=.4,this.tower[1]=-.31,this.tower[2]=.035;for(let e=0;e<this.winN;e++)this.winLevel[e]=this.target(e,0)}target(e,t){let i=this.win[8*e+5]<.6-.2*t;return this.winFlip[e]?+!i:+!!i}update(e,t,i,a,s){if(s){if(this.time+=e,this.trafficT=(this.trafficT+e)%20,this.flipTimer-=e,this.flipTimer<=0){this.flipTimer=2.5+5*this.rand();for(let e=0;e<8;e++){let e=Math.floor(this.rand()*this.winN),t=this.win[8*e];if(t>i&&t<a){this.winFlip[e]^=1;break}}}for(let t=0;t<2;t++)if(this.carTimer[t]-=e,!(this.carTimer[t]>0)){this.carTimer[t]=3+7*this.rand();for(let e=0;e<4;e++){let s=4*e;if(this.cars[s+3])continue;let r=0===t?-1:1;this.cars[s]=r>0?i-.45:a+.45,this.cars[s+1]=t,this.cars[s+2]=(.2+.1*this.rand())*r,this.cars[s+3]=1;break}}for(let t=0;t<4;t++){let s=4*t;this.cars[s+3]&&(this.cars[s]+=this.cars[s+2]*e,(this.cars[s]<i-.6||this.cars[s]>a+.6)&&(this.cars[s+3]=0))}}let r=s?1-Math.exp(-(10*e)):1;for(let e=0;e<this.winN;e++){let i=this.target(e,t);this.winLevel[e]+=(i-this.winLevel[e])*r}for(let e=0;e<4;e++){let t=4*e;this.carBodies[t]=this.cars[t],this.carBodies[t+1]=this.cars[t+1]?.395:.305,this.carBodies[t+2]=Math.sign(this.cars[t+2])||1,this.carBodies[t+3]=this.cars[t+3]}}trafficPhase(){let e=this.trafficT;return e<8.5?2:+(e<10.5)}emit(e,t,i,a,s,r,n,o){if(this.count>=900)return;let l=8*this.count,h=this.out;h[l]=e,h[l+1]=t,h[l+2]=i,h[l+3]=a,h[l+4]=s,h[l+5]=r,h[l+6]=n,h[l+7]=o,this.count++}reflect(e,t,i,a,s,r,n){let o=Math.max(.02,.245-t);this.emit(e,.245+.9*o+.012,Math.max(.012,.9*i),.05+.9*o,a*n,s*n,r*n,2)}fill(e,t,i,a){this.count=0;let s=this.time,r=.75*i,n=.75*a;for(let i=0;i<this.winN;i++){let a=this.winLevel[i];if(a<.01)continue;let o=8*i,l=this.win[o]+r;if(l<e||l>t)continue;let h=this.win[o+4],c=this.win[o+6]*a*1.15,u=0===h?w:1===h?M:2===h?k:A;if(2===h){let e=this.win[o+7];c*=.55+.25*Math.sin(3.1*s+e)*Math.sin(1.7*s+2*e)+.2*Math.sin(11*s+e)}3===h&&(c*=.7),this.emit(l,this.win[o+1]+n,this.win[o+2],this.win[o+3],u[0]*c,u[1]*c,u[2]*c,0)}for(let r=0;r<this.fixedN;r++){let n=8*r,o=this.fixed,l=o[n]+i;if(l+o[n+2]<e||l-o[n+2]>t)continue;let h=o[n+4],c=o[n+5],u=o[n+6],f=o[n+7];if(4===f){let e=.92+.08*Math.sin(2.3*s+1.7*r);h*=e,c*=e,u*=e}this.emit(l,o[n+1]+a,o[n+2],o[n+3],h,c,u,f),this.reflect(l,o[n+1],o[n+2],h,c,u,0===f?.28:.42),1===f&&this.emit(l,.215+a,.2,.05,.05*h,.05*c,.05*u,3)}{let r=this.tower[0]+.35*i;if(r>e&&r<t){let e=s%2.4/2.4,t=e<.18?Math.sin(e/.18*Math.PI):0;t>.01&&this.emit(r,this.tower[1]-.012+.35*a,.008,.008,3*t,.18*t,.1*t,4)}}{let s=this.traffic[0]+i;if(s>e-.2&&s<t+.2){let e=this.trafficPhase(),t=this.traffic[1]+a+.019*e,i=0===e?B:1===e?S:C;this.emit(s,t,.011,.011,4.5*i[0],4.5*i[1],4.5*i[2],1),this.reflect(s,this.traffic[1]+.019*e,.011,4.5*i[0],4.5*i[1],4.5*i[2],.4)}}for(let s=0;s<4;s++){let r=4*s;if(!this.cars[r+3])continue;let n=Math.sign(this.cars[r+2])||1,o=this.cars[r+1],l=(o?.395:.305)-.016+a,h=this.cars[r]+i;if(h<e-.5||h>t+.5)continue;let c=h+.095*n,u=h-.095*n,f=o?1.15:1;this.emit(c,l,.014*f,.011*f,6,5.4,4.4399999999999995,1),this.emit(u,l-.002,.01*f,.008*f,3.2,.22400000000000003,.128,1),this.emit(c+.14*n,l+.024,.26,.026,.3,.27,.22,3),this.reflect(c,l+.016-a,.014,6,5.4,4.4399999999999995,.32),this.reflect(u,l+.016-a,.01,3.2,.22400000000000003,.128,.4)}return this.count}}let E=`#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,P=`
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.7);
    a *= 0.5;
  }
  return s;
}
`,L=`#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 outColor;

uniform vec4 uDomain;   // scene x0, y0, w, h covered by this target
uniform float uBlur;    // edge softness, scene units
uniform float uNight;
uniform float uFlash;
uniform float uFlashX;
uniform vec2 uPar;
uniform vec4 uB[20];    // x0, x1, top, tone
uniform vec4 uG[20];    // column spacing, first column, window w, window h
uniform float uF[20];   // floor height
uniform int uBN;
uniform vec4 uAwn[2];
uniform vec4 uLamp[10]; // x, head y, LED?, -
uniform int uLampN;
uniform vec3 uTower;    // x, top, half width
uniform vec2 uTraffic;

const float BASE = 0.2;
const float CURB = 0.245;
${P}

float band(float x, float a, float b, float s) {
  return smoothstep(a - s, a + s, x) * (1.0 - smoothstep(b - s, b + s, x));
}
float box(vec2 p, vec2 a, vec2 b, float s) {
  return band(p.x, a.x, b.x, s) * band(p.y, a.y, b.y, s);
}

vec3 sky(vec2 s) {
  float h = clamp((BASE - s.y) / 0.85, 0.0, 1.0);
  vec3 top = mix(vec3(0.058, 0.078, 0.14), vec3(0.005, 0.007, 0.016), uNight);
  vec3 low = mix(vec3(0.14, 0.14, 0.18), vec3(0.022, 0.019, 0.03), uNight);
  vec3 glow = mix(vec3(0.17, 0.1, 0.065), vec3(0.08, 0.036, 0.022), uNight);
  vec3 c = mix(low, top, smoothstep(0.0, 0.95, h));
  c += glow * exp(-h * 3.2);
  // low rain clouds, lit from below by the town
  float cl = fbm(vec2(s.x * 1.4, s.y * 3.0));
  c *= 0.72 + 0.6 * cl;
  // lightning inside the clouds
  float near = exp(-abs(s.x - uFlashX) * 1.2);
  c += uFlash * vec3(0.62, 0.66, 0.85) * (0.25 + 1.4 * cl * cl) * (0.45 + 0.9 * near) * (0.35 + h);
  return c;
}

/** The towers beyond the street: blocks of haze with a few lit floors. */
vec3 towers(vec2 s, vec3 base, float b) {
  vec2 q = s - uPar * 0.35;
  float cell = floor(q.x / 0.085);
  float hx = hash12(vec2(cell, 3.0));
  float top = -0.04 - 0.26 * hx * hx - 0.05 * hash12(vec2(cell, 7.0));
  float x0 = cell * 0.085 + 0.01 * hash12(vec2(cell, 11.0));
  float x1 = (cell + 1.0) * 0.085 - 0.01 * hash12(vec2(cell, 13.0));
  float cov = band(q.x, x0, x1, b) * smoothstep(top - b, top + b, q.y);
  // the tall one with the beacon
  float t = band(q.x, uTower.x - uTower.z, uTower.x + uTower.z, b) * smoothstep(uTower.y - b, uTower.y + b, q.y);
  cov = max(cov, t);
  vec3 haze = mix(vec3(0.13, 0.14, 0.19), vec3(0.016, 0.015, 0.024), uNight);
  vec3 c = mix(base, haze, cov * 0.85);
  // a few lit windows, far away
  vec2 g = floor(q / vec2(0.016, 0.022));
  float lit = step(0.86, hash12(g + cell * 0.37)) * cov;
  vec2 f = fract(q / vec2(0.016, 0.022));
  float w = band(f.x, 0.3, 0.7, 0.1) * band(f.y, 0.35, 0.7, 0.1);
  c += lit * w * vec3(1.0, 0.7, 0.4) * mix(0.25, 0.5, uNight) * smoothstep(0.03, 0.006, b);
  return c;
}

/** The facades across the street (and their ground floors, awnings, posts, cars). */
vec3 street(vec2 s, float b) {
  vec3 c = sky(s);
  c = towers(s, c, b);
  vec2 q = s - uPar * 0.75;
  vec3 facadeDay = vec3(0.085, 0.09, 0.112);
  vec3 facadeNight = vec3(0.011, 0.0105, 0.014);
  vec3 lampTint = vec3(0.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uLampN) break;
    vec4 L = uLamp[i];
    vec2 d = (s - vec2(L.x + uPar.x, 0.03)) / vec2(0.3, 0.2);
    vec3 lc = L.z > 0.5 ? vec3(1.0, 0.8, 0.58) : vec3(1.0, 0.52, 0.18);
    lampTint += lc * exp(-dot(d, d));
  }
  float best = 0.0;
  vec3 facade = c;
  for (int i = 0; i < 20; i++) {
    if (i >= uBN) break;
    vec4 B = uB[i];
    float cov = band(q.x, B.x, B.y, b) * smoothstep(B.z - b, B.z + b, q.y) * (1.0 - smoothstep(BASE - b, BASE + b, q.y));
    if (cov <= best) continue;
    best = cov;
    vec3 f = mix(facadeDay, facadeNight, uNight) * B.w;
    // the cornice catches the light; floors are faintly banded
    f *= 1.0 + 0.45 * band(q.y, B.z, B.z + 0.012, b * 0.5);
    vec4 G = uG[i];
    float fh = uF[i];
    // unlit windows: dark glass with a little sky in it
    float col = floor((q.x - G.y) / G.x + 0.5);
    float cx = G.y + col * G.x;
    float row = floor((0.09 - q.y) / fh);
    float cy = 0.09 - fh * (row + 0.5);
    float inside = band(q.x, cx - G.z * 0.5, cx + G.z * 0.5, b) * band(q.y, cy - G.w * 0.5, cy + G.w * 0.5, b);
    inside *= step(0.0, row) * step(col, (B.y - G.y) / G.x) * step(0.0, col) * step(B.z + 0.022, cy - G.w * 0.5);
    vec3 glass = mix(sky(vec2(q.x, -0.3)) * 0.5, vec3(0.006, 0.006, 0.01), uNight * 0.6);
    f = mix(f, glass, inside * 0.85);
    // the ground floor: shopfront frames and doors, darker
    float ground = smoothstep(0.088 - b, 0.088 + b, q.y);
    f = mix(f, f * 0.55, ground);
    // lamplight on the walls, and the lightning
    f += f * lampTint * 2.2;
    f += uFlash * vec3(0.05, 0.055, 0.07) * (1.0 - ground * 0.6);
    facade = f;
  }
  c = mix(c, facade, best);
  // awnings over the shop and the caf\xe9
  for (int i = 0; i < 2; i++) {
    vec4 A = uAwn[i];
    if (A.y <= A.x) continue;
    float a = box(q, A.xz, A.yw, b);
    vec3 cloth = i == 0 ? vec3(0.03, 0.06, 0.045) : vec3(0.07, 0.025, 0.02);
    cloth = mix(cloth, cloth * 0.25, uNight) + vec3(0.12, 0.07, 0.03) * 0.25;
    c = mix(c, cloth, a);
  }
  // the pavement, wet
  vec2 p = s - uPar;
  float walk = band(p.y, BASE, CURB, b);
  vec3 pave = mix(vec3(0.06, 0.062, 0.075), vec3(0.012, 0.011, 0.013), uNight);
  pave += lampTint * vec3(0.06, 0.04, 0.025) * 1.4;
  c = mix(c, pave, walk);
  // streetlamp posts and their heads
  for (int i = 0; i < 10; i++) {
    if (i >= uLampN) break;
    vec4 L = uLamp[i];
    float x = L.x + uPar.x;
    float post = band(s.x, x - 0.0035, x + 0.0035, b) * band(s.y, L.y + uPar.y, CURB - 0.003 + uPar.y, b);
    float head = box(s, vec2(x - 0.014, L.y - 0.006 + uPar.y), vec2(x + 0.014, L.y + 0.004 + uPar.y), b);
    c = mix(c, vec3(0.008, 0.008, 0.01), max(post, head) * 0.95);
  }
  // the traffic light
  {
    float x = uTraffic.x + uPar.x;
    float post = band(s.x, x - 0.003, x + 0.003, b) * band(s.y, uTraffic.y + uPar.y, CURB + uPar.y, b);
    float head = box(s, vec2(x - 0.009, uTraffic.y - 0.008 + uPar.y), vec2(x + 0.009, uTraffic.y + 0.05 + uPar.y), b);
    c = mix(c, vec3(0.006), max(post, head));
  }
  return c;
}

vec3 scene(vec2 s, float b) {
  vec2 p = s - uPar;
  if (p.y < CURB) return street(s, b);
  // the road: wet asphalt, mirroring the street in long broken streaks
  float d = p.y - CURB;
  vec3 road = mix(vec3(0.03, 0.032, 0.04), vec3(0.006, 0.006, 0.008), uNight);
  float ripple = vnoise(vec2(s.x * 90.0, s.y * 22.0)) - 0.5;
  vec2 m = vec2(s.x + ripple * 0.012 * (0.3 + d * 3.0), CURB - d * 1.25 + uPar.y);
  vec3 refl = street(m, b + d * 0.08);
  vec3 c = road + refl * (0.42 - 0.22 * smoothstep(0.0, 0.3, d));
  // the lane line, a little shine of paint
  float dash = step(0.5, fract(p.x * 3.5)) * band(p.y, 0.343, 0.349, b);
  c += dash * mix(vec3(0.06), vec3(0.02), uNight);
  // the kerb's edge
  c += band(p.y, CURB, CURB + 0.004, b) * mix(vec3(0.05), vec3(0.012), uNight);
  return c;
}

void main() {
  vec2 s = uDomain.xy + vec2(vUv.x, 1.0 - vUv.y) * uDomain.zw;
  outColor = vec4(scene(s, uBlur), 1.0);
}
`,D=`#version 300 es
layout(location = 0) in vec4 aCar;   // x, lane y, direction, present
uniform vec4 uDomain;
uniform float uBlur;
uniform vec2 uPar;
out vec2 vO;
flat out float vDir;
void main() {
  vec2 ext = vec2(0.13, 0.06) + uBlur * 1.5;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 c = vec2(aCar.x, aCar.y - 0.03) + uPar;
  vec2 s = c + corner * ext;
  vO = s - (vec2(aCar.x, aCar.y) + uPar);
  vDir = aCar.z;
  vec2 uv = (s - uDomain.xy) / uDomain.zw;
  gl_Position = aCar.w > 0.5 ? vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}
`,V=`#version 300 es
precision highp float;
precision highp int;
in vec2 vO;
flat in float vDir;
out vec4 outColor;
uniform float uBlur;
uniform float uNight;
float band(float x, float a, float b, float s) {
  return smoothstep(a - s, a + s, x) * (1.0 - smoothstep(b - s, b + s, x));
}
void main() {
  float b = uBlur + 0.002;
  vec2 o = vO;
  float body = band(o.x, -0.105, 0.105, b) * band(o.y, -0.042, 0.0, b);
  float cabin = band(o.x, -0.062 - vDir * 0.012, 0.05 - vDir * 0.012, b + 0.002) * band(o.y, -0.07, -0.04, b + 0.002);
  float shadow = band(o.x, -0.115, 0.115, b + 0.01) * band(o.y, -0.004, 0.014, b + 0.006);
  vec3 paint = mix(vec3(0.026, 0.028, 0.035), vec3(0.005), uNight);
  vec3 glass = mix(vec3(0.07, 0.075, 0.09), vec3(0.012), uNight);
  vec3 c = mix(paint, glass, cabin * (1.0 - body));
  float a = max(max(body, cabin * 0.92), shadow * 0.55) * mix(1.0, 0.6, smoothstep(0.004, 0.04, uBlur));
  if (a < 0.002) discard;
  outColor = vec4(c * (body + cabin > 0.01 ? 1.0 : 0.0), a);
}
`,q=`#version 300 es
layout(location = 0) in vec4 aRect;   // x, y, w, h
layout(location = 1) in vec4 aColor;  // r, g, b, kind
uniform vec4 uDomain;
uniform float uBlur;
uniform int uMode;      // 0 crisp, 1 out of focus, 2 fog
out vec2 vLocal;
out vec2 vHalf;
out vec3 vColor;
flat out int vKind;
void main() {
  int kind = int(aColor.w + 0.5);
  vec2 hs = aRect.zw * 0.5;
  float pad;
  if (uMode == 0) pad = kind == 1 ? 0.07 : kind == 4 ? 0.03 : kind == 2 ? 0.01 : kind == 3 ? 0.0 : 0.014;
  else if (uMode == 1) pad = uBlur * 1.3 + 0.004;
  else pad = uBlur * 2.4;
  if (kind == 3) pad += max(hs.x, hs.y);
  vec2 ext = hs + pad;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 s = aRect.xy + corner * ext;
  vLocal = corner * ext;
  vHalf = hs;
  vColor = aColor.rgb;
  vKind = kind;
  vec2 uv = (s - uDomain.xy) / uDomain.zw;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}
`,I=`#version 300 es
precision highp float;
precision highp int;
in vec2 vLocal;
in vec2 vHalf;
in vec3 vColor;
flat in int vKind;
out vec4 outColor;
uniform float uBlur;
uniform int uMode;
uniform float uPx;      // one texel, in scene units
uniform float uTime;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 p = vLocal;
  vec3 c = vColor;
  float I = 0.0;
  if (uMode == 0) {
    // in focus
    if (vKind == 0) {
      float d = sdBox(p, vHalf);
      I = 1.0 - smoothstep(-uPx, uPx, d);
      I += 0.16 * exp(-max(d, 0.0) / 0.006);
    } else if (vKind == 1 || vKind == 4) {
      float r = length(p);
      float core = vHalf.x;
      I = (1.0 - smoothstep(core - uPx, core + uPx, r)) * 1.2;
      I += vKind == 1 ? 0.32 * exp(-r / 0.012) + 0.07 * exp(-r / 0.045) : 0.25 * exp(-r / 0.007);
    } else if (vKind == 2) {
      vec2 q = p / max(vHalf, vec2(1e-4));
      float e = dot(q, q);
      float rip = 0.55 + 0.45 * sin(p.y * 520.0 + uTime * 6.0 + p.x * 60.0);
      I = exp(-e * 2.6) * rip * 0.75;
    } else {
      vec2 q = p / max(vHalf, vec2(1e-4));
      I = exp(-dot(q, q) * 2.0);
    }
  } else if (uMode == 1) {
    // out of focus: discs with a slightly brighter rim and a hint of colour fringe
    if (vKind == 3) {
      vec2 q = p / (vHalf + uBlur);
      I = exp(-dot(q, q) * 2.2) * 0.9;
    } else {
      vec2 R = vKind == 2 ? vec2(uBlur * 0.75 + vHalf.x, uBlur * 0.6 + vHalf.y) : vec2(uBlur + max(vHalf.x, vHalf.y) * 0.7);
      vec2 q = p / R;
      float d = length(q);
      float edge = uPx / R.x * 1.5 + 0.02;
      float disc = 1.0 - smoothstep(1.0 - edge, 1.0, d);
      float rim = 1.0 + 0.32 * smoothstep(0.55, 0.97, d);
      // a touch of chromatic fringe at the rim
      float dr = 1.0 - smoothstep(1.0 - edge, 1.0, d * 0.985);
      float db = 1.0 - smoothstep(1.0 - edge, 1.0, d * 1.02);
      float gain = vKind == 0 ? 0.36 : vKind == 1 ? 0.2 : vKind == 2 ? 0.4 : 0.11;
      if (vKind == 2) { disc = exp(-dot(q, q) * 1.6); dr = disc; db = disc; rim = 1.0; }
      outColor = vec4(c * vec3(dr, disc, db) * rim * gain, 1.0);
      return;
    }
  } else {
    // through fog: wide soft glows
    vec2 R = vec2(uBlur) + vHalf * 0.8;
    vec2 q = p / R;
    I = exp(-dot(q, q) * 1.4) * (vKind == 3 ? 0.4 : vKind == 0 ? 0.18 : vKind == 1 ? 0.05 : vKind == 2 ? 0.07 : 0.012);
  }
  outColor = vec4(c * I, 1.0);
}
`,z=`#version 300 es
layout(location = 0) in vec4 aDrop;   // x, y, rx, ry (CSS px)
uniform vec4 uGlass;                  // CSS rect of the target
uniform float uTexel;                 // CSS px per texel
out vec2 vQ;
out float vR;
void main() {
  vec2 r = max(aDrop.zw, vec2(0.05));
  vec2 ext = r * 1.6 + uTexel;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 p = aDrop.xy + corner * ext;
  vQ = corner * ext / r;
  vR = sqrt(r.x * r.y);
  vec2 uv = (p - uGlass.xy) / uGlass.zw;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}
`,_=`#version 300 es
precision highp float;
precision highp int;
in vec2 vQ;
in float vR;
uniform float uRScale;  // 1 in a float target; small in an 8-bit one, so k \xd7 r fits
out vec4 outColor;
void main() {
  float q2 = dot(vQ, vQ) / 2.56;
  if (q2 >= 1.0) discard;
  float k = 1.0 - q2;
  k = k * k * k;
  float kr = k * vR * uRScale;
  outColor = vec4(k, kr, k, kr);
}
`,X=`#version 300 es
precision highp float;
precision highp int;
uniform vec4 uAmount;
out vec4 outColor;
void main() { outColor = uAmount; }
`,U=`#version 300 es
layout(location = 0) in vec4 aSeg;    // x0, y0, x1, y1 (CSS px)
layout(location = 1) in vec4 aParam;  // radius, alpha, kind, softness
uniform vec4 uGlass;
out vec2 vP;
flat out vec4 vSeg;
flat out vec4 vParam;
void main() {
  float reach = aParam.x + aParam.w + 1.0;
  vec2 lo = min(aSeg.xy, aSeg.zw) - reach;
  vec2 hi = max(aSeg.xy, aSeg.zw) + reach;
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 p = mix(lo, hi, corner);
  vP = p;
  vSeg = aSeg;
  vParam = aParam;
  vec2 uv = (p - uGlass.xy) / uGlass.zw;
  gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
}
`,G=`#version 300 es
precision highp float;
precision highp int;
in vec2 vP;
flat in vec4 vSeg;
flat in vec4 vParam;
out vec4 outColor;
void main() {
  vec2 a = vSeg.xy;
  vec2 ab = vSeg.zw - a;
  float l2 = dot(ab, ab);
  float t = l2 > 0.0 ? clamp(dot(vP - a, ab) / l2, 0.0, 1.0) : 0.0;
  float d = length(vP - (a + ab * t));
  float r = vParam.x;
  float soft = vParam.w;
  int kind = int(vParam.z + 0.5);
  float w;
  vec3 target;
  if (kind == 2) {
    w = 1.0 - smoothstep(r - soft, r, d);
    target = vec3(0.0, 1.0, 0.0);
  } else {
    w = 1.0 - smoothstep(r - soft, r + soft, d);
    target = kind == 0 ? vec3(1.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.35);
  }
  float alpha = w * vParam.y;
  if (alpha <= 0.002) discard;
  outColor = vec4(target, alpha);
}
`,Y=`#version 300 es
precision highp float;
precision highp int;
out vec4 outColor;

uniform vec2 uRes;          // canvas, device px
uniform float uScale;       // device px per CSS px
uniform vec4 uCasing;
uniform vec4 uOpening;
uniform vec4 uPanes[3];
uniform int uPaneN;
uniform vec4 uGlass;
uniform vec4 uWood;         // casing width, stile, bottom rail, unit
uniform vec4 uSill;         // x0, x1, y (top of the stool), depth of its top face
uniform vec4 uSill2;        // nose, apron, handle x, handle y
uniform vec4 uSceneRect;    // CSS rect the street textures cover
uniform vec2 uFieldTexel;   // field texel, in uv
uniform float uFieldCss;    // CSS px per field texel
uniform sampler2D uSharp;
uniform sampler2D uBokeh;
uniform sampler2D uFogTex;
uniform sampler2D uField;
uniform sampler2D uFog;
uniform float uNight;
uniform float uFlash;
uniform float uTime;
uniform vec3 uWall;         // the stage colour (linear)
uniform vec2 uFogLevel;     // settled fog: top, bottom
uniform float uLens;        // how far a drop's lens reaches (CSS px)
uniform vec4 uRing;         // the fingertip: x, y, radius, alpha
uniform float uPressed;
uniform float uTile;
uniform float uRScale;
uniform float uSharpScale; // sharp texels per CSS px

const float T = 0.2259;
${P}

vec2 sceneUv(vec2 p) {
  vec2 uv = (p - uSceneRect.xy) / uSceneRect.zw;
  return vec2(uv.x, 1.0 - uv.y);
}
vec2 glassUv(vec2 p) {
  vec2 uv = (p - uGlass.xy) / uGlass.zw;
  return vec2(uv.x, 1.0 - uv.y);
}

float sdBox(vec2 p, vec4 r) {
  vec2 c = r.xy + r.zw * 0.5;
  vec2 d = abs(p - c) - r.zw * 0.5;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/* ---- the room's light ------------------------------------------------ */

// a lamp in the room, up and to the left of the window
const vec3 KEY = vec3(-0.5, -0.42, 0.76);

vec3 keyColor() {
  return mix(vec3(1.0, 0.96, 0.9) * 0.62, vec3(1.0, 0.6, 0.3) * 0.22, uNight);
}
vec3 ambient() {
  return mix(vec3(0.86, 0.89, 0.96) * 0.5, vec3(0.42, 0.33, 0.32) * 0.07, uNight);
}
/** How much of the lamp reaches x (it stands off to the left). */
float lampReach(vec2 p) {
  float x = p.x / max(1.0, uRes.x / uScale);
  return mix(0.9, 1.25, 1.0 - x) * mix(1.0, 1.35 - 0.9 * x, uNight);
}

/* ---- the street through the glass ------------------------------------ */

vec3 outside(vec2 p) { return texture(uBokeh, sceneUv(p)).rgb; }
vec3 outsideFog(vec2 p) { return texture(uFogTex, sceneUv(p)).rgb; }

/* ---- the woodwork: a height field ------------------------------------ */

int paneIndex(vec2 p) {
  for (int i = 0; i < 3; i++) {
    if (i >= uPaneN) break;
    vec4 r = uPanes[i];
    if (p.x >= r.x && p.x <= r.x + r.z && p.y >= r.y && p.y <= r.y + r.w) return i;
  }
  return -1;
}

/** Distance to the nearest pane's edge (outside it), and that pane. */
float paneDist(vec2 p, out int which) {
  float best = 1e5;
  which = 0;
  for (int i = 0; i < 3; i++) {
    if (i >= uPaneN) break;
    float d = sdBox(p, uPanes[i]);
    if (d < best) { best = d; which = i; }
  }
  return best;
}

/** Height of the paintwork at p (px toward the room), or -1 off the woodwork. */
float woodHeight(vec2 p, out float material) {
  material = 0.0;
  float cw = uWood.x;
  float st = uWood.y;
  float dCasing = sdBox(p, uCasing);
  float dOpen = sdBox(p, uOpening);
  if (p.y > uSill.z) return -1.0;
  if (dCasing > 0.0) return -1.0;
  if (dOpen > 0.0) {
    // the casing: a rounded outer edge, a flat face, a cove up to a raised back band
    float de = -dCasing;
    float h = 5.5 * smoothstep(0.0, 2.6, de);
    h += 2.5 * smoothstep(cw * 0.5, cw * 0.78, de);
    h -= 1.4 * smoothstep(cw - 1.6, cw, de);
    return h;
  }
  // inside the opening: the frame and the sashes
  int which;
  float dp = paneDist(p, which);
  float h = 12.0;
  // the putty bevel down to the glass
  float bev = max(2.0, st * 0.32);
  h -= (bev - min(dp, bev)) * 0.9;
  // the gap between the fixed frame and the sash
  float dO = -dOpen;
  float g = st * 0.38;
  h -= 2.2 * exp(-pow((dO - g) / 0.75, 2.0));
  h -= 1.6 * smoothstep(g, 0.0, dO);
  // where two sashes meet: a fine line down the middle
  for (int i = 0; i < 2; i++) {
    if (i + 1 >= uPaneN) break;
    float mid = (uPanes[i].x + uPanes[i].z + uPanes[i + 1].x) * 0.5;
    h -= 2.0 * exp(-pow((p.x - mid) / 0.7, 2.0));
  }
  // the handle: a brass plate and its lever
  vec2 hp = p - uSill2.zw;
  float plate = sdBox(hp, vec4(-st * 0.24, -st * 1.0, st * 0.48, st * 2.0)) - st * 0.12;
  vec2 lv = hp - vec2(0.0, clamp(hp.y, -st * 0.15, st * 1.35));
  float lever = length(lv) - st * 0.2;
  if (plate < 0.0 || lever < 0.0) {
    material = 1.0;
    float hPlate = 15.0 + 1.2 * smoothstep(0.0, -1.6, plate);
    float hLever = 18.5 + 2.0 * sqrt(max(0.0, 1.0 - pow(length(lv) / (st * 0.2), 2.0)));
    h = lever < 0.0 ? max(hLever, plate < 0.0 ? hPlate : 0.0) : hPlate;
  }
  return h;
}

vec3 shadeWood(vec2 p, float h, float m) {
  float m2;
  float e = 0.7;
  float hx = woodHeight(p + vec2(e, 0.0), m2) - h;
  float hy = woodHeight(p + vec2(0.0, e), m2) - h;
  vec3 n = normalize(vec3(-hx / e, -hy / e, 1.0));
  vec3 L = normalize(KEY);
  vec3 V = vec3(0.0, 0.0, 1.0);
  float ndl = max(dot(n, L), 0.0);
  vec3 paint = vec3(0.86, 0.84, 0.8);
  vec3 c = paint * (ambient() * (0.75 + 0.25 * n.z) + keyColor() * ndl * lampReach(p));
  float spec = pow(max(dot(n, normalize(L + V)), 0.0), 36.0) * 0.07;
  c += keyColor() * spec;
  // the faces toward the glass catch the street's light (and the lightning)
  int which;
  float dp = paneDist(p, which);
  vec4 r = uPanes[which];
  vec2 nearest = clamp(p, r.xy, r.xy + r.zw);
  vec2 toGlass = nearest - p;
  float facing = dp > 0.01 ? max(0.0, dot(n.xy, normalize(toGlass))) : 0.0;
  vec3 street = outsideFog(nearest);
  c += paint * street * (facing * 1.2 + 0.08) * exp(-dp / (uWood.y * 1.5)) * (dp < uWood.y * 3.0 ? 1.0 : 0.0);
  if (m > 0.5) {
    // brass: warm, glossy, dark in its flanks
    vec3 brass = vec3(0.62, 0.45, 0.2);
    float fres = pow(1.0 - n.z, 2.0);
    c = brass * (ambient() * 0.6 + keyColor() * ndl * 0.9) + keyColor() * pow(max(dot(n, normalize(L + V)), 0.0), 60.0) * 1.4;
    c += brass * street * 0.4 + brass * fres * 0.15 * keyColor();
  }
  // a little occlusion in the creases
  c *= 0.82 + 0.18 * smoothstep(4.0, 12.0, h);
  return c;
}

/* ---- the sill and the wall ------------------------------------------- */

vec3 shadeSill(vec2 p, out bool hit) {
  hit = false;
  float x0 = uSill.x;
  float x1 = uSill.y;
  float y0 = uSill.z;
  float top = uSill.w;
  float nose = uSill2.x;
  float apron = uSill2.y;
  vec3 paint = vec3(0.86, 0.84, 0.8);
  vec3 street = outsideFog(vec2(clamp(p.x, uGlass.x, uGlass.x + uGlass.z), uGlass.y + uGlass.w - 2.0));
  float ear = 3.0;
  // the stool's top face, seen from a little above
  if (p.y >= y0 && p.y < y0 + top && p.x > x0 && p.x < x1) {
    hit = true;
    float t = (p.y - y0) / top;
    vec3 n = normalize(vec3(0.0, -0.9, 0.45));
    float ndl = max(dot(n, normalize(KEY)), 0.0);
    vec3 c = paint * (ambient() * 1.05 + keyColor() * ndl * lampReach(p) * 0.9);
    // the light from the window falls on it, strongest by the glass
    float under = step(uOpening.x, p.x) * step(p.x, uOpening.x + uOpening.z);
    c += paint * street * (0.9 - 0.5 * t) * (0.35 + 0.65 * under);
    // the frame's shadow on it, from the lamp
    c *= 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.5, t));
    // rounded ends
    float end = min(p.x - x0, x1 - p.x);
    c *= 0.75 + 0.25 * smoothstep(0.0, ear, end);
    return c;
  }
  // its rounded nose
  if (p.y >= y0 + top && p.y < y0 + top + nose && p.x > x0 && p.x < x1) {
    hit = true;
    float t = (p.y - y0 - top) / nose;
    float a = mix(-1.2, 1.3, t);
    vec3 n = normalize(vec3(0.0, sin(a), cos(a)));
    float ndl = max(dot(n, normalize(KEY)), 0.0);
    vec3 c = paint * (ambient() * (0.6 + 0.4 * n.z) + keyColor() * ndl * lampReach(p));
    c += keyColor() * pow(max(dot(n, normalize(normalize(KEY) + vec3(0, 0, 1))), 0.0), 30.0) * 0.08;
    float end = min(p.x - x0, x1 - p.x);
    c *= 0.75 + 0.25 * smoothstep(0.0, ear, end);
    return c;
  }
  // the apron under it, in the stool's shadow
  if (p.y >= y0 + top + nose && p.y < y0 + top + nose + apron && p.x > uCasing.x && p.x < uCasing.x + uCasing.z) {
    hit = true;
    float t = (p.y - y0 - top - nose) / apron;
    vec3 c = paint * (ambient() * 0.85 + keyColor() * 0.55 * lampReach(p));
    c *= 0.55 + 0.45 * smoothstep(0.0, 0.8, t);
    float edge = min(p.x - uCasing.x, uCasing.x + uCasing.z - p.x);
    c *= 0.8 + 0.2 * smoothstep(0.0, 2.0, edge);
    return c;
  }
  return vec3(0.0);
}

vec3 shadeWall(vec2 p) {
  vec3 c = uWall;
  // the woodwork stands off the wall: a soft shadow down and to the right
  vec2 off = vec2(5.0, 6.0) * (0.6 + 0.4 * uWood.w);
  vec4 body = vec4(uCasing.x, uCasing.y, uCasing.z, uSill.z + uSill.w + uSill2.x - uCasing.y);
  float d = sdBox(p - off, body);
  float sh = 1.0 - smoothstep(-6.0, 16.0, d);
  float ds = sdBox(p - vec2(0.0, 5.0), vec4(uSill.x, uSill.z, uSill.y - uSill.x, uSill.w + uSill2.x + uSill2.y));
  sh = max(sh, (1.0 - smoothstep(-2.0, 12.0, ds)) * 0.9);
  float contact = exp(-max(sdBox(p, body), 0.0) / 3.0);
  c *= 1.0 - mix(0.07, 0.3, uNight) * sh - 0.06 * contact;
  // the lamp's glow on the wall in the evening
  vec2 lamp = vec2(-0.15, 0.25) * vec2(uRes.x / uScale, uRes.y / uScale);
  float g = exp(-length(p - lamp) / (uRes.x / uScale * 0.42));
  c += vec3(0.05, 0.022, 0.008) * g * uNight * (1.0 - 0.5 * sh) * (1.0 - uTile * 0.5);
  // lightning spills through the window
  float near = exp(-max(0.0, sdBox(p, uCasing)) / 70.0);
  c += uFlash * vec3(0.12, 0.13, 0.17) * near * (1.0 - sh * 0.7) * mix(0.3, 1.0, uNight);
  return c;
}

/* ---- the glass ------------------------------------------------------- */

/** The settled fog's density (fog.ts's fogBase, with a patchy noise). */
float fogBase(vec2 p, int i) {
  vec4 r = uPanes[i];
  float v = (p.y - r.y) / r.w;
  // the cold frame fogs first, at the sides and the bottom (warm air keeps the top clearer)
  float edge = min(min(p.x - r.x, r.x + r.z - p.x), r.y + r.w - p.y) / uWood.w;
  float d = uFogLevel.x + (uFogLevel.y - uFogLevel.x) * smoothstep(0.3, 0.92, v) + 0.3 * exp(-max(0.0, edge) / 24.0);
  vec2 q = p / (uWood.w * 70.0);
  d += (vnoise(q) * 0.65 + vnoise(q * 2.7 + 5.3) * 0.35 - 0.5) * 0.22;
  return clamp(d, 0.0, 1.0);
}

struct Lens { float mask; vec3 n; float r; };

/** The drop under p in one layer of the field (x = field, y = field \xd7 radius). */
Lens lens(vec4 c, vec4 px, vec4 nx, vec4 py, vec4 ny, bool inner) {
  Lens L;
  float F = inner ? c.b : c.r;
  float FR = inner ? c.a : c.g;
  vec2 g = inner ? vec2(px.b - nx.b, py.b - ny.b) : vec2(px.r - nx.r, py.r - ny.r);
  g /= 2.0 * uFieldCss;
  float aa = length(g) / uScale * 0.9 + 1e-4;
  L.mask = smoothstep(T - aa, T + aa, F);
  L.r = FR / max(F, 1e-3) / uRScale;
  float u = clamp((F - T) / (1.0 - T), 0.0, 1.0);
  vec2 slope = g * L.r * 1.25 * pow(max(u, 0.035), -0.42);
  L.n = normalize(vec3(-slope, 1.0));
  return L;
}

vec3 shadeGlass(vec2 p, int pane) {
  vec2 uv = glassUv(p);
  vec4 c = textureLod(uField, uv, 0.0);
  vec4 px = textureLod(uField, uv + vec2(uFieldTexel.x, 0.0), 0.0);
  vec4 nx = textureLod(uField, uv - vec2(uFieldTexel.x, 0.0), 0.0);
  // texture v runs up: +v is up the glass (smaller CSS y)
  vec4 py = textureLod(uField, uv - vec2(0.0, uFieldTexel.y), 0.0);
  vec4 ny = textureLod(uField, uv + vec2(0.0, uFieldTexel.y), 0.0);
  Lens o = lens(c, px, nx, py, ny, false);
  Lens i = lens(c, px, nx, py, ny, true);
  vec4 fog = texture(uFog, uv);

  vec3 L = normalize(KEY);
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));

  // the condensation's beads bend the view a little
  vec2 q = p - i.n.xy * uLens * 0.35 * i.mask;
  // a fresh wipe leaves a thin wet film, faintly streaked
  if (fog.b > 0.01) q += (vec2(vnoise(p * vec2(0.9, 0.12)), vnoise(p * vec2(0.12, 0.9) + 7.0)) - 0.5) * 3.0 * fog.b;

  // through clear glass: the street out of focus
  vec3 view = outside(q);
  // through a raindrop: the street in focus, upside down, small
  vec2 dq = q - o.n.xy * uLens;
  // a drop shrinks a wide view into itself: pick the mip for that, a little
  // on the sharp side (they are jewels, not blurs)
  float lod = clamp(log2(uLens / max(o.r, 0.4) * uSharpScale) - 2.0, 0.0, 5.0);
  vec3 drop = textureLod(uSharp, sceneUv(dq), lod).rgb * 1.18;
  float edge = length(o.n.xy);
  drop *= 1.0 - 0.62 * smoothstep(0.5, 0.97, edge);
  // the sky reflected in the drop's rim, and the room lamp's glint
  float fres = 0.04 + 0.5 * pow(1.0 - o.n.z, 4.0);
  drop += fres * mix(vec3(0.3, 0.32, 0.4), vec3(0.06, 0.045, 0.05), uNight);
  drop += keyColor() * (pow(max(dot(o.n, H), 0.0), 90.0) * 1.8 + pow(max(dot(o.n, H), 0.0), 12.0) * 0.06);
  drop += uFlash * vec3(0.5, 0.55, 0.7) * (0.35 + edge);
  vec3 clear = mix(view, drop, o.mask);

  // the fog: thick low down, thin up top; wiped where you wiped, creeping back grain by grain
  // (soft islands of frost at two sizes, so it closes in like breath, not like a wipe in reverse)
  float n = 0.18 + 0.38 * vnoise(p / (uWood.w * 7.0) + 3.1) + 0.26 * vnoise(p / (uWood.w * 22.0) + 9.7);
  n = mix(n, 0.95, 0.35 * exp(-max(0.0, min(min(p.x - uPanes[pane].x, uPanes[pane].x + uPanes[pane].z - p.x), uPanes[pane].y + uPanes[pane].w - p.y)) / (uWood.w * 30.0)));
  float wiped = smoothstep(n - 0.2, n + 0.2, fog.r);
  float density = max(fogBase(p, pane) * (1.0 - wiped), fog.g);
  density *= 1.0 - i.mask;
  // what fog looks like: the street as glows, the room's light scattered in it, a frost of grain
  vec3 behind = outsideFog(q);
  float blobs = smoothstep(0.08, 0.45, textureLod(uField, uv, 2.5).r);
  behind *= 1.0 - 0.1 * blobs;
  vec3 milk = mix(vec3(0.58, 0.62, 0.7) * 0.095, vec3(0.24, 0.15, 0.11) * 0.05, uNight) * lampReach(p);
  milk += uFlash * vec3(0.35, 0.37, 0.45);
  float grain = hash12(floor(p * 1.4));
  float lum = dot(behind, vec3(0.3, 0.55, 0.15));
  vec3 frosted = mix(behind, vec3(lum), 0.35) * mix(0.56, 0.36, uNight) + milk + milk * (grain * grain * grain) * 0.5;
  // the frame's shadow in the fog (the fog takes the room's light, so it shows)
  float dEdge = min(min(p.x - uPanes[pane].x, uPanes[pane].x + uPanes[pane].z - p.x), min(p.y - uPanes[pane].y, uPanes[pane].y + uPanes[pane].w - p.y));
  frosted *= 1.0 - 0.2 * exp(-dEdge / (5.0 * uWood.w + 2.0));
  vec3 col = mix(clear, frosted, density);

  // the condensation's own drops: clear little lenses in the fog
  if (i.mask > 0.001) {
    // clear water on the inside: the street through it, bent and a little magnified
    vec2 bq = p - i.n.xy * uLens * 0.45;
    float blod = clamp(log2(uLens * 0.45 / max(i.r, 0.4) * uSharpScale) - 1.0, 0.0, 5.0);
    vec3 bead = mix(outside(bq), textureLod(uSharp, sceneUv(bq), blod).rgb, 0.35) * 1.1;
    bead *= 1.0 - 0.28 * smoothstep(0.55, 0.97, length(i.n.xy));
    // they sit on the room side, so they catch the room's lamp: a glint and a warm rim
    bead += keyColor() * (pow(max(dot(i.n, H), 0.0), 80.0) * 1.6 + pow(max(dot(i.n, H), 0.0), 10.0) * 0.08);
    bead += pow(1.0 - i.n.z, 3.0) * (milk * 2.0 + keyColor() * 0.12);
    col = mix(col, bead, i.mask);
  }
  // the room, faintly mirrored in the dark glass
  vec2 lampImg = vec2(uGlass.x - uGlass.z * 0.1, uGlass.y + uGlass.w * 0.75);
  float refl = exp(-length((p - lampImg) / vec2(uGlass.z * 0.35, uGlass.w * 0.5)));
  col += vec3(0.05, 0.025, 0.01) * refl * uNight * (1.0 - 0.7 * density);
  // a wipe still wet shines a little
  if (fog.b > 0.01) col += keyColor() * 0.035 * fog.b * (0.4 + vnoise(p * vec2(0.05, 0.6)));
  return col;
}

/* ---- output ---------------------------------------------------------- */

vec3 tone(vec3 x) {
  // identity up to 0.9, then a soft shoulder (keeps the stage colour exact)
  vec3 a = vec3(0.9);
  vec3 over = max(x - a, 0.0);
  return min(x, a) + (1.0 - a) * (1.0 - exp(-over / (1.0 - a)));
}
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec3 col;
  int pane = paneIndex(p);
  if (pane >= 0) {
    col = shadeGlass(p, pane);
  } else {
    bool sill;
    col = shadeSill(p, sill);
    if (!sill) {
      float m;
      float h = woodHeight(p, m);
      col = h >= 0.0 ? shadeWood(p, h, m) : shadeWall(p);
    }
  }
  // the fingertip
  if (uRing.w > 0.001) {
    float d = length(p - uRing.xy) - uRing.z;
    float line = 1.0 - smoothstep(0.0, 1.1, abs(d));
    float halo = (1.0 - smoothstep(0.0, 4.0, abs(d - 1.5))) * 0.5;
    col *= 1.0 - halo * 0.35 * uRing.w;
    col = mix(col, vec3(1.0, 0.98, 0.95), line * 0.55 * uRing.w);
    col += vec3(1.0) * (1.0 - smoothstep(-uRing.z, 0.0, d)) * 0.04 * uRing.w * uPressed;
  }
  col = toSrgb(tone(col));
  col += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}
`,O={sharp:.5,bokeh:.62,fog:.25,fogMap:.5},H={sharp:.75,bokeh:.9,fog:.4,fogMap:.75};class W{gl;tile;float;base;cars;lights;field;fade;stamp;comp;uBase;uCars;uLights;uField;uFade;uStamp;uComp;emptyVao;lightVao;lightBuf;carVao;carBuf;outerVao;outerBuf;outerCap=0;innerVao;innerBuf;innerCap=0;stampVao;stampBuf;sharp=null;bokeh=null;fogScene=null;baseSharp=null;baseBokeh=null;baseFog=null;baseSig=new Float32Array(6).fill(NaN);fieldT=null;fogMap=null;panes=new Float32Array(12);paneN=1;glass=new Float32Array(4);casing=new Float32Array(4);opening=new Float32Array(4);wood=new Float32Array(4);sill=new Float32Array(4);sill2=new Float32Array(4);sceneRect=new Float32Array(4);domain=new Float32Array(4);lens=100;glassH=1;cssW=1;pxW=1;pxH=1;fieldScale=1;accR=0;accG=0;accB=0;fogCleared=!1;constructor(e,t){this.gl=e,this.tile=t,this.float=!!e.getExtension("EXT_color_buffer_float"),this.base=(0,b.createProgram)(e,E,L),this.cars=(0,b.createProgram)(e,D,V),this.lights=(0,b.createProgram)(e,q,I),this.field=(0,b.createProgram)(e,z,_),this.fade=(0,b.createProgram)(e,E,X),this.stamp=(0,b.createProgram)(e,U,G),this.comp=(0,b.createProgram)(e,E,Y),this.uBase=(0,b.uniformLocations)(e,this.base),this.uCars=(0,b.uniformLocations)(e,this.cars),this.uLights=(0,b.uniformLocations)(e,this.lights),this.uField=(0,b.uniformLocations)(e,this.field),this.uFade=(0,b.uniformLocations)(e,this.fade),this.uStamp=(0,b.uniformLocations)(e,this.stamp),this.uComp=(0,b.uniformLocations)(e,this.comp);const i=()=>{let t=e.createVertexArray();if(!t)throw Error("rain-window: no vertex array");return t},a=t=>{let i=e.createBuffer();if(!i)throw Error("rain-window: no buffer");return e.bindBuffer(e.ARRAY_BUFFER,i),e.bufferData(e.ARRAY_BUFFER,t,e.DYNAMIC_DRAW),i};this.emptyVao=i(),this.lightVao=i(),e.bindVertexArray(this.lightVao),this.lightBuf=a(28800),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,4,e.FLOAT,!1,32,0),e.vertexAttribDivisor(0,1),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,32,16),e.vertexAttribDivisor(1,1),this.carVao=i(),e.bindVertexArray(this.carVao),this.carBuf=a(64),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,4,e.FLOAT,!1,16,0),e.vertexAttribDivisor(0,1),this.outerVao=i(),e.bindVertexArray(this.outerVao),this.outerBuf=a(16),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,4,e.FLOAT,!1,16,0),e.vertexAttribDivisor(0,1),this.innerVao=i(),e.bindVertexArray(this.innerVao),this.innerBuf=a(16),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,4,e.FLOAT,!1,16,0),e.vertexAttribDivisor(0,1),this.stampVao=i(),e.bindVertexArray(this.stampVao),this.stampBuf=a(16384),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,4,e.FLOAT,!1,32,0),e.vertexAttribDivisor(0,1),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,4,e.FLOAT,!1,32,16),e.vertexAttribDivisor(1,1),e.bindVertexArray(null)}makeTarget(e,t,i,a){let s=this.gl,r=s.createTexture(),n=s.createFramebuffer();if(!r||!n)throw Error("rain-window: no render target");return e=Math.max(2,Math.min(2048,Math.round(e))),t=Math.max(2,Math.min(2048,Math.round(t))),s.bindTexture(s.TEXTURE_2D,r),i&&this.float?s.texImage2D(s.TEXTURE_2D,0,s.RGBA16F,e,t,0,s.RGBA,s.HALF_FLOAT,null):s.texImage2D(s.TEXTURE_2D,0,s.RGBA8,e,t,0,s.RGBA,s.UNSIGNED_BYTE,null),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,a?s.LINEAR_MIPMAP_LINEAR:s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MAG_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE),a&&s.generateMipmap(s.TEXTURE_2D),s.bindFramebuffer(s.FRAMEBUFFER,n),s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,r,0),s.clearColor(0,0,0,0),s.clear(s.COLOR_BUFFER_BIT),s.bindFramebuffer(s.FRAMEBUFFER,null),{tex:r,fbo:n,w:e,h:t,mips:a}}dropTarget(e){e&&(this.gl.deleteTexture(e.tex),this.gl.deleteFramebuffer(e.fbo))}setSize(e,t,i,a,s){this.pxW=e,this.pxH=t,this.cssW=i,this.fieldScale=s,this.paneN=a.paneCount,this.panes.fill(0);for(let e=0;e<a.paneCount;e++){let t=a.panes[e];this.panes.set([t.x,t.y,t.w,t.h],4*e)}this.glass.set([a.glass.x,a.glass.y,a.glass.w,a.glass.h]),this.casing.set([a.casing.x,a.casing.y,a.casing.w,a.casing.h]),this.opening.set([a.opening.x,a.opening.y,a.opening.w,a.opening.h]),this.wood.set([a.casingW,a.stile,a.bottomRail,a.unit]),this.sill.set([a.sillX0,a.sillX1,a.sillY,a.sillTop]),this.sill2.set([a.nose,a.apron,a.handleX,a.handleY]),this.glassH=Math.max(1,a.glass.h),this.lens=.13*this.glassH;let r=1.15*this.lens+24,n=a.glass.x-r,o=a.glass.y-r,l=a.glass.w+2*r,h=a.glass.h+2*r;this.sceneRect.set([n,o,l,h]);let c=a.glass.x+a.glass.w/2,u=a.glass.y+a.glass.h/2;this.domain.set([(n-c)/this.glassH,(o-u)/this.glassH+-.1,l/this.glassH,h/this.glassH]);let f=this.tile?H:O;this.sharp=this.ensure(this.sharp,l*f.sharp,h*f.sharp,!0,!0),this.bokeh=this.ensure(this.bokeh,l*f.bokeh,h*f.bokeh,!0,!1),this.fogScene=this.ensure(this.fogScene,l*f.fog,h*f.fog,!0,!1),this.baseSharp=this.ensure(this.baseSharp,l*f.sharp,h*f.sharp,!0,!1),this.baseBokeh=this.ensure(this.baseBokeh,l*f.bokeh,h*f.bokeh,!0,!1),this.baseFog=this.ensure(this.baseFog,l*f.fog,h*f.fog,!0,!1),this.baseSig.fill(NaN),this.fieldT=this.ensure(this.fieldT,a.glass.w*s,a.glass.h*s,!0,!0);let d=this.ensure(this.fogMap,a.glass.w*f.fogMap,a.glass.h*f.fogMap,!1,!1);d!==this.fogMap&&(this.fogCleared=!0),this.fogMap=d}ensure(e,t,i,a,s){let r=Math.max(2,Math.min(2048,Math.round(t))),n=Math.max(2,Math.min(2048,Math.round(i)));return e&&e.w===r&&e.h===n?e:(this.dropTarget(e),this.makeTarget(r,n,a,s))}sceneRange(e){return e.x0=this.domain[0],e.x1=this.domain[0]+this.domain[2],e}takeFogReset(){let e=this.fogCleared;return this.fogCleared=!1,e}bind(e){let t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,e.fbo),t.viewport(0,0,e.w,e.h)}baseChanged(e){let t=this.baseSig,i=e.night,a=e.flash,s=e.flashX,r=e.parX,n=e.parY,o=!(.001>=Math.abs(t[0]-i))||!(.002>=Math.abs(t[1]-a))||!(.001>=Math.abs(t[2]-s))||!(2e-4>=Math.abs(t[3]-r))||!(2e-4>=Math.abs(t[4]-n));return o&&(t[0]=i,t[1]=a,t[2]=s,t[3]=r,t[4]=n),o}drawScene(e,t){let i=this.gl;if(!this.sharp||!this.bokeh||!this.fogScene||!this.baseSharp||!this.baseBokeh||!this.baseFog)return;let a=this.domain,s=e.fill(a[0]-.2,a[0]+a[2]+.2,t.parX,t.parY);i.bindBuffer(i.ARRAY_BUFFER,this.lightBuf),s>0&&i.bufferSubData(i.ARRAY_BUFFER,0,e.out,0,8*s),i.bindBuffer(i.ARRAY_BUFFER,this.carBuf),i.bufferSubData(i.ARRAY_BUFFER,0,e.carBodies);let r=this.baseChanged(t);i.disable(i.DEPTH_TEST);for(let n=0;n<3;n++){let o=0===n?this.sharp:1===n?this.bokeh:this.fogScene,l=0===n?this.baseSharp:1===n?this.baseBokeh:this.baseFog,h=a[3]/o.h,c=0===n?.8*h:1===n?.036:.19,u=0===n?.8*h:1===n?.55*c:.7*c;if(r){this.bind(l),i.disable(i.BLEND),i.useProgram(this.base);let s=this.uBase;i.uniform4fv(s("uDomain"),a),i.uniform1f(s("uBlur"),u),i.uniform1f(s("uNight"),t.night),i.uniform1f(s("uFlash"),t.flash),i.uniform1f(s("uFlashX"),t.flashX),i.uniform2f(s("uPar"),t.parX,t.parY),i.uniform4fv(s("uB"),e.buildings),i.uniform4fv(s("uG"),e.grids),i.uniform1fv(s("uF"),e.floors),i.uniform1i(s("uBN"),e.buildingN),i.uniform4fv(s("uAwn"),e.awnings),i.uniform4fv(s("uLamp"),e.lamps),i.uniform1i(s("uLampN"),e.lampN),i.uniform3fv(s("uTower"),e.tower),i.uniform2fv(s("uTraffic"),e.traffic),i.bindVertexArray(this.emptyVao),i.drawArrays(i.TRIANGLES,0,3)}if(i.bindFramebuffer(i.READ_FRAMEBUFFER,l.fbo),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,o.fbo),i.blitFramebuffer(0,0,l.w,l.h,0,0,o.w,o.h,i.COLOR_BUFFER_BIT,i.NEAREST),this.bind(o),i.enable(i.BLEND),i.blendEquation(i.FUNC_ADD),0===n){i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE),i.useProgram(this.cars);let e=this.uCars;i.uniform4fv(e("uDomain"),a),i.uniform1f(e("uBlur"),u),i.uniform1f(e("uNight"),t.night),i.uniform2f(e("uPar"),t.parX,t.parY),i.bindVertexArray(this.carVao),i.drawArraysInstanced(i.TRIANGLE_STRIP,0,4,4)}if(s>0){i.blendFunc(i.ONE,i.ONE),i.useProgram(this.lights);let e=this.uLights;i.uniform4fv(e("uDomain"),a),i.uniform1f(e("uBlur"),c),i.uniform1i(e("uMode"),n),i.uniform1f(e("uPx"),h),i.uniform1f(e("uTime"),t.time),i.bindVertexArray(this.lightVao),i.drawArraysInstanced(i.TRIANGLE_STRIP,0,4,s)}}i.disable(i.BLEND),i.bindTexture(i.TEXTURE_2D,this.sharp.tex),i.generateMipmap(i.TEXTURE_2D),i.bindVertexArray(null)}upload(e,t){let i=this.gl,a=t.instanceCount,s="outer"===e?this.outerBuf:this.innerBuf;if(i.bindBuffer(i.ARRAY_BUFFER,s),a>("outer"===e?this.outerCap:this.innerCap)){let s=Math.max(a,t.instances.length/4);i.bufferData(i.ARRAY_BUFFER,16*s,i.DYNAMIC_DRAW),"outer"===e?this.outerCap=s:this.innerCap=s}a>0&&i.bufferSubData(i.ARRAY_BUFFER,0,t.instances,0,4*a)}drawField(e,t,i,a){let s=this.gl,r=this.fieldT;if(!r)return;i&&this.upload("outer",e),a&&this.upload("inner",t),this.bind(r),s.clearColor(0,0,0,0),s.clear(s.COLOR_BUFFER_BIT),s.enable(s.BLEND),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ONE),s.useProgram(this.field);let n=this.uField;s.uniform4fv(n("uGlass"),this.glass),s.uniform1f(n("uTexel"),1/this.fieldScale),s.uniform1f(n("uRScale"),this.float?1:1/24),e.instanceCount>0&&(s.colorMask(!0,!0,!1,!1),s.bindVertexArray(this.outerVao),s.drawArraysInstanced(s.TRIANGLE_STRIP,0,4,e.instanceCount)),t.instanceCount>0&&(s.colorMask(!1,!1,!0,!0),s.bindVertexArray(this.innerVao),s.drawArraysInstanced(s.TRIANGLE_STRIP,0,4,t.instanceCount)),s.colorMask(!0,!0,!0,!0),s.disable(s.BLEND),s.bindTexture(s.TEXTURE_2D,r.tex),s.generateMipmap(s.TEXTURE_2D),s.bindVertexArray(null)}updateFog(e,t,i){let a=this.gl,s=this.fogMap;if(!s)return;let r=i?t:0;this.accR+=r/7.5*255,this.accG+=r/6*255,this.accB+=r/1.6*255;let n=Math.floor(this.accR),o=Math.floor(this.accG),l=Math.floor(this.accB);this.accR-=n,this.accG-=o,this.accB-=l,(n+o+l!==0||0!==e.count)&&(this.bind(s),a.enable(a.BLEND),n+o+l>0&&(a.blendEquation(a.FUNC_REVERSE_SUBTRACT),a.blendFunc(a.ONE,a.ONE),a.useProgram(this.fade),a.uniform4f(this.uFade("uAmount"),n/255,o/255,l/255,0),a.bindVertexArray(this.emptyVao),a.drawArrays(a.TRIANGLES,0,3)),e.count>0&&(a.blendEquation(a.FUNC_ADD),a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ZERO,a.ONE),a.useProgram(this.stamp),a.uniform4fv(this.uStamp("uGlass"),this.glass),a.bindBuffer(a.ARRAY_BUFFER,this.stampBuf),a.bufferSubData(a.ARRAY_BUFFER,0,e.data,0,8*e.count),a.bindVertexArray(this.stampVao),a.drawArraysInstanced(a.TRIANGLE_STRIP,0,4,e.count)),a.disable(a.BLEND),a.blendEquation(a.FUNC_ADD),a.bindVertexArray(null))}composite(e){let t=this.gl;if(!this.sharp||!this.bokeh||!this.fogScene||!this.fieldT||!this.fogMap)return;t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.pxW,this.pxH),t.disable(t.BLEND),t.useProgram(this.comp);let i=this.uComp;t.uniform2f(i("uRes"),this.pxW,this.pxH),t.uniform1f(i("uScale"),this.pxW/Math.max(1,this.cssW)),t.uniform4fv(i("uCasing"),this.casing),t.uniform4fv(i("uOpening"),this.opening),t.uniform4fv(i("uPanes"),this.panes),t.uniform1i(i("uPaneN"),this.paneN),t.uniform4fv(i("uGlass"),this.glass),t.uniform4fv(i("uWood"),this.wood),t.uniform4fv(i("uSill"),this.sill),t.uniform4fv(i("uSill2"),this.sill2),t.uniform4fv(i("uSceneRect"),this.sceneRect),t.uniform2f(i("uFieldTexel"),1/this.fieldT.w,1/this.fieldT.h),t.uniform1f(i("uFieldCss"),this.glass[2]/this.fieldT.w),t.uniform1f(i("uNight"),e.night),t.uniform1f(i("uFlash"),e.flash),t.uniform1f(i("uTime"),e.time),t.uniform3fv(i("uWall"),e.wall),t.uniform2f(i("uFogLevel"),e.fogLo,e.fogHi),t.uniform1f(i("uLens"),this.lens),t.uniform4fv(i("uRing"),e.ring),t.uniform1f(i("uPressed"),e.pressed),t.uniform1f(i("uTile"),+!!this.tile),t.uniform1f(i("uRScale"),this.float?1:1/24),t.uniform1f(i("uSharpScale"),this.sharp.w/Math.max(1,this.sceneRect[2])),this.bindTex(0,"uSharp",this.sharp.tex),this.bindTex(1,"uBokeh",this.bokeh.tex),this.bindTex(2,"uFogTex",this.fogScene.tex),this.bindTex(3,"uField",this.fieldT.tex),this.bindTex(4,"uFog",this.fogMap.tex),t.bindVertexArray(this.emptyVao),t.drawArrays(t.TRIANGLES,0,3),t.bindVertexArray(null),t.activeTexture(t.TEXTURE0)}bindTex(e,t,i){let a=this.gl;a.activeTexture(a.TEXTURE0+e),a.bindTexture(a.TEXTURE_2D,i),a.uniform1i(this.uComp(t),e)}dispose(){let e=this.gl;for(let e of[this.sharp,this.bokeh,this.fogScene,this.baseSharp,this.baseBokeh,this.baseFog,this.fieldT,this.fogMap])this.dropTarget(e);for(let t of(this.sharp=this.bokeh=this.fogScene=this.fieldT=this.fogMap=null,this.baseSharp=this.baseBokeh=this.baseFog=null,[this.base,this.cars,this.lights,this.field,this.fade,this.stamp,this.comp]))e.deleteProgram(t);for(let t of[this.lightBuf,this.carBuf,this.outerBuf,this.innerBuf,this.stampBuf])e.deleteBuffer(t);for(let t of[this.emptyVao,this.lightVao,this.carVao,this.outerVao,this.innerVao,this.stampVao])e.deleteVertexArray(t)}}function j(){return(0,s.audioReady)()?(0,s.getAudio)():null}let K=new WeakMap;function $(e){let t=e.createBufferSource();return t.buffer=(0,s.noiseBuffer)(e,2),t.loop=!0,t}let Q=[{hiss:.05,hush:.05,patter:.32},{hiss:.09,hush:.09,patter:.5},{hiss:.15,hush:.16,patter:.62}];class Z{ctx=null;out=null;hiss=null;hush=null;patter=null;sources=[];rub=null;rubFilter=null;squeak=null;squeakFilter=null;playing=!1;start(e,t){if(this.playing)return;let{ctx:i,output:a}=e;this.ctx=i;let s=i.currentTime,r=i.createGain();r.gain.setValueAtTime(0,s),r.gain.linearRampToValueAtTime(1,s+2.4),r.connect(a),this.out=r;let n=$(i),o=i.createBiquadFilter();o.type="highpass",o.frequency.value=380;let l=i.createBiquadFilter();l.type="lowpass",l.frequency.value=2600,l.Q.value=.3,this.hiss=i.createGain(),n.connect(o).connect(l).connect(this.hiss).connect(r);let h=$(i),c=i.createBiquadFilter();c.type="lowpass",c.frequency.value=260,this.hush=i.createGain(),h.connect(c).connect(this.hush).connect(r),h.playbackRate.value=.83;let u=i.createBufferSource();u.buffer=function(e){let t=K.get(e);if(t)return t;let i=e.sampleRate,a=Math.floor(4*i),s=e.createBuffer(2,a,i),r=s.getChannelData(0),n=s.getChannelData(1),o=0x1f2e3d4c,l=()=>(o^=o<<13,o^=o>>>17,((o^=o<<5)>>>0)/0x100000000),h=0;for(;;){let e=Math.floor((h+=-Math.log(1-.999*l())/46)*i);if(e>=a)break;let t=l(),s=.05+.5*t*t*t,o=(.002+.006*l())*i,c=l(),u=Math.cos(c*Math.PI*.5),f=Math.sin(c*Math.PI*.5),d=2*Math.PI*(1800+2600*l()),p=0,g=0,m=Math.min(a-e,Math.floor(6*o));for(let t=0;t<m;t++){let h=Math.exp(-t/o),c=2*l()-1;g=.82*(g+c-p),p=c;let m=s*h*(.7*g+.35*Math.sin(d*t/i)),x=(e+t)%a;r[x]+=m*u,n[x]+=m*f}}return K.set(e,s),s}(i),u.loop=!0;let f=i.createBiquadFilter();f.type="lowpass",f.frequency.value=5200,this.patter=i.createGain(),u.connect(f).connect(this.patter).connect(r);let d=$(i);d.playbackRate.value=1.13,this.rubFilter=i.createBiquadFilter(),this.rubFilter.type="bandpass",this.rubFilter.frequency.value=700,this.rubFilter.Q.value=.9,this.rub=i.createGain(),this.rub.gain.value=0,d.connect(this.rubFilter).connect(this.rub).connect(r),this.squeakFilter=i.createBiquadFilter(),this.squeakFilter.type="bandpass",this.squeakFilter.frequency.value=2300,this.squeakFilter.Q.value=7,this.squeak=i.createGain(),this.squeak.gain.value=0,d.connect(this.squeakFilter).connect(this.squeak).connect(r);let p=Math.random();n.start(s,p),h.start(s,1.7*p),u.start(s,3.5*Math.random()),d.start(s,.5*p),this.sources=[n,h,u,d],this.playing=!0,this.setLevel(t,!0)}setLevel(e,t=!1){let i=this.ctx;if(!i||!this.hiss||!this.hush||!this.patter)return;let a=Q[Math.max(0,Math.min(2,e))],s=i.currentTime,r=t?.01:.6;this.hiss.gain.setTargetAtTime(a.hiss,s,r),this.hush.gain.setTargetAtTime(a.hush,s,r),this.patter.gain.setTargetAtTime(a.patter,s,r)}setRub(e,t){let i=this.ctx;if(!i||!this.rub||!this.rubFilter||!this.squeak||!this.squeakFilter)return;let a=i.currentTime,s=Math.min(1,e/1400),r=s>.01?.05+.32*Math.sqrt(s)*(.55+.45*t):0;this.rub.gain.setTargetAtTime(r,a,.03),this.rubFilter.frequency.setTargetAtTime(520+900*s,a,.05),this.squeak.gain.setTargetAtTime(s>.35?(s-.35)*.05*(1-.7*t):0,a,.04),this.squeakFilter.frequency.setTargetAtTime(1900+900*s,a,.08)}stop(){if(!this.playing||!this.ctx||!this.out)return;let e=this.ctx.currentTime,t=this.out;for(let i of(t.gain.cancelScheduledValues(e),t.gain.setValueAtTime(t.gain.value,e),t.gain.linearRampToValueAtTime(0,e+.5),this.sources))try{i.stop(e+.55)}catch{}window.setTimeout(()=>t.disconnect(),700),this.sources=[],this.out=null,this.hiss=this.hush=this.patter=this.rub=this.squeak=null,this.rubFilter=this.squeakFilter=null,this.playing=!1}}function J(e,t,i){if("function"!=typeof e.createStereoPanner)return t;let a=e.createStereoPanner();return a.pan.value=Math.max(-.8,Math.min(.8,i)),a.connect(t),a}class ee{cfg;unit=1;wind=0;panes=new Float32Array(12);paneN=0;gx=0;gy=0;gw=1;gh=1;x;y;r;vx;vy;wob;wobV;wander;wanderT;trailD;trailN;loose;sit;pane;knockId;alive;free;freeN=0;high=0;drops=0;cell=10;cols=0;rows=0;cap=4;bx=new Float32Array(0);by=new Float32Array(0);br=new Float32Array(0);bn=new Uint8Array(0);beads=0;dCell=24;dCols=0;dRows=0;dHead=new Int32Array(0);dNext;indexed=!1;kx=new Float32Array(4);ky=new Float32Array(4);kAge=new Float32Array(4);kStrength=new Float32Array(4);kReach=new Float32Array(4);kSerial=new Int32Array(4);serial=0;shake=0;nextImpact=0;instances;instanceCount=0;lanes;laneCount=0;dirty=!0;seed;rngState;constructor(e){this.cfg=e;const t=e.capacity;this.x=new Float32Array(t),this.y=new Float32Array(t),this.r=new Float32Array(t),this.vx=new Float32Array(t),this.vy=new Float32Array(t),this.wob=new Float32Array(t),this.wobV=new Float32Array(t),this.wander=new Float32Array(t),this.wanderT=new Float32Array(t),this.trailD=new Float32Array(t),this.trailN=new Float32Array(t),this.loose=new Float32Array(t),this.sit=new Uint8Array(t),this.pane=new Int8Array(t),this.knockId=new Int32Array(t),this.alive=new Uint8Array(t),this.free=new Int32Array(t),this.dNext=new Int32Array(t),this.instances=new Float32Array(0),this.lanes=new Float32Array(5*t),this.seed=e.seed>>>0,this.rngState=this.seed,this.reset()}rand(){let e=this.rngState=this.rngState+0x6d2b79f5>>>0;return e=Math.imul(e^e>>>15,1|e),(((e^=e+Math.imul(e^e>>>7,61|e))^e>>>14)>>>0)/0x100000000}setBounds(e){this.unit=e.unit,this.paneN=e.paneCount;for(let t=0;t<e.paneCount;t++){let i=e.panes[t];this.panes[4*t]=i.x,this.panes[4*t+1]=i.y,this.panes[4*t+2]=i.w,this.panes[4*t+3]=i.h}this.gx=e.glass.x,this.gy=e.glass.y,this.gw=Math.max(1,e.glass.w),this.gh=Math.max(1,e.glass.h);let t=this.unit;this.cell=Math.max(5,this.cfg.cell*t),this.cap=this.cfg.cellCap,this.cols=Math.ceil(this.gw/this.cell)+1,this.rows=Math.ceil(this.gh/this.cell)+1;let i=this.cols*this.rows;this.bn.length<i&&(this.bn=new Uint8Array(i),this.bx=new Float32Array(i*this.cap),this.by=new Float32Array(i*this.cap),this.br=new Float32Array(i*this.cap)),this.dCell=Math.max(12,24*t),this.dCols=Math.ceil(this.gw/this.dCell)+1,this.dRows=Math.ceil(this.gh/this.dCell)+1,this.dHead.length<this.dCols*this.dRows&&(this.dHead=new Int32Array(this.dCols*this.dRows));let a=(i*this.cap+3*this.cfg.capacity)*4;this.instances.length<a&&(this.instances=new Float32Array(a)),this.reset()}reset(){this.rngState=this.seed,this.alive.fill(0),this.freeN=0;for(let e=this.cfg.capacity-1;e>=0;e--)this.free[this.freeN++]=e;this.high=0,this.drops=0,this.bn.fill(0),this.beads=0,this.kReach.fill(0),this.shake=0,this.nextImpact=0,this.laneCount=0,this.indexed=!1,this.dirty=!0}paneOf(e,t){let i=this.panes;for(let a=0;a<this.paneN;a++){let s=4*a;if(e>=i[s]&&e<=i[s]+i[s+2]&&t>=i[s+1]&&t<=i[s+1]+i[s+3])return a}return -1}friction(e,t){let i=this.unit;return .8+.28*et(e/(16*i),t/(16*i),this.seed)+.22*et(e/(70*i),t/(70*i),this.seed+7)}cellOf(e,t){let i=Math.min(this.cols-1,Math.max(0,Math.floor((e-this.gx)/this.cell)));return Math.min(this.rows-1,Math.max(0,Math.floor((t-this.gy)/this.cell)))*this.cols+i}addBead(e,t,i){if(i<=.15||0>this.paneOf(e,t))return;if(i>this.cfg.beadMax*this.unit)return void this.addDrop(e,t,i,0,0);let a=this.cellOf(e,t),s=this.bn[a],r=a*this.cap;if(s<this.cap){this.bx[r+s]=e,this.by[r+s]=t,this.br[r+s]=i,this.bn[a]=s+1,this.beads++,this.dirty=!0;return}let n=0,o=1/0;for(let i=0;i<s;i++){let a=this.bx[r+i]-e,s=this.by[r+i]-t,l=a*a+s*s;l<o&&(o=l,n=i)}let l=r+n,h=this.br[l],c=h*h*h,u=i*i*i,f=Math.cbrt(c+u),d=(this.bx[l]*c+e*u)/(c+u),p=(this.by[l]*c+t*u)/(c+u);f>this.cfg.beadMax*this.unit?(this.removeBead(a,n),this.addDrop(d,p,f,0,0)):(this.bx[l]=d,this.by[l]=p,this.br[l]=f),this.dirty=!0}removeBead(e,t){let i=e*this.cap,a=this.bn[e]-1;t!==a&&(this.bx[i+t]=this.bx[i+a],this.by[i+t]=this.by[i+a],this.br[i+t]=this.br[i+a]),this.bn[e]=a,this.beads--,this.dirty=!0}sweepBeads(e,t,i,a){let s=i+this.cfg.beadMax*this.unit,r=Math.max(0,Math.floor((e-s-this.gx)/this.cell)),n=Math.min(this.cols-1,Math.floor((e+s-this.gx)/this.cell)),o=Math.max(0,Math.floor((t-s-this.gy)/this.cell)),l=Math.min(this.rows-1,Math.floor((t+s-this.gy)/this.cell)),h=0;for(let s=o;s<=l;s++)for(let o=r;o<=n;o++){let r=s*this.cols+o,n=r*this.cap;for(let s=this.bn[r]-1;s>=0;s--){let o=this.br[n+s],l=this.bx[n+s]-e,c=this.by[n+s]-t,u=i+o*a;l*l+c*c<u*u&&(h+=o*o*o,this.removeBead(r,s))}}return h}addDrop(e,t,i,a,s){let r=this.paneOf(e,t);if(r<0)return -1;let n=-1;if(this.freeN>0)n=this.free[--this.freeN];else{let e=1/0;for(let t=0;t<this.high;t++)this.alive[t]&&this.vy[t]<1&&this.r[t]<e&&(e=this.r[t],n=t);if(n<0||e>i)return -1;this.alive[n]=0,this.drops--}return this.alive[n]=1,this.drops++,n>=this.high&&(this.high=n+1),this.x[n]=e,this.y[n]=t,this.r[n]=i,this.vx[n]=a,this.vy[n]=s,this.wob[n]=0,this.wobV[n]=0,this.wander[n]=0,this.wanderT[n]=0,this.trailD[n]=0,this.trailN[n]=i*(.6+this.rand()),this.loose[n]=0,this.sit[n]=0,this.pane[n]=r,this.knockId[n]=0,this.absorb(n),this.dirty=!0,n}kill(e){this.alive[e]&&(this.alive[e]=0,this.drops--,this.free[this.freeN++]=e,this.dirty=!0)}absorb(e){let t=this.sweepBeads(this.x[e],this.y[e],.92*this.r[e],.6);if(t>0){let i=this.r[e];this.r[e]=Math.cbrt(i*i*i+t)}}merge(e,t){let i=this.r[e],a=this.r[t],s=i*i*i,r=a*a*a,n=s+r;if(a>i){let i=e;e=t,t=i}let o=Math.max(s,r),l=Math.min(s,r),h=this.x[e],c=this.y[e],u=this.x[t],f=this.y[t],d=Math.max(s,r)/n,p=1-d;this.x[e]=h*d+u*p,this.y[e]=.55*Math.max(c,f)+(c*d+f*p)*.45,this.vx[e]=this.vx[e]*d+this.vx[t]*p,this.vy[e]=Math.max(this.vy[e]*d+this.vy[t]*p,.7*Math.max(this.vy[e],this.vy[t])),this.r[e]=Math.cbrt(n),this.wobV[e]+=(2.2+l/o*3.5)*(.5>this.rand()?-1:1),this.loose[e]=Math.max(this.loose[e],this.loose[t],.25),this.sit[e]=0,this.kill(t),this.absorb(e)}rain(e,t){if(t<=0||0===this.paneN)return;let i=this.unit,a=0;for(let e=0;e<this.paneN;e++)a+=this.panes[4*e+2]*this.panes[4*e+3];let s=t*a/(1e4*i*i);if(s<=0)return;this.nextImpact-=e;let r=0;for(;this.nextImpact<=0&&r++<64;)this.nextImpact+=-Math.log(1-.999*this.rand())/s,this.impact()}impact(){let e=this.unit,t=4*Math.min(this.paneN-1,Math.floor(this.rand()*this.paneN)),i=this.panes[t]+this.rand()*this.panes[t+2],a=this.panes[t+1]+this.rand()*this.panes[t+3],s=this.rand(),r=e*(.4+3.4*s*s*s*s);.06>this.rand()&&(r=e*(3.4+3.2*this.rand()));let n=this.dropNear(i,a,.5*r);if(n>=0){let e=this.r[n];this.r[n]=Math.cbrt(e*e*e+r*r*r),this.wobV[n]+=(1.2+r/e*3)*(.5>this.rand()?-1:1),this.dirty=!0}else r<=this.cfg.beadMax*e?this.addBead(i,a,r):this.addDrop(i,a,r,0,0);if(r>1.5*e){let e=1+Math.floor(3*this.rand());for(let t=0;t<e;t++){let e=this.rand()*Math.PI*2,t=r*(1.4+1.6*this.rand());this.addBead(i+Math.cos(e)*t,a+Math.sin(e)*t,r*(.12+.16*this.rand()))}}}knock(e,t,i){let a=0;for(let e=0;e<4;e++){if(this.kReach[e]<=0){a=e;break}this.kAge[e]>this.kAge[a]&&(a=e)}this.kx[a]=e,this.ky[a]=t,this.kAge[a]=0,this.kStrength[a]=i,this.kReach[a]=Math.hypot(this.gw,this.gh)+40,this.kSerial[a]=++this.serial}rattle(e){this.shake=Math.max(this.shake,e);for(let t=0;t<this.high;t++)this.alive[t]&&(this.wobV[t]+=e*(1.5+2*this.rand())*(.5>this.rand()?-1:1))}sweep(e,t,i){let a=this.sweepBeads(e,t,i,-.2);for(let s=0;s<this.high;s++){if(!this.alive[s])continue;let r=this.x[s]-e,n=this.y[s]-t,o=i+.3*this.r[s];if(r*r+n*n<o*o){let e=this.r[s];a+=e*e*e,this.kill(s)}}return a}step(e){if(e<=0)return;let t=this.unit,i=this.cfg;this.laneCount=0,this.shake*=Math.exp(-e/.6);let a=0;for(let t=0;t<4;t++)!(this.kReach[t]<=0)&&(this.kAge[t]+=e,1500*this.kAge[t]>this.kReach[t]?this.kReach[t]=0:a++);let s=i.slide*t,r=Math.exp(-e/.7),n=!1;for(let o=0;o<this.high;o++){if(!this.alive[o])continue;let l=this.x[o],h=this.y[o],c=this.r[o];if(a>0)for(let e=0;e<4;e++){if(this.kReach[e]<=0||this.knockId[o]===this.kSerial[e])continue;let i=Math.hypot(l-this.kx[e],h-this.ky[e]);if(i>1500*this.kAge[e])continue;this.knockId[o]=this.kSerial[e];let a=Math.exp(-i/(190*t)),s=this.kStrength[e]*(.12+.88*a);this.wobV[o]+=s*(2.5+2*this.rand())*(.5>this.rand()?-1:1),this.loose[o]=Math.max(this.loose[o],s),this.sit[o]&&(this.sit[o]=0)}this.loose[o]*=r;{let t=this.wob[o],i=this.wobV[o],a=e;for(;a>1e-5;){let e=Math.min(a,1/120);i+=(-340*t-11*i)*e,t+=i*e,a-=e}this.wob[o]=Math.max(-.35,Math.min(.35,t)),this.wobV[o]=i,(Math.abs(t)>.002||Math.abs(i)>.02)&&(this.dirty=!0)}if(this.sit[o]){if((c-=.45*e*t)<.7*t){this.kill(o);continue}this.r[o]=c,this.dirty=!0;continue}let u=s*this.friction(l,h)*(1-.5*Math.max(this.loose[o],this.shake)),f=0;c>u&&(f=Math.min(i.maxSpeed*t,i.speed*t*(c/u-1)*2));let d=this.vy[o];(d+=(f-d)*(1-Math.exp(-e*(f>d?6:15))))<.3&&0===f&&(d=0),this.wanderT[o]-=e,this.wanderT[o]<=0&&(this.wanderT[o]=.12+.45*this.rand(),this.wander[o]=(2*this.rand()-1)*.32);let p=(this.friction(l-3*t,h+c)-this.friction(l+3*t,h+c))*1.4,g=d*(this.wander[o]+p+this.wind),m=this.vx[o]+(g-this.vx[o])*(1-Math.exp(-(6*e)));if(0===d&&(m*=Math.exp(-(10*e))),d>.05||Math.abs(m)>.05){let a=l,s=h;l+=m*e,h+=d*e;let r=4*this.pane[o],u=this.panes[r]+.55*c,f=this.panes[r]+this.panes[r+2]-.55*c;l<u?(l=u,m=.2*Math.abs(m)):l>f&&(l=f,m=-(.2*Math.abs(m)));let p=this.panes[r+1]+this.panes[r+3]-.55*c;h>=p&&(h=p,d=0,m=0,this.sit[o]=1,this.wobV[o]+=1.5);let g=Math.hypot(l-a,h-s);if(this.x[o]=l,this.y[o]=h,this.absorb(o),c=this.r[o],i.trail>0&&c>1.4*t&&(this.trailD[o]+=g,this.trailD[o]>this.trailN[o])){this.trailD[o]=0,this.trailN[o]=c*(.45+1.7*this.rand());let e=c*i.trail*(.55+.9*this.rand()),t=c*c*c-e*e*e*1.15;t>0&&(c=Math.cbrt(t),this.r[o]=c,this.addBeadQuiet(l+(this.rand()-.5)*c*.7,h-c*(1+.5*this.rand()),e))}if(i.lanes&&this.laneCount<this.cfg.capacity){let e=5*this.laneCount;this.lanes[e]=a,this.lanes[e+1]=s,this.lanes[e+2]=l,this.lanes[e+3]=h,this.lanes[e+4]=c,this.laneCount++}n=!0}this.vx[o]=m,this.vy[o]=d}n?(this.dirty=!0,this.collide()):this.index()}addBeadQuiet(e,t,i){if(0>this.paneOf(e,t))return;let a=this.cfg.beadMax*this.unit;i>a&&(i=a);let s=this.cellOf(e,t),r=this.bn[s];if(r>=this.cap)return;let n=s*this.cap;this.bx[n+r]=e,this.by[n+r]=t,this.br[n+r]=i,this.bn[s]=r+1,this.beads++}index(){let e=this.dCols,t=this.dRows,i=this.dHead,a=this.dNext,s=e*t;for(let e=0;e<s;e++)i[e]=-1;for(let s=0;s<this.high;s++){if(!this.alive[s])continue;let r=Math.min(e-1,Math.max(0,Math.floor((this.x[s]-this.gx)/this.dCell))),n=Math.min(t-1,Math.max(0,Math.floor((this.y[s]-this.gy)/this.dCell)))*e+r;a[s]=i[n],i[n]=s}this.indexed=!0}dropNear(e,t,i){if(!this.indexed||0===this.dCols)return -1;let a=this.dCols,s=this.dRows,r=Math.min(a-1,Math.max(0,Math.floor((e-this.gx)/this.dCell))),n=Math.min(s-1,Math.max(0,Math.floor((t-this.gy)/this.dCell)));for(let o=-1;o<=1;o++){let l=n+o;if(!(l<0)&&!(l>=s))for(let s=-1;s<=1;s++){let n=r+s;if(!(n<0)&&!(n>=a))for(let s=this.dHead[l*a+n];s>=0;s=this.dNext[s]){if(!this.alive[s])continue;let a=this.x[s]-e,r=this.y[s]-t,n=this.r[s]+i;if(a*a+r*r<n*n)return s}}}return -1}collide(){this.index();let e=this.dCols,t=this.dRows,i=this.dHead,a=this.dNext;for(let s=0;s<this.high;s++){if(!this.alive[s])continue;let r=Math.min(e-1,Math.max(0,Math.floor((this.x[s]-this.gx)/this.dCell))),n=Math.min(t-1,Math.max(0,Math.floor((this.y[s]-this.gy)/this.dCell)));for(let o=-1;o<=1&&this.alive[s];o++){let l=n+o;if(!(l<0)&&!(l>=t))for(let t=-1;t<=1&&this.alive[s];t++){let n=r+t;if(!(n<0)&&!(n>=e))for(let t=i[l*e+n];t>=0;t=a[t]){if(t<=s||!this.alive[t]||this.pane[t]!==this.pane[s])continue;let e=this.x[t]-this.x[s],i=this.y[t]-this.y[s],a=(this.r[s]+this.r[t])*.86;if(e*e+i*i<a*a&&(this.merge(s,t),!this.alive[s]))break}}}}}mist(e){let t=this.unit;for(let i=0;i<this.paneN;i++){let a=4*i,s=Math.round(this.panes[a+2]*this.panes[a+3]/(this.cell*this.cell)*this.cap*e);for(let e=0;e<s;e++){let e=this.rand();this.addBead(this.panes[a]+this.rand()*this.panes[a+2],this.panes[a+1]+this.rand()*this.panes[a+3],t*(.35+1.25*e*e))}}}prewarm(e,t){let i=1/30;for(let a=0;a<e;a+=i)this.rain(i,t),this.step(i);this.laneCount=0}build(){let e=this.instances,t=this.unit,i=0,a=this.cols*this.rows;for(let t=0;t<a;t++){let a=t*this.cap;for(let s=0;s<this.bn[t];s++){let t=4*i;e[t]=this.bx[a+s],e[t+1]=this.by[a+s],e[t+2]=this.br[a+s],e[t+3]=this.br[a+s],i++}}for(let a=0;a<this.high;a++){if(!this.alive[a])continue;let s=this.r[a],r=this.vy[a],n=this.wob[a],o=Math.min(1,Math.max(0,(r-4*t)/(36*t))),l=1+.32*o,h=4*i;if(e[h]=this.x[a],e[h+1]=this.y[a]+.1*s*o,e[h+2]=s*(1+n)*(1-.06*o),e[h+3]=s*(1-n)*l,i++,o>.02){let t=this.vx[a];e[h=4*i]=this.x[a]-.03*t,e[h+1]=this.y[a]-.95*s,e[h+2]=.56*s*o,e[h+3]=.95*s*o,e[h=4*++i]=this.x[a]-.06*t,e[h+1]=this.y[a]-1.8*s,e[h+2]=.32*s*o,e[h+3]=.8*s*o,i++}}return this.instanceCount=i,this.dirty=!1,i}}function et(e,t,i){let a=Math.floor(e),s=Math.floor(t),n=e-a,o=t-s,l=n*n*(3-2*n),h=o*o*(3-2*o),c=(0,r.hash2)(a,s,i),u=(0,r.hash2)(a+1,s,i),f=(0,r.hash2)(a,s+1,i);return c+(u-c)*l+(f-c)*h+(c-u-f+(0,r.hash2)(a+1,s+1,i))*l*h}let ei={0:1.6,1:4,2:9},ea={0:[70,120],1:[26,50],2:[9,20]},es={0:0,1:.02,2:.09},er=[{value:0,label:"Drizzle"},{value:1,label:"Rain"},{value:2,label:"Storm"}],en={lo:.16,hi:.97},eo=[2,1.5,1.25,1],el={cell:9,cellCap:4,beadMax:2.8,slide:4.8,speed:70,maxSpeed:320,trail:.24,lanes:!1},eh={cell:7,cellCap:3,beadMax:1.9,slide:2.5,speed:58,maxSpeed:220,trail:.22,lanes:!0};function ec(e,t){let i=e.trim(),a=i.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(a){let e=3===a[1].length?a[1].replace(/./g,e=>e+e):a[1];return[parseInt(e.slice(0,2),16)/255,parseInt(e.slice(2,4),16)/255,parseInt(e.slice(4,6),16)/255]}let s=i.match(/[\d.]+/g);return s&&s.length>=3?[s[0]/255,s[1]/255,s[2]/255]:t}let eu=e=>e<=.04045?e/12.92:Math.pow((e+.055)/1.055,2.4),ef=e=>e<0?0:e<.025?e/.025:Math.exp(-(e-.025)/.075);function ed({mode:e,active:l,reducedMotion:h,theme:c}){let d="stage"===e,[x]=(0,i.useState)(()=>{let t,i,a;return t="stage"===e,i=(0,r.seededRandom)(24301+(t?1:2)),a="dark"===c,{stage:t,layout:m(),sized:!1,outer:new ee({...el,capacity:t?420:140,seed:40503}),inner:new ee({...eh,capacity:t?140:60,seed:11121}),mirror:new f(en),stamps:new u,brush:new o(i),city:new N,frame:{night:0,flash:0,flashX:0,time:0,parX:0,parY:0,wall:new Float32Array([.89,.89,.89]),fogLo:.3,fogHi:.94,ring:new Float32Array(4),pressed:0,fogBack:!0},level:1,theme:c,reduced:h,night:+!!a,clock:0,acc:0,sceneAcc:1,flashT:99,flashA0:0,flashT1:0,flashA1:0,flashGlow:0,nextStrike:t?7.5:9,shakeAt:-1,shakeStrength:0,parX:new r.Spring(0,{stiffness:38,damping:12.3}),parY:new r.Spring(0,{stiffness:38,damping:12.3}),ring:0,hoverX:0,hoverY:0,hoverOn:!1,pointerTip:22,pointerId:-1,downX:0,downY:0,downT:0,downMoved:!1,lastMoveT:0,keyX:0,keyY:0,keyVX:0,keyVY:0,keyL:!1,keyR:!1,keyU:!1,keyD:!1,keyFast:!1,keyBrush:!1,keyIdle:0,keyFocus:!1,ghost:{on:!1,t:0,dur:1,x0:0,y0:0,x1:0,y1:0,bend:0},ghostNext:t?.9:2.2,ghostFlip:!1,breathOn:!1,breathT:0,breathX:0,breathY:0,bg:a?[.055,.02,.024]:[.949,.949,.949],bgHover:a?[.03,.012,.012]:[.922,.922,.922],hover:0,hovering:!1,dprStep:0,perfTime:0,perfSlow:0,range:{x0:-1,x1:1},rand:i,reserve:108}}),b=(0,i.useRef)(null),w=(0,i.useRef)(null),M=(0,i.useRef)(null),k=(0,i.useRef)(null),A=(0,i.useRef)(null),T=(0,i.useRef)(!1),F=(0,i.useRef)(null),R=(0,i.useId)(),B=(0,r.useFinePointer)(),S=(0,s.useMuted)(),[C,E]=(0,i.useState)(1),[P,L]=(0,i.useState)(!1),[D,V]=(0,i.useState)(!1),[q,I]=(0,i.useState)(!1),z=(0,i.useRef)(!1),[_,X]=(0,i.useState)(""),[U,G]=(0,i.useState)(0),[Y,O]=(0,i.useState)(null),H=e=>{let t=x.layout;if(!t.paneCount)return;let i=t.panes[+(3===t.paneCount)],a=x.ghostFlip=!x.ghostFlip,s=d?.6:.5+.25*x.rand(),r={x:i.x+.16*i.w,y:i.y+i.h*(s+.04)},n={x:i.x+.84*i.w,y:i.y+i.h*(s-.05)},o=x.ghost;o.on=!0,o.t=0,o.dur=e,o.x0=a?r.x:n.x,o.y0=a?r.y:n.y,o.x1=a?n.x:r.x,o.y1=a?n.y:r.y,o.bend=i.h*(.07+.05*x.rand()),x.brush.begin(o.x0,o.y0,d?22*t.unit**.3:11),x.brush.r=x.brush.size},K=(e,t)=>{let i,a=x.ghost,s=(i=(0,r.clamp)(e))*i*i*(i*(6*i-15)+10);return t.x=a.x0+(a.x1-a.x0)*s,t.y=a.y0+(a.y1-a.y0)*s+Math.sin(s*Math.PI*2)*a.bend*.6,t},[$]=(0,i.useState)(()=>({x:0,y:0})),Q=(0,i.useCallback)(()=>{let e=k.current,{width:t,height:i,dpr:a}=ev.current;if(!e||t<2||i<2)return;let s=ex.current;if(!s)return;let r=x.layout,n=`${r.glass.x},${r.glass.y},${r.glass.w},${r.glass.h},${r.paneCount}`;v(t,i,!d,d?x.reserve:0,x.layout);let o=x.layout,l=`${o.glass.x},${o.glass.y},${o.glass.w},${o.glass.h},${o.paneCount}`,h=Math.min(1.75,Math.max(1,a));e.setSize(s.width,s.height,t,o,h),e.sceneRange(x.range);let c=e.takeFogReset();if(n===l&&x.sized?c&&x.mirror.reset():(x.outer.setBounds(o),x.inner.setBounds(o),x.mirror.setBounds(o),x.stamps.clear(),x.outer.wind=es[x.level],x.outer.mist(.75),x.outer.prewarm(x.sized?6:x.reduced?26:d?16:20,ei[x.level]),x.keyX=o.glass.x+o.glass.w/2,x.keyY=o.glass.y+.55*o.glass.h,x.reduced&&(()=>{H(1);for(let e=1;e<=60;e++)K(e/60,$),x.brush.to($.x,$.y,1/60,x.layout,x.inner,x.mirror,x.stamps);x.brush.end(x.layout,x.inner),x.ghost.on=!1})(),x.sized=!0),x.sceneAcc=1,d){let e={x:o.casing.x-6,y:o.casing.y-6,w:o.casing.w+12,h:o.bottom-o.casing.y+12};O(t=>t&&.5>Math.abs(t.x-e.x)&&.5>Math.abs(t.y-e.y)&&.5>Math.abs(t.w-e.w)&&.5>Math.abs(t.h-e.h)?t:e)}},[d]),et=e=>{let t=x.rand,i=x.range.x0,a=x.range.x1;x.frame.flashX=i+(a-i)*(.2+.6*t()),x.reduced?(x.flashT=0,x.flashA0=0,x.flashA1=0,x.flashGlow=.35+.25*e):(x.flashT=0,x.flashA0=(d?.75:.6)*(.55+.45*e),x.flashT1=.12+.12*t(),x.flashA1=x.flashA0*(.45+.4*t()),x.flashGlow=0);let r=.35+(1-e)*2.6;d&&function(e,t,i){let a=j();if(!a)return;let{ctx:r,output:n}=a,o=r.currentTime+Math.max(0,t),l=J(r,n,.6*i),h=6+3*(1-e);if(e>.35){let t=r.createBufferSource();t.buffer=(0,s.noiseBuffer)(r,1);let i=r.createBiquadFilter();i.type="highpass",i.frequency.value=700;let a=r.createGain();a.gain.setValueAtTime(0,o),a.gain.linearRampToValueAtTime(.22*e,o+.01),a.gain.exponentialRampToValueAtTime(1e-4,o+.45),t.connect(i).connect(a).connect(l),t.start(o,.4*Math.random(),.5)}let c=r.createBufferSource();c.buffer=(0,s.noiseBuffer)(r,2),c.loop=!0,c.playbackRate.value=.5;let u=r.createBiquadFilter();u.type="lowpass",u.Q.value=.7,u.frequency.setValueAtTime(1100*(.4+.6*e),o),u.frequency.exponentialRampToValueAtTime(120,o+.6*h);let f=r.createBiquadFilter();f.type="lowpass",f.frequency.value=900;let d=r.createGain(),p=.55*(.45+.55*e),g=new Float32Array(48),m=0;for(let t=0;t<48;t++){let i=t/47;m+=(Math.random()-.5)*.35;let a=Math.min(1,i/(e>.5?.03:.1)),s=Math.exp(-(3.2*i))*(1+.6*Math.sin(14*i+1.3)*Math.exp(-(2*i)))+.25*(m*=.85)*Math.exp(-(2*i));g[t]=Math.max(0,p*a*s)}g[47]=0,d.gain.setValueAtTime(0,o),d.gain.setValueCurveAtTime(g,o+.001,h),c.connect(u).connect(f).connect(d).connect(l),c.start(o,1.5*Math.random()),c.stop(o+h+.2);let x=r.createBufferSource();x.buffer=(0,s.noiseBuffer)(r,1),x.loop=!0;let v=r.createBiquadFilter();v.type="bandpass",v.frequency.value=180,v.Q.value=3;let y=r.createGain();y.gain.setValueAtTime(0,o),y.gain.linearRampToValueAtTime(.05*e,o+.25),y.gain.exponentialRampToValueAtTime(1e-4,o+1.6);let b=r.createOscillator();b.frequency.value=23;let w=r.createGain();w.gain.value=.5,b.connect(w).connect(y.gain),x.connect(v).connect(y).connect(l),x.start(o),x.stop(o+1.7),b.start(o),b.stop(o+1.7)}(e,r,(x.frame.flashX-(i+a)/2)/Math.max(.5,(a-i)/2)),x.shakeAt=x.clock+r+.25,x.shakeStrength=.3+.55*e;let[n,o]=ea[x.level];x.nextStrike=(d?n+t()*(o-n):15+12*t())+r},eg=(0,r.useFrame)(l,e=>{var t;let i=k.current,a=ex.current;if(!i||!a||!x.sized)return!1;let s=x.reduced;if(!d){if(x.acc+=e,x.acc<1/30-.002)return;e=Math.min(.1,x.acc),x.acc=0}x.clock+=e;let n=!s;d&&n&&x.dprStep<eo.length-1&&(x.perfTime+=e,e>1/40&&(x.perfSlow+=e),x.perfTime>=1.5&&(x.perfSlow>.7*x.perfTime&&(x.dprStep+=1,G(x.dprStep)),x.perfTime=0,x.perfSlow=0));let o=+("dark"===x.theme);x.night=s?o:(0,r.damp)(x.night,o,2.6,e),.001>Math.abs(x.night-o)&&(x.night=o),x.hover=s?+!!x.hovering:(0,r.damp)(x.hover,+!!x.hovering,10,e);let l=x.layout,h=x.brush;if(n)if(x.ghost.on){let t=x.ghost;t.t+=e/t.dur,K(t.t,$),h.to($.x,$.y,e,l,x.inner,x.mirror,x.stamps),t.t>=1&&(t.on=!1,h.end(l,x.inner))}else{x.ghostNext-=e;let t=h.down||x.hovering||x.keyBrush;x.ghostNext<=0&&!t&&(d&&P?x.ghostNext=1/0:(H(d?1.25:1),x.ghostNext=d?1/0:9+4*x.rand()))}{let t=!!x.keyR-!!x.keyL,i=!!x.keyD-!!x.keyU,a=Math.hypot(t,i)||1,s=x.keyFast?460:250,n=1-Math.exp(-(9*e));x.keyVX+=(t/a*s-x.keyVX)*n,x.keyVY+=(i/a*s-x.keyVY)*n,(t||i||Math.hypot(x.keyVX,x.keyVY)>4)&&(x.keyX=(0,r.clamp)(x.keyX+x.keyVX*e,l.glass.x+4,l.glass.x+l.glass.w-4),x.keyY=(0,r.clamp)(x.keyY+x.keyVY*e,l.glass.y+4,l.glass.y+l.glass.h-4),!x.keyBrush&&(t||i)&&!h.down?y(l,x.keyX,x.keyY)>=0&&(x.keyBrush=!0,h.begin(x.keyX,x.keyY,22)):x.keyBrush&&h.to(x.keyX,x.keyY,e,l,x.inner,x.mirror,x.stamps)),!x.keyBrush||t||i?x.keyIdle=0:(x.keyIdle+=e,x.keyIdle>.12&&(x.keyBrush=!1,h.end(l,x.inner)))}if(h.step(e),x.breathOn){x.breathT+=e;let t=l.glass.h*(d?.42:.55);if(s)x.stamps.breath(x.breathX,x.breathY,t,1),x.mirror.breathe(x.breathX,x.breathY,t,1),x.breathOn=!1;else{let i=t*(.25+.75*(1-Math.pow(1-Math.min(1,x.breathT/.9),3))),a=1-Math.exp(-(7*e));x.stamps.breath(x.breathX,x.breathY,i,a),x.mirror.breathe(x.breathX,x.breathY,i,a),x.breathT>1.15&&(x.breathOn=!1)}}if(n){x.outer.rain(e,ei[x.level]),x.outer.step(e),x.inner.step(e);let t=x.inner.lanes;for(let e=0;e<x.inner.laneCount;e++){let i=5*e,a=.85*t[i+4];x.stamps.lane(t[i],t[i+1],t[i+2],t[i+3],a),x.mirror.wipe(t[i],t[i+1],t[i+2],t[i+3],a,Math.max(.8,.3*a))}}x.mirror.decay(e,n),x.nextStrike-=e,x.nextStrike<=0&&n&&et(.25+.6*x.rand()),x.flashT+=e;let c=(t=x.flashT,x.flashGlow>0?x.flashGlow*(t<.4?t/.4:Math.exp(-(t-.4)/.8)):x.flashA0*ef(t)+x.flashA1*ef(t-x.flashT1)+.14*x.flashA0*(t>0?Math.exp(-t/.7):0));x.shakeAt>0&&x.clock>=x.shakeAt&&(x.shakeAt=-1,n&&(x.outer.rattle(x.shakeStrength),x.inner.rattle(.6*x.shakeStrength)));let u=d&&B&&x.hoverOn&&n;x.parX.to(u?(x.hoverX/Math.max(1,l.W)-.5)*.045:0),x.parY.to(u?(x.hoverY/Math.max(1,l.H)-.5)*.02:0),s?(x.parX.set(x.parX.target),x.parY.set(x.parY.target)):(x.parX.step(e),x.parY.step(e)),x.sceneAcc+=e;let f=x.sceneAcc>=1/30-.002||c>.002||!z.current;f&&(x.city.update(x.sceneAcc,x.night,x.range.x0,x.range.x1,n),x.sceneAcc=0);let p=x.keyFocus&&d,g=d&&(h.down||x.hoverOn&&B&&y(l,x.hoverX,x.hoverY,2)>=0||p);x.ring=s?+!!g:(0,r.damp)(x.ring,+!!g,14,e);let m=x.frame;m.night=x.night,m.flash=c,m.time=x.clock,m.parX=x.parX.value,m.parY=x.parY.value;for(let e=0;e<3;e++)m.wall[e]=eu(x.bg[e]+(x.bgHover[e]-x.bg[e])*x.hover);m.fogLo=en.lo,m.fogHi=en.hi;let v=p&&!h.down?x.keyX:h.down?h.x:x.hoverX,b=p&&!h.down?x.keyY:h.down?h.y:x.hoverY;m.ring[0]=v,m.ring[1]=b,m.ring[2]=h.down?h.r:(p?22:x.pointerTip)*.92,m.ring[3]=x.ghost.on?0:x.ring,m.pressed=+!!h.down,m.fogBack=n,f&&i.drawScene(x.city,m);let w=x.outer.dirty,M=x.inner.dirty;if(w&&x.outer.build(),M&&x.inner.build(),(w||M||!z.current)&&i.drawField(x.outer,x.inner,w,M),i.updateFog(x.stamps,e,n),x.stamps.clear(),i.composite(m),z.current||(z.current=!0,I(!0)),A.current?.setRub(h.down&&!x.ghost.on?h.speed:0,h.fog),s&&!h.down&&!x.breathOn&&x.flashT>3&&.001>Math.abs(x.ring-!!g)&&!x.keyBrush)return!1}),em=(0,r.useLatest)(eg),{canvasRef:ex,sizeRef:ev,supported:ey}=(0,r.useWebGL2)({mode:e,maxDpr:d?eo[U]:1.5,attributes:{alpha:!1,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!0,preserveDrawingBuffer:!1},onContext:e=>{let t=null;try{t=new W(e,!d)}catch(e){console.error(e);return}return k.current=t,x.outer.dirty=!0,x.inner.dirty=!0,Q(),eg(),()=>{t?.dispose(),k.current=null,z.current=!1,I(!1)}},onResize:()=>{Q(),x.outer.dirty=!0,x.inner.dirty=!0,eg()}});(0,r.useIsoLayoutEffect)(()=>{if(!d)return;let e=b.current,t=e?.querySelector(".rain-controls");if(!e||!t)return;let i=()=>{let i=e.getBoundingClientRect(),a=i.height;for(let e of Array.from(t.children)){let t=e.getBoundingClientRect();t.height>0&&(a=Math.min(a,t.top-i.top))}let s=Math.round(i.height-a+(i.width<560?12:16));Math.abs(s-x.reserve)>1&&(x.reserve=s,Q(),em.current())};i();let a=new ResizeObserver(i);return a.observe(t),a.observe(e),()=>a.disconnect()},[d,ey]);let eb=(0,i.useCallback)(()=>{try{let e=getComputedStyle(document.documentElement);x.bg=ec(e.getPropertyValue("--tile"),x.bg),x.bgHover=ec(e.getPropertyValue("--tile-hover"),x.bgHover)}catch{}},[]);(0,i.useEffect)(()=>{x.theme=c,eb(),eg()},[c]),(0,i.useEffect)(()=>{let e=new MutationObserver(()=>{eb(),em.current()});return e.observe(document.documentElement,{attributes:!0,attributeFilter:["data-palette","style"]}),()=>e.disconnect()},[]);let ew=(0,i.useRef)(!0);(0,i.useEffect)(()=>{if(ew.current){ew.current=!1;return}x.reduced=h,x.sized&&(h&&(x.ghost.on=!1,x.brush.down&&x.brush.end(x.layout,x.inner),x.flashT=99),x.outer.dirty=!0,x.inner.dirty=!0),eg()},[h]);let eM=(0,i.useCallback)(()=>{let e=d&&T.current&&l&&!S,t=A.current??=new Z;if(e){let e=(0,s.getAudio)();e&&!t.playing&&t.start(e,x.level)}else t.playing&&t.stop()},[d,l,S]);(0,i.useEffect)(()=>{eM()},[eM]),(0,i.useEffect)(()=>()=>{A.current?.stop()},[]);let ek=()=>{d&&(T.current=!0,(0,s.ensureAudio)(),eM())},eA=()=>{P||L(!0),em.current()},eT=(e,t)=>{let i=x.layout;x.reduced||(x.outer.knock(e,t,.95),x.inner.knock(e,t,.7)),d&&function(e){let t=j();if(!t)return;let{ctx:i,output:a}=t,r=J(i,a,e),n=i.currentTime,o=1+(Math.random()-.5)*.08,l=i.createOscillator();l.frequency.setValueAtTime(170*o,n),l.frequency.exponentialRampToValueAtTime(92*o,n+.11);let h=i.createGain();h.gain.setValueAtTime(0,n),h.gain.linearRampToValueAtTime(.4,n+.003),h.gain.exponentialRampToValueAtTime(1e-4,n+.16),l.connect(h).connect(r),l.start(n),l.stop(n+.2);let c=i.createBufferSource();c.buffer=(0,s.noiseBuffer)(i);let u=i.createBiquadFilter();u.type="bandpass",u.frequency.value=1500*o,u.Q.value=1.3;let f=i.createGain();for(let[e,t,a]of(f.gain.setValueAtTime(0,n),f.gain.linearRampToValueAtTime(.24,n+.002),f.gain.exponentialRampToValueAtTime(1e-4,n+.035),c.connect(u).connect(f).connect(r),c.start(n,.5*Math.random(),.08),[[2870,.022,.22],[4310,.012,.14]])){let s=i.createOscillator();s.frequency.value=e*o;let l=i.createGain();l.gain.setValueAtTime(0,n),l.gain.linearRampToValueAtTime(+t,n+.004),l.gain.exponentialRampToValueAtTime(1e-4,n+a),s.connect(l).connect(r),s.start(n),s.stop(n+a+.05)}}((e-i.W/2)/Math.max(1,i.W/2)*.8)},eF=()=>{ek(),et(.88),X("Thunder"),eA()},eR=(e,t)=>{ek();let i=x.layout,a=e??(x.keyFocus?x.keyX:i.glass.x+i.glass.w/2),r=t??(x.keyFocus?x.keyY:i.glass.y+.5*i.glass.h);x.breathOn=!0,x.breathT=0,x.breathX=a,x.breathY=r,d&&function(){let e=j();if(!e)return;let{ctx:t,output:i}=e,a=t.currentTime,r=t.createBufferSource();r.buffer=(0,s.noiseBuffer)(t,2);let n=t.createBiquadFilter();n.type="bandpass",n.frequency.setValueAtTime(1100,a),n.frequency.exponentialRampToValueAtTime(650,a+1.1),n.Q.value=.7;let o=t.createBiquadFilter();o.type="lowpass",o.frequency.value=2400;let l=t.createGain();l.gain.setValueAtTime(0,a),l.gain.linearRampToValueAtTime(.12,a+.22),l.gain.setTargetAtTime(0,a+.45,.28),r.connect(n).connect(o).connect(l).connect(i),r.start(a,.5*Math.random(),1.8)}(),X("You breathe on the glass and it fogs over"),eA()},eB=e=>{x.level=e,x.outer.wind=es[e];let[t,i]=ea[e];x.nextStrike=Math.min(x.nextStrike,t+x.rand()*(i-t)),E(e),A.current?.setLevel(e),eA()},eS=(e,t,i)=>{let a=F.current;return i.x=e-(a?.left??0),i.y=t-(a?.top??0),i},[eC]=(0,i.useState)(()=>({x:0,y:0})),eN=e=>"touch"===e?25:"pen"===e?17:22,eE=(e,t)=>{if(x.pointerId!==e.pointerId)return;x.pointerId=-1;let i=x.layout;eS(e.clientX,e.clientY,eC),t||x.downMoved||!(e.timeStamp-x.downT<320)||eT(x.downX,x.downY),x.brush.end(i,x.inner),"mouse"!==e.pointerType&&(x.hoverOn=!1);try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}eA()};(0,i.useEffect)(()=>{if(d)return;let e=b.current;if(!e)return;let t=null,i=0,a=a=>{"mouse"===a.pointerType&&(t=e.getBoundingClientRect(),x.hovering=!0,i=a.timeStamp,em.current())},s=a=>{if("mouse"!==a.pointerType||x.reduced)return;x.hovering=!0,t=t??e.getBoundingClientRect(),eC.x=a.clientX-t.left,eC.y=a.clientY-t.top;let s=x.layout,r=Math.max(.001,(a.timeStamp-i)/1e3);i=a.timeStamp,x.ghost.on&&(x.ghost.on=!1,x.brush.end(s,x.inner)),x.brush.down?x.brush.to(eC.x,eC.y,r,s,x.inner,x.mirror,x.stamps):y(s,eC.x,eC.y)>=0&&x.brush.begin(eC.x,eC.y,11),em.current()},r=()=>{x.hovering=!1,t=null,x.brush.down&&x.brush.end(x.layout,x.inner),x.ghostNext=Math.max(x.ghostNext,4),em.current()};return e.addEventListener("pointerenter",a),e.addEventListener("pointermove",s),e.addEventListener("pointerleave",r),()=>{e.removeEventListener("pointerenter",a),e.removeEventListener("pointermove",s),e.removeEventListener("pointerleave",r)}},[d]);let eP=!1===ey,eL=eP||!q?(0,t.jsx)(ep,{mode:e,theme:c}):null;if(!d)return(0,t.jsxs)("div",{ref:b,"aria-hidden":"true",className:"absolute inset-0",children:[(0,t.jsx)("canvas",{ref:ex,className:(0,a.cn)("absolute inset-0 block size-full",eP&&"hidden")}),eL]});let eD=eP?"A still: this browser can't run the live window":D?"Arrows wipe · Space knocks · T thunder · B breathe · 1 2 3 rain":h?B?"Drag on the glass to wipe it · Breathe fogs it again":"Drag a finger on the glass to wipe it · Breathe fogs it again":B?"Drag on the glass to wipe it · click to knock":"Wipe the glass with a finger · tap to knock";return(0,t.jsxs)("div",{ref:b,className:"absolute inset-0 select-none",children:[(0,t.jsxs)("div",{ref:w,onPointerDown:e=>{if(!d||!e.isPrimary||e.button>0||e.target.closest("[data-lab-controls]"))return;F.current=w.current?.getBoundingClientRect()??null,eS(e.clientX,e.clientY,eC);let t=x.layout;if(eC.x>=t.sillX0-4&&eC.x<=t.sillX1+4&&eC.y>=t.casing.y-4&&eC.y<=t.bottom+4){ek(),x.pointerId=e.pointerId,x.downX=eC.x,x.downY=eC.y,x.downT=e.timeStamp,x.downMoved=!1,x.lastMoveT=e.timeStamp,x.pointerTip=eN(e.pointerType),x.hoverX=eC.x,x.hoverY=eC.y,x.ghost.on&&(x.ghost.on=!1,x.brush.end(t,x.inner)),x.keyBrush&&(x.keyBrush=!1,x.brush.end(t,x.inner)),y(t,eC.x,eC.y)>=0&&x.brush.begin(eC.x,eC.y,x.pointerTip);try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}eA()}},onPointerMove:e=>{if(!d||!e.isPrimary)return;if(x.pointerId!==e.pointerId){F.current=w.current?.getBoundingClientRect()??F.current,eS(e.clientX,e.clientY,eC),x.hoverX=eC.x,x.hoverY=eC.y,x.hoverOn="mouse"===e.pointerType,x.pointerTip=eN(e.pointerType);let t=M.current;if(t&&B){let e=y(x.layout,eC.x,eC.y,2)>=0?"none":"";t.style.cursor!==e&&(t.style.cursor=e)}em.current();return}let t=x.layout,i=e.nativeEvent,a="function"==typeof i.getCoalescedEvents?i.getCoalescedEvents():null,s=a&&a.length?a.length:1;for(let e=0;e<s;e++){let s=a&&a.length?a[e]:i;eS(s.clientX,s.clientY,eC);let r=Math.max(.001,(s.timeStamp-x.lastMoveT)/1e3);x.lastMoveT=s.timeStamp,!x.downMoved&&Math.hypot(eC.x-x.downX,eC.y-x.downY)>5&&(x.downMoved=!0),x.brush.down?x.brush.to(eC.x,eC.y,r,t,x.inner,x.mirror,x.stamps):y(t,eC.x,eC.y)>=0&&x.brush.begin(eC.x,eC.y,x.pointerTip)}x.hoverX=eC.x,x.hoverY=eC.y,em.current()},onPointerUp:e=>eE(e,!1),onPointerCancel:e=>eE(e,!0),onPointerLeave:e=>{x.pointerId!==e.pointerId&&(x.hoverOn=!1,em.current())},className:"absolute inset-0 touch-pan-y [-webkit-tap-highlight-color:transparent]",children:[(0,t.jsx)("canvas",{ref:ex,"aria-hidden":"true",className:(0,a.cn)("absolute inset-0 block size-full",eP&&"hidden")}),eL,Y&&!eP?(0,t.jsx)("div",{tabIndex:0,role:"application","aria-roledescription":"rainy window","aria-label":"A window on a rainy evening, fogged on the inside","aria-describedby":R,onKeyDown:e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;let t=e.key,i=!0;switch(t){case"ArrowLeft":x.keyL=!0;break;case"ArrowRight":x.keyR=!0;break;case"ArrowUp":x.keyU=!0;break;case"ArrowDown":x.keyD=!0;break;case" ":case"Enter":e.repeat||(ek(),eT(x.keyX,x.keyY),X("You knock on the glass"));break;case"t":case"T":e.repeat||eF();break;case"b":case"B":e.repeat||eR(x.keyX,x.keyY);break;case"1":case"2":case"3":{let e=Number(t)-1;eB(e),X(er[e].label);break}default:i=!1}i&&(e.preventDefault(),e.stopPropagation(),t.startsWith("Arrow")&&(x.keyFast=e.shiftKey,x.ghost.on&&(x.ghost.on=!1,x.brush.end(x.layout,x.inner)),ek()),eA())},onKeyUp:e=>{switch(e.key){case"ArrowLeft":x.keyL=!1;break;case"ArrowRight":x.keyR=!1;break;case"ArrowUp":x.keyU=!1;break;case"ArrowDown":x.keyD=!1;break;case"Shift":x.keyFast=!1;break;default:return}em.current()},onFocus:e=>{let t=e.currentTarget.matches(":focus-visible");x.keyFocus=t,V(t),em.current()},onBlur:()=>{x.keyL=x.keyR=x.keyU=x.keyD=!1,x.keyFocus=!1,V(!1),em.current()},ref:M,className:"absolute touch-none rounded-[6px] outline-none focus-visible:shadow-[0_0_0_2px_var(--ring)]",style:{left:Y.x,top:Y.y,width:Y.w,height:Y.h}}):null]}),(0,t.jsx)("p",{id:R,className:"sr-only",children:"A painted window on a rainy evening. Outside, out of focus, a wet street with lit windows, a shop, streetlamps and passing cars; rain runs down the outside of the glass, and the inside is fogged with condensation. Drag on the glass to wipe the fog away; it fogs back over in a few seconds. Click or tap without dragging to knock on the glass and shake the drops loose. With the keyboard: the arrow keys move a fingertip and wipe as it goes (hold Shift to go faster), Space or Enter knocks, T calls the thunder, B breathes on the glass, and 1, 2 and 3 set the rain to drizzle, rain or storm."}),(0,t.jsx)("p",{className:"sr-only","aria-live":"polite",children:_}),(0,t.jsxs)(n.StageControls,{placement:"bottom",className:"rain-controls",children:[eP?null:(0,t.jsxs)(n.Tray,{label:"Weather",children:[(0,t.jsx)(n.Segmented,{label:"Rain",options:er,value:C,onChange:eB}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.IconButton,{label:"Thunder",onClick:eF,children:(0,t.jsx)(p,{size:16})}),(0,t.jsx)(n.IconButton,{label:"Breathe on the glass",onClick:()=>eR(),children:(0,t.jsx)(g,{size:16})}),(0,t.jsx)(n.TrayDivider,{}),(0,t.jsx)(n.MuteButton,{})]}),(0,t.jsx)(n.StageHint,{className:(0,a.cn)("transition-opacity duration-700",P&&!D&&"opacity-0"),children:eD})]})]})}function ep({mode:e,theme:a}){let s=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=s.current;if(!t)return;let i=()=>{let i=t.getBoundingClientRect();if(i.width<2||i.height<2)return;let s=Math.min(window.devicePixelRatio||1,2);t.width=Math.round(i.width*s),t.height=Math.round(i.height*s);let r=t.getContext("2d");if(!r)return;r.setTransform(s,0,0,s,0,0);let n=v(i.width,i.height,"tile"===e,"stage"===e?i.width<560?112:104:0,m()),o="dark"===a,l=o?"#2a221e":"#d9d5cd";r.fillStyle=l,r.fillRect(n.casing.x+4,n.casing.y+5,n.casing.w,n.bottom-n.casing.y),r.fillStyle=o?"#3a302a":"#ece9e3",r.fillRect(n.casing.x,n.casing.y,n.casing.w,n.casing.h),r.fillRect(n.sillX0,n.sillY,n.sillX1-n.sillX0,n.sillTop+n.nose),r.fillStyle=l,r.fillRect(n.casing.x,n.sillY+n.sillTop+n.nose,n.casing.w,n.apron),r.fillRect(n.opening.x,n.opening.y,n.opening.w,1);for(let e=0;e<n.paneCount;e++){let t=n.panes[e],i=r.createLinearGradient(0,t.y,0,t.y+t.h);i.addColorStop(0,o?"#0b0d16":"#45506a"),i.addColorStop(.55,o?"#1a1216":"#7b7480"),i.addColorStop(1,o?"#120c0c":"#5c5552"),r.fillStyle=i,r.fillRect(t.x,t.y,t.w,t.h),r.save(),r.beginPath(),r.rect(t.x,t.y,t.w,t.h),r.clip();let a=7+13*e,s=()=>(a=16807*a%0x7fffffff)/0x7fffffff;for(let e=0;e<26;e++){let e=t.x+s()*t.w,i=t.y+t.h*(.3+.45*s()),a=n.glass.h*(.025+.02*s());r.fillStyle=.8>s()?`rgba(255, 176, 96, ${o?.55:.45})`:"rgba(255, 226, 190, 0.5)",r.beginPath(),r.arc(e,i,a,0,2*Math.PI),r.fill()}let l=r.createLinearGradient(0,t.y,0,t.y+t.h);l.addColorStop(0,o?"rgba(60, 46, 44, 0.25)":"rgba(214, 218, 226, 0.25)"),l.addColorStop(1,o?"rgba(60, 46, 44, 0.8)":"rgba(214, 218, 226, 0.85)"),r.fillStyle=l,r.fillRect(t.x,t.y,t.w,t.h),r.restore()}};i();let r=new ResizeObserver(i);return r.observe(t),()=>r.disconnect()},[e,a]),(0,t.jsx)("canvas",{ref:s,role:"stage"===e?"img":void 0,"aria-label":"stage"===e?"A window on a rainy evening, the street's lights blurred behind fogged glass":void 0,"aria-hidden":"stage"!==e||void 0,className:"pointer-events-none absolute inset-0 block size-full"})}e.s(["default",0,function(e){return(0,t.jsx)(ed,{...e})}],57045)},40684,function(e){e.n(e.i(57045))}]);