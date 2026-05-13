from __future__ import annotations

from dataclasses import dataclass, astuple
from math import copysign


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def direction(now_price: float, next_price: float, epsilon_ratio: float = 0.0004) -> str:
    delta = next_price - now_price
    eps = abs(now_price) * epsilon_ratio
    if abs(delta) <= eps:
        return "flat"
    return "up" if delta > 0 else "down"


# ---------------------------------------------------------------------------
# RSI (Relative Strength Index)
# ---------------------------------------------------------------------------

def compute_rsi(prices: list[float], period: int = 14) -> float | None:
    """Return RSI (0-100) for the tail of *prices*, or None if insufficient data."""
    if len(prices) < period + 1:
        return None
    gains, losses = [], []
    for i in range(len(prices) - period, len(prices)):
        delta = prices[i] - prices[i - 1]
        if delta > 0:
            gains.append(delta)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(delta))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def rsi_bias(rsi: float | None) -> float:
    """Return a small multiplicative bias in range [-0.002, +0.002] based on RSI.

    RSI > 70 => overbought => slight negative bias
    RSI < 30 => oversold  => slight positive bias
    """
    if rsi is None:
        return 0.0
    if rsi >= 70:
        return -0.002 * (rsi - 70) / 30.0
    if rsi <= 30:
        return 0.002 * (30 - rsi) / 30.0
    return 0.0


# ---------------------------------------------------------------------------
# Hour-of-day / day-of-week seasonal adjustments
# ---------------------------------------------------------------------------

# Observed gold/silver intraday patterns (UK time):
#   - London open 08:00–10:00 slightly bullish
#   - US open 14:30–16:30 higher volatility / slight bullish
#   - Overnight 22:00–06:00 mean-reverting, lower liquidity

_HOUR_BIAS: dict[int, float] = {
    8: 0.0003, 9: 0.0004, 10: 0.0002,      # London open
    14: 0.0003, 15: 0.0004, 16: 0.0002,    # NY open
    22: -0.0001, 23: -0.0001,               # light overnight drift
}

# Monday = 0, Friday = 4
_DOW_BIAS: dict[int, float] = {
    0: 0.0002,   # Monday gap-up tendency
    4: -0.0002,  # Friday profit-taking
}


def hour_of_day_bias(hour: int) -> float:
    return _HOUR_BIAS.get(hour, 0.0)


def day_of_week_bias(weekday: int) -> float:
    return _DOW_BIAS.get(weekday, 0.0)


@dataclass(frozen=True)
class ModelParams:
    alpha: float = 0.6
    beta: float = 0.25
    gamma: float = 0.10


@dataclass(frozen=True)
class TuneDiagnostics:
    selected_window_hours: int
    selected_mae: float
    candidate_count: int


def moving_average(values: list[float], n: int) -> float:
    if not values:
        return 0.0
    n = max(1, min(n, len(values)))
    return sum(values[-n:]) / n


def forecast_series(
    history: list[float],
    horizon: int,
    params: ModelParams,
    start_hour: int | None = None,
    start_weekday: int | None = None,
) -> list[float]:
    """Generate *horizon* price forecasts.

    Optional *start_hour* (0-23 UK) and *start_weekday* (0=Mon, 6=Sun) enable
    hour-of-day and day-of-week seasonal adjustments.  RSI is computed from
    the history tail automatically.
    """
    if not history:
        return []
    if len(history) == 1:
        return [history[0]] * horizon

    last = history[-1]
    ma_fast = moving_average(history, 3)
    ma_slow = moving_average(history, 12)
    raw_trend = history[-1] - history[-2]
    trend = params.alpha * raw_trend + (1 - params.alpha) * (ma_fast - ma_slow)
    vol = moving_average([abs(history[i] - history[i - 1]) for i in range(1, len(history))], 8)

    rsi = compute_rsi(history)
    _rsi_b = rsi_bias(rsi)
    dow_b = day_of_week_bias(start_weekday) if start_weekday is not None else 0.0

    preds: list[float] = []
    current = last
    for h in range(1, horizon + 1):
        # Step-wise trend decay with light mean-reversion toward slow average.
        decayed_trend = trend * (1 - params.beta) ** (h - 1)
        mean_reversion = params.gamma * (ma_slow - current)
        noise_guard = copysign(min(abs(decayed_trend), vol * 1.5), decayed_trend)
        step = noise_guard + mean_reversion
        # Apply seasonal and RSI micro-biases (proportion of current price).
        target_hour = ((start_hour or 0) + h - 1) % 24 if start_hour is not None else None
        hour_b = hour_of_day_bias(target_hour) if target_hour is not None else 0.0
        seasonal_adj = (_rsi_b + hour_b + dow_b) * current
        current = _clamp(current + step + seasonal_adj, low=0.01, high=1_000_000.0)
        preds.append(current)
    return preds


def _one_step_abs_errors(history: list[float], params: ModelParams, window: int) -> list[float]:
    if len(history) < 3:
        return []
    window = max(1, min(window, len(history) - 2))
    start = len(history) - window - 1
    errors: list[float] = []
    for i in range(start, len(history) - 1):
        prefix = history[: i + 1]
        pred = forecast_series(prefix, horizon=1, params=params)[0]
        actual = history[i + 1]
        errors.append(abs(actual - pred))
    return errors


def _stddev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    var = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return var ** 0.5


