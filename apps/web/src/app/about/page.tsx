import Link from 'next/link';
import { Twitter, Linkedin, Instagram, Github, Target, Shield, Zap, Users } from 'lucide-react';
import { SOCIAL_PROFILES } from '@/lib/constants';

export const revalidate = 3600;

export const metadata = {
  title: "Mission Briefing | Apex Intelligence",
  description: "Learn about Apex Intelligence - institutional-grade TCG market intelligence built for speed, accuracy, and edge.",
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
              Mission
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
              Briefing
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Institutional-grade TCG market intelligence. Built for speed, accuracy, and edge.
            <span className="inline-block w-3 h-5 bg-cyan-400 ml-1 animate-pulse align-middle" />
          </p>
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
                The TCG market is a multi-billion dollar industry hiding in plain sight. While Wall Street sleeps on collectibles,
                serious collectors are building generational wealth. We provide the intelligence infrastructure they need.
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
        <div className="max-w-3xl mx-auto text-center">
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
            Get exclusive market intelligence delivered weekly. No spam, just alpha.
          </p>

          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)]"
          >
            GET ALPHA ACCESS
          </Link>
        </div>
      </section>
    </div>
  );
}
