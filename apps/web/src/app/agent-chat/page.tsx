'use client';

import { useState, useEffect } from 'react';
import SectionShell from '../(sections)/SectionShell';
import AgentChatPanel from '@/components/agent/AgentChatPanel';
import { trpc } from '@/lib/trpc/client';

interface Job {
  id: string;
  type: 'varc' | 'lamp' | 'contrarian';
  status: 'running' | 'completed' | 'error';
  createdAt: string;
}

export default function AgentChatPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await trpc.jobs.getRunning.query({ limit: 50 });
        setJobs(result as Job[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();

    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, [selectedJobId]);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleNewJob = () => {
    window.location.href = '/research';
  };

  if (isLoading) {
    return (
      <SectionShell title="Agent Chat" kicker="Real-Time Agent Communication">
        <div className="flex items-center justify-center h-64 text-white/50">
          Loading jobs...
        </div>
      </SectionShell>
    );
  }

  if (error) {
    return (
      <SectionShell title="Agent Chat" kicker="Real-Time Agent Communication">
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500/30 hover:bg-red-500/40 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell title="Agent Chat" kicker="Real-Time Agent Communication">
      <AgentChatPanel
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelectJob={handleSelectJob}
        onNewJob={handleNewJob}
      />
    </SectionShell>
  );
}

