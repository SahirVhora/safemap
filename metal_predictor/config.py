from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


@dataclass(frozen=True)
class Settings:
    data_dir: Path = Path(os.getenv("METAL_DATA_DIR", "data"))
    market_data_provider: str = os.getenv("MARKET_DATA_PROVIDER", "auto")
    gold_api_base_url: str = os.getenv("GOLD_API_BASE_URL", "https://api.gold-api.com/price")
    fx_rate_mode: str = os.getenv("FX_RATE_MODE", "auto")
    fx_api_url: str = os.getenv("FX_API_URL", "https://api.frankfurter.app/latest?from=USD&to=GBP,EUR")
    fx_cache_ttl_hours: int = int(os.getenv("FX_CACHE_TTL_HOURS", "6"))
    gbp_per_usd: float = float(os.getenv("GBP_PER_USD", "0.79"))
    model_lookback_hours: int = int(os.getenv("MODEL_LOOKBACK_HOURS", "24"))
    tune_lookback_hours: int = int(os.getenv("TUNE_LOOKBACK_HOURS", str(24 * 30)))
    confidence_lookback_hours: int = int(os.getenv("CONFIDENCE_LOOKBACK_HOURS", str(24 * 14)))
    confidence_z: float = float(os.getenv("CONFIDENCE_Z", "1.28"))
    forecast_hours: int = int(os.getenv("FORECAST_HOURS", "24"))
    drift_mape_threshold: float = float(os.getenv("DRIFT_MAPE_THRESHOLD", "1.5"))
    drift_lookback_points: int = int(os.getenv("DRIFT_LOOKBACK_POINTS", "12"))
    auto_retrain_on_drift: bool = _env_bool("AUTO_RETRAIN_ON_DRIFT", True)
    drift_retrain_cooldown_hours: int = int(os.getenv("DRIFT_RETRAIN_COOLDOWN_HOURS", "6"))
    webhook_url: str | None = os.getenv("REPORT_WEBHOOK_URL")
    smtp_host: str | None = os.getenv("SMTP_HOST")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str | None = os.getenv("SMTP_USER")
    smtp_pass: str | None = os.getenv("SMTP_PASS")
    email_from: str | None = os.getenv("EMAIL_FROM")
    email_to: str | None = os.getenv("EMAIL_TO")

    def ensure_dirs(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
