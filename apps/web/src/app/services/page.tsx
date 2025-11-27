import SectionShell from "../(sections)/SectionShell";

export default function ServicesPage() {
  return (
    <SectionShell title="Services" kicker="What We Offer">
      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Market Intelligence",
            description: "Real-time market data, price tracking, and trend analysis for informed decision-making.",
          },
          {
            title: "Portfolio Analytics",
            description: "Professional-grade tools to track, analyze, and optimize your TCG collection value.",
          },
          {
            title: "Research Reports",
            description: "Exclusive in-depth research on market trends, investment opportunities, and risk analysis.",
          },
          {
            title: "Expert Insights",
            description: "Access to expert commentary, guides, and strategies from industry professionals.",
          },
        ].map((service, i) => (
          <article
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm hover:border-cyan-400/40 transition"
          >
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">{service.title}</h3>
            <p className="text-white/70">{service.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

