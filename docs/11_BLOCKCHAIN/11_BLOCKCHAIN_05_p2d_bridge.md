# P2D Bridge (Physical-to-Digital)

## Overview

The P2D (Physical-to-Digital) Bridge enables linking physical trading cards to their digital representations on blockchain networks. This bridge creates a verifiable, immutable connection between a physical card's unique fingerprint and its on-chain digital twin NFT.

## Architecture

### Core Components

1. **Card Fingerprinting**: Unique hash-based identification of physical cards
2. **Digital Twin Minting**: Creation of corresponding NFT on blockchain
3. **Verification System**: Proof-of-existence linking physical card to NFT
4. **Ownership Tracking**: Transfer of digital twin reflects physical card ownership

## Fingerprint Requirements

### Hash-Based Identification

- **Fingerprint Vector**: 256-dimensional normalized vector from vision embedding
- **Fingerprint Hex**: SHA-256 digest of quantized vector (64-char hex)
- **Uniqueness Target**: 99.9% collision-free within same card/grade cohort
- **Versioning**: Hash version tracking for algorithm evolution

### Collision Resistance

- High-entropy fingerprint generation
- pgvector distance threshold for near-duplicate detection
- Grade-aware fingerprinting (same card, different grades = different fingerprints)

## Digital Twin NFT Standard

### ERC-721 Metadata

```json
{
  "name": "Card Digital Twin: {cardName}",
  "description": "Digital twin of physical card with fingerprint {fingerprintHex}",
  "image": "{cardImageUrl}",
  "attributes": [
    {
      "trait_type": "Fingerprint Hash",
      "value": "{fingerprintHex}"
    },
    {
      "trait_type": "Hash Version",
      "value": "{hashVersion}"
    },
    {
      "trait_type": "Grade",
      "value": "{grade}"
    },
    {
      "trait_type": "Card ID",
      "value": "{cardId}"
    }
  ]
}
```

### On-Chain Storage

- **Fingerprint Hash**: Stored in NFT metadata (IPFS or on-chain)
- **Verification Link**: Smart contract stores fingerprint → NFT mapping
- **Ownership History**: Immutable chain of custody on blockchain

## Bridge Workflow

### 1. Physical Card Scan

1. User scans physical card using VARC Scan v1
2. System generates fingerprint (vector + hex)
3. System checks for existing fingerprints (deduplication)
4. If unique, proceed to digital twin creation

### 2. Digital Twin Creation

1. Mint NFT on supported blockchain (Immutable zkEVM or Ronin)
2. Store fingerprint hash in NFT metadata
3. Create on-chain verification record
4. Link physical fingerprint to NFT token ID

### 3. Verification & Transfer

1. Physical card ownership transfer
2. Digital twin NFT transfer (mirrors physical ownership)
3. Verification: Fingerprint hash matches on-chain record
4. Immutable ownership history preserved

## Supported Networks

- **Immutable zkEVM**: Primary network for digital twins
- **Ronin**: Secondary network for gaming-focused cards

## Security Considerations

- **Fingerprint Uniqueness**: Prevents duplicate digital twins for same physical card
- **Immutable Records**: Blockchain ensures tamper-proof ownership history
- **Verification**: On-chain fingerprint hash prevents fraud
- **Versioning**: Hash version tracking allows algorithm updates without breaking existing links

## Future Enhancements

- Cross-chain digital twin bridges
- Multi-signature verification for high-value cards
- Automated ownership sync (physical → digital)
- Marketplace integration for digital twin trading

