'use client';

import { useState } from 'react';
import { Flame, Book, Shield, Zap, Brain, Heart } from 'lucide-react';
import { foundersOath } from '@/content/commons/founders-oath';

/**
 * FoundersOath Component
 *
 * The deepening phase - connecting ethical principles to system safety.
 * Shows that these principles come from lived experience, not corporate PR.
 */
export function FoundersOath() {
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(null);

  const icons = [Flame, Book, Zap, Shield, Brain, Heart];

  const togglePrinciple = (index: number) => {
    setExpandedPrinciple(expandedPrinciple === index ? null : index);
  };

  return (
    <section className="relative max-w-5xl mx-auto px-6 py-16">
      {/* Ambient glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-orange-500/5 rounded-3xl blur-3xl" />

      <div className="relative border border-slate-700/50 rounded-2xl bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 space-y-10">
        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Ethical Commitment
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {foundersOath.title}
          </h2>

          <p className="text-lg text-slate-400">
            {foundersOath.subtitle}
          </p>

          <p className="text-white/80 leading-relaxed pt-4">
            {foundersOath.introduction}
          </p>
        </div>

        {/* Oath Principles */}
        <div className="space-y-4">
          {foundersOath.oath.map((item, index) => {
            const Icon = icons[index];
            const isExpanded = expandedPrinciple === index;

            return (
              <div
                key={index}
                className="group border border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600/60 transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => togglePrinciple(index)}
                  className="w-full p-6 text-left flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30 group-hover:border-purple-500/50 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-400 group-hover:text-purple-400 transition-colors" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors pr-4">
                      {item.principle}
                    </h3>
                  </div>

                  <div className="flex-shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <svg
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded elaboration */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}
                >
                  <div className="px-6 pb-6 pl-[88px]">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50">
                      <p className="text-slate-300 leading-relaxed">
                        {item.elaboration}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Closing statement */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 space-y-3">
          <h4 className="text-xl font-semibold text-white">
            {foundersOath.closing.heading}
          </h4>
          <p className="text-slate-300 leading-relaxed">
            {foundersOath.closing.content}
          </p>
        </div>

        {/* Connection to System Safety */}
        <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">
              {foundersOath.connection.heading}
            </h4>
          </div>
          <p className="text-slate-300 leading-relaxed pl-13">
            {foundersOath.connection.content}
          </p>
        </div>

        {/* Visual separator with transmutation gradient */}
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 animate-pulse opacity-60" />
        </div>

        {/* Key insight callout */}
        <div className="text-center space-y-3">
          <p className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-orange-400 italic">
            "I remember I've been both harmed and harmful."
          </p>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            This line acknowledges complexity. It resonates with the outsider, the menace, the person who's been excluded and has also caused harm. It's honest in a way corporate mission statements never are.
          </p>
        </div>
      </div>
    </section>
  );
}
