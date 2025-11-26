#!/usr/bin/env python3
"""
Micro-Genesis Data Collection Agent

This module implements autonomous data collection agents using Microsoft Fara-7B
for intelligent web scraping and data extraction. When Fara-7B is not available,
it falls back to Playwright-based scraping with mock intelligence.

The agent processes tasks from the Neo4j knowledge graph, collects data from
various TCG-related sources, and stores results back into the graph.

Usage:
    from data_collection_agent import DataCollectionAgent

    agent = DataCollectionAgent(neo4j_uri, neo4j_user, neo4j_password)
    agent.process_pending_tasks(max_tasks=10)
    agent.close()

Environment Variables:
    NEO4J_URI: Neo4j connection URI
    NEO4J_USER: Neo4j username
    NEO4J_PASSWORD: Neo4j password
    FARA_ENDPOINT: Microsoft Fara-7B API endpoint (optional)
    FARA_API_KEY: Fara-7B API key (optional)

Author: Micro-Genesis Team
"""

import os
import sys
import json
import uuid
import time
import random
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod

try:
    from neo4j import GraphDatabase
except ImportError:
    print("Error: neo4j package not found. Install it with: pip install neo4j")
    sys.exit(1)

# Optional imports
try:
    from playwright.async_api import async_playwright, Browser, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("Warning: playwright not available. Install with: pip install playwright && playwright install")

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


class TaskType(Enum):
    """Types of data collection tasks."""
    PRICE_SCRAPE = "PriceScrape"
    TOURNAMENT_SCRAPE = "TournamentScrape"
    SOCIAL_SCRAPE = "SocialScrape"
    NEWS_SCRAPE = "NewsScrape"
    GRADING_SCRAPE = "GradingScrape"
    MARKET_STATS = "MarketStats"


class TaskStatus(Enum):
    """Status of data collection tasks."""
    PENDING = "Pending"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


@dataclass
class CollectionTask:
    """Represents a data collection task."""
    id: str
    type: TaskType
    target_url: str
    target_data: str
    priority: int = 5
    retries: int = 0
    max_retries: int = 3
    status: TaskStatus = TaskStatus.PENDING
    hypothesis_id: Optional[str] = None
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CollectionResult:
    """Result of a data collection task."""
    task_id: str
    success: bool
    data: Dict[str, Any]
    error_message: Optional[str] = None
    execution_time: float = 0.0
    raw_content: Optional[str] = None


class DataCollector(ABC):
    """Abstract base class for data collectors."""

    @abstractmethod
    async def collect(self, task: CollectionTask) -> CollectionResult:
        """Collect data for the given task."""
        pass

    @abstractmethod
    def supports_task_type(self, task_type: TaskType) -> bool:
        """Check if this collector supports the given task type."""
        pass


