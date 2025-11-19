import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import AreaChartViz from '@/components/mdx/AreaChartViz';
import BarChartViz from '@/components/mdx/BarChartViz';
import HeroImage from '@/components/mdx/HeroImage';
import AskFollowUp from '@/components/mdx/AskFollowUp';
import InteractiveLineChart from '@/components/mdx/InteractiveLineChart';
import ScatterPlot from '@/components/mdx/ScatterPlot';
import PublishedTime from '@/components/mdx/PublishedTime';
import SourceBadge from '@/components/mdx/SourceBadge';
import SourceCards from '@/components/mdx/SourceCards';
import ImageWithCaption from '@/components/mdx/ImageWithCaption';
import InfoBox from '@/components/mdx/InfoBox';

const articlesDirectory = path.join(process.cwd(), 'src/content/articles');

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

// Get all article slugs from all categories
export async function getAllArticleSlugs(): Promise<string[]> {
  const categories = ['research', 'tools', 'market-analysis', 'guides'];
  const slugs: string[] = [];

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

  return slugs;
}

// Get raw markdown content by slug (for TableOfContents)
export async function getArticleRawContent(slug: string): Promise<string | null> {
  const categories = ['research', 'tools', 'market-analysis', 'guides'];

  for (const category of categories) {
    try {
      const filePath = path.join(articlesDirectory, category, `${slug}.mdx`);
      const source = await fs.readFile(filePath, 'utf8');
      const { content } = matter(source);
      return content;
    } catch (error) {
      // File not in this category, try next one
      continue;
    }
  }

  return null;
}

// Get article by slug (searches all categories)
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const categories = ['research', 'tools', 'market-analysis', 'guides'];

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
          ImageWithCaption,
          InfoBox,
        },
        options: {
          parseFrontmatter: false, // We already parsed with gray-matter
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
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

// Get related posts based on category and tags
export async function getRelatedPosts(
  currentSlug: string,
  currentCategory: string,
  currentTags: string[] = [],
  limit: number = 3
): Promise<Article[]> {
  const allArticles = await getAllArticles();
  
  // Filter out current article
  const filteredArticles = allArticles.filter(
    (article) => article.slug !== currentSlug
  );

  // Score articles based on relevance
  const scoredArticles = filteredArticles.map((article) => {
    let score = 0;

    // Higher score for same category
    if (article.frontmatter.category.toLowerCase() === currentCategory.toLowerCase()) {
      score += 10;
    }

    // Score based on shared tags
    if (article.frontmatter.tags && currentTags.length > 0) {
      const sharedTags = article.frontmatter.tags.filter((tag) =>
        currentTags.some((currentTag) =>
          currentTag.toLowerCase() === tag.toLowerCase()
        )
      );
      score += sharedTags.length * 5;
    }

    return { article, score };
  });

  // Sort by score (highest first), then by date (newest first)
  const sortedArticles = scoredArticles
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (
        new Date(b.article.frontmatter.publishedAt).getTime() -
        new Date(a.article.frontmatter.publishedAt).getTime()
      );
    })
    .map(({ article }) => article)
    .slice(0, limit);

  // If we don't have enough related posts, fill with recent posts
  if (sortedArticles.length < limit) {
    const recentArticles = filteredArticles
      .filter(
        (article) => !sortedArticles.some((sorted) => sorted.slug === article.slug)
      )
      .sort(
        (a, b) =>
          new Date(b.frontmatter.publishedAt).getTime() -
          new Date(a.frontmatter.publishedAt).getTime()
      )
      .slice(0, limit - sortedArticles.length);

    sortedArticles.push(...recentArticles);
  }

  return sortedArticles;
}
