/**
 * Fara-7B Client Unit Tests
 *
 * Tests for the FaraClient class and helper functions.
 * Uses mocking to avoid requiring an actual Fara API.
 */

import {
  FaraClient,
  FaraConfig,
  createFaraClient,
  Task,
  TaskStatus,
  TaskResult,
  ActionLog,
} from './fara-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-task-uuid'),
}));

describe('FaraClient', () => {
  let client: FaraClient;

  const testConfig: FaraConfig = {
    endpoint: 'https://api.azure.com/fara-7b',
    apiKey: 'test-api-key',
    sandboxUrl: 'https://sandbox.browserbase.com',
    maxRetries: 3,
    timeout: 30000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    client = new FaraClient(testConfig);
  });

  describe('constructor', () => {
    it('should create client with provided config', () => {
      expect(client).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const minimalConfig: FaraConfig = {
        endpoint: 'https://api.test.com',
        apiKey: 'key',
      };
      const minimalClient = new FaraClient(minimalConfig);
      expect(minimalClient).toBeDefined();
    });
  });

  describe('submitTask', () => {
    it('should submit a task and return task object', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });

      const task = await client.submitTask('Find price for Charizard PSA 10');

      expect(task).toBeDefined();
      expect(task.id).toBe('test-task-uuid');
      expect(task.instruction).toBe('Find price for Charizard PSA 10');
      expect(task.status).toBe('running');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.azure.com/fara-7b/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should submit task with options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });

      const task = await client.submitTask('Find price for card', {
        context: { marketplace: 'TCGPlayer' },
        maxSteps: 25,
        stopAtCriticalPoints: false,
      });

      expect(task.context).toEqual({ marketplace: 'TCGPlayer' });
      expect(task.maxSteps).toBe(25);
      expect(task.stopAtCriticalPoints).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        client.submitTask('Test task')
      ).rejects.toThrow('API error: 500 Internal Server Error');
    });

    it('should retry on transient failures', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
        });

      const task = await client.submitTask('Test task');

      expect(task.id).toBe('test-task-uuid');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        client.submitTask('Test task')
      ).rejects.toThrow('Network error');

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('getTask', () => {
    it('should fetch task status from API', async () => {
      // First call submits the task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });

      const task = await client.submitTask('Test task');

      // Second call gets updated status
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'completed',
          result: { price: 350.0 },
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });

      const updatedTask = await client.getTask(task.id);

      expect(updatedTask).toBeDefined();
      expect(updatedTask!.status).toBe('completed');
      expect(updatedTask!.result).toEqual({ price: 350.0 });
    });

    it('should return null for non-existent task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const task = await client.getTask('non-existent-id');

      expect(task).toBeNull();
    });
  });

  describe('waitForTask', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should poll until task completes', async () => {
      // Submit task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });

      const task = await client.submitTask('Test task');

      // First poll - still running
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'running',
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });

      // Second poll - completed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'completed',
          result: { data: 'success' },
          actionLogs: [
            {
              timestamp: new Date().toISOString(),
              action: 'navigate',
              parameters: { url: 'https://example.com' },
              success: true,
            },
          ],
          createdAt: new Date().toISOString(),
        }),
      });

      const waitPromise = client.waitForTask(task.id, 100);

      // Advance timers to trigger polling
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);

      const result = await waitPromise;

      expect(result.status).toBe('completed');
      expect(result.result).toEqual({ data: 'success' });
      expect(result.actionCount).toBe(1);
    });

    it('should return when task fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });

      const task = await client.submitTask('Test task');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'failed',
          error: 'Element not found',
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });

      const waitPromise = client.waitForTask(task.id, 100);
      await jest.advanceTimersByTimeAsync(100);

      const result = await waitPromise;

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Element not found');
    });

    it('should stop at critical points', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });

      const task = await client.submitTask('Test task');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'critical_point',
          criticalPoint: {
            type: 'transaction',
            description: 'About to make a purchase',
            context: 'Checkout page',
            suggestedAction: 'Confirm purchase',
            requiresApproval: true,
          },
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });

      const waitPromise = client.waitForTask(task.id, 100);
      await jest.advanceTimersByTimeAsync(100);

      const result = await waitPromise;

      expect(result.status).toBe('critical_point');
    });

    it('should throw error for non-existent task', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        client.waitForTask('non-existent-id', 100)
      ).rejects.toThrow('Task non-existent-id not found');
    });
  });

  describe('approveCriticalPoint', () => {
    it('should approve a critical point', async () => {
      // Submit and get to critical point
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });
      await client.submitTask('Test task');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'critical_point',
          criticalPoint: { type: 'transaction', requiresApproval: true },
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });
      await client.getTask('test-task-uuid');

      // Approve
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.approveCriticalPoint('test-task-uuid', true, 'Approved by user');

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.azure.com/fara-7b/tasks/test-task-uuid/approve',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ approved: true, context: 'Approved by user' }),
        })
      );
    });

    it('should reject a critical point', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });
      await client.submitTask('Test task');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'critical_point',
          criticalPoint: { type: 'transaction', requiresApproval: true },
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });
      await client.getTask('test-task-uuid');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.approveCriticalPoint('test-task-uuid', false);

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.azure.com/fara-7b/tasks/test-task-uuid/approve',
        expect.objectContaining({
          body: JSON.stringify({ approved: false, context: undefined }),
        })
      );
    });

    it('should throw error if not at critical point', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });
      await client.submitTask('Test task');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'running', // Not at critical point
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });

      await expect(
        client.approveCriticalPoint('test-task-uuid', true)
      ).rejects.toThrow('Task test-task-uuid is not at a critical point');
    });
  });

  describe('cancelTask', () => {
    it('should cancel a running task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });
      await client.submitTask('Test task');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'running',
          actionLogs: [],
          createdAt: new Date().toISOString(),
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await client.cancelTask('test-task-uuid');

      expect(mockFetch).toHaveBeenLastCalledWith(
        'https://api.azure.com/fara-7b/tasks/test-task-uuid/cancel',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('getActionLogs', () => {
    it('should return action logs for a task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
      });
      await client.submitTask('Test task');

      const actionLogs: ActionLog[] = [
        {
          timestamp: new Date(),
          action: 'navigate',
          parameters: { url: 'https://example.com' },
          success: true,
        },
        {
          timestamp: new Date(),
          action: 'click',
          parameters: { selector: '#button' },
          success: true,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-task-uuid',
          instruction: 'Test task',
          status: 'running',
          actionLogs: actionLogs.map((log) => ({
            ...log,
            timestamp: log.timestamp.toISOString(),
          })),
          createdAt: new Date().toISOString(),
        }),
      });

      const logs = await client.getActionLogs('test-task-uuid');

      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('navigate');
      expect(logs[1].action).toBe('click');
    });
  });

  describe('searchCardPrice', () => {
    it('should search for card price', async () => {
      jest.useFakeTimers();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-task-uuid',
            instruction: 'Find price',
            status: 'completed',
            result: { price: 350.0, currency: 'USD' },
            actionLogs: [],
            createdAt: new Date().toISOString(),
          }),
        });

      const resultPromise = client.searchCardPrice('Charizard PSA 10', 'TCGPlayer', {
        grading: 'PSA 10',
        condition: 'Near Mint',
      });

      await jest.advanceTimersByTimeAsync(2000);
      const result = await resultPromise;

      expect(result.status).toBe('completed');
      expect(result.result).toEqual({ price: 350.0, currency: 'USD' });

      jest.useRealTimers();
    });
  });

  describe('scrapeResearchPapers', () => {
    it('should scrape research papers from a source', async () => {
      jest.useFakeTimers();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-task-uuid',
            instruction: 'Scrape papers',
            status: 'completed',
            result: [
              { title: 'Paper 1', authors: ['Author 1'], url: 'https://arxiv.org/1' },
              { title: 'Paper 2', authors: ['Author 2'], url: 'https://arxiv.org/2' },
            ],
            actionLogs: [],
            createdAt: new Date().toISOString(),
          }),
        });

      const resultPromise = client.scrapeResearchPapers('machine learning', 'arXiv', 10);

      await jest.advanceTimersByTimeAsync(2000);
      const result = await resultPromise;

      expect(result.status).toBe('completed');
      expect(result.result).toHaveLength(2);

      jest.useRealTimers();
    });
  });

  describe('extractDataFromUrl', () => {
    it('should extract structured data from a URL', async () => {
      jest.useFakeTimers();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'test-task-uuid', status: 'pending' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-task-uuid',
            instruction: 'Extract data',
            status: 'completed',
            result: {
              price: '$350.00',
              availability: 'In Stock',
              seller: 'Card Shop Pro',
            },
            actionLogs: [],
            createdAt: new Date().toISOString(),
          }),
        });

      const resultPromise = client.extractDataFromUrl('https://tcgplayer.com/product/123', {
        price: 'Current market price',
        availability: 'In stock or out of stock',
        seller: 'Seller name',
      });

      await jest.advanceTimersByTimeAsync(2000);
      const result = await resultPromise;

      expect(result.status).toBe('completed');
      expect(result.result.price).toBe('$350.00');
      expect(result.result.availability).toBe('In Stock');

      jest.useRealTimers();
    });
  });
});

describe('createFaraClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create client from environment variables', () => {
    process.env.FARA_ENDPOINT = 'https://custom-endpoint.com';
    process.env.FARA_API_KEY = 'custom-api-key';
    process.env.BROWSERBASE_URL = 'https://custom-sandbox.com';
    process.env.FARA_MAX_RETRIES = '5';
    process.env.FARA_TIMEOUT = '60000';

    const client = createFaraClient();

    expect(client).toBeDefined();
  });

  it('should throw error if API key is not set', () => {
    delete process.env.FARA_API_KEY;

    expect(() => createFaraClient()).toThrow('FARA_API_KEY environment variable is required');
  });

  it('should use default values for optional env vars', () => {
    process.env.FARA_API_KEY = 'test-key';
    delete process.env.FARA_ENDPOINT;
    delete process.env.FARA_MAX_RETRIES;
    delete process.env.FARA_TIMEOUT;

    const client = createFaraClient();

    expect(client).toBeDefined();
  });
});
