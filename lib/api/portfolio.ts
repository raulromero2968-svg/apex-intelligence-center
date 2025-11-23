/**
 * Portfolio API Service
 * CRUD operations for user portfolio management
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import {
  PortfolioItem,
  PortfolioFilters,
  PortfolioStats,
  CreatePortfolioItemRequest,
  UpdatePortfolioItemRequest,
  ExportRequest,
} from '../database/schema';

class PortfolioService {
  /**
   * Get all portfolio items for the current user
   */
  async getPortfolio(
    filters?: PortfolioFilters,
    token?: string
  ): Promise<PortfolioItem[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const endpoint = `${API_ENDPOINTS.portfolio.list}${
      params.toString() ? `?${params}` : ''
    }`;

    const response = await apiClient.get<PortfolioItem[]>(endpoint, { token });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  /**
   * Add item to portfolio
   */
  async addItem(
    item: CreatePortfolioItemRequest,
    token?: string
  ): Promise<PortfolioItem> {
    const response = await apiClient.post<PortfolioItem>(
      API_ENDPOINTS.portfolio.create,
      item,
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Update portfolio item
   */
  async updateItem(
    item: UpdatePortfolioItemRequest,
    token?: string
  ): Promise<PortfolioItem> {
    const { id, ...updates } = item;

    const response = await apiClient.put<PortfolioItem>(
      API_ENDPOINTS.portfolio.update(id),
      updates,
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Delete portfolio item
   */
  async deleteItem(itemId: string, token?: string): Promise<void> {
    const response = await apiClient.delete(
      API_ENDPOINTS.portfolio.delete(itemId),
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }
  }

  /**
   * Get portfolio statistics
   */
  async getStats(token?: string): Promise<PortfolioStats> {
    const response = await apiClient.get<PortfolioStats>(
      `${API_ENDPOINTS.portfolio.list}/stats`,
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Export portfolio data
   */
  async export(
    request: ExportRequest,
    token?: string
  ): Promise<Blob> {
    const response = await fetch(`${API_ENDPOINTS.portfolio.export}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  /**
   * Import portfolio data
   */
  async import(file: File, token?: string): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_ENDPOINTS.portfolio.import}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Import failed');
    }

    return response.json();
  }

  /**
   * Get mock portfolio data for development
   */
  getMockPortfolio(): PortfolioItem[] {
    return [
      {
        id: 'port_1',
        userId: 'user_demo',
        cardId: 'charizard-base-set-4',
        cardName: 'Charizard',
        set: 'Base Set',
        quantity: 1,
        condition: 'near-mint',
        graded: true,
        gradingCompany: 'PSA',
        grade: 9,
        purchasePrice: 1650.0,
        purchaseDate: '2024-06-15',
        notes: 'Purchased from eBay, centered well',
        createdAt: '2024-06-15T10:30:00Z',
        updatedAt: '2024-06-15T10:30:00Z',
      },
      {
        id: 'port_2',
        userId: 'user_demo',
        cardId: 'pikachu-vmax-rainbow',
        cardName: 'Pikachu VMAX (Rainbow Rare)',
        set: 'Vivid Voltage',
        quantity: 2,
        condition: 'mint',
        graded: false,
        purchasePrice: 120.0,
        purchaseDate: '2024-09-20',
        createdAt: '2024-09-20T14:22:00Z',
        updatedAt: '2024-09-20T14:22:00Z',
      },
      {
        id: 'port_3',
        userId: 'user_demo',
        cardId: 'lillie-full-art',
        cardName: 'Lillie (Full Art)',
        set: 'Ultra Prism',
        quantity: 1,
        condition: 'near-mint',
        graded: true,
        gradingCompany: 'PSA',
        grade: 10,
        purchasePrice: 380.0,
        purchaseDate: '2024-11-03',
        createdAt: '2024-11-03T09:15:00Z',
        updatedAt: '2024-11-03T09:15:00Z',
      },
    ];
  }
}

export const portfolioService = new PortfolioService();
