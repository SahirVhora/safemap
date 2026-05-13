#!/usr/bin/env bash
# Run one hourly metal predictor refresh
# Called by system cron every hour
set -e
cd /home/sahirvhora/projects/experiments/metal_predictor
PYTHON_BIN="${PYTHON_BIN:-python3}"
exec "$PYTHON_BIN" cli.py hourly-refresh
