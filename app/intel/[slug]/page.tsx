'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelHeader } from '@/components/intel/IntelHeader';
import { IntelBody } from '@/components/intel/IntelBody';
import { SourceRail } from '@/components/intel/SourceRail';

export default function IntelReportPage({ params }: { params: { slug: string } }) {
  // 1. Find the article
  const article = INTEL_ARCHIVE.find(a => a.slug === params.slug);
  const sources = article?.sources || [];

  return (
    // Z-10 ensures it sits ON TOP of the Starfield
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">

       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT COLUMN: MAIN CONTENT WRAPPED IN SCROLL */}
          <div className="lg:col-span-8">
             <DigitalScrollWrapper>

                {/* HEADER */}
                <IntelHeader
                  slug={params.slug}
                  title={article?.title || "ENCRYPTED PACKET"}
                />

                {/* BODY (Contains the Stream) */}
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
