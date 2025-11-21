"""Configuration management for VARC service using Pydantic BaseSettings."""

import os
from typing import Optional
from pydantic import Field
try:
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback for older pydantic versions
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    varc_model_path: Optional[str] = Field(
        default=None,
        env="VARC_MODEL_PATH",
        description="Optional local path to model weights file",
    )

    faiss_index_path: str = Field(
        default="./data/faiss_index.bin",
        env="FAISS_INDEX_PATH",
        description="Path to persisted FAISS index file",
    )

    database_url: Optional[str] = Field(
        default=None,
        env="DATABASE_URL",
        description="PostgreSQL connection string (optional)",
    )

    sentry_dsn: Optional[str] = Field(
        default=None,
        env="SENTRY_DSN",
        description="Sentry DSN for error tracking",
    )

    redis_url: Optional[str] = Field(
        default=None,
        env="REDIS_URL",
        description="Redis connection URL (optional, for background tasks)",
    )

    service_name: str = Field(
        default="varc_service",
        env="SERVICE_NAME",
        description="Service identifier for logging",
    )

    log_level: str = Field(
        default="INFO",
        env="LOG_LEVEL",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )

    max_image_size_mb: int = Field(
        default=10,
        env="MAX_IMAGE_SIZE_MB",
        description="Maximum image size in MB for download",
    )

    image_timeout_seconds: int = Field(
        default=30,
        env="IMAGE_TIMEOUT_SECONDS",
        description="Timeout for image download in seconds",
    )

    device: str = Field(
        default="cpu",
        env="DEVICE",
        description="PyTorch device (cpu, cuda, mps)",
    )

    fingerprint_hash_version: str = Field(
        default="v1",
        env="FINGERPRINT_HASH_VERSION",
        description="Fingerprint hash version identifier (e.g., 'v1')",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()

