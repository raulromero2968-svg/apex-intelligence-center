'use client';

import { GridPattern } from './GridPattern';
import { MatrixRiver } from './MatrixRiver';
import { Starfield } from './Starfield';
import { NeonSquares } from './NeonSquares';
import { AuroraBorealis } from './AuroraBorealis';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <GridPattern />
      <Starfield />
      <AuroraBorealis />
      <NeonSquares />
      <MatrixRiver />
    </div>
  );
};
