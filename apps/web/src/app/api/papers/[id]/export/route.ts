/**
 * Paper Export API Endpoint
 *
 * Exports papers to various formats:
 * - Markdown (.md)
 * - LaTeX (.tex)
 * - HTML (.html)
 *
 * Features:
 * - Citation style formatting (APA, MLA, Chicago, IEEE, Harvard)
 * - Metadata inclusion
 * - Table of contents
 * - Provenance tracking
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { Scope } from '@sentry/types';
import { getUserFromRequest, UserWithTier } from '@/lib/auth';
import { pool } from '@/db';
import { createPaperExporter, type ExportConfig } from '@/lib/papers';

// Export configuration schema
const ExportQuerySchema = z.object({
  format: z.enum(['markdown', 'latex', 'html', 'pdf']).default('markdown'),
  citationStyle: z.enum(['apa', 'mla', 'chicago', 'ieee', 'harvard']).optional(),
  includeMetadata: z.enum(['true', 'false']).transform((v) => v === 'true').default('true'),
  includeToc: z.enum(['true', 'false']).transform((v) => v === 'true').default('true'),
  includeProvenance: z.enum(['true', 'false']).transform((v) => v === 'true').default('false'),
  author: z.string().optional(),
  institution: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/papers/[id]/export
 *
 * Export a paper to the specified format
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  let user: UserWithTier | null = null;

  try {
    user = await getUserFromRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryObject: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryObject[key] = value;
    });

    const parsed = ExportQuerySchema.safeParse(queryObject);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid export configuration',
          details: parsed.error.issues,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const exportConfig = parsed.data;

    // Get paper from database
    const client = await pool.connect();
    try {
      const paperResult = await client.query(
        `
        SELECT
          p.*,
          json_agg(json_build_object(
            'id', c.source_doc_id,
            'content', c.source_content,
            'metadata', c.metadata,
            'score', c.rerank_score,
            'source_type', 'research_document'
          )) FILTER (WHERE c.id IS NOT NULL) as sources
        FROM papers p
        LEFT JOIN paper_citations c ON p.id = c.paper_id
        WHERE p.id = $1 AND p.user_id = $2
        GROUP BY p.id
        `,
        [id, user.id]
      );

      if (paperResult.rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Paper not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const paper = paperResult.rows[0];

      // Build paper object for exporter
      const paperForExport = {
        title: paper.title,
        topic: paper.research_topic,
        abstract: paper.abstract || '',
        sections: (paper.sections || []).map((s: any, i: number) => ({
          name: s.name || `section_${i}`,
          title: s.title || `Section ${i + 1}`,
          content: extractSectionContent(paper.content, s.title || ''),
          citationCount: s.citationCount || 0,
          synthesisCount: s.synthesisCount || 0,
          sourceIds: [],
          generatedAt: s.generatedAt ? new Date(s.generatedAt) : new Date(),
        })),
        fullContent: paper.content,
        format: paper.format,
        citationStyle: exportConfig.citationStyle || paper.citation_style,
        totalCitations: paper.citation_count || 0,
        totalSynthesis: paper.synthesis_count || 0,
        sources: (paper.sources || []).map((s: any) => ({
          id: s.id || '',
          content: s.content || '',
          metadata: s.metadata || {},
          score: parseFloat(s.score) || 1.0,
          source_type: s.source_type || 'document',
        })),
        complianceReport: paper.compliance_report || undefined,
        metadata: {
          model: paper.metadata?.model || 'claude-3-5-sonnet',
          generatedAt: new Date(paper.created_at),
          processingTimeMs: paper.metadata?.processingTimeMs || 0,
          config: paper.metadata?.config || {},
        },
      };

      // Create exporter
      const exporter = createPaperExporter({
        format: exportConfig.format as ExportConfig['format'],
        citationStyle: (exportConfig.citationStyle || paper.citation_style) as ExportConfig['citationStyle'],
        includeMetadata: exportConfig.includeMetadata,
        includeToc: exportConfig.includeToc,
        includeProvenance: exportConfig.includeProvenance,
        author: exportConfig.author,
        institution: exportConfig.institution,
      });

      // Export paper
      const result = exporter.export(paperForExport);

      // Log export
      Sentry.withScope((scope: Scope) => {
        scope.setUser({ id: user!.id, email: user!.email });
        scope.setTag('operation', 'paper_export');
        scope.setExtra('format', exportConfig.format);
        scope.setExtra('paperId', id);
      });

      // Return file download response
      return new Response(result.content, {
        status: 200,
        headers: {
          'Content-Type': result.mimeType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Content-Length': String(result.size),
          'X-Paper-Id': id,
          'X-Export-Format': result.format,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    Sentry.withScope((scope: Scope) => {
      if (user) scope.setUser({ id: user.id, email: user.email });
      Sentry.captureException(error);
    });

    console.error('Paper export error:', error);

    return new Response(
      JSON.stringify({
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Extract section content from full paper content
 */
function extractSectionContent(fullContent: string, sectionTitle: string): string {
  if (!sectionTitle || !fullContent) return '';

  // Try to find section by title
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionRegex = new RegExp(
    `(?:^|\\n)(?:#{1,3}|\\*{2})\\s*${escapedTitle}[\\s\\*]*(?:\\n|$)([\\s\\S]*?)(?=(?:\\n(?:#{1,3}|\\*{2})\\s)|$)`,
    'i'
  );

  const match = fullContent.match(sectionRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  return '';
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
