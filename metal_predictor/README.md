# Metal Predictor (Gold/Silver)

This is an MVP forecasting loop for `gold` and `silver`:

- Pulls hourly market data from Yahoo Finance futures symbols (`GC=F`, `SI=F`)
- Generates hourly predictions for the UK trading day
- Compares prediction vs actual in the evening
- Stores metrics and model parameters for ongoing tuning
- Can run continuously and refresh prediction-vs-actual every hour

## Run

From project root:

```bash
python3 -m metal_predictor.cli update-data
python3 -m metal_predictor.cli hourly-refresh
python3 -m metal_predictor.cli morning
python3 -m metal_predictor.cli evening
python3 -m metal_predictor.cli build-dashboard
python3 -m metal_predictor.cli export-excel
python3 -m metal_predictor.cli history-summary --days 30
python3 -m metal_predictor.cli send-test-email --to your-email@example.com
python3 -m metal_predictor.cli scheduler --poll-seconds 30
./scripts/metal_scheduler.sh start
./scripts/metal_scheduler.sh status
./scripts/metal_scheduler.sh logs
./scripts/metal_scheduler.sh stop
./scripts/run_metal_hourly_once.sh

# Persistent hourly background run via cron (UK time)
{ echo "CRON_TZ=Europe/London"; echo "0 * * * * cd /home/sahirvhora/projects/calculator_app && /home/sahirvhora/projects/calculator_app/scripts/run_metal_hourly_once.sh"; } | crontab -
```

## Excel report (prediction vs actual + difference charts)

```bash
python3 -m metal_predictor.cli export-excel --date-uk 2026-02-15 --out data/metal_report_2026-02-15.xlsx
```

Notes:
- Requires `openpyxl` (`pip install openpyxl`)
- Output workbook includes `Summary`, `Gold`, and `Silver` sheets with charts.

## Local webpage dashboard

1. Build dashboard JSON:
```bash
python3 -m metal_predictor.cli build-dashboard
```
2. Serve project locally:
```bash
python3 -m http.server 8000
```
3. Open `http://localhost:8000` and view:
- hourly prediction table
- predicted vs actual charts
- difference charts
- evaluation metrics

Displayed units:
- Gold: `GBP/gram`
- Silver: `GBP/kg`

## Optional environment variables

```bash
export METAL_DATA_DIR=data
export MARKET_DATA_PROVIDER=auto
export GOLD_API_BASE_URL=https://api.gold-api.com/price
export FX_RATE_MODE=auto
export FX_API_URL=https://api.frankfurter.app/latest?from=USD&to=GBP
export FX_CACHE_TTL_HOURS=6
export GBP_PER_USD=0.79
export TUNE_LOOKBACK_HOURS=720
export FORECAST_HOURS=24
export REPORT_WEBHOOK_URL=https://your-webhook-endpoint
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your_gmail@gmail.com
export SMTP_PASS=your_gmail_app_password
export EMAIL_FROM=your_gmail@gmail.com
export EMAIL_TO=your-email@example.com
```

## Data files

Generated in `data/` by default:

- `gold_observations.csv`
- `silver_observations.csv`
- `forecasts.csv`
- `evaluation_metrics.csv`
- `model_params.csv`
- `dashboard.json`
- `hourly_comparisons.csv` (prediction vs actual rows for drift checks)
- `forecast_history.db` (SQLite history DB)

## Alternate real-time source

If Yahoo data is unavailable, the app can fall back to `gold-api.com` spot endpoints.

Modes:
- `MARKET_DATA_PROVIDER=auto` (default): try Yahoo first, then Gold API fallback
- `MARKET_DATA_PROVIDER=yahoo`: Yahoo only
- `MARKET_DATA_PROVIDER=gold_api`: Gold API only

## GBP/USD conversion source

Modes:
- `FX_RATE_MODE=auto` (default): use cached FX, refresh from API when stale
- `FX_RATE_MODE=api`: always try API first, fallback to cache/fixed
- `FX_RATE_MODE=fixed`: use `GBP_PER_USD` only

In `auto/api` modes, if FX API is unavailable the dashboard/export automatically switches to `USD` display units for validation.

Cache file:
- `data/fx_rate.json`

## Accuracy expectations

This does not guarantee high accuracy and should not be treated as financial advice.  
To improve quality, add external features (DXY, US yields, macro calendar events, risk sentiment) and compare stronger models (XGBoost/LSTM/Prophet) on strict backtests.
