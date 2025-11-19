import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { getAllArticles } from "@/lib/mdx";

export default async function BlogPage() {
  const allArticles = await getAllArticles();

  // Filter out drafts and unlisted posts
  const articles = allArticles.filter(p => !p.frontmatter.draft && !p.frontmatter.unlisted);

  // Map to ArticleCard format
  const blogPosts = articles.map(article => ({
    href: `/blog/${article.slug}`,
    title: article.frontmatter.title,
    excerpt: article.frontmatter.tags?.join(', ') || '',
    date: article.frontmatter.publishedAt,
    read: "10 min read", // TODO: Calculate from content
    readTime: 10,
    tags: article.frontmatter.tags,
    imageUrl: article.frontmatter.heroImage || '/images/research/default.jpg',
    sources: article.frontmatter.sourceCount,
  }));

  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <LiveScatter title="Price vs Popularity" subtitle="Each dot is a card. Bigger = more sales. Watch clusters shift slowly." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
