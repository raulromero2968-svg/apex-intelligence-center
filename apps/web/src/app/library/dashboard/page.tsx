import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { Dashboard } from '@/components/library/Dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard | Apex Commons Library',
  description: 'View your contribution stats, reputation credits, and activity in the Apex Commons Library.',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="px-6 py-8 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Library
              </Link>

              <h1 className="text-3xl font-black tracking-tight">
                <span className="text-white">My</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Dashboard
                </span>
              </h1>
            </div>

            <Link
              href="/library/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <Dashboard />
        </div>
      </section>
    </div>
  );
}
