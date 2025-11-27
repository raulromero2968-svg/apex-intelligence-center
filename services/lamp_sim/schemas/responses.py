"""Response schemas for LAMP service."""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field


class AgentMessage(BaseModel):
    """Message from a single agent in a simulation step."""

    agent_id: str = Field(
        ...,
        alias="agentId",
        description="Unique identifier for the agent",
    )

    role: Literal[
        "Grader",
        "Arbitrage",
        "HypeDetector",
        "FormatScout",
        "Contrarian",
        "MarketMaker",
    ] = Field(
        ...,
        description="Agent role/type",
    )

    think: str = Field(
        ...,
        description="Agent's reasoning/thought process",
    )

    speak: str = Field(
        ...,
        description="Agent's public message",
    )

    decide: Dict[str, Any] = Field(
        ...,
        description="Agent's action decision (trade, spread adjustment, etc.)",
    )

    class Config:
        allow_population_by_field_name = True


class SimulationStep(BaseModel):
    """A single step in the simulation."""

    t: int = Field(
        ...,
        description="Time step index (0-indexed)",
    )

    state: Dict[str, Any] = Field(
        ...,
        description="Environment state at this step",
    )

    agent_messages: List[AgentMessage] = Field(
        ...,
        alias="agentMessages",
        description="Messages from all agents at this step",
    )

    class Config:
        allow_population_by_field_name = True


class SimulationSummary(BaseModel):
    """Summary statistics for the simulation."""

    total_steps: int = Field(
        ...,
        alias="totalSteps",
        description="Total number of steps executed",
    )

    final_state: Dict[str, Any] = Field(
        ...,
        alias="finalState",
        description="Final environment state",
    )

    total_trades: int = Field(
        ...,
        alias="totalTrades",
        description="Total number of trades executed",
    )

    portfolio_value_change: float = Field(
        ...,
        alias="portfolioValueChange",
        description="Change in portfolio value (percentage)",
    )

    scenario_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        alias="scenarioMetadata",
        description="Scenario-specific metadata",
    )

    class Config:
        allow_population_by_field_name = True


class LampSimulationResult(BaseModel):
    """Complete simulation result."""

    job_id: str = Field(
        ...,
        alias="jobId",
        description="Job identifier",
    )

    trace_id: str = Field(
        ...,
        alias="traceId",
        description="Trace identifier",
    )

    simulation_id: str = Field(
        ...,
        alias="simulationId",
        description="Unique simulation identifier",
    )

    status: Literal["ok", "error"] = Field(
        ...,
        description="Simulation status",
    )

    steps: List[SimulationStep] = Field(
        ...,
        description="List of simulation steps",
    )

    summary: SimulationSummary = Field(
        ...,
        description="Simulation summary",
    )

    error: Optional[str] = Field(
        default=None,
        description="Error message if status is 'error'",
    )

    class Config:
        allow_population_by_field_name = True

