import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { blogPosts } from "@/content/seed";

export default function BlogPage() {
  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <LiveScatter title="Price vs Popularity" subtitle="Each dot is a card. Bigger = more sales. Watch clusters shift slowly." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
