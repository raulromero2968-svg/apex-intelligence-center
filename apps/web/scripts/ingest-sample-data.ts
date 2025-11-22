/**
 * Sample Data Ingestion Script
 *
 * This script demonstrates how to ingest TCG market data from various sources
 * into the RAG system. It includes sample data for eBay listings, PSA population
 * reports, and news articles.
 *
 * Usage:
 *   npx tsx scripts/ingest-sample-data.ts
 *
 * Environment variables required:
 *   - POSTGRES_URL or DATABASE_URL
 *   - OPENAI_API_KEY
 */

import { ingestEbayListings, ingestPsaPopReports, ingestNewsArticles } from '@/rag';

/**
 * Sample eBay listings data
 *
 * In production, this would come from:
 * - eBay API
 * - Web scraping (with proper rate limiting and ToS compliance)
 * - CSV exports from data providers
 */
const sampleEbayListings = [
  {
    title: "Pokemon 1st Edition Charizard Holo Base Set 4/102 PSA 10 GEM MINT",
    description: "Extremely rare 1st Edition Charizard in PSA 10 condition. This is the holy grail of Pokemon cards. Card is in pristine condition with perfect centering, no scratches, and vibrant colors. Authenticated and graded by PSA. Serial number: 12345678.",
    card_name: "Charizard",
    set: "Base Set",
    grade: "PSA 10",
    sale_price: 15000.00,
    sale_date: "2025-10-28",
    auction_id: "175123456789",
    source_url: "https://www.ebay.com/itm/175123456789"
  },
  {
    title: "Pokemon 1st Edition Charizard Holo Base Set BGS 9.5 GEM MINT",
    description: "Beautiful 1st Edition Charizard graded BGS 9.5 with quad 9.5 sub-grades. Near-perfect card with excellent centering and sharp corners. BGS authentication ensures quality.",
    card_name: "Charizard",
    set: "Base Set",
    grade: "BGS 9.5",
    sale_price: 12500.00,
    sale_date: "2025-11-01",
    auction_id: "175234567890",
    source_url: "https://www.ebay.com/itm/175234567890"
  },
  {
    title: "Pokemon Shadowless Charizard Base Set PSA 9 MINT",
    description: "Shadowless Charizard in PSA 9 condition. Beautiful card from the most desirable Pokemon set. Clean surfaces and strong colors.",
    card_name: "Charizard",
    set: "Base Set (Shadowless)",
    grade: "PSA 9",
    sale_price: 8500.00,
    sale_date: "2025-11-10",
    auction_id: "175345678901",
    source_url: "https://www.ebay.com/itm/175345678901"
  },
  {
    title: "Pokemon Blastoise 1st Edition Base Set PSA 10",
    description: "Stunning PSA 10 1st Edition Blastoise. One of the iconic original Pokemon cards. Perfect centering and sharp edges.",
    card_name: "Blastoise",
    set: "Base Set",
    grade: "PSA 10",
    sale_price: 3200.00,
    sale_date: "2025-11-12",
    auction_id: "175456789012",
    source_url: "https://www.ebay.com/itm/175456789012"
  },
  {
    title: "Pokemon Venusaur 1st Edition Base Set PSA 9",
    description: "Beautiful 1st Edition Venusaur in PSA 9 condition. Third member of the iconic starter trio.",
    card_name: "Venusaur",
    set: "Base Set",
    grade: "PSA 9",
    sale_price: 1100.00,
    sale_date: "2025-11-14",
    auction_id: "175567890123",
    source_url: "https://www.ebay.com/itm/175567890123"
  }
];

/**
 * Sample PSA population report data
 *
 * In production, this would come from:
 * - PSA API (if available)
 * - Web scraping PSA website
 * - Third-party data providers
 */
const samplePsaPopReports = [
  {
    card_name: "Charizard",
    set: "Base Set",
    set_number: "4",
    grade: "PSA 10",
    population: 7826,
    report_date: "2025-11-01",
    source_url: "https://www.psacard.com/pop/tcg-cards/1999/pokemon-base-set/4"
  },
  {
    card_name: "Charizard",
    set: "Base Set",
    set_number: "4",
    grade: "PSA 9",
    population: 15432,
    report_date: "2025-11-01",
    source_url: "https://www.psacard.com/pop/tcg-cards/1999/pokemon-base-set/4"
  },
  {
    card_name: "Charizard",
    set: "Base Set (Shadowless)",
    set_number: "4",
    grade: "PSA 10",
    population: 302,
    report_date: "2025-11-01",
    source_url: "https://www.psacard.com/pop/tcg-cards/1999/pokemon-base-set-shadowless/4"
  },
  {
    card_name: "Blastoise",
    set: "Base Set",
    set_number: "2",
    grade: "PSA 10",
    population: 2145,
    report_date: "2025-11-01",
    source_url: "https://www.psacard.com/pop/tcg-cards/1999/pokemon-base-set/2"
  },
  {
    card_name: "Venusaur",
    set: "Base Set",
    set_number: "15",
    grade: "PSA 10",
    population: 1987,
    report_date: "2025-11-01",
    source_url: "https://www.psacard.com/pop/tcg-cards/1999/pokemon-base-set/15"
  }
];

/**
 * Sample news articles
 *
 * In production, this would come from:
 * - TCGPlayer Infinite RSS feed
 * - PokeBeach news
 * - Reddit TCG communities
 * - Custom web scraping
 */
