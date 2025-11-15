import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";

const items = [
  {
    href: "/blog/pokemon-market-shift-2025",
    title: "2025 Pokémon Market Shift: What the Data Actually Says",
    excerpt:
      "We analyzed 50,000+ sales across rarity and grade to separate hype from signal. The result: rotation effects and liquidity cycles, not bubbles, explain most price moves.",
    date: "2025-11-14",
    read: "10 min read",
    tags: ["Pokémon", "Market Analysis"],
  },
  {
    href: "/blog/play-vs-investment",
    title: "Play vs Investment Value: Finding the Perfect Balance",
    excerpt:
      "Gaming joy and long-term value are not enemies. Use our two-bucket strategy to preserve liquidity while keeping your favorite decks playable and guilt-free.",
    date: "2025-11-12",
    read: "8 min read",
    tags: ["Strategy", "Investment"],
  },
  {
    href: "/blog/sealed-product-timing",
    title: "Sealed Product Timing: When to Buy, Hold, and Sell",
    excerpt:
      "Market cycles for sealed products follow predictable patterns. We model print-run timing, rotation schedules, and demand curves to identify optimal entry and exit windows.",
    date: "2025-11-10",
    read: "12 min read",
    tags: ["Sealed Product", "Timing"],
  },
  {
    href: "/blog/meta-shifts-card-values",
    title: "How Meta Shifts Drive Secondary Market Card Values",
    excerpt:
      "Competitive metagame changes create immediate pricing opportunities. Track ban lists, tournament results, and deck archetypes to anticipate value spikes before the market reacts.",
    date: "2025-11-08",
    read: "9 min read",
    tags: ["Meta", "Competitive"],
  },
  {
    href: "/blog/japanese-vs-english-premium",
    title: "Japanese vs English: Quantifying the Collector Premium",
    excerpt:
      "Language-based price spreads vary by era, card type, and region. Our cross-market analysis reveals when Japanese cards command premiums and when English versions outperform.",
    date: "2025-11-05",
    read: "11 min read",
    tags: ["International", "Pricing"],
  },
  {
    href: "/blog/grading-submission-strategy",
    title: "Grading Submission Strategy: Maximizing ROI Per Card",
    excerpt:
      "Not every card benefits from grading. Use our decision tree combining centering, surface quality, and market comps to identify which submissions justify the cost and wait.",
    date: "2025-11-02",
    read: "10 min read",
    tags: ["Grading", "ROI"],
  },
];

export default function BlogPage() {
  return (
    <SectionShell title="Blog" kicker="Latest Updates">
      <div className="mb-12">
        <LiveScatter
          title="Market Volatility vs ROI Potential"
          subtitle="Watch how card values shift over time. Bigger bubbles = higher trading volume."
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
