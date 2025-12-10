// app/intel/pokemon-151/page.tsx
import { IntelReportLayout } from "@/components/intel-report-layout";
import Link from "next/link";

export default function Pokemon151IntelPage() {
  return (
    <IntelReportLayout
      category="Intel Report"
      tag="TCG Meta"
      title="Pokémon 151: Structure, Scarcity, and Rotation Pressure"
      subtitle="A working thesis on how the Pokémon 151 product line behaves as a collectible and how that flows into decks, prices, and risk."
      path="/intel/pokemon-151"
      readingTime="12 min"
      lastUpdated="Jan 2025"
      sidebar={
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-[11px] text-zinc-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            SUMMARY SNAPSHOT
          </p>
          <p>
            Short horizon: supply shocks and promo waves dominate. Long horizon:
            a slow-grinding tail with specific SKUs acting like blue-chip keys.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>151 functions as both a nostalgia surface and modern format.</li>
            <li>Singles vs. sealed diverge faster than usual sets.</li>
            <li>Rotation risk is more narrative than mechanical.</li>
          </ul>
        </div>
      }
    >
      <section className="space-y-4">
        <p>
          Pokémon 151 is one of the clearest examples of a product trying to
          compress nostalgia, reprint risk, and &quot;main set&quot; gravity
          into a single line. That makes it a good test bed for how Apex
          treats TCG products as live assets rather than static collectibles.
        </p>

        <h2 className="mt-4 text-sm font-semibold text-zinc-100 md:text-base">
          01 · Product structure
        </h2>
        <p>
          At a structural level, 151 is highly legible: it maps directly onto
          the original Pokédex, comes with strong IP gravity, and sits in
          constant conversation with the vintage WOTC sets it references.
          That means:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-zinc-200">
          <li>Demand is more narrative-driven than purely competitive.</li>
          <li>
            Sealed product behaves like a basket of nostalgia rather than a
            straightforward EV calculation.
          </li>
          <li>
            Singles that echo iconic WOTC cards tend to pick up secondary
            flows.
          </li>
        </ul>

        <h2 className="mt-4 text-sm font-semibold text-zinc-100 md:text-base">
          02 · Scarcity and supply waves
        </h2>
        <p>
          Short-term pricing is dominated by supply waves: initial release,
          reprint news, and promo tie-ins. Instead of pretending we can avoid
          volatility, this report treats each wave as a surface you can trade.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-zinc-200">
          <li>Wave 1: over-excited singles pricing, underpriced sealed.</li>
          <li>Wave 2: reprint fears punish mid-tier singles hardest.</li>
          <li>
            Wave 3+: a slow sorting into: true chase, mid-tier nostalgia, and
            bulk.
          </li>
        </ul>

        <h2 className="mt-4 text-sm font-semibold text-zinc-100 md:text-base">
          03 · Rotation pressure
        </h2>
        <p>
          Unlike pure format staples, 151 doesn&apos;t live or die by rotation
          alone. Instead, rotation changes how much its &quot;EV&quot; comes
          from:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-zinc-200">
          <li>Competitive playability vs. pure display / collection value.</li>
          <li>
            How much 151 product sits unopened in the hands of non-players.
          </li>
          <li>The strength of future nostalgia cycles when kids age up.</li>
        </ul>

        <h2 className="mt-4 text-sm font-semibold text-zinc-100 md:text-base">
          04 · How to operationalize this in Apex
        </h2>
        <p>
          Inside Apex Intelligence, this report isn&apos;t just a PDF—it&apos;s
          a living object you can attach to decks, trades, and bots:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-zinc-200">
          <li>
            Build a <span className="text-zinc-100">151 Exposure Deck</span>{" "}
            that tracks sealed vs. singles across waves.
          </li>
          <li>
            Tag relevant trades in{" "}
            <span className="text-zinc-100">My Trades</span> with this report
            as context.
          </li>
          <li>
            Route news or X threads through{" "}
            <Link
              href="/x-intel-capture"
              className="text-cyan-300 hover:text-cyan-200"
            >
              X-to-Intel Capture
            </Link>{" "}
            and attach them as updates.
          </li>
        </ul>

        <p className="mt-4 text-[12px] text-zinc-400">
          This draft can evolve as you see more cycles play out. The point
          isn&apos;t to get the &quot;final&quot; word on 151—it&apos;s to have
          a shared object to point to while the game continues.
        </p>
      </section>
    </IntelReportLayout>
  );
}
