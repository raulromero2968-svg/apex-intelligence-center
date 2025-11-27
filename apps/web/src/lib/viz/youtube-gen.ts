import { db } from "@/db";

interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  script: string;
  thumbnailPrompt: string;
}

interface DailyMarketData {
  topGainers: any[];
  topLosers: any[];
  volumeLeaders: any[];
}

/**
 * Generates metadata and script for a daily market update video
 * Used by /api/viz/daily/route.ts
 */
export async function generateDailyYoutubeContent(date: Date = new Date()): Promise<VideoMetadata> {
  console.log(`Generating YouTube content for ${date.toISOString()}...`);

  // Mocking data retrieval for the build
  // Uses neutral descriptors to avoid "financial advice" flags
  const marketSummary = {
    trend: "positive",
    highlightCard: "Black Lotus",
    change: "+5.2%"
  };

  const title = `TCG Market Update: ${date.toLocaleDateString()} | ${marketSummary.highlightCard} Price Movement`;

  const description = `
    Daily TCG Market Data for ${date.toLocaleDateString()}.

    In today's video:
    - Market Direction: ${marketSummary.trend}
    - Top Mover: ${marketSummary.highlightCard} (${marketSummary.change})
    - Market Analysis and data review.

    Disclaimer: Content is for informational purposes only and is not financial advice.

    #TCG #MarketData #MTG #Pokemon #ApexIntelligence
  `;

  const script = `
    [Intro]
    Welcome back to Apex Intelligence. It's ${date.toLocaleDateString()}, and we are reviewing today's market data.

    [Main Segment]
    The most active card today is ${marketSummary.highlightCard}, showing a ${marketSummary.change} variation in transaction value.

    [Outro]
    Review your portfolio data on Apex for more details.
  `;

  return {
    title,
    description,
    tags: ["TCG", "Market Data", "Analysis", "Market Update"],
    script,
    thumbnailPrompt: `YouTube thumbnail, financial chart background, trading card game card ${marketSummary.highlightCard} floating, green arrow, 8k resolution, cinematic lighting`
  };
}

export default generateDailyYoutubeContent;
