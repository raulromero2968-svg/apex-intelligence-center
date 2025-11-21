/**
 * MAKER Voting Tests (Example)
 *
 * These tests demonstrate how to test the MAKER voting mechanism.
 * To use these tests:
 * 1. Set up Jest: pnpm add -D jest @types/jest ts-jest
 * 2. Add jest.config.js
 * 3. Rename this file to voting.test.ts
 * 4. Run: pnpm test
 */

import { voteOnStep } from './voting';
import { hashResult } from './utils';
import { db } from '@/db';

// Mock database for tests
jest.mock('@/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

describe('MAKER Voting Mechanism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should converge when majority returns correct result', async () => {
    let calls = 0;
    const stepFn = jest.fn((attempt: number) => {
      calls++;
      // First 2 attempts return wrong answer, rest return correct
      if (attempt <= 2) {
        return Promise.resolve({ value: 'wrong' });
      }
      return Promise.resolve({ value: 'correct' });
    });

    const result = await voteOnStep(stepFn, {
      taskId: 'test_task',
      stepName: 'test_step',
      k: 3,
    });

    expect(result).toEqual({ value: 'correct' });
    expect(calls).toBeGreaterThanOrEqual(5); // Should need at least 5 votes for k=3
  });

  test('should discard red-flagged responses', async () => {
    const stepFn = jest.fn()
      .mockResolvedValueOnce({ valid: false }) // This will be flagged
      .mockResolvedValue({ valid: true })
      .mockResolvedValue({ valid: true })
      .mockResolvedValue({ valid: true });

    const result = await voteOnStep(stepFn, {
      taskId: 'test_task',
      stepName: 'test_step',
      k: 3,
      redFlags: [(r: any) => (r.valid === false ? 'invalid_result' : null)],
    });

    expect(result).toEqual({ valid: true });
    expect(stepFn).toHaveBeenCalledTimes(4); // 1 flagged + 3 valid
  });

  test('should detect first-to-ahead-by-k winner', async () => {
    const stepFn = jest.fn()
      .mockResolvedValueOnce({ answer: 'A' })
      .mockResolvedValueOnce({ answer: 'B' })
      .mockResolvedValueOnce({ answer: 'A' })
      .mockResolvedValueOnce({ answer: 'A' })
      .mockResolvedValueOnce({ answer: 'A' }); // A wins with 4 votes vs 1

    const result = await voteOnStep(stepFn, {
      taskId: 'test_task',
      stepName: 'test_step',
      k: 3,
    });

    expect(result).toEqual({ answer: 'A' });
    // Should stop early once A is ahead by k=3
    expect(stepFn.mock.calls.length).toBeLessThan(10);
  });

  test('should handle exceptions gracefully', async () => {
    const stepFn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ success: true })
      .mockResolvedValue({ success: true })
      .mockResolvedValue({ success: true });

    const result = await voteOnStep(stepFn, {
      taskId: 'test_task',
      stepName: 'test_step',
      k: 3,
    });

    expect(result).toEqual({ success: true });
    expect(stepFn).toHaveBeenCalledTimes(4); // 1 exception + 3 valid
  });

  test('should throw error when no valid votes', async () => {
    const stepFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    await expect(
      voteOnStep(stepFn, {
        taskId: 'test_task',
        stepName: 'test_step',
        k: 3,
        maxVotes: 10,
      })
    ).rejects.toThrow('MAKER voting failed');
  });

  test('should use majority when maxVotes reached', async () => {
    const stepFn = jest.fn()
      .mockResolvedValue({ answer: 'A' }) // 6 votes for A
      .mockResolvedValue({ answer: 'A' })
      .mockResolvedValue({ answer: 'A' })
      .mockResolvedValue({ answer: 'A' })
      .mockResolvedValue({ answer: 'A' })
      .mockResolvedValue({ answer: 'A' })
      .mockResolvedValue({ answer: 'B' }) // 4 votes for B
      .mockResolvedValue({ answer: 'B' })
      .mockResolvedValue({ answer: 'B' })
      .mockResolvedValue({ answer: 'B' });

    const result = await voteOnStep(stepFn, {
      taskId: 'test_task',
      stepName: 'test_step',
      k: 10, // Impossible to reach k=10 with maxVotes=10
      maxVotes: 10,
    });

    expect(result).toEqual({ answer: 'A' }); // A wins by majority
    expect(stepFn).toHaveBeenCalledTimes(10);
  });
});

describe('Deterministic Hashing', () => {
  test('should produce same hash for equivalent objects', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { c: 3, a: 1, b: 2 }; // Different key order

    const hash1 = hashResult(obj1);
    const hash2 = hashResult(obj2);

    expect(hash1).toBe(hash2);
  });

  test('should produce different hash for different objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };

    const hash1 = hashResult(obj1);
    const hash2 = hashResult(obj2);

    expect(hash1).not.toBe(hash2);
  });

  test('should handle nested objects', () => {
    const obj1 = { a: { b: { c: 1 } }, d: [1, 2, 3] };
    const obj2 = { d: [1, 2, 3], a: { b: { c: 1 } } };

    const hash1 = hashResult(obj1);
    const hash2 = hashResult(obj2);

    expect(hash1).toBe(hash2);
  });
});

describe('Red Flag Functions', () => {
  test('should flag results with no prices', () => {
    const redFlag = (r: any) => (r.prices.length === 0 ? 'no_prices' : null);

    expect(redFlag({ prices: [] })).toBe('no_prices');
    expect(redFlag({ prices: [1, 2, 3] })).toBeNull();
  });

  test('should flag results with insufficient sources', () => {
    const redFlag = (r: any) =>
      Object.keys(r.prices).length < 2 ? 'insufficient_sources' : null;

    expect(redFlag({ prices: { source1: 10 } })).toBe('insufficient_sources');
    expect(redFlag({ prices: { source1: 10, source2: 20 } })).toBeNull();
  });
});

