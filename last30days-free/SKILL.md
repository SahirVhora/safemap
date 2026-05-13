Zero API key research tool. Searches Reddit, Hacker News, and DuckDuckGo
for any topic from the last 30 days and produces:
- A ranked synthesis with engagement scores
- A copy-paste Claude prompt using real community findings
- A saved Markdown report

## Trigger

Use this skill when the user types `/last30days` or asks to research
recent community discussions, trends, or best practices on any topic.

## Usage

```bash
python3 ~/.claude/skills/last30days-free/last30days_free.py "your topic"
python3 ~/.claude/skills/last30days-free/last30days_free.py "SAP SuccessFactors OData" --quick
python3 ~/.claude/skills/last30days-free/last30days_free.py "Python HR tools 2026" --deep
python3 ~/.claude/skills/last30days-free/last30days_free.py "Claude Code skills" --no-ddg
```

## Flags

| Flag | Effect |
|------|--------|
| `--quick` | 10 Reddit + 10 HN results, faster |
| `--deep` | 40 Reddit + 30 HN results, slower |
| `--no-ddg` | Skip DuckDuckGo (if scraping is blocked) |
| `--output-dir PATH` | Where to save the .md report (default: current dir) |

## Sources

- **Reddit** — public JSON API, no key, sorted by relevance + last month
- **Hacker News** — Algolia API, free, last 30 days filter
- **DuckDuckGo** — HTML scrape, no key, recent results

## Output

1. Console: summary + copy-paste Claude prompt
2. Console: raw ranked list (top 25, scored by upvotes + comments + recency)
3. File: `last30days_<topic>_<timestamp>.md` saved to output dir

## Requirements

- Python 3.8+ (stdlib only — zero pip installs)
- Internet connection
- No API keys
