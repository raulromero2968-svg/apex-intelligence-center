import { readFile, readdir } from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
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

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}

const articlesDirectory = path.join(process.cwd(), 'src/content/articles');
// Blog directory is at repo root, so go up from apps/web to find it
const blogDirectory = path.join(process.cwd(), '..', '..', 'content', 'blog');

export interface ArticleFrontmatter {
  title: string;
  description?: string;
  category: string;
  publishedAt: string;
  sourceCount: number;
  tags: string[];
  heroImage?: string;
  og?: boolean; // Enable dynamic OG image generation
  draft?: boolean; // Hide from index and sitemap
  unlisted?: boolean; // Hide from index and sitemap, but accessible via direct URL
  author?: string; // Author name, defaults to "Apex Intelligence Team"
  authorRole?: string; // Author role/title
  authorAvatar?: string; // Author avatar URL
  sources?: Array<{
    name: string;
    url: string;
    thumbnail: string;
    description: string;
  }>;
  allSources?: Array<{
    name: string;
    url: string;
    publisher: string;
    accessed: string;
  }>;
}

export interface Article {
  slug: string;
  frontmatter: ArticleFrontmatter;
  content: any;
  readingTime?: {
    text: string;
    minutes: number;
    words: number;
  };
}

// Map category to directory
function getCategoryDir(category: string): string {
  const categoryMap: Record<string, string> = {
    research: 'research',
    tools: 'tools',
    'market-analysis': 'market-analysis',
    guides: 'guides',
  };

  return categoryMap[category.toLowerCase()] || category.toLowerCase();
}

// Get all article slugs from all categories + blog posts
export async function getAllArticleSlugs(): Promise<string[]> {
  const categories = ['research', 'tools', 'market-analysis', 'guides'];
  const slugs: string[] = [];

  // Get article slugs from categorized directories
  for (const category of categories) {
    try {
      const categoryPath = path.join(articlesDirectory, category);
      const files = await readdir(categoryPath);

      const mdxFiles = files
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => file.replace(/\.mdx$/, ''));

      slugs.push(...mdxFiles);
    } catch (error) {
      // Category directory might not exist, skip it
      console.warn(`Category directory not found: ${category}`);
    }
  }

  return slugs;
}

// Get article by slug (searches all categories + blog)
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const categories = ['research', 'tools', 'market-analysis', 'guides'];

  // First, try to find in article categories
  for (const category of categories) {
    try {
      const filePath = path.join(articlesDirectory, category, `${slug}.mdx`);
      const source = await readFile(filePath, 'utf8');

      const { data: frontmatter, content: rawContent } = matter(source);

      // Calculate reading time
      const readingTimeData = {
        text: `${calculateReadTime(rawContent)} min read`,
        minutes: calculateReadTime(rawContent),
        words: rawContent.trim().split(/\s+/).length,
      };

      const { content: mdxContent } = await compileMDX<ArticleFrontmatter>({
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
          parseFrontmatter: false, // We already parsed with gray-matter
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

      return {
        slug,
        frontmatter: frontmatter as ArticleFrontmatter,
        content: mdxContent,
        readingTime: readingTimeData,
      };
    } catch (error) {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        continue;
      }

      console.error(`Error reading article ${slug} in category ${category}:`, error);
      throw error;
    }
  }

  // If not found in articles, try blog posts
  const blogPost = await getBlogPostBySlug(slug);
  if (blogPost) {
    // Convert BlogPost to Article format for compatibility
    return {
      slug: blogPost.slug,
      frontmatter: {
        title: blogPost.frontmatter.title,
        category: 'Blog',
        publishedAt: blogPost.frontmatter.date,
        sourceCount: 0,
        tags: blogPost.frontmatter.tags || [],
        heroImage: blogPost.frontmatter.hero,
      },
      content: blogPost.content,
    } as Article;
  }

  return null;
}

// Get all articles (optionally filtered by category)
export async function getAllArticles(
  category?: string
): Promise<Article[]> {
  const categories = category ? [getCategoryDir(category)] : ['research', 'tools', 'market-analysis', 'guides'];
  const articles: Article[] = [];

  for (const cat of categories) {
    try {
      const categoryPath = path.join(articlesDirectory, cat);
      const files = await readdir(categoryPath);

      for (const file of files) {
        if (!file.endsWith('.mdx')) continue;

        const slug = file.replace(/\.mdx$/, '');
        const filePath = path.join(categoryPath, file);
        const source = await readFile(filePath, 'utf8');

        const { data: frontmatter } = matter(source);

        // Don't compile MDX content for listing pages (performance)
        articles.push({
          slug,
          frontmatter: frontmatter as ArticleFrontmatter,
          content: null,
        });
      }
    } catch (error) {
      console.warn(`Error reading category ${cat}:`, error);
    }
  }

  // Sort by date (newest first)
  return articles.sort((a, b) => {
    return new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime();
  });
}

// Calculate read time from content
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// ============================================================================
// Blog Post Functions (content/blog/)
// ============================================================================

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  hero?: string;
  tags?: string[];
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: any;
}

// Get all blog post slugs
export async function getAllBlogPostSlugs(): Promise<string[]> {
  try {
    const files = await readdir(blogDirectory);
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''));
  } catch (error) {
    console.warn('Blog directory not found:', error);
    return [];
  }
}

