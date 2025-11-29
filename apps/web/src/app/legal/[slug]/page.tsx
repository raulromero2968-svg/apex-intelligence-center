import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getLegalDocBySlug, getAllLegalDocSlugs } from '@/lib/mdx';
import { ArrowLeft, Terminal } from 'lucide-react';

interface LegalPageProps {
  params: { slug: string };
}

export const revalidate = false;

export async function generateStaticParams() {
  const slugs = await getAllLegalDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LegalPageProps) {
  const doc = await getLegalDocBySlug(params.slug);
  if (!doc) return { title: 'Document Not Found' };
  return { title: `${doc.frontmatter.title} | Apex Intelligence Center` };
}

export default async function LegalDocPage({ params }: LegalPageProps) {
  const doc = await getLegalDocBySlug(params.slug);
  if (!doc) return notFound();

  return (
    <div className="relative min-h-screen pt-24 pb-20 bg-black">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6, 182, 212, 0.1) 2px, rgba(6, 182, 212, 0.1) 4px)',
        }} />
      </div>

      <div className="max-w-5xl mx-auto px-6 mb-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-sans border border-cyan-500/30 px-4 py-2 rounded hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
          <ArrowLeft className="w-4 h-4" />
          [ RETURN_TO_HOME ]
        </Link>
      </div>

      <article className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 to-purple-950/20 backdrop-blur-sm rounded-xl overflow-hidden">
          <div className="bg-black/60 border-b border-cyan-500/30 px-6 py-3 flex items-center gap-3">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-sans text-sm">APEX_LEGAL_DOCUMENT_VIEWER</span>
          </div>

          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-holographic font-sans mb-4">
              {doc.frontmatter.title}
            </h1>
            <p className="text-xl text-cyan-300 font-sans mb-12">
              {doc.frontmatter.subtitle}
            </p>

            <Suspense fallback={<div>Loading...</div>}>
              <div className="essay-content prose prose-invert prose-lg max-w-none font-sans
                prose-headings:text-cyan-300 prose-headings:font-bold prose-headings:font-sans
                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-cyan-500/20
                prose-p:text-slate-300 prose-p:leading-8 prose-p:mb-6
                prose-a:text-cyan-400 hover:prose-a:text-cyan-300
                prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                prose-li:text-slate-300
              ">
                {doc.content}
              </div>
            </Suspense>
          </div>

          <div className="bg-black/60 border-t border-cyan-500/30 px-6 py-4">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-slate-500">LAST_UPDATED: {new Date(doc.frontmatter.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="text-cyan-400">[ END_OF_DOCUMENT ]</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
