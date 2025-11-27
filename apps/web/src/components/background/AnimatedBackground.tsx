'use client';

import { GridPattern } from './GridPattern';
import { MatrixRiver } from './MatrixRiver';
import { Starfield } from './Starfield';
import { NeonSquares } from './NeonSquares';
import { AuroraBorealis } from './AuroraBorealis';

export const AnimatedBackground = () => {
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

