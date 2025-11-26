#!/usr/bin/env python3
"""
Micro-Genesis Orchestrator

This module implements the closed-loop discovery orchestrator that coordinates
the entire TCG Market Intelligence pipeline:

1. Hypothesis Generation (Claude 4.5 Opus)
2. Data Collection Tasking
3. Autonomous Data Collection (Fara-7B)
4. Knowledge Graph Ingestion (Neo4j)
5. Knowledge Synthesis & Validation
6. New Hypothesis Generation (closes the loop)

Usage:
    python3 orchestrator.py

    Or programmatically:
    from orchestrator import MicroGenesisOrchestrator

    orchestrator = MicroGenesisOrchestrator(
        neo4j_uri, neo4j_user, neo4j_password, anthropic_api_key
    )
    orchestrator.run_discovery_cycle(context="Recent market news")
    orchestrator.close()

Environment Variables:
    NEO4J_URI: Neo4j connection URI
    NEO4J_USER: Neo4j username
    NEO4J_PASSWORD: Neo4j password
    ANTHROPIC_API_KEY: Anthropic API key for Claude
    FARA_ENDPOINT: Microsoft Fara-7B endpoint (optional)
    FARA_API_KEY: Fara-7B API key (optional)

Author: Micro-Genesis Team
"""

import os
import sys
import uuid
import time
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    from neo4j import GraphDatabase
except ImportError:
    print("Error: neo4j package not found. Install it with: pip install neo4j")
    sys.exit(1)

# Import internal modules
from hypothesis_engine import HypothesisEngine
from data_collection_agent import DataCollectionAgent, TaskType


class DiscoveryCycle:
    """Represents a single discovery cycle in the closed-loop system."""

    def __init__(
        self,
        cycle_id: str,
        cycle_number: int,
        context: str = ""
    ):
        """
        Initialize a discovery cycle.

        Args:
            cycle_id: Unique cycle identifier
            cycle_number: Sequential cycle number
            context: Initial context for this cycle
        """
        self.id = cycle_id
        self.cycle_number = cycle_number
        self.context = context
        self.status = "Running"
        self.started_at = datetime.utcnow()
        self.completed_at: Optional[datetime] = None

        # Metrics
        self.hypotheses_generated = 0
        self.tasks_created = 0
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.insights_generated = 0
        self.hypotheses_validated = 0
        self.hypotheses_rejected = 0


