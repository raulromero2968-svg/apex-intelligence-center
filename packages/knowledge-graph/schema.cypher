// Apex Intelligence Center - Knowledge Graph Schema
// Neo4j Cypher Schema Definition
// Version: 1.0
// Last Updated: November 25, 2025

// ============================================================================
// NODE CONSTRAINTS & INDEXES
// ============================================================================

// Card Nodes
CREATE CONSTRAINT card_id_unique IF NOT EXISTS
FOR (c:Card) REQUIRE c.id IS UNIQUE;

CREATE INDEX card_name_index IF NOT EXISTS
FOR (c:Card) ON (c.name);

CREATE INDEX card_set_index IF NOT EXISTS
FOR (c:Card) ON (c.set);

CREATE FULLTEXT INDEX card_fulltext_index IF NOT EXISTS
FOR (c:Card) ON EACH [c.name, c.description, c.set];

// Market Nodes
CREATE CONSTRAINT market_id_unique IF NOT EXISTS
FOR (m:Market) REQUIRE m.id IS UNIQUE;

CREATE INDEX market_name_index IF NOT EXISTS
FOR (m:Market) ON (m.name);

// Transaction Nodes
CREATE CONSTRAINT transaction_id_unique IF NOT EXISTS
FOR (t:Transaction) REQUIRE t.id IS UNIQUE;

CREATE INDEX transaction_date_index IF NOT EXISTS
FOR (t:Transaction) ON (t.date);

CREATE INDEX transaction_price_index IF NOT EXISTS
FOR (t:Transaction) ON (t.price);

// Research Nodes
CREATE CONSTRAINT research_id_unique IF NOT EXISTS
FOR (r:Research) REQUIRE r.id IS UNIQUE;

CREATE INDEX research_title_index IF NOT EXISTS
FOR (r:Research) ON (r.title);

CREATE INDEX research_year_index IF NOT EXISTS
FOR (r:Research) ON (r.year);

CREATE FULLTEXT INDEX research_fulltext_index IF NOT EXISTS
FOR (r:Research) ON EACH [r.title, r.abstract, r.keywords];

// Concept Nodes
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS
FOR (c:Concept) REQUIRE c.id IS UNIQUE;

CREATE INDEX concept_name_index IF NOT EXISTS
FOR (c:Concept) ON (c.name);

// Agent Nodes
CREATE CONSTRAINT agent_id_unique IF NOT EXISTS
FOR (a:Agent) REQUIRE a.id IS UNIQUE;

CREATE INDEX agent_name_index IF NOT EXISTS
FOR (a:Agent) ON (a.name);

CREATE INDEX agent_type_index IF NOT EXISTS
FOR (a:Agent) ON (a.type);

// ============================================================================
// NODE PROPERTIES SCHEMA
// ============================================================================

// Card Node Properties
// {
//   id: string (UUID)
//   name: string
//   set: string
//   rarity: string (Common, Uncommon, Rare, Ultra Rare, etc.)
//   cardNumber: string
//   releaseDate: date
//   description: string
//   type: string (Pokemon, Magic, Yu-Gi-Oh, etc.)
//   attributes: map (game-specific attributes)
//   imageUrl: string
//   createdAt: datetime
//   updatedAt: datetime
// }

// Market Node Properties
// {
//   id: string (UUID)
//   name: string (TCGPlayer, eBay, CardMarket, etc.)
//   url: string
//   region: string
//   currency: string
//   apiAvailable: boolean
//   createdAt: datetime
//   updatedAt: datetime
// }

// Transaction Node Properties
// {
//   id: string (UUID)
//   price: float
//   currency: string
//   condition: string (Near Mint, Lightly Played, etc.)
//   grading: string (PSA 10, BGS 9.5, CGC 9, Raw, etc.)
//   quantity: integer
//   date: datetime
//   source: string (API, scraping, manual)
//   createdAt: datetime
// }

