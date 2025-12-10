// components/intel-report-layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { SectionShell } from "./section-shell";

type IntelMeta = {
  category: string;
  title: string;
  subtitle?: string;
  tag?: string;
  path: string;
  readingTime?: string;
  lastUpdated?: string;
};

type IntelReportLayoutProps = IntelMeta & {
  children: ReactNode;
  sidebar?: ReactNode;
};

export function IntelReportLayout({
  category,
  title,
  subtitle,
  tag,
  path,
  readingTime,
  lastUpdated,
  children,
  sidebar,
}: IntelReportLayoutProps) {
  return (
    <SectionShell
      category={category}
      badgeLabel={tag ?? category}
      title={title}
      subtitle={subtitle}
      path={path}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(260px,1fr)]">
        {/* Body */}
        <article className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-sm text-zinc-200 md:p-6">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            {readingTime && (
              <span className="rounded-full border border-zinc-700 px-2 py-0.5">
                {readingTime} read
              </span>
            )}
            {lastUpdated && <span>Last updated {lastUpdated}</span>}
          </div>

          {children}
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          {sidebar ?? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                HOW TO USE THIS
              </p>
              <p className="mt-2">
                Treat this report as a living object. You can reference it from
                decks, trades, and future intel surfaces. Over time, refine it
                as the meta changes.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              RELATED SURFACES
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link
                  href="/market"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Market
                </Link>{" "}
                for live pricing of decks tied to this thesis.
              </li>
              <li>
                <Link
                  href="/portfolio"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Portfolio
                </Link>{" "}
                to see exposure.
              </li>
              <li>
                <Link
                  href="/research"
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Research Hub
                </Link>{" "}
                for adjacent reports.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </SectionShell>
  );
}
