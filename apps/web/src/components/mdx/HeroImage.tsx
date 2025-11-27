import Image from 'next/image';

interface HeroImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function HeroImage({ src, alt, caption }: HeroImageProps) {
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
      {caption && (
        <figcaption className="text-center text-sm text-white/60 mt-3">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

