# @apex/knowledge-graph

Unified knowledge graph and automation package for Apex Intelligence Center.

## Overview

This package provides a type-safe TypeScript interface for:
- **Neo4j Knowledge Graph**: Store and query TCG market data, research papers, and concepts
- **Fara-7B Computer-Using Agent**: Automate web-based data collection and research tasks

## Installation

```bash
pnpm install
```

## Configuration

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `NEO4J_URI`: Neo4j connection URI (e.g., `bolt://localhost:7687`)
- `NEO4J_USERNAME`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password
- `FARA_ENDPOINT`: Fara-7B API endpoint (Azure AI Foundry)
- `FARA_API_KEY`: Fara-7B API key

## Usage

### Neo4j Client

```typescript
import { createNeo4jClient, CardNode } from '@apex/knowledge-graph';

const neo4j = createNeo4jClient();

// Create a card
const card = await neo4j.createCard({
  name: 'Charizard',
  set: 'Base Set',
  rarity: 'Holo Rare',
  cardNumber: '4/102',
  releaseDate: new Date('1999-01-09'),
  description: 'Spits fire that is hot enough to melt boulders.',
  type: 'Pokemon',
  attributes: { hp: 120, type: 'Fire', stage: 'Stage 2' },
});

// Search for cards
const cards = await neo4j.findCardsByName('Charizard');

// Get price history
const priceHistory = await neo4j.getCardPriceHistory(card.id);

// Close connection
await neo4j.close();
```

### Fara-7B Client

```typescript
import { createFaraClient } from '@apex/knowledge-graph';

const fara = createFaraClient();

// Search for TCG card price
const result = await fara.searchCardPrice(
  'PSA 10 Charizard Base Set 1st Edition',
  'TCGPlayer',
  { grading: 'PSA 10', condition: 'Near Mint' }
);

console.log('Price:', result.result);

// Scrape research papers
const papers = await fara.scrapeResearchPapers(
  'holographic displays',
  'arXiv',
  10
);

console.log('Papers:', papers.result);

// Extract data from a URL
const data = await fara.extractDataFromUrl(
  'https://www.tcgplayer.com/product/12345',
  {
    price: 'Current market price',
    availability: 'In stock or out of stock',
    seller: 'Seller name',
  }
);

console.log('Extracted data:', data.result);
```

### Advanced: Manual Task Control

```typescript
import { createFaraClient } from '@apex/knowledge-graph';

const fara = createFaraClient();

// Submit a custom task
const task = await fara.submitTask(
  'Find the lowest price for PSA 10 Charizard Base Set 1st Edition on eBay',
  {
    context: { marketplace: 'eBay', grading: 'PSA 10' },
    maxSteps: 25,
    stopAtCriticalPoints: true, // Stop before making purchases
  }
);

// Monitor task progress
const updatedTask = await fara.getTask(task.id);
console.log('Status:', updatedTask.status);
console.log('Action logs:', updatedTask.actionLogs);

// Wait for completion
const result = await fara.waitForTask(task.id);
console.log('Result:', result);

// Handle critical points (e.g., before making a purchase)
if (result.status === 'critical_point') {
  console.log('Critical point:', updatedTask.criticalPoint);
  
  // Approve or reject
  await fara.approveCriticalPoint(task.id, true, 'Approved by user');
  
  // Continue waiting
  const finalResult = await fara.waitForTask(task.id);
  console.log('Final result:', finalResult);
}
```

## Neo4j Schema

The knowledge graph uses the following node types:

- **Card**: TCG cards with attributes (name, set, rarity, price, grading)
- **Market**: Marketplaces (TCGPlayer, eBay, CardMarket)
- **Transaction**: Historical price data and sales
- **Research**: Academic papers, articles, blog posts
- **Concept**: Keywords and topics extracted from research
- **Agent**: AI agents and human collaborators

Relationships:
- `SOLD_ON`: Card → Market
- `PRICED_AT`: Card → Transaction
- `OCCURRED_ON`: Transaction → Market
- `CITES`: Research → Research
- `MENTIONS`: Research → Concept
- `CO_OCCURS_WITH`: Concept → Concept
- `CONTRIBUTED_BY`: Research → Agent

See `schema.cypher` for the full schema definition.

## Scripts

- `pnpm dev`: Run in development mode with hot reload
- `pnpm build`: Build TypeScript to JavaScript
- `pnpm test`: Run tests
- `pnpm lint`: Lint code
- `pnpm typecheck`: Type check without emitting
- `pnpm neo4j:init`: Initialize Neo4j schema
- `pnpm neo4j:seed`: Seed with sample data
- `pnpm neo4j:query`: Run example queries

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Apex Intelligence Center                   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │   @apex/knowledge-graph Package       │
         └───────────────────────────────────────┘
                   │                    │
                   ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐
         │  Neo4j Client   │  │  Fara-7B Client │
         └─────────────────┘  └─────────────────┘
                   │                    │
                   ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐
         │   Neo4j Graph   │  │ Azure AI Foundry│
         │    Database     │  │   (Fara-7B)     │
         └─────────────────┘  └─────────────────┘
                   │                    │
                   ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐
         │  TCG Market     │  │  Web Automation │
         │  Research Data  │  │  (BrowserBase)  │
         └─────────────────┘  └─────────────────┘
```

## Development

### Adding New Node Types

1. Define the interface in `src/neo4j-client.ts`
2. Add schema constraints and indexes in `schema.cypher`
3. Implement create/read methods in `Neo4jClient` class
4. Export types from `src/index.ts`

### Adding New Fara-7B Tasks

1. Define task-specific parameters
2. Implement high-level helper method in `FaraClient` class
3. Add usage examples to README

## Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test neo4j-client.test.ts
```

## License

MIT

## Author

Apex Intelligence Center
