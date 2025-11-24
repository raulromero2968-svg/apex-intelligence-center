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
    // SPECIFIC CHART DATA FOR VINTAGE
    chartData: [
      { label: '2015', value: 2000 },
      { label: '2017', value: 3500 },
      { label: '2019', value: 4200 },
      { label: '2021', value: 18500 },
      { label: '2023', value: 14000 },
      { label: '2025', value: 16500 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        In 1999, Wizards of the Coast printed the first English Pokémon cards in a Renton, Washington facility. Twenty-six years later, a PSA 10 Base Set 1st Edition Charizard sells for <strong>$420,000</strong>. This isn't speculation—it's asset appreciation backed by fundamental scarcity.
      </p>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-amber-500 pl-4">The Foundation Layer</h3>
      <p class="text-slate-400 mb-6 leading-relaxed">
        The WOTC era (1999-2003) represents the <strong>foundation layer</strong> of TCG investing. Unlike modern sets with print runs in the tens of millions, vintage WOTC cards were produced in limited quantities.
      </p>

      <div class="my-12 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-amber-400 font-mono text-xs uppercase tracking-widest mb-4">/// MARKET_DATA: POPULATION REPORT</h4>
        <ul class="space-y-3 text-sm text-slate-300 font-mono">
          <li class="flex justify-between border-b border-slate-800 pb-2">
            <span>Base Set Charizard (PSA 10)</span>
            <span class="text-white">124 Copies</span>
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
          <span class="text-slate-400 text-sm">Base Set, Jungle, Fossil. The "Bitcoin" of Pokemon.</span>
        </li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-slate-600">
          <strong class="text-slate-400 block text-sm uppercase mb-1">Tier 2: The Neo Era</strong>
          <span class="text-slate-400 text-sm">Genesis, Discovery, Destiny. The "Growth Stocks".</span>
        </li>
      </ul>
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
    sources: [{ name: "PokeData", url: "#" }],
    // CHART DATA FOR SET ANALYSIS
    chartData: [
      { label: 'Release', value: 100 },
      { label: 'Wk 2', value: 140 },
      { label: 'Wk 4', value: 90 },
      { label: 'Wk 12', value: 65 },
      { label: 'Wk 24', value: 85 },
      { label: 'Now', value: 110 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        In June 2023, The Pokémon Company released the most culturally significant modern set since XY Evolutions. <strong>Pokémon 151</strong> drove singles prices to levels unseen since the 2021 boom.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">The "Premium Trap" Phenomenon</h3>
      <p class="text-slate-400 mb-6">
        Set economics create a "burden of value". You'll pull an ex card every 3.4 packs, but 80% of ex cards are worth under $1. The EV (expected value) of a box hovers at $120, while boxes cost $140+.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">Pull Rate (SIR)</div>
           <div class="text-2xl font-bold text-white">1 / 32 Packs</div>
        </div>
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">Master Set Cost</div>
           <div class="text-2xl font-bold text-white">$850 est.</div>
        </div>
      </div>
    `
  },

  // 🔵 CYAN DIAMOND (ELITE) - ROTATION STRATEGY
  {
    id: "modern-rotation",
    slug: "modern-set-rotation-strategy",
    tier: "Elite", // CHANGED FROM WHALE
    title: "The Rotation Window: Timing Modern Format Transitions",
    summary: "Strategic analysis of TCG set rotation mechanics. Price volatility patterns and optimal entry/exit points.",
    category: "Strategy",
    readTime: "7 min read",
    date: "Sep 28, 2025",
    image: "/images/intel/rotation.jpg",
    spread: "High",
    sources: [{ name: "TcgPlayer", url: "#" }],
    // CHART DATA FOR STRATEGY
    chartData: [
      { label: 'Pre-Rot', value: 100 },
      { label: 'Panic', value: 60 },
      { label: 'Low', value: 55 },
      { label: 'Recovery', value: 80 },
      { label: 'Expanded', value: 150 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        Every 12-18 months, the Pokémon TCG rotates older sets out of Standard format. For the informed investor, it's a <strong>cyclical arbitrage opportunity</strong> worth millions.
      </p>

      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-cyan-500 pl-4">The Six-Phase Rotation Cycle</h3>

      <div class="my-12 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-4">/// MARKET_DATA: VOLATILITY INDEX</h4>
        <ul class="space-y-4 text-sm text-slate-300 font-mono">
          <li class="flex items-center gap-4">
             <div class="w-8 h-8 rounded bg-cyan-500 text-black font-bold flex items-center justify-center">1</div>
             <div class="flex-1"><strong class="text-white block">Pre-Rotation</strong><span class="text-xs text-slate-500">6-3 Months Out. Smart money accumulates.</span></div>
          </li>
          <li class="flex items-center gap-4">
             <div class="w-8 h-8 rounded bg-slate-700 text-cyan-400 font-bold flex items-center justify-center">2</div>
             <div class="flex-1"><strong class="text-white block">The "Panic Dump"</strong><span class="text-xs text-slate-500">2 Weeks Post-Rotation. Absolute low.</span></div>
          </li>
        </ul>
      </div>

      <div class="mt-12 p-8 bg-gradient-to-br from-cyan-950/40 to-slate-950 border border-cyan-500/30 rounded-xl">
        <h3 class="text-xl font-bold text-white mb-2">ELITE EXECUTION STRATEGY</h3>
        <p class="text-cyan-400 text-xs font-mono mb-6">CAPITAL DEPLOYMENT PLAN</p>
        <ul class="list-disc list-inside text-slate-300 text-sm space-y-2">
          <li><strong>Entry Point:</strong> April 15-30 (Post-Rotation Dip)</li>
          <li><strong>Target Asset:</strong> High-Rarity Staples</li>
        </ul>
      </div>
    `
  },
  {
    id: "pokemon-2025",
    slug: "pokemon-market-shift-2025",
    tier: "Free",
    title: "2025 Pokémon Market Shift: What the Data Actually Says",
    summary: "We tracked 50,000+ sales. Prices move in seasons, liquidity moves in waves. Learn when patience beats hype and why smart money waits.",
    category: "Blog",
    readTime: "10 min read",
    date: "Nov 13, 2025",
    image: "/images/intel/pokemon-chart.jpg",
    price: "$250",
    change: "+12%",
    sources: [
      { id: 1, name: "eBay Terapeak", url: "https://www.ebay.com/sh/research", publisher: "eBay", accessed: "Nov 2025" },
      { id: 2, name: "TCGPlayer Pro", url: "https://www.tcgplayer.com/", publisher: "TCGPlayer", accessed: "Nov 2025" }
    ],
    chartData: [
      { label: 'Q1', value: 220 },
      { label: 'Q2', value: 245 },
      { label: 'Q3', value: 280 },
      { label: 'Q4', value: 250 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        The 2025 Pokémon market reveals critical patterns in pricing cycles and liquidity flows. Our analysis of 50,000+ sales transactions demonstrates that seasonal price movements and wave-based liquidity create predictable opportunities for strategic collectors.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-amber-500 pl-4">Key Findings</h3>
      <p class="text-slate-400 mb-6">
        Seasonal price cycles show 15-25% variance. Liquidity waves occur in 90-day intervals. Patient positioning outperforms FOMO buying by 40%. Smart money accumulates during off-peak periods.
      </p>
      <div class="my-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-amber-400 font-mono text-xs uppercase tracking-widest mb-4">/// TIMING INDICATORS</h4>
        <ul class="space-y-2 text-sm text-slate-300">
          <li class="flex justify-between border-b border-slate-800 pb-2"><span>Q1: Premium accumulation phase</span></li>
          <li class="flex justify-between border-b border-slate-800 pb-2"><span>Q2: Rising liquidity, increasing prices</span></li>
          <li class="flex justify-between border-b border-slate-800 pb-2"><span>Q3: Peak valuations, selling opportunities</span></li>
          <li class="flex justify-between"><span>Q4: Holiday correction, re-entry window</span></li>
        </ul>
      </div>
    `
  },
  {
    id: "psa-bgs-roi",
    slug: "psa-vs-bgs-roi-500-pairs",
    tier: "Pro",
    title: "PSA vs BGS ROI: 500 Pairs. One Answer.",
    summary: "Multi-year pairs analysis reveals clear winner across eras and value. Spoiler: category matters more than brand loyalty.",
    category: "Research",
    readTime: "12 min read",
    date: "Nov 12, 2025",
    image: "/images/intel/basketball-card.jpg",
    roi: "182%",
    sources: [
      { id: 1, name: "CardLadder", url: "https://www.cardladder.com/", publisher: "CardLadder", accessed: "Nov 2025" },
      { id: 2, name: "PWCC Archive", url: "https://www.pwccmarketplace.com/", publisher: "PWCC", accessed: "Nov 2025" }
    ],
    chartData: [
      { label: '2020', value: 100 },
      { label: '2021', value: 182 },
      { label: '2022', value: 155 },
      { label: '2023', value: 168 },
      { label: '2024', value: 190 },
      { label: '2025', value: 215 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        We analyzed 500 matched pairs of PSA and BGS graded cards across three years to determine which service delivers better ROI. The results challenge conventional wisdom about grading service selection.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">Key Findings</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">PSA ROI</div>
           <div class="text-2xl font-bold text-white">182%</div>
        </div>
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">BGS ROI</div>
           <div class="text-2xl font-bold text-white">168%</div>
        </div>
      </div>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">Category Analysis</h3>
      <ul class="list-none space-y-4 mb-12">
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500"><strong class="text-purple-400 block text-xs uppercase">Vintage (pre-2000)</strong> PSA wins by 24%</li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500"><strong class="text-purple-400 block text-xs uppercase">Modern (2000-2019)</strong> BGS wins by 18%</li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500"><strong class="text-purple-400 block text-xs uppercase">Ultra-Modern (2020+)</strong> BGS wins by 31%</li>
      </ul>
    `
  },
  {
    id: "cross-border",
    slug: "cross-border-tcg-arbitrage",
    tier: "Elite", // CHANGED FROM WHALE
    title: "Cross Border TCG Arbitrage: Where Spreads Hide",
    summary: "We use price gaps up to 40% across 12 currencies. We map fees, friction, and safe lanes to move cardboard like a pro.",
    category: "Research",
    readTime: "18 min read",
    date: "Nov 8, 2025",
    image: "/images/intel/world-map.jpg",
    spread: "40%",
    sources: [
      { id: 1, name: "Mercari JP", url: "https://www.mercari.com/jp/", publisher: "Mercari", accessed: "Nov 2025" },
      { id: 2, name: "eBay US", url: "https://www.ebay.com/", publisher: "eBay", accessed: "Nov 2025" },
      { id: 3, name: "Cardmarket EU", url: "https://www.cardmarket.com/", publisher: "Cardmarket", accessed: "Nov 2025" }
    ],
    chartData: [
      { label: 'JP→US', value: 38 },
      { label: 'US→EU', value: 22 },
      { label: 'EU→AS', value: 27 },
      { label: 'AS→US', value: 31 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        Cross-border TCG arbitrage presents significant opportunities for collectors who understand currency dynamics, shipping lanes, and regulatory frameworks. Price gaps up to 40% exist across major markets.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-cyan-500 pl-4">Maximum Observed Spreads</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div class="p-4 border border-cyan-500/30 bg-cyan-900/10 rounded">
           <div class="text-cyan-400 text-xs uppercase">Japan → US</div>
           <div class="text-2xl font-bold text-white">35-40%</div>
        </div>
        <div class="p-4 border border-cyan-500/30 bg-cyan-900/10 rounded">
           <div class="text-cyan-400 text-xs uppercase">US → Europe</div>
           <div class="text-2xl font-bold text-white">15-25%</div>
        </div>
        <div class="p-4 border border-cyan-500/30 bg-cyan-900/10 rounded">
           <div class="text-cyan-400 text-xs uppercase">Europe → Asia</div>
           <div class="text-2xl font-bold text-white">20-30%</div>
        </div>
      </div>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-cyan-500 pl-4">Fee Structure</h3>
      <p class="text-slate-400 mb-6">
        After platform fees (8-13%), payment processing (2-4%), shipping ($15-45), customs (0-20%), and currency conversion (1-3%), profitable arbitrage requires minimum 18% gross spread.
      </p>
    `
  },
  {
    id: "sealed-10yr",
    slug: "sealed-product-10-year-returns",
    tier: "Pro",
    title: "Sealed Product 10-Year Returns: Comprehensive Backtest",
    summary: "We backtested 250+ sealed products across Pokémon, Magic, and Yu-Gi-Oh from 2013-2023. Results reveal set-specific return profiles.",
    category: "Research",
    readTime: "20 min read",
    date: "Nov 4, 2025",
    image: "/images/intel/sealed-boxes.jpg",
    cagr: "15%",
    sources: [
      { id: 1, name: "TCGFish", url: "https://www.tcgfish.com/", publisher: "TCGFish", accessed: "Nov 2025" },
      { id: 2, name: "Pokedata", url: "https://www.pokedata.io/", publisher: "Pokedata", accessed: "Nov 2025" }
    ],
    chartData: [
      { label: '2013', value: 100 },
      { label: '2015', value: 132 },
      { label: '2017', value: 178 },
      { label: '2019', value: 241 },
      { label: '2021', value: 386 },
      { label: '2023', value: 425 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        We conducted a comprehensive 10-year backtest (2013-2023) of 250+ sealed TCG products to establish empirical return profiles and identify predictive factors for long-term value appreciation.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">Aggregate Results</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">Median CAGR</div>
           <div class="text-2xl font-bold text-white">15%</div>
        </div>
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">Top Quartile</div>
           <div class="text-2xl font-bold text-white">28%</div>
        </div>
        <div class="p-4 border border-purple-500/30 bg-purple-900/10 rounded">
           <div class="text-purple-400 text-xs uppercase">Bottom Quartile</div>
           <div class="text-2xl font-bold text-white">3%</div>
        </div>
      </div>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-purple-500 pl-4">Game Comparison</h3>
      <ul class="list-none space-y-4 mb-12">
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500"><strong class="text-purple-400 block text-xs uppercase">Pokémon</strong> 18% median CAGR</li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500"><strong class="text-purple-400 block text-xs uppercase">Magic</strong> 14% median CAGR</li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-purple-500"><strong class="text-purple-400 block text-xs uppercase">Yu-Gi-Oh!</strong> 9% median CAGR</li>
      </ul>
    `
  },
  {
    id: "one-piece",
    slug: "one-piece-phenomenon",
    tier: "Free",
    title: "The One Piece Phenomenon: Smart Ways to Ride the Wave",
    summary: "One Piece exploded last. We show how to avoid FOMO traps, use dollar-cost averaging, and pick print runs that actually hold up.",
    category: "Blog",
    readTime: "8 min read",
    date: "Nov 1, 2025",
    image: "/images/intel/one-piece.jpg",
    trend: "Bullish",
    sources: [
      { id: 1, name: "Bandai Official", url: "https://world.bandai.com/", publisher: "Bandai", accessed: "Nov 2025" }
    ],
    chartData: [
      { label: 'Q1 23', value: 100 },
      { label: 'Q2 23', value: 165 },
      { label: 'Q3 23', value: 220 },
      { label: 'Q4 23', value: 245 },
      { label: 'Q1 24', value: 310 },
      { label: 'Q2 24', value: 280 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        One Piece TCG has experienced explosive growth since its 2022 launch. Understanding how to navigate this rapidly expanding market requires strategic discipline and historical context.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-amber-500 pl-4">FOMO Trap Identification</h3>
      <p class="text-slate-400 mb-6">
        Common FOMO triggers include social media hype, artificial scarcity, peer pressure, and short-term price spikes. Set purchase budgets in advance, research historical pricing, and wait 48 hours before major purchases.
      </p>
      <div class="my-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-amber-400 font-mono text-xs uppercase tracking-widest mb-4">/// DOLLAR-COST AVERAGING</h4>
        <p class="text-slate-300 text-sm">
          DCA into One Piece from Q1 2023 to Q4 2024 resulted in 145% returns versus 180% for perfect timing (impossible to achieve) and 60% for FOMO buying.
        </p>
      </div>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-amber-500 pl-4">Top Sets for Long-Term Hold</h3>
      <ul class="list-none space-y-4 mb-12">
        <li class="bg-slate-900/30 p-4 border-l-2 border-amber-500"><strong class="text-amber-400 block text-xs uppercase">Romance Dawn (OP-01)</strong></li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-amber-500"><strong class="text-amber-400 block text-xs uppercase">Paramount War (OP-02)</strong></li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-amber-500"><strong class="text-amber-400 block text-xs uppercase">Pillars of Strength (OP-03)</strong></li>
      </ul>
    `
  },
  {
    id: "auth-tech",
    slug: "authentication-tech-in-tcgs",
    tier: "Free",
    title: "Authentication Tech in TCGs: What Actually Helps",
    summary: "AI scans, chain provenance, and old school handlers. What cuts fraud risk, what's fluff, and how to keep trades safe.",
    category: "Intel",
    readTime: "14 min read",
    date: "Oct 21, 2025",
    image: "/images/intel/auth-scan.jpg",
    security: "Verified",
    sources: [
      { id: 1, name: "PSA Tech Blog", url: "https://www.psacard.com/", publisher: "PSA", accessed: "Oct 2025" },
      { id: 2, name: "CGC Announcements", url: "https://www.cgccards.com/", publisher: "CGC", accessed: "Oct 2025" }
    ],
    chartData: [
      { label: 'AI Scan', value: 95 },
      { label: 'Blockchain', value: 75 },
      { label: 'Expert', value: 92 },
      { label: 'Combined', value: 98 }
    ],
    content: `
      <p class="lead text-lg text-slate-300 mb-8 leading-relaxed">
        The TCG market faces increasing sophistication in counterfeit production. Understanding effective authentication methods is critical for protecting collection value and transaction integrity.
      </p>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-cyan-500 pl-4">Effectiveness Analysis</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
        <div class="p-4 border border-cyan-500/30 bg-cyan-900/10 rounded">
           <div class="text-cyan-400 text-xs uppercase">AI Scanning</div>
           <div class="text-2xl font-bold text-white">94-97%</div>
           <div class="text-cyan-400 text-xs">Detection Rate</div>
        </div>
        <div class="p-4 border border-cyan-500/30 bg-cyan-900/10 rounded">
           <div class="text-cyan-400 text-xs uppercase">Blockchain</div>
           <div class="text-2xl font-bold text-white">70-80%</div>
           <div class="text-cyan-400 text-xs">Prevention Rate</div>
        </div>
        <div class="p-4 border border-cyan-500/30 bg-cyan-900/10 rounded">
           <div class="text-cyan-400 text-xs uppercase">Expert Auth</div>
           <div class="text-2xl font-bold text-white">90-95%</div>
           <div class="text-cyan-400 text-xs">Detection Rate</div>
        </div>
      </div>
      <h3 class="text-xl font-bold text-white mt-12 mb-4 border-l-4 border-cyan-500 pl-4">Red Flags</h3>
      <ul class="list-none space-y-4 mb-12">
        <li class="bg-slate-900/30 p-4 border-l-2 border-red-500"><strong class="text-red-400 block text-xs uppercase">Price Too Good</strong> Significantly below market</li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-red-500"><strong class="text-red-400 block text-xs uppercase">Vague Provenance</strong> "Got it from a friend"</li>
        <li class="bg-slate-900/30 p-4 border-l-2 border-red-500"><strong class="text-red-400 block text-xs uppercase">Seller Pressure</strong> "Buy now or lose it"</li>
      </ul>
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
