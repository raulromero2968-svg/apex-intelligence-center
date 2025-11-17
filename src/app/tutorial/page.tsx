import RouteTransition from '@/layout/RouteTransition';
import Link from 'next/link';

export default function TutorialPage() {
  return (
    <RouteTransition>
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-10 space-y-12">
          {/* Header */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Apex Tutorial
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              A quick walkthrough of indices, signals, and tools for TCG market intelligence
            </p>
          </section>

          {/* Tutorial Sections */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Section 1 */}
            <section className="rounded-2xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md hover:border-cyan-400/30 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Reading a Price Index
                  </h2>
                  <ul className="list-disc ml-6 text-white/80 space-y-2">
                    <li>
                      <strong className="text-cyan-300">Slope & Volatility:</strong> Look for trend direction and stability to gauge momentum
                    </li>
                    <li>
                      <strong className="text-cyan-300">Volume Confirmation:</strong> Confirm price moves with liquidity and spread compression
                    </li>
                    <li>
                      <strong className="text-cyan-300">Context Matters:</strong> Compare to historical patterns and market cycles
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="rounded-2xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md hover:border-purple-400/30 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-400 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Liquidity Heat Maps
                  </h2>
                  <p className="text-white/80 mb-3">
                    Volume bars and turnover metrics help identify durable price movements versus temporary spikes.
                  </p>
                  <ul className="list-disc ml-6 text-white/80 space-y-2">
                    <li>High volume + tight spreads = strong liquidity</li>
                    <li>Low volume + wide spreads = exit carefully</li>
                    <li>Monitor bid-ask spreads as early warning signals</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="rounded-2xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md hover:border-cyan-400/30 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Using Our Tools
                  </h2>
                  <p className="text-white/80 mb-3">
                    Explore our suite of professional-grade tools to analyze the TCG market:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h3 className="font-semibold text-cyan-300 mb-1">Portfolio Tracker</h3>
                      <p className="text-sm text-white/70">Monitor your collection value in real-time</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h3 className="font-semibold text-cyan-300 mb-1">Trade Calculator</h3>
                      <p className="text-sm text-white/70">Calculate optimal trade values</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h3 className="font-semibold text-cyan-300 mb-1">Grading Optimizer</h3>
                      <p className="text-sm text-white/70">Determine which cards to grade for max ROI</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h3 className="font-semibold text-cyan-300 mb-1">Reprint Predictor</h3>
                      <p className="text-sm text-white/70">Predict reprint probability and timing</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="rounded-2xl p-8 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-md hover:border-purple-400/30 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-400 font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-3">
                    Understanding Intelligence Reports
                  </h2>
                  <p className="text-white/80 mb-3">
                    Our research is organized into three main categories:
                  </p>
                  <ul className="list-disc ml-6 text-white/80 space-y-2">
                    <li>
                      <strong className="text-purple-300">Blog:</strong> Timely market commentary and beginner guides
                    </li>
                    <li>
                      <strong className="text-purple-300">Research:</strong> In-depth analysis with data-driven insights
                    </li>
                    <li>
                      <strong className="text-purple-300">Intel:</strong> Market snapshots and trend alerts
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="rounded-2xl p-8 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 backdrop-blur-md">
              <h2 className="text-2xl font-semibold text-white mb-3">
                Ready to Explore?
              </h2>
              <p className="text-white/80 mb-4">
                Start by browsing our latest intelligence or trying out our tools.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/intelligence"
                  className="px-6 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-500 text-black font-semibold transition-colors duration-300"
                >
                  View Latest Intelligence
                </Link>
                <Link
                  href="/tools"
                  className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-all duration-300"
                >
                  Explore Tools
                </Link>
              </div>
            </section>
          </div>

          {/* Footer Spacing */}
          <div className="h-24" />
        </main>
      </div>
    </RouteTransition>
  );
}
