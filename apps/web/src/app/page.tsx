// app/page.tsx
import Link from "next/link";

const navItems = [
  { label: "About", href: "/about" },
  { label: "Philosophy", href: "/philosophy" },
  { label: "Lab", href: "/lab" },
  { label: "Commons", href: "/commons" },
  { label: "Community", href: "/community" },
];

function HeaderNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo + brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-xs font-bold">
            AI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-300">
              APEX
            </span>
            <span className="text-sm font-semibold text-white">
              INTELLIGENCE
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-zinc-300 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/subscribe"
            className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-white/10"
          >
            Subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-[#050012] to-black">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-purple-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-24 pt-16 text-center md:px-6 md:pb-28 md:pt-24">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
          ARCHITECTURES FOR LIFE
        </p>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white md:text-6xl">
          Tools for thinking clearly.
          <br />
          Systems that protect dignity.
          <br />
          <span className="text-zinc-400">No holy machines.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-sm text-zinc-300 md:text-base">
          Apex Intelligence sits at the intersection of film analysis, systems thinking,
          and the design of safer, saner tools for humans. We build networks, not temples.
          We serve people, not institutions.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/philosophy"
            className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
          >
            Read Our Philosophy
          </Link>

          <a
            href="#what-we-do"
            className="rounded-full border border-zinc-700/80 px-7 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-400 hover:text-white"
          >
            What we do
          </a>
        </div>

        {/* Core commitments row */}
        <div className="mt-10 grid w-full max-w-3xl gap-4 text-left text-xs text-zinc-300 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              HUMAN DIGNITY
            </p>
            <p className="mt-2 text-xs text-zinc-200">
              We side with dignity when it conflicts with institutional convenience.
              Every time.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              MENTAL HEALTH
            </p>
            <p className="mt-2 text-xs text-zinc-200">
              Tools that hydrate mental health, not deplete it. We design against
              destabilization.
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
              TRANSPARENCY
            </p>
            <p className="mt-2 text-xs text-zinc-200">
              No wizard behind the curtain. We name what systems are doing in
              plain language.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatWeDoSection() {
  return (
    <section
      id="what-we-do"
      className="border-t border-white/5 bg-gradient-to-b from-black via-[#050510] to-black px-4 py-20 md:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-semibold text-white md:text-3xl">
          What Apex Intelligence Does
        </h2>
        <p className="mt-3 text-center text-sm text-zinc-400 md:text-base">
          We analyze how power, media, and technology shape human experience—and
          we build tools that help people think more clearly about the systems they live in.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
              FILM & CULTURAL ANALYSIS
            </p>
            <h3 className="mt-2 text-sm font-semibold text-white">
              Reading the architecture of everyday power
            </h3>
            <p className="mt-2 text-xs text-zinc-300">
              Essays that explore how stories train our instincts—from Oppenheimer
              to GoldenEye to the structures of attention and spectacle.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">
              SYSTEMS THINKING
            </p>
            <h3 className="mt-2 text-sm font-semibold text-white">
              States, capitalism, security, AI
            </h3>
            <p className="mt-2 text-xs text-zinc-300">
              We map the flows of power without paranoia. Clear-eyed analysis of
              how institutions shape human possibility—and where they fail.
            </p>
          </div>

          <div className="flex flex-col rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-300">
              SAFER TOOLS
            </p>
            <h3 className="mt-2 text-sm font-semibold text-white">
              Designing for dignity, not extraction
            </h3>
            <p className="mt-2 text-xs text-zinc-300">
              Research and prototypes for tools that support self-determination,
              protect mental health, and refuse to treat people as data points.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhoWeServeSection() {
  return (
    <section className="border-t border-white/5 bg-black px-4 py-16 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <h2 className="text-lg font-semibold text-white md:text-xl">
            Networks, not temples.
          </h2>
          <p className="max-w-xl text-xs text-zinc-400 md:text-sm">
            We care about people who have been chewed up by institutions—and those
            who still show up for each other despite everything.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              OUTSIDERS
            </div>
            <p className="text-xs text-zinc-300">
              Queer folks, neurodivergent people, those from lower socioeconomic
              backgrounds—anyone historically treated as disposable.
            </p>
            <Link
              href="/community"
              className="mt-4 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Community Principles →
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              WORKERS
            </div>
            <p className="text-xs text-zinc-300">
              Teachers, nurses, parents, caretakers—ordinary people who keep
              the world running while institutions take them for granted.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-flex text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200"
            >
              About Us →
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
              BUILDERS
            </div>
            <p className="text-xs text-zinc-300">
              Designers, researchers, and technologists who want to create
              systems that are humane by default, not harmful by accident.
            </p>
            <Link
              href="/lab"
              className="mt-4 inline-flex text-xs font-semibold text-violet-300 hover:text-violet-200"
            >
              Explore Lab →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuardrailsSection() {
  return (
    <section className="border-t border-white/5 bg-gradient-to-b from-black via-[#050010] to-black px-4 py-20 md:px-6">
      <div className="mx-auto max-w-6xl grid gap-10 md:grid-cols-[1.2fr,1fr] md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Our non-negotiable ethical lines.
          </h2>
          <p className="mt-4 text-sm text-zinc-300 md:text-base">
            We are not a neutral platform. We have commitments that constrain what
            we build and how we build it. If a tool we make starts causing harm,
            we are obligated to resist, redesign, or shut it down.
          </p>
          <ul className="mt-6 space-y-3 text-xs text-zinc-300 md:text-sm">
            <li>• No systems that strip people of self-determination, land, or sanity.</li>
            <li>• No tools that push people toward self-harm or destabilize mental health.</li>
            <li>• No mystique as a weapon—we name what power is doing in plain language.</li>
            <li>• When dignity conflicts with convenience, we side with dignity.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/15 via-fuchsia-500/10 to-purple-500/15 p-6 text-xs text-zinc-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              SELF-DETERMINATION
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              People are not data points or lab material.
            </p>
            <p className="mt-3 text-xs text-zinc-200">
              Apex exists to serve people—especially those most often overlooked:
              queer folks, neurodivergent people, those from marginalized backgrounds.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-xs text-zinc-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              INSPIRED BY
            </p>
            <p className="mt-2">
              Thinkers like Hannah Arendt (systems analysis, banality of evil) and
              Václav Havel (truth inside power). Not a cult of any one thinker—just
              people who took responsibility seriously.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="border-t border-white/5 bg-black px-4 py-16 md:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl border border-zinc-800 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-purple-500/10 px-6 py-10 text-center">
        <h2 className="text-xl font-semibold text-white md:text-2xl">
          Interested in what we're building?
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
          Read our essays, explore our research, or subscribe for updates.
          We're a small operation doing careful work—no hype cycles, no rush.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/commons"
            className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-zinc-100"
          >
            Read the Essays
          </Link>
          <Link
            href="/subscribe"
            className="rounded-full border border-zinc-600 px-7 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-300 hover:text-white"
          >
            Subscribe for Updates
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black px-4 py-8 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-[11px] text-zinc-500 md:flex-row">
        <p>© {new Date().getFullYear()} Apex Intelligence. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/docs" className="hover:text-zinc-300">
            Docs
          </Link>
          <Link href="/governance" className="hover:text-zinc-300">
            Governance
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-black text-white">
      <HeaderNav />
      <HeroSection />
      <WhatWeDoSection />
      <WhoWeServeSection />
      <GuardrailsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
