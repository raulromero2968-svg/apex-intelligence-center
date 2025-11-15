import SectionShell from "../(sections)/SectionShell";

export default function AboutPage() {
  return (
    <SectionShell title="About" kicker="Who We Are">
      <div className="space-y-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Our Mission</h2>
          <p className="text-white/70 leading-relaxed">
            Apex Intelligence provides underground intel for serious TCG collectors and investors.
            We deliver data-driven market analysis, real-time insights, and exclusive research
            to help you make informed decisions in the evolving TCG market.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">What We Do</h2>
          <p className="text-white/70 leading-relaxed mb-4">
            Our platform combines advanced analytics, market intelligence, and expert insights
            to give you an edge in the TCG investment landscape.
          </p>
          <ul className="space-y-2 text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Real-time market data and price tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Exclusive research and analysis reports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span>Professional-grade portfolio management tools</span>
            </li>
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}
