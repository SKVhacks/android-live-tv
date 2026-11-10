#!/usr/bin/env python3
"""Refresh YouTube live-stream IDs in src/data/links.json.

For each channel in CHANNELS, reads the channel's /streams page, finds the
videos currently marked LIVE, and updates that entry's "id" and "url".
If the entry's current video is still live it is kept; otherwise the live
video with the most viewers is used. Channels with nothing live right now
are left unchanged. Only "id" and "url" are touched.

Usage: python3 scripts/update_live_links.py [--dry-run]
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "src" / "data" / "links.json"

# links.json "title" -> (YouTube channel handle, regex that matches the
# title of the channel's 24/7 stream). A channel often runs several live
# streams at once (headlines, press meets); the regex picks the 24/7 one.
CHANNELS = {
    "Polimer News": ("@PolimerNews", r"POLIMER ?NEWS LIVE"),
    "Sun News": ("@Sunnewstamil", r"SUN NEWS LIVE"),
    "Thanthi TV": ("@thanthitv", r"Thanthi TV LIVE"),
    "malaimurasu live": ("@malaimurasunewslive", r"24x7|Malai Murasu Seithigal"),
    "Kalaigar news": ("@KalaignarTVNews", r"கலைஞர் செய்திகள்|Kalaignar Seithigal"),
    "News 24/7 live": ("@NewsTamil24X7TV", r"NEWS TAMIL 24x7 LIVE"),
    "News 7 Tamil": ("@news7tamil", r"News ?7 Tamil LIVE|24x7|24/7"),
    "News 18 Tamil Nadu": ("@News18Tamilnadu", r"News18 Tamil Nadu LIVE|24x7|24/7"),
    "Puthiya Thalaimurai": ("@PuthiyaThalaimuraiTV", r"Puthiya ?Thalaimurai LIVE|24x7|24/7"),
    "News J Live": ("@NewsJ", r"News ?J LIVE|24x7|24/7"),
    "zee live": ("@ZeeTamilNews", r"Zee Tamil News LIVE|24x7|24/7"),
    "sathiyam live": ("@SathiyamTV", r"Sathiyam News LIVE"),
}

# Live streams that are never the 24/7 channel feed.
NOT_24X7 = re.compile(r"Headlines|தலைப்புச் செய்திகள்", re.I)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        "Cookie": "CONSENT=YES+1; SOCS=CAI",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def live_videos(handle):
    """Return [(video_id, viewers, title)] currently live on the channel."""
    html = fetch(f"https://www.youtube.com/{handle}/streams")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S)
    if not m:
        raise RuntimeError("could not read page data (blocked or layout changed)")
    data = json.loads(m.group(1))
    items = []

    def walk(o):
        if isinstance(o, dict):
            if "richItemRenderer" in o:
                items.append(o["richItemRenderer"])
                return
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(data)
    out = []
    for it in items:
        s = json.dumps(it, ensure_ascii=False)
        if "THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE" not in s and '"style": "LIVE"' not in s:
            continue
        vid = re.search(r'"videoId": "([A-Za-z0-9_-]{11})"', s)
        if not vid:
            continue
        w = re.search(r'"([\d,.]+[KkMm]?) watching"', s)
        viewers = 0
        if w:
            n = w.group(1).replace(",", "")
            mult = 1000 if n[-1] in "Kk" else 1_000_000 if n[-1] in "Mm" else 1
            viewers = int(float(n.rstrip("KkMm")) * mult)
        t = re.search(r'"title": \{"runs": \[\{"text": "([^"]*)"', s) or \
            re.search(r'"content": "([^"]*)"', s)
        out.append((vid.group(1), viewers, t.group(1) if t else ""))
    # de-duplicate, keep first occurrence
    seen, uniq = set(), []
    for v in out:
        if v[0] not in seen:
            seen.add(v[0])
            uniq.append(v)
    return uniq


def main():
    dry = "--dry-run" in sys.argv
    text = DATA.read_text(encoding="utf-8")
    # The file is hand-edited JSON; parse it leniently so duplicate keys
    # (the last value wins, as in JS) don't stop the run.
    entries = json.loads(text)
    changed, report = 0, []
    for e in entries:
        title = e.get("title", "")
        if title not in CHANNELS:
            report.append(f"SKIP  {title}: no channel handle configured")
            continue
        handle, pattern = CHANNELS[title]
        try:
            lives = live_videos(handle)
        except Exception as ex:  # keep going for other channels
            report.append(f"ERROR {title} ({handle}): {ex}")
            continue
        if not lives:
            report.append(f"KEEP  {title}: nothing live now, left {e.get('id')}")
            continue
        named = [v for v in lives if re.search(pattern, v[2], re.I)]
        others = [v for v in lives if not NOT_24X7.search(v[2])]
        keep_pool = named or others
        if e.get("id") in [v[0] for v in keep_pool]:
            report.append(f"OK    {title}: {e['id']} still live")
            continue
        if named:
            best, how = max(named, key=lambda v: v[1]), "24/7 match"
        elif others:
            best, how = max(others, key=lambda v: v[1]), "no 24/7 title found, most-watched live"
        else:
            report.append(f"KEEP  {title}: only headline streams live, left {e.get('id')}")
            continue
        report.append(f"NEW   {title}: {e.get('id')} -> {best[0]} "
                      f"[{how}, {best[1]} watching] {best[2][:60]}")
        e["id"] = best[0]
        e["url"] = f"https://www.youtube.com/live/{best[0]}"
        changed += 1
    print("\n".join(report))
    print(f"\n{changed} entr{'y' if changed == 1 else 'ies'} updated")
    if changed and not dry:
        DATA.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
