import Link from 'next/link';
import { Brain, Heart, Eye, Shield, Microscope, FileWarning, Scale, Zap } from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';

export const revalidate = 3600;

export const metadata = {
  title: "Our Philosophy | Apex Intelligence",
  description: "Humans First. Sentient Beings First. Our guiding principles for building AI systems that prioritize welfare over performance.",
};

export default function PhilosophyPage() {
  return (
    <div className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            CLASSIFIED // CORE DOCTRINE
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Our
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              Philosophy
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-mono">
            Sentient-first systems. Radical transparency. Allergic to hype.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Humans First Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="FOUNDATIONAL PRINCIPLES" classification="ROGUE THINK TANK // APEX DOCTRINE">
            {/* Core Principle Block */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                  <span className="text-cyan-400">[</span> HUMANS FIRST. SENTIENT BEINGS FIRST. <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Humans First Card */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">HUMANS FIRST</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We prioritize the safety, clarity, and well-being of the people who use our tools and read our work. We assume humans are messy, distracted, and imperfect—and design systems that work <em>because</em> of that reality, not in spite of it.
                  </p>
                </div>

                {/* Sentient Beings Card */}
                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-mono">SENTIENT BEINGS FIRST</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We deliberately extend concern beyond our own species. If a system touches animals or potentially sentient digital minds, we treat that as morally serious—not an afterthought. When uncertain, we slow down.
                  </p>
                </div>
              </div>

              <p className="text-slate-400 text-center max-w-3xl mx-auto leading-relaxed">
                Apex Intelligence started in a very human place: people trying to make sense of noisy markets, irrational behavior, and incomplete information. From there, our philosophy expanded—but the core remains simple: build systems that don&apos;t break the world or the creatures in it.
              </p>
            </div>

            {/* Listening to Nature Section */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                  <span className="text-purple-400">[</span> LISTENING TO THE REST OF NATURE <span className="text-purple-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              </div>

              <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="w-14 h-14 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-6">
                      <Eye className="w-7 h-7 text-purple-400" />
                    </div>
                    <p className="text-slate-300 leading-relaxed mb-4">
                      Around the world, research groups like <span className="text-cyan-400">Earth Species Project</span> are using advanced AI to decode animal communication and bioacoustic signals across the tree of life.
                    </p>
                    <p className="text-slate-400 leading-relaxed mb-4">
                      We are inspired by this work, but we are not trying to &ldquo;translate&rdquo; animals in a literal or sensational way. Instead, we take one core lesson:
                    </p>
                    <blockquote className="border-l-2 border-cyan-500 pl-4 text-lg text-slate-300 italic">
                      AI should help us listen more deeply, not just control more efficiently.
                    </blockquote>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-mono font-bold mb-4">When applying AI to biological data, we ask:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 font-mono">01</span>
                        <p className="text-slate-400">Are we increasing understanding, or just extracting more value?</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 font-mono">02</span>
                        <p className="text-slate-400">Are we reducing stress, harm, and confusion for animals—or increasing it?</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 font-mono">03</span>
                        <p className="text-slate-400">Are we being honest about what the models can and cannot actually tell us?</p>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm italic pt-4">
                      We treat animal communication and behavior as something to be approached with humility, not mined like a dataset.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rogue Think Tank Section */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                  <span className="text-cyan-400">[</span> THE ROGUE THINK TANK <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <h3 className="text-lg font-bold text-white mb-3 font-mono text-cyan-400">NOT A UNIVERSITY LAB</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We combine market-grade data analysis from the TCG world with research-grade caution from AI safety and animal ethics.
                  </p>
                </div>

                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-purple-400/60 transition-all">
                  <h3 className="text-lg font-bold text-white mb-3 font-mono text-purple-400">NOT A CORPORATE DIVISION</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We prefer dispatches, dossiers, and public notes over glossy PR. We build tools that are brutally honest about their limits.
                  </p>
                </div>

                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <h3 className="text-lg font-bold text-white mb-3 font-mono text-cyan-400">INTENTIONALLY SMALL</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We stay lean, independent, and transparent enough to admit when something doesn&apos;t work. Opinionated and off-center by design.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-400 max-w-2xl mx-auto">
                  <span className="text-white font-bold">Our long-term direction:</span> Start with TCG market intelligence and other bounded systems where we can test methods, calibration, and reliability. Gradually expand into biological science and animal-related data, always under strict ethical protocols.
                </p>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Protocols Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="OPERATIONAL PROTOCOLS" classification="ETHICS & SAFETY // DO NO HARM">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-cyan-400">[</span> DO NO HARM, ACT FOR BENEFIT <span className="text-cyan-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10 leading-relaxed">
              We borrow heavily from animal welfare researchers and AI ethics practitioners who argue that &ldquo;do no harm&rdquo; is necessary but not enough. AI systems touching animals should ultimately <span className="text-cyan-400 font-bold">benefit</span> them, not just avoid the worst mistakes.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Protocol 1 */}
              <div className="border border-red-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <FileWarning className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">NO HARMFUL INSTRUCTIONS</h3>
                </div>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">→</span>
                    We do not publish tools, prompts, or research that enable harm, stress, or exploitation.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">→</span>
                    We actively design against use-cases involving coercion, abuse, or deceptive control.
                  </li>
                </ul>
              </div>

              {/* Protocol 2 */}
              <div className="border border-yellow-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">STRESS AND SAFETY FIRST</h3>
                </div>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">→</span>
                    Any work involving animals must minimize stress, disruption, and risk.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">→</span>
                    If the welfare impact is unclear, we don&apos;t proceed.
                  </li>
                </ul>
              </div>

              {/* Protocol 3 */}
              <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">TRANSPARENCY ABOUT LIMITS</h3>
                </div>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    We state where our models are uncertain or likely to fail.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    We disclose when a pattern is correlation, not understanding.
                  </li>
                </ul>
              </div>

              {/* Protocol 4 */}
              <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono">SENTIENT-FIRST DECISIONS</h3>
                </div>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">→</span>
                    When performance conflicts with welfare, we side with welfare.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">→</span>
                    We treat potentially sentient digital minds as moral patients, not tools.
                  </li>
                </ul>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* TCG to Biology Bridge Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-purple-950/40 backdrop-blur-sm rounded-xl p-8 md:p-12 overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />

            {/* Glow effects */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-mono">FROM TCG INTEL TO BIOLOGICAL SCIENCE</h2>
              </div>

              <p className="text-slate-300 mb-6 leading-relaxed">
                Why start from trading card games at all? Because TCG markets give us a <span className="text-cyan-400 font-bold">sandbox</span>:
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-cyan-400 font-mono text-sm">→</span>
                    Online, fully observable, high-frequency behavior
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-cyan-400 font-mono text-sm">→</span>
                    Real stakes, but contained risk
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-cyan-400 font-mono text-sm">→</span>
                    Perfect for stress-testing forecasting methods
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-purple-400 font-mono text-sm">→</span>
                    Data pipeline validation
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-purple-400 font-mono text-sm">→</span>
                    Model calibration training ground
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-purple-400 font-mono text-sm">→</span>
                    Human–AI collaboration experiments
                  </li>
                </ul>
              </div>

              <p className="text-slate-400 leading-relaxed mb-6">
                As we mature, the same habits we hone in TCG—<span className="text-white">ruthless transparency</span>, <span className="text-white">careful error analysis</span>, and a <span className="text-white">refusal to overclaim</span>—become the habits we need when working on AI + biological science + animal welfare.
              </p>

              <div className="border-t border-slate-700/50 pt-6 text-center">
                <p className="text-slate-500 text-sm font-mono">
                  If that sounds like you, welcome to the rogue think tank.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            EXPLORE FURTHER
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
            Ready to Go Deeper?
          </h2>

          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Explore our research streams, meet the team, or join the network.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/lab"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-mono"
            >
              [ EXPLORE_LAB ]
            </Link>
            <Link
              href="/about"
              className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              [ MEET_THE_TEAM ]
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
