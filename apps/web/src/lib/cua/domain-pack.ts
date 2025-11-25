/**
 * CUA Domain Pack
 *
 * Implements pack-cua-001 §3.1 (CUA Domain Pack).
 * Provides computer-using agent knowledge, patterns, and guidance for RAG.
 *
 * Features:
 * - Agent architecture documentation
 * - Workflow patterns
 * - RL training guidance
 * - Security best practices
 *
 * @see pack-cua-001 for domain mapping
 */

import { db } from '@/lib/db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { cuaKnowledge, type CuaKnowledge } from '@/db/schema/cua';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'concept'
  | 'pattern'
  | 'api'
  | 'tutorial'
  | 'troubleshooting'
  | 'security'
  | 'optimization'
  | 'integration';

export type Category =
  | 'fundamentals'
  | 'workflow'
  | 'rl'
  | 'multi_agent'
  | 'privacy'
  | 'testing'
  | 'advanced';

export interface KnowledgeQuery {
  query: string;
  categories?: Category[];
  documentTypes?: DocumentType[];
  limit?: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'automation' | 'troubleshooting' | 'optimization' | 'security';
}

// ============================================================================
// CORE KNOWLEDGE BASE
// ============================================================================

/**
 * Foundational CUA knowledge documents
 */
export const CORE_KNOWLEDGE: Array<Omit<CuaKnowledge, 'id' | 'createdAt' | 'updatedAt'>> = [
  // Fundamentals
  {
    documentType: 'concept',
    title: 'Computer-Using Agents Overview',
    content: `Computer-Using Agents (CUAs) are AI systems that interact with computers like humans—observing screens, clicking buttons, typing text, and navigating interfaces.

**Core Components:**
- **Observer**: Captures screen state (screenshots, DOM)
- **Reasoner**: LLM/RL model deciding actions
- **Actor**: Executes actions (clicks, types, scrolls)
- **Memory**: Tracks context and history

**Observation Methods:**
- **Screenshot**: Visual capture, works universally
- **DOM Access**: Structured HTML, faster but web-only
- **Hybrid**: Combines both for accuracy

**Action Types:**
- Navigation (go to URL)
- Click (buttons, links, coordinates)
- Type (form inputs, text fields)
- Scroll (page, element)
- Extract (data from page)
- Wait (time, element, condition)

**Use Cases:**
- Web scraping and data extraction
- Form filling and data entry
- UI testing and validation
- Workflow automation
- Monitoring and alerting`,
    category: 'fundamentals',
    topics: ['overview', 'architecture', 'basics'],
    tags: ['cua', 'fundamentals', 'overview'],
    sourceRef: 'pack-cua-001 §1',
    metadata: { reliability: 1.0 },
  },
  {
    documentType: 'concept',
    title: 'Agent Model Architecture',
    content: `CUAs use various model architectures for decision-making.

**Cloud Models (API-based):**
- **GPT-4V/GPT-4o**: Strong vision, good reasoning
- **Claude 3**: Excellent instruction following
- **Gemini Pro Vision**: Fast, cost-effective

**Local Models:**
- **Fara-7B**: Privacy-preserving, runs on consumer GPU
- **LLaVA**: Open-source vision-language model
- **Qwen-VL**: Strong Chinese language support

**Architecture Patterns:**

1. **ReAct (Reasoning + Acting)**
   - Observation → Thought → Action loop
   - Explicit reasoning traces
   - Good for debugging

2. **Vision-Action**
   - Direct screenshot → action mapping
   - Faster but less interpretable
   - Better for simple tasks

3. **Hierarchical**
   - High-level planner + low-level executor
   - Complex multi-step tasks
   - Requires more coordination

**Model Selection Criteria:**
- Task complexity (simple → complex)
- Privacy requirements (cloud vs local)
- Speed requirements (latency constraints)
- Cost constraints (API costs)
- Accuracy requirements (success rate)`,
    category: 'fundamentals',
    topics: ['models', 'architecture', 'selection'],
    tags: ['models', 'llm', 'architecture'],
    sourceRef: 'pack-cua-001 §2',
    metadata: { reliability: 0.95 },
  },

  // Workflow patterns
  {
    documentType: 'pattern',
    title: 'Web Scraping Workflow Pattern',
    content: `Standard pattern for extracting data from websites.

**Steps:**
1. Navigate to target URL
2. Wait for page load
3. Handle any popups/modals
4. Locate target elements
5. Extract data
6. Handle pagination (if needed)
7. Store/return results

**Best Practices:**
- Use stable selectors (data attributes > classes)
- Add waits between actions
- Handle dynamic content loading
- Implement retry logic
- Respect rate limits
- Check robots.txt compliance

**Error Handling:**
- Element not found → retry with wait
- Page timeout → reload and retry
- CAPTCHA → notify human or use solving service
- Block detected → rotate IP/proxy

**Example Configuration:**
\`\`\`json
{
  "workflow": {
    "type": "scraping",
    "target": "https://example.com/products",
    "steps": [
      { "type": "navigate", "url": "{{targetUrl}}" },
      { "type": "wait", "waitType": "element", "selector": ".products" },
      { "type": "extract", "selector": ".product-card", "fields": ["name", "price"] }
    ],
    "pagination": {
      "type": "click",
      "selector": ".next-page",
      "maxPages": 10
    }
  }
}
\`\`\``,
    category: 'workflow',
    topics: ['scraping', 'extraction', 'pattern'],
    tags: ['scraping', 'workflow', 'pattern'],
    sourceRef: 'pack-cua-001 §3',
    codeExamples: [
      {
        language: 'typescript',
        code: `const scrapingWorkflow = {
  name: 'Product Scraper',
  steps: [
    { type: 'navigate', config: { url: '{{targetUrl}}' } },
    { type: 'wait', config: { waitType: 'element', waitSelector: '.products' } },
    { type: 'extract', config: {
      extractType: 'text',
      extractSelector: '.product-card .price',
      extractVariableName: 'prices'
    }},
  ]
};`,
        description: 'Basic scraping workflow definition',
      },
    ],
    metadata: { reliability: 0.9 },
  },
  {
    documentType: 'pattern',
    title: 'Form Automation Pattern',
    content: `Standard pattern for filling and submitting web forms.

**Steps:**
1. Navigate to form page
2. Wait for form to load
3. Clear any existing values
4. Fill each field in order
5. Handle special inputs (dropdowns, checkboxes, file uploads)
6. Validate form before submit
7. Submit form
8. Handle response/confirmation

**Field Type Handling:**

- **Text Input**: Direct typing
- **Dropdown**: Click to open, select option
- **Checkbox/Radio**: Click to toggle
- **Date Picker**: May need to interact with calendar
- **File Upload**: Trigger file dialog or drag-drop
- **CAPTCHA**: Human intervention or solving API

**Validation:**
- Check required fields filled
- Verify format (email, phone, etc.)
- Check for error messages
- Screenshot before submit

**Error Recovery:**
- Validation error → correct and retry
- Submit timeout → wait and retry
- Session expired → re-authenticate
- Duplicate submission → check for confirmation`,
    category: 'workflow',
    topics: ['forms', 'automation', 'pattern'],
    tags: ['forms', 'workflow', 'pattern'],
    sourceRef: 'pack-cua-001 §4',
    metadata: { reliability: 0.9 },
  },

  // RL Training
  {
    documentType: 'tutorial',
    title: 'Reinforcement Learning for CUAs',
    content: `Guide to training CUAs with reinforcement learning.

**Why RL?**
- Improves task completion rates
- Adapts to specific UI patterns
- Learns efficient action sequences
- Handles edge cases better

**Training Approaches:**

1. **Imitation Learning**
   - Learn from human demonstrations
   - Lower sample complexity
   - Limited by demonstration quality

2. **Reward Shaping**
   - Define rewards for desired outcomes
   - Success reward (task complete)
   - Step penalty (efficiency)
   - Error penalty (failed actions)

3. **Curriculum Learning**
   - Start with easy tasks
   - Gradually increase difficulty
   - Prevents early failure modes

**WebRL Pipeline:**
\`\`\`
1. Collect demonstrations
2. Pre-train on imitation
3. Define reward function
4. Run RL episodes
5. Evaluate on held-out tasks
6. Fine-tune based on failures
\`\`\`

**Reward Function Example:**
- +100: Task completed successfully
- +10: Sub-goal achieved
- -1: Each action (efficiency pressure)
- -10: Invalid action attempted
- -50: Task failed

**Training Tips:**
- Start with diverse demonstrations
- Use curriculum of increasing difficulty
- Monitor for reward hacking
- Regular evaluation checkpoints
- Balance exploration vs exploitation`,
    category: 'rl',
    topics: ['reinforcement-learning', 'training', 'optimization'],
    tags: ['rl', 'training', 'webrl'],
    sourceRef: 'pack-cua-001 §5',
    metadata: { reliability: 0.85 },
  },

  // Multi-agent
  {
    documentType: 'pattern',
    title: 'Multi-Agent Coordination Patterns',
    content: `Patterns for coordinating multiple CUAs on complex tasks.

**Coordination Types:**

1. **Sequential (Pipeline)**
   - Agent A completes, passes to Agent B
   - Simple, easy to debug
   - Slower but reliable

2. **Parallel**
   - Multiple agents work simultaneously
   - Faster for independent subtasks
   - Requires result aggregation

3. **Hierarchical**
   - Manager agent coordinates workers
   - Good for complex decomposition
   - Higher overhead

**Communication Protocols:**

- **Event Bus**: Async message passing
- **Shared State**: Common data store
- **Direct**: Point-to-point messages

**Role Specialization:**
- **Scraper**: Data extraction expert
- **Navigator**: Page traversal specialist
- **Form Filler**: Input handling expert
- **Validator**: Quality checker
- **Coordinator**: Orchestrates others

**Example: TCG Price Analysis**
\`\`\`
Agent 1 (Scraper): Extract prices from Site A
Agent 2 (Scraper): Extract prices from Site B
Agent 3 (Analyzer): Compare and identify arbitrage
Agent 4 (Reporter): Generate summary report
\`\`\`

**Failure Handling:**
- Agent timeout → reassign to backup
- Task failure → retry or escalate
- Coordination failure → rollback partial work`,
    category: 'multi_agent',
    topics: ['coordination', 'multi-agent', 'orchestration'],
    tags: ['multi-agent', 'coordination', 'pattern'],
    sourceRef: 'pack-cua-001 §6',
    metadata: { reliability: 0.9 },
  },

  // Privacy
  {
    documentType: 'security',
    title: 'Privacy-Preserving Automation',
    content: `Best practices for secure, private CUA operation.

**Privacy Concerns:**
- Screenshots may contain sensitive data
- Credentials in form fields
- PII in extracted data
- Session tokens/cookies

**Mitigation Strategies:**

1. **Local Processing**
   - Use local models (Fara-7B)
   - No data leaves device
   - Higher resource requirements

2. **Data Minimization**
   - Extract only needed data
   - Immediate processing, no storage
   - Mask sensitive fields in screenshots

3. **Encryption**
   - Encrypt screenshots at rest
   - Secure credential storage
   - TLS for all communications

4. **Access Control**
   - Principle of least privilege
   - Sandbox browser instances
   - Network isolation

**Credential Handling:**
- Never log credentials
- Use secure vaults (e.g., HashiCorp Vault)
- Rotate after automation
- Audit access logs

**Compliance Considerations:**
- GDPR: Data minimization, right to erasure
- CCPA: Disclosure requirements
- HIPAA: Healthcare data protection
- PCI-DSS: Payment card security

**Audit Logging:**
- Log actions without sensitive data
- Retain for compliance period
- Secure log storage`,
    category: 'privacy',
    topics: ['privacy', 'security', 'compliance'],
    tags: ['privacy', 'security', 'local'],
    sourceRef: 'pack-cua-001 §7',
    metadata: { reliability: 1.0 },
  },

  // Testing
  {
    documentType: 'tutorial',
    title: 'Automated UI Testing with CUAs',
    content: `Using CUAs for comprehensive UI testing.

**Test Types:**

1. **Functional Tests**
   - Verify features work correctly
   - Click buttons, fill forms, check results

2. **Visual Regression**
   - Compare screenshots across versions
   - Detect unintended UI changes

3. **Accessibility Tests**
   - Check ARIA labels
   - Keyboard navigation
   - Screen reader compatibility

4. **Performance Tests**
   - Page load times
   - Interaction latency
   - Resource usage

**Test Structure:**
\`\`\`
describe('Login Flow', () => {
  it('should login with valid credentials', async () => {
    await agent.navigate('/login');
    await agent.type('#email', 'user@example.com');
    await agent.type('#password', 'password');
    await agent.click('#submit');
    await agent.waitFor('.dashboard');
    expect(await agent.getCurrentUrl()).toContain('/dashboard');
  });
});
\`\`\`

**Best Practices:**
- Isolate tests (fresh session each)
- Use test data, not production
- Clean up after tests
- Parallelize independent tests
- Capture screenshots on failure

**CI/CD Integration:**
- Run on every PR
- Block merge on failures
- Report with screenshots
- Track flaky tests`,
    category: 'testing',
    topics: ['testing', 'qa', 'automation'],
    tags: ['testing', 'ui-testing', 'qa'],
    sourceRef: 'pack-cua-001 §8',
    codeExamples: [
      {
        language: 'typescript',
        code: `const testWorkflow = {
  name: 'Login Test',
  steps: [
    { type: 'navigate', config: { url: '/login' } },
    { type: 'type', config: { selector: '#email', text: 'test@example.com' } },
    { type: 'type', config: { selector: '#password', text: 'testpass' } },
    { type: 'click', config: { selector: '#submit' } },
    { type: 'wait', config: { waitType: 'element', waitSelector: '.dashboard' } },
    { type: 'extract', config: {
      extractType: 'text',
      extractSelector: '.welcome-message',
      extractVariableName: 'welcomeText'
    }},
  ]
};`,
        description: 'Login test workflow',
      },
    ],
    metadata: { reliability: 0.9 },
  },

  // Troubleshooting
  {
    documentType: 'troubleshooting',
    title: 'Common CUA Issues and Solutions',
    content: `Troubleshooting guide for common CUA problems.

**Element Not Found**
- *Cause*: Selector changed, element not loaded
- *Fix*: Add wait, update selector, use AI selector

**Click Not Working**
- *Cause*: Element obscured, coordinates wrong
- *Fix*: Scroll into view, close modals, use JS click

**Typing Issues**
- *Cause*: Input not focused, special chars
- *Fix*: Click to focus first, handle escaping

**Page Load Timeout**
- *Cause*: Slow network, heavy page
- *Fix*: Increase timeout, wait for specific element

**Session Expired**
- *Cause*: Long-running task, cookies cleared
- *Fix*: Re-authenticate, persist session

**CAPTCHA Blocking**
- *Cause*: Bot detection triggered
- *Fix*: Add delays, use residential proxies, solving service

**Dynamic Content Missing**
- *Cause*: JavaScript not executed
- *Fix*: Wait for AJAX, use hybrid observation

**Memory Issues**
- *Cause*: Screenshots accumulating
- *Fix*: Clear old screenshots, reduce quality

**Performance Degradation**
- *Cause*: Too many actions, no cleanup
- *Fix*: Batch operations, close unused tabs`,
    category: 'fundamentals',
    topics: ['troubleshooting', 'debugging', 'issues'],
    tags: ['troubleshooting', 'debugging', 'common-issues'],
    sourceRef: 'pack-cua-001 §9',
    metadata: { reliability: 0.95 },
  },
];

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'automation-task',
    name: 'Automation Task Design',
    description: 'Design an automation workflow for a given task',
    template: `Design an automation workflow for the following task:

**Task Description:**
{{taskDescription}}

**Target System:**
{{targetSystem}}

**Expected Output:**
{{expectedOutput}}

Provide:
1. Step-by-step workflow
2. Required selectors/identifiers
3. Error handling strategy
4. Estimated execution time`,
    variables: ['taskDescription', 'targetSystem', 'expectedOutput'],
    category: 'automation',
  },
  {
    id: 'troubleshoot-failure',
    name: 'Troubleshoot Execution Failure',
    description: 'Diagnose and fix CUA execution failures',
    template: `Troubleshoot the following CUA execution failure:

**Workflow:**
{{workflowName}}

**Failed Step:**
{{failedStep}}

**Error Message:**
{{errorMessage}}

**Screenshot (if available):**
{{screenshotDescription}}

**What was attempted:**
{{attemptedFixes}}

Diagnose the issue and provide solutions.`,
    variables: ['workflowName', 'failedStep', 'errorMessage', 'screenshotDescription', 'attemptedFixes'],
    category: 'troubleshooting',
  },
  {
    id: 'optimize-workflow',
    name: 'Optimize Workflow Performance',
    description: 'Improve workflow speed and reliability',
    template: `Optimize the following workflow for better performance:

**Current Workflow:**
{{workflowDefinition}}

**Current Metrics:**
- Avg Duration: {{avgDuration}}
- Success Rate: {{successRate}}
- Actions/Task: {{actionsPerTask}}

**Constraints:**
{{constraints}}

Provide optimization recommendations.`,
    variables: ['workflowDefinition', 'avgDuration', 'successRate', 'actionsPerTask', 'constraints'],
    category: 'optimization',
  },
  {
    id: 'security-review',
    name: 'Security Review Workflow',
    description: 'Review workflow for security concerns',
    template: `Review the following workflow for security concerns:

**Workflow:**
{{workflowDefinition}}

**Data Handled:**
{{dataTypes}}

**Target Domains:**
{{targetDomains}}

**Compliance Requirements:**
{{complianceReqs}}

Identify security risks and provide mitigations.`,
    variables: ['workflowDefinition', 'dataTypes', 'targetDomains', 'complianceReqs'],
    category: 'security',
  },
];

