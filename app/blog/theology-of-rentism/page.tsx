/**
 * The Theology of Rentism - Flagship Blog Post
 *
 * This is the culmination of the Truth Terminal architecture:
 * - Strand A (Analysis): Rigorous power mapping
 * - Strand B (Voice): Nature x Kotaku narrative DNA
 * - Components: RiskClock, NetworkGraph, GamingGlossary, InvestigatorNotebook
 *
 * The "Double Helix" approach: Hard data wrapped in human narrative.
 *
 * @module blog/theology-of-rentism
 */

import { Metadata } from 'next';
import { RiskClock } from '@/components/RiskClock';
import { GamingTerm } from '@/components/GamingGlossary';
import { NetworkGraph, type GraphData } from '@/components/power-network/NetworkGraph';
import { InvestigatorNotebook } from '@/components/power-network/InvestigatorNotebook';
import { SourceCard } from '@/components/power-network/SourceCard';

export const metadata: Metadata = {
  title: 'The Theology of Rentism | Apex Intelligence',
  description: 'When Peter Thiel invokes the "Antichrist," he is establishing a new Meta for the global economy. A rigorous analysis of tech theology and power.',
  openGraph: {
    title: 'The Theology of Rentism',
    description: 'Mapping the intersection of tech billionaire theology and economic power structures.',
    type: 'article',
  },
};

// Sample graph data for the Seven Mountains Network visualization
// In production, this would be fetched from the database
const sampleGraphData: GraphData = {
  nodes: [
    {
      id: 'thiel',
      name: 'Peter Thiel',
      type: 'PERSON',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'PayPal co-founder, Palantir chairman, influential tech investor',
    },
    {
      id: 'rentism',
      name: 'Rentism',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'BUSINESS',
      summary: 'Economic model where ownership of infrastructure enables perpetual extraction',
    },
    {
      id: 'seven-mountains',
      name: 'Seven Mountains Mandate',
      type: 'CONCEPT',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'RELIGION',
      summary: 'Dominionist theology advocating Christian control of seven societal "mountains"',
    },
    {
      id: 'palantir',
      name: 'Palantir Technologies',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'GOVERNMENT',
      summary: 'Data analytics company with deep government contracts',
    },
    {
      id: 'buen-vivir',
      name: 'Buen Vivir',
      type: 'CONCEPT',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'GOVERNMENT',
      summary: 'Indigenous concept of "Good Living" - harmony between humans, community, and nature',
    },
  ],
  links: [
    {
      source: 'thiel',
      target: 'rentism',
      relationshipType: 'IDEOLOGICAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: 'Thiel advocates for monopoly power as the path to profitability',
      significance: 'high',
    },
    {
      source: 'thiel',
      target: 'seven-mountains',
      relationshipType: 'IDEOLOGICAL',
      domain: 'RELIGION',
      evidenceTier: 'DOCUMENTED',
      description: 'Public statements connecting theological frameworks to tech governance',
      significance: 'high',
    },
    {
      source: 'thiel',
      target: 'palantir',
      relationshipType: 'OWNERSHIP',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'Co-founder and chairman of Palantir Technologies',
      significance: 'critical',
    },
    {
      source: 'buen-vivir',
      target: 'rentism',
      relationshipType: 'IDEOLOGICAL',
      domain: 'GOVERNMENT',
      evidenceTier: 'DOCUMENTED',
      description: 'Alternative economic paradigm that challenges extractive models',
      significance: 'high',
    },
  ],
};