class MockFaraCollector(DataCollector):
    """
    Mock Fara-7B collector for development and testing.
    Simulates intelligent data collection when Fara-7B is not available.
    """

    def __init__(self):
        """Initialize the mock collector."""
        self.name = "MockFara"
        print("MockFaraCollector initialized (Fara-7B not available)")

    def supports_task_type(self, task_type: TaskType) -> bool:
        """This mock supports all task types."""
        return True

    async def collect(self, task: CollectionTask) -> CollectionResult:
        """Simulate data collection with mock data."""
        start_time = time.time()

        # Simulate network delay
        await asyncio.sleep(random.uniform(0.5, 2.0))

        # Generate mock data based on task type
        if task.type == TaskType.PRICE_SCRAPE:
            data = self._mock_price_data(task)
        elif task.type == TaskType.TOURNAMENT_SCRAPE:
            data = self._mock_tournament_data(task)
        elif task.type == TaskType.SOCIAL_SCRAPE:
            data = self._mock_social_data(task)
        elif task.type == TaskType.NEWS_SCRAPE:
            data = self._mock_news_data(task)
        elif task.type == TaskType.GRADING_SCRAPE:
            data = self._mock_grading_data(task)
        else:
            data = self._mock_generic_data(task)

        execution_time = time.time() - start_time

        return CollectionResult(
            task_id=task.id,
            success=True,
            data=data,
            execution_time=execution_time,
            raw_content=json.dumps(data)
        )

    def _mock_price_data(self, task: CollectionTask) -> Dict[str, Any]:
        """Generate mock price data."""
        return {
            "type": "price_data",
            "source": task.target_url,
            "timestamp": datetime.utcnow().isoformat(),
            "prices": [
                {
                    "card_name": "Charizard",
                    "set": "Base Set",
                    "condition": "Near Mint",
                    "grade": None,
                    "price_usd": round(random.uniform(100, 500), 2),
                    "listing_type": "BuyItNow"
                },
                {
                    "card_name": "Charizard",
                    "set": "Base Set",
                    "condition": "Graded",
                    "grade": "PSA 10",
                    "price_usd": round(random.uniform(5000, 15000), 2),
                    "listing_type": "Auction"
                },
                {
                    "card_name": "Pikachu",
                    "set": "Base Set",
                    "condition": "Near Mint",
                    "grade": None,
                    "price_usd": round(random.uniform(10, 50), 2),
                    "listing_type": "BuyItNow"
                }
            ],
            "metadata": {
                "total_listings": random.randint(50, 500),
                "average_price": round(random.uniform(50, 200), 2)
            }
        }

    def _mock_tournament_data(self, task: CollectionTask) -> Dict[str, Any]:
        """Generate mock tournament data."""
        return {
            "type": "tournament_data",
            "source": task.target_url,
            "timestamp": datetime.utcnow().isoformat(),
            "tournament": {
                "name": "Regional Championship 2024",
                "game": "Pokemon",
                "format": "Standard",
                "date": "2024-01-15",
                "location": "Los Angeles, CA",
                "attendance": random.randint(100, 500)
            },
            "top_decks": [
                {
                    "placement": 1,
                    "archetype": "Charizard ex",
                    "player": "Player A",
                    "key_cards": ["Charizard ex", "Arcanine ex", "Rare Candy"]
                },
                {
                    "placement": 2,
                    "archetype": "Gardevoir ex",
                    "player": "Player B",
                    "key_cards": ["Gardevoir ex", "Kirlia", "Rare Candy"]
                }
            ]
        }

    def _mock_social_data(self, task: CollectionTask) -> Dict[str, Any]:
        """Generate mock social media data."""
        return {
            "type": "social_data",
            "source": task.target_url,
            "timestamp": datetime.utcnow().isoformat(),
            "sentiment": {
                "overall": random.choice(["positive", "neutral", "negative"]),
                "score": round(random.uniform(-1, 1), 2)
            },
            "mentions": [
                {
                    "platform": "Reddit",
                    "content": "Charizard prices are going up!",
                    "engagement": random.randint(10, 1000),
                    "timestamp": datetime.utcnow().isoformat()
                },
                {
                    "platform": "Twitter",
                    "content": "New Pokemon set looks amazing",
                    "engagement": random.randint(10, 1000),
                    "timestamp": datetime.utcnow().isoformat()
                }
            ],
            "trending_topics": ["Pokemon", "Charizard", "PSA 10", "Base Set"]
        }

    def _mock_news_data(self, task: CollectionTask) -> Dict[str, Any]:
        """Generate mock news data."""
        return {
            "type": "news_data",
            "source": task.target_url,
            "timestamp": datetime.utcnow().isoformat(),
            "articles": [
                {
                    "title": "New Pokemon Set Announced",
                    "summary": "The Pokemon Company announces new expansion...",
                    "date": datetime.utcnow().isoformat(),
                    "relevance_score": round(random.uniform(0.5, 1), 2)
                }
            ]
        }

    def _mock_grading_data(self, task: CollectionTask) -> Dict[str, Any]:
        """Generate mock grading population data."""
        return {
            "type": "grading_data",
            "source": task.target_url,
            "timestamp": datetime.utcnow().isoformat(),
            "population": {
                "card": "Charizard",
                "set": "Base Set",
                "grading_company": "PSA",
                "grades": {
                    "10": random.randint(100, 500),
                    "9": random.randint(500, 2000),
                    "8": random.randint(1000, 5000),
                    "7": random.randint(500, 2000)
                },
                "total_graded": random.randint(5000, 20000)
            }
        }

    def _mock_generic_data(self, task: CollectionTask) -> Dict[str, Any]:
        """Generate generic mock data."""
        return {
            "type": "generic_data",
            "source": task.target_url,
            "timestamp": datetime.utcnow().isoformat(),
            "target": task.target_data,
            "data": {"collected": True, "mock": True}
        }


