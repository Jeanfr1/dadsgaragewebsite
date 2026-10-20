// Fits display type to the approved boards: font-size from the measured cap
// height, letter-spacing (and Archivo's width axis) from the measured ink width.
// Targets come from scripts/measure-board.py (board pixels). Prints values in
// board units; paste them into src/styles/*.css (they are not read at runtime).
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fv = (p) => 'file://' + resolve('node_modules/@fontsource-variable', p);
const css = `
@font-face{font-family:BS;src:url(${fv('big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:AR;src:url(${fv('archivo/files/archivo-latin-wdth-normal.woff2')}) format('woff2');font-weight:100 900;font-stretch:62% 125%}`;

// [label, family, weight, stretch%, text, capTarget, widthTarget]
const items = [
  ['hero this-is', 'BS', 800, 100, 'THIS IS', 36, 142],
  ['hero title', 'BS', 800, 100, 'DAD’S GARAGE.', 89, 538],
  ['hero tagline', 'BS', 700, 100, 'BUILT AROUND BIKES. RUN BY FAMILY.', 11, 309],
  ['nav workshop', 'BS', 700, 100, 'WORKSHOP', 8, 57],
  ['nav motorcycles', 'BS', 700, 100, 'MOTORCYCLES', 8, 75],
  ['nav our story', 'BS', 700, 100, 'OUR STORY', 8, 58],
  ['nav contact', 'BS', 700, 100, 'CONTACT', 8, 45],
  ['book label', 'BS', 700, 100, 'BOOK THE WORKSHOP', 9, 113],
  ['maintain', 'AR', 900, 'fit', 'MAINTAIN.', 105, 678],
  ['restore', 'AR', 900, 'fit', 'RESTORE.', 36, 286],
  ['customise', 'AR', 900, 'fit', 'CUSTOMISE.', 36, 359],
  ['aside expert', 'BS', 700, 100, 'EXPERT CARE', 9, 77],
  ['aside compromises', 'BS', 700, 100, 'NO COMPROMISES.', 9, 111],
  ['service general', 'BS', 700, 100, 'GENERAL MAINTENANCE', 8, 127],
  ['service improving', 'BS', 700, 100, 'IMPROVING PERFORMANCE', 8, 143],
  ['service restore', 'BS', 700, 100, 'RESTORE', 8, 46],
  ['service customising', 'BS', 700, 100, 'CUSTOMISING', 8, 73],
  ['story 1', 'BS', 800, 100, 'THE GARAGE', 76, 388],
  ['story 2', 'BS', 800, 100, 'IS THE PEOPLE.', 76, 472],
  ['meet label', 'BS', 700, 100, 'MEET THE GARAGE', 7.5, 99],
  ['card title', 'BS', 800, 100, 'LET’S TALK BIKES.', 27, 259],
  ['card btn label', 'BS', 700, 100, 'BOOK THE WORKSHOP', 7, 109],
  ['foot workshop', 'BS', 700, 100, 'WORKSHOP', 7, 46],
  ['foot motorcycles', 'BS', 700, 100, 'MOTORCYCLES', 7, 61],
  ['foot our story', 'BS', 700, 100, 'OUR STORY', 7, 47],
];

const browser = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.goto('file://' + resolve('index.html').replace('index.html', 'package.json'));
await page.setContent(`<style>${css}</style><canvas id=c></canvas>`);
const res = await page.evaluate(async (items) => {
  const c = document.getElementById('c').getContext('2d');
  const ink = (font, stretch, text, ls = 0) => {
    c.font = font; c.fontStretch = stretch; c.letterSpacing = ls + 'px';
    const m = c.measureText(text);
    return m.actualBoundingBoxLeft + m.actualBoundingBoxRight - ls; // trailing spacing is not ink
  };
  const capOf = (font, stretch) => { c.font = font; c.fontStretch = stretch; c.letterSpacing = '0px'; return c.measureText('H').actualBoundingBoxAscent; };
  const keyword = (p) => ({ 62.5: 'ultra-condensed', 75: 'extra-condensed', 87.5: 'semi-condensed', 100: 'normal', 112.5: 'semi-expanded', 125: 'extra-expanded' })[p] || 'normal';
  const out = [];
  for (const [label, fam, w, st, text, cap, width] of items) {
    await document.fonts.load(`${w} 100px ${fam}`, text);
    let stretch = st === 'fit' ? 75 : st;
    const base = `${w} 100px ${fam}`;
    // canvas fontStretch only takes keywords; measure width axis via a DOM probe instead
    const probe = document.createElement('span');
    probe.style.cssText = `font:${w} 100px ${fam};white-space:nowrap;position:absolute;letter-spacing:0`;
    probe.textContent = text; document.body.append(probe);
    const domInk = (s, ls = 0) => {
      probe.style.fontStretch = s + '%'; probe.style.letterSpacing = ls + 'px';
      const r = document.createRange(); r.selectNodeContents(probe);
      return r.getBoundingClientRect().width - ls; // advance width minus trailing spacing
    };
    const capPx = capOf(base, 'normal');
    const size = cap / (capPx / 100); // font-size in board units
    const n = [...text].length;
    if (st === 'fit') {
      // choose the width axis so natural advance matches, then trim with tracking
      let lo = 62, hi = 125;
      for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; (domInk(mid) * size / 100 > width ? hi = mid : lo = mid); }
      stretch = Math.round(lo);
    }
    const inkW = ink(base, keyword(stretch), text) * size / 100;
    const adv = domInk(stretch) * size / 100;
    const lsUnits = (width - (st === 'fit' ? adv : inkW)) / (n - 1);
    out.push({ label, fam, w, stretch, size: +size.toFixed(2), lsEm: +(lsUnits / size).toFixed(4), naturalInk: +inkW.toFixed(1), target: width });
    probe.remove();
  }
  return out;
}, items);
for (const r of res) console.log(`${r.label.padEnd(20)} ${r.fam} ${r.w} wdth ${String(r.stretch).padEnd(4)} size ${String(r.size).padEnd(7)}u  ls ${r.lsEm}em   (natural ${r.naturalInk} → ${r.target})`);
await browser.close();
