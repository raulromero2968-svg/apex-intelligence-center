import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { allPosts, type Post } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer/hooks";
import { BookOpen, Calendar, User } from "lucide-react";
import SectionShell from "@/app/(sections)/SectionShell";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareButtons from "@/components/blog/ShareButtons";
import DiscoverMore, { type RelatedPost } from "@/components/blog/DiscoverMore";
import { useMDXComponents } from "@/mdx-components";

interface BlogPostPageProps {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://apexintelligence.io";

export const revalidate = 3600;

export function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = allPosts.find((entry) => entry.slug === params.slug);

  if (!post) {
    return { title: "Post not found" };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://apexintelligence.io/blog/${post.slug}`,
      images: post.hero
        ? [{ url: post.hero }]
        : [{ url: `/api/og?title=${encodeURIComponent(post.title)}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.hero
        ? [post.hero]
        : [`/api/og?title=${encodeURIComponent(post.title)}`],
    },
  };
}

function getRelatedPosts(current: Post): RelatedPost[] {
  return allPosts
    .filter((post) => post.slug !== current.slug && !post.draft && !post.unlisted)
    .map((post) => {
      const sharedTags = post.tags?.filter((tag) => current.tags?.includes(tag)) ?? [];
      const score = sharedTags.length * 10 + new Date(post.date).getTime();
      return { post, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ post }) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.description,
    }));
}

function BlogHeader({ post }: { post: Post }) {
  const publishDate = new Date(post.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="mb-10 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/70">Apex Intelligence Blog</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">{post.title}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-400" />
            <span>{post.author}</span>
          </div>
          <span className="text-white/30">•</span>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <time dateTime={post.date}>{publishDate}</time>
          </div>
          {post.tags && post.tags.length > 0 && (
            <>
              <span className="text-white/30">•</span>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {post.hero && (
        <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-cyan-500/20">
          <Image src={post.hero} alt={post.title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 1024px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      )}
    </header>
  );
}

export default function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  const post = allPosts.find((entry) => entry.slug === params.slug);
  if (!post) {
    notFound();
  }

  const previewParam = searchParams?.preview;
  const previewFlag = Array.isArray(previewParam) ? previewParam[0] : previewParam;
  const preview = previewFlag === "1";
  const hidden = (post.draft || post.unlisted) && !preview && process.env.NODE_ENV === "production";
  if (hidden) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post);
  const MDXContent = useMDXComponent(post.body.code);
  const mdxComponents = useMDXComponents({});
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <SectionShell title="" kicker="Blog">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr),320px]">
        <article className="min-w-0">
          <BlogHeader post={post} />
          <ShareButtons title={post.title} url={postUrl} />
          <div className="prose prose-invert mt-8 max-w-none">
            <MDXContent components={mdxComponents} />
          </div>
          <DiscoverMore relatedPosts={relatedPosts} />
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents />
            <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-black/30 p-4 text-sm text-white/80">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span>About Apex Intel</span>
              </div>
              <p className="mt-3">
                Deep-dive analysis on TCG macro trends, investing frameworks, and playbooks for serious collectors.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}
