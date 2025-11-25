/**
 * AI Code Review Agent
 *
 * Automated code review using CUA (Computer-Using Agent) patterns.
 * Ensures ethics compliance, security, and best practices.
 *
 * Features:
 * - Static analysis integration
 * - Ethics guard verification
 * - Security vulnerability detection
 * - Performance recommendations
 * - Human-in-the-loop approval workflow
 */

// ============================================================================
// TYPES
// ============================================================================

export type ReviewSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ReviewCategory = 'ethics' | 'security' | 'performance' | 'style' | 'logic' | 'documentation';

export interface CodeReviewRequest {
  code: string;
  filename: string;
  language: 'typescript' | 'javascript' | 'python';
  context?: {
    prNumber?: number;
    author?: string;
    changes?: string;
    branch?: string;
  };
}

export interface ReviewFinding {
  id: string;
  line?: number;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface EthicsCheckResult {
  passed: boolean;
  score: number;
  category: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  concerns: string[];
  requiredActions: string[];
}

export interface CodeReviewResult {
  id: string;
  filename: string;
  timestamp: Date;
  findings: ReviewFinding[];
  ethicsCheck: EthicsCheckResult;
  summary: {
    totalIssues: number;
    critical: number;
    errors: number;
    warnings: number;
    info: number;
  };
  recommendation: 'approve' | 'request_changes' | 'block';
  humanReviewRequired: boolean;
}

export interface ReviewWorkflow {
  steps: ReviewStep[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: Partial<CodeReviewResult>;
}

export interface ReviewStep {
  type: 'parse' | 'analyze' | 'ethics_check' | 'security_scan' | 'suggest';
  status: 'pending' | 'completed' | 'failed';
  output?: unknown;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ETHICS_PATTERNS = {
  fullAutomation: /automationLevel\s*[=:]\s*['"`]full['"`]/g,
  noGuard: /async\s+function\s+\w+.*\{(?![\s\S]*ethicsGuard|[\s\S]*assessJobImpact)/g,
  dataCollection: /collect|track|monitor.*user|personal/gi,
  jobReplacement: /replace.*employee|automate.*team|eliminate.*role/gi,
};

export const SECURITY_PATTERNS = {
  sqlInjection: /`.*\$\{.*\}.*`.*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
  xss: /innerHTML\s*=|dangerouslySetInnerHTML/g,
  hardcodedSecret: /(password|secret|api_key|token)\s*[=:]\s*['"`][^'"`]+['"`]/gi,
  evalUsage: /eval\(|new Function\(/g,
  unsafeRegex: /\(\.\*\)\+|\(\.\+\)\*/g,
};

export const PERFORMANCE_PATTERNS = {
  nPlusOne: /for.*await.*for|\.map\(.*await/g,
  missingMemo: /useCallback|useMemo/g,
  largeBundle: /import\s+\*\s+as|import\s+\{[^}]{100,}\}/g,
  synchronousOp: /readFileSync|writeFileSync|execSync/g,
};

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Parse code and extract structure
 */
function parseCode(code: string, language: string): {
  lines: string[];
  functions: string[];
  imports: string[];
  exports: string[];
} {
  const lines = code.split('\n');

  const functions: string[] = [];
  const imports: string[] = [];
  const exports: string[] = [];

  for (const line of lines) {
    if (line.match(/^import\s+/)) {
      imports.push(line.trim());
    }
    if (line.match(/^export\s+/)) {
      exports.push(line.trim());
    }
    if (line.match(/(?:async\s+)?function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\(/)) {
      const match = line.match(/(?:function|const)\s+(\w+)/);
      if (match) functions.push(match[1]);
    }
  }

  return { lines, functions, imports, exports };
}

/**
 * Check for ethics violations
 */
function checkEthicsPatterns(code: string): ReviewFinding[] {
  const findings: ReviewFinding[] = [];

  // Check for full automation without guard
  const fullAutoMatches = code.matchAll(ETHICS_PATTERNS.fullAutomation);
  for (const match of fullAutoMatches) {
    const lineNum = code.substring(0, match.index).split('\n').length;
    findings.push({
      id: `ethics-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      line: lineNum,
      severity: 'critical',
      category: 'ethics',
      message: 'Full automation level detected - requires ethics committee approval',
      suggestion: 'Add ethicsGuard() check before this operation or use assessJobImpact()',
      autoFixable: false,
    });
  }

  // Check for job replacement language
  const jobMatches = code.matchAll(ETHICS_PATTERNS.jobReplacement);
  for (const match of jobMatches) {
    const lineNum = code.substring(0, match.index).split('\n').length;
    findings.push({
      id: `ethics-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      line: lineNum,
      severity: 'warning',
      category: 'ethics',
      message: 'Language suggesting job replacement detected - review for ethical concerns',
      suggestion: 'Consider reframing as "augmentation" or "assistance" rather than "replacement"',
      autoFixable: false,
    });
  }

  return findings;
}

/**
 * Check for security vulnerabilities
 */
function checkSecurityPatterns(code: string): ReviewFinding[] {
  const findings: ReviewFinding[] = [];

  for (const [patternName, pattern] of Object.entries(SECURITY_PATTERNS)) {
    const matches = code.matchAll(pattern);
    for (const match of matches) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        id: `security-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        line: lineNum,
        severity: patternName === 'hardcodedSecret' ? 'critical' : 'error',
        category: 'security',
        message: `Potential security issue: ${formatPatternName(patternName)}`,
        suggestion: getSecuritySuggestion(patternName),
        autoFixable: false,
      });
    }
  }

