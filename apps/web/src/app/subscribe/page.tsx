import Link from 'next/link';
import { Mail, Shield, Zap, Bell, CheckCircle } from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';

export const metadata = {
  title: "The Gate | Apex Intelligence",
  description: "Join the underground intelligence network. Get weekly TCG market analysis and exclusive research delivered to your inbox.",
};

export default function SubscribePage() {
  return (
    <div className="relative min-h-screen pt-24 flex flex-col">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            SECURE CONNECTION // THE_GATE
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              The
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              Gate
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-mono">
            Join the underground intelligence network. Weekly alpha drops, zero spam.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Subscribe Form Section - Centered */}
      <section className="relative z-10 px-6 md:px-12 py-8 flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl">
          <HoloCard intensity="high">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-6 text-sm font-mono text-cyan-400">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="ml-2">apex_intel@gate ~ %</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center font-mono">
              Initiate Access Protocol
            </h2>
            <p className="text-slate-400 text-center mb-8">
              Get free weekly market analysis and exclusive research delivered directly.
            </p>

            <form className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-mono text-cyan-400 mb-2">
                  EMAIL_ADDRESS *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="agent@example.com"
                    aria-label="Email address"
                    className="w-full rounded-lg bg-slate-900/80 pl-12 pr-4 py-4 text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-mono text-slate-500 mb-2">
                  CODENAME (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your name"
                  aria-label="Name (optional)"
                  className="w-full rounded-lg bg-slate-900/80 px-4 py-4 text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 px-6 py-4 font-bold text-black transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-mono"
              >
                [ INITIATE_ACCESS ]
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 font-mono">
              <Shield className="inline w-4 h-4 mr-1" />
              Encrypted. No spam. Unsubscribe anytime.
            </p>
          </HoloCard>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-xl font-bold tracking-wider text-white font-mono">
              <span className="text-cyan-400">[</span> WHAT YOU GET <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 font-mono">Weekly Intel Drops</h3>
              <p className="text-sm text-slate-400">
                Curated market analysis and actionable insights every week
              </p>
            </div>

            <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 font-mono">Early Access</h3>
              <p className="text-sm text-slate-400">
                Be first to know about market movements and opportunities
              </p>
            </div>

            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2 font-mono">Exclusive Research</h3>
              <p className="text-sm text-slate-400">
                Deep dives and analysis not published anywhere else
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="relative border border-slate-700 bg-slate-900/50 backdrop-blur-sm rounded-xl p-8">
            {/* Terminal style header */}
            <div className="flex items-center gap-2 mb-6 text-sm font-mono text-slate-500">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="w-2 h-2 rounded-full bg-slate-600" />
              </div>
              <span className="ml-2">expected_intel.md</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-4 font-mono">
              <span className="text-cyan-400">$</span> cat expected_intel.md
            </h3>

            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono">01.</span>
                <p><strong className="text-white font-mono">Market Pulse</strong> — Weekly summary of major TCG market movements</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono">02.</span>
                <p><strong className="text-white font-mono">Deep Dives</strong> — In-depth analysis of specific sets, cards, or trends</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono">03.</span>
                <p><strong className="text-white font-mono">Alpha Alerts</strong> — Time-sensitive opportunities and market signals</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 font-mono">04.</span>
                <p><strong className="text-white font-mono">Research Reports</strong> — Data-driven analysis and forecasts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <section className="relative z-10 px-6 md:px-12 py-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 font-mono text-sm transition-colors"
        >
          <span>←</span> RETURN_TO_BASE
        </Link>
      </section>
    </div>
  );
}

