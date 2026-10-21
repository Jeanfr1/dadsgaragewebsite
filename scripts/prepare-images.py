#!/usr/bin/env python3
"""Prepare source images for the site (writes to assets-src/, which is gitignored).

1. Kit plates (images-master/*.png): Real-ESRGAN x2, blended with a Lanczos x2
   so the photographic grain survives (pure ESRGAN reads as painted).
2. Real photos from the garage's own website (dadsgaragemotorcycle.co.uk):
   downloaded once into assets-src/live/, then cropped for their slots.
3. Logo: the kit's transparent PNG reconstruction.

Run: npm run prepare-images   (then: npm run images)
"""
import os
import sys
import urllib.request

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets-src')
LIVE = os.path.join(SRC, 'live')
LIVE_BASE = 'https://dadsgaragemotorcycle.co.uk/wp-content/uploads/2023/11/'
LIVE_FILES = ['photo-1.jpg', 'photo-2.jpg', 'IMG_2748.jpg', 'lisa.jpg',
              'ducati-1.jpg', 'IMG_4385.jpeg', 'IMG_1775.jpg']
os.makedirs(LIVE, exist_ok=True)


def fetch_live():
    for name in LIVE_FILES:
        dest = os.path.join(LIVE, name)
        if os.path.exists(dest):
            continue
        req = urllib.request.Request(LIVE_BASE + name, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as r, open(dest, 'wb') as f:
            f.write(r.read())
        print('downloaded', name)


def save(name, img):
    cv2.imwrite(os.path.join(SRC, name), img, [cv2.IMWRITE_PNG_COMPRESSION, 3])
    print('wrote', name, img.shape[1], 'x', img.shape[0])


def plates():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from esrgan import load_model, x2
    net = load_model()
    # hero-cruiser*: the Harley-style cruiser plates supplied on 2026-10-21 (novo-hero/), same scene as the kit hero
    for key in ['hero-cruiser', 'hero-cruiser-mobile', 'engine-detail', 'hands-workshop']:
        out = os.path.join(SRC, key + '.png')
        if os.path.exists(out) and '--force' not in sys.argv:
            continue
        bgr = cv2.imread(os.path.join(ROOT, 'images-master', key + '.png'), cv2.IMREAD_COLOR)
        h, w = bgr.shape[:2]
        sr = x2(net, bgr).astype(np.float32)
        lz = cv2.resize(bgr, (w * 2, h * 2), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
        save(key + '.png', np.clip(sr * 0.65 + lz * 0.35, 0, 255).astype(np.uint8))


def extend_top(key, extra):
    """Add headroom above a plate so the board's title block fits over the wall.

    The band above the photo continues the photo's top rows upwards (stretched,
    blurred with distance, grained) and darkens into charcoal; most of it sits
    behind the header. Mirroring is not used: it would duplicate the mural.
    """
    img = cv2.imread(os.path.join(SRC, key + '.png'), cv2.IMREAD_COLOR).astype(np.float32)
    h, w = img.shape[:2]
    seed = img[:16]
    band = cv2.resize(seed, (w, extra), interpolation=cv2.INTER_LINEAR)
    band = cv2.GaussianBlur(band, (0, 0), sigmaX=28, sigmaY=6)
    far = cv2.GaussianBlur(band, (0, 0), 40)
    t = np.linspace(1, 0, extra, dtype=np.float32)[:, None, None]  # 1 at top, 0 at the seam
    out = band * (1 - t) + far * t
    rng = np.random.default_rng(7)
    out += rng.normal(0, 5, out.shape).astype(np.float32)
    charcoal = np.array([27, 29, 28], np.float32)  # BGR of #1c1d1b
    dark = np.clip(t ** 0.7 * 1.05, 0, 0.94)
    out = out * (1 - dark) + charcoal * dark
    # Soften the join: the photo's first rows ramp from the band's blur into full detail.
    ramp = int(extra * 0.45)
    soft = cv2.GaussianBlur(img[:ramp], (0, 0), sigmaX=28, sigmaY=6)
    x = np.linspace(0, 1, ramp, dtype=np.float32)[:, None, None]
    k = x * x * (3 - 2 * x)
    img[:ramp] = soft * (1 - k) + img[:ramp] * k
    save(key + '-tall.png', np.vstack([out, img]).clip(0, 255).astype(np.uint8))


def live_crops():
    rd = lambda n: cv2.imread(os.path.join(LIVE, n), cv2.IMREAD_COLOR)
    # Team portraits (3:4 as shot). Mapping follows the live site's "Our Teams" block.
    for src, key in [('photo-1.jpg', 'team-paulo'), ('photo-2.jpg', 'team-ricardo'),
                     ('IMG_2748.jpg', 'team-aline'), ('lisa.jpg', 'team-lisa')]:
        save(key + '.png', rd(src))
    # The shop's helmet wall: top band of Ricardo's photo, above his cap.
    p2 = rd('photo-2.jpg')
    save('shop-helmets.png', p2[0:720, :])
    # Workshop: Ducati on the lift (4:3) and the recovery van (3:4).
    save('workshop-lift.png', rd('ducati-1.jpg'))
    save('recovery-van.png', rd('IMG_4385.jpeg'))


def logo():
    img = cv2.imread(os.path.join(ROOT, 'logo', 'dads-garage-logo-transparent.png'), cv2.IMREAD_UNCHANGED)
    save('logo.png', img)
    front = cv2.imread(os.path.join(ROOT, 'site', 'assets', 'original-garage-frontage.png'), cv2.IMREAD_UNCHANGED)
    save('frontage.png', front[:, :, :3] if front.shape[2] == 4 else front)


if __name__ == '__main__':
    fetch_live()
    live_crops()
    logo()
    plates()
    extend_top('hero-cruiser', 560)          # 280 px at the plate's native scale
    extend_top('hero-cruiser-mobile', 1000)  # 500 px at the plate's native scale
