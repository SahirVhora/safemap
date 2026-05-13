#!/usr/bin/env python3
"""
/last30days-free — Zero API key research tool
Searches Reddit, Hacker News, and DuckDuckGo for any topic
from the last 30 days, ranks by engagement, and outputs:
  1. A synthesised summary + copy-paste Claude prompt
  2. A raw ranked post list
  3. A saved Markdown report

Usage:
    python3 last30days_free.py "your topic here"
    python3 last30days_free.py "SAP SuccessFactors OData" --quick
    python3 last30days_free.py "Python HR tools" --deep
"""

import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error
import datetime
import argparse
import re
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

# ── Colour helpers ────────────────────────────────────────────────────────────
BOLD   = "\033[1m"
CYAN   = "\033[96m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
DIM    = "\033[2m"
RESET  = "\033[0m"

def hdr(text): print(f"\n{BOLD}{CYAN}{text}{RESET}")
def ok(text):  print(f"  {GREEN}✓{RESET} {text}")
def warn(text):print(f"  {YELLOW}⚠{RESET}  {text}")
def err(text): print(f"  {RED}✗{RESET} {text}")
def dim(text): print(f"  {DIM}{text}{RESET}")

# ── HTTP helper ───────────────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": "last30days-free/1.0 (research tool; no login)",
    "Accept": "application/json",
}

def fetch(url: str, timeout: int = 10) -> dict | list | None:
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(3):
        try:
            time.sleep(1)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read().decode("utf-8", errors="replace")
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            log.warning("HTTP %s → %s", e.code, url[:80])
            return None
        except urllib.error.URLError as e:
            wait = 2 ** (attempt + 1)
            log.warning("URL error (attempt %d/3): %s → %s", attempt + 1, e.reason, url[:80])
            if attempt < 2:
                time.sleep(wait)
        except json.JSONDecodeError as e:
            log.warning("JSON decode error: %s → %s", e, url[:80])
            return None
    return None

# ── Date helpers ──────────────────────────────────────────────────────────────
NOW_TS  = int(time.time())
DAYS_30 = 60 * 60 * 24 * 30

def days_ago(ts: int) -> int:
    return max(0, (NOW_TS - ts) // 86400)

def fmt_date(ts: int) -> str:
    return datetime.datetime.utcfromtimestamp(ts).strftime("%d %b %Y")

# ── Scoring ───────────────────────────────────────────────────────────────────
def recency_factor(ts: int) -> float:
    """1.0 = today, 0.0 = 30 days ago"""
    age = NOW_TS - ts
    return max(0.0, 1.0 - age / DAYS_30)

def score_post(upvotes: int, comments: int, ts: int) -> float:
    engagement = upvotes + comments * 2
    return round(engagement * (0.4 + 0.6 * recency_factor(ts)), 1)

# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 1 — Reddit (public JSON API, no key needed)
# ══════════════════════════════════════════════════════════════════════════════
def search_reddit(query: str, limit: int = 25) -> list[dict]:
    hdr("📡  Reddit  (last 30 days)")
    encoded = urllib.parse.quote(query)
    url = (
        f"https://www.reddit.com/search.json"
        f"?q={encoded}&sort=relevance&t=month&limit={limit}&type=link"
    )
    data = fetch(url)
    if not data:
        err("Reddit returned nothing")
        return []

    posts = []
    children = data.get("data", {}).get("children", [])
    for child in children:
        p = child.get("data", {})
        ts = int(p.get("created_utc", 0))
        if NOW_TS - ts > DAYS_30:
            continue
        upvotes  = p.get("score", 0)
        comments = p.get("num_comments", 0)
        posts.append({
            "source":   "Reddit",
            "title":    p.get("title", ""),
            "url":      "https://reddit.com" + p.get("permalink", ""),
            "subreddit":p.get("subreddit_name_prefixed", ""),
            "upvotes":  upvotes,
            "comments": comments,
            "date_ts":  ts,
            "date":     fmt_date(ts),
            "days_ago": days_ago(ts),
            "score":    score_post(upvotes, comments, ts),
            "snippet":  (p.get("selftext") or p.get("url", ""))[:200],
        })

    ok(f"Found {len(posts)} Reddit posts")
    return posts

# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 2 — Hacker News (Algolia API, completely free)
# ══════════════════════════════════════════════════════════════════════════════
def search_hn(query: str, limit: int = 20) -> list[dict]:
    hdr("🟠  Hacker News  (last 30 days)")
    encoded = urllib.parse.quote(query)
    cutoff  = NOW_TS - DAYS_30
    url = (
        f"https://hn.algolia.com/api/v1/search"
        f"?query={encoded}&tags=story&numericFilters=created_at_i>{cutoff}"
        f"&hitsPerPage={limit}"
    )
    data = fetch(url)
    if not data:
        err("HN returned nothing")
        return []

    posts = []
    for hit in data.get("hits", []):
        ts       = hit.get("created_at_i", 0)
        upvotes  = hit.get("points") or 0
        comments = hit.get("num_comments") or 0
        obj_id   = hit.get("objectID", "")
        url_link = hit.get("url") or f"https://news.ycombinator.com/item?id={obj_id}"
        posts.append({
            "source":   "HackerNews",
            "title":    hit.get("title", ""),
            "url":      url_link,
            "subreddit":"",
            "upvotes":  upvotes,
            "comments": comments,
            "date_ts":  ts,
            "date":     fmt_date(ts),
            "days_ago": days_ago(ts),
            "score":    score_post(upvotes, comments, ts),
            "snippet":  (hit.get("story_text") or "")[:200],
        })

    ok(f"Found {len(posts)} HN stories")
    return posts

# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 3 — DuckDuckGo (HTML scrape, no key)
# ══════════════════════════════════════════════════════════════════════════════
DDG_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-GB,en;q=0.9",
}

