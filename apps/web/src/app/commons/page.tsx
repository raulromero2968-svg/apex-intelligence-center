import Link from 'next/link';
import SectionShell from "../(sections)/SectionShell";
import { getAllCommonsPosts } from "@/lib/mdx";
import { Calendar, Clock, BookOpen } from 'lucide-react';

export const metadata = {
  title: "Apex Commons | Essays on Building Better Systems",
  description: "A public commons for better systems. Essays for builders who know they've been both harmed and harmful.",
};

export default async function CommonsPage() {
  const allPosts = await getAllCommonsPosts();

  return (
    <SectionShell title="Apex Commons" kicker="Essays">
      {/* Hero Section */}
      <div className="mb-12 max-w-3xl">
        <p className="text-xl text-white/80 leading-relaxed mb-6">
          A public commons for better systems. Tools and essays for builders who know they've been both harmed and harmful.
        </p>

        {/* Note on Heroes Card */}
        <div className="rounded-xl border border-cyan-400/30 bg-gradient-to-br from-black/40 via-purple-900/10 to-black/40 backdrop-blur-md p-6">
          <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
            Note on Heroes
          </h3>
          <p className="text-white/70 text-sm leading-relaxed">
            Admire the work. Don't worship the person. We're building systems that assume human error, not systems that demand human perfection.
          </p>
        </div>
      </div>

      {/* Essays Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allPosts.map((post) => {
          const publishDate = new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <Link
              key={post.slug}
              href={`/commons/${post.slug}`}
              className="group relative overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-400/10"
            >
              {/* Card Content */}
              <div className="p-6">
                {/* Header */}
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-3">
                    {post.frontmatter.category}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {post.frontmatter.title}
                  </h3>
                  {post.frontmatter.subtitle && (
                    <p className="mt-2 text-sm text-white/60 line-clamp-2">
                      {post.frontmatter.subtitle}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{publishDate}</span>
                  </div>
                  {post.readingTime && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readingTime.text}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Tags */}
                {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.frontmatter.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2 py-1 text-xs text-purple-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-purple-600/0 group-hover:from-cyan-400/5 group-hover:to-purple-600/5 transition-all duration-300 pointer-events-none" />
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {allPosts.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <p className="text-white/60">No essays published yet. Check back soon.</p>
        </div>
      )}
    </SectionShell>
  );
}
