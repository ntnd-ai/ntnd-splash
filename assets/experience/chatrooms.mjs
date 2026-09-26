const tour=document.querySelector('[data-room-tour]');

if(tour){
 const chapters=[...document.querySelectorAll('.chatrooms-tour-chapter[data-room-tour-step]')];
 const title=tour.querySelector('[data-room-tour-title]');
 const caption=tour.querySelector('[data-room-tour-caption]');
 const live=tour.querySelector('[data-room-tour-live]');
 const overlay=tour.querySelector('[data-room-tour-overlay]');
 const theatre=tour.closest('.chatrooms-tour-theatre');
 const chapterTrack=theatre?.querySelector('.chatrooms-tour-chapters');
 let activeStep='';

 const activate=chapter=>{
  if(!chapter||chapter.dataset.roomTourStep===activeStep)return;
  activeStep=chapter.dataset.roomTourStep;
  tour.dataset.roomStep=activeStep;
  if(theatre)theatre.dataset.roomStep=activeStep;
  chapters.forEach(item=>item.setAttribute('aria-pressed',String(item===chapter)));
  if(title)title.textContent=chapter.dataset.roomTourTitle||'';
  if(caption)caption.textContent=chapter.dataset.roomTourCaption||'';
  if(live)live.textContent=chapter.dataset.roomTourLive||'illustrative Chatrooms direction';
  if(overlay){
   overlay.dataset.side=chapters.indexOf(chapter)%2?'left':'right';
   overlay.querySelector('[data-room-tour-overlay-kicker]').textContent=chapter.querySelector('span')?.textContent||'';
   overlay.querySelector('[data-room-tour-overlay-heading]').textContent=chapter.querySelector('h3')?.textContent||'';
   overlay.querySelector('[data-room-tour-overlay-copy]').textContent=chapter.querySelector('p')?.textContent||'';
  }
 };

 const syncToScroll=()=>{
  if(!theatre||!chapters.length)return;
  if(window.innerWidth<=820)return;
  const bounds=theatre.getBoundingClientRect();
  const stage=tour.getBoundingClientRect();
  const viewport=window.innerHeight||1;
  if(bounds.top>viewport*.52){activate(chapters[0]);return;}
  if(bounds.bottom<viewport*.52){activate(chapters.at(-1));return;}
  const trackTop=chapterTrack.getBoundingClientRect().top+window.scrollY;
  const pitch=chapters[0].offsetHeight;
  const readingLine=Math.max(0,stage.top)+stage.height*.42;
  const position=(window.scrollY+readingLine-trackTop)/pitch;
  const index=Math.max(0,Math.min(chapters.length-1,Math.round(position)));
  activate(chapters[index]);
  // The actual app panels are taller than the pinned theatre. Track the page
  // scroll through each chapter so their complete form is shown in sequence.
  if(activeStep==='passport'||activeStep==='permission'){
   const card=tour.querySelector(activeStep==='passport'?'.room-passport-paper':'.room-permission-paper');
   if(card){const progress=Math.max(0,Math.min(1,position-index+.5));card.scrollTop=(card.scrollHeight-card.clientHeight)*progress;}
  }
 };

 chapters.forEach(chapter=>chapter.addEventListener('click',()=>activate(chapter)));
 window.addEventListener('scroll',syncToScroll,{passive:true});
 window.addEventListener('resize',syncToScroll,{passive:true});
 requestAnimationFrame(syncToScroll);
}
