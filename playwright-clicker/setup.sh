#!/usr/bin/env bash
# One-time setup: install system deps, Python venv, and Playwright browser.
# Run: bash setup.sh

set -euo pipefail

echo "=== 1/4  Installing system libraries for Chromium ==="
sudo apt-get install -y libnspr4 libnss3 libasound2t64

echo "=== 2/4  Creating Python virtual environment ==="
python3 -m venv .venv

echo "=== 3/4  Installing Python packages ==="
.venv/bin/pip install --quiet -r requirements.txt

echo "=== 4/4  Installing Playwright Chromium browser ==="
.venv/bin/playwright install chromium

echo ""
echo "Setup complete!  Next steps:"
echo "  python create_sample.py          # create sample input.xlsx"
echo "  .venv/bin/python run.py input.xlsx            # run headless"
echo "  .venv/bin/python run.py input.xlsx --visible  # run with browser window"