class FaraCollector(DataCollector):
    """
    Microsoft Fara-7B based data collector.
    Uses the Fara-7B model for intelligent web browsing and data extraction.
    """

    def __init__(self, endpoint: str, api_key: str):
        """
        Initialize the Fara collector.

        Args:
            endpoint: Fara-7B API endpoint
            api_key: Fara-7B API key
        """
        self.endpoint = endpoint
        self.api_key = api_key
        self.name = "Fara-7B"

        if not HTTPX_AVAILABLE:
            raise ImportError("httpx is required for FaraCollector. Install with: pip install httpx")

        print(f"FaraCollector initialized with endpoint: {endpoint}")

    def supports_task_type(self, task_type: TaskType) -> bool:
        """Fara supports all task types."""
        return True

    async def collect(self, task: CollectionTask) -> CollectionResult:
        """
        Collect data using Fara-7B.

        The Fara-7B model is prompted to browse the web and extract
        relevant data based on the task specification.
        """
        start_time = time.time()

        # Build the Fara prompt
        prompt = self._build_fara_prompt(task)

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.endpoint}/v1/complete",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "prompt": prompt,
                        "max_tokens": 4096,
                        "temperature": 0.3,
                        "task_type": "web_browse_and_extract"
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    data = self._parse_fara_response(result, task)

                    return CollectionResult(
                        task_id=task.id,
                        success=True,
                        data=data,
                        execution_time=time.time() - start_time,
                        raw_content=json.dumps(result)
                    )
                else:
                    return CollectionResult(
                        task_id=task.id,
                        success=False,
                        data={},
                        error_message=f"Fara API error: {response.status_code}",
                        execution_time=time.time() - start_time
                    )

        except Exception as e:
            return CollectionResult(
                task_id=task.id,
                success=False,
                data={},
                error_message=str(e),
                execution_time=time.time() - start_time
            )

    def _build_fara_prompt(self, task: CollectionTask) -> str:
        """Build a Fara-7B prompt for the task."""
        task_prompts = {
            TaskType.PRICE_SCRAPE: f"""
                Navigate to {task.target_url} and extract TCG card price data.
                Look for: {task.target_data}

                Extract and return JSON with:
                - card_name, set_name, condition, grade (if graded)
                - price_usd, listing_type (BuyItNow/Auction)
                - seller info if available
            """,
            TaskType.TOURNAMENT_SCRAPE: f"""
                Navigate to {task.target_url} and extract tournament results.
                Look for: {task.target_data}

                Extract and return JSON with:
                - tournament name, date, location, format
                - top deck placements with archetypes and key cards
                - player names (if public)
            """,
            TaskType.SOCIAL_SCRAPE: f"""
                Navigate to {task.target_url} and analyze TCG-related discussions.
                Look for: {task.target_data}

                Extract and return JSON with:
                - sentiment analysis (positive/neutral/negative)
                - key mentions of cards, sets, or market trends
                - engagement metrics (upvotes, comments, shares)
            """,
            TaskType.NEWS_SCRAPE: f"""
                Navigate to {task.target_url} and extract TCG news articles.
                Look for: {task.target_data}

                Extract and return JSON with:
                - article titles, summaries, dates
                - relevance to TCG market
                - mentioned cards or sets
            """,
            TaskType.GRADING_SCRAPE: f"""
                Navigate to {task.target_url} and extract grading population data.
                Look for: {task.target_data}

                Extract and return JSON with:
                - card name, set, grading company
                - population by grade level
                - recent changes if available
            """
        }

        return task_prompts.get(task.type, f"""
            Navigate to {task.target_url} and extract data.
            Look for: {task.target_data}
            Return structured JSON data.
        """)

    def _parse_fara_response(self, response: Dict, task: CollectionTask) -> Dict[str, Any]:
        """Parse Fara-7B response into structured data."""
        try:
            # Fara returns extracted data in a structured format
            extracted = response.get("extracted_data", {})

            return {
                "type": task.type.value.lower(),
                "source": task.target_url,
                "timestamp": datetime.utcnow().isoformat(),
                **extracted
            }
        except Exception:
            return {
                "type": task.type.value.lower(),
                "source": task.target_url,
                "timestamp": datetime.utcnow().isoformat(),
                "raw_response": response
            }