// ============================================================================
// KNOWLEDGE RETRIEVAL
// ============================================================================

/**
 * Initialize knowledge base with core documents
 */
export async function initializeCuaKnowledge(): Promise<number> {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cuaKnowledge)
    .execute();

  if (existing.count > 0) {
    return existing.count;
  }

  await db.insert(cuaKnowledge).values(CORE_KNOWLEDGE).execute();

  return CORE_KNOWLEDGE.length;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(query: KnowledgeQuery): Promise<CuaKnowledge[]> {
  const { categories, documentTypes, limit = 10 } = query;

  const conditions = [];

  if (categories && categories.length > 0) {
    conditions.push(inArray(cuaKnowledge.category, categories));
  }

  if (documentTypes && documentTypes.length > 0) {
    conditions.push(inArray(cuaKnowledge.documentType, documentTypes));
  }

  const results = await db
    .select()
    .from(cuaKnowledge)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .execute();

  // Simple keyword scoring
  const queryWords = query.query.toLowerCase().split(/\s+/);
  const scored = results.map((doc) => {
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    const score = queryWords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
    return { doc, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.doc);
}

/**
 * Get knowledge by category
 */
export async function getKnowledgeByCategory(
  category: Category,
  limit: number = 20
): Promise<CuaKnowledge[]> {
  return db
    .select()
    .from(cuaKnowledge)
    .where(eq(cuaKnowledge.category, category))
    .limit(limit)
    .execute();
}

/**
 * Get knowledge by document type
 */
export async function getKnowledgeByType(
  documentType: DocumentType,
  limit: number = 20
): Promise<CuaKnowledge[]> {
  return db
    .select()
    .from(cuaKnowledge)
    .where(eq(cuaKnowledge.documentType, documentType))
    .limit(limit)
    .execute();
}

/**
 * Get prompt template by ID
 */
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Fill prompt template with variables
 */
export function fillPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let result = template.template;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return result;
}

/**
 * Generate context-aware prompt for CUA task
 */
export async function generateCuaPrompt(
  task: string,
  context: {
    category?: Category;
    workflowType?: string;
    additionalContext?: string;
  }
): Promise<string> {
  const relevantDocs = await searchKnowledge({
    query: task,
    categories: context.category ? [context.category] : undefined,
    limit: 3,
  });

  const knowledgeContext = relevantDocs
    .map((doc) => `### ${doc.title}\n${doc.content.slice(0, 500)}...`)
    .join('\n\n');

  return `You are an expert in Computer-Using Agents and GUI automation.

## Relevant Knowledge
${knowledgeContext}

## Task Context
- Category: ${context.category ?? 'General'}
- Workflow Type: ${context.workflowType ?? 'Not specified'}
${context.additionalContext ? `- Additional: ${context.additionalContext}` : ''}

## Task
${task}

Provide a detailed, actionable response with code examples where applicable.`;
}
