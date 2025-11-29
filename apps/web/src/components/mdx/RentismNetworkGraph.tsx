'use client';

import dynamic from 'next/dynamic';
import type { GraphData, GraphNode, GraphLink } from '@/../../components/power-network/NetworkGraph';

/**
 * RentismNetworkGraph - Thiel/Cobalt/Solutions Network Visualization
 *
 * A pre-configured NetworkGraph showing the connections between:
 * - The "Theology of Rentism" narrative (Thiel and tech ideology)
 * - The material reality (Cobalt supply chain, DRC exploitation)
 * - The Luminous Path (Solutions like Catch-Up Clubs)
 *
 * The Luminous Jellyfish Principle in action: we map the Abyss,
 * but always illuminate the Exit.
 *
 * @module mdx/RentismNetworkGraph
 */

// Dynamically import NetworkGraph to prevent SSR issues
const NetworkGraph = dynamic(
  () => import('@/../../components/power-network/NetworkGraph').then(mod => mod.NetworkGraph),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 mx-auto flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-cyan-500/40 animate-ping" />
            </div>
          </div>
          <p className="text-sm font-mono text-slate-400">Initializing Power Network...</p>
          <p className="text-xs text-slate-600 mt-1">Mapping the Theology of Rentism</p>
        </div>
      </div>
    )
  }
);

