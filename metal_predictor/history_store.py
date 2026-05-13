from __future__ import annotations

import csv
import sqlite3
from collections.abc import Iterable
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _csv_path(data_dir: Path) -> Path:
    return data_dir / "hourly_comparisons.csv"


def _db_path(data_dir: Path) -> Path:
    return data_dir / "forecast_history.db"


def _init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS hourly_comparisons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_uk TEXT NOT NULL,
            generated_at_utc TEXT NOT NULL,
            metal TEXT NOT NULL,
            target_ts_utc TEXT NOT NULL,
            predicted_price REAL NOT NULL,
            actual_price REAL NOT NULL,
            abs_error REAL NOT NULL,
            pct_error REAL NOT NULL,
            predicted_direction TEXT NOT NULL,
            actual_direction TEXT NOT NULL,
            direction_hit INTEGER NOT NULL,
            created_at_utc TEXT NOT NULL,
            UNIQUE(generated_at_utc, metal, target_ts_utc)
        )
        """
    )
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_hourly_comparisons_date_metal
        ON hourly_comparisons(date_uk, metal)
        """
    )
    conn.commit()


def store_hourly_comparisons(data_dir: Path, rows: Iterable[dict]) -> int:
    rows_list = list(rows)
    if not rows_list:
        return 0

    data_dir.mkdir(parents=True, exist_ok=True)

    db_file = _db_path(data_dir)
    inserted_rows: list[dict] = []
    with sqlite3.connect(db_file) as conn:
        _init_db(conn)
        inserted = 0
        for r in rows_list:
            cur = conn.execute(
                """
                INSERT OR IGNORE INTO hourly_comparisons(
                    date_uk, generated_at_utc, metal, target_ts_utc,
                    predicted_price, actual_price, abs_error, pct_error,
                    predicted_direction, actual_direction, direction_hit, created_at_utc
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    r["date_uk"],
                    r["generated_at_utc"],
                    r["metal"],
                    r["target_ts_utc"],
                    r["predicted_price"],
                    r["actual_price"],
                    r["abs_error"],
                    r["pct_error"],
                    r["predicted_direction"],
                    r["actual_direction"],
                    int(r["direction_hit"]),
                    r["created_at_utc"],
                ),
            )
            if cur.rowcount:
                inserted += 1
                inserted_rows.append(r)
        conn.commit()

    if inserted_rows:
        csv_file = _csv_path(data_dir)
        exists = csv_file.exists()
        with csv_file.open("a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not exists:
                writer.writerow(
                    [
                        "date_uk",
                        "generated_at_utc",
                        "metal",
                        "target_ts_utc",
                        "predicted_price",
                        "actual_price",
                        "abs_error",
                        "pct_error",
                        "predicted_direction",
                        "actual_direction",
                        "direction_hit",
                        "created_at_utc",
                    ]
                )
            for r in inserted_rows:
                writer.writerow(
                    [
                        r["date_uk"],
                        r["generated_at_utc"],
                        r["metal"],
                        r["target_ts_utc"],
                        r["predicted_price"],
                        r["actual_price"],
                        r["abs_error"],
                        r["pct_error"],
                        r["predicted_direction"],
                        r["actual_direction"],
                        r["direction_hit"],
                        r["created_at_utc"],
                    ]
                )
    return inserted


def history_summary(data_dir: Path, days: int = 30) -> list[dict]:
    db_file = _db_path(data_dir)
    if not db_file.exists():
        return []

    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    with sqlite3.connect(db_file) as conn:
        _init_db(conn)
        cur = conn.execute(
            """
            SELECT
                metal,
                COUNT(*) AS points,
                AVG(abs_error) AS avg_abs_error,
                AVG(pct_error) AS avg_pct_error,
                AVG(direction_hit) AS directional_hit_rate
            FROM hourly_comparisons
            WHERE date_uk >= ?
            GROUP BY metal
            ORDER BY metal
            """,
            (date_from,),
        )
        rows = cur.fetchall()

    return [
        {
            "metal": r[0],
            "points": int(r[1]),
            "avg_abs_error": float(r[2]) if r[2] is not None else 0.0,
            "avg_pct_error": float(r[3]) if r[3] is not None else 0.0,
            "directional_hit_rate": float(r[4]) if r[4] is not None else 0.0,
        }
        for r in rows
    ]


def recent_error_snapshot(data_dir: Path, lookback_points: int = 12) -> list[dict]:
    db_file = _db_path(data_dir)
    if not db_file.exists():
        return []

    with sqlite3.connect(db_file) as conn:
        _init_db(conn)
        cur = conn.execute("SELECT DISTINCT metal FROM hourly_comparisons ORDER BY metal")
        metals = [r[0] for r in cur.fetchall()]
        out: list[dict] = []
        for metal in metals:
            m_cur = conn.execute(
                """
                SELECT pct_error, direction_hit
                FROM hourly_comparisons
                WHERE metal = ?
                ORDER BY target_ts_utc DESC
                LIMIT ?
                """,
                (metal, lookback_points),
            )
            rows = m_cur.fetchall()
            if not rows:
                continue
            out.append(
                {
                    "metal": metal,
                    "points": len(rows),
                    "avg_pct_error": sum(float(r[0]) for r in rows) / len(rows),
                    "directional_hit_rate": sum(int(r[1]) for r in rows) / len(rows),
                }
            )
    return out
