import Link from 'next/link';
import {
  BookOpen,
  Brain,
  Code2,
  FileText,
  FlaskConical,
  GraduationCap,
  Network,
  Sparkles,
  Target,
  Users,
  Lightbulb,
  GitBranch,
  ExternalLink
} from 'lucide-react';
import { ElectronicFolder } from '@/components/ui/ElectronicFolder';
import { HoloCard } from '@/components/ui/HoloCard';
import { DigitalScroll } from '@/components/ui/DigitalScroll';
import { DissertationDiagram } from './DissertationDiagram';

export const metadata = {
  title: "PhD Framework | The Living Dissertation | Apex Intelligence",
  description: "A revolutionary psycho-neural PhD framework: transforming the Apex ecosystem into a living, interactive, publicly-validated dissertation.",
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
            LIVING DISSERTATION // PSYCHO-NEURAL PHD
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
            <span className="block text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              The Apex
            </span>
            <span className="block text-holographic">
              PhD Framework
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            A revolutionary new form of academic inquiry: a living, interactive, and publicly-validated body of work where the ecosystem <em>is</em> the research, the methodology, and the dissertation itself.
            <span className="inline-block w-3 h-5 bg-purple-400 ml-1 animate-pulse align-middle" />
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono">7</div>
              <div className="text-xs text-slate-500 font-mono">CHAPTERS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-400 font-mono">4</div>
              <div className="text-xs text-slate-500 font-mono">PHASES</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 font-mono">∞</div>
              <div className="text-xs text-slate-500 font-mono">ITERATIONS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Thesis Card */}
      <section className="relative z-10 px-6 md:px-12 pb-12">
        <div className="max-w-4xl mx-auto">
          <HoloCard intensity="high">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-3 font-mono">
                  [ CORE THESIS ]
                </h3>
                <blockquote className="text-slate-300 leading-relaxed italic border-l-2 border-purple-500/50 pl-4">
                  &ldquo;By creating a decentralized, transparent, and ethically-aligned ecosystem for curating and analyzing information, we can demonstrate a new model for knowledge creation and validation that is more robust, resilient, and aligned with human values than traditional, centralized systems. This psycho-neural framework, which integrates human intuition with artificial intelligence, represents the future of intellectual inquiry.&rdquo;
                </blockquote>
              </div>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* What is the Psycho-Neural PhD? */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="THE CONCEPT" classification="FOUNDATIONAL // PHD FRAMEWORK">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-purple-400">[</span> WHAT IS THE PSYCHO-NEURAL PHD? <span className="text-purple-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  The <strong className="text-white">Psycho-Neural PhD</strong> is a radical reimagining of doctoral research.
                  Instead of producing a static document that sits on a shelf, we&apos;re building a <em>living dissertation</em>—a
                  dynamic, interactive platform that evolves with new insights, community input, and technological advances.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  The &ldquo;psycho-neural&rdquo; component refers to the deliberate integration of <strong className="text-cyan-400">human intuition</strong> and
                  <strong className="text-purple-400"> artificial intelligence</strong>. Every piece of analysis, every essay, every decision
                  on this platform documents how human creativity and ethical judgment combine with AI&apos;s analytical power.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border border-cyan-500/30 bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-cyan-400 font-mono text-sm mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    HUMAN CONTRIBUTION
                  </h4>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>→ Intuition and pattern recognition</li>
                    <li>→ Ethical judgment and value alignment</li>
                    <li>→ Creative synthesis and narrative</li>
                    <li>→ Community validation and critique</li>
                  </ul>
                </div>
                <div className="border border-purple-500/30 bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-purple-400 font-mono text-sm mb-2 flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    AI CONTRIBUTION
                  </h4>
                  <ul className="text-slate-400 text-sm space-y-1">
                    <li>→ Data analysis and pattern detection</li>
                    <li>→ Research synthesis and summarization</li>
                    <li>→ Real-time monitoring and alerts</li>
                    <li>→ Scale and computational power</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Differentiators */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-cyan-500/30 bg-slate-900/30 rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                  <GitBranch className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-mono text-sm mb-2">LIVING & EVOLVING</h3>
                <p className="text-slate-500 text-sm">
                  Unlike static dissertations, this work continuously updates with new research, community feedback, and real-world validation.
                </p>
              </div>

              <div className="border border-purple-500/30 bg-slate-900/30 rounded-lg p-6 hover:border-purple-400/60 transition-all">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-white font-mono text-sm mb-2">PUBLICLY VALIDATED</h3>
                <p className="text-slate-500 text-sm">
                  Open peer review through community engagement, comments, and voting—more transparent than traditional academic gatekeeping.
                </p>
              </div>

              <div className="border border-cyan-500/30 bg-slate-900/30 rounded-lg p-6 hover:border-cyan-400/60 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4">
                  <Code2 className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-mono text-sm mb-2">DISSERTATION AS CODE</h3>
                <p className="text-slate-500 text-sm">
                  The methodology is embodied in the platform itself—open-source, heavily documented, demonstrating principles through practice.
                </p>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Dissertation Structure Diagram */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="DISSERTATION STRUCTURE" classification="ECOSYSTEM → CHAPTERS">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-cyan-400">[</span> MAPPING ECOSYSTEM TO DISSERTATION <span className="text-cyan-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10">
              Each section of the Apex ecosystem serves as a chapter in the dissertation. Click any chapter to explore its contribution to the thesis.
            </p>

            {/* Interactive Diagram */}
            <DissertationDiagram />
          </ElectronicFolder>
        </div>
      </section>

      {/* Detailed Chapter Breakdown */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="CHAPTER BREAKDOWN" classification="DETAILED MAPPING">
            <DigitalScroll height="h-[600px]" className="not-prose">
              <div className="space-y-6 py-4">
                {/* Chapter 1: Abstract */}
                <ChapterCard
                  number="00"
                  title="ABSTRACT"
                  component="This Page (PhD Framework)"
                  description="Provides a concise summary of the entire project, its thesis, methodology, and structure."
                  link="/phd-framework"
                  color="purple"
                  icon={<FileText className="w-5 h-5" />}
                />

                {/* Chapter 2: Introduction */}
                <ChapterCard
                  number="01"
                  title="INTRODUCTION"
                  component="Homepage (The Nexus)"
                  description="Introduces the core concepts, the problem space, and the proposed solution—the Apex ecosystem as a new model for knowledge systems."
                  link="/"
                  color="cyan"
                  icon={<Target className="w-5 h-5" />}
                />

                {/* Chapter 3: Literature Review */}
                <ChapterCard
                  number="02"
                  title="LITERATURE REVIEW"
                  component="Commons (Essays)"
                  description="Explores theoretical and philosophical underpinnings, engaging with scholarship on systems thinking, AI ethics, and knowledge systems."
                  link="/commons"
                  color="purple"
                  icon={<BookOpen className="w-5 h-5" />}
                />

                {/* Chapter 4: Methodology */}
                <ChapterCard
                  number="03"
                  title="METHODOLOGY"
                  component="The Platform (Codebase)"
                  description="The platform itself demonstrates the methodology—decentralization, transparency, human-AI collaboration. Open-source and heavily documented."
                  link="https://github.com/raulromero2968-svg/apex-intelligence-center"
                  color="cyan"
                  icon={<Code2 className="w-5 h-5" />}
                  external
                />

                {/* Chapter 5: Results */}
                <ChapterCard
                  number="04"
                  title="RESULTS & ANALYSIS"
                  component="Intel Page & Portfolio"
                  description="Real-time analysis, data, and community-driven insights. These are the 'results' of the research in action."
                  link="/intel"
                  color="purple"
                  icon={<FlaskConical className="w-5 h-5" />}
                />

                {/* Chapter 6: Discussion */}
                <ChapterCard
                  number="05"
                  title="DISCUSSION"
                  component="The Lab & Philosophy Pages"
                  description="Space for reflection, discussion, and exploration of the broader implications of the research and methodology."
                  link="/lab"
                  color="cyan"
                  icon={<Lightbulb className="w-5 h-5" />}
                />

                {/* Chapter 7: Conclusion */}
                <ChapterCard
                  number="06"
                  title="CONCLUSION"
                  component="Dedicated Essay (Coming)"
                  description="Synthesizes findings, reflects on limitations, and proposes future directions. Will be published as the capstone essay in Commons."
                  link="/commons"
                  color="purple"
                  icon={<GraduationCap className="w-5 h-5" />}
                  coming
                />
              </div>
            </DigitalScroll>
          </ElectronicFolder>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="IMPLEMENTATION ROADMAP" classification="PHASES 1-4">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-purple-400">[</span> DEVELOPMENT PHASES <span className="text-purple-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Phase 1 */}
              <PhaseCard
                phase="01"
                title="FOUNDATION & STRUCTURE"
                status="IN_PROGRESS"
                items={[
                  "Create PhD Framework page",
                  "Establish dissertation structure",
                  "Add chapter metadata to pages",
                  "Begin psycho-neural documentation"
                ]}
                color="cyan"
              />

              {/* Phase 2 */}
              <PhaseCard
                phase="02"
                title="CONTENT DEVELOPMENT"
                status="PENDING"
                items={[
                  "Publish 10-15 Commons essays",
                  "Build robust Intel analysis tools",
                  "Launch Portfolio curation system",
                  "Document technical methodology"
                ]}
                color="purple"
              />

              {/* Phase 3 */}
              <PhaseCard
                phase="03"
                title="COMMUNITY & VALIDATION"
                status="PENDING"
                items={[
                  "Launch public beta",
                  "Implement peer review system",
                  "Collect and analyze user data",
                  "Publish interim findings"
                ]}
                color="cyan"
              />

              {/* Phase 4 */}
              <PhaseCard
                phase="04"
                title="SYNTHESIS & DEFENSE"
                status="PENDING"
                items={[
                  "Write comprehensive Conclusion essay",
                  "Create public Defense page",
                  "Publish white paper",
                  "Seek academic recognition"
                ]}
                color="purple"
              />
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Validation Strategies */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="VALIDATION & CREDENTIALING" classification="LEGITIMACY FRAMEWORK">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <h2 className="text-xl font-bold tracking-wider text-white font-mono">
                <span className="text-cyan-400">[</span> HOW WE VALIDATE <span className="text-cyan-400">]</span>
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>

            <p className="text-slate-400 text-center max-w-3xl mx-auto mb-10">
              A key challenge for any alternative PhD model is validation. We employ a hybrid approach combining multiple strategies.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ValidationCard
                title="PUBLIC PEER REVIEW"
                description="The entire dissertation is publicly accessible and open to critique—more transparent than traditional closed-door processes."
                icon={<Users className="w-5 h-5" />}
              />
              <ValidationCard
                title="ACADEMIC PARTNERSHIPS"
                description="Partnerships with progressive institutions recognizing alternative dissertation formats (PhD by Portfolio programs)."
                icon={<GraduationCap className="w-5 h-5" />}
              />
              <ValidationCard
                title="PUBLICATION & CITATION"
                description="Components published in academic journals and conferences. Citations and engagement serve as validation."
                icon={<BookOpen className="w-5 h-5" />}
              />
              <ValidationCard
                title="COMMUNITY RECOGNITION"
                description="High engagement, positive feedback, and community contributions demonstrate real-world value and impact."
                icon={<Sparkles className="w-5 h-5" />}
              />
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* Psycho-Neural Documentation */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <ElectronicFolder title="PSYCHO-NEURAL DOCUMENTATION" classification="HUMAN-AI COLLABORATION LOG">
            <div className="relative border border-purple-500/40 bg-gradient-to-br from-purple-950/30 to-cyan-950/30 backdrop-blur-sm rounded-xl p-8 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">REFLEXIVE METHODOLOGY</h3>
                    <p className="text-slate-500 text-sm">Documenting the human-AI collaboration process</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-slate-400 leading-relaxed">
                    Every major piece of content on this platform includes transparent documentation of how human and AI contributions were integrated.
                    This creates a new form of reflexive methodology that is central to the dissertation.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-cyan-500/30 bg-slate-900/50 rounded-lg p-4">
                      <h4 className="text-cyan-400 font-mono text-sm mb-2">TRANSPARENT ATTRIBUTION</h4>
                      <p className="text-slate-500 text-sm">
                        Clear indication of human-authored, AI-generated, or collaborative content with specific contribution documentation.
                      </p>
                    </div>
                    <div className="border border-purple-500/30 bg-slate-900/50 rounded-lg p-4">
                      <h4 className="text-purple-400 font-mono text-sm mb-2">ETHICAL GUARDRAILS</h4>
                      <p className="text-slate-500 text-sm">
                        Explicit ethical guidelines and constraints ensuring AI components are aligned with human values—documented and open to scrutiny.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/lab"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm transition-colors"
                  >
                    [ VIEW_COLLABORATION_LOG ] →
                  </Link>
                </div>
              </div>
            </div>
          </ElectronicFolder>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-20">
        <div className="max-w-3xl mx-auto">
          <HoloCard intensity="high" className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-mono mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              JOIN THE LIVING DISSERTATION
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-mono">
              Be Part of the Research
            </h2>

            <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
              This isn&apos;t just a project about the future of research—it <em>is</em> the future of research. Contribute, critique, and help validate this new model.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/commons"
                className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-8 py-4 rounded-lg transition-all text-lg shadow-[0_0_30px_rgba(147,51,234,0.5)] hover:shadow-[0_0_50px_rgba(147,51,234,0.8)] font-mono"
              >
                [ READ_LITERATURE_REVIEW ]
              </Link>
              <Link
                href="/subscribe"
                className="btn-tactical inline-flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                [ SUBSCRIBE_TO_UPDATES ]
              </Link>
            </div>
          </HoloCard>
        </div>
      </section>
    </div>
  );
}

