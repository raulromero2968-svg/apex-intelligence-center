import Link from 'next/link';
import {
  FileText,
  GraduationCap,
  BookOpen,
  Brain,
  Network,
  Users,
  Lightbulb,
  Target,
  Rocket,
  Sparkles,
  ArrowRight,
  GitBranch,
  Database,
  Microscope,
  Beaker,
  MessageSquare,
  Globe
} from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PhD Framework | Apex Intelligence - Living Dissertation",
  description: "The Apex Psycho-Neural PhD: A living dissertation exploring human-AI collaboration through TCG market intelligence, biological systems research, and ethical frameworks.",
  openGraph: {
    title: 'PhD Framework | Apex Intelligence',
    description: 'A living dissertation: psycho-neural collaboration between human and AI intelligence in knowledge system design.',
    images: [
      {
        url: '/og/phd-framework.png',
        width: 1200,
        height: 630,
        alt: 'Apex Intelligence PhD Framework - Living Dissertation',
      },
    ],
    type: 'website',
    siteName: 'Apex Intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhD Framework | Apex Intelligence',
    description: 'A living dissertation exploring human-AI collaboration and knowledge system design.',
    images: ['/og/phd-framework.png'],
  },
  keywords: [
    'living dissertation',
    'PhD by portfolio',
    'human-AI collaboration',
    'psycho-neural research',
    'knowledge systems',
    'AI ethics',
    'market intelligence',
    'research methodology',
  ],
};

