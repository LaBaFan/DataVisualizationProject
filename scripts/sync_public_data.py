"""Sync processed FoodETA JSON files into the Vite public data directory."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
PUBLIC_DATA_DIR = PROJECT_ROOT / "public" / "data"

PUBLIC_JSON_FILES = [
    "overview_summary.json",
    "time_period_summary.json",
    "weather_traffic_summary.json",
    "risk_scenario_summary.json",
    "weather_impact_summary.json",
    "traffic_density_summary.json",
    "scenario_orders_sample.json",
    "scene_summary.json",
    "scene_filter_summary.json",
    "distance_time_sample.json",
    "scenario_distance_time_points.json",
]


def main() -> int:
    missing = [filename for filename in PUBLIC_JSON_FILES if not (PROCESSED_DIR / filename).exists()]
    if missing:
        print("缺少待同步文件：", ", ".join(missing), file=sys.stderr)
        return 1

    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for filename in PUBLIC_JSON_FILES:
        shutil.copy2(PROCESSED_DIR / filename, PUBLIC_DATA_DIR / filename)
        print(f"synced public/data/{filename}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
