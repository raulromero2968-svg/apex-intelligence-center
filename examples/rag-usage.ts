/**
 * RAG System Usage Examples
 *
 * This file demonstrates how to use the Apex Intelligence RAG system
 * for various use cases.
 *
 * Run with:
 *   npx tsx examples/rag-usage.ts
 */

import {
  executeRagQuery,
  formatRagResponse,
  hybridSearch,
  vectorSearch,
  keywordSearch,
  rerankResults,
} from '@/rag';

/**
 * Example 1: Basic RAG Query
 *
 * Execute a complete RAG query with automatic retrieval,
 * reranking, and citation enforcement.
 */
async function example1_basicRagQuery() {
  console.log('\n=== Example 1: Basic RAG Query ===\n');

  const response = await executeRagQuery(
    "What is the ROI on PSA 10 vs BGS 9.5 for 1st Edition Charizard?"
  );

  console.log('Answer:', response.answer);
  console.log('\nMetadata:');
  console.log('- Citation Count:', response.citationCount);
  console.log('- Synthesis Count:', response.synthesisCount);
  console.log('- Valid:', response.isValid);
  console.log('- Sources:', response.sources.length);

  if (!response.isValid) {
    console.log('\n⚠️ Validation Errors:');
    response.validationErrors.forEach(err => console.log(`  - ${err}`));
  }
}

/**
 * Example 2: Formatted Response
 *
 * Get a markdown-formatted response with inline sources
 */
async function example2_formattedResponse() {
  console.log('\n=== Example 2: Formatted Response ===\n');

  const response = await executeRagQuery(
    "What are the recent price trends for graded Charizard cards?"
  );

  const markdown = formatRagResponse(response);
  console.log(markdown);
}

/**
 * Example 3: Hybrid Search Only
 *
 * Use the search engine without LLM generation
 */
async function example3_hybridSearch() {
  console.log('\n=== Example 3: Hybrid Search ===\n');

  const results = await hybridSearch({
    query: "Charizard PSA 10 price",
    limit: 5,
    filters: {
      card_name: "Charizard",
      grade: "PSA 10"
    }
  });

  console.log(`Found ${results.length} results:\n`);
  results.forEach((result, i) => {
    console.log(`[${i + 1}] Score: ${result.score.toFixed(3)}`);
    console.log(`    Source: ${result.source_type}`);
    console.log(`    Content: ${result.content.slice(0, 100)}...`);
    console.log(`    Card: ${result.metadata.card_name} - ${result.metadata.grade || 'N/A'}`);
    console.log();
  });
}

/**
 * Example 4: Vector Search (Semantic Only)
 *
 * Pure semantic search without keyword matching
 */
async function example4_vectorSearch() {
  console.log('\n=== Example 4: Vector Search (Semantic) ===\n');

  const results = await vectorSearch(
    "What cards have the best investment potential?",
    5
  );

  console.log(`Found ${results.length} semantically similar documents:\n`);
  results.forEach((result, i) => {
    console.log(`[${i + 1}] Score: ${result.score.toFixed(3)}`);
    console.log(`    ${result.content.slice(0, 150)}...`);
    console.log();
  });
}

/**
 * Example 5: Keyword Search (BM25-style)
 *
 * Exact keyword matching for specific terms
 */
async function example5_keywordSearch() {
  console.log('\n=== Example 5: Keyword Search ===\n');

  const results = await keywordSearch(
    "PSA 10 population",
    5
  );

  console.log(`Found ${results.length} keyword matches:\n`);
  results.forEach((result, i) => {
    console.log(`[${i + 1}] Score: ${result.score.toFixed(3)}`);
    console.log(`    ${result.content.slice(0, 150)}...`);
    console.log();
  });
}

/**
 * Example 6: Search with Reranking
 *
 * Demonstrate the power of reranking for relevance
 */
async function example6_searchWithReranking() {
  console.log('\n=== Example 6: Search with Reranking ===\n');

  // Initial hybrid search
  const searchResults = await hybridSearch({
    query: "ROI comparison between different grading companies",
    limit: 20 // Get more results for reranking
  });

  console.log(`Initial search: ${searchResults.length} results`);
  console.log('Top 3 before reranking:');
  searchResults.slice(0, 3).forEach((result, i) => {
    console.log(`  [${i + 1}] Score: ${result.score.toFixed(3)} - ${result.content.slice(0, 80)}...`);
  });

  // Rerank for better relevance
  const reranked = await rerankResults(
    "ROI comparison between different grading companies",
    searchResults,
    5
  );

  console.log('\nTop 5 after reranking:');
  reranked.forEach((result, i) => {
    console.log(`  [${i + 1}] Rerank Score: ${result.rerankScore.toFixed(3)} (was ${result.originalScore.toFixed(3)})`);
    console.log(`      ${result.content.slice(0, 80)}...`);
  });
}

/**
 * Example 7: Advanced Filtering
 *
 * Use metadata filters to narrow results
 */
async function example7_advancedFiltering() {
  console.log('\n=== Example 7: Advanced Filtering ===\n');

  const results = await hybridSearch({
    query: "card prices",
    limit: 10,
    filters: {
      source_type: "ebay_listing",
      grade: "PSA 10",
      min_price: 10000, // Only show cards over $10k
      date_from: "2025-10-01" // Only recent sales
    }
  });

  console.log(`Found ${results.length} high-value recent sales:\n`);
  results.forEach((result, i) => {
    console.log(`[${i + 1}] ${result.metadata.card_name} - ${result.metadata.grade}`);
    console.log(`    Price: $${result.metadata.sale_price?.toLocaleString()}`);
    console.log(`    Date: ${result.metadata.sale_date}`);
    console.log();
  });
}

/**
 * Example 8: Multiple Queries
 *
 * Show how to execute multiple RAG queries efficiently
 */
async function example8_multipleQueries() {
  console.log('\n=== Example 8: Multiple Queries ===\n');

  const queries = [
    "What is the PSA 10 population for Base Set Charizard?",
    "What are the recent sale prices for BGS 9.5 Charizard?",
    "How does Blastoise compare to Charizard in value?"
  ];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    const response = await executeRagQuery(query);
    console.log('Answer:', response.answer.slice(0, 200) + '...');
    console.log(`Citations: ${response.citationCount}, Sources: ${response.sources.length}`);
  }
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Apex Intelligence RAG System - Usage Examples');
  console.log('='.repeat(60));

  try {
    // Run examples (comment out any you don't want to run)
    await example1_basicRagQuery();
    // await example2_formattedResponse();
    // await example3_hybridSearch();
    // await example4_vectorSearch();
    // await example5_keywordSearch();
    // await example6_searchWithReranking();
    // await example7_advancedFiltering();
    // await example8_multipleQueries();

    console.log('\n✅ All examples completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use in other modules
export {
  example1_basicRagQuery,
  example2_formattedResponse,
  example3_hybridSearch,
  example4_vectorSearch,
  example5_keywordSearch,
  example6_searchWithReranking,
  example7_advancedFiltering,
  example8_multipleQueries,
};
