// components/ContentCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { hrefForItem, ContentItem } from '@/lib/routeMap';
import { BookOpen, Clock } from 'lucide-react';

type Props = ContentItem & {
  title: string;
  excerpt?: string;
  dateISO?: string;
  badge?: string; // e.g. "Blog", "Research", "Intel"
  imageUrl?: string; // Hero image for Perplexity-style cards
  sources?: number; // Number of sources cited (like "59 sources")
  readTime?: number; // Read time in minutes
};

export default function ContentCard(props: Props) {
  const href = hrefForItem(props);
  
  // Format date to readable format
  const formattedDate = props.dateISO 
    ? new Date(props.dateISO).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null;

  return (
    <Link 
      href={href} 
      className="block group rounded-xl border border-cyan-500/20 overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 bg-black/40 backdrop-blur-sm"
    >
      {/* Hero Image - Perplexity Style */}
      {props.imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={props.imageUrl}
            alt={props.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Badge overlay on image */}
          {props.badge && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/90 text-black backdrop-blur-sm">
              {props.badge}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Badge if no image */}
        {!props.imageUrl && props.badge && (
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {props.badge}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
          {props.title}
        </h3>

        {/* Excerpt */}
        {props.excerpt && (
          <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">
            {props.excerpt}
          </p>
        )}

        {/* Meta information - Google Scholar / Perplexity style */}
        <div className="flex items-center gap-4 text-xs text-white/50 pt-2 border-t border-white/10">
          {/* Sources badge (like Perplexity) */}
          {props.sources && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{props.sources} sources</span>
            </div>
          )}

          {/* Read time */}
          {props.readTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{props.readTime} min read</span>
            </div>
          )}

          {/* Published date */}
          {formattedDate && (
            <div className="flex items-center gap-1.5 ml-auto">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <time dateTime={props.dateISO}>
                {formattedDate}
              </time>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

