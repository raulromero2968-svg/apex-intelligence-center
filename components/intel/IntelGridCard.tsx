'use client';

import Link from 'next/link';
import { HoloThumbnail } from './HoloThumbnail';

interface IntelCardProps {
  item: any;
}

export function IntelGridCard({ item }: IntelCardProps) {
  // Color mapping based on category
  const tagColor =
    item.category === "Research" ? "bg-purple-500" :
    item.category === "Intel" ? "bg-cyan-500" :
    "bg-blue-500";

  return (
    <Link href={`/intel/${item.slug}`} className="group relative block h-80 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">

      {/* 1. HOLOGRAPHIC OVERLAY (The Shine) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20 holo-sweep" />

      {/* 2. GENERATIVE HOLOGRAPHIC THUMBNAIL */}
      <div className="absolute inset-0 z-0 group-hover:scale-110 transition-transform duration-700">
        <HoloThumbnail category={item.category} />
      </div>

      {/* 3. TOP TAGS */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 flex-wrap">
        <span className={`${tagColor} text-white font-tech text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg`}>
          {item.category}
        </span>
        {/* Decorative Data Badges from Screenshot */}
        {item.roi && (
          <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md">
            ROI: {item.roi}
          </span>
        )}
        {item.spread && (
          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md">
            SPR: {item.spread}
          </span>
        )}
        {item.cagr && (
          <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md">
            CAGR: {item.cagr}
          </span>
        )}
        {item.price && (
          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md">
            {item.price} {item.change}
          </span>
        )}
        {item.trend && (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md">
            {item.trend}
          </span>
        )}
        {item.security && (
          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md">
            {item.security}
          </span>
        )}
      </div>

      {/* 4. CONTENT OVERLAY (Bottom Glass) */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-12 pb-6 px-6 z-10">
        <h3 className="font-tech text-lg font-bold text-white mb-2 leading-tight group-hover:text-cyan-400 transition-colors">
          {item.title}
        </h3>
        <p className="text-slate-400 text-xs line-clamp-2 mb-4">
          {item.summary}
        </p>

        <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase">
          <div className="flex items-center gap-2">
            <span>{item.readTime}</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>{item.date}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
            ACCESS <span className="text-lg leading-none">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
