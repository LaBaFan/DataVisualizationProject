"""Aggregation helpers for FoodETA processed data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable

import numpy as np
import pandas as pd


def _clean_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    return value


def _round_or_none(value: Any, digits: int = 3) -> float | None:
    if pd.isna(value):
        return None
    return round(float(value), digits)


def write_json(data: Any, path: str | Path) -> Path:
    """Write JSON with UTF-8 encoding and return the output path."""
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(_json_ready(data), file, ensure_ascii=False, indent=2)
    return output_path


def _json_ready(data: Any) -> Any:
    if isinstance(data, dict):
        return {key: _json_ready(value) for key, value in data.items()}
    if isinstance(data, list):
        return [_json_ready(value) for value in data]
    return _clean_value(data)


def _summary_record(group: pd.DataFrame) -> dict[str, Any]:
    duration = group["delivery_duration_min"]
    distance = group["distance_km"] if "distance_km" in group else pd.Series(dtype=float)
    delayed = group["is_delayed"] if "is_delayed" in group else pd.Series(dtype=float)
    return {
        "order_count": int(len(group)),
        "avg_delivery_duration_min": _round_or_none(duration.mean()),
        "median_delivery_duration_min": _round_or_none(duration.median()),
        "p75_delivery_duration_min": _round_or_none(duration.quantile(0.75)),
        "avg_distance_km": _round_or_none(distance.mean()),
        "delay_rate": _round_or_none(delayed.mean()),
    }


def _group_summary(df: pd.DataFrame, keys: list[str]) -> list[dict[str, Any]]:
    existing_keys = [key for key in keys if key in df.columns]
    if not existing_keys:
        return []

    records: list[dict[str, Any]] = []
    for values, group in df.groupby(existing_keys, dropna=False, observed=True):
        if not isinstance(values, tuple):
            values = (values,)
        record = {key: _clean_value(value) for key, value in zip(existing_keys, values)}
        record.update(_summary_record(group))
        records.append(record)
    return sorted(records, key=lambda item: item["order_count"], reverse=True)


def overview_summary(df: pd.DataFrame) -> dict[str, Any]:
    duration = df["delivery_duration_min"]
    distance = df["distance_km"]
    delayed = df["is_delayed"]
    delay_threshold = df.attrs.get("delay_threshold_min", duration.quantile(0.75))
    return {
        "total_orders": int(df.attrs.get("total_orders", len(df))),
        "valid_orders": int(df.attrs.get("valid_orders", len(df))),
        "avg_delivery_duration_min": _round_or_none(duration.mean()),
        "median_delivery_duration_min": _round_or_none(duration.median()),
        "delay_threshold_min": _round_or_none(delay_threshold),
        "delay_rate": _round_or_none(delayed.mean()),
        "avg_distance_km": _round_or_none(distance.mean()),
        "city_count": int(df["city"].nunique()) if "city" in df else 0,
        "weather_categories": int(df["weather"].nunique()) if "weather" in df else 0,
        "traffic_density_categories": int(df["traffic_density"].nunique()) if "traffic_density" in df else 0,
        "order_count": int(len(df)),
        "p75_delivery_duration_min": _round_or_none(duration.quantile(0.75)),
        "min_delivery_duration_min": _round_or_none(duration.min()),
        "max_delivery_duration_min": _round_or_none(duration.max()),
        "median_distance_km": _round_or_none(distance.median()),
        "avg_speed_kmph": _round_or_none(df["speed_kmph"].mean()) if "speed_kmph" in df else None,
    }


def delivery_time_distribution(df: pd.DataFrame) -> dict[str, Any]:
    bins = [0, 10, 20, 30, 40, 50, 60, 90, 120, float("inf")]
    labels = ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-90", "90-120", "120+"]
    distribution = pd.cut(df["delivery_duration_min"], bins=bins, labels=labels, right=False)
    counts = distribution.value_counts(sort=False)
    return {
        "bins": [
            {"range": label, "count": int(counts.get(label, 0))}
            for label in labels
        ],
        "quantiles": {
            "min": _round_or_none(df["delivery_duration_min"].min()),
            "q1": _round_or_none(df["delivery_duration_min"].quantile(0.25)),
            "median": _round_or_none(df["delivery_duration_min"].quantile(0.50)),
            "q3": _round_or_none(df["delivery_duration_min"].quantile(0.75)),
            "max": _round_or_none(df["delivery_duration_min"].max()),
        },
    }


def distance_time_sample(df: pd.DataFrame, max_points: int = 5000) -> list[dict[str, Any]]:
    sample = df
    if len(df) > max_points:
        sample = df.sample(n=max_points, random_state=42)

    candidate_columns = [
        "order_id",
        "distance_km",
        "delivery_duration_min",
        "weather",
        "traffic_density",
        "vehicle_type",
        "delivery_person_ratings",
        "multiple_deliveries",
        "city",
        "time_period",
        "is_delayed",
    ]
    sample = sample.copy()
    for column in candidate_columns:
        if column not in sample.columns:
            sample[column] = None
    return sample[candidate_columns].where(pd.notna(sample[candidate_columns]), None).to_dict(orient="records")


def time_period_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    return _group_summary(df, ["time_period"])


def hour_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    return sorted(_group_summary(df, ["order_hour"]), key=lambda item: (item["order_hour"] is None, item["order_hour"]))


def weather_traffic_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    return _group_summary(df, ["weather", "traffic_density"])


def courier_vehicle_summary(df: pd.DataFrame) -> dict[str, list[dict[str, Any]]]:
    working = df.copy()
    working["delivery_person_ratings_num"] = pd.to_numeric(
        working.get("delivery_person_ratings"),
        errors="coerce",
    )
    working["delivery_person_age_num"] = pd.to_numeric(
        working.get("delivery_person_age"),
        errors="coerce",
    )
    working["rating_bin"] = pd.cut(
        working["delivery_person_ratings_num"],
        bins=[0, 3, 4, 4.5, 5],
        labels=["0-3", "3-4", "4-4.5", "4.5-5"],
        include_lowest=True,
    )
    working["age_bin"] = pd.cut(
        working["delivery_person_age_num"],
        bins=[0, 25, 35, 45, 100],
        labels=["0-25", "25-35", "35-45", "45+"],
        include_lowest=True,
    )
    return {
        "by_vehicle_type": _group_summary(working, ["vehicle_type"]),
        "by_rating_bin": _group_summary(working, ["rating_bin"]),
        "by_age_bin": _group_summary(working, ["age_bin"]),
    }


def city_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    return _group_summary(df, ["city"])


AGGREGATIONS: dict[str, Callable[[pd.DataFrame], Any]] = {
    "overview_summary.json": overview_summary,
    "delivery_time_distribution.json": delivery_time_distribution,
    "distance_time_sample.json": distance_time_sample,
    "time_period_summary.json": time_period_summary,
    "hour_summary.json": hour_summary,
    "weather_traffic_summary.json": weather_traffic_summary,
    "courier_vehicle_summary.json": courier_vehicle_summary,
    "city_summary.json": city_summary,
}


def write_all_aggregations(df: pd.DataFrame, output_dir: str | Path) -> list[Path]:
    output_path = Path(output_dir)
    written: list[Path] = []
    for filename, function in AGGREGATIONS.items():
        written.append(write_json(function(df), output_path / filename))
    return written
