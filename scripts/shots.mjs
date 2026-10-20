// Captures for review: full static pages + a scroll sequence per viewport.
// usage: node scripts/shots.mjs [baseURL] [outDir]
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] || 'http://localhost:4203/';
const out = process.argv[3] || 'qa/shots';
await mkdir(out, { recursive: true });
const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
async function loadAll(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager'));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
}
const browser = await chromium.launch({ channel: 'chrome' });
for (const v of views) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.isMobile, hasTouch: v.hasTouch, deviceScaleFactor: v.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  await page.goto(base + '?static', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await loadAll(page);
  await page.screenshot({ path: `${out}/${v.name}-static-full.png`, fullPage: true });
  await page.goto(base + '?nosmooth', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = Number(process.env.STEPS || 16);
  for (let i = 0; i <= steps; i++) {
    const y = Math.round((H * i) / steps);
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${out}/${v.name}-scroll-${String(i).padStart(2, '0')}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log('shots in', out);
