"""Request schemas matching Intelligence Bus contract."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator


class LampPayload(BaseModel):
    """Payload specific to LAMP job kind."""

    scenario_id: str = Field(
        ...,
        alias="scenarioId",
        description="Scenario identifier (e.g., 'save_duarte')",
    )

    portfolio_id: Optional[str] = Field(
        default=None,
        alias="portfolioId",
        description="Optional portfolio identifier",
    )

    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional scenario parameters",
    )

    horizon_days: int = Field(
        default=30,
        alias="horizonDays",
        description="Simulation horizon in days",
    )

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "scenarioId": "save_duarte",
                "portfolioId": "portfolio_123",
                "parameters": {"target_card": "duarte_001"},
                "horizonDays": 30,
            }
        }


class JobEnvelope(BaseModel):
    """Job envelope matching Intelligence Bus contract."""

    job_id: str = Field(
        ...,
        alias="jobId",
        description="UUID v4 string identifying the job",
    )

    kind: str = Field(
        ...,
        description="Job kind, must be 'lamp'",
    )

    user_id: Optional[str] = Field(
        default=None,
        alias="userId",
        description="UUID v4 string identifying the user (optional)",
    )

    trace_id: str = Field(
        ...,
        alias="traceId",
        description="UUID v4 string for distributed tracing",
    )

    requested_at: datetime = Field(
        ...,
        alias="requestedAt",
        description="ISO8601 timestamp when job was requested",
    )

    payload: LampPayload = Field(
        ...,
        description="LAMP-specific payload",
    )

    @validator("kind")
    def validate_kind(cls, v: str) -> str:
        """Ensure kind is 'lamp'."""
        if v != "lamp":
            raise ValueError(f"Expected kind='lamp', got kind='{v}'")
        return v

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "jobId": "550e8400-e29b-41d4-a716-446655440000",
                "kind": "lamp",
                "userId": "660e8400-e29b-41d4-a716-446655440001",
                "traceId": "770e8400-e29b-41d4-a716-446655440002",
                "requestedAt": "2025-01-20T12:00:00Z",
                "payload": {
                    "scenarioId": "save_duarte",
                    "portfolioId": "portfolio_123",
                    "parameters": {},
                    "horizonDays": 30,
                },
            }
        }

