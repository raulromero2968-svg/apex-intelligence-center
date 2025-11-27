import Link from 'next/link';
import { Twitter, Linkedin, Instagram, Github, Target, Shield, Zap, Users, Eye, Brain, Heart } from 'lucide-react';
import { SOCIAL_PROFILES } from '@/lib/constants';
import { ElectronicFolder } from '../../../../../components/ui/ElectronicFolder';
import { HoloCard } from '../../../../../components/ui/HoloCard';

export const revalidate = 3600;

export const metadata = {
  title: "Mission Briefing | Apex Intelligence - Rogue Think Tank",
  description: "Apex Intelligence operates as a rogue think tank at the intersection of biological intelligence, animal welfare, and market systems. Institutional-grade TCG analytics meets AI safety research.",
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
            CLASSIFIED // MISSION BRIEFING
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              Rogue
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              Think Tank
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Where biological intelligence meets market systems. We decode complexity to build safer, smarter futures.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* The Triad Strategy - Three Personas */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="OPERATIVE PROFILES" classification="CONFIDENTIAL // APEX INTEL">
            <h3 className="text-xl font-bold text-cyan-50 mt-0 mb-4">The Triad Strategy</h3>
            <p className="text-slate-300 mb-8">
              Apex Intelligence operates at the intersection of three distinct disciplines.
              We are not just building a product; we are building a coalition.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 not-prose">
              {/* Persona 1: The Serious Collector */}
              <div className="border-l-2 border-cyan-900 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-cyan-400 font-bold text-base m-0">01. The Serious Collector</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-3">TARGET: MARKET EFFICIENCY</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You need data, not drama. You view TCGs as an alternative asset class.
                  We provide the institutional-grade analytics, VARC scanning, and portfolio tracking
                  required to treat your collection with the financial rigor it deserves.
                </p>
              </div>

              {/* Persona 2: The Curious Scientist */}
              <div className="border-l-2 border-cyan-900 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h4 className="text-purple-400 font-bold text-base m-0">02. The Curious Scientist</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-3">TARGET: BIOLOGICAL DECODING</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You see beyond the cards. You are interested in how our VARC (Vision) and LAMARL (Language)
                  models are pushing the boundaries of AI. You understand that solving abstract reasoning
                  in TCGs is a stepping stone to decoding complex biological signals in nature.
                </p>
              </div>

              {/* Persona 3: The Ethical Builder */}
              <div className="border-l-2 border-cyan-900 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <h4 className="text-pink-400 font-bold text-base m-0">03. The Ethical Builder</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-mono tracking-wider mb-3">TARGET: SYSTEMIC WELFARE</p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  You believe in &ldquo;Sentient Beings First.&rdquo; You support our mission to operate as a
                  rogue think tank—ensuring that as AI systems become more powerful, they are
                  aligned with the welfare of all living things, not just corporate interests.
                </p>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <h2 className="text-2xl font-bold tracking-wider text-white font-mono">
              <span className="text-cyan-400">[</span> OUR MISSION <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Main Mission Text */}
            <div className="space-y-6">
              <p className="text-lg text-slate-300 leading-relaxed">
                We provide <span className="text-cyan-400 font-semibold">underground intelligence</span> for serious TCG collectors and investors,
                leveraging AI-powered research and institutional-grade analytics to deliver actionable market insights.
              </p>
              <p className="text-slate-400 leading-relaxed">
                But our vision extends beyond cards. We are pioneering <span className="text-purple-400 font-semibold">Language-Augmented Multi-Agent Systems (LAMARL)</span> and
                <span className="text-purple-400 font-semibold"> AI Safeguards</span> research—building the foundation for systems that understand,
                communicate, and protect biological intelligence across species.
              </p>
            </div>

            {/* Right: Core Values */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                <Target className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-white font-bold mb-2">Precision</h3>
                <p className="text-sm text-slate-400">Data-driven insights with institutional accuracy</p>
              </div>
              <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                <Zap className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-bold mb-2">Speed</h3>
                <p className="text-sm text-slate-400">Real-time market intelligence delivery</p>
              </div>
              <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                <Shield className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-white font-bold mb-2">Trust</h3>
                <p className="text-sm text-slate-400">Transparent methodology, no hype</p>
              </div>
              <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-bold mb-2">Community</h3>
                <p className="text-sm text-slate-400">Built by collectors, for collectors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Pillars Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="RESEARCH PILLARS" classification="APEX RESEARCH // ACTIVE">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
              {/* LAMARL */}
              <HoloCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">LAMARL</h4>
                    <p className="text-cyan-400 text-xs font-mono">Language-Augmented Multi-Agent Systems</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Developing AI agents that can communicate, collaborate, and learn together.
                  Our TCG strategy models serve as a proving ground for multi-agent coordination
                  that can eventually assist in wildlife monitoring and conservation efforts.
                </p>
              </HoloCard>

              {/* Safeguards */}
              <HoloCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Safeguards</h4>
                    <p className="text-purple-400 text-xs font-mono">Alignment & Welfare Research</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Ensuring AI systems remain aligned with the welfare of sentient beings.
                  We research safety mechanisms that prevent AI from becoming tools of harm,
                  whether against humans, animals, or ecosystems.
                </p>
              </HoloCard>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* System Safety Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/40 to-cyan-950/40 backdrop-blur-sm rounded-2xl p-10 overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                  <span className="text-purple-400">[</span> HUMAN IMPULSE & SYSTEM SAFETY <span className="text-purple-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              </div>

              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  At Apex Intelligence, we assume people arrive with all kinds of impulses—toward themselves and toward others,
                  generous and destructive, hopeful and furious. Our job is not to judge you for having those thoughts, but to
                  ensure our tools never turn a passing urge into a permanent wound.
                </p>
                <p>
                  We design our systems so they never encourage or instruct self-harm or harm to others. Wherever we brush up
                  against crisis, we aim to redirect that energy toward support, reflection, and creation.
                </p>
                <p className="text-cyan-400 font-medium">
                  In everything we build, we aim to be a lens and a guide, never a weapon.
                </p>
              </div>
            </div>
          </div>
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

          <p className="text-center text-slate-400 mb-8">
            Follow our official channels for the latest TCG market intelligence, research updates, and community insights.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href={SOCIAL_PROFILES.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Twitter className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">X (Twitter)</div>
              <div className="text-slate-500 text-sm">@TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Linkedin className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">LinkedIn</div>
              <div className="text-slate-500 text-sm">TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-purple-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Instagram className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">Instagram</div>
              <div className="text-slate-500 text-sm">@TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-purple-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Github className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium">GitHub</div>
              <div className="text-slate-500 text-sm">Open Source</div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto">
          <HoloCard intensity="high" className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-mono mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              ALPHA ACCESS OPEN
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Join the Network?
            </h2>

            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              Get exclusive market intelligence and research updates delivered weekly. No spam, just alpha.
            </p>

            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)]"
            >
              GET ALPHA ACCESS
            </Link>
          </HoloCard>
        </div>
      </section>
    </div>
  );
}

