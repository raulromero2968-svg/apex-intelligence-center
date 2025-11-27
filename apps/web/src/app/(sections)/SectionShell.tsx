export default function SectionShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        {kicker && (
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/40 px-3 py-1 text-xs tracking-wide text-cyan-300/80">
            {kicker}
          </div>
        )}
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          <span className="text-cyan-300">Underground</span> {title}
        </h1>
        <p className="mt-3 max-w-2xl text-white/70">
          Data-driven market analysis, real-time insights, and exclusive research for serious TCG investors.
        </p>
      </header>
      {children}
    </main>
  );
}

