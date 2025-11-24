'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelHeader } from '@/components/intel/IntelHeader';
import { IntelBody } from '@/components/intel/IntelBody';
import { SourceRail } from '@/components/intel/SourceRail';
import { notFound } from 'next/navigation';

export default function IntelReportPage({ params }: { params: { slug: string } }) {
  // 1. Find the specific article data
  const article = INTEL_ARCHIVE.find(a => a.slug === params.slug);

  // 2. Handle 404 if article doesn't exist
  if (!article) {
    // Fallback for legacy/dev links that might not be in the archive yet
    // We render a "Not Found" state inside the Scroll for consistency
    return (
      <main className="min-h-screen pt-24 px-6 relative z-10">
        <DigitalScrollWrapper>
          <h1 className="text-red-500 font-mono text-xl">ERROR: INTEL_NOT_FOUND</h1>
          <p className="text-slate-400 mt-4">The requested intelligence packet [{params.slug}] is encrypted or unavailable.</p>
        </DigitalScrollWrapper>
      </main>
    );
  }

  return (
    // CRITICAL: No background color here. Let the global Starfield show through.
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">

       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT COLUMN: The Content (Wrapped in Electronic Scroll) */}
          <div className="lg:col-span-8">
             <DigitalScrollWrapper>
                {/* Pass the real title and category to the header */}
                <IntelHeader
                  slug={params.slug}
                  title={article.title}
                />

                {/* Render the body content */}
                <div className="prose prose-invert prose-cyan max-w-none mt-8 border-t border-slate-800 pt-8">
                   <IntelBody slug={params.slug} />
                </div>
             </DigitalScrollWrapper>
          </div>

          {/* RIGHT COLUMN: The "Perplexity" Sources (Sticky Rail) */}
          <div className="lg:col-span-4 hidden lg:block sticky top-32 h-fit">
             {/* This ensures the sources are visible and linked */}
             <div className="backdrop-blur-md bg-slate-950/30 border border-slate-800/50 rounded-xl p-1">
               <SourceRail sources={article.sources || []} />
             </div>
          </div>

       </div>
    </main>
  );
}
