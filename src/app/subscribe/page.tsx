import SectionShell from "../(sections)/SectionShell";

export default function SubscribePage() {
  return (
    <SectionShell title="Subscribe" kicker="Get Weekly Intel">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Join the Underground Intelligence Network
          </h2>
          <p className="text-white/70 text-center mb-8">
            Get free weekly market analysis, insights, and exclusive research delivered to your inbox.
          </p>

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder=""
                aria-label="Email address"
                className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-white/50 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition"
              />
              <p className="mt-1 text-xs text-white/50">Enter your email address</p>
            </div>

            <div>
              <label htmlFor="name" className="sr-only">
                Name (optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder=""
                aria-label="Name (optional)"
                className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-white/50 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition"
              />
              <p className="mt-1 text-xs text-white/50">Your name (optional)</p>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-400 px-6 py-3 font-bold text-slate-900 hover:brightness-110 transition min-h-[44px]"
            >
              Subscribe for Free
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            No spam. Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
