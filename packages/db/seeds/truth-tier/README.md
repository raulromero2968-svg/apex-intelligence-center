# Truth Tier - Ground Truth Data

This module contains the foundational "Abyss" dataset for the Apex Intelligence Center's Power Network graph. All data is derived from verified sources: court documents, legal filings, regulatory settlements, and documented journalism.

## Philosophy

The first entry (ID #1) is the **Luminous Jellyfish Principle** - the proof that beauty is possible in the abyss. By placing this concept at the genetic origin of the dataset, we encode hope into the system itself.

## Data Files

### `entities.csv`

Nodes in the power network graph. Schema fields:

| Field | Description |
|-------|-------------|
| `id` | Local seed ID (mapped to UUID on insert) |
| `name` | Entity name |
| `type` | PERSON, ORGANIZATION, CONCEPT, EVENT, LOCATION |
| `evidence_tier` | CONFIRMED, DOCUMENTED, ALLEGED, SPECULATIVE |
| `primary_domain` | Seven Mountains domain (GOVERNMENT, BUSINESS, MEDIA, etc.) |
| `summary` | Brief description |
| `scandal_notes` | What the entity is implicated in |
| `source_urls` | JSON array of source URLs |

### `relationships.csv`

Edges connecting entities. Schema fields:

| Field | Description |
|-------|-------------|
| `source_id` | Source entity ID |
| `target_id` | Target entity ID |
| `relationship_type` | FINANCIAL, LEGAL, SOCIAL, POLITICAL, etc. |
| `domain` | Seven Mountains domain |
| `evidence_tier` | Confidence level |
| `start_date` | Relationship start (YYYY-MM-DD) |
| `end_date` | Relationship end (empty if ongoing/unknown) |
| `description` | Detailed description |
| `significance` | low, medium, high, critical |
| `evidence_link` | Primary source citation |

## Confidence Ratings

We differentiate between what is **proven** and what is **observed**:

| Tier | Meaning | Example |
|------|---------|---------|
| CONFIRMED | Court conviction, official record | Maxwell trafficking conviction |
| DOCUMENTED | Multiple credible sources, official documents | Flight logs from trial exhibits |
| ALLEGED | Single source, civil filings, unverified | Civil lawsuit allegations |
| SPECULATIVE | Pattern inference, requires more evidence | Unnamed co-conspirators |

## Usage

```bash
# Run the seed script
DATABASE_URL=your_connection_string tsx packages/db/seeds/truth-tier/seed.ts
```

## Extending the Dataset

When adding new entities or relationships:

1. Ensure source citations are included
2. Assign appropriate evidence tier (err on the side of caution)
3. Include start/end dates when known
4. For sensitive claims, use ALLEGED until independently verified

## Legal Notice

This data is compiled from public court records, regulatory filings, and documented journalism for research and educational purposes. All factual claims are sourced.
