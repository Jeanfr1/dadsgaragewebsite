// One requestAnimationFrame loop for every scroll scene.
// Scroll is never captured: scenes read the page position and write transforms.
// The eased position follows the real one (factor .18) only while it moves;
// ?nosmooth sets the factor to 1 so captures and tests see exact states.

const params = new URLSearchParams(location.search);
export const flags = {
  nosmooth: params.has('nosmooth'),
  static: params.has('static'),
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

const root = document.documentElement;
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const motionScenes = [];
const uiScenes = [];

export const view = { w: innerWidth, h: innerHeight, y: scrollY, dir: 1, paused: false };
let userPaused = false;
let eased = scrollY;
let raf = 0;

/** Scroll-linked motion: skipped while paused or with reduced motion. */
export function motionScene(s) { motionScenes.push(s); }
/** Interface state (header, rail, progress): always runs. */
export function uiScene(s) { uiScenes.push(s); }

/** Document top of an element (unaffected by transforms on the element itself). */
export function docTop(el) {
  let y = 0;
  for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
  return y;
}

function measure() {
  view.w = innerWidth;
  view.h = innerHeight;
  for (const s of uiScenes) s.measure?.();
  for (const s of motionScenes) s.measure?.();
  eased = scrollY;
  request();
}

function frame() {
  raf = 0;
  const target = scrollY;
  view.dir = target > view.y ? 1 : target < view.y ? -1 : view.dir;
  view.y = target;
  const k = flags.nosmooth || view.paused ? 1 : 0.18;
  const d = target - eased;
  eased = Math.abs(d) > view.h * 1.5 ? target : eased + d * k;
  if (Math.abs(target - eased) < 0.1) eased = target;
  for (const s of uiScenes) s.render?.(target);
  if (!view.paused) for (const s of motionScenes) s.render?.(eased);
  root.dataset.settled = eased === target ? '1' : '0';
  if (eased !== target) request();
}

export function request() { if (!raf) raf = requestAnimationFrame(frame); }

function applyPause() {
  view.paused = flags.static || reduceQuery.matches || userPaused;
  root.classList.toggle('motion-off', view.paused);
  if (view.paused) for (const s of motionScenes) s.reset?.();
  for (const s of motionScenes) s.toggle?.(!view.paused);
  measure();
  dispatchEvent(new CustomEvent('motionchange', { detail: { paused: view.paused, system: reduceQuery.matches } }));
}

export function setUserPaused(v) { userPaused = v; applyPause(); }
export const systemReduced = () => reduceQuery.matches;

export function start() {
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure, { once: true });
  document.fonts?.ready.then(measure);
  if ('ResizeObserver' in window) {
    let last = 0;
    new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (h !== last) { last = h; measure(); }
    }).observe(document.body);
  }
  reduceQuery.addEventListener?.('change', applyPause);
  applyPause();
}
