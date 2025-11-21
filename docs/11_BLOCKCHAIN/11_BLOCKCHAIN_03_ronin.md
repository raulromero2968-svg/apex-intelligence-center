# Ronin Integration

## Collections

### Runes TCG
- **Collection ID**: `runes_tcg`
- **Token Contract**: `0x32950db2a7164aE833121501C797D79E7B79d74C`
- **Currency**: RON
- **Liquidity Venue**: `ronin-marketplace`
- **Marketplace Contract**: `0x213073989821f738a7ba3520c3d31a1f9ad31bbd`

## Marketplace Contract Interface

The Ronin marketplace contract uses the following interface:

```solidity
interface IMarketplace {
    struct Listing {
        address seller;
        address tokenContract;
        uint256 tokenId;
        uint256 price;
        uint256 expiration;
        bool active;
    }
    
    function getFloorPrice(address tokenContract) external view returns (uint256);
    function getActiveListings(address tokenContract, uint256 limit) external view returns (Listing[] memory);
}
```

## Floor Price Computation

1. Query `getFloorPrice(tokenContract)` for the canonical floor price
2. If not available, query `getActiveListings(tokenContract, 100)` and find minimum price
3. Convert price from wei to RON
4. Convert RON to USD using on-chain oracle or fixed rate (1 RON = $2.50 USD as fallback)

## Event Topics

- **ListingCreated**: `keccak256("ListingCreated(address,address,uint256,uint256)")`
- **ListingSold**: `keccak256("ListingSold(address,address,uint256,uint256)")`
- **ListingCancelled**: `keccak256("ListingCancelled(address,address,uint256)")`

