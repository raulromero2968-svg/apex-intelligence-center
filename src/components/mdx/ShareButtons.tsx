'use client';

import { useState } from 'react';
import { Link2, Share2, Check } from 'lucide-react';

export default function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareOnX = () => {
    const url = window.location.href;
    const title = document.title;
    const tweetText = encodeURIComponent(`${title}\n\n${url}`);
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}`,
      '_blank',
      'width=550,height=420'
    );
  };

  return (
    <div className="my-8 flex items-center gap-3">
      <span className="text-sm text-white/60">Share this article:</span>
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/30 bg-black/40 text-white/80 hover:bg-black/60 hover:border-cyan-400/60 transition-all"
          aria-label="Copy link to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span className="text-sm">Copy Link</span>
            </>
          )}
        </button>
        <button
          onClick={handleShareOnX}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/30 bg-black/40 text-white/80 hover:bg-black/60 hover:border-cyan-400/60 transition-all"
          aria-label="Share on X (Twitter)"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share on X</span>
        </button>
      </div>
    </div>
  );
}
