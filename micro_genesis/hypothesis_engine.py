#!/usr/bin/env python3
"""
Micro-Genesis Hypothesis Engine

This module integrates with Claude 4.5 Opus to generate novel market hypotheses
for TCG price prediction and market analysis. It uses the knowledge graph to
provide context and stores generated hypotheses back into the graph.

Usage:
    from hypothesis_engine import HypothesisEngine

    engine = HypothesisEngine(neo4j_uri, neo4j_user, neo4j_password, anthropic_api_key)
    hypotheses = engine.generate_hypotheses(context="New Pokemon set announced")
    engine.close()

Environment Variables:
    ANTHROPIC_API_KEY: Anthropic API key for Claude access
    NEO4J_URI: Neo4j connection URI
    NEO4J_USER: Neo4j username
    NEO4J_PASSWORD: Neo4j password

Author: Micro-Genesis Team
"""

import os
import sys
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any

try:
    from neo4j import GraphDatabase
    from neo4j.exceptions import ServiceUnavailable, AuthError
except ImportError:
    print("Error: neo4j package not found. Install it with: pip install neo4j")
    sys.exit(1)

try:
    import anthropic
except ImportError:
    print("Error: anthropic package not found. Install it with: pip install anthropic")
    sys.exit(1)


# Hypothesis categories for TCG market analysis
HYPOTHESIS_CATEGORIES = [
    "Price",           # Price movement predictions
    "Tournament",      # Tournament/meta impact
    "Social",          # Social media/sentiment driven
    "Grading",         # PSA/BGS grading impact
    "Release",         # New set/product releases
    "Seasonal",        # Seasonal patterns
    "Reprint",         # Reprint/availability impact
    "Crossover",       # Cross-media events (anime, games, movies)
    "Supply",          # Supply-side factors
    "Demand",          # Demand-side factors
]

# System prompt for Claude to generate hypotheses
HYPOTHESIS_SYSTEM_PROMPT = """You are an expert TCG (Trading Card Game) market analyst specializing in price prediction and market dynamics. You have deep knowledge of:

1. **Pokemon TCG**: Card values, tournament meta, grading market, vintage vs modern
2. **Magic: The Gathering**: Reserved List, tournament formats, competitive meta
3. **Yu-Gi-Oh!**: OCG/TCG differences, ban lists, competitive scene
4. **Disney Lorcana**: New market dynamics, collector demand, enchanted cards

Your role is to generate novel, testable market hypotheses based on:
- Current market events and news
- Historical patterns and trends
- Cross-market correlations
- Social media sentiment indicators
- Tournament results and meta shifts
- Grading population data
- Supply and demand dynamics

For each hypothesis, you must provide:
1. A clear, specific, testable statement
2. Your reasoning for the hypothesis
3. A confidence score (0.0 to 1.0)
4. The category (Price, Tournament, Social, Grading, Release, Seasonal, Reprint, Crossover, Supply, Demand)
5. The timeframe (Short-term: 0-7 days, Medium-term: 7-30 days, Long-term: 30+ days)
6. Specific data points needed to validate the hypothesis
7. Specific cards, sets, or market segments affected

Always be specific and actionable. Avoid vague or untestable hypotheses.
Focus on hypotheses that can be validated with observable market data."""

HYPOTHESIS_USER_PROMPT_TEMPLATE = """Based on the following context and existing knowledge, generate {num_hypotheses} novel market hypotheses for the TCG market.

## Current Context
{context}

## Recent Market Data (from Knowledge Graph)
{market_data}

## Existing Hypotheses (avoid duplicates)
{existing_hypotheses}

## Instructions
Generate {num_hypotheses} new, unique hypotheses that:
1. Are specific and testable
2. Have clear validation criteria
3. Are different from existing hypotheses
4. Are actionable for price prediction or market analysis

Return your response as a JSON array with the following structure:
```json
[
  {{
    "text": "Specific hypothesis statement",
    "reasoning": "Your detailed reasoning",
    "confidence": 0.75,
    "category": "Price|Tournament|Social|Grading|Release|Seasonal|Reprint|Crossover|Supply|Demand",
    "timeframe": "Short-term|Medium-term|Long-term",
    "validation_data": ["List of specific data points needed"],
    "affected_entities": ["List of cards, sets, or market segments"],
    "expected_outcome": "What outcome validates this hypothesis"
  }}
]
```

Generate exactly {num_hypotheses} hypotheses."""


