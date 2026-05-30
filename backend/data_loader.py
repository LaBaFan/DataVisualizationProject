from __future__ import annotations

import json
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DATA_DIR = PROJECT_ROOT / "data" / "processed"


DATASETS: dict[str, str] = {
    "overview": "overview_summary.json",
    "delivery-time-distribution": "delivery_time_distribution.json",
    "distance-time-sample": "distance_time_sample.json",
    "time-period-summary": "time_period_summary.json",
    "hour-summary": "hour_summary.json",
    "weather-traffic-summary": "weather_traffic_summary.json",
    "courier-vehicle-summary": "courier_vehicle_summary.json",
    "city-summary": "city_summary.json",
    "risk-scenario-summary": "risk_scenario_summary.json",
    "delay-factor-flow": "delay_factor_flow.json",
    "time-annotations": "time_annotations.json",
}

OBJECT_DATASETS = {"overview", "delivery-time-distribution", "courier-vehicle-summary"}


def fallback_data(dataset_name: str) -> Any:
    if dataset_name == "courier-vehicle-summary":
        return {
            "by_vehicle_type": [],
            "by_rating_bin": [],
            "by_age_bin": [],
        }
    if dataset_name in OBJECT_DATASETS:
        return {}
    return []


def load_dataset(dataset_name: str) -> dict[str, Any]:
    file_name = DATASETS[dataset_name]
    file_path = PROCESSED_DATA_DIR / file_name

    if not file_path.exists():
        return {
            "data_available": False,
            "data": fallback_data(dataset_name),
            "source_file": file_name,
        }

    try:
        with file_path.open("r", encoding="utf-8") as file_obj:
            data = json.load(file_obj)
    except (OSError, json.JSONDecodeError):
        return {
            "data_available": False,
            "data": fallback_data(dataset_name),
            "source_file": file_name,
        }

    return {
        "data_available": True,
        "data": data,
        "source_file": file_name,
    }
