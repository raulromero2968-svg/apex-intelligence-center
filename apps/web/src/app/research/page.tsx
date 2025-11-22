'use client';

import { useState } from 'react';
import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import SearchBar from "@/components/search/SearchBar";
import ResearchDialog from "@/components/research/ResearchDialog";
import { researchReports } from "@/content/seed";

export default function ResearchPage() {
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setInitialQuery(query.trim());
      setIsResearchDialogOpen(true);
    }
  };

  return (
    <SectionShell title="Research" kicker="In-Depth Analysis">
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar 
          onSearch={handleSearch}
          placeholder="Search research reports, ask questions about TCG market analysis..."
        />
      </div>

      <LiveScatter title="Grading ROI vs Liquidity" subtitle="Bigger bubbles = more sales. Watch how clusters behave." />
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {researchReports.map((a) => <ArticleCard key={a.href} a={a} />)}
      </div>

      {/* Research Dialog */}
      <ResearchDialog
        isOpen={isResearchDialogOpen}
        onClose={() => {
          setIsResearchDialogOpen(false);
          setInitialQuery('');
        }}
        initialQuery={initialQuery}
      />
    </SectionShell>
  );
}
