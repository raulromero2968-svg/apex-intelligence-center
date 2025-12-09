// app/terms/page.tsx
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl space-y-3 text-sm text-zinc-300">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">
          Terms of Use
        </h1>
        <p>Drop in your real terms of service here when ready.</p>

        <div className="mt-8 space-y-6 text-zinc-400">
          <section>
            <h2 className="text-lg font-medium text-white mb-2">Acceptance of Terms</h2>
            <p>
              By accessing Apex Intelligence, you agree to be bound by these
              terms and all applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-2">Platform Use</h2>
            <p>
              The platform is provided for informational and trading purposes.
              Users are responsible for their own decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-2">Risk Disclosure</h2>
            <p>
              Trading involves risk. Past performance does not guarantee future
              results. Only trade what you can afford to lose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-2">Intellectual Property</h2>
            <p>
              All content, design, and technology on this platform are owned by
              Apex Intelligence.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
