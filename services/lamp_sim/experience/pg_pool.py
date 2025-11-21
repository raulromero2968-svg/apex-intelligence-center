"""PostgreSQL-based experience pool for persistent storage."""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import sys
from pathlib import Path
import asyncpg
from sqlalchemy import create_engine, Column, String, Integer, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool

# Import from parent directory
_parent_dir = Path(__file__).parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

from config import settings
from logging_config import get_logger

logger = get_logger(__name__)

Base = declarative_base()


class ExperienceRecord(Base):
    """SQLAlchemy model for experience records."""

    __tablename__ = "lamp_experiences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    simulation_id = Column(String, nullable=False, index=True)
    step = Column(Integer, nullable=False)
    state = Column(JSON, nullable=False)
    agent_messages = Column(JSON, nullable=False)
    reward_signals = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert record to dictionary."""
        return {
            "id": self.id,
            "simulation_id": self.simulation_id,
            "step": self.step,
            "state": self.state,
            "agent_messages": self.agent_messages,
            "reward_signals": self.reward_signals,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PostgresPool:
    """PostgreSQL pool for storing simulation experiences."""

    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize PostgreSQL connection.

        Args:
            database_url: PostgreSQL connection string (defaults to config)
        """
        self.database_url = database_url or settings.database_url
        self.engine = None
        self.SessionLocal = None

        if self.database_url:
            self._initialize_connection()
        else:
            logger.warning("No DATABASE_URL provided. PostgresPool will not be available.")

    def _initialize_connection(self):
        """Initialize SQLAlchemy connection."""
        try:
            self.engine = create_engine(
                self.database_url,
                poolclass=NullPool,
                echo=False,
            )
            self.SessionLocal = sessionmaker(bind=self.engine)
            Base.metadata.create_all(self.engine)
            logger.info("PostgreSQL connection initialized")
        except Exception as e:
            logger.error(f"Failed to initialize PostgreSQL connection: {e}")
            self.engine = None
            self.SessionLocal = None

    def is_available(self) -> bool:
        """Check if PostgreSQL is available."""
        return self.engine is not None and self.SessionLocal is not None

    def log_experience(
        self,
        simulation_id: str,
        step: int,
        state: Dict[str, Any],
        agent_messages: List[Dict[str, Any]],
        reward_signals: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Log a new experience.

        Args:
            simulation_id: Unique simulation identifier
            step: Step number in simulation
            state: Environment state
            agent_messages: List of agent messages
            reward_signals: Optional reward signals
        """
        if not self.is_available():
            logger.warning("PostgreSQL not available. Skipping experience log.")
            return

        try:
            session = self.SessionLocal()
            try:
                record = ExperienceRecord(
                    simulation_id=simulation_id,
                    step=step,
                    state=state,
                    agent_messages=agent_messages,
                    reward_signals=reward_signals or {},
                )
                session.add(record)
                session.commit()
                logger.debug(f"Logged experience for simulation {simulation_id}, step {step}")
            finally:
                session.close()
        except Exception as e:
            logger.error(f"Failed to log experience: {e}")

    def sample_experiences(
        self,
        simulation_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Sample experiences from the pool.

        Args:
            simulation_id: Optional filter by simulation ID
            limit: Maximum number of experiences to return

        Returns:
            List of experience dictionaries
        """
        if not self.is_available():
            logger.warning("PostgreSQL not available. Returning empty sample.")
            return []

        try:
            session = self.SessionLocal()
            try:
                query = session.query(ExperienceRecord)
                if simulation_id:
                    query = query.filter(ExperienceRecord.simulation_id == simulation_id)
                query = query.order_by(ExperienceRecord.created_at.desc()).limit(limit)

                records = query.all()
                return [record.to_dict() for record in records]
            finally:
                session.close()
        except Exception as e:
            logger.error(f"Failed to sample experiences: {e}")
            return []

    def get_simulation_experiences(self, simulation_id: str) -> List[Dict[str, Any]]:
        """
        Get all experiences for a specific simulation.

        Args:
            simulation_id: Simulation identifier

        Returns:
            List of experience dictionaries, ordered by step
        """
        if not self.is_available():
            return []

        try:
            session = self.SessionLocal()
            try:
                records = (
                    session.query(ExperienceRecord)
                    .filter(ExperienceRecord.simulation_id == simulation_id)
                    .order_by(ExperienceRecord.step.asc())
                    .all()
                )
                return [record.to_dict() for record in records]
            finally:
                session.close()
        except Exception as e:
            logger.error(f"Failed to get simulation experiences: {e}")
            return []

