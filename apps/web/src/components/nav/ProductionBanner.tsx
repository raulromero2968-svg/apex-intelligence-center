'use client';

import { usePathname } from 'next/navigation';

export const ProductionBanner = () => {
  const pathname = usePathname() ?? '';

  // Hide ProductionBanner on homepage - it has its own standalone layout
  if (pathname === '/') {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-cyan-500/10 backdrop-blur border-b border-cyan-500/40 text-center text-[10px] sm:text-xs md:text-sm text-cyan-300 font-semibold tracking-wide py-2 shadow-lg">
      PRODUCTION EQUILIBRIUM ACHIEVED – NOVEMBER 19 2025
    </div>
  );
};