// The Network Data: Thiel -> Cobalt -> Solutions
const rentismNetworkData: GraphData = {
  nodes: [
    // === THE IDEOLOGY ===
    {
      id: 'rentism',
      name: 'Rentism',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'BUSINESS',
      summary: 'Post-capitalist scenario where elites control AI/IP infrastructure and extract rents from the masses. Pay-to-Win economy at civilizational scale.',
    },
    {
      id: 'thiel',
      name: 'Peter Thiel',
      type: 'PERSON',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'PayPal co-founder, Palantir chairman. Frames AI regulation critics as "legionnaires of the Antichrist."',
      scandalNotes: '$10M+ secret funding to bankrupt Gawker. Advocates for monopoly as the only viable business model.',
    },
    {
      id: 'palantir',
      name: 'Palantir Technologies',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'GOVERNMENT',
      summary: 'Surveillance infrastructure company. Government contracts for ICE, DOD, CIA.',
    },
    {
      id: 'seven-mountains',
      name: 'Seven Mountains Framework',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'RELIGION',
      summary: 'Dominionist theology: control 7 spheres (Religion, Family, Education, Government, Media, Arts, Business) to shape civilization.',
    },

    // === THE MATERIAL REALITY ===
    {
      id: 'cobalt',
      name: 'Cobalt Supply Chain',
      type: 'CONCEPT',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: '70% of global cobalt comes from DRC. Essential for AI chips, EVs, and batteries.',
      scandalNotes: 'Documented child labor, unsafe mining conditions, environmental devastation.',
    },
    {
      id: 'drc',
      name: 'Democratic Republic of Congo',
      type: 'LOCATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'GOVERNMENT',
      summary: '25.4 million people face crisis-level hunger while mining cobalt that powers AI revolution.',
    },
    {
      id: 'ai-chips',
      name: 'AI Semiconductor Industry',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'NVIDIA, AMD, Intel - the hardware enabling AI acceleration. Built on cobalt and rare earth supply chains.',
    },

    // === THE ENCLAVE ===
    {
      id: 'enclave',
      name: 'Enclave Society',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'BUSINESS',
      summary: 'Physical, digital, and temporal enclaves where elites operate outside accountability. Bunkers, premium tiers, "fix ethics later."',
    },
    {
      id: 'epstein-network',
      name: 'Epstein Network',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'BUSINESS',
      summary: 'Financial and social network exemplifying enclave logic. Little St. James as prototype lawless zone.',
      scandalNotes: 'JP Morgan $290M settlement. Leon Black $158M payments. Court documents confirm financial infrastructure.',
    },

    // === THE LUMINOUS PATH (Solutions) ===
    {
      id: 'solutions',
      name: 'The Luminous Path',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'EDUCATION',
      summary: 'The exit routes. We map the Abyss but always illuminate the path forward.',
    },
    {
      id: 'catch-up-clubs',
      name: 'Catch-Up Clubs',
      type: 'ORGANIZATION',
      evidenceTier: 'CONFIRMED',
      primaryDomain: 'EDUCATION',
      summary: 'Evidence-based tutoring programs in the UK closing educational gaps. Verified impact on literacy and numeracy.',
    },
    {
      id: 'supply-chain-transparency',
      name: 'Supply Chain Transparency Initiatives',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'BUSINESS',
      summary: 'Blockchain-verified sourcing, conflict mineral reporting, ethical supply chain certification.',
    },
    {
      id: 'democratic-tech',
      name: 'Democratic Technology',
      type: 'CONCEPT',
      evidenceTier: 'DOCUMENTED',
      primaryDomain: 'GOVERNMENT',
      summary: 'Open source AI, community-owned infrastructure, algorithmic transparency laws.',
    },
  ] as GraphNode[],

  links: [
    // Thiel -> Ideology
    {
      source: 'thiel',
      target: 'rentism',
      relationshipType: 'IDEOLOGICAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: 'Advocates for tech elite control of AI infrastructure with minimal regulation.',
      significance: 'critical',
    },
    {
      source: 'thiel',
      target: 'palantir',
      relationshipType: 'OWNERSHIP',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'Co-founder and chairman of surveillance infrastructure company.',
      significance: 'high',
    },
    {
      source: 'rentism',
      target: 'seven-mountains',
      relationshipType: 'IDEOLOGICAL',
      domain: 'RELIGION',
      evidenceTier: 'DOCUMENTED',
      description: 'Structural parallel: control spheres of influence to shape civilizational outcomes.',
      significance: 'medium',
    },

    // The Material Chain
    {
      source: 'ai-chips',
      target: 'cobalt',
      relationshipType: 'FINANCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'AI chips require cobalt. The "divine algorithm" has a material supply chain.',
      significance: 'critical',
    },
    {
      source: 'cobalt',
      target: 'drc',
      relationshipType: 'FINANCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: '70% of global cobalt from DRC. 25.4M face hunger while mining.',
      significance: 'critical',
      evidenceLink: 'https://www.amnesty.org/en/documents/afr62/3183/2016/en/',
    },
    {
      source: 'rentism',
      target: 'ai-chips',
      relationshipType: 'IDEOLOGICAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: 'AI acceleration is the mechanism for establishing Rentist control.',
      significance: 'high',
    },

    // Enclave Connections
    {
      source: 'rentism',
      target: 'enclave',
      relationshipType: 'IDEOLOGICAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: 'Theology of Rentism creates moral justification for enclave society.',
      significance: 'high',
    },
    {
      source: 'epstein-network',
      target: 'enclave',
      relationshipType: 'SOCIAL',
      domain: 'BUSINESS',
      evidenceTier: 'CONFIRMED',
      description: 'Little St. James as prototype lawless zone for elite operation.',
      significance: 'high',
    },

    // Solutions - The Luminous Path
    {
      source: 'solutions',
      target: 'catch-up-clubs',
      relationshipType: 'IDEOLOGICAL',
      domain: 'EDUCATION',
      evidenceTier: 'CONFIRMED',
      description: 'Evidence-based education closing gaps without extraction.',
      significance: 'high',
    },
    {
      source: 'solutions',
      target: 'supply-chain-transparency',
      relationshipType: 'IDEOLOGICAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: 'Making supply chains visible breaks the enclave logic.',
      significance: 'high',
    },
    {
      source: 'solutions',
      target: 'democratic-tech',
      relationshipType: 'IDEOLOGICAL',
      domain: 'GOVERNMENT',
      evidenceTier: 'DOCUMENTED',
      description: 'Open source and community ownership as counter to Rentism.',
      significance: 'high',
    },
    {
      source: 'cobalt',
      target: 'supply-chain-transparency',
      relationshipType: 'POLITICAL',
      domain: 'BUSINESS',
      evidenceTier: 'DOCUMENTED',
      description: 'Transparency initiatives targeting conflict minerals and exploitative sourcing.',
      significance: 'medium',
    },
  ] as GraphLink[],
};

export default function RentismNetworkGraph() {
  return (
    <div className="my-8">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-mono text-cyan-400 uppercase tracking-wider mb-2">
          Power Network: The Theology of Rentism
        </h3>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Interactive map showing connections between tech ideology, material exploitation, and solution paths.
          Click nodes and links to explore evidence chains.
        </p>
      </div>
      <NetworkGraph
        data={rentismNetworkData}
        height={650}
      />
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-500 font-mono">
          Green nodes = Solutions | Purple glow = Core Concepts | Click to explore
        </p>
      </div>
    </div>
  );
}
