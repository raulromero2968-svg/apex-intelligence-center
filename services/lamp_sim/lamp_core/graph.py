"""LangGraph workflow for Think→Speak→Decide→Think cycle."""

from typing import Dict, List, Any, TypedDict, Annotated
import operator
from langgraph.graph import StateGraph, END

# Import from parent directory
import sys
from pathlib import Path
_parent_dir = Path(__file__).parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

from config import settings
from logging_config import get_logger
from .env import TCGMarketEnvironment
from .policies import RLlibPolicyManager

logger = get_logger(__name__)


class SimulationState(TypedDict):
    """State for LangGraph simulation."""

    step: int
    state: Dict[str, Any]
    agent_messages: List[Dict[str, Any]]
    agent_thoughts: Dict[str, str]
    historical_messages: List[Dict[str, Any]]
    scenario_id: str
    scenario_params: Dict[str, Any]
    environment: TCGMarketEnvironment
    policy_manager: RLlibPolicyManager


def think_node(state: SimulationState) -> SimulationState:
    """
    Think node: Agents reason about current state and history.

    Args:
        state: Current simulation state

    Returns:
        Updated state with agent thoughts
    """
    env = state["environment"]
    current_state = state["state"]
    historical_messages = state["historical_messages"]
    agent_roles = settings.agent_roles

    thoughts = {}
    for agent_id in range(env.num_agents):
        role = agent_roles[agent_id] if agent_id < len(agent_roles) else f"Agent_{agent_id}"

        # Generate thought based on role and state
        thought = _generate_thought(
            role=role,
            agent_id=agent_id,
            state=current_state,
            historical_messages=historical_messages,
            scenario_id=state["scenario_id"],
            scenario_params=state["scenario_params"],
        )
        thoughts[f"agent_{agent_id}"] = thought

    state["agent_thoughts"] = thoughts
    logger.debug(f"Step {state['step']}: Generated thoughts for {len(thoughts)} agents")
    return state


def _generate_thought(
    role: str,
    agent_id: int,
    state: Dict[str, Any],
    historical_messages: List[Dict[str, Any]],
    scenario_id: str,
    scenario_params: Dict[str, Any],
) -> str:
    """Generate thought text for an agent based on role."""
    card_prices = state.get("card_prices", [])
    card_volumes = state.get("card_volumes", [])
    agent_cash = state.get("agent_cash", [])
    agent_holdings = state.get("agent_holdings", [])

    # Save Duarte scenario awareness
    is_save_duarte = scenario_id == "save_duarte"
    target_card_idx = scenario_params.get("target_card_idx", 0) if is_save_duarte else None
    target_card_price = card_prices[target_card_idx] if target_card_idx is not None and target_card_idx < len(card_prices) else None

    if agent_id < len(agent_cash):
        cash = agent_cash[agent_id]
        holdings = agent_holdings[agent_id] if agent_id < len(agent_holdings) else []

        if role == "Grader":
            base_thought = (
                f"Analyzing grading opportunities. Current cash: ${cash:.2f}. "
                f"High-value cards detected: {len([p for p in card_prices if p > 1.5])}. "
                f"Focusing on cards with grading potential."
            )
            if is_save_duarte and target_card_price:
                base_thought += f" Save Duarte scenario: Target card at ${target_card_price:.2f}. Prioritizing protection."
            return base_thought
        elif role == "Arbitrage":
            base_thought = (
                f"Scanning for arbitrage opportunities. Price spreads: "
                f"max={max(card_prices) if card_prices else 0:.2f}, "
                f"min={min(card_prices) if card_prices else 0:.2f}. "
                f"Looking for cross-market discrepancies."
            )
            if is_save_duarte:
                base_thought += " Coordinating with team to maintain target card stability."
            return base_thought
        elif role == "HypeDetector":
            base_thought = (
                f"Monitoring hype signals. Volume spikes: "
                f"{len([v for v in card_volumes if v > 1.0])}. "
                f"Detecting momentum in trending cards."
            )
            if is_save_duarte and target_card_idx is not None:
                target_volume = card_volumes[target_card_idx] if target_card_idx < len(card_volumes) else 0
                base_thought += f" Target card volume: {target_volume:.2f}. Monitoring for coordination signals."
            return base_thought
        elif role == "FormatScout":
            base_thought = (
                f"Evaluating format relevance. Cards in competitive play: "
                f"{len([p for p in card_prices if 0.8 < p < 1.5])}. "
                f"Tracking meta shifts."
            )
            if is_save_duarte:
                base_thought += " Save Duarte coordination: Ensuring format relevance supports target."
            return base_thought
        elif role == "Contrarian":
            base_thought = (
                f"Taking contrarian position. Overvalued cards: "
                f"{len([p for p in card_prices if p > 1.8])}. "
                f"Seeking undervalued opportunities."
            )
            if is_save_duarte:
                base_thought += " Save Duarte: Maintaining contrarian support for target card stability."
            return base_thought
        elif role == "MarketMaker":
            base_thought = (
                f"Providing liquidity. Current holdings: {sum(holdings) if holdings else 0:.1f}. "
                f"Adjusting spreads to balance market."
            )
            if is_save_duarte and target_card_idx is not None:
                target_holdings = holdings[target_card_idx] if target_card_idx < len(holdings) else 0
                base_thought += f" Save Duarte: Managing target card liquidity (holdings: {target_holdings:.1f})."
            return base_thought

    return f"Agent {agent_id} ({role}) analyzing market conditions."


