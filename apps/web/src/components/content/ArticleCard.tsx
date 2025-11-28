import Link from "next/link";
import { FileText } from "lucide-react";

type Article = {
  href: string;
  title: string;
  excerpt: string;
  date: string;          // ISO date
  read: string;          // "10 min read"
  tags?: string[];
  badge?: "PRO" | "PREMIUM";
};

export default function ArticleCard({ a }: { a: Article }) {
  return (
    <article className="relative group">
      {/* Cyberpunk Terminal Wrapper */}
      <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/20 to-slate-950/80 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/20">
        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-purple-400/60 z-10 transition-all group-hover:w-6 group-hover:h-6" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-purple-400/60 z-10 transition-all group-hover:w-6 group-hover:h-6" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-purple-400/60 z-10 transition-all group-hover:w-6 group-hover:h-6" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-purple-400/60 z-10 transition-all group-hover:w-6 group-hover:h-6" />

        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 transition-all duration-300" />

        {/* Header Bar */}
        <div className="border-b border-purple-500/30 bg-black/60 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-purple-400" />
            <span className="text-purple-400 font-mono text-[10px] tracking-wider">INTEL_NOTE</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span>{new Date(a.date).toLocaleDateString('en-US', { month: "short", day: "numeric", year: "numeric"})}</span>
            <span className="text-slate-700">•</span>
            <span>{a.read}</span>
          </div>
        </div>

        {/* Content */}
        <Link href={a.href} className="block p-5">
          <h3 className="text-lg font-semibold leading-snug text-white group-hover:text-cyan-400 transition-colors font-mono">
            {a.title}
            {a.badge && (
              <span className="ml-2 align-middle rounded border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-400 font-mono">
                {a.badge}
              </span>
            )}
          </h3>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">
            {a.excerpt}
          </p>
        </Link>

        {/* Tags */}
        {a.tags && a.tags.length > 0 && (
          <div className="px-5 pb-4">
            <ul className="flex flex-wrap gap-2">
              {a.tags.map(t => (
                <li key={t} className="rounded border border-purple-500/30 bg-purple-950/30 px-2.5 py-1 text-[10px] text-purple-300 font-mono uppercase tracking-wider">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Status Bar */}
        <div className="border-t border-purple-500/20 bg-black/40 px-4 py-2">
          <div className="text-[9px] text-slate-600 font-mono">
            STATUS: ARCHIVED | ACCESS: PUBLIC
          </div>
        </div>
      </div>
    </article>
  );
}
