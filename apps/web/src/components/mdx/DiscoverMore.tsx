import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

interface RelatedPost {
  title: string;
  slug: string;
  excerpt: string;
}

interface DiscoverMoreProps {
  relatedPosts: RelatedPost[];
}

export default function DiscoverMore({ relatedPosts }: DiscoverMoreProps) {
  if (!relatedPosts || relatedPosts.length === 0) return null;

  return (
    <div className="my-12 border-t border-cyan-500/20 pt-12">
      <div className="flex items-center gap-2 mb-6">
        <Compass className="w-5 h-5 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">Discover More</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/research/${post.slug}`}
            className="group rounded-xl border border-cyan-500/20 bg-black/40 p-6 transition-all hover:border-cyan-400/60 hover:bg-black/60 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors mb-3">
              {post.title}
            </h3>
            <p className="text-sm text-white/60 line-clamp-3 mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
              <span>Read more</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

