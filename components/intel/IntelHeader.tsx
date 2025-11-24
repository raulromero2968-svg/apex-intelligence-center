'use client';

import Link from 'next/link';

export function IntelHeader({ slug, title, tier = "Free" }: { slug: string; title?: string; tier?: string }) {

  // Color logic
  const themeColor =
    tier === "Whale" ? "text-cyan-400 border-cyan-500 bg-cyan-950" :
    tier === "Pro" ? "text-purple-400 border-purple-500 bg-purple-950" :
    "text-amber-400 border-amber-500 bg-amber-950";

  const badgeColor =
    tier === "Whale" ? "bg-cyan-500" :
    tier === "Pro" ? "bg-purple-500" :
    "bg-amber-500";

  return (
    <div className="mb-8">
      <Link href="/intel" className="text-slate-500 text-xs font-mono uppercase tracking-wider hover:text-white mb-6 block">
        ← Return to Archive
      </Link>

      {/* DIAMOND TIER BADGE */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`px-3 py-1 border ${themeColor} bg-opacity-30 rounded-none skew-x-[-10deg] flex items-center gap-2`}>
           <div className={`w-2 h-2 ${badgeColor} rotate-45 skew-x-[10deg]`} /> {/* Diamond Shape */}
           <span className={`text-[10px] font-bold uppercase tracking-widest skew-x-[10deg] ${themeColor.split(' ')[0]}`}>
             {tier} Access
           </span>
        </div>
        <span className="text-slate-500 text-[10px] font-mono uppercase flex items-center">
          // VARC_VERIFIED
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-white mb-6 leading-none tracking-tighter uppercase">
        {title || slug}
      </h1>
    </div>
  );
}
