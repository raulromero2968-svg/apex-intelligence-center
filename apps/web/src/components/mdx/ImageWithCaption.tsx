import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

interface ImageWithCaptionProps {
  src: string;
  alt: string;
  caption: string;
  sourceUrl: string;
}

export default function ImageWithCaption({
  src,
  alt,
  caption,
  sourceUrl
}: ImageWithCaptionProps) {
  return (
    <figure className="my-8">
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-cyan-500/20">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      </div>
      <figcaption className="mt-3 text-sm text-white/60">
        <p className="mb-1">{caption}</p>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Source</span>
        </a>
      </figcaption>
    </figure>
  );
}

