from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class DatasetResponse(BaseModel):
    data_available: bool
    data: Any
    source_file: str
