// app/governance/page.tsx
export default function GovernancePage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Governance</h1>
        <p className="mt-3 text-sm text-zinc-300">
          Explain how proposals, reputation, and decision-making work in the
          Apex ecosystem.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-cyan-300">
                Active Proposal
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                Voting Open
              </span>
            </div>
            <h2 className="text-lg font-medium">#17: Adjust Model Card Fee Structure</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Proposal to reduce trading fees for high-volume participants.
            </p>
            <div className="mt-4 flex gap-3 text-sm">
              <span className="text-zinc-500">For: 67%</span>
              <span className="text-zinc-500">Against: 33%</span>
              <span className="text-zinc-500 ml-auto">Ends in 3 days</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 opacity-60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                Closed
              </span>
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                Passed
              </span>
            </div>
            <h2 className="text-lg font-medium">#16: Launch Ecosystem Grants Program</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Approved funding for community-driven projects.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
