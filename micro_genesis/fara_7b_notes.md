# Fara-7B Implementation Notes

This document provides implementation details for integrating Microsoft Fara-7B into the Micro-Genesis data collection pipeline.

## Overview

Fara-7B is Microsoft's autonomous browsing agent designed for intelligent web navigation and data extraction. It combines a language model with a browser automation framework to:

1. Understand natural language task descriptions
2. Navigate websites autonomously
3. Extract structured data from web pages
4. Handle dynamic content and interactions

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA COLLECTION AGENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │  Task Queue      │  Tasks from hypothesis validation          │
│  │  (Neo4j)         │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │  Task Router     │  Routes tasks to appropriate collector     │
│  └────────┬─────────┘                                           │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     ▼           ▼                                               │
│  ┌────────┐  ┌────────┐                                         │
│  │ Fara   │  │ Mock   │  Fallback when Fara unavailable         │
│  │ 7B     │  │ Agent  │                                         │
│  └────────┘  └────────┘                                         │
│       │           │                                              │
│       └─────┬─────┘                                              │
│             ▼                                                    │
│  ┌──────────────────┐                                           │
│  │  Result Handler  │  Parses and stores results in Neo4j       │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Integration

### Endpoint Configuration

```python
# Environment variables
FARA_ENDPOINT = "https://your-fara-endpoint.azure.com"
FARA_API_KEY = "your-api-key"
```

### Request Format

```python
{
    "prompt": "Navigate to tcgplayer.com and extract Pokemon card prices",
    "max_tokens": 4096,
    "temperature": 0.3,
    "task_type": "web_browse_and_extract"
}
```

### Response Format

```python
{
    "extracted_data": {
        "type": "price_data",
        "items": [
            {
                "card_name": "Charizard",
                "set": "Base Set",
                "price": 299.99,
                "condition": "Near Mint"
            }
        ]
    },
    "browse_history": [
        {"url": "https://tcgplayer.com", "action": "navigate"},
        {"url": "https://tcgplayer.com/search", "action": "click"}
    ],
    "completion_status": "success"
}
```

## Task Type Mappings

### Price Scraping

```python
PRICE_SCRAPE_PROMPT = """
Navigate to {url} and extract TCG card price data.
Look for: {target_data}

Extract and return JSON with:
- card_name: Name of the card
- set_name: Card set
- condition: Card condition (NM, LP, MP, HP, DMG)
- grade: PSA/BGS grade if graded (null if raw)
- price_usd: Price in USD
- listing_type: BuyItNow or Auction
- seller: Seller name if available
"""
```

### Tournament Scraping

```python
TOURNAMENT_SCRAPE_PROMPT = """
Navigate to {url} and extract tournament results.
Look for: {target_data}

Extract and return JSON with:
- tournament_name: Name of the tournament
- date: Tournament date
- location: Tournament location
- format: Game format (Standard, Expanded, etc.)
- top_decks: Array of top placing decks with:
  - placement: 1st, 2nd, etc.
  - archetype: Deck archetype name
  - player: Player name (if public)
  - key_cards: List of key cards in the deck
"""
```

### Social Media Scraping

```python
SOCIAL_SCRAPE_PROMPT = """
Navigate to {url} and analyze TCG-related discussions.
Look for: {target_data}

Extract and return JSON with:
- sentiment: Overall sentiment (positive/neutral/negative)
- sentiment_score: -1.0 to 1.0
- key_mentions: Cards/sets being discussed
- trending_topics: Current trending topics
- engagement_metrics: Upvotes, comments, shares
"""
```

## Deployment Options

### Option 1: Azure AI Foundry

Microsoft's recommended deployment for Fara-7B:

1. Create an Azure AI Foundry workspace
2. Deploy Fara-7B model
3. Configure endpoint and API key
4. Set environment variables

```bash
export FARA_ENDPOINT="https://your-workspace.api.azureml.ms/fara/v1"
export FARA_API_KEY="your-azure-api-key"
```

### Option 2: Self-Hosted

For local deployment with more control:

1. Clone Fara-7B repository
2. Set up local inference server
3. Configure local endpoint

```bash
export FARA_ENDPOINT="http://localhost:8080/v1"
export FARA_API_KEY="local-key"
```

### Option 3: Mock Agent (Development)

For development without Fara-7B access:

```python
# The system automatically falls back to MockFaraCollector
# when FARA_ENDPOINT is not set
```

## Error Handling

