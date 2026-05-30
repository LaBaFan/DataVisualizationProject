from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from .data_loader import DATASETS, load_dataset
    from .schemas import DatasetResponse, HealthResponse
except ImportError:  # Support `cd backend && uvicorn main:app`.
    from data_loader import DATASETS, load_dataset
    from schemas import DatasetResponse, HealthResponse


app = FastAPI(title="FoodETA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


def register_dataset_route(dataset_name: str) -> None:
    path = f"/api/{dataset_name}"

    async def endpoint() -> DatasetResponse:
        return DatasetResponse(**load_dataset(dataset_name))

    endpoint.__name__ = f"get_{dataset_name.replace('-', '_')}"
    app.get(path, response_model=DatasetResponse)(endpoint)


for name in DATASETS:
    register_dataset_route(name)
