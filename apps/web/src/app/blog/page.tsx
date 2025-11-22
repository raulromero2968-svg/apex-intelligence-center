import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { getAllBlogPosts } from "@/lib/mdx";

export default async function BlogPage() {
  const allBlogPosts = await getAllBlogPosts();

  // Map to ArticleCard format
  const allPosts = allBlogPosts.map(post => ({
    href: `/blog/${post.slug}`,
    title: post.frontmatter.title,
    excerpt: post.frontmatter.description || post.frontmatter.tags?.join(', ') || '',
    date: post.frontmatter.date,
    read: "10 min read", // TODO: Calculate from content
    readTime: 10,
    tags: post.frontmatter.tags,
    imageUrl: post.frontmatter.hero || '/images/research/default.jpg',
    sources: 0, // Blog posts don't have sourceCount
  }));

  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <LiveScatter title="Price vs Popularity" subtitle="Each dot is a card. Bigger = more sales. Watch clusters shift slowly." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allPosts.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
