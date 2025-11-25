/**
 * Crypto Market Dashboard Component
 *
 * Displays real-time crypto prices, portfolio holdings, and card valuations
 * for the TCG market integration.
 *
 * @example
 * ```tsx
 * <CryptoMarketDashboard
 *   tokens={['ethereum', 'bitcoin']}
 *   portfolio={holdings}
 *   onRefresh={() => fetchPrices()}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

export interface PortfolioHolding {
  cardId: string;
  cardName: string;
  rarity: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}

export interface PriceAlert {
  id: string;
  cardId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: Date;
}

export interface CryptoMarketDashboardProps {
  tokens?: string[];
  portfolio?: PortfolioHolding[];
  alerts?: PriceAlert[];
  onRefresh?: () => void;
  onCreateAlert?: (cardId: string, targetPrice: number, condition: 'above' | 'below') => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TokenCardProps {
  token: TokenPrice;
}

function TokenCard({ token }: TokenCardProps) {
  const isPositive = token.change24h >= 0;

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: '#1a1a2e',
        border: '1px solid #2d2d44',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>
            {token.symbol.toUpperCase()}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>{token.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>
            {formatCurrency(token.price)}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: isPositive ? '#4ade80' : '#f87171',
            }}
          >
            {formatPercent(token.change24h)}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#666',
        }}
      >
        <span>Vol: {formatCompact(token.volume24h)}</span>
        <span>MCap: {formatCompact(token.marketCap)}</span>
      </div>
    </div>
  );
}

interface PortfolioTableProps {
  holdings: PortfolioHolding[];
}

function PortfolioTable({ holdings }: PortfolioTableProps) {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  return (
    <div>
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#1a1a2e',
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid #2d2d44',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Portfolio Value</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{formatCurrency(totalValue)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Total P&L</span>
          <span
            style={{
              color: totalPnL >= 0 ? '#4ade80' : '#f87171',
              fontWeight: 600,
            }}
          >
            {formatCurrency(totalPnL)} ({formatPercent(totalPnLPercent)})
          </span>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#16162a',
          fontSize: '13px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #2d2d44' }}>
            <th style={{ padding: '10px', textAlign: 'left', color: '#666' }}>Card</th>
            <th style={{ padding: '10px', textAlign: 'right', color: '#666' }}>Qty</th>
            <th style={{ padding: '10px', textAlign: 'right', color: '#666' }}>Price</th>
            <th style={{ padding: '10px', textAlign: 'right', color: '#666' }}>Value</th>
            <th style={{ padding: '10px', textAlign: 'right', color: '#666' }}>P&L</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const value = holding.currentPrice * holding.quantity;
            const cost = holding.purchasePrice * holding.quantity;
            const pnl = value - cost;
            const pnlPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;

            return (
              <tr key={holding.cardId} style={{ borderBottom: '1px solid #2d2d44' }}>
                <td style={{ padding: '10px', color: '#fff' }}>
                  <div>{holding.cardName}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{holding.rarity}</div>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#fff' }}>
                  {holding.quantity}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#fff' }}>
                  {formatCurrency(holding.currentPrice)}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#fff' }}>
                  {formatCurrency(value)}
                </td>
                <td
                  style={{
                    padding: '10px',
                    textAlign: 'right',
                    color: pnl >= 0 ? '#4ade80' : '#f87171',
                  }}
                >
                  {formatPercent(pnlPercent)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface AlertListProps {
  alerts: PriceAlert[];
  onDelete?: (alertId: string) => void;
}

function AlertList({ alerts, onDelete }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No active alerts</div>
    );
  }

  return (
    <div>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            padding: '12px',
            borderBottom: '1px solid #2d2d44',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: alert.triggered ? '#1a2e1a' : 'transparent',
          }}
        >
          <div>
            <div style={{ color: '#fff', fontSize: '13px' }}>
              {alert.condition === 'above' ? '↑' : '↓'} {formatCurrency(alert.targetPrice)}
            </div>
            <div style={{ color: '#666', fontSize: '11px' }}>Card ID: {alert.cardId}</div>
          </div>
          {alert.triggered ? (
            <span style={{ color: '#4ade80', fontSize: '12px' }}>Triggered</span>
          ) : (
            onDelete && (
              <button
                onClick={() => onDelete(alert.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Remove
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CryptoMarketDashboard({
  tokens = [],
  portfolio = [],
  alerts = [],
  onRefresh,
  onCreateAlert,
  className,
}: CryptoMarketDashboardProps) {
  const [activeTab, setActiveTab] = useState<'prices' | 'portfolio' | 'alerts'>('prices');
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Mock price data (replace with actual API calls)
  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockPrices: TokenPrice[] = tokens.map((token) => ({
      id: token,
      symbol: token.slice(0, 3),
      name: token.charAt(0).toUpperCase() + token.slice(1),
      price: Math.random() * 5000 + 100,
      change24h: (Math.random() - 0.5) * 20,
      volume24h: Math.random() * 1000000000,
      marketCap: Math.random() * 100000000000,
      lastUpdated: new Date(),
    }));

    setTokenPrices(mockPrices);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, [tokens]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleRefresh = () => {
    fetchPrices();
    onRefresh?.();
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    backgroundColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#fff' : '#888',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <div
      className={className}
      style={{
        backgroundColor: '#0f0f1a',
        borderRadius: '12px',
        border: '1px solid #2d2d44',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #2d2d44',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>
          TCG Market
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#666', fontSize: '11px' }}>
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2d2d44',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button style={tabStyle(activeTab === 'prices')} onClick={() => setActiveTab('prices')}>
          Prices
        </button>
        <button
          style={tabStyle(activeTab === 'portfolio')}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button style={tabStyle(activeTab === 'alerts')} onClick={() => setActiveTab('alerts')}>
          Alerts ({alerts.filter((a) => !a.triggered).length})
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'prices' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {tokenPrices.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No tokens configured
              </div>
            ) : (
              tokenPrices.map((token) => <TokenCard key={token.id} token={token} />)
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div>
            {portfolio.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No holdings yet
              </div>
            ) : (
              <PortfolioTable holdings={portfolio} />
            )}
          </div>
        )}

        {activeTab === 'alerts' && <AlertList alerts={alerts} />}
      </div>
    </div>
  );
}

export default CryptoMarketDashboard;
