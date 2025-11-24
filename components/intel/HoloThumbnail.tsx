'use client';

export function HoloThumbnail({ category }: { category: string }) {
  // Define styles based on category (The "Racecar" aesthetic)
  const styles: Record<string, string> = {
    "Research": "from-purple-600 via-indigo-500 to-blue-900",
    "Vintage Analysis": "from-amber-500 via-orange-600 to-red-900", // Gold/Heat for Vintage
    "Strategy": "from-emerald-500 via-teal-600 to-cyan-900", // Matrix Green for Strategy
    "Set Analysis": "from-pink-500 via-rose-600 to-purple-900", // Neon for Sets
    "Blog": "from-blue-500 via-cyan-500 to-slate-900",
    "Intel": "from-cyan-400 via-blue-500 to-indigo-900"
  };

  const gradient = styles[category] || styles["Blog"];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      {/* 1. Base Gradient (The Atmosphere) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40`} />

      {/* 2. The Grid (Technical Layer) */}
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}
      />

      {/* 3. The Abstract Shape (The "Subject") */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/30 rotate-45 backdrop-blur-sm" />

      {/* 4. Holographic Foil Overlay (The Shine) */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-50"
        style={{
          background: 'linear-gradient(125deg, transparent 30%, rgba(255,255,255,0.8) 45%, transparent 60%)',
          backgroundSize: '200% 200%',
          animation: 'holo-shift 3s infinite linear'
        }}
      />

      {/* 5. Category Label (HUD Style) */}
      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[8px] font-mono uppercase text-white/80">
        IMG_GEN // {category.toUpperCase()}
      </div>
    </div>
  );
}
