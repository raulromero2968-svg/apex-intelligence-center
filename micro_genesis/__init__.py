"""
Micro-Genesis: TCG Market Intelligence System

A closed-loop discovery framework for autonomous Trading Card Game
market research and price prediction.

Components:
    - HypothesisEngine: Claude 4.5 Opus integration for hypothesis generation
    - DataCollectionAgent: Fara-7B based autonomous data collection
    - MicroGenesisOrchestrator: Closed-loop discovery orchestration

Example:
    >>> from micro_genesis import MicroGenesisOrchestrator
    >>>
    >>> orchestrator = MicroGenesisOrchestrator(
    ...     neo4j_uri="neo4j+s://xxx.databases.neo4j.io",
    ...     neo4j_user="neo4j",
    ...     neo4j_password="password",
    ...     anthropic_api_key="sk-ant-xxx"
    ... )
    >>>
    >>> orchestrator.run_discovery_cycle(
    ...     context="New Pokemon set announcement",
    ...     num_hypotheses=3
    ... )
    >>>
    >>> orchestrator.close()

Environment Variables:
    NEO4J_URI: Neo4j connection URI
    NEO4J_USER: Neo4j username
    NEO4J_PASSWORD: Neo4j password
    ANTHROPIC_API_KEY: Anthropic API key for Claude
    FARA_ENDPOINT: Microsoft Fara-7B endpoint (optional)
    FARA_API_KEY: Fara-7B API key (optional)

Author: Micro-Genesis Team
Version: 0.1.0
"""

__version__ = "0.1.0"
__author__ = "Micro-Genesis Team"

# Import main classes for convenient access
from .hypothesis_engine import HypothesisEngine, HYPOTHESIS_CATEGORIES
from .data_collection_agent import (
    DataCollectionAgent,
    TaskType,
    TaskStatus,
    CollectionTask,
    CollectionResult,
)
from .orchestrator import (
    MicroGenesisOrchestrator,
    DiscoveryCycle,
)

__all__ = [
    # Main orchestrator
    "MicroGenesisOrchestrator",
    "DiscoveryCycle",

    # Hypothesis engine
    "HypothesisEngine",
    "HYPOTHESIS_CATEGORIES",

    # Data collection
    "DataCollectionAgent",
    "TaskType",
    "TaskStatus",
    "CollectionTask",
    "CollectionResult",

    # Version info
    "__version__",
    "__author__",
]
