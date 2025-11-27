import fs from 'fs/promises';
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

const articlesDirectory = path.join(process.cwd(), 'src/content/articles');
const blogDirectory = path.join(process.cwd(), 'content/blog');

export interface ArticleFrontmatter {
  title: string;
  category: string;
  publishedAt: string;
  sourceCount: number;
  tags: string[];
  heroImage?: string;
  og?: boolean; // Enable dynamic OG image generation
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
      const files = await fs.readdir(categoryPath);

      const mdxFiles = files
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => file.replace(/\.mdx$/, ''));

      slugs.push(...mdxFiles);
    } catch (error) {
      // Category directory might not exist, skip it
      console.warn(`Category directory not found: ${category}`);
    }
  }

  // Also include blog post slugs
  const blogSlugs = await getAllBlogPostSlugs();
  slugs.push(...blogSlugs);

  return slugs;
}

// Get article by slug (searches all categories + blog)
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const categories = ['research', 'tools', 'market-analysis', 'guides'];

  // First, try to find in article categories
  for (const category of categories) {
    try {
      const filePath = path.join(articlesDirectory, category, `${slug}.mdx`);
      const source = await fs.readFile(filePath, 'utf8');

      const { data: frontmatter, content } = matter(source);
      const enrichedSource = `const frontMatter = ${JSON.stringify(frontmatter)};\n${content}`;

      const { content: mdxContent } = await compileMDX<ArticleFrontmatter>({
        source: enrichedSource,
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
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [],
          },
        },
      });

      return {
        slug,
        frontmatter: frontmatter as ArticleFrontmatter,
        content: mdxContent,
      };
    } catch (error) {
      // File not in this category, try next one
      continue;
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
      const files = await fs.readdir(categoryPath);

      for (const file of files) {
        if (!file.endsWith('.mdx')) continue;

        const slug = file.replace(/\.mdx$/, '');
        const filePath = path.join(categoryPath, file);
        const source = await fs.readFile(filePath, 'utf8');

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
    const files = await fs.readdir(blogDirectory);
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
    const source = await fs.readFile(filePath, 'utf8');

    const { data: frontmatter, content } = matter(source);
    const enrichedSource = `const frontMatter = ${JSON.stringify(frontmatter)};\n${content}`;

    const { content: mdxContent } = await compileMDX<BlogPostFrontmatter>({
      source: enrichedSource,
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
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [],
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
    const files = await fs.readdir(blogDirectory);
    const posts: BlogPost[] = [];

    for (const file of files) {
      if (!file.endsWith('.mdx')) continue;

      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(blogDirectory, file);
      const source = await fs.readFile(filePath, 'utf8');

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
