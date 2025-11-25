/**
 * A/B Testing Domain Pack
 *
 * RAG knowledge base for A/B testing best practices.
 * Implements knowledge-06-data-ab-testing domain knowledge.
 */

// ============================================================================
// TYPES
// ============================================================================

export type Category =
  | 'experiment_design'
  | 'statistical_methods'
  | 'implementation'
  | 'analysis'
  | 'best_practices'
  | 'cross_module';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: Category;
  type: 'guide' | 'reference' | 'example' | 'pattern';
  tags: string[];
}

// ============================================================================
// CORE KNOWLEDGE DOCUMENTS
// ============================================================================

export const CORE_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'ab-experiment-design',
    title: 'A/B Experiment Design Principles',
    category: 'experiment_design',
    type: 'guide',
    tags: ['experiment', 'design', 'hypothesis', 'variants'],
    content: `# A/B Experiment Design Principles

## Hypothesis Formation
1. State clear, testable hypothesis
2. Define primary and secondary metrics
3. Predict expected direction of change
4. Set success criteria before starting

## Variant Design
- Control: Current experience (baseline)
- Treatment: Single isolated change
- Avoid multiple changes per variant
- Ensure variants are mutually exclusive

## Sample Size Planning
\`\`\`typescript
// Calculate required sample size
const sampleSize = calculateRequiredSampleSize({
  baselineConversionRate: 0.05, // 5% baseline
  minimumDetectableEffect: 0.1, // 10% relative improvement
  confidenceLevel: 0.95,
  statisticalPower: 0.8,
  variants: 2
});
\`\`\`

## Duration Planning
- Run until sample size reached
- Include full business cycles (weeks)
- Account for novelty effects
- Minimum 1-2 weeks recommended

## Randomization
- Use deterministic hashing for consistency
- User-level > session-level for most tests
- Consider stratified randomization for small samples`,
  },
  {
    id: 'ab-statistical-significance',
    title: 'Statistical Significance Testing',
    category: 'statistical_methods',
    type: 'reference',
    tags: ['statistics', 'significance', 'p-value', 'confidence'],
    content: `# Statistical Significance Testing

## Key Concepts
- **P-value**: Probability of observed result if null hypothesis true
- **Confidence Level**: 1 - α (typically 95%)
- **Statistical Power**: 1 - β (typically 80%)
- **Effect Size**: Magnitude of difference

## Test Selection
| Metric Type | Recommended Test |
|-------------|------------------|
| Conversion (binary) | Chi-squared or Z-test |
| Revenue (continuous) | T-test |
| Count data | Poisson test |
| Time-to-event | Log-rank test |

## Chi-Squared Test
\`\`\`typescript
const result = chiSquaredTest(control, treatment, 0.95);
// result.isSignificant: boolean
// result.pValue: number
// result.relativeUplift: number
\`\`\`

## Avoiding Pitfalls
1. Don't peek at results (set duration upfront)
2. Don't stop early on significance
3. Adjust for multiple comparisons
4. Check for Simpson's paradox`,
  },
  {
    id: 'ab-implementation-patterns',
    title: 'A/B Test Implementation Patterns',
    category: 'implementation',
    type: 'pattern',
    tags: ['implementation', 'code', 'feature-flags', 'sdk'],
    content: `# A/B Test Implementation Patterns

## Client-Side Assignment
\`\`\`typescript
// In React component
const { variant, config } = useExperiment('homepage-cta-test');

return variant === 'treatment' ? (
  <Button color={config.buttonColor}>
    {config.buttonText}
  </Button>
) : (
  <Button>Sign Up</Button>
);
\`\`\`

## Server-Side Assignment
\`\`\`typescript
// In API route
const assignment = assignUserToExperiment(experiment, {
  userId: session.userId,
  deviceType: request.headers['x-device-type'],
  region: geoip.lookup(request.ip)?.country
});

if (assignment.assigned) {
  // Apply variant configuration
  response.variant = assignment.variantName;
}
\`\`\`

## Feature Flag Integration
\`\`\`typescript
// Merge experiment flags with feature flags
const flags = getMergedFeatureFlags(assignments);
if (flags['new-checkout-flow']) {
  // Show new checkout
}
\`\`\`

## Event Tracking
\`\`\`typescript
// Track conversions
trackEvent({
  experimentId: assignment.experimentId,
  variantId: assignment.variantId,
  eventName: 'purchase_completed',
  eventValue: orderTotal
});
\`\`\``,
  },
  {
    id: 'ab-cross-module-testing',
    title: 'Cross-Module A/B Testing',
    category: 'cross_module',
    type: 'guide',
    tags: ['webxr', 'mobile', 'defense', 'seo', 'integration'],
    content: `# Cross-Module A/B Testing

## WebXR Module Tests
- Test gesture interactions (pack-mp-hand-001)
- Compare 3D vs 2D visualizations
- Measure immersion metrics

\`\`\`typescript
const experiment: Experiment = {
  targetModule: 'webxr',
  variants: [
    { name: 'control', config: { renderMode: '2d' } },
    { name: 'immersive', config: { renderMode: 'webxr' } }
  ]
};
\`\`\`

## Mobile Performance Tests (knowledge-08)
- Test list virtualization strategies
- Compare bridge optimization approaches
- Measure startup time improvements

## Defense Module Tests (pack-ai-defense-001)
- Test DDIL sync strategies
- Compare edge AI models
- Measure anomaly detection accuracy

## SEO/Performance Tests (knowledge-07)
- Test meta tag variations
- Compare Core Web Vitals optimizations
- Measure structured data impact

## LLM/CUA Tests (pack-cua-001)
- Test agent prompt variations
- Compare tool selection strategies
- Measure task completion rates`,
  },
  {
    id: 'ab-analysis-reporting',
    title: 'Experiment Analysis & Reporting',
    category: 'analysis',
    type: 'guide',
    tags: ['analysis', 'reporting', 'interpretation', 'decision'],
    content: `# Experiment Analysis & Reporting

## Pre-Analysis Checklist
1. Verify sample ratio mismatch (SRM)
2. Check for data quality issues
3. Validate assignment consistency
4. Review segment distributions

## Analysis Steps
\`\`\`typescript
// 1. Calculate metrics per variant
const metrics = calculateVariantMetrics(experiment);

// 2. Run statistical tests
const results = analyzeExperiment(
  metrics,
  'chi_squared',
  0.95
);

// 3. Determine winner
const { winner, reason } = determineWinner(results, 0.02);
\`\`\`

## Interpreting Results
| Scenario | Action |
|----------|--------|
| Significant positive | Ship treatment |
| Significant negative | Keep control |
| Not significant | Inconclusive - extend or redesign |
| Unexpected direction | Investigate segments |

## Segment Analysis
- Device type (mobile vs desktop)
- User tenure (new vs returning)
- Geography
- Traffic source

## Documentation
- Document hypothesis and rationale
- Record all metrics (primary + secondary)
- Note any anomalies or issues
- Share learnings with team`,
  },
  {
    id: 'ab-best-practices',
    title: 'A/B Testing Best Practices',
    category: 'best_practices',
    type: 'guide',
    tags: ['best-practices', 'pitfalls', 'guidelines'],
    content: `# A/B Testing Best Practices

## Do's
✅ Define success metrics before starting
✅ Run tests for full business cycles
✅ Use deterministic assignment
✅ Document everything
✅ Consider long-term effects
✅ Segment results for insights
✅ Build a testing culture

## Don'ts
❌ Peek at results and stop early
❌ Test multiple changes at once
❌ Ignore statistical significance
❌ Forget about practical significance
❌ Run too many concurrent tests
❌ Test on insufficient traffic
❌ Ignore selection bias

## Traffic Allocation Guidelines
| Traffic Level | Recommendation |
|--------------|----------------|
| <1000/day | Focus on big changes |
| 1000-10000/day | Standard A/B tests |
| >10000/day | Multi-variant tests OK |

## Minimum Detectable Effect
- Large MDE (20%+): Quick tests, big changes
- Medium MDE (5-20%): Standard optimization
- Small MDE (<5%): High traffic required

## Prioritization Framework
\`\`\`
Impact × Confidence × Ease = Priority Score
\`\`\`

- **Impact**: Expected lift × traffic
- **Confidence**: Data supporting hypothesis
- **Ease**: Development effort`,
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  experiment_design: {
    name: 'Experiment Design Assistant',
    description: 'Help design an A/B test experiment',
    template: `You are an A/B testing expert helping design an experiment.

Context:
- Feature/Change: {feature}
- Target Module: {module}
- Current Baseline: {baseline}
- Expected Impact: {expectedImpact}

Based on A/B testing best practices, provide:
1. Clear hypothesis statement
2. Recommended variants
3. Primary and secondary metrics
4. Sample size recommendation
5. Duration recommendation
6. Potential risks and mitigations`,
    variables: ['feature', 'module', 'baseline', 'expectedImpact'],
  },

  results_analysis: {
    name: 'Results Analysis Assistant',
    description: 'Help interpret A/B test results',
    template: `You are an A/B testing analyst interpreting experiment results.

Experiment: {experimentName}
Control: {controlStats}
Treatment: {treatmentStats}
Statistical Results: {statisticalResults}

Provide:
1. Summary of findings
2. Statistical interpretation
3. Practical significance assessment
4. Recommended action
5. Suggested follow-up tests`,
    variables: ['experimentName', 'controlStats', 'treatmentStats', 'statisticalResults'],
  },

  cross_module_test: {
    name: 'Cross-Module Test Designer',
    description: 'Design tests that span multiple platform modules',
    template: `Design an A/B test that integrates multiple platform modules.

Modules Involved: {modules}
User Journey: {userJourney}
Business Goal: {businessGoal}

Consider:
1. Module-specific metrics
2. Cross-module attribution
3. Technical implementation challenges
4. Segment considerations`,
    variables: ['modules', 'userJourney', 'businessGoal'],
  },
};

