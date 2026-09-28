import {mobileTour} from './mobile-tour.mjs';
const tour=document.querySelector('[data-brain-tour]');

if(tour){
 const chapters=[...document.querySelectorAll('.brain-tour-chapter[data-brain-tour-step]')];
 const title=tour.querySelector('[data-brain-tour-title]');
 const caption=tour.querySelector('[data-brain-tour-caption]');
 const live=tour.querySelector('[data-brain-tour-live]');
 const overlay=tour.querySelector('[data-brain-tour-overlay]');
 const overlayKicker=overlay?.querySelector('[data-brain-tour-overlay-kicker]');
 const overlayHeading=overlay?.querySelector('[data-brain-tour-overlay-heading]');
 const overlayCopy=overlay?.querySelector('[data-brain-tour-overlay-copy]');
 const theatre=tour.closest('.brain-tour-theatre');
 let activeStep='';
 let syncMobile=()=>{};
 const activate=chapter=>{
  if(!chapter||chapter.dataset.brainTourStep===activeStep)return;
  activeStep=chapter.dataset.brainTourStep;
  tour.dataset.brainStep=activeStep;
  chapters.forEach(item=>item.setAttribute('aria-pressed',String(item===chapter)));
  syncMobile();
  if(title)title.textContent=chapter.dataset.brainTourTitle||'';
  if(caption)caption.textContent=chapter.dataset.brainTourCaption||'';
  if(live)live.textContent=chapter.dataset.brainTourLive||'actual ntndOS product';
  if(overlay){
   if(overlayKicker)overlayKicker.textContent=chapter.querySelector('span')?.textContent||'';
   if(overlayHeading)overlayHeading.textContent=chapter.querySelector('h3')?.textContent||'';
   if(overlayCopy)overlayCopy.textContent=chapter.querySelector('p')?.textContent||'';
   overlay.dataset.side=({overview:'right',dimensions:'right',relationships:'left',files:'left',routes:'right',teams:'right',scope:'left'})[activeStep]||'right';
  }
 };
 const syncToScroll=()=>{
  if(!theatre||!chapters.length)return;
  if(window.innerWidth<=820)return;
  const bounds=theatre.getBoundingClientRect();
  const viewport=window.innerHeight||1;
  if(bounds.top>viewport*.52){activate(chapters[0]);return;}
  if(bounds.bottom<viewport*.52){activate(chapters.at(-1));return;}
  const readingLine=viewport*.52;
  const current=chapters.reduce((closest,chapter)=>{
   const box=chapter.getBoundingClientRect();
   const distance=Math.abs(box.top+box.height*.5-readingLine);
   return distance<closest.distance?{chapter,distance}:closest;
  },{chapter:chapters[0],distance:Infinity});
  activate(current.chapter);
 };
 syncMobile=mobileTour(tour,chapters,activate);
 chapters.forEach(chapter=>chapter.addEventListener('click',()=>activate(chapter)));
 window.addEventListener('scroll',syncToScroll,{passive:true});
 window.addEventListener('resize',syncToScroll,{passive:true});
 requestAnimationFrame(syncToScroll);
}
