// A single intact image plane; light routes are traced in its 1254px coordinates.
// No depth reconstruction, mesh deformation, or independently moving jewels.
const root = document.querySelector('[data-brain-reference]');

if (root) {
  const plane = root.querySelector('[data-brain-plane]');
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d', {alpha: true});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const hero = root.closest('.hero-orbit');
  const size = 1254;
  const routes = [
    // All three trailing nerves meet the visible central socket, not empty space.
    {d:'M 631 914 C 646 997 578 1047 448 1081 C 297 1120 143 1126 18 1115', delay:0, period:10.4, power:0.9},
    {d:'M 638 913 C 668 1019 596 1092 444 1127 C 282 1165 131 1152 17 1126', delay:0.65, period:10.4, power:0.82},
    {d:'M 625 914 C 646 984 569 1040 438 1070 C 289 1104 192 1088 69 1084', delay:1.3, period:10.4, power:0.62},
    // Inner fissure: the socket joins the continuous metal-lined central channel.
    {d:'M 632 912 C 626 866 578 861 562 813 C 546 755 533 681 533 613 C 532 550 528 489 536 424 C 544 355 552 294 573 232 C 584 197 602 161 632 133', delay:0.3, period:9.7, power:0.65},
    // Left inferior fold, then up the narrow wiring channel inside the gold rim.
    {d:'M 626 907 C 595 876 575 858 548 833 C 522 810 505 795 477 795 C 408 797 359 775 302 766 C 257 758 228 758 208 736 C 174 700 152 660 143 617 C 129 566 130 525 143 487 C 157 452 169 423 192 395', delay:1.8, period:11.8, power:0.54},
    // Right gold fold: continuous, curved, recessed channels between gold and stones.
    {d:'M 644 913 C 661 866 689 823 717 792 C 742 765 765 727 802 706 C 841 684 892 693 933 672 C 961 657 961 619 964 588 C 966 548 978 517 981 484 C 986 452 969 416 944 396 C 912 370 900 345 896 317 C 890 286 879 267 855 252 C 827 237 801 241 776 229', delay:2.6, period:12.4, power:0.64},
    // Fine wiring above the right cerebellum follows the existing bundled nerves.
    {d:'M 653 914 C 692 888 729 874 776 856 C 828 837 874 832 916 816 C 961 802 1005 782 1046 774 C 1083 766 1114 746 1133 720', delay:3.7, period:10.8, power:0.48},
    // Small branch at the left gem bed, kept in the rim instead of crossing facets.
    {d:'M 476 794 C 495 781 504 759 503 736 C 503 715 491 703 482 687 C 471 665 470 641 478 618 C 491 583 504 552 509 517', delay:4.7, period:11.8, power:0.40},
  ].map(route => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', route.d);
    const length = path.getTotalLength();
    const count = Math.ceil(length / 3);
    const points = Array.from({length:count + 1}, (_, i) => {
      const p = path.getPointAtLength(length * i / count);
      return [p.x, p.y];
    });
    return {...route, path:new Path2D(route.d), points, length};
  });

  let sitePaused = document.documentElement.classList.contains('motion-paused') || !!document.querySelector('dialog[open]');
  let inView = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let scale = 1;
  let targetX = 0, targetY = 0, x = 0, y = 0;
  let targetScroll = 0, scroll = 0;
  const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
  const canAnimate = () => ctx && inView && !sitePaused && !reduced.matches && !document.hidden;

  function glow(px, py, radius, alpha) {
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, `rgba(237,255,149,${alpha})`);
    gradient.addColorStop(0.23, `rgba(201,255,49,${alpha * 0.38})`);
    gradient.addColorStop(1, 'rgba(181,255,25,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
  }

  function paint(time, moving = true) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // In reduced-motion mode the unaltered artwork supplies the static light.
    if (!moving) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const route of routes) {
      const progress = ((time - route.delay) / route.period % 1 + 1) % 1;
      const envelope = Math.min(1, progress * 10, (1 - progress) * 9) * route.power;
      const last = Math.floor(progress * (route.points.length - 1));
      const trail = Math.max(10, Math.round(95 / route.length * route.points.length));
      // A soft reflection spreads a few pixels into the adjacent polished gold.
      ctx.beginPath();
      route.points.slice(Math.max(0, last - trail), last + 1).forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.strokeStyle = `rgba(196,255,40,${0.13 * envelope})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = `rgba(190,255,28,${0.42 * envelope})`;
      ctx.shadowBlur = 11 * scale;
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (let i = Math.max(1, last - trail); i <= last; i++) {
        const fade = Math.pow(1 - (last - i) / trail, 1.6) * envelope;
        const a = route.points[i - 1], b = route.points[i];
        ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b);
        ctx.strokeStyle = `rgba(220,255,106,${0.78 * fade})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      const head = route.points[last];
      glow(...head, 15, 0.20 * envelope);
      ctx.beginPath(); ctx.arc(...head, 1.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(248,255,199,${0.78 * envelope})`;
      ctx.fill();
    }
    // Slow breathing in the actual nerve socket, with no flashing or random sparks.
    const breath = 0.5 + 0.5 * Math.sin(time * Math.PI * 2 / 6.8);
    glow(636, 928, 39, 0.11 + breath * 0.12);
    glow(631, 965, 20, 0.05 + breath * 0.09);
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now) {
    frame = 0;
    if (!canAnimate()) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;
    elapsed += dt;
    const ease = 1 - Math.exp(-dt * 3.8);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    scroll += (targetScroll - scroll) * ease;
    const driftX = Math.sin(elapsed / 6.2) * 2.6;
    const driftY = (Math.cos(elapsed / 5.1) - 1) * 2;
    plane.style.transform = `translate3d(${(x * 6 + driftX).toFixed(3)}px,${(y * 4 + driftY + scroll * 10).toFixed(3)}px,0) rotateX(${(-y * 0.7).toFixed(3)}deg) rotateY(${(x * 1.05).toFixed(3)}deg) scale(1.012)`;
    paint(elapsed);
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0;
    const active = canAnimate();
    root.dataset.motion = active ? 'playing' : 'paused';
    plane.style.willChange = active ? 'transform' : 'auto';
    if (reduced.matches) {
      plane.style.transform = 'none';
      if (ctx) paint(elapsed, false);
    }
    if (active) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const px = Math.round(root.clientWidth * Math.min(devicePixelRatio || 1, 2));
    canvas.width = canvas.height = Math.max(1, px);
    scale = canvas.width / size;
    if (ctx) paint(elapsed, !reduced.matches);
  }

  function readScroll() {
    targetScroll = clamp(-hero.getBoundingClientRect().top / innerHeight, -1, 1);
  }
  hero.addEventListener('pointermove', event => {
    if (!canAnimate() || !pointer.matches) return;
    const bounds = root.getBoundingClientRect();
    targetX = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
    targetY = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
  }, {passive:true});
  hero.addEventListener('pointerleave', () => {targetX = targetY = 0;}, {passive:true});
  document.addEventListener('ntnd-motion', event => {sitePaused = !!event.detail.paused; sync();});
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  window.addEventListener('scroll', readScroll, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(root);
  else window.addEventListener('resize', resize, {passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) readScroll();
      sync();
    }, {threshold:0.08}).observe(root);
  } else {inView = true; sync();}
  resize(); readScroll();
}
