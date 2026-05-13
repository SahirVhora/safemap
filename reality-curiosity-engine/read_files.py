#!/usr/bin/env python3
import os
import sys

# Change to WSL path
try:
    os.chdir("/home/sahirvhora/projects/calculator_app/reality-curiosity-engine")
except:
    pass

files_to_read = [
    "README.md",
    "frontend/src/App.jsx",
    "backend/app.py",
    "backend/graph_logic.py",
    "backend/ai_generator.py"
]

for filepath in files_to_read:
    try:
        with open(filepath, "r") as f:
            content = f.read()
        print(f"\n{'='*60}")
        print(f"FILE: {filepath}")
        print(f"{'='*60}")
        print(content)
    except Exception as e:
        print(f"ERROR reading {filepath}: {e}")
