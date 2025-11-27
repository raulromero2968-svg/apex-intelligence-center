'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoEmbedProps {
  videoId: string;
  platform: 'youtube' | 'vimeo';
  title: string;
  thumbnail?: string;
}

export function VideoEmbed({ videoId, platform, title, thumbnail }: VideoEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const getEmbedUrl = () => {
    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
      default:
        return '';
    }
  };

  const getThumbnailUrl = () => {
    if (thumbnail) return thumbnail;

    switch (platform) {
      case 'youtube':
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      case 'vimeo':
        return '/images/video-placeholder.jpg'; // Vimeo requires API call for thumbnail
      default:
        return '/images/video-placeholder.jpg';
    }
  };

  if (!isLoaded) {
    return (
      <div
        className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer group border border-gray-800 hover:border-cyan-500/50 transition-all"
        onClick={() => setIsLoaded(true)}
      >
        {/* Thumbnail */}
        <img
          src={getThumbnailUrl()}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-20 h-20 bg-cyan-600 group-hover:bg-cyan-500 rounded-full flex items-center justify-center transition-all transform group-hover:scale-110 shadow-[0_0_30px_rgba(34,211,238,0.5)]">
            <Play size={32} className="text-black ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-semibold">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-800">
      <iframe
        src={getEmbedUrl()}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
