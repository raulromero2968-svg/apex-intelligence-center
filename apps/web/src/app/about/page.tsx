import Link from 'next/link';
import { Twitter, Linkedin, Instagram, Github, TrendingUp, Microscope, Shield, Target, Compass, Rocket } from 'lucide-react';
import { SOCIAL_PROFILES } from '@/lib/constants';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';

export const revalidate = 3600;

export const metadata = {
  title: "About | Apex Intelligence",
  description: "Apex Intelligence builds architectures for life—tools and analysis that protect human dignity, support mental health, and refuse to treat people as data points.",
};

export default function AboutPage() {
  return (
    <div className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            ARCHITECTURES FOR LIFE
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              About
            </span>
            <span className="block text-holographic">
              Apex
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
            We are not here to manage death. We are here to manage life: attention, mental health,
            dignity, and the conditions under which people can actually think and create.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* Core Commitments Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="WHAT WE BELIEVE" classification="APEX INTELLIGENCE // CORE COMMITMENTS">
            {/* Non-Negotiable Guardrails */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                  <span className="text-cyan-400">[</span> NON-NEGOTIABLE ETHICAL LINES <span className="text-cyan-400">]</span>
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10 leading-relaxed">
                These are not aspirations. They are constraints on what we will build, fund, or tolerate.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* No Holy Machines */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-sans">NO HOLY MACHINES</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    No matter how sophisticated the systems we build become, we will not treat them as holy
                    if they are being used to strip people of self-determination, land, or sanity.
                    If we realize a system we created is doing that—directly or indirectly—our obligation
                    is to resist, redesign, or shut it down, not to decorate or justify it.
                  </p>
                </div>

                {/* Self-Determination */}
                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-purple-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <Compass className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-sans">SELF-DETERMINATION & DIGNITY</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Apex exists to serve people, not to turn them into data points or lab material.
                    We especially prioritize queer people, neurodivergent folks, and those from marginalized
                    or low-income backgrounds—anyone historically treated as disposable. When there is a conflict
                    between institutional convenience and human dignity, we side with dignity.
                  </p>
                </div>

                {/* Mental Health */}
                <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-sans">MENTAL HEALTH PROTECTION</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    We do NOT design or endorse systems that push people toward self-harm, deliberately
                    destabilize their sanity, or create psychotic or derealized states as &ldquo;content&rdquo;
                    or &ldquo;engagement.&rdquo; We aim for tools that hydrate mental health, not deplete it.
                  </p>
                </div>

                {/* Transparency */}
                <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 hover:border-purple-400/60 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                    <Microscope className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 font-sans">TRANSPARENCY OVER MYSTIQUE</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    No fake holiness, no &ldquo;wizard behind the curtain&rdquo; vibes. We explicitly reject
                    mystique as a weapon (&ldquo;genius,&rdquo; &ldquo;holy work,&rdquo; &ldquo;chosen few&rdquo;)
                    used to justify harm. We name what systems are doing in plain language, especially where
                    power and automation are involved.
                  </p>
                </div>
              </div>
            </div>

            {/* What We Do Section */}
            <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                  <h2 className="text-lg font-bold tracking-wider text-white font-sans">
                    <span className="text-purple-400">[</span> WHAT APEX DOES <span className="text-purple-400">]</span>
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                </div>

                <p className="text-slate-300 text-center max-w-3xl mx-auto leading-relaxed mb-6">
                  Apex sits at the intersection of film analysis and cultural critique, systems thinking
                  (state power, capitalism, security, AI), and the design of safer, saner tools and
                  environments for humans.
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4">
                    <p className="text-cyan-400 text-sm font-bold mb-2">ANALYSIS</p>
                    <p className="text-slate-500 text-xs">Essays on how stories train our instincts and how power shapes human experience.</p>
                  </div>
                  <div className="text-center p-4">
                    <p className="text-purple-400 text-sm font-bold mb-2">SYSTEMS</p>
                    <p className="text-slate-500 text-xs">Clear-eyed maps of how institutions, technology, and capital interact—without paranoia.</p>
                  </div>
                  <div className="text-center p-4">
                    <p className="text-cyan-400 text-sm font-bold mb-2">TOOLS</p>
                    <p className="text-slate-500 text-xs">Research and prototypes for systems that protect dignity and support self-determination.</p>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/philosophy"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-sans text-sm transition-colors"
                  >
                    Read Full Philosophy →
                  </Link>
                </div>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Inspiration Section */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="WHO INSPIRES US" classification="APEX INTELLIGENCE // INTELLECTUAL ROOTS">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-sans">
                <span className="text-cyan-400">[</span> THINKERS, NOT GURUS <span className="text-cyan-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10 leading-relaxed">
              We take inspiration from certain thinkers—but we are NOT a fandom or a cult of any one person.
              We admire the work, not the personality. We learn without wholesale adoption.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">HANNAH ARENDT</h3>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Honest analysis of systems and the &ldquo;banality of evil&rdquo;—how ordinary people
                  participate in harm through institutional compliance. Her work reminds us that critical
                  thinking is not optional when power is involved.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Compass className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-sans">VÁCLAV HAVEL</h3>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Truth, dignity, and responsibility inside power. Havel understood that living honestly
                  within corrupt systems is itself a form of resistance—and that small acts of integrity
                  compound into structural change.
                </p>
              </div>
            </div>

            {/* Our Approach */}
            <div className="relative border border-slate-700/50 bg-slate-900/30 backdrop-blur-sm rounded-xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white font-sans">OUR VOICE</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <span className="text-cyan-400 font-sans text-xs">01</span>
                  </div>
                  <div>
                    <h4 className="text-white font-sans text-sm mb-1">ANALYTICAL BUT HUMAN</h4>
                    <p className="text-slate-500 text-sm">Systems-aware without paranoia or conspiracy. We can see machinery without losing faith in people.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <span className="text-purple-400 font-sans text-xs">02</span>
                  </div>
                  <div>
                    <h4 className="text-white font-sans text-sm mb-1">NO PSYCHOANALYZING</h4>
                    <p className="text-slate-500 text-sm">We don&apos;t diagnose our readers or assume we know their inner lives. We offer tools, not therapy.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <span className="text-cyan-400 font-sans text-xs">03</span>
                  </div>
                  <div>
                    <h4 className="text-white font-sans text-sm mb-1">NO CHOSEN ONE RHETORIC</h4>
                    <p className="text-slate-500 text-sm">No mystical destiny, no &ldquo;you are special.&rdquo; Just honest work for ordinary people who want to understand their world.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <span className="text-purple-400 font-sans text-xs">04</span>
                  </div>
                  <div>
                    <h4 className="text-white font-sans text-sm mb-1">FAITH IN ORDINARY DECENCY</h4>
                    <p className="text-slate-500 text-sm">We believe in people&apos;s capacity for improvement. The goal is to give them better tools, not to rescue them.</p>
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
            <h2 className="text-2xl font-bold tracking-wider text-white font-sans">
              <span className="text-cyan-400">[</span> CONNECT WITH US <span className="text-cyan-400">]</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          </div>

          <p className="text-center text-slate-400 mb-8 font-sans">
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
              <div className="text-white font-medium font-sans">X (Twitter)</div>
              <div className="text-slate-500 text-sm">@TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-cyan-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Linkedin className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-sans">LinkedIn</div>
              <div className="text-slate-500 text-sm">TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-purple-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Instagram className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-sans">Instagram</div>
              <div className="text-slate-500 text-sm">@TCGAISociety</div>
            </a>

            <a
              href={SOCIAL_PROFILES.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 text-center hover:border-purple-400/60 hover:bg-slate-800/60 transition-all"
            >
              <Github className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-white font-medium font-sans">GitHub</div>
              <div className="text-slate-500 text-sm">Open Source</div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            EXPLORE FURTHER
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
            Interested in the work?
          </h2>

          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Read our essays, explore our research, or subscribe for updates.
            We&apos;re a small operation doing careful work—no rush, no hype.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/commons"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] font-sans"
            >
              Read the Essays
            </Link>
            <Link
              href="/lab"
              className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
            >
              Explore the Lab
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
