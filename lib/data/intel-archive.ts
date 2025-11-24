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
    chartData: [{label: '2015', value: 2000}, {label: '2017', value: 3500}, {label: '2019', value: 4200}, {label: '2021', value: 18500}, {label: '2023', value: 12000}, {label: '2025', value: 16500}],
    content: `
      <p class="lead text-lg text-slate-300 mb-8">In 1999, Wizards of the Coast printed the first English Pokémon cards. Today, a PSA 10 Base Set 1st Edition Charizard sells for <strong>$420,000</strong>. This is asset appreciation backed by fundamental scarcity.</p>
      <h3 class="text-xl font-bold text-white mt-8 mb-4 border-l-4 border-amber-500 pl-4">The Foundation Layer</h3>
      <p class="text-slate-400 mb-6">The WOTC era (1999-2003) represents the foundation layer of TCG investing. Unlike modern sets with print runs in the tens of millions, vintage WOTC cards were produced in limited quantities.</p>
      <div class="my-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
        <h4 class="text-amber-400 font-mono text-xs uppercase tracking-widest mb-4">/// MARKET_DATA: POPULATION REPORT</h4>
        <ul class="space-y-2 text-sm text-slate-300 font-mono">
          <li class="flex justify-between border-b border-slate-800 pb-2"><span>Base Set Charizard (PSA 10)</span><span class="text-white">124 Copies</span></li>
        </ul>
      </div>
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
