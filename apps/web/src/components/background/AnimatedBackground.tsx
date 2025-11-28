'use client';

import { GridPattern } from './GridPattern';
import { Starfield } from './Starfield';

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Dark navy base - handled by body background in globals.css */}
      
      {/* Layer 1: Starfield (subtle, in background) */}
      <Starfield />
      
      {/* Layer 2: Cyan Grid Pattern (main visual element) */}
      <GridPattern />
    </div>
  );
};
