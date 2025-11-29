/**
 * SourceCard - Evidence Chain Display for Network Graph
 *
 * Displays the evidentiary basis for connections in the Power Network.
 * Color-coded by Truth Tier to visually communicate reliability.
 *
 * @module power-network/SourceCard
 */

'use client';

import { ExternalLink, Shield, FileText, AlertTriangle, HelpCircle } from 'lucide-react';

export type EvidenceTier = 'CONFIRMED' | 'DOCUMENTED' | 'ALLEGED' | 'SPECULATIVE';

export interface SourceCardProps {
  description: string;
  confidence: EvidenceTier;
  citation: string;
  domain: string;
  evidenceLink?: string;
  significance?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  sourceName?: string;
  targetName?: string;
  relationshipType?: string;
}

const tierConfig: Record<EvidenceTier, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Shield;
  label: string;
  description: string;
}> = {
  CONFIRMED: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: Shield,
    label: 'CONFIRMED',
    description: 'Court documents, official records, direct evidence'
  },
  DOCUMENTED: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: FileText,
    label: 'DOCUMENTED',
    description: 'Credible journalism, multiple sources'
  },
  ALLEGED: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: AlertTriangle,
    label: 'ALLEGED',
    description: 'Single source, unverified but plausible'
  },
  SPECULATIVE: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: HelpCircle,
    label: 'SPECULATIVE',
    description: 'Pattern-based inference, requires more evidence'
  }
};

const significanceColors: Record<string, string> = {
  low: 'text-slate-400',
  medium: 'text-slate-300',
  high: 'text-orange-400',
  critical: 'text-red-400 font-bold'
};

export function SourceCard({
  description,
  confidence,
  citation,
  domain,
  evidenceLink,
  significance = 'medium',
  startDate,
  endDate,
  sourceName,
  targetName,
  relationshipType
}: SourceCardProps) {
  const tier = tierConfig[confidence] || tierConfig.DOCUMENTED;
  const TierIcon = tier.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  const dateRange = startDate || endDate
    ? `${formatDate(startDate) || '?'} - ${formatDate(endDate) || 'Present'}`
    : null;

  return (
    <div className={`rounded-lg border ${tier.borderColor} ${tier.bgColor} p-4 transition-all`}>
      {/* Header with entities */}
      {sourceName && targetName && (
        <div className="mb-3 pb-2 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Connection</p>
          <p className="text-sm font-medium text-slate-200">
            <span className="text-white">{sourceName}</span>
            <span className="text-slate-500 mx-2">→</span>
            <span className="text-white">{targetName}</span>
          </p>
          {relationshipType && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-300">
              {relationshipType}
            </span>
          )}
        </div>
      )}

      {/* Evidence Tier Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TierIcon className={`w-4 h-4 ${tier.color}`} />
          <span className={`text-xs font-mono uppercase tracking-widest ${tier.color}`}>
            {tier.label}
          </span>
        </div>
        <span className={`text-xs ${significanceColors[significance]}`}>
          {significance.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3">
        {description}
      </p>

      {/* Domain & Date */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-400">
          <span className="text-slate-500">Domain:</span>
          <span className="text-slate-300">{domain}</span>
        </span>
        {dateRange && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-800/50 rounded text-slate-400">
            <span className="text-slate-500">Period:</span>
            <span className="text-slate-300">{dateRange}</span>
          </span>
        )}
      </div>

      {/* Citation */}
      <div className="pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Citation</p>
        {evidenceLink ? (
          <a
            href={evidenceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <span className="truncate">{citation}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
          </a>
        ) : (
          <p className="text-xs text-slate-400 font-mono">{citation}</p>
        )}
      </div>

      {/* Tier Description (collapsed helper) */}
      <details className="mt-3">
        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
          What does "{tier.label}" mean?
        </summary>
        <p className="text-xs text-slate-500 mt-1 pl-2 border-l border-slate-700">
          {tier.description}
        </p>
      </details>
    </div>
  );
}

export default SourceCard;
