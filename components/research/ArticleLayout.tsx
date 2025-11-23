'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, User, Share2, Bookmark, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CitationTooltip, Citation } from './CitationTooltip';

interface ArticleLayoutProps {
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  date: string;
  readTime: string;
  category: string;
  citations: Citation[];
  isPremium?: boolean;
}

export const ArticleLayout: React.FC<ArticleLayoutProps> = ({
  title,
  excerpt,
  content,
  author = 'Apex Research Team',
  date,
  readTime,
  category,
  citations,
  isPremium = false,
}) => {
  const [readProgress, setReadProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;

      const element = articleRef.current;
      const totalHeight = element.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Custom components for ReactMarkdown
  const components = {
    // Handle citation markers in markdown [^1] format
    sup: ({ children, ...props }: any) => {
      const citationMatch = children?.toString().match(/\[(\d+)\]/);
      if (citationMatch) {
        const citationNum = parseInt(citationMatch[1]);
        const citation = citations.find(c => c.id === citationNum);
        if (citation) {
          return <CitationTooltip citationNumber={citationNum} citation={citation} />;
        }
      }
      return <sup {...props}>{children}</sup>;
    },
    // Style headings
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-bold text-white mt-12 mb-4 flex items-center gap-3" {...props}>
        <span className="w-1 h-6 bg-cyan-500 rounded-full" />
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-semibold text-white mt-8 mb-3" {...props}>
        {children}
      </h3>
    ),
    // Style paragraphs
    p: ({ children, ...props }: any) => (
      <p className="text-slate-300 leading-relaxed mb-6 text-[15px]" {...props}>
        {children}
      </p>
    ),
    // Style lists
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2" {...props}>
        {children}
      </ul>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-slate-300 ml-4" {...props}>
        {children}
      </li>
    ),
    // Style code blocks
    code: ({ inline, children, ...props }: any) => {
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 rounded text-sm font-mono" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="block bg-slate-900 text-slate-300 p-4 rounded-lg mb-6 overflow-x-auto font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    // Style blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-6 bg-slate-900/50 rounded-r-lg" {...props}>
        <div className="text-slate-300 italic">{children}</div>
      </blockquote>
    ),
    // Style links
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-400/30 hover:decoration-cyan-300 transition-colors inline-flex items-center gap-1"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    ),
  };

  return (
    <div ref={articleRef} className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 z-50"
        style={{ width: `${readProgress}%` }}
      />

      {/* Article Container */}
      <div className="container-custom pt-32 pb-20">
        {/* Back Button */}
        <Link
          href="/intel"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Intelligence Archive
        </Link>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto mb-12"
        >
          {/* Category & Premium Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-cyan-950/50 border border-cyan-400/50 text-cyan-400 rounded-full text-xs font-semibold">
              {category}
            </span>
            {isPremium && (
              <span className="px-3 py-1 bg-pink-950/50 border border-pink-400/50 text-pink-400 rounded-full text-xs font-semibold">
                PREMIUM
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-slate-400 leading-relaxed mb-6">
            {excerpt}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readTime}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-2 text-sm">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                isBookmarked
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Saved' : 'Save'}
            </button>
          </div>
        </motion.header>

        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto prose prose-invert prose-lg"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </motion.article>

        {/* Citations Section */}
        {citations.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mt-16 pt-8 border-t border-slate-800"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-cyan-500 rounded-full" />
              Sources & Citations
            </h2>
            <div className="grid gap-4">
              {citations.map((citation) => (
                <div
                  key={citation.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-cyan-400/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-bold text-sm mt-1">[{citation.id}]</span>
                    <div className="flex-1">
                      <div className="text-white font-semibold mb-1">{citation.title}</div>
                      <div className="text-slate-400 text-sm mb-2">{citation.source}</div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-xs uppercase">
                          {citation.type}
                        </span>
                        {citation.date && (
                          <span className="text-slate-500 text-xs">{citation.date}</span>
                        )}
                        {citation.url && (
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 text-xs"
                          >
                            View Source
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};
