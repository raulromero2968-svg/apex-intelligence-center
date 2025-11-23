import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/components/research/ArticleLayout';
import { getArticleBySlug, getAllArticles } from '@/lib/articles';

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

// Generate static params for all articles (optional, for static generation)
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | Apex Intelligence`,
    description: article.excerpt,
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <ArticleLayout
      title={article.title}
      excerpt={article.excerpt}
      content={article.content}
      author={article.author}
      date={article.date}
      readTime={article.readTime}
      category={article.category}
      citations={article.citations}
      isPremium={article.isPremium}
    />
  );
}
