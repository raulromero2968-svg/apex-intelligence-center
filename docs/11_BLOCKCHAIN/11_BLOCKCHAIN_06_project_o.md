# Project O Specification

## Overview

Project O is a gaming NFT collection on Immutable zkEVM with an OTC (Over-The-Counter) marketplace, whitelist token system, and active Discord community.

## Token Details

### ERC-721 Collection
- **Contract Address**: `0x8c9e8c3d34d3bfdb8f6e8e1d8e9f4c5d6e7f8a9b`
- **Chain**: Immutable zkEVM (Chain ID: 13371)
- **Standard**: ERC-721
- **Name**: Project O

### Whitelist Token (ERC-20)
- **Contract Address**: `0x1234567890123456789012345678901234567890` (placeholder - update with actual)
- **Chain**: Immutable zkEVM
- **Standard**: ERC-20
- **Purpose**: Access token for OTC marketplace and special events
- **Price Discovery**: On-chain trades via Uniswap V3 or similar DEX

## OTC Marketplace

### Official OTC Platform
- **Base URL**: Configured via `PROJECT_O_OTC_BASE_URL`
- **API Key**: Optional, via `PROJECT_O_OTC_API_KEY`
- **Format**: REST API

### Order Structure
- **Order ID**: Unique identifier
- **Side**: `buy` or `sell`
- **Card ID**: NFT token identifier
- **Price**: In native currency (ETH) or stablecoin
- **Size**: Quantity available
- **Trader Handle**: Optional trader identifier
- **Source**: `official_otc` or `mirror_site`

### Mirror Sites
Some orders may be scraped from mirror sites or aggregators. These should be marked with `source: "mirror_site"`.

## Whitelist Token Price Feed

### On-Chain Price Discovery
- Monitor Uniswap V3 pools or similar DEX
- Track recent trades via event logs
- Compute price in native token (ETH)
- Convert to USD using on-chain oracles or fallback rates

### Price Calculation
1. Query recent trades from DEX contract
2. Extract price from trade events
3. Convert to USD using ETH/USD rate
4. Store with block number and transaction hash

## Discord Integration

### Channel
- **Channel ID**: Configured via `DISCORD_PROJECT_O_CHANNEL_ID`
- **Bot Token**: Configured via `DISCORD_BOT_TOKEN`

### Sentiment Analysis
- Fetch latest messages from channel
- Run sentiment classifier (OpenAI or local model)
- Score: -1 (very negative) to +1 (very positive)
- Store messages with sentiment scores

### Message Structure
- **Message ID**: Discord message ID
- **Author**: Discord username
- **Content**: Message text
- **Sentiment Score**: -1 to 1
- **Channel ID**: Discord channel ID
- **Created At**: Discord timestamp

## Data Flow

1. **OTC Scraper**: Every X seconds, fetch order book from OTC API
2. **Whitelist Feed**: Poll on-chain events or recent trades for price updates
3. **Discord Sentiment**: Fetch new messages since last message ID, analyze sentiment
4. **Event Publishing**: Publish summary events to Redis channel `events.project_o.update`

## Aggregation

### OTC Order Book
- Aggregate by `cardId` and `side`
- Compute best bid/ask per card
- Calculate total depth

### Whitelist Price
- Latest price tick
- 24h high/low
- Volume (if available)

### Discord Sentiment
- Average sentiment score (last N messages)
- Message count
- Sentiment trend (improving/declining)

