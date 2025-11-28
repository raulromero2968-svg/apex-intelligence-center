'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  subtitle?: string;
}

export function ShareButtons({ title, subtitle }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: subtitle || title,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-400/50 transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        title="Copy link to clipboard"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className="text-[10px] tracking-wider">
          {copied ? 'COPIED!' : 'COPY_LINK'}
        </span>
      </button>
      
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-400 hover:bg-purple-950/60 hover:border-purple-400/50 transition-all hover:shadow-[0_0_10px_rgba(168,85,247,0.3)]"
          title="Share this essay"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-[10px] tracking-wider">SHARE</span>
        </button>
      )}
    </div>
  );
}
