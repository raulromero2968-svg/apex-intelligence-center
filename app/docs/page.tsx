// app/docs/page.tsx
export default function DocsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Documentation</h1>
        <p className="mt-3 text-sm text-zinc-300">
          Link or embed your public docs, API references, or whitepapers here.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-medium">Getting Started</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Learn the basics of the Apex Intelligence platform.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-medium">API Reference</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Technical documentation for integrators and developers.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-medium">Model Cards</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Understanding how model intelligence cards work.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-medium">Reputation System</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Deep dive into staking, scoring, and governance.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
