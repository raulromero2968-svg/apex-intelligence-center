'use client';

import { useRef } from 'react';

type Props = {
  children: React.ReactNode[];
  cardWidth?: number; // px; controls scroll step
};

export default function HorizontalCarousel({ children, cardWidth = 320 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const by = (dir: 1 | -1) => () => {
    const el = ref.current;
    if (!el) return;
    const step = cardWidth + 16; // width + gap
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2"
        style={{ scrollPadding: '1rem' }}
      >
        {children.map((child, i) => (
          <div key={i} className="snap-start shrink-0" style={{ width: cardWidth }}>
            {child}
          </div>
        ))}
      </div>

      <button
        aria-label="Scroll left"
        onClick={by(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-white/20 px-3 py-2 backdrop-blur bg-black/40 hover:bg-black/60"
      >
        ‹
      </button>
      <button
        aria-label="Scroll right"
        onClick={by(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-white/20 px-3 py-2 backdrop-blur bg-black/40 hover:bg-black/60"
      >
        ›
      </button>
    </div>
  );
}
