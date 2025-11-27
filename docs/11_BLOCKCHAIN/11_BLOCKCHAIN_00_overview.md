# Blockchain Integration Overview

Apex Intelligence integrates with multiple blockchain networks to provide real-time floor price feeds for NFT collections. This document provides an overview of the blockchain integration architecture.

## Supported Networks

- **Immutable zkEVM**: Layer 2 scaling solution for Ethereum, optimized for gaming and NFTs
- **Ronin**: Axie Infinity's sidechain, optimized for gaming NFTs

## Supported Collections

### Immutable zkEVM
- **Gods Unchained**: Trading card game NFTs
- **Parallel**: Sci-fi trading card game
- **Project O**: Gaming NFT collection

### Ronin
- **Runes TCG**: Trading card game on Ronin

## Architecture

- **Workers**: Poll blockchain RPC nodes and compute floor prices
- **Database**: Store historical floor price data in Postgres
- **Redis Pub/Sub**: Stream real-time updates to clients via SSE
- **tRPC API**: Query latest and historical floor prices

## Data Flow

1. Worker polls RPC nodes every `BLOCKCHAIN_FLOOR_REFRESH_SECONDS` (default: 5s)
2. Worker computes floor prices from orderbook/marketplace data
3. Worker writes to `blockchain_floor_prices` table
4. Worker publishes events to Redis: `events.blockchain.floor.<chain>.<collection>`
5. Web API subscribes to Redis and streams via SSE to clients

