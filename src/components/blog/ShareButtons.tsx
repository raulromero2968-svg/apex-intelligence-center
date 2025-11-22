'use client';

import { useMemo, useState } from 'react';
import { Copy, LinkIcon, Share2, Twitter, Linkedin } from 'lucide-react';

type ShareButtonsProps = {
  title: string;
  url: string;
};

function buildAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://apex-intelligence.com');

  if (!pathOrUrl.startsWith('/')) {
    return `${siteUrl}/${pathOrUrl}`;
  }

  return `${siteUrl}${pathOrUrl}`;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const absoluteUrl = useMemo(() => buildAbsoluteUrl(url), [url]);
  const shareText = `${title} – via Apex Intelligence`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy link', error);
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, text: shareText, url: absoluteUrl });
    } catch {
      // ignore cancellation
    }
  }

  return (
    <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-500/20 bg-black/40 p-4 text-sm">
      <span className="text-white/60">Share</span>
      <div className="flex flex-wrap gap-2">
        <a
          aria-label="Share on X"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(absoluteUrl)}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white/80 transition hover:border-cyan-400 hover:text-cyan-300"
        >
          <Twitter size={14} />
          X
        </a>
        <a
          aria-label="Share on LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteUrl)}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white/80 transition hover:border-cyan-400 hover:text-cyan-300"
        >
          <Linkedin size={14} />
          LinkedIn
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white/80 transition hover:border-cyan-400 hover:text-cyan-300"
        >
          {copied ? <LinkIcon size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-white/80 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            <Share2 size={14} />
            Share
          </button>
        )}
      </div>
    </section>
  );
}
