// app/[...slug]/page.tsx
// Generic catch-all route for all Apex Intelligence pages
// Override any route by creating a dedicated file (e.g., app/market/page.tsx)

import { notFound } from "next/navigation";
import Link from "next/link";

type PageConfig = {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  description?: string;
  icon?: "market" | "deck" | "intel" | "framework" | "admin" | "account" | "community" | "education";
};

const PAGES: Record<string, PageConfig> = {
  // --- TCG / Market surface ---
  "market": {
    id: "market",
    title: "Nexus Economy TCG Market",
    subtitle: "Trade AI model cards, track prices, and explore the meta.",
    category: "Market",
    icon: "market",
  },
  "portfolio": {
    id: "portfolio",
    title: "Portfolio",
    subtitle: "Monitor your positions, card holdings, and realized P&L.",
    category: "Market",
    icon: "market",
  },
  "analytics": {
    id: "analytics",
    title: "Market Analytics",
    subtitle: "Performance dashboards, regime detection, and risk surfaces.",
    category: "Market",
    icon: "market",
  },
  "sentiment": {
    id: "sentiment",
    title: "Sentiment Index",
    subtitle: "AI-driven sentiment signals across TCG markets.",
    category: "Market",
    icon: "market",
  },
  "bot-dashboard": {
    id: "bot-dashboard",
    title: "Bot Dashboard",
    subtitle: "Monitor and configure execution + signal bots.",
    category: "Market",
    icon: "market",
  },

  // --- Decks / tournaments ---
  "deck-builder": {
    id: "deck-builder",
    title: "Deck Builder",
    subtitle: "Compose model card decks and save configurations.",
    category: "Decks",
    icon: "deck",
  },
  "my-decks": {
    id: "my-decks",
    title: "My Decks",
    subtitle: "All of your saved strategy and model decks.",
    category: "Decks",
    icon: "deck",
  },
  "deck-gallery": {
    id: "deck-gallery",
    title: "Deck Gallery",
    subtitle: "Curated decks, archetypes, and featured builds.",
    category: "Decks",
    icon: "deck",
  },
  "tournaments": {
    id: "tournaments",
    title: "Tournaments",
    subtitle: "Competitive events, formats, and live standings.",
    category: "Decks",
    icon: "deck",
  },
  "my-trades": {
    id: "my-trades",
    title: "My Trades",
    subtitle: "Execution history across decks and cards.",
    category: "Decks",
    icon: "deck",
  },

  // --- Research & Intel ---
  "research": {
    id: "research",
    title: "Research & Intel",
    subtitle: "Long-form research, frameworks, and field reports.",
    category: "Intel",
    icon: "intel",
  },
  "magazine": {
    id: "magazine",
    title: "Magazine",
    subtitle: "Narrative essays, interviews, and feature stories.",
    category: "Intel",
    icon: "intel",
  },
  "submit-article": {
    id: "submit-article",
    title: "Submit Article",
    subtitle: "Contribute research, essays, or intel to the network.",
    category: "Intel",
    icon: "intel",
  },
  "x-intel-capture": {
    id: "x-intel-capture",
    title: "X-to-Intel Capture",
    subtitle: "Capture external threads and convert them into structured intel.",
    category: "Intel",
    icon: "intel",
  },
  "intel/pokemon-151": {
    id: "intel-pokemon-151",
    title: "Intel Report: Pokémon 151",
    subtitle: "Market structure, scarcity, and rotation pressure.",
    category: "Intel Reports",
    icon: "intel",
  },
  "intel/vintage-wotc": {
    id: "intel-vintage-wotc",
    title: "Intel Report: Vintage WOTC",
    subtitle: "Vintage Wizards of the Coast sets and long-horizon theses.",
    category: "Intel Reports",
    icon: "intel",
  },
  "intel/modern-rotation": {
    id: "intel-modern-rotation",
    title: "Intel Report: Modern Rotation",
    subtitle: "Rotation dynamics and opportunity windows.",
    category: "Intel Reports",
    icon: "intel",
  },

  // --- Core frameworks / philosophy ---
  "living-phd": {
    id: "living-phd",
    title: "Living PhD",
    subtitle: "Your evolving research program inside the TCG economy.",
    category: "Frameworks",
    icon: "framework",
  },
  "protocols": {
    id: "protocols",
    title: "Protocols",
    subtitle: "Execution, governance, and coordination protocols.",
    category: "Frameworks",
    icon: "framework",
  },
  "doctrines": {
    id: "doctrines",
    title: "Doctrines",
    subtitle: "Operating principles for agents and operators.",
    category: "Frameworks",
    icon: "framework",
  },
  "pattern-recognition": {
    id: "pattern-recognition",
    title: "Pattern Recognition",
    subtitle: "Pattern libraries for markets, behavior, and signals.",
    category: "Frameworks",
    icon: "framework",
  },
  "philosophy": {
    id: "philosophy",
    title: "Philosophy",
    subtitle: "Core philosophy behind the Apex Intelligence stack.",
    category: "Frameworks",
    icon: "framework",
  },
  "tcg-analysis": {
    id: "tcg-analysis",
    title: "TCG Analysis",
    subtitle: "Deep dives on formats, cards, and structural edges.",
    category: "Frameworks",
    icon: "framework",
  },
  "leaderboard/achievements": {
    id: "leaderboard-achievements",
    title: "Leaderboard: Achievements",
    subtitle: "Reputation milestones and ecosystem achievements.",
    category: "Community",
    icon: "community",
  },
  "ai-garden": {
    id: "ai-garden",
    title: "AI Garden",
    subtitle: "Playground for experimental agents and small models.",
    category: "Community",
    icon: "community",
  },

  // --- Education / marketplace ---
  "teacher-hub": {
    id: "teacher-hub",
    title: "Teacher Knowledge Hub",
    subtitle: "Resources for educators and cohort-based learning.",
    category: "Education",
    icon: "education",
  },
  "marketplace/knowledge": {
    id: "marketplace-knowledge",
    title: "Knowledge Marketplace",
    subtitle: "Curated knowledge products, prompts, and playbooks.",
    category: "Market",
    icon: "market",
  },

  // --- Knowledge library ---
  "folders": {
    id: "folders",
    title: "Electronic Folders",
    subtitle: "Structured intel folders and archival views.",
    category: "Knowledge Library",
    icon: "intel",
  },
  "scrolls": {
    id: "scrolls",
    title: "Digital Scrolls",
    subtitle: "Long-form archives and special dispatches.",
    category: "Knowledge Library",
    icon: "intel",
  },
  "the-gate": {
    id: "the-gate",
    title: "The Gate",
    subtitle: "Platinum-tier intel surface and gated research.",
    category: "Access",
    icon: "intel",
  },

  // --- Wallet / integrations ---
  "wallet": {
    id: "wallet",
    title: "Wallet",
    subtitle: "Balances, reputation credits, and positions.",
    category: "Account",
    icon: "account",
  },
  "upwork-import": {
    id: "upwork-import",
    title: "Upwork Import",
    subtitle: "Ingest Upwork reviews and convert them into reputation.",
    category: "Integrations",
    icon: "account",
  },

  // --- Admin surfaces ---
  "admin": {
    id: "admin",
    title: "Admin Panel",
    subtitle: "High-level controls for the Apex ecosystem.",
    category: "Admin",
    icon: "admin",
  },
  "admin/reviews": {
    id: "admin-reviews",
    title: "Admin: Reviews",
    subtitle: "Moderate and curate user reviews and intel.",
    category: "Admin",
    icon: "admin",
  },
  "admin/articles": {
    id: "admin-articles",
    title: "Admin: Articles",
    subtitle: "Editorial controls for research and magazine content.",
    category: "Admin",
    icon: "admin",
  },
  "admin/upwork-review": {
    id: "admin-upwork-review",
    title: "Admin: Upwork Review",
    subtitle: "Manage imported reviews and mapping to reputation.",
    category: "Admin",
    icon: "admin",
  },
  "admin/tournaments": {
    id: "admin-tournaments",
    title: "Admin: Tournaments",
    subtitle: "Configure events, brackets, and deck rules.",
    category: "Admin",
    icon: "admin",
  },
  "admin/gate-intel": {
    id: "admin-gate-intel",
    title: "Admin: Gate Intel",
    subtitle: "Configure who sees what inside The Gate.",
    category: "Admin",
    icon: "admin",
  },

  // --- Profile / favorites / settings ---
  "profile": {
    id: "profile",
    title: "Profile",
    subtitle: "Operator profile, roles, and reputation history.",
    category: "Account",
    icon: "account",
  },
  "favorites": {
    id: "favorites",
    title: "Favorites",
    subtitle: "Saved decks, intel reports, and models.",
    category: "Account",
    icon: "account",
  },
  "domains": {
    id: "domains",
    title: "Domains",
    subtitle: "Manage connected domains and properties.",
    category: "Account",
    icon: "account",
  },
  "domain-health": {
    id: "domain-health",
    title: "Domain Health",
    subtitle: "Monitor domain trust, deliverability, and SEO health.",
    category: "Account",
    icon: "account",
  },
  "notification-preferences": {
    id: "notification-preferences",
    title: "Notification Preferences",
    subtitle: "Control how and where we ping you.",
    category: "Account",
    icon: "account",
  },
};

