import { notFound, redirect } from 'next/navigation';
import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getUserFromRequest } from '@/lib/auth';
import { userHasVaultAccess } from '@/server/services/entitlements';
import { headers } from 'next/headers';
import AreaChartViz from '@/components/mdx/AreaChartViz';
import BarChartViz from '@/components/mdx/BarChartViz';
import HeroImage from '@/components/mdx/HeroImage';
import AskFollowUp from '@/components/mdx/AskFollowUp';
import InteractiveLineChart from '@/components/mdx/InteractiveLineChart';
import ScatterPlot from '@/components/mdx/ScatterPlot';
import PublishedTime from '@/components/mdx/PublishedTime';
import SourceBadge from '@/components/mdx/SourceBadge';
import SourceCards from '@/components/mdx/SourceCards';
import TableOfContents from '@/components/mdx/TableOfContents';
import InfoBox from '@/components/mdx/InfoBox';
import ImageWithCaption from '@/components/mdx/ImageWithCaption';
import ShareButtons from '@/components/mdx/ShareButtons';
import DiscoverMore from '@/components/mdx/DiscoverMore';

const VAULT_CONTENT_DIR = join(process.cwd(), 'apps/web/content/vault');

interface PageProps {
  params: {
    slug: string;
  };
}

/**
 * Vault Report Detail Page
 * 
 * Renders a single Vault report from MDX.
 * Requires authentication and Vault subscription.
 */
export default async function VaultReportPage({ params }: PageProps) {
  const { slug } = params;
  const headersList = await headers();
  const request = new Request('http://localhost', {
    headers: headersList,
  });

  // Check authentication
  const user = await getUserFromRequest(request);
  if (!user) {
    redirect('/subscribe?redirect=/vault/' + slug);
  }

  // Check Vault access
  const hasAccess = await userHasVaultAccess(user.id);
  if (!hasAccess) {
    redirect('/subscribe?plan=vault&redirect=/vault/' + slug);
  }

  // Read MDX file
  let filePath: string;
  let fileContents: string;

  try {
    // Try .mdx first, then .md
    try {
      filePath = join(VAULT_CONTENT_DIR, `${slug}.mdx`);
      fileContents = await readFile(filePath, 'utf-8');
    } catch {
      filePath = join(VAULT_CONTENT_DIR, `${slug}.md`);
      fileContents = await readFile(filePath, 'utf-8');
    }
  } catch (error) {
    console.error(`[Vault] Error reading report ${slug}:`, error);
    notFound();
  }

  // Parse frontmatter and content
  const { data: frontmatter, content: rawContent } = matter(fileContents);

  // Compile MDX
  let mdxContent;
  try {
    const { content } = await compileMDX({
      source: rawContent,
      components: {
        AreaChartViz,
        BarChartViz,
        HeroImage,
        AskFollowUp,
        InteractiveLineChart,
        ScatterPlot,
        PublishedTime,
        SourceBadge,
        SourceCards,
        TableOfContents,
        InfoBox,
        ImageWithCaption,
        ShareButtons,
        DiscoverMore,
      },
      options: {
        parseFrontmatter: false,
        scope: {
          frontMatter: frontmatter,
        },
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [],
          useDynamicImport: true,
        },
      },
    });
    mdxContent = content;
  } catch (error) {
    console.error(`[Vault] Error compiling MDX for ${slug}:`, error);
    notFound();
  }

  const title = (frontmatter.title as string) || slug;
  const publishedAt = (frontmatter.publishedAt as string) || (frontmatter.date as string) || new Date().toISOString();
  const summary = (frontmatter.summary as string) || '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          {summary && (
            <p className="text-xl text-white/70 mb-4">{summary}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-white/50">
            <PublishedTime date={publishedAt} />
            <span>•</span>
            <span>Vault Report</span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          {mdxContent}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-cyan-400/20">
          <ShareButtons
            title={title}
            url={`/vault/${slug}`}
          />
        </footer>
      </article>
    </div>
  );
}

