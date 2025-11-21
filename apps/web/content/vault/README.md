# The Vault - Weekly Research Reports

This directory contains MDX files for The Vault weekly research reports.

## Authoring Conventions

### Frontmatter

Each report must include YAML frontmatter with the following fields:

```yaml
---
title: "Vault Weekly Report - Week 1, 2025"
slug: "week-2025-01"
publishedAt: "2025-01-06T00:00:00Z"
summary: "Brief summary of the week's key insights"
---
```

### Required Fields

- **title**: Report title
- **slug**: URL-friendly identifier (usually auto-generated as `week-YYYY-WW`)
- **publishedAt**: ISO 8601 date string
- **summary**: Brief description (1-2 sentences)

### Content Structure

Reports should include:

1. **Executive Summary** - High-level overview
2. **On-Chain Intelligence** - Blockchain data analysis
3. **Physical Market Intelligence** - Physical scan data
4. **Arbitrage Topology** - Cross-chain and OTC insights
5. **Project O Deep Dive** - Project O specific analysis
6. **Key Insights** - Bulleted takeaways
7. **Recommendations** - Actionable recommendations

### MDX Components

You can use the following MDX components:

- `<AreaChartViz />` - Area charts
- `<BarChartViz />` - Bar charts
- `<InteractiveLineChart />` - Interactive line charts
- `<ScatterPlot />` - Scatter plots
- `<InfoBox />` - Highlighted info boxes
- `<ImageWithCaption />` - Images with captions
- `<TableOfContents />` - Table of contents

## Generation

Reports are automatically generated weekly via `/api/vault/generate-weekly` endpoint, which can be triggered by:

- Vercel Cron Jobs
- Manual API call with `VAULT_WEEKLY_CRON_SECRET`
- Scheduled automation

## Access Control

All reports require:
- User authentication
- Active Vault subscription (checked via Stripe)
