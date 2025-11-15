'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HolographicIcon } from '@/components/icons/HolographicIcon';
import { TOOL_ICONS } from '@/utils/iconMap';

const tools = [
  { id: 'portfolio-tracker', name: 'Portfolio Tracker', description: 'Track your collection value in real-time' },
  { id: 'trade-calculator', name: 'Trade Calculator', description: 'Evaluate trade fairness instantly' },
  { id: 'grading-optimizer', name: 'Grading Optimizer', description: 'Maximize ROI on grading submissions' },
  { id: 'bulk-analyzer', name: 'Bulk Analyzer', description: 'Analyze bulk deals for hidden value' },
  { id: 'reprint-predictor', name: 'Reprint Predictor', description: 'Predict reprint probability and timing' },
  { id: 'sealed-analyzer', name: 'Sealed Analyzer', description: 'Analyze sealed product investment opportunities' },
  { id: 'tax-dashboard', name: 'Tax Dashboard', description: 'Comprehensive tax reporting and planning' },
];

export const ToolCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
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

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing">
        <div className="flex gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="flex-[0_0_calc(33.333%-1rem)] min-w-0 md:flex-[0_0_calc(50%-0.75rem)] lg:flex-[0_0_calc(33.333%-1rem)]"
            >
              <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500 transition-all h-full">
                <HolographicIcon
                  src={TOOL_ICONS[tool.id as keyof typeof TOOL_ICONS]}
                  alt={`${tool.name} icon`}
                  size={64}
                  className="mb-4 mx-auto"
                />
                <h3 className="text-xl font-bold mb-2 text-center">{tool.name}</h3>
                <p className="text-gray-400 text-center text-sm">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous tool"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={scrollNext}
        disabled={!canScrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:bg-white/20 hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next tool"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};

export default ToolCarousel;
