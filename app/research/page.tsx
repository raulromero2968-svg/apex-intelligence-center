// app/research/page.tsx
// Research Hub - Central hub for all intel, magazine, and research content

import Link from "next/link";
import { Metadata } from "next";
import {
  SectionShell,
  SectionCard,
} from "@/components/layout/SectionShell";

export const metadata: Metadata = {
  title: "Research Hub",
  description:
    "Apex Intelligence research hub - your gateway to intel reports, magazine articles, protocols, and the Living PhD knowledge base.",
};

// Featured intel reports
const featuredIntel = [
  {
    slug: "grading-roi-analysis",
    title: "The Grading Paradox: When PSA 10 Destroys Value",
    category: "Investment Guide",
    readTime: "12 min",
    isPremium: false,
  },
  {
    slug: "japanese-arbitrage-guide",
    title: "Japanese Arbitrage Playbook: The Buyee-to-TCGPlayer Loop",
    category: "Strategy",
    readTime: "15 min",
    isPremium: true,
  },
  {
    slug: "modern-set-rotation-strategy",
    title: "The Clockwork Alpha: Profiting from Set Rotation",
    category: "Strategy",
    readTime: "9 min",
    isPremium: false,
  },
];

// Research sections
const sections = [
  {
    title: "Intel Archive",
    description:
      "Data-driven market analysis, set breakdowns, and investment research.",
    href: "/intel",
    icon: (
      <svg
        className="h-6 w-6 text-cyan-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    stats: { count: 24, label: "reports" },
  },
  {
    title: "The Magazine",
    description:
      "Long-form essays, industry analysis, and thought leadership pieces.",
    href: "/magazine",
    icon: (
      <svg
        className="h-6 w-6 text-fuchsia-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    stats: { count: 8, label: "essays" },
  },
  {
    title: "Living PhD",
    description:
      "Evolving frameworks, mental models, and systematic approaches to markets.",
    href: "/living-phd",
    icon: (
      <svg
        className="h-6 w-6 text-purple-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    stats: { count: 12, label: "frameworks" },
  },
  {
    title: "Protocols",
    description:
      "Battle-tested processes for research, trading, and portfolio management.",
    href: "/protocols",
    icon: (
      <svg
        className="h-6 w-6 text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    stats: { count: 6, label: "protocols" },
  },
];

// Intel series
const intelSeries = [
  {
    name: "Vintage WOTC Reports",
    description: "Quarterly analysis of the Pokemon/MTG vintage market",
    href: "/intel/vintage-wotc-market-report-q3-2025",
    articleCount: 4,
    isPremium: true,
  },
  {
    name: "Japanese Market Series",
    description: "Arbitrage opportunities and quality analysis",
    href: "/intel/japanese-sets-analysis",
    articleCount: 3,
    isPremium: false,
  },
  {
    name: "Rotation Strategy",
    description: "Profiting from TCG format cycles",
    href: "/intel/modern-set-rotation-strategy",
    articleCount: 2,
    isPremium: false,
  },
];

export default function ResearchPage() {
  return (
    <SectionShell
      category="RESEARCH"
      title="Research Hub"
      subtitle="Your gateway to intel reports, magazine articles, protocols, and the Living PhD knowledge base. Deep analysis for serious collectors and investors."
      status={{ label: "Live", variant: "live" }}
    >
      <div className="space-y-12">
        {/* Featured Intel */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Featured Intel</h2>
            <Link
              href="/intel"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all intel →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featuredIntel.map((item) => (
              <Link key={item.slug} href={`/intel/${item.slug}`}>
                <article className="group h-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-cyan-500/30 hover:bg-zinc-900 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-400">
                      {item.category}
                    </span>
                    {item.isPremium && (
                      <span className="rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 px-2 py-0.5 text-[9px] font-semibold text-fuchsia-300">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-500">{item.readTime}</p>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Research Sections Grid */}
        <section>
          <h2 className="text-lg font-semibold mb-6">Explore by Section</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <Link key={section.href} href={section.href}>
                <div className="group h-full rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
                      {section.icon}
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
                      {section.stats.count} {section.stats.label}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-cyan-400 transition-colors">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    {section.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-cyan-400 group-hover:translate-x-1 transition-transform">
                    Explore
                    <svg
                      className="ml-1.5 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Intel Series */}
        <section>
          <SectionCard
            title="Intel Series"
            subtitle="Curated collections of related research"
            headerAction={
              <Link
                href="/intel"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View all →
              </Link>
            }
          >
            <div className="space-y-3">
              {intelSeries.map((series) => (
                <Link key={series.href} href={series.href}>
                  <div className="group flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:border-cyan-500/30 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium group-hover:text-cyan-400 transition-colors truncate">
                          {series.name}
                        </h4>
                        {series.isPremium && (
                          <span className="shrink-0 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 px-2 py-0.5 text-[9px] font-semibold text-fuchsia-300">
                            PREMIUM
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 truncate">
                        {series.description}
                      </p>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <span className="text-xs text-zinc-400">
                        {series.articleCount} articles
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </section>

        {/* Quick Links */}
        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/tcg-analysis">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-cyan-500/30 transition-all">
              <h3 className="font-medium">TCG Analysis</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Set breakdowns & market trends
              </p>
            </div>
          </Link>
          <Link href="/pattern-recognition">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-cyan-500/30 transition-all">
              <h3 className="font-medium">Pattern Recognition</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Visual library of market patterns
              </p>
            </div>
          </Link>
          <Link href="/philosophy">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-cyan-500/30 transition-all">
              <h3 className="font-medium">Philosophy</h3>
              <p className="mt-1 text-xs text-zinc-500">
                The intellectual foundation
              </p>
            </div>
          </Link>
        </section>

        {/* Contribute CTA */}
        <section className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-cyan-500/5 via-fuchsia-500/5 to-purple-500/5 p-8 text-center">
          <h2 className="text-xl font-bold">Contribute Your Research</h2>
          <p className="mt-2 text-sm text-zinc-400 max-w-lg mx-auto">
            Have insights to share? Submit your analysis and join our network of
            contributors earning reputation and rewards.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/submit-article"
              className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2.5 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Submit Article
            </Link>
            <Link
              href="/x-intel-capture"
              className="rounded-full border border-zinc-700 px-6 py-2.5 text-[13px] font-medium text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              X Intel Capture
            </Link>
          </div>
        </section>
      </div>
    </SectionShell>
  );
}
