// Dialogs, services, mobile menu, reveals and the pause button.
import { view, setUserPaused, systemReduced } from './engine.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ---------- dialogs ---------- */
const SERVICES = {
  maintenance: ['General maintenance.', 'Maintenance and repair for motorcycles of any make, model and cc: brakes, engine and transmission, inspection, steering and suspension, tyres and diagnostics. Talk to the team about your bike and the work it needs.'],
  performance: ['Improving performance.', 'Discuss performance work with the workshop. The team will talk through your motorcycle, your riding and the changes you have in mind.'],
  restore: ['Restore.', 'Bring your restoration project to the team and discuss what is needed to get your motorcycle back where it belongs.'],
  custom: ['Make it yours.', 'Customising and reinvention for a motorcycle that feels like your own. Tell the team what you have in mind.'],
  claims: ['Claims & recovery.', 'Dad’s Garage offers accident claims support and motorcycle recovery. Contact the team to discuss the situation and the next steps.'],
};

let returnFocus = null;

function openDialog(id, trigger) {
  const dialog = document.getElementById(id);
  if (!dialog || typeof dialog.showModal !== 'function') return false;
  const current = $('dialog[open]');
  if (!current || !current.contains(trigger)) returnFocus = trigger || document.activeElement;
  $$('dialog[open]').forEach((d) => d.close());
  dialog.showModal();
  document.body.classList.add('sheet-open');
  $('.sheet-close', dialog)?.focus();
  return true;
}

function initDialogs() {
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-dialog]');
    if (opener) { if (openDialog(opener.dataset.dialog, opener)) e.preventDefault(); return; }
    const service = e.target.closest('[data-service]');
    if (service) {
      const [title, text] = SERVICES[service.dataset.service];
      $('#service-dialog-title').textContent = title;
      $('#service-dialog-text').textContent = text;
      openDialog('service-dialog', service);
      return;
    }
    const closer = e.target.closest('[data-close]');
    if (closer) closer.closest('dialog')?.close();
  });
  $$('dialog').forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    d.addEventListener('close', () => {
      if ($('dialog[open]')) return;
      document.body.classList.remove('sheet-open');
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
  });
}

/* ---------- mobile menu ---------- */
function initMenu() {
  const btn = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const label = $('.sr-only', btn);
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    label.textContent = open ? 'Close menu' : 'Menu';
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
  });
  addEventListener('resize', () => { if (innerWidth >= 700) set(false); }, { passive: true });
}

/* ---------- reveals: the hidden state exists only once this runs ---------- */
function initReveals() {
  const els = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) return;
  // Chrome clips the observed box by the target's own clip-path, so a fully clipped
  // element never intersects: clip reveals are watched through their parent.
  const watched = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      (watched.get(en.target) || []).forEach((el) => el.classList.add('is-in'));
      io.unobserve(en.target);
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  root.classList.add('reveal-on');
  els.forEach((el) => {
    const t = el.dataset.reveal === 'photo' || el.dataset.reveal === 'card' ? el.parentElement : el;
    if (!watched.has(t)) { watched.set(t, []); io.observe(t); }
    watched.get(t).push(el);
  });
  addEventListener('motionchange', (e) => { if (e.detail.paused) els.forEach((el) => el.classList.add('is-in')); });
  if (view.paused) els.forEach((el) => el.classList.add('is-in'));
}

/* ---------- pause ---------- */
function initPause() {
  const btn = $('.motion-toggle');
  const label = $('.sr-only', btn);
  btn.hidden = false;
  let paused = false;
  const sync = (p, system) => {
    btn.setAttribute('aria-pressed', String(p));
    label.textContent = system ? 'Animation off (reduced motion is on in your device settings)' : p ? 'Play animation' : 'Pause animation';
    btn.title = label.textContent;
  };
  btn.addEventListener('click', () => {
    if (systemReduced()) return;
    paused = !paused;
    setUserPaused(paused);
  });
  addEventListener('motionchange', (e) => sync(e.detail.paused, e.detail.system));
  sync(view.paused, systemReduced());
}

export function initUI() {
  initDialogs();
  initMenu();
  initPause();
  initReveals();
  if (!view.paused) root.classList.add('smooth-anchors');
}
