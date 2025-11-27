'use client';

type Props = {
  children: React.ReactNode[];
  cardWidth?: number; // px; controls scroll step
};

export default function HorizontalCarousel({ children, cardWidth = 320 }: Props) {

  return (
    <div className="relative">
      <div
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 cursor-grab active:cursor-grabbing"
        style={{ scrollPadding: '1rem' }}
      >
        {children.map((child, i) => (
          <div key={i} className="snap-start shrink-0" style={{ width: cardWidth }}>
            {child}
          </div>
        ))}
      </div>

      {/* Arrow buttons removed - grab-scroll only */}
    </div>
  );
}

