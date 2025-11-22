import type { Metadata } from "next";
import Image from "next/image";

import { hallOfFameContributors } from "@/data/hall-of-fame";

type HallOfFameSearchParams = {
  q?: string | string[];
  disciple?: string | string[];
};

export const metadata: Metadata = {
  title: "Hall of Fame | Apex Intelligence",
  description:
    "The Apex Intelligence Hall of Fame immortalizes the operatives whose commits forged LangChain safety, schema sync, and telemetry guardrails.",
};

const discipleOptions = [
  "all",
  ...Array.from(
    new Set(hallOfFameContributors.map((contributor) => contributor.discipleTitle)),
  ),
];

export default function HallOfFamePage({
  searchParams,
}: {
  searchParams?: HallOfFameSearchParams;
}) {
  const normalizedQuery =
    typeof searchParams?.q === "string" ? searchParams.q.toLowerCase().trim() : "";
  const discipleFilter =
    typeof searchParams?.disciple === "string" ? searchParams.disciple : "all";

  const filteredContributors = hallOfFameContributors.filter((contributor) => {
    const matchesQuery =
      !normalizedQuery ||
      contributor.name.toLowerCase().includes(normalizedQuery) ||
      contributor.discipleTitle.toLowerCase().includes(normalizedQuery) ||
      contributor.summary.toLowerCase().includes(normalizedQuery);

    const matchesDisciple =
      discipleFilter === "all" || contributor.discipleTitle === discipleFilter;

    return matchesQuery && matchesDisciple;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#010814] via-[#071631] to-[#1a0033] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(168,85,247,0.15),_transparent_50%)]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-24 sm:px-8 sm:py-32">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200/80">
            Apex Intelligence
          </p>
          <h1 className="mt-6 text-4xl font-black sm:text-5xl md:text-6xl">
            Hall of Fame
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base text-white/70 sm:text-lg">
            Contributors whose commits rebalanced Apex Intelligence after the November 19
            equilibrium event. Search and filter to study the architects behind every
            guardrail victory.
          </p>
        </header>

        <form
          className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur"
          method="get"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-white/70">
              <span className="uppercase tracking-[0.2em] text-xs text-cyan-200/80">
                Search
              </span>
              <input
                type="search"
                name="q"
                defaultValue={typeof searchParams?.q === "string" ? searchParams.q : ""}
                placeholder="Search by name, disciple, or commit lore"
                className="rounded-2xl border border-white/10 bg-[#050f24]/80 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/70">
              <span className="uppercase tracking-[0.2em] text-xs text-cyan-200/80">
                Disciple title
              </span>
              <select
                name="disciple"
                defaultValue={discipleFilter}
                className="rounded-2xl border border-white/10 bg-[#050f24]/80 px-4 py-3 text-base text-white focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
              >
                {discipleOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#050f24] text-slate-900">
                    {option === "all" ? "All disciples" : option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 text-base font-semibold text-slate-900 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
              >
                Filter records
              </button>
            </div>
          </div>
        </form>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredContributors.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-white/70">
              No contributors match that query yet. Reset the filters to see every record.
            </div>
          )}

          {filteredContributors.map((contributor) => (
            <article
              key={contributor.name}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(14,165,233,0.45)]"
            >
              <div className="absolute inset-x-4 top-4 h-24 rounded-3xl bg-gradient-to-br from-cyan-400/20 via-transparent to-fuchsia-500/20 blur-3xl opacity-0 transition duration-500 group-hover:opacity-60" />
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-[#050f24]">
                    <Image
                      src={contributor.avatar}
                      alt={`${contributor.name} avatar`}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                      priority={false}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
                      {contributor.discipleTitle}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {contributor.name}
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-white/70">{contributor.summary}</p>

                <div className="space-y-3">
                  {contributor.victories.map((victory) => (
                    <div
                      key={`${contributor.name}-${victory.commit}`}
                      className="rounded-2xl border border-cyan-300/30 bg-cyan-300/5 px-4 py-3 text-sm text-white/80"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                        {victory.commit}
                      </p>
                      <p className="mt-1 text-sm text-white/70">{victory.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/40">Status</p>
                  <p className="text-sm font-semibold text-cyan-200">
                    Victory commits guarded forever
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}


