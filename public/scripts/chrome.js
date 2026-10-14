(() => {
  const base = document.documentElement.dataset.siteBase || '/';
  const root = document.documentElement;
  const progress = document.querySelector('[data-progress-bar]');
  const current = document.querySelector('[data-current-chapter]');
  const currentMobile = document.querySelector('[data-current-chapter-mobile]');
  const story = document.querySelector('[data-story]');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  let mediaLoaded = false;

  document.querySelectorAll('[data-language]').forEach((link) => {
    link.addEventListener('click', () => {
      localStorage.setItem('luana-language', link.dataset.language || 'en');
      if (location.hash) link.href = `${link.href.split('#')[0]}${location.hash}`;
    });
  });

  const updateProgress = () => {
    const max = root.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  const setCurrent = (id) => {
    const number = String(Number(id.replace('ch', '')) + 1).padStart(2, '0');
    if (current) current.textContent = number;
    if (currentMobile) currentMobile.textContent = number;
    document.querySelectorAll('[data-chapter-link]').forEach((link) => {
      link.setAttribute('aria-current', link.dataset.chapterLink === id ? 'true' : 'false');
    });
  };
  const chapterObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => {
      const line = innerHeight * 0.4;
      return Math.abs(a.boundingClientRect.top - line) - Math.abs(b.boundingClientRect.top - line);
    })[0];
    if (visible) setCurrent(visible.target.id);
  }, { threshold: 0, rootMargin: '-40% 0px -59% 0px' });
  chapters.forEach((chapter) => chapterObserver.observe(chapter));
  setCurrent(location.hash.match(/^#ch\d+$/)?.[0].slice(1) || 'ch0');

  const menu = document.querySelector('#chapter-menu');
  const openers = document.querySelectorAll('[data-chapter-menu-open]');
  const close = () => menu?.close();
  openers.forEach((button) => button.addEventListener('click', () => {
    if (!menu) return;
    menu.showModal();
    menu.querySelector('a')?.focus();
  }));
  document.querySelector('[data-chapter-menu-close]')?.addEventListener('click', close);
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
  menu?.addEventListener('click', (event) => { if (event.target === menu) close(); });
  menu?.addEventListener('keydown', (event) => {
    const links = [...menu.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      links[(index + (event.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length]?.focus();
    }
  });

  const loadMedia = () => {
    if (mediaLoaded) return;
    mediaLoaded = true;
    import(`${base}scripts/media.js`).catch(() => {});
  };
  const mediaTrigger = story?.querySelector('#ch1');
  if (mediaTrigger && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) { loadMedia(); observer.disconnect(); }
    }, { rootMargin: '800px' }).observe(mediaTrigger);
  } else loadMedia();
})();
