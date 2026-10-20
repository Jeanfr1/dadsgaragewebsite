#!/usr/bin/env python3
"""Ink boxes of the approved boards' text, in board pixels.

Hero board (references/APPROVED-HERO-model-2.png) is 971 px wide; the sections
board (references/APPROVED-SECTIONS-model-3.png) is 893 px wide. Each entry scans
a search window for pixels matching the text colour and prints the tight box, so
the CSS can be fitted to the board (see scripts/fit-type.mjs).
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = np.array(Image.open(os.path.join(ROOT, 'references/APPROVED-HERO-model-2.png')).convert('RGB')).astype(int)
S = np.array(Image.open(os.path.join(ROOT, 'references/APPROVED-SECTIONS-model-3.png')).convert('RGB')).astype(int)

red = lambda a: (a[..., 0] - a[..., 1] > 45) & (a[..., 0] > 95)
light = lambda t: (lambda a: a.sum(-1) > t)
dark = lambda t: (lambda a: a.sum(-1) < t)
tan = lambda a: (a[..., 0] > 140) & (a[..., 0] - a[..., 2] > 40)

# name: (board, x0, y0, x1, y1, predicate) — windows chosen around each text run
REG = {
    'hero.this-is':   (H, 130, 140, 400, 192, tan),
    'hero.title':     (H, 130, 195, 700, 295, red),
    'hero.tagline':   (H, 130, 302, 470, 326, light(420)),
    'hero.nav-workshop': (H, 255, 45, 335, 66, light(500)),
    'hero.nav-motorcycles': (H, 355, 45, 455, 66, light(500)),
    'hero.nav-story': (H, 478, 45, 560, 66, light(500)),
    'hero.nav-contact': (H, 582, 45, 650, 66, light(500)),
    'hero.book':      (H, 700, 30, 900, 80, tan),
    'hero.book-label': (H, 725, 48, 850, 62, dark(200)),
    'hero.header-line': (H, 300, 98, 700, 108, light(150)),
    'sec.maintain':   (S, 30, 600, 740, 726, light(560)),
    'sec.restore':    (S, 30, 728, 740, 772, red),
    'sec.aside':      (S, 740, 650, 880, 702, light(330)),
    'sec.aside-rule': (S, 740, 712, 820, 722, light(300)),
    'sec.nav-1':      (S, 30, 1055, 185, 1075, light(330)),
    'sec.nav-2':      (S, 205, 1055, 372, 1075, light(330)),
    'sec.nav-3':      (S, 405, 1055, 475, 1075, light(330)),
    'sec.nav-4':      (S, 525, 1055, 620, 1075, light(330)),
    'sec.nav-5':      (S, 670, 1055, 855, 1075, light(330)),
    'sec.story-1':    (S, 35, 1100, 560, 1192, dark(260)),
    'sec.story-2':    (S, 35, 1193, 560, 1276, dark(260)),
    'sec.story-para': (S, 40, 1280, 520, 1342, dark(330)),
    'sec.story-btn':  (S, 40, 1348, 245, 1394, dark(300)),
    'sec.card':       (S, 30, 1495, 345, 1625, lambda a: (a[..., 0] > 85) & (a[..., 0] - a[..., 1] > 50)),
    'sec.card-title': (S, 50, 1518, 330, 1558, light(560)),
    'sec.card-btn':   (S, 50, 1564, 245, 1612, light(420)),
    'sec.foot-nav':   (S, 30, 1680, 330, 1702, light(380)),
    'sec.foot-logo':  (S, 380, 1632, 520, 1760, lambda a: (a[..., 0] - a[..., 2] > 40) & (a[..., 0] > 110)),
    'sec.foot-addr':  (S, 730, 1675, 870, 1720, light(380)),
}

out = {}
for name, (img, x0, y0, x1, y1, pred) in REG.items():
    m = pred(img[y0:y1, x0:x1])
    ys, xs = np.where(m)
    if len(xs) == 0:
        out[name] = None
        continue
    out[name] = {'x0': int(xs.min() + x0), 'x1': int(xs.max() + x0 + 1),
                 'y0': int(ys.min() + y0), 'y1': int(ys.max() + y0 + 1)}
    b = out[name]
    print(f"{name:22s} x {b['x0']:4d}-{b['x1']:4d} (w {b['x1']-b['x0']:3d})  y {b['y0']:4d}-{b['y1']:4d} (h {b['y1']-b['y0']:3d})")

# row profile of the story paragraph: line tops/bottoms
x0, y0, x1, y1 = 40, 1280, 520, 1342
rows = dark(330)(S[y0:y1, x0:x1]).sum(1)
lines, on = [], False
for i, v in enumerate(rows):
    if v > 2 and not on: start, on = i, True
    if v <= 2 and on: lines.append((start + y0, i + y0)); on = False
print('story paragraph lines', lines)
out['sec.story-para-lines'] = lines
json.dump(out, open(os.path.join(ROOT, 'scripts', 'board-measure.json'), 'w'), indent=1)