def search_ddg(query: str, limit: int = 10) -> list[dict]:
    hdr("🦆  DuckDuckGo  (web results)")
    encoded = urllib.parse.quote(f"{query} after:2025")
    url = f"https://html.duckduckgo.com/html/?q={encoded}"
    req = urllib.request.Request(url, headers=DDG_HEADERS)
    html = None
    for attempt in range(3):
        try:
            time.sleep(1)
            with urllib.request.urlopen(req, timeout=12) as r:
                html = r.read().decode("utf-8", errors="replace")
            break
        except urllib.error.HTTPError as e:
            log.warning("DDG HTTP %s", e.code)
            break
        except urllib.error.URLError as e:
            wait = 2 ** (attempt + 1)
            log.warning("DDG URL error (attempt %d/3): %s", attempt + 1, e.reason)
            if attempt < 2:
                time.sleep(wait)
    if html is None:
        return []

    # Extract result titles + URLs from DDG HTML
    results = []
    title_pat   = re.compile(r'class="result__title"[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.S)
    snippet_pat = re.compile(r'class="result__snippet"[^>]*>(.*?)</div>', re.S)

    titles   = title_pat.findall(html)
    snippets = [re.sub(r'<[^>]+>', '', s).strip()
                for s in snippet_pat.findall(html)]

    for i, (link, title) in enumerate(titles[:limit]):
        clean_title   = re.sub(r'<[^>]+>', '', title).strip()
        clean_snippet = snippets[i] if i < len(snippets) else ""
        if not clean_title or "duckduckgo" in link.lower():
            continue
        results.append({
            "source":   "DuckDuckGo",
            "title":    clean_title,
            "url":      link,
            "subreddit":"",
            "upvotes":  0,
            "comments": 0,
            "date_ts":  NOW_TS - 86400 * 7,   # assume ~1 week old
            "date":     "recent",
            "days_ago": 7,
            "score":    5.0,                   # neutral score
            "snippet":  clean_snippet,
        })

    ok(f"Found {len(results)} web results")
    return results

# ══════════════════════════════════════════════════════════════════════════════
# SYNTHESIS — build all three outputs
# ══════════════════════════════════════════════════════════════════════════════
def synthesise(query: str, all_posts: list[dict]) -> tuple[str, str, str]:
    """Returns (summary_text, ranked_list_text, markdown_report)"""

    if not all_posts:
        return ("No results found.", "No results found.", "# No results found")

    ranked = sorted(all_posts, key=lambda p: p["date_ts"], reverse=True)
    top    = ranked[:15]

    # ── counts ────────────────────────────────────────────────────────────────
    by_source = {}
    for p in all_posts:
        by_source.setdefault(p["source"], []).append(p)

    total_upvotes  = sum(p["upvotes"]  for p in all_posts)
    total_comments = sum(p["comments"] for p in all_posts)

    # ── 1. SUMMARY + CLAUDE PROMPT ───────────────────────────────────────────
    stats_line = (
        f"{len(all_posts)} results — "
        + ", ".join(f"{len(v)} from {k}" for k, v in by_source.items())
        + f" | {total_upvotes:,} upvotes · {total_comments:,} comments"
    )

    top5_bullets = "\n".join(
        f"  {i+1}. [{p['title'][:80]}]({p['url']})\n"
        f"     {p['source']} · {p['date']} · ↑{p['upvotes']} 💬{p['comments']}"
        for i, p in enumerate(top[:5])
    )

    snippets_block = "\n\n".join(
        f"**{p['title'][:90]}** ({p['source']}, {p['date']})\n{p['snippet'][:180]}"
        for p in top[:8] if p["snippet"]
    )

    summary = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /last30days-free  ·  Topic: {query}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESEARCH STATS
{stats_line}

TOP 5 RESULTS (newest first)
{top5_bullets}

COMMUNITY SNIPPETS
{snippets_block}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COPY-PASTE CLAUDE PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on recent community discussions about "{query}" (last 30 days),
here are the key sources and their content. Please synthesise these into:
1. The main patterns and best practices the community has converged on
2. Key warnings or gotchas mentioned repeatedly
3. Your recommended approach given this real-world context

SOURCES:
{chr(10).join(f"- [{p['title'][:70]}]({p['url']}) — {p['source']}, {p['date']}, ↑{p['upvotes']}" for p in top[:10])}

COMMUNITY DISCUSSION EXCERPTS:
{snippets_block}

Please provide a practical synthesis I can act on today.
"""

    # ── 2. RAW RANKED LIST ───────────────────────────────────────────────────
    rows = []
    for i, p in enumerate(ranked[:25], 1):
        rows.append(
            f"\n{i:>2}. [{p['source']:10}] score={p['score']:6.1f} | "
            f"↑{p['upvotes']:5} 💬{p['comments']:4} | {p['date']}\n"
            f"    {p['title'][:90]}\n"
            f"    {p['url'][:100]}"
        )
    ranked_list = "\n".join(rows)

    # ── 3. MARKDOWN REPORT ───────────────────────────────────────────────────
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    md_rows = "\n".join(
        f"| {i} | {p['source']} | [{p['title'][:60]}]({p['url']}) | "
        f"{p['upvotes']} | {p['comments']} | {p['date']} |"
        for i, p in enumerate(ranked[:25], 1)
    )

    markdown = f"""# /last30days-free Report

**Topic:** {query}
**Generated:** {now_str}
**Sources:** {', '.join(by_source.keys())}
**Total results:** {len(all_posts)} ({total_upvotes:,} upvotes · {total_comments:,} comments)

---

## Top Results

| # | Source | Title | ↑ | 💬 | Date |
|---|--------|-------|---|----|------|
{md_rows}

---

## Community Snippets

{chr(10).join(f"### {p['title'][:80]}{chr(10)}**Source:** {p['source']} · **Date:** {p['date']} · **URL:** {p['url']}{chr(10)}{chr(10)}{p['snippet']}{chr(10)}" for p in top[:10] if p['snippet'])}

---

## Copy-Paste Claude Prompt

```
Based on recent community discussions about "{query}" (last 30 days),
here are the top sources. Please synthesise:
1. Main patterns and best practices the community has converged on
2. Key warnings or gotchas mentioned repeatedly
3. Your recommended approach given this real-world context

SOURCES:
{chr(10).join(f"- {p['title'][:70]} ({p['source']}, {p['date']}, ↑{p['upvotes']}) — {p['url']}" for p in top[:10])}
```

---
*Generated by last30days-free — no API key required*
"""

    return summary, ranked_list, markdown


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(
        description="/last30days-free — research any topic, zero API keys"
    )
    parser.add_argument("query", nargs="+", help="Topic to research")
    parser.add_argument("--quick", action="store_true", help="Fewer results, faster")
    parser.add_argument("--deep",  action="store_true", help="More results, slower")
    parser.add_argument("--no-ddg", action="store_true", help="Skip DuckDuckGo")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parser.add_argument("--output-dir", default=script_dir, help="Where to save report")
    args = parser.parse_args()

    query = " ".join(args.query)
    limit_reddit = 10 if args.quick else (40 if args.deep else 25)
    limit_hn     = 10 if args.quick else (30 if args.deep else 20)
    limit_ddg    = 5  if args.quick else (15 if args.deep else 10)

    log.info("\n%s🔍  /last30days-free%s", BOLD, RESET)
    log.info("    Topic : %s%s%s", CYAN, query, RESET)
    log.info("    Mode  : %s", "quick" if args.quick else "deep" if args.deep else "standard")
    log.info("    Time  : last 30 days")

    all_posts: list[dict] = []

    # Reddit
    all_posts += search_reddit(query, limit_reddit)
    time.sleep(1.5)   # be polite to Reddit

    # Hacker News
    all_posts += search_hn(query, limit_hn)
    time.sleep(0.5)

    # DuckDuckGo
    if not args.no_ddg:
        all_posts += search_ddg(query, limit_ddg)

    if not all_posts:
        log.warning("\n%sNo results found. Try a broader query.%s\n", RED, RESET)
        sys.exit(1)

    hdr("📊  Synthesising results...")
    summary, ranked_list, markdown = synthesise(query, all_posts)

    # ── Output 1: Summary + Claude prompt ────────────────────────────────────
    hdr("═" * 60)
    log.info("%s", summary)

    # ── Output 2: Raw ranked list ─────────────────────────────────────────────
    hdr("📋  RAW RANKED LIST (top 25)")
    log.info("%s", ranked_list)

    # ── Output 3: Save markdown report ───────────────────────────────────────
    hdr("💾  Saving Markdown report...")
    safe_name = re.sub(r'[^\w\-]', '_', query.lower())[:40]
    ts_str    = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M")
    filename  = f"last30days_{safe_name}_{ts_str}.md"
    filepath  = os.path.join(args.output_dir, filename)

    os.makedirs(args.output_dir, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(markdown)

    ok(f"Report saved → {filepath}")
    log.info("\n%s%sDone!%s %d results researched.\n", BOLD, GREEN, RESET, len(all_posts))


if __name__ == "__main__":
    main()
