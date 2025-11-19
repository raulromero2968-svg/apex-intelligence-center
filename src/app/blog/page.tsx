import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { allPosts } from "contentlayer/generated";

export const revalidate = 3600;

function readingTime(body: string) {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function BlogPage() {
  const posts = allPosts
    .filter((post) => !post.draft && !post.unlisted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <LiveScatter
        title="Price vs Popularity"
        subtitle="Each dot is a card. Bigger = more sales. Watch clusters shift slowly."
      />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const minutes = readingTime(post.body.raw);
          return (
            <ArticleCard
              key={post.slug}
              a={{
                href: `/blog/${post.slug}`,
                title: post.title,
                excerpt: post.description,
                date: post.date,
                read: `${minutes} min read`,
                tags: post.tags,
              }}
            />
          );
        })}
      </div>
    </SectionShell>
  );
}