class MicroGenesisOrchestrator:
    """
    Main orchestrator for the Micro-Genesis TCG Market Intelligence System.
    Coordinates the closed-loop discovery process.
    """

    def __init__(
        self,
        neo4j_uri: str,
        neo4j_user: str,
        neo4j_password: str,
        anthropic_api_key: str,
        fara_endpoint: str = None,
        fara_api_key: str = None,
        claude_model: str = "claude-sonnet-4-20250514"
    ):
        """
        Initialize the orchestrator.

        Args:
            neo4j_uri: Neo4j connection URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
            anthropic_api_key: Anthropic API key
            fara_endpoint: Optional Fara-7B endpoint
            fara_api_key: Optional Fara-7B API key
            claude_model: Claude model to use for hypothesis generation
        """
        self.neo4j_uri = neo4j_uri
        self.neo4j_user = neo4j_user
        self.neo4j_password = neo4j_password

        # Initialize Neo4j driver
        self.driver = GraphDatabase.driver(
            neo4j_uri,
            auth=(neo4j_user, neo4j_password)
        )

        # Initialize sub-components
        self.hypothesis_engine = HypothesisEngine(
            neo4j_uri,
            neo4j_user,
            neo4j_password,
            anthropic_api_key,
            model=claude_model
        )

        self.data_agent = DataCollectionAgent(
            neo4j_uri,
            neo4j_user,
            neo4j_password,
            fara_endpoint,
            fara_api_key
        )

        self.current_cycle: Optional[DiscoveryCycle] = None

        print("=" * 60)
        print("MICRO-GENESIS ORCHESTRATOR INITIALIZED")
        print("=" * 60)
        print(f"Neo4j: {neo4j_uri}")
        print(f"Claude Model: {claude_model}")
        print(f"Fara-7B: {'Enabled' if fara_endpoint else 'Disabled (using mock)'}")
        print("=" * 60)

    def close(self):
        """Close all connections."""
        if self.hypothesis_engine:
            self.hypothesis_engine.close()
        if self.data_agent:
            self.data_agent.close()
        if self.driver:
            self.driver.close()
        print("\nOrchestrator connections closed.")

    def _get_next_cycle_number(self) -> int:
        """Get the next cycle number from the database."""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (c:DiscoveryCycle)
                RETURN max(c.cycle_number) as max_cycle
            """)
            record = result.single()
            max_cycle = record['max_cycle'] if record and record['max_cycle'] else 0
            return max_cycle + 1

    def _create_cycle(self, context: str = "") -> DiscoveryCycle:
        """Create a new discovery cycle in the database."""
        cycle_number = self._get_next_cycle_number()
        cycle_id = f"cycle-{uuid.uuid4()}"

        cycle = DiscoveryCycle(cycle_id, cycle_number, context)

        with self.driver.session() as session:
            session.run("""
                CREATE (c:DiscoveryCycle {
                    id: $id,
                    cycle_number: $cycle_number,
                    status: 'Running',
                    started_at: datetime(),
                    hypotheses_generated: 0,
                    tasks_created: 0,
                    tasks_completed: 0,
                    insights_generated: 0,
                    context: $context
                })
            """, {
                "id": cycle_id,
                "cycle_number": cycle_number,
                "context": context
            })

            # Link to previous cycle if exists
            if cycle_number > 1:
                session.run("""
                    MATCH (c1:DiscoveryCycle {cycle_number: $prev})
                    MATCH (c2:DiscoveryCycle {id: $current})
                    MERGE (c1)-[:NEXT]->(c2)
                    MERGE (c2)-[:PREVIOUS]->(c1)
                """, {"prev": cycle_number - 1, "current": cycle_id})

        return cycle

    def _update_cycle(self, cycle: DiscoveryCycle):
        """Update cycle metrics in the database."""
        with self.driver.session() as session:
            session.run("""
                MATCH (c:DiscoveryCycle {id: $id})
                SET c.status = $status,
                    c.hypotheses_generated = $hypotheses_generated,
                    c.tasks_created = $tasks_created,
                    c.tasks_completed = $tasks_completed,
                    c.insights_generated = $insights_generated,
                    c.completed_at = CASE WHEN $status = 'Completed' THEN datetime() ELSE c.completed_at END
            """, {
                "id": cycle.id,
                "status": cycle.status,
                "hypotheses_generated": cycle.hypotheses_generated,
                "tasks_created": cycle.tasks_created,
                "tasks_completed": cycle.tasks_completed,
                "insights_generated": cycle.insights_generated
            })

    def _phase_1_generate_hypotheses(
        self,
        cycle: DiscoveryCycle,
        num_hypotheses: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Phase 1: Generate new hypotheses using Claude.

        Args:
            cycle: Current discovery cycle
            num_hypotheses: Number of hypotheses to generate

        Returns:
            List of generated hypotheses
        """
        print("\n" + "-" * 60)
        print("PHASE 1: HYPOTHESIS GENERATION")
        print("-" * 60)

        hypotheses = self.hypothesis_engine.generate_hypotheses(
            context=cycle.context,
            num_hypotheses=num_hypotheses,
            cycle_id=cycle.id,
            store_in_graph=True
        )

        cycle.hypotheses_generated = len(hypotheses)
        self._update_cycle(cycle)

        print(f"\nGenerated {len(hypotheses)} hypotheses")
        return hypotheses

    def _phase_2_create_tasks(
        self,
        cycle: DiscoveryCycle,
        hypotheses: List[Dict[str, Any]]
    ) -> int:
        """
        Phase 2: Create data collection tasks for hypotheses.

        Args:
            cycle: Current discovery cycle
            hypotheses: List of hypotheses to create tasks for

        Returns:
            Number of tasks created
        """
        print("\n" + "-" * 60)
        print("PHASE 2: TASK CREATION")
        print("-" * 60)

        total_tasks = 0

        for hypothesis in hypotheses:
            hypothesis_id = hypothesis.get('id')
            if not hypothesis_id:
                continue

            task_ids = self.data_agent.create_tasks_for_hypothesis(
                hypothesis_id=hypothesis_id,
                cycle_id=cycle.id
            )
            total_tasks += len(task_ids)

        cycle.tasks_created = total_tasks
        self._update_cycle(cycle)

        print(f"\nCreated {total_tasks} data collection tasks")
        return total_tasks

    def _phase_3_collect_data(
        self,
        cycle: DiscoveryCycle,
        max_tasks: int = 20
    ) -> int:
        """
        Phase 3: Execute data collection tasks.

        Args:
            cycle: Current discovery cycle
            max_tasks: Maximum tasks to process

        Returns:
            Number of tasks completed
        """
        print("\n" + "-" * 60)
        print("PHASE 3: DATA COLLECTION")
        print("-" * 60)

        results = self.data_agent.process_pending_tasks(max_tasks=max_tasks)

        completed = sum(1 for r in results if r.success)
        failed = sum(1 for r in results if not r.success)

        cycle.tasks_completed = completed
        cycle.tasks_failed = failed
        self._update_cycle(cycle)

        print(f"\nCompleted {completed} tasks, {failed} failed")
        return completed

    def _phase_4_validate_hypotheses(self, cycle: DiscoveryCycle) -> int:
        """
        Phase 4: Validate hypotheses based on collected data.

        This is a simplified validation that checks if we have
        enough data to support or reject each hypothesis.

        Args:
            cycle: Current discovery cycle

        Returns:
            Number of hypotheses validated
        """
        print("\n" + "-" * 60)
        print("PHASE 4: HYPOTHESIS VALIDATION")
        print("-" * 60)

        validated_count = 0

        # Get pending hypotheses from this cycle
        with self.driver.session() as session:
            result = session.run("""
                MATCH (h:Hypothesis {status: 'Pending'})-[:GENERATED_IN]->(c:DiscoveryCycle {id: $cycle_id})
                OPTIONAL MATCH (h)-[:REQUIRES_DATA]->(t:DataCollectionTask)
                WITH h, collect(t) as tasks
                RETURN h.id as id, h.text as text, h.confidence as confidence,
                       size([t IN tasks WHERE t.status = 'Completed']) as completed_tasks,
                       size(tasks) as total_tasks
            """, {"cycle_id": cycle.id})

            hypotheses = list(result)

        for record in hypotheses:
            hypothesis_id = record['id']
            completed_tasks = record['completed_tasks']
            total_tasks = record['total_tasks']

            # Simple validation: if most tasks completed, mark as validated
            # In a real system, this would involve actual data analysis
            if total_tasks > 0 and completed_tasks / total_tasks >= 0.5:
                # Mark as validated (simplified)
                validation_result = "Data collection successful, hypothesis pending deeper analysis"
                self.hypothesis_engine.update_hypothesis_status(
                    hypothesis_id,
                    "Validated",
                    validation_result=validation_result,
                    validation_confidence=record['confidence'] * 0.9
                )
                validated_count += 1
                print(f"  Validated: {record['text'][:50]}...")

        cycle.hypotheses_validated = validated_count
        self._update_cycle(cycle)

        print(f"\nValidated {validated_count} hypotheses")
        return validated_count

    def _phase_5_synthesize_insights(self, cycle: DiscoveryCycle) -> int:
        """
        Phase 5: Synthesize insights from validated hypotheses and data.

        Args:
            cycle: Current discovery cycle

        Returns:
            Number of insights generated
        """
        print("\n" + "-" * 60)
        print("PHASE 5: INSIGHT SYNTHESIS")
        print("-" * 60)

        insights = self.hypothesis_engine.synthesize_insights(
            context=cycle.context,
            cycle_id=cycle.id
        )

        cycle.insights_generated = len(insights)
        self._update_cycle(cycle)

        print(f"\nGenerated {len(insights)} insights")
        return len(insights)

    def run_discovery_cycle(
        self,
        context: str = "",
        num_hypotheses: int = 3,
        max_collection_tasks: int = 20
    ) -> DiscoveryCycle:
        """
        Run a complete discovery cycle.

        Args:
            context: Market context (news, events, etc.)
            num_hypotheses: Number of hypotheses to generate
            max_collection_tasks: Maximum collection tasks to process

        Returns:
            Completed DiscoveryCycle object
        """
        print("\n" + "=" * 60)
        print("STARTING DISCOVERY CYCLE")
        print("=" * 60)
        print(f"Context: {context[:100] if context else 'No specific context'}")

        # Create new cycle
        cycle = self._create_cycle(context)
        self.current_cycle = cycle

        print(f"\nCycle ID: {cycle.id}")
        print(f"Cycle Number: {cycle.cycle_number}")

        try:
            # Phase 1: Generate hypotheses
            hypotheses = self._phase_1_generate_hypotheses(cycle, num_hypotheses)

            # Phase 2: Create tasks
            if hypotheses:
                self._phase_2_create_tasks(cycle, hypotheses)

            # Phase 3: Collect data
            self._phase_3_collect_data(cycle, max_collection_tasks)

            # Phase 4: Validate hypotheses
            self._phase_4_validate_hypotheses(cycle)

            # Phase 5: Synthesize insights
            self._phase_5_synthesize_insights(cycle)

            # Mark cycle as completed
            cycle.status = "Completed"
            cycle.completed_at = datetime.utcnow()
            self._update_cycle(cycle)

        except Exception as e:
            print(f"\nError during discovery cycle: {e}")
            cycle.status = "Failed"
            self._update_cycle(cycle)
            raise

        # Print summary
        self._print_cycle_summary(cycle)

        return cycle

    def run_continuous_discovery(
        self,
        cycles: int = 5,
        context: str = "",
        delay_between_cycles: int = 60,
        num_hypotheses_per_cycle: int = 3
    ):
        """
        Run multiple discovery cycles continuously.

        Args:
            cycles: Number of cycles to run
            context: Initial market context
            delay_between_cycles: Seconds to wait between cycles
            num_hypotheses_per_cycle: Hypotheses to generate per cycle
        """
        print("\n" + "=" * 60)
        print(f"STARTING CONTINUOUS DISCOVERY ({cycles} cycles)")
        print("=" * 60)

        for i in range(cycles):
            print(f"\n>>> Starting Cycle {i + 1}/{cycles}")

            try:
                self.run_discovery_cycle(
                    context=context,
                    num_hypotheses=num_hypotheses_per_cycle
                )
            except Exception as e:
                print(f"Cycle {i + 1} failed: {e}")
                continue

            if i < cycles - 1:
                print(f"\nWaiting {delay_between_cycles}s before next cycle...")
                time.sleep(delay_between_cycles)

        print("\n" + "=" * 60)
        print("CONTINUOUS DISCOVERY COMPLETE")
        print("=" * 60)

    def _print_cycle_summary(self, cycle: DiscoveryCycle):
        """Print a summary of the completed cycle."""
        print("\n" + "=" * 60)
        print("CYCLE SUMMARY")
        print("=" * 60)
        print(f"Cycle ID: {cycle.id}")
        print(f"Cycle Number: {cycle.cycle_number}")
        print(f"Status: {cycle.status}")
        print(f"Duration: {(cycle.completed_at - cycle.started_at).total_seconds():.2f}s" if cycle.completed_at else "N/A")
        print("-" * 60)
        print(f"Hypotheses Generated: {cycle.hypotheses_generated}")
        print(f"Tasks Created: {cycle.tasks_created}")
        print(f"Tasks Completed: {cycle.tasks_completed}")
        print(f"Tasks Failed: {cycle.tasks_failed}")
        print(f"Hypotheses Validated: {cycle.hypotheses_validated}")
        print(f"Insights Generated: {cycle.insights_generated}")
        print("=" * 60)

    def get_system_status(self) -> Dict[str, Any]:
        """
        Get current system status from the knowledge graph.

        Returns:
            Dictionary with system status metrics
        """
        status = {
            "hypotheses": {},
            "tasks": {},
            "knowledge_graph": {},
            "cycles": {}
        }

        with self.driver.session() as session:
            # Hypothesis counts
            result = session.run("""
                MATCH (h:Hypothesis)
                RETURN h.status as status, count(*) as count
            """)
            for record in result:
                status["hypotheses"][record['status']] = record['count']

            # Task counts
            result = session.run("""
                MATCH (t:DataCollectionTask)
                RETURN t.status as status, count(*) as count
            """)
            for record in result:
                status["tasks"][record['status']] = record['count']

            # Knowledge graph counts
            labels = ["Card", "Price", "Tournament", "Insight", "MarketEvent"]
            for label in labels:
                result = session.run(f"MATCH (n:{label}) RETURN count(n) as count")
                record = result.single()
                status["knowledge_graph"][label] = record['count'] if record else 0

            # Cycle counts
            result = session.run("""
                MATCH (c:DiscoveryCycle)
                RETURN c.status as status, count(*) as count
            """)
            for record in result:
                status["cycles"][record['status']] = record['count']

        return status

    def print_system_status(self):
        """Print the current system status."""
        status = self.get_system_status()

        print("\n" + "=" * 80)
        print("MICRO-GENESIS SYSTEM STATUS")
        print("=" * 80)

        print("\nHypotheses:")
        for state, count in status["hypotheses"].items():
            print(f"  - {state}: {count}")

        print("\nData Collection Tasks:")
        for state, count in status["tasks"].items():
            print(f"  - {state}: {count}")

        print("\nKnowledge Graph Data:")
        for entity, count in status["knowledge_graph"].items():
            print(f"  - {entity}: {count}")

        print("\nDiscovery Cycles:")
        for state, count in status["cycles"].items():
            print(f"  - {state}: {count}")

        print("\n" + "=" * 80)


