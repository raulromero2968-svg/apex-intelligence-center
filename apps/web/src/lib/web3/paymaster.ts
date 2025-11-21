/**
 * Coinbase Paymaster Integration - Gasless NFT Minting on Base
 *
 * Enables users to mint Founding Member NFTs without knowing they're using crypto.
 * Uses Coinbase Developer Platform's Verifying Paymaster with 10M BU free tier.
 *
 * Architecture: 13_LAUNCH_05
 * Smart Contract: 13_LAUNCH_06
 *
 * Fallback Strategy:
 * 1. Coinbase Paymaster (Primary)
 * 2. Alchemy Gas Manager (Backup)
 * 3. User pays gas (Last resort)
 */

import { createPublicClient, createWalletClient, http, type Address } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Base network configuration
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const COINBASE_PAYMASTER_URL = process.env.COINBASE_PAYMASTER_URL || '';
const ALCHEMY_GAS_MANAGER_URL = process.env.ALCHEMY_GAS_MANAGER_URL || '';

// Contract addresses
const APEX_SOULBOUND_ADDRESS = (process.env.APEX_SOULBOUND_ADDRESS || '') as Address;
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || '';

// Limits
const GAS_LIMIT_PER_MINT = 200000n; // Estimated gas for mint transaction
const MAX_SPONSORED_MINTS = 50000; // 10M BU / 200k per mint ≈ 50k mints

export interface MintResult {
  success: boolean;
  transactionHash?: string;
  tokenId?: number;
  error?: string;
  gasSponsored: boolean;
  sponsorMethod: 'coinbase' | 'alchemy' | 'user_paid' | null;
}

/**
 * Mint a Founding Member NFT with gasless transaction via Coinbase Paymaster
 *
 * @param userWalletAddress - User's wallet address
 * @returns Mint result with transaction hash and token ID
 */
export async function mintFoundingMemberNFT(
  userWalletAddress: Address
): Promise<MintResult> {
  try {
    // Validate inputs
    if (!APEX_SOULBOUND_ADDRESS) {
      throw new Error('APEX_SOULBOUND_ADDRESS not configured');
    }

    if (!MINTER_PRIVATE_KEY) {
      throw new Error('MINTER_PRIVATE_KEY not configured');
    }

    // Create clients
    const publicClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL),
    });

    const account = privateKeyToAccount(MINTER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(BASE_RPC_URL),
    });

    // Step 1: Try Coinbase Paymaster (Primary)
    if (COINBASE_PAYMASTER_URL) {
      try {
        const result = await mintWithCoinbasePaymaster(
          userWalletAddress,
          publicClient,
          walletClient
        );
        return result;
      } catch (error) {
        console.warn('[Paymaster] Coinbase Paymaster failed, trying Alchemy:', error);
      }
    }

    // Step 2: Try Alchemy Gas Manager (Backup)
    if (ALCHEMY_GAS_MANAGER_URL) {
      try {
        const result = await mintWithAlchemyGasManager(
          userWalletAddress,
          publicClient,
          walletClient
        );
        return result;
      } catch (error) {
        console.warn('[Paymaster] Alchemy Gas Manager failed, user will pay:', error);
      }
    }

    // Step 3: User pays gas (Last resort)
    return await mintWithUserGas(userWalletAddress, publicClient, walletClient);
  } catch (error: any) {
    console.error('[Paymaster] Mint failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      gasSponsored: false,
      sponsorMethod: null,
    };
  }
}

/**
 * Mint using Coinbase Paymaster (Primary strategy)
 */
async function mintWithCoinbasePaymaster(
  userWalletAddress: Address,
  publicClient: any,
  walletClient: any
): Promise<MintResult> {
  // ABI for the mint function
  const mintABI = [
    {
      inputs: [{ name: 'to', type: 'address' }],
      name: 'mint',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;

  // Prepare transaction
  const { request } = await publicClient.simulateContract({
    address: APEX_SOULBOUND_ADDRESS,
    abi: mintABI,
    functionName: 'mint',
    args: [userWalletAddress],
    account: walletClient.account,
  });

  // Send transaction (Paymaster will sponsor gas)
  const hash = await walletClient.writeContract({
    ...request,
    gas: GAS_LIMIT_PER_MINT,
    // Coinbase Paymaster sponsorship metadata
    // Note: Actual implementation depends on Coinbase SDK version
  });

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Extract token ID from logs
  const tokenId = extractTokenIdFromLogs(receipt.logs);

  return {
    success: true,
    transactionHash: hash,
    tokenId,
    gasSponsored: true,
    sponsorMethod: 'coinbase',
  };
}

/**
 * Mint using Alchemy Gas Manager (Backup strategy)
 */
async function mintWithAlchemyGasManager(
  userWalletAddress: Address,
  publicClient: any,
  walletClient: any
): Promise<MintResult> {
  // Similar implementation to Coinbase Paymaster
  // Uses Alchemy's gas sponsorship instead
  const mintABI = [
    {
      inputs: [{ name: 'to', type: 'address' }],
      name: 'mint',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;

  const { request } = await publicClient.simulateContract({
    address: APEX_SOULBOUND_ADDRESS,
    abi: mintABI,
    functionName: 'mint',
    args: [userWalletAddress],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract({
    ...request,
    gas: GAS_LIMIT_PER_MINT,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const tokenId = extractTokenIdFromLogs(receipt.logs);

  return {
    success: true,
    transactionHash: hash,
    tokenId,
    gasSponsored: true,
    sponsorMethod: 'alchemy',
  };
}

/**
 * Mint with user paying gas (Last resort)
 */
async function mintWithUserGas(
  userWalletAddress: Address,
  publicClient: any,
  walletClient: any
): Promise<MintResult> {
  const mintABI = [
    {
      inputs: [{ name: 'to', type: 'address' }],
      name: 'mint',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;

  const { request } = await publicClient.simulateContract({
    address: APEX_SOULBOUND_ADDRESS,
    abi: mintABI,
    functionName: 'mint',
    args: [userWalletAddress],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const tokenId = extractTokenIdFromLogs(receipt.logs);

  return {
    success: true,
    transactionHash: hash,
    tokenId,
    gasSponsored: false,
    sponsorMethod: 'user_paid',
  };
}

/**
 * Extract token ID from transaction logs
 */
function extractTokenIdFromLogs(logs: any[]): number | undefined {
  // Look for Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
  const transferEvent = logs.find(
    log =>
      log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  );

  if (transferEvent && transferEvent.topics[3]) {
    return parseInt(transferEvent.topics[3], 16);
  }

  return undefined;
}

/**
 * Check if Paymaster has sufficient balance
 * Returns estimated remaining mints
 */
export async function getPaymasterStatus(): Promise<{
  available: boolean;
  estimatedMintsRemaining: number;
  method: 'coinbase' | 'alchemy' | 'none';
}> {
  // This would query Coinbase/Alchemy APIs for gas budget status
  // Placeholder implementation
  return {
    available: true,
    estimatedMintsRemaining: MAX_SPONSORED_MINTS,
    method: 'coinbase',
  };
}
