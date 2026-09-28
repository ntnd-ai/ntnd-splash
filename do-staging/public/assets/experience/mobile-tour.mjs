// Keep chapter selection and its preview together on narrow screens. The desktop
// scroll theatre and the original chapter buttons remain the no-JS fallback.
export function mobileTour(tour,chapters,activate){
 const controls=document.createElement('div');
 controls.className='mobile-tour-controls';
 const label=document.createElement('label');
 label.textContent='Chapter';
 const select=document.createElement('select');
 select.setAttribute('aria-label','Choose a walkthrough chapter');
 chapters.forEach((chapter,index)=>{
  const option=document.createElement('option');
  option.value=String(index);
  option.textContent=`${index+1} / ${chapters.length} · ${chapter.querySelector('span').textContent}`;
  select.append(option);
 });
 label.append(select);
 const previous=document.createElement('button');
 previous.type='button';previous.textContent='Previous';
 const next=document.createElement('button');
 next.type='button';next.textContent='Next';
 controls.append(label,previous,next);
 tour.before(controls);
 tour.closest('[class$="tour-theatre"]').classList.add('has-mobile-tour');
 const sync=()=>{
  const index=Math.max(0,chapters.findIndex(chapter=>chapter.getAttribute('aria-pressed')==='true'));
  select.value=String(index);
  previous.disabled=index===0;next.disabled=index===chapters.length-1;
 };
 const choose=index=>{activate(chapters[index]);sync();};
 select.addEventListener('change',()=>choose(Number(select.value)));
 previous.addEventListener('click',()=>choose(Number(select.value)-1));
 next.addEventListener('click',()=>choose(Number(select.value)+1));
 sync();
 return sync;
}
