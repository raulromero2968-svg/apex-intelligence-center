"""Multi-agent TCG market environment for RLlib."""

import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import sys
from pathlib import Path

# Import from parent directory
_parent_dir = Path(__file__).parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

from config import settings
from logging_config import get_logger

logger = get_logger(__name__)


class TCGMarketEnvironment:
    """Multi-agent environment for TCG market simulation."""

    def __init__(
        self,
        num_agents: int = 6,
        num_cards: int = 10,
        initial_cash: float = 10000.0,
        scenario_id: Optional[str] = None,
        scenario_params: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize environment.

        Args:
            num_agents: Number of agents
            num_cards: Number of cards in the market
            initial_cash: Initial cash for each agent
            scenario_id: Optional scenario identifier
            scenario_params: Optional scenario parameters
        """
        self.num_agents = num_agents
        self.num_cards = num_cards
        self.initial_cash = initial_cash
        self.scenario_id = scenario_id
        self.scenario_params = scenario_params or {}

        # Initialize state
        self.reset()

    def reset(self) -> Dict[str, Any]:
        """
        Reset environment to initial state.

        Returns:
            Initial state dictionary
        """
        # Card prices (normalized to 0-1 range, will be scaled)
        self.card_prices = np.random.uniform(0.5, 1.5, self.num_cards)

        # Card volumes (trading volume)
        self.card_volumes = np.random.uniform(0.1, 1.0, self.num_cards)

        # Agent cash holdings
        self.agent_cash = np.full(self.num_agents, self.initial_cash)

        # Agent card holdings (num_agents x num_cards)
        self.agent_holdings = np.zeros((self.num_agents, self.num_cards))

        # Risk metrics (volatility)
        self.card_volatility = np.random.uniform(0.1, 0.3, self.num_cards)

        # Demand shocks (external events)
        self.demand_shocks = np.zeros(self.num_cards)

        # Step counter
        self.step_count = 0

        # Apply scenario-specific initialization
        if self.scenario_id == "save_duarte":
            self._initialize_save_duarte_scenario()

        return self.get_state()

    def _initialize_save_duarte_scenario(self):
        """Initialize 'Save Duarte' scenario."""
        # In Save Duarte scenario, focus on protecting/boosting a specific card
        target_card_idx = self.scenario_params.get("target_card_idx", 0)

        # Set initial high price for target card
        self.card_prices[target_card_idx] = 2.0

        # Some agents start with holdings of the target card
        for agent_idx in [0, 2, 4]:  # Grader, HypeDetector, Contrarian
            self.agent_holdings[agent_idx, target_card_idx] = 10.0
            self.agent_cash[agent_idx] -= 10.0 * self.card_prices[target_card_idx] * 100

        logger.info(f"Initialized Save Duarte scenario with target card {target_card_idx}")

    def get_state(self) -> Dict[str, Any]:
        """
        Get current environment state.

        Returns:
            State dictionary
        """
        return {
            "card_prices": self.card_prices.tolist(),
            "card_volumes": self.card_volumes.tolist(),
            "agent_cash": self.agent_cash.tolist(),
            "agent_holdings": self.agent_holdings.tolist(),
            "card_volatility": self.card_volatility.tolist(),
            "demand_shocks": self.demand_shocks.tolist(),
            "step": self.step_count,
        }

    def get_observation(self, agent_id: int) -> np.ndarray:
        """
        Get observation for a specific agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Observation vector
        """
        # Concatenate market state with agent-specific information
        obs = np.concatenate([
            self.card_prices,
            self.card_volumes,
            self.card_volatility,
            self.demand_shocks,
            [self.agent_cash[agent_id] / self.initial_cash],  # Normalized cash
            self.agent_holdings[agent_id],  # Agent's holdings
        ])
        return obs

    def apply_actions(self, actions: Dict[int, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Apply actions from all agents.

        Args:
            actions: Dictionary mapping agent_id to action dict

        Returns:
            Updated state
        """
        # Process each agent's action
        for agent_id, action in actions.items():
            if agent_id >= self.num_agents:
                continue

            action_type = action.get("type", "hold")
            card_idx = action.get("card_idx", 0)
            quantity = action.get("quantity", 0)

            if action_type == "buy" and quantity > 0:
                cost = self.card_prices[card_idx] * quantity * 100  # Scale price
                if self.agent_cash[agent_id] >= cost:
                    self.agent_cash[agent_id] -= cost
                    self.agent_holdings[agent_id, card_idx] += quantity
                    # Increase volume
                    self.card_volumes[card_idx] += 0.1 * quantity

            elif action_type == "sell" and quantity > 0:
                if self.agent_holdings[agent_id, card_idx] >= quantity:
                    revenue = self.card_prices[card_idx] * quantity * 100
                    self.agent_cash[agent_id] += revenue
                    self.agent_holdings[agent_id, card_idx] -= quantity
                    # Increase volume
                    self.card_volumes[card_idx] += 0.1 * quantity

        # Update market dynamics
        self._update_market_dynamics()

        self.step_count += 1
        return self.get_state()

    def _update_market_dynamics(self):
        """Update market prices and volumes based on trading activity."""
        # Price changes based on volume and demand
        volume_impact = (self.card_volumes - 0.5) * 0.1
        shock_impact = self.demand_shocks * 0.2

        price_changes = volume_impact + shock_impact + np.random.normal(0, 0.02, self.num_cards)

        self.card_prices = np.clip(self.card_prices + price_changes, 0.1, 5.0)

        # Decay volumes
        self.card_volumes = np.clip(self.card_volumes * 0.95, 0.1, 2.0)

        # Decay demand shocks
        self.demand_shocks = self.demand_shocks * 0.9

        # Occasionally add new demand shocks
        if np.random.random() < 0.1:
            shock_card = np.random.randint(0, self.num_cards)
            self.demand_shocks[shock_card] = np.random.uniform(-0.5, 0.5)

    def compute_rewards(self, agent_id: int) -> float:
        """
        Compute reward for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Reward value
        """
        # Portfolio value
        portfolio_value = (
            self.agent_cash[agent_id]
            + np.sum(self.agent_holdings[agent_id] * self.card_prices * 100)
        )

        # Reward is change in portfolio value
        if not hasattr(self, "previous_portfolio_values"):
            self.previous_portfolio_values = np.full(self.num_agents, self.initial_cash)

        reward = portfolio_value - self.previous_portfolio_values[agent_id]
        self.previous_portfolio_values[agent_id] = portfolio_value

        # Scenario-specific rewards
        if self.scenario_id == "save_duarte":
            target_card_idx = self.scenario_params.get("target_card_idx", 0)
            # Reward agents for maintaining/boosting target card price
            if self.card_prices[target_card_idx] > 1.5:
                reward += 10.0

        return reward / 100.0  # Normalize

    def get_portfolio_value(self, agent_id: int) -> float:
        """
        Get total portfolio value for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Portfolio value
        """
        return (
            self.agent_cash[agent_id]
            + np.sum(self.agent_holdings[agent_id] * self.card_prices * 100)
        )

