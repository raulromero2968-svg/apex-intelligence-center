import Link from 'next/link';
import Image from 'next/image';
import { Brain, Heart, Eye, Shield, Microscope, FileWarning, Scale, Zap, Infinity, Dna, Network, Shell } from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { FibonacciResearch } from '@/components/philosophy/FibonacciResearch';

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

      {/* Core Philosophy Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="CORE DOCTRINE" classification="ROGUE THINK TANK // APEX PHILOSOPHY">
            {/* Humans First / Sentient Beings First */}
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

      {/* Pattern Recognition Case Study: Fibonacci */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="PATTERN RECOGNITION CASE STUDY" classification="METHODOLOGICAL NOTE // THINK CRITICALLY">
            {/* Section Header with Framing */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-mono">
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
                    <h3 className="text-xl font-bold text-white font-mono">Patterns as Compression Heuristics</h3>
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
                    <h4 className="text-md font-bold text-white mb-2 font-mono text-emerald-400">BIOLOGICAL SYSTEMS</h4>
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
                    <h4 className="text-md font-bold text-white mb-2 font-mono text-cyan-400">ANIMAL PATTERNS</h4>
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
                    <h4 className="text-md font-bold text-white mb-2 font-mono text-purple-400">AI &amp; COGNITION</h4>
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
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-mono">
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
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-mono">NAUTILUS SPIRAL</span>
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
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-mono">SUNFLOWER SPIRALS</span>
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
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-mono">ROMANESCO FRACTAL</span>
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
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-mono">PINE CONE SPIRAL</span>
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
                      <span className="absolute bottom-2 left-2 text-[10px] text-white/80 font-mono">GALACTIC SPIRAL</span>
                    </div>
                  </div>
                </div>

                {/* Improved Trade-off Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border border-green-500/30 bg-green-950/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 font-mono text-sm font-bold">✓ GOOD</span>
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
                      <span className="text-red-400 font-mono text-sm font-bold">✗ CAUTION</span>
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
                  <h4 className="text-md font-bold text-white font-mono">FIBONACCI RESEARCH CONSOLE</h4>
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
