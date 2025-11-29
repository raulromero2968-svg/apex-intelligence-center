import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { CardViewer } from "@/components/three/CardViewer";
import { intelNotes } from "@/content/seed";
import StarfieldFX from "@/components/fx/StarfieldFX";
import { Activity, TrendingUp, Database, Radio, Eye, Zap } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { DISSERTATION_CHAPTERS } from '@/components/phd/constants';
import { DissertationChapterBadge } from '@/components/phd/DissertationChapterBadge';

export default function IntelPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 relative">
      {/* PhD Framework - Chapter 04: Results & Analysis */}
      <DissertationChapterBadge
        chapter={DISSERTATION_CHAPTERS.RESULTS}
        variant="floating"
      />
      <StarfieldFX />

      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
        {/* Hero Header with Terminal Aesthetic */}
        <ScrollReveal>
          <div className="relative">
            {/* Status Bar */}
            <div className="flex items-center gap-3 mb-6 font-sans text-xs">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-950/30 border border-cyan-500/30 text-cyan-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                LIVE FEED ACTIVE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-purple-950/30 border border-purple-500/30 text-purple-400">
                <Activity className="w-3 h-3" />
                VARC-3D ONLINE
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-950/30 border border-slate-700/30 text-slate-400">
                <Database className="w-3 h-3" />
                SOURCES: 247
              </div>
            </div>

            {/* Main Title */}
            <div className="relative border border-cyan-500/40 bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-8 md:p-12 overflow-hidden">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />

              {/* Glow Effects */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-8 h-8 text-cyan-400" />
                  <span className="text-cyan-400 font-sans text-sm tracking-wider">APEX_INTEL_PROTOCOL</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                  <span className="text-white">Apex </span>
                  <span className="text-holographic">Intelligence Center</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed font-sans">
                  Real-time optical analysis and market velocity tracking. Inspect assets with our{" "}
                  <span className="text-cyan-400 font-bold">VARC-3D</span> rendering engine.
                  Zero latency. Full transparency.
                </p>

                {/* Metrics Bar */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-cyan-500/20 bg-black/40 rounded-lg p-4">
                    <div className="text-cyan-400 text-2xl font-bold font-sans">24/7</div>
                    <div className="text-slate-500 text-xs mt-1 font-sans">LIVE MONITORING</div>
                  </div>
                  <div className="border border-purple-500/20 bg-black/40 rounded-lg p-4">
                    <div className="text-purple-400 text-2xl font-bold font-sans">247</div>
                    <div className="text-slate-500 text-xs mt-1 font-sans">DATA SOURCES</div>
                  </div>
                  <div className="border border-emerald-500/20 bg-black/40 rounded-lg p-4">
                    <div className="text-emerald-400 text-2xl font-bold font-sans">98.7%</div>
                    <div className="text-slate-500 text-xs mt-1 font-sans">ACCURACY RATE</div>
                  </div>
                  <div className="border border-orange-500/20 bg-black/40 rounded-lg p-4">
                    <div className="text-orange-400 text-2xl font-bold font-sans">&lt;50ms</div>
                    <div className="text-slate-500 text-xs mt-1 font-sans">LATENCY</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Dashboard Grid */}
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: 3D Viewer */}
            <div className="lg:col-span-1 space-y-6">
              {/* VARC-3D Viewer */}
              <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/20 to-slate-950/80 backdrop-blur-sm rounded-xl overflow-hidden">
                {/* Header */}
                <div className="border-b border-purple-500/30 bg-black/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-sans text-xs tracking-wider">VARC-3D VIEWER</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                  </div>
                </div>

                {/* Viewer */}
                <CardViewer />

                {/* Footer Info */}
                <div className="border-t border-purple-500/30 bg-black/60 px-4 py-2">
                  <div className="text-[10px] text-slate-500 font-sans">
                    RENDERING: REAL-TIME | QUALITY: ULTRA | FPS: 60
                  </div>
                </div>
              </div>

              {/* Market Stats Terminal */}
              <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/20 to-slate-950/80 backdrop-blur-sm rounded-xl overflow-hidden">
                {/* Terminal Header */}
                <div className="border-b border-cyan-500/30 bg-black/60 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-sans text-xs tracking-wider">MARKET_TERMINAL</span>
                  </div>
                  <div className="text-cyan-400 text-[10px] font-sans">LIVE</div>
                </div>

                {/* Stats */}
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-slate-400 font-sans text-sm">CURRENT_PRICE</span>
                      <span className="text-3xl font-bold text-white font-sans">$420,000</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-sans">
                      <span className="text-emerald-400">▲ 12.5%</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-500">24H CHANGE</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-cyan-500/20">
                      <div className="bg-gradient-to-r from-cyan-500 to-purple-500 w-[75%] h-full relative">
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-sans">
                      <span>LOW: $380K</span>
                      <span>HIGH: $450K</span>
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                    <div>
                      <div className="text-slate-500 text-[10px] font-sans mb-1">VOLUME_24H</div>
                      <div className="text-white font-sans text-sm">$2.4M</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] font-sans mb-1">TRADES</div>
                      <div className="text-white font-sans text-sm">1,247</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] font-sans mb-1">AVG_SALE</div>
                      <div className="text-white font-sans text-sm">$395K</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px] font-sans mb-1">VOLATILITY</div>
                      <div className="text-orange-400 font-sans text-sm">HIGH</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Charts & Data */}
            <div className="lg:col-span-2 space-y-6">
              {/* Live Chart */}
              <div className="relative border border-cyan-500/40 bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm rounded-xl overflow-hidden">
                <LiveScatter 
                  title="Charizard 1st Edition PSA 10" 
                  subtitle="Real-time market analysis and trend tracking" 
                />
              </div>

              {/* Intel Feed Terminal */}
              <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/20 to-slate-950/80 backdrop-blur-sm rounded-xl overflow-hidden">
                {/* Terminal Header */}
                <div className="border-b border-purple-500/30 bg-black/60 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-sans text-sm tracking-wider">LIVE_INTEL_FEED</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span className="text-purple-400 text-xs font-sans">STREAMING</span>
                  </div>
                </div>

                {/* Feed Content */}
                <div className="p-6">
                  <ul className="space-y-4">
                    {[
                      { 
                        source: "Goldman Sachs Report", 
                        title: "Collectibles vs. S&P 500 Q4 Analysis", 
                        date: "2h ago",
                        priority: "HIGH"
                      },
                      { 
                        source: "PSA Auction Data", 
                        title: "Volume spike detected in Vintage Pokemon", 
                        date: "5h ago",
                        priority: "MEDIUM"
                      },
                      { 
                        source: "Apex Alpha", 
                        title: "Whale wallet movement detected on eBay Vault", 
                        date: "8h ago",
                        priority: "CRITICAL"
                      }
                    ].map((item, i) => (
                      <li 
                        key={i} 
                        className="relative border border-slate-800 bg-black/40 rounded-lg p-4 hover:border-purple-500/40 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-[10px] font-sans px-2 py-0.5 rounded ${
                                item.priority === 'CRITICAL' ? 'bg-red-950/50 border border-red-500/30 text-red-400' :
                                item.priority === 'HIGH' ? 'bg-orange-950/50 border border-orange-500/30 text-orange-400' :
                                'bg-cyan-950/50 border border-cyan-500/30 text-cyan-400'
                              }`}>
                                {item.priority}
                              </span>
                              <span className="text-slate-600 text-xs">•</span>
                              <span className="text-slate-500 text-xs font-sans">{item.date}</span>
                            </div>
                            <div className="text-cyan-400 text-sm font-medium mb-1 group-hover:text-cyan-300 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-slate-500 text-xs font-sans">
                              SOURCE: {item.source}
                            </div>
                          </div>
                          <div className="text-slate-600 group-hover:text-cyan-400 transition-colors">
                            <Activity className="w-4 h-4" />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Intel Notes Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {intelNotes.map((a) => <ArticleCard key={a.href} a={a} />)}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
