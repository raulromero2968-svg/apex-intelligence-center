'use client';

import { usePathname } from 'next/navigation';

export const LayoutFooter = () => {
  const pathname = usePathname() ?? '';

  // Hide footer on homepage - it has its own standalone layout
  if (pathname === '/') {
    return null;
  }

  return (
    <footer className="w-full border-t border-cyan-500/30 bg-black/80 text-[10px] sm:text-xs text-cyan-300/80 py-3 px-4 text-center shadow-[0_0_25px_rgba(8,145,178,0.35)] backdrop-blur">
      Production Equilibrium Achieved November 19 2025 | Guarded by 6 Unbreakable Laws | Commit af4f277
    </footer>
  );
};
