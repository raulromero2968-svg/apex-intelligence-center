/**
 * Ethics Domain Pack
 *
 * RAG knowledge base for ethical AI and job protection.
 * Addresses AI displacement concerns with best practices.
 */

// ============================================================================
// TYPES
// ============================================================================

export type Category =
  | 'job_protection'
  | 'human_ai_collaboration'
  | 'reskilling'
  | 'ethical_frameworks'
  | 'impact_assessment'
  | 'governance';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: Category;
  type: 'guide' | 'reference' | 'framework' | 'case_study';
  tags: string[];
  framework?: string;
}

// ============================================================================
// CORE KNOWLEDGE DOCUMENTS
// ============================================================================

export const CORE_KNOWLEDGE: KnowledgeDocument[] = [
  {
    id: 'ethics-job-protection-principles',
    title: 'AI Job Protection Principles',
    category: 'job_protection',
    type: 'guide',
    tags: ['jobs', 'protection', 'automation', 'displacement'],
    framework: 'Apex Ethics Framework',
    content: `# AI Job Protection Principles

## Core Philosophy
AI should augment human capabilities, not replace human workers wholesale.
The goal is human-AI collaboration that creates value for both organizations
and their people.

## Key Principles

### 1. Human-in-the-Loop by Default
- All high-impact automations require human review
- Critical decisions must have human approval gates
- AI suggestions, humans decide

### 2. Gradual Transition
- Phase automation over time (6-18 months typical)
- Start with pilot programs
- Measure impact before scaling

### 3. Transparent Impact Assessment
- Document jobs/roles affected before implementation
- Share impact assessments with affected teams
- Include worker representatives in planning

### 4. Mandatory Reskilling Investment
- Allocate budget for training (recommend 5-10% of automation savings)
- Provide time for employees to learn new skills
- Create clear career transition paths

### 5. Role Evolution, Not Elimination
- Transform roles to work alongside AI
- Create new positions: AI trainers, oversight, quality assurance
- Emphasize uniquely human skills

## Impact Assessment Framework
\`\`\`typescript
const assessment = calculateImpactScore({
  type: 'automate_support_tickets',
  automationType: 'function_replace',
  estimatedJobsAffected: 25,
  targetRoles: ['support_agent', 'ticket_router']
});

if (assessment.level === 'high' || assessment.level === 'critical') {
  // Require management approval
  // Generate mitigation plan
  // Create reskilling recommendations
}
\`\`\``,
  },
  {
    id: 'ethics-human-ai-collab',
    title: 'Human-AI Collaboration Models',
    category: 'human_ai_collaboration',
    type: 'guide',
    tags: ['collaboration', 'augmentation', 'workflow', 'hybrid'],
    content: `# Human-AI Collaboration Models

## Collaboration Spectrum
1. **AI Assist**: AI provides suggestions, human does work
2. **AI Augment**: AI handles routine, human handles complex
3. **AI Partner**: AI and human work together equally
4. **AI Lead**: AI does most work, human oversees
5. **AI Autonomous**: AI works independently (highest risk)

## Recommended Models by Domain

### Customer Support
- Model: AI Augment
- AI handles: Routine queries, routing, sentiment analysis
- Human handles: Complex issues, emotional situations, escalations
- Result: 3x throughput, maintained satisfaction

### Software Development
- Model: AI Partner
- AI handles: Code suggestions, testing, documentation
- Human handles: Architecture, reviews, creative solutions
- Result: 2x productivity, same quality

### Decision Making
- Model: AI Assist
- AI handles: Data analysis, pattern recognition, recommendations
- Human handles: Final decisions, ethical judgment, context
- Result: Better decisions, maintained accountability

## Implementation Checklist
- [ ] Map current workflows
- [ ] Identify AI-suitable tasks (repetitive, data-heavy)
- [ ] Identify human-essential tasks (creative, ethical, relational)
- [ ] Design handoff points
- [ ] Create feedback loops
- [ ] Train both humans and AI on collaboration`,
  },
  {
    id: 'ethics-reskilling-framework',
    title: 'AI-Era Reskilling Framework',
    category: 'reskilling',
    type: 'framework',
    tags: ['reskilling', 'training', 'skills', 'career'],
    framework: 'WEF Future of Work',
    content: `# AI-Era Reskilling Framework

## Skill Categories for 2025+

### 1. AI Collaboration Skills (Direct)
- Prompt engineering and AI tool usage
- Output validation and quality assurance
- AI workflow design
- Data preparation and curation

### 2. Human-Centric Skills (Irreplaceable)
- Complex problem solving
- Critical thinking and analysis
- Creativity and innovation
- Emotional intelligence
- Leadership and social influence
- Ethical reasoning

### 3. Hybrid Skills (Emerging)
- AI system oversight
- Human-AI workflow optimization
- AI ethics and governance
- Change management for automation

## Reskilling Program Template

### Phase 1: Assessment (2 weeks)
- Skill gap analysis
- Career aspiration mapping
- Learning style evaluation

### Phase 2: Foundation (4 weeks)
- AI literacy fundamentals
- Tool proficiency training
- Collaboration models

### Phase 3: Specialization (8 weeks)
- Domain-specific AI applications
- Advanced tool mastery
- Project-based learning

### Phase 4: Integration (4 weeks)
- Real-world application
- Mentorship pairing
- Performance evaluation

## Success Metrics
- Skill certification rates
- Internal mobility success
- Productivity post-training
- Employee satisfaction scores`,
  },
  {
    id: 'ethics-impact-methodology',
    title: 'Automation Impact Assessment Methodology',
    category: 'impact_assessment',
    type: 'reference',
    tags: ['assessment', 'impact', 'methodology', 'metrics'],
    content: `# Automation Impact Assessment Methodology

## Impact Factors

### 1. Skill Obsolescence (25% weight)
How much does automation make current skills redundant?
- 0.0-0.3: Skills remain valuable
- 0.3-0.6: Partial skill relevance
- 0.6-0.9: Significant skill displacement
- 0.9-1.0: Complete skill obsolescence

### 2. Role Redundancy (25% weight)
What percentage of the role becomes automated?
- <20%: Role enhanced
- 20-50%: Role transformed
- 50-80%: Role significantly reduced
- >80%: Role at risk

### 3. Task Automation (20% weight)
Breadth of tasks automated within function
- Single task: Low impact
- Multiple tasks: Medium impact
- Full process: High impact
- Multiple processes: Critical impact

### 4. Decision Autonomy (15% weight)
Level of autonomous decision-making by AI
- Suggestion only: Minimal
- Semi-autonomous: Medium
- Fully autonomous: High

### 5. Human Interaction Displacement (15% weight)
Impact on human-to-human interactions
- Maintained: Minimal
- Reduced: Medium
- Eliminated: High

## Score Interpretation

| Score | Level | Required Actions |
|-------|-------|------------------|
| 0-10 | Minimal | Standard monitoring |
| 11-30 | Low | Document efficiency gains |
| 31-50 | Medium | Human oversight required |
| 51-75 | High | Management approval + mitigation |
| 76-100 | Critical | Executive approval + full plan |`,
  },
  {
    id: 'ethics-governance-model',
    title: 'AI Ethics Governance Model',
    category: 'governance',
    type: 'framework',
    tags: ['governance', 'oversight', 'committee', 'policy'],
    framework: 'IEEE Ethically Aligned Design',
    content: `# AI Ethics Governance Model

## Governance Structure

### Ethics Committee
- Role: Oversee AI ethics compliance
- Composition: Tech leads, HR, Legal, Employee reps
- Meeting: Monthly + ad-hoc for high-impact cases
- Authority: Approve/reject high-impact automations

### Review Process
1. **Pre-Implementation Review**
   - Impact assessment submission
   - Mitigation plan review
   - Stakeholder notification

2. **Implementation Monitoring**
   - Phased rollout checkpoints
   - Employee feedback collection
   - Performance metrics tracking

3. **Post-Implementation Audit**
   - Actual vs. projected impact
   - Reskilling effectiveness
   - Lessons learned documentation

## Policy Framework

### Mandatory Policies
- No automation without impact assessment (>low risk)
- 30-day notice to affected employees
- Reskilling offer for all displaced roles
- Appeal process for rejected automations

### Recommended Policies
- Ethics training for AI developers
- Regular ethics audits (quarterly)
- Public transparency reports
- Third-party ethics reviews (annual)

## Compliance Checklist
- [ ] Impact assessment completed
- [ ] Ethics committee approval (if required)
- [ ] Affected employees notified
- [ ] Reskilling plan in place
- [ ] Mitigation measures documented
- [ ] Rollback plan prepared
- [ ] Monitoring metrics defined`,
  },
  {
    id: 'ethics-case-study-support',
    title: 'Case Study: Ethical Support Automation',
    category: 'job_protection',
    type: 'case_study',
    tags: ['case-study', 'support', 'automation', 'success'],
    content: `# Case Study: Ethical Customer Support Automation

## Scenario
TechCorp wanted to automate 70% of customer support tickets using AI,
potentially displacing 50 support agents.

## Initial Assessment
- Impact Level: Critical (score: 82)
- Jobs at Risk: 50 direct, 10 indirect
- Estimated Savings: $3M/year
- Original Timeline: 3 months

## Ethics Guard Intervention
The ethics guard blocked the automation and required:
1. Executive approval
2. Full mitigation plan
3. Reskilling program
4. Extended timeline

## Implemented Solution

### Phase 1: AI Triage (Month 1-2)
- AI categorizes and routes tickets
- All agents retained
- Result: 20% efficiency gain

### Phase 2: AI Assist (Month 3-4)
- AI drafts responses for agent review
- Agents trained on AI collaboration
- Result: 40% efficiency gain, 5 agents moved to QA roles

### Phase 3: AI Augment (Month 5-8)
- AI handles routine queries autonomously
- Agents focus on complex cases
- Reskilling: 20 agents became AI trainers/QA
- Result: 60% efficiency gain

### Phase 4: Optimization (Month 9-12)
- Refined AI based on agent feedback
- Created new AI Operations team
- Final: 15 agents transitioned to new roles

## Outcomes
- Automation: 65% (vs. 70% target)
- Jobs Displaced: 0 (vs. 50 projected)
- Jobs Transformed: 35
- New Jobs Created: 8 (AI Ops team)
- Timeline: 12 months (vs. 3 months)
- Savings: $2.2M/year (vs. $3M projected)
- Employee Satisfaction: +15%

## Key Lessons
1. Slower rollout = better outcomes
2. Reskilling investment pays off
3. New roles emerge from AI adoption
4. Employee involvement improves AI quality`,
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
  impact_assessment: {
    name: 'Impact Assessment Generator',
    description: 'Generate comprehensive impact assessment for automation',
    template: `You are an AI ethics advisor helping assess automation impact.

Automation: {automationDescription}
Affected Roles: {affectedRoles}
Estimated Jobs: {estimatedJobs}

Provide:
1. Impact score breakdown by factor
2. Risk level assessment
3. Mitigation recommendations
4. Reskilling suggestions for affected employees
5. Recommended implementation timeline`,
    variables: ['automationDescription', 'affectedRoles', 'estimatedJobs'],
  },

  reskilling_plan: {
    name: 'Reskilling Plan Generator',
    description: 'Create personalized reskilling plan',
    template: `Create a reskilling plan for employees affected by AI automation.

Current Role: {currentRole}
Current Skills: {currentSkills}
New Role Target: {targetRole}
Timeline: {timeline}

Include:
1. Skill gap analysis
2. Recommended training programs
3. Milestone checkpoints
4. Success metrics`,
    variables: ['currentRole', 'currentSkills', 'targetRole', 'timeline'],
  },

  mitigation_strategy: {
    name: 'Mitigation Strategy Advisor',
    description: 'Develop mitigation strategy for high-impact automation',
    template: `Develop a mitigation strategy for high-impact AI automation.

Impact Level: {impactLevel}
Jobs Affected: {jobsAffected}
Department: {department}
Business Goal: {businessGoal}

Provide:
1. Phased implementation plan
2. Human-AI collaboration model
3. Role transition paths
4. Communication strategy
5. Success metrics`,
    variables: ['impactLevel', 'jobsAffected', 'department', 'businessGoal'],
  },
};

// ============================================================================
// SEARCH & RETRIEVAL
// ============================================================================

export async function searchKnowledge(
  projectId: string,
  options: { query: string; category?: Category; limit?: number }
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

export function getPromptTemplate(templateId: string): PromptTemplate | null {
  return PROMPT_TEMPLATES[templateId] ?? null;
}

export function fillPromptTemplate(templateId: string, variables: Record<string, string>): string | null {
  const template = PROMPT_TEMPLATES[templateId];
  if (!template) return null;

  let filled = template.template;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return filled;
}
