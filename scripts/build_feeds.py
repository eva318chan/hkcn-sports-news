#!/usr/bin/env python3
"""
兩站通用 feed 生成器：由 data/*.json 生成 sitemap.xml + rss.xml。
用法: python3 build_feeds.py <repo> <site_url>
  repo: eva318chan/hkcn-news | eva318chan/hkcn-sports-news
  site_url: https://hkcn-news.vercel.app | https://hksports.hk
讀取 live GitHub raw data，輸出寫去 stdout 旁嘅 sitemap.xml / rss.xml（當前目錄）。
"""
import sys, json, urllib.request, html
from datetime import datetime, timezone, timedelta
from email.utils import format_datetime
from xml.sax.saxutils import escape

repo, site_url = sys.argv[1], sys.argv[2].rstrip('/')
HKT = timezone(timedelta(hours=8))

def get(path):
    req = urllib.request.Request(f'https://raw.githubusercontent.com/{repo}/main/{path}')
    return urllib.request.urlopen(req, timeout=60).read().decode('utf-8')

man = json.load(urllib.request.urlopen(
    f'https://raw.githubusercontent.com/{repo}/main/data/manifest.json', timeout=60))
dates = [d['date'] if isinstance(d, dict) else d for d in man['dates']]

articles = []
for date in dates:
    try:
        data = json.loads(get(f'data/{date}.json'))
    except Exception as e:
        print(f'skip {date}: {e}', file=sys.stderr); continue
    for a in data:
        try:
            pub = datetime.fromisoformat(a['published_at'])
            if pub.tzinfo is None: pub = pub.replace(tzinfo=HKT)
        except Exception:
            pub = datetime.now(HKT)
        title = a.get('title', {})
        title = title.get('zh_hant') if isinstance(title, dict) else title
        summ = a.get('summary', {})
        summ = summ.get('zh_hant') if isinstance(summ, dict) else summ
        articles.append({
            'id': a['id'], 'title': title or a['id'],
            'summary': summ or '', 'pub': pub,
            'image': a.get('image_url') or '',
        })

articles.sort(key=lambda x: x['pub'], reverse=True)
print(f'{repo}: {len(articles)} articles', file=sys.stderr)

# sitemap.xml（全部文章，由新到舊）
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      f'  <url><loc>{site_url}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>']
for a in articles:
    sm.append(f'  <url><loc>{site_url}/a/{a["id"]}.html</loc>'
              f'<lastmod>{a["pub"].astimezone(HKT).date().isoformat()}</lastmod>'
              f'<changefreq>monthly</changefreq><priority>0.8</priority></url>')
sm.append('</urlset>')
open('sitemap.xml', 'w').write('\n'.join(sm) + '\n')

# rss.xml（最新 50 篇）
rss = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0">', '<channel>']
chan_title = '港體育' if 'sports' in repo else '中港新聞速報'
rss.append(f'<title>{escape(chan_title)}</title><link>{site_url}/</link>'
           f'<description>{escape(chan_title)}最新新聞</description>'
           f'<language>zh-hk</language>'
           f'<lastBuildDate>{format_datetime(datetime.now(HKT))}</lastBuildDate>')
for a in articles[:50]:
    rss.append('<item>')
    rss.append(f'<title>{escape(a["title"])}</title>')
    rss.append(f'<link>{site_url}/a/{a["id"]}.html</link>')
    rss.append(f'<guid>{site_url}/a/{a["id"]}.html</guid>')
    rss.append(f'<pubDate>{format_datetime(a["pub"])}</pubDate>')
    rss.append(f'<description>{escape(a["summary"][:300])}</description>')
    rss.append('</item>')
rss += ['</channel>', '</rss>']
open('rss.xml', 'w').write('\n'.join(rss) + '\n')
print('wrote sitemap.xml + rss.xml', file=sys.stderr)
