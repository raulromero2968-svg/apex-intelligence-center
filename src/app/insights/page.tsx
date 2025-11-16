import SectionShell from "../(sections)/SectionShell";
import ContentCard from "@/components/ContentCard";
import { ContentKind } from "@/lib/routeMap";

type InsightItem = {
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt?: string;
  dateISO?: string;
  badge?: string;
};

const items: InsightItem[] = [
  {
    kind: 'intel',
    slug: 'psa-10-premium-decay',
    title: 'PSA 10 Premium Decay: When Perfect Grades Lose Value',
    excerpt: 'PSA 10 populations have exploded, eroding scarcity premiums. We model population growth, grade inflation, and collector preference shifts to identify when lower grades outperform.',
    dateISO: '2025-11-14',
    badge: 'Intel',
  },
  {
    kind: 'research',
    slug: 'reprint-risk-indicators',
    title: 'Reprint Risk Indicators: Early Warning Signals',
    excerpt: 'Reprint announcements crater card prices overnight. Our framework tracks publisher behavior, set anniversaries, and demand signals to forecast reprint probability before official announcements.',
    dateISO: '2025-11-12',
    badge: 'Research',
  },
  {
    kind: 'research',
    slug: 'sealed-booster-box-roi',
    title: 'Sealed Booster Box ROI: Long-Term Hold vs. Flip Strategy',
    excerpt: 'Booster boxes offer dual paths: immediate flipping or long-term appreciation. We backtest 10-year hold periods across major sets to quantify when patience pays versus quick flips.',
    dateISO: '2025-11-10',
    badge: 'Research',
  },
  {
    kind: 'intel',
    slug: 'collector-vs-investor-behavior',
    title: 'Collector vs. Investor Behavior: Market Psychology Decoded',
    excerpt: 'Collectors and investors drive different price dynamics. Our sentiment analysis separates emotional premium from investment value, revealing when markets are collector-driven versus speculative.',
    dateISO: '2025-11-08',
    badge: 'Intel',
  },
  {
    kind: 'research',
    slug: 'authentication-fraud-trends',
    title: 'Authentication & Fraud: 2025 Trends and Mitigation',
    excerpt: 'Counterfeit cards and resealing fraud escalate as TCG values rise. We survey authentication technology, common fraud vectors, and due diligence practices to protect portfolio integrity.',
    dateISO: '2025-11-05',
    badge: 'Research',
  },
  {
    kind: 'intel',
    slug: 'international-arbitrage',
    title: 'International Arbitrage: Cross-Border Pricing Opportunities',
    excerpt: 'Regional price spreads create arbitrage windows for savvy collectors. We map duty, shipping, and currency factors to identify profitable cross-border transactions in Japanese and European markets.',
    dateISO: '2025-11-02',
    badge: 'Intel',
  },
];

export default function InsightsPage() {
  return (
    <SectionShell title="Insights" kicker="Expert Analysis">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <ContentCard key={`${it.kind}-${it.slug}`} {...it} />
        ))}
      </div>
    </SectionShell>
  );
}