def main():
    """Main entry point for the orchestrator."""
    # Get credentials from environment
    neo4j_uri = os.environ.get('NEO4J_URI')
    neo4j_user = os.environ.get('NEO4J_USER', 'neo4j')
    neo4j_password = os.environ.get('NEO4J_PASSWORD')
    anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')
    fara_endpoint = os.environ.get('FARA_ENDPOINT')
    fara_api_key = os.environ.get('FARA_API_KEY')

    if not all([neo4j_uri, neo4j_password, anthropic_api_key]):
        print("Error: Missing required environment variables.")
        print("Required: NEO4J_URI, NEO4J_PASSWORD, ANTHROPIC_API_KEY")
        print("\nOptional: FARA_ENDPOINT, FARA_API_KEY")
        sys.exit(1)

    # Initialize orchestrator
    orchestrator = MicroGenesisOrchestrator(
        neo4j_uri,
        neo4j_user,
        neo4j_password,
        anthropic_api_key,
        fara_endpoint,
        fara_api_key
    )

    try:
        # Print initial status
        orchestrator.print_system_status()

        # Run a discovery cycle
        context = """
        Current market context:
        - New Pokemon Scarlet & Violet expansion releasing next month
        - PSA grading turnaround times have decreased
        - Recent tournament results showing Charizard ex dominance
        - eBay reporting increased TCG card sales
        """

        orchestrator.run_discovery_cycle(
            context=context,
            num_hypotheses=3,
            max_collection_tasks=10
        )

        # Print final status
        orchestrator.print_system_status()

    finally:
        orchestrator.close()


if __name__ == "__main__":
    main()
