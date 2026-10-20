// README captures from the production build (npm run build && npm run preview).
// Writes raw captures to qa/readme/ and the banner to .github/assets/banner.png;
// scripts/readme-composite.py frames them, ffmpeg makes the GIF.
import { chromium } from 'playwright-core';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = process.env.QA_BASE || 'http://localhost:4203/';
const OUT = 'qa/readme';
await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/frames`, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--allow-file-access-from-files'] });
const two = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const loadAll = (p) => p.evaluate(async () => {
  document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager'));
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  await document.fonts.ready;
});

/* banner: the site's own fonts and plates */
{
  const p = await browser.newPage({ viewport: { width: 1600, height: 560 } });
  const fv = (f) => '../../node_modules/@fontsource-variable/' + f;
  const html = `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:BS;src:url(${fv('big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
    @font-face{font-family:AR;src:url(${fv('archivo/files/archivo-latin-wdth-normal.woff2')}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
    body{margin:0;width:1600px;height:560px;overflow:hidden;background:#151615;font-family:BS}
    .ph{position:absolute;inset:0;background:url(../../public/img/hero-rear-tall-v1-2560.webp) right -10px bottom -26px/1180px auto no-repeat}
    .sh{position:absolute;inset:0;background:linear-gradient(90deg,#151615 0%,#151615 30%,rgba(21,22,21,.7) 44%,rgba(21,22,21,0) 62%)}
    .logo{position:absolute;left:96px;top:56px;width:124px}
    .t{position:absolute;left:96px;top:206px;text-transform:uppercase;line-height:1}
    .k{font:800 40px/1 BS;letter-spacing:.137em;color:#bd9a78}
    h1{margin:6px 0 0;font:800 116px/1 BS;letter-spacing:-.015em;color:#a4495b}
    .g{margin-top:18px;font:700 16px/1 BS;letter-spacing:.33em;color:#bd9a78}
    .bar{position:absolute;left:96px;top:430px;display:flex;align-items:baseline;gap:22px;font:900 30px/1 AR;font-stretch:71%;color:#e2dacd;text-transform:uppercase}
    .bar span:nth-child(2),.bar span:nth-child(3){font-stretch:98%;font-size:19px;color:#aa4b5d}
  </style><div class="ph"></div><div class="sh"></div>
  <img class="logo" src="../../public/img/logo-v1-640.webp">
  <div class="t"><div class="k">This is</div><h1>Dad’s Garage.</h1><div class="g">Built around bikes. Run by family. · Watford</div></div>
  <div class="bar"><span>Maintain.</span><span>Restore.</span><span>Customise.</span></div>`;
  await writeFile(`${OUT}/banner.html`, html);
  await p.goto('file://' + resolve(`${OUT}/banner.html`));
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({ path: '.github/assets/banner.png' });
  await p.close();
}

/* hero GIF frames: rear view → engine push → MAINTAIN band → engine photo */
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + '?nosmooth', { waitUntil: 'networkidle' });
  await loadAll(p);
  await p.waitForTimeout(1800);
  const fps = await p.evaluate(() => new Promise((r) => { let n = 0; const t = performance.now(); const f = () => { n++; performance.now() - t < 1000 ? requestAnimationFrame(f) : r(n); }; requestAnimationFrame(f); }));
  console.log('rAF', fps, 'fps');
  const end = await p.evaluate(() => { const r = document.querySelector('.services').getBoundingClientRect(); return r.bottom + scrollY - innerHeight + 60; });
  console.log('gif scroll end', end);
  const N = 60;
  let k = 0;
  const shot = async () => p.screenshot({ path: `${OUT}/frames/f_${String(k++).padStart(4, '0')}.png` });
  for (let i = 0; i < 6; i++) await shot();                          // hold the first frame
  for (let i = 1; i <= N; i++) {
    const t = i / N, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await p.evaluate((y) => scrollTo(0, y), Math.round(end * e));
    await p.waitForTimeout(120); await two(p);
    await shot();
  }
  for (let i = 0; i < 8; i++) await shot();                          // hold the last frame
  await p.close();
}

/* desktop sections (browser-framed later) */
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + '?nosmooth', { waitUntil: 'networkidle' });
  await loadAll(p);
  const at = async (name, fn) => {
    const y = await p.evaluate(fn);
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(1300); await two(p);
    await p.screenshot({ path: `${OUT}/d-${name}.png` });
  };
  await at('repairs', () => document.querySelector('#repairs').offsetTop - 10);
  await at('claims', () => { const c = document.querySelector('#claims'); return c.offsetTop + (c.offsetHeight - innerHeight) * 0.55; });
  await at('shop', () => document.querySelector('#shop').offsetTop - 60);
  await at('story', () => document.querySelector('#story').offsetTop - 330);
  await at('team', () => document.querySelector('.team-grid').offsetTop + document.querySelector('#team').offsetTop - 240);
  await at('contact', () => document.documentElement.scrollHeight - innerHeight);
  await p.close();
}

/* phones */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE + '?nosmooth', { waitUntil: 'networkidle' });
  await loadAll(p);
  await p.waitForTimeout(1600);
  const at = async (name, fn) => {
    const y = await p.evaluate(fn);
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(1300); await two(p);
    await p.screenshot({ path: `${OUT}/m-${name}.png` });
  };
  await at('hero', () => 0);
  await at('workshop', () => document.querySelector('#workshop').offsetTop);
  await at('claims', () => document.querySelector('#claims').offsetTop + 420);
  await at('team', () => document.querySelector('#team').offsetTop + document.querySelector('.team-grid').offsetTop - 30);
  await at('contact', () => document.querySelector('#contact').offsetTop - 120);
  await ctx.close();
}
await browser.close();
console.log('captures in', OUT);
