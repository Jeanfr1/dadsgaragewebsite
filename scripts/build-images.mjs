// AVIF + WebP exports from assets-src/ into public/img/.
// Names carry a version (-v1-) because /img/* is served with an immutable cache:
// when an image changes, bump V so browsers fetch the new file.
import sharp from 'sharp';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const V = 'v1';
const SRC = 'assets-src';
const OUT = 'public/img';

const photos = {
  'hero-rear-tall': [1280, 1920, 2560, 3344],
  'hero-rear-mobile-tall': [640, 960, 1280, 1700],
  'engine-detail': [1280, 1920, 2560],
  'hands-workshop': [1280, 1920, 2560],
  'team-paulo': [480, 720, 960],
  'team-ricardo': [480, 720, 960],
  'team-aline': [480, 720, 960],
  'team-lisa': [480, 720, 960],
  'shop-helmets': [1280, 1920, 3024],
  'workshop-lift': [800, 1200, 1800],
  'recovery-van': [600, 900, 1200],
  frontage: [800, 1178],
};

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const [key, widths] of Object.entries(photos)) {
  const file = `${SRC}/${key}.png`;
  if (!existsSync(file)) throw new Error(`missing ${file}: run npm run prepare-images`);
  for (const w of widths) {
    const base = sharp(file).resize({ width: w, withoutEnlargement: true });
    await base.clone().avif({ quality: 52, effort: 6 }).toFile(`${OUT}/${key}-${V}-${w}.avif`);
    await base.clone().webp({ quality: 78, effort: 6 }).toFile(`${OUT}/${key}-${V}-${w}.webp`);
  }
  console.log(key, widths.join(' '));
}

// Logo keeps its alpha channel.
for (const w of [160, 320, 640]) {
  await sharp(`${SRC}/logo.png`).resize(w).webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/logo-${V}-${w}.webp`);
  await sharp(`${SRC}/logo.png`).resize(w).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-${V}-${w}.png`);
}

// Favicons and touch icons (touch icons sit on the charcoal brand colour).
const charcoal = { r: 28, g: 29, b: 27, alpha: 1 };
await sharp(`${SRC}/logo.png`).resize(48).png().toFile('public/favicon-48.png');
for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  const inner = await sharp(`${SRC}/logo.png`).resize(Math.round(size * 0.84)).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: charcoal } })
    .composite([{ input: inner, gravity: 'center' }]).png().toFile(`public/${name}`);
}

// Social card: the hero plate, 1200x630, with the badge.
const badge = await sharp(`${SRC}/logo.png`).resize(220).toBuffer();
await sharp(`${SRC}/hero-rear.png`).resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: badge, top: 28, left: 40 }])
  .jpeg({ quality: 84, mozjpeg: true }).toFile(`${OUT}/og-${V}.jpg`);
console.log('logo, icons, og done');
