/**
 * Mobile Performance Knowledge API
 *
 * Endpoints for RAG knowledge base and prompt generation.
 * Implements knowledge-08-mobile-performance domain pack.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeMobileKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getKnowledgeByType,
  getPromptTemplate,
  fillPromptTemplate,
  generateMobilePerfPrompt,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
} from '@/lib/mobile-perf';

/**
 * GET /api/mobile-perf/knowledge
 *
 * Search and retrieve mobile performance knowledge
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'search';
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const platform = searchParams.get('platform') as 'ios' | 'android' | 'both' | null;
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
          category: category as any,
          documentType: type as any,
          platform: platform ?? undefined,
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

        const documents = await getKnowledgeByCategory(category as any);
        return NextResponse.json({ documents });
      }

      case 'by-type': {
        if (!type) {
          return NextResponse.json(
            { error: 'Missing required parameter: type' },
            { status: 400 }
          );
        }

        const documents = await getKnowledgeByType(type as any);
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
          title: doc.title,
          documentType: doc.documentType,
          category: doc.category,
          platform: doc.platform,
          tags: doc.tags,
        }));
        return NextResponse.json({ knowledge });
      }

      case 'categories': {
        const categories = [
          { id: 'list_optimization', name: 'List Optimization', description: 'FlatList and SectionList performance' },
          { id: 'render_prevention', name: 'Render Prevention', description: 'React.memo, useMemo, useCallback' },
          { id: 'bridge', name: 'Bridge Optimization', description: 'JS-Native bridge patterns' },
          { id: 'hermes', name: 'Hermes Engine', description: 'Hermes configuration and tuning' },
          { id: 'offline', name: 'Offline Mode', description: 'Offline-first architecture' },
          { id: 'images', name: 'Image Optimization', description: 'Image caching and loading' },
          { id: 'memory', name: 'Memory Management', description: 'Memory leaks and cleanup' },
          { id: 'profiling', name: 'Profiling', description: 'Performance profiling tools' },
        ];
        return NextResponse.json({ categories });
      }

      default:
        return NextResponse.json(
          {
            error: `Invalid action: ${action}. Valid actions: search, by-category, by-type, templates, template, core-knowledge, categories`,
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
 * POST /api/mobile-perf/knowledge
 *
 * Initialize knowledge base and generate prompts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action ?? 'generate-prompt';

    switch (action) {
      case 'initialize': {
        const result = await initializeMobileKnowledge();
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

        const prompt = await generateMobilePerfPrompt(body.task, {
          platform: body.platform,
          deviceTier: body.deviceTier,
          category: body.category,
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
