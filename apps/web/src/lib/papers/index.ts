/**
 * Paper Generation Module
 *
 * Production-ready scientific paper generation pipeline with RAG integration.
 * Supports multi-format export (Markdown, LaTeX, HTML, PDF) with citation
 * enforcement and EU AI Act compliance.
 *
 * @module papers
 *
 * @example
 * ```typescript
 * import { createPaperGenerator, createIngestionPipeline, createPaperExporter } from '@/lib/papers';
 *
 * // 1. Ingest research documents
 * const pipeline = createIngestionPipeline();
 * await pipeline.ingestDocument(content, 'markdown', { title: 'Research Doc' }, userId);
 *
 * // 2. Search for relevant sources
 * const sources = await pipeline.searchDocuments('DMT neuroscience ego dissolution', 20, userId);
 *
 * // 3. Generate paper
 * const generator = createPaperGenerator({ style: 'academic', citationStyle: 'apa' });
 * const paper = await generator.generatePaper('DMT and Ego Dissolution', sources, (progress) => {
 *   console.log(`Generating ${progress.section}: ${progress.percentage}%`);
 * }, userId);
 *
 * // 4. Export to desired format
 * const exporter = createPaperExporter({ format: 'latex', includeMetadata: true });
 * const result = exporter.export(paper);
 * console.log(result.filename, result.content);
 * ```
 */

// Generator exports
export {
  PaperGenerator,
  createPaperGenerator,
  PaperConfigSchema,
  type PaperConfig,
  type GeneratedPaper,
  type GeneratedSection,
  type PaperSource,
  type ProgressCallback,
} from './generator';

// Ingestion exports
export {
  DocumentIngestionPipeline,
  createIngestionPipeline,
  DocumentMetadataSchema,
  type DocumentMetadata,
  type IngestionConfig,
  type IngestedDocument,
  type DocumentChunk,
} from './ingestion';

// Export exports
export {
  PaperExporter,
  createPaperExporter,
  ExportConfigSchema,
  type ExportConfig,
  type ExportResult,
} from './export';
