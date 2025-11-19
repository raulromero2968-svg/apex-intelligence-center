import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { blogPosts } from "@/content/seed";
import { getAllBlogPosts } from "@/lib/mdx";
import { calculateReadTime } from "@/lib/mdx";

export default async function BlogPage() {
  // Get dynamic blog posts from content/blog/
  const dynamicPosts = await getAllBlogPosts();

  // Convert dynamic posts to the ArticleCard format
  const convertedPosts = dynamicPosts.map((post) => ({
    href: `/blog/${post.slug}`,
    title: post.frontmatter.title,
    excerpt: post.frontmatter.description,
    date: post.frontmatter.date,
    read: `${Math.max(1, Math.ceil(post.frontmatter.description.split(' ').length / 200))} min read`,
    readTime: Math.max(1, Math.ceil(post.frontmatter.description.split(' ').length / 200)),
    tags: post.frontmatter.tags || [],
    imageUrl: post.frontmatter.hero || "/press/og-default.png",
    sources: 0,
  }));

  // Combine dynamic posts with static seed posts
  const allPosts = [...convertedPosts, ...blogPosts];

  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <LiveScatter title="Price vs Popularity" subtitle="Each dot is a card. Bigger = more sales. Watch clusters shift slowly." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allPosts.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
