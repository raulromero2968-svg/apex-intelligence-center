#!/usr/bin/env python3
"""
Micro-Genesis Neo4j Setup Script

This script initializes the Neo4j database with the required schema for the
TCG Market Intelligence System. It creates constraints, indexes, and seed data.

Usage:
    python3 setup_neo4j.py

Environment Variables:
    NEO4J_URI: Neo4j connection URI (e.g., neo4j+s://xxx.databases.neo4j.io)
    NEO4J_USER: Neo4j username (default: neo4j)
    NEO4J_PASSWORD: Neo4j password

Author: Micro-Genesis Team
"""

import os
import sys
from pathlib import Path
from typing import Optional

try:
    from neo4j import GraphDatabase
    from neo4j.exceptions import ServiceUnavailable, AuthError, ClientError
except ImportError:
    print("Error: neo4j package not found. Install it with: pip install neo4j")
    sys.exit(1)


class Neo4jSetup:
    """Handles Neo4j database setup and schema initialization."""

    def __init__(
        self,
        uri: str,
        user: str,
        password: str,
        database: str = "neo4j"
    ):
        """
        Initialize the Neo4j setup handler.

        Args:
            uri: Neo4j connection URI
            user: Neo4j username
            password: Neo4j password
            database: Database name (default: neo4j)
        """
        self.uri = uri
        self.user = user
        self.password = password
        self.database = database
        self.driver: Optional[GraphDatabase.driver] = None

    def connect(self) -> bool:
        """
        Establish connection to Neo4j database.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password)
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            print(f"Successfully connected to Neo4j at {self.uri}")
            return True
        except ServiceUnavailable as e:
            print(f"Error: Could not connect to Neo4j at {self.uri}")
            print(f"Details: {e}")
            return False
        except AuthError as e:
            print(f"Error: Authentication failed for user '{self.user}'")
            print(f"Details: {e}")
            return False
        except Exception as e:
            print(f"Error: Unexpected error connecting to Neo4j")
            print(f"Details: {e}")
            return False

    def close(self):
        """Close the Neo4j driver connection."""
        if self.driver:
            self.driver.close()
            print("Neo4j connection closed.")

    def execute_cypher(self, query: str, params: dict = None) -> bool:
        """
        Execute a Cypher query.

        Args:
            query: Cypher query string
            params: Query parameters (optional)

        Returns:
            True if successful, False otherwise
        """
        if not self.driver:
            print("Error: Not connected to Neo4j")
            return False

        try:
            with self.driver.session(database=self.database) as session:
                session.run(query, params or {})
            return True
        except ClientError as e:
            # Some errors are expected (e.g., constraint already exists)
            if "already exists" in str(e).lower():
                return True
            print(f"Error executing query: {e}")
            return False
        except Exception as e:
            print(f"Error executing query: {e}")
            return False

    def create_constraints(self) -> int:
        """
        Create uniqueness constraints for core entities.

        Returns:
            Number of constraints created
        """
        print("\nCreating constraints...")

        constraints = [
            ("hypothesis_id", "Hypothesis", "id"),
            ("task_id", "DataCollectionTask", "id"),
            ("card_id", "Card", "id"),
            ("set_id", "Set", "id"),
            ("price_id", "Price", "id"),
            ("tournament_id", "Tournament", "id"),
            ("deck_id", "Deck", "id"),
            ("source_id", "DataSource", "id"),
            ("event_id", "MarketEvent", "id"),
            ("insight_id", "Insight", "id"),
            ("cycle_id", "DiscoveryCycle", "id"),
        ]

        created = 0
        for name, label, prop in constraints:
            query = f"""
            CREATE CONSTRAINT {name} IF NOT EXISTS
            FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE
            """
            if self.execute_cypher(query):
                print(f"  - Constraint {name}: OK")
                created += 1
            else:
                print(f"  - Constraint {name}: FAILED")

        return created

    def create_indexes(self) -> int:
        """
        Create indexes for common query patterns.

        Returns:
            Number of indexes created
        """
        print("\nCreating indexes...")

        indexes = [
            ("hypothesis_status", "Hypothesis", "status"),
            ("hypothesis_confidence", "Hypothesis", "confidence"),
            ("task_status", "DataCollectionTask", "status"),
            ("task_priority", "DataCollectionTask", "priority"),
            ("card_name", "Card", "name"),
            ("card_game", "Card", "game"),
            ("card_rarity", "Card", "rarity"),
            ("price_timestamp", "Price", "timestamp"),
            ("tournament_date", "Tournament", "date"),
            ("event_date", "MarketEvent", "date"),
            ("insight_timestamp", "Insight", "timestamp"),
        ]

        created = 0
        for name, label, prop in indexes:
            query = f"""
            CREATE INDEX {name} IF NOT EXISTS
            FOR (n:{label}) ON (n.{prop})
            """
            if self.execute_cypher(query):
                print(f"  - Index {name}: OK")
                created += 1
            else:
                print(f"  - Index {name}: FAILED")

        return created

    def create_fulltext_indexes(self) -> int:
        """
        Create full-text search indexes.

        Returns:
            Number of indexes created
        """
        print("\nCreating full-text indexes...")

        # Full-text indexes require different syntax
        fulltext_indexes = [
            ("hypothesis_text", "Hypothesis", ["text", "reasoning"]),
            ("card_search", "Card", ["name", "set_name", "description"]),
            ("event_search", "MarketEvent", ["title", "description"]),
        ]

        created = 0
        for name, label, properties in fulltext_indexes:
            props_str = ", ".join([f"n.{p}" for p in properties])
            query = f"""
            CREATE FULLTEXT INDEX {name} IF NOT EXISTS
            FOR (n:{label}) ON EACH [{props_str}]
            """
            if self.execute_cypher(query):
                print(f"  - Full-text index {name}: OK")
                created += 1
            else:
                print(f"  - Full-text index {name}: FAILED")

        return created

    def create_seed_data(self) -> bool:
        """
        Create initial seed data (data sources, sample cards).

        Returns:
            True if successful
        """
        print("\nCreating seed data...")

        # Create discovery cycle
        cycle_query = """
        MERGE (cycle:DiscoveryCycle {id: 'cycle-seed-001'})
        SET cycle.cycle_number = 0,
            cycle.status = 'Completed',
            cycle.started_at = datetime(),
            cycle.completed_at = datetime(),
            cycle.hypotheses_generated = 0,
            cycle.tasks_created = 0,
            cycle.tasks_completed = 0,
            cycle.insights_generated = 0,
            cycle.context = 'System initialization'
        """
        if self.execute_cypher(cycle_query):
            print("  - Initial discovery cycle: OK")
        else:
            print("  - Initial discovery cycle: FAILED")
            return False

        # Create data sources
        sources = [
            ("source-ebay", "eBay", "Marketplace", "https://www.ebay.com", 0.85, "Hourly"),
            ("source-tcgplayer", "TCGPlayer", "Marketplace", "https://www.tcgplayer.com", 0.95, "Hourly"),
            ("source-cardmarket", "Cardmarket", "Marketplace", "https://www.cardmarket.com", 0.90, "Daily"),
            ("source-reddit", "Reddit", "SocialMedia", "https://www.reddit.com", 0.60, "Daily"),
            ("source-twitter", "Twitter/X", "SocialMedia", "https://twitter.com", 0.55, "Daily"),
            ("source-limitless", "Limitless TCG", "Tournament", "https://limitlesstcg.com", 0.98, "Daily"),
        ]

        for source_id, name, source_type, url, reliability, frequency in sources:
            query = """
            MERGE (s:DataSource {id: $id})
            SET s.name = $name,
                s.type = $type,
                s.base_url = $url,
                s.reliability_score = $reliability,
                s.scrape_frequency = $frequency
            """
            params = {
                "id": source_id,
                "name": name,
                "type": source_type,
                "url": url,
                "reliability": reliability,
                "frequency": frequency
            }
            if self.execute_cypher(query, params):
                print(f"  - Data source '{name}': OK")
            else:
                print(f"  - Data source '{name}': FAILED")

        # Create sample card and set
        set_query = """
        MERGE (s:Set {id: 'pokemon-base-set'})
        SET s.name = 'Base Set',
            s.code = 'BS',
            s.game = 'Pokemon',
            s.release_date = date('1999-01-09'),
            s.total_cards = 102,
            s.description = 'The original Pokemon Trading Card Game set'
        """
        if self.execute_cypher(set_query):
            print("  - Sample set (Base Set): OK")

        card_query = """
        MERGE (c:Card {id: 'pokemon-base-set-4-charizard'})
        SET c.name = 'Charizard',
            c.game = 'Pokemon',
            c.set_name = 'Base Set',
            c.set_code = 'BS',
            c.card_number = '4/102',
            c.rarity = 'Holo Rare',
            c.description = 'The iconic Charizard from the original Base Set',
            c.types = ['Fire', 'Flying'],
            c.release_date = date('1999-01-09'),
            c.is_graded_relevant = true
        """
        if self.execute_cypher(card_query):
            print("  - Sample card (Charizard): OK")

        # Create relationship
        rel_query = """
        MATCH (c:Card {id: 'pokemon-base-set-4-charizard'})
        MATCH (s:Set {id: 'pokemon-base-set'})
        MERGE (c)-[:BELONGS_TO]->(s)
        """
        if self.execute_cypher(rel_query):
            print("  - Card-Set relationship: OK")

        return True

    def verify_setup(self) -> dict:
        """
        Verify the setup by counting entities.

        Returns:
            Dictionary with entity counts
        """
        print("\nVerifying setup...")

        counts = {}
        labels = [
            "DiscoveryCycle",
            "DataSource",
            "Card",
            "Set",
            "Hypothesis",
            "DataCollectionTask",
            "Price",
            "Tournament",
        ]

        if not self.driver:
            return counts

        with self.driver.session(database=self.database) as session:
            for label in labels:
                result = session.run(f"MATCH (n:{label}) RETURN count(n) as count")
                record = result.single()
                counts[label] = record["count"] if record else 0
                print(f"  - {label}: {counts[label]}")

        return counts

    def run_full_setup(self) -> bool:
        """
        Run the complete setup process.

        Returns:
            True if setup successful
        """
        print("=" * 60)
        print("MICRO-GENESIS NEO4J SETUP")
        print("=" * 60)

        if not self.connect():
            return False

        try:
            # Create schema
            constraints = self.create_constraints()
            indexes = self.create_indexes()
            fulltext = self.create_fulltext_indexes()

            print(f"\nSchema created: {constraints} constraints, {indexes} indexes, {fulltext} full-text indexes")

            # Create seed data
            if not self.create_seed_data():
                print("\nWarning: Some seed data may not have been created")

            # Verify setup
            counts = self.verify_setup()

            print("\n" + "=" * 60)
            print("SETUP COMPLETE")
            print("=" * 60)
            print(f"\nTotal entities: {sum(counts.values())}")
            print("\nYou can now run the Micro-Genesis orchestrator:")
            print("  python3 orchestrator.py")

            return True

        finally:
            self.close()


def get_env_or_prompt(var_name: str, prompt: str, required: bool = True, default: str = None) -> str:
    """
    Get value from environment variable or prompt user.

    Args:
        var_name: Environment variable name
        prompt: Prompt to show user if env var not set
        required: Whether the value is required
        default: Default value if not provided

    Returns:
        The value
    """
    value = os.environ.get(var_name)

    if value:
        return value

    if default:
        user_input = input(f"{prompt} [{default}]: ").strip()
        return user_input if user_input else default
    elif required:
        while True:
            user_input = input(f"{prompt}: ").strip()
            if user_input:
                return user_input
            print("This value is required. Please enter a value.")
    else:
        return input(f"{prompt}: ").strip()


def main():
    """Main entry point for the setup script."""
    print("\nMicro-Genesis Neo4j Setup")
    print("-" * 40)

    # Get connection details
    uri = get_env_or_prompt(
        "NEO4J_URI",
        "Enter Neo4j URI (e.g., neo4j+s://xxx.databases.neo4j.io)"
    )

    user = get_env_or_prompt(
        "NEO4J_USER",
        "Enter Neo4j username",
        default="neo4j"
    )

    password = get_env_or_prompt(
        "NEO4J_PASSWORD",
        "Enter Neo4j password"
    )

    # Run setup
    setup = Neo4jSetup(uri, user, password)
    success = setup.run_full_setup()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
