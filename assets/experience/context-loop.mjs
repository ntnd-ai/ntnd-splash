// Selected original Silk surface. Public illustration only; no connection to the local core.
const root = document.querySelector('[data-context-journey]');
const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
const buttons = [...root.querySelectorAll('[data-context-floor]')];
const prompt = root.querySelector('[data-context-prompt]');
const panels = [...root.querySelectorAll('[data-context-details]')];
const examples = panels.map(panel=>panel.dataset.examples.split('|'));
const exampleTypes = panels.map(panel=>panel.dataset.exampleTypes.split('|'));
const heading = root.querySelector('.context-stage-heading'), dimensions = root.querySelector('.context-floors');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const colors = ['#ed83ad','#d5f45a','#87d5ef','#ffc17b','#dd68b8','#f1c7ab','#aa9ee7'];
const T = Math.PI * 2, clamp = (n,a=0,b=1) => Math.max(a,Math.min(b,n));
function point(u,v) { const r=188-131*Math.cos(v); return {x:r*Math.cos(u),y:190*Math.sin(v),z:r*Math.sin(u)}; }
const lines=[], tracks=[];
for(let i=0;i<44;i++) {
 const points=Array.from({length:129},(_,j)=>point(i/44*T,j/128*T));
 lines.push({points,color:i%7===0?'#d5f45a':'#ca91b5',alpha:i%7===0?.56:.24,weight:i%7===0?1.05:.62});
 if(i%7===0) tracks.push(points);
}
for(let i=0;i<36;i++) lines.push({points:Array.from({length:161},(_,j)=>point(j/160*T,i/36*T)),color:'#f6dce9',alpha:.12,weight:.6});
function sample(track,phase) {const p=((phase%1)+1)%1*128,i=Math.floor(p),f=p-i,a=track[i],b=track[i+1];return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f};}
const dots=Array.from({length:84},(_,i)=>{const floor=Math.floor(i/12),j=i%12,v=-1.25+floor/6*2.5;return {floor,seed:floor*1.71+j*2.399,phase:v/T+j*.019,track:j%tracks.length,p:point(j/12*T+floor*.33,v)};});
const layers=colors.map((color,i)=>{const v=-1.25+i/6*2.5;return {color,y:190*Math.sin(v),radius:188-131*Math.cos(v)};});
const edgeStars=[[.06,.12],[.23,.05],[.45,.08],[.69,.04],[.88,.1],[.96,.24],[.94,.49],[.97,.72],[.87,.91],[.72,.96],[.52,.89],[.34,.95],[.14,.9],[.04,.73],[.03,.43],[.34,.045],[.57,.055],[.79,.06],[.965,.16],[.96,.85],[.79,.94],[.61,.95],[.43,.92],[.23,.93],[.035,.59]];
const starExclusion=Array.from({length:96},(_,i)=>point(i%12/12*T,Math.floor(i/12)/8*T));
const backdrop=document.createElement('canvas'), back=backdrop.getContext('2d');
let w=1,h=1,dpr=1,progress=reduced.matches?1:0,target=progress,selected=-1,time=0;
// Prefer crisp high-density rendering; reduce only after sustained expensive frames.
const pixelBudgets=[4000000,2500000,1500000];
let qualityTier=0,renderSamples=0,renderTotal=0;
let hovered=-1,zoom=1,focusY=0,userYaw=0,userPitch=0,panX=0,panY=0;
const hitNodes=[],hitPlanes=[];
let raf=0,last=0,inView=false,active=true,dirty=true,paused=document.documentElement.classList.contains('motion-paused'),modalPaused=false;
const rgba=(hex,a)=>`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
function dotPosition(dot){return dot.p;}
function feedbackPosition(){return sample(tracks[0],.12+time*.018);}
function drawEdgeStars(project){
 const outline=starExclusion.map(project),xs=outline.map(p=>p.x),ys=outline.map(p=>p.y);
 const bounds={left:Math.min(...xs)-28,right:Math.max(...xs)+28,top:Math.min(...ys)-28,bottom:Math.max(...ys)+28};
 const origin=canvas.getBoundingClientRect(),controls=[heading,dimensions].map(element=>element.getBoundingClientRect());
 ctx.setTransform(dpr,0,0,dpr,0,0);
 edgeStars.forEach(([u,v],i)=>{
  const x=u*w,y=v*h;
  if(x>bounds.left&&x<bounds.right&&y>bounds.top&&y<bounds.bottom)return;
  if(controls.some(r=>x>r.left-origin.left-14&&x<r.left-origin.left+r.width+14&&y>r.top-origin.top-14&&y<r.top-origin.top+r.height+14))return;
  const pulse=.5+.5*Math.sin(time*(.6+(i%3)*.07)+i*2.399),radius=4+(i%3)*.7+pulse*.6;
  const color=i%3===0?'#cbdcff':'#f4ddeb';
  ctx.shadowColor=rgba(color,.18+pulse*.12);ctx.shadowBlur=5;
  ctx.fillStyle=rgba(color,.10+pulse*.28);
  ctx.beginPath();ctx.moveTo(x,y-radius);ctx.lineTo(x+.7,y-.7);ctx.lineTo(x+radius*.75,y);ctx.lineTo(x+.7,y+.7);
  ctx.lineTo(x,y+radius);ctx.lineTo(x-.7,y+.7);ctx.lineTo(x-radius*.75,y);ctx.lineTo(x-.7,y-.7);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;
 });
}
function drawDimensionConnectors(project){
 if(progress<.9||w<=720)return;
 // Align the selector's Governance row to the resting plane center by moving
 // only the selector. Its title and expanded descriptions affect row positions.
 const nav=dimensions.getBoundingClientRect(),governance=buttons[3].getBoundingClientRect();
 const alignment=nav.height/2-(governance.top-nav.top+governance.height/2);
 dimensions.style.setProperty('--governance-align',`${alignment}px`);
 const origin=canvas.getBoundingClientRect(),alpha=clamp((progress-.9)/.1);
 buttons.forEach((button,floor)=>{
  if(selected>=0&&selected!==floor)return;
  const r=button.getBoundingClientRect(),q=project({x:0,y:layers[floor].y,z:0});
  const x=r.left-origin.left,y=r.top-origin.top+r.height/2;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-28,y);ctx.lineTo(x-28,q.y);ctx.lineTo(q.x,q.y);
  ctx.strokeStyle=rgba(colors[floor],alpha*(hovered===floor?.75:selected<0||selected===floor?.38:.1));ctx.lineWidth=.8;ctx.stroke();
 });
}
function labelColumnWidth(){ctx.font='14px "Space Grotesk", sans-serif';return Math.max(...examples.flat().map(text=>ctx.measureText(text).width))+24;}
function drawExamples(project){
 if(progress<.90||selected<0)return;
 const mobile=w<=720,origin=canvas.getBoundingClientRect();
 const occupied=[heading,dimensions].map(element=>{const r=element.getBoundingClientRect();return {x:r.left-origin.left-12,y:r.top-origin.top-12,w:r.width+24,h:r.height+24};});
 ctx.textBaseline='middle';
 const seenTypes=new Set();
 const floors=selected<0?(mobile?[1,2,3]:[0,1,2,3,4,5,6]):[selected];
 const items=[];
 // Give every dimension a first example before placing additional labels.
 for(let j=0;j<(selected<0?1:3);j++)for(const floor of floors){
  const type=exampleTypes[floor][j];
  if(selected<0&&seenTypes.has(type))continue;
  seenTypes.add(type);
  items.push({floor,j,type,text:examples[floor][j],p:dotPosition(dots[floor*12+[4,8,0][j]]),key:`${floor}:${j}`});
 }
 const width=labelColumnWidth(),height=44,gap=mobile?8:12;
 const columnX=mobile?w-width-16:occupied[1].x-width-16,total=items.length*height+(items.length-1)*gap;
 const minY=mobile?occupied[0].y+occupied[0].h+8:48;
 const maxY=mobile?occupied[1].y-8:h-96;
 const columnY=clamp(h*.46-total/2,minY,Math.max(minY,maxY-total));
 for(const [row,{floor,j,type,text,p,key}] of items.entries()){
  const q=project(p),center=project({x:0,y:layers[floor].y,z:0});
  const alpha=clamp((progress-.9)/.1);
  ctx.globalAlpha=alpha;
  ctx.beginPath();ctx.arc(q.x,q.y,13,0,T);ctx.fillStyle=rgba(colors[floor],.12);ctx.fill();
  ctx.beginPath();ctx.arc(q.x,q.y,7,0,T);ctx.strokeStyle=rgba(colors[floor],.9);ctx.lineWidth=1.3;ctx.stroke();
  ctx.beginPath();ctx.arc(q.x,q.y,3,0,T);ctx.fillStyle=colors[floor];ctx.fill();ctx.globalAlpha=1;
  let box={x:columnX,y:columnY+row*(height+gap),w:width,h:height};
  if(selected>=0){
   const layer=layers[floor],rim=Array.from({length:16},(_,i)=>project({x:layer.radius*Math.cos(i/16*T),y:layer.y,z:layer.radius*Math.sin(i/16*T)}));
   const rx=Math.max(...rim.map(v=>Math.abs(v.x-center.x)))+width*.6;
   const ry=Math.max(...rim.map(v=>Math.abs(v.y-center.y)))+height+24;
   const left=mobile?16:24,right=mobile?w-16:occupied[1].x-16;
   const overlaps=(a,b)=>a.x<b.x+b.w+8&&a.x+a.w+8>b.x&&a.y<b.y+b.h+8&&a.y+a.h+8>b.y;
   const candidates=[];
   for(const extra of [0,40,80,120])for(const offset of [0,.2,-.2,.4,-.4,.65,-.65]){
    const angle=Math.atan2((q.y-center.y)/ry,(q.x-center.x)/rx)+offset;
    candidates.push({x:clamp(center.x+Math.cos(angle)*(rx+extra)-width/2,left,right-width),y:clamp(center.y+Math.sin(angle)*(ry+extra)-height/2,minY,Math.max(minY,maxY-height)),w:width,h:height});
   }
   const clearance=candidate=>Math.hypot(q.x-clamp(q.x,candidate.x,candidate.x+candidate.w),q.y-clamp(q.y,candidate.y,candidate.y+candidate.h));
   const available=candidates.filter(candidate=>!occupied.some(r=>overlaps(candidate,r)));
   box=available.find(candidate=>clearance(candidate)>=(mobile?32:56))||available.sort((a,b)=>clearance(b)-clearance(a))[0]||box;
  }
  occupied.push(box);
  // Route an orthogonal bracket toward the nearest label edge, never across to
  // an arbitrary list-order slot on the opposite side of the plane.
  const above=box.y+height<=q.y,below=box.y>=q.y;
  ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(q.x,q.y);
  if((above||below)&&q.x>=box.x-12&&q.x<=box.x+box.w+12){
   const edgeX=clamp(q.x,box.x+10,box.x+box.w-10),edgeY=above?box.y+height:box.y,elbowY=edgeY+(above?22:-22);
   ctx.lineTo(q.x,elbowY);ctx.lineTo(edgeX,elbowY);ctx.lineTo(edgeX,edgeY);
  }else{
   const edgeX=q.x<box.x+box.w/2?box.x:box.x+box.w,edgeY=box.y+height/2,elbowX=edgeX+(q.x<edgeX?-24:24);
   ctx.lineTo(elbowX,q.y);ctx.lineTo(elbowX,edgeY);ctx.lineTo(edgeX,edgeY);
  }
  ctx.strokeStyle=rgba(colors[floor],.58);ctx.lineWidth=.9;ctx.stroke();
  // Quiet HUD corners leave the wireframe visible; type and title carry the hierarchy.
  ctx.fillStyle='rgba(23,13,25,.58)';ctx.fillRect(box.x,box.y,box.w,box.h);
  ctx.beginPath();ctx.moveTo(box.x,box.y+7);ctx.lineTo(box.x,box.y);ctx.lineTo(box.x+7,box.y);
  ctx.moveTo(box.x+box.w-7,box.y+box.h);ctx.lineTo(box.x+box.w,box.y+box.h);ctx.lineTo(box.x+box.w,box.y+box.h-7);
  ctx.strokeStyle=rgba(colors[floor],.7);ctx.lineWidth=.8;ctx.stroke();
  ctx.font='12px ui-monospace, monospace';ctx.fillStyle=colors[floor];ctx.fillText(type,box.x+10,box.y+11);
  ctx.font='14px "Space Grotesk", sans-serif';ctx.fillStyle='#f7eaf2';ctx.fillText(text,box.x+10,box.y+30);ctx.globalAlpha=1;
 }
}
function paint() {
 const e=progress*progress*(3-2*progress),yaw=-.12-e*.40+Math.sin(time*.10)*.154*e+userYaw,pitch=clamp(1.17-e*.78+Math.sin(time*.07)*.0275*e+userPitch,-1.2,1.2);
 const origin=canvas.getBoundingClientRect(),controls=dimensions.getBoundingClientRect();
 const left=w>720?40:20,right=w>720?controls.left-origin.left-40:w-40;
 const graphWidth=Math.max(1,right-left-(w>720?labelColumnWidth()+24:0)),graphCenter=(left+right)/2-(w>720?Math.min(32,w*.02):0);
 const revealScale=w>720?3.6-e*2.6:1.85-e*.85;
 const scale=Math.min(graphWidth/800,(h-190)/590)*(w>720?1.08:1)*zoom*revealScale,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const project=p=>{const x=p.x*cy-p.z*sy,z=p.x*sy+p.z*cy,y=(p.y-focusY)*cp-z*sp,depth=(p.y-focusY)*sp+z*cp,s=scale*1200/(1200+depth);return {x:graphCenter+x*s+panX,y:h*(.60-.14*progress)+y*s+panY};};
 hitNodes.length=0;
 if(dirty) {
  hitPlanes.length=0;
  back.setTransform(dpr,0,0,dpr,0,0);back.clearRect(0,0,w,h);
  // Feathered light follows each layer's plane and the same camera as its nodes.
  // No opaque surfaces or hard rims: the wireframe remains visible through the glow.
  back.globalCompositeOperation='screen';
  layers.forEach((layer,i)=>{
   const center=project({x:0,y:layer.y,z:0}),radius=layer.radius*1.35;
   const x=project({x:radius,y:layer.y,z:0}),z=project({x:0,y:layer.y,z:radius});
   const strength=e*(hovered===i?.4:selected<0?.19:selected===i?.34:.045);
   hitPlanes.push({floor:i,cx:center.x,cy:center.y,ax:x.x-center.x,ay:x.y-center.y,bx:z.x-center.x,by:z.y-center.y});
   back.save();back.transform(x.x-center.x,x.y-center.y,z.x-center.x,z.y-center.y,center.x,center.y);
   const glow=back.createRadialGradient(0,0,0,0,0,1);
   glow.addColorStop(0,rgba(layer.color,strength*.55));glow.addColorStop(.4,rgba(layer.color,strength));
   glow.addColorStop(.72,rgba(layer.color,strength*.4));glow.addColorStop(1,rgba(layer.color,0));
   back.fillStyle=glow;back.beginPath();back.arc(0,0,1,0,T);back.fill();back.restore();
  });
  back.globalCompositeOperation='source-over';
  for(const line of lines) {back.beginPath();line.points.forEach((p,i)=>{const q=project(p);if(i)back.lineTo(q.x,q.y);else back.moveTo(q.x,q.y);});back.strokeStyle=rgba(line.color,Math.min(1,line.alpha*(w<=720?1.5:1)));back.lineWidth=line.weight*(w<=720?1.12:1);back.stroke();}
  const dimensionsReveal=clamp((progress-.6)/.08);
  // Reveal the title and all seven controls as one unit on both layouts.
  dimensions.style.opacity=String(dimensionsReveal);
  dimensions.style.visibility=dimensionsReveal>0?'visible':'hidden';
  buttons.forEach(button=>{button.tabIndex=dimensionsReveal>0?0:-1;});
  prompt.textContent=progress<.7?'Scroll to see the whole picture.':selected<0?'Explore a plane or point.':'Click empty space or press Esc to see the whole brain.';
  dirty=false;
 }
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
 drawEdgeStars(project);
 ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(backdrop,0,0);ctx.setTransform(dpr,0,0,dpr,0,0);
 for(const [index,dot] of dots.entries()) {
  if(dot.floor===1&&selected!==1&&index%12!==4)continue;
  const p=project(dotPosition(dot));
  hitNodes.push({x:p.x,y:p.y,floor:dot.floor});
  if(hovered===dot.floor){ctx.beginPath();ctx.arc(p.x,p.y,5,0,T);ctx.strokeStyle=rgba(colors[dot.floor],.7);ctx.lineWidth=1;ctx.stroke();}
  const pulse=.5+.5*Math.sin(time*(.72+.055*Math.sin(dot.seed))+dot.seed),color=colors[dot.floor],fade=selected<0||selected===dot.floor?1:.2;
  // Fixed-size soft marks: no frame history, textures or per-dot bitmap allocation.
  ctx.fillStyle=rgba(color,fade*(.025+pulse*.065));ctx.beginPath();ctx.arc(p.x,p.y,7+pulse*3,0,T);ctx.fill();
  ctx.fillStyle=rgba(color,fade*(.43+pulse*.42));ctx.beginPath();ctx.arc(p.x,p.y,1.3+pulse*.55,0,T);ctx.fill();
  ctx.fillStyle=rgba('#fff4fa',fade*Math.pow(pulse,10)*.5);ctx.beginPath();ctx.arc(p.x,p.y,.8,0,T);ctx.fill();
 }
 // One independent signal travels the green loop; it is not a Functions item.
 if(progress>.7){
  const alpha=clamp((progress-.7)/.3)*(selected<0||selected===1?1:.3);
  for(let i=6;i>=0;i--){
   const p=project(sample(tracks[0],.12+time*.018-i*.003));
   ctx.fillStyle=rgba('#d5f45a',alpha*(i===0?.95:(1-i/7)*.3));ctx.beginPath();ctx.arc(p.x,p.y,i===0?3.6:1.8,0,T);ctx.fill();
   if(i===0){ctx.fillStyle=rgba('#d5f45a',alpha*.12);ctx.beginPath();ctx.arc(p.x,p.y,12,0,T);ctx.fill();}
  }
 }
 drawDimensionConnectors(project);
 drawExamples(project);
}
function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
function wake(){if(ctx&&!raf&&inView&&active&&!document.hidden)raf=requestAnimationFrame(tick);}
function tick(now){
 raf=0;if(!inView||!active||document.hidden)return;
 if(!last||now-last>=50){const dt=last?Math.min((now-last)/1000,.1):0;last=now;
  if(Math.abs(target-progress)>.001){progress=reduced.matches?target:progress+(target-progress)*.2;dirty=true;}else if(progress!==target){progress=target;dirty=true;}
  if(!paused&&!modalPaused&&!reduced.matches){time+=dt;if(progress>0)dirty=true;}
  const wantedZoom=selected<0?1:1.16,wantedY=selected<0?0:layers[selected].y*.7;
  if(Math.abs(zoom-wantedZoom)>.001||Math.abs(focusY-wantedY)>.1){
   const blend=reduced.matches?1:.2;zoom+=(wantedZoom-zoom)*blend;focusY+=(wantedY-focusY)*blend;dirty=true;
  }else if(zoom!==wantedZoom||focusY!==wantedY){zoom=wantedZoom;focusY=wantedY;dirty=true;}
  const renderStart=performance.now();
  paint();
  renderTotal+=performance.now()-renderStart;renderSamples++;
  if(renderSamples>=40){
   if(renderTotal/renderSamples>35&&qualityTier<pixelBudgets.length-1){qualityTier++;measure();}
   renderSamples=0;renderTotal=0;
  }
 }
 if(dirty||Math.abs(target-progress)>.001||Math.abs(zoom-(selected<0?1:1.16))>.001||Math.abs(focusY-(selected<0?0:layers[selected].y*.7))>.1||(!paused&&!modalPaused&&!reduced.matches))wake();
}
function measure(){const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(pixelBudgets[qualityTier]/(w*h)),4096/w,4096/h);
 for(const surface of [canvas,backdrop]){const width=Math.max(1,Math.floor(w*dpr)),height=Math.max(1,Math.floor(h*dpr));if(surface.width!==width)surface.width=width;if(surface.height!==height)surface.height=height;}
 dirty=true;wake();
}
function setProgress(p){const next=selected>=0?1:clamp(p);if(next===target)return;target=next;dirty=true;wake();}
// Reveal while this full-width section enters the viewport; never capture the wheel or pin the page.
function onScroll(){if(!inView)return;const r=root.getBoundingClientRect(),vh=window.innerHeight;setProgress(reduced.matches?1:(vh*.65-r.top)/(vh*.63));}
function highlightDimension(i){
 hovered=i;
 buttons.forEach((button,j)=>button.setAttribute('data-hovered',String(j===i)));
 dirty=true;wake();
}
function selectDimension(i){

 selected=i<0||selected===i?-1:i;highlightDimension(-1);
 // A deliberate choice completes the reveal immediately; the labels must not
 // depend on a further page scroll after the dimension has been selected.
 if(selected>=0)setProgress(1);else onScroll();
 buttons.forEach((button,j)=>{
  const expanded=selected===j;
  button.setAttribute('aria-expanded',String(expanded));
  button.querySelector('i').textContent=expanded?'−':'+';
  panels[j].hidden=!expanded;
 });
 dirty=true;wake();
}
buttons.forEach((b,i)=>{
 b.addEventListener('click',()=>selectDimension(i));
 for(const event of ['pointerenter','focus'])b.addEventListener(event,()=>highlightDimension(i));
 for(const event of ['pointerleave','blur'])b.addEventListener(event,()=>{if(hovered===i)highlightDimension(-1);});
});
function hitTest(x,y){
 if(progress<.9)return -1;
 let nearest=-1,distance=18;
 for(const node of hitNodes){const d=Math.hypot(x-node.x,y-node.y);if(d<distance){nearest=node.floor;distance=d;}}
 if(nearest>=0)return nearest;
 let best=.8;
 for(const p of hitPlanes){
  const det=p.ax*p.by-p.ay*p.bx;if(Math.abs(det)<.001)continue;
  const dx=x-p.cx,dy=y-p.cy,u=(dx*p.by-dy*p.bx)/det,v=(dy*p.ax-dx*p.ay)/det,d=Math.hypot(u,v);
  if(d<best){nearest=p.floor;best=d;}
 }
 return nearest;
}
function pointerFloor(event){const r=canvas.getBoundingClientRect();return hitTest(event.clientX-r.left,event.clientY-r.top);}
let drag=null,suppressClick=false;
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0||event.pointerType==='touch'||progress<.9)return;
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,pan:event.shiftKey||event.metaKey,moved:false};suppressClick=false;
 canvas.setPointerCapture?.(event.pointerId);canvas.focus?.({preventScroll:true});
});
canvas.addEventListener('pointermove',event=>{
 if(drag&&drag.id===event.pointerId){
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>5)drag.moved=true;
  if(drag.moved){
   if(drag.pan){panX=clamp(panX+dx,-w*.4,w*.4);panY=clamp(panY+dy,-h*.4,h*.4);}
   else{userYaw+=dx*.005;userPitch=clamp(userPitch+dy*.004,-1.2,.8);}
   highlightDimension(-1);canvas.style.cursor='grabbing';
  }
  drag.x=event.clientX;drag.y=event.clientY;return;
 }
 const next=pointerFloor(event);if(next!==hovered){highlightDimension(next);canvas.style.cursor=next>=0?'pointer':'grab';}
});
function endDrag(event){if(!drag||event.pointerId!==drag.id)return;suppressClick=drag.moved||event.type==='pointercancel';const id=drag.id;drag=null;if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture(id);canvas.style.cursor='grab';}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('lostpointercapture',()=>{if(drag){suppressClick=true;drag=null;}});
canvas.addEventListener('pointerleave',()=>{if(!drag)highlightDimension(-1);});
canvas.addEventListener('click',event=>{if(suppressClick){suppressClick=false;return;}selectDimension(pointerFloor(event));});
root.addEventListener('keydown',event=>{
 if(event.key==='Escape'){selectDimension(-1);event.preventDefault();}
 if(event.target!==canvas)return;
 if(event.key==='Home'){userYaw=userPitch=panX=panY=0;selectDimension(-1);event.preventDefault();}
 const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
 if(delta){event.preventDefault();if(event.shiftKey){panX=clamp(panX+delta[0]*24,-w*.4,w*.4);panY=clamp(panY+delta[1]*24,-h*.4,h*.4);}else{userYaw+=delta[0]*.1;userPitch=clamp(userPitch+delta[1]*.08,-1.2,.8);}dirty=true;wake();}
});
const intersection=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);if(inView){onScroll();wake();}else stop();});
const resize=new ResizeObserver(()=>{measure();onScroll();});
if(ctx){root.classList.add('context-ready');intersection.observe(canvas);resize.observe(canvas);measure();}
else {canvas.hidden=true;root.style.height='auto';root.style.minHeight='0';}
window.addEventListener('scroll',onScroll,{passive:true});
document.addEventListener('ntnd-motion',e=>{paused=document.documentElement.classList.contains('motion-paused');modalPaused=e.detail.paused;dirty=true;wake();});
document.addEventListener('visibilitychange',()=>document.hidden?stop():wake());
reduced.addEventListener('change',()=>{setProgress(1);measure();});
window.addEventListener('pagehide',()=>{active=false;stop();canvas.width=canvas.height=backdrop.width=backdrop.height=1;});
window.addEventListener('pageshow',()=>{active=true;measure();onScroll();wake();});
