// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6">
      <div className="mx-auto max-w-5xl space-y-3 text-sm text-zinc-300">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">
          Privacy Policy
        </h1>
        <p>Drop in your real privacy policy text here when ready.</p>

        <div className="mt-8 space-y-6 text-zinc-400">
          <section>
            <h2 className="text-lg font-medium text-white mb-2">Data Collection</h2>
            <p>
              We collect information you provide directly, such as account
              details and trading activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-2">How We Use Data</h2>
            <p>
              Your data is used to provide platform services, improve user
              experience, and ensure security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-2">Data Sharing</h2>
            <p>
              We do not sell your personal information. Data may be shared with
              service providers under strict agreements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-white mb-2">Your Rights</h2>
            <p>
              You can request access, correction, or deletion of your data at
              any time.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
