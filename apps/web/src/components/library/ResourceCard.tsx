'use client';

import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Download, Eye, Clock, BookOpen, Video, FileText, Presentation, FileQuestion, Award } from 'lucide-react';

// Contributor level configuration
const CONTRIBUTOR_LEVELS = {
  platinum: {
    color: 'bg-purple-400',
    glow: 'shadow-purple-400/50',
    label: 'Platinum',
    textColor: 'text-purple-400',
  },
  gold: {
    color: 'bg-yellow-400',
    glow: 'shadow-yellow-400/50',
    label: 'Gold',
    textColor: 'text-yellow-400',
  },
  silver: {
    color: 'bg-slate-300',
    glow: 'shadow-slate-300/50',
    label: 'Silver',
    textColor: 'text-slate-300',
  },
  bronze: {
    color: 'bg-amber-600',
    glow: 'shadow-amber-600/50',
    label: 'Bronze',
    textColor: 'text-amber-600',
  },
} as const;

type ContributorLevel = keyof typeof CONTRIBUTOR_LEVELS;

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    description: string;
    category: string;
    subject?: string | null;
    gradeLevel?: string | null;
    resourceType: string;
    thumbnailUrl?: string | null;
    upvotes: number;
    downvotes: number;
    downloads: number;
    views: number;
    tags?: string[] | null;
    estimatedDuration?: number | null;
    difficulty?: string | null;
    publishedAt?: Date | null;
    // Optional contributor info (when available from API)
    contributor?: {
      id?: string;
      name?: string;
      level?: ContributorLevel;
      isVerifiedTeacher?: boolean;
    } | null;
  };
}

const resourceTypeIcons: Record<string, React.ReactNode> = {
  lesson_plan: <BookOpen className="w-4 h-4" />,
  worksheet: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  article: <FileText className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
  assessment: <FileText className="w-4 h-4" />,
  template: <FileText className="w-4 h-4" />,
  other: <FileQuestion className="w-4 h-4" />,
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const typeIcon = resourceTypeIcons[resource.resourceType] || resourceTypeIcons.other;
  const difficultyClass = resource.difficulty
    ? difficultyColors[resource.difficulty] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    : null;

  return (
    <Link
      href={`/library/resource/${resource.id}`}
      className="group relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Thumbnail */}
      {resource.thumbnailUrl ? (
        <div className="relative w-full h-40 overflow-hidden border-b border-cyan-900/30">
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
        </div>
      ) : (
        <div className="relative w-full h-40 overflow-hidden border-b border-cyan-900/30 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 flex items-center justify-center">
          <div className="text-cyan-500/40">
            {typeIcon}
          </div>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Type and Category badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-sans">
            {typeIcon}
            {resource.resourceType.replace('_', ' ')}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 font-sans">
            {resource.category}
          </span>
          {resource.difficulty && (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border font-sans ${difficultyClass}`}>
              {resource.difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-2 mb-3 flex-1">
          {resource.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
          {resource.subject && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {resource.subject}
            </span>
          )}
          {resource.gradeLevel && (
            <span>{resource.gradeLevel}</span>
          )}
          {resource.estimatedDuration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {resource.estimatedDuration} min
            </span>
          )}
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-slate-500">
                +{resource.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Contributor Info (when available) */}
        {resource.contributor && (
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
            {resource.contributor.level && (
              <div
                className={`h-2 w-2 rounded-full ${CONTRIBUTOR_LEVELS[resource.contributor.level].color} shadow-sm ${CONTRIBUTOR_LEVELS[resource.contributor.level].glow}`}
                title={`${CONTRIBUTOR_LEVELS[resource.contributor.level].label} Contributor`}
              />
            )}
            <span className={resource.contributor.level ? CONTRIBUTOR_LEVELS[resource.contributor.level].textColor : ''}>
              {resource.contributor.name || 'Anonymous'}
            </span>
            {resource.contributor.isVerifiedTeacher && (
              <Award className="w-3 h-3 text-cyan-400" title="Verified Teacher" />
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-400">
              <ThumbsUp className="w-3 h-3" />
              {resource.upvotes}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <ThumbsDown className="w-3 h-3" />
              {resource.downvotes}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {resource.downloads}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {resource.views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
