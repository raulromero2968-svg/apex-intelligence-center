// Portfolio utility functions for CSV export, sharing, and alerts

export interface PortfolioAsset {
  name: string;
  set: string;
  grade: string;
  price: number;
  change: number;
  risk?: string;
  game?: string;
}

/**
 * Export portfolio data to CSV format
 */
export function exportToCSV(assets: PortfolioAsset[], portfolioValue: number): void {
  // Create CSV header
  const headers = ['Card Name', 'Set', 'Grade', 'Current Price', '24h Change %', 'Risk Level', 'Game'];

  // Create CSV rows
  const rows = assets.map(asset => [
    asset.name,
    asset.set,
    asset.grade,
    `$${asset.price.toLocaleString()}`,
    `${asset.change > 0 ? '+' : ''}${asset.change}%`,
    asset.risk || 'N/A',
    asset.game || 'N/A'
  ]);

  // Add summary row
  rows.push([]);
  rows.push(['Total Portfolio Value', '', '', `$${portfolioValue.toLocaleString()}`, '', '', '']);
  rows.push(['Total Items', String(assets.length), '', '', '', '', '']);

  // Combine into CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `apex-portfolio-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate shareable portfolio link (stored in localStorage for demo)
 */
export function generateShareLink(assets: PortfolioAsset[]): string {
  const shareId = Math.random().toString(36).substring(2, 15);

  // In production, this would POST to an API
  // For now, store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(`apex-share-${shareId}`, JSON.stringify({
      assets,
      createdAt: new Date().toISOString(),
      viewCount: 0
    }));
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/portfolio/share/${shareId}`;
}

/**
 * Load shared portfolio from ID
 */
export function loadSharedPortfolio(shareId: string): { assets: PortfolioAsset[], createdAt: string } | null {
  if (typeof window === 'undefined') return null;

  const data = localStorage.getItem(`apex-share-${shareId}`);
  if (!data) return null;

  const parsed = JSON.parse(data);

  // Increment view count
  parsed.viewCount = (parsed.viewCount || 0) + 1;
  localStorage.setItem(`apex-share-${shareId}`, JSON.stringify(parsed));

  return {
    assets: parsed.assets,
    createdAt: parsed.createdAt
  };
}

/**
 * Price Alert interface
 */
export interface PriceAlert {
  id: string;
  cardName: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  enabled: boolean;
  createdAt: string;
}

/**
 * Create a new price alert
 */
export function createPriceAlert(
  cardName: string,
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number
): PriceAlert {
  const alert: PriceAlert = {
    id: Math.random().toString(36).substring(2, 15),
    cardName,
    condition,
    targetPrice,
    currentPrice,
    enabled: true,
    createdAt: new Date().toISOString()
  };

  // Save to localStorage
  if (typeof window !== 'undefined') {
    const alerts = getPriceAlerts();
    alerts.push(alert);
    localStorage.setItem('apex-price-alerts', JSON.stringify(alerts));
  }

  return alert;
}

/**
 * Get all price alerts
 */
export function getPriceAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];

  const data = localStorage.getItem('apex-price-alerts');
  return data ? JSON.parse(data) : [];
}

/**
 * Delete a price alert
 */
export function deletePriceAlert(alertId: string): void {
  if (typeof window === 'undefined') return;

  const alerts = getPriceAlerts().filter(a => a.id !== alertId);
  localStorage.setItem('apex-price-alerts', JSON.stringify(alerts));
}

/**
 * Toggle alert enabled status
 */
export function togglePriceAlert(alertId: string): void {
  if (typeof window === 'undefined') return;

  const alerts = getPriceAlerts();
  const alert = alerts.find(a => a.id === alertId);

  if (alert) {
    alert.enabled = !alert.enabled;
    localStorage.setItem('apex-price-alerts', JSON.stringify(alerts));
  }
}

/**
 * Check if any alerts are triggered
 */
export function checkAlerts(currentPrices: Map<string, number>): PriceAlert[] {
  const alerts = getPriceAlerts();
  const triggered: PriceAlert[] = [];

  alerts.forEach(alert => {
    if (!alert.enabled) return;

    const currentPrice = currentPrices.get(alert.cardName);
    if (!currentPrice) return;

    if (
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice)
    ) {
      triggered.push(alert);
    }
  });

  return triggered;
}
