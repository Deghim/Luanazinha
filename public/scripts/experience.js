(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData;
  const canMove = !reduced && !saveData;
  const promoteSources = (video) => {
    video.querySelectorAll('source[data-src]').forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });
  };
  const startVideo = (video) => {
    promoteSources(video);
    if (video.readyState === 0) video.load();
    if (canMove) video.play().catch(() => {});
  };

  const intro = document.querySelector('[data-intro-reel]');
  if (intro) {
    const videos = [...intro.querySelectorAll('[data-intro-video]')];
    let introVideoGateOpen = false;
    const visibleIntroPanel = (panel) => {
      if (!panel) return false;
      const rect = panel.getBoundingClientRect();
      return rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
    };
    const activateIntroVideo = (video) => {
      const panel = video.closest('[data-intro-panel]');
      if (!introVideoGateOpen || !canMove || !visibleIntroPanel(panel) || video.dataset.introActivated === 'true') return;
      video.dataset.introActivated = 'true';
      startVideo(video);
    };
    const introVideoObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) activateIntroVideo(entry.target.querySelector('[data-intro-video]'));
      });
    }, { rootMargin: '0px', threshold: 0.01 }) : null;
    videos.forEach((video) => introVideoObserver?.observe(video.closest('[data-intro-panel]') || video));
    const releaseIntroVideoGate = () => {
      if (introVideoGateOpen) return;
      introVideoGateOpen = true;
      videos.forEach(activateIntroVideo);
      intro.classList.add('is-ready');
    };
    const scheduleIntroVideos = () => {
      const idle = window.requestIdleCallback || ((callback) => setTimeout(callback, 1000));
      idle(releaseIntroVideoGate, { timeout: 1000 });
    };
    const waitForLcp = () => {
      const lcpImage = intro.querySelector('.intro-panel-1 img');
      if (!lcpImage || lcpImage.complete) {
        if (!lcpImage) {
          scheduleIntroVideos();
        } else if (typeof lcpImage.decode === 'function') {
          lcpImage.decode().catch(() => {}).finally(scheduleIntroVideos);
        } else {
          scheduleIntroVideos();
        }
        return;
      }
      lcpImage.addEventListener('load', scheduleIntroVideos, { once: true });
      lcpImage.addEventListener('error', scheduleIntroVideos, { once: true });
    };
    if (document.readyState === 'complete') waitForLcp();
    else addEventListener('load', waitForLcp, { once: true });
    const mobilePanels = [...intro.querySelectorAll('.is-mobile-layer')];
    let mobileIndex = 0;
    if (mobilePanels.length && canMove) setInterval(() => {
      if (!matchMedia('(max-width: 899px)').matches || document.visibilityState !== 'visible') return;
      mobilePanels[mobileIndex]?.classList.remove('is-mobile-current');
      mobileIndex = (mobileIndex + 1) % mobilePanels.length;
      mobilePanels[mobileIndex]?.classList.add('is-mobile-current');
    }, 4500);
    if (matchMedia('(pointer: fine)').matches && canMove) {
      intro.addEventListener('pointermove', (event) => {
        const x = (event.clientX / innerWidth - .5) * 24;
        intro.style.setProperty('--pointer-shift', `${x}px`);
      }, { passive: true });
    }
  }

  const setCarouselVideo = (slide, active) => {
    const video = slide?.querySelector('[data-carousel-video]');
    if (!video) return;
    if (active) startVideo(video);
    else video.pause();
  };
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const thumbs = [...carousel.querySelectorAll('[data-carousel-thumb]')];
    const cards = [...carousel.querySelectorAll('[data-carousel-card]')];
    const current = carousel.querySelector('[data-carousel-current]');
    const place = carousel.querySelector('[data-carousel-place]');
    const country = carousel.querySelector('[data-carousel-country]');
    const live = carousel.querySelector('[data-carousel-live]');
    const stage = carousel.querySelector('[data-carousel-stage]');
    const pointer = carousel.querySelector('[data-carousel-pointer]');
    const overview = carousel.querySelector('[data-carousel-overview-panel]');
    const overviewButton = carousel.querySelector('[data-carousel-overview]');
    const overviewClose = carousel.querySelector('[data-carousel-close-overview]');
    let overviewFocus = null;
    let index = 0;
    let touchStart = 0;
    let wheelDistance = 0;
    let dragStart = null;
    let dragLast = 0;
    let dragVelocity = 0;
    const closeOverview = (restoreFocus = true) => {
      if (!overview || overview.hidden) return;
      overview.hidden = true;
      carousel.classList.remove('is-overview');
      overviewButton?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) (overviewFocus || overviewButton)?.focus();
      overviewFocus = null;
    };
    const openOverview = () => {
      if (!overview) return;
      overviewFocus = document.activeElement;
      overview.hidden = false;
      carousel.classList.add('is-overview');
      overviewButton?.setAttribute('aria-expanded', 'true');
      overviewClose?.focus();
    };
    const change = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        setCarouselVideo(slide, active);
      });
      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('is-active', i === index);
        if (i === index) thumb.setAttribute('aria-current', 'true'); else thumb.removeAttribute('aria-current');
      });
      const active = slides[index];
      const title = active?.dataset.place || '';
      if (current) current.textContent = String(index + 1).padStart(2, '0');
      if (place) place.textContent = title || place.textContent || '';
      const countryText = active?.dataset.country;
      if (countryText && country) country.textContent = countryText;
      if (live) live.textContent = thumbs[index]?.getAttribute('aria-label') || '';
    };
    carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => change(index - 1));
    carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => change(index + 1));
    thumbs.forEach((thumb) => thumb.addEventListener('click', () => change(Number(thumb.dataset.carouselThumb))));
    cards.forEach((card) => card.addEventListener('click', () => { change(Number(card.dataset.carouselCard)); closeOverview(); }));
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); change(index - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); change(index + 1); }
      if (event.key === 'Escape' && overview && !overview.hidden) { event.preventDefault(); closeOverview(); }
    });
    carousel.addEventListener('touchstart', (event) => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (event) => { const delta = event.changedTouches[0].clientX - touchStart; if (Math.abs(delta) > 45) change(index + (delta < 0 ? 1 : -1)); }, { passive: true });
    carousel.addEventListener('wheel', (event) => {
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
      if (!horizontal) return;
      event.preventDefault();
      wheelDistance += event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if (Math.abs(wheelDistance) < 36) return;
      change(index + (wheelDistance > 0 ? 1 : -1));
      wheelDistance = 0;
    }, { passive: false });
    stage?.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragStart = event.clientX;
      dragLast = event.clientX;
      dragVelocity = 0;
      stage.setPointerCapture?.(event.pointerId);
    });
    stage?.addEventListener('pointermove', (event) => {
      if (dragStart == null) return;
      dragVelocity = event.clientX - dragLast;
      dragLast = event.clientX;
    });
    const finishDrag = () => {
      if (dragStart == null) return;
      const delta = dragLast - dragStart;
      if (Math.abs(delta) > 42 || Math.abs(dragVelocity) > 18) change(index + (delta < 0 || dragVelocity < 0 ? 1 : -1));
      dragStart = null;
      dragVelocity = 0;
    };
    stage?.addEventListener('pointerup', finishDrag);
    stage?.addEventListener('pointercancel', finishDrag);
    overviewButton?.addEventListener('click', openOverview);
    overviewClose?.addEventListener('click', () => closeOverview());
    stage?.addEventListener('pointermove', (event) => {
      if (!pointer || event.pointerType !== 'mouse') return;
      const rect = stage.getBoundingClientRect();
      pointer.style.left = `${event.clientX - rect.left}px`;
      pointer.style.top = `${event.clientY - rect.top}px`;
      pointer.classList.add('is-visible');
    }, { passive: true });
    stage?.addEventListener('pointerleave', () => pointer?.classList.remove('is-visible'));
    const track = carousel.querySelector('[data-carousel-overview-track]');
    let dragging = false; let startX = 0; let startScroll = 0; let velocity = 0; let lastX = 0;
    track?.addEventListener('pointerdown', (event) => { dragging = true; startX = lastX = event.clientX; startScroll = track.scrollLeft; track.setPointerCapture(event.pointerId); });
    track?.addEventListener('pointermove', (event) => { if (!dragging) return; velocity = event.clientX - lastX; lastX = event.clientX; track.scrollLeft = startScroll - (event.clientX - startX); });
    track?.addEventListener('pointerup', () => { dragging = false; if (canMove) track.scrollBy({ left: -velocity * 8, behavior: 'smooth' }); });
    track?.addEventListener('pointercancel', () => { dragging = false; });
    change(0);
  });

  document.querySelectorAll('[data-story-collage-item]').forEach((item) => {
    const video = item.querySelector('video');
    if (!video) return;
    item.addEventListener('pointerenter', () => { if (canMove) video.play().catch(() => {}); });
    item.addEventListener('pointerleave', () => { if (!item.matches(':focus-within')) video.pause(); });
    item.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'touch') return;
      if (video.paused) video.play().catch(() => {}); else video.pause();
    });
  });

  document.querySelectorAll('[data-interlude]').forEach((interlude) => {
    const video = interlude.querySelector('[data-interlude-video]');
    if (!video) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { startVideo(video); } else video.pause();
    }), { rootMargin: '120px 0px' });
    observer.observe(interlude);
    if (canMove) addEventListener('scroll', () => {
      const rect = interlude.getBoundingClientRect();
      const offset = Math.max(-6, Math.min(6, (innerHeight / 2 - (rect.top + rect.height / 2)) / innerHeight * 6));
      interlude.style.setProperty('--interlude-scale', String(1 + Math.abs(offset) / 100));
    }, { passive: true });
  });

  const ella = document.querySelector('.ella-chapter');
  if (ella) {
    const questions = [...ella.querySelectorAll('[data-ella-question]')];
    ella.classList.add('is-enhanced');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-revealed');
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    questions.forEach((question) => observer.observe(question));
    const chapterObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        ella.classList.add('is-visible');
        chapterObserver.disconnect();
      }
    }), { threshold: 0.1 });
    chapterObserver.observe(ella);
  }
})();