// Get blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(blogDirectory, `${slug}.mdx`);
    const source = await readFile(filePath, 'utf8');

    const { data: frontmatter, content } = matter(source);
    const { content: mdxContent } = await compileMDX<BlogPostFrontmatter>({
      source: content,
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

    return {
      slug,
      frontmatter: frontmatter as BlogPostFrontmatter,
      content: mdxContent,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

// Get all blog posts
export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const files = await readdir(blogDirectory);
    const posts: BlogPost[] = [];

    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;

      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(blogDirectory, file);
      const source = await readFile(filePath, 'utf8');

      const { data: frontmatter } = matter(source);

      posts.push({
        slug,
        frontmatter: frontmatter as BlogPostFrontmatter,
        content: null,
      });
    }

    // Sort by date (newest first)
    return posts.sort((a, b) => {
      return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
    });
  } catch (error) {
    console.warn('Error reading blog posts:', error);
    return [];
  }
}

// ============================================================================
// Commons Page Functions (content/commons/)
// ============================================================================

const commonsDirectory = path.join(process.cwd(), 'src', 'content', 'commons');

export interface CommonsPostFrontmatter {
  title: string;
  subtitle?: string;
  description?: string;
  publishedAt: string;
  date?: string; // Legacy support
  author?: string;
  heroImage?: string;
  thumbnail?: string;
  hero?: string; // Legacy support
  tags?: string[];
  category?: string;
  readingTime?: string;
}

export interface CommonsPost {
  slug: string;
  frontmatter: CommonsPostFrontmatter;
  content: any;
  readingTime?: {
    text: string;
    minutes: number;
    words: number;
  };
}

// Get all commons post slugs
export async function getAllCommonsSlugs(): Promise<string[]> {
  try {
    const files = await readdir(commonsDirectory);
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''));
  } catch (error) {
    console.warn('Commons directory not found:', error);
    return [];
  }
}

// Get commons post by slug
export async function getCommonsBySlug(slug: string): Promise<CommonsPost | null> {
  try {
    const filePath = path.join(commonsDirectory, `${slug}.mdx`);
    const source = await readFile(filePath, 'utf8');

    const { data: frontmatter, content: rawContent } = matter(source);

    // Calculate reading time
    const readingTimeData = {
      text: `${calculateReadTime(rawContent)} min read`,
      minutes: calculateReadTime(rawContent),
      words: rawContent.trim().split(/\s+/).length,
    };

    const { content: mdxContent } = await compileMDX<CommonsPostFrontmatter>({
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

    return {
      slug,
      frontmatter: frontmatter as CommonsPostFrontmatter,
      content: mdxContent,
      readingTime: readingTimeData,
    };
  } catch (error) {
    console.error(`Error reading commons post ${slug}:`, error);
    return null;
  }
}

// Get all commons posts
export async function getAllCommonsPosts(): Promise<CommonsPost[]> {
  try {
    const files = await readdir(commonsDirectory);
    const posts: CommonsPost[] = [];

    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;

      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(commonsDirectory, file);
      const source = await readFile(filePath, 'utf8');

      const { data: frontmatter } = matter(source);

      posts.push({
        slug,
        frontmatter: frontmatter as CommonsPostFrontmatter,
        content: null,
      });
    }

    // Sort by date (newest first)
    return posts.sort((a, b) => {
      return new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime();
    });
  } catch (error) {
    console.warn('Error reading commons posts:', error);
    return [];
  }
}


// ============================================================================
// Legal Page Functions (content/legal/)
// ============================================================================

const legalDirectory = path.join(process.cwd(), 'src', 'content', 'legal');

export interface LegalDocFrontmatter {
  title: string;
  subtitle?: string;
  publishedAt: string;
}

export interface LegalDoc {
  slug: string;
  frontmatter: LegalDocFrontmatter;
  content: any;
}

// Get all legal doc slugs
export async function getAllLegalDocSlugs(): Promise<string[]> {
  try {
    const files = await readdir(legalDirectory);
    return files
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => file.replace(/\.mdx$/, ''));
  } catch (error) {
    console.warn('Legal directory not found:', error);
    return [];
  }
}

// Get legal doc by slug
export async function getLegalDocBySlug(slug: string): Promise<LegalDoc | null> {
  try {
    const filePath = path.join(legalDirectory, `${slug}.mdx`);
    const source = await readFile(filePath, 'utf8');

    const { data: frontmatter, content: rawContent } = matter(source);

    const { content: mdxContent } = await compileMDX<LegalDocFrontmatter>({
      source: rawContent,
      components: {},
      options: {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    });

    return {
      slug,
      frontmatter: frontmatter as LegalDocFrontmatter,
      content: mdxContent,
    };
  } catch (error) {
    console.error(`Error reading legal doc ${slug}:`, error);
    return null;
  }
}

// Get all legal docs
export async function getAllLegalDocs(): Promise<LegalDoc[]> {
  try {
    const files = await readdir(legalDirectory);
    const docs: LegalDoc[] = [];

    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;

      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(legalDirectory, file);
      const source = await readFile(filePath, 'utf8');

      const { data: frontmatter } = matter(source);

      docs.push({
        slug,
        frontmatter: frontmatter as LegalDocFrontmatter,
        content: null,
      });
    }

    return docs.sort((a, b) => {
      return new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime();
    });
  } catch (error) {
    console.warn('Error reading legal docs:', error);
    return [];
  }
}
