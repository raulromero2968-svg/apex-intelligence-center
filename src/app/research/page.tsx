import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import { researchReports } from "@/content/seed";

export const revalidate = 300;

export default function ResearchPage() {
  return (
    <SectionShell title="Research" kicker="In-Depth Analysis">
      <LiveScatter title="Grading ROI vs Liquidity" subtitle="Bigger bubbles = more sales. Watch how clusters behave." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {researchReports.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>
    </SectionShell>
  );
}
