(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData;
  const videos = [...document.querySelectorAll('[data-lazy-video]')];
  const promoteSources = (video) => video.querySelectorAll('source[data-src]').forEach((source) => {
    source.src = source.dataset.src;
    source.removeAttribute('data-src');
  });
  const play = (video) => {
    if (reduced || saveData) return;
    promoteSources(video);
    if (video.readyState === 0) video.load();
    video.play().catch(() => {});
  };
  const videoObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) play(entry.target);
    else entry.target.pause();
  }), { rootMargin: '100px 0px' });
  videos.forEach((video) => videoObserver.observe(video));

  document.querySelectorAll('[data-media-strip]').forEach((wrap) => {
    const strip = wrap.querySelector('.media-strip');
    if (!strip) return;
    const slides = [...strip.children];
    const count = wrap.querySelector('[data-strip-count]');
    const update = () => {
      const index = Math.min(slides.length - 1, Math.max(0, Math.round(strip.scrollLeft / Math.max(1, slides[0].offsetWidth + 16))));
      if (count) count.textContent = `${index + 1} — ${slides.length}`;
    };
    wrap.querySelector('[data-strip-prev]')?.addEventListener('click', () => strip.scrollBy({ left: -(slides[0]?.offsetWidth || 280) - 16, behavior: reduced ? 'auto' : 'smooth' }));
    wrap.querySelector('[data-strip-next]')?.addEventListener('click', () => strip.scrollBy({ left: (slides[0]?.offsetWidth || 280) + 16, behavior: reduced ? 'auto' : 'smooth' }));
    strip.addEventListener('scroll', update, { passive: true });
    strip.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); strip.scrollBy({ left: -300, behavior: 'smooth' }); }
      if (event.key === 'ArrowRight') { event.preventDefault(); strip.scrollBy({ left: 300, behavior: 'smooth' }); }
    });
    let dragging = false; let startX = 0; let startScroll = 0;
    strip.addEventListener('pointerdown', (event) => { if (event.pointerType === 'mouse') { dragging = true; startX = event.clientX; startScroll = strip.scrollLeft; strip.setPointerCapture(event.pointerId); } });
    strip.addEventListener('pointermove', (event) => { if (dragging) strip.scrollLeft = startScroll - (event.clientX - startX) * 1.15; });
    strip.addEventListener('pointerup', () => { dragging = false; });
    strip.addEventListener('pointercancel', () => { dragging = false; });
  });

  const dialog = document.querySelector('#media-lightbox');
  const triggers = [...document.querySelectorAll('[data-lightbox-src]')];
  const image = dialog?.querySelector('[data-lightbox-image]');
  const caption = dialog?.querySelector('[data-lightbox-caption]');
  let lightboxIndex = 0;
  let lightboxTrigger = null;
  const showImage = (index) => {
    lightboxIndex = (index + triggers.length) % triggers.length;
    const trigger = triggers[lightboxIndex];
    if (!trigger || !image) return;
    image.src = trigger.dataset.lightboxSrc || '';
    image.alt = trigger.dataset.lightboxAlt || '';
    if (caption) caption.textContent = trigger.dataset.lightboxCaption || '';
  };
  const openLightbox = (event) => {
    const trigger = event.currentTarget;
    lightboxTrigger = trigger;
    lightboxIndex = triggers.indexOf(trigger);
    showImage(lightboxIndex);
    dialog?.showModal();
    dialog?.querySelector('[data-lightbox-close]')?.focus();
  };
  triggers.forEach((trigger) => trigger.addEventListener('click', openLightbox));
  dialog?.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => showImage(lightboxIndex - 1));
  dialog?.querySelector('[data-lightbox-next]')?.addEventListener('click', () => showImage(lightboxIndex + 1));
  dialog?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showImage(lightboxIndex - 1);
    if (event.key === 'ArrowRight') showImage(lightboxIndex + 1);
  });
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => { lightboxTrigger?.focus(); lightboxTrigger = null; });

  const moments = [...document.querySelectorAll('[data-moment]')];
  const frames = [...document.querySelectorAll('[data-day-frame]')];
  if (moments.length && !matchMedia('(max-width: 900px)').matches) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const index = entry.target.dataset.moment;
      moments.forEach((moment) => moment.classList.toggle('is-active', moment === entry.target));
      const frameIndex = entry.target.dataset.momentFrame || index;
      frames.forEach((frame) => frame.classList.toggle('is-active', frame.dataset.dayFrame === frameIndex));
    }), { threshold: .5 });
    moments.forEach((moment) => observer.observe(moment));
  }

  document.querySelectorAll('[data-youtube-facade]').forEach((button) => button.addEventListener('click', () => {
    const url = button.dataset.youtubeUrl || '';
    const match = url.match(/(?:youtu\.be\/|v=)([\w-]+)/);
    if (!match) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
    iframe.title = button.dataset.youtubeTitle || 'YouTube video';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.setAttribute('allowfullscreen', '');
    button.replaceWith(iframe);
  }));

  const truthButtons = [...document.querySelectorAll('[data-truth]')];
  const truthReveal = document.querySelector('[data-truth-reveal]');
  truthButtons.forEach((button) => button.addEventListener('click', () => {
    truthButtons.forEach((item) => item.classList.toggle('is-selected', item === button));
    if (truthReveal) truthReveal.hidden = false;
  }));
  document.querySelector('[data-truth-reset]')?.addEventListener('click', () => {
    truthButtons.forEach((item) => item.classList.remove('is-selected'));
    if (truthReveal) truthReveal.hidden = true;
  });
})();
