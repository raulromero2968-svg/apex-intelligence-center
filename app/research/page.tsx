// app/research/page.tsx
import Link from "next/link";
import { SectionShell } from "@/components/section-shell";

type IntelLink = {
  title: string;
  href: string;
  tag?: string;
  description?: string;
};

const featuredIntel: IntelLink[] = [
  {
    title: "Pokémon 151",
    href: "/intel/pokemon-151",
    tag: "TCG Meta",
    description:
      "Structure, scarcity, and rotation pressure in the Pokémon 151 product line.",
  },
  {
    title: "Vintage WOTC Thesis",
    href: "/intel/vintage-wotc",
    tag: "Vintage",
    description:
      "Why early Wizards of the Coast sets behave like a long-horizon collectible bond.",
  },
  {
    title: "Modern Rotation Windows",
    href: "/intel/modern-rotation",
    tag: "Rotation",
    description:
      "Mapping rotation cycles to opportunity windows and liquidation risk.",
  },
];

const researchSeries: IntelLink[] = [
  {
    title: "Living PhD",
    href: "/living-phd",
    tag: "Program",
    description:
      "Treat your work as a persistent research program instead of scattered notes.",
  },
  {
    title: "Protocols & Doctrines",
    href: "/protocols",
    tag: "Playbooks",
    description:
      "Execution rules, coordination patterns, and operating doctrines for agents.",
  },
  {
    title: "Pattern Recognition Library",
    href: "/pattern-recognition",
    tag: "Library",
    description:
      "Named patterns for markets, players, and behavioral regimes.",
  },
  {
    title: "TCG Analysis Canon",
    href: "/tcg-analysis",
    tag: "Canon",
    description:
      "Core analytical pieces on TCG structures, formats, and edges.",
  },
];

const toolsAndCapture: IntelLink[] = [
  {
    title: "Magazine",
    href: "/magazine",
    tag: "Narrative",
    description:
      "Long-form essays, interviews, and field reports from the Apex ecosystem.",
  },
  {
    title: "Submit Article",
    href: "/submit-article",
    tag: "Author",
    description:
      "Propose new research, stories, or intel drops for editorial review.",
  },
  {
    title: "X-to-Intel Capture",
    href: "/x-intel-capture",
    tag: "Capture",
    description:
      "Ingest external threads and convert them into structured Apex intel objects.",
  },
  {
    title: "AI Garden",
    href: "/ai-garden",
    tag: "Playground",
    description:
      "Experimental agents and small models that feed future research.",
  },
];

export default function ResearchPage() {
  return (
    <SectionShell
      category="Intel"
      badgeLabel="INTEL HUB"
      title="Research & Intelligence"
      subtitle="A living canon of reports, essays, and programs that make the Apex TCG more legible and more profitable."
      path="/research"
    >
      <div className="grid gap-8 lg:grid-cols-[2fr,1.25fr]">
        {/* Left: Featured intel + series */}
        <div className="space-y-8">
          {/* Featured intel */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Featured Intel Reports
              </h2>
              <span className="text-[11px] text-zinc-500">
                Curated from the Apex intelligence stream
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredIntel.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition hover:border-cyan-400/60 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    {item.tag && (
                      <span className="inline-flex items-center rounded-full border border-cyan-500/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-cyan-300">
                        {item.tag}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500">
                      Intel Surface
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 text-xs text-zinc-300">
                      {item.description}
                    </p>
                  )}
                  <span className="mt-3 text-[11px] text-cyan-300 group-hover:text-cyan-200">
                    Open report →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Research series */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
                Research Series & Programs
              </h2>
              <span className="text-[11px] text-zinc-500">
                Long-horizon work you return to over time
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {researchSeries.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition hover:border-fuchsia-400/60 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    {item.tag && (
                      <span className="inline-flex items-center rounded-full border border-fuchsia-500/60 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-fuchsia-300">
                        {item.tag}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500">
                      Research Track
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 text-xs text-zinc-300">
                      {item.description}
                    </p>
                  )}
                  <span className="mt-3 text-[11px] text-fuchsia-300 group-hover:text-fuchsia-200">
                    View series →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Tools, capture, and flows */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-fuchsia-500/10 to-purple-500/15 p-5 text-xs text-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              HOW TO USE THIS SURFACE
            </p>
            <p className="mt-2">
              Start with one or two featured reports to calibrate, then pick a
              research series to treat as your &quot;living&quot; program. Use
              capture tools to turn raw threads into structured intel objects.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px] text-zinc-200">
              <li>Pick one flagship report to annotate.</li>
              <li>Choose a track (Living PhD, Protocols, etc.).</li>
              <li>Capture external threads into X-to-Intel.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-100 md:text-base">
              Tools & Capture
            </h2>
            <div className="space-y-3">
              {toolsAndCapture.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition hover:border-cyan-400/60 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    {item.tag && (
                      <span className="inline-flex items-center rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-200">
                        {item.tag}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500">Tool</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 text-xs text-zinc-300">
                      {item.description}
                    </p>
                  )}
                  <span className="mt-3 text-[11px] text-cyan-300 group-hover:text-cyan-200">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </SectionShell>
  );
}
