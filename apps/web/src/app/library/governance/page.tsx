import Link from 'next/link';
import { ArrowLeft, Shield, Vote, Users, BookOpen } from 'lucide-react';
import { GovernancePanel } from '@/components/library/GovernancePanel';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Governance | Apex Commons Library',
  description: 'Participate in community governance. Vote on proposals and shape the future of Apex Commons.',
};

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="px-6 py-12 border-b border-cyan-500/20">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-400 text-sm font-sans mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                COMMUNITY GOVERNANCE
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                <span className="text-white">Community</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Governance
                </span>
              </h1>

              <p className="text-slate-400 max-w-2xl">
                Shape the future of Apex Commons. Create proposals, vote on community decisions,
                and help build a better platform for educators everywhere.
              </p>
            </div>
          </div>

          {/* Governance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-lg bg-slate-900/50 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Vote className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">24</p>
                  <p className="text-xs text-slate-400">Active Proposals</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">156</p>
                  <p className="text-xs text-slate-400">Passed</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">2,345</p>
                  <p className="text-xs text-slate-400">Total Votes</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/50 border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <BookOpen className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">50 RC</p>
                  <p className="text-xs text-slate-400">Min to Propose</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-8 border-b border-cyan-500/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-white mb-4">How Governance Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold mb-3">
                1
              </div>
              <h3 className="font-medium text-white mb-1">Create Proposal</h3>
              <p className="text-sm text-slate-400">
                Users with 50+ RC can create proposals for policy changes, features, or moderation decisions.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold mb-3">
                2
              </div>
              <h3 className="font-medium text-white mb-1">Community Votes</h3>
              <p className="text-sm text-slate-400">
                Members vote For, Against, or Abstain. Vote weight is based on reputation credits.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold mb-3">
                3
              </div>
              <h3 className="font-medium text-white mb-1">Implementation</h3>
              <p className="text-sm text-slate-400">
                Passed proposals are reviewed and implemented by the team. Proposers earn RC for passed proposals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Governance Panel */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <GovernancePanel />
        </div>
      </section>
    </div>
  );
}
