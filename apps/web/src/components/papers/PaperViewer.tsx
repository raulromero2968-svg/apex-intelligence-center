"use client";

import { useState, useCallback, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Hash,
  Quote,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PaperViewerProps {
  paper: Paper;
  onExport?: (format: 'markdown' | 'latex' | 'html') => void;
}

interface Paper {
  id: string;
  title: string;
  abstract: string;
  content: string;
  format: string;
  citationStyle: string;
  totalCitations: number;
  totalSynthesis: number;
  sourceCount?: number;
  complianceReport?: {
    traceHash: string;
    ipfsCid: string;
    provenanceUrl: string;
    noveltyScore: number;
    euAiActStatus: string;
  };
  metadata?: {
    model: string;
    generatedAt: string;
    processingTimeMs: number;
  };
}

export default function PaperViewer({ paper, onExport }: PaperViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showProvenance, setShowProvenance] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(paper.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [paper.content]);

  const handleExport = useCallback(
    async (format: 'markdown' | 'latex' | 'html') => {
      setActiveExport(format);
      try {
        const response = await fetch(
          `/api/papers/${paper.id}/export?format=${format}`
        );

        if (!response.ok) {
          throw new Error('Export failed');
        }

        // Get filename from header
        const disposition = response.headers.get('Content-Disposition');
        const filename =
          disposition?.match(/filename="(.+)"/)?.[1] ||
          `paper.${format === 'latex' ? 'tex' : format}`;

        // Download file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (onExport) {
          onExport(format);
        }
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setActiveExport(null);
      }
    },
    [paper.id, onExport]
  );

  // Highlight citations in content
  const processedContent = useMemo(() => {
    return paper.content
      .replace(
        /\[source:(\d+)\]/g,
        '<span class="citation">[source:$1]</span>'
      )
      .replace(
        /\[SYNTHESIS\]/g,
        '<span class="synthesis">[SYNTHESIS]</span>'
      );
  }, [paper.content]);

  return (
    <div className="rounded-xl border border-neon-purple/30 bg-cyber-dark/80 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-gray-700/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 font-display text-2xl font-bold text-white">
              {paper.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Quote className="h-4 w-4" />
                {paper.totalCitations} citations
              </span>
              <span className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                {paper.totalSynthesis} synthesis
              </span>
              {paper.sourceCount && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {paper.sourceCount} sources
                </span>
              )}
              <span className="rounded bg-gray-700/50 px-2 py-0.5 uppercase">
                {paper.citationStyle}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg bg-gray-700/50 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>

            <div className="relative">
              <div className="flex rounded-lg border border-gray-700 bg-gray-700/50">
                <button
                  onClick={() => handleExport('markdown')}
                  disabled={activeExport !== null}
                  className={`rounded-l-lg px-3 py-2 text-sm transition-colors ${
                    activeExport === 'markdown'
                      ? 'bg-neon-cyan text-cyber-dark'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  MD
                </button>
                <button
                  onClick={() => handleExport('latex')}
                  disabled={activeExport !== null}
                  className={`border-x border-gray-600 px-3 py-2 text-sm transition-colors ${
                    activeExport === 'latex'
                      ? 'bg-neon-purple text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  LaTeX
                </button>
                <button
                  onClick={() => handleExport('html')}
                  disabled={activeExport !== null}
                  className={`rounded-r-lg px-3 py-2 text-sm transition-colors ${
                    activeExport === 'html'
                      ? 'bg-neon-pink text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  HTML
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <div className="mt-4 rounded-lg border border-neon-purple/20 bg-neon-purple/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-neon-purple">
              Abstract
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">
              {paper.abstract}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div
          className="prose prose-invert prose-sm max-w-none
            prose-headings:font-display prose-headings:text-white
            prose-h2:border-b prose-h2:border-gray-700/50 prose-h2:pb-2 prose-h2:text-neon-cyan
            prose-h3:text-gray-200
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-strong:text-white
            prose-a:text-neon-cyan prose-a:no-underline hover:prose-a:underline
            prose-code:rounded prose-code:bg-gray-800 prose-code:px-1 prose-code:text-neon-pink
            [&_.citation]:rounded [&_.citation]:bg-neon-pink/20 [&_.citation]:px-1 [&_.citation]:text-neon-pink
            [&_.synthesis]:rounded [&_.synthesis]:bg-yellow-500/20 [&_.synthesis]:px-1 [&_.synthesis]:font-semibold [&_.synthesis]:text-yellow-400"
        >
          <div dangerouslySetInnerHTML={{ __html: processedContent }} />
        </div>
      </div>

      {/* Provenance Footer */}
      {paper.complianceReport && (
        <div className="border-t border-gray-700/50 p-6">
          <button
            onClick={() => setShowProvenance(!showProvenance)}
            className="flex w-full items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 font-medium text-gray-300">
              <Shield className="h-4 w-4 text-green-500" />
              EU AI Act Compliance
              <span
                className={`rounded px-2 py-0.5 text-xs uppercase ${
                  paper.complianceReport.euAiActStatus === 'compliant'
                    ? 'bg-green-500/20 text-green-400'
                    : paper.complianceReport.euAiActStatus === 'pending_review'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {paper.complianceReport.euAiActStatus}
              </span>
            </span>
            {showProvenance ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {showProvenance && (
            <div className="mt-4 space-y-3 rounded-lg bg-cyber-darker/50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">Trace Hash</p>
                  <p className="font-mono text-xs text-gray-300">
                    {paper.complianceReport.traceHash}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">IPFS CID</p>
                  <a
                    href={paper.complianceReport.provenanceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-neon-cyan hover:underline"
                  >
                    {paper.complianceReport.ipfsCid.slice(0, 20)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Novelty Score
                  </p>
                  <p className="text-xs text-gray-300">
                    {(paper.complianceReport.noveltyScore * 100).toFixed(1)}%
                  </p>
                </div>
                {paper.metadata && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Model</p>
                      <p className="text-xs text-gray-300">
                        {paper.metadata.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Generated
                      </p>
                      <p className="text-xs text-gray-300">
                        {new Date(paper.metadata.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Processing Time
                      </p>
                      <p className="text-xs text-gray-300">
                        {(paper.metadata.processingTimeMs / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
