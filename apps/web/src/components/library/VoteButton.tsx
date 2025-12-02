'use client';

import { useState, useCallback } from 'react';
import { api } from '@/trpc/react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface VoteButtonProps {
  resourceId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: 'up' | 'down' | null;
}

/**
 * Optimistic Vote Component for Apex Commons Resource Library
 *
 * Implements instant UI feedback with:
 * - Immediate visual update on click (optimistic)
 * - Server-side sync with rollback on error
 * - Toggle behavior (clicking same vote removes it)
 * - Vote switching support
 * - Reputation credit visual feedback
 */
export function VoteButton({
  resourceId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote = null,
}: VoteButtonProps) {
  // Local state for optimistic UI
  const [votes, setVotes] = useState({ up: initialUpvotes, down: initialDownvotes });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [isAnimating, setIsAnimating] = useState<'up' | 'down' | null>(null);

  const utils = api.useUtils();

  const mutation = api.apexCommons.voteResource.useMutation({
    onMutate: async ({ voteType }) => {
      // 1. Cancel any outgoing refetches to avoid overwriting optimistic update
      await utils.apexCommons.getResource.cancel({ id: resourceId });
      await utils.apexCommons.getUserVote.cancel({ resourceId });

      // 2. Snapshot previous values for rollback
      const previousVotes = { ...votes };
      const previousUserVote = userVote;

      // 3. Optimistically update local state
      const isRemoving = userVote === voteType;
      const isSwitching = userVote !== null && userVote !== voteType;

      if (isRemoving) {
        // Removing existing vote
        setUserVote(null);
        setVotes((prev) => ({
          ...prev,
          [voteType]: Math.max(0, prev[voteType] - 1),
        }));
      } else if (isSwitching) {
        // Switching from one vote to another
        setUserVote(voteType);
        setVotes((prev) => ({
          up: voteType === 'up' ? prev.up + 1 : Math.max(0, prev.up - 1),
          down: voteType === 'down' ? prev.down + 1 : Math.max(0, prev.down - 1),
        }));
      } else {
        // New vote
        setUserVote(voteType);
        setVotes((prev) => ({
          ...prev,
          [voteType]: prev[voteType] + 1,
        }));
      }

      // Trigger animation
      setIsAnimating(voteType);
      setTimeout(() => setIsAnimating(null), 300);

      // Return context for rollback
      return { previousVotes, previousUserVote };
    },
    onError: (err, _variables, context) => {
      // Rollback to previous state on error
      if (context) {
        setVotes(context.previousVotes);
        setUserVote(context.previousUserVote);
      }
      console.error('Vote failed:', err.message);
    },
    onSettled: () => {
      // Sync with server truth after mutation settles
      utils.apexCommons.getResource.invalidate({ id: resourceId });
      utils.apexCommons.getUserVote.invalidate({ resourceId });
    },
  });

  const handleVote = useCallback((type: 'up' | 'down') => {
    if (mutation.isPending) return;
    mutation.mutate({ resourceId, voteType: type });
  }, [mutation, resourceId]);

  const netScore = votes.up - votes.down;
  const scoreColor = netScore > 0 ? 'text-green-400' : netScore < 0 ? 'text-red-400' : 'text-white';

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-slate-900/70 border border-cyan-500/20 backdrop-blur-sm">
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('up')}
        disabled={mutation.isPending}
        aria-label="Upvote resource"
        className={`
          group relative flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200
          ${userVote === 'up'
            ? 'bg-green-500/30 text-green-400 shadow-lg shadow-green-500/20'
            : 'bg-slate-800/50 text-slate-400 hover:bg-green-500/20 hover:text-green-400'
          }
          ${isAnimating === 'up' ? 'scale-110' : 'scale-100'}
          ${mutation.isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <ThumbsUp
          className={`w-6 h-6 transition-transform duration-200 ${isAnimating === 'up' ? 'scale-125' : ''}`}
        />
        <span className="text-sm font-bold">{votes.up}</span>

        {/* RC Award indicator */}
        {userVote === 'up' && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 items-center justify-center text-[8px] text-white font-bold">+</span>
          </span>
        )}
      </button>

      {/* Net Score Display */}
      <div className="flex flex-col items-center">
        <span className={`text-2xl font-black ${scoreColor} transition-colors duration-200`}>
          {netScore >= 0 ? '+' : ''}{netScore}
        </span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('down')}
        disabled={mutation.isPending}
        aria-label="Downvote resource"
        className={`
          group relative flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-200
          ${userVote === 'down'
            ? 'bg-red-500/30 text-red-400 shadow-lg shadow-red-500/20'
            : 'bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
          }
          ${isAnimating === 'down' ? 'scale-110' : 'scale-100'}
          ${mutation.isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <ThumbsDown
          className={`w-6 h-6 transition-transform duration-200 ${isAnimating === 'down' ? 'scale-125' : ''}`}
        />
        <span className="text-sm font-bold">{votes.down}</span>
      </button>

      {/* Mutation status indicator */}
      {mutation.isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
