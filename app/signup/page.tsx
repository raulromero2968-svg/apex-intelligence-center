// app/signup/page.tsx
export default function SignupPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold md:text-3xl">Request Early Access</h1>
        <p className="mt-3 text-sm text-zinc-300">
          Later you can wire this to an actual form, waitlist, or onboarding
          flow.
        </p>

        <div className="mt-8 max-w-md">
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-zinc-400 mb-1">
                Email address
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Join Waitlist
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
