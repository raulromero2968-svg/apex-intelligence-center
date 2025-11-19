import Image from 'next/image';
import clsx from 'clsx';

type ImageWithCaptionProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
};

export default function ImageWithCaption({
  src,
  alt,
  caption,
  width = 1200,
  height = 630,
  priority,
  className,
}: ImageWithCaptionProps) {
  if (!src) return null;

  return (
    <figure className={clsx('my-8 space-y-3', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full object-cover"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-white/60">{caption}</figcaption>
      )}
    </figure>
  );
}
