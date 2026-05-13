from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
import fcntl
import json
import logging
from pathlib import Path
import urllib.error
from zoneinfo import ZoneInfo


from .config import Settings
from .dashboard import write_dashboard_json
from .fx_service import resolve_fx_context
from .gold_api_client import fetch_spot_observation
from .history_store import recent_error_snapshot, store_hourly_comparisons
from .model import (
    confidence_bands,
    direction,
    estimate_error_std,
    estimate_mape,
    forecast_series,
    tune_params_multi_window,
)
from .reporter import build_html_report, emit_report
from .storage import append_forecasts, append_metric_row, load_latest_forecasts_for_uk_date, load_observations, save_model_params, upsert_observations
from .types import ForecastPoint
from .yahoo_client import METAL_SYMBOLS, fetch_hourly_observations

UK_TZ = ZoneInfo("Europe/London")


def _email_settings(settings: Settings) -> dict:
    return {
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "smtp_user": settings.smtp_user,
        "smtp_pass": settings.smtp_pass,
        "email_from": settings.email_from or settings.smtp_user,
        "email_to": settings.email_to,
    }


def _hour_start(dt: datetime) -> datetime:
    return dt.replace(minute=0, second=0, microsecond=0)


def _drift_state_path(data_dir: Path) -> Path:
    return data_dir / "drift_state.json"


def _drift_lock_path(data_dir: Path) -> Path:
    return Path(data_dir) / "drift_state.lock"


