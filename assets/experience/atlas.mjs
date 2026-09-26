import {atlasLayers as layers} from './atlas-data.mjs';
// A public explanatory graph, projected from 3D. No company or visitor data is loaded.
const canvas=document.querySelector('[data-atlas-canvas]'),context=canvas.getContext('2d'),wrap=canvas.parentElement;
const $=s=>document.querySelector(s),buttons=[...document.querySelectorAll('[data-layer]')];

let w=0,h=0,dpr=1,angle=-.63,tilt=.24,selected=4,paused=document.documentElement.classList.contains('motion-paused')||document.hidden,visible=false,frame=0,lastTime=0,pointer=null,hit=[];
function project(x,y,z){const c=Math.cos(angle),s=Math.sin(angle),rx=x*c-z*s,rz=x*s+z*c,ry=y*Math.cos(tilt)-rz*Math.sin(tilt),depth=y*Math.sin(tilt)+rz*Math.cos(tilt),scale=760/(850+depth);return{x:w/2+rx*scale,y:h/2+ry*scale,depth,scale};}
const size=()=>Math.min(w*.34,160),heightStep=()=>Math.min(h*.085,53);
function point(x,l,z){return project(x,(3-l)*heightStep(),z);}
function polygon(points,fill,stroke){context.beginPath();points.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.closePath();if(fill){context.fillStyle=fill;context.fill()}if(stroke){context.strokeStyle=stroke;context.stroke()}}
function line(a,b,color,width=1){context.beginPath();context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);context.strokeStyle=color;context.lineWidth=width;context.stroke();context.lineWidth=1;}
function draw(){if(!context||!w||!h)return;context.clearRect(0,0,w,h);hit=[];const r=size();
 // Continuous columns expose the relationships between the seven explanatory layers.
 for(const [x,z] of [[-r*.72,-r*.62],[r*.72,r*.62],[0,0]])line(point(x,0,z),point(x,6,z),'#b8a2b728');
 for(let l=6;l>=0;l--){const chosen=l===selected,col=layers[l].color;const corners=[point(-r,l,-r*.63),point(r,l,-r*.63),point(r,l,r*.63),point(-r,l,r*.63)];
  context.save();context.lineWidth=chosen?1.5:1;polygon(corners,chosen?'#492b3bbd':'#261622a3',chosen?col:col+'45');
  for(let k=-1;k<=1;k++){line(point(k*r*.5,l,-r*.63),point(k*r*.5,l,r*.63),chosen?col+'1f':'#b8a2b70c');line(point(-r,l,k*r*.31),point(r,l,k*r*.31),chosen?col+'1f':'#b8a2b70c');}
  [[-r*.65,-r*.32],[r*.6,-r*.15],[r*.06,r*.37]].forEach(([x,z],i)=>{const p=point(x,l,z),rad=(chosen?5:3)*p.scale;context.beginPath();context.arc(p.x,p.y,rad,0,Math.PI*2);context.fillStyle=col;context.shadowColor=col;context.shadowBlur=chosen?18:7;context.fill();context.shadowBlur=0;if(chosen){context.font=`${w<500?12:13}px Space,Arial`;context.fillStyle='#f4eadb';context.fillText(layers[l].nodes[i],p.x+10,p.y-8);}});
  const label=point(-r-27,l,r*.63);context.font='12px JetBrains,monospace';context.fillStyle=chosen?col:'#a68c9b';context.textAlign='right';context.fillText(String(l+1).padStart(2,'0'),label.x,label.y+4);context.textAlign='left';hit.push({layer:l,polygon:corners});context.restore();
 }
}
function schedule(){if(!frame&&visible&&!paused&&!pointer)frame=requestAnimationFrame(tick);}
function tick(t){frame=0;if(!visible||paused||pointer){lastTime=0;return;}if(lastTime)angle+=Math.min(t-lastTime,40)*.000035;lastTime=t;draw();schedule();}
function resize(){const r=wrap.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);context?.setTransform(dpr,0,0,dpr,0,0);draw();}
function select(n){selected=n;const l=layers[n];$('[data-atlas-title]').textContent=l.title;$('[data-atlas-description]').textContent=l.description;$('[data-atlas-connection]').textContent=l.connection;const items=$('[data-atlas-items]');items.replaceChildren(...l.nodes.map(name=>{const span=document.createElement('span');span.className='pill';span.textContent=name;return span}));const link=$('[data-atlas-link]');link.href=l.link;link.textContent=l.cta+' ↗';buttons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.layer)===n)));draw();}
function inside(x,y,poly){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x))result=!result;}return result;}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>5)pointer.moved=true;angle+=dx*.009;tilt=Math.max(.1,Math.min(.6,tilt+dy*.003));pointer.x=e.clientX;pointer.y=e.clientY;draw()});
function end(e){if(!pointer)return;if(e.type==='pointerup'&&!pointer.moved){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const item=hit.slice().reverse().find(v=>inside(x,y,v.polygon));if(item)select(item.layer);}pointer=null;canvas.style.cursor='grab';lastTime=0;schedule();}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);canvas.style.cursor='grab';buttons.forEach(b=>b.disabled=false);if(context)$('[data-atlas-text]').open=false;$('[data-atlas-reset]').disabled=!context;buttons.forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.layer))));$('[data-atlas-reset]').addEventListener('click',()=>{angle=-.63;tilt=.24;select(4)});
document.addEventListener('ntnd-motion',e=>{paused=e.detail.paused;if(paused){cancelAnimationFrame(frame);frame=0;lastTime=0;}else schedule()});
new ResizeObserver(resize).observe(wrap);if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;lastTime=0;}},{threshold:.05}).observe(canvas);else{visible=true;schedule()}
if(!context)$('[data-atlas-status]').textContent='The layer buttons contain the same relationships as the visual map.';resize();
