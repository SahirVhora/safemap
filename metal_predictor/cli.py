from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from .config import Settings
from .dashboard import export_excel_report, write_dashboard_json
from .fx_service import resolve_fx_context
from .history_store import history_summary
from .pipeline import run_evening_evaluation, run_hourly_refresh, run_morning_forecast, update_market_data
from .reporter import send_email_report
from .scheduler import run_scheduler


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Gold/Silver hourly predictor")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("update-data", help="Fetch latest hourly market data")
    sub.add_parser("hourly-refresh", help="Run one hourly refresh (update, compare, dashboard)")
    sub.add_parser("morning", help="Run 8 AM UK forecast job now")
    sub.add_parser("evening", help="Run 8 PM UK evaluation job now")
    build_dashboard = sub.add_parser("build-dashboard", help="Build data/dashboard.json for local webpage")
    build_dashboard.add_argument("--date-uk", default=None, help="YYYY-MM-DD")
    export_excel = sub.add_parser("export-excel", help="Export Excel report (.xlsx) with charts")
    export_excel.add_argument("--date-uk", default=None, help="YYYY-MM-DD")
    export_excel.add_argument("--out", default=None, help="Output path (default: data/metal_report_<date>.xlsx)")
    hist = sub.add_parser("history-summary", help="Show recent prediction-vs-actual summary from DB")
    hist.add_argument("--days", type=int, default=30)
    test_email = sub.add_parser("send-test-email", help="Send test email via SMTP")
    test_email.add_argument("--to", dest="to_email", default=None, help="Recipient email")
    sched = sub.add_parser("scheduler", help="Run continuous hourly scheduler")
    sched.add_argument("--poll-seconds", type=int, default=30)
    sched.add_argument("--no-run-on-start", action="store_true", help="Wait until next full hour before first run")
    return p


def main() -> None:
    args = build_parser().parse_args()
    settings = Settings()
    settings.ensure_dirs()

    if args.cmd == "update-data":
        inserted = update_market_data(settings)
        print(f"Data update complete: {inserted}")
    elif args.cmd == "hourly-refresh":
        print(run_hourly_refresh(settings))
    elif args.cmd == "morning":
        run_morning_forecast(settings)
    elif args.cmd == "evening":
        run_evening_evaluation(settings)
    elif args.cmd == "build-dashboard":
        date_uk = date.fromisoformat(args.date_uk) if args.date_uk else None
        fx = resolve_fx_context(settings)
        out = write_dashboard_json(
            settings.data_dir,
            date_uk=date_uk,
            gbp_per_usd=float(fx["gbp_per_usd"]),
            display_currency=str(fx["display_currency"]),
        )
        print(f"Wrote dashboard JSON: {out}")
    elif args.cmd == "export-excel":
        date_uk = date.fromisoformat(args.date_uk) if args.date_uk else None
        if args.out:
            out_path = Path(args.out)
        else:
            date_label = args.date_uk or date.today().isoformat()
            out_path = settings.data_dir / f"metal_report_{date_label}.xlsx"
        try:
            fx = resolve_fx_context(settings)
            out = export_excel_report(
                settings.data_dir,
                out_path=out_path,
                date_uk=date_uk,
                gbp_per_usd=float(fx["gbp_per_usd"]),
                display_currency=str(fx["display_currency"]),
            )
        except RuntimeError as exc:
            print(str(exc))
            return
        print(f"Wrote Excel report: {out}")
    elif args.cmd == "history-summary":
        rows = history_summary(settings.data_dir, days=args.days)
        if not rows:
            print("No history rows yet. Run evening job to store comparisons.")
            return
        print(f"History summary (last {args.days} days):")
        for r in rows:
            print(
                f"- {r['metal']}: points={r['points']}, avg_abs_error={r['avg_abs_error']:.4f}, "
                f"avg_pct_error={r['avg_pct_error']:.2f}%, directional_hit_rate={r['directional_hit_rate']:.1%}"
            )
    elif args.cmd == "send-test-email":
        to_email = args.to_email or settings.email_to
        from_email = settings.email_from or settings.smtp_user
        missing = [
            name
            for name, value in [
                ("SMTP_HOST", settings.smtp_host),
                ("SMTP_USER", settings.smtp_user),
                ("SMTP_PASS", settings.smtp_pass),
                ("EMAIL_FROM/SMTP_USER", from_email),
                ("recipient --to or EMAIL_TO", to_email),
            ]
            if not value
        ]
        if missing:
            raise ValueError(f"Missing configuration: {', '.join(missing)}")

        send_email_report(
            subject="Metal Predictor Test Email",
            body="Test email from Metal Predictor. If you received this, SMTP is configured correctly.",
            smtp_host=settings.smtp_host,  # type: ignore[arg-type]
            smtp_port=settings.smtp_port,
            smtp_user=settings.smtp_user,  # type: ignore[arg-type]
            smtp_pass=settings.smtp_pass,  # type: ignore[arg-type]
            email_from=from_email,  # type: ignore[arg-type]
            email_to=to_email,  # type: ignore[arg-type]
        )
        print(f"Test email sent to {to_email}")
    elif args.cmd == "scheduler":
        run_scheduler(settings, poll_seconds=args.poll_seconds, run_on_start=not args.no_run_on_start)
    else:
        raise ValueError(f"Unknown command: {args.cmd}")


if __name__ == "__main__":
    main()
