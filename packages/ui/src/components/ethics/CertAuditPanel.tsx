/**
 * ISO 42001 Certification Audit Panel
 *
 * UI component for running AI management system certification audits.
 * Displays checklist, progress, findings, and recommendations.
 *
 * Features:
 * - 10-step audit checklist with live progress
 * - Job protection scoring
 * - PDF report download
 * - Remediation plan generation
 *
 * Trade-offs:
 * ✅ GOOD: Visual audit progress improves transparency
 * ✅ GOOD: Job protection metrics front and center
 * ❌ BAD: Complex form for system context input
 */

'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type AuditStepStatus = 'pass' | 'fail' | 'partial' | 'pending';

interface AuditStep {
  id: number;
  clause: string;
  description: string;
  category: 'governance' | 'risk' | 'controls' | 'operations' | 'improvement';
  requirements: string[];
  jobProtectionRelevance: string;
}

interface AuditStepResult extends AuditStep {
  status: AuditStepStatus;
  evidence: string;
  findings: string[];
  recommendations: string[];
  complianceScore: number;
  updatesFrom2025?: string;
}

interface SystemContext {
  organizationName: string;
  aiUses: string[];
  teamSize: number;
  industryType: string;
  existingCertifications?: string[];
  automationLevel: 'minimal' | 'partial' | 'significant' | 'full';
  dataProcessingTypes: string[];
}

interface AuditSummary {
  overallStatus: 'certified' | 'conditional' | 'non-compliant';
  overallScore: number;
  passedSteps: number;
  failedSteps: number;
  partialSteps: number;
  criticalFindings: string[];
  jobProtectionScore: number;
  readinessLevel: 'ready' | 'near-ready' | 'needs-work' | 'significant-gaps';
}

interface AuditReport {
  id: string;
  systemContext: SystemContext;
  results: AuditStepResult[];
  summary: AuditSummary;
  generatedAt: Date;
  pdfPath?: string;
}

interface CertAuditPanelProps {
  systemContext?: Partial<SystemContext>;
  onAuditComplete?: (report: AuditReport) => void;
  compact?: boolean;
}

// ============================================================================
// MOCK AUDIT FUNCTION (Replace with actual import in production)
// ============================================================================

