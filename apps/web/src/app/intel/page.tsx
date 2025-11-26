import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { CardViewer } from "@/components/three/CardViewer";
import { intelNotes } from "@/content/seed";
import StarfieldFX from "@/components/fx/StarfieldFX";

export default function IntelPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-12 relative">
      <StarfieldFX />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Intelligence Center</h1>
          <p className="text-slate-400 max-w-2xl">
            Real-time optical analysis and market velocity tracking.
            Inspect assets with our <span className="text-cyan-400">VARC-3D</span> rendering engine.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: 3D Viewer (Takes up 1 column or featured spot) */}
          <div className="lg:col-span-1 space-y-6">
             <CardViewer />

             {/* Stats Card */}
             <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400">Market Price</span>
                  <span className="text-2xl font-bold text-white">$420,000</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 w-[75%] h-full" />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Low: $380k</span>
                  <span>High: $450k</span>
                </div>
             </div>
          </div>

          {/* Right: Charts & Data (Takes up 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <LiveScatter title="Charizard 1st Edition PSA 10" subtitle="Real-time market analysis and trend tracking" />

            {/* Sources / News Feed */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Latest Intel Sources</h3>
              <ul className="space-y-4">
                {[
                  { source: "Goldman Sachs Report", title: "Collectibles vs. S&P 500 Q4 Analysis", date: "2h ago" },
                  { source: "PSA Auction Data", title: "Volume spike detected in Vintage Pokemon", date: "5h ago" },
                  { source: "Apex Alpha", title: "Whale wallet movement detected on eBay Vault", date: "8h ago" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start justify-between border-b border-slate-800 pb-2 last:border-0">
                    <div>
                      <div className="text-cyan-400 text-sm font-medium">{item.title}</div>
                      <div className="text-slate-500 text-xs mt-1">Source: {item.source}</div>
                    </div>
                    <span className="text-slate-600 text-xs whitespace-nowrap">{item.date}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Intel Notes Section */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {intelNotes.map((a) => <ArticleCard key={a.href} a={a} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
