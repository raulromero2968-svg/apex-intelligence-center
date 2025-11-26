# Micro-Genesis Architecture

This document describes the technical architecture of the Micro-Genesis TCG Market Intelligence System.

## System Overview

Micro-Genesis implements a **closed-loop autonomous discovery system** inspired by scientific research pipelines. The system continuously generates hypotheses, collects data to test them, validates results, and generates new hypotheses based on findings.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MICRO-GENESIS ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        ORCHESTRATION LAYER                              │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Discovery Cycle Manager                        │  │ │
│  │  │   • Cycle state management                                        │  │ │
│  │  │   • Phase coordination                                            │  │ │
│  │  │   • Error handling & recovery                                     │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│  ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐   │
│  │   HYPOTHESIS ENGINE   │ │  DATA COLLECTION │ │  KNOWLEDGE GRAPH     │   │
│  │                       │ │  AGENT           │ │  (Neo4j)             │   │
│  │ • Claude 4.5 Opus     │ │                  │ │                      │   │
│  │ • Hypothesis          │ │ • Fara-7B        │ │ • Cards              │   │
│  │   generation          │ │ • Playwright     │ │ • Prices             │   │
│  │ • Insight synthesis   │ │ • Mock collector │ │ • Tournaments        │   │
│  │ • Validation logic    │ │ • Task queue     │ │ • Hypotheses         │   │
│  └──────────────────────┘ └──────────────────┘ │ • Tasks              │   │
│                                                  │ • Insights           │   │
│                                                  └──────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Orchestrator (`orchestrator.py`)

The orchestrator is the central coordinator that manages the discovery cycle.

**Responsibilities:**
- Create and manage discovery cycles
- Coordinate between hypothesis engine and data collection agents
- Track cycle metrics and status
- Handle errors and recovery

**Key Classes:**
- `DiscoveryCycle`: Represents a single discovery cycle with metrics
- `MicroGenesisOrchestrator`: Main orchestrator class

**Discovery Cycle Phases:**
1. **Phase 1**: Generate hypotheses using Claude
2. **Phase 2**: Create data collection tasks
3. **Phase 3**: Execute data collection
4. **Phase 4**: Validate hypotheses
5. **Phase 5**: Synthesize insights

### 2. Hypothesis Engine (`hypothesis_engine.py`)

The hypothesis engine uses Claude 4.5 Opus to generate and validate market hypotheses.

**Capabilities:**
- Generate novel, testable hypotheses
- Categorize hypotheses (Price, Tournament, Social, etc.)
- Assign confidence scores
- Synthesize insights from validated hypotheses

**Hypothesis Categories:**
- `Price`: Price movement predictions
- `Tournament`: Tournament/meta impact
- `Social`: Social media/sentiment driven
- `Grading`: PSA/BGS grading impact
- `Release`: New set/product releases
- `Seasonal`: Seasonal patterns
- `Reprint`: Reprint/availability impact
- `Crossover`: Cross-media events
- `Supply`: Supply-side factors
- `Demand`: Demand-side factors

**Hypothesis Lifecycle:**
```
Pending → InProgress → Validated/Rejected/Inconclusive
```

### 3. Data Collection Agent (`data_collection_agent.py`)

The data collection agent manages autonomous web scraping and data extraction.

**Collector Types:**
- `FaraCollector`: Microsoft Fara-7B for intelligent extraction
- `PlaywrightCollector`: Browser-based scraping
- `MockFaraCollector`: Development/testing fallback

**Task Types:**
- `PriceScrape`: Collect price data from marketplaces
- `TournamentScrape`: Collect tournament results
- `SocialScrape`: Monitor social media sentiment
- `NewsScrape`: Collect TCG news articles
- `GradingScrape`: Collect grading population data
- `MarketStats`: General market statistics

**Task Lifecycle:**
```
Pending → InProgress → Completed/Failed
                    ↓
              (Retry if < max_retries)
```

### 4. Knowledge Graph (Neo4j)

Neo4j stores all data in a connected graph structure.

**Node Types:**
- `Hypothesis`: Generated market hypotheses
- `DataCollectionTask`: Tasks for data collection
- `Card`: TCG card data
- `Set`: TCG set data
- `Price`: Price data points
- `Tournament`: Tournament events
- `Deck`: Tournament deck data
- `DataSource`: Data source metadata
- `MarketEvent`: Market-affecting events
- `Insight`: AI-generated insights
- `DiscoveryCycle`: Discovery cycle records

**Key Relationships:**
```
(Hypothesis)-[:GENERATED_IN]->(DiscoveryCycle)
(Hypothesis)-[:REQUIRES_DATA]->(DataCollectionTask)
(Hypothesis)-[:VALIDATED_BY]->(Insight)
(Card)-[:BELONGS_TO]->(Set)
(Card)-[:HAS_PRICE]->(Price)
(Card)-[:PLAYED_IN]->(Deck)
(Tournament)-[:FEATURED]->(Deck)
(DataCollectionTask)-[:PRODUCED]->(Price)
```

