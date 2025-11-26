# Micro-Genesis: TCG Market Intelligence System

A closed-loop discovery framework for autonomous Trading Card Game market research and price prediction.

Micro-Genesis is inspired by the DOE Genesis Mission and adapts its autonomous research ecosystem for the TCG market. The system combines Claude 4.5 Opus for hypothesis generation, Microsoft Fara-7B for autonomous data collection, and Neo4j for knowledge graph storage.

## Overview

Micro-Genesis operates in a continuous, closed-loop cycle:

```
1. Hypothesis Generation (Claude 4.5 Opus)
   ↓
2. Data Collection Tasking (Orchestrator)
   ↓
3. Autonomous Data Collection (Fara-7B)
   ↓
4. Knowledge Graph Ingestion (Neo4j)
   ↓
5. Knowledge Synthesis & Validation (Orchestrator)
   ↓
6. New Hypothesis Generation (closes the loop)
```

## Architecture

### Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Ideation Engine | Anthropic Claude 4.5 Opus | Generates novel market hypotheses |
| Data Collection Agents | Microsoft Fara-7B | Autonomously collects data from web sources |
| Knowledge Hub | Neo4j | Stores and connects all data in a graph database |
| Orchestration Layer | Python | Manages the closed-loop discovery process |

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MICRO-GENESIS SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  Claude 4.5 Opus │───────▶│  Hypothesis DB   │              │
│  │  (Ideation)      │        │  (Neo4j)         │              │
│  └──────────────────┘        └──────────────────┘              │
│           │                           │                          │
│           │                           ▼                          │
│           │                  ┌──────────────────┐              │
│           │                  │  Task Queue      │              │
│           │                  │  (Neo4j)         │              │
│           │                  └──────────────────┘              │
│           │                           │                          │
│           │                           ▼                          │
│           │                  ┌──────────────────┐              │
│           │                  │  Fara-7B Agents  │              │
│           │                  │  (Data Collection)│              │
│           │                  └──────────────────┘              │
│           │                           │                          │
│           │                           ▼                          │
│           │                  ┌──────────────────┐              │
│           │                  │  Knowledge Graph │              │
│           │                  │  (Neo4j)         │              │
│           │                  └──────────────────┘              │
│           │                           │                          │
│           └───────────────────────────┘                          │
│                    (Synthesis & New Hypotheses)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
micro_genesis/
├── README.md                      # This file
├── ARCHITECTURE.md                # System architecture documentation
├── NEO4J_SETUP.md                 # Neo4j setup guide
├── neo4j_best_practices.md        # Neo4j knowledge graph best practices
├── tetraverse_case_study.md       # Case study of TCG knowledge graphs
├── fara_7b_notes.md               # Fara-7B implementation notes
│
├── neo4j_schema.cypher            # Neo4j graph schema definition
├── setup_neo4j.py                 # Neo4j database setup script
│
├── hypothesis_engine.py           # Claude 4.5 Opus integration
├── data_collection_agent.py       # Fara-7B agent framework
├── orchestrator.py                # Closed-loop orchestration layer
│
└── requirements.txt               # Python dependencies
```

## Installation

### Prerequisites

- Python 3.11+
- Neo4j database (AuraDB Free Tier recommended)
- Anthropic API key (for Claude 4.5 Opus)
- (Optional) Fara-7B endpoint (Azure Foundry or self-hosted)

### Step 1: Install Python Dependencies

```bash
cd micro_genesis
pip install -r requirements.txt

# If using Playwright for web scraping
playwright install
```

### Step 2: Set Up Neo4j

Follow the detailed instructions in [NEO4J_SETUP.md](./NEO4J_SETUP.md).

Quick Start (AuraDB Free Tier):

1. Create a free instance at [console.neo4j.io](https://console.neo4j.io)
2. Save your connection credentials
3. Set environment variables:

```bash
export NEO4J_URI='neo4j+s://xxxxxxxx.databases.neo4j.io'
export NEO4J_USER='neo4j'
export NEO4J_PASSWORD='your-password-here'
```

4. Run the setup script:

```bash
python3 setup_neo4j.py
```

### Step 3: Configure API Keys

```bash
export ANTHROPIC_API_KEY='your-anthropic-api-key'
export FARA_ENDPOINT='your-fara-endpoint'  # Optional
export FARA_API_KEY='your-fara-api-key'    # Optional
```

## Usage

### Run a Single Discovery Cycle

```bash
python3 orchestrator.py
```

This will:
1. Generate 3 hypotheses using Claude 4.5 Opus
2. Create data collection tasks
3. Execute tasks using Fara-7B (or mock agent)
4. Store results in Neo4j
5. Validate hypotheses

### Run Continuous Discovery

```python
from orchestrator import MicroGenesisOrchestrator

orchestrator = MicroGenesisOrchestrator(
    neo4j_uri, neo4j_user, neo4j_password, anthropic_api_key
)

# Run 5 cycles with 60s delay between each
orchestrator.run_continuous_discovery(
    cycles=5,
    context="Recent Pokemon game announcement",
    delay_between_cycles=60
)

orchestrator.close()
```

### Generate Hypotheses Only

```python
from hypothesis_engine import HypothesisEngine

engine = HypothesisEngine(neo4j_uri, neo4j_user, neo4j_password, anthropic_api_key)

hypotheses = engine.generate_hypotheses(
    context="New set release announcement",
    num_hypotheses=5
)

for hyp in hypotheses:
    print(f"[{hyp['confidence']:.2f}] {hyp['text']}")

engine.close()
```

### Execute Data Collection Tasks

```python
from data_collection_agent import DataCollectionAgent

