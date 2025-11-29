'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Code2,
  FileText,
  FlaskConical,
  GraduationCap,
  Home,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface ChapterNode {
  id: string;
  chapter: string;
  title: string;
  component: string;
  description: string;
  link: string;
  icon: React.ReactNode;
  color: 'cyan' | 'purple';
}

const chapters: ChapterNode[] = [
  {
    id: 'abstract',
    chapter: '00',
    title: 'Abstract',
    component: 'PhD Framework',
    description: 'Summary of thesis, methodology, and structure',
    link: '/phd-framework',
    icon: <FileText className="w-5 h-5" />,
    color: 'purple'
  },
  {
    id: 'intro',
    chapter: '01',
    title: 'Introduction',
    component: 'Homepage',
    description: 'Core concepts and problem space',
    link: '/',
    icon: <Home className="w-5 h-5" />,
    color: 'cyan'
  },
  {
    id: 'lit-review',
    chapter: '02',
    title: 'Literature Review',
    component: 'Commons',
    description: 'Theoretical foundations and scholarship',
    link: '/commons',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'purple'
  },
  {
    id: 'methodology',
    chapter: '03',
    title: 'Methodology',
    component: 'Codebase',
    description: 'Open-source demonstration of principles',
    link: 'https://github.com/raulromero2968-svg/apex-intelligence-center',
    icon: <Code2 className="w-5 h-5" />,
    color: 'cyan'
  },
  {
    id: 'results',
    chapter: '04',
    title: 'Results & Analysis',
    component: 'Intel & Portfolio',
    description: 'Real-time data and community insights',
    link: '/intel',
    icon: <FlaskConical className="w-5 h-5" />,
    color: 'purple'
  },
  {
    id: 'discussion',
    chapter: '05',
    title: 'Discussion',
    component: 'Lab & Philosophy',
    description: 'Reflection and broader implications',
    link: '/lab',
    icon: <Lightbulb className="w-5 h-5" />,
    color: 'cyan'
  },
  {
    id: 'conclusion',
    chapter: '06',
    title: 'Conclusion',
    component: 'Capstone Essay',
    description: 'Synthesis and future directions',
    link: '/commons',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'purple'
  }
];

