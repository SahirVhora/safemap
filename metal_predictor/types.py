from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Observation:
    ts_utc: datetime
    price: float


@dataclass(frozen=True)
class ForecastPoint:
    generated_at_utc: datetime
    target_ts_utc: datetime
    metal: str
    predicted_price: float
    predicted_direction: str
    predicted_lower_price: float | None = None
    predicted_upper_price: float | None = None
