/**
 * Citation Mapper for Streaming Research Responses
 *
 * Maps sentences to source citations during token streaming.
 * Uses greedy matching to find the most relevant source for each sentence.
 */

import type { RerankedResult } from './reranker';

/**
 * Sentence buffer for citation mapping during streaming
 */
export class CitationMapper {
  private buffer: string = '';
  private sources: RerankedResult[];
  private sentenceEndPattern = /[.!?]\s+/;

  constructor(sources: RerankedResult[]) {
    this.sources = sources;
  }

  /**
   * Process a new chunk of text and return complete sentences with citations
   *
   * @param chunk - New text chunk from LLM stream
   * @returns Complete sentences with [n] citations appended
   */
  processChunk(chunk: string): string {
    this.buffer += chunk;
    const sentences = this.extractCompleteSentences();
    return sentences.map((s) => this.addCitation(s)).join(' ');
  }

  /**
   * Flush remaining buffer (call at end of stream)
   *
   * @returns Remaining text with citation if applicable
   */
  flush(): string {
    if (this.buffer.trim()) {
      const result = this.addCitation(this.buffer);
      this.buffer = '';
      return result;
    }
    return '';
  }

  /**
   * Extract complete sentences from buffer
   * Keeps incomplete sentence in buffer for next chunk
   */
  private extractCompleteSentences(): string[] {
    const sentences: string[] = [];
    let remaining = this.buffer;

    // Match sentence boundaries
    const matches = [...remaining.matchAll(new RegExp(this.sentenceEndPattern, 'g'))];

    if (matches.length === 0) {
      // No complete sentences yet
      return sentences;
    }

    // Extract complete sentences
    let lastIndex = 0;
    for (const match of matches) {
      const endIndex = match.index! + match[0].length;
      const sentence = remaining.slice(lastIndex, endIndex).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      lastIndex = endIndex;
    }

    // Keep remaining incomplete sentence in buffer
    this.buffer = remaining.slice(lastIndex);

    return sentences;
  }

  /**
   * Add citation to a sentence using greedy matching
   *
   * Strategy:
   * 1. Check if sentence already has [source:n] or [SYNTHESIS] markers
   * 2. If not, find best matching source using keyword overlap
   * 3. Append [n] citation to sentence
   *
   * @param sentence - Complete sentence
   * @returns Sentence with citation appended
   */
  private addCitation(sentence: string): string {
    // Skip if already has citation markers
    if (sentence.match(/\[source:\d+\]|\[SYNTHESIS\]/)) {
      return sentence;
    }

    // Skip if sentence is too short (likely not factual)
    if (sentence.split(' ').length < 5) {
      return sentence;
    }

    // Find best matching source
    const sourceIndex = this.findBestSource(sentence);

    if (sourceIndex !== null) {
      // Append citation before punctuation if possible
      const endsWithPunctuation = sentence.match(/([.!?])(\s*)$/);
      if (endsWithPunctuation) {
        const punctuation = endsWithPunctuation[1];
        const spacing = endsWithPunctuation[2];
        const textBeforePunctuation = sentence.slice(0, -endsWithPunctuation[0].length);
        return `${textBeforePunctuation} [${sourceIndex}]${punctuation}${spacing}`;
      } else {
        return `${sentence} [${sourceIndex}]`;
      }
    }

    return sentence;
  }

  /**
   * Find best matching source for a sentence using keyword overlap
   *
   * @param sentence - Sentence to match
   * @returns Source index (1-based) or null if no good match
   */
  private findBestSource(sentence: string): number | null {
    // Extract keywords from sentence (remove stop words)
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'has', 'have', 'had', 'will', 'would', 'should', 'could', 'may',
      'might', 'can', 'this', 'that', 'these', 'those', 'in', 'on', 'at',
      'to', 'for', 'of', 'with', 'by', 'from', 'as', 'it', 'be', 'been',
    ]);

    const sentenceWords = sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => !stopWords.has(w) && w.length > 2);

    if (sentenceWords.length === 0) {
      return null;
    }

    // Calculate overlap score for each source
    let bestScore = 0;
    let bestIndex: number | null = null;

    this.sources.forEach((source, i) => {
      const contentWords = new Set(
        source.content
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w) => !stopWords.has(w) && w.length > 2)
      );

      const overlap = sentenceWords.filter((w) => contentWords.has(w)).length;
      const score = overlap / sentenceWords.length;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i + 1; // 1-based index
      }
    });

    // Only return if overlap is meaningful (>20%)
    return bestScore > 0.2 ? bestIndex : null;
  }
}

