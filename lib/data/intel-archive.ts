export const INTEL_ARCHIVE = [
  // 1. VINTAGE (Free/Yellow)
  {
    id: "vintage-wotc",
    slug: "vintage-wotc-investment-guide",
    tier: "Free",
    title: "Vintage WOTC Cards: The Blue-Chip Investment Thesis",
    summary: "Deep analysis of 1999-2003 Wizards of the Coast era. Why Base Set Charizard remains the S&P 500 of TCG investing.",
    category: "Vintage Analysis",
    readTime: "15 min read",
    date: "Oct 10, 2025",
    image: "/images/intel/charizard.jpg",

    // CHART DATA
    chartData: [
      { label: '2015', value: 2000 }, { label: '2017', value: 3500 },
      { label: '2019', value: 4200 }, { label: '2021', value: 18500 },
      { label: '2023', value: 12000 }, { label: '2025', value: 16500 }
    ],

    // *** FULL CONTENT ***
    content: `
      <p class="text-xl text-slate-200 mb-8 leading-relaxed font-light">
        In 1999, Wizards of the Coast printed the first English Pokémon cards in a Renton, Washington facility. Twenty-six years later, a PSA 10 Base Set 1st Edition Charizard sells for <strong>$420,000</strong>. This isn't speculation—it's asset appreciation backed by fundamental scarcity.
      </p>

      <h3 class="text-2xl font-bold text-white mt-12 mb-6 border-l-4 border-amber-500 pl-4">1. The Foundation Layer</h3>
      <p class="text-slate-400 mb-6 leading-relaxed">
        The WOTC era (1999-2003) represents the <strong>foundation layer</strong> of TCG investing. Unlike modern sets with print runs in the tens of millions, vintage WOTC cards were produced in limited quantities, distributed regionally, and stored by children who treated them as toys. The result: structural supply constraints that only tighten with time.
      </p>

      <div class="my-12 p-8 bg-slate-900/50 border border-slate-800 rounded-xl">
        <h4 class="text-amber-400 font-mono text-sm uppercase tracking-widest mb-6">/// MARKET_DATA: POPULATION REPORT</h4>
        <ul class="space-y-4 text-sm text-slate-300 font-mono">
          <li class="flex justify-between border-b border-slate-800 pb-2">
            <span>Base Set Charizard (PSA 10)</span>
            <span class="text-white font-bold">124 Copies</span>
          </li>
          <li class="flex justify-between border-b border-slate-800 pb-2">
            <span>Jungle Pikachu (PSA 10)</span>
            <span class="text-white font-bold">842 Copies</span>
          </li>
          <li class="flex justify-between">
            <span>Neo Genesis Lugia (PSA 10)</span>
            <span class="text-white font-bold">43 Copies</span>
          </li>
        </ul>
      </div>

      <h3 class="text-2xl font-bold text-white mt-12 mb-6 border-l-4 border-amber-500 pl-4">2. The Blue-Chip Hierarchy</h3>
      <p class="text-slate-400 mb-6 leading-relaxed">
        Just as the S&P 500 has sectors, Vintage Pokemon has tiers. Capital flows typically move from Tier 1 downwards during bull runs, and retract to Tier 1 during bears.
      </p>
    `
  },
  // 2. STRATEGY (Elite/Cyan)
  {
    id: "modern-rotation",
    slug: "modern-set-rotation-strategy",
    tier: "Elite",
    title: "The Rotation Window: Timing Modern Format Transitions",
    summary: "Strategic analysis of TCG set rotation mechanics. Price volatility patterns and optimal entry/exit points.",
    category: "Strategy",
    readTime: "7 min read",
    date: "Sep 28, 2025",
    image: "/images/intel/rotation.jpg",
    chartData: [{label: 'Pre-Rot', value: 100}, {label: 'Panic', value: 60}, {label: 'Recovery', value: 150}],
    content: `
      <p class="lead text-lg text-slate-300 mb-8">Every 12-18 months, the Pokémon TCG rotates older sets out of Standard format. For the informed investor, it's a <strong>cyclical arbitrage opportunity</strong>.</p>
      <h3 class="text-xl font-bold text-white mt-8 mb-4 border-l-4 border-cyan-500 pl-4">The Six-Phase Rotation Cycle</h3>
      <p class="text-slate-400 mb-6">Prices follow a predictable "Bell Curve" relative to the rotation date. Understanding where we are in this cycle allows us to front-run the market.</p>
      <div class="p-6 border border-cyan-500 bg-cyan-950/20 rounded-lg my-8">
        <h4 class="text-white font-bold mb-2">ALPHA ALERT: 2026 WATCHLIST</h4>
        <p class="text-slate-400 text-sm">Our models indicate Lugia VSTAR will see 40% volatility in Q1 2026. Accumulate during the panic dump.</p>
      </div>
    `
  },
  // 3. SET ANALYSIS (Pro/Purple)
  {
    id: "pokemon-151",
    slug: "pokemon-151-set-analysis",
    tier: "Pro",
    title: "Pokémon 151: Dissecting the Nostalgia Premium",
    summary: "Economic analysis of the 2023 mega-set. Pull rates, chase card valuations, and the 'K-shaped' recovery.",
    category: "Set Analysis",
    readTime: "12 min read",
    date: "Sep 15, 2025",
    image: "/images/intel/151-box.jpg",
    chartData: [{label: 'Release', value: 100}, {label: 'Now', value: 110}],
    content: `
      <p class="lead text-lg text-slate-300 mb-8">Pokémon 151 drove singles prices to levels unseen since the 2021 boom. However, the data reveals a bifurcated market.</p>
      <h3 class="text-xl font-bold text-white mt-8 mb-4 border-l-4 border-purple-500 pl-4">The "Premium Trap"</h3>
      <p class="text-slate-400 mb-6">Set economics create a "burden of value". You are paying a nostalgia tax on sealed product.</p>
      <div class="mt-8 p-6 bg-purple-950/20 border border-purple-500/30 rounded-xl">
        <h3 class="text-xl font-bold text-white mb-2">STRATEGIC VERDICT</h3>
        <p class="text-slate-300 text-sm">DO NOT OPEN SEALED PRODUCT. Accumulate PSA 10 Illustration Rares of starter Pokémon.</p>
      </div>
    `
  }
];

// Helper function to get article by slug
export function getArticleBySlug(slug: string) {
  return INTEL_ARCHIVE.find(article => article.slug === slug);
}

// Helper function to get all categories
export function getAllCategories() {
  const categories = INTEL_ARCHIVE.map(article => article.category);
  return ['All', ...Array.from(new Set(categories))];
}

// Helper function to filter by category
export function getArticlesByCategory(category: string) {
  if (category === 'All') return INTEL_ARCHIVE;
  return INTEL_ARCHIVE.filter(article => article.category === category);
}
