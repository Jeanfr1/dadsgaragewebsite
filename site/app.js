/* Dad's Garage. Approved composition: revised hero 2 + revised sections 3. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
  const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = $('.motion-toggle');
  let userPaused = false;
  let paused = reduceQuery.matches;
  let rafId = 0;
  let targetY = window.scrollY;
  let easedY = targetY;
  const hero = $('.hero-runway');
  const heroStage = $('.hero-stage');
  const heroPhoto = $('.hero-photo');
  const heroCopy = $('.hero-copy');
  const heroFoot = $('.hero-foot');
  const engineScene = $('.engine-scene');
  const enginePhoto = $('.engine-photo');
  const story = $('.story');
  const badge = $('.story-badge');
  const contactScene = $('.contact-scene');
  const handsPhoto = $('.hands-photo');
  const subtitle = $('.service-subtitle');
  const pageProgress = $('.page-progress');
  let metrics = {};

  function measure() {
    const y = window.scrollY;
    const top = el => el.getBoundingClientRect().top + y;
    metrics = {
      view: window.innerHeight,
      heroTop: top(hero), heroTravel: Math.max(1, hero.offsetHeight - heroStage.offsetHeight),
      engineTop: top(engineScene), engineHeight: engineScene.offsetHeight,
      storyTop: top(story), storyHeight: story.offsetHeight,
      contactTop: top(contactScene), contactHeight: contactScene.offsetHeight,
      docTravel: Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    };
    requestTick();
  }

  function render(y) {
    pageProgress.style.transform = `scaleX(${clamp(window.scrollY / metrics.docTravel)})`;
    if (paused) return;
    const mobile = window.innerWidth <= 700;
    const p = clamp((y - metrics.heroTop) / metrics.heroTravel);
    const camera = smooth(p);
    // A rear-angle photographic push toward the visible engine. No fabricated 3D orbit.
    const scale = mix(1, mobile ? 1.2 : 1.38, camera);
    const pan = mix(0, mobile ? -10 : -46, camera);
    heroPhoto.style.transform = `translate3d(${pan}px,${mix(0, -22, camera)}px,0) scale(${scale})`;
    const fade = 1 - smooth((p - .18) / .55);
    heroCopy.style.opacity = String(fade);
    heroCopy.style.transform = `translate3d(0,${-p * 56}px,0)`;
    heroFoot.style.opacity = String(1 - smooth(p / .32));
    const engineP = clamp((y + metrics.view - metrics.engineTop) / (metrics.view + metrics.engineHeight));
    // Shared forward camera direction joins the service band and engine photograph.
    enginePhoto.style.transform = `translate3d(0,${mix(-5, -12, engineP)}%,0) scale(${mix(1.08, 1, smooth(engineP))})`;
    subtitle.style.transform = `translate3d(${mix(12, 0, smooth(engineP * 1.8))}px,0,0)`;
    const storyP = clamp((y + metrics.view - metrics.storyTop) / (metrics.view + metrics.storyHeight));
    badge.style.transform = `translate3d(0,${mix(-47, -53, storyP)}%,0) rotate(${mix(5, -3, smooth(storyP))}deg)`;
    const contactP = clamp((y + metrics.view - metrics.contactTop) / (metrics.view + metrics.contactHeight));
    handsPhoto.style.transform = `translate3d(0,${mix(-2, -12, contactP)}%,0)`;
  }

  function tick() {
    rafId = 0;
    targetY = window.scrollY;
    easedY += (targetY - easedY) * .2;
    if (Math.abs(targetY - easedY) < .1) easedY = targetY;
    render(easedY);
    if (!paused && Math.abs(targetY - easedY) > .1) requestTick();
  }
  function requestTick() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function resetMotion() {
    [heroPhoto, heroCopy, heroFoot, enginePhoto, badge, handsPhoto, subtitle].forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
  }
  function syncMotion() {
    paused = reduceQuery.matches || userPaused;
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Resume animation' : 'Pause animation');
    motionButton.title = paused ? 'Resume animation' : 'Pause animation';
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    if (paused) resetMotion();
    easedY = window.scrollY;
    measure();
  }
  motionButton.addEventListener('click', () => {
    if (reduceQuery.matches) {
      // Honour the operating-system preference; never override it silently.
      motionButton.title = 'Reduced motion is enabled in your device settings';
      return;
    }
    userPaused = !userPaused;
    syncMotion();
  });
  reduceQuery.addEventListener('change', syncMotion);
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  document.fonts.ready.then(measure);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(document.body);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -18px 0px' });
    $$('.reveal, .reveal-word').forEach(el => observer.observe(el));
    document.documentElement.classList.add('enhanced');
  }

  const menu = $('#mobile-nav');
  const menuButton = $('.menu-toggle');
  function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menu.hidden = open;
    menuButton.setAttribute('aria-expanded', String(!open));
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 700) closeMenu(); });

  let returnFocus = null;
  function openDialog(id, trigger) {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    const alreadyOpen = $('dialog[open]');
    const nextFocus = trigger || document.activeElement;
    if (!alreadyOpen || !alreadyOpen.contains(nextFocus)) returnFocus = nextFocus;
    $$('dialog[open]').forEach(d => d.close());
    dialog.showModal();
    document.body.classList.add('modal-open');
    $('.dialog-close', dialog).focus();
  }
  $$('[data-dialog]').forEach(button => button.addEventListener('click', () => openDialog(button.dataset.dialog, button)));
  $$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!$('dialog[open]')) { document.body.classList.remove('modal-open'); if (returnFocus?.isConnected) returnFocus.focus(); }
    });
  });
  const services = {
    maintenance: ['GENERAL MAINTENANCE.', 'Maintenance and repair for motorcycles of any make, model and cc. Talk to the team about your bike and the work it needs.'],
    performance: ['IMPROVING PERFORMANCE.', 'Discuss performance work with the workshop. The team will talk through your motorcycle, your riding and the changes you have in mind.'],
    restore: ['RESTORE.', 'Bring your restoration project to the team and discuss what is needed to get your motorcycle back where it belongs.'],
    custom: ['MAKE IT YOURS.', 'Customising and reinvention for a motorcycle that feels like your own. Tell the team what you have in mind.'],
    claims: ['CLAIMS & RECOVERY.', 'Dad’s Garage offers accident claims support and motorcycle recovery. Contact the team to discuss the situation and the next steps.']
  };
  $$('[data-service]').forEach(button => button.addEventListener('click', () => {
    const service = services[button.dataset.service];
    $('#service-dialog-title').textContent = service[0];
    $('#service-dialog-description').textContent = service[1];
    openDialog('service-dialog', button);
  }));
  syncMotion();
})();
