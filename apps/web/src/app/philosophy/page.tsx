import Link from 'next/link';
import Image from 'next/image';
import { Brain, Heart, Eye, Shield, Microscope, FileWarning, Scale, Zap, Infinity, Dna, Network, Shell, AlertTriangle, DollarSign, Users, TrendingUp, Ban, Cpu, Rocket, Globe, BarChart3, Activity, Target, Sparkles, Box } from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { FibonacciResearch } from '@/components/philosophy/FibonacciResearch';
import { DISSERTATION_CHAPTERS } from '@/components/phd/constants';
import { DissertationChapterBadge } from '@/components/phd/DissertationChapterBadge';
import type { Metadata } from 'next';

export const revalidate = 3600;

// Dynamic OG metadata for simulation markets (KB-07 SEO patterns)
export const metadata: Metadata = {
  title: "Our Philosophy | Apex Intelligence",
  description: "Humans First. Sentient Beings First. Our guiding principles for building AI systems that prioritize welfare over performance. Explore our simulation markets for Bostrom-inspired existential scenario modeling.",
  openGraph: {
    title: 'Philosophy & Simulation Markets | Apex Intelligence',
    description: 'Explore TCG as cosmic prediction simulations. Bostrom-inspired existential scenarios with EGGROLL-trained models.',
    images: [
      {
        url: '/og/philosophy-simulation.png',
        width: 1200,
        height: 630,
        alt: 'Apex Intelligence Philosophy - Simulation Markets & Bostrom Trilemma',
      },
    ],
    type: 'website',
    siteName: 'Apex Intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Philosophy & Simulation Markets | Apex Intelligence',
    description: 'Cosmic think tank: TCG sandbox for Bostrom-inspired prediction markets.',
    images: ['/og/philosophy-simulation.png'],
  },
  keywords: [
    'simulation hypothesis',
    'Bostrom trilemma',
    'prediction markets',
    'EGGROLL training',
    'existential risk',
    'TCG market intelligence',
    'AI ethics',
    'longtermism',
  ],
};

