'use client';

import { Loader2, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface ContrarianResult {
  jobId: string;
  traceId: string;
  status: 'ok' | 'error';
  mainstreamAnswer: {
    text: string;
    sources: Array<{ id: string; url: string | null; type: string; author: string | null }>;
  } | null;
  contrarianAnswer: {
    text: string;
    sources: Array<{ id: string; url: string | null; type: string; author: string | null }>;
  } | null;
  diagnostics: {
    falseCorrectionLoopScore: number;
    resilienceScore: number;
    usedLowPrestigeSources: boolean;
    sentimentClusterSummary: Record<string, unknown>;
  };
  error: string | null;
}

interface ContrarianResultViewProps {
  result: ContrarianResult | null;
  isLoading: boolean;
  error: string | null;
}

export default function ContrarianResultView({
  result,
  isLoading,
  error,
}: ContrarianResultViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/50">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Analyzing with contrarian perspective...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mainstream Answer */}
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Mainstream Perspective</h3>
          </div>
          {result.mainstreamAnswer ? (
            <div className="space-y-4">
              <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                {result.mainstreamAnswer.text}
              </div>
              {result.mainstreamAnswer.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-2">Sources ({result.mainstreamAnswer.sources.length}):</div>
                  <div className="space-y-1">
                    {result.mainstreamAnswer.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-cyan-400">
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {source.type} {source.author ? `by ${source.author}` : ''}
                          </a>
                        ) : (
                          <span>{source.type} {source.author ? `by ${source.author}` : ''} (ID: {source.id.slice(0, 8)})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/50 text-sm">No mainstream results available</div>
          )}
        </div>

        {/* Contrarian Answer */}
        <div className="p-4 bg-black/40 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Contrarian Perspective</h3>
          </div>
          {result.contrarianAnswer ? (
            <div className="space-y-4">
              <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                {result.contrarianAnswer.text}
              </div>
              {result.contrarianAnswer.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-white/50 mb-2">Sources ({result.contrarianAnswer.sources.length}):</div>
                  <div className="space-y-1">
                    {result.contrarianAnswer.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-red-400">
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {source.type} {source.author ? `by ${source.author}` : ''}
                          </a>
                        ) : (
                          <span>{source.type} {source.author ? `by ${source.author}` : ''} (ID: {source.id.slice(0, 8)})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-white/50 text-sm">No contrarian results available</div>
          )}
        </div>
      </div>

      {/* Diagnostics */}
      {result.diagnostics && (
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Diagnostics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white/5 rounded-md">
              <div className="text-xs text-white/50 mb-1">False Correction Loop Score</div>
              <div className="text-lg font-bold text-yellow-400">
                {(result.diagnostics.falseCorrectionLoopScore * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-white/40 mt-1">
                {result.diagnostics.falseCorrectionLoopScore < 0.3 ? 'Low risk' : result.diagnostics.falseCorrectionLoopScore < 0.7 ? 'Moderate risk' : 'High risk'}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-md">
              <div className="text-xs text-white/50 mb-1">Resilience Score</div>
              <div className="text-lg font-bold text-green-400">
                {(result.diagnostics.resilienceScore * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-white/40 mt-1">
                {result.diagnostics.resilienceScore > 0.7 ? 'High' : result.diagnostics.resilienceScore > 0.4 ? 'Moderate' : 'Low'}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-md">
              <div className="text-xs text-white/50 mb-1">Low Prestige Sources</div>
              <div className="text-lg font-bold text-orange-400">
                {result.diagnostics.usedLowPrestigeSources ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-md">
              <div className="text-xs text-white/50 mb-1">Sentiment Clusters</div>
              <div className="text-lg font-bold text-purple-400">
                {typeof result.diagnostics.sentimentClusterSummary === 'object' && result.diagnostics.sentimentClusterSummary !== null && 'totalClusters' in result.diagnostics.sentimentClusterSummary
                  ? String(result.diagnostics.sentimentClusterSummary.totalClusters || 0)
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


