/**
 * Fara-7B Client for Apex Intelligence Center
 * 
 * This module provides a TypeScript client for interacting with Microsoft's Fara-7B
 * Computer-Using Agent (CUA) deployed on Azure AI Foundry.
 * 
 * @module fara-client
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Configuration for Fara-7B client
 */
export interface FaraConfig {
  endpoint: string;
  apiKey: string;
  sandboxUrl?: string; // BrowserBase sandbox URL
  maxRetries?: number;
  timeout?: number; // in milliseconds
}

/**
 * Task status
 */
export type TaskStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'critical_point'
  | 'cancelled';

/**
 * Action types that Fara-7B can perform
 */
export type ActionType =
  | 'click'
  | 'type'
  | 'scroll'
  | 'navigate'
  | 'wait'
  | 'screenshot'
  | 'extract_text'
  | 'web_search'
  | 'visit_url';

/**
 * Action log entry
 */
export interface ActionLog {
  timestamp: Date;
  action: ActionType;
  parameters: Record<string, any>;
  screenshot?: string; // base64 encoded screenshot
  reasoning?: string; // Fara's "thinking" about the action
  success: boolean;
  error?: string;
}

/**
 * Critical Point - requires user consent
 */
export interface CriticalPoint {
  type: 'personal_data' | 'transaction' | 'irreversible_action';
  description: string;
  context: string;
  suggestedAction: string;
  requiresApproval: boolean;
}

/**
 * Task definition
 */
export interface Task {
  id: string;
  instruction: string; // Natural language task description
  context?: Record<string, any>; // Additional context for the task
  maxSteps?: number; // Maximum number of steps before timeout
  stopAtCriticalPoints?: boolean; // Whether to stop and ask for user consent
  createdAt: Date;
  status: TaskStatus;
  result?: any;
  error?: string;
  actionLogs: ActionLog[];
  criticalPoint?: CriticalPoint;
}

/**
 * Task result
 */
export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result?: any;
  error?: string;
  actionCount: number;
  duration: number; // in milliseconds
  cost: number; // estimated cost in USD
  screenshots: string[]; // URLs or base64 encoded screenshots
}

/**
 * Fara-7B Client class
 */
export class FaraClient {
  private config: FaraConfig;
  private activeTasks: Map<string, Task>;

