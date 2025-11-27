"""RLlib policy integration for multi-agent reinforcement learning."""

import os
from typing import Dict, List, Any, Optional
import numpy as np
import sys
from pathlib import Path
import ray
from ray import rllib
from ray.rllib.algorithms.ppo import PPOConfig
from ray.rllib.algorithms.maddpg import MADDPGConfig

# Import from parent directory
_parent_dir = Path(__file__).parent.parent
if str(_parent_dir) not in sys.path:
    sys.path.insert(0, str(_parent_dir))

from config import settings
from logging_config import get_logger

logger = get_logger(__name__)


class RLlibPolicyManager:
    """Manager for RLlib policies."""

    def __init__(self, model_dir: Optional[str] = None, num_agents: int = 6):
        """
        Initialize policy manager.

        Args:
            model_dir: Directory containing RLlib checkpoints
            num_agents: Number of agents in the simulation
        """
        self.model_dir = model_dir or settings.lamp_model_dir
        self.num_agents = num_agents
        self.policies: Dict[str, Any] = {}
        self.algorithm = None
        self._initialized = False

        # Initialize Ray if not already initialized
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True, num_cpus=1)

    def _initialize_algorithm(self, num_agents: int, obs_dim: int, action_dim: int):
        """Initialize RLlib algorithm."""
        try:
            # Try to load from checkpoint
            if os.path.exists(self.model_dir) and os.listdir(self.model_dir):
                logger.info(f"Loading RLlib checkpoint from {self.model_dir}")
                # Use PPO for multi-agent (simpler than MADDPG for now)
                config = (
                    PPOConfig()
                    .environment(env=None)  # We handle environment ourselves
                    .multi_agent(
                        policies={
                            f"agent_{i}": (
                                None,
                                None,
                                None,
                                {"gamma": 0.99, "lr": 3e-4},
                            )
                            for i in range(num_agents)
                        },
                        policy_mapping_fn=lambda agent_id, *args, **kwargs: f"agent_{agent_id}",
                    )
                )

                # Try to restore from checkpoint
                try:
                    checkpoints = [
                        f
                        for f in os.listdir(self.model_dir)
                        if f.startswith("checkpoint_")
                    ]
                    if checkpoints:
                        latest_checkpoint = os.path.join(
                            self.model_dir, sorted(checkpoints)[-1]
                        )
                        self.algorithm = config.build()
                        self.algorithm.restore(latest_checkpoint)
                        logger.info(f"Restored checkpoint from {latest_checkpoint}")
                    else:
                        logger.warning("No checkpoints found. Using default policies.")
                        self._create_default_policies(num_agents, obs_dim, action_dim)
                except Exception as e:
                    logger.warning(f"Failed to restore checkpoint: {e}. Using default policies.")
                    self._create_default_policies(num_agents, obs_dim, action_dim)
            else:
                logger.info("No model directory found. Using default policies.")
                self._create_default_policies(num_agents, obs_dim, action_dim)

            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize RLlib algorithm: {e}")
            self._create_default_policies(num_agents, obs_dim, action_dim)
            self._initialized = True

    def _create_default_policies(self, num_agents: int, obs_dim: int, action_dim: int):
        """Create default random policies if no checkpoint is available."""
        logger.info("Creating default random policies")
        self.policies = {
            f"agent_{i}": lambda obs: self._random_action(action_dim)
            for i in range(num_agents)
        }

    def _random_action(self, action_dim: int) -> Dict[str, Any]:
        """Generate random action."""
        card_idx = np.random.randint(0, min(10, action_dim))
        action_type = np.random.choice(["buy", "sell", "hold"], p=[0.3, 0.3, 0.4])
        quantity = np.random.randint(1, 5) if action_type != "hold" else 0

        return {
            "type": action_type,
            "card_idx": int(card_idx),
            "quantity": quantity,
        }

    def get_actions_for_state(
        self,
        state: Dict[str, Any],
        agent_ids: List[int],
        observations: Optional[Dict[int, np.ndarray]] = None,
    ) -> Dict[int, Dict[str, Any]]:
        """
        Get actions for all agents given current state.

        Args:
            state: Environment state
            agent_ids: List of agent identifiers
            observations: Optional pre-computed observations per agent

        Returns:
            Dictionary mapping agent_id to action
        """
        if not self._initialized:
            # Initialize with default dimensions
            obs_dim = len(state.get("card_prices", [])) * 4 + 1 + len(state.get("card_prices", []))
            action_dim = len(state.get("card_prices", []))
            self._initialize_algorithm(len(agent_ids), obs_dim, action_dim)

        actions = {}
        for agent_id in agent_ids:
            if f"agent_{agent_id}" in self.policies:
                policy = self.policies[f"agent_{agent_id}"]
                if callable(policy):
                    # Use random policy for now
                    actions[agent_id] = self._random_action(
                        len(state.get("card_prices", []))
                    )
                else:
                    # Use RLlib policy
                    obs = observations.get(agent_id) if observations else None
                    if obs is not None:
                        action = policy.compute_single_action(obs)
                        actions[agent_id] = self._action_vector_to_dict(action)
                    else:
                        actions[agent_id] = self._random_action(
                            len(state.get("card_prices", []))
                        )
            else:
                # Default random action
                actions[agent_id] = self._random_action(len(state.get("card_prices", [])))

        return actions

    def _action_vector_to_dict(self, action_vector: Any) -> Dict[str, Any]:
        """Convert action vector to dictionary format."""
        if isinstance(action_vector, (list, np.ndarray)):
            if len(action_vector) >= 2:
                return {
                    "type": ["buy", "sell", "hold"][int(action_vector[0]) % 3],
                    "card_idx": int(action_vector[1]) % 10,
                    "quantity": max(1, int(abs(action_vector[2])) if len(action_vector) > 2 else 1),
                }

        return self._random_action(10)

