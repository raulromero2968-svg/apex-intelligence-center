'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  Hash,
  GitBranch,
  Clock,
  User,
  MessageSquare,
  Search,
  Target,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip
} from 'recharts';

interface ForensicReport {
  id: string;
  traceHash: string;
  ipfsCid: string;
  userId: string | null;
  query: string;
  response: string;
  citationCount: number;
  synthesisCount: number;
  noveltyScore: number;
  isValid: boolean;
  validationErrors: any;
  systemVersion: string;
  createdAt: string;
}

interface ReasoningSection {
  type: 'premise' | 'hypothesis' | 'conclusion';
  title: string;
  content: string;
  icon: any;
}

export default function ForensicReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<ForensicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['premise']));

  useEffect(() => {
    if (id) {
      fetchReport(id);
    }
  }, [id]);

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/forensics/${reportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Parse reasoning trace into structured sections
  const getReasoningSections = (): ReasoningSection[] => {
    if (!report) return [];

    // Split response into logical sections
    const sections: ReasoningSection[] = [];
    const response = report.response;

    // Extract premise (first 1/3 or introduction)
    const premiseMatch = response.substring(0, Math.min(response.length / 3, 500));
    sections.push({
      type: 'premise',
      title: 'Premise & Context',
      content: premiseMatch,
      icon: Target
    });

    // Extract hypothesis (middle section)
    const hypothesisStart = response.length / 3;
    const hypothesisMatch = response.substring(hypothesisStart, hypothesisStart + Math.min(response.length / 3, 500));
    sections.push({
      type: 'hypothesis',
      title: 'Hypothesis & Analysis',
      content: hypothesisMatch,
      icon: Search
    });

    // Extract conclusion (last part)
    const conclusionMatch = response.substring(Math.max(0, response.length - 500));
    sections.push({
      type: 'conclusion',
      title: 'Conclusion & Findings',
      content: conclusionMatch,
      icon: CheckCircle
    });

    return sections;
  };

  // Generate contrarian counter-arguments based on the report
  const getCounterArguments = () => {
    if (!report) return [];

    const counterArgs = [];

    if (report.noveltyScore > 0.7) {
      counterArgs.push({
        title: 'High Novelty Alert',
        content: 'This report exhibits unusually high novelty (>70%), suggesting potential AI synthesis beyond source material. Independent verification recommended.',
        severity: 'high' as const
      });
    }

    if (report.citationCount < 3) {
      counterArgs.push({
        title: 'Limited Source Attribution',
        content: `Only ${report.citationCount} citation(s) found. Claims may lack sufficient provenance backing. Consider cross-referencing with additional sources.`,
        severity: 'medium' as const
      });
    }

    if (!report.isValid) {
      counterArgs.push({
        title: 'Validation Failures Detected',
        content: 'This report failed internal validation checks. Review validation errors below for specific issues.',
        severity: 'high' as const
      });
    }

    if (report.synthesisCount > 5) {
      counterArgs.push({
        title: 'Heavy Synthesis Detected',
        content: `Report contains ${report.synthesisCount} synthesis operations. While not inherently problematic, heavy synthesis may introduce interpretative bias.`,
        severity: 'low' as const
      });
    }

    return counterArgs;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-200 text-lg">Loading forensic report...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/50 border border-red-500/30 rounded-lg p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error Loading Report</h2>
          <p className="text-slate-300 mb-4">{error || 'Report not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const reasoningSections = getReasoningSections();
  const counterArguments = getCounterArguments();

  // Authenticity gauge data
  const authenticityScore = Math.round((1 - report.noveltyScore) * 100);
  const gaugeData = [
    {
      name: 'Authenticity',
      value: authenticityScore,
      fill: authenticityScore >= 70 ? '#10b981' : authenticityScore >= 40 ? '#f59e0b' : '#ef4444'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-blue-500/20 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Forensic Report Viewer</h1>
              <p className="text-blue-300 text-sm mt-1">EU AI Act Compliance Analysis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Authenticity Score Card */}
          <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6 col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Authenticity</h3>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={12}
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold fill-white"
                >
                  {authenticityScore}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 text-center mt-2">
              {authenticityScore >= 70 ? 'High confidence' : authenticityScore >= 40 ? 'Review recommended' : 'Human review required'}
            </p>
          </div>

          {/* Validity Status */}
          <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              {report.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Status</h3>
            </div>
            <p className={`text-2xl font-bold ${report.isValid ? 'text-green-400' : 'text-red-400'}`}>
              {report.isValid ? 'Valid' : 'Invalid'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Validation status</p>
          </div>

          {/* Citations */}
          <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Citations</h3>
            </div>
            <p className="text-2xl font-bold text-white">{report.citationCount}</p>
            <p className="text-xs text-slate-400 mt-1">Source references</p>
          </div>

          {/* Synthesis Operations */}
          <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Synthesis</h3>
            </div>
            <p className="text-2xl font-bold text-white">{report.synthesisCount}</p>
            <p className="text-xs text-slate-400 mt-1">AI operations</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Query Section */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Original Query</h2>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-200">{report.query}</p>
              </div>
            </div>

            {/* Reasoning Trace Sections */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Reasoning Trace Analysis</h2>
              <div className="space-y-4">
                {reasoningSections.map((section, index) => {
                  const Icon = section.icon;
                  const isExpanded = expandedSections.has(section.type);

                  return (
                    <div key={section.type} className="border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.type)}
                        className="w-full flex items-center justify-between p-4 bg-slate-950/50 hover:bg-slate-950/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            section.type === 'premise' ? 'bg-blue-500/20 text-blue-400' :
                            section.type === 'hypothesis' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-white">{section.title}</h3>
                            <p className="text-xs text-slate-400">Step {index + 1} of {reasoningSections.length}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-slate-950/30">
                          <p className="text-slate-300 whitespace-pre-wrap">{section.content}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Image Analysis Section (Mockup) */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Image Analysis</h2>
              <div className="relative aspect-video bg-slate-950 rounded-lg border border-slate-700 overflow-hidden">
                {/* Placeholder for image */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No image data available</p>
                    <p className="text-xs mt-1">Image overlay would display defect highlights here</p>
                  </div>
                </div>

                {/* Example defect highlight overlays */}
                <div className="absolute top-4 left-4 w-24 h-24 border-2 border-red-500 rounded-lg animate-pulse">
                  <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Defect A
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 w-32 h-20 border-2 border-yellow-500 rounded-lg animate-pulse">
                  <div className="absolute -top-6 right-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                    Anomaly B
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-slate-300">Critical defects</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-slate-300">Minor anomalies</span>
                </div>
              </div>
            </div>

            {/* Contrarian Counter-Arguments */}
            {counterArguments.length > 0 && (
              <div className="bg-slate-900/50 border border-amber-500/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white">Contrarian Analysis</h2>
                  <span className="ml-auto text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                    {counterArguments.length} potential issue{counterArguments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {counterArguments.map((arg, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        arg.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                        arg.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          arg.severity === 'high' ? 'text-red-400' :
                          arg.severity === 'medium' ? 'text-amber-400' :
                          'text-blue-400'
                        }`} />
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{arg.title}</h3>
                          <p className="text-sm text-slate-300">{arg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata & Technical Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Provenance & Audit Trail */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Provenance</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Trace Hash</span>
                  </div>
                  <code className="text-xs text-blue-300 bg-slate-950 px-2 py-1 rounded block break-all">
                    {report.traceHash}
                  </code>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">IPFS Record</span>
                  </div>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${report.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 bg-slate-950 px-2 py-1 rounded block break-all hover:underline"
                  >
                    {report.ipfsCid}
                  </a>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">System Version</span>
                  </div>
                  <code className="text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded block break-all">
                    {report.systemVersion}
                  </code>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Created</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>

                {report.userId && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-slate-400 uppercase tracking-wide">User ID</span>
                    </div>
                    <code className="text-xs text-slate-300 bg-slate-950 px-2 py-1 rounded block break-all">
                      {report.userId}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Errors */}
            {report.validationErrors && (
              <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <h2 className="text-lg font-bold text-white">Validation Errors</h2>
                </div>
                <pre className="text-xs text-red-300 bg-slate-950 p-3 rounded overflow-x-auto">
                  {JSON.stringify(report.validationErrors, null, 2)}
                </pre>
              </div>
            )}

            {/* Quality Metrics */}
            <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Quality Metrics</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">Novelty Score</span>
                    <span className="text-sm font-semibold text-white">
                      {(report.noveltyScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        report.noveltyScore > 0.7 ? 'bg-red-500' :
                        report.noveltyScore > 0.4 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${report.noveltyScore * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">Citation Ratio</span>
                    <span className="text-sm font-semibold text-white">
                      {report.citationCount > 0 ?
                        (report.citationCount / Math.max(1, report.synthesisCount)).toFixed(2) :
                        '0.00'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(100, (report.citationCount / Math.max(1, report.synthesisCount)) * 50)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