// Icon components for each category
function getIcon(icon?: string) {
  switch (icon) {
    case "market":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case "deck":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case "intel":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "framework":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    case "admin":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "account":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "community":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "education":
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Market":
      return "from-cyan-500 to-cyan-600";
    case "Decks":
      return "from-fuchsia-500 to-fuchsia-600";
    case "Intel":
    case "Intel Reports":
    case "Knowledge Library":
      return "from-purple-500 to-purple-600";
    case "Frameworks":
      return "from-amber-500 to-amber-600";
    case "Admin":
      return "from-red-500 to-red-600";
    case "Account":
    case "Integrations":
      return "from-emerald-500 to-emerald-600";
    case "Community":
      return "from-blue-500 to-blue-600";
    case "Education":
      return "from-indigo-500 to-indigo-600";
    case "Access":
      return "from-yellow-500 to-yellow-600";
    default:
      return "from-zinc-500 to-zinc-600";
  }
}

function getCategoryTextColor(category: string) {
  switch (category) {
    case "Market":
      return "text-cyan-300";
    case "Decks":
      return "text-fuchsia-300";
    case "Intel":
    case "Intel Reports":
    case "Knowledge Library":
      return "text-purple-300";
    case "Frameworks":
      return "text-amber-300";
    case "Admin":
      return "text-red-300";
    case "Account":
    case "Integrations":
      return "text-emerald-300";
    case "Community":
      return "text-blue-300";
    case "Education":
      return "text-indigo-300";
    case "Access":
      return "text-yellow-300";
    default:
      return "text-zinc-300";
  }
}

