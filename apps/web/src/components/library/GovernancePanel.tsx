'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import {
  Vote,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Calendar,
  Filter,
} from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  active: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <Vote className="w-4 h-4" /> },
  passed: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
  expired: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: <Clock className="w-4 h-4" /> },
};

const categoryColors: Record<string, string> = {
  policy: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  feature: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  moderation: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

type ProposalStatus = 'active' | 'passed' | 'rejected' | 'expired';

export function GovernancePanel() {
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | undefined>('active');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = api.apexCommons.listProposals.useQuery({
    status: statusFilter,
    pagination: { page, limit: 10 },
  });

  const { data: profile } = api.apexCommons.getProfile.useQuery();

  const voteProposal = api.apexCommons.voteProposal.useMutation();

  const handleVote = async (proposalId: string, vote: 'for' | 'against' | 'abstain') => {
    try {
      await voteProposal.mutateAsync({ proposalId, vote });
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const calculateTimeRemaining = (endsAt: Date) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Less than 1h remaining';
  };

  const calculateVotePercentage = (proposal: { votesFor: number; votesAgainst: number; votesAbstain: number }) => {
    const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
    if (total === 0) return { for: 0, against: 0, abstain: 0 };
    return {
      for: (proposal.votesFor / total) * 100,
      against: (proposal.votesAgainst / total) * 100,
      abstain: (proposal.votesAbstain / total) * 100,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatusFilter(undefined);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === undefined
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {(['active', 'passed', 'rejected', 'expired'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === status
                    ? `${statusColors[status].bg} ${statusColors[status].text}`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Create Proposal Button */}
        {profile && profile.reputationCredits >= 50 && (
          <Link
            href="/library/governance/create"
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Proposal
          </Link>
        )}
      </div>

      {/* RC Requirement Notice */}
      {profile && profile.reputationCredits < 50 && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <p className="text-sm text-yellow-400">
            You need at least 50 RC to create proposals. Current: {profile.reputationCredits} RC
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading proposals...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Failed to load proposals</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.proposals.length === 0 && (
        <div className="text-center py-16">
          <Vote className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No proposals found</h3>
          <p className="text-slate-400">
            {statusFilter
              ? `No ${statusFilter} proposals at the moment.`
              : 'Be the first to create a proposal!'}
          </p>
        </div>
      )}

      {/* Proposals List */}
      {!isLoading && !error && data && data.proposals.length > 0 && (
        <div className="space-y-4">
          {data.proposals.map((proposal) => {
            const colors = statusColors[proposal.status];
            const categoryColor = categoryColors[proposal.category] || categoryColors.other;
            const percentages = calculateVotePercentage(proposal);
            const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;

            return (
              <div
                key={proposal.id}
                className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30 hover:border-cyan-400/50 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {colors.icon}
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColor}`}>
                        {proposal.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{proposal.title}</h3>
                  </div>
                  {proposal.status === 'active' && (
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      {calculateTimeRemaining(proposal.endsAt)}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {proposal.description}
                </p>

                {/* Vote Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-green-400" />
                      For: {proposal.votesFor} ({percentages.for.toFixed(1)}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3 text-red-400" />
                      Against: {proposal.votesAgainst} ({percentages.against.toFixed(1)}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <Minus className="w-3 h-3 text-slate-400" />
                      Abstain: {proposal.votesAbstain}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${percentages.for}%` }}
                    />
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${percentages.against}%` }}
                    />
                    <div
                      className="bg-slate-500 transition-all"
                      style={{ width: `${percentages.abstain}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {totalVotes} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </span>
                    {proposal.quorumRequired > 0 && (
                      <span>
                        Quorum: {totalVotes}/{proposal.quorumRequired}
                      </span>
                    )}
                  </div>

                  {/* Vote Buttons */}
                  {proposal.status === 'active' && profile && profile.reputationCredits >= proposal.minReputation && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, 'for')}
                        disabled={voteProposal.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'against')}
                        disabled={voteProposal.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Against
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'abstain')}
                        disabled={voteProposal.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                        Abstain
                      </button>
                    </div>
                  )}

                  {proposal.status === 'active' && profile && profile.reputationCredits < proposal.minReputation && (
                    <p className="text-xs text-yellow-400">
                      Need {proposal.minReputation} RC to vote
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-slate-400">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed hover:border-cyan-400/60 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
