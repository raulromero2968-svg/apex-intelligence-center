/**
 * WebXR Knowledge API
 *
 * Endpoints for RAG knowledge base and prompt generation.
 * Implements pack-webxr-001 §4 (Domain Pack Integration).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeWebxrKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getKnowledgeByType,
  getPromptTemplate,
  fillPromptTemplate,
  generateWebxrPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
} from '@/lib/webxr';

/**
 * GET /api/webxr/knowledge
 *
 * Search and retrieve WebXR knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'search';
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
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

        const results = await searchKnowledge({
          query,
          category: category as 'api' | 'rendering' | 'input' | 'performance' | 'troubleshooting' | undefined,
          documentType: type as 'concept' | 'api_reference' | 'code_example' | 'best_practice' | 'troubleshooting' | undefined,
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

        const documents = await getKnowledgeByCategory(
          category as 'api' | 'rendering' | 'input' | 'performance' | 'troubleshooting'
        );
        return NextResponse.json({ documents });
      }

      case 'by-type': {
        if (!type) {
          return NextResponse.json(
            { error: 'Missing required parameter: type' },
            { status: 400 }
          );
        }

        const documents = await getKnowledgeByType(
          type as 'concept' | 'api_reference' | 'code_example' | 'best_practice' | 'troubleshooting'
        );
        return NextResponse.json({ documents });
      }

      case 'templates': {
        const templates = Object.entries(PROMPT_TEMPLATES).map(([id, template]) => ({
          id,
          name: template.name,
          description: template.description,
          variables: template.variables,
        }));
        return NextResponse.json({ templates });
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
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ template });
      }

      case 'core-knowledge': {
        const knowledge = CORE_KNOWLEDGE.map((doc) => ({
          id: doc.id,
          title: doc.title,
          documentType: doc.documentType,
          category: doc.category,
          tags: doc.tags,
        }));
        return NextResponse.json({ knowledge });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: search, by-category, by-type, templates, template, core-knowledge`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
  }
}

/**
 * POST /api/webxr/knowledge
 *
 * Initialize knowledge base and generate prompts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'generate-prompt';

    switch (action) {
      case 'initialize': {
        const result = await initializeWebxrKnowledge();
        return NextResponse.json({
          success: true,
          documentsLoaded: result.documentsLoaded,
        });
      }

      case 'generate-prompt': {
        if (!body.task) {
          return NextResponse.json(
            { error: 'Missing required field: task' },
            { status: 400 }
          );
        }

        const prompt = await generateWebxrPrompt(body.task, {
          deviceType: body.deviceType,
          sessionType: body.sessionType,
          engine: body.engine,
          features: body.features,
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

        const filledPrompt = fillPromptTemplate(body.templateId, body.variables);
        if (!filledPrompt) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ prompt: filledPrompt });
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
    console.error('Error processing knowledge request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