async function runISO42001Audit(context: SystemContext): Promise<AuditReport> {
  // Simulate audit delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const checklist: AuditStep[] = [
    { id: 1, clause: '4.1-4.4', description: 'Establish AI governance structure', category: 'governance', requirements: ['Define organizational context', 'Identify stakeholders', 'Establish scope', 'Document leadership commitment'], jobProtectionRelevance: 'Governance must include workforce representation' },
    { id: 2, clause: '5.1-5.3', description: 'Map AI risks including job displacement', category: 'risk', requirements: ['Identify workforce risks', 'Assess automation impact', 'Document risk tolerance', 'Establish treatment plans'], jobProtectionRelevance: 'Risk mapping must address job displacement' },
    { id: 3, clause: '4.2', description: 'Identify and engage stakeholders', category: 'governance', requirements: ['Map affected parties', 'Establish communication', 'Document requirements', 'Create engagement processes'], jobProtectionRelevance: 'Employees must be primary stakeholders' },
    { id: 4, clause: '6.1', description: 'Conduct comprehensive risk assessment', category: 'risk', requirements: ['Perform risk analysis', 'Evaluate bias risks', 'Assess privacy risks', 'Document priorities'], jobProtectionRelevance: 'Include workforce impact scoring' },
    { id: 5, clause: '6.2, 8.1', description: 'Implement AI controls and safeguards', category: 'controls', requirements: ['Deploy technical controls', 'Implement human-in-loop', 'Establish overrides', 'Document effectiveness'], jobProtectionRelevance: 'Humans can override AI decisions' },
    { id: 6, clause: '9.1', description: 'Establish monitoring and measurement', category: 'operations', requirements: ['Define KPIs', 'Implement monitoring', 'Track metrics', 'Document methods'], jobProtectionRelevance: 'Track job impact metrics' },
    { id: 7, clause: '8.2', description: 'Create incident response procedures', category: 'operations', requirements: ['Define categories', 'Establish procedures', 'Create escalation paths', 'Document lessons'], jobProtectionRelevance: 'Cover wrongful automation incidents' },
    { id: 8, clause: '7.5', description: 'Maintain comprehensive documentation', category: 'governance', requirements: ['Document AI specs', 'Maintain records', 'Keep audit trails', 'Version control'], jobProtectionRelevance: 'Include workforce impact records' },
    { id: 9, clause: '7.2-7.3', description: 'Implement training and reskilling programs', category: 'operations', requirements: ['Assess competencies', 'Develop AI literacy', 'Create transition pathways', 'Track effectiveness'], jobProtectionRelevance: 'Reskilling must precede AI deployment' },
    { id: 10, clause: '10.1-10.2', description: 'Establish continuous improvement', category: 'improvement', requirements: ['Implement corrections', 'Conduct reviews', 'Track opportunities', 'Document lessons'], jobProtectionRelevance: 'Optimize for workforce benefit' },
  ];

  // Generate mock results based on context
  const results: AuditStepResult[] = checklist.map((step) => {
    const passedCount = Math.floor(Math.random() * step.requirements.length) + 1;
    const ratio = passedCount / step.requirements.length;
    const status: AuditStepStatus = ratio >= 0.9 ? 'pass' : ratio >= 0.5 ? 'partial' : 'fail';

    return {
      ...step,
      status,
      evidence: `Evaluated ${passedCount}/${step.requirements.length} requirements`,
      findings: status !== 'pass' ? [`Gap in ${step.description}`] : [],
      recommendations: status !== 'pass' ? [`Implement remaining ${step.description} requirements`] : [],
      complianceScore: Math.round(ratio * 100),
      updatesFrom2025: status !== 'pass' ? '2025 guidance recommends enhanced controls' : undefined,
    };
  });

  const passedSteps = results.filter((r) => r.status === 'pass').length;
  const failedSteps = results.filter((r) => r.status === 'fail').length;
  const partialSteps = results.filter((r) => r.status === 'partial').length;
  const overallScore = Math.round(results.reduce((sum, r) => sum + r.complianceScore, 0) / results.length);

  const summary: AuditSummary = {
    overallStatus: overallScore >= 85 ? 'certified' : overallScore >= 60 ? 'conditional' : 'non-compliant',
    overallScore,
    passedSteps,
    failedSteps,
    partialSteps,
    criticalFindings: results.filter((r) => r.status === 'fail').map((r) => r.findings[0]).filter(Boolean),
    jobProtectionScore: Math.round((results.filter((r) => ['risk', 'operations'].includes(r.category)).reduce((sum, r) => sum + r.complianceScore, 0) / 5)),
    readinessLevel: overallScore >= 90 ? 'ready' : overallScore >= 75 ? 'near-ready' : overallScore >= 50 ? 'needs-work' : 'significant-gaps',
  };

  return {
    id: `audit-${Date.now()}`,
    systemContext: context,
    results,
    summary,
    generatedAt: new Date(),
    pdfPath: `/reports/iso42001-audit-${Date.now()}.pdf`,
  };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: AuditStepStatus }) {
  const styles: Record<AuditStepStatus, string> = {
    pass: 'bg-green-500/20 text-green-400 border-green-500/30',
    partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    fail: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const labels: Record<AuditStepStatus, string> = {
    pass: 'PASS',
    partial: 'PARTIAL',
    fail: 'FAIL',
    pending: 'PENDING',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-mono border rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 85) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${getColor(score)}`}>{score}%</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function ProgressRing({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg className="w-24 h-24 transform -rotate-90">
      <circle
        cx="48"
        cy="48"
        r="40"
        stroke="currentColor"
        strokeWidth="8"
        fill="none"
        className="text-gray-700"
      />
      <circle
        cx="48"
        cy="48"
        r="40"
        stroke="currentColor"
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="text-cyan-400 transition-all duration-500"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CertAuditPanel({
  systemContext: initialContext,
  onAuditComplete,
  compact = false,
}: CertAuditPanelProps) {
  const [context, setContext] = useState<SystemContext>({
    organizationName: initialContext?.organizationName || '',
    aiUses: initialContext?.aiUses || [],
    teamSize: initialContext?.teamSize || 10,
    industryType: initialContext?.industryType || 'technology',
    existingCertifications: initialContext?.existingCertifications || [],
    automationLevel: initialContext?.automationLevel || 'partial',
    dataProcessingTypes: initialContext?.dataProcessingTypes || [],
  });

  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showContextForm, setShowContextForm] = useState(!initialContext?.organizationName);

  const handleRunAudit = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    setReport(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const result = await runISO42001Audit(context);
      setReport(result);
      setProgress(100);
      onAuditComplete?.(result);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  }, [context, onAuditComplete]);

  const handleInputChange = (field: keyof SystemContext, value: string | number | string[]) => {
    setContext((prev) => ({ ...prev, [field]: value }));
  };

  // Compact view for embedding
  if (compact && !report) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-white">ISO 42001 Certification Audit</h4>
            <p className="text-xs text-gray-400 mt-1">AI Management System compliance check</p>
          </div>
          <button
            onClick={handleRunAudit}
            disabled={loading}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Audit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-cyan-400">ISO 42001</span> Certification Audit
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              AI Management System - 10 Step Compliance Check
            </p>
          </div>
          {report && (
            <div className="flex items-center gap-4">
              <ScoreGauge score={report.summary.overallScore} label="Overall" />
              <ScoreGauge score={report.summary.jobProtectionScore} label="Job Protection" />
            </div>
          )}
        </div>
      </div>

      {/* Context Form */}
      {showContextForm && !report && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/30">
          <h4 className="text-sm font-medium text-white mb-3">System Context</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Organization Name</label>
              <input
                type="text"
                value={context.organizationName}
                onChange={(e) => handleInputChange('organizationName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                placeholder="Your organization"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Team Size</label>
              <input
                type="number"
                value={context.teamSize}
                onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Automation Level</label>
              <select
                value={context.automationLevel}
                onChange={(e) => handleInputChange('automationLevel', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
              >
                <option value="minimal">Minimal</option>
                <option value="partial">Partial</option>
                <option value="significant">Significant</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Industry</label>
              <input
                type="text"
                value={context.industryType}
                onChange={(e) => handleInputChange('industryType', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white"
                placeholder="e.g., technology, healthcare"
              />
            </div>
          </div>
          <button
            onClick={() => setShowContextForm(false)}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300"
          >
            Save Context
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center">
          <ProgressRing progress={progress} />
          <p className="mt-4 text-sm text-gray-400">Running ISO 42001 audit...</p>
          <p className="text-xs text-gray-500">Step {Math.ceil(progress / 10)} of 10</p>
        </div>
      )}

      {/* Results */}
      {report && !loading && (
        <>
          {/* Summary Banner */}
          <div className={`p-4 border-b ${
            report.summary.overallStatus === 'certified' ? 'bg-green-900/20 border-green-700' :
            report.summary.overallStatus === 'conditional' ? 'bg-yellow-900/20 border-yellow-700' :
            'bg-red-900/20 border-red-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-lg font-bold ${
                  report.summary.overallStatus === 'certified' ? 'text-green-400' :
                  report.summary.overallStatus === 'conditional' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {report.summary.overallStatus === 'certified' ? 'CERTIFICATION READY' :
                   report.summary.overallStatus === 'conditional' ? 'CONDITIONAL PASS' :
                   'NON-COMPLIANT'}
                </span>
                <p className="text-sm text-gray-400 mt-1">
                  {report.summary.passedSteps} passed, {report.summary.partialSteps} partial, {report.summary.failedSteps} failed
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm ${
                  report.summary.readinessLevel === 'ready' ? 'text-green-400' :
                  report.summary.readinessLevel === 'near-ready' ? 'text-cyan-400' :
                  'text-yellow-400'
                }`}>
                  Readiness: {report.summary.readinessLevel.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="divide-y divide-gray-700">
            {report.results.map((step) => (
              <div key={step.id} className="hover:bg-gray-800/30 transition-colors">
                <button
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  className="w-full p-4 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono w-6">{step.id}.</span>
                    <div>
                      <span className="text-sm text-white">{step.description}</span>
                      <span className="text-xs text-gray-500 ml-2">({step.clause})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{step.complianceScore}%</span>
                    <StatusBadge status={step.status} />
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${expandedStep === step.id ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedStep === step.id && (
                  <div className="px-4 pb-4 ml-9 space-y-3">
                    <div className="text-xs text-cyan-400 bg-cyan-900/20 p-2 rounded">
                      Job Protection: {step.jobProtectionRelevance}
                    </div>

                    {step.findings.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-red-400 mb-1">Findings</h5>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          {step.findings.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}

                    {step.recommendations.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-yellow-400 mb-1">Recommendations</h5>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          {step.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}

                    {step.updatesFrom2025 && (
                      <div className="text-xs text-purple-400 bg-purple-900/20 p-2 rounded">
                        2025 Update: {step.updatesFrom2025}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/30 flex items-center justify-between">
            <button
              onClick={() => { setReport(null); setShowContextForm(true); }}
              className="text-sm text-gray-400 hover:text-white"
            >
              New Audit
            </button>
            <div className="flex gap-2">
              {report.pdfPath && (
                <button className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-sm hover:bg-purple-500/30">
                  Download Report
                </button>
              )}
              <button className="px-4 py-2 bg-cyan-500 text-black rounded text-sm font-medium hover:bg-cyan-400">
                Generate Remediation Plan
              </button>
            </div>
          </div>
        </>
      )}

      {/* Initial State */}
      {!report && !loading && !showContextForm && (
        <div className="p-8 text-center">
          <p className="text-gray-400 mb-4">Ready to run ISO 42001 certification audit</p>
          <button
            onClick={handleRunAudit}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg"
          >
            Start Audit
          </button>
        </div>
      )}
    </div>
  );
}

export default CertAuditPanel;
