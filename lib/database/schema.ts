/**
 * Database Schema & Types
 * TypeScript definitions for database models
 */

export interface PortfolioItem {
  id: string;
  userId: string;
  cardId: string;
  cardName: string;
  set: string;
  quantity: number;
  condition: 'mint' | 'near-mint' | 'excellent' | 'good' | 'light-play' | 'played' | 'poor';
  graded: boolean;
  gradingCompany?: 'PSA' | 'BGS' | 'CGC' | 'SGC';
  grade?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  cardId: string;
  cardName: string;
  condition: 'raw' | 'psa9' | 'psa10' | 'bgs9' | 'bgs10';
  triggerType: 'above' | 'below' | 'change_percent';
  targetPrice?: number;
  percentChange?: number;
  active: boolean;
  triggered: boolean;
  lastTriggeredAt?: string;
  notificationMethod: 'email' | 'push' | 'both';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  portfolioItemId: string;
  type: 'buy' | 'sell' | 'trade';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees?: number;
  platform?: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  cardId: string;
  cardName: string;
  set: string;
  targetPrice?: number;
  notes?: string;
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  activityType: 'portfolio_add' | 'portfolio_remove' | 'alert_created' | 'article_read' | 'export_data';
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Database query filters
 */
export interface PortfolioFilters {
  set?: string;
  condition?: string;
  graded?: boolean;
  gradingCompany?: string;
  minValue?: number;
  maxValue?: number;
  sortBy?: 'name' | 'value' | 'date' | 'change';
  sortOrder?: 'asc' | 'desc';
}

export interface AlertFilters {
  active?: boolean;
  triggered?: boolean;
  cardId?: string;
}

/**
 * API Request/Response types
 */
export interface CreatePortfolioItemRequest {
  cardId: string;
  cardName: string;
  set: string;
  quantity: number;
  condition: PortfolioItem['condition'];
  graded?: boolean;
  gradingCompany?: PortfolioItem['gradingCompany'];
  grade?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
}

export interface UpdatePortfolioItemRequest extends Partial<CreatePortfolioItemRequest> {
  id: string;
}

export interface CreateAlertRequest {
  cardId: string;
  cardName: string;
  condition: PriceAlert['condition'];
  triggerType: PriceAlert['triggerType'];
  targetPrice?: number;
  percentChange?: number;
  notificationMethod?: PriceAlert['notificationMethod'];
}

export interface PortfolioStats {
  totalValue: number;
  totalItems: number;
  totalChange24h: number;
  totalChange7d: number;
  totalChange30d: number;
  totalGainLoss: number;
  topPerformer?: {
    cardName: string;
    change: number;
  };
  worstPerformer?: {
    cardName: string;
    change: number;
  };
  breakdown: {
    bySet: Record<string, number>;
    byCondition: Record<string, number>;
    byGrade: Record<string, number>;
  };
}

/**
 * Export formats
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportRequest {
  format: ExportFormat;
  includeTransactions?: boolean;
  includeAlerts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