// Research Node Properties
// {
//   id: string (UUID)
//   title: string
//   abstract: string
//   authors: list<string>
//   year: integer
//   venue: string (conference, journal, preprint)
//   url: string
//   doi: string
//   keywords: list<string>
//   fullText: string (optional)
//   citationCount: integer
//   createdAt: datetime
//   updatedAt: datetime
// }

// Concept Node Properties
// {
//   id: string (UUID)
//   name: string
//   definition: string
//   category: string (technology, methodology, domain, etc.)
//   frequency: integer (number of papers mentioning this concept)
//   createdAt: datetime
//   updatedAt: datetime
// }

// Agent Node Properties
// {
//   id: string (UUID)
//   name: string
//   type: string (human, ai_model, multi_agent_system)
//   model: string (optional, e.g., "Fara-7B", "GPT-4o")
//   capabilities: list<string>
//   status: string (active, inactive, archived)
//   createdAt: datetime
//   updatedAt: datetime
// }

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

// Card → Market
// (:Card)-[:SOLD_ON {
//   firstListedDate: datetime,
//   lastSeenDate: datetime,
//   averagePrice: float,
//   transactionCount: integer
// }]->(:Market)

// Card → Transaction
// (:Card)-[:PRICED_AT {
//   source: string,
//   verified: boolean
// }]->(:Transaction)

// Transaction → Market
// (:Transaction)-[:OCCURRED_ON {
//   listingId: string,
//   sellerId: string
// }]->(:Market)

// Research → Research (Citations)
// (:Research)-[:CITES {
//   context: string (why this paper cites the other),
//   section: string (introduction, methods, results, etc.),
//   sentiment: string (positive, neutral, critical)
// }]->(:Research)

// Research → Concept
// (:Research)-[:MENTIONS {
//   frequency: integer,
//   importance: float (TF-IDF score),
//   context: string
// }]->(:Concept)

// Concept → Concept (Co-occurrence)
// (:Concept)-[:CO_OCCURS_WITH {
//   frequency: integer,
//   strength: float (PMI or similar measure),
//   papers: list<string> (paper IDs where they co-occur)
// }]->(:Concept)

// Research → Agent (Contribution)
// (:Research)-[:CONTRIBUTED_BY {
//   role: string (author, reviewer, curator),
//   timestamp: datetime,
//   action: string (create, refine, approve, reject)
// }]->(:Agent)

// Agent → Agent (Collaboration)
// (:Agent)-[:COLLABORATED_WITH {
//   projectId: string,
//   startDate: datetime,
//   endDate: datetime,
//   contributionCount: integer
// }]->(:Agent)

// ============================================================================
// SAMPLE DATA CREATION QUERIES
// ============================================================================

// Create sample Card
// CREATE (c:Card {
//   id: randomUUID(),
//   name: "Charizard",
//   set: "Base Set",
//   rarity: "Holo Rare",
//   cardNumber: "4/102",
//   releaseDate: date("1999-01-09"),
//   description: "Spits fire that is hot enough to melt boulders.",
//   type: "Pokemon",
//   attributes: {hp: 120, type: "Fire", stage: "Stage 2"},
//   imageUrl: "https://example.com/charizard.png",
//   createdAt: datetime(),
//   updatedAt: datetime()
// });

// Create sample Market
// CREATE (m:Market {
//   id: randomUUID(),
//   name: "TCGPlayer",
//   url: "https://www.tcgplayer.com",
//   region: "North America",
//   currency: "USD",
//   apiAvailable: true,
//   createdAt: datetime(),
//   updatedAt: datetime()
// });

// Create sample Transaction
// CREATE (t:Transaction {
//   id: randomUUID(),
//   price: 350.00,
//   currency: "USD",
//   condition: "Near Mint",
//   grading: "PSA 10",
//   quantity: 1,
//   date: datetime("2025-11-20T14:30:00Z"),
//   source: "API",
//   createdAt: datetime()
// });

// Create relationships
// MATCH (c:Card {name: "Charizard"}), (m:Market {name: "TCGPlayer"})
// CREATE (c)-[:SOLD_ON {
//   firstListedDate: datetime("2020-01-01T00:00:00Z"),
//   lastSeenDate: datetime(),
//   averagePrice: 325.50,
//   transactionCount: 1247
// }]->(m);

