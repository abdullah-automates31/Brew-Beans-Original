'use strict';

// Scroll progress bar — vanilla equivalent of components/ScrollProgress.jsx, for the
// static (non-Next.js) pages that share this stylesheet.
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  function update() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const ratio = max > 0 ? h.scrollTop / max : 0;
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// Scroll-triggered fade/slide-in animations for [data-aos] elements, matching the
// AOS.init() options used in app/layout.js for the rest of the site.
(function () {
  if (typeof AOS === 'undefined') return;
  AOS.init({ duration: 450, easing: 'ease-out-cubic', once: true, offset: 60 });
})();
