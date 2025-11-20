export type HallOfFameContributor = {
  name: string;
  discipleTitle: string;
  avatar: string;
  summary: string;
  victories: {
    commit: string;
    description: string;
  }[];
};

export const hallOfFameContributors: HallOfFameContributor[] = [
  {
    name: "Aster Parallax",
    discipleTitle: "LangChain Safety Disciple",
    avatar: "/avatars/aster-parallax.png",
    summary:
      "Sealed the LangChain perimeter so only audited chains reached prod, fusing DX speed with zero tolerance for chaos.",
    victories: [
      {
        commit: "225aa69",
        description: "Safe-listed sanctioned @langchain entrypoints across the repo.",
      },
      {
        commit: "6f0d3c2",
        description: "Moved all experiment sandboxes into isolated compute cells.",
      },
    ],
  },
  {
    name: "Nocturne Kells",
    discipleTitle: "Schema Sync Disciple",
    avatar: "/avatars/nocturne-kells.png",
    summary:
      "Authored the schema sync rituals that keep Drizzle migrations, drizzle-kit snapshots, and prod replicas breathing in lockstep.",
    victories: [
      {
        commit: "f0a1d99",
        description: "Shipped schema-sync.mjs with drift alarms wired into CI.",
      },
      {
        commit: "83ab1ff",
        description: "Backfilled notified flags on every watchlist item in under 4 minutes.",
      },
    ],
  },
  {
    name: "Solari Thames",
    discipleTitle: "CI Guardrail Disciple",
    avatar: "/avatars/solari-thames.png",
    summary:
      "Merged lint → schema → RAG → build into a single cannon blast so regressions vaporize before review even loads.",
    victories: [
      {
        commit: "af4f277",
        description: "Unified lint + barrel + build checks into one pnpm guardrail target.",
      },
      {
        commit: "c18d2c0",
        description: "Added zero-downtime Drizzle smoke tests for every PR preview.",
      },
    ],
  },
  {
    name: "Vanta Lattice",
    discipleTitle: "Sentry Automation Disciple",
    avatar: "/avatars/vanta-lattice.png",
    summary:
      "Turned deploys into forensic trails by binding git SHAs, Sentry releases, and runtime alerts into one telemetry spine.",
    victories: [
      {
        commit: "af4f277",
        description: "Attached release version + environment tags to every deploy hook.",
      },
      {
        commit: "d2b45c1",
        description: "Templated incident postmortems with automatic breadcrumb snapshots.",
      },
    ],
  },
  {
    name: "Lyra Cobalt",
    discipleTitle: "RAG & Hydration Disciple",
    avatar: "/avatars/lyra-cobalt.png",
    summary:
      "Revived the RAG lattice, rerouted hydration order, and kept the first paint experience at sub-900ms even under load.",
    victories: [
      {
        commit: "af4f277",
        description: "Rebuilt streaming hydration so SSR + client handoff stayed lossless.",
      },
      {
        commit: "e6139aa",
        description: "Upgraded reranker memory pressure budgets for 5x query throughput.",
      },
    ],
  },
  {
    name: "Zenith Vale",
    discipleTitle: "Equilibrium Chronicler",
    avatar: "/avatars/zenith-vale.png",
    summary:
      "Recorded every Apex epoch: Victory, Lockdown, Eternity. Ensured the freeze logs can never be rewritten or erased.",
    victories: [
      {
        commit: "e6987ea",
        description: "Canonized the equilibrium freeze manifest in the repo root.",
      },
      {
        commit: "b7c77aa",
        description: "Mirrored Hall of Disciples + Hall of Fame content to S3 & R2 for posterity.",
      },
    ],
  },
];


