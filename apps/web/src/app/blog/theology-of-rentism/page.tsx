/**
 * The Theology of Rentism - Rich Narrative Experience
 *
 * A Double Helix analysis integrating:
 * 1. The Analysis: Synthesis of Thiel, Rentism, and Cobalt
 * 2. The Evidence: NetworkGraph visualizing specific nodes
 * 3. The Safety: InvestigatorNotebook for paranoia management
 *
 * @module blog/theology-of-rentism
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, AlertTriangle, BookOpen } from 'lucide-react';
import { NetworkGraph } from '@/../../components/power-network/NetworkGraph';
import { InvestigatorNotebook } from '@/../../components/power-network/InvestigatorNotebook';
import { SourceCard } from '@/../../components/power-network/SourceCard';

export const metadata: Metadata = {
  title: 'The Antichrist and the Algorithm | Apex Intelligence',
  description: 'How Silicon Valley is building a theology to defend Rentism. A Double Helix analysis of power, ideology, and supply chains.',
  keywords: ['Peter Thiel', 'Rentism', 'AI governance', 'tech theology', 'power networks', 'civilizational analytics'],
  openGraph: {
    title: 'The Antichrist and the Algorithm',
    description: 'How Silicon Valley is building a theology to defend Rentism.',
    type: 'article',
    publishedTime: '2025-11-29',
    authors: ['Apex Intelligence'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Antichrist and the Algorithm | Apex Intelligence',
    description: 'A Double Helix analysis of tech elite theology.',
  },
};

// Graph data for this specific narrative
// In production, this would be fetched from the database
const graphData = {
  nodes: [
    {
      id: 'thiel',
      name: 'Peter Thiel',
      type: 'PERSON' as const,
      evidenceTier: 'DOCUMENTED' as const,
      primaryDomain: 'BUSINESS' as const,
      summary: 'Tech billionaire. Co-founder of PayPal and Palantir.',
      scandalNotes: 'Described AI critics as "legionnaires of the Antichrist" (Oct 2025)',
    },
    {
      id: 'rentism',
      name: 'Rentism',
      type: 'CONCEPT' as const,
      evidenceTier: 'DOCUMENTED' as const,
      primaryDomain: 'BUSINESS' as const,
      summary: 'A post-capitalist scenario where elites control AI via IP regimes.',
    },
    {
      id: 'cobalt',
      name: 'Cobalt',
      type: 'CONCEPT' as const,
      evidenceTier: 'CONFIRMED' as const,
      primaryDomain: 'BUSINESS' as const,
      summary: 'Critical mineral for AI. 70% from DRC under exploitative conditions.',
      scandalNotes: 'Child labor documented by International Rights Advocates lawsuit.',
    },
    {
      id: 'epstein',
      name: 'Jeffrey Epstein',
      type: 'PERSON' as const,
      evidenceTier: 'CONFIRMED' as const,
      primaryDomain: 'BUSINESS' as const,
      summary: 'Financier and convicted sex offender. Central network node.',
    },
    {
      id: 'catchup',
      name: 'Catch-Up Clubs',
      type: 'ORGANIZATION' as const,
      evidenceTier: 'DOCUMENTED' as const,
      primaryDomain: 'EDUCATION' as const,
      summary: 'Verified initiative providing educational support to vulnerable children.',
    },
    {
      id: 'palantir',
      name: 'Palantir Technologies',
      type: 'ORGANIZATION' as const,
      evidenceTier: 'CONFIRMED' as const,
      primaryDomain: 'GOVERNMENT' as const,
      summary: 'Data analytics company co-founded by Thiel. Surveillance contracts.',
    },
    {
      id: 'enclave',
      name: 'Enclave Society',
      type: 'CONCEPT' as const,
      evidenceTier: 'SPECULATIVE' as const,
      primaryDomain: 'BUSINESS' as const,
      summary: 'Emerging structure of elite separation: physical, digital, temporal.',
    },
    {
      id: 'jellyfish',
      name: 'Luminous Jellyfish Principle',
      type: 'CONCEPT' as const,
      evidenceTier: 'CONFIRMED' as const,
      primaryDomain: 'ARTS' as const,
      summary: 'The proof that beauty is possible in the abyss.',
    },
  ],
  links: [
    {
      source: 'thiel',
      target: 'palantir',
      relationshipType: 'OWNERSHIP' as const,
      domain: 'BUSINESS' as const,
      evidenceTier: 'CONFIRMED' as const,
      description: 'Co-founder and chairman',
      significance: 'critical' as const,
    },
    {
      source: 'thiel',
      target: 'rentism',
      relationshipType: 'IDEOLOGICAL' as const,
      domain: 'RELIGION' as const,
      evidenceTier: 'DOCUMENTED' as const,
      description: '"Antichrist" rhetoric defends Rentism against regulation',
      significance: 'high' as const,
    },
    {
      source: 'rentism',
      target: 'enclave',
      relationshipType: 'IDEOLOGICAL' as const,
      domain: 'BUSINESS' as const,
      evidenceTier: 'SPECULATIVE' as const,
      description: 'Economic model leads to social structure',
      significance: 'medium' as const,
    },
    {
      source: 'cobalt',
      target: 'rentism',
      relationshipType: 'IDEOLOGICAL' as const,
      domain: 'BUSINESS' as const,
      evidenceTier: 'CONFIRMED' as const,
      description: 'Material extraction enables AI infrastructure',
      significance: 'high' as const,
    },
    {
      source: 'jellyfish',
      target: 'catchup',
      relationshipType: 'IDEOLOGICAL' as const,
      domain: 'ARTS' as const,
      evidenceTier: 'CONFIRMED' as const,
      description: 'The principle supports verified solutions',
      significance: 'high' as const,
    },
    {
      source: 'palantir',
      target: 'enclave',
      relationshipType: 'IDEOLOGICAL' as const,
      domain: 'GOVERNMENT' as const,
      evidenceTier: 'DOCUMENTED' as const,
      description: 'Surveillance enables enclave protection',
      significance: 'medium' as const,
    },
  ],
};

export default function TheologyOfRentismPage() {
  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-20">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scan-slow" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Back Navigation */}
        <div className="max-w-7xl mx-auto mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            BACK_TO_BLOG
          </Link>
        </div>

        {/* Main Grid Layout */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: The Narrative (Strand A) */}
          <article className="lg:col-span-8 space-y-8">
            {/* Header */}
            <header className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-xl p-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                CIVILIZATIONAL_ANALYTICS // DOUBLE_HELIX
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                The Antichrist and the Algorithm
              </h1>
              <p className="text-xl text-slate-400 font-light">
                How Silicon Valley is building a theology to defend Rentism
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-mono mt-6">
                <span>Nov 29, 2025</span>
                <span className="text-slate-700">|</span>
                <span>Analysis: Rentism & Theology</span>
                <span className="text-slate-700">|</span>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>12 min read</span>
                </div>
              </div>
            </header>

            {/* Opening */}
            <section className="prose prose-invert max-w-none">
              <p className="text-xl text-slate-300 leading-relaxed">
                In October 2025, Peter Thiel described critics of AI regulation as &quot;legionnaires of the Antichrist.&quot;
                This was not a metaphor. It was a strategic deployment of theology to defend a specific economic future.
              </p>
            </section>

            {/* Section: The Strategic Pivot */}
            <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono">
                The Strategic Pivot
              </h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                By framing regulation as &quot;apocalyptic,&quot; the tech elite attempts to move the debate from the
                <strong className="text-white"> Political Domain</strong> (where they might lose) to the
                <strong className="text-white"> Religious Domain</strong> (where they claim absolute authority).
              </p>
              <p className="text-slate-300 leading-relaxed">
                This is a defense mechanism for <strong className="text-purple-400">Rentism</strong>&mdash;a future
                where elites control the infrastructure of abundance via intellectual property and artificial scarcity.
              </p>
            </section>

            {/* System Note: Double Helix */}
            <aside className="border-l-4 border-purple-500 pl-6 py-4 bg-purple-950/20 rounded-r-xl">
              <div className="text-purple-400 font-mono uppercase tracking-widest text-xs mb-2">
                System Note: The Double Helix
              </div>
              <p className="text-slate-400 italic text-sm">
                &quot;They care deeply about the metaphorical end of the world, but seem indifferent to the actual
                end of the world for a child in a Congo mine tunnel.&quot;
              </p>
            </aside>

            {/* Section: The Hypocrisy of the Enclave */}
            <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono">
                The Hypocrisy of the Enclave
              </h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                While invoking Christian apocalyptic imagery, this ideology ignores the material reality powering it.
                The &quot;divine&quot; AI relies on cobalt mined by children in the DRC, where 25.4 million people face hunger.
              </p>
              <div className="flex items-start gap-3 bg-red-950/20 border border-red-500/20 rounded-lg p-4 mt-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-200 text-sm font-medium">Material Reality Check</p>
                  <p className="text-red-300/70 text-sm mt-1">
                    The International Rights Advocates lawsuit documents child labor in cobalt mines that supply
                    the tech industry. This is not speculation; it is CONFIRMED evidence.
                  </p>
                </div>
              </div>
            </section>

            {/* VISUALIZATION: The Network Graph */}
            <section className="border border-cyan-500/30 rounded-xl overflow-hidden bg-slate-950">
              <div className="px-4 py-3 border-b border-cyan-500/20 bg-slate-900/50">
                <h4 className="text-sm font-mono text-slate-400 uppercase tracking-widest">
                  FIG 1.0: The Architecture of Connection
                </h4>
              </div>
              <div className="p-4">
                <NetworkGraph data={graphData} height={500} />
              </div>
            </section>

            {/* Section: The Luminous Path */}
            <section className="border border-emerald-500/30 rounded-xl p-6 bg-emerald-950/20">
              <h3 className="text-xl font-bold text-emerald-400 mb-4 font-mono">
                The Luminous Path
              </h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                We reject the binary of &quot;Acceleration vs. Apocalypse.&quot; The graph above shows the third path:
                <strong className="text-emerald-400"> Solutions</strong>.
              </p>
              <p className="text-slate-300 leading-relaxed">
                By supporting verified initiatives like{' '}
                <Link href="/network?focus=Catch-Up%20Clubs" className="text-cyan-400 hover:text-cyan-300 underline">
                  Catch-Up Clubs
                </Link>
                , we can build intelligence without exploitation.
              </p>
            </section>

            {/* Section: What We Map */}
            <section className="border border-slate-800 rounded-xl p-6 bg-slate-900/30">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 font-mono">
                What We Map
              </h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-mono">01.</span>
                  <span><strong className="text-white">Power Network Mapping</strong>: The Seven Mountains Framework, inverted. Not to control, but to reveal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-mono">02.</span>
                  <span><strong className="text-white">Truth Tier System</strong>: Every claim rated by evidence quality (Confirmed/Documented/Alleged/Speculative).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-mono">03.</span>
                  <span><strong className="text-white">Supply Chain Tracing</strong>: From cobalt mine to AI chip to algorithm to outcome.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 font-mono">04.</span>
                  <span><strong className="text-white">Cross-Domain Analysis</strong>: Finding patterns that span Business, Government, Media, and beyond.</span>
                </li>
              </ul>
            </section>

            {/* Closing Reflection */}
            <aside className="border-l-4 border-cyan-500 pl-6 py-4 bg-cyan-950/20 rounded-r-xl">
              <div className="text-cyan-400 font-mono uppercase tracking-widest text-xs mb-2">
                Strand B: Closing Reflection
              </div>
              <p className="text-slate-400 italic text-sm mb-4">
                There is a risk in this work&mdash;the risk of becoming what we observe. When you stare into power
                networks, the networks stare back. They can make you cynical, or worse, they can make you want to join them.
              </p>
              <p className="text-slate-400 italic text-sm">
                The <strong className="text-cyan-300">Luminous Jellyfish Principle</strong> is our inoculation.
                We descend into the abyss of dark data, but we carry bioluminescence.
                <strong className="text-white"> Light persists.</strong>
              </p>
            </aside>

            {/* CTA */}
            <section className="border border-cyan-500/30 bg-slate-900/50 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Query the Network
              </h3>
              <p className="text-slate-400 mb-6">
                The Civilizational Analytics engine is live. Explore the full power network.
              </p>
              <Link
                href="/network"
                className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-4 rounded-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] font-mono"
              >
                [ OPEN_NETWORK_GRAPH ]
                <ExternalLink className="w-4 h-4" />
              </Link>
            </section>
          </article>

          {/* RIGHT COLUMN: The Tools (Strand B) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sticky Container */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Tool 1: The Notebook */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block px-1">
                  Investigator Tools
                </label>
                <InvestigatorNotebook />
                <p className="text-xs text-slate-600 px-1">
                  <strong className="text-slate-500">Protocol:</strong> If reading this triggers paranoid
                  pattern-matching, log it here. Do not carry it with you.
                </p>
              </div>

              {/* Tool 2: Key Evidence */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block px-1">
                  Ground Truth Citations
                </label>

                <SourceCard
                  description="Thiel identifies critics as 'legionnaires of the Antichrist'"
                  confidence="DOCUMENTED"
                  domain="RELIGION"
                  citation="Washington Post, Oct 2025"
                  significance="high"
                />

                <SourceCard
                  description="Cobalt supply chain relies on child labor in DRC mines"
                  confidence="CONFIRMED"
                  domain="BUSINESS"
                  citation="International Rights Advocates Lawsuit"
                  evidenceLink="https://www.internationalrightsadvocates.org/cases/cobalt"
                  significance="critical"
                />

                <SourceCard
                  description="25.4 million people face hunger in DRC while mining for tech"
                  confidence="CONFIRMED"
                  domain="FAMILY"
                  citation="UN World Food Programme"
                  significance="critical"
                />
              </div>

              {/* Quick Links */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/30">
                <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">
                  Related Analysis
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/blog/antichrist-and-algorithm"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                    >
                      <span className="text-slate-600">&rarr;</span>
                      Full MDX Article
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/network"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                    >
                      <span className="text-slate-600">&rarr;</span>
                      Power Network Explorer
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/research/civilizational-analytics"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                    >
                      <span className="text-slate-600">&rarr;</span>
                      Civilizational Analytics Docs
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Protocol Reminder */}
              <div className="border border-purple-500/30 rounded-xl p-4 bg-purple-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🪼</span>
                  <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                    Luminous Jellyfish Principle
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We descend into dark data, but we carry bioluminescence. Every investigation must
                  surface with actionable hope, material specificity, and exit routes.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
