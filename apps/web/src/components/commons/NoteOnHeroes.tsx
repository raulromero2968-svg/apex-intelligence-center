'use client';

import { useState } from 'react';
import { Shield, Heart, Users } from 'lucide-react';
import { noteOnHeroes } from '@/content/commons/note-on-heroes';

/**
 * NoteOnHeroes Component
 *
 * The trust-building filter that signals anti-idolatry values.
 * Placed prominently to help users understand this isn't a cult.
 */
export function NoteOnHeroes() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="relative max-w-4xl mx-auto px-6 py-16">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 rounded-3xl blur-3xl" />

      <div className="relative border border-slate-700/50 rounded-2xl bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Values Filter
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {noteOnHeroes.title}
          </h2>

          <p className="text-lg text-slate-400">
            {noteOnHeroes.subtitle}
          </p>
        </div>

        {/* Introduction */}
        <p className="text-xl font-medium text-cyan-400 italic">
          "{noteOnHeroes.introduction}"
        </p>

        {/* Sections */}
        <div className="space-y-6">
          {noteOnHeroes.sections.map((section, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl border border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-600/50 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-purple-500/30 group-hover:border-cyan-500/30 transition-colors">
                  {index === 0 && <Heart className="w-5 h-5 text-purple-400" />}
                  {index === 1 && <Users className="w-5 h-5 text-cyan-400" />}
                  {index === 2 && <Shield className="w-5 h-5 text-purple-400" />}
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {section.heading}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Callout */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30">
          <p className="text-white/90 leading-relaxed text-center">
            <span className="font-semibold text-cyan-400">Values Filter:</span>{' '}
            {noteOnHeroes.callout.message}
          </p>
        </div>

        {/* Visual separator with transmutation theme */}
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-purple-500 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