def speak_node(state: SimulationState) -> SimulationState:
    """
    Speak node: Convert thoughts into public messages.

    Args:
        state: Current simulation state

    Returns:
        Updated state with agent messages
    """
    thoughts = state["agent_thoughts"]
    agent_roles = settings.agent_roles
    messages = []

    for agent_id, thought in thoughts.items():
        agent_idx = int(agent_id.split("_")[1])
        role = agent_roles[agent_idx] if agent_idx < len(agent_roles) else f"Agent_{agent_idx}"

        # Convert thought to public message (simplified version)
        speak_text = _thought_to_speak(thought, role)

        messages.append({
            "agentId": agent_id,
            "role": role,
            "think": thought,
            "speak": speak_text,
            "decide": {},  # Will be filled in decide_node
        })

    state["agent_messages"] = messages
    logger.debug(f"Step {state['step']}: Generated {len(messages)} agent messages")
    return state


def _thought_to_speak(thought: str, role: str) -> str:
    """Convert internal thought to public message."""
    # Simplified: extract key points from thought
    if "grading" in thought.lower():
        return "Identifying high-grade potential cards for submission."
    elif "arbitrage" in thought.lower():
        return "Detected price discrepancies across markets."
    elif "hype" in thought.lower():
        return "Momentum building in select cards."
    elif "format" in thought.lower():
        return "Meta shifts creating new opportunities."
    elif "contrarian" in thought.lower():
        return "Market overreaction detected, seeking value."
    elif "liquidity" in thought.lower():
        return "Adjusting market-making spreads."

    return f"{role}: Monitoring market conditions."


def decide_node(state: SimulationState) -> SimulationState:
    """
    Decide node: Map thoughts + messages + RL policy to actions.

    Args:
        state: Current simulation state

    Returns:
        Updated state with decisions
    """
    env = state["environment"]
    policy_manager = state["policy_manager"]
    current_state = state["state"]
    agent_roles = settings.agent_roles

    # Get observations for all agents
    observations = {
        agent_id: env.get_observation(agent_id)
        for agent_id in range(env.num_agents)
    }

    # Get actions from RL policies
    agent_ids = list(range(env.num_agents))
    actions = policy_manager.get_actions_for_state(
        state=current_state,
        agent_ids=agent_ids,
        observations=observations,
    )

    # Update agent messages with decisions
    for msg in state["agent_messages"]:
        agent_id_str = msg["agentId"]
        agent_idx = int(agent_id_str.split("_")[1])
        if agent_idx in actions:
            msg["decide"] = actions[agent_idx]

    logger.debug(f"Step {state['step']}: Generated decisions for {len(actions)} agents")
    return state


def update_state_node(state: SimulationState) -> SimulationState:
    """
    Update state node: Apply actions to environment.

    Args:
        state: Current simulation state

    Returns:
        Updated state
    """
    env = state["environment"]
    agent_messages = state["agent_messages"]

    # Extract actions from messages
    actions = {}
    for msg in agent_messages:
        agent_id_str = msg["agentId"]
        agent_idx = int(agent_id_str.split("_")[1])
        actions[agent_idx] = msg["decide"]

    # Apply actions to environment
    new_state = env.apply_actions(actions)

    # Update state
    state["state"] = new_state
    state["step"] = state["step"] + 1

    # Add to historical messages
    state["historical_messages"].extend(agent_messages)

    logger.debug(f"Step {state['step']}: Updated environment state")
    return state


def should_continue(state: SimulationState) -> str:
    """
    Check if simulation should continue.

    Args:
        state: Current simulation state

    Returns:
        "continue" or "end"
    """
    if state["step"] >= settings.max_simulation_steps:
        return "end"
    return "continue"


def create_lamp_graph() -> StateGraph:
    """
    Create LangGraph workflow for LAMP simulation.

    Returns:
        Compiled StateGraph
    """
    workflow = StateGraph(SimulationState)

    # Add nodes
    workflow.add_node("think", think_node)
    workflow.add_node("speak", speak_node)
    workflow.add_node("decide", decide_node)
    workflow.add_node("update", update_state_node)

    # Set entry point
    workflow.set_entry_point("think")

    # Add edges
    workflow.add_edge("think", "speak")
    workflow.add_edge("speak", "decide")
    workflow.add_edge("decide", "update")

    # Conditional edge: continue or end
    workflow.add_conditional_edges(
        "update",
        should_continue,
        {
            "continue": "think",
            "end": END,
        },
    )

    return workflow.compile()

