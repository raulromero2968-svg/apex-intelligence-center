'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import {
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
} from 'lucide-react';
import { VoteButton } from './VoteButton';

interface ResourceDetailProps {
  resourceId: string;
}

const contributorLevelColors: Record<string, string> = {
  bronze: 'text-orange-400',
  silver: 'text-slate-300',
  gold: 'text-yellow-400',
  platinum: 'text-cyan-400',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function ResourceDetail({ resourceId }: ResourceDetailProps) {
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const { data: resource, isLoading, error } = api.apexCommons.getResource.useQuery({ id: resourceId });
  const { data: userVote } = api.apexCommons.getUserVote.useQuery({ resourceId });
  const trackView = api.apexCommons.trackView.useMutation();
  const trackDownload = api.apexCommons.trackDownload.useMutation();

  // Track view on mount
  useEffect(() => {
    if (!hasTrackedView && resource) {
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('session_id') || crypto.randomUUID() : undefined;
      if (sessionId && typeof window !== 'undefined') {
        sessionStorage.setItem('session_id', sessionId);
      }
      trackView.mutate({ resourceId, sessionId });
      setHasTrackedView(true);
    }
  }, [resource, hasTrackedView, resourceId, trackView]);

  const handleDownload = async (file: { url: string; name: string }) => {
    try {
      await trackDownload.mutateAsync({ resourceId });
      window.open(file.url, '_blank');
    } catch (error) {
      console.error('Download tracking failed:', error);
      // Still open the file even if tracking fails
      window.open(file.url, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: resource?.title,
        text: resource?.description,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading resource...</span>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">Resource not found</p>
        <Link href="/library" className="text-cyan-400 hover:text-cyan-300">
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
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300"
                    >
                      {tag}
                    </span>
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
              <h2 className="text-lg font-bold text-white mb-4">Files</h2>
              <div className="space-y-3">
                {resource.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
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
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Community Rating - Optimistic Vote Component */}
          <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 text-center">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Community Rating
            </h3>
            <div className="flex justify-center mb-6">
              <VoteButton
                resourceId={resourceId}
                initialUpvotes={resource.upvotes}
                initialDownvotes={resource.downvotes}
                initialUserVote={userVote ?? undefined}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Download className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-white">{resource.downloads}</p>
                <p className="text-xs text-slate-500">Downloads</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Eye className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold text-white">{resource.views}</p>
                <p className="text-xs text-slate-500">Views</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-cyan-500/30 space-y-3">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Resource
            </button>
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Report Issue
            </button>
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
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{resource.contributor.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className={`w-4 h-4 ${contributorLevelColors[resource.contributor.contributorLevel]}`} />
                    <span className={contributorLevelColors[resource.contributor.contributorLevel]}>
                      {resource.contributor.contributorLevel.charAt(0).toUpperCase() + resource.contributor.contributorLevel.slice(1)}
                    </span>
                    {resource.contributor.isVerifiedTeacher && (
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
              <Link
                href={`/library/contributor/${resource.contributor.id}`}
                className="block mt-4 text-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View Profile
              </Link>
            </div>
          )}

          {/* License */}
          <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 mb-2">License</h3>
            <p className="text-white">{resource.license}</p>
            <a
              href={`https://creativecommons.org/licenses/${resource.license.toLowerCase()}/4.0/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-2"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
