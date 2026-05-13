from __future__ import annotations

import csv
import json
import os
import sqlite3
import tempfile
from collections.abc import Iterable
from datetime import date, datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from .types import ForecastPoint, Observation

UK_TZ = ZoneInfo("Europe/London")


def _parse_utc(ts: str) -> datetime:
    return datetime.fromisoformat(ts).astimezone(timezone.utc)


def _db_path(data_dir: Path) -> Path:
    return data_dir / "metal_predictor.db"


def _get_conn(data_dir: Path) -> sqlite3.Connection:
    data_dir.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(_db_path(data_dir))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.row_factory = sqlite3.Row
    _init_schema(conn)
    return conn


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS observations (
            metal TEXT NOT NULL,
            ts_utc TEXT NOT NULL,
            price REAL NOT NULL,
            PRIMARY KEY (metal, ts_utc)
        );

        CREATE TABLE IF NOT EXISTS forecasts (
            generated_at_utc TEXT NOT NULL,
            target_ts_utc TEXT NOT NULL,
            metal TEXT NOT NULL,
            predicted_price REAL NOT NULL,
            predicted_direction TEXT NOT NULL DEFAULT 'flat',
            predicted_lower_price REAL,
            predicted_upper_price REAL,
            PRIMARY KEY (generated_at_utc, target_ts_utc, metal)
        );

        CREATE INDEX IF NOT EXISTS idx_forecasts_target_metal
            ON forecasts(target_ts_utc, metal);

        CREATE TABLE IF NOT EXISTS evaluation_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_uk TEXT NOT NULL,
            metal TEXT NOT NULL,
            mae REAL NOT NULL,
            mape REAL NOT NULL,
            directional_accuracy REAL NOT NULL,
            created_at_utc TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS model_params (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_uk TEXT NOT NULL,
            metal TEXT NOT NULL,
            alpha REAL NOT NULL,
            beta REAL NOT NULL,
            gamma REAL NOT NULL,
            created_at_utc TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# CSV legacy paths (kept for backward-compat / export)
# ---------------------------------------------------------------------------

def _obs_path(data_dir: Path, metal: str) -> Path:
    return data_dir / f"{metal}_observations.csv"


def _forecast_path(data_dir: Path) -> Path:
    return data_dir / "forecasts.csv"


def _metrics_path(data_dir: Path) -> Path:
    return data_dir / "evaluation_metrics.csv"


def _params_path(data_dir: Path) -> Path:
    return data_dir / "model_params.csv"


def _dashboard_path(data_dir: Path) -> Path:
    return data_dir / "dashboard.json"


def _fx_rate_path(data_dir: Path) -> Path:
    return data_dir / "fx_rate.json"


# ---------------------------------------------------------------------------
# Observations  (SQLite primary, CSV fallback on first run)
# ---------------------------------------------------------------------------

def _migrate_csv_observations(data_dir: Path, metal: str, conn: sqlite3.Connection) -> int:
    """Import existing CSV observations into SQLite on first run.  Idempotent."""
    path = _obs_path(data_dir, metal)
    if not path.exists():
        return 0
    inserted = 0
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                cursor = conn.execute(
                    "INSERT OR IGNORE INTO observations(metal, ts_utc, price) VALUES (?,?,?)",
                    (metal, row["ts_utc"], float(row["price"])),
                )
                inserted += cursor.rowcount
            except (ValueError, KeyError, sqlite3.Error):
                pass
    conn.commit()
    return inserted


def load_observations(data_dir: Path, metal: str) -> list[Observation]:
    with _get_conn(data_dir) as conn:
        # Auto-migrate CSV on first access.
        if conn.execute("SELECT COUNT(*) FROM observations WHERE metal=?", (metal,)).fetchone()[0] == 0:
            _migrate_csv_observations(data_dir, metal, conn)
        rows = conn.execute(
            "SELECT ts_utc, price FROM observations WHERE metal=? ORDER BY ts_utc",
            (metal,),
        ).fetchall()
    return [Observation(ts_utc=_parse_utc(r["ts_utc"]), price=r["price"]) for r in rows]


def upsert_observations(data_dir: Path, metal: str, observations: Iterable[Observation]) -> int:
    obs_list = list(observations)
    if not obs_list:
        return 0
    with _get_conn(data_dir) as conn:
        # Auto-migrate CSV on first write.
        if conn.execute("SELECT COUNT(*) FROM observations WHERE metal=?", (metal,)).fetchone()[0] == 0:
            _migrate_csv_observations(data_dir, metal, conn)
        inserted = 0
        for obs in obs_list:
            cursor = conn.execute(
                "INSERT OR REPLACE INTO observations(metal, ts_utc, price) VALUES (?,?,?)",
                (metal, obs.ts_utc.isoformat(), obs.price),
            )
            inserted += cursor.rowcount
        conn.commit()
    return inserted


# ---------------------------------------------------------------------------
# Forecasts
# ---------------------------------------------------------------------------

def append_forecasts(data_dir: Path, points: Iterable[ForecastPoint]) -> None:
    pts = list(points)
    if not pts:
        return
    with _get_conn(data_dir) as conn:
        conn.executemany(
            """INSERT OR REPLACE INTO forecasts
               (generated_at_utc, target_ts_utc, metal, predicted_price,
                predicted_direction, predicted_lower_price, predicted_upper_price)
               VALUES (?,?,?,?,?,?,?)""",
            [
                (
                    p.generated_at_utc.isoformat(),
                    p.target_ts_utc.isoformat(),
                    p.metal,
                    p.predicted_price,
                    p.predicted_direction,
                    p.predicted_lower_price,
                    p.predicted_upper_price,
                )
                for p in pts
            ],
        )
        conn.commit()

    # Keep CSV mirror for spreadsheet / backup access.
    _append_forecasts_csv(data_dir, pts)


def _append_forecasts_csv(data_dir: Path, new_points: list[ForecastPoint]) -> None:
    path = _forecast_path(data_dir)
    canonical_headers = [
        "generated_at_utc", "target_ts_utc", "metal",
        "predicted_price", "predicted_direction",
        "predicted_lower_price", "predicted_upper_price",
    ]
    rows_by_key: dict[tuple, dict] = {}
    if path.exists():
        with path.open(newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                key = (row.get("generated_at_utc",""), row.get("target_ts_utc",""), row.get("metal",""))
                rows_by_key[key] = {h: row.get(h, "") for h in canonical_headers}
    for p in new_points:
        key = (p.generated_at_utc.isoformat(), p.target_ts_utc.isoformat(), p.metal)
        rows_by_key[key] = {
            "generated_at_utc": p.generated_at_utc.isoformat(),
            "target_ts_utc": p.target_ts_utc.isoformat(),
            "metal": p.metal,
            "predicted_price": p.predicted_price,
            "predicted_direction": p.predicted_direction,
            "predicted_lower_price": "" if p.predicted_lower_price is None else p.predicted_lower_price,
            "predicted_upper_price": "" if p.predicted_upper_price is None else p.predicted_upper_price,
        }
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=canonical_headers)
        writer.writeheader()
        for key in sorted(rows_by_key.keys()):
            writer.writerow(rows_by_key[key])


def _row_to_fp(row: sqlite3.Row) -> ForecastPoint:
    return ForecastPoint(
        generated_at_utc=_parse_utc(row["generated_at_utc"]),
        target_ts_utc=_parse_utc(row["target_ts_utc"]),
        metal=row["metal"],
        predicted_price=row["predicted_price"],
        predicted_direction=row["predicted_direction"],
        predicted_lower_price=row["predicted_lower_price"],
        predicted_upper_price=row["predicted_upper_price"],
    )


def load_forecasts_by_generation(data_dir: Path, generated_at_utc: datetime) -> list[ForecastPoint]:
    with _get_conn(data_dir) as conn:
        rows = conn.execute(
            "SELECT * FROM forecasts WHERE generated_at_utc=? ORDER BY metal, target_ts_utc",
            (generated_at_utc.isoformat(),),
        ).fetchall()
    return [_row_to_fp(r) for r in rows]


def load_latest_forecasts_for_uk_date(
    data_dir: Path, target_date_uk: date
) -> tuple[datetime | None, list[ForecastPoint]]:
    # Convert the UK date to a UTC window (conservative: ±1 day to handle DST).
    with _get_conn(data_dir) as conn:
        rows = conn.execute(
            "SELECT * FROM forecasts ORDER BY generated_at_utc DESC",
        ).fetchall()

    # Filter by target UK date.
    all_rows = [_row_to_fp(r) for r in rows if r["target_ts_utc"]]
    filtered = [r for r in all_rows if r.target_ts_utc.astimezone(UK_TZ).date() == target_date_uk]
    if not filtered:
        return None, []

    latest_generation = max(r.generated_at_utc for r in filtered)
    result = [r for r in filtered if r.generated_at_utc == latest_generation]
    result.sort(key=lambda x: (x.metal, x.target_ts_utc))
    return latest_generation, result


# ---------------------------------------------------------------------------
# Evaluation metrics
# ---------------------------------------------------------------------------

def append_metric_row(
    data_dir: Path,
    date_uk: str,
    metal: str,
    mae: float,
    mape: float,
    directional_accuracy: float,
) -> None:
    with _get_conn(data_dir) as conn:
        conn.execute(
            """INSERT INTO evaluation_metrics(date_uk, metal, mae, mape, directional_accuracy)
               VALUES (?,?,?,?,?)""",
            (date_uk, metal, mae, mape, directional_accuracy),
        )
        conn.commit()
    # CSV mirror.
    path = _metrics_path(data_dir)
    exists = path.exists()
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(["date_uk", "metal", "mae", "mape", "directional_accuracy"])
        writer.writerow([date_uk, metal, mae, mape, directional_accuracy])


def save_model_params(
    data_dir: Path, date_uk: str, metal: str,
    alpha: float, beta: float, gamma: float,
) -> None:
    with _get_conn(data_dir) as conn:
        conn.execute(
            "INSERT INTO model_params(date_uk, metal, alpha, beta, gamma) VALUES (?,?,?,?,?)",
            (date_uk, metal, alpha, beta, gamma),
        )
        conn.commit()
    # CSV mirror.
    path = _params_path(data_dir)
    exists = path.exists()
    with path.open("a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(["date_uk", "metal", "alpha", "beta", "gamma"])
        writer.writerow([date_uk, metal, alpha, beta, gamma])


def load_metric_rows_for_uk_date(data_dir: Path, date_uk: str) -> list[dict]:
    with _get_conn(data_dir) as conn:
        rows = conn.execute(
            "SELECT date_uk, metal, mae, mape, directional_accuracy FROM evaluation_metrics "
            "WHERE date_uk=? ORDER BY rowid DESC",
            (date_uk,),
        ).fetchall()
    # Keep latest per metal.
    seen: dict[str, dict] = {}
    for r in rows:
        if r["metal"] not in seen:
            seen[r["metal"]] = {
                "date_uk": r["date_uk"],
                "metal": r["metal"],
                "mae": r["mae"],
                "mape": r["mape"],
                "directional_accuracy": r["directional_accuracy"],
            }
    return [seen[m] for m in sorted(seen.keys())]


# ---------------------------------------------------------------------------
# Dashboard / FX (JSON files — unchanged)
# ---------------------------------------------------------------------------

def save_dashboard_json(data_dir: Path, payload: dict) -> Path:
    path = _dashboard_path(data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_fd, tmp_path = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        os.replace(tmp_path, path)
    except Exception:
        os.unlink(tmp_path)
        raise
    return path


def load_cached_fx_rate(data_dir: Path) -> dict | None:
    path = _fx_rate_path(data_dir)
    if not path.exists():
        return None
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_cached_fx_rate(data_dir: Path, gbp_per_usd: float, fetched_at_utc_iso: str, source: str) -> Path:
    path = _fx_rate_path(data_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "gbp_per_usd": gbp_per_usd,
        "fetched_at_utc": fetched_at_utc_iso,
        "source": source,
    }
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return path


