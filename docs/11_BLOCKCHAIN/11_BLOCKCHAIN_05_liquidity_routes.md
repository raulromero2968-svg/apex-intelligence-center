# Liquidity Routes

## Immutable zkEVM Orderbook

The Immutable orderbook is a centralized orderbook contract that aggregates listings from multiple sources.

### Orderbook Contract
- **Address**: `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506`
- **Network**: Immutable zkEVM (Chain ID: 13371)
- **Interface**: Standard orderbook interface

### Price Discovery
1. Query active orders for target collection
2. Filter by expiration (active orders only)
3. Sort by price ascending
4. Floor price = minimum active order price

### Currency Conversion
- **ETH to USD**: Use on-chain oracle if available, otherwise use fallback rate (1 ETH = $2500 USD)
- **Oracle Contract**: `0x0000000000000000000000000000000000000000` (placeholder, implement actual oracle)

## Ronin Marketplace

The Ronin marketplace is a native marketplace contract on the Ronin chain.

### Marketplace Contract
- **Address**: `0x213073989821f738a7ba3520c3d31a1f9ad31bbd`
- **Network**: Ronin (Chain ID: 2020)
- **Interface**: Standard marketplace interface

### Price Discovery
1. Query active listings for target collection
2. Filter by active status
3. Sort by price ascending
4. Floor price = minimum active listing price

### Currency Conversion
- **RON to USD**: Use on-chain oracle if available, otherwise use fallback rate (1 RON = $2.50 USD)
- **Oracle Contract**: `0x0000000000000000000000000000000000000000` (placeholder, implement actual oracle)

## Fallback Rates

If on-chain oracles are unavailable, use these fallback rates:
- **ETH/USD**: $2500
- **RON/USD**: $2.50
- **IMX/USD**: $1.50 (if needed)
- **USDC/USD**: $1.00

These rates should be updated periodically or replaced with actual oracle integrations.

