/**
 * CUA Knowledge API
 *
 * Endpoints for querying Computer-Using Agents knowledge base.
 * Implements pack-cua-001 §3.1 (CUA Domain Pack).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeCuaKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getKnowledgeByType,
  getPromptTemplate,
  fillPromptTemplate,
  generateCuaPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type Category,
  type DocumentType,
} from '@/lib/cua';

/**
 * GET /api/cua/knowledge
 *
 * Query CUA knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'search';
    const query = searchParams.get('query') ?? '';
    const category = searchParams.get('category') as Category | undefined;
    const documentType = searchParams.get('documentType') as DocumentType | undefined;
    const templateId = searchParams.get('templateId');
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    switch (action) {
      case 'search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Missing required parameter: query' },
            { status: 400 }
          );
        }

        const categories = category ? [category] : undefined;
        const documentTypes = documentType ? [documentType] : undefined;

        const results = await searchKnowledge({
          query,
          categories,
          documentTypes,
          limit,
        });

        return NextResponse.json({ results });
      }

      case 'by-category': {
        if (!category) {
          return NextResponse.json(
            { error: 'Missing required parameter: category' },
            { status: 400 }
          );
        }

        const results = await getKnowledgeByCategory(category, limit);
        return NextResponse.json({ results });
      }

      case 'by-type': {
        if (!documentType) {
          return NextResponse.json(
            { error: 'Missing required parameter: documentType' },
            { status: 400 }
          );
        }

        const results = await getKnowledgeByType(documentType, limit);
        return NextResponse.json({ results });
      }

      case 'templates': {
        return NextResponse.json({ templates: PROMPT_TEMPLATES });
      }

      case 'template': {
        if (!templateId) {
          return NextResponse.json(
            { error: 'Missing required parameter: templateId' },
            { status: 400 }
          );
        }

        const template = getPromptTemplate(templateId);
        if (!template) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ template });
      }

      case 'categories': {
        const categories = [
          'fundamentals',
          'workflow',
          'rl',
          'multi_agent',
          'privacy',
          'testing',
          'advanced',
        ];
        return NextResponse.json({ categories });
      }

      case 'document-types': {
        const documentTypes = [
          'concept',
          'pattern',
          'api',
          'tutorial',
          'troubleshooting',
          'security',
          'optimization',
          'integration',
        ];
        return NextResponse.json({ documentTypes });
      }

      case 'core-documents': {
        // Return titles and metadata of core documents
        const coreDocs = CORE_KNOWLEDGE.map((doc) => ({
          title: doc.title,
          documentType: doc.documentType,
          category: doc.category,
          topics: doc.topics,
          tags: doc.tags,
        }));
        return NextResponse.json({ documents: coreDocs });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: search, by-category, by-type, templates, template, categories, document-types, core-documents`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error querying CUA knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to query knowledge' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cua/knowledge
 *
 * Initialize knowledge or generate prompts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'generate-prompt';

    switch (action) {
      case 'initialize': {
        const count = await initializeCuaKnowledge();
        return NextResponse.json({
          success: true,
          documentCount: count,
          message: `Knowledge base initialized with ${count} documents`,
        });
      }

      case 'generate-prompt': {
        if (!body.task) {
          return NextResponse.json(
            { error: 'Missing required field: task' },
            { status: 400 }
          );
        }

        const prompt = await generateCuaPrompt(body.task, {
          category: body.category,
          workflowType: body.workflowType,
          additionalContext: body.additionalContext,
        });

        return NextResponse.json({ prompt });
      }

      case 'fill-template': {
        if (!body.templateId || !body.variables) {
          return NextResponse.json(
            { error: 'Missing required fields: templateId, variables' },
            { status: 400 }
          );
        }

        const template = getPromptTemplate(body.templateId);
        if (!template) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          );
        }

        const filled = fillPromptTemplate(template, body.variables);
        return NextResponse.json({ prompt: filled, template });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: initialize, generate-prompt, fill-template`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing CUA knowledge request:', error);
    return NextResponse.json(
      { error: 'Failed to process knowledge request' },
      { status: 500 }
    );
  }
}
