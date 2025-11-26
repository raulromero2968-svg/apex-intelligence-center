import ArticleCard from "@/components/content/ArticleCard";
import { intelNotes } from "@/content/seed";

export default function IntelPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12 relative bg-slate-950">
      {/* Starfield background effect */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 -z-10" />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 animate-pulse">
            INTELLIGENCE ARCHIVE
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            <span className="text-cyan-400 font-mono">[ CLASSIFIED MARKET DATA ]</span> // LEVEL 5 CLEARANCE
          </p>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap gap-3 justify-center">
          {['ALL', 'SUCCESS', 'BLOG', 'INTEL', 'VINTAGE ANALYSIS', 'SET ANALYTICS', 'FORENSICS'].map((tag) => (
            <button
              key={tag}
              className="px-4 py-2 bg-slate-900/50 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 transition-all font-mono text-sm"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Intel Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {intelNotes.map((note) => (
            <div
              key={note.href}
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-6 hover:border-cyan-500/50 transition-all duration-300"
            >
              {/* Holographic glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-mono rounded border border-amber-500/30">
                    INTEL REPORT
                  </span>
                  <span className="text-slate-500 text-xs font-mono">{note.date}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {note.title}
                </h3>
                
                <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                  {note.excerpt}
                </p>
                
                <a
                  href={note.href}
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                >
                  <span>[ READ_INTEL ]</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="flex justify-center gap-8 pt-8 border-t border-slate-800/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              ▲ ARCHIVE_BEST_C16
            </div>
            <div className="text-sm text-slate-500 mt-1">System Status</div>
          </div>
        </div>
      </div>
    </div>
  );
}
