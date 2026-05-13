from __future__ import annotations

import json
from datetime import datetime, timezone
from urllib.request import urlopen


def fetch_gbp_per_usd(base_url: str) -> tuple[float, datetime]:
    url = base_url.rstrip("/")
    with urlopen(url, timeout=15) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    rates = payload.get("rates") or {}
    gbp = rates.get("GBP")
    if gbp is None:
        raise ValueError("FX response missing rates.GBP")

    fetched_at = datetime.now(timezone.utc)
    return float(gbp), fetched_at

