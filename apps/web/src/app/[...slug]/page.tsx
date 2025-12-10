import Link from 'next/link';
import { Construction, ArrowLeft, Terminal } from 'lucide-react';

// Map of known routes to display titles for "Under Construction" pages
const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  'research': { title: 'Intelligence Research', subtitle: 'Deep dive analysis into TCG market dynamics.' },
  'living-phd': { title: 'The Living PhD', subtitle: 'Ongoing academic research into collectible economics.' },
  'deck-builder': { title: 'The Lab', subtitle: 'Construct and test your decks against the meta.' },
  'intel/pokemon-151': { title: 'Intel: Pokemon 151', subtitle: 'Set analysis and investment targets.' },
  'intel/modern-rotation': { title: 'Intel: Modern Rotation', subtitle: 'Analysis of modern format card rotations.' },
  'intel/vintage-analysis': { title: 'Intel: Vintage Analysis', subtitle: 'Deep dive into vintage card markets.' },
  'admin/reviews': { title: 'Admin: Reviews', subtitle: 'Manage and moderate community reviews.' },
  'admin/users': { title: 'Admin: Users', subtitle: 'User management and permissions.' },
  'admin/analytics': { title: 'Admin: Analytics', subtitle: 'Platform analytics and metrics.' },
  'stream': { title: 'Intelligence Stream', subtitle: 'Real-time market data and alerts.' },
  'vault': { title: 'The Vault', subtitle: 'Secure storage for your digital assets.' },
  'scan': { title: 'Card Scanner', subtitle: 'AI-powered card recognition and valuation.' },
  'transform': { title: 'Transform', subtitle: 'Card transformation and grading tools.' },
  'library': { title: 'Card Library', subtitle: 'Browse the complete card database.' },
  'papers': { title: 'Research Papers', subtitle: 'Academic publications and whitepapers.' },
  'insights': { title: 'Market Insights', subtitle: 'Curated insights from our analysts.' },
  'tools': { title: 'Tools & Utilities', subtitle: 'Productivity tools for collectors.' },
  'project-o': { title: 'Project O', subtitle: 'Experimental features and beta testing.' },
  'services': { title: 'Services', subtitle: 'Professional services for serious collectors.' },
  'press': { title: 'Press & Media', subtitle: 'News and media resources.' },
  'tutorial': { title: 'Tutorial', subtitle: 'Learn how to use Apex Intelligence.' },
  'convergence': { title: 'Convergence', subtitle: 'Multi-platform market convergence analysis.' },
  'hall-of-fame': { title: 'Hall of Fame', subtitle: 'Top collectors and achievements.' },
  'hall-of-disciples': { title: 'Hall of Disciples', subtitle: 'Community leaders and contributors.' },
  'legal': { title: 'Legal', subtitle: 'Terms, privacy, and legal information.' },
  'legal/terms': { title: 'Terms of Service', subtitle: 'Platform terms and conditions.' },
  'legal/privacy': { title: 'Privacy Policy', subtitle: 'How we handle your data.' },
};

interface CatchAllPageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const pathKey = slug.join('/');

  // If we have specific meta for this route, use it.
  // Otherwise, generate a generic title based on the slug.
  const meta = ROUTE_META[pathKey] || {
    title: slug[slug.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    subtitle: 'System Module Online. Awaiting Content Injection.',
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <Construction className="w-10 h-10 text-cyan-400" />
          </div>
        </div>

        {/* Category Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-xs font-sans mb-6 tracking-wider">
          <Terminal className="w-3 h-3" />
          MODULE INITIALIZING
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
          {meta.title}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
          {meta.subtitle}
        </p>

        {/* Status Box */}
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 mb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Under Development
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
              This sector of Apex Intelligence is currently being constructed.
              The routing is active, but the interface is initializing.
            </p>
            <div className="mt-4 text-xs text-slate-600 font-mono bg-black/40 px-4 py-2 rounded-lg border border-slate-800">
              PATH: /{pathKey}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-sans"
          >
            <Terminal className="w-4 h-4" />
            Access Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const pathKey = slug.join('/');

  const meta = ROUTE_META[pathKey] || {
    title: slug[slug.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    subtitle: 'System Module Online.',
  };

  return {
    title: meta.title,
    description: meta.subtitle,
  };
}
