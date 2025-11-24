'use client';

import React from 'react';
import { ResearchArticle, ResearchReport } from '@/components/research/ResearchArticle';
import { CitationTooltip } from '@/components/research/CitationTooltip';

// MOCK CONTENT: Represents the output of our "Gemini" Research Agent
const MOCK_REPORT: ResearchReport = {
  id: 'R-2025-001',
  title: 'The "Waifu" Effect: Analysis of Female Trainer Cards in 2025',
  summary: 'An in-depth look at the market performance of Full Art Supporter cards.',
  author: 'Gemini (Chief Research Agent)',
  date: 'Nov 22, 2025',
  tags: ['Market Trends', 'Pokemon', 'Behavioral Economics'],
  sources: {
    '1': { title: 'TCGPlayer Market Report Q3 2025', url: '#', domain: 'tcgplayer.com', date: 'Oct 15, 2025' },
    '2': { title: 'eBay Auction Data: Lillie (UP) PSA 10', url: '#', domain: 'ebay.com', date: 'Nov 01, 2025' },
    '3': { title: 'Psychology of Collecting: Anime Aesthetics', url: '#', domain: 'journal.psych.org', date: '2024' }
  },
  content: `
The "Waifu Tax" is a colloquial term used in the TCG community to describe the premium price attached to cards featuring popular female characters. Our analysis indicates this is not a temporary bubble, but a structural shift in collector demographics.

## Market Velocity vs. Standard Sets

While the broader Pokémon market has seen a correction of **-12%** since the 2021 peak, Full Art Supporter cards have outperformed the index by **+34%** year-over-year.

> "The aesthetic appeal of these cards transcends the game mechanics, effectively turning them into digital-analog art pieces."

This decoupling from playability suggests these assets behave more like fine art than game pieces. Data from TCGPlayer confirms that 65% of high-value transactions for these cards are from accounts classified as "Pure Collectors" rather than competitive players.

## The Lillie Anomaly

The case study of *Lillie (Ultra Prism)* provides the clearest evidence. Despite three reprint cycles in Japan, the international version has maintained a price floor of $400 USD.

Our predictive model suggests a continued upward trend for "Generation 7" supporters due to nostalgia cycles hitting the 20-25 age demographic.
  `
};

export default function ResearchPage() {
  // Enhanced Mock: In a real app, we would parse the markdown and replace [x] with the tooltip component.
  // For this POC, we will manually render the interactive version of the content to demonstrate the UI.

  return (
    <div className="min-h-screen pt-24 pb-20 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent opacity-50" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 max-w-3xl mx-auto flex items-center gap-2 text-sm text-slate-500">
            <span className="hover:text-white cursor-pointer transition-colors">Intelligence</span>
            <span>/</span>
            <span className="text-cyan-400">Deep Dive</span>
        </div>

        {/* The Article */}
        <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm shadow-2xl">

           {/* We render the component but here we perform the "Injection" of the tooltips manually for the demo
               In production this would be a rehype plugin
           */}
           <article className="max-w-3xl mx-auto">
              <header className="mb-12 border-b border-slate-800 pb-8">
                <div className="flex gap-2 mb-4">
                  {MOCK_REPORT.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-900 text-cyan-400 text-xs font-mono uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {MOCK_REPORT.title}
                </h1>
                <div className="flex items-center gap-6 text-slate-400 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span className="text-slate-300">{MOCK_REPORT.author}</span>
                  </div>
                  <span>{MOCK_REPORT.date}</span>
                </div>
              </header>

              <div className="prose prose-invert prose-cyan max-w-none text-lg text-slate-300 leading-relaxed">
                <p className="mb-6">
                  The "Waifu Tax" is a colloquial term used in the TCG community to describe the premium price attached to cards featuring popular female characters. Our analysis indicates this is not a temporary bubble, but a structural shift in collector demographics <CitationTooltip id="1" source={MOCK_REPORT.sources['1']} />.
                </p>

                <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-cyan-500 rounded-full inline-block"/>
                  Market Velocity vs. Standard Sets
                </h2>

                <p className="mb-6">
                  While the broader Pokémon market has seen a correction of <strong>-12%</strong> since the 2021 peak, Full Art Supporter cards have outperformed the index by <strong>+34%</strong> year-over-year <CitationTooltip id="2" source={MOCK_REPORT.sources['2']} />.
                </p>

                <blockquote className="border-l-4 border-purple-500 pl-6 py-2 my-8 bg-gradient-to-r from-purple-900/20 to-transparent italic text-slate-200 text-xl">
                  "The aesthetic appeal of these cards transcends the game mechanics, effectively turning them into digital-analog art pieces."
                </blockquote>

                <p className="mb-6">
                  This decoupling from playability suggests these assets behave more like fine art than game pieces <CitationTooltip id="3" source={MOCK_REPORT.sources['3']} />. Data from TCGPlayer confirms that 65% of high-value transactions for these cards are from accounts classified as "Pure Collectors" rather than competitive players.
                </p>

                {/* Visual Break / Chart Placeholder */}
                <div className="my-10 p-1 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl">
                   <div className="bg-slate-950 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] border border-slate-800">
                      <div className="text-slate-500 text-sm font-mono mb-2">FIG 1.1: PRICE PERFORMANCE DELTA</div>
                      {/* We could reuse the IntelChart here */}
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden max-w-md">
                        <div className="bg-cyan-500 h-full w-[75%] animate-[width_2s_ease-out]" style={{width: '75%'}}></div>
                      </div>
                      <div className="flex justify-between w-full max-w-md mt-2 text-xs text-slate-400">
                         <span>Standard Market</span>
                         <span className="text-cyan-400 font-bold">+34% (Target Segment)</span>
                      </div>
                   </div>
                </div>

                <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-cyan-500 rounded-full inline-block"/>
                  The Lillie Anomaly
                </h2>

                <p className="mb-6">
                  The case study of <em>Lillie (Ultra Prism)</em> provides the clearest evidence. Despite three reprint cycles in Japan, the international version has maintained a price floor of $400 USD.
                </p>
              </div>

              {/* Sources Section (Footer) */}
              <div className="mt-16 pt-8 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">References & Methodology</h3>
                <div className="grid gap-3">
                  {Object.entries(MOCK_REPORT.sources).map(([id, source]) => (
                    <div key={id} className="flex gap-4 text-sm text-slate-400">
                      <span className="text-cyan-500 font-mono">[{id}]</span>
                      <a href={source.url} className="hover:text-cyan-400 transition-colors underline decoration-slate-700 underline-offset-4">
                        {source.title}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
           </article>

        </div>
      </div>
    </div>
  );
}
