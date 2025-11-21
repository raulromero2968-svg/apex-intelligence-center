"""Request schemas matching Intelligence Bus contract."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, validator


class VarcPayload(BaseModel):
    """Payload specific to VARC job kind."""

    card_id: Optional[str] = Field(
        default=None,
        alias="cardId",
        description="Optional card identifier",
    )

    image_url: HttpUrl = Field(
        ...,
        alias="imageUrl",
        description="URL of the card image to process",
    )

    extra_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        alias="extraMetadata",
        description="Additional metadata passed through",
    )

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "cardId": "pokemon_pikachu_25",
                "imageUrl": "https://example.com/card.jpg",
                "extraMetadata": {"game": "pokemon"},
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
        description="Job kind, must be 'varc'",
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

    payload: VarcPayload = Field(
        ...,
        description="VARC-specific payload",
    )

    @validator("kind")
    def validate_kind(cls, v: str) -> str:
        """Ensure kind is 'varc'."""
        if v != "varc":
            raise ValueError(f"Expected kind='varc', got kind='{v}'")
        return v

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "jobId": "550e8400-e29b-41d4-a716-446655440000",
                "kind": "varc",
                "userId": "660e8400-e29b-41d4-a716-446655440001",
                "traceId": "770e8400-e29b-41d4-a716-446655440002",
                "requestedAt": "2025-01-20T12:00:00Z",
                "payload": {
                    "cardId": "pokemon_pikachu_25",
                    "imageUrl": "https://example.com/card.jpg",
                    "extraMetadata": {},
                },
            }
        }

