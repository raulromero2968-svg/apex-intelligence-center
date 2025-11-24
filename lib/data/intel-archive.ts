export const INTEL_ARCHIVE = [
  // 🟡 YELLOW DIAMOND (FREE) - VINTAGE WOTC
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
    roi: "Steady",
    sources: [{ name: "PWCC Analytics", url: "#" }, { name: "PSA Pop Report", url: "#" }],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        In 1999, Wizards of the Coast printed the first English Pokémon cards in a Renton, Washington facility. Twenty-six years later, a PSA 10 Base Set 1st Edition Charizard sells for <strong>$420,000</strong>. This isn't speculation—it's asset appreciation backed by fundamental scarcity.
      </p>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-amber-500 pl-4">The Foundation Layer</h3>
      <p class="text-slate-400 mb-6 leading-relaxed">
        The WOTC era (1999-2003) represents the <strong>foundation layer</strong> of TCG investing. Unlike modern sets with print runs in the tens of millions, vintage WOTC cards were produced in limited quantities, distributed regionally, and stored by children who treated them as toys. The result: structural supply constraints that only tighten with time.
      </p>

      <div class="my-12 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-amber-400 font-mono text-xs uppercase tracking-widest mb-4">/// MARKET_DATA: POPULATION REPORT</h4>
        <ul class="space-y-3 text-sm text-slate-300 font-mono">
          <li class="flex justify-between border-b border-slate-800 pb-2">
            <span>Base Set Charizard (PSA 10)</span>
            <span class="text-white">124 Copies</span>
          </li>
          <li class="flex justify-between border-b border-slate-800 pb-2">
            <span>Jungle Pikachu (PSA 10)</span>
            <span class="text-white">842 Copies</span>
          </li>
          <li class="flex justify-between">
            <span>Neo Genesis Lugia (PSA 10)</span>
            <span class="text-white">43 Copies</span>
          </li>
        </ul>
      </div>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-amber-500 pl-4">The Blue-Chip Hierarchy</h3>
      <ul class="list-none space-y-6 mb-12">
        <li class="bg-slate-900/30 p-4 border-l-2 border-amber-500">
          <strong class="text-amber-400 block text-sm uppercase mb-1">Tier 1: The Foundation</strong>
          <span class="text-slate-400 text-sm">Base Set, Jungle, Fossil. The "Bitcoin" of Pokemon. Universally recognized liquidity.</span>
        </li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-slate-600">
          <strong class="text-slate-400 block text-sm uppercase mb-1">Tier 2: The Neo Era</strong>
          <span class="text-slate-400 text-sm">Genesis, Discovery, Destiny. The "Growth Stocks". Lower pop counts, high art value.</span>
        </li>
      </ul>

      <div class="my-12 p-6 border border-red-900/50 bg-red-950/10 rounded-lg">
        <h4 class="text-red-500 font-bold mb-4 flex items-center gap-2">⚠ RISK FACTORS: WHAT COULD GO WRONG</h4>
        <ul class="space-y-2 text-sm text-red-200/80">
          <li>• <strong>Counterfeits:</strong> High-end vintage is the primary target for sophisticated fakes.</li>
          <li>• <strong>Illiquidity:</strong> Selling a $50k asset takes time. Expect 10-20% transaction fees.</li>
        </ul>
      </div>

      <div class="mt-12 p-8 bg-gradient-to-br from-amber-950/40 to-slate-950 border border-amber-500/30 rounded-xl">
        <h3 class="text-xl font-bold text-white mb-2">THE APEX WOTC PORTFOLIO</h3>
        <p class="text-amber-400 text-xs font-mono mb-6">MODEL ALLOCATION // 2025</p>
        <div class="space-y-4 font-mono text-sm">
          <div class="flex justify-between border-b border-slate-800 pb-2">
            <span class="text-slate-300">40% - Base Set Trio (PSA 9)</span>
            <span class="text-amber-400">$12k-16k</span>
          </div>
          <div class="flex justify-between border-b border-slate-800 pb-2">
            <span class="text-slate-300">30% - Neo Chase Cards (PSA 9)</span>
            <span class="text-amber-400">$3k-5k</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-300">10% - Cash Reserve</span>
            <span class="text-green-400">$2k-5k</span>
          </div>
        </div>
      </div>
    `
  },

  // 🟣 PURPLE DIAMOND (PRO) - POKEMON 151
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
    trend: "Volatile",
    sources: [{ name: "PokeData", url: "#" }, { name: "TCGPlayer Pro", url: "#" }],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        In June 2023, The Pokémon Company released the most culturally significant modern set since XY Evolutions. <strong>Pokémon 151</strong> drove singles prices to levels unseen since the 2021 boom. However, the data reveals a bifurcated market: chase cards soaring while bulk ex cards crater to sub-$5.
      </p>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">The "Premium Trap" Phenomenon</h3>
      <p class="text-slate-400 mb-6 leading-relaxed">
        Set economics create a "burden of value". You'll pull an ex card every 3.4 packs, but 80% of ex cards are worth under $1. The EV (expected value) of a box hovers at $120, while boxes cost $140+. You are paying a <strong>nostalgia tax</strong>.
      </p>

      <div class="my-12 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-purple-400 font-mono text-xs uppercase tracking-widest mb-4">/// MARKET_DATA: PULL RATE ECONOMICS</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-purple-500/10 border border-purple-500/20 rounded">
             <div class="text-slate-400 text-xs uppercase mb-1">SIR Pull Rate</div>
             <div class="text-2xl font-bold text-white">1 / 32 Packs</div>
          </div>
          <div class="p-4 bg-purple-500/10 border border-purple-500/20 rounded">
             <div class="text-slate-400 text-xs uppercase mb-1">Master Set Cost</div>
             <div class="text-2xl font-bold text-white">$850 (Est.)</div>
          </div>
        </div>
      </div>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">Chase Card Hierarchy</h3>
      <ul class="list-none space-y-6 mb-12">
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500">
          <strong class="text-purple-400 block text-sm uppercase mb-1">Tier S: The Apex Chase</strong>
          <span class="text-slate-400 text-sm">Charizard ex (SIR), Zapdos ex (SIR). The art quality drives liquidity.</span>
        </li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-slate-600">
          <strong class="text-slate-400 block text-sm uppercase mb-1">Tier A: Illustration Rares</strong>
          <span class="text-slate-400 text-sm">Starter lines (Charmander, Squirtle, Bulbasaur). High volume, steady growth.</span>
        </li>
      </ul>

      <div class="mt-12 p-8 bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/30 rounded-xl">
        <h3 class="text-xl font-bold text-white mb-2">STRATEGIC VERDICT</h3>
        <p class="text-purple-400 text-xs font-mono mb-6">ACTIONABLE INTELLIGENCE</p>
        <p class="text-slate-300 text-sm leading-relaxed">
          <strong>DO NOT OPEN SEALED PRODUCT.</strong> The EV is negative. The play is to accumulate PSA 10 Illustration Rares of the starter Pokémon (Squirtle, Charmander, Bulbasaur) during the Q4 supply glut. These have the highest liquidity and nostalgia crossover appeal.
        </p>
      </div>
    `
  },

  // 🔵 CYAN DIAMOND (WHALE) - ROTATION STRATEGY
  {
    id: "modern-rotation",
    slug: "modern-set-rotation-strategy",
    tier: "Whale",
    title: "The Rotation Window: Timing Modern Format Transitions",
    summary: "Strategic analysis of TCG set rotation mechanics. Price volatility patterns and optimal entry/exit points for maximum alpha.",
    category: "Strategy",
    readTime: "7 min read",
    date: "Sep 28, 2025",
    image: "/images/intel/rotation.jpg",
    spread: "High",
    sources: [{ name: "TcgPlayer", url: "#" }, { name: "LimitlessTCG", url: "#" }],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        Every 12-18 months, the Pokémon TCG rotates older sets out of Standard format. For most players, this is an inconvenience. For the informed investor, it's a <strong>cyclical arbitrage opportunity</strong> worth millions.
      </p>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-cyan-500 pl-4">The Six-Phase Rotation Cycle</h3>
      <p class="text-slate-400 mb-6 leading-relaxed">
        Prices follow a predictable "Bell Curve" relative to the rotation date. Understanding where we are in this cycle allows us to front-run the market.
      </p>

      <div class="my-12 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-4">/// MARKET_DATA: VOLATILITY INDEX</h4>
        <ul class="space-y-4 text-sm text-slate-300 font-mono">
          <li class="flex items-center gap-4">
             <div class="w-8 h-8 rounded bg-cyan-500 text-black font-bold flex items-center justify-center">1</div>
             <div class="flex-1">
               <strong class="text-white block">Pre-Rotation Speculation</strong>
               <span class="text-xs text-slate-500">6-3 Months Out. Smart money accumulates staples.</span>
             </div>
          </li>
          <li class="flex items-center gap-4">
             <div class="w-8 h-8 rounded bg-slate-700 text-cyan-400 font-bold flex items-center justify-center">2</div>
             <div class="flex-1">
               <strong class="text-white block">The "Panic Dump"</strong>
               <span class="text-xs text-slate-500">2 Weeks Post-Rotation. Casuals sell off "useless" cards.</span>
             </div>
          </li>
          <li class="flex items-center gap-4">
             <div class="w-8 h-8 rounded bg-slate-700 text-cyan-400 font-bold flex items-center justify-center">3</div>
             <div class="flex-1">
               <strong class="text-white block">Expanded Format Spike</strong>
               <span class="text-xs text-slate-500">12+ Months Later. Cards find new life in eternal formats.</span>
             </div>
          </li>
        </ul>
      </div>

      <div class="p-6 border border-cyan-500 bg-cyan-950/20 rounded-lg my-8">
        <h4 class="text-white font-bold mb-2 flex items-center gap-2">
          <span class="animate-pulse w-2 h-2 bg-cyan-400 rounded-full"></span>
          ALPHA ALERT: 2026 WATCHLIST
        </h4>
        <p class="text-slate-400 text-sm leading-relaxed">
          Our models indicate <strong>Lugia VSTAR</strong> and <strong>Gardevoir ex</strong> will see 40% volatility in Q1 2026. The play is to accumulate alternate arts during the "Panic Dump" phase when players liquidate decks.
        </p>
      </div>

      <div class="mt-12 p-8 bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-xl">
        <h3 class="text-xl font-bold text-white mb-2">WHALE EXECUTION STRATEGY</h3>
        <p class="text-cyan-400 text-xs font-mono mb-6">CAPITAL DEPLOYMENT PLAN</p>
        <ul class="list-disc list-inside text-slate-300 text-sm space-y-2">
          <li><strong>Entry Point:</strong> April 15-30 (Post-Rotation Dip)</li>
          <li><strong>Target Asset:</strong> High-Rarity Staples (Gold/Rainbow/Alt Art)</li>
          <li><strong>Exit Point:</strong> 24 Months (Expanded Format Season)</li>
        </ul>
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