export default function PhDFrameworkPage() {
  return (
    <div className="relative min-h-screen pt-24">
      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            LIVING DISSERTATION // APEX_PHD_PROTOCOL
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(147,51,234,0.3)]">
              PhD
            </span>
            <span className="block text-holographic">
              Framework
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-mono">
            A living dissertation: psycho-neural collaboration between human and AI intelligence.
            <span className="inline-block w-3 h-5 bg-purple-400 ml-1 animate-pulse align-middle" />
          </p>
        </div>
      </section>

      {/* DISSERTATION_VIEWER Terminal */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Terminal Window */}
          <div className="border border-cyan-500/30 rounded-sm bg-black/40 backdrop-blur-md overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-500/20 bg-black/60">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                <FileText className="w-4 h-4" />
                <span>DISSERTATION_VIEWER</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-6 md:p-10 space-y-8">
              {/* Thesis Statement */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white font-mono">THESIS_STATEMENT</h2>
                </div>

                <div className="border-l-4 border-purple-500 bg-purple-950/20 rounded-r-lg p-6">
                  <p className="text-lg text-slate-200 leading-relaxed italic">
                    &ldquo;This living dissertation demonstrates that <span className="text-purple-400 font-semibold">psycho-neural collaboration</span>—the structured partnership between human cognitive frameworks and AI systems—produces knowledge artifacts of doctoral quality while simultaneously serving as a <span className="text-cyan-400 font-semibold">replicable methodology</span> for future human-AI research collaboration.&rdquo;
                  </p>
                </div>

                <p className="text-slate-400 text-sm font-mono">
                  <span className="text-cyan-400">&gt;</span> The Apex platform itself is the dissertation: a living, evolving proof that emerges through the collaborative act of building.
                </p>
              </div>

              {/* Core Research Questions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white font-mono">CORE_RESEARCH_QUESTIONS</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { num: '01', question: 'How can human-AI collaboration produce original research contributions?', color: 'cyan' },
                    { num: '02', question: 'What methodological frameworks enable transparent, ethical AI partnership?', color: 'purple' },
                    { num: '03', question: 'Can living systems serve as valid dissertation artifacts?', color: 'emerald' },
                    { num: '04', question: 'How do market intelligence and biological systems inform AI ethics?', color: 'orange' },
                  ].map((item) => (
                    <div
                      key={item.num}
                      className={`border border-${item.color}-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-4`}
                    >
                      <span className={`text-${item.color}-400 font-mono text-sm font-bold`}>{item.num}</span>
                      <p className="text-slate-300 text-sm mt-2 leading-relaxed">{item.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dissertation Chapter Mapping */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="CHAPTER MAPPING" classification="DISSERTATION STRUCTURE // APEX_PHD">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-cyan-400">[</span> SITE → DISSERTATION MAPPING <span className="text-cyan-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            {/* Visual Diagram */}
            <div className="relative border border-cyan-500/40 bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-8 overflow-hidden mb-8">
              {/* Glow Effects */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                {/* Vertical Flow Diagram */}
                <div className="space-y-4">
                  {/* Chapter 1: Introduction */}
                  <ChapterMapping
                    chapterNum="01"
                    chapterTitle="INTRODUCTION"
                    sitePage="Homepage (Nexus)"
                    pageHref="/"
                    description="Presents the core thesis and problem space. The landing page establishes the research context and invites exploration."
                    icon={<Globe className="w-5 h-5" />}
                    color="purple"
                  />

                  {/* Connector */}
                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-purple-500/50 to-cyan-500/50" />
                  </div>

                  {/* Chapter 2: Literature Review */}
                  <ChapterMapping
                    chapterNum="02"
                    chapterTitle="LITERATURE REVIEW"
                    sitePage="Commons (Essays)"
                    pageHref="/commons"
                    description="Synthesizes existing scholarship through original essays. Each essay engages with prior research while contributing new analysis."
                    icon={<BookOpen className="w-5 h-5" />}
                    color="cyan"
                  />

                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-emerald-500/50" />
                  </div>

                  {/* Chapter 3: Methodology */}
                  <ChapterMapping
                    chapterNum="03"
                    chapterTitle="METHODOLOGY"
                    sitePage="Lab & Philosophy"
                    pageHref="/philosophy"
                    description="Documents the psycho-neural collaboration process, ethical frameworks, and research protocols that guide all work."
                    icon={<Beaker className="w-5 h-5" />}
                    color="emerald"
                  />

                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-emerald-500/50 to-orange-500/50" />
                  </div>

                  {/* Chapter 4: Results & Analysis */}
                  <ChapterMapping
                    chapterNum="04"
                    chapterTitle="RESULTS & ANALYSIS"
                    sitePage="Intel Page"
                    pageHref="/intel"
                    description="Presents live data analysis, market intelligence, and real-time demonstrations of the research methodology in action."
                    icon={<Database className="w-5 h-5" />}
                    color="orange"
                  />

                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-orange-500/50 to-indigo-500/50" />
                  </div>

                  {/* Chapter 5: Community Validation */}
                  <ChapterMapping
                    chapterNum="05"
                    chapterTitle="COMMUNITY VALIDATION"
                    sitePage="Portfolio & Hall of Fame"
                    pageHref="/portfolio"
                    description="Peer review through community engagement, expert curation, and public discourse on research outputs."
                    icon={<Users className="w-5 h-5" />}
                    color="indigo"
                  />

                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-indigo-500/50 to-violet-500/50" />
                  </div>

                  {/* Chapter 6: Discussion */}
                  <ChapterMapping
                    chapterNum="06"
                    chapterTitle="DISCUSSION"
                    sitePage="Research & Insights"
                    pageHref="/research"
                    description="Interprets findings, addresses limitations, and situates the work within broader academic and industry contexts."
                    icon={<MessageSquare className="w-5 h-5" />}
                    color="violet"
                  />

                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-violet-500/50 to-pink-500/50" />
                  </div>

                  {/* Chapter 7: Conclusion */}
                  <ChapterMapping
                    chapterNum="07"
                    chapterTitle="CONCLUSION & SYNTHESIS"
                    sitePage="This Page (PhD Framework)"
                    pageHref="/phd-framework"
                    description="Synthesizes all elements into a coherent whole, demonstrating the dissertation's contribution to knowledge."
                    icon={<GraduationCap className="w-5 h-5" />}
                    color="pink"
                  />
                </div>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Psycho-Neural Methodology */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="METHODOLOGY" classification="PSYCHO-NEURAL COLLABORATION // APEX_PROTOCOL">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-purple-400">[</span> THE PSYCHO-NEURAL METHODOLOGY <span className="text-purple-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            {/* Methodology Overview */}
            <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden mb-8">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-mono">What is Psycho-Neural Collaboration?</h3>
                    <p className="text-slate-400 text-sm">A structured framework for human-AI research partnership</p>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed mb-6">
                  <span className="text-purple-400 font-semibold">Psycho-neural collaboration</span> refers to the structured integration of human psychological insight (the &ldquo;psycho&rdquo;) with AI neural network capabilities (the &ldquo;neural&rdquo;). Unlike simple prompting or automation, this methodology treats the human-AI relationship as a <span className="text-cyan-400 font-semibold">genuine intellectual partnership</span>.
                </p>

                {/* Three Pillars */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-3">
                      <Network className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-mono text-cyan-400">ITERATIVE DIALOGUE</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Research emerges through conversation, not extraction. Each exchange refines understanding on both sides.
                    </p>
                  </div>

                  <div className="border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-3">
                      <GitBranch className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-mono text-purple-400">TRANSPARENT ATTRIBUTION</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Clear documentation of which insights emerged from human direction, AI synthesis, or collaborative emergence.
                    </p>
                  </div>

                  <div className="border border-emerald-500/30 bg-slate-900/50 backdrop-blur-sm rounded-lg p-5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-3">
                      <Microscope className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-md font-bold text-white mb-2 font-mono text-emerald-400">LIVING VALIDATION</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      The platform itself serves as ongoing proof—users can inspect, critique, and build upon the work.
                    </p>
                  </div>
                </div>

                {/* Process Diagram */}
                <div className="border border-slate-700 bg-slate-900/80 rounded-lg p-6">
                  <h4 className="text-sm font-bold text-slate-400 font-mono mb-4">COLLABORATION CYCLE</h4>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <div className="px-4 py-2 rounded bg-purple-950/50 border border-purple-500/30 text-purple-300">
                      Human Intent
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div className="px-4 py-2 rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-300">
                      AI Synthesis
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div className="px-4 py-2 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
                      Critical Review
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div className="px-4 py-2 rounded bg-orange-950/50 border border-orange-500/30 text-orange-300">
                      Artifact Creation
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div className="px-4 py-2 rounded bg-violet-950/50 border border-violet-500/30 text-violet-300">
                      Public Validation
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-red-500/30 bg-red-950/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-red-400 font-mono text-sm font-bold">✗ TRADITIONAL PHD</span>
                </div>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>• Single author, closed development</li>
                  <li>• Static document, fixed at submission</li>
                  <li>• Peer review after completion</li>
                  <li>• Limited reproducibility</li>
                  <li>• Methodology described, not demonstrated</li>
                </ul>
              </div>

              <div className="border border-green-500/30 bg-green-950/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-400 font-mono text-sm font-bold">✓ LIVING DISSERTATION</span>
                </div>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li>• Collaborative authorship, open process</li>
                  <li>• Living system, continuously evolving</li>
                  <li>• Ongoing community validation</li>
                  <li>• Full reproducibility via open source</li>
                  <li>• Methodology is the demonstration</li>
                </ul>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Timeline/Roadmap */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="ROADMAP" classification="PROJECT TIMELINE // APEX_MILESTONES">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-emerald-400">[</span> DISSERTATION ROADMAP <span className="text-emerald-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-emerald-500/50 hidden md:block" />

              <div className="space-y-8">
                {/* Phase 1 */}
                <PhaseCard
                  phase="01"
                  title="Foundation & Framework"
                  status="COMPLETE"
                  items={[
                    'Establish platform architecture',
                    'Define psycho-neural methodology',
                    'Create initial Commons essays',
                    'Implement Intel data pipeline',
                    'PhD Framework page (this page)',
                  ]}
                  color="emerald"
                />

                {/* Phase 2 */}
                <PhaseCard
                  phase="02"
                  title="Literature & Research Expansion"
                  status="IN_PROGRESS"
                  items={[
                    'Expand Commons essay series (10-15 essays)',
                    'Implement citation system',
                    'Build thematic essay clusters',
                    'Add community comment system',
                    'Develop methodology documentation',
                  ]}
                  color="cyan"
                />

                {/* Phase 3 */}
                <PhaseCard
                  phase="03"
                  title="Community Validation"
                  status="PLANNED"
                  items={[
                    'Open-source codebase release',
                    'Community voting on Portfolio',
                    'External researcher engagement',
                    'Academic partnership outreach',
                    'Citation tracking implementation',
                  ]}
                  color="purple"
                />

                {/* Phase 4 */}
                <PhaseCard
                  phase="04"
                  title="Synthesis & Publication"
                  status="FUTURE"
                  items={[
                    'Formal dissertation document compilation',
                    'Academic journal submissions',
                    'Conference presentations',
                    'External examination preparation',
                    'Legacy documentation',
                  ]}
                  color="orange"
                />
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            JOIN THE RESEARCH
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
            Explore the Living Dissertation
          </h2>

          <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
            Dive into the research, read the essays, or contribute to the open-source codebase.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/commons"
              className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:shadow-[0_0_50px_rgba(147,51,234,0.8)] font-mono"
            >
              <BookOpen className="w-5 h-5" />
              [ READ_ESSAYS ]
            </Link>
            <Link
              href="/philosophy"
              className="inline-flex items-center justify-center gap-2 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-semibold px-8 py-4 rounded-lg transition-all text-lg font-mono"
            >
              <Brain className="w-5 h-5" />
              [ VIEW_METHODOLOGY ]
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Chapter Mapping Component
function ChapterMapping({
  chapterNum,
  chapterTitle,
  sitePage,
  pageHref,
  description,
  icon,
  color
}: {
  chapterNum: string;
  chapterTitle: string;
  sitePage: string;
  pageHref: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
    purple: { border: 'border-purple-500/30', bg: 'bg-purple-950/30', text: 'text-purple-400', iconBg: 'bg-purple-500/20 border-purple-500/40' },
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-950/30', text: 'text-cyan-400', iconBg: 'bg-cyan-500/20 border-cyan-500/40' },
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-950/30', text: 'text-emerald-400', iconBg: 'bg-emerald-500/20 border-emerald-500/40' },
    orange: { border: 'border-orange-500/30', bg: 'bg-orange-950/30', text: 'text-orange-400', iconBg: 'bg-orange-500/20 border-orange-500/40' },
    indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-950/30', text: 'text-indigo-400', iconBg: 'bg-indigo-500/20 border-indigo-500/40' },
    violet: { border: 'border-violet-500/30', bg: 'bg-violet-950/30', text: 'text-violet-400', iconBg: 'bg-violet-500/20 border-violet-500/40' },
    pink: { border: 'border-pink-500/30', bg: 'bg-pink-950/30', text: 'text-pink-400', iconBg: 'bg-pink-500/20 border-pink-500/40' },
  };

  const styles = colorClasses[color] || colorClasses.cyan;

  return (
    <Link
      href={pageHref}
      className={`block border ${styles.border} ${styles.bg} backdrop-blur-sm rounded-lg p-5 hover:border-opacity-60 transition-all group`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${styles.iconBg} border flex items-center justify-center flex-shrink-0 ${styles.text}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`${styles.text} font-mono text-xs font-bold`}>CHAPTER {chapterNum}</span>
            <span className="text-slate-600">|</span>
            <span className="text-white font-mono text-sm font-bold">{chapterTitle}</span>
          </div>
          <div className={`${styles.text} text-sm font-semibold mb-1 group-hover:underline`}>
            {sitePage} <ArrowRight className="w-3 h-3 inline ml-1" />
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
}

// Phase Card Component
function PhaseCard({
  phase,
  title,
  status,
  items,
  color
}: {
  phase: string;
  title: string;
  status: string;
  items: string[];
  color: string;
}) {
  const colorClasses: Record<string, { border: string; bg: string; text: string; badgeBg: string }> = {
    emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-950/20', text: 'text-emerald-400', badgeBg: 'bg-emerald-950/50 border-emerald-500/30' },
    cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', text: 'text-cyan-400', badgeBg: 'bg-cyan-950/50 border-cyan-500/30' },
    purple: { border: 'border-purple-500/30', bg: 'bg-purple-950/20', text: 'text-purple-400', badgeBg: 'bg-purple-950/50 border-purple-500/30' },
    orange: { border: 'border-orange-500/30', bg: 'bg-orange-950/20', text: 'text-orange-400', badgeBg: 'bg-orange-950/50 border-orange-500/30' },
  };

  const styles = colorClasses[color] || colorClasses.cyan;

  const statusStyles: Record<string, string> = {
    'COMPLETE': 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400',
    'IN_PROGRESS': 'bg-cyan-950/50 border-cyan-500/30 text-cyan-400',
    'PLANNED': 'bg-purple-950/50 border-purple-500/30 text-purple-400',
    'FUTURE': 'bg-slate-950/50 border-slate-500/30 text-slate-400',
  };

  return (
    <div className={`relative md:pl-20 border ${styles.border} ${styles.bg} rounded-lg p-6`}>
      {/* Phase marker */}
      <div className="hidden md:flex absolute left-0 top-6 w-16 items-center justify-center">
        <div className={`w-10 h-10 rounded-full ${styles.badgeBg} border flex items-center justify-center ${styles.text} font-mono text-sm font-bold z-10 bg-slate-950`}>
          {phase}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <span className={`md:hidden ${styles.text} font-mono text-xs font-bold`}>PHASE {phase}</span>
        <h3 className="text-lg font-bold text-white font-mono">{title}</h3>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${statusStyles[status]}`}>
          {status === 'IN_PROGRESS' && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          )}
          {status}
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-400 text-sm">
            <span className={`${styles.text} mt-1`}>→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
