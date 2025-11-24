'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelHeader } from '@/components/intel/IntelHeader';
import { IntelBody } from '@/components/intel/IntelBody';
import { SourceRail } from '@/components/intel/SourceRail';

export default function IntelReportPage({ params }: { params: { slug: string } }) {
  // 1. Find the article data from our archive
  const article = INTEL_ARCHIVE.find(a => a.slug === params.slug);

  // 2. Fallback if not found (prevents crash)
  const title = article?.title || "ENCRYPTED PACKET: " + params.slug;
  const sources = article?.sources || [];

  return (
    // Z-INDEX 10 to sit above the Starfield Canvas
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">

       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT COLUMN: MAIN CONTENT WRAPPED IN SCROLL */}
          <div className="lg:col-span-8">
             {/* THIS WRAPPER IS THE ELECTRONIC SCROLL */}
             <DigitalScrollWrapper>

                {/* HEADER (Titan Style) */}
                <IntelHeader
                  slug={params.slug}
                  title={title}
                />

                {/* BODY (Contains the Cyber Stream Animation) */}
                <div className="mt-8 border-t border-slate-800 pt-8">
                   <IntelBody slug={params.slug} />
                </div>

             </DigitalScrollWrapper>
          </div>

          {/* RIGHT COLUMN: SOURCES (Perplexity Style) */}
          <div className="lg:col-span-4 hidden lg:block sticky top-32 h-fit">
             <div className="backdrop-blur-md bg-slate-950/30 border border-slate-800/50 rounded-xl p-1">
               <SourceRail sources={sources} />
             </div>
          </div>

       </div>
    </main>
  );
}
