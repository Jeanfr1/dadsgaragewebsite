// Scroll choreography, one technique per section:
//   hero      pinned photographic push towards the engine (kit storyboard), title exits
//   workshop  MAINTAIN letters rise out of a mask, RESTORE / CUSTOMISE close in, engine keeps the push
//   repairs   photo wipes open left to right, line icons draw themselves
//   claims    pinned horizontal road: the steps ride past, the road draws, markers light
//   shop      two outlined marquee rows run against each other over the helmet wall
//   story     calm: the badge turns slowly (+5° → −3°) and drifts
//   team      columns at different speeds, portraits develop from mono to colour at the centre
//   contact   hands parallax under the burgundy card
// Plus the chapter rail and the page progress line, which run through the whole page.
import { motionScene, uiScene, view, docTop, clamp, mix, smooth, easeOut, request } from './engine.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const isPhone = () => view.w < 700;

/* ---------- hero ---------- */
function hero() {
  const section = $('.hero');
  const stage = $('.hero-stage');
  const photo = $('.hero-photo');
  const copy = $('.hero-copy');
  let top = 0, travel = 1;
  return {
    measure() { top = docTop(section); travel = Math.max(1, section.offsetHeight - stage.offsetHeight); },
    render(y) {
      const p = clamp((y - top) / travel);
      const cam = smooth(p);
      const phone = isPhone();
      const scale = mix(1, phone ? 1.2 : 1.38, cam);
      const px = mix(0, phone ? -10 : -46, cam);
      const py = mix(0, -22, cam);
      photo.style.transform = `translate3d(${px}px,${py}px,0) scale(${scale})`;
      copy.style.opacity = String(1 - smooth((p - 0.18) / 0.55));
      copy.style.transform = `translate3d(0,${(-p * 56).toFixed(2)}px,0)`;
    },
    reset() { photo.style.transform = ''; copy.style.opacity = ''; copy.style.transform = ''; },
  };
}

/* ---------- workshop band + engine ---------- */
function workshop() {
  const band = $('.workshop-band');
  const letters = $$('.maintain-word .ch');
  const restore = $('.act-restore');
  const customise = $('.act-customise');
  const aside = $('.workshop-aside');
  const engine = $('.engine');
  const img = $('.engine-photo');
  let bandTop = 0, engTop = 0, engH = 1;
  return {
    measure() { bandTop = docTop(band); engTop = docTop(engine); engH = engine.offsetHeight; },
    render(y) {
      const rel = bandTop - y;                       // band top inside the viewport
      const p = clamp((view.h - rel) / (view.h * 0.72));
      letters.forEach((el, i) => {
        const t = easeOut((p * 1.45 - i * 0.05) / 0.7);
        el.style.transform = t >= 1 ? '' : `translate3d(0,${((1 - t) * 104).toFixed(2)}%,0)`;
      });
      const a = easeOut((p - 0.25) / 0.75);
      const dx = view.w * 0.07 * (1 - a);
      restore.style.transform = a >= 1 ? '' : `translate3d(${-dx}px,0,0)`;
      customise.style.transform = a >= 1 ? '' : `translate3d(${dx}px,0,0)`;
      restore.style.opacity = customise.style.opacity = a >= 1 ? '' : String(mix(0.15, 1, a));
      const r = easeOut((p - 0.45) / 0.55);
      aside.style.opacity = r >= 1 ? '' : String(r);
      aside.style.setProperty('--rule', r.toFixed(3));
      // the engine keeps the hero's forward camera: a slow push and a contained drift
      const e = clamp((y + view.h - engTop) / (view.h + engH));
      img.style.transform = `translate3d(0,${mix(-3, 3, e).toFixed(2)}%,0) scale(${mix(1.12, 1.0, smooth(e)).toFixed(4)})`;
    },
    reset() {
      letters.forEach((el) => (el.style.transform = ''));
      for (const el of [restore, customise, aside, img]) { el.style.transform = ''; el.style.opacity = ''; }
      aside.style.removeProperty('--rule');
    },
  };
}