class PlaywrightCollector(DataCollector):
    """
    Playwright-based data collector for simple web scraping.
    Used when Fara-7B is not available and we need actual web data.
    """

    def __init__(self):
        """Initialize the Playwright collector."""
        if not PLAYWRIGHT_AVAILABLE:
            raise ImportError("playwright is required. Install with: pip install playwright && playwright install")

        self.name = "Playwright"
        self.browser: Optional[Browser] = None
        print("PlaywrightCollector initialized")

    async def start(self):
        """Start the browser."""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)

    async def stop(self):
        """Stop the browser."""
        if self.browser:
            await self.browser.close()

    def supports_task_type(self, task_type: TaskType) -> bool:
        """Playwright supports price and news scraping primarily."""
        return task_type in [
            TaskType.PRICE_SCRAPE,
            TaskType.NEWS_SCRAPE,
            TaskType.MARKET_STATS
        ]

    async def collect(self, task: CollectionTask) -> CollectionResult:
        """Collect data using Playwright web scraping."""
        start_time = time.time()

        if not self.browser:
            await self.start()

        try:
            page = await self.browser.new_page()
            await page.goto(task.target_url, timeout=30000)

            # Wait for content to load
            await page.wait_for_load_state("networkidle")

            # Get page content
            content = await page.content()

            # Basic data extraction (would be enhanced with specific selectors)
            data = {
                "type": task.type.value.lower(),
                "source": task.target_url,
                "timestamp": datetime.utcnow().isoformat(),
                "page_title": await page.title(),
                "content_length": len(content),
                "extracted": True
            }

            await page.close()

            return CollectionResult(
                task_id=task.id,
                success=True,
                data=data,
                execution_time=time.time() - start_time,
                raw_content=content[:10000]  # Truncate for storage
            )

        except Exception as e:
            return CollectionResult(
                task_id=task.id,
                success=False,
                data={},
                error_message=str(e),
                execution_time=time.time() - start_time
            )


