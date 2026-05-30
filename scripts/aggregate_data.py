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


def _normalize_series(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce").fillna(0)
    min_value = numeric.min()
    max_value = numeric.max()
    if pd.isna(min_value) or pd.isna(max_value) or max_value == min_value:
        return pd.Series(0.0, index=series.index)
    return (numeric - min_value) / (max_value - min_value)


def _multiple_deliveries_group(value: Any) -> str:
    if pd.isna(value):
        return "unknown"
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        text = str(value).strip()
        return text if text else "unknown"
    if numeric <= 0:
        return "single"
    if numeric == 1:
        return "one_extra"
    return "multiple_extra"


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


def build_risk_scenario_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    required = [
        "weather",
        "traffic_density",
        "time_period",
        "vehicle_type",
        "multiple_deliveries",
    ]
    if not all(column in df.columns for column in required):
        return []

    working = df.copy()
    working["multiple_deliveries_num"] = pd.to_numeric(
        working["multiple_deliveries"],
        errors="coerce",
    ).fillna(0)
    working["multiple_deliveries_group"] = working["multiple_deliveries"].map(_multiple_deliveries_group)
    working["delivery_person_ratings_num"] = pd.to_numeric(
        working.get("delivery_person_ratings"),
        errors="coerce",
    )

    keys = [
        "weather",
        "traffic_density",
        "time_period",
        "vehicle_type",
        "multiple_deliveries_group",
    ]
    records: list[dict[str, Any]] = []
    for values, group in working.groupby(keys, dropna=False, observed=True):
        record = {key: _clean_value(value) for key, value in zip(keys, values)}
        multiple_delivery_rate = (group["multiple_deliveries_num"] > 0).mean()
        record.update(
            {
                "order_count": int(len(group)),
                "avg_delivery_duration_min": _round_or_none(group["delivery_duration_min"].mean()),
                "delay_rate": _round_or_none(group["is_delayed"].mean()),
                "avg_distance_km": _round_or_none(group["distance_km"].mean()),
                "multiple_delivery_rate": _round_or_none(multiple_delivery_rate),
                "avg_rating": _round_or_none(group["delivery_person_ratings_num"].mean()),
            }
        )
        records.append(record)

    if not records:
        return []

    result = pd.DataFrame(records)
    result["normalized_duration"] = _normalize_series(result["avg_delivery_duration_min"])
    result["normalized_distance"] = _normalize_series(result["avg_distance_km"])
    result["risk_score"] = (
        0.4 * result["normalized_duration"]
        + 0.3 * pd.to_numeric(result["delay_rate"], errors="coerce").fillna(0)
        + 0.2 * result["normalized_distance"]
        + 0.1 * pd.to_numeric(result["multiple_delivery_rate"], errors="coerce").fillna(0)
    )
    result = result.sort_values(["risk_score", "order_count"], ascending=[False, False]).reset_index(drop=True)
    result["scenario_id"] = result.index.map(lambda index: f"scenario_{index + 1:04d}")

    output_columns = [
        "scenario_id",
        "weather",
        "traffic_density",
        "time_period",
        "vehicle_type",
        "multiple_deliveries_group",
        "order_count",
        "avg_delivery_duration_min",
        "delay_rate",
        "avg_distance_km",
        "multiple_delivery_rate",
        "avg_rating",
        "risk_score",
    ]
    result["risk_score"] = result["risk_score"].round(3)
    return result[output_columns].where(pd.notna(result[output_columns]), None).to_dict(orient="records")


def build_delay_factor_flow(df: pd.DataFrame) -> list[dict[str, Any]]:
    flow_steps = [
        ("weather", "traffic_density"),
        ("traffic_density", "time_period"),
        ("time_period", "is_delayed"),
    ]
    records: list[dict[str, Any]] = []

    for level, (source_column, target_column) in enumerate(flow_steps, start=1):
        if source_column not in df.columns or target_column not in df.columns:
            continue
        working = df[[source_column, target_column, "delivery_duration_min"]].copy()
        working["_delay_flag"] = df["is_delayed"]
        if target_column == "is_delayed":
            working[target_column] = working[target_column].map({True: "delayed", False: "not_delayed"})

        for values, group in working.groupby([source_column, target_column], dropna=False, observed=True):
            source_value, target_value = values
            records.append(
                {
                    "source": f"{source_column}:{_clean_value(source_value)}",
                    "target": f"{target_column}:{_clean_value(target_value)}",
                    "level": level,
                    "order_count": int(len(group)),
                    "avg_delivery_duration_min": _round_or_none(group["delivery_duration_min"].mean()),
                    "delay_rate": _round_or_none(group["_delay_flag"].mean()),
                }
            )

    return sorted(records, key=lambda item: (item["level"], -item["order_count"], item["source"], item["target"]))


def build_time_annotations(df: pd.DataFrame) -> list[dict[str, Any]]:
    annotations: list[dict[str, Any]] = [
        {
            "annotation_id": "fixed_lunch_peak",
            "time_value": "10-14",
            "annotation_type": "fixed_period",
            "label": "Lunch peak",
            "description": "Lunch delivery peak window defined by the preprocessing time-period rule.",
            "related_metric": "time_period=lunch_peak",
        },
        {
            "annotation_id": "fixed_dinner_peak",
            "time_value": "17-21",
            "annotation_type": "fixed_period",
            "label": "Dinner peak",
            "description": "Dinner delivery peak window defined by the preprocessing time-period rule.",
            "related_metric": "time_period=dinner_peak",
        },
    ]

    hourly = pd.DataFrame(hour_summary(df))
    if hourly.empty:
        return annotations

    metric_specs = [
        ("peak_order_count", "order_count", "Peak order volume", "Hour with the highest order count."),
        (
            "peak_avg_duration",
            "avg_delivery_duration_min",
            "Peak average delivery time",
            "Hour with the highest average delivery duration.",
        ),
        ("peak_delay_rate", "delay_rate", "Peak delay rate", "Hour with the highest delay rate."),
    ]
    for annotation_id, metric, label, description in metric_specs:
        if metric not in hourly.columns or hourly[metric].isna().all():
            continue
        row = hourly.loc[hourly[metric].idxmax()]
        annotations.append(
            {
                "annotation_id": annotation_id,
                "time_value": _clean_value(row["order_hour"]),
                "annotation_type": "metric_peak",
                "label": label,
                "description": description,
                "related_metric": f"{metric}={_round_or_none(row[metric])}",
            }
        )

    return annotations


AGGREGATIONS: dict[str, Callable[[pd.DataFrame], Any]] = {
    "overview_summary.json": overview_summary,
    "delivery_time_distribution.json": delivery_time_distribution,
    "distance_time_sample.json": distance_time_sample,
    "time_period_summary.json": time_period_summary,
    "hour_summary.json": hour_summary,
    "weather_traffic_summary.json": weather_traffic_summary,
    "courier_vehicle_summary.json": courier_vehicle_summary,
    "city_summary.json": city_summary,
    "risk_scenario_summary.json": build_risk_scenario_summary,
    "delay_factor_flow.json": build_delay_factor_flow,
    "time_annotations.json": build_time_annotations,
}


def write_all_aggregations(df: pd.DataFrame, output_dir: str | Path) -> list[Path]:
    output_path = Path(output_dir)
    written: list[Path] = []
    for filename, function in AGGREGATIONS.items():
        written.append(write_json(function(df), output_path / filename))
    return written
