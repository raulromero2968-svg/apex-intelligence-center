/**
 * Symbol Extractor for Trading Card Names
 *
 * Extracts trading card symbols/names from research answers to enable
 * live price tracking. Uses common TCG card name patterns.
 */

// Common TCG card names and patterns
const COMMON_SYMBOLS = [
  'CHARIZARD',
  'PIKACHU',
  'MEWTWO',
  'UMBREON',
  'LUGIA',
  'BLASTOISE',
  'VENUSAUR',
  'RAYQUAZA',
  'GYARADOS',
  'ESPEON',
  'GENGAR',
  'ALAKAZAM',
  'DRAGONITE',
  'SNORLAX',
  'MEW',
  'EEVEE',
  'VAPOREON',
  'JOLTEON',
  'FLAREON',
  'MACHAMP',
];

/**
 * Extract card symbols from text
 *
 * @param text - The research answer text to extract symbols from
 * @returns Array of uppercase card symbols found in the text
 */
export function extractSymbols(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const upperText = text.toUpperCase();
  const found = new Set<string>();

  // Match known symbols
  for (const symbol of COMMON_SYMBOLS) {
    if (upperText.includes(symbol)) {
      found.add(symbol);
    }
  }

  // Also extract capitalized words that might be card names
  // Pattern: Word at start of sentence or after punctuation, all caps or title case
  const capitalizedPattern = /\b([A-Z][A-Z]+)\b/g;
  let match;

  while ((match = capitalizedPattern.exec(upperText)) !== null) {
    const word = match[1];
    // Only include if 4+ characters and not common words
    if (word.length >= 4 && !isCommonWord(word)) {
      found.add(word);
    }
  }

  return Array.from(found).sort();
}

/**
 * Check if a word is a common English word (to filter out non-card names)
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'THAT', 'THIS', 'WITH', 'FROM', 'HAVE', 'BEEN', 'WERE', 'THEY',
    'WHAT', 'WHEN', 'WHERE', 'WHICH', 'THEIR', 'THERE', 'THESE',
    'THOSE', 'WOULD', 'COULD', 'SHOULD', 'ABOUT', 'AFTER', 'BEFORE',
    'BETWEEN', 'DURING', 'THROUGH', 'WHILE', 'SINCE', 'UNTIL',
    'BECAUSE', 'ALTHOUGH', 'HOWEVER', 'THEREFORE', 'MARKET', 'PRICE',
    'CARD', 'CARDS', 'GRADE', 'VALUE', 'SALES', 'DATA', 'BASED',
    'CURRENT', 'RECENT', 'AVERAGE', 'TOTAL', 'OVERALL', 'GENERAL',
  ]);

  return commonWords.has(word);
}

/**
 * Extract symbols with confidence scores
 * Returns symbols that appear multiple times with higher confidence
 */
export function extractSymbolsWithConfidence(text: string): Array<{ symbol: string; confidence: number }> {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const upperText = text.toUpperCase();
  const counts = new Map<string, number>();

  // Count occurrences of known symbols
  for (const symbol of COMMON_SYMBOLS) {
    const regex = new RegExp(`\\b${symbol}\\b`, 'g');
    const matches = upperText.match(regex);
    if (matches) {
      counts.set(symbol, matches.length);
    }
  }

  // Convert to confidence scores (normalized 0-1)
  const maxCount = Math.max(...counts.values(), 1);
  return Array.from(counts.entries())
    .map(([symbol, count]) => ({
      symbol,
      confidence: count / maxCount,
    }))
    .filter(({ confidence }) => confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
}
