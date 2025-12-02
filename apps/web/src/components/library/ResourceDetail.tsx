'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ThumbsUp,
  ThumbsDown,
  Download,
  Eye,
  Clock,
  BookOpen,
  User,
  Calendar,
  Tag,
  ArrowLeft,
  Share2,
  Flag,
  Loader2,
  CheckCircle,
  FileText,
  Video,
  Presentation,
  ExternalLink,
  Award,
  AlertTriangle,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ResourceDetailProps {
  resourceId: string;
}

const contributorLevelColors: Record<string, string> = {
  bronze: 'text-amber-600',
  silver: 'text-slate-300',
  gold: 'text-yellow-400',
  platinum: 'text-purple-400',
};

const contributorLevelBg: Record<string, string> = {
  bronze: 'bg-amber-600',
  silver: 'bg-slate-300',
  gold: 'bg-yellow-400',
  platinum: 'bg-purple-400',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// Toast notification component
function Toast({
  message,
  type,
  onClose
}: {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500/20 border-green-500/30'
    : type === 'error' ? 'bg-red-500/20 border-red-500/30'
    : 'bg-cyan-500/20 border-cyan-500/30';

  const textColor = type === 'success' ? 'text-green-400'
    : type === 'error' ? 'text-red-400'
    : 'text-cyan-400';

  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor} backdrop-blur-sm animate-slide-in`}>
      {type === 'success' && <CheckCircle className={`w-5 h-5 ${textColor}`} />}
      {type === 'error' && <AlertTriangle className={`w-5 h-5 ${textColor}`} />}
      {type === 'info' && <Sparkles className={`w-5 h-5 ${textColor}`} />}
      <span className={textColor}>{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Flag Resource Modal
function FlagModal({
  resourceId,
  onClose,
  onSuccess
}: {
  resourceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('');
  const [reasonCode, setReasonCode] = useState<string>('');
  const flagResource = api.apexCommons.flagResource.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonCode || !reason) return;

    flagResource.mutate({
      resourceId,
      reason,
      reasonCode: reasonCode as 'spam' | 'inappropriate' | 'copyright' | 'misinformation' | 'low_quality' | 'other',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" />
            Report Resource
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Reason for Report
            </label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:border-red-500 focus:outline-none"
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam or Advertising</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="copyright">Copyright Violation</option>
              <option value="misinformation">Misinformation</option>
              <option value="low_quality">Low Quality</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Details
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={10}
              rows={4}
              placeholder="Please provide specific details about the issue..."
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={flagResource.isLoading || !reasonCode || reason.length < 10}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {flagResource.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Flag className="w-4 h-4" />
              )}
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Related Resources Component
function RelatedResources({
  resourceId,
  category,
  subject
}: {
  resourceId: string;
  category: string;
  subject?: string | null;
}) {
  const { data, isLoading } = api.apexCommons.listResources.useQuery({
    filters: { category },
    pagination: { page: 1, limit: 4 },
    sort: 'popular',
  });

  // Filter out current resource
  const relatedResources = data?.resources.filter(r => r.id !== resourceId).slice(0, 3);

  if (isLoading || !relatedResources || relatedResources.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Related Resources
        </h3>
        <Link
          href={`/browse?category=${encodeURIComponent(category)}`}
          className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {relatedResources.map((resource) => (
          <Link
            key={resource.id}
            href={`/library/resource/${resource.id}`}
            className="block p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors group"
          >
            <h4 className="font-medium text-white group-hover:text-cyan-400 line-clamp-1 transition-colors">
              {resource.title}
            </h4>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {resource.upvotes}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                {resource.downloads}
              </span>
              <span className="text-purple-400">{resource.resourceType.replace('_', ' ')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ResourceDetail({ resourceId }: ResourceDetailProps) {
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const queryClient = useQueryClient();
  const utils = api.useUtils();

  const { data: resource, isLoading, error } = api.apexCommons.getResource.useQuery(
    { id: resourceId },
    { refetchOnWindowFocus: false }
  );

  const { data: userVote, refetch: refetchVote } = api.apexCommons.getUserVote.useQuery(
    { resourceId },
    { enabled: !!resource }
  );

  const trackView = api.apexCommons.trackView.useMutation();
  const trackDownload = api.apexCommons.trackDownload.useMutation();

  const vote = api.apexCommons.voteResource.useMutation({
    onMutate: async ({ voteType }) => {
      setIsVoting(true);
      // Cancel outgoing refetches
      await utils.apexCommons.getResource.cancel({ id: resourceId });

      // Snapshot previous value
      const previousResource = utils.apexCommons.getResource.getData({ id: resourceId });

      // Optimistically update
      if (previousResource) {
        const isRemovingVote = userVote === voteType;
        const isChangingVote = userVote && userVote !== voteType;

        utils.apexCommons.getResource.setData({ id: resourceId }, {
          ...previousResource,
          upvotes: previousResource.upvotes + (
            voteType === 'up'
              ? (isRemovingVote ? -1 : isChangingVote ? 1 : 1)
              : (isChangingVote ? -1 : 0)
          ),
          downvotes: previousResource.downvotes + (
            voteType === 'down'
              ? (isRemovingVote ? -1 : isChangingVote ? 1 : 1)
              : (isChangingVote ? -1 : 0)
          ),
        });
      }

      return { previousResource };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousResource) {
        utils.apexCommons.getResource.setData({ id: resourceId }, context.previousResource);
      }
      setToast({ message: 'Failed to vote. Please try again.', type: 'error' });
    },
    onSuccess: (data) => {
      // Show appropriate toast
      if (data.action === 'added') {
        setToast({
          message: data.voteType === 'up' ? 'Thanks for your upvote!' : 'Vote recorded',
          type: data.voteType === 'up' ? 'success' : 'info'
        });
      } else if (data.action === 'removed') {
        setToast({ message: 'Vote removed', type: 'info' });
      } else if (data.action === 'changed') {
        setToast({ message: 'Vote updated', type: 'info' });
      }
    },
    onSettled: () => {
      setIsVoting(false);
      // Refetch to ensure consistency
      utils.apexCommons.getResource.invalidate({ id: resourceId });
      refetchVote();
    },
  });

  // Track view on mount
  useEffect(() => {
    if (!hasTrackedView && resource) {
      const sessionId = typeof window !== 'undefined'
        ? sessionStorage.getItem('apex_session_id') || crypto.randomUUID()
        : undefined;

      if (sessionId && typeof window !== 'undefined') {
        sessionStorage.setItem('apex_session_id', sessionId);
      }

      trackView.mutate({ resourceId, sessionId });
      setHasTrackedView(true);
    }
  }, [resource, hasTrackedView, resourceId, trackView]);

  const handleVote = useCallback(async (voteType: 'up' | 'down') => {
    if (isVoting) return;

    try {
      await vote.mutateAsync({ resourceId, voteType });
    } catch (error) {
      // Error handled in onError
    }
  }, [resourceId, vote, isVoting]);

  const handleDownload = useCallback(async (file: { url: string; name: string }) => {
    try {
      await trackDownload.mutateAsync({ resourceId });
      setToast({ message: 'Download started!', type: 'success' });

      // Refresh resource to show updated download count
      utils.apexCommons.getResource.invalidate({ id: resourceId });

      window.open(file.url, '_blank');
    } catch (error) {
      // Still open the file even if tracking fails
      window.open(file.url, '_blank');
      setToast({ message: 'Download started (tracking failed)', type: 'info' });
    }
  }, [resourceId, trackDownload, utils]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: resource?.title,
          text: resource?.description,
          url: window.location.href,
        });
        setToast({ message: 'Shared successfully!', type: 'success' });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast({ message: 'Link copied to clipboard!', type: 'success' });
      }
    } catch (error) {
      // User cancelled share or error
    }
  }, [resource]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Skeleton Loading */}
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/20">
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-20 bg-slate-800 rounded-full animate-pulse" />
                <div className="h-6 w-24 bg-slate-800 rounded-full animate-pulse" />
              </div>
              <div className="h-10 w-3/4 bg-slate-800 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/20">
              <div className="flex justify-center gap-4 mb-6">
                <div className="w-20 h-20 bg-slate-800 rounded-lg animate-pulse" />
                <div className="w-20 h-20 bg-slate-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Resource not found</h2>
        <p className="text-slate-400 mb-6">
          This resource may have been removed or you may not have permission to view it.
        </p>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>
      </div>
    );
  }

  const difficultyClass = resource.difficulty
    ? difficultyColors[resource.difficulty] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <FlagModal
          resourceId={resourceId}
          onClose={() => setShowFlagModal(false)}
          onSuccess={() => setToast({ message: 'Report submitted. Thank you!', type: 'success' })}
        />
      )}

      {/* Back Button */}
      <Link
        href="/library"
        className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Link>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {resource.resourceType.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {resource.category}
              </span>
              {resource.difficulty && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyClass}`}>
                  {resource.difficulty}
                </span>
              )}
              {resource.status === 'approved' && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle className="w-3 h-3" />
                  Approved
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-4">{resource.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-4">
              {resource.subject && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {resource.subject}
                </span>
              )}
              {resource.gradeLevel && (
                <span>{resource.gradeLevel}</span>
              )}
              {resource.estimatedDuration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {resource.estimatedDuration} min
                </span>
              )}
              {resource.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(resource.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {resource.description}
            </p>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/browse?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Standards */}
            {resource.standards && resource.standards.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Standards Alignment</h3>
                <div className="space-y-2">
                  {resource.standards.map((standard, index) => (
                    <div key={index} className="text-sm text-slate-300">
                      <span className="font-medium">{standard.framework}:</span>{' '}
                      {standard.codes.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Files */}
          {resource.files && resource.files.length > 0 && (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                Files ({resource.files.length})
              </h2>
              <div className="space-y-3">
                {resource.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        {file.type.includes('video') ? (
                          <Video className="w-5 h-5 text-cyan-400" />
                        ) : file.type.includes('presentation') ? (
                          <Presentation className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-xs text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/').pop()?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={trackDownload.isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
                    >
                      {trackDownload.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Resources */}
          <RelatedResources
            resourceId={resourceId}
            category={resource.category}
            subject={resource.subject}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30">
            {/* Voting */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => handleVote('up')}
                disabled={isVoting}
                className={`flex flex-col items-center gap-1 p-4 rounded-lg transition-all ${
                  userVote === 'up'
                    ? 'bg-green-500/30 text-green-400 ring-2 ring-green-500/50'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-green-500/20 hover:text-green-400'
                } disabled:opacity-50`}
              >
                {isVoting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ThumbsUp className={`w-6 h-6 ${userVote === 'up' ? 'fill-current' : ''}`} />
                )}
                <span className="text-lg font-bold">{resource.upvotes}</span>
                <span className="text-xs">Helpful</span>
              </button>
              <button
                onClick={() => handleVote('down')}
                disabled={isVoting}
                className={`flex flex-col items-center gap-1 p-4 rounded-lg transition-all ${
                  userVote === 'down'
                    ? 'bg-red-500/30 text-red-400 ring-2 ring-red-500/50'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                } disabled:opacity-50`}
              >
                {isVoting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <ThumbsDown className={`w-6 h-6 ${userVote === 'down' ? 'fill-current' : ''}`} />
                )}
                <span className="text-lg font-bold">{resource.downvotes}</span>
                <span className="text-xs">Not helpful</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-slate-800/30">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Download className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-white">{resource.downloads.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Downloads</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Eye className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-white">{resource.views.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Views</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Resource
              </button>
              <button
                onClick={() => setShowFlagModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report Issue
              </button>
            </div>
          </div>

          {/* Contributor */}
          {resource.contributor && (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-purple-500/30">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Contributor</h3>
              <div className="flex items-center gap-3">
                {resource.contributor.image ? (
                  <img
                    src={resource.contributor.image}
                    alt={resource.contributor.name}
                    className="w-12 h-12 rounded-full ring-2 ring-purple-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">{resource.contributor.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${contributorLevelBg[resource.contributor.contributorLevel]}`} />
                    <span className={contributorLevelColors[resource.contributor.contributorLevel]}>
                      {resource.contributor.contributorLevel.charAt(0).toUpperCase() + resource.contributor.contributorLevel.slice(1)}
                    </span>
                    {resource.contributor.isVerifiedTeacher && (
                      <span className="flex items-center gap-1 text-blue-400" title="Verified Teacher">
                        <CheckCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/library/contributor/${resource.contributor.id}`}
                className="block mt-4 text-center text-sm px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
              >
                View Profile
              </Link>
            </div>
          )}

          {/* License */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 mb-2">License</h3>
            <p className="text-white font-medium">{resource.license}</p>
            <a
              href={`https://creativecommons.org/licenses/${resource.license.toLowerCase().replace('cc-', '').replace('-', '/')}/4.0/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-2"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Quality Score */}
          {resource.qualityScore !== null && resource.qualityScore !== undefined && (
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Quality Score</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    style={{ width: `${resource.qualityScore}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-white">{resource.qualityScore}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
