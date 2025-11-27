/**
 * API Client
 * Type-safe HTTP client with error handling, caching, and retry logic
 */

import { API_CONFIG, API_ERRORS, getAuthHeaders } from './config';

interface RequestOptions extends RequestInit {
  token?: string;
  cache?: 'no-cache' | 'force-cache' | 'default';
  retries?: number;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, cache = 'default', retries = 3, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `${endpoint}:${JSON.stringify(fetchOptions.body)}`;

    // Check cache for GET requests
    if (fetchOptions.method === 'GET' || !fetchOptions.method) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return { data: cached, status: 200 };
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            ...getAuthHeaders(token),
            ...fetchOptions.headers,
          },
        });

        // Handle different status codes
        if (!response.ok) {
          const errorMessage = await this.handleErrorResponse(response);
          return { error: errorMessage, status: response.status };
        }

        const data = await response.json();

        // Cache successful GET requests
        if (fetchOptions.method === 'GET' || !fetchOptions.method) {
          this.setCache(cacheKey, data);
        }

        return { data, status: response.status };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      error: lastError?.message || API_ERRORS.NETWORK_ERROR,
      status: 500,
    };
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<string> {
    const status = response.status;

    switch (status) {
      case 401:
        return API_ERRORS.UNAUTHORIZED;
      case 403:
        return API_ERRORS.FORBIDDEN;
      case 404:
        return API_ERRORS.NOT_FOUND;
      case 429:
        return API_ERRORS.RATE_LIMIT;
      case 500:
      case 502:
      case 503:
        return API_ERRORS.SERVER_ERROR;
      default:
        try {
          const errorData = await response.json();
          return errorData.message || API_ERRORS.INVALID_REQUEST;
        } catch {
          return API_ERRORS.INVALID_REQUEST;
        }
    }
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const age = now - cached.timestamp;

    // Check if cache is still valid (default 5 minutes)
    if (age > API_CONFIG.cache.priceDataTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean old cache entries (keep max 100)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Utility: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * HTTP Methods
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_CONFIG.baseUrl);
