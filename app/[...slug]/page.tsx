// app/[...slug]/page.tsx
// Catch-all router for pages that don't have dedicated page.tsx files yet
// Provides consistent layout and SEO metadata for all routes

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import {
  SectionShell,
  SectionCard,
  EmptyState,
} from "@/components/layout/SectionShell";
import { PageMeta } from "@/lib/types";

// ============================================================================
// PAGE DEFINITIONS
// Maps URL paths to page metadata. Add new pages here as needed.
// ============================================================================

const PAGES: Record<string, PageMeta> = {
  // Core platform pages
  analytics: {
    title: "Analytics Dashboard",
    subtitle:
      "Real-time market analytics, performance metrics, and intelligence insights across all tracked assets.",
    description:
      "Apex Intelligence analytics dashboard with real-time market data, performance metrics, and AI-driven insights.",
    category: "ANALYTICS",
    status: { label: "Beta", variant: "beta" },
  },
  sentiment: {
    title: "Market Sentiment",
    subtitle:
      "Aggregated sentiment analysis from social feeds, news, and on-chain signals.",
    description:
      "Market sentiment analysis dashboard tracking social signals, news flow, and on-chain indicators.",
    category: "SENTIMENT",
    status: { label: "Beta", variant: "beta" },
  },
  "bot-dashboard": {
    title: "Bot Dashboard",
    subtitle:
      "Monitor and manage your automated trading bots and model executors.",
    description:
      "Apex Intelligence bot dashboard for monitoring automated trading systems and model executors.",
    category: "AUTOMATION",
    status: { label: "Coming Soon", variant: "coming-soon" },
  },

  // Research & Content universe
  magazine: {
    title: "The Magazine",
    subtitle:
      "Long-form essays, industry analysis, and thought leadership from the Apex research team.",
    description:
      "Apex Intelligence magazine featuring long-form essays, industry analysis, and investment research.",
    category: "MAGAZINE",
    parentPath: "/research",
    parentLabel: "Research",
  },
  "submit-article": {
    title: "Submit an Article",
    subtitle:
      "Contribute your research and analysis to the Apex Intelligence community.",
    description:
      "Submit your trading card research and market analysis to Apex Intelligence.",
    category: "CONTRIBUTE",
    parentPath: "/research",
    parentLabel: "Research",
  },
  "x-intel-capture": {
    title: "X Intel Capture",
    subtitle:
      "Automated intelligence extraction from X/Twitter feeds and social signals.",
    description:
      "X/Twitter intelligence capture tool for extracting market signals and social sentiment.",
    category: "TOOLS",
    status: { label: "Beta", variant: "beta" },
  },
  "living-phd": {
    title: "The Living PhD",
    subtitle:
      "An evolving body of knowledge. Protocols, frameworks, and mental models for systematic investing.",
    description:
      "The Living PhD - evolving investment frameworks, mental models, and systematic trading protocols.",
    category: "PHILOSOPHY",
    status: { label: "Live", variant: "live" },
  },
  protocols: {
    title: "Protocols",
    subtitle:
      "Battle-tested processes for research, trading, and portfolio management.",
    description:
      "Trading protocols and systematic processes for research, execution, and risk management.",
    category: "PROTOCOLS",
    parentPath: "/living-phd",
    parentLabel: "Living PhD",
  },
  doctrines: {
    title: "Doctrines",
    subtitle: "Core principles and beliefs that guide the Apex approach.",
    description:
      "Investment doctrines and core principles guiding the Apex Intelligence methodology.",
    category: "DOCTRINES",
    parentPath: "/living-phd",
    parentLabel: "Living PhD",
  },
  "pattern-recognition": {
    title: "Pattern Recognition",
    subtitle: "Visual library of market patterns, setups, and recurring signals.",
    description:
      "Market pattern recognition library with visual examples of trading setups and signals.",
    category: "PATTERNS",
    parentPath: "/living-phd",
    parentLabel: "Living PhD",
  },
  philosophy: {
    title: "Philosophy",
    subtitle:
      "The intellectual foundation. Why we think the way we think about markets.",
    description:
      "Investment philosophy and intellectual foundations of the Apex Intelligence approach.",
    category: "PHILOSOPHY",
  },
  "tcg-analysis": {
    title: "TCG Analysis",
    subtitle:
      "Deep dives into trading card game markets, set releases, and collectible trends.",
    description:
      "Trading card game market analysis covering Pokemon, MTG, Lorcana, and collectible trends.",
    category: "TCG",
    parentPath: "/research",
    parentLabel: "Research",
  },

  // Deck builder & tournaments
  "deck-builder": {
    title: "Deck Builder",
    subtitle: "Construct and backtest model card decks for systematic trading.",
    description:
      "Build and backtest trading model decks with the Apex Intelligence deck builder.",
    category: "LAB",
    status: { label: "Beta", variant: "beta" },
  },
  "my-decks": {
    title: "My Decks",
    subtitle: "Your saved deck configurations and performance history.",
    description: "Manage your saved model card decks and track performance.",
    category: "DECKS",
    parentPath: "/deck-builder",
    parentLabel: "Deck Builder",
  },
  "deck-gallery": {
    title: "Deck Gallery",
    subtitle:
      "Browse community-created decks and top-performing configurations.",
    description:
      "Explore community decks and top-performing model configurations.",
    category: "GALLERY",
    parentPath: "/deck-builder",
    parentLabel: "Deck Builder",
  },
  tournaments: {
    title: "Tournaments",
    subtitle: "Compete in deck battles and model performance tournaments.",
    description:
      "Apex Intelligence tournaments for deck battles and model competitions.",
    category: "COMPETE",
    status: { label: "Coming Soon", variant: "coming-soon" },
  },

  // Community & Account
  profile: {
    title: "Your Profile",
    subtitle: "Manage your account, reputation, and public presence.",
    description: "Manage your Apex Intelligence profile and account settings.",
    category: "ACCOUNT",
  },
  favorites: {
    title: "Favorites",
    subtitle: "Your saved cards, decks, and intel articles.",
    description: "View and manage your favorited items on Apex Intelligence.",
    category: "FAVORITES",
    parentPath: "/profile",
    parentLabel: "Profile",
  },
  domains: {
    title: "Your Domains",
    subtitle: "Manage your registered intel domains and namespaces.",
    description: "Manage your registered domains on Apex Intelligence.",
    category: "DOMAINS",
    parentPath: "/profile",
    parentLabel: "Profile",
  },
  "domain-health": {
    title: "Domain Health",
    subtitle: "Monitor uptime, performance, and health of your domains.",
    description: "Domain health monitoring and uptime tracking.",
    category: "MONITORING",
    parentPath: "/domains",
    parentLabel: "Domains",
  },
  "notification-preferences": {
    title: "Notification Preferences",
    subtitle: "Configure how and when you receive alerts and updates.",
    description: "Manage your notification preferences on Apex Intelligence.",
    category: "SETTINGS",
    parentPath: "/profile",
    parentLabel: "Profile",
  },
  "leaderboard/achievements": {
    title: "Leaderboard & Achievements",
    subtitle:
      "Track your progress and see how you rank against the community.",
    description:
      "Apex Intelligence leaderboard and achievement tracking system.",
    category: "LEADERBOARD",
  },
  "ai-garden": {
    title: "AI Garden",
    subtitle:
      "Experimental playground for testing new models and strategies.",
    description: "Experimental AI sandbox for testing models and strategies.",
    category: "EXPERIMENTS",
    status: { label: "Beta", variant: "beta" },
  },

  // Admin
  "admin/users": {
    title: "User Management",
    subtitle: "Manage user accounts, permissions, and access levels.",
    description: "Admin panel for managing Apex Intelligence users.",
    category: "ADMIN",
    parentPath: "/admin",
    parentLabel: "Admin",
  },
  "admin/content": {
    title: "Content Management",
    subtitle: "Manage articles, intel reports, and published content.",
    description: "Admin panel for managing Apex Intelligence content.",
    category: "ADMIN",
    parentPath: "/admin",
    parentLabel: "Admin",
  },

  // Marketplace & Education
  "teacher-hub": {
    title: "Teacher Hub",
    subtitle: "Resources for educators and workshop facilitators.",
    description:
      "Educational resources and materials for TCG investment education.",
    category: "EDUCATION",
    status: { label: "Coming Soon", variant: "coming-soon" },
  },
  "marketplace/knowledge": {
    title: "Knowledge Marketplace",
    subtitle: "Buy and sell research, models, and educational content.",
    description: "Marketplace for trading research, models, and intel.",
    category: "MARKETPLACE",
    status: { label: "Coming Soon", variant: "coming-soon" },
  },

  // Tools & Utilities
  folders: {
    title: "Folders",
    subtitle: "Organize your research, cards, and intel into collections.",
    description:
      "Organize your Apex Intelligence content into custom folders.",
    category: "TOOLS",
  },
  scrolls: {
    title: "Scrolls",
    subtitle: "Time-locked intel drops and exclusive content releases.",
    description: "Time-locked intel releases and exclusive content on Apex.",
    category: "SCROLLS",
    status: { label: "Premium", variant: "premium" },
  },
  "the-gate": {
    title: "The Gate",
    subtitle: "Entry point for new members. Onboarding and orientation.",
    description: "Onboarding portal for new Apex Intelligence members.",
    category: "ONBOARDING",
  },
  "upwork-import": {
    title: "Upwork Import",
    subtitle: "Import your Upwork reputation and work history.",
    description: "Import reputation from Upwork to Apex Intelligence.",
    category: "IMPORT",
    status: { label: "Beta", variant: "beta" },
  },

  // About & Info (may redirect to apexcommons.org)
  about: {
    title: "About Apex Intelligence",
    subtitle:
      "The underground intel source for serious TCG collectors and investors.",
    description:
      "About Apex Intelligence - premium TCG market intelligence and analysis platform.",
    category: "ABOUT",
  },
  subscribe: {
    title: "Subscribe",
    subtitle:
      "Get premium intel, early access, and exclusive research delivered to your inbox.",
    description:
      "Subscribe to Apex Intelligence for premium market analysis and exclusive intel.",
    category: "SUBSCRIBE",
  },

  // Default fallback for intel sub-pages
  "intel/pokemon-151": {
    title: "Pokemon 151 Market Intel",
    subtitle:
      "Comprehensive analysis of the Pokemon 151 set - chase cards, market trajectory, and investment thesis.",
    description:
      "Pokemon 151 TCG market analysis with chase card tracking and investment insights.",
    category: "INTEL REPORT",
    parentPath: "/intel",
    parentLabel: "Intel",
    status: { label: "Live", variant: "live" },
  },
  "intel/vintage-wotc": {
    title: "Vintage WOTC Market Report",
    subtitle:
      "Quarterly intelligence on the Pokemon/MTG vintage market with PSA population analysis.",
    description:
      "Vintage WOTC Pokemon and MTG market analysis with grading population data.",
    category: "INTEL REPORT",
    parentPath: "/intel",
    parentLabel: "Intel",
    status: { label: "Premium", variant: "premium" },
  },
  "intel/modern-rotation": {
    title: "Modern Rotation Strategy",
    subtitle:
      "Profiting from the cyclical nature of TCG formats. The rotation V-curve explained.",
    description:
      "TCG set rotation investment strategy and cycle timing analysis.",
    category: "INTEL REPORT",
    parentPath: "/intel",
    parentLabel: "Intel",
  },
};

