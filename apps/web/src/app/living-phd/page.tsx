// app/living-phd/page.tsx
import { SectionShell } from "@/components/section-shell";
import Link from "next/link";

type Phase = {
  id: string;
  title: string;
  tag: string;
  description: string;
  outcomes: string[];
  relatedLinks: { label: string; href: string }[];
};

const phases: Phase[] = [
  {
    id: "foundation",
    title: "Phase I — Foundation & Surfaces",
    tag: "Orientation",
    description:
      "Define your core questions, surfaces, and constraints. Treat the TCG meta and Apex economy as your lab.",
    outcomes: [
      "Write a one-page \"thesis\" for what you want to understand or exploit.",
      "Map the key surfaces you interact with (Market, Intel, Decks, Research).",
      "Set a cadence for logging experiments and observations.",
    ],
    relatedLinks: [
      { label: "Research & Intel Hub", href: "/research" },
      { label: "TCG Analysis", href: "/tcg-analysis" },
    ],
  },
  {
    id: "fieldwork",
    title: "Phase II — Fieldwork & Experiments",
    tag: "Practice",
    description:
      "Run small, reversible experiments in the live TCG and intelligence market. Log, annotate, and publish micro-findings.",
    outcomes: [
      "Ship at least one deck or strategy into the Market surface.",
      "Write short field reports from real trades or tests.",
      "Capture external signals into X-to-Intel or your Folders.",
    ],
    relatedLinks: [
      { label: "Market", href: "/market" },
      { label: "My Trades", href: "/my-trades" },
      { label: "X-to-Intel Capture", href: "/x-intel-capture" },
    ],
  },
  {
    id: "canon",
    title: "Phase III — Canon & Doctrine",
    tag: "Synthesis",
    description:
      "Turn scattered notes and experiments into named concepts, doctrines, and reusable playbooks.",
    outcomes: [
      "Name at least three patterns you can point to in future work.",
      "Write an internal \"doctrine\" document that explains how you operate.",
      "Contribute one piece to the Magazine or Research canon.",
    ],
    relatedLinks: [
      { label: "Protocols", href: "/protocols" },
      { label: "Doctrines", href: "/doctrines" },
      { label: "Submit Article", href: "/submit-article" },
    ],
  },
  {
    id: "network",
    title: "Phase IV — Network & Reputation",
    tag: "Compounding",
    description:
      "Turn your personal research into networked intelligence. Coordinate with other operators, and let reputation compound.",
    outcomes: [
      "Have your work referenced by other decks, reports, or tools.",
      "Show up on at least one leaderboard or reputation surface.",
      "Co-author or co-design a shared protocol or framework.",
    ],
    relatedLinks: [
      { label: "Leaderboard / Achievements", href: "/leaderboard/achievements" },
      { label: "AI Garden", href: "/ai-garden" },
    ],
  },
];

export default function LivingPhDPage() {
  return (
    <SectionShell
      category="Living PhD"
      badgeLabel="PROGRAM"
      title="The Living PhD"
      subtitle="Instead of a static credential, treat your work as a persistent research program that evolves with the Apex intelligence economy."
      path="/living-phd"
    >
      <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr]">
        {/* Left: phases */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-fuchsia-500/10 to-purple-500/15 p-5 text-xs text-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              WHY A &quot;LIVING&quot; PHD?
            </p>
            <p className="mt-2">
              Traditional PhDs freeze your work in a single document. The
              Living PhD treats your decks, intel reports, experiments, and
              doctrines as a constantly-updating research program. The goal
              isn&apos;t a diploma—it&apos;s a compounding reputation trail.
            </p>
            <p className="mt-3">
              You can start with whatever you&apos;re already doing inside Apex
              Intelligence and gradually harden it into concept, canon, and
              coordination.
            </p>
          </section>

          <section className="space-y-4">
            {phases.map((phase, idx) => (
              <div
                key={phase.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-300">
                    {phase.tag}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Step {idx + 1} of {phases.length}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-semibold text-white md:text-base">
                  {phase.title}
                </h2>
                <p className="mt-2 text-xs text-zinc-300 md:text-sm">
                  {phase.description}
                </p>

                <div className="mt-3 space-y-1.5 text-[11px] text-zinc-200 md:text-xs">
                  <p className="font-semibold text-zinc-100">Practical outcomes</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {phase.outcomes.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>

                {phase.relatedLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {phase.relatedLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center rounded-full border border-cyan-500/50 px-3 py-1 text-[11px] font-medium text-cyan-200 hover:border-cyan-300 hover:text-cyan-100"
                      >
                        {link.label} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>

        {/* Right: dashboard-style summary */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-xs text-zinc-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              HOW TO START
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-4">
              <li>
                Pick a domain you already care about (e.g., Pokémon 151,
                Vintage WOTC, a specific tournament format).
              </li>
              <li>
                Declare that as your Living PhD focus and write a one-page
                thesis for yourself.
              </li>
              <li>
                Attach every deck, trade, and intel report you create back to
                that thesis.
              </li>
            </ol>
          </section>

          <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-xs text-zinc-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              RECOMMENDED SURFACES
            </p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/portfolio"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Portfolio
                </Link>{" "}
                for tracking experiments in live capital.
              </li>
              <li>
                <Link
                  href="/folders"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Folders
                </Link>{" "}
                for structured notes and intel objects.
              </li>
              <li>
                <Link
                  href="/magazine"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Magazine
                </Link>{" "}
                for more narrative writeups.
              </li>
              <li>
                <Link
                  href="/leaderboard/achievements"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Leaderboard & Achievements
                </Link>{" "}
                as an external score for how visible your work becomes.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-xs text-zinc-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              OPTIONAL: FORMALIZE IT
            </p>
            <p className="mt-2">
              When you&apos;re ready, you can treat the Living PhD like a
              semi-formal program: define entry criteria, milestones, and
              &quot;graduation&quot; artifacts. But you don&apos;t need
              permission to start—the program begins the moment you declare it.
            </p>
          </section>
        </aside>
      </div>
    </SectionShell>
  );
}
