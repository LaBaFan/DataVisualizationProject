"""Preprocess Kaggle Food Delivery Dataset data for FoodETA."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from pandas.api.types import is_object_dtype, is_string_dtype

from aggregate_data import write_all_aggregations
from compute_distance import haversine_distance


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RAW_FILE = PROJECT_ROOT / "data" / "raw" / "food_delivery.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
CLEAN_FILE = PROCESSED_DIR / "orders_clean.csv"
MISSING_TOKENS = {"", "nan", "na", "n/a", "none", "null", "nil", "not available", "unknown"}
TARGET_COLUMNS = [
    "order_id",
    "delivery_person_id",
    "delivery_person_age",
    "delivery_person_ratings",
    "restaurant_latitude",
    "restaurant_longitude",
    "delivery_latitude",
    "delivery_longitude",
    "order_date",
    "time_ordered",
    "time_picked",
    "weather",
    "traffic_density",
    "vehicle_condition",
    "order_type",
    "vehicle_type",
    "multiple_deliveries",
    "festival",
    "city",
    "delivery_duration_min",
    "distance_km",
    "order_hour",
    "weekday",
    "time_period",
    "is_delayed",
    "speed_kmph",
]


def to_snake_case(name: object) -> str:
    text = str(name).strip()
    text = re.sub(r"[\s\-\/]+", "_", text)
    text = re.sub(r"[^0-9a-zA-Z_]+", "_", text)
    text = re.sub(r"_+", "_", text)
    return text.strip("_").lower()


def standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed = df.rename(columns={column: to_snake_case(column) for column in df.columns})
    aliases = {
        "id": "order_id",
        "time_taken_min": "time_taken_min",
        "time_taken": "time_taken_min",
        "time_orderd": "time_ordered",
        "time_ordered": "time_ordered",
        "time_order_picked": "time_picked",
        "weatherconditions": "weather",
        "weather_conditions": "weather",
        "weather_condition": "weather",
        "traffic_level": "traffic_density",
        "road_traffic_density": "traffic_density",
        "delivery_location_latitude": "delivery_latitude",
        "delivery_location_longitude": "delivery_longitude",
        "type_of_order": "order_type",
        "type_of_vehicle": "vehicle_type",
    }
    rename_map = {column: aliases[column] for column in renamed.columns if column in aliases}
    return renamed.rename(columns=rename_map)


def normalize_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    for column in cleaned.columns:
        if is_object_dtype(cleaned[column]) or is_string_dtype(cleaned[column]):
            cleaned[column] = cleaned[column].map(_clean_string_value)
    return cleaned


def _clean_string_value(value: object) -> object:
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    if text.lower() in MISSING_TOKENS:
        return np.nan
    return text


def normalize_category_values(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize noisy category labels from the Kaggle delivery dataset."""
    cleaned = df.copy()
    for column in ["weather", "traffic_density", "vehicle_type", "order_type", "festival", "city"]:
        if column in cleaned.columns:
            cleaned[column] = cleaned[column].map(_clean_string_value)

    if "weather" in cleaned.columns:
        cleaned["weather"] = cleaned["weather"].map(_clean_weather_value)
    return cleaned


def _clean_weather_value(value: object) -> object:
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    text = re.sub(r"^conditions\s+", "", text, flags=re.IGNORECASE).strip()
    if text.lower() in MISSING_TOKENS:
        return np.nan
    return text


def extract_duration(value: object) -> float:
    if pd.isna(value):
        return np.nan
    match = re.search(r"(\d+(?:\.\d+)?)", str(value))
    if not match:
        return np.nan
    return float(match.group(1))


def parse_hour(row: pd.Series) -> float:
    for column in ("time_ordered", "time_picked"):
        if column in row.index and pd.notna(row[column]):
            parsed = pd.to_datetime(str(row[column]), errors="coerce")
            if pd.notna(parsed):
                return float(parsed.hour)
            match = re.search(r"(\d{1,2})(?::\d{1,2})?", str(row[column]))
            if match:
                hour = int(match.group(1))
                if 0 <= hour <= 23:
                    return float(hour)
    return np.nan


def classify_time_period(hour: object) -> str:
    if pd.isna(hour):
        return "unknown"
    hour_int = int(hour)
    if 6 <= hour_int < 10:
        return "breakfast"
    if 10 <= hour_int < 14:
        return "lunch_peak"
    if 14 <= hour_int < 17:
        return "afternoon"
    if 17 <= hour_int < 21:
        return "dinner_peak"
    if 21 <= hour_int < 24 or 0 <= hour_int < 6:
        return "night"
    return "unknown"


def parse_weekday(value: object) -> str:
    if pd.isna(value):
        return "unknown"
    parsed = pd.to_datetime(value, errors="coerce", dayfirst=True)
    if pd.isna(parsed):
        parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return "unknown"
    return parsed.day_name()


