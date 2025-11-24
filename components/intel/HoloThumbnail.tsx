'use client';

export function HoloThumbnail({ category }: { category: string }) {
  // Dynamic Gradients based on Category
  const gradients: Record<string, string> = {
    "Vintage Analysis": "from-amber-600 via-orange-500 to-red-900",
    "Strategy": "from-cyan-500 via-blue-600 to-slate-900",
    "Set Analysis": "from-purple-600 via-pink-500 to-indigo-900",
    "Research": "from-emerald-500 via-teal-600 to-cyan-900",
    "Blog": "from-slate-700 via-slate-600 to-slate-900"
  };

  const bg = gradients[category] || gradients["Blog"];

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
      {/* Base Nebula */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-40`} />

      {/* Tech Grid Overlay */}
      <div className="absolute inset-0 opacity-30"
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />

      {/* Holographic Shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/40 rotate-45" />

      {/* Foil Shine Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[spin_4s_linear_infinite] opacity-30 mix-blend-overlay" />

      {/* Category Text */}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 border border-white/10 text-[8px] font-mono uppercase tracking-widest text-white">
        IMG_GEN // {category}
      </div>
    </div>
  );
}