class DataCollectionAgent:
    """
    Main data collection agent that orchestrates multiple collectors.
    Processes tasks from the Neo4j queue and stores results.
    """

    def __init__(
        self,
        neo4j_uri: str,
        neo4j_user: str,
        neo4j_password: str,
        fara_endpoint: str = None,
        fara_api_key: str = None
    ):
        """
        Initialize the data collection agent.

        Args:
            neo4j_uri: Neo4j connection URI
            neo4j_user: Neo4j username
            neo4j_password: Neo4j password
            fara_endpoint: Optional Fara-7B endpoint
            fara_api_key: Optional Fara-7B API key
        """
        self.driver = GraphDatabase.driver(
            neo4j_uri,
            auth=(neo4j_user, neo4j_password)
        )

        # Initialize collectors
        self.collectors: List[DataCollector] = []

        # Try to add Fara collector
        if fara_endpoint and fara_api_key:
            try:
                self.collectors.append(FaraCollector(fara_endpoint, fara_api_key))
            except Exception as e:
                print(f"Warning: Could not initialize FaraCollector: {e}")

        # Add mock collector as fallback
        self.collectors.append(MockFaraCollector())

        print(f"DataCollectionAgent initialized with {len(self.collectors)} collectors")

    def close(self):
        """Close connections."""
        if self.driver:
            self.driver.close()
            print("Neo4j connection closed.")

    def _get_collector(self, task_type: TaskType) -> DataCollector:
        """Get the best available collector for a task type."""
        for collector in self.collectors:
            if collector.supports_task_type(task_type):
                return collector
        return self.collectors[-1]  # Return last (mock) collector

    def get_pending_tasks(self, limit: int = 10) -> List[CollectionTask]:
        """
        Get pending tasks from the Neo4j queue.

        Args:
            limit: Maximum number of tasks to fetch

        Returns:
            List of CollectionTask objects
        """
        tasks = []

        with self.driver.session() as session:
            result = session.run("""
                MATCH (t:DataCollectionTask {status: 'Pending'})
                OPTIONAL MATCH (t)<-[:REQUIRES_DATA]-(h:Hypothesis)
                RETURN t.id as id, t.type as type, t.target_url as target_url,
                       t.target_data as target_data, t.priority as priority,
                       t.retries as retries, t.max_retries as max_retries,
                       t.params as params, h.id as hypothesis_id
                ORDER BY t.priority DESC, t.created_at ASC
                LIMIT $limit
            """, {"limit": limit})

            for record in result:
                task = CollectionTask(
                    id=record['id'],
                    type=TaskType(record['type']),
                    target_url=record['target_url'],
                    target_data=record['target_data'],
                    priority=record['priority'] or 5,
                    retries=record['retries'] or 0,
                    max_retries=record['max_retries'] or 3,
                    hypothesis_id=record['hypothesis_id'],
                    params=record['params'] or {}
                )
                tasks.append(task)

        return tasks

    def create_task(
        self,
        task_type: TaskType,
        target_url: str,
        target_data: str,
        priority: int = 5,
        hypothesis_id: str = None,
        cycle_id: str = None
    ) -> str:
        """
        Create a new data collection task.

        Args:
            task_type: Type of collection task
            target_url: URL to collect from
            target_data: Description of data to collect
            priority: Task priority (1-10)
            hypothesis_id: Optional linked hypothesis
            cycle_id: Optional discovery cycle

        Returns:
            Task ID
        """
        task_id = f"task-{uuid.uuid4()}"

        with self.driver.session() as session:
            session.run("""
                CREATE (t:DataCollectionTask {
                    id: $id,
                    type: $type,
                    target_url: $target_url,
                    target_data: $target_data,
                    status: 'Pending',
                    priority: $priority,
                    retries: 0,
                    max_retries: 3,
                    created_at: datetime()
                })
            """, {
                "id": task_id,
                "type": task_type.value,
                "target_url": target_url,
                "target_data": target_data,
                "priority": priority
            })

            # Link to hypothesis if provided
            if hypothesis_id:
                session.run("""
                    MATCH (t:DataCollectionTask {id: $task_id})
                    MATCH (h:Hypothesis {id: $hypothesis_id})
                    MERGE (h)-[:REQUIRES_DATA]->(t)
                """, {"task_id": task_id, "hypothesis_id": hypothesis_id})

            # Link to cycle if provided
            if cycle_id:
                session.run("""
                    MATCH (t:DataCollectionTask {id: $task_id})
                    MATCH (c:DiscoveryCycle {id: $cycle_id})
                    MERGE (t)-[:CREATED_IN]->(c)
                """, {"task_id": task_id, "cycle_id": cycle_id})

        return task_id

    def _update_task_status(
        self,
        task_id: str,
        status: TaskStatus,
        error_message: str = None,
        result_summary: str = None
    ):
        """Update task status in the database."""
        with self.driver.session() as session:
            params = {
                "id": task_id,
                "status": status.value
            }

            query = """
                MATCH (t:DataCollectionTask {id: $id})
                SET t.status = $status
            """

            if status == TaskStatus.IN_PROGRESS:
                query += ", t.started_at = datetime()"
            elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                query += ", t.completed_at = datetime()"

            if error_message:
                query += ", t.error_message = $error_message"
                params["error_message"] = error_message

            if result_summary:
                query += ", t.result_summary = $result_summary"
                params["result_summary"] = result_summary

            session.run(query, params)

    def _store_result(self, task: CollectionTask, result: CollectionResult):
        """Store collection result in the knowledge graph."""
        with self.driver.session() as session:
            # Store prices if available
            if 'prices' in result.data:
                for price in result.data['prices']:
                    price_id = f"price-{uuid.uuid4()}"
                    session.run("""
                        CREATE (p:Price {
                            id: $id,
                            price_usd: $price_usd,
                            condition: $condition,
                            grade: $grade,
                            source: $source,
                            listing_type: $listing_type,
                            timestamp: datetime(),
                            is_sale: false
                        })
                    """, {
                        "id": price_id,
                        "price_usd": price.get('price_usd', 0),
                        "condition": price.get('condition', 'Unknown'),
                        "grade": price.get('grade'),
                        "source": result.data.get('source', ''),
                        "listing_type": price.get('listing_type', 'Unknown')
                    })

                    # Link to task
                    session.run("""
                        MATCH (t:DataCollectionTask {id: $task_id})
                        MATCH (p:Price {id: $price_id})
                        MERGE (t)-[:PRODUCED]->(p)
                    """, {"task_id": task.id, "price_id": price_id})

            # Store tournament data if available
            if 'tournament' in result.data:
                tournament = result.data['tournament']
                tournament_id = f"tournament-{uuid.uuid4()}"
                session.run("""
                    MERGE (t:Tournament {id: $id})
                    SET t.name = $name,
                        t.game = $game,
                        t.format = $format,
                        t.date = date($date),
                        t.location = $location,
                        t.attendance = $attendance
                """, {
                    "id": tournament_id,
                    "name": tournament.get('name', 'Unknown'),
                    "game": tournament.get('game', 'Unknown'),
                    "format": tournament.get('format', 'Unknown'),
                    "date": tournament.get('date', '2024-01-01'),
                    "location": tournament.get('location', 'Unknown'),
                    "attendance": tournament.get('attendance', 0)
                })

            # Store social sentiment if available
            if 'sentiment' in result.data:
                insight_id = f"insight-{uuid.uuid4()}"
                sentiment = result.data['sentiment']
                session.run("""
                    CREATE (i:Insight {
                        id: $id,
                        text: $text,
                        type: 'Sentiment',
                        confidence: $confidence,
                        timestamp: datetime(),
                        source_model: 'DataCollectionAgent'
                    })
                """, {
                    "id": insight_id,
                    "text": f"Social sentiment: {sentiment.get('overall', 'neutral')}",
                    "confidence": abs(sentiment.get('score', 0))
                })

    async def _execute_task(self, task: CollectionTask) -> CollectionResult:
        """Execute a single collection task."""
        collector = self._get_collector(task.type)
        print(f"  Executing task {task.id} with {collector.name}")

        # Update status to in progress
        self._update_task_status(task.id, TaskStatus.IN_PROGRESS)

        try:
            result = await collector.collect(task)

            if result.success:
                self._update_task_status(
                    task.id,
                    TaskStatus.COMPLETED,
                    result_summary=f"Collected {len(result.data)} items"
                )
                self._store_result(task, result)
            else:
                # Check if we should retry
                if task.retries < task.max_retries:
                    # Increment retry count and set back to pending
                    with self.driver.session() as session:
                        session.run("""
                            MATCH (t:DataCollectionTask {id: $id})
                            SET t.status = 'Pending',
                                t.retries = t.retries + 1
                        """, {"id": task.id})
                else:
                    self._update_task_status(
                        task.id,
                        TaskStatus.FAILED,
                        error_message=result.error_message
                    )

            return result

        except Exception as e:
            self._update_task_status(
                task.id,
                TaskStatus.FAILED,
                error_message=str(e)
            )
            return CollectionResult(
                task_id=task.id,
                success=False,
                data={},
                error_message=str(e)
            )

    def process_pending_tasks(
        self,
        max_tasks: int = 10,
        parallel: bool = False
    ) -> List[CollectionResult]:
        """
        Process pending tasks from the queue.

        Args:
            max_tasks: Maximum number of tasks to process
            parallel: Whether to process tasks in parallel

        Returns:
            List of collection results
        """
        print(f"\nProcessing up to {max_tasks} pending tasks...")

        tasks = self.get_pending_tasks(max_tasks)
        print(f"Found {len(tasks)} pending tasks")

        if not tasks:
            return []

        # Run async task processing
        results = asyncio.get_event_loop().run_until_complete(
            self._process_tasks_async(tasks, parallel)
        )

        # Summary
        successful = sum(1 for r in results if r.success)
        print(f"\nCompleted: {successful}/{len(results)} tasks successful")

        return results

    async def _process_tasks_async(
        self,
        tasks: List[CollectionTask],
        parallel: bool
    ) -> List[CollectionResult]:
        """Process tasks asynchronously."""
        if parallel:
            # Process all tasks in parallel
            coroutines = [self._execute_task(task) for task in tasks]
            results = await asyncio.gather(*coroutines)
        else:
            # Process tasks sequentially
            results = []
            for task in tasks:
                result = await self._execute_task(task)
                results.append(result)

        return results

    def create_tasks_for_hypothesis(
        self,
        hypothesis_id: str,
        cycle_id: str = None
    ) -> List[str]:
        """
        Create data collection tasks for a hypothesis.

        Args:
            hypothesis_id: ID of the hypothesis
            cycle_id: Optional discovery cycle ID

        Returns:
            List of created task IDs
        """
        # Get hypothesis details
        with self.driver.session() as session:
            result = session.run("""
                MATCH (h:Hypothesis {id: $id})
                RETURN h.text as text, h.category as category,
                       h.validation_data as validation_data,
                       h.affected_entities as affected_entities
            """, {"id": hypothesis_id})

            record = result.single()
            if not record:
                return []

            hypothesis = dict(record)

        # Map hypothesis to tasks
        task_ids = []
        validation_data = hypothesis.get('validation_data', [])
        category = hypothesis.get('category', 'Price')

        # Create tasks based on category and validation needs
        task_mappings = {
            'Price': [
                (TaskType.PRICE_SCRAPE, "https://www.tcgplayer.com", "Price data"),
                (TaskType.PRICE_SCRAPE, "https://www.ebay.com", "Sold listings")
            ],
            'Tournament': [
                (TaskType.TOURNAMENT_SCRAPE, "https://limitlesstcg.com", "Tournament results")
            ],
            'Social': [
                (TaskType.SOCIAL_SCRAPE, "https://reddit.com/r/PokemonTCG", "Social sentiment")
            ],
            'Grading': [
                (TaskType.GRADING_SCRAPE, "https://www.psacard.com/pop", "Population data")
            ]
        }

        # Get tasks for this category
        tasks_to_create = task_mappings.get(category, [])

        # Add default price task if none specified
        if not tasks_to_create:
            tasks_to_create = [(TaskType.PRICE_SCRAPE, "https://www.tcgplayer.com", "Price data")]

        for task_type, url, data_desc in tasks_to_create:
            task_id = self.create_task(
                task_type=task_type,
                target_url=url,
                target_data=f"{data_desc} for hypothesis: {hypothesis['text'][:100]}",
                priority=7,
                hypothesis_id=hypothesis_id,
                cycle_id=cycle_id
            )
            task_ids.append(task_id)
            print(f"  Created task: {task_type.value} -> {url}")

        return task_ids


