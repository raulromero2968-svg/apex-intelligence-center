// app/admin/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionShell } from "@/components/section-shell";

type SystemStatus = "healthy" | "degraded" | "down";

type StatCard = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
};

type AdminSection = {
  id: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  badgeColor?: string;
};

const MOCK_STATS: StatCard[] = [
  { label: "Active Users (24h)", value: "1,247", change: "+12%", trend: "up" },
  { label: "Pending Reports", value: "23", change: "-8", trend: "down" },
  { label: "Cards Listed", value: "4,892", change: "+156", trend: "up" },
  { label: "Trades (7d)", value: "892", change: "+23%", trend: "up" },
];

const SYSTEM_STATUS: { name: string; status: SystemStatus }[] = [
  { name: "API Gateway", status: "healthy" },
  { name: "Database", status: "healthy" },
  { name: "WebSocket", status: "healthy" },
  { name: "Search Index", status: "degraded" },
  { name: "CDN", status: "healthy" },
];

const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "moderation",
    title: "Moderation Queue",
    description:
      "Review pending reports, approve or reject content submissions, manage flagged items.",
    href: "/admin/moderation",
    badge: "23 pending",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    id: "users",
    title: "User Management",
    description:
      "View user accounts, manage roles and permissions, handle account issues.",
    href: "/admin/users",
  },
  {
    id: "cards",
    title: "Card Registry",
    description:
      "Manage the model card database, add new cards, update metadata and pricing rules.",
    href: "/admin/cards",
  },
  {
    id: "tournaments",
    title: "Tournament Control",
    description:
      "Create and manage tournaments, set brackets, handle disputes, publish results.",
    href: "/admin/tournaments",
  },
  {
    id: "governance",
    title: "Governance Proposals",
    description:
      "View active proposals, manage voting periods, execute passed proposals.",
    href: "/governance",
    badge: "3 active",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "analytics",
    title: "System Analytics",
    description:
      "Deep metrics on platform usage, revenue, engagement, and system performance.",
    href: "/admin/analytics",
  },
];

const QUICK_ACTIONS = [
  { label: "Flush cache", action: "cache" },
  { label: "Rebuild search index", action: "search" },
  { label: "Export user data", action: "export" },
  { label: "Broadcast announcement", action: "announce" },
];

export default function AdminPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleQuickAction = async (action: string) => {
    setActionLoading(action);
    // Simulate action
    await new Promise((r) => setTimeout(r, 1500));
    setActionLoading(null);
  };

  const statusColor = (status: SystemStatus) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-400";
      case "degraded":
        return "bg-amber-400";
      case "down":
        return "bg-red-400";
    }
  };

  const trendColor = (trend?: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-emerald-300";
      case "down":
        return "text-red-300";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <SectionShell
      category="Admin"
      badgeLabel="CONTROL PANEL"
      title="Apex Admin Dashboard"
      subtitle="System health, moderation, user management, and platform controls."
      path="/admin"
    >
      <div className="space-y-6">
        {/* Stats row */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                {stat.label}
              </p>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-semibold text-zinc-100">
                  {stat.value}
                </span>
                {stat.change && (
                  <span className={`text-xs ${trendColor(stat.trend)}`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* System status + Quick actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* System status */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <h2 className="text-sm font-semibold text-zinc-100">
              System Status
            </h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              Real-time health of core services
            </p>
            <ul className="mt-4 space-y-2">
              {SYSTEM_STATUS.map((svc) => (
                <li
                  key={svc.name}
                  className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-3 py-2"
                >
                  <span className="text-sm text-zinc-200">{svc.name}</span>
                  <span className="flex items-center gap-2 text-[11px]">
                    <span
                      className={`h-2 w-2 rounded-full ${statusColor(svc.status)}`}
                    />
                    <span className="capitalize text-zinc-400">
                      {svc.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Quick actions */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
            <h2 className="text-sm font-semibold text-zinc-100">
              Quick Actions
            </h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              One-click operations for common tasks
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.action}
                  onClick={() => handleQuickAction(qa.action)}
                  disabled={actionLoading === qa.action}
                  className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-[12px] font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
                >
                  {actionLoading === qa.action ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-cyan-400" />
                  ) : (
                    qa.label
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Admin sections grid */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100">
            Administration Modules
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ADMIN_SECTIONS.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/80"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white">
                      {section.title}
                    </h3>
                    {section.badge && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${section.badgeColor ?? "bg-zinc-800 text-zinc-300 border-zinc-700"}`}
                      >
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">
                    {section.description}
                  </p>
                </div>
                <div className="mt-4 text-[11px] font-medium text-cyan-400 group-hover:text-cyan-300">
                  Open →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Recent Admin Activity
              </h2>
              <p className="mt-1 text-[11px] text-zinc-500">
                Audit log of recent administrative actions
              </p>
            </div>
            <Link
              href="/admin/audit-log"
              className="text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              View full log →
            </Link>
          </div>
          <ul className="mt-4 space-y-2 text-[12px]">
            {[
              {
                actor: "admin@apex.io",
                action: "Approved report",
                target: '"Q1 Market Analysis"',
                time: "2 min ago",
              },
              {
                actor: "mod@apex.io",
                action: "Rejected submission",
                target: '"Spam listing #4821"',
                time: "15 min ago",
              },
              {
                actor: "admin@apex.io",
                action: "Updated card metadata",
                target: '"Claude 3 Opus"',
                time: "1 hr ago",
              },
              {
                actor: "system",
                action: "Auto-flagged content",
                target: '"Suspicious pricing pattern"',
                time: "2 hr ago",
              },
              {
                actor: "admin@apex.io",
                action: "Created tournament",
                target: '"Winter Championship 2025"',
                time: "3 hr ago",
              },
            ].map((log, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-zinc-900/50 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300">{log.actor}</span>
                  <span className="text-zinc-500">{log.action}</span>
                  <span className="text-zinc-200">{log.target}</span>
                </div>
                <span className="text-zinc-500">{log.time}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SectionShell>
  );
}