// Chapter Card Component
function ChapterCard({
  number,
  title,
  component,
  description,
  link,
  color,
  icon,
  external,
  coming
}: {
  number: string;
  title: string;
  component: string;
  description: string;
  link: string;
  color: 'cyan' | 'purple';
  icon: React.ReactNode;
  external?: boolean;
  coming?: boolean;
}) {
  const borderColor = color === 'cyan' ? 'border-cyan-500/30 hover:border-cyan-400/60' : 'border-purple-500/30 hover:border-purple-400/60';
  const accentColor = color === 'cyan' ? 'text-cyan-400' : 'text-purple-400';
  const bgColor = color === 'cyan' ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-purple-500/20 border-purple-500/40';

  const CardWrapper = external ? 'a' : Link;
  const cardProps = external
    ? { href: link, target: "_blank", rel: "noopener noreferrer" }
    : { href: link };

  return (
    <CardWrapper
      {...cardProps}
      className={`group block border ${borderColor} bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 transition-all`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${bgColor} border flex items-center justify-center flex-shrink-0`}>
          <span className={`${accentColor}`}>{icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`${accentColor} font-mono text-xs`}>CHAPTER {number}</span>
            {coming && (
              <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs font-mono">
                COMING
              </span>
            )}
            {external && <ExternalLink className="w-3 h-3 text-slate-500" />}
          </div>
          <h3 className="text-lg font-bold text-white mb-1 font-mono">{title}</h3>
          <p className={`text-sm ${accentColor} mb-2 font-mono`}>→ {component}</p>
          <p className="text-slate-500 text-sm">{description}</p>
        </div>
      </div>
    </CardWrapper>
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
  status: 'IN_PROGRESS' | 'PENDING' | 'COMPLETE';
  items: string[];
  color: 'cyan' | 'purple';
}) {
  const borderColor = color === 'cyan' ? 'border-cyan-500/30' : 'border-purple-500/30';
  const accentColor = color === 'cyan' ? 'text-cyan-400' : 'text-purple-400';
  const statusColor = status === 'IN_PROGRESS' ? 'text-green-400 bg-green-500/20 border-green-500/30'
    : status === 'COMPLETE' ? 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
    : 'text-slate-400 bg-slate-700/50 border-slate-600/30';

  return (
    <div className={`border ${borderColor} bg-slate-900/50 backdrop-blur-sm rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`${accentColor} font-mono text-2xl font-bold`}>{phase}</span>
          <h3 className="text-white font-mono text-sm">{title}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-mono border ${statusColor}`}>
          {status}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2 text-slate-400 text-sm">
            <span className={accentColor}>→</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Validation Card Component
function ValidationCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-slate-700/50 bg-slate-900/30 rounded-lg p-4 hover:border-cyan-500/30 transition-all">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center mb-3">
        <span className="text-cyan-400">{icon}</span>
      </div>
      <h4 className="text-white font-mono text-xs mb-2">{title}</h4>
      <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
