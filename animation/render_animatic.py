#!/usr/bin/env python3
"""Render an edited motion storyboard, not a browser recording. Needs FFmpeg."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CAPTIONS = ROOT / 'animation' / 'captions'
CAPTIONS.mkdir(exist_ok=True)
copy = {
    'hero-kicker': 'THIS IS', 'hero-title': 'DAD’S GARAGE.',
    'hero-tag': 'BUILT AROUND BIKES. RUN BY FAMILY.',
    'maintain': 'MAINTAIN.', 'actions': 'RESTORE. CUSTOMISE.',
    'story-one': 'THE GARAGE', 'story-two': 'IS THE PEOPLE.',
    'story-copy': 'A FAMILY WORKSHOP. A SHARED LOVE OF BIKES.',
    'contact': 'LET’S TALK BIKES.', 'cta': 'BOOK THE WORKSHOP',
    'address': '73 VICARAGE ROAD, WATFORD'
}
for name, content in copy.items():
    (CAPTIONS / f'{name}.txt').write_text(content, encoding='utf-8')

font = 'animation/workshop-display.otf'
def text(name, x, y, size, color='0xe7e0d4', extra=''):
    return f"drawtext=fontfile={font}:textfile=animation/captions/{name}.txt:x={x}:y={y}:fontsize={size}:fontcolor={color}{extra}"

photo = 'scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,setsar=1'
filters = []
filters.append('[0:v]'+photo+",zoompan=z='1+0.00095*on':x='(iw-iw/zoom)*0.64':y='(ih-ih/zoom)*0.64':d=1:s=1280x720:fps=24,trim=duration=6,setpts=PTS-STARTPTS,"+
    'drawbox=x=0:y=0:w=1280:h=118:color=0x1c1d1b@0.85:t=fill,'+
    text('hero-kicker',50,138,35,'0xbb9676',":alpha='min(1,max(0,(t-0.2)/0.4))'")+','+
    text('hero-title',46,178,112,'0xa4495b',":alpha='min(1,max(0,(t-0.4)/0.7))'")+','+
    text('hero-tag',51,292,18,'0xe7e0d4',":alpha='min(1,max(0,(t-0.8)/0.6))'")+',format=yuv420p[h]')
filters.append('[1:v]'+photo+",zoompan=z='1.065-0.00025*on':x='(iw-iw/zoom)*0.55':y='(ih-ih/zoom)*0.4':d=1:s=1280x720:fps=24,trim=duration=5,setpts=PTS-STARTPTS,"+
    'drawbox=x=0:y=0:w=1280:h=225:color=0x1c1d1b:t=fill,'+
    text('maintain',48,8,162)+','+text('actions',51,165,50,'0xaa4b5d')+',format=yuv420p[e]')
filters.append('[3:v]scale=480:480:force_original_aspect_ratio=decrease,format=rgba,colorchannelmixer=aa=0.17[badge]')
filters.append('[4:v][badge]overlay=x=810:y=115:shortest=1,'+
    text('story-one',54,154,103,'0x642b35')+','+text('story-two',54,252,103,'0x642b35')+','+
    text('story-copy',58,413,22,'0x1c1d1b')+','+text('address',58,483,18,'0x642b35')+',trim=duration=4.5,setpts=PTS-STARTPTS,format=yuv420p[s]')
filters.append('[2:v]'+photo+",zoompan=z='1+0.0003*on':x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.5':d=1:s=1280x720:fps=24,trim=duration=5,setpts=PTS-STARTPTS,"+
    'drawbox=x=50:y=438:w=510:h=222:color=0x782f3e:t=fill,'+
    text('contact',77,477,56)+','+
    'drawbox=x=80:y=566:w=370:h=56:color=0xe7e0d4:t=1,'+
    text('cta',99,583,21)+',format=yuv420p[c]')
filters.extend([
    '[h][e]xfade=transition=fade:duration=0.65:offset=5.35[he]',
    '[he][s]xfade=transition=wipeup:duration=0.65:offset=9.7[hes]',
    '[hes][c]xfade=transition=fade:duration=0.65:offset=13.55[out]'
])
cmd = [
    'ffmpeg','-y','-hide_banner','-loglevel','error','-filter_complex_threads','1',
    '-loop','1','-framerate','24','-i','site/assets/hero-rear.webp',
    '-loop','1','-framerate','24','-i','site/assets/engine-detail.webp',
    '-loop','1','-framerate','24','-i','site/assets/hands-workshop.webp',
    '-loop','1','-framerate','24','-i','site/assets/dads-garage-logo.png',
    '-f','lavfi','-i','color=c=0xbb9676:s=1280x720:r=24:d=4.5',
    '-filter_complex',';'.join(filters),'-map','[out]','-t','18.55',
    '-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',
    '-movflags','+faststart','-an','animation/motion-preview.mp4'
]
subprocess.run(cmd,cwd=ROOT,check=True)
print(ROOT/'animation/motion-preview.mp4')
