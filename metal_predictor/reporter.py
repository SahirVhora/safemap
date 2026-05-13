from __future__ import annotations

import json
import logging
import smtplib
import urllib.error
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# HTML report builder
# ---------------------------------------------------------------------------

_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 20px; }}
  h2   {{ color: #1a5276; margin-bottom: 4px; }}
  p.subtitle {{ color: #555; margin-top: 0; }}
  table {{ border-collapse: collapse; width: 100%; margin-bottom: 24px; }}
  th   {{ background: #1a5276; color: #fff; padding: 7px 10px; text-align: left; font-size: 12px; }}
  td   {{ padding: 6px 10px; border-bottom: 1px solid #ddd; }}
  tr:hover td {{ background: #f0f5fb; }}
  .up   {{ color: #1e8449; font-weight: bold; }}
  .down {{ color: #c0392b; font-weight: bold; }}
  .flat {{ color: #7f8c8d; }}
  .hit  {{ background: #eafaf1; }}
  .miss {{ background: #fdf2f2; }}
  .footer {{ font-size: 11px; color: #888; margin-top: 8px; }}
</style>
</head>
<body>
<h2>Metal Predictor Report</h2>
<p class="subtitle">{subtitle}</p>
{sections}
<p class="footer">Statistical forecast only &mdash; not financial advice.</p>
</body>
</html>
"""

_SECTION_TEMPLATE = """\
<h3>{metal_title}</h3>
<table>
  <thead>
    <tr>
      <th>Hour (UK)</th>
      <th>Predicted ({unit})</th>
      <th>Lower</th>
      <th>Upper</th>
      <th>Direction</th>
      {actual_headers}
    </tr>
  </thead>
  <tbody>
    {rows}
  </tbody>
</table>
"""


def _dir_span(d: str) -> str:
    cls = "up" if d == "up" else ("down" if d == "down" else "flat")
    arrow = "&#8593;" if d == "up" else ("&#8595;" if d == "down" else "&#8594;")
    return f'<span class="{cls}">{arrow} {d}</span>'


def build_html_report(
    subtitle: str,
    metal_sections: list[dict],
) -> str:
    """Build an HTML email body.

    Each entry in *metal_sections* should be a dict with:
        metal      : str  e.g. "gold"
        unit       : str  e.g. "GBP/g"
        rows       : list of dicts with keys:
            hour_uk          : str
            predicted        : float
            lower            : float
            upper            : float
            direction        : str  "up" | "down" | "flat"
            actual           : float | None   (None for forecast-only)
            actual_direction : str | None
            direction_hit    : bool | None
    """
    sections_html = ""
    for sec in metal_sections:
        metal = sec["metal"].title()
        unit = sec.get("unit", "GBP")
        has_actual = any(r.get("actual") is not None for r in sec["rows"])
        actual_headers = "<th>Actual</th><th>Err %</th><th>Dir hit?</th>" if has_actual else ""

        row_parts = []
        for r in sec["rows"]:
            pred = r["predicted"]
            low = r["lower"]
            high = r["upper"]
            d = r.get("direction", "flat")
            actual = r.get("actual")

            actual_cells = ""
            row_class = ""
            if has_actual:
                if actual is not None:
                    err_pct = abs((actual - pred) / actual) * 100 if actual else 0.0
                    hit = r.get("direction_hit")
                    row_class = " class='hit'" if hit else " class='miss'"
                    hit_txt = "&#10003;" if hit else "&#10007;"
                    actual_cells = f"<td>{actual:.2f}</td><td>{err_pct:.1f}%</td><td>{hit_txt}</td>"
                else:
                    actual_cells = "<td>-</td><td>-</td><td>-</td>"

            row_parts.append(
                f"<tr{row_class}>"
                f"<td>{r['hour_uk']}</td>"
                f"<td><b>{pred:.2f}</b></td>"
                f"<td>{low:.2f}</td>"
                f"<td>{high:.2f}</td>"
                f"<td>{_dir_span(d)}</td>"
                f"{actual_cells}"
                "</tr>"
            )

        sections_html += _SECTION_TEMPLATE.format(
            metal_title=metal,
            unit=unit,
            actual_headers=actual_headers,
            rows="\n    ".join(row_parts),
        )

    return _HTML_TEMPLATE.format(subtitle=subtitle, sections=sections_html)


# ---------------------------------------------------------------------------
# Email sending
# ---------------------------------------------------------------------------

def send_email_report(
    subject: str,
    body: str,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_pass: str,
    email_from: str,
    email_to: str,
    html_body: str | None = None,
) -> None:
    if html_body:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = email_to
        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
    else:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = email_from
        msg["To"] = email_to
        msg.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)


def emit_report(
    message: str,
    webhook_url: str | None = None,
    email_settings: dict | None = None,
    subject: str = "Metal Predictor Report",
    html_body: str | None = None,
) -> None:
    logger.info(message)
    if webhook_url:
        payload = json.dumps({"text": message}).encode("utf-8")
        req = Request(webhook_url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urlopen(req, timeout=10) as resp:
                resp.read()
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
            logging.warning("Webhook delivery failed: %s", exc)

    if not email_settings:
        return
    required = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "email_from", "email_to"]
    if not all(email_settings.get(k) for k in required):
        return

    send_email_report(
        subject=subject,
        body=message,
        smtp_host=email_settings["smtp_host"],
        smtp_port=int(email_settings["smtp_port"]),
        smtp_user=email_settings["smtp_user"],
        smtp_pass=email_settings["smtp_pass"],
        email_from=email_settings["email_from"],
        email_to=email_settings["email_to"],
        html_body=html_body,
    )
