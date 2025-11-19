import Link from 'next/link';
import type { Article } from '@/lib/mdx';

type DiscoverMoreProps = {
  relatedPosts: Article[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DiscoverMore({ relatedPosts }: DiscoverMoreProps) {
  if (!relatedPosts || relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 rounded-3xl border border-cyan-500/20 bg-black/30 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Discover more
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            Related research to keep exploring
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-100"
        >
          View all →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-cyan-400/60 hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-wide text-white/50">
              {post.frontmatter.category}
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white group-hover:text-cyan-200">
              {post.frontmatter.title}
            </h3>
            <p className="mt-3 text-sm text-white/60">
              {formatDate(post.frontmatter.publishedAt)}
            </p>
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
                {post.frontmatter.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
