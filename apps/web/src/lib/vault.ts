/**
 * Vault Report Loading Utilities
 * 
 * Functions to load and parse Vault MDX reports.
 */

import { readFile, readdir } from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getMDXComponents } from '@/mdx-components';

const vaultDirectory = path.join(process.cwd(), 'content', 'vault');

export interface VaultReportFrontmatter {
  title: string;
  slug: string;
  publishedAt: string;
  summary: string;
}

export interface VaultReport {
  slug: string;
  frontmatter: VaultReportFrontmatter;
  content: any;
}

/**
 * Get all vault report slugs
 */
export async function getAllVaultReportSlugs(): Promise<string[]> {
  try {
    const files = await readdir(vaultDirectory);
    return files
      .filter((file) => file.endsWith('.mdx') && file !== 'README.md')
      .map((file) => file.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error('Failed to read vault directory:', error);
    return [];
  }
}

/**
 * Get vault report by slug
 */
export async function getVaultReportBySlug(slug: string): Promise<VaultReport | null> {
  try {
    // Try to find file with matching slug in frontmatter or filename
    const files = await readdir(vaultDirectory);
    
    for (const file of files) {
      if (!file.endsWith('.mdx') || file === 'README.md') {
        continue;
      }

      const filePath = path.join(vaultDirectory, file);
      const source = await readFile(filePath, 'utf-8');
      const { data: frontmatter } = matter(source) as {
        data: VaultReportFrontmatter;
      };

      // Match by slug in frontmatter or filename
      if (frontmatter.slug === slug || file.replace(/\.mdx$/, '') === slug) {
        const { content: mdxContent } = await compileMDX<VaultReportFrontmatter>({
          source,
          options: {
            parseFrontmatter: false, // We already parsed with gray-matter
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [],
            },
          },
          components: getMDXComponents({}),
        });

        return {
          slug: frontmatter.slug,
          frontmatter,
          content: mdxContent,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to load vault report:', error);
    return null;
  }
}

/**
 * Get all vault reports with metadata only (for listing)
 */
export async function getAllVaultReports(): Promise<Array<{
  slug: string;
  frontmatter: VaultReportFrontmatter;
}>> {
  try {
    const files = await readdir(vaultDirectory);
    const reports: Array<{ slug: string; frontmatter: VaultReportFrontmatter }> = [];

    for (const file of files) {
      if (!file.endsWith('.mdx') || file === 'README.md') {
        continue;
      }

      try {
        const filePath = path.join(vaultDirectory, file);
        const source = await readFile(filePath, 'utf-8');
        const { data: frontmatter } = matter(source) as {
          data: VaultReportFrontmatter;
        };

        if (frontmatter.slug && frontmatter.title && frontmatter.publishedAt) {
          reports.push({
            slug: frontmatter.slug,
            frontmatter,
          });
        }
      } catch (error) {
        console.error(`Failed to parse vault report ${file}:`, error);
      }
    }

    // Sort by publishedAt desc
    reports.sort((a, b) => {
      const dateA = new Date(a.frontmatter.publishedAt).getTime();
      const dateB = new Date(b.frontmatter.publishedAt).getTime();
      return dateB - dateA;
    });

    return reports;
  } catch (error) {
    console.error('Failed to load vault reports:', error);
    return [];
  }
}


