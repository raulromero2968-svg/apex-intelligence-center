import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';
import AreaChartViz from '@/components/mdx/AreaChartViz';
import BarChartViz from '@/components/mdx/BarChartViz';
import AskFollowUp from '@/components/mdx/AskFollowUp';
import DataCallout from '@/components/mdx/DataCallout';
import VARCInsight from '@/components/mdx/VARCInsight';
import TerminalSection from '@/components/mdx/TerminalSection';
import { ShadowReflexTest } from '@/components/mdx/ShadowReflexTest';

// Custom components for MDX content
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Custom MDX components
    AreaChartViz,
    BarChartViz,
    AskFollowUp,
    ShadowReflexTest,
    // VARC-style components
    DataCallout,
    VARCInsight,
    TerminalSection,
    // Override default HTML elements
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-white mb-6 mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold text-white mb-4 mt-8 border-b border-cyan-500/20 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold text-white mb-3 mt-6">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-semibold text-white mb-2 mt-4">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-white/80 leading-relaxed mb-4">
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <Link
        href={href || '#'}
        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
      >
        {children}
      </Link>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-white/80 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-white/80 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 py-2 my-4 bg-cyan-500/5 rounded-r">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      const isInline = !className;

      if (isInline) {
        return (
          <code className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-sm font-mono border border-cyan-500/20">
            {children}
          </code>
        );
      }

      return (
        <code className={`block p-4 rounded-lg bg-black/40 border border-cyan-500/20 overflow-x-auto font-mono text-sm my-4 ${className || ''}`}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="overflow-x-auto">
        {children}
      </pre>
    ),
    img: ({ src, alt }) => (
      <span className="block relative w-full h-[400px] my-6 rounded-lg overflow-hidden border border-cyan-500/20">
        <Image
          src={src || ''}
          alt={alt || ''}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </span>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border border-cyan-500/20 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-cyan-500/10">
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-white border-b border-cyan-500/20">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-white/80 border-b border-white/10">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="my-8 border-cyan-500/20" />
    ),

    // Add custom components here as they're built
    // InlineChart,
    // Callout,
    // DataTable,
    // etc.

    ...components,
  };
}
