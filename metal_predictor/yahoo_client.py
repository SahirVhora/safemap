from __future__ import annotations

import json
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .types import Observation

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
METAL_SYMBOLS = {
    "gold": "GC=F",
    "silver": "SI=F",
}

# Mimic a real browser so Yahoo Finance doesn't block the request with 429/403.
_YAHOO_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en;q=0.9",
}


def fetch_hourly_observations(metal: str, range_: str = "30d") -> list[Observation]:
    symbol = METAL_SYMBOLS[metal]
    query = urlencode({"interval": "60m", "range": range_})
    url = YAHOO_CHART_URL.format(symbol=symbol) + "?" + query

    req = Request(url, headers=_YAHOO_HEADERS)
    with urlopen(req, timeout=15) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    result = payload["chart"]["result"][0]
    timestamps = result["timestamp"]
    closes = result["indicators"]["quote"][0]["close"]

    observations: list[Observation] = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        observations.append(
            Observation(
                ts_utc=datetime.fromtimestamp(ts, tz=timezone.utc),
                price=float(close),
            )
        )

    return observations

