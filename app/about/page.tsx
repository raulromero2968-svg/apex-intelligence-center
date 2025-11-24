'use client';

import { DigitalScrollWrapper } from '@/components/intel/DigitalScrollWrapper';

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 px-6 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Underground Intel, <span className="text-purple-400">Surface-Level Access</span></h1>
      </div>

      <DigitalScrollWrapper>
        <div className="space-y-16">
          {/* Mission */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-2">The Mission</h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              The TCG market is a multi-billion dollar industry, but most collectors are flying blind.
              We are building the intel network that should have existed years ago: a place where serious collectors
              can get <span className="text-cyan-400">data-driven insights</span> without the hype.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 text-center">What We Stand For</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              {['Data-Driven', 'Transparent', 'Actionable', 'Community-First'].map((val) => (
                <div key={val} className="p-4 border border-slate-800 bg-slate-900/30 rounded">
                  <div className="text-cyan-500 font-bold mb-1">{val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Coverage */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6">Intelligence Coverage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border-l-2 border-purple-500 bg-purple-500/5">
                <h3 className="text-white font-bold">Market Analysis</h3>
                <p className="text-slate-400 text-sm mt-2">Price trends, set performance, and investment opportunities.</p>
              </div>
              <div className="p-4 border-l-2 border-cyan-500 bg-cyan-500/5">
                <h3 className="text-white font-bold">Underground Intel</h3>
                <p className="text-slate-400 text-sm mt-2">Collector insights, market predictions, and alpha opportunities.</p>
              </div>
            </div>
          </section>
        </div>
      </DigitalScrollWrapper>
    </main>
  );
}
