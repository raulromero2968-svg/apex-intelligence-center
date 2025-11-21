"use client";

import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useLivePrices } from '@/hooks/useLivePrices';
import { extractSymbols } from '@/lib/research';

interface ResearchPanelProps {
  userText?: string;
  llmText?: string;
  title?: string;
  sessionId?: string;
}

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;").replace(/`/g, "&#96;");
}

export default function ResearchPanel({
  userText = "",
  llmText = "",
  title = "Research Analysis",
  sessionId = "",
}: ResearchPanelProps) {
  // Extract symbols from LLM response
  const symbols = useMemo(() => {
    if (!llmText) return [];
    return extractSymbols(llmText);
  }, [llmText]);

  // WebSocket connection for live prices
  const { deltas, isConnected } = useLivePrices({
    sessionId,
    enabled: !!llmText && symbols.length > 0 && !!sessionId,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h2>

      {userText && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            User Input
          </h3>
          <div className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {escapeHtml(userText)}
          </div>
        </div>
      )}

      {llmText && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Analysis
          </h3>
          <div className="whitespace-pre-wrap rounded bg-blue-50 p-3 text-sm text-gray-800 dark:bg-blue-900/20 dark:text-gray-200">
            {escapeHtml(llmText)}
          </div>
        </div>
      )}

      {!userText && !llmText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No research data available.
        </p>
      )}

      {/* Live Price Deltas */}
      {symbols.length > 0 && llmText && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Live Prices
            </h3>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {symbols.map((symbol) => {
              const delta = deltas.get(symbol);
              const isPositive = delta && delta.priceChange > 0;
              const isNegative = delta && delta.priceChange < 0;

              return (
                <div
                  key={symbol}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    delta
                      ? isPositive
                        ? 'border border-green-500/50 bg-green-500/10'
                        : isNegative
                        ? 'border border-red-500/50 bg-red-500/10'
                        : 'border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                      : 'border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                  }`}
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {symbol.charAt(0) + symbol.slice(1).toLowerCase()}
                  </span>
                  {delta ? (
                    <>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : isNegative ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : null}
                      <span
                        className={
                          isPositive
                            ? 'text-green-600'
                            : isNegative
                            ? 'text-red-600'
                            : 'text-gray-700 dark:text-gray-300'
                        }
                      >
                        {isPositive ? '+' : ''}
                        ${delta.priceChange.toPrecision(3)} (
                        {delta.percentChange.toPrecision(3)}%)
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">No data</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

