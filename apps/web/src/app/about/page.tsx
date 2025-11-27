import Link from 'next/link';
import { Twitter, Linkedin, Instagram, Github, TrendingUp, Microscope, Shield } from 'lucide-react';
import { SOCIAL_PROFILES } from '@/lib/constants';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';

export const revalidate = 3600;

export const metadata = {
  title: "The Manifesto | Apex Intelligence",
  description: "Apex Intelligence operates at the intersection of AI, Biological Science, and Market Systems. A rogue think tank prioritizing sentient beings first.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            CLASSIFIED // THE MANIFESTO
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              The
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              Manifesto
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-mono">
            Apex Intelligence operates at the intersection of AI, Biological Science, and Market Systems.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Operative Profiles Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="OPERATIVE PROFILES" classification="ROGUE THINK TANK // APEX INTEL">
            {/* The Triad Strategy */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                  <span className="text-cyan-400">[</span> THE TRIAD STRATEGY <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* The Serious Collector */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">THE SERIOUS COLLECTOR</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Institutional-grade market intelligence. We deploy VARC scanning protocols and real-time data pipelines to surface ROI opportunities invisible to retail.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-500 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">→</span> Real-time arbitrage detection
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">→</span> Predictive valuation models
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">→</span> Market sentiment analysis
                    </li>
                  </ul>
                </div>

                {/* The Curious Scientist */}
                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-purple-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <Microscope className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">THE CURIOUS SCIENTIST</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    LAMARL: Language Model for Animal Research & Learning. We&apos;re decoding interspecies communication and building biological AI bridges.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-500 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">→</span> Animal communication research
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">→</span> Biological signal processing
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-purple-400">→</span> Cross-species interface design
                    </li>
                  </ul>
                </div>

                {/* The Ethical Builder */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">THE ETHICAL BUILDER</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    &ldquo;Sentient Beings First&rdquo; isn&apos;t a slogan—it&apos;s architecture. Every system we build includes safeguards against misuse and manipulation.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-500 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">→</span> Harm-resistant system design
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">→</span> Rogue think-tank philosophy
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-cyan-400">→</span> Transparency-first protocols
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Philosophy Section */}
            <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                  <h2 className="text-lg font-bold tracking-wider text-white font-mono">
                    <span className="text-purple-400">[</span> CORE PHILOSOPHY <span className="text-purple-400">]</span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                </div>

                <blockquote className="text-xl md:text-2xl text-slate-300 leading-relaxed text-center mb-6 font-mono">
                  &ldquo;We build systems that assume error. We prioritize the welfare of all sentient beings—silicon or biological.&rdquo;
                </blockquote>

                <p className="text-slate-400 text-center max-w-2xl mx-auto leading-relaxed">
                  At Apex Intelligence, we assume people arrive with all kinds of impulses. Our job is not to judge—but to ensure our tools never turn a passing urge into a permanent wound. In everything we build, we aim to be a lens and a guide, never a weapon.
                </p>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Connect Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-2xl font-bold tracking-wider text-white font-mono">
              <span className="text-cyan-400">[</span> CONNECT WITH US <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <p className="text-center text-slate-400 mb-8 font-mono">
            Follow our official channels for the latest intelligence, research updates, and community insights.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href={SOCIAL_PROFILES.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Twitter className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-mono">X (Twitter)</div>
              <div className="text-slate-500 text-sm">@TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Linkedin className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-mono">LinkedIn</div>
              <div className="text-slate-500 text-sm">TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-purple-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Instagram className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-mono">Instagram</div>
              <div className="text-slate-500 text-sm">@TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-purple-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Github className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-mono">GitHub</div>
              <div className="text-slate-500 text-sm">Open Source</div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            ALPHA ACCESS OPEN
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
            Ready to Join the Network?
          </h2>

          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Get exclusive market intelligence delivered weekly. No spam, just alpha.
          </p>

          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-mono"
          >
            [ INITIATE_ACCESS ]
          </Link>
        </div>
      </section>
    </div>
  );
}
