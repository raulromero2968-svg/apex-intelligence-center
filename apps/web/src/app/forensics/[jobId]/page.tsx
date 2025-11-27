'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SectionShell from '../../(sections)/SectionShell';
import { Loader2, AlertCircle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

interface ForensicResult {
  id: string;
  jobId: string;
  cardId: string | null;
  imageUrl: string;
  grade: string | null;
  confidence: number | null;
  counterfeitScore: number | null;
  reasoningTrace: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
}

function JsonTreeView({ data, level = 0 }: { data: unknown; level?: number }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (data === null || data === undefined) {
    return <span className="text-white/50">null</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-green-400">&quot;{data}&quot;</span>;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return <span className="text-cyan-400">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    return (
      <div className="ml-4">
        <span className="text-white/70">[</span>
        {data.map((item, idx) => (
          <div key={idx} className="ml-4">
            <JsonTreeView data={item} level={level + 1} />
            {idx < data.length - 1 && <span className="text-white/50">,</span>}
          </div>
        ))}
        <span className="text-white/70">]</span>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <div className="ml-4">
        <span className="text-white/70">{'{'}</span>
        {keys.map((key, idx) => {
          const isExpanded = expanded[key] ?? false;
          const value = (data as Record<string, unknown>)[key];
          const isComplex = typeof value === 'object' && value !== null;

          return (
            <div key={key} className="ml-4">
              <div className="flex items-center gap-1">
                {isComplex && (
                  <button
                    onClick={() => toggle(key)}
                    className="text-white/50 hover:text-white"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                )}
                <span className="text-purple-400">&quot;{key}&quot;</span>;
                <span className="text-white/50">:</span>
                {isComplex && !isExpanded ? (
                  <span className="text-white/50">
                    {Array.isArray(value) ? `[...]` : `{...}`}
                  </span>
                ) : (
                  <JsonTreeView data={value} level={level + 1} />
                )}
              </div>
              {idx < keys.length - 1 && <span className="text-white/50">,</span>}
            </div>
          );
        })}
        <span className="text-white/70">{'}'}</span>
      </div>
    );
  }

  return <span className="text-white/50">{String(data)}</span>;
}

export default function ForensicReportPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [result, setResult] = useState<ForensicResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await trpc.forensics.getByJobId.query({ jobId });

        if (result) {
          setResult(result as ForensicResult);
        } else {
          setError('Forensic result not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load result');
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      loadResult();
    }
  }, [jobId]);

  if (isLoading) {
    return (
      <SectionShell title="Forensic Report" kicker={`Job: ${jobId}`}>
        <div className="flex items-center justify-center h-64 text-white/50">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading forensic report...
        </div>
      </SectionShell>
    );
  }

  if (error || !result) {
    return (
      <SectionShell title="Forensic Report" kicker={`Job: ${jobId}`}>
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error || 'Forensic result not found'}</p>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Forensic Report" kicker={`Job: ${jobId}`}>
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <div className="text-sm text-white/50 mb-1">Grade</div>
            <div className="text-2xl font-bold text-cyan-400">
              {result.grade || 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <div className="text-sm text-white/50 mb-1">Confidence</div>
            <div className="text-2xl font-bold text-green-400">
              {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>

          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <div className="text-sm text-white/50 mb-1">Counterfeit Score</div>
            <div className="text-2xl font-bold text-red-400">
              {result.counterfeitScore ? `${(result.counterfeitScore * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm font-semibold text-white mb-2">Card Image</div>
          <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden border border-cyan-500/20">
            <img
              src={result.imageUrl}
              alt="Card image"
              className="w-full h-full object-contain"
            />
          </div>
          <a
            href={result.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Open in new tab <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Card Link */}
        {result.cardId && (
          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <div className="text-sm font-semibold text-white mb-2">Related Card</div>
            <Link
              href={`/cards/${result.cardId}`}
              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              View Card <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Reasoning Trace */}
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm font-semibold text-white mb-4">Reasoning Trace</div>
          <div className="p-4 bg-black/60 rounded-md overflow-x-auto font-mono text-xs">
            <JsonTreeView data={result.reasoningTrace} />
          </div>
        </div>

        {/* Metadata */}
        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
            <div className="text-sm font-semibold text-white mb-4">Metadata</div>
            <div className="p-4 bg-black/60 rounded-md overflow-x-auto font-mono text-xs">
              <JsonTreeView data={result.metadata} />
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="p-4 bg-black/40 border border-cyan-500/20 rounded-lg">
          <div className="text-sm font-semibold text-white mb-2">Timestamps</div>
          <div className="space-y-1 text-sm text-white/70">
            <div>
              Created: {new Date(result.createdAt).toLocaleString()}
            </div>
            {result.completedAt && (
              <div>
                Completed: {new Date(result.completedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

