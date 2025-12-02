'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Vote,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { trpc } from '@/lib/trpc';
import { RC_CONFIG, PROPOSAL_CATEGORIES } from '@/lib/commons/constants';

export default function GovernancePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');

  const { data: profile } = trpc.commons.user.getCurrentProfile.useQuery();
  const { data: activeProposals, isLoading: loadingActive } = trpc.commons.governance.listActive.useQuery();
  const { data: historyProposals, isLoading: loadingHistory } = trpc.commons.governance.listHistory.useQuery({});

  const canCreateProposal = (profile?.reputationCredits ?? 0) >= RC_CONFIG.MIN_RC_TO_CREATE_PROPOSAL;

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="px-6 md:px-12 mb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Vote className="w-8 h-8 text-purple-400" />
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Community Governance
                </h1>
              </div>
              <p className="text-slate-400">
                Shape the future of Apex Commons through community proposals
              </p>
            </div>

            {canCreateProposal ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
              >
                <Plus className="w-5 h-5" />
                New Proposal
              </button>
            ) : (
              <div className="text-right">
                <p className="text-sm text-slate-400 mb-1">
                  {RC_CONFIG.MIN_RC_TO_CREATE_PROPOSAL} RC required to create proposals
                </p>
                <p className="text-xs text-slate-500">
                  You have {profile?.reputationCredits ?? 0} RC
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 md:px-12 mb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-4 border-b border-slate-700">
            <button
              onClick={() => setSelectedTab('active')}
              className={`pb-4 px-2 font-medium transition-all relative ${
                selectedTab === 'active'
                  ? 'text-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Proposals
              {activeProposals && activeProposals.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                  {activeProposals.length}
                </span>
              )}
              {selectedTab === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
            <button
              onClick={() => setSelectedTab('history')}
              className={`pb-4 px-2 font-medium transition-all relative ${
                selectedTab === 'history'
                  ? 'text-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              History
              {selectedTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {selectedTab === 'active' ? (
                loadingActive ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-48 bg-slate-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : activeProposals && activeProposals.length > 0 ? (
                  activeProposals.map((proposal) => (
                    <ProposalCard key={proposal.id} proposal={proposal} />
                  ))
                ) : (
                  <HoloCard>
                    <div className="text-center py-12">
                      <Vote className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No Active Proposals</h3>
                      <p className="text-slate-400 mb-4">
                        The community is currently not voting on any proposals.
                      </p>
                      {canCreateProposal && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          Create the first proposal
                        </button>
                      )}
                    </div>
                  </HoloCard>
                )
              ) : loadingHistory ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : historyProposals && historyProposals.length > 0 ? (
                historyProposals.map((proposal) => (
                  <ProposalHistoryCard key={proposal.id} proposal={proposal} />
                ))
              ) : (
                <HoloCard>
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Proposal History</h3>
                    <p className="text-slate-400">
                      Past proposals will appear here once voting concludes.
                    </p>
                  </div>
                </HoloCard>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How Governance Works */}
              <HoloCard>
                <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Create Proposals</p>
                      <p className="text-slate-400">
                        Members with 500+ RC can submit proposals for community consideration.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Vote with RC Weight</p>
                      <p className="text-slate-400">
                        Your vote is weighted by your RC. More RC = more influence.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Decisions Are Made</p>
                      <p className="text-slate-400">
                        Proposals pass or fail based on RC-weighted community vote.
                      </p>
                    </div>
                  </div>
                </div>
              </HoloCard>

              {/* Your Voting Power */}
              <HoloCard intensity="high">
                <h3 className="text-lg font-semibold text-white mb-4">Your Voting Power</h3>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm mb-3">
                    <Star className="w-4 h-4" />
                    {profile?.contributorLevel ?? 'Bronze'} Contributor
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {(profile?.reputationCredits ?? 0).toLocaleString()}
                  </p>
                  <p className="text-slate-400 text-sm">RC Voting Weight</p>
                </div>

                {!canCreateProposal && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-400 text-center">
                      Earn {RC_CONFIG.MIN_RC_TO_CREATE_PROPOSAL - (profile?.reputationCredits ?? 0)} more RC to create proposals
                    </p>
                  </div>
                )}
              </HoloCard>

              {/* Proposal Categories */}
              <HoloCard>
                <h3 className="text-lg font-semibold text-white mb-4">Proposal Categories</h3>
                <div className="space-y-2">
                  {PROPOSAL_CATEGORIES.map((cat) => (
                    <div key={cat.value} className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="font-medium text-white text-sm">{cat.label}</p>
                      <p className="text-xs text-slate-400">{cat.description}</p>
                    </div>
                  ))}
                </div>
              </HoloCard>
            </div>
          </div>
        </div>
      </div>

      {/* Create Proposal Modal - Simplified for now */}
      {showCreateModal && (
        <CreateProposalModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: any }) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;

  const { data: userVote } = trpc.commons.governance.getUserVote.useQuery({ proposalId: proposal.id });
  const voteMutation = trpc.commons.governance.vote.useMutation();
  const utils = trpc.useUtils();

  const handleVote = async (choice: 'for' | 'against' | 'abstain') => {
    try {
      await voteMutation.mutateAsync({ proposalId: proposal.id, choice });
      utils.commons.governance.listActive.invalidate();
      utils.commons.governance.getUserVote.invalidate({ proposalId: proposal.id });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const categoryLabel = PROPOSAL_CATEGORIES.find(c => c.value === proposal.category)?.label ?? proposal.category;

  return (
    <HoloCard>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {categoryLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="w-4 h-4" />
          <span>{totalVotes} votes</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
      <p className="text-slate-400 mb-4">{proposal.summary}</p>

      {/* Vote Progress */}
      <div className="mb-6">
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-800">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${againstPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-green-400">{proposal.votesFor} For</span>
          <span className="text-red-400">{proposal.votesAgainst} Against</span>
        </div>
      </div>

      {/* Vote Buttons */}
      {userVote ? (
        <div className="p-4 bg-slate-800/50 rounded-lg text-center">
          <p className="text-slate-400 text-sm">
            You voted <span className="font-medium text-white">{userVote.choice}</span> with {userVote.weightRc} RC
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleVote('for')}
            disabled={voteMutation.isPending}
            className="flex items-center justify-center gap-2 py-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
          >
            <ThumbsUp className="w-4 h-4" />
            For
          </button>
          <button
            onClick={() => handleVote('against')}
            disabled={voteMutation.isPending}
            className="flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <ThumbsDown className="w-4 h-4" />
            Against
          </button>
          <button
            onClick={() => handleVote('abstain')}
            disabled={voteMutation.isPending}
            className="flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-600 bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Minus className="w-4 h-4" />
            Abstain
          </button>
        </div>
      )}

      <Link
        href={`/commons/governance/${proposal.id}`}
        className="inline-flex items-center gap-1 mt-4 text-sm text-purple-400 hover:text-purple-300"
      >
        View full proposal <ArrowRight className="w-4 h-4" />
      </Link>
    </HoloCard>
  );
}

function ProposalHistoryCard({ proposal }: { proposal: any }) {
  const isAccepted = proposal.status === 'accepted';
  const categoryLabel = PROPOSAL_CATEGORIES.find(c => c.value === proposal.category)?.label ?? proposal.category;

  return (
    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isAccepted ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${isAccepted ? 'text-green-400' : 'text-red-400'}`}>
              {isAccepted ? 'Accepted' : 'Rejected'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">{categoryLabel}</span>
          </div>
          <h3 className="font-semibold text-white truncate">{proposal.title}</h3>
          <p className="text-sm text-slate-400 line-clamp-1">{proposal.summary}</p>
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>{proposal.votesFor} For / {proposal.votesAgainst} Against</p>
        </div>
      </div>
    </div>
  );
}

function CreateProposalModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    category: '',
    tags: [] as string[],
  });

  const createMutation = trpc.commons.governance.create.useMutation({
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.summary || !formData.body || !formData.category) return;

    await createMutation.mutateAsync({
      title: formData.title,
      summary: formData.summary,
      body: formData.body,
      category: formData.category as any,
      tags: formData.tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Proposal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="A clear, concise title for your proposal"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="">Select category</option>
              {PROPOSAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Summary *</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="A brief summary (shown in the proposal list)"
              rows={2}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Full Proposal *</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Explain your proposal in detail. Include background, rationale, and expected outcomes."
              rows={8}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              required
            />
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400 mb-1">Before Submitting</p>
                <p className="text-sm text-slate-400">
                  Your proposal will immediately be open for voting. Make sure you've clearly explained your idea and considered potential impacts.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
