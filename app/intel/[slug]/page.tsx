import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelHeader } from '@/components/intel/IntelHeader';
import { IntelBody } from '@/components/intel/IntelBody';
import { SourceRail } from '@/components/intel/SourceRail';

export default function IntelReportPage({ params }: { params: { slug: string } }) {
  // 1. Find Data
  const article = INTEL_ARCHIVE.find(a => a.slug === params.slug);
  const sources = article?.sources || [];

  return (
    // REMOVED bg-slate-950. Using relative z-10 to sit above ApexVisualEngine
    <main className="min-h-screen pt-24 px-6 relative z-10">
       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main Content wrapped in SCROLL */}
          <div className="lg:col-span-8">
             <DigitalScrollWrapper>
                {/* Pass data dynamically if needed, or use existing components */}
                <IntelHeader slug={params.slug} title={article?.title} />
                <div className="prose prose-invert prose-cyan max-w-none mt-8 border-t border-slate-800 pt-8">
                   <IntelBody slug={params.slug} />
                </div>
             </DigitalScrollWrapper>
          </div>

          {/* Source Rail */}
          <div className="lg:col-span-4 hidden lg:block sticky top-32 h-fit">
             <SourceRail sources={sources} />
          </div>
       </div>
    </main>
  );
}
