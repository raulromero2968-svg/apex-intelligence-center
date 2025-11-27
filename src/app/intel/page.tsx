import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { intelNotes } from "@/content/seed";

export default function IntelPage() {
  return (
    <SectionShell title="Intel" kicker="Apex Intelligence">
      <LiveScatter title="Market Signals" subtitle="Track how different factors correlate. Higher right often means stronger potential." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {intelNotes.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
