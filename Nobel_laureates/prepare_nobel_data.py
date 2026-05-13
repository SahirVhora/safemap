import logging
import pandas as pd
import json

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# ── Required columns ──────────────────────────────────────────────────────────
REQUIRED_LAUREATE_COLS = {"firstname", "surname", "born", "died", "bornCountry", "gender"}
REQUIRED_PRIZE_COLS    = {"year", "category", "share", "motivation"}

# ── Safe CSV loading with fallbacks ──────────────────────────────────────────
def safe_read_csv(path):
    """Try multiple engines/encodings until one works."""
    for enc in ["utf-8", "latin-1", "iso-8859-1"]:
        for engine in ["python", "c"]:
            try:
                df = pd.read_csv(path, encoding=enc, engine=engine, on_bad_lines="skip")
                print(f"  ✅ Loaded {path} [{enc} / {engine}] — {len(df)} rows")
                logging.info("Encoding fallback succeeded: %s with encoding=%s engine=%s", path, enc, engine)
                return df
            except Exception as e:
                print(f"  ⚠️  {path} [{enc} / {engine}] failed: {e}")
    raise RuntimeError(f"Could not read {path} with any engine/encoding")

def validate_columns(df, required_cols, label):
    """Warn about any required columns that are missing from df."""
    actual = set(df.columns.str.strip())
    missing = required_cols - actual
    if missing:
        logging.warning("%s is missing expected columns: %s", label, sorted(missing))
    else:
        logging.info("%s has all required columns.", label)

print("Loading CSVs...")
laureates = safe_read_csv("nobel_laureates.csv")
prizes    = safe_read_csv("nobel_prizes.csv")

validate_columns(laureates, REQUIRED_LAUREATE_COLS, "nobel_laureates.csv")
validate_columns(prizes,    REQUIRED_PRIZE_COLS,    "nobel_prizes.csv")

print("\nLaureate columns:", laureates.columns.tolist())
print("Prize columns   :", prizes.columns.tolist())

# ── Clean ─────────────────────────────────────────────────────────────────────
laureates.columns = laureates.columns.str.strip()
prizes.columns    = prizes.columns.str.strip()
laureates = laureates.fillna("")
prizes    = prizes.fillna("")

# ── Wikipedia URL ─────────────────────────────────────────────────────────────
def wiki_url(row):
    fname = str(row.get("firstname", "")).strip()
    sname = str(row.get("surname",   "")).strip()
    name  = f"{fname} {sname}".strip()
    if name:
        return "https://en.wikipedia.org/wiki/" + name.replace(" ", "_")
    return ""

laureates["wiki_url"] = laureates.apply(wiki_url, axis=1)

# ── Write JS data file ────────────────────────────────────────────────────────
laureates_list = laureates.to_dict(orient="records")
prizes_list    = prizes.to_dict(orient="records")

with open("nobel_data.js", "w", encoding="utf-8") as f:
    f.write("// Auto-generated Nobel Prize data — do not edit manually\n")
    f.write(f"const LAUREATES = {json.dumps(laureates_list, ensure_ascii=False, indent=2)};\n\n")
    f.write(f"const PRIZES    = {json.dumps(prizes_list,    ensure_ascii=False, indent=2)};\n")

print(f"\n✅ nobel_data.js written — {len(laureates_list)} laureates | {len(prizes_list)} prizes")