  constructor(config: FaraConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 300000, // 5 minutes default
      ...config,
    };
    this.activeTasks = new Map();
  }

  /**
   * Submit a new task to Fara-7B
   */
  async submitTask(
    instruction: string,
    options?: {
      context?: Record<string, any>;
      maxSteps?: number;
      stopAtCriticalPoints?: boolean;
    }
  ): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      instruction,
      context: options?.context,
      maxSteps: options?.maxSteps || 50,
      stopAtCriticalPoints: options?.stopAtCriticalPoints !== false, // default true
      createdAt: new Date(),
      status: 'pending',
      actionLogs: [],
    };

    this.activeTasks.set(task.id, task);

    // Submit task to Fara-7B API
    try {
      const response = await this.callFaraAPI('POST', '/tasks', {
        instruction: task.instruction,
        context: task.context,
        maxSteps: task.maxSteps,
        stopAtCriticalPoints: task.stopAtCriticalPoints,
      });

      task.status = 'running';
      this.activeTasks.set(task.id, task);

      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.activeTasks.set(task.id, task);
      throw error;
    }
  }

  /**
   * Get task status and logs
   */
  async getTask(taskId: string): Promise<Task | null> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      // Try to fetch from API
      try {
        const response = await this.callFaraAPI('GET', `/tasks/${taskId}`);
        return this.parseTaskResponse(response);
      } catch (error) {
        return null;
      }
    }

    // Update task status from API
    try {
      const response = await this.callFaraAPI('GET', `/tasks/${taskId}`);
      const updatedTask = this.parseTaskResponse(response);
      this.activeTasks.set(taskId, updatedTask);
      return updatedTask;
    } catch (error) {
      return task;
    }
  }

  /**
   * Wait for task completion
   */
  async waitForTask(
    taskId: string,
    pollInterval: number = 2000
  ): Promise<TaskResult> {
    const startTime = Date.now();

    while (true) {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status === 'completed' || task.status === 'failed' || task.status === 'critical_point') {
        const duration = Date.now() - startTime;
        return {
          taskId: task.id,
          status: task.status,
          result: task.result,
          error: task.error,
          actionCount: task.actionLogs.length,
          duration,
          cost: this.estimateCost(task.actionLogs.length),
          screenshots: task.actionLogs
            .filter((log) => log.screenshot)
            .map((log) => log.screenshot!),
        };
      }

      if (Date.now() - startTime > this.config.timeout!) {
        await this.cancelTask(taskId);
        throw new Error(`Task ${taskId} timed out after ${this.config.timeout}ms`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * Approve a critical point and continue execution
   */
  async approveCriticalPoint(
    taskId: string,
    approval: boolean,
    additionalContext?: string
  ): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task || task.status !== 'critical_point') {
      throw new Error(`Task ${taskId} is not at a critical point`);
    }

    await this.callFaraAPI('POST', `/tasks/${taskId}/approve`, {
      approved: approval,
      context: additionalContext,
    });

    if (approval) {
      task.status = 'running';
    } else {
      task.status = 'cancelled';
    }
    this.activeTasks.set(taskId, task);
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    await this.callFaraAPI('POST', `/tasks/${taskId}/cancel`);
    task.status = 'cancelled';
    this.activeTasks.set(taskId, task);
  }

  /**
   * Get action logs for a task
   */
  async getActionLogs(taskId: string): Promise<ActionLog[]> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    return task.actionLogs;
  }

  /**
   * Estimate cost based on number of actions
   * Fara-7B pricing: ~$0.20 per 1M tokens
   * Average task: ~16 steps, ~1000 tokens per step
   */
  private estimateCost(actionCount: number): number {
    const tokensPerAction = 1000;
    const pricePerMillionTokens = 0.2;
    return (actionCount * tokensPerAction * pricePerMillionTokens) / 1000000;
  }

  /**
   * Call Fara-7B API
   */
  private async callFaraAPI(
    method: 'GET' | 'POST',
    path: string,
    body?: any
  ): Promise<any> {
    const url = `${this.config.endpoint}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.config.maxRetries!; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < this.config.maxRetries! - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Parse task response from API
   */
  private parseTaskResponse(response: any): Task {
    return {
      id: response.id,
      instruction: response.instruction,
      context: response.context,
      maxSteps: response.maxSteps,
      stopAtCriticalPoints: response.stopAtCriticalPoints,
      createdAt: new Date(response.createdAt),
      status: response.status,
      result: response.result,
      error: response.error,
      actionLogs: response.actionLogs?.map((log: any) => ({
        timestamp: new Date(log.timestamp),
        action: log.action,
        parameters: log.parameters,
        screenshot: log.screenshot,
        reasoning: log.reasoning,
        success: log.success,
        error: log.error,
      })) || [],
      criticalPoint: response.criticalPoint,
    };
  }

  /**
   * High-level helper: Search for TCG card price
   */
  async searchCardPrice(
    cardName: string,
    marketplace: string = 'TCGPlayer',
    options?: { grading?: string; condition?: string }
  ): Promise<any> {
    const instruction = `Find the current price for "${cardName}" on ${marketplace}${
      options?.grading ? ` with grading ${options.grading}` : ''
    }${options?.condition ? ` in ${options.condition} condition` : ''}.`;

    const task = await this.submitTask(instruction, {
      context: {
        cardName,
        marketplace,
        ...options,
      },
      maxSteps: 20,
    });

    const result = await this.waitForTask(task.id);
    return result;
  }

  /**
   * High-level helper: Scrape research papers from a website
   */
  async scrapeResearchPapers(
    searchQuery: string,
    source: string = 'arXiv',
    limit: number = 10
  ): Promise<any> {
    const instruction = `Search for "${searchQuery}" on ${source} and extract the titles, authors, abstracts, and URLs of the first ${limit} papers.`;

    const task = await this.submitTask(instruction, {
      context: {
        searchQuery,
        source,
        limit,
      },
      maxSteps: 30,
    });

    const result = await this.waitForTask(task.id);
    return result;
  }

  /**
   * High-level helper: Navigate to a URL and extract structured data
   */
  async extractDataFromUrl(
    url: string,
    dataSchema: Record<string, string>
  ): Promise<any> {
    const schemaDescription = Object.entries(dataSchema)
      .map(([key, description]) => `- ${key}: ${description}`)
      .join('\n');

    const instruction = `Navigate to ${url} and extract the following data:\n${schemaDescription}`;

    const task = await this.submitTask(instruction, {
      context: {
        url,
        dataSchema,
      },
      maxSteps: 15,
    });

    const result = await this.waitForTask(task.id);
    return result;
  }
}

/**
 * Create a Fara-7B client instance from environment variables
 */
export function createFaraClient(): FaraClient {
  const config: FaraConfig = {
    endpoint: process.env.FARA_ENDPOINT || 'https://api.azure.com/fara-7b',
    apiKey: process.env.FARA_API_KEY || '',
    sandboxUrl: process.env.BROWSERBASE_URL,
    maxRetries: parseInt(process.env.FARA_MAX_RETRIES || '3'),
    timeout: parseInt(process.env.FARA_TIMEOUT || '300000'),
  };

  if (!config.apiKey) {
    throw new Error('FARA_API_KEY environment variable is required');
  }

  return new FaraClient(config);
}
