// app/admin/page.tsx
import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Admin Panel</h1>
        <p className="mt-3 text-sm text-zinc-300">
          Governance controls, proposals, and system configuration will live
          here.
        </p>

        <div className="mt-8 space-y-4">
          <Link
            href="/admin/moderation"
            className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
          >
            <h2 className="text-lg font-medium">Moderation Queue</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Review and moderate pending reports and content submissions.
            </p>
          </Link>

          <Link
            href="/governance"
            className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors"
          >
            <h2 className="text-lg font-medium">Governance Proposals</h2>
            <p className="mt-1 text-sm text-zinc-400">
              View and vote on active governance proposals.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
