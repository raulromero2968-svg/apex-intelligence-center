import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

const VAULT_CONTENT_DIR = join(process.cwd(), 'apps/web/content/vault');
const VAULT_WEEKLY_CRON_SECRET = process.env.VAULT_WEEKLY_CRON_SECRET;

/**
 * POST /api/vault/generate-weekly
 * 
 * Protected by VAULT_WEEKLY_CRON_SECRET or Vercel cron header.
 * Generates a new weekly Vault report.
 */
export async function POST(req: NextRequest) {
  try {
    // Check authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = req.headers.get('x-vercel-cron-secret') || 
                      req.headers.get('x-cron-secret');
    
    const isAuthorized = 
      (VAULT_WEEKLY_CRON_SECRET && authHeader === `Bearer ${VAULT_WEEKLY_CRON_SECRET}`) ||
      (cronSecret === VAULT_WEEKLY_CRON_SECRET) ||
      // Vercel cron jobs send a specific header
      (req.headers.get('x-vercel-cron') === '1');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate weekly report
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    const slug = `week-${year}-${week.toString().padStart(2, '0')}`;

    // Ensure content directory exists
    try {
      await mkdir(VAULT_CONTENT_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Check if report already exists
    const filePath = join(VAULT_CONTENT_DIR, `${slug}.mdx`);
    try {
      await require('fs').promises.access(filePath);
      // File exists - return existing
      return NextResponse.json({
        message: 'Report already exists',
        slug,
      });
    } catch {
      // File doesn't exist - create it
    }

    // Generate report content
    const frontmatter = {
      title: `Vault Weekly Report - Week ${week}, ${year}`,
      slug,
      publishedAt: now.toISOString(),
      summary: `Weekly research report covering on-chain data, physical scans, and arbitrage insights for week ${week} of ${year}.`,
    };

    const content = `# ${frontmatter.title}

## Executive Summary

This week's Vault report synthesizes data from multiple intelligence sources:

- **On-Chain Analysis**: Floor price movements across Immutable zkEVM and Ronin networks
- **Physical Scans**: Market condition and liquidity route analysis
- **Arbitrage Opportunities**: Cross-chain and OTC market insights
- **Project O Intelligence**: OTC marketplace activity and whitelist token dynamics

## On-Chain Intelligence

### Floor Price Trends

*[This section would be populated with actual floor price data from blockchain workers]*

### Collection Highlights

- **Gods Unchained**: [Analysis]
- **Parallel**: [Analysis]
- **Project O**: [Analysis]
- **Runes TCG**: [Analysis]

## Physical Market Intelligence

### Liquidity Routes

*[Analysis of liquidity routes and P2D bridge activity]*

### Market Conditions

*[Physical scan data and market condition analysis]*

## Arbitrage Topology

### Cross-Chain Opportunities

*[Analysis of arbitrage opportunities between chains]*

### OTC Market Insights

*[Project O OTC marketplace analysis]*

## Project O Deep Dive

### OTC Orderbook Analysis

*[Detailed analysis of Project O OTC marketplace]*

### Whitelist Token Dynamics

*[Whitelist token price and trading analysis]*

### Discord Sentiment

*[Discord community sentiment analysis]*

## Key Insights

1. *[Key insight 1]*
2. *[Key insight 2]*
3. *[Key insight 3]*

## Recommendations

*[Actionable recommendations based on the week's data]*

---

*Generated: ${now.toISOString()}*
*Report ID: ${slug}*
`;

    // Write MDX file with frontmatter
    const mdxContent = matter.stringify(content, frontmatter);
    await writeFile(filePath, mdxContent, 'utf-8');

    return NextResponse.json({
      message: 'Weekly report generated',
      slug,
      path: filePath,
    });
  } catch (error) {
    console.error('[Vault] Error generating weekly report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}