class HypothesisEngine:
    """
    Generates TCG market hypotheses using Claude 4.5 Opus and stores them
    in the Neo4j knowledge graph.
    """

    def __init__(
        self,
        neo4j_uri: str,
        neo4j_user: str,
        neo4j_password: str,
        anthropic_api_key: str,
        model: str = "claude-sonnet-4-20250514"
    ):
        """
        Initialize the Hypothesis Engine.

        Args:
            neo4j_uri: Neo4j connection URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
            anthropic_api_key: Anthropic API key
            model: Claude model to use (default: claude-sonnet-4-20250514)
        """
        self.neo4j_uri = neo4j_uri
        self.neo4j_user = neo4j_user
        self.neo4j_password = neo4j_password
        self.model = model

        # Initialize Neo4j driver
        self.driver = GraphDatabase.driver(
            neo4j_uri,
            auth=(neo4j_user, neo4j_password)
        )

        # Initialize Anthropic client
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)

        print(f"HypothesisEngine initialized with model: {model}")

    def close(self):
        """Close connections."""
        if self.driver:
            self.driver.close()
            print("Neo4j connection closed.")

    def _get_recent_market_data(self, limit: int = 10) -> str:
        """
        Fetch recent market data from the knowledge graph.

        Args:
            limit: Maximum number of records to fetch

        Returns:
            Formatted string of market data
        """
        market_data = []

        with self.driver.session() as session:
            # Get recent prices
            result = session.run("""
                MATCH (c:Card)-[:HAS_PRICE]->(p:Price)
                RETURN c.name as card, c.game as game,
                       p.price_usd as price, p.condition as condition,
                       p.grade as grade, p.timestamp as timestamp
                ORDER BY p.timestamp DESC
                LIMIT $limit
            """, {"limit": limit})

            prices = list(result)
            if prices:
                market_data.append("Recent Prices:")
                for record in prices:
                    grade_info = f" (Grade: {record['grade']})" if record['grade'] else ""
                    market_data.append(
                        f"  - {record['card']} ({record['game']}): "
                        f"${record['price']:.2f} {record['condition']}{grade_info}"
                    )

            # Get recent market events
            result = session.run("""
                MATCH (e:MarketEvent)
                RETURN e.title as title, e.type as type, e.date as date
                ORDER BY e.date DESC
                LIMIT $limit
            """, {"limit": limit})

            events = list(result)
            if events:
                market_data.append("\nRecent Market Events:")
                for record in events:
                    market_data.append(
                        f"  - [{record['type']}] {record['title']} ({record['date']})"
                    )

            # Get recent insights
            result = session.run("""
                MATCH (i:Insight)
                RETURN i.text as text, i.confidence as confidence
                ORDER BY i.timestamp DESC
                LIMIT $limit
            """, {"limit": limit})

            insights = list(result)
            if insights:
                market_data.append("\nRecent Insights:")
                for record in insights:
                    market_data.append(
                        f"  - [{record['confidence']:.2f}] {record['text']}"
                    )

        return "\n".join(market_data) if market_data else "No recent market data available."

    def _get_existing_hypotheses(self, limit: int = 20) -> str:
        """
        Fetch existing hypotheses from the knowledge graph.

        Args:
            limit: Maximum number of hypotheses to fetch

        Returns:
            Formatted string of existing hypotheses
        """
        hypotheses = []

        with self.driver.session() as session:
            result = session.run("""
                MATCH (h:Hypothesis)
                WHERE h.status IN ['Pending', 'InProgress', 'Validated']
                RETURN h.text as text, h.confidence as confidence,
                       h.status as status, h.category as category
                ORDER BY h.created_at DESC
                LIMIT $limit
            """, {"limit": limit})

            for record in result:
                hypotheses.append(
                    f"  - [{record['status']}] [{record['category']}] "
                    f"[{record['confidence']:.2f}] {record['text']}"
                )

        return "\n".join(hypotheses) if hypotheses else "No existing hypotheses."

    def _parse_hypothesis_response(self, response_text: str) -> List[Dict[str, Any]]:
        """
        Parse Claude's response into structured hypothesis data.

        Args:
            response_text: Raw response from Claude

        Returns:
            List of hypothesis dictionaries
        """
        # Try to extract JSON from the response
        try:
            # Look for JSON array in the response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                hypotheses = json.loads(json_str)

                # Validate and clean each hypothesis
                validated = []
                for h in hypotheses:
                    if isinstance(h, dict) and 'text' in h:
                        validated.append({
                            'text': str(h.get('text', '')),
                            'reasoning': str(h.get('reasoning', '')),
                            'confidence': float(h.get('confidence', 0.5)),
                            'category': str(h.get('category', 'Price')),
                            'timeframe': str(h.get('timeframe', 'Medium-term')),
                            'validation_data': h.get('validation_data', []),
                            'affected_entities': h.get('affected_entities', []),
                            'expected_outcome': str(h.get('expected_outcome', ''))
                        })

                return validated

        except json.JSONDecodeError as e:
            print(f"Warning: Failed to parse JSON response: {e}")

        return []

    def _store_hypothesis(self, hypothesis: Dict[str, Any], cycle_id: str) -> Optional[str]:
        """
        Store a hypothesis in the knowledge graph.

        Args:
            hypothesis: Hypothesis data dictionary
            cycle_id: ID of the discovery cycle this hypothesis belongs to

        Returns:
            Hypothesis ID if successful, None otherwise
        """
        hypothesis_id = f"hypothesis-{uuid.uuid4()}"

        with self.driver.session() as session:
            # Create the hypothesis node
            session.run("""
                CREATE (h:Hypothesis {
                    id: $id,
                    text: $text,
                    reasoning: $reasoning,
                    confidence: $confidence,
                    status: 'Pending',
                    category: $category,
                    timeframe: $timeframe,
                    validation_data: $validation_data,
                    affected_entities: $affected_entities,
                    expected_outcome: $expected_outcome,
                    created_at: datetime(),
                    updated_at: datetime()
                })
            """, {
                "id": hypothesis_id,
                "text": hypothesis['text'],
                "reasoning": hypothesis['reasoning'],
                "confidence": hypothesis['confidence'],
                "category": hypothesis['category'],
                "timeframe": hypothesis['timeframe'],
                "validation_data": hypothesis.get('validation_data', []),
                "affected_entities": hypothesis.get('affected_entities', []),
                "expected_outcome": hypothesis.get('expected_outcome', '')
            })

            # Link to discovery cycle if exists
            if cycle_id:
                session.run("""
                    MATCH (h:Hypothesis {id: $hypothesis_id})
                    MATCH (c:DiscoveryCycle {id: $cycle_id})
                    MERGE (h)-[:GENERATED_IN]->(c)
                """, {"hypothesis_id": hypothesis_id, "cycle_id": cycle_id})

        return hypothesis_id

    def generate_hypotheses(
        self,
        context: str = "",
        num_hypotheses: int = 3,
        cycle_id: str = None,
        temperature: float = 0.8,
        store_in_graph: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Generate new market hypotheses using Claude.

        Args:
            context: Current market context (news, events, etc.)
            num_hypotheses: Number of hypotheses to generate
            cycle_id: Optional discovery cycle ID to link hypotheses to
            temperature: Claude temperature parameter (higher = more creative)
            store_in_graph: Whether to store hypotheses in the knowledge graph

        Returns:
            List of generated hypothesis dictionaries
        """
        print(f"\nGenerating {num_hypotheses} hypotheses...")

        # Gather context from knowledge graph
        market_data = self._get_recent_market_data()
        existing_hypotheses = self._get_existing_hypotheses()

        # Build the user prompt
        user_prompt = HYPOTHESIS_USER_PROMPT_TEMPLATE.format(
            num_hypotheses=num_hypotheses,
            context=context if context else "No specific context provided.",
            market_data=market_data,
            existing_hypotheses=existing_hypotheses
        )

        # Call Claude
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=temperature,
                system=HYPOTHESIS_SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            response_text = message.content[0].text
            hypotheses = self._parse_hypothesis_response(response_text)

            print(f"Generated {len(hypotheses)} hypotheses")

            # Store in knowledge graph if requested
            if store_in_graph:
                for h in hypotheses:
                    h['id'] = self._store_hypothesis(h, cycle_id)
                    print(f"  - Stored: [{h['confidence']:.2f}] {h['text'][:60]}...")

            return hypotheses

        except anthropic.APIError as e:
            print(f"Error calling Claude API: {e}")
            return []

    def get_pending_hypotheses(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get pending hypotheses from the knowledge graph.

        Args:
            limit: Maximum number of hypotheses to return

        Returns:
            List of pending hypotheses
        """
        hypotheses = []

        with self.driver.session() as session:
            result = session.run("""
                MATCH (h:Hypothesis {status: 'Pending'})
                RETURN h.id as id, h.text as text, h.reasoning as reasoning,
                       h.confidence as confidence, h.category as category,
                       h.timeframe as timeframe, h.validation_data as validation_data,
                       h.affected_entities as affected_entities,
                       h.expected_outcome as expected_outcome,
                       h.created_at as created_at
                ORDER BY h.confidence DESC
                LIMIT $limit
            """, {"limit": limit})

            for record in result:
                hypotheses.append(dict(record))

        return hypotheses

    def update_hypothesis_status(
        self,
        hypothesis_id: str,
        status: str,
        validation_result: str = None,
        validation_confidence: float = None
    ) -> bool:
        """
        Update the status of a hypothesis.

        Args:
            hypothesis_id: ID of the hypothesis to update
            status: New status (Pending, InProgress, Validated, Rejected, Inconclusive)
            validation_result: Optional validation result description
            validation_confidence: Optional confidence in the validation

        Returns:
            True if successful
        """
        with self.driver.session() as session:
            params = {
                "id": hypothesis_id,
                "status": status,
                "updated_at": datetime.utcnow().isoformat()
            }

            query = """
                MATCH (h:Hypothesis {id: $id})
                SET h.status = $status,
                    h.updated_at = datetime($updated_at)
            """

            if validation_result:
                query += ", h.validation_result = $validation_result"
                params["validation_result"] = validation_result

            if validation_confidence is not None:
                query += ", h.validation_confidence = $validation_confidence"
                params["validation_confidence"] = validation_confidence

            if status in ['Validated', 'Rejected', 'Inconclusive']:
                query += ", h.validated_at = datetime()"

            session.run(query, params)

        return True

    def synthesize_insights(
        self,
        context: str = "",
        cycle_id: str = None
    ) -> List[Dict[str, Any]]:
        """
        Synthesize new insights from validated hypotheses and market data.

        Args:
            context: Current context
            cycle_id: Discovery cycle ID

        Returns:
            List of generated insights
        """
        print("\nSynthesizing insights from validated hypotheses...")

        # Get validated hypotheses
        with self.driver.session() as session:
            result = session.run("""
                MATCH (h:Hypothesis {status: 'Validated'})
                RETURN h.text as text, h.validation_result as result,
                       h.validation_confidence as confidence
                ORDER BY h.validated_at DESC
                LIMIT 10
            """)

            validated = [dict(r) for r in result]

        if not validated:
            print("No validated hypotheses to synthesize.")
            return []

        # Use Claude to synthesize insights
        synthesis_prompt = f"""Based on the following validated hypotheses, generate actionable market insights:

Validated Hypotheses:
{json.dumps(validated, indent=2)}

Context: {context}

Generate 2-3 key insights that synthesize these findings into actionable intelligence.

Return as JSON array:
```json
[
  {{
    "text": "Insight statement",
    "type": "Trend|Anomaly|Correlation|Prediction",
    "confidence": 0.85,
    "recommendations": ["List of actionable recommendations"]
  }}
]
```"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.5,
                messages=[{"role": "user", "content": synthesis_prompt}]
            )

            response_text = message.content[0].text
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1

            if start_idx != -1 and end_idx > start_idx:
                insights = json.loads(response_text[start_idx:end_idx])

                # Store insights in knowledge graph
                for insight in insights:
                    insight_id = f"insight-{uuid.uuid4()}"
                    with self.driver.session() as session:
                        session.run("""
                            CREATE (i:Insight {
                                id: $id,
                                text: $text,
                                type: $type,
                                confidence: $confidence,
                                recommendations: $recommendations,
                                timestamp: datetime(),
                                source_model: $model
                            })
                        """, {
                            "id": insight_id,
                            "text": insight.get('text', ''),
                            "type": insight.get('type', 'Insight'),
                            "confidence": insight.get('confidence', 0.5),
                            "recommendations": insight.get('recommendations', []),
                            "model": self.model
                        })

                        if cycle_id:
                            session.run("""
                                MATCH (i:Insight {id: $insight_id})
                                MATCH (c:DiscoveryCycle {id: $cycle_id})
                                MERGE (i)-[:GENERATED_IN]->(c)
                            """, {"insight_id": insight_id, "cycle_id": cycle_id})

                    insight['id'] = insight_id
                    print(f"  - Insight: {insight['text'][:60]}...")

                return insights

        except Exception as e:
            print(f"Error synthesizing insights: {e}")

        return []


def main():
    """Test the hypothesis engine."""
    # Get credentials from environment
    neo4j_uri = os.environ.get('NEO4J_URI')
    neo4j_user = os.environ.get('NEO4J_USER', 'neo4j')
    neo4j_password = os.environ.get('NEO4J_PASSWORD')
    anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')

    if not all([neo4j_uri, neo4j_password, anthropic_api_key]):
        print("Error: Missing required environment variables.")
        print("Required: NEO4J_URI, NEO4J_PASSWORD, ANTHROPIC_API_KEY")
        sys.exit(1)

    # Initialize engine
    engine = HypothesisEngine(
        neo4j_uri,
        neo4j_user,
        neo4j_password,
        anthropic_api_key
    )

    try:
        # Generate hypotheses
        context = """
        Recent news:
        - New Pokemon Scarlet & Violet expansion announced for next month
        - Pokemon World Championships happening this weekend
        - PSA grading backlog reduced, faster turnaround times expected
        """

        hypotheses = engine.generate_hypotheses(
            context=context,
            num_hypotheses=3,
            store_in_graph=True
        )

        print("\n" + "=" * 60)
        print("GENERATED HYPOTHESES")
        print("=" * 60)

        for h in hypotheses:
            print(f"\n[{h['confidence']:.2f}] [{h['category']}] [{h['timeframe']}]")
            print(f"Hypothesis: {h['text']}")
            print(f"Reasoning: {h['reasoning'][:200]}...")
            print(f"Validation needs: {', '.join(h['validation_data'][:3])}")

    finally:
        engine.close()


if __name__ == "__main__":
    main()
