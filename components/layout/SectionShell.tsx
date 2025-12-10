// components/layout/SectionShell.tsx
// Reusable wrapper for section pages with consistent layout and styling

import Link from "next/link";
import { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface SectionShellProps {
  /** Category badge text (e.g., "RESEARCH", "INTEL", "PORTFOLIO") */
  category?: string;
  /** Page title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Breadcrumb path for navigation */
  breadcrumbs?: Breadcrumb[];
  /** Status badge (optional) */
  status?: {
    label: string;
    variant: "live" | "beta" | "coming-soon" | "premium";
  };
  /** Main content */
  children: ReactNode;
  /** Additional header content (e.g., action buttons) */
  headerActions?: ReactNode;
  /** Whether to use narrow container width */
  narrow?: boolean;
}

const statusStyles = {
  live: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  beta: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "coming-soon": "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
  premium: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
};

export function SectionShell({
  category,
  title,
  subtitle,
  breadcrumbs,
  status,
  children,
  headerActions,
  narrow = false,
}: SectionShellProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Section Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-cyan-500/5 via-fuchsia-500/5 to-purple-500/5">
        <div
          className={`mx-auto px-4 py-8 md:px-6 md:py-12 ${
            narrow ? "max-w-4xl" : "max-w-6xl"
          }`}
        >
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="mb-4 flex items-center gap-2 text-[11px] text-zinc-500">
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                Home
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  <span>/</span>
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-zinc-300 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-zinc-400">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Category & Status Row */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {category && (
              <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                {category}
              </span>
            )}
            {status && (
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                  statusStyles[status.variant]
                }`}
              >
                {status.variant === "live" && (
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                )}
                {status.label}
              </span>
            )}
          </div>

          {/* Title & Actions Row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 text-sm text-zinc-400 md:text-base max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {headerActions && (
              <div className="flex items-center gap-3">{headerActions}</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`mx-auto px-4 py-8 md:px-6 md:py-12 ${
          narrow ? "max-w-4xl" : "max-w-6xl"
        }`}
      >
        {children}
      </div>
    </main>
  );
}

// Subcomponents for common section patterns

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerAction?: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  children,
  headerAction,
}: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon?: ReactNode;
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-2 text-xl font-bold md:text-2xl">{value}</p>
      {change && (
        <p
          className={`mt-1 text-[11px] font-medium ${
            change.positive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {change.positive ? "↑" : "↓"} {change.value}
        </p>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
        <svg
          className="h-6 w-6 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-zinc-300">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[12px] font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
        >
          {action.label}
          <svg
            className="h-3.5 w-3.5"
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
        </Link>
      )}
    </div>
  );
}
