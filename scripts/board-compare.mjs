// Page vs approved boards in ?static (final) state, at a 1440 px desktop: each board
// crop is scaled to 1440 wide (boards are 971 and 893 px wide).
//   hero      viewport 1440 x 1142 (the board's 971 x 770 aspect)  vs hero board y 0-770
//   workshop  vs sections board y 592-1088
//   story / contact / footer likewise (1088-1413, 1413-1630, 1630-1761)
// Writes side-by-side and 50 % blend images to qa/compare/ and prints the mean
// absolute difference per region (0-255; lower is closer).
// usage: node scripts/board-compare.mjs [baseURL]
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:4203/';
const out = 'qa/compare';
await mkdir(out, { recursive: true });

const regions = [
  { name: 'hero', board: 'references/APPROVED-HERO-model-2.png', bw: 971, y0: 0, y1: 770, vh: 1142, clip: true },
  { name: 'workshop', board: 'references/APPROVED-SECTIONS-model-3.png', bw: 893, y0: 592, y1: 1088, sel: '.workshop' },
  { name: 'story', board: 'references/APPROVED-SECTIONS-model-3.png', bw: 893, y0: 1088, y1: 1413, sel: '.story' },
  { name: 'contact', board: 'references/APPROVED-SECTIONS-model-3.png', bw: 893, y0: 1413, y1: 1630, sel: '.contact' },
  { name: 'footer', board: 'references/APPROVED-SECTIONS-model-3.png', bw: 893, y0: 1630, y1: 1761, sel: '.footer-main' },
];

const W = 1440;
const browser = await chromium.launch({ channel: 'chrome' });
for (const r of regions) {
  const scale = W / r.bw;
  r.vw = W;
  const page = await browser.newPage({ viewport: { width: W, height: r.vh || 900 } });
  await page.goto(base + '?static', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager'));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((res) => { i.onload = i.onerror = res; }))));
    await document.fonts.ready;
  });
  let shot;
  if (r.sel) {
    const el = page.locator(r.sel);
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    shot = await el.screenshot();
  } else {
    shot = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: r.vh } });
  }
  const h = Math.round((r.y1 - r.y0) * scale);
  const boardImg = await sharp(r.board).extract({ left: 0, top: r.y0, width: r.bw, height: r.y1 - r.y0 })
    .resize(W, h, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  const pageImg = await sharp(shot).resize(r.vw, h, { fit: 'fill' }).removeAlpha().raw().toBuffer();
  let sum = 0;
  for (let i = 0; i < boardImg.length; i++) sum += Math.abs(boardImg[i] - pageImg[i]);
  const mad = sum / boardImg.length;
  const meta = { raw: { width: r.vw, height: h, channels: 3 } };
  const b = await sharp(boardImg, meta).png().toBuffer();
  const p = await sharp(pageImg, meta).png().toBuffer();
  await sharp({ create: { width: r.vw * 2 + 10, height: h, channels: 3, background: '#fff' } })
    .composite([{ input: b, left: 0, top: 0 }, { input: p, left: r.vw + 10, top: 0 }]).png().toFile(`${out}/${r.name}-side.png`);
  await sharp(b).composite([{ input: await sharp(p).ensureAlpha(0.5).png().toBuffer(), blend: 'over' }]).png().toFile(`${out}/${r.name}-blend.png`);
  console.log(`${r.name.padEnd(9)} mean abs diff ${mad.toFixed(1)}  (page ${(await sharp(shot).metadata()).height}px tall vs board ${h}px)`);
  await page.close();
}
await browser.close();