## Data Flow

### Discovery Cycle Flow

```
┌─────────────────┐
│ Start Cycle     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Get Context     │────▶│ Knowledge Graph │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Claude 4.5 Opus │────▶│ Generate        │
│                 │     │ Hypotheses      │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Create Tasks    │────▶│ Task Queue      │
│                 │     │ (Neo4j)         │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Fara-7B Agents  │────▶│ Collect Data    │
│                 │     │                 │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Store Results   │────▶│ Knowledge Graph │
│                 │     │                 │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Validate        │
│ Hypotheses      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Synthesize      │────▶│ New Insights    │
│ Insights        │     │                 │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ End Cycle       │
│ (Loop to Start) │
└─────────────────┘
```

### Hypothesis Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    HYPOTHESIS GENERATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input Context                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • User-provided context (news, events)                    │   │
│  │ • Recent market data from Neo4j                           │   │
│  │ • Existing hypotheses (to avoid duplicates)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Claude 4.5 Opus                         │   │
│  │  System Prompt: TCG market expert                         │   │
│  │  Task: Generate N testable hypotheses                     │   │
│  │  Output: JSON array with structured data                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  Output Hypotheses                                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • text: Hypothesis statement                              │   │
│  │ • reasoning: Claude's reasoning                           │   │
│  │ • confidence: 0.0 - 1.0                                   │   │
│  │ • category: Price, Tournament, Social, etc.               │   │
│  │ • timeframe: Short/Medium/Long-term                       │   │
│  │ • validation_data: Required data points                   │   │
│  │ • affected_entities: Cards, sets, segments                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### External APIs

1. **Anthropic Claude API**
   - Endpoint: `https://api.anthropic.com/v1/messages`
   - Model: `claude-sonnet-4-20250514` (default)
   - Used for: Hypothesis generation, insight synthesis

2. **Microsoft Fara-7B** (Optional)
   - Custom endpoint configuration
   - Used for: Intelligent web browsing and data extraction
   - Fallback: MockFaraCollector for development

3. **Neo4j AuraDB**
   - Protocol: `neo4j+s://`
   - Used for: Knowledge graph storage

### Data Sources

The system can collect data from:
- **Marketplaces**: eBay, TCGPlayer, Cardmarket
- **Social Media**: Reddit, Twitter/X
- **Tournament Sites**: Limitless TCG, official sites
- **Grading Services**: PSA, BGS population reports

## Scalability Considerations

### Current Design

- Single-process orchestration
- Sequential hypothesis validation
- Limited parallelism in data collection

### Future Enhancements

1. **Distributed Task Queue**
   - Replace Neo4j task queue with Redis/RabbitMQ
   - Enable multiple worker processes

2. **Parallel Hypothesis Processing**
   - Process multiple hypotheses concurrently
   - Implement batch validation

3. **Streaming Data Collection**
   - Real-time price monitoring
   - WebSocket connections to marketplaces

4. **Caching Layer**
   - Redis caching for frequently accessed data
   - Reduce Neo4j query load

## Error Handling

### Task Retry Logic

```python
max_retries = 3
retry_delay = exponential_backoff(attempt)

if task.retries < max_retries:
    task.status = "Pending"
    task.retries += 1
else:
    task.status = "Failed"
```

### Cycle Recovery

```python
try:
    run_discovery_cycle()
except Exception as e:
    cycle.status = "Failed"
    log_error(e)
    # Next cycle starts fresh
```

## Security Considerations

1. **API Key Management**
   - Environment variables for all secrets
   - No hardcoded credentials

2. **Web Scraping**
   - Respect robots.txt
   - Rate limiting on requests
   - User-agent identification

3. **Data Privacy**
   - No personal data collection
   - Public market data only

## Monitoring & Observability

### Metrics Tracked

- Hypotheses generated per cycle
- Tasks completed/failed per cycle
- Cycle duration
- Knowledge graph entity counts

### Logging

- Structured logging with `structlog`
- Per-component log levels
- Correlation IDs for tracing

### Health Checks

```python
orchestrator.get_system_status()
# Returns counts for all entity types
```

## Future Architecture

### Planned Enhancements

1. **API Layer**
   - REST API for external access
   - WebSocket for real-time updates

2. **UI Dashboard**
   - React-based monitoring UI
   - Real-time hypothesis tracking

3. **Alert System**
   - Price movement alerts
   - Hypothesis validation notifications

4. **Model Selection**
   - Dynamic model selection based on task
   - Cost optimization for API usage
