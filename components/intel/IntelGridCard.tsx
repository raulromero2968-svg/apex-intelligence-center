'use client';

import Link from 'next/link';
import { HoloThumbnail } from './HoloThumbnail';

interface IntelCardProps {
  item: {
    slug: string;
    tier?: string;
    category: string;
    title: string;
    summary: string;
    readTime: string;
    date: string;
  };
}

export function IntelGridCard({ item }: IntelCardProps) {
  // DIAMOND STANDARD COLOR MAPPING
  const tier = item.tier || "Free";

  const theme =
    tier === "Whale" ? { border: "border-cyan-500/50", glow: "shadow-cyan-500/20", badge: "bg-cyan-500 text-black", text: "text-cyan-400" } :
    tier === "Pro" ? { border: "border-purple-500/50", glow: "shadow-purple-500/20", badge: "bg-purple-500 text-white", text: "text-purple-400" } :
    { border: "border-amber-500/50", glow: "shadow-amber-500/20", badge: "bg-amber-500 text-black", text: "text-amber-400" }; // Free/Yellow

  return (
    <Link href={`/intel/${item.slug}`} className={`group relative block h-80 rounded-xl overflow-hidden border bg-slate-950/40 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-2xl ${theme.border} hover:${theme.glow}`}>

      {/* 1. HOLOGRAPHIC OVERLAY (The Shine) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20 holo-sweep" />

      {/* 2. THUMBNAIL (Generated) */}
      <div className="absolute inset-0 z-0 opacity-60 group-hover:opacity-80 transition-opacity">
        <HoloThumbnail category={item.category} />
      </div>

      {/* 3. TOP TAGS (Diamond Tier) */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {/* Tier Badge */}
        <span className={`${theme.badge} text-[10px] font-bold uppercase tracking-widest px-2 py-1 skew-x-[-10deg]`}>
          <span className="skew-x-[10deg] block">{tier} Intel</span>
        </span>

        {/* Category Badge */}
        <span className="bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-mono uppercase px-2 py-1 skew-x-[-10deg]">
          <span className="skew-x-[10deg] block">{item.category}</span>
        </span>
      </div>

      {/* 4. CONTENT OVERLAY */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-16 pb-6 px-6 z-10">
        <h3 className={`text-lg font-bold text-white mb-2 leading-tight group-hover:${theme.text} transition-colors font-display uppercase`}>
          {item.title}
        </h3>
        <p className="text-slate-400 text-xs line-clamp-2 mb-4 font-sans">
          {item.summary}
        </p>

        <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase">
          <div className="flex items-center gap-2">
            <span>{item.readTime}</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>{item.date}</span>
          </div>
          <div className={`flex items-center gap-1 ${theme.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
            ACCESS_FILE <span className="text-lg leading-none">»</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
