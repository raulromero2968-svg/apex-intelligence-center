/**
 * Ethics & Job Protection Module
 *
 * Ethical safeguards for AI automation with human-in-loop controls.
 * Addresses AI job displacement concerns proactively.
 */

// Job Protection Guard
export {
  // Types
  type ImpactLevel,
  type AutomationType,
  type ApprovalStatus,
  type AgentAction,
  type ImpactAssessment,
  type GuardResult,
  type MitigationSuggestion,
  type ReskillingSuggestion,
  type EthicsContext,
  type OverrideRequest,

  // Constants
  IMPACT_THRESHOLDS,
  AUTOMATION_TYPE_WEIGHTS,
  HIGH_IMPACT_ACTIONS,

  // Assessment
  calculateImpactScore,
  isHighImpact,

  // Suggestions
  generateMitigations,
  generateReskillingSuggestions,

  // Main Functions
  ethicsGuard,
  processHumanOverride,
  batchAssessment,
} from './job-protect-guard';

// Domain Pack (RAG)
export {
  type Category,
  type KnowledgeDocument,
  type PromptTemplate,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  searchKnowledge,
  getPromptTemplate,
  fillPromptTemplate,
} from './domain-pack';

// Job Impact Assessor (NIST/OECD/EU AI Act)
export {
  // Types
  type RiskCategory,
  type AutomationLevel,
  type WorkforceImpact,
  type AssessmentContext,
  type ImpactAssessment as JobImpactAssessment,
  type FrameworkCompliance,
  type ReskillingRecommendation,
  type MitigationAction,
  type AuditRecord,

  // Constants
  AUTOMATION_LEVEL_WEIGHTS,
  TASK_COMPLEXITY_MODIFIERS,
  DECISION_AUTONOMY_WEIGHTS,
  RISK_THRESHOLDS,
  APPROVAL_REQUIREMENTS,

  // Core Functions
  calculateBaseScore,
  getRiskCategory,
  getWorkforceImpact,
  assessFrameworkCompliance,

  // Recommendations
  generateReskillingRecommendations,
  generateMitigations as generateJobMitigations,

  // Main Assessment
  assessJobImpact,
  batchAssessment as batchJobAssessment,

  // Approval Workflow
  hasRequiredApprovals,
  getPendingApprovals,
} from './job-impact-assessor';

// ISO 42001 Certification Auditor
export {
  // Types
  type AuditStepStatus,
  type AuditStep,
  type AuditStepResult,
  type SystemContext,
  type AuditConfig,
  type AuditReport,
  type AuditSummary,

  // Constants
  ISO_42001_CHECKLIST,
  CATEGORY_WEIGHTS,
  STATUS_SCORES,
  DEFAULT_AUDIT_CONFIG,

  // Class
  CertAuditor,

  // Helper Functions
  quickAuditCheck,
  getAuditChecklist,
  estimateAuditDuration,
  generateRemediationPlan,
} from './cert-auditor';
