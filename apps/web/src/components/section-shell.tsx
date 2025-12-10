// components/section-shell.tsx
import type { ReactNode } from "react";
import Link from "next/link";

type SectionShellProps = {
  category: string;
  title: string;
  subtitle?: string;
  path?: string;
  badgeLabel?: string;
  children: ReactNode;
  /** When true, bypasses max-width constraints for full-width layouts */
  fullWidth?: boolean;
};

export function SectionShell({
  category,
  title,
  subtitle,
  path,
  badgeLabel,
  children,
  fullWidth = false,
}: SectionShellProps) {
  const displayPath = path ?? "";

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 md:px-6">
      <div className={`mx-auto space-y-6 ${fullWidth ? 'max-w-none' : 'max-w-6xl'}`}>
        {/* Breadcrumb */}
        <div className="text-[11px] text-zinc-500">
          <Link href="/" className="text-zinc-400 hover:text-zinc-200">
            Apex Intelligence
          </Link>
          {displayPath && (
            <>
              <span className="mx-1">/</span>
              <span className="text-zinc-300">{category}</span>
              <span className="mx-1">/</span>
              <span className="text-zinc-100">
                {displayPath.replace(/^\//, "")}
              </span>
            </>
          )}
        </div>

        {/* Heading */}
        <header className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
            {badgeLabel ?? category}
          </p>
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {subtitle && (
            <p className="max-w-2xl text-sm text-zinc-300 md:text-base">
              {subtitle}
            </p>
          )}
        </header>

        {/* Content */}
        {children}
      </div>
    </main>
  );
}