export function DissertationDiagram() {
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const activeChapter = selectedChapter || hoveredChapter;

  return (
    <div className="space-y-8">
      {/* Visual Flow Diagram */}
      <div className="relative">
        {/* Connection Lines - Desktop */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-cyan-500/30 -translate-y-1/2 z-0" />

        {/* Chapter Nodes */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {chapters.map((chapter) => (
            <ChapterNodeComponent
              key={chapter.id}
              chapter={chapter}
              isActive={activeChapter === chapter.id}
              onHover={(id) => setHoveredChapter(id)}
              onSelect={(id) => setSelectedChapter(selectedChapter === id ? null : id)}
            />
          ))}
        </div>
      </div>

      {/* Detailed View Panel */}
      <div className="min-h-[200px]">
        {activeChapter ? (
          <DetailPanel chapter={chapters.find(c => c.id === activeChapter)!} />
        ) : (
          <div className="border border-slate-700/50 bg-slate-900/30 rounded-xl p-8 text-center">
            <p className="text-slate-500 font-sans text-sm">
              Hover or click a chapter node above to see details
            </p>
          </div>
        )}
      </div>

      {/* Flow Arrows - Mobile/Tablet */}
      <div className="lg:hidden flex justify-center">
        <div className="flex items-center gap-2 text-slate-600 font-sans text-xs">
          <span>ABSTRACT</span>
          <ArrowRight className="w-4 h-4" />
          <span>...</span>
          <ArrowRight className="w-4 h-4" />
          <span>CONCLUSION</span>
        </div>
      </div>
    </div>
  );
}

function ChapterNodeComponent({
  chapter,
  isActive,
  onHover,
  onSelect
}: {
  chapter: ChapterNode;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const borderColor = chapter.color === 'cyan'
    ? isActive ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'border-cyan-500/30 hover:border-cyan-400/60'
    : isActive ? 'border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'border-purple-500/30 hover:border-purple-400/60';

  const bgColor = chapter.color === 'cyan'
    ? isActive ? 'bg-cyan-500/20' : 'bg-slate-900/50'
    : isActive ? 'bg-purple-500/20' : 'bg-slate-900/50';

  const iconBg = chapter.color === 'cyan'
    ? 'bg-cyan-500/20 border-cyan-500/40'
    : 'bg-purple-500/20 border-purple-500/40';

  const iconColor = chapter.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400';

  return (
    <button
      className={`
        group relative flex flex-col items-center p-4 rounded-xl border backdrop-blur-sm
        transition-all duration-300 cursor-pointer
        ${borderColor} ${bgColor}
      `}
      onMouseEnter={() => onHover(chapter.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(chapter.id)}
    >
      {/* Chapter Number */}
      <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${iconBg} border flex items-center justify-center`}>
        <span className={`${iconColor} font-sans text-xs font-bold`}>{chapter.chapter}</span>
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg ${iconBg} border flex items-center justify-center mb-2`}>
        <span className={iconColor}>{chapter.icon}</span>
      </div>

      {/* Title */}
      <span className="text-white text-xs font-sans text-center leading-tight">
        {chapter.title}
      </span>

      {/* Component Label */}
      <span className={`${iconColor} text-[10px] font-sans mt-1 opacity-70`}>
        {chapter.component}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2`}>
          <div className={`w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent ${chapter.color === 'cyan' ? 'border-b-cyan-500/50' : 'border-b-purple-500/50'}`} />
        </div>
      )}
    </button>
  );
}

function DetailPanel({ chapter }: { chapter: ChapterNode }) {
  const borderColor = chapter.color === 'cyan' ? 'border-cyan-500/40' : 'border-purple-500/40';
  const accentColor = chapter.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400';
  const glowColor = chapter.color === 'cyan' ? 'bg-cyan-500/10' : 'bg-purple-500/10';
  const isExternal = chapter.link.startsWith('http');

  return (
    <div className={`border ${borderColor} bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 overflow-hidden relative`}>
      {/* Background Glow */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 ${glowColor} rounded-full blur-3xl`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-lg ${chapter.color === 'cyan' ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-purple-500/20 border-purple-500/40'} border flex items-center justify-center`}>
              <span className={accentColor}>{chapter.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`${accentColor} font-sans text-xs`}>CHAPTER {chapter.chapter}</span>
              </div>
              <h3 className="text-xl font-bold text-white font-sans">{chapter.title}</h3>
              <p className={`${accentColor} text-sm font-sans`}>→ {chapter.component}</p>
            </div>
          </div>

          {isExternal ? (
            <a
              href={chapter.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 ${accentColor} hover:text-white font-sans text-sm transition-colors`}
            >
              [ VIEW_CHAPTER ] →
            </a>
          ) : (
            <Link
              href={chapter.link}
              className={`inline-flex items-center gap-2 ${accentColor} hover:text-white font-sans text-sm transition-colors`}
            >
              [ VIEW_CHAPTER ] →
            </Link>
          )}
        </div>

        <p className="text-slate-400 leading-relaxed">{chapter.description}</p>

        {/* Contribution to Thesis */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <h4 className={`${accentColor} font-sans text-xs mb-2`}>CONTRIBUTION TO THESIS</h4>
          <p className="text-slate-500 text-sm">
            {getContributionText(chapter.id)}
          </p>
        </div>
      </div>
    </div>
  );
}

function getContributionText(chapterId: string): string {
  const contributions: Record<string, string> = {
    abstract: "Provides the executive summary and roadmap for understanding the entire dissertation structure, making the research accessible to both academic and general audiences.",
    intro: "Establishes the problem space: why traditional knowledge systems are failing, and how a decentralized, AI-augmented approach offers a solution.",
    'lit-review': "Engages with existing scholarship on systems thinking, AI ethics, distributed knowledge systems, and practice-based research to ground our methodology.",
    methodology: "The platform itself demonstrates the methodology—every design decision, every piece of documentation, is a methodological artifact subject to scrutiny.",
    results: "Shows the practical application of our thesis through real data, community engagement metrics, and the observable behavior of the system.",
    discussion: "Explores implications beyond TCG markets: how this model could transform academic research, knowledge validation, and human-AI collaboration.",
    conclusion: "Synthesizes all findings into a coherent argument, acknowledges limitations, and proposes concrete next steps for expanding this research paradigm."
  };

  return contributions[chapterId] || "This chapter contributes to the overall thesis by demonstrating a key aspect of the psycho-neural framework.";
}