export default function PhilosophyPage() {
  return (
    <div className="relative min-h-screen pt-24">
      {/* PhD Framework - Chapter 05: Discussion */}
      <DissertationChapterBadge
        chapter={DISSERTATION_CHAPTERS.DISCUSSION}
        variant="floating"
      />

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-8">
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
            <span className="block text-holographic">
              Philosophy
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            Sentient-first systems. Radical transparency. Allergic to hype.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="CORE DOCTRINE" classification="ROGUE THINK TANK // APEX PHILOSOPHY">
            {/* Humans First / Sentient Beings First */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
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
                  <h3 className="text-lg font-bold text-white mb-3 font-sans">HUMANS FIRST</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We prioritize the safety, clarity, and well-being of the people who use our tools and read our work. We assume humans are messy, distracted, and imperfect—and design systems that work <em>because</em> of that reality, not in spite of it.
                  </p>
                </div>

                {/* Sentient Beings Card */}
                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-sans">SENTIENT BEINGS FIRST</h3>
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
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
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
                    <h4 className="text-white font-sans font-bold mb-4">When applying AI to biological data, we ask:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 font-sans">01</span>
                        <p className="text-slate-400">Are we increasing understanding, or just extracting more value?</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 font-sans">02</span>
                        <p className="text-slate-400">Are we reducing stress, harm, and confusion for animals—or increasing it?</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <span className="text-cyan-400 font-sans">03</span>
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
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-cyan-400">[</span> THE ROGUE THINK TANK <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <h3 className="text-lg font-bold text-white mb-3 font-sans text-cyan-400">NOT A UNIVERSITY LAB</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We combine market-grade data analysis from the TCG world with research-grade caution from AI safety and animal ethics.
                  </p>
                </div>

                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-purple-400/60 transition-all">
                  <h3 className="text-lg font-bold text-white mb-3 font-sans text-purple-400">NOT A CORPORATE DIVISION</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We prefer dispatches, dossiers, and public notes over glossy PR. We build tools that are brutally honest about their limits.
                  </p>
                </div>

                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <h3 className="text-lg font-bold text-white mb-3 font-sans text-cyan-400">INTENTIONALLY SMALL</h3>
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
              <h2 className="text-xl font-bold tracking-wider text-white font-sans">
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
                  <h3 className="text-lg font-bold text-white font-sans">NO HARMFUL INSTRUCTIONS</h3>
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
                  <h3 className="text-lg font-bold text-white font-sans">STRESS AND SAFETY FIRST</h3>
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
                  <h3 className="text-lg font-bold text-white font-sans">TRANSPARENCY ABOUT LIMITS</h3>
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
                  <h3 className="text-lg font-bold text-white font-sans">SENTIENT-FIRST DECISIONS</h3>
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

      {/* Pattern Recognition Case Study: Fibonacci */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="PATTERN RECOGNITION CASE STUDY" classification="METHODOLOGICAL NOTE // THINK CRITICALLY">
            {/* Section Header with Framing */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-emerald-400">[</span> FIBONACCI &amp; THE LIMITS OF PATTERN-THINKING <span className="text-emerald-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-4 mb-6">
                <p className="text-amber-200/80 text-sm leading-relaxed">
                  <span className="font-bold text-amber-400">Why this section exists:</span> The Fibonacci sequence is a useful <em>case study</em> in pattern recognition—not &ldquo;the secret code of the universe.&rdquo; We include it to teach ourselves (and you) how to think about patterns responsibly, and where that thinking goes wrong.
                </p>
              </div>
            </div>

            {/* Main Fibonacci Content */}
            <div className="relative border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden mb-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Infinity className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans">Patterns as Compression Heuristics</h3>
                    <p className="text-slate-400 text-sm">Understanding where Fibonacci actually helps—and where it misleads</p>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed mb-6">
                  The <span className="text-emerald-400 font-semibold">Fibonacci sequence</span> (1, 1, 2, 3, 5, 8, 13...) and the <span className="text-cyan-400 font-semibold">Golden Ratio</span> (φ ≈ 1.618) appear in some biological systems as efficient solutions to growth and packing problems. This makes them useful for <em>hypothesis generation</em>—but they are not universal laws, and forcing data into Fibonacci patterns leads to bad science.
                </p>

                {/* Fibonacci Pattern Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {/* Biology Card */}
                  <div className="border border-emerald-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                      <Dna className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-emerald-400">BIOLOGICAL SYSTEMS</h4>
                    <ul className="space-y-1 text-slate-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">→</span>
                        DNA helix: 34Å/21Å pitch ≈ φ
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">→</span>
                        Neuron branching patterns
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400">→</span>
                        Bone proportions for strength
                      </li>
                    </ul>
                  </div>

                  {/* Animal Patterns Card */}
                  <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-3">
                      <Shell className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-cyan-400">ANIMAL PATTERNS</h4>
                    <ul className="space-y-1 text-slate-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">→</span>
                        Honeybee ancestry (haplodiploidy)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">→</span>
                        Shell spirals &amp; efficient packing
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">→</span>
                        X chromosome inheritance
                      </li>
                    </ul>
                  </div>

                  {/* AI/Cognition Card */}
                  <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-3">
                      <Network className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-purple-400">AI &amp; COGNITION</h4>
                    <ul className="space-y-1 text-slate-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">→</span>
                        Recursive optimization patterns
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">→</span>
                        RAG hierarchy efficiency
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">→</span>
                        Emergent market wave structures
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Image Gallery */}
                <div className="mb-8">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-sans">
                    Fibonacci in Nature: Visual Examples (not universal laws)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Nautilus Shell */}
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 group">
                      <Image
                        src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop"
                        alt="Nautilus shell showing golden spiral"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-sans">NAUTILUS SPIRAL</span>
                    </div>

                    {/* Sunflower Seeds */}
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 group">
                      <Image
                        src="https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=300&h=300&fit=crop"
                        alt="Sunflower seed pattern showing Fibonacci spirals"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-sans">SUNFLOWER SPIRALS</span>
                    </div>

                    {/* Romanesco Broccoli */}
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 group">
                      <Image
                        src="https://images.unsplash.com/photo-1583338917451-face2751d8d5?w=300&h=300&fit=crop"
                        alt="Romanesco broccoli fractal pattern"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-sans">ROMANESCO FRACTAL</span>
                    </div>

                    {/* Pine Cone */}
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 group">
                      <Image
                        src="https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=300&h=300&fit=crop"
                        alt="Pine cone spiral pattern"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-sans">PINE CONE SPIRAL</span>
                    </div>

                    {/* Galaxy Spiral */}
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 group">
                      <Image
                        src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=300&fit=crop"
                        alt="Galaxy spiral pattern"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-sans">GALACTIC SPIRAL</span>
                    </div>
                  </div>
                </div>

                {/* Improved Trade-off Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border border-green-500/30 bg-green-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 font-sans text-sm font-bold">✓ GOOD</span>
                      <span className="text-slate-400 text-sm">When patterns help</span>
                    </div>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li>• <span className="text-green-300">Compression heuristic:</span> Fibonacci as shorthand for &ldquo;efficient biological packing&rdquo;</li>
                      <li>• <span className="text-green-300">Hypothesis generation:</span> Noticing recurring structure can guide research questions</li>
                      <li>• <span className="text-green-300">Cross-domain intuition:</span> Similar math in different systems prompts investigation</li>
                    </ul>
                  </div>

                  <div className="border border-red-500/30 bg-red-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-400 font-sans text-sm font-bold">✗ CAUTION</span>
                      <span className="text-slate-400 text-sm">When patterns mislead</span>
                    </div>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li>• <span className="text-red-300">Apophenia/overfitting:</span> Seeing Fibonacci everywhere because you expect it</li>
                      <li>• <span className="text-red-300">Fake evidence:</span> Using pretty math to &ldquo;prove&rdquo; claims it doesn&apos;t actually support</li>
                      <li>• <span className="text-red-300">TCG trap:</span> Overfitting backtests to &ldquo;holy grail&rdquo; patterns that don&apos;t generalize</li>
                      <li>• <span className="text-red-300">Bioacoustics risk:</span> Reading too much into noisy animal signal correlations</li>
                    </ul>
                  </div>
                </div>

                <p className="text-slate-500 text-sm italic text-center">
                  This case study bridges our TCG market wave analysis to biological AI research—always with the caveat that pattern recognition requires skepticism, not reverence.
                </p>
              </div>
            </div>

            {/* RAG Research Form */}
            <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-md font-bold text-white font-sans">FIBONACCI RESEARCH CONSOLE</h4>
                  <p className="text-slate-500 text-xs">Query our curated docs on Fibonacci in biology—grounded in real research, not numerology</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4 border-l-2 border-cyan-500/50 pl-3">
                Search our curated knowledge base for how researchers actually talk about Fibonacci in biology. Results come from vetted sources—not the open web. We don&apos;t answer queries about harming humans or animals.
              </p>
              <FibonacciResearch />
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* AI Deregulation & Ethical Risks Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="AI DEREGULATION & ETHICAL RISKS" classification="CORPORATE CAPTURE // SENTIENT FUTURES">
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-red-400">[</span> BIG TECH&apos;S DEREGULATION PUSH <span className="text-red-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              </div>

              <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-200/80 text-sm leading-relaxed">
                  <span className="font-bold text-red-400">Why this section exists:</span> As AI systems touch more sentient beings—from biased hiring algorithms to animal welfare research—we must be clear-eyed about how corporate lobbying shapes (or prevents) regulation. This is not anti-tech; it&apos;s pro-accountability.
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="relative border border-red-500/40 bg-gradient-to-br from-red-950/30 to-orange-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden mb-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans">The Lobbying Arms Race</h3>
                    <p className="text-slate-400 text-sm">How AI companies resist accountability at scale</p>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed mb-6">
                  AI companies like <span className="text-red-400 font-semibold">OpenAI</span>, <span className="text-orange-400 font-semibold">Microsoft</span>, and <span className="text-cyan-400 font-semibold">Meta</span> have dramatically increased lobbying expenditures to create a &ldquo;no rules&rdquo; environment. In 2024, <span className="text-white font-bold">648 companies lobbied on AI</span> (141% YoY increase), spending $1.2M+ in H1 2025 alone.
                </p>

                {/* Key Metrics Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {/* Lobbying Expenditure */}
                  <div className="border border-red-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3">
                      <DollarSign className="w-5 h-5 text-red-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-red-400">SPENDING SURGE</h4>
                    <ul className="space-y-1 text-slate-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">→</span>
                        OpenAI: $620K Q2 2025 (+30% YoY)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">→</span>
                        648 firms lobbying (+141% from 2023)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">→</span>
                        $1.2M+ spent in H1 2025 alone
                      </li>
                    </ul>
                  </div>

                  {/* Tactics */}
                  <div className="border border-orange-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-orange-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-orange-400">LOBBYING TACTICS</h4>
                    <ul className="space-y-1 text-slate-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">→</span>
                        Push for 10-year state regulation bans
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">→</span>
                        Weaken EU AI Act provisions
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400">→</span>
                        Fund academic research to shape policy
                      </li>
                    </ul>
                  </div>

                  {/* AGI Redefinition */}
                  <div className="border border-yellow-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center mb-3">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-yellow-400">AGI REDEFINITION</h4>
                    <ul className="space-y-1 text-slate-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">→</span>
                        AGI = $100B revenue, not safety
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">→</span>
                        &ldquo;China threat&rdquo; as deregulation cover
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">→</span>
                        $200B+ investment, no profit path
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Visual Evidence - Lobbying Charts */}
                <div className="mb-8">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-sans">
                    The Scale of Corporate Influence: Visual Evidence
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Lobbying Growth Chart Placeholder */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700/50 group bg-slate-900/80">
                      <Image
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                        alt="Data visualization showing AI lobbying expenditure growth"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <TrendingUp className="w-8 h-8 text-red-400 mb-2" />
                        <span className="text-xs text-white/90 font-sans text-center font-bold">141% YoY INCREASE</span>
                        <span className="text-[10px] text-slate-400 mt-1">2023-2024 Lobbying Firms</span>
                      </div>
                    </div>

                    {/* AGI Money Meme */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700/50 group bg-slate-900/80">
                      <Image
                        src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop"
                        alt="Conceptual image of profit-driven AGI development"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <DollarSign className="w-8 h-8 text-yellow-400 mb-2" />
                        <span className="text-xs text-white/90 font-sans text-center font-bold">AGI = $100B PROFITS</span>
                        <span className="text-[10px] text-slate-400 mt-1">Not Safety, Not Sentience</span>
                      </div>
                    </div>

                    {/* China AI Framework */}
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700/50 group bg-slate-900/80">
                      <Image
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop"
                        alt="Global AI regulatory landscape showing China's framework"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <Ban className="w-8 h-8 text-cyan-400 mb-2" />
                        <span className="text-xs text-white/90 font-sans text-center font-bold">&ldquo;CHINA THREAT&rdquo;</span>
                        <span className="text-[10px] text-slate-400 mt-1">Pretext for Deregulation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Motivations */}
                <div className="border-l-4 border-orange-500 bg-orange-950/20 rounded-r-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-400" />
                    Financial Motivations & The AGI Profit Trap
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    OpenAI&apos;s deal with Microsoft ties <span className="text-orange-400 font-bold">AGI achievement</span> to <span className="text-white font-bold">$100B revenue</span>—not societal benefit or safety benchmarks. This creates perverse incentives: declare AGI prematurely to escape oversight, or delay safety measures to maximize profits.
                  </p>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      $200B+ investments with no profitability path in sight
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      Block antitrust/IP rules to use copyrighted data freely
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      Use &ldquo;China threat&rdquo; rhetoric despite China&apos;s robust AI framework
                    </li>
                  </ul>
                </div>

                {/* Risks to Sentient Beings */}
                <div className="border-l-4 border-red-500 bg-red-950/20 rounded-r-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Risks to Sentient Beings & Society
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    AI opacity enables violations of existing laws (civil rights, labor, animal welfare) without detection. Unregulated AI in hiring, loans, medicine, and animal research can perpetuate bias and harm—consolidating power without accountability.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-red-400 font-bold text-xs uppercase tracking-wider">Human Impact</span>
                      <ul className="space-y-1 text-slate-400 text-sm mt-2">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">→</span>
                          Biased hiring/lending decisions
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">→</span>
                          Labor displacement without safety nets
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">→</span>
                          Medical misdiagnosis from flawed models
                        </li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold text-xs uppercase tracking-wider">Sentient Beings Impact</span>
                      <ul className="space-y-1 text-slate-400 text-sm mt-2">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          AI-driven factory farming optimization
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          Misinterpreted bioacoustic signals
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400">→</span>
                          Unethical animal research automation
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Trade-off Analysis */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border border-red-500/30 bg-red-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-red-400 font-sans text-sm font-bold">✗ DEREGULATION RISKS</span>
                    </div>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li>• <span className="text-red-300">Corporate monopoly:</span> Consolidates power in Big Tech, stifles competition</li>
                      <li>• <span className="text-red-300">Opacity shield:</span> Black-box decisions evade civil rights/labor laws</li>
                      <li>• <span className="text-red-300">Sentience harm:</span> Enables biased AI in animal welfare and medical research</li>
                      <li>• <span className="text-red-300">Profit over safety:</span> AGI tied to revenue, not ethical benchmarks</li>
                    </ul>
                  </div>

                  <div className="border border-green-500/30 bg-green-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 font-sans text-sm font-bold">✓ BALANCED REGULATION</span>
                    </div>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li>• <span className="text-green-300">Transparency mandates:</span> Require explainable AI in high-stakes decisions</li>
                      <li>• <span className="text-green-300">Ethical benchmarks:</span> Tie AGI to safety/welfare, not just revenue</li>
                      <li>• <span className="text-green-300">Antitrust enforcement:</span> Prevent monopolistic data/compute concentration</li>
                      <li>• <span className="text-green-300">Public oversight:</span> Independent audits for AI touching sentient beings</li>
                    </ul>
                  </div>
                </div>

                {/* Connection to Apex Philosophy */}
                <div className="border border-cyan-500/30 bg-cyan-950/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-cyan-400" />
                    <h4 className="text-md font-bold text-white font-sans">Why This Matters for Apex Intelligence</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    Our <span className="text-cyan-400 font-bold">&ldquo;Sentient Beings First&rdquo;</span> philosophy requires acknowledging how corporate lobbying shapes AI deployment—especially in domains touching animal welfare, bioacoustics, and ethical research. If OpenAI can redefine AGI for profit, they can redefine &ldquo;safe&rdquo; AI for animals or humans without accountability.
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed italic">
                    We advocate for the <span className="text-white">EU AI Act model</span>: risk-based regulation, transparency requirements, and independent oversight. Innovation thrives under clear rules—what doesn&apos;t thrive is unchecked corporate power over sentient futures.
                  </p>
                </div>
              </div>
            </div>

            {/* RAG Research Console for AI Lobbying */}
            <div className="border border-red-500/30 bg-slate-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h4 className="text-md font-bold text-white font-sans">AI LOBBYING RESEARCH CONSOLE</h4>
                  <p className="text-slate-500 text-xs">Query our curated research on corporate AI lobbying—grounded in verified sources</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4 border-l-2 border-red-500/50 pl-3">
                Search for verified research on AI lobbying tactics, financial stakes, and regulatory capture. This console uses the same RAG system as Fibonacci research, but focused on corporate accountability. Try queries like: <span className="text-red-400 font-sans">&ldquo;OpenAI lobbying expenditures&rdquo;</span> or <span className="text-orange-400 font-sans">&ldquo;AGI profit redefinition&rdquo;</span>
              </p>
              <FibonacciResearch />
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Simulation Theory & Markets Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="SIMULATION THEORY & MARKETS" classification="COSMIC THINK TANK // BOSTROM FRAMEWORK">
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-violet-400">[</span> BOSTROM&apos;S TRILEMMA &amp; PREDICTION MARKETS <span className="text-violet-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              </div>

              <div className="bg-violet-950/20 border border-violet-500/30 rounded-lg p-4 mb-6">
                <p className="text-violet-200/80 text-sm leading-relaxed">
                  <span className="font-bold text-violet-400">Why this section exists:</span> Nick Bostrom&apos;s simulation argument provides a philosophical framework for thinking about uncertainty, prediction, and the future of intelligence. We apply these concepts to TCG markets as &ldquo;simulation markets&rdquo;—not as metaphysics, but as a rigorous approach to prediction under uncertainty.
                </p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="relative border border-violet-500/40 bg-gradient-to-br from-violet-950/30 to-indigo-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden mb-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                    <Box className="w-7 h-7 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-sans">The Simulation Argument</h3>
                    <p className="text-slate-400 text-sm">Bostrom&apos;s 2003 trilemma and its implications</p>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed mb-6">
                  Nick Bostrom&apos;s <span className="text-violet-400 font-semibold">simulation argument</span> presents a trilemma: either (1) civilizations go extinct before reaching a posthuman stage, (2) posthumans have no interest in running ancestor simulations, or (3) we are almost certainly in a simulation. If posthuman civilizations run simulations, the probability we&apos;re in one approaches <span className="text-white font-bold">99.9%</span>.
                </p>

                {/* Trilemma Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {/* Extinction Scenario */}
                  <div className="border border-red-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-red-400">EXTINCTION</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Civilizations go extinct before reaching posthuman stage. In markets: collapse scenarios, mass delisting, regulatory shutdown.
                    </p>
                  </div>

                  {/* No Simulation Scenario */}
                  <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-3">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-cyan-400">NO SIMULATION</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Posthumans choose not to run simulations. In markets: stable but uninnovative, flat growth, consolidation phases.
                    </p>
                  </div>

                  {/* In Simulation Scenario */}
                  <div className="border border-violet-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mb-3">
                      <Sparkles 
                        className="w-5 h-5" 
                        strokeWidth={2.5} 
                        fill="none"
                        stroke="#a855f7"
                        style={{
                          filter: 'drop-shadow(0 0 6px #a855f7) drop-shadow(0 0 12px #06b6d4)'
                        }}
                      />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-sans text-violet-400">IN SIMULATION</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      We&apos;re in a simulation. In markets: outlier events, exponential growth, &ldquo;black swan&rdquo; breakouts.
                    </p>
                  </div>
                </div>

                {/* Future of Humanity Connection */}
                <div className="border-l-4 border-indigo-500 bg-indigo-950/20 rounded-r-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Future of Humanity Institute &amp; Cosmos Institute
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    The <span className="text-indigo-400 font-bold">Future of Humanity Institute</span> (FHI), founded by Bostrom in 2005, pioneered existential risk research and AI alignment. After FHI&apos;s closure in 2024, organizations like <span className="text-violet-400 font-bold">Cosmos Institute</span> continue the work—emphasizing &ldquo;philosopher-builders&rdquo; for AI flourishing.
                  </p>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      FHI contributions: Existential risk frameworks, AI safety research, whole brain emulation
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Bostrom&apos;s 2025 warnings: AI superintelligence and unemployment/dignity crises
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      Cosmos Institute approach: Building systems that promote flourishing
                    </li>
                  </ul>
                </div>

                {/* EGGROLL Training Section */}
                <div className="border-l-4 border-indigo-500 bg-indigo-950/20 rounded-r-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    EGGROLL Training Methodology
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    <span className="text-indigo-400 font-bold">EGGROLL</span> (Evolutionary Gradient-free Gradient-like Rollout) enables stable prediction models without traditional backpropagation—using integer-weight evolution for reduced hallucinations.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Advantages</span>
                      <ul className="space-y-1 text-slate-400 text-sm mt-2">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          Low compute (no gradients)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          Stable integer-weight representations
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          Reduced hallucinations in forecasts
                        </li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-orange-400 font-bold text-xs uppercase tracking-wider">Trade-offs</span>
                      <ul className="space-y-1 text-slate-400 text-sm mt-2">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400">⚠</span>
                          Less precise than full backprop
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400">⚠</span>
                          Best for initial models
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400">⚠</span>
                          Fine-tune with LoRA for precision
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Simulation Markets Application */}
                <div className="border-l-4 border-violet-500 bg-violet-950/20 rounded-r-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-violet-400" />
                    TCG Simulation Markets
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    We apply Bostrom&apos;s framework to TCG markets as <span className="text-violet-400 font-bold">simulation markets</span>—treating market prediction like simulated scenarios. Like fantasy football or prediction markets (PredictionStrike, DraftSharks), users can explore outcomes in a virtual environment.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-violet-400 font-bold text-xs uppercase tracking-wider">Methodology</span>
                      <ul className="space-y-1 text-slate-400 text-sm mt-2">
                        <li className="flex items-start gap-2">
                          <span className="text-violet-400">→</span>
                          Monte Carlo simulations for price distributions
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-violet-400">→</span>
                          RAG-Fusion for market context retrieval
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-violet-400">→</span>
                          Confidence intervals, not point estimates
                        </li>
                      </ul>
                    </div>
                    <div>
                      <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider">Benchmarks</span>
                      <ul className="space-y-1 text-slate-400 text-sm mt-2">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400">→</span>
                          MTBBench: 9-11% accuracy gains with tools
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400">→</span>
                          EGGROLL: Evolution-based gradient-free training
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400">→</span>
                          Multimodal agents for sequential decisions
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Prediction Markets Integration */}
                <div className="border-l-4 border-cyan-500 bg-cyan-950/20 rounded-r-lg p-6 mb-6">
                  <h4 className="text-lg font-bold text-white mb-3 font-sans flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    Prediction Markets Integration
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    We integrate with major prediction market platforms for real-time probability calibration:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <span className="text-cyan-400 font-bold text-sm">Manifold</span>
                      <p className="text-slate-500 text-xs mt-1">Play-money markets for calibration training</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <span className="text-purple-400 font-bold text-sm">Polymarket</span>
                      <p className="text-slate-500 text-xs mt-1">Crypto-based real-stakes forecasts</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <span className="text-emerald-400 font-bold text-sm">Kalshi</span>
                      <p className="text-slate-500 text-xs mt-1">CFTC-regulated event contracts</p>
                    </div>
                  </div>
                </div>

                {/* Trade-off Analysis */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border border-green-500/30 bg-green-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 font-sans text-sm font-bold">✓ GOOD</span>
                      <span className="text-slate-400 text-sm">When simulation thinking helps</span>
                    </div>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li>• <span className="text-green-300">Uncertainty framework:</span> Forces explicit probability thinking</li>
                      <li>• <span className="text-green-300">Outlier detection:</span> &ldquo;Simulation&rdquo; scenarios flag black swans</li>
                      <li>• <span className="text-green-300">Prediction accuracy:</span> Tool-using agents show 9-11% gains</li>
                      <li>• <span className="text-green-300">Engagement:</span> Fantasy-market model increases user participation</li>
                    </ul>
                  </div>

                  <div className="border border-amber-500/30 bg-amber-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-amber-400 font-sans text-sm font-bold">⚠ CAUTION</span>
                      <span className="text-slate-400 text-sm">When simulation thinking misleads</span>
                    </div>
                    <ul className="space-y-2 text-slate-400 text-sm">
                      <li>• <span className="text-amber-300">Unfalsifiability:</span> Simulation hypothesis can&apos;t be empirically tested</li>
                      <li>• <span className="text-amber-300">Compute costs:</span> Complex models require significant resources</li>
                      <li>• <span className="text-amber-300">Overconfidence:</span> Probability estimates can create false precision</li>
                      <li>• <span className="text-amber-300">Ethical risks:</span> Prediction markets can enable manipulation</li>
                    </ul>
                  </div>
                </div>

                {/* Ethical Framework */}
                <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-emerald-400" />
                    <h4 className="text-md font-bold text-white font-sans">FHI Longtermism Alignment</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">
                    Our simulation markets align with the <span className="text-emerald-400 font-bold">Future of Humanity Institute&apos;s</span> longtermist ethics:
                  </p>
                  <ul className="space-y-2 text-slate-400 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><span className="text-white">Flourishing focus:</span> Simulations explore positive futures, not just doom scenarios</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><span className="text-white">Manipulation safeguards:</span> JWT/MFA authentication prevents market gaming</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      <span><span className="text-white">Sentient welfare:</span> Consider digital minds in simulations as potential moral patients</span>
                    </li>
                  </ul>
                </div>

                <p className="text-slate-500 text-sm italic text-center mt-6">
                  Apex Intelligence uses simulation theory as a <em>framework</em> for prediction under uncertainty—not metaphysics. We ground all predictions in empirical data while acknowledging the limits of any model.
                </p>
              </div>
            </div>

            {/* RAG Research Console for Simulation Theory */}
            <div className="border border-violet-500/30 bg-slate-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="text-md font-bold text-white font-sans">SIMULATION THEORY RESEARCH CONSOLE</h4>
                  <p className="text-slate-500 text-xs">Query our curated research on simulation theory, EGGROLL training, FHI, and prediction markets</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4 border-l-2 border-violet-500/50 pl-3">
                Search for research on Bostrom&apos;s trilemma, Future of Humanity Institute, EGGROLL methodology, or prediction markets. Try queries like: <span className="text-violet-400 font-sans">&ldquo;Bostrom simulation argument&rdquo;</span> or <span className="text-indigo-400 font-sans">&ldquo;EGGROLL training methodology&rdquo;</span>
              </p>
              <FibonacciResearch />
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
                <h2 className="text-2xl font-bold text-white font-sans">FROM TCG INTEL TO BIOLOGICAL SCIENCE</h2>
              </div>

              <p className="text-slate-300 mb-6 leading-relaxed">
                Why start from trading card games at all? Because TCG markets give us a <span className="text-cyan-400 font-bold">sandbox</span>:
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-cyan-400 font-sans text-sm">→</span>
                    Online, fully observable, high-frequency behavior
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-cyan-400 font-sans text-sm">→</span>
                    Real stakes, but contained risk
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-cyan-400 font-sans text-sm">→</span>
                    Perfect for stress-testing forecasting methods
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-purple-400 font-sans text-sm">→</span>
                    Data pipeline validation
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-purple-400 font-sans text-sm">→</span>
                    Model calibration training ground
                  </li>
                  <li className="flex items-start gap-3 text-slate-400">
                    <span className="text-purple-400 font-sans text-sm">→</span>
                    Human–AI collaboration experiments
                  </li>
                </ul>
              </div>

              <p className="text-slate-400 leading-relaxed mb-6">
                As we mature, the same habits we hone in TCG—<span className="text-white">ruthless transparency</span>, <span className="text-white">careful error analysis</span>, and a <span className="text-white">refusal to overclaim</span>—become the habits we need when working on AI + biological science + animal welfare.
              </p>

              <div className="border-t border-slate-700/50 pt-6 text-center">
                <p className="text-slate-500 text-sm font-sans">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            EXPLORE FURTHER
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
            Ready to Go Deeper?
          </h2>

          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Explore our research streams, meet the team, or join the network.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/lab"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-sans"
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
