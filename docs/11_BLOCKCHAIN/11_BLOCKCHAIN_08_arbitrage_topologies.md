# Arbitrage Topologies

## Cross-Chain Arbitrage Routes

This document defines the allowed arbitrage routes between chains and collections.

## Supported Routes

### Immutable zkEVM ↔ Ronin

**Route**: `immutable_zkevm` ↔ `ronin`

**Collections**:
- `gods_unchained` (Immutable) ↔ `runes_tcg` (Ronin) - Not applicable (different collections)
- `parallel` (Immutable) ↔ `runes_tcg` (Ronin) - Not applicable (different collections)
- `project_o` (Immutable) - Can be arbitraged if listed on both chains

**Bridge**: Requires cross-chain bridge (e.g., LayerZero, Stargate)

**Estimated Gas Costs**:
- Immutable zkEVM: ~0.001 ETH per transaction
- Ronin: ~0.01 RON per transaction
- Bridge fee: ~0.0005 ETH (variable)

**Fees**:
- Immutable orderbook: 2.5% maker, 2.5% taker
- Ronin marketplace: 2.5% seller fee

### Immutable zkEVM ↔ Ethereum Mainnet

**Route**: `immutable_zkevm` ↔ `ethereum`

**Collections**:
- `gods_unchained` (Immutable) - May have listings on Ethereum mainnet
- `parallel` (Immutable) - May have listings on Ethereum mainnet
- `project_o` (Immutable) - May have listings on Ethereum mainnet

**Bridge**: Immutable zkEVM bridge (native)

**Estimated Gas Costs**:
- Immutable zkEVM: ~0.001 ETH per transaction
- Ethereum Mainnet: ~0.01-0.05 ETH per transaction (variable)
- Bridge fee: ~0.001 ETH

**Fees**:
- Immutable orderbook: 2.5% maker, 2.5% taker
- Ethereum marketplace (OpenSea, Blur): 2.5% marketplace fee

## Route Graph

```
immutable_zkevm
  ├── ronin (via bridge)
  ├── ethereum (via native bridge)
  └── (future: polygon, arbitrum)

ronin
  ├── immutable_zkevm (via bridge)
  └── (future: ethereum)
```

## Risk Factors

### Liquidity Depth
- **High**: >10 ETH equivalent depth on both sides
- **Medium**: 1-10 ETH equivalent depth
- **Low**: <1 ETH equivalent depth

### Historical Volatility
- **Low Risk**: <5% daily volatility
- **Medium Risk**: 5-15% daily volatility
- **High Risk**: >15% daily volatility

### Slippage Risk
- **Low**: <1% expected slippage
- **Medium**: 1-3% expected slippage
- **High**: >3% expected slippage

## Minimum Edge Thresholds

- **Minimum Edge (BPS)**: 50 bps (0.5%) after all fees and gas
- **Maximum Slippage (BPS)**: 300 bps (3%)
- **Minimum Profit (USD)**: $10 USD equivalent

## Gas Estimation

### Immutable zkEVM
- Buy transaction: ~50,000 gas
- Sell transaction: ~50,000 gas
- Gas price: ~0.00000002 ETH per gas unit
- Total: ~0.001 ETH per round trip

### Ronin
- Buy transaction: ~100,000 gas
- Sell transaction: ~100,000 gas
- Gas price: ~0.00000001 RON per gas unit
- Total: ~0.01 RON per round trip

### Ethereum Mainnet
- Buy transaction: ~150,000 gas
- Sell transaction: ~150,000 gas
- Gas price: Variable (typically 20-50 gwei)
- Total: ~0.01-0.05 ETH per round trip (highly variable)

## Bridge Fees

- **Immutable zkEVM ↔ Ethereum**: ~0.001 ETH (native bridge)
- **Immutable zkEVM ↔ Ronin**: ~0.0005 ETH (via LayerZero/Stargate)
- **Ronin ↔ Ethereum**: ~0.001 ETH (via bridge)

## Detection Window

Target detection time: **15 seconds** from floor price change to opportunity event.

This requires:
- Floor price refresh: Every 5 seconds
- Arbitrage scan: Every 5 seconds
- Event publishing: Immediate

