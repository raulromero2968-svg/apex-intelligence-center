// app/not-found.tsx
// Branded 404 page with helpful navigation

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg text-center">
        {/* Glitch effect 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] font-bold leading-none tracking-tighter md:text-[180px] select-none">
            <span className="bg-gradient-to-r from-red-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              404
            </span>
          </h1>
          {/* Glitch layers */}
          <div
            className="absolute inset-0 text-[120px] font-bold leading-none tracking-tighter md:text-[180px] text-cyan-500/20 select-none"
            style={{ transform: "translate(2px, 2px)" }}
            aria-hidden="true"
          >
            404
          </div>
          <div
            className="absolute inset-0 text-[120px] font-bold leading-none tracking-tighter md:text-[180px] text-red-500/20 select-none"
            style={{ transform: "translate(-2px, -2px)" }}
            aria-hidden="true"
          >
            404
          </div>
        </div>

        {/* Error message */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold md:text-2xl mb-3">
            Signal Lost
          </h2>
          <p className="text-zinc-400">
            The intel you&apos;re looking for has either been moved, classified, or
            doesn&apos;t exist in our archives.
          </p>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return Home
            </Link>
            <Link
              href="/terminal"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-[13px] font-medium text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Open Terminal
            </Link>
          </div>

          {/* Secondary links */}
          <div className="pt-4 border-t border-zinc-800">
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
              Popular destinations
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <Link
                href="/intel"
                className="text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                Intel Archive
              </Link>
              <span className="text-zinc-700">•</span>
              <Link
                href="/market"
                className="text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                TCG Market
              </Link>
              <span className="text-zinc-700">•</span>
              <Link
                href="/research"
                className="text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                Research
              </Link>
              <span className="text-zinc-700">•</span>
              <Link
                href="/portfolio"
                className="text-zinc-400 hover:text-cyan-400 transition-colors"
              >
                Portfolio
              </Link>
            </div>
          </div>
        </div>

        {/* System status */}
        <div className="mt-12 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            System Status: <span className="text-emerald-400">Operational</span>
          </span>
        </div>
      </div>
    </main>
  );
}