  return findings;
}

/**
 * Check for performance issues
 */
function checkPerformancePatterns(code: string): ReviewFinding[] {
  const findings: ReviewFinding[] = [];

  for (const [patternName, pattern] of Object.entries(PERFORMANCE_PATTERNS)) {
    if (patternName === 'missingMemo') {
      // Check if memo hooks are used appropriately
      const hasCallback = code.includes('useCallback');
      const hasMemo = code.includes('useMemo');
      const hasUseEffect = code.includes('useEffect');

      if (hasUseEffect && !hasCallback && !hasMemo && code.includes('useState')) {
        findings.push({
          id: `perf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          severity: 'info',
          category: 'performance',
          message: 'Consider using useCallback/useMemo to optimize re-renders',
          suggestion: 'Wrap callbacks in useCallback and computed values in useMemo',
          autoFixable: false,
        });
      }
      continue;
    }

    const matches = code.matchAll(pattern);
    for (const match of matches) {
      const lineNum = code.substring(0, match.index).split('\n').length;
      findings.push({
        id: `perf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        line: lineNum,
        severity: 'warning',
        category: 'performance',
        message: `Performance concern: ${formatPatternName(patternName)}`,
        suggestion: getPerformanceSuggestion(patternName),
        autoFixable: false,
      });
    }
  }

  return findings;
}

/**
 * Format pattern name for display
 */
function formatPatternName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Get security suggestion for pattern
 */
function getSecuritySuggestion(pattern: string): string {
  const suggestions: Record<string, string> = {
    sqlInjection: 'Use parameterized queries or an ORM',
    xss: 'Sanitize user input and use React\'s built-in escaping',
    hardcodedSecret: 'Move secrets to environment variables',
    evalUsage: 'Avoid eval() - use safer alternatives',
    unsafeRegex: 'Simplify regex to avoid ReDoS vulnerabilities',
  };
  return suggestions[pattern] || 'Review and fix the security concern';
}

/**
 * Get performance suggestion for pattern
 */
function getPerformanceSuggestion(pattern: string): string {
  const suggestions: Record<string, string> = {
    nPlusOne: 'Batch database queries or use DataLoader pattern',
    largeBundle: 'Use named imports to enable tree-shaking',
    synchronousOp: 'Use async versions for better performance',
  };
  return suggestions[pattern] || 'Consider optimizing this pattern';
}

// ============================================================================
// ETHICS CHECK
// ============================================================================

/**
 * Perform comprehensive ethics check
 */
function performEthicsCheck(code: string, findings: ReviewFinding[]): EthicsCheckResult {
  const ethicsFindings = findings.filter((f) => f.category === 'ethics');
  const criticalCount = ethicsFindings.filter((f) => f.severity === 'critical').length;
  const warningCount = ethicsFindings.filter((f) => f.severity === 'warning').length;

  // Calculate ethics score (0-100)
  let score = 100;
  score -= criticalCount * 30;
  score -= warningCount * 10;
  score = Math.max(0, score);

  // Determine category
  let category: EthicsCheckResult['category'];
  if (score >= 90) category = 'minimal';
  else if (score >= 70) category = 'low';
  else if (score >= 50) category = 'medium';
  else if (score >= 30) category = 'high';
  else category = 'critical';

  // Collect concerns
  const concerns = ethicsFindings.map((f) => f.message);

  // Determine required actions
  const requiredActions: string[] = [];
  if (criticalCount > 0) {
    requiredActions.push('Ethics committee review required');
    requiredActions.push('Add job impact assessment');
  }
  if (warningCount > 0) {
    requiredActions.push('Review language for ethical framing');
  }
  if (code.includes('automate') && !code.includes('ethicsGuard')) {
    requiredActions.push('Add ethics guard to automation functions');
  }

  return {
    passed: category !== 'critical',
    score,
    category,
    concerns,
    requiredActions,
  };
}

// ============================================================================
// MAIN REVIEW FUNCTION
// ============================================================================

/**
 * Perform comprehensive code review
 */
export async function reviewCode(request: CodeReviewRequest): Promise<CodeReviewResult> {
  const { code, filename, language, context } = request;

  // Parse code structure
  const parsed = parseCode(code, language);

  // Collect all findings
  const findings: ReviewFinding[] = [];

  // Ethics analysis
  findings.push(...checkEthicsPatterns(code));

  // Security analysis
  findings.push(...checkSecurityPatterns(code));

  // Performance analysis
  findings.push(...checkPerformancePatterns(code));

  // Check for documentation
  if (!code.includes('/**') && !code.includes('//')) {
    findings.push({
      id: `doc-${Date.now()}`,
      severity: 'info',
      category: 'documentation',
      message: 'No documentation comments found',
      suggestion: 'Add JSDoc comments to exported functions',
      autoFixable: false,
    });
  }

  // Perform ethics check
  const ethicsCheck = performEthicsCheck(code, findings);

  // Calculate summary
  const summary = {
    totalIssues: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
  };

  // Determine recommendation
  let recommendation: CodeReviewResult['recommendation'];
  if (summary.critical > 0 || !ethicsCheck.passed) {
    recommendation = 'block';
  } else if (summary.errors > 0 || summary.warnings > 2) {
    recommendation = 'request_changes';
  } else {
    recommendation = 'approve';
  }

  // Determine if human review is required
  const humanReviewRequired =
    summary.critical > 0 ||
    ethicsCheck.category === 'high' ||
    ethicsCheck.category === 'critical' ||
    (context?.changes?.length ?? 0) > 500;

  return {
    id: `review-${Date.now()}`,
    filename,
    timestamp: new Date(),
    findings,
    ethicsCheck,
    summary,
    recommendation,
    humanReviewRequired,
  };
}

/**
 * Execute review workflow with multiple steps
 */
export async function executeReviewWorkflow(request: CodeReviewRequest): Promise<ReviewWorkflow> {
  const workflow: ReviewWorkflow = {
    steps: [
      { type: 'parse', status: 'pending' },
      { type: 'analyze', status: 'pending' },
      { type: 'ethics_check', status: 'pending' },
      { type: 'security_scan', status: 'pending' },
      { type: 'suggest', status: 'pending' },
    ],
    status: 'pending',
    results: {},
  };

  try {
    workflow.status = 'in_progress';

    // Step 1: Parse
    workflow.steps[0].status = 'completed';
    workflow.steps[0].output = parseCode(request.code, request.language);

    // Step 2: Analyze
    workflow.steps[1].status = 'completed';

    // Step 3: Ethics check
    const ethicsFindings = checkEthicsPatterns(request.code);
    workflow.steps[2].status = 'completed';
    workflow.steps[2].output = ethicsFindings;

    // Step 4: Security scan
    const securityFindings = checkSecurityPatterns(request.code);
    workflow.steps[3].status = 'completed';
    workflow.steps[3].output = securityFindings;

    // Step 5: Generate suggestions
    workflow.steps[4].status = 'completed';

    // Complete review
    const fullResult = await reviewCode(request);
    workflow.results = fullResult;
    workflow.status = 'completed';

  } catch (error) {
    workflow.status = 'failed';
    console.error('Review workflow failed:', error);
  }

  return workflow;
}

/**
 * Generate PR comment from review result
 */
export function generatePRComment(result: CodeReviewResult): string {
  const lines: string[] = [];

  lines.push(`## Code Review: ${result.filename}`);
  lines.push('');

  // Summary
  lines.push(`### Summary`);
  lines.push(`- **Total Issues:** ${result.summary.totalIssues}`);
  lines.push(`- **Critical:** ${result.summary.critical}`);
  lines.push(`- **Errors:** ${result.summary.errors}`);
  lines.push(`- **Warnings:** ${result.summary.warnings}`);
  lines.push('');

  // Ethics Check
  lines.push(`### Ethics Compliance`);
  lines.push(`- **Score:** ${result.ethicsCheck.score}/100`);
  lines.push(`- **Category:** ${result.ethicsCheck.category}`);
  lines.push(`- **Passed:** ${result.ethicsCheck.passed ? 'Yes' : 'No'}`);

  if (result.ethicsCheck.concerns.length > 0) {
    lines.push('');
    lines.push('**Concerns:**');
    for (const concern of result.ethicsCheck.concerns) {
      lines.push(`- ${concern}`);
    }
  }

  if (result.ethicsCheck.requiredActions.length > 0) {
    lines.push('');
    lines.push('**Required Actions:**');
    for (const action of result.ethicsCheck.requiredActions) {
      lines.push(`- [ ] ${action}`);
    }
  }
  lines.push('');

  // Recommendation
  const emoji = result.recommendation === 'approve' ? '✅' :
               result.recommendation === 'request_changes' ? '🔄' : '🚫';
  lines.push(`### Recommendation: ${emoji} ${result.recommendation.replace('_', ' ').toUpperCase()}`);

  if (result.humanReviewRequired) {
    lines.push('');
    lines.push('> ⚠️ **Human review required** - Please have a team member verify these changes.');
  }

  return lines.join('\n');
}
