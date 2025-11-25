/**
 * Vector Search API Routes
 *
 * Endpoints for pgvector index management and code generation.
 * Implements knowledge-09-database-architecture API layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createVectorIndex,
  getVectorIndex,
  getSchemaVectorIndexes,
  getProjectVectorIndexes,
  updateVectorIndex,
  deleteVectorIndex,
  generateVectorColumnSql,
  generateHnswIndexSql,
  generateIvfflatIndexSql,
  generateSimilaritySearchSql,
  generateDrizzleVectorSchema,
  generateDrizzleSimilaritySearch,
  generateEmbeddingFunction,
  getIndexRecommendation,
  DEFAULT_HNSW_PARAMS,
  DEFAULT_IVFFLAT_PARAMS,
  DISTANCE_OPERATORS,
  EMBEDDING_DIMENSIONS,
  type IndexType,
  type DistanceMetric,
} from '@/lib/database-arch';

/**
 * POST /api/database-arch/vector
 * Create vector index or generate code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { projectId, schemaId, tableName, columnName, indexType, distanceMetric, dimensions, params } = body;

        if (!projectId || !tableName || !columnName || !indexType) {
          return NextResponse.json(
            { error: 'Missing required fields: projectId, tableName, columnName, indexType' },
            { status: 400 }
          );
        }

        const vectorIndex = await createVectorIndex({
          projectId,
          schemaId,
          tableName,
          columnName,
          indexType,
          distanceMetric: distanceMetric ?? 'cosine',
          dimensions: dimensions ?? 1536,
          params: params ?? (indexType === 'hnsw' ? DEFAULT_HNSW_PARAMS : DEFAULT_IVFFLAT_PARAMS),
          isActive: true,
        });

        return NextResponse.json({
          success: true,
          vectorIndex,
        });
      }

      case 'generate-sql': {
        const { tableName, columnName, indexType, distanceMetric, dimensions, params } = body;

        if (!tableName || !columnName || !indexType) {
          return NextResponse.json(
            { error: 'Missing required fields: tableName, columnName, indexType' },
            { status: 400 }
          );
        }

        const indexName = `${tableName}_${columnName}_idx`;
        const metric = (distanceMetric as DistanceMetric) ?? 'cosine';

        const columnSql = generateVectorColumnSql(columnName, dimensions ?? 1536);

        let indexSql: string;
        if (indexType === 'hnsw') {
          indexSql = generateHnswIndexSql(
            tableName,
            columnName,
            indexName,
            metric,
            params ?? DEFAULT_HNSW_PARAMS
          );
        } else {
          indexSql = generateIvfflatIndexSql(
            tableName,
            columnName,
            indexName,
            metric,
            params ?? DEFAULT_IVFFLAT_PARAMS
          );
        }

        const searchSql = generateSimilaritySearchSql(tableName, columnName, metric);

        return NextResponse.json({
          success: true,
          sql: {
            column: columnSql,
            index: indexSql,
            search: searchSql,
          },
        });
      }

      case 'generate-drizzle': {
        const { tableName, columnName, distanceMetric, dimensions, embeddingSource } = body;

        if (!tableName || !columnName) {
          return NextResponse.json(
            { error: 'Missing required fields: tableName, columnName' },
            { status: 400 }
          );
        }

        const schema = generateDrizzleVectorSchema(tableName, columnName, dimensions ?? 1536);
        const search = generateDrizzleSimilaritySearch(
          tableName,
          columnName,
          (distanceMetric as DistanceMetric) ?? 'cosine'
        );
        const embedding = embeddingSource
          ? generateEmbeddingFunction(embeddingSource)
          : null;

        return NextResponse.json({
          success: true,
          drizzle: {
            schema,
            search,
            embedding,
          },
        });
      }

      case 'recommend': {
        const { rowCount, queryFrequency, accuracyNeeds } = body;

        const recommendation = getIndexRecommendation(
          rowCount ?? 10000,
          queryFrequency ?? 'medium',
          accuracyNeeds ?? 'high'
        );

        return NextResponse.json({
          success: true,
          recommendation,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, generate-sql, generate-drizzle, or recommend' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing vector request:', error);
    return NextResponse.json(
      { error: 'Failed to process vector request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/database-arch/vector
 * Get vector indexes and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const indexId = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const schemaId = searchParams.get('schemaId');
    const config = searchParams.get('config') === 'true';

    // Return configuration constants
    if (config) {
      return NextResponse.json({
        success: true,
        config: {
          distanceOperators: DISTANCE_OPERATORS,
          embeddingDimensions: EMBEDDING_DIMENSIONS,
          defaultHnswParams: DEFAULT_HNSW_PARAMS,
          defaultIvfflatParams: DEFAULT_IVFFLAT_PARAMS,
        },
      });
    }

    // Get single index by ID
    if (indexId) {
      const vectorIndex = await getVectorIndex(indexId);

      if (!vectorIndex) {
        return NextResponse.json(
          { error: 'Vector index not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        vectorIndex,
      });
    }

    // Get indexes for schema
    if (schemaId) {
      const indexes = await getSchemaVectorIndexes(schemaId);

      return NextResponse.json({
        success: true,
        count: indexes.length,
        indexes,
      });
    }

    // Get indexes for project
    if (projectId) {
      const activeOnly = searchParams.get('activeOnly') === 'true';
      const indexes = await getProjectVectorIndexes(projectId, { activeOnly });

      return NextResponse.json({
        success: true,
        count: indexes.length,
        indexes,
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameter: id, projectId, or schemaId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching vector indexes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vector indexes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/database-arch/vector
 * Update a vector index
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

    const vectorIndex = await updateVectorIndex(id, updates);

    if (!vectorIndex) {
      return NextResponse.json(
        { error: 'Vector index not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vectorIndex,
    });
  } catch (error) {
    console.error('Error updating vector index:', error);
    return NextResponse.json(
      { error: 'Failed to update vector index' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/database-arch/vector
 * Delete a vector index
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

    const deleted = await deleteVectorIndex(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Vector index not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error) {
    console.error('Error deleting vector index:', error);
    return NextResponse.json(
      { error: 'Failed to delete vector index' },
      { status: 500 }
    );
  }
}