// MATCH (c:Card {name: "Charizard"}), (t:Transaction)
// CREATE (c)-[:PRICED_AT {
//   source: "TCGPlayer API",
//   verified: true
// }]->(t);

// MATCH (t:Transaction), (m:Market {name: "TCGPlayer"})
// CREATE (t)-[:OCCURRED_ON {
//   listingId: "TCG-12345",
//   sellerId: "seller_789"
// }]->(m);

// ============================================================================
// COMMON QUERIES
// ============================================================================

// Query 1: Find all transactions for a specific card
// MATCH (c:Card {name: "Charizard"})-[:PRICED_AT]->(t:Transaction)
// RETURN c.name, t.price, t.condition, t.grading, t.date
// ORDER BY t.date DESC;

// Query 2: Find average price by grading for a card
// MATCH (c:Card {name: "Charizard"})-[:PRICED_AT]->(t:Transaction)
// RETURN t.grading, AVG(t.price) as avgPrice, COUNT(t) as transactionCount
// ORDER BY avgPrice DESC;

// Query 3: Find papers that cite a specific paper
// MATCH (r1:Research {title: "OmniScientist"})<-[:CITES]-(r2:Research)
// RETURN r2.title, r2.year, r2.authors;

// Query 4: Find concepts that frequently co-occur with a given concept
// MATCH (c1:Concept {name: "holographic display"})-[r:CO_OCCURS_WITH]->(c2:Concept)
// RETURN c2.name, r.frequency, r.strength
// ORDER BY r.strength DESC
// LIMIT 10;

// Query 5: Find all contributions by a specific agent
// MATCH (a:Agent {name: "Fara-7B"})<-[:CONTRIBUTED_BY]-(r:Research)
// RETURN r.title, r.year
// ORDER BY r.year DESC;

// Query 6: Find research papers related to a specific concept
// MATCH (c:Concept {name: "computer-using agent"})<-[:MENTIONS]-(r:Research)
// RETURN r.title, r.year, r.url
// ORDER BY r.year DESC;

// ============================================================================
// DATA QUALITY & MAINTENANCE QUERIES
// ============================================================================

// Find duplicate cards (by name and set)
// MATCH (c:Card)
// WITH c.name AS name, c.set AS set, COLLECT(c) AS cards
// WHERE SIZE(cards) > 1
// RETURN name, set, SIZE(cards) AS duplicateCount;

// Find orphaned transactions (no card or market relationship)
// MATCH (t:Transaction)
// WHERE NOT (t)<-[:PRICED_AT]-(:Card) OR NOT (t)-[:OCCURRED_ON]->(:Market)
// RETURN t.id, t.price, t.date;

// Find research papers with no citations
// MATCH (r:Research)
// WHERE NOT (r)-[:CITES]->(:Research) AND NOT (r)<-[:CITES]-(:Research)
// RETURN r.title, r.year;

// ============================================================================
// PERFORMANCE OPTIMIZATION QUERIES
// ============================================================================

// Analyze query performance
// PROFILE MATCH (c:Card {name: "Charizard"})-[:PRICED_AT]->(t:Transaction)
// RETURN c.name, t.price, t.date;

// Show all indexes
// SHOW INDEXES;

// Show all constraints
// SHOW CONSTRAINTS;

// ============================================================================
// NOTES
// ============================================================================

// 1. This schema is designed to be flexible and extensible.
// 2. Use UUIDs for all node IDs to ensure global uniqueness.
// 3. Always include createdAt and updatedAt timestamps for audit trails.
// 4. Use full-text indexes for natural language search on text fields.
// 5. Implement data validation at the application layer before inserting into Neo4j.
// 6. Regularly run data quality queries to identify and fix issues.
// 7. Consider using Neo4j's APOC library for advanced graph algorithms.
// 8. For large datasets, consider sharding or using Neo4j Enterprise features.
