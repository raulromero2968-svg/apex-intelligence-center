import { ethers } from 'ethers';
import type { WhitelistPriceTick } from './types';
import { projectOwhitelistPrices } from '@apex/db/src/schema';

const CHAIN_RPC_URL = process.env.PROJECT_O_CHAIN_RPC_URL;
const WHITELIST_TOKEN_ADDR = process.env.PROJECT_O_WHITELIST_TOKEN_ADDR;

if (!CHAIN_RPC_URL) {
  throw new Error('PROJECT_O_CHAIN_RPC_URL environment variable is required');
}

if (!WHITELIST_TOKEN_ADDR) {
  throw new Error('PROJECT_O_WHITELIST_TOKEN_ADDR environment variable is required');
}

// ERC-20 ABI for price discovery (simplified)
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
];

// Uniswap V3 Pool ABI (simplified for price discovery)
const POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
];

// Currency conversion rates (from blockchain config)
const CURRENCY_RATES: Record<string, number> = {
  ETH: 2500,
  RON: 2.5,
  IMX: 1.5,
  USDC: 1.0,
};

function getUsdRate(currency: string): number {
  return CURRENCY_RATES[currency] ?? 1.0;
}

export async function fetchWhitelistPrice(): Promise<WhitelistPriceTick | null> {
  const provider = new ethers.JsonRpcProvider(CHAIN_RPC_URL);
  const tokenContract = new ethers.Contract(WHITELIST_TOKEN_ADDR, ERC20_ABI, provider);

  try {
    // Try to find Uniswap V3 pool or similar DEX
    // For now, we'll use a simplified approach: query recent transfers and estimate price
    // In production, you'd query the actual DEX pool

    // Get recent block
    const latestBlock = await provider.getBlockNumber();
    const block = await provider.getBlock(latestBlock);

    // For now, use a placeholder price calculation
    // In production, query Uniswap V3 pool or similar
    const priceInEth = 0.001; // Placeholder - replace with actual DEX query
    const priceUsd = priceInEth * getUsdRate('ETH');

    return {
      chain: 'immutable_zkevm',
      tokenAddress: WHITELIST_TOKEN_ADDR,
      price: ethers.parseEther(priceInEth.toString()).toString(),
      priceUsd,
      blockNumber: latestBlock,
      txHash: null,
      observedAt: new Date(block.timestamp * 1000).toISOString(),
    };
  } catch (error) {
    console.error('[project-o-whitelist] Error fetching price:', error);
    return null;
  }
}

export async function insertWhitelistPrice(
  db: any,
  tick: WhitelistPriceTick
): Promise<void> {
  await db.insert(projectOwhitelistPrices).values({
    chain: tick.chain,
    tokenAddress: tick.tokenAddress,
    price: tick.price,
    priceUsd: tick.priceUsd.toString(),
    blockNumber: tick.blockNumber,
    txHash: tick.txHash ?? null,
    observedAt: new Date(tick.observedAt),
  });
}