def _load_drift_state(data_dir: Path) -> dict:
    path = _drift_state_path(data_dir)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_drift_state(data_dir: Path, state: dict) -> None:
    path = _drift_state_path(data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def update_market_data(settings: Settings) -> dict[str, int]:
    provider = settings.market_data_provider.lower().strip()
    if provider not in {"auto", "yahoo", "gold_api"}:
        provider = "auto"

    inserted = {}
    for metal in METAL_SYMBOLS:
        rows = []
        if provider in {"auto", "yahoo"}:
            try:
                rows = fetch_hourly_observations(metal)
            except (urllib.error.URLError, urllib.error.HTTPError,
                    json.JSONDecodeError, KeyError, IndexError, ValueError) as exc:
                logging.warning("Failed to fetch %s data: %s", metal, exc)
                rows = []

        if not rows and provider in {"auto", "gold_api"}:
            try:
                rows = fetch_spot_observation(metal, settings.gold_api_base_url)
            except (urllib.error.URLError, urllib.error.HTTPError,
                    json.JSONDecodeError, KeyError, ValueError) as exc:
                logging.warning("Failed to fetch %s data: %s", metal, exc)
                rows = []

        inserted[metal] = upsert_observations(settings.data_dir, metal, rows) if rows else 0
    return inserted


def run_morning_forecast(
    settings: Settings, now_utc: datetime | None = None, notify: bool = True
) -> str:
    settings.ensure_dirs()
    now_utc = now_utc or datetime.now(timezone.utc)
    now_uk = now_utc.astimezone(UK_TZ)
    fx = resolve_fx_context(settings)

    update_market_data(settings)

    start_uk = _hour_start(now_uk)
    end_uk = datetime(now_uk.year, now_uk.month, now_uk.day, 23, 0, tzinfo=UK_TZ)
    if start_uk > end_uk:
        return "No forecast generated. Local UK date has already ended."
    horizon = int((end_uk - start_uk).total_seconds() / 3600) + 1

    all_points: list[ForecastPoint] = []
    lines = [f"Morning forecast ({start_uk.date().isoformat()} UK)"]
    html_sections: list[dict] = []

    for metal in METAL_SYMBOLS:
        obs = load_observations(settings.data_dir, metal)
        prices = [o.price for o in obs][-settings.tune_lookback_hours :]
        if len(prices) < 1:
            lines.append(f"- {metal}: not enough data yet ({len(prices)} points)")
            continue

        import math

        if any(math.isnan(p) or math.isinf(p) for p in prices):
            raise ValueError(
                f"Input data for {metal} contains NaN or inf values — clean data before forecasting"
            )

        display_currency = str(fx["display_currency"])
        if display_currency == "GBP":
            unit = "GBP/g" if metal == "gold" else "GBP/kg"
        elif display_currency == "USD":
            unit = "USD/oz"
        else:
            unit = display_currency + "/oz"
        params, diag = tune_params_multi_window(prices)
        error_std = estimate_error_std(
            prices, params=params, lookback_hours=settings.confidence_lookback_hours
        )
        mape = estimate_mape(
            prices, params=params, lookback_hours=settings.confidence_lookback_hours
        )
        save_model_params(
            settings.data_dir,
            date_uk=start_uk.date().isoformat(),
            metal=metal,
            alpha=params.alpha,
            beta=params.beta,
            gamma=params.gamma,
        )
        preds = forecast_series(
            prices, horizon=horizon, params=params,
            start_hour=start_uk.hour, start_weekday=start_uk.weekday(),
        )
        bands = confidence_bands(preds, error_std=error_std, z_score=settings.confidence_z, mape=mape)
        last = prices[-1]
        generated_at_utc = start_uk.astimezone(timezone.utc)

        html_rows: list[dict] = []
        for i, pred in enumerate(preds):
            target_uk = start_uk + timedelta(hours=i)
            band_low, band_high = bands[i] if i < len(bands) else (pred, pred)
            dir_ = direction(last if i == 0 else preds[i - 1], pred)
            all_points.append(
                ForecastPoint(
                    generated_at_utc=generated_at_utc,
                    target_ts_utc=target_uk.astimezone(timezone.utc),
                    metal=metal,
                    predicted_price=pred,
                    predicted_direction=dir_,
                    predicted_lower_price=band_low,
                    predicted_upper_price=band_high,
                )
            )
            html_rows.append({
                "hour_uk": target_uk.strftime("%H:%M"),
                "predicted": pred,
                "lower": band_low,
                "upper": band_high,
                "direction": dir_,
                "actual": None,
                "actual_direction": None,
                "direction_hit": None,
            })

        html_sections.append({"metal": metal, "unit": unit, "rows": html_rows})
        first = preds[0]
        last_pred = preds[-1]
        lines.append(
            f"- {metal}: {horizon} hourly points | first={first:.2f}, last={last_pred:.2f}, "
            f"day_direction={direction(first, last_pred)}, conf80%_std={error_std:.3f}, "
            f"tune_window={diag.selected_window_hours}h"
        )

    if all_points:
        append_forecasts(settings.data_dir, all_points)
    write_dashboard_json(
        settings.data_dir,
        start_uk.date(),
        gbp_per_usd=float(fx["gbp_per_usd"]),
        display_currency=str(fx["display_currency"]),
    )
    lines.append("Note: this is a statistical forecast, not financial advice.")
    message = "\n".join(lines)
    if notify:
        html_body = build_html_report(
            subtitle=f"Morning forecast — {start_uk.date().isoformat()} UK",
            metal_sections=html_sections,
        )
        emit_report(
            message,
            settings.webhook_url,
            email_settings=_email_settings(settings),
            subject=f"Morning Forecast {start_uk.date().isoformat()} UK",
            html_body=html_body,
        )
    return message


def run_evening_evaluation(settings: Settings, now_utc: datetime | None = None) -> str:
    settings.ensure_dirs()
    now_utc = now_utc or datetime.now(timezone.utc)
    now_uk = now_utc.astimezone(UK_TZ)
    date_uk = now_uk.date()
    fx = resolve_fx_context(settings)

    update_market_data(settings)
    _, forecasts = load_latest_forecasts_for_uk_date(settings.data_dir, date_uk)
    if not forecasts:
        msg = f"No morning forecast found for {date_uk.isoformat()} UK. Run morning job first."
        emit_report(
            msg,
            settings.webhook_url,
            email_settings=_email_settings(settings),
            subject=f"Evening Evaluation {date_uk.isoformat()} UK",
        )
        return msg

    grouped: dict[str, list[ForecastPoint]] = defaultdict(list)
    for p in forecasts:
        grouped[p.metal].append(p)

    comparison_rows: list[dict] = []
    lines = [f"Evening evaluation ({date_uk.isoformat()} UK)"]
    html_sections: list[dict] = []
    for metal, points in grouped.items():
        obs_map = {o.ts_utc: o.price for o in load_observations(settings.data_dir, metal)}
        comparable = [p for p in points if p.target_ts_utc in obs_map]
        if not comparable:
            lines.append(f"- {metal}: no comparable actual points yet")
            continue

        display_currency = str(fx["display_currency"])
        if display_currency == "GBP":
            unit = "GBP/g" if metal == "gold" else "GBP/kg"
        elif display_currency == "USD":
            unit = "USD/oz"
        else:
            unit = display_currency + "/oz"
        abs_errors = []
        pct_errors = []
        dir_hits = 0
        prev_pred = None
        prev_actual = None
        html_rows: list[dict] = []
        for p in comparable:
            actual = obs_map[p.target_ts_utc]
            abs_error = abs(actual - p.predicted_price)
            pct_error = abs((actual - p.predicted_price) / actual) * 100 if actual else 0.0
            abs_errors.append(abs_error)
            pct_errors.append(pct_error)

            pred_dir = "flat"
            actual_dir = "flat"
            direction_hit = 0

            if prev_pred is not None and prev_actual is not None:
                pred_dir = direction(prev_pred, p.predicted_price)
                actual_dir = direction(prev_actual, actual)
                if pred_dir == actual_dir:
                    dir_hits += 1
                    direction_hit = 1
            elif p.predicted_direction == "flat":
                pred_dir = "flat"
                actual_dir = "flat"
                direction_hit = 1

            comparison_rows.append(
                {
                    "date_uk": date_uk.isoformat(),
                    "generated_at_utc": p.generated_at_utc.isoformat(),
                    "metal": metal,
                    "target_ts_utc": p.target_ts_utc.isoformat(),
                    "predicted_price": p.predicted_price,
                    "actual_price": actual,
                    "abs_error": abs_error,
                    "pct_error": pct_error,
                    "predicted_direction": pred_dir,
                    "actual_direction": actual_dir,
                    "direction_hit": direction_hit,
                    "created_at_utc": datetime.now(timezone.utc).isoformat(),
                }
            )
            target_uk_dt = p.target_ts_utc.astimezone(UK_TZ)
            html_rows.append({
                "hour_uk": target_uk_dt.strftime("%H:%M"),
                "predicted": p.predicted_price,
                "lower": p.predicted_lower_price,
                "upper": p.predicted_upper_price,
                "direction": pred_dir,
                "actual": actual,
                "actual_direction": actual_dir,
                "direction_hit": bool(direction_hit),
            })
            prev_pred = p.predicted_price
            prev_actual = actual

        html_sections.append({"metal": metal, "unit": unit, "rows": html_rows})

        mae = sum(abs_errors) / len(abs_errors)
        mape = sum(pct_errors) / len(pct_errors)
        direction_acc = dir_hits / max(1, len(comparable) - 1)

        append_metric_row(
            settings.data_dir,
            date_uk=date_uk.isoformat(),
            metal=metal,
            mae=mae,
            mape=mape,
            directional_accuracy=direction_acc,
        )

        suggestion = _improvement_suggestion(mae, mape, direction_acc)
        lines.append(
            f"- {metal}: points={len(comparable)}, MAE={mae:.3f}, MAPE={mape:.2f}%, directional_acc={direction_acc:.1%} | improve: {suggestion}"
        )

    lines.append("Refinement loop: retraining runs every morning from latest history.")
    saved = store_hourly_comparisons(settings.data_dir, comparison_rows)
    lines.append(f"History stored: {saved} new hourly comparison rows.")
    write_dashboard_json(
        settings.data_dir,
        date_uk,
        gbp_per_usd=float(fx["gbp_per_usd"]),
        display_currency=str(fx["display_currency"]),
    )
    message = "\n".join(lines)
    html_body = build_html_report(
        subtitle=f"Evening evaluation — {date_uk.isoformat()} UK (predicted vs actual)",
        metal_sections=html_sections,
    )
    emit_report(
        message,
        settings.webhook_url,
        email_settings=_email_settings(settings),
        subject=f"Evening Evaluation {date_uk.isoformat()} UK",
        html_body=html_body,
    )
    return message


def run_hourly_refresh(settings: Settings, now_utc: datetime | None = None) -> str:
    """Refresh market data hourly and append new prediction-vs-actual rows."""
    settings.ensure_dirs()
    now_utc = now_utc or datetime.now(timezone.utc)
    now_uk = now_utc.astimezone(UK_TZ)
    date_uk = now_uk.date()
    fx = resolve_fx_context(settings)

    inserted = update_market_data(settings)
    generation, forecasts = load_latest_forecasts_for_uk_date(settings.data_dir, date_uk)
    if not forecasts:
        run_morning_forecast(settings, now_utc=now_utc, notify=False)
        generation, forecasts = load_latest_forecasts_for_uk_date(settings.data_dir, date_uk)

    comparison_rows = _build_comparison_rows(
        settings=settings,
        date_uk=date_uk,
        forecasts=forecasts,
        max_target_ts_utc=_hour_start(now_utc),
    )
    stored = store_hourly_comparisons(settings.data_dir, comparison_rows)
    drift_note = ""
    if stored > 0:
        snapshots = recent_error_snapshot(
            settings.data_dir, lookback_points=settings.drift_lookback_points
        )
        drifted = [
            s
            for s in snapshots
            if s["points"] >= max(3, settings.drift_lookback_points // 2)
            and s["avg_pct_error"] >= settings.drift_mape_threshold
        ]
        if drifted:
            drift_note = " | drift_alert=" + ",".join(
                f"{s['metal']}:{s['avg_pct_error']:.2f}%/{s['points']}pts" for s in drifted
            )
            if settings.auto_retrain_on_drift:
                lock_path = _drift_lock_path(settings.data_dir)
                with open(lock_path, "w") as lf:
                    fcntl.flock(lf, fcntl.LOCK_EX)
                    try:
                        state = _load_drift_state(settings.data_dir)
                        last_retrain_iso = state.get("last_retrain_utc")
                        can_retrain = True
                        if last_retrain_iso:
                            try:
                                last_retrain = datetime.fromisoformat(last_retrain_iso).astimezone(
                                    timezone.utc
                                )
                                cooldown_cutoff = now_utc - timedelta(
                                    hours=settings.drift_retrain_cooldown_hours
                                )
                                can_retrain = last_retrain <= cooldown_cutoff
                            except (ValueError, TypeError):
                                can_retrain = True
                        if can_retrain:
                            run_morning_forecast(settings, now_utc=now_utc, notify=False)
                            _save_drift_state(
                                settings.data_dir,
                                {
                                    "last_retrain_utc": now_utc.isoformat(),
                                    "triggered_metals": [s["metal"] for s in drifted],
                                },
                            )
                            drift_note += " | auto_retrain=triggered"
                        else:
                            drift_note += " | auto_retrain=skipped(cooldown)"
                    finally:
                        fcntl.flock(lf, fcntl.LOCK_UN)
    write_dashboard_json(
        settings.data_dir,
        date_uk,
        gbp_per_usd=float(fx["gbp_per_usd"]),
        display_currency=str(fx["display_currency"]),
    )
    return (
        f"Hourly refresh {now_uk.strftime('%Y-%m-%d %H:%M')} UK | "
        f"inserted={inserted} | generation={generation.isoformat() if generation else 'none'} | "
        f"comparisons_appended={stored}{drift_note}"
    )


def _build_comparison_rows(
    settings: Settings,
    date_uk: date,
    forecasts: list[ForecastPoint],
    max_target_ts_utc: datetime | None = None,
) -> list[dict]:
    grouped: dict[str, list[ForecastPoint]] = defaultdict(list)
    for p in forecasts:
        if max_target_ts_utc is not None and p.target_ts_utc > max_target_ts_utc:
            continue
        grouped[p.metal].append(p)

    comparison_rows: list[dict] = []
    for metal, points in grouped.items():
        points = sorted(points, key=lambda p: p.target_ts_utc)
        obs_map = {o.ts_utc: o.price for o in load_observations(settings.data_dir, metal)}
        comparable = [p for p in points if p.target_ts_utc in obs_map]
        if not comparable:
            continue

        prev_pred = None
        prev_actual = None
        for p in comparable:
            actual = obs_map[p.target_ts_utc]
            abs_error = abs(actual - p.predicted_price)
            pct_error = abs((actual - p.predicted_price) / actual) * 100 if actual else 0.0

            pred_dir = "flat"
            actual_dir = "flat"
            direction_hit = 0
            if prev_pred is not None and prev_actual is not None:
                pred_dir = direction(prev_pred, p.predicted_price)
                actual_dir = direction(prev_actual, actual)
                direction_hit = int(pred_dir == actual_dir)
            elif p.predicted_direction == "flat":
                direction_hit = 1

            comparison_rows.append(
                {
                    "date_uk": date_uk.isoformat(),
                    "generated_at_utc": p.generated_at_utc.isoformat(),
                    "metal": metal,
                    "target_ts_utc": p.target_ts_utc.isoformat(),
                    "predicted_price": p.predicted_price,
                    "actual_price": actual,
                    "abs_error": abs_error,
                    "pct_error": pct_error,
                    "predicted_direction": pred_dir,
                    "actual_direction": actual_dir,
                    "direction_hit": direction_hit,
                    "created_at_utc": datetime.now(timezone.utc).isoformat(),
                }
            )
            prev_pred = p.predicted_price
            prev_actual = actual
    return comparison_rows


def _improvement_suggestion(mae: float, mape: float, direction_acc: float) -> str:
    MAE_STABLE_THRESHOLD = 5.0  # USD/oz for gold; adjust per metal if needed
    if direction_acc < 0.5:
        return "increase trend weight or add macro features (DXY, yields, CPI calendar)."
    if mape > 1.0:
        return "increase update frequency and add volatility regime features."
    if mae > MAE_STABLE_THRESHOLD:
        return "retrain"
    elif mape <= 1.0 and direction_acc >= 0.5:
        return "stable"
    else:
        return "monitor"
