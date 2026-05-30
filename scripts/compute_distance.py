"""Distance utilities for FoodETA preprocessing."""

from __future__ import annotations

import math
from typing import Optional

import pandas as pd


EARTH_RADIUS_KM = 6371.0088


def is_valid_latitude(value: object) -> bool:
    """Return True when value is a finite latitude in [-90, 90]."""
    number = pd.to_numeric(value, errors="coerce")
    return bool(pd.notna(number) and -90 <= float(number) <= 90)


def is_valid_longitude(value: object) -> bool:
    """Return True when value is a finite longitude in [-180, 180]."""
    number = pd.to_numeric(value, errors="coerce")
    return bool(pd.notna(number) and -180 <= float(number) <= 180)


def are_valid_coordinates(lat: object, lon: object) -> bool:
    """Return True when latitude and longitude are both valid."""
    return is_valid_latitude(lat) and is_valid_longitude(lon)


def haversine_distance(
    lat1: object,
    lon1: object,
    lat2: object,
    lon2: object,
) -> Optional[float]:
    """Compute great-circle distance between two coordinates in kilometers.

    Invalid or missing coordinates return None so preprocessing can drop or
    mark those rows explicitly.
    """
    if not (are_valid_coordinates(lat1, lon1) and are_valid_coordinates(lat2, lon2)):
        return None

    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c