const sampleNewsArticles = [
  {
    title: "1st Edition Charizard Prices Continue to Climb in 2025",
    content: `The market for 1st Edition Base Set Charizard cards continues to show remarkable strength in 2025. PSA 10 examples have been consistently selling above $15,000, with some reaching as high as $18,000 at major auctions.

Market analysts attribute this continued growth to several factors:

1. Increased scarcity: The PSA 10 population has remained relatively stable at around 300 copies for shadowless versions, creating supply constraints.

2. Growing collector base: More millennials with disposable income are entering the hobby, driving demand for nostalgic cards from their childhood.

3. Investment interest: Alternative asset investors have been viewing high-grade Pokemon cards as a legitimate investment vehicle, similar to classic cars or fine art.

Comparatively, BGS 9.5 examples (which some collectors consider equivalent to PSA 10) have been trading in the $12,000-$13,000 range, offering a potential value proposition for buyers.

The price differential between PSA 9 and PSA 10 grades has also widened significantly. PSA 9 examples are selling around $8,500, while PSA 10s command nearly double that price. This represents a premium of approximately 76% for the top grade.

Looking ahead, experts predict continued strength in the 1st Edition Charizard market, though the rate of appreciation may slow compared to the explosive growth seen in 2020-2021.`,
    author: "Michael Chen",
    publication: "TCGPlayer Infinite",
    publish_date: "2025-11-15",
    source_url: "https://infinite.tcgplayer.com/article/charizard-prices-2025"
  },
  {
    title: "Understanding ROI: PSA vs BGS Grading for Investment Cards",
    content: `For investors in the TCG market, one of the most critical decisions is choosing between PSA and BGS (Beckett Grading Services) for card grading. This choice can significantly impact both the cost of entry and potential returns.

Our analysis of sales data from Q4 2024 and Q1 2025 reveals interesting patterns:

PSA Advantages:
- Higher liquidity: PSA-graded cards typically sell faster and to a broader audience
- Brand recognition: PSA is more widely recognized among casual collectors
- Price premium: For the same card, PSA 10 often commands 15-20% more than BGS 9.5

BGS Advantages:
- Sub-grades: BGS provides detailed sub-grade information (centering, corners, edges, surface)
- Black Label (BGS 10): The "pristine 10" designation can command massive premiums for rare cards
- Lower populations: BGS tends to grade fewer cards overall, potentially adding scarcity value

ROI Analysis for Charizard 1st Edition:
- PSA 10: ~$15,000 current market value, up from ~$8,000 in 2023 (87.5% ROI over 2 years)
- BGS 9.5: ~$12,500 current market value, up from ~$7,000 in 2023 (78.6% ROI over 2 years)

The PSA premium appears to be growing, suggesting that for blue-chip cards like 1st Edition Charizard, PSA grading may offer better long-term value retention.`,
    author: "Sarah Johnson",
    publication: "TCG Market Analysis",
    publish_date: "2025-11-10",
    source_url: "https://tcgmarketanalysis.com/article/psa-vs-bgs-roi"
  }
];

/**
 * Main ingestion function
 */
async function main() {
  console.log('🚀 Starting TCG data ingestion...\n');

  try {
    // 1. Ingest eBay listings
    console.log('📦 Ingesting eBay listings...');
    const ebayResult = await ingestEbayListings(sampleEbayListings);
    console.log(`✅ eBay ingestion complete:`, {
      totalItems: ebayResult.totalItems,
      newDocuments: ebayResult.newDocuments,
      updatedDocuments: ebayResult.updatedDocuments,
      chunks: ebayResult.chunks,
      errors: ebayResult.errors,
    });
    console.log();

    // 2. Ingest PSA population reports
    console.log('📊 Ingesting PSA population reports...');
    const psaResult = await ingestPsaPopReports(samplePsaPopReports);
    console.log(`✅ PSA ingestion complete:`, {
      totalItems: psaResult.totalItems,
      newDocuments: psaResult.newDocuments,
      updatedDocuments: psaResult.updatedDocuments,
      chunks: psaResult.chunks,
      errors: psaResult.errors,
    });
    console.log();

    // 3. Ingest news articles
    console.log('📰 Ingesting news articles...');
    const newsResult = await ingestNewsArticles(sampleNewsArticles);
    console.log(`✅ News ingestion complete:`, {
      totalItems: newsResult.totalItems,
      newDocuments: newsResult.newDocuments,
      updatedDocuments: newsResult.updatedDocuments,
      chunks: newsResult.chunks,
      errors: newsResult.errors,
    });
    console.log();

    // 4. Summary
    const totalNew = ebayResult.newDocuments + psaResult.newDocuments + newsResult.newDocuments;
    const totalUpdated = ebayResult.updatedDocuments + psaResult.updatedDocuments + newsResult.updatedDocuments;
    const totalChunks = ebayResult.chunks + psaResult.chunks + newsResult.chunks;
    const totalErrors = ebayResult.errors + psaResult.errors + newsResult.errors;

    console.log('✨ Ingestion Summary:');
    console.log(`   - Total Documents Created: ${totalNew}`);
    console.log(`   - Total Documents Updated: ${totalUpdated}`);
    console.log(`   - Total Chunks: ${totalChunks}`);
    console.log(`   - Total Errors: ${totalErrors}`);
    console.log();

    if (totalErrors === 0) {
      console.log('🎉 All data ingested successfully!');
    } else {
      console.log(`⚠️  Ingestion completed with ${totalErrors} error(s). Check logs for details.`);
    }

    // Close database connection
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during ingestion:', error);
    process.exit(1);
  }
}

// Run the script
main();