// ============================================================================
// INITIALIZATION & SEARCH
// ============================================================================

/**
 * Initialize A/B testing knowledge for a project
 */
export async function initializeAbKnowledge(projectId: string): Promise<number> {
  // In production, this would insert into database with embeddings
  console.log(`Initializing A/B testing knowledge for project ${projectId}`);
  return CORE_KNOWLEDGE.length;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  projectId: string,
  options: {
    query: string;
    category?: Category;
    limit?: number;
  }
): Promise<KnowledgeDocument[]> {
  const { query, category, limit = 5 } = options;
  const queryLower = query.toLowerCase();

  let results = CORE_KNOWLEDGE.filter((doc) => {
    if (category && doc.category !== category) return false;

    return (
      doc.title.toLowerCase().includes(queryLower) ||
      doc.content.toLowerCase().includes(queryLower) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(queryLower))
    );
  });

  return results.slice(0, limit);
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(
  projectId: string,
  category: Category
): Promise<KnowledgeDocument[]> {
  return CORE_KNOWLEDGE.filter((doc) => doc.category === category);
}

/**
 * Get prompt template
 */
export function getPromptTemplate(templateId: string): PromptTemplate | null {
  return PROMPT_TEMPLATES[templateId] ?? null;
}

/**
 * Fill prompt template with variables
 */
export function fillPromptTemplate(
  templateId: string,
  variables: Record<string, string>
): string | null {
  const template = PROMPT_TEMPLATES[templateId];
  if (!template) return null;

  let filled = template.template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return filled;
}
