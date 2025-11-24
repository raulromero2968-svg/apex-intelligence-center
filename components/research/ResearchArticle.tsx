'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CitationTooltip } from './CitationTooltip';
import { Calendar, User, Tag } from 'lucide-react';

// Mock Data Structure for a Research Report
export interface ResearchReport {
  id: string;
  title: string;
  summary: string;
  author: string; // usually an AI Agent like "Gemini (Analyst)"
  date: string;
  tags: string[];
  content: string; // The markdown content
  sources: Record<string, { title: string; url: string; domain: string; date: string }>;
}

export const ResearchArticle = ({ report }: { report: ResearchReport }) => {
  return (
    <article className="max-w-3xl mx-auto">
      {/* Article Header */}
      <header className="mb-12 border-b border-slate-800 pb-8">
        <div className="flex gap-2 mb-4">
          {report.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-900 text-cyan-400 text-xs font-mono uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {report.title}
        </h1>
        <div className="flex items-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300">{report.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{report.date}</span>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <div className="prose prose-invert prose-cyan max-w-none">
        <ReactMarkdown
          components={{
            // Override standard text to inject citations if detected (simplified approach)
            // In a real app, we'd use a remark plugin. Here we assume manual placement of custom components or just styling.
            // For this POC, we will use a text-replacement strategy in the content string for simplicity.
            p: ({ children }) => <p className="text-lg text-slate-300 leading-relaxed mb-6">{children}</p>,
            h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-2"><span className="w-1 h-8 bg-cyan-500 rounded-full inline-block"/>{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-semibold text-cyan-100 mt-8 mb-3">{children}</h3>,
            ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 text-slate-300 mb-6">{children}</ul>,
            blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-6 bg-purple-900/10 italic text-slate-300 rounded-r-lg">{children}</blockquote>
          }}
        >
          {report.content}
        </ReactMarkdown>
      </div>

      {/* Sources Section (Footer) */}
      <div className="mt-16 pt-8 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">References & Methodology</h3>
        <div className="grid gap-3">
          {Object.entries(report.sources).map(([id, source]) => (
            <div key={id} className="flex gap-4 text-sm text-slate-400">
              <span className="text-cyan-500 font-mono">[{id}]</span>
              <a href={source.url} className="hover:text-cyan-400 transition-colors underline decoration-slate-700 underline-offset-4">
                {source.title}
              </a>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};
