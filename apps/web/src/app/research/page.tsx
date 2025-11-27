'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SectionShell from "../(sections)/SectionShell";
import ArticleCard from "@/components/content/ArticleCard";
import LiveScatter from "@/components/charts/LiveScatter";
import SearchBar from "@/components/search/SearchBar";
import ResearchDialog from "@/components/research/ResearchDialog";
import ContrarianToggle from "@/components/research/ContrarianToggle";
import ContrarianResultView from "@/components/research/ContrarianResultView";
import { researchReports } from "@/content/seed";

export default function ResearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResearchDialogOpen, setIsResearchDialogOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [contrarianEnabled, setContrarianEnabled] = useState(
    searchParams.get('contrarian') === 'true'
  );
  const [contrarianResult, setContrarianResult] = useState<any>(null);
  const [contrarianLoading, setContrarianLoading] = useState(false);
  const [contrarianError, setContrarianError] = useState<string | null>(null);

  useEffect(() => {
    const contrarianParam = searchParams.get('contrarian');
    setContrarianEnabled(contrarianParam === 'true');
  }, [searchParams]);

  const handleContrarianToggle = (enabled: boolean) => {
    setContrarianEnabled(enabled);
    const params = new URLSearchParams(searchParams.toString());
    if (enabled) {
      params.set('contrarian', 'true');
    } else {
      params.delete('contrarian');
    }
    router.push(`/research?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setInitialQuery(query.trim());
      setIsResearchDialogOpen(true);
    }
  };

  const handleContrarianQuery = async (query: string) => {
    if (!query.trim()) return;

    setContrarianLoading(true);
    setContrarianError(null);
    setContrarianResult(null);

    try {
      const { trpc } = await import('@/lib/trpc');
      const result = await trpc.contrarian.runContrarianQuery.mutate({
        query,
        mode: 'both',
      });

      const jobId = result.jobId;

      // Subscribe to SSE for results
      const eventSource = new EventSource(`/api/events/contrarian/${jobId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'completed' && data.result) {
            setContrarianResult(data.result);
            setContrarianLoading(false);
            eventSource.close();
          } else if (data.status === 'error') {
            setContrarianError(data.error?.message || 'Contrarian query failed');
            setContrarianLoading(false);
            eventSource.close();
          }
        } catch (err) {
          console.error('Error parsing contrarian result:', err);
        }
      };

      eventSource.onerror = () => {
        setContrarianError('Connection to contrarian service failed');
        setContrarianLoading(false);
        eventSource.close();
      };
    } catch (err) {
      setContrarianError(err instanceof Error ? err.message : 'Failed to run contrarian query');
      setContrarianLoading(false);
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

      {/* Contrarian Toggle */}
      <div className="mb-6">
        <ContrarianToggle enabled={contrarianEnabled} onToggle={handleContrarianToggle} />
      </div>

      {/* Contrarian Results */}
      {contrarianEnabled && contrarianResult && (
        <div className="mb-8">
          <ContrarianResultView
            result={contrarianResult}
            isLoading={contrarianLoading}
            error={contrarianError}
          />
        </div>
      )}

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
        onContrarianQuery={contrarianEnabled ? handleContrarianQuery : undefined}
      />
    </SectionShell>
  );
}

