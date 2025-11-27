import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import type { DiscordMessage, SentimentSummary } from './types';
import { projectOdiscordMessages } from '@apex/db/src/schema';
import { eq, desc } from 'drizzle-orm';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_PROJECT_O_CHANNEL_ID;

if (!DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN environment variable is required');
}

if (!DISCORD_CHANNEL_ID) {
  throw new Error('DISCORD_PROJECT_O_CHANNEL_ID environment variable is required');
}

// Simple sentiment classifier (can be replaced with OpenAI or more sophisticated model)
function classifySentiment(text: string): number {
  const lowerText = text.toLowerCase();
  
  // Positive indicators
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'bullish', 'moon', 'pump', 'buy', 'hodl'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'bearish', 'dump', 'sell', 'scam', 'rug'];
  
  let score = 0;
  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 0.1;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 0.1;
  }
  
  // Clamp to [-1, 1]
  return Math.max(-1, Math.min(1, score));
}

let discordClient: Client | null = null;

export async function getDiscordClient(): Promise<Client> {
  if (!discordClient) {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    await discordClient.login(DISCORD_BOT_TOKEN);
  }

  return discordClient;
}

export async function fetchDiscordMessages(
  sinceMessageId?: string
): Promise<DiscordMessage[]> {
  const client = await getDiscordClient();
  const channel = (await client.channels.fetch(DISCORD_CHANNEL_ID)) as TextChannel;

  if (!channel) {
    throw new Error(`Channel ${DISCORD_CHANNEL_ID} not found`);
  }

  const messages: DiscordMessage[] = [];
  let lastMessageId = sinceMessageId;

  // Fetch messages in batches
  while (true) {
    const options: { limit: number; before?: string } = { limit: 100 };
    if (lastMessageId) {
      options.before = lastMessageId;
    }

    const batch = await channel.messages.fetch(options);

    if (batch.size === 0) break;

    for (const message of batch.values()) {
      if (message.author.bot) continue; // Skip bot messages

      const sentimentScore = classifySentiment(message.content);

      messages.push({
        messageId: message.id,
        author: message.author.username,
        content: message.content,
        sentimentScore,
        channelId: message.channel.id,
        createdAt: message.createdAt.toISOString(),
      });

      lastMessageId = message.id;
    }

    // Stop if we've reached the sinceMessageId
    if (sinceMessageId && batch.has(sinceMessageId)) {
      break;
    }
  }

  return messages;
}

export async function insertDiscordMessages(
  db: any,
  messages: DiscordMessage[]
): Promise<number> {
  let inserted = 0;

  for (const message of messages) {
    try {
      await db
        .insert(projectOdiscordMessages)
        .values({
          messageId: message.messageId,
          author: message.author,
          content: message.content,
          sentimentScore: message.sentimentScore ?? null,
          channelId: message.channelId,
          createdAt: new Date(message.createdAt),
        })
        .onConflictDoNothing();

      inserted++;
    } catch (error) {
      console.error(`[project-o-discord] Failed to insert message ${message.messageId}:`, error);
    }
  }

  return inserted;
}

export async function getLastMessageId(db: any): Promise<string | null> {
  const result = await db
    .select({ messageId: projectOdiscordMessages.messageId })
    .from(projectOdiscordMessages)
    .orderBy(desc(projectOdiscordMessages.createdAt))
    .limit(1);

  return result[0]?.messageId ?? null;
}

export async function computeSentimentSummary(
  db: any,
  messageCount: number = 100
): Promise<SentimentSummary> {
  const messages = await db
    .select({ sentimentScore: projectOdiscordMessages.sentimentScore })
    .from(projectOdiscordMessages)
    .where(eq(projectOdiscordMessages.channelId, DISCORD_CHANNEL_ID))
    .orderBy(desc(projectOdiscordMessages.createdAt))
    .limit(messageCount);

  if (messages.length === 0) {
    return {
      avgScore: 0,
      messageCount: 0,
      trend: 'stable',
    };
  }

  const scores = messages
    .map((m: any) => m.sentimentScore)
    .filter((s: number | null) => s !== null) as number[];

  const avgScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  // Simple trend calculation (compare last 50% vs first 50%)
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (scores.length >= 10) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.1) {
      trend = 'improving';
    } else if (secondAvg < firstAvg - 0.1) {
      trend = 'declining';
    }
  }

  return {
    avgScore,
    messageCount: messages.length,
    trend,
  };
}
