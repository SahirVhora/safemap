#!/usr/bin/env python3
"""
Convert a last30days-free markdown report to a self-contained HTML page.

Usage:
    python3 to_html.py report.md            # writes report.html
    python3 to_html.py report.md --open     # writes + opens in browser
    python3 to_html.py                      # auto-picks newest last30days_*.md
"""

import re
import sys
import os
import glob
import argparse
import webbrowser

CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    min-height: 100vh;
    padding: 2rem 1rem;
}
.container { max-width: 900px; margin: 0 auto; }

/* Header banner */
.banner {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}
.banner h1 { font-size: 1.5rem; color: #f8fafc; }
.banner .meta { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
.badge {
    background: #f97316;
    color: white;
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
}

/* Stat pills */
.stats {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
}
.stat {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
    color: #94a3b8;
}
.stat strong { color: #f8fafc; font-size: 1rem; }

/* Section headings */
h2 {
    font-size: 1.1rem;
    color: #7dd3fc;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 2rem 0 1rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #1e293b;
}
h3 { font-size: 1rem; color: #f8fafc; margin: 1.5rem 0 0.5rem; }

/* Cards for snippets */
.card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 1.2rem 1.4rem;
    margin-bottom: 1rem;
    transition: border-color .2s;
}
.card:hover { border-color: #475569; }
.card .card-title a {
    font-weight: 600;
    color: #60a5fa;
    text-decoration: none;
    font-size: 1rem;
}
.card .card-title a:hover { color: #93c5fd; text-decoration: underline; }
.card .card-meta {
    font-size: 0.78rem;
    color: #64748b;
    margin: 0.3rem 0 0.7rem;
}
.card .card-meta span { margin-right: 0.8rem; }
.card .snippet {
    font-size: 0.88rem;
    color: #94a3b8;
    line-height: 1.6;
    border-left: 3px solid #334155;
    padding-left: 0.8rem;
}

/* Ranked table */
table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    background: #1e293b;
    border-radius: 10px;
    overflow: hidden;
}
thead { background: #0f172a; }
th {
    padding: 0.7rem 0.8rem;
    text-align: left;
    color: #7dd3fc;
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: .05em;
}
td {
    padding: 0.65rem 0.8rem;
    border-top: 1px solid #0f172a;
    color: #cbd5e1;
    vertical-align: top;
}
tr:hover td { background: #243044; }
td a { color: #60a5fa; text-decoration: none; }
td a:hover { text-decoration: underline; }
.score { font-weight: 700; color: #34d399; }
.source-badge {
    background: #ff4500;
    color: white;
    font-size: 0.7rem;
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-weight: 600;
}
.source-badge.hn { background: #ff6600; }
.source-badge.ddg { background: #de5833; }

/* Claude prompt box */
.prompt-box {
    background: #0f172a;
    border: 1px solid #1d4ed8;
    border-radius: 10px;
    padding: 1.2rem 1.4rem;
    position: relative;
    margin-bottom: 2rem;
}
.prompt-box pre {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.82rem;
    color: #93c5fd;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
}
.copy-btn {
    position: absolute;
    top: 0.8rem;
    right: 0.8rem;
    background: #1d4ed8;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    font-size: 0.78rem;
    cursor: pointer;
    transition: background .2s;
}
.copy-btn:hover { background: #2563eb; }

footer {
    text-align: center;
    font-size: 0.78rem;
    color: #475569;
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid #1e293b;
}
"""

JS = """
function copyPrompt() {
    const pre = document.getElementById('claude-prompt');
    navigator.clipboard.writeText(pre.textContent).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
    });
}
"""

def esc(s):
    return s.replace("&amp;", "&").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def linkify(text):
    # [label](url)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)',
                  r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)
    # bare https:// links
    text = re.sub(r'(?<!["\'])https?://\S+',
                  lambda m: f'<a href="{m.group()}" target="_blank" rel="noopener">{m.group()}</a>', text)
    return text

def bold(text):
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)

def parse_table(lines):
    rows = []
    for ln in lines:
        if re.match(r'^\|[-| :]+\|$', ln.strip()):
            continue
        cells = [c.strip() for c in ln.strip().strip('|').split('|')]
        rows.append(cells)
    if not rows:
        return ""
    head, body = rows[0], rows[1:]
    th = "".join(f"<th>{esc(h)}</th>" for h in head)
    trs = ""
    for r in body:
        tds = ""
        for i, c in enumerate(r):
            c = linkify(bold(esc(c)))
            tds += f"<td>{c}</td>"
        trs += f"<tr>{tds}</tr>"
    return f"<table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>"

def md_to_html(md_text):
    lines = md_text.splitlines()

    # Extract frontmatter values
    topic = re.search(r'\*\*Topic:\*\*\s*(.+)', md_text)
    generated = re.search(r'\*\*Generated:\*\*\s*(.+)', md_text)
    sources_line = re.search(r'\*\*Sources:\*\*\s*(.+)', md_text)
    total = re.search(r'\*\*Total results:\*\*\s*(.+)', md_text)

    topic_str = topic.group(1).strip() if topic else "Research Report"
    gen_str = generated.group(1).strip() if generated else ""
    src_str = sources_line.group(1).strip() if sources_line else ""
    total_str = total.group(1).strip() if total else ""

    # Parse upvotes/comments from total
    up_match = re.search(r'([\d,]+)\s*upvotes', total_str)
    cm_match = re.search(r'([\d,]+)\s*comments', total_str)
    cnt_match = re.search(r'^(\d+)', total_str)
    upvotes = up_match.group(1) if up_match else "—"
    comments = cm_match.group(1) if cm_match else "—"
    count = cnt_match.group(1) if cnt_match else "—"

    # --- Build sections ---
    sections = []
    i = 0
    in_code = False
    code_buf = []
    table_buf = []
    in_table = False

    def flush_table():
        nonlocal table_buf, in_table
        if table_buf:
            sections.append(('table', table_buf[:]))
        table_buf = []
        in_table = False

    # Collect snippets (h3 blocks)
    snippets = []  # list of {title, meta_line, body_lines}
    current_snippet = None
    in_snippets_section = False
    in_prompt_section = False
    prompt_lines = []
    in_prompt_code = False

    for ln in lines:
        # Skip the frontmatter paragraph (Topic/Generated/Sources/Total)
        if re.match(r'^\*\*(Topic|Generated|Sources|Total results):\*\*', ln):
            continue
        if ln.strip() == '---':
            if current_snippet:
                snippets.append(current_snippet)
                current_snippet = None
            if in_snippets_section:
                in_snippets_section = False
            if in_prompt_section:
                in_prompt_section = False
            continue

        if re.match(r'^## Community Snippets', ln):
            in_snippets_section = True
            continue
        if re.match(r'^## Copy-Paste Claude Prompt', ln):
            in_prompt_section = True
            continue
        if re.match(r'^## ', ln) and in_snippets_section:
            in_snippets_section = False

        if in_prompt_section:
            if ln.strip() == '```':
                if not in_prompt_code:
                    in_prompt_code = True
                else:
                    in_prompt_code = False
            elif in_prompt_code:
                prompt_lines.append(ln)
            continue

        if in_snippets_section:
            if re.match(r'^### ', ln):
                if current_snippet:
                    snippets.append(current_snippet)
                current_snippet = {'title': ln[4:].strip(), 'meta': '', 'body': []}
            elif current_snippet:
                if ln.startswith('**Source:**'):
                    current_snippet['meta'] = ln
                else:
                    current_snippet['body'].append(ln)
            continue

    if current_snippet:
        snippets.append(current_snippet)

    # Build top table HTML separately
    top_table_html = ""
    table_started = False
    table_lines = []
    for ln in lines:
        if ln.strip().startswith('| #'):
            table_started = True
        if table_started:
            if ln.strip().startswith('|'):
                table_lines.append(ln)
            elif table_lines:
                break
    if table_lines:
        top_table_html = parse_table(table_lines)

    # Build snippets HTML
    snippets_html = ""
    for s in snippets:
        title = esc(s['title'])
        meta_parts = re.findall(r'\*\*(.+?):\*\*\s*([^·]+)', s['meta'])
        meta_dict = {k.strip(): v.strip() for k, v in meta_parts}
        src = meta_dict.get('Source', '')
        date = meta_dict.get('Date', '')
        url_m = re.search(r'https?://\S+', s['meta'])
        url = url_m.group(0) if url_m else '#'
        body = " ".join(l for l in s['body'] if l.strip())[:350]
        body = esc(body)

        src_class = 'hn' if 'Hacker News' in src else ('ddg' if 'DuckDuck' in src else '')
        src_label = 'Reddit' if 'Reddit' in src else ('HN' if 'Hacker News' in src else 'Web')

        snippets_html += f"""
<div class="card">
  <div class="card-title"><a href="{url}" target="_blank" rel="noopener">{title}</a></div>
  <div class="card-meta">
    <span><span class="source-badge {src_class}">{src_label}</span></span>
    <span>{date}</span>
    <span><a href="{url}" target="_blank" rel="noopener">↗ Open</a></span>
  </div>
  <div class="snippet">{body}…</div>
</div>"""

    prompt_html = ""
    if prompt_lines:
        prompt_text = esc("\n".join(prompt_lines))
        prompt_html = f"""
<h2>Claude Prompt</h2>
<div class="prompt-box">
  <button class="copy-btn" onclick="copyPrompt()">Copy</button>
  <pre id="claude-prompt">{prompt_text}</pre>
</div>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>last30days — {esc(topic_str)}</title>
<style>{CSS}</style>
</head>
<body>
<div class="container">

  <div class="banner">
    <div>
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.25rem">
        <span class="badge">/last30days-free</span>
        <h1>{esc(topic_str)}</h1>
      </div>
      <div class="meta">Generated {gen_str} &nbsp;·&nbsp; Sources: {esc(src_str)}</div>
    </div>
  </div>

  <div class="stats">
    <div class="stat"><strong>{count}</strong><br>results</div>
    <div class="stat"><strong>{upvotes}</strong><br>upvotes</div>
    <div class="stat"><strong>{comments}</strong><br>comments</div>
    <div class="stat"><strong>30 days</strong><br>lookback</div>
  </div>

  <h2>Top Results — newest first</h2>
  {top_table_html}

  <h2>Community Snippets</h2>
  {snippets_html}

  {prompt_html}

  <footer>Generated by last30days-free &nbsp;·&nbsp; no API key required</footer>
</div>
<script>{JS}</script>
</body>
</html>"""
    return html


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    parser = argparse.ArgumentParser(description="Convert last30days markdown report to HTML")
    parser.add_argument("input", nargs="?", help="Markdown file to convert (auto-detects if omitted)")
    parser.add_argument("--open", action="store_true", help="Open in browser after conversion")
    parser.add_argument("--output-dir", default=script_dir, help="Where to write the HTML file")
    args = parser.parse_args()

    if args.input:
        md_path = args.input
    else:
        # Search in skill folder first, then cwd
        candidates = sorted(
            glob.glob(os.path.join(script_dir, "last30days_*.md")),
            key=os.path.getmtime, reverse=True
        )
        if not candidates:
            candidates = sorted(glob.glob("last30days_*.md"), key=os.path.getmtime, reverse=True)
        if not candidates:
            print("No last30days_*.md file found. Pass a filename explicitly.")
            sys.exit(1)
        md_path = candidates[0]
        print(f"Auto-selected: {md_path}")

    if not os.path.exists(md_path):
        print(f"File not found: {md_path}")
        sys.exit(1)

    with open(md_path, encoding="utf-8") as f:
        md = f.read()

    html = md_to_html(md)

    base = os.path.splitext(os.path.basename(md_path))[0]
    html_path = os.path.join(args.output_dir, base + ".html")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✓  HTML saved → {html_path}")

    if args.open:
        abs_path = os.path.abspath(html_path)
        webbrowser.open(f"file://{abs_path}")
        print(f"✓  Opened in browser")
    else:
        abs_path = os.path.abspath(html_path)
        print(f"\n   Open in browser:\n   file://{abs_path}")


if __name__ == "__main__":
    main()