/* ---------- repairs ---------- */
function repairs() {
  const fig = $('.repairs-photo');
  const img = $('.repairs-photo img');
  const list = $('.repair-list');
  const items = $$('.repair-list li');
  let figTop = 0, listTop = 0, listH = 1;
  return {
    measure() { figTop = docTop(fig); listTop = docTop(list); listH = list.offsetHeight; },
    render(y) {
      const p = easeOut((view.h - (figTop - y)) / (view.h * 0.85));
      fig.style.clipPath = p >= 1 ? '' : `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;
      img.style.transform = `scale(${mix(1.2, 1.0, p).toFixed(4)})`;
      const q = clamp((view.h * 0.95 - (listTop - y)) / (view.h * 0.55 + listH * 0.5));
      items.forEach((li, i) => {
        const t = easeOut((q * 1.5 - i * 0.09) / 0.6);
        li.style.setProperty('--draw', t.toFixed(3));
      });
    },
    reset() {
      fig.style.clipPath = ''; img.style.transform = '';
      items.forEach((li) => li.style.removeProperty('--draw'));
    },
  };
}

/* ---------- claims ---------- */
function claims() {
  const section = $('.claims');
  const stage = $('.claims-stage');
  const track = $('.claims-track');
  const road = $('.claims-road');
  const stepsEl = $('.claims-steps');
  const steps = $$('.step');
  const markers = steps.map((s) => $('.step-no', s));
  let pinned = false, top = 0, travel = 1, distance = 0, roadLeft = 0, roadW = 1, markerX = [];
  let enabled = true, listTop = 0, listH = 1;

  const wantPin = () => enabled && view.w >= 1000;

  function setPinned(on) {
    pinned = on;
    root.classList.toggle('claims-pinned', on);
    if (!on) { section.style.height = ''; track.style.transform = ''; }
  }

  return {
    toggle(on) { enabled = on; },
    measure() {
      if (wantPin() !== pinned) setPinned(wantPin());
      if (pinned) {
        track.style.transform = '';
        distance = Math.max(0, track.scrollWidth - view.w);
        section.style.height = `${Math.round(stage.offsetHeight + distance)}px`;
        top = docTop(section);
        travel = Math.max(1, section.offsetHeight - stage.offsetHeight);
        roadLeft = road.offsetLeft; roadW = Math.max(1, road.offsetWidth);
        markerX = markers.map((m) => {
          let x = m.offsetWidth / 2;
          for (let n = m; n && n !== track; n = n.offsetParent) x += n.offsetLeft;
          return x;
        });
      } else {
        listTop = docTop(stepsEl); listH = stepsEl.offsetHeight;
      }
    },
    render(y) {
      if (pinned) {
        const p = clamp((y - top) / travel);
        const shift = p * distance;
        track.style.transform = `translate3d(${(-shift).toFixed(2)}px,0,0)`;
        // the road is drawn up to the point under the viewport's 62 % line
        const head = shift + view.w * 0.62 - roadLeft;
        road.style.setProperty('--road', clamp(head / roadW).toFixed(4));
        steps.forEach((s, i) => s.classList.toggle('is-lit', markerX[i] - roadLeft <= head));
      } else {
        const head = y + view.h * 0.6 - listTop;
        stepsEl.style.setProperty('--road', clamp(head / listH).toFixed(4));
        steps.forEach((s) => s.classList.toggle('is-lit', docTop(s) - listTop <= head));
      }
    },
    reset() {
      if (pinned) setPinned(false);
      stepsEl.style.removeProperty('--road');
      steps.forEach((s) => s.classList.add('is-lit'));
    },
  };
}

/* ---------- shop ---------- */
function shop() {
  const section = $('.shop');
  const a = $('.row-a');
  const b = $('.row-b');
  const img = $('.shop-photo img');
  let top = 0, h = 1;
  return {
    measure() { top = docTop(section); h = section.offsetHeight; },
    render(y) {
      const p = clamp((y + view.h - top) / (view.h + h));
      a.style.transform = `translate3d(${mix(-4, -34, p).toFixed(3)}%,0,0)`;
      b.style.transform = `translate3d(${mix(-36, -6, p).toFixed(3)}%,0,0)`;
      img.style.transform = `translate3d(0,${mix(-4, 4, p).toFixed(2)}%,0) scale(${mix(1.16, 1.05, p).toFixed(4)})`;
    },
    reset() { a.style.transform = b.style.transform = img.style.transform = ''; },
  };
}

/* ---------- story ---------- */
function story() {
  const section = $('.story');
  const badge = $('.story-badge');
  let top = 0, h = 1;
  return {
    measure() { top = docTop(section); h = section.offsetHeight; },
    render(y) {
      const p = clamp((y + view.h - top) / (view.h + h));
      badge.style.setProperty('--badge-rot', `${mix(5, -3, smooth(p)).toFixed(3)}deg`);
      badge.style.setProperty('--badge-y', `${mix(16, -16, p).toFixed(2)}px`);
    },
    reset() { badge.style.removeProperty('--badge-rot'); badge.style.removeProperty('--badge-y'); },
  };
}

/* ---------- team ---------- */
function team() {
  const members = $$('.member');
  const lag = [0, 70, 24, 96];          // px of extra travel per column
  let tops = [], hs = [];
  return {
    measure() {
      members.forEach((m) => (m.style.transform = ''));
      tops = members.map(docTop); hs = members.map((m) => m.offsetHeight);
    },
    render(y) {
      const phone = isPhone();
      members.forEach((m, i) => {
        const c = tops[i] + hs[i] * 0.3 - y;                    // photo centre-ish in the viewport
        const p = clamp((view.h - (tops[i] - y)) / (view.h + hs[i]));
        const off = phone ? 0 : lag[i % 4] * (1 - smooth(p * 1.6));
        m.style.transform = off ? `translate3d(0,${off.toFixed(2)}px,0)` : '';
        const d = clamp(Math.abs(c - view.h * 0.5) / (view.h * 0.55));
        const mono = smooth((d - 0.25) / 0.75);
        m.style.setProperty('--mono', mono.toFixed(3));
        m.style.setProperty('--zoom', (mono * 0.06).toFixed(4));
      });
    },
    reset() {
      members.forEach((m) => { m.style.transform = ''; m.style.removeProperty('--mono'); m.style.removeProperty('--zoom'); });
    },
  };
}

/* ---------- contact ---------- */
function contact() {
  const section = $('.contact');
  const img = $('.contact-photo img');
  let top = 0, h = 1;
  return {
    measure() { top = docTop(section); h = section.offsetHeight; },
    render(y) {
      const p = clamp((y + view.h - top) / (view.h + h));
      img.style.transform = `translate3d(0,${mix(-5, 5, p).toFixed(2)}%,0)`;
    },
    reset() { img.style.transform = ''; },
  };
}

/* ---------- interface: header, rail, progress ---------- */
function header() {
  const head = $('.masthead');
  const hero = $('.hero');
  const menuBtn = $('.menu-toggle');
  let limit = 0, lastY = scrollY, state = 'top';
  const set = (s) => { if (s !== state) { state = s; head.dataset.state = s; } };
  return {
    measure() { limit = Math.max(40, docTop(hero) + hero.offsetHeight - view.h * 0.9); },
    render(y) {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      if (y < limit) set('top');
      else if (open) set('compact');
      else if (y > lastY + 4) set('hidden');
      else if (y < lastY - 4) set('compact');
      lastY = y;
    },
  };
}

function rail() {
  const el = $('.rail');
  const digits = $('.rail-digits');
  const name = $('.rail-name');
  const chapters = $$('[data-chapter]');
  const progress = $('.page-progress');
  let tops = [], hs = [], current = -1, docH = 1, footTop = 0;
  return {
    measure() {
      tops = chapters.map(docTop); hs = chapters.map((c) => c.offsetHeight);
      docH = Math.max(1, document.documentElement.scrollHeight - view.h);
      footTop = docTop($('.footer'));
    },
    render(y) {
      progress.style.setProperty('--page-p', clamp(y / docH).toFixed(4));
      const mid = y + view.h * 0.5;
      let i = -1;
      for (let k = 0; k < chapters.length; k++) if (tops[k] <= mid) i = k;
      el.classList.toggle('is-on', i >= 0 && y + view.h * 0.8 < footTop + 40);
      if (i < 0) return;
      if (i !== current) {
        current = i;
        digits.textContent = chapters[i].dataset.chapter;
        name.textContent = chapters[i].dataset.chapterName;
        el.dataset.tone = chapters[i].dataset.tone || 'dark';
      }
      el.style.setProperty('--chapter-p', clamp((mid - tops[i]) / hs[i]).toFixed(3));
    },
  };
}

export function initScenes() {
  uiScene(header());
  uiScene(rail());
  [hero(), workshop(), repairs(), claims(), shop(), story(), team(), contact()].forEach(motionScene);
  request();
}
