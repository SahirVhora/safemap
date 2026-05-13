from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json
import logging
import urllib.error

from .config import Settings
from .fx_client import fetch_gbp_per_usd
from .storage import load_cached_fx_rate, save_cached_fx_rate


def _is_api_source(source: str | None) -> bool:
    if not source:
        return False
    return source.startswith("http://") or source.startswith("https://")


def resolve_fx_context(settings: Settings) -> dict:
    mode = settings.fx_rate_mode.lower().strip()
    if mode not in {"auto", "api", "fixed"}:
        mode = "auto"

    now = datetime.now(timezone.utc)
    cached = load_cached_fx_rate(settings.data_dir)

    if mode == "fixed":
        save_cached_fx_rate(
            settings.data_dir,
            gbp_per_usd=settings.gbp_per_usd,
            fetched_at_utc_iso=now.isoformat(),
            source="fixed",
        )
        return {"gbp_per_usd": settings.gbp_per_usd, "display_currency": "GBP", "fx_source": "fixed"}

    # In auto/api modes, only API-backed rates enable GBP display.
    if cached:
        try:
            cached_rate = float(cached["gbp_per_usd"])
            cached_source = str(cached.get("source", ""))
            fetched_at = datetime.fromisoformat(cached["fetched_at_utc"]).astimezone(timezone.utc)
            fresh_until = fetched_at + timedelta(hours=settings.fx_cache_ttl_hours)
            if now <= fresh_until and _is_api_source(cached_source):
                return {
                    "gbp_per_usd": cached_rate,
                    "display_currency": "GBP",
                    "fx_source": cached_source,
                }
        except (ValueError, KeyError, TypeError):
            pass

    try:
        rate, fetched_at = fetch_gbp_per_usd(settings.fx_api_url)
        save_cached_fx_rate(
            settings.data_dir,
            gbp_per_usd=rate,
            fetched_at_utc_iso=fetched_at.isoformat(),
            source=settings.fx_api_url,
        )
        return {"gbp_per_usd": rate, "display_currency": "GBP", "fx_source": settings.fx_api_url}
    except (urllib.error.URLError, urllib.error.HTTPError,
            json.JSONDecodeError, ValueError, KeyError) as exc:
        logging.warning("FX fetch failed (%s), using fallback rate", exc)
        # If API unavailable, switch dashboard to USD units for easier validation.
        if cached:
            try:
                cached_rate = float(cached["gbp_per_usd"])
                cached_source = str(cached.get("source", ""))
                if _is_api_source(cached_source):
                    return {
                        "gbp_per_usd": cached_rate,
                        "display_currency": "GBP",
                        "fx_source": f"{cached_source} (stale-cache)",
                    }
            except (ValueError, KeyError, TypeError):
                pass

        save_cached_fx_rate(
            settings.data_dir,
            gbp_per_usd=settings.gbp_per_usd,
            fetched_at_utc_iso=now.isoformat(),
            source="fixed_fallback",
        )
        return {
            "gbp_per_usd": settings.gbp_per_usd,
            "display_currency": "USD",
            "fx_source": "fixed_fallback",
        }


def resolve_gbp_per_usd(settings: Settings) -> float:
    return float(resolve_fx_context(settings)["gbp_per_usd"])

