import Link from 'next/link';
import { Plus, Award, Users, BookOpen, TrendingUp } from 'lucide-react';
import { ResourceGrid } from '@/components/library/ResourceGrid';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Resource Library | Apex Commons',
  description: 'Browse and discover educational resources shared by teachers. Find lesson plans, worksheets, videos, and more.',
};

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative px-6 py-16 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 text-cyan-400 text-sm font-sans mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                RESOURCE_LIBRARY // APEX_COMMONS
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                <span className="text-white">Resource</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Library
                </span>
              </h1>

              <p className="text-lg text-slate-400 max-w-2xl">
                Discover and share high-quality educational resources.
                Earn reputation credits by contributing, voting, and engaging with the community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/library/contribute"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-5 h-5" />
                Contribute Resource
              </Link>
              <Link
                href="/library/dashboard"
                className="flex items-center justify-center gap-2 px-6 py-3 border border-cyan-500/40 text-cyan-400 font-semibold rounded-lg hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-colors"
              >
                <TrendingUp className="w-5 h-5" />
                My Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="px-6 py-8 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">1,234</p>
                  <p className="text-xs text-slate-400">Resources</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">567</p>
                  <p className="text-xs text-slate-400">Contributors</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">89K</p>
                  <p className="text-xs text-slate-400">RC Awarded</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">45K</p>
                  <p className="text-xs text-slate-400">Downloads</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <ResourceGrid />
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 border-t border-cyan-500/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            JOIN THE COMMONS
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to contribute?
          </h2>

          <p className="text-slate-400 mb-8">
            Share your educational resources with the community and earn reputation credits.
            Every contribution helps teachers worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/library/contribute"
              className="px-8 py-4 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-purple-500/30"
            >
              Start Contributing
            </Link>
            <Link
              href="/library/governance"
              className="px-8 py-4 border border-purple-500/40 text-purple-400 font-semibold rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 transition-colors"
            >
              View Governance
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
