import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";

type ArticleItem = {
  href: string;
  title: string;
  excerpt: string;
  date: string;
  read: string;
  tags: string[];
  badge?: "PRO" | "PREMIUM";
};

const items: ArticleItem[] = [
  {
    href: "/research/psa-vs-bgs-2025-roi",
    title: "Grading Strategy 2025: PSA vs BGS Comprehensive ROI Analysis",
    excerpt:
      "A matched-pair study of 500 identical cards graded in parallel shows service-specific ROI spreads up to 17% by category. We break down when the premium is justified.",
    date: "2025-11-13",
    read: "15 min read",
    badge: "PRO",
    tags: ["Research", "Grading", "ROI"],
  },
  {
    href: "/research/sealed-product-10year-returns",
    title: "Sealed Product 10-Year Returns: Comprehensive Backtest",
    excerpt:
      "We tracked 250+ sealed products across Pokémon, Magic, and Yu-Gi-Oh from 2013–2023. Results reveal set-specific return profiles, optimal hold periods, and liquidity timing.",
    date: "2025-11-11",
    read: "18 min read",
    tags: ["Sealed Product", "Backtesting"],
    badge: "PREMIUM",
  },
  {
    href: "/research/card-condition-pricing-model",
    title: "Card Condition Pricing Model: From Raw to PSA 10",
    excerpt:
      "Our regression model quantifies price premiums for each condition tier. Use this framework to estimate fair value for raw cards and optimize grading submission decisions.",
    date: "2025-11-09",
    read: "16 min read",
    tags: ["Pricing", "Modeling"],
  },
  {
    href: "/research/tournament-meta-price-correlation",
    title: "Tournament Meta and Card Price Correlation Study",
    excerpt:
      "Competitive play drives demand spikes. We analyze tournament results, deck archetypes, and secondary market data to quantify how metagame shifts predict short-term price movements.",
    date: "2025-11-07",
    read: "14 min read",
    tags: ["Competitive", "Correlation"],
  },
  {
    href: "/research/print-run-estimation-methodology",
    title: "Print Run Estimation Methodology for Modern TCG Sets",
    excerpt:
      "Publisher transparency is limited. Our methodology combines distributor data, case break samples, and market velocity to reverse-engineer print run volumes and scarcity metrics.",
    date: "2025-11-04",
    read: "17 min read",
    tags: ["Supply Analysis", "Methodology"],
    badge: "PRO",
  },
  {
    href: "/research/collector-portfolio-diversification",
    title: "Collector Portfolio Diversification: Risk-Adjusted Strategies",
    excerpt:
      "Single-TCG concentration creates portfolio risk. We model correlation across TCG categories, sealed vs. singles, and vintage vs. modern to optimize diversification and downside protection.",
    date: "2025-11-01",
    read: "19 min read",
    tags: ["Portfolio", "Risk Management"],
  },
];

export default function ResearchPage() {
  return (
    <SectionShell title="Research" kicker="In-Depth Analysis">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
