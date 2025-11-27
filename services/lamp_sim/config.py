"""Configuration management for LAMP service using Pydantic BaseSettings."""

import os
from typing import Optional
from pydantic import Field
try:
    from pydantic_settings import BaseSettings
except ImportError:
    # Fallback for pydantic < 2.0
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    lamp_model_dir: str = Field(
        default="./models",
        env="LAMP_MODEL_DIR",
        description="Directory containing RLlib checkpoints",
    )

    experience_index_path: str = Field(
        default="./data/experience_index.bin",
        env="EXPERIENCE_INDEX_PATH",
        description="Path to persisted FAISS index file",
    )

    database_url: Optional[str] = Field(
        default=None,
        env="DATABASE_URL",
        description="PostgreSQL connection string for experience pool",
    )

    sentry_dsn: Optional[str] = Field(
        default=None,
        env="SENTRY_DSN",
        description="Sentry DSN for error tracking",
    )

    service_name: str = Field(
        default="lamp_sim",
        env="SERVICE_NAME",
        description="Service identifier for logging",
    )

    log_level: str = Field(
        default="INFO",
        env="LOG_LEVEL",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )

    max_simulation_steps: int = Field(
        default=50,
        env="MAX_SIMULATION_STEPS",
        description="Maximum number of Think→Speak→Decide cycles per simulation",
    )

    num_agents: int = Field(
        default=6,
        env="NUM_AGENTS",
        description="Number of agents in simulation",
    )

    agent_roles: list = Field(
        default_factory=lambda: [
            "Grader",
            "Arbitrage",
            "HypeDetector",
            "FormatScout",
            "Contrarian",
            "MarketMaker",
        ],
        description="List of agent roles",
    )

    faiss_dimension: int = Field(
        default=128,
        env="FAISS_DIMENSION",
        description="Dimension of embeddings stored in FAISS",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()

