# Apex Founding Member Soulbound NFT

## Overview

The Apex Founding Member NFT is a **Soulbound (non-transferable) ERC-721 token** that grants lifetime Pro subscription access to Apex Intelligence Center. This contract implements strict transfer restrictions to ensure NFTs remain permanently bound to their original minter's wallet.

## Contract Details

- **Contract Name:** ApexSoulbound
- **Token Name:** Apex Founding Member
- **Symbol:** APEX
- **Network:** Base Mainnet
- **Max Supply:** 1,000 tokens
- **Standard:** ERC-721 (Soulbound variant)

## Soulbound Implementation

### Transfer Restrictions

The contract implements the `_beforeTokenTransfer` hook to enforce soulbound behavior:

```solidity
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
) internal virtual override {
    // Block transfers if both from and to are non-zero (Soulbound - non-transferable)
    require(from == address(0) || to == address(0),
        "ApexSoulbound: Token is non-transferable (Soulbound)");

    super._beforeTokenTransfer(from, to, tokenId, batchSize);
}
```

### Allowed Operations

✅ **Minting** (`from == address(0)`)
- Users can mint NFTs to their wallet
- Each wallet can only mint once
- Limited to 1,000 total supply

✅ **Burning** (`to == address(0)`)
- Tokens can be burned if needed

❌ **Transfers** (`from != 0 && to != 0`)
- All transfers between wallets are **blocked**
- Cannot be sold on marketplaces (OpenSea, Blur, etc.)
- Cannot be sent to other addresses
- **This ensures the NFT is truly soulbound**

## Features

### Core Functionality

1. **One NFT per wallet** - `hasMinted` mapping prevents multiple mints
2. **Mint date tracking** - Records when each token was minted
3. **Founding Member verification** - `isFoundingMember()` function
4. **Supply cap** - Hard limit of 1,000 tokens
5. **Gasless minting** - Via Coinbase Paymaster on Base

### Metadata

The NFT metadata is served via API endpoint and includes:

- **OpenSea-compatible attributes**
- **Soulbound indication** - "Transferability: Soulbound - non-transferable"
- **Membership benefits** - Pro subscription, trust score boost
- **IPFS/CDN images**

Metadata endpoint: `/api/nft/metadata/[tokenId]`

Example metadata response:
```json
{
  "name": "Apex Founding Member #1",
  "description": "Soulbound Founding Member NFT granting lifetime Pro subscription access...",
  "image": "https://...",
  "attributes": [
    {
      "trait_type": "Transferability",
      "value": "Soulbound - non-transferable"
    },
    {
      "trait_type": "Membership Type",
      "value": "Founding Member"
    },
    {
      "trait_type": "Trust Score Boost",
      "value": "+10%"
    }
  ],
  "properties": {
    "transferable": false,
    "soulbound": true
  }
}
```

## OpenSea Display

When viewed on OpenSea, the NFT will:

1. Show **"Soulbound - non-transferable"** in attributes
2. Display **grayed-out transfer/sell buttons** (non-functional)
3. Show **properties.soulbound: true** indicator
4. Indicate the token **cannot be transferred**

## Usage

### Deploying the Contract

```bash
# Using Hardhat
npx hardhat run scripts/deploy.ts --network base

# Using Foundry
forge create --rpc-url $BASE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --constructor-args "https://yourdomain.com/api/nft/metadata/" \
  contracts/ApexSoulbound.sol:ApexSoulbound
```

### Minting NFTs

```typescript
import { mintFoundingMemberNFT } from '@/lib/web3/paymaster';

// Gasless minting via Coinbase Paymaster
const result = await mintFoundingMemberNFT(userWalletAddress);
console.log(`Token ID: ${result.tokenId}`);
console.log(`Transaction: ${result.transactionHash}`);
```

### Checking Founding Member Status

```solidity
// On-chain verification
bool isMember = apexSoulbound.isFoundingMember(walletAddress);
uint256 mintDate = apexSoulbound.getMintDate(tokenId);
```

## Security Considerations

### Transfer Prevention

- **Contract-level enforcement** - Cannot be bypassed
- **Marketplace incompatible** - Will revert on all marketplaces
- **Wallet safety** - Even if private key is compromised, NFT cannot be transferred

### Vulnerabilities Mitigated

✅ Prevents theft (non-transferable)
✅ Prevents sale/trading (enforced soulbound)
✅ Prevents rug pulls (lifetime subscription tied to NFT)
✅ Supply cap prevents inflation

## Architecture References

- **Architecture ID:** 13_LAUNCH_06 (Smart Contract)
- **Paymaster Integration:** 13_LAUNCH_05
- **Launch Date:** January 1, 2026
- **Documentation:** PHASE_4_MIGRATION.md

## Benefits for Holders

1. **Lifetime Pro Subscription** - Never pay subscription fees
2. **Trust Score Boost** - +10% permanent boost
3. **Founding Member Badge** - Exclusive recognition
4. **Early Access** - Priority features and updates
5. **Governance Rights** - Future DAO participation

## Testing

### Local Testing

```bash
# Run contract tests
npm test

# Test transfer blocking
npx hardhat test test/soulbound-transfer.test.ts
```

### Expected Behavior

```javascript
// ✅ Should succeed - Minting
await apexSoulbound.mint(userAddress);

// ❌ Should revert - Transfer attempt
await expect(
  apexSoulbound.transferFrom(user1, user2, tokenId)
).to.be.revertedWith("ApexSoulbound: Token is non-transferable (Soulbound)");

// ✅ Should succeed - Burning
await apexSoulbound.burn(tokenId);
```

## Integration with Subscription System

The NFT integrates with the subscription system:

1. User mints Founding Member NFT
2. `nftMinted` flag set in database
3. Backend detects NFT ownership on-chain
4. Automatically grants Pro tier access
5. Subscription never expires (lifetime access)

## Support

For issues or questions:
- GitHub Issues: [apex-intelligence-center/issues]
- Documentation: [PHASE_4_MIGRATION.md]
- Contract Address: [To be deployed]

---

**Built with OpenZeppelin Contracts v4.x**
**Deployed on Base Mainnet**
**Soulbound - Forever Yours**