// ============================================================================
// METADATA GENERATION
// ============================================================================

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  const page = PAGES[path];

  if (!page) {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }

  return {
    title: page.title,
    description: page.description,
    openGraph: {
      title: `${page.title} | Apex Intelligence`,
      description: page.description,
      type: "website",
      images: page.ogImage ? [page.ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
    },
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function GenericPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug.join("/");
  const page = PAGES[path];

  if (!page) {
    notFound();
  }

  // Build breadcrumbs
  const breadcrumbs = [];
  if (page.parentPath && page.parentLabel) {
    breadcrumbs.push({
      label: page.parentLabel,
      href: page.parentPath,
    });
  }
  breadcrumbs.push({ label: page.title });

  return (
    <SectionShell
      category={page.category}
      title={page.title}
      subtitle={page.subtitle}
      status={page.status}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-8">
        {/* Status message for coming soon / beta pages */}
        {page.status?.variant === "coming-soon" && (
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900/50 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20">
              <svg
                className="h-8 w-8 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Coming Soon</h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
              This feature is under active development. Subscribe to get
              notified when it launches.
            </p>
            <Link
              href="/subscribe"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-2.5 text-[12px] font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Get Notified
            </Link>
          </div>
        )}

        {/* Beta notice */}
        {page.status?.variant === "beta" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
            <span className="font-semibold text-amber-300">Beta: </span>
            <span className="text-zinc-300">
              This feature is in beta. Expect rough edges and send feedback to
              help us improve.
            </span>
          </div>
        )}

        {/* Content area - for now shows placeholder */}
        {page.status?.variant !== "coming-soon" && (
          <SectionCard
            title="Content"
            subtitle="This section is being built out"
          >
            <EmptyState
              title="Content Loading..."
              description="This page is wired up and ready for real data. Check back soon for full functionality."
              action={{
                label: "Back to Terminal",
                href: "/terminal",
              }}
            />
          </SectionCard>
        )}

        {/* Quick links based on parent */}
        {page.parentPath && (
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <Link
              href={page.parentPath}
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to {page.parentLabel}
            </Link>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
