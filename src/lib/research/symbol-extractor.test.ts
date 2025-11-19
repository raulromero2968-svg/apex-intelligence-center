import { describe, it, expect } from 'vitest';
import { extractSymbols, extractSymbolsWithConfidence } from './symbol-extractor';

describe('extractSymbols', () => {
  it('should extract known card symbols from text', () => {
    const text = 'Charizard Base Set PSA 10 is selling for $15,000. Pikachu is also popular.';
    const symbols = extractSymbols(text);

    expect(symbols).toContain('CHARIZARD');
    expect(symbols).toContain('PIKACHU');
  });

  it('should handle empty or invalid input', () => {
    expect(extractSymbols('')).toEqual([]);
    expect(extractSymbols(null as any)).toEqual([]);
    expect(extractSymbols(undefined as any)).toEqual([]);
  });

  it('should return unique symbols (no duplicates)', () => {
    const text = 'Charizard is great. CHARIZARD sells well. The Charizard card is valuable.';
    const symbols = extractSymbols(text);

    expect(symbols.filter(s => s === 'CHARIZARD').length).toBe(1);
  });

  it('should extract multiple different symbols', () => {
    const text = 'I recommend Umbreon, Espeon, and Mewtwo for investment.';
    const symbols = extractSymbols(text);

    expect(symbols).toContain('UMBREON');
    expect(symbols).toContain('ESPEON');
    expect(symbols).toContain('MEWTWO');
  });

  it('should filter out common English words', () => {
    const text = 'BASED on CURRENT MARKET DATA, this CARD is VALUABLE';
    const symbols = extractSymbols(text);

    // These are common words and should be filtered out
    expect(symbols).not.toContain('BASED');
    expect(symbols).not.toContain('CURRENT');
    expect(symbols).not.toContain('MARKET');
    expect(symbols).not.toContain('DATA');
    expect(symbols).not.toContain('CARD');
  });

  it('should extract capitalized words that might be card names', () => {
    const text = 'The DRAGONITE card from Team Rocket is worth investing in.';
    const symbols = extractSymbols(text);

    expect(symbols).toContain('DRAGONITE');
  });

  it('should return sorted array', () => {
    const text = 'VENUSAUR, BLASTOISE, and CHARIZARD are the starter trio.';
    const symbols = extractSymbols(text);

    // Check if sorted alphabetically
    const sorted = [...symbols].sort();
    expect(symbols).toEqual(sorted);
  });

  it('should handle mixed case input', () => {
    const text = 'charizard, Charizard, CHARIZARD, ChArIzArD';
    const symbols = extractSymbols(text);

    expect(symbols).toEqual(['CHARIZARD']);
  });
});

describe('extractSymbolsWithConfidence', () => {
  it('should return symbols with confidence scores', () => {
    const text = 'Charizard is mentioned. Charizard again. And Pikachu once.';
    const results = extractSymbolsWithConfidence(text);

    const charizard = results.find(r => r.symbol === 'CHARIZARD');
    const pikachu = results.find(r => r.symbol === 'PIKACHU');

    expect(charizard).toBeDefined();
    expect(pikachu).toBeDefined();

    // Charizard appears more, so higher confidence
    expect(charizard!.confidence).toBeGreaterThan(pikachu!.confidence);
  });

  it('should normalize confidence to 0-1 range', () => {
    const text = 'Mewtwo is great. Mewtwo is powerful. Mewtwo is rare.';
    const results = extractSymbolsWithConfidence(text);

    const mewtwo = results.find(r => r.symbol === 'MEWTWO');

    expect(mewtwo).toBeDefined();
    expect(mewtwo!.confidence).toBeGreaterThan(0);
    expect(mewtwo!.confidence).toBeLessThanOrEqual(1);
  });

  it('should sort by confidence descending', () => {
    const text = 'Charizard Charizard Charizard. Pikachu Pikachu. Mewtwo.';
    const results = extractSymbolsWithConfidence(text);

    // Should be sorted by confidence (descending)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence);
    }
  });

  it('should handle empty input', () => {
    expect(extractSymbolsWithConfidence('')).toEqual([]);
    expect(extractSymbolsWithConfidence(null as any)).toEqual([]);
  });

  it('should assign confidence of 1.0 to most mentioned symbol', () => {
    const text = 'Umbreon Umbreon Umbreon. Espeon.';
    const results = extractSymbolsWithConfidence(text);

    const umbreon = results.find(r => r.symbol === 'UMBREON');

    expect(umbreon).toBeDefined();
    expect(umbreon!.confidence).toBe(1.0);
  });
});
