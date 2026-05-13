from __future__ import annotations

import json
from datetime import datetime, timezone
from urllib.request import urlopen

from .types import Observation

GOLD_API_SYMBOLS = {
    "gold": "XAU",
    "silver": "XAG",
}


def _hour_floor(dt: datetime) -> datetime:
    return dt.replace(minute=0, second=0, microsecond=0)


def fetch_spot_observation(metal: str, base_url: str) -> list[Observation]:
    symbol = GOLD_API_SYMBOLS[metal]
    url = f"{base_url.rstrip('/')}/{symbol}"

    with urlopen(url, timeout=15) as resp:
        payload = json.loads(resp.read().decode("utf-8"))

    price = payload.get("price")
    if price is None:
        return []

    ts_epoch = payload.get("timestamp")
    if isinstance(ts_epoch, (int, float)):
        ts = datetime.fromtimestamp(ts_epoch, tz=timezone.utc)
    else:
        ts = datetime.now(timezone.utc)

    # Keep one record per hour for model stability.
    return [Observation(ts_utc=_hour_floor(ts), price=float(price))]

