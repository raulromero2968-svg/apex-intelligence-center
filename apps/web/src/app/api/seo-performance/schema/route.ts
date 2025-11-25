/**
 * Schema Markup API Routes
 *
 * Endpoints for managing JSON-LD structured data schemas.
 * Implements knowledge-07-seo-performance API layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSchemaMarkup,
  getSchemaMarkup,
  getProjectSchemas,
  updateSchemaMarkup,
  deleteSchemaMarkup,
  validateSchema,
  generateJsonLdScript,
  generateNextJsComponent,
  type SchemaType,
  SCHEMA_TEMPLATES,
} from '@/lib/seo-performance';

/**
 * POST /api/seo-performance/schema
 * Create a new schema markup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, schemaType, schemaData, pageUrl } = body;

    if (!projectId || !name || !schemaType || !schemaData) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name, schemaType, schemaData' },
        { status: 400 }
      );
    }

    // Validate schema type
    if (!SCHEMA_TEMPLATES[schemaType as SchemaType]) {
      return NextResponse.json(
        { error: `Invalid schema type: ${schemaType}` },
        { status: 400 }
      );
    }

    const schema = await createSchemaMarkup({
      projectId,
      name,
      schemaType,
      schemaData,
      pageUrl,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      schema,
      jsonLd: generateJsonLdScript(schemaData),
    });
  } catch (error) {
    console.error('Error creating schema:', error);
    return NextResponse.json(
      { error: 'Failed to create schema' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seo-performance/schema
 * Get schema(s) by ID or project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schemaId = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const templates = searchParams.get('templates') === 'true';

    // Return templates if requested
    if (templates) {
      return NextResponse.json({
        success: true,
        templates: Object.entries(SCHEMA_TEMPLATES).map(([type, template]) => ({
          type,
          ...template,
        })),
      });
    }

    // Get single schema by ID
    if (schemaId) {
      const schema = await getSchemaMarkup(schemaId);

      if (!schema) {
        return NextResponse.json(
          { error: 'Schema not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        schema,
        jsonLd: generateJsonLdScript(schema.schemaData as Record<string, unknown>),
      });
    }

    // Get schemas for project
    if (projectId) {
      const schemas = await getProjectSchemas(projectId, { activeOnly });

      return NextResponse.json({
        success: true,
        count: schemas.length,
        schemas,
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameter: id or projectId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/seo-performance/schema
 * Update a schema markup
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const schema = await updateSchemaMarkup(id, updates);

    if (!schema) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      schema,
      jsonLd: generateJsonLdScript(schema.schemaData as Record<string, unknown>),
    });
  } catch (error) {
    console.error('Error updating schema:', error);
    return NextResponse.json(
      { error: 'Failed to update schema' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/seo-performance/schema
 * Delete a schema markup
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const deleted = await deleteSchemaMarkup(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error('Error deleting schema:', error);
    return NextResponse.json(
      { error: 'Failed to delete schema' },
      { status: 500 }
    );
  }
}
