#!/usr/bin/env python3
"""Portable static checks. Does not claim to replace browser QA."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json, hashlib, sys

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'
class Markup(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.local=[];self.anchors=[];self.dialogs=[];self.language=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html':self.language=a.get('lang')
        if 'id' in a:self.ids.append(a['id'])
        if 'data-dialog' in a:self.dialogs.append(a['data-dialog'])
        if tag in ['img','script','source','link','a']:
            for key in ['src','href','srcset']:
                value=a.get(key)
                if not value:continue
                if value.startswith('#'):self.anchors.append(value[1:]);continue
                if not urlsplit(value).scheme:self.local.append(value)

p=Markup();html=(SITE/'index.html').read_text();p.feed(html)
errors=[]
def require(ok,message):
    if not ok:errors.append(message)
require(p.language=='en-GB','Website language is not en-GB')
require(len(p.ids)==len(set(p.ids)),'Duplicate HTML ids')
for name in p.anchors+p.dialogs:require(name in p.ids,'Unknown target: '+name)
for value in p.local:require((SITE/unquote(urlsplit(value).path)).is_file(),'Missing local file: '+value)
for path in ROOT.rglob('*.json'):
    try:json.loads(path.read_text())
    except Exception as exc:errors.append(f'Invalid JSON {path}: {exc}')
order=['top','workshop','story','contact'];positions=[html.index(f'id="{x}"') for x in order]
require(positions==sorted(positions),'Wrong section order')
require('src="assets/hero-rear.webp"' in html,'Hero 2 rear image is not used')
for required in ['MAINTAIN.','RESTORE.','CUSTOMISE.','THE GARAGE','IS THE PEOPLE.','LET’S TALK BIKES.']:
    require(required in html,'Missing approved section: '+required)
for excluded in ['YOUR BIKE. YOUR WAY.','IN THE WORKSHOP','Royal Enfield']:
    require(excluded not in html,'Wrong model content in website: '+excluded)
manifest=ROOT/'MANIFEST.sha256'
if manifest.exists():
    for line in manifest.read_text().splitlines():
        digest,name=line.split('  ',1);path=ROOT/name
        require(path.is_file(),'Manifest file missing: '+name)
        if path.is_file():require(hashlib.sha256(path.read_bytes()).hexdigest()==digest,'Checksum mismatch: '+name)
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(p.local)} local references; anchors/dialogs; composition; JSON; checksums when present.')
print('Browser interaction, visual layout and performance remain unverified. See docs/validacao.md.')
