#!/usr/bin/env python3
"""Basic public-page checks from the Search and AI Visibility playbook.

Local files:  python3 seo_check.py --site-dir site
Live site:    python3 seo_check.py --base-url https://mystudenthubapp.com

URLs come from sitemap.xml, so the sitemap and the checks cannot drift apart.
Exit code 1 means at least one check failed. Needs Python 3 only.
"""
import argparse, json, os, sys, urllib.request, urllib.error
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
from html.parser import HTMLParser


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.h1 = 0; self.title = ''; self.meta = {}; self.canonical = ''
        self.jsonld = []; self._in_title = False; self._ld = None

    def handle_starttag(self, tag, attrs):
        a = {k: (v or '') for k, v in attrs}
        if tag == 'title': self._in_title = True
        elif tag == 'h1': self.h1 += 1
        elif tag == 'meta' and 'name' in a: self.meta[a['name'].lower()] = a.get('content', '')
        elif tag == 'link' and a.get('rel') == 'canonical': self.canonical = a.get('href', '')
        elif tag == 'script' and a.get('type') == 'application/ld+json': self._ld = ''

    def handle_endtag(self, tag):
        if tag == 'title': self._in_title = False
        elif tag == 'script' and self._ld is not None:
            self.jsonld.append(self._ld); self._ld = None

    def handle_data(self, data):
        if self._in_title: self.title += data
        if self._ld is not None: self._ld += data


def sitemap_urls(text):
    ns = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
    return [loc.text.strip() for loc in ET.fromstring(text).iter(ns + 'loc')]


def fetch(url, site_dir):
    if site_dir:
        rel = urlparse(url).path.lstrip('/') or 'index.html'
        if rel.endswith('/'): rel += 'index.html'
        path = os.path.join(site_dir, rel)
        if not os.path.isfile(path): return 404, ''
        return 200, open(path, encoding='utf-8').read()
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, ''


def check(url, status, text):
    if status != 200: return [f'returned {status}']
    p = Page(); p.feed(text)
    fails = []
    if not p.title.strip(): fails.append('missing title')
    if p.h1 != 1: fails.append(f'expected one h1, found {p.h1}')
    if not p.meta.get('description', '').strip(): fails.append('missing meta description')
    if 'noindex' in p.meta.get('robots', '').lower(): fails.append('noindex is set')
    if p.canonical != url: fails.append(f'canonical is {p.canonical or "missing"}, expected {url}')
    for block in p.jsonld:
        try: json.loads(block)
        except ValueError: fails.append('invalid JSON-LD block'); break
    return fails


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--site-dir', help='check local files instead of the live site')
    ap.add_argument('--base-url', default='https://mystudenthubapp.com')
    args = ap.parse_args()
    if args.site_dir:
        sm = open(os.path.join(args.site_dir, 'sitemap.xml'), encoding='utf-8').read()
    else:
        sm = urllib.request.urlopen(args.base_url.rstrip('/') + '/sitemap.xml', timeout=10).read().decode('utf-8')
    urls = sitemap_urls(sm)
    failures = []
    for url in urls:
        status, text = fetch(url, args.site_dir)
        failures += [f'{url}: {f}' for f in check(url, status, text)]
    if failures:
        print('\n'.join(failures)); sys.exit(1)
    print(f'All {len(urls)} URLs passed.')


if __name__ == '__main__':
    main()
