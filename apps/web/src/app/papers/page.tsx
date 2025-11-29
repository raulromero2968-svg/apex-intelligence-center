'use client';

import { useState, useCallback, Suspense } from 'react';
import { FileText, Upload, Library, Sparkles, ArrowLeft } from 'lucide-react';
import SectionShell from '../(sections)/SectionShell';
import PaperGenerator from '@/components/papers/PaperGenerator';
import DocumentUploader from '@/components/papers/DocumentUploader';
import PaperViewer from '@/components/papers/PaperViewer';
import PaperLibrary from '@/components/papers/PaperLibrary';

type View = 'generate' | 'upload' | 'library' | 'view';

interface GeneratedPaper {
  id: string;
  title: string;
  abstract: string;
  content: string;
  format: string;
  citationStyle: string;
  totalCitations: number;
  totalSynthesis: number;
  sourceCount?: number;
  complianceReport?: {
    traceHash: string;
    ipfsCid: string;
    provenanceUrl: string;
    noveltyScore: number;
    euAiActStatus: string;
  };
  metadata?: {
    model: string;
    generatedAt: string;
    processingTimeMs: number;
  };
}

function PapersPageContent() {
  const [activeView, setActiveView] = useState<View>('generate');
  const [selectedPaper, setSelectedPaper] = useState<GeneratedPaper | null>(null);
  const [uploadedDocsCount, setUploadedDocsCount] = useState(0);

  const handleGenerate = useCallback((paper: GeneratedPaper) => {
    setSelectedPaper(paper);
    setActiveView('view');
  }, []);

  const handleUploadComplete = useCallback(
    (documents: { id: string; title: string }[]) => {
      setUploadedDocsCount((prev) => prev + documents.length);
    },
    []
  );

  const handleSelectPaper = useCallback(async (paperSummary: { id: string }) => {
    try {
      const response = await fetch(`/api/papers/${paperSummary.id}`);
      if (!response.ok) throw new Error('Failed to fetch paper');
      const data = await response.json();
      setSelectedPaper(data.paper);
      setActiveView('view');
    } catch (error) {
      console.error('Failed to load paper:', error);
    }
  }, []);

  const tabs = [
    {
      id: 'generate' as const,
      label: 'Generate',
      icon: Sparkles,
      description: 'Create new papers from research',
    },
    {
      id: 'upload' as const,
      label: 'Upload',
      icon: Upload,
      description: 'Add research documents',
      badge: uploadedDocsCount > 0 ? uploadedDocsCount : undefined,
    },
    {
      id: 'library' as const,
      label: 'Library',
      icon: Library,
      description: 'View generated papers',
    },
  ];

  return (
    <SectionShell title="Paper Generator" kicker="AI Research Synthesis">
      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {activeView === 'view' ? (
            <button
              onClick={() => {
                setSelectedPaper(null);
                setActiveView('library');
              }}
              className="flex items-center gap-2 rounded-lg bg-gray-700/50 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </button>
          ) : (
            tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-neon-purple to-neon-cyan text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.badge && (
                    <span className="rounded-full bg-neon-cyan/20 px-2 py-0.5 text-xs text-neon-cyan">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeView === 'generate' && (
            <PaperGenerator onGenerate={handleGenerate} />
          )}

          {activeView === 'upload' && (
            <DocumentUploader onUploadComplete={handleUploadComplete} />
          )}

          {activeView === 'library' && (
            <PaperLibrary onSelectPaper={handleSelectPaper} />
          )}

          {activeView === 'view' && selectedPaper && (
            <PaperViewer paper={selectedPaper} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="rounded-xl border border-gray-700/50 bg-cyber-dark/80 p-6 backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-white">
              <FileText className="h-5 w-5 text-neon-cyan" />
              Quick Guide
            </h3>
            <ol className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neon-purple/20 text-xs font-bold text-neon-purple">
                  1
                </span>
                <span>
                  <strong className="text-gray-300">Upload Documents</strong>
                  <br />
                  Add your research papers, notes, or data files
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neon-cyan/20 text-xs font-bold text-neon-cyan">
                  2
                </span>
                <span>
                  <strong className="text-gray-300">Define Topic</strong>
                  <br />
                  Enter your research question or thesis
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neon-pink/20 text-xs font-bold text-neon-pink">
                  3
                </span>
                <span>
                  <strong className="text-gray-300">Generate Paper</strong>
                  <br />
                  AI synthesizes sources with citations
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                  4
                </span>
                <span>
                  <strong className="text-gray-300">Export</strong>
                  <br />
                  Download as Markdown, LaTeX, or HTML
                </span>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="rounded-xl border border-gray-700/50 bg-cyber-dark/80 p-6 backdrop-blur-sm">
            <h3 className="mb-4 font-display text-lg font-bold text-white">
              Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan" />
                RAG-Fusion for 23% better recall
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-purple" />
                Strict citation enforcement
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neon-pink" />
                EU AI Act compliance
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                IPFS provenance tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Multiple citation styles (APA, MLA, Chicago, IEEE)
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Section-by-section generation
              </li>
            </ul>
          </div>

          {/* Supported Formats */}
          <div className="rounded-xl border border-gray-700/50 bg-cyber-dark/80 p-6 backdrop-blur-sm">
            <h3 className="mb-4 font-display text-lg font-bold text-white">
              Supported Formats
            </h3>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">INPUT</p>
                <div className="flex flex-wrap gap-1">
                  {['.txt', '.md', '.mdx', '.json'].map((ext) => (
                    <span
                      key={ext}
                      className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">OUTPUT</p>
                <div className="flex flex-wrap gap-1">
                  {['Markdown', 'LaTeX', 'HTML'].map((format) => (
                    <span
                      key={format}
                      className="rounded bg-neon-purple/20 px-2 py-1 text-xs text-neon-purple"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export default function PapersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <PapersPageContent />
    </Suspense>
  );
}
