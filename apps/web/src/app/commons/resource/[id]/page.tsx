'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock,
  BookOpen,
  FileText,
  Tag,
  GraduationCap,
  Share2,
  Flag,
  BookmarkPlus,
} from 'lucide-react';
import { HoloCard } from '@/components/ui/HoloCard';
import { trpc } from '@/lib/trpc';

const SUBJECTS: Record<string, string> = {
  math: 'Mathematics',
  science: 'Science',
  english: 'English',
  history: 'History',
  art: 'Art',
  pe: 'Physical Education',
  other: 'Other',
};

const GRADE_LEVELS: Record<string, string> = {
  elementary: 'Elementary',
  middle: 'Middle School',
  high: 'High School',
  college: 'College',
  professional: 'Professional',
};

const CATEGORIES: Record<string, string> = {
  lessonPlan: 'Lesson Plan',
  worksheet: 'Worksheet',
  assessment: 'Assessment',
  activity: 'Activity',
  other: 'Other',
};

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.id as string;

  const { data: resource, isLoading, error } = trpc.commons.resource.getById.useQuery(
    { id: resourceId },
    { enabled: !!resourceId }
  );

  const { data: relatedResources } = trpc.commons.resource.getRelated.useQuery(
    { resourceId, limit: 4 },
    { enabled: !!resourceId }
  );

  const incrementViewMutation = trpc.commons.resource.incrementView.useMutation();
  const voteMutation = trpc.commons.resource.vote.useMutation();
  const downloadMutation = trpc.commons.resource.trackDownload.useMutation();

  // Increment view count on mount
  useEffect(() => {
    if (resourceId) {
      incrementViewMutation.mutate({ id: resourceId });
    }
  }, [resourceId]);

  const handleVote = async (value: '1' | '-1') => {
    try {
      await voteMutation.mutateAsync({ resourceId, value });
    } catch (err: any) {
      if (err.message?.includes('Authentication required')) {
        router.push('/login?redirect=' + encodeURIComponent(`/commons/resource/${resourceId}`));
      }
    }
  };

  const handleDownload = async (fileIndex: number) => {
    try {
      const result = await downloadMutation.mutateAsync({ id: resourceId, fileIndex });
      window.open(result.url, '_blank');
    } catch (err: any) {
      if (err.message?.includes('Authentication required')) {
        router.push('/login?redirect=' + encodeURIComponent(`/commons/resource/${resourceId}`));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-slate-800 rounded" />
            <div className="h-12 w-3/4 bg-slate-800 rounded" />
            <div className="h-64 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6 md:px-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Resource Not Found</h2>
          <p className="text-slate-400 mb-6">This resource may have been removed or doesn't exist.</p>
          <Link
            href="/commons/browse"
            className="text-purple-400 hover:text-purple-300"
          >
            Browse all resources
          </Link>
        </div>
      </div>
    );
  }

  const files = resource.files as { name: string; url: string; type: string; size: number }[];
  const tags = resource.tags as string[];
  const standards = resource.standards as string[];
  const netVotes = resource.upvotes - resource.downvotes;

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Back Navigation */}
      <div className="px-6 md:px-12 mb-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/commons/browse"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {SUBJECTS[resource.subject] || resource.subject}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {GRADE_LEVELS[resource.gradeLevel] || resource.gradeLevel}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-400 border border-slate-600">
                    {CATEGORIES[resource.category] || resource.category}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {resource.title}
                </h1>

                <p className="text-lg text-slate-400 leading-relaxed">
                  {resource.description}
                </p>
              </div>

              {/* Thumbnail */}
              {resource.thumbnailUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Files Section */}
              <HoloCard>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Files
                </h2>
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-slate-400">
                            {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(index)}
                        disabled={downloadMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-all disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </HoloCard>

              {/* Tags & Standards */}
              {(tags.length > 0 || standards.length > 0) && (
                <HoloCard>
                  {tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-400" />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/commons/browse?q=${encodeURIComponent(tag)}`}
                            className="px-3 py-1 rounded-full text-sm bg-slate-800 text-slate-300 border border-slate-700 hover:border-purple-500/50 transition-colors"
                          >
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {standards.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-cyan-400" />
                        Education Standards
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {standards.map((standard) => (
                          <span
                            key={standard}
                            className="px-3 py-1 rounded-full text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                          >
                            {standard}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </HoloCard>
              )}

              {/* Related Resources */}
              {relatedResources && relatedResources.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Related Resources</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {relatedResources.map((related) => (
                      <Link
                        key={related.id}
                        href={`/commons/resource/${related.id}`}
                        className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                            {SUBJECTS[related.subject]}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white line-clamp-2">{related.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{related.viewCount.toLocaleString()} views</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <HoloCard>
                <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Eye className="w-4 h-4" />
                      <span>Views</span>
                    </div>
                    <span className="font-semibold text-white">{resource.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Download className="w-4 h-4" />
                      <span>Downloads</span>
                    </div>
                    <span className="font-semibold text-white">{resource.downloadCount.toLocaleString()}</span>
                  </div>
                  {resource.duration && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span>Duration</span>
                      </div>
                      <span className="font-semibold text-white">{resource.duration} min</span>
                    </div>
                  )}
                </div>

                {/* Voting */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-3">Was this resource helpful?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote('1')}
                      disabled={voteMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{resource.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleVote('-1')}
                      disabled={voteMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{resource.downvotes}</span>
                    </button>
                  </div>
                </div>
              </HoloCard>

              {/* Actions Card */}
              <HoloCard>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                    <BookmarkPlus className="w-4 h-4" />
                    Save to Collection
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                    <Flag className="w-4 h-4" />
                    Report Issue
                  </button>
                </div>
              </HoloCard>

              {/* Contributor Info */}
              {resource.contributor && (
                <HoloCard>
                  <h3 className="text-lg font-semibold text-white mb-3">Contributor</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-400">
                        {resource.contributor.name?.[0]?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{resource.contributor.name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-400">Educator</p>
                    </div>
                  </div>
                </HoloCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