agent = DataCollectionAgent(neo4j_uri, neo4j_user, neo4j_password)

# Process up to 10 pending tasks
agent.process_pending_tasks(max_tasks=10)

agent.close()
```

### Query the Knowledge Graph

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))

with driver.session() as session:
    # Find all pending hypotheses
    result = session.run("""
        MATCH (h:Hypothesis {status: 'Pending'})
        RETURN h.text, h.confidence
        ORDER BY h.confidence DESC
    """)

    for record in result:
        print(f"[{record['h.confidence']:.2f}] {record['h.text']}")

driver.close()
```

## Example Hypotheses

Here are some example hypotheses that Micro-Genesis might generate:

1. **[0.85]** "The release of a new Pokemon video game will increase the value of related TCG cards by 15-25% within 30 days."

2. **[0.75]** "Cards featuring popular Pokemon from recent anime episodes will see a 10-20% price spike within 7 days of the episode airing."

3. **[0.80]** "Graded PSA 10 cards from vintage sets (pre-2003) will outperform modern cards by 50%+ over the next 6 months."

4. **[0.70]** "Tournament-winning deck archetypes will drive a 30-40% price increase for key cards within 14 days of the tournament."

5. **[0.65]** "Social media mentions (Twitter, Reddit) of specific cards will correlate with a 5-15% price increase within 48 hours."

## Testing

```bash
# Test Neo4j connection
python3 setup_neo4j.py

# Test hypothesis generation
python3 hypothesis_engine.py

# Test data collection
python3 data_collection_agent.py

# Test full orchestration
python3 orchestrator.py
```

## Monitoring

### Check System Status

```python
from orchestrator import MicroGenesisOrchestrator

orchestrator = MicroGenesisOrchestrator(
    neo4j_uri, neo4j_user, neo4j_password, anthropic_api_key
)

orchestrator.print_system_status()
orchestrator.close()
```

Output:
```
================================================================================
MICRO-GENESIS SYSTEM STATUS
================================================================================

Hypotheses:
  - Pending: 5
  - Validated: 3
  - Rejected: 1

Data Collection Tasks:
  - Pending: 12
  - In Progress: 2
  - Completed: 8
  - Failed: 1

Knowledge Graph Data:
  - Cards: 150
  - Prices: 1,247
  - Tournaments: 5

================================================================================
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEO4J_URI` | Neo4j connection URI | Yes |
| `NEO4J_USER` | Neo4j username | Yes |
| `NEO4J_PASSWORD` | Neo4j password | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |
| `FARA_ENDPOINT` | Fara-7B API endpoint | No (uses mock agent if not set) |
| `FARA_API_KEY` | Fara-7B API key | No |

### Customization

#### Adjust Hypothesis Generation

Edit `hypothesis_engine.py`:

```python
# Change the number of hypotheses
hypotheses = engine.generate_hypotheses(num_hypotheses=10)

# Use a different Claude model
hypotheses = engine.generate_hypotheses(model="claude-sonnet-4-20250514")
```

#### Customize Data Collection

Edit `data_collection_agent.py`:

```python
# Process more tasks per cycle
agent.process_pending_tasks(max_tasks=50)
```

#### Modify the Discovery Cycle

Edit `orchestrator.py`:

```python
# Run more cycles
orchestrator.run_continuous_discovery(cycles=10)

# Adjust delay between cycles
orchestrator.run_continuous_discovery(delay_between_cycles=120)

# Generate more hypotheses per cycle
orchestrator.run_discovery_cycle(num_hypotheses=10)
```

## Use Cases

### 1. Price Prediction

Track card prices across multiple marketplaces and predict future price movements based on:
- New game releases
- Tournament results
- Social media sentiment
- Grading population reports

### 2. Market Trend Analysis

Identify emerging trends in the TCG market:
- Which card types are gaining popularity?
- Which sets are appreciating in value?
- Which players/collectors are influencing the market?

### 3. Investment Insights

Generate data-driven investment recommendations:
- Which cards to buy now?
- Which cards to sell before a price drop?
- Which sets have the best long-term potential?

### 4. Tournament Intelligence

Analyze competitive metagame trends:
- Which deck archetypes are winning tournaments?
- Which cards are most played in top decks?
- How do tournament results affect card prices?

## Roadmap

### Phase 1: Core Infrastructure (Complete)
- [x] Neo4j knowledge graph schema
- [x] Claude 4.5 Opus integration
- [x] Fara-7B agent framework
- [x] Orchestration layer

### Phase 2: Data Collection (In Progress)
- [ ] Real Fara-7B API integration
- [ ] eBay price scraping
- [ ] TCGPlayer price scraping
- [ ] Tournament results scraping
- [ ] Social media monitoring

### Phase 3: Analysis & Validation (Planned)
- [ ] Hypothesis validation algorithms
- [ ] Price prediction models
- [ ] Anomaly detection
- [ ] Confidence scoring

### Phase 4: Deployment & Integration (Planned)
- [ ] Deploy to Vercel
- [ ] Integrate with Apex Intelligence Center
- [ ] Build monitoring dashboards
- [ ] Create API for external access

### Phase 5: Advanced Features (Future)
- [ ] Multi-TCG support (Magic, Yu-Gi-Oh!, etc.)
- [ ] Real-time price alerts
- [ ] Portfolio tracking
- [ ] Automated trading recommendations

## License

This project is part of the Apex Intelligence Center platform.

## Acknowledgments

- **DOE Genesis Mission**: Inspiration for the closed-loop discovery framework
- **Anthropic**: Claude 4.5 Opus for hypothesis generation
- **Microsoft Research**: Fara-7B for autonomous data collection
- **Neo4j**: Graph database for knowledge representation
