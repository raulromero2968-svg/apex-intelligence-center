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
    href: "/intel/q4-2025-market-snapshot",
    title: "Q4 2025 TCG Market Snapshot: Trends, Alerts, and Opportunities",
    excerpt:
      "Our quarterly analysis covers price momentum across major TCGs, sealed product performance, and emerging investment themes. Key findings: rotation-driven volatility and regional arbitrage opportunities.",
    date: "2025-11-15",
    read: "15 min read",
    tags: ["Market Report", "Quarterly"],
    badge: "PREMIUM",
  },
  {
    href: "/intel/one-piece-surge-analysis",
    title: "One Piece Card Game: Surge Analysis and Sustainability",
    excerpt:
      "Explosive growth in One Piece TCG raises sustainability questions. We model print-run dynamics, collector demographics, and competitive adoption to assess long-term value retention.",
    date: "2025-11-13",
    read: "12 min read",
    tags: ["One Piece", "Growth Analysis"],
  },
  {
    href: "/intel/vintage-pokemon-liquidity",
    title: "Vintage Pokémon Liquidity Crisis: What Collectors Need to Know",
    excerpt:
      "High-end vintage Pokémon cards face growing bid-ask spreads. We quantify liquidity gaps by grade and rarity tier, plus strategies to minimize exit friction in illiquid markets.",
    date: "2025-11-11",
    read: "10 min read",
    tags: ["Pokémon", "Liquidity"],
    badge: "PRO",
  },
  {
    href: "/intel/mtg-reserved-list-watch",
    title: "MTG Reserved List Watch: Price Targets and Risk Assessment",
    excerpt:
      "Reserved List cards remain speculative but data-backed. Our proprietary model tracks buyout patterns, collector demand signals, and reprint risk to identify undervalued targets.",
    date: "2025-11-09",
    read: "14 min read",
    tags: ["Magic", "Reserved List"],
  },
  {
    href: "/intel/grading-backlog-impact",
    title: "Grading Backlog Impact on Market Velocity",
    excerpt:
      "Extended grading turnaround times create supply bottlenecks. We estimate how PSA and BGS backlogs affect market velocity, pricing, and optimal submission timing across card tiers.",
    date: "2025-11-06",
    read: "11 min read",
    tags: ["Grading", "Supply Chain"],
  },
  {
    href: "/intel/sports-card-crossover",
    title: "Sports Card Crossover: TCG Collectors Diversifying Portfolios",
    excerpt:
      "TCG collectors increasingly allocate to sports cards. We analyze correlation, liquidity, and return profiles to guide diversification strategies without abandoning core TCG holdings.",
    date: "2025-11-03",
    read: "13 min read",
    tags: ["Diversification", "Sports Cards"],
  },
];

export default function IntelPage() {
  return (
    <SectionShell title="Intel" kicker="Apex Intelligence">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
