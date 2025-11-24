'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';
import { INTEL_ARCHIVE } from '@/lib/data/intel-archive';
import { IntelHeader } from '@/components/intel/IntelHeader';
import { IntelBody } from '@/components/intel/IntelBody';
import { SourceRail } from '@/components/intel/SourceRail';

export default function IntelReportPage({ params }: { params: { slug: string } }) {
  const article = INTEL_ARCHIVE.find(a => a.slug === params.slug);

  const title = article?.title || "ENCRYPTED PACKET";
  const sources = article?.sources || [];
  // Default to Free/Amber if undefined
  const tier = article?.tier || "Free";

  // Map tier string to color string for Wrapper
  const colorMap: Record<string, "cyan" | "purple" | "amber"> = {
    "Whale": "cyan",
    "Pro": "purple",
    "Free": "amber"
  };
  const color = colorMap[tier] || "amber";

  return (
    <main className="min-h-screen pt-24 px-6 relative z-10 pb-24">
       <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          <div className="lg:col-span-8">
             {/* Pass dynamic color to scroll */}
             <DigitalScrollWrapper color={color}>

                <IntelHeader
                  slug={params.slug}
                  title={title}
                  tier={tier}
                />

                <div className={`mt-8 border-t pt-8 ${color === 'cyan' ? 'border-cyan-900' : color === 'purple' ? 'border-purple-900' : 'border-amber-900'}`}>
                   <IntelBody slug={params.slug} />
                </div>

             </DigitalScrollWrapper>
          </div>

          <div className="lg:col-span-4 hidden lg:block sticky top-32 h-fit">
             <div className="backdrop-blur-md bg-slate-950/30 border border-slate-800/50 rounded-xl p-1">
               <SourceRail sources={sources} />
             </div>
          </div>
       </div>
    </main>
  );
}
