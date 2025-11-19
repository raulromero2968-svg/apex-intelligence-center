import SectionShell from "../(sections)/SectionShell";

export const revalidate = 3600;

export default function AboutPage() {
  return (
    <SectionShell title="About" kicker="Apex Intelligence">
      <p className="text-white/80">
        Institutional-grade TCG market intelligence. Built for speed, accuracy, and edge.
      </p>
    </SectionShell>
  );
}
