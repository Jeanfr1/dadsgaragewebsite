#!/usr/bin/env python3
"""Frames README captures (qa/readme/) into .github/assets/: browser-framed desktop
sections and phone-framed mobile screens. Run after scripts/readme-assets.mjs."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAP = os.path.join(ROOT, 'qa', 'readme')
OUT = os.path.join(ROOT, '.github', 'assets')
BG = (21, 22, 21)
URL = 'dads-garage-watford.vercel.app'


def font(size):
    for f in ['/System/Library/Fonts/SFNS.ttf', '/System/Library/Fonts/Helvetica.ttc', '/Library/Fonts/Arial.ttf']:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def browser(shot, w=1100):
    im = Image.open(shot).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    bar = 40
    frame = Image.new('RGB', (w, im.height + bar), (44, 45, 43))
    d = ImageDraw.Draw(frame)
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse((16 + i * 20, 14, 28 + i * 20, 26), fill=c)
    d.rounded_rectangle((w // 2 - 190, 9, w // 2 + 190, 31), 8, fill=(30, 31, 29))
    f = font(13)
    tw = d.textlength(URL, font=f)
    d.text((w / 2 - tw / 2, 12), URL, fill=(190, 186, 176), font=f)
    frame.paste(im, (0, bar))
    return frame


def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out


def phone(shot, w=300):
    im = Image.open(shot).convert('RGB')
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    pad, status = 12, 34
    body = Image.new('RGBA', (w + pad * 2, im.height + pad * 2 + status), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body.width - 1, body.height - 1), 44, fill=(10, 10, 10), outline=(70, 70, 68), width=2)
    screen = Image.new('RGB', (w, im.height + status), (12, 12, 12))
    screen.paste(im, (0, status))
    body.alpha_composite(rounded(screen.convert('RGBA'), 34), (pad, pad))
    d = ImageDraw.Draw(body)
    d.rounded_rectangle((body.width / 2 - 44, pad + 7, body.width / 2 + 44, pad + 29), 11, fill=(0, 0, 0))
    return body


# desktop: 2 columns x 3 rows
names = ['repairs', 'claims', 'shop', 'story', 'team', 'contact']
frames = [browser(os.path.join(CAP, f'd-{n}.png')) for n in names]
gap, m = 36, 48
fw, fh = frames[0].size
sheet = Image.new('RGB', (m * 2 + fw * 2 + gap, m * 2 + fh * 3 + gap * 2), BG)
for i, fr in enumerate(frames):
    sheet.paste(fr, (m + (i % 2) * (fw + gap), m + (i // 2) * (fh + gap)))
sheet.save(os.path.join(OUT, 'desktop-sections.jpg'), quality=84, optimize=True, progressive=True)
print('desktop-sections.jpg', sheet.size)

# phones in a row
names = ['hero', 'workshop', 'claims', 'team', 'contact']
ph = [phone(os.path.join(CAP, f'm-{n}.png')) for n in names]
pw, phh = ph[0].size
sheet = Image.new('RGBA', (m * 2 + pw * len(ph) + gap * (len(ph) - 1), m * 2 + phh), BG + (255,))
for i, p in enumerate(ph):
    sheet.alpha_composite(p, (m + i * (pw + gap), m))
sheet.convert('RGB').save(os.path.join(OUT, 'mobile-screens.jpg'), quality=86, optimize=True, progressive=True)
print('mobile-screens.jpg', sheet.size)
