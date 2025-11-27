/**
 * Price Alert Service
 * Manage price alerts and notifications
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { PriceAlert, CreateAlertRequest, AlertFilters } from '../database/schema';

class AlertService {
  /**
   * Get all alerts for the current user
   */
  async getAlerts(filters?: AlertFilters, token?: string): Promise<PriceAlert[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const endpoint = `${API_ENDPOINTS.alerts.list}${
      params.toString() ? `?${params}` : ''
    }`;

    const response = await apiClient.get<PriceAlert[]>(endpoint, { token });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  }

  /**
   * Create a new price alert
   */
  async createAlert(
    alert: CreateAlertRequest,
    token?: string
  ): Promise<PriceAlert> {
    const response = await apiClient.post<PriceAlert>(
      API_ENDPOINTS.alerts.create,
      alert,
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Update an existing alert
   */
  async updateAlert(
    alertId: string,
    updates: Partial<CreateAlertRequest>,
    token?: string
  ): Promise<PriceAlert> {
    const response = await apiClient.put<PriceAlert>(
      API_ENDPOINTS.alerts.update(alertId),
      updates,
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data!;
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string, token?: string): Promise<void> {
    const response = await apiClient.delete(
      API_ENDPOINTS.alerts.delete(alertId),
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }
  }

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId: string, active: boolean, token?: string): Promise<PriceAlert> {
    return this.updateAlert(alertId, { active } as any, token);
  }

  /**
   * Test alert (trigger manually)
   */
  async testAlert(alertId: string, token?: string): Promise<void> {
    const response = await apiClient.post(
      API_ENDPOINTS.alerts.trigger,
      { alertId, test: true },
      { token }
    );

    if (response.error) {
      throw new Error(response.error);
    }
  }

  /**
   * Get mock alerts for development
   */
  getMockAlerts(): PriceAlert[] {
    return [
      {
        id: 'alert_1',
        userId: 'user_demo',
        cardId: 'charizard-base-set-4',
        cardName: 'Charizard (Base Set)',
        condition: 'psa10',
        triggerType: 'below',
        targetPrice: 7500.0,
        active: true,
        triggered: false,
        notificationMethod: 'both',
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-01T00:00:00Z',
      },
      {
        id: 'alert_2',
        userId: 'user_demo',
        cardId: 'pikachu-vmax-rainbow',
        cardName: 'Pikachu VMAX (Rainbow)',
        condition: 'raw',
        triggerType: 'change_percent',
        percentChange: 10,
        active: true,
        triggered: false,
        notificationMethod: 'email',
        createdAt: '2024-11-05T00:00:00Z',
        updatedAt: '2024-11-05T00:00:00Z',
      },
      {
        id: 'alert_3',
        userId: 'user_demo',
        cardId: 'lillie-full-art',
        cardName: 'Lillie (Full Art)',
        condition: 'psa10',
        triggerType: 'above',
        targetPrice: 1200.0,
        active: false,
        triggered: true,
        lastTriggeredAt: '2024-11-10T15:30:00Z',
        notificationMethod: 'push',
        createdAt: '2024-10-15T00:00:00Z',
        updatedAt: '2024-11-10T15:30:00Z',
      },
    ];
  }

  /**
   * Validate alert configuration
   */
  validateAlert(alert: CreateAlertRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!alert.cardId || !alert.cardName) {
      errors.push('Card information is required');
    }

    if (alert.triggerType === 'above' || alert.triggerType === 'below') {
      if (!alert.targetPrice || alert.targetPrice <= 0) {
        errors.push('Target price must be greater than 0');
      }
    }

    if (alert.triggerType === 'change_percent') {
      if (!alert.percentChange || alert.percentChange <= 0) {
        errors.push('Percent change must be greater than 0');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const alertService = new AlertService();