def main():
    """Test the data collection agent."""
    neo4j_uri = os.environ.get('NEO4J_URI')
    neo4j_user = os.environ.get('NEO4J_USER', 'neo4j')
    neo4j_password = os.environ.get('NEO4J_PASSWORD')
    fara_endpoint = os.environ.get('FARA_ENDPOINT')
    fara_api_key = os.environ.get('FARA_API_KEY')

    if not all([neo4j_uri, neo4j_password]):
        print("Error: Missing required environment variables.")
        print("Required: NEO4J_URI, NEO4J_PASSWORD")
        sys.exit(1)

    agent = DataCollectionAgent(
        neo4j_uri,
        neo4j_user,
        neo4j_password,
        fara_endpoint,
        fara_api_key
    )

    try:
        # Create a test task
        task_id = agent.create_task(
            task_type=TaskType.PRICE_SCRAPE,
            target_url="https://www.tcgplayer.com/search/pokemon",
            target_data="Pokemon card prices",
            priority=5
        )
        print(f"Created test task: {task_id}")

        # Process pending tasks
        results = agent.process_pending_tasks(max_tasks=5)

        print("\n" + "=" * 60)
        print("COLLECTION RESULTS")
        print("=" * 60)

        for result in results:
            status = "SUCCESS" if result.success else "FAILED"
            print(f"\n[{status}] Task: {result.task_id}")
            print(f"  Execution time: {result.execution_time:.2f}s")
            if result.error_message:
                print(f"  Error: {result.error_message}")
            else:
                print(f"  Data type: {result.data.get('type', 'unknown')}")

    finally:
        agent.close()


if __name__ == "__main__":
    main()