def add_distance(df: pd.DataFrame) -> pd.DataFrame:
    required = [
        "restaurant_latitude",
        "restaurant_longitude",
        "delivery_latitude",
        "delivery_longitude",
    ]
    for column in required:
        if column not in df.columns:
            raise ValueError(f"缺少计算距离所需字段：{column}")

    result = df.copy()
    for column in required:
        result[column] = pd.to_numeric(result[column], errors="coerce")

    result["distance_km"] = result.apply(
        lambda row: haversine_distance(
            row["restaurant_latitude"],
            row["restaurant_longitude"],
            row["delivery_latitude"],
            row["delivery_longitude"],
        ),
        axis=1,
    )
    result["distance_km"] = pd.to_numeric(result["distance_km"], errors="coerce")
    return result


def align_output_schema(df: pd.DataFrame) -> pd.DataFrame:
    aligned = df.copy()
    for column in TARGET_COLUMNS:
        if column not in aligned.columns:
            aligned[column] = np.nan

    extra_columns = [column for column in aligned.columns if column not in TARGET_COLUMNS and column != "time_taken_min"]
    return aligned[TARGET_COLUMNS + extra_columns]


def clean_orders(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, float], float]:
    working = normalize_category_values(normalize_missing_values(standardize_columns(df)))

    required_for_missing_report = [
        "delivery_person_age",
        "delivery_person_ratings",
        "restaurant_latitude",
        "restaurant_longitude",
        "delivery_latitude",
        "delivery_longitude",
        "weather",
        "traffic_density",
        "time_taken_min",
    ]
    missing_ratio = {
        column: round(float(working[column].isna().mean()), 4)
        for column in required_for_missing_report
        if column in working.columns
    }

    if "time_taken_min" not in working.columns:
        raise ValueError("缺少配送时长字段：Time_taken(min) 或 Time_taken")

    working["delivery_duration_min"] = working["time_taken_min"].map(extract_duration)
    working = add_distance(working)
    working["order_hour"] = working.apply(parse_hour, axis=1)
    working["order_hour"] = working["order_hour"].astype("Int64")
    working["weekday"] = working["order_date"].map(parse_weekday) if "order_date" in working else "unknown"
    working["time_period"] = working["order_hour"].map(classify_time_period)

    before_drop = len(working)
    valid_mask = (
        working["delivery_duration_min"].notna()
        & (working["delivery_duration_min"] > 0)
        & working["distance_km"].notna()
        & (working["distance_km"] > 0)
        & (working["distance_km"] <= 100)
    )
    cleaned = working.loc[valid_mask].copy()
    if cleaned.empty:
        raise ValueError("清洗后没有可用记录，请检查原始 CSV 字段和经纬度/配送时长格式。")

    delay_threshold = float(cleaned["delivery_duration_min"].quantile(0.75))
    cleaned["is_delayed"] = cleaned["delivery_duration_min"] > delay_threshold
    cleaned["speed_kmph"] = cleaned["distance_km"] / (cleaned["delivery_duration_min"] / 60)
    cleaned.loc[
        (cleaned["delivery_duration_min"] <= 0)
        | (cleaned["distance_km"] <= 0)
        | (cleaned["distance_km"] > 100)
        | (cleaned["speed_kmph"] <= 0)
        | (cleaned["speed_kmph"] > 120),
        "speed_kmph",
    ] = np.nan

    deleted = before_drop - len(cleaned)
    missing_ratio["deleted_after_core_validation"] = round(deleted / before_drop, 4) if before_drop else 0.0
    cleaned = align_output_schema(cleaned)
    cleaned.attrs["delay_threshold_min"] = delay_threshold
    return cleaned, missing_ratio, delay_threshold


def main() -> int:
    if not RAW_FILE.exists():
        print(
            "错误：未找到原始数据文件 data/raw/food_delivery.csv。\n"
            "请从 https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset 下载数据，"
            "重命名为 food_delivery.csv 后放入 data/raw/。",
            file=sys.stderr,
        )
        return 1

    try:
        raw = pd.read_csv(RAW_FILE)
        raw_count = len(raw)
        cleaned, missing_ratio, delay_threshold = clean_orders(raw)
        cleaned.attrs["total_orders"] = raw_count
        cleaned.attrs["valid_orders"] = len(cleaned)
        cleaned.attrs["delay_threshold_min"] = delay_threshold
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        cleaned.to_csv(CLEAN_FILE, index=False)
        output_files = [CLEAN_FILE]
        output_files.extend(write_all_aggregations(cleaned, PROCESSED_DIR))
    except Exception as exc:
        print(f"预处理失败：{exc}", file=sys.stderr)
        return 1

    print(f"原始记录数：{raw_count}")
    print(f"清洗后记录数：{len(cleaned)}")
    print(f"删除记录数：{raw_count - len(cleaned)}")
    print("主要字段缺失比例：")
    for field, ratio in missing_ratio.items():
        print(f"  - {field}: {ratio:.2%}")
    print(f"延迟阈值（75 分位配送时长）：{delay_threshold:.2f} 分钟")
    print("输出文件列表：")
    for path in output_files:
        print(f"  - {path.relative_to(PROJECT_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
