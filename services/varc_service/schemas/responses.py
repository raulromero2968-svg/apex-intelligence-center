"""Response schemas matching Intelligence Bus contract."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator


class Embeddings(BaseModel):
    """Embedding vectors extracted from the image."""

    vision768: List[float] = Field(
        ...,
        description="768-dimensional vision embedding",
    )

    vision1536: Optional[List[float]] = Field(
        default=None,
        description="Optional 1536-dimensional vision embedding",
    )

    @validator("vision768")
    def validate_vision768_length(cls, v: List[float]) -> List[float]:
        """Ensure vision768 has exactly 768 dimensions."""
        if len(v) != 768:
            raise ValueError(f"vision768 must have 768 dimensions, got {len(v)}")
        return v

    @validator("vision1536")
    def validate_vision1536_length(cls, v: Optional[List[float]]) -> Optional[List[float]]:
        """Ensure vision1536 has exactly 1536 dimensions if provided."""
        if v is not None and len(v) != 1536:
            raise ValueError(f"vision1536 must have 1536 dimensions, got {len(v)}")
        return v


class NeighborInfo(BaseModel):
    """Information about a neighbor retrieved from FAISS index."""

    neighbor_id: str = Field(..., alias="neighborId", description="ID of the neighbor")
    distance: float = Field(..., description="Distance score from query embedding")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the neighbor",
    )

    class Config:
        allow_population_by_field_name = True


class ReasoningTrace(BaseModel):
    """Detailed reasoning trace explaining the inference result."""

    neighbor_ids: List[str] = Field(
        default_factory=list,
        alias="neighborIds",
        description="IDs of neighbors retrieved from FAISS",
    )

    neighbor_distances: List[float] = Field(
        default_factory=list,
        alias="neighborDistances",
        description="Distances to retrieved neighbors",
    )

    neighbors: List[NeighborInfo] = Field(
        default_factory=list,
        description="Detailed neighbor information",
    )

    intermediate_scores: Dict[str, float] = Field(
        default_factory=dict,
        alias="intermediateScores",
        description="Intermediate prediction scores during reasoning",
    )

    main_factors: List[str] = Field(
        default_factory=list,
        alias="mainFactors",
        description="Main factors influencing the grade decision",
    )

    processing_time_ms: float = Field(
        default=0.0,
        alias="processingTimeMs",
        description="Time taken for processing in milliseconds",
    )

    class Config:
        allow_population_by_field_name = True


class FingerprintPayload(BaseModel):
    """Fingerprint payload for card identification."""

    hash_version: str = Field(..., description="Fingerprint hash version (e.g., 'v1')")
    fingerprint_vector: List[float] = Field(
        ...,
        description="256-dimensional normalized fingerprint vector",
    )
    fingerprint_hex: str = Field(
        ...,
        description="64-character hex digest (SHA-256) of quantized fingerprint",
    )

    @validator("fingerprint_vector")
    def validate_fingerprint_vector_length(cls, v: List[float]) -> List[float]:
        """Ensure fingerprint_vector has exactly 256 dimensions."""
        if len(v) != 256:
            raise ValueError(f"fingerprint_vector must have 256 dimensions, got {len(v)}")
        return v

    @validator("fingerprint_hex")
    def validate_fingerprint_hex_format(cls, v: str) -> str:
        """Ensure fingerprint_hex is 64-character hex string."""
        if len(v) != 64:
            raise ValueError(f"fingerprint_hex must be 64 characters, got {len(v)}")
        if not all(c in "0123456789abcdef" for c in v.lower()):
            raise ValueError("fingerprint_hex must be hexadecimal")
        return v


class VarcInferenceResult(BaseModel):
    """Complete inference result matching Intelligence Bus contract."""

    job_id: str = Field(..., alias="jobId", description="Job ID from request")
    trace_id: str = Field(..., alias="traceId", description="Trace ID from request")
    status: str = Field(..., description="Status: 'ok' or 'error'")
    grade: Optional[float] = Field(
        default=None,
        description="Card grade (e.g., 1-10 or 0-100), null if error",
    )
    grade_confidence: Optional[float] = Field(
        default=None,
        alias="gradeConfidence",
        description="Confidence in grade prediction (0-1), null if error",
    )
    counterfeit_score: Optional[float] = Field(
        default=None,
        alias="counterfeitScore",
        description="Counterfeit detection score (0-1, higher = more likely counterfeit), null if error",
    )
    embeddings: Optional[Embeddings] = Field(
        default=None,
        description="Embedding vectors, null if error",
    )
    reasoning_trace: Optional[ReasoningTrace] = Field(
        default=None,
        alias="reasoningTrace",
        description="Detailed reasoning trace, null if error",
    )
    fingerprint: Optional[FingerprintPayload] = Field(
        default=None,
        description="Optional fingerprint payload for card identification (backwards-compatible)",
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if status='error'",
    )

    @validator("status")
    def validate_status(cls, v: str) -> str:
        """Ensure status is 'ok' or 'error'."""
        if v not in {"ok", "error"}:
            raise ValueError(f"status must be 'ok' or 'error', got '{v}'")
        return v

    @validator("grade_confidence", "counterfeit_score")
    def validate_confidence_range(cls, v: Optional[float]) -> Optional[float]:
        """Ensure confidence scores are in [0, 1] range."""
        if v is not None and (v < 0.0 or v > 1.0):
            raise ValueError(f"Confidence score must be in [0, 1], got {v}")
        return v

    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "jobId": "550e8400-e29b-41d4-a716-446655440000",
                "traceId": "770e8400-e29b-41d4-a716-446655440002",
                "status": "ok",
                "grade": 9.5,
                "gradeConfidence": 0.92,
                "counterfeitScore": 0.03,
                "embeddings": {
                    "vision768": [0.1] * 768,
                    "vision1536": None,
                },
                "reasoningTrace": {
                    "neighborIds": [],
                    "neighborDistances": [],
                    "neighbors": [],
                    "intermediateScores": {},
                    "mainFactors": ["high_image_quality", "consistent_colors"],
                    "processingTimeMs": 1250.5,
                },
                "error": None,
            }
        }

