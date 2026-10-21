// Browser QA for the built site. Run against `npm run preview` (default) or the live URL:
//   QA_BASE=https://example.vercel.app/ npm run qa
import { chromium } from 'playwright-core';

const BASE = process.env.QA_BASE || 'http://localhost:4203/';
const results = [];
const ok = (name, pass, info = '') => { results.push({ name, pass, info }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${info ? '  — ' + info : ''}`); };

const browser = await chromium.launch({ channel: 'chrome' });
const newPage = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  return { ctx, page };
};
const settle = (page) => page.waitForFunction(() => document.documentElement.dataset.settled === '1', null, { timeout: 5000 }).catch(() => {});
const loadAll = (page) => page.evaluate(async () => {
  document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager'));
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
});

/* ---------- 1. structure, copy and assets (desktop) ---------- */
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const order = await page.evaluate(() => [...document.querySelectorAll('main > section, body footer')].map((s) => s.id || s.className));
  ok('section order hero → workshop → repairs → claims → shop → story → team → contact → footer',
    JSON.stringify(order) === JSON.stringify(['top', 'workshop', 'repairs', 'claims', 'shop', 'story', 'team', 'contact', 'footer']), order.join(' '));

  const t = await page.evaluate(() => ({
    hero: document.querySelector('#top').innerText.replace(/\s+/g, ' ').toUpperCase(),
    heroImg: document.querySelector('.hero-photo img').currentSrc,
    first: document.querySelector('#top + section h2').getAttribute('aria-label'),
    storyBg: getComputedStyle(document.querySelector('#story')).backgroundColor,
    story: document.querySelector('#story h2').innerText.replace(/\s+/g, ' ').toUpperCase(),
    lastVisual: document.querySelector('main > section:last-of-type').innerText.toUpperCase(),
    lastImg: document.querySelector('main > section:last-of-type img').getAttribute('src'),
    body: document.body.innerText.toUpperCase(),
  }));
  ok('hero is model 2: THIS IS / DAD’S GARAGE. over the rear-view cruiser plate', t.hero.includes('THIS IS') && t.hero.includes('DAD’S GARAGE.') && /hero-cruiser(-mobile)?-tall/.test(t.heroImg), t.heroImg.split('/').pop());
  ok('first section after the hero says MAINTAIN', /^Maintain\./.test(t.first || ''), t.first);
  ok('tan section says THE GARAGE IS THE PEOPLE.', t.story === 'THE GARAGE IS THE PEOPLE.' && t.storyBg === 'rgb(189, 156, 121)', t.storyBg);
  ok('last visual block: monochrome hands + LET’S TALK BIKES.', t.lastVisual.includes('LET’S TALK BIKES.') && t.lastImg.includes('hands-workshop'));
  ok('no model-2 body (IN THE WORKSHOP / YOUR BIKE. YOUR WAY.)', !t.body.includes('IN THE WORKSHOP') && !t.body.includes('YOUR BIKE. YOUR WAY.'));
  ok('no heating / AC service text', !/HEATING|AIR CON|\bAC REPAIR/.test(t.body));

  // production notes must never reach visitors (text, alt, title, aria-label)
  const leaks = await page.evaluate(() => {
    const words = /\b(conceptual|concept|edited|original photo|generated|illustrative|illustration|transcribed|reconfirm|campaign|mock-?up|placeholder|lorem|AI-?generated|TODO)\b/i;
    const bits = [document.body.innerText, ...[...document.querySelectorAll('[alt],[title],[aria-label]')].map((e) => [e.alt, e.title, e.getAttribute('aria-label')].join(' '))];
    return bits.filter((b) => words.test(b)).map((b) => b.match(words)[0]);
  });
  ok('no production notes in visible text or alt/title/aria', leaks.length === 0, leaks.join(', '));

  const tels = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')))]);
  ok('every phone link is tel:+447472919010', tels.length === 1 && tels[0] === 'tel:+447472919010', tels.join(' '));
  const ext = await page.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].filter((a) => a.target !== '_blank' || !/noopener/.test(a.rel)).map((a) => a.href));
  ok('external links open in a new tab with rel=noopener', ext.length === 0, ext.join(' '));
  const socials = await page.evaluate(() => ['instagram.com/dads.garage.uk', 'facebook.com/dads.garage.uk', 'tiktok.com/@dadsgaragebypaulo'].map((u) => !!document.querySelector(`a[href*="${u}"]`)));
  ok('Instagram, Facebook and TikTok linked', socials.every(Boolean));
  ok('robots noindex meta', await page.evaluate(() => document.querySelector('meta[name=robots]')?.content === 'noindex, nofollow'));

  await loadAll(page);
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.currentSrc || i.src));
  ok('all images decode', broken.length === 0, broken.join(' '));
  const fonts = await page.evaluate(() => ['Big Shoulders Display Variable', 'Archivo Variable', 'Figtree Variable'].map((f) => document.fonts.check(`700 20px "${f}"`)));
  ok('display, wide and text fonts loaded', fonts.every(Boolean), fonts.join(','));

  const ids = await page.evaluate(() => { const a = [...document.querySelectorAll('[id]')].map((e) => e.id); return a.filter((x, i) => a.indexOf(x) !== i); });
  ok('no duplicate ids', ids.length === 0, ids.join(' '));
  const targets = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"], [data-dialog]')].map((e) => (e.dataset.dialog || e.getAttribute('href').slice(1))).filter((id) => id && !document.getElementById(id)));
  ok('every anchor and dialog target exists', targets.length === 0, targets.join(' '));
  const h = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3')].map((e) => +e.tagName[1]));
  ok('one h1, no skipped heading levels', h.filter((x) => x === 1).length === 1 && h.every((x, i) => i === 0 || x <= h[i - 1] + 1));
  ok('no console errors (desktop load)', page.errors.length === 0, page.errors.join(' | '));
  await ctx.close();
}

/* ---------- 2. overflow at every width ---------- */
for (const [w, hgt, mobile] of [[375, 812, true], [390, 844, true], [430, 932, true], [768, 1024, true], [1024, 768, false], [1280, 720, false], [1440, 900, false], [1920, 1080, false]]) {
  const { ctx, page } = await newPage({ viewport: { width: w, height: hgt }, isMobile: mobile, hasTouch: mobile });
  await page.goto(BASE + '?nosmooth', { waitUntil: 'networkidle' });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  let worst = 0;
  for (let y = 0; y < H; y += Math.round(hgt * 0.8)) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(60);
    worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  }
  ok(`no horizontal overflow at ${w}x${hgt}`, worst === 0, worst ? `+${worst}px` : '');
  await ctx.close();
}

/* ---------- 3. hero framing ---------- */
for (const [w, hgt, mobile] of [[390, 664, true], [390, 844, true], [430, 932, true], [768, 1024, true], [1280, 650, false], [1440, 790, false], [1440, 900, false], [1920, 1080, false]]) {
  const { ctx, page } = await newPage({ viewport: { width: w, height: hgt }, isMobile: mobile, hasTouch: mobile });
  await page.goto(BASE + '?static', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const p = document.querySelector('.hero-photo').getBoundingClientRect();
    const phone = innerWidth < 700 || innerWidth / innerHeight <= 0.8;
    // plate coordinates (native scale) of the bike: rear tyre left, front tyre right, tyre bottom, mirror tip
    // cruiser plates: tyres, lowest tyre contact, mirror tips, mirror heads and the left grip
    // (plate px including the headroom band)
    const plate = phone
      ? { w: 1122, l: 230, r: 848, b: 1575, mirrors: [[725, 1062], [712, 1080], [538, 1122], [515, 1160]] }
      : { w: 1672, l: 362, r: 1242, b: 1175, mirrors: [[1105, 488], [1085, 500], [780, 568], [740, 610]] };
    const k = p.width / plate.w;
    // ink boxes of the Big Shoulders lines (line-height 1: cap top .085em, baseline .885em)
    const boxes = ['.hero-kicker', '.hero-title', '.hero-tagline'].map((s) => {
      const e = document.querySelector(s); const r = e.getBoundingClientRect(); const fs = parseFloat(getComputedStyle(e).fontSize);
      return { left: r.left, right: r.right, top: r.top + 0.085 * fs, bottom: r.bottom - 0.115 * fs };
    });
    const pts = plate.mirrors.map(([x, y]) => [p.left + x * k, p.top + y * k]);
    const hits = pts.filter(([x, y]) => boxes.some((r) => x > r.left - 6 && x < r.right + 6 && y > r.top - 6 && y < r.bottom + 6));
    const t = boxes[1];
    return { left: p.left + plate.l * k, right: p.left + plate.r * k, bottom: p.top + plate.b * k, hits: hits.length, m: pts[0], tR: t.right, tB: t.bottom, vw: innerWidth, vh: innerHeight, head: document.querySelector('.masthead').getBoundingClientRect().bottom, tT: boxes[0].top };
  });
  ok(`hero ${w}x${hgt}: both wheels and the tyres inside the frame`, r.left >= 0 && r.right <= r.vw && r.bottom <= r.vh, `L ${r.left.toFixed(0)} R ${r.right.toFixed(0)}/${r.vw} B ${r.bottom.toFixed(0)}/${r.vh}`);
  ok(`hero ${w}x${hgt}: title clear of the header and both mirrors`, r.tT >= r.head - 2 && r.hits === 0, `title ${r.tR.toFixed(0)},${r.tB.toFixed(0)} mirror ${r.m[0].toFixed(0)},${r.m[1].toFixed(0)}`);
  await ctx.close();
}

/* ---------- 4. interactions (desktop, real pointer) ---------- */
{
  const { ctx, page } = await newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('.masthead-book');
  ok('header “Book the workshop” opens the contact sheet', await page.isVisible('#contact-dialog[open] .sheet-phone'));
  ok('focus moves into the sheet', await page.evaluate(() => document.activeElement?.classList.contains('sheet-close')));
  await page.keyboard.press('Escape');
  ok('Escape closes it and focus returns', !(await page.isVisible('#contact-dialog[open]')) && (await page.evaluate(() => document.activeElement?.classList.contains('masthead-book'))));

  for (const [svc, title] of [['maintenance', 'General maintenance.'], ['performance', 'Improving performance.'], ['restore', 'Restore.'], ['custom', 'Make it yours.'], ['claims', 'Claims & recovery.']]) {
    await page.locator(`[data-service="${svc}"]`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.click(`[data-service="${svc}"]`);
    const got = await page.textContent('#service-dialog-title');
    ok(`service “${svc}” opens its sheet`, (await page.isVisible('#service-dialog[open]')) && got === title, got);
    await page.click('#service-dialog [data-close]');
  }
  await page.locator('#story [data-dialog="story-dialog"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.click('#story [data-dialog="story-dialog"]');
  await page.evaluate(() => { const i = document.querySelector('#story-dialog img'); i.loading = 'eager'; });
  await page.waitForTimeout(600);
  ok('“Meet the garage” opens the story with the real frontage photo', (await page.isVisible('#story-dialog[open]')) && (await page.evaluate(() => document.querySelector('#story-dialog img').naturalWidth > 0)));
  await page.click('#story-dialog [data-dialog="contact-dialog"]');
  ok('“Talk to the team” hands over to the contact sheet', (await page.isVisible('#contact-dialog[open]')) && !(await page.isVisible('#story-dialog[open]')));
  const box = await page.locator('#contact-dialog').boundingBox();
  await page.mouse.click(box.x - 10 > 0 ? box.x - 10 : 5, 5);
  ok('clicking the backdrop closes the sheet', !(await page.isVisible('#contact-dialog[open]')));
  await page.waitForTimeout(150);
  ok('page scroll unlocked after sheets', await page.evaluate(() => !document.body.classList.contains('sheet-open')));

  await page.locator('#contact .btn').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.click('#contact .btn');
  ok('“Let’s talk bikes” card button opens contact', await page.isVisible('#contact-dialog[open]'));
  await page.keyboard.press('Escape');

  // anchors from the nav land on their section
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
  await page.click('.main-nav a[href="#story"]');
  await page.waitForTimeout(1800); await settle(page);
  const top = await page.evaluate(() => document.querySelector('#story').getBoundingClientRect().top);
  ok('nav “Our story” lands on the story', Math.abs(top) < 4, `top ${top.toFixed(1)}`);

  // header hides on the way down, returns on the way up
  await page.evaluate(() => scrollTo(0, document.querySelector('#repairs').offsetTop + 400)); await page.waitForTimeout(300);
  await page.mouse.wheel(0, 300); await page.waitForTimeout(400);
  const down = await page.getAttribute('.masthead', 'data-state');
  await page.mouse.wheel(0, -300); await page.waitForTimeout(400);
  const up = await page.getAttribute('.masthead', 'data-state');
  ok('header hides scrolling down and returns scrolling up', down === 'hidden' && up === 'compact', `${down} / ${up}`);

  // claims ride sideways on desktop
  const c = await page.evaluate(() => ({ pinned: document.documentElement.classList.contains('claims-pinned'), h: document.querySelector('#claims').offsetHeight, top: document.querySelector('#claims').offsetTop }));
  ok('claims are pinned on desktop with a scroll runway', c.pinned && c.h > 1400, `height ${c.h}`);
  await page.evaluate((c) => scrollTo(0, c.top + c.h - innerHeight - 2), c); await page.waitForTimeout(1500); await settle(page);
  const end = await page.evaluate(() => ({ lit: [...document.querySelectorAll('.step')].map((s) => s.classList.contains('is-lit')), x: document.querySelector('.step-photo').getBoundingClientRect().right }));
  ok('at the end of the road all four steps are lit and the van is in view', end.lit.every(Boolean) && end.x <= 1440, `${end.lit} right ${end.x.toFixed(0)}`);

  // pause
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  await page.click('.motion-toggle');
  ok('pause button stops the motion', await page.evaluate(() => document.documentElement.classList.contains('motion-off') && document.querySelector('.motion-toggle').getAttribute('aria-pressed') === 'true'));
  await page.click('.motion-toggle');
  ok('…and resumes it', await page.evaluate(() => !document.documentElement.classList.contains('motion-off')));
  ok('no console errors (interactions)', page.errors.length === 0, page.errors.join(' | '));
  await ctx.close();
}

/* ---------- 5. phone menu ---------- */
{
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.tap('.menu-toggle');
  ok('phone menu opens', await page.isVisible('#mobile-menu'));
  await page.tap('#mobile-menu a[href="#claims"]');
  await page.waitForTimeout(1800);
  const top = await page.evaluate(() => document.querySelector('#claims').getBoundingClientRect().top);
  ok('menu link closes the menu and lands on its section', !(await page.isVisible('#mobile-menu')) && Math.abs(top) < 4, `top ${top.toFixed(1)}`);
  const small = await page.evaluate(() => [...document.querySelectorAll('a, button')].filter((e) => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width && cs.visibility !== 'hidden' && e.offsetParent && !e.closest('dialog') && !e.closest('.footer-base') && !e.classList.contains('skip') && (r.height < 40 || r.width < 40) && !e.closest('p');
  }).map((e) => (e.textContent || e.getAttribute('aria-label') || e.className).trim().slice(0, 24) + ` ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
  ok('phone tap targets ≥ 40 px', small.length === 0, small.join(' | '));
  await ctx.close();
}

/* ---------- 6. reduced motion and no JavaScript ---------- */
{
  const { ctx, page } = await newPage({ reducedMotion: 'reduce' });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => ({
    off: document.documentElement.classList.contains('motion-off'),
    heroH: document.querySelector('.hero').offsetHeight,
    pinned: document.documentElement.classList.contains('claims-pinned'),
    hidden: [...document.querySelectorAll('[data-reveal]')].filter((e) => !e.classList.contains('is-in')).length,
  }));
  ok('reduced motion: no pinned runways, every reveal shown', r.off && r.heroH <= 905 && !r.pinned && r.hidden === 0, JSON.stringify(r));
  await ctx.close();
}
{
  const { ctx, page } = await newPage({ javaScriptEnabled: false });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const vis = (s) => [...document.querySelectorAll(s)].every((e) => +getComputedStyle(e).opacity > 0.99 && getComputedStyle(e).clipPath === 'none');
    return { reveal: vis('[data-reveal]'), titles: vis('h1, h2'), phone: !!document.querySelector('a[href="tel:+447472919010"]') };
  });
  ok('without JavaScript every section is readable', r.reveal && r.titles && r.phone, JSON.stringify(r));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
