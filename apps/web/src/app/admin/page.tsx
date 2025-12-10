// app/admin/page.tsx
export default function AdminPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Admin Panel</h1>
        <p className="mt-3 text-sm text-zinc-300">
          System administration and monitoring dashboard.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-medium text-cyan-400">Cache Management</h3>
            <p className="mt-2 text-sm text-zinc-400">Clear caches and manage system performance</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-medium text-fuchsia-400">Equilibrium</h3>
            <p className="mt-2 text-sm text-zinc-400">System balance and health monitoring</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-medium text-violet-400">Settings</h3>
            <p className="mt-2 text-sm text-zinc-400">Configure system parameters</p>
          </div>
        </div>
      </div>
    </main>
  );
}
