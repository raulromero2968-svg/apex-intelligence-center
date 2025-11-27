# Immutable zkEVM Integration

## Collections

### Gods Unchained
- **Collection ID**: `gods_unchained`
- **Token Contract**: `0xacb3c6a43d15b907e8433077b6d38ae40936fe2c`
- **Currency**: ETH
- **Liquidity Venue**: `immutable-orderbook`
- **Orderbook Contract**: `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506`

### Parallel
- **Collection ID**: `parallel`
- **Token Contract**: `0x76be3b62873462d2142405439777e971754e8e77`
- **Currency**: ETH
- **Liquidity Venue**: `immutable-orderbook`
- **Orderbook Contract**: `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506`

### Project O
- **Collection ID**: `project_o`
- **Token Contract**: `0x8c9e8c3d34d3bfdb8f6e8e1d8e9f4c5d6e7f8a9b`
- **Currency**: ETH
- **Liquidity Venue**: `immutable-orderbook`
- **Orderbook Contract**: `0x1b02da8cb0d097eb8d57a175b88c7d8b47997506`

## Orderbook Contract Interface

The Immutable orderbook contract uses the following interface:

```solidity
interface IOrderbook {
    struct Order {
        address maker;
        address taker;
        address tokenContract;
        uint256 tokenId;
        uint256 price;
        uint256 expiration;
    }
    
    function getBestOffer(address tokenContract) external view returns (Order memory);
    function getOrders(address tokenContract, uint256 limit) external view returns (Order[] memory);
}
```

## Floor Price Computation

1. Query `getBestOffer(tokenContract)` for the lowest active listing
2. If no direct offer, query `getOrders(tokenContract, 100)` and find minimum price
3. Convert price from wei to ETH
4. Convert ETH to USD using on-chain oracle or fixed rate (1 ETH = $2500 USD as fallback)

## Event Topics

- **OrderCreated**: `keccak256("OrderCreated(address,address,uint256,uint256)")`
- **OrderFilled**: `keccak256("OrderFilled(address,address,uint256,uint256)")`
- **OrderCancelled**: `keccak256("OrderCancelled(address,address,uint256)")`