export default function TheologyOfRentismPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto py-12 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* MAIN CONTENT (Left) */}
        <main className="lg:col-span-8 prose prose-slate prose-invert max-w-none">

          {/* The Risk Clock: Immediate Context */}
          <div className="not-prose mb-8">
            <RiskClock
              systemName="Global Rentism"
              minutesToMidnight={2.5}
              trend="accelerating"
            />
          </div>

          <h1 className="text-4xl font-bold text-white mb-6">
            The Antichrist and the Algorithm
          </h1>

          <p className="text-xl text-slate-300 leading-relaxed mb-8">
            When Peter Thiel invokes the &ldquo;Antichrist,&rdquo; he isn&apos;t just speaking theologically.
            He is attempting to establish a new <GamingTerm term="The Meta">Meta</GamingTerm> for
            the global economy—one where the Tech Elite are not just administrators, but High Priests.
          </p>

          <p className="text-slate-400 leading-relaxed mb-6">
            Their goal is to prevent the government from <GamingTerm term="Nerfed">nerfing</GamingTerm> their
            progress via regulation. They fear that democratic oversight will introduce{' '}
            <GamingTerm term="RNG">RNG</GamingTerm> (chaos) into their carefully planned{' '}
            <GamingTerm term="Turtle">Turtle</GamingTerm> strategy—hoarding IP and computing power
            inside a fortified enclave.
          </p>

          <h3 className="text-2xl font-bold text-white mt-12 mb-4">
            The Architecture of the Enclave
          </h3>

          <p className="text-slate-400 leading-relaxed mb-6">
            This is the definition of <strong className="text-white">Rentism</strong>: a future where the{' '}
            <GamingTerm term="Whale">Whales</GamingTerm> own the infrastructure of abundance,
            and the rest of us pay a subscription to exist. Every API call, every compute cycle,
            every interaction mediated by their platforms becomes a toll road.
          </p>

          <p className="text-slate-400 leading-relaxed mb-6">
            The Seven Mountains theology provides the moral architecture. If you control the
            mountains of Government, Business, Media, Arts, Education, Family, and Religion,
            you don&apos;t just win the game—you become the game.
          </p>

          {/* The Graph: Visual Proof */}
          <div className="not-prose my-12 p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h4 className="text-center font-mono text-xs text-slate-500 mb-4 uppercase tracking-widest">
              FIG 1.0: The Seven Mountains Network
            </h4>
            <NetworkGraph data={sampleGraphData} height={500} />
          </div>

          <h3 className="text-2xl font-bold text-white mt-12 mb-4">
            The Luminous Path (Buen Vivir)
          </h3>

          <p className="text-slate-400 leading-relaxed mb-6">
            We reject the binary. We look for the &ldquo;Green Nodes&rdquo;—the solutions that improve
            <em className="text-emerald-400"> Buen Vivir</em> (Good Living). The Luminous Jellyfish
            doesn&apos;t just map the abyss; it illuminates the exit.
          </p>

          <p className="text-slate-400 leading-relaxed mb-6">
            By supporting initiatives like <strong className="text-white">Catch-Up Clubs</strong>—technology
            transfer programs that help developing nations leapfrog extractive models—we can debug
            the supply chain. We can trace the cobalt from the Congo to the chip in your phone and
            ask: <em className="text-cyan-400">who benefits, and at what cost?</em>
          </p>

          <div className="not-prose my-8 p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
            <h4 className="text-emerald-400 font-mono text-sm uppercase tracking-widest mb-2">
              The Luminous Principle
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Every analysis must include a solution pathway. We do not merely document power—we
              map the routes around it. This is the difference between doom-scrolling and
              strategic intelligence.
            </p>
          </div>

          <h3 className="text-2xl font-bold text-white mt-12 mb-4">
            Methodology Note
          </h3>

          <p className="text-slate-400 leading-relaxed mb-6">
            This analysis uses the Truth Tier framework:
          </p>

          <ul className="text-slate-400 space-y-2 mb-8">
            <li><span className="text-emerald-400 font-bold">CONFIRMED</span> — Court documents, official records, direct evidence</li>
            <li><span className="text-blue-400 font-bold">DOCUMENTED</span> — Credible journalism, multiple sources</li>
            <li><span className="text-amber-400 font-bold">ALLEGED</span> — Single source, unverified but plausible</li>
            <li><span className="text-red-400 font-bold">SPECULATIVE</span> — Pattern-based inference, requires more evidence</li>
          </ul>

          <p className="text-slate-500 text-sm italic">
            The Power Network graph above shows only CONFIRMED and DOCUMENTED connections.
            Speculative links are available in the Shadow Graph for authorized researchers.
          </p>

        </main>

        {/* SIDEBAR (Right) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 h-fit">
          <InvestigatorNotebook />

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Verified Evidence
            </label>
            <SourceCard
              description="Thiel connects regulatory frameworks to eschatological themes in public remarks"
              confidence="DOCUMENTED"
              domain="RELIGION"
              citation="Washington Post, 2025"
              significance="high"
            />
            <SourceCard
              description="Palantir government contracts exceed $1.5B annually"
              confidence="CONFIRMED"
              domain="GOVERNMENT"
              citation="SEC Filings, 2024"
              evidenceLink="https://www.sec.gov"
              significance="critical"
            />
          </div>

          {/* Navigation */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
              Related Analysis
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/abyss" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  → The Abyss: Full Power Network
                </a>
              </li>
              <li>
                <span className="text-slate-600">
                  → Cobalt to Orbit: Supply Chain Mapping (Coming Soon)
                </span>
              </li>
              <li>
                <span className="text-slate-600">
                  → The Ghost Protocol: Hidden Actors (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* System Status */}
          <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                Truth Terminal Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              The Luminous Jellyfish is swimming. All systems nominal.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