def estimate_error_std(history: list[float], params: ModelParams, lookback_hours: int) -> float:
    if len(history) < 3:
        return 0.0
    window = max(2, min(lookback_hours, len(history) - 2))
    start = len(history) - window - 1
    signed_errors: list[float] = []
    for i in range(start, len(history) - 1):
        prefix = history[: i + 1]
        pred = forecast_series(prefix, horizon=1, params=params)[0]
        actual = history[i + 1]
        signed_errors.append(actual - pred)
    return _stddev(signed_errors)


def estimate_mape(history: list[float], params: ModelParams, lookback_hours: int) -> float:
    """Compute mean absolute percentage error over the last *lookback_hours* one-step forecasts."""
    if len(history) < 3:
        return 0.0
    window = max(2, min(lookback_hours, len(history) - 2))
    start = len(history) - window - 1
    pct_errors: list[float] = []
    for i in range(start, len(history) - 1):
        prefix = history[: i + 1]
        pred = forecast_series(prefix, horizon=1, params=params)[0]
        actual = history[i + 1]
        if actual:
            pct_errors.append(abs((actual - pred) / actual))
    return (sum(pct_errors) / len(pct_errors)) if pct_errors else 0.0


def confidence_bands(
    predictions: list[float],
    error_std: float,
    z_score: float = 1.28,
    mape: float | None = None,
) -> list[tuple[float, float]]:
    """Return (low, high) bands for each prediction horizon.

    If *mape* is supplied the band width grows linearly with horizon
    (proportional to the expected percentage error), which is more
    realistic for financial time-series than the sqrt(h) random-walk
    assumption.  Falls back to sqrt(h) * error_std when mape is None.
    """
    if not predictions:
        return []
    if error_std <= 0 and not mape:
        return [(p, p) for p in predictions]
    bands: list[tuple[float, float]] = []
    for i, pred in enumerate(predictions, start=1):
        if mape is not None and mape > 0:
            # Linear horizon growth capped to avoid absurd outer bands.
            horizon_factor = 1.0 + (i - 1) * 0.4  # +40 % width per hour
            spread = z_score * mape * pred * horizon_factor
        else:
            spread = z_score * error_std * (i ** 0.5)
        low = _clamp(pred - spread, low=0.01, high=1_000_000.0)
        high = _clamp(pred + spread, low=0.01, high=1_000_000.0)
        bands.append((low, high))
    return bands


def tune_params_multi_window(
    history: list[float],
    windows: tuple[int, ...] = (24 * 30, 24 * 60, 24 * 90),
) -> tuple[ModelParams, TuneDiagnostics]:
    if len(history) < 80:
        fallback_window = max(1, min(len(history) - 2, 24 * 14))
        fallback_params = ModelParams()
        errs = _one_step_abs_errors(history, fallback_params, fallback_window)
        fallback_mae = (sum(errs) / len(errs)) if errs else 0.0
        return fallback_params, TuneDiagnostics(
            selected_window_hours=fallback_window,
            selected_mae=fallback_mae,
            candidate_count=1,
        )

    candidates = [
        ModelParams(alpha=a, beta=b, gamma=g)
        for a in (0.40, 0.55, 0.70, 0.85)
        for b in (0.10, 0.20, 0.30, 0.40)
        for g in (0.03, 0.08, 0.14, 0.20)
    ]

    best = candidates[0]
    best_score = float("inf")
    best_window = 0
    best_mae = 0.0
    valid_windows = [w for w in windows if len(history) >= max(40, w // 2)]
    if not valid_windows:
        valid_windows = [min(len(history) - 2, 24 * 14)]

    _cache: dict[tuple, list[float]] = {}  # (params_tuple, window) -> abs errors

    for p in candidates:
        total_score = 0.0
        used = 0
        for w in valid_windows:
            key = (astuple(p), w)
            if key not in _cache:
                _cache[key] = _one_step_abs_errors(history, p, w)
            errs = _cache[key]
            if not errs:
                continue
            mae = sum(errs) / len(errs)
            total_score += mae
            used += 1
        if used == 0:
            continue
        score = total_score / used
        if score < best_score:
            best_score = score
            best = p
            # Diagnostics based on most recent window.
            recent_window = min(valid_windows)
            recent_key = (astuple(p), recent_window)
            if recent_key not in _cache:
                _cache[recent_key] = _one_step_abs_errors(history, p, recent_window)
            recent_errs = _cache[recent_key]
            best_window = recent_window
            best_mae = (sum(recent_errs) / len(recent_errs)) if recent_errs else 0.0

    return best, TuneDiagnostics(
        selected_window_hours=best_window,
        selected_mae=best_mae,
        candidate_count=len(candidates),
    )


def tune_params(history: list[float], train_window: int = 24 * 14) -> ModelParams:
    if len(history) < max(80, train_window):
        return ModelParams()

    candidates = [
        ModelParams(alpha=a, beta=b, gamma=g)
        for a in (0.45, 0.6, 0.75)
        for b in (0.15, 0.25, 0.35)
        for g in (0.05, 0.10, 0.18)
    ]

    start = len(history) - train_window
    best = candidates[0]
    best_mae = float("inf")

    for p in candidates:
        abs_errors = []
        for i in range(start, len(history) - 1):
            prefix = history[: i + 1]
            pred = forecast_series(prefix, horizon=1, params=p)[0]
            actual = history[i + 1]
            abs_errors.append(abs(actual - pred))

        mae = sum(abs_errors) / len(abs_errors)
        if mae < best_mae:
            best_mae = mae
            best = p

    return best
