/**
 * visionOS Knowledge API
 *
 * Endpoints for RAG knowledge base and prompt generation.
 * Implements pack-visionos-001 §3.1 (VisionOS Domain Pack).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeVisionOSKnowledge,
  searchKnowledge,
  getKnowledgeByFramework,
  getKnowledgeByType,
  getPortingGuides,
  getTroubleshootingGuides,
  getPromptTemplate,
  fillPromptTemplate,
  generateVisionOSPrompt,
  PROMPT_TEMPLATES,
  type Framework,
  type DocumentType,
} from '@/lib/visionos';

/**
 * GET /api/visionos/knowledge
 *
 * Query the visionOS knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'search';
    const query = searchParams.get('query') ?? '';
    const framework = searchParams.get('framework') as Framework | undefined;
    const documentType = searchParams.get('type') as DocumentType | undefined;
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
          frameworks: framework ? [framework] : undefined,
          documentTypes: documentType ? [documentType] : undefined,
          limit,
        });

        return NextResponse.json({ results, count: results.length });
      }

      case 'framework': {
        if (!framework) {
          return NextResponse.json(
            { error: 'Missing required parameter: framework' },
            { status: 400 }
          );
        }

        const results = await getKnowledgeByFramework(framework, limit);
        return NextResponse.json({ results, framework });
      }

      case 'type': {
        if (!documentType) {
          return NextResponse.json(
            { error: 'Missing required parameter: type' },
            { status: 400 }
          );
        }

        const results = await getKnowledgeByType(documentType, limit);
        return NextResponse.json({ results, type: documentType });
      }

      case 'porting': {
        const guides = await getPortingGuides();
        return NextResponse.json({ guides });
      }

      case 'troubleshooting': {
        const guides = await getTroubleshootingGuides();
        return NextResponse.json({ guides });
      }

      case 'templates': {
        return NextResponse.json({
          templates: PROMPT_TEMPLATES.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            variables: t.variables,
          })),
        });
      }

      case 'template': {
        const templateId = searchParams.get('templateId');
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

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: search, framework, type, porting, troubleshooting, templates, template`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error querying knowledge base:', error);
    return NextResponse.json(
      { error: 'Failed to query knowledge base' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visionos/knowledge
 *
 * Generate prompts and initialize knowledge base
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'prompt';

    switch (action) {
      case 'initialize': {
        const count = await initializeVisionOSKnowledge();
        return NextResponse.json({
          success: true,
          documentsLoaded: count,
          message:
            count > 0
              ? 'Knowledge base initialized'
              : 'Knowledge base already populated',
        });
      }

      case 'fill-template': {
        const templateId = body.templateId;
        const variables = body.variables ?? {};

        if (!templateId) {
          return NextResponse.json(
            { error: 'Missing required field: templateId' },
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

        const filled = fillPromptTemplate(template, variables);
        return NextResponse.json({ prompt: filled, template: template.name });
      }

      case 'prompt': {
        const task = body.task;
        if (!task) {
          return NextResponse.json(
            { error: 'Missing required field: task' },
            { status: 400 }
          );
        }

        const prompt = await generateVisionOSPrompt(task, {
          framework: body.framework,
          appType: body.appType,
          additionalContext: body.additionalContext,
        });

        return NextResponse.json({ prompt });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: initialize, fill-template, prompt`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing knowledge request:', error);
    return NextResponse.json(
      { error: 'Failed to process knowledge request' },
      { status: 500 }
    );
  }
}
