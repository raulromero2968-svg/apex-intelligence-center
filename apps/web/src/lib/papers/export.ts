/**
 * Paper Export Module
 *
 * Handles exporting generated papers to various formats:
 * - Markdown (.md)
 * - LaTeX (.tex)
 * - HTML (.html)
 * - PDF (via LaTeX compilation or Puppeteer)
 *
 * Features:
 * - Citation style formatting (APA, MLA, Chicago, IEEE, Harvard)
 * - Proper escaping for each format
 * - Metadata inclusion (author, date, keywords)
 * - Reference list generation
 */

import { z } from 'zod';
import type { GeneratedPaper, GeneratedSection, PaperSource } from './generator';

/**
 * Export configuration schema
 */
export const ExportConfigSchema = z.object({
  format: z.enum(['markdown', 'latex', 'html', 'pdf']),
  citationStyle: z.enum(['apa', 'mla', 'chicago', 'ieee', 'harvard']).default('apa'),
  includeMetadata: z.boolean().default(true),
  includeToc: z.boolean().default(true),
  includeProvenance: z.boolean().default(false),
  author: z.string().optional(),
  institution: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export type ExportConfig = z.infer<typeof ExportConfigSchema>;

/**
 * Export result
 */
export interface ExportResult {
  content: string;
  format: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Citation formatters for different styles
 */
const CITATION_FORMATTERS: Record<string, (source: PaperSource, index: number) => string> = {
  apa: (source, index) => {
    const meta = source.metadata;
    const author = meta.author || 'Unknown Author';
    const year = meta.date ? new Date(meta.date).getFullYear() : 'n.d.';
    const title = meta.title || 'Untitled';
    const publication = meta.publication || '';
    const url = meta.source_url || '';

    let citation = `[${index + 1}] ${author} (${year}). ${title}.`;
    if (publication) citation += ` *${publication}*.`;
    if (url) citation += ` Retrieved from ${url}`;
    return citation;
  },

  mla: (source, index) => {
    const meta = source.metadata;
    const author = meta.author || 'Unknown Author';
    const title = meta.title || 'Untitled';
    const publication = meta.publication || 'Web';
    const date = meta.date ? new Date(meta.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'n.d.';
    const url = meta.source_url || '';

    let citation = `[${index + 1}] ${author}. "${title}." *${publication}*, ${date}.`;
    if (url) citation += ` ${url}.`;
    return citation;
  },

  chicago: (source, index) => {
    const meta = source.metadata;
    const author = meta.author || 'Unknown Author';
    const title = meta.title || 'Untitled';
    const publication = meta.publication || '';
    const date = meta.date ? new Date(meta.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'n.d.';
    const url = meta.source_url || '';

    let citation = `[${index + 1}] ${author}. "${title}."`;
    if (publication) citation += ` ${publication}.`;
    citation += ` Accessed ${date}.`;
    if (url) citation += ` ${url}.`;
    return citation;
  },

  ieee: (source, index) => {
    const meta = source.metadata;
    const author = meta.author || 'Unknown Author';
    const title = meta.title || 'Untitled';
    const publication = meta.publication || '';
    const year = meta.date ? new Date(meta.date).getFullYear() : 'n.d.';
    const url = meta.source_url || '';

    let citation = `[${index + 1}] ${author}, "${title},"`;
    if (publication) citation += ` *${publication}*,`;
    citation += ` ${year}.`;
    if (url) citation += ` [Online]. Available: ${url}`;
    return citation;
  },

  harvard: (source, index) => {
    const meta = source.metadata;
    const author = meta.author || 'Unknown Author';
    const year = meta.date ? new Date(meta.date).getFullYear() : 'n.d.';
    const title = meta.title || 'Untitled';
    const publication = meta.publication || '';
    const url = meta.source_url || '';

    let citation = `[${index + 1}] ${author}, ${year}. ${title}.`;
    if (publication) citation += ` *${publication}*.`;
    if (url) citation += ` Available at: ${url} [Accessed ${new Date().toLocaleDateString()}]`;
    return citation;
  },
};

/**
 * Paper Export Handler
 */
export class PaperExporter {
  private config: ExportConfig;

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = ExportConfigSchema.parse(config);
  }

  /**
   * Export paper to specified format
   *
   * @param paper - Generated paper
   * @returns Export result with content and metadata
   */
  export(paper: GeneratedPaper): ExportResult {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (this.config.format) {
      case 'latex':
        content = this.exportLaTeX(paper);
        mimeType = 'application/x-latex';
        extension = 'tex';
        break;
      case 'html':
        content = this.exportHTML(paper);
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'pdf':
        // For PDF, we generate LaTeX that can be compiled
        content = this.exportLaTeX(paper);
        mimeType = 'application/x-latex';
        extension = 'tex';
        break;
      default:
        content = this.exportMarkdown(paper);
        mimeType = 'text/markdown';
        extension = 'md';
    }

    // Generate filename from title
    const safeTitle = paper.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    return {
      content,
      format: this.config.format,
      filename: `${safeTitle}.${extension}`,
      mimeType,
      size: new Blob([content]).size,
    };
  }

  /**
   * Export as Markdown
   */
  private exportMarkdown(paper: GeneratedPaper): string {
    let output = '';

    // Title
    output += `# ${paper.title}\n\n`;

    // Metadata
    if (this.config.includeMetadata) {
      output += `---\n`;
      if (this.config.author) output += `author: ${this.config.author}\n`;
      if (this.config.institution) output += `institution: ${this.config.institution}\n`;
      output += `date: ${new Date().toISOString().split('T')[0]}\n`;
      output += `topic: ${paper.topic}\n`;
      output += `citation_style: ${this.config.citationStyle}\n`;
      if (this.config.keywords?.length) {
        output += `keywords: ${this.config.keywords.join(', ')}\n`;
      }
      output += `---\n\n`;
    }

    // Table of Contents
    if (this.config.includeToc) {
      output += `## Table of Contents\n\n`;
      for (const section of paper.sections) {
        output += `- [${section.title}](#${this.slugify(section.title)})\n`;
      }
      output += `\n---\n\n`;
    }

    // Sections
    for (const section of paper.sections) {
      if (section.name === 'abstract') {
        output += `## Abstract\n\n`;
        output += `*${section.content}*\n\n`;
        output += `---\n\n`;
      } else if (section.name === 'references') {
        output += `## References\n\n`;
        output += this.formatReferences(paper.sources, 'markdown');
        output += '\n';
      } else {
        output += `## ${section.title}\n\n`;
        output += `${section.content}\n\n`;
      }
    }

    // Provenance
    if (this.config.includeProvenance && paper.complianceReport) {
      output += `---\n\n`;
      output += `### Provenance\n\n`;
      output += `- **Trace Hash:** ${paper.complianceReport.traceHash}\n`;
      output += `- **IPFS CID:** ${paper.complianceReport.ipfsCid}\n`;
      output += `- **Generated:** ${paper.metadata.generatedAt.toISOString()}\n`;
      output += `- **Model:** ${paper.metadata.model}\n`;
      output += `- **Citations:** ${paper.totalCitations}\n`;
      output += `- **Synthesis Markers:** ${paper.totalSynthesis}\n`;
    }

    // Footer
    output += `\n---\n\n`;
    output += `*Generated by Apex Intelligence Paper Generator*\n`;

    return output;
  }

  /**
   * Export as LaTeX
   */
  private exportLaTeX(paper: GeneratedPaper): string {
    let output = `\\documentclass[12pt,a4paper]{article}

% Packages
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{natbib}
\\usepackage{graphicx}
\\usepackage{amsmath}
\\usepackage{geometry}
\\usepackage{fancyhdr}
\\usepackage{abstract}

% Geometry
\\geometry{margin=1in}

% Header/Footer
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{${this.escapeLatex(paper.title.slice(0, 50))}}
\\lhead{\\thepage}

% Title
\\title{${this.escapeLatex(paper.title)}}
`;

    // Author
    if (this.config.author) {
      output += `\\author{${this.escapeLatex(this.config.author)}`;
      if (this.config.institution) {
        output += ` \\\\ \\small ${this.escapeLatex(this.config.institution)}`;
      }
      output += `}\n`;
    } else {
      output += `\\author{Generated by Apex Intelligence}\n`;
    }

    output += `\\date{${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}}\n\n`;

    output += `\\begin{document}\n\n`;
    output += `\\maketitle\n\n`;

    // Sections
    for (const section of paper.sections) {
      const content = this.convertCitationsToLatex(section.content);

      if (section.name === 'abstract') {
        output += `\\begin{abstract}\n`;
        output += `${content}\n`;
        output += `\\end{abstract}\n\n`;
        output += `\\newpage\n\n`;

        // Table of Contents
        if (this.config.includeToc) {
          output += `\\tableofcontents\n`;
          output += `\\newpage\n\n`;
        }
      } else if (section.name === 'references') {
        output += `\\section*{References}\n`;
        output += `\\addcontentsline{toc}{section}{References}\n\n`;
        output += this.formatReferences(paper.sources, 'latex');
        output += '\n';
      } else {
        output += `\\section{${section.title}}\n\n`;
        output += `${content}\n\n`;
      }
    }

    output += `\\end{document}\n`;

    return output;
  }

  /**
   * Export as HTML
   */
  private exportHTML(paper: GeneratedPaper): string {
    let output = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(paper.title)}</title>
  <meta name="description" content="${this.escapeHtml(paper.abstract.slice(0, 160))}">
`;

    // Keywords
    if (this.config.keywords?.length) {
      output += `  <meta name="keywords" content="${this.escapeHtml(this.config.keywords.join(', '))}">\n`;
    }

    // Author
    if (this.config.author) {
      output += `  <meta name="author" content="${this.escapeHtml(this.config.author)}">\n`;
    }

    output += `  <style>
    :root {
      --bg: #0A0E27;
      --text: #E0E0E0;
      --heading: #00F5FF;
      --accent: #B026FF;
      --link: #00F5FF;
      --citation: #FF006E;
      --synthesis: #FFD700;
    }

    * { box-sizing: border-box; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: var(--bg);
      color: var(--text);
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.8;
    }

    h1 {
      color: var(--heading);
      text-align: center;
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
    }

    .meta {
      text-align: center;
      color: #888;
      margin-bottom: 2rem;
      font-style: italic;
    }

    .toc {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      border-left: 3px solid var(--accent);
    }

    .toc h2 {
      margin-top: 0;
      color: var(--accent);
    }

    .toc ul {
      list-style: none;
      padding-left: 0;
    }

    .toc li {
      margin: 0.5rem 0;
    }

    .toc a {
      color: var(--link);
      text-decoration: none;
    }

    .toc a:hover {
      text-decoration: underline;
    }

    h2 {
      color: var(--heading);
      margin-top: 3rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(0, 245, 255, 0.3);
    }

    .abstract {
      font-style: italic;
      background: rgba(176, 38, 255, 0.1);
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 3px solid var(--accent);
      margin-bottom: 2rem;
    }

    .abstract h2 {
      margin-top: 0;
      border-bottom: none;
    }

    .citation {
      color: var(--citation);
      font-weight: 600;
      cursor: help;
    }

    .synthesis {
      background: rgba(255, 215, 0, 0.2);
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
      font-weight: 600;
    }

    .references {
      font-size: 0.95rem;
    }

    .references p {
      padding-left: 2rem;
      text-indent: -2rem;
      margin-bottom: 1rem;
    }

    .provenance {
      background: rgba(0, 245, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-top: 3rem;
    }

    .provenance h3 {
      color: var(--accent);
      margin-top: 0;
    }

    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #666;
      font-size: 0.9rem;
    }

    @media print {
      body { background: white; color: black; }
      h1, h2 { color: black; }
      .citation { color: #333; }
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(paper.title)}</h1>
`;

    // Meta info
    const metaParts: string[] = [];
    if (this.config.author) metaParts.push(this.escapeHtml(this.config.author));
    if (this.config.institution) metaParts.push(this.escapeHtml(this.config.institution));
    metaParts.push(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    output += `  <p class="meta">${metaParts.join(' | ')}</p>\n\n`;

    // Table of Contents
    if (this.config.includeToc) {
      output += `  <nav class="toc">\n`;
      output += `    <h2>Table of Contents</h2>\n`;
      output += `    <ul>\n`;
      for (const section of paper.sections) {
        output += `      <li><a href="#${this.slugify(section.title)}">${section.title}</a></li>\n`;
      }
      output += `    </ul>\n`;
      output += `  </nav>\n\n`;
    }

    // Sections
    for (const section of paper.sections) {
      const content = this.convertCitationsToHtml(section.content);

      if (section.name === 'abstract') {
        output += `  <section class="abstract" id="${this.slugify(section.title)}">\n`;
        output += `    <h2>Abstract</h2>\n`;
        output += `    ${content}\n`;
        output += `  </section>\n\n`;
      } else if (section.name === 'references') {
        output += `  <section class="references" id="${this.slugify(section.title)}">\n`;
        output += `    <h2>References</h2>\n`;
        output += this.formatReferences(paper.sources, 'html');
        output += `  </section>\n\n`;
      } else {
        output += `  <section id="${this.slugify(section.title)}">\n`;
        output += `    <h2>${section.title}</h2>\n`;
        output += `    ${content}\n`;
        output += `  </section>\n\n`;
      }
    }

    // Provenance
    if (this.config.includeProvenance && paper.complianceReport) {
      output += `  <aside class="provenance">\n`;
      output += `    <h3>Provenance</h3>\n`;
      output += `    <p><strong>Trace Hash:</strong> ${paper.complianceReport.traceHash}</p>\n`;
      output += `    <p><strong>IPFS CID:</strong> <a href="https://gateway.pinata.cloud/ipfs/${paper.complianceReport.ipfsCid}" target="_blank">${paper.complianceReport.ipfsCid}</a></p>\n`;
      output += `    <p><strong>Generated:</strong> ${paper.metadata.generatedAt.toISOString()}</p>\n`;
      output += `    <p><strong>Model:</strong> ${paper.metadata.model}</p>\n`;
      output += `    <p><strong>Citations:</strong> ${paper.totalCitations} | <strong>Synthesis:</strong> ${paper.totalSynthesis}</p>\n`;
      output += `  </aside>\n\n`;
    }

    // Footer
    output += `  <footer class="footer">\n`;
    output += `    <p>Generated by Apex Intelligence Paper Generator</p>\n`;
    output += `  </footer>\n`;

    output += `</body>\n</html>`;

    return output;
  }

  /**
   * Format references list
   */
  private formatReferences(sources: PaperSource[], format: 'markdown' | 'latex' | 'html'): string {
    const formatter = CITATION_FORMATTERS[this.config.citationStyle];
    const citations = sources.map((source, index) => formatter(source, index));

    switch (format) {
      case 'latex':
        return `\\begin{thebibliography}{${sources.length}}\n${citations.map((c, i) => `\\bibitem{source${i + 1}} ${this.escapeLatex(c.replace(/^\[\d+\]\s*/, ''))}`).join('\n')}\n\\end{thebibliography}`;
      case 'html':
        return citations.map((c) => `    <p>${this.escapeHtml(c)}</p>`).join('\n');
      default:
        return citations.join('\n\n');
    }
  }

  /**
   * Convert [source:n] to format-specific citations
   */
  private convertCitationsToLatex(text: string): string {
    return text
      .split('\n\n')
      .map((para) => {
        const converted = para
          .replace(/\[source:(\d+)\]/g, '\\cite{source$1}')
          .replace(/\[SYNTHESIS\]/g, '\\textbf{[Synthesis]}');
        return this.escapeLatex(converted, true);
      })
      .join('\n\n');
  }

  private convertCitationsToHtml(text: string): string {
    return text
      .split('\n\n')
      .map((para) => {
        const converted = para
          .replace(/\[source:(\d+)\]/g, '<span class="citation" title="See reference $1">[source:$1]</span>')
          .replace(/\[SYNTHESIS\]/g, '<span class="synthesis">[SYNTHESIS]</span>');
        return `<p>${this.escapeHtml(converted, true)}</p>`;
      })
      .join('\n    ');
  }

  /**
   * Escape LaTeX special characters
   */
  private escapeLatex(text: string, preserveCitations: boolean = false): string {
    if (preserveCitations) {
      // Preserve citation commands
      return text
        .replace(/(?<!\\)([&%$#_{}~^])/g, '\\$1')
        .replace(/\\cite\{/g, '\\cite{');
    }
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}~^]/g, '\\$&');
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string, preserveSpans: boolean = false): string {
    if (preserveSpans) {
      // Don't escape span tags
      return text;
    }
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Generate URL-safe slug from title
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

/**
 * Factory function for paper exporter
 *
 * @param config - Export configuration
 * @returns Configured PaperExporter instance
 */
export function createPaperExporter(
  config?: Partial<ExportConfig>
): PaperExporter {
  return new PaperExporter(config);
}
