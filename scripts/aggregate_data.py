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


def _append_risk_scores(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not records:
        return records

    result = pd.DataFrame(records)
    duration_component = _normalize_series(result["avg_delivery_duration_min"])
    distance_component = _normalize_series(result.get("avg_distance_km", pd.Series(dtype=float)))
    order_component = _normalize_series(result["order_count"])
    delay_component = pd.to_numeric(result["delay_rate"], errors="coerce").fillna(0)
    result["risk_score"] = (
        0.4 * duration_component
        + 0.3 * delay_component
        + 0.2 * distance_component
        + 0.1 * order_component
    ).round(3)
    return result.where(pd.notna(result), None).to_dict(orient="records")


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
    return _append_risk_scores(_group_summary(df, ["weather", "traffic_density"]))


def weather_impact_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    if "weather" not in df.columns:
        return []
    records = _group_summary(df[df["weather"].notna()].copy(), ["weather"])
    return sorted(_append_risk_scores(records), key=lambda item: str(item["weather"]))


def traffic_density_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    if "traffic_density" not in df.columns:
        return []
    records = _group_summary(df[df["traffic_density"].notna()].copy(), ["traffic_density"])
    order = {"Low": 0, "Medium": 1, "High": 2, "Jam": 3}
    return sorted(
        _append_risk_scores(records),
        key=lambda item: order.get(str(item["traffic_density"]), 99),
    )


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


def _scenario_key(row: pd.Series | dict[str, Any]) -> tuple[Any, ...]:
    return (
        row.get("weather"),
        row.get("traffic_density"),
        row.get("time_period"),
        row.get("vehicle_type"),
        _multiple_deliveries_group(row.get("multiple_deliveries")),
    )


def build_scenario_orders_sample(df: pd.DataFrame, max_orders: int = 500) -> list[dict[str, Any]]:
    if df.empty:
        return []

    scenario_lookup = {
        (
            row.get("weather"),
            row.get("traffic_density"),
            row.get("time_period"),
            row.get("vehicle_type"),
            row.get("multiple_deliveries_group"),
        ): row.get("scenario_id")
        for row in build_risk_scenario_summary(df)
    }

    working = df.copy()
    global_median = working["delivery_duration_min"].median()
    group_keys = ["weather", "traffic_density", "time_period", "vehicle_type"]
    working["predicted_duration_min"] = working.groupby(group_keys, dropna=False, observed=True)[
        "delivery_duration_min"
    ].transform("median")
    working["predicted_duration_min"] = working["predicted_duration_min"].fillna(global_median)
    working["delay_minutes"] = (working["delivery_duration_min"] - working["predicted_duration_min"]).clip(lower=0)
    working["_priority"] = (
        working["is_delayed"].astype(int) * 1000
        + working["delay_minutes"].fillna(0)
        + working["delivery_duration_min"].fillna(0) / 100
    )
    sample = working.sort_values("_priority", ascending=False).head(max_orders).copy()
    sample["scenario_id"] = sample.apply(lambda row: scenario_lookup.get(_scenario_key(row)), axis=1)

    columns = [
        "order_id",
        "scenario_id",
        "city",
        "weather",
        "traffic_density",
        "time_period",
        "vehicle_type",
        "distance_km",
        "delivery_duration_min",
        "predicted_duration_min",
        "delay_minutes",
        "is_delayed",
        "delivery_person_ratings",
        "multiple_deliveries",
    ]
    for column in columns:
        if column not in sample.columns:
            sample[column] = None
    return sample[columns].where(pd.notna(sample[columns]), None).to_dict(orient="records")


def build_scenario_distance_time_points(df: pd.DataFrame, max_points: int = 3000) -> list[dict[str, Any]]:
    sample = df.copy()
    if len(sample) > max_points:
        delayed = sample[sample["is_delayed"]].sample(
            n=min(len(sample[sample["is_delayed"]]), max_points // 2),
            random_state=42,
        )
        remaining_count = max_points - len(delayed)
        remaining = sample.drop(delayed.index).sample(n=remaining_count, random_state=43)
        sample = pd.concat([delayed, remaining], ignore_index=True)

    scenario_lookup = {
        (
            row.get("weather"),
            row.get("traffic_density"),
            row.get("time_period"),
            row.get("vehicle_type"),
            row.get("multiple_deliveries_group"),
        ): row.get("scenario_id")
        for row in build_risk_scenario_summary(df)
    }
    sample["scenario_id"] = sample.apply(lambda row: scenario_lookup.get(_scenario_key(row)), axis=1)
    sample["_risk"] = (
        sample["is_delayed"].astype(int) * 0.45
        + _normalize_series(sample["delivery_duration_min"]) * 0.35
        + _normalize_series(sample["distance_km"]) * 0.2
    ).round(3)

    columns = [
        "order_id",
        "scenario_id",
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
        "_risk",
    ]
    output = sample[columns].rename(columns={"_risk": "risk_score"})
    return output.where(pd.notna(output), None).to_dict(orient="records")


def _scene_risk_score(group: pd.DataFrame, all_orders: pd.DataFrame) -> float | None:
    if group.empty:
        return None
    global_p75_duration = all_orders["delivery_duration_min"].quantile(0.75)
    global_p75_distance = all_orders["distance_km"].quantile(0.75)
    duration_component = min(1.0, float(group["delivery_duration_min"].mean() / global_p75_duration))
    distance_component = min(1.0, float(group["distance_km"].mean() / global_p75_distance))
    delay_component = float(group["is_delayed"].mean())
    order_component = min(1.0, float(np.sqrt(len(group) / max(len(all_orders), 1))))
    return round(
        0.35 * duration_component
        + 0.35 * delay_component
        + 0.15 * distance_component
        + 0.15 * order_component,
        3,
    )


def _scene_record(
    df: pd.DataFrame,
    scene_id: str,
    mask: pd.Series,
    source_filter: str,
    description: str,
) -> dict[str, Any]:
    group = df.loc[mask].copy()
    summary = _summary_record(group) if not group.empty else _summary_record(df.iloc[0:0])
    summary.update(
        {
            "scene_id": scene_id,
            "risk_score": _scene_risk_score(group, df),
            "delay_threshold_min": _round_or_none(
                df.attrs.get("delay_threshold_min", df["delivery_duration_min"].quantile(0.75))
            ),
            "source_filter": source_filter,
            "description": description,
        }
    )
    return summary


def _build_scene_rules(df: pd.DataFrame) -> list[tuple[str, pd.Series, str, str]]:
    """Return scene masks used by both scene summary and scene filter summary."""
    if df.empty:
        return []

    distance_q25 = df["distance_km"].quantile(0.25)
    distance_median = df["distance_km"].median()
    distance_q75 = df["distance_km"].quantile(0.75)
    distance_iqr = df["distance_km"].quantile(0.75) - df["distance_km"].quantile(0.25)
    distance_band = max(float(distance_iqr) / 2, 1.0)
    p75_duration = df["delivery_duration_min"].quantile(0.75)

    city_proxy = df["city"].isin(["Metropolitian", "Urban"]) if "city" in df else pd.Series(True, index=df.index)
    lunch_dinner = df["time_period"].isin(["lunch_peak", "dinner_peak"])
    has_dispatch_load = (
        pd.to_numeric(df["multiple_deliveries"], errors="coerce").ge(1)
        if "multiple_deliveries" in df
        else pd.Series(False, index=df.index)
    )
    motorcycle_proxy = (
        df["vehicle_type"].eq("motorcycle") if "vehicle_type" in df else pd.Series(False, index=df.index)
    )
    dispatch_center_mask = (
        lunch_dinner
        & city_proxy
        & df["distance_km"].between(distance_q25, distance_median)
        & (has_dispatch_load | motorcycle_proxy)
    )
    mixed_food_community_mask = (
        lunch_dinner
        & city_proxy
        & df["order_type"].notna()
        & df["distance_km"].between(distance_median, distance_q75)
        & ~dispatch_center_mask
    )

    return [
        ("overall", pd.Series(True, index=df.index), "all clean orders", "全量清洗订单。"),
        ("sunny", df["weather"].eq("Sunny"), "weather == Sunny", "晴天订单，用作天气基准。"),
        ("cloudy", df["weather"].eq("Cloudy"), "weather == Cloudy", "多云天气订单。"),
        ("fog_business", df["weather"].eq("Fog"), "weather == Fog", "雾天订单，作为低能见度商务区 proxy。"),
        ("storm_area", df["weather"].eq("Stormy"), "weather == Stormy", "暴雨雷暴订单，作为极端天气区域 proxy。"),
        ("sandstorm", df["weather"].eq("Sandstorms"), "weather == Sandstorms", "沙尘天气订单。"),
        ("windy", df["weather"].eq("Windy"), "weather == Windy", "大风天气订单。"),
        ("night_low_peak", df["time_period"].eq("night"), "time_period == night", "夜间订单。"),
        (
            "traffic_hub",
            df["traffic_density"].isin(["High", "Jam"]),
            "traffic_density in [High, Jam]",
            "高交通压力订单，作为主干道压力 proxy。",
        ),
        (
            "restaurant_street",
            lunch_dinner & df["order_type"].notna() & df["distance_km"].le(distance_median),
            "time_period in [lunch_peak, dinner_peak] AND order_type not null AND distance_km <= median",
            "餐饮峰值短距离订单，作为餐饮街区取餐压力 proxy。",
        ),
        (
            "dispatch_center",
            dispatch_center_mask,
            "time_period in [lunch_peak, dinner_peak] AND city in [Metropolitian, Urban] AND distance_km between q25 and median AND (multiple_deliveries >= 1 OR vehicle_type == motorcycle)",
            "都市峰值短中距离且具备多单或摩托配送特征的订单，作为配送中心出发与派单压力 proxy。",
        ),
        (
            "high_risk_residential",
            df["is_delayed"] & df["delivery_duration_min"].ge(p75_duration) & df["traffic_density"].isin(["High", "Jam"]),
            "is_delayed == true AND delivery_duration >= p75 AND traffic_density in [High, Jam]",
            "高延迟且高交通压力订单，作为住宅末端高风险 proxy。",
        ),
        (
            "mixed_food_community",
            mixed_food_community_mask,
            "time_period in [lunch_peak, dinner_peak] AND city in [Metropolitian, Urban] AND order_type not null AND distance_km between median and q75 AND NOT dispatch_center",
            "都市峰值中长距离餐饮订单，排除配送中心出发压力样本后作为餐饮社区混合区 proxy。",
        ),
    ]


def build_scene_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []

    rules = _build_scene_rules(df)
    return [_scene_record(df, scene_id, mask, source_filter, description) for scene_id, mask, source_filter, description in rules]


def _scene_filter_record(
    df: pd.DataFrame,
    scene_id: str,
    group: pd.DataFrame,
    weather: Any,
    time_period: Any,
) -> dict[str, Any]:
    summary = _summary_record(group) if not group.empty else _summary_record(df.iloc[0:0])
    summary.update(
        {
            "scene_id": scene_id,
            "weather": _clean_value(weather),
            "time_period": _clean_value(time_period),
            "risk_score": _scene_risk_score(group, df),
            "delay_threshold_min": _round_or_none(
                df.attrs.get("delay_threshold_min", df["delivery_duration_min"].quantile(0.75))
            ),
        }
    )
    return summary


def build_scene_filter_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Build exact scene x weather x time-period summaries for the map HUD."""
    if df.empty:
        return []

    records: list[dict[str, Any]] = []
    for scene_id, mask, _source_filter, _description in _build_scene_rules(df):
        scene_group = df.loc[mask].copy()
        if scene_group.empty:
            continue

        records.append(_scene_filter_record(df, scene_id, scene_group, "All", "All"))

        for weather, weather_group in scene_group.groupby("weather", dropna=False, observed=True):
            records.append(_scene_filter_record(df, scene_id, weather_group, weather, "All"))

        for time_period, time_group in scene_group.groupby("time_period", dropna=False, observed=True):
            records.append(_scene_filter_record(df, scene_id, time_group, "All", time_period))

        for (weather, time_period), filtered_group in scene_group.groupby(["weather", "time_period"], dropna=False, observed=True):
            records.append(_scene_filter_record(df, scene_id, filtered_group, weather, time_period))

    return sorted(
        records,
        key=lambda item: (
            str(item.get("scene_id")),
            str(item.get("weather")),
            str(item.get("time_period")),
        ),
    )


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
    "weather_impact_summary.json": weather_impact_summary,
    "traffic_density_summary.json": traffic_density_summary,
    "courier_vehicle_summary.json": courier_vehicle_summary,
    "city_summary.json": city_summary,
    "risk_scenario_summary.json": build_risk_scenario_summary,
    "scenario_orders_sample.json": build_scenario_orders_sample,
    "scenario_distance_time_points.json": build_scenario_distance_time_points,
    "scene_summary.json": build_scene_summary,
    "scene_filter_summary.json": build_scene_filter_summary,
    "delay_factor_flow.json": build_delay_factor_flow,
    "time_annotations.json": build_time_annotations,
}


def write_all_aggregations(df: pd.DataFrame, output_dir: str | Path) -> list[Path]:
    output_path = Path(output_dir)
    written: list[Path] = []
    for filename, function in AGGREGATIONS.items():
        written.append(write_json(function(df), output_path / filename))
    return written
