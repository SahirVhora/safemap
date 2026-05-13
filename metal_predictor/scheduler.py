from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from .config import Settings
from .pipeline import run_hourly_refresh

logger = logging.getLogger(__name__)

UK_TZ = ZoneInfo("Europe/London")

# Backoff configuration: on failure, retry after BACKOFF_SECONDS, up to MAX_BACKOFF_SECONDS.
_INITIAL_BACKOFF = 60
_MAX_BACKOFF = 900  # 15 minutes


def run_scheduler(settings: Settings, poll_seconds: int = 30, run_on_start: bool = True) -> None:
    last_hour_key = None
    consecutive_failures = 0

    if run_on_start:
        try:
            logger.info(run_hourly_refresh(settings))
            consecutive_failures = 0
        except Exception:
            consecutive_failures += 1
            logger.exception(
                "[scheduler] Startup refresh failed (will retry next hour)"
            )

    while True:
        now_uk = datetime.now(timezone.utc).astimezone(UK_TZ)
        hour_key = now_uk.strftime("%Y-%m-%d-%H")

        if last_hour_key != hour_key:
            last_hour_key = hour_key
            try:
                result = run_hourly_refresh(settings, now_utc=now_uk.astimezone(timezone.utc))
                logger.info(result)
                consecutive_failures = 0
            except Exception:
                consecutive_failures += 1
                backoff = min(_INITIAL_BACKOFF * (2 ** (consecutive_failures - 1)), _MAX_BACKOFF)
                logger.exception(
                    "[scheduler] Hourly refresh failed (attempt %d), backing off %ds",
                    consecutive_failures, backoff
                )
                time.sleep(backoff)
                continue  # retry without advancing hour_key so we retry the same hour

        time.sleep(poll_seconds)