function getCategoryBgColor(category: string) {
  switch (category) {
    case "Market":
      return "bg-cyan-500/10";
    case "Decks":
      return "bg-fuchsia-500/10";
    case "Intel":
    case "Intel Reports":
    case "Knowledge Library":
      return "bg-purple-500/10";
    case "Frameworks":
      return "bg-amber-500/10";
    case "Admin":
      return "bg-red-500/10";
    case "Account":
    case "Integrations":
      return "bg-emerald-500/10";
    case "Community":
      return "bg-blue-500/10";
    case "Education":
      return "bg-indigo-500/10";
    case "Access":
      return "bg-yellow-500/10";
    default:
      return "bg-zinc-500/10";
  }
}

function friendlyPath(slug: string[]) {
  if (!slug.length) return "/";
  return "/" + slug.join("/");
}

// Get related pages in the same category
function getRelatedPages(currentKey: string, category: string): Array<{ key: string; config: PageConfig }> {
  return Object.entries(PAGES)
    .filter(([key, config]) => config.category === category && key !== currentKey)
    .slice(0, 4)
    .map(([key, config]) => ({ key, config }));
}

export default async function GenericPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArr = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const key = slugArr.join("/");
  const config = PAGES[key];

  if (!config) {
    return notFound();
  }

  const relatedPages = getRelatedPages(key, config.category);
  const categoryColor = getCategoryColor(config.category);
  const categoryTextColor = getCategoryTextColor(config.category);
  const categoryBgColor = getCategoryBgColor(config.category);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 md:px-6 pt-24">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] text-zinc-500">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            Apex Intelligence
          </Link>
          <span className="mx-1">/</span>
          <span className={categoryTextColor}>{config.category}</span>
          <span className="mx-1">/</span>
          <span className="text-zinc-100">
            {friendlyPath(slugArr).replace(/^\//, "")}
          </span>
        </nav>

        {/* Heading */}
        <header className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${categoryBgColor} ${categoryTextColor}`}>
              {getIcon(config.icon)}
            </div>
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${categoryTextColor}`}>
                {config.category}
              </p>
              <h1 className="text-2xl font-semibold md:text-3xl">
                {config.title}
              </h1>
            </div>
          </div>
          {config.subtitle && (
            <p className="max-w-2xl text-sm text-zinc-300 md:text-base">
              {config.subtitle}
            </p>
          )}
        </header>

        {/* Main content placeholder */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${categoryColor} animate-pulse`} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Page Active
              </span>
            </div>

            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                This page is wired up in the Next.js app and deployed via Vercel.
                The routing infrastructure is ready — replace this placeholder with
                the real layout and components.
              </p>

              <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500 mb-2">
                  Route Info
                </p>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="text-zinc-500">Path:</span>{" "}
                    <code className="text-cyan-300">{friendlyPath(slugArr)}</code>
                  </p>
                  <p>
                    <span className="text-zinc-500">ID:</span>{" "}
                    <code className="text-fuchsia-300">{config.id}</code>
                  </p>
                  <p>
                    <span className="text-zinc-500">Category:</span>{" "}
                    <code className={categoryTextColor}>{config.category}</code>
                  </p>
                </div>
              </div>

              <p className="text-zinc-500 text-xs">
                To customize this page, create a dedicated file at{" "}
                <code className="text-zinc-300">app/{slugArr.join("/")}/page.tsx</code>
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/terminal"
            className="group rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                  Open Terminal
                </p>
                <p className="text-[10px] text-zinc-500">
                  Access the command interface
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/market"
            className="group rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 hover:border-fuchsia-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-fuchsia-300 transition-colors">
                  TCG Market
                </p>
                <p className="text-[10px] text-zinc-500">
                  Browse model cards
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/research"
            className="group rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                  Research
                </p>
                <p className="text-[10px] text-zinc-500">
                  Intel & field reports
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="group rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 hover:border-zinc-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-zinc-300 transition-colors">
                  Home
                </p>
                <p className="text-[10px] text-zinc-500">
                  Return to landing
                </p>
              </div>
            </div>
          </Link>
        </section>

        {/* Related Pages */}
        {relatedPages.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Related in {config.category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPages.map(({ key, config: relatedConfig }) => (
                <Link
                  key={key}
                  href={`/${key}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 hover:border-zinc-700 transition-all"
                >
                  <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {relatedConfig.title}
                  </p>
                  {relatedConfig.subtitle && (
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                      {relatedConfig.subtitle}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// Generate static params for all known routes
export function generateStaticParams() {
  return Object.keys(PAGES).map((path) => ({
    slug: path.split("/"),
  }));
}

// Generate metadata for each page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArr = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const key = slugArr.join("/");
  const config = PAGES[key];

  if (!config) {
    return {
      title: "Not Found",
    };
  }

  return {
    title: config.title,
    description: config.subtitle || `${config.title} - Apex Intelligence ${config.category}`,
  };
}
