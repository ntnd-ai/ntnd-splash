const root = document.querySelector('.mp-agents');
if (root) {
 const $ = (selector, scope = document) => scope.querySelector(selector);
 const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
 const dialog = $('[data-mp-dialog]');
 const detail = $('[data-mp-detail]');
 const stillMotion = matchMedia('(prefers-reduced-motion: reduce)');

 function openDetail(id) {
  const template = $(`template[data-detail="${CSS.escape(id)}"]`);
  if (!template) return false;
  detail.replaceChildren(template.content.cloneNode(true));
  const title = $('h3', detail);
  if (title) title.id = 'mp-detail-title';
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  updateStage();
  return true;
 }

 document.addEventListener('click', event => {
  const target = event.target.closest('button,a');
  if (!target) {
   if (event.target === dialog) { dialog.close(); return; }
   const card = event.target.closest('.mp-agent');
   if (card && !dialog.open) openDetail(card.dataset.agent);
   return;
  }
  if (target.dataset.open) {
   if (openDetail(target.dataset.open)) event.preventDefault();
   return;
  }
  if ('mpClose' in target.dataset) dialog.close();
 });
 dialog.addEventListener('close', updateStage);

 const stage = $('[data-mp-stage]');
 const slides = $$('[data-slide]', stage);
 const dots = $$('[data-dot]', stage);
 const pause = $('[data-stage-pause]', stage);
 const SLIDE_MS = 7000;
 let at = 0, paused = false, held = false, timer = 0;
 const running = () => !paused && !held && !stillMotion.matches && !dialog.open && !document.hidden && !document.documentElement.classList.contains('motion-paused');
 function updateStage() {
  clearTimeout(timer);
  stage.classList.remove('running');
  void stage.offsetWidth;
  const on = running();
  stage.classList.toggle('running', on);
  if (on) timer = setTimeout(() => show(at + 1), SLIDE_MS);
 }
 function show(n) {
  at = (n + slides.length) % slides.length;
  slides.forEach((slide, k) => {
   slide.classList.toggle('on', k === at);
   slide.inert = k !== at;
   if (k === at) slide.removeAttribute('aria-hidden'); else slide.setAttribute('aria-hidden', 'true');
  });
  dots.forEach((dot, k) => {
   dot.classList.toggle('on', k === at);
   if (k === at) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
  });
  updateStage();
 }
 function syncPause() {
  pause.textContent = paused ? '▶' : 'Ⅱ';
  pause.setAttribute('aria-label', paused ? 'Play the slideshow' : 'Pause the slideshow');
  pause.hidden = stillMotion.matches;
 }
 $('[data-stage-controls]', stage).hidden = false;
 stage.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.dot) show(Number(button.dataset.dot));
  else if ('stagePrev' in button.dataset) show(at - 1);
  else if ('stageNext' in button.dataset) show(at + 1);
  else if ('stagePause' in button.dataset) { paused = !paused; syncPause(); updateStage(); }
 });
 const hold = value => () => { held = value; updateStage(); };
 stage.addEventListener('pointerenter', hold(true));
 stage.addEventListener('pointerleave', hold(false));
 stage.addEventListener('focusin', hold(true));
 stage.addEventListener('focusout', hold(false));
 document.addEventListener('visibilitychange', updateStage);
 stillMotion.addEventListener('change', () => { syncPause(); updateStage(); });

 syncPause();
 updateStage();

 const player = $('[data-mp-player]');
 if (player) {
  const clips = $$('[data-clip]', player);
  const captions = $$('[data-clip-caption]', player);
  const stepButtons = $$('[data-step]');
  let current = 0, visible = false;
  const auto = () => !stillMotion.matches;
  clips.forEach(clip => { clip.controls = !auto(); });
  function select(n, play) {
   current = (n + clips.length) % clips.length;
   clips.forEach((clip, k) => {
    clip.classList.toggle('on', k === current);
    if (k !== current) { clip.pause(); clip.currentTime = 0; }
   });
   captions.forEach((caption, k) => caption.classList.toggle('on', k === current));
   stepButtons.forEach((button, k) => {
    button.classList.toggle('on', k === current);
    button.setAttribute('aria-selected', k === current ? 'true' : 'false');
    button.style.setProperty('--progress', '0');
   });
   if (play) clips[current].play().catch(() => {});
  }
  clips.forEach((clip, k) => {
   clip.addEventListener('timeupdate', () => {
    if (k === current && clip.duration) stepButtons[k]?.style.setProperty('--progress', String(clip.currentTime / clip.duration));
   });
   clip.addEventListener('ended', () => { if (auto() && visible) select(current + 1, true); });
  });
  stepButtons.forEach((button, k) => button.addEventListener('click', () => select(k, true)));
  new IntersectionObserver(entries => {
   visible = entries.some(entry => entry.isIntersecting);
   if (visible && auto()) clips[current].play().catch(() => {});
   else clips[current].pause();
  }, { threshold: 0.4 }).observe(player);
  stillMotion.addEventListener('change', () => {
   clips.forEach(clip => { clip.controls = !auto(); });
   if (!auto()) clips[current].pause();
  });
 }
}
