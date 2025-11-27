'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Book, Shield, Sparkles } from 'lucide-react';
import RouteTransition from '@/layout/RouteTransition';
import { NoteOnHeroes } from '@/components/commons/NoteOnHeroes';
import { ShadowReflexTest } from '@/components/commons/ShadowReflexTest';
import { FoundersOath } from '@/components/commons/FoundersOath';

/**
 * Apex Commons - The User Journey
 *
 * This page implements the "Skeptical Builder" user journey:
 * 1. Discovery (Hero) - The hook that feels different
 * 2. Landing (Note on Heroes) - The vibe check that lowers defenses
 * 3. Engagement (Shadow Reflex Test) - Immediate, useful value
 * 4. Deepening (Founder's Oath) - The honest connection
 * 5. Retention (Subscribe) - The invitation to return
 */
export default function CommonsPage() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with actual subscription service
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <RouteTransition>
      <div className="min-h-screen">
        <main className="space-y-0">
          {/* Phase 1: Discovery - The Hook */}
          <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
            {/* Transmutation gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-cyan-950/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(0,0,0,0))]" />

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 px-6">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-medium backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                A Public Commons for Better Systems
              </div>

              {/* Hero text */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="text-white">Build Tools,</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400">
                  Not Temples
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                A library of frameworks for people tired of tech savior narratives.
                For builders who are wary of cults and afraid of building harmful systems.
              </p>

              {/* Key differentiator */}
              <div className="pt-8 space-y-6">
                <div className="inline-flex flex-col sm:flex-row gap-4">
                  <Link
                    href="#note-on-heroes"
                    className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-8 py-4 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Shield className="w-5 h-5" />
                    See Our Values
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="#shadow-reflex"
                    className="inline-flex items-center justify-center gap-2 bg-slate-900/50 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-white font-medium px-8 py-4 rounded-lg transition-all backdrop-blur-sm"
                  >
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    Try a Tool (Free)
                  </Link>
                </div>

                <p className="text-sm text-slate-500 italic">
                  No gurus. No worship. Just honest tools for a healing nation.
                </p>
              </div>

              {/* Social proof reimagined */}
              <div className="flex flex-wrap gap-8 justify-center pt-12 border-t border-slate-800/50 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    Open Source
                  </div>
                  <div className="text-sm text-slate-500">All frameworks are public</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-orange-400">
                    No Paywalls
                  </div>
                  <div className="text-sm text-slate-500">Tools are free to use</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400">
                    Anti-Idolatry
                  </div>
                  <div className="text-sm text-slate-500">Admire work, not people</div>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2: Landing - The Vibe Check (Note on Heroes) */}
          <div id="note-on-heroes" className="scroll-mt-20">
            <NoteOnHeroes />
          </div>

          {/* Phase 3: Engagement - The Tool (Shadow Reflex Test) */}
          <div id="shadow-reflex" className="scroll-mt-20">
            <ShadowReflexTest />
          </div>

          {/* Phase 4: Deepening - The Oath */}
          <div id="founders-oath" className="scroll-mt-20">
            <FoundersOath />
          </div>

          {/* Phase 5: Retention - The Return */}
          <section className="relative max-w-4xl mx-auto px-6 py-24">
            <div className="relative border border-slate-700/50 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/50 backdrop-blur-sm p-12 md:p-16 text-center space-y-8 overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-orange-500/5 rounded-2xl" />

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 mx-auto">
                  <Book className="w-8 h-8 text-cyan-400" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Join the Commons
                </h2>

                <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Get updates when we add new tools, frameworks, and essays.
                  We send useful content, not hype. Unsubscribe anytime.
                </p>

                <form onSubmit={handleSubscribe} className="max-w-md mx-auto space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-lg shadow-cyan-500/20"
                    >
                      Subscribe
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    No spam. No guru worship. Just tools for building better systems.
                  </p>
                </form>

                {/* Return promise */}
                <div className="pt-8 border-t border-slate-700/50">
                  <p className="text-sm text-slate-400 italic">
                    Return when your team is in crisis. Return when you need to design a safety policy.
                    Return when you need the language for repair.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer spacing */}
          <div className="h-24" />
        </main>
      </div>
    </RouteTransition>
  );
}
