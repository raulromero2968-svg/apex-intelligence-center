/**
 * Database Knowledge API Routes
 *
 * Endpoints for RAG-based database knowledge queries.
 * Implements knowledge-09-database-architecture domain pack API.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initializeDbKnowledge,
  searchKnowledge,
  getKnowledgeByCategory,
  getPromptTemplate,
  fillPromptTemplate,
  CORE_KNOWLEDGE,
  PROMPT_TEMPLATES,
  type Category,
} from '@/lib/database-arch';

/**
 * POST /api/database-arch/knowledge
 * Initialize knowledge base or search for knowledge
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, query, category, limit, templateId, variables } = body;

    switch (action) {
      case 'initialize': {
        if (!projectId) {
          return NextResponse.json(
            { error: 'Missing required field: projectId' },
            { status: 400 }
          );
        }

        const count = await initializeDbKnowledge(projectId);

        return NextResponse.json({
          success: true,
          initialized: count,
          message: `Initialized ${count} knowledge documents`,
        });
      }

      case 'search': {
        if (!projectId || !query) {
          return NextResponse.json(
            { error: 'Missing required fields: projectId, query' },
            { status: 400 }
          );
        }

        const results = await searchKnowledge(projectId, {
          query,
          category: category as Category | undefined,
          limit: limit ?? 5,
        });

        return NextResponse.json({
          success: true,
          count: results.length,
          results,
        });
      }

      case 'category': {
        if (!projectId || !category) {
          return NextResponse.json(
            { error: 'Missing required fields: projectId, category' },
            { status: 400 }
          );
        }

        const results = await getKnowledgeByCategory(projectId, category as Category);

        return NextResponse.json({
          success: true,
          count: results.length,
          category,
          results,
        });
      }

      case 'fill-template': {
        if (!templateId || !variables) {
          return NextResponse.json(
            { error: 'Missing required fields: templateId, variables' },
            { status: 400 }
          );
        }

        const filled = fillPromptTemplate(templateId, variables);

        if (!filled) {
          return NextResponse.json(
            { error: 'Template not found or missing variables' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          prompt: filled,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: initialize, search, category, or fill-template' },
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

/**
 * GET /api/database-arch/knowledge
 * Get knowledge templates and prompts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const templateId = searchParams.get('templateId');

    switch (type) {
      case 'documents': {
        // Return core knowledge document metadata
        const documents = CORE_KNOWLEDGE.map((doc) => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          type: doc.type,
          tags: doc.tags,
        }));

        return NextResponse.json({
          success: true,
          count: documents.length,
          documents,
        });
      }

      case 'templates': {
        // Return available prompt templates
        const templates = Object.entries(PROMPT_TEMPLATES).map(([id, template]) => ({
          id,
          name: template.name,
          description: template.description,
          variables: template.variables,
        }));

        return NextResponse.json({
          success: true,
          count: templates.length,
          templates,
        });
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

        return NextResponse.json({
          success: true,
          template,
        });
      }

      case 'categories': {
        // Return available categories
        const categories = [...new Set(CORE_KNOWLEDGE.map((doc) => doc.category))];

        return NextResponse.json({
          success: true,
          categories,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: documents, templates, template, or categories' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
      { status: 500 }
    );
  }
}