### Retry Logic

```python
MAX_RETRIES = 3
RETRY_DELAYS = [2, 5, 10]  # seconds

for attempt in range(MAX_RETRIES):
    try:
        result = await fara_client.complete(task)
        return result
    except FaraTimeoutError:
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(RETRY_DELAYS[attempt])
        else:
            raise
```

### Error Types

| Error | Handling |
|-------|----------|
| `FaraTimeoutError` | Retry with exponential backoff |
| `FaraRateLimitError` | Wait and retry |
| `FaraNavigationError` | Mark task as failed, log URL |
| `FaraExtractionError` | Store partial results |

## Rate Limiting

### Recommended Limits

```python
# Requests per minute
RATE_LIMIT = 10

# Concurrent requests
MAX_CONCURRENT = 3

# Delay between requests (ms)
REQUEST_DELAY = 1000
```

### Implementation

```python
from asyncio_throttle import Throttler

throttler = Throttler(rate_limit=10, period=60)

async def collect_with_rate_limit(task):
    async with throttler:
        return await fara_client.complete(task)
```

## Data Quality

### Validation Rules

1. **Price Data**
   - Price must be positive number
   - Condition must be valid enum
   - Grade format: "PSA X" or "BGS X.X"

2. **Tournament Data**
   - Date must be valid format
   - Placement must be positive integer
   - Archetype should match known patterns

3. **Social Data**
   - Sentiment score must be -1.0 to 1.0
   - Engagement metrics must be non-negative

### Data Cleaning

```python
def clean_price(raw_price: str) -> float:
    """Clean price string to float."""
    # Remove currency symbols, commas
    cleaned = re.sub(r'[^\d.]', '', raw_price)
    return float(cleaned) if cleaned else 0.0

def normalize_condition(condition: str) -> str:
    """Normalize condition string."""
    mapping = {
        'nm': 'Near Mint',
        'near mint': 'Near Mint',
        'lp': 'Lightly Played',
        'mp': 'Moderately Played',
        'hp': 'Heavily Played',
        'dmg': 'Damaged'
    }
    return mapping.get(condition.lower(), condition)
```

## Performance Optimization

### Batching Requests

```python
async def batch_collect(tasks: List[Task], batch_size: int = 5):
    """Process tasks in batches."""
    results = []
    for i in range(0, len(tasks), batch_size):
        batch = tasks[i:i + batch_size]
        batch_results = await asyncio.gather(
            *[fara_client.complete(task) for task in batch]
        )
        results.extend(batch_results)
        await asyncio.sleep(1)  # Rate limit between batches
    return results
```

### Caching

```python
# Cache frequently accessed pages
from functools import lru_cache

@lru_cache(maxsize=100)
def get_cached_page(url: str) -> str:
    """Cache page content for repeated access."""
    return fetch_page(url)
```

## Security Considerations

### API Key Protection

- Store API keys in environment variables
- Never commit keys to version control
- Rotate keys regularly

### Web Scraping Ethics

- Respect robots.txt
- Implement rate limiting
- Identify as a bot in User-Agent
- Only collect public data

### Data Privacy

- Do not collect personal information
- Store only market data
- Comply with terms of service

## Monitoring

### Metrics to Track

1. **Request Metrics**
   - Requests per minute
   - Success rate
   - Average latency

2. **Extraction Metrics**
   - Items extracted per request
   - Data quality scores
   - Failed extractions

3. **Cost Metrics**
   - API calls per day
   - Tokens used
   - Cost per extraction

### Logging

```python
import structlog

logger = structlog.get_logger()

async def collect(task):
    logger.info("starting_collection",
                task_id=task.id,
                task_type=task.type,
                url=task.target_url)

    try:
        result = await fara_client.complete(task)
        logger.info("collection_complete",
                    task_id=task.id,
                    items_extracted=len(result.data),
                    duration_ms=result.duration)
        return result
    except Exception as e:
        logger.error("collection_failed",
                     task_id=task.id,
                     error=str(e))
        raise
```

## Future Enhancements

1. **Multi-modal Extraction**
   - Image recognition for card identification
   - OCR for price labels

2. **Adaptive Prompting**
   - Learn from successful extractions
   - Auto-adjust prompts based on site structure

3. **Real-time Streaming**
   - WebSocket connections for live price updates
   - Event-driven architecture

4. **Distributed Processing**
   - Multiple Fara instances
   - Geographic distribution for faster access
