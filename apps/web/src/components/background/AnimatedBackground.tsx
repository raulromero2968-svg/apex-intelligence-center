'use client';

import { usePathname } from 'next/navigation';
import { GridPattern } from './GridPattern';
import { MatrixRiver } from './MatrixRiver';
import { Starfield } from './Starfield';
import { NeonSquares } from './NeonSquares';
import { AuroraBorealis } from './AuroraBorealis';

export const AnimatedBackground = () => {
  const pathname = usePathname() ?? '';

  // Hide on homepage - it has its own standalone background
  if (pathname === '/') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Layer 1: Aurora (deepest) */}
      <AuroraBorealis />
      
      {/* Layer 2: Grid */}
      <GridPattern />
      
      {/* Layer 3: Starfield */}
      <Starfield />
      
      {/* Layer 4: Matrix River */}
      <MatrixRiver />
      
      {/* Layer 5: Neon Squares (front) */}
      <NeonSquares />
    </div>
  );
};
