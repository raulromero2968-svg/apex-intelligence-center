import { z } from 'zod';

// OTC Order
export const OtcOrderSchema = z.object({
  orderId: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  cardId: z.string().min(1),
  price: z.number().nonnegative(),
  priceCurrency: z.string().min(1),
  size: z.number().int().positive(),
  traderHandle: z.string().nullable().optional(),
  source: z.string().min(1), // "official_otc" | "mirror_site"
  raw: z.record(z.unknown()).optional(),
});

export type OtcOrder = z.infer<typeof OtcOrderSchema>;

// Whitelist Price Tick
export const WhitelistPriceTickSchema = z.object({
  chain: z.string().min(1),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  price: z.string().min(1), // bigint as string
  priceUsd: z.number().nonnegative(),
  blockNumber: z.number().int().nonnegative(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).nullable().optional(),
  observedAt: z.string().datetime(),
});

export type WhitelistPriceTick = z.infer<typeof WhitelistPriceTickSchema>;

// Discord Message
export const DiscordMessageSchema = z.object({
  messageId: z.string().min(1),
  author: z.string().min(1),
  content: z.string(),
  sentimentScore: z.number().min(-1).max(1).nullable().optional(),
  channelId: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type DiscordMessage = z.infer<typeof DiscordMessageSchema>;

// Sentiment Summary
export const SentimentSummarySchema = z.object({
  avgScore: z.number().min(-1).max(1),
  messageCount: z.number().int().nonnegative(),
  trend: z.enum(['improving', 'declining', 'stable']).optional(),
});

export type SentimentSummary = z.infer<typeof SentimentSummarySchema>;
