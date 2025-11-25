/**
 * Schema Validation API Route
 *
 * Endpoint for validating JSON-LD schema data.
 * Implements knowledge-07-seo-performance validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  validateSchema,
  generateJsonLdScript,
  generateNextJsComponent,
  type SchemaType,
  SCHEMA_TEMPLATES,
} from '@/lib/seo-performance';

/**
 * POST /api/seo-performance/schema/validate
 * Validate schema data and generate code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schemaType, schemaData, generateCode } = body;

    if (!schemaType || !schemaData) {
      return NextResponse.json(
        { error: 'Missing required fields: schemaType, schemaData' },
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

    const validation = validateSchema(schemaType as SchemaType, schemaData);

    const response: Record<string, unknown> = {
      success: true,
      validation,
    };

    // Generate code if requested
    if (generateCode && validation.isValid) {
      response.code = {
        jsonLd: generateJsonLdScript(schemaData),
        nextJsComponent: generateNextJsComponent(schemaType as SchemaType),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error validating schema:', error);
    return NextResponse.json(
      { error: 'Failed to validate schema' },
      { status: 500 }
    );
  }
}
