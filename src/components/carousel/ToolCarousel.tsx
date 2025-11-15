'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import HolographicIcon from '@/components/icons/HolographicIcon';
import { IconId } from '@/lib/iconMap';

interface Tool {
  id: string;
  name: string;
  description: string;
  iconId: IconId;
  href: string;
}

interface ToolCarouselProps {
  tools: Tool[];
}

export default function ToolCarousel({ tools }: ToolCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update scroll button states
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Collector Tools"
      className="relative w-full"
    >
      {/* Carousel Container */}
      <div className="relative">
        {/* Viewport */}
        <div
          ref={emblaRef}
          className="overflow-hidden cursor-grab active:cursor-grabbing"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-live="polite"
        >
          <div
            className="flex gap-4"
            style={{ willChange: 'transform' }}
          >
            {tools.map((tool) => (
              <motion.div
                key={tool.id}
                className="flex-[0_0_80%] md:flex-[0_0_50%] lg:flex-[0_0_33%] snap-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <a
                  href={tool.href}
                  className="block h-full bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-ink"
                >
                  <div className="flex flex-col items-center text-center">
                    <HolographicIcon
                      id={tool.iconId}
                      alt={tool.name}
                      size={80}
                    />
                    <h3 className="text-xl font-semibold text-white mt-4 mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-white/70">{tool.description}</p>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Previous Button */}
        <button
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          aria-label="Previous tools"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-cyan-400 text-ink flex items-center justify-center shadow-lg shadow-cyan-400/50 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/70 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-ink"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={scrollNext}
          disabled={!canScrollNext}
          aria-label="Next tools"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-cyan-400 text-ink flex items-center justify-center shadow-lg shadow-cyan-400/50 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/70 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-ink"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Dots Navigation */}
      <div
        role="tablist"
        aria-label="Carousel navigation"
        className="flex justify-center gap-2 mt-6"
      >
        {tools.map((_, index) => {
          const isActive = index === selectedIndex;
          return (
            <button
              key={index}
              role="tab"
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={isActive}
              onClick={() => scrollTo(index)}
              className={`
                rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-ink
                ${isActive
                  ? 'w-8 h-2 bg-cyan-400 shadow-lg shadow-cyan-400/50'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50 hover:scale-125'
                }
              `}
            />
          );
        })}
      </div>
    </section>
  );
}
