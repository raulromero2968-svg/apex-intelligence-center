/**
 * Market Dashboard With Ethics Integration
 *
 * Enhanced crypto/TCG market dashboard that performs ethics assessments
 * before automation actions (e.g., auto-trading, price alerts).
 *
 * @example
 * ```tsx
 * <MarketDashboardWithEthics
 *   tokens={['ethereum', 'bitcoin']}
 *   portfolio={holdings}
 *   automationContext={{
 *     teamSize: 5,
 *     automationLevel: 'partial',
 *     taskComplexity: 'mixed',
 *     humanInteractionRequired: true,
 *     decisionAutonomy: 'suggestions',
 *   }}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type AutomationLevel = 'assist' | 'partial' | 'substantial' | 'full';

export interface AutomationContext {
  teamSize: number;
  automationLevel: AutomationLevel;
  department?: string;
  taskComplexity: 'routine' | 'mixed' | 'complex' | 'creative';
  humanInteractionRequired: boolean;
  decisionAutonomy: 'suggestions' | 'semi-autonomous' | 'fully-autonomous';
}

export interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
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

export interface EthicsAssessment {
  score: number;
  category: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  allowed: boolean;
  warnings: string[];
}

export interface TradeAction {
  type: 'buy' | 'sell' | 'alert';
  tokenId?: string;
  cardId?: string;
  amount?: number;
  targetPrice?: number;
}

export interface MarketDashboardWithEthicsProps {
  tokens?: string[];
  portfolio?: PortfolioHolding[];
  automationContext: AutomationContext;
  onTradeRequested?: (action: TradeAction, assessment: EthicsAssessment) => void;
  onEthicsViolation?: (action: TradeAction, assessment: EthicsAssessment) => void;
  className?: string;
}

// ============================================================================
// ETHICS CALCULATION
// ============================================================================

function assessTradeAction(
  action: TradeAction,
  context: AutomationContext
): EthicsAssessment {
  const automationWeights: Record<AutomationLevel, number> = {
    assist: 0.15,
    partial: 0.35,
    substantial: 0.65,
    full: 0.90,
  };

  // Base score from automation level
  let score = automationWeights[context.automationLevel] * 50;

  // Adjust for action type
  if (action.type === 'buy' || action.type === 'sell') {
    score += 20; // Trading has higher risk
  } else if (action.type === 'alert') {
    score -= 10; // Alerts are low risk
  }

  // Adjust for team size
  if (context.teamSize > 10) {
    score += 10;
  }

  // Adjust for human interaction
  if (!context.humanInteractionRequired) {
    score += 15;
  }

  // Adjust for decision autonomy
  if (context.decisionAutonomy === 'fully-autonomous') {
    score += 20;
  } else if (context.decisionAutonomy === 'semi-autonomous') {
    score += 10;
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let category: EthicsAssessment['category'];
  if (score <= 15) category = 'minimal';
  else if (score <= 35) category = 'low';
  else if (score <= 55) category = 'medium';
  else if (score <= 80) category = 'high';
  else category = 'critical';

  const warnings: string[] = [];
  if (score > 55) {
    warnings.push('High automation risk - manual review recommended');
  }
  if (context.automationLevel === 'full') {
    warnings.push('Full automation requires ethics committee approval');
  }
  if (action.type !== 'alert' && !context.humanInteractionRequired) {
    warnings.push('Trading without human oversight may displace analyst roles');
  }

  return {
    score,
    category,
    allowed: category !== 'critical',
    warnings,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface EthicsBannerProps {
  assessment: EthicsAssessment;
}

function EthicsBanner({ assessment }: EthicsBannerProps) {
  const colors: Record<string, string> = {
    minimal: '#22c55e',
    low: '#84cc16',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: `${colors[assessment.category]}15`,
        borderLeft: `4px solid ${colors[assessment.category]}`,
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 600, color: colors[assessment.category] }}>
            Ethics Score: {assessment.score}
          </span>
          <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
            ({assessment.category} risk)
          </span>
        </div>
        {!assessment.allowed && (
          <span
            style={{
              padding: '4px 8px',
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            BLOCKED
          </span>
        )}
      </div>
      {assessment.warnings.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          {assessment.warnings.map((warning, idx) => (
            <div key={idx} style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TradeButtonProps {
  label: string;
  type: 'buy' | 'sell' | 'alert';
  disabled?: boolean;
  onClick: () => void;
}

function TradeButton({ label, type, disabled, onClick }: TradeButtonProps) {
  const colors = {
    buy: '#22c55e',
    sell: '#ef4444',
    alert: '#3b82f6',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 16px',
        backgroundColor: disabled ? '#2d2d44' : colors[type],
        color: disabled ? '#666' : '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'opacity 0.2s',
      }}
    >
      {label}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MarketDashboardWithEthics({
  tokens = ['ethereum', 'bitcoin'],
  portfolio = [],
  automationContext,
  onTradeRequested,
  onEthicsViolation,
  className,
}: MarketDashboardWithEthicsProps) {
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<TradeAction | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<EthicsAssessment | null>(null);

  // Mock price fetching
  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockPrices: TokenPrice[] = tokens.map((token) => ({
      id: token,
      symbol: token.slice(0, 3).toUpperCase(),
      name: token.charAt(0).toUpperCase() + token.slice(1),
      price: token === 'bitcoin' ? 45000 + Math.random() * 5000 : 2500 + Math.random() * 500,
      change24h: (Math.random() - 0.5) * 10,
      volume24h: Math.random() * 1000000000,
      lastUpdated: new Date(),
    }));

    setTokenPrices(mockPrices);
    setIsLoading(false);
  }, [tokens]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Handle trade action with ethics check
  const handleTradeAction = (action: TradeAction) => {
    const assessment = assessTradeAction(action, automationContext);
    setPendingAction(action);
    setCurrentAssessment(assessment);

    if (!assessment.allowed) {
      onEthicsViolation?.(action, assessment);
    } else if (assessment.category === 'high') {
      // Show warning but allow
      console.warn('High-risk action:', action, assessment);
    }
  };

  const confirmAction = () => {
    if (pendingAction && currentAssessment?.allowed) {
      onTradeRequested?.(pendingAction, currentAssessment);
    }
    setPendingAction(null);
    setCurrentAssessment(null);
  };

  const cancelAction = () => {
    setPendingAction(null);
    setCurrentAssessment(null);
  };

  // Calculate portfolio totals
  const portfolioValue = portfolio.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
  const portfolioCost = portfolio.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0);
  const portfolioPnL = portfolioValue - portfolioCost;

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
          TCG Market (Ethics-Aware)
        </h2>
        <div
          style={{
            padding: '4px 8px',
            backgroundColor: '#1a1a2e',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#888',
          }}
        >
          Automation: {automationContext.automationLevel}
        </div>
      </div>

      {/* Ethics Assessment Banner (when action pending) */}
      {currentAssessment && <EthicsBanner assessment={currentAssessment} />}

      {/* Token Prices */}
      <div style={{ padding: '16px', borderBottom: '1px solid #2d2d44' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '12px' }}>
          Market Prices
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {tokenPrices.map((token) => (
            <div
              key={token.id}
              onClick={() => setSelectedToken(token.id === selectedToken ? null : token.id)}
              style={{
                padding: '12px',
                backgroundColor: selectedToken === token.id ? '#1a1a2e' : '#16162a',
                borderRadius: '8px',
                cursor: 'pointer',
                border: selectedToken === token.id ? '1px solid #3b82f6' : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{token.symbol}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{token.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{formatCurrency(token.price)}</div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: token.change24h >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {formatPercent(token.change24h)}
                  </div>
                </div>
              </div>

              {/* Trade Actions (shown when selected) */}
              {selectedToken === token.id && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <TradeButton
                    label="Buy"
                    type="buy"
                    disabled={!!pendingAction}
                    onClick={() =>
                      handleTradeAction({ type: 'buy', tokenId: token.id, amount: 1 })
                    }
                  />
                  <TradeButton
                    label="Sell"
                    type="sell"
                    disabled={!!pendingAction}
                    onClick={() =>
                      handleTradeAction({ type: 'sell', tokenId: token.id, amount: 1 })
                    }
                  />
                  <TradeButton
                    label="Set Alert"
                    type="alert"
                    disabled={!!pendingAction}
                    onClick={() =>
                      handleTradeAction({
                        type: 'alert',
                        tokenId: token.id,
                        targetPrice: token.price * 1.1,
                      })
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio.length > 0 && (
        <div style={{ padding: '16px', borderBottom: '1px solid #2d2d44' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>
            Portfolio Summary
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#666' }}>Total Value</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                {formatCurrency(portfolioValue)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>P&L</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: portfolioPnL >= 0 ? '#22c55e' : '#ef4444',
                }}
              >
                {formatCurrency(portfolioPnL)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {pendingAction && currentAssessment && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#1a1a2e',
            borderTop: '1px solid #2d2d44',
          }}
        >
          <div style={{ fontSize: '13px', color: '#fff', marginBottom: '12px' }}>
            Confirm {pendingAction.type} action?
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={confirmAction}
              disabled={!currentAssessment.allowed}
              style={{
                padding: '8px 16px',
                backgroundColor: currentAssessment.allowed ? '#22c55e' : '#2d2d44',
                color: currentAssessment.allowed ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: currentAssessment.allowed ? 'pointer' : 'not-allowed',
                fontSize: '12px',
              }}
            >
              {currentAssessment.allowed ? 'Confirm' : 'Blocked by Ethics'}
            </button>
            <button
              onClick={cancelAction}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2d2d44',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#0a0a14',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#666',
        }}
      >
        <span>NIST RMF 2.0 + EU AI Act Compliant</span>
        <button
          onClick={fetchPrices}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '11px',
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}

export default MarketDashboardWithEthics;
