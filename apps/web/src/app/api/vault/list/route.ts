// Force dynamic rendering - auth/headers require runtime evaluation
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { userHasVaultAccess } from '@/server/services/entitlements';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

const VAULT_CONTENT_DIR = join(process.cwd(), 'apps/web/content/vault');

interface VaultReport {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
}

/**
 * GET /api/vault/list
 * 
 * Returns list of available Vault reports.
 * Requires authentication and Vault subscription.
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check Vault access
    const hasAccess = await userHasVaultAccess(user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Vault subscription required' },
        { status: 403 }
      );
    }

    // Read MDX files from content/vault directory
    let files: string[] = [];
    try {
      files = await readdir(VAULT_CONTENT_DIR);
    } catch (error) {
      // Directory doesn't exist yet - return empty list
      return NextResponse.json({ reports: [] });
    }

    // Filter for MDX files and extract metadata
    const reports: VaultReport[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.mdx') && !file.endsWith('.md')) {
        continue;
      }

      try {
        const filePath = join(VAULT_CONTENT_DIR, file);
        const fileContents = await readFile(filePath, 'utf-8');
        const { data } = matter(fileContents);

        const slug = file.replace(/\.(mdx|md)$/, '');
        
        reports.push({
          slug,
          title: data.title || slug,
          publishedAt: data.publishedAt || data.date || new Date().toISOString(),
          summary: data.summary || '',
        });
      } catch (error) {
        console.error(`[Vault] Error reading file ${file}:`, error);
        // Continue with other files
      }
    }

    // Sort by publishedAt descending (newest first)
    reports.sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('[Vault] Error listing reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


