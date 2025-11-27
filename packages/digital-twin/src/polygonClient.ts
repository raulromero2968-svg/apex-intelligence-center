import { ethers } from 'ethers';
import type { MintResult } from './types';

if (!process.env.POLYGON_RPC_URL) {
  throw new Error('POLYGON_RPC_URL environment variable is required');
}

if (!process.env.DIGITAL_TWIN_CONTRACT_ADDR) {
  throw new Error('DIGITAL_TWIN_CONTRACT_ADDR environment variable is required');
}

if (!process.env.DIGITAL_TWIN_MINTER_PRIVATE_KEY) {
  throw new Error('DIGITAL_TWIN_MINTER_PRIVATE_KEY environment variable is required');
}

// Minimal ERC-721 mint ABI
const DIGITAL_TWIN_ABI = [
  'function mint(address to, string memory metadataUri) external returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
] as const;

/**
 * Polygon client for minting digital twin NFTs
 */
export class PolygonClient {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.POLYGON_RPC_URL!;
    const contractAddress = process.env.DIGITAL_TWIN_CONTRACT_ADDR!;
    const privateKey = process.env.DIGITAL_TWIN_MINTER_PRIVATE_KEY!;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, DIGITAL_TWIN_ABI, this.wallet);
  }

  /**
   * Mint a digital twin NFT on Polygon
   * @param metadataUri - URI pointing to the NFT metadata (IPFS, HTTP, or data URI)
   * @param toAddress - Address to receive the NFT (defaults to wallet address)
   * @returns Token ID and transaction hash
   */
  async mintDigitalTwin(
    metadataUri: string,
    toAddress?: string
  ): Promise<MintResult> {
    try {
      const recipient = toAddress || this.wallet.address;

      // Estimate gas first
      const gasEstimate = await this.contract.mint.estimateGas(recipient, metadataUri);
      
      // Mint with gas buffer
      const tx = await this.contract.mint(recipient, metadataUri, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100), // 20% buffer
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      // Extract token ID from Transfer event
      const transferEvent = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'Transfer';
        } catch {
          return false;
        }
      });

      if (!transferEvent) {
        throw new Error('Transfer event not found in transaction receipt');
      }

      const parsed = this.contract.interface.parseLog(transferEvent);
      const tokenId = parsed?.args[2]?.toString();

      if (!tokenId) {
        throw new Error('Token ID not found in Transfer event');
      }

      return {
        tokenId,
        txHash: receipt.hash,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to mint digital twin: ${error.message}`);
      }
      throw new Error(`Failed to mint digital twin: ${String(error)}`);
    }
  }

  /**
   * Get the token URI for a minted NFT
   */
  async getTokenURI(tokenId: string): Promise<string> {
    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get token URI: ${error.message}`);
      }
      throw new Error(`Failed to get token URI: ${String(error)}`);
    }
  }

  /**
   * Get the chain ID
   */
  async getChainId(): Promise<number> {
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }
}

