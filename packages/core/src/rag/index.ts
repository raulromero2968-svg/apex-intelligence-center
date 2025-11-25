/**
 * @apex/core/rag
 *
 * RAG (Retrieval-Augmented Generation) primitives for knowledge management.
 * Supports domain-specific knowledge packs with semantic search.
 */

// ============================================================================
// TYPES
// ============================================================================

export type DocumentCategory =
  | 'ethics'
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'compliance'
  | 'architecture'
  | 'operations'
  | 'integration';

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: DocumentCategory;
  tags: string[];
  metadata: {
    source: string;
    version: string;
    lastUpdated: Date;
    author?: string;
    confidence: number;
  };
  embedding?: number[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: DocumentCategory;
  systemContext?: string;
}

export interface SearchResult {
  document: KnowledgeDocument;
  score: number;
  highlights: string[];
}

export interface RAGConfig {
  maxResults: number;
  minScore: number;
  includeMetadata: boolean;
  categories?: DocumentCategory[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_RAG_CONFIG: RAGConfig = {
  maxResults: 5,
  minScore: 0.5,
  includeMetadata: true,
};

export const CATEGORY_WEIGHTS: Record<DocumentCategory, number> = {
  ethics: 1.2,
  security: 1.1,
  compliance: 1.1,
  performance: 1.0,
  accessibility: 1.0,
  architecture: 0.9,
  operations: 0.9,
  integration: 0.8,
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Simple keyword-based search (use with vector DB in production)
 */
export function searchKnowledge(
  query: string,
  documents: KnowledgeDocument[],
  config: Partial<RAGConfig> = {}
): SearchResult[] {
  const { maxResults, minScore, categories } = { ...DEFAULT_RAG_CONFIG, ...config };

  const queryTerms = query.toLowerCase().split(/\s+/);

  const results = documents
    .filter((doc) => !categories || categories.includes(doc.category))
    .map((doc) => {
      const contentLower = doc.content.toLowerCase();
      const titleLower = doc.title.toLowerCase();

      // Calculate relevance score
      let score = 0;
      const highlights: string[] = [];

      for (const term of queryTerms) {
        if (titleLower.includes(term)) {
          score += 0.3;
          highlights.push(doc.title);
        }
        if (contentLower.includes(term)) {
          score += 0.2;
          // Extract highlight context
          const idx = contentLower.indexOf(term);
          const start = Math.max(0, idx - 50);
          const end = Math.min(doc.content.length, idx + term.length + 50);
          highlights.push(doc.content.slice(start, end));
        }
        if (doc.tags.some((tag) => tag.toLowerCase().includes(term))) {
          score += 0.15;
        }
      }

      // Apply category weight
      score *= CATEGORY_WEIGHTS[doc.category] || 1;

      // Apply confidence modifier
      score *= doc.metadata.confidence;

      return { document: doc, score, highlights };
    })
    .filter((result) => result.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return results;
}

/**
 * Fill prompt template with variables
 */
export function fillTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let filled = template.template;

  for (const varName of template.variables) {
    const value = variables[varName];
    if (value !== undefined) {
      filled = filled.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
    }
  }

  return filled;
}

/**
 * Create knowledge document
 */
export function createDocument(
  title: string,
  content: string,
  category: DocumentCategory,
  options: {
    tags?: string[];
    source?: string;
    author?: string;
    confidence?: number;
  } = {}
): KnowledgeDocument {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    content,
    category,
    tags: options.tags || [],
    metadata: {
      source: options.source || 'manual',
      version: '1.0.0',
      lastUpdated: new Date(),
      author: options.author,
      confidence: options.confidence ?? 0.8,
    },
  };
}

/**
 * Create prompt template
 */
export function createTemplate(
  name: string,
  template: string,
  category: DocumentCategory,
  systemContext?: string
): PromptTemplate {
  // Extract variables from template ({{varName}} format)
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return {
    id: `template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    template,
    variables,
    category,
    systemContext,
  };
}

/**
 * Combine search results with prompt
 */
export function augmentPrompt(
  userQuery: string,
  searchResults: SearchResult[],
  systemPrompt?: string
): string {
  const context = searchResults
    .map((r) => `[${r.document.title}]\n${r.document.content}`)
    .join('\n\n---\n\n');

  const parts: string[] = [];

  if (systemPrompt) {
    parts.push(systemPrompt);
  }

  parts.push(`Relevant Knowledge:\n${context}`);
  parts.push(`User Query: ${userQuery}`);

  return parts.join('\n\n');
}
