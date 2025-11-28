import Link from 'next/link';
import { Twitter, Linkedin, Instagram, Github, TrendingUp, Microscope, Shield, Target, Compass, Rocket } from 'lucide-react';
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
            <span className="block text-holographic">
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
                  <span className="text-cyan-400">[</span> WHO APEX INTELLIGENCE IS FOR <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10 leading-relaxed">
                We design everything we build around three core personas. Each one shapes our priorities, our tone, and our product decisions.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {/* The Serious Collector */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">THE SERIOUS COLLECTOR</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    A disciplined TCG or collectibles investor who wants an edge <em>without</em> spending all day in spreadsheets and Discord.
                  </p>

                  <div className="mb-4">
                    <h4 className="text-cyan-400 text-xs font-mono mb-2">THEY CARE ABOUT:</h4>
                    <ul className="space-y-1 text-xs text-slate-500 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Accurate, timely price signals
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Avoiding hype cycles & exit liquidity
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Tools that respect their time
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white text-xs font-mono mb-2">HOW WE SERVE THEM:</h4>
                    <ul className="space-y-1 text-xs text-slate-500 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> High-signal intel reports
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Clear risk explanations
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Openly admitting uncertainty
                      </li>
                    </ul>
                  </div>
                </div>

                {/* The Curious Scientist */}
                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-purple-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <Microscope className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">THE CURIOUS SCIENTIST</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    A researcher, quant, or technologist who sees TCG markets as a live sandbox—and is increasingly interested in biological data.
                  </p>

                  <div className="mb-4">
                    <h4 className="text-purple-400 text-xs font-mono mb-2">THEY CARE ABOUT:</h4>
                    <ul className="space-y-1 text-xs text-slate-500 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">→</span> Transparent methodology
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">→</span> Interpretable models
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">→</span> Path from toys to serious research
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white text-xs font-mono mb-2">HOW WE SERVE THEM:</h4>
                    <ul className="space-y-1 text-xs text-slate-500 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">→</span> Technical appendices
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">→</span> Model failure case studies
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-purple-400">→</span> TCG → AI for bio roadmap
                      </li>
                    </ul>
                  </div>
                </div>

                {/* The Ethical Builder */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">THE ETHICAL BUILDER</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Someone designing systems who wants them to be <em>humane by default</em>, especially in domains impacting sentient beings.
                  </p>

                  <div className="mb-4">
                    <h4 className="text-cyan-400 text-xs font-mono mb-2">THEY CARE ABOUT:</h4>
                    <ul className="space-y-1 text-xs text-slate-500 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Practical, implementable ethics
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Patterns assuming error
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Avoiding harmful externalities
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white text-xs font-mono mb-2">HOW WE SERVE THEM:</h4>
                    <ul className="space-y-1 text-xs text-slate-500 font-mono">
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Ethics-in-the-loop patterns
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> Do-no-harm protocols
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-cyan-400">→</span> AI for animal welfare research
                      </li>
                    </ul>
                  </div>
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

                <p className="text-slate-400 text-center max-w-2xl mx-auto leading-relaxed mb-6">
                  At Apex Intelligence, we assume people arrive with all kinds of impulses. Our job is not to judge—but to ensure our tools never turn a passing urge into a permanent wound. In everything we build, we aim to be a lens and a guide, never a weapon.
                </p>

                <div className="text-center">
                  <Link
                    href="/philosophy"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors"
                  >
                    [ READ_FULL_PHILOSOPHY ] →
                  </Link>
                </div>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Long-Term Vision Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="LONG-TERM VISION" classification="STRATEGIC DIRECTION // 2025+">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-cyan-400">[</span> WHERE WE&apos;RE HEADED <span className="text-cyan-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-mono">SHORT-TERM</h3>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Apex looks like a sharp, cyberpunk-flavored intel platform for TCG markets. High-signal reports, transparent methodology, and a culture that openly admits uncertainty.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Compass className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-mono">LONG-TERM</h3>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  A small, independent AI research center focused on biological science and animal welfare, grounded in real-world markets and ethics. No corporate gloss, no hype cycles.
                </p>
              </div>
            </div>

            {/* Evolution Path */}
            <div className="relative border border-slate-700/50 bg-slate-900/30 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white font-mono">OUR EVOLUTION</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <span className="text-cyan-400 font-mono text-xs">01</span>
                  </div>
                  <div>
                    <h4 className="text-white font-mono text-sm mb-1">MAINTAIN THE UNDERGROUND AESTHETIC</h4>
                    <p className="text-slate-500 text-sm">No corporate gloss, no hype cycles. Dispatches, dossiers, and public notes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <span className="text-purple-400 font-mono text-xs">02</span>
                  </div>
                  <div>
                    <h4 className="text-white font-mono text-sm mb-1">BUILD BRIDGES</h4>
                    <p className="text-slate-500 text-sm">Connect TCG data → AI model evaluation → AI safety research → animal welfare.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <span className="text-cyan-400 font-mono text-xs">03</span>
                  </div>
                  <div>
                    <h4 className="text-white font-mono text-sm mb-1">COLLABORATE WITH THE FIELD</h4>
                    <p className="text-slate-500 text-sm">Work alongside Sentient Futures, Earth Species Project, Faunalytics, ACE.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <span className="text-purple-400 font-mono text-xs">04</span>
                  </div>
                  <div>
                    <h4 className="text-white font-mono text-sm mb-1">STAY ALIGNED</h4>
                    <p className="text-slate-500 text-sm">Simple constraint: if it doesn&apos;t benefit humans and other sentient beings, we don&apos;t ship it.</p>
                  </div>
                </div>
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-mono"
            >
              [ INITIATE_ACCESS ]
            </Link>
            <Link
              href="/lab"
              className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              [ EXPLORE_LAB ]
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
