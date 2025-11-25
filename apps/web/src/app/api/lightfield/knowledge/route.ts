/**
 * Light Field Knowledge API
 *
 * Endpoints for RAG knowledge base and prompt generation.
 * Implements pack-lfd-001 §5 (Domain Pack).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeLightFieldKnowledge,
  searchKnowledge,
  getKnowledgeByDomain,
  getKnowledgeByType,
  getTroubleshootingGuides,
  getHardwareKnowledge,
  getPromptTemplate,
  fillPromptTemplate,
  generateLightFieldPrompt,
  PROMPT_TEMPLATES,
  type Domain,
  type DocumentType,
} from '@/lib/lightfield';

/**
 * GET /api/lightfield/knowledge
 *
 * Query the light field knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'search';
    const query = searchParams.get('query') ?? '';
    const domain = searchParams.get('domain') as Domain | undefined;
    const documentType = searchParams.get('type') as DocumentType | undefined;
    const displayModel = searchParams.get('displayModel');
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
          domains: domain ? [domain] : undefined,
          documentTypes: documentType ? [documentType] : undefined,
          limit,
        });

        return NextResponse.json({ results, count: results.length });
      }

      case 'domain': {
        if (!domain) {
          return NextResponse.json(
            { error: 'Missing required parameter: domain' },
            { status: 400 }
          );
        }

        const results = await getKnowledgeByDomain(domain, limit);
        return NextResponse.json({ results, domain });
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

      case 'troubleshooting': {
        const guides = await getTroubleshootingGuides();
        return NextResponse.json({ guides });
      }

      case 'hardware': {
        if (!displayModel) {
          return NextResponse.json(
            { error: 'Missing required parameter: displayModel' },
            { status: 400 }
          );
        }

        const knowledge = await getHardwareKnowledge(displayModel);
        return NextResponse.json({ knowledge, displayModel });
      }

      case 'templates': {
        // Return available prompt templates
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
          { error: `Invalid action: ${action}. Valid actions: search, domain, type, troubleshooting, hardware, templates, template` },
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
 * POST /api/lightfield/knowledge
 *
 * Generate prompts and initialize knowledge base
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'prompt';

    switch (action) {
      case 'initialize': {
        // Initialize the knowledge base with core documents
        const count = await initializeLightFieldKnowledge();
        return NextResponse.json({
          success: true,
          documentsLoaded: count,
          message: count > 0 ? 'Knowledge base initialized' : 'Knowledge base already populated',
        });
      }

      case 'fill-template': {
        // Fill a prompt template with variables
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
        // Generate a context-aware prompt for a light field task
        const task = body.task;
        if (!task) {
          return NextResponse.json(
            { error: 'Missing required field: task' },
            { status: 400 }
          );
        }

        const prompt = await generateLightFieldPrompt(task, {
          displayModel: body.displayModel,
          contentType: body.contentType,
          additionalContext: body.additionalContext,
        });

        return NextResponse.json({ prompt });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Valid actions: initialize, fill-template, prompt` },
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
