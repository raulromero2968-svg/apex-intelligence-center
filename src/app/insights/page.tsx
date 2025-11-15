import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";

const items = [
  {
    href: "/insights/psa-10-premium-decay",
    title: "PSA 10 Premium Decay: When Perfect Grades Lose Value",
    excerpt:
      "PSA 10 populations have exploded, eroding scarcity premiums. We model population growth, grade inflation, and collector preference shifts to identify when lower grades outperform.",
    date: "2025-11-14",
    read: "11 min read",
    tags: ["Grading", "Market Dynamics"],
    badge: "PRO",
  },
  {
    href: "/insights/reprint-risk-indicators",
    title: "Reprint Risk Indicators: Early Warning Signals",
    excerpt:
      "Reprint announcements crater card prices overnight. Our framework tracks publisher behavior, set anniversaries, and demand signals to forecast reprint probability before official announcements.",
    date: "2025-11-12",
    read: "13 min read",
    tags: ["Risk Management", "Reprints"],
  },
  {
    href: "/insights/sealed-booster-box-roi",
    title: "Sealed Booster Box ROI: Long-Term Hold vs. Flip Strategy",
    excerpt:
      "Booster boxes offer dual paths: immediate flipping or long-term appreciation. We backtest 10-year hold periods across major sets to quantify when patience pays versus quick flips.",
    date: "2025-11-10",
    read: "12 min read",
    tags: ["Sealed Product", "ROI"],
  },
  {
    href: "/insights/collector-vs-investor-behavior",
    title: "Collector vs. Investor Behavior: Market Psychology Decoded",
    excerpt:
      "Collectors and investors drive different price dynamics. Our sentiment analysis separates emotional premium from investment value, revealing when markets are collector-driven versus speculative.",
    date: "2025-11-08",
    read: "10 min read",
    tags: ["Psychology", "Sentiment"],
  },
  {
    href: "/insights/authentication-fraud-trends",
    title: "Authentication & Fraud: 2025 Trends and Mitigation",
    excerpt:
      "Counterfeit cards and resealing fraud escalate as TCG values rise. We survey authentication technology, common fraud vectors, and due diligence practices to protect portfolio integrity.",
    date: "2025-11-05",
    read: "14 min read",
    tags: ["Authentication", "Fraud Prevention"],
    badge: "PREMIUM",
  },
  {
    href: "/insights/international-arbitrage",
    title: "International Arbitrage: Cross-Border Pricing Opportunities",
    excerpt:
      "Regional price spreads create arbitrage windows for savvy collectors. We map duty, shipping, and currency factors to identify profitable cross-border transactions in Japanese and European markets.",
    date: "2025-11-02",
    read: "15 min read",
    tags: ["Arbitrage", "International"],
  },
];

export default function InsightsPage() {
  return (
    <SectionShell title="Insights" kicker="Expert Analysis">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